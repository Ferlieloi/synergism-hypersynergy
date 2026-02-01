/*
    NOTE: THIS WHOLE THING IS GENERATE BY GOOGLE GEMINI PRO 2.5
    The main interface for the save data is: export interface PlayerData
*/

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
    coinone: boolean;
    cointwo: boolean;
    cointhree: boolean;
    coinfour: boolean;
    prestige: boolean;
    generation: boolean;
    transcend: boolean;
    reincarnate: boolean;
    rrow1: boolean;
    rrow2: boolean;
    rrow3: boolean;
    rrow4: boolean;
    // Add others if they exist
}
/**
 * Represents the exp for each rune
 */
export interface Runes {
    speed: number;
    duplication: number;
    prism: number;
    thrift: number;
    superiorIntellect: number;
    infiniteAscent: number;
    antiquities: number;
    horseShoe: number;
    finiteDescent: number;
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
    crumbs: Decimal;
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
    shopSingularitySpeedup: number;
    shopSingularityPotency: number;
    shopSadisticRune: number;
    shopRedLuck1: number;
    shopRedLuck2: number;
    shopRedLuck3: number;
    shopInfiniteShopUpgrades: number;
    shopHorseShoe: number;
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

export class CorruptionLoadout {
    totalScoreMult = 1
    corruptionScoreMults = [1, 3, 4, 5, 6, 7, 7.75, 8.5, 9.25, 10, 10.75, 11.5, 12.25, 13, 16, 20, 25, 33, 35]
    levels: CorruptionLevels = {
        viscosity: 0,
        drought: 0,
        deflation: 0,
        extinction: 0,
        illiteracy: 0,
        recession: 0,
        dilation: 0,
        hyperchallenge: 0
    }
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
    used: CorruptionLoadout;
    next: CorruptionLoadout;
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
    commonFragment: number;
    epicFragment: number;
    legendaryFragment: number;
    mythicalFragment: number;
    rareFragment: number;
    shard: number;
    uncommonFragment: number;
}

export interface Talismans {
    achievement: TalismanShards;
    chronos: TalismanShards;
    cookieGrandma: TalismanShards;
    exemption: TalismanShards;
    horseShoe: TalismanShards;
    metaphysics: TalismanShards;
    midas: TalismanShards;
    mortuus: TalismanShards;
    plastic: TalismanShards;
    polymath: TalismanShards;
    wowSquare: TalismanShards;
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
 * Represents timing information related to promo codes.
 */
export interface PromoCodeTiming {
    time: number; // Timestamp
}

/**
 * Represents the common structure for singularity and octeract upgrade data.
 */
export interface UpgradeData {
    level: number;
    toggleBuy: number; // Often 1, could potentially be boolean
    freeLevels: number;
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
    talismanFreeLevel: number;
    talismanRuneEffect: number;
    antiquityOOM: number;
}

/**
 * Contains the status of all singularity challenges. Keys are internal challenge names.
 */
export interface SingularityChallenges {
    noSingularityUpgrades: SingularityChallengeStatus;
    oneChallengeCap: SingularityChallengeStatus;
    noOcteracts: SingularityChallengeStatus;
    limitedAscensions: SingularityChallengeStatus;
    noAmbrosiaUpgrades: SingularityChallengeStatus;
    limitedTime: SingularityChallengeStatus;
    sadisticPrequel: SingularityChallengeStatus;
    taxmanLastStand: SingularityChallengeStatus;
}

/**
 * Represents data for a specific Ambrosia/Blueberry upgrade.
 */
export interface AmbrosiaUpgradeData extends UpgradeData {
    ambrosiaInvested: number;
    blueberriesInvested: number;
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
    ambrosiaCubes3: AmbrosiaUpgradeData;
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
    ambrosiaSingReduction2: AmbrosiaUpgradeData;
    ambrosiaTalismanBonusRuneLevel: AmbrosiaUpgradeData;
    ambrosiaRuneOOMBonus: AmbrosiaUpgradeData;

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
    blueberryGenerationSpeed2: number;
    regularLuck: number;
    regularLuck2: number;
    redGenerationSpeed: number;
    redLuck: number;
    redAmbrosiaCube: number;
    redAmbrosiaObtainium: number;
    redAmbrosiaOffering: number;
    redAmbrosiaCubeImprover: number;
    viscount: number;
    infiniteShopUpgrades: number;
    redAmbrosiaAccelerator: number;
    salvageYinYang: number;
    blueberries: number;
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
}


/**
 * The main interface representing the entire player save data structure.
 */
export interface PlayerData {
    // Basic Info & Timestamps
    firstPlayed: string; // ISO Date string
    version: string;
    rngCode: number;
    seed: number[];
    lastExportedSave: number; // Timestamp
    dayCheck: string; // ISO Date string
    dayTimer: number;
    dailyCodeUsed: boolean;
    promoCodeTiming: PromoCodeTiming;

