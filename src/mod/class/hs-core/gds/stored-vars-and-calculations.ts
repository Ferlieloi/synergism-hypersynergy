import { AchievementRewards, HepteractEffectiveValues, RedAmbrosiaUpgradeCalculationCollection, AmbrosiaUpgradeCalculationCollection, AntUpgrades, SingularityChallengeDataKeys, ISingularityChallengeData, GoldenQuarkUpgradeKey, OcteractUpgradeKey } from "../../../types/data-types/hs-gamedata-api-types"
import { PlayerData } from "../../../types/data-types/hs-player-savedata";

export const CASH_GRAB_ULTRA_QUARK = 0.08;
export const CASH_GRAB_ULTRA_CUBE = 1.2;
export const CASH_GRAB_ULTRA_BLUEBERRY = 0.15;

export const EX_ULTRA_OFFERING = 0.125;
export const EX_ULTRA_OBTAINIUM = 0.125;
export const EX_ULTRA_CUBES = 0.125;

export const ambrosiaUpgradeCalculationCollection: AmbrosiaUpgradeCalculationCollection = {
  ambrosiaTutorial: {
    costPerLevel: 1,
    maxLevel: 10,
    costFunction: (n: number, cpl: number): number =>
      cpl * ((n + 1) ** 2 - n ** 2),
    levelFunction: (n: number): number => n
        effects: (n: number) => {
      const cubeAmount = 1 + 0.05 * n
      const quarkAmount = 1 + 0.01 * n
      return {
        quarks: quarkAmount,
        cubes: cubeAmount
      }
    },
  },

  ambrosiaQuarks1: {
    costPerLevel: 1,
    maxLevel: 100,
    costFunction: (n: number, cpl: number): number =>
      cpl * ((n + 1) ** 3 - n ** 3),
    levelFunction: (n: number): number => n
  },

  ambrosiaCubes1: {
    costPerLevel: 1,
    maxLevel: 100,
    costFunction: (n: number, cpl: number): number =>
      cpl * ((n + 1) ** 3 - n ** 3),
    levelFunction: (n: number): number => n
  },

  ambrosiaLuck1: {
    costPerLevel: 1,
    maxLevel: 100,
    costFunction: (n: number, cpl: number): number =>
      cpl * ((n + 1) ** 3 - n ** 3),
    levelFunction: (n: number): number => n
  },

  ambrosiaQuarkCube1: {
    costPerLevel: 250,
    maxLevel: 25,
    costFunction: (n: number, cpl: number): number =>
      cpl * ((n + 1) ** 3 - n ** 3),
    levelFunction: (n: number): number => n
  },

  ambrosiaLuckCube1: {
    costPerLevel: 250,
    maxLevel: 25,
    costFunction: (n: number, cpl: number): number =>
      cpl * ((n + 1) ** 3 - n ** 3),
    levelFunction: (n: number): number => n
  },

  ambrosiaCubeQuark1: {
    costPerLevel: 500,
    maxLevel: 25,
    costFunction: (n: number, cpl: number): number =>
      cpl * ((n + 1) ** 3 - n ** 3),
    levelFunction: (n: number): number => n
  },

  ambrosiaLuckQuark1: {
    costPerLevel: 500,
    maxLevel: 25,
    costFunction: (n: number, cpl: number): number =>
      cpl * ((n + 1) ** 3 - n ** 3),
    levelFunction: (n: number): number => n
  },

  ambrosiaCubeLuck1: {
    costPerLevel: 100,
    maxLevel: 25,
    costFunction: (n: number, cpl: number): number =>
      cpl * ((n + 1) ** 3 - n ** 3),
    levelFunction: (n: number): number => n
  },

  ambrosiaQuarkLuck1: {
    costPerLevel: 100,
    maxLevel: 25,
    costFunction: (n: number, cpl: number): number =>
      cpl * ((n + 1) ** 3 - n ** 3),
    levelFunction: (n: number): number => n
  },

  ambrosiaQuarks2: {
    costPerLevel: 500,
    maxLevel: 100,
    costFunction: (n: number, cpl: number): number =>
      cpl * ((n + 1) ** 2 - n ** 2),
    levelFunction: (n: number): number => n
  },

  ambrosiaCubes2: {
    costPerLevel: 500,
    maxLevel: 100,
    costFunction: (n: number, cpl: number): number =>
      cpl * ((n + 1) ** 2 - n ** 2),
    levelFunction: (n: number): number => n
  },

  ambrosiaLuck2: {
    costPerLevel: 250,
    maxLevel: 100,
    costFunction: (n: number, cpl: number): number =>
      cpl * ((n + 1) ** 2 - n ** 2),
    levelFunction: (n: number): number => n
  },

  ambrosiaQuarks3: {
    costPerLevel: 750000,
    maxLevel: 10,
    costFunction: (n: number, cpl: number): number =>
      cpl + 50000 * n,
    levelFunction: (n: number): number => n
  },

  ambrosiaCubes3: {
    costPerLevel: 75000,
    maxLevel: 100,
    costFunction: (n: number, cpl: number): number =>
      cpl + 5000 * n,
    levelFunction: (n: number): number => n
  },

  ambrosiaLuck3: {
    costPerLevel: 50000,
    maxLevel: 100,
    costFunction: (_n: number, cpl: number): number =>
      cpl,
    levelFunction: (n: number): number => n
  },

  ambrosiaLuck4: {
    costPerLevel: 250000,
    maxLevel: 50,
    costFunction: (n: number, cpl: number): number =>
      cpl + 20000 * n,
    levelFunction: (n: number): number => n
  },

  ambrosiaPatreon: {
    costPerLevel: 1,
    maxLevel: 1,
    costFunction: (n: number, cpl: number): number =>
      cpl * ((n + 1) ** 2 - n ** 2),
    levelFunction: (n: number): number => n
  },

  ambrosiaObtainium1: {
    costPerLevel: 50000,
    maxLevel: 2,
    costFunction: (n: number, cpl: number): number =>
      cpl * 25 ** n,
    levelFunction: (n: number): number => n
  },

  ambrosiaOffering1: {
    costPerLevel: 50000,
    maxLevel: 2,
    costFunction: (n: number, cpl: number): number =>
      cpl * 25 ** n,
    levelFunction: (n: number): number => n
  },

  ambrosiaHyperflux: {
    costPerLevel: 33333,
    maxLevel: 7,
    costFunction: (n: number, cpl: number): number =>
      (cpl + 33333 * Math.min(4, n)) * Math.max(1, 3 ** (n - 4)),
    levelFunction: (n: number): number => n
  },

  ambrosiaBaseOffering1: {
    costPerLevel: 5,
    maxLevel: 40,
    costFunction: (n: number, cpl: number): number =>
      cpl * ((n + 1) ** 3 - n ** 3),
    levelFunction: (n: number): number => n
  },

  ambrosiaBaseObtainium1: {
    costPerLevel: 40,
    maxLevel: 20,
    costFunction: (n: number, cpl: number): number =>
      cpl * ((n + 1) ** 3 - n ** 3),
    levelFunction: (n: number): number => n
  },

  ambrosiaBaseOffering2: {
    costPerLevel: 20,
    maxLevel: 60,
    costFunction: (n: number, cpl: number): number =>
      cpl * ((n + 1) ** 3 - n ** 3),
    levelFunction: (n: number): number => n
  },

  ambrosiaBaseObtainium2: {
    costPerLevel: 160,
    maxLevel: 30,
    costFunction: (n: number, cpl: number): number =>
      cpl * ((n + 1) ** 3 - n ** 3),
    levelFunction: (n: number): number => n
  },

  ambrosiaSingReduction1: {
    costPerLevel: 100000,
    maxLevel: 2,
    costFunction: (n: number, cpl: number): number =>
      cpl * 99 ** n,
    levelFunction: (n: number): number => n
  },

  ambrosiaInfiniteShopUpgrades1: {
    costPerLevel: 25000,
    maxLevel: 20,
    costFunction: (_n: number, cpl: number): number =>
      cpl,
    levelFunction: (n: number): number => n
  },

  ambrosiaInfiniteShopUpgrades2: {
    costPerLevel: 75000,
    maxLevel: 20,
    costFunction: (_n: number, cpl: number): number =>
      cpl,
    levelFunction: (n: number): number => n
  },

  ambrosiaSingReduction2: {
    costPerLevel: 1.25e7,
    maxLevel: 2,
    costFunction: (n: number, cpl: number): number =>
      cpl * 3 ** n,
    levelFunction: (n: number): number => n
  },

  ambrosiaTalismanBonusRuneLevel: {
    costPerLevel: 100,
    maxLevel: 100,
    costFunction: (n: number, cpl: number): number =>
      cpl * ((n + 1) ** 2 - n ** 2),
    levelFunction: (n: number): number => n
  },

  ambrosiaRuneOOMBonus: {
    costPerLevel: 2500,
    maxLevel: 100,
    costFunction: (n: number, cpl: number): number =>
      Math.ceil(cpl * ((n + 1) ** 1.5 - n ** 1.5)),
    levelFunction: (n: number): number => n
  }
}



