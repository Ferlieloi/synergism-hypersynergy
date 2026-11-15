/*
    Takes the website's screenshots and puts them in docs/res/ as WebP (docs/dev/publishing-guide.md, "Images").

    npm run screenshots -- <backup.json> [name ...]
    node scripts/tools/screenshots/take.cjs <backup.json> [name ...]

    <backup.json>: an HS backup (mod panel > Backup) of a save at S216+ with hepteracts and the GQ shop unlocked.
    Check the images show no player name or ID before committing them. Names: images.cjs (all by default; the
    steam-loader one needs no backup: `take.cjs - steam-loader`). The game shots load the save once and run in
    game-shots.cjs's order: about 3 minutes with the heat and the Auto-Sing run.
    Needs `npm run build` (the dev build) and `node scripts/tools/update-game.cjs` (the game). Raw shots stay in
    local/harness-out/screenshots/. To adjust one shot: game-session.cjs + run-shot.cjs.
*/
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const { outDir, paths } = require('../../harness/lib/env.cjs')
const IMAGES = require('./images.cjs')
const { SHOTS, NEEDS } = require('./game-shots.cjs')

const [backupPath, ...wanted] = process.argv.slice(2)
if (!backupPath) {
    console.error('Usage: npm run screenshots -- <backup.json> [name ...]\nNames: ' + Object.keys(IMAGES).join(', '))
    process.exit(1)
}
const names = wanted.length ? wanted : Object.keys(IMAGES)
const unknown = names.filter(n => !IMAGES[n])
if (unknown.length) {
    console.error('Unknown: ' + unknown.join(', ') + '\nNames: ' + Object.keys(IMAGES).join(', '))
    process.exit(1)
}

;(async () => {
    // A shot's prerequisites run too (only the names asked for are converted)
    const run = new Set(names.flatMap(n => [...(NEEDS[n] ?? []), n]))
    const gameShots = Object.keys(SHOTS).filter(n => run.has(n))
    if (gameShots.length) {
        const { startSession } = require('./game-session.cjs')
        console.log('Loading the game, the save and the mod...')
        const session = await startSession(path.resolve(backupPath))
        try {
            for (const name of gameShots) {
                const t0 = Date.now()
                await SHOTS[name](session.cdp)
                console.log(`  (${((Date.now() - t0) / 1000).toFixed(1)} s)`)
            }
        } finally {
            session.cdp.close()
            session.stop()
        }
    }
    if (names.includes('steam-loader')) await require('./loader-shot.cjs').shootSteamLoader()

    console.log('Converting to WebP...')
    for (const name of names) {
        const { to, marked, crop, shown } = IMAGES[name]
        for (const [file, dest] of [[name, to], [`${name}-marked`, marked]]) {
            if (!dest) continue
            const args = [path.join(paths.repo, 'scripts/tools/prepare-image.cjs'), path.join(outDir('screenshots'), `${file}@2x.png`),
                path.join(paths.repo, 'docs/res', `${dest}@2x.webp`)]
            if (crop) args.push('--crop', crop.join(','))
            if (shown) args.push('--width', String(shown * 2))
            execFileSync(process.execPath, args, { stdio: 'inherit' })
        }
    }
    process.exit(0)
})().catch(e => { console.error(e.stack || e); process.exit(1) })
