// ==UserScript==
// @name         HyperSynergism Dev Loader
// @namespace    https://github.com/Ferlieloi
// @version      3.5b-dev
// @description  Dev loader for HyperSynergism mod
// @match        https://synergism.cc/*
// @grant        none
// @run-at       document-start
// @license      MIT
// ==/UserScript==

(() => {
    'use strict';

    // Phase 0: single-instance guard
    if (window.HS_LOADER_INITIALIZED) return;
    window.HS_LOADER_INITIALIZED = true;

    // Shared logger helpers (timing-prefixed)
    const startTime = performance.now();
    const log = (...a) => console.log(`%c[HS-DEV +${(performance.now() - startTime).toFixed(0)}ms]`, 'color:#4af', ...a);
    const warn = (...a) => console.warn(`%c[HS-DEV +${(performance.now() - startTime).toFixed(0)}ms]`, 'color:#fa4', ...a);
    const debug = (...a) => console.debug(`%c[HS-DEV +${(performance.now() - startTime).toFixed(0)}ms]`, 'color:#aaa', ...a);
    const logExposureTimeline = (step, extra = {}) => {
        try {
            const payload = {
                step,
                tMs: Math.round(performance.now() - startTime),
                playerExposeState: window.__HS_PLAYER_EXPOSED,
                hsPlayerType: typeof window.__HS_player,
                windowPlayerType: typeof window.player,
                ...extra
            };
            console.log('%c[HS-EXPOSE]', 'color:#7cf', payload);
        } catch (e) {
            debug('logExposureTimeline failed', e);
        }
    };

    const originalFetch = window.fetch.bind(window);

    const isFirefox = navigator.userAgent.includes('Firefox');
    log(`Browser: ${isFirefox ? 'Firefox' : 'Other'}`);

    // Bundle debug helpers can be toggled at runtime via window.__HS_DUMP_PATCHED_BUNDLE_FULL
    const HS_DUMP_PATCHED_BUNDLE = true;

    // Runtime diagnostics exposed to window.__HS_LOADER_DIAGNOSTICS
    const loaderDiagnostics = {
        customElements: {
            blockedCount: 0,
            allowedCount: 0,
            duplicateSkippedCount: 0,
            blockedNamesSample: [],
            allowedNamesSample: [],
            tabRowFallbackCount: 0,
            tabRowFallbackReasonsSample: [],
            subTabFallbackCount: 0,
            subTabFallbackReasonsSample: []
        },
        exportSilence: {
            attempts: 0,
            blockedAnchorClicks: 0,
            lastBlockedDownloadName: null
        },
        blockedScripts: [],
        lifecycle: {
            injectedAtMs: null,
            postInjectHealthAtMs: null,
            firstFatalErrorAtMs: null,
            manualInitAttempts: 0
        }
    };

    window.__HS_LOADER_DIAGNOSTICS = loaderDiagnostics;

    const isSilentExportActive = () => {
        const until = Number(window.__HS_SILENT_EXPORT_UNTIL || 0);
        return window.__HS_SILENT_EXPORT === true || until > Date.now();
    };

    const originalAnchorClick = HTMLAnchorElement.prototype.click;
    // Guard save-download side effects when export is intentionally triggered for probing.
    HTMLAnchorElement.prototype.click = function (...args) {
        try {
            const href = this.href || '';
            const downloadName = this.getAttribute('download') || '';
            const looksLikeSaveDownload = !!downloadName || href.startsWith('blob:') || /Synergysave/i.test(href);

            if (isSilentExportActive() && looksLikeSaveDownload) {
                loaderDiagnostics.exportSilence.blockedAnchorClicks += 1;
                loaderDiagnostics.exportSilence.lastBlockedDownloadName = downloadName || href.slice(0, 120);
                debug('[HS] Blocked export download click during silent export window', {
                    href: href.slice(0, 120),
                    download: downloadName
                });
                return;
            }
        } catch {
            // Ignore guard errors and fall through to native behavior
        }

        return originalAnchorClick.apply(this, args);
    };

    const hasMeaningfulErrorDetails = (event) => {
        if (!event) return false;
        const hasMessage = typeof event.message === 'string' && event.message.trim().length > 0;
        const hasFile = typeof event.filename === 'string' && event.filename.trim().length > 0;
        const hasLine = Number.isFinite(event.lineno) && event.lineno > 0;
        const hasColumn = Number.isFinite(event.colno) && event.colno > 0;
        const hasErrorObject = event.error != null;
        return hasMessage || hasFile || hasLine || hasColumn || hasErrorObject;
    };

    window.addEventListener('error', (event) => {
        const isMeaningful = hasMeaningfulErrorDetails(event);

        if (isMeaningful && loaderDiagnostics.lifecycle.firstFatalErrorAtMs == null) {
            loaderDiagnostics.lifecycle.firstFatalErrorAtMs = Math.round(performance.now() - startTime);
        }

        const payload = {
            message: event.message,
            filename: event.filename,
            line: event.lineno,
            column: event.colno,
            error: event.error ? String(event.error) : undefined,
            stack: event.error?.stack,
            allowCustomElements,
            diagnostics: loaderDiagnostics
        };

        if (isMeaningful) {
            warn('[HS] Global error captured', payload);
        } else {
            debug('[HS] Global error event with empty payload (likely extension/runtime noise)', payload);
        }
    }, true);

    window.addEventListener('unhandledrejection', (event) => {
        warn('[HS] Unhandled rejection captured', {
            reason: event.reason,
            allowCustomElements,
            diagnostics: loaderDiagnostics
        });
    });

    let windowLoadFired = false;
    let gameScriptDetected = false;
    let allowCustomElements = false;
    let manualInitInFlight = null;

    // Phase 1: hard-lock custom element registration during interception race windows.
    // This blocks any early original-script define() calls until we inject the patched bundle.
    // Duplicate guard remains active after unlock for safety.
    const origDefine = customElements.define;
    customElements.define = function (name, ctor, options) {
        if (!allowCustomElements) {
            // Optional strict mode hook: when explicitly disabled, skip new registrations.
            // Log once per unique name to avoid spam.
            if (!customElements.get(name)) {
                loaderDiagnostics.customElements.blockedCount += 1;
                if (loaderDiagnostics.customElements.blockedNamesSample.length < 8) {
                    loaderDiagnostics.customElements.blockedNamesSample.push(String(name));
                }
                debug(`[HS] Blocked original script from defining ${name} (Lock active)`);
            }
            return;
        }

        // Standard duplicate check
        if (customElements.get(name)) {
            loaderDiagnostics.customElements.duplicateSkippedCount += 1;
            return;
        }
        loaderDiagnostics.customElements.allowedCount += 1;
        if (loaderDiagnostics.customElements.allowedNamesSample.length < 8) {
            loaderDiagnostics.customElements.allowedNamesSample.push(String(name));
        }
        return origDefine.call(this, name, ctor, options);
    };

    // Track when window.load fires (used by manual-init logic under throttled/background tabs).
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

        if (shouldBlockScript(url)) {
            if (loaderDiagnostics.blockedScripts.length < 10) {
                loaderDiagnostics.blockedScripts.push(url);
            }
            debug(`Fetch blocked: ${url.substring(0, 80)}...`);
            return new Response('', { status: 200 });
        }
        return originalFetch(input, init);
    };

    // Firefox-specific interception path
    let beforeScriptExecute;
    if (isFirefox) {
        beforeScriptExecute = function (e) {
            const script = e.target;
            const src = script.src || '';

            if (shouldBlockScript(src)) {
                if (loaderDiagnostics.blockedScripts.length < 10) {
                    loaderDiagnostics.blockedScripts.push(src);
                }
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

    // Chromium + fallback interception path
    const mo = new MutationObserver(muts => {
        for (const m of muts) {
            for (const n of m.addedNodes) {
                if (n.tagName === 'SCRIPT') {
                    const src = n.src || '';
                    if (shouldBlockScript(src)) {
                        if (loaderDiagnostics.blockedScripts.length < 10) {
                            loaderDiagnostics.blockedScripts.push(src);
                        }
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
                debug('Found pre-existing game script tag; removing and forcing patched injection');
                if (loaderDiagnostics.blockedScripts.length < 10) {
                    loaderDiagnostics.blockedScripts.push(script.src);
                }
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

    // Phase 2: fetch, patch, and inject official game bundle
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
            // EXPORT + STAGE PATCHES v3.4-dev [2026-02-21]
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
                /([a-zA-Z_$][\w$]*)\s*=\s*async\s*\([^)]*!0[^)]*\)\s*=>\s*\{/,
                '"Synergysave2"'
            );

            if (exportResult) {
                const exportFn = exportResult.match[1];
                const { bodyStart: exportBodyStart } = exportResult;
                debug(`exportSynergism probe: bodyStart=${exportBodyStart} fn=${exportFn ?? 'unknown'}`);

                const exportExpose = exportFn
                    ? `\nif(!window.__HS_EXPORT_EXPOSED){window.__HS_exportData=${exportFn};window.__HS_EXPORT_EXPOSED=true;console.log('[HS] \u2705 exportSynergism exposed');}\n`
                    : `\nif(!window.__HS_EXPORT_EXPOSED){window.__HS_EXPORT_EXPOSED=true;console.log('[HS] \u26a0\ufe0f exportSynergism found but fn name unknown');}\n`;

                const expose = exportExpose + `if(window.__HS_SILENT_EXPORT)return;\n`;

                code = code.slice(0, exportBodyStart) + expose + code.slice(exportBodyStart);
                log(`Patched exportSynergism (fn=${exportFn ?? 'unknown'})`);
            } else {
                warn('Could not patch exportSynergism — header not found');
            }

            // ── WINDOW DEFINE PLAYER PATCH ─────────────────────────────
            // Most robust path on some builds: Object.defineProperties(window, { player: { value:<sym> }, ... })
            const defineWindowMatch = /Object\.defineProperties\(window,\s*\{\s*player\s*:\s*\{\s*value\s*:\s*([a-zA-Z_$][\w$]*)\s*\}/.exec(code);
            const defineWindowIdx = defineWindowMatch?.index ?? -1;
            const playerVarFromDefine = defineWindowMatch?.[1];

            if (defineWindowIdx !== -1) {
                debug(`define player probe: idx=${defineWindowIdx} playerVar=${playerVarFromDefine ?? 'unknown'}`);

                if (playerVarFromDefine) {
                    const definePlayerExposeExpr = `((window.__HS_PLAYER_EXPOSED&&window.__HS_PLAYER_EXPOSED!=='missing')||((window.__HS_player=${playerVarFromDefine}),(window.player=${playerVarFromDefine}),(window.__HS_PLAYER_EXPOSED='define-window'),console.log('[HS] \u2705 player exposed via defineProperties (sym=${playerVarFromDefine})'))),`;
                    code = code.slice(0, defineWindowIdx) + definePlayerExposeExpr + code.slice(defineWindowIdx);
                    log(`Patched defineProperties player exposure (player=${playerVarFromDefine})`);
                    logExposureTimeline('patch-define-inserted', { defineWindowIdx, playerSymbol: playerVarFromDefine });
                } else {
                    warn('defineProperties player patch: anchor found but symbol extraction failed');
                    logExposureTimeline('patch-define-symbol-missing', { defineWindowIdx });
                }
            } else {
                warn('Could not patch defineProperties player exposure — anchor not found');
                logExposureTimeline('patch-define-anchor-missing');
            }

            // ── STAGE PATCH ──────────────────────────────────────────────
            // Step 1: locate the anchor string with indexOf (guaranteed match if
            // the string exists, regardless of surrounding whitespace/formatting).
            // Step 2: extract each variable name with small, independent patterns
            // instead of one monolithic regex that fails if any part changes.
            // Step 3: find the enclosing no-arg arrow function and inject at its
            // ENTRY — so ANY call to loadMiscellaneousStats exposes the vars,
            // not just the specific code path that reaches the innerHTML line.
            const stageAnchorIdx = code.indexOf('"gameStageStatistic"');

            if (stageAnchorIdx !== -1) {
                const ctx = code.slice(Math.max(0, stageAnchorIdx - 80), stageAnchorIdx + 300);
                const domFn = ctx.match(/([a-zA-Z_$][\w$]*)\("gameStageStatistic"\)/)?.[1];
                const i18nObj = ctx.match(/\.innerHTML\s*=\s*([a-zA-Z_$][\w$]*)\.t\(/)?.[1];
                const stageFn = ctx.match(/\bstage\s*:\s*([a-zA-Z_$][\w$]*)\(/)?.[1];

                if (domFn && i18nObj && stageFn) {
                    const expose = `if(!window.__HS_STAGE_EXPOSED){window.DOMCacheGetOrSet=${domFn};window.__HS_synergismStage=${stageFn};window.__HS_i18next=${i18nObj};window.__HS_STAGE_EXPOSED=true;window.__HS_EXPOSED=true;console.log('[HS] \u2705 Stage exposed (dom=${domFn} stage=${stageFn} i18n=${i18nObj})');}\n`;

                    // Walk back up to 4000 chars, find the LAST no-arg arrow fn before anchor.
                    // loadMiscellaneousStats is always ()=>{ in minified output.
                    const backWin = code.slice(Math.max(0, stageAnchorIdx - 4000), stageAnchorIdx);
                    const noArgArrow = /=\s*\(\s*\)\s*=>\s*\{/g;
                    let am, lastBodyStart = -1;
                    while ((am = noArgArrow.exec(backWin)) !== null) lastBodyStart = am.index + am[0].length;

                    if (lastBodyStart !== -1) {
                        const insertAt = Math.max(0, stageAnchorIdx - 4000) + lastBodyStart;
                        code = code.slice(0, insertAt) + expose + code.slice(insertAt);
                        log(`Patched stage at fn entry (dom=${domFn} stage=${stageFn} i18n=${i18nObj})`);
                    } else {
                        // Fallback: inject right before the anchor line
                        code = code.slice(0, stageAnchorIdx) + expose + code.slice(stageAnchorIdx);
                        log(`Patched stage via fallback injection (dom=${domFn} stage=${stageFn} i18n=${i18nObj})`);
                    }
                } else {
                    warn(`Stage var extraction failed — dom=${domFn} stage=${stageFn} i18n=${i18nObj}`);
                }
            } else {
                warn('Could not patch stage — "gameStageStatistic" not found in bundle');
            }

            // ── CUSTOM ELEMENT CONSTRUCTOR PATCH ─────────────────────
            // On some race paths, direct customized built-in constructors throw
            // Illegal constructor. We shim those constructors and preserve shape.
            let tabRowCtorPatched = false;
            const tabRowDefinePattern = /customElements\.define\("tab-row",([A-Za-z_$][\w$]*),\{extends:"div"\}\);/;
            const tabRowDefineMatch = tabRowDefinePattern.exec(code);
            let tabRowCtorSymbol = null;
            let tabRowCtorReplacements = 0;
            if (tabRowDefineMatch) {
                tabRowCtorSymbol = tabRowDefineMatch[1];
                const tabRowDefineToken = tabRowDefineMatch[0];
                const safeTabRowCtorHelper = `const __HS_ORIG_TABROW=${tabRowCtorSymbol};const __HS_SAFE_NEW_TABROW=()=>{const existing=document.getElementById("tabrow");if(existing)return existing;try{return new __HS_ORIG_TABROW()}catch(_e){const __hsDiag=window.__HS_LOADER_DIAGNOSTICS&&window.__HS_LOADER_DIAGNOSTICS.customElements?window.__HS_LOADER_DIAGNOSTICS.customElements:null;if(__hsDiag){__hsDiag.tabRowFallbackCount=(__hsDiag.tabRowFallbackCount||0)+1;const reason=String(_e&&(_e.message||_e)||"unknown");if(Array.isArray(__hsDiag.tabRowFallbackReasonsSample)&&reason&&__hsDiag.tabRowFallbackReasonsSample.length<10&&!__hsDiag.tabRowFallbackReasonsSample.includes(reason)){__hsDiag.tabRowFallbackReasonsSample.push(reason);}}const row=document.createElement("div");row.id="tabrow";row.__HS_subTabs=[];row.appendButton=(...tabs)=>{for(const tab of tabs){if(!tab)continue;let candidate=tab;if(tab.id){const existingTab=document.getElementById(tab.id);if(existingTab&&existingTab!==tab)candidate=existingTab;}if(!row.__HS_subTabs.includes(candidate))row.__HS_subTabs.push(candidate);if(candidate.parentElement===row)continue;try{row.appendChild(candidate);}catch(_a){}}return row;};row.getSubTabs=()=>row.__HS_subTabs;row.getCurrentTab=()=>{for(const tab of row.__HS_subTabs){try{if(typeof tab?.getSelectedState==="function"&&tab.getSelectedState())return tab;if(tab?.__HS_selected===true)return tab;}catch(_b){}}return row.__HS_subTabs[0]||{isUnlocked:()=>true,getUnlockedState:()=>true,getType:()=>0};};row.setCurrentTab=(idx)=>{const i=Number(idx)||0;row.__HS_subTabs.forEach((tab,n)=>{if(!tab)return;try{if(typeof tab.setSelectedState==="function")tab.setSelectedState(n===i);else tab.__HS_selected=(n===i);}catch(_c){}});return row;};return row;}};`;
                const tabRowInsertAt = tabRowDefineMatch.index + tabRowDefineToken.length;
                code = code.slice(0, tabRowInsertAt) + safeTabRowCtorHelper + code.slice(tabRowInsertAt);

                // Handle both minified constructor forms: `x=new Sym;` and `x=new Sym(...)`.
                const newTabRowCtorPattern = new RegExp(`(=\\s*)new\\s+${tabRowCtorSymbol}\\b(\\s*\\()?`, 'g');
                code = code.replace(newTabRowCtorPattern, (_match, prefix, openParen) => {
                    tabRowCtorReplacements += 1;
                    return openParen ? `${prefix}__HS_SAFE_NEW_TABROW(` : `${prefix}__HS_SAFE_NEW_TABROW()`;
                });

                if (tabRowCtorReplacements > 0) {
                    tabRowCtorPatched = true;
                    log(`Patched tab-row construction (new ${tabRowCtorSymbol} -> __HS_SAFE_NEW_TABROW, ${tabRowCtorReplacements} site${tabRowCtorReplacements === 1 ? '' : 's'})`);
                } else {
                    warn(`Could not patch tab-row construction — new ${tabRowCtorSymbol}(...) assignment pattern not found`);
                }
            } else {
                warn('Could not patch tab-row constructor shim — tab-row define pattern not found');
            }

            // ── SUB-TAB CONSTRUCTOR PATCH ─────────────────────────────
            // If sub-tab is already registered from another execution path, direct
            // `new lr(config)` can throw Illegal constructor. Use a safe shim.
            let subTabCtorPatched = false;
            const subTabDefinePattern = /customElements\.define\("sub-tab",([A-Za-z_$][\w$]*),\{extends:"button"\}\);/;
            const subTabDefineMatch = subTabDefinePattern.exec(code);
            let subTabCtorSymbol = null;
            let subTabCtorReplacements = 0;
            if (subTabDefineMatch) {
                subTabCtorSymbol = subTabDefineMatch[1];
                const subTabDefineToken = subTabDefineMatch[0];
                const safeSubTabCtorHelper = `const __HS_ORIG_SUBTAB=${subTabCtorSymbol};const __HS_SAFE_NEW_SUBTAB=(cfg)=>{const safeCfg=(cfg&&typeof cfg==="object")?cfg:{};if(safeCfg.id){const existing=document.getElementById(safeCfg.id);if(existing)return existing;}try{return new __HS_ORIG_SUBTAB(safeCfg)}catch(_e){const __hsDiag=window.__HS_LOADER_DIAGNOSTICS&&window.__HS_LOADER_DIAGNOSTICS.customElements?window.__HS_LOADER_DIAGNOSTICS.customElements:null;if(__hsDiag){__hsDiag.subTabFallbackCount=(__hsDiag.subTabFallbackCount||0)+1;const reason=String(_e&&(_e.message||_e)||"unknown");if(Array.isArray(__hsDiag.subTabFallbackReasonsSample)&&reason&&__hsDiag.subTabFallbackReasonsSample.length<10&&!__hsDiag.subTabFallbackReasonsSample.includes(reason)){__hsDiag.subTabFallbackReasonsSample.push(reason);}}const el=document.createElement("button");el.__HS_tabType=0;el.__HS_unlocked=true;el.__HS_visible=true;el.__HS_enabled=true;el.__HS_selected=false;if(safeCfg.id)el.id=safeCfg.id;if(safeCfg.class)el.className=safeCfg.class;if(safeCfg.i18n){el.dataset.i18n=safeCfg.i18n;el.setAttribute("data-i18n",safeCfg.i18n);}if(typeof el.setType!=="function")el.setType=(v)=>{el.__HS_tabType=Number(v);return el;};if(typeof el.getType!=="function")el.getType=()=>Number.isFinite(el.__HS_tabType)?el.__HS_tabType:0;if(typeof el.setUnlockedState!=="function")el.setUnlockedState=(v)=>{el.__HS_unlocked=!!v;return el;};if(typeof el.getUnlockedState!=="function")el.getUnlockedState=()=>!!el.__HS_unlocked;if(typeof el.isUnlocked!=="function")el.isUnlocked=()=>!!el.__HS_unlocked;if(typeof el.setVisibleState!=="function")el.setVisibleState=(v)=>{el.__HS_visible=!!v;return el;};if(typeof el.getVisibleState!=="function")el.getVisibleState=()=>!!el.__HS_visible;if(typeof el.isVisible!=="function")el.isVisible=()=>!!el.__HS_visible;if(typeof el.setEnabledState!=="function")el.setEnabledState=(v)=>{el.__HS_enabled=!!v;return el;};if(typeof el.getEnabledState!=="function")el.getEnabledState=()=>!!el.__HS_enabled;if(typeof el.isEnabled!=="function")el.isEnabled=()=>!!el.__HS_enabled;if(typeof el.setSelectedState!=="function")el.setSelectedState=(v)=>{el.__HS_selected=!!v;return el;};if(typeof el.getSelectedState!=="function")el.getSelectedState=()=>!!el.__HS_selected;if(typeof el.isSelected!=="function")el.isSelected=()=>!!el.__HS_selected;const __HS_NOOP_CHAIN=["setHoverState","setNotificationState","setTabColor","setTabClass","setTooltip","setLabel","setText","setDescription","makeDraggable","makeRemoveable","makeNotToggleable","makeToggleable"];for(const k of __HS_NOOP_CHAIN){if(typeof el[k]!=="function")el[k]=()=>el;}return el;}};`;
                const subTabInsertAt = subTabDefineMatch.index + subTabDefineToken.length;
                code = code.slice(0, subTabInsertAt) + safeSubTabCtorHelper + code.slice(subTabInsertAt);

                const newSubTabPattern = new RegExp(`new\\s+${subTabCtorSymbol}\\s*\\(`, 'g');
                code = code.replace(newSubTabPattern, () => {
                    subTabCtorReplacements += 1;
                    return '__HS_SAFE_NEW_SUBTAB(';
                });

                if (subTabCtorReplacements > 0) {
                    subTabCtorPatched = true;
                    log(`Patched sub-tab construction (new ${subTabCtorSymbol} -> __HS_SAFE_NEW_SUBTAB, ${subTabCtorReplacements} site${subTabCtorReplacements === 1 ? '' : 's'})`);
                } else {
                    warn(`Could not patch sub-tab construction — new ${subTabCtorSymbol}(...) pattern not found`);
                }
            } else {
                warn('Could not patch sub-tab constructor shim — sub-tab define pattern not found');
            }

            const constructorPatchHealth = {
                tabRowCtorPatched,
                subTabCtorPatched,
                tabRowSymbol: tabRowCtorSymbol,
                tabRowRewriteCount: tabRowCtorReplacements,
                subTabSymbol: subTabCtorSymbol,
                subTabRewriteCount: subTabCtorReplacements
            };
            if (window.__HS_LOADER_DIAGNOSTICS) {
                // Expose structured patch outcomes for console triage and update checks.
                window.__HS_LOADER_DIAGNOSTICS.constructorPatchHealth = constructorPatchHealth;
            }
            log('Constructor patch diagnostics', {
                tabRowSymbol: tabRowCtorSymbol,
                tabRowRewriteCount: tabRowCtorReplacements,
                tabRowPatched: tabRowCtorPatched,
                subTabSymbol: subTabCtorSymbol,
                subTabRewriteCount: subTabCtorReplacements,
                subTabPatched: subTabCtorPatched
            });

            if (!tabRowCtorPatched || !subTabCtorPatched) {
                // Abort before script injection to avoid partial boot loops with broken constructors.
                const missing = [];
                if (!tabRowCtorPatched) missing.push('tab-row constructor rewrite');
                if (!subTabCtorPatched) missing.push('sub-tab constructor rewrite');
                const message = `Critical constructor patch missing: ${missing.join(', ')}; aborting bundle injection`;
                warn(message);
                throw new Error(`[HS Loader] ${message}`);
            }

            log(`Patch summary: export=${!!exportResult} define=${defineWindowIdx !== -1}`);
            log('Patch complete — injecting bundle');
            
            if (HS_DUMP_PATCHED_BUNDLE) {
                window.__HS_PATCHED_BUNDLE_META = {
                    capturedAtMs: Math.round(performance.now() - startTime),
                    length: code.length,
                    exportPatched: !!exportResult,
                    definePatched: defineWindowIdx !== -1,
                    stagePatched: stageAnchorIdx !== -1
                };
                window.__HS_PATCHED_BUNDLE_HEAD = code.slice(0, 5000);
                window.__HS_PATCHED_BUNDLE_TAIL = code.slice(Math.max(0, code.length - 5000));
                window.__HS_PATCHED_BUNDLE_AROUND = (position, radius = 600) => {
                    const p = Math.max(0, Number(position) || 0);
                    const r = Math.max(0, Number(radius) || 0);
                    const start = Math.max(0, p - r);
                    const end = Math.min(code.length, p + r);
                    return {
                        start,
                        end,
                        text: code.slice(start, end)
                    };
                };
                window.__HS_PATCHED_BUNDLE_FIND = (needle, fromIndex = 0) => {
                    const token = String(needle ?? '');
                    const from = Math.max(0, Number(fromIndex) || 0);
                    if (!token) return -1;
                    return code.indexOf(token, from);
                };

                if (window.__HS_DUMP_PATCHED_BUNDLE_FULL === true) {
                    window.__HS_PATCHED_BUNDLE_TEXT = code;
                }

                log('Patched bundle debug hooks installed', {
                    length: code.length,
                    fullTextEnabled: window.__HS_DUMP_PATCHED_BUNDLE_FULL === true
                });
            }

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

            // Ensure custom element registration pass-through is enabled for bundle injection.
            allowCustomElements = true;
            log('Custom Elements unlocked for patched bundle', {
                blocked: loaderDiagnostics.customElements.blockedCount,
                blockedNamesSample: loaderDiagnostics.customElements.blockedNamesSample,
                allowedNamesSample: loaderDiagnostics.customElements.allowedNamesSample,
                duplicateSkipped: loaderDiagnostics.customElements.duplicateSkippedCount
            });

            // Keep duplicate-safe define wrapper active during injection.
            // If official out.js already registered built-ins (e.g. tab-row),
            // this prevents NotSupportedError on duplicate customElements.define.

            (document.body || document.head || document.documentElement).appendChild(gameScript);
            loaderDiagnostics.lifecycle.injectedAtMs = Math.round(performance.now() - startTime);
            try {
                mo.disconnect();
                log('MutationObserver disconnected');
            } catch { }

            if (isFirefox && beforeScriptExecute) {
                document.removeEventListener('beforescriptexecute', beforeScriptExecute, true);
                log('beforescriptexecute listener removed');
            }
            log('Game script injected');

            setTimeout(() => {
                loaderDiagnostics.lifecycle.postInjectHealthAtMs = Math.round(performance.now() - startTime);
                log('Post-inject health snapshot', {
                    exposedStage: !!window.__HS_EXPOSED,
                    exposedExport: !!window.__HS_EXPORT_EXPOSED,
                    playerExposeState: window.__HS_PLAYER_EXPOSED,
                    hsPlayerType: typeof window.__HS_player,
                    windowPlayerType: typeof window.player,
                    customElements: loaderDiagnostics.customElements
                });
            }, 1200);

            if (windowLoadFired) {
                await ensureManualInit('window-load-fired');
            } else {
                setTimeout(() => {
                    const needsFallback = !window.__HS_EXPOSED || !window.__HS_EXPORT_EXPOSED || typeof window.player === 'undefined';
                    if (needsFallback) {
                        ensureManualInit('post-inject-fallback').catch((e) => warn('Fallback manual init failed:', e));
                    }
                }, 2200);
            }

            setTimeout(initBackdoor, 1500);
            waitForOfflineContainerClosed(5000, 'initial').then(() => {
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
            debug('Manual init: player not found yet (expected on some builds before load path runs)');
        }
    }

    async function ensureManualInit(reason) {
        if (manualInitInFlight) {
            debug(`Manual init already in-flight; reusing promise (${reason})`);
            return manualInitInFlight;
        }

        loaderDiagnostics.lifecycle.manualInitAttempts += 1;
        log(`Manual init requested (${reason})`);

        manualInitInFlight = (async () => {
            try {
                await manuallyInitializeGame();
            } finally {
                manualInitInFlight = null;
            }
        })();

        return manualInitInFlight;
    }

    // Phase 3: inject game API/backdoor bridge once game script is present
    function initBackdoor() {
        const s = document.createElement('script');
        s.textContent = `
(function () {
    const getPlayer = () => window.__HS_player ?? window.player ?? null;
    const fnCache = Object.create(null);

    const findWindowFunction = (cacheKey, mustContain = []) => {
        if (Object.prototype.hasOwnProperty.call(fnCache, cacheKey)) {
            const cached = fnCache[cacheKey];
            if (typeof cached === 'function') {
                return cached;
            }
            delete fnCache[cacheKey];
        }

        const names = Object.getOwnPropertyNames(window);
        for (const name of names) {
            let value;
            try {
                value = window[name];
            } catch {
                continue;
            }

            if (typeof value !== 'function') continue;

            let src = '';
            try {
                src = Function.prototype.toString.call(value);
            } catch {
                continue;
            }

            if (!src || src.includes('[native code]')) continue;

            let ok = true;
            for (const token of mustContain) {
                if (!src.includes(token)) {
                    ok = false;
                    break;
                }
            }

            if (ok) {
                fnCache[cacheKey] = value;
                return value;
            }
        }

        return null;
    };

    const safeCall = (fn, args) => {
        if (typeof fn !== 'function') return { ok: false, value: undefined };
        try {
            return { ok: true, value: fn.apply(null, args) };
        } catch (e) {
            console.warn('[HS] __HS_GAME_API call failed:', e);
            return { ok: false, value: undefined };
        }
    };

    window.__HS_GAME_API = {
        get status() {
            return {
                playerReady: typeof getPlayer() === 'object',
                challengeDisplay: !!findWindowFunction('challengeDisplay', ['oneChallengeDetails', 'triggerChallenge']),
                toggleChallenges: !!findWindowFunction('toggleChallenges', ['transcensionChallenge', 'reincarnationChallenge', 'enterChallenge']),
                loadoutHandler: !!findWindowFunction('loadoutHandler', ['blueberryLoadoutMode', 'saveTree', 'loadTree']),
                toggleAutomaticHepteracts: !!findWindowFunction('toggleAutomaticHepteracts', ['HepteractAuto', 'AUTO']),
                updateAutoCubesOpens: !!findWindowFunction('updateAutoCubesOpens', ['openCubes', 'openTesseracts', 'openHypercubes', 'openPlatonicsCubes']),
                updateTesseractAutoBuyAmount: !!findWindowFunction('updateTesseractAutoBuyAmount', ['tesseractAutoBuyerAmount']),
                updateRuneBlessingBuyAmount: !!findWindowFunction('updateRuneBlessingBuyAmount', ['buyRuneBlessingInput', 'buyRuneSpiritInput'])
            };
        },

        get diagnostics() {
            return {
                status: this.status,
                synergismStage: typeof window.__HS_synergismStage,
                DOMCacheGetOrSet: typeof window.DOMCacheGetOrSet,
                loadStatistics: typeof window.__HS_loadStatistics,
                loadMiscellaneousStats: typeof window.__HS_loadMiscellaneousStats,
                i18next: typeof window.__HS_i18next,
                hsPlayer: typeof window.__HS_player,
                windowPlayer: typeof window.player,
                playerExposeState: window.__HS_PLAYER_EXPOSED,
                gameApi: typeof window.__HS_GAME_API,
                loaderSubTabFallback: {
                    count: window.__HS_LOADER_DIAGNOSTICS?.customElements?.subTabFallbackCount ?? 0,
                    reasons: window.__HS_LOADER_DIAGNOSTICS?.customElements?.subTabFallbackReasonsSample ?? []
                }
            };
        },

        getPlayer,

        /**
         * Directly sets upgrades[81]=1 on the live player object.
         * upgrades[81] is the Worker Autobuyer. When set, the game's own autobuyer
         * tick (every 5ms) will call buyProducer('first','Coin',1) automatically,
         * breaking the post-singularity deadlock (0 PP → can't buy via PP → 0 workers
         * → 0 production → 0 prestige → 0 PP).
         * Safe for sing25+: the free grant is negligible and the game re-validates on
         * the next autoUpgrades() tick anyway.
         * Returns { ok, method, upgrades81Before } for diagnostic logging.
         */
        ensureWorkerAutobuyer() {
            const p = getPlayer();
            if (!p) {
                console.log('[HS] ensureWorkerAutobuyer: no player object available');
                return { ok: false, method: 'no-player', upgrades81Before: undefined };
            }
            const highestSing = p.highestSingularityCount ?? 0;
            const upgrades81Now = p.upgrades?.[81];
            const fmtDecimal = (d) => d != null && typeof d === 'object' && 'mantissa' in d && 'exponent' in d
                ? d.mantissa.toPrecision(4) + 'e+' + d.exponent
                : String(d ?? 'N/A');
            const firstOwnedCoin = p.firstOwnedCoin;
            console.log('[HS] ensureWorkerAutobuyer: player state', {
                highestSing,
                upgrades81: upgrades81Now,
                coins: fmtDecimal(p.coins),
                prestigePoints: fmtDecimal(p.prestigePoints),
                firstOwnedCoin
            });
            if (highestSing < 25) {
                const result = { ok: false, method: 'sing-too-low', highestSing, upgrades81Before: upgrades81Now };
                console.log('[HS] ensureWorkerAutobuyer: rejected —', result);
                return result;
            }
            if (upgrades81Now === 1) {
                const result = { ok: true, method: 'already-enabled', upgrades81Before: upgrades81Now };
                console.log('[HS] ensureWorkerAutobuyer: no-op —', result);
                return result;
            }
            if (!p.upgrades) {
                const result = { ok: false, method: 'no-upgrades-array', upgrades81Before: undefined };
                console.log('[HS] ensureWorkerAutobuyer: rejected —', result);
                return result;
            }
            p.upgrades[81] = 1;
            const result = { ok: true, method: 'direct-write', upgrades81Before: upgrades81Now };
            console.log('[HS] ensureWorkerAutobuyer: ✅ upgrades[81] set to 1 —', result);
            return result;
        },

        checkWorkerAutobuyer() {
            const p = getPlayer();
            if (!p) {
                return;
            }
            const upgrades81Now = p.upgrades?.[81];
            const fmtDecimal = (d) => d != null && typeof d === 'object' && 'mantissa' in d && 'exponent' in d
                ? d.mantissa.toPrecision(4) + 'e+' + d.exponent
                : String(d ?? 'N/A');
            const firstOwnedCoin = p.firstOwnedCoin;
            console.log('[HS] checkWorkerAutobuyer: player state', {
                upgrades81: upgrades81Now,
                coins: fmtDecimal(p.coins),
                prestigePoints: fmtDecimal(p.prestigePoints),
                firstOwnedCoin
            });
            return;
        }
    };

    window.__HS_BACKDOOR__ = {
        get exposed() {
            return {
                synergismStage: typeof window.__HS_synergismStage,
                DOMCacheGetOrSet: typeof window.DOMCacheGetOrSet,
                loadStatistics: typeof window.__HS_loadStatistics,
                loadMiscellaneousStats: typeof window.__HS_loadMiscellaneousStats,
                i18next: typeof window.__HS_i18next,
                hsPlayer: typeof window.__HS_player,
                windowPlayer: typeof window.player,
                playerExposeState: window.__HS_PLAYER_EXPOSED,
                gameApi: typeof window.__HS_GAME_API
            };
        },
        getPlayer,
        getGameApi() {
            return window.__HS_GAME_API;
        }
    };

    console.log('[HS] ✅ __HS_GAME_API exposed');
})();
`;
        (document.head || document.documentElement).appendChild(s);
        log('Backdoor ready');
        logExposureTimeline('backdoor-ready');
    }

    function clickWhenAvailable(id) {
        return new Promise(resolve => {
            const start = performance.now();
            const MAX = 5000;

            (function check() {
                const el = document.getElementById(id);
                if (el) {
                    debug(`Found #${id} after ${Math.round(performance.now() - start)}ms; dispatching synthetic click`);
                    clickElementSynthetic(el);
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

    function isElementVisible(el) {
        if (!el) return false;
        const style = getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
    }

    function getOfflineExitButton(container = document.getElementById('offlineContainer')) {
        return document.getElementById('exitOffline') || container?.querySelector('button') || null;
    }

    function clickElementSynthetic(el) {
        if (!el) return;
        const events = ['mousedown', 'mouseup', 'click'];
        for (const type of events) {
            el.dispatchEvent(new MouseEvent(type, {
                bubbles: true,
                cancelable: true,
                view: window
            }));
        }
    }

    async function runSilentExportProbe() {
        const SILENCE_MS = 5000;
        const until = Date.now() + SILENCE_MS;

        debug(`Starting silent export probe (window=${SILENCE_MS}ms)`);

        loaderDiagnostics.exportSilence.attempts += 1;
        window.__HS_SILENT_EXPORT = true;
        window.__HS_SILENT_EXPORT_UNTIL = until;

        await clickWhenAvailable('exportgame');
        await new Promise(r => setTimeout(r, 700));

        const clearIfExpired = () => {
            if ((Number(window.__HS_SILENT_EXPORT_UNTIL || 0) <= Date.now())) {
                window.__HS_SILENT_EXPORT = false;
            }
        };

        clearIfExpired();
        setTimeout(clearIfExpired, Math.max(0, until - Date.now()) + 50);

        debug('Silent export probe completed', {
            attempts: loaderDiagnostics.exportSilence.attempts,
            blockedAnchorClicks: loaderDiagnostics.exportSilence.blockedAnchorClicks,
            lastBlockedDownloadName: loaderDiagnostics.exportSilence.lastBlockedDownloadName
        });
    }

    // Wait until offline modal is hidden/stable, with active dismissal attempts.
    async function waitForOfflineContainerClosed(maxMs = 15000, reason = 'default') {
        const start = performance.now();
        const MAX = Math.max(1000, Number(maxMs) || 15000);
        let seenOpen = false;
        let hiddenFrames = 0;
        log(`Waiting for offlineContainer... (reason=${reason}, maxMs=${MAX})`);
        return new Promise(resolve => {
            (function check() {
                const container = document.getElementById('offlineContainer');
                const visible = isElementVisible(container);

                if (visible) {
                    seenOpen = true;
                    hiddenFrames = 0;
                    const exitBtn = getOfflineExitButton(container);
                    if (exitBtn) clickElementSynthetic(exitBtn);
                } else if (container) {
                    hiddenFrames += 1;
                    if (hiddenFrames >= 8) {
                        log(`offlineContainer hidden, UI ready (reason=${reason}, seenOpen=${seenOpen})`);
                        resolve(true);
                        return;
                    }
                } else if (!container && performance.now() - start > 3000) {
                    log('offlineContainer not present, proceeding');
                    resolve(true);
                    return;
                }

                if (performance.now() - start > MAX) {
                    warn(`Offline container wait timed out, forcing proceed (reason=${reason}, seenOpen=${seenOpen})`);
                    resolve(false);
                    return;
                }
                requestAnimationFrame(check);
            })();
        });
    }

    async function exposeViaUI() {
        // Phase 4: drive UI-based exposure path for stage/export/player access.
        log('Running UI exposure sequence (stage/export/player)...');

        const stableGateStart = performance.now();
        const STABLE_GATE_MAX = 8000;
        let hiddenFramesBeforeExpose = 0;
        let gatePlayerReady = false;
        while (performance.now() - stableGateStart < STABLE_GATE_MAX) {
            const offlineContainer = document.getElementById('offlineContainer');
            const visible = isElementVisible(offlineContainer);
            const playerReadyNow = typeof window.player === 'object' || typeof window.__HS_player === 'object';
            gatePlayerReady = playerReadyNow;

            if (visible) {
                hiddenFramesBeforeExpose = 0;
                const exitBtn = document.getElementById('exitOffline') || offlineContainer?.querySelector('button');
                if (exitBtn) clickElementSynthetic(exitBtn);
            } else {
                hiddenFramesBeforeExpose += 1;
            }

            if (playerReadyNow && hiddenFramesBeforeExpose >= 6) break;
            await new Promise(r => requestAnimationFrame(r));
        }

        debug('Stable gate result before exposure clicks', {
            elapsedMs: Math.round(performance.now() - stableGateStart),
            playerReady: gatePlayerReady,
            hiddenFrames: hiddenFramesBeforeExpose
        });

        const offlineContainer = document.getElementById('offlineContainer');
        if (isElementVisible(offlineContainer)) {
            warn('offlineContainer still visible at exposure start; retrying dismissal');
            const exitBtn = getOfflineExitButton(offlineContainer);
            if (exitBtn) clickElementSynthetic(exitBtn);
            await waitForOfflineContainerClosed(5000, 'pre-exposure-retry');
        }

        await clickWhenAvailable('settingstab');
        await new Promise(r => setTimeout(r, 100));
        await clickWhenAvailable('switchSettingSubTab4');
        await new Promise(r => setTimeout(r, 100));
        await clickWhenAvailable('kMisc');

        await runSilentExportProbe();

        const MAX_ACTIVE = 8000;
        let activeElapsed = 0;
        let prevTs = performance.now();
        let lastOfflineDismissAttemptAt = 0;
        let offlineWasVisible = false;
        return new Promise(resolve => {
            (function waitExpose() {
                const now = performance.now();
                const offlineContainerNow = document.getElementById('offlineContainer');
                const offlineVisible = isElementVisible(offlineContainerNow);

                if (offlineVisible) {
                    if (!offlineWasVisible) {
                        activeElapsed = 0;
                        offlineWasVisible = true;
                        debug('offlineContainer became visible during exposure wait; resetting exposure timer and retrying dismissal');
                    }
                    if (now - lastOfflineDismissAttemptAt > 800) {
                        lastOfflineDismissAttemptAt = now;
                        const exitBtn = getOfflineExitButton(offlineContainerNow);
                        if (exitBtn) {
                            clickElementSynthetic(exitBtn);
                        }
                    }
                } else {
                    offlineWasVisible = false;
                    activeElapsed += Math.max(0, now - prevTs);
                }
                prevTs = now;

                if (!window.__HS_PLAYER_EXPOSED && window.player) {
                    window.__HS_player = window.player;
                    window.__HS_PLAYER_EXPOSED = 'ui-window-fallback';
                    log('Player backfilled from window.player during UI exposure wait');
                    logExposureTimeline('ui-window-backfill');
                }

                const stageReady = !!window.__HS_EXPOSED;
                const exportReady = !!window.__HS_EXPORT_EXPOSED;
                const playerReady = typeof window.__HS_PLAYER_EXPOSED !== 'undefined';

                if (stageReady && exportReady) {
                    log(`Exposure ready (stage=${stageReady} export=${exportReady} playerReady=${playerReady} player=${window.__HS_PLAYER_EXPOSED} hsPlayer=${typeof window.__HS_player} windowPlayer=${typeof window.player})`);
                    logExposureTimeline('exposure-ready', { stageReady, exportReady, playerReady });
                    resolve(true);
                    return;
                }
                if (activeElapsed > MAX_ACTIVE) {
                    const apiDiagnostics = window.__HS_GAME_API?.diagnostics;
                    warn(`Exposure wait timed out (stage=${stageReady} export=${exportReady} player=${window.__HS_PLAYER_EXPOSED} hsPlayer=${typeof window.__HS_player} windowPlayer=${typeof window.player})`);
                    warn('[HS] Exposure timeout diagnostics', {
                        apiDiagnostics,
                        loaderDiagnostics,
                        hasOfflineContainer: !!document.getElementById('offlineContainer'),
                        activeExposureMs: Math.round(activeElapsed)
                    });
                    logExposureTimeline('exposure-timeout', { stageReady, exportReady, playerReady });
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
        // Phase 5: once exposure succeeds, load and initialize mod script.
        if (window.__HS_MOD_LOADED) return;
        window.__HS_MOD_LOADED = true;

        let ok = await exposeViaUI();
        if (!ok) {
            warn('Initial exposure attempt failed; running manual-init retry path');
            await ensureManualInit('exposure-retry');
            ok = await exposeViaUI();
            if (!ok) return;
        }

        await returnToBuildingsTab();

        log('Loading mod from LOCAL DEV SERVER');

        const s = document.createElement('script');
        // Load from local dev server instead of CDN
        s.src = `http://127.0.0.1:8080/hypersynergism.js?${Date.now()}`;

        s.onload = () => {
            log('✅ Mod script loaded from dev server');
            try {
                window.hypersynergism.init();
                logExposureTimeline('mod-init-success', {
                    winnerPath: window.__HS_PLAYER_EXPOSED,
                    hsPlayerReady: typeof window.__HS_player === 'object',
                    windowPlayerReady: typeof window.player === 'object'
                });
            } catch (e) {
                warn('Mod init failed:', e);
                logExposureTimeline('mod-init-failure', {
                    winnerPath: window.__HS_PLAYER_EXPOSED,
                    hsPlayerReady: typeof window.__HS_player === 'object',
                    windowPlayerReady: typeof window.player === 'object'
                });
            }
        };

        s.onerror = () => warn('❌ Mod failed to load from dev server - is it running?');
        (document.head || document.documentElement).appendChild(s);
    }

    log('DEV LOADER v3.5b Initialized - will load from http://127.0.0.1:8080');

})();
