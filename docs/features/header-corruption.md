# Corruption level module (HSCorruptionHeader)

The header docs: `header-modules.md` (mod modules), `header-loadouts.md` (ambrosia loadout modules), `header-edit-mode.md` (the "[HS] Header" block and edit mode), `header-corruption.md` (corruption level module), `header-challenge-progress.md`.

Decorates the game's `corruptionLevelHeader` ("used/max", game 4.4.0); not a mod module. Code
`hs-core/header/hs-corruption-header.ts`, CSS `hs-corruption-header.css`. Section "Corruption module" of the block.
- **Next level** (hidden setting `corruptionHeaderControls`, on by default, one setting for both
  parts): ` → 30` in silver after `#corruptionLevelHeaderText` (never inside: the game rewrites that span) while the
  next ascension's level differs from the one shown. In an ascension challenge the game shows 0, so `0/132 → 25`.
  Read every 250 ms while the module is seen (as the challenge progress module), from `exposedPlayer`, else the
  game's text and input (bookmarklet). Not turned off by autosing (cheap, as the challenge progress module).
- **Popover on a click on the module** (chosen over wheel or inline −/+), centred under it,
  pushed back inside the page at its edges: the game's cleanse (its `#corruptionExitIcon` image as it is, 30 px as
  the buttons, no frame of the mod's: the icon has its own; left of the 0), the tab's row (0, -10,
  -1, input, +1, +10, Max, the game's button classes, at their text's width + 5 px a side instead of the game's
  fixed widths) and its two toggles side by side (checkboxes at their normal size, not the tab's 1.4), all through the game's own controls (`HSCorruptionLevel`,
  `hs-core/hs-corruption-level.ts`, shared with autosing's `HSAutosingCorruption`): the game clamps and updates its
  tab. The cleanse and the row are hidden while the max is 0, the toggles stay (they work before C11).
  - **Cleanse in two clicks**, as the game's Cleanse then Confirm (a cleanse lowers the current ascension's level at
    once; one click was considered and kept at two, the button being next to the 0): the first shows "OK?" over the
    icon for 10 s (the game's "Confirm" as tooltip; over it, not beside it: the popover shouldn't grow
    and re-centring), closing the popover cancels it; the second clicks the game's `#corruptionCleanseConfirm`
    (works while hidden).
  - **Toggles with short names**: "Auto-climb" (`autoIncrease`) and "Cleanse to highest"
    (`cleanseToHighest`), English for everyone; the game's translated sentence is their tooltip. Closes
  on Escape, a press outside, a second click on the module, edit mode, the module hidden. In edit mode the game's
  capture listener stops the click. An emptied input changes nothing (the game would set 0). The game's texts
  (title = the input's aria-label, Max, toggle) copied at each opening, so they follow a language switch.
- **Autosing**: a phase's level overwrites the player's change (accepted).
- **Keep visible** (hidden setting `corruptionHeaderAlwaysShown`, on by default, the name of the removed corruption
  loadouts setting reused, same meaning): the game unlocks the module on C11 only, so it hid at the start of each
  singularity. The unlock check becomes `game check || highestSingularityCount > 0` (as the game's Corruption tab).
  **No Platonic Tau condition**: since 4.4.0 Tau sets nothing before C11
  (`maxCorruptionLevel()` is 0 then, `next` not kept over a singularity), so before C11 the module shows `0/0` and
  its popover only the toggle, Tau or not. Header modules patch only (the line is hidden without it).
- Checked headless on the real game (S291 save, levels raised live): buttons, typed level (in range, too high →
  max, emptied), toggle synced with the tab's, every way to close, edit mode, in C12, C11 = 0 with Keep visible
  on/off after a render, the setting off and on from the block.
