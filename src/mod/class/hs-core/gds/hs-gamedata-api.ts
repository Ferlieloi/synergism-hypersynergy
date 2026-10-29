import { EventBuffType, ConsumableGameEvents } from "../../../types/data-types/hs-event-data";
import { AchievementRewards, AmbrosiaUpgradeNames, AntProducers, AntUpgrades, CalculationCache, CalculationMode, CachedValue, GoldenQuarkUpgradeKey, HepteractType, LAST_ANT_PRODUCER, OcteractUpgradeKey, RedAmbrosiaUpgradeKey, ProgressiveAchievement, ProgressiveAchievements, SingularityChallengeDataKeys, SingularityDebuffs, PCoinUpgradeEffects, NumberStatLine, RuneKeys, TalismanKeys, SynergismLevelMilestones, FAVORITE_UPGRADE_GQ_DEPENDENCIES, FAVORITE_UPGRADE_OCTERACT_DEPENDENCIES, FAVORITE_UPGRADE_RED_AMBROSIA_DEPENDENCIES, offeringPotionThresholds, obtainiumPotionThresholds } from "../../../types/data-types/hs-gamedata-api-types";
import type { GameData, SingularityChallengeRewards, SingularityChallengeStatus } from "../../../types/data-types/hs-player-savedata";
import type { CampaignData } from "../../../types/data-types/hs-campaign-data";
import type { MeData } from "../../../types/data-types/hs-me-data";
import type { PseudoGameData } from "../../../types/data-types/hs-pseudo-data";
import { HSModuleOptions } from "../../../types/hs-types";
import { HSUtils } from "../../hs-utils/hs-utils";
import { HSLogger } from "../hs-logger";
import { HSUI } from "../hs-ui";
import { HSModuleManager } from "../module/hs-module-manager";
import { HSGameData } from "./hs-gamedata";
import { HSGameDataAPIPartial } from "./hs-gamedata-api-partial";
import { ShopUpgradeHelper } from "./hs-gamedata-api-quarkShop";
import { AntUpgradeHelper } from "./hs-gamedata-api-ant";
import { TalismanHelper } from "./hs-gamedata-api-talisman";
import { RuneHelper } from "./hs-gamedata-api-rune";
import { AchievementHelper } from "./hs-gamedata-api-achievement";
import { AmbrosiaHelper } from "./hs-gamedata-api-ambrosia";
import { GoldenQuarkHelper, dailyFreeLevelCaps } from "./hs-gamedata-api-goldenQuark";
import { OcteractHelper, dailyOcteractFreeLevelCaps } from "./hs-gamedata-api-octeract";
import { LuckHelper } from "./hs-gamedata-api-luck";
import { PurpleHelper } from "./hs-gamedata-api-purple";
import type { HSCalculationComponents, ShopUpgradeHelperContext, AntUpgradeHelperContext, TalismanHelperContext, RuneHelperContext, AchievementHelperContext, AmbrosiaHelperContext, AcceleratorHelperContext } from "../../../types/data-types/hs-gamedata-api-types";
import type { GoldenQuarkHelperContext } from "./hs-gamedata-api-goldenQuark";
import type { OcteractHelperContext } from "./hs-gamedata-api-octeract";
import type { LuckHelperContext } from "./hs-gamedata-api-luck";
import { checkCalculationCache, updateCalculationCache, clearCalculationCache, dumpCalculationCache, createCalculationCache } from "./hs-gamedata-api-cache";
import { AcceleratorHelper } from "./hs-gamedata-api-accelerator";
import { CorruptionHelper, type CorruptionCubeType } from "./hs-gamedata-api-corruption";
import { octeractUpgradeMaxLevels, goldenQuarkUpgradeMaxLevels, c15Functions, challenge15Rewards, hepteractEffectiveValues, synergismLevelMilestones, SINGULARITY_CHALLENGE_DATA } from "./hs-gamedata-tables";
import { parseGameDataDecimal, calculateSigmoidExponential, findInsertionIndex, floorLog10OfOnePlus } from "./hs-gamedata-utils";
import { buildHeaterExport } from "./hs-heater-export";
import Decimal from "break_infinity.js";

// The Cube Bank's weight per Challenge 1-5 completion, by tier (transcensionCubeBankTiers in SynergismOfficial/src/Challenges.ts)
const TRANSCENSION_CUBE_BANK_TIERS: ReadonlyArray<{ from: number; to: number; weight: number }> = [
    { from: 1, to: 100, weight: 2 },
    { from: 101, to: 200, weight: 3 },
    { from: 201, to: 300, weight: 4 },
    { from: 301, to: Number.POSITIVE_INFINITY, weight: 5 }
];

// The Challenge 15 reward of each cube type (challenge15CubeRewards in SynergismOfficial/src/Statistics.ts)
const CHALLENGE15_CUBE_REWARDS = {
    cubes: 'wowCubes',
    tesseracts: 'wowTesseracts',
    hypercubes: 'wowHypercubes',
    platonics: 'wowPlatonicCubes',
    hepteracts: 'wowHepteracts',
    octeracts: 'wowOcteracts'
} as const satisfies Record<CorruptionCubeType, keyof typeof challenge15Rewards>;

// High-Scoring Statue's power and normalization per cube type (highScoringStatueScaling in SynergismOfficial/src/PlatonicCubes.ts)
const HIGH_SCORING_STATUE_SCALING: Record<CorruptionCubeType, { power: number; normalization: number }> = {
    cubes: { power: 1 / 4.1, normalization: 0 },
    tesseracts: { power: 0.35, normalization: 0 },
    hypercubes: { power: 0.5, normalization: 0 },
    platonics: { power: 0.75, normalization: 0 },
    hepteracts: { power: 0.85, normalization: 1e12 },
    octeracts: { power: 1, normalization: 1e25 }
};
const HIGH_SCORING_STATUE_SOFTCAP = 1e25;

const highScoringStatueBase = (blessings: number) => {
    const DR1 = 1 / 4;
    const DR2 = 1 / 8;
    const limit1 = 1e4;
    const limit2 = 1e20;
    const effectPerBlessing = 1 / 1e4;

    if (blessings < limit1) {
        return 1 + effectPerBlessing * blessings;
    }

    if (blessings < limit2) {
        const limitMult = Math.pow(limit1, 1 - DR1);
        return 1 + effectPerBlessing * limitMult * Math.pow(blessings, DR1);
    }

    const limitMult1 = Math.pow(limit1, 1 - DR1);
    const limitMult2 = Math.pow(limit2, DR1 - DR2);
    return 1 + effectPerBlessing * limitMult1 * limitMult2 * Math.pow(blessings, DR2);
};

/**
 * Tokens per Challenge 10 completion at a corruption level, copied from SynergismOfficial/src/Campaign.ts
 * (`corruptionLevelTokenRates`): [last level, tokens per completion].
 */
const CORRUPTION_LEVEL_TOKEN_RATES: ReadonlyArray<[number, number]> = [[20, 1], [45, 2], [Number.POSITIVE_INFINITY, 3]];

const CAMPAIGN_INHERITANCE_LEVELS = [2, 5, 10, 17, 26, 37, 50, 65, 82, 101, 220, 240, 260, 270, 277];
const CAMPAIGN_INHERITANCE_TOKEN_VALUES = [1, 10, 25, 40, 75, 100, 150, 200, 250, 300, 350, 400, 500, 600, 750];
const CAMPAIGN_BONUS_TOKEN_LEVELS = [41, 58, 113, 163, 229];

/** Achievement-point inputs copied from SynergismOfficial/src/Shop.ts. */
const QUARK_UPGRADE_MAX_LEVELS: Record<string, number> = {
    offeringEX: 60, offeringAuto: 100, obtainiumEX: 60, obtainiumAuto: 100,
    instantChallenge: 1, antSpeed: 60, cashGrab: 60, shopTalisman: 1,
    seasonPass: 60, challengeExtension: 5, challengeTome: 15, cubeToQuark: 1,
    tesseractToQuark: 1, hypercubeToQuark: 1, seasonPass2: 100, seasonPass3: 100,
    chronometer: 60, infiniteAscent: 1, calculator: 5, calculator2: 12,
    calculator3: 10, calculator4: 10, calculator5: 100, calculator6: 100,
    constantEX: 2, powderEX: 50, chronometer2: 100, chronometer3: 1000,
    seasonPassY: 100, seasonPassZ: 1000, challengeTome2: 5, instantChallenge2: 1,
    cubeToQuarkAll: 100, cashGrab2: 1000, chronometerZ: 1000, offeringEX2: 1000,
    obtainiumEX2: 1000, powderAuto: 100, seasonPassLost: 1000, challenge15Auto: 1,
    extraWarp: 1, autoWarp: 1, improveQuarkHept: 10, improveQuarkHept2: 10,
    improveQuarkHept3: 10, improveQuarkHept4: 10, shopImprovedDaily: 20,
    shopImprovedDaily2: 10, shopImprovedDaily3: 15, shopImprovedDaily4: 25,
    offeringEX3: 1000, obtainiumEX3: 1000, improveQuarkHept5: 7777,
    chronometerInfinity: 1000, seasonPassInfinity: 1000,
    shopSingularityPenaltyDebuff: 4, shopAmbrosiaLuckMultiplier4: 4, calculator7: 50,
    shopOcteractAmbrosiaLuck: 2, shopAmbrosiaGeneration1: 25,
    shopAmbrosiaGeneration2: 30, shopAmbrosiaGeneration3: 35,
    shopAmbrosiaGeneration4: 1000, shopAmbrosiaLuck1: 40, shopAmbrosiaLuck2: 50,
    shopAmbrosiaLuck3: 60, shopAmbrosiaLuck4: 1000, shopRedLuck1: 1000,
    shopRedLuck2: 1000, shopRedLuck3: 1000, shopRedLuck4: 1000,
    shopCashGrabUltra: 5, shopAmbrosiaAccelerator: 5, shopEXUltra: 80,
    shopChronometerS: 1, shopAmbrosiaUltra: 5, shopSingularitySpeedup: 1,
    shopSingularityPotency: 1, shopSadisticRune: 1, shopInfiniteShopUpgrades: 100,
    shopHorseShoe: 1, shopPurpleBarRebate: 10, shopPanthema: 1,
};

/** Purple Reactor AP data copied from SynergismOfficial/src/Purple.ts. */
const PURPLE_REACTOR_AP_DATA: Array<{
    key: string;
    maxLevel: number;
    perLevelAP: number;
    maxLevelAP: number;
    costFormula: (level: number) => number;
}> = [
    { key: 'tutorial', maxLevel: 15, perLevelAP: 1, maxLevelAP: 0, costFormula: (level) => level * (level + 1) / 2 },
    { key: 'purpleEfficiency1', maxLevel: 20, perLevelAP: 0.5, maxLevelAP: 5, costFormula: (level) => 3 * level },
    { key: 'purpleEfficiency2', maxLevel: 20, perLevelAP: 0.5, maxLevelAP: 10, costFormula: (level) => 60 * level },
    { key: 'purpleEfficiency3', maxLevel: 30, perLevelAP: 0.5, maxLevelAP: 10, costFormula: (level) => 1_200 * level },
    { key: 'purpleEfficiency4', maxLevel: 30, perLevelAP: 0.5, maxLevelAP: 15, costFormula: (level) => 24_000 * level },
    { key: 'purpleHoneyLuck1', maxLevel: 10, perLevelAP: 1, maxLevelAP: 5, costFormula: (level) => 7 * level },
    { key: 'purpleHoneyLuck2', maxLevel: 15, perLevelAP: 1, maxLevelAP: 5, costFormula: (level) => 140 * level },
    { key: 'purpleHoneyLuck3', maxLevel: 20, perLevelAP: 1, maxLevelAP: 5, costFormula: (level) => 2_800 * level },
    { key: 'purpleHoneyLuck4', maxLevel: 25, perLevelAP: 1, maxLevelAP: 5, costFormula: (level) => 56_000 * level },
    { key: 'purpleHalfLife1', maxLevel: 50, perLevelAP: 0.2, maxLevelAP: 10, costFormula: (level) => 12 * level },
    { key: 'purpleHalfLife2', maxLevel: 50, perLevelAP: 0.3, maxLevelAP: 10, costFormula: (level) => 240 * level },
    { key: 'purpleHalfLife3', maxLevel: 50, perLevelAP: 0.4, maxLevelAP: 10, costFormula: (level) => 4_800 * level },
    { key: 'purpleHalfLife4', maxLevel: 50, perLevelAP: 0.5, maxLevelAP: 10, costFormula: (level) => 96_000 * level },
    { key: 'paperweight', maxLevel: 100, perLevelAP: 0.3, maxLevelAP: 20, costFormula: (level) => Math.pow(level, 3) },
    { key: 'purpleCapacityExpander1', maxLevel: 10_000, perLevelAP: 0, maxLevelAP: 30, costFormula: (level) => Math.pow(level, 1.1) },
    { key: 'purpleCapacityExpander2', maxLevel: 10_000, perLevelAP: 0, maxLevelAP: 40, costFormula: (level) => 10 * Math.pow(level, 1.2) },
    { key: 'purpleCapacityExpander3', maxLevel: 10_000, perLevelAP: 0, maxLevelAP: 50, costFormula: (level) => 100 * Math.pow(level, 1.25) },
    { key: 'purpleCapacityExpander4', maxLevel: 10_000, perLevelAP: 0, maxLevelAP: 60, costFormula: (level) => 1_000 * Math.pow(level, 1.3) },
    { key: 'purpleHoneyRequirementReduction1', maxLevel: 25, perLevelAP: 0.4, maxLevelAP: 5, costFormula: (level) => 20 * level },
    { key: 'purpleHoneyRequirementReduction2', maxLevel: 25, perLevelAP: 0.4, maxLevelAP: 5, costFormula: (level) => 400 * level },
    { key: 'purpleHoneyRequirementReduction3', maxLevel: 25, perLevelAP: 0.4, maxLevelAP: 5, costFormula: (level) => 8_000 * level },
    { key: 'purpleHoneyRequirementReduction4', maxLevel: 25, perLevelAP: 0.4, maxLevelAP: 5, costFormula: (level) => 160_000 * level },
    { key: 'obtainium', maxLevel: 100_000, perLevelAP: 0, maxLevelAP: 40, costFormula: (level) => 10 * Math.pow(level, 1.2) },
    { key: 'offerings', maxLevel: 100_000, perLevelAP: 0, maxLevelAP: 40, costFormula: (level) => 10 * Math.pow(level, 1.2) },
    { key: 'lifetimeHoneyQuarks', maxLevel: 10, perLevelAP: 1, maxLevelAP: 5, costFormula: (level) => 500 * level },
    { key: 'lifetimeHoneyGlobalSpeed', maxLevel: 10, perLevelAP: 1, maxLevelAP: 0, costFormula: (level) => 2_000 * level },
    { key: 'lifetimeHoneyAscensionSpeed', maxLevel: 10, perLevelAP: 1, maxLevelAP: 0, costFormula: (level) => 2_000 * level },
    { key: 'lifetimeHoneyAmbrosia', maxLevel: 10, perLevelAP: 1, maxLevelAP: 5, costFormula: (level) => 10_000 * level },
    { key: 'lifetimeHoneyRedAmbrosia', maxLevel: 15, perLevelAP: 1, maxLevelAP: 0, costFormula: (level) => 10_000 * level },
    { key: 'lifetimeHoneyAntELO', maxLevel: 50, perLevelAP: 1, maxLevelAP: 5, costFormula: (level) => 15_000 * level },
    { key: 'lifetimeHoneyRebornELOSpeed', maxLevel: 50, perLevelAP: 1, maxLevelAP: 0, costFormula: (level) => 15_000 * level },
    { key: 'purpleQuarkGain', maxLevel: 5, perLevelAP: 2, maxLevelAP: 10, costFormula: (level) => 2_000 * (Math.pow(4, level) - 1) / 3 },
];

