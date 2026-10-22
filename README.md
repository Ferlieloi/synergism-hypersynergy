# Hypersynergism

A QoL mod for the [Synergism](https://synergism.cc/) game ([game's GitHub](https://github.com/Pseudo-Corp/SynergismOfficial)).

![image](https://github.com/Ferlieloi/synergism-hypersynergy/blob/master/doc/img/logo.gif?raw=true)

## About the mod

Hypersynergism adds quality-of-life tools, game information, interface options, and configurable automation to Synergism. Most features are optional and configurable; some provide information or shortcuts, while AutoSing can automate progression using player-configured strategies.

### Features

Here are some of Hypersynergism’s standout features:

- **AutoSing:** (S216+) Run configurable strategies to farm singularities (this can be considered as "not strictly QoL". You do you.)
- **Ambrosia Heater:** Use the built-in optimizer to compute loadouts.
- **Ambrosia tools:** Manage and quick-switch loadouts, automatically switch loadouts when using ADD or TIME codes, and track Ambrosia progress and income with minibars.
- **Quickbars:** View and interact with Ambrosia, Corruption and Automation controls from the game header.
- **Header cell controls:** In header edit mode, select a module and choose Left, Center, or Right alignment for its cell. Use Full or Half height for a single module in the grid; Half matches the compact modules in a two-module stack and can sit at the Top or Bottom of its cell. Choices are remembered separately for desktop and mobile.
- **Resizable minibars:** In header edit mode, drag the minibars’ right edge, bottom edge, or corner to adjust their width and bar height. The bars are borderless, fit inside half-height cells, and follow the cell's alignment. Sizes stay within the header cell, are saved per desktop/mobile layout, and can be restored with Reset size.
- **Header options:** In the [HS] Header settings, use the corruption loadout icon to cleanse corruptions instead of a separate button, match the octeract icon to the other cube icons in the top row, and add a white Oct/Oct/s unit label.
- **Hepteract helpers:** View in-game hepteract ratios, quickly expand and fill hepteracts, and split your hepteracts between them with the Hepteract Distributor, using ratios you set. (Soon to be: Hept Optimizer)
- **Golden Quark tools:** Split your Golden Quarks between upgrades with the GQ Distributor, using ratios you set.
- **Fewer pop-ups:** Tick "Don't show again" on the game dialogs you no longer need to read, and skip the "Since you were away" box at load.
- **Interface options:** Each tab reopens on the subtab you last used, unused game tabs can be hidden, and notifications can be made more transparent.
- **Backup & Restore:** Save the game save, the mod's settings and the logs in one file, and load it back later or on another device.

## Using the mod

### On Steam (Windows only)

Use the Hypersynergism Loader, a small Windows app that patches a copy of the game and launches it with the mod. Its installer is on the [releases page](https://github.com/Ferlieloi/synergism-hypersynergy/releases), under "Hypersynergism Loader". It needs the full [7-Zip](https://www.7-zip.org/) install. More in the [loader's README](synergism_modloader/README.md).

The mod is downloaded at each launch, always in its latest version. The loader updates itself, and tells you when the game has to be patched again.

### In a browser: Tampermonkey (recommended)

The mod is loaded by a userscript, which starts it together with the game.

1. Install [Tampermonkey](https://www.tampermonkey.net/), a browser extension that runs userscripts: [Chrome](https://chromewebstore.google.com/detail/dhdgffkkebhmkfjojejmpbldmpobfkfo), [Firefox](https://addons.mozilla.org/firefox/addon/tampermonkey/), [Edge](https://microsoftedge.microsoft.com/addons/detail/iikmkjmpaadaobahmlepeloendndfphd), [Opera](https://addons.opera.com/extensions/details/tampermonkey-beta/). Other userscript managers may work too.
2. Chrome, Edge and other Chrome-based browsers only: allow Tampermonkey to run scripts. Right-click its icon, choose "Manage extension" and turn on "Allow User Scripts" (or "Developer mode" if that switch isn't there). See [Tampermonkey's guide](https://www.tampermonkey.net/faq.php?q=Q209).
3. Open the [loader script](https://cdn.jsdelivr.net/gh/Ferlieloi/synergism-hypersynergy@master/src/loader/tampermonkey-bridge.user.js) and click "Install" on the page Tampermonkey shows.
4. Load the game at https://synergism.cc/ (or reload it). The mod loads by itself, always in its latest version.

If step 3 shows code instead of an install page, copy that code, choose "Create a new script" in Tampermonkey, replace everything with the copy and save.

While the game is running, a rainbow border around the mod's icon means a newer version is out: reload the page to get it.

### With a bookmark (NOT RECOMMENDED)

The mod can also be loaded with a bookmark, once the game has started. Loaded that way it can't reach the game's internals, so several features are missing, slower, less reliable or even buggy (Auto-Sing among them). The mod then shows a window explaining how to switch to Tampermonkey.

Create a new bookmark in your browser and name it as you wish. For the URL, copy and paste the code in [release/loader/loader.js](https://github.com/Ferlieloi/synergism-hypersynergy/blob/master/release/loader/loader.js).

**Example:**

![image](https://github.com/Ferlieloi/synergism-hypersynergy/blob/master/doc/img/bookmark_v2.png?raw=true)  

Load the game in your browser (or refresh the page if it's already running), close the "Since you were away" box, then click the bookmark. It always loads the latest version of the mod.

## Help and bug reports

- Discord: the [HyperSynergism thread](https://discord.com/channels/677271830838640680/1456904896099127367) on the game's Discord server. The link only opens once you have [joined the server](https://www.discord.gg/ameCknq).
- GitHub: the [issues page](https://github.com/Ferlieloi/synergism-hypersynergy/issues).

For a bug, attach a backup file when you can (mod panel, Tools tab, "Backup & Restore"): it holds the mod's logs, your save, as well as the game and mod settings.

## Version history

Browse the [version tags](https://github.com/Ferlieloi/synergism-hypersynergy/tags) to see published mod versions.

## For developers

The mod is written in TypeScript and bundled with esbuild. It needs [Node.js](https://nodejs.org/).

1. `npm install`
2. `npm install -g http-server` (once, for the local server)
3. `start-dev-server.bat`: rebuilds the mod at each change and serves it on `http://127.0.0.1:8080`.
4. In Tampermonkey, turn the regular loader script off and install [src/loader/hypersynergism.dev.js](src/loader/hypersynergism.dev.js), which loads the mod from that local server. Reload the game after each change.

`npm run dev` rebuilds at each change without the server, and `npm run build` builds once. The build doesn't check types: use your editor or `npx tsc --noEmit`.

The Steam loader is a separate package, described in the [loader's README](synergism_modloader/README.md).

## Credits

Hypersynergism was created by [ahvonenj](https://github.com/ahvonenj/synergism-hypersynergy), who no longer works on it. This repository was forked from theirs and is where the mod is now maintained.
