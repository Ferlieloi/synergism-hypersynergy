// ==UserScript==
// @name         HyperSynergism Bridge Loader (Local Dev)
// @namespace    https://github.com/Ferlieloi
// @version      1.4
// @description  Loads the local game loader synchronously at document-start
// @author       Developer
// @match        https://synergism.cc/*
// @match        https://pseudo-corp.github.io/SynergismOfficial/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

// Generated from src/loader/shared by npm run build:loaders.
(() => {
  'use strict';

  // The code comes from the local dev server. repo only sets which repository the version check reads:
  //   'Ferlieloi' = Live
  //   'maenhiir'  = Dev (default)
  const repo = 'maenhiir';

  // Not used by the dev server; shown in backups.
  const version = 'master';

  // ---- Nothing to edit below this line ----

  // src/loader/shared/loader-urls.mjs
  var DEV_SERVER_ORIGIN = "http://127.0.0.1:8080";
  function repositoryRoot(repo2, version2) {
    return `https://cdn.jsdelivr.net/gh/${repo2}/synergism-hypersynergy@${version2}`;
  }

  // src/loader/shared/userscript-entry.mjs
  function requestScript(url) {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, false);
    xhr.send();
    return xhr;
  }
  function scriptWithSourceUrl(xhr, url) {
    return xhr.responseText + "\n//# sourceURL=" + url + "\n";
  }
  function runBridge(dev, repo2, version2) {
    const baseUrl = dev ? `${DEV_SERVER_ORIGIN}/src/loader/hypersynergism.dev.js` : `${repositoryRoot(repo2, version2)}/src/loader/hypersynergism.user.js`;
    const url = `${baseUrl}?t=${Date.now()}`;
    window.__HS_REPO = repo2;
    window.__HS_VERSION = version2;
    try {
      const xhr = requestScript(url);
      if (xhr.status === 200) {
        new Function(scriptWithSourceUrl(xhr, url))();
        console.log(`%c[HS-BRIDGE] HS loader loaded fresh from ${url}`, "color:#4af");
      } else {
        const message = dev ? "Dev server returned" : "Failed to fetch loader:";
        const hint = dev ? " — is it running?" : "";
        console.error(`%c[HS-BRIDGE] ${message} ${xhr.status} — ${xhr.statusText} — ${url}${hint}`, "color:#b02");
      }
    } catch (error) {
      console.error(`%c[HS-BRIDGE] Loader error: ${error}`, "color:#b02");
    }
  }

  // src/loader/shared/bridge-entry.js
  runBridge(true, repo, version);
})();
