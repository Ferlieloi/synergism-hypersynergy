import { AchievementRewards, HepteractEffectiveValues, RedAmbrosiaUpgradeCalculationCollection, AmbrosiaUpgradeCalculationCollection, AntUpgrades, SingularityChallengeDataKeys, ISingularityChallengeData, GoldenQuarkUpgradeKey, OcteractUpgradeKey, TalismanKeys, RuneKeys } from "../../../types/data-types/hs-gamedata-api-types"
import { PlayerData } from "../../../types/data-types/hs-player-savedata";

export const CASH_GRAB_ULTRA_QUARK = 0.08;
export const CASH_GRAB_ULTRA_CUBE = 1.2;
export const CASH_GRAB_ULTRA_BLUEBERRY = 0.15;

export const EX_ULTRA_OFFERING = 0.125;
export const EX_ULTRA_OBTAINIUM = 0.125;
export const EX_ULTRA_CUBES = 0.125;

export const hepteractEffectiveValues: HepteractEffectiveValues = {
  chronos: {
    LIMIT: 1000,
    DR: 1 / 6
  },
  hyperrealism: {
    LIMIT: 1000,
    DR: 0.33
  },
  quark: {
    LIMIT: 1000,
    DR: 0.5
  },
  challenge: {
    LIMIT: 1000,
    DR: 1 / 6
  },
  abyss: {
    LIMIT: 1,
    DR: 0
  },
  accelerator: {
    LIMIT: 1000,
    DR: 0.2
  },
  acceleratorBoost: {
    LIMIT: 1000,
    DR: 0.2
  },
  multiplier: {
    LIMIT: 1000,
    DR: 0.2
  }
}

export const challenge15Rewards = {
  cube1: {
    value: 1,
    baseValue: 1,
    requirement: 750
  },
  ascensions: {
    value: 1,
    baseValue: 1,
    requirement: 1500
  },
  coinExponent: {
    value: 1,
    baseValue: 1,
    requirement: 3000
  },
  taxes: {
    value: 1,
    baseValue: 1,
    requirement: 5000
  },
  obtainium: {
    value: 1,
    baseValue: 1,
    requirement: 7500
  },
  offering: {
    value: 1,
    baseValue: 1,
    requirement: 7500
  },
  accelerator: {
    value: 1,
    baseValue: 1,
    requirement: 10000
  },
  multiplier: {
    value: 1,
    baseValue: 1,
    requirement: 10000
  },
  runeExp: {
    value: 1,
    baseValue: 1,
    requirement: 20000
  },
  runeBonus: {
    value: 1,
    baseValue: 1,
    requirement: 40000
  },
  cube2: {
    value: 1,
    baseValue: 1,
    requirement: 60000
  },
  transcendChallengeReduction: {
    value: 1,
    baseValue: 1,
    requirement: 100000
  },
  reincarnationChallengeReduction: {
    value: 1,
    baseValue: 1,
    requirement: 100000
  },
  antSpeed: {
    value: 1,
    baseValue: 1,
    requirement: 200000
  },
  bonusAntLevel: {
    value: 1,
    baseValue: 1,
    requirement: 500000
  },
  cube3: {
    value: 1,
    baseValue: 1,
    requirement: 1000000
  },
  talismanBonus: {
    value: 1,
    baseValue: 1,
    requirement: 3000000
  },
  globalSpeed: {
    value: 1,
    baseValue: 1,
    requirement: 1e7
  },
  blessingBonus: {
    value: 1,
    baseValue: 1,
    requirement: 3e7
  },
  constantBonus: {
    value: 1,
    baseValue: 1,
    requirement: 1e8
  },
  cube4: {
    value: 1,
    baseValue: 1,
    requirement: 5e8
  },
  spiritBonus: {
    value: 1,
    baseValue: 1,
    requirement: 2e9
  },
  score: {
    value: 1,
    baseValue: 1,
    requirement: 1e10
  },
  quarks: {
    value: 1,
    baseValue: 1,
    requirement: 1e11,
    HTMLColor: 'lightgoldenrodyellow'
  },
  hepteractsUnlocked: {
    value: 0,
    baseValue: 0,
    requirement: 1e15,
    HTMLColor: 'pink'
  },
  challengeHepteractUnlocked: {
    value: 0,
    baseValue: 0,
    requirement: 2e15,
    HTMLColor: 'red'
  },
  cube5: {
    value: 1,
    baseValue: 1,
    requirement: 4e15
  },
  powder: {
    value: 1,
    baseValue: 1,
    requirement: 7e15
  },
  abyssHepteractUnlocked: {
    value: 0,
    baseValue: 0,
    requirement: 1e16
  },
  exponent: {
    value: 1,
    baseValue: 1,
    requirement: 2e16
  },
  acceleratorHepteractUnlocked: {
    value: 0,
    baseValue: 0,
    requirement: 3.33e16,
    HTMLColor: 'orange'
  },
  acceleratorBoostHepteractUnlocked: {
    value: 0,
    baseValue: 0,
    requirement: 3.33e16,
    HTMLColor: 'cyan'
  },
  multiplierHepteractUnlocked: {
    value: 0,
    baseValue: 0,
    requirement: 3.33e16,
    HTMLColor: 'purple'
  },
  freeOrbs: {
    value: 0,
    baseValue: 0,
    requirement: 2e17,
    HTMLColor: 'pink'
  },
  ascensionSpeed: {
    value: 1,
    baseValue: 1,
    requirement: 1.5e18,
    HTMLColor: 'orange'
  }
};

