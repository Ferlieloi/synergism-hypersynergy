const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const { spawn } = require('child_process')

const { loadConfig, saveConfig, DEFAULTS, resolveChannel, listChannels } = require('./lib/config')
const { detectSteamPathWindows, findGameDir, detectSevenZip, getBundledSevenZipPath } = require('./lib/steamLocator')
const { patchGame, buildModUrl, buildPatcherUrl } = require('./lib/patchGame')

let mainWindow

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 880,
        height: 680,
        minWidth: 720,
        minHeight: 560,
        title: 'Hypersynergism Loader',
        backgroundColor: '#14131a',
        icon: path.join(__dirname, 'assets', 'favicon.ico'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false
        }
    })
    mainWindow.setMenuBarVisibility(false)
    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'))
}

app.whenReady().then(createWindow)
app.on('window-all-closed', () => app.quit())

function sendLog(line) {
    mainWindow?.webContents.send('patch:log', line)
}

// ─── Config ─────────────────────────────────────────────────────────────
ipcMain.handle('config:load', () => {
    const cfg = loadConfig(app)
    if (!cfg.sevenZipPath || !fs.existsSync(cfg.sevenZipPath)) {
        const bundled = getBundledSevenZipPath(app)
        if (bundled) cfg.sevenZipPath = bundled
    }
    return cfg
})
ipcMain.handle('config:save', (_e, partial) => {
    const current = loadConfig(app)
    const next = { ...current, ...partial }
    saveConfig(app, next)
    return next
})

// ─── Steam / game / 7-Zip detection ─────────────────────────────────────
ipcMain.handle('steam:autodetect', () => {
    const steamPath = detectSteamPathWindows()
    const gameDir = steamPath ? findGameDir(steamPath, DEFAULTS.steamAppName) : null
    return { steamPath, gameDir }
})

ipcMain.handle('steam:locate-game', (_e, steamPath) => {
    return { gameDir: findGameDir(steamPath, DEFAULTS.steamAppName) }
})

ipcMain.handle('dialog:select-steam-folder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Select your Steam install folder',
        properties: ['openDirectory']
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
})

ipcMain.handle('dialog:select-7z', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Select 7z.exe',
        properties: ['openFile'],
        filters: [{ name: '7z.exe', extensions: ['exe'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
})

ipcMain.handle('sevenzip:autodetect', () => getBundledSevenZipPath(app) || detectSevenZip())

// ─── Mod source: branches/tags from GitHub ──────────────────────────────
async function fetchGithubRefs(repo, kind) {
    const res = await fetch(`https://api.github.com/repos/${repo}/${kind}?per_page=50`, {
        headers: { 'User-Agent': 'hypersynergism-loader', 'Accept': 'application/vnd.github+json' }
    })
    if (!res.ok) throw new Error(`GitHub API request failed (${res.status})`)
    const json = await res.json()
    return json.map(r => r.name)
}

// ─── Mod channels (dev/live), each its own repo ─────────────────────────
ipcMain.handle('channels:list', () => listChannels())

ipcMain.handle('mod:get-refs', async (_e, channelId) => {
    const ch = resolveChannel(channelId)
    try {
        const [branches, tags] = await Promise.all([
            fetchGithubRefs(ch.repo, 'branches'),
            fetchGithubRefs(ch.repo, 'tags')
        ])
        return { branches, tags, defaultRef: ch.defaultRef, error: null }
    } catch (e) {
        return { branches: [ch.defaultRef], tags: [], defaultRef: ch.defaultRef, error: e.message }
    }
})

ipcMain.handle('mod:resolve-url', (_e, channelId, ref) => buildModUrl(channelId, ref))
ipcMain.handle('patcher:resolve-url', (_e, channelId, ref) => buildPatcherUrl(channelId, ref))

// ─── Patch + launch ──────────────────────────────────────────────────────
ipcMain.handle('patch:run', async (_e, { gameDir, sevenZipPath, channel, modRef }) => {
    try {
        const { launchExePath, sourceStat } = await patchGame({
            gameDir,
            exeName: DEFAULTS.exeName,
            sevenZipPath,
            modUrl: buildModUrl(channel, modRef),
            patcherUrl: buildPatcherUrl(channel, modRef),
            onLog: sendLog
        })

        const cfg = loadConfig(app)
        saveConfig(app, {
            ...cfg,
            gameDir,
            sevenZipPath,
            channel,
            modRef,
            lastPatchedExe: launchExePath,
            lastPatchedSourceStat: sourceStat,
            lastPatchedChannel: channel,
            lastPatchedModRef: modRef
        })

        return { ok: true, launchExePath }
    } catch (e) {
        sendLog(`ERROR: ${e.message}`)
        return { ok: false, error: e.message }
    }
})

ipcMain.handle('game:check-update-needed', (_e, { gameDir, exeName }) => {
    const cfg = loadConfig(app)
    const exePath = path.join(gameDir, exeName)
    if (!cfg.lastPatchedSourceStat || !fs.existsSync(exePath)) return { needsRepatch: true }
    const stat = fs.statSync(exePath)
    const changed = stat.size !== cfg.lastPatchedSourceStat.size || stat.mtimeMs !== cfg.lastPatchedSourceStat.mtimeMs
    return { needsRepatch: changed }
})

ipcMain.handle('mod:quick-switch', (_e, { modUrl, channel, modRef }) => {
    const cfg = loadConfig(app)
    if (!cfg.lastPatchedExe || !fs.existsSync(cfg.lastPatchedExe)) {
        return { ok: false, error: 'No patched game found — run the full patch first.' }
    }
    try {
        saveConfig(app, { ...cfg, lastPatchedChannel: channel, lastPatchedModRef: modRef })
        return { ok: true }
    } catch (e) {
        return { ok: false, error: e.message }
    }
})

ipcMain.handle('mod:check-version-mismatch', (_e, { channel, modRef }) => {
    const cfg = loadConfig(app)
    if (!cfg.lastPatchedExe) return { mismatch: false }
    const mismatch = cfg.lastPatchedChannel !== channel || cfg.lastPatchedModRef !== modRef
    return { mismatch, lastChannel: cfg.lastPatchedChannel, lastModRef: cfg.lastPatchedModRef }
})

ipcMain.handle('game:launch', (_e, exePath, modUrl) => {
    if (!exePath || !fs.existsSync(exePath)) {
        return { ok: false, error: 'Patched exe not found — run the patch step first.' }
    }
    try {
        const env = modUrl ? { ...process.env, HS_MOD_URL: modUrl } : process.env
        const child = spawn(exePath, [], { cwd: path.dirname(exePath), detached: true, stdio: 'ignore', env })
        child.unref()
        return { ok: true }
    } catch (e) {
        return { ok: false, error: e.message }
    }
})

ipcMain.handle('shell:open-path', (_e, target) => shell.openPath(target))
ipcMain.handle('shell:open-external', (_e, url) => shell.openExternal(url))
