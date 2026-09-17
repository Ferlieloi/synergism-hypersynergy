import type { HeaterOptimizerInput, HeaterOptimizationResult, HeaterRedAmbUpgradeEffects, HeaterResultRow, HeaterResultRowMatrix, } from "../../../types/data-types/hs-heater-types";
import { formatNumber } from "./hs-heater-utils";
import { HEATER_BRANCH_DEFINITIONS } from "./hs-heater-result-config";
import { HSLogger } from "../../hs-core/hs-logger";
/*
    This file closely match the script on Rus9384's sheet (credits to him),
    in order to be easily updatable when the sheet updates (and vice-versa...)
    Sheet link: https://docs.google.com/spreadsheets/d/105yoI41lk8UJ2PThTkV0tWKNli5R0K1WuaSphKl13R0/edit?gid=1484254243#gid=1484254243
*/

// ===========================================================================
// Internal state types
// ===========================================================================

interface UpgradeEffectMap {
    luck?:          (input: number, level: number, loadout: Loadout) => number;
    mLuck?:         (input: number, level: number, loadout: Loadout) => number;
    quark?:         (input: number, level: number, loadout: Loadout) => number;
    cube?:          (input: number, level: number, loadout: Loadout, p4x4?: number) => number;
    oct?:           (input: number, level: number, loadout: Loadout) => number;
    speed?:         (input: number, level: number, loadout: Loadout) => number;
    rSpeed?:        (input: number, level: number, loadout: Loadout) => number;
    rLuck?:         (input: number, level: number, loadout: Loadout) => number;
    obt?:           (input: number, level: number, loadout: Loadout) => number;
    off?:           (input: number, level: number, loadout: Loadout) => number;
    mObt?:          (input: number, level: number, loadout: Loadout) => number;
    mOff?:          (input: number, level: number, loadout: Loadout) => number;
    vouchers?:      (input: number, level: number, loadout: Loadout) => number;
    singReduction?: (input: number, level: number, loadout: Loadout) => number;
}

interface UpgradeParameters {
    maxLevel:       number;
    cost:           (level: number) => number;
    effects:        UpgradeEffectMap;
    row:            number;
    blueberryCost:  number;
    prerequisites:  Partial<Record<string, number>>;
    ignoresExalt:   boolean;
    requiresExalt9: boolean;
    costArray?:     number[];
}


// ===========================================================================
// Stats object (mirrors the sheet_script `stats` const, populated from input)
// ===========================================================================

interface Stats {
    amb:             number;
    rAmb:            number;
    bonusAmbrosiaPerFill: number;
    lifetimeAmbExp:  number;
    ambSpeed:        number;
    baseLuck:        number;
    baseMLuck:       number;
    baseRLuck:       number;
    rLuck:           number;
    luckConversion:  number;
    quarks:          number;
    qHept:           number;
    cubeExp:         number;
    rawSing:         number;
    sing:            number;
    exalt:           number;
    exalt9Unlocked:  boolean;
    postAoAG:        boolean;
    oneMindUnlocked: boolean;
    aquariusExponent:number;
    mind:            number;
    aSpeed:          number;
    spread:          number;
    baseObt:         number;
    baseOff:         number;
    blueberries:     number;
    purpleLeoLevel:  number;
    tutorialBonus:   number;
    bonus:           number[];
    runeExp:         number;
    runeCoefSI:      number;
    bonusSI:         number;
    talismanSI:      number;
    runeMultSI:      number;
    baseSI:          number;
    expIA:           number;
    bonusIA:         number;
    talismanIA:      number;
    talismanP:       number;
    baseIACube:      number;
    baseIAQuark:     number;
    patreon:         number;
    jack:            boolean;
    voucher:         number;
    shopQuark:       number;
    chronometer:     number;
    shopLuck:        number;
    shopRLuck:       number[];
    shopAmb:         number[];
    qHeptExp:        number;
    ossifiedTactics: number;
    ossifiedTactics2:number;
    redberries:      number;
    fusion:          number;
    viscount:        boolean;
    blueBarMaxWithoutTwoMindAndBrick: number;
    blueBarRequirementBeforeRounding: number;
    redBarMaxWithoutTwoMind: number;
    ambrosiaUpgradeBonusLevels: Record<string, number>;
    ambrosiaUpgradeBlueberryCostReductions: Record<string, number>;
    shopUpgradeRawLevels: Record<string, number>;
    shopBonusLevels: HeaterOptimizerInput['shopBonusLevelsNoAmbrosia'];
    panthemaLevel: number;
    shopUpgradesDisabled: boolean;
}


// ===========================================================================
// Options (mirrors the sheet_script `options` const, populated from input)
// ===========================================================================

interface Options {
    calculateAmb:       boolean;
    calculateQuarks:    boolean;
    calculateCubes:     boolean;
    calculateOct:       boolean;
    calculateOff:       boolean;
    calculateHyperflux: boolean;
    calculateSR:        boolean;
    calculateAmbOct:    boolean;
    calculateGen:       boolean;
}

// ===========================================================================
// Module-level mutable state (reset on each call to createHeaterOptimizerResultFromInput)
// ===========================================================================

let stats: Stats = {
    amb: 0,
    rAmb: 0,
    bonusAmbrosiaPerFill: 0,
    lifetimeAmbExp: 0,
    ambSpeed: 1,
    baseLuck: 0,
    baseMLuck: 0,
    baseRLuck: 0,
    rLuck: 0,
    luckConversion: 20,
    quarks: 0,
    qHept: 0,
    cubeExp: 0,
    rawSing: 0,
    sing: 0,
    exalt: 0,
    exalt9Unlocked: false,
    postAoAG: false,
    oneMindUnlocked: false,
    aquariusExponent: 0,
    mind: 0.5,
    aSpeed: 1,
    spread: 0,
    baseObt: 1,
    baseOff: 1,
    blueberries: 3,
    purpleLeoLevel: 0,
    tutorialBonus: 0,
    bonus: [0, 0, 0, 0, 0, 0],
    runeExp: 0,
    runeCoefSI: 30,
    bonusSI: 0,
    talismanSI: 0,
    runeMultSI: 1,
    baseSI: 1,
    expIA: 0,
    bonusIA: 0,
    talismanIA: 0,
    talismanP: 1,
    baseIACube: 1,
    baseIAQuark: 1,
    patreon: 0,
    jack: false,
    voucher: 0,
    shopQuark: 0,
    chronometer: 0,
    shopLuck: 0,
    shopRLuck: [0, 0, 0, 0],
    shopAmb: [0, 0, 0, 0],
    qHeptExp: 0,
    ossifiedTactics: 0,
    redberries: 0,
    fusion: 0,
    viscount: false,
    blueBarMaxWithoutTwoMindAndBrick: 25_000_000,
    blueBarRequirementBeforeRounding: 25_000_000,
    redBarMaxWithoutTwoMind: 7_500,
    ossifiedTactics2: 0,
    ambrosiaUpgradeBonusLevels: {},
    ambrosiaUpgradeBlueberryCostReductions: {},
    shopUpgradeRawLevels: {},
    shopBonusLevels: {
      offering: 0,
      obtainium: 0,
      cubes: 0,
      speed: 0,
      quark: 0,
      ambrosiaLuck: 0,
      redAmbrosiaLuck: 0,
      ambrosiaGeneration: 0,
      infinity: 0,
    },
    panthemaLevel: 0,
    shopUpgradesDisabled: false,
};

let options: Options = {
    calculateAmb: false,
    calculateQuarks: false,
    calculateCubes: false,
    calculateOct: false,
    calculateOff: false,
    calculateHyperflux: false,
    calculateSR: false,
    calculateAmbOct: false,
    calculateGen: false,
};

let singDebuffCache: { off: number[]; cube: number[] } = {
    off: [],
    cube: []
}

// Computed once per optimizer run.  fixBlueberryUpgrades is called from the
// innermost merge loops, so rebuilding this order for every candidate would
// dominate the actual stat calculations.
let blueberryRemovalOrder: string[] = [];

// ===========================================================================
// Upgrade class
// ===========================================================================

class Upgrade {

    maxLevel:       number;
    cost:           (level: number) => number;
    effects:        UpgradeEffectMap;
    row:            number;
    blueberryCost:  number;
    prerequisites:  Partial<Record<string, number>>;
    ignoresExalt:   boolean;
    requiresExalt9: boolean;
    costArray?:     number[];

    constructor(parameters: Partial<UpgradeParameters> = {}) {

        this.maxLevel      = parameters.maxLevel      ?? 0;
        this.cost          = parameters.cost          ?? (() => 0);
        this.effects       = parameters.effects       ?? {};
        this.row           = parameters.row           ?? 0;
        this.blueberryCost = parameters.blueberryCost ?? 0;
        this.prerequisites = parameters.prerequisites ?? {};
        this.ignoresExalt  = parameters.ignoresExalt  ?? false;
        this.requiresExalt9 = parameters.requiresExalt9 ?? false;

        if (parameters.costArray !== undefined) {
            this.costArray = parameters.costArray;
        }

    }

    static singDebuff(sing = 0, stat = ""): number {

      if (stat === "mOff" && singDebuffCache.off[sing] !== undefined)
        return singDebuffCache.off[sing]
      if (stat === "cube" && singDebuffCache.cube[sing] !== undefined)
        return singDebuffCache.cube[sing]

        const effectiveSing = (): number => {
            let eff = sing * Math.min(4.75, 0.075 * sing + 1)
            if(sing > 10)
                eff *= 1.5 * Math.min(4, 0.125 * sing - 0.25)
            if(sing > 25)
                eff *= 2.5 * Math.min(6, 0.06 * sing - 0.5)
            if(sing > 36)
                eff *= 4 * Math.min(5, sing / 18 - 1) * 1.1 ** Math.min(sing - 36, 64)
            if(sing > 50)
                eff *= 5 * Math.min(8, 0.04 * sing - 1) * 1.1 ** Math.min(sing - 50, 50)
            if(sing > 100)
                eff *= 0.08 * sing * 1.1 ** (sing - 100)
            if(sing > 150)
                eff *= 2 * 1.05 ** (sing - 150)
            if(sing > 200)
                eff *= 1.5 * 1.275 ** (sing - 200)
            if(sing > 215)
                eff *= 1.25 * 1.2 ** (sing - 215)
            if(sing > 230)
                eff *= 2
            if(sing > 269)
                eff *= 3 ** (sing - 268)
            return eff
        }

        let effSing = effectiveSing()
        if (stat === "mOff") {
            let result = 1.02 ** sing * (1 + Math.sqrt(effSing) / 4)
            result *= sing < 150 ? 3 * Math.sqrt(effSing + 1) : effSing ** (2 / 3) / 400
            result *= 1 + Math.sqrt(effSing) / 4 // Global Speed due to Half Mind
            singDebuffCache.off[sing] = result
            return result
        } else if (stat === "cube") {
            let result = 2 * 1.03 ** Math.max(0, sing - 100)
            if(sing < 150) // Including Ascension Speed due to One Mind
              result = 3 * (1 + (Math.sqrt(effSing) * result) / 4) * (1 + Math.sqrt(effSing) / 5)
            else
              result = 1 + (effSing ** 0.75 * result) / 1000 * (1 + effSing ** 0.75 / 10000)
            singDebuffCache.cube[sing] = result
            return result
        }

        return 1

    }

    static ambrosiaRuneOOMBonusCost() {
      let result = [0]
      for (let level = 1; level <= 100; level++)
        result.push(result[level - 1] + Math.ceil(2500 * (level ** 1.5 - (level - 1) ** 1.5)))
      return result
    }

    // Mirrors SynergismOfficial/src/Runes.ts updateLevelsFromEXP and
    // getRuneEffectiveLevel. Work in log space so exported Decimal EXP values
    // remain stable even when they exceed JavaScript's finite number range.
    static log10OnePlusPower10(exponent: number): number {
      if (exponent === Number.NEGATIVE_INFINITY)
        return 0
      if (exponent > 16)
        return exponent + Math.log10(1 + 10 ** -exponent)
      if (exponent < -323)
        return 0
      return Math.log10(1 + 10 ** exponent)
    }

    static runeLevelSI(runeCoefDelta = 0, talismanPDelta = 0) {
      const purchasedLevel = Math.max(0, Math.floor(
        (stats.runeCoefSI + runeCoefDelta) * this.log10OnePlusPower10(stats.runeExp - 12)
      ))
      const talismanBonus = stats.talismanP > 0
        ? stats.talismanSI * talismanPDelta / stats.talismanP
        : 0
      return (purchasedLevel + stats.bonusSI + talismanBonus) * stats.runeMultSI
    }

    static runeLevelIA(runeCoefDelta = 0, talismanPDelta = 0) {
      const purchasedLevel = Math.max(0, Math.floor(
        (0.5 + runeCoefDelta) * this.log10OnePlusPower10(stats.expIA - 75)
      ))
      const talismanBonus = stats.talismanP > 0
        ? stats.talismanIA * talismanPDelta / stats.talismanP
        : 0
      return purchasedLevel + stats.bonusIA + talismanBonus
    }

    // Mirrors SynergismOfficial/src/Shop.ts getBonusLevels/getShopLevel.
    // A free level only affects a shop upgrade that has at least one bought
    // level. shopPanthema is the sole exception and never receives levels.
    static shopLevel(
      upgrade: string,
      groupDeltas: Partial<Record<keyof Stats['shopBonusLevels'], number>> = {},
      freeUpgradeMultiplier = 1,
    ): number {
      const rawLevel = stats.shopUpgradeRawLevels[upgrade] ?? 0
      const isUtility = /^improveQuarkHept/.test(upgrade)
      if (rawLevel <= 0 || (stats.shopUpgradesDisabled && !isUtility))
        return 0

      const groupsByUpgrade: Record<string, Array<keyof Stats['shopBonusLevels']>> = {
        offeringEX: ['offering'], offeringEX2: ['offering'], offeringEX3: ['offering', 'infinity'],
        obtainiumEX: ['obtainium'], obtainiumEX2: ['obtainium'], obtainiumEX3: ['obtainium', 'infinity'],
        cashGrab: ['offering', 'obtainium'], cashGrab2: ['offering', 'obtainium'],
        seasonPass: ['cubes'], seasonPass2: ['cubes'], seasonPass3: ['cubes'],
        seasonPassY: ['cubes'], seasonPassZ: ['cubes'], seasonPassLost: ['cubes'],
        seasonPassInfinity: ['cubes', 'infinity'], chronometerInfinity: ['speed', 'infinity'],
        improveQuarkHept: ['quark'], improveQuarkHept2: ['quark'],
        improveQuarkHept3: ['quark'], improveQuarkHept4: ['quark'],
        improveQuarkHept5: ['quark', 'infinity'],
        shopAmbrosiaLuck1: ['ambrosiaLuck'], shopAmbrosiaLuck2: ['ambrosiaLuck'],
        shopAmbrosiaLuck3: ['ambrosiaLuck'], shopAmbrosiaLuck4: ['ambrosiaLuck'],
        shopRedLuck1: ['redAmbrosiaLuck'], shopRedLuck2: ['redAmbrosiaLuck'],
        shopRedLuck3: ['redAmbrosiaLuck'], shopRedLuck4: ['redAmbrosiaLuck'],
        shopAmbrosiaGeneration1: ['ambrosiaGeneration'], shopAmbrosiaGeneration2: ['ambrosiaGeneration'],
        shopAmbrosiaGeneration3: ['ambrosiaGeneration'], shopAmbrosiaGeneration4: ['ambrosiaGeneration'],
      }
      const groups = groupsByUpgrade[upgrade] ?? []
      const bonus = groups.reduce((sum, group) => sum + stats.shopBonusLevels[group] + (groupDeltas[group] ?? 0), 0)
      return rawLevel + freeUpgradeMultiplier * bonus
    }

    static totalInfinityLevels(loadout: Loadout): number {
      return stats.shopBonusLevels.infinity + loadout.getStat('vouchers')
    }

    static panthemaInfinityBoost(loadout: Loadout): number {
      return 1 + 0.01 * stats.panthemaLevel * this.totalInfinityLevels(loadout)
    }

    static panthemaMultiplier(
      group: keyof Stats['shopBonusLevels'],
      addedGroupLevels: number,
      coefficient: number,
      loadout: Loadout,
    ): number {
      if (stats.panthemaLevel <= 0)
        return 1
      const baseInfinityBoost = 1 + 0.01 * stats.panthemaLevel * stats.shopBonusLevels.infinity
      const base = 1 + coefficient * stats.panthemaLevel * stats.shopBonusLevels[group] * baseInfinityBoost
      const next = 1 + coefficient * stats.panthemaLevel
        * (stats.shopBonusLevels[group] + addedGroupLevels)
        * this.panthemaInfinityBoost(loadout)
      return next / base
    }

