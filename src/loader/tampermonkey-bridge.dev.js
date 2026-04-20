// ==UserScript==
// @name         HyperSynergism Bridge Loader (Local Dev)
// @namespace    https://github.com/Ferlieloi
// @version      1.2
// @description  Local development bridge
// @author       Developer
// @match        https://synergism.cc/*
// @grant        none
// @run-at       document-start
// @updateURL    https://cdn.jsdelivr.net/gh/Ferlieloi/synergism-hypersynergy@master/src/loader/tampermonkey-bridge.user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/Ferlieloi/synergism-hypersynergy@master/src/loader/tampermonkey-bridge.user.js
// ==/UserScript==

(function () {
    'use strict';
    const repo = 'maenhiir'; // Stable: 'Ferlieloi', Dev: 'maenhiir'
    const version = 'master'; // 'master', specific tag (e.g. 'v2.11.0-dev13'), specific commit (e.g. '0611b83')
    const baseUrl = `http://127.0.0.1:8080/src/loader/hypersynergism.dev.js`;
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
            console.error(`%c[HS-BRIDGE] Dev server returned ${xhr.status} — ${xhr.statusText} — ${url} — is it running?`, 'color:#b02');
        }
    } catch (e) {
        console.error(`%c[HS-BRIDGE] Loader error: ${e}`, 'color:#b02');
    }
})();
