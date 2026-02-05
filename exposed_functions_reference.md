# HyperSynergism Mod: Complete Exposed Functions Reference

## Overview

This document provides a comprehensive reference of all functions and APIs exposed by the HyperSynergism mod, including both functions exposed from the vanilla Synergism game and functions provided by the mod itself.

## 1. Vanilla Game Functions Exposed to Mod

The loader patches the vanilla game's minified bundle to expose internal functions for modding purposes. These are accessible via `window.__HS_*` prefixed global variables.

### Core Game Objects
- **`window.DOMCacheGetOrSet`** → `c` (DOM caching function)
- **`window.__HS_synergismStage`** → `Sy` (Game stage/state object)
- **`window.__HS_loadStatistics`** → `Qe` (Statistics loading function)
- **`window.__HS_loadMiscellaneousStats`** → `g6` (Miscellaneous stats function)
- **`window.__HS_i18next`** → `s` (Internationalization object)

### Building Purchase Functions
- **`window.__HS_buyBuilding`** → `pr` (Buy buildings - handles coin/diamond/mythos/particle/tesseract buildings)
- **`window.__HS_buyAccelerator`** → `pu` (Buy accelerator upgrades)
- **`window.__HS_buyMultiplier`** → `mu` (Buy multiplier upgrades)
- **`window.__HS_buyAcceleratorBoost`** → `Jl` (Buy accelerator boost upgrades)
- **`window.__HS_buyParticle`** → `Ns` (Buy particle upgrades)
- **`window.__HS_buyAscend`** → `Qd` (Buy ascension upgrades)
- **`window.__HS_buyTesseract`** → `Xl` (Buy tesseract upgrades)

### Upgrade Functions
- **`window.__HS_upgrade`** → `qd` (General upgrade function)
- **`window.__HS_upgradeCrystal`** → `ua` (Crystal upgrade function)
- **`window.__HS_upgradeRune`** → `pg` (Rune upgrade function)

### Reset Functions
- **`window.__HS_reset`** → `tn` (General reset function)
- **`window.__HS_singularityReset`** → `Ti` (Singularity reset function)

### Challenge Functions
- **`window.__HS_enterChallenge`** → `Ia` (Enter challenge function)
- **`window.__HS_exitChallenge`** → `Hn` (Exit challenge function)
- **`window.__HS_calculateChallenge15`** → `Fd` (Challenge 15 calculation)

### Achievement Functions
- **`window.__HS_unlockAchievement`** → `Je` (Unlock achievement)
- **`window.__HS_updateAchievement`** → `Da` (Update achievement progress)

### Rune/Talisman Functions
- **`window.__HS_runeSacrifice`** → `ta` (Rune sacrifice function)
- **`window.__HS_updateRunes`** → `zy` (Update runes)
- **`window.__HS_updateRuneBlessings`** → `TS` (Update rune blessings)
- **`window.__HS_updateRuneSpirits`** → `BS` (Update rune spirits)
- **`window.__HS_updateTalismans`** → `mS` (Update talismans)

### Singularity Functions
- **`window.__HS_calculateSingularity`** → `Ur` (Singularity calculation 1)
- **`window.__HS_calculateSingularity2`** → `xa` (Singularity calculation 2)
- **`window.__HS_calculateSingularity3`** → `Aa` (Singularity calculation 3)
- **`window.__HS_singularityFunction`** → `Yr` (General singularity function)

### Corruption Functions
- **`window.__HS_initCorruptions`** → `Is` (Initialize corruptions)
- **`window.__HS_updateCorruptions`** → `Us` (Update corruptions)
- **`window.__HS_corruptionFunction1`** → `NL` (Corruption function 1)
- **`window.__HS_corruptionFunction2`** → `iS` (Corruption function 2)
- **`window.__HS_corruptionFunction3`** → `yx` (Corruption function 3)
- **`window.__HS_corruptionFunction4`** → `_S` (Corruption function 4)

### UI Functions
- **`window.__HS_confirmReset`** → `Cb` (Confirm reset dialog)
- **`window.__HS_resetResources`** → `xr` (Reset resources)
- **`window.__HS_updateUI`** → `Vt` (Update UI)
- **`window.__HS_switchTab`** → `kt` (Switch UI tabs)
- **`window.__HS_toggleStatSymbols`** → `xC` (Toggle stat symbols)