    static panthemaAdditive(
      group: 'ambrosiaLuck' | 'redAmbrosiaLuck',
      addedGroupLevels: number,
      coefficient: number,
      loadout: Loadout,
    ): number {
      if (stats.panthemaLevel <= 0)
        return 0
      const baseInfinityBoost = 1 + 0.01 * stats.panthemaLevel * stats.shopBonusLevels.infinity
      const base = coefficient * stats.panthemaLevel * stats.shopBonusLevels[group] * baseInfinityBoost
      const next = coefficient * stats.panthemaLevel
        * (stats.shopBonusLevels[group] + addedGroupLevels)
        * this.panthemaInfinityBoost(loadout)
      return next - base
    }

    static ascensionSpeed(loadout: Loadout) {
      const oldSpreadPower = 1 + stats.spread * (stats.aSpeed >= 1 ? 1 : -1)
      let nextRawSpeed = stats.aSpeed ** (1 / oldSpreadPower)
      const vouchers = loadout.getStat('vouchers')

      if (stats.chronometer > 0)
        nextRawSpeed *= 1.006 ** vouchers
      nextRawSpeed *= this.panthemaMultiplier('speed', 0, 0.005, loadout)

      const brickLevel = stats.exalt === 6 || stats.exalt === 8
        ? 0
        : loadout.effectiveLevel('ambrosiaBrickOfLead')
      nextRawSpeed *= 1 - 0.01 * brickLevel

      const oldLevel = Math.floor(stats.chronometer / 40)
      const newLevel = Math.floor((stats.chronometer + (stats.chronometer > 0 ? vouchers : 0)) / 40)
      const nextSpread = stats.spread + 0.001 * (newLevel - oldLevel)
      const nextSpreadPower = 1 + nextSpread * (nextRawSpeed >= 1 ? 1 : -1)
      return nextRawSpeed ** nextSpreadPower
    }

    static cubeAscensionSpeedEffect(loadout: Loadout) {
      if (!stats.oneMindUnlocked)
        return 1

      const nextSpeed = this.ascensionSpeed(loadout)
      const oldExponent = 1 + (stats.aSpeed >= 1 ? stats.aquariusExponent : 0)
      const nextExponent = 1 + (nextSpeed >= 1 ? stats.aquariusExponent : 0)
      return nextSpeed ** nextExponent / stats.aSpeed ** oldExponent
    }

    static octeractAscensionSpeedEffect(loadout: Loadout) {
      const nextSpeed = this.ascensionSpeed(loadout)
      const oldMind = stats.oneMindUnlocked && stats.aSpeed >= 1 ? stats.mind : 0.5
      const nextMind = stats.oneMindUnlocked && nextSpeed >= 1 ? stats.mind : 0.5

      return nextSpeed ** nextMind / stats.aSpeed ** oldMind
    }

    static infinityCubeShopEffect(loadout: Loadout, octeracts = false): number {
      const vouchers = loadout.getStat('vouchers')
      const freeCubeLevels = stats.exalt === 6 || stats.exalt === 8
        ? 0
        : loadout.effectiveLevel('ambrosiaFreeCubeUpgrades')
      const baseLevel = this.shopLevel('seasonPassInfinity')
      const nextLevel = this.shopLevel('seasonPassInfinity', { cubes: freeCubeLevels, infinity: vouchers })
      // SynergismOfficial/src/Statistics.ts: Octeracts receive both PassINF
      // globalCubeMult and its octeract-specific wowOcteractMult.
      const exponent = octeracts ? 2.25 : 1
      return 1.012 ** (exponent * (nextLevel - baseLevel))
        * this.panthemaMultiplier('cubes', freeCubeLevels, 0.005, loadout)
    }

    static freeCubeShopEffect(loadout: Loadout, octeracts = false): number {
      // SynergismOfficial/src/Shop.ts and Statistics.ts: free Cube group
      // levels change only bought shop upgrades, not their purchase caps.
      const freeCubeLevels = stats.exalt === 6 || stats.exalt === 8
        ? 0
        : loadout.effectiveLevel('ambrosiaFreeCubeUpgrades')
      if (freeCubeLevels <= 0) return 1
      const effectRatio = (key: string, coefficient: number, power = 1) => {
        const base = this.shopLevel(key)
        const next = this.shopLevel(key, { cubes: freeCubeLevels })
        return ((1 + coefficient * next) / (1 + coefficient * base)) ** power
      }
      const globalY = effectRatio('seasonPassY', 0.0075, octeracts ? 2 : 1)
      const globalZ = effectRatio('seasonPassZ', 0.01 * stats.rawSing, octeracts ? 2 : 1)
      if (octeracts) {
        return globalY * globalZ
          * effectRatio('seasonPass3', 0.015)
          * effectRatio('seasonPassLost', 0.001)
      }
      return globalY * globalZ * effectRatio('seasonPass', 0.0375)
    }

    static ambGeneration(level = 0, loadout: Loadout) {
      const coefficients = [0.01, 0.01, 0.01, 0.001]
      let speed = 1
      for (let index = 0; index < coefficients.length; index++) {
        const key = `shopAmbrosiaGeneration${index + 1}`
        const coefficient = coefficients[index]
        const baseLevel = this.shopLevel(key)
        const nextLevel = this.shopLevel(key, { ambrosiaGeneration: level })
        speed *= (1 + coefficient * nextLevel) / (1 + coefficient * baseLevel)
      }
      return speed * this.panthemaMultiplier('ambrosiaGeneration', level, 0.001, loadout)
    }

    static luckConversion(level = 0) {
      const divisors = [20, 20, 20, 100]
      const freeLevelMultipliers = [1, 1, 2, 3]
      let conversion = stats.shopRLuck.reduce(
        (result, value, index) => result + Math.floor(value / divisors[index]) * 0.01,
        stats.luckConversion
      )
      const levels = stats.shopRLuck.map((value, index) => value > 0 ? value + freeLevelMultipliers[index] * level : 0)
      conversion = levels.reduce(
        (result, value, index) => result - Math.floor(value / divisors[index]) * 0.01,
        conversion
      )
      return conversion
    }

    static rLuck(level = 0, loadout: Loadout) {
      let rLuck = stats.baseRLuck + Math.floor((loadout.luck - 100) / this.luckConversion(level))
      rLuck += stats.shopRLuck[0] > 0 ? level * 0.05 : 0
      rLuck += stats.shopRLuck[1] > 0 ? level * 0.075 : 0
      rLuck += stats.shopRLuck[2] > 0 ? level * 0.2 : 0 // Two free levels per group level
      rLuck += stats.shopRLuck[3] > 0 ? level * 0.6 : 0 // Three free levels per group level
      rLuck += this.panthemaAdditive('redAmbrosiaLuck', level, 0.05, loadout)
      return rLuck
    }

    static rSpeed(speed = 1) {
      return Math.min(speed, Math.sqrt(1000 * speed))
    }

    static shopQuark(level = 0, loadout: Loadout) {
      let base = (1 + 0.2 * Math.log2(1 + stats.qHept / 500))
      const vouchers = loadout.getStat('vouchers')
      let exponentDelta = 0
      for (let index = 1; index <= 4; index++) {
        const key = index === 1 ? 'improveQuarkHept' : `improveQuarkHept${index}`
        exponentDelta += 0.01 * (this.shopLevel(key, { quark: level }) - this.shopLevel(key))
      }
      exponentDelta += 0.0001 * (
        this.shopLevel('improveQuarkHept5', { quark: level, infinity: vouchers })
        - this.shopLevel('improveQuarkHept5')
      )

      return base ** exponentDelta * this.panthemaMultiplier('quark', level, 0.001, loadout)
    }

    static shopOfferingBaseDelta(offeringLevels: number, loadout: Loadout): number {
      const vouchers = loadout.getStat('vouchers')
      const baseLevel = this.shopLevel('offeringEX3')
      const nextLevel = this.shopLevel('offeringEX3', { offering: offeringLevels, infinity: vouchers })
      return Math.floor(nextLevel / 25) - Math.floor(baseLevel / 25)
    }

    static shopOfferingMultiplier(offeringLevels: number, loadout: Loadout): number {
      const vouchers = loadout.getStat('vouchers')
      const ratio = (
        key: string,
        effect: (level: number) => number,
        deltas: Partial<Record<keyof Stats['shopBonusLevels'], number>> = { offering: offeringLevels },
      ) =>
        effect(this.shopLevel(key, deltas)) / effect(this.shopLevel(key))
      let result = ratio('offeringEX', (n) => (1 + 0.1 * n) * 1.12 ** Math.floor(n / 10))
      result *= ratio('cashGrab', (n) => 1 + 0.0166 * n)
      result *= ratio('cashGrab2', (n) => 1 + 0.005 * n)
      result *= ratio('offeringEX2', (n) => 1 + 0.01 * n * stats.rawSing)
      result *= ratio('offeringEX3', (n) => 1.012 ** n, { offering: offeringLevels, infinity: vouchers })
      return result * this.panthemaMultiplier('offering', offeringLevels, 0.01, loadout)
    }

    static shopObtainiumMultiplier(obtainiumLevels: number, loadout: Loadout): number {
      const vouchers = loadout.getStat('vouchers')
      const ratio = (
        key: string,
        effect: (level: number) => number,
        deltas: Partial<Record<keyof Stats['shopBonusLevels'], number>> = { obtainium: obtainiumLevels },
      ) =>
        effect(this.shopLevel(key, deltas)) / effect(this.shopLevel(key))
      let result = ratio('obtainiumEX', (n) => (1 + 0.1 * n) * 1.12 ** Math.floor(n / 10))
      result *= ratio('cashGrab', (n) => 1 + 0.0166 * n)
      result *= ratio('cashGrab2', (n) => 1 + 0.005 * n)
      result *= ratio('obtainiumEX2', (n) => 1 + 0.01 * n * stats.rawSing)
      result *= ratio('obtainiumEX3', (n) => 1.012 ** n, { obtainium: obtainiumLevels, infinity: vouchers })
      result *= ratio('obtainiumEX3', (n) => 1.06 ** Math.floor(n / 25), { obtainium: obtainiumLevels, infinity: vouchers })
      return result * this.panthemaMultiplier('obtainium', obtainiumLevels, 0.01, loadout)
    }

}


// ===========================================================================
// upgrades object (mirrors sheet_script `upgrades` const)
// ===========================================================================

// Forward-declare so Upgrade instances can reference it
const upgrades: Record<string, Upgrade> = {};

const _runeOOMCostArray = Upgrade.ambrosiaRuneOOMBonusCost();

