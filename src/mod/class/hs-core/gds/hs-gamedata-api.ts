import { EventBuffType, ConsumableGameEvents } from "../../../types/data-types/hs-event-data";
import { AchievementRewards, AntProducers, AntUpgrades, CalculationCache, CalculationMode, CachedValue, GoldenQuarkUpgradeKey, HepteractType, LAST_ANT_PRODUCER, OcteractUpgradeKey, RedAmbrosiaUpgradeKey, ProgressiveAchievement, ProgressiveAchievements, SingularityChallengeDataKeys, SingularityDebuffs, PCoinUpgradeEffects, NumberStatLine, RuneKeys, TalismanKeys, SynergismLevelMilestones, FAVORITE_UPGRADE_GQ_DEPENDENCIES, FAVORITE_UPGRADE_OCTERACT_DEPENDENCIES, FAVORITE_UPGRADE_RED_AMBROSIA_DEPENDENCIES, offeringPotionThresholds, obtainiumPotionThresholds } from "../../../types/data-types/hs-gamedata-api-types";
import type { GameData, SingularityChallengeRewards, SingularityChallengeStatus, CorruptionLevels } from "../../../types/data-types/hs-player-savedata";
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
import { GoldenQuarkHelper } from "./hs-gamedata-api-goldenQuark";
import { OcteractHelper } from "./hs-gamedata-api-octeract";
import { LuckHelper } from "./hs-gamedata-api-luck";
import type { ShopUpgradeHelperContext, AntUpgradeHelperContext, TalismanHelperContext, RuneHelperContext, AchievementHelperContext, AmbrosiaHelperContext, AcceleratorHelperContext } from "../../../types/data-types/hs-gamedata-api-types";
import type { GoldenQuarkHelperContext } from "./hs-gamedata-api-goldenQuark";
import type { OcteractHelperContext } from "./hs-gamedata-api-octeract";
import type { LuckHelperContext } from "./hs-gamedata-api-luck";
import { checkCalculationCache, updateCalculationCache, clearCalculationCache, dumpCalculationCache, createCalculationCache } from "./hs-gamedata-api-cache";
import { AcceleratorHelper } from "./hs-gamedata-api-accelerator";
import { octeractUpgradeMaxLevels, goldenQuarkUpgradeMaxLevels, c15Functions, challenge15Rewards, hepteractEffectiveValues, synergismLevelMilestones, SINGULARITY_CHALLENGE_DATA } from "./stored-vars-and-calculations";
import { parseGameDataDecimal, calcECC, calculateSigmoidExponential, findInsertionIndex } from "./hs-gamedata-utils";
import Decimal from "break_infinity.js";