export const redAmbrosiaUpgradeCalculationCollection: RedAmbrosiaUpgradeCalculationCollection = {
  blueberryGenerationSpeed: {
    costPerLevel: 1,
    maxLevel: 100,
    costFunction: (n: number, cpl: number) => cpl * (n + 1),
    levelFunction: (n: number) => 1 + n / 500
  },

  blueberryGenerationSpeed2: {
    costPerLevel: 8000,
    maxLevel: 250,
    costFunction: (n: number, cpl: number) => cpl + 0 * n,
    levelFunction: (n: number) => 1 + n / 1000
  },

  freeLevelsRow2: {
    costPerLevel: 10,
    maxLevel: 5,
    costFunction: (n: number, cpl: number) => cpl * Math.pow(2, n),
    levelFunction: (n: number) => n
  },

  freeLevelsRow3: {
    costPerLevel: 250,
    maxLevel: 5,
    costFunction: (n: number, cpl: number) => cpl * Math.pow(2, n),
    levelFunction: (n: number) => n
  },

  freeLevelsRow4: {
    costPerLevel: 5000,
    maxLevel: 5,
    costFunction: (n: number, cpl: number) => cpl * Math.pow(2, n),
    levelFunction: (n: number) => n
  },

  freeLevelsRow5: {
    costPerLevel: 50000,
    maxLevel: 5,
    costFunction: (n: number, cpl: number) => cpl * Math.pow(2, n),
    levelFunction: (n: number) => n
  },

  regularLuck: {
    costPerLevel: 1,
    maxLevel: 100,
    costFunction: (n: number, cpl: number) => cpl * (n + 1),
    levelFunction: (n: number) => 2 * n
  },

  regularLuck2: {
    costPerLevel: 2000,
    maxLevel: 500,
    costFunction: (n: number, cpl: number) => cpl + 0 * n,
    levelFunction: (n: number) => 2 * n
  },

  viscount: {
    costPerLevel: 99999,
    maxLevel: 1,
    costFunction: (n: number, cpl: number) => cpl * (n + 1),
    levelFunction: (n: number) => 125 * n
  },

  tutorial: {
    costFunction: (n: number, cpl: number) => cpl + 0 * n,
    levelFunction: (n: number) => Math.pow(1.01, n),
    maxLevel: 100,
    costPerLevel: 1,
  },

  conversionImprovement1: {
    costFunction: (n: number, cpl: number) => cpl * Math.pow(2, n),
    levelFunction: (n: number) => -n,
    maxLevel: 5,
    costPerLevel: 5,
  },

  conversionImprovement2: {
    costFunction: (n: number, cpl: number) => cpl * Math.pow(4, n),
    levelFunction: (n: number) => -n,
    maxLevel: 3,
    costPerLevel: 200,
  },

  conversionImprovement3: {
    costFunction: (n: number, cpl: number) => cpl * Math.pow(10, n),
    levelFunction: (n: number) => -n,
    maxLevel: 2,
    costPerLevel: 10000,
  },

  freeTutorialLevels: {
    costFunction: (n: number, cpl: number) => cpl + n,
    levelFunction: (n: number) => n,
    maxLevel: 5,
    costPerLevel: 1,
  },

  redGenerationSpeed: {
    costFunction: (n: number, cpl: number) => cpl * (n + 1),
    levelFunction: (n: number) => 1 + 3 * n / 1000,
    maxLevel: 100,
    costPerLevel: 12,
  },

  redLuck: {
    costFunction: (n: number, cpl: number) => cpl * (n + 1),
    levelFunction: (n: number) => n,
    maxLevel: 100,
    costPerLevel: 4,
  },

  redAmbrosiaCube: {
    costFunction: (n: number, cpl: number) => cpl * (n + 1),
    levelFunction: (n: number) => n,
    maxLevel: 1,
    costPerLevel: 500
  },

  redAmbrosiaObtainium: {
    costFunction: (n: number, cpl: number) => cpl * (n + 1),
    levelFunction: (n: number) => n,
    maxLevel: 1,
    costPerLevel: 1250,
  },

  redAmbrosiaOffering: {
    costFunction: (n: number, cpl: number) => cpl * (n + 1),
    levelFunction: (n: number) => n,
    maxLevel: 1,
    costPerLevel: 4000,
  },

  redAmbrosiaCubeImprover: {
    costFunction: (n: number, cpl: number) => cpl * (n + 1),
    levelFunction: (n: number) => 0.01 * n,
    maxLevel: 20,
    costPerLevel: 100,
  },

  infiniteShopUpgrades: {
    costFunction: (n: number, cpl: number) => cpl + 100 * n,
    levelFunction: (n: number) => n,
    maxLevel: 40,
    costPerLevel: 200
  },

  redAmbrosiaAccelerator: {
    costFunction: (n: number, cpl: number) => cpl + n * 0,
    levelFunction: (n: number) => 0.02 * n + ((n > 0) ? 1 : 0),
    maxLevel: 100,
    costPerLevel: 1000
  },
  salvageYinYang: {
    costFunction: (level: number, baseCost: number) => {
      return baseCost * (level + 1)
    },
    levelFunction: (n: number) => 10 * n,
    maxLevel: 100,
    costPerLevel: 200,
  },
  blueberries: {
    costFunction: (level: number, _baseCost: number) => {
      const costValue = [100_000, 1_400_000, 3_000_000]
      return costValue[level] ?? 0
    },
    levelFunction: (n: number) => n,
    maxLevel: 3,
    costPerLevel: 1e5,
  }
};

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