export const goldenQuarkUpgradeMaxLevels: Record<GoldenQuarkUpgradeKey, GoldenQuarkUpgradeDef> = {
  goldenQuarks1: { maxLevel: 15 },
  goldenQuarks2: { maxLevel: 75 },
  goldenQuarks3: { maxLevel: 1000 },
  starterPack: { maxLevel: 1 },
  wowPass: { maxLevel: 1 },
  cookies: { maxLevel: 1 },
  cookies2: { maxLevel: 1 },
  cookies3: { maxLevel: 1 },
  cookies4: { maxLevel: 1 },
  cookies5: { maxLevel: 1 },
  ascensions: { maxLevel: -1 },
  corruptionFourteen: { maxLevel: 1 },
  corruptionFifteen: { maxLevel: 1 },
  singOfferings1: { maxLevel: -1 },
  singOfferings2: { maxLevel: 25 },
  singOfferings3: { maxLevel: 40 },
  singObtainium1: { maxLevel: -1 },
  singObtainium2: { maxLevel: 25 },
  singObtainium3: { maxLevel: 40 },
  singCubes1: { maxLevel: -1 },
  singCubes2: { maxLevel: 25 },
  singCubes3: { maxLevel: 40 },
  singCitadel: { maxLevel: -1 },
  singCitadel2: { maxLevel: 100 },
  octeractUnlock: { maxLevel: 1 },
  singOcteractPatreonBonus: { maxLevel: 1 },
  offeringAutomatic: { maxLevel: -1 },
  intermediatePack: { maxLevel: 1 },
  advancedPack: { maxLevel: 1 },
  expertPack: { maxLevel: 1 },
  masterPack: { maxLevel: 1 },
  divinePack: { maxLevel: 1 },
  wowPass2: { maxLevel: 1 },
  wowPass3: { maxLevel: 1 },
  potionBuff: { maxLevel: 10 },
  potionBuff2: { maxLevel: 10 },
  potionBuff3: { maxLevel: 10 },
  singChallengeExtension: { maxLevel: 4 },
  singChallengeExtension2: { maxLevel: 3 },
  singChallengeExtension3: { maxLevel: 3 },
  singQuarkImprover1: { maxLevel: 30 },
  singQuarkHepteract: { maxLevel: 10 },
  singQuarkHepteract2: { maxLevel: 10 },
  singQuarkHepteract3: { maxLevel: 10 },
  singOcteractGain: { maxLevel: -1 },
  singOcteractGain2: { maxLevel: 25 },
  singOcteractGain3: { maxLevel: 50 },
  singOcteractGain4: { maxLevel: 100 },
  singOcteractGain5: { maxLevel: 200 },
  platonicTau: { maxLevel: 1 },
  platonicAlpha: { maxLevel: 1 },
  platonicDelta: { maxLevel: 1 },
  platonicPhi: { maxLevel: 1 },
  singFastForward: { maxLevel: 1 },
  singFastForward2: { maxLevel: 1 },
  singAscensionSpeed: { maxLevel: 1 },
  singAscensionSpeed2: { maxLevel: 30 },
  ultimatePen: { maxLevel: 1 },
  halfMind: { maxLevel: 1 },
  oneMind: { maxLevel: 1 },
  wowPass4: { maxLevel: 1 },
  blueberries: { maxLevel: 10 },
  singAmbrosiaLuck: { maxLevel: -1 },
  singAmbrosiaLuck2: { maxLevel: 30 },
  singAmbrosiaLuck3: { maxLevel: 30 },
  singAmbrosiaLuck4: { maxLevel: 50 },
  singAmbrosiaGeneration: { maxLevel: -1 },
  singAmbrosiaGeneration2: { maxLevel: 20 },
  singAmbrosiaGeneration3: { maxLevel: 35 },
  singAmbrosiaGeneration4: { maxLevel: 50 },
  singBonusTokens1: { maxLevel: 5 },
  singBonusTokens2: { maxLevel: 5 },
  singBonusTokens3: { maxLevel: 5 },
  singBonusTokens4: { maxLevel: 30 },
  singInfiniteShopUpgrades: { maxLevel: 80 },
  singTalismanBonusRunes1: {
    maxLevel: 5,
    effect: (n: number) => {
      return n / 100
    },
  },
  singTalismanBonusRunes2: {
    maxLevel: 5,
    effect: (n: number) => {
      return n / 100
    },
  },
  singTalismanBonusRunes3: {
    maxLevel: 5,
    effect: (n: number) => {
      return n / 100
    },
  },
  singTalismanBonusRunes4: {
    maxLevel: 10,
    effect: (n: number) => {
      return n / 100
    },
  },
  favoriteUpgrade: { maxLevel: 100 },
};

