// ==UserScript==
// @name         HyperSynergism Bridge Loader
// @namespace    https://github.com/Ferlieloi
// @version      1.0
// @description  Evergreen bridge to official Hypersynergism mod
// @author       Ferlieloi
// @match        https://synergism.cc/*
// @require      https://cdn.jsdelivr.net/gh/Ferlieloi/synergism-hypersynergy@latest/src/loader/hypersynergism.user.js
// @grant        none
// @run-at       document-start
// @updateURL    https://cdn.jsdelivr.net/gh/Ferlieloi/synergism-hypersynergy@latest/src/loader/tampermonkey-bridge.user.js
// @downloadURL  https://cdn.jsdelivr.net/gh/Ferlieloi/synergism-hypersynergy@latest/src/loader/tampermonkey-bridge.user.js
// ==/UserScript==

// Production Evergreen Bridge.
// Install once - auto-updates.
// Loads the full "true" loader (hypersynergism.user.js), which handles game patching and mod loading.