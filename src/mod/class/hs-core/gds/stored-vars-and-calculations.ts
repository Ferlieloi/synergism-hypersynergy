import { AchievementRewards, HepteractEffectiveValues, RedAmbrosiaUpgradeCalculationCollection, AmbrosiaUpgradeCalculationCollection, AntUpgrades } from "../../../types/data-types/hs-gamedata-api-types"
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

export const antUpgradeData = {
  [AntUpgrades.AntSpeed]: {
    exemptFromCorruption: false,
  },
  [AntUpgrades.Coins]: {
    exemptFromCorruption: false,
  },
  [AntUpgrades.Taxes]: {

    exemptFromCorruption: false,
  },
  [AntUpgrades.AcceleratorBoosts]: {

    exemptFromCorruption: false,
  },
  [AntUpgrades.Multipliers]: {

    exemptFromCorruption: false,
  },
  [AntUpgrades.Offerings]: {

    exemptFromCorruption: false,
  },
  [AntUpgrades.BuildingCostScale]: {

    exemptFromCorruption: false,
  },
  [AntUpgrades.Salvage]: {

    exemptFromCorruption: false,
  },
  [AntUpgrades.FreeRunes]: {

    exemptFromCorruption: false,
  },
  [AntUpgrades.Obtainium]: {

    exemptFromCorruption: false,
  },
  [AntUpgrades.AntSacrifice]: {

    exemptFromCorruption: false,
  },
  [AntUpgrades.Mortuus]: {
    exemptFromCorruption: true,
  },
  [AntUpgrades.AntELO]: {
    exemptFromCorruption: false,
  },
  [AntUpgrades.Mortuus2]: {
    exemptFromCorruption: true,
  },
  [AntUpgrades.AscensionScore]: {
    exemptFromCorruption: true,
  },
  [AntUpgrades.WowCubes]: {
    exemptFromCorruption: true,
  }
}


