import { EventBuffType } from "../../../types/data-types/hs-event-data";
import { AchievementRewards, ACHIEVEMENT_REWARD_TYPES, AntProducers, AntUpgrades, CalculationCache, CachedValue, GoldenQuarkUpgradeKey, HepteractType, LAST_ANT_PRODUCER, OcteractUpgradeKey, RedAmbrosiaUpgradeKey, ProgressiveAchievement, ProgressiveAchievements, SingularityChallengeDataKeys, SingularityDebuffs, AntUpgradeTypeMap, AmbrosiaUpgradeNames, AmbrosiaUpgradeRewards, PCoinUpgradeEffects, NumberStatLine, RedAmbrosiaNames, RuneKeys, TalismanKeys, TalismanTypeMap, TalismanCraftItems, SynergismLevelMilestoneDefinition, SynergismLevelMilestones, AmbrosiaUpgradeCalculationConfig, FAVORITE_UPGRADE_GQ_DEPENDENCIES, FAVORITE_UPGRADE_OCTERACT_DEPENDENCIES, FAVORITE_UPGRADE_RED_AMBROSIA_DEPENDENCIES, offeringPotionThresholds, obtainiumPotionThresholds, ShopUpgradeGroups } from "../../../types/data-types/hs-gamedata-api-types";
import type { SingularityChallengeRewards } from "../../../types/data-types/hs-player-savedata";
import { HeaterExportData } from "../../../types/data-types/hs-heater-types";
import { SingularityChallengeStatus, CorruptionLevels, CorruptionLoadout } from "../../../types/data-types/hs-player-savedata";
import { HSModuleOptions } from "../../../types/hs-types";
import { HSUtils } from "../../hs-utils/hs-utils";
import { HSGlobal } from "../hs-global";
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
import type { ShopUpgradeHelperContext, AntUpgradeHelperContext, TalismanHelperContext, RuneHelperContext, AchievementHelperContext, AmbrosiaHelperContext } from "../../../types/data-types/hs-gamedata-api-types";
import { checkCalculationCache, updateCalculationCache, clearCalculationCache, dumpCalculationCache } from "./hs-gamedata-api-cache";
import { octeractUpgradeMaxLevels, goldenQuarkUpgradeMaxLevels, c15Functions, CASH_GRAB_ULTRA_BLUEBERRY, challenge15Rewards, hepteractEffectiveValues, synergismLevelMilestones, SINGULARITY_CHALLENGE_DATA, SHOP_UPGRADE_GROUPS_BY_KEY, SHOP_UPGRADE_TYPE_KEYS } from "./stored-vars-and-calculations";
import Decimal from "break_infinity.js";

const createQuarkShopCalculationCacheEntries = (): Record<string, CachedValue> => {
    const entries: Record<string, CachedValue> = {};

    const addCacheEntry = (name: string): void => {
        entries[name] = { value: undefined, cachedBy: [] };
    };

    const upgradeKeys = new Set<string>(Object.keys(SHOP_UPGRADE_GROUPS_BY_KEY));
    const extraQuarkShopUpgradeKeys = [
        'shopAmbrosiaLuckMultiplier4',
        'shopOcteractAmbrosiaLuck',
        'shopAmbrosiaUltra',
        'shopHorseShoe',
        'shopSingularityPenaltyDebuff',
    ];

    for (const groupKeys of Object.values(SHOP_UPGRADE_TYPE_KEYS)) {
        for (const key of groupKeys) {
            upgradeKeys.add(key);
        }
    }

    for (const extraKey of extraQuarkShopUpgradeKeys) {
        upgradeKeys.add(extraKey);
    }

    for (const upgradeKey of upgradeKeys) {
        addCacheEntry(`QUARKSHOP_SHOP_LEVEL_${upgradeKey}`);
        addCacheEntry(`QUARKSHOP_BONUS_LEVELS_${upgradeKey}`);
    }

    for (const group of Object.values(ShopUpgradeGroups).filter((value): value is ShopUpgradeGroups => typeof value === 'number')) {
        addCacheEntry(`QUARKSHOP_TYPE_BONUS_${group}`);
    }

    addCacheEntry('QUARKSHOP_FREE_QUARK_BONUS_LEVELS');

    return entries;
};

const createAchievementRewardCalculationCacheEntries = (): Record<string, CachedValue> => {
    const entries: Record<string, CachedValue> = {};

    const addCacheEntry = (name: string): void => {
        entries[name] = { value: undefined, cachedBy: [] };
    };

    const suffixes = ['sum', 'product', 'unlock'] as const;
    for (const rewardType of ACHIEVEMENT_REWARD_TYPES) {
        for (const suffix of suffixes) {
            addCacheEntry(`ACH_REWARD_${suffix}_${rewardType}`);
        }
    }

    return entries;
};

const createEventBuffCalculationCacheEntries = (): Record<string, CachedValue> => {
    const entries: Record<string, CachedValue> = {};
    const addCacheEntry = (name: string): void => {
        entries[name] = { value: undefined, cachedBy: [] };
    };

    const eventBuffTypes = Object.values(EventBuffType).filter((value): value is EventBuffType => typeof value === 'number');
    for (const buffType of eventBuffTypes) {
        addCacheEntry(`EVENTBUFF_${HSUtils.eventBuffNumToName(buffType)}`);
    }

    return entries;
};

const createAmbrosiaCalculationCacheEntries = (ambrosiaHelper: AmbrosiaHelper): Record<string, CachedValue> => {
    const entries: Record<string, CachedValue> = {};
    const addCacheEntry = (name: string): void => {
        entries[name] = { value: undefined, cachedBy: [] };
    };

    for (const upgradeName of Object.keys(ambrosiaHelper.R_ambrosiaUpgradeCalculationCollection)) {
        addCacheEntry(`AMB_${upgradeName}`);
        addCacheEntry(`AMB_${upgradeName}_FREE`);
    }

    for (const upgradeName of Object.keys(ambrosiaHelper.R_redAmbrosiaUpgradeCalculationCollection)) {
        addCacheEntry(`REDAMB_${upgradeName}`);
    }

    return entries;
};

const createCoreCalculationCacheEntries = (): Record<string, CachedValue> => {
    const entries: Record<string, CachedValue> = {};
    const addCacheEntry = (name: string): void => {
        entries[name] = { value: undefined, cachedBy: [] };
    };

    const coreKeys = [
        'R_AmbrosiaGenerationShopUpgrade',
        'R_AmbrosiaGenerationSingularityUpgrade',
        'R_AmbrosiaGenerationOcteractUpgrade',
        'R_SingularityMilestoneBlueberries',
        'R_DilatedFiveLeafBonus',
        'R_SingularityAmbrosiaLuckMilestoneBonus',
        'R_AmbrosiaLuckShopUpgrade',
        'R_AmbrosiaLuckSingularityUpgrade',
        'R_AmbrosiaLuckOcteractUpgrade',
        'R_PanthemaAmbrosiaLuck',
        'R_PanthemaRedLuck',
        'R_TalismanRarityTotal',
        'R_CubesExpTotal',
        'R_FreeAntUpgradeLevels',
        'R_CalculateTrueAntLevel',
        'R_GetRuneEffectiveLevel',
        'R_CampaignAmbrosiaSpeedBonus',
        'R_CampaignRune6Bonus',
        'R_CampaignLuckBonus',
        'R_calculateCampaignRune6Bonus',
        'R_CookieUpgrade29Luck',
        'R_CashGrab2ShopUpgrade',
        'R_CubeToQuarkShopUpgrade',
        'R_TesseractToQuarkShopUpgrade',
        'R_HypercubeToQuarkShopUpgrade',
        'R_CubeToQuarkAllShopUpgrade',
        'R_SumOfExaltCompletions',
        'R_NumberOfThresholds',
        'R_ToNextThreshold',
        'R_RequiredBlueberryTime',
        'R_RequiredRedAmbrosiaTime',
        'R_RawAscensionSpeedMult',
        'R_HepteractEffective',
        'R_AllShopTablets',
        'R_LimitedAscensionsDebuff',
        'R_SingularityDebuff',
        'R_SingularityReductions',
        'R_EffectiveSingularities',
        'R_AscensionSpeedExponentSpread',
        'R_RedAmbrosiaLuck',
        'R_LuckConversion',
    ];

    for (const key of coreKeys) {
        addCacheEntry(key);
    }

    return entries;
};

const createCalculationCache = (ambrosiaHelper: AmbrosiaHelper): CalculationCache => {
    return {
        ...createCoreCalculationCacheEntries(),
        ...createQuarkShopCalculationCacheEntries(),
        ...createAchievementRewardCalculationCacheEntries(),
        ...createAmbrosiaCalculationCacheEntries(ambrosiaHelper),
        ...createEventBuffCalculationCacheEntries(),
    } as CalculationCache;
};

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
 *   (*) All of the R_ methods are ripped from the game's code
*/
export class HSGameDataAPI extends HSGameDataAPIPartial {
    // ===== Fields =====
    #calculationCache: CalculationCache = {} as CalculationCache;

    R_singularityChallengeData: typeof SINGULARITY_CHALLENGE_DATA = SINGULARITY_CHALLENGE_DATA;

    #calculationCacheTemplate: CalculationCache;

    // These are imported from stored-vars-and-calculations.ts
    #hepteractEffectiveValues = hepteractEffectiveValues;
    readonly #calculationHelperProviders: Array<object> = [];

    readonly quarkShop: ShopUpgradeHelper;
    readonly antUpgrade: AntUpgradeHelper;
    readonly talisman: TalismanHelper;
    readonly rune: RuneHelper;
    readonly achievement: AchievementHelper;
    readonly ambrosia: AmbrosiaHelper;

    getSingularityChallengeEffect = <
        T extends SingularityChallengeDataKeys,
        K extends keyof SingularityChallengeRewards[T]
    >(
        challenge: T,
        effectKey: K
    ): SingularityChallengeRewards[T][K] => {
        if (!this.gameData) return 0 as SingularityChallengeRewards[T][K]
        const challengeData = this.R_singularityChallengeData[challenge]
        if (!challengeData) return 0 as SingularityChallengeRewards[T][K]

        const completions = this.gameData.singularityChallenges[challenge]?.completions ?? 0
        const effectValue = challengeData.effect(completions)[effectKey]
        return effectValue as SingularityChallengeRewards[T][K]
    }

