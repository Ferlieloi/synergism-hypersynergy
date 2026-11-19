/*
    The website's in-game screenshots: one function per view, run in this order by take.cjs (or one at a time on a
    running game-session.cjs with run-shot.cjs). Each writes local/harness-out/screenshots/<name>@2x.png, cropped to
    its element; images.cjs says where each goes on the site.

    Order matters: the static views need the save's own state (hepteracts unlock late in a singularity), so the
    Auto-Sing run comes last. The views need S216+, hepteracts and the GQ shop unlocked.
    What the shots change: the panel and the windows are moved clear of the mod's icon and shown at full opacity, the
    Distributor gets set ratios and distributes (it ascends: the save's state changes), and the build version loses
    its -devN suffix (the release it comes from).
    header-edit is taken from another backup, one whose header layout shows well: `take.cjs <that backup> header-edit`;
    heater-inputs and heater-results from one with an unaffordable row (the guide points at it).
    A view with annotations (__shot.mark) also writes <name>-marked@2x.png, taken right after the clean one.
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
    // Off as players have it; the run turns it on for the step timings
    autosingStepTimings: false,
    autosingObtLoadout: '1', autosingEarlyCubeLoadout: '2', autosingLateCubeLoadout: '3',
    autosingQuarkLoadout: '4', autosingOffLoadout: '5', autosingAmbrosiaLoadout: '6',
}
// The strategy shown in the editor views: Basic has no IF step; the guide describes this one's last-phase IF
// (C15 < 1e110, at most 5 jumps)
const EDITOR_STRATEGY = 'Demon King (BTMco) v1.2-temp'
// The strategy shown selected in the Auto-Sing settings (the guide's Getting started)
const SETTINGS_STRATEGY = 'Demon King (rus) v2.1'
// The Distributor's fields: Keep empty, Orbs %, then the ratios in the panel's order (Chronos to Multiplier)
const DISTRIBUTOR_ORBS = 15, DISTRIBUTOR_RATIOS = [80, 2, 12, 5, 1, 1, 1]
// The header grid's width in the header edit shot (Grid width setting): the window is 1600 px wide
const HEADER_GRID_WIDTH = 1440
const RUN_SINGULARITIES = 10
// Annotations' colour and their numbers' colour
const MARK_COLOR = '#ffc21a', MARK_TEXT = '#000'

// Page helpers, defined in each evaluation
const HELPERS = `window.__shot = {
    wait: ms => new Promise(r => setTimeout(r, ms)),
    modal: re => [...document.querySelectorAll('.hs-modal')].filter(m => m.offsetParent && re.test(m.querySelector('.hs-modal-head')?.textContent ?? '')).pop(),
    leaf: (root, text) => [...root.querySelectorAll('*')].find(e => e.children.length === 0 && e.offsetParent && e.textContent.trim() === text),
    closeModals: () => document.querySelectorAll('.hs-modal').forEach(m => __shot.leaf(m, 'x')?.click()),
    select: (id, v) => { const s = document.getElementById(id); s.value = v; s.dispatchEvent(new Event('change', { bubbles: true })); },
    // A settings switch (✓/✗) set on or off
    setSwitch: async (id, on) => { const b = document.getElementById(id); if (b.classList.contains('hs-disabled') === on) { b.click(); await __shot.wait(300); } },
    // A field typed in, then left
    type: (input, v) => { input.value = String(v); input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })); },
    answerDialogs: async () => { for (let i = 0; i < 5; i++) { const b = ['ok_confirm', 'ok_alert'].map(id => document.getElementById(id)).find(b => b?.offsetParent); if (!b) return; b.click(); await __shot.wait(300); } },
    rect: e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; },
    // Annotations drawn over the page (the guide's text gives the same numbers). A mark: { el, n, at, pad, dx, dy }:
    // A labelled button gets its badge alone (outline: false); a group or a small unlabelled element its outline too.
    // el an element or a list of them (one outline around all), n its badge's number (none: outline only), at the
    // badge's place on the outline ('tl' default, 't', 'tr', 'l', 'r', 'bl', 'b', 'br'), dx/dy to move it. An arrow:
    // { from, to, side: 'left' | 'right', gap }, from one row's side to another's, out by gap px.
    mark: marks => {
        __shot.unmark();
        const C = ${JSON.stringify(MARK_COLOR)}, HALO = 'rgba(0,0,0,.8)';
        const layer = document.createElement('div'); layer.id = 'hs-shot-marks';
        layer.style.cssText = 'position:fixed;inset:0;z-index:2147483647;pointer-events:none';
        const box = els => {
            const rs = [].concat(els).map(e => {
                // getClientRects, not offsetParent: always null on a position: fixed element (the header's pencil)
                if (!e?.getClientRects().length) throw new Error('mark: element missing or hidden');
                // Covered, or scrolled out of its list: what shows at its centre isn't it
                const r = e.getBoundingClientRect(), hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
                if (!hit || !(e.contains(hit) || hit.contains(e))) throw new Error('mark: element not visible: ' + e.textContent.trim().slice(0, 40));
                return r;
            });
            const x = Math.min(...rs.map(r => r.left)), y = Math.min(...rs.map(r => r.top));
            return { x, y, w: Math.max(...rs.map(r => r.right)) - x, h: Math.max(...rs.map(r => r.bottom)) - y };
        };
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('width', innerWidth); svg.setAttribute('height', innerHeight);
        svg.style.cssText = 'position:absolute;left:0;top:0;overflow:visible';
        const path = (d, fill) => {
            for (const [color, width] of [[HALO, 9], [C, 5]]) {
                const p = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                p.setAttribute('d', d); p.setAttribute('stroke', color); p.setAttribute('stroke-width', width);
                p.setAttribute('stroke-linejoin', 'round'); p.setAttribute('stroke-linecap', 'round');
                p.setAttribute('fill', fill ? color : 'none'); svg.append(p);
            }
        };
        const badges = [];
        for (const m of marks) {
            if (m.from) {
                const f = box(m.from), t = box(m.to), left = m.side !== 'right', s = left ? 1 : -1, g = m.gap ?? 14;
                const fx = left ? f.x : f.x + f.w, tx = left ? t.x : t.x + t.w;
                const x0 = left ? Math.min(f.x, t.x) - g : Math.max(f.x + f.w, t.x + t.w) + g;
                const fy = f.y + f.h / 2, ty = t.y + t.h / 2, v = Math.sign(ty - fy), r = 12;
                path('M' + fx + ',' + fy + ' H' + (x0 + s * r) + ' Q' + x0 + ',' + fy + ' ' + x0 + ',' + (fy + v * r) +
                    ' V' + (ty - v * r) + ' Q' + x0 + ',' + ty + ' ' + (x0 + s * r) + ',' + ty + ' H' + (tx - s * 15));
                path('M' + (tx - s * 2) + ',' + ty + ' L' + (tx - s * 15) + ',' + (ty - 8) + ' L' + (tx - s * 15) + ',' + (ty + 8) + ' Z', true);
                continue;
            }
            const P = m.pad ?? 3, b = box(m.el);
            const L = b.x - P, T = b.y - P, R = b.x + b.w + P, B = b.y + b.h + P;
            const o = document.createElement('div');
            o.style.cssText = 'position:absolute;box-sizing:border-box;border:3px solid ' + C + ';border-radius:6px;box-shadow:0 0 0 2px ' + HALO + ',inset 0 0 0 2px ' + HALO +
                ';left:' + L + 'px;top:' + T + 'px;width:' + (R - L) + 'px;height:' + (B - T) + 'px';
            if (m.outline !== false) layer.append(o);
            if (m.n == null) continue;
            const at = m.at ?? 'tl', D = 26;
            const cx = (at.includes('l') ? L : at.includes('r') ? R : (L + R) / 2) + (m.dx ?? 0);
            const cy = (at === 'l' || at === 'r' ? (T + B) / 2 : at[0] === 't' ? T : B) + (m.dy ?? 0);
            const g = document.createElement('div'); g.textContent = m.n;
            g.style.cssText = 'position:absolute;box-sizing:border-box;border-radius:50%;text-align:center;background:' + C + ';color:' + ${JSON.stringify(MARK_TEXT)} +
                ';font:700 16px/' + D + 'px Arial,sans-serif;box-shadow:0 0 0 2px ' + HALO + ';left:' + (cx - D / 2) + 'px;top:' + (cy - D / 2) + 'px;width:' + D + 'px;height:' + D + 'px';
            badges.push(g);
        }
        // Arrows under the outlines, badges on top
        layer.prepend(svg); layer.append(...badges);
        document.body.append(layer);
    },
    unmark: () => document.getElementById('hs-shot-marks')?.remove(),
    // The mod panel on one Settings subtab, as tall as its content (at most maxHeight), below the mod's icon
    panel: async (subtab, maxHeight) => {
        __shot.closeModals();
        const p = document.getElementById('hs-panel');
        if (p.classList.contains('hs-panel-closed')) { document.getElementById('hs-panel-control').click(); await __shot.wait(800); }
        // The Debug tab is dev builds only (the release build removes tab 4)
        const debugTab = document.getElementById('hs-panel-tab-4'); if (debugTab) debugTab.style.display = 'none';
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
// The same view with its annotations: <name>-marked@2x.png (images.cjs's `marked`). marksBody returns __shot.mark's list
async function captureMarked(c, name, clip, marksBody) {
    await run(c, `__shot.mark((() => { ${marksBody} })()); await __shot.wait(100);`)
    try {
        await capture(c, `${name}-marked`, clip)
    } finally {
        await run(c, `__shot.unmark();`)
    }
}

const SHOTS = {
    // Mod panel, Settings > QoL (the catalogue's mod panel entry)
    async 'mod-panel'(c) {
        await capture(c, 'mod-panel', await run(c, `return await __shot.panel('QoL', 940);`))
        await run(c, `document.getElementById('hs-panel-close-btn').click(); await __shot.wait(800);`)
    },

    // Mod panel, Settings > Auto-Sing (the guide's Getting started)
    async 'autosing-settings'(c) {
        await capture(c, 'autosing-settings', await run(c, `
            __shot.select('hs-setting-auto-sing-strategy', ${JSON.stringify(SETTINGS_STRATEGY)});
            await __shot.setSwitch('hs-setting-auto-sing-step-timings-btn', false);
            return await __shot.panel('Auto-Sing', 940);`))
        await run(c, `document.getElementById('hs-panel-close-btn').click(); await __shot.wait(800);
            __shot.select('hs-setting-auto-sing-strategy', ${JSON.stringify(SESSION_SETTINGS.autosingStrategy)}); await __shot.wait(300);`)
    },

    // Header edit mode: the header and the edit panel under it, full width
    async 'header-edit'(c) {
        const clip = await run(c, `
            document.getElementById('hs-header-edit-button').click(); await __shot.wait(1500);
            // Narrower than the window, as on a player's wider screen: the grid clears the mod's icon and the ✎
            const width = document.querySelector('#hs-header-edit-settings .hs-hes-width-value');
            width.value = '${HEADER_GRID_WIDTH}'; width.dispatchEvent(new Event('change', { bubbles: true })); await __shot.wait(800);
            const r = document.getElementById('headerEditPanel').getBoundingClientRect();
            return { x: 0, y: 0, width: document.documentElement.clientWidth, height: r.bottom + 4 };`)
        await capture(c, 'header-edit', clip)
        // The catalogue entry's pencil and Done
        await captureMarked(c, 'header-edit', clip, `return [
            { el: document.getElementById('hs-header-edit-button'), n: 1, at: 'b', dy: 6 },
            { el: document.getElementById('headerEditDone'), n: 2, at: 'r', dx: 18, outline: false },
        ];`)
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

    // Ambrosia Heater Inputs, cut below the right column's last button
    async 'heater-inputs'(c) {
        const clip = await run(c, `
            __shot.closeModals(); await __shot.wait(500);
            document.getElementById('hs-panel-amb-heater-compute-btn').click(); await __shot.wait(3000);
            const m = __shot.modal(/Ambrosia Heater Inputs/);
            // As the guide tells: ☰ (what the slots need), every slot ticked for Import All
            m.querySelector('.hs-heater-active-bulk-btn[data-branch-bulk="slots"]').click(); await __shot.wait(300);
            m.querySelectorAll('.hs-heater-type-select-checkbox').forEach(b => { if (!b.checked) { b.checked = true; b.dispatchEvent(new Event('change', { bubbles: true })); } });
            m.style.left = '80px'; m.style.top = '60px';
            await __shot.wait(300);
            const r = __shot.rect(m);
            // The lowest button inside the window's box (the left column scrolls: its hidden ones are below it)
            const last = [...m.querySelectorAll('button')].filter(b => b.offsetParent && b.getBoundingClientRect().bottom <= r.y + r.height).reduce((a, b) => b.getBoundingClientRect().bottom > a.getBoundingClientRect().bottom ? b : a);
            return { ...r, height: last.getBoundingClientRect().bottom + 8 - r.y };`)
        await capture(c, 'heater-inputs', clip)
        // The Heater guide's steps, in its order
        await captureMarked(c, 'heater-inputs', clip, `
            const m = __shot.modal(/Ambrosia Heater Inputs/), q = s => m.querySelector(s);
            return [
                // Badges in the title line's empty end
                { el: [...m.querySelectorAll('.hs-heater-type-select')], n: 1, at: 'tr', dx: -14, dy: -10 },
                { el: [...m.querySelectorAll('.hs-heater-type-select-checkbox')], n: 2, at: 't', dy: -10 },
                // The title and its list, ☰ inside
                { el: q('.hs-heater-active-grid').parentElement, n: 3, at: 'l' },
                { el: q('.hs-heater-active-bulk-btn[data-branch-bulk="slots"]'), n: 4, at: 'b', pad: 5, dy: 4 },
                { el: q('#hs-heater-recalculate-btn'), n: 5, at: 'l', outline: false },
                { el: q('#hs-heater-import-all-btn'), n: 6, at: 'l', outline: false },
                { el: q('#hs-heater-sync-icons-btn'), n: 7, at: 'l', outline: false },
                { el: q('#hs-heater-sync-settings-btn'), n: 8, at: 'l', outline: false },
            ];`)
        await run(c, `__shot.closeModals(); await __shot.wait(500);`)
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
            const inputs = __shot.modal(/Ambrosia Heater Inputs/);
            if (!inputs) throw new Error('no Inputs window to take the width from');
            const width = inputs.getBoundingClientRect().width;
            __shot.leaf(inputs, 'x').click();
            await __shot.wait(500);
            // As wide as the Inputs window (6 px narrower by itself): the guide shows them one above the other
            const m = __shot.modal(/Ambrosia Heater Results/);
            m.style.width = width + 'px'; await __shot.wait(300);
            return __shot.rect(m);`)
        await capture(c, 'heater-results', clip)
        // The guide's "Read the results", in letters: the Inputs window's numbers are beside the same text
        await captureMarked(c, 'heater-results', clip, `
            const m = __shot.modal(/Ambrosia Heater Results/);
            const heads = [...m.querySelectorAll('.hs-heater-header-row')], common = heads[0].children;
            const p4x4 = heads.map(r => [...r.children].find(c => c.textContent.trim() === 'p4x4 eq')).find(Boolean);
            const quarks = [...m.querySelectorAll('tr')].find(r => r.cells?.[0]?.textContent.trim().startsWith('Quarks'));
            const unaffordable = m.querySelector('.hs-heater-unaffordable-row');
            if (!unaffordable) throw new Error('no unaffordable row: take it from a save where one is (Max Amb + Oct)');
            return [
                // Cost: the Blueberry and Ambrosia columns' icons, the badge between Actions and them
                { el: [common[2], common[3]], n: 'A', at: 'l', dx: -4 },
                { el: [...common[4].querySelectorAll('span')].find(s => s.textContent.trim() === 'Effect'), n: 'B', at: 'r', dx: 15 },
                // The badge in the empty Routing cell, clear of the ✘
                { el: quarks.cells[quarks.cells.length - 1], n: 'C', at: 'l', dx: -10 },
                { el: [unaffordable.cells[1], unaffordable.cells[2]], n: 'D', at: 'tl' },
                { el: p4x4, n: 'E', at: 'tr', dx: -10 },
                // Its cell, the badge in the empty cell below
                { el: m.querySelector('.hs-heater-best-h-marker').closest('td'), n: 'F', at: 'b', dy: 8 },
            ];`)
        await run(c, `__shot.closeModals(); await __shot.wait(500);`)
    },

    // Hepteract forge's Distributor after a distribution, its summary in the status line. It ascends: after the heat
    async 'hepteract-distributor'(c) {
        const clip = await run(c, `
            const forge = async () => {
                document.getElementById('cubetab').click(); await __shot.wait(500);
                document.getElementById('switchCubeSubTab7').click(); await __shot.wait(800);
            };
            await forge();
            let d = document.getElementById('hs-hept-distributor');
            if (!d?.offsetParent) { document.getElementById('hs-hept-distributor-open').click(); await __shot.wait(1000); d = document.getElementById('hs-hept-distributor'); }
            if (!d?.offsetParent) throw new Error('no Distributor panel: hepteracts locked?');
            __shot.type(d.querySelector('input[aria-label^="Hepteracts to keep"]'), '');
            __shot.type(d.querySelector('input[aria-label^="Percentage of hepteracts"]'), ${DISTRIBUTOR_ORBS});
            const ratios = ${JSON.stringify(DISTRIBUTOR_RATIOS)};
            d.querySelectorAll('input[aria-label$=" ratio"]').forEach((i, n) => __shot.type(i, ratios[n]));
            await __shot.wait(300);
            [...d.querySelectorAll('button')].find(b => b.textContent.trim() === 'Distribute').click(); await __shot.wait(1000);
            const status = d.querySelector('.hs-hept-distributor-status'), t0 = Date.now();
            while (status.textContent.trim() === 'Distributing…') {
                if (Date.now() - t0 > 180000) throw new Error('Distribute not done after 3 minutes');
                await __shot.wait(1000);
            }
            if (/^Stopped/.test(status.textContent.trim())) throw new Error('Distributor: ' + status.textContent.trim());
            // An ascension sends the player to Buildings
            await forge();
            d.scrollIntoView({ block: 'center' }); await __shot.wait(300);
            return __shot.rect(d);`)
        await capture(c, 'hepteract-distributor', { x: clip.x - 8, y: clip.y - 8, width: clip.width + 16, height: clip.height + 16 })
        await run(c, `document.getElementById('buildingstab').click(); await __shot.wait(500);`)
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
            const list = m.querySelector('.hs-challenges-list-container'), target = list.querySelector('.hs-if-target');
            // The list (400 px at most) made tall enough to show the IF row with its Jump here row
            const span = m.querySelector('.hs-if-block').getBoundingClientRect().bottom - target.getBoundingClientRect().top + 10;
            if (span > list.clientHeight) { list.style.maxHeight = list.style.flexBasis = span + 'px'; await __shot.wait(300); }
            list.scrollTop = target.offsetTop - list.offsetTop - 4;
            await __shot.wait(300);
            return __shot.rect(m);`)
        await capture(c, 'if-jump', clip)
        // The IF row, its Jump here row and the jump between them, Max jumps
        await captureMarked(c, 'if-jump', clip, `
            const m = __shot.modal(/Configure Strategy Actions/);
            const ifRow = m.querySelector('.hs-if-block'), target = m.querySelector('.hs-if-target');
            const maxJumps = [...m.querySelectorAll('.hs-challenges-input-label')].find(e => /^Max jumps/.test(e.textContent.trim())).parentElement.querySelector('input');
            return [
                { from: ifRow, to: target, side: 'left', gap: 24 },
                // Badges on the rows' top edge, between their text and their buttons
                { el: ifRow, n: 1, at: 't', outline: false },
                { el: target, n: 2, at: 't', outline: false },
                { el: maxJumps, n: 3, at: 'r' },
            ];`)
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
            await __shot.setSwitch('hs-setting-auto-sing-step-timings-btn', true);
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
