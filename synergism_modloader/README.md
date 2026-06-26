# Hypersynergism Loader

A small Electron app that finds your Steam copy of Synergism, patches an
extracted copy of it to load the Hypersynergism mod, and launches the
patched copy. Your original Steam install is never modified — everything
happens in a `__hs_work` folder next to it, which Steam ignores and which
"Verify integrity of game files" will not touch (and which you can delete
any time to fully reset).

## Requirements (on the machine that *runs* the loader)

- Windows (this targets the Windows Steam build of the game).
- Synergism installed via Steam.
- **The full 7-Zip install** (not just a bundled `7za` binary) — only the
  full version can unpack the NSIS installer wrapper the game's exe uses.
  Free download: https://www.7-zip.org/

## Project layout

```
main.js              Electron main process: window + all IPC handlers
preload.js            contextBridge API exposed to the UI (window.loader)
renderer/             UI: index.html, style.css, renderer.js
lib/
  config.js          Defaults + persisted user config (steam path, mod ref, etc.)
  steamLocator.js     Steam path detection, library-folder parsing, 7-Zip detection
  patchGame.js        The extract → patch → repack pipeline
  patcher.js          Local fallback copy of the out.js bundle patcher
  injectorTemplate.js Builds the preload.js injector snippet for a given mod URL
```

## Developing

```
npm install
npm start
```

`npm install` pulls in `electron` and `electron-builder` as dev
dependencies — this needs network access to npmjs.org and (for `electron`
itself) Electron's binary CDN.

## Building a distributable .exe

```
npm run dist
```

This uses `electron-builder` with the `portable` Windows target, producing
a single `HypersynergismLoader.exe` under `dist/` that you can hand to
other players — no install step, no Node/Electron required on their end.

## How the patch pipeline works

1. Extracts the game's NSIS-packaged exe with 7-Zip into a work folder.
2. Extracts the embedded `app-64.7z`, which contains the real Electron app.
3. Unpacks `app.asar` with `@electron/asar`.
4. Runs `lib/patcher.js` (or a fresher version fetched from GitHub, if
   reachable) against `out.js` to expose a few internal game functions and
   hooks the mod needs (player state, stage info, max-challenges, an
   after-tick hook, auto-confirm support, corruption application).
5. Appends an injector snippet to `electron/preload.js` that fetches and
   runs the mod script you picked, at whatever branch or tag you selected.
6. Repacks `app.asar` and locates the launchable exe inside the extracted
   folder.

The loader remembers the original exe's size/mtime at patch time, so it
can tell you when Synergism has been updated by Steam and a re-patch is a
good idea (the bundle patcher's anchor strings can drift between game
versions).

## Known limitations / things to be aware of

- **Anchor-based patching is inherently fragile.** `lib/patcher.js`
  recognizes specific strings in the minified `out.js` bundle. A Synergism
  update can shift or rename those, in which case a given patch step logs
  a warning and is skipped rather than crashing the whole run — but that
  also means a feature can silently stop working until the patcher is
  updated. Watch the console output after patching.
- **7-Zip's NSIS support is the one piece this can't route around without
  asking the player to install something.** Bundling a lightweight 7-Zip
  binary (e.g. via npm) doesn't help, because those builds drop the NSIS
  module the first extraction step depends on.
- **The launchable-exe heuristic is a best guess** (first non-uninstaller
  `.exe` at the root of the extracted app folder). If a future build of
  the game ships multiple top-level exes, you may need to point the
  "Launch" step at the right one by hand — happy to add a manual override
  if that ever happens.
- I wrote and syntax-checked all of this, and smoke-tested the
  pure-logic pieces (URL building, exe picking, the bundle patcher against
  dummy code), but couldn't run the full pipeline end-to-end here since
  that requires Windows, Steam, and 7-Zip. Treat the first real run as a
  test pass and let me know what breaks.
