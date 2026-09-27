const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const esbuild = require('esbuild');

const bundled = esbuild.buildSync({
    entryPoints: [path.join(__dirname, '../src/mod/class/hs-utils/hs-icons.ts')],
    bundle: true, write: false, platform: 'node', format: 'cjs', logLevel: 'silent'
}).outputFiles[0].text;

class TestImage {
    naturalWidth = 224;
    naturalHeight = 288;
    src = '';
    currentSrc = '';
    style = {};
    async decode() {
        decodes++;
        if (failDecode) throw new Error('Image unavailable');
    }
}

let decodes = 0;
let failDecode = false;
const crops = [];
const canvases = [];
const sandbox = {
    exports: {}, module: { exports: {} }, URL,
    Image: TestImage, HTMLImageElement: TestImage,
    window: {
        location: { origin: 'https://synergism.cc' },
        getComputedStyle: element => element.style
    },
    document: {
        baseURI: 'https://synergism.cc/',
        createElement(tag) {
            assert.equal(tag, 'canvas');
            const canvas = {
                getContext: () => ({ drawImage: (...args) => crops.push(args.slice(1)) }),
                toDataURL: () => 'data:image/png;base64,cropped-tile'
            };
            canvases.push(canvas);
            return canvas;
        }
    }
};
vm.runInNewContext(bundled, sandbox);
const { HSIcons } = sandbox.module.exports;

async function main() {
    const native = new TestImage();
    native.src = 'https://synergism.cc/Pictures/img_transparent.png';
    native.style = {
        backgroundImage: 'url("/Pictures/Default/Sprite Sheets/Octeracts.png")',
        backgroundSize: '224px 288px', backgroundPosition: '-64px -128px', width: '32px', height: '32px'
    };
    const icon = HSIcons.fromElement(native);
    assert.equal(icon.url, 'https://synergism.cc/Pictures/Default/Sprite%20Sheets/Octeracts.png');
    assert.deepEqual(JSON.parse(JSON.stringify(icon.sprite)), {
        x: 64, y: 128, width: 32, height: 32, sheetWidth: 224, sheetHeight: 288
    });
    const control = { style: {} };
    HSIcons.applyBackground(control, icon, 35);
    assert.equal(control.style.backgroundSize, '245px 315px');
    assert.equal(control.style.backgroundPosition, '-70px -140px');

    // A smaller game alias must crop the original full-resolution tile, including rectangular tiles.
    const alias = {
        url: icon.url,
        sprite: { x: 32, y: 64, width: 16, height: 24, sheetWidth: 112, sheetHeight: 144 }
    };
    const first = HSIcons.toUrl(alias);
    const second = HSIcons.toUrl(alias);
    assert.equal(first, second);
    assert.equal(await first, 'data:image/png;base64,cropped-tile');
    assert.equal(decodes, 1);
    assert.deepEqual(crops[0], [64, 128, 32, 48, 0, 0, 32, 48]);
    assert.equal(canvases[0].width, 32);
    assert.equal(canvases[0].height, 48);

    const invalid = { ...alias, sprite: { ...alias.sprite, x: 112 } };
    await assert.rejects(HSIcons.toUrl(invalid), /Invalid sprite region/);
    const retry = { ...alias, url: icon.url + '?retry' };
    failDecode = true;
    await assert.rejects(HSIcons.toUrl(retry), /Image unavailable/);
    failDecode = false;
    assert.equal(await HSIcons.toUrl(retry), 'data:image/png;base64,cropped-tile');

    const standalone = new TestImage();
    standalone.src = 'https://synergism.cc/Pictures/Default/Blueberries.png';
    standalone.style.backgroundImage = 'none';
    assert.equal(await HSIcons.toUrl(HSIcons.fromElement(standalone)), standalone.src);
    HSIcons.applyBackground(control, HSIcons.fromElement(standalone), 35);
    assert.equal(control.style.backgroundSize, 'contain');
    assert.equal(control.style.backgroundPosition, 'center');
    standalone.src = native.src;
    assert.equal(HSIcons.fromElement(standalone), null);
    native.style.backgroundSize = 'cover';
    assert.equal(HSIcons.fromElement(native), null);
    native.style.backgroundImage = 'url("a.png"), url("b.png")';
    assert.equal(HSIcons.fromElement(native), null);
    console.log('Icon checks passed: native sprites, scaling, crops, caching, retries and individual images.');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