### Calculation Functions
- **`window.__HS_initGame`** → `BT` (Initialize game)
- **`window.__HS_gameFunction1`** → `Vp` (Game calculation function 1)
- **`window.__HS_gameFunction2`** → `of` (Game calculation function 2)
- **`window.__HS_gameFunction3`** → `Pi` (Game calculation function 3)
- **`window.__HS_gameFunction4`** → `qT` (Game calculation function 4)
- **`window.__HS_gameFunction5`** → `Kw` (Game calculation function 5)
- **`window.__HS_gameFunction6`** → `Ww` (Game calculation function 6)
- **`window.__HS_gameFunction7`** → `sf` (Game calculation function 7)
- **`window.__HS_gameFunction8`** → `zv` (Game calculation function 8)
- **`window.__HS_gameFunction9`** → `_2` (Game calculation function 9)
- **`window.__HS_gameFunction10`** → `Aj` (Game calculation function 10)
- **`window.__HS_gameFunction11`** → `_a` (Game calculation function 11)
- **`window.__HS_gameFunction12`** → `tC` (Game calculation function 12)
- **`window.__HS_gameFunction13`** → `Tj` (Game calculation function 13)
- **`window.__HS_gameFunction14`** → `jp` (Game calculation function 14)
- **`window.__HS_gameFunction15`** → `Bj` (Game calculation function 15)
- **`window.__HS_gameFunction16`** → `Lp` (Game calculation function 16)
- **`window.__HS_gameFunction17`** → `du` (Game calculation function 17)
- **`window.__HS_gameFunction18`** → `w0` (Game calculation function 18)
- **`window.__HS_gameFunction19`** → `k0` (Game calculation function 19)
- **`window.__HS_gameFunction20`** → `x0` (Game calculation function 20)
- **`window.__HS_gameFunction21`** → `oa` (Game calculation function 21)
- **`window.__HS_gameFunction22`** → `Eh` (Game calculation function 22)

## 2. Mod-Exposed APIs and Functions

### Main Mod Object
**`window.hypersynergism`** - Main mod instance
- **`init()`** - Initialize the mod
- **`preprocessModules()`** - Preprocess enabled modules

### HSGlobal Configuration Object
Global configuration and settings object containing all mod settings and constants.

#### Core Settings
- **`HSGlobal.Debug`** - Debug configuration flags
- **`HSGlobal.PrivateAPI`** - Private API endpoints and settings
- **`HSGlobal.General`** - General mod information and URLs
- **`HSGlobal.Common`** - Common settings (experimental GDS, event API)

#### Module-Specific Configurations
- **`HSGlobal.HSPrototypes`** - DOM prototype timing settings
- **`HSGlobal.HSElementHooker`** - DOM element hooking configuration
- **`HSGlobal.HSLogger`** - Logging level and size settings
- **`HSGlobal.HSStorage`** - Storage prefix configuration
- **`HSGlobal.HSUI`** - UI component IDs and classes
- **`HSGlobal.HSUIC`** - UI component default dimensions
- **`HSGlobal.HSSettings`** - Settings management configuration
- **`HSGlobal.HSMouse`** - Mouse interaction settings
- **`HSGlobal.HSAmbrosia`** - Ambrosia management settings
- **`HSGlobal.HSGameState`** - Game state view properties
- **`HSGlobal.HSGameData`** - Game data fetching configuration

### HSModuleManager
Module management system for accessing individual mod modules.

**`HSModuleManager.getModule<T>(moduleName: string): T | undefined`**
- Access any loaded mod module by name
- Returns typed module instance or undefined

### HSGameDataAPI (Game Data Sniffing System)
Comprehensive API for accessing and calculating game data without direct manipulation.

#### Data Access Methods
- **`getGameData(): PlayerData | undefined`** - Access current player save data
- **`getMeData(): MeData`** - Get user account information
- **`getPseudoData(): PseudoGameData | undefined`** - Access pseudo-coin shop data
- **`getCampaignData(): CampaignData | undefined`** - Get campaign progress data
- **`getEventData(): ConsumableGameEvents | undefined`** - Access active event data