Object.assign(upgrades, {
    ambrosiaTutorial: new Upgrade({
      maxLevel: 10,
      cost: level => level * level,
      effects: {
        quark: (input, level) => input * (1 + 0.01 * level),
        cube: (input, level) => input * (1 + 0.05 * level),
        oct: (input, level) => input * (1 + 0.05 * level),
      }
    }),
    ambrosiaQuarks1: new Upgrade({
      maxLevel: 100,
      cost: level => level ** 3,
      effects: {
        quark: (input, level) => input * (1 + 0.01 * level)
      },
      row: 4,
      prerequisites: {
        ambrosiaTutorial: 10
      }
    }),
    ambrosiaCubes1: new Upgrade({
      maxLevel: 100,
      cost: level => level ** 3,
      effects: {
        cube: (input, level) => input * (1 + 0.05 * level) * 1.1 ** Math.floor(level / 5),
        oct: (input, level) => input * (1 + 0.05 * level) * 1.1 ** Math.floor(level / 5),
      },
      row: 3,
      prerequisites: {
        ambrosiaTutorial: 10
      }
    }),
    ambrosiaLuck1: new Upgrade({
      maxLevel: 100,
      cost: level => level ** 3,
      effects: {
        luck: (input, level) => input + 2 * level + 12 * Math.floor(level / 10)
      },
      row: 1,
      prerequisites: {
        ambrosiaTutorial: 10
      }
    }),
    ambrosiaQuarkCube1: new Upgrade({
      maxLevel: 25,
      cost: level => 250 * level ** 3,
      effects: {
        cube: (input, level) => input * (1 + 0.001 * Math.floor((Math.log10(stats.quarks + 1) + 1) ** 2) * level),
        oct: (input, level) => input * (1 + 0.001 * Math.floor((Math.log10(stats.quarks + 1) + 1) ** 2) * level),
      },
      row: 3,
      blueberryCost: 1,
      prerequisites: {
        ambrosiaCubes1: 30,
        ambrosiaQuarks1: 20
      }
    }),
    ambrosiaLuckCube1: new Upgrade({
      maxLevel: 25,
      cost: level => 250 * level ** 3,
      effects: {
        cube: (input, level, loadout) => input * (1 + 0.0005 * loadout.luck * level),
        oct: (input, level, loadout) => input * (1 + 0.0005 * loadout.luck * level)
      },
      row: 3,
      blueberryCost: 1,
      prerequisites: {
        ambrosiaCubes1: 30,
        ambrosiaLuck1: 20
      }
    }),
    ambrosiaCubeQuark1: new Upgrade({
      maxLevel: 25,
      cost: level => 500 * level ** 3,
      effects: {
        quark: (input, level) => input * (1 + 0.0001 * stats.cubeExp * level)
      },
      row: 4,
      blueberryCost: 1,
      prerequisites: {
        ambrosiaQuarks1: 30,
        ambrosiaCubes1: 20
      }
    }),
    ambrosiaLuckQuark1: new Upgrade({
      maxLevel: 25,
      cost: level => 500 * level ** 3,
      effects: {
        quark: (input, level, loadout) => input * (1 + 0.0001 * Math.min(loadout.luck, Math.sqrt(1000 * loadout.luck)) * level)
      },
      row: 4,
      blueberryCost: 1,
      prerequisites: {
        ambrosiaQuarks1: 30,
        ambrosiaLuck1: 20
      }
    }),
    ambrosiaCubeLuck1: new Upgrade({
      maxLevel: 25,
      cost: level => 100 * level ** 3,
      effects: {
        luck: (input, level) => input + 0.02 * stats.cubeExp * level
      },
      row: 1,
      blueberryCost: 1,
      prerequisites: {
        ambrosiaLuck1: 30,
        ambrosiaCubes1: 20
      }
    }),
    ambrosiaQuarkLuck1: new Upgrade({
      maxLevel: 25,
      cost: level => 100 * level ** 3,
      effects: {
        luck: (input, level) => input + 0.02 * Math.floor((Math.log10(stats.quarks + 1) + 1) ** 2) * level
      },
      row: 1,
      blueberryCost: 1,
      prerequisites: {
        ambrosiaLuck1: 30,
        ambrosiaQuarks1: 20
      }
    }),
    ambrosiaQuarks2: new Upgrade({
      maxLevel: 100,
      cost: level => 500 * level * level,
      effects: {
        quark: (input, level, loadout) => input * (1 + (0.01 + Math.floor(loadout.effectiveLevel("ambrosiaQuarks1") / 10) * 0.001) * level)
      },
      row: 4,
      blueberryCost: 1,
      prerequisites: {
        ambrosiaQuarks1: 40
      }
    }),
    ambrosiaCubes2: new Upgrade({
      maxLevel: 100,
      cost: level => 500 * level * level,
      effects: {
        cube: (input, level, loadout) => input * (1 + (0.1 + 0.01 * Math.floor(loadout.effectiveLevel("ambrosiaCubes1") / 10)) * level) * 1.15 ** Math.floor(level / 5),
        oct: (input, level, loadout) => input * (1 + (0.1 + 0.01 * Math.floor(loadout.effectiveLevel("ambrosiaCubes1") / 10)) * level) * 1.15 ** Math.floor(level / 5),
      },
      row: 3,
      blueberryCost: 1,
      prerequisites: {
        ambrosiaCubes1: 40
      }
    }),
    ambrosiaLuck2: new Upgrade({
      maxLevel: 100,
      cost: level => 250 * level * level,
      effects: {
        luck: (input, level, loadout) => input + (3 + 0.3 * Math.floor(loadout.effectiveLevel("ambrosiaLuck1") / 10)) * level + 40 * Math.floor(level / 10)
      },
      row: 1,
      blueberryCost: 1,
      prerequisites: {
        ambrosiaLuck1: 40
      }
    }),
    ambrosiaQuarks3: new Upgrade({
      maxLevel: 10,
      cost: level => (725000 + 25000 * level) * level,
      effects: {
        quark: (input, level, loadout) => input * (1 + 0.05 * (1 + 0.01 * loadout.effectiveLevel("ambrosiaQuarks2")) * level)
      },
      row: 4,
      blueberryCost: 3,
      prerequisites: {
        ambrosiaQuarks1: 100,
        ambrosiaQuarks2: 50
      }
    }),
    ambrosiaQuarks4: new Upgrade({
      maxLevel: 100,
      cost: level => 300_000 * level,
      effects: {
        quark: (input, level) => input * (1 + level / 100)
      },
      row: 4,
      blueberryCost: 5,
      prerequisites: {
        ambrosiaQuarks3: 10
      },
      requiresExalt9: true
    }),
    ambrosiaCubes3: new Upgrade({
      maxLevel: 100,
      cost: level => (72500 + 2500 * level) * level,
      effects: {
        cube: (input, level, loadout) => input * (1 + 0.2 * (1 + 0.03 * loadout.effectiveLevel("ambrosiaCubes2")) * level) * 1.2 ** Math.floor(level / 5),
        oct: (input, level, loadout) => input * (1 + 0.2 * (1 + 0.03 * loadout.effectiveLevel("ambrosiaCubes2")) * level) * 1.2 ** Math.floor(level / 5),
      },
      row: 3,
      blueberryCost: 3,
      prerequisites: {
        ambrosiaCubes1: 100,
        ambrosiaCubes2: 50
      }
    }),
    ambrosiaCubes4: new Upgrade({
      maxLevel: 50,
      cost: level => (290_000 + 10_000 * level) * level,
      effects: {
        cube: (input, level) => input * (1 + level / 100) * 1.3 ** Math.floor(level / 5),
        oct: (input, level) => input * (1 + level / 100) * 1.3 ** Math.floor(level / 5),
      },
      row: 3,
      blueberryCost: 5,
      prerequisites: {
        ambrosiaCubes3: 100
      },
      requiresExalt9: true
    }),
    ambrosiaFreeCubeUpgrades: new Upgrade({
      maxLevel: 30,
      cost: level => 10_000 * level * level,
      row: 3,
      blueberryCost: 2,
      prerequisites: {
        ambrosiaCubes2: 100
      }
    }),
    ambrosiaLuck3: new Upgrade({
      maxLevel: 100,
      cost: level => 50000 * level,
      effects: {
        luck: (input, level) => input + stats.blueberries * level
      },
      row: 1,
      blueberryCost: 3,
      prerequisites: {
        ambrosiaLuck1: 90,
        ambrosiaLuck2: 50
      }
    }),
    ambrosiaLuck4: new Upgrade({
      maxLevel: 50,
      cost: level => (240000 + 10000 * level) * level,
      effects: {
        mLuck: (input, level) => input + 0.0001 * stats.lifetimeAmbExp * level
      },
      row: 1,
      blueberryCost: 5,
      prerequisites: {
        ambrosiaLuck3: 100
      },
      requiresExalt9: true
    }),
    ambrosiaPatreon: new Upgrade({
      maxLevel: 1,
      cost: level => level,
      effects: {
        speed: (input, level) => input * (1 + stats.patreon * level),
        rSpeed: (input, level) => input * (1 + stats.patreon * level)
      }
    }),
    ambrosiaObtainium1: new Upgrade({
      maxLevel: 2,
      cost: level => 50000 * (25 ** level - 1) / 24,
      effects: {
        mObt: (input, level, loadout) => input * (1 + 0.001 * loadout.luck * level)
      },
      blueberryCost: 1
    }),
    ambrosiaOffering1: new Upgrade({
      maxLevel: 2,
      cost: level => 50000 * (25 ** level - 1) / 24,
      effects: {
        mOff: (input, level, loadout) => input * (1 + 0.001 * loadout.luck * level)
      },
      blueberryCost: 1
    }),
    ambrosiaHyperflux: new Upgrade({
      maxLevel: 7,
      cost: level => ([0, 33333, 99999, 199998, 333330, 499995, 999990, 2499975])[level],
      effects: {
        cube: (input, level, _, p4x4 = 50) => input * (1 + 0.01 * level) ** p4x4
      },
      blueberryCost: 3
    }),
    ambrosiaBaseOffering1: new Upgrade({
      maxLevel: 40,
      cost: level => 5 * level ** 3,
      effects: {
        off: (input, level) => input + level
      },
      row: 2,
      blueberryCost: 0
    }),
    ambrosiaBaseObtainium1: new Upgrade({
      maxLevel: 20,
      cost: level => 40 * level ** 3,
      effects: {
        obt: (input, level) => input + level,
      },
      row: 2,
      blueberryCost: 0
    }),
    ambrosiaBaseOffering2: new Upgrade({
      maxLevel: 60,
      cost: level => 20 * level ** 3,
      effects: {
        off: (input, level) => input + level,
      },
      row: 2,
      blueberryCost: 1,
      prerequisites: {
        ambrosiaBaseOffering1: 30
      }
    }),
    ambrosiaBaseObtainium2: new Upgrade({
      maxLevel: 30,
      cost: level => 160 * level ** 3,
      effects: {
        obt: (input, level) => input + level
      },
      row: 2,
      blueberryCost: 1,
      prerequisites: {
        ambrosiaBaseObtainium1: 15
      }
    }),
    ambrosiaFreeObtainiumUpgrades: new Upgrade({
      maxLevel: 50,
      cost: level => 4000 * level * level,
      row: 2,
      blueberryCost: 2,
      prerequisites: {
        ambrosiaBaseObtainium1: 20,
        ambrosiaBaseObtainium2: 30
      },
      requiresExalt9: true
    }),
    ambrosiaFreeOfferingUpgrades: new Upgrade({
      maxLevel: 50,
      cost: level => 4000 * level * level,
      row: 2,
      blueberryCost: 2,
      prerequisites: {
        ambrosiaBaseOffering1: 30,
        ambrosiaBaseOffering2: 60
      },
      requiresExalt9: true
    }),
    ambrosiaSingReduction1: new Upgrade({
      maxLevel: 2,
      cost: level => 1e5 * (99 ** level - 1) / 98,
      effects: {
        cube: (input, level) => stats.exalt > 0 || stats.postAoAG ? input : input * Upgrade.singDebuff(stats.sing, "cube") / Upgrade.singDebuff(stats.sing - level, "cube"),
        mOff: (input, level) => stats.exalt > 0 || stats.postAoAG ? input : input * Upgrade.singDebuff(stats.sing, "mOff") / Upgrade.singDebuff(stats.sing - level, "mOff"),
        mObt: (input, level) => stats.exalt > 0 || stats.postAoAG ? input : input * Upgrade.singDebuff(stats.sing, "mOff") / Upgrade.singDebuff(stats.sing - level, "mOff"),
        singReduction: (input, level) => stats.exalt > 0 || stats.postAoAG ? input : input + level
      },
      blueberryCost: 2,
      prerequisites: {
        ambrosiaHyperflux: 4
      }
    }),
    ambrosiaInfiniteShopUpgrades1: new Upgrade({
      maxLevel: 20,
      cost: level => 25000 * level,
      effects: {
        vouchers: (input, level) => stats.exalt === 4 ? input : input + level
      },
      row: 2,
      blueberryCost: 1,
      prerequisites: {
        ambrosiaCubes1: 70,
        ambrosiaBaseOffering1: 20,
        ambrosiaBaseObtainium1: 10
      }
    }),
    ambrosiaInfiniteShopUpgrades2: new Upgrade({
      maxLevel: 20,
      cost: level => 75000 * level,
      effects: {
        vouchers: (input, level) => stats.exalt === 4 ? input : input + level
      },
      row: 2,
      blueberryCost: 2,
      prerequisites: {
        ambrosiaInfiniteShopUpgrades1: 20
      }
    }),
    ambrosiaInfiniteShopUpgrades3: new Upgrade({
      maxLevel: 20,
      cost: level => 500000 * level,
      effects: {
        vouchers: (input, level) => stats.exalt === 4 ? input : input + level
      },
      row: 2,
      blueberryCost: 3,
      prerequisites: {
        ambrosiaInfiniteShopUpgrades2: 20
      },
      requiresExalt9: true
    }),
    ambrosiaSingReduction2: new Upgrade({
      maxLevel: 2,
      cost: level => 1.25e7 * (3 ** level - 1) / 2,
      effects: {
        cube: (input, level) => stats.exalt > 0 && !stats.postAoAG ? input * Upgrade.singDebuff(stats.sing, "cube") / Upgrade.singDebuff(stats.sing - level, "cube") : input,
        mOff: (input, level) => stats.exalt > 0 && !stats.postAoAG ? input * Upgrade.singDebuff(stats.sing, "mOff") / Upgrade.singDebuff(stats.sing - level, "mOff") : input,
        mObt: (input, level) => stats.exalt > 0 && !stats.postAoAG ? input * Upgrade.singDebuff(stats.sing, "mOff") / Upgrade.singDebuff(stats.sing - level, "mOff") : input,
        singReduction: (input, level) => stats.exalt > 0 && !stats.postAoAG ? input + level : input
      },
      blueberryCost: 4,
      ignoresExalt: true
    }),
    ambrosiaTalismanBonusRuneLevel: new Upgrade({
      maxLevel: 100,
      cost: level => 100 * level * level,
      effects: {
        // Its effect is applied together with ambrosiaRuneOOMBonus below.
        cube: (input) => input,
        quark: (input) => input,
        mObt: (input) => input,
        mOff: (input) => input
      },
      row: 2
    }),
    ambrosiaRuneOOMBonus: new Upgrade({
      maxLevel: 100,
      costArray: _runeOOMCostArray,
      cost: level => _runeOOMCostArray[level] ?? 0,
      effects: {
        cube: (input, level, loadout) => input * (1 + 0.01 * Upgrade.runeLevelIA(0.001 * level, 0.005 * loadout.effectiveLevel("ambrosiaTalismanBonusRuneLevel"))) / stats.baseIACube,
        quark: (input, level, loadout) => {
          const runeLevel = Upgrade.runeLevelIA(0.001 * level, 0.005 * loadout.effectiveLevel("ambrosiaTalismanBonusRuneLevel"))
          const runeEffect = 1 + 0.002 * runeLevel + (runeLevel > 0 ? 0.1 : 0)
          return input * runeEffect / stats.baseIAQuark
        },
        mObt: (input, level, loadout) => input
          * (1 + Upgrade.runeLevelSI(level, 0.005 * loadout.effectiveLevel("ambrosiaTalismanBonusRuneLevel")) / 200)
          / (1 + stats.baseSI / 200),
        mOff: (input, level, loadout) => input
          * (1 + Upgrade.runeLevelSI(level, 0.005 * loadout.effectiveLevel("ambrosiaTalismanBonusRuneLevel")) / 2000)
          / (1 + stats.baseSI / 2000)
      },
      row: 2
    }),
    ambrosiaBrickOfLead: new Upgrade({
      maxLevel: 25,
      cost: level => 10 * level ** 3,
      effects: {
        mLuck: (input, level) => input + 0.02 * level
      },
      blueberryCost: 4
    }),
    ambrosiaFreeLuckUpgrades: new Upgrade({
      maxLevel: 25,
      cost: level => 5000 * level * level,
      effects: {
        luck: (input, level, loadout) => stats.exalt === 4
          ? input
          : input + stats.shopLuck * level + Upgrade.panthemaAdditive('ambrosiaLuck', level, 0.2, loadout)
      },
      row: 1,
      blueberryCost: 1
    }),
    ambrosiaFreeGenerationUpgrades: new Upgrade({
      maxLevel: 5,
      cost: level => 5000 * (4 ** level - 1),
      effects: {
        speed: (input, level, loadout) => stats.exalt === 4 ? input : input * Upgrade.ambGeneration(level, loadout),
        // SynergismOfficial/src/Statistics.ts:
        // allRedAmbrosiaGenerationSpeedStats does not use the blue
        // Ambrosia-generation shop upgrades.
      },
      row: 1,
      blueberryCost: 1
    }),
    ambrosiaFreeRedLuckUpgrades: new Upgrade({
      maxLevel: 40,
      cost: level => 10000 * level * level,
      effects: {
        rLuck: (input, level, loadout) => input + (Upgrade.rLuck(level, loadout) - Upgrade.rLuck(0, loadout)) * (stats.exalt !== 4 ? 1 : 0)
      },
      row: 1,
      blueberryCost: 2,
      prerequisites: {
        ambrosiaFreeLuckUpgrades: 10
      }
    }),
    ambrosiaFreeQuarkUpgrades: new Upgrade({
      maxLevel: 10,
      cost: level => 25000 * level ** 3,
      effects: {
        // SynergismOfficial/BlueberryUpgrades.ts: each effective Ambrosia
        // level grants one tenth of a Quark-shop bonus level.
        quark: (input, level, loadout) => stats.exalt === 4 ? input : input * Upgrade.shopQuark(level / 10, loadout)
      },
      row: 4,
      blueberryCost: 2
    }),
    twoMind: new Upgrade({
      maxLevel: 1,
      cost: () => 0,
      blueberryCost: 8,
      requiresExalt9: true
    })
});

// Red upgrades (used only for cap checks in the optimizer loop)
const redUpgrades: Record<string, Upgrade> = {
    regularLuck:  new Upgrade({ maxLevel: 100  }),
    blueberries:  new Upgrade({ maxLevel: 5    }),
    viscount:     new Upgrade({ maxLevel: 1    }),
    regularLuck2: new Upgrade({ maxLevel: 250  }),
};

// Most loadouts evaluate the same stat repeatedly.  Iterating every upgrade
// for every candidate made the optimizer spend the majority of its time
// checking undefined effect handlers.  These compact lists preserve the game
// formula order while visiting only upgrades that can affect the requested
// stat.
const upgradeEffectKeys: Record<string, string[]> = {};
for (const [upgradeName, upgrade] of Object.entries(upgrades)) {
  for (const effectName of Object.keys(upgrade.effects))
    (upgradeEffectKeys[effectName] ??= []).push(upgradeName)
}

// The upgrade key order is fixed by the table above and is reused for
// prerequisite bookkeeping below.
const upgradeKeyOrder = Object.keys(upgrades);

// Reverse prerequisite map used when a blueberry repair removes a module.
// Removing a prerequisite must also remove every dependent module; otherwise
// the repaired candidate would retain orphaned levels that the game cannot
// actually purchase.
const dependentUpgrades: Record<string, string[]> = {};
for (const upgradeName of upgradeKeyOrder) {
  for (const prerequisite of Object.keys(upgrades[upgradeName].prerequisites))
    (dependentUpgrades[prerequisite] ??= []).push(upgradeName)
}


// ===========================================================================
// Loadout class
// ===========================================================================

class Loadout {

    upgradeLevels: Record<string, number>;
    private costCache:  number | null;
    private blueberryCostCache: number | null;
    private statCache:  Record<string, number>;

    constructor(loadout?: Loadout) {
        this.upgradeLevels = {};
        if (loadout !== undefined) {
            Object.assign(this.upgradeLevels, loadout.upgradeLevels);
        }
        this.upgradeLevels.ambrosiaPatreon = 1; // Always buy 1 level of ambrosiaPatreon
        this.costCache = null;
        this.blueberryCostCache = null;
        this.statCache = {};
    }

    // Returns cost of a specific upgrade in the loadout
    getCost(upgrade: string): number {
        return upgrades[upgrade].cost(this.upgradeLevels[upgrade] ?? 0);
    }

    // Returns total cost of the entire loadout
    get cost(): number {
        if (this.costCache === null) {
            this.costCache = 0;
            for (const upgrade in this.upgradeLevels)
                this.costCache += this.getCost(upgrade);
        }
        return this.costCache;
    }

    // Returns total blueberry cost of the entire loadout
    get blueberryCost(): number {
        if (this.blueberryCostCache !== null)
            return this.blueberryCostCache;

        let result = 0;
        for (const upgrade in this.upgradeLevels)
            if ((this.upgradeLevels[upgrade] ?? 0) > 0)
                result += Math.max(
                    0,
                    (upgrades[upgrade]?.blueberryCost ?? 0)
                        - (stats.ambrosiaUpgradeBlueberryCostReductions[upgrade] ?? 0)
                );
        this.blueberryCostCache = result;
        return result;
    }

    invalidateCaches(): void {
        this.costCache = null;
        this.blueberryCostCache = null;
        this.statCache = {};
    }

    setCachedStat(stat: string, value: number): void {
        this.statCache[stat] = value;
    }

    setCachedCosts(cost: number, blueberryCost: number): void {
        this.costCache = cost;
        this.blueberryCostCache = blueberryCost;
    }

    // Returns effective level of an upgrade that accounts for bonus levels
    effectiveLevel(upgrade: string): number {
        if (upgrades[upgrade]?.requiresExalt9 && !stats.exalt9Unlocked)
            return 0;
        let level = this.upgradeLevels[upgrade] ?? 0;
        if (upgrade === "ambrosiaTutorial")
            level += stats.tutorialBonus;
        level += stats.bonus[upgrades[upgrade]?.row ?? 0] ?? 0;
        if ((this.upgradeLevels[upgrade] ?? 0) > 0)
            level += stats.ambrosiaUpgradeBonusLevels[upgrade] ?? 0;
        return level;
    }

    // Returns effect of a specific upgrade in the loadout
    getEffect(input: number, upgrade: string, effect: keyof UpgradeEffectMap): number {
        const upgradeData = upgrades[upgrade];
        if (!upgradeData
            || (upgradeData.requiresExalt9 && !stats.exalt9Unlocked)
            || (!upgradeData.ignoresExalt && (stats.exalt === 6 || stats.exalt === 8)))
            return input;
        const fn = upgradeData.effects[effect] as ((input: number, level: number, loadout: Loadout) => number) | undefined;
        if (fn !== undefined)
            return fn(input, this.effectiveLevel(upgrade), this);
        return input;
    }

