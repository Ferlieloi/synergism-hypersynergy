/*
    Turns a screenshot into a website image (docs/res/…): crop, optional downscale, WebP (or PNG), through headless
    Chrome's canvas, so no image tool is needed.

    node scripts/tools/prepare-image.cjs <input> <output.webp|.png> [--crop x,y,w,h] [--width px] [--quality 0-1]

    --crop is in the input's pixels; --width scales the cropped image down to that many pixels (never up);
    --quality is WebP's (default 0.9). Name the output <name>@<n>x.webp when the screenshot was taken at n times the
    page's size (browser zoom × Windows scaling, e.g. @1.4x): the site then shows it at its real size
    (docs/dev/publishing-guide.md, "Images").
*/
const fs = require('node:fs')
const path = require('node:path')
const { launchChrome } = require('../harness/lib/chrome.cjs')
const { connectCdp } = require('../harness/lib/cdp.cjs')
const { outDir } = require('../harness/lib/env.cjs')

function fail(message) {
    console.error(message)
    process.exit(1)
}

const args = process.argv.slice(2)
const positional = []
const options = {}
for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) options[args[i].slice(2)] = args[++i]
    else positional.push(args[i])
}
const [input, output] = positional
if (!input || !output) fail('Usage: node scripts/tools/prepare-image.cjs <input> <output.webp|.png> [--crop x,y,w,h] [--width px] [--quality 0-1]')
if (!fs.existsSync(input)) fail(`No such file: ${input}`)
const format = { '.webp': 'image/webp', '.png': 'image/png' }[path.extname(output).toLowerCase()]
if (!format) fail('The output must be .webp or .png')
const crop = options.crop ? options.crop.split(',').map(Number) : null
if (crop && (crop.length !== 4 || crop.some(n => !Number.isFinite(n) || n < 0))) fail('--crop takes x,y,w,h in pixels')
const width = options.width ? Number(options.width) : null
const quality = options.quality ? Number(options.quality) : 0.9

const mime = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.bmp': 'image/bmp' }[path.extname(input).toLowerCase()]
if (!mime) fail('The input must be a PNG, JPEG, WebP, GIF or BMP image')
const dataUrl = `data:${mime};base64,${fs.readFileSync(input).toString('base64')}`

;(async () => {
    const port = 9367
    const chrome = await launchChrome({ port, profile: outDir('prepare-image-profile'), width: 800, height: 600, fresh: true })
    try {
        const c = await connectCdp(port)
        const result = await c.evaluate(`(async () => {
            const img = new Image();
            img.src = ${JSON.stringify(dataUrl)};
            await img.decode();
            const [x, y, w, h] = ${JSON.stringify(crop)} || [0, 0, img.naturalWidth, img.naturalHeight];
            if (x + w > img.naturalWidth || y + h > img.naturalHeight)
                return { error: 'the crop goes past the image (' + img.naturalWidth + 'x' + img.naturalHeight + ')' };
            const scale = Math.min(1, ${JSON.stringify(width)} ? ${JSON.stringify(width)} / w : 1);
            const canvas = document.createElement('canvas');
            canvas.width = Math.round(w * scale);
            canvas.height = Math.round(h * scale);
            const g = canvas.getContext('2d');
            g.imageSmoothingQuality = 'high';
            g.drawImage(img, x, y, w, h, 0, 0, canvas.width, canvas.height);
            return { source: [img.naturalWidth, img.naturalHeight], size: [canvas.width, canvas.height],
                     data: canvas.toDataURL(${JSON.stringify(format)}, ${quality}) };
        })()`)
        c.close()
        if (!result || result.error) fail(result ? result.error : 'Chrome returned nothing')
        if (!result.data.startsWith(`data:${format};`)) fail(`This Chrome can't encode ${format}`)
        fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true })
        fs.writeFileSync(output, Buffer.from(result.data.split(',')[1], 'base64'))
        const density = /@(\d+(?:\.\d+)?)x$/.exec(path.parse(output).name)
        const shown = density ? result.size.map(n => Math.round(n / Number(density[1]))) : result.size
        console.log(`${output}: ${result.size.join('x')} px from ${result.source.join('x')}, ${(fs.statSync(output).size / 1024).toFixed(1)} KB,`
            + ` shown at ${shown.join('x')} on the site`)
    } finally {
        chrome.kill()
    }
})().catch(e => fail(e.stack || String(e)))