#### Cache Management
- **`clearCache()`** - Clear all calculation caches
- **`dumpCache()`** - Dump cache contents for debugging

#### Ambrosia Investment Functions
- **`investToAmbrosiaUpgrade(upgradeName, amount, useCap = false)`** - Invest cubes into ambrosia upgrades
- **`investToRedAmbrosiaUpgrade(upgradeName, amount, useCap = false)`** - Invest powder into red ambrosia upgrades

#### Calculation Functions (All prefixed with `R_`)
- **`R_calculateSigmoidExponential(constant, coefficient)`** - Sigmoid exponential calculation
- **`R_getTalismanLevel(t)`** - Get talisman level
- **`R_getTalismanRarity(t)`** - Get talisman rarity
- **`R_getRuneBonusFromIndividualTalisman(t, rune)`** - Calculate rune bonus from talisman
- **`R_getRuneBonusFromAllTalismans(rune)`** - Calculate total rune bonus from talismans
- **`R_getTalismanLevelCap(t)`** - Get talisman level cap
- **`R_universalTalismanMaxLevelIncreasers()`** - Calculate universal talisman level increases
- **`R_isTalismanUnlocked(t)`** - Check if talisman is unlocked
- **`R_getLevelMilestone(name)`** - Get level milestone
- **`R_getPCoinUpgradeLevel(name)`** - Get pseudo-coin upgrade level
- **`R_getTalismanMaxLevel(t)`** - Get talisman maximum level
- **`R_getTalismanBaseMult(t)`** - Get talisman base multiplier
- **`R_getTalismanCostType(t)`** - Get talisman cost type
- **`R_getTalismanExponentialRatio(t)`** - Get talisman exponential ratio
- **`R_isShopTalismanUnlocked()`** - Check if shop talisman is unlocked
- **`R_computeFreeLevelMultiplierGQ()`** - Compute GQ free level multiplier
- **`R_computeGQUpgradeFreeLevelSoftcap(upgradeKey)`** - Compute GQ upgrade softcap
- **`R_computeFreeLevelMultiplierOCT()`** - Compute octeract free level multiplier
- **`R_actualOcteractUpgradeTotalLevels(upgradeKey)`** - Get actual octeract upgrade levels
- **`R_actualGQUpgradeTotalLevels(upgradeKey)`** - Get actual GQ upgrade levels
- **`R_getGQUpgradeEffect(upgradeKey)`** - Get GQ upgrade effect
- **`R_bonusRuneLevelsSpeed()`** - Calculate speed rune bonus levels
- **`R_bonusRuneLevelsDuplication()`** - Calculate duplication rune bonus levels
- **`R_calculateConsumableEventBuff(buff)`** - Calculate event buff effects
- **`getSingChalApReward(chal)`** - Get singularity challenge AP reward
- **`R_calculateAmbrosiaGenerationShopUpgrade(reduce_vals)`** - Calculate ambrosia generation shop upgrade
- **`R_calculateAmbrosiaGenerationSingularityUpgrade(reduce_vals)`** - Calculate ambrosia generation singularity upgrade
- **`R_calculateAmbrosiaGenerationOcteractUpgrade(reduce_vals)`** - Calculate ambrosia generation octeract upgrade
- **`R_calculateSingularityMilestoneBlueberries()`** - Calculate singularity blueberry milestone
- **`R_calculateDilatedFiveLeafBonus()`** - Calculate dilated five-leaf clover bonus
- **`R_calculateSingularityAmbrosiaLuckMilestoneBonus()`** - Calculate singularity ambrosia luck milestone
- **`R_calculateAmbrosiaLuckShopUpgrade(reduce_vals)`** - Calculate ambrosia luck shop upgrade
- **`R_calculateAmbrosiaLuckSingularityUpgrade(reduce_vals)`** - Calculate ambrosia luck singularity upgrade
- **`R_calculateAmbrosiaLuckOcteractUpgrade(reduce_vals)`** - Calculate ambrosia luck octeract upgrade
- **`R_calculateTotalCubes()`** - Calculate total cubes
- **`R_calculateAmbrosiaUpgradeValue(upgradeName)`** - Calculate ambrosia upgrade value
- **`R_calculateSynergismLevel()`** - Calculate synergism level
- **`R_calculateRedAmbrosiaUpgradeValue(upgradeName)`** - Calculate red ambrosia upgrade value
- **`R_calculateCampaignRune6Bonus()`** - Calculate campaign rune 6 bonus
- **`R_calculateCampaignAmbrosiaSpeedBonus()`** - Calculate campaign ambrosia speed bonus
- **`R_calculateCampaignLuckBonus()`** - Calculate campaign luck bonus
- **`R_calculateCookieUpgrade29Luck()`** - Calculate cookie upgrade 29 luck
- **`R_calculateSumOfExaltCompletions()`** - Calculate sum of exalt completions
- **`getCorruptionTotalLevel()`** - Get total corruption level
- **`R_calculateFreeShopInfinityUpgrades(reduce_vals)`** - Calculate free shop infinity upgrades
- **`R_calculateAllShopTablets(reduce_vals)`** - Calculate all shop tablets
- **`R_calculateLimitedAscensionsDebuff()`** - Calculate limited ascensions debuff
- **`R_calculateSingularityReductions(reduce_vals)`** - Calculate singularity reductions
- **`R_calculateEffectiveSingularities(singularityCount)`** - Calculate effective singularities
- **`R_calculateSingularityDebuff(debuff, singularityCount)`** - Calculate singularity debuff
- **`R_calculateAscensionSpeedExponentSpread(reduce_vals)`** - Calculate ascension speed exponent spread
- **`R_calculateChallenge15Reward(rewardName)`** - Calculate challenge 15 reward
- **`R_calculateRawAscensionSpeedMult(reduce_vals)`** - Calculate raw ascension speed multiplier
- **`R_calculateAscensionSpeedMult()`** - Calculate ascension speed multiplier
- **`R_calculatePolymathAscSpeed()`** - Calculate polymath ascension speed
- **`R_calculateMortuus2AscensionSpeed()`** - Calculate Mortuus 2 ascension speed
- **`R_calculateRuneEffectiveLevel(runeType)`** - Calculate effective rune level
- **`R_calculateCorruptionEffect(loadout, corruption)`** - Calculate corruption effect
- **`R_calculateTrueAntLevel(antUpgrade)`** - Calculate true ant level
- **`calculateHorseShoeLevel()`** - Calculate horseshoe level
- **`R_calculateCashGrabBonus(extra)`** - Calculate cash grab bonus
- **`R_calculateEXUltraBonus(extra)`** - Calculate EX ultra bonus
- **`calculateAmbrosiaSpeed(reduce_vals)`** - Calculate ambrosia speed
- **`R_calculateBlueBerries(reduce_vals)`** - Calculate blueberries
- **`calculateLuck(reduce_vals, true_base)`** - Calculate luck
- **`R_calculateLuckConversion(reduce_vals)`** - Calculate luck conversion
- **`R_calculateEffectiveSingularity()`** - Calculate effective singularity
- **`R_calculateRedAmbrosiaLuck(reduce_vals)`** - Calculate red ambrosia luck
- **`calculateGoldenRevolution()`** - Calculate golden revolution

