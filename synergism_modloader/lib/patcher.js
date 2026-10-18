// Shared bundle patcher for browser userscripts and the desktop launcher.
// The browser startup code below uses this same function with Steam changes disabled.
function patchBundle(code, options = {}) {
    const log = options.log || ((...a) => console.log('[PATCH]', ...a));
    const warn = options.warn || ((...a) => console.warn('[PATCH]', ...a));
    // ==================================================================================
    // ───────────────────────────────── BUNDLE PATCHES ─────────────────────────────────

    // Locate a minified function from stable behavior inside its body instead of
    // depending on a particular minifier spelling (for example `true` vs `!0`).
    // Candidates are checked nearest-first so nested callbacks between the
    // function entry and its semantic anchor are ignored unless they also contain
    // every required marker.
    const findMatchingBrace = (src, bodyStart) => {
        let depth = 1;
        let quote = null;
        let escaped = false;

        for (let i = bodyStart; i < src.length; i++) {
            const char = src[i];
            const next = src[i + 1];

            if (quote) {
                if (escaped) escaped = false;
                else if (char === '\\') escaped = true;
                else if (char === quote) quote = null;
                continue;
            }

            if (char === '"' || char === "'" || char === '`') {
                quote = char;
                continue;
            }
            if (char === '/' && next === '/') {
                i = src.indexOf('\n', i + 2);
                if (i === -1) return -1;
                continue;
            }
            if (char === '/' && next === '*') {
                i = src.indexOf('*/', i + 2);
                if (i === -1) return -1;
                i++;
                continue;
            }
            if (char === '{') depth++;
            else if (char === '}' && --depth === 0) return i;
        }

        return -1;
    };

    const findFunctionBodyByName = (src, fnName) => {
        const escapedName = fnName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Not \b: minified names can start with "$" (e.g. "$w"), and \b never matches before a "$"
        const notInName = '(?<![\\w$])';
        const headerPatterns = [
            new RegExp(`${notInName}${escapedName}\\s*=\\s*(?:async\\s*)?(?:\\([^)]*\\)|[a-zA-Z_$][\\w$]*)\\s*=>\\s*\\{`, 'g'),
            new RegExp(`${notInName}${escapedName}\\s*=\\s*(?:async\\s+)?function\\s*\\([^)]*\\)\\s*\\{`, 'g'),
            new RegExp(`(?:async\\s+)?function\\s+${escapedName}\\s*\\([^)]*\\)\\s*\\{`, 'g')
        ];

        for (const pattern of headerPatterns) {
            const match = pattern.exec(src);
            if (match) {
                const bodyStart = match.index + match[0].length;
                return { bodyStart, bodyEnd: findMatchingBrace(src, bodyStart), fnName };
            }
        }

        return null;
    };

    const findExportFunctionFromClickHandler = (src) => {
        const listenerPrefix =
            `[a-zA-Z_$][\\w$]*\\(\\s*["']exportgame["']\\s*\\)\\s*` +
            `\\.addEventListener\\(\\s*["']click["']\\s*,\\s*`;
        const listenerPatterns = [
            new RegExp(
                listenerPrefix +
                `(?:async\\s*)?\\(\\s*\\)\\s*=>\\s*(?:\\{\\s*)?(?:void\\s+)?([a-zA-Z_$][\\w$]*)\\s*\\(`,
                'g'
            ),
            new RegExp(listenerPrefix + `([a-zA-Z_$][\\w$]*)\\s*\\)`, 'g')
        ];

        for (const pattern of listenerPatterns) {
            const match = pattern.exec(src);
            if (!match) continue;
            const result = findFunctionBodyByName(src, match[1]);
            if (result) return result;
        }

        return null;
    };

    const findFunctionBodyBySemantics = (src, anchorStr, requiredMarkers, lookBehind = 20000) => {
        const headerPatterns = [
            /([a-zA-Z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z_$][\w$]*)\s*=>\s*\{/g,
            /([a-zA-Z_$][\w$]*)\s*=\s*(?:async\s+)?function\s*\([^)]*\)\s*\{/g,
            /(?:async\s+)?function\s+([a-zA-Z_$][\w$]*)\s*\([^)]*\)\s*\{/g
        ];

        let anchorIdx = src.indexOf(anchorStr);
        while (anchorIdx !== -1) {
            const windowStart = Math.max(0, anchorIdx - lookBehind);
            const beforeAnchor = src.slice(windowStart, anchorIdx);
            const candidates = [];

            for (const pattern of headerPatterns) {
                pattern.lastIndex = 0;
                let match;
                while ((match = pattern.exec(beforeAnchor)) !== null) {
                        const bodyStart = windowStart + match.index + match[0].length;
                        candidates.push({ bodyStart, bodyEnd: findMatchingBrace(src, bodyStart), fnName: match[1] });
                }
            }

            candidates.sort((a, b) => b.bodyStart - a.bodyStart);
            for (const candidate of candidates) {
                const candidatePrefix = src.slice(candidate.bodyStart, anchorIdx);
                if (requiredMarkers.every(marker => candidatePrefix.includes(marker))) {
                    return candidate;
                }
            }

            anchorIdx = src.indexOf(anchorStr, anchorIdx + anchorStr.length);
        }

        return null;
    };

    // Find the function containing a behavior marker, even when its header is
    // far away or a nested callback lies between the header and marker.
    const findEnclosingFunction = (src, anchorRe, markers, lookBehind = 100000) => {
        const headers = [
            /([a-zA-Z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[a-zA-Z_$][\w$]*)\s*=>\s*\{/g,
            /([a-zA-Z_$][\w$]*)\s*=\s*(?:async\s+)?function\s*\([^)]*\)\s*\{/g,
            /(?:async\s+)?function\s+([a-zA-Z_$][\w$]*)\s*\([^)]*\)\s*\{/g
        ];
        anchorRe.lastIndex = 0;
        let anchor;
        while ((anchor = anchorRe.exec(src)) !== null) {
            const start = Math.max(0, anchor.index - lookBehind);
            const prefix = src.slice(start, anchor.index);
            const candidates = [];
            for (const header of headers) {
                header.lastIndex = 0;
                let match;
                while ((match = header.exec(prefix)) !== null) {
                    candidates.push({ bodyStart: start + match.index + match[0].length, fnName: match[1] });
                }
            }
            candidates.sort((a, b) => b.bodyStart - a.bodyStart);
            for (const candidate of candidates) {
                const bodyEnd = findMatchingBrace(src, candidate.bodyStart);
                if (bodyEnd <= anchor.index) continue;
                const body = src.slice(candidate.bodyStart, bodyEnd);
                if (markers.every(marker => body.includes(marker))) return { ...candidate, bodyEnd };
            }
        }
        return null;
    };

    const findExportDataFunction = (src, fnResult) => {
        if (!fnResult || fnResult.bodyEnd < fnResult.bodyStart) return null;
        const body = src.slice(fnResult.bodyStart, fnResult.bodyEnd);
        const awaitedCall = /\bawait\s+([a-zA-Z_$][\w$]*)\s*\(/g;
        let match;
        const awaitedNames = [];
        while ((match = awaitedCall.exec(body)) !== null) awaitedNames.push(match[1]);

        let terminalFallback = null;
        for (const fnName of awaitedNames.reverse()) {
            if (fnName === fnResult.fnName) continue;
            const result = findFunctionBodyByName(src, fnName);
            if (!result || result.bodyEnd < result.bodyStart) continue;
            terminalFallback ??= result;
            const candidateBody = src.slice(result.bodyStart, result.bodyEnd);
            const readsExportMode = candidateBody.includes('"saveType"') || candidateBody.includes("'saveType'");
            const writesClipboardOrFile = candidateBody.includes('clipboard')
                || candidateBody.includes('createObjectURL')
                || candidateBody.includes('Blob');
            if (readsExportMode && writesClipboardOrFile) return result;
        }

        // Older/minimal bundles may strip the recognizable DOM/output markers.
        // In exportSynergism the save-output call has historically been the final await.
        return terminalFallback;
    };

    // ==================================================================================
    // ────── EXPORT PATCH ─ Expose exportSynergism and suppress only its final
    // save-output helper when autosing requests a quark-only export.
    // Primary strategy: follow the stable exportgame click listener to the
    // minified function it invokes. Fall back to save-export behavior if the
    // listener wiring changes. Neither strategy depends on parameter spelling.
    const exportListenerResult = findExportFunctionFromClickHandler(code);
    const exportResult = exportListenerResult || findFunctionBodyBySemantics(
        code, 'Synergysave2', ['.offlinetick', '.lastExportedSave']
    );
    if (exportResult) {
        const exportFn = exportResult.fnName;
        const exportDataResult = findExportDataFunction(code, exportResult);
        const exportDataFn = exportDataResult?.fnName;
        let suppressOutput = '';
        if (exportDataResult && exportDataFn) {
            suppressOutput = `\nif(window.__HS_SUPPRESS_EXPORT_ONCE){` +
                `window.__HS_SUPPRESS_EXPORT_ONCE=false;` +
                `console.log('[HS-PATCH] ✅ Save output suppressed (quarks awarded)');` +
                `return;` +
                `}\n`;
            log(`Patched exportData output guard (fn=${exportDataFn})`);
        } else {
            warn('Found exportSynergism but could not identify its final awaited exportData helper');
        }

        const expose = exportFn
            ? `\nif(!window.__HS_EXPORT_EXPOSED){` +
            `window.__HS_exportSynergism=${exportFn};` +
            (exportDataFn ? `window.__HS_exportData=${exportDataFn};window.__HS_EXPORT_OUTPUT_PATCHED=true;` : '') +
            `window.__HS_EXPORT_EXPOSED=true;` +
            `console.log('[HS-PATCH] \u2705 exportSynergism exposed');` +
            `}` +
            `if(window.__HS_SILENT_EXPORT)return;` +
            `\n`
            : `\nif(!window.__HS_EXPORT_EXPOSED){` +
            `window.__HS_EXPORT_EXPOSED=true;` +
            `console.log('[HS-PATCH] \u26a0\ufe0f exportSynergism found but fn name unknown');` +
            `}` +
            `if(window.__HS_SILENT_EXPORT)return;` +
            `\n`;
        const insertions = [{ index: exportResult.bodyStart, text: expose }];
        if (exportDataResult && suppressOutput) {
            insertions.push({ index: exportDataResult.bodyStart, text: suppressOutput });
        }
        insertions.sort((a, b) => b.index - a.index);
        for (const insertion of insertions) {
            code = code.slice(0, insertion.index) + insertion.text + code.slice(insertion.index);
        }
        log(`Patched exportSynergism (fn=${exportFn ?? 'unknown'}, output=${exportDataFn ?? 'unavailable'}, via=${exportListenerResult ? 'click-handler' : 'semantic-fallback'})`);
    } else {
        warn('Could not patch exportSynergism — click handler and semantic fallback did not match');
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
    // ────── PLAYER PATCH ─ Capture the game's player initializer regardless of its minified name.
    try {
        const re = /\b([a-zA-Z_$][\w$]*)\s*=\s*\{\s*firstPlayed\s*:\s*new Date\(\)\.toISOString\(\)\s*,\s*worlds\s*:/g;
        let m;
        let patched = false;
        while ((m = re.exec(code)) !== null) {
            const objectStart = m.index + m[0].lastIndexOf('{');
            const objectEnd = findMatchingBrace(code, objectStart + 1);
            if (objectEnd < 0 || !code.slice(objectStart, objectEnd).includes('challengecompletions:')) continue;
            const capture = '(function(player){window.symp=window.symp||Symbol();' +
                'Object.defineProperty(window,window.symp,{enumerable:false,configurable:true,writable:true,value:player});' +
                'console.log("[HS-PATCH] \u2705 Symbol exposed");return player})(';
            code = code.slice(0, objectStart) + capture + code.slice(objectStart, objectEnd + 1) + ')' + code.slice(objectEnd + 1);
            log(`Patched player initializer (variable=${m[1]})`);
            patched = true;
            break;
        }
        if (!patched) warn('Could not find player initializer in game bundle');
    } catch (e) {
        warn('Error while patching player initializer', e);
    }

    // ==================================================================================
    // ── GETMAXCHALLENGES PATCH — expose Challenges.ts getMaxChallenges as window.__HS_getMaxChallenges
    // Match challenge-cap behavior without assuming minified variable names.
    try {
        const gmcResult = findEnclosingFunction(code, /\.cubeUpgrades\s*\[\s*29\s*\]/g,
            ['researches[105]', 'oneChallengeCap', 'reincarnationChallengeCap']);
        if (gmcResult) {
            const gmcFn = gmcResult.fnName;
            const expose =
                `\nif(!window.__HS_CHALLENGES_EXPOSED){` +
                    `window.__HS_getMaxChallenges=${gmcFn};` +
                    `window.__HS_CHALLENGES_EXPOSED=true;` +
                    `console.log('[HS-PATCH] \u2705 getMaxChallenges exposed (fn=${gmcFn})');` +
                `}\n`;
            code = code.slice(0, gmcResult.bodyStart) + expose + code.slice(gmcResult.bodyStart);
            log(`Patched getMaxChallenges (fn=${gmcFn})`);
        } else {
            warn('Could not patch getMaxChallenges — challenge-cap behavior not found in bundle');
        }
    } catch (e) {
        warn('Error while patching getMaxChallenges', e);
    }

    // ==================================================================================
    // ── TACK PATCH — wrap tack() to fire registered after-tack hooks
    // Find the enclosing update from its timer behavior, not a nearby arrow.
    try {
        const tackResult = findEnclosingFunction(code, /["']autoPotion["']/g,
            ['prestige', 'autoPotion', 'ascension', 'quarks']);
        if (tackResult) {
            const tackPatch =
                `if(!window.__HS_TACK_PATCHED){` +
                    `window.__HS_TACK_PATCHED=true;` +
                    `window.__HS_tackHooks=[];` +
                    `window.__HS_onAfterTack=function(fn){window.__HS_tackHooks.push(fn);};` +
                    `console.log('[HS-PATCH] \u2705 tack() patched (fn=${tackResult.fnName})');` +
                `}` +
                `queueMicrotask(()=>{const h=window.__HS_tackHooks.splice(0);for(let i=0;i<h.length;i++)h[i]();});`;
            code = code.slice(0, tackResult.bodyStart) + tackPatch + code.slice(tackResult.bodyStart);
            log(`Patched tack() (fn=${tackResult.fnName})`);
        } else {
            warn('Could not patch tack() — game-time timer behavior not found in bundle');
        }
    } catch (e) {
        warn('Error while patching tack()', e);
    }

    // ==================================================================================
    // ── DIALOG HOOK PATCH — let the mod see every game dialog when it's queued, and answer it before it's shown.
    // The 5 dialog functions (Confirm, Alert, InfoAlert, Prompt, PurchasePrompt) share one queue and one shape:
    //   je=async e=>Jf.enqueue(()=>{let t=c("confirmationBox"),r=c("confirmWrapper"), …
    // Each one is found by its own wrapper id (DOM ids the mod already relies on), whatever their order.
    // 1. An extra default parameter records the dialog's origin when it's queued (defaults are evaluated at call time):
    //    e=>  becomes  (e,__hsO=window.__HS_dialogOrigin?.("confirm",e))=>
    // 2. At the start of the queued action (when the dialog reaches the front of the queue), the mod may answer it:
    //    window.__HS_onDialog(kind, origin) returns { value } to resolve the dialog without showing it, or undefined to show it.
    // Without the mod's hook (older mod), window.__HS_AUTO_CONFIRM still auto-answers Confirm and Alert, as the old patch did.
    // All 5 or none: with a partial match, the mod falls back to clicking dialogs through the DOM.
    try {
        const dialogKinds = {
            confirmWrapper: 'confirm',
            alertWrapper: 'alert',
            infoAlertWrapper: 'infoAlert',
            promptWrapper: 'prompt',
            purchasePromptWrapper: 'purchasePrompt'
        };
        // Old mod versions only know __HS_AUTO_CONFIRM, for these two kinds
        const legacyAnswers = { confirm: '!0', alert: 'void 0' };
        const dialogRe = /(?<![\w$])[\w$]+\s*=\s*(?:async\s*)?(\([^)]*\)|[\w$]+)\s*=>\s*[\w$.]+\.enqueue\(\s*\(\s*\)\s*=>\s*(\{)\s*(?:let|const|var)\s+[\w$]+\s*=\s*[\w$]+\(\s*["']confirmationBox["']\s*\)\s*,\s*[\w$]+\s*=\s*[\w$]+\(\s*["'](confirmWrapper|alertWrapper|infoAlertWrapper|promptWrapper|purchasePromptWrapper)["']\s*\)/dg;

        const sites = [];
        let m;
        while ((m = dialogRe.exec(code)) !== null) {
            const [paramsStart, paramsEnd] = m.indices[1];
            sites.push({ kind: dialogKinds[m[3]], params: m[1], paramsStart, paramsEnd, bodyStart: m.indices[2][1] });
        }

        const foundKinds = sites.map(site => site.kind);
        const allFoundOnce = Object.values(dialogKinds).every(kind => foundKinds.filter(k => k === kind).length === 1);
        if (!allFoundOnce) {
            warn(`Could not patch the game dialogs — expected each of the 5 once, found: [${foundKinds.join(', ')}]`);
        } else {
            // Highest index first, so earlier insertions don't move later ones
            const edits = [];
            for (const site of sites) {
                const list = site.params.startsWith('(') ? site.params.slice(1, -1).trim() : site.params.trim();
                const firstParam = list.split(',')[0].trim();
                const originArgs = /^[\w$]+$/.test(firstParam) ? `"${site.kind}",${firstParam}` : `"${site.kind}"`;
                const originParam = `__hsO=window.__HS_dialogOrigin?.(${originArgs})`;
                edits.push({
                    start: site.paramsStart, end: site.paramsEnd,
                    text: `(${list ? `${list},` : ''}${originParam})`
                });
                const legacy = legacyAnswers[site.kind];
                edits.push({
                    start: site.bodyStart, end: site.bodyStart,
                    text: `\nconst __hsA=window.__HS_onDialog?.("${site.kind}",__hsO);if(__hsA)return Promise.resolve(__hsA.value);` +
                        (legacy ? `if(!window.__HS_onDialog&&window.__HS_AUTO_CONFIRM)return Promise.resolve(${legacy});` : '') +
                        `\n`
                });
            }
            edits.sort((a, b) => b.start - a.start);
            for (const edit of edits) {
                code = code.slice(0, edit.start) + edit.text + code.slice(edit.end);
            }
            // __HS_AUTO_CONFIRM_PATCHED: older mod versions check it before relying on __HS_AUTO_CONFIRM
            code = 'window.__HS_DIALOG_HOOK_PATCHED = true;window.__HS_AUTO_CONFIRM_PATCHED = true;\n' + code;
            log('Patched the 5 game dialogs (dialog hook)');
        }
    } catch (e) {
        warn('Error while patching the game dialogs', e);
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
                // Escaped, and not \b: minified names can start with "$", and \b never matches before a "$"
                const escapedCorrFn = corrFn.replace(/\$/g, '\\$');
                const fnHeaderRe = new RegExp(`(?<![\\w$])${escapedCorrFn}\\s*=\\s*e\\s*=>\\s*\\{`, 'g');
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
    // ── VALIDATEBLUEBERRYTREE PATCH — expose BlueberryUpgrades.ts validateBlueberryTree as window.__HS_validateBlueberryTree
    // Lets the mod check an ambrosia tree before writing it into a loadout slot itself (no import through the game,
    // which replaces the live tree and shows dialogs). It only reads the player's state.
    // Found by what it does, not by minified names or call shapes: the function checking the Exalt unlock criteria
    // (string literals "Exalt1x1", "Exalt5x1", "Exalt9x1") against the ambrosia budget (player.lifetimeAmbrosia).
    // Exposed where it's defined when it's an arrow or a function expression, so it exists as soon as the bundle runs:
    //   eK=e=>{  becomes  eK=window.__HS_validateBlueberryTree=e=>{
    // Otherwise at the start of its body: it then exists once the game has validated a tree (at the first loadout load).
    try {
        const vbtResult = findEnclosingFunction(code, /["']Exalt9x1["']/g, ['lifetimeAmbrosia', 'Exalt1x1', 'Exalt5x1']);
        if (vbtResult) {
            const fn = vbtResult.fnName;
            // Escaped, and not \b: minified names can start with "$"
            const escapedFn = fn.replace(/\$/g, '\\$');
            const headerStart = Math.max(0, vbtResult.bodyStart - 300);
            const header = code.slice(headerStart, vbtResult.bodyStart);
            const exprHeader = new RegExp(
                `(?<![\\w$.])${escapedFn}\\s*=\\s*(?=(?:async\\s*)?(?:\\([^)]*\\)|[\\w$]+)\\s*=>\\s*\\{$|(?:async\\s+)?function\\s*\\([^)]*\\)\\s*\\{$)`
            ).exec(header);
            if (exprHeader) {
                const insertAt = headerStart + exprHeader.index + exprHeader[0].length;
                code = code.slice(0, insertAt) + 'window.__HS_validateBlueberryTree=' + code.slice(insertAt);
                log(`Patched validateBlueberryTree (fn=${fn})`);
            } else {
                code = code.slice(0, vbtResult.bodyStart) + `\nwindow.__HS_validateBlueberryTree=${fn};\n` + code.slice(vbtResult.bodyStart);
                log(`Patched validateBlueberryTree at its first call (fn=${fn})`);
            }
        } else {
            warn('Could not patch validateBlueberryTree — Exalt unlock check not found in bundle');
        }
    } catch (e) {
        warn('Error while patching validateBlueberryTree', e);
    }

    // ==================================================================================
    // ── SAVE IMPORT HOOK PATCH — tell the mod when the game is about to load a save
    // ImportExport.ts importSynergism(input, reset) loads every save: a file, a cloud save, the Steam cloud, and with
    // reset = true a singularity, an Exalt and the game reset. The mod stops autosing on the first three.
    // Found by what it does, not by minified names or call shapes: the function holding the import's own error keys
    // ("importexport.loadTestInLive", "importexport.unableImport") and the save's "exporttest" check.
    // At the start of its body, with its second parameter (reset):
    //   Ic=(e,t=!1)=>{  becomes  Ic=(e,t=!1)=>{try{window.__HS_onSaveImport?.(t)}catch(__hsE){}
    // The try: importSynergism ends every singularity, and an error from the mod must not stop the game there.
    try {
        const importResult = findEnclosingFunction(code, /["']importexport\.loadTestInLive["']/g,
            ['importexport.unableImport', 'exporttest']);
        if (importResult) {
            const header = code.slice(Math.max(0, importResult.bodyStart - 300), importResult.bodyStart);
            const params = /\(([^)]*)\)\s*(?:=>\s*)?\{$/.exec(header);
            const resetParam = params?.[1].split(',')[1]?.split('=')[0].trim();
            if (resetParam && /^[\w$]+$/.test(resetParam)) {
                code = code.slice(0, importResult.bodyStart) +
                    `\ntry{window.__HS_onSaveImport?.(${resetParam})}catch(__hsE){}\n` +
                    code.slice(importResult.bodyStart);
                code = 'window.__HS_SAVE_IMPORT_HOOK_PATCHED = true;\n' + code;
                log(`Patched importSynergism (save import hook, fn=${importResult.fnName})`);
            } else {
                warn('Could not patch the save import hook — importSynergism has no second (reset) parameter');
            }
        } else {
            warn('Could not patch the save import hook — importSynergism not found in bundle');
        }
    } catch (e) {
        warn('Error while patching the save import hook', e);
    }

    // ==================================================================================
    // ── CONSUMABLES PATCH — expose Login.ts allDurableConsumables as window.__HS_consumables
    // The game's own consumables WebSocket keeps the active Happy Hour Bells in that object; the mod
    // reads it instead of opening a second connection for the same account (refused by the server).
    // Captured by its initializer, the same way as the player: no minified name is read.
    //   Ro={HAPPY_HOUR_BELL:{amount:0,ends:[],displayName:""}}
    //   becomes  Ro=(function(o){window.__HS_consumables=o;return o})({HAPPY_HOUR_BELL:{...}})
    // The game only replaces the entries of this object (resetWebSocket), never the object, so the reference stays live.
    try {
        const re = /HAPPY_HOUR_BELL["']?\s*:\s*\{\s*amount\s*:\s*0\s*,\s*ends\s*:\s*\[\s*\]/g;
        let m;
        let patched = false;
        while ((m = re.exec(code)) !== null) {
            // The enclosing object literal, assigned to a variable: `=` then `{` right before the key
            const before = /=\s*\{\s*["']?$/.exec(code.slice(Math.max(0, m.index - 50), m.index));
            if (!before) continue;
            const objectStart = m.index - before[0].length + before[0].indexOf('{');
            const objectEnd = findMatchingBrace(code, objectStart + 1);
            if (objectEnd < 0 || !code.slice(objectStart, objectEnd).includes('displayName')) continue;
            const capture = '(function(o){window.__HS_consumables=o;return o})(';
            code = code.slice(0, objectStart) + capture + code.slice(objectStart, objectEnd + 1) + ')' + code.slice(objectEnd + 1);
            log('Patched consumables (window.__HS_consumables)');
            patched = true;
            break;
        }
        if (!patched) warn('Could not patch consumables — the HAPPY_HOUR_BELL initializer was not found in bundle');
    } catch (e) {
        warn('Error while patching consumables', e);
    }

    // ==================================================================================
    // ── GLOBAL EVENT PATCH — hand Event.ts eventCheck's answer to the mod (window.__HS_globalEvent / __HS_onGlobalEvent)
    // The game fetches https://synergism.cc/events/get at load and every 5 minutes; the mod reads that answer
    // instead of fetching it again (the game's dev asked for less traffic). Found by its URL string and the
    // save's dayCheck test. A local `fetch` at the start of its body shadows the browser's for this function only:
    //   oL=async()=>{if(!n.dayCheck)return;let e=await fetch("https://synergism.cc/events/get");...
    //   becomes  oL=async()=>{const fetch=(...a)=>window.fetch(...a).then(<copy of an ok answer to the mod>);if(!n.dayCheck)...
    // The game gets the browser's response untouched; the mod reads a clone. Nothing from the mod can throw into the game.
    try {
        const eventResult = findEnclosingFunction(code, /["']https:\/\/synergism\.cc\/events\/get["']/g, ['dayCheck', '.json()']);
        if (eventResult) {
            const shadow =
                '\nconst fetch=(...__hsA)=>window.fetch(...__hsA).then(__hsR=>{try{if(__hsR&&__hsR.ok)' +
                '__hsR.clone().json().then(__hsJ=>{window.__HS_globalEvent=__hsJ;' +
                'try{window.__HS_onGlobalEvent?.(__hsJ)}catch(__hsE){}},()=>{})}catch(__hsE){}return __hsR});\n';
            code = code.slice(0, eventResult.bodyStart) + shadow + code.slice(eventResult.bodyStart);
            code = 'window.__HS_GLOBAL_EVENT_PATCHED = true;\n' + code;
            log(`Patched eventCheck (global event, fn=${eventResult.fnName})`);
        } else {
            warn('Could not patch the global event — eventCheck not found in bundle');
        }
    } catch (e) {
        warn('Error while patching the global event', e);
    }

    // ==================================================================================
    if (options.steam) {
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

    }

    // ==================================================================================

    log('Bundle patching complete');
    return code;
}

// Removing an already prepared script cannot cancel its execution. Keep this
// narrowly scoped guard for the page lifetime, including after injection.
function guardBrowserGameElements(getPatchedScript, onBlocked) {
    const gameElements = ['tab-row', 'sub-tab'];
    const assertUnclaimed = () => {
        if (gameElements.some(name => customElements.get(name))) {
            throw new Error('The original game registered its UI before the loader started. Enable the userscript at document-start and refresh.');
        }
    };
    assertUnclaimed();

    const cancelled = new WeakSet();
    window.addEventListener('error', event => {
        // Suppress only our cancellation, never real errors matched by text.
        if (event.error && cancelled.has(event.error)) event.preventDefault();
    }, true);

    const wrap = define => function (name, ctor, options) {
        if (gameElements.includes(name) &&
            (!getPatchedScript() || document.currentScript !== getPatchedScript())) {
            const cancellation = new Error('Hypersynergism cancelled an unpatched game bundle');
            cancelled.add(cancellation);
            onBlocked();
            // Returning would let new TabRow() run with an unregistered
            // constructor, which causes the reported Illegal constructor.
            throw cancellation;
        }
        return define.call(this, name, ctor, options);
    };
    let guardedDefine = wrap(customElements.define);
    Object.defineProperty(customElements, 'define', {
        configurable: true,
        get: () => guardedDefine,
        // Allow the game's polyfill to replace define without losing the guard.
        // Each wrapper captures its own delegate to avoid recursive delegation.
        set: define => { guardedDefine = wrap(define); }
    });
    // Leave the polyfill's extends-br support probe intact, along with unrelated
    // registrations. A global define no-op invalidates feature detection.
    return assertUnclaimed;
}

function startBrowserLoader(options) {
    'use strict';
    const { dev = false } = options || {};
    if (window.HS_LOADER_INITIALIZED) return;
    window.HS_LOADER_INITIALIZED = true;

    const loaderVersion = '4.3';
    const startTime = performance.now();
    const log = (...a) => console.log(`%c[HS-LOADER v${loaderVersion} +${(performance.now() - startTime).toFixed(0)}ms]`, 'color:#4af', ...a);
    const warn = (...a) => console.warn(`%c[HS-LOADER v${loaderVersion} +${(performance.now() - startTime).toFixed(0)}ms]`, 'color:#fa4', ...a);
    const debug = (...a) => console.debug(`%c[HS-LOADER v${loaderVersion} +${(performance.now() - startTime).toFixed(0)}ms]`, 'color:#aaa', ...a);

    const originalFetch = window.fetch.bind(window);
    const isFirefox = navigator.userAgent.includes('Firefox');
    log(`Browser: ${isFirefox ? 'Firefox' : 'Not Firefox'}`);

    // ─── State ────────────────────────────────────────────────────────────────
    let gameScriptDetected = false;
    let patchedScript = null;
    const fail = error => {
        window.__HS_LOADER_ERROR = String(error?.message || error);
        warn('Loader stopped:', error);
    };
    let assertUnclaimed;
    try {
        assertUnclaimed = guardBrowserGameElements(() => patchedScript, () => {
            debug('Cancelled an escaped original game bundle before UI construction');
            gameScriptDetected = true;
            // Leave the original script's stack before beginning injection.
            queueMicrotask(() => injectPatchedBundle().catch(fail));
        });
    } catch (error) {
        fail(error);
        return;
    }

    // ─── Fetch block ──────────────────────────────────────────────────────────
    window.fetch = async function (input, init) {
        const url = typeof input === 'string' ? input
            : input instanceof Request ? input.url
                : '';
        if (shouldBlockScript(url)) {
            debug(`Fetch blocked: ${url.substring(0, 80)}`);
            return new Response('', { status: 200 });
        }
        return originalFetch(input, init);
    };

    function shouldBlockScript(src) {
        return src.includes('rocket-loader') || /\/dist\/out.*\.js/.test(src);
    }

    // Rocket Loader can clone the original out.js and insert it before our
    // MutationObserver callback runs. Mark that clone inert before insertion.
    // Fire a synthetic load so Rocket Loader can advance its script queue.
    function interceptInsertedGameScript(node) {
        if (node?.nodeType !== 1 || node.localName !== 'script') return false;
        const src = node.src || node.getAttribute('src') || '';
        if (!/\/dist\/out.*\.js(?:[?#]|$)/.test(src)) return false;
        node.type = 'application/x-hs-blocked';
        node.setAttribute('data-hs-inert', '');
        if (!gameScriptDetected) {
            gameScriptDetected = true;
            injectPatchedBundle().catch(fail);
        }
        debug(`Blocked game script before DOM insertion: ${src.substring(0, 80)}`);
        return true;
    }

    function acknowledgeBlockedScript(node) {
        queueMicrotask(() => {
            node.dispatchEvent(new Event('load'));
            node.remove();
        });
    }

    const nativeInsertBefore = Node.prototype.insertBefore;
    Node.prototype.insertBefore = function (node, referenceNode) {
        const blocked = interceptInsertedGameScript(node);
        const inserted = nativeInsertBefore.call(this, node, referenceNode);
        if (blocked) acknowledgeBlockedScript(node);
        return inserted;
    };
    const nativeAppendChild = Node.prototype.appendChild;
    Node.prototype.appendChild = function (node) {
        const blocked = interceptInsertedGameScript(node);
        const inserted = nativeAppendChild.call(this, node);
        if (blocked) acknowledgeBlockedScript(node);
        return inserted;
    };
    const nativeReplaceChild = Node.prototype.replaceChild;
    Node.prototype.replaceChild = function (node, oldNode) {
        const blocked = interceptInsertedGameScript(node);
        const replaced = nativeReplaceChild.call(this, node, oldNode);
        if (blocked) acknowledgeBlockedScript(node);
        return replaced;
    };

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
                    injectPatchedBundle().catch(fail);
                }
            }
        };
        document.addEventListener('beforescriptexecute', beforeScriptExecute, true);
    }

    // Best-effort cleanup: observers run AFTER insertion and cannot cancel an
    // already prepared script. The custom-element guard handles escaped copies.
    const mo = new MutationObserver(muts => {
        for (const m of muts) {
            for (const n of m.addedNodes) {
                if (n.tagName !== 'SCRIPT') continue;
                if (n.hasAttribute('data-hs-inert')) continue;
                const src = n.src || '';
                if (shouldBlockScript(src)) {
                    n.type = 'javascript/blocked';
                    n.remove();
                    debug(`Blocked (MutationObserver): ${src.substring(0, 60)}`);
                    if (!gameScriptDetected && /\/dist\/out.*\.js/.test(src)) {
                        gameScriptDetected = true;
                        injectPatchedBundle().catch(fail);
                    }
                }
            }
        }
    });
    mo.observe(document, { childList: true, subtree: true });

    // Also check scripts that may already exist in the DOM at injection time.
    function checkExistingScripts() {
        for (const script of Array.from(document.getElementsByTagName('script'))) {
            if (script.src && /\/dist\/out.*\.js/.test(script.src)) {
                script.type = 'javascript/blocked';
                script.remove();
                if (!gameScriptDetected) {
                    gameScriptDetected = true;
                    injectPatchedBundle().catch(fail);
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
                // The mod's header (HSGlobal.Common.modRequestHeaders); the mod isn't loaded yet, so no version
                headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate', 'Pragma': 'no-cache', 'X-HyperSynergism-Version': 'loader' }
            });
            if (!res.ok) throw new Error(`Game bundle returned HTTP ${res.status}`);
            code = await res.text();
            log(`Bundle fetched, size: ${(code.length / 1024).toFixed(0)}KB`);
        } catch (e) {
            fail(e);
            return;
        }

        // ==================================================================================
        code = patchBundle(code, { log, warn });

        // Wait until the browser has finished parsing the HTML (DOMContentLoaded).
        // Checking document.body is not enough — the body element can exist while
        // the rest of the DOM is still being built, causing querySelector calls
        // inside the game bundle to hit null elements.
        if (document.readyState === 'loading') {
            await new Promise(resolve =>
                document.addEventListener('DOMContentLoaded', resolve, { once: true })
            );
        }


        // ==================================================================================
        // ── Phase 2: Inject patched bundle ────────────────────────────────────────────────
        // ==================================================================================

        assertUnclaimed();
        log('Injecting patched bundle');

        const gameScript = document.createElement('script');
        patchedScript = gameScript;
        window.__HS_BUNDLE_EXECUTED__ = false;
        gameScript.textContent = code + '\n;window.__HS_BUNDLE_EXECUTED__ = true;\n//# sourceURL=hypersynergism-patched-game.js';
        (document.body || document.head || document.documentElement).appendChild(gameScript);
        // The script has been parsed and executed — drop the source text so the
        // ~1.6 MB string can be garbage-collected.
        gameScript.textContent = '';
        if (!window.__HS_BUNDLE_EXECUTED__) {
            throw new Error('Patched game bundle did not finish executing; see the preceding script error.');
        }

        // Keep the element guard and insertion hooks: a prepared original can
        // execute even after this point. Only the best-effort observer is done.
        try { mo.disconnect(); } catch { }
        if (isFirefox && beforeScriptExecute) {
            document.removeEventListener('beforescriptexecute', beforeScriptExecute, true);
        }
        // Restore fetch — the block on /dist/out*.js is no longer needed.
        window.fetch = originalFetch;
        log('Bundle executed; late original game copies remain guarded');


        // ==================================================================================
        // ── Phase 3: Ensure the game initialises ──────────────────────────────────────────
        // ==================================================================================

        // The game hooks onto window's "load" event. When we inject the bundle
        // after window.load has already fired, the game never receives it, so
        // the player object is never set up. Replay only if load already fired;
        // otherwise the real event will initialize the game once.
        if (document.readyState === 'complete') {
            log('Dispatching synthetic load event to initialise game');
            window.dispatchEvent(new Event('load'));
        }

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
                        `exportSynergism:     typeof window.__HS_exportSynergism,` +
                        `exportData:          typeof window.__HS_exportData,` +
                        `exportOutputPatched: !!window.__HS_EXPORT_OUTPUT_PATCHED,` +
                        `getMaxChallenges:    typeof window.__HS_getMaxChallenges,` +
                        `applyCorruptions:    typeof window.__HS_applyCorruptions,` +
                        `validateBlueberryTree: typeof window.__HS_validateBlueberryTree,` +
                        `dialogHookPatched:   !!window.__HS_DIALOG_HOOK_PATCHED,` +
                        `saveImportHookPatched: !!window.__HS_SAVE_IMPORT_HOOK_PATCHED,` +
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

    // Read a boolean mod setting from the mod's own storage (HSSettings → HSStorage:
    // key 'hs-settings', JSON encoded twice, { [settingName]: { enabled, ... } }).
    // The mod isn't loaded yet at this point, so fall back to its default.
    function readModBooleanSetting(settingName, fallback) {
        try {
            const raw = localStorage.getItem('hs-settings');
            if (!raw) return fallback;
            let settings = JSON.parse(raw);
            if (typeof settings === 'string') settings = JSON.parse(settings);
            const enabled = settings?.[settingName]?.enabled;
            return typeof enabled === 'boolean' ? enabled : fallback;
        } catch (e) {
            return fallback;
        }
    }

    async function runPostLoadSequence() {
        try {
            // Phase 4: Wait for the game to finish loading.
            // The offline container is the game's own "loading done" signal —
            // it only appears after the save has been read and the UI is ready.
            // Also accept body.loading being gone: the page starts with it and only
            // the popup's exit removes it, so the player already closed the popup.
            log('Phase 4 — waiting for offlineContainer to appear...');
            await waitFor(
                () => {
                    const el = document.getElementById('offlineContainer');
                    return (el && getComputedStyle(el).display !== 'none')
                        || !document.body.classList.contains('loading');
                },
                60000,
                'offlineContainer to become visible'
            );
            log('Game is loaded (offlineContainer visible or already closed)');

            const isExposed = () => window.__HS_EXPOSED && window.__HS_EXPORT_EXPOSED;
            const isOfflineOpen = () => {
                const el = document.getElementById('offlineContainer');
                return !!el && getComputedStyle(el).display !== 'none';
            };
            const dismissOffline = async () => {
                if (!isOfflineOpen()) return;
                log('Dismissing offlineContainer...');
                const offlineContainer = document.getElementById('offlineContainer');
                const exitBtn = document.getElementById('exitOffline')
                    || offlineContainer.querySelector('button');
                if (exitBtn) exitBtn.click();
                // Wait 100 ms for the dismissal animation and any post-modal setup.
                await new Promise(r => setTimeout(r, 100));
            };
            const navigateForExposure = async () => {
                await clickWhenAvailable('settingstab');
                await new Promise(r => setTimeout(r, 300));
                await clickWhenAvailable('switchSettingSubTab4');
                await new Promise(r => setTimeout(r, 300));
                await clickWhenAvailable('kMisc');
                await new Promise(r => setTimeout(r, 300));

                // Trigger exportSynergism silently to expose both export functions.
                window.__HS_SILENT_EXPORT = true;
                await clickWhenAvailable('exportgame');
                window.__HS_SILENT_EXPORT = false;
            };

            // Phase 5: Trigger exposure by navigating to Settings → Misc → Export.
            // Done behind the offline popup: the game's tab buttons don't check for it,
            // so the player doesn't see the tab switching. The export exposes itself
            // right away (its click handler runs it directly).
            log('Phase 5 — navigating to Settings (behind the offline popup) to trigger exposure...');
            await navigateForExposure();
            await waitFor(() => window.__HS_EXPORT_EXPOSED, 20000, '__HS_EXPORT_EXPOSED');

            // The stage is only exposed when the game renders the Misc stats, and the game
            // pauses its display updates while the offline popup is open. So it happens on
            // the first update after the popup closes, with Misc still active behind it.
            if (readModBooleanSetting('autoDismissOfflinePopup', true)) {
                await dismissOffline();
            }

            if (!isOfflineOpen()) {
                log('Waiting for stage and export exposure flags...');
                await waitFor(isExposed, 20000, '__HS_EXPOSED and __HS_EXPORT_EXPOSED');
                log('Exposure complete — stage and export are ready');

                // Return to Buildings tab so the game looks normal to the player.
                await clickWhenAvailable('buildingstab');
                await new Promise(r => setTimeout(r, 300));
            } else {
                // Popup kept open (autoDismissOfflinePopup is off): load the mod now, the stage
                // gets exposed when the player closes the popup, then go back to Buildings.
                log('Keeping offlineContainer open (autoDismissOfflinePopup is off) — stage will be exposed when it closes');
                waitFor(() => window.__HS_EXPOSED, 24 * 3600 * 1000, '__HS_EXPOSED')
                    .then(() => {
                        log('Exposure complete — stage and export are ready');
                        return clickWhenAvailable('buildingstab');
                    })
                    .catch(e => warn('Stage exposure after the offline popup failed:', e));
            }

            // Phase 6: Load the mod.
            await loadMod();

        } catch (e) {
            warn('Post-load sequence failed:', e);
        }
    }

    function loadMod() {
        const modSource = dev ? 'LOCAL DEV SERVER' : 'CDN';
        log(`Phase 6 — loading mod from ${modSource}...`);
        window.__HS_REPO = window.__HS_REPO || (dev ? 'maenhiir' : 'Ferlieloi');
        window.__HS_VERSION = window.__HS_VERSION ? window.__HS_VERSION : 'master';
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            const url = dev
                ? `http://127.0.0.1:8080/hypersynergism.js?t=${Date.now()}`
                : `https://cdn.jsdelivr.net/gh/${window.__HS_REPO}/synergism-hypersynergy@${window.__HS_VERSION}/release/mod/hypersynergism_release.js?t=${Date.now()}`;
            s.src = url;
            s.onload = () => {
                log(`✅ Mod script loaded from ${modSource}: ${url}`);
                // src/mod/index.ts creates and initializes hypersynergism itself.
                // Calling init() here races that asynchronous initialization and
                // makes "Mod initialised" appear before the work has completed.
                log('Mod entrypoint started initialization');
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

}

// Loader 0.2.6 and older call module.exports directly. Keep that interface
// while exposing the named methods used by the browser loaders and newer code.
function patchSteamBundle(code, options = {}) {
    return patchBundle(code, { ...options, steam: true });
}

patchSteamBundle.patchBundle = patchBundle;
patchSteamBundle.startBrowserLoader = startBrowserLoader;
module.exports = patchSteamBundle;