////////////////////////////////////////////////////////////////////////////////////////////////////////
/*
export const firstFiveFreeLevels = () => {
  return (
    getAntUpgradeEffect(AntUpgrades.FreeRunes).freeRuneLevel
    + 7 * Math.min(player.constantUpgrades[7], 1000)
  )
}

export const bonusRuneLevelsSpeed = () => {
  return (
    getRuneBonusFromAllTalismans('speed')
    + (
      player.upgrades[27] * (Math.min(50, Math.floor(Decimal.log(player.coins.add(1), 1e10)))
        + Math.max(0, Math.min(50, Math.floor(Decimal.log(player.coins.add(1), 1e50)) - 10)))
    )
    + player.upgrades[29] * Math.floor(
      Math.min(
        100,
        (player.firstOwnedCoin + player.secondOwnedCoin + player.thirdOwnedCoin + player.fourthOwnedCoin
          + player.fifthOwnedCoin) / 400
      )
    )
  )
}

export const bonusRuneLevelsDuplication = () => {
  return (
    getRuneBonusFromAllTalismans('duplication')
    + player.upgrades[28] * Math.min(
      100,
      Math.floor(
        (player.firstOwnedCoin + player.secondOwnedCoin + player.thirdOwnedCoin + player.fourthOwnedCoin
          + player.fifthOwnedCoin) / 400
      )
    )
    + (
      player.upgrades[30] * (Math.min(50, Math.floor(Decimal.log(player.coins.add(1), 1e30)))
        + Math.min(50, Math.floor(Decimal.log(player.coins.add(1), 1e300))))
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
    + player.cubeUpgrades[73]
    + player.campaigns.bonusRune6
    + getRuneBonusFromAllTalismans('infiniteAscent')
    + getRuneEffects('finiteDescent').infiniteAscentFreeLevel
  )
}

export const bonusRuneLevelsAntiquities = () => {
  return getRuneBonusFromAllTalismans('antiquities')
}

export const bonusRuneLevelsHorseShoe = () => {
  return getRuneBonusFromAllTalismans('horseShoe')
    + (player.shopUpgrades.shopHorseShoe > 0 ? 3 : 0)
}

export const speedRuneOOMIncrease = () => {
  return (
    player.upgrades[66] * 2
    + player.researches[78]
    + player.researches[111]
    + CalcECC('ascension', player.challengecompletions[11])
    + 1.5 * CalcECC('ascension', player.challengecompletions[14])
    + player.cubeUpgrades[16]
    + getTalismanEffects('chronos').speedOOMBonus
    + getAmbrosiaUpgradeEffects('ambrosiaRuneOOMBonus').runeOOMBonus
    + getLevelMilestone('speedRune')
  )
}

export const duplicationRuneOOMIncrease = () => {
  return (
    0.75 * CalcECC('transcend', player.challengecompletions[1])
    + player.upgrades[66] * 2
    + player.researches[90]
    + player.researches[112]
    + CalcECC('ascension', player.challengecompletions[11])
    + 1.5 * CalcECC('ascension', player.challengecompletions[14])
    + getTalismanEffects('exemption').duplicationOOMBonus
    + getAmbrosiaUpgradeEffects('ambrosiaRuneOOMBonus').runeOOMBonus
    + getLevelMilestone('duplicationRune')
  )
}

export const prismRuneOOMIncrease = () => {
  return (
    player.upgrades[66] * 2
    + player.researches[79]
    + player.researches[113]
    + CalcECC('ascension', player.challengecompletions[11])
    + 1.5 * CalcECC('ascension', player.challengecompletions[14])
    + player.cubeUpgrades[16]
    + getTalismanEffects('mortuus').prismOOMBonus
    + getAmbrosiaUpgradeEffects('ambrosiaRuneOOMBonus').runeOOMBonus
    + getLevelMilestone('prismRune')
  )
}

export const thriftRuneOOMIncrease = () => {
  return (
    player.upgrades[66] * 2
    + player.researches[77]
    + player.researches[114]
    + CalcECC('ascension', player.challengecompletions[11])
    + 1.5 * CalcECC('ascension', player.challengecompletions[14])
    + player.cubeUpgrades[37]
    + getTalismanEffects('midas').thriftOOMBonus
    + getAmbrosiaUpgradeEffects('ambrosiaRuneOOMBonus').runeOOMBonus
    + getLevelMilestone('thriftRune')
  )
}

export const superiorIntellectOOMIncrease = () => {
  return (
    player.upgrades[66] * 2
    + player.researches[115]
    + CalcECC('ascension', player.challengecompletions[11])
    + 1.5 * CalcECC('ascension', player.challengecompletions[14])
    + player.cubeUpgrades[37]
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
    +player.singularityChallenges.taxmanLastStand.rewards.antiquityOOM
  )
}

export const horseShoeOOMIncrease = () => {
  return (
    +player.singularityChallenges.taxmanLastStand.rewards.horseShoeOOM
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
        (1 / 100) * player.highestchallengecompletions[3],
        // Reincarnation 2x1
        1 * player.upgrades[66]
      ])
    }*//* 
export const allRuneExpAdditiveMultiplier = (
// Base amount multiplied per offering
1
// +1 if C1 completion
+ Math.min(1, player.highestchallengecompletions[1])
// +0.10 per C1 completion
+ (0.4 / 10) * player.highestchallengecompletions[1]
// Research 5x2
+ 0.6 * player.researches[22]
// Research 5x3
+ 0.3 * player.researches[23]
// Particle upgrade 3x1
+ (player.upgrades[71] * purchasedLevels) / 25
)

// Rune multiplier that gets applied to all runes
const allRuneExpMultiplier = [
// Research 4x16
1 + player.researches[91] / 20,
// Research 4x17
1 + player.researches[92] / 20,
// Cube Upgrade Bonus
1 + (player.ascensionCounter / 1000) * player.cubeUpgrades[32],
// Constant Upgrade Multiplier
1 + (1 / 10) * player.constantUpgrades[8],
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
}*/
////////////////////////////////////////////////////////////////////////////////////////////////////////
// https://github.com/Pseudo-Corp/SynergismOfficial/blob/master/src/Calculate.ts#L1678
export const calculateSigmoid = (
  constant: number,
  factor: number,
  divisor: number
) => {
  return 1 + (constant - 1) * (1 - Math.pow(2, -factor / divisor))
}

export const getAchievementReward = (reward: AchievementRewards, playerData: typeof player): number | boolean => {
  switch (reward) {
    case 'acceleratorPower':
      return achievementsByReward.acceleratorPower.reduce(
        (sum, index) => sum + (playerData.achievements[index] ? achievements[index].reward!.acceleratorPower!() : 0),
        0
      )
    case 'accelerators':
      return achievementsByReward.accelerators.reduce(
        (sum, index) => sum + (playerData.achievements[index] ? achievements[index].reward!.accelerators!() : 0),
        0
      )
    case 'multipliers':
      return achievementsByReward.multipliers.reduce(
        (sum, index) => sum + (playerData.achievements[index] ? achievements[index].reward!.multipliers!() : 0),
        0
      )
    case 'accelBoosts':
      return achievementsByReward.accelBoosts.reduce(
        (sum, index) => sum + (playerData.achievements[index] ? achievements[index].reward!.accelBoosts!() : 0),
        0
      )
    case 'crystalMultiplier':
      return achievementsByReward.crystalMultiplier.reduce(
        (prod, index) => prod * (playerData.achievements[index] ? achievements[index].reward!.crystalMultiplier!() : 1),
        1
      )
    case 'quarkGain':
      return achievementsByReward.quarkGain.reduce(
        (prod, index) => prod * (playerData.achievements[index] ? achievements[index].reward!.quarkGain!() : 1),
        1
      )
    case 'taxReduction':
      return achievementsByReward.taxReduction.reduce(
        (prod, index) => prod * (playerData.achievements[index] ? achievements[index].reward!.taxReduction!() : 1),
        1
      )
    case 'particleGain':
      return achievementsByReward.particleGain.reduce(
        (prod, index) => prod * (playerData.achievements[index] ? achievements[index].reward!.particleGain!() : 1),
        1
      )
    case 'chronosTalisman':
      return Boolean(playerData.achievements[achievementsByReward.chronosTalisman[0]])
    case 'midasTalisman':
      return Boolean(playerData.achievements[achievementsByReward.midasTalisman[0]])
    case 'metaphysicsTalisman':
      return Boolean(playerData.achievements[achievementsByReward.metaphysicsTalisman[0]])
    case 'polymathTalisman':
      return Boolean(playerData.achievements[achievementsByReward.polymathTalisman[0]])
    case 'wowSquareTalisman':
      return Boolean(playerData.achievements[achievementsByReward.wowSquareTalisman[0]])
    case 'conversionExponent':
      return achievementsByReward.conversionExponent.reduce(
        (sum, index) => sum + (playerData.achievements[index] ? achievements[index].reward!.conversionExponent!() : 0),
        0
      )
    case 'talismanPower':
      return achievementsByReward.talismanPower.reduce(
        (sum, index) => sum + (playerData.achievements[index] ? achievements[index].reward!.talismanPower!() : 0),
        0
      )
    case 'sacrificeMult':
      return achievementsByReward.sacrificeMult.reduce(
        (prod, index) => prod * (playerData.achievements[index] ? achievements[index].reward!.sacrificeMult!() : 1),
        1
      )
    case 'antSpeed':
      return achievementsByReward.antSpeed.reduce(
        (prod, index) => prod * (playerData.achievements[index] ? achievements[index].reward!.antSpeed!() : 1),
        1
      )
    case 'antSacrificeUnlock':
      return Boolean(playerData.achievements[achievementsByReward.antSacrificeUnlock[0]])
    case 'antAutobuyers':
      return achievementsByReward.antAutobuyers.reduce(
        (sum, index) => sum + (playerData.achievements[index] ? achievements[index].reward!.antAutobuyers!() : 0),
        0
      )
    case 'preserveAnthillCount':
      return Boolean(playerData.achievements[achievementsByReward.preserveAnthillCount[0]])
    case 'preserveAnthillCountSingularity':
      return Boolean(playerData.achievements[achievementsByReward.preserveAnthillCountSingularity[0]])
    case 'inceptusAutobuy':
      return Boolean(playerData.achievements[achievementsByReward.inceptusAutobuy[0]])
    case 'fortunaeAutobuy':
      return Boolean(playerData.achievements[achievementsByReward.fortunaeAutobuy[0]])
    case 'tributumAutobuy':
      return Boolean(playerData.achievements[achievementsByReward.tributumAutobuy[0]])
    case 'celeritasAutobuy':
      return Boolean(playerData.achievements[achievementsByReward.celeritasAutobuy[0]])
    case 'exploratoremAutobuy':
      return Boolean(playerData.achievements[achievementsByReward.exploratoremAutobuy[0]])
    case 'sacrificiumAutobuy':
      return Boolean(playerData.achievements[achievementsByReward.sacrificiumAutobuy[0]])
    case 'experientiaAutobuy':
      return Boolean(playerData.achievements[achievementsByReward.experientiaAutobuy[0]])
    case 'hicAutobuy':
      return Boolean(playerData.achievements[achievementsByReward.hicAutobuy[0]])
    case 'scientiaAutobuy':
      return Boolean(playerData.achievements[achievementsByReward.scientiaAutobuy[0]])
    case 'praemoenioAutobuy':
      return Boolean(playerData.achievements[achievementsByReward.praemoenioAutobuy[0]])
    case 'phylacteriumAutobuy':
      return Boolean(playerData.achievements[achievementsByReward.phylacteriumAutobuy[0]])
    case 'antELOAdditive':
      return achievementsByReward.antELOAdditive.reduce(
        (sum, index) => sum + (playerData.achievements[index] ? achievements[index].reward!.antELOAdditive!() : 0),
        0
      )
    case 'antELOAdditiveMultiplier':
      return achievementsByReward.antELOAdditiveMultiplier.reduce(
        (prod, index) =>
          prod + (playerData.achievements[index] ? achievements[index].reward!.antELOAdditiveMultiplier!() : 0),
        0
      )
    case 'ascensionCountMultiplier':
      return achievementsByReward.ascensionCountMultiplier.reduce(
        (prod, index) =>
          prod * (playerData.achievements[index] ? achievements[index].reward!.ascensionCountMultiplier!() : 1),
        1
      )
    case 'ascensionCountAdditive':
      return achievementsByReward.ascensionCountAdditive.reduce(
        (sum, index) => sum + (playerData.achievements[index] ? achievements[index].reward!.ascensionCountAdditive!() : 0),
        0
      )
    case 'wowCubeGain':
      return achievementsByReward.wowCubeGain.reduce(
        (prod, index) => prod * (playerData.achievements[index] ? achievements[index].reward!.wowCubeGain!() : 1),
        1
      )
    case 'wowTesseractGain':
      return achievementsByReward.wowTesseractGain.reduce(
        (prod, index) => prod * (playerData.achievements[index] ? achievements[index].reward!.wowTesseractGain!() : 1),
        1
      )
    case 'wowHypercubeGain':
      return achievementsByReward.wowHypercubeGain.reduce(
        (prod, index) => prod * (playerData.achievements[index] ? achievements[index].reward!.wowHypercubeGain!() : 1),
        1
      )
    case 'wowPlatonicGain':
      return achievementsByReward.wowPlatonicGain.reduce(
        (prod, index) => prod * (playerData.achievements[index] ? achievements[index].reward!.wowPlatonicGain!() : 1),
        1
      )
    case 'wowHepteractGain':
      return achievementsByReward.wowHepteractGain.reduce(
        (prod, index) => prod * (playerData.achievements[index] ? achievements[index].reward!.wowHepteractGain!() : 1),
        1
      )
    case 'ascensionScore':
      return achievementsByReward.ascensionScore.reduce(
        (prod, index) => prod * (playerData.achievements[index] ? achievements[index].reward!.ascensionScore!() : 1),
        1
      )
    case 'ascensionRewardScaling':
      return Boolean(playerData.achievements[achievementsByReward.ascensionRewardScaling[0]])
    case 'constUpgrade1Buff':
      return achievementsByReward.constUpgrade1Buff.reduce(
        (sum, index) => sum + (playerData.achievements[index] ? achievements[index].reward!.constUpgrade1Buff!() : 0),
        0
      )
    case 'constUpgrade2Buff':
      return achievementsByReward.constUpgrade2Buff.reduce(
        (sum, index) => sum + (playerData.achievements[index] ? achievements[index].reward!.constUpgrade2Buff!() : 0),
        0
      )
    case 'platonicToHypercubes':
      return achievementsByReward.platonicToHypercubes.reduce(
        (sum, index) => sum + (playerData.achievements[index] ? achievements[index].reward!.platonicToHypercubes!() : 0),
        0
      )
    case 'statTracker':
      return Boolean(playerData.achievements[achievementsByReward.statTracker[0]])
    case 'overfluxConversionRate':
      return achievementsByReward.overfluxConversionRate.reduce(
        (prod, index) => prod * (playerData.achievements[index] ? achievements[index].reward!.overfluxConversionRate!() : 1),
        1
      )
    case 'diamondUpgrade18':
      return Boolean(playerData.achievements[achievementsByReward.diamondUpgrade18[0]])
    case 'diamondUpgrade19':
      return Boolean(playerData.achievements[achievementsByReward.diamondUpgrade19[0]])
    case 'diamondUpgrade20':
      return Boolean(playerData.achievements[achievementsByReward.diamondUpgrade20[0]])
    case 'prestigeCountMultiplier':
      return achievementsByReward.prestigeCountMultiplier.reduce(
        (prod, index) => prod * (playerData.achievements[index] ? achievements[index].reward!.prestigeCountMultiplier!() : 1),
        1
      )
    case 'transcensionCountMultiplier':
      return achievementsByReward.transcensionCountMultiplier.reduce(
        (prod, index) =>
          prod * (playerData.achievements[index] ? achievements[index].reward!.transcensionCountMultiplier!() : 1),
        1
      )
    case 'reincarnationCountMultiplier':
      return achievementsByReward.reincarnationCountMultiplier.reduce(
        (prod, index) =>
          prod * (playerData.achievements[index] ? achievements[index].reward!.reincarnationCountMultiplier!() : 1),
        1
      )
    case 'duplicationRuneUnlock':
      return Boolean(playerData.achievements[achievementsByReward.duplicationRuneUnlock[0]])
    case 'offeringBonus':
      return achievementsByReward.offeringBonus.reduce(
        (prod, index) => prod * (playerData.achievements[index] ? achievements[index].reward!.offeringBonus!() : 1),
        1
      )
    case 'obtainiumBonus':
      return achievementsByReward.obtainiumBonus.reduce(
        (prod, index) => prod * (playerData.achievements[index] ? achievements[index].reward!.obtainiumBonus!() : 1),
        1
      )
    case 'salvage':
      return achievementsByReward.salvage.reduce(
        (sum, index) => sum + (playerData.achievements[index] ? achievements[index].reward!.salvage!() : 0),
        0
      )
    case 'prismRuneUnlock':
      return Boolean(playerData.achievements[achievementsByReward.prismRuneUnlock[0]])
    case 'thriftRuneUnlock':
      return Boolean(playerData.achievements[achievementsByReward.thriftRuneUnlock[0]])
    case 'transcendToPrestige':
      return Boolean(playerData.achievements[achievementsByReward.transcendToPrestige[0]])
    case 'reincarnationToTranscend':
      return Boolean(playerData.achievements[achievementsByReward.reincarnationToTranscend[0]])
    case 'freeAntUpgrades':
      return achievementsByReward.freeAntUpgrades.reduce(
        (sum, index) => sum + (playerData.achievements[index] ? achievements[index].reward!.freeAntUpgrades!() : 0),
        0
      )
    case 'antSacrificeCountMultiplier':
      return achievementsByReward.antSacrificeCountMultiplier.reduce(
        (prod, index) =>
          prod * (playerData.achievements[index] ? achievements[index].reward!.antSacrificeCountMultiplier!() : 1),
        1
      )
    case 'autoAntSacrifice':
      return Boolean(playerData.achievements[achievementsByReward.autoAntSacrifice[0]])
    case 'antSpeed2UpgradeImprover':
      return achievementsByReward.antSpeed2UpgradeImprover.reduce(
        (sum, index) => sum + (playerData.achievements[index] ? achievements[index].reward!.antSpeed2UpgradeImprover!() : 0),
        0
      )
    default:
      throw new Error(`Unknown reward type: ${reward}`)
  }
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