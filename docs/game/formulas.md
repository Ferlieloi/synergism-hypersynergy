# Game formulas: traps

GDS (`docs/features/gds.md`) re-implements the game's formulas; the vanilla source is the reference, never a copy of a
formula here. This file holds what made a re-implemented formula disagree with the game.

## Inputs that aren't in the save

- **PseudoCoin levels and the quark bonus come from synergism.cc**, not the save. Without them, ambrosia bar speeds
  come out 4–10× too low, and quarks, Obtainium and Offering loadouts a few levels off; ambrosia, cube and octeract
  loadouts and luck don't depend on them. An HS backup (since 59f71ca3) holds them in `diagnostics.heater`, a heater
  export in `hs_data` (`pseudoCoinUpgrades.pseudoCoinUpgradeLevels`, `me_data`, also `patreonBonus`, `isEvent`,
  `bellStacks`). How the mod reads them live: `docs/features/gds.md`.
- **The Exalt the player is in changes many formulas.** On a player's backup, read `diagnostics.heater.exalt` first.
- **The game recomputes some values at load**: C1–C10 completions are set to their caps, Exalt completions follow
  `highestSingularityCompleted` (One Challenge Cap: 10 + 19 per completion).

## Number traps

- **Numbers vs `Decimal`.** A formula that overflows a JS number gives `Infinity` where the game uses a cap or a
  `Decimal`: the game caps accelerator power and free accelerators at 1e300 (raw C7 completions overflowed the mod's
  version before it had the cap). Keep the game's caps and its number type at each step.
- **The game shows anything below 1e-100 as `0`** (`format`): a `^0` effect on screen at a high corruption level can be
  a tiny number in the formula.
- **Displayed numbers are truncated to 3 digits** (`docs/game/behaviours.md`): compare GDS with the game's figures to
  that precision, or read the game's values from the live player.
- **A shop upgrade's level goes through `getShopLevel`** (`docs/features/gds.md`).

## Formulas the mod doesn't compute

Construction (accelerator, multiplier and boost cost thresholds) and the full cube multiplier chain (the Tools tab shows
the cube bank and the corruption lines only, `docs/features/tools-tab.md`). A calculation that needs one of them has to
add it first.

## Since 4.4.0

The game's 2026-10-24 to 10-27 commits changed viscosity, cube rates per corruption level and cube type, free
accelerators (`min(1e100, free / viscosity)` after the 1e300 cap), Platonic OMEGA (+1 free level) and the level caps
(max = `highestCleared` + 2) several times after the update. The GDS corruption helper
(`hs-gamedata-api-corruption.ts`) matched the game's formulas on 5219 checks at game commit `01b246de`; after a later
change to `Corruptions.ts`, compare again (`docs/game/updating.md`).