#### Static Methods
- **`getCalculationDefinitions(filter?)`** - Get all available calculation definitions

### HSUtils Utility Functions
Static utility functions for common operations.

- **`wait(delay: number)`** - Promise-based delay
- **`uuidv4()`** - Generate UUID v4
- **`domid()`** - Generate DOM element ID
- **`getExponent(num: number)`** - Extract exponent from number
- **`hashCode(str: string)`** - Generate string hash
- **`N(num, precision?, expDeci?)`** - Format numbers
- **`getTime()`** - Get formatted timestamp
- **`camelToKebab(str)`** - Convert camelCase to kebab-case
- **`kebabToCamel(str)`** - Convert kebab-case to camelCase
- **`isNumeric(n)`** - Check if value is numeric
- **`isString(n)`** - Check if value is string
- **`isBoolean(n)`** - Check if value is boolean
- **`parseFloat2(float)`** - Parse float with error handling
- **`parseColorTags(msg)`** - Parse color tags in messages
- **`removeColorTags(msg)`** - Remove color tags from messages
- **`unfuckNumericString(str)`** - Clean numeric strings
- **`eventBuffNumToName(buff)`** - Convert event buff number to name
- **`asString(settingValue)`** - Convert setting value to string
- **`waitForNextMutation(...)`** - Wait for DOM mutations
- **`startDialogWatcher()`** - Start dialog watching
- **`base64WithCRLF(...)`** - Base64 encoding with CRLF
- **`getCorruptions(mode)`** - Get corruption data
- **`isGreaterThan200(input)`** - Check if input > 200
- **`parseBigNumber(input)`** - Parse big numbers
- **`currentCoins(input)`** - Get current coin count
- **`sumContents(arr)`** - Sum array contents

