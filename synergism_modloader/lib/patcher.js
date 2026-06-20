module.exports = function patchBundle(code) {
    const log = (...a) => console.log('[PATCH]', ...a);
    const warn = (...a) => console.warn('[PATCH]', ...a);
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
            code = 'window.__HS_AUTO_CONFIRM_PATCHED = true;\n' + code;
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

    // ==================================================================================
    // ── STEAM AUTO-SYNC PATCH — remove manual trigger (e || ...)
    try {
        const steamSyncRe = /\(\s*([a-zA-Z_$][\w$]*)\s*\|\|\s*([a-zA-Z_$][\w$]*)\s*-\s*([a-zA-Z_$][\w$]*)\s*>=\s*6e4\s*\)\s*&&/;

        const m = steamSyncRe.exec(code);
        if (m) {
            const [, buttonVar, nowVar, lastVar] = m;

            const replacement = `(${nowVar} - ${lastVar} >= 6e4)&&`;

            code = code.replace(steamSyncRe, replacement);

            log(`Patched Steam auto-sync (removed ${buttonVar} trigger)`);
        } else {
            warn('Could not patch Steam auto-sync — pattern not found');
        }
    } catch (e) {
        warn('Error while patching Steam auto-sync', e);
    }

    // ==================================================================================

    log(`Patch complete — waiting for DOM to be ready before injecting bundle`);
    return code;
}
