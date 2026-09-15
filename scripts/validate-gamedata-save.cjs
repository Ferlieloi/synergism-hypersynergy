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
  // The export does not contain Discord/Pseudo/Campaign account state.
  mod.exports.HSModuleManager.getModule = () => ({ forceUpdateAllData: async () => {} })
  const heaterExport = await api.dumpDataForHeater()
  if (!heaterExport?.hs_data) throw new Error('Heater export returned no hs_data')

  const results = {}
  results.heaterExport = Object.fromEntries([
    'luckTotal', 'ambSpeed', 'blueberries', 'ascSpeed',
    'blueAmbrosiaBarMax', 'redAmbrosiaBarMax', 'purpleHoneyBarMax',
    'redLuckBase', 'blueBarRequirementBeforeRounding',
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
    ambrosiaLuckNonAmbrosia: () => api.luck.calculateLuck(true, 'non_ambrosia').luckTotal,
    ambrosiaLuckComponents: () => api.luck.calculateLuck(false),
    redLuck: () => api.luck.calculateRedAmbrosiaLuck(),
    redLuckNormal: () => api.luck.calculateRedAmbrosiaLuck(true, 'normal'),
    redRewardLuck: () => api.luck.calculateRedAmbrosiaLuck(true, 'normal') * api.ambrosia.calculateRequiredRedAmbrosiaTime() / api.ambrosia.calculateRequiredRedAmbrosiaTime(true),
    redLuckComponents: () => api.luck.calculateRedAmbrosiaLuck(false),
    ambrosiaBarPointsPerSecondWithoutOnlineBonuses: () => api.ambrosia.calculateAmbrosiaGenerationSpeed() * api.ambrosia.calculateBlueberryInventory(),
    ambrosiaGenerationComponentsWithoutOnlineBonuses: () => api.ambrosia.calculateAmbrosiaGenerationSpeed(false),
    ascensionSpeed: () => api.calculateAscensionSpeedMult(),
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
}

main().catch((error) => {
  console.error(error.message)
  process.exitCode = 1
})
