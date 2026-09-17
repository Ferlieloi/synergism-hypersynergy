// Read-only local validation against a Synergism export.  The export is not
// copied into this repository; pass its path as the sole command-line argument.
const fs = require('fs')
const esbuild = require('esbuild')
const inlineImport = require('esbuild-plugin-inline-import')

async function main() {
  const savePath = process.argv[2]
  if (!savePath) throw new Error('Pass the path to a Synergism .txt export')

  const encoded = fs.readFileSync(savePath, 'utf8').trim()
  const save = JSON.parse(Buffer.from(encoded, 'base64').toString('utf8'))

  global.window = global.window ?? {}
  const bundle = await esbuild.build({
    entryPoints: ['scripts/validation-entry.ts'],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    write: false,
    absWorkingDir: process.cwd(),
    plugins: [inlineImport({ filter: /^inline:/ })],
    define: { HS_BUILD_VERSION: JSON.stringify('local-validation') },
    logLevel: 'silent',
  })
  const mod = { exports: {} }
  new Function('module', 'exports', 'require', bundle.outputFiles[0].text)(mod, mod.exports, require)
  const api = new mod.exports.HSGameDataAPI({
    moduleName: 'HSGameDataAPI',
    context: 'validation',
  })
  api._updateGameData(save)
  // Campaign tokens are derived from the saved campaign completions by the
  // API, matching SynergismOfficial's CampaignManager.updateTokens().
  mod.exports.HSModuleManager.getModule = () => ({ forceUpdateAllData: async () => {} })
  const heaterExport = await api.dumpDataForHeater()
  if (!heaterExport?.hs_data) throw new Error('Heater export returned no hs_data')

  const results = {}
  const invalidExportNumbers = []
  const unavailableExportValues = []
  function inspectExport(value, at) {
    if (value === undefined) unavailableExportValues.push(at)
    if (typeof value === 'number' && !Number.isFinite(value)) invalidExportNumbers.push(at)
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [key, child] of Object.entries(value)) inspectExport(child, `${at}.${key}`)
    }
  }
  inspectExport(heaterExport.hs_data, 'hs_data')
  results.invalidExportNumbers = invalidExportNumbers
  results.unavailableExportValues = unavailableExportValues
  if (invalidExportNumbers.length > 0) {
    throw new Error(`Heater export contains non-finite calculations: ${invalidExportNumbers.join(', ')}`)
  }
  const exported = heaterExport.hs_data
  const noAmbTalismanPower = api.talisman.allTalismanRuneBonusStatsSum('true_base')
  const talismanRuneBonuses = api.talisman.getRuneBonusFromAllTalismansBatch()
  const noAmbTalismanRuneBonuses = api.talisman.getRuneBonusFromAllTalismansBatch('true_base')
  const noAmbTalismanRuneBonusSI = noAmbTalismanRuneBonuses.superiorIntellect
  const noAmbTalismanRuneBonusIA = noAmbTalismanRuneBonuses.infiniteAscent
  const expectedBaseOff = api.allBaseOfferingStats.reduce((sum, line) => sum + (
    line.i18n === 'AmbrosiaBaseOffering1'
      ? api.ambrosia.getAmbrosiaUpgradeEffects('ambrosiaBaseOffering1', 'true_base').offering
      : line.i18n === 'AmbrosiaBaseOffering2'
        ? api.ambrosia.getAmbrosiaUpgradeEffects('ambrosiaBaseOffering2', 'true_base').offering
        : line.i18n === 'OfferingEX3'
          ? api.quarkShop.getShopUpgradeEffects('offeringEX3', 'baseOfferings', 'true_base')
          : line.stat()
  ), 0)
  const expectedBaseObt = api.allBaseObtainiumStats.reduce((sum, line) => sum + (
    line.i18n === 'AmbrosiaBaseObtainium1'
      ? api.ambrosia.getAmbrosiaUpgradeEffects('ambrosiaBaseObtainium1', 'true_base').obtainium
      : line.i18n === 'AmbrosiaBaseObtainium2'
        ? api.ambrosia.getAmbrosiaUpgradeEffects('ambrosiaBaseObtainium2', 'true_base').obtainium
        : line.stat()
  ), 0)
  if (exported.totalAmbrosiaLuck !== api.luck.calculateLuck().luckTotal
      || exported.ambrosiaBarPointsS * exported.blueberries !== api.ambrosia.calculateAmbrosiaGenerationSpeed()
        * api.ambrosia.calculateBlueberryInventory()
      || exported.purpleHoneyBarMax !== api.ambrosia.calculatePurpleHoneyConversionFactor()
      || Math.abs(exported.totalAdditiveLuckMultiplierNoAmb - api.luck.calculateLuck(true, 'true_base').luckMult) > 1e-12
      || Math.abs(exported.ambrosiaLuckPer1RedLuckNoAmb - api.luck.calculateLuckConversion(true, 'true_base')) > 1e-12
      || Math.abs(exported.totalRedLuck - api.luck.calculateRedAmbrosiaLuck(true)) > 1e-9
      || Math.abs(exported.totalRedLuckNoAmb - api.luck.calculateRedAmbrosiaLuck(true, 'true_base')) > 1e-9
      || Math.abs(exported.baseAscensionSpeedMultiplierNoAmb - api.calculateRawAscensionSpeedMult(true, 'true_base')) / Math.max(1, Math.abs(api.calculateRawAscensionSpeedMult(true, 'true_base'))) > 1e-12
      || Math.abs(exported.finalAscensionSpeedMultiplierNoAmb - api.calculateAscensionSpeedMult('true_base')) / Math.max(1, Math.abs(api.calculateAscensionSpeedMult('true_base'))) > 1e-12
      || Math.abs(exported.ascensionSpeedExponentNoAmb - api.calculateAscensionSpread(true, 'true_base')) > 1e-12
      || exported.totalBaseOfferingsNoAmb !== expectedBaseOff
      || exported.totalBaseObtainiumNoAmb !== expectedBaseObt
      || Math.abs(exported.runeSiRCNoAmb - api.rune.getLevelsPerOOM('superiorIntellect', 'true_base')) > 1e-12
      || Math.abs(exported.runeSiBonusLevelsTotalNoAmb - (api.firstFiveFreeLevels() + noAmbTalismanRuneBonusSI)) > 1e-12
      || Math.abs(exported.runeIaBonusLevelsTalismanNoAmb - noAmbTalismanRuneBonusIA) > 1e-12
      || Math.abs(exported.runeIaBonusLevelsTotalNoAmb - (api.getRuneBonusLevels('infiniteAscent') - talismanRuneBonuses.infiniteAscent + noAmbTalismanRuneBonusIA)) > 1e-12
      || Math.abs(exported.totalTalismanPowerMultiplierNoAmb - noAmbTalismanPower) > 1e-12
      || Math.abs(exported.freeShopLevelsInfinityNoAmb - api.freeInfinityLevels('true_base')) > 1e-12
      || Math.abs(exported.freeShopLevelsQuarkNoAmb - api.quarkShop.getShopFreeLevelsQuark('true_base')) > 1e-12
      || Math.abs(exported.chronometerLevelNoAmb - api.quarkShop.getShopLevel('chronometerInfinity', 'true_base')) > 1e-12
      || Math.abs(exported.totalRedBarPointsS - api.calculateRedAmbrosiaGenerationSpeed()) > 1e-12
      || Math.abs(exported.totalRedBarPointsSNoAmb - api.calculateRedAmbrosiaGenerationSpeed('true_base')) > 1e-12) {
    throw new Error('Heater export no longer matches current game-data API calculations')
  }
  if (exported.purpleHoneyBarMax !== 150_000) {
    throw new Error('Purple bar requirement disagrees with the provided game benchmark')
  }
  // The official global event is fetched after helpers are constructed.
  // Confirm they read its current state instead of the construction-time flag.
  const noEventLuckMultiplier = api.luck.calculateLuck().luckMult
  const noEventAmbrosiaSpeed = api.ambrosia.calculateAmbrosiaGenerationSpeed()
  const noEventAscensionRaw = api.calculateRawAscensionSpeedMult()
  api.vanillaGlobalEvent = {
    name: 'local validation', start: 0, end: Number.MAX_SAFE_INTEGER,
    blueberryTime: 0.25, ambrosiaLuck: 0.10, ascensionSpeed: 0.50,
  }
  api._updateEventData({ HAPPY_HOUR_BELL: { amount: 0, ends: [], displayName: '' } })
  const eventLuckMultiplier = api.luck.calculateLuck().luckMult
  const eventAmbrosiaSpeed = api.ambrosia.calculateAmbrosiaGenerationSpeed()
  const eventAscensionRaw = api.calculateRawAscensionSpeedMult()
  if (Math.abs(eventLuckMultiplier - noEventLuckMultiplier - 0.10) > 1e-10
      || Math.abs(eventAmbrosiaSpeed / noEventAmbrosiaSpeed - 1.25) > 1e-10
      || Math.abs(eventAscensionRaw / noEventAscensionRaw - 1.50) > 1e-10) {
    throw new Error('Global event bonuses were not captured by the game-data calculations')
  }
  results.globalEventCapture = {
    luckMultiplierIncrease: eventLuckMultiplier - noEventLuckMultiplier,
    ambrosiaSpeedMultiplier: eventAmbrosiaSpeed / noEventAmbrosiaSpeed,
    ascensionRawMultiplier: eventAscensionRaw / noEventAscensionRaw,
  }
  api.vanillaGlobalEvent = null
  api._updateEventData({ HAPPY_HOUR_BELL: { amount: 0, ends: [], displayName: '' } })
  results.heaterExport = Object.fromEntries([
    'totalAmbrosiaLuck', 'ambrosiaLuckNoAmb', 'totalAdditiveLuckMultiplierNoAmb', 'totalAmbrosiaLuckNoAmb',
    'ambrosiaBarPointsS', 'ambrosiaBarPointsSNoAmb', 'finalAmbrosiaBarPointsSNoAmb', 'blueberries', 'baseAscensionSpeedMultiplierNoAmb', 'finalAscensionSpeedMultiplierNoAmb',
    'blueAmbrosiaBarMax', 'redAmbrosiaBarMax', 'purpleHoneyBarMax',
    'totalRedLuck', 'totalRedLuckNoAmb', 'ambrosiaLuckPer1RedLuckNoAmb', 'blueBarRequirementBeforeRounding',
    'runeSiRCNoAmb', 'runeSiBonusLevelsTotalNoAmb', 'runeSiBonusLevelsTalismanNoAmbrosia',
    'runeIaBonusLevelsTotalNoAmb', 'runeIaBonusLevelsTalismanNoAmb', 'totalTalismanPowerMultiplierNoAmb',
    'freeShopLevelsInfinityNoAmb', 'freeShopLevelsQuarkNoAmb', 'chronometerLevelNoAmb',
    'totalRedBarPointsS', 'totalRedBarPointsSNoAmb', 'blueBarMaxWithoutTwoMindAndBrick', 'totalBaseOfferingsNoAmb', 'totalBaseObtainiumNoAmb',
  ].map((key) => [key, heaterExport.hs_data[key]]))
  for (const [key, fn] of Object.entries({
    purpleBarPointsRequired: () => api.ambrosia.calculatePurpleHoneyConversionFactor(),
    blueBarPointsRequired: () => api.ambrosia.calculateRequiredBlueberryTime(),
    blueBarPointsWithoutTwoMind: () => api.ambrosia.calculateRequiredBlueberryTime(true),
    redBarPointsRequired: () => api.ambrosia.calculateRequiredRedAmbrosiaTime(),
    redBarPointsWithoutTwoMind: () => api.ambrosia.calculateRequiredRedAmbrosiaTime(true),
    ambrosiaLuck: () => api.luck.calculateLuck().luckTotal,
    blueberryInventory: () => api.ambrosia.calculateBlueberryInventory(),
    luckModuleIII: () => api.ambrosia.getAmbrosiaUpgradeEffects('ambrosiaLuck3').ambrosiaLuck,
    ambrosiaRewardLuck: () => api.luck.calculateLuck().luckTotal * api.ambrosia.calculateRequiredBlueberryTime() / api.ambrosia.calculateRequiredBlueberryTime(true),
    ambrosiaLuckTrueBase: () => api.luck.calculateLuck(true, 'true_base').luckTotal,
    ambrosiaLuckNoAmbrosia: () => api.luck.calculateLuck(true, 'non_ambrosia').luckTotal,
    ambrosiaLuckComponents: () => api.luck.calculateLuck(false),
    redLuck: () => api.luck.calculateRedAmbrosiaLuck(),
    redLuckNormal: () => api.luck.calculateRedAmbrosiaLuck(true, 'normal'),
    redRewardLuck: () => api.luck.calculateRedAmbrosiaLuck(true, 'normal') * api.ambrosia.calculateRequiredRedAmbrosiaTime() / api.ambrosia.calculateRequiredRedAmbrosiaTime(true),
    redLuckComponents: () => api.luck.calculateRedAmbrosiaLuck(false),
    ambrosiaBarPointsPerSecondWithoutOnlineBonuses: () => api.ambrosia.calculateAmbrosiaGenerationSpeed() * api.ambrosia.calculateBlueberryInventory(),
    ambrosiaGenerationComponentsWithoutOnlineBonuses: () => api.ambrosia.calculateAmbrosiaGenerationSpeed(false),
    ascensionSpeed: () => api.calculateAscensionSpeedMult(),
    ascensionSpeedNoAmbrosia: () => api.calculateAscensionSpeedMult('non_ambrosia'),
    ascensionSpreadNormal: () => api.calculateAscensionSpread(),
    ascensionSpreadNoAmbrosia: () => api.calculateAscensionSpread(true, 'non_ambrosia'),
    ascensionRawComponents: () => api.calculateRawAscensionSpeedMult(false),
    freeInfinityLevelsNormal: () => api.freeInfinityLevels(),
    runeSiLevelsPerOOMNormal: () => api.rune.getLevelsPerOOM('superiorIntellect'),
    baseTalismanPowerNormal: () => api.talisman.allTalismanRuneBonusStatsSum(),
    baseOfferingNormal: () => api.allBaseOfferingStats.reduce((sum, line) => sum + line.stat(), 0),
    baseObtainiumNormal: () => api.allBaseObtainiumStats.reduce((sum, line) => sum + line.stat(), 0),
  })) {
    try {
      results[key] = fn()
    } catch (error) {
      results[key] = { error: error.message }
    }
  }
  const lifetimeAmbrosia = save.lifetimeAmbrosia
  const accelerator = 1 - 0.006 * save.shopUpgrades.shopAmbrosiaAccelerator
    * save.singularityChallenges.noAmbrosiaUpgrades.completions
  let preRound = (45 + Math.floor(lifetimeAmbrosia / 300)) * accelerator
  if (lifetimeAmbrosia >= 10_000) {
    preRound *= Math.pow(lifetimeAmbrosia / 10_000, Math.log10(4))
  }
  results.brickRequirementChecks = [0, 10, 25].map((level) => {
    const trialSave = {
      ...save,
      ambrosiaUpgrades: {
        ...save.ambrosiaUpgrades,
        ambrosiaBrickOfLead: {
          ...save.ambrosiaUpgrades.ambrosiaBrickOfLead,
          ambrosiaInvested: 10 * level ** 3,
        },
      },
    }
    api._updateGameData(trialSave)
    const expected = lifetimeAmbrosia >= 10_000
      ? Math.ceil(preRound / (1 - level / 50))
      : preRound / (1 - level / 50)
    return { level, expected, api: api.ambrosia.calculateRequiredBlueberryTime(true) }
  })
  if (results.brickRequirementChecks.some(({ expected, api: actual }) => expected !== actual)) {
    throw new Error('Brick requirement does not match the game formula')
  }
  results.freeCubeShopChecks = [0, 5, 30].map((level) => {
    const trialSave = {
      ...save,
      ambrosiaUpgrades: {
        ...save.ambrosiaUpgrades,
        ambrosiaFreeCubeUpgrades: {
          ...save.ambrosiaUpgrades.ambrosiaFreeCubeUpgrades,
          ambrosiaInvested: 10_000 * level ** 2,
        },
      },
    }
    api._updateGameData(trialSave)
    return {
      level,
      cubeGroupLevels: api.quarkShop.getShopUpgradeTypeBonusLevels(2),
      passInfinityGlobal: api.quarkShop.getShopUpgradeEffects('seasonPassInfinity', 'globalCubeMult'),
      passInfinityOcteract: api.quarkShop.getShopUpgradeEffects('seasonPassInfinity', 'wowOcteractMult'),
    }
  })
  const baseCubeGroupLevels = results.freeCubeShopChecks[0].cubeGroupLevels
  if (results.freeCubeShopChecks.some(({ level, cubeGroupLevels }) =>
    Math.abs(cubeGroupLevels - baseCubeGroupLevels - level) > 1e-8)) {
    throw new Error('Free Cube shop group levels do not match the game formula')
  }
  console.log(JSON.stringify(results, null, 2))
  // The bundled module manager can keep timers alive; validation is complete.
  process.exit(0)
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