    get luck(): number {
        return this.getStat("luck");
    }

    get twoMindEnabled(): boolean {
        return stats.exalt9Unlocked
            && stats.exalt !== 6
            && stats.exalt !== 8
            && (this.upgradeLevels.twoMind ?? 0) > 0;
    }

    // Returns the total value of a given stat for the loadout
    getStat(stat: string, override = false): number {
      if (this.statCache[stat] == null || override) {
        this.statCache[stat] = stat === "mLuck" ? stats.baseMLuck : 1
        switch (stat) {
          case "luck":
            const unassignedBlueberries = stats.blueberries - this.blueberryCost
            let luck = stats.baseLuck
              + (unassignedBlueberries >= 5 ? unassignedBlueberries * stats.purpleLeoLevel : 0)
            for (const upgrade of upgradeEffectKeys.luck ?? [])
              luck = this.getEffect(luck, upgrade, "luck")
            this.statCache[stat] = luck * (1 + this.getStat("mLuck"))
            break
          case "ambOct":
            this.statCache[stat] = this.getStat("allAmb") * this.getStat("oct")
            break
          case "amb":
            const brickLevel = stats.exalt === 6 || stats.exalt === 8
              ? 0
              : this.effectiveLevel("ambrosiaBrickOfLead")
            const brickBarSpeed = 1 - brickLevel / 50
            // SynergismOfficial/src/BlueberryUpgrades.ts ambrosiaBrickOfLead
            // and Calculate.ts calculateRequiredBlueberryTime: Brick changes
            // the reciprocal point requirement, not point generation speed.
            // Two Mind scales reward luck to preserve the luck-based gain
            // rate; its fixed bar still changes the flat Exalt 5 bonus rate.
            const brickRequirement = stats.exalt === 10
              ? stats.blueBarMaxWithoutTwoMindAndBrick
              : stats.amb >= 10_000
                ? Math.ceil(stats.blueBarRequirementBeforeRounding / brickBarSpeed)
                : stats.blueBarRequirementBeforeRounding / brickBarSpeed
            const requirementRatio = stats.blueBarMaxWithoutTwoMindAndBrick / brickRequirement
            // SynergismOfficial/src/Calculate.ts: TWO MIND fixes the blue
            // bar at 10,000,000 points.  The luck-derived part is adjusted
            // by calculateBarRewardLuck and therefore cancels against the
            // shorter bar; the fixed Exalt-5 reward does not, so it needs
            // the actual fixed-bar ratio here.
            const flatBonusRatio = this.twoMindEnabled
              ? stats.blueBarMaxWithoutTwoMindAndBrick / 10_000_000
              : requirementRatio
            this.statCache[stat] = (this.luck / 100 * requirementRatio
              + stats.bonusAmbrosiaPerFill * flatBonusRatio)
              * this.getStat("speed")
            break
          case "rLuck":
            this.statCache[stat] = Upgrade.rLuck(this.effectiveLevel("ambrosiaFreeRedLuckUpgrades"), this)
            break
          case "rAmb":
            // The Two Mind reward-luck/bar-size factors also cancel for
            // Red Ambrosia, which has no separate flat per-fill bonus.
            this.statCache[stat] = this.getStat("rLuck") / 100
              * this.getStat("rSpeed")
            break
          case "allAmb":
            this.statCache[stat] = this.getStat("amb") * this.getStat("rAmb")
            break
          case "mOff":
            for (const upgrade of upgradeEffectKeys.mOff ?? [])
              this.statCache[stat] = this.getEffect(this.statCache[stat], upgrade, "mOff")
            if (stats.exalt !== 4)
              this.statCache[stat] *= Upgrade.shopOfferingMultiplier(
                this.effectiveLevel('ambrosiaFreeOfferingUpgrades'), this
              )
            break
          case "mObt":
            for (const upgrade of upgradeEffectKeys.mObt ?? [])
              this.statCache[stat] = this.getEffect(this.statCache[stat], upgrade, "mObt")
            if (stats.exalt !== 4)
              this.statCache[stat] *= Upgrade.shopObtainiumMultiplier(
                this.effectiveLevel('ambrosiaFreeObtainiumUpgrades'), this
              )
            break
          case "off":
            let off = stats.baseOff
            for (const upgrade of upgradeEffectKeys.off ?? [])
              off = this.getEffect(off, upgrade, "off")
            if (stats.exalt !== 4)
              off += Upgrade.shopOfferingBaseDelta(this.effectiveLevel('ambrosiaFreeOfferingUpgrades'), this)
            this.statCache[stat] = off * this.getStat("mOff")
            break
          case "obt":
            let obt = stats.baseObt
            for (const upgrade of upgradeEffectKeys.obt ?? [])
              obt = this.getEffect(obt, upgrade, "obt")
            this.statCache[stat] = obt * this.getStat("mObt")
            break
          case "singReduction":
          case "vouchers":
            // Free Infinity-shop levels are part of the exported baseline;
            // purchased voucher upgrades add on top of them.
            this.statCache[stat] = stat === "vouchers" ? stats.voucher : 0
          default:
            for (const upgrade of upgradeEffectKeys[stat] ?? [])
              this.statCache[stat] = this.getEffect(this.statCache[stat], upgrade, stat as keyof UpgradeEffectMap)
            if (stat === 'cube')
              this.statCache[stat] *= Upgrade.freeCubeShopEffect(this)
                * Upgrade.infinityCubeShopEffect(this) * Upgrade.cubeAscensionSpeedEffect(this)
            else if (stat === 'oct')
              this.statCache[stat] *= Upgrade.freeCubeShopEffect(this, true)
                * Upgrade.infinityCubeShopEffect(this, true) * Upgrade.octeractAscensionSpeedEffect(this)
        }
      }
      return this.statCache[stat]
    }

    // Recursively sets levels of all upgrades to produce a valid loadout
    satisfyPrerequisites(): void {
      let changed = false
      const ensure = (upgradeName: string): void => {
        const upgrade = upgrades[upgradeName]
        if (!upgrade || (this.upgradeLevels[upgradeName] ?? 0) <= 0)
          return
        for (const prerequisite in upgrade.prerequisites) {
          const required = upgrade.prerequisites[prerequisite] ?? 0
          if ((this.upgradeLevels[prerequisite] ?? 0) < required) {
            this.upgradeLevels[prerequisite] = required
            changed = true
            ensure(prerequisite)
          }
        }
      }
      for (const upgradeName of Object.keys(this.upgradeLevels))
        ensure(upgradeName)
      if (changed)
        this.invalidateCaches()
    }

    fixBlueberryUpgrades(): void {

      if (this.blueberryCost <= stats.blueberries)
        return

      const removeUpgrade = (upgradeName: string): void => {
        if ((this.upgradeLevels[upgradeName] ?? 0) <= 0)
          return
        this.upgradeLevels[upgradeName] = 0
        for (const dependent of dependentUpgrades[upgradeName] ?? []) {
          const required = upgrades[dependent].prerequisites[upgradeName] ?? 0
          if ((this.upgradeLevels[upgradeName] ?? 0) < required)
            removeUpgrade(dependent)
        }
      }

      switch (this.blueberryCost - stats.blueberries) {
        case 9:
        case 10:
          removeUpgrade("ambrosiaInfiniteShopUpgrades1")
          removeUpgrade("ambrosiaBaseObtainium1")
          removeUpgrade("ambrosiaBaseOffering1")
        case 6:
        case 7:
          removeUpgrade("ambrosiaInfiniteShopUpgrades2")
          removeUpgrade("ambrosiaBaseObtainium2")
          removeUpgrade("ambrosiaBaseOffering2")
      }
      this.invalidateCaches()
      if (this.blueberryCost - stats.blueberries === 1)
        removeUpgrade("ambrosiaFreeLuckUpgrades")
      this.invalidateCaches()

      // Remove the weakest/most expensive upgrades first
      if (this.blueberryCost > stats.blueberries) { // This frees 6 blueberries
        removeUpgrade("ambrosiaLuck4") // This frees 5 blueberries
        this.invalidateCaches()
        if (this.blueberryCost - stats.blueberries === 1)
          removeUpgrade("ambrosiaFreeLuckUpgrades")
        this.invalidateCaches()
      }

      if (this.blueberryCost > stats.blueberries) { // This frees 6 blueberries
        removeUpgrade("ambrosiaInfiniteShopUpgrades2")
        removeUpgrade("ambrosiaBaseObtainium2")
        removeUpgrade("ambrosiaBaseOffering2")
        this.invalidateCaches()
        if (this.blueberryCost - stats.blueberries === 1)
          removeUpgrade("ambrosiaFreeLuckUpgrades")
        this.invalidateCaches()
      }

      if (this.blueberryCost > stats.blueberries) { // This frees 3 blueberries
        removeUpgrade("ambrosiaInfiniteShopUpgrades1")
        removeUpgrade("ambrosiaBaseObtainium1")
        removeUpgrade("ambrosiaBaseOffering1")
        if (this.blueberryCost > stats.blueberries)
          removeUpgrade("ambrosiaFreeLuckUpgrades")
        this.invalidateCaches()
      }

      // The older repair rules above predate the Exalt 9 modules.  A merged
      // candidate can therefore still exceed the blueberry budget after all
      // of those rules have run (for example, Quarks 4 + Cubes 4 + Two Mind).
      // Keep the established priority order, then use a deterministic safety
      // pass so every loadout returned by findOpt is affordable.  Purple
      // blueberry-cost reductions are included by blueberryCost, so this only
      // removes a module when its effective cost is still positive.
      for (const upgradeToRemove of blueberryRemovalOrder) {
        if (this.blueberryCost <= stats.blueberries)
          break
        if ((this.upgradeLevels[upgradeToRemove] ?? 0) <= 0)
          continue
        removeUpgrade(upgradeToRemove)
        this.invalidateCaches()
      }

      this.invalidateCaches()

    }

    get format(): string {
        let upgradeLevels: Record<string, number> = {}
        for (let upgrade in upgrades)
            if ((this.upgradeLevels[upgrade] ?? 0) > 0)
                upgradeLevels[upgrade] = this.upgradeLevels[upgrade]
        return JSON.stringify(upgradeLevels)
    }

    generateOutput(stat: string = "", maxLoadout: Loadout, p4x4: number | null = null): HeaterResultRow {

        this.invalidateCaches()
        if (this.cost > stats.amb || stat === "")
            return ["Unaffordable", null, "N / A", "N / A", "N / A", "N / A", false];

        let baseLoadout = new Loadout();
        let effectStr: string;
        if (stat === "singReduction" || stat === "vouchers")
          effectStr = formatNumber(this.getStat(stat) - baseLoadout.getStat(stat))
        else
          effectStr = formatNumber(this.getStat(stat) / baseLoadout.getStat(stat))

        return [
            this.format,
            null,
            this.blueberryCost,
            this.cost,
            effectStr,
            (p4x4 === null) ? "" : (p4x4 > 50 ? "Never" : p4x4),
            this.getStat(stat) >= maxLoadout.getStat(stat),
        ];

    }

    // Combines upgrades from both loadouts
    static union(loadout1: Loadout, loadout2: Loadout): Loadout {
        let result = new Loadout(loadout1);
        // Both inputs are already valid loadouts.  Adding only the increments
        // that are actually introduced by the second side is equivalent to
        // recomputing the max-level cost, but avoids rescanning every upgrade
        // key when the merged candidate is checked by a table or findOpt.
        let cost = loadout1.cost;
        let blueberryCost = loadout1.blueberryCost;
        for (let upgrade in loadout2.upgradeLevels) {
            const oldLevel = result.upgradeLevels[upgrade] ?? 0;
            const newLevel = Math.max(oldLevel, loadout2.upgradeLevels[upgrade]);
            if (newLevel <= oldLevel)
                continue;
            result.upgradeLevels[upgrade] = newLevel;
            cost += upgrades[upgrade].cost(newLevel) - upgrades[upgrade].cost(oldLevel);
            if (oldLevel <= 0)
                blueberryCost += Math.max(
                  0,
                  upgrades[upgrade].blueberryCost
                    - (stats.ambrosiaUpgradeBlueberryCostReductions[upgrade] ?? 0),
                );
        }
        result.setCachedCosts(cost, blueberryCost);
        return result;
    }

}


// ===========================================================================
// Table helpers (mirrors sheet_script trimTable/generateTable/mergeTables/findOpt)
// ===========================================================================

// Removes suboptimal loadouts from the table
function trimTable(table: Loadout[], stat: string): Loadout[] {
    if (table.length === 0)
      return [new Loadout()]

    // If every candidate consumes the same number of blueberries, the second
    // resource cannot affect dominance and the cheaper one-dimensional trim is
    // exact.  This is common for the independent rune/chain tables.
    const firstBerry = table[0].blueberryCost
    if (table.every(loadout => loadout.blueberryCost === firstBerry)) {
      table.sort((left, right) => left.cost === right.cost
        ? right.getStat(stat) - left.getStat(stat)
        : left.cost - right.cost)
      const simple: Loadout[] = [table[0]]
      let last = 0
      for (let index = 1; index < table.length; index++) {
        if (table[index].getStat(stat) > table[last].getStat(stat)) {
          last = index
          simple.push(table[index])
        }
      }
      return simple
    }

    // Blueberries are a second independent resource.  A stat-only trim can
    // discard a slightly weaker/cheaper candidate that uses fewer berries,
    // after which a later merge incorrectly reports a loadout as unaffordable
    // and leaves a large part of the Ambrosia budget unused.  Keep the full
    // three-dimensional Pareto frontier (cost, blueberries, stat).
    const berryValues = [...new Set(table.map(loadout => loadout.blueberryCost))].sort((left, right) => left - right)
    const berryIndices = new Map(berryValues.map((value, index) => [value, index + 1]))
    const berryIndex = (value: number): number => berryIndices.get(value) ?? 0
    const tree = new Array<number>(berryValues.length + 1).fill(-Infinity)
    const query = (index: number): number => {
      let result = -Infinity
      while (index > 0) {
        result = Math.max(result, tree[index])
        index -= index & -index
      }
      return result
    }
    const update = (index: number, value: number): void => {
      while (index < tree.length) {
        tree[index] = Math.max(tree[index], value)
        index += index & -index
      }
    }

    type TrimEntry = Loadout & { __trimStat: number; __trimCost: number; __trimBerry: number }
    for (const loadout of table) {
      const entry = loadout as TrimEntry
      entry.__trimStat = loadout.getStat(stat)
      entry.__trimCost = loadout.cost
      entry.__trimBerry = loadout.blueberryCost
    }
    table.sort((left, right) => {
      const a = left as TrimEntry
      const b = right as TrimEntry
      return a.__trimCost - b.__trimCost
        || b.__trimStat - a.__trimStat
        || a.__trimBerry - b.__trimBerry
    })

    const result: Loadout[] = []
    for (const loadout of table) {
      const entry = loadout as TrimEntry
      const index = berryIndex(entry.__trimBerry)
      if (query(index) >= entry.__trimStat)
        continue
      result.push(loadout)
      update(index, entry.__trimStat)
    }
    const trimmed = result.length > 0 ? result : [new Loadout()]
    return trimmed
}

// Trims a dependent upgrade chain without throwing away a loadout that can
// unlock a stronger later tier.  A normal stat-only Pareto trim is unsafe for
// chains such as Cubes I -> II -> III because a slightly weaker Cubes-I
// candidate may still have the higher prerequisite level needed by Cubes II.
// Since all future effects are monotone in the prerequisite level, a candidate
// is removable only when an earlier (no more expensive) candidate has both a
// higher stat and an equal-or-higher raw level of the dependency upgrade.
function trimTableWithDependency(table: Loadout[], stat: string, dependency: string): Loadout[] {
    if (table.length === 0)
      return [new Loadout()]

    const maxDependency = upgrades[dependency]?.maxLevel ?? 0
    const berryValues = [...new Set(table.map(loadout => loadout.blueberryCost))].sort((left, right) => left - right)
    const berryIndices = new Map(berryValues.map((value, index) => [value, index + 1]))
    const berryIndex = (value: number): number => berryIndices.get(value) ?? 0
    // A segment tree over dependency levels, with a Fenwick prefix-max tree
    // at each segment node, answers "any higher dependency level using no more
    // berries" in O(log(levels) log(berries)) instead of scanning every level
    // for every candidate.  This matters for the 100x100 rune tables.
    let treeSize = 1
    while (treeSize < maxDependency + 1) treeSize <<= 1
    const trees = Array.from(
      { length: 2 * treeSize },
      () => new Array<number>(berryValues.length + 1).fill(-Infinity),
    )
    const queryBerry = (tree: number[], index: number): number => {
      let result = -Infinity
      while (index > 0) {
        result = Math.max(result, tree[index])
        index -= index & -index
      }
      return result
    }
    const updateBerry = (tree: number[], index: number, value: number): void => {
      while (index < tree.length) {
        tree[index] = Math.max(tree[index], value)
        index += index & -index
      }
    }
    const queryLevels = (minimumLevel: number, berryPrefix: number): number => {
      let left = treeSize + minimumLevel
      let right = treeSize + maxDependency + 1
      let result = -Infinity
      while (left < right) {
        if (left & 1) result = Math.max(result, queryBerry(trees[left++], berryPrefix))
        if (right & 1) result = Math.max(result, queryBerry(trees[--right], berryPrefix))
        left >>= 1
        right >>= 1
      }
      return result
    }
    const updateLevel = (level: number, berryPrefix: number, value: number): void => {
      let node = treeSize + level
      while (node > 0) {
        updateBerry(trees[node], berryPrefix, value)
        node >>= 1
      }
    }

    type TrimDependencyEntry = Loadout & { __trimStat: number; __trimCost: number; __trimBerry: number }
    for (const loadout of table) {
      const entry = loadout as TrimDependencyEntry
      entry.__trimStat = loadout.getStat(stat)
      entry.__trimCost = loadout.cost
      entry.__trimBerry = loadout.blueberryCost
    }
    table.sort((left, right) => {
      const a = left as TrimDependencyEntry
      const b = right as TrimDependencyEntry
      return a.__trimCost - b.__trimCost
        || b.__trimStat - a.__trimStat
        || (b.upgradeLevels[dependency] ?? 0) - (a.upgradeLevels[dependency] ?? 0)
    })

    const result: Loadout[] = []
    for (const loadout of table) {
      const entry = loadout as TrimDependencyEntry
      const level = Math.max(0, Math.min(maxDependency, entry.upgradeLevels[dependency] ?? 0))
      const index = berryIndex(entry.__trimBerry)
      if (queryLevels(level, index) >= entry.__trimStat)
        continue
      result.push(loadout)
      updateLevel(level, index, entry.__trimStat)
    }
    const trimmed = result.length > 0 ? result : [new Loadout()]
    return trimmed
}

// Generates a dependent chain one tier at a time.  Keeping the frontier after
// each tier avoids materialising the full Cartesian product (which was the
// dominant cost for the SR cube search), while the dependency-aware trim keeps
// every state that can improve a later tier.
function generateDependentChainTable(
  selectedUpgrades: string[],
  stat: string,
  minLevels: Record<string, number> = {},
): Loadout[] {
    let table: Loadout[] = [new Loadout()]
    for (let index = 0; index < selectedUpgrades.length; index++) {
      const upgradeName = selectedUpgrades[index]
      const upgrade = upgrades[upgradeName]
      const expanded: Loadout[] = []

      for (const parentLoadout of table) {
        const parentStat = parentLoadout.getStat(stat)
        // Keep the branch where this tier is not purchased unless the caller
        // explicitly requires a minimum level (the sheet uses this for the
        // luck-I local-optimum table).
        if ((minLevels[upgradeName] ?? 0) <= 0) {
          const loadout = new Loadout(parentLoadout)
          loadout.setCachedStat(stat, parentStat)
          expanded.push(loadout)
        }

        if (stats.rAmb <= 0 && upgrade.row > 2)
          continue

        const preLoadout = new Loadout(parentLoadout)
        preLoadout.upgradeLevels[upgradeName] = 1
        preLoadout.invalidateCaches()
        preLoadout.satisfyPrerequisites()
        if (preLoadout.blueberryCost > stats.blueberries)
          continue
        preLoadout.upgradeLevels[upgradeName] = 0
        preLoadout.invalidateCaches()
        const prerequisiteStat = preLoadout.getStat(stat)

        for (let level = minLevels[upgradeName] ?? 1; level <= upgrade.maxLevel; level++) {
          const cost = preLoadout.cost + upgrade.cost(level)
          if (stats.amb < cost)
            break
          const loadout = new Loadout(preLoadout)
          loadout.upgradeLevels[upgradeName] = level
          // The chain is ordered so this tier is the only newly introduced
          // effect.  Apply it to the pre-final-multiplier value, then restore
          // that multiplier.  Luck/offerings/obtainium are additive before
          // their final multipliers; cube/quark/oct effects are multiplicative.
          let chainStat: number
          if (stat === "luck") {
            const multiplier = 1 + preLoadout.getStat("mLuck")
            const additive = loadout.getEffect(prerequisiteStat / multiplier, upgradeName, "luck")
            chainStat = additive * multiplier
          } else if (stat === "obt" || stat === "off") {
            const multiplier = preLoadout.getStat(stat === "obt" ? "mObt" : "mOff")
            const additive = loadout.getEffect(prerequisiteStat / multiplier, upgradeName, stat)
            chainStat = additive * multiplier
          } else {
            const effectMultiplier = loadout.getEffect(1, upgradeName, stat as keyof UpgradeEffectMap)
            chainStat = prerequisiteStat * effectMultiplier
          }
          loadout.setCachedStat(stat, chainStat)
          expanded.push(loadout)
        }
      }

      // Every tier except the final one is a prerequisite for the next tier;
      // preserve its raw level while trimming.  The final tier can use the
      // ordinary stat/cost frontier.
      if (index < selectedUpgrades.length - 1)
        table = trimTableWithDependency(expanded, stat, upgradeName)
      else
        table = trimTable(expanded, stat)
    }
    return table
}

// Infinite-shop voucher levels are fungible: every purchased level contributes
// exactly one voucher, while tier 2/3 only add a higher price and require the
// preceding tier to be full.  Therefore the cheapest exact representation of
// N vouchers is always tier 1 first, then tier 2, then tier 3.  Generating that
// canonical sequence avoids searching thousands of equivalent allocations.
function generateVoucherTable(stat: string): Loadout[] {
    if (stats.exalt === 4)
      return [new Loadout()]

    const result: Loadout[] = []
    for (let vouchers = 0; vouchers <= upgrades.ambrosiaInfiniteShopUpgrades1.maxLevel
      + upgrades.ambrosiaInfiniteShopUpgrades2.maxLevel
      + upgrades.ambrosiaInfiniteShopUpgrades3.maxLevel; vouchers++) {
      const loadout = new Loadout()
      loadout.upgradeLevels.ambrosiaInfiniteShopUpgrades1 = Math.min(vouchers, upgrades.ambrosiaInfiniteShopUpgrades1.maxLevel)
      loadout.upgradeLevels.ambrosiaInfiniteShopUpgrades2 = Math.min(
        Math.max(0, vouchers - upgrades.ambrosiaInfiniteShopUpgrades1.maxLevel),
        upgrades.ambrosiaInfiniteShopUpgrades2.maxLevel,
      )
      loadout.upgradeLevels.ambrosiaInfiniteShopUpgrades3 = Math.max(
        0,
        vouchers - upgrades.ambrosiaInfiniteShopUpgrades1.maxLevel - upgrades.ambrosiaInfiniteShopUpgrades2.maxLevel,
      )
      loadout.invalidateCaches()
      loadout.satisfyPrerequisites()
      if (loadout.cost > stats.amb || loadout.blueberryCost > stats.blueberries)
        break
      result.push(loadout)
    }
    return trimTable(result, stat)
}

// Voucher rows include their prerequisite chain (Patreon, tutorial, and the
// preceding voucher tiers).  The cube/oct table can contain some of those same
// prerequisites, so merge by max level rather than adding the two totals.
// Evaluating the incremental effects directly avoids re-running every upgrade
// effect for every pair in the 2D merge.
function mergeVoucherTable(table: Loadout[], voucherTable: Loadout[], stat: "cube" | "oct"): Loadout[] {
    const result: Loadout[] = []
    const octeracts = stat === "oct"
    for (const item of table) {
      const baseStat = item.getStat(stat)
      const baseInfinity = Upgrade.infinityCubeShopEffect(item, octeracts)
      const baseAscension = octeracts
        ? Upgrade.octeractAscensionSpeedEffect(item)
        : Upgrade.cubeAscensionSpeedEffect(item)

      for (const voucher of voucherTable) {
        let cost = item.cost
        let blueberryCost = item.blueberryCost
        for (const upgradeName in voucher.upgradeLevels) {
          const oldLevel = item.upgradeLevels[upgradeName] ?? 0
          const newLevel = voucher.upgradeLevels[upgradeName] ?? 0
          if (newLevel <= oldLevel)
            continue
          cost += upgrades[upgradeName].cost(newLevel) - upgrades[upgradeName].cost(oldLevel)
          if (oldLevel <= 0)
            blueberryCost += Math.max(
              0,
              upgrades[upgradeName].blueberryCost
                - (stats.ambrosiaUpgradeBlueberryCostReductions[upgradeName] ?? 0),
            )
        }
        // Canonical voucher rows are ordered by voucher count.  Their cost and
        // blueberry charge never decrease, so once a row is unaffordable all
        // later (more expensive) voucher rows can be skipped for this item.
        if (cost > stats.amb || blueberryCost > stats.blueberries)
          break

        const union = Loadout.union(item, voucher)
        const voucherCount = voucher.upgradeLevels.ambrosiaInfiniteShopUpgrades1
          + voucher.upgradeLevels.ambrosiaInfiniteShopUpgrades2
          + voucher.upgradeLevels.ambrosiaInfiniteShopUpgrades3
        union.setCachedStat("vouchers", stats.voucher + voucherCount)
        union.setCachedCosts(cost, blueberryCost)
        let extraStatFactor = 1
        for (const upgradeName in voucher.upgradeLevels) {
          if (upgradeName.startsWith("ambrosiaInfiniteShopUpgrades"))
            continue
          if (union.effectiveLevel(upgradeName) <= item.effectiveLevel(upgradeName))
            continue
          const oldEffect = item.getEffect(1, upgradeName, stat)
          const newEffect = union.getEffect(1, upgradeName, stat)
          if (oldEffect !== 0)
            extraStatFactor *= newEffect / oldEffect
        }
        const infinity = Upgrade.infinityCubeShopEffect(union, octeracts)
        const ascension = octeracts
          ? Upgrade.octeractAscensionSpeedEffect(union)
          : Upgrade.cubeAscensionSpeedEffect(union)
        union.setCachedStat(stat, baseStat * extraStatFactor
          * (infinity / baseInfinity) * (ascension / baseAscension))
        result.push(union)
      }
    }
    return trimTable(result, stat)
}

// Luck-Cube is the only cube/oct upgrade in this merge whose effect reads the
// selected luck loadout.  Brick of Lead can also overlap between both sides,
// but it changes only mLuck and the ascension-speed multiplier.  Reusing the
// already-cached luck/oct value and applying those two deltas directly avoids
// a full getStat() pass for every pair while retaining the exact max-level
// union semantics.
function mergeLuckCubeTable(tableLuck: Loadout[], tableBrick: Loadout[], stat: "cube" | "oct"): Loadout[] {
    const result: Loadout[] = []
    const octeracts = stat === "oct"
    for (const luckLoadout of tableLuck) {
      const baseLuck = luckLoadout.getStat("luck")
      const baseMLuck = luckLoadout.getStat("mLuck")
      const baseAdditiveLuck = baseLuck / (1 + baseMLuck)
      const baseStat = luckLoadout.getStat(stat)
      const baseAscension = octeracts
        ? Upgrade.octeractAscensionSpeedEffect(luckLoadout)
        : Upgrade.cubeAscensionSpeedEffect(luckLoadout)
      const luckBrickLevel = luckLoadout.effectiveLevel("ambrosiaBrickOfLead")

      for (const brickLoadout of tableBrick) {
        // Only a handful of prerequisite keys occur on the brick-side table.
        // Add their incremental max-level cost/blueberry charge instead of
        // rescanning every upgrade in union.cost/union.blueberryCost.
        let cost = luckLoadout.cost
        let blueberryCost = luckLoadout.blueberryCost
        for (const upgradeName in brickLoadout.upgradeLevels) {
          const oldLevel = luckLoadout.upgradeLevels[upgradeName] ?? 0
          const newLevel = brickLoadout.upgradeLevels[upgradeName] ?? 0
          if (newLevel <= oldLevel)
            continue
          cost += upgrades[upgradeName].cost(newLevel) - upgrades[upgradeName].cost(oldLevel)
          if (oldLevel <= 0)
            blueberryCost += Math.max(
              0,
              upgrades[upgradeName].blueberryCost
                - (stats.ambrosiaUpgradeBlueberryCostReductions[upgradeName] ?? 0),
            )
        }
        if (cost > stats.amb || blueberryCost > stats.blueberries)
          continue

        const union = Loadout.union(luckLoadout, brickLoadout)
        union.setCachedCosts(cost, blueberryCost)
        union.setCachedStat("vouchers", stats.voucher)
        const unionBrickLevel = union.effectiveLevel("ambrosiaBrickOfLead")
        const addedBrick = Math.max(0, unionBrickLevel - luckBrickLevel)
        const unionMLuck = baseMLuck + 0.02 * addedBrick
        const baseBlueberries = stats.blueberries - luckLoadout.blueberryCost
        const unionBlueberries = stats.blueberries - union.blueberryCost
        const purpleLeoDelta = (unionBlueberries >= 5 ? unionBlueberries * stats.purpleLeoLevel : 0)
          - (baseBlueberries >= 5 ? baseBlueberries * stats.purpleLeoLevel : 0)
        const unionLuck = (baseAdditiveLuck + purpleLeoDelta) * (1 + unionMLuck)
        const luckCubeFactor = 1 + 0.0005 * unionLuck
          * union.effectiveLevel("ambrosiaLuckCube1")
        let extraCubeFactor = 1
        for (const upgradeName in brickLoadout.upgradeLevels) {
          if (upgradeName === "ambrosiaLuckCube1")
            continue
          if (union.effectiveLevel(upgradeName) <= luckLoadout.effectiveLevel(upgradeName))
            continue
          const oldEffect = luckLoadout.getEffect(1, upgradeName, stat)
          const newEffect = union.getEffect(1, upgradeName, stat)
          if (oldEffect !== 0)
            extraCubeFactor *= newEffect / oldEffect
        }
        const unionAscension = octeracts
          ? Upgrade.octeractAscensionSpeedEffect(union)
          : Upgrade.cubeAscensionSpeedEffect(union)

        union.setCachedStat(stat, baseStat * extraCubeFactor * luckCubeFactor * (unionAscension / baseAscension))
        result.push(union)
      }
    }
    return trimTable(result, stat)
}

// Generates a table of locally optimal loadouts for selected upgrades
function generateTable(selectedUpgrades: string[], stat: string, minLevels: Record<string, number> = {}): Loadout[] {
    let table: Loadout[] = [];

    const processUpgrade = (upgradeIndex: number, parentLoadout: Loadout): void => {

      if (upgradeIndex >= selectedUpgrades.length)
        return
      let upgradeName = selectedUpgrades[upgradeIndex]
      let upgrade = upgrades[upgradeName]

      if ((minLevels[upgradeName] ?? 0) <= 0)
        processUpgrade(upgradeIndex + 1, parentLoadout) // Process the next upgrade without having any levels in the current upgrade

      if (stats.rAmb <= 0 && upgrade.row > 2) // This upgrade is not unlocked
        return

      let preLoadout = new Loadout(parentLoadout)
      for (let prerequisite in upgrade.prerequisites) {
        // Avoid double calculations
        if (selectedUpgrades.includes(prerequisite) && (preLoadout.upgradeLevels[prerequisite] ?? 0) < (upgrade.prerequisites[prerequisite] ?? 0))
          return
      }
      preLoadout.upgradeLevels[upgradeName] = 1
      preLoadout.invalidateCaches()
      preLoadout.satisfyPrerequisites()
      if (preLoadout.blueberryCost > stats.blueberries)
        return
      preLoadout.upgradeLevels[upgradeName] = 0
      preLoadout.invalidateCaches()

      for (let level = minLevels[upgradeName] ?? 1; level <= upgrade.maxLevel; level++) {

        let cost = preLoadout.cost + upgrade.cost(level)
        if (stats.amb < cost)
          return // No point in adding unaffordable loadouts to the table

        let loadout = new Loadout(preLoadout)
        loadout.upgradeLevels[upgradeName] = level
        table.push(loadout)

        processUpgrade(upgradeIndex + 1, loadout)

      }

    }

    let emptyLoadout = new Loadout()
    table.push(emptyLoadout)
    processUpgrade(0, emptyLoadout)
    return trimTable(table, stat)

  }

