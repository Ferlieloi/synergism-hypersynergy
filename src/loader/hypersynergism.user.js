// ==UserScript==
// @name         HyperSynergism Loader
// @namespace    https://github.com/Ferlieloi
// @version      3.6
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

    const loaderVersion = '3.6';
    const startTime = performance.now();
    const log = (...a) => console.log(`%c[HS-LOADER v${loaderVersion} +${(performance.now() - startTime).toFixed(0)}ms]`, 'color:#4af', ...a);
    const warn = (...a) => console.warn(`%c[HS-LOADER v${loaderVersion} +${(performance.now() - startTime).toFixed(0)}ms]`, 'color:#fa4', ...a);
    const debug = (...a) => console.debug(`%c[HS-LOADER v${loaderVersion} +${(performance.now() - startTime).toFixed(0)}ms]`, 'color:#aaa', ...a);

    const originalFetch = window.fetch.bind(window);
    const isFirefox = navigator.userAgent.includes('Firefox');
    log(`Browser: ${isFirefox ? 'Firefox' : 'Not Firefox'}`);

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


    // ==================================================================================
    // ─── Phase 1 & 2: Fetch, patch, and inject the game bundle ───────────────
    // ==================================================================================

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

        // ==================================================================================
        // ───────────────────────────────── BUNDLE PATCHES ─────────────────────────────────

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

        // ==================================================================================
        // ────── EXPORT PATCH ─ Inject at the start of exportSynergism's body.
        // The function is async, takes a bool arg, and contains "Synergysave2".
        const exportResult = findFunctionBodyContaining(
            code,
            /([a-zA-Z_$][\w$]*)\s*=\s*async\s*\([^)]*!0[^)]*\)\s*=>\s*\{/,
            '"Synergysave2"'
        );
        if (exportResult) {
            const exportFn = exportResult.match[1];
            const expose = exportFn
                ? `\nif(!window.__HS_EXPORT_EXPOSED){` +
                        `window.__HS_exportData=${exportFn};` +
                        `window.__HS_EXPORT_EXPOSED=true;` +
                        `console.log('[HS-PATCH] \u2705 exportSynergism exposed');` +
                        `if(window.__HS_SILENT_EXPORT)return;` +
                    `}\n`
                : `\nif(!window.__HS_EXPORT_EXPOSED){` +
                        `window.__HS_EXPORT_EXPOSED=true;` +
                        `console.log('[HS-PATCH] \u26a0\ufe0f exportSynergism found but fn name unknown');` +
                        `if(window.__HS_SILENT_EXPORT)return;` +
                    `}\n`;
            code = code.slice(0, exportResult.bodyStart) + expose + code.slice(exportResult.bodyStart);
            log(`Patched exportSynergism (fn=${exportFn ?? 'unknown'})`);
        } else {
            warn('Could not patch exportSynergism — header not found');
        }

        // ==================================================================================
        // ────── STAGE PATCH — inject at the entry of loadMiscellaneousStats.
        // Locate the unique anchor, extract variable names, find the enclosing
        // no-arg arrow function, and inject at its opening brace.
        const stageAnchorIdx = code.indexOf('"gameStageStatistic"');
        if (stageAnchorIdx !== -1) {
            const ctx = code.slice(Math.max(0, stageAnchorIdx - 80), stageAnchorIdx + 300);
            const domFn = ctx.match(/([a-zA-Z_$][\w$]*)\("gameStageStatistic"\)/)?.[1];
            const i18nObj = ctx.match(/\.innerHTML\s*=\s*([a-zA-Z_$][\w$]*)\.t\(/)?.[1];
            const stageFn = ctx.match(/\bstage\s*:\s*([a-zA-Z_$][\w$]*)\(/)?.[1];
            if (domFn && i18nObj && stageFn) {
                const expose = 
                    `\nif(!window.__HS_STAGE_EXPOSED){` +
                        `window.DOMCacheGetOrSet=${domFn};` +
                        `window.__HS_synergismStage=${stageFn};` +
                        `window.__HS_i18next=${i18nObj};` +
                        `window.__HS_STAGE_EXPOSED=true;` +
                        `window.__HS_EXPOSED=true;` +
                        `console.log('[HS-PATCH] \u2705 Stage exposed (dom=${domFn} stage=${stageFn} i18n=${i18nObj})');` +
                    `}\n`;
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

        // ==================================================================================
        // ────── PLAYER PATCH ─ Detect the call `Object.defineProperties(window, { player: { value:<sym> }, ... })`
        // and expose the player object via an obfuscated, non-enumerable Symbol property on window (window.symp)
        try {
            // Match the full Object.defineProperties(...) call
            const re = /Object\.defineProperties\(window,\s*\{\s*player\s*:\s*\{\s*value\s*:\s*([a-zA-Z_$][\w$]*)\s*\}[^}]*\}[^)]*\)/;
            const m = re.exec(code);
            if (m) {
                const insertPos = m.index + m[0].length;
                const playerVar = m[1];
                if (playerVar) {
                    // Expose player using a Symbol property, with Symbol stored globally (symp = symbol player)
                    const expose =
                        ',(' +
                            'window.symp=window.symp||Symbol(),' +
                            'Object.defineProperty(' + 
                                'window,window.symp,' +
                                '{' +
                                    'enumerable:false,' +
                                    'configurable:true,' +
                                    'writable:true,' +
                                    'value:' + playerVar +
                                '}' +
                            '),console.log("[HS-PATCH] \u2705 Symbol exposed")' + 
                        ')';
                    code = code.slice(0, insertPos) + expose + code.slice(insertPos);
                } else {
                    warn('❌ Error in defineProperties player patch: anchor found but symbol extraction failed');
                }
            } else {
                warn('❌ Error while searching for defineProperties(player) anchor in bundle');
            }
        } catch (e) {
            warn('❌ Error while probing for defineProperties player patch', e);
        }

        // ==================================================================================
        // ── GETMAXCHALLENGES PATCH — expose Challenges.ts getMaxChallenges as window.__HS_getMaxChallenges
        // Unique anchor: n.cubeUpgrades[29] only appears inside getMaxChallenges (reincarnation cap += 4/level)
        try {
            const gmcAnchor = 'n.cubeUpgrades[29]';
            const gmcAnchorIdx = code.indexOf(gmcAnchor);
            if (gmcAnchorIdx !== -1) {
                const backCtx = code.slice(Math.max(0, gmcAnchorIdx - 400), gmcAnchorIdx);
                // Take the last arrow-function assignment before the anchor — that is getMaxChallenges
                const allFnMatches = [...backCtx.matchAll(/([a-zA-Z_$][\w$]*)\s*=\s*e\s*=>\s*\{/g)];
                const gmcFn = allFnMatches.at(-1)?.[1];
                if (gmcFn) {
                    // Find body start (position right after the opening '{') robustly
                    const fnHeaderRe = new RegExp(`\\b${gmcFn}\\s*=\\s*e\\s*=>\\s*\\{`, 'g');
                    let bodyStart = -1, fhm;
                    const preAnchor = code.slice(0, gmcAnchorIdx);
                    while ((fhm = fnHeaderRe.exec(preAnchor)) !== null) bodyStart = fhm.index + fhm[0].length;
                    if (bodyStart !== -1) {
                        const expose = 
                            `\nif(!window.__HS_CHALLENGES_EXPOSED){` +
                                `window.__HS_getMaxChallenges=${gmcFn};` +
                                `window.__HS_CHALLENGES_EXPOSED=true;` +
                                `console.log('[HS-PATCH] \u2705 getMaxChallenges exposed (fn=${gmcFn})');` +
                            `}\n`;
                        code = code.slice(0, bodyStart) + expose + code.slice(bodyStart);
                        log(`Patched getMaxChallenges (fn=${gmcFn})`);
                    } else {
                        warn(`getMaxChallenges: found fn name '${gmcFn}' but could not locate body start`);
                    }
                } else {
                    warn('getMaxChallenges: could not extract fn name from anchor context');
                }
            } else {
                warn('Could not patch getMaxChallenges — anchor not found in bundle');
            }
        } catch (e) {
            warn('Error while patching getMaxChallenges', e);
        }

        // ==================================================================================
        // ── TACK PATCH — wrap tack() to fire registered after-tack hooks
        // Unique anchor: ("autoPotion", with optional whitespace and either quote style)
        try {
            const tackAnchorRe = /\(\s*["']autoPotion["']\s*,/;
            const tackAnchorMatch = tackAnchorRe.exec(code);
            const tackAnchorIdx = tackAnchorMatch ? tackAnchorMatch.index : -1;
            if (tackAnchorIdx !== -1) {
                const backCtx = code.slice(Math.max(0, tackAnchorIdx - 600), tackAnchorIdx);
                const tackHeaderRe = /=>\s*\{/g;
                let tm, lastTackBodyStart = -1;
                while ((tm = tackHeaderRe.exec(backCtx)) !== null) {
                    lastTackBodyStart = tm.index + tm[0].length;
                }
                if (lastTackBodyStart !== -1) {
                    const assignRe = /([a-zA-Z_$][\w$]*)\s*=\s*(?:\(\s*[a-zA-Z_$][\w$]*\s*\)|[a-zA-Z_$][\w$]*)\s*=>\s*\{/g;
                    let am2, tackFn = null;
                    while ((am2 = assignRe.exec(backCtx)) !== null) tackFn = am2[1];

                    const insertAt = Math.max(0, tackAnchorIdx - 600) + lastTackBodyStart;
                    const tackPatch =
                        `if(!window.__HS_TACK_PATCHED){` +
                            `window.__HS_TACK_PATCHED=true;` +
                            `window.__HS_tackHooks=[];` +
                            `window.__HS_onAfterTack=function(fn){window.__HS_tackHooks.push(fn);};` +
                            `console.log('[HS-PATCH] \u2705 tack() patched (fn=${tackFn ?? 'unknown'})');` +
                        `}` +
                        `queueMicrotask(()=>{const h=window.__HS_tackHooks.splice(0);for(let i=0;i<h.length;i++)h[i]();});`;
                    code = code.slice(0, insertAt) + tackPatch + code.slice(insertAt);
                    log(`Patched tack() (fn=${tackFn ?? 'unknown'})`);
                } else {
                    warn('tack patch: found anchor but could not locate tack() body start');
                }
            } else {
                warn('tack patch: anchor not found in bundle!!');
            }
        } catch (e) {
            warn('Error while patching tack()', e);
        }

        // ==================================================================================
        // ── AUTO-CONFIRM PATCH — make Confirm/Alert auto-resolve when window.__HS_AUTO_CONFIRM is set to true
        // Confirm resolves true (OK clicked) and Alert resolves void, bypassing all DOM/queue overhead.
        // 'Unique' anchors: 'confirmationBox' appears exactly 3× in the bundle: 1st = Confirm body, 2nd = Alert body, 3rd = Prompt.
        // We use the 1st for Confirm and 2nd for Alert. Walk back to the `() => {` of the enqueue action.
        // Toggle: window.__HS_AUTO_CONFIRM = true (no pop-up) / false (normal play with pop-ups).
        try {
            const cbRe = /['"]confirmationBox['"]/g;
            const cbMatch1 = cbRe.exec(code);
            const cbMatch2 = cbMatch1 ? cbRe.exec(code) : null;

            // Collect both patch sites against the unmodified code, then apply highest-index first
            // so earlier insertions don't invalidate later indices.
            const autoConfirmSites = [];
            if (cbMatch1) {
                const backCtx = code.slice(Math.max(0, cbMatch1.index - 200), cbMatch1.index);
                const lastArrow = [...backCtx.matchAll(/\(\s*\)\s*=>\s*\{/g)].at(-1);
                if (lastArrow) {
                    autoConfirmSites.push({
                        bodyStart: (cbMatch1.index - backCtx.length) + lastArrow.index + lastArrow[0].length,
                        inject: `\nif(window.__HS_AUTO_CONFIRM)return Promise.resolve(!0);\n`,
                        label: 'Confirm'
                    });
                } else { warn('autoConfirm: could not find Confirm action body start'); }
            } else { warn('Could not patch Confirm — confirmationBox anchor not found'); }

            if (cbMatch2) {
                const backCtx = code.slice(Math.max(0, cbMatch2.index - 200), cbMatch2.index);
                const lastArrow = [...backCtx.matchAll(/\(\s*\)\s*=>\s*\{/g)].at(-1);
                if (lastArrow) {
                    autoConfirmSites.push({
                        bodyStart: (cbMatch2.index - backCtx.length) + lastArrow.index + lastArrow[0].length,
                        inject: `\nif(window.__HS_AUTO_CONFIRM)return Promise.resolve(void 0);\n`,
                        label: 'Alert'
                    });
                } else { warn('autoConfirm: could not find Alert action body start'); }
            } else { warn('Could not patch Alert — second confirmationBox anchor not found'); }

            autoConfirmSites.sort((a, b) => b.bodyStart - a.bodyStart);
            for (const site of autoConfirmSites) {
                code = code.slice(0, site.bodyStart) + site.inject + code.slice(site.bodyStart);
                log(`Patched ${site.label} (auto-confirm support)`);
            }
            if (autoConfirmSites.length === 2) {
                window.__HS_AUTO_CONFIRM_PATCHED = true;
            }
        } catch (e) {
            warn('Error while patching Confirm/Alert', e);
        }

        // ==================================================================================
        // ── APPLYCORRUPTIONS PATCH — expose Corruptions.ts applyCorruptions as window.__HS_applyCorruptions
        // Unique anchor: e.includes('/') only appears inside applyCorruptions (legacy corruption format check)
        try {
            const corrAnchor = 'e.includes("/")';
            const corrAnchorIdx = code.indexOf(corrAnchor);
            if (corrAnchorIdx !== -1) {
                const backCtx = code.slice(Math.max(0, corrAnchorIdx - 400), corrAnchorIdx);
                // applyCorruptions is assigned as: fnName = e => {
                const allFnMatches = [...backCtx.matchAll(/([a-zA-Z_$][\w$]*)\s*=\s*e\s*=>\s*\{/g)];
                const corrFn = allFnMatches.at(-1)?.[1];
                if (corrFn) {
                    const fnHeaderRe = new RegExp(`\\b${corrFn}\\s*=\\s*e\\s*=>\\s*\\{`, 'g');
                    let bodyStart = -1, fhm;
                    const preAnchor = code.slice(0, corrAnchorIdx);
                    while ((fhm = fnHeaderRe.exec(preAnchor)) !== null) bodyStart = fhm.index + fhm[0].length;
                    if (bodyStart !== -1) {
                        const expose = 
                            `\nif(!window.__HS_CORRUPTIONS_EXPOSED){` +
                                `window.__HS_applyCorruptions=${corrFn};` +
                                `window.__HS_CORRUPTIONS_EXPOSED=true;` +
                                `console.log('[HS-PATCH] \u2705 applyCorruptions exposed (fn=${corrFn})');` +
                            `}\n`;
                        code = code.slice(0, bodyStart) + expose + code.slice(bodyStart);
                        log(`Patched applyCorruptions (fn=${corrFn})`);
                    } else {
                        warn(`applyCorruptions: found fn name '${corrFn}' but could not locate body start`);
                    }
                } else {
                    warn('applyCorruptions: could not extract fn name from anchor context');
                }
            } else {
                warn('Could not patch applyCorruptions — anchor not found in bundle');
            }
        } catch (e) {
            warn('Error while patching applyCorruptions', e);
        }
/*
        // ==================================================================================
        // ── TELEPORT LOWER PATCH — expose a dialog-free singularityCount setter
        // When autosing teleports lower, teleportToSingularity only sets player.singularityCount = target,
        // then calls updateSingularityElevator() (display only) and shows two dialogs.
        // We bypass all of that with a synchronous one-liner.
        // Unique anchor: 'singularity.elevator.inEXALTError' appears only inside teleportToSingularity.
        // We walk backward to find the async arrow fn assigned to eM and inject at body start.
        try {
            const tpAnchor = 'singularity.elevator.inEXALTError';
            const tpAnchorIdx = code.indexOf(tpAnchor);
            if (tpAnchorIdx !== -1) {
                const backCtx = code.slice(Math.max(0, tpAnchorIdx - 3500), tpAnchorIdx);
                const allAsyncFns = [...backCtx.matchAll(/([a-zA-Z_$][\w$]*)\s*=\s*async\s*\(\s*\)\s*=>\s*\{/g)];
                const eMMatch = allAsyncFns.at(-1);
                if (eMMatch) {
                    const eMFn = eMMatch[1];
                    const eMBodyStart = (tpAnchorIdx - backCtx.length) + eMMatch.index + eMMatch[0].length;
                    const expose = 
                        `\nif(!window.__HS_TELEPORT_LOWER_EXPOSED){` +
                            `window.__HS_teleportLower=(t)=>{` +
                                `n.singularityCount=t;` +
                                `Va();` +
                            `};` +
                            `window.__HS_TELEPORT_LOWER_EXPOSED=true;` +
                            `console.log('[HS-PATCH] \u2705 teleportLower exposed');` +
                        `}\n`;
                    code = code.slice(0, eMBodyStart) + expose + code.slice(eMBodyStart);
                    log(`Patched teleportLower (fn=${eMFn})`);
                } else {
                    warn('teleportLower: could not extract async fn from anchor context');
                }
            } else {
                warn('Could not patch teleportLower — anchor not found in bundle');
            }
        } catch (e) {
            warn('Error while patching teleportLower', e);
        }

        // ==================================================================================
        // ── ENTER/EXIT EXALT PATCH — dialog-free enableChallenge / exitChallenge wrappers (a little more 'hacky' than the rest...)
        // enterExalt replicates enableChallenge's state-mutation body (no Confirm/Alert).
        // exitExalt replicates exitChallenge(success=false) — autosing always exits exalts without completing
        // (antiquities=0), so we use the failure path: no completion tracking
        // Unique anchor: 'singularityChallenge.enterChallenge.lowSingularity' is only inside enableChallenge.
        // We walk backward 400 chars to find 'async enableChallenge() {' and inject at body start.
        // All closure vars (n=player, b=G, pi=singularity, zr=calculateGoldenQuarks) are in scope here.
        try {
            const exaltAnchor = 'singularityChallenge.enterChallenge.lowSingularity';
            const exaltAnchorIdx = code.indexOf(exaltAnchor);
            if (exaltAnchorIdx !== -1) {
                const backCtx = code.slice(Math.max(0, exaltAnchorIdx - 400), exaltAnchorIdx);
                const ecMatch = /async\s+enableChallenge\s*\(\s*\)\s*\{/.exec(backCtx);
                if (ecMatch) {
                    const ecBodyStart = (exaltAnchorIdx - backCtx.length) + ecMatch.index + ecMatch[0].length;
                    const enterBody =
                        `const c=n.singularityChallenges.oneChallengeCap;` +
                        `if(n.insideSingularityChallenge)return;` +
                        `const r=c.computeSingularityRquirement(),a=n.singularityCounter,o=n.quarkstimer,i=n.goldenQuarksTimer,l=zr(),u=n.goldenQuarks;` +
                        `c.enabled=true;b.currentSingChallenge=c.HTMLTag;n.insideSingularityChallenge=true;` +
                        `pi(r);` +
                        `c.resetTime?(n.singularityCounter=0):(n.singularityCounter=a);` +
                        `n.goldenQuarks=u+l;n.quarkstimer=o;n.goldenQuarksTimer=i;` +
                        `c.updateChallengeHTML()`;
                    // Exalt failed path (success=false): skip completion tracking and timer restoration.
                    // quarkstimer/goldenQuarksTimer would normally be restored here, but autosing
                    // calls pi() (singularity) immediately after anyway — resetting them again.
                    // (And the q/gq gains from the timers are useless anyway)
                    const exitBody =
                        `const c=n.singularityChallenges.oneChallengeCap;` +
                        `c.enabled=false;b.currentSingChallenge=undefined;n.insideSingularityChallenge=false;` +
                        `const r=n.highestSingularityCount,a=n.singularityCounter;` +
                        `c.updateIconHTML();pi(r);n.singularityCounter=a`;
                    const expose =
                        `\nif(!window.__HS_EXALT_EXPOSED){` +
                            `window.__HS_EXALT_EXPOSED=true;` +
                            `window.__HS_enterExalt=()=>{${enterBody};};` +
                            `window.__HS_exitExalt=()=>{${exitBody};};` +
                            `console.log('[HS-PATCH] \u2705 enterExalt/exitExalt exposed');` +
                        `}\n`;
                    code = code.slice(0, ecBodyStart) + expose + code.slice(ecBodyStart);
                    log('Patched enterExalt/exitExalt');
                } else {
                    warn('enterExalt: could not find enableChallenge method header in backward context');
                }
            } else {
                warn('Could not patch enterExalt/exitExalt — anchor not found in bundle');
            }
        } catch (e) {
            warn('Error while patching enterExalt/exitExalt', e);
        }
*/
        // ==================================================================================

        log(`Patch complete — waiting for DOM to be ready before injecting bundle`);

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
        

        // ==================================================================================
        // ── Phase 2: Inject patched bundle ────────────────────────────────────────────────
        // ==================================================================================
        
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


        // ==================================================================================
        // ── Phase 3: Ensure the game initialises ──────────────────────────────────────────
        // ==================================================================================

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
        s.textContent = 
            `window.__HS_BACKDOOR__ = {` +
                `get exposed() {` +
                    `return {` +
                        `synergismStage:      typeof window.__HS_synergismStage,` +
                        `DOMCacheGetOrSet:    typeof window.DOMCacheGetOrSet,` +
                        `i18next:             typeof window.__HS_i18next,` +
                        `exportData:          typeof window.__HS_exportData,` +
                        `getMaxChallenges:    typeof window.__HS_getMaxChallenges,` +
                        `applyCorruptions:    typeof window.__HS_applyCorruptions,` +
                    //  `teleportLower:       typeof window.__HS_teleportLower,` +
                    //  `enterExalt:          typeof window.__HS_enterExalt,` +
                    //  `exitExalt:           typeof window.__HS_exitExalt,` +
                        `tackHooks:           Array.isArray(window.__HS_tackHooks) ? window.__HS_tackHooks.length : 'n/a'` +
                    `};` +
                `}` +
            `};`;
        (document.head || document.documentElement).appendChild(s);
        log('Backdoor ready');
    }

    // ==================================================================================
    // ─── Phases 4–6: Wait for game, dismiss offline modal, expose, load mod ───────────
    // ==================================================================================

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
            await loadMod();

        } catch (e) {
            warn('Post-load sequence failed:', e);
        }
    }

    function loadMod() {
        const modSource = 'CDN';
        log(`Phase 6 — loading mod from ${modSource}...`);
        // window.__HS_IS_DEV  = false;
        window.__HS_REPO    = window.__HS_REPO    ? window.__HS_REPO    : 'Ferlieloi';
        window.__HS_VERSION = window.__HS_VERSION ? window.__HS_VERSION : 'master';
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            const url = `https://cdn.jsdelivr.net/gh/${window.__HS_REPO}/synergism-hypersynergy@${window.__HS_VERSION}/release/mod/hypersynergism_release.js?t=${Date.now()}`;
            s.src = url;
            s.onload = () => {
                log(`✅ Mod script loaded from ${modSource}: ${url}`);
                try {
                    window.hypersynergism.init();
                    log('✅ Mod initialised');
                } catch (e) {
                    warn('Mod init failed:', e);
                }
                resolve();
            };
            s.onerror = () => {
                warn(`❌ Mod failed to load from ${modSource}: ${url}`);
                reject(new Error('Mod load failed'));
            };
            (document.head || document.documentElement).appendChild(s);
        });
    }

    log(`HyperSynergism loader initialised`);

})();
