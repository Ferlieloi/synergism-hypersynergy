# Best Purple buys (Purple upgrade advisor)

A panel on the Singularity tab's Purple subtab that ranks the next Purple upgrade levels to buy. After fancia's
Purple Heater spreadsheet; credit fancia (lowercase) in changelogs and texts.

## What it ranks

- **Value: `ln(Purple Honey income after / before) / Purple Honey cost`**, the sheet's "CEF": Purple Honey growth per
  Purple Honey spent. Best first, and only levels that raise Purple Honey income. One ranking, by Purple Honey; the
  Ambrosia and Red Ambrosia income changes are shown beside it (not the sheet's three separate rankings: one is
  easier to read).
- **Purple Ambrosia (zodiac) upgrades are priced in Purple Honey**, at the synthesis cost of their Purple Ambrosia
  (`calculatePurpleAmbrosiaCraftCosts`: discounts included). The Red Ambrosia that synthesis also takes is shown in
  the cost cell, not counted.
- **Ranked:** Reactant Storage Expansion I–IV, Catalyzer I–IV, Purple Honey Luck I–IV, Efficiency I–IV, Purple Bar
  Size Reduction I–IV, The Purple Guy's Greeting, Honey Power: Ambrosia / Red Ambrosia, Aries, Gemini, Cancer,
  Scorpio. Each is one level more applied to the income model's input (`rankPurpleUpgrades`,
  `hs-core/gds/hs-purple-upgrade-advisor.ts`; effects from the game's `Purple.ts` and `PurpleAmbrosiaUpgrades.ts`).
- **Not Libra**: its overcap trades Ambrosia income for Purple Honey (all of it at 100% routing), a choice rather
  than a gain.
- **Not ranked:** Sagittarius and Capricorn (they change the Horse Shoe rune's level and talisman, which feed blue,
  red and purple luck: not modelled yet), and the upgrades that don't act on the bars (Obtainium, Offerings, Honey
  Power: Quarks / speeds / ELO, Lab-Grown Quarks, Paperweight, Taurus, Leo, Virgo, Aquarius, Pisces).

## Model

- The income is `calculateAmbrosiaBarIncome` (`docs/features/gds.md`, "Sustained Ambrosia income"), for the active
  loadout and routing. The sheet's closed form is that model's special case with Two Mind on, overcap off, 100%
  routing and enough red: `scripts/tests/test-purple-advisor.cjs` checks the ranking's effect ratios and costs
  against the sheet's own example cells.
- No Purple Honey income (Exalt 10, or the routing sends nothing to the reactor): a message instead of the rows.

## Panel

- Inserted after `#purpleHoneyDisplay`, above the reactor. Five rows always reserved, so a message or a shorter list
  doesn't change its height.
- Refreshed while the subtab is on screen only: from GDS's data every 2 s at most; without GDS, by forcing a save
  every 5 s (10 s while autosing runs). A ranking takes about 2 ms (overcap off) to 35 ms (overcap on, partial
  routing), cold.
- Names come from the game's translations (`HSUtils.getGameTranslation`), English until they are read.

## Dev builds only, for now

- **Turned on by a checkbox in the Debug tab** ("Features in development"), off by default, stored with the dev
  tools' own data (`HSDevTools`, key `dev-tools`). The Debug tab doesn't exist in release builds, so players never see
  the panel, and no feature catalogue entry until then.
- **Not a setting while in development**: every settings save writes every setting's state, defaults included
  (`serializeSettingStates`), and a stored state overrides the definition's default (`restoreSettingState`). A
  default-OFF setting would be stored OFF by everyone running that build, and a later default ON would never reach
  them.
- **At its release**: add the setting `purpleUpgradeAdvisor` (on by default, Ambrosia group, action calling
  `HSPurpleAdvisor.show()` / `hide()`), a key no one has stored, so every player gets it on; remove the Debug tab
  checkbox and its `purpleAdvisor` field (the dev tools' stored data drops unknown fields at its next save); add the
  catalogue entry, crediting fancia.