/**
 * Class: HSGameDataAPI
 * IsExplicitHSModule: Yes
 * Description:
 *   If this looks silly, check details in hs-gamedata-api-partial.ts
 *
 *   This class, even though the name is HSGameDataAPI, contains only
 *   calculation functions which use game data
 *
 *   The main game data API class is HSGameDataAPIPartial.
 *   Yes, they are basically wrong way around but it is what it is.
 *
 *   --
 *
 *   This file is also very long and will most likely get a lot longer still.
 *   This is because this file mostly contains functions ripped from the game's code
 *   and modified to work with the mod's own cache etc. (*) The big idea in the end is that
 *   I'll try to expose everything in here in some sane way so nobody needs to look in here.
 *
 *   --
 *
 *   (*) All of the  methods are ripped from the game's code
*/
export class HSGameDataAPI extends HSGameDataAPIPartial {
    #calculationCache: CalculationCache = {} as CalculationCache;

    singularityChallengeData: typeof SINGULARITY_CHALLENGE_DATA = SINGULARITY_CHALLENGE_DATA;

    #calculationCacheTemplate: CalculationCache;

    // calculateSynergismLevel's result for the current data, cleared with the calculation cache
    #synergismLevel: number | undefined;

    // Bumped by clearCache(): the helpers with caches of their own (quark shop, ants, talismans, runes) clear them when it
    // changes, not when the data object does: the live player stays the same object
    #cacheGeneration = 0;

    // These are imported from hs-gamedata-tables.ts
    #hepteractEffectiveValues = hepteractEffectiveValues;
    readonly #calculationHelperProviders: Array<object> = [];

    readonly quarkShop: ShopUpgradeHelper;
    readonly antUpgrade: AntUpgradeHelper;
    readonly talisman: TalismanHelper;
    readonly rune: RuneHelper;
    readonly achievement: AchievementHelper;
    readonly ambrosia: AmbrosiaHelper;
    readonly goldenQuark: GoldenQuarkHelper;
    readonly octeract: OcteractHelper;
    readonly luck: LuckHelper;
    readonly purple: PurpleHelper;
    readonly accelerator: AcceleratorHelper;
    readonly corruption: CorruptionHelper;

    getSingularityChallengeEffect = <
        T extends SingularityChallengeDataKeys,
        K extends keyof SingularityChallengeRewards[T]
    >(
        challenge: T,
        effectKey: K
    ): SingularityChallengeRewards[T][K] => {
        if (!this.gameData) return 0 as SingularityChallengeRewards[T][K]
        const challengeData = this.singularityChallengeData[challenge]
        if (!challengeData) return 0 as SingularityChallengeRewards[T][K]

        const completions = this.gameData.singularityChallenges[challenge]?.completions ?? 0
        const effectValue = challengeData.effect(completions)[effectKey]
        return effectValue as SingularityChallengeRewards[T][K]
    }

    override _updateGameData(data: GameData) {
        // A save click can be observed before the game's btoa hook has
        // produced the new payload.  Keep the last derived token total if
        // that transient snapshot does not contain the token completions;
        // otherwise a refresh incorrectly resets the export to inheritance
        // tokens only (750 at the current singularity count).
        const previousCampaignData = this.campaignData;
        super._updateGameData(data);
        this.clearCache();

        // Campaign tokens are derived by the game and are intentionally not
        // serialized. Recompute them for every save snapshot so the export
        // always reflects the same token state as the game.
        const campaignData = this.calculateCampaignDataFromSave();
        if (campaignData !== undefined) {
            this.campaignData = campaignData;
        } else if (previousCampaignData !== undefined) {
            this.campaignData = previousCampaignData;
        }
    }

    override _updateMeData(data: MeData) {
        super._updateMeData(data);
        this.clearCache();
    }

    override _updatePseudoData(data: PseudoGameData) {
        super._updatePseudoData(data);
        this.clearCache();
    }

    override _updateEventData(data: ConsumableGameEvents) {
        super._updateEventData(data);
        this.clearCache();
    }

    // The event buffs and ambrosia luck read the global event: cached results must not outlive it
    override _updateVanillaGlobalEvent(raw: unknown) {
        super._updateVanillaGlobalEvent(raw);
        this.clearCache();
    }

    /** Mirrors updateTokens and levelTokenTerms in SynergismOfficial/src/Campaign.ts: tokens come from the best
     * Challenge 10 completions at each corruption level (player.corruptions.tokenCompletions). */
    private calculateCampaignDataFromSave(): CampaignData | undefined {
        const completions = this.gameData?.corruptions?.tokenCompletions;
        // The completions are not optional in a current save. If the
        // transient payload lacks them, do not manufacture a zeroed token
        // state and overwrite a valid previous calculation.
        if (!Array.isArray(completions)) return undefined;
        const highestSingularity = this.gameData?.highestSingularityCount ?? 0;

        // firstCompletionBonusPoints: the last-completion upgrades now count at the first completion too
        const firstCompletionBonus = (highestSingularity >= 16 ? 5 : 0)
            + (highestSingularity >= 69 ? 10 : 0)
            + this.getGQUpgradeEffect('singBonusTokens1', 'firstCompletionBonusTokens')
            + this.getGQUpgradeEffect('singBonusTokens3', 'lastCompletionBonusTokens')
            + this.getOcteractUpgradeEffect('octeractBonusTokens3', 'firstCompletionBonusTokens')
            + this.getOcteractUpgradeEffect('octeractBonusTokens1', 'lastCompletionBonusTokens');
        let singularityTokenMultiplier = 1;
        for (let i = CAMPAIGN_BONUS_TOKEN_LEVELS.length; i > 0; i--) {
            if (highestSingularity >= CAMPAIGN_BONUS_TOKEN_LEVELS[i - 1]) {
                singularityTokenMultiplier = 1 + 0.02 * i;
                break;
            }
        }
        const tokenMultiplier = singularityTokenMultiplier
            * this.getGQUpgradeEffect('singBonusTokens2', 'tokenMultiplier')
            * this.getOcteractUpgradeEffect('octeractBonusTokens2', 'tokenMultiplier');

        // inheritanceTokens (Calculate.ts) checks the levels from the last one down to the second one: the first
        // level (singularity 2, 1 token) never counts
        let inheritedTokens = 0;
        for (let i = CAMPAIGN_INHERITANCE_LEVELS.length - 1; i > 0; i--) {
            if (highestSingularity >= CAMPAIGN_INHERITANCE_LEVELS[i]) {
                inheritedTokens = CAMPAIGN_INHERITANCE_TOKEN_VALUES[i];
                break;
            }
        }

        let tokens = 0;
        for (let level = 1; level < completions.length; level++) {
            const levelCompletions = Number(completions[level] ?? 0);
            if (!Number.isFinite(levelCompletions) || levelCompletions <= 0) continue;
            const rate = CORRUPTION_LEVEL_TOKEN_RATES.find(([lastLevel]) => level <= lastLevel)?.[1] ?? 0;
            tokens += Math.floor(rate * levelCompletions * tokenMultiplier) + Math.floor(rate * firstCompletionBonus);
        }

        return {
            tokens: tokens
                + inheritedTokens
                + this.getGQUpgradeEffect('singBonusTokens4', 'initialTokenBonus')
                + this.getOcteractUpgradeEffect('octeractBonusTokens4', 'initialTokenBonus')
        };
    }

