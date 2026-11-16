/*
    The real game + an HS backup + the mod's dev build, headless, for the website's screenshots.

    node scripts/tools/screenshots/game-session.cjs <backup.json>
        loads, then stays up (stop it by the PIDs it prints) so run-shot.cjs can drive it: to adjust one shot
        without reloading. take.cjs uses startSession() and stops at the end.

    The account answers are built from the backup (scripts/harness/account-from-backup.cjs): the game shows "harness",
    nobody's name. A backup without PseudoCoin data gets none: never the developer's own local/account answers.
    Numbers in English (en-US); viewport 1600x1000 at deviceScaleFactor 2 (files named @2x).
*/
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')

const { outDir, paths } = require('../../harness/lib/env.cjs')
const REPO = paths.repo
// Read by interceptGameServer at each call: set on the shared object, whatever the require order
const ACCOUNT = path.join(REPO, 'local', 'harness-out', 'account', 'screenshots')
paths.accountDir = ACCOUNT

const { launchChrome } = require('../../harness/lib/chrome.cjs')
const { connectCdp, sleep } = require('../../harness/lib/cdp.cjs')
const game = require('../../harness/lib/game.cjs')
const { SESSION_SETTINGS, WIDTH, HEIGHT, SCALE } = require('./game-shots.cjs')

const PORT = 9368, HTTP = 8778

function buildAccount(backupPath) {
    fs.rmSync(ACCOUNT, { recursive: true, force: true })
    try {
        execFileSync(process.execPath, [path.join(REPO, 'scripts/harness/account-from-backup.cjs'), backupPath, 'screenshots'], { stdio: 'pipe' })
    } catch {
        console.log('No PseudoCoin data in this backup: the game runs without account answers (lower ambrosia speeds)')
        fs.mkdirSync(ACCOUNT, { recursive: true })
    }
}

async function startSession(backupPath) {
    if (!backupPath || !fs.existsSync(backupPath)) throw new Error('an HS backup (.json) is needed: ' + (backupPath || 'none given'))
    const backup = game.readSaveFile(backupPath)
    if (!backup.modData) throw new Error('not an HS backup (no modData): export one from the mod panel')
    buildAccount(backupPath)
    const out = outDir('screenshots')
    const server = game.startGameServer({ port: HTTP })
    const chrome = await launchChrome({ port: PORT, profile: outDir('profiles', 'screenshots'), width: WIDTH, height: HEIGHT, fresh: true, args: ['--lang=en-US'] })
    const stop = () => { chrome.kill(); server.close() }
    try {
        const cdp = await connectCdp(PORT)
        await game.interceptGameServer(cdp, server.origin)
        await cdp.send('Emulation.setLocaleOverride', { locale: 'en-US' })
        await cdp.send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: SCALE, mobile: false })
        await cdp.send('Browser.grantPermissions', { origin: server.origin, permissions: ['clipboardReadWrite', 'clipboardSanitizedWrite'] })
        await cdp.send('Emulation.setFocusEmulationEnabled', { enabled: true })
        await cdp.navigate(server.origin + '/')
        await cdp.waitFor(`!!document.getElementById('importfile')`)
        await game.restoreModData(cdp, backup, { settings: SESSION_SETTINGS, debugLogs: false })
        await sleep(2000)
        await game.importSave(cdp, backup.save, out)
        await game.waitGameReady(cdp, { until: `${game.PLAYER}?.singularityCount === ${backup.info.singularity}` })
        await sleep(3000)
        for (let i = 0; i < 10; i++) { if (!await game.answerDialog(cdp)) break; await sleep(300) }
        await game.injectMod(cdp)
        await cdp.waitFor(`!!document.getElementById('hs-setting-auto-sing-enabled')`, 60000)
        // The "loaded" notification covers the header for a few seconds
        await sleep(12000)
        return { cdp, stop, pids: { chrome: chrome.pid, node: process.pid } }
    } catch (e) {
        stop()
        throw e
    }
}

module.exports = { startSession, PORT }

if (require.main === module) {
    startSession(process.argv[2]).then(({ pids }) => {
        console.log(`ready on port ${PORT}: Chrome PID ${pids.chrome}, node PID ${pids.node}`)
        setInterval(() => { }, 1 << 30)
    }, e => { console.error(e.stack || e); process.exit(1) })
}
