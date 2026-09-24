/*
    NOTE: THIS WHOLE THING IS GENERATE BY GOOGLE GEMINI PRO 2.5 (... And by the free Raptor mini 'preview'... x)
    The main interface for the save data is: export interface PlayerData
*/

import type {
    AmbrosiaUpgradeNames,
    ProgressiveAchievements,
    RedAmbrosiaNames,
    RuneKeys,
    SingularityChallengeDataKeys,
    TalismanCraftItems,
    TalismanKeys
} from './hs-gamedata-api-types'

export type BuyAmount = 1 | 10 | 100 | 1000 | 10000 | 100000
export type OcteractUpgrades = string
export type RuneBlessingKeys = string
export type RuneSpiritKeys = string
export type ShopUpgradeNames = string
export type SingularityChallenge = SingularityChallengeStatus

export type SingularityDataKeys = keyof goldenQuarkUpgrades

export type WowCubes = number
export type WowTesseracts = number
export type WowHypercubes = number
export type WowPlatonicCubes = number

export type JsonDecimal = string | number
export type JsonDate = string | null


export type ArrayStartingWithNull<T> = [null, ...T[]]
export type AutoResetModes = 'amount' | 'time'
export type AutoAscensionModes = 'amount' | 'percentage'
export type AutoAscensionResetModes = 'c10Completions' | 'realAscensionTime'
export type Tabs =
  | 'Buildings'
  | 'Upgrades'
  | 'Achievements'
  | 'Runes'
  | 'Challenges'
  | 'Research'
  | 'AntHill'
  | 'WowCubes'
  | 'Campaign'
  | 'Corruption'
  | 'Singularity'
  | 'Settings'
  | 'Shop'
  | 'Event'
  | 'Purchase'


export interface CampaignManager {
  currentCampaign?: string
  campaigns?: Record<string, number>
}

export type HepteractKeys =
  | 'chronos'
  | 'hyperrealism'
  | 'quark'
  | 'challenge'
  | 'abyss'
  | 'accelerator'
  | 'acceleratorBoost'
  | 'multiplier'

export interface HepteractValues {
  BAL: number
  TIMES_CAP_EXTENDED: number
  AUTO: boolean
}

export interface PlayerAnts {
  producers: Record<string, {
    purchased: number
    generated: Decimal
  }>
  masteries: Record<string, {
    mastery: number
    highestMastery: number
  }>
  upgrades: Record<string, number>
  crumbs: Decimal
  crumbsThisSacrifice: Decimal
  crumbsEverMade: Decimal
  immortalELO: number
  rebornELO: number
  highestRebornELODaily: Array<{ elo: number; sacrificeId: number }>
  highestRebornELOEver: Array<{ elo: number; sacrificeId: number }>
  quarksGainedFromAnts: number
  antSacrificeCount: number
  currentSacrificeId: number
  toggles: {
    autobuyProducers: boolean
    autobuyMasteries: boolean
    autobuyUpgrades: boolean
    maxBuyProducers: boolean
    maxBuyUpgrades: boolean
    autoSacrificeEnabled: boolean
    autoSacrificeThreshold: number
    autoSacrificeMode: number | string
    alwaysSacrificeMaxRebornELO: boolean
    onlySacrificeMaxRebornELO: boolean
  }
}

/**
 * Represents the state of a single type of building or generator (Coins, Diamonds, Mythos, etc.).
 */
export interface GeneratorStats {
    owned: number;
    generated: string; // Often large numbers stored as strings
    cost: string;      // Often large numbers stored as strings
    produce: number;
}

/**
 * Represents the state of an ascension building.
 */
export interface AscendBuilding {
    cost: number;
    owned: number;
    generated: string; // Often large numbers stored as strings
    multiplier: number;
}

/**
 * Represents the key-value store for toggleable settings.
 * Keys are usually numbers represented as strings.
 */
export interface Toggles {
    [key: string]: boolean;
    // Example explicit keys (add all if known and fixed):
    // '1': boolean;
    // '2': boolean;
    // ...
}

/**
 * Represents the current challenge state.
 */
export interface CurrentChallenge {
    transcension: number;
    reincarnation: number;
    ascension: number;
}

/**
 * Represents the unlocked features.
 */
export interface Unlocks {
    coinone: boolean
    cointwo: boolean
    cointhree: boolean
    coinfour: boolean
    prestige: boolean
    generation: boolean
    transcend: boolean
    reincarnate: boolean
    rrow1: boolean
    rrow2: boolean
    rrow3: boolean
    rrow4: boolean
    anthill: boolean
    blessings: boolean
    spirits: boolean
    talismans: boolean
    ascensions: boolean
    tesseracts: boolean
    hypercubes: boolean
    platonics: boolean
    hepteracts: boolean
    // Add others if they exist
}
/**
 * Represents the raw rune experience values for each rune.
 *
 * In vanilla save/runtime handling, rune EXP is the source data used
 * to derive effective rune levels and heater export values.
 * Raw values are normalized to Decimal for internal runtime consistency.
 */
export interface Runes {
    speed: string; // scientific notation string
    duplication: string;
    prism: string;
    thrift: string;
    superiorIntellect: string;
    infiniteAscent: string;
    antiquities: string;
    horseShoe: string;
    topHat: string;
    finiteDescent: string;
}

interface Ants {
    producers: Record<string, {
        purchased: number;
        generated: string; // scientific notation string
    }>;
    masteries: Record<string, {
        mastery: number;
        highestMastery: number;
    }>;
    upgrades: Record<string, number>;
    crumbs: string;
    crumbsThisSacrifice: string;
    crumbsEverMade: string;
    immortalELO: number;
    rebornELO: number;
    highestRebornELODaily: Array<{
        elo: number;
        sacrificeId: number;
    }>;
    highestRebornELOEver: Array<{
        elo: number;
        sacrificeId: number;
    }>;
    quarksGainedFromAnts: number;
    antSacrificeCount: number;
    currentSacrificeId: number;
    toggles: {
        autobuyProducers: boolean;
        autobuyMasteries: boolean;
        autobuyUpgrades: boolean;
        maxBuyProducers: boolean;
        maxBuyUpgrades: boolean;
        autoSacrificeEnabled: boolean;
        autoSacrificeThreshold: number;
        autoSacrificeMode: number;
        alwaysSacrificeMaxRebornELO: boolean;
        onlySacrificeMaxRebornELO: boolean;
    };
}

/**
 * Represents the levels/quantities of various shop upgrades purchased.
 * Many keys correspond to internal upgrade IDs.
 */
