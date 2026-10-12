# Hypersynergism

A QoL mod for the [Synergism](https://synergism.cc/) game.

- Mod homepage: https://Ferlieloi.github.io/synergism-hypersynergy
- Game's Github: https://github.com/Pseudo-Corp/SynergismOfficial

![image](https://github.com/Ferlieloi/synergism-hypersynergy/blob/master/doc/img/logo.gif?raw=true)

# About the mod

## In general

Hypersynergism adds quality-of-life tools, game information, interface options, and configurable automation to Synergism. Most features are optional and configurable; some provide information or shortcuts, while AutoSing can automate progression using player-configured strategies.

## Features

Here are some of Hypersynergism’s standout features:

- **AutoSing:** (S216+) Run configurable strategies to farm singularities (this can be considered as "not strictly QoL". You do you.)
- **Ambrosia Heater:** Use the built-in optimizer to compute loadouts.
- **Ambrosia tools:** Manage and quick-switch loadouts, automatically switch loadouts when using ADD or TIME codes, and track Ambrosia progress and income with minibars.
- **Quickbars:** View and interact with Ambrosia, Corruption and Automation controls from the game header.
- **Hepteract helpers:** View in-game hepteract ratios, quickly expand and fill hepteracts. (Soon to be: Hept Optimizer + Hept Distributor)

# Using the mod

## On Steam

Use the Hypersynergism Loader, a small Windows app that patches a copy of the game and launches it with the mod. Its installer is on the [releases page](https://github.com/Ferlieloi/synergism-hypersynergy/releases), under "Hypersynergism Loader". It needs the full [7-Zip](https://www.7-zip.org/) install. More in the [loader's README](synergism_modloader/README.md).

## In a browser: Tampermonkey (recommended)

The mod is loaded by a userscript, which starts it together with the game.

1. Install [Tampermonkey](https://www.tampermonkey.net/), a browser extension that runs userscripts: [Chrome](https://chromewebstore.google.com/detail/dhdgffkkebhmkfjojejmpbldmpobfkfo), [Firefox](https://addons.mozilla.org/firefox/addon/tampermonkey/), [Edge](https://microsoftedge.microsoft.com/addons/detail/iikmkjmpaadaobahmlepeloendndfphd), [Opera](https://addons.opera.com/extensions/details/tampermonkey-beta/). Other userscript managers may work too.
2. Chrome, Edge and other Chrome-based browsers only: allow Tampermonkey to run scripts. Right-click its icon, choose "Manage extension" and turn on "Allow User Scripts" (or "Developer mode" if that switch isn't there). See [Tampermonkey's guide](https://www.tampermonkey.net/faq.php?q=Q209).
3. Open the [loader script](https://cdn.jsdelivr.net/gh/Ferlieloi/synergism-hypersynergy@master/src/loader/tampermonkey-bridge.user.js) and click "Install" on the page Tampermonkey shows.
4. Load the game at https://synergism.cc/ (or reload it). The mod loads by itself, always in its latest version.

If step 3 shows code instead of an install page, copy that code, choose "Create a new script" in Tampermonkey, replace everything with the copy and save.

## With a bookmark (NOT RECOMMENDED)

The mod can also be loaded with a bookmark, once the game has started. Loaded that way it can't reach the game's internals, so several features are missing, slower, less reliable or even buggy (Auto-Sing among them). The mod then shows a window explaining how to switch to Tampermonkey.

Create a new bookmark in your browser and name it as you wish. For the URL, copy and paste the code in [release/loader/loader.js](https://github.com/Ferlieloi/synergism-hypersynergy/blob/master/release/loader/loader.js).

**Example:**

![image](https://github.com/Ferlieloi/synergism-hypersynergy/blob/master/doc/img/bookmark_v2.png?raw=true)  

Load the game in your browser (or refresh the page if it's already running), close the "Since you were away" box, then click the bookmark. It always loads the latest version of the mod.

# Version history

Browse the [version tags](https://github.com/Ferlieloi/synergism-hypersynergy/tags) to see published mod versions.

# For developers

Developer documentation can be found in the wiki: [Wiki](https://github.com/Ferlieloi/synergism-hypersynergy/wiki)

[**Quick Reference**](https://github.com/Ferlieloi/synergism-hypersynergy/wiki/Mod-Framework-Quick-Reference)

[**Core Module Documentation**](https://github.com/Ferlieloi/synergism-hypersynergy/wiki/Project-structure-and-Modules#core-modules)

[**Using Game Data (non-computed and computed)**](https://github.com/Ferlieloi/synergism-hypersynergy/wiki/Game-Data-and-Calculations)

In addition to the documentation in the wiki, the source code itself should be relatively well commented.

**Keywords:** synergism, mod, modification, modding, modded, extension, tampermonkey, greasemonkey, chrome, firefox, incremental_games, incremental, idle, idle game, idler, incremental game, synergism wiki, synergism help, synergism tool, wiki, corruption, corruptions, help, ascension, singularity, reincarnation, challenge, userscript

**Keywords 2:** Synergism mod, Synergism game mod, Synergism QoL mod, Hypersynergism, Synergism enhancements, Synergism script, Synergism automation, Synergism bookmarklet, Synergism improvements, Synergism JavaScript mod, Synergism user script, Synergism modifications, Synergism GitHub mod, Synergism UI improvements, Synergism game tweaks, Synergism game features, Synergism gameplay enhancements, idle game mods, incremental game mods, Synergism quality of life, Synergism hepteracts, Synergism corruption sheet, Synergism potion buttons, Synergism promotion codes, Synergism mod panel, Synergism reference sheet, Synergism ratios, Synergism notification opacity, Synergism log viewer, Synergism enhancement mod