export const bonusRuneLevelsSpeed = () => {
  return (
    getRuneBonusFromAllTalismans('speed')
    + (
      this.gameData?..upgrades[27] * (Math.min(50, Math.floor(Decimal.log(this.gameData?..coins.add(1), 1e10)))
        + Math.max(0, Math.min(50, Math.floor(Decimal.log(this.gameData?..coins.add(1), 1e50)) - 10)))
  )
    + this.gameData?..upgrades[29] * Math.floor(
      Math.min(
        100,
        (this.gameData?..firstOwnedCoin + this.gameData?..secondOwnedCoin + this.gameData?..thirdOwnedCoin + this.gameData?..fourthOwnedCoin
      + this.gameData?..fifthOwnedCoin) / 400
    )
    )
  )
}

export const bonusRuneLevelsDuplication = () => {
  return (
    getRuneBonusFromAllTalismans('duplication')
    + this.gameData?..upgrades[28] * Math.min(
      100,
      Math.floor(
        (this.gameData?..firstOwnedCoin + this.gameData?..secondOwnedCoin + this.gameData?..thirdOwnedCoin + this.gameData?..fourthOwnedCoin
      + this.gameData?..fifthOwnedCoin) / 400
    )
    )
+ (
  this.gameData?..upgrades[30] * (Math.min(50, Math.floor(Decimal.log(this.gameData?..coins.add(1), 1e30)))
    + Math.min(50, Math.floor(Decimal.log(this.gameData?..coins.add(1), 1e300))))
    )
  )
}