// Merges two tables with locally optimal loadouts
function mergeTables(table1: Loadout[], table2: Loadout[], stat: string): Loadout[] {
    const result: Loadout[] = [];
    for (let item1 of table1)
      for (let item2 of table2) {
        let union = Loadout.union(item1, item2)
        // The union cost is not monotone in item2.cost when the two tables
        // share prerequisite upgrades.  Never use the old overlap heuristic
        // as a break condition: it could discard later affordable rows and
        // leave the optimizer with an under-spent budget.  The only safe early
        // stop is the independent lower bound item2.cost <= union.cost.
        if (item2.cost > stats.amb)
          break
        if (union.cost <= stats.amb && union.blueberryCost <= stats.blueberries) {
          // trimTable removes duplicate equal-cost/equal-berry states while
          // building the Pareto frontier; avoid serializing every union just
          // to maintain a duplicate set in this hot Cartesian-product loop.
          result.push(union)
        }
      }
    if (result.length <= 0)
      result.push(new Loadout)
    return trimTable(result, stat)
  }

// Merge tables whose upgrade sets are independent (the rune table is used in
// this form for cubes, quarks, obtainium, and offerings).  Their stat effects
// compose as a ratio around the empty loadout, so cache that ratio and avoid a
// full getStat pass for every union in the large Cartesian product.
function mergeIndependentTables(table1: Loadout[], table2: Loadout[], stat: string): Loadout[] {
    const result: Loadout[] = []
    const baseStat = new Loadout().getStat(stat)
    const rightFactors = table2.map(loadout => loadout.getStat(stat) / baseStat)
    for (let leftIndex = 0; leftIndex < table1.length; leftIndex++) {
      const item1 = table1[leftIndex]
      const leftStat = item1.getStat(stat)
      for (let rightIndex = 0; rightIndex < table2.length; rightIndex++) {
        const item2 = table2[rightIndex]
        if (item2.cost > stats.amb)
          break
        const union = Loadout.union(item1, item2)
        if (union.cost > stats.amb || union.blueberryCost > stats.blueberries)
          continue
        union.setCachedStat(stat, leftStat * rightFactors[rightIndex])
        result.push(union)
      }
    }
    return trimTable(result, stat)
}

// Finds the globally optimal loadout among affordable ones
function findOpt(table1: Loadout[], table2: Loadout[], stat: string, budget = stats.amb): Loadout {

    let power = 0, j = 0;
    let upperBounds: Array<{ budget: number; loadout: Loadout }> = [];
    // An optimization for large tables
    if (stat !== "allAmb" && table1.length > 100 && table2.length > 100) {
      // Only consider 100 points in each table
      for (let i = 1; Math.round(i) <= table1.length; i += (table1.length - 1) / 100) {
        for (let next = j; Math.round(next) < table2.length; next += (table2.length - 1) / 100) {
          let loadout1 = table1.at(-Math.round(i))!;
          let loadout2 = table2[Math.round(next)]
          let union = Loadout.union(loadout1, loadout2)
          // The sampled pass must never seed `power` with a candidate that
          // exceeds the blueberry budget.  Otherwise the exact pass can prune
          // every affordable candidate below that inflated value.
          if (union.blueberryCost > stats.blueberries)
            union.fixBlueberryUpgrades()
          if (2 * union.cost - loadout1.cost - loadout2.cost > budget) {
            // This unaffordable loadout serves as a local upper bound
            upperBounds.push({budget: loadout1.cost, loadout: loadout2})
            break // Every next loadout will be more expensive
          }
          if (union.cost > budget || union.blueberryCost > stats.blueberries)
            continue // Can't afford this loadout, try the next one
          power = Math.max(power, union.getStat(stat)) // The best approximate solution
          j = next
        }
      }
    }

    let opt = table1[0]; j = 0;
    let upperBoundIndex = 0;
    for (let i = 1; i <= table1.length; i++) {
        let ref = table1.at(-i)!;
        // Find appropriate loadout2 from previously computed upper bounds
        // budget denotes how much we would spend in loadout1, the rest goes to loadout2
        // upperBounds are sorted by budget in a descending order
        // Hence we need to find the first entry with budget <= loadout1.cost
        // That way we ensure the loadout2 from upperBounds uses at least as much amb as we have to spare
        // If it uses more, that's not a problem, this is an *upper* bound, after all
        while (upperBoundIndex < upperBounds.length
          && upperBounds[upperBoundIndex].budget > ref.cost)
          upperBoundIndex++
        let upperBound = upperBounds[upperBoundIndex]?.loadout
        if (upperBound !== undefined) {
            let boundUnion = Loadout.union(ref, upperBound);
            if (boundUnion.getStat(stat) < power)
                continue; // Every loadout generated with table.at(-i) will be suboptimal
        }
        let union = Loadout.union(ref, table2[j]);
        if (union.blueberryCost > stats.blueberries)
            union.fixBlueberryUpgrades();
        if (union.cost > budget)
            continue; // Can't afford this loadout, try a cheaper one
        for (let next = j + 1; next < table2.length; next++) {
            let nextUnion = Loadout.union(ref, table2[next]);
            if (budget < Number.POSITIVE_INFINITY && nextUnion.blueberryCost > stats.blueberries)
              nextUnion.fixBlueberryUpgrades()
            // Union cost is not monotone when prerequisite upgrades overlap;
            // the former overlap heuristic could skip valid affordable rows.
            // Only the independent table2 cost is a safe monotone bound.
            if (table2[next].cost > budget)
                break;
            if (nextUnion.getStat(stat) <= union.getStat(stat))
                continue;
            if (nextUnion.cost > budget)
                continue; // Can't afford this loadout, try the next one
            union = nextUnion;
            j = next;
        }
        let statDiff = union.getStat(stat) - opt.getStat(stat);
        // If one loadout is stronger than the other, choose it
        // If both are equally powerful, choose the cheaper one
        if (statDiff > 0 || (statDiff === 0 && union.cost < opt.cost))
            opt = union;
    }

    return opt;

}


// ===========================================================================
// Input mapping: HeaterOptimizerInput → stats + options
// ===========================================================================

function fillStatsAndOptionsFromInput(input: HeaterOptimizerInput): void {
    const {
        amb, ramb, bonusAmbrosiaPerFill, ambSpeedNoAmbBerries, blueberries, purpleLeoLevel,
        luckBaseNoAmb, luckMultNoAmb, redLuckBase, luckConversion,
        quarksOwned, qHept, cubesExpTotal,
        currentSingularity, singularityReducers,
        exalt, exalt9Unlocked, postAoag, oneMindUnlocked, aquariusUnlocked, transcription,
        ascSpeed, ascSpread, baseObt, baseOff,
        bonusTutorial,
        bonusRow2, bonusRow3, bonusRow4, bonusRow5,
        runeSiExp, runeSiRC, runeSiBonusLevelsTotal,
        runeSiBonusLevelsTalismanNoAmbrosia, runeSiEffectiveLevelMultiplier,
        runeIaExp, runeIaBonusLevelsTotal, runeIaBonusLevelsTalisman,
        baseTalismanPower,
        patreonBonus,
        jack, freeShopLevelsInfinity, freeShopLevelsQuark,
        chronometerLevel,
        shopAmbrosiaLuck1, shopAmbrosiaLuck2, shopAmbrosiaLuck3, shopAmbrosiaLuck4,
        shopRedLuck1, shopRedLuck2, shopRedLuck3, shopRedLuck4,
        shopAmbrosiaGeneration1, shopAmbrosiaGeneration2, shopAmbrosiaGeneration3, shopAmbrosiaGeneration4,
        shopImproveQuarkHept1, shopImproveQuarkHept2, shopImproveQuarkHept3, shopImproveQuarkHept4, shopImproveQuarkHept5,
        fusion, rBar, rSpeed, blueBarMaxWithoutTwoMindAndBrick, blueBarRequirementBeforeRounding, redBarMaxWithoutTwoMind,
        ossifiedTactics, redberries, viscount, ossifiedTactics2,
        ambrosiaUpgradeBonusLevels, ambrosiaUpgradeBlueberryCostReductions,
        shopUpgradeRawLevels, shopBonusLevelsNoAmbrosia, panthemaLevel, shopUpgradesDisabled,
        heaterOptions,
    } = input;

    stats.amb            = amb;
    stats.rAmb           = ramb;
    stats.bonusAmbrosiaPerFill = bonusAmbrosiaPerFill;
    // SynergismOfficial/src/BlueberryUpgrades.ts ambrosiaLuck4 uses the
    // separate, rounded-up digit counts of lifetime blue and red Ambrosia.
    stats.lifetimeAmbExp = Math.ceil(Math.log10(amb + 1)) + Math.ceil(Math.log10(ramb + 1));

    stats.ambSpeed    = ambSpeedNoAmbBerries;
    stats.blueberries = blueberries;
    stats.purpleLeoLevel = purpleLeoLevel;
    stats.tutorialBonus = bonusTutorial;
    stats.baseLuck       = luckBaseNoAmb;
    // SynergismOfficial/src/Statistics.ts and Event.ts:
    // luckMultNoAmb already comes from calculateLuck(..., 'true_base'),
    // whose event source includes both the vanilla event and consumable bell
    // contribution. Do not add activeBells again here, or event luck is
    // counted twice in every candidate loadout.
    stats.baseMLuck      = luckMultNoAmb;
    let rLuck            = redLuckBase;
    stats.luckConversion = luckConversion;

    stats.quarks  = quarksOwned;
    stats.qHept   = qHept;
    stats.cubeExp = cubesExpTotal + 6;

    stats.rawSing  = currentSingularity;
    stats.sing     = currentSingularity - singularityReducers;
    stats.exalt    = exalt;
    stats.exalt9Unlocked = exalt9Unlocked;
    stats.postAoAG = postAoag;
    stats.oneMindUnlocked = oneMindUnlocked;
    stats.aquariusExponent = aquariusUnlocked ? 0.01 * (0.55 + transcription / 150) : 0;
    stats.mind     = 0.55 + transcription / 150;
    stats.aSpeed   = ascSpeed;
    stats.spread   = ascSpread;
    stats.baseObt  = baseObt;
    stats.baseOff  = baseOff;

    // --- Bonus levels per row (index 0 unused, rows 1–4)
    stats.bonus = [0, bonusRow2, bonusRow3, bonusRow4, bonusRow5, 0];

    // --- Runes & Talismans
    stats.runeExp    = runeSiExp.eq(0) ? -1e10 : runeSiExp.log10();
    stats.runeCoefSI = runeSiRC;
    stats.bonusSI    = runeSiBonusLevelsTotal;
    stats.talismanSI = runeSiBonusLevelsTalismanNoAmbrosia;
    stats.runeMultSI = runeSiEffectiveLevelMultiplier;
    stats.expIA      = runeIaExp.eq(0) ? -1e10 : runeIaExp.log10();
    stats.bonusIA    = runeIaBonusLevelsTotal.toNumber();
    stats.talismanIA = runeIaBonusLevelsTalisman.toNumber();
    stats.talismanP  = baseTalismanPower.toNumber();
    stats.baseSI     = Upgrade.runeLevelSI();

    stats.baseIACube  = 1 + 0.01  * Upgrade.runeLevelIA();
    const baseIARuneLevel = Upgrade.runeLevelIA();
    stats.baseIAQuark = 1 + 0.002 * baseIARuneLevel + (baseIARuneLevel > 0 ? 0.1 : 0);
    stats.patreon   = patreonBonus;
    stats.jack      = jack;
    stats.ambrosiaUpgradeBonusLevels = ambrosiaUpgradeBonusLevels;
    stats.ambrosiaUpgradeBlueberryCostReductions = ambrosiaUpgradeBlueberryCostReductions;
    blueberryRemovalOrder = Object.keys(upgrades)
      .filter((upgrade) => (upgrades[upgrade]?.blueberryCost ?? 0) > 0)
      .sort((left, right) => {
        const leftCost = Math.max(
          0,
          (upgrades[left].blueberryCost ?? 0)
            - (stats.ambrosiaUpgradeBlueberryCostReductions[left] ?? 0)
        )
        const rightCost = Math.max(
          0,
          (upgrades[right].blueberryCost ?? 0)
            - (stats.ambrosiaUpgradeBlueberryCostReductions[right] ?? 0)
        )
        return rightCost - leftCost || left.localeCompare(right)
      });
    stats.shopUpgradeRawLevels = shopUpgradeRawLevels;
    stats.shopBonusLevels = shopBonusLevelsNoAmbrosia;
    stats.panthemaLevel = panthemaLevel;
    stats.shopUpgradesDisabled = shopUpgradesDisabled;

    stats.voucher   = freeShopLevelsInfinity; // voucher = free shop levels (infinity line)
    stats.shopQuark = freeShopLevelsQuark - 0.1 * bonusRow5; // removing 1981 Cut from base (bonus[4])
    stats.chronometer = chronometerLevel;

    stats.shopLuck  = shopUpgradesDisabled ? 0 : (shopAmbrosiaLuck1 > 0 ? 2 : 0)
                      + (shopAmbrosiaLuck2 > 0 ? 2 : 0)
                      + (shopAmbrosiaLuck3 > 0 ? 2 : 0)
                      + (shopAmbrosiaLuck4 > 0 ? 0.6 : 0);
    stats.shopRLuck = shopUpgradesDisabled ? [0, 0, 0, 0] : [shopRedLuck1, shopRedLuck2, shopRedLuck3, shopRedLuck4];
    stats.shopAmb   = [shopAmbrosiaGeneration1, shopAmbrosiaGeneration2, shopAmbrosiaGeneration3, shopAmbrosiaGeneration4];
    stats.qHeptExp  = [shopImproveQuarkHept1, shopImproveQuarkHept2, shopImproveQuarkHept3, shopImproveQuarkHept4].filter(Boolean).length * 0.01;
    stats.qHeptExp += shopImproveQuarkHept5 > 0 ? 0.0001 : 0;

    // The exported values contain no Ambrosia upgrade levels. Rebase the
    // persistent Red Ambrosia row levels before the Loadout model reapplies
    // them (plus active Purple Ambrosia enchantments).
    let baseLoadout  = new Loadout();
    stats.baseRLuck  = rLuck - Math.floor((stats.baseLuck * (1 + stats.baseMLuck) - 100) / stats.luckConversion);
    // The export has already removed the Purple Leo contribution from its
    // no-Ambrosia base.  The empty loadout re-adds Leo for its unassigned
    // blueberries, so exclude that contribution when removing the persistent
    // Red Ambrosia row bonuses from the exported base.
    const baseLeoLuck = stats.blueberries >= 5 ? stats.blueberries * stats.purpleLeoLevel : 0;
    stats.baseLuck  -= baseLoadout.luck / (1 + stats.baseMLuck) - baseLeoLuck - stats.baseLuck;
    stats.baseMLuck -= upgrades.ambrosiaLuck4.effects.mLuck!(0, stats.bonus[upgrades.ambrosiaLuck4.row] ?? 0, baseLoadout);
    stats.baseObt   -= baseLoadout.getStat("obt") / baseLoadout.getStat("mObt") - stats.baseObt;
    stats.baseOff   -= baseLoadout.getStat("off") / baseLoadout.getStat("mOff") - stats.baseOff;

    stats.ossifiedTactics  = ossifiedTactics;
    stats.redberries       = redberries;
    stats.fusion   = fusion;
    stats.fusion   = (stats.fusion > 0 ? 1 : 0) + 0.02 * stats.fusion;
    stats.fusion   *= rBar > 0 ? rSpeed / rBar : 0;
    stats.viscount         = viscount;
    stats.blueBarMaxWithoutTwoMindAndBrick = blueBarMaxWithoutTwoMindAndBrick;
    stats.blueBarRequirementBeforeRounding = blueBarRequirementBeforeRounding;
    stats.redBarMaxWithoutTwoMind = redBarMaxWithoutTwoMind;
    stats.ossifiedTactics2 = ossifiedTactics2;

    const optionsState = input.heaterOptions;
    HEATER_BRANCH_DEFINITIONS.forEach((branch) => {
        const optionKey = branch.optionKey;
        if (optionKey in options) {
            options[optionKey] = optionsState[branch.id] ?? false;
        }
    });
}

// ===========================================================================
// Public API
// ===========================================================================

export class HSHeaterOptimizer {