export interface ShopUpgrades {
    offeringPotion: number;
    obtainiumPotion: number;
    offeringEX: number;
    offeringAuto: number;
    obtainiumEX: number;
    obtainiumAuto: number;
    instantChallenge: number;
    antSpeed: number;
    cashGrab: number;
    shopTalisman: number;
    seasonPass: number;
    challengeExtension: number;
    challengeTome: number;
    cubeToQuark: number;
    tesseractToQuark: number;
    hypercubeToQuark: number;
    seasonPass2: number;
    seasonPass3: number;
    chronometer: number;
    infiniteAscent: number;
    calculator: number;
    calculator2: number;
    calculator3: number;
    calculator4: number;
    calculator5: number;
    calculator6: number;
    calculator7: number;
    constantEX: number;
    powderEX: number;
    chronometer2: number;
    chronometer3: number;
    seasonPassY: number;
    seasonPassZ: number;
    challengeTome2: number;
    instantChallenge2: number;
    cashGrab2: number;
    chronometerZ: number;
    cubeToQuarkAll: number;
    offeringEX2: number;
    obtainiumEX2: number;
    seasonPassLost: number;
    powderAuto: number;
    challenge15Auto: number;
    extraWarp: number;
    autoWarp: number;
    improveQuarkHept: number;
    improveQuarkHept2: number;
    improveQuarkHept3: number;
    improveQuarkHept4: number;
    shopImprovedDaily: number;
    shopImprovedDaily2: number;
    shopImprovedDaily3: number;
    shopImprovedDaily4: number;
    offeringEX3: number;
    obtainiumEX3: number;
    improveQuarkHept5: number;
    seasonPassInfinity: number;
    chronometerInfinity: number;
    shopSingularityPenaltyDebuff: number;
    shopAmbrosiaLuckMultiplier4: number;
    shopOcteractAmbrosiaLuck: number;
    shopAmbrosiaGeneration1: number;
    shopAmbrosiaGeneration2: number;
    shopAmbrosiaGeneration3: number;
    shopAmbrosiaGeneration4: number;
    shopAmbrosiaLuck1: number;
    shopAmbrosiaLuck2: number;
    shopAmbrosiaLuck3: number;
    shopAmbrosiaLuck4: number;
    shopCashGrabUltra: number;
    shopAmbrosiaAccelerator: number;
    shopEXUltra: number;
    shopChronometerS: number;
    shopAmbrosiaUltra: number;
    shopPanthema: number;
    shopSingularitySpeedup: number;
    shopSingularityPotency: number;
    shopSadisticRune: number;
    shopRedLuck1: number;
    shopRedLuck2: number;
    shopRedLuck3: number;
    shopRedLuck4: number;
    shopInfiniteShopUpgrades: number;
    shopHorseShoe: number;
    shopPurpleBarRebate?: number;
}

/**
 * Represents consumed potions from the shop.
 */
export interface ShopPotionsConsumed {
    offering: number;
    obtainium: number;
}

/**
 * Represents toggle settings specifically for the shop UI/functionality.
 */
export interface ShopToggles {
    coin: boolean;
    prestige: boolean;
    transcend: boolean;
    generators: boolean;
    reincarnate: boolean;
    // Add others if they exist
}

/**
 * Represents the structure for talisman enhancement levels (or similar attributes).
 * The first element is often null, followed by numbers.
 */
export type TalismanEnhancementArray = (number | null)[];

/**
 * Represents the blessings associated with Cubes, Tesseracts, and Hypercubes.
 */
export interface CubeTesseractHypercubeBlessings {
    accelerator: number;
    multiplier: number;
    offering: number;
    runeExp: number;
    obtainium: number;
    antSpeed: number;
    antSacrifice: number;
    antELO: number;
    talismanBonus: number;
    globalSpeed: number;
}

/**
 * Represents the blessings associated with Platonic Cubes.
 */
export interface PlatonicBlessings {
    cubes: number;
    tesseracts: number;
    hypercubes: number;
    platonics: number;
    hypercubeBonus: number;
    taxes: number;
    scoreBonus: number;
    globalSpeed: number;
}

/**
 * Represents the state of a specific Hepteract craft type.
 */
export interface HepteractCraft {
    BAL: number;
    AUTO: boolean;
    TIMES_CAP_EXTENDED: number;
}

/**
 * Contains the state for all Hepteract crafts.
 */
export interface hepteracts {
    chronos: HepteractCraft;
    hyperrealism: HepteractCraft;
    quark: HepteractCraft;
    challenge: HepteractCraft;
    abyss: HepteractCraft;
    accelerator: HepteractCraft;
    acceleratorBoost: HepteractCraft;
    multiplier: HepteractCraft;
}

/**
 * Represents toggle settings for ascension statistics display.
 * Keys are usually numbers represented as strings.
 */
export interface AscStatToggles {
    [key: string]: boolean;
    // Example explicit keys:
    // '1': boolean;
    // '2': boolean;
    // ...
}

/**
 * Represents the completion status of various campaigns.
 */
export interface CampaignProgress {
    first: number;
    second: number;
    third: number;
    fourth: number;
    fifth: number;
    sixth: number;
    seventh: number;
    eighth: number;
    ninth: number;
    tenth: number;
    eleventh: number;
    twelfth: number;
    thirteenth: number;
    fourteenth: number;
    fifteenth: number;
    sixteenth: number;
    seventeenth: number;
    eighteenth: number;
    nineteenth: number;
    twentieth: number;
    twentyFirst: number;
    twentySecond: number;
    twentyThird: number;
    twentyFourth: number;
    twentyFifth: number;
    twentySixth: number;
    twentySeventh: number;
    twentyEighth: number;
    twentyNinth: number;
    thirtieth: number;
    thirtyFirst: number;
    thirtySecond: number;
    thirtyThird: number;
    thirtyFourth: number;
    thirtyFifth: number;
    thirtySixth: number;
    thirtySeventh: number;
    thirtyEighth: number;
    thirtyNinth: number;
    fortieth: number;
    fortyFirst: number;
    fortySecond: number;
    fortyThird: number;
    fortyFourth: number;
    fortyFifth: number;
    fortySixth: number;
    fortySeventh: number;
    fortyEighth: number;
    fortyNinth: number;
    fiftieth: number;
}

/**
 * Contains the campaign progress data.
 */
export interface Campaigns {
    campaigns: CampaignProgress;
}

/**
 * Represents the levels of different corruption types.
 */
export interface CorruptionLevels {
    viscosity: number;
    drought: number;
    deflation: number;
    extinction: number;
    illiteracy: number;
    recession: number;
    dilation: number;
    hyperchallenge: number;
}

/**
 * Represents saved loadouts for corruptions.
 * Keys are the names of the saved loadouts.
 */
export interface CorruptionSaves {
    [key: string]: CorruptionLevels;
    // Example explicit keys:
    // '3D': CorruptionLevels;
    // 'Pre w5x10': CorruptionLevels;
    // ...
}

/**
 * Contains the current, next, and saved corruption states.
 */
export interface Corruptions {
    used: CorruptionLevels;
    next: CorruptionLevels;
    saves: CorruptionSaves;
    showStats: boolean;
}

/**
 * Represents a single entry in the ant sacrifice history.
 */
export interface AntSacrificeHistoryEntry {
    date: number; // Timestamp
    seconds: number;
    kind: 'antsacrifice';
    offerings: number;
    obtainium: number;
    antSacrificePointsBefore: number;
    antSacrificePointsAfter: number;
    baseELO: number;
    effectiveELO: number;
    crumbs: string;      // Very large number stored as string
    crumbsPerSecond: string; // Very large number stored as string
}

export interface TalismanShards {
    shard: string; // Very large number stored as string
    commonFragment: string;
    uncommonFragment: string;
    rareFragment: string;
    epicFragment: string;
    legendaryFragment: string;
    mythicalFragment: string;
}

export interface Talismans {
    exemption: TalismanShards;
    chronos: TalismanShards;
    midas: TalismanShards;
    metaphysics: TalismanShards;
    polymath: TalismanShards;
    mortuus: TalismanShards;
    plastic: TalismanShards;
    wowSquare: TalismanShards;
    achievement: TalismanShards;
    purpleGem: TalismanShards;
    cookieGrandma: TalismanShards;
    horseShoe: TalismanShards;
}

/**
 * Represents a single entry in the singularity history.
 */
export interface SingularityHistoryEntry {
    seconds: number;
    date: number; // Timestamp
    singularityCount: number;
    quarks: number;
    c15Score: number;
    goldenQuarks: number;
    wowTribs: number;
    tessTribs: number;
    hyperTribs: number;
    platTribs: number;
    octeracts: number;
    quarkHept: number;
    kind: 'singularity';
}

// Define types for other history entries if their structure is known.
// Using 'any' as a placeholder if the structure is unknown or varies.
export type AscendHistoryEntry = any;
export type ResetHistoryEntry = any;

/**
 * Contains arrays of historical events.
 */
