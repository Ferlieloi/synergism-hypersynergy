import fs from 'node:fs'
import { performance } from 'node:perf_hooks'

type JsonRecord = Record<string, any>

function installBrowserStubs(): void {
  const root = globalThis as JsonRecord
  root.window = root
  root.performance = performance
  root.location ??= { href: 'http://localhost/', hostname: 'localhost' }
  root.navigator ??= { userAgent: 'node', hardwareConcurrency: 4 }
  root.localStorage ??= {
    getItem: () => null,
    setItem: () => undefined,
    removeItem: () => undefined,
  }
  root.document ??= {
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
    createElement: () => ({ style: {}, classList: { add() {}, remove() {}, toggle() {} } }),
    head: { appendChild() {} },
    body: { appendChild() {} },
  }
  root.alert ??= () => undefined
  root.confirm ??= () => false
}

function readSave(path: string): JsonRecord {
  const encoded = fs.readFileSync(path, 'utf8').trim()
  return JSON.parse(Buffer.from(encoded, 'base64').toString('utf8')) as JsonRecord
}

async function buildInput(save: JsonRecord): Promise<any> {
  const [{ HSGameDataAPI }, inputConfig, { HEATER_BRANCH_DEFINITIONS }, { HSUI }, { HSModuleManager }] = await Promise.all([
    import('../src/mod/class/hs-core/gds/hs-gamedata-api'),
    import('../src/mod/class/hs-modules/hs-heater/hs-heater-input-config'),
    import('../src/mod/class/hs-modules/hs-heater/hs-heater-result-config'),
    import('../src/mod/class/hs-core/hs-ui'),
    import('../src/mod/class/hs-core/module/hs-module-manager'),
  ])
  HSUI.Notify = () => undefined as any
  const api = new HSGameDataAPI({ moduleName: 'Experiment', context: 'Experiment' }) as any
  api._updateGameData(save)
  api._updateMeData({ bonus: { quark: 0 }, globalBonus: 0 })
  api._updateEventData({
    HAPPY_HOUR_BELL: { amount: 0, ends: [], displayName: 'Happy Hour Bell' },
    LOTUS_OF_REJUVENATION: { amount: 0, ends: [], displayName: 'Lotus of Rejuvenation' },
  })
  const event = {
    name: ['The Purple'], url: [''], start: 0, end: Number.MAX_SAFE_INTEGER,
    quark: 0.3, goldenQuark: 0, cubes: 0, powderConversion: 0,
    ascensionSpeed: 0.5, globalSpeed: 0.5, ascensionScore: 0,
    antSacrifice: 0, offering: 0, obtainium: 0, octeract: 0.25,
    blueberryTime: 0.25, ambrosiaLuck: 0.1, oneMind: 0.03, color: ['purple'],
  }
  api.vanillaGlobalEvent = event
  api.isEvent = true
  api.fetchVanillaGlobalEventData = async () => event
  api.getForcedGameData = async () => save
  HSModuleManager.getModule = (() => ({ forceUpdateAllData: async () => undefined })) as any
  const exportData = await api.dumpDataForHeater()
  if (!exportData?.hs_data)
    throw new Error('Failed to calculate hs_data from save')
  const hsData = exportData.hs_data
  const savedLoadoutProbe = process.env.HS_EXPERIMENT_SAVED_LOADOUT === '1'
    ? {
      levels: Object.fromEntries(Object.keys(save.ambrosiaUpgrades).map((name) => {
        const current = api.ambrosia.calculateAmbrosiaUpgradeValue(name)
        const free = api.ambrosia.calculateAmbrosiaUpgradeValue(name, true)
        return [name, current - free]
      })),
      official: {
        blueBarPointsPerSecond: hsData.ambrosiaBarPointsS * hsData.blueberries,
        redBarPointsPerSecond: hsData.totalRedBarPointsS,
        blueLuck: hsData.totalAmbrosiaLuck,
        redLuck: hsData.totalRedLuck,
        luckConversion: api.luck.calculateLuckConversion(true),
      },
    } : undefined
  const base = Object.fromEntries(inputConfig.inputDefinitions.map((field: any) => {
    const extractor = inputConfig.exportFieldExtractors[field.key]
    return [field.key, extractor ? extractor(hsData) : hsData[field.key]]
  }))
  return {
    ...base,
    ambrosiaUpgradeBonusLevels: hsData.ambrosiaUpgradeBonusLevels ?? {},
    ambrosiaUpgradeBlueberryCostReductions: hsData.ambrosiaUpgradeBlueberryCostReductions ?? {},
    runeSiBonusLevelsTalismanNoAmbrosia: Number(hsData.runeSiBonusLevelsTalismanNoAmbrosia ?? 0),
    runeSiEffectiveLevelMultiplier: Number(hsData.totalSIRunePowerMultiplier ?? 1),
    shopUpgradeRawLevels: hsData.shopUpgradeRawLevels ?? {},
    shopBonusLevelsNoAmbrosia: hsData.shopBonusLevelsNoAmbrosia,
    panthemaLevel: hsData.panthemaLevel ?? 0,
    shopUpgradesDisabled: Boolean(hsData.shopUpgradesDisabled),
    reactor: hsData.heaterReactor,
    savedLoadoutProbe,
    heaterOptions: Object.fromEntries(HEATER_BRANCH_DEFINITIONS.map((branch: any) => [
      branch.id,
      (process.env.HS_EXPERIMENT_BRANCHES ?? 'cubes').split(',').includes(branch.id),
    ])),
  }
}

