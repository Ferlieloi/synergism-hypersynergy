import { HSGameDataAPI } from "../../class/hs-core/gds/hs-gamedata-api";
import { goldenQuarkUpgrades, OcteractUpgradeData, octUpgrades, PlayerData, RedAmbrosiaUpgrades, Runes } from "./hs-player-savedata";

export interface CalculationCache {
    R_AmbrosiaGenerationShopUpgrade: CachedValue;
    R_AmbrosiaGenerationSingularityUpgrade: CachedValue;
    R_AmbrosiaGenerationOcteractUpgrade: CachedValue;
    R_SingularityMilestoneBlueberries: CachedValue;
    R_DilatedFiveLeafBonus: CachedValue;
    R_SingularityAmbrosiaLuckMilestoneBonus: CachedValue;
    R_AmbrosiaLuckShopUpgrade: CachedValue;
    R_AmbrosiaLuckSingularityUpgrade: CachedValue;
    R_AmbrosiaLuckOcteractUpgrade: CachedValue;
    R_TotalCubes: CachedValue;

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

    REDAMB_blueberryGenerationSpeed: CachedValue;
    REDAMB_blueberryGenerationSpeed2: CachedValue;
    REDAMB_freeLevelsRow2: CachedValue;
    REDAMB_freeLevelsRow3: CachedValue;
    REDAMB_freeLevelsRow4: CachedValue;
    REDAMB_freeLevelsRow5: CachedValue;
    REDAMB_regularLuck: CachedValue;
    REDAMB_regularLuck2: CachedValue;
    REDAMB_viscount: CachedValue;

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
    finiteDescent: {
        ascensionScore: number
        corruptionFreeLevels: number
        infiniteAscentFreeLevel: number
    }
}

export type RuneKeys = keyof RuneTypeMap

export type TalismanCraftItems =
    | 'shard'
    | 'commonFragment'
    | 'uncommonFragment'
    | 'rareFragment'
    | 'epicFragment'
    | 'legendaryFragment'
    | 'mythicalFragment'

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
    effects: (n: number) => RedAmbrosiaUpgradeRewards[K]
}

export type RedAmbrosiaUpgradeRewards = {
    tutorial: {
        cubeMult: number
        obtainiumMult: number
        offeringMult: number
    }
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
    redAmbrosiaCube: { unlockedRedAmbrosiaCube: number }
    redAmbrosiaObtainium: { unlockRedAmbrosiaObtainium: number }
    redAmbrosiaOffering: { unlockRedAmbrosiaOffering: number }
    redAmbrosiaCubeImprover: { extraExponent: number }
    viscount: {
        roleUnlock: boolean
        quarkBonus: number
        luckBonus: number
        redLuckBonus: number
    }
    infiniteShopUpgrades: { freeLevels: number }
    redAmbrosiaAccelerator: { ambrosiaTimePerRedAmbrosia: number }
    regularLuck2: { ambrosiaLuck: number }
    blueberryGenerationSpeed2: { blueberryGenerationSpeed: number }
    salvageYinYang: { positiveSalvage: number; negativeSalvage: number }
    blueberries: { blueberries: number }
}

export type RedAmbrosiaNames = keyof RedAmbrosiaUpgradeRewards


export interface AmbrosiaUpgradeCalculationConfig<
    K extends keyof AmbrosiaUpgradeRewards
> {
    costPerLevel: number
    maxLevel: number
    costFunction: (n: number, cpl: number) => number
    effects: (n: number) => AmbrosiaUpgradeRewards[K]
    extraLevelCalc: () => number
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

export type AchievementReward = Partial<Record<AchievementRewards, (player?: PlayerData) => number>>

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
    | 'noOcteracts'
    | 'limitedAscensions'
    | 'noAmbrosiaUpgrades'
    | 'limitedTime'
    | 'sadisticPrequel'
    | 'taxmanLastStand'

export interface ISingularityChallengeData {
    effect: (n: number) => Record<string, number | boolean>
    achievementPointValue: (n: number) => number
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
    blueberryGenerationSpeed: RedAmbrosiaUpgradeCalculationConfig<'blueberryGenerationSpeed'>;
    blueberryGenerationSpeed2: RedAmbrosiaUpgradeCalculationConfig<'blueberryGenerationSpeed2'>;
    freeLevelsRow2: RedAmbrosiaUpgradeCalculationConfig<'freeLevelsRow2'>;
    freeLevelsRow3: RedAmbrosiaUpgradeCalculationConfig<'freeLevelsRow3'>;
    freeLevelsRow4: RedAmbrosiaUpgradeCalculationConfig<'freeLevelsRow4'>;
    freeLevelsRow5: RedAmbrosiaUpgradeCalculationConfig<'freeLevelsRow5'>;
    regularLuck: RedAmbrosiaUpgradeCalculationConfig<'regularLuck'>;
    regularLuck2: RedAmbrosiaUpgradeCalculationConfig<'regularLuck2'>;
    viscount: RedAmbrosiaUpgradeCalculationConfig<'viscount'>;
    tutorial: RedAmbrosiaUpgradeCalculationConfig<'tutorial'>;
    conversionImprovement1: RedAmbrosiaUpgradeCalculationConfig<'conversionImprovement1'>;
    conversionImprovement2: RedAmbrosiaUpgradeCalculationConfig<'conversionImprovement2'>;
    conversionImprovement3: RedAmbrosiaUpgradeCalculationConfig<'conversionImprovement3'>;
    freeTutorialLevels: RedAmbrosiaUpgradeCalculationConfig<'freeTutorialLevels'>;
    redGenerationSpeed: RedAmbrosiaUpgradeCalculationConfig<'redGenerationSpeed'>;
    redLuck: RedAmbrosiaUpgradeCalculationConfig<'redLuck'>;
    redAmbrosiaCube: RedAmbrosiaUpgradeCalculationConfig<'redAmbrosiaCube'>;
    redAmbrosiaObtainium: RedAmbrosiaUpgradeCalculationConfig<'redAmbrosiaObtainium'>;
    redAmbrosiaOffering: RedAmbrosiaUpgradeCalculationConfig<'redAmbrosiaOffering'>;
    redAmbrosiaCubeImprover: RedAmbrosiaUpgradeCalculationConfig<'redAmbrosiaCubeImprover'>;
    infiniteShopUpgrades: RedAmbrosiaUpgradeCalculationConfig<'infiniteShopUpgrades'>;
    redAmbrosiaAccelerator: RedAmbrosiaUpgradeCalculationConfig<'redAmbrosiaAccelerator'>;
    salvageYinYang: RedAmbrosiaUpgradeCalculationConfig<'salvageYinYang'>;
    blueberries: RedAmbrosiaUpgradeCalculationConfig<'blueberries'>;
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
    | 'Global Speed'
    | 'Researches'
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
    fnName: keyof HSGameDataAPI;
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