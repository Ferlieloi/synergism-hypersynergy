/*
    The website's in-game screenshots: one function per view, run in this order by take.cjs (or one at a time on a
    running game-session.cjs with run-shot.cjs). Each writes local/harness-out/screenshots/<name>@2x.png, cropped to
    its element; images.cjs says where each goes on the site.

    Order matters: the static views need the save's own state (hepteracts unlock late in a singularity), so the
    Auto-Sing run comes last. The views need S216+, hepteracts and the GQ shop unlocked.
    What the shots change: the panel and the windows are moved clear of the mod's icon and shown at full opacity, the
    Distributor gets "Match current" rounded (a save's ratios may all be 0), and the build version loses its -devN
    suffix (the release it comes from).
*/
const fs = require('node:fs')
const path = require('node:path')
const { outDir } = require('../../harness/lib/env.cjs')

// The session's viewport (game-session.cjs)
const WIDTH = 1600, HEIGHT = 1000, SCALE = 2

// Settings given to the session at load: a default strategy, a slot per loadout role, the recorder on
const SESSION_SETTINGS = {
    autosingStrategy: 'Basic v1.3-temp',
    singularityNumber: 260,
    autosingStepTimings: true,
    autosingObtLoadout: '1', autosingEarlyCubeLoadout: '2', autosingLateCubeLoadout: '3',
    autosingQuarkLoadout: '4', autosingOffLoadout: '5', autosingAmbrosiaLoadout: '6',
}
// The strategy shown in the editor views: Basic has no IF step; the guide describes this one's last-phase IF
// (C15 < 1e110, at most 5 jumps)
const EDITOR_STRATEGY = 'Demon King (BTMco) v1.2-temp'
const RUN_SINGULARITIES = 10

// Page helpers, defined in each evaluation
const HELPERS = `window.__shot = {
    wait: ms => new Promise(r => setTimeout(r, ms)),
    modal: re => [...document.querySelectorAll('.hs-modal')].filter(m => m.offsetParent && re.test(m.querySelector('.hs-modal-head')?.textContent ?? '')).pop(),
    leaf: (root, text) => [...root.querySelectorAll('*')].find(e => e.children.length === 0 && e.offsetParent && e.textContent.trim() === text),
    closeModals: () => document.querySelectorAll('.hs-modal').forEach(m => __shot.leaf(m, 'x')?.click()),
    select: (id, v) => { const s = document.getElementById(id); s.value = v; s.dispatchEvent(new Event('change', { bubbles: true })); },
    answerDialogs: async () => { for (let i = 0; i < 5; i++) { const b = ['ok_confirm', 'ok_alert'].map(id => document.getElementById(id)).find(b => b?.offsetParent); if (!b) return; b.click(); await __shot.wait(300); } },
    rect: e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; },
    // The mod panel on one Settings subtab, as tall as its content (at most maxHeight), below the mod's icon
    panel: async (subtab, maxHeight) => {
        __shot.closeModals();
        const p = document.getElementById('hs-panel');
        if (p.classList.contains('hs-panel-closed')) { document.getElementById('hs-panel-control').click(); await __shot.wait(800); }
        document.getElementById('hs-panel-tab-3').click(); await __shot.wait(300);
        [...document.querySelectorAll('.hs-panel-subtab')].find(e => e.textContent.trim() === subtab).click();
        p.style.left = '10px'; p.style.top = '52px'; p.style.width = '560px'; p.style.height = maxHeight + 'px'; p.style.opacity = '1';
        await __shot.wait(500);
        const body = p.querySelector('.hs-panel-body-3');
        const last = [...body.children].filter(e => e.offsetParent).pop();
        const spare = body.getBoundingClientRect().bottom - last.getBoundingClientRect().bottom - 12;
        if (spare > 0) p.style.height = (maxHeight - spare) + 'px';
        await __shot.wait(300);
        return __shot.rect(p);
    },
};`

async function capture(c, name, clip) {
    const out = outDir('screenshots')
    // A capture follows the emulation of the client asking for it: run-shot.cjs's own connection has none (1x)
    await c.send('Emulation.setDeviceMetricsOverride', { width: WIDTH, height: HEIGHT, deviceScaleFactor: SCALE, mobile: false })
    // The release a dev build comes from: no -devN in a players' guide
    await c.evaluate(`(() => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
        while ((n = w.nextNode())) if (/\\d+\\.\\d+\\.\\d+[a-z]?-dev\\d+/.test(n.nodeValue)) n.nodeValue = n.nodeValue.replace(/(\\d+\\.\\d+\\.\\d+[a-z]?)-dev\\d+/g, '$1'); })()`)
    const x = Math.floor(clip.x), y = Math.floor(clip.y)
    const r = await c.send('Page.captureScreenshot', { format: 'png', clip: { x, y, width: Math.ceil(clip.x + clip.width) - x, height: Math.ceil(clip.y + clip.height) - y, scale: 1 } })
    const file = path.join(out, `${name}@2x.png`)
    fs.writeFileSync(file, Buffer.from(r.result.data, 'base64'))
    console.log(`  ${name}: ${path.relative(process.cwd(), file)}`)
}
// Evaluates an async body (with __shot in scope) and returns its value
const run = (c, body) => c.evaluate(`(async () => { ${HELPERS} ${body} })()`)

