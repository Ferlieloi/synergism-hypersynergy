const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const { EventEmitter } = require('node:events')

function loadMain() {
    const handlers = new Map()
    const app = new EventEmitter()
    let quits = 0
    let completeDetection
    let cleanedGameDir
    Object.assign(app, {
        whenReady: () => Promise.resolve(),
        getVersion: () => 'test',
        getGPUFeatureStatus: () => ({}),
        quit: () => { quits++ }
    })
    class BrowserWindow extends EventEmitter {
        constructor() { super(); this.webContents = { send: () => {} } }
        setMenuBarVisibility() {}
        loadFile() { return Promise.resolve() }
    }
    const modules = {
        electron: { app, BrowserWindow, ipcMain: { handle: (name, handler) => handlers.set(name, handler) } },
        path,
        fs: { existsSync: () => false },
        'electron-updater': { autoUpdater: {} },
        './lib/startupDiagnostics': { createStartupDiagnostics: () => ({ log() {}, report() {}, watchWindow() {} }) },
        './lib/config': {
            loadConfig: () => ({}),
            DEFAULTS: { exeName: 'game.exe', steamAppName: 'Synergism' }
        },
        './lib/steamLocator': {
            detectSteamPathWindows: () => new Promise(resolve => { completeDetection = resolve }),
            findGameDir: steamPath => { assert.equal(steamPath, '/steam'); return '/game' },
            getBundledSevenZipPath: () => null,
            detectSevenZip: async () => '/7zip/7z.exe'
        },
        './lib/launcherUpdater': { createLauncherUpdater: () => ({}) },
        './lib/workspaceManager': {
            cleanupOldWorkspaces: async gameDir => { cleanedGameDir = gameDir; return { removed: 1 } }
        },
        './lib/patchGame': {}, './lib/modRefs': {}, './lib/modRefCache': {}, './lib/gameLauncher': {}
    }
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', 'main.js'), 'utf-8'), {
        require: name => {
            assert.ok(Object.hasOwn(modules, name), `Unexpected require: ${name}`)
            return modules[name]
        },
        __dirname: path.join(__dirname, '..'),
        process,
        setTimeout: () => {}
    })
    return { app, handlers, finishDetection: value => completeDetection(value), quits: () => quits, cleanedGameDir: () => cleanedGameDir }
}

test('closing the launcher quits while startup registry detection is still pending', async () => {
    const main = loadMain()
    const loading = main.handlers.get('config:load')()
    await new Promise(resolve => setImmediate(resolve))
    main.app.emit('window-all-closed')
    assert.equal(main.quits(), 1)
    main.finishDetection('/steam')
    const config = await loading
    assert.equal(config.steamPath, '/steam')
    assert.equal(config.gameDir, '/game')
    assert.equal(config.sevenZipPath, '/7zip/7z.exe')
})

test('legacy cleanup waits for asynchronous detection and receives the resolved game directory', async () => {
    const main = loadMain()
    const cleanup = main.handlers.get('legacy:cleanup')()
    assert.equal(main.cleanedGameDir(), undefined)
    main.finishDetection('/steam')
    const result = await cleanup
    assert.equal(main.cleanedGameDir(), '/game')
    assert.equal(result.removed, 1)
})

test('manual Steam and 7-Zip IPC detection returns paths instead of promises inside the result', async () => {
    const main = loadMain()
    const detection = main.handlers.get('steam:autodetect')()
    main.finishDetection('/steam')
    const result = await detection
    assert.equal(result.steamPath, '/steam')
    assert.equal(result.gameDir, '/game')
    assert.equal(await main.handlers.get('sevenzip:autodetect')(), '/7zip/7z.exe')
})