export interface History {
    ants: AntSacrificeHistoryEntry[];
    ascend: AscendHistoryEntry[];
    reset: ResetHistoryEntry[];
    singularity: SingularityHistoryEntry[];
}

/**
 * Represents the timer settings for auto challenge retries.
 */
export interface AutoChallengeTimer {
    start: number;
    exit: number;
    enter: number;
}

/**
 * Represents the common structure for singularity and octeract upgrade data.
 */
export interface UpgradeData {
    /** Present only in legacy saves. Current saves reconstruct this from the invested resource. */
    level?: number;
    toggleBuy: number; // Often 1, could potentially be boolean
    freeLevel: number;
}

/**
 * Represents data for a specific singularity upgrade.
 */
export interface SingularityUpgradeData extends UpgradeData {
    goldenQuarksInvested: number;
}

/**
 * Contains the state of all singularity upgrades. Keys are internal upgrade names.
 */
export interface goldenQuarkUpgrades {
    goldenQuarks1: SingularityUpgradeData;
    goldenQuarks2: SingularityUpgradeData;
    goldenQuarks3: SingularityUpgradeData;
    starterPack: SingularityUpgradeData;
    wowPass: SingularityUpgradeData;
    cookies: SingularityUpgradeData;
    cookies2: SingularityUpgradeData;
    cookies3: SingularityUpgradeData;
    cookies4: SingularityUpgradeData;
    cookies5: SingularityUpgradeData;
    ascensions: SingularityUpgradeData;
    corruptionFourteen: SingularityUpgradeData;
    corruptionFifteen: SingularityUpgradeData;
    singOfferings1: SingularityUpgradeData;
    singOfferings2: SingularityUpgradeData;
    singOfferings3: SingularityUpgradeData;
    singObtainium1: SingularityUpgradeData;
    singObtainium2: SingularityUpgradeData;
    singObtainium3: SingularityUpgradeData;
    singCubes1: SingularityUpgradeData;
    singCubes2: SingularityUpgradeData;
    singCubes3: SingularityUpgradeData;
    singCitadel: SingularityUpgradeData;
    singCitadel2: SingularityUpgradeData;
    octeractUnlock: SingularityUpgradeData;
    singOcteractPatreonBonus: SingularityUpgradeData;
    offeringAutomatic: SingularityUpgradeData;
    intermediatePack: SingularityUpgradeData;
    advancedPack: SingularityUpgradeData;
    expertPack: SingularityUpgradeData;
    masterPack: SingularityUpgradeData;
    divinePack: SingularityUpgradeData;
    wowPass2: SingularityUpgradeData;
    wowPass3: SingularityUpgradeData;
    potionBuff: SingularityUpgradeData;
    potionBuff2: SingularityUpgradeData;
    potionBuff3: SingularityUpgradeData;
    singChallengeExtension: SingularityUpgradeData;
    singChallengeExtension2: SingularityUpgradeData;
    singChallengeExtension3: SingularityUpgradeData;
    singQuarkImprover1: SingularityUpgradeData;
    singQuarkHepteract: SingularityUpgradeData;
    singQuarkHepteract2: SingularityUpgradeData;
    singQuarkHepteract3: SingularityUpgradeData;
    singOcteractGain: SingularityUpgradeData;
    singOcteractGain2: SingularityUpgradeData;
    singOcteractGain3: SingularityUpgradeData;
    singOcteractGain4: SingularityUpgradeData;
    singOcteractGain5: SingularityUpgradeData;
    platonicTau: SingularityUpgradeData;
    platonicAlpha: SingularityUpgradeData;
    platonicDelta: SingularityUpgradeData;
    platonicPhi: SingularityUpgradeData;
    singFastForward: SingularityUpgradeData;
    singFastForward2: SingularityUpgradeData;
    singAscensionSpeed: SingularityUpgradeData;
    singAscensionSpeed2: SingularityUpgradeData;
    ultimatePen: SingularityUpgradeData;
    halfMind: SingularityUpgradeData;
    oneMind: SingularityUpgradeData;
    wowPass4: SingularityUpgradeData;
    wowPass5: SingularityUpgradeData;
    blueberries: SingularityUpgradeData;
    singAmbrosiaLuck: SingularityUpgradeData;
    singAmbrosiaLuck2: SingularityUpgradeData;
    singAmbrosiaLuck3: SingularityUpgradeData;
    singAmbrosiaLuck4: SingularityUpgradeData;
    singAmbrosiaGeneration: SingularityUpgradeData;
    singAmbrosiaGeneration2: SingularityUpgradeData;
    singAmbrosiaGeneration3: SingularityUpgradeData;
    singAmbrosiaGeneration4: SingularityUpgradeData;
    singBonusTokens1: SingularityUpgradeData;
    singBonusTokens2: SingularityUpgradeData;
    singBonusTokens3: SingularityUpgradeData;
    singBonusTokens4: SingularityUpgradeData;
    singInfiniteShopUpgrades: SingularityUpgradeData;
    singTalismanBonusRunes1: SingularityUpgradeData;
    singTalismanBonusRunes2: SingularityUpgradeData;
    singTalismanBonusRunes3: SingularityUpgradeData;
    singTalismanBonusRunes4: SingularityUpgradeData;
    favoriteUpgrade: SingularityUpgradeData;
}

/**
 * Represents data for a specific octeract upgrade.
 */
export interface OcteractUpgradeData extends UpgradeData {
    octeractsInvested: number;
}

/**
 * Contains the state of all octeract upgrades. Keys are internal upgrade names.
 */
export interface octUpgrades {
    octeractStarter: OcteractUpgradeData;
    octeractGain: OcteractUpgradeData;
    octeractGain2: OcteractUpgradeData;
    octeractQuarkGain: OcteractUpgradeData;
    octeractQuarkGain2: OcteractUpgradeData;
    octeractCorruption: OcteractUpgradeData;
    octeractGQCostReduce: OcteractUpgradeData;
    octeractExportQuarks: OcteractUpgradeData;
    octeractImprovedDaily: OcteractUpgradeData;
    octeractImprovedDaily2: OcteractUpgradeData;
    octeractImprovedDaily3: OcteractUpgradeData;
    octeractImprovedQuarkHept: OcteractUpgradeData;
    octeractImprovedGlobalSpeed: OcteractUpgradeData;
    octeractImprovedAscensionSpeed: OcteractUpgradeData;
    octeractImprovedAscensionSpeed2: OcteractUpgradeData;
    octeractImprovedFree: OcteractUpgradeData;
    octeractImprovedFree2: OcteractUpgradeData;
    octeractImprovedFree3: OcteractUpgradeData;
    octeractImprovedFree4: OcteractUpgradeData;
    octeractSingUpgradeCap: OcteractUpgradeData;
    octeractOfferings1: OcteractUpgradeData;
    octeractObtainium1: OcteractUpgradeData;
    octeractAscensions: OcteractUpgradeData;
    octeractAscensions2: OcteractUpgradeData;
    octeractAscensionsOcteractGain: OcteractUpgradeData;
    octeractFastForward: OcteractUpgradeData;
    octeractAutoPotionSpeed: OcteractUpgradeData;
    octeractAutoPotionEfficiency: OcteractUpgradeData;
    octeractOneMindImprover: OcteractUpgradeData;
    octeractAmbrosiaLuck: OcteractUpgradeData;
    octeractAmbrosiaLuck2: OcteractUpgradeData;
    octeractAmbrosiaLuck3: OcteractUpgradeData;
    octeractAmbrosiaLuck4: OcteractUpgradeData;
    octeractAmbrosiaGeneration: OcteractUpgradeData;
    octeractAmbrosiaGeneration2: OcteractUpgradeData;
    octeractAmbrosiaGeneration3: OcteractUpgradeData;
    octeractAmbrosiaGeneration4: OcteractUpgradeData;
    octeractBonusTokens1: OcteractUpgradeData;
    octeractBonusTokens2: OcteractUpgradeData;
    octeractBonusTokens3: OcteractUpgradeData;
    octeractBonusTokens4: OcteractUpgradeData;
    octeractBlueberries: OcteractUpgradeData;
    octeractInfiniteShopUpgrades: OcteractUpgradeData;
    octeractTalismanLevelCap1: OcteractUpgradeData;
    octeractTalismanLevelCap2: OcteractUpgradeData;
    octeractTalismanLevelCap3: OcteractUpgradeData;
    octeractTalismanLevelCap4: OcteractUpgradeData;
}

