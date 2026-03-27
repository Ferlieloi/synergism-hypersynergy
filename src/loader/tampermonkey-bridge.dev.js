// ==UserScript==
// @name         Hypersynergism Bridge (Local Dev)
// @namespace    https://github.com/Ferlieloi
// @version      1.1-dev
// @description  Local development bridge - loads from dev server (never cached)
// @author       Developer
// @match        https://synergism.cc/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

// Local Development Bridge.
// Fetches hypersynergism.dev.js fresh on every page load via synchronous XHR
// with a cache-busting timestamp — Tampermonkey's @require cache is bypassed entirely.
(() => {
    const url = `http://127.0.0.1:8080/src/loader/hypersynergism.dev.js?t=${Date.now()}`;
    try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, false); // synchronous — same timing as @require
        xhr.send();
        if (xhr.status === 200) {
            const s = document.createElement('script');
            s.textContent = xhr.responseText;
            document.documentElement.appendChild(s);
            console.log(`%c[HS-BRIDGE] Loaded dev loader fresh from ${url}`, 'color:#4af');
        } else {
            console.error(`[HS-BRIDGE] Dev server returned ${xhr.status} — is it running?`);
        }
    } catch (e) {
        console.error('[HS-BRIDGE] Failed to reach dev server:', e);
    }
})();
