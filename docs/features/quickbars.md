# Quickbars (`hs-modules/hs-qol-quickbar/`)

`HSQuickbarManager` registers the mod's quickbars and places them; `HSAutomationQuickbarPlacement` puts the Automation
Quickbar in a module of the game's header (`hsAutomationHeader`), or in the mod's quickbar row without the patcher's
header modules patch. This file holds the Automation Quickbar's button rules (`hs-qolQuickbarAutomation.ts`).

## Automation Quickbar: when a button shows

Each button drives one or more of the game's automation toggles (its targets), configured in `AUTOMATION_QUICKBAR_CONFIG`.

- **A target counts only while the game shows it.** The game hides a locked toggle through its CSS: a class on the
  toggle and a flag on `<html>` (`data-*`, set by its `revealStuff()`), e.g. `.autoOpenCubes` and
  `data-auto-open-cubes`. The quickbar reads the toggle's computed `display`, never its inline style (the game no longer
  hides these inline). `display` isn't inherited, so a toggle in a closed tab still counts. A button without targets is
  hidden. Reading every target before writing any button keeps a refresh to one style recompute.
- **`lockedAncestor`**: the game hides a block around the toggle instead of the toggle itself (ant auto-sacrifice:
  `#autoSacrifice`).
- **`unlockAttribute`**: a game flag on `<html>` decides instead of the targets (Auto Ascend: `data-auto-ascend-unlock`,
  the game's `isAutoAscendUnlocked`, Singularity 1 or cube upgrade 10).
- **A watcher on `<html>`'s `data-*` attributes** refreshes the bar as soon as the game unlocks something. Otherwise it
  refreshes on a click and when a watched toggle changes, never on a timer.
- **Hepteract auto-crafts: Singularity 15 (`minHighestSingularityCount`), not the game's unlock (Singularity 1).** The
  button turns every auto-craft on in one click, and its green state reads as the right one. With few hepteracts at low
  Singularities, choosing what to craft matters; all on becomes useful later. The game's own toggles stay available
  from Singularity 1.
- **Hidden once every target is on** (`hideWhenFullyEnabledMinHighestSingularityCount`): Research from Singularity 11,
  Buildings and Upgrades from Singularity 25. Reason not recorded.
- **On or off comes from the live player** (`isOnForPlayer`, or `player.toggles` for a target with a `toggleid`) when
  the patcher exposed it; otherwise from the toggle's border colour or its text in the player's language.

Harness check after a change to these rules: `scripts/harness/` with a save, lock a game flag by hand
(`document.documentElement.setAttribute('data-auto-open-cubes', 'false')`) and check that only the matching button hides.