/**
 * Represents the completion status of a specific singularity challenge.
 */
export interface SingularityChallengeStatus {
    completions: number;
    highestSingularityCompleted: number;
    enabled: boolean;
    rewards?: SingularityChallengeRewards;
}

export interface SingularityChallengeRewards {
    noSingularityUpgrades: {
        cubes: number;
        goldenQuarks: number;
        blueberries: number;
        shopUpgrade: boolean;
        additiveLuckMult: number;
        shopUpgrade2: boolean;
    };
    oneChallengeCap: {
        corrScoreIncrease: number;
        blueberrySpeedMult: number;
        capIncrease: number;
        freeCorruptionLevel: number;
        shopUpgrade: boolean;
        reinCapIncrease2: number;
        ascCapIncrease2: number;
    };
    noOcteracts: {
        octeractPow: number;
        offeringBonus: boolean;
        obtainiumBonus: boolean;
        shopUpgrade: boolean;
    };
    limitedAscensions: {
        ascensionSpeedMult: number;
        hepteractCap: boolean;
        shopUpgrade: boolean;
        shopUpgrade2: boolean;
    };
    noAmbrosiaUpgrades: {
        bonusAmbrosia: number;
        blueberries: number;
        additiveLuckMult: number;
        ambrosiaLuck: number;
        redLuck: number;
        blueberrySpeedMult: number;
        redSpeedMult: number;
        shopUpgrade: boolean;
        shopUpgrade2: boolean;
    };
    noQuarkUpgrades: {
        freeObtainiumLevels: number;
        freeOfferingLevels: number;
        freeSpeedLevels: number;
        freeCubeLevels: number;
        freeQuarkLevel: number;
        freeInfinityLevels: number;
        shopUpgrade: boolean;
        topHatUnlock: boolean;
    };
    limitedTime: {
        preserveQuarks: boolean;
        quarkMult: number;
        globalSpeed: number;
        ascensionSpeed: number;
        barRequirementMultiplier: number;
        shopUpgrade: boolean;
        shopUpgrade2: boolean;
    };
    sadisticPrequel: {
        extraFree: number;
        quarkMult: number;
        freeUpgradeMult: number;
        shopUpgrade: boolean;
        shopUpgrade2: boolean;
        shopUpgrade3: boolean;
    };
    taxmanLastStand: {
        horseShoeUnlock: boolean;
        shopUpgrade: boolean;
        talismanUnlock: boolean;
        talismanFreeLevel: number;
        talismanRuneEffect: number;
        antiquityOOM: number;
        horseShoeOOM: number;
    };
    barDependence: {
        purpleAmbrosiaCostReduction: number;
        purpleHoneyLuck: number;
        blueberries: number;
        shopUpgrade: boolean;
    };
}

/**
 * Contains the status of all singularity challenges. Keys are internal challenge names.
 */
export interface SingularityChallenges {
    noSingularityUpgrades: SingularityChallengeStatus;
    oneChallengeCap: SingularityChallengeStatus;
    limitedAscensions: SingularityChallengeStatus;
    noQuarkUpgrades: SingularityChallengeStatus;
    noOcteracts: SingularityChallengeStatus;
    noAmbrosiaUpgrades: SingularityChallengeStatus;
    limitedTime: SingularityChallengeStatus;
    sadisticPrequel: SingularityChallengeStatus;
    taxmanLastStand: SingularityChallengeStatus;
    barDependence: SingularityChallengeStatus;
}

/**
 * Represents data for a specific Ambrosia/Blueberry upgrade.
 */
export interface AmbrosiaUpgradeData extends UpgradeData {
    ambrosiaInvested: number;
    blueberriesInvested: number;
    purpleAmbrosiaInvested?: number;
}

/**
 * Contains the state of all Ambrosia/Blueberry upgrades. Keys are internal upgrade names.
 */
export interface AmbrosiaUpgrades {
    ambrosiaTutorial: AmbrosiaUpgradeData;
    ambrosiaQuarks1: AmbrosiaUpgradeData;
    ambrosiaCubes1: AmbrosiaUpgradeData;
    ambrosiaLuck1: AmbrosiaUpgradeData;
    ambrosiaCubeQuark1: AmbrosiaUpgradeData;
    ambrosiaLuckQuark1: AmbrosiaUpgradeData;
    ambrosiaLuckCube1: AmbrosiaUpgradeData;
    ambrosiaQuarkCube1: AmbrosiaUpgradeData;
    ambrosiaCubeLuck1: AmbrosiaUpgradeData;
    ambrosiaQuarkLuck1: AmbrosiaUpgradeData;
    ambrosiaQuarks2: AmbrosiaUpgradeData;
    ambrosiaCubes2: AmbrosiaUpgradeData;
    ambrosiaLuck2: AmbrosiaUpgradeData;
    ambrosiaQuarks3: AmbrosiaUpgradeData;
    ambrosiaQuarks4: AmbrosiaUpgradeData;
    ambrosiaCubes3: AmbrosiaUpgradeData;
    ambrosiaCubes4: AmbrosiaUpgradeData;
    ambrosiaFreeCubeUpgrades: AmbrosiaUpgradeData;
    ambrosiaLuck3: AmbrosiaUpgradeData;
    ambrosiaLuck4: AmbrosiaUpgradeData;
    ambrosiaPatreon: AmbrosiaUpgradeData;
    ambrosiaObtainium1: AmbrosiaUpgradeData;
    ambrosiaOffering1: AmbrosiaUpgradeData;
    ambrosiaHyperflux: AmbrosiaUpgradeData;
    ambrosiaBaseObtainium1: AmbrosiaUpgradeData;
    ambrosiaBaseOffering1: AmbrosiaUpgradeData;
    ambrosiaBaseObtainium2: AmbrosiaUpgradeData;
    ambrosiaBaseOffering2: AmbrosiaUpgradeData;
    ambrosiaSingReduction1: AmbrosiaUpgradeData;
    ambrosiaInfiniteShopUpgrades1: AmbrosiaUpgradeData;
    ambrosiaInfiniteShopUpgrades2: AmbrosiaUpgradeData;
    ambrosiaInfiniteShopUpgrades3: AmbrosiaUpgradeData;
    ambrosiaSingReduction2: AmbrosiaUpgradeData;
    ambrosiaTalismanBonusRuneLevel: AmbrosiaUpgradeData;
    ambrosiaRuneOOMBonus: AmbrosiaUpgradeData;
    ambrosiaBrickOfLead: AmbrosiaUpgradeData;
    ambrosiaFreeQuarkUpgrades: AmbrosiaUpgradeData;
    ambrosiaFreeLuckUpgrades: AmbrosiaUpgradeData;
    ambrosiaFreeGenerationUpgrades: AmbrosiaUpgradeData;
    ambrosiaFreeRedLuckUpgrades: AmbrosiaUpgradeData;
    ambrosiaFreeObtainiumUpgrades: AmbrosiaUpgradeData;
    ambrosiaFreeOfferingUpgrades: AmbrosiaUpgradeData;
    twoMind: AmbrosiaUpgradeData;
}
/**
 * Represents a single saved blueberry loadout.
 * Keys are internal upgrade names, values are the levels in that loadout.
 */