### HSSettings Management
Settings management and configuration.

- **`autoBuildSettingsUI()`** - Automatically build settings UI
- **`validateStrategy(strategy)`** - Validate auto-sing strategy
- **`getSettings()`** - Get all settings
- **`getStrategies()`** - Get auto-sing strategies
- **`saveStrategiesToStorage(...)`** - Save strategies to storage
- **`saveSettingsToStorage()`** - Save settings to storage
- **`dumpToConsole()`** - Dump settings to console

### HSStorage Data Persistence
Local storage management with HS prefix.

- **`setData<T>(key, data)`** - Store data in localStorage
- **`getData<T>(key)`** - Retrieve data from localStorage
- **`clearData(key)`** - Clear data from localStorage

### Module Access via HSModuleManager
Access to individual mod modules:

- **`HSModuleManager.getModule<HSUI>('HSUI')`** - UI management module
- **`HSModuleManager.getModule<HSSettings>('HSSettings')`** - Settings module
- **`HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI')`** - Game data API
- **`HSModuleManager.getModule<HSAmbrosia>('HSAmbrosia')`** - Ambrosia management
- **`HSModuleManager.getModule<HSLogger>('HSLogger')`** - Logging system
- **`HSModuleManager.getModule<HSStorage>('HSStorage')`** - Storage system
- **`HSModuleManager.getModule<HSMouse>('HSMouse')`** - Mouse interaction module
- **`HSModuleManager.getModule<HSPatches>('HSPatches')`** - Game patches
- **`HSModuleManager.getModule<HSStats>('HSStats')`** - Statistics module
- **`HSModuleManager.getModule<HSTalismans>('HSTalismans')`** - Talisman enhancements
- **`HSModuleManager.getModule<HSQOLButtons>('HSQOLButtons')`** - QoL buttons
- **`HSModuleManager.getModule<HSAutosing>('HSAutosing')`** - Auto-singularity
- **`HSModuleManager.getModule<HSGameData>('HSGameData')`** - Game data fetching

## 3. Backdoor Debug Access

The loader also provides a debug backdoor for checking function exposure:

**`window.__HS_BACKDOOR__.exposed`** - Object containing exposure status of all functions

## 4. Integration Patterns

### Accessing Vanilla Functions
```javascript
// Direct access to exposed vanilla functions
const buyBuilding = window.__HS_buyBuilding;
buyBuilding(1, 100); // Buy 100 coin buildings

// Or through the mod's API
const gameDataAPI = HSModuleManager.getModule('HSGameDataAPI');
// Use mod's calculation functions
```

### Using Mod APIs
```javascript
// Access mod modules
const ui = HSModuleManager.getModule('HSUI');
const settings = HSModuleManager.getModule('HSSettings');

// Use utility functions
const formatted = HSUtils.N(123456789, 2);

// Access game data
const playerData = HSModuleManager.getModule('HSGameDataAPI').getGameData();
```

## 5. Function Categories and Purposes

### Building Automation
- `pr` (buyBuilding) - Core building purchase logic with binary search optimization
- Various buy functions for different building types
- Upgrade functions for permanent improvements

### Game State Management
- Reset functions for progression
- Challenge entry/exit functions
- Achievement tracking functions

### Advanced Calculations
- 60+ calculation functions in HSGameDataAPI
- Cached computations for performance
- Real-time game state analysis

### UI Enhancement
- Tab switching and UI updates
- Notification and dialog management
- Statistics display functions

### Data Persistence
- Settings storage and retrieval
- Save data management
- Cache management for calculations

This comprehensive API allows the mod to provide extensive QoL features while maintaining access to all vanilla game functionality for advanced automation and information display.