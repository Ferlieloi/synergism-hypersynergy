// ==UserScript==
// @name         HyperSynergism Loader
// @namespace    https://github.com/Ferlieloi
// @version      4.1
// @description  Official loader for HyperSynergism mod
// @match        https://synergism.cc/*
// @grant        none
// @run-at       document-start
// @license      MIT
// ==/UserScript==

(() => {
    'use strict';
    if (window.HS_LOADER_INITIALIZED) return;

    // This request must finish at document-start before the game's script runs.
    const url = `https://cdn.jsdelivr.net/gh/${window.__HS_REPO || 'Ferlieloi'}/synergism-hypersynergy@${window.__HS_VERSION || 'master'}/synergism_modloader/lib/patcher.js?t=${Date.now()}`;
    try {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', url, false);
        xhr.send();
        if (xhr.status !== 200) throw new Error('Shared loader returned HTTP ' + xhr.status);

        const moduleShim = { exports: {} };
        const load = new Function('module', 'exports', xhr.responseText + '\nreturn module.exports;\n//# sourceURL=' + url);
        const shared = load(moduleShim, moduleShim.exports);
        shared.startBrowserLoader({ dev: false });
    } catch (error) {
        console.error('[HS-LOADER] Could not start shared loader from', url, error);
    }
})();