export const bonusRuneLevelsPrism = () => {
  return (
    getRuneBonusFromAllTalismans('prism')
  )
}

export const bonusRuneLevelsThrift = () => {
  return (
    getRuneBonusFromAllTalismans('thrift')
  )
}

export const bonusRuneLevelsSI = () => {
  return (
    getRuneBonusFromAllTalismans('superiorIntellect')
  )
}

export const bonusRuneLevelsIA = () => {
  return (
    (PCoinUpgradeEffects.INSTANT_UNLOCK_2 ? 6 : 0)
    + this.gameData?..cubeUpgrades[73]
    + this.gameData?..campaigns.bonusRune6
      + getRuneBonusFromAllTalismans('infiniteAscent')
      + getRuneEffects('finiteDescent').infiniteAscentFreeLevel
  )
}

export const bonusRuneLevelsAntiquities = () => {
  return getRuneBonusFromAllTalismans('antiquities')
}

export const bonusRuneLevelsHorseShoe = () => {
  return getRuneBonusFromAllTalismans('horseShoe')
    + (this.gameData?..shopUpgrades.shopHorseShoe > 0 ? 3 : 0)
}

export const speedRuneOOMIncrease = () => {
  return (
    this.gameData?..upgrades[66] * 2
    + this.gameData?..researches[78]
      + this.gameData?..researches[111]
        + CalcECC('ascension', this.gameData?..challengecompletions[11])
        + 1.5 * CalcECC('ascension', this.gameData?..challengecompletions[14])
        + this.gameData?..cubeUpgrades[16]
          + getTalismanEffects('chronos').speedOOMBonus
          + getAmbrosiaUpgradeEffects('ambrosiaRuneOOMBonus').runeOOMBonus
          + getLevelMilestone('speedRune')
  )
}