type AscensionScoreResult = {
    baseScore: number;
    corruptionMultiplier: number;
    bonusMultiplier: number;
    effectiveScore: number;
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
 *   (*) All of the  methods are ripped from the game's code
*/
export class HSGameDataAPI extends HSGameDataAPIPartial {
    #calculationCache: CalculationCache = {} as CalculationCache;

    singularityChallengeData: typeof SINGULARITY_CHALLENGE_DATA = SINGULARITY_CHALLENGE_DATA;

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
    readonly goldenQuark: GoldenQuarkHelper;
    readonly octeract: OcteractHelper;
    readonly luck: LuckHelper;
    readonly accelerator: AcceleratorHelper;

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
        super._updateGameData(data);
        this.clearCache();
    }

    override _updateMeData(data: MeData) {
        super._updateMeData(data);
        this.clearCache();
    }

    override _updatePseudoData(data: PseudoGameData) {
        super._updatePseudoData(data);
        this.clearCache();
    }

    override _updateCampaignData(data: CampaignData) {
        super._updateCampaignData(data);
        this.clearCache();
    }

    override _updateEventData(data: ConsumableGameEvents) {
        super._updateEventData(data);
        this.clearCache();
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
            stat: () => 1 + (this.gameData?.researches[4] ?? 0) / 10 * (1 + calcECC('ascension', (this.gameData?.challengecompletions?.[14] ?? 0))),
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

        const talismanRuneBonuses = this.talisman.getRuneBonusFromAllTalismansBatch();

        switch (rune) {
            case 'speed': {
                return (
                    talismanRuneBonuses.speed
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
                    talismanRuneBonuses.duplication
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
            getShopUpgradeEffects: (upgradeKey, effectKey, mode) => quarkShop.getShopUpgradeEffects(upgradeKey as any, effectKey as any, mode),
            getSingularityChallengeEffect: (challengeKey, effectKey) => this.getSingularityChallengeEffect(challengeKey as any, effectKey as any),
            getAmbrosiaUpgradeEffects: (upgradeKey: string, mode?: CalculationMode) => this.ambrosia.getAmbrosiaUpgradeEffects(upgradeKey as any, mode),
            getRedAmbrosiaUpgradeEffects: (upgradeKey: string) => this.ambrosia.getRedAmbrosiaUpgradeEffects(upgradeKey as any),
            getPCoinUpgradeLevel: (upgradeName: string) => this.getPCoinUpgradeLevel(upgradeName as any),
            getCampaignTokens: () => this.campaignData?.tokens ?? 0,
            getEventBellAmount: () => this.eventData?.HAPPY_HOUR_BELL.amount ?? 0,
            isEvent: this.isEvent,
            calculateEventSourceBuff: (buffType: EventBuffType) => this.calculateEventSourceBuff(buffType),
            checkCalculationCache: cacheProvider.checkCalculationCache,
            updateCalculationCache: cacheProvider.updateCalculationCache,
        };
        ambrosia = this.registerCalculationHelper(new AmbrosiaHelper(ambrosiaContext));
        this.ambrosia = ambrosia;
        this.#calculationCache = createCalculationCache(this.ambrosia);

        const quarkShopContext: ShopUpgradeHelperContext = {
            getGameData: () => this.gameData,
            getPCoinUpgradeLevel: (upgradeName) => this.getPCoinUpgradeLevel(upgradeName as any),
            getShopUpgradeTypeBonusLevels: (type) => quarkShop.getShopUpgradeTypeBonusLevels(type),
            getShopUpgradeEffects: (upgradeKey, effectKey, mode) => quarkShop.getShopUpgradeEffects(upgradeKey as any, effectKey as any, mode),
            getSingularityChallengeEffect: (challengeKey, effectKey) => this.getSingularityChallengeEffect(challengeKey as any, effectKey as any),
            getAmbrosiaUpgradeEffects: (upgradeName, mode) => ambrosia.getAmbrosiaUpgradeEffects(upgradeName as any, mode),
            getRuneEffectiveLevel: (runeName) => rune.getRuneEffectiveLevel(runeName),
            getRuneEffects: (runeName) => rune.getRuneEffects(runeName),
            getRedAmbrosiaUpgradeEffects: (upgradeKey) => ambrosia.getRedAmbrosiaUpgradeEffects(upgradeKey as any),
            calculateSumOfExaltCompletions: () => this.calculateSumOfExaltCompletions(),
            calculateFreeShopInfinityUpgrades: (reduce_vals: boolean) => this.calculateAllShopTablets(reduce_vals) as number[],
            checkCalculationCache: cacheProvider.checkCalculationCache,
            updateCalculationCache: cacheProvider.updateCalculationCache,
        };
        quarkShop = this.registerCalculationHelper(new ShopUpgradeHelper(quarkShopContext));
        this.quarkShop = quarkShop;

        const octeractContext: OcteractHelperContext = {
            getGameData: () => this.gameData,
            getSavedUpgradeFreeLevel: (upgrade) => this.getSavedUpgradeFreeLevel(upgrade),
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
            getAchievementReward: (rewardName) => achievement.AchRewards[rewardName as AchievementRewards](),
            calculateSigmoidExponential,
            calculateChallenge15Reward: (rewardName) => this.calculateChallenge15Reward(rewardName as any),
            calculateCorruptionEffect: (loadout, corruption) => this.calculateCorruptionEffect(loadout, corruption),
            CalcECC: (refinement, value) => calcECC(refinement as any, value),
            checkCalculationCache: cacheProvider.checkCalculationCache,
            updateCalculationCache: cacheProvider.updateCalculationCache,
        };
        antUpgrade = this.registerCalculationHelper(new AntUpgradeHelper(antUpgradeContext));
        this.antUpgrade = antUpgrade;

        const talismanContext: TalismanHelperContext = {
            getGameData: () => this.gameData,
            getSingularityChallengeEffect: (challengeKey, effectKey) => this.getSingularityChallengeEffect(challengeKey as any, effectKey as any),
            getPCoinUpgradeLevel: (upgradeName) => this.getPCoinUpgradeLevel(upgradeName as any),
            isShopTalismanUnlocked: () => quarkShop.getShopUpgradeEffects('shopTalisman', 'unlocked') as boolean,
            getAchievementReward: (rewardName) => achievement.AchRewards[rewardName as AchievementRewards](),
            getGQUpgradeEffect: (upgradeKey) => this.getGQUpgradeEffect(upgradeKey as any) as number | undefined,
            getAmbrosiaUpgradeEffects: (upgradeKey) => ambrosia.getAmbrosiaUpgradeEffects(upgradeKey as any),
            getAntUpgradeEffectValue: (upgradeKey, property) => antUpgrade.getAntUpgradeEffectValue(upgradeKey as any, property as any),
            getLevelMilestone: (name) => this.getLevelMilestone(name as any),
            getOcteractUpgradeEffect: (upgradeKey) => this.getOcteractUpgradeEffect(upgradeKey as any) as number | undefined,
            CalcECC: (refinement, value) => calcECC(refinement as any, value),
            calculateChallenge15Reward: (rewardName) => this.calculateChallenge15Reward(rewardName as any),
            checkCalculationCache: cacheProvider.checkCalculationCache,
            updateCalculationCache: cacheProvider.updateCalculationCache,
        };
        talisman = this.registerCalculationHelper(new TalismanHelper(talismanContext));
        this.talisman = talisman;

        const runeContext: RuneHelperContext = {
            getGameData: () => this.gameData,
            getPCoinUpgradeLevel: (upgradeName) => this.getPCoinUpgradeLevel(upgradeName as any),
            getSingularityChallengeEffect: (challengeKey, effectKey) => this.getSingularityChallengeEffect(challengeKey as any, effectKey as any),
            getRuneBonusLevels: (runeName) => this.getRuneBonusLevels(runeName),
            getRuneEffects: (runeName) => rune.getRuneEffects(runeName),
            getAchievementReward: (rewardName) => achievement.AchRewards[rewardName as AchievementRewards](),
            getAmbrosiaUpgradeEffects: (upgradeKey) => ambrosia.getAmbrosiaUpgradeEffects(upgradeKey as any),
            getAntUpgradeEffectValue: (upgradeKey, property) => antUpgrade.getAntUpgradeEffectValue(upgradeKey as any, property as any),
            getLevelMilestone: (name) => this.getLevelMilestone(name as any),
            CalcECC: (refinement, value) => calcECC(refinement as any, value),
            firstFiveFreeLevels: () => this.firstFiveFreeLevels(),
            firstFiveEffectiveRuneLevelMult: () => this.firstFiveEffectiveRuneLevelMult(),
            getTalismanEffects: (t, rarity) => talisman.getTalismanEffects(t as any, rarity),
            calculateHypercubeBlessingMultiplierPlatonicBlessing: () => this.calculateHypercubeBlessingMultiplierPlatonicBlessing(),
            calculateChallenge15Reward: (rewardName) => this.calculateChallenge15Reward(rewardName as any),
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
            calcCorruptionStuff: () => this.calcCorruptionStuff(),
            calculateChallenge15Reward: (rewardName) => this.calculateChallenge15Reward(rewardName as any),
            calculateSynergismLevel: () => this.calculateSynergismLevel(),
            calculateAscensionScore: () => this.calculateAscensionScore(),
            checkCalculationCache: cacheProvider.checkCalculationCache,
            updateCalculationCache: cacheProvider.updateCalculationCache,
        };
        achievement = this.registerCalculationHelper(new AchievementHelper(achievementContext));
        this.achievement = achievement;

        const luckContext: LuckHelperContext = {
            getGameData: () => this.gameData,
            isEvent: this.isEvent,
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
            checkCalculationCache: cacheProvider.checkCalculationCache,
            updateCalculationCache: cacheProvider.updateCalculationCache,
            getCampaignTokens: () => this.campaignData?.tokens ?? 0,
            getVanillaGlobalEventAmbrosiaLuck: () => this.vanillaGlobalEvent?.ambrosiaLuck ?? 0,
            getEventBellAmount: () => this.eventData?.HAPPY_HOUR_BELL.amount ?? 0,
        };
        luck = this.registerCalculationHelper(new LuckHelper(luckContext));
        this.luck = luck;

        const acceleratorContext: AcceleratorHelperContext = {
            getGameData: () => this.gameData,
            getAchievementReward: (rewardName) => achievement.AchRewards[rewardName as AchievementRewards](),
            getAntUpgradeEffectValue: (upgradeKey, property) => antUpgrade.getAntUpgradeEffectValue(upgradeKey as any, property as any),
            calculateTotalRuneLevels: () => rune.calculateTotalRuneLevels(),
            getRuneEffects: (runeName) => rune.getRuneEffects(runeName),
            calculateHypercubeBlessingMultiplierPlatonicBlessing: () => this.calculateHypercubeBlessingMultiplierPlatonicBlessing(),
            calculateHepteractEffective: (type) => this.calculateHepteractEffective(type),
            calculateCorruptionEffect: (loadout, corruption) => this.calculateCorruptionEffect(loadout, corruption),
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

    private log10PlusOne(value: number | Decimal): number {
        return Math.floor(Math.log10(Number(value ?? 0) + 1));
    }

    private totalWowLog10(): number {
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

    getLevelMilestone(name: SynergismLevelMilestones): number {
        if (!this.gameData) return 0;
        const milestone = synergismLevelMilestones[name];
        const level = this.calculateSynergismLevel();
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
            const maxLevel = this.ambrosia.redAmbrosiaUpgradeCalculationCollection[key].maxLevel
            return count + (this.ambrosia.calculateRedAmbrosiaUpgradeValue(key) >= maxLevel ? 1 : 0)
        }, 0)

        return goldenQuarkMaxed + octeractMaxed + redAmbrosiaMaxed
    }

    getVanillaGlobalEventBuff(buffType: EventBuffType): number {
        const event = this.vanillaGlobalEvent;
        if (!event) return 0;

        const hasOneMindUpgrade = this.getGQUpgradeEffect('oneMind') > 0;

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
            data.wowCubes,
            data.wowTesseracts,
            data.wowHypercubes,
            data.wowPlatonicCubes,
            data.wowAbyssals,
            data.wowOcteracts
        ]

        const cached = checkCalculationCache(this.#calculationCache, cacheName, calculationVars);

        if (cached !== undefined) return cached;

        const reduced = this.totalWowLog10();

        updateCalculationCache(this.#calculationCache, cacheName, { value: reduced, cachedBy: calculationVars });

        return reduced;
    }

    getCorruptionTotalLevel() {
        if (!this.gameData) return 0;
        const data = this.gameData;

        const corruptions = data.corruptions.used;
        const sum = Object.values(corruptions).reduce((a, b) => a + b, 0);
        return sum;
    }

    calculateHepteractEffective = (heptType: HepteractType) => {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'HepteractEffective' as keyof CalculationCache;

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

    calcCorruptionStuff() {
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

        const scores = this.calculateAscensionScore();
        const cubeGain = this.calculateCubeMultiplierWithTau();

        let tesseractGain = 1;
        if (scores.effectiveScore >= 100000) {
            tesseractGain += 0.5;
        }
        tesseractGain *= this.calculateTesseractMultiplier();

        let hypercubeGain = scores.effectiveScore >= 1e9 ? 1 : 0;
        hypercubeGain *= this.calculateHypercubeMultiplier();

        let platonicGain = scores.effectiveScore >= 2.666e12 ? 1 : 0;
        platonicGain *= this.calculatePlatonicMultiplier();

        let hepteractGain = challenge15Rewards.hepteractsUnlocked.value && scores.effectiveScore >= 1.666e17 ? 1 : 0;
        hepteractGain *= this.calculateHepteractMultiplier();

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

    calculateCorruptionEffect(loadout: CorruptionLevels, corruption: string): number {
        if (!this.gameData) return 0;

        const data = this.gameData;

        switch (corruption) {
            case 'deflation':
                return this.#corruptionData.deflationMultiplier[loadout.deflation];
            case 'dilation':
                return this.#corruptionData.dilationMultiplier[loadout.dilation];
            case 'drought': {
                let baseSalvageReduction = this.#corruptionData.droughtSalvage[loadout.drought];
                if (data.platonicUpgrades[13] > 0) {
                    baseSalvageReduction *= 0.5;
                }
                return baseSalvageReduction;
            }
            case 'extinction':
                return this.#corruptionData.extinctionDivisor[loadout.extinction];
            case 'hyperchallenge': {
                const baseEffect = this.#corruptionData.hyperchallengeMultiplier[loadout.hyperchallenge];
                let divisor = 1;
                divisor *= 1 + 2 / 5 * data.platonicUpgrades[8];
                return Math.max(1, baseEffect / divisor);
            }
            case 'illiteracy': {
                const base = this.#corruptionData.illiteracyPower[loadout.illiteracy];
                const obtainiumValue = Number(data.obtainium);
                const multiplier = (obtainiumValue > 0)
                    ? 1 + (1 / 100) * data.platonicUpgrades[9] * Math.min(100, Math.log10(obtainiumValue))
                    : 1;
                return Math.min(base * multiplier, 1);
            }
            case 'recession':
                return this.#corruptionData.recessionPower[loadout.recession];
            case 'viscosity': {
                const base = this.#corruptionData.viscosityPower[loadout.viscosity];
                const multiplier = 1 + data.platonicUpgrades[6] / 30;
                return Math.min(base * multiplier, 1);
            }
            default:
                return 1;
        }
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
                maxPointValue: this.maxOcteractUpgradeAP,
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

    calculateSingularityAmbrosiaLuckMilestoneBonus() {
        if (!this.gameData) return 0;
        const data = this.gameData;
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

        return reduced;
    }

    calculateAmbrosiaLuckSingularityUpgrade(reduce_vals = true) {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const vals = [
            +data.goldenQuarkUpgrades.singAmbrosiaLuck.level * 4,
            +data.goldenQuarkUpgrades.singAmbrosiaLuck2.level * 2,
            +data.goldenQuarkUpgrades.singAmbrosiaLuck3.level * 3,
            +data.goldenQuarkUpgrades.singAmbrosiaLuck4.level * 5
        ]

        const reduced = vals.reduce((a, b) => a + b, 0);

        return reduce_vals ? reduced : vals;
    }

    calculateSingularityReductions(reduce_vals = true, true_base = false) {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = (`SingularityReductions${true_base ? '_TRUE_BASE' : ''}`) as keyof CalculationCache;

        const calculationVars: number[] = [
            data.insideSingularityChallenge ? 1 : 0,
            data.ambrosiaUpgrades.ambrosiaSingReduction2.ambrosiaInvested,
            data.ambrosiaUpgrades.ambrosiaSingReduction1.ambrosiaInvested,
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

        const vals = [
            this.quarkShop.getShopUpgradeEffects('shopSingularityPenaltyDebuff', 'singularityPenaltyReducers') as number,
            redu
        ]

        const reduced = vals.reduce((a, b) => a + b, 0)

        updateCalculationCache(this.#calculationCache, cacheName, { value: reduced, cachedBy: calculationVars });

        return reduce_vals ? reduced : vals;
    }

    calculateSingularityDebuff(debuff: SingularityDebuffs, singularityCount: number = -1) {
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
        const shopPenalty = this.quarkShop.getShopUpgradeEffects('shopHorseShoe', 'singularityPenaltyMult') as number;
        const cacheName = 'SingularityDebuff' as keyof CalculationCache;
        const calculationVars = [
            debuffIndex,
            resolvedSingularityCount,
            reduction,
            shopPenalty,
        ];

        return this.memoizeCalculation<number>(cacheName, calculationVars, () => {
            if (resolvedSingularityCount === 0) {
                return debuff === 'Salvage' || debuff === 'Ant ELO' ? 0 : 1;
            }

            if (parseGameDataDecimal(data.runes.antiquities).gt(0)) {
                return debuff === 'Salvage' || debuff === 'Ant ELO' ? 0 : 1;
            }

            const constitutiveSingularityCount = resolvedSingularityCount - reduction;
            if (constitutiveSingularityCount < 1) {
                return 1;
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

        let prestigePow = 0.5 + calcECC('transcend', this.gameData.challengecompletions?.[5] ?? 0) / 100
        if (this.gameData.currentChallenge.transcension === 5) {
            prestigePow = 0.01
        }
        if (this.gameData.currentChallenge.reincarnation === 10) {
            prestigePow = 1e-4
        }
        prestigePow *= this.#corruptionData.deflationMultiplier[this.gameData.corruptions.used.deflation] ?? 1

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
                    Decimal.pow(this.accelerator.getAcceleratorEffect(), (1 / 3) * (this.#corruptionData.deflationMultiplier[this.gameData.corruptions.used.deflation] ?? 1))
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

    calculateSynergismLevel() {
        if (!this.gameData) return 0;
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

        let exponent = data.ascensionCount
            - Math.max(
                0,
                20 - data.singularityChallenges.limitedAscensions.completions
            )

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

    calculateAscensionSpread(reduce_vals = true) {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const vals = [
            data.goldenQuarkUpgrades.singAscensionSpeed.level > 0 ? 0.03 : 0,
            data.goldenQuarkUpgrades.singAscensionSpeed2.level * 0.001,
            this.quarkShop.getShopUpgradeEffects('chronometerInfinity', 'exponentSpread') as number
        ]

        const reduced = vals.reduce((a, b) => a + b, 0);

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

    calculateAscensionScorePlatonicBlessing(): number {
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

    calculateAscensionScore() {
        if (!this.gameData) {
            return { baseScore: 0, corruptionMultiplier: 0, bonusMultiplier: 0, effectiveScore: 0 };
        }

        const data = this.gameData;
        const cube56 = data.cubeUpgrades[56] ?? 0;
        const cube39 = data.cubeUpgrades[39] ?? 0;
        const cube21 = data.cubeUpgrades[21] ?? 0;
        const cube31 = data.cubeUpgrades[31] ?? 0;
        const cube41 = data.cubeUpgrades[41] ?? 0;
        const platonic5 = data.platonicUpgrades[5] ?? 0;
        const platonic10 = data.platonicUpgrades[10] ?? 0;
        const globalSpeedBlessing = data.platonicBlessings.globalSpeed;
        const challenge15ScoreBonus = this.calculateChallenge15Reward('score') || 1;
        const masterPackAscensionScoreMult = this.getGQUpgradeEffect('masterPack') || 1;
        const expertPackAscensionScoreMult = this.getGQUpgradeEffect('expertPack') || 1;
        const finiteDescentScore = this.rune.getRuneEffects('finiteDescent').ascensionScore;
        const achievementAscensionScoreBonus = Number(this.achievement.AchRewards['ascensionScore']()) || 1;
        const eventAscensionScoreBonus = this.isEvent ? this.calculateEventSourceBuff(EventBuffType.AscensionScore) : 0;

        const calculationVars: number[] = [
            data.highestchallengecompletions[1] ?? 0,
            data.highestchallengecompletions[2] ?? 0,
            data.highestchallengecompletions[3] ?? 0,
            data.highestchallengecompletions[4] ?? 0,
            data.highestchallengecompletions[5] ?? 0,
            data.highestchallengecompletions[6] ?? 0,
            data.highestchallengecompletions[7] ?? 0,
            data.highestchallengecompletions[8] ?? 0,
            data.highestchallengecompletions[9] ?? 0,
            data.highestchallengecompletions[10] ?? 0,
            cube56,
            cube39,
            cube21,
            cube31,
            cube41,
            platonic5,
            platonic10,
            globalSpeedBlessing,
            data.challenge15Exponent ?? 0,
            challenge15ScoreBonus,
            masterPackAscensionScoreMult,
            expertPackAscensionScoreMult,
            finiteDescentScore,
            achievementAscensionScoreBonus,
            this.isEvent ? 1 : 0,
            eventAscensionScoreBonus,
        ];

        return this.memoizeCalculation<AscensionScoreResult>('calculateAscensionScore', calculationVars, () => {
            const corruptionMultiplier = [
                'viscosity',
                'drought',
                'deflation',
                'extinction',
                'illiteracy',
                'recession',
                'dilation',
                'hyperchallenge'
            ].reduce((product, corruption) => product * this.calculateCorruptionEffect(data.corruptions.used, corruption), 1);

            const challengeScoreArrays1 = [0, 8, 10, 12, 15, 20, 60, 80, 120, 180, 300];
            const challengeScoreArrays2 = [0, 10, 12, 15, 20, 30, 80, 120, 180, 300, 450];
            const challengeScoreArrays3 = [0, 20, 30, 50, 100, 200, 250, 300, 400, 500, 750];
            const challengeScoreArrays4 = [0, 10000, 10000, 10000, 10000, 10000, 2000, 3000, 4000, 5000, 7500];

            challengeScoreArrays1[1] += cube56;
            challengeScoreArrays1[2] += cube56;
            challengeScoreArrays1[3] += cube56;

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

            baseScore += this.antUpgrade.getAntUpgradeEffectValue(AntUpgrades.AscensionScore, 'ascensionScoreBase');
            baseScore *= Math.pow(
                1.03
                    + 0.005 * cube39
                    + 0.0025 * (platonic5 + platonic10),
                data.highestchallengecompletions[10]
            );

            const bonusMultiplier =
                challenge15ScoreBonus *
                this.calculateAscensionScorePlatonicBlessing() *
                finiteDescentScore *
                (1 + 0.05 * cube21) *
                (1 + 0.05 * cube31) *
                (1 + 0.05 * cube41) *
                achievementAscensionScoreBonus *
                masterPackAscensionScoreMult *
                (this.isEvent ? 1 + eventAscensionScoreBonus : 1);

            let effectiveScore = baseScore * corruptionMultiplier * bonusMultiplier;
            if (effectiveScore > 1e23) {
                effectiveScore = Math.pow(effectiveScore, 0.5) * Math.pow(1e23, 0.5);
            }
            effectiveScore *= expertPackAscensionScoreMult;

            return { baseScore, corruptionMultiplier, bonusMultiplier, effectiveScore };
        });
    }

    calculateCubeMultiplier(): number {
        if (!this.gameData) return 1;
        const data = this.gameData;

        const cubeBank = Array.from({ length: 10 }, (_, index) => {
            const challengeIndex = index + 1;
            return (challengeIndex >= 6 ? 2 : 1) * (data.challengecompletions?.[challengeIndex] ?? 0);
        }).reduce((sum, value) => sum + value, 0) + this.antUpgrade.getAntUpgradeEffectValue(AntUpgrades.AscensionScore, 'cubesBanked');

        return (
            cubeBank *
            Math.pow(this.calculateAscensionScore().effectiveScore / 3000, 1 / 4.1) *
            (this.achievement.AchRewards['wowCubeGain']() as number ?? 1) *
            (this.talisman.getTalismanEffects('wowSquare').oddDimBonus as number ?? 1) *
            this.antUpgrade.getAntUpgradeEffectValue(AntUpgrades.WowCubes, 'wowCubes')
        );
    }

    calculateCubeMultiplierWithTau(): number {
        const cubeMultiplier = this.calculateCubeMultiplier();
        const tauBonus = this.getGQUpgradeEffect('platonicTau') || 1;
        return Math.pow(cubeMultiplier, tauBonus);
    }

    calculateTesseractMultiplier(): number {
        if (!this.gameData) return 1;

        return (
            Math.pow(1 + Math.max(0, this.calculateAscensionScore().effectiveScore - 1e5) / 1e4, 0.35) *
            Number(this.achievement.AchRewards['wowTesseractGain']() ?? 1) *
            Number(this.talisman.getTalismanEffects('wowSquare').evenDimBonus ?? 1)
        );
    }

    calculateHypercubeMultiplier(): number {
        if (!this.gameData) return 1;

        return (
            Math.pow(1 + Math.max(0, this.calculateAscensionScore().effectiveScore - 1e9) / 1e8, 0.5) *
            Number(this.achievement.AchRewards['wowHypercubeGain']() ?? 1) *
            Number(this.talisman.getTalismanEffects('wowSquare').oddDimBonus ?? 1)
        );
    }

    calculatePlatonicMultiplier(): number {
        if (!this.gameData) return 1;

        return (
            Math.pow(1 + Math.max(0, this.calculateAscensionScore().effectiveScore - 2.666e12) / 2.666e11, 0.75) *
            Number(this.achievement.AchRewards['wowPlatonicGain']() ?? 1) *
            Number(this.talisman.getTalismanEffects('wowSquare').evenDimBonus ?? 1)
        );
    }

    calculateHepteractMultiplier(): number {
        if (!this.gameData) return 1;

        return (
            Math.pow(1 + Math.max(0, this.calculateAscensionScore().effectiveScore - 1.666e16) / 3.33e16, 0.85) *
            Number(this.achievement.AchRewards['wowHepteractGain']() ?? 1)
        );
    }

    calculateRawAscensionSpeedMult(reduce_vals = true) {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'RawAscensionSpeedMult' as keyof CalculationCache;

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

        if (cached !== undefined) return cached;

        const vals: number[] = [
            this.antUpgrade.getAntUpgradeEffectValue(AntUpgrades.Mortuus2, 'ascensionSpeed'),
            this.talisman.getTalismanEffects('polymath').ascensionSpeedBonus,
            this.quarkShop.getShopUpgradeEffects('chronometer', 'ascensionSpeedMult') as number,
            this.quarkShop.getShopUpgradeEffects('chronometer2', 'ascensionSpeedMult') as number,
            this.quarkShop.getShopUpgradeEffects('chronometer3', 'ascensionSpeedMult') as number,
            1 + (0.6 / 1000) * this.calculateHepteractEffective('chronos'),
            1 + 0.002 * this.getCorruptionTotalLevel() * data.platonicUpgrades[15],
            this.calculateChallenge15Reward('ascensionSpeed'),
            1 + (1 / 400) * cube59,
            1 + 0.5 * (data.goldenQuarkUpgrades.intermediatePack.level > 0 ? 1 : 0),
            this.quarkShop.getShopUpgradeEffects('chronometerZ', 'ascensionSpeedMult') as number,
            1 + (+data.octUpgrades.octeractImprovedAscensionSpeed.level / 2000) * data.singularityCount,
            1 + (+data.octUpgrades.octeractImprovedAscensionSpeed2.level / 2000) * data.singularityCount,
            this.quarkShop.getShopUpgradeEffects('chronometerInfinity', 'ascensionSpeedMult') as number,
            Math.pow(
                this.getSingularityChallengeEffect('limitedAscensions', 'ascensionSpeedMult'),
                1 + Math.max(0, Math.floor(Math.log10(data.ascensionCount))),
            ),
            this.quarkShop.getShopUpgradeEffects('shopPanthema', 'ascensionSpeedMult') as number,
            this.getSingularityChallengeEffect('limitedTime', 'ascensionSpeed'),
            this.quarkShop.getShopUpgradeEffects('shopChronometerS', 'globalSpeedMult') as number,
            1 / this.calculateLimitedAscensionsDebuff(),
            1 / this.calculateSingularityDebuff('Ascension Speed'),
            1 + this.calculateEventSourceBuff(EventBuffType.AscensionSpeed),
        ]

        const reduced = vals.reduce((a, b) => a * b, 1)

        updateCalculationCache(this.#calculationCache, cacheName, { value: reduced, cachedBy: calculationVars });

        return reduce_vals ? reduced : vals;
    }

    calculateAscensionSpeedMult() {
        let base = (this.calculateRawAscensionSpeedMult() as number)

        const exponentSpread = (this.calculateAscensionSpread() as number)

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

    calculateCampaignRune6Bonus() {
        const cacheName = 'CampaignRune6Bonus' as keyof CalculationCache;

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

    maxGoldenQuarkUpgradeAP = Object.values(goldenQuarkUpgradeMaxLevels).reduce((acc: number, upgrade) => {
        if (upgrade.maxLevel === -1) {
            return acc
        }
        return acc + 5
    }, 0)

    maxOcteractUpgradeAP = Object.values(octeractUpgradeMaxLevels).reduce((acc: number, upgrade) => {
        if (upgrade.maxLevel === -1) {
            return acc
        }
        return acc + 8
    }, 0)

    computeFreeLevelMultiplierGQ(): number {
        return Number(this.quarkShop.getShopUpgradeEffects('shopSingularityPotency', 'freeUpgradeMult')) + 0.3 / 100 * (this.gameData?.cubeUpgrades[75] ?? 0)
    }

    computeGQUpgradeFreeLevelSoftcap(upgradeKey: GoldenQuarkUpgradeKey): number {
        if (!this.gameData) { HSLogger.errorOnce(`<red>computeGQUpgradeFreeLevelSoftcap() GAMEDATA WAS NULL</red>`, this.context); return 0; }

        const data = this.gameData;
        const upgrade = data.goldenQuarkUpgrades[upgradeKey]
        const freeLevelMult = this.computeFreeLevelMultiplierGQ()
        const freeLevel = this.getSavedUpgradeFreeLevel(upgrade)

        const baseRealFreeLevels = freeLevelMult * freeLevel
        return Math.min(upgrade.level, baseRealFreeLevels)
            + Math.sqrt(Math.max(0, baseRealFreeLevels - upgrade.level));
    }

    getOcteractUpgradeEffect = (upgradeKey: OcteractUpgradeKey, effectKey?: string): number => {
        if (!this.gameData) { HSLogger.errorOnce(`<red>getOcteractUpgradeEffect() GAMEDATA WAS NULL</red>`, this.context); return 0; }

        const upgrade = octeractUpgradeMaxLevels[upgradeKey]
        const totalLevels = this.actualOcteractUpgradeTotalLevels(upgradeKey)

        if (!Number.isFinite(totalLevels)) { HSLogger.errorOnce(`<red>getOcteractUpgradeEffect() totalLevels invalid for ${upgradeKey}: ${totalLevels}</red>`, this.context); return 0; }

        return upgrade.effect ? upgrade.effect(totalLevels, effectKey) : 0
    }

    computeFreeLevelMultiplierOCT(): number {
        return 1 + 0.3 / 100 * (this.gameData?.cubeUpgrades[78] ?? 0)
    }

    computeOcteractFreeLevelSoftcap = (upgradeKey: OcteractUpgradeKey): number => {
        if (!this.gameData) { HSLogger.errorOnce(`<red>computeOcteractFreeLevelSoftcap() GAMEDATA WAS NULL</red>`, this.context); return 0; }

        const data = this.gameData;
        const freeLevelMult = this.computeFreeLevelMultiplierOCT()
        const upgrade = data.octUpgrades[upgradeKey];

        if (!upgrade) { HSLogger.errorOnce(`<red>computeOcteractFreeLevelSoftcap() missing octeract upgrade ${upgradeKey}</red>`, this.context); return 0; }

        return this.getSavedUpgradeFreeLevel(upgrade) * freeLevelMult
    }

    actualOcteractUpgradeTotalLevels(upgradeKey: OcteractUpgradeKey): number {
        if (!this.gameData) { HSLogger.errorOnce(`<red>actualOcteractUpgradeTotalLevels() GAMEDATA WAS NULL</red>`, this.context); return 0; }

        const data = this.gameData;
        const upgrade = data.octUpgrades[upgradeKey];

        if (!upgrade) { HSLogger.errorOnce(`<red>actualOcteractUpgradeTotalLevels() missing octeract upgrade ${upgradeKey}</red>`, this.context); return 0; }
        if (data.singularityChallenges.noOcteracts.enabled || data.singularityChallenges.sadisticPrequel.enabled) { return 0; }

        const level = Number(upgrade.level ?? 0)
        const actualFreeLevels = this.computeOcteractFreeLevelSoftcap(upgradeKey)

        if (!Number.isFinite(level) || !Number.isFinite(actualFreeLevels)) return 0;

        if (level >= actualFreeLevels) {
            return actualFreeLevels + level
        } else {
            return 2 * Math.sqrt(actualFreeLevels * level)
        }
    }

    actualGQUpgradeTotalLevels(upgradeKey: GoldenQuarkUpgradeKey): number {
        if (!this.gameData) { HSLogger.errorOnce(`<red>actualGQUpgradeTotalLevels() GAMEDATA WAS NULL</red>`, this.context); return 0; }

        const data = this.gameData;
        const upgrade = goldenQuarkUpgradeMaxLevels[upgradeKey]

        if ( (data.singularityChallenges.noSingularityUpgrades.enabled || data.singularityChallenges.sadisticPrequel.enabled) && !upgrade.qualityOfLife ) { return 0 }
        if ( (data.singularityChallenges.limitedAscensions.enabled || data.singularityChallenges.limitedTime.enabled || data.singularityChallenges.sadisticPrequel.enabled) && upgradeKey === 'platonicDelta' ) { return 0 }

        const actualFreeLevels = this.computeGQUpgradeFreeLevelSoftcap(upgradeKey)
        const level = Number(data.goldenQuarkUpgrades[upgradeKey].level ?? 0)
        const linearLevels = level + actualFreeLevels
        let polynomialLevels = 0

        if (this.getOcteractUpgradeEffect('octeractImprovedFree')) {
            let exponent = 0.6
            exponent += this.getOcteractUpgradeEffect('octeractImprovedFree2')
            exponent += this.getOcteractUpgradeEffect('octeractImprovedFree3')
            exponent += this.getOcteractUpgradeEffect('octeractImprovedFree4')
            polynomialLevels = Math.pow(level * actualFreeLevels, exponent)
        }

        return Math.max(linearLevels, polynomialLevels)
    }

    getGQUpgradeEffect(upgradeKey: GoldenQuarkUpgradeKey): number {
        const upgrade = goldenQuarkUpgradeMaxLevels[upgradeKey]
        const totalLevels = this.actualGQUpgradeTotalLevels(upgradeKey)

        if (upgradeKey === 'favoriteUpgrade') {
            return this.calculateFavoriteUpgradeEffect(totalLevels)
        }

        return upgrade.effect ? upgrade.effect(totalLevels) : 0
    }

    calculateFavoriteUpgradeEffect(totalLevels: number): number {
        const maxedCount = this.getFavoriteUpgradeMaxedDependencyCount()
        return 1 + totalLevels / 5000 * (maxedCount + 6)
    }

    firstFiveFreeLevels = () => {
        return this.antUpgrade.getAntUpgradeEffectValue(AntUpgrades.FreeRunes, 'freeRuneLevel')
            + 7 * Math.min((this.gameData?.constantUpgrades[7] ?? 0), 1000);
    }

    freeInfinityLevels = () => {
        return this.calculateAllShopTablets()
        + this.getSingularityChallengeEffect('noQuarkUpgrades', 'freeInfinityLevels')
        + this.rune.getRuneEffects('topHat').freeInfinityLevels;
    }

    calculateAllShopTablets(): number;
    calculateAllShopTablets(reduce_vals: true): number;
    calculateAllShopTablets(reduce_vals: false): number[];
    calculateAllShopTablets(reduce_vals: boolean): number | number[];
    calculateAllShopTablets(reduce_vals = true) {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'AllShopTablets' as keyof CalculationCache;

        const calculationVars: number[] = [
            data.highestSingularityCount,
            data.goldenQuarkUpgrades.singInfiniteShopUpgrades.level,
            data.octUpgrades.octeractInfiniteShopUpgrades.level,
            data.shopUpgrades.shopInfiniteShopUpgrades,
            data.redAmbrosiaUpgrades.infiniteShopUpgrades,
            data.singularityChallenges.sadisticPrequel.enabled ? 1 : 0,
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
            this.ambrosia.getRedAmbrosiaUpgradeEffects('infiniteShopUpgrades').freeLevels,
            dunno(),
            +data.goldenQuarkUpgrades.singInfiniteShopUpgrades.level,
            +data.octUpgrades.octeractInfiniteShopUpgrades.level,
            Math.floor(0.01 * data.shopUpgrades.shopInfiniteShopUpgrades * this.calculateSumOfExaltCompletions()),
            ...(data.singularityChallenges.noAmbrosiaUpgrades.enabled
                ? []
                : [
                    +this.ambrosia.getAmbrosiaUpgradeEffects('ambrosiaInfiniteShopUpgrades1').freeLevels,
                    +this.ambrosia.getAmbrosiaUpgradeEffects('ambrosiaInfiniteShopUpgrades2').freeLevels,
                ]),
        ]

        const reduced = vals.reduce((a, b) => a + b, 0);

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

    calculateLeaderboardValue = (leaderboard: Array<{ elo: number; sacrificeId: number }>): number => {
        let total = 0
        const LEADERBOARD_WEIGHTS = [1, 0.8, 0.6, 0.4, 0.2]
        for (let i = 0; i < Math.min(leaderboard.length, LEADERBOARD_WEIGHTS.length); i++) {
            total += leaderboard[i].elo * LEADERBOARD_WEIGHTS[i]
        }
        return Math.floor(total)
    }

    calculateDilatedFiveLeafBonus() {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'DilatedFiveLeafBonus' as keyof CalculationCache;

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

    calculateAmbrosiaLuckShopUpgrade(reduce_vals = true, true_base = false) {
        const cacheName = (`AmbrosiaLuckShopUpgrade${true_base ? '_TRUE_BASE' : ''}`) as keyof CalculationCache;

        const calculationVars = [...this.getAmbrosiaLuckShopUpgradeCalculationDeps(), true_base ? 1 : 0];

        const cached = checkCalculationCache(this.#calculationCache, cacheName, calculationVars);

        if (reduce_vals && cached !== undefined) return cached;

        const data = this.gameData;
        const noQuarkUpgrades = data?.singularityChallenges.noQuarkUpgrades.enabled;
        const ambrosiaLuckBonusLevels = true_base
            ? this.ambrosia.getAmbrosiaUpgradeEffects('ambrosiaFreeLuckUpgrades', 'true_base').freeLuckUpgrades
            : this.ambrosia.getAmbrosiaUpgradeEffects('ambrosiaFreeLuckUpgrades').freeLuckUpgrades;

        const effectiveLevels = noQuarkUpgrades
            ? [0, 0, 0, 0]
            : [
                (data?.shopUpgrades.shopAmbrosiaLuck1 ?? 0) + ambrosiaLuckBonusLevels,
                (data?.shopUpgrades.shopAmbrosiaLuck2 ?? 0) + ambrosiaLuckBonusLevels,
                (data?.shopUpgrades.shopAmbrosiaLuck3 ?? 0) + ambrosiaLuckBonusLevels,
                (data?.shopUpgrades.shopAmbrosiaLuck4 ?? 0) + ambrosiaLuckBonusLevels,
            ];

        const vals = [
            2 * effectiveLevels[0],
            2 * effectiveLevels[1],
            2 * effectiveLevels[2],
            0.6 * effectiveLevels[3],
        ];

        const reduced = vals.reduce((a, b) => a + b, 0);

        updateCalculationCache(this.#calculationCache, cacheName, { value: reduced, cachedBy: calculationVars });

        return reduce_vals ? reduced : vals;
    }

    calculateCampaignAmbrosiaSpeedBonus() {
        const cacheName = 'CampaignAmbrosiaSpeedBonus' as keyof CalculationCache;

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
        else return 0;
    }

    calculateRedAmbrosiaGenerationSpeed(): number {
        const data = this.getGameData();
        if (!data) return 0;

        const ambSpeedNonAmb = (this.ambrosia.calculateAmbrosiaGenerationSpeed(true, true) as number);
        const blueberries = (this.ambrosia.calculateBlueberryInventory() as number);

        let ambSpeed = ambSpeedNonAmb * blueberries;
        ambSpeed *= 1 + this.getPatreonBonus();
        let pseudoRSpeed = this.getPCoinUpgradeLevel('RED_GENERATION_BUFF');
        let rSpeed = Math.sqrt(ambSpeed * Math.min(1000, ambSpeed));
        rSpeed *= 1 + 0.05 * pseudoRSpeed;
        rSpeed *= 1 + 0.02 * data.singularityChallenges.noAmbrosiaUpgrades.completions;
        rSpeed *= 1 + 0.003 * this.ambrosia.calculateRedAmbrosiaUpgradeValue('redGenerationSpeed');
        return rSpeed;
    }

    getPatreonBonus(): number {
        if (!this.meData) return 0;
        const meData = this.meData;
        let bonus = (1 + (meData?.globalBonus ?? 0) / 100) * (1 + (meData?.personalBonus ?? 0) / 100) - 1;
        return bonus;
    }

    async dumpDataForHeater(): Promise<any> {
        const gameDataModule = HSModuleManager.getModule("HSGameData") as HSGameData;

        if (gameDataModule) {
            await gameDataModule.forceUpdateAllData();
        } else {
            HSLogger.error('Failed to acquire game data for heater export', this.context);
            HSUI.Notify('Failed to acquire game data for heater export', { position: 'top', notificationType: "error" });
            return;
        }

        if (!this.gameData) return undefined;
        const gameData = this.gameData;
        const meData = this.meData;
        const eventData = this.eventData;

        try {
            const luck =                    this.luck.calculateLuck(true)       as { luckBase: number, luckMult: number, luckTotal: number };
            const nonAmbLuck =              this.luck.calculateLuck(true, true) as { luckBase: number, luckMult: number, luckTotal: number };
            const ambrosiaGainChance =      (luck.luckTotal - 100 * Math.floor(luck.luckTotal / 100)) / 100;
            const trueAmbrosiaGainChance =  (nonAmbLuck.luckTotal - 100 * Math.floor(nonAmbLuck.luckTotal / 100)) / 100;
            const talismanRuneBonuses =     this.talisman.getRuneBonusFromAllTalismansBatch();
            const ambSpeedNonAmb =          (this.ambrosia.calculateAmbrosiaGenerationSpeed(true, true) as number);
            const blueberries =             (this.ambrosia.calculateBlueberryInventory() as number);
            const ambSpeedNonAmbBerries =   ambSpeedNonAmb * blueberries;
            
            const heaterData = {
                ...this.gameData,
                hs_data: {
                    lifetimeAmbrosia:       gameData.lifetimeAmbrosia,
                    lifetimeRedAmbrosia:    gameData.lifetimeRedAmbrosia,
                    ambSpeed:               (this.ambrosia.calculateAmbrosiaGenerationSpeed(true, false) as number),
                    ambSpeedNonAmb:         ambSpeedNonAmb,
                    blueberries:            blueberries,
                    ambSpeedNonAmbBerries:  ambSpeedNonAmbBerries,
                    luckBase:               luck.luckBase,
                    luckMult:               luck.luckMult,
                    luckTotal:              luck.luckTotal,
                    luckBaseNonAmb:         nonAmbLuck.luckBase,
                    luckMultNonAmb:         nonAmbLuck.luckMult,
                    luckTotalNonAmb:        nonAmbLuck.luckTotal,
                    redLuckBase:            (this.luck.calculateRedAmbrosiaLuck(true, true) as number),
                    luckConversion:         (this.luck.calculateLuckConversion(true, true) as number),
                    quarksOwned:            Number(gameData.worlds.valueOf() || 0),
                    qHept:                  gameData.hepteracts.quark.BAL,
                    cubesExp3D:             this.log10PlusOne(gameData.wowCubes),
                    cubesExp4D:             this.log10PlusOne(gameData.wowTesseracts),
                    cubesExp5D:             this.log10PlusOne(gameData.wowHypercubes),
                    cubesExp6D:             this.log10PlusOne(gameData.wowPlatonicCubes),
                    cubesExp7D:             this.log10PlusOne(gameData.wowAbyssals),
                    cubesExp8D:             this.log10PlusOne(gameData.wowOcteracts),
                    cubesExpTotal:          this.calculateTotalCubesExp() - 6, // Vanilla adds +6
                    currentSingularity:     gameData.singularityCount,
                    singularityReducers:    (this.calculateSingularityReductions(true, true) as number),
                    exalt:                  this.getActiveExalt(),
                    postAoag:               Number(gameData.runes.antiquities) > 0,
                    transcription:          gameData.octUpgrades.octeractOneMindImprover.level,
                    ascSpeed:               this.calculateAscensionSpeedMult(),
                    ascSpread:              this.calculateAscensionSpread(),
                    baseObt:                this.allBaseObtainiumStats.reduce((a, b) => a + b.stat(), 0),
                    baseOff:                this.allBaseOfferingStats.reduce((a, b) => a + b.stat(), 0),
                    bonusRow2:              this.ambrosia.getRedAmbrosiaUpgradeEffects('freeLevelsRow2').freeLevels,
                    bonusRow3:              this.ambrosia.getRedAmbrosiaUpgradeEffects('freeLevelsRow3').freeLevels,
                    bonusRow4:              this.ambrosia.getRedAmbrosiaUpgradeEffects('freeLevelsRow4').freeLevels,
                    bonusRow5:              this.ambrosia.getRedAmbrosiaUpgradeEffects('freeLevelsRow5').freeLevels,
                    runeSiExp:                  parseGameDataDecimal(gameData.runes.superiorIntellect),
                    runeSiRC:                   this.rune.getLevelsPerOOM('superiorIntellect'),
                    runeSiBonusLevelsTotal:     new Decimal(this.firstFiveFreeLevels() + talismanRuneBonuses.superiorIntellect),
                    runeIaExp:                  parseGameDataDecimal(gameData.runes.infiniteAscent),
                    runeIaBonusLevelsTotal:     new Decimal(this.getRuneBonusLevels('infiniteAscent')),
                    runeIaBonusLevelsTalisman:  new Decimal(talismanRuneBonuses.infiniteAscent),
                    baseTalismanPower:          new Decimal(this.talisman.allTalismanRuneBonusStatsSum()),
                    patreonBonus:               this.getPatreonBonus(),
                    activeBells:                eventData?.HAPPY_HOUR_BELL.amount ?? 0,
                    jack:                       gameData.shopUpgrades.shopPanthema > 0,
                    freeShopLevelsInfinity:     this.freeInfinityLevels(),
                    freeShopLevelsCube:         this.quarkShop.getShopFreeLevelsCube(),
                    freeShopLevelsSpeed:        this.quarkShop.getShopFreeLevelsAscensionSpeed(),
                    freeShopLevelsQuark:        this.quarkShop.getShopFreeLevelsQuark(),
                    chronometerLevel:           this.quarkShop.getShopLevel('chronometerInfinity'),
                    shopAmbrosiaLuck1:          gameData.shopUpgrades.shopAmbrosiaLuck1,
                    shopAmbrosiaLuck2:          gameData.shopUpgrades.shopAmbrosiaLuck2,
                    shopAmbrosiaLuck3:          gameData.shopUpgrades.shopAmbrosiaLuck3,
                    shopAmbrosiaLuck4:          gameData.shopUpgrades.shopAmbrosiaLuck4,
                    shopRedLuck1:               gameData.shopUpgrades.shopRedLuck1,
                    shopRedLuck2:               gameData.shopUpgrades.shopRedLuck2,
                    shopRedLuck3:               gameData.shopUpgrades.shopRedLuck3,
                    shopAmbrosiaGeneration1:    gameData.shopUpgrades.shopAmbrosiaGeneration1,
                    shopAmbrosiaGeneration2:    gameData.shopUpgrades.shopAmbrosiaGeneration2,
                    shopAmbrosiaGeneration3:    gameData.shopUpgrades.shopAmbrosiaGeneration3,
                    shopAmbrosiaGeneration4:    gameData.shopUpgrades.shopAmbrosiaGeneration4,
                    shopImproveQuarkHept1:      gameData.shopUpgrades.improveQuarkHept,
                    shopImproveQuarkHept2:      gameData.shopUpgrades.improveQuarkHept2,
                    shopImproveQuarkHept3:      gameData.shopUpgrades.improveQuarkHept3,
                    shopImproveQuarkHept4:      gameData.shopUpgrades.improveQuarkHept4,
                    shopImproveQuarkHept5:      gameData.shopUpgrades.improveQuarkHept5,
                    redBarCapacity:             this.ambrosia.calculateRequiredRedAmbrosiaTime(),
                    redBarSpeed:                this.calculateRedAmbrosiaGenerationSpeed(),
                    // Not Heater
                    totalVouchers:              this.calculateAllShopTablets(),
                    plat4x4:                gameData.platonicUpgrades[19],
                    tokens:                 this.campaignData?.tokens,
                    maxTokens:              this.campaignData?.maxTokens,
                    isAtMaxTokens:          this.campaignData?.isAtMaxTokens,
                    isEvent:                this.isEvent,
                    bellStacks:             eventData?.HAPPY_HOUR_BELL.amount ?? 0,
                    blueAmbrosiaBarValue:   gameData.blueberryTime,
                    redAmbrosiaBarValue:    gameData.redAmbrosiaTime,
                    blueAmbrosiaBarMax:     this.ambrosia.calculateRequiredBlueberryTime(),
                    redAmbrosiaBarMax:      this.ambrosia.calculateRequiredRedAmbrosiaTime(),
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
                        tutorial:                   this.ambrosia.calculateRedAmbrosiaUpgradeValue('tutorial'),
                        freeTutorialLevels:         this.ambrosia.calculateRedAmbrosiaUpgradeValue('freeTutorialLevels'),
                        conversionImprovement1:     this.ambrosia.calculateRedAmbrosiaUpgradeValue('conversionImprovement1'),
                        blueberryGenerationSpeed:   this.ambrosia.calculateRedAmbrosiaUpgradeValue('blueberryGenerationSpeed'),
                        regularLuck:                this.ambrosia.calculateRedAmbrosiaUpgradeValue('regularLuck'),
                        blueberries:                this.ambrosia.calculateRedAmbrosiaUpgradeValue('blueberries'),
                        redAmbrosiaFreeAccumulator: this.ambrosia.calculateRedAmbrosiaUpgradeValue('redAmbrosiaFreeAccumulator'),

                        freeLevelsRow2:             this.ambrosia.calculateRedAmbrosiaUpgradeValue('freeLevelsRow2'),
                        redAmbrosiaCube:            this.ambrosia.calculateRedAmbrosiaUpgradeValue('redAmbrosiaCube'),
                        redAmbrosiaObtainium:       this.ambrosia.calculateRedAmbrosiaUpgradeValue('redAmbrosiaObtainium'),
                        redAmbrosiaOffering:        this.ambrosia.calculateRedAmbrosiaUpgradeValue('redAmbrosiaOffering'),
                        freeOfferingUpgrades:       this.ambrosia.calculateRedAmbrosiaUpgradeValue('freeOfferingUpgrades'),
                        
                        freeLevelsRow3:             this.ambrosia.calculateRedAmbrosiaUpgradeValue('freeLevelsRow3'),
                        conversionImprovement2:     this.ambrosia.calculateRedAmbrosiaUpgradeValue('conversionImprovement2'),
                        redGenerationSpeed:         this.ambrosia.calculateRedAmbrosiaUpgradeValue('redGenerationSpeed'),
                        redLuck:                    this.ambrosia.calculateRedAmbrosiaUpgradeValue('redLuck'),
                        salvageYinYang:             this.ambrosia.calculateRedAmbrosiaUpgradeValue('salvageYinYang'),
                        freeObtainiumUpgrades:      this.ambrosia.calculateRedAmbrosiaUpgradeValue('freeObtainiumUpgrades'),

                        freeLevelsRow4:             this.ambrosia.calculateRedAmbrosiaUpgradeValue('freeLevelsRow4'),
                        redAmbrosiaCubeImprover:    this.ambrosia.calculateRedAmbrosiaUpgradeValue('redAmbrosiaCubeImprover'),
                        infiniteShopUpgrades:       this.ambrosia.calculateRedAmbrosiaUpgradeValue('infiniteShopUpgrades'),
                        redAmbrosiaAccelerator:     this.ambrosia.calculateRedAmbrosiaUpgradeValue('redAmbrosiaAccelerator'),
                        freeCubeUpgrades:           this.ambrosia.calculateRedAmbrosiaUpgradeValue('freeCubeUpgrades'),

                        viscount:                   this.ambrosia.calculateRedAmbrosiaUpgradeValue('viscount'),
                        freeLevelsRow5:             this.ambrosia.calculateRedAmbrosiaUpgradeValue('freeLevelsRow5'),
                        conversionImprovement3:     this.ambrosia.calculateRedAmbrosiaUpgradeValue('conversionImprovement3'),
                        blueberryGenerationSpeed2:  this.ambrosia.calculateRedAmbrosiaUpgradeValue('blueberryGenerationSpeed2'),
                        regularLuck2:               this.ambrosia.calculateRedAmbrosiaUpgradeValue('regularLuck2'),
                        freeSpeedUpgrades:          this.ambrosia.calculateRedAmbrosiaUpgradeValue('freeSpeedUpgrades'),
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