export interface BlueberryLoadout {
    [upgradeName: string]: number;
    // Example explicit keys for Loadout 1:
    // ambrosiaTutorial: number;
    // ambrosiaQuarks1: number;
    // ... (many more)
}

/**
 * Contains all saved blueberry loadouts.
 * Keys are the loadout number ('1' through '16').
 */
export interface BlueberryLoadouts {
    [loadoutNumber: string]: BlueberryLoadout | {}; // Can be an empty object if not set
    // Example explicit keys:
    // '1': BlueberryLoadout;
    // '2': BlueberryLoadout;
    // ...
    // '9': {}; // Example of an empty loadout
}

/**
 * Contains the state of all Red Ambrosia upgrades. Keys are internal upgrade names.
 */
export interface RedAmbrosiaUpgrades {
    tutorial: number;
    conversionImprovement1: number;
    conversionImprovement2: number;
    conversionImprovement3: number;
    freeTutorialLevels: number;
    freeLevelsRow2: number;
    freeLevelsRow3: number;
    freeLevelsRow4: number;
    freeLevelsRow5: number;
    blueberryGenerationSpeed: number;
    regularLuck: number;
    redGenerationSpeed: number;
    redGenerationSpeed2: number;
    redLuck: number;
    redAmbrosiaCube: number;
    redAmbrosiaObtainium: number;
    redAmbrosiaOffering: number;
    redAmbrosiaCubeImprover: number;
    redAmbrosiaFreeAccumulator: number;
    viscount: number;
    infiniteShopUpgrades: number;
    redAmbrosiaAccelerator: number;
    regularLuck2: number;
    blueberryGenerationSpeed2: number;
    salvageYinYang: number;
    blueberries: number;
    freeOfferingUpgrades: number;
    freeObtainiumUpgrades: number;
    freeCubeUpgrades: number;
    freeSpeedUpgrades: number;
}

export interface Campaigns {
    first: number;
    second: number;
    third: number;
    fourth: number;
    fifth: number;
    sixth: number;
    seventh: number;
    eighth: number;
    ninth: number;
    tenth: number;
    eleventh: number;
    twelfth: number;
    thirteenth: number;
    fourteenth: number;
    fifteenth: number;
    sixteenth: number;
    seventeenth: number;
    eighteenth: number;
    nineteenth: number;
    twentieth: number;
    twentyFirst: number;
    twentySecond: number;
    twentyThird: number;
    twentyFourth: number;
    twentyFifth: number;
    twentySixth: number;
    twentySeventh: number;
    twentyEighth: number;
    twentyNinth: number;
    thirtieth: number;
    thirtyFirst: number;
    thirtySecond: number;
    thirtyThird: number;
    thirtyFourth: number;
    thirtyFifth: number;
    thirtySixth: number;
    thirtySeventh: number;
    thirtyEighth: number;
    thirtyNinth: number;
    fortieth: number;
    fortyFirst: number;
    fortySecond: number;
    fortyThird: number;
    fortyFourth: number;
    fortyFifth: number;
    fortySixth: number;
    fortySeventh: number;
    fortyEighth: number;
    fortyNinth: number;
    fiftieth: number;
}

export interface progressiveAchievements {
    "runeLevel": number;
    "freeRuneLevel": number;
    "quarkUpgrades": number;
    "antMasteries": number;
    "rebornELO": number;
    "singularityCount": number;
    "ambrosiaCount": number;
    "redAmbrosiaCount": number;
    "exalts": number;
    "talismanRarities": number;
    "singularityUpgrades": number;
    "octeractUpgrades": number;
    "redAmbrosiaUpgrades": number;
    "purpleHoneyUpgrades": number;
    "purpleAmbrosiaUpgrades": number;
}

/**
 * The 'true' Player interface (with the same types as vanilla)
 */
export interface PlayerData {
  firstPlayed: string
  worlds: number
  coins: Decimal
  coinsThisPrestige: Decimal
  coinsThisTranscension: Decimal
  coinsThisReincarnation: Decimal
  coinsTotal: Decimal

  firstOwnedCoin: number
  firstGeneratedCoin: Decimal
  firstCostCoin: Decimal
  firstProduceCoin: number

  secondOwnedCoin: number
  secondGeneratedCoin: Decimal
  secondCostCoin: Decimal
  secondProduceCoin: number

  thirdOwnedCoin: number
  thirdGeneratedCoin: Decimal
  thirdCostCoin: Decimal
  thirdProduceCoin: number

  fourthOwnedCoin: number
  fourthGeneratedCoin: Decimal
  fourthCostCoin: Decimal
  fourthProduceCoin: number

  fifthOwnedCoin: number
  fifthGeneratedCoin: Decimal
  fifthCostCoin: Decimal
  fifthProduceCoin: number

  firstOwnedDiamonds: number
  firstGeneratedDiamonds: Decimal
  firstCostDiamonds: Decimal
  firstProduceDiamonds: number

  secondOwnedDiamonds: number
  secondGeneratedDiamonds: Decimal
  secondCostDiamonds: Decimal
  secondProduceDiamonds: number

  thirdOwnedDiamonds: number
  thirdGeneratedDiamonds: Decimal
  thirdCostDiamonds: Decimal
  thirdProduceDiamonds: number

  fourthOwnedDiamonds: number
  fourthGeneratedDiamonds: Decimal
  fourthCostDiamonds: Decimal
  fourthProduceDiamonds: number

  fifthOwnedDiamonds: number
  fifthGeneratedDiamonds: Decimal
  fifthCostDiamonds: Decimal
  fifthProduceDiamonds: number

  firstOwnedMythos: number
  firstGeneratedMythos: Decimal
  firstCostMythos: Decimal
  firstProduceMythos: number

  secondOwnedMythos: number
  secondGeneratedMythos: Decimal
  secondCostMythos: Decimal
  secondProduceMythos: number

  thirdOwnedMythos: number
  thirdGeneratedMythos: Decimal
  thirdCostMythos: Decimal
  thirdProduceMythos: number

  fourthOwnedMythos: number
  fourthGeneratedMythos: Decimal
  fourthCostMythos: Decimal
  fourthProduceMythos: number

  fifthOwnedMythos: number
  fifthGeneratedMythos: Decimal
  fifthCostMythos: Decimal
  fifthProduceMythos: number

  firstOwnedParticles: number
  firstGeneratedParticles: Decimal
  firstCostParticles: Decimal
  firstProduceParticles: number

  secondOwnedParticles: number
  secondGeneratedParticles: Decimal
  secondCostParticles: Decimal
  secondProduceParticles: number

  thirdOwnedParticles: number
  thirdGeneratedParticles: Decimal
  thirdCostParticles: Decimal
  thirdProduceParticles: number

  fourthOwnedParticles: number
  fourthGeneratedParticles: Decimal
  fourthCostParticles: Decimal
  fourthProduceParticles: number

  fifthOwnedParticles: number
  fifthGeneratedParticles: Decimal
  fifthCostParticles: Decimal
  fifthProduceParticles: number

  ants: PlayerAnts

  ascendBuilding1: {
    cost: number
    owned: number
    generated: Decimal
    multiplier: number
  }
  ascendBuilding2: {
    cost: number
    owned: number
    generated: Decimal
    multiplier: number
  }
  ascendBuilding3: {
    cost: number
    owned: number
    generated: Decimal
    multiplier: number
  }
  ascendBuilding4: {
    cost: number
    owned: number
    generated: Decimal
    multiplier: number
  }
  ascendBuilding5: {
    cost: number
    owned: number
    generated: Decimal
    multiplier: number
  }

  multiplierCost: Decimal
  multiplierBought: number

  acceleratorCost: Decimal
  acceleratorBought: number

  acceleratorBoostBought: number
  acceleratorBoostCost: Decimal

  upgrades: number[]

  prestigeCount: number
  transcendCount: number
  reincarnationCount: number

  prestigePoints: Decimal
  transcendPoints: Decimal
  reincarnationPoints: Decimal

  prestigeShards: Decimal
  transcendShards: Decimal
  reincarnationShards: Decimal

  toggles: Record<number, boolean>

  challengecompletions: number[]
  highestchallengecompletions: number[]
  challenge15Exponent: number
  highestChallenge15Exponent: number

  retrychallenges: boolean
  currentChallenge: {
    transcension: number
    reincarnation: number
    ascension: number
  }

  obtainium: Decimal
  maxObtainium: Decimal
  obtainiumtimer: number

  // Ignore the first index. The other 25 are shaped in a 5x5 grid similar to the production appearance
  researches: number[]

  unlocks: {
    coinone: boolean
    cointwo: boolean
    cointhree: boolean
    coinfour: boolean
    prestige: boolean
    generation: boolean
    transcend: boolean
    reincarnate: boolean
    rrow1: boolean
    rrow2: boolean
    rrow3: boolean
    rrow4: boolean
    anthill: boolean
    blessings: boolean
    spirits: boolean
    talismans: boolean
    ascensions: boolean
    tesseracts: boolean
    hypercubes: boolean
    platonics: boolean
    hepteracts: boolean
  }
  achievements: number[]
  progressiveAchievements: Record<ProgressiveAchievements, number>

  achievementPoints: number

  prestigenomultiplier: boolean
  prestigenoaccelerator: boolean
  transcendnomultiplier: boolean
  transcendnoaccelerator: boolean
  reincarnatenomultiplier: boolean
  reincarnatenoaccelerator: boolean
  prestigenocoinupgrades: boolean
  transcendnocoinupgrades: boolean
  transcendnocoinorprestigeupgrades: boolean
  reincarnatenocoinupgrades: boolean
  reincarnatenocoinorprestigeupgrades: boolean
  reincarnatenocoinprestigeortranscendupgrades: boolean
  reincarnatenocoinprestigetranscendorgeneratorupgrades: boolean

  crystalUpgrades: number[]
  crystalUpgradesCost: number[]

  runes: Record<RuneKeys, Decimal>
  runeBlessings: Record<RuneBlessingKeys, Decimal>
  runeSpirits: Record<RuneSpiritKeys, Decimal>

  offerings: Decimal
  maxOfferings: Decimal

  prestigecounter: number
  transcendcounter: number
  reincarnationcounter: number
  offlinetick: number

  prestigeamount: number
  transcendamount: number
  reincarnationamount: number

  fastestprestige: number
  fastesttranscend: number
  fastestreincarnate: number

  resetToggleModes: {
    prestige: AutoResetModes
    transcend: AutoResetModes
    reincarnation: AutoResetModes
    ascension: AutoAscensionModes
  }

  tesseractAutoBuyerToggle: boolean
  tesseractAutoBuyerAmount: number

  coinbuyamount: BuyAmount
  crystalbuyamount: BuyAmount
  mythosbuyamount: BuyAmount
  particlebuyamount: BuyAmount
  offeringbuyamount: BuyAmount
  tesseractbuyamount: BuyAmount

  shoptoggles: {
    coin: boolean
    prestige: boolean
    transcend: boolean
    generators: boolean
    reincarnate: boolean
  }

  // create a Map with keys defaulting to boolean
  codes: Map<number, boolean>

  shopUpgrades: Record<ShopUpgradeNames, number>

  shopPotionsConsumed: {
    offering: number
    obtainium: number
  }

  shopConfirmationToggle: boolean
  shopBuyMaxToggle: boolean | 'TEN' | 'ANY'
  shopHideToggle: boolean
  autoPotionTimer: number
  autoPotionTimerObtainium: number

  autoSacrificeToggle: boolean
  autoBuyFragment: boolean
  autoFortifyToggle: boolean
  autoEnhanceToggle: boolean
  autoResearchToggle: boolean
  researchBuyMaxToggle: boolean
  autoResearchMode: 'cheapest' | 'manual'
  autoResearch: number
  autoSacrifice: number
  sacrificeTimer: number
  quarkstimer: number
  goldenQuarksTimer: number

  antSacrificeTimer: number
  antSacrificeTimerReal: number

  talismans: Record<TalismanKeys, Record<TalismanCraftItems, Decimal>>

  talismanShards: Decimal
  commonFragments: Decimal
  uncommonFragments: Decimal
  rareFragments: Decimal
  epicFragments: Decimal
  legendaryFragments: Decimal
  mythicalFragments: Decimal

  buyTalismanShardPercent: number

  ascensionCount: number
  ascensionCounter: number
  ascensionCounterReal: number
  ascensionCounterRealReal: number
  autoOpenCubes: boolean
  openCubes: number
  autoOpenTesseracts: boolean
  openTesseracts: number
  autoOpenHypercubes: boolean
  openHypercubes: number
  autoOpenPlatonicsCubes: boolean
  openPlatonicsCubes: number
  cubeUpgrades: ArrayStartingWithNull<number>
  cubeUpgradesBuyMaxToggle: boolean
  autoCubeUpgradesToggle: boolean
  autoPlatonicUpgradesToggle: boolean
  platonicUpgrades: number[]
  maxPlatToggle: boolean
  wowCubes: WowCubes
  wowTesseracts: WowTesseracts
  wowHypercubes: WowHypercubes
  wowPlatonicCubes: WowPlatonicCubes
  wowAbyssals: number
  wowOcteracts: number
  totalWowOcteracts: number
  cubeBlessings: {
    accelerator: number
    multiplier: number
    offering: number
    runeExp: number
    obtainium: number
    antSpeed: number
    antSacrifice: number
    antELO: number
    talismanBonus: number
    globalSpeed: number
  }
  tesseractBlessings: {
    accelerator: number
    multiplier: number
    offering: number
    runeExp: number
    obtainium: number
    antSpeed: number
    antSacrifice: number
    antELO: number
    talismanBonus: number
    globalSpeed: number
  }
  hypercubeBlessings: {
    accelerator: number
    multiplier: number
    offering: number
    runeExp: number
    obtainium: number
    antSpeed: number
    antSacrifice: number
    antELO: number
    talismanBonus: number
    globalSpeed: number
  }
  platonicBlessings: {
    cubes: number
    tesseracts: number
    hypercubes: number
    platonics: number
    hypercubeBonus: number
    taxes: number
    scoreBonus: number
    globalSpeed: number
  }
  ascendShards: Decimal
  autoAscend: boolean
  autoAscendMode: AutoAscensionResetModes
  autoAscendThreshold: number
  roombaResearchIndex: number
  ascStatToggles: Record<number, boolean>

  campaigns: CampaignManager

  corruptions: {
    next: CorruptionLevels
    used: CorruptionLevels
    saves: CorruptionSaves
    showStats: boolean
  }

  constantUpgrades: ArrayStartingWithNull<number>
  history: Record<string, unknown[]>
  historyShowPerSecond: boolean

  autoChallengeRunning: boolean
  autoChallengeIndex: number
  autoChallengeToggles: boolean[]
  autoChallengeStartExponent: number
  autoChallengeTimer: {
    start: number
    exit: number
    enter: number
  }

  runeBlessingBuyAmount: number
  runeSpiritBuyAmount: number

  autoTesseracts: boolean[]

  saveString: string
  exporttest: string | boolean

  dayCheck: Date | null
  dayTimer: number
  cubeOpenedDaily: number
  cubeQuarkDaily: number
  tesseractOpenedDaily: number
  tesseractQuarkDaily: number
  hypercubeOpenedDaily: number
  hypercubeQuarkDaily: number
  platonicCubeOpenedDaily: number
  platonicCubeQuarkDaily: number

  version: string

  rngCode: number
  skillCode?: number
  promoCodeTiming: {
    time: number
  }

  hepteracts: Record<HepteractKeys, HepteractValues>

  /*hepteractCrafts: {
    chronos: HepteractCraft
    hyperrealism: HepteractCraft
    quark: HepteractCraft
    challenge: HepteractCraft
    abyss: HepteractCraft
    accelerator: HepteractCraft
    acceleratorBoost: HepteractCraft
    multiplier: HepteractCraft
  }*/
  overfluxOrbs: number
  overfluxOrbsAutoBuy: boolean
  overfluxPowder: number
  dailyPowderResetUses: number
  autoWarpCheck: boolean

  singularityCount: number
  highestSingularityCount: number
  singularityCounter: number
  singularityElevatorTarget: number
  singularityElevatorSlowClimb: boolean
  singularityElevatorLocked: boolean
  singularityMatter: number
  goldenQuarks: number
  quarksThisSingularity: number
  totalQuarksEver: number
  hotkeys: Record<number, string[]>
  theme: string
  iconSet: number
  notation: 'Pure Scientific' | 'Pure Engineering' | 'Default'

  goldenQuarkUpgrades: Record<SingularityDataKeys, {
    level?: number
    freeLevel: number
    goldenQuarksInvested: number
  }>

  octUpgrades: Record<OcteractUpgrades, {
    level?: number
    freeLevel: number
    octeractsInvested: number
  }>

  ambrosiaUpgrades: Record<AmbrosiaUpgradeNames, {
    ambrosiaInvested: number
    blueberriesInvested: number
  }>

  dailyCodeUsed: boolean
  hepteractAutoCraftPercentage: number
  octeractTimer: number

  insideSingularityChallenge: boolean
  singularityChallenges: Record<
    SingularityChallengeDataKeys,
    SingularityChallenge
  >

  ambrosia: number
  lifetimeAmbrosia: number

  blueberryTime: number
  ambrosiaRNG: number // DEPRECIATED, DO NOT USE
  spentBlueberries: number

  blueberryLoadouts: BlueberryLoadouts
  blueberryLoadoutMode: 'saveTree' | 'loadTree'

  redAmbrosia: number
  lifetimeRedAmbrosia: number
  redAmbrosiaTime: number
  redAmbrosiaUpgrades: Record<RedAmbrosiaNames, number>

  singChallengeTimer: number

  lastExportedSave: number

  seed: number[]

  stats: {
    totalAddCodesUsed: number
  }
}

/**
 * The Player save data structure, using JSON-friendly primitives for raw save input.
 */
export interface GameData {
    firstPlayed: string; // ISO Date string

    worlds: number;
    coins: Decimal;
    coinsThisPrestige: string;
    coinsThisTranscension: string;
    coinsThisReincarnation: string;
    coinsTotal: string;

    firstOwnedCoin: number;
    firstGeneratedCoin: string;
    firstCostCoin: string;
    firstProduceCoin: number;
    secondOwnedCoin: number;
    secondGeneratedCoin: string;
    secondCostCoin: string;
    secondProduceCoin: number;
    thirdOwnedCoin: number;
    thirdGeneratedCoin: string;
    thirdCostCoin: string;
    thirdProduceCoin: number;
    fourthOwnedCoin: number;
    fourthGeneratedCoin: string;
    fourthCostCoin: string;
    fourthProduceCoin: number;
    fifthOwnedCoin: number;
    fifthGeneratedCoin: string;
    fifthCostCoin: string;
    fifthProduceCoin: number;

    firstOwnedDiamonds: number;
    firstGeneratedDiamonds: string;
    firstCostDiamonds: string;
    firstProduceDiamonds: number;
    secondOwnedDiamonds: number;
    secondGeneratedDiamonds: string;
    secondCostDiamonds: string;
    secondProduceDiamonds: number;
    thirdOwnedDiamonds: number;
    thirdGeneratedDiamonds: string;
    thirdCostDiamonds: string;
    thirdProduceDiamonds: number;
    fourthOwnedDiamonds: number;
    fourthGeneratedDiamonds: string;
    fourthCostDiamonds: string;
    fourthProduceDiamonds: number;
    fifthOwnedDiamonds: number;
    fifthGeneratedDiamonds: string;
    fifthCostDiamonds: string;
    fifthProduceDiamonds: number;

    firstOwnedMythos: number;
    firstGeneratedMythos: string;
    firstCostMythos: string;
    firstProduceMythos: number;
    secondOwnedMythos: number;
    secondGeneratedMythos: string;
    secondCostMythos: string;
    secondProduceMythos: number;
    thirdOwnedMythos: number;
    thirdGeneratedMythos: string;
    thirdCostMythos: string;
    thirdProduceMythos: number;
    fourthOwnedMythos: number;
    fourthGeneratedMythos: string;
    fourthCostMythos: string;
    fourthProduceMythos: number;
    fifthOwnedMythos: number;
    fifthGeneratedMythos: string;
    fifthCostMythos: string;
    fifthProduceMythos: number;

    firstOwnedParticles: number;
    firstGeneratedParticles: string;
    firstCostParticles: string;
    firstProduceParticles: number;
    secondOwnedParticles: number;
    secondGeneratedParticles: string;
    secondCostParticles: string;
    secondProduceParticles: number;
    thirdOwnedParticles: number;
    thirdGeneratedParticles: string;
    thirdCostParticles: string;
    thirdProduceParticles: number;
    fourthOwnedParticles: number;
    fourthGeneratedParticles: string;
    fourthCostParticles: string;
    fourthProduceParticles: number;
    fifthOwnedParticles: number;
    fifthGeneratedParticles: string;
    fifthCostParticles: string;
    fifthProduceParticles: number;

    ants: Ants;

    // Buildings & Accelerators
    ascendBuilding1: AscendBuilding;
    ascendBuilding2: AscendBuilding;
    ascendBuilding3: AscendBuilding;
    ascendBuilding4: AscendBuilding;
    ascendBuilding5: AscendBuilding;

    multiplierCost: string;
    multiplierBought: number;
    acceleratorCost: string;
    acceleratorBought: number;
    acceleratorBoostBought: number;
    acceleratorBoostCost: string;

    // Upgrades & Research
    upgrades: number[]; // Array of upgrade levels/statuses (0 or 1)

    prestigeCount: number;
    transcendCount: number;
    reincarnationCount: number;

    prestigePoints: string; // Can be large/decimal stored as string
    transcendPoints: string;
    reincarnationPoints: string;
    prestigeShards: string;
    transcendShards: string;
    reincarnationShards: string;

    // Automation & Toggles
    toggles: Toggles;

    // Challenges & Corruptions
    challengecompletions: number[]; // Completions per challenge
    highestchallengecompletions: number[]; // Highest completions per challenge
    challenge15Exponent: number;
    highestChallenge15Exponent: number;
    retrychallenges: boolean;
    currentChallenge: CurrentChallenge;
    obtainium: string;
    maxObtainium: string;

    obtainiumtimer: number;
    researches: number[]; // Array of research levels
    unlocks: Unlocks;
    achievements: number[]; // Status per achievement (0 or 1)
    progressiveAchievements: progressiveAchievements;
    achievementPoints: number;

    // Reset Related Flags & Stats
    prestigenomultiplier: boolean;
    prestigenoaccelerator: boolean;
    transcendnomultiplier: boolean;
    transcendnoaccelerator: boolean;
    reincarnatenomultiplier: boolean;
    reincarnatenoaccelerator: boolean;
    prestigenocoinupgrades: boolean;
    transcendnocoinupgrades: boolean;
    transcendnocoinorprestigeupgrades: boolean;
    reincarnatenocoinupgrades: boolean;
    reincarnatenocoinorprestigeupgrades: boolean;
    reincarnatenocoinprestigeortranscendupgrades: boolean;
    reincarnatenocoinprestigetranscendorgeneratorupgrades: boolean;
    crystalUpgrades: number[];
    crystalUpgradesCost: number[]; // Costs corresponding to crystalUpgrades

