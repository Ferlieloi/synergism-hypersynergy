# Singularity search fields (`HSSingularitySearch`, `hs-modules/hs-singularity-search/`)

Search fields on three subtabs of the Singularity tab: Perks / Penalties, Golden Quarks and Octeracts. The perk tree and
the two upgrade grids are unlabelled icons: without them, finding what affects something means hovering them one by one.
One setting for the three, `singularitySearch` (Settings → QoL, "Search fields (Perks, GQ, Oct)"), on by default: one
feature on three grids, whose empty field changes little; not one setting per subtab. Off gives the game's exact look
(elements removed, CSS removed, classes cleared). It was `perksFind` when it covered the perks alone: the stored value is
read under the new key (`RENAMED_SETTINGS`, `hs-settings-state.ts`).

Files: `hs-singularity-search.ts` (the module), `-perks.ts`, `-grid.ts` (Golden Quarks and Octeracts, one class with
their ids), `-field.ts` (the field, its clickable words, the results list and the tooltip read they share), `-match.ts` (matching).

## The field (every subtab)

- **A field, always visible**: not a button that opens one, a click for nothing.
- **Clearing the field (Clear button, by hand) or Escape** ends the search. The text stays when leaving the subtab, and
  the search is read again on return.
- **The number of results and the Clear button are inside the field, at its right end**, like the browser's find bar;
  typed text stops before them. The field keeps its size and stays centred, nothing moves as they appear. The Clear
  button is the game's button, nearly the field's height, shown while the field has text: not a cross, too small a
  target; not beside the field, where its kept room put the field off-centre; not a field that shrinks to make room for
  it, which moves its end and the count while typing.

## Perks / Penalties

- **Results over the penalties text, from its grid cell down to the window's bottom**: not a separate window, which would
  cover the tree. The penalties stay in place with `visibility: hidden`, so nothing moves. The other perks and the tree's
  lines are dimmed.
- **Compact cards, one column**: not two columns, whose room depends on the window; not a smaller font alone, which gains
  least. Smaller icon and text, level in small grey on the title row, next level dropped: the game's own tooltip, on the
  lit perk in the tree, still has it.
- Results are a snapshot, on every subtab: their values update at the next key or return, not live.

## Golden Quarks and Octeracts

- **The upgrades that don't match are dimmed, and the matching ones' tooltips are listed as cards** left of the grid, in
  grid order, one column scrolled inside, down to the window's bottom. On Octeracts the map's lines are dimmed too
  (spine, nodes, tracks).
- **Octeracts: the field, its words and the cards in the stats column left of the box**, as on Perks: the field's row at
  the column's top, the cards over the rest of it, the stats hidden with `visibility: hidden` while there are cards. The
  game centres the column and the box against each other: while the setting is on both are aligned to the top, so the
  field stays level with the box's top and the row doesn't push the box down.
- **Golden Quarks: the field's row in the box, right under the upgrade AP line; the cards in the room left of the box**,
  its top level with the box's, out of the box: the game's hover styles on the box would change the grid's icons while
  the mouse is on the cards. Turning the setting on moves the grid down once by the row's height; nothing moves while
  searching.
- **No room, no cards**: the dimming alone shows the results. Golden Quarks: under 280 px left of the box (cards 280 to
  440 px wide). Octeracts: the game's narrow layout, where the column is above the grid.
- **A card: name and level on one row, description, effect**, the perks' cards' look. The cost, the quarks or octeracts
  spent and the AP lines are dropped: the game's tooltip, on the lit upgrade, still has them. The tooltip's lines carry
  no class: they are the parts between its line breaks, the description the light blue one, the effect the next gold
  one; another shape (a game update) gives the whole tooltip.
- **Maxed upgrades the game's "Maxed Upgrades" button hides are counted apart**: "2 results (+10 hidden)". They stay
  hidden and get no card. The count and the cards follow a click on that button. A grey line under the last card, or
  under "No upgrade found", gives their number and names the button.
- The game rebuilds the octeract box the first time its subtab opens: the row is put back at each opening.
- The game never hides a locked upgrade on these grids (an upgrade above the highest singularity shows its minimum in
  red): no spoiler check.