export const duplicationRuneOOMIncrease = () => {
  return (
    0.75 * CalcECC('transcend', this.gameData?..challengecompletions[1])
    + this.gameData?..upgrades[66] * 2
    + this.gameData?..researches[90]
      + this.gameData?..researches[112]
        + CalcECC('ascension', this.gameData?..challengecompletions[11])
        + 1.5 * CalcECC('ascension', this.gameData?..challengecompletions[14])
        + getTalismanEffects('exemption').duplicationOOMBonus
        + getAmbrosiaUpgradeEffects('ambrosiaRuneOOMBonus').runeOOMBonus
        + getLevelMilestone('duplicationRune')
  )
}

export const prismRuneOOMIncrease = () => {
  return (
    this.gameData?..upgrades[66] * 2
    + this.gameData?..researches[79]
      + this.gameData?..researches[113]
        + CalcECC('ascension', this.gameData?..challengecompletions[11])
        + 1.5 * CalcECC('ascension', this.gameData?..challengecompletions[14])
        + this.gameData?..cubeUpgrades[16]
          + getTalismanEffects('mortuus').prismOOMBonus
          + getAmbrosiaUpgradeEffects('ambrosiaRuneOOMBonus').runeOOMBonus
          + getLevelMilestone('prismRune')
  )
}

export const thriftRuneOOMIncrease = () => {
  return (
    this.gameData?..upgrades[66] * 2
    + this.gameData?..researches[77]
      + this.gameData?..researches[114]
        + CalcECC('ascension', this.gameData?..challengecompletions[11])
        + 1.5 * CalcECC('ascension', this.gameData?..challengecompletions[14])
        + this.gameData?..cubeUpgrades[37]
          + getTalismanEffects('midas').thriftOOMBonus
          + getAmbrosiaUpgradeEffects('ambrosiaRuneOOMBonus').runeOOMBonus
          + getLevelMilestone('thriftRune')
  )
}

