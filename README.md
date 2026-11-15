# Hypersynergism

[Website](https://ferlieloi.github.io/synergism-hypersynergy/) · [Wiki](https://ferlieloi.github.io/synergism-hypersynergy/docs/wiki/index.html)

A QoL mod for the [Synergism](https://synergism.cc/) game ([game's GitHub](https://github.com/Pseudo-Corp/SynergismOfficial)).

![image](docs/res/logo.gif)

## About the mod

Hypersynergism adds quality-of-life tools, game information, interface options, and configurable automation to Synergism. Most features are optional and configurable; some provide information or shortcuts, while AutoSing can automate progression using player-configured strategies.

### Features

Here are some of Hypersynergism’s standout features:

- **AutoSing:** (S216+) Run singularities with strategies you can edit in the strategy editor ([guide](docs/data/guides/autosing.md); this can be considered as "not strictly QoL". You do you.)
- **Ambrosia Heater:** Find the best Ambrosia loadouts for your save with the built-in optimizer ([guide](docs/data/guides/heater.md)).
- **Ambrosia tools:** Quick-switch loadouts, switch them automatically when using ADD or TIME codes, and track Ambrosia progress and income with minibars.
- **Header:** Place an Automation quickbar, use any game image as a loadout slot icon, align modules in their cells, resize the minibars, remove the gap under the header, and more, all from the game's header editor.
- **Hepteract helpers:** View in-game hepteract ratios, quickly expand and fill hepteracts, and split your hepteracts between them with the Hepteract Distributor, using ratios you set.
- **Golden Quark tools:** Split your Golden Quarks between upgrades with the GQ Distributor, using ratios you set.
- **Game information:** Compute game values from your save in the Tools tab (luck, cube multipliers, Ambrosia speed, ascension score…, with their components), and see the time until a platonic upgrade's next level in its tooltip.
- **Fewer pop-ups:** Tick "Don't show again" on the game dialogs you no longer need to read, and skip the game's offline popup at load.
- **Interface options:** Each tab reopens on the subtab you last used, unused game tabs can be hidden, and notifications can be made more transparent.
- **Saves:** Export the save every X minutes, and back up the save, the mod's settings and the logs in one file, to load later or on another device.

## Using the mod

### Install

Full steps, the Live and Dev channels, and what to do when it doesn't load: the [installation guide](docs/data/guides/getting-started.md).

#### 🌐 In a browser: Tampermonkey (recommended)

1. **Install [Tampermonkey](https://www.tampermonkey.net/)** for your browser. Chrome-based browsers (Chrome, Edge, Brave, Opera…) need one more setting: see the [installation guide](docs/data/guides/getting-started.md).
2. **[Click here to install the Hypersynergism loader](https://cdn.jsdelivr.net/gh/Ferlieloi/synergism-hypersynergy@master/src/loader/tampermonkey-bridge.user.js)**, then click **Install** on Tampermonkey's page.
3. **Open or reload [Synergism](https://synergism.cc/).** The mod loads with the game, always in its latest version.

#### 🎮 On Steam (Windows only)

Download the **Hypersynergism Loader** from the [releases page](https://github.com/Ferlieloi/synergism-hypersynergy/releases) and run it: it patches a copy of the game and starts it with the mod. Steps: the [installation guide](docs/data/guides/getting-started.md).

#### 🔖 With a bookmark (not recommended)

Loaded that way, several features are missing or unreliable, Auto-Sing among them. Steps: the [installation guide](docs/data/guides/getting-started.md).

### Feature guides

Every feature, where to find it and its limits: the [website](https://ferlieloi.github.io/synergism-hypersynergy/docs/features.html), also as one Markdown file, the [feature inventory](docs/FEATURES.md). How to update and publish them: [publishing instructions](docs/dev/publishing-guide.md).

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

`npm run dev` rebuilds at each change without the server, and `npm run build` builds once. The build doesn't check types: use your editor or `npx tsc --noEmit`. `npm test` runs the tests.

The Steam loader is a separate package, described in the [loader's README](synergism_modloader/README.md).

### Where to start

[AGENTS.md](AGENTS.md) is written for coding agents (Claude Code, Codex…), and is also the shortest map of the project for people: the rules most changes need, and pointers to [docs/](docs/README.md), which holds how the game behaves where the mod depends on it, one file per feature with its rules and the decisions behind them, and the procedures (releasing, updating after a game update).

### If the mod breaks and nobody maintains it anymore

Fork the repository and keep its name, `synergism-hypersynergy`: every loader URL uses it. After a game update, [docs/game/updating.md](docs/game/updating.md) is an ordered checklist, which a coding agent pointed at `AGENTS.md` can follow. Players' loaders still download the mod from the original repositories, so a fixed fork reaches no one until they switch: what to change in each loader is in [docs/features/loaders.md](docs/features/loaders.md#taking-over-in-a-fork).

## Credits

Hypersynergism was created by [ahvonenj](https://github.com/ahvonenj/synergism-hypersynergy), who no longer works on it. This repository was forked from theirs and is where the mod is now maintained.