    static createHeaterOptimizerResultFromInput(input: HeaterOptimizerInput): HeaterOptimizationResult {

        if (!Number.isFinite(input.blueBarRequirementBeforeRounding)
            || input.blueBarRequirementBeforeRounding <= 0) {
            throw new Error('Blue bar pre-round requirement is missing; re-export current game data for Heater.');
        }

        // Populate stats + options from input
        fillStatsAndOptionsFromInput(input);

        HSLogger.debug(() => `[HeaterDiag] options=${JSON.stringify(options)}`, 'HSHeaterOptimizer');

        // Build maxLoadout (used by generateOutput to detect if a loadout is maxed)
        let maxLoadout = new Loadout();
        for (let upgrade in upgrades)
            maxLoadout.upgradeLevels[upgrade] = upgrades[upgrade].maxLevel;

        // Compute
        let output: HeaterOptimizationResult = { input };
        let redAmbUpgradeEffects: HeaterRedAmbUpgradeEffects = {};
        let tableCache: Record<string, Loadout[]> = {};

        try {

          HSLogger.debug(() => '[HeaterDiag] Building shared luck tables', 'HSHeaterOptimizer');
          // --- Shared luck tables (used by calculateAmb and calculateAmbOct) ---
          tableCache.tableLuck1      = generateTable(["ambrosiaFreeLuckUpgrades", "ambrosiaLuck3"], "luck");
          tableCache.tableLuckHybrid = generateTable(["ambrosiaQuarkLuck1", "ambrosiaCubeLuck1"], "luck");
          tableCache.tableLuck4      = generateTable(["ambrosiaLuck4"], "mLuck");

          if (options.calculateAmb || options.calculateAmbOct) {
              let tableLuck = generateDependentChainTable(["ambrosiaLuck1", "ambrosiaLuck2"], "luck");
              tableLuck = mergeTables(tableLuck, tableCache.tableLuck1, "luck");
              tableCache.tableLuckAdd = mergeTables(tableLuck, tableCache.tableLuckHybrid, "luck");
          }

          // Keep voucher levels out of the main luck frontier: they are a
          // deliberately last-priority source of luck, but still need to be
          // considered after the best direct luck loadout is found.
          if (options.calculateAmb || options.calculateAmbOct)
              // Build the frontier using a stat vouchers actually improve.
              // Building it with "luck" would trim every row after zero,
              // since vouchers have no direct luck effect in the upgrade map.
              tableCache.tableVoucher = generateVoucherTable("cube");

          const optimizeLuckWithVouchers = (table1: Loadout[], table2: Loadout[]): Loadout => {
              const base = findOpt(table1, table2, "luck");
              return tableCache.tableVoucher === undefined
                ? base
                : findOpt([base], tableCache.tableVoucher, "luck");
          };

          let luckLuck = 0;
          if (options.calculateAmb) { // Luck calculation
              HSLogger.debug(() => '[HeaterDiag] calculateAmb: luck', 'HSHeaterOptimizer');
              let loadoutLuck = optimizeLuckWithVouchers(tableCache.tableLuckAdd, tableCache.tableLuck4);
              if (!loadoutLuck) HSLogger.error('[HeaterDiag] calculateAmb: luck - findOpt returned undefined', 'HSHeaterOptimizer');
              let maxAmbLoadout = new Loadout(maxLoadout);
              maxAmbLoadout.upgradeLevels.ambrosiaBrickOfLead = 0;
              output.luck = [loadoutLuck.generateOutput("luck", maxAmbLoadout)];
              luckLuck = loadoutLuck.luck;
          }

          let rLuckRLuck = 0;
          if (options.calculateAmb) { // Red Luck calculation
              HSLogger.debug(() => '[HeaterDiag] calculateAmb: rLuck', 'HSHeaterOptimizer');
              let tableLuckMult         = generateTable(["ambrosiaBrickOfLead", "ambrosiaLuck4"], "mLuck");
              tableCache.tableFreeRLuck = generateTable(["ambrosiaFreeRedLuckUpgrades"], "rLuck");
              tableCache.tableLuckR     = mergeTables(tableLuckMult, tableCache.tableLuckAdd, "rLuck");
              let loadoutRLuck          = findOpt(tableCache.tableLuckR, tableCache.tableFreeRLuck, "rLuck");
              // Vouchers affect Red Luck indirectly through Jack of all
              // Trades (and only when a luck-producing module is active), so
              // apply them after the direct Red Luck optimum has been found.
              // This keeps their tiny contribution from distorting the main
              // luck/resource search while still allowing the final levels.
              loadoutRLuck = findOpt([loadoutRLuck], tableCache.tableVoucher, "rLuck");
              if (!loadoutRLuck) HSLogger.error('[HeaterDiag] calculateAmb: rLuck - findOpt returned undefined', 'HSHeaterOptimizer');
              output.rLuck = [loadoutRLuck.generateOutput("rLuck", maxLoadout)];

              rLuckRLuck = loadoutRLuck.getStat("rLuck");
              let baseLoadout = new Loadout();
              let rLuckEffectRatio = rLuckRLuck / baseLoadout.getStat("rLuck");
              output.redAmbCommonValues = {
                  luck: loadoutRLuck.luck,
                  mLuck: loadoutRLuck.getStat("mLuck"),
                  luckConversion: Upgrade.luckConversion(loadoutRLuck.effectiveLevel("ambrosiaFreeRedLuckUpgrades")),
                  totalRedLuck: input.redLuckBase * rLuckEffectRatio,
                  rLuckEffectRatio,
              };
          }

          if (options.calculateAmb) { // Luck calculation - Red Amb Upgrades

              const fusion = stats.fusion * rLuckRLuck * stats.baseRLuck / 100;
              const fusionGain = (multiplier: number) => (1 + fusion * multiplier) / (1 + fusion);

              if (stats.redberries < redUpgrades.blueberries.maxLevel) {
                  stats.blueberries++;
                  let rNext = findOpt(tableCache.tableLuckR, tableCache.tableFreeRLuck, "rLuck");
                  let rEffect = rNext.getStat("rLuck") / rLuckRLuck;
                  let bNext = optimizeLuckWithVouchers(tableCache.tableLuckAdd, tableCache.tableLuck4);
                  let bEffect = bNext.luck / luckLuck * fusionGain(rEffect);
                  redAmbUpgradeEffects.blueberries = { rEffect, bEffect };
                  stats.blueberries--;
              }

              if (stats.bonus[1] < 5) {
                  stats.bonus[1]++;
                  let rNext = findOpt(tableCache.tableLuckR, tableCache.tableFreeRLuck, "rLuck");
                  let rEffect = rNext.getStat("rLuck") / rLuckRLuck;
                  let bNext = optimizeLuckWithVouchers(tableCache.tableLuckAdd, tableCache.tableLuck4);
                  let bEffect = bNext.luck / luckLuck * fusionGain(rEffect);
                  redAmbUpgradeEffects.freeLevelsRow2 = { rEffect, bEffect };
                  stats.bonus[1]--;
              }

              if (stats.bonus[2] < 5) {
                  stats.bonus[2]++;
                  let rNext = findOpt(tableCache.tableLuckR, tableCache.tableFreeRLuck, "rLuck");
                  let rEffect = rNext.getStat("rLuck") / rLuckRLuck;
                  let bNext = optimizeLuckWithVouchers(tableCache.tableLuckAdd, tableCache.tableLuck4);
                  let bEffect = bNext.luck / luckLuck * fusionGain(rEffect);
                  redAmbUpgradeEffects.freeLevelsRow3 = { rEffect, bEffect };
                  stats.bonus[2]--;
              }

              if (stats.bonus[3] < 5) {
                  stats.bonus[3]++;
                  let rNext = findOpt(tableCache.tableLuckR, tableCache.tableFreeRLuck, "rLuck");
                  let rEffect = rNext.getStat("rLuck") / rLuckRLuck;
                  let bNext = optimizeLuckWithVouchers(tableCache.tableLuckAdd, tableCache.tableLuck4);
                  let bEffect = bNext.luck / luckLuck * fusionGain(rEffect);
                  redAmbUpgradeEffects.freeLevelsRow4 = { rEffect, bEffect };
                  stats.bonus[3]--;
              }

              if (stats.bonus[4] < 5) {
                  stats.bonus[4]++;
                  let rNext = findOpt(tableCache.tableLuckR, tableCache.tableFreeRLuck, "rLuck");
                  let rEffect = rNext.getStat("rLuck") / rLuckRLuck;
                  let bNext = optimizeLuckWithVouchers(tableCache.tableLuckAdd, tableCache.tableLuck4);
                  let bEffect = bNext.luck / luckLuck * fusionGain(rEffect);
                  redAmbUpgradeEffects.freeLevelsRow5 = { rEffect, bEffect };
                  stats.bonus[4]--;
              }

              if (!stats.viscount) {
                  stats.baseLuck += 125;
                  stats.baseRLuck += 25;
                  let rNext = findOpt(tableCache.tableLuckR, tableCache.tableFreeRLuck, "rLuck");
                  let rEffect = rNext.getStat("rLuck") / rLuckRLuck;
                  let bNext = optimizeLuckWithVouchers(tableCache.tableLuckAdd, tableCache.tableLuck4);
                  let bEffect = bNext.luck / luckLuck * fusionGain(rEffect);
                  redAmbUpgradeEffects.viscount = { rEffect, bEffect };
                  stats.baseLuck -= 125;
                  stats.baseRLuck -= 25;
              }
          }

          let loadoutAllAmb: Loadout | undefined;
          let optLoadoutAllAmb: Loadout | undefined;
          if (options.calculateAmb || options.calculateAmbOct) { // All Amb calculation
              HSLogger.debug(() => '[HeaterDiag] calculateAmb/calculateAmbOct: allAmb', 'HSHeaterOptimizer');
              let tableSpeed  = generateTable(["ambrosiaFreeGenerationUpgrades"], "amb");
              let tableAmb    = mergeTables(tableCache.tableLuck4, tableSpeed, "amb");
              let tableRLuck2 = generateTable(["ambrosiaFreeRedLuckUpgrades"], "rAmb");
              let tableRAmb   = mergeTables(tableAmb, tableRLuck2, "rAmb");
              tableCache.tableAllAmb = mergeTables(tableCache.tableLuckAdd, tableRAmb, "allAmb");
              tableCache.tableAllAmb = mergeTables(tableCache.tableAllAmb, generateTable(["twoMind"], "allAmb"), "allAmb");
              let tableBrickOfLead = generateTable(["ambrosiaBrickOfLead"], "mLuck");
              loadoutAllAmb = findOpt(tableCache.tableAllAmb, tableBrickOfLead, "allAmb");
              // Jack of all Trades makes vouchers a small secondary source of
              // Ambrosia through active luck/generation modules.  Add them
              // only after the direct all-Ambrosia optimum is selected.
              loadoutAllAmb = findOpt([loadoutAllAmb], tableCache.tableVoucher, "allAmb");
              let optLoadout = new Loadout(maxLoadout);
              optLoadout.upgradeLevels.ambrosiaBrickOfLead = 0;
              optLoadoutAllAmb = findOpt([optLoadout], tableBrickOfLead, "allAmb", Number.POSITIVE_INFINITY);
              if (!loadoutAllAmb || !optLoadoutAllAmb) HSLogger.error('[HeaterDiag] allAmb - findOpt returned undefined', 'HSHeaterOptimizer');
              if (options.calculateAmb)
                  output.allAmb = [loadoutAllAmb.generateOutput("allAmb", optLoadoutAllAmb)];
              if (options.calculateAmbOct && (optLoadoutAllAmb.getStat("allAmb") > loadoutAllAmb.getStat("allAmb"))) {
                  options.calculateAmbOct = false;
                  output.ambOct = [maxLoadout.generateOutput("", maxLoadout)];
              }
          }

          // --- Shared luck/rune/voucher tables for cube-class calculations ---
          if (
              options.calculateQuarks || options.calculateCubes || options.calculateOct || options.calculateSR ||
              options.calculateHyperflux || options.calculateOff || options.calculateGen
          ) {
              let luckMinLevel: Record<string, number> = { ambrosiaLuck1: 20 }; // This is necessary for correct local optima
              let tableLuck1  = generateDependentChainTable(["ambrosiaLuck1", "ambrosiaLuck2"], "luck", luckMinLevel);
              let tableLuck2  = mergeTables(tableLuck1, tableCache.tableLuck1, "luck");
              tableCache.tableLuckAdd1 = mergeTables(tableLuck2, tableCache.tableLuckHybrid, "luck");
              let tableLuckMult = generateTable(["ambrosiaBrickOfLead", "ambrosiaLuck4"], "mLuck");
              tableCache.tableLuck = mergeTables(tableCache.tableLuckAdd1, tableLuckMult, "luck");
              // Local optima for cubes match local optima for quarks
              tableCache.tableRune = generateDependentChainTable(["ambrosiaTalismanBonusRuneLevel", "ambrosiaRuneOOMBonus"], "cube");
          }

          if (options.calculateQuarks || options.calculateCubes || options.calculateOct || options.calculateSR ||
            options.calculateOff || options.calculateGen) {
              // Local optima for cubes match local optima for quarks and octeracts
              if (tableCache.tableVoucher === undefined)
                tableCache.tableVoucher = generateVoucherTable("cube");
          }

          // --- calculateQuarks ---
          if (options.calculateQuarks) { // Calculate Quarks
              HSLogger.debug(() => '[HeaterDiag] calculateQuarks', 'HSHeaterOptimizer');
              // Keep the new Exalt-9 tier separate while generating tables.
              // Enumerating it together with Quarks 1–3 multiplies the
              // recursive search by 100 levels before the Pareto trim can
              // remove anything.  Merging the independently-priced tier is
              // exact because Quarks 4 only depends on the completed Quarks
              // 3 chain and has no feedback into those effects.
              let tableQuark1   = generateDependentChainTable(["ambrosiaQuarks1", "ambrosiaQuarks2", "ambrosiaQuarks3"], "quark");
              tableQuark1 = mergeTables(tableQuark1, generateTable(["ambrosiaQuarks4"], "quark"), "quark");
              let tableQuark2   = generateTable(["ambrosiaCubeQuark1", "ambrosiaFreeQuarkUpgrades"], "quark");
              let tableQuark3   = mergeTables(tableQuark1, tableQuark2, "quark");
              let tableQuarkR   = mergeIndependentTables(tableQuark3, tableCache.tableRune, "quark");
              let tableLuckQuark1 = generateTable(["ambrosiaLuckQuark1"], "quark");
              let tableLuckQuark  = mergeTables(tableCache.tableLuck, tableLuckQuark1, "quark");
              let loadoutQuark  = findOpt(tableQuarkR, tableLuckQuark, "quark");
              // Vouchers are a weak quark source, so add them only after the
              // direct quark/luck optimum has been selected.
              loadoutQuark = findOpt([loadoutQuark], tableCache.tableVoucher, "quark");
              if (!loadoutQuark) HSLogger.error('[HeaterDiag] calculateQuarks - findOpt returned undefined', 'HSHeaterOptimizer');
              output.quarks = [loadoutQuark.generateOutput("quark", maxLoadout)];
          }

          // --- Shared cube tables (cubes / oct / ambOct / hyperflux / gen) ---
          if (options.calculateCubes || options.calculateOct || options.calculateSR || options.calculateAmbOct || options.calculateHyperflux || options.calculateGen) {
            // As with Quarks 4, generate Cubes 4 separately.  This preserves
            // the exact Pareto frontier while avoiding a 50x expansion of
            // the recursive Cubes 1–3 table.
            let tableCube1 = generateDependentChainTable(["ambrosiaCubes1", "ambrosiaCubes2", "ambrosiaCubes3"], "cube")
            tableCube1 = mergeTables(tableCube1, generateTable(["ambrosiaCubes4"], "cube"), "cube")
            const tableFreeCube = generateTable(["ambrosiaFreeCubeUpgrades"], "cube")
            let tableQuarkCube = generateTable(["ambrosiaQuarkCube1"], "cube")
            tableCache.tableCube = mergeTables(mergeTables(tableCube1, tableFreeCube, "cube"), tableQuarkCube, "cube")
            // SynergismOfficial/src/Statistics.ts: Cube-group shop levels
            // affect Octeracts through extra tier-specific multipliers, so
            // their local maxima must be searched against the Oct objective.
            if (options.calculateOct || options.calculateAmbOct || options.calculateGen) {
              // Cubes I-IV have identical cube and octeract effects.  Reuse
              // the already-trimmed cube frontier and copy its pre-shop stat
              // cache instead of expanding and trimming the same chain twice.
              const tableOctCube1Base = tableCube1.map(loadout => {
                const clone = new Loadout(loadout)
                clone.setCachedStat("oct", loadout.getStat("cube"))
                return clone
              })
              const tableOctCube1 = tableOctCube1Base
              const tableOctFreeCube = generateTable(["ambrosiaFreeCubeUpgrades"], "oct")
              const tableOctQuarkCube = generateTable(["ambrosiaQuarkCube1"], "oct")
              tableCache.tableOctCube = mergeTables(mergeTables(tableOctCube1, tableOctFreeCube, "oct"), tableOctQuarkCube, "oct")
            }
          }

          if (options.calculateCubes || options.calculateSR || options.calculateHyperflux) {
            tableCache.tableCubeR = mergeIndependentTables(tableCache.tableCube, tableCache.tableRune, "cube")
          }

          if (options.calculateCubes || options.calculateOct || options.calculateSR || options.calculateHyperflux || options.calculateGen) {
            let tableLuckMult = generateTable(["ambrosiaLuck4"], "mLuck")
            let tableLuck = mergeTables(tableCache.tableLuckAdd1, tableLuckMult, "luck")
            if (options.calculateCubes || options.calculateSR || options.calculateHyperflux) {
              let tableBrick = generateTable(["ambrosiaLuckCube1", "ambrosiaBrickOfLead"], "cube")
              tableCache.tableLuckCube = mergeLuckCubeTable(tableLuck, tableBrick, "cube")
            }
            if (options.calculateOct || options.calculateGen) {
              let tableBrick = generateTable(["ambrosiaLuckCube1", "ambrosiaBrickOfLead"], "oct")
              tableCache.tableLuckOct = mergeLuckCubeTable(tableLuck, tableBrick, "oct")
            }
          }

          // --- calculateCubes ---
          if (options.calculateCubes || options.calculateSR) {
              let tableCubeV     = mergeVoucherTable(tableCache.tableCubeR, tableCache.tableVoucher, "cube");
              let tableCubeH     = generateTable(["ambrosiaHyperflux"], "cube");
              tableCache.tableCubeTotal = mergeTables(tableCubeV, tableCubeH, "cube")
          }

          if (options.calculateCubes) {
            HSLogger.debug(() => '[HeaterDiag] calculateCubes', 'HSHeaterOptimizer');
            let loadoutCube = findOpt(tableCache.tableCubeTotal, tableCache.tableLuckCube, "cube")
            if (!loadoutCube) HSLogger.error('[HeaterDiag] calculateCubes - findOpt returned undefined', 'HSHeaterOptimizer');
            output.cubes = [loadoutCube.generateOutput("cube", maxLoadout)];
          }

          // --- Shared oct table ---
          if (options.calculateOct || options.calculateAmbOct || options.calculateGen) {
              tableCache.tableOctV = mergeVoucherTable(tableCache.tableOctCube, tableCache.tableVoucher, "oct");
          }

          // --- calculateOct ---
          if (options.calculateOct) {
              HSLogger.debug(() => '[HeaterDiag] calculateOct', 'HSHeaterOptimizer');
              let loadoutOct = findOpt(tableCache.tableOctV, tableCache.tableLuckOct, "oct")
              if (!loadoutOct) HSLogger.error('[HeaterDiag] calculateOct - findOpt returned undefined', 'HSHeaterOptimizer');
              output.oct = [loadoutOct.generateOutput("oct", maxLoadout)];

              if (stats.ossifiedTactics < redUpgrades.regularLuck.maxLevel || stats.ossifiedTactics2 < redUpgrades.regularLuck2.maxLevel) {
                  stats.baseLuck += 2;
                  let loadoutNext = findOpt(tableCache.tableOctV, tableCache.tableLuckCube, "oct");
                  let effect = loadoutNext.getStat("oct") / loadoutOct.getStat("oct");
                  redAmbUpgradeEffects.ossifiedTactics = {
                      ...(redAmbUpgradeEffects.ossifiedTactics ?? {}),
                      octEffect: effect,
                  };
                  stats.baseLuck -= 2;
              }

              if (stats.redberries < redUpgrades.blueberries.maxLevel) {
                  stats.blueberries++;
                  let loadoutNext = findOpt(tableCache.tableOctV, tableCache.tableLuckCube, "oct");
                  let effect = loadoutNext.getStat("oct") / loadoutOct.getStat("oct");
                  redAmbUpgradeEffects.blueberries = {
                      ...(redAmbUpgradeEffects.blueberries ?? {}),
                      octEffect: effect,
                  };
                  stats.blueberries--;
              }

              if (stats.bonus[1] < 5) {
                  stats.bonus[1]++;
                  let loadoutNext = findOpt(tableCache.tableOctV, tableCache.tableLuckCube, "oct");
                  let effect = loadoutNext.getStat("oct") / loadoutOct.getStat("oct");
                  redAmbUpgradeEffects.freeLevelsRow2 = {
                      ...(redAmbUpgradeEffects.freeLevelsRow2 ?? {}),
                      octEffect: effect,
                  };
                  stats.bonus[1]--;
              }

              if (stats.bonus[2] < 5) {
                  stats.bonus[2]++;
                  let loadoutNext = findOpt(tableCache.tableOctV, tableCache.tableLuckCube, "oct");
                  let effect = loadoutNext.getStat("oct") / loadoutOct.getStat("oct");
                  redAmbUpgradeEffects.freeLevelsRow3 = {
                      ...(redAmbUpgradeEffects.freeLevelsRow3 ?? {}),
                      octEffect: effect,
                  };
                  stats.bonus[2]--;
              }

              if (stats.bonus[3] < 5) {
                  stats.bonus[3]++;
                  let loadoutNext = findOpt(tableCache.tableOctV, tableCache.tableLuckCube, "oct");
                  let effect = loadoutNext.getStat("oct") / loadoutOct.getStat("oct");
                  redAmbUpgradeEffects.freeLevelsRow4 = {
                      ...(redAmbUpgradeEffects.freeLevelsRow4 ?? {}),
                      octEffect: effect,
                  };
                  stats.bonus[3]--;
              }

              if (stats.bonus[4] < 5) {
                  stats.bonus[4]++;
                  let loadoutNext = findOpt(tableCache.tableOctV, tableCache.tableLuckCube, "oct");
                  let effect = loadoutNext.getStat("oct") / loadoutOct.getStat("oct");
                  redAmbUpgradeEffects.freeLevelsRow5 = {
                      ...(redAmbUpgradeEffects.freeLevelsRow5 ?? {}),
                      octEffect: effect,
                  };
                  stats.bonus[4]--;
              }

              if (!stats.viscount) {
                  stats.baseLuck += 125;
                  let loadoutNext = findOpt(tableCache.tableOctV, tableCache.tableLuckCube, "oct");
                  let effect = loadoutNext.getStat("oct") / loadoutOct.getStat("oct");
                  redAmbUpgradeEffects.viscount = {
                      ...(redAmbUpgradeEffects.viscount ?? {}),
                      octEffect: effect,
                  };
                  stats.baseLuck -= 125;
              }
          }

          // --- calculateOff: Obt + Off ---
          if (options.calculateOff) {
              HSLogger.debug(() => '[HeaterDiag] calculateOff: obt', 'HSHeaterOptimizer');
              let tableSing    = generateTable([stats.exalt > 0 ? "ambrosiaSingReduction2" : "ambrosiaSingReduction1"], "mOff")
              const tableObtBase = generateDependentChainTable(["ambrosiaBaseObtainium1", "ambrosiaBaseObtainium2"], "obt");
              let tableObt1    = mergeTables(
                tableObtBase,
                generateTable(["ambrosiaFreeObtainiumUpgrades"], "obt"),
                "obt"
              );
              let tableObt2    = generateTable(["ambrosiaObtainium1"], "obt");
              let tableObt3    = mergeTables(tableObt1, tableObt2, "obt");

              const tableOffBase = generateDependentChainTable(["ambrosiaBaseOffering1", "ambrosiaBaseOffering2"], "off")
              let tableOff1    = mergeTables(
                tableOffBase,
                generateTable(["ambrosiaFreeOfferingUpgrades"], "off"),
                "off"
              )
              let tableOff2    = generateTable(["ambrosiaOffering1"], "off")
              let tableOff3    = mergeTables(tableOff1, tableOff2, "off")

              let tableObtOff  = mergeTables(tableObt3, tableOff3, "obt")
              let tableObt4    = mergeTables(tableObtOff, tableCache.tableVoucher, "obt")
              let tableObtSing = mergeTables(tableObt4, tableSing, "obt");
              let tableObtRune = mergeIndependentTables(tableObtSing, tableCache.tableRune, "obt")
              let loadoutObt   = findOpt(tableObtRune, tableCache.tableLuck, "obt");
              if (!loadoutObt) HSLogger.error('[HeaterDiag] calculateOff: obt - findOpt returned undefined', 'HSHeaterOptimizer');
              output.obt = [loadoutObt.generateOutput("obt", maxLoadout)];

              HSLogger.debug(() => '[HeaterDiag] calculateOff: off', 'HSHeaterOptimizer');
              let tableOffObt  = mergeTables(tableObt3, tableOff3, "obt")
              let tableOff4    = mergeTables(tableOffObt, tableCache.tableVoucher, "off")
              let tableOffSing = mergeTables(tableOff4, tableSing, "off")
              let tableOffRune = mergeIndependentTables(tableOffSing, tableCache.tableRune, "off")
              let loadoutOff   = findOpt(tableOffRune, tableCache.tableLuck, "off")
              if (!loadoutOff) HSLogger.error('[HeaterDiag] calculateOff: off - findOpt returned undefined', 'HSHeaterOptimizer');
              output.off = [loadoutOff.generateOutput("off", maxLoadout)];
          }

          if (options.calculateSR) {

            HSLogger.debug(() => '[HeaterDiag] calculateSR: sr1', 'HSHeaterOptimizer');
            let exalt = stats.exalt
            let postAoAG = stats.postAoAG
            stats.postAoAG = false

            stats.exalt = 0
            let loadoutSR1 = generateTable(["ambrosiaSingReduction1"], "singReduction").at(-1)!
            let levelSR1 = loadoutSR1.upgradeLevels.ambrosiaSingReduction1
            let tableSR1Cube = tableCache.tableCubeTotal.map(loadout => new Loadout(loadout))
            tableSR1Cube = tableSR1Cube.filter(loadout => loadout.upgradeLevels.ambrosiaHyperflux >= 4)
            tableSR1Cube.forEach(loadout => loadout.upgradeLevels.ambrosiaSingReduction1 = levelSR1)
            if (tableSR1Cube.length === 0) {
                // No cube-optimal loadout reaches ambrosiaHyperflux >= 4 within budget - nothing affordable to report for sr1
                HSLogger.warn('[HeaterDiag] calculateSR: sr1 - no loadout with ambrosiaHyperflux >= 4 within budget, reporting Unaffordable', 'HSHeaterOptimizer');
                output.sr1 = [["Unaffordable", null, "N / A", "N / A", "N / A", "N / A", false]];
            } else {
                loadoutSR1 = findOpt(tableSR1Cube, tableCache.tableLuckCube, "cube")
                if (!loadoutSR1) HSLogger.error('[HeaterDiag] calculateSR: sr1 - findOpt returned undefined', 'HSHeaterOptimizer');
                output.sr1 = [loadoutSR1.generateOutput("singReduction", maxLoadout)];
            }

            HSLogger.debug(() => '[HeaterDiag] calculateSR: sr2', 'HSHeaterOptimizer');
            stats.exalt = 7
            let loadoutSR2 = generateTable(["ambrosiaSingReduction2"], "singReduction").at(-1)!
            let levelSR2 = loadoutSR2.upgradeLevels.ambrosiaSingReduction2
            let tableSR2Cube = tableCache.tableCubeTotal.map(loadout => new Loadout(loadout))
            tableSR2Cube.forEach(loadout => loadout.upgradeLevels.ambrosiaSingReduction2 = levelSR2)
            loadoutSR2 = findOpt(tableSR2Cube, tableCache.tableLuckCube, "cube")
            if (!loadoutSR2) HSLogger.error('[HeaterDiag] calculateSR: sr2 - findOpt returned undefined', 'HSHeaterOptimizer');
            output.sr2 = [loadoutSR2.generateOutput("singReduction", maxLoadout)];
            stats.exalt = exalt
            stats.postAoAG = postAoAG
          }

          // --- calculateAmbOct ---
          if (options.calculateAmbOct) {
              HSLogger.debug(() => '[HeaterDiag] calculateAmbOct', 'HSHeaterOptimizer');
              let loadoutAmbBase = findOpt(tableCache.tableLuckAdd, tableCache.tableAllAmb, "allAmb");
              let loadoutAmbOct  = findOpt([loadoutAmbBase], tableCache.tableOctV, "ambOct");
              if (!loadoutAmbBase || !loadoutAmbOct) HSLogger.error('[HeaterDiag] calculateAmbOct - findOpt returned undefined', 'HSHeaterOptimizer');
              output.ambOct = [loadoutAmbOct.generateOutput("oct", maxLoadout)];
          }

          // --- calculateGen ---
          if (options.calculateGen) {
              HSLogger.debug(() => '[HeaterDiag] calculateGen', 'HSHeaterOptimizer');
              let genOutput: HeaterResultRowMatrix = [];
              for (let level = 1; level <= upgrades.ambrosiaFreeGenerationUpgrades.maxLevel; level++) {
                  let budget = stats.amb - upgrades.ambrosiaFreeGenerationUpgrades.cost(level);
                  if (budget < 0) {
                      genOutput.push(maxLoadout.generateOutput("", maxLoadout));
                      continue;
                  }
                  let loadoutGen = findOpt(tableCache.tableOctV, tableCache.tableLuckOct, "oct", budget)
                  if (!loadoutGen) HSLogger.error(`[HeaterDiag] calculateGen level=${level} - findOpt returned undefined`, 'HSHeaterOptimizer');
                  loadoutGen.upgradeLevels.ambrosiaFreeGenerationUpgrades = level;
                  genOutput.push(loadoutGen.generateOutput("oct", maxLoadout));
              }
              output.gen = genOutput;
          }

          // --- calculateHyperflux ---
          if (options.calculateHyperflux) {

              HSLogger.debug(() => '[HeaterDiag] calculateHyperflux', 'HSHeaterOptimizer');
              let postAoAG = stats.postAoAG
              stats.postAoAG = false

              // Reuse the shared canonical voucher frontier; rebuilding it for
              // Hyperflux repeats prerequisite/cost work without adding any
              // candidates.
              const tableVoucher = tableCache.tableVoucher
              let tableCubeV = mergeVoucherTable(tableCache.tableCubeR, tableVoucher, "cube")
              let tableSing = generateTable([stats.exalt > 0 ? "ambrosiaSingReduction2" : "ambrosiaSingReduction1"], "cube")
              let tableCubeVS = mergeTables(tableCubeV, tableSing, "cube")

              let loadoutsH: (Loadout | undefined)[] = new Array(8).fill(undefined);
              let thresholds: number[] = new Array(8).fill(0);

              for (let h = 0; h <= upgrades.ambrosiaHyperflux.maxLevel; h++) {
                  let budget = stats.amb - upgrades.ambrosiaHyperflux.cost(h);
                  let tableCubeVX = tableCubeV
                  if (stats.exalt !== 0 || h >= (upgrades.ambrosiaSingReduction1.prerequisites.ambrosiaHyperflux ?? 0)) {
                    tableCubeVX = tableCubeVS
                    if (stats.exalt === 0)
                      budget += upgrades.ambrosiaHyperflux.cost(upgrades.ambrosiaSingReduction1.prerequisites.ambrosiaHyperflux ?? 0)
                  }
                  if (budget < 0)
                      break;
                  loadoutsH[h] = findOpt(tableCubeVX, tableCache.tableLuckCube, "cube", budget);
                  thresholds[h] = 0;
                  for (let p = h - 1; p >= 0; p--) {
                      if (thresholds[p] > 50)
                          continue;
                      thresholds[h] = loadoutsH[p]!.getStat("cube") / loadoutsH[h]!.getStat("cube");
                      thresholds[h] = Math.log2(thresholds[h]) / Math.log2((1 + 0.01 * h) / (1 + 0.01 * p));
                      thresholds[h] = Math.max(0, Math.ceil(thresholds[h]));
                      if (thresholds[h] > Math.min(50, thresholds[p]))
                          break;
                      thresholds[p] = Infinity;
                  }
                  loadoutsH[h]!.upgradeLevels.ambrosiaHyperflux = h;
              }

              loadoutsH.length = upgrades.ambrosiaHyperflux.maxLevel + 1

              let hyperOutput: HeaterResultRowMatrix = [];
              for (let i = 0; i <= upgrades.ambrosiaHyperflux.maxLevel; i++) {
                  let maxLoadoutH = new Loadout(maxLoadout);
                  maxLoadoutH.upgradeLevels.ambrosiaHyperflux = i;
                  if (loadoutsH[i] === undefined) {
                      hyperOutput.push(maxLoadout.generateOutput("", maxLoadout));
                  } else {
                      // Calculating effect without hyperflux
                      loadoutsH[i]!.upgradeLevels.ambrosiaHyperflux = 0; // Resetting hyperflux level to compute effect without it
                      loadoutsH[i]!.getStat("cube", true); // Updating cache
                      loadoutsH[i]!.upgradeLevels.ambrosiaHyperflux = i; // Restoring hyperflux level for correct output
                      hyperOutput.push(loadoutsH[i]!.generateOutput("cube", maxLoadoutH, thresholds[i]));
                  }
              }
              output.hyperflux = hyperOutput;

              stats.postAoAG = postAoAG;

          }

          if (Object.keys(redAmbUpgradeEffects).length > 0) {
              output.redAmbUpgradeEffects = redAmbUpgradeEffects;
          }

          return output;

        } catch (e) {
            HSLogger.error(`[HeaterDiag] createHeaterOptimizerResultFromInput crashed: ${e instanceof Error ? e.stack ?? e.message : e}`, 'HSHeaterOptimizer');
            HSLogger.error(`[HeaterDiag] options at crash time: ${JSON.stringify(options)}`, 'HSHeaterOptimizer');
            HSLogger.error(`[HeaterDiag] input at crash time: ${JSON.stringify(input)}`, 'HSHeaterOptimizer');
            throw e;
        }
    }
}
