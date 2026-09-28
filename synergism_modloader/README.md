# Hypersynergism Loader

A small Electron app that finds your Steam copy of Synergism, patches an
extracted copy of it to load the Hypersynergism mod, and launches the
patched copy. Your original Steam executable is never modified — the patched
copy lives in `__hs_work_current` next to it, which Steam ignores and which
"Verify integrity of game files" will not touch. Close the patched game before
patching again so the loader can replace that folder safely.

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

## Building the Windows installer

```
npm run dist
```

This uses `electron-builder` with the per-user NSIS Windows target, producing
`HypersynergismLoader-Setup-<version>.exe` under `dist/`. Players run the
installer once; it does not require administrator rights or a separate
Node/Electron installation. The full 7-Zip application remains a separate
requirement for patching the Steam game.

The standard build applies the HS icon to the launcher and installer EXEs.
Release builds verify both embedded icons before publishing.

## Launcher updates

The installed Windows launcher checks GitHub Releases on startup and when the
player clicks **Check for updates**. It downloads a newer installer in the
background, then offers **Restart to update**. Game patching must finish before
the launcher restarts. The loader's version is separate from the mod version.

To publish a launcher update, increase `version` in this directory's
`package.json` and `package-lock.json`, then push a matching tag such as
`loader-v0.2.5`. The `Release Windows loader` workflow builds the installer,
uploads it with `latest.yml` and its block map. The launcher selects the
newest published `loader-v*` release with update metadata, so mod releases
can remain marked Latest.

Players using the earlier 0.1.0 installer need to install an updater-enabled
release once. Future launcher releases can then update through the app.

The mod build dropdown lists the newest builds first. Published GitHub
releases use their publication date; other tags and branches use their latest
commit date. The loader remembers the channel and build after the game starts
successfully and selects that build on the next launch. Merely browsing the
dropdown does not change the remembered build.

If GitHub's build list is unavailable, the loader shows the last successful
list and keeps the last played build selected. The **Launch last played** button
on the first screen starts the existing patched copy with that build without
waiting for GitHub's build list or requiring 7-Zip. The mod script is still
fetched from the selected build's CDN URL when the game starts, so this feature
does not provide fully offline play.

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

The loader builds each replacement in `__hs_work_staging`, waits for the
repacked archive to close, removes extraction inputs, and switches the game
into `__hs_work_current` only after patching succeeds. It retries cleanup of
old numbered folders left by earlier versions. If a file remains locked, it
leaves that folder for a later cleanup attempt without creating another
numbered folder. A failed patch leaves the current playable copy in place.

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