export const octeractUpgradeMaxLevels: Record<OcteractUpgradeKey, OcteractUpgradeDef> = {
  octeractStarter: { maxLevel: 1 },
  octeractGain: { maxLevel: 1e8 },
  octeractGain2: { maxLevel: -1 },
  octeractQuarkGain: { maxLevel: 20000 },
  octeractQuarkGain2: { maxLevel: 5 },
  octeractCorruption: { maxLevel: 2 },
  octeractGQCostReduce: { maxLevel: 50 },
  octeractExportQuarks: { maxLevel: 100 },
  octeractImprovedDaily: { maxLevel: 50 },
  octeractImprovedDaily2: { maxLevel: 50 },
  octeractImprovedDaily3: { maxLevel: -1 },
  octeractImprovedQuarkHept: { maxLevel: 25 },
  octeractImprovedGlobalSpeed: { maxLevel: 1000 },
  octeractImprovedAscensionSpeed: { maxLevel: 100 },
  octeractImprovedAscensionSpeed2: { maxLevel: 250 },
  octeractImprovedFree: {
    maxLevel: 1, effect: (n: number) => {
      return n
    },
  },
  octeractImprovedFree2: {
    maxLevel: 1, effect: (n: number) => {
      return 0.05 * n
    },
  },
  octeractImprovedFree3: {
    maxLevel: 1, effect: (n: number) => {
      return 0.05 * n
    },
  },
  octeractImprovedFree4: {
    maxLevel: 40, effect: (n: number) => {
      return 0.001 * n + ((n > 0) ? 0.01 : 0)
    },
  },
  octeractSingUpgradeCap: { maxLevel: 10 },
  octeractOfferings1: { maxLevel: -1 },
  octeractObtainium1: { maxLevel: -1 },
  octeractAscensions: { maxLevel: 1000000 },
  octeractAscensions2: { maxLevel: -1 },
  octeractAscensionsOcteractGain: { maxLevel: -1 },
  octeractFastForward: { maxLevel: 2 },
  octeractAutoPotionSpeed: { maxLevel: -1 },
  octeractAutoPotionEfficiency: { maxLevel: 100 },
  octeractOneMindImprover: { maxLevel: 20 },
  octeractAmbrosiaLuck: { maxLevel: -1 },
  octeractAmbrosiaLuck2: { maxLevel: 30 },
  octeractAmbrosiaLuck3: { maxLevel: 30 },
  octeractAmbrosiaLuck4: { maxLevel: 50 },
  octeractAmbrosiaGeneration: { maxLevel: -1 },
  octeractAmbrosiaGeneration2: { maxLevel: 20 },
  octeractAmbrosiaGeneration3: { maxLevel: 35 },
  octeractAmbrosiaGeneration4: { maxLevel: 50 },
  octeractBonusTokens1: { maxLevel: 10 },
  octeractBonusTokens2: { maxLevel: 5 },
  octeractBonusTokens3: { maxLevel: 5 },
  octeractBonusTokens4: { maxLevel: 50 },
  octeractBlueberries: { maxLevel: 6 },
  octeractInfiniteShopUpgrades: { maxLevel: 80 },
  octeractTalismanLevelCap1: { maxLevel: 25 },
  octeractTalismanLevelCap2: { maxLevel: 35 },
  octeractTalismanLevelCap3: { maxLevel: 40 },
  octeractTalismanLevelCap4: { maxLevel: -1 },
};