function summary(label: string, amb: number, blueberries: number, run: any): JsonRecord {
  const winner = run.diagnostics.cubeWinner
  return {
    label,
    amb,
    blueberries,
    elapsedMs: Math.round(run.diagnostics.elapsedMs),
    effect: winner?.effect,
    cost: winner?.cost,
    blueberryCost: winner?.blueberryCost,
    cubes1: winner?.levels.ambrosiaCubes1 ?? 0,
    cubes2: winner?.levels.ambrosiaCubes2 ?? 0,
    cubes3: winner?.levels.ambrosiaCubes3 ?? 0,
    pureLuckFraction: winner ? winner.spending.pureLuck / amb : 0,
    luckAndHybridFraction: winner
      ? (winner.spending.pureLuck + winner.spending.cubeLuckHybrid) / amb
      : 0,
    spending: winner?.spending,
    barIncomeProbe: run.diagnostics.barIncomeProbe,
    emptyLoadoutCheck: run.diagnostics.emptyLoadoutCheck,
    savedLoadoutCheck: run.diagnostics.savedLoadoutCheck,
    stages: run.diagnostics.stages,
    chainTiers: run.diagnostics.chainTiers,
    searchPartitions: run.diagnostics.searchPartitions,
    loadout: winner?.levels,
  }
}

function signature(value: unknown): string {
  const text = JSON.stringify(value)
  let hash = 2166136261
  for (let index = 0; index < text.length; index++) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return (hash >>> 0).toString(16).padStart(8, '0')
}