    R_firstFiveRuneEffectivenessStats: NumberStatLine[] = [
        {
            i18n: 'Research1x4',
            stat: () => 1 + (this.gameData?.researches[4] ?? 0) / 10 * (1 + this.R_CalcECC('ascension', (this.gameData?.challengecompletions?.[14] ?? 0))),
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
                const talismanShards = this.gameData?.talismanShards ?? new Decimal(0)
                return 1 + 0.01 * Decimal.log(talismanShards.add(1), 4)
                    * Math.min(1, (this.gameData?.constantUpgrades[9] ?? 0))
            },
        },
        {
            i18n: 'Challenge15',
            stat: () => this.R_calculateChallenge15Reward('runeBonus'),
        },
        {
            i18n: 'MidasTribute',
            stat: () => this.R_calculateRuneEffectivenessCubeBlessing(),
        }
    ]

    R_allBaseOfferingStats: NumberStatLine[] = [
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
            stat: () => this.R_calculateOfferingPotionBaseOfferings().amount
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
            stat: () => this.ambrosia.R_getAmbrosiaUpgradeEffects('ambrosiaBaseOffering1').offering
        },
        {
            i18n: 'AmbrosiaBaseOffering2',
            stat: () => this.ambrosia.R_getAmbrosiaUpgradeEffects('ambrosiaBaseOffering2').offering
        },
        {
            i18n: 'OfferingEX3',
            stat: () => this.quarkShop.getShopUpgradeEffects('offeringEX3', 'baseOfferings') as number
        }
    ]

    R_allBaseObtainiumStats: NumberStatLine[] = [
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
            stat: () => this.R_calculateObtainiumPotionBaseObtainium().amount
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
            stat: () => this.ambrosia.R_getAmbrosiaUpgradeEffects('ambrosiaBaseObtainium1').obtainium
        },
        {
            i18n: 'AmbrosiaBaseObtainium2',
            stat: () => this.ambrosia.R_getAmbrosiaUpgradeEffects('ambrosiaBaseObtainium2').obtainium
        }
    ]

    R_maxTalismansRarityAP = 50 * 11;

    R_progressiveAchievements!: Record<ProgressiveAchievements, ProgressiveAchievement>;

    #corruptionData = {
        viscosityPower: [1, 0.87, 0.80, 0.75, 0.70, 0.6, 0.54, 0.45, 0.39, 0.33, 0.3, 0.2, 0.1, 0.05, 0, 0, 0],
        dilationMultiplier: [1, 1 / 3, 1 / 10, 1 / 40, 1 / 200, 1 / 3e4, 1 / 3e6, 1 / 3e9, 1 / 3e12, 1 / 1e15, 1 / 1e19, 1 / 1e24, 1 / 1e34, 1 / 1e48, 1 / 1e65, 1 / 1e80, 1 / 1e100],
        hyperchallengeMultiplier: [1, 1.2, 1.5, 1.7, 3, 5, 8, 13, 21, 34, 55, 100, 400, 1600, 7777, 18888, 88888],
        illiteracyPower: [1, 0.9, 0.8, 0.7, 0.6, 0.5, 0.45, 0.4, 0.35, 0.3, 0.25, 0.20, 0.15, 0.10, 0.08, 0.06, 0.04],
        deflationMultiplier: [1, 0.3, 0.1, 0.03, 0.01, 1 / 1e6, 1 / 1e8, 1 / 1e10, 1 / 1e12, 1 / 1e15, 1 / 1e18, 1 / 1e25, 1 / 1e35, 1 / 1e50, 1 / 1e77, 0, 0],
        extinctionDivisor: [1, 1.25, 1.5, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15],
        droughtSalvage: [0, -25, -50, -75, -100, -200, -300, -400, -600, -800, -1_000, -1_250, -2_000, -4_000, -8_000, -12_000, -16_000],
        recessionPower: [1, 0.9, 0.7, 0.6, 0.5, 0.37, 0.30, 0.23, 0.18, 0.15, 0.12, 0.09, 0.03, 0.01, 0.007, 0.0007, 0.00007]
    };


    getRuneBonusLevels(rune: RuneKeys): number {
        if (!this.gameData) return 0;

        switch (rune) {
            case 'speed': {
                return (
                    this.talisman.R_getRuneBonusFromAllTalismans('speed')
                    + ((this.gameData.upgrades[27] ?? 0) * (Math.min(50, Math.floor(this.gameData.coins.add(1).log10() / 10))
                        + Math.max(0, Math.min(50, Math.floor(this.gameData.coins.add(1).log10() / 50) - 10))))
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
                    this.talisman.R_getRuneBonusFromAllTalismans('duplication')
                    + ((this.gameData.upgrades[28] ?? 0) * Math.min(
                        100,
                        Math.floor(
                            ((this.gameData.firstOwnedCoin ?? 0) + (this.gameData.secondOwnedCoin ?? 0) + (this.gameData.thirdOwnedCoin ?? 0) + (this.gameData.fourthOwnedCoin ?? 0)
                                + (this.gameData.fifthOwnedCoin ?? 0)) / 400
                        )
                    ))
                    + ((this.gameData.upgrades[30] ?? 0) * (Math.min(50, Math.floor(this.gameData.coins.add(1).log10() / 30))
                        + Math.min(50, Math.floor(this.gameData.coins.add(1).log10() / 300))))
                )
            }
            case 'prism':
                return this.talisman.R_getRuneBonusFromAllTalismans('prism');
            case 'thrift':
                return this.talisman.R_getRuneBonusFromAllTalismans('thrift');
            case 'superiorIntellect':
                return this.talisman.R_getRuneBonusFromAllTalismans('superiorIntellect');
            case 'infiniteAscent':
                return (
                    (this.getPCoinUpgradeLevel('INSTANT_UNLOCK_2') ? 6 : 0)
                    + (this.gameData.cubeUpgrades[73] ?? 0)
                    + this.R_calculateCampaignRune6Bonus()
                    + this.talisman.R_getRuneBonusFromAllTalismans('infiniteAscent')
                    + this.rune.R_getRuneEffects('finiteDescent').infiniteAscentFreeLevel
                )
            case 'antiquities':
                return this.talisman.R_getRuneBonusFromAllTalismans('antiquities');
            case 'horseShoe': {
                return this.talisman.R_getRuneBonusFromAllTalismans('horseShoe')
                     + this.quarkShop.getShopUpgradeEffects('shopHorseShoe', 'bonusHorseLevels') as number
            }
            default:
                return 0;
        }
    }



    // ===== Constructor =====
    constructor(moduleOptions: HSModuleOptions) {
        super(moduleOptions);
        const ambrosiaContext: AmbrosiaHelperContext = {
            getGameData: () => this.gameData,
            getMeData: () => this.meData,
            getShopUpgradeEffects: (upgradeKey, effectKey) => this.quarkShop.getShopUpgradeEffects(upgradeKey as any, effectKey as any),
            getSingularityChallengeEffect: (challengeKey, effectKey) => this.getSingularityChallengeEffect(challengeKey as any, effectKey as any),
            calculateLuck: (reduce_vals = true, true_base = false) => this.calculateLuck(reduce_vals, true_base),
            checkCalculationCache: (cacheName, calculationVars) => checkCalculationCache(this.#calculationCache, cacheName, calculationVars),
            updateCalculationCache: (cacheName, item) => updateCalculationCache(this.#calculationCache, cacheName, item),
        };
        this.ambrosia = this.registerCalculationHelper(new AmbrosiaHelper(ambrosiaContext));
        this.#calculationCache = createCalculationCache(this.ambrosia);

        const quarkShopContext: ShopUpgradeHelperContext = {
            getGameData: () => this.gameData,
            getPCoinUpgradeLevel: (upgradeName) => this.getPCoinUpgradeLevel(upgradeName as any),
            getShopUpgradeTypeBonusLevels: (type) => this.quarkShop.getShopUpgradeTypeBonusLevels(type),
            getSingularityChallengeEffect: (challengeKey, effectKey) => this.getSingularityChallengeEffect(challengeKey as any, effectKey as any),
            R_getAmbrosiaUpgradeEffects: (upgradeName) => this.ambrosia.R_getAmbrosiaUpgradeEffects(upgradeName as any),
            R_getRuneEffectiveLevel: (rune) => this.rune.R_getRuneEffectiveLevel(rune),
            R_getRuneEffects: (rune) => this.rune.R_getRuneEffects(rune),
            R_getRedAmbrosiaUpgradeEffects: (upgradeKey) => this.ambrosia.R_getRedAmbrosiaUpgradeEffects(upgradeKey as any),
            R_calculateSumOfExaltCompletions: () => this.R_calculateSumOfExaltCompletions(),
            R_calculateFreeShopInfinityUpgrades: (reduce_vals: boolean) => this.R_calculateAllShopTablets(reduce_vals) as number[],
            checkCalculationCache: (cacheName, calculationVars) => checkCalculationCache(this.#calculationCache, cacheName, calculationVars),
            updateCalculationCache: (cacheName, item) => updateCalculationCache(this.#calculationCache, cacheName, item),
        }
        this.quarkShop = this.registerCalculationHelper(new ShopUpgradeHelper(quarkShopContext));

        const antUpgradeContext: AntUpgradeHelperContext = {
            getGameData: () => this.gameData,
            R_getAchievementReward: (rewardName) => this.achievement.R_AchRewards[rewardName as AchievementRewards](),
            R_calculateSigmoidExponential: (constant, coefficient) => this.R_calculateSigmoidExponential(constant, coefficient),
            R_calculateChallenge15Reward: (rewardName) => this.R_calculateChallenge15Reward(rewardName as any),
            R_calculateCorruptionEffect: (loadout, corruption) => this.R_calculateCorruptionEffect(loadout, corruption),
            R_CalcECC: (refinement, value) => this.R_CalcECC(refinement as any, value),
            checkCalculationCache: (cacheName, calculationVars) => checkCalculationCache(this.#calculationCache, cacheName, calculationVars),
            updateCalculationCache: (cacheName, item) => updateCalculationCache(this.#calculationCache, cacheName, item),
        };
        this.antUpgrade = this.registerCalculationHelper(new AntUpgradeHelper(antUpgradeContext));

        const talismanContext: TalismanHelperContext = {
            getGameData: () => this.gameData,
            getSingularityChallengeEffect: (challengeKey, effectKey) => this.getSingularityChallengeEffect(challengeKey as any, effectKey as any),
            getPCoinUpgradeLevel: (upgradeName) => this.getPCoinUpgradeLevel(upgradeName as any),
            isShopTalismanUnlocked: () => this.quarkShop.getShopUpgradeEffects('shopTalisman', 'unlocked') as boolean,
            R_getAchievementReward: (rewardName) => this.achievement.R_AchRewards[rewardName as AchievementRewards](),
            R_getGQUpgradeEffect: (upgradeKey) => this.R_getGQUpgradeEffect(upgradeKey as any) as number | undefined,
            R_getAmbrosiaUpgradeEffects: (upgradeKey) => this.ambrosia.R_getAmbrosiaUpgradeEffects(upgradeKey as any),
            R_getAntUpgradeEffect: (upgradeKey) => this.antUpgrade.R_getAntUpgradeEffect(upgradeKey as any),
            R_getLevelMilestone: (name) => this.R_getLevelMilestone(name as any),
            R_getOcteractUpgradeEffect: (upgradeKey) => this.R_getOcteractUpgradeEffect(upgradeKey as any) as number | undefined,
            R_CalcECC: (refinement, value) => this.R_CalcECC(refinement as any, value),
            R_calculateChallenge15Reward: (rewardName) => this.R_calculateChallenge15Reward(rewardName as any),
            checkCalculationCache: (cacheName, calculationVars) => checkCalculationCache(this.#calculationCache, cacheName, calculationVars),
            updateCalculationCache: (cacheName, item) => updateCalculationCache(this.#calculationCache, cacheName, item),
        }
        this.talisman = this.registerCalculationHelper(new TalismanHelper(talismanContext));

        const runeContext: RuneHelperContext = {
            getGameData: () => this.gameData,
            getPCoinUpgradeLevel: (upgradeName) => this.getPCoinUpgradeLevel(upgradeName as any),
            getSingularityChallengeEffect: (challengeKey, effectKey) => this.getSingularityChallengeEffect(challengeKey as any, effectKey as any),
            getRuneBonusLevels: (rune) => this.getRuneBonusLevels(rune),
            R_getRuneEffects: (rune) => this.rune.R_getRuneEffects(rune),
            R_getAchievementReward: (rewardName) => this.achievement.R_AchRewards[rewardName as AchievementRewards](),
            R_getAmbrosiaUpgradeEffects: (upgradeName) => this.ambrosia.R_getAmbrosiaUpgradeEffects(upgradeName as any),
            R_getAntUpgradeEffect: (upgradeKey) => this.antUpgrade.R_getAntUpgradeEffect(upgradeKey as any),
            R_getLevelMilestone: (name) => this.R_getLevelMilestone(name as any),
            R_CalcECC: (refinement, value) => this.R_CalcECC(refinement as any, value),
            R_firstFiveFreeLevels: () => this.R_firstFiveFreeLevels(),
            R_firstFiveEffectiveRuneLevelMult: () => this.R_firstFiveEffectiveRuneLevelMult(),
            R_speedRuneOOMIncrease: () => this.R_speedRuneOOMIncrease(),
            R_duplicationRuneOOMIncrease: () => this.R_duplicationRuneOOMIncrease(),
            R_prismRuneOOMIncrease: () => this.R_prismRuneOOMIncrease(),
            R_thriftRuneOOMIncrease: () => this.R_thriftRuneOOMIncrease(),
            R_superiorIntellectOOMIncrease: () => this.R_superiorIntellectOOMIncrease(),
            R_universalRuneEXPMult: (purchasedLevels) => this.R_universalRuneEXPMult(purchasedLevels),
            R_SIEffectiveRuneLevelMult: () => this.R_SIEffectiveRuneLevelMult(),
            checkCalculationCache: (cacheName, calculationVars) => checkCalculationCache(this.#calculationCache, cacheName, calculationVars),
            updateCalculationCache: (cacheName, item) => updateCalculationCache(this.#calculationCache, cacheName, item),
        }
        this.rune = this.registerCalculationHelper(new RuneHelper(runeContext));

        const achievementContext: AchievementHelperContext = {
            getGameData: () => this.gameData,
            getCampaignData: () => this.campaignData,
            getSingularityChallengeEffect: (challengeKey, effectKey) => this.getSingularityChallengeEffect(challengeKey as any, effectKey as any),
            R_getPrestigePointGain: () => this.R_getPrestigePointGain(),
            R_getTranscendPointGain: () => this.R_getTranscendPointGain(),
            R_getReincarnationPointGain: () => this.R_getReincarnationPointGain(),
            R_getRuneEffectiveLevel: (rune) => this.rune.R_getRuneEffectiveLevel(rune),
            R_runes: () => this.rune.R_runes,
            R_calcCorruptionStuff: () => this.R_calcCorruptionStuff(),
            R_calculateChallenge15Reward: (rewardName) => this.R_calculateChallenge15Reward(rewardName as any),
            R_calculateSynergismLevel: () => this.R_calculateSynergismLevel(),
            R_calculateAscensionScore: () => this.R_calculateAscensionScore(),
            checkCalculationCache: (cacheName, calculationVars) => checkCalculationCache(this.#calculationCache, cacheName, calculationVars),
            updateCalculationCache: (cacheName, item) => updateCalculationCache(this.#calculationCache, cacheName, item),
        }
        this.achievement = this.registerCalculationHelper(new AchievementHelper(achievementContext));

        this.#calculationCacheTemplate = { ...this.#calculationCache };
        this.R_progressiveAchievements = this.createProgressiveAchievements();
    }


    // ===== Registration =====
    public registerCalculationHelper<T extends object>(helper: T): T {
        this.#calculationHelperProviders.push(helper);
        return helper;
    }


    // ===== General Utils =====
    private log10PlusOne(value: number | Decimal): number {
        return Math.floor(Math.log10(Number(value ?? 0) + 1));
    }

    private R_totalWowLog10(): number {
        if (!this.gameData) return 6;
        const data = this.gameData;
        return (
            this.log10PlusOne(data.wowCubes)
            + this.log10PlusOne(data.wowTesseracts)
            + this.log10PlusOne(data.wowHypercubes)
            + this.log10PlusOne(data.wowPlatonicCubes)
            + this.log10PlusOne(data.wowAbyssals)
            + this.log10PlusOne(data.wowOcteracts)
            + 6
        );
    }

    public getCalculationFunction(fnName: string): ((...args: unknown[]) => number | number[]) | undefined {
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
    }

    dumpCache() {
        dumpCalculationCache(this.#calculationCache);
    }

    R_calculateSigmoidExponential(constant: number, coefficient: number) {
        return 1 + (constant - 1) * (1 - Math.exp(-coefficient))
    }


    R_getLevelMilestone(name: SynergismLevelMilestones): number {
        if (!this.gameData) return 0;
        const milestone = synergismLevelMilestones[name];
        const level = this.R_calculateSynergismLevel();
        return level >= milestone.levelReq ? milestone.effect.call(this) : milestone.defaultValue;
    }

    getPCoinUpgradeLevel(name: keyof typeof PCoinUpgradeEffects): number {
        const pseudoData = this.getPseudoData?.() ?? this.pseudoData;
        if (!pseudoData) return 0;

        // New structure: pseudoData.upgrades contains metadata, pseudoData.playerUpgrades contains levels.
        // Prefer resolving by upgradeId (stable), then fall back to internalName if present.
        const level = pseudoData.playerUpgrades?.find(u => u.internalName === name)?.level;
        if (level !== undefined) {
            return level;
        }

        return 0;
    }

    R_findInsertionIndex = (target: number, array: number[]) => {
        let index = 0
        while (index < array.length && target >= array[index]) {
            index += 1
        }
        return index
    }

    getCurrentAPFromChallenges = Object.entries(this.R_singularityChallengeData).reduce(
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
        const data = this.gameData

        const goldenQuarkMaxed = FAVORITE_UPGRADE_GQ_DEPENDENCIES.reduce((count, key) =>
            count + ((data.goldenQuarkUpgrades[key]?.level ?? 0) >= goldenQuarkUpgradeMaxLevels[key].maxLevel ? 1 : 0),
            0
        )

        const octeractMaxed = FAVORITE_UPGRADE_OCTERACT_DEPENDENCIES.reduce((count, key) =>
            count + ((data.octUpgrades[key]?.level ?? 0) >= octeractUpgradeMaxLevels[key].maxLevel ? 1 : 0),
            0
        )

        const redAmbrosiaMaxed = FAVORITE_UPGRADE_RED_AMBROSIA_DEPENDENCIES.reduce((count, key) => {
            const maxLevel = this.ambrosia.R_redAmbrosiaUpgradeCalculationCollection[key].maxLevel
            return count + (this.ambrosia.R_calculateRedAmbrosiaUpgradeValue(key) >= maxLevel ? 1 : 0)
        }, 0)

        return goldenQuarkMaxed + octeractMaxed + redAmbrosiaMaxed
    }

    getVanillaGlobalEventBuff(buffType: EventBuffType): number {
        const event = this.vanillaGlobalEvent;
        if (!event) return 0;

        const hasOneMindUpgrade = this.R_getGQUpgradeEffect('oneMind') > 0;

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

    R_calculateTotalCubesExp() {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'R_CubesExpTotal' as keyof CalculationCache;

        const calculationVars: number[] = [
            data.wowCubes,
            data.wowTesseracts,
            data.wowHypercubes,
            data.wowPlatonicCubes,
            data.wowAbyssals,
            data.wowOcteracts
        ]

        const cached = checkCalculationCache(this.#calculationCache, cacheName, calculationVars);

        if (cached !== undefined) return cached;

        const reduced = this.R_totalWowLog10();

        updateCalculationCache(this.#calculationCache, cacheName, { value: reduced, cachedBy: calculationVars });

        return reduced;
    }

    getCorruptionTotalLevel() {
        if (!this.gameData) return 0;
        const data = this.gameData;

        const corruptions = data.corruptions.used.levels;
        const sum = Object.values(corruptions).reduce((a, b) => a + b, 0);
        return sum;
    }

    R_calculateHepteractEffective = (heptType: HepteractType) => {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'R_HepteractEffective' as keyof CalculationCache;

        const calculationVars: number[] = [
            data.hepteracts[heptType].BAL,
            data.platonicUpgrades[19],
            data.goldenQuarkUpgrades.singQuarkHepteract.level,
            data.goldenQuarkUpgrades.singQuarkHepteract2.level,
            data.goldenQuarkUpgrades.singQuarkHepteract3.level,
            data.shopUpgrades.improveQuarkHept,
            data.shopUpgrades.improveQuarkHept2,
            data.shopUpgrades.improveQuarkHept3,
            data.shopUpgrades.improveQuarkHept4,
            data.shopUpgrades.improveQuarkHept5,
        ];

        const cached = checkCalculationCache(this.#calculationCache, cacheName, calculationVars);

        if (cached !== undefined) return cached;

        let effectiveValue = Math.min(data.hepteracts[heptType].BAL, this.#hepteractEffectiveValues[heptType].LIMIT);
        let exponentBoost = 0;

        if (heptType === 'chronos') {
            exponentBoost += 1 / 750 * data.platonicUpgrades[19];
        }

        if (heptType === 'quark') {
            exponentBoost += +data.goldenQuarkUpgrades.singQuarkHepteract.level / 100;
            exponentBoost += +data.goldenQuarkUpgrades.singQuarkHepteract2.level / 100;
            exponentBoost += +data.goldenQuarkUpgrades.singQuarkHepteract3.level / 100;
            exponentBoost += +data.octUpgrades.octeractImprovedQuarkHept.level / 100;
            exponentBoost += this.quarkShop.getShopUpgradeEffects('improveQuarkHept', 'quarkHeptExponent') as number;
            exponentBoost += this.quarkShop.getShopUpgradeEffects('improveQuarkHept2', 'quarkHeptExponent') as number;
            exponentBoost += this.quarkShop.getShopUpgradeEffects('improveQuarkHept3', 'quarkHeptExponent') as number;
            exponentBoost += this.quarkShop.getShopUpgradeEffects('improveQuarkHept4', 'quarkHeptExponent') as number;
            exponentBoost += this.quarkShop.getShopUpgradeEffects('improveQuarkHept5', 'quarkHeptExponent') as number;

            const amount = data.hepteracts[heptType].BAL;
            let val;

            if (1000 < amount && amount <= 1000 * Math.pow(2, 10)) {
                val = effectiveValue * Math.pow(amount / 1000, 1 / 2 + exponentBoost)
            } else if (1000 * Math.pow(2, 10) < amount && amount <= 1000 * Math.pow(2, 18)) {
                val = effectiveValue * Math.pow(Math.pow(2, 10), 1 / 2 + exponentBoost)
                    * Math.pow(amount / (1000 * Math.pow(2, 10)), 1 / 4 + exponentBoost / 2)
            } else if (1000 * Math.pow(2, 18) < amount && amount <= 1000 * Math.pow(2, 44)) {
                val = effectiveValue * Math.pow(Math.pow(2, 10), 1 / 2 + exponentBoost)
                    * Math.pow(Math.pow(2, 8), 1 / 4 + exponentBoost / 2)
                    * Math.pow(amount / (1000 * Math.pow(2, 18)), 1 / 6 + exponentBoost / 3)
            } else if (1000 * Math.pow(2, 44) < amount) {
                val = effectiveValue * Math.pow(Math.pow(2, 10), 1 / 2 + exponentBoost)
                    * Math.pow(Math.pow(2, 8), 1 / 4 + exponentBoost / 2)
                    * Math.pow(Math.pow(2, 26), 1 / 6 + exponentBoost / 3)
                    * Math.pow(amount / (1000 * Math.pow(2, 44)), 1 / 12 + exponentBoost / 6)
            } else {
                val = 0;
            }

            updateCalculationCache(this.#calculationCache, cacheName, { value: val, cachedBy: calculationVars });
            return val;
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

    R_calcCorruptionStuff() {
        if (!this.gameData) {
            return {
                wowCubes: 0,
                wowTesseracts: 0,
                wowHypercubes: 0,
                wowPlatonicCubes: 0,
                wowHepteracts: 0,
                baseScore: 0,
                bonusMultiplier: 0,
                corruptionMultiplier: 0,
                effectiveScore: 0,
            };
        }

        const scores = this.R_calculateAscensionScore();
        const cubeGain = this.R_calculateCubeMultiplierWithTau();

        let tesseractGain = 1;
        if (scores.effectiveScore >= 100000) {
            tesseractGain += 0.5;
        }
        tesseractGain *= this.R_calculateTesseractMultiplier();

        let hypercubeGain = scores.effectiveScore >= 1e9 ? 1 : 0;
        hypercubeGain *= this.R_calculateHypercubeMultiplier();

        let platonicGain = scores.effectiveScore >= 2.666e12 ? 1 : 0;
        platonicGain *= this.R_calculatePlatonicMultiplier();

        let hepteractGain = challenge15Rewards.hepteractsUnlocked.value && scores.effectiveScore >= 1.666e17 ? 1 : 0;
        hepteractGain *= this.R_calculateHepteractMultiplier();

        return {
            wowCubes: Math.min(1e300, Math.floor(cubeGain)),
            wowTesseracts: Math.min(1e300, Math.max(this.gameData.singularityCount ?? 0, Math.floor(tesseractGain))),
            wowHypercubes: Math.min(1e300, Math.floor(hypercubeGain)),
            wowPlatonicCubes: Math.min(1e300, Math.floor(platonicGain)),
            wowHepteracts: Math.min(1e300, Math.floor(hepteractGain)),
            baseScore: Math.floor(scores.baseScore),
            bonusMultiplier: scores.bonusMultiplier,
            corruptionMultiplier: scores.corruptionMultiplier,
            effectiveScore: Math.floor(scores.effectiveScore),
        };
    }

    R_calculateCorruptionEffect(loadout: CorruptionLoadout, corruption: string): number {
        if (!this.gameData) return 0;

        const data = this.gameData;
        const loadoutLevels = loadout.levels;

        switch (corruption) {
            case 'deflation':
                return this.#corruptionData.deflationMultiplier[loadoutLevels.deflation];
            case 'dilation':
                return this.#corruptionData.dilationMultiplier[loadoutLevels.dilation];
            case 'drought': {
                let baseSalvageReduction = this.#corruptionData.droughtSalvage[loadoutLevels.drought];
                if (data.platonicUpgrades[13] > 0) {
                    baseSalvageReduction *= 0.5;
                }
                return baseSalvageReduction;
            }
            case 'extinction':
                return this.#corruptionData.extinctionDivisor[loadoutLevels.extinction];
            case 'hyperchallenge': {
                const baseEffect = this.#corruptionData.hyperchallengeMultiplier[loadoutLevels.hyperchallenge];
                let divisor = 1;
                divisor *= 1 + 2 / 5 * data.platonicUpgrades[8];
                return Math.max(1, baseEffect / divisor);
            }
            case 'illiteracy': {
                const base = this.#corruptionData.illiteracyPower[loadoutLevels.illiteracy];
                const obtainiumValue = Number(data.obtainium);
                const multiplier = (obtainiumValue > 0)
                    ? 1 + (1 / 100) * data.platonicUpgrades[9] * Math.min(100, Math.log10(obtainiumValue))
                    : 1;
                return Math.min(base * multiplier, 1);
            }
            case 'recession':
                return this.#corruptionData.recessionPower[loadoutLevels.recession];
            case 'viscosity': {
                const base = this.#corruptionData.viscosityPower[loadoutLevels.viscosity];
                const multiplier = 1 + data.platonicUpgrades[6] / 30;
                return Math.min(base * multiplier, 1);
            }
            default:
                return 1;
        }
    }

    R_CalcECC = (type: 'transcend' | 'reincarnation' | 'ascension', completions: number) => { // ECC stands for "Effective Challenge Completions"
        let effective = 0
        switch (type) {
            case 'transcend':
                effective += Math.min(100, completions)
                effective += 1 / 20 * (Math.min(1000, Math.max(100, completions)) - 100)
                effective += 1 / 100 * (Math.max(1000, completions) - 1000)
                return effective
            case 'reincarnation':
                effective += Math.min(25, completions)
                effective += 1 / 2 * (Math.min(75, Math.max(25, completions)) - 25)
                effective += 1 / 10 * (Math.max(75, completions) - 75)
                return effective
            case 'ascension':
                effective += Math.min(10, completions)
                effective += 1 / 2 * (Math.max(10, completions) - 10)
                return effective
        }
    }


    // ===== Challenge =====
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
                    return (Object.keys(this.rune.R_runes) as RuneKeys[]).reduce((sum, rune) => {
                        return sum + this.getRuneLevelFromEXP(rune, this.gameData?.runes[rune] ?? new Decimal(0))
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
                    return (Object.keys(this.rune.R_runes) as RuneKeys[]).reduce((sum, rune) => {
                        return sum + this.rune.R_runes[rune].freeLevels()
                    }, 0)
                },
                useCachedValue: true,
                rewardedAP: 0,
                displayOrder: 2,
                displayCondition: () => (this.gameData?.prestigeCount ?? 0) > 0
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
                    const leaderboardELO = this.R_calculateLeaderboardValue(this.gameData?.ants.highestRebornELOEver ?? [])
                    return Math.min(100, Math.floor(leaderboardELO / 100))
                        + Math.min(150, Math.floor(leaderboardELO / 1000))
                        + Math.min(150, Math.floor(leaderboardELO / 9000))
                        + Math.min(200, Math.floor(leaderboardELO / 75000))
                        + Math.min(400, Math.floor(leaderboardELO / 150000))
                },
                updateValue: () => {
                    return this.R_calculateLeaderboardValue(this.gameData?.ants.highestRebornELOEver ?? [])
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
                maxPointValue: this.R_maxGoldenQuarkUpgradeAP,
                pointsAwarded: (_cached: number) => {
                    let pointValue = 0
                    if (!this.gameData) return 0;
                    for (const upgradeKey of Object.keys(
                        goldenQuarkUpgradeMaxLevels
                    ) as GoldenQuarkUpgradeKey[]) {
                        const maxLevel = goldenQuarkUpgradeMaxLevels[upgradeKey].maxLevel
                        const playerLevel =
                            this.gameData.goldenQuarkUpgrades[upgradeKey]?.level ?? 0

                        if (maxLevel !== -1 && playerLevel >= maxLevel) {
                            pointValue += 5
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
                maxPointValue: this.R_maxOcteractUpgradeAP,
                pointsAwarded: (_cached: number) => {
                    let pointValue = 0
                    if (!this.gameData) return 0;
                    for (const upgradeKey of Object.keys(octeractUpgradeMaxLevels) as OcteractUpgradeKey[]) {
                        const maxLevel = octeractUpgradeMaxLevels[upgradeKey].maxLevel
                        const playerLevel =
                            this.gameData.octUpgrades[upgradeKey]?.level ?? 0
                        if (maxLevel !== -1 && playerLevel >= maxLevel) {
                            pointValue += 8
                        }
                    }
                    return pointValue
                },
                updateValue: () => 0,
                useCachedValue: false,
                rewardedAP: 0,
                displayOrder: 8,
                displayCondition: () => (this.gameData?.goldenQuarkUpgrades.octeractUnlock.level ?? 0) > 0
            },
            redAmbrosiaUpgrades: {
                maxPointValue: this.ambrosia.R_maxRedAmbrosiaUpgradeAP,
                pointsAwarded: () => {
                    let pointValue = 0
                    if (!this.gameData) return 0;
                    for (const upgradeKey of Object.keys(this.ambrosia.R_redAmbrosiaUpgradeCalculationCollection) as RedAmbrosiaUpgradeKey[]) {
                        const maxLevel = this.ambrosia.R_redAmbrosiaUpgradeCalculationCollection[upgradeKey].maxLevel
                        const playerLevel = this.ambrosia.R_calculateRedAmbrosiaUpgradeValue(upgradeKey);
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
            talismanRarities: {
                maxPointValue: this.R_maxTalismansRarityAP,
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

        const chalData = this.R_singularityChallengeData[chal];
        if (!chalData) return 0;

        const completions =
            this.gameData.singularityChallenges[chal]?.completions ?? 0;

        return chalData.achievementPointValue(completions);
    }

    R_calculateSingularityAmbrosiaLuckMilestoneBonus() {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'R_SingularityAmbrosiaLuckMilestoneBonus' as keyof CalculationCache;

        const calculationVars: number[] = [
            data.highestSingularityCount
        ]

        const cached = checkCalculationCache(this.#calculationCache, cacheName, calculationVars);

        if (cached !== undefined) return cached;

        let bonus = 0
        const singThresholds1 = [35, 42, 49, 56, 63, 70, 77];
        const singThresholds2 = [135, 142, 149, 156, 163, 170, 177];

        for (const sing of singThresholds1) {
            if (data.highestSingularityCount >= sing) {
                bonus += 5
            }
        }

        for (const sing of singThresholds2) {
            if (data.highestSingularityCount >= sing) {
                bonus += 6
            }
        }

        const reduced = bonus;

        updateCalculationCache(this.#calculationCache, cacheName, { value: reduced, cachedBy: calculationVars });

        return reduced;
    }

    // https://github.com/Pseudo-Corp/SynergismOfficial/blob/master/src/Calculate.ts#L2351
    R_calculateAmbrosiaLuckSingularityUpgrade(reduce_vals = true) {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'R_AmbrosiaLuckSingularityUpgrade' as keyof CalculationCache;

        const calculationVars = this.getAmbrosiaLuckSingularityUpgradeCalculationDeps();

        const cached = checkCalculationCache(this.#calculationCache, cacheName, calculationVars);

        if (reduce_vals && cached !== undefined) return cached;

        const vals = [
            +data.goldenQuarkUpgrades.singAmbrosiaLuck.level * 4,
            +data.goldenQuarkUpgrades.singAmbrosiaLuck2.level * 2,
            +data.goldenQuarkUpgrades.singAmbrosiaLuck3.level * 3,
            +data.goldenQuarkUpgrades.singAmbrosiaLuck4.level * 5
        ]

        const reduced = vals.reduce((a, b) => a + b, 0);

        updateCalculationCache(this.#calculationCache, cacheName, { value: reduced, cachedBy: calculationVars });

        return reduce_vals ? reduced : vals;
    }

    R_calculateSingularityReductions(reduce_vals = true) {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'R_SingularityReductions' as keyof CalculationCache;

        const calculationVars: number[] = [
            data.insideSingularityChallenge ? 1 : 0,
            data.ambrosiaUpgrades.ambrosiaSingReduction2.ambrosiaInvested,
            data.ambrosiaUpgrades.ambrosiaSingReduction1.ambrosiaInvested,
            ...this.quarkShop.getShopLevelCalculationVars('shopSingularityPenaltyDebuff'),
        ];

        const cached = checkCalculationCache(this.#calculationCache, cacheName, calculationVars);

        if (reduce_vals && cached !== undefined) return cached;

        let redu;

        if (data.insideSingularityChallenge) {
            redu = this.ambrosia.R_getAmbrosiaUpgradeEffects("ambrosiaSingReduction2").singularityReduction;
        } else {
            redu = this.ambrosia.R_getAmbrosiaUpgradeEffects("ambrosiaSingReduction1").singularityReduction;
        }

        const vals = [
            this.quarkShop.getShopUpgradeEffects('shopSingularityPenaltyDebuff', 'singularityPenaltyReducers') as number,
            redu
        ]

        const reduced = vals.reduce((a, b) => a + b, 0)

        updateCalculationCache(this.#calculationCache, cacheName, { value: reduced, cachedBy: calculationVars });

        return reduce_vals ? reduced : vals;
    }

    R_calculateSingularityDebuff(debuff: SingularityDebuffs, singularityCount: number = -1) {
        if (!this.gameData) return 1;
        const data = this.gameData;

        if (singularityCount === -1) {
            singularityCount = data.singularityCount;
        }

        if (singularityCount === 0) {
            return debuff === 'Salvage' || debuff === 'Ant ELO' ? 0 : 1;
        }

        if (data.runes.antiquities.gt(0)) {
            return debuff === 'Salvage' || debuff === 'Ant ELO' ? 0 : 1;
        }

        const constitutiveSingularityCount = singularityCount - (this.R_calculateSingularityReductions() as number)

        if (constitutiveSingularityCount < 1) {
            return 1;
        }

        const effectiveSingularities = this.R_calculateEffectiveSingularities(
            constitutiveSingularityCount
        )

        let baseDebuffMultiplier = 1
        baseDebuffMultiplier *= this.quarkShop.getShopUpgradeEffects('shopHorseShoe', 'singularityPenaltyMult') as number

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
    }

    private getAmbrosiaLuckSingularityUpgradeCalculationDeps(): number[] {
        if (!this.gameData) return [0];
        const data = this.gameData;

        return [
            data.goldenQuarkUpgrades.singAmbrosiaLuck.level,
            data.goldenQuarkUpgrades.singAmbrosiaLuck2.level,
            data.goldenQuarkUpgrades.singAmbrosiaLuck3.level,
            data.goldenQuarkUpgrades.singAmbrosiaLuck4.level,
        ];
    }

    private getSingularityAmbrosiaLuckMilestoneBonusCalculationDeps(): number[] {
        if (!this.gameData) return [0];
        return [this.gameData.highestSingularityCount];
    }


    // ===== Accelerator =====
    R_calculateAcceleratorHypercubeBlessing = (): number => {
        if (!this.gameData) return 1

        const DR = 1 / 12
        const effectPerBlessing = this.R_calculateHypercubeBlessingMultiplierPlatonicBlessing() / 1000
        const limit = 1000
        const acceleratorBlessings = this.gameData.hypercubeBlessings.accelerator ?? 0

        if (acceleratorBlessings < limit) {
            return 1 + effectPerBlessing * acceleratorBlessings
        }

        const limitMult = Math.pow(limit, 1 - DR)
        return 1 + effectPerBlessing * limitMult * Math.pow(acceleratorBlessings, DR)
    }

    R_calculateAcceleratorTesseractBlessing = (): number => {
        if (!this.gameData) return 1

        const DR = 1 / 6
        const effectPerBlessing = this.R_calculateAcceleratorHypercubeBlessing() / 1000
        const limit = 1000
        const acceleratorBlessings = this.gameData.tesseractBlessings.accelerator ?? 0

        if (acceleratorBlessings < limit) {
            return 1 + effectPerBlessing * acceleratorBlessings
        }

        const limitMult = Math.pow(limit, 1 - DR)
        return 1 + effectPerBlessing * limitMult * Math.pow(acceleratorBlessings, DR)
    }

    R_calculateAcceleratorCubeBlessing = (): number => {
        if (!this.gameData) return 0

        const DR = 1 / 3
        const effectPerBlessing = this.R_calculateAcceleratorTesseractBlessing() / 500
        const limit = 1000
        const acceleratorBlessings = this.gameData.cubeBlessings.accelerator ?? 0
        const DRIncrease = (this.gameData.cubeUpgrades?.[45] ?? 0) / 300

        if (acceleratorBlessings < limit) {
            return Math.pow(effectPerBlessing * acceleratorBlessings, 1 + DRIncrease)
        }

        const limitMult = Math.pow(limit, 1 - DR + DRIncrease)
        return effectPerBlessing * limitMult * Math.pow(acceleratorBlessings, DR + DRIncrease)
    }

    R_calculateTotalCoinOwned = (): number => {
        if (!this.gameData) return 0
        return (
            (this.gameData.firstOwnedCoin ?? 0)
            + (this.gameData.secondOwnedCoin ?? 0)
            + (this.gameData.thirdOwnedCoin ?? 0)
            + (this.gameData.fourthOwnedCoin ?? 0)
            + (this.gameData.fifthOwnedCoin ?? 0)
        )
    }

    R_getFreeAcceleratorBoost = (): number => {
        if (!this.gameData) return 0

        const data = this.gameData
        let boost = 0

        if ((data.upgrades?.[26] ?? 0) > 0.5) {
            boost += 1
        }
        if ((data.upgrades?.[31] ?? 0) > 0.5) {
            boost += Math.floor(this.R_calculateTotalCoinOwned() / 2000)
        }
        boost += Number(this.achievement.R_AchRewards.accelBoosts())
        boost += (data.researches?.[93] ?? 0) * Math.floor(this.rune.calculateTotalRuneLevels() / 20)

        boost *= 1 + (data.researches?.[3] ?? 0) / 5 * (1 + 0.5 * this.R_CalcECC('ascension', data.challengecompletions?.[14] ?? 0))
        boost *= 1 + (data.researches?.[16] ?? 0) / 20 + (data.researches?.[17] ?? 0) / 20
        boost *= 1 + (data.researches?.[88] ?? 0) / 20
        boost *= this.antUpgrade.R_getAntUpgradeEffect(AntUpgrades.AcceleratorBoosts).acceleratorBoostMult
        boost *= 1 + (data.researches?.[127] ?? 0) / 100
        boost *= 1 + 0.008 * (data.researches?.[142] ?? 0)
        boost *= 1 + 0.006 * (data.researches?.[157] ?? 0)
        boost *= 1 + 0.004 * (data.researches?.[172] ?? 0)
        boost *= 1 + 0.002 * (data.researches?.[187] ?? 0)
        boost *= 1 + 0.0001 * (data.researches?.[200] ?? 0)
        boost *= 1 + 0.0001 * (data.cubeUpgrades?.[50] ?? 0)
        boost *= 1 + (1 / 1000) * this.R_calculateHepteractEffective('acceleratorBoost')

        if ((data.upgrades?.[73] ?? 0) > 0.5 && data.currentChallenge.reincarnation !== 0) {
            boost *= 2
        }

        return Math.min(1e100, Math.floor(boost))
    }

    R_calculateTotalAcceleratorBoost = (): number => {
        if (!this.gameData) return 0
        return Math.floor((this.gameData.acceleratorBoostBought ?? 0) + this.R_getFreeAcceleratorBoost()) * 100 / 100
    }

    R_getAcceleratorMultiplier = (): number => {
        if (!this.gameData) return 1

        const data = this.gameData
        let multiplier = 1

        multiplier *= 1 + (data.researches?.[1] ?? 0) / 5 * (1 + 0.5 * this.R_CalcECC('ascension', data.challengecompletions?.[14] ?? 0))
        multiplier *= 1 + (data.researches?.[6] ?? 0) / 20 + (data.researches?.[7] ?? 0) / 25 + (data.researches?.[8] ?? 0) / 40 + (3 / 200) * (data.researches?.[9] ?? 0) + (data.researches?.[10] ?? 0) / 200
        multiplier *= 1 + (data.researches?.[86] ?? 0) / 20
        multiplier *= 1 + (data.researches?.[126] ?? 0) / 100
        multiplier *= 1 + 0.008 * (data.researches?.[141] ?? 0)
        multiplier *= 1 + 0.006 * (data.researches?.[156] ?? 0)
        multiplier *= 1 + 0.004 * (data.researches?.[171] ?? 0)
        multiplier *= 1 + 0.002 * (data.researches?.[186] ?? 0)
        multiplier *= 1 + 0.0001 * (data.researches?.[200] ?? 0)
        multiplier *= 1 + 0.0001 * (data.cubeUpgrades?.[50] ?? 0)
        multiplier *= Math.pow(
            1.01,
            (data.upgrades?.[21] ?? 0)
            + (data.upgrades?.[22] ?? 0)
            + (data.upgrades?.[23] ?? 0)
            + (data.upgrades?.[24] ?? 0)
            + (data.upgrades?.[25] ?? 0)
        )

        if (
            (data.currentChallenge.transcension !== 0 || data.currentChallenge.reincarnation !== 0)
            && (data.upgrades?.[50] ?? 0) > 0.5
        ) {
            multiplier *= 1.25
        }

        return multiplier
    }

    R_getFreeAccelerator = (): number => {
        if (!this.gameData) return 0

        const data = this.gameData
        let accelerator = Number(this.achievement.R_AchRewards.accelerators())
        accelerator += 5 * Number(this.R_CalcECC('transcend', data.challengecompletions?.[2] ?? 0))
        accelerator += this.R_calculateTotalAcceleratorBoost() * (
            5
            + 2 * (data.researches?.[18] ?? 0)
            + 2 * (data.researches?.[19] ?? 0)
            + 3 * (data.researches?.[20] ?? 0)
            + this.R_calculateAcceleratorCubeBlessing()
        )

        if (data.unlocks?.prestige) {
            accelerator *= Number(this.rune.R_getRuneEffects('speed').multiplicativeAccelerators ?? 1)
        }

        accelerator *= this.R_getAcceleratorMultiplier()
        const viscosityPower = this.R_calculateCorruptionEffect(data.corruptions.used, 'viscosity')
        accelerator = Math.pow(
            accelerator,
            Math.min(1, (1 + (data.platonicUpgrades[6] ?? 0) / 30) * viscosityPower)
        )

        accelerator += 2000 * this.R_calculateHepteractEffective('accelerator')
        accelerator *= this.R_calculateChallenge15Reward('accelerator')
        accelerator *= 1 + 3 * this.R_calculateHepteractEffective('accelerator') / 10000
        accelerator = Math.min(1e100, Math.floor(accelerator))

        const usedLevels = data.corruptions.used.levels
        if (usedLevels.viscosity >= 15) {
            accelerator = Math.pow(accelerator, 0.2)
        }
        if (usedLevels.viscosity >= 16) {
            accelerator = 1
        }

        return accelerator
    }

    R_getAcceleratorPower = (): number => {
        if (!this.gameData) return 0

        const data = this.gameData
        const achievementBonus = Number(this.achievement.R_AchRewards.acceleratorPower())
        const transcendECC = Number(this.R_CalcECC('transcend', data.challengecompletions?.[2] ?? 0))
        const tuSevenMulti = (data.upgrades?.[46] ?? 0) > 0.5 ? 1.05 : 1

        const base = 1.1
            + (this.rune.R_getRuneEffects('speed').acceleratorPower ?? 0)
            + achievementBonus
            + transcendECC / 400
            + tuSevenMulti * (this.R_calculateTotalAcceleratorBoost() / 100) * (1 + transcendECC / 20)

        const exponent = 1 + 0.04 * this.R_CalcECC('reincarnation', data.challengecompletions?.[7] ?? 0)
        return Math.pow(base, exponent)
    }

    R_getAcceleratorEffect = (): Decimal => {
        if (!this.gameData) return new Decimal(1)

        const acceleratorPower = this.R_getAcceleratorPower()
        const totalAccelerator = (this.gameData.acceleratorBought ?? 0) + this.R_getFreeAccelerator()
        const totalMultiplier = this.gameData.multiplierBought

        const exponent = this.gameData.currentChallenge.transcension === 1
            ? totalAccelerator + totalMultiplier
            : totalAccelerator

        let effect = Decimal.pow(acceleratorPower, exponent)

        if (this.gameData.currentChallenge.reincarnation === 10) {
            effect = new Decimal(1)
        }

        return effect
    }

    R_speedRuneOOMIncrease = () => {
        return (
            (this.gameData?.upgrades[66] ?? 0) * 2
            + (this.gameData?.researches[78] ?? 0)
            + (this.gameData?.researches[111] ?? 0)
            + this.R_CalcECC('ascension', (this.gameData?.challengecompletions?.[11] ?? 0))
            + 1.5 * this.R_CalcECC('ascension', (this.gameData?.challengecompletions?.[14] ?? 0))
            + (this.gameData?.cubeUpgrades[16] ?? 0)
            + this.talisman.R_getTalismanEffects('chronos').speedOOMBonus
            + this.ambrosia.R_getAmbrosiaUpgradeEffects('ambrosiaRuneOOMBonus').runeOOMBonus
            + this.R_getLevelMilestone('speedRune')
        )
    }

    R_duplicationRuneOOMIncrease = () => {
        return (
            0.75 * this.R_CalcECC('transcend', (this.gameData?.challengecompletions?.[1] ?? 0))
            + (this.gameData?.upgrades[66] ?? 0) * 2
            + (this.gameData?.researches[90] ?? 0)
            + (this.gameData?.researches[112] ?? 0)
            + this.R_CalcECC('ascension', (this.gameData?.challengecompletions?.[11] ?? 0))
            + 1.5 * this.R_CalcECC('ascension', (this.gameData?.challengecompletions?.[14] ?? 0))
            + this.talisman.R_getTalismanEffects('exemption').duplicationOOMBonus
            + this.ambrosia.R_getAmbrosiaUpgradeEffects('ambrosiaRuneOOMBonus').runeOOMBonus
            + this.R_getLevelMilestone('duplicationRune')
        )
    }

    R_prismRuneOOMIncrease = () => {
        return (
            (this.gameData?.upgrades[66] ?? 0) * 2
            + (this.gameData?.researches[79] ?? 0)
            + (this.gameData?.researches[113] ?? 0)
            + this.R_CalcECC('ascension', (this.gameData?.challengecompletions?.[11] ?? 0))
            + 1.5 * this.R_CalcECC('ascension', (this.gameData?.challengecompletions?.[14] ?? 0))
            + (this.gameData?.cubeUpgrades[16] ?? 0)
            + this.talisman.R_getTalismanEffects('mortuus').prismOOMBonus
            + this.ambrosia.R_getAmbrosiaUpgradeEffects('ambrosiaRuneOOMBonus').runeOOMBonus
            + this.R_getLevelMilestone('prismRune')
        )
    }

    R_thriftRuneOOMIncrease = () => {
        return (
            (this.gameData?.upgrades[66] ?? 0) * 2
            + (this.gameData?.researches[77] ?? 0)
            + (this.gameData?.researches[114] ?? 0)
            + this.R_CalcECC('ascension', (this.gameData?.challengecompletions?.[11] ?? 0))
            + 1.5 * this.R_CalcECC('ascension', (this.gameData?.challengecompletions?.[14] ?? 0))
            + (this.gameData?.cubeUpgrades[37] ?? 0)
            + this.talisman.R_getTalismanEffects('midas').thriftOOMBonus
            + this.ambrosia.R_getAmbrosiaUpgradeEffects('ambrosiaRuneOOMBonus').runeOOMBonus
            + this.R_getLevelMilestone('thriftRune')
        )
    }

    R_superiorIntellectOOMIncrease = () => {
        return (
            (this.gameData?.upgrades[66] ?? 0) * 2
            + (this.gameData?.researches[115] ?? 0)
            + this.R_CalcECC('ascension', (this.gameData?.challengecompletions?.[11] ?? 0))
            + 1.5 * this.R_CalcECC('ascension', (this.gameData?.challengecompletions?.[14] ?? 0))
            + (this.gameData?.cubeUpgrades[37] ?? 0)
            + this.talisman.R_getTalismanEffects('polymath').SIOOMBonus
            + this.ambrosia.R_getAmbrosiaUpgradeEffects('ambrosiaRuneOOMBonus').runeOOMBonus
            + this.R_getLevelMilestone('SIRune')
        )
    }


    // ===== Progression =====
    R_getPrestigePointGain = (): Decimal => {
        if (!this.gameData) return new Decimal(0)

        let prestigePow = 0.5 + this.R_CalcECC('transcend', this.gameData.challengecompletions?.[5] ?? 0) / 100
        if (this.gameData.currentChallenge.transcension === 5) {
            prestigePow = 0.01
        }
        if (this.gameData.currentChallenge.reincarnation === 10) {
            prestigePow = 1e-4
        }
        prestigePow *= this.#corruptionData.deflationMultiplier[this.gameData.corruptions.used.levels.deflation] ?? 1

        let gain = Decimal.floor(
            Decimal.pow(
                (this.gameData.coinsThisPrestige ?? new Decimal(0)).dividedBy(1e12),
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
                    Decimal.pow(this.R_getAcceleratorEffect(), (1 / 3) * (this.#corruptionData.deflationMultiplier[this.gameData.corruptions.used.levels.deflation] ?? 1))
                )
            )
        }

        return gain
    }

    R_getTranscendPointGain = (): Decimal => {
        if (!this.gameData) return new Decimal(0)

        let transcendPow = 0.03
        if (this.gameData.currentChallenge.reincarnation === 10) {
            transcendPow = 0.001
        }

        let gain = Decimal.floor(
            Decimal.pow(
                (this.gameData.coinsThisTranscension ?? new Decimal(0)).dividedBy(1e100),
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

    R_getReincarnationPointGain = (): Decimal => {
        if (!this.gameData) return new Decimal(0)

        let gain = Decimal.floor(
            Decimal.pow(
                (this.gameData.transcendShards ?? new Decimal(0)).dividedBy(1e300),
                0.01
            )
        )

        if (this.gameData.currentChallenge.reincarnation !== 0) {
            gain = Decimal.pow(gain, 0.01)
        }

        gain = gain.times(Number(this.achievement.R_AchRewards.particleGain()))
        if ((this.gameData.upgrades?.[65] ?? 0) > 0.5) {
            gain = gain.times(5)
        }
        if (this.gameData.currentChallenge.ascension === 12) {
            gain = new Decimal(0)
        }

        return gain
    }

    R_calculateSynergismLevel() {
        if (!this.gameData) return 0;
        const data = this.gameData;

        let achievementPoints = 0;

        achievementPoints += this.achievement.R_achievements.reduce((sum, ach, index) => {
            return sum + (data.achievements[index] ? ach.pointValue : 0)
        }, 0)

        for (const k of Object.keys(this.R_progressiveAchievements) as ProgressiveAchievements[]) {
            const savedValue = data.progressiveAchievements[k] ?? 0;
            const effectiveValue = k === 'talismanRarities' && savedValue === 0
                ? this.talisman.calculateTalismanRarityTotal()
                : savedValue;
            achievementPoints += this.R_progressiveAchievements[k].pointsAwarded(effectiveValue);
        }

        let level: number;
        if (achievementPoints < 2500) {
            level = Math.floor(achievementPoints / 50)
        } else {
            level = 50 + Math.floor((achievementPoints - 2500) / 100)
        }

        return level
    }

    R_calculateSumOfExaltCompletions() {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'R_SumOfExaltCompletions' as keyof CalculationCache;

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

    R_calculateLimitedAscensionsDebuff() {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'R_LimitedAscensionsDebuff' as keyof CalculationCache;

        if (!data.singularityChallenges.limitedAscensions.enabled)
            return 1;

        const calculationVars: number[] = [
            data.ascensionCount,
            data.singularityChallenges.limitedAscensions.completions
        ];

        const cached = checkCalculationCache(this.#calculationCache, cacheName, calculationVars);

        if (cached !== undefined) return cached;

        let exponent = data.ascensionCount
            - Math.max(
                0,
                20 - data.singularityChallenges.limitedAscensions.completions
            )

        exponent = Math.max(0, exponent)
        const val = Math.pow(2, exponent);

        updateCalculationCache(this.#calculationCache, cacheName, { value: val, cachedBy: calculationVars });

        return val;
    }

    R_calculateEffectiveSingularities(singularityCount: number = -1): number {
        if (!this.gameData) return 0;
        const data = this.gameData;

        const cacheName = 'R_EffectiveSingularities' as keyof CalculationCache;

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

            if (data.singularityChallenges.taxmanLastStand.completions >= 8 && data.platonicUpgrades[15] === 0) {
                effectiveSingularities = Math.pow(effectiveSingularities, 3 / 2);
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

    R_calculateAscensionSpread(reduce_vals = true) {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'R_AscensionSpeedExponentSpread' as keyof CalculationCache;

        const calculationVars: number[] = [
            data.goldenQuarkUpgrades.singAscensionSpeed.level,
            data.goldenQuarkUpgrades.singAscensionSpeed2.level,
            ...this.quarkShop.getShopLevelCalculationVars('chronometerInfinity'),
        ];

        const cached = checkCalculationCache(this.#calculationCache, cacheName, calculationVars);

        if (reduce_vals && cached !== undefined) return cached;

        const vals = [
            data.goldenQuarkUpgrades.singAscensionSpeed.level > 0 ? 0.03 : 0,
            data.goldenQuarkUpgrades.singAscensionSpeed2.level * 0.001,
            this.quarkShop.getShopUpgradeEffects('chronometerInfinity', 'exponentSpread') as number
        ]

        const reduced = vals.reduce((a, b) => a + b, 0);

        updateCalculationCache(this.#calculationCache, cacheName, { value: reduced, cachedBy: calculationVars });

        return reduce_vals ? reduced : vals;
    }

    R_calculateChallenge15Reward(rewardName: keyof typeof challenge15Rewards) {
        if (!this.gameData) {
            HSLogger.errorOnce(`<red>calculateChallenge15Reward() GAMEDATA WAS NULL</red>`, this.context);
            return 0;
        }

        const exponent = this.gameData.challenge15Exponent ?? 0;
        const reward = challenge15Rewards[rewardName];
        if (exponent === 0 || exponent < reward.requirement) {
            return reward.baseValue;
        }
        return c15Functions[rewardName](exponent);
    }

    R_calculateAscensionScorePlatonicBlessing(): number {
        if (!this.gameData) return 1;

        const globalSpeedBlessing = this.gameData.platonicBlessings.globalSpeed;
        const DR1 = 1 / 4;
        const DR2 = 1 / 8;
        const limit1 = 1e4;
        const limit2 = 1e20;
        const effectPerBlessing = 1 / 1e4;

        if (globalSpeedBlessing < limit1) {
            return 1 + effectPerBlessing * globalSpeedBlessing;
        }

        if (globalSpeedBlessing < limit2) {
            const limitMult = Math.pow(limit1, 1 - DR1);
            return 1 + effectPerBlessing * limitMult * Math.pow(globalSpeedBlessing, DR1);
        }

        const limitMult1 = Math.pow(limit1, 1 - DR1);
        const limitMult2 = Math.pow(limit2, DR1 - DR2);
        return 1 + effectPerBlessing * limitMult1 * limitMult2 * Math.pow(globalSpeedBlessing, DR2);
    }

    R_calculateAscensionScore() {
        if (!this.gameData) {
            return { baseScore: 0, corruptionMultiplier: 0, bonusMultiplier: 0, effectiveScore: 0 };
        }

        const data = this.gameData;
        const corruptionMultiplier = [
            'viscosity',
            'drought',
            'deflation',
            'extinction',
            'illiteracy',
            'recession',
            'dilation',
            'hyperchallenge'
        ].reduce((product, corruption) => product * this.R_calculateCorruptionEffect(data.corruptions.used, corruption), 1);

        const challengeScoreArrays1 = [0, 8, 10, 12, 15, 20, 60, 80, 120, 180, 300];
        const challengeScoreArrays2 = [0, 10, 12, 15, 20, 30, 80, 120, 180, 300, 450];
        const challengeScoreArrays3 = [0, 20, 30, 50, 100, 200, 250, 300, 400, 500, 750];
        const challengeScoreArrays4 = [0, 10000, 10000, 10000, 10000, 10000, 2000, 3000, 4000, 5000, 7500];

        challengeScoreArrays1[1] += data.cubeUpgrades[56] ?? 0;
        challengeScoreArrays1[2] += data.cubeUpgrades[56] ?? 0;
        challengeScoreArrays1[3] += data.cubeUpgrades[56] ?? 0;

        let baseScore = 0;
        for (let i = 1; i <= 10; i++) {
            baseScore += challengeScoreArrays1[i] * data.highestchallengecompletions[i];

            if (i <= 5 && data.highestchallengecompletions[i] >= 75) {
                baseScore += challengeScoreArrays2[i] * (data.highestchallengecompletions[i] - 75);

                if (data.highestchallengecompletions[i] >= 750) {
                    baseScore += challengeScoreArrays3[i] * (data.highestchallengecompletions[i] - 750);
                }

                if (data.highestchallengecompletions[i] >= 9000) {
                    baseScore += challengeScoreArrays4[i] * (data.highestchallengecompletions[i] - 9000);
                }
            }

            if (i > 5 && data.highestchallengecompletions[i] >= 25) {
                baseScore += challengeScoreArrays2[i] * (data.highestchallengecompletions[i] - 25);

                if (data.highestchallengecompletions[i] >= 60) {
                    baseScore += challengeScoreArrays3[i] * (data.highestchallengecompletions[i] - 60);
                }
            }
        }

        baseScore += this.antUpgrade.R_getAntUpgradeEffect(AntUpgrades.AscensionScore).ascensionScoreBase;

        baseScore *= Math.pow(
            1.03
                + 0.005 * (data.cubeUpgrades[39] ?? 0)
                + 0.0025 * ((data.platonicUpgrades[5] ?? 0) + (data.platonicUpgrades[10] ?? 0)),
            data.highestchallengecompletions[10]
        );

        const challenge15ScoreBonus = this.R_calculateChallenge15Reward('score') || 1;
        const masterPackAscensionScoreMult = this.R_getGQUpgradeEffect('masterPack') || 1;
        const expertPackAscensionScoreMult = this.R_getGQUpgradeEffect('expertPack') || 1;

        const bonusMultiplier =
            challenge15ScoreBonus *
            this.R_calculateAscensionScorePlatonicBlessing() *
            this.rune.R_getRuneEffects('finiteDescent').ascensionScore *
            (1 + 0.05 * (data.cubeUpgrades[21] ?? 0)) *
            (1 + 0.05 * (data.cubeUpgrades[31] ?? 0)) *
            (1 + 0.05 * (data.cubeUpgrades[41] ?? 0)) *
            Number(this.achievement.R_AchRewards['ascensionScore']()) *
            masterPackAscensionScoreMult *
            (this.isEvent ? 1 + this.R_calculateEventSourceBuff(EventBuffType.AscensionScore) : 1);

        let effectiveScore = baseScore * corruptionMultiplier * bonusMultiplier;

        if (effectiveScore > 1e23) {
            effectiveScore = Math.pow(effectiveScore, 0.5) * Math.pow(1e23, 0.5);
        }

        effectiveScore *= expertPackAscensionScoreMult;

        return { baseScore, corruptionMultiplier, bonusMultiplier, effectiveScore };
    }

    R_calculateCubeMultiplier(): number {
        if (!this.gameData) return 1;
        const data = this.gameData;

        const cubeBank = Array.from({ length: 10 }, (_, index) => {
            const challengeIndex = index + 1;
            return (challengeIndex >= 6 ? 2 : 1) * (data.challengecompletions?.[challengeIndex] ?? 0);
        }).reduce((sum, value) => sum + value, 0) + this.antUpgrade.R_getAntUpgradeEffect(AntUpgrades.AscensionScore).cubesBanked;

        return (
            cubeBank *
            Math.pow(this.R_calculateAscensionScore().effectiveScore / 3000, 1 / 4.1) *
            Number(this.achievement.R_AchRewards['wowCubeGain']() ?? 1) *
            Number(this.talisman.R_getTalismanEffects('wowSquare').oddDimBonus ?? 1) *
            Number(this.antUpgrade.R_getAntUpgradeEffect(AntUpgrades.WowCubes).wowCubes ?? 1)
        );
    }

    R_calculateCubeMultiplierWithTau(): number {
        const cubeMultiplier = this.R_calculateCubeMultiplier();
        const tauBonus = this.R_getGQUpgradeEffect('platonicTau') || 1;
        return Math.pow(cubeMultiplier, tauBonus);
    }

    R_calculateTesseractMultiplier(): number {
        if (!this.gameData) return 1;

        return (
            Math.pow(1 + Math.max(0, this.R_calculateAscensionScore().effectiveScore - 1e5) / 1e4, 0.35) *
            Number(this.achievement.R_AchRewards['wowTesseractGain']() ?? 1) *
            Number(this.talisman.R_getTalismanEffects('wowSquare').evenDimBonus ?? 1)
        );
    }

    R_calculateHypercubeMultiplier(): number {
        if (!this.gameData) return 1;

        return (
            Math.pow(1 + Math.max(0, this.R_calculateAscensionScore().effectiveScore - 1e9) / 1e8, 0.5) *
            Number(this.achievement.R_AchRewards['wowHypercubeGain']() ?? 1) *
            Number(this.talisman.R_getTalismanEffects('wowSquare').oddDimBonus ?? 1)
        );
    }

    R_calculatePlatonicMultiplier(): number {
        if (!this.gameData) return 1;

        return (
            Math.pow(1 + Math.max(0, this.R_calculateAscensionScore().effectiveScore - 2.666e12) / 2.666e11, 0.75) *
            Number(this.achievement.R_AchRewards['wowPlatonicGain']() ?? 1) *
            Number(this.talisman.R_getTalismanEffects('wowSquare').evenDimBonus ?? 1)
        );
    }

    R_calculateHepteractMultiplier(): number {
        if (!this.gameData) return 1;

        return (
            Math.pow(1 + Math.max(0, this.R_calculateAscensionScore().effectiveScore - 1.666e16) / 3.33e16, 0.85) *
            Number(this.achievement.R_AchRewards['wowHepteractGain']() ?? 1)
        );
    }

    R_calculateRawAscensionSpeedMult(reduce_vals = true) {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'R_RawAscensionSpeedMult' as keyof CalculationCache;

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
            data.octUpgrades.octeractImprovedAscensionSpeed.level,
            data.octUpgrades.octeractImprovedAscensionSpeed2.level,
            data.singularityChallenges.limitedAscensions.completions,
            data.singularityChallenges.limitedTime.completions,
            data.shopUpgrades.shopChronometerS,
            cube59,
            data.insideSingularityChallenge ? 1 : 0
        ];

        const cached = checkCalculationCache(this.#calculationCache, cacheName, calculationVars);

        //if (cached) return cached;

        const vals: number[] = [
            // Mortuus Iterum Formicidae
            this.antUpgrade.R_getAntUpgradeEffect(AntUpgrades.Mortuus2).ascensionSpeed,
            // Polymath bonus
            this.talisman.R_getTalismanEffects('polymath').ascensionSpeedBonus,
            // Chronometer
            this.quarkShop.getShopUpgradeEffects('chronometer', 'ascensionSpeedMult') as number,
            // Chronometer2
            this.quarkShop.getShopUpgradeEffects('chronometer2', 'ascensionSpeedMult') as number,
            // Chronometer3
            this.quarkShop.getShopUpgradeEffects('chronometer3', 'ascensionSpeedMult') as number,
            // ChronosHepteract
            1 + (0.6 / 1000) * this.R_calculateHepteractEffective('chronos'),
            // PlatonicOMEGA
            1 + 0.002 * this.getCorruptionTotalLevel() * data.platonicUpgrades[15],
            // Challenge15
            this.R_calculateChallenge15Reward('ascensionSpeed'),
            // CookieUpgrade9
            1 + (1 / 400) * cube59,
            // IntermediatePack
            1 + 0.5 * (data.goldenQuarkUpgrades.intermediatePack.level > 0 ? 1 : 0),
            // ChronometerZ
            this.quarkShop.getShopUpgradeEffects('chronometerZ', 'ascensionSpeedMult') as number,
            // AbstractPhotokinetics
            1 + (+data.octUpgrades.octeractImprovedAscensionSpeed.level / 2000) * data.singularityCount,
            // AbstractExokinetics
            1 + (+data.octUpgrades.octeractImprovedAscensionSpeed2.level / 2000) * data.singularityCount,
            // ChronometerINF
            this.quarkShop.getShopUpgradeEffects('chronometerInfinity', 'ascensionSpeedMult') as number,
            // LimitedAscensions Buff
            Math.pow(
                this.getSingularityChallengeEffect('limitedAscensions', 'ascensionSpeedMult'),
                1 + Math.max(0, Math.floor(Math.log10(data.ascensionCount))),
            ),
            // Jack of all trades
            this.quarkShop.getShopUpgradeEffects('shopPanthema', 'ascensionSpeedMult') as number,
            // LimitedTimeChallenge
            this.getSingularityChallengeEffect('limitedTime', 'ascensionSpeed'),
            // ChronometerS
            this.quarkShop.getShopUpgradeEffects('shopChronometerS', 'globalSpeedMult') as number,
            // LimitedAscensionsDebuff
            1 / this.R_calculateLimitedAscensionsDebuff(),
            // SingularityDebuff
            1 / this.R_calculateSingularityDebuff('Ascension Speed'),
            // Event
            1 + this.R_calculateEventSourceBuff(EventBuffType.AscensionSpeed),
        ]

        const reduced = vals.reduce((a, b) => a * b, 1)

        updateCalculationCache(this.#calculationCache, cacheName, { value: reduced, cachedBy: calculationVars });

        return reduce_vals ? reduced : vals;
    }

    R_calculateAscensionSpeedMult() {
        let base = (this.R_calculateRawAscensionSpeedMult() as number)

        const exponentSpread = (this.R_calculateAscensionSpread() as number)

        if (base < 1) {
            base = Math.pow(base, 1 - exponentSpread)
        } else {
            base = Math.pow(base, 1 + exponentSpread)
        }

        return base;
    }


    // ===== Rune Heater =====
    private log10ExpOverCostPlus1(expStr: string, costStr: string): number {
        const parseParts = (s: string) => {
            const match = s.match(/^([\d.]+)e\+?(-?\d+)$/i)
            if (match) {
                return { m: parseFloat(match[1]), e: parseInt(match[2], 10) }
            }
            return { m: parseFloat(s), e: 0 }
        }

        const A = parseParts(expStr)
        const B = parseParts(costStr)

        const expDiff = A.e - B.e
        const mantissaRatio = A.m / B.m

        if (expDiff < 0 || (expDiff === 0 && mantissaRatio < 1)) {
            const x = mantissaRatio * Math.pow(10, expDiff)
            return Math.log10(1 + x)
        }

        return Math.log10(mantissaRatio) + expDiff
    }

    private getRuneLevelFromEXP(rune: RuneKeys, runeEXP: Decimal): number {
        const expStr = runeEXP.toString()
        const costStr = this.rune.R_runes[rune].costCoefficient.toString()
        const levelsPerOOM = this.rune.R_getLevelsPerOOM(rune)
        const log10ExpOverCostPlus1 = this.log10ExpOverCostPlus1(expStr, costStr)

        return Math.max(0, Math.floor(levelsPerOOM * log10ExpOverCostPlus1))
    }

    calculateHeaterMaxRuneExp(): number {
        if (!this.gameData) return 0

        const runeValues = [
            this.gameData.runes.speed,
            this.gameData.runes.duplication,
            this.gameData.runes.prism,
            this.gameData.runes.thrift,
            this.gameData.runes.superiorIntellect,
            this.gameData.runes.infiniteAscent,
        ]

        const maxLog = runeValues.reduce((currentMax, value) => {
            return Math.max(currentMax, value.gt(0) ? value.log10() : Number.NEGATIVE_INFINITY)
        }, Number.NEGATIVE_INFINITY)

        return Math.max(0, maxLog === Number.NEGATIVE_INFINITY ? 0 : maxLog)
    }

    R_calculateRuneEffectivenessCubeBlessing = () => {
        const DR = 1 / 16
        const effectPerBlessing = this.R_calculateRuneEffectivenessTesseractBlessing() / 10000
        const limit = 1000
        const DRIncrease = (this.gameData?.cubeUpgrades[44] ?? 0) / 1600

        if ((this.gameData?.cubeBlessings.talismanBonus ?? 0) < limit) {
            return Math.pow(1 + effectPerBlessing * (this.gameData?.cubeBlessings.talismanBonus ?? 0), 1 + DRIncrease)
        } else {
            const limitMult = Math.pow(limit, 1 - DR + DRIncrease)
            return Math.min(
                1e300,
                1 + limitMult * effectPerBlessing * Math.pow((this.gameData?.cubeBlessings.talismanBonus ?? 0), DR + DRIncrease)
            )
        }
    }

    R_calculateRuneEffectivenessTesseractBlessing = () => {
        const DR = 1 / 32
        const effectPerBlessing = this.R_calculateRuneEffectivenessHypercubeBlessing() / 1000
        const limit = 1000
        if ((this.gameData?.tesseractBlessings.talismanBonus ?? 0) < limit) {
            return 1 + effectPerBlessing * (this.gameData?.tesseractBlessings.talismanBonus ?? 0)
        } else {
            const limitMult = Math.pow(limit, 1 - DR)
            return 1 + effectPerBlessing * limitMult * Math.pow((this.gameData?.tesseractBlessings.talismanBonus ?? 0), DR)
        }
    }

    R_calculateRuneEffectivenessHypercubeBlessing = () => {
        const DR = 1 / 64
        const effectPerBlessing = this.R_calculateHypercubeBlessingMultiplierPlatonicBlessing() / 1000
        const limit = 1000
        if ((this.gameData?.hypercubeBlessings.talismanBonus ?? 0) < limit) {
            return 1 + effectPerBlessing * (this.gameData?.hypercubeBlessings.talismanBonus ?? 0)
        } else {
            const limitMult = Math.pow(limit, 1 - DR)
            return 1 + effectPerBlessing * limitMult * Math.pow((this.gameData?.hypercubeBlessings.talismanBonus ?? 0), DR)
        }
    }

    R_firstFiveEffectiveRuneLevelMult = () => {
        return this.R_firstFiveRuneEffectivenessStats.reduce((x, y) => x * y.stat(), 1)
    }

    R_SIEffectiveRuneLevelMult = () => {
        return 1 + ((this.gameData?.researches[84] ?? 0) / 200)
    }

    R_calculateSalvageRuneEXPMultiplier = (): Decimal => {
        if (!this.gameData) return new Decimal(1)

        const antSalvage = Number(this.antUpgrade.R_getAntUpgradeEffect(AntUpgrades.Salvage).salvage ?? 0)
        const achievementSalvage = Number(this.achievement.R_AchRewards.salvage())
        const totalSalvage = Math.max(0, antSalvage + achievementSalvage)
        const recycleChance = Math.min(0.95, totalSalvage / 100)

        return new Decimal(1).div(new Decimal(1).minus(recycleChance))
    }

    R_universalRuneEXPMult = (purchasedLevels: number): Decimal => {
        // recycleMult accounted for all recycle chance, but inversed so it's a multiplier instead
        const recycleMultiplier = this.R_calculateSalvageRuneEXPMultiplier()

        const allRuneExpAdditiveMultiplier = (
            // Base amount multiplied per offering
            1
            // +1 if C1 completion
            + Math.min(1, this.gameData?.highestchallengecompletions[1] ?? 0)
            // +0.10 per C1 completion
            + (0.4 / 10) * (this.gameData?.highestchallengecompletions[1] ?? 0)
            // Research 5x2
            + 0.6 * (this.gameData?.researches[22] ?? 0)
            // Research 5x3
            + 0.3 * (this.gameData?.researches[23] ?? 0)
            // Particle upgrade 3x1
            + ((this.gameData?.upgrades[71] ?? 0) * purchasedLevels) / 25
        )

        // Rune multiplier that gets applied to all runes
        const allRuneExpMultiplier = [
            // Research 4x16
            1 + (this.gameData?.researches[91] ?? 0) / 20,
            // Research 4x17
            1 + (this.gameData?.researches[92] ?? 0) / 20,
            // Cube Upgrade Bonus
            1 + ((this.gameData?.ascensionCounter ?? 0) / 1000) * (this.gameData?.cubeUpgrades[32] ?? 0),
            // Constant Upgrade Multiplier
            1 + (1 / 10) * (this.gameData?.constantUpgrades[8] ?? 0),
            // Challenge 15 reward multiplier
            this.R_calculateChallenge15Reward('runeExp')
        ].reduce((x, y) => x.times(y), new Decimal('1'))

        return allRuneExpMultiplier.times(allRuneExpAdditiveMultiplier).times(recycleMultiplier)
    }

    R_calculateCampaignRune6Bonus() {
        const cacheName = 'R_CampaignRune6Bonus' as keyof CalculationCache;

        const tokens = this.campaignData?.tokens ?? 0;

        const calculationVars: number[] = [
            tokens
        ]

        const cached = checkCalculationCache(this.#calculationCache, cacheName, calculationVars);

        if (cached !== undefined) return cached;

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


    // ===== Offering =====
    R_calculateOfferingPotionBaseOfferings = () => {
        const amount = this.R_findInsertionIndex(this.gameData?.shopPotionsConsumed?.offering ?? 0, offeringPotionThresholds)
        return {
            amount,
            toNext: amount < offeringPotionThresholds.length
                ? offeringPotionThresholds[amount] - (this.gameData?.shopPotionsConsumed?.offering ?? 0)
                : Number.POSITIVE_INFINITY
        }
    }

    R_calculateObtainiumPotionBaseObtainium = () => {
        const amount = this.R_findInsertionIndex(this.gameData?.shopPotionsConsumed?.obtainium ?? 0, obtainiumPotionThresholds)
        return {
            amount,
            toNext: amount < obtainiumPotionThresholds.length
                ? obtainiumPotionThresholds[amount] - (this.gameData?.shopPotionsConsumed?.obtainium ?? 0)
                : Number.POSITIVE_INFINITY
        }
    }

    R_calculateHypercubeBlessingMultiplierPlatonicBlessing = () => {
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

    getAmbrosiaUpgradeEffectsFreeLevelsOnly = <T extends AmbrosiaUpgradeNames>(upgradeKey: T): AmbrosiaUpgradeRewards[T] => {
        return this.ambrosia.getAmbrosiaUpgradeEffectsFreeLevelsOnly(upgradeKey)
    }


    // ===== Quark =====
    R_maxGoldenQuarkUpgradeAP = Object.values(goldenQuarkUpgradeMaxLevels).reduce((acc: number, upgrade) => {
        if (upgrade.maxLevel === -1) {
            return acc
        }
        return acc + 5
    }, 0)

    R_maxOcteractUpgradeAP = Object.values(octeractUpgradeMaxLevels).reduce((acc: number, upgrade) => {
        if (upgrade.maxLevel === -1) {
            return acc
        }
        return acc + 8
    }, 0)

    computeFreeLevelMultiplierGQ(): number {
        return Number(this.quarkShop.getShopUpgradeEffects('shopSingularityPotency', 'freeUpgradeMult')) + 0.3 / 100 * (this.gameData?.cubeUpgrades[75] ?? 0)
    }

    R_computeGQUpgradeFreeLevelSoftcap(upgradeKey: GoldenQuarkUpgradeKey): number {
        if (!this.gameData) { HSLogger.errorOnce(`<red>computeGQUpgradeFreeLevelSoftcap() GAMEDATA WAS NULL</red>`, this.context); return 0; }

        const data = this.gameData;
        const upgrade = data.goldenQuarkUpgrades[upgradeKey]
        const freeLevelMult = this.computeFreeLevelMultiplierGQ()
        const freeLevel = this.getSavedUpgradeFreeLevel(upgrade)

        const baseRealFreeLevels = freeLevelMult * freeLevel
        return Math.min(upgrade.level, baseRealFreeLevels)
            + Math.sqrt(Math.max(0, baseRealFreeLevels - upgrade.level));
    }

    R_getOcteractUpgradeEffect = (upgradeKey: OcteractUpgradeKey): number => {
        if (!this.gameData) { HSLogger.errorOnce(`<red>getOcteractUpgradeEffect() GAMEDATA WAS NULL</red>`, this.context); return 0; }

        const upgrade = octeractUpgradeMaxLevels[upgradeKey]
        const totalLevels = this.R_actualOcteractUpgradeTotalLevels(upgradeKey)

        if (!Number.isFinite(totalLevels)) { HSLogger.errorOnce(`<red>getOcteractUpgradeEffect() totalLevels invalid for ${upgradeKey}: ${totalLevels}</red>`, this.context); return 0; }

        return upgrade.effect ? upgrade.effect(totalLevels) : 0
    }

    computeFreeLevelMultiplierOCT(): number {
        return 1 + 0.3 / 100 * (this.gameData?.cubeUpgrades[78] ?? 0)
    }

    R_computeOcteractFreeLevelSoftcap = (upgradeKey: OcteractUpgradeKey): number => {
        if (!this.gameData) { HSLogger.errorOnce(`<red>computeOcteractFreeLevelSoftcap() GAMEDATA WAS NULL</red>`, this.context); return 0; }

        const data = this.gameData;
        const freeLevelMult = this.computeFreeLevelMultiplierOCT()
        const upgrade = data.octUpgrades[upgradeKey];

        if (!upgrade) { HSLogger.errorOnce(`<red>computeOcteractFreeLevelSoftcap() missing octeract upgrade ${upgradeKey}</red>`, this.context); return 0; }

        return this.getSavedUpgradeFreeLevel(upgrade) * freeLevelMult
    }

    R_actualOcteractUpgradeTotalLevels(upgradeKey: OcteractUpgradeKey): number {
        if (!this.gameData) { HSLogger.errorOnce(`<red>actualOcteractUpgradeTotalLevels() GAMEDATA WAS NULL</red>`, this.context); return 0; }

        const data = this.gameData;
        const upgrade = data.octUpgrades[upgradeKey];

        if (!upgrade) { HSLogger.errorOnce(`<red>actualOcteractUpgradeTotalLevels() missing octeract upgrade ${upgradeKey}</red>`, this.context); return 0; }
        if (data.singularityChallenges.noOcteracts.enabled || data.singularityChallenges.sadisticPrequel.enabled) { return 0; }

        const level = Number(upgrade.level ?? 0)
        const actualFreeLevels = this.R_computeOcteractFreeLevelSoftcap(upgradeKey)

        if (!Number.isFinite(level) || !Number.isFinite(actualFreeLevels)) return 0;

        if (level >= actualFreeLevels) {
            return actualFreeLevels + level
        } else {
            return 2 * Math.sqrt(actualFreeLevels * level)
        }
    }

    R_actualGQUpgradeTotalLevels(upgradeKey: GoldenQuarkUpgradeKey): number {
        if (!this.gameData) { HSLogger.errorOnce(`<red>actualGQUpgradeTotalLevels() GAMEDATA WAS NULL</red>`, this.context); return 0; }

        const data = this.gameData;
        const upgrade = goldenQuarkUpgradeMaxLevels[upgradeKey]

        if ( (data.singularityChallenges.noSingularityUpgrades.enabled || data.singularityChallenges.sadisticPrequel.enabled) && !upgrade.qualityOfLife ) { return 0 }
        if ( (data.singularityChallenges.limitedAscensions.enabled || data.singularityChallenges.limitedTime.enabled || data.singularityChallenges.sadisticPrequel.enabled) && upgradeKey === 'platonicDelta' ) { return 0 }

        const actualFreeLevels = this.R_computeGQUpgradeFreeLevelSoftcap(upgradeKey)
        const level = Number(data.goldenQuarkUpgrades[upgradeKey].level ?? 0)
        const linearLevels = level + actualFreeLevels
        let polynomialLevels = 0

        if (this.R_getOcteractUpgradeEffect('octeractImprovedFree')) {
            let exponent = 0.6
            exponent += this.R_getOcteractUpgradeEffect('octeractImprovedFree2')
            exponent += this.R_getOcteractUpgradeEffect('octeractImprovedFree3')
            exponent += this.R_getOcteractUpgradeEffect('octeractImprovedFree4')
            polynomialLevels = Math.pow(level * actualFreeLevels, exponent)
        }

        return Math.max(linearLevels, polynomialLevels)
    }

    R_getGQUpgradeEffect(upgradeKey: GoldenQuarkUpgradeKey): number {
        const upgrade = goldenQuarkUpgradeMaxLevels[upgradeKey]
        const totalLevels = this.R_actualGQUpgradeTotalLevels(upgradeKey)

        if (upgradeKey === 'favoriteUpgrade') {
            return this.calculateFavoriteUpgradeEffect(totalLevels)
        }

        return upgrade.effect ? upgrade.effect(totalLevels) : 0
    }

    calculateFavoriteUpgradeEffect(totalLevels: number): number {
        const maxedCount = this.getFavoriteUpgradeMaxedDependencyCount()
        return 1 + totalLevels / 5000 * (maxedCount + 6)
    }

    R_firstFiveFreeLevels = () => {
        return this.antUpgrade.R_getAntUpgradeEffect(AntUpgrades.FreeRunes).freeRuneLevel
            + 7 * Math.min((this.gameData?.constantUpgrades[7] ?? 0), 1000);
    }

    R_calculateAmbrosiaLuckOcteractUpgrade(reduce_vals = true) {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'R_AmbrosiaLuckOcteractUpgrade' as keyof CalculationCache;

        const calculationVars = this.getAmbrosiaLuckOcteractUpgradeCalculationDeps();

        const cached = checkCalculationCache(this.#calculationCache, cacheName, calculationVars);

        if (reduce_vals && cached !== undefined) return cached;

        const vals = [
            +data.octUpgrades.octeractAmbrosiaLuck.level * 4,
            +data.octUpgrades.octeractAmbrosiaLuck2.level * 2,
            +data.octUpgrades.octeractAmbrosiaLuck3.level * 3,
            +data.octUpgrades.octeractAmbrosiaLuck4.level * 5
        ]

        const reduced = vals.reduce((a, b) => a + b, 0);

        updateCalculationCache(this.#calculationCache, cacheName, { value: reduced, cachedBy: calculationVars });

        return reduce_vals ? reduced : vals;
    }

    R_calculateAllShopTablets(): number;
    R_calculateAllShopTablets(reduce_vals: true): number;
    R_calculateAllShopTablets(reduce_vals: false): number[];
    R_calculateAllShopTablets(reduce_vals: boolean): number | number[];
    R_calculateAllShopTablets(reduce_vals = true) {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'R_AllShopTablets' as keyof CalculationCache;

        const calculationVars: number[] = [
            data.highestSingularityCount,
            data.goldenQuarkUpgrades.singInfiniteShopUpgrades.level,
            data.octUpgrades.octeractInfiniteShopUpgrades.level,
            data.shopUpgrades.shopInfiniteShopUpgrades,
            data.redAmbrosiaUpgrades.infiniteShopUpgrades,
            ...(Object.values(data.singularityChallenges) as SingularityChallengeStatus[]).map((c) => c.completions),
            ...(data.singularityChallenges.noAmbrosiaUpgrades.enabled
                ? []
                : [
                    data.redAmbrosiaUpgrades.freeLevelsRow4,
                    data.redAmbrosiaUpgrades.freeLevelsRow5,
                    data.ambrosiaUpgrades.ambrosiaInfiniteShopUpgrades1.ambrosiaInvested,
                    data.ambrosiaUpgrades.ambrosiaInfiniteShopUpgrades2.ambrosiaInvested,
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

        const vals: number[] = [
            this.ambrosia.R_getRedAmbrosiaUpgradeEffects('infiniteShopUpgrades').freeLevels,
            dunno(),
            +data.goldenQuarkUpgrades.singInfiniteShopUpgrades.level,
            +data.octUpgrades.octeractInfiniteShopUpgrades.level,
            Math.floor(0.01 * data.shopUpgrades.shopInfiniteShopUpgrades * this.R_calculateSumOfExaltCompletions()),
            ...(data.singularityChallenges.noAmbrosiaUpgrades.enabled
                ? []
                : [
                    +this.ambrosia.R_getAmbrosiaUpgradeEffects('ambrosiaInfiniteShopUpgrades1').freeLevels,
                    +this.ambrosia.R_getAmbrosiaUpgradeEffects('ambrosiaInfiniteShopUpgrades2').freeLevels,
                ]),
        ]

        const reduced = vals.reduce((a, b) => a + b, 0);

        updateCalculationCache(this.#calculationCache, cacheName, { value: reduced, cachedBy: calculationVars });

        return reduce_vals ? reduced : vals;
    }

    private getAmbrosiaLuckOcteractUpgradeCalculationDeps(): number[] {
        if (!this.gameData) return [0];
        const data = this.gameData;

        return [
            data.octUpgrades.octeractAmbrosiaLuck.level,
            data.octUpgrades.octeractAmbrosiaLuck2.level,
            data.octUpgrades.octeractAmbrosiaLuck3.level,
            data.octUpgrades.octeractAmbrosiaLuck4.level,
        ];
    }


    // ===== Ambrosia Event =====
    R_calculateConsumableEventBuff(buff: EventBuffType) {
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

    R_calculateEventSourceBuff(buffType: EventBuffType) {
        const baseBuff = this.getVanillaGlobalEventBuff(buffType);
        const consumableBuff = this.R_calculateConsumableEventBuff(buffType);
        return baseBuff + consumableBuff;
    }

    R_calculateLeaderboardValue = (leaderboard: Array<{ elo: number; sacrificeId: number }>): number => {
        let total = 0
        const LEADERBOARD_WEIGHTS = [1, 0.8, 0.6, 0.4, 0.2]
        for (let i = 0; i < Math.min(leaderboard.length, LEADERBOARD_WEIGHTS.length); i++) {
            total += leaderboard[i].elo * LEADERBOARD_WEIGHTS[i]
        }
        return Math.floor(total)
    }

    // https://github.com/Pseudo-Corp/SynergismOfficial/blob/master/src/Calculate.ts#L2539
    R_calculateDilatedFiveLeafBonus() {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'R_DilatedFiveLeafBonus' as keyof CalculationCache;

        const calculationVars: number[] = [
            data.highestSingularityCount
        ]

        const cached = checkCalculationCache(this.#calculationCache, cacheName, calculationVars);

        if (cached !== undefined) return cached;

        const singThresholds = [100, 150, 200, 225, 250, 255, 260, 265, 269, 272]
        let val = singThresholds.length / 100;

        for (let i = 0; i < singThresholds.length; i++) {
            if (data.highestSingularityCount < singThresholds[i]) {
                val = i / 100;
                break;
            }
        }

        const reduced = val;

        updateCalculationCache(this.#calculationCache, cacheName, { value: reduced, cachedBy: calculationVars });

        return reduced;
    }

    // https://github.com/Pseudo-Corp/SynergismOfficial/blob/master/src/Calculate.ts#L2320
    R_calculateAmbrosiaLuckShopUpgrade(reduce_vals = true) {
        if (!this.gameData) return 0;
        const cacheName = 'R_AmbrosiaLuckShopUpgrade' as keyof CalculationCache;

        const calculationVars = this.getAmbrosiaLuckShopUpgradeCalculationDeps();

        const cached = checkCalculationCache(this.#calculationCache, cacheName, calculationVars);

        if (reduce_vals && cached !== undefined) return cached;

        const vals = [
            this.quarkShop.getShopUpgradeEffects('shopAmbrosiaLuck1', 'ambrosiaLuck') as number,
            this.quarkShop.getShopUpgradeEffects('shopAmbrosiaLuck2', 'ambrosiaLuck') as number,
            this.quarkShop.getShopUpgradeEffects('shopAmbrosiaLuck3', 'ambrosiaLuck') as number,
            this.quarkShop.getShopUpgradeEffects('shopAmbrosiaLuck4', 'ambrosiaLuck') as number
        ]

        const reduced = vals.reduce((a, b) => a + b, 0);

        updateCalculationCache(this.#calculationCache, cacheName, { value: reduced, cachedBy: calculationVars });

        return reduce_vals ? reduced : vals;
    }

    // https://github.com/Pseudo-Corp/SynergismOfficial/blob/master/src/Calculate.ts#L2373
    R_calculatePanthemaAmbrosiaLuck(reduce_vals = true) {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'R_PanthemaAmbrosiaLuck' as keyof CalculationCache;
        const calculationVars = this.getPanthemaAmbrosiaLuckCalculationDeps();

        const cached = checkCalculationCache(this.#calculationCache, cacheName, calculationVars);

        if (reduce_vals && cached !== undefined) return cached;

        const reduced = this.quarkShop.getShopUpgradeEffects('shopPanthema', 'ambrosiaLuck') as number;

        updateCalculationCache(this.#calculationCache, cacheName, { value: reduced, cachedBy: calculationVars });

        return reduce_vals ? reduced : reduced;
    }

    R_calculatePanthemaRedLuck(reduce_vals = true) {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'R_PanthemaRedLuck' as keyof CalculationCache;
        const calculationVars = this.getPanthemaRedLuckCalculationDeps();

        const cached = checkCalculationCache(this.#calculationCache, cacheName, calculationVars);
        if (reduce_vals && cached !== undefined) return cached;

        const reduced = this.quarkShop.getShopUpgradeEffects('shopPanthema', 'redLuck') as number;

        updateCalculationCache(this.#calculationCache, cacheName, { value: reduced, cachedBy: calculationVars });
        return reduce_vals ? reduced : reduced;
    }


    R_calculateCampaignAmbrosiaSpeedBonus() {
        const cacheName = 'R_CampaignAmbrosiaSpeedBonus' as keyof CalculationCache;

        const tokens = this.campaignData?.tokens ?? 0;

        const calculationVars: number[] = [
            tokens
        ]

        const cached = checkCalculationCache(this.#calculationCache, cacheName, calculationVars);

        if (cached !== undefined) return cached;

        let campaignBlueberrySpeedBonus;

        if (tokens < 2000) {
            campaignBlueberrySpeedBonus = 1;
        } else {
            campaignBlueberrySpeedBonus = 1 + 0.02 * 1 / 2000 * Math.min(tokens - 2000, 2000) + 0.03 * (1 - Math.exp(-Math.max(tokens - 4000, 0) / 2000))
        }

        const reduced = campaignBlueberrySpeedBonus;

        updateCalculationCache(this.#calculationCache, cacheName, { value: reduced, cachedBy: calculationVars });

        return reduced;
    }

    R_calculateCampaignLuckBonus() {
        const cacheName = 'R_CampaignLuckBonus' as keyof CalculationCache;

        const tokens = this.campaignData?.tokens ?? 0;

        const calculationVars: number[] = [
            tokens
        ]

        const cached = checkCalculationCache(this.#calculationCache, cacheName, calculationVars);

        if (cached !== undefined) return cached;

        let campaignBonus;

        if (tokens < 2000) {
            campaignBonus = 0;
        } else {
            campaignBonus = 10
                + 40 * 1 / 2000 * Math.min(tokens - 2000, 2000)
                + 50 * (1 - Math.exp(-Math.max(tokens - 4000, 0) / 2500));
        }

        const reduced = campaignBonus;

        updateCalculationCache(this.#calculationCache, cacheName, { value: reduced, cachedBy: calculationVars });

        return reduced;
    }

    // https://github.com/Pseudo-Corp/SynergismOfficial/blob/master/src/Calculate.ts#L2753
    R_calculateCookieUpgrade29Luck() {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'R_CookieUpgrade29Luck' as keyof CalculationCache;

        const cube79 = data.cubeUpgrades[79] ?? 0;

        const calculationVars = this.getCookieUpgrade29LuckCalculationDeps();

        const cached = checkCalculationCache(this.#calculationCache, cacheName, calculationVars);

        if (cached !== undefined) return cached;

        let val;

        if (data.cubeUpgrades[79] === 0 || data.lifetimeRedAmbrosia === 0) {
            val = 0;
        } else {
            val = 10 * Math.pow(Math.log10(data.lifetimeRedAmbrosia), 2)
        }

        const reduced = val;

        updateCalculationCache(this.#calculationCache, cacheName, { value: reduced, cachedBy: calculationVars });

        return reduced;
    }

    // https://github.com/Pseudo-Corp/SynergismOfficial/blob/master/src/Calculate.ts#L2652
    R_calculateAmbrosiaGenerationSpeedRaw(reduce_vals = true) {
        if (!this.gameData || !this.pseudoData || !this.meData) return 0;
        const gameData = this.gameData;
        const pseudoData = this.pseudoData;
        const meBonuses = this.meData;

        const P_GEN_BUFF_LVL = this.getPCoinUpgradeLevel('AMBROSIA_GENERATION_BUFF');
        const P_GEN_BUFF = P_GEN_BUFF_LVL ? 1 + P_GEN_BUFF_LVL * 0.05 : 1;

        const campaignBlueberrySpeedBonus = this.R_calculateCampaignAmbrosiaSpeedBonus();

        const PATREON_QUARK_BONUS = 100 * (1 + meBonuses.globalBonus / 100) * (1 + meBonuses.personalBonus / 100) - 100;

        const AMBROSIA_UNLOCKED_GATE =  gameData.singularityChallenges.noSingularityUpgrades.completions > 0 ? 1 : 0;
        const RED_AMB_GEN_1 =           this.ambrosia.R_getRedAmbrosiaUpgradeEffects('blueberryGenerationSpeed').blueberryGenerationSpeed;
        const RED_AMB_GEN_2 =           this.ambrosia.R_getRedAmbrosiaUpgradeEffects('blueberryGenerationSpeed2').blueberryGenerationSpeed;

        const ambrosiaGenerationShopUpgrade =           this.ambrosia.R_calculateAmbrosiaGenerationShopUpgrade() as number;
        const ambrosiaGenerationSingularityUpgrade =    this.ambrosia.R_calculateAmbrosiaGenerationSingularityUpgrade() as number;
        const ambrosiaGenerationOcteractUpgrade =       this.ambrosia.R_calculateAmbrosiaGenerationOcteractUpgrade() as number;
        const ambrosiaPatreonBlueberryGeneration =      1 + (this.ambrosia.R_getAmbrosiaUpgradeEffects('ambrosiaPatreon').blueberryGeneration * PATREON_QUARK_BONUS) / 100;
        const oneChallengeCap =                         this.getSingularityChallengeEffect('oneChallengeCap', 'blueberrySpeedMult');
        const noAmbrosiaUpgrades =                      this.getSingularityChallengeEffect('noAmbrosiaUpgrades', 'blueberrySpeedMult');
        const eventBlueberryTimeBuff =                  this.isEvent ? 1 + this.R_calculateEventSourceBuff(EventBuffType.BlueberryTime) : 1;
        const cookie76Bonus =                           1 + 0.01 * (gameData.cubeUpgrades[76] ?? 0) * this.ambrosia.R_calculateNumberOfThresholds();

        const vals = [
            AMBROSIA_UNLOCKED_GATE,
            P_GEN_BUFF,
            campaignBlueberrySpeedBonus,
            ambrosiaGenerationShopUpgrade,
            ambrosiaGenerationSingularityUpgrade,
            ambrosiaGenerationOcteractUpgrade,
            ambrosiaPatreonBlueberryGeneration,
            oneChallengeCap,
            noAmbrosiaUpgrades,
            RED_AMB_GEN_1,
            RED_AMB_GEN_2,
            cookie76Bonus,
            this.quarkShop.getShopUpgradeEffects('shopCashGrabUltra', 'ambrosiaGenerationMult') as number,
            eventBlueberryTimeBuff,
        ];

        const reduced = vals.reduce((a, b) => a * b, 1);

        return reduce_vals ? reduced : vals;
    }

    calculateAmbrosiaSpeed_OLD(reduce_vals = true) {
        if (!this.gameData) return 0;
        const gameData = this.gameData;

        if (!this.pseudoData) return 0;
        const pseudoData = this.pseudoData;

        if (!this.meData) return 0;
        const meBonuses = this.meData;

        // Maybe caching for these later?
        /*const cacheName = 'R_RequiredRedAmbrosiaTime' as keyof CalculationCache;
     
        const P_GEN_BUFF_LVL = this.R_getPCoinUpgradeEffect('AMBROSIA_GENERATION_BUFF');
     
        const calculationVars : number[] = [
            P_GEN_BUFF_LVL,
            this.R_calculateCampaignAmbrosiaSpeedBonus(),
        ]
     
        const cached = checkCalculationCache(this.#calculationCache, cacheName, calculationVars);
     
        if(cached) return cached;*/

        const P_GEN_BUFF_LVL = this.getPCoinUpgradeLevel('AMBROSIA_GENERATION_BUFF');
        const P_GEN_BUFF = P_GEN_BUFF_LVL ? 1 + P_GEN_BUFF_LVL * 0.05 : 1;

        const campaignBlueberrySpeedBonus = this.R_calculateCampaignAmbrosiaSpeedBonus()

        const QUARK_BONUS = 100 * (1 + meBonuses.globalBonus / 100) * (1 + meBonuses.personalBonus / 100) - 100;

        const RED_AMB_GEN_1 = this.ambrosia.R_getRedAmbrosiaUpgradeEffects('blueberryGenerationSpeed').blueberryGenerationSpeed;
        const RED_AMB_GEN_2 = this.ambrosia.R_getRedAmbrosiaUpgradeEffects('blueberryGenerationSpeed2').blueberryGenerationSpeed;
        const AMBROSIA_UNLOCKED_GATE = gameData.singularityChallenges.noSingularityUpgrades.completions > 0 ? 1 : 0;

        const cube76 = gameData.cubeUpgrades[76] ?? 1;
        const oneChallengeCap = this.getSingularityChallengeEffect('oneChallengeCap', 'blueberrySpeedMult');
        const noAmbrosiaUpgrades = this.getSingularityChallengeEffect('noAmbrosiaUpgrades', 'blueberrySpeedMult');

        const vals = [
            AMBROSIA_UNLOCKED_GATE,
            P_GEN_BUFF,
            campaignBlueberrySpeedBonus,
            (this.ambrosia.R_calculateAmbrosiaGenerationShopUpgrade() as number),
            (this.ambrosia.R_calculateAmbrosiaGenerationSingularityUpgrade() as number),
            (this.ambrosia.R_calculateAmbrosiaGenerationOcteractUpgrade() as number),
            1 + (this.ambrosia.R_getAmbrosiaUpgradeEffects('ambrosiaPatreon').blueberryGeneration * QUARK_BONUS) / 100,
            oneChallengeCap,
            noAmbrosiaUpgrades,
            RED_AMB_GEN_1,
            RED_AMB_GEN_2,
            1 + 0.01 * cube76 * this.ambrosia.R_calculateNumberOfThresholds(),
            this.quarkShop.getShopUpgradeEffects('shopCashGrabUltra', 'ambrosiaGenerationMult') as number,
            this.isEvent ? 1 + this.R_calculateEventSourceBuff(EventBuffType.BlueberryTime) : 1,
        ];

        const reduced = vals.reduce((a, b) => a * b, 1);

        return reduce_vals ? reduced : vals;
    }

    private getAmbrosiaLuckShopUpgradeCalculationDeps(): number[] {
        if (!this.gameData) return [0];
        const data = this.gameData;

        return [
            data.shopUpgrades.shopAmbrosiaLuck1,
            data.shopUpgrades.shopAmbrosiaLuck2,
            data.shopUpgrades.shopAmbrosiaLuck3,
            data.shopUpgrades.shopAmbrosiaLuck4,
            data.ambrosiaUpgrades.ambrosiaFreeLuckUpgrades.ambrosiaInvested,
            data.redAmbrosiaUpgrades.freeLevelsRow2,
            data.singularityChallenges.noAmbrosiaUpgrades.enabled ? 1 : 0,
        ];
    }

    private getPanthemaAmbrosiaLuckCalculationDeps(): number[] {
        if (!this.gameData) return [0];
        const data = this.gameData;

        return [
            data.shopUpgrades.shopPanthema,
            data.ambrosiaUpgrades.ambrosiaFreeLuckUpgrades.ambrosiaInvested,
            data.redAmbrosiaUpgrades.freeLevelsRow2,
            data.highestSingularityCount,
            data.goldenQuarkUpgrades.singInfiniteShopUpgrades.level,
            data.octUpgrades.octeractInfiniteShopUpgrades.level,
            data.shopUpgrades.shopInfiniteShopUpgrades,
            data.redAmbrosiaUpgrades.infiniteShopUpgrades,
            ...(Object.values(data.singularityChallenges) as SingularityChallengeStatus[]).map((c) => c.completions),
            ...(data.singularityChallenges.noAmbrosiaUpgrades.enabled
                ? []
                : [
                    data.redAmbrosiaUpgrades.freeLevelsRow4,
                    data.redAmbrosiaUpgrades.freeLevelsRow5,
                    data.ambrosiaUpgrades.ambrosiaInfiniteShopUpgrades1.ambrosiaInvested,
                    data.ambrosiaUpgrades.ambrosiaInfiniteShopUpgrades2.ambrosiaInvested,
                ]),
        ];
    }

    private getPanthemaRedLuckCalculationDeps(): number[] {
        if (!this.gameData) return [0];
        const data = this.gameData;

        return [
            data.shopUpgrades.shopPanthema,
            data.ambrosiaUpgrades.ambrosiaFreeRedLuckUpgrades.ambrosiaInvested,
            data.redAmbrosiaUpgrades.freeLevelsRow4,
            data.highestSingularityCount,
            data.goldenQuarkUpgrades.singInfiniteShopUpgrades.level,
            data.octUpgrades.octeractInfiniteShopUpgrades.level,
            data.shopUpgrades.shopInfiniteShopUpgrades,
            data.redAmbrosiaUpgrades.infiniteShopUpgrades,
            ...(Object.values(data.singularityChallenges) as SingularityChallengeStatus[]).map((c) => c.completions),
            ...(data.singularityChallenges.noAmbrosiaUpgrades.enabled
                ? []
                : [
                    data.redAmbrosiaUpgrades.freeLevelsRow4,
                    data.redAmbrosiaUpgrades.freeLevelsRow5,
                    data.ambrosiaUpgrades.ambrosiaInfiniteShopUpgrades1.ambrosiaInvested,
                    data.ambrosiaUpgrades.ambrosiaInfiniteShopUpgrades2.ambrosiaInvested,
                ]),
        ];
    }

    private getCookieUpgrade29LuckCalculationDeps(): number[] {
        if (!this.gameData) return [0];
        const data = this.gameData;

        return [
            data.cubeUpgrades[79] ?? 0,
            data.lifetimeRedAmbrosia,
        ];
    }

    private getAmbrosiaLuckEventBuffCalculationDeps(): number[] {
        if (!this.eventData) return [0];
        const data = this.eventData;

        return [
            this.isEvent ? 1 : 0,
            this.vanillaGlobalEvent?.ambrosiaLuck ?? 0,
            data.HAPPY_HOUR_BELL.amount,
        ];
    }

    private getCampaignLuckBonusCalculationDeps(): number[] {
        if (!this.gameData) return [0];
        const tokens = this.campaignData?.tokens ?? 0;
        return [tokens];
    }

    private getRedAmbrosiaLuckCalculationDeps(): number[] {
        if (!this.gameData || !this.pseudoData) return [0];
        const data = this.gameData;

        const pseudoLvl = this.getPCoinUpgradeLevel('RED_LUCK_BUFF');
        const pseudoLuck = pseudoLvl ? pseudoLvl * 20 : 0;

        return [
            pseudoLuck,
            ...this.getLuckCalculationDependencies(),
            data.redAmbrosiaUpgrades.redLuck,
            data.redAmbrosiaUpgrades.viscount,
            ...this.getLuckConversionCalculationDeps(),
            data.singularityChallenges.noAmbrosiaUpgrades.completions,
            data.shopUpgrades.shopRedLuck1,
            data.shopUpgrades.shopRedLuck2,
            data.shopUpgrades.shopRedLuck3,
            data.shopUpgrades.shopPanthema,
            ...this.getHorseShoeLevelCalculationDeps(),
            data.ambrosiaUpgrades.ambrosiaFreeRedLuckUpgrades.ambrosiaInvested,
            data.redAmbrosiaUpgrades.freeLevelsRow4,
            data.highestSingularityCount,
            data.goldenQuarkUpgrades.singInfiniteShopUpgrades.level,
            data.octUpgrades.octeractInfiniteShopUpgrades.level,
            data.shopUpgrades.shopInfiniteShopUpgrades,
            data.redAmbrosiaUpgrades.infiniteShopUpgrades,
            ...(Object.values(data.singularityChallenges) as SingularityChallengeStatus[]).map((c) => c.completions),
            ...(data.singularityChallenges.noAmbrosiaUpgrades.enabled
                ? []
                : [
                    data.redAmbrosiaUpgrades.freeLevelsRow4,
                    data.redAmbrosiaUpgrades.freeLevelsRow5,
                    data.ambrosiaUpgrades.ambrosiaInfiniteShopUpgrades1.ambrosiaInvested,
                    data.ambrosiaUpgrades.ambrosiaInfiniteShopUpgrades2.ambrosiaInvested,
                ]),
        ];
    }

    R_calculateRedAmbrosiaLuck(reduce_vals = true, true_base = false) {
        if (!this.gameData) return 0;
        if (!this.pseudoData) return 0;

        const data = this.gameData;
        const pseudoData = this.pseudoData;

        const cacheName = 'R_RedAmbrosiaLuck' as keyof CalculationCache;

        const pseudoLvl = this.getPCoinUpgradeLevel('RED_LUCK_BUFF');
        const pseudoLuck = pseudoLvl ? pseudoLvl * 20 : 0;
        const redLuck = this.ambrosia.R_getRedAmbrosiaUpgradeEffects('redLuck').redAmbrosiaLuck;
        const viscount = this.ambrosia.R_getRedAmbrosiaUpgradeEffects('viscount').redLuckBonus;
        const horseShoeLevel = this.rune.R_getRuneEffectiveLevel('horseShoe');
        const { additiveComponents, rawLuckComponents } = this.getLuckCalculationComponentValues(true_base);

        const calculationVars = this.getRedAmbrosiaLuckCalculationDeps();

        const cached = checkCalculationCache(this.#calculationCache, cacheName, calculationVars);

        if (reduce_vals && cached !== undefined) return cached;

        const effectiveShopRedLuck1 = this.quarkShop.R_getShopLevel('shopRedLuck1');
        const effectiveShopRedLuck2 = this.quarkShop.R_getShopLevel('shopRedLuck2');
        const effectiveShopRedLuck3 = this.quarkShop.R_getShopLevel('shopRedLuck3');
        const luckConversion = this.R_calculateLuckConversion() as number;
        const panthemaRedLuck = this.R_calculatePanthemaRedLuck();
        const synergismLevelBonus = Math.max(0, (this.R_calculateSynergismLevel() ?? 0) - 259);

        const totalLuck = additiveComponents.reduce((a, b) => a + b, 0) * rawLuckComponents.reduce((a, b) => a + b, 0);
        const vals = [
            100,
            pseudoLuck,
            synergismLevelBonus,
            Math.floor((totalLuck - 100) / luckConversion),
            redLuck,
            this.getSingularityChallengeEffect('noAmbrosiaUpgrades', 'redLuck'),
            effectiveShopRedLuck1 * 0.05,
            effectiveShopRedLuck2 * 0.075,
            effectiveShopRedLuck3 * 0.1,
            viscount,
            horseShoeLevel * 0.2,
            panthemaRedLuck,
        ]

        const reduced = vals.reduce((a, b) => a + b, 0)

        updateCalculationCache(this.#calculationCache, cacheName, { value: reduced, cachedBy: calculationVars });

        return reduce_vals ? reduced : vals;
    }


    // ===== Luck =====
    private getLuckCalculationComponentValues(true_base = false) {
        const gameData = this.getGameData();
        const pseudoData = this.getPseudoData();

        if (!gameData || !pseudoData) {
            return { additiveComponents: [0], rawLuckComponents: [0] };
        }

        const cube77 = gameData.cubeUpgrades[77] ?? 0;

        const P_BUFF_LVL = this.getPCoinUpgradeLevel('AMBROSIA_LUCK_BUFF');
        const P_BUFF = P_BUFF_LVL ? P_BUFF_LVL * 20 : 0;

        const additiveComponents: number[] = [
            1,
            this.getSingularityChallengeEffect('noSingularityUpgrades', 'additiveLuckMult'),
            this.R_calculateDilatedFiveLeafBonus(),
            this.quarkShop.getShopUpgradeEffects('shopAmbrosiaLuckMultiplier4', 'additiveAmbrosiaLuckMult'),
            this.getSingularityChallengeEffect('noAmbrosiaUpgrades', 'additiveLuckMult'),
            0.001 * cube77,
            this.isEvent ? this.R_calculateEventSourceBuff(EventBuffType.AmbrosiaLuck) : 0,
            true_base
                ? this.ambrosia.getAmbrosiaUpgradeEffectsFreeLevelsOnly('ambrosiaLuck4').ambrosiaLuckPercentage
                : this.ambrosia.R_getAmbrosiaUpgradeEffects('ambrosiaLuck4').ambrosiaLuckPercentage,
            this.ambrosia.R_getAmbrosiaUpgradeEffects('ambrosiaBrickOfLead').additiveLuckMult,          // true base ???????????????????
            this.talisman.R_getTalismanEffects('horseShoe').luckPercentage,
        ];

        const rawLuckComponents1: number[] = [
            100,
            P_BUFF,
            this.R_calculateCampaignLuckBonus(),
            this.R_calculateSingularityAmbrosiaLuckMilestoneBonus(),
            this.R_calculateAmbrosiaLuckShopUpgrade() as number,
            this.R_calculateAmbrosiaLuckSingularityUpgrade() as number,
            this.R_calculateAmbrosiaLuckOcteractUpgrade() as number,
            gameData.highestSingularityCount >= 131 ? 131 : 0,
            gameData.highestSingularityCount >= 269 ? 269 : 0,
            this.quarkShop.getShopUpgradeEffects('shopOcteractAmbrosiaLuck', 'ambrosiaLuck') as number,
            this.R_calculatePanthemaAmbrosiaLuck(),
            this.getSingularityChallengeEffect('noAmbrosiaUpgrades', 'ambrosiaLuck'),
            this.ambrosia.R_getRedAmbrosiaUpgradeEffects('regularLuck').ambrosiaLuck,
            this.ambrosia.R_getRedAmbrosiaUpgradeEffects('regularLuck2').ambrosiaLuck,
            this.ambrosia.R_getRedAmbrosiaUpgradeEffects('viscount').luckBonus,
            2 * cube77,
            this.R_calculateCookieUpgrade29Luck(),
            this.quarkShop.getShopUpgradeEffects('shopAmbrosiaUltra', 'ambrosiaLuck') as number,
            Math.max(0, ((this.R_calculateSynergismLevel() ?? 0) - 229) * 4),
            this.rune.R_getRuneEffectiveLevel('horseShoe'),
        ];

        const rawLuckComponentDetails2: number[] = [
            this.ambrosia.R_getAmbrosiaUpgradeEffects('ambrosiaLuck1').ambrosiaLuck,
            this.ambrosia.R_getAmbrosiaUpgradeEffects('ambrosiaLuck2').ambrosiaLuck,
            this.ambrosia.R_getAmbrosiaUpgradeEffects('ambrosiaLuck3').ambrosiaLuck,
            this.ambrosia.R_getAmbrosiaUpgradeEffects('ambrosiaCubeLuck1').ambrosiaLuck,
            this.ambrosia.R_getAmbrosiaUpgradeEffects('ambrosiaQuarkLuck1').ambrosiaLuck,
        ];

        const rawLuckComponentDetails2FreeLevelsOnly: number[] = [
            this.ambrosia.getAmbrosiaUpgradeEffectsFreeLevelsOnly('ambrosiaLuck1').ambrosiaLuck,
            this.ambrosia.getAmbrosiaUpgradeEffectsFreeLevelsOnly('ambrosiaLuck2').ambrosiaLuck,
            this.ambrosia.getAmbrosiaUpgradeEffectsFreeLevelsOnly('ambrosiaLuck3').ambrosiaLuck,
            this.ambrosia.getAmbrosiaUpgradeEffectsFreeLevelsOnly('ambrosiaCubeLuck1').ambrosiaLuck,
            this.ambrosia.getAmbrosiaUpgradeEffectsFreeLevelsOnly('ambrosiaQuarkLuck1').ambrosiaLuck,
        ];

        const rawLuckComponents = true_base
            ? [...rawLuckComponents1, ...rawLuckComponentDetails2FreeLevelsOnly]
            : [...rawLuckComponents1, ...rawLuckComponentDetails2];

        return { additiveComponents, rawLuckComponents };
    }

    private getLuckCalculationDependencies(true_base = false): number[] {
        if (!this.gameData || !this.getPseudoData()) return [0];
        const data = this.gameData;

        const cube77 = data.cubeUpgrades[77] ?? 0;
        const P_BUFF_LVL = this.getPCoinUpgradeLevel('AMBROSIA_LUCK_BUFF');

        return [
            1,
            data.singularityChallenges.noSingularityUpgrades.completions,
            data.highestSingularityCount,
            ...this.quarkShop.getShopLevelCalculationVars('shopAmbrosiaLuckMultiplier4'),
            data.singularityChallenges.noAmbrosiaUpgrades.completions,
            cube77,
            ...this.getAmbrosiaLuckEventBuffCalculationDeps(),
            data.ambrosiaUpgrades.ambrosiaLuck4.ambrosiaInvested,
            data.ambrosiaUpgrades.ambrosiaBrickOfLead.ambrosiaInvested,
            ...this.getHorseShoeTalismanLuckCalculationDeps(),
            P_BUFF_LVL,
            ...this.getCampaignLuckBonusCalculationDeps(),
            ...this.getSingularityAmbrosiaLuckMilestoneBonusCalculationDeps(),
            ...this.getAmbrosiaLuckShopUpgradeCalculationDeps(),
            ...this.getAmbrosiaLuckSingularityUpgradeCalculationDeps(),
            ...this.getAmbrosiaLuckOcteractUpgradeCalculationDeps(),
            ...this.quarkShop.getShopLevelCalculationVars('shopOcteractAmbrosiaLuck'),
            ...this.getPanthemaAmbrosiaLuckCalculationDeps(),
            data.redAmbrosiaUpgrades.regularLuck,
            data.redAmbrosiaUpgrades.regularLuck2,
            data.redAmbrosiaUpgrades.viscount,
            ...this.getCookieUpgrade29LuckCalculationDeps(),
            ...this.quarkShop.getShopLevelCalculationVars('shopAmbrosiaUltra'),
            ...this.getSynergismLevelCalculationDeps(),
            ...this.getHorseShoeLevelCalculationDeps(),
            ...(true_base
                ? [
                    data.ambrosiaUpgrades.ambrosiaLuck1.ambrosiaInvested,
                    data.ambrosiaUpgrades.ambrosiaLuck2.ambrosiaInvested,
                    data.ambrosiaUpgrades.ambrosiaLuck3.ambrosiaInvested,
                    data.ambrosiaUpgrades.ambrosiaCubeLuck1.ambrosiaInvested,
                    data.ambrosiaUpgrades.ambrosiaQuarkLuck1.ambrosiaInvested,
                ]
                : [
                    data.ambrosiaUpgrades.ambrosiaLuck1.ambrosiaInvested,
                    data.ambrosiaUpgrades.ambrosiaLuck2.ambrosiaInvested,
                    data.ambrosiaUpgrades.ambrosiaLuck3.ambrosiaInvested,
                    data.ambrosiaUpgrades.ambrosiaCubeLuck1.ambrosiaInvested,
                    data.ambrosiaUpgrades.ambrosiaQuarkLuck1.ambrosiaInvested,
                ]),
        ];
    }

    private getHorseShoeTalismanLuckCalculationDeps(): number[] {
        if (!this.gameData) return [0];
        const data = this.gameData;
        const horseShoe = data.talismans.horseShoe;

        return [
            data.singularityChallenges.taxmanLastStand.completions,
            horseShoe.shard.toNumber(),
            horseShoe.commonFragment.toNumber(),
            horseShoe.uncommonFragment.toNumber(),
            horseShoe.rareFragment.toNumber(),
            horseShoe.epicFragment.toNumber(),
            horseShoe.legendaryFragment.toNumber(),
            horseShoe.mythicalFragment.toNumber(),
        ];
    }

    private getLuckConversionCalculationDeps(): number[] {
        if (!this.gameData) return [0];
        const data = this.gameData;
        return [
            data.shopUpgrades.shopRedLuck1,
            data.shopUpgrades.shopRedLuck2,
            data.shopUpgrades.shopRedLuck3,
            data.redAmbrosiaUpgrades.conversionImprovement1,
            data.redAmbrosiaUpgrades.conversionImprovement2,
            data.redAmbrosiaUpgrades.conversionImprovement3,
            ...this.getHorseShoeLevelCalculationDeps(),
            data.ambrosiaUpgrades.ambrosiaFreeRedLuckUpgrades.ambrosiaInvested,
            data.redAmbrosiaUpgrades.freeLevelsRow4,
        ];
    }

    calculateLuck(reduce_vals = true, true_base = false): { luckBase: number, luckMult: number, luckTotal: number } |
    { luckBase: number[], luckMult: number[] } {
        const gameData = this.getGameData();
        const pseudoData = this.getPseudoData();
        if (!gameData || !pseudoData) return { luckBase: 0, luckMult: 0, luckTotal: 0 };

        const { additiveComponents, rawLuckComponents } = this.getLuckCalculationComponentValues(true_base);

        if (reduce_vals) {
            const additivesTotal = additiveComponents.reduce((a, b) => a + b, 0);
            const rawTotal = rawLuckComponents.reduce((a, b) => a + b, 0);
            return {
                luckBase: rawTotal,
                luckMult: additivesTotal,
                luckTotal: additivesTotal * rawTotal,
            };
        } else {
            return {
                luckBase: rawLuckComponents,
                luckMult: additiveComponents,
            };
        }
    }

    R_calculateLuckConversion(reduce_vals = true) {
        if (!this.gameData) return 0;
        const cacheName = 'R_LuckConversion' as keyof CalculationCache;

        const c1 = this.ambrosia.R_getRedAmbrosiaUpgradeEffects('conversionImprovement1').conversionImprovement;
        const c2 = this.ambrosia.R_getRedAmbrosiaUpgradeEffects('conversionImprovement2').conversionImprovement;
        const c3 = this.ambrosia.R_getRedAmbrosiaUpgradeEffects('conversionImprovement3').conversionImprovement;

        const horseShoeLevel = this.rune.R_getRuneEffectiveLevel('horseShoe');

        const calculationVars = this.getLuckConversionCalculationDeps();

        const cached = checkCalculationCache(this.#calculationCache, cacheName, calculationVars);

        if (reduce_vals && cached !== undefined) return cached;

        const effectiveShopRedLuck1 = this.quarkShop.R_getShopLevel('shopRedLuck1');
        const effectiveShopRedLuck2 = this.quarkShop.R_getShopLevel('shopRedLuck2');
        const effectiveShopRedLuck3 = this.quarkShop.R_getShopLevel('shopRedLuck3');

        const vals = [
            20,
            c1,
            c2,
            c3,
            -0.01 * Math.floor(effectiveShopRedLuck1 / 20),
            -0.01 * Math.floor(effectiveShopRedLuck2 / 20),
            -0.01 * Math.floor(effectiveShopRedLuck3 / 20),
            -0.5 * horseShoeLevel / (horseShoeLevel + 50),
        ]

        const reduced = vals.reduce((a, b) => a + b, 0)

        updateCalculationCache(this.#calculationCache, cacheName, { value: reduced, cachedBy: calculationVars });

        return reduce_vals ? reduced : vals;
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


    // ===== Deps =====
    private getHorseShoeLevelCalculationDeps(): number[] {
        if (!this.gameData) return [0];
        const data = this.gameData;

        return [
            data.runes.horseShoe.log10(),
            data.singularityChallenges.taxmanLastStand.completions,
            ...this.quarkShop.getShopLevelCalculationVars('shopHorseShoe'),
        ];
    }

    private getTalismanRarityCalculationDeps(): number[] {
        if (!this.gameData) return [0];
        const talismans = Object.values(this.gameData.talismans);

        return talismans.flatMap((shards) => [
            shards.shard.toNumber(),
            shards.commonFragment.toNumber(),
            shards.uncommonFragment.toNumber(),
            shards.rareFragment.toNumber(),
            shards.epicFragment.toNumber(),
            shards.legendaryFragment.toNumber(),
            shards.mythicalFragment.toNumber(),
        ]);
    }

    private getSynergismLevelCalculationDeps(): number[] {
        if (!this.gameData) return [0];
        const data = this.gameData;

        return [
            ...Object.values(data.achievements) as number[],
            ...Object.values(data.progressiveAchievements),
            ...this.getTalismanRarityCalculationDeps(),
        ];
    }


    async dumpDataForHeater(): Promise<HeaterExportData | undefined> {
        const gameDataModule = HSModuleManager.getModule("HSGameData") as HSGameData;

        if (gameDataModule) {
            await gameDataModule.forceUpdateAllData();
        } else {
            HSLogger.error('Failed to acquire game data for heater export', this.context);

            HSUI.Notify('Failed to acquire game data for heater export', {
                position: 'top',
                notificationType: "error"
            });

            return;
        }

        if (!this.gameData) return undefined;
        const gameData = this.gameData;
        const meData = this.meData;

        try {
            const luck =                    this.calculateLuck(true)       as { luckBase: number, luckMult: number, luckTotal: number };
            const nonAmbLuck =              this.calculateLuck(true, true) as { luckBase: number, luckMult: number, luckTotal: number };
            const ambrosiaGainChance =      (luck.luckTotal - 100 * Math.floor(luck.luckTotal / 100)) / 100;
            const trueAmbrosiaGainChance =  (nonAmbLuck.luckTotal - 100 * Math.floor(nonAmbLuck.luckTotal / 100)) / 100;
            const blueberries =             (this.ambrosia.R_calculateBlueberryInventory() as number);
            const rawAmbSpeed =             (this.R_calculateAmbrosiaGenerationSpeedRaw() as number);
            const luckConversion =          (this.R_calculateLuckConversion(true) as number);

            const runeSiFreeLevels = this.R_firstFiveFreeLevels();
            const runeSiTalismanBonus = this.talisman.R_getRuneBonusFromAllTalismans('superiorIntellect');
            const runeSiBonusLevelsTotal = new Decimal(runeSiFreeLevels + runeSiTalismanBonus);

            const baseOff = this.R_allBaseOfferingStats.reduce((a, b) => a + b.stat(), 0);

            const heaterData = {
                ...this.gameData,
                hs_data: {
                    lifetimeAmbrosia:    gameData.lifetimeAmbrosia,
                    lifetimeRedAmbrosia: gameData.lifetimeRedAmbrosia,
                    ambSpeed:            rawAmbSpeed,
                    ambSpeedMult:        0,
                    luckBase:            luck.luckBase,
                    luckMult:            luck.luckMult,
                    luckTotal:           luck.luckTotal,
                    luckBaseNonAmb:      nonAmbLuck.luckBase,
                    luckMultNonAmb:      nonAmbLuck.luckMult,
                    luckTotalNonAmb:     nonAmbLuck.luckTotal,
                    redLuckBase:        (this.R_calculateRedAmbrosiaLuck(true, true) as number),
                    luckConversion:     luckConversion,
                    quarksOwned:        Number(gameData.worlds.valueOf() || 0),
                    qHept:              gameData.hepteracts.quark.BAL,
                    cubesExp3D:         this.log10PlusOne(gameData.wowCubes),
                    cubesExp4D:         this.log10PlusOne(gameData.wowTesseracts),
                    cubesExp5D:         this.log10PlusOne(gameData.wowHypercubes),
                    cubesExp6D:         this.log10PlusOne(gameData.wowPlatonicCubes),
                    cubesExp7D:         this.log10PlusOne(gameData.wowAbyssals),
                    cubesExp8D:         this.log10PlusOne(gameData.wowOcteracts),
                    cubesExpTotal:      this.R_calculateTotalCubesExp(), // Vanilla adds +6
                    plat4x4:            gameData.platonicUpgrades[19],
                    reducedSingularity: gameData.singularityCount - (this.R_calculateSingularityReductions() as number),
                    isInsideExalt:      gameData.insideSingularityChallenge,
                    postAoag:           gameData.runes.antiquities ? 1 : 0,
                    transcription:      gameData.octUpgrades.octeractOneMindImprover.level,
                    ascSpeed:           this.R_calculateAscensionSpeedMult(),
                    ascSpread:          this.R_calculateAscensionSpread(),
                    baseObt:            this.R_allBaseObtainiumStats.reduce((a, b) => a + b.stat(), 0),
                    baseOff:            baseOff,
                    blueberries:        blueberries,
                    bonusRow2:          this.ambrosia.R_getRedAmbrosiaUpgradeEffects('freeLevelsRow2').freeLevels,
                    bonusRow3:          this.ambrosia.R_getRedAmbrosiaUpgradeEffects('freeLevelsRow3').freeLevels,
                    bonusRow4:          this.ambrosia.R_getRedAmbrosiaUpgradeEffects('freeLevelsRow4').freeLevels,
                    bonusRow5:          this.ambrosia.R_getRedAmbrosiaUpgradeEffects('freeLevelsRow5').freeLevels,
                    runeMaxExp:                 this.calculateHeaterMaxRuneExp(),
                    runeSiRC:                   this.rune.R_getLevelsPerOOM('superiorIntellect'),
                    runeSiBonusLevelsTotal:     runeSiBonusLevelsTotal,
                    runeIaBonusLevelsTotal:     new Decimal(this.getRuneBonusLevels('infiniteAscent')),
                    runeIaBonusLevelsTalisman:  new Decimal(this.talisman.R_getRuneBonusFromAllTalismans('infiniteAscent')),
                    baseTalismanPower:          new Decimal(this.talisman.R_allTalismanRuneBonusStatsSum()),
                    chronometerLevel:           this.quarkShop.R_getShopLevel('chronometerInfinity'),
                    freeShopQLevels:            this.quarkShop.getQuarkShopBonusLevels(),
                    totalVouchers:              this.R_calculateAllShopTablets(),
                    shopAmbrosiaLuck1:          gameData.shopUpgrades.shopAmbrosiaLuck1,
                    shopAmbrosiaLuck2:          gameData.shopUpgrades.shopAmbrosiaLuck2,
                    shopAmbrosiaLuck3:          gameData.shopUpgrades.shopAmbrosiaLuck3,
                    shopAmbrosiaLuck4:          gameData.shopUpgrades.shopAmbrosiaLuck4,
                    shopAmbrosiaGeneration1:    gameData.shopUpgrades.shopAmbrosiaGeneration1,
                    shopAmbrosiaGeneration2:    gameData.shopUpgrades.shopAmbrosiaGeneration2,
                    shopAmbrosiaGeneration3:    gameData.shopUpgrades.shopAmbrosiaGeneration3,
                    shopAmbrosiaGeneration4:    gameData.shopUpgrades.shopAmbrosiaGeneration4,
                    shopRedLuck1:               gameData.shopUpgrades.shopRedLuck1,
                    shopRedLuck2:               gameData.shopUpgrades.shopRedLuck2,
                    shopRedLuck3:               gameData.shopUpgrades.shopRedLuck3,
                    singQuarkHepteract1:        gameData.goldenQuarkUpgrades.singQuarkHepteract.level,
                    singQuarkHepteract2:        gameData.goldenQuarkUpgrades.singQuarkHepteract2.level,
                    singQuarkHepteract3:        gameData.goldenQuarkUpgrades.singQuarkHepteract3.level,
                    octeractImprovedQuarkHept:  gameData.octUpgrades.octeractImprovedQuarkHept.level,
                    shopImproveQuarkHept1:      gameData.shopUpgrades.improveQuarkHept,
                    shopImproveQuarkHept2:      gameData.shopUpgrades.improveQuarkHept2,
                    shopImproveQuarkHept3:      gameData.shopUpgrades.improveQuarkHept3,
                    shopImproveQuarkHept4:      gameData.shopUpgrades.improveQuarkHept4,
                    shopImproveQuarkHept5:      gameData.shopUpgrades.improveQuarkHept5,
                    jack:                       gameData.shopUpgrades.shopPanthema > 0,
                    // Not Heater
                    tokens:                 this.campaignData?.tokens,
                    maxTokens:              this.campaignData?.maxTokens,
                    isAtMaxTokens:          this.campaignData?.isAtMaxTokens,
                    isEvent:                this.isEvent,
                    bellStacks:             this.eventData?.HAPPY_HOUR_BELL.amount,
                    personalQuarkBonus:     this.meData?.bonus.quarks,
                    blueAmbrosiaBarValue:   gameData.blueberryTime,
                    redAmbrosiaBarValue:    gameData.redAmbrosiaTime,
                    blueAmbrosiaBarMax:     this.ambrosia.R_calculateRequiredBlueberryTime(),
                    redAmbrosiaBarMax:      this.ambrosia.R_calculateRequiredRedAmbrosiaTime(),
                    ambrosiaGainChance:       ambrosiaGainChance,
                    trueAmbrosiaGainChance:   trueAmbrosiaGainChance,
                    ambrosiaAcceleratorCount: gameData.shopUpgrades.shopAmbrosiaAccelerator,
                    pseudoCoinUpgrades: {
                        ambrosiaGenerationBuffLevel:    this.getPCoinUpgradeLevel('AMBROSIA_GENERATION_BUFF'),
                        ambrosiaLuckBuffLevel:          this.getPCoinUpgradeLevel('AMBROSIA_LUCK_BUFF'),
                        baseObtainiumBuffLevel:         this.getPCoinUpgradeLevel('BASE_OBTAINIUM_BUFF'),
                        baseOfferingBuffLevel:          this.getPCoinUpgradeLevel('BASE_OFFERING_BUFF'),
                        cubeBuffLevel:                  this.getPCoinUpgradeLevel('CUBE_BUFF'),
                        redAmbrosiaGenerationBuffLevel: this.getPCoinUpgradeLevel('RED_GENERATION_BUFF'),
                        redAmbrosiaLuckBuffLevel:       this.getPCoinUpgradeLevel('RED_LUCK_BUFF'),
                    },
                    redAmbrosiaUpgrades: {
                        tutorial:                   this.ambrosia.R_calculateRedAmbrosiaUpgradeValue('tutorial'),
                        conversionImprovement1:     this.ambrosia.R_calculateRedAmbrosiaUpgradeValue('conversionImprovement1'),
                        conversionImprovement2:     this.ambrosia.R_calculateRedAmbrosiaUpgradeValue('conversionImprovement2'),
                        conversionImprovement3:     this.ambrosia.R_calculateRedAmbrosiaUpgradeValue('conversionImprovement3'),
                        freeTutorialLevels:         this.ambrosia.R_calculateRedAmbrosiaUpgradeValue('freeTutorialLevels'),
                        freeLevelsRow2:             this.ambrosia.R_calculateRedAmbrosiaUpgradeValue('freeLevelsRow2'),
                        freeLevelsRow3:             this.ambrosia.R_calculateRedAmbrosiaUpgradeValue('freeLevelsRow3'),
                        freeLevelsRow4:             this.ambrosia.R_calculateRedAmbrosiaUpgradeValue('freeLevelsRow4'),
                        freeLevelsRow5:             this.ambrosia.R_calculateRedAmbrosiaUpgradeValue('freeLevelsRow5'),
                        blueberryGenerationSpeed:   this.ambrosia.R_calculateRedAmbrosiaUpgradeValue('blueberryGenerationSpeed'),
                        regularLuck:                this.ambrosia.R_calculateRedAmbrosiaUpgradeValue('regularLuck'),
                        redGenerationSpeed:         this.ambrosia.R_calculateRedAmbrosiaUpgradeValue('redGenerationSpeed'),
                        redLuck:                    this.ambrosia.R_calculateRedAmbrosiaUpgradeValue('redLuck'),
                        redAmbrosiaCube:            this.ambrosia.R_calculateRedAmbrosiaUpgradeValue('redAmbrosiaCube'),
                        redAmbrosiaObtainium:       this.ambrosia.R_calculateRedAmbrosiaUpgradeValue('redAmbrosiaObtainium'),
                        redAmbrosiaOffering:        this.ambrosia.R_calculateRedAmbrosiaUpgradeValue('redAmbrosiaOffering'),
                        redAmbrosiaCubeImprover:    this.ambrosia.R_calculateRedAmbrosiaUpgradeValue('redAmbrosiaCubeImprover'),
                        viscount:                   this.ambrosia.R_calculateRedAmbrosiaUpgradeValue('viscount'),
                        infiniteShopUpgrades:       this.ambrosia.R_calculateRedAmbrosiaUpgradeValue('infiniteShopUpgrades'),
                        redAmbrosiaAccelerator:     this.ambrosia.R_calculateRedAmbrosiaUpgradeValue('redAmbrosiaAccelerator'),
                        regularLuck2:               this.ambrosia.R_calculateRedAmbrosiaUpgradeValue('regularLuck2'),
                        blueberryGenerationSpeed2:  this.ambrosia.R_calculateRedAmbrosiaUpgradeValue('blueberryGenerationSpeed2'),
                        salvageYinYang:             this.ambrosia.R_calculateRedAmbrosiaUpgradeValue('salvageYinYang'),
                        blueberries:                this.ambrosia.R_calculateRedAmbrosiaUpgradeValue('blueberries'),
                        redAmbrosiaFreeAccumulator: this.ambrosia.R_calculateRedAmbrosiaUpgradeValue('redAmbrosiaFreeAccumulator'),
                        freeOfferingUpgrades:       this.ambrosia.R_calculateRedAmbrosiaUpgradeValue('freeOfferingUpgrades'),
                        freeObtainiumUpgrades:      this.ambrosia.R_calculateRedAmbrosiaUpgradeValue('freeObtainiumUpgrades'),
                        freeCubeUpgrades:           this.ambrosia.R_calculateRedAmbrosiaUpgradeValue('freeCubeUpgrades'),
                        freeSpeedUpgrades:          this.ambrosia.R_calculateRedAmbrosiaUpgradeValue('freeSpeedUpgrades'),
                    },
                    me_data: {
                        personalBonus:  meData?.personalBonus,
                        globalBonus:    meData?.globalBonus,
                        bonus:          meData?.bonus,
                    }
                }
            }

            return heaterData as any;
        } catch (err) {
            const errorMsg = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
            HSLogger.error(`Failed to calculate game data for heater export\n${errorMsg}`, this.context);
            HSUI.Notify('Failed to calculate game data for heater export', { position: 'top', notificationType: "error" });
            return undefined;
        }
    }
}