export const superiorIntellectOOMIncrease = () => {
  return (
    this.gameData?..upgrades[66] * 2
    + this.gameData?..researches[115]
      + CalcECC('ascension', this.gameData?..challengecompletions[11])
      + 1.5 * CalcECC('ascension', this.gameData?..challengecompletions[14])
      + this.gameData?..cubeUpgrades[37]
        + getTalismanEffects('polymath').SIOOMBonus
        + getAmbrosiaUpgradeEffects('ambrosiaRuneOOMBonus').runeOOMBonus
        + getLevelMilestone('SIRune')
  )
}

export const infiniteAscentOOMIncrease = () => {
  return (
    getAmbrosiaUpgradeEffects('ambrosiaRuneOOMBonus').infiniteAscentOOMBonus
  )
}

export const antiquitiesOOMIncrease = () => {
  return (
    +this.gameData?..singularityChallenges.taxmanLastStand.rewards.antiquityOOM
  )
}

export const horseShoeOOMIncrease = () => {
  return (
    +this.gameData?..singularityChallenges.taxmanLastStand.rewards.horseShoeOOM
  )
}

export const firstFiveEffectiveRuneLevelMult = () => {
  return firstFiveRuneEffectivenessStats.reduce((x, y) => x * y.stat(), 1)
}

export const SIEffectiveRuneLevelMult = () => {
  return runeEffectivenessStatsSI.reduce((x, y) => x * y.stat(), 1)
}

export const universalRuneEXPMult = (purchasedLevels: number): Decimal => {
  // recycleMult accounted for all recycle chance, but inversed so it's a multiplier instead
  const recycleMultiplier = calculateSalvageRuneEXPMultiplier()

  // Rune multiplier that is summed instead of added
  /* TODO: Replace the effects of these upgrades with new ones
    const allRuneExpAdditiveMultiplier = sumContents([
        // Challenge 3 completions
        (1 / 100) * this.gameData?..highestchallengecompletions[3],
        // Reincarnation 2x1
        1 * this.gameData?..upgrades[66]
      ])
    }*/
  export const allRuneExpAdditiveMultiplier = (
    // Base amount multiplied per offering
    1
    // +1 if C1 completion
    + Math.min(1, this.gameData?..highestchallengecompletions[1])
    // +0.10 per C1 completion
    + (0.4 / 10) * this.gameData?..highestchallengecompletions[1]
    // Research 5x2
    + 0.6 * this.gameData?..researches[22]
  // Research 5x3
  + 0.3 * this.gameData?..researches[23]
    // Particle upgrade 3x1
    + (this.gameData?..upgrades[71] * purchasedLevels) / 25
  )

// Rune multiplier that gets applied to all runes
const allRuneExpMultiplier = [
  // Research 4x16
  1 + this.gameData?..researches[91] / 20,
  // Research 4x17
  1 + this.gameData?..researches[92] / 20,
  // Cube Upgrade Bonus
  1 + (this.gameData?..ascensionCounter / 1000) * this.gameData?..cubeUpgrades[32],
  // Constant Upgrade Multiplier
  1 + (1 / 10) * this.gameData?..constantUpgrades[8],
  // Challenge 15 reward multiplier
  G.challenge15Rewards.runeExp.value
].reduce((x, y) => x.times(y), new Decimal('1'))

return allRuneExpMultiplier.times(allRuneExpAdditiveMultiplier).times(recycleMultiplier)
}

