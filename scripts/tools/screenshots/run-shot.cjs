/*
    Drives a running game-session.cjs, to adjust a shot without reloading the game (about 40 s).
    node scripts/tools/screenshots/run-shot.cjs <name ...>          runs those shots of game-shots.cjs
    node scripts/tools/screenshots/run-shot.cjs --eval "<expression>" [viewport.png]
                                                                    prints the expression's value, screenshots the viewport
    Then convert with take.cjs's step, or rerun take.cjs for that name.
*/
const fs = require('node:fs')
const path = require('node:path')
const { connectCdp } = require('../../harness/lib/cdp.cjs')
const { PORT } = require('./game-session.cjs')
const { SHOTS, WIDTH, HEIGHT, SCALE } = require('./game-shots.cjs')

;(async () => {
    const args = process.argv.slice(2)
    const c = await connectCdp(PORT)
    if (args[0] === '--eval') {
        const value = await c.evaluate(args[1])
        console.log(typeof value === 'string' ? value : JSON.stringify(value, null, 1))
        if (args[2]) {
            await c.send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: SCALE, mobile: false })
            const shot = await c.send('Page.captureScreenshot', { format: 'png' })
            fs.writeFileSync(path.resolve(args[2]), Buffer.from(shot.result.data, 'base64'))
        }
    } else {
        for (const name of args) {
            if (!SHOTS[name]) throw new Error(`unknown shot ${name}; known: ${Object.keys(SHOTS).join(', ')}`)
            await SHOTS[name](c)
        }
    }
    c.close()
    process.exit(0)
})().catch(e => { console.error(e.stack || e); process.exit(1) })