type GoldenQuarkUpgradeDef = {
  maxLevel: number
  effect?: (n: number) => number
}

type OcteractUpgradeDef = {
  maxLevel: number
  effect?: (n: number) => number
}

export const SINGULARITY_CHALLENGE_DATA: Record<
  SingularityChallengeDataKeys,
  ISingularityChallengeData
> = {
  noSingularityUpgrades: {
    achievementPointValue: (n: number) => {
      return 5 * n + 5 * Math.max(0, n - 15)
    },
    effect: (n: number) => {
      return {
        cubes: 1 + 0.5 * n,
        goldenQuarks: 1 + 0.12 * +(n > 0),
        blueberries: +(n > 0),
        shopUpgrade: n >= 20,
        luckBonus: n >= 30 ? 0.05 : 0,
        shopUpgrade2: n >= 30
      }
    }
  },
  oneChallengeCap: {
    achievementPointValue: (n: number) => {
      return 5 * n + 5 * Math.max(0, n - 12)
    },
    effect: (n: number) => {
      return {
        corrScoreIncrease: 0.03 * n,
        blueberrySpeedMult: (1 + n / 100),
        capIncrease: 3 * +(n > 0),
        freeCorruptionLevel: n >= 20,
        shopUpgrade: n >= 20,
        reinCapIncrease2: 7 * +(n >= 25),
        ascCapIncrease2: 2 * +(n >= 25)
      }
    }
  },
  noOcteracts: {
    achievementPointValue: (n: number) => {
      return 10 * n + 5 * Math.max(0, n - 7)
    },
    effect: (n: number) => {
      return {
        octeractPow: (n <= 10) ? 0.02 * n : 0.2 + (n - 10) / 100,
        offeringBonus: n > 0,
        obtainiumBonus: n >= 10,
        shopUpgrade: n >= 10
      }
    }
  },
  limitedAscensions: {
    achievementPointValue: (n: number) => {
      return 5 * n + 5 * Math.max(0, n - 10)
    },
    effect: (n: number) => {
      return {
        ascensionSpeedMult: (0.1 * n) / 100,
        hepteractCap: n > 0,
        shopUpgrade0: n >= 20,
        shopUpgrade: n >= 25
      }
    }
  },
  noAmbrosiaUpgrades: {
    achievementPointValue: (n: number) => {
      return 10 * n + 5 * Math.max(0, n - 10)
    },
    effect: (n: number) => {
      return {
        bonusAmbrosia: +(n > 0),
        blueberries: Math.floor(n / 10) + +(n > 0),
        luckBonus: n / 200,
        additiveLuck: 15 * n,
        redLuck: 4 * n,
        blueberrySpeedMult: (1 + n / 50),
        redSpeedMult: 1 + n / 100,
        shopUpgrade: n >= 15,
        shopUpgrade2: n >= 20
      }
    }
  },
  limitedTime: {
    achievementPointValue: (n: number) => {
      return 10 * n + 5 * Math.max(0, n - 10) + 5 * Math.max(0, n - 20) + 10 * Math.max(0, n - 25)
    },
    effect: (n: number) => {
      return {
        preserveQuarks: +(n > 0),
        quarkMult: 1 + 0.01 * n,
        globalSpeed: 0.06 * n,
        ascensionSpeed: 0.06 * n,
        barRequirementMultiplier: 1 - 0.01 * n,
        tier1Upgrade: n >= 15,
        tier2Upgrade: n >= 25
      }
    },
  },
  sadisticPrequel: {
    achievementPointValue: (n: number) => {
      return 10 * n + 5 * Math.max(0, n - 10) + 5 * Math.max(0, n - 20) + 5 * Math.max(0, n - 25)
    },
    effect: (n: number) => {
      return {
        extraFree: 50 * +(n > 0),
        quarkMult: 1 + 0.03 * n,
        freeUpgradeMult: 0.03 * n,
        shopUpgrade: n >= 10,
        shopUpgrade2: n >= 20,
        shopUpgrade3: n >= 30
      }
    }
  },
  taxmanLastStand: {
    achievementPointValue: (n: number) => {
      return 50 * n
    },
    effect: (n: number) => {
      return {
        horseShoeUnlock: n > 0,
        shopUpgrade: n >= 5,
        talismanUnlock: n >= 10,
        talismanFreeLevel: 25 * n,
        talismanRuneEffect: 0.03 * n,
        antiquityOOM: 1 / 50 * n / 10,
        horseShoeOOM: 1 / 20 * n / 10
      }
    },
  }
}


// https://github.com/Pseudo-Corp/SynergismOfficial/blob/master/src/Calculate.ts#L1678
export const calculateSigmoid = (
  constant: number,
  factor: number,
  divisor: number
) => {
  return 1 + (constant - 1) * (1 - Math.pow(2, -factor / divisor))
}

// https://github.com/Pseudo-Corp/SynergismOfficial/blob/master/src/Variables.ts#L454
export const c15Functions: { [key in keyof typeof challenge15Rewards]: (e: number) => number } = {
  cube1: (e: number) => 1 + ((1 / 50) * Math.log2(e / 175)),
  ascensions: (e: number) => 1 + ((1 / 20) * Math.log2(e / 375)),
  coinExponent: (e: number) => 1 + ((1 / 150) * Math.log2(e / 750)),
  taxes: (e: number) => Math.pow(0.98, Math.log(e / 1.25e3) / Math.log(2)),
  obtainium: (e: number) => 1 + (1 / 4) * Math.pow(e / 7.5e3, 0.6),
  offering: (e: number) => 1 + (1 / 4) * Math.pow(e / 7.5e3, 0.8),
  accelerator: (e: number) => 1 + ((1 / 20) * Math.log(e / 2.5e3)) / Math.log(2),
  multiplier: (e: number) => 1 + ((1 / 20) * Math.log(e / 2.5e3)) / Math.log(2),
  runeExp: (e: number) => 1 + Math.pow(e / 2e4, 1.5),
  runeBonus: (e: number) => 1 + ((1 / 33) * Math.log(e / 1e4)) / Math.log(2),
  cube2: (e: number) => 1 + ((1 / 100) * Math.log(e / 1.5e4)) / Math.log(2),
  transcendChallengeReduction: (e: number) => Math.pow(0.98, Math.log(e / 2.5e4) / Math.log(2)),
  reincarnationChallengeReduction: (e: number) => Math.pow(0.98, Math.log(e / 2.5e4) / Math.log(2)),
  antSpeed: (e: number) => Math.pow(1 + Math.log(e / 2e5) / Math.log(2), 4),
  bonusAntLevel: (e: number) => 1 + ((1 / 20) * Math.log(e / 1.5e5)) / Math.log(2),
  cube3: (e: number) => 1 + ((1 / 150) * Math.log(e / 2.5e5)) / Math.log(2),
  talismanBonus: (e: number) => 1 + ((1 / 20) * Math.log(e / 7.5e5)) / Math.log(2),
  globalSpeed: (e: number) => 1 + ((1 / 20) * Math.log(e / 2.5e6)) / Math.log(2),
  blessingBonus: (e: number) => 1 + (1 / 5) * Math.pow(e / 3e7, 1 / 4),
  constantBonus: (e: number) => 1 + (1 / 5) * Math.pow(e / 1e8, 2 / 3),
  cube4: (e: number) => 1 + ((1 / 200) * Math.log(e / 1.25e8)) / Math.log(2),
  spiritBonus: (e: number) => 1 + (1 / 5) * Math.pow(e / 2e9, 1 / 4),
  score: (e: number) =>
    (e >= 1e20)
      ? 1 + (1 / 4) * Math.pow(e / 1e10, 1 / 8) * Math.pow(1e10, 1 / 8)
      : 1 + (1 / 4) * Math.pow(e / 1e10, 1 / 4),
  quarks: (e: number) => 1 + (3 / 400) * Math.log2(e * 32 / 1e11),
  hepteractsUnlocked: (e: number) => e >= 1e15 ? 1 : 0,
  challengeHepteractUnlocked: (e: number) => e >= 2e15 ? 1 : 0,
  cube5: (e: number) => 1 + (1 / 300) * Math.log2(e / (4e15 / 1024)),
  powder: (e: number) => 1 + (1 / 50) * Math.log2(e / (7e15 / 32)),
  abyssHepteractUnlocked: (e: number) => e >= 1e16 ? 1 : 0,
  exponent: (e: number) => calculateSigmoid(1.05, e, 1e18),
  acceleratorHepteractUnlocked: (e: number) => e >= 3.33e16 ? 1 : 0,
  acceleratorBoostHepteractUnlocked: (e: number) => e >= 3.33e16 ? 1 : 0,
  multiplierHepteractUnlocked: (e: number) => e >= 3.33e16 ? 1 : 0,
  freeOrbs: (e: number) => Math.floor(200 * Math.pow(e / 2e17, 0.5)),
  ascensionSpeed: (e: number) => 1 + 5 / 100 + (2 * Math.log2(e / 1.5e18)) / 100
}

export const TALISMAN_RARITY_VALUES: Record<number, number> = {
  0: 0,
  1: 1,
  2: 1.2,
  3: 1.5,
  4: 1.8,
  5: 2.1,
  6: 2.5,
  7: 3,
  8: 3.25,
  9: 3.5,
  10: 4
}

export const TALISMAN_BASE_COEFFICIENTS: Record<TalismanKeys, Record<RuneKeys, number>> = {
  exemption: { speed: 0, duplication: 1.5, prism: 0.75, thrift: 0.75, superiorIntellect: 0, infiniteAscent: 0, antiquities: 0, horseShoe: 0, finiteDescent: 0 },
  chronos: { speed: 1.5, duplication: 0, prism: 0, thrift: 0.75, superiorIntellect: 0.75, infiniteAscent: 0, antiquities: 0, horseShoe: 0, finiteDescent: 0 },
  midas: { speed: 0, duplication: 0.75, prism: 0.75, thrift: 1.5, superiorIntellect: 0, infiniteAscent: 0, antiquities: 0, horseShoe: 0, finiteDescent: 0 },
  metaphysics: { speed: 0.6, duplication: 0.6, prism: 0.6, thrift: 0.6, superiorIntellect: 0.6, infiniteAscent: 0, antiquities: 0, horseShoe: 0, finiteDescent: 0 },
  polymath: { speed: 0.75, duplication: 0.75, prism: 0, thrift: 0, superiorIntellect: 1.5, infiniteAscent: 0, antiquities: 0, horseShoe: 0, finiteDescent: 0 },
  mortuus: { speed: 0.6, duplication: 0.6, prism: 0.6, thrift: 0.6, superiorIntellect: 0.6, infiniteAscent: 0, antiquities: 0, horseShoe: 0, finiteDescent: 0 },
  plastic: { speed: 0.75, duplication: 0, prism: 1.5, thrift: 0, superiorIntellect: 0.75, infiniteAscent: 0.005, antiquities: 0, horseShoe: 0, finiteDescent: 0 },
  wowSquare: { speed: 0, duplication: 1, prism: 1, thrift: 0, superiorIntellect: 1, infiniteAscent: 0, antiquities: 0, horseShoe: 0, finiteDescent: 0 },
  achievement: { speed: 1.4, duplication: 1.4, prism: 1.4, thrift: 1.4, superiorIntellect: 1.4, infiniteAscent: 0.01, antiquities: 0, horseShoe: 0, finiteDescent: 0 },
  cookieGrandma: { speed: 1, duplication: 1, prism: 1, thrift: 1, superiorIntellect: 1, infiniteAscent: 0.01, antiquities: 0, horseShoe: 0, finiteDescent: 0 },
  horseShoe: { speed: 1.2, duplication: 1.2, prism: 1.2, thrift: 1.2, superiorIntellect: 1.2, infiniteAscent: 0, antiquities: 0, horseShoe: 0.01, finiteDescent: 0 }
}

export const regularCostProgressionString = (baseMult: string, level: number): Record<string, string> => {
  const log10Base = Math.log10(parseFloat(baseMult.split('e')[0])) + (parseInt(baseMult.split('e')[1]) || 0);

  let log10PriceMult = log10Base;
  if (level >= 120) {
    log10PriceMult += Math.log10((level - 90) / 30);
  }
  if (level >= 150) {
    log10PriceMult += Math.log10((level - 120) / 30);
  }
  if (level >= 180) {
    log10PriceMult += Math.log10((level - 170) / 10);
  }

  const getCostLog = (l: number, pow: number, div: number) => {
    if (l < 0) return -Infinity;
    return Math.log10(Math.pow(l, pow) / div + 1) + log10PriceMult;
  }

  return {
    shard: `1e${getCostLog(level, 3, 8)}`,
    commonFragment: level >= 30 ? `1e${getCostLog(level - 30, 3, 32)}` : '0',
    uncommonFragment: level >= 60 ? `1e${getCostLog(level - 60, 3, 384)}` : '0',
    rareFragment: level >= 90 ? `1e${getCostLog(level - 90, 3, 500)}` : '0',
    epicFragment: level >= 120 ? `1e${getCostLog(level - 120, 3, 375)}` : '0',
    legendaryFragment: level >= 150 ? `1e${getCostLog(level - 150, 3, 192)}` : '0',
    mythicalFragment: level >= 150 ? `1e${getCostLog(level - 150, 3, 1280)}` : '0'
  }
}

export const exponentialCostProgressionString = (baseMult: string, level: number, ratio: number): Record<string, string> => {
  const log10Base = Math.log10(parseFloat(baseMult.split('e')[0])) + (parseInt(baseMult.split('e')[1]) || 0);

  const getCostLog = (l: number, r: number, mult: number) => {
    return l * Math.log10(r) + log10Base + Math.log10(mult);
  }

  return {
    shard: `1e${getCostLog(level, ratio, 100)}`,
    commonFragment: level >= 30 ? `1e${getCostLog(level - 30, ratio, 50)}` : '0',
    uncommonFragment: level >= 60 ? `1e${getCostLog(level - 60, ratio, 25)}` : '0',
    rareFragment: level >= 90 ? `1e${getCostLog(level - 90, ratio, 20)}` : '0',
    epicFragment: level >= 120 ? `1e${getCostLog(level - 120, ratio, 15)}` : '0',
    legendaryFragment: level >= 150 ? `1e${getCostLog(level - 150, ratio, 10)}` : '0',
    mythicalFragment: level >= 150 ? `1e${getCostLog(level - 150, ratio, 5)}` : '0'
  }
}