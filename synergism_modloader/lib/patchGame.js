const fs = require('fs')
const path = require('path')
const { execFile } = require('child_process')
const asar = require('@electron/asar')
const { buildInjectorCode } = require('./injectorTemplate')
const { createPackageAndWait } = require('./archiveWriter')
const { DEFAULTS, resolveChannel } = require('./config')
const {
    ensureNoRunningWorkGames,
    prepareWorkspace,
    promoteWorkspace,
    discardExtractionInputs,
    cleanupOldWorkspaces,
    removeBestEffort
} = require('./workspaceManager')

function run(cmd, args, onLog) {
    return new Promise((resolve, reject) => {
        onLog?.(`$ ${cmd} ${args.join(' ')}`)
        execFile(cmd, args, { maxBuffer: 1024 * 1024 * 64 }, (err, stdout, stderr) => {
            if (stdout) onLog?.(stdout.trim())
            if (stderr) onLog?.(stderr.trim())
            if (err) return reject(err)
            resolve()
        })
    })
}

async function fetchText(url, onLog) {
    onLog?.(`Fetching ${url}`)
    const res = await fetch(url)
    if (!res.ok) throw new Error(`Request failed (${res.status}) for ${url}`)
    return res.text()
}

// Electron treats .asar files as virtual folders and can keep the game archive
// open until the launcher exits. Access it as a normal file while patching.
async function withRawArchiveAccess(action) {
    const previous = process.noAsar
    process.noAsar = true
    try {
        return await action()
    } finally {
        process.noAsar = previous
    }
}

// Picks the most likely launchable exe inside the extracted, patched app dir.
// electron-builder NSIS payloads put the runtime exe at the root of the
// extracted folder, named after productName.
function findLaunchableExe(extractedAppDir) {
    const entries = fs.readdirSync(extractedAppDir, { withFileTypes: true })
    const exeCandidates = entries
        .filter(e => e.isFile() && e.name.toLowerCase().endsWith('.exe'))
        .map(e => e.name)
        .filter(name => !/^uninstall/i.test(name))

    if (exeCandidates.length === 0) return null
    // Prefer an exe that is NOT a generic electron.exe leftover, if multiple exist
    const preferred = exeCandidates.find(n => !/^electron\.exe$/i.test(n))
    return path.join(extractedAppDir, preferred ?? exeCandidates[0])
}

/**
 * Runs the full extract → patch → repack pipeline.
 *
 * @param {object} opts
 * @param {string} opts.gameDir        Steam install dir for the game (contains the original exe)
 * @param {string} opts.exeName        Name of the original game exe inside gameDir
 * @param {string} opts.sevenZipPath   Full path to 7z.exe (needs NSIS support)
 * @param {string} opts.modUrl         Resolved URL for the mod script to inject
 * @param {string} [opts.patcherUrl]   Optional remote URL for patcher.js; falls back to the bundled copy
 * @param {(line: string) => void} [opts.onLog]
 * @returns {Promise<{ launchExePath: string, sourceStat: { size: number, mtimeMs: number } }>}
 */
async function patchGame(opts) {
    const { gameDir, exeName, sevenZipPath, modUrl, patcherUrl, onLog } = opts
    const log = (msg) => onLog?.(msg)

    const exePath = path.join(gameDir, exeName)
    if (!fs.existsSync(exePath)) {
        throw new Error(`Game exe not found at: ${exePath}`)
    }
    if (!sevenZipPath || !fs.existsSync(sevenZipPath)) {
        throw new Error('7-Zip (7z.exe, full version) not found. Install it from https://www.7-zip.org/ or point the loader at it manually.')
    }

    const sourceStat = fs.statSync(exePath)

    // Build in a fixed staging folder, then swap it into place only after
    // patching succeeds. Repeated failures cannot accumulate numbered copies.
    await ensureNoRunningWorkGames(gameDir)
    const dirs = prepareWorkspace(gameDir)
    const workDir = dirs.staging
    const pluginDir = path.join(workDir, '$PLUGINSDIR')
    const app7zPath = path.join(pluginDir, 'app-64.7z')
    const extractedAppDir = path.join(workDir, 'app')
    const asarPath = path.join(extractedAppDir, 'resources', 'app.asar')
    const extractAsarDir = path.join(workDir, 'asar')
    const preloadPath = path.join(extractAsarDir, 'electron', 'preload.js')

    log('Starting full patch process')

    try {
        // 1. Extract the NSIS-packaged exe
        log('Extracting game exe...')
        await run(sevenZipPath, ['x', exePath, `-o${workDir}`, '-y'], log)
        if (!fs.existsSync(app7zPath)) {
            throw new Error('app-64.7z not found after exe extraction — installer layout may have changed')
        }

        // 2. Extract the embedded app archive
        log('Extracting app-64.7z...')
        await run(sevenZipPath, ['x', app7zPath, `-o${extractedAppDir}`, '-y'], log)
        // 3. Extract app.asar as a real file, without Electron holding it open.
        log('Extracting app.asar...')
        await withRawArchiveAccess(async () => {
            if (!fs.existsSync(asarPath)) {
                throw new Error('app.asar not found — installer layout may have changed')
            }
            await asar.extractAll(asarPath, extractAsarDir)
        })

        const outJsPath = path.join(extractAsarDir, 'dist', 'dist', 'out.js')
        if (!fs.existsSync(outJsPath)) {
            throw new Error(`out.js not found at: ${outJsPath}`)
        }

        // 4. Get the bundle patcher — prefer a fresh remote copy, fall back to the bundled one.
        // Most refs (especially older ones, and most of the "live" channel's history)
        // won't have a shared patcher.js at all, since this is a new addition to the
        // mod repo — that's expected and not an error, it just means we use the copy
        // shipped with the loader.
        log('Loading bundle patcher...')
        let patcherCode
        try {
            if (!patcherUrl) throw new Error('no patcherUrl provided')
            const fetched = await fetchText(patcherUrl, log)
            if (!fetched.includes('module.exports')) {
                throw new Error('fetched content doesn\'t look like patcher.js (no module.exports found)')
            }
            patcherCode = fetched
        } catch (e) {
            log(`patcher.js not available at that ref — falling back to the bundled copy (${e.message})`)
            patcherCode = fs.readFileSync(path.join(__dirname, 'patcher.js'), 'utf-8')
        }

        log('Patching out.js...')
        const moduleShim = { exports: {} }
        const fn = new Function('module', 'exports', patcherCode + '\nreturn module.exports')
        const patcher = fn(moduleShim, moduleShim.exports)
        const patchBundle = typeof patcher === 'function' ? patcher : patcher.patchBundle
        if (typeof patchBundle !== 'function') throw new Error('patcher.js did not export patchBundle')

        const original = fs.readFileSync(outJsPath, 'utf-8')
        const patched = patchBundle(original, { steam: true })
        fs.writeFileSync(outJsPath, patched)
        log('out.js patched successfully')

        // 5. Append the mod injector to preload.js
        if (!fs.existsSync(preloadPath)) {
            throw new Error('preload.js not found inside extracted asar')
        }
        let preloadContent = fs.readFileSync(preloadPath, 'utf-8')
        if (!preloadContent.includes('HYPERSYNERGISM INJECTOR')) {
            preloadContent += buildInjectorCode(modUrl)
            fs.writeFileSync(preloadPath, preloadContent)
            log('Injector appended to preload.js')
        } else {
            log('preload.js already patched, skipping')
        }

        // 6. Repack app.asar
        log('Repacking app.asar...')
        await withRawArchiveAccess(() => createPackageAndWait(asar, extractAsarDir, asarPath))

        // 7. Locate the exe to launch
        const launchExePath = findLaunchableExe(extractedAppDir)
        if (!launchExePath) {
            throw new Error('Patch finished, but no launchable .exe was found in the extracted app folder')
        }

        discardExtractionInputs(dirs.staging)
        // A game launched while extraction was running would still lock the
        // current copy. Check again before replacing it.
        await ensureNoRunningWorkGames(gameDir)
        await promoteWorkspace(dirs, log)
        removeBestEffort(dirs.previous, log)
        await cleanupOldWorkspaces(gameDir, log)
        const installedExePath = path.join(dirs.active, 'app', path.basename(launchExePath))
        log(`Patch complete — launch exe: ${installedExePath}`)
        return { launchExePath: installedExePath, sourceStat: { size: sourceStat.size, mtimeMs: sourceStat.mtimeMs } }
    } finally {
        if (fs.existsSync(dirs.staging)) removeBestEffort(dirs.staging, log)
    }
}

function buildModUrl(channelId, ref) {
    const ch = resolveChannel(channelId)
    const r = ref || ch.defaultRef
    return `https://cdn.jsdelivr.net/gh/${ch.repo}@${r}/${DEFAULTS.modReleasePath}`
}

function buildPatcherUrl(channelId, ref) {
    const ch = resolveChannel(channelId)
    const r = ref || ch.defaultRef
    return `https://cdn.jsdelivr.net/gh/${ch.repo}@${r}/${DEFAULTS.patcherPath}`
}

module.exports = { patchGame, findLaunchableExe, buildModUrl, buildPatcherUrl, withRawArchiveAccess }