const SHOTS = {
    // Mod panel, Settings > QoL (the catalogue's mod panel entry)
    async 'mod-panel'(c) {
        await capture(c, 'mod-panel', await run(c, `return await __shot.panel('QoL', 940);`))
        await run(c, `document.getElementById('hs-panel-close-btn').click(); await __shot.wait(800);`)
    },

    // Mod panel, Settings > Auto-Sing (the guide's Getting started)
    async 'autosing-settings'(c) {
        await capture(c, 'autosing-settings', await run(c, `return await __shot.panel('Auto-Sing', 940);`))
        await run(c, `document.getElementById('hs-panel-close-btn').click(); await __shot.wait(800);`)
    },

    // Header edit mode: the header and the edit panel under it, full width
    async 'header-edit'(c) {
        const clip = await run(c, `
            document.getElementById('hs-header-edit-button').click(); await __shot.wait(1500);
            const r = document.getElementById('headerEditPanel').getBoundingClientRect();
            return { x: 0, y: 0, width: document.documentElement.clientWidth, height: r.bottom + 4 };`)
        await capture(c, 'header-edit', clip)
        await run(c, `document.getElementById('headerEditDone').click(); await __shot.wait(800);`)
    },

    // Golden Quarks: a search with its cards left of the box
    async 'gq-search'(c) {
        const clip = await run(c, `
            document.getElementById('singularitytab').click(); await __shot.wait(800);
            document.getElementById('toggleSingularitySubTab2').click(); await __shot.wait(800);
            const input = [...document.querySelectorAll('.hs-sing-search-input')].find(i => i.offsetParent);
            input.value = 'ambrosia'; input.dispatchEvent(new Event('input', { bubbles: true })); await __shot.wait(800);
            input.blur();
            const results = document.querySelector('.hs-sing-search-card').parentElement.getBoundingClientRect();
            const box = input.closest('[id]').getBoundingClientRect();
            // From the Distributor / Maxed Upgrades row above the box to the box's bottom
            const above = [...document.querySelectorAll('button, div')].filter(e => e.offsetParent && /^Maxed Upgrades/.test(e.textContent.trim()) && e.children.length === 0)[0]?.getBoundingClientRect();
            const top = Math.min(results.top, above ? above.top : box.top) - 8, bottom = Math.min(box.bottom + 8, innerHeight);
            return { x: results.left - 8, y: top, width: box.right - results.left + 16, height: bottom - top };`)
        await capture(c, 'gq-search', clip)
        await run(c, `const input = [...document.querySelectorAll('.hs-sing-search-input')].find(i => i.offsetParent);
            input.value = ''; input.dispatchEvent(new Event('input', { bubbles: true }));`)
    },

    // Hepteract forge's Distributor
    async 'hepteract-distributor'(c) {
        const clip = await run(c, `
            document.getElementById('cubetab').click(); await __shot.wait(500);
            document.getElementById('switchCubeSubTab7').click(); await __shot.wait(800);
            document.getElementById('hs-hept-distributor-open').click(); await __shot.wait(1000);
            const d = document.getElementById('hs-hept-distributor');
            if (!d?.offsetParent) throw new Error('no Distributor panel: hepteracts locked?');
            // A save's ratios may all be 0: "Match current", rounded (it gives repeating decimals)
            [...d.querySelectorAll('button')].find(b => b.textContent.trim() === 'Match current').click(); await __shot.wait(500);
            d.querySelectorAll('input[aria-label$=" ratio"]').forEach(i => {
                const v = Number(i.value); i.value = String(v >= 10 ? Math.round(v) : Math.round(v * 10) / 10 || '');
                i.dispatchEvent(new Event('input', { bubbles: true }));
            });
            d.scrollIntoView({ block: 'center' }); await __shot.wait(300);
            return __shot.rect(d);`)
        await capture(c, 'hepteract-distributor', { x: clip.x - 8, y: clip.y - 8, width: clip.width + 16, height: clip.height + 16 })
        await run(c, `document.getElementById('buildingstab').click(); await __shot.wait(500);`)
    },

    // Ambrosia Heater: a full heat, then the results window
    async 'heater-results'(c) {
        await run(c, `
            __shot.closeModals(); await __shot.wait(500);
            document.getElementById('hs-panel-amb-heater-compute-btn').click(); await __shot.wait(3000);
            document.querySelectorAll('.hs-heater-active-checkbox').forEach(b => { if (!b.checked) { b.checked = true; b.dispatchEvent(new Event('change', { bubbles: true })); } });
            document.getElementById('hs-heater-recalculate-btn').click(); await __shot.wait(1000);
            const t0 = Date.now();
            while (document.getElementById('hs-heater-recalculate-btn').textContent.includes('Heating')) {
                if (Date.now() - t0 > 600000) throw new Error('heat not done after 10 minutes');
                await __shot.wait(1000);
            }
            await __shot.wait(1500);`)
        const clip = await run(c, `
            const red = __shot.modal(/Red Ambrosia Upgrades/); if (red) __shot.leaf(red, 'x').click();
            const inputs = __shot.modal(/Ambrosia Heater Inputs/); if (inputs) __shot.leaf(inputs, 'x').click();
            await __shot.wait(500);
            return __shot.rect(__shot.modal(/Ambrosia Heater Results/));`)
        await capture(c, 'heater-results', clip)
        await run(c, `__shot.closeModals(); await __shot.wait(500);`)
    },

    // Strategy window, actions window, an IF step loaded in the editor: a default strategy opened with Edit
    async 'strategy-window'(c) {
        const clip = await run(c, `
            __shot.closeModals(); await __shot.wait(300);
            __shot.select('hs-setting-auto-sing-strategy', ${JSON.stringify(EDITOR_STRATEGY)}); await __shot.wait(300);
            document.getElementById('hs-setting-auto-sing-strategy-editor-button').click(); await __shot.wait(1500);
            const m = __shot.modal(/Strategy/);
            m.style.left = '80px'; m.style.top = '60px';
            await __shot.wait(300);
            return __shot.rect(m);`)
        await capture(c, 'strategy-window', clip)
    },
    async 'actions-window'(c) {
        const clip = await run(c, `
            const s = __shot.modal(/Strategy/);
            const rows = [...s.querySelectorAll('*')].filter(e => /^✎ \\d+ steps$/.test(e.textContent.trim()) && e.offsetParent);
            rows.filter(e => !rows.some(o => o !== e && e.contains(o))).pop().click(); await __shot.wait(1500);
            const m = __shot.modal(/Configure Strategy Actions/);
            m.style.left = '80px'; m.style.top = '60px';
            await __shot.wait(300);
            return __shot.rect(m);`)
        await capture(c, 'actions-window', clip)
    },
    async 'if-jump'(c) {
        const clip = await run(c, `
            const m = __shot.modal(/Configure Strategy Actions/);
            __shot.leaf(m.querySelector('.hs-if-block'), '✎').click(); await __shot.wait(600);
            const list = m.querySelector('.hs-challenges-list-container');
            list.scrollTop = list.querySelector('.hs-if-target').offsetTop - list.offsetTop - 4;
            await __shot.wait(300);
            return __shot.rect(m);`)
        await capture(c, 'if-jump', clip)
        // Leave both windows without saving
        await run(c, `
            for (const re of [/Configure Strategy Actions/, /Strategy/]) {
                const m = __shot.modal(re); if (!m) continue;
                __shot.leaf(m, 'Cancel')?.click(); await __shot.wait(500); await __shot.answerDialogs();
            }
            __shot.closeModals(); await __shot.wait(300);
            __shot.select('hs-setting-auto-sing-strategy', ${JSON.stringify(SESSION_SETTINGS.autosingStrategy)}); await __shot.wait(300);`)
    },

    // Auto-Sing window and step timings, after RUN_SINGULARITIES on the default strategy
    async 'autosing-window'(c) {
        await run(c, `
            document.getElementById('hs-setting-auto-sing-enabled').click();
            const t0 = Date.now();
            while (!(Number(document.getElementById('hs-completed-sing-amount')?.textContent) >= ${RUN_SINGULARITIES})) {
                if (Date.now() - t0 > ${RUN_SINGULARITIES} * 30000) throw new Error('Auto-Sing too slow: ' + document.getElementById('hs-completed-sing-amount')?.textContent + ' done');
                await __shot.wait(1000);
            }
            // Mid-singularity: the window's figures are steady
            await __shot.wait(2000);`)
        await capture(c, 'autosing-window', await run(c, `return __shot.rect(document.getElementById('hs-autosing-timer-display'));`))
    },
    async 'step-timings'(c) {
        const clip = await run(c, `
            document.getElementById('hs-timer-ctrl-step-timings').click(); await __shot.wait(1000);
            const m = __shot.modal(/Step timings/);
            m.style.left = '80px'; m.style.top = '60px';
            await __shot.wait(300);
            return __shot.rect(m);`)
        await capture(c, 'step-timings', clip)
        await run(c, `document.getElementById('hs-setting-auto-sing-enabled').click(); await __shot.wait(2000);`)
    },
}

// The shots a shot needs taken before it, in the same session (the window it starts from)
const NEEDS = {
    'actions-window': ['strategy-window'],
    'if-jump': ['strategy-window', 'actions-window'],
    'step-timings': ['autosing-window'],
}

module.exports = { SHOTS, NEEDS, SESSION_SETTINGS, WIDTH, HEIGHT, SCALE }