async function main(): Promise<void> {
  installBrowserStubs()
  const savePath = process.argv[2]
  if (!savePath)
    throw new Error('Usage: run-heater-cube-experiments <save path>')
  const save = readSave(savePath)
  if (process.env.HS_EXPERIMENT_SAVE_AMBROSIA_INVESTMENTS) {
    const investments = JSON.parse(process.env.HS_EXPERIMENT_SAVE_AMBROSIA_INVESTMENTS)
    for (const [name, amount] of Object.entries(investments)) {
      if (!save.ambrosiaUpgrades[name])
        throw new Error(`Unknown saved Ambrosia upgrade: ${name}`)
      save.ambrosiaUpgrades[name].ambrosiaInvested = Number(amount)
    }
  }
  if (process.env.HS_EXPERIMENT_SAVE_PURPLE_INVESTMENTS) {
    const investments = JSON.parse(process.env.HS_EXPERIMENT_SAVE_PURPLE_INVESTMENTS)
    for (const [name, amount] of Object.entries(investments)) {
      if (!save.ambrosiaUpgrades[name])
        throw new Error(`Unknown saved Ambrosia upgrade: ${name}`)
      save.ambrosiaUpgrades[name].purpleAmbrosiaInvested = Number(amount)
    }
  }
  const input = await buildInput(save)
  if (process.env.HS_EXPERIMENT_PRINT_INPUT === '1') {
    console.log(JSON.stringify({
      ambrosiaUpgradeBonusLevels: input.ambrosiaUpgradeBonusLevels,
      ambrosiaUpgradeBlueberryCostReductions: input.ambrosiaUpgradeBlueberryCostReductions,
      reactor: input.reactor,
      baselines: {
        ambSpeedNoAmbBerries: input.ambSpeedNoAmbBerries,
        luckBaseNoAmb: input.luckBaseNoAmb,
        luckMultNoAmb: input.luckMultNoAmb,
        purpleLeoLevel: input.purpleLeoLevel,
        redLuckBase: input.redLuckBase,
        luckConversion: input.luckConversion,
        bonusRow2: input.bonusRow2,
        bonusRow3: input.bonusRow3,
        shopAmbrosiaGeneration1: input.shopAmbrosiaGeneration1,
        shopAmbrosiaGeneration2: input.shopAmbrosiaGeneration2,
        shopAmbrosiaGeneration3: input.shopAmbrosiaGeneration3,
        shopAmbrosiaGeneration4: input.shopAmbrosiaGeneration4,
        shopRedLuck1: input.shopRedLuck1,
        shopRedLuck2: input.shopRedLuck2,
        shopRedLuck3: input.shopRedLuck3,
        shopRedLuck4: input.shopRedLuck4,
      },
    }))
    return
  }
  if (process.env.HS_EXPERIMENT_BONUS_LEVELS) {
    input.ambrosiaUpgradeBonusLevels = {
      ...input.ambrosiaUpgradeBonusLevels,
      ...JSON.parse(process.env.HS_EXPERIMENT_BONUS_LEVELS),
    }
  }
  if (process.env.HS_EXPERIMENT_BERRY_REDUCTIONS) {
    input.ambrosiaUpgradeBlueberryCostReductions = {
      ...input.ambrosiaUpgradeBlueberryCostReductions,
      ...JSON.parse(process.env.HS_EXPERIMENT_BERRY_REDUCTIONS),
    }
  }
  if (process.env.HS_EXPERIMENT_REACTOR_OVERRIDES) {
    input.reactor = {
      ...input.reactor,
      ...JSON.parse(process.env.HS_EXPERIMENT_REACTOR_OVERRIDES),
    }
  }
  const { HSHeaterOptimizer } = await import('../src/mod/class/hs-modules/hs-heater/hs-heater-optimizer')
  const ambValues = process.env.HS_EXPERIMENT_AMB
    ? process.env.HS_EXPERIMENT_AMB.split(',').map(Number)
    : [input.amb]
  const blueberryValues = process.env.HS_EXPERIMENT_BERRIES
    ? process.env.HS_EXPERIMENT_BERRIES.split(',').map(Number)
    : [input.blueberries]
  const policies: Array<{ label: string; config: any }> = [
    { label: 'exact', config: {} },
    { label: 'bar-income-probe', config: { probeBarIncome: true } },
    { label: 'bar-income-raw-probe', config: { probeRawBarIncome: true } },
    { label: 'legacy-offering', config: { useLegacyOfferingSearch: true } },
    { label: 'legacy-quark', config: { useLegacyQuarkSearch: true } },
    { label: 'legacy-all-amb', config: { useLegacyAllAmbMerge: true } },
    { label: 'legacy-hyperflux', config: { useLegacyHyperfluxMerge: true } },
    { label: 'legacy-independent', config: { useLegacyIndependentMerge: true } },
    { label: 'legacy-voucher-endpoints', config: { useLegacyVoucherEndpoints: true } },
    { label: 'validate-voucher-scores', config: { validateVoucherMergeScores: true } },
    { label: 'validate-chain-scores', config: { validateChainScores: true } },
    { label: 'c12-w30', config: { cubeLevelWindows: { ambrosiaCubes1: 30, ambrosiaCubes2: 30 }, retainMilestonesBelowWindow: true } },
    { label: 'c12-w20', config: { cubeLevelWindows: { ambrosiaCubes1: 20, ambrosiaCubes2: 20 }, retainMilestonesBelowWindow: true } },
    { label: 'c12-w10', config: { cubeLevelWindows: { ambrosiaCubes1: 10, ambrosiaCubes2: 10 }, retainMilestonesBelowWindow: true } },
    { label: 'c123-w10', config: { cubeLevelWindows: { ambrosiaCubes1: 10, ambrosiaCubes2: 10, ambrosiaCubes3: 10 }, retainMilestonesBelowWindow: true } },
    { label: 'luck-cap-50', config: { maxLuckSpendFraction: 0.5 } },
    { label: 'luck-cap-40', config: { maxLuckSpendFraction: 0.4 } },
    { label: 'luck-cap-30', config: { maxLuckSpendFraction: 0.3 } },
    { label: 'luck-cap-20', config: { maxLuckSpendFraction: 0.2 } },
    { label: 'luck-cap-15', config: { maxLuckSpendFraction: 0.15 } },
    { label: 'luck-cap-12', config: { maxLuckSpendFraction: 0.12 } },
  ]
  const requested = new Set((process.env.HS_EXPERIMENT_POLICIES ?? '').split(',').filter(Boolean))
  const selected = requested.size > 0 ? policies.filter(policy => requested.has(policy.label)) : policies
  const rows: JsonRecord[] = []
  for (const amb of ambValues) {
    for (const blueberries of blueberryValues) {
      const scenarioInput = {
        ...input,
        amb,
        blueberries,
        ...(process.env.HS_EXPERIMENT_EXALT
          ? { exalt: Number(process.env.HS_EXPERIMENT_EXALT) }
          : {}),
        ...(process.env.HS_EXPERIMENT_PANTHEMA
          ? { panthemaLevel: Number(process.env.HS_EXPERIMENT_PANTHEMA) }
          : {}),
      }
      let exactRow: JsonRecord | undefined
      for (const policy of selected) {
        const requestedBranches = (process.env.HS_EXPERIMENT_BRANCHES ?? '').split(',').filter(Boolean)
        const multiBranchExperiment = process.env.HS_EXPERIMENT_FULL === '1' || requestedBranches.length > 0
        const enabledBranches = new Set(requestedBranches)
        const run = multiBranchExperiment
          ? HSHeaterOptimizer.runExperiment({
            ...scenarioInput,
            heaterOptions: Object.fromEntries(
              Object.keys(scenarioInput.heaterOptions).map(branch => [
                branch,
                process.env.HS_EXPERIMENT_FULL === '1' || enabledBranches.has(branch),
              ]),
            ) as typeof scenarioInput.heaterOptions,
          }, {
            ...policy.config,
            ...(scenarioInput.savedLoadoutProbe
              ? { probeLoadoutLevels: scenarioInput.savedLoadoutProbe.levels } : {}),
          })
          : HSHeaterOptimizer.runCubeExperiment(scenarioInput, policy.config)
        const row = summary(policy.label, amb, blueberries, run)
        if (scenarioInput.savedLoadoutProbe)
          row.savedLoadoutOfficial = scenarioInput.savedLoadoutProbe.official
        if (scenarioInput.savedLoadoutProbe)
          row.savedLoadoutLevels = Object.fromEntries(
            Object.entries(scenarioInput.savedLoadoutProbe.levels).filter(([, level]) => Number(level) > 0),
          )
        if (multiBranchExperiment) {
          const resultWithoutInput = Object.fromEntries(
            Object.entries(run.result).filter(([key]) => key !== 'input'),
          )
          row.resultSignature = signature(resultWithoutInput)
          row.branchSignatures = Object.fromEntries(
            Object.entries(resultWithoutInput).map(([key, value]) => [key, signature(value)]),
          )
          if (process.env.HS_EXPERIMENT_COMPACT !== '1')
            row.fullResult = resultWithoutInput
        }
        if (policy.label === 'exact')
          exactRow = row
        else if (exactRow) {
          row.effectRatio = row.effect / exactRow.effect
          row.matchesExactLoadout = JSON.stringify(row.loadout) === JSON.stringify(exactRow.loadout)
        }
        rows.push(row)
        // The harness exits explicitly because imported browser code installs
        // long-lived timers.  Write synchronously so the final benchmark row
        // cannot be dropped while stdout is still buffered.
        fs.writeSync(process.stdout.fd, `${JSON.stringify(row)}\n`)
      }
    }
  }
  const exactByScenario = new Map(rows.filter(row => row.label === 'exact').map(row => [`${row.amb}:${row.blueberries}`, row]))
  void exactByScenario
}

void main().then(
  () => process.exit(0),
  error => {
    console.error(error instanceof Error ? error.stack : error)
    process.exit(1)
  },
)
