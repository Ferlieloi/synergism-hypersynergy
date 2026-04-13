// ==UserScript==
// @name         HyperSynergism Bridge Loader
// @namespace    https://github.com/Ferlieloi
// @version      1.1
// @description  Evergreen bridge to official Hypersynergism mod
// @author       Ferlieloi
// @match        https://synergism.cc/*
// @grant        none
// @run-at       document-start
// @updateURL    https://cdn.jsdelivr.net/gh/Ferlieloi/synergism-hypersynergy@latest/src/loader/tampermonkey-bridge.user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/Ferlieloi/synergism-hypersynergy@latest/src/loader/tampermonkey-bridge.user.js
// ==/UserScript==

// Production Evergreen Bridge.
// Install once - auto-updates.
// Loads the full "true" loader (hypersynergism.user.js) using a cache-busting fetch
// so the latest version is used instead of a stale cached copy.

(function () {
    'use strict';
    const repo = 'Ferlieloi';   // 'Ferlieloi', 'maenhiir'
    const version = 'latest';   // 'latest', specific commit, (specific tag?)
    const base = `https://cdn.jsdelivr.net/gh/${repo}/synergism-hypersynergy@${version}/src/loader/hypersynergism.user.shewchou.js`;
    const url = base + (base.includes('?') ? '&' : '?') + 't=' + Date.now();
    window.__HS_REPO = `${repo}`;
    window.__HS_VERSION = `${version}`;
    try {
        (async function () {
            const res = await fetch(url, { cache: 'no-cache', credentials: 'omit', mode: 'cors' });
            if (!res.ok) {
                console.error('Hypersynergism bridge: failed to fetch loader', res.status, res.statusText, url);
                return;
            }
            const code = await res.text();
            const fn = new Function(code + '\n//# sourceURL=' + url);
            fn();
        })();
    } catch (e) {
        console.error('Hypersynergism bridge loader error', e);
    }
})();