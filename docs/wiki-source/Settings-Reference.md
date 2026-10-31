# Settings reference

Every setting in the audited source is listed below. Hidden means it is not a normal panel control: many hidden settings are edited in the header editor, a tool window or an inline game control. Some are internal state or diagnostics.

These are source-defined initial values, not a promise that an existing player's stored or migrated preferences match them. An enabled numeric/select setting does not necessarily mean its dependent feature is switched on.

## expandCostProtection

Hept. quick expand cost protection

- Source default: `0.5`; enabled flag: `true`.
- Location: Panel control / hepteract.
- Guide: [Configurable quick-expand cost protection](Features-hepteracts#configurable-quick-expand-cost-protection).

## enableHepteractDistributor

Enable Hepteract Distributor

- Source default: `true`; enabled flag: `true`.
- Location: Panel control / hepteract.
- Guide: [Hepteract Distributor with saved ratios](Features-hepteracts#hepteract-distributor-with-saved-ratios).

## hepteractDistributorOpen

Hepteract Distributor panel open

- Source default: `false`; enabled flag: `false`.
- Location: Hidden / inline or internal.
- Guide: [Hepteract Distributor with saved ratios](Features-hepteracts#hepteract-distributor-with-saved-ratios).

## keepHeaderLayoutOnImport

Keep my header layout when a save is loaded (checkbox under Load from file)

- Source default: `false`; enabled flag: `false`.
- Location: Hidden / inline or internal.
- Guide: [Keep your header when loading another save](Features-header#keep-your-header-when-loading-another-save).

## headerAmbrosiaSlotsShown

Ambrosia loadout slots shown in the header (block next to the header's edit tray, 16 = all)

- Source default: `16`; enabled flag: `true`.
- Location: Hidden / inline or internal.
- Guide: [Choose how many loadout slots to show](Features-header#choose-how-many-loadout-slots-to-show).

## hepteractDistributorAllowPartial

Hepteract Distributor: allow partly filled meters

- Source default: `false`; enabled flag: `false`.
- Location: Hidden / inline or internal.
- Guide: [Optional partly filled meters](Features-hepteracts#optional-partly-filled-meters).

## hepteractDistributorUseReducers

Hepteract Distributor: use singularity reducers

- Source default: `false`; enabled flag: `false`.
- Location: Hidden / inline or internal.
- Guide: [Temporary singularity reducers and Talisman Power](Features-hepteracts#temporary-singularity-reducers-and-talisman-power).

## hepteractDistributorTalismanAlone

Hepteract Distributor: replace the ambrosia tree for Talisman Power alone

- Source default: `false`; enabled flag: `false`.
- Location: Hidden / inline or internal.
- Guide: [Temporary singularity reducers and Talisman Power](Features-hepteracts#temporary-singularity-reducers-and-talisman-power).

## hepteractDistributorRatios

Hepteract Distributor saved ratios

- Source default: `""`; enabled flag: `true`.
- Location: Hidden / inline or internal.
- Guide: [Hepteract Distributor with saved ratios](Features-hepteracts#hepteract-distributor-with-saved-ratios).

## hepteractDistributorOrbsPercent

Hepteract Distributor: percentage of hepteracts for Overflux Orbs

- Source default: `0`; enabled flag: `true`.
- Location: Hidden / inline or internal.
- Guide: [Buy Overflux Orbs first](Features-hepteracts#buy-overflux-orbs-first).

## hepteractDistributorKeep

Hepteract Distributor: hepteracts never spent, as how many powers of ten below the stock's own (1 with 3.4e16 owned keeps 1e15, -1 keeps nothing)

- Source default: `-1`; enabled flag: `true`.
- Location: Hidden / inline or internal.
- Guide: [Keep a scaling Hepteract reserve](Features-hepteracts#keep-a-scaling-hepteract-reserve).

## hideGameDialogs

Hide game dialogs

- Source default: `false`; enabled flag: `false`.
- Location: Panel control / ui.
- Guide: [Remember dismissed game dialogs](Features-interface#remember-dismissed-game-dialogs).

## hideGameDialogsNotify

Show hidden dialogs as notifications

- Source default: `false`; enabled flag: `false`.
- Location: Panel control / ui.
- Guide: [Show suppressed alerts as notifications](Features-interface#show-suppressed-alerts-as-notifications).

## compactChallengeText

Compact progress text in the game's challenge modules

- Source default: `false`; enabled flag: `false`.
- Location: Hidden / inline or internal / qol-buttons.
- Guide: [Compact the game's own challenge modules](Features-challenges#compact-the-games-own-challenge-modules).

## challengeProgressHeader

Challenge progress module in the header

- Source default: `true`; enabled flag: `true`.
- Location: Hidden / inline or internal / qol-buttons.
- Guide: [One module for all active challenges](Features-challenges#one-module-for-all-active-challenges).

## challengeProgressLayout

Challenge progress module: layout

- Source default: `"line"`; enabled flag: `true`.
- Location: Hidden / inline or internal.
- Guide: [One module for all active challenges](Features-challenges#one-module-for-all-active-challenges).

## challengeProgressDetails

Challenge progress module: details

- Source default: `"completions"`; enabled flag: `true`.
- Location: Hidden / inline or internal.
- Guide: [One module for all active challenges](Features-challenges#one-module-for-all-active-challenges).

## challengeProgressShowNone

Challenge progress module: CØ outside challenges

- Source default: `false`; enabled flag: `false`.
- Location: Hidden / inline or internal.
- Guide: [One module for all active challenges](Features-challenges#one-module-for-all-active-challenges).

## corruptionHeaderControls

Corruption module: next level and controls

- Source default: `true`; enabled flag: `true`.
- Location: Hidden / inline or internal / qol-buttons.
- Guide: [Current and next corruption level](Features-challenges#current-and-next-corruption-level).

## corruptionHeaderAlwaysShown

Keep the corruption module visible

- Source default: `true`; enabled flag: `true`.
- Location: Hidden / inline or internal / qol-buttons.
- Guide: [Keep corruption visible before C11](Features-challenges#keep-corruption-visible-before-c11).

## editGameHeader

Edit game header

- Source default: `""`; enabled flag: `true`.
- Location: Panel control / ui.
- Guide: [Header pencil and editor shortcut](Features-header#header-pencil-and-editor-shortcut).

## hiddenVanillaTabs

Hide vanilla tabs

- Source default: `[]`; enabled flag: `true`.
- Location: Panel control / ui.
- Guide: [Hide tabs and remember hidden tabs](Features-interface#hide-tabs-and-remember-hidden-tabs).

## rememberSubtabs

Remember last used subtab

- Source default: `true`; enabled flag: `true`.
- Location: Panel control / ui.
- Guide: [Remember each tab's last subtab](Features-interface#remember-each-tabs-last-subtab).

## autoDismissOfflinePopup

Auto-dismiss offline popup

- Source default: `true`; enabled flag: `true`.
- Location: Panel control / ui.
- Guide: [Optional offline-popup dismissal](Features-interface#optional-offline-popup-dismissal).

## reloadOnLateLoaderStart

Reload when the loader starts late

- Source default: `true`; enabled flag: `true`.
- Location: Panel control / ui.
- Guide: [Recover when the browser loader starts late](Features-interface#recover-when-the-browser-loader-starts-late).

## syncNotificationOpacity

Notification opacity

- Source default: `0.6`; enabled flag: `true`.
- Location: Panel control / ui.
- Guide: [Notification opacity](Features-interface#notification-opacity).

## reactiveMouseHover

Reactive mouse hover (when SHIFT is held)

- Source default: `0.2`; enabled flag: `false`.
- Location: Panel control / input.
- Guide: [Reactive hover while holding left Shift](Features-input#reactive-hover-while-holding-left-shift).

## autoClick

Auto click (when CTRL is held)

- Source default: `0.15`; enabled flag: `false`.
- Location: Panel control / input.
- Guide: [Auto-click while holding left Ctrl](Features-input#auto-click-while-holding-left-ctrl).

## autoClickIgnoreElements

Auto click ignores certain elements

- Source default: `false`; enabled flag: `false`.
- Location: Panel control / input.
- Guide: [Auto-click while holding left Ctrl](Features-input#auto-click-while-holding-left-ctrl).

## useGameData

Game Data Sniffing (GDS)

- Source default: `true`; enabled flag: `true`.
- Location: Panel control / gamedata.
- Guide: [Game Data Sniffing and live-game access](Features-tools#game-data-sniffing-and-live-game-access).

## autoExportSave

Export the save every X minutes

- Source default: `30`; enabled flag: `false`.
- Location: Panel control / gamedata.
- Guide: [Export every X minutes](Features-saves#export-every-x-minutes).

## autoExportSaveFolder

Choose folder

- Source default: `""`; enabled flag: `true`.
- Location: Panel control / gamedata.
- Guide: [Choose and remember an export folder](Features-saves#choose-and-remember-an-export-folder).

## autoExportSaveForgetFolder

Forget folder

- Source default: `""`; enabled flag: `true`.
- Location: Panel control / gamedata.
- Guide: [Choose and remember an export folder](Features-saves#choose-and-remember-an-export-folder).

## autoExportSaveKeep

Keep only the last X files

- Source default: `20`; enabled flag: `true`.
- Location: Panel control / gamedata.
- Guide: [Keep only the last X timed-export files](Features-saves#keep-only-the-last-x-timed-export-files).

## autoExportSaveLoadout

Export loadout

- Source default: `""`; enabled flag: `true`.
- Location: Panel control / gamedata.
- Guide: [Dedicated Ambrosia export loadout](Features-saves#dedicated-ambrosia-export-loadout).

## persistentAmbrosiaLevels

Keep upgrade levels shown on the tree

- Source default: `true`; enabled flag: `true`.
- Location: Panel control / ambrosia.
- Guide: [Keep Ambrosia upgrade levels visible](Features-ambrosia#keep-ambrosia-upgrade-levels-visible).

## addTimeAutoLoadouts

Add+Time Amb loadouts auto-switch

- Source default: `false`; enabled flag: `false`.
- Location: Panel control / ambrosia.
- Guide: [Separate ADD and TIME Auto-Loadouts](Features-ambrosia#separate-add-and-time-auto-loadouts).

## autoLoadoutAdd

ADD Loadout

- Source default: `""`; enabled flag: `true`.
- Location: Panel control / ambrosia.
- Guide: [Separate ADD and TIME Auto-Loadouts](Features-ambrosia#separate-add-and-time-auto-loadouts).

## autoLoadoutTime

TIME loadout

- Source default: `""`; enabled flag: `true`.
- Location: Panel control / ambrosia.
- Guide: [Separate ADD and TIME Auto-Loadouts](Features-ambrosia#separate-add-and-time-auto-loadouts).

## startAutosing

Start/Stop Auto-Sing (S216+)

- Source default: `false`; enabled flag: `false`.
- Location: Panel control / auto-sing.
- Guide: [Strategy-driven singularity farming](Features-autosing#strategy-driven-singularity-farming).

## singularityNumber

Singularity to farm

- Source default: `200`; enabled flag: `true`.
- Location: Panel control / auto-sing.
- Guide: [Strategy-driven singularity farming](Features-autosing#strategy-driven-singularity-farming).

## autosingStrategy

Auto-Sing Strategy

- Source default: `"1.TAS_v3.2"`; enabled flag: `true`.
- Location: Panel control / auto-sing.
- Guide: [Create, copy, edit, import, export and delete strategies](Features-autosing#create-copy-edit-import-export-and-delete-strategies).

## editAutosingStrategy

✏️ Edit

- Source default: `""`; enabled flag: `true`.
- Location: Panel control / auto-sing.
- Guide: [Create, copy, edit, import, export and delete strategies](Features-autosing#create-copy-edit-import-export-and-delete-strategies).

## createAutosingStrategy

➕ Create

- Source default: `""`; enabled flag: `true`.
- Location: Panel control / auto-sing.
- Guide: [Create, copy, edit, import, export and delete strategies](Features-autosing#create-copy-edit-import-export-and-delete-strategies).

## deleteAutosingStrategy

🗑️ Delete

- Source default: `""`; enabled flag: `true`.
- Location: Panel control / auto-sing.
- Guide: [Create, copy, edit, import, export and delete strategies](Features-autosing#create-copy-edit-import-export-and-delete-strategies).

## importAutosingStrategy

📥 Import

- Source default: `""`; enabled flag: `true`.
- Location: Panel control / auto-sing.
- Guide: [Create, copy, edit, import, export and delete strategies](Features-autosing#create-copy-edit-import-export-and-delete-strategies).

## exportAutosingStrategy

📤 Export

- Source default: `""`; enabled flag: `true`.
- Location: Panel control / auto-sing.
- Guide: [Create, copy, edit, import, export and delete strategies](Features-autosing#create-copy-edit-import-export-and-delete-strategies).

## autosingNoAmbrosiaSwitch

Don't switch ambrosia loadouts

- Source default: `false`; enabled flag: `false`.
- Location: Panel control / auto-sing.
- Guide: [Don't switch Ambrosia loadouts](Features-autosing#dont-switch-ambrosia-loadouts).

## autosingEarlyCubeLoadout

Pre-AOAG Cube Loadout

- Source default: `""`; enabled flag: `true`.
- Location: Panel control / auto-sing.
- Guide: [Six configurable Ambrosia roles](Features-autosing#six-configurable-ambrosia-roles).

## autosingLateCubeLoadout

Post-AOAG Cube Loadout

- Source default: `""`; enabled flag: `true`.
- Location: Panel control / auto-sing.
- Guide: [Six configurable Ambrosia roles](Features-autosing#six-configurable-ambrosia-roles).

## autosingQuarkLoadout

Quark Loadout

- Source default: `""`; enabled flag: `true`.
- Location: Panel control / auto-sing.
- Guide: [Six configurable Ambrosia roles](Features-autosing#six-configurable-ambrosia-roles).

## autosingObtLoadout

Obtainium Loadout

- Source default: `""`; enabled flag: `true`.
- Location: Panel control / auto-sing.
- Guide: [Six configurable Ambrosia roles](Features-autosing#six-configurable-ambrosia-roles).

## autosingOffLoadout

Offerings Loadout

- Source default: `""`; enabled flag: `true`.
- Location: Panel control / auto-sing.
- Guide: [Six configurable Ambrosia roles](Features-autosing#six-configurable-ambrosia-roles).

## autosingAmbrosiaLoadout

Luck Loadout

- Source default: `""`; enabled flag: `true`.
- Location: Panel control / auto-sing.
- Guide: [Six configurable Ambrosia roles](Features-autosing#six-configurable-ambrosia-roles).

## advancedDataCollection

Advanced Data Collection

- Source default: `false`; enabled flag: `false`.
- Location: Hidden / inline or internal / auto-sing.
- Guide: [Live run statistics, charts and review](Features-autosing#live-run-statistics-charts-and-review).

## ambrosiaMinibars

Ambrosia minibars (S25+)

- Source default: `true`; enabled flag: `true`.
- Location: Hidden / inline or internal / qol-buttons.
- Guide: [Blue, red and purple progress minibars](Features-ambrosia#blue-red-and-purple-progress-minibars).

## ambrosiaMinibarBorders

Ambrosia minibars border

- Source default: `false`; enabled flag: `false`.
- Location: Hidden / inline or internal / qol-buttons.
- Guide: [Optional minibar frame](Features-header#optional-minibar-frame).

## ambrosiaRateHeader

Ambrosia per hour in the header (S25+)

- Source default: `true`; enabled flag: `true`.
- Location: Hidden / inline or internal / qol-buttons.
- Guide: [Expected Ambrosia income per hour](Features-ambrosia#expected-ambrosia-income-per-hour).

## enableAutomationQuickBar

Automation quick bar

- Source default: `true`; enabled flag: `true`.
- Location: Hidden / inline or internal / qol-buttons.
- Guide: [Automation quickbar with mixed-state indicators](Features-header#automation-quickbar-with-mixed-state-indicators).

## matchOcteractIconSize

Match the octeract header icon size

- Source default: `false`; enabled flag: `false`.
- Location: Hidden / inline or internal / qol-buttons.
- Guide: [Match Octeract icon size](Features-header#match-octeract-icon-size).

## matchOcteractText

Match the octeract header text

- Source default: `false`; enabled flag: `false`.
- Location: Hidden / inline or internal / qol-buttons.
- Guide: [Match Octeract unit text](Features-header#match-octeract-unit-text).

## centerQuickbars

Center quick bars

- Source default: `false`; enabled flag: `false`.
- Location: Hidden / inline or internal / qol-buttons.
- Guide: [Automation quickbar with mixed-state indicators](Features-header#automation-quickbar-with-mixed-state-indicators).

## removeHeaderGap

Remove the gap below the header

- Source default: `false`; enabled flag: `false`.
- Location: Hidden / inline or internal / qol-buttons.
- Guide: [Remove unused space below the header](Features-header#remove-unused-space-below-the-header).

## headerHideLoadoutIcons

Hide the header's ambrosia bar icon

- Source default: `false`; enabled flag: `false`.
- Location: Hidden / inline or internal / qol-buttons.
- Guide: [Hide the leading Ambrosia bar icon](Features-header#hide-the-leading-ambrosia-bar-icon).

## headerFitLoadoutSlots

Fit the ambrosia loadout slots to their cell

- Source default: `true`; enabled flag: `true`.
- Location: Hidden / inline or internal / qol-buttons.
- Guide: [Fit loadout slots to their cell](Features-header#fit-loadout-slots-to-their-cell).

## headerEditButton

✎ Header edit button

- Source default: `true`; enabled flag: `true`.
- Location: Hidden / inline or internal / qol-buttons.
- Guide: [Header pencil and editor shortcut](Features-header#header-pencil-and-editor-shortcut).

## headerLongPressEditing

Long press to edit the header

- Source default: `true`; enabled flag: `true`.
- Location: Hidden / inline or internal / qol-buttons.
- Guide: [Optional long-press editing](Features-header#optional-long-press-editing).

## headerStatsAtBottom

Header top row at the bottom

- Source default: `false`; enabled flag: `false`.
- Location: Hidden / inline or internal / qol-buttons.
- Guide: [Move the top row to the bottom](Features-header#move-the-top-row-to-the-bottom).

## hideMaxedGQUpgrades

Hide maxed GQ upgrades

- Source default: `true`; enabled flag: `true`.
- Location: Panel control / qol-buttons.
- Guide: [Remember hidden maxed GQ upgrades](Features-golden-quarks#remember-hidden-maxed-gq-upgrades).

## enableGQDistributor

Enable GQ Distributor

- Source default: `true`; enabled flag: `true`.
- Location: Panel control / qol-buttons.
- Guide: [GQ Distributor with saved upgrade ratios](Features-golden-quarks#gq-distributor-with-saved-upgrade-ratios).

## gqDistributorBalanceInvestments

Balance total GQ investments toward distributor ratios

- Source default: `true`; enabled flag: `true`.
- Location: Hidden / inline or internal.
- Guide: [Balance total investments or split new spending](Features-golden-quarks#balance-total-investments-or-split-new-spending).

## gqDistributorKeepSkippedShare

Keep the GQ share of skipped distributor upgrades unspent

- Source default: `true`; enabled flag: `true`.
- Location: Hidden / inline or internal.
- Guide: [Keep skipped upgrade shares unspent](Features-golden-quarks#keep-skipped-upgrade-shares-unspent).

## gqDistributorRatios

GQ Distributor saved ratios

- Source default: `""`; enabled flag: `true`.
- Location: Hidden / inline or internal.
- Guide: [GQ Distributor with saved upgrade ratios](Features-golden-quarks#gq-distributor-with-saved-upgrade-ratios).

## hideMaxedOctUpgrades

Hide maxed Octeract upgrades

- Source default: `true`; enabled flag: `true`.
- Location: Panel control / qol-buttons.
- Guide: [Remember hidden maxed Octeract upgrades](Features-golden-quarks#remember-hidden-maxed-octeract-upgrades).

## logTimestamp

Display timestamps in log

- Source default: `false`; enabled flag: `false`.
- Location: Panel control / debug.
- Guide: [Color-coded mod log and diagnostics](Features-tools#color-coded-mod-log-and-diagnostics).

## showDebugLogs

Show debug logs

- Source default: `false`; enabled flag: `false`.
- Location: Panel control / debug.
- Guide: [Color-coded mod log and diagnostics](Features-tools#color-coded-mod-log-and-diagnostics).

## enableTalismansModule

Enable the "Cycle BUY" button ("Enhanced BUY ALL")

- Source default: `true`; enabled flag: `true`.
- Location: Panel control / input.
- Guide: [Talisman fragment Cycle BUY](Features-input#talisman-fragment-cycle-buy).

## autosing3to6DCubeOpeningPercent

3-6D Cube opening percentage

- Source default: `80`; enabled flag: `true`.
- Location: Panel control / auto-sing.
- Guide: [Advanced run settings and reset to defaults](Features-autosing#advanced-run-settings-and-reset-to-defaults).

## autosingTessBuildingAutoBuyPercent

Tesseract building auto-buy percentage

- Source default: `50`; enabled flag: `true`.
- Location: Panel control / auto-sing.
- Guide: [Advanced run settings and reset to defaults](Features-autosing#advanced-run-settings-and-reset-to-defaults).

## autosingAutoChallTimerStart

Auto-challenge start timers

- Source default: `0.1`; enabled flag: `true`.
- Location: Panel control / auto-sing.
- Guide: [Advanced run settings and reset to defaults](Features-autosing#advanced-run-settings-and-reset-to-defaults).

## autosingAutoChallTimerExit

Auto-challenge exit timers

- Source default: `0.2`; enabled flag: `true`.
- Location: Panel control / auto-sing.
- Guide: [Advanced run settings and reset to defaults](Features-autosing#advanced-run-settings-and-reset-to-defaults).

## autosingAutoChallTimerEnter

Auto-challenge enter timers

- Source default: `0.1`; enabled flag: `true`.
- Location: Panel control / auto-sing.
- Guide: [Advanced run settings and reset to defaults](Features-autosing#advanced-run-settings-and-reset-to-defaults).

## resetAutosingAdvanced

Reset to default

- Source default: `""`; enabled flag: `true`.
- Location: Panel control / auto-sing.
- Guide: [Advanced run settings and reset to defaults](Features-autosing#advanced-run-settings-and-reset-to-defaults).

## heaterTypeLoadoutSelections

Heater type loadout selections

- Source default: `[]`; enabled flag: `true`.
- Location: Hidden / inline or internal.
- Guide: [Assign, copy and import Heater loadouts](Features-heater#assign-copy-and-import-heater-loadouts).

## heaterUncheckedBranches

Heater unticked branches

- Source default: `[]`; enabled flag: `true`.
- Location: Hidden / inline or internal.
- Guide: [Choose and remember active optimization branches](Features-heater#choose-and-remember-active-optimization-branches).

## heaterTickedBranches

Heater ticked branches

- Source default: `[]`; enabled flag: `true`.
- Location: Hidden / inline or internal.
- Guide: [Choose and remember active optimization branches](Features-heater#choose-and-remember-active-optimization-branches).

## heaterTwoWorkers

Heater: heat in two workers at once (checkbox under the heat button)

- Source default: `true`; enabled flag: `true`.
- Location: Hidden / inline or internal.
- Guide: [Background heating, progress and cancel](Features-heater#background-heating-progress-and-cancel).
