// ==UserScript==
// @name         HyperSynergism Loader
// @namespace    https://github.com/Ferlieloi
// @version      3.5
// @description  Official loader for HyperSynergism mod
// @match        https://synergism.cc/*
// @grant        none
// @run-at       document-start
// @license      MIT
// ==/UserScript==

(() => {
    'use strict';

    if (window.HS_LOADER_INITIALIZED) return;
    window.HS_LOADER_INITIALIZED = true;

    const startTime = performance.now();
    const log = (...a) => console.log(`%c[HS +${(performance.now() - startTime).toFixed(0)}ms]`, 'color:#4af', ...a);
    const warn = (...a) => console.warn(`%c[HS +${(performance.now() - startTime).toFixed(0)}ms]`, 'color:#fa4', ...a);
    const debug = (...a) => console.debug(`%c[HS +${(performance.now() - startTime).toFixed(0)}ms]`, 'color:#aaa', ...a);

    const originalFetch = window.fetch.bind(window);
    const isFirefox = navigator.userAgent.includes('Firefox');
    log(`Browser: ${isFirefox ? 'Firefox' : 'Other'} 33`);

    // ─── State ────────────────────────────────────────────────────────────────
    let gameScriptDetected = false;
    let allowCustomElements = false;

    // ─── customElements lock ──────────────────────────────────────────────────
    // Block the original game script from registering Custom Elements.
    // Our patched copy will register them once allowCustomElements is set.
    const origDefine = customElements.define;
    customElements.define = function (name, ctor, options) {
        if (!allowCustomElements) {
            if (!customElements.get(name)) {
                debug(`Blocked original script from defining <${name}> (lock active)`);
            }
            return;
        }
        if (customElements.get(name)) return;
        return origDefine.call(this, name, ctor, options);
    };

    // ─── Fetch block ──────────────────────────────────────────────────────────
    window.fetch = async function (input, init) {
        const url = typeof input === 'string' ? input
            : input instanceof Request ? input.url
                : '';
        if (url.includes('rocket-loader') || (url.includes('/dist/out') && url.endsWith('.js'))) {
            debug(`Fetch blocked: ${url.substring(0, 80)}`);
            return new Response('', { status: 200 });
        }
        return originalFetch(input, init);
    };

    function shouldBlockScript(src) {
        return src.includes('rocket-loader') || /\/dist\/out.*\.js/.test(src);
    }

    // ─── Script interception ──────────────────────────────────────────────────
    // We need to intercept the game's <script src="…/dist/out….js"> tag,
    // prevent it from running, then inject our patched version in its place.

    let beforeScriptExecute;
    if (isFirefox) {
        // Firefox supports beforescriptexecute which fires before the script runs.
        beforeScriptExecute = function (e) {
            const src = e.target.src || '';
            if (shouldBlockScript(src)) {
                e.preventDefault();
                e.stopPropagation();
                e.target.remove();
                log(`Blocked (beforescriptexecute): ${src.substring(0, 60)}`);
                if (!gameScriptDetected && /\/dist\/out.*\.js/.test(src)) {
                    gameScriptDetected = true;
                    injectPatchedBundle();
                }
            }
        };
        document.addEventListener('beforescriptexecute', beforeScriptExecute, true);
    }

    // Chrome/Edge: use a MutationObserver to catch the tag before it executes.
    const mo = new MutationObserver(muts => {
        for (const m of muts) {
            for (const n of m.addedNodes) {
                if (n.tagName !== 'SCRIPT') continue;
                const src = n.src || '';
                if (shouldBlockScript(src)) {
                    n.type = 'javascript/blocked';
                    n.remove();
                    debug(`Blocked (MutationObserver): ${src.substring(0, 60)}`);
                    if (!gameScriptDetected && /\/dist\/out.*\.js/.test(src)) {
                        gameScriptDetected = true;
                        injectPatchedBundle();
                    }
                }
            }
        }
    });
    mo.observe(document.documentElement, { childList: true, subtree: true });

    // Also check scripts that may already exist in the DOM at injection time.
    function checkExistingScripts() {
        for (const script of document.getElementsByTagName('script')) {
            if (script.src && /\/dist\/out.*\.js/.test(script.src)) {
                script.type = 'javascript/blocked';
                script.remove();
                if (!gameScriptDetected) {
                    gameScriptDetected = true;
                    injectPatchedBundle();
                }
            }
        }
    }
    checkExistingScripts();
    setTimeout(checkExistingScripts, 10);

    // ─── Utilities ────────────────────────────────────────────────────────────

    // Resolves when condition() returns truthy, or rejects after timeoutMs.
    // Uses setTimeout (not rAF) so it works reliably in background tabs.
    function waitFor(condition, timeoutMs, label, intervalMs = 200) {
        return new Promise((resolve, reject) => {
            const deadline = performance.now() + timeoutMs;
            (function poll() {
                const result = condition();
                if (result) { resolve(result); return; }
                if (performance.now() >= deadline) {
                    reject(new Error(`waitFor timed out: ${label}`));
                    return;
                }
                setTimeout(poll, intervalMs);
            })();
        });
    }

    // Waits for #id to exist, then clicks it. Returns true on success.
    async function clickWhenAvailable(id, timeoutMs = 20000) {
        log(`Waiting for #${id}...`);
        try {
            await waitFor(() => document.getElementById(id), timeoutMs, `#${id} to appear`);
        } catch {
            warn(`Timed out waiting for #${id}`);
            return false;
        }
        const el = document.getElementById(id);
        // Dispatch the full mouse event sequence the game expects.
        for (const type of ['mousedown', 'mouseup', 'click']) {
            el.dispatchEvent(new MouseEvent(type, { bubbles: true, cancelable: true, view: window }));
        }
        // Yield one tick so the game's event handler can run before we continue.
        await new Promise(r => setTimeout(r, 0));
        return true;
    }

    // ─── Phase 1 & 2: Fetch, patch, and inject the game bundle ───────────────

    async function injectPatchedBundle() {
        if (window.__HS_INJECTED__) return;
        window.__HS_INJECTED__ = true;

        log('Fetching game bundle...');
        let code;
        try {
            const res = await originalFetch(`https://synergism.cc/dist/out.js?t=${Date.now()}`, {
                cache: 'no-store',
                headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache' }
            });
            code = await res.text();
            log(`Bundle fetched, size: ${(code.length / 1024).toFixed(0)}KB`);
        } catch (e) {
            warn('Failed to fetch game bundle:', e);
            return;
        }

        // ── Bundle patches ────────────────────────────────────────────────────
        // Strategy: find function headers by pattern, verify a unique anchor
        // string appears near the opening brace, then inject at that point.
        // This avoids brace-counting bugs in minified code.

        const findFunctionBodyContaining = (src, headerRegex, anchorStr, windowSize = 1500) => {
            const re = new RegExp(headerRegex.source, 'g');
            let m;
            while ((m = re.exec(src)) !== null) {
                const bodyStart = m.index + m[0].length;
                if (src.slice(bodyStart, bodyStart + windowSize).includes(anchorStr))
                    return { bodyStart, match: m };
            }
            return null;
        };

        // EXPORT PATCH — inject at the start of exportSynergism's body.
        // The function is async, takes a bool arg, and contains "Synergysave2".
        const exportResult = findFunctionBodyContaining(
            code,
            /([a-zA-Z_$][\w$]*)\s*=\s*async\s*\([^)]*!0[^)]*\)\s*=>\s*\{/,
            '"Synergysave2"'
        );
        if (exportResult) {
            const exportFn = exportResult.match[1];
            const expose = exportFn
                ? `\nif(!window.__HS_EXPORT_EXPOSED){window.__HS_exportData=${exportFn};window.__HS_EXPORT_EXPOSED=true;console.log('[HS] \u2705 exportSynergism exposed');if(window.__HS_SILENT_EXPORT)return;}\n`
                : `\nif(!window.__HS_EXPORT_EXPOSED){window.__HS_EXPORT_EXPOSED=true;console.log('[HS] \u26a0\ufe0f exportSynergism found but fn name unknown');if(window.__HS_SILENT_EXPORT)return;}\n`;
            code = code.slice(0, exportResult.bodyStart) + expose + code.slice(exportResult.bodyStart);
            log(`Patched exportSynergism (fn=${exportFn ?? 'unknown'})`);
        } else {
            warn('Could not patch exportSynergism — header not found');
        }

        // STAGE PATCH — inject at the entry of loadMiscellaneousStats.
        // Locate the unique anchor, extract variable names, find the enclosing
        // no-arg arrow function, and inject at its opening brace.
        const stageAnchorIdx = code.indexOf('"gameStageStatistic"');
        if (stageAnchorIdx !== -1) {
            const ctx = code.slice(Math.max(0, stageAnchorIdx - 80), stageAnchorIdx + 300);
            const domFn = ctx.match(/([a-zA-Z_$][\w$]*)\("gameStageStatistic"\)/)?.[1];
            const i18nObj = ctx.match(/\.innerHTML\s*=\s*([a-zA-Z_$][\w$]*)\.t\(/)?.[1];
            const stageFn = ctx.match(/\bstage\s*:\s*([a-zA-Z_$][\w$]*)\(/)?.[1];
            if (domFn && i18nObj && stageFn) {
                const expose = `if(!window.__HS_STAGE_EXPOSED){window.DOMCacheGetOrSet=${domFn};window.__HS_synergismStage=${stageFn};window.__HS_i18next=${i18nObj};window.__HS_STAGE_EXPOSED=true;window.__HS_EXPOSED=true;console.log('[HS] \u2705 Stage exposed (dom=${domFn} stage=${stageFn} i18n=${i18nObj})');}\n`;
                const backWin = code.slice(Math.max(0, stageAnchorIdx - 4000), stageAnchorIdx);
                const noArgArrow = /=\s*\(\s*\)\s*=>\s*\{/g;
                let am, lastBodyStart = -1;
                while ((am = noArgArrow.exec(backWin)) !== null) lastBodyStart = am.index + am[0].length;
                if (lastBodyStart !== -1) {
                    const insertAt = Math.max(0, stageAnchorIdx - 4000) + lastBodyStart;
                    code = code.slice(0, insertAt) + expose + code.slice(insertAt);
                    log(`Patched stage at fn entry (dom=${domFn} stage=${stageFn} i18n=${i18nObj})`);
                } else {
                    code = code.slice(0, stageAnchorIdx) + expose + code.slice(stageAnchorIdx);
                    log(`Patched stage via fallback injection (dom=${domFn} stage=${stageFn} i18n=${i18nObj})`);
                }
            } else {
                warn(`Stage var extraction failed — dom=${domFn} stage=${stageFn} i18n=${i18nObj}`);
            }
        } else {
            warn('Could not patch stage — "gameStageStatistic" not found in bundle');
        }

        log('v3.5 patch complete — waiting for DOM to be ready before injecting bundle');

        // Wait until the browser has finished parsing the HTML (DOMContentLoaded).
        // Checking document.body is not enough — the body element can exist while
        // the rest of the DOM is still being built, causing querySelector calls
        // inside the game bundle to hit null elements.
        if (document.readyState === 'loading') {
            await new Promise(resolve =>
                document.addEventListener('DOMContentLoaded', resolve, { once: true })
            );
        }
        await new Promise(r => setTimeout(r, 100));

        // ── Phase 2: Inject patched bundle ────────────────────────────────────
        allowCustomElements = true;
        log('Custom Elements unlocked — injecting patched bundle');

        const gameScript = document.createElement('script');
        gameScript.textContent = code;
        (document.body || document.head || document.documentElement).appendChild(gameScript);
        // The script has been parsed and executed — drop the source text so the
        // ~1.6 MB string can be garbage-collected.
        gameScript.textContent = '';

        // Clean up interception machinery — we no longer need any of it.
        try { mo.disconnect(); } catch { }
        if (isFirefox && beforeScriptExecute) {
            document.removeEventListener('beforescriptexecute', beforeScriptExecute, true);
        }
        customElements.define = origDefine;
        // Restore fetch — the block on /dist/out*.js is no longer needed.
        window.fetch = originalFetch;
        log('Bundle injected; interception cleaned up');

        // ── Phase 3: Ensure the game initialises ──────────────────────────────
        // The game hooks onto window's "load" event. When we inject the bundle
        // after window.load has already fired, the game never receives it, so
        // the player object is never set up. We fire a synthetic load event to
        // guarantee the game always initialises, regardless of timing.
        log('Dispatching synthetic load event to initialise game');
        window.dispatchEvent(new Event('load'));

        // ── Proceed to post-load phases ───────────────────────────────────────
        initBackdoor();
        runPostLoadSequence();
    }

    // ─── Phase 3 helper: expose __HS_BACKDOOR__ for external diagnostics ──────
    function initBackdoor() {
        const s = document.createElement('script');
        s.textContent = `
window.__HS_BACKDOOR__ = {
    get exposed() {
        return {
            synergismStage:      typeof window.__HS_synergismStage,
            DOMCacheGetOrSet:    typeof window.DOMCacheGetOrSet,
            i18next:             typeof window.__HS_i18next,
            exportData:          typeof window.__HS_exportData,
        };
    }
};`;
        (document.head || document.documentElement).appendChild(s);
        log('Backdoor ready');
    }

    // ─── Phases 4–6: Wait for game, dismiss offline modal, expose, load mod ──

    async function runPostLoadSequence() {
        try {
            // Phase 4: Wait for the game to finish loading.
            // The offline container is the game's own "loading done" signal —
            // it only appears after the save has been read and the UI is ready.
            log('Phase 4 — waiting for offlineContainer to appear...');
            await waitFor(
                () => {
                    const el = document.getElementById('offlineContainer');
                    return el && getComputedStyle(el).display !== 'none';
                },
                60000,
                'offlineContainer to become visible'
            );
            log('offlineContainer visible — game is loaded');

            // Dismiss the offline container.
            const offlineContainer = document.getElementById('offlineContainer');
            log('Dismissing offlineContainer...');
            const exitBtn = document.getElementById('exitOffline')
                || offlineContainer.querySelector('button');
            if (exitBtn) exitBtn.click();

            // Wait 100 ms for the dismissal animation and any post-modal setup.
            await new Promise(r => setTimeout(r, 100));

            // Phase 5: Trigger exposure by navigating to Settings → Misc → Export.
            log('Phase 5 — navigating to Settings to trigger exposure...');
            await clickWhenAvailable('settingstab');
            await new Promise(r => setTimeout(r, 300));
            await clickWhenAvailable('switchSettingSubTab4');
            await new Promise(r => setTimeout(r, 300));
            await clickWhenAvailable('kMisc');
            await new Promise(r => setTimeout(r, 300));

            // Trigger exportSynergism silently to expose __HS_exportData.
            window.__HS_SILENT_EXPORT = true;
            await clickWhenAvailable('exportgame');
            window.__HS_SILENT_EXPORT = false;

            // Wait for both exposure flags.
            log('Waiting for stage and export exposure flags...');
            await waitFor(
                () => window.__HS_EXPOSED && window.__HS_EXPORT_EXPOSED,
                20000,
                '__HS_EXPOSED and __HS_EXPORT_EXPOSED'
            );
            log('Exposure complete — stage and export are ready');

            // Return to Buildings tab so the game looks normal to the player.
            await clickWhenAvailable('buildingstab');
            await new Promise(r => setTimeout(r, 300));

            // Phase 6: Load the mod.
            log('Phase 6 — loading mod from CDN...');
            await loadMod();

        } catch (e) {
            warn('Post-load sequence failed:', e);
        }
    }

    function loadMod() {
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = `https://cdn.jsdelivr.net/gh/maenhiir/synergism-hypersynergy@latest/release/mod/hypersynergism_release.js?${Date.now()}`;
            s.onload = () => {
                log('✅ Mod script loaded from CDN');
                try {
                    window.hypersynergism.init();
                    log('✅ Mod initialised');
                } catch (e) {
                    warn('Mod init failed:', e);
                }
                resolve();
            };
            s.onerror = () => {
                warn('❌ Mod failed to load from CDN');
                reject(new Error('Mod CDN load failed'));
            };
            (document.head || document.documentElement).appendChild(s);
        });
    }

    log('LOADER v3.5 (Shewchou) initialised');

})();