    private memoizeCalculation<T>(cacheName: keyof CalculationCache, calculationVars: number[], calculateFn: () => T): T {
        const cached = checkCalculationCache<T>(this.#calculationCache, cacheName, calculationVars);
        if (cached !== undefined) {
            return cached;
        }

        const value = calculateFn();
        updateCalculationCache(this.#calculationCache, cacheName, { value, cachedBy: calculationVars });
        return value;
    }

    firstFiveRuneEffectivenessStats: NumberStatLine[] = [
        {
            i18n: 'Research1x4',
            stat: () => 1 + (this.gameData?.researches[4] ?? 0) / 10 * (1 + (this.gameData?.challengecompletions?.[14] ?? 0)),
        },
        {
            i18n: 'Research1x21',
            stat: () => 1 + (this.gameData?.researches[21] ?? 0) / 100,
        },
        {
            i18n: 'Research4x15',
            stat: () => 1 + (this.gameData?.researches[90] ?? 0) / 100,
        },
        {
            i18n: 'Research6x6',
            stat: () => 1 + ((this.gameData?.researches[131] ?? 0) / 200),
        },
        {
            i18n: 'Research6x21',
            stat: () => 1 + (((this.gameData?.researches[146] ?? 0) / 200) * 4) / 5,
        },
        {
            i18n: 'Research7x11',
            stat: () => 1 + (((this.gameData?.researches[161] ?? 0) / 200) * 3) / 5,
        },
        {
            i18n: 'Research8x1',
            stat: () => 1 + (((this.gameData?.researches[176] ?? 0) / 200) * 2) / 5,
        },
        {
            i18n: 'Research8x16',
            stat: () => 1 + (((this.gameData?.researches[191] ?? 0) / 200) * 1) / 5,
        },
        {
            i18n: 'ConstantUpgrade9',
            stat: () => {
                const talismanShards = parseGameDataDecimal(this.gameData?.talismanShards)
                return 1 + 0.01 * Decimal.log(talismanShards.add(1), 4)
                    * Math.min(1, (this.gameData?.constantUpgrades[9] ?? 0))
            },
        },
        {
            i18n: 'Challenge15',
            stat: () => this.calculateChallenge15Reward('runeBonus'),
        },
        {
            i18n: 'MidasTribute',
            stat: () => this.rune.calculateRuneEffectivenessCubeBlessing(),
        }
    ]

    allBaseOfferingStats: NumberStatLine[] = [
        {
            i18n: 'Base',
            stat: () => 1
        },
        {
            i18n: 'PseudoCoins',
            stat: () => 6 * this.getPCoinUpgradeLevel('BASE_OFFERING_BUFF')
        },
        {
            i18n: 'Prestige',
            stat: () => (this.gameData?.prestigeCount ?? 0) > 0 ? 1 : 0
        },
        {
            i18n: 'Transcend',
            stat: () => (this.gameData?.transcendCount ?? 0) > 0 ? 3 : 0
        },
        {
            i18n: 'Reincarnate',
            stat: () => (this.gameData?.reincarnationCount ?? 0) > 0 ? 5 : 0
        },
        {
            i18n: 'Challenge1',
            stat: () => (this.gameData?.challengecompletions?.[2] ?? 0) > 0 ? 2 : 0
        },
        {
            i18n: 'ShopPotionBonus',
            stat: () => this.calculateOfferingPotionBaseOfferings().amount
        },
        {
            i18n: 'ReincarnationUpgrade2',
            stat: () => (this.gameData?.upgrades?.[62] ?? 0) > 0
                ? Math.min(12, (1 / 50) * HSUtils.sumContents(this.gameData?.challengecompletions ?? []))
                : 0
        },
        {
            i18n: 'Research1x24',
            stat: () => 0.4 * (this.gameData?.researches?.[24] ?? 0)
        },
        {
            i18n: 'Research1x25',
            stat: () => 0.6 * (this.gameData?.researches?.[25] ?? 0)
        },
        {
            i18n: 'Research4x20',
            stat: () => (this.gameData?.researches?.[95] ?? 0) > 0 ? 15 : 0
        },
        {
            i18n: 'AmbrosiaBaseOffering1',
            stat: () => this.ambrosia.getAmbrosiaUpgradeEffects('ambrosiaBaseOffering1').offering
        },
        {
            i18n: 'AmbrosiaBaseOffering2',
            stat: () => this.ambrosia.getAmbrosiaUpgradeEffects('ambrosiaBaseOffering2').offering
        },
        {
            i18n: 'OfferingEX3',
            stat: () => this.quarkShop.getShopUpgradeEffects('offeringEX3', 'baseOfferings') as number
        }
    ]

    allBaseObtainiumStats: NumberStatLine[] = [
        {
            i18n: 'Base',
            stat: () => 1
        },
        {
            i18n: 'PseudoCoins',
            stat: () => 3 * this.getPCoinUpgradeLevel('BASE_OBTAINIUM_BUFF')
        },
        {
            i18n: 'ShopPotionBonus',
            stat: () => this.calculateObtainiumPotionBaseObtainium().amount
        },
        {
            i18n: 'Research3x13',
            stat: () => (this.gameData?.reincarnationcounter ?? 0) >= 2 ? (this.gameData?.researches?.[63] ?? 0) : 0
        },
        {
            i18n: 'Research3x14',
            stat: () => (this.gameData?.reincarnationcounter ?? 0) >= 5 ? 2 * (this.gameData?.researches?.[64] ?? 0) : 0
        },
        {
            i18n: 'FirstSingularity',
            stat: () => (this.gameData?.highestSingularityCount ?? 0) > 0 ? 3 : 0
        },
        {
            i18n: 'SingularityCount',
            stat: () => Math.floor((this.gameData?.singularityCount ?? 0) / 10)
        },
        {
            i18n: 'AmbrosiaBaseObtainium1',
            stat: () => this.ambrosia.getAmbrosiaUpgradeEffects('ambrosiaBaseObtainium1').obtainium
        },
        {
            i18n: 'AmbrosiaBaseObtainium2',
            stat: () => this.ambrosia.getAmbrosiaUpgradeEffects('ambrosiaBaseObtainium2').obtainium
        }
    ]

    maxTalismansRarityAP = 50 * 11;

    progressiveAchievements!: Record<ProgressiveAchievements, ProgressiveAchievement>;


    getRuneBonusLevels(rune: RuneKeys): number {
        if (!this.gameData) return 0;

        const talismanRuneBonuses = this.talisman.getRuneBonusFromAllTalismansBatch();

        switch (rune) {
            case 'speed': {
                return (
                    talismanRuneBonuses.speed
                    + ((this.gameData.upgrades[27] ?? 0) * (Math.min(50, Math.floor(parseGameDataDecimal(this.gameData.coinsThisPrestige).add(1).log10() / 10))
                        + Math.max(0, Math.min(50, Math.floor(parseGameDataDecimal(this.gameData.coinsThisPrestige).add(1).log10() / 50) - 10))))
                    + ((this.gameData.upgrades[29] ?? 0) * Math.floor(
                        Math.min(
                            100,
                            ((this.gameData.firstOwnedCoin ?? 0) + (this.gameData.secondOwnedCoin ?? 0) + (this.gameData.thirdOwnedCoin ?? 0) + (this.gameData.fourthOwnedCoin ?? 0)
                                + (this.gameData.fifthOwnedCoin ?? 0)) / 400
                        )
                    ))
                )
            }
            case 'duplication': {
                return (
                    talismanRuneBonuses.duplication
                    + ((this.gameData.upgrades[28] ?? 0) * Math.min(
                        100,
                        Math.floor(
                            ((this.gameData.firstOwnedCoin ?? 0) + (this.gameData.secondOwnedCoin ?? 0) + (this.gameData.thirdOwnedCoin ?? 0) + (this.gameData.fourthOwnedCoin ?? 0)
                                + (this.gameData.fifthOwnedCoin ?? 0)) / 400
                        )
                    ))
                    + ((this.gameData.upgrades[30] ?? 0) * (Math.min(50, Math.floor(parseGameDataDecimal(this.gameData.coinsThisPrestige).add(1).log10() / 30))
                        + Math.min(50, Math.floor(parseGameDataDecimal(this.gameData.coinsThisPrestige).add(1).log10() / 300))))
                )
            }
            case 'prism':
                return talismanRuneBonuses.prism;
            case 'thrift':
                return talismanRuneBonuses.thrift;
            case 'superiorIntellect':
                return talismanRuneBonuses.superiorIntellect;
            case 'infiniteAscent':
                return (
                    (this.getPCoinUpgradeLevel('INSTANT_UNLOCK_2') ? 6 : 0)
                    + (this.gameData.cubeUpgrades[73] ?? 0)
                    + this.calculateCampaignRune6Bonus()
                    + talismanRuneBonuses.infiniteAscent
                    + this.rune.getRuneEffects('finiteDescent').infiniteAscentFreeLevel
                )
            case 'antiquities':
                return talismanRuneBonuses.antiquities;
            case 'horseShoe': {
                return talismanRuneBonuses.horseShoe
                     + this.quarkShop.getShopUpgradeEffects('shopHorseShoe', 'bonusHorseLevels') as number
            }
            default:
                return 0;
        }
    }


    // =============================
    // ======== Constructor ========
    // =============================

    constructor(moduleOptions: HSModuleOptions) {
        super(moduleOptions);

        let ambrosia!: AmbrosiaHelper;
        let quarkShop!: ShopUpgradeHelper;
        let antUpgrade!: AntUpgradeHelper;
        let talisman!: TalismanHelper;
        let rune!: RuneHelper;
        let achievement!: AchievementHelper;
        let goldenQuark!: GoldenQuarkHelper;
        let octeract!: OcteractHelper;
        let luck!: LuckHelper;
        let purple!: PurpleHelper;
        let corruption!: CorruptionHelper;

        const cacheProvider = {
            checkCalculationCache: (cacheName: keyof CalculationCache, calculationVars: number[]) =>
                checkCalculationCache(this.#calculationCache, cacheName, calculationVars),
            updateCalculationCache: (cacheName: keyof CalculationCache, item: CachedValue) =>
                updateCalculationCache(this.#calculationCache, cacheName, item),
        };

        const ambrosiaContext: AmbrosiaHelperContext = {
            getGameData: () => this.gameData,
            getMeData: () => this.meData,
            calculateLuck: (reduce_vals = true, true_base = false) => this.luck.calculateLuck(reduce_vals, true_base),
            calculateRedAmbrosiaLuck: () => this.luck.calculateRedAmbrosiaLuck() as number,
            getShopUpgradeEffects: (upgradeKey, effectKey, mode) => quarkShop.getShopUpgradeEffects(upgradeKey as any, effectKey as any, mode),
            getSingularityChallengeEffect: (challengeKey, effectKey) => this.getSingularityChallengeEffect(challengeKey as any, effectKey as any),
            getAmbrosiaUpgradeEffects: (upgradeKey: string, mode?: CalculationMode) => this.ambrosia.getAmbrosiaUpgradeEffects(upgradeKey as any, mode),
            getRedAmbrosiaUpgradeEffects: (upgradeKey: string) => this.ambrosia.getRedAmbrosiaUpgradeEffects(upgradeKey as any),
            getGQUpgradeEffect: (upgradeKey, effectKey) => goldenQuark.getGQUpgradeEffect(upgradeKey as any, effectKey),
            getOcteractUpgradeEffect: (upgradeKey, effectKey) => octeract.getOcteractUpgradeEffect(upgradeKey as any, effectKey),
            getPurpleReactorUpgradeEffects: (upgradeKey, effectKey) => purple.getPurpleReactorUpgradeEffects(upgradeKey as any, effectKey),
            getPurpleAmbrosiaUpgradeEffects: (upgradeKey, effectKey) => purple.getPurpleAmbrosiaUpgradeEffects(upgradeKey as any, effectKey),
            getPurpleHoneyLuck: () => purple.calculatePurpleHoneyLuck(),
            getPurpleHoneyPerExtraction: () => purple.calculatePurpleHoneyPerExtraction(),
            getPCoinUpgradeLevel: (upgradeName: string) => this.getPCoinUpgradeLevel(upgradeName as any),
            getCampaignTokens: () => this.campaignData?.tokens ?? 0,
            getEventBellAmount: () => this.eventData?.HAPPY_HOUR_BELL.amount ?? 0,
            calculateSynergismLevel: () => this.calculateSynergismLevel(),
            isEvent: () => this.isEvent,
            calculateEventSourceBuff: (buffType: EventBuffType) => this.calculateEventSourceBuff(buffType),
            checkCalculationCache: cacheProvider.checkCalculationCache,
            updateCalculationCache: cacheProvider.updateCalculationCache,
        };
        ambrosia = this.registerCalculationHelper(new AmbrosiaHelper(ambrosiaContext));
        this.ambrosia = ambrosia;
        purple = this.registerCalculationHelper(new PurpleHelper({
            getGameData: () => this.gameData,
            calculateBlueberryInventory: () => ambrosia.calculateBlueberryInventory(true) as number,
            calculateSynergismLevel: () => this.calculateSynergismLevel(),
            getPCoinUpgradeLevel: (upgradeKey) => this.getPCoinUpgradeLevel(upgradeKey as any),
            getSingularityChallengeEffect: (challengeKey, effectKey) => this.getSingularityChallengeEffect(challengeKey as any, effectKey as any),
            getRuneEffects: (runeKey) => rune.getRuneEffects(runeKey as any),
            getTalismanEffects: (talismanKey) => talisman.getTalismanEffects(talismanKey as any),
            getOcteractUpgradeEffect: (upgradeKey, effectKey) => octeract.getOcteractUpgradeEffect(upgradeKey as any, effectKey),
        }));
        this.purple = purple;
        this.#calculationCache = createCalculationCache(this.ambrosia);

        const quarkShopContext: ShopUpgradeHelperContext = {
            getGameData: () => this.gameData,
            getCacheGeneration: () => this.#cacheGeneration,
            getPCoinUpgradeLevel: (upgradeName) => this.getPCoinUpgradeLevel(upgradeName as any),
            getShopUpgradeTypeBonusLevels: (type) => quarkShop.getShopUpgradeTypeBonusLevels(type),
            getShopUpgradeEffects: (upgradeKey, effectKey, mode) => quarkShop.getShopUpgradeEffects(upgradeKey as any, effectKey as any, mode),
            getSingularityChallengeEffect: (challengeKey, effectKey) => this.getSingularityChallengeEffect(challengeKey as any, effectKey as any),
            getAmbrosiaUpgradeEffects: (upgradeName, mode) => ambrosia.getAmbrosiaUpgradeEffects(upgradeName as any, mode),
            getRuneEffectiveLevel: (runeName) => rune.getRuneEffectiveLevel(runeName),
            getRuneEffects: (runeName) => rune.getRuneEffects(runeName),
            getRedAmbrosiaUpgradeEffects: (upgradeKey) => ambrosia.getRedAmbrosiaUpgradeEffects(upgradeKey as any),
            calculateSumOfExaltCompletions: () => this.calculateSumOfExaltCompletions(),
            calculateFreeShopInfinityUpgrades: (mode: CalculationMode = 'normal') => this.calculateAllShopTablets(true, mode),
            checkCalculationCache: cacheProvider.checkCalculationCache,
            updateCalculationCache: cacheProvider.updateCalculationCache,
        };
        quarkShop = this.registerCalculationHelper(new ShopUpgradeHelper(quarkShopContext));
        this.quarkShop = quarkShop;

        const octeractContext: OcteractHelperContext = {
            getGameData: () => this.gameData,
            getSavedUpgradeFreeLevel: (upgrade) => this.getSavedUpgradeFreeLevel(upgrade),
            getRedAmbrosiaFreeAccumulatorCapIncrease: () =>
                ambrosia.getRedAmbrosiaUpgradeEffects('redAmbrosiaFreeAccumulator').freeAccumulatorLevelCapIncrease,
        };
        octeract = this.registerCalculationHelper(new OcteractHelper(octeractContext));
        this.octeract = octeract;

        const goldenQuarkContext: GoldenQuarkHelperContext = {
            getGameData: () => this.gameData,
            getShopUpgradeEffects: (upgradeKey, effectKey, mode) => quarkShop.getShopUpgradeEffects(upgradeKey as any, effectKey as any, mode),
            getSavedUpgradeFreeLevel: (upgrade) => this.getSavedUpgradeFreeLevel(upgrade),
            getOcteractUpgradeEffect: (upgradeKey, effectKey) => octeract.getOcteractUpgradeEffect(upgradeKey, effectKey),
            getFavoriteUpgradeMaxedDependencyCount: () => this.getFavoriteUpgradeMaxedDependencyCount(),
        };
        goldenQuark = this.registerCalculationHelper(new GoldenQuarkHelper(goldenQuarkContext));
        this.goldenQuark = goldenQuark;

        const antUpgradeContext: AntUpgradeHelperContext = {
            getGameData: () => this.gameData,
            getCacheGeneration: () => this.#cacheGeneration,
            getAchievementReward: (rewardName) => achievement.AchRewards[rewardName as AchievementRewards](),
            calculateSigmoidExponential,
            calculateChallenge15Reward: (rewardName) => this.calculateChallenge15Reward(rewardName as any),
            getChallenge15CorruptionEffect: (key) => corruption.getChallenge15CorruptionEffect(key),
            checkCalculationCache: cacheProvider.checkCalculationCache,
            updateCalculationCache: cacheProvider.updateCalculationCache,
        };
        antUpgrade = this.registerCalculationHelper(new AntUpgradeHelper(antUpgradeContext));
        this.antUpgrade = antUpgrade;

        const talismanContext: TalismanHelperContext = {
            getGameData: () => this.gameData,
            getCacheGeneration: () => this.#cacheGeneration,
            getSingularityChallengeEffect: (challengeKey, effectKey) => this.getSingularityChallengeEffect(challengeKey as any, effectKey as any),
            getPCoinUpgradeLevel: (upgradeName) => this.getPCoinUpgradeLevel(upgradeName as any),
            isShopTalismanUnlocked: () => quarkShop.getShopUpgradeEffects('shopTalisman', 'unlocked') as boolean,
            getAchievementReward: (rewardName) => achievement.AchRewards[rewardName as AchievementRewards](),
            getGQUpgradeEffect: (upgradeKey) => this.getGQUpgradeEffect(upgradeKey as any) as number | undefined,
            getAmbrosiaUpgradeEffects: (upgradeKey, mode) => ambrosia.getAmbrosiaUpgradeEffects(upgradeKey as any, mode),
            getPurpleAmbrosiaUpgradeEffects: (upgradeKey, effectKey) => purple.getPurpleAmbrosiaUpgradeEffects(upgradeKey as any, effectKey),
            getAntUpgradeEffectValue: (upgradeKey, property) => antUpgrade.getAntUpgradeEffectValue(upgradeKey as any, property as any),
            getLevelMilestone: (name) => this.getLevelMilestone(name as any),
            getOcteractUpgradeEffect: (upgradeKey) => this.getOcteractUpgradeEffect(upgradeKey as any) as number | undefined,
            calculateChallenge15Reward: (rewardName) => this.calculateChallenge15Reward(rewardName as any),
            checkCalculationCache: cacheProvider.checkCalculationCache,
            updateCalculationCache: cacheProvider.updateCalculationCache,
        };
        talisman = this.registerCalculationHelper(new TalismanHelper(talismanContext));
        this.talisman = talisman;

        const runeContext: RuneHelperContext = {
            getGameData: () => this.gameData,
            getCacheGeneration: () => this.#cacheGeneration,
            getPCoinUpgradeLevel: (upgradeName) => this.getPCoinUpgradeLevel(upgradeName as any),
            getSingularityChallengeEffect: (challengeKey, effectKey) => this.getSingularityChallengeEffect(challengeKey as any, effectKey as any),
            getRuneBonusLevels: (runeName) => this.getRuneBonusLevels(runeName),
            getRuneEffects: (runeName) => rune.getRuneEffects(runeName),
            getAchievementReward: (rewardName) => achievement.AchRewards[rewardName as AchievementRewards](),
            getAmbrosiaUpgradeEffects: (upgradeKey, mode) => ambrosia.getAmbrosiaUpgradeEffects(upgradeKey as any, mode),
            getPurpleAmbrosiaUpgradeEffects: (upgradeKey, effectKey) => purple.getPurpleAmbrosiaUpgradeEffects(upgradeKey as any, effectKey),
            getAntUpgradeEffectValue: (upgradeKey, property) => antUpgrade.getAntUpgradeEffectValue(upgradeKey as any, property as any),
            getLevelMilestone: (name) => this.getLevelMilestone(name as any),
            firstFiveFreeLevels: () => this.firstFiveFreeLevels(),
            firstFiveEffectiveRuneLevelMult: () => this.firstFiveEffectiveRuneLevelMult(),
            getTalismanEffects: (t, rarity) => talisman.getTalismanEffects(t as any, rarity),
            calculateHypercubeBlessingMultiplierPlatonicBlessing: () => this.calculateHypercubeBlessingMultiplierPlatonicBlessing(),
            calculateChallenge15Reward: (rewardName) => this.calculateChallenge15Reward(rewardName as any),
            getRedAmbrosiaUpgradeEffects: (upgradeKey) => ambrosia.getRedAmbrosiaUpgradeEffects(upgradeKey as any),
            calculateHepteractEffective: (type) => this.calculateHepteractEffective(type),
            getCorruptionEffect: (level, key) => corruption.getCorruptionEffect(level, key),
            getActiveCorruptionLevel: () => corruption.getActiveCorruptionLevel(),
            getChallenge15CorruptionEffect: (key) => corruption.getChallenge15CorruptionEffect(key),
            calculateSingularityDebuff: (debuff) => this.calculateSingularityDebuff(debuff),
            calculateSynergismLevel: () => this.calculateSynergismLevel(),
            getShopLevel: (upgradeKey) => quarkShop.getShopLevel(upgradeKey),
            checkCalculationCache: cacheProvider.checkCalculationCache,
            updateCalculationCache: cacheProvider.updateCalculationCache,
        };
        rune = this.registerCalculationHelper(new RuneHelper(runeContext));
        this.rune = rune;

        const achievementContext: AchievementHelperContext = {
            getGameData: () => this.gameData,
            getCampaignData: () => this.campaignData,
            getSingularityChallengeEffect: (challengeKey, effectKey) => this.getSingularityChallengeEffect(challengeKey as any, effectKey as any),
            getPrestigePointGain: () => this.getPrestigePointGain(),
            getTranscendPointGain: () => this.getTranscendPointGain(),
            getReincarnationPointGain: () => this.getReincarnationPointGain(),
            getRuneEffectiveLevel: (runeName) => rune.getRuneEffectiveLevel(runeName),
            getRuneFreeLevels: (runeName) => rune.getRuneFreeLevels(runeName),
            runes: () => rune.runes,
            getActiveCorruptionLevel: () => corruption.getActiveCorruptionLevel(),
            calculateChallenge15Reward: (rewardName) => this.calculateChallenge15Reward(rewardName as any),
            calculateSynergismLevel: () => this.calculateSynergismLevel(),
            getAscensionEffectiveCorruptionLevel: () => corruption.getAscensionEffectiveCorruptionLevel(),
            checkCalculationCache: cacheProvider.checkCalculationCache,
            updateCalculationCache: cacheProvider.updateCalculationCache,
        };
        achievement = this.registerCalculationHelper(new AchievementHelper(achievementContext));
        this.achievement = achievement;

        const luckContext: LuckHelperContext = {
            getGameData: () => this.gameData,
            isEvent: () => this.isEvent,
            getPCoinUpgradeLevel: (upgradeName) => this.getPCoinUpgradeLevel(upgradeName as any),
            getSingularityChallengeEffect: (challengeKey, effectKey) => this.getSingularityChallengeEffect(challengeKey as any, effectKey as any),
            getShopUpgradeEffects: (upgradeKey, effectKey, mode) => quarkShop.getShopUpgradeEffects(upgradeKey as any, effectKey as any, mode),
            getShopLevel: (upgradeKey, mode) => quarkShop.getShopLevel(upgradeKey as any, mode),
            getShopLevelDependencies: (upgradeKey) => quarkShop.getShopLevelDependencies(upgradeKey as any),
            getAmbrosiaUpgradeEffects: (upgradeKey, mode) => ambrosia.getAmbrosiaUpgradeEffects(upgradeKey as any, mode),
            getRedAmbrosiaUpgradeEffects: (upgradeKey) => ambrosia.getRedAmbrosiaUpgradeEffects(upgradeKey as any),
            getRuneEffectiveLevel: (runeName) => rune.getRuneEffectiveLevel(runeName),
            getRuneEffects: (runeName) => rune.getRuneEffects(runeName),
            getTalismanEffects: (t, rarity) => talisman.getTalismanEffects(t as any, rarity),
            calculateEventSourceBuff: (buffType) => this.calculateEventSourceBuff(buffType),
            calculateSingularityDebuff: (debuff, singularityCount) => this.calculateSingularityDebuff(debuff as any, singularityCount),
            calculateSynergismLevel: () => this.calculateSynergismLevel(),
            calculateChallenge15Reward: (rewardName) => this.calculateChallenge15Reward(rewardName as any),
            getSavedUpgradeFreeLevel: (upgrade) => this.getSavedUpgradeFreeLevel(upgrade),
            getGQUpgradeEffect: (upgradeKey, effectKey) => goldenQuark.getGQUpgradeEffect(upgradeKey as any, effectKey),
            getOcteractUpgradeEffect: (upgradeKey, effectKey) => octeract.getOcteractUpgradeEffect(upgradeKey as any, effectKey),
            getPurpleAmbrosiaUpgradeEffects: (upgradeKey, effectKey) => purple.getPurpleAmbrosiaUpgradeEffects(upgradeKey as any, effectKey),
            checkCalculationCache: cacheProvider.checkCalculationCache,
            updateCalculationCache: cacheProvider.updateCalculationCache,
            getCampaignTokens: () => this.campaignData?.tokens ?? 0,
            getVanillaGlobalEventAmbrosiaLuck: () => this.vanillaGlobalEvent?.ambrosiaLuck ?? 0,
            getEventBellAmount: () => this.eventData?.HAPPY_HOUR_BELL.amount ?? 0,
        };
        luck = this.registerCalculationHelper(new LuckHelper(luckContext));
        this.luck = luck;

        corruption = this.registerCalculationHelper(new CorruptionHelper({
            getGameData: () => this.gameData,
            getSingularityChallengeEffect: (challengeKey, effectKey) => this.getSingularityChallengeEffect(challengeKey as any, effectKey as any),
            getGQUpgradeEffect: (upgradeKey, effectKey) => goldenQuark.getGQUpgradeEffect(upgradeKey as any, effectKey),
            getOcteractUpgradeEffect: (upgradeKey, effectKey) => octeract.getOcteractUpgradeEffect(upgradeKey as any, effectKey),
            getTalismanEffects: (t, rarity) => talisman.getTalismanEffects(t as any, rarity),
            getRuneEffects: (runeName) => rune.getRuneEffects(runeName),
            getChallenge15Reward: (rewardName) => this.calculateChallenge15Reward(rewardName),
        }));
        this.corruption = corruption;

        const acceleratorContext: AcceleratorHelperContext = {
            getGameData: () => this.gameData,
            getAchievementReward: (rewardName) => achievement.AchRewards[rewardName as AchievementRewards](),
            getAntUpgradeEffectValue: (upgradeKey, property) => antUpgrade.getAntUpgradeEffectValue(upgradeKey as any, property as any),
            calculateTotalRuneLevels: () => rune.calculateTotalRuneLevels(),
            getRuneEffects: (runeName) => rune.getRuneEffects(runeName),
            calculateHypercubeBlessingMultiplierPlatonicBlessing: () => this.calculateHypercubeBlessingMultiplierPlatonicBlessing(),
            calculateHepteractEffective: (type) => this.calculateHepteractEffective(type),
            getCorruptionEffect: (level, key) => corruption.getCorruptionEffect(level, key),
            getActiveCorruptionLevel: () => corruption.getActiveCorruptionLevel(),
            getChallenge15CorruptionEffect: (key) => corruption.getChallenge15CorruptionEffect(key),
            calculateChallenge15Reward: (rewardName) => this.calculateChallenge15Reward(rewardName as any),
        };
        this.accelerator = new AcceleratorHelper(acceleratorContext);

        this.#calculationCacheTemplate = { ...this.#calculationCache };
        this.progressiveAchievements = this.createProgressiveAchievements();
    }


    // ===== Registration =====
    public registerCalculationHelper<T extends object>(helper: T): T {
        this.#calculationHelperProviders.push(helper);
        return helper;
    }


    // =============================
    // ======= General Utils =======
    // =============================

    private totalWowLog10(): number {
        if (!this.gameData) return 6;
        const data = this.gameData;
        return (
            floorLog10OfOnePlus(data.wowCubes)
            + floorLog10OfOnePlus(data.wowTesseracts)
            + floorLog10OfOnePlus(data.wowHypercubes)
            + floorLog10OfOnePlus(data.wowPlatonicCubes)
            + floorLog10OfOnePlus(data.wowAbyssals)
            + floorLog10OfOnePlus(data.wowOcteracts)
            + 6
        );
    }

    public getCalculationFunction(fnName: string): ((...args: unknown[]) => unknown) | undefined {
        const directFn = (this as any)[fnName];
        if (typeof directFn === 'function') {
            return directFn.bind(this);
        }

        for (const provider of this.#calculationHelperProviders) {
            const providerFn = (provider as any)[fnName];
            if (typeof providerFn === 'function') {
                return providerFn.bind(provider);
            }
        }

        return undefined;
    }

    clearCache() {
        this.#calculationCache = clearCalculationCache(this.#calculationCacheTemplate);
        this.#synergismLevel = undefined;
        this.#cacheGeneration++;
    }

    dumpCache() {
        dumpCalculationCache(this.#calculationCache);
    }

    getLevelMilestone(name: SynergismLevelMilestones): number {
        if (!this.gameData) return 0;
        const milestone = synergismLevelMilestones[name];
        const level = this.calculateSynergismLevel();
        return level >= milestone.levelReq ? milestone.effect.call(this) : milestone.defaultValue;
    }

    getPCoinUpgradeLevel(name: keyof typeof PCoinUpgradeEffects): number {
        // Patched game: its own levels, live, once its fetch has answered (HSGameData clears the cache when they change)
        const liveLevels = window.__HS_pcoinLevelsLoaded ? window.__HS_pcoinLevels : undefined;
        if (liveLevels) {
            const liveLevel = Number(liveLevels[name] ?? 0);
            return Number.isFinite(liveLevel) ? liveLevel : 0;
        }

        const pseudoData = this.getPseudoData?.() ?? this.pseudoData;
        if (!pseudoData) return 0;

        // The current endpoint separates upgrade metadata from the player's
        // purchased levels.  Player-level entries are not guaranteed to carry
        // internalName, so resolve the requested game name to its stable ID
        // first and use that ID for the level lookup.  Keep the name lookup as
        // a compatibility path for older responses.
        const metadata = pseudoData.upgrades?.find((upgrade) =>
            typeof upgrade === 'object' && upgrade !== null && 'internalName' in upgrade
                && upgrade.internalName === name
        ) as { upgradeId?: number } | undefined;
        const playerUpgrade = pseudoData.playerUpgrades?.find((upgrade) => {
            if (!upgrade || typeof upgrade !== 'object') return false;
            if (upgrade.internalName === name) return true;
            return metadata?.upgradeId !== undefined
                && Number(upgrade.upgradeId) === Number(metadata.upgradeId);
        });
        const level = Number(playerUpgrade?.level ?? 0);
        return Number.isFinite(level) ? level : 0;
    }

    getCurrentAPFromChallenges = Object.entries(this.singularityChallengeData).reduce(
        (acc, [chalKey, challenge]) => {
            const completions =
                this.gameData?.singularityChallenges[chalKey as SingularityChallengeDataKeys]
                    ?.completions ?? 0;

            return acc + challenge.achievementPointValue(completions);
        },
        0
    );

    getSavedUpgradeFreeLevel(upgrade?: { freeLevel?: number; freeLevels?: number }): number {
        const freeLevel = Number(upgrade?.freeLevel ?? upgrade?.freeLevels ?? 0)
        return Number.isFinite(freeLevel) ? freeLevel : 0
    }

    getFavoriteUpgradeMaxedDependencyCount(): number {
        if (!this.gameData) return 0

        const goldenQuarkMaxed = FAVORITE_UPGRADE_GQ_DEPENDENCIES.reduce((count, key) =>
            count + (this.goldenQuark.getGQUpgradeLevel(key) >= goldenQuarkUpgradeMaxLevels[key].maxLevel ? 1 : 0),
            0
        )

        const octeractMaxed = FAVORITE_UPGRADE_OCTERACT_DEPENDENCIES.reduce((count, key) =>
            count + (this.octeract.getOcteractUpgradeLevel(key) >= octeractUpgradeMaxLevels[key].maxLevel ? 1 : 0),
            0
        )

        const redAmbrosiaMaxed = FAVORITE_UPGRADE_RED_AMBROSIA_DEPENDENCIES.reduce((count, key) => {
            const maxLevel = this.ambrosia.redAmbrosiaUpgradeCalculationCollection[key].maxLevel
            return count + (this.ambrosia.calculateRedAmbrosiaUpgradeValue(key) >= maxLevel ? 1 : 0)
        }, 0)

        return goldenQuarkMaxed + octeractMaxed + redAmbrosiaMaxed
    }

    getVanillaGlobalEventBuff(buffType: EventBuffType): number {
        const event = this.vanillaGlobalEvent;
        if (!event) return 0;

        const hasOneMindUpgrade = this.getGQUpgradeEffect('oneMind', 'unlocked') > 0;

        switch (buffType) {
            case EventBuffType.Quark:
                return event.quark;
            case EventBuffType.GoldenQuark:
                return event.goldenQuark;
            case EventBuffType.Cubes:
                return event.cubes;
            case EventBuffType.PowderConversion:
                return event.powderConversion;
            case EventBuffType.AscensionSpeed:
                return event.ascensionSpeed;
            case EventBuffType.GlobalSpeed:
                return event.globalSpeed;
            case EventBuffType.AscensionScore:
                return event.ascensionScore;
            case EventBuffType.AntSacrifice:
                return event.antSacrifice;
            case EventBuffType.Offering:
                return event.offering;
            case EventBuffType.Obtainium:
                return event.obtainium;
            case EventBuffType.Octeract:
                return event.octeract;
            case EventBuffType.BlueberryTime:
                return event.blueberryTime;
            case EventBuffType.AmbrosiaLuck:
                return event.ambrosiaLuck;
            case EventBuffType.OneMind:
                return hasOneMindUpgrade ? event.oneMind : 0;
            default:
                return 0;
        }
    }

    calculateTotalCubesExp() {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'CubesExpTotal' as keyof CalculationCache;

        const calculationVars: number[] = [
            Number(data.wowCubes),
            Number(data.wowTesseracts),
            Number(data.wowHypercubes),
            Number(data.wowPlatonicCubes),
            data.wowAbyssals,
            data.wowOcteracts
        ]

        const cached = checkCalculationCache(this.#calculationCache, cacheName, calculationVars);

        if (cached !== undefined) return cached;

        const reduced = this.totalWowLog10();

        updateCalculationCache(this.#calculationCache, cacheName, { value: reduced, cachedBy: calculationVars });

        return reduced;
    }

    calculateHepteractEffective = (heptType: HepteractType) => {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'HepteractEffective' as keyof CalculationCache;

        const calculationVars: number[] = [
            data.hepteracts[heptType].BAL,
            data.platonicUpgrades[19],
            data.goldenQuarkUpgrades.singQuarkHepteract.goldenQuarksInvested,
            data.goldenQuarkUpgrades.singQuarkHepteract2.goldenQuarksInvested,
            data.goldenQuarkUpgrades.singQuarkHepteract3.goldenQuarksInvested,
            data.octUpgrades.octeractImprovedQuarkHept.octeractsInvested,
            data.shopUpgrades.improveQuarkHept,
            data.shopUpgrades.improveQuarkHept2,
            data.shopUpgrades.improveQuarkHept3,
            data.shopUpgrades.improveQuarkHept4,
            data.shopUpgrades.improveQuarkHept5,
        ];

        const cached = checkCalculationCache(this.#calculationCache, cacheName, calculationVars);

        if (cached !== undefined) return cached;

        // SynergismOfficial/src/Hepteracts.ts applies the Quark Hepteract's
        // non-polynomial scaling in its effect formula, not in hepteractEffective.
        if (heptType === 'quark') {
            const rawValue = data.hepteracts.quark.BAL;
            updateCalculationCache(this.#calculationCache, cacheName, { value: rawValue, cachedBy: calculationVars });
            return rawValue;
        }

        let effectiveValue = Math.min(data.hepteracts[heptType].BAL, this.#hepteractEffectiveValues[heptType].LIMIT);
        let exponentBoost = 0;

        if (heptType === 'chronos') {
            exponentBoost += 1 / 750 * data.platonicUpgrades[19];
        }

        if (data.hepteracts[heptType].BAL > this.#hepteractEffectiveValues[heptType].LIMIT) {
            effectiveValue *= Math.pow(
                data.hepteracts[heptType].BAL / this.#hepteractEffectiveValues[heptType].LIMIT,
                this.#hepteractEffectiveValues[heptType].DR + exponentBoost
            );
        }

        updateCalculationCache(this.#calculationCache, cacheName, { value: effectiveValue, cachedBy: calculationVars });
        return effectiveValue;
    }

    // =========================
    // ======= Challenge =======
    // =========================

    private createProgressiveAchievements(): Record<ProgressiveAchievements, ProgressiveAchievement> {
        return {
            runeLevel: {
                maxPointValue: 1000,
                pointsAwarded: (cached: number) => {
                    return Math.min(200, Math.floor(cached / 1000)) + Math.min(400, Math.floor(cached / 2500))
                        + Math.min(400, Math.floor(cached / 12500))
                },
                updateValue: () => {
                    if (!this.gameData) return 0;
                    return (Object.keys(this.rune.runes) as RuneKeys[]).reduce((sum, rune) => {
                        return sum + this.rune.getRuneLevelFromEXP(rune, parseGameDataDecimal(this.gameData?.runes[rune]))
                    }, 0)
                },
                useCachedValue: true,
                rewardedAP: 0,
                displayOrder: 1,
                displayCondition: () => (this.gameData?.prestigeCount ?? 0) > 0
            },
            freeRuneLevel: {
                maxPointValue: 500,
                pointsAwarded: (cached: number) => {
                    return Math.min(100, Math.floor(cached / 250)) + Math.min(200, Math.floor(cached / 750))
                        + Math.min(200, Math.floor(cached / 2500))
                },
                updateValue: () => {
                    if (!this.gameData) return 0;
                    return (Object.keys(this.rune.runes) as RuneKeys[]).reduce((sum, rune) => {
                        return sum + this.rune.getRuneFreeLevels(rune)
                    }, 0)
                },
                useCachedValue: true,
                rewardedAP: 0,
                displayOrder: 2,
                displayCondition: () => (this.gameData?.prestigeCount ?? 0) > 0
            },
            quarkUpgrades: {
                maxPointValue: Object.keys(QUARK_UPGRADE_MAX_LEVELS).length * 4,
                pointsAwarded: () => this.calculateQuarkUpgradeAchievementAP(),
                updateValue: () => 0,
                useCachedValue: false,
                rewardedAP: 0,
                displayOrder: 3,
                displayCondition: () => (this.gameData?.reincarnationCount ?? 0) > 0
                    || (this.gameData?.highestSingularityCount ?? 0) > 0
            },
            antMasteries: {
                maxPointValue: 360,
                pointsAwarded: (_cached: number) => {
                    let pointValue = 0
                    if (!this.gameData) return 0;
                    for (let ant = AntProducers.Workers; ant <= LAST_ANT_PRODUCER; ant++) {
                        const highestMastery = this.gameData.ants.masteries[ant]?.highestMastery ?? 0;
                        pointValue += 3 * highestMastery
                        if (highestMastery >= 12) {
                            pointValue += 4
                        }
                    }
                    return pointValue
                },
                updateValue: () => {
                    let numMasteries = 0
                    if (!this.gameData) return 0;
                    for (let ant = AntProducers.Workers; ant <= LAST_ANT_PRODUCER; ant++) {
                        numMasteries += this.gameData.ants.masteries[ant]?.highestMastery ?? 0;
                    }
                    return numMasteries
                },
                useCachedValue: false,
                rewardedAP: 0,
                displayOrder: 3,
                displayCondition: () => this.gameData?.unlocks.generation ?? false
            },
            rebornELO: {
                maxPointValue: 1000,
                pointsAwarded: (_cached: number) => {
                    const leaderboardELO = this.calculateLeaderboardValue(this.gameData?.ants.highestRebornELOEver ?? [])
                    return Math.min(100, Math.floor(leaderboardELO / 100))
                        + Math.min(150, Math.floor(leaderboardELO / 1000))
                        + Math.min(150, Math.floor(leaderboardELO / 9000))
                        + Math.min(200, Math.floor(leaderboardELO / 75000))
                        + Math.min(400, Math.floor(leaderboardELO / 150000))
                },
                updateValue: () => {
                    return this.calculateLeaderboardValue(this.gameData?.ants.highestRebornELOEver ?? [])
                },
                useCachedValue: false,
                rewardedAP: 0,
                displayOrder: 4,
                displayCondition: () => this.gameData?.unlocks.generation ?? false
            },
            singularityCount: {
                maxPointValue: 3600,
                pointsAwarded: (_cached: number) => {
                    const highestSing = this.gameData?.highestSingularityCount ?? 0;
                    return 9 * highestSing
                        + 3 * Math.max(0, highestSing - 100)
                        + 3 * Math.max(0, highestSing - 200)
                },
                updateValue: () => 0,
                useCachedValue: false,
                rewardedAP: 0,
                displayOrder: 6,
                displayCondition: () => (this.gameData?.highestSingularityCount ?? 0) > 0
            },
            ambrosiaCount: {
                maxPointValue: 800,
                pointsAwarded: (cached: number) => {
                    return Math.min(200, Math.floor(cached / 100))
                        + Math.min(200, Math.floor(cached / 10000))
                        + Math.min(400, Math.floor(400 * Math.sqrt(cached / 1e8)))
                },
                updateValue: () => this.gameData?.lifetimeAmbrosia ?? 0,
                useCachedValue: true,
                rewardedAP: 0,
                displayOrder: 10,
                displayCondition: () => (this.gameData?.highestSingularityCount ?? 0) >= 25
            },
            redAmbrosiaCount: {
                maxPointValue: 1000,
                pointsAwarded: (cached: number) => {
                    return Math.min(200, Math.floor(cached / 25))
                        + Math.min(200, Math.floor(cached / 2500))
                        + Math.min(400, Math.floor(400 * cached / 5e6))
                        + Math.min(200, Math.floor(200 * cached / 1.25e7))
                },
                updateValue: () => this.gameData?.lifetimeRedAmbrosia ?? 0,
                useCachedValue: true,
                rewardedAP: 0,
                displayOrder: 11,
                displayCondition: () => (this.gameData?.highestSingularityCount ?? 0) >= 150
            },
            exalts: {
                maxPointValue: this.getCurrentAPFromChallenges,
                pointsAwarded: (_cached: number) => {
                    let pointValue = 0
                    if (!this.gameData) return 0;
                    for (const chal of Object.keys(this.gameData.singularityChallenges) as SingularityChallengeDataKeys[]) {
                        pointValue += this.getSingChalApReward(chal)
                    }
                    return pointValue
                },
                updateValue: () => 0,
                useCachedValue: false,
                rewardedAP: 0,
                displayOrder: 9,
                displayCondition: () => (this.gameData?.highestSingularityCount ?? 0) >= 25
            },
            singularityUpgrades: {
                maxPointValue: this.maxGoldenQuarkUpgradeAP,
                pointsAwarded: (_cached: number) => {
                    let pointValue = 0
                    if (!this.gameData) return 0;
                    for (const upgradeKey of Object.keys(
                        goldenQuarkUpgradeMaxLevels
                    ) as GoldenQuarkUpgradeKey[]) {
                        const maxLevel = goldenQuarkUpgradeMaxLevels[upgradeKey].maxLevel
                        const playerLevel =
                            this.goldenQuark.getGQUpgradeLevel(upgradeKey)

                        if (playerLevel >= maxLevel) {
                            pointValue += 6
                        }
                        const freeCap = dailyFreeLevelCaps[upgradeKey];
                        if (freeCap !== undefined && this.getSavedUpgradeFreeLevel(
                            this.gameData.goldenQuarkUpgrades[upgradeKey]
                        ) >= freeCap) {
                            pointValue += 6;
                        }
                    }
                    return pointValue;
                },
                updateValue: () => 0,
                useCachedValue: false,
                rewardedAP: 0,
                displayOrder: 7,
                displayCondition: () => (this.gameData?.highestSingularityCount ?? 0) > 0
            },
            octeractUpgrades: {
                maxPointValue: this.maxOcteractUpgradeAP,
                pointsAwarded: (_cached: number) => {
                    let pointValue = 0
                    if (!this.gameData) return 0;
                    for (const upgradeKey of Object.keys(octeractUpgradeMaxLevels) as OcteractUpgradeKey[]) {
                        const maxLevel = octeractUpgradeMaxLevels[upgradeKey].maxLevel
                        const playerLevel =
                            this.octeract.getOcteractUpgradeLevel(upgradeKey)
                        if (maxLevel !== -1 && playerLevel >= maxLevel) {
                            pointValue += 8
                        }
                        const freeCap = dailyOcteractFreeLevelCaps[upgradeKey];
                        if (freeCap !== undefined && this.getSavedUpgradeFreeLevel(
                            this.gameData.octUpgrades[upgradeKey]
                        ) >= freeCap) {
                            pointValue += 8;
                        }
                    }
                    return pointValue
                },
                updateValue: () => 0,
                useCachedValue: false,
                rewardedAP: 0,
                displayOrder: 8,
                displayCondition: () => this.goldenQuark.getGQUpgradeLevel('octeractUnlock') > 0
            },
            redAmbrosiaUpgrades: {
                maxPointValue: this.ambrosia.maxRedAmbrosiaUpgradeAP,
                pointsAwarded: () => {
                    let pointValue = 0
                    if (!this.gameData) return 0;
                    for (const upgradeKey of Object.keys(this.ambrosia.redAmbrosiaUpgradeCalculationCollection) as RedAmbrosiaUpgradeKey[]) {
                        const maxLevel = this.ambrosia.redAmbrosiaUpgradeCalculationCollection[upgradeKey].maxLevel
                        const playerLevel = this.ambrosia.calculateRedAmbrosiaUpgradeValue(upgradeKey);
                        if (maxLevel !== -1 && playerLevel >= maxLevel) {
                            pointValue += 10
                        }
                    }
                    return pointValue
                },
                updateValue: () => 0,
                useCachedValue: false,
                rewardedAP: 0,
                displayOrder: 12,
                displayCondition: () => (this.gameData?.highestSingularityCount ?? 0) >= 150
            },
            purpleHoneyUpgrades: {
                maxPointValue: Math.floor(PURPLE_REACTOR_AP_DATA.reduce(
                    (total, upgrade) => total + upgrade.maxLevel * upgrade.perLevelAP + upgrade.maxLevelAP, 0
                )),
                pointsAwarded: () => this.calculatePurpleReactorAchievementAP(),
                updateValue: () => 0,
                useCachedValue: false,
                rewardedAP: 0,
                displayOrder: 14,
                displayCondition: () => (this.gameData?.singularityChallenges?.taxmanLastStand?.completions ?? 0) > 0
            },
            purpleAmbrosiaUpgrades: {
                maxPointValue: 200 + 12 * 12
                    + Object.keys(this.ambrosia.ambrosiaUpgradeCalculationCollection).length * 5,
                pointsAwarded: () => this.calculatePurpleAmbrosiaAchievementAP(),
                updateValue: () => 0,
                useCachedValue: false,
                rewardedAP: 0,
                displayOrder: 15,
                displayCondition: () => (this.gameData?.singularityChallenges?.taxmanLastStand?.completions ?? 0) > 0
            },
            talismanRarities: {
                maxPointValue: this.maxTalismansRarityAP,
                pointsAwarded: (cached: number) => {
                    return 5 * cached
                },
                updateValue: () => {
                    if (!this.gameData) return 0;
                    return (Object.keys(this.gameData.talismans) as TalismanKeys[])
                        .reduce((sum, key) => sum + this.talisman.getTalismanRarity(key), 0);
                },
                useCachedValue: true,
                rewardedAP: 0,
                displayOrder: 5,
                displayCondition: () => this.gameData?.unlocks.rrow2 ?? false
            }
        };
    }

    getSingChalApReward(chal: SingularityChallengeDataKeys): number {
        if (!this.gameData) return 0;

        const chalData = this.singularityChallengeData[chal];
        if (!chalData) return 0;

        const completions =
            this.gameData.singularityChallenges[chal]?.completions ?? 0;

        return chalData.achievementPointValue(completions);
    }

    calculateSingularityReductions(reduce_vals = true, true_base = false) {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = (`SingularityReductions${true_base ? '_TRUE_BASE' : ''}`) as keyof CalculationCache;

        const calculationVars: number[] = [
            data.insideSingularityChallenge ? 1 : 0,
            data.ambrosiaUpgrades.ambrosiaSingReduction2.ambrosiaInvested,
            data.ambrosiaUpgrades.ambrosiaSingReduction2.purpleAmbrosiaInvested ?? 0,
            data.ambrosiaUpgrades.ambrosiaSingReduction1.ambrosiaInvested,
            data.ambrosiaUpgrades.ambrosiaSingReduction1.purpleAmbrosiaInvested ?? 0,
            ...this.quarkShop.getShopLevelDependencies('shopSingularityPenaltyDebuff'),
            true_base ? 1 : 0,
        ];

        const cached = checkCalculationCache(this.#calculationCache, cacheName, calculationVars);

        if (reduce_vals && cached !== undefined) return cached;

        let redu = 0;

        if (!true_base) {
            if (data.insideSingularityChallenge) {
                redu = this.ambrosia.getAmbrosiaUpgradeEffects("ambrosiaSingReduction2").singularityReduction;
            } else {
                redu = this.ambrosia.getAmbrosiaUpgradeEffects("ambrosiaSingReduction1").singularityReduction;
            }
        }

        const vals: HSCalculationComponents = {
            'A Singularity Tenderizer': this.quarkShop.getShopUpgradeEffects(
                'shopSingularityPenaltyDebuff',
                'singularityPenaltyReducers',
                true_base ? 'true_base' : 'normal',
            ) as number,
            [data.insideSingularityChallenge
                ? 'Ambrosia - Exo-Chromatic Kinetic Post-Modulated Singularity Stabilizer Module'
                : 'Ambrosia - Singularity Stabilizer Module']: redu,
        }

        const reduced = Object.values(vals).reduce((a, b) => a + b, 0)

        updateCalculationCache(this.#calculationCache, cacheName, { value: reduced, cachedBy: calculationVars });

        return reduce_vals ? reduced : vals;
    }

    /**
     * The Horseshoe shop upgrade's singularity penalty multiplier (Shop.ts) as if the ambrosia upgrade "Talisman
     * Power" (ambrosiaTalismanBonusRuneLevel) had this many bought levels: it multiplies what the talismans give
     * to the Horseshoe rune, whose level sets that multiplier.
     */
    #horseShoePenaltyWithTalismanUpgrade(talismanUpgradeLevel: number): number {
        const shopLevel = this.quarkShop.getShopLevel('shopHorseShoe');
        let runeLevel = this.rune.getRuneEffectiveLevel('horseShoe');
        // 0: the rune is locked, and stays at 0 whatever the talismans give
        if (runeLevel > 0) {
            const talismanMultiplier = this.talisman.allTalismanRuneBonusStatsSum();
            const fromTalismans = this.talisman.getRuneBonusFromAllTalismans('horseShoe');
            const current = this.ambrosia.getAmbrosiaUpgradeEffects('ambrosiaTalismanBonusRuneLevel').talismanBonusRuneLevel;
            const wanted = this.ambrosia.getAmbrosiaUpgradeEffectsAtLevel('ambrosiaTalismanBonusRuneLevel', talismanUpgradeLevel).talismanBonusRuneLevel;
            if (talismanMultiplier > 0) runeLevel += fromTalismans / talismanMultiplier * (wanted - current);
        }
        return 1 - Math.min(300, runeLevel * shopLevel) / 1000;
    }

    /**
     * @param talismanUpgradeLevel the debuff as if the ambrosia upgrade "Talisman Power" had this many bought
     * levels (#horseShoePenaltyWithTalismanUpgrade). Left out: the save's own level.
     */
    calculateSingularityDebuff(debuff: SingularityDebuffs, singularityCount: number = -1, talismanUpgradeLevel?: number) {
        if (!this.gameData) return 1;
        const data = this.gameData;
        const resolvedSingularityCount = singularityCount === -1 ? data.singularityCount : singularityCount;
        const reduction = this.calculateSingularityReductions(true, false) as number;
        const debuffIndex = [
            'Offering',
            'Obtainium',
            'Salvage',
            'Global Speed',
            'Researches',
            'Ant ELO',
            'Ascension Speed',
            'Cubes',
            'Cube Upgrades',
            'Platonic Costs',
            'Hepteract Costs',
        ].indexOf(debuff);
        const shopPenalty = talismanUpgradeLevel === undefined
            ? this.quarkShop.getShopUpgradeEffects('shopHorseShoe', 'singularityPenaltyMult') as number
            : this.#horseShoePenaltyWithTalismanUpgrade(talismanUpgradeLevel);
        const antiquitiesLevel = this.rune.getRuneLevelFromEXP('antiquities', parseGameDataDecimal(data.runes.antiquities));
        const cacheName = 'SingularityDebuff' as keyof CalculationCache;
        const calculationVars = [
            debuffIndex,
            resolvedSingularityCount,
            reduction,
            shopPenalty,
            antiquitiesLevel,
        ];

        return this.memoizeCalculation<number>(cacheName, calculationVars, () => {
            if (antiquitiesLevel > 0) {
                return debuff === 'Salvage' || debuff === 'Ant ELO' ? 0 : 1;
            }

            const constitutiveSingularityCount = resolvedSingularityCount - reduction;
            if (constitutiveSingularityCount < 1) {
                return debuff === 'Salvage' || debuff === 'Ant ELO' ? 0 : 1;
            }

            const effectiveSingularities = this.calculateEffectiveSingularities(constitutiveSingularityCount);
            let baseDebuffMultiplier = shopPenalty;
            let val;

            if (debuff === 'Offering') {
                const extraMult = Math.pow(1.02, constitutiveSingularityCount)
                val = extraMult * baseDebuffMultiplier * (constitutiveSingularityCount < 150
                    ? 3 * (Math.sqrt(effectiveSingularities) + 1)
                    : Math.pow(effectiveSingularities, 2 / 3) / 400)
            } else if (debuff === 'Salvage') {
                val = -(4 * constitutiveSingularityCount
                    + 4 * Math.max(0, constitutiveSingularityCount - 100)
                    + 4 * Math.max(0, constitutiveSingularityCount - 200)
                    + 3 * Math.max(0, constitutiveSingularityCount - 250)
                    + 3 * Math.max(0, constitutiveSingularityCount - 270)
                    + 2 * Math.max(0, constitutiveSingularityCount - 280))
            } else if (debuff === 'Ant ELO') {
                val = -Math.min(1, 0.001 * constitutiveSingularityCount)
            } else if (debuff === 'Global Speed') {
                val = baseDebuffMultiplier * (1 + Math.sqrt(effectiveSingularities) / 4)
            } else if (debuff === 'Obtainium') {
                const extraMult = Math.pow(1.02, constitutiveSingularityCount)
                val = extraMult * baseDebuffMultiplier * (constitutiveSingularityCount < 150
                    ? 3 * (Math.sqrt(effectiveSingularities) + 1)
                    : Math.pow(effectiveSingularities, 2 / 3) / 400)
            } else if (debuff === 'Researches') {
                val = baseDebuffMultiplier * (1 + Math.sqrt(effectiveSingularities) / 2)
            } else if (debuff === 'Ascension Speed') {
                val = baseDebuffMultiplier * (constitutiveSingularityCount < 150
                    ? 1 + Math.sqrt(effectiveSingularities) / 5
                    : 1 + Math.pow(effectiveSingularities, 0.75) / 10000)
            } else if (debuff === 'Cubes') {
                const extraMult = constitutiveSingularityCount > 100
                    ? 2 * Math.pow(1.03, constitutiveSingularityCount - 100)
                    : 2;

                val = baseDebuffMultiplier * (constitutiveSingularityCount < 150
                    ? 3 * (1 + (Math.sqrt(effectiveSingularities) * extraMult) / 4)
                    : 1 + (Math.pow(effectiveSingularities, 0.75) * extraMult) / 1000)
            } else if (debuff === 'Platonic Costs') {
                val = baseDebuffMultiplier * (constitutiveSingularityCount > 36
                    ? 1 + Math.pow(effectiveSingularities, 3 / 10) / 12
                    : 1)
            } else if (debuff === 'Hepteract Costs') {
                val = baseDebuffMultiplier * (constitutiveSingularityCount > 50
                    ? 1 + Math.pow(effectiveSingularities, 11 / 50) / 25
                    : 1)
            } else {
                val = baseDebuffMultiplier * Math.cbrt(effectiveSingularities + 1)
            }

            return val;
        });
    }


    // =============================
    // ======== Progression ========
    // =============================

    getPrestigePointGain = (): Decimal => {
        if (!this.gameData) return new Decimal(0)

        let prestigePow = 0.5 + (this.gameData.challengecompletions?.[5] ?? 0) / 100
        if (this.gameData.currentChallenge.transcension === 5) {
            prestigePow = 0.01
        }
        if (this.gameData.currentChallenge.reincarnation === 10) {
            prestigePow = 1e-4
        }
        prestigePow *= this.corruption.getChallenge15CorruptionEffect('deflation')

        let gain = Decimal.floor(
            Decimal.pow(
                parseGameDataDecimal(this.gameData?.coinsThisPrestige).dividedBy(1e12),
                prestigePow
            )
        )

        if (
            (this.gameData.upgrades?.[16] ?? 0) > 0.5
            && this.gameData.currentChallenge.transcension !== 5
            && this.gameData.currentChallenge.reincarnation !== 10
        ) {
            gain = gain.times(
                Decimal.min(
                    Decimal.pow(10, new Decimal('1e33')),
                    Decimal.pow(this.accelerator.getAcceleratorEffect(), (1 / 3) * this.corruption.getChallenge15CorruptionEffect('deflation'))
                )
            )
        }

        return gain
    }

    getTranscendPointGain = (): Decimal => {
        if (!this.gameData) return new Decimal(0)

        let transcendPow = 0.03
        if (this.gameData.currentChallenge.reincarnation === 10) {
            transcendPow = 0.001
        }

        let gain = Decimal.floor(
            Decimal.pow(
                parseGameDataDecimal(this.gameData?.coinsThisTranscension).dividedBy(1e100),
                transcendPow
            )
        )

        if (
            (this.gameData.upgrades?.[44] ?? 0) > 0.5
            && this.gameData.currentChallenge.transcension !== 5
            && this.gameData.currentChallenge.reincarnation !== 10
        ) {
            gain = gain.times(Decimal.min(1e6, Decimal.pow(1.01, this.gameData.transcendCount ?? 0)))
        }

        return gain
    }

    getReincarnationPointGain = (): Decimal => {
        if (!this.gameData) return new Decimal(0)

        let gain = Decimal.floor(
            Decimal.pow(
                parseGameDataDecimal(this.gameData?.transcendShards).dividedBy(1e300),
                0.01
            )
        )

        if (this.gameData.currentChallenge.reincarnation !== 0) {
            gain = Decimal.pow(gain, 0.01)
        }

        gain = gain.times(Number(this.achievement.AchRewards.particleGain()))
        if ((this.gameData.upgrades?.[65] ?? 0) > 0.5) {
            gain = gain.times(5)
        }
        if (this.gameData.currentChallenge.ascension === 12) {
            gain = new Decimal(0)
        }

        return gain
    }

    /** Mirrors quarkUpgradeAP() from SynergismOfficial/src/Shop.ts. */
    calculateQuarkUpgradeAchievementAP(): number {
        if (!this.gameData) return 0;
        return Object.entries(QUARK_UPGRADE_MAX_LEVELS).reduce((total, [key, maxLevel]) => {
            const level = Number((this.gameData?.shopUpgrades as unknown as Record<string, unknown>)[key] ?? 0);
            return total + (level === maxLevel ? 4 : 0);
        }, 0);
    }

    /** Mirrors calculatePurpleReactorAP() from SynergismOfficial/src/Purple.ts. */
    calculatePurpleReactorAchievementAP(): number {
        if (!this.gameData) return 0;

        let totalAP = 0;
        for (const upgrade of PURPLE_REACTOR_AP_DATA) {
            const invested = Number((this.gameData.purpleReactorUpgrades as Record<string, unknown> | undefined)?.[upgrade.key] ?? 0);
            if (!Number.isFinite(invested) || invested <= 0) continue;

            // Savedata stores cumulative investment, while the game stores the
            // current level. Reconstruct the level using the same cost formula.
            let low = 0;
            let high = upgrade.maxLevel;
            while (low < high) {
                const middle = low + Math.ceil((high - low) / 2);
                if (upgrade.costFormula(middle) <= invested + 0.001) low = middle;
                else high = middle - 1;
            }

            totalAP += low * upgrade.perLevelAP;
            if (low >= upgrade.maxLevel) totalAP += upgrade.maxLevelAP;
        }
        return Math.floor(totalAP);
    }

    /** Mirrors the purpleAmbrosiaUpgrades achievement in SynergismOfficial/src/Achievements.ts. */
    calculatePurpleAmbrosiaAchievementAP(): number {
        if (!this.gameData) return 0;

        let totalAP = 0;

        // Synthesis upgrades use a linear Purple Ambrosia investment for their
        // level; AP is awarded in the same intervals as Synthesis.ts.
        const synthesisAP = [
            ['redAmbrosiaReduction', 500, 50, 5],
            ['purpleHoneyReduction', 100, 10, 5],
            ['subatomicShavings', 100, 10, 5],
            ['exceptionalLieGroup', 30, 3, 5],
        ] as const;
        const synthesis = (this.gameData as unknown as { synthesisUpgrades?: Record<string, Record<string, number>> }).synthesisUpgrades;
        const purpleAmbrosiaCostPerLevel: Record<string, number> = {
            redAmbrosiaReduction: 1,
            purpleHoneyReduction: 5,
            subatomicShavings: 20,
            exceptionalLieGroup: 100,
        };
        for (const [key, maxLevel, levelsPerAP, apPerInterval] of synthesisAP) {
            const invested = Number(synthesis?.[key]?.purpleAmbrosia ?? 0);
            const level = Math.min(maxLevel, Math.max(0, Math.floor(invested / purpleAmbrosiaCostPerLevel[key])));
            totalAP += Math.floor(level / levelsPerAP) * apPerInterval;
        }

        const purpleZodiacMaxLevels = {
            aries: 25, taurus: 10, gemini: 10, cancer: 10, leo: 25, virgo: 15,
            libra: 1, scorpio: 10, sagittarius: 11, capricorn: 11, aquarius: 1, pisces: 1,
        } as const;
        for (const [key, maxLevel] of Object.entries(purpleZodiacMaxLevels)) {
            if (this.purple.getPurpleAmbrosiaUpgradeLevel(key as 'aries' | 'taurus' | 'gemini' | 'cancer' | 'leo' | 'virgo' | 'libra' | 'scorpio' | 'sagittarius' | 'capricorn' | 'aquarius' | 'pisces') >= maxLevel) {
                totalAP += 12;
            }
        }

        // Purple enchantments are worth 5 AP when their official max level is reached.
        for (const key of Object.keys(this.ambrosia.ambrosiaUpgradeCalculationCollection) as AmbrosiaUpgradeNames[]) {
            const level = this.ambrosia.calculatePurpleAmbrosiaEnchantmentLevel(key);
            const maxLevel = this.ambrosia.getPurpleAmbrosiaEnchantmentMaxLevel(key);
            if (maxLevel > 0 && level >= maxLevel) totalAP += 5;
        }
        return totalAP;
    }

    /**
     * Mirrors getSynthesisRedAmbrosiaCost / getSynthesisPurpleHoneyCost in
     * SynergismOfficial/src/Synthesis.ts: the Red Ambrosia and Purple Honey
     * spent to craft one Purple Ambrosia.
     */
    calculatePurpleAmbrosiaCraftCosts(): { craftRedAmbrosiaCost: number; craftPurpleHoneyCost: number } {
        const synthesis = (this.gameData as unknown as { synthesisUpgrades?: Record<string, Record<string, number>> } | undefined)?.synthesisUpgrades;
        // A synthesis level is the highest level whose linear cumulative cost
        // fits every invested resource.
        const level = (key: string, maxLevel: number, costPerLevel: Record<string, number>): number => {
            const affordable = Object.entries(costPerLevel).map(([resource, cost]) =>
                Math.floor(Number(synthesis?.[key]?.[resource] ?? 0) / cost));
            return Math.min(maxLevel, Math.max(0, Math.min(...affordable)));
        };
        const redReduction = level('redAmbrosiaReduction', 500, { purpleAmbrosia: 1, redAmbrosia: 1_250 });
        const honeyReduction = level('purpleHoneyReduction', 100, { purpleAmbrosia: 5, purpleHoney: 2_500 });
        const discount = Number(this.talisman.getTalismanEffects('purpleGem').purpleAmbrosiaDiscount ?? 1)
            * Number(this.getSingularityChallengeEffect('barDependence', 'purpleAmbrosiaCostReduction') ?? 1);

        return {
            craftRedAmbrosiaCost: (2_500 - redReduction) * discount,
            craftPurpleHoneyCost: (500 - honeyReduction) * discount,
        };
    }

    /**
     * Cached until the next clearCache(): about 0.1 ms, and an ambrosia rate refresh asks for it 8 times
     * (luck, red luck, red speed, purple honey…). Everything it reads comes in through the _update* methods,
     * which all clear the cache.
     */
    calculateSynergismLevel() {
        if (!this.gameData) return 0;
        if (this.#synergismLevel !== undefined) return this.#synergismLevel;
        const data = this.gameData;

        let achievementPoints = 0;

        achievementPoints += this.achievement.achievements.reduce((sum, ach, index) => {
            return sum + (data.achievements[index] ? ach.pointValue : 0)
        }, 0)

        for (const k of Object.keys(this.progressiveAchievements) as ProgressiveAchievements[]) {
            const savedValue = data.progressiveAchievements[k] ?? 0;
            const effectiveValue = k === 'talismanRarities' && savedValue === 0
                ? this.talisman.calculateTalismanRarityTotal()
                : savedValue;
            achievementPoints += this.progressiveAchievements[k].pointsAwarded(effectiveValue);
        }

        let level: number;
        if (achievementPoints < 2500) {
            level = Math.floor(achievementPoints / 50)
        } else {
            level = 50 + Math.floor((achievementPoints - 2500) / 100)
        }

        this.#synergismLevel = level;
        return level
    }

    calculateSumOfExaltCompletions() {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'SumOfExaltCompletions' as keyof CalculationCache;

        const calculationVars: number[] = [
            ...(Object.values(data.singularityChallenges) as SingularityChallengeStatus[]).map((c) => c.completions)
        ]

        const cached = checkCalculationCache(this.#calculationCache, cacheName, calculationVars);

        if (cached !== undefined) return cached;

        let sum = 0

        for (const challenge of Object.values(data.singularityChallenges)) {
            sum += challenge.completions
        }

        const reduced = sum;

        updateCalculationCache(this.#calculationCache, cacheName, { value: reduced, cachedBy: calculationVars });

        return reduced;
    }

    calculateLimitedAscensionsDebuff() {
        if (!this.gameData) return 0;
        const data = this.gameData;
        if (!data.singularityChallenges.limitedAscensions.enabled)
            return 1;

        const ascensionLimit = Math.max(
            15 - 2 * data.singularityChallenges.limitedAscensions.completions,
            0,
        );
        let exponent = data.ascensionCount - ascensionLimit;

        exponent = Math.max(0, exponent)
        const val = Math.pow(2, exponent);

        return val;
    }

    calculateEffectiveSingularities(singularityCount: number = -1): number {
        if (!this.gameData) return 0;
        const data = this.gameData;

        const cacheName = 'EffectiveSingularities' as keyof CalculationCache;

        const actualSingularityCount = singularityCount === -1 ? data.singularityCount : singularityCount;

        const calculationVars: number[] = [
            actualSingularityCount,
            data.insideSingularityChallenge ? 1 : 0,
            data.singularityChallenges.noOcteracts.completions
        ];

        const cached = checkCalculationCache(this.#calculationCache, cacheName, calculationVars);

        if (cached !== undefined) return cached;

        let effectiveSingularities = actualSingularityCount;

        effectiveSingularities *= Math.min(4.75, (0.75 * actualSingularityCount) / 10 + 1)

        if (data.insideSingularityChallenge) {
            if (data.singularityChallenges.noOcteracts.enabled) {
                effectiveSingularities *= Math.pow(data.singularityChallenges.noOcteracts.completions + 1, 3);
            }

        }

        if (actualSingularityCount > 10) {
            effectiveSingularities *= 1.5;
            effectiveSingularities *= Math.min(4, (1.25 * actualSingularityCount) / 10 - 0.25);
        }

        if (actualSingularityCount > 25) {
            effectiveSingularities *= 2.5;
            effectiveSingularities *= Math.min(6, (1.5 * actualSingularityCount) / 25 - 0.5);
        }

        if (actualSingularityCount > 36) {
            effectiveSingularities *= 4;
            effectiveSingularities *= Math.min(5, actualSingularityCount / 18 - 1);
            effectiveSingularities *= Math.pow(1.1, Math.min(actualSingularityCount - 36, 64));
        }

        if (actualSingularityCount > 50) {
            effectiveSingularities *= 5;
            effectiveSingularities *= Math.min(8, (2 * actualSingularityCount) / 50 - 1);
            effectiveSingularities *= Math.pow(1.1, Math.min(actualSingularityCount - 50, 50));
        }

        if (actualSingularityCount > 100) {
            effectiveSingularities *= 2;
            effectiveSingularities *= actualSingularityCount / 25;
            effectiveSingularities *= Math.pow(1.1, actualSingularityCount - 100);
        }

        if (actualSingularityCount > 150) {
            effectiveSingularities *= 2;
            effectiveSingularities *= Math.pow(1.05, actualSingularityCount - 150);
        }

        if (actualSingularityCount > 200) {
            effectiveSingularities *= 1.5;
            effectiveSingularities *= Math.pow(1.275, actualSingularityCount - 200);
        }

        if (actualSingularityCount > 215) {
            effectiveSingularities *= 1.25;
            effectiveSingularities *= Math.pow(1.2, actualSingularityCount - 215);
        }

        if (actualSingularityCount > 230) {
            effectiveSingularities *= 2;
        }

        if (actualSingularityCount > 269) {
            effectiveSingularities *= 3;
            effectiveSingularities *= Math.pow(3, actualSingularityCount - 269);
        }

        updateCalculationCache(this.#calculationCache, cacheName, { value: effectiveSingularities, cachedBy: calculationVars });

        return effectiveSingularities;
    }

    calculateAscensionSpread(reduce_vals = true, mode: CalculationMode = 'normal') {
        if (!this.gameData) return 0;
        const vals: HSCalculationComponents = {
            'A hecking good Ascension speedup!': this.goldenQuark.getGQUpgradeEffect('singAscensionSpeed', 'exponentSpread'),
            'Ascended Ascension Speedup!': this.goldenQuark.getGQUpgradeEffect('singAscensionSpeed2', 'exponentSpread'),
            'Chronometer INF Quark Upgrade': this.quarkShop.getShopUpgradeEffects('chronometerInfinity', 'exponentSpread', mode) as number,
        }

        const reduced = Object.values(vals).reduce((a, b) => a + b, 0);

        return reduce_vals ? reduced : vals;
    }

    calculateChallenge15Reward(rewardName: keyof typeof challenge15Rewards) {
        if (!this.gameData) {
            HSLogger.errorOnce(`<red>calculateChallenge15Reward() GAMEDATA WAS NULL</red>`, this.context);
            return 0;
        }

        const exponent = this.gameData.challenge15Exponent ?? 0;
        const rewardIndex = (Object.keys(challenge15Rewards) as (keyof typeof challenge15Rewards)[]).indexOf(rewardName);
        const cacheName = 'Challenge15Reward' as keyof CalculationCache;
        const calculationVars = [exponent, rewardIndex];
        const cached = checkCalculationCache(this.#calculationCache, cacheName, calculationVars);
        if (cached !== undefined) {
            return cached;
        }

        const reward = challenge15Rewards[rewardName];
        const result = exponent === 0 || exponent < reward.requirement
            ? reward.baseValue
            : c15Functions[rewardName](exponent);

        updateCalculationCache(this.#calculationCache, cacheName, { value: result, cachedBy: calculationVars });
        return result;
    }

    // calculateCubeBankSources in SynergismOfficial/src/Calculate.ts, with the line names of cubeBankStats in Statistics.ts
    calculateCubeBank(reduce_vals = true): number | HSCalculationComponents {
        if (!this.gameData) return 0;
        const data = this.gameData;

        const transcensionPerCompletion = 1 + 0.05 * (data.cubeUpgrades[56] ?? 0);
        let transcensionAmount = 0;
        for (const { from, to, weight } of TRANSCENSION_CUBE_BANK_TIERS) {
            for (let i = 1; i <= 5; i++) {
                transcensionAmount += Math.max(0, Math.min(data.challengecompletions[i] ?? 0, to) - from + 1) * weight * transcensionPerCompletion;
            }
        }

        let reincarnationCompletions = 0;
        for (let i = 6; i <= 9; i++) {
            reincarnationCompletions += data.challengecompletions[i] ?? 0;
        }

        const vals: HSCalculationComponents = {
            'Challenges 1-5': transcensionAmount,
            'Challenges 6-9': 10 * reincarnationCompletions,
            'Ants': this.antUpgrade.getAntUpgradeEffectValue(AntUpgrades.AscensionScore, 'cubesBanked'),
            'Cube Upgrades 3x1, 4x1, 5x1': 15 * (data.cubeUpgrades[21] ?? 0) + 20 * (data.cubeUpgrades[31] ?? 0) + 25 * (data.cubeUpgrades[41] ?? 0),
            'Finite Descent Rune': Number(this.rune.getRuneEffects('finiteDescent').cubesBanked ?? 0),
            'Achievements': Number(this.achievement.AchRewards['cubesBanked']()),
            'Golden Quark Upgrade - Advanced Pack': this.goldenQuark.getGQUpgradeEffect('advancedPack', 'cubesBanked'),
        };
        const challengeTen = Math.pow(1.02 + 0.005 * (data.cubeUpgrades[39] ?? 0), data.challengecompletions[10] ?? 0);

        if (!reduce_vals) return { ...vals, 'Challenge 10': challengeTen };
        return Object.values(vals).reduce((a, b) => a + b, 0) * challengeTen;
    }

    /** High-Scoring Statue's multiplier for a cube type (calculateCubePlatonicBlessing in SynergismOfficial/src/PlatonicCubes.ts). */
    calculateCubePlatonicBlessing(cube: CorruptionCubeType): number {
        if (!this.gameData) return 1;
        const { power, normalization } = HIGH_SCORING_STATUE_SCALING[cube];
        const blessings = this.gameData.platonicBlessings.scoreBonus ?? 0;
        const softcapped = highScoringStatueBase(Math.min(blessings, HIGH_SCORING_STATUE_SOFTCAP));
        const excess = highScoringStatueBase(Math.max(blessings, HIGH_SCORING_STATUE_SOFTCAP)) / highScoringStatueBase(HIGH_SCORING_STATUE_SOFTCAP);
        return Math.pow(Math.max(1, softcapped * Math.sqrt(excess) / highScoringStatueBase(normalization)), power);
    }

    /**
     * The first lines of a cube type's multiplier, the ones the corruption level drives
     * (corruptionCubeStatLines in SynergismOfficial/src/Statistics.ts). The other multipliers are not modeled.
     * level: a corruption level before its free levels, or -1 for the current ascension's (0 inside an ascension challenge).
     */
    calculateCubeGainBase(reduce_vals = true, cube: CorruptionCubeType = 'cubes', level = -1): number | HSCalculationComponents {
        if (!this.gameData) return 0;
        const effectiveLevel = level < 0
            ? this.corruption.getAscensionEffectiveCorruptionLevel()
            : this.corruption.getEffectiveCorruptionLevel(level);

        const vals: HSCalculationComponents = {
            'Cube Bank': this.calculateCubeBank() as number,
            'Base Multiplier': this.corruption.getCorruptionCubeBase(cube),
            'Corruption (per Cube Bank point)': this.corruption.isCorruptionCubeUnlocked(effectiveLevel, cube)
                ? this.corruption.getCorruptionCubeRate(cube, effectiveLevel)
                : 0,
            'Challenge 15 Reward': this.calculateChallenge15Reward(CHALLENGE15_CUBE_REWARDS[cube]),
            'Platonic Blessing - High-Scoring Statue': this.calculateCubePlatonicBlessing(cube),
        };

        return reduce_vals ? Object.values(vals).reduce((a, b) => a * b, 1) : vals;
    }

    calculateRawAscensionSpeedMult(reduce_vals = true, mode: CalculationMode = 'normal') {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = (`RawAscensionSpeedMult${mode === 'true_base' ? '_TRUE_BASE' : mode === 'non_ambrosia' ? '_NO_AMB' : ''}`) as keyof CalculationCache;

        const cube59 = data.cubeUpgrades[59] ?? 0;

        const calculationVars: number[] = [
            data.shopUpgrades.chronometer,
            data.shopUpgrades.chronometer2,
            data.shopUpgrades.chronometer3,
            data.achievements[262],
            data.achievements[263],
            data.platonicUpgrades[15],
            data.singularityCount,
            data.shopUpgrades.chronometerZ,
            data.octUpgrades.octeractImprovedAscensionSpeed.octeractsInvested,
            data.octUpgrades.octeractImprovedAscensionSpeed2.octeractsInvested,
            data.singularityChallenges.limitedAscensions.completions,
            data.singularityChallenges.limitedTime.completions,
            data.shopUpgrades.shopChronometerS,
            cube59,
            data.insideSingularityChallenge ? 1 : 0,
            data.ambrosiaUpgrades.ambrosiaBrickOfLead.ambrosiaInvested,
            data.ambrosiaUpgrades.ambrosiaBrickOfLead.purpleAmbrosiaInvested ?? 0,
            data.purpleReactorUpgrades?.lifetimeHoneyAscensionSpeed ?? 0,
            data.purpleReactor?.lifetimePurpleHoney ?? 0,
            mode === 'true_base' ? 1 : mode === 'non_ambrosia' ? 2 : 0,
        ];

        const cached = checkCalculationCache(this.#calculationCache, cacheName, calculationVars);

        if (reduce_vals && cached !== undefined) return cached;

        const vals: HSCalculationComponents = {
            'Ants - Mortuus Iterum Formicidae': this.antUpgrade.getAntUpgradeEffectValue(AntUpgrades.Mortuus2, 'ascensionSpeed'),
            'Polymath Talisman - Inscription Bonus': this.talisman.getTalismanEffects('polymath').ascensionSpeedBonus,
            'Chronometer Quark Upgrade': this.quarkShop.getShopUpgradeEffects('chronometer', 'ascensionSpeedMult', mode) as number,
            'Chronometer 2 Quark Upgrade': this.quarkShop.getShopUpgradeEffects('chronometer2', 'ascensionSpeedMult', mode) as number,
            'Chronometer 3 Quark Upgrade': this.quarkShop.getShopUpgradeEffects('chronometer3', 'ascensionSpeedMult', mode) as number,
            'Chronos Hepteract Bonus': 1 + (0.6 / 1000) * this.calculateHepteractEffective('chronos'),
            'Platonic OMEGA Bonus': 1 + 0.01 * (data.currentChallenge.ascension === 15 ? 20 : Math.min(20, this.corruption.getActiveEffectiveCorruptionLevel())) * data.platonicUpgrades[15],
            'Challenge 15 Reward': this.calculateChallenge15Reward('ascensionSpeed'),
            'Cookie Upgrade 9 Bonus': 1 + (1 / 400) * cube59,
            'Intermediate Pack Bonus': this.goldenQuark.getGQUpgradeEffect('intermediatePack', 'ascensionSpeedMult'),
            'Chronometer Z Shop Upgrade': this.quarkShop.getShopUpgradeEffects('chronometerZ', 'ascensionSpeedMult', mode) as number,
            'Abstract Photokinetics': this.octeract.getOcteractUpgradeEffect('octeractImprovedAscensionSpeed', 'ascensionSpeedMult'),
            'Abstract Exokinetics': this.octeract.getOcteractUpgradeEffect('octeractImprovedAscensionSpeed2', 'ascensionSpeedMult'),
            'Chronometer INF Quark Upgrade': this.quarkShop.getShopUpgradeEffects('chronometerInfinity', 'ascensionSpeedMult', mode) as number,
            'EXALT - Twenty Ascensions': Math.pow(
                this.getSingularityChallengeEffect('limitedAscensions', 'ascensionSpeedMult'),
                1 + Math.max(0, Math.floor(Math.log10(data.ascensionCount))),
            ),
            'The Jack of all Trades': this.quarkShop.getShopUpgradeEffects('shopPanthema', 'ascensionSpeedMult', mode) as number,
            'EXALT - Limited Time': this.getSingularityChallengeEffect('limitedTime', 'ascensionSpeed'),
            'Chronometer S Quark Upgrade': this.quarkShop.getShopUpgradeEffects('shopChronometerS', 'ascensionSpeedMult') as number,
            'Limited Ascensions - Too Many Ascensions': 1 / this.calculateLimitedAscensionsDebuff(),
            'Ambrosia - The Brick of Lead': this.ambrosia.getAmbrosiaUpgradeEffects('ambrosiaBrickOfLead', mode).ascensionSpeedMult,
            'Singularity Debuff': 1 / this.calculateSingularityDebuff('Ascension Speed'),
            'Event Bonus': 1 + this.calculateEventSourceBuff(EventBuffType.AscensionSpeed),
            'Lifetime Purple Honey Power': this.purple.getPurpleReactorUpgradeEffects('lifetimeHoneyAscensionSpeed', 'ascensionSpeedMultiplier'),
        }

        const reduced = Object.values(vals).reduce((a, b) => a * b, 1)

        updateCalculationCache(this.#calculationCache, cacheName, { value: reduced, cachedBy: calculationVars });

        return reduce_vals ? reduced : vals;
    }

    calculateAscensionSpeedMult(mode: CalculationMode = 'normal') {
        let base = (this.calculateRawAscensionSpeedMult(true, mode) as number)

        const exponentSpread = (this.calculateAscensionSpread(true, mode) as number)

        if (base < 1) {
            base = Math.pow(base, 1 - exponentSpread)
        } else {
            base = Math.pow(base, 1 + exponentSpread)
        }

        return base;
    }


    // =============================
    // ======== Rune Heater ========
    // =============================

    firstFiveEffectiveRuneLevelMult = () => {
        return this.firstFiveRuneEffectivenessStats.reduce((x, y) => x * y.stat(), 1)
    }

    /** Mirrors campaignTokenBonuses.rune6 in SynergismOfficial/src/Campaign.ts: 500 tokens and Infinite Ascent unlocked. */
    calculateCampaignRune6Bonus() {
        const cacheName = 'CampaignRune6Bonus' as keyof CalculationCache;

        const tokens = this.campaignData?.tokens ?? 0;
        const runeUnlocked = Boolean(this.quarkShop.getShopUpgradeEffects('infiniteAscent', 'runeUnlocked'));

        const calculationVars: number[] = [
            tokens,
            runeUnlocked ? 1 : 0
        ]

        const cached = checkCalculationCache(this.#calculationCache, cacheName, calculationVars);

        if (cached !== undefined) return cached;

        if (!runeUnlocked) {
            updateCalculationCache(this.#calculationCache, cacheName, { value: 0, cachedBy: calculationVars });
            return 0;
        }

        const thresholdReqs = [500, 750, 1000, 1250, 1500, 1750, 2000, 3000, 4000, 6000, 8000, 10000]
        for (let i = 0; i < thresholdReqs.length; i++) {
            if (tokens < thresholdReqs[i]) {
                const reduced = i;
                updateCalculationCache(this.#calculationCache, cacheName, { value: reduced, cachedBy: calculationVars });
                return reduced;
            }
        }
        const reduced = 12;
        updateCalculationCache(this.#calculationCache, cacheName, { value: reduced, cachedBy: calculationVars });
        return reduced;
    }


    // =============================
    // ========= Offering ==========
    // =============================

    calculateOfferingPotionBaseOfferings = () => {
        const amount = findInsertionIndex(this.gameData?.shopPotionsConsumed?.offering ?? 0, offeringPotionThresholds)
        return {
            amount,
            toNext: amount < offeringPotionThresholds.length
                ? offeringPotionThresholds[amount] - (this.gameData?.shopPotionsConsumed?.offering ?? 0)
                : Number.POSITIVE_INFINITY
        }
    }

    calculateObtainiumPotionBaseObtainium = () => {
        const amount = findInsertionIndex(this.gameData?.shopPotionsConsumed?.obtainium ?? 0, obtainiumPotionThresholds)
        return {
            amount,
            toNext: amount < obtainiumPotionThresholds.length
                ? obtainiumPotionThresholds[amount] - (this.gameData?.shopPotionsConsumed?.obtainium ?? 0)
                : Number.POSITIVE_INFINITY
        }
    }

    calculateHypercubeBlessingMultiplierPlatonicBlessing = () => {
        const DR = 1 / 16
        const effectPerBlessing = 1 / 1e4
        const limit = 1e4
        if ((this.gameData?.platonicBlessings.hypercubeBonus ?? 0) < limit) {
            return 1 + effectPerBlessing * (this.gameData?.platonicBlessings.hypercubeBonus ?? 0)
        } else {
            const limitMult = Math.pow(limit, 1 - DR)
            return 1 + effectPerBlessing * limitMult * Math.pow((this.gameData?.platonicBlessings.hypercubeBonus ?? 0), DR)
        }
    }


    // =============================
    // =========== Quark ===========
    // =============================

    maxGoldenQuarkUpgradeAP = 6 * (
        Object.keys(goldenQuarkUpgradeMaxLevels).length + Object.keys(dailyFreeLevelCaps).length
    )

    maxOcteractUpgradeAP = Object.values(octeractUpgradeMaxLevels).reduce((acc: number, upgrade) => {
        if (upgrade.maxLevel === -1) {
            return acc
        }
        return acc + 8
    }, 0) + 8 * Object.keys(dailyOcteractFreeLevelCaps).length

    getOcteractUpgradeEffect = (upgradeKey: OcteractUpgradeKey, effectKey?: string): number => {
        return this.octeract.getOcteractUpgradeEffect(upgradeKey, effectKey)
    }

    getGQUpgradeEffect(upgradeKey: GoldenQuarkUpgradeKey, effectKey?: string): number {
        return this.goldenQuark.getGQUpgradeEffect(upgradeKey, effectKey)
    }

    firstFiveFreeLevels = () => {
        return this.antUpgrade.getAntUpgradeEffectValue(AntUpgrades.FreeRunes, 'freeRuneLevel')
            + 7 * Math.min((this.gameData?.constantUpgrades[7] ?? 0), 1000);
    }

    freeInfinityLevels = (mode: CalculationMode = 'normal') => {
        return this.calculateAllShopTablets(true, mode)
        + this.getSingularityChallengeEffect('noQuarkUpgrades', 'freeInfinityLevels')
        + this.rune.getRuneEffects('topHat').freeInfinityLevels;
    }

    calculateAllShopTablets(reduce_vals?: true, mode?: CalculationMode): number;
    calculateAllShopTablets(reduce_vals: false, mode?: CalculationMode): HSCalculationComponents;
    calculateAllShopTablets(reduce_vals: boolean, mode?: CalculationMode): number | HSCalculationComponents;
    calculateAllShopTablets(reduce_vals = true, mode: CalculationMode = 'normal') {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = (`AllShopTablets${mode === 'true_base' ? '_TRUE_BASE' : mode === 'non_ambrosia' ? '_NO_AMB' : ''}`) as keyof CalculationCache;

        const calculationVars: number[] = [
            data.highestSingularityCount,
            data.goldenQuarkUpgrades.singInfiniteShopUpgrades.goldenQuarksInvested,
            data.octUpgrades.octeractInfiniteShopUpgrades.octeractsInvested,
            data.shopUpgrades.shopInfiniteShopUpgrades,
            data.redAmbrosiaUpgrades.infiniteShopUpgrades,
            data.singularityChallenges.sadisticPrequel.enabled ? 1 : 0,
            data.singularityChallenges.noQuarkUpgrades.enabled ? 1 : 0,
            mode === 'true_base' ? 1 : mode === 'non_ambrosia' ? 2 : 0,
            ...(Object.values(data.singularityChallenges) as SingularityChallengeStatus[]).map((c) => c.completions),
            ...(data.singularityChallenges.noAmbrosiaUpgrades.enabled
                ? []
                : [
                    data.redAmbrosiaUpgrades.freeLevelsRow4,
                    data.redAmbrosiaUpgrades.freeLevelsRow5,
                    data.ambrosiaUpgrades.ambrosiaInfiniteShopUpgrades1.ambrosiaInvested,
                    data.ambrosiaUpgrades.ambrosiaInfiniteShopUpgrades1.purpleAmbrosiaInvested ?? 0,
                    data.ambrosiaUpgrades.ambrosiaInfiniteShopUpgrades2.ambrosiaInvested,
                    data.ambrosiaUpgrades.ambrosiaInfiniteShopUpgrades2.purpleAmbrosiaInvested ?? 0,
                    data.ambrosiaUpgrades.ambrosiaInfiniteShopUpgrades3?.ambrosiaInvested ?? 0,
                    data.ambrosiaUpgrades.ambrosiaInfiniteShopUpgrades3?.purpleAmbrosiaInvested ?? 0,
                ]),
        ];

        const cached = checkCalculationCache(this.#calculationCache, cacheName, calculationVars);

        if (reduce_vals && cached !== undefined) return cached;

        const dunno = () => {
            if (data.highestSingularityCount >= 280) {
                return Math.floor(0.8 * (data.highestSingularityCount - 200))
            } else if (data.highestSingularityCount >= 250) {
                return Math.floor(0.5 * (data.highestSingularityCount - 200))
            } else {
                return 0
            }
        }

        const vals: HSCalculationComponents = {
            'Red Vouchers [Red Ambrosia]': this.ambrosia.getRedAmbrosiaUpgradeEffects('infiniteShopUpgrades').freeLevels,
            'Orange Vouchers [Singularity Perk]': dunno(),
            'Yellow Vouchers [Golden Quarks]': this.goldenQuark.getGQUpgradeEffect('singInfiniteShopUpgrades', 'infinityVouchers'),
            'Green Vouchers [Octeracts]': this.octeract.getOcteractUpgradeEffect('octeractInfiniteShopUpgrades', 'infinityVouchers'),
            'Blue Vouchers [Quarks]': this.quarkShop.getShopUpgradeEffects('shopInfiniteShopUpgrades', 'infiniteVouchers') as number,
            ...(data.singularityChallenges.noAmbrosiaUpgrades.enabled
                ? {}
                : {
                    'Indigo Vouchers [Ambrosia 1]': +this.ambrosia.getAmbrosiaUpgradeEffects('ambrosiaInfiniteShopUpgrades1', mode).freeLevels,
                    'Violet Vouchers [Ambrosia 2]': +this.ambrosia.getAmbrosiaUpgradeEffects('ambrosiaInfiniteShopUpgrades2', mode).freeLevels,
                    'Periwinkle Vouchers [Ambrosia 3]': +this.ambrosia.getAmbrosiaUpgradeEffects('ambrosiaInfiniteShopUpgrades3', mode).freeLevels,
                }),
        }

        const reduced = Object.values(vals).reduce((a, b) => a + b, 0);

        updateCalculationCache(this.#calculationCache, cacheName, { value: reduced, cachedBy: calculationVars });

        return reduce_vals ? reduced : vals;
    }


    // =============================
    // ====== Event =======
    // =============================

    calculateConsumableEventBuff(buff: EventBuffType) {
        if (!this.eventData) return 0;

        const data = this.eventData;
        const cacheName = `EVENTBUFF_${HSUtils.eventBuffNumToName(buff)}` as keyof CalculationCache;

        const calculationVars: number[] = [
            data.HAPPY_HOUR_BELL.amount,
            buff
        ]

        const cached = checkCalculationCache(this.#calculationCache, cacheName, calculationVars);

        if (cached !== undefined) return cached;

        const { HAPPY_HOUR_BELL } = this.eventData;

        const happyHourInterval = HAPPY_HOUR_BELL.amount - 1

        if (HAPPY_HOUR_BELL.amount === 0) {
            updateCalculationCache(this.#calculationCache, cacheName, { value: 0, cachedBy: calculationVars });
            return 0;
        }

        let val = 0;

        switch (buff) {
            case EventBuffType.Quark:
                val = HAPPY_HOUR_BELL ? 0.25 + 0.025 * happyHourInterval : 0;
                break;
            case EventBuffType.GoldenQuark:
                val = 0;
                break;
            case EventBuffType.Cubes:
                val = HAPPY_HOUR_BELL ? 0.5 + 0.05 * happyHourInterval : 0;
                break;
            case EventBuffType.PowderConversion:
                val = 0;
                break;
            case EventBuffType.AscensionSpeed:
                val = 0;
                break;
            case EventBuffType.GlobalSpeed:
                val = 0;
                break;
            case EventBuffType.AscensionScore:
                val = 0;
                break;
            case EventBuffType.AntSacrifice:
                val = 0;
                break;
            case EventBuffType.Offering:
                val = HAPPY_HOUR_BELL ? 0.5 + 0.05 * happyHourInterval : 0;
                break;
            case EventBuffType.Obtainium:
                val = HAPPY_HOUR_BELL ? 0.5 + 0.05 * happyHourInterval : 0;
                break;
            case EventBuffType.Octeract:
                val = 0;
                break;
            case EventBuffType.OneMind:
                val = 0;
                break;
            case EventBuffType.BlueberryTime:
                val = HAPPY_HOUR_BELL ? 0.1 + 0.01 * happyHourInterval : 0;
                break;
            case EventBuffType.AmbrosiaLuck:
                val = HAPPY_HOUR_BELL ? 0.1 + 0.01 * happyHourInterval : 0;
                break;
        }

        updateCalculationCache(this.#calculationCache, cacheName, { value: val, cachedBy: calculationVars });

        return val;
    }

    calculateEventSourceBuff(buffType: EventBuffType) {
        const baseBuff = this.getVanillaGlobalEventBuff(buffType);
        const consumableBuff = this.calculateConsumableEventBuff(buffType);
        return baseBuff + consumableBuff;
    }

    calculateLeaderboardValue = (leaderboard: ReadonlyArray<{ readonly elo: number; readonly sacrificeId: number }>): number => {
        let total = 0
        const LEADERBOARD_WEIGHTS = [1, 0.8, 0.6, 0.4, 0.2]
        for (let i = 0; i < Math.min(leaderboard.length, LEADERBOARD_WEIGHTS.length); i++) {
            total += leaderboard[i].elo * LEADERBOARD_WEIGHTS[i]
        }
        return Math.floor(total)
    }

    calculateGoldenRevolution(): number {
        if (!this.gameData) return 0;

        const count = this.gameData.highestSingularityCount;
        let total = 0;

        if (count >= 100) {
            total += Math.min(100, 0.4 * count);
            total += Math.min(50, 0.2 * count);
            total += Math.min(500, 2 * count);
        }

        if (count >= 160) {
            const thresholds = [160, 173, 185, 194, 204, 210, 219, 229, 240, 249];
            const divisor = thresholds.reduce((acc, threshold) => acc + (count >= threshold ? 1 : 0), 0);
            if (divisor > 0) {
                total += 1000000 / divisor;
            }
        }

        return total;
    }

    getActiveExalt(): number {
        if (!this.gameData) return 0;
        const data = this.gameData;
        
        if      (data.singularityChallenges.noSingularityUpgrades.enabled) return 1;
        else if (data.singularityChallenges.oneChallengeCap.enabled)       return 2;
        else if (data.singularityChallenges.limitedAscensions.enabled)     return 3;
        else if (data.singularityChallenges.noQuarkUpgrades.enabled)       return 4;
        else if (data.singularityChallenges.noOcteracts.enabled)           return 5;
        else if (data.singularityChallenges.noAmbrosiaUpgrades.enabled)    return 6;
        else if (data.singularityChallenges.limitedTime.enabled)           return 7;
        else if (data.singularityChallenges.sadisticPrequel.enabled)       return 8;
        else if (data.singularityChallenges.taxmanLastStand.enabled)       return 9;
        else if (data.singularityChallenges.barDependence.enabled)         return 10;
        else return 0;
    }

    calculateRedAmbrosiaGenerationSpeed(trueBaseOrMode: boolean | CalculationMode = false): number {
        return this.ambrosia.calculateRedAmbrosiaGenerationSpeed(true, trueBaseOrMode) as number;
    }

    getPatreonBonus(): number {
        if (!this.meData) return 0;
        const meData = this.meData;
        let bonus = (1 + (meData?.globalBonus ?? 0) / 100) * (1 + (meData?.bonus?.quark ?? 0) / 100) - 1;
        return bonus;
    }

    async dumpDataForHeater(): Promise<any> {
        const gameDataModule = HSModuleManager.getModule("HSGameData") as HSGameData;

        if (gameDataModule) {
            // PseudoCoin levels, quark bonus and consumables are pushed by HSGameData at each change: only the save is forced
            await gameDataModule.forceRefreshGameData();
        } else {
            HSLogger.error('Failed to acquire game data for heater export', this.context);
            HSUI.Notify('Failed to acquire game data for heater export', { position: 'top', notificationType: "error" });
            return;
        }

        // The global event is the game's own (eventCheck's last answer, handed over by the patcher), as current as the game's:
        // no refresh here, the mod doesn't fetch it.

        if (!this.gameData) return undefined;

        try {
            return buildHeaterExport(this, {
                gameData: this.gameData,
                meData: this.meData,
                eventData: this.eventData,
                campaignData: this.campaignData,
                isEvent: this.isEvent,
            });
        } catch (err) {
            const errorMsg = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
            HSLogger.error(`Failed to calculate game data for heater export\n${errorMsg}`, this.context);
            HSUI.Notify('Failed to calculate game data for heater export', { position: 'top', notificationType: "error" });
            return undefined;
        }
    }
}