    // Core Currencies & Progression
    worlds: string; // Large number stored as string
    coins: Decimal; // Large number stored as string
    coinsThisPrestige: string;
    coinsThisTranscension: string;
    coinsThisReincarnation: string;
    coinsTotal: string;

    prestigeCount: number;
    transcendCount: number;
    reincarnationCount: number;
    ascensionCount: number;
    singularityCount: number;
    highestSingularityCount: number;

    prestigePoints: Decimal; // Can be large/decimal stored as string
    transcendPoints: Decimal;
    reincarnationPoints: Decimal;
    prestigeShards: Decimal;
    transcendShards: Decimal;
    reincarnationShards: Decimal;
    ascendShards: Decimal;

    campaigns: Campaigns;

    researchPoints: number;
    runeshards: number;
    maxofferings: number;
    offeringpersecond: number;
    obtainiumtimer: number;
    obtainiumpersecond: number;
    maxobtainiumpersecond: number;
    maxobtainium: number;
    overfluxOrbs: number;
    overfluxPowder: number;
    dailyPowderResetUses: number;
    quarks: number;
    quarksThisSingularity: number;
    totalQuarksEver: number;
    goldenQuarks: number;
    wowCubes: number;
    wowTesseracts: number;
    wowHypercubes: number;
    wowPlatonicCubes: number;
    wowAbyssals: number;
    wowOcteracts: number;
    totalWowOcteracts: number;
    ambrosia: number;
    lifetimeAmbrosia: number;
    ambrosiaRNG: number;
    redAmbrosia: number;
    lifetimeRedAmbrosia: number;
    spentBlueberries: number;
    ultimateProgress: number;

    // Generators (Coins, Diamonds, Mythos, Particles, Ants)
    ants: Ants;
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
    researches: number[]; // Array of research levels
    crystalUpgrades: number[];
    crystalUpgradesCost: number[]; // Costs corresponding to crystalUpgrades
    cubeUpgrades: (number | null)[]; // Array of cube upgrade levels (starts with null)
    platonicUpgrades: number[];
    constantUpgrades: (number | null)[]; // Array of constant upgrade levels (starts with null)
    shopUpgrades: ShopUpgrades;
    shopHorseShoe: ShopUpgrades;
    goldenQuarkUpgrades: goldenQuarkUpgrades;
    octUpgrades: octUpgrades;
    ambrosiaUpgrades: AmbrosiaUpgrades;
    redAmbrosiaUpgrades: RedAmbrosiaUpgrades;

    // Runes & Talismans
    runes: Runes;
    runeexp: number[];
    runeBlessingLevels: number[];
    runeSpiritLevels: number[];
    talismans: Talismans;
    talismanShards: Decimal;
    commonFragments: Decimal;
    uncommonFragments: Decimal;
    rareFragments: Decimal;
    epicFragments: Decimal;
    legendaryFragments: Decimal;
    mythicalFragments: Decimal;

    // Blessings & Crafts
    cubeBlessings: CubeTesseractHypercubeBlessings;
    tesseractBlessings: CubeTesseractHypercubeBlessings;
    hypercubeBlessings: CubeTesseractHypercubeBlessings;
    platonicBlessings: PlatonicBlessings;
    hepteracts: hepteracts;

    // Challenges & Corruptions
    challengecompletions: number[]; // Completions per challenge
    highestchallengecompletions: number[]; // Highest completions per challenge
    challenge15Exponent: number;
    highestChallenge15Exponent: number;
    currentChallenge: CurrentChallenge;
    retrychallenges: boolean;
    corruptions: Corruptions;
    insideSingularityChallenge: boolean;
    singularityChallenges: SingularityChallenges;
    singChallengeTimer: number;


