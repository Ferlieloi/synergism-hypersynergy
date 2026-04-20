// ==UserScript==
// @name         HyperSynergism Bridge Loader
// @namespace    https://github.com/Ferlieloi
// @version      1.2
// @description  Bridge to the official HyperSynergism mod
// @author       Ferlieloi
// @match        https://synergism.cc/*
// @grant        none
// @run-at       document-start
// @updateURL    https://cdn.jsdelivr.net/gh/Ferlieloi/synergism-hypersynergy@master/src/loader/tampermonkey-bridge.user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/Ferlieloi/synergism-hypersynergy@master/src/loader/tampermonkey-bridge.user.js
// ==/UserScript==

(function () {
    'use strict';
    const repo = 'Ferlieloi'; // Stable: 'Ferlieloi', Dev: 'maenhiir'
    const version = 'master'; // 'master', specific tag (e.g. 'v2.11.0-dev13'), specific commit (e.g. '0611b83')
    const baseUrl = `https://cdn.jsdelivr.net/gh/${repo}/synergism-hypersynergy@${version}/src/loader/hypersynergism.user.js`;
    const url = baseUrl + '?t=' + Date.now();
    window.__HS_REPO = repo;
    window.__HS_VERSION = version;
    try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, false);
        xhr.send();
        if (xhr.status === 200) {
            const fn = new Function(xhr.responseText + '\n//# sourceURL=' + url);
            fn();
            console.log(`%c[HS-BRIDGE] HS loader loaded fresh from ${url}`, 'color:#4af');
        } else {
            console.error(`%c[HS-BRIDGE] Failed to fetch loader: ${xhr.status} — ${xhr.statusText} — ${url}`, 'color:#b02');
        }
    } catch (e) {
        console.error(`%c[HS-BRIDGE] Loader error: ${e}`, 'color:#b02');
    }
})();
