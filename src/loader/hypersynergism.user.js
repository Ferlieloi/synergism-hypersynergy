// ==UserScript==
// @name         HyperSynergism Loader
// @namespace    https://github.com/Ferlieloi
// @version      3.4
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
    log(`Browser: ${isFirefox ? 'Firefox' : 'Other'}`);

    let windowLoadFired = false;
    let gameScriptDetected = false;
    let patchedScriptInjected = false;
    let allowCustomElements = false; // LOCK definitions by default

    // CRITICAL FIX: Override customElements.define to BLOCK the original script
    // If the original script runs, it will try to define elements. We IGNORE it.
    // This effectively causes the original script to crash (safely) or fail to register,
    // leaving the registry clean for our patched script.
    const origDefine = customElements.define;
    customElements.define = function (name, ctor, options) {
        if (!allowCustomElements) {
            // Log once per unique name to avoid spam, but BLOCK IT.
            // This prevents the "Illegal constructor" error later because the Old_o0 won't be in the registry.
            // The Original Script will likely crash when it tries `new o0()`, which is GOOD (it stops it).
            if (!customElements.get(name)) {
                debug(`[HS] Blocked original script from defining ${name} (Lock active)`);
            }
            return;
        }

        // Standard duplicate check
        if (customElements.get(name)) return;
        return origDefine.call(this, name, ctor, options);
    };

    // Track when window.load fires
    window.addEventListener('load', () => {
        windowLoadFired = true;
        log('Window load fired');
    }, { once: true });

    function shouldBlockScript(src) {
        return src.includes('rocket-loader') || /\/dist\/out.*\.js/.test(src);
    }

    // Block fetch requests
    window.fetch = async function (input, init) {
        const url = typeof input === 'string'
            ? input
            : input instanceof Request
                ? input.url
                : '';

        if (url.includes('rocket-loader') || (url.includes('/dist/out') && url.endsWith('.js'))) {
            debug(`Fetch blocked: ${url.substring(0, 80)}...`);
            return new Response('', { status: 200 });
        }
        return originalFetch(input, init);
    };

    // Firefox-specific: Use beforescriptexecute event
    let beforeScriptExecute;
    if (isFirefox) {
        beforeScriptExecute = function (e) {
            const script = e.target;
            const src = script.src || '';

            if (shouldBlockScript(src)) {
                e.preventDefault();
                e.stopPropagation();
                script.remove();
                log(`Blocked (beforescriptexecute): ${src.substring(0, 60)}...`);

                if (!gameScriptDetected && /\/dist\/out.*\.js/.test(src)) {
                    gameScriptDetected = true;
                    setTimeout(injectPatchedBundle, 0);
                }
            }
        };
        document.addEventListener('beforescriptexecute', beforeScriptExecute, true);
    }

    // MutationObserver for Chrome and fallback
    const mo = new MutationObserver(muts => {
        for (const m of muts) {
            for (const n of m.addedNodes) {
                if (n.tagName === 'SCRIPT') {
                    const src = n.src || '';
                    if (shouldBlockScript(src)) {
                        n.type = 'javascript/blocked';
                        n.remove();
                        debug(`Blocked (MutationObserver): ${src.substring(0, 60)}...`);

                        if (!gameScriptDetected && /\/dist\/out.*\.js/.test(src)) {
                            gameScriptDetected = true;
                            setTimeout(injectPatchedBundle, 0);
                        }
                    }
                }
            }
        }
    });

    mo.observe(document.documentElement, { childList: true, subtree: true });

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

    async function injectPatchedBundle() {
        if (window.__HS_INJECTED__) return;
        window.__HS_INJECTED__ = true;

        log('Fetching game bundle...');

        try {
            const res = await originalFetch(`https://synergism.cc/dist/out.js?t=${Date.now()}`, {
                cache: 'no-store',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache'
                }
            });

            let code = await res.text();
            log(`Bundle fetched, size: ${(code.length / 1024).toFixed(0)}KB`);

            // ============================================================
            // EXPORT + STAGE PATCHES v3.4
            // ============================================================
            // Strategy: scan for function HEADER patterns, then verify the
            // unique anchor string appears shortly after the opening '{'.
            // This avoids brace-counting bugs caused by {/} inside string
            // literals and template expressions in minified code.
            // ============================================================

            // Helper: scan all occurrences of headerRegex, return the index
            // right after the '{' of the FIRST match where anchorStr appears
            // within `windowSize` chars of that '{'.
            const findFunctionBodyContaining = (src, headerRegex, anchorStr, windowSize = 1500) => {
                const re = new RegExp(headerRegex.source, 'g');
                let m;
                while ((m = re.exec(src)) !== null) {
                    const bodyStart = m.index + m[0].length; // char after '{'
                    const slice = src.slice(bodyStart, bodyStart + windowSize);
                    if (slice.includes(anchorStr)) return { bodyStart, match: m };
                }
                return null;
            };

            // ── EXPORT PATCH ─────────────────────────────────────────────
            // exportSynergism is an async function containing "Synergysave2"
            const exportResult = findFunctionBodyContaining(
                code,
                /=async\s*\([^)]*\)\s*=>\s*\{/,
                '"Synergysave2"'
            );

            if (exportResult) {
                const exportTailRegex = /await\s+([a-zA-Z_$][\w$]*)\s*\(\s*[a-zA-Z_$][\w$]*\s*,\s*[a-zA-Z_$][\w$]*\s*\(\s*\)\s*\)/;
                const tailMatch = code.slice(exportResult.bodyStart, exportResult.bodyStart + 1500).match(exportTailRegex);
                const exportFn = tailMatch ? tailMatch[1] : null;

                const expose = exportFn
                    ? `\nif(!window.__HS_EXPORT_EXPOSED){window.__HS_exportData=${exportFn};window.__HS_EXPORT_EXPOSED=true;console.log('[HS] \u2705 exportSynergism exposed');}\n`
                    : `\nif(!window.__HS_EXPORT_EXPOSED){window.__HS_EXPORT_EXPOSED=true;console.log('[HS] \u26a0\ufe0f exportSynergism found but fn name unknown');}\n`;

                const { bodyStart: exportBodyStart } = exportResult;
                code = code.slice(0, exportBodyStart) + expose + code.slice(exportBodyStart);
                log(`Patched exportSynergism (fn=${exportFn ?? 'unknown'})`);
            } else {
                warn('Could not patch exportSynergism — header not found');
            }

            // ── STAGE PATCH ──────────────────────────────────────────────
            // loadMiscellaneousStats is a simple () => { } containing "gameStageStatistic"
            const stageResult = findFunctionBodyContaining(
                code,
                /[a-zA-Z_$][\w$]*\s*=\s*\(\s*\)\s*=>\s*\{/,
                '"gameStageStatistic"'
            );

            if (stageResult) {
                const bodySlice = code.slice(stageResult.bodyStart, stageResult.bodyStart + 2500);
                const stageInnerRegex = /([a-zA-Z_$][\w$]*)\("gameStageStatistic"\)\.innerHTML\s*=\s*([a-zA-Z_$][\w$]*)\.t\("statistics\.gameStage"\s*,\s*\{\s*stage\s*:\s*([a-zA-Z_$][\w$]*)\(/;
                const innerMatch = bodySlice.match(stageInnerRegex);

                let expose;
                if (innerMatch) {
                    const domFn = innerMatch[1];
                    const i18nObj = innerMatch[2];
                    const stageFn = innerMatch[3];
                    expose = `\nif(!window.__HS_STAGE_EXPOSED){window.DOMCacheGetOrSet=${domFn};window.__HS_synergismStage=${stageFn};window.__HS_i18next=${i18nObj};window.__HS_STAGE_EXPOSED=true;window.__HS_EXPOSED=true;console.log('[HS] \u2705 Stage internals exposed');}\n`;
                    log(`Patched loadMiscellaneousStats (dom=${domFn} stage=${stageFn} i18n=${i18nObj})`);
                } else {
                    expose = `\nif(!window.__HS_STAGE_EXPOSED){window.__HS_STAGE_EXPOSED=true;window.__HS_EXPOSED=true;console.log('[HS] \u26a0\ufe0f Stage fn found but inner names unknown');}\n`;
                    warn('Could not extract fn names from loadMiscellaneousStats body');
                }

                const { bodyStart: stageBodyStart } = stageResult;
                code = code.slice(0, stageBodyStart) + expose + code.slice(stageBodyStart);
            } else {
                warn('Could not patch loadMiscellaneousStats — header not found');
            }

            log('v3.4 [2026-02-21] patch complete — injecting bundle');

            const gameScript = document.createElement('script');
            gameScript.textContent = code;

            // CRITICAL: Wait for body to ensure game script doesn't crash on early querySelectors
            if (!document.body) {
                log('Waiting for body before injection...');
                await new Promise(resolve => {
                    const observer = new MutationObserver(() => {
                        if (document.body) {
                            observer.disconnect();
                            resolve();
                        }
                    });
                    observer.observe(document.documentElement, { childList: true });
                });
            }

            // UNLOCK DEFINITIONS JUST BEFORE INJECTION
            allowCustomElements = true;
            log('Custom Elements unlocked for patched bundle');

            (document.body || document.head || document.documentElement).appendChild(gameScript);
            try {
                mo.disconnect();
                log('MutationObserver disconnected');
            } catch { }

            if (isFirefox && beforeScriptExecute) {
                document.removeEventListener('beforescriptexecute', beforeScriptExecute, true);
                log('beforescriptexecute listener removed');
            }
            customElements.define = origDefine;
            log('customElements.define restored');
            patchedScriptInjected = true;
            log('Game script injected');

            if (windowLoadFired) {
                log('Manually triggering game initialization...');
                await manuallyInitializeGame();
            }

            setTimeout(initBackdoor, 1500);
            waitForOfflineContainerClosed().then(() => {
                setTimeout(loadModAfterExposure, 100);
            });

        } catch (e) {
            warn('Failed to load game:', e);
        }
    }

    async function manuallyInitializeGame() {
        await new Promise(r => setTimeout(r, 100));
        log('Attempting to dispatch synthetic load event...');
        const initScript = document.createElement('script');
        initScript.textContent = `
(async () => {
    console.log('[HS] Manual init: checking for reloadShit...');
    await new Promise(r => setTimeout(r, 50));
    try {
        window.dispatchEvent(new Event('load'));
        console.log('[HS] Manual init: dispatched load event');
    } catch(e) {
        console.warn('[HS] Manual init: load dispatch failed', e);
    }
})();
`;
        document.head.appendChild(initScript);
        await new Promise(r => setTimeout(r, 500));
        if (window.player) {
            log('Manual init successful - player exists');
        } else {
            warn('Manual init may have failed - player not found');
            warn('You may need to refresh the page');
        }
    }

    function initBackdoor() {
        const s = document.createElement('script');
        s.textContent = `
window.__HS_BACKDOOR__ = {
    get exposed() {
        return {
            synergismStage: typeof window.__HS_synergismStage,
            DOMCacheGetOrSet: typeof window.DOMCacheGetOrSet,
            loadStatistics: typeof window.__HS_loadStatistics,
            loadMiscellaneousStats: typeof window.__HS_loadMiscellaneousStats,
            i18next: typeof window.__HS_i18next
        };
    }
};
`;
        (document.head || document.documentElement).appendChild(s);
        log('Backdoor ready');
    }

    function clickWhenAvailable(id) {
        return new Promise(resolve => {
            const start = performance.now();
            const MAX = 15000;

            (function check() {
                const el = document.getElementById(id);
                if (el) {
                    const events = ['mousedown', 'mouseup', 'click'];
                    for (const type of events) {
                        el.dispatchEvent(new MouseEvent(type, {
                            bubbles: true,
                            cancelable: true,
                            view: window
                        }));
                    }
                    requestAnimationFrame(() => resolve(true));
                    return;
                }
                if (performance.now() - start > MAX) {
                    warn(`Timed out waiting for #${id}`);
                    resolve(false);
                    return;
                }
                requestAnimationFrame(check);
            })();
        });
    }

    async function waitForOfflineContainerClosed() {
        const start = performance.now();
        const MAX = 60000;
        let seenOpen = false;
        log('Waiting for offlineContainer...');
        return new Promise(resolve => {
            (function check() {
                const container = document.getElementById('offlineContainer');
                if (container) {
                    const style = getComputedStyle(container);
                    if (style.display !== 'none') {
                        seenOpen = true;
                        const exitBtn = document.getElementById('exitOffline');
                        if (exitBtn) exitBtn.click();
                    } else if (seenOpen) {
                        log('offlineContainer closed, UI ready');
                        resolve(true);
                        return;
                    }
                }
                if (performance.now() - start > MAX) {
                    warn('Offline container wait timed out, forcing proceed');
                    resolve(false);
                    return;
                }
                requestAnimationFrame(check);
            })();
        });
    }

    async function exposeViaUI() {
        await clickWhenAvailable('settingstab');
        await new Promise(r => setTimeout(r, 50));
        await clickWhenAvailable('switchSettingSubTab4');
        await new Promise(r => setTimeout(r, 5));
        await clickWhenAvailable('kMisc');
        await new Promise(r => setTimeout(r, 5));
        // Auto-check export checkbox and click export, mirroring in-mod behavior
        const saveType = document.getElementById('saveType');
        if (saveType && 'checked' in saveType) {
            saveType.checked = true;
            saveType.dispatchEvent(new Event('change', { bubbles: true }));
        }
        const exportBtn = document.getElementById('exportgame');
        if (exportBtn) {
            log('exposing export button');
            exportBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }
        const start = performance.now();
        const MAX = 15000;
        return new Promise(resolve => {
            (function waitExpose() {
                if (window.__HS_EXPOSED) {
                    resolve(true);
                    return;
                }
                if (performance.now() - start > MAX) {
                    warn('Exposure wait timed out');
                    resolve(false);
                    return;
                }
                requestAnimationFrame(waitExpose);
            })();
        });
    }

    async function returnToBuildingsTab() {
        await clickWhenAvailable('buildingstab');
        await new Promise(r => setTimeout(r, 100));
    }

    async function loadModAfterExposure() {
        const ok = await exposeViaUI();
        if (!ok) return;

        await returnToBuildingsTab();

        log('Loading mod');

        const s = document.createElement('script');
        s.src = `https://cdn.jsdelivr.net/gh/Ferlieloi/synergism-hypersynergy@latest/release/mod/hypersynergism_release.js?${Date.now()}`;

        s.onload = () => {
            log('Mod script loaded');
            try {
                window.hypersynergism.init();
            } catch (e) {
                warn('Mod init failed:', e);
            }
        };

        s.onerror = () => warn('Mod failed to load');
        (document.head || document.documentElement).appendChild(s);
    }

    log('Initialized');

})();