    // Runes & Talismans
    runes: Runes;
    runeBlessings: Record<RuneBlessingKeys, string>;
    runeSpirits: Record<RuneSpiritKeys, string>;
    offerings: string;
    maxOfferings: string;

    // Timers & Counters
    prestigecounter: number;
    transcendcounter: number;
    reincarnationcounter: number;
    offlinetick: number; // Timestamp? Large number
    prestigeamount: number;
    transcendamount: number;
    reincarnationamount: number;
    fastestprestige: number;
    fastesttranscend: number;
    fastestreincarnate: number;
    resetToggleModes: {
      prestige: AutoResetModes;
      transcend: AutoResetModes;
      reincarnation: AutoResetModes;
      ascension: AutoAscensionModes;
    };
    tesseractAutoBuyerToggle: number; // Likely boolean represented as number
    tesseractAutoBuyerAmount: number;

    // Buy Amounts
    coinbuyamount: number;
    crystalbuyamount: number;
    mythosbuyamount: number;
    particlebuyamount: number;
    offeringbuyamount: number;
    tesseractbuyamount: number;
    shoptoggles: ShopToggles;

    codes: [number, boolean][]; // Array of [codeId, redeemedStatus] tuples

    shopUpgrades: ShopUpgrades;

    shopPotionsConsumed: ShopPotionsConsumed;

    shopConfirmationToggle: boolean;
    shopBuyMaxToggle: boolean | 'TEN' | 'ANY';
    shopHideToggle: boolean;
    autoPotionTimer: number;
    autoPotionTimerObtainium: number;

    autoSacrificeToggle: boolean;
    autoBuyFragment: boolean;
    autoFortifyToggle: boolean;
    autoEnhanceToggle: boolean;
    autoResearchToggle: boolean;
    researchBuyMaxToggle: boolean;
    autoResearchMode: 'cheapest' | 'manual';
    autoResearch: number;
    autoSacrifice: number;
    sacrificeTimer: number;
    quarkstimer: number;
    goldenQuarksTimer: number;

    antSacrificeTimer: number;
    antSacrificeTimerReal: number;

    talismans: Talismans;

    talismanShards: string; // Large values stored as string
    commonFragments: string;
    uncommonFragments: string;
    rareFragments: string;
    epicFragments: string;
    legendaryFragments: string;
    mythicalFragments: string;

    buyTalismanShardPercent: number;
    ascensionCount: number;

    ascensionCounter: number;
    ascensionCounterReal: number;
    ascensionCounterRealReal: number;
    autoOpenCubes: boolean;
    openCubes: number;
    autoOpenTesseracts: boolean;
    openTesseracts: number;
    autoOpenHypercubes: boolean;
    openHypercubes: number;
    autoOpenPlatonicsCubes: boolean;
    openPlatonicsCubes: number;
    cubeUpgrades: (number | null)[]; // Array of cube upgrade levels (starts with null)
    cubeUpgradesBuyMaxToggle: boolean;
    autoCubeUpgradesToggle: boolean;
    autoPlatonicUpgradesToggle: boolean;
    platonicUpgrades: number[];
    maxPlatToggle: boolean;
    wowCubes: number;
    wowTesseracts: number;
    wowHypercubes: number;
    wowPlatonicCubes: number;
    wowAbyssals: number;
    wowOcteracts: number;
    totalWowOcteracts: number;

    cubeBlessings: CubeTesseractHypercubeBlessings;
    tesseractBlessings: CubeTesseractHypercubeBlessings;
    hypercubeBlessings: CubeTesseractHypercubeBlessings;
    platonicBlessings: PlatonicBlessings;

    ascendShards: string; // Large values stored as string
    autoAscend: boolean;
    autoAscendMode: string; // e.g., "realAscensionTime"
    autoAscendThreshold: number;
    roombaResearchIndex: number;
    ascStatToggles: AscStatToggles;

    campaigns: Campaigns;
    corruptions: Corruptions;

    constantUpgrades: (number | null)[]; // Array of constant upgrade levels (starts with null)
    history: History;
    historyShowPerSecond: boolean;

    autoChallengeRunning: boolean;
    autoChallengeIndex: number;
    autoChallengeToggles: boolean[];
    autoChallengeStartExponent: number;
    autoChallengeTimer: {
        start: number
        exit: number
        enter: number
    };

    runeBlessingBuyAmount: number;
    runeSpiritBuyAmount: number;

    autoTesseracts: boolean[]; // Toggles for auto-opening Tesseract types

    saveString: string; // Format string for save file names
    exporttest: boolean; // Internal/debug flag?

    dayCheck: string; // ISO Date string
    dayTimer: number;
    cubeOpenedDaily: number;
    cubeQuarkDaily: number;
    tesseractOpenedDaily: number;
    tesseractQuarkDaily: number;
    hypercubeOpenedDaily: number;
    hypercubeQuarkDaily: number;
    platonicCubeOpenedDaily: number;
    platonicCubeQuarkDaily: number;
    
    version: string

    rngCode: number;
    skillCode?: number;
    promoCodeTiming: {
        time: number
    }
    hepteracts: hepteracts;

    overfluxOrbs: number;
    overfluxOrbsAutoBuy: boolean;
    overfluxPowder: number;
    dailyPowderResetUses: number;
    autoWarpCheck: boolean;

    singularityCount: number;
    highestSingularityCount: number;
    singularityCounter: number;
    singularityElevatorTarget: number;
    singularityElevatorSlowClimb: boolean;
    singularityElevatorLocked: boolean;
    singularityMatter: number;
    goldenQuarks: number;
    quarksThisSingularity: number;
    totalQuarksEver: number;
    hotkeys: Record<string, any>; // Structure depends on defined hotkeys
    theme: string; // e.g., "Dark Mode"
    iconSet: number;
    notation: 'Pure Scientific' | 'Pure Engineering' | 'Default';
    
    goldenQuarkUpgrades: goldenQuarkUpgrades;
    octUpgrades: octUpgrades;
    ambrosiaUpgrades: AmbrosiaUpgrades;

    dailyCodeUsed: boolean;
    hepteractAutoCraftPercentage: number;
    octeractTimer: number;

    insideSingularityChallenge: boolean;
    singularityChallenges: SingularityChallenges;

    ambrosia: number;
    lifetimeAmbrosia: number;
    purpleAmbrosia?: number;
    lifetimePurpleAmbrosia?: number;

    blueberryTime: number;
    ambrosiaRNG: number; // DEPRECIATED, DO NOT USE
    spentBlueberries: number;

    blueberryLoadouts: BlueberryLoadouts;
    blueberryLoadoutMode: 'saveTree' | 'loadTree';

    redAmbrosia: number;
    lifetimeRedAmbrosia: number;
    redAmbrosiaTime: number;
    redAmbrosiaUpgrades: RedAmbrosiaUpgrades;

    purpleHoneyProgress?: number;
    purpleReactor?: {
        purpleHoney: number;
        lifetimePurpleHoney: number;
        storedAmbrosiaBarPoints: number;
        storedRedAmbrosiaBarPoints: number;
        ambrosiaBarPointPercentage: number;
        redAmbrosiaBarPointPercentage: number;
    };
    purpleReactorUpgrades?: Record<string, number>;
    purpleAmbrosiaUpgrades?: Record<string, number>;
    encabulatorOvercapToggle?: boolean;

    singChallengeTimer: number;

    lastExportedSave: number; // Timestamp

    seed: number[];

    stats: {
        totalAddCodesUsed: number;
    }

    // Add any missing top-level keys if necessary
}
