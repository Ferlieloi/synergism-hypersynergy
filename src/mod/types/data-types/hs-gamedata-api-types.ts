import type { HSGameDataAPI } from "../../class/hs-core/gds/hs-gamedata-api";
import { goldenQuarkUpgrades, OcteractUpgradeData, octUpgrades, Player, RedAmbrosiaUpgrades, Runes, CorruptionLoadout } from "./hs-player-savedata";

export enum ShopUpgradeGroups {
  Offering = 0,
  Obtainium,
  Cubes,
  Speed,
  Quark,
  AmbrosiaLuck,
  RedAmbrosiaLuck,
  AmbrosiaGeneration,
  InfinityUpgrades,
  Utility
}

export interface ShopUpgradeTypeInfo {
  HTMLColor: string
  symbol: string
  bonusLevels: () => number
}

export interface ShopUpgradeEffectEnvironment {
  getGameData: () => Player | undefined
  getPCoinUpgradeLevel: (upgradeKey: string) => number
  getShopUpgradeTypeBonusLevels: (type: ShopUpgradeGroups) => number
  R_calculateSumOfExaltCompletions: () => number
  R_getAmbrosiaUpgradeEffects: (upgradeKey: string) => any
  R_getRuneEffectiveLevel: (rune: RuneKeys) => number
}

export interface ShopUpgradeHelperContext extends ShopUpgradeEffectEnvironment {
  getSingularityChallengeEffect: (challengeKey: string, effectKey: string) => number
  R_getRuneEffects: (rune: RuneKeys) => any
  R_getRedAmbrosiaUpgradeEffects: (upgradeKey: string) => any
  R_calculateFreeShopInfinityUpgrades: (reduce_vals: boolean) => number[]
  checkCalculationCache: (cacheName: keyof CalculationCache, calculationVars: number[]) => number | undefined
  updateCalculationCache: (cacheName: keyof CalculationCache, item: CachedValue) => void
}

export interface AntUpgradeHelperContext {
  getGameData: () => Player | undefined
  R_getAchievementReward: (rewardName: string) => number | boolean | undefined
  R_calculateSigmoidExponential: (constant: number, coefficient: number) => number
  R_calculateChallenge15Reward: (rewardName: string) => number
  R_CalcECC: (refinement: string, value: number) => number
  R_calculateCorruptionEffect: (loadout: CorruptionLoadout, corruption: string) => number
  checkCalculationCache: (cacheName: keyof CalculationCache, calculationVars: number[]) => number | undefined
  updateCalculationCache: (cacheName: keyof CalculationCache, item: CachedValue) => void
}

export interface TalismanHelperContext {
  getGameData: () => Player | undefined
  getSingularityChallengeEffect: (challengeKey: string, effectKey: string) => number
  R_getAchievementReward: (rewardName: string) => number | boolean | undefined
  R_getGQUpgradeEffect: (upgradeKey: string) => number | undefined
  R_getAmbrosiaUpgradeEffects: (upgradeKey: string) => any
  R_getAntUpgradeEffect: (upgradeKey: AntUpgrades) => any
  R_getLevelMilestone: (name: SynergismLevelMilestones) => number
  R_getOcteractUpgradeEffect: (upgradeKey: string) => number | undefined
  getPCoinUpgradeLevel: (upgradeName: string) => number
  checkCalculationCache: (cacheName: keyof CalculationCache, calculationVars: number[]) => number | undefined
  updateCalculationCache: (cacheName: keyof CalculationCache, item: CachedValue) => void
  R_calculateChallenge15Reward: (rewardName: string) => number | undefined
  R_CalcECC: (refinement: string, value: number) => number
  isShopTalismanUnlocked: () => boolean
}

export interface AmbrosiaHelperContext {
  getGameData: () => Player | undefined
  getMeData: () => any
  calculateLuck: (reduce_vals?: boolean, true_base?: boolean) => { luckBase: number; luckMult: number; luckTotal: number } | any
  getShopUpgradeEffects: (upgradeKey: string, effectKey: string) => number | boolean
  getSingularityChallengeEffect: (challengeKey: string, effectKey: string) => number
  checkCalculationCache: (cacheName: keyof CalculationCache, calculationVars: number[]) => number | undefined
  updateCalculationCache: (cacheName: keyof CalculationCache, item: CachedValue) => void
}

export interface RuneHelperContext {
  getGameData: () => Player | undefined
  getPCoinUpgradeLevel: (upgradeKey: string) => number
  getSingularityChallengeEffect: (challengeKey: string, effectKey: string) => number
  R_getAchievementReward: (rewardName: string) => number | boolean | undefined
  R_getAmbrosiaUpgradeEffects: (upgradeKey: string) => any
  R_getAntUpgradeEffect: (upgradeKey: AntUpgrades) => any
  R_getLevelMilestone: (name: SynergismLevelMilestones) => number
  R_CalcECC: (refinement: string, value: number) => number
  R_getRuneEffects: (rune: RuneKeys) => any
  R_firstFiveFreeLevels: () => number
  R_firstFiveEffectiveRuneLevelMult: () => number
  getRuneBonusLevels: (rune: RuneKeys) => number
  R_speedRuneOOMIncrease: () => number
  R_duplicationRuneOOMIncrease: () => number
  R_prismRuneOOMIncrease: () => number
  R_thriftRuneOOMIncrease: () => number
  R_superiorIntellectOOMIncrease: () => number
  R_universalRuneEXPMult: (purchasedLevels: number) => Decimal
  R_SIEffectiveRuneLevelMult: () => number
  checkCalculationCache: (cacheName: keyof CalculationCache, calculationVars: number[]) => number | undefined
  updateCalculationCache: (cacheName: keyof CalculationCache, item: CachedValue) => void
}

export interface AchievementHelperContext {
  getGameData: () => Player | undefined
  getCampaignData: () => any
  getSingularityChallengeEffect: (challengeKey: string, effectKey: string) => number
  R_getPrestigePointGain: () => Decimal
  R_getTranscendPointGain: () => Decimal
  R_getReincarnationPointGain: () => Decimal
  R_calcCorruptionStuff: () => { effectiveScore: number }
  R_calculateChallenge15Reward: (rewardName: string) => number
  R_getRuneEffectiveLevel: (rune: RuneKeys) => number
  R_runes: () => Record<RuneKeys, any>
  R_calculateSynergismLevel: () => number
  R_calculateAscensionScore: () => { effectiveScore: number }
  checkCalculationCache: (cacheName: keyof CalculationCache, calculationVars: number[]) => number | undefined
  updateCalculationCache: (cacheName: keyof CalculationCache, item: CachedValue) => void
}

export const FAVORITE_UPGRADE_GQ_DEPENDENCIES = ['goldenQuarks1', 'platonicDelta', 'oneMind'] as const;
export const FAVORITE_UPGRADE_OCTERACT_DEPENDENCIES = ['octeractImprovedFree', 'octeractCorruption', 'octeractBlueberries'] as const;
export const FAVORITE_UPGRADE_RED_AMBROSIA_DEPENDENCIES = ['tutorial', 'infiniteShopUpgrades', 'blueberryGenerationSpeed2'] as const;

export type GoldenQuarkUpgradeRewards = {
  goldenQuarks1: { goldenQuarkMult: number }
  goldenQuarks2: { goldenQuarkCostMult: number }
  goldenQuarks3: { exportGQPerHour: number }
  starterPack: {
    obtainiumMult: number
    offeringMult: number
    cubeMult: number
  }
  cookies: { unlocked: boolean }
  cookies2: { unlocked: boolean }
  cookies3: { unlocked: boolean }
  cookies4: { unlocked: boolean }
  cookies5: { unlocked: boolean }
  ascensions: { ascensionCountMult: number }
  corruptionFourteen: { unlocked: boolean }
  corruptionFifteen: { freeCorruptionLevel: number }
  singOfferings1: { offeringMult: number }
  singOfferings2: { offeringMult: number }
  singOfferings3: { offeringMult: number }
  singObtainium1: { obtainiumMult: number }
  singObtainium2: { obtainiumMult: number }
  singObtainium3: { obtainiumMult: number }
  singCubes1: { cubeMult: number }
  singCubes2: { cubeMult: number }
  singCubes3: { cubeMult: number }
  singCitadel: {
    offeringMult: number
    obtainiumMult: number
    cubeMult: number
  }
  singCitadel2: {
    offeringMult: number
    obtainiumMult: number
    cubeMult: number
    citadel1FreeLevels: number
  }
  octeractUnlock: { unlocked: boolean }
  singOcteractPatreonBonus: { octeractMult: number }
  offeringAutomatic: { unlocked: boolean }
  intermediatePack: {
    globalSpeedMult: number
    ascensionSpeedMult: number
    packQuarkAdd: number
  }
  advancedPack: {
    packQuarkAdd: number
    corruptionScoreIncrease: number
  }
  expertPack: {
    packQuarkAdd: number
    ascensionScoreMult: number
    addCodeAscensionTimeMult: number
  }
  masterPack: {
    packQuarkAdd: number
    ascensionScoreMult: number
  }
  divinePack: {
    packQuarkAdd: number
    octeractMult: number
  }
  wowPass: { unlocked: boolean }
  wowPass2: { unlocked: boolean }
  wowPass3: { unlocked: boolean }
  wowPass4: { unlocked: boolean }
  potionBuff: { potionPowerMult: number }
  potionBuff2: { potionPowerMult: number }
  potionBuff3: { potionPowerMult: number }
  singChallengeExtension: {
    reincarnationCapIncrease: number
    ascensionCapIncrease: number
  }
  singChallengeExtension2: {
    reincarnationCapIncrease: number
    ascensionCapIncrease: number
  }
  singChallengeExtension3: {
    reincarnationCapIncrease: number
    ascensionCapIncrease: number
  }
  singQuarkImprover1: { quarkMult: number }
  singQuarkHepteract: { quarkHeptExponent: number }
  singQuarkHepteract2: { quarkHeptExponent: number }
  singQuarkHepteract3: { quarkHeptExponent: number }
  singOcteractGain: { octeractMult: number }
  singOcteractGain2: { octeractMult: number }
  singOcteractGain3: { octeractMult: number }
  singOcteractGain4: { octeractMult: number }
  singOcteractGain5: { octeractMult: number }
  platonicTau: {
    unlocked: boolean
    tauPower: number
  }
  platonicAlpha: { unlocked: boolean }
  platonicDelta: { cubeMult: number }
  platonicPhi: { dailyCodes: number }
  singFastForward: { lookahead: number }
  singFastForward2: { lookahead: number }
  singAscensionSpeed: { exponentSpread: number }
  singAscensionSpeed2: { exponentSpread: number }
  ultimatePen: { platonicPowers: boolean }
  halfMind: { unlocked: boolean }
  oneMind: { unlocked: boolean }
  blueberries: { blueberries: number }
  singAmbrosiaLuck: { ambrosiaLuck: number }
  singAmbrosiaLuck2: { ambrosiaLuck: number }
  singAmbrosiaLuck3: { ambrosiaLuck: number }
  singAmbrosiaLuck4: { ambrosiaLuck: number }
  singAmbrosiaGeneration: { ambrosiaBarSpeedMult: number }
  singAmbrosiaGeneration2: { ambrosiaBarSpeedMult: number }
  singAmbrosiaGeneration3: { ambrosiaBarSpeedMult: number }
  singAmbrosiaGeneration4: { ambrosiaBarSpeedMult: number }
  singBonusTokens1: { firstCompletionBonusTokens: number }
  singBonusTokens2: { tokenMultiplier: number }
  singBonusTokens3: { lastCompletionBonusTokens: number }
  singBonusTokens4: { initialTokenBonus: number }
  singInfiniteShopUpgrades: { infinityVouchers: number }
  singTalismanBonusRunes1: { talismanRuneEffect: number }
  singTalismanBonusRunes2: { talismanRuneEffect: number }
  singTalismanBonusRunes3: { talismanRuneEffect: number }
  singTalismanBonusRunes4: { talismanRuneEffect: number }
  favoriteUpgrade: { quarkMult: number }
}

export const offeringPotionThresholds = [
    1,
    10,
    25,
    50,
    100,
    500,
    1000,
    10000,
    50000,
    100000,
    1000000,
    10000000,
    100000000,
    1000000000,
    10000000000,
    100000000000,
    1000000000000,
    10000000000000,
    100000000000000
]

export const obtainiumPotionThresholds = [
    1,
    20,
    50,
    250,
    1000,
    20000,
    400000,
    10000000,
    400000000,
    10000000000,
    100000000000,
    1000000000000,
    10000000000000,
    100000000000000,
    1000000000000000
]

export const TALISMAN_EXEMPTION_INSCRIPT_VALUES = [0, -0.2, -0.3, -0.4, -0.45, -0.5, -0.55, -0.6, -0.61, -0.62, -0.65]
export const TALISMAN_CHRONOS_INSCRIPT_VALUES = [1, 1.04, 1.08, 1.12, 1.16, 1.20, 1.25, 1.30, 1.325, 1.35, 1.4]
export const TALISMAN_MIDAS_INSCRIPT_VALUES = [1, 1.04, 1.08, 1.12, 1.16, 1.20, 1.25, 1.30, 1.325, 1.35, 1.40]
export const TALISMAN_METAPHYSICS_INSCRIPT_VALUES = [1, 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 2]
export const TALISMAN_POLYMATH_INSCRIPT_VALUES = [1, 1.04, 1.08, 1.12, 1.16, 1.20, 1.25, 1.30, 1.325, 1.35, 1.40]
export const TALISMAN_MORTUUS_INSCRIPT_VALUES = [1, 1.05, 1.1, 1.15, 1.2, 1.3, 1.4, 1.5, 1.65, 1.8, 2]
export const TALISMAN_PLASTIC_INSCRIPT_VALUES = [1, 1.005, 1.01, 1.015, 1.02, 1.025, 1.03, 1.04, 1.045, 1.05, 1.0666]
export const TALISMAN_WOWSQUARE_INSCRIPT_VALUES = [1, 1.025, 1.05, 1.075, 1.1, 1.125, 1.15, 1.2, 1.225, 1.25, 1.30]
export const TALISMAN_ACHIEVEMENT_EFFECT_INSCRIPT_VALUES = [0, 0.001, 0.002, 0.003, 0.004, 0.006, 0.008, 0.01, 0.015, 0.02, 0.03]
export const TALISMAN_ACHIEVEMENT_DESC_INSCRIPT_VALUES = [1, 1, 1, 1, 1, 1, 1, 1.01, 1.015, 1.02, 1.03]
export const TALISMAN_COOKIEGRANDMA_INSCRIPT_VALUES = [0, 0.01, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.10]
export const TALISMAN_HORSESHOE_INSCRIPT_VALUES = [0, 0.001, 0.002, 0.003, 0.004, 0.005, 0.007, 0.01, 0.012, 0.015, 0.02]

export const ACHIEVEMENT_REWARD_TYPES: AchievementRewards[] = [
    'acceleratorPower',
    'accelerators',
    'multipliers',
    'accelBoosts',
    'crystalMultiplier',
    'taxReduction',
    'particleGain',
    'conversionExponent',
    'chronosTalisman',
    'midasTalisman',
    'metaphysicsTalisman',
    'polymathTalisman',
    'talismanPower',
    'sacrificeMult',
    'antSpeed',
    'antSacrificeUnlock',
    'preserveAnthillCount',
    'preserveAnthillCountSingularity',
    'antAutobuyers',
    'inceptusAutobuy',
    'fortunaeAutobuy',
    'tributumAutobuy',
    'celeritasAutobuy',
    'exploratoremAutobuy',
    'sacrificiumAutobuy',
    'experientiaAutobuy',
    'hicAutobuy',
    'scientiaAutobuy',
    'praemoenioAutobuy',
    'phylacteriumAutobuy',
    'antELOAdditive',
    'antELOAdditiveMultiplier',
    'wowSquareTalisman',
    'ascensionCountMultiplier',
    'ascensionCountAdditive',
    'wowCubeGain',
    'wowTesseractGain',
    'wowHypercubeGain',
    'wowPlatonicGain',
    'quarkGain',
    'wowHepteractGain',
    'ascensionScore',
    'constUpgrade1Buff',
    'constUpgrade2Buff',
    'platonicToHypercubes',
    'statTracker',
    'ascensionRewardScaling',
    'overfluxConversionRate',
    'diamondUpgrade18',
    'diamondUpgrade19',
    'diamondUpgrade20',
    'prestigeCountMultiplier',
    'transcensionCountMultiplier',
    'reincarnationCountMultiplier',
    'duplicationRuneUnlock',
    'prismRuneUnlock',
    'thriftRuneUnlock',
    'salvage',
    'offeringBonus',
    'obtainiumBonus',
    'transcendToPrestige',
    'reincarnationToTranscend',
    'antSacrificeCountMultiplier',
    'freeAntUpgrades',
    'autoAntSacrifice',
    'antSpeed2UpgradeImprover',
    'antSacrificeToReincarnation'
] as const;

export interface CalculationCache {
    [key: string]: CachedValue;
    R_AmbrosiaGenerationShopUpgrade: CachedValue;
    R_AmbrosiaGenerationSingularityUpgrade: CachedValue;
    R_AmbrosiaGenerationOcteractUpgrade: CachedValue;
    R_SingularityMilestoneBlueberries: CachedValue;
    R_DilatedFiveLeafBonus: CachedValue;
    R_SingularityAmbrosiaLuckMilestoneBonus: CachedValue;
    R_AmbrosiaLuckShopUpgrade: CachedValue;
    R_AmbrosiaLuckSingularityUpgrade: CachedValue;
    R_AmbrosiaLuckOcteractUpgrade: CachedValue;
    R_PanthemaAmbrosiaLuck: CachedValue;
    R_PanthemaRedLuck: CachedValue;
    R_TalismanRarityTotal: CachedValue;
    R_CubesExpTotal: CachedValue;
    R_FreeAntUpgradeLevels: CachedValue;
    R_CalculateTrueAntLevel: CachedValue;
    R_GetRuneEffectiveLevel: CachedValue;

    AMB_ambrosiaTutorial: CachedValue;

    AMB_ambrosiaQuarks1: CachedValue;
    AMB_ambrosiaCubes1: CachedValue;
    AMB_ambrosiaLuck1: CachedValue;

    AMB_ambrosiaQuarkCube1: CachedValue;
    AMB_ambrosiaLuckCube1: CachedValue;
    AMB_ambrosiaCubeQuark1: CachedValue;
    AMB_ambrosiaLuckQuark1: CachedValue;
    AMB_ambrosiaCubeLuck1: CachedValue;
    AMB_ambrosiaQuarkLuck1: CachedValue;

    AMB_ambrosiaQuarks2: CachedValue;
    AMB_ambrosiaCubes2: CachedValue;
    AMB_ambrosiaLuck2: CachedValue;

    AMB_ambrosiaQuarks3: CachedValue;
    AMB_ambrosiaCubes3: CachedValue;
    AMB_ambrosiaLuck3: CachedValue;
    AMB_ambrosiaLuck4: CachedValue;

    AMB_ambrosiaPatreon: CachedValue;

    AMB_ambrosiaObtainium1: CachedValue;
    AMB_ambrosiaOffering1: CachedValue;

    AMB_ambrosiaHyperflux: CachedValue;

    AMB_ambrosiaBaseOffering1: CachedValue;
    AMB_ambrosiaBaseObtainium1: CachedValue;
    AMB_ambrosiaBaseOffering2: CachedValue;
    AMB_ambrosiaBaseObtainium2: CachedValue;

    AMB_ambrosiaSingReduction1: CachedValue;
    AMB_ambrosiaSingReduction2: CachedValue;

    AMB_ambrosiaInfiniteShopUpgrades1: CachedValue;
    AMB_ambrosiaInfiniteShopUpgrades2: CachedValue;

    AMB_ambrosiaTalismanBonusRuneLevel: CachedValue;
    AMB_ambrosiaRuneOOMBonus: CachedValue;

    AMB_ambrosiaBrickOfLead: CachedValue;
    AMB_ambrosiaFreeGenerationUpgrades: CachedValue;
    AMB_ambrosiaFreeLuckUpgrades: CachedValue;
    AMB_ambrosiaFreeQuarkUpgrades: CachedValue;
    AMB_ambrosiaFreeRedLuckUpgrades: CachedValue;

    REDAMB_blueberryGenerationSpeed: CachedValue;
    REDAMB_blueberryGenerationSpeed2: CachedValue;
    REDAMB_freeLevelsRow2: CachedValue;
    REDAMB_freeLevelsRow3: CachedValue;
    REDAMB_freeLevelsRow4: CachedValue;
    REDAMB_freeLevelsRow5: CachedValue;
    REDAMB_regularLuck: CachedValue;
    REDAMB_regularLuck2: CachedValue;
    REDAMB_viscount: CachedValue;
    REDAMB_tutorial: CachedValue;
    REDAMB_conversionImprovement1: CachedValue;
    REDAMB_conversionImprovement2: CachedValue;
    REDAMB_conversionImprovement3: CachedValue;
    REDAMB_freeTutorialLevels: CachedValue;
    REDAMB_redGenerationSpeed: CachedValue;
    REDAMB_redLuck: CachedValue;
    REDAMB_redAmbrosiaCube: CachedValue;
    REDAMB_redAmbrosiaObtainium: CachedValue;
    REDAMB_redAmbrosiaOffering: CachedValue;
    REDAMB_redAmbrosiaCubeImprover: CachedValue;
    REDAMB_redAmbrosiaFreeAccumulator: CachedValue;
    REDAMB_freeOfferingUpgrades: CachedValue;
    REDAMB_freeObtainiumUpgrades: CachedValue;
    REDAMB_freeCubeUpgrades: CachedValue;
    REDAMB_freeSpeedUpgrades: CachedValue;
    REDAMB_infiniteShopUpgrades: CachedValue;
    REDAMB_redAmbrosiaAccelerator: CachedValue;
    REDAMB_salvageYinYang: CachedValue;
    REDAMB_blueberries: CachedValue;

    R_CampaignAmbrosiaSpeedBonus: CachedValue;
    R_CampaignRune6Bonus: CachedValue;
    R_CampaignLuckBonus: CachedValue;
    R_calculateCampaignRune6Bonus: CachedValue;
    R_CookieUpgrade29Luck: CachedValue;
    R_SumOfExaltCompletions: CachedValue;

    R_NumberOfThresholds: CachedValue;
    R_ToNextThreshold: CachedValue;
    R_RequiredBlueberryTime: CachedValue;
    R_RequiredRedAmbrosiaTime: CachedValue;

    EVENTBUFF_Quark: CachedValue;
    EVENTBUFF_GoldenQuark: CachedValue;
    EVENTBUFF_Cubes: CachedValue;
    EVENTBUFF_PowderConversion: CachedValue;
    EVENTBUFF_AscensionSpeed: CachedValue;
    EVENTBUFF_GlobalSpeed: CachedValue;
    EVENTBUFF_AscensionScore: CachedValue;
    EVENTBUFF_AntSacrifice: CachedValue;
    EVENTBUFF_Offering: CachedValue;
    EVENTBUFF_Obtainium: CachedValue;
    EVENTBUFF_Octeract: CachedValue;
    EVENTBUFF_BlueberryTime: CachedValue;
    EVENTBUFF_AmbrosiaLuck: CachedValue;
    EVENTBUFF_OneMind: CachedValue;

    R_RawAscensionSpeedMult: CachedValue;
    R_HepteractEffective: CachedValue;
    R_AllShopTablets: CachedValue;
    R_LimitedAscensionsDebuff: CachedValue;
    R_SingularityDebuff: CachedValue;
    R_SingularityReductions: CachedValue;
    R_EffectiveSingularities: CachedValue;
    R_AscensionSpeedExponentSpread: CachedValue;

    R_RedAmbrosiaLuck: CachedValue;
    R_LuckConversion: CachedValue;
}

export type RuneTypeMap = {
    speed: {
        acceleratorPower: number
        multiplicativeAccelerators: number
        globalSpeed: number
    }
    duplication: {
        multiplierBoosts: number
        multiplicativeMultipliers: number
        taxReduction: number
    }
    prism: {
        productionLog10: number
        costDivisorLog10: number
    }
    thrift: {
        costDelay: number
        salvage: number
        taxReduction: number
    }
    superiorIntellect: {
        offeringMult: number
        obtainiumMult: number
        antSpeed: number
    }
    infiniteAscent: {
        quarkMult: number
        cubeMult: number
        salvage: number
    }
    antiquities: {
        addCodeCooldownReduction: number
        offeringLog10: number
        obtainiumLog10: number
    }
    horseShoe: {
        ambrosiaLuck: number
        redLuck: number
        redLuckConversion: number
    }
    topHat: {
        freeOfferingLevels: number
        freeObtainiumLevels: number
        freeCubeLevels: number
        freeSpeedLevels: number
        freeInfinityLevels: number
    }
    finiteDescent: {
        ascensionScore: number
        corruptionFreeLevels: number
        infiniteAscentFreeLevel: number
    }
}

export type RuneKeys = keyof RuneTypeMap
export const RUNE_KEYS: RuneKeys[] = [
    'speed',
    'duplication',
    'prism',
    'thrift',
    'superiorIntellect',
    'infiniteAscent',
    'antiquities',
    'horseShoe',
    'topHat',
    'finiteDescent',
]

export type TalismanCraftItems =
    | 'shard'
    | 'commonFragment'
    | 'uncommonFragment'
    | 'rareFragment'
    | 'epicFragment'
    | 'legendaryFragment'
    | 'mythicalFragment'

export type SynergismLevelMilestones =
    | 'offeringTimerScaling'
    | 'speedRune'
    | 'duplicationRune'
    | 'prismRune'
    | 'thriftRune'
    | 'SIRune'
    | 'autoPrestige'
    | 'tier1CrystalAutobuy'
    | 'tier2CrystalAutobuy'
    | 'tier3CrystalAutobuy'
    | 'tier4CrystalAutobuy'
    | 'tier5CrystalAutobuy'
    | 'achievementTalismanUnlock'
    | 'runeAutobuyImprover'
    | 'achievementTalismanEnhancement'
    | 'salvageChallengeBuff'
    | 'antSpeed2Autobuyer'
    | 'wowCubesAutobuyer'
    | 'ascensionScoreAutobuyer'
    | 'mortuus2Autobuyer'

export interface SynergismLevelMilestoneDefinition {
    effect: () => number
    defaultValue: number
    levelReq: number
}

export type TalismanTypeMap = {
    exemption: { taxReduction: number; duplicationOOMBonus: number }
    chronos: { globalSpeed: number; speedOOMBonus: number }
    midas: { blessingBonus: number; thriftOOMBonus: number }
    metaphysics: { talismanEffect: number; extraTalismanEffect: number }
    polymath: { ascensionSpeedBonus: number; SIOOMBonus: number }
    mortuus: { antBonus: number; prismOOMBonus: number }
    plastic: { quarkBonus: number }
    wowSquare: { evenDimBonus: number; oddDimBonus: number }
    achievement: { positiveSalvageMult: number; negativeSalvageMult: number }
    cookieGrandma: { freeCorruptionLevel: number; cookieSix: boolean }
    horseShoe: { luckPercentage: number; redLuck: number }
}

export type TalismanKeys = keyof TalismanTypeMap

export type GoldenQuarkUpgradeKey = keyof goldenQuarkUpgrades;
export type OcteractUpgradeKey = keyof octUpgrades;
export type RedAmbrosiaUpgradeKey = keyof RedAmbrosiaUpgrades;
export type RuneType = keyof Runes;

export interface CachedValue {
    value: number | undefined;
    cachedBy: number[]
}

export interface RedAmbrosiaUpgradeCalculationConfig<K extends keyof RedAmbrosiaUpgradeRewards> {
    costPerLevel: number,
    maxLevel: number,
    costFunction: (n: number, cpl: number) => number,
    effects: (n: number, gameData?: Player) => RedAmbrosiaUpgradeRewards[K]
}

export type RedAmbrosiaUpgradeRewards = {
    tutorial: { cubeMult: number; obtainiumMult: number; offeringMult: number }
    conversionImprovement1: { conversionImprovement: number }
    conversionImprovement2: { conversionImprovement: number }
    conversionImprovement3: { conversionImprovement: number }
    freeTutorialLevels: { freeLevels: number }
    freeLevelsRow2: { freeLevels: number }
    freeLevelsRow3: { freeLevels: number }
    freeLevelsRow4: { freeLevels: number }
    freeLevelsRow5: { freeLevels: number }
    blueberryGenerationSpeed: { blueberryGenerationSpeed: number }
    regularLuck: { ambrosiaLuck: number }
    redGenerationSpeed: { redAmbrosiaGenerationSpeed: number }
    redLuck: { redAmbrosiaLuck: number }
    redAmbrosiaCube: { unlockedRedAmbrosiaCube: boolean }
    redAmbrosiaObtainium: { unlockRedAmbrosiaObtainium: boolean }
    redAmbrosiaOffering: { unlockRedAmbrosiaOffering: boolean }
    redAmbrosiaCubeImprover: { extraExponent: number }
    viscount: { roleUnlock: boolean; quarkBonus: number; luckBonus: number; redLuckBonus: number }
    infiniteShopUpgrades: { freeLevels: number }
    redAmbrosiaAccelerator: { ambrosiaTimePerRedAmbrosia: number }
    regularLuck2: { ambrosiaLuck: number }
    blueberryGenerationSpeed2: { blueberryGenerationSpeed: number }
    salvageYinYang: { positiveSalvage: number; negativeSalvage: number }
    blueberries: { blueberries: number }
    redAmbrosiaFreeAccumulator: { freeAccumulatorLevels: number; freeAccumulatorLevelCapIncrease: number }
    freeOfferingUpgrades: { levels: number }
    freeObtainiumUpgrades: { levels: number }
    freeCubeUpgrades: { levels: number }
    freeSpeedUpgrades: { levels: number }
}

export type RedAmbrosiaNames = keyof RedAmbrosiaUpgradeRewards


export interface AmbrosiaUpgradeEffectContext {
    readonly freeLevelsOnly: boolean
    getAmbrosiaUpgradeLevel: (upgradeName: AmbrosiaUpgradeNames) => number
}

export interface AmbrosiaUpgradeCalculationConfig<
    K extends keyof AmbrosiaUpgradeRewards
> {
    costPerLevel: number
    maxLevel: number
    costFormula: (n: number, cpl: number) => number
    effects: (n: number, ctx?: AmbrosiaUpgradeEffectContext) => AmbrosiaUpgradeRewards[K]
    extraLevelCalc: () => number
    prerequisites?: Partial<Record<AmbrosiaUpgradeNames, number>>
    ignoreEXALT?: boolean
}


export interface AmbrosiaUpgradeCalculationCollection {
    ambrosiaTutorial: AmbrosiaUpgradeCalculationConfig<'ambrosiaTutorial'>

    ambrosiaQuarks1: AmbrosiaUpgradeCalculationConfig<'ambrosiaQuarks1'>
    ambrosiaCubes1: AmbrosiaUpgradeCalculationConfig<'ambrosiaCubes1'>
    ambrosiaLuck1: AmbrosiaUpgradeCalculationConfig<'ambrosiaLuck1'>

    ambrosiaQuarkCube1: AmbrosiaUpgradeCalculationConfig<'ambrosiaQuarkCube1'>
    ambrosiaLuckCube1: AmbrosiaUpgradeCalculationConfig<'ambrosiaLuckCube1'>
    ambrosiaCubeQuark1: AmbrosiaUpgradeCalculationConfig<'ambrosiaCubeQuark1'>
    ambrosiaLuckQuark1: AmbrosiaUpgradeCalculationConfig<'ambrosiaLuckQuark1'>
    ambrosiaCubeLuck1: AmbrosiaUpgradeCalculationConfig<'ambrosiaCubeLuck1'>
    ambrosiaQuarkLuck1: AmbrosiaUpgradeCalculationConfig<'ambrosiaQuarkLuck1'>

    ambrosiaQuarks2: AmbrosiaUpgradeCalculationConfig<'ambrosiaQuarks2'>
    ambrosiaCubes2: AmbrosiaUpgradeCalculationConfig<'ambrosiaCubes2'>
    ambrosiaLuck2: AmbrosiaUpgradeCalculationConfig<'ambrosiaLuck2'>

    ambrosiaQuarks3: AmbrosiaUpgradeCalculationConfig<'ambrosiaQuarks3'>
    ambrosiaCubes3: AmbrosiaUpgradeCalculationConfig<'ambrosiaCubes3'>
    ambrosiaLuck3: AmbrosiaUpgradeCalculationConfig<'ambrosiaLuck3'>
    ambrosiaLuck4: AmbrosiaUpgradeCalculationConfig<'ambrosiaLuck4'>

    ambrosiaPatreon: AmbrosiaUpgradeCalculationConfig<'ambrosiaPatreon'>

    ambrosiaObtainium1: AmbrosiaUpgradeCalculationConfig<'ambrosiaObtainium1'>
    ambrosiaOffering1: AmbrosiaUpgradeCalculationConfig<'ambrosiaOffering1'>

    ambrosiaHyperflux: AmbrosiaUpgradeCalculationConfig<'ambrosiaHyperflux'>

    ambrosiaBaseOffering1: AmbrosiaUpgradeCalculationConfig<'ambrosiaBaseOffering1'>
    ambrosiaBaseObtainium1: AmbrosiaUpgradeCalculationConfig<'ambrosiaBaseObtainium1'>
    ambrosiaBaseOffering2: AmbrosiaUpgradeCalculationConfig<'ambrosiaBaseOffering2'>
    ambrosiaBaseObtainium2: AmbrosiaUpgradeCalculationConfig<'ambrosiaBaseObtainium2'>

    ambrosiaSingReduction1: AmbrosiaUpgradeCalculationConfig<'ambrosiaSingReduction1'>
    ambrosiaSingReduction2: AmbrosiaUpgradeCalculationConfig<'ambrosiaSingReduction2'>

    ambrosiaInfiniteShopUpgrades1: AmbrosiaUpgradeCalculationConfig<'ambrosiaInfiniteShopUpgrades1'>
    ambrosiaInfiniteShopUpgrades2: AmbrosiaUpgradeCalculationConfig<'ambrosiaInfiniteShopUpgrades2'>

    ambrosiaTalismanBonusRuneLevel: AmbrosiaUpgradeCalculationConfig<'ambrosiaTalismanBonusRuneLevel'>
    ambrosiaRuneOOMBonus: AmbrosiaUpgradeCalculationConfig<'ambrosiaRuneOOMBonus'>

    ambrosiaBrickOfLead: AmbrosiaUpgradeCalculationConfig<'ambrosiaBrickOfLead'>
    ambrosiaFreeLuckUpgrades: AmbrosiaUpgradeCalculationConfig<'ambrosiaFreeLuckUpgrades'>
    ambrosiaFreeGenerationUpgrades: AmbrosiaUpgradeCalculationConfig<'ambrosiaFreeGenerationUpgrades'>
    ambrosiaFreeRedLuckUpgrades: AmbrosiaUpgradeCalculationConfig<'ambrosiaFreeRedLuckUpgrades'>
    ambrosiaFreeQuarkUpgrades: AmbrosiaUpgradeCalculationConfig<'ambrosiaFreeQuarkUpgrades'>
}

export type PseudoCoinUpgradeNames =
    | 'INSTANT_UNLOCK_1'
    | 'INSTANT_UNLOCK_2'
    | 'CUBE_BUFF'
    | 'AMBROSIA_LUCK_BUFF'
    | 'AMBROSIA_GENERATION_BUFF'
    | 'GOLDEN_QUARK_BUFF'
    | 'FREE_UPGRADE_PROMOCODE_BUFF'
    | 'CORRUPTION_LOADOUT_SLOT_QOL'
    | 'AMBROSIA_LOADOUT_SLOT_QOL'
    | 'AUTO_POTION_FREE_POTIONS_QOL'
    | 'OFFLINE_TIMER_CAP_BUFF'
    | 'ADD_CODE_CAP_BUFF'
    | 'BASE_OFFERING_BUFF'
    | 'BASE_OBTAINIUM_BUFF'
    | 'RED_GENERATION_BUFF'
    | 'RED_LUCK_BUFF'

export type PseudoCoinUpgradeEffects = Record<PseudoCoinUpgradeNames, number>


export const PCoinUpgradeEffects: PseudoCoinUpgradeEffects = {
    INSTANT_UNLOCK_1: 0,
    INSTANT_UNLOCK_2: 0,
    CUBE_BUFF: 1,
    AMBROSIA_LUCK_BUFF: 0,
    AMBROSIA_GENERATION_BUFF: 1,
    GOLDEN_QUARK_BUFF: 1,
    FREE_UPGRADE_PROMOCODE_BUFF: 1,
    CORRUPTION_LOADOUT_SLOT_QOL: 0,
    AMBROSIA_LOADOUT_SLOT_QOL: 0,
    AUTO_POTION_FREE_POTIONS_QOL: 0,
    OFFLINE_TIMER_CAP_BUFF: 1,
    ADD_CODE_CAP_BUFF: 1,
    BASE_OFFERING_BUFF: 0,
    BASE_OBTAINIUM_BUFF: 0,
    RED_GENERATION_BUFF: 1,
    RED_LUCK_BUFF: 0
}

export type AmbrosiaUpgradeRewards = {
    ambrosiaTutorial: { quarks: number; cubes: number }
    ambrosiaQuarks1: { quarks: number }
    ambrosiaCubes1: { cubes: number }
    ambrosiaLuck1: { ambrosiaLuck: number }
    ambrosiaQuarkCube1: { cubes: number }
    ambrosiaLuckCube1: { cubes: number }
    ambrosiaCubeQuark1: { quarks: number }
    ambrosiaLuckQuark1: { quarks: number }
    ambrosiaCubeLuck1: { ambrosiaLuck: number }
    ambrosiaQuarkLuck1: { ambrosiaLuck: number }
    ambrosiaQuarks2: { quarks: number }
    ambrosiaCubes2: { cubes: number }
    ambrosiaLuck2: { ambrosiaLuck: number }
    ambrosiaQuarks3: { quarks: number }
    ambrosiaCubes3: { cubes: number }
    ambrosiaLuck3: { ambrosiaLuck: number }
    ambrosiaLuck4: { ambrosiaLuckPercentage: number }
    ambrosiaPatreon: { blueberryGeneration: number }
    ambrosiaObtainium1: { luckMult: number; obtainiumMult: number }
    ambrosiaOffering1: { luckMult: number; offeringMult: number }
    ambrosiaHyperflux: { hyperFlux: number }
    ambrosiaBaseOffering1: { offering: number }
    ambrosiaBaseObtainium1: { obtainium: number }
    ambrosiaBaseOffering2: { offering: number }
    ambrosiaBaseObtainium2: { obtainium: number }
    ambrosiaSingReduction1: { singularityReduction: number }
    ambrosiaInfiniteShopUpgrades1: { freeLevels: number }
    ambrosiaInfiniteShopUpgrades2: { freeLevels: number }
    ambrosiaSingReduction2: { singularityReduction: number }
    ambrosiaTalismanBonusRuneLevel: { talismanBonusRuneLevel: number }
    ambrosiaRuneOOMBonus: { runeOOMBonus: number; infiniteAscentOOMBonus: number }
    ambrosiaBrickOfLead: { barRequirementMult: number; additiveLuckMult: number; singularitySpeedMult: number }
    ambrosiaFreeQuarkUpgrades: { freeQuarkUpgrades: number }
    ambrosiaFreeLuckUpgrades: { freeLuckUpgrades: number }
    ambrosiaFreeGenerationUpgrades: { freeGenerationUpgrades: number }
    ambrosiaFreeRedLuckUpgrades: { freeRedLuckUpgrades: number }
}

export type AmbrosiaUpgradeNames = keyof AmbrosiaUpgradeRewards

export enum AntUpgrades {
    AntSpeed = 0,
    Coins = 1,
    Taxes = 2,
    AcceleratorBoosts = 3,
    Multipliers = 4,
    Offerings = 5,
    BuildingCostScale = 6,
    Salvage = 7,
    FreeRunes = 8,
    Obtainium = 9,
    AntSacrifice = 10,
    Mortuus = 11,
    AntELO = 12,
    WowCubes = 13,
    AscensionScore = 14,
    Mortuus2 = 15
}

export type AchievementGroups =
    | 'firstOwnedCoin'
    | 'secondOwnedCoin'
    | 'thirdOwnedCoin'
    | 'fourthOwnedCoin'
    | 'fifthOwnedCoin'
    | 'prestigePointGain'
    | 'transcendPointGain'
    | 'reincarnationPointGain'
    | 'challenge1'
    | 'challenge2'
    | 'challenge3'
    | 'challenge4'
    | 'challenge5'
    | 'challenge6'
    | 'challenge7'
    | 'challenge8'
    | 'challenge9'
    | 'challenge10'
    | 'accelerators'
    | 'acceleratorBoosts'
    | 'multipliers'
    | 'antCrumbs'
    | 'sacMult'
    | 'ascensionCount'
    | 'constant'
    | 'challenge11'
    | 'challenge12'
    | 'challenge13'
    | 'challenge14'
    | 'ascensionScore'
    | 'speedBlessing'
    | 'speedSpirit'
    | 'singularityCount'
    | 'runeLevel'
    | 'runeFreeLevel'
    | 'campaignTokens'
    | 'prestigeCount'
    | 'transcensionCount'
    | 'reincarnationCount'
    | 'sacCount'
    | 'addCodesUsed'
    | 'ungrouped'

export type AchievementRewards =
    | 'acceleratorPower'
    | 'accelerators'
    | 'multipliers'
    | 'accelBoosts'
    | 'crystalMultiplier'
    | 'taxReduction'
    | 'particleGain'
    | 'conversionExponent'
    | 'chronosTalisman'
    | 'midasTalisman'
    | 'metaphysicsTalisman'
    | 'polymathTalisman'
    | 'talismanPower'
    | 'sacrificeMult'
    | 'antSpeed'
    | 'antSacrificeUnlock'
    | 'preserveAnthillCount'
    | 'preserveAnthillCountSingularity'
    | 'antAutobuyers'
    | 'inceptusAutobuy'
    | 'fortunaeAutobuy'
    | 'tributumAutobuy'
    | 'celeritasAutobuy'
    | 'exploratoremAutobuy'
    | 'sacrificiumAutobuy'
    | 'experientiaAutobuy'
    | 'hicAutobuy'
    | 'scientiaAutobuy'
    | 'praemoenioAutobuy'
    | 'phylacteriumAutobuy'
    | 'antELOAdditive'
    | 'antELOAdditiveMultiplier'
    | 'wowSquareTalisman'
    | 'ascensionCountMultiplier'
    | 'ascensionCountAdditive'
    | 'wowCubeGain'
    | 'wowTesseractGain'
    | 'wowHypercubeGain'
    | 'wowPlatonicGain'
    | 'quarkGain'
    | 'wowHepteractGain'
    | 'ascensionScore'
    | 'constUpgrade1Buff'
    | 'constUpgrade2Buff'
    | 'platonicToHypercubes'
    | 'antSacrificeToReincarnation'
    | 'statTracker'
    | 'ascensionRewardScaling'
    | 'overfluxConversionRate'
    | 'diamondUpgrade18'
    | 'diamondUpgrade19'
    | 'diamondUpgrade20'
    | 'prestigeCountMultiplier'
    | 'transcensionCountMultiplier'
    | 'reincarnationCountMultiplier'
    | 'duplicationRuneUnlock'
    | 'prismRuneUnlock'
    | 'thriftRuneUnlock'
    | 'salvage'
    | 'offeringBonus'
    | 'obtainiumBonus'
    | 'transcendToPrestige'
    | 'reincarnationToTranscend'
    | 'antSacrificeCountMultiplier'
    | 'freeAntUpgrades'
    | 'autoAntSacrifice'
    | 'antSpeed2UpgradeImprover'

export type AchievementReward = Partial<Record<AchievementRewards, (player?: Player) => number>>

export interface Achievement {
    pointValue: number;
    unlockCondition?: () => boolean;
    group: AchievementGroups;
    reward?: AchievementReward;
    checkReset?: () => boolean;
}

export enum AntProducers {
    'Workers' = 0,
    'Breeders' = 1,
    'MetaBreeders' = 2,
    'MegaBreeders' = 3,
    'Queens' = 4,
    'LordRoyals' = 5,
    'Almighties' = 6,
    'Disciples' = 7,
    'HolySpirit' = 8
}

export const LAST_ANT_PRODUCER = AntProducers.HolySpirit

export type SingularityChallengeDataKeys =
    | 'noSingularityUpgrades'
    | 'oneChallengeCap'
    | 'limitedAscensions'
    | 'noQuarkUpgrades'
    | 'noOcteracts'
    | 'noAmbrosiaUpgrades'
    | 'limitedTime'
    | 'sadisticPrequel'
    | 'taxmanLastStand'

export interface ISingularityChallengeData<T = Record<string, number | boolean>> {
    baseReq: number
    maxCompletions: number
    unlockSingularity: number
    HTMLTag: SingularityChallengeDataKeys
    singularityRequirement: (baseReq: number, completions: number) => number
    achievementPointValue: (n: number) => number
    scalingrewardcount: number
    uniquerewardcount: number
    resetTime?: boolean
    completions?: number
    enabled?: boolean
    alternateDescription?: () => string
    highestSingularityCompleted?: number
    effect: (n: number) => T
}

export type ProgressiveAchievements =
    | 'runeLevel'
    | 'freeRuneLevel'
    | 'antMasteries'
    | 'rebornELO'
    | 'talismanRarities'
    | 'singularityCount'
    | 'ambrosiaCount'
    | 'redAmbrosiaCount'
    | 'singularityUpgrades'
    | 'octeractUpgrades'
    | 'redAmbrosiaUpgrades'
    | 'exalts'

export interface ProgressiveAchievement {
    maxPointValue: number
    pointsAwarded: (cached: number) => number
    updateValue: () => number // Number to compare to existing caches
    useCachedValue: boolean
    rewardedAP: number // Updating achievementPoints: pointsAwarded() - rewardedAP
    displayOrder: number
    displayCondition: () => boolean
}

export type AntUpgradeTypeMap = {
    [AntUpgrades.AntSpeed]: { antSpeed: Decimal }
    [AntUpgrades.Coins]: {
        crumbToCoinExp: number
        coinMultiplier: Decimal
    }
    [AntUpgrades.Taxes]: { taxReduction: number }
    [AntUpgrades.AcceleratorBoosts]: { acceleratorBoostMult: number }
    [AntUpgrades.Multipliers]: { multiplierMult: number }
    [AntUpgrades.Offerings]: { offeringMult: number }
    [AntUpgrades.BuildingCostScale]: { buildingCostScale: number; buildingPowerMult: number }
    [AntUpgrades.Salvage]: { salvage: number }
    [AntUpgrades.FreeRunes]: { freeRuneLevel: number }
    [AntUpgrades.Obtainium]: { obtainiumMult: number }
    [AntUpgrades.AntSacrifice]: {
        antSacrificeMultiplier: number
        elo: number
    }
    [AntUpgrades.Mortuus]: {
        talismanUnlock: boolean
        globalSpeed: number
    }
    [AntUpgrades.AntELO]: {
        antELO: number
        antSacrificeLimitCount: number
    }
    [AntUpgrades.Mortuus2]: {
        talismanLevelIncreaser: number
        talismanEffectBuff: number
        ascensionSpeed: number
    }
    [AntUpgrades.AscensionScore]: {
        cubesBanked: number
        ascensionScoreBase: number
    }
    [AntUpgrades.WowCubes]: {
        wowCubes: number
    }
}

export interface RedAmbrosiaUpgradeCalculationCollection {
    tutorial: RedAmbrosiaUpgradeCalculationConfig<'tutorial'>;
    conversionImprovement1: RedAmbrosiaUpgradeCalculationConfig<'conversionImprovement1'>;
    conversionImprovement2: RedAmbrosiaUpgradeCalculationConfig<'conversionImprovement2'>;
    conversionImprovement3: RedAmbrosiaUpgradeCalculationConfig<'conversionImprovement3'>;
    freeTutorialLevels: RedAmbrosiaUpgradeCalculationConfig<'freeTutorialLevels'>;
    freeLevelsRow2: RedAmbrosiaUpgradeCalculationConfig<'freeLevelsRow2'>;
    freeLevelsRow3: RedAmbrosiaUpgradeCalculationConfig<'freeLevelsRow3'>;
    freeLevelsRow4: RedAmbrosiaUpgradeCalculationConfig<'freeLevelsRow4'>;
    freeLevelsRow5: RedAmbrosiaUpgradeCalculationConfig<'freeLevelsRow5'>;
    blueberryGenerationSpeed: RedAmbrosiaUpgradeCalculationConfig<'blueberryGenerationSpeed'>;
    regularLuck: RedAmbrosiaUpgradeCalculationConfig<'regularLuck'>;
    redGenerationSpeed: RedAmbrosiaUpgradeCalculationConfig<'redGenerationSpeed'>;
    redLuck: RedAmbrosiaUpgradeCalculationConfig<'redLuck'>;
    redAmbrosiaCube: RedAmbrosiaUpgradeCalculationConfig<'redAmbrosiaCube'>;
    redAmbrosiaObtainium: RedAmbrosiaUpgradeCalculationConfig<'redAmbrosiaObtainium'>;
    redAmbrosiaOffering: RedAmbrosiaUpgradeCalculationConfig<'redAmbrosiaOffering'>;
    redAmbrosiaCubeImprover: RedAmbrosiaUpgradeCalculationConfig<'redAmbrosiaCubeImprover'>;
    viscount: RedAmbrosiaUpgradeCalculationConfig<'viscount'>;
    infiniteShopUpgrades: RedAmbrosiaUpgradeCalculationConfig<'infiniteShopUpgrades'>;
    redAmbrosiaAccelerator: RedAmbrosiaUpgradeCalculationConfig<'redAmbrosiaAccelerator'>;
    regularLuck2: RedAmbrosiaUpgradeCalculationConfig<'regularLuck2'>;
    blueberryGenerationSpeed2: RedAmbrosiaUpgradeCalculationConfig<'blueberryGenerationSpeed2'>;
    salvageYinYang: RedAmbrosiaUpgradeCalculationConfig<'salvageYinYang'>;
    blueberries: RedAmbrosiaUpgradeCalculationConfig<'blueberries'>;
    redAmbrosiaFreeAccumulator: RedAmbrosiaUpgradeCalculationConfig<'redAmbrosiaFreeAccumulator'>;
    freeOfferingUpgrades: RedAmbrosiaUpgradeCalculationConfig<'freeOfferingUpgrades'>;
    freeObtainiumUpgrades: RedAmbrosiaUpgradeCalculationConfig<'freeObtainiumUpgrades'>;
    freeCubeUpgrades: RedAmbrosiaUpgradeCalculationConfig<'freeCubeUpgrades'>;
    freeSpeedUpgrades: RedAmbrosiaUpgradeCalculationConfig<'freeSpeedUpgrades'>;
}

export interface HepteractEffectiveValue {
    LIMIT: number;
    DR: number;
}

export type HepteractEffectiveValues = { [key in HepteractType]: HepteractEffectiveValue };

export const hepteractTypeList = [
    'chronos',
    'hyperrealism',
    'quark',
    'challenge',
    'abyss',
    'accelerator',
    'acceleratorBoost',
    'multiplier'
] as const

export type HepteractType = typeof hepteractTypeList[number];

//https://github.com/Pseudo-Corp/SynergismOfficial/blob/master/src/singularity.ts#L2680
export type SingularityDebuffs =
    | 'Offering'
    | 'Obtainium'
    | 'Salvage'
    | 'Global Speed'
    | 'Researches'
    | 'Ant ELO'
    | 'Ascension Speed'
    | 'Cubes'
    | 'Cube Upgrades'
    | 'Platonic Costs'
    | 'Hepteract Costs';

export interface HSCalculationParams {
    paramName: string;
    paramType: string;
    defaultValue?: any;
}

export interface HSCalculationDefinition {
    calculationName: string;
    // fnName is intentionally broad because calculation functions may come
    // from HSGameDataAPI or from registered helper providers.
    // TODO later: derive the union from GameDataAPI + actual helper keys
    fnName: string;
    fnParams: HSCalculationParams[];
    supportsReduce: boolean;
    toolingSupport: boolean;
}

export interface StatLine<T = number | Exclude<DecimalSource, string>> {
    i18n: string
    stat: () => T
    color?: string
    acc?: number
    displayCriterion?: () => boolean
}

export type NumberStatLine = StatLine<number>
