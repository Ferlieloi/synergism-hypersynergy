/*
    The Steam loader's window for the website: its real page (synergism_modloader/renderer/index.html) in headless
    Chrome, with a fake window.loader in place of Electron's preload. Step 2 (Choose build) on the players' default,
    Live and master: made-up typical paths (user "Player", Steam's default folder), the real channels and URL rules,
    the newest suffix-free tags from git in the build list. No network.
    Writes local/harness-out/screenshots/steam-loader@2x.png.
*/
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { pathToFileURL } = require('node:url')
const { launchChrome } = require('../../harness/lib/chrome.cjs')
const { connectCdp, sleep } = require('../../harness/lib/cdp.cjs')
const { outDir, paths } = require('../../harness/lib/env.cjs')

const LOADER = path.join(paths.repo, 'synergism_modloader')
// The window's default content size (main.js: 880x680 with its title bar)
const WIDTH = 880, HEIGHT = 650, PORT = 9369

function stubScript() {
    const { listChannels } = require(path.join(LOADER, 'lib/config.js'))
    const { buildModUrl, buildPatcherUrl } = require(path.join(LOADER, 'lib/patchGame.js'))
    const git = args => execFileSync('git', ['-C', paths.repo, ...args], { encoding: 'utf8' }).trim()
    const tags = git(['for-each-ref', '--sort=-creatordate', '--format=%(refname:short) %(creatordate:iso-strict)', 'refs/tags'])
        .split('\n').map(l => l.split(' ')).filter(([n]) => /^v\d+\.\d+\.\d+[a-z]?$/.test(n)).slice(0, 6)
    const refs = [{ name: 'master', type: 'branch', date: git(['log', '-1', '--format=%cI', 'HEAD']) },
        ...tags.map(([name, date]) => ({ name, type: 'tag', date }))]
    const channels = listChannels()
    const urls = {}
    for (const ch of channels) for (const r of refs) {
        urls[`mod ${ch.id} ${r.name}`] = buildModUrl(ch.id, r.name).replace(/\?t=\d+$/, '')
        urls[`patcher ${ch.id} ${r.name}`] = buildPatcherUrl(ch.id, r.name)
    }
    const data = {
        steamPath: 'C:\\Program Files (x86)\\Steam',
        gameDir: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Synergism',
        sevenZip: 'C:\\Users\\Player\\AppData\\Local\\Programs\\Hypersynergism Loader\\resources\\7zip-bin\\7za.exe',
        version: JSON.parse(fs.readFileSync(path.join(LOADER, 'package.json'), 'utf8')).version,
        refs, channels, urls,
    }
    return `(() => {
        const data = ${JSON.stringify(data)};
        const config = { steamPath: data.steamPath, gameDir: data.gameDir, sevenZipPath: data.sevenZip, lastPatchedExe: '',
            channel: 'live', modRef: 'master', refListCache: { live: data.refs } };
        window.loader = {
            reportStartupError: async () => {}, loadConfig: async () => ({ ...config }), saveConfig: async p => { Object.assign(config, p); },
            cleanupLegacyWorkspaces: async () => ({ ok: true, removed: [] }),
            getLauncherUpdateStatus: async () => ({ phase: 'up-to-date', currentVersion: data.version }), checkLauncherUpdate: async () => {},
            installLauncherUpdate: async () => ({ ok: true }), onLauncherUpdate: () => () => {},
            autodetectSteam: async () => ({ steamPath: data.steamPath, gameDir: data.gameDir }), locateGame: async () => ({ gameDir: data.gameDir }),
            selectSteamFolder: async () => null, autodetect7z: async () => data.sevenZip, select7z: async () => null,
            getChannels: async () => data.channels,
            getModRefs: async () => ({ refs: data.refs, branchCount: 1, tagCount: data.refs.length - 1, defaultRef: 'master', datesIncomplete: false, error: null }),
            resolveModUrl: async (c, r) => data.urls['mod ' + c + ' ' + r] ?? '', resolvePatcherUrl: async (c, r) => data.urls['patcher ' + c + ' ' + r] ?? '',
            runPatch: async () => ({ ok: false, error: 'not in a screenshot' }), checkUpdateNeeded: async () => ({ needsRepatch: false }),
            checkPatcherChanged: async () => ({ needsRepatch: false }), checkVersionMismatch: async () => ({ mismatch: false }),
            quickSwitchMod: async () => ({ ok: false }), launchGame: async () => ({ ok: false }),
            openPath: async () => {}, openExternal: async () => {}, copyText: async () => {}, onPatchLog: () => () => {},
        };
    })();`
}

async function shootSteamLoader() {
    const chrome = await launchChrome({ port: PORT, profile: outDir('profiles', 'screenshots-loader'), width: WIDTH, height: HEIGHT, fresh: true, args: ['--lang=en-US', '--hide-scrollbars'] })
    try {
        const c = await connectCdp(PORT)
        await c.send('Emulation.setLocaleOverride', { locale: 'en-US' })
        await c.send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: 2, mobile: false })
        await c.send('Page.addScriptToEvaluateOnNewDocument', { source: stubScript() })
        await c.navigate(pathToFileURL(path.join(LOADER, 'renderer', 'index.html')).href)
        await sleep(1500)
        const errors = c.logs.filter(l => /EXCEPTION|error/i.test(l))
        if (errors.length) throw new Error('loader page errors:\n' + errors.join('\n'))
        await c.evaluate(`document.getElementById('toStep2Btn').click()`)
        await sleep(800)
        const shot = await c.send('Page.captureScreenshot', { format: 'png' })
        const file = path.join(outDir('screenshots'), 'steam-loader@2x.png')
        fs.writeFileSync(file, Buffer.from(shot.result.data, 'base64'))
        console.log(`  steam-loader: ${path.relative(process.cwd(), file)}`)
        c.close()
    } finally {
        chrome.kill()
    }
}

module.exports = { shootSteamLoader }