    // Automation & Toggles
    toggles: Toggles;
    unlocks: Unlocks;
    achievements: number[]; // Status per achievement (0 or 1)
    progressiveAchievements: progressiveAchievements;
    achievementPoints: number;
    shoptoggles: ShopToggles;
    shopBuyMaxToggle: boolean;
    shopHideToggle: boolean;
    shopConfirmationToggle: boolean;
    resettoggle1: number;
    resettoggle2: number;
    resettoggle3: number;
    resettoggle4: number;
    saveOfferingToggle: boolean;
    ascStatToggles: AscStatToggles;
    autoSacrificeToggle: boolean;
    autoBuyFragment: boolean;
    autoFortifyToggle: boolean;
    autoEnhanceToggle: boolean;
    autoResearchToggle: boolean;
    researchBuyMaxToggle: boolean;
    autoResearchMode: string; // e.g., "cheapest"
    autoResearch: number;
    autoSacrifice: number;
    buyTalismanShardPercent: number;
    cubeUpgradesBuyMaxToggle: boolean;
    autoCubeUpgradesToggle: boolean;
    autoPlatonicUpgradesToggle: boolean;
    autoAscend: boolean;
    autoAscendMode: string; // e.g., "realAscensionTime"
    autoAscendThreshold: number;
    autoOpenCubes: boolean;
    openCubes: number;
    autoOpenTesseracts: boolean;
    openTesseracts: number;
    autoOpenHypercubes: boolean;
    openHypercubes: number;
    autoOpenPlatonicsCubes: boolean;
    openPlatonicsCubes: number;
    autoChallengeRunning: boolean;
    autoChallengeIndex: number;
    autoChallengeToggles: boolean[];
    autoChallengeStartExponent: number;
    autoChallengeTimer: AutoChallengeTimer;
    autoPotionTimer: number;
    autoPotionTimerObtainium: number;
    shopPotionsConsumed: ShopPotionsConsumed;
    autoTesseracts: boolean[]; // Toggles for auto-opening Tesseract types
    autoWarpCheck: boolean;
    overfluxOrbsAutoBuy: boolean;
    hepteractAutoCraftPercentage: number;

    // Timers & Counters
    prestigecounter: number;
    transcendcounter: number;
    reincarnationcounter: number;
    ascensionCounter: number;
    ascensionCounterReal: number;
    ascensionCounterRealReal: number;
    singularityCounter: number;
    offlinetick: number; // Timestamp? Large number
    sacrificeTimer: number;
    quarkstimer: number;
    goldenQuarksTimer: number;
    octeractTimer: number;
    blueberryTime: number;
    redAmbrosiaTime: number;


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
    fastestprestige: number;
    fastesttranscend: number;
    fastestreincarnate: number;
    prestigeamount: number;
    transcendamount: number;
    reincarnationamount: number;

    // UI & Settings
    tabnumber: number;
    subtabNumber: number;
    saveString: string; // Format string for save file names
    exporttest: boolean; // Internal/debug flag?
    hotkeys: Record<string, any>; // Structure depends on defined hotkeys
    theme: string; // e.g., "Dark Mode"
    iconSet: number;
    notation: string; // e.g., "Default"
    historyShowPerSecond: boolean;
    roombaResearchIndex: number;
    visitedAmbrosiaSubtab: boolean;
    visitedAmbrosiaSubtabRed: boolean;
    blueberryLoadoutMode: string; // e.g., "loadTree"
    blueberryLoadouts: BlueberryLoadouts;


    // Buy Amounts
    coinbuyamount: number;
    crystalbuyamount: number;
    mythosbuyamount: number;
    particlebuyamount: number;
    offeringbuyamount: number;
    tesseractbuyamount: number;
    tesseractAutoBuyerToggle: number; // Likely boolean represented as number
    tesseractAutoBuyerAmount: number;
    runeBlessingBuyAmount: number;
    runeSpiritBuyAmount: number;

    // Codes & Version Loads
    codes: [number, boolean][]; // Array of [codeId, redeemedStatus] tuples
    loaded1009: boolean;
    loaded1009hotfix1: boolean;
    loaded10091: boolean;
    loaded1010: boolean;
    loaded10101: boolean;
    loadedOct4Hotfix: boolean; // Example old version flag
    loadedNov13Vers: boolean;
    loadedDec16Vers: boolean;
    loadedV253: boolean;
    loadedV255: boolean;
    loadedV297Hotfix1: boolean;
    loadedV2927Hotfix1: boolean;
    loadedV2930Hotfix1: boolean;
    loadedV2931Hotfix1: boolean;
    loadedV21003Hotfix1: boolean;
    loadedV21007Hotfix1: boolean;

    // Daily Stats
    cubeOpenedDaily: number;
    cubeQuarkDaily: number;
    tesseractOpenedDaily: number;
    tesseractQuarkDaily: number;
    hypercubeOpenedDaily: number;
    hypercubeQuarkDaily: number;
    platonicCubeOpenedDaily: number;
    platonicCubeQuarkDaily: number;

    // History Data
    history: History;

    // Add any missing top-level keys if necessary
}