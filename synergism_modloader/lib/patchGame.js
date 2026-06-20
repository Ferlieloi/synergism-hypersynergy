const fs = require('fs')
const path = require('path')
const { execFile } = require('child_process')
const asar = require('@electron/asar')
const { buildInjectorCode } = require('./injectorTemplate')
const { DEFAULTS, resolveChannel } = require('./config')

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

// Removes a previous run's work folder. On Windows this can intermittently
// fail with ENOTEMPTY/EBUSY/EPERM if something inside it is still held open —
// most commonly because the previously-patched game is still running (it
// keeps app.asar / files under resources/ locked), or an antivirus scan is
// mid-read. fs.rmSync's maxRetries/retryDelay options handle short-lived
// locks; if the lock is held for longer (e.g. the game is still open), we
// fall back to renaming the stale folder out of the way — Windows allows
// renaming a directory even while a file inside it is open, so this doesn't
// require the lock to clear — and best-effort delete it afterwards instead
// of failing the whole patch over a folder we no longer need.
// Best-effort removal of a folder we no longer need. Never throws — if it's
// still locked (AV scan, stubborn handle, etc.) we just leave it for next
// time. This is intentionally NOT in the critical path of the current patch.
function removeBestEffort(dir, log) {
    try {
        fs.rmSync(dir, { recursive: true, force: true })
    } catch (e) {
        log?.(`WARNING: (leftover folder "${path.basename(dir)}" is still locked — leaving it for now, it'll be cleaned up on a future patch once it's free: ${e.message}), you can also manually delete it if you want (restart of your computer may be required)`)
    }
}

// Finds every old work folder this loader has left behind (current and past
// naming schemes all start with "__hs_work") and tries to clear each one out.
// This NEVER blocks or throws: if an old folder is still locked by something,
// we simply skip it and move on. The CURRENT run always gets its own
// brand-new, uniquely-named folder regardless, so a stuck lock on an old
// leftover can never prevent patching again.
async function cleanupStaleWorkDirs(gameDir, log) {
    let entries
    try {
        entries = fs.readdirSync(gameDir, { withFileTypes: true })
    } catch {
        return
    }
    const staleDirs = entries
        .filter(e => e.isDirectory() && e.name.startsWith('__hs_work'))
        .map(e => path.join(gameDir, e.name))

    if (!staleDirs.length) return

    log?.(`Found ${staleDirs.length} old work folder(s) from previous runs — clearing what's free...`)
    for (const dir of staleDirs) {
        await killLeftoverProcessesUnder(dir, log)
        removeBestEffort(dir, log)
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

    const workDir = path.join(gameDir, `__hs_work_${Date.now()}_${Math.floor(Math.random() * 1e6)}`)
    const pluginDir = path.join(workDir, '$PLUGINSDIR')
    const app7zPath = path.join(pluginDir, 'app-64.7z')
    const extractedAppDir = path.join(workDir, 'app')
    const asarPath = path.join(extractedAppDir, 'resources', 'app.asar')
    const extractAsarDir = path.join(workDir, 'asar')
    const preloadPath = path.join(extractAsarDir, 'electron', 'preload.js')

    log('Starting full patch process')

    // If a previous launch left a background helper process running (common
    // with Electron apps even after the window is closed), stop it now so
    // it can't hold the work folder locked.
    log('Checking for a still-running previous instance...')
    await killLeftoverProcessesUnder(workDir, log)

    // Clean previous work (tolerant of locked leftovers from a prior run)
    await cleanupStaleWorkDirs(gameDir, log)
    fs.mkdirSync(workDir, { recursive: true })

    // 1. Extract the NSIS-packaged exe
    log('Extracting game exe...')
    await run(sevenZipPath, ['x', exePath, `-o${workDir}`, '-y'], log)
    if (!fs.existsSync(app7zPath)) {
        throw new Error('app-64.7z not found after exe extraction — installer layout may have changed')
    }

    // 2. Extract the embedded app archive
    log('Extracting app-64.7z...')
    await run(sevenZipPath, ['x', app7zPath, `-o${extractedAppDir}`, '-y'], log)
    if (!fs.existsSync(asarPath)) {
        throw new Error('app.asar not found — installer layout may have changed')
    }

    // 3. Extract app.asar
    log('Extracting app.asar...')
    await asar.extractAll(asarPath, extractAsarDir)

    const outJsPath = path.join(extractAsarDir, 'dist', 'dist', 'out.js')
    if (!fs.existsSync(outJsPath)) {
        throw new Error(`out.js not found at: ${outJsPath}`)
    }

    // 4. Get the bundle patcher — prefer a fresh remote copy, fall back to the bundled one.
    // Most refs (especially older ones, and most of the "live" channel's history)
    // won't have electron_app/patcher.js at all, since this is a new addition to the
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
    const patchBundle = fn(moduleShim, moduleShim.exports)

    const original = fs.readFileSync(outJsPath, 'utf-8')
    const patched = patchBundle(original)
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
    await asar.createPackage(extractAsarDir, asarPath)

    // 7. Locate the exe to launch
    const launchExePath = findLaunchableExe(extractedAppDir)
    if (!launchExePath) {
        throw new Error('Patch finished, but no launchable .exe was found in the extracted app folder')
    }

    log(`Patch complete — launch exe: ${launchExePath}`)
    return { launchExePath, sourceStat: { size: sourceStat.size, mtimeMs: sourceStat.mtimeMs } }
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

function killLeftoverProcessesUnder(dirPath, log) {
    if (process.platform !== 'win32') return Promise.resolve()
    return new Promise((resolve) => {
        const escaped = dirPath.replace(/'/g, "''")
        const psCmd =
            `$p = Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -and $_.ExecutablePath.StartsWith('${escaped}', 'OrdinalIgnoreCase') }; ` +
            `$p | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }; ` +
            `$p.Count`
        execFile('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', psCmd], { windowsHide: true }, (err, stdout) => {
            if (err) {
                log?.(`(couldn't check for a still-running previous instance: ${err.message})`)
            } else {
                const count = parseInt((stdout || '0').trim(), 10) || 0
                if (count > 0) log?.(`Stopped ${count} leftover process(es) from the previous launch.`)
            }
            resolve()
        })
    })
}
/**
 * Quick-switch: updates just the sidecar config file next to the game exe,
 * so the next launch uses a different mod URL without a full repatch.
 * NOTE: this does NOT re-apply out.js patches — if the new mod version needs
 * different game hooks, a full re-patch is required instead.
 *
 * @param {string} lastPatchedExe - path to the patched game exe
 * @param {string} modUrl - the new mod URL to write
 */
function updateModUrl(lastPatchedExe, modUrl) {
    const sidecarPath = path.join(path.dirname(lastPatchedExe), MOD_CONFIG_FILENAME)
    fs.writeFileSync(sidecarPath, JSON.stringify({ modUrl }, null, 2), 'utf-8')
}

module.exports = { patchGame, findLaunchableExe, buildModUrl, buildPatcherUrl, updateModUrl }
