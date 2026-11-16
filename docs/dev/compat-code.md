# Compatibility code: migrations and old-version fallbacks

Code kept only for an older game, loader, patch or mod data, with what lets it go. Add an entry with any new migration
or fallback, and remove the entry with the code. Each entry names the commit that added it.

Not listed: paths that also serve bookmarklet players (no patcher globals, no live player), and input tolerance that
isn't tied to a version (Quick Import filling missing loadout keys with 0).

## When an entry can go

- **Player data the mod stores** (settings, strategies, header layouts…): 2 months after the first Live release
  holding the migration, and only once the migration writes the migrated data back at load. A migration that only runs
  in memory is needed as long as any stored copy is old. After removal, an older backup or a shared strategy file loses
  only that part: accepted. First Live release: `git tag --contains <commit> | grep -v -- -dev` (Live tags carry no
  `-dev`); Live is ported by hand, so confirm by content: `git grep -l -F '<string>' <tag> -- src`.
- **Steam on an older game**: once the Steam bundle has the newer shape (`docs/features/loaders.md`, "Checking the
  Steam bundle"). Steam ships whole bundles: one with `runeLevels` (2026-11-12) has every older game change below.
  Browser players always run the current game.
- **Old Steam loaders and patches**: 2 months after the loader release that replaced them (or, for an old patch, the
  first Live release with the patcher change). A player still on one is pointed to the fix: update the loader, pick
  Live or `master`, re-patch. Since 0.2.4 the loader offers its own update at each start; since 0.2.9 it asks for a
  re-patch when the patcher changed.

## Steam on an older game

- **Save shape before the rune rework** (`59fe2359`, 2026-11-13). Remove once the Steam bundle has `runeLevels`:
  - the optional old fields in `GameDataFields` (`runes`, `runeBlessings`, `runeSpirits`, `firstPaidCoin`…,
    `hs-player-savedata.ts`) and the record branch of `getRuneEXP` / `getBlessingEXP` / `getSpiritEXP`
    (`hs-gamedata-utils.ts`);
  - the coin cost curve in `hs-gamedata-api-building.ts` and `scripts/tools/coin-curve-vs-vanilla.cjs`;
  - the old-shape cases in `npm test`.
- **Talisman fragments before game commit `075dfeaa`** (`389038fb`, 2026-10-29): `getTalismanFragments` reading
  `window.__HS_talismans[t].fragmentsInvested` (`hs-gamedata-api-talisman.ts`; the optional field in
  `hs-game-bridge.d.ts`). Remove once the Steam bundle has the save format rework. The talismans patch stays: the
  levels are read from it.
- **Patcher, PseudoCoin levels before the game of 2026-11-06** (`c3d707be`): `initializePCoinCache` awaiting the fetch
  itself (`patch-bundle.mjs`, "PSEUDOCOIN LEVELS PATCH"). The finder matches both shapes with no branch: only the
  comment's old example goes.
- **Patcher, export before `exportStoredSave`** (`c3d707be`): `findExportDataFunction` (`patch-bundle.mjs`) also
  accepts `exportSynergism` awaiting `exportData` directly (its `writesSaveOut(src, step)` test). Remove that test once
  the Steam bundle has `runeLevels` (the game's later rune rework; `exportStoredSave` is minified away).
- **Heater preview, Ambrosia tree in tiers** (`ae5adc0c`, 2026-09-29): `#getLegacyAmbrosiaLoadoutPreviewRows`
  (`hs-heater-ui-result.ts`), for games without `#blueberryUpgradeGroups`.
- **Header loadout icons before the game of 2026-10-21** (`1d1977f6`): only a warning when the page modules are missing
  (`hs-header-loadout-icons.ts`). Nothing to remove but the comment.

## Old Steam loaders and patches

- **Retired patches** (`a9553325`, 2026-10-24): `#RETIRED_PATCHES` (`applyCorruptions`, `corruptionFreeLevels`) in
  `hypersynergism.ts`, left out of the "patch incomplete" warning for games patched before 4.4.0's port.
- **Patcher older than its report**: `window.__HS_PATCH_REPORT` missing on a patched game counts as every patch applied
  (`hypersynergism.ts`, the browser loader's `runPostLoadSequence`). Bookmarklet players have no report either, but
  they are told apart by the missing live player.
- **Patcher called as a function** (`7733195b`, loader 0.2.7): `patcher-entry.cjs` keeps `module.exports` callable for
  loaders up to 0.2.6.
- **Numbered work folders** (`85384a4f`, loader 0.2.6): the desktop loader deletes the `__hs_work_<n>_<n>` folders older
  loaders left (`LEGACY_NAME` in `lib/workspaceManager.js`, `legacy:cleanup` in `main.js`, the status line and retry
  button in `renderer/`, its tests).
- **One re-patch for games patched by old loaders**: no stored patcher hash (loaders up to 0.2.8, `2165b5dd`) and no
  patch format number (up to 0.2.9, `6a47c867`), `renderer.js` `no-hash` and `format`. Small; the general checks stay.

## Player data the mod stores

- **Setting `perksFind` renamed `singularitySearch`** (`9e8cfc3f`, 2026-11-13): `RENAMED_SETTINGS` in
  `hs-settings-state.ts`. Written back at load (the settings are saved after each parse).
- **Settings envelope stored as an object** (`c3d707be`): `parseStoredSettingStates` accepting a non-string, for older
  backups. Backup files only: nothing in storage is that shape.
- **Autosing strategies from before the game's 4.4.0** (`a9553325`, 2026-10-24): 8 corruption values, "Corrup Ants"
  (402) steps, corruption loadouts holding values (`hasLegacyCorruptions`, `#migrateCorruptions`,
  `warnLegacyCorruptions` in `hs-strategy-manager.ts`; the import warning in `hs-autosing-strategy-controls.ts`).
  Written back at load (`parseStoredStrategies`).
- **Autosing strategy formats after 4.4.0** (2026-10-29 to 2026-11-12): named corruption loadouts with a level and their
  "Load Corruption Loadout" (202) steps, a level stored on the phase and its "reapply" (401) steps, "Corrup 0*" (400),
  "minus free levels" (404) (`e633bbf0`, `1ffc52c6`); `ascendAfterCorruption` missing (`777fd06d`); `ifJumpMode`
  missing (`c3d707be`); format 1 without the AOAG phase's level step (`5f2721bc`, `#addAoagLevelStep`); the AOAG phase
  kept in the phase list (`97e6c65f`, `ensureAoagPhase` and `hs-autosing-strategy-modal.ts`). Written back at load only
  since the change that made `parseStoredStrategies` write back any strategy its migrations changed: the 2 months count
  from the first Live release holding that write-back (the string `isSameJsonData` in `hs-strategy-manager.ts`).
- **Strategies stored as one object, not a list**: `storedStrategyList` in `hs-strategy-manager.ts`. Written back as a
  list at load, with the write-back above.

## Other

- **Upgrade fields the save doesn't have, removable now**: `getSavedUpgradeFreeLevel` reading `freeLevels` (a typo of
  the mod's own type, fixed in `9e073aa3`), and `UpgradeData.level` read when an investment isn't a finite number
  (`hs-gamedata-api-goldenQuark.ts`, `hs-gamedata-api-octeract.ts`). The game's load (`PlayerSchema.ts`) turns a legacy
  `level` into the invested amount and keeps only `freeLevel`, and GDS only reads saves the game has loaded.
- **Heater benchmark-only paths**: the `useLegacy*` options of `HeaterCubeExperimentConfig`
  (`hs-heater-optimizer-engine.ts`), reference implementations the fast paths were checked against. The mod never sets
  them; only one-off benchmark scripts do. Not compatibility code: they go when nobody needs that check again.