## Clickable words

Under each field; a click fills the field and searches.

- **Perks: one row**, `quark`, `cube`, `oct`, `ant`, `luck`, `salvage`, `token`, `auto`, `challenge`, `purple`, in the
  room above the penalties text. They fill the 445 px column (443 px, English): an 11th word needs a second row, which
  needs the penalties moved.
- **Golden Quarks**: `quark`, `cube`, `amb`, `oct`, `ascension`, `corrupt`, `off`, `obt`, `platonic`, `cookie`,
  `talisman` (73 of the 81 upgrades in English). **Octeracts**: `quark`, `amb`, `free`, `oct`,
  `ascension`, `cap`, `speed`, `token`, `potion`, `off`, `obt`, `golden` (44 of 47; `golden` picks the Golden Quark ones out of `quark`), one row of the stats column. The words that
  find the most upgrades; the players' short forms where they have one (amb, oct, off, obt), also shorter buttons. Not
  `luck`, which only finds the Ambrosia Luck upgrades `amb` finds. The rows wrap in a narrower window.
- **The field's suggestions are words that find something there**: "cube" finds no octeract upgrade.
- **A word that finds nothing isn't shown**, checked each time the subtab opens: nothing unlocked yet on that subject, or
  another wording in the game's language. The words are English in every language: not a list per language, not English
  only. Where they keep matching by chance, a French "ant" finds "Antiquités".

## Reading the tooltips

- The game gives no access to `singularityPerks` or its upgrade data. For each element, a `mousemove` and the event its
  listener closes the tooltip on (perks: `mouseleave`; upgrades: `mouseout`, through `registerPurchasableModal`), and
  `#modalContent` is copied between the two, in the same task: nothing is painted. The content is emptied first, so a
  read never returns an older tooltip (`readHoverTooltip`). No patch needed, so bookmarklet players have it too. The
  text is the game's: translated, with current values.
- Read `textContent`: the modal is `visibility: hidden` at that point, `innerText` would be empty.
- **Perks** are read at each search; **upgrades** once per subtab opening (80 Golden Quark ones: about 25 ms, 47
  octeract ones about 15 ms, at 1830 px on an S290 save), as their names and descriptions don't change in between.
- **Upgrade text** (matching): the tooltip's lines carry no class. The name is its first `span`; the description is taken from the
  button's `aria-label`, the same translated text.
- **Touch devices**: the game opens these tooltips with a click there, and the hover gets nothing. One element is read
  when each field is added; if that fails, no field on that subtab, and a line in the log.
- **Spoilers**: a perk with `style.display === 'none'` is skipped. The game sets that when the subtab opens (the field
  only exists there) and it is the default of every perk. The 3 previews it does show give their name and unlock
  singularity, found by name only.
- A read closes a game tooltip that was open: the mouse resting on an element while typing. It comes back at the next
  mouse move.

## Matching (`hs-singularity-search-match.ts`, `test-singularity-search-match.cjs`)

- **Name and description only**: the level, cost and AP lines would make "level", "singularity" or "quarks" match
  everything.
- **At the start of a word**, ignoring case and accents: "ant" finds 8 perks, as a plain substring 14 (grants, Instant,
  Accountants). Several words must all match, in any order.
- **Chinese and Japanese have no word gaps**: a term with such characters matches anywhere, and a Latin term right after
  them counts as a word start.

## Layout (Perks)

The element is absolutely placed with `grid-column: 1 / 2` and `grid-row: 1 / 2` in `#singularityInfo`, the only way to
fill one cell without sizing it. Both ends are needed: `grid-column: 1` alone stretches it to the container's right edge,
over the tree. It lets the mouse through (`pointer-events: none`) except on the field and on non-empty results.

The results box goes past the cell with a `min-height` from `100vh` and its own top, set at each search, so a smaller
window shrinks it without a scrollbar. Not at the game's stacked layout (width <= 1024 px), where the tree is under it.
That layout has no room above the penalties text, so the penalties get a top margin for the field and the words.