export const runes = {
  speed: {
    costCoefficient: 50,
    levelsPerOOM: 150,
    levelsPerOOMIncrease: () => speedRuneOOMIncrease(),
    effects: (n: number) => {
      const acceleratorPower = 0.0002 * n
      const multiplicativeAccelerators = 1 + n / 400
      const globalSpeed = 2 - Math.exp(-Math.cbrt(n) / 100)
      return {
        acceleratorPower: acceleratorPower,
        multiplicativeAccelerators: multiplicativeAccelerators,
        globalSpeed: globalSpeed
      }
    },
    effectiveLevelMult: () => firstFiveEffectiveRuneLevelMult(),
    freeLevels: () => firstFiveFreeLevels() + bonusRuneLevelsSpeed(),
    runeEXPPerOffering: (purchasedLevels: number) => universalRuneEXPMult(purchasedLevels),
    isUnlocked: () => true,
  },
  duplication: {
    costCoefficient: 20000,
    levelsPerOOM: 120,
    levelsPerOOMIncrease: () => duplicationRuneOOMIncrease(),
    effects: (n: number) => {
      const multiplierBoosts = n / 5
      const multiplicativeMultipliers = 1 + n / 400
      const taxReduction = 0.001 + .999 * Math.exp(-Math.cbrt(n) / 5)
      return {
        multiplierBoosts: multiplierBoosts,
        multiplicativeMultipliers: multiplicativeMultipliers,
        taxReduction: taxReduction
      }
    },
    effectiveLevelMult: () => firstFiveEffectiveRuneLevelMult(),
    freeLevels: () => firstFiveFreeLevels() + bonusRuneLevelsDuplication(),
    runeEXPPerOffering: (purchasedLevels: number) => universalRuneEXPMult(purchasedLevels),
  },
  prism: {
    costCoefficient: 5e5,
    levelsPerOOM: 90,
    levelsPerOOMIncrease: () => prismRuneOOMIncrease(),
    effects: (level: number) => {
      const productionLog10 = Math.max(0, 2 * Math.log10(1 + level / 2) + (level / 2) * Math.log10(2) - Math.log10(256))
      const costDivisorLog10 = Math.floor(level / 10)
      return {
        productionLog10: productionLog10,
        costDivisorLog10: costDivisorLog10
      }
    },
    effectiveLevelMult: () => firstFiveEffectiveRuneLevelMult(),
    freeLevels: () => firstFiveFreeLevels() + bonusRuneLevelsPrism(),
    runeEXPPerOffering: (purchasedLevels: number) => universalRuneEXPMult(purchasedLevels),
    isUnlocked: () => Boolean(getAchievementReward('prismRuneUnlock')),
  },
  thrift: {
    costCoefficient: 2.5e7,
    levelsPerOOM: 60,
    levelsPerOOMIncrease: () => thriftRuneOOMIncrease(),
    effects: (level: number) => {
      const costDelay = Math.min(1e15, level / 125)
      const salvage = 2.5 * Math.log(1 + level / 10)
      const taxReduction = 0.01 + 0.99 * Math.exp(-Math.cbrt(level) / 10)
      return {
        costDelay: costDelay,
        salvage: salvage,
        taxReduction: taxReduction
      }
    },
    effectiveLevelMult: () => firstFiveEffectiveRuneLevelMult(),
    freeLevels: () => firstFiveFreeLevels() + bonusRuneLevelsThrift(),
    runeEXPPerOffering: (purchasedLevels: number) => universalRuneEXPMult(purchasedLevels),
    isUnlocked: () => Boolean(getAchievementReward('thriftRuneUnlock')),
  },
  superiorIntellect: {
    costCoefficient: 1e12,
    levelsPerOOM: 30,
    levelsPerOOMIncrease: () => superiorIntellectOOMIncrease(),
    effects: (level: number) => {
      const offeringMult = 1 + level / 2000
      const obtainiumMult = 1 + level / 200
      const antSpeed = Math.pow(1 + level / 500, 2)
      return {
        offeringMult: offeringMult,
        obtainiumMult: obtainiumMult,
        antSpeed: antSpeed
      }
    },
    effectiveLevelMult: () => firstFiveEffectiveRuneLevelMult() * SIEffectiveRuneLevelMult(),
    freeLevels: () => firstFiveFreeLevels() + bonusRuneLevelsSI(),
    runeEXPPerOffering: (purchasedLevels: number) => universalRuneEXPMult(purchasedLevels),
    isUnlocked: (data: PlayerData) => data.researches[82] > 0,
  },
  infiniteAscent: {
    costCoefficient: 1e75,
    levelsPerOOM: 1 / 2,
    levelsPerOOMIncrease: () => infiniteAscentOOMIncrease(),
    effects: (level: number, data: PlayerData) => {
      const quarkMult = 1 + level / 500 + (level > 0 ? 0.1 : 0)
      const cubeMult = 1 + level / 100

      const salvagePerkLevels = [30, 40, 61, 81, 111, 131, 161, 191, 236, 260]
      const salvageCoefficient = 0.025 * salvagePerkLevels.filter((x) => x <= data.highestSingularityCount).length
      const salvage = salvageCoefficient * level

      return {
        quarkMult: quarkMult,
        cubeMult: cubeMult,
        salvage: salvage
      }
    },
    effectiveLevelMult: () => 1,
    freeLevels: () => bonusRuneLevelsIA(),
    runeEXPPerOffering: (purchasedLevels: number) => universalRuneEXPMult(purchasedLevels),
    isUnlocked: () => isIARuneUnlocked(),
  },
  antiquities: {
    costCoefficient: 1e206,
    levelsPerOOM: 1 / 50,
    levelsPerOOMIncrease: () => antiquitiesOOMIncrease(),
    effects: (level: number) => {
      const addCodeCooldownReduction = level > 0 ? 0.8 - 0.3 * (level - 1) / (level + 10) : 1
      const offeringLog10 = level
      const obtainiumLog10 = level
      return {
        addCodeCooldownReduction: addCodeCooldownReduction,
        offeringLog10: offeringLog10,
        obtainiumLog10: obtainiumLog10
      }
    },
    effectiveLevelMult: () => 1,
    freeLevels: () => bonusRuneLevelsAntiquities(),
    runeEXPPerOffering: (purchasedLevels: number) => universalRuneEXPMult(purchasedLevels),
    isUnlocked: (data: PlayerData) => data.platonicUpgrades[20] > 0,
  },
  horseShoe: {
    costCoefficient: '1e500',
    levelsPerOOM: 1 / 20,
    levelsPerOOMIncrease: () => horseShoeOOMIncrease(),
    effects: (level: number) => {
      const ambrosiaLuck = level
      const redLuck = level / 5
      const redLuckConversion = -0.5 * level / (level + 50)
      return {
        ambrosiaLuck: ambrosiaLuck,
        redLuck: redLuck,
        redLuckConversion: redLuckConversion
      }
    },
    effectiveLevelMult: () => 1,
    freeLevels: () => bonusRuneLevelsHorseShoe(),
    runeEXPPerOffering: (purchasedLevels: number) => universalRuneEXPMult(purchasedLevels),
    isUnlocked: (data: PlayerData) => {
      const condition = Boolean(data.singularityChallenges.taxmanLastStand.completions > 0)
      return condition
    }
  },
  finiteDescent: {
    costCoefficient: '1e-40',
    levelsPerOOM: 0.1,
    levelsPerOOMIncrease: () => 0,
    effects: (level: number) => {
      const ascensionScore = level >= 1 ? 1.04 + 0.96 * (level - 1) / (level + 25) : 1
      const corruptionFreeLevels = level >= 1 ? 0.01 + 0.14 * (level - 1) / (level + 16) : 0
      const infiniteAscentFreeLevel = Math.floor(level / 2)
      return {
        ascensionScore: ascensionScore,
        corruptionFreeLevels: corruptionFreeLevels,
        infiniteAscentFreeLevel: infiniteAscentFreeLevel
      }
    },
    effectiveLevelMult: () => 1,
    freeLevels: () => 0,
    runeEXPPerOffering: (purchasedLevels: number) => universalRuneEXPMult(purchasedLevels),
    isUnlocked: (data: PlayerData) => data.shopUpgrades.shopSadisticRune > 0,
  }
}
https://github.com/Pseudo-Corp/SynergismOfficial/blob/master/src/Calculate.ts#L1678
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