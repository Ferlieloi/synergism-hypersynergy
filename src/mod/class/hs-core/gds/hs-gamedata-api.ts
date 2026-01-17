import { EventBuffType } from "../../../types/data-types/hs-event-data";
import { Achievement, AchievementRewards, AntProducers, AntUpgrades, CachedValue, CalculationCache, GoldenQuarkUpgradeKey, HepteractType, ISingularityChallengeData, LAST_ANT_PRODUCER, OcteractUpgradeKey, RedAmbrosiaUpgradeKey, ProgressiveAchievement, ProgressiveAchievements, RedAmbrosiaUpgradeCalculationCollection, RedAmbrosiaUpgradeCalculationConfig, SingularityChallengeDataKeys, SingularityDebuffs, AntUpgradeTypeMap, RuneType, AmbrosiaUpgradeNames, AmbrosiaUpgradeRewards } from "../../../types/data-types/hs-gamedata-api-types";
import { RedAmbrosiaUpgrades, AmbrosiaUpgrades, SingularityChallengeStatus, Runes, CorruptionLoadout, SingularityChallenges, goldenQuarkUpgrades } from "../../../types/data-types/hs-player-savedata";
import { HSModuleOptions } from "../../../types/hs-types";
import { HSUtils } from "../../hs-utils/hs-utils";
import { HSGlobal } from "../hs-global";
import { HSLogger } from "../hs-logger";
import { HSUI } from "../hs-ui";
import { HSModuleManager } from "../module/hs-module-manager";
import { HSGameData } from "./hs-gamedata";
import { HSGameDataAPIPartial } from "./hs-gamedata-api-partial";
import { octeractUpgradeMaxLevels, goldenQuarkUpgradeMaxLevels, c15Functions, CASH_GRAB_ULTRA_BLUEBERRY, challenge15Rewards, hepteractEffectiveValues, redAmbrosiaUpgradeCalculationCollection, ambrosiaUpgradeCalculationCollection, SINGULARITY_CHALLENGE_DATA } from "./stored-vars-and-calculations";

/*
    If this looks silly, check details in hs-gamedata-api-partial.ts

    This class, even though the name is HSGameDataAPI, contains only
    calculation functions which use game data

    The main game data API class is HSGameDataAPIPartial.
    Yes, they are basically wrong way around but it is what it is.

    --

    This file is also very long and will most likely get a lot longer still.
    This is because this file mostly contains functions ripped from the game's code
    and modified to work with the mod's own cache etc. (*) The big idea in the end is that
    I'll try to expose everything in here in some sane way so nobody needs to look in here.

    --

    (*) All of the R_ methods are ripped from the game's code
*/
export class HSGameDataAPI extends HSGameDataAPIPartial {

    // Named caches for each heavy calculation dependent on multiple variables
    // The idea is to cache calculations by the variables that make up the calculation
    // If any of the variables change, the cache should update as well
    // If the variables are the same, then it follows that the value should be the same too
    // And we can return that cache value
    #calculationCache: CalculationCache = {
        R_AmbrosiaGenerationShopUpgrade: { value: undefined, cachedBy: [] },
        R_AmbrosiaGenerationSingularityUpgrade: { value: undefined, cachedBy: [] },
        R_AmbrosiaGenerationOcteractUpgrade: { value: undefined, cachedBy: [] },
        R_SingularityMilestoneBlueberries: { value: undefined, cachedBy: [] },
        R_DilatedFiveLeafBonus: { value: undefined, cachedBy: [] },
        R_SingularityAmbrosiaLuckMilestoneBonus: { value: undefined, cachedBy: [] },
        R_AmbrosiaLuckShopUpgrade: { value: undefined, cachedBy: [] },
        R_AmbrosiaLuckSingularityUpgrade: { value: undefined, cachedBy: [] },
        R_AmbrosiaLuckOcteractUpgrade: { value: undefined, cachedBy: [] },
        R_TotalCubes: { value: undefined, cachedBy: [] },

        AMB_ambrosiaTutorial: { value: undefined, cachedBy: [] },

        AMB_ambrosiaQuarks1: { value: undefined, cachedBy: [] },
        AMB_ambrosiaCubes1: { value: undefined, cachedBy: [] },
        AMB_ambrosiaLuck1: { value: undefined, cachedBy: [] },

        AMB_ambrosiaQuarkCube1: { value: undefined, cachedBy: [] },
        AMB_ambrosiaLuckCube1: { value: undefined, cachedBy: [] },
        AMB_ambrosiaCubeQuark1: { value: undefined, cachedBy: [] },
        AMB_ambrosiaLuckQuark1: { value: undefined, cachedBy: [] },
        AMB_ambrosiaCubeLuck1: { value: undefined, cachedBy: [] },
        AMB_ambrosiaQuarkLuck1: { value: undefined, cachedBy: [] },

        AMB_ambrosiaQuarks2: { value: undefined, cachedBy: [] },
        AMB_ambrosiaCubes2: { value: undefined, cachedBy: [] },
        AMB_ambrosiaLuck2: { value: undefined, cachedBy: [] },

        AMB_ambrosiaQuarks3: { value: undefined, cachedBy: [] },
        AMB_ambrosiaCubes3: { value: undefined, cachedBy: [] },
        AMB_ambrosiaLuck3: { value: undefined, cachedBy: [] },
        AMB_ambrosiaLuck4: { value: undefined, cachedBy: [] },

        AMB_ambrosiaPatreon: { value: undefined, cachedBy: [] },

        AMB_ambrosiaObtainium1: { value: undefined, cachedBy: [] },
        AMB_ambrosiaOffering1: { value: undefined, cachedBy: [] },

        AMB_ambrosiaHyperflux: { value: undefined, cachedBy: [] },

        AMB_ambrosiaBaseOffering1: { value: undefined, cachedBy: [] },
        AMB_ambrosiaBaseObtainium1: { value: undefined, cachedBy: [] },
        AMB_ambrosiaBaseOffering2: { value: undefined, cachedBy: [] },
        AMB_ambrosiaBaseObtainium2: { value: undefined, cachedBy: [] },

        AMB_ambrosiaSingReduction1: { value: undefined, cachedBy: [] },
        AMB_ambrosiaSingReduction2: { value: undefined, cachedBy: [] },

        AMB_ambrosiaInfiniteShopUpgrades1: { value: undefined, cachedBy: [] },
        AMB_ambrosiaInfiniteShopUpgrades2: { value: undefined, cachedBy: [] },

        AMB_ambrosiaTalismanBonusRuneLevel: { value: undefined, cachedBy: [] },
        AMB_ambrosiaRuneOOMBonus: { value: undefined, cachedBy: [] },


        REDAMB_blueberryGenerationSpeed: { value: undefined, cachedBy: [] },
        REDAMB_blueberryGenerationSpeed2: { value: undefined, cachedBy: [] },
        REDAMB_freeLevelsRow2: { value: undefined, cachedBy: [] },
        REDAMB_freeLevelsRow3: { value: undefined, cachedBy: [] },
        REDAMB_freeLevelsRow4: { value: undefined, cachedBy: [] },
        REDAMB_freeLevelsRow5: { value: undefined, cachedBy: [] },
        REDAMB_regularLuck: { value: undefined, cachedBy: [] },
        REDAMB_regularLuck2: { value: undefined, cachedBy: [] },
        REDAMB_viscount: { value: undefined, cachedBy: [] },

        R_CampaignAmbrosiaSpeedBonus: { value: undefined, cachedBy: [] },
        R_CampaignLuckBonus: { value: undefined, cachedBy: [] },
        R_CookieUpgrade29Luck: { value: undefined, cachedBy: [] },
        R_SumOfExaltCompletions: { value: undefined, cachedBy: [] },

        R_NumberOfThresholds: { value: undefined, cachedBy: [] },
        R_ToNextThreshold: { value: undefined, cachedBy: [] },
        R_RequiredBlueberryTime: { value: undefined, cachedBy: [] },
        R_RequiredRedAmbrosiaTime: { value: undefined, cachedBy: [] },

        EVENTBUFF_Quark: { value: undefined, cachedBy: [] },
        EVENTBUFF_GoldenQuark: { value: undefined, cachedBy: [] },
        EVENTBUFF_Cubes: { value: undefined, cachedBy: [] },
        EVENTBUFF_PowderConversion: { value: undefined, cachedBy: [] },
        EVENTBUFF_AscensionSpeed: { value: undefined, cachedBy: [] },
        EVENTBUFF_GlobalSpeed: { value: undefined, cachedBy: [] },
        EVENTBUFF_AscensionScore: { value: undefined, cachedBy: [] },
        EVENTBUFF_AntSacrifice: { value: undefined, cachedBy: [] },
        EVENTBUFF_Offering: { value: undefined, cachedBy: [] },
        EVENTBUFF_Obtainium: { value: undefined, cachedBy: [] },
        EVENTBUFF_Octeract: { value: undefined, cachedBy: [] },
        EVENTBUFF_BlueberryTime: { value: undefined, cachedBy: [] },
        EVENTBUFF_AmbrosiaLuck: { value: undefined, cachedBy: [] },
        EVENTBUFF_OneMind: { value: undefined, cachedBy: [] },

        R_RawAscensionSpeedMult: { value: undefined, cachedBy: [] },
        R_HepteractEffective: { value: undefined, cachedBy: [] },
        R_AllShopTablets: { value: undefined, cachedBy: [] },
        R_LimitedAscensionsDebuff: { value: undefined, cachedBy: [] },
        R_SingularityDebuff: { value: undefined, cachedBy: [] },
        R_SingularityReductions: { value: undefined, cachedBy: [] },
        R_EffectiveSingularities: { value: undefined, cachedBy: [] },
        R_AscensionSpeedExponentSpread: { value: undefined, cachedBy: [] },

        R_RedAmbrosiaLuck: { value: undefined, cachedBy: [] },
        R_LuckConversion: { value: undefined, cachedBy: [] },
    }

    R_singularityChallengeData: Record<
        SingularityChallengeDataKeys,
        ISingularityChallengeData
    > = SINGULARITY_CHALLENGE_DATA;

    #calculationCacheTemplate: CalculationCache;

    // These are imported from stored-vars-and-calculationss.ts
    #redAmbrosiaCalculationCollection = redAmbrosiaUpgradeCalculationCollection;
    #ambrosiaCalculationCollection = ambrosiaUpgradeCalculationCollection;
    #hepteractEffectiveValues = hepteractEffectiveValues;

    constructor(moduleOptions: HSModuleOptions) {
        super(moduleOptions);
        this.#calculationCacheTemplate = { ...this.#calculationCache };
    }

    #checkCache(cacheName: keyof CalculationCache, checkCacheAgainst: number[]) {
        if (!(cacheName in this.#calculationCache)) {
            HSLogger.debug(`Could not find cache for '${cacheName}'`);
            return false;
        }

        const cached = this.#calculationCache[cacheName];

        if (cached.value === undefined || cached.cachedBy.length === 0) {
            if (HSGlobal.Debug.calculationCacheDebugMode)
                console.log(`Cache missed (reason: null value or empty cache) for ${cacheName} with value ${cached.value}`);

            return false;
        }

        if (cached.cachedBy.length !== checkCacheAgainst.length) {
            if (HSGlobal.Debug.calculationCacheDebugMode)
                console.warn(`Cache missed (reason: cache length mismatch) for ${cacheName} with value ${cached.value}`);

            return false;
        }

        for (let i = 0; i < cached.cachedBy.length; i++) {
            if (!checkCacheAgainst.includes(cached.cachedBy[i])) {
                if (HSGlobal.Debug.calculationCacheDebugMode) {
                    console.log(`Cache missed (reason: calc var mismatch) for ${cacheName} (${cached.cachedBy[i]})`);
                }

                return false;
            }
        }

        if (HSGlobal.Debug.calculationCacheDebugMode)
            console.log(`Hit cache for ${cacheName} with value ${cached.value}`);

        return cached.value;
    }

    #updateCache(cacheName: keyof CalculationCache, newCachedValue: CachedValue) {
        if (newCachedValue.cachedBy.length === 0 || newCachedValue.value === null || newCachedValue.value === undefined) {
            if (HSGlobal.Debug.calculationCacheDebugMode)
                console.warn(`Rejected cache update for ${cacheName} (value: ${newCachedValue.value}, cachedBy: ${newCachedValue.cachedBy.length})`);

            return;
        }

        this.#calculationCache[cacheName] = newCachedValue;
    }

    clearCache() {
        this.#calculationCache = { ...this.#calculationCacheTemplate };
    }

    dumpCache() {
        console.table(this.#calculationCache);
    }

    #investToAmbrosiaUpgrade(
        budget: number,
        costPerLevel: number,
        maxLevel: number,
        constFunction: (n: number, cpl: number) => number,
        levelFunction: (n: number) => number) {

        let level = 0

        let nextCost = constFunction(level, costPerLevel)

        while (budget >= nextCost) {
            budget -= nextCost
            level += 1
            nextCost = constFunction(level, costPerLevel)

            if (level >= maxLevel) {
                break;
            }
        }

        return levelFunction(level);
    }

    #investToRedAmbrosiaUpgrade(
        budget: number,
        costPerLevel: number,
        maxLevel: number,
        constFunction: (n: number, cpl: number) => number,
        levelFunction: (n: number) => number) {

        let level = 0

        let nextCost = constFunction(level, costPerLevel)

        while (budget >= nextCost) {
            budget -= nextCost
            level += 1
            nextCost = constFunction(level, costPerLevel)

            if (level >= maxLevel) {
                break;
            }
        }

        return levelFunction(level);
    }

    R_calculateSigmoidExponential(constant: number, coefficient: number) {
        return 1 + (constant - 1) * (1 - Math.exp(-coefficient))
    }

    R_allTalismanRuneBonusStatsSum = () => {
        if (!this.gameData) return 0;
        const data = this.gameData;
        return (
            1
            + +this.R_getAchievementReward('talismanPower')
            + ((this.gameData?.researches[106] ?? 0) / 1000)
            + ((this.gameData?.researches[107] ?? 0) / 1000)
            + (2 * (this.gameData?.researches[118] ?? 0) / 1000)
            + (0.004 * Math.floor((this.gameData?.researches[200] ?? 0) / 10000))
            + (0.006 * Math.floor((this.gameData?.cubeUpgrades[50] ?? 0) / 10000))
            + (this.R_calculateChallenge15Reward('talismanBonus') - 1)
            + this.R_getGQUpgradeEffect('singTalismanBonusRunes1')
            + this.R_getGQUpgradeEffect('singTalismanBonusRunes2')
            + this.R_getGQUpgradeEffect('singTalismanBonusRunes3')
            + this.R_getGQUpgradeEffect('singTalismanBonusRunes4')
            + this.R_getAmbrosiaUpgradeEffects('ambrosiaTalismanBonusRuneLevel').talismanBonusRuneLevel
            + +(data.singularityChallenges.taxmanLastStand.rewards?.talismanRuneEffect ?? 0)
        )
    }

    R_getAmbrosiaUpgradeEffectiveLevels = (upgradeKey: AmbrosiaUpgradeNames): number => {
        const upgrade = ambrosiaUpgradeCalculationCollection[upgradeKey]
        return this.gameData?.redAmbrosiaUpgrades[upgradeKey].level + upgrade.extraLevelCalc()
    }

    R_getAmbrosiaUpgradeEffects = <T extends AmbrosiaUpgradeNames>(
        upgradeKey: T
    ): Partial<AmbrosiaUpgradeRewards> => {
        const effectiveLevels = this.R_getAmbrosiaUpgradeEffectiveLevels(upgradeKey)
        return ambrosiaUpgradeCalculationCollection[upgradeKey].effects(effectiveLevels)
    }

    R_getRuneBonusFromAllTalismans = (rune: RuneType): number => {
        const specialMultiplier = this.R_allTalismanRuneBonusStatsSum()
        let totalBonus = 0
        for (const t of Object.keys(talismans) as TalismanKeys[]) {
            totalBonus += getRuneBonusFromIndividualTalisman(t, rune)
        }

        return totalBonus * specialMultiplier
    }

    R_maxAPFromChallenges = Object.entries(this.R_singularityChallengeData).reduce(
        (acc, [chalKey, challenge]) => {
            const completions =
                this.gameData?.singularityChallenges[chalKey as SingularityChallengeDataKeys]
                    ?.completions ?? 0;

            return acc + challenge.achievementPointValue(completions);
        },
        0
    );

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

    R_maxRedAmbrosiaUpgradeAP = Object.values(redAmbrosiaUpgradeCalculationCollection).reduce((acc: number, upgrade) => {
        if (upgrade.maxLevel === -1) {
            return acc
        }
        return acc + 10
    }, 0)

    R_maxTalismansRarityAP = 50 * Object.keys(talismans).length

    R_computeFreeLevelMultiplierGQ(): number {
        return ((this.gameData?.shopUpgrades.shopSingularityPotency ?? 0) > 0 ? 3.66 : 1) + 0.3 / 100 * player.cubeUpgrades[75]
    }

    R_computeGQUpgradeFreeLevelSoftcap(upgradeKey: GoldenQuarkUpgradeKey): number {
        if (!this.gameData) {
            HSLogger.errorOnce(`<red>calculateChallenge15Reward() GAMEDATA WAS NULL</red>`, this.context);
            return 0;
        }

        const data = this.gameData;
        const upgrade = data.goldenQuarkUpgrades[upgradeKey]
        const freeLevelMult = this.R_computeFreeLevelMultiplierGQ()
        const baseRealFreeLevels = freeLevelMult * upgrade.freeLevels
        return (
            Math.min(upgrade.level, baseRealFreeLevels)
            + Math.sqrt(Math.max(0, baseRealFreeLevels - upgrade.level))
        )
    }

    R_getOcteractUpgradeEffect = (upgradeKey: OcteractUpgradeKey): number => {
        if (!this.gameData) {
            HSLogger.errorOnce(`<red>calculateChallenge15Reward() GAMEDATA WAS NULL</red>`, this.context);
            return 0;
        }

        const data = this.gameData;

        const upgrade = octeractUpgradeMaxLevels[upgradeKey]
        const totalLevels = this.R_actualOcteractUpgradeTotalLevels(upgradeKey)
        return upgrade.effect ? upgrade.effect(totalLevels) : 0
    }

    R_computeFreeLevelMultiplierOCT(): number {
        return 1 + 0.3 / 100 * (this.gameData?.cubeUpgrades[78] ?? 0)
    }

    R_computeOcteractFreeLevelSoftcap = (upgradeKey: OcteractUpgradeKey): number => {
        if (!this.gameData) {
            HSLogger.errorOnce(`<red>calculateChallenge15Reward() GAMEDATA WAS NULL</red>`, this.context);
            return 0;
        }

        const data = this.gameData;
        const freeLevelMult = this.R_computeFreeLevelMultiplierOCT()
        const upgrade = data.octUpgrades[upgradeKey];
        return upgrade.freeLevels * freeLevelMult
    }

    R_actualOcteractUpgradeTotalLevels(upgradeKey: OcteractUpgradeKey): number {
        if (!this.gameData) {
            HSLogger.errorOnce(`<red>calculateChallenge15Reward() GAMEDATA WAS NULL</red>`, this.context);
            return 0;
        }

        const data = this.gameData;
        const upgrade = data.octUpgrades[upgradeKey];

        const actualFreeLevels = this.R_computeOcteractFreeLevelSoftcap(upgradeKey)

        if (upgrade.level >= actualFreeLevels) {
            return actualFreeLevels + upgrade.level
        } else {
            return 2 * Math.sqrt(actualFreeLevels * upgrade.level)
        }
    }

    R_actualGQUpgradeTotalLevels(upgradeKey: GoldenQuarkUpgradeKey): number {
        if (!this.gameData) {
            HSLogger.errorOnce(`<red>calculateChallenge15Reward() GAMEDATA WAS NULL</red>`, this.context);
            return 0;
        }

        const data = this.gameData;

        const upgrade = goldenQuarkUpgradeMaxLevels[upgradeKey]

        const actualFreeLevels = this.R_computeGQUpgradeFreeLevelSoftcap(upgradeKey)
        const linearLevels = data.goldenQuarkUpgrades[upgradeKey].level + actualFreeLevels
        let polynomialLevels = 0

        if (this.R_getOcteractUpgradeEffect('octeractImprovedFree')) {
            let exponent = 0.6
            exponent += this.R_getOcteractUpgradeEffect('octeractImprovedFree2')
            exponent += this.R_getOcteractUpgradeEffect('octeractImprovedFree3')
            exponent += this.R_getOcteractUpgradeEffect('octeractImprovedFree4')
            polynomialLevels = Math.pow(data.goldenQuarkUpgrades[upgradeKey].level * actualFreeLevels, exponent)
        }

        return Math.max(linearLevels, polynomialLevels)
    }

    R_getGQUpgradeEffect(upgradeKey: GoldenQuarkUpgradeKey): number {
        const upgrade = goldenQuarkUpgradeMaxLevels[upgradeKey]
        const totalLevels = this.R_actualGQUpgradeTotalLevels(upgradeKey)
        return upgrade.effect ? upgrade.effect(totalLevels) : 0
    }

    R_getAntUpgradeEffect = <K extends AntUpgrades>(antUpgrade: K): AntUpgradeTypeMap[K] => {
        const actualLevel = this.R_calculateTrueAntLevel(antUpgrade)
        return this.R_antUpgradeData[antUpgrade].effect(actualLevel) as AntUpgradeTypeMap[K]
    }

    R_firstFiveFreeLevels = () => {
        return (
            this.R_getAntUpgradeEffect(AntUpgrades.FreeRunes).freeRuneLevel
            + 7 * Math.min((this.gameData?.constantUpgrades[7] ?? 0), 1000)
        )
    }

    R_antUpgradeData = {
        [AntUpgrades.AntSpeed]: {
            exemptFromCorruption: false,
            effect: (n: number) => {
                let baseMul = 1.1
                baseMul += (this.gameData?.researches[101] ?? 0) / 1000 // Research 5x1
                baseMul += (this.gameData?.researches[162] ?? 0) / 1000 // Research 7x12
                return {
                    antSpeed: Decimal.pow(baseMul, n)
                }
            }
        },
        [AntUpgrades.Coins]: {
            exemptFromCorruption: false,
            effect: (n: number) => {
                let divisor = 1
                if (this.gameData?.currentChallenge.ascension === 15) {
                    divisor = 100 + 9900 * (1000 + n) / (1000 + n ** 2)
                }
                const baseExponent = 999999 + this.R_calculateSigmoidExponential(49000001, n / 3000)
                const bonusExponent = 250 * n
                const exponent = (baseExponent + bonusExponent) / divisor
                const coinMult = Decimal.max(1, Decimal.pow(this.gameData?.ants.crumbs ?? 0, exponent))
                return {
                    crumbToCoinExp: exponent,
                    coinMultiplier: coinMult
                }
            },
        },
        [AntUpgrades.Taxes]: {

            exemptFromCorruption: false,
            effect: (n: number) => {
                return {
                    taxReduction: 0.005 + 0.995 * Math.pow(0.99, n)
                }
            },
        },
        [AntUpgrades.AcceleratorBoosts]: {

            exemptFromCorruption: false,
            effect: (n: number) => {
                return {
                    acceleratorBoostMult: this.R_calculateSigmoidExponential(20, n / 1000)
                }
            },
        },
        [AntUpgrades.Multipliers]: {

            exemptFromCorruption: false,
            effect: (n: number) => {
                return {
                    multiplierMult: this.R_calculateSigmoidExponential(40, n / 1000)
                }
            },
        },
        [AntUpgrades.Offerings]: {
            exemptFromCorruption: false,
            effect: (n: number) => {
                return {
                    offeringMult: Math.pow(1 + n / 10, 0.5)
                }
            },
        },
        [AntUpgrades.BuildingCostScale]: {
            exemptFromCorruption: false,
            effect: (n: number) => {
                const scalePercent = 3 * n
                const buildingPowerMult = 1 + n / 100
                return {
                    buildingCostScale: scalePercent / 100,
                    buildingPowerMult
                }
            },
        },
        [AntUpgrades.Salvage]: {
            exemptFromCorruption: false,
            effect: (n: number) => {
                return {
                    salvage: 120 * (1 - Math.pow(0.995, n))
                }
            },
        },
        [AntUpgrades.FreeRunes]: {
            exemptFromCorruption: false,
            effect: (n: number) => {
                return {
                    freeRuneLevel: 3000 * (1 - Math.pow(1 - 1 / 3000, n))
                }
            },
        },
        [AntUpgrades.Obtainium]: {
            exemptFromCorruption: false,
            effect: (n: number) => {
                return {
                    obtainiumMult: Math.pow(1 + n / 10, 0.5)
                }
            },
        },
        [AntUpgrades.AntSacrifice]: {
            exemptFromCorruption: false,
            effect: (n: number) => {
                return {
                    antSacrificeMultiplier: Math.pow(1 + n / 10, 0.5),
                    elo: Math.round(5 * Math.min(200, n))
                }
            },
        },
        [AntUpgrades.Mortuus]: {
            exemptFromCorruption: true,
            effect: (n: number) => {
                return {
                    talismanUnlock: n > 0,
                    globalSpeed: 2 - Math.pow(0.99, n)
                }
            },
        },
        [AntUpgrades.AntELO]: {
            exemptFromCorruption: false,
            effect: (n: number) => {
                const antSacrificeLimitCount = n + 200 * Math.min(1, n)
                const upgradeImprover = Math.min(n, +this.R_getAchievementReward('antSpeed2UpgradeImprover'))
                const effectiveSacs = Math.min(
                    antSacrificeLimitCount + upgradeImprover,
                    this.gameData?.ants.antSacrificeCount ?? 0 + upgradeImprover
                )
                const antELO = effectiveSacs
                return {
                    antELO: antELO,
                    antSacrificeLimitCount: antSacrificeLimitCount
                }
            },
        },
        [AntUpgrades.Mortuus2]: {
            exemptFromCorruption: true,
            effect: (n: number) => {
                const talismanMaxLevels = Math.min(1200, Math.floor(n / 2))
                const talismanEffectBuff = 1 + 0.9 * (1 - Math.pow(0.999, n)) + 0.005 * Math.min(20, n)
                const ascensionSpeed = 2 - Math.pow(0.996, n)
                return {
                    talismanLevelIncreaser: talismanMaxLevels,
                    talismanEffectBuff: talismanEffectBuff,
                    ascensionSpeed: ascensionSpeed
                }
            },
        },
        [AntUpgrades.AscensionScore]: {
            exemptFromCorruption: true,
            effect: (n: number) => {
                const ascensionScoreBase = 100000 * (1 - Math.pow(0.999, n))
                const bankedCubes = 4 * Math.min(200, n) + n
                return {
                    cubesBanked: bankedCubes,
                    ascensionScoreBase: ascensionScoreBase
                }
            },
        },
        [AntUpgrades.WowCubes]: {
            exemptFromCorruption: true,
            effect: (n: number) => {
                return {
                    wowCubes: 2 - Math.pow(0.999, n)
                }
            },
        }
    }

    R_achievements: Achievement[] = [
        {
            pointValue: 15,
            group: 'firstOwnedCoin',
            reward: { acceleratorPower: () => 0.001 }
        },
        {
            pointValue: 20,
            group: 'firstOwnedCoin',
        },
        {
            pointValue: 25,
            group: 'firstOwnedCoin',
            reward: { accelerators: () => Math.floor((this.gameData?.firstOwnedCoin ?? 0) / 500) }
        },
        {
            pointValue: 30,
            group: 'firstOwnedCoin',
            reward: { multipliers: () => Math.floor((this.gameData?.firstOwnedCoin ?? 0) / 1000) }
        },
        {
            pointValue: 35,
            group: 'firstOwnedCoin',
            reward: { accelBoosts: () => Math.floor((this.gameData?.firstOwnedCoin ?? 0) / 2000) }
        },
        {
            pointValue: 15,
            group: 'secondOwnedCoin',
            reward: { acceleratorPower: () => 0.0015 }
        },
        {
            pointValue: 20,
            group: 'secondOwnedCoin',
        },
        {
            pointValue: 25,
            group: 'secondOwnedCoin',
            reward: { accelerators: () => Math.floor((this.gameData?.secondOwnedCoin ?? 0) / 500) }
        },
        {
            pointValue: 30,
            group: 'secondOwnedCoin',
            reward: { multipliers: () => Math.floor((this.gameData?.secondOwnedCoin ?? 0) / 1000) }
        },
        {
            pointValue: 35,
            group: 'secondOwnedCoin',
            reward: { accelBoosts: () => Math.floor((this.gameData?.secondOwnedCoin ?? 0) / 2000) }
        },
        {
            pointValue: 15,
            group: 'thirdOwnedCoin',
            reward: { acceleratorPower: () => 0.002 }
        },
        {
            pointValue: 20,
            group: 'thirdOwnedCoin',
        },
        {
            pointValue: 25,
            group: 'thirdOwnedCoin',
            reward: { accelerators: () => Math.floor((this.gameData?.thirdOwnedCoin ?? 0) / 500) }
        },
        {
            pointValue: 30,
            group: 'thirdOwnedCoin',
            reward: { multipliers: () => Math.floor((this.gameData?.thirdOwnedCoin ?? 0) / 1000) }
        },
        {
            pointValue: 35,
            group: 'thirdOwnedCoin',
            reward: { accelBoosts: () => Math.floor((this.gameData?.thirdOwnedCoin ?? 0) / 2000) }
        },
        {
            pointValue: 15,
            group: 'fourthOwnedCoin',
            reward: { acceleratorPower: () => 0.002 }
        },
        {
            pointValue: 20,
            group: 'fourthOwnedCoin',
        },
        {
            pointValue: 25,
            group: 'fourthOwnedCoin',
            reward: { accelerators: () => Math.floor((this.gameData?.thirdOwnedCoin ?? 0) / 500) }
        },
        {
            pointValue: 30,
            group: 'fourthOwnedCoin',
            reward: { multipliers: () => Math.floor((this.gameData?.thirdOwnedCoin ?? 0) / 1000) }
        },
        {
            pointValue: 35,
            group: 'fourthOwnedCoin',
            reward: { accelBoosts: () => Math.floor((this.gameData?.thirdOwnedCoin ?? 0) / 2000) }
        },
        {
            pointValue: 15,
            group: 'fifthOwnedCoin',
            reward: { acceleratorPower: () => 0.003 }
        },
        {
            pointValue: 20,
            group: 'fifthOwnedCoin',
        },
        {
            pointValue: 25,
            group: 'fifthOwnedCoin',
            reward: { accelerators: () => Math.floor((this.gameData?.fifthOwnedCoin ?? 0) / 500) }
        },
        {
            pointValue: 30,
            group: 'fifthOwnedCoin',
            reward: { multipliers: () => Math.floor((this.gameData?.fifthOwnedCoin ?? 0) / 1000) }
        },
        {
            pointValue: 35,
            group: 'fifthOwnedCoin',
            reward: { accelBoosts: () => Math.floor((this.gameData?.fifthOwnedCoin ?? 0) / 2000) }
        },
        {
            pointValue: 5,
            group: 'prestigePointGain',
        },
        {
            pointValue: 10,
            group: 'prestigePointGain',
            reward: { crystalMultiplier: () => Math.max(1, Decimal.log(this.gameData?.prestigePoints ?? 0, Math.E)) },
        },
        {
            pointValue: 15,
            group: 'prestigePointGain',
        },
        {
            pointValue: 5,
            group: 'transcendPointGain',
        },
        {
            pointValue: 10,
            group: 'transcendPointGain',
        },
        {
            pointValue: 15,
            group: 'transcendPointGain',
            reward: { taxReduction: () => 0.95 }
        },
        {
            pointValue: 20,
            group: 'transcendPointGain',
            reward: { taxReduction: () => 0.95 }
        },
        {
            pointValue: 25,
            group: 'transcendPointGain',
            reward: { taxReduction: () => 0.9 }
        },
        {
            pointValue: 5,
            group: 'reincarnationPointGain',
            reward: { particleGain: () => 2 },
        },
        {
            pointValue: 20,
            group: 'reincarnationPointGain',
        },
        {
            pointValue: 25,
            group: 'reincarnationPointGain',
        },
        {
            pointValue: 30,
            group: 'reincarnationPointGain',
        },
        {
            pointValue: 35,
            group: 'reincarnationPointGain',
        },
        {
            pointValue: 5,
            group: 'ungrouped',
            reward: { multipliers: () => 1 },
        },
        {
            pointValue: 10,
            group: 'ungrouped',
            reward: { multipliers: () => 2 },
        },
        {
            pointValue: 15,
            group: 'ungrouped',
            reward: { multipliers: () => 4 },
        },
        {
            pointValue: 20,
            group: 'ungrouped',
            reward: { accelerators: () => 2 },
        },
        {
            pointValue: 25,
            group: 'ungrouped',
            reward: { accelerators: () => 4 },
        },
        {
            pointValue: 30,
            group: 'ungrouped',
            reward: { accelerators: () => 8 },
        },
        {
            pointValue: 35,
            group: 'ungrouped',
        },
        {
            pointValue: 5,
            group: 'ungrouped',
        },
        {
            pointValue: 10,
            group: 'ungrouped',
        },
        {
            pointValue: 15,
            group: 'ungrouped',
        },
        {
            pointValue: 15,
            group: 'ungrouped',
        },
        {
            pointValue: 20,
            group: 'ungrouped',
        },
        {
            pointValue: 30,
            group: 'ungrouped',
        },
        {
            pointValue: 40,
            group: 'ungrouped',
        },
        {
            pointValue: 10,
            group: 'ungrouped',
            reward: { conversionExponent: () => 0.01 },
        },
        {
            pointValue: 10,
            group: 'ungrouped',
            reward: { conversionExponent: () => 0.01 },
        },
        {
            pointValue: 15,
            group: 'ungrouped',
            reward: { conversionExponent: () => 0.01 },
        },
        {
            pointValue: 20,
            group: 'ungrouped',
            reward: { conversionExponent: () => 0.01 },
        },
        {
            pointValue: 25,
            group: 'ungrouped',
            reward: { conversionExponent: () => 0.01 },
        },
        {
            pointValue: 25,
            group: 'ungrouped',
            reward: { conversionExponent: () => 0.01 },
        },
        {
            pointValue: 50,
            group: 'ungrouped',
            reward: { conversionExponent: () => 0.01 },
        },
        {
            pointValue: 5,
            group: 'challenge1',
        },
        {
            pointValue: 10,
            group: 'challenge1',
        },
        {
            pointValue: 15,
            group: 'challenge1',
        },
        {
            pointValue: 25,
            group: 'challenge1',
            reward: { taxReduction: () => 0.96 }
        },
        {
            pointValue: 35,
            group: 'challenge1',
        },
        {
            pointValue: 5,
            group: 'challenge2',
        },
        {
            pointValue: 10,
            group: 'challenge2',
        },
        {
            pointValue: 15,
            group: 'challenge2',
        },
        {
            pointValue: 25,
            group: 'challenge2',
            reward: { taxReduction: () => 0.96 }
        },
        {
            pointValue: 35,
            group: 'challenge2',
        },
        {
            pointValue: 5,
            group: 'challenge3',
        },
        {
            pointValue: 10,
            group: 'challenge3',
        },
        {
            pointValue: 15,
            group: 'challenge3',
        },
        {
            pointValue: 25,
            group: 'challenge3',
            reward: { taxReduction: () => 0.96 }
        },
        {
            pointValue: 35,
            group: 'challenge3',
        },
        {
            pointValue: 5,
            group: 'challenge4',
        },
        {
            pointValue: 10,
            group: 'challenge4',
        },
        {
            pointValue: 15,
            group: 'challenge4',
        },
        {
            pointValue: 20,
            group: 'challenge4',
        },
        {
            pointValue: 25,
            group: 'challenge4',
            reward: { taxReduction: () => 0.96 }
        },
        {
            pointValue: 35,
            group: 'challenge4',
        },
        {
            pointValue: 5,
            group: 'challenge5',
        },
        {
            pointValue: 10,
            group: 'challenge5',
        },
        {
            pointValue: 15,
            group: 'challenge5',
        },
        {
            pointValue: 25,
            group: 'challenge5',
            reward: { taxReduction: () => 0.96 }
        },
        {
            pointValue: 35,
            group: 'challenge5',
        },
        {
            pointValue: 5,
            group: 'challenge6',
        },
        {
            pointValue: 15,
            group: 'challenge6',
        },
        {
            pointValue: 25,
            group: 'challenge6',
            reward: { taxReduction: () => 0.95 }
        },
        {
            pointValue: 30,
            group: 'challenge6',
            reward: {
            }
        },
        {
            pointValue: 35,
            group: 'challenge6',
        },
        {
            pointValue: 5,
            group: 'challenge7',
            reward: { diamondUpgrade18: () => 0 },
        },
        {
            pointValue: 15,
            group: 'challenge7',
        },
        {
            pointValue: 25,
            group: 'challenge7',
            reward: { taxReduction: () => 0.95 },
        },
        {
            pointValue: 30,
            group: 'challenge7',
        },
        {
            pointValue: 35,
            group: 'challenge7',
            reward: { chronosTalisman: () => 1 }
        },
        {
            pointValue: 5,
            group: 'challenge8',
            reward: { diamondUpgrade19: () => 1 },
        },
        {
            pointValue: 15,
            group: 'challenge8',
        },
        {
            pointValue: 25,
            group: 'challenge8',
            reward: { taxReduction: () => 0.95 }
        },
        {
            pointValue: 30,
            group: 'challenge8',
        },
        {
            pointValue: 35,
            group: 'challenge8',
            reward: { midasTalisman: () => 1 }
        },
        {
            pointValue: 5,
            group: 'challenge9',
            reward: { diamondUpgrade20: () => 1 },
        },
        {
            pointValue: 10,
            group: 'challenge9',
            reward: { talismanPower: () => 0.02 }
        },
        {
            pointValue: 15,
            group: 'challenge9',
            reward: { talismanPower: () => 0.02 }
        },
        {
            pointValue: 20,
            group: 'challenge9',
            reward: { sacrificeMult: () => 1.25, experientiaAutobuy: () => 1 }
        },
        {
            pointValue: 30,
            group: 'challenge9',
        },
        {
            pointValue: 35,
            group: 'challenge9',
            reward: { metaphysicsTalisman: () => 1 }
        },
        {
            pointValue: 5,
            group: 'challenge10',
        },
        {
            pointValue: 15,
            group: 'challenge10',
        },
        {
            pointValue: 20,
            group: 'challenge10',
            reward: { talismanPower: () => 0.025 }
        },
        {
            pointValue: 25,
            group: 'challenge10',
            reward: { talismanPower: () => 0.025 }
        },
        {
            pointValue: 30,
            group: 'challenge10',
        },
        {
            pointValue: 35,
            group: 'challenge10',
            reward: { polymathTalisman: () => 1 }
        },
        {
            pointValue: 10,
            group: 'accelerators',
            reward: { acceleratorPower: () => 0.01 }
        },
        {
            pointValue: 20,
            group: 'accelerators',
            reward: { accelerators: () => 5 }
        },
        {
            pointValue: 25,
            group: 'accelerators',
            reward: { accelerators: () => 12 }
        },
        {
            pointValue: 30,
            group: 'accelerators',
            reward: { accelerators: () => 25 }
        },
        {
            pointValue: 35,
            group: 'accelerators',
            reward: { accelerators: () => 50 }
        },
        {
            pointValue: 10,
            group: 'multipliers',
            reward: { multipliers: () => 1 }
        },
        {
            pointValue: 20,
            group: 'multipliers',
            reward: { multipliers: () => 1 }
        },
        {
            pointValue: 25,
            group: 'multipliers',
            reward: { multipliers: () => 3 }
        },
        {
            pointValue: 30,
            group: 'multipliers',
            reward: { multipliers: () => 6 }
        },
        {
            pointValue: 35,
            group: 'multipliers',
            reward: { multipliers: () => 10 }
        },
        {
            pointValue: 5,
            group: 'antCrumbs',
            reward: { antSpeed: () => Decimal.log(this.gameData?.ants.crumbs.plus(10) ?? 0, 10) }
        },
        {
            pointValue: 15,
            group: 'antCrumbs',
            reward: { antSpeed: () => 1.2 }
        },
        {
            pointValue: 20,
            group: 'antCrumbs',
            reward: { antSpeed: () => 1.25 }
        },
        {
            pointValue: 25,
            group: 'antCrumbs',
            reward: { antSpeed: () => 1.4, antSacrificeUnlock: () => 1, antAutobuyers: () => 1 }
        },
        {
            pointValue: 30,
            group: 'antCrumbs',
            reward: { antSpeed: () => 1 + (this.gameData?.ants.immortalELO ?? 0) / 1000, scientiaAutobuy: () => 1 }
        },
        {
            pointValue: 5,
            group: 'sacMult',
            reward: { antAutobuyers: () => 1, inceptusAutobuy: () => 1, fortunaeAutobuy: () => 1 },
        },
        {
            pointValue: 10,
            group: 'sacMult',
            reward: { antAutobuyers: () => 1, tributumAutobuy: () => 1 },
        },
        {
            pointValue: 15,
            group: 'sacMult',
            reward: { antAutobuyers: () => 1, celeritasAutobuy: () => 1, exploratoremAutobuy: () => 1 },
        },
        {
            pointValue: 20,
            group: 'sacMult',
            reward: { antAutobuyers: () => 1, sacrificiumAutobuy: () => 1 },
        },
        {
            pointValue: 25,
            group: 'sacMult',
            reward: { antAutobuyers: () => 1 },
        },
        {
            pointValue: 30,
            group: 'sacMult',
            reward: { antAutobuyers: () => 1 },
        },
        {
            pointValue: 35,
            group: 'sacMult',
            reward: { antAutobuyers: () => 1 },
        },
        {
            pointValue: 5,
            group: 'ascensionCount',
            reward: { freeAntUpgrades: () => 2 }
        },
        {
            pointValue: 10,
            group: 'ascensionCount',
            reward: { preserveAnthillCount: () => 1, antSacrificeCountMultiplier: () => 2 }
        },
        {
            pointValue: 20,
            group: 'ascensionCount',
            reward: { wowSquareTalisman: () => 1 }
        },
        {
            pointValue: 25,
            group: 'ascensionCount',
            reward: {
            }
        },
        {
            pointValue: 30,
            group: 'ascensionCount',
            reward: {
            }
        },
        {
            pointValue: 35,
            group: 'ascensionCount',
            reward: {
            }
        },
        {
            pointValue: 20,
            group: 'constant',
            reward: { wowCubeGain: () => 1 + Decimal.log(this.gameData?.ascendShards.add(1) ?? 0, 10) / 400 }
        },
        {
            pointValue: 30,
            group: 'constant',
            reward: {
            }
        },
        {
            pointValue: 35,
            group: 'constant',
            reward: { wowPlatonicGain: () => 1 + 19 * Math.min(1, Decimal.log(this.gameData?.ascendShards.plus(1) ?? 0, 10) / 100000) }
        },
        {
            pointValue: 10,
            group: 'challenge11',
            reward: { statTracker: () => 1 }
        },
        {
            pointValue: 20,
            group: 'challenge11',
        },
        {
            pointValue: 30,
            group: 'challenge11',
        },
        {
            pointValue: 40,
            group: 'challenge11',
        },
        {
            pointValue: 50,
            group: 'challenge11',
        },
        {
            pointValue: 60,
            group: 'challenge11',
            reward: { ascensionCountAdditive: () => (this.gameData?.ascensionCounter ?? 0) * 2 }
        },
        {
            pointValue: 70,
            group: 'challenge11',
            reward: { talismanPower: () => 0.01 }
        },
        {
            pointValue: 10,
            group: 'challenge12',
            reward: { ascensionRewardScaling: () => 1 }
        },
        {
            pointValue: 20,
            group: 'challenge12',
        },
        {
            pointValue: 30,
            group: 'challenge12',
        },
        {
            pointValue: 40,
            group: 'challenge12',
        },
        {
            pointValue: 50,
            group: 'challenge12',
        },
        {
            pointValue: 60,
            group: 'challenge12',
            reward: { ascensionCountAdditive: () => (this.gameData?.ascensionCounter ?? 0) * 2 }
        },
        {
            pointValue: 70,
            group: 'challenge12',
            reward: { talismanPower: () => 0.01 }
        },
        {
            pointValue: 10,
            group: 'challenge13',
        },
        {
            pointValue: 20,
            group: 'challenge13',
        },
        {
            pointValue: 30,
            group: 'challenge13',
        },
        {
            pointValue: 40,
            group: 'challenge13',
        },
        {
            pointValue: 50,
            group: 'challenge13',
        },
        {
            pointValue: 60,
            group: 'challenge13',
            reward: { ascensionCountAdditive: () => (this.gameData?.ascensionCounter ?? 0) * 2 }
        },
        {
            pointValue: 70,
            group: 'challenge13',
            reward: { talismanPower: () => 0.01 }
        },
        {
            pointValue: 10,
            group: 'challenge14',
        },
        {
            pointValue: 20,
            group: 'challenge14',
        },
        {
            pointValue: 30,
            group: 'challenge14',
        },
        {
            pointValue: 40,
            group: 'challenge14',
        },
        {
            pointValue: 50,
            group: 'challenge14',
        },
        {
            pointValue: 60,
            group: 'challenge14',
            reward: {
            }
        },
        {
            pointValue: 20,
            group: 'speedBlessing',
        },
        {
            pointValue: 10,
            group: 'speedSpirit',
        },
        {
            pointValue: 30,
            group: 'speedSpirit',
        },
        {
            pointValue: 50,
            group: 'ungrouped',
        },
        {
            pointValue: 50,
            group: 'ungrouped',
        },
        {
            pointValue: 50,
            group: 'ungrouped',
        },
        {
            pointValue: 100,
            group: 'ungrouped',
            reward: {
            }
        },
        {
            pointValue: 150,
            group: 'ungrouped',
            reward: {
            }
        },
        {
            pointValue: 50,
            group: 'ungrouped',
        },
        {
            pointValue: 40,
            group: 'ascensionScore',
            reward: { wowHypercubeGain: () => 1.1 }
        },
        {
            pointValue: 45,
            group: 'ascensionScore',
            reward: { wowCubeGain: () => 1.1 }
        },
        {
            pointValue: 50,
            group: 'ascensionScore',
            reward: { wowTesseractGain: () => 1.1 }
        },
        {
            pointValue: 55,
            group: 'ascensionScore',
            reward: { wowPlatonicGain: () => 1.1, overfluxConversionRate: () => 1.05 }
        },
        {
            pointValue: 60,
            group: 'ascensionScore',
            reward: { overfluxConversionRate: () => 1.05 }
        },
        {
            pointValue: 65,
            group: 'ascensionScore',
            reward: { wowHepteractGain: () => 1.1 }
        },
        {
            pointValue: 70,
            group: 'ascensionScore',
            reward: { ascensionScore: () => Math.pow(1.01, this.gameData?.hepteracts.abyss.TIMES_CAP_EXTENDED ?? 0) }
        },
        {
            pointValue: 40,
            group: 'ascensionCount',
            reward: { ascensionCountMultiplier: () => 1.1 }
        },
        {
            pointValue: 45,
            group: 'ascensionCount',
            reward: { ascensionCountMultiplier: () => 1.1 }
        },
        {
            pointValue: 50,
            group: 'ascensionCount',
        },
        {
            pointValue: 55,
            group: 'ascensionCount',
        },
        {
            pointValue: 60,
            group: 'ascensionCount',
        },
        {
            pointValue: 65,
            group: 'ascensionCount',
        },
        {
            pointValue: 70,
            group: 'ascensionCount',
            reward: { quarkGain: () => 1 + 0.1 * Math.min((this.gameData?.ascensionCount ?? 0) / 1e15, 1) }
        },
        {
            pointValue: 40,
            group: 'constant',
            reward: { ascensionScore: () => 1 + Math.min(Decimal.log((this.gameData?.ascendShards.add(1) ?? 0), 10) / 1e5, 1) }
        },
        {
            pointValue: 55,
            group: 'constant',
            reward: {
            }
        },
        {
            pointValue: 60,
            group: 'constant',
            reward: { platonicToHypercubes: () => Math.min(1, Decimal.log((this.gameData?.ascendShards.add(1) ?? 0), 10) / 1e6) }
        },
        {
            pointValue: 50,
            group: 'prestigePointGain',
        },
        {
            pointValue: 50,
            group: 'transcendPointGain',
        },
        {
            pointValue: 40,
            group: 'reincarnationPointGain',
        },
        {
            pointValue: 45,
            group: 'reincarnationPointGain',
        },
        {
            pointValue: 50,
            group: 'reincarnationPointGain',
        },
        {
            pointValue: 40,
            group: 'sacMult',
        },
        {
            pointValue: 45,
            group: 'sacMult',
        },
        {
            pointValue: 50,
            reward: { antAutobuyers: () => 1 },
            group: 'sacMult',
        },
        {
            pointValue: 40,
            group: 'speedBlessing',
        },
        {
            pointValue: 60,
            group: 'speedBlessing',
        },
        {
            pointValue: 80,
            group: 'speedBlessing',
        },
        {
            pointValue: 100,
            group: 'speedBlessing',
        },
        {
            pointValue: 50,
            group: 'speedSpirit',
        },
        {
            pointValue: 70,
            group: 'speedSpirit',
        },
        {
            pointValue: 90,
            group: 'speedSpirit',
        },
        {
            pointValue: 2,
            group: 'runeLevel',
        },
        {
            pointValue: 6,
            group: 'runeLevel',
        },
        {
            pointValue: 10,
            group: 'runeLevel',
        },
        {
            pointValue: 14,
            group: 'runeLevel',
        },
        {
            pointValue: 18,
            group: 'runeLevel',
        },
        {
            pointValue: 22,
            group: 'runeLevel',
        },
        {
            pointValue: 24,
            group: 'runeLevel',
        },
        {
            pointValue: 26,
            group: 'runeLevel',
        },
        {
            pointValue: 28,
            group: 'runeLevel',
        },
        {
            pointValue: 30,
            group: 'runeLevel',
        },
        {
            pointValue: 2,
            group: 'runeFreeLevel',
        },
        {
            pointValue: 6,
            group: 'runeFreeLevel',
        },
        {
            pointValue: 10,
            group: 'runeFreeLevel',
        },
        {
            pointValue: 14,
            group: 'runeFreeLevel',
        },
        {
            pointValue: 18,
            group: 'runeFreeLevel',
        },
        {
            pointValue: 22,
            group: 'runeFreeLevel',
        },
        {
            pointValue: 26,
            group: 'runeFreeLevel',
        },
        {
            pointValue: 30,
            group: 'runeFreeLevel',
        },
        {
            pointValue: 5,
            group: 'campaignTokens',
        },
        {
            pointValue: 10,
            group: 'campaignTokens',
        },
        {
            pointValue: 15,
            group: 'campaignTokens',
        },
        {
            pointValue: 20,
            group: 'campaignTokens',
        },
        {
            pointValue: 25,
            group: 'campaignTokens',
        },
        {
            pointValue: 30,
            group: 'campaignTokens',
        },
        {
            pointValue: 35,
            group: 'campaignTokens',
        },
        {
            pointValue: 40,
            group: 'campaignTokens',
        },
        {
            pointValue: 45,
            group: 'campaignTokens',
        },
        {
            pointValue: 50,
            group: 'campaignTokens',
        },
        {
            pointValue: 2,
            group: 'prestigeCount',
        },
        {
            pointValue: 4,
            group: 'prestigeCount',
            reward: { prestigeCountMultiplier: () => Math.max(1, 1 + Math.floor(Math.log10(this.gameData?.prestigeCount ?? 0))) }
        },
        {
            pointValue: 6,
            group: 'prestigeCount',
            reward: { duplicationRuneUnlock: () => 1 }
        },
        {
            pointValue: 8,
            group: 'prestigeCount',
            reward: { offeringBonus: () => 1 + 0.02 * Math.max(1, 1 + Math.floor(Math.log10(this.gameData?.prestigeCount ?? 0))) }
        },
        {
            pointValue: 10,
            group: 'prestigeCount',
        },
        {
            pointValue: 12,
            group: 'prestigeCount',
        },
        {
            pointValue: 14,
            group: 'prestigeCount',
            reward: { transcendToPrestige: () => 1 }
        },
        {
            pointValue: 16,
            group: 'prestigeCount',
        },
        {
            pointValue: 18,
            group: 'prestigeCount',
            reward: { transcensionCountMultiplier: () => Math.min(4, 1.25 + 2.75 * Math.floor((this.gameData?.prestigecounter ?? 0) / 10)) }
        },
        {
            pointValue: 20,
            group: 'prestigeCount',
        },
        {
            pointValue: 22,
            group: 'prestigeCount',
        },
        {
            pointValue: 24,
            group: 'prestigeCount',
        },
        {
            pointValue: 26,
            group: 'prestigeCount',
        },
        {
            pointValue: 28,
            group: 'prestigeCount',
        },
        {
            pointValue: 30,
            group: 'prestigeCount',
        },
        {
            pointValue: 3,
            group: 'transcensionCount',
        },
        {
            pointValue: 6,
            group: 'transcensionCount',
            reward: { transcensionCountMultiplier: () => Math.max(1, 1 + Math.floor(Math.log10(this.gameData?.transcendCount ?? 0))) }
        },
        {
            pointValue: 9,
            group: 'transcensionCount',
            reward: { salvage: () => 2 * Math.max(1, 1 + Math.floor(Math.log10(this.gameData?.transcendCount ?? 0))) }
        },
        {
            pointValue: 12,
            group: 'transcensionCount',
            reward: { prismRuneUnlock: () => 1 }
        },
        {
            pointValue: 15,
            group: 'transcensionCount',
        },
        {
            pointValue: 18,
            group: 'transcensionCount',
        },
        {
            pointValue: 21,
            group: 'transcensionCount',
            reward: { reincarnationToTranscend: () => 1 }
        },
        {
            pointValue: 24,
            group: 'transcensionCount',
        },
        {
            pointValue: 27,
            group: 'transcensionCount',
            reward: { reincarnationCountMultiplier: () => Math.min(4, 1.25 + 2.75 * Math.floor((this.gameData?.prestigecounter ?? 0) / 1000)) }
        },
        {
            pointValue: 30,
            group: 'transcensionCount',
        },
        {
            pointValue: 33,
            group: 'transcensionCount',
        },
        {
            pointValue: 36,
            group: 'transcensionCount',
        },
        {
            pointValue: 39,
            group: 'transcensionCount',
        },
        {
            pointValue: 42,
            group: 'transcensionCount',
        },
        {
            pointValue: 45,
            group: 'transcensionCount',
        },
        {
            pointValue: 4,
            group: 'reincarnationCount',
        },
        {
            pointValue: 8,
            group: 'reincarnationCount',
            reward: { reincarnationCountMultiplier: () => Math.max(1, 1 + Math.floor(Math.log10(this.gameData?.reincarnationCount ?? 0))) }
        },
        {
            pointValue: 12,
            group: 'reincarnationCount',
            reward: { obtainiumBonus: () => 1 + 0.02 * Math.max(1, 1 + Math.floor(Math.log10(this.gameData?.reincarnationCount ?? 0))) }
        },
        {
            pointValue: 16,
            group: 'reincarnationCount',
        },
        {
            pointValue: 20,
            group: 'reincarnationCount',
            reward: { thriftRuneUnlock: () => 1 }
        },
        {
            pointValue: 24,
            group: 'reincarnationCount',
        },
        {
            pointValue: 28,
            group: 'reincarnationCount',
        },
        {
            pointValue: 32,
            group: 'reincarnationCount',
        },
        {
            pointValue: 36,
            group: 'reincarnationCount',
            reward: {
            }
        },
        {
            pointValue: 40,
            group: 'reincarnationCount',
        },
        {
            pointValue: 44,
            group: 'reincarnationCount',
        },
        {
            pointValue: 48,
            group: 'reincarnationCount',
        },
        {
            pointValue: 52,
            group: 'reincarnationCount',
        },
        {
            pointValue: 56,
            group: 'reincarnationCount',
        },
        {
            pointValue: 60,
            group: 'reincarnationCount',
        },
        {
            pointValue: 3,
            group: 'sacCount',
            reward: { freeAntUpgrades: () => 1 }
        },
        {
            pointValue: 6,
            group: 'sacCount',
            reward: { antSacrificeCountMultiplier: () => 2, hicAutobuy: () => 1 }
        },
        {
            pointValue: 9,
            group: 'sacCount',
            reward: { autoAntSacrifice: () => 1 }
        },
        {
            pointValue: 12,
            group: 'sacCount',
            reward: { antELOAdditiveMultiplier: () => 0.01, praemoenioAutobuy: () => 1 }
        },
        {
            pointValue: 15,
            group: 'sacCount',
            reward: { antELOAdditive: () => 25 }
        },
        {
            pointValue: 17,
            group: 'sacCount',
            reward: { antSpeed2UpgradeImprover: () => this.R_calculateSynergismLevel(), phylacteriumAutobuy: () => 1 }
        },
        {
            pointValue: 19,
            group: 'sacCount',
        },
        {
            pointValue: 21,
            group: 'sacCount',
        },
        {
            pointValue: 23,
            group: 'sacCount',
        },
        {
            pointValue: 25,
            group: 'sacCount',
            reward: { preserveAnthillCountSingularity: () => 1 }
        },
        {
            pointValue: 40,
            group: 'sacCount',
        }
    ]

    R_progressiveAchievements: Record<ProgressiveAchievements, ProgressiveAchievement> = {
        runeLevel: {
            maxPointValue: 1000,
            pointsAwarded: (cached: number) => {
                console.log(cached)
                return Math.min(200, Math.floor(cached / 1000)) + Math.min(400, Math.floor(cached / 2500))
                    + Math.min(400, Math.floor(cached / 12500))
            }
        },
        freeRuneLevel: {
            maxPointValue: 500,
            pointsAwarded: (cached: number) => {
                return Math.min(100, Math.floor(cached / 250)) + Math.min(200, Math.floor(cached / 750))
                    + Math.min(200, Math.floor(cached / 2500))
            }
        },
        antMasteries: {
            maxPointValue: 360,
            pointsAwarded: (_cached: number) => {
                let pointValue = 0
                for (let ant = AntProducers.Workers; ant <= LAST_ANT_PRODUCER; ant++) {
                    pointValue += 3 * (this.gameData?.ants.masteries[ant].highestMastery ?? 0)
                    if ((this.gameData?.ants.masteries[ant].highestMastery ?? 0) >= 12) {
                        pointValue += 4
                    }
                }
                return pointValue
            },
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
        },
        singularityCount: {
            maxPointValue: 3600,
            pointsAwarded: (_cached: number) => {
                return 9 * (this.gameData?.highestSingularityCount ?? 0)
                    + 3 * Math.max(0, (this.gameData?.highestSingularityCount ?? 0) - 100)
                    + 3 * Math.max(0, (this.gameData?.highestSingularityCount ?? 0) - 200)
            },
        },
        ambrosiaCount: {
            maxPointValue: 800,
            pointsAwarded: (cached: number) => {
                return Math.min(200, Math.floor(cached / 100))
                    + Math.min(200, Math.floor(cached / 10000))
                    + Math.min(400, Math.floor(400 * Math.sqrt(cached / 1e8)))
            },
        },
        redAmbrosiaCount: {
            maxPointValue: 1000,
            pointsAwarded: (cached: number) => {
                return Math.min(200, Math.floor(cached / 25))
                    + Math.min(200, Math.floor(cached / 2500))
                    + Math.min(400, Math.floor(400 * cached / 5e6))
                    + Math.min(200, Math.floor(200 * cached / 1.25e7))
            },
        },
        exalts: {
            maxPointValue: this.R_maxAPFromChallenges,
            pointsAwarded: (_cached: number) => {
                let pointValue = 0
                for (const chal of Object.keys(this.gameData?.singularityChallenges ?? "") as SingularityChallengeDataKeys[]) {
                    pointValue += this.getSingChalApReward(chal)
                }
                return pointValue
            },
        },
        singularityUpgrades: {
            maxPointValue: this.R_maxGoldenQuarkUpgradeAP,
            pointsAwarded: (_cached: number) => {
                let pointValue = 0
                // Go through all sing upgrades. if the max level is NOT -1, add 5 points if the upgrade level equals max level
                for (const upgradeKey of Object.keys(
                    goldenQuarkUpgradeMaxLevels
                ) as GoldenQuarkUpgradeKey[]) {
                    const maxLevel = goldenQuarkUpgradeMaxLevels[upgradeKey].maxLevel
                    const playerLevel =
                        this.gameData?.goldenQuarkUpgrades[upgradeKey]?.level ?? 0

                    if (maxLevel !== -1 && playerLevel >= maxLevel) {
                        pointValue += 5
                    }
                }
                return pointValue;
            },
        },
        octeractUpgrades: {
            maxPointValue: this.R_maxOcteractUpgradeAP,
            pointsAwarded: (_cached: number) => {
                let pointValue = 0
                // Go through all octeract upgrades. if the max level is NOT -1, add 8 points if the upgrade level equals max level
                for (const upgradeKey of Object.keys(octeractUpgradeMaxLevels) as OcteractUpgradeKey[]) {
                    const maxLevel = octeractUpgradeMaxLevels[upgradeKey].maxLevel
                    const playerLevel =
                        this.gameData?.octUpgrades[upgradeKey]?.level ?? 0
                    if (maxLevel !== -1 && playerLevel >= maxLevel) {
                        pointValue += 8
                    }
                }
                return pointValue
            },
        },
        redAmbrosiaUpgrades: {
            maxPointValue: this.R_maxRedAmbrosiaUpgradeAP,
            pointsAwarded: () => {
                let pointValue = 0
                for (const upgradeKey of Object.keys(redAmbrosiaUpgradeCalculationCollection) as RedAmbrosiaUpgradeKey[]) {
                    const maxLevel = redAmbrosiaUpgradeCalculationCollection[upgradeKey].maxLevel
                    const playerLevel = this.R_calculateRedAmbrosiaUpgradeValue(upgradeKey);
                    if (maxLevel !== -1 && playerLevel >= maxLevel) {
                        pointValue += 10
                    }
                }
                return pointValue
            },
        },
        talismanRarities: {
            maxPointValue: this.R_maxTalismansRarityAP,
            pointsAwarded: (cached: number) => {
                return 5 * cached
            },
        }
    }

    R_calculateConsumableEventBuff(buff: EventBuffType) {
        if (!this.eventData) return 0;

        const data = this.eventData;
        const cacheName = `EVENTBUFF_${HSUtils.eventBuffNumToName(buff)}` as keyof CalculationCache;

        const calculationVars: number[] = [
            data.HAPPY_HOUR_BELL.amount,
            buff
        ]

        const cached = this.#checkCache(cacheName, calculationVars);

        if (cached) return cached;

        const { HAPPY_HOUR_BELL } = this.eventData;

        const happyHourInterval = HAPPY_HOUR_BELL.amount - 1

        if (HAPPY_HOUR_BELL.amount === 0) {
            this.#updateCache(cacheName, { value: 0, cachedBy: calculationVars });
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

        this.#updateCache(cacheName, { value: val, cachedBy: calculationVars });

        return val;
    }



    getSingChalApReward(chal: SingularityChallengeDataKeys): number {
        if (!this.gameData) return 0;

        const chalData = this.R_singularityChallengeData[chal];
        if (!chalData) return 0;

        const completions =
            this.gameData.singularityChallenges[chal]?.completions ?? 0;

        return chalData.achievementPointValue(completions);
    }



    R_calculateLeaderboardValue = (leaderboard: Array<{ elo: number; sacrificeId: number }>): number => {
        let total = 0
        const LEADERBOARD_WEIGHTS = [1, 0.8, 0.6, 0.4, 0.2]
        for (let i = 0; i < Math.min(leaderboard.length, LEADERBOARD_WEIGHTS.length); i++) {
            total += leaderboard[i].elo * LEADERBOARD_WEIGHTS[i]
        }
        return total
    }

    // https://github.com/Pseudo-Corp/SynergismOfficial/blob/master/src/Calculate.ts#L2340
    R_calculateAmbrosiaGenerationShopUpgrade(reduce_vals = true) {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'R_AmbrosiaGenerationShopUpgrade' as keyof CalculationCache;

        const calculationVars: number[] = [
            data.shopUpgrades.shopAmbrosiaGeneration1,
            data.shopUpgrades.shopAmbrosiaGeneration2,
            data.shopUpgrades.shopAmbrosiaGeneration3,
            data.shopUpgrades.shopAmbrosiaGeneration4
        ]

        const cached = this.#checkCache(cacheName, calculationVars);

        if (cached) return cached;

        const vals = [
            1 + data.shopUpgrades.shopAmbrosiaGeneration1 / 100,
            1 + data.shopUpgrades.shopAmbrosiaGeneration2 / 100,
            1 + data.shopUpgrades.shopAmbrosiaGeneration3 / 100,
            1 + data.shopUpgrades.shopAmbrosiaGeneration4 / 1000
        ]

        const reduced = vals.reduce((a, b) => a * b);

        this.#updateCache(cacheName, { value: reduced, cachedBy: calculationVars });

        return reduce_vals ? reduced : vals;
    }

    // https://github.com/Pseudo-Corp/SynergismOfficial/blob/master/src/Calculate.ts#L2362
    // https://github.com/Pseudo-Corp/SynergismOfficial/blob/master/src/singularity.ts#L1515
    R_calculateAmbrosiaGenerationSingularityUpgrade(reduce_vals = true) {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'R_AmbrosiaGenerationSingularityUpgrade' as keyof CalculationCache;

        const calculationVars: number[] = [
            data.goldenQuarkUpgrades.singAmbrosiaGeneration.level,
            data.goldenQuarkUpgrades.singAmbrosiaGeneration2.level,
            data.goldenQuarkUpgrades.singAmbrosiaGeneration3.level,
            data.goldenQuarkUpgrades.singAmbrosiaGeneration4.level
        ]

        const cached = this.#checkCache(cacheName, calculationVars);

        if (cached) return cached;

        const vals = [
            1 + data.goldenQuarkUpgrades.singAmbrosiaGeneration.level / 100,
            1 + data.goldenQuarkUpgrades.singAmbrosiaGeneration2.level / 100,
            1 + data.goldenQuarkUpgrades.singAmbrosiaGeneration3.level / 100,
            1 + (2 * data.goldenQuarkUpgrades.singAmbrosiaGeneration4.level) / 100,
        ]

        const reduced = vals.reduce((a, b) => a * b);

        this.#updateCache(cacheName, { value: reduced, cachedBy: calculationVars });

        return reduce_vals ? reduced : vals;
    }

    // https://github.com/Pseudo-Corp/SynergismOfficial/blob/master/src/Calculate.ts#L2384
    R_calculateAmbrosiaGenerationOcteractUpgrade(reduce_vals = true) {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'R_AmbrosiaGenerationOcteractUpgrade' as keyof CalculationCache;

        const calculationVars: number[] = [
            data.octUpgrades.octeractAmbrosiaGeneration.level,
            data.octUpgrades.octeractAmbrosiaGeneration2.level,
            data.octUpgrades.octeractAmbrosiaGeneration3.level,
            data.octUpgrades.octeractAmbrosiaGeneration4.level,
        ]

        const cached = this.#checkCache(cacheName, calculationVars);

        if (cached) return cached;

        const vals = [
            1 + data.octUpgrades.octeractAmbrosiaGeneration.level / 100,
            1 + data.octUpgrades.octeractAmbrosiaGeneration2.level / 100,
            1 + data.octUpgrades.octeractAmbrosiaGeneration3.level / 100,
            1 + 2 * data.octUpgrades.octeractAmbrosiaGeneration4.level / 100
        ]

        const reduced = vals.reduce((a, b) => a * b);

        this.#updateCache(cacheName, { value: reduced, cachedBy: calculationVars });

        return reduce_vals ? reduced : vals;
    }

    // https://github.com/Pseudo-Corp/SynergismOfficial/blob/master/src/Calculate.ts#L2453
    R_calculateSingularityMilestoneBlueberries() {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'R_SingularityMilestoneBlueberries' as keyof CalculationCache;

        const calculationVars: number[] = [
            data.highestSingularityCount
        ]

        const cached = this.#checkCache(cacheName, calculationVars);

        if (cached) return cached;

        let val = 0

        if (data.highestSingularityCount >= 270) val = 5
        else if (data.highestSingularityCount >= 256) val = 4
        else if (data.highestSingularityCount >= 192) val = 3
        else if (data.highestSingularityCount >= 128) val = 2
        else if (data.highestSingularityCount >= 64) val = 1

        const reduced = val;

        this.#updateCache(cacheName, { value: reduced, cachedBy: calculationVars });

        return reduced;
    }

    // https://github.com/Pseudo-Corp/SynergismOfficial/blob/master/src/Calculate.ts#L2539
    R_calculateDilatedFiveLeafBonus() {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'R_DilatedFiveLeafBonus' as keyof CalculationCache;

        const calculationVars: number[] = [
            data.highestSingularityCount
        ]

        const cached = this.#checkCache(cacheName, calculationVars);

        if (cached) return cached;

        const singThresholds = [100, 150, 200, 225, 250, 255, 260, 265, 269, 272]
        let val = singThresholds.length / 100;

        for (let i = 0; i < singThresholds.length; i++) {
            if (data.highestSingularityCount < singThresholds[i]) {
                val = i / 100;
                break;
            }
        }

        const reduced = val;

        this.#updateCache(cacheName, { value: reduced, cachedBy: calculationVars });

        return reduced;
    }

    // https://github.com/Pseudo-Corp/SynergismOfficial/blob/master/src/Calculate.ts#L2320
    R_calculateSingularityAmbrosiaLuckMilestoneBonus() {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'R_SingularityAmbrosiaLuckMilestoneBonus' as keyof CalculationCache;

        const calculationVars: number[] = [
            data.highestSingularityCount
        ]

        const cached = this.#checkCache(cacheName, calculationVars);

        if (cached) return cached;

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

        this.#updateCache(cacheName, { value: reduced, cachedBy: calculationVars });

        return reduced;
    }

    // https://github.com/Pseudo-Corp/SynergismOfficial/blob/master/src/Calculate.ts#L2351
    R_calculateAmbrosiaLuckShopUpgrade(reduce_vals = true) {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'R_AmbrosiaLuckShopUpgrade' as keyof CalculationCache;

        const calculationVars: number[] = [
            data.shopUpgrades.shopAmbrosiaLuck1,
            data.shopUpgrades.shopAmbrosiaLuck2,
            data.shopUpgrades.shopAmbrosiaLuck3,
            data.shopUpgrades.shopAmbrosiaLuck4
        ]

        const cached = this.#checkCache(cacheName, calculationVars);

        if (cached) return cached;

        const vals = [
            2 * data.shopUpgrades.shopAmbrosiaLuck1,
            2 * data.shopUpgrades.shopAmbrosiaLuck2,
            2 * data.shopUpgrades.shopAmbrosiaLuck3,
            0.6 * data.shopUpgrades.shopAmbrosiaLuck4
        ]

        const reduced = vals.reduce((a, b) => a + b, 0);

        this.#updateCache(cacheName, { value: reduced, cachedBy: calculationVars });

        return reduce_vals ? reduced : vals;
    }

    // https://github.com/Pseudo-Corp/SynergismOfficial/blob/master/src/Calculate.ts#L2373
    R_calculateAmbrosiaLuckSingularityUpgrade(reduce_vals = true) {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'R_AmbrosiaLuckSingularityUpgrade' as keyof CalculationCache;

        const calculationVars: number[] = [
            data.goldenQuarkUpgrades.singAmbrosiaLuck.level,
            data.goldenQuarkUpgrades.singAmbrosiaLuck2.level,
            data.goldenQuarkUpgrades.singAmbrosiaLuck3.level,
            data.goldenQuarkUpgrades.singAmbrosiaLuck4.level,
        ]

        const cached = this.#checkCache(cacheName, calculationVars);

        if (cached) return cached;

        const vals = [
            +data.goldenQuarkUpgrades.singAmbrosiaLuck.level * 4,
            +data.goldenQuarkUpgrades.singAmbrosiaLuck2.level * 2,
            +data.goldenQuarkUpgrades.singAmbrosiaLuck3.level * 3,
            +data.goldenQuarkUpgrades.singAmbrosiaLuck4.level * 5
        ]

        const reduced = vals.reduce((a, b) => a + b, 0);

        this.#updateCache(cacheName, { value: reduced, cachedBy: calculationVars });

        return reduce_vals ? reduced : vals;
    }

    R_calculateAmbrosiaLuckOcteractUpgrade(reduce_vals = true) {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'R_AmbrosiaLuckOcteractUpgrade' as keyof CalculationCache;

        const calculationVars: number[] = [
            data.octUpgrades.octeractAmbrosiaLuck.level,
            data.octUpgrades.octeractAmbrosiaLuck2.level,
            data.octUpgrades.octeractAmbrosiaLuck3.level,
            data.octUpgrades.octeractAmbrosiaLuck4.level,
        ]

        const cached = this.#checkCache(cacheName, calculationVars);

        if (cached) return cached;

        const vals = [
            +data.octUpgrades.octeractAmbrosiaLuck.level * 4,
            +data.octUpgrades.octeractAmbrosiaLuck2.level * 2,
            +data.octUpgrades.octeractAmbrosiaLuck3.level * 3,
            +data.octUpgrades.octeractAmbrosiaLuck4.level * 5
        ]

        const reduced = vals.reduce((a, b) => a + b, 0);

        this.#updateCache(cacheName, { value: reduced, cachedBy: calculationVars });

        return reduce_vals ? reduced : vals;
    }

    R_calculateTotalCubes() {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'R_TotalCubes' as keyof CalculationCache;

        const calculationVars: number[] = [
            data.wowCubes,
            data.wowTesseracts,
            data.wowHypercubes,
            data.wowPlatonicCubes,
            data.wowAbyssals,
            data.wowOcteracts
        ]

        const cached = this.#checkCache(cacheName, calculationVars);

        if (cached) return cached;

        const reduced = (Math.floor(Math.log10(Number(data.wowCubes) + 1))
            + Math.floor(Math.log10(Number(data.wowTesseracts) + 1))
            + Math.floor(Math.log10(Number(data.wowHypercubes) + 1))
            + Math.floor(Math.log10(Number(data.wowPlatonicCubes) + 1))
            + Math.floor(Math.log10(data.wowAbyssals + 1))
            + Math.floor(Math.log10(data.wowOcteracts + 1))
            + 6);

        this.#updateCache(cacheName, { value: reduced, cachedBy: calculationVars });

        return reduced;
    }

    R_calculateAmbrosiaUpgradeValue(
        upgradeName: keyof AmbrosiaUpgrades,
    ) {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = `REDAMB_${upgradeName}` as keyof CalculationCache;

        if (!(upgradeName in data.ambrosiaUpgrades)) return 0;
        if (!(upgradeName in this.#ambrosiaCalculationCollection)) return 0;

        const calculationVars: number[] = [
            data.ambrosiaUpgrades[upgradeName].ambrosiaInvested
        ]

        const cached = this.#checkCache(cacheName, calculationVars);

        if (cached) return cached;

        const investmentParameters = ((this.#ambrosiaCalculationCollection as any)[upgradeName]) as RedAmbrosiaUpgradeCalculationConfig;

        const upgradeValue = this.#investToAmbrosiaUpgrade(
            data.ambrosiaUpgrades[upgradeName].ambrosiaInvested,
            investmentParameters.costPerLevel,
            investmentParameters.maxLevel,
            investmentParameters.costFunction,
            investmentParameters.levelFunction
        );

        const reduced = upgradeValue;

        this.#updateCache(cacheName, { value: reduced, cachedBy: calculationVars });

        return reduced;
    }

    R_calculateSynergismLevel(): number {
        if (!this.gameData) return 0;
        const data = this.gameData;

        let points = 0

        points += this.R_achievements.reduce((sum, ach, index) => {
            return sum + (data.achievements[index] ? ach.pointValue : 0)
        }, 0)
        /* later?
        for (const k of Object.keys(progressivethis.R_achievements) as Progressivethis.R_achievements[]) {
            const pointsAwarded = progressivethis.R_achievements[k].pointsAwarded(this.gameData?.progressivethis.R_achievements[k])
            achievementPoints += pointsAwarded
            progressivethis.R_achievements[k].rewardedAP = pointsAwarded
            updateProgressiveCache(k, sourcedFromUpdate)
        }
     
        let level: number;
        if (points < 2500) {
            level = Math.floor(points / 50)
        } else {
            level = 50 + Math.floor((points - 2500) / 100)
        }
        return level
    }*/
        return 0;
    }

    R_calculateRedAmbrosiaUpgradeValue(
        upgradeName: keyof RedAmbrosiaUpgrades,
    ) {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = `REDAMB_${upgradeName}` as keyof CalculationCache;

        if (!(upgradeName in data.redAmbrosiaUpgrades)) return 0;
        if (!(upgradeName in this.#redAmbrosiaCalculationCollection)) return 0;

        const calculationVars: number[] = [
            data.redAmbrosiaUpgrades[upgradeName]
        ]

        const cached = this.#checkCache(cacheName, calculationVars);
        if (cached) return cached;

        const investmentParameters = ((this.#redAmbrosiaCalculationCollection as any)[upgradeName]) as RedAmbrosiaUpgradeCalculationConfig;

        const upgradeValue = this.#investToRedAmbrosiaUpgrade(
            data.redAmbrosiaUpgrades[upgradeName],
            investmentParameters.costPerLevel,
            investmentParameters.maxLevel,
            investmentParameters.costFunction,
            investmentParameters.levelFunction
        );

        const reduced = upgradeValue;

        this.#updateCache(cacheName, { value: reduced, cachedBy: calculationVars });

        return reduced;
    }

    R_calculateCampaignAmbrosiaSpeedBonus() {
        const cacheName = 'R_CampaignAmbrosiaSpeedBonus' as keyof CalculationCache;

        const tokens = this.campaignData?.tokens ?? 0;

        const calculationVars: number[] = [
            tokens
        ]

        const cached = this.#checkCache(cacheName, calculationVars);

        if (cached) return cached;

        let campaignBlueberrySpeedBonus;

        if (tokens < 2000) {
            campaignBlueberrySpeedBonus = 1;
        } else {
            campaignBlueberrySpeedBonus = 1 + 0.02 * 1 / 2000 * Math.min(tokens - 2000, 2000) + 0.03 * (1 - Math.exp(-Math.max(tokens - 4000, 0) / 2000))
        }

        const reduced = campaignBlueberrySpeedBonus;

        this.#updateCache(cacheName, { value: reduced, cachedBy: calculationVars });

        return reduced;
    }

    R_calculateCampaignLuckBonus() {
        const cacheName = 'R_CampaignLuckBonus' as keyof CalculationCache;

        const tokens = this.campaignData?.tokens ?? 0;

        const calculationVars: number[] = [
            tokens
        ]

        const cached = this.#checkCache(cacheName, calculationVars);

        if (cached) return cached;

        let campaignBonus;

        if (tokens < 2000) {
            campaignBonus = 0;
        } else {
            campaignBonus = 10
                + 40 * 1 / 2000 * Math.min(tokens - 2000, 2000)
                + 50 * (1 - Math.exp(-Math.max(tokens - 4000, 0) / 2500));
        }

        const reduced = campaignBonus;

        this.#updateCache(cacheName, { value: reduced, cachedBy: calculationVars });

        return reduced;
    }

    // https://github.com/Pseudo-Corp/SynergismOfficial/blob/master/src/Calculate.ts#L2753
    R_calculateCookieUpgrade29Luck() {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'R_CookieUpgrade29Luck' as keyof CalculationCache;

        const cube79 = data.cubeUpgrades[79] ?? 0;

        const calculationVars: number[] = [
            cube79,
            data.lifetimeRedAmbrosia
        ]

        const cached = this.#checkCache(cacheName, calculationVars);

        if (cached) return cached;

        let val;

        if (data.cubeUpgrades[79] === 0 || data.lifetimeRedAmbrosia === 0) {
            val = 0;
        } else {
            val = 10 * Math.pow(Math.log10(data.lifetimeRedAmbrosia), 2)
        }

        const reduced = val;

        this.#updateCache(cacheName, { value: reduced, cachedBy: calculationVars });

        return reduced;
    }

    // https://github.com/Pseudo-Corp/SynergismOfficial/blob/master/src/Calculate.ts#L2652
    R_calculateSumOfExaltCompletions() {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'R_SumOfExaltCompletions' as keyof CalculationCache;

        const calculationVars: number[] = [
            ...(Object.values(data.singularityChallenges) as SingularityChallengeStatus[]).map((c) => c.completions)
        ]

        const cached = this.#checkCache(cacheName, calculationVars);

        if (cached) return cached;

        let sum = 0

        for (const challenge of Object.values(data.singularityChallenges)) {
            sum += challenge.completions
        }

        const reduced = sum;

        this.#updateCache(cacheName, { value: reduced, cachedBy: calculationVars });

        return reduced;
    }

    // https://github.com/Pseudo-Corp/SynergismOfficial/blob/0ffbd184938677cf8137a404cffb2f4b5b5d3ab9/src/Calculate.ts
    R_calculateNumberOfThresholds = () => {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'R_NumberOfThresholds' as keyof CalculationCache;
        const digitReduction = HSGlobal.HSAmbrosia.R_digitReduction;

        const calculationVars: number[] = [
            data.lifetimeAmbrosia
        ]

        const cached = this.#checkCache(cacheName, calculationVars);

        if (cached) return cached;

        const numDigits = data.lifetimeAmbrosia > 0 ? 1 + Math.floor(Math.log10(data.lifetimeAmbrosia)) : 0
        const matissa = Math.floor(data.lifetimeAmbrosia / Math.pow(10, numDigits - 1))

        const extraReduction = matissa >= 3 ? 1 : 0

        const reduced = Math.max(0, 2 * (numDigits - digitReduction) - 1 + extraReduction);

        this.#updateCache(cacheName, { value: reduced, cachedBy: calculationVars });

        return reduced;
    }

    // https://github.com/Pseudo-Corp/SynergismOfficial/blob/0ffbd184938677cf8137a404cffb2f4b5b5d3ab9/src/Calculate.ts
    R_calculateToNextThreshold = () => {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'R_ToNextThreshold' as keyof CalculationCache;
        const digitReduction = HSGlobal.HSAmbrosia.R_digitReduction;

        const calculationVars: number[] = [
            data.lifetimeAmbrosia
        ]

        const cached = this.#checkCache(cacheName, calculationVars);

        if (cached) return cached;

        const numThresholds = this.R_calculateNumberOfThresholds();

        let val;

        if (numThresholds === 0) {
            val = 10000 - data.lifetimeAmbrosia
        } else {
            // This is when the previous threshold is of the form 3 * 10^n
            if (numThresholds % 2 === 0) {
                val = Math.pow(10, numThresholds / 2 + digitReduction) - data.lifetimeAmbrosia
            } // Previous threshold is of the form 10^n
            else {
                val = 3 * Math.pow(10, (numThresholds - 1) / 2 + digitReduction) - data.lifetimeAmbrosia
            }
        }

        const reduced = val;

        this.#updateCache(cacheName, { value: reduced, cachedBy: calculationVars });

        return reduced;
    }

    // https://github.com/Pseudo-Corp/SynergismOfficial/blob/0ffbd184938677cf8137a404cffb2f4b5b5d3ab9/src/Calculate.ts
    R_calculateRequiredBlueberryTime = () => {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'R_RequiredBlueberryTime' as keyof CalculationCache;
        const timePerAmbrosia = HSGlobal.HSAmbrosia.R_TIME_PER_AMBROSIA // Currently 30

        const calculationVars: number[] = [
            data.lifetimeAmbrosia
        ]

        const cached = this.#checkCache(cacheName, calculationVars);

        if (cached) return cached;

        let val = timePerAmbrosia;
        val += Math.floor(data.lifetimeAmbrosia / 500)

        const exalt5Comps = data.singularityChallenges.noAmbrosiaUpgrades.completions
        const acceleratorMult = 1 - 0.004 * exalt5Comps * data.shopUpgrades.shopAmbrosiaAccelerator

        val *= acceleratorMult;
        val = Math.ceil(val);

        const thresholds = this.R_calculateNumberOfThresholds();
        const thresholdBase = 2;

        const reduced = Math.pow(thresholdBase, thresholds) * val;

        this.#updateCache(cacheName, { value: reduced, cachedBy: calculationVars });

        return reduced;
    }

    // https://github.com/Pseudo-Corp/SynergismOfficial/blob/0ffbd184938677cf8137a404cffb2f4b5b5d3ab9/src/Calculate.ts
    R_calculateRequiredRedAmbrosiaTime = () => {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'R_RequiredRedAmbrosiaTime' as keyof CalculationCache;
        const timePerRedAmbrosia = HSGlobal.HSAmbrosia.R_TIME_PER_RED_AMBROSIA // Currently 100,000

        const calculationVars: number[] = [
            data.lifetimeRedAmbrosia,
            data.singularityChallenges.limitedTime.completions
        ]

        const cached = this.#checkCache(cacheName, calculationVars);

        if (cached) return cached;

        const redBarRequirementMultiplier = 1 - (0.01 * data.singularityChallenges.limitedTime.completions);

        let val = timePerRedAmbrosia;
        val += 200 * data.lifetimeRedAmbrosia

        const max = 1e6 * + redBarRequirementMultiplier;
        val *= + redBarRequirementMultiplier;

        const reduced = Math.min(max, val);

        this.#updateCache(cacheName, { value: reduced, cachedBy: calculationVars });

        return reduced;
    }

    getCorruptionTotalLevel() {
        if (!this.gameData) return 0;
        const data = this.gameData;

        const corruptions = data.corruptions.used;
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

        const cached = this.#checkCache(cacheName, calculationVars);

        if (cached) return cached;

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
            exponentBoost += data.shopUpgrades.improveQuarkHept / 100;
            exponentBoost += data.shopUpgrades.improveQuarkHept2 / 100;
            exponentBoost += data.shopUpgrades.improveQuarkHept3 / 100;
            exponentBoost += data.shopUpgrades.improveQuarkHept4 / 100;
            exponentBoost += data.shopUpgrades.improveQuarkHept5 / 5000;

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

            this.#updateCache(cacheName, { value: val, cachedBy: calculationVars });
            return val;
        }

        if (data.hepteracts[heptType].BAL > this.#hepteractEffectiveValues[heptType].LIMIT) {
            effectiveValue *= Math.pow(
                data.hepteracts[heptType].BAL / this.#hepteractEffectiveValues[heptType].LIMIT,
                this.#hepteractEffectiveValues[heptType].DR + exponentBoost
            );
        }

        this.#updateCache(cacheName, { value: effectiveValue, cachedBy: calculationVars });
        return effectiveValue;
    }

    R_calculateFreeShopInfinityUpgrades(reduce_vals = true) {
        return this.R_calculateAllShopTablets(reduce_vals);
    }

    R_calculateAllShopTablets(reduce_vals = true) {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'R_AllShopTablets' as keyof CalculationCache;

        const calculationVars: number[] = [
            data.highestSingularityCount,
            data.goldenQuarkUpgrades.singInfiniteShopUpgrades.level,
            data.octUpgrades.octeractInfiniteShopUpgrades.level,
            data.shopUpgrades.shopInfiniteShopUpgrades,
            ...(data.singularityChallenges.noAmbrosiaUpgrades.enabled
                ? []
                : [
                    this.R_calculateRedAmbrosiaUpgradeValue('freeLevelsRow4'),
                    this.R_calculateRedAmbrosiaUpgradeValue('freeLevelsRow5'),
                ]),
        ];

        const cached = this.#checkCache(cacheName, calculationVars);

        if (cached) return cached;

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
            this.R_calculateRedAmbrosiaUpgradeValue('infiniteShopUpgrades'),
            dunno(),
            +data.goldenQuarkUpgrades.singInfiniteShopUpgrades.level,
            +data.octUpgrades.octeractInfiniteShopUpgrades.level,
            Math.floor(0.005 * data.shopUpgrades.shopInfiniteShopUpgrades * this.R_calculateSumOfExaltCompletions()),
            ...(data.singularityChallenges.noAmbrosiaUpgrades.enabled
                ? []
                : [
                    +this.R_calculateRedAmbrosiaUpgradeValue('freeLevelsRow4'),
                    +this.R_calculateRedAmbrosiaUpgradeValue('freeLevelsRow5'),
                ]),
        ]

        const reduced = vals.reduce((a, b) => a + b, 0);

        this.#updateCache(cacheName, { value: reduced, cachedBy: calculationVars });

        return reduce_vals ? reduced : vals;
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

        const cached = this.#checkCache(cacheName, calculationVars);

        if (cached) return cached;

        let exponent = data.ascensionCount
            - Math.max(
                0,
                20 - data.singularityChallenges.limitedAscensions.completions
            )

        exponent = Math.max(0, exponent)
        const val = Math.pow(2, exponent);

        this.#updateCache(cacheName, { value: val, cachedBy: calculationVars });

        return val;
    }

    R_calculateSingularityReductions(reduce_vals = true) {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'R_SingularityReductions' as keyof CalculationCache;

        const calculationVars: number[] = [
            data.insideSingularityChallenge ? 1 : 0,
            this.R_calculateAmbrosiaUpgradeValue("ambrosiaSingReduction2"),
            this.R_calculateAmbrosiaUpgradeValue("ambrosiaSingReduction1"),
            data.shopUpgrades.shopSingularityPenaltyDebuff
        ];

        const cached = this.#checkCache(cacheName, calculationVars);

        if (cached) return cached;

        let redu;

        if (data.insideSingularityChallenge) {
            redu = this.R_calculateAmbrosiaUpgradeValue("ambrosiaSingReduction2")
        } else {
            redu = this.R_calculateAmbrosiaUpgradeValue("ambrosiaSingReduction1")
        }

        const vals = [
            data.shopUpgrades.shopSingularityPenaltyDebuff,
            redu
        ]

        const reduced = vals.reduce((a, b) => a + b, 0)

        this.#updateCache(cacheName, { value: reduced, cachedBy: calculationVars });

        return reduce_vals ? reduced : vals;
    }

    R_calculateEffectiveSingularities(singularityCount: number = -1): number {
        if (!this.gameData) return 0;
        const data = this.gameData;

        const cacheName = 'R_EffectiveSingularities' as keyof CalculationCache;

        const calculationVars: number[] = [
            singularityCount,
            data.insideSingularityChallenge ? 1 : 0,
            data.singularityChallenges.noOcteracts.completions
        ];

        const cached = this.#checkCache(cacheName, calculationVars);

        if (cached) return cached;

        let effectiveSingularities = singularityCount === -1 ? data.singularityCount : singularityCount;

        effectiveSingularities *= Math.min(4.75, (0.75 * singularityCount) / 10 + 1)

        if (data.insideSingularityChallenge) {
            if (data.singularityChallenges.noOcteracts.enabled) {
                effectiveSingularities *= Math.pow(data.singularityChallenges.noOcteracts.completions + 1, 3);
            }
        }

        if (singularityCount > 10) {
            effectiveSingularities *= 1.5;
            effectiveSingularities *= Math.min(4, (1.25 * singularityCount) / 10 - 0.25);
        }

        if (singularityCount > 25) {
            effectiveSingularities *= 2.5;
            effectiveSingularities *= Math.min(6, (1.5 * singularityCount) / 25 - 0.5);
        }

        if (singularityCount > 36) {
            effectiveSingularities *= 4;
            effectiveSingularities *= Math.min(5, singularityCount / 18 - 1);
            effectiveSingularities *= Math.pow(1.1, Math.min(singularityCount - 36, 64));
        }

        if (singularityCount > 50) {
            effectiveSingularities *= 5;
            effectiveSingularities *= Math.min(8, (2 * singularityCount) / 50 - 1);
            effectiveSingularities *= Math.pow(1.1, Math.min(singularityCount - 50, 50));
        }

        if (singularityCount > 100) {
            effectiveSingularities *= 2;
            effectiveSingularities *= singularityCount / 25;
            effectiveSingularities *= Math.pow(1.1, singularityCount - 100);
        }

        if (singularityCount > 150) {
            effectiveSingularities *= 2;
            effectiveSingularities *= Math.pow(1.05, singularityCount - 150);
        }

        if (singularityCount > 200) {
            effectiveSingularities *= 1.5;
            effectiveSingularities *= Math.pow(1.275, singularityCount - 200);
        }

        if (singularityCount > 215) {
            effectiveSingularities *= 1.25;
            effectiveSingularities *= Math.pow(1.2, singularityCount - 215);
        }

        if (singularityCount > 230) {
            effectiveSingularities *= 2;
        }

        if (singularityCount > 269) {
            effectiveSingularities *= 3;
            effectiveSingularities *= Math.pow(3, singularityCount - 269);
        }

        this.#updateCache(cacheName, { value: effectiveSingularities, cachedBy: calculationVars });

        return effectiveSingularities;
    }

    R_calculateSingularityDebuff(debuff: SingularityDebuffs, singularityCount: number = -1) {
        if (!this.gameData) return 1;
        const data = this.gameData;

        if (singularityCount === -1) {
            singularityCount = data.singularityCount;
        }

        if (singularityCount === 0) {
            return 1;
        }

        if (data.runes.antiquities > 0) {
            return 1;
        }

        const constitutiveSingularityCount = singularityCount - (this.R_calculateSingularityReductions() as number)

        if (constitutiveSingularityCount < 1) {
            return 1;
        }

        const effectiveSingularities = this.R_calculateEffectiveSingularities(
            constitutiveSingularityCount
        )

        let baseDebuffMultiplier = 1
        baseDebuffMultiplier *= 1 - Math.min(300, data.shopUpgrades.shopHorseShoe * this.calculateHorseShoeLevel()) / 1000

        let val;

        if (debuff === 'Offering') {
            val = constitutiveSingularityCount < 150
                ? Math.sqrt(effectiveSingularities) + 1
                : Math.pow(effectiveSingularities, 2 / 3) / 400
        } else if (debuff === 'Global Speed') {
            val = 1 + Math.sqrt(effectiveSingularities) / 4
        } else if (debuff === 'Obtainium') {
            val = constitutiveSingularityCount < 150
                ? Math.sqrt(effectiveSingularities) + 1
                : Math.pow(effectiveSingularities, 2 / 3) / 400
        } else if (debuff === 'Researches') {
            val = 1 + Math.sqrt(effectiveSingularities) / 2
        } else if (debuff === 'Ascension Speed') {
            val = baseDebuffMultiplier * (constitutiveSingularityCount < 150
                ? 1 + Math.sqrt(effectiveSingularities) / 5
                : 1 + Math.pow(effectiveSingularities, 0.75) / 10000)
        } else if (debuff === 'Cubes') {
            const extraMult = constitutiveSingularityCount > 100
                ? Math.pow(1.02, constitutiveSingularityCount - 100)
                : 1;

            val = constitutiveSingularityCount < 150
                ? 1 + (Math.sqrt(effectiveSingularities) * extraMult) / 4
                : 1 + (Math.pow(effectiveSingularities, 0.75) * extraMult) / 1000
        } else if (debuff === 'Platonic Costs') {
            val = constitutiveSingularityCount > 36
                ? 1 + Math.pow(effectiveSingularities, 3 / 10) / 12
                : 1
        } else if (debuff === 'Hepteract Costs') {
            val = constitutiveSingularityCount > 50
                ? 1 + Math.pow(effectiveSingularities, 11 / 50) / 25
                : 1
        } else {
            val = Math.cbrt(effectiveSingularities + 1)
        }

        return val;
    }

    R_calculateAscensionSpeedExponentSpread(reduce_vals = true) {
        if (!this.gameData) return 0;
        const data = this.gameData;
        const cacheName = 'R_AscensionSpeedExponentSpread' as keyof CalculationCache;

        const calculationVars: number[] = [
            data.goldenQuarkUpgrades.singAscensionSpeed.level,
            data.goldenQuarkUpgrades.singAscensionSpeed2.level,
            data.shopUpgrades.chronometerInfinity
        ];

        const cached = this.#checkCache(cacheName, calculationVars);

        if (cached) return cached;

        const vals = [
            data.goldenQuarkUpgrades.singAscensionSpeed.level > 0 ? 0.03 : 0,
            data.goldenQuarkUpgrades.singAscensionSpeed2.level * 0.001,
            0.001 * Math.floor((data.shopUpgrades.chronometerInfinity + (this.R_calculateFreeShopInfinityUpgrades() as number)) / 40)
        ]

        const reduced = vals.reduce((a, b) => a + b, 0);

        this.#updateCache(cacheName, { value: reduced, cachedBy: calculationVars });

        return reduce_vals ? reduced : vals;
    }

    R_calculateChallenge15Reward(rewardName: keyof typeof challenge15Rewards) {
        if (!this.gameData) {
            HSLogger.errorOnce(`<red>calculateChallenge15Reward() GAMEDATA WAS NULL</red>`, this.context);
            return 0;
        }

        const data = this.gameData;

        const exponent = data.challenge15Exponent
            ? data.challenge15Exponent
            : data.highestChallenge15Exponent
                ? data.highestChallenge15Exponent
                : 0;
        if (exponent === 0) {
            return 0;
        }
        return c15Functions[rewardName](exponent);
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

        const cached = this.#checkCache(cacheName, calculationVars);

        //if (cached) return cached;

        const vals: number[] = [
            // Mortuus Iterum Formicidae
            this.R_calculateMortuus2AscensionSpeed(),
            // Polymath bonus
            this.R_calculatePolymathAscSpeed(),
            // Chronometer
            1 + (1.2 / 100) * data.shopUpgrades.chronometer,
            // Chronometer2
            1 + (0.6 / 100) * data.shopUpgrades.chronometer2,
            // Chronometer3
            1 + (1.5 / 100) * data.shopUpgrades.chronometer3,
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
            1 + (1 / 1000) * data.singularityCount * data.shopUpgrades.chronometerZ,
            // AbstractPhotokinetics
            1 + (+data.octUpgrades.octeractImprovedAscensionSpeed.level / 2000) * data.singularityCount,
            // AbstractExokinetics
            1 + (+data.octUpgrades.octeractImprovedAscensionSpeed2.level / 2000) * data.singularityCount,
            // ChronometerINF
            Math.pow(1.006, data.shopUpgrades.chronometerInfinity + (this.R_calculateFreeShopInfinityUpgrades() as number)),
            // LimitedAscensionsBuff
            Math.pow(
                1 + ((0.1 * data.singularityChallenges.limitedAscensions.completions) / 100),
                1 + Math.max(0, Math.floor(Math.log10(data.ascensionCount))),
            ),
            // LimitedTimeChallenge
            1 + (0.06 * data.singularityChallenges.limitedTime.completions),
            // ChronometerS
            Math.max(Math.pow(1.01, (data.singularityCount - 200) * data.shopUpgrades.shopChronometerS), 1),
            // LimitedAscensionsDebuff
            1 / this.R_calculateLimitedAscensionsDebuff(),
            // SingularityDebuff
            1 / this.R_calculateSingularityDebuff('Ascension Speed'),
            // Event
            1 + this.R_calculateConsumableEventBuff(EventBuffType.AscensionSpeed),
        ]

        const reduced = vals.reduce((a, b) => a * b, 1)

        this.#updateCache(cacheName, { value: reduced, cachedBy: calculationVars });

        return reduce_vals ? reduced : vals;
    }

    R_calculateAscensionSpeedMult() {
        let base = (this.R_calculateRawAscensionSpeedMult() as number)

        const exponentSpread = (this.R_calculateAscensionSpeedExponentSpread() as number)

        if (base < 1) {
            base = Math.pow(base, 1 - exponentSpread)
        } else {
            base = Math.pow(base, 1 + exponentSpread)
        }

        return base;
    }

    R_calculatePolymathAscSpeed(): number {
        if (!this.gameData) return 1;
        const data = this.gameData;

        const regularCostProgressionString = (baseMult: string, level: number): Record<string, string> => {
            // Helper to multiply two strings
            const multiply = (a: string, b: number): string => {
                const { mantissa: m1, exponent: e1 } = parseSci(a);
                const result = m1 * b;
                return result.toExponential() + "e" + e1;
            };

            // Helper to parse scientific notation string
            const parseSci = (s: string) => {
                const m = s.match(/^([\d.]+)e\+?(-?\d+)$/i);
                if (m) return { mantissa: parseFloat(m[1]), exponent: parseInt(m[2], 10) };
                return { mantissa: parseFloat(s), exponent: 0 };
            };

            // --- Compute price multiplier ---
            let priceMult = baseMult;

            let multiplier = 1;
            if (level >= 120) multiplier *= (level - 90) / 30;
            if (level >= 150) multiplier *= (level - 120) / 30;
            if (level >= 180) multiplier *= (level - 170) / 10;
            priceMult = multiply(baseMult, multiplier);

            // --- Helper: compute cost as string ---
            const cost = (val: number) => (Math.floor(val) || 0).toExponential();

            const shardCost = multiply(cost(Math.pow(level, 3) / 8 + 1), parseFloat(priceMult));

            const commonCost = level >= 30
                ? multiply(cost(Math.pow(level - 30, 3) / 32 + 1), parseFloat(priceMult))
                : "0e0";

            const uncommonCost = level >= 60
                ? multiply(cost(Math.pow(level - 60, 3) / 384 + 1), parseFloat(priceMult))
                : "0e0";

            const rareCost = level >= 90
                ? multiply(cost(Math.pow(level - 90, 3) / 500 + 1), parseFloat(priceMult))
                : "0e0";

            const epicCost = level >= 120
                ? multiply(cost(Math.pow(level - 120, 3) / 375 + 1), parseFloat(priceMult))
                : "0e0";

            const legendaryCost = level >= 150
                ? multiply(cost(Math.pow(level - 150, 3) / 192 + 1), parseFloat(priceMult))
                : "0e0";

            const mythicalCost = level >= 150
                ? multiply(cost(Math.pow(level - 150, 3) / 1280 + 1), parseFloat(priceMult))
                : "0e0";

            return {
                shard: shardCost,
                commonFragment: commonCost,
                uncommonFragment: uncommonCost,
                rareFragment: rareCost,
                epicFragment: epicCost,
                legendaryFragment: legendaryCost,
                mythicalFragment: mythicalCost
            };
        };

        let octUpgradeExtraCap = 0

        if (!(data.singularityChallenges.noOcteracts.enabled || data.singularityChallenges.sadisticPrequel.enabled)) {
            octUpgradeExtraCap += data.octUpgrades.octeractTalismanLevelCap1.level
            octUpgradeExtraCap += data.octUpgrades.octeractTalismanLevelCap2.level
            octUpgradeExtraCap += data.octUpgrades.octeractTalismanLevelCap3.level
            octUpgradeExtraCap += data.octUpgrades.octeractTalismanLevelCap4.level
        }
        const maxLevel = 180;
        let polymathTrueMaxLevel = maxLevel;
        polymathTrueMaxLevel += 6 * (Math.min(10, data.challengecompletions[13]));
        polymathTrueMaxLevel += (3 * (Math.max(10, data.challengecompletions[13]) - 10))
        polymathTrueMaxLevel += Math.floor(data.researches[200] / 400);
        polymathTrueMaxLevel += data.singularityChallenges.taxmanLastStand.completions * 25
        polymathTrueMaxLevel += octUpgradeExtraCap;

        const inscriptValues = [
            1, 1.04, 1.08, 1.12, 1.16, 1.20, 1.25, 1.30, 1.325, 1.35, 1.40
        ];

        // --- Copy fragment budget ---
        const budget: Record<string, string> = {
            shard: data.talismans.polymath.shard.toString(),
            commonFragment: data.talismans.polymath.commonFragment.toString(),
            uncommonFragment: data.talismans.polymath.uncommonFragment.toString(),
            rareFragment: data.talismans.polymath.rareFragment.toString(),
            epicFragment: data.talismans.polymath.epicFragment.toString(),
            legendaryFragment: data.talismans.polymath.legendaryFragment.toString(),
            mythicalFragment: data.talismans.polymath.mythicalFragment.toString()
        };
        let level = 0;

        // --- Level-up simulation ---
        const nextCost = (lvl: number) => regularCostProgressionString(1e16.toString(), lvl);


        const log10FromSci = (s: string): number => {
            const m = s.match(/^([\d.]+)e\+?(-?\d+)$/i);
            if (!m) return Math.log10(parseFloat(s));
            return Math.log10(parseFloat(m[1])) + parseInt(m[2], 10);
        };

        // Calculate max affordable level (simplified)
        const budgetLogs: Record<string, number> = {};
        for (const item in budget) {
            budgetLogs[item] = log10FromSci(budget[item]);
        }


        let canBuy = true;
        while (canBuy && level < polymathTrueMaxLevel) {
            const cost = nextCost(level); // returns string costs
            let canBuy = true;

            for (const item in cost) {
                const costLog = log10FromSci(cost[item]);
                if (budgetLogs[item] < costLog) {
                    canBuy = false;
                    break;
                }
            }

            if (!canBuy) break;

            // Subtract in log space
            for (const item in cost) {
                const costLog = log10FromSci(cost[item]);
                budgetLogs[item] = Math.log10(Math.pow(10, budgetLogs[item]) - Math.pow(10, costLog));
            }

            level += 1;
        }

        // --- Compute rarity ---
        const levelRatio = level / maxLevel;
        let extraRarity = 0;
        if (levelRatio >= 1) {
            if (levelRatio >= 2) extraRarity += 1;
            if (levelRatio >= 4) extraRarity += 1;
            if (levelRatio >= 8) extraRarity += 1;
        }
        let rarity = 1 + Math.min(6, Math.floor(6 * levelRatio)) + extraRarity;
        rarity = Math.min(rarity, inscriptValues.length - 1);

        // --- Ascension speed ---
        return inscriptValues[rarity] ?? 1;
    }



    R_calculateMortuus2AscensionSpeed() {
        const totalLevels = this.R_calculateTrueAntLevel(AntUpgrades.Mortuus2);
        const ascensionSpeed = 2 - Math.pow(0.996, totalLevels);
        return ascensionSpeed;
    }

    R_calculateRuneEffectiveLevel(runeType: keyof Runes): number {
        return 0;
    }

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

    R_calculateCorruptionEffect(loadout: CorruptionLoadout, corruption: string): number {
        if (!this.gameData) return 0;

        const data = this.gameData;

        switch (corruption) {
            case 'deflation':
                return this.#deflationEffect(loadout);
            case 'dilation':
                return this.#dilationEffect(loadout);
            case 'drought':
                return this.#droughtEffect(loadout, data);
            case 'extinction':
                return this.#extinctionEffect(loadout);
            case 'hyperchallenge':
                return this.#hyperchallengeEffect(loadout, data);
            case 'illiteracy':
                return this.#illiteracyEffect(loadout, data);
            case 'recession':
                return this.#recessionEffect(loadout);
            case 'viscosity':
                return this.#viscosityEffect(loadout, data);
            default:
                return 1;
        }
    }

    #viscosityEffect(loadout: CorruptionLoadout, data: any): number {
        const base = this.#corruptionData.viscosityPower[loadout.levels.viscosity];
        const multiplier = 1 + data.platonicUpgrades[6] / 30;
        return Math.min(base * multiplier, 1);
    }

    #droughtEffect(loadout: CorruptionLoadout, data: any): number {
        let baseSalvageReduction = this.#corruptionData.droughtSalvage[loadout.levels.drought];
        if (data.platonicUpgrades[13] > 0) {
            baseSalvageReduction *= 0.5;
        }
        return baseSalvageReduction;
    }

    #deflationEffect(loadout: CorruptionLoadout): number {
        return this.#corruptionData.deflationMultiplier[loadout.levels.deflation];
    }

    #extinctionEffect(loadout: CorruptionLoadout): number {
        return this.#corruptionData.extinctionDivisor[loadout.levels.extinction];
    }

    #illiteracyEffect(loadout: CorruptionLoadout, data: any): number {
        const base = this.#corruptionData.illiteracyPower[loadout.levels.illiteracy];
        const multiplier = (data.obtainium && data.obtainium > 0)
            ? 1 + (1 / 100) * data.platonicUpgrades[9] * Math.min(100, Math.log10(data.obtainium))
            : 1;
        return Math.min(base * multiplier, 1);
    }

    #recessionEffect(loadout: CorruptionLoadout): number {
        return this.#corruptionData.recessionPower[loadout.levels.recession];
    }

    #dilationEffect(loadout: CorruptionLoadout): number {
        return this.#corruptionData.dilationMultiplier[loadout.levels.dilation];
    }

    #hyperchallengeEffect(loadout: CorruptionLoadout, data: any): number {
        const baseEffect = this.#corruptionData.hyperchallengeMultiplier[loadout.levels.hyperchallenge];
        let divisor = 1;
        divisor *= 1 + 2 / 5 * data.platonicUpgrades[8];
        return Math.max(1, baseEffect / divisor);
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

    R_computeFreeAntUpgradeLevels = () => {
        if (!this.gameData) return 0;

        const data = this.gameData;

        let bonusLevels = 0
        bonusLevels += this.R_CalcECC('reincarnation', data.challengecompletions[9])
        bonusLevels += Math.round(2000 * (1 - Math.pow(0.999, data.constantUpgrades[6] ?? 0)))
        bonusLevels += 12 * this.R_CalcECC('ascension', data.challengecompletions[11])
        bonusLevels += 2 * data.researches[97]
        bonusLevels += 2 * data.researches[98]
        bonusLevels += data.researches[102]
        bonusLevels += 2 * data.researches[132]
        bonusLevels += Math.floor((1 / 200) * data.researches[200])
        bonusLevels += +this.R_getAchievementReward('freeAntUpgrades')
        bonusLevels *= this.R_calculateChallenge15Reward('bonusAntLevel')

        if (data.currentChallenge.ascension === 11) {
            bonusLevels += Math.floor(
                3 * data.challengecompletions[8]
                + 5 * data.challengecompletions[9]
            )
            return bonusLevels
        }

        return bonusLevels
    }

    R_getAchievementReward = (rewardType: AchievementRewards): number | boolean => {
        return this.R_AchRewards[rewardType]()
    }

    R_calculateTrueAntLevel(antUpgrade: AntUpgrades): number {
        if (!this.gameData) return 0;

        const data = this.gameData;

        const freeLevels = this.R_computeFreeAntUpgradeLevels()
        const corruptionDivisor = (this.R_antUpgradeData[antUpgrade].exemptFromCorruption)
            ? 1
            : this.R_calculateCorruptionEffect(data.corruptions.used, "extinction");
        if (data.currentChallenge.ascension === 11) {
            return Math.min(data.ants.upgrades[antUpgrade], freeLevels) / corruptionDivisor
        } else {
            return (data.ants.upgrades[antUpgrade]
                + Math.min(data.ants.upgrades[antUpgrade], freeLevels)) / corruptionDivisor
        }
    }

    calculateHorseShoeLevel(): number {
        if (!this.gameData) return 0;

        const data = this.gameData;

        const exp = data.runes.horseShoe.toString()
        let levelsPerOOM = 1 / 20;
        levelsPerOOM += 0.005 * data.singularityChallenges.taxmanLastStand.completions;

        const bonusLevels = data.shopUpgrades.shopHorseShoe > 0 ? 3 : 0;
        const effectiveMult = 1;

        const cost = '1e500'

        // log10(exp / cost + 1) using strings
        const log10ExpOverCostPlus1 = ((expStr: string, costStr: string): number => {
            const parse = (s: string) => {
                const m = s.match(/^([\d.]+)e\+?(-?\d+)$/i);
                return m
                    ? { m: parseFloat(m[1]), e: parseInt(m[2], 10) }
                    : { m: parseFloat(s), e: 0 };
            };

            const A = parse(expStr);
            const B = parse(costStr);

            // exp / cost exponent
            const expDiff = A.e - B.e;
            const mantissaRatio = A.m / B.m;

            // exp < cost → exp / cost < 1 → log10(1 + x)
            if (expDiff < 0 || (expDiff === 0 && mantissaRatio < 1)) {
                const x = mantissaRatio * Math.pow(10, expDiff);
                return Math.log10(1 + x);
            }

            // exp >> cost → +1 negligible
            return Math.log10(mantissaRatio) + expDiff;
        })(exp, cost);

        const level = Math.floor(
            levelsPerOOM * log10ExpOverCostPlus1 * effectiveMult
        ) + bonusLevels;

        return Math.max(0, level);
    }



    R_calculateCashGrabBonus(extra: number) {
        if (!this.gameData) return 0;
        const data = this.gameData;

        return 1 + data.shopUpgrades.shopCashGrabUltra * extra * Math.min(1, Math.pow(data.lifetimeAmbrosia / 1e7, 1 / 3));
    }

    R_calculateEXUltraBonus(extra: number) {
        if (!this.gameData) return 0;
        const data = this.gameData;

        return 1 + extra * Math.min(data.shopUpgrades.shopEXUltra, Math.floor(data.lifetimeAmbrosia / 1000) / 125);
    }

    calculateAmbrosiaSpeed(reduce_vals = true) {
        if (!this.gameData) return 0;
        const gameData = this.gameData;

        if (!this.pseudoData) return 0;
        const pseudoData = this.pseudoData;

        if (!this.meData) return 0;
        const meBonuses = this.meData;

        // Maybe caching for these later?
        /*const cacheName = 'R_RequiredRedAmbrosiaTime' as keyof CalculationCache;
     
        const P_GEN_BUFF_LVL = pseudoData?.playerUpgrades.find(u => u.internalName === "AMBROSIA_GENERATION_BUFF")?.level ?? 0;
     
        const calculationVars : number[] = [
            P_GEN_BUFF_LVL,
            this.R_calculateCampaignAmbrosiaSpeedBonus(),
        ]
     
        const cached = this.#checkCache(cacheName, calculationVars);
     
        if(cached) return cached;*/

        const P_GEN_BUFF_LVL = pseudoData?.playerUpgrades.find(u => u.internalName === "AMBROSIA_GENERATION_BUFF")?.level;
        const P_GEN_BUFF = P_GEN_BUFF_LVL ? 1 + P_GEN_BUFF_LVL * 0.05 : 1;

        const campaignBlueberrySpeedBonus = this.R_calculateCampaignAmbrosiaSpeedBonus()

        const QUARK_BONUS = 100 * (1 + meBonuses.globalBonus / 100) * (1 + meBonuses.personalBonus / 100) - 100;

        const RED_AMB_GEN_1 = this.R_calculateRedAmbrosiaUpgradeValue('blueberryGenerationSpeed');
        const RED_AMB_GEN_2 = this.R_calculateRedAmbrosiaUpgradeValue('blueberryGenerationSpeed2');

        const cube76 = gameData.cubeUpgrades[76] ?? 1;

        const vals = [
            +(gameData.visitedAmbrosiaSubtab),
            P_GEN_BUFF,
            campaignBlueberrySpeedBonus,
            (this.R_calculateAmbrosiaGenerationShopUpgrade() as number),
            (this.R_calculateAmbrosiaGenerationSingularityUpgrade() as number),
            (this.R_calculateAmbrosiaGenerationOcteractUpgrade() as number),
            1 + (this.R_calculateAmbrosiaUpgradeValue('ambrosiaPatreon') * QUARK_BONUS) / 100,
            (1 + gameData.singularityChallenges.oneChallengeCap.completions / 100),
            (1 + gameData.singularityChallenges.noAmbrosiaUpgrades.completions / 50),
            RED_AMB_GEN_1,
            RED_AMB_GEN_2,
            1 + 0.01 * cube76 * this.R_calculateNumberOfThresholds(),
            this.R_calculateCashGrabBonus(CASH_GRAB_ULTRA_BLUEBERRY),
            this.isEvent ? 1 + this.R_calculateConsumableEventBuff(EventBuffType.BlueberryTime) : 1,
        ];

        const reduced = vals.reduce((a, b) => a * b, 1);

        return reduce_vals ? reduced : vals;
    }

    calculateBlueBerries(reduce_vals = true) {
        const gameData = this.getGameData();

        if (!gameData) return 0;

        let noAmbrosiaFactor = 0;

        if (gameData.singularityChallenges.noAmbrosiaUpgrades.completions >= 20)
            noAmbrosiaFactor = 3;
        else if (gameData.singularityChallenges.noAmbrosiaUpgrades.completions >= 10)
            noAmbrosiaFactor = 2;
        else if (gameData.singularityChallenges.noAmbrosiaUpgrades.completions > 0)
            noAmbrosiaFactor = 1;

        const vals = [
            +(gameData.singularityChallenges.noSingularityUpgrades.completions > 0),
            +(gameData.goldenQuarkUpgrades.blueberries.level),
            +(gameData.octUpgrades.octeractBlueberries.level),
            +(this.R_calculateRedAmbrosiaUpgradeValue('blueberries')),
            this.R_calculateSingularityMilestoneBlueberries(),
            noAmbrosiaFactor
        ]

        const reduced = vals.reduce((a, b) => a + b, 0);

        return reduce_vals ? reduced : vals;
    }

    calculateLuck(reduce_vals = true, true_base = false): { additive: number, raw: number, total: number } |
    { additive: number[], raw: number[] } {
        const gameData = this.getGameData();
        const pseudoData = this.getPseudoData();

        if (!gameData) return { additive: 0, raw: 0, total: 0 };
        if (!pseudoData) return { additive: 0, raw: 0, total: 0 };

        const cube77 = gameData.cubeUpgrades[77] ?? 0

        const additiveComponents = [
            1,
            gameData.singularityChallenges.noSingularityUpgrades.completions >= 30 ? 0.05 : 0,
            this.R_calculateDilatedFiveLeafBonus(),
            gameData.shopUpgrades.shopAmbrosiaLuckMultiplier4 / 100,
            gameData.singularityChallenges.noAmbrosiaUpgrades.completions / 200,
            0.001 * cube77,
            this.isEvent ? this.R_calculateConsumableEventBuff(EventBuffType.AmbrosiaLuck) : 0
        ]

        const P_BUFF_LVL = pseudoData.playerUpgrades.find(u => u.internalName === "AMBROSIA_LUCK_BUFF")?.level;
        const P_BUFF = P_BUFF_LVL ? P_BUFF_LVL * 20 : 0;
        const campaignBonus = this.R_calculateCampaignLuckBonus()

        const RED_AMB_FREE_ROW_2 = this.R_calculateRedAmbrosiaUpgradeValue('freeLevelsRow2');
        const RED_AMB_FREE_ROW_3 = this.R_calculateRedAmbrosiaUpgradeValue('freeLevelsRow3');
        const RED_AMB_FREE_ROW_4 = this.R_calculateRedAmbrosiaUpgradeValue('freeLevelsRow4');
        const RED_AMB_FREE_ROW_5 = this.R_calculateRedAmbrosiaUpgradeValue('freeLevelsRow5');

        const RED_AMB_FREE_ROWS: { [key: number]: number } = {
            2: RED_AMB_FREE_ROW_2,
            3: RED_AMB_FREE_ROW_3,
            4: RED_AMB_FREE_ROW_4,
            5: RED_AMB_FREE_ROW_5,
        }

        const effLevel = (level: number, rowNum: number) => {
            if (true_base)
                return RED_AMB_FREE_ROWS[rowNum];
            else
                return level + RED_AMB_FREE_ROWS[rowNum];
        }

        const blueLuck1 = this.R_calculateAmbrosiaUpgradeValue('ambrosiaLuck1');
        const blueLuck2 = this.R_calculateAmbrosiaUpgradeValue('ambrosiaLuck2');
        const blueLuck3 = this.R_calculateAmbrosiaUpgradeValue('ambrosiaLuck3');

        // https://github.com/Pseudo-Corp/SynergismOfficial/blob/master/src/BlueberryUpgrades.ts#L564
        const totalCubes = this.R_calculateTotalCubes();

        const blueCubeLuck = this.R_calculateAmbrosiaUpgradeValue('ambrosiaCubeLuck1');
        const blueQuarkLuck = this.R_calculateAmbrosiaUpgradeValue('ambrosiaQuarkLuck1');

        const RED_AMB_LUCK1 = this.R_calculateRedAmbrosiaUpgradeValue('regularLuck');
        const RED_AMB_LUCK2 = this.R_calculateRedAmbrosiaUpgradeValue('regularLuck2');
        const RED_AMB_VISCOUNT = this.R_calculateRedAmbrosiaUpgradeValue('viscount');

        const rawLuckComponents1 = [
            100,
            P_BUFF,
            campaignBonus,
            this.R_calculateSingularityAmbrosiaLuckMilestoneBonus(),
            (this.R_calculateAmbrosiaLuckShopUpgrade() as number),
            (this.R_calculateAmbrosiaLuckSingularityUpgrade() as number),
            (this.R_calculateAmbrosiaLuckOcteractUpgrade() as number),
            // 1
            2 * effLevel(blueLuck1, 2) + 12 * Math.floor(effLevel(blueLuck1, 2) / 10),
            // 2
            (3 + 0.3 * Math.floor(effLevel(blueLuck1, 2) / 10))
            * effLevel(blueLuck2, 4) + 40 * Math.floor(effLevel(blueLuck2, 4) / 10),
            // 3
            (this.calculateBlueBerries() as number) * effLevel(blueLuck3, 5),
            // cubeluck
            this.R_calculateTotalCubes() * 0.02 * effLevel(blueCubeLuck, 3),
            // quarkluck
            0.02 * effLevel(blueQuarkLuck, 3) *
            Math.floor(Math.pow(Math.log10(Number(gameData.worlds) + 1) + 1, 2)),
            // sing 131
            gameData.highestSingularityCount >= 131 ? 131 : 0,
            // sing 269
            gameData.highestSingularityCount >= 269 ? 269 : 0,
            // shop
            gameData.shopUpgrades.shopOcteractAmbrosiaLuck * (1 + Math.floor(Math.log10(gameData.totalWowOcteracts + 1))),
            // sing challenge
            gameData.singularityChallenges.noAmbrosiaUpgrades.completions * 15,
            RED_AMB_LUCK1,
            RED_AMB_LUCK2,
            RED_AMB_VISCOUNT,
            2 * cube77,
            this.R_calculateCookieUpgrade29Luck(),
            gameData.shopUpgrades.shopAmbrosiaUltra * this.R_calculateSumOfExaltCompletions(),
            Math.max(0, (this.R_calculateSynergismLevel() ?? 0 - 229) * 4),
            this.calculateHorseShoeLevel(),
        ]

        const rawLuckComponents2 = [
            0
        ]

        let rawLuckComponents = [];

        if (true_base) {
            rawLuckComponents = rawLuckComponents1;
        } else {
            rawLuckComponents = [...rawLuckComponents1, ...rawLuckComponents2];
        }

        if (reduce_vals) {
            const additivesTotal = additiveComponents.reduce((a, b) => a + b, 0);
            const rawTotal = rawLuckComponents.reduce((a, b) => a + b, 0);

            return {
                additive: additivesTotal,
                raw: rawTotal,
                total: additivesTotal * rawTotal
            }
        } else {
            return {
                additive: additiveComponents,
                raw: rawLuckComponents
            }
        }
    }

    R_calculateLuckConversion(reduce_vals = true) {
        if (!this.gameData) return 0;

        const data = this.gameData;

        const cacheName = 'R_LuckConversion' as keyof CalculationCache;

        const c1 = this.R_calculateRedAmbrosiaUpgradeValue('conversionImprovement1')
        const c2 = this.R_calculateRedAmbrosiaUpgradeValue('conversionImprovement2')
        const c3 = this.R_calculateRedAmbrosiaUpgradeValue('conversionImprovement3')
        const horseShoeLevel = this.calculateHorseShoeLevel();

        const calculationVars: number[] = [
            data.shopUpgrades.shopRedLuck1,
            data.shopUpgrades.shopRedLuck2,
            data.shopUpgrades.shopRedLuck3,
            c1,
            c2,
            c3,
            horseShoeLevel,
        ];

        const cached = this.#checkCache(cacheName, calculationVars);

        if (cached) return cached;

        const vals = [
            20,
            c1,
            c2,
            c3,
            -0.01 * Math.floor(data.shopUpgrades.shopRedLuck1 / 20),
            -0.01 * Math.floor(data.shopUpgrades.shopRedLuck2 / 20),
            -0.01 * Math.floor(data.shopUpgrades.shopRedLuck3 / 20),
            -0.5 * horseShoeLevel / (horseShoeLevel + 50),
        ]

        const reduced = vals.reduce((a, b) => a + b, 0)

        this.#updateCache(cacheName, { value: reduced, cachedBy: calculationVars });

        return reduce_vals ? reduced : vals;
    }

    R_calculateRedAmbrosiaLuck(reduce_vals = true) {
        if (!this.gameData) return 0;
        if (!this.pseudoData) return 0;

        const data = this.gameData;
        const pseudoData = this.pseudoData;

        const cacheName = 'R_RedAmbrosiaLuck' as keyof CalculationCache;

        const pseudoLuck = pseudoData.playerUpgrades.find(u => u.internalName === "RED_LUCK_BUFF")?.level ?? 0;
        const luck = this.calculateLuck() as { additive: number, raw: number, total: number };
        const red1 = this.R_calculateRedAmbrosiaUpgradeValue('redLuck');
        const red2 = this.R_calculateRedAmbrosiaUpgradeValue('viscount');
        const horseShoeLevel = this.calculateHorseShoeLevel();

        const calculationVars: number[] = [
            pseudoLuck,
            luck.total,
            red1,
            red2,
            data.singularityChallenges.noAmbrosiaUpgrades.completions,
            data.shopUpgrades.shopRedLuck1,
            data.shopUpgrades.shopRedLuck2,
            data.shopUpgrades.shopRedLuck3,
            horseShoeLevel,
        ];

        const cached = this.#checkCache(cacheName, calculationVars);

        if (cached) return cached;

        const vals = [
            100,
            pseudoLuck,
            Math.floor((luck.total - 100) / (this.R_calculateLuckConversion() as number)),
            red1,
            data.singularityChallenges.noAmbrosiaUpgrades.completions * 4,
            data.shopUpgrades.shopRedLuck1 * 0.05,
            data.shopUpgrades.shopRedLuck2 * 0.075,
            data.shopUpgrades.shopRedLuck3 * 0.1,
            red2,
            horseShoeLevel * 0.2,
            Math.max(0, this.R_calculateSynergismLevel() ?? 0 - 259),
        ]

        const reduced = vals.reduce((a, b) => a + b, 0)

        this.#updateCache(cacheName, { value: reduced, cachedBy: calculationVars });

        return reduce_vals ? reduced : vals;
    }

    calculateGoldenRevolution() {
        if (!this.gameData) return 0;

        const data = this.gameData;

        const goldenQuarksPerSecond = data.highestSingularityCount >= 100
            ? 1 - (0.5 * data.highestSingularityCount) / 250
            : 1;
    }

    R_calculateAchievementsByReward: Record<AchievementRewards, number[]> = this.R_achievements
        .reduce((rewards, achievement, index) => {
            if (achievement.reward) {
                for (const rewardType of Object.keys(achievement.reward) as AchievementRewards[]) {
                    if (!rewards[rewardType]) {
                        rewards[rewardType] = []
                    }
                    rewards[rewardType].push(Number(index))
                }
            }
            return rewards
        }, {} as Record<AchievementRewards, number[]>)


    R_AchRewards: Record<AchievementRewards, () => number | boolean> = {

        acceleratorPower: (): number => {
            return this.R_calculateAchievementsByReward.acceleratorPower.reduce(
                (sum, index) => sum + (this.gameData?.achievements[index] ? this.R_achievements[index].reward!.acceleratorPower!() : 0),
                0
            )
        },
        accelerators: (): number => {
            return this.R_calculateAchievementsByReward.accelerators.reduce(
                (sum, index) => sum + (this.gameData?.achievements[index] ? this.R_achievements[index].reward!.accelerators!() : 0),
                0
            )
        },
        multipliers: (): number => {
            return this.R_calculateAchievementsByReward.multipliers.reduce(
                (sum, index) => sum + (this.gameData?.achievements[index] ? this.R_achievements[index].reward!.multipliers!() : 0),
                0
            )
        },
        accelBoosts: (): number => {
            return this.R_calculateAchievementsByReward.accelBoosts.reduce(
                (sum, index) => sum + (this.gameData?.achievements[index] ? this.R_achievements[index].reward!.accelBoosts!() : 0),
                0
            )
        },
        crystalMultiplier: (): number => {
            return this.R_calculateAchievementsByReward.crystalMultiplier.reduce(
                (prod, index) => prod * (this.gameData?.achievements[index] ? this.R_achievements[index].reward!.crystalMultiplier!() : 1),
                1
            )
        },
        quarkGain: (): number => {
            return this.R_calculateAchievementsByReward.quarkGain.reduce(
                (prod, index) => prod * (this.gameData?.achievements[index] ? this.R_achievements[index].reward!.quarkGain!() : 1),
                1
            )
        },
        taxReduction: (): number => {
            return this.R_calculateAchievementsByReward.taxReduction.reduce(
                (prod, index) => prod * (this.gameData?.achievements[index] ? this.R_achievements[index].reward!.taxReduction!() : 1),
                1
            )
        },
        particleGain: (): number => {
            return this.R_calculateAchievementsByReward.particleGain.reduce(
                (prod, index) => prod * (this.gameData?.achievements[index] ? this.R_achievements[index].reward!.particleGain!() : 1),
                1
            )
        },
        chronosTalisman: (): boolean => {
            return Boolean(this.gameData?.achievements[this.R_calculateAchievementsByReward.chronosTalisman[0]])
        },
        midasTalisman: (): boolean => {
            return Boolean(this.gameData?.achievements[this.R_calculateAchievementsByReward.midasTalisman[0]])
        },
        metaphysicsTalisman: (): boolean => {
            return Boolean(this.gameData?.achievements[this.R_calculateAchievementsByReward.metaphysicsTalisman[0]])
        },
        polymathTalisman: (): boolean => {
            return Boolean(this.gameData?.achievements[this.R_calculateAchievementsByReward.polymathTalisman[0]])
        },
        wowSquareTalisman: (): boolean => {
            return Boolean(this.gameData?.achievements[this.R_calculateAchievementsByReward.wowSquareTalisman[0]])
        },
        conversionExponent: (): number => {
            return this.R_calculateAchievementsByReward.conversionExponent.reduce(
                (sum, index) => sum + (this.gameData?.achievements[index] ? this.R_achievements[index].reward!.conversionExponent!() : 0),
                0
            )
        },
        talismanPower: (): number => {
            return this.R_calculateAchievementsByReward.talismanPower.reduce(
                (sum, index) => sum + (this.gameData?.achievements[index] ? this.R_achievements[index].reward!.talismanPower!() : 0),
                0
            )
        },
        sacrificeMult: (): number => {
            return this.R_calculateAchievementsByReward.sacrificeMult.reduce(
                (prod, index) => prod * (this.gameData?.achievements[index] ? this.R_achievements[index].reward!.sacrificeMult!() : 1),
                1
            )
        },
        antSpeed: (): number => {
            return this.R_calculateAchievementsByReward.antSpeed.reduce(
                (prod, index) => prod * (this.gameData?.achievements[index] ? this.R_achievements[index].reward!.antSpeed!() : 1),
                1
            )
        },
        antSacrificeUnlock: (): boolean => {
            return Boolean(this.gameData?.achievements[this.R_calculateAchievementsByReward.antSacrificeUnlock[0]])
        },
        antAutobuyers: (): number => {
            return this.R_calculateAchievementsByReward.antAutobuyers.reduce(
                (sum, index) => sum + (this.gameData?.achievements[index] ? this.R_achievements[index].reward!.antAutobuyers!() : 0),
                0
            )
        },
        preserveAnthillCount: (): boolean => {
            return Boolean(this.gameData?.achievements[this.R_calculateAchievementsByReward.preserveAnthillCount[0]])
        },
        preserveAnthillCountSingularity: (): boolean => {
            return Boolean(this.gameData?.achievements[this.R_calculateAchievementsByReward.preserveAnthillCountSingularity[0]])
        },
        inceptusAutobuy: (): boolean => {
            return Boolean(this.gameData?.achievements[this.R_calculateAchievementsByReward.inceptusAutobuy[0]])
        },
        fortunaeAutobuy: (): boolean => {
            return Boolean(this.gameData?.achievements[this.R_calculateAchievementsByReward.fortunaeAutobuy[0]])
        },
        tributumAutobuy: (): boolean => {
            return Boolean(this.gameData?.achievements[this.R_calculateAchievementsByReward.tributumAutobuy[0]])
        },
        celeritasAutobuy: (): boolean => {
            return Boolean(this.gameData?.achievements[this.R_calculateAchievementsByReward.celeritasAutobuy[0]])
        },
        exploratoremAutobuy: (): boolean => {
            return Boolean(this.gameData?.achievements[this.R_calculateAchievementsByReward.exploratoremAutobuy[0]])
        },
        sacrificiumAutobuy: (): boolean => {
            return Boolean(this.gameData?.achievements[this.R_calculateAchievementsByReward.sacrificiumAutobuy[0]])
        },
        experientiaAutobuy: (): boolean => {
            return Boolean(this.gameData?.achievements[this.R_calculateAchievementsByReward.experientiaAutobuy[0]])
        },
        hicAutobuy: (): boolean => {
            return Boolean(this.gameData?.achievements[this.R_calculateAchievementsByReward.hicAutobuy[0]])
        },
        scientiaAutobuy: (): boolean => {
            return Boolean(this.gameData?.achievements[this.R_calculateAchievementsByReward.scientiaAutobuy[0]])
        },
        praemoenioAutobuy: (): boolean => {
            return Boolean(this.gameData?.achievements[this.R_calculateAchievementsByReward.praemoenioAutobuy[0]])
        },
        phylacteriumAutobuy: (): boolean => {
            return Boolean(this.gameData?.achievements[this.R_calculateAchievementsByReward.phylacteriumAutobuy[0]])
        },
        antELOAdditive: (): number => {
            return this.R_calculateAchievementsByReward.antELOAdditive.reduce(
                (sum, index) => sum + (this.gameData?.achievements[index] ? this.R_achievements[index].reward!.antELOAdditive!() : 0),
                0
            )
        },
        antELOAdditiveMultiplier: (): number => {
            return this.R_calculateAchievementsByReward.antELOAdditiveMultiplier.reduce(
                (prod, index) =>
                    prod + (this.gameData?.achievements[index] ? this.R_achievements[index].reward!.antELOAdditiveMultiplier!() : 0),
                0
            )
        },
        ascensionCountMultiplier: (): number => {
            return this.R_calculateAchievementsByReward.ascensionCountMultiplier.reduce(
                (prod, index) =>
                    prod * (this.gameData?.achievements[index] ? this.R_achievements[index].reward!.ascensionCountMultiplier!() : 1),
                1
            )
        },
        ascensionCountAdditive: (): number => {
            return this.R_calculateAchievementsByReward.ascensionCountAdditive.reduce(
                (sum, index) => sum + (this.gameData?.achievements[index] ? this.R_achievements[index].reward!.ascensionCountAdditive!() : 0),
                0
            )
        },
        wowCubeGain: (): number => {
            return this.R_calculateAchievementsByReward.wowCubeGain.reduce(
                (prod, index) => prod * (this.gameData?.achievements[index] ? this.R_achievements[index].reward!.wowCubeGain!() : 1),
                1
            )
        },
        wowTesseractGain: (): number => {
            return this.R_calculateAchievementsByReward.wowTesseractGain.reduce(
                (prod, index) => prod * (this.gameData?.achievements[index] ? this.R_achievements[index].reward!.wowTesseractGain!() : 1),
                1
            )
        },
        wowHypercubeGain: (): number => {
            return this.R_calculateAchievementsByReward.wowHypercubeGain.reduce(
                (prod, index) => prod * (this.gameData?.achievements[index] ? this.R_achievements[index].reward!.wowHypercubeGain!() : 1),
                1
            )
        },
        wowPlatonicGain: (): number => {
            return this.R_calculateAchievementsByReward.wowPlatonicGain.reduce(
                (prod, index) => prod * (this.gameData?.achievements[index] ? this.R_achievements[index].reward!.wowPlatonicGain!() : 1),
                1
            )
        },
        wowHepteractGain: (): number => {
            return this.R_calculateAchievementsByReward.wowHepteractGain.reduce(
                (prod, index) => prod * (this.gameData?.achievements[index] ? this.R_achievements[index].reward!.wowHepteractGain!() : 1),
                1
            )
        },
        ascensionScore: (): number => {
            return this.R_calculateAchievementsByReward.ascensionScore.reduce(
                (prod, index) => prod * (this.gameData?.achievements[index] ? this.R_achievements[index].reward!.ascensionScore!() : 1),
                1
            )
        },
        ascensionRewardScaling: (): boolean => {
            return Boolean(this.gameData?.achievements[this.R_calculateAchievementsByReward.ascensionRewardScaling[0]])
        },
        constUpgrade1Buff: (): number => {
            return this.R_calculateAchievementsByReward.constUpgrade1Buff.reduce(
                (sum, index) => sum + (this.gameData?.achievements[index] ? this.R_achievements[index].reward!.constUpgrade1Buff!() : 0),
                0
            )
        },
        constUpgrade2Buff: (): number => {
            return this.R_calculateAchievementsByReward.constUpgrade2Buff.reduce(
                (sum, index) => sum + (this.gameData?.achievements[index] ? this.R_achievements[index].reward!.constUpgrade2Buff!() : 0),
                0
            )
        },
        platonicToHypercubes: (): number => {
            return this.R_calculateAchievementsByReward.platonicToHypercubes.reduce(
                (sum, index) => sum + (this.gameData?.achievements[index] ? this.R_achievements[index].reward!.platonicToHypercubes!() : 0),
                0
            )
        },
        statTracker: (): boolean => {
            return Boolean(this.gameData?.achievements[this.R_calculateAchievementsByReward.statTracker[0]])
        },
        overfluxConversionRate: (): number => {
            return this.R_calculateAchievementsByReward.overfluxConversionRate.reduce(
                (prod, index) => prod * (this.gameData?.achievements[index] ? this.R_achievements[index].reward!.overfluxConversionRate!() : 1),
                1
            )
        },
        diamondUpgrade18: (): boolean => {
            return Boolean(this.gameData?.achievements[this.R_calculateAchievementsByReward.diamondUpgrade18[0]])
        },
        diamondUpgrade19: (): boolean => {
            return Boolean(this.gameData?.achievements[this.R_calculateAchievementsByReward.diamondUpgrade19[0]])
        },
        diamondUpgrade20: (): boolean => {
            return Boolean(this.gameData?.achievements[this.R_calculateAchievementsByReward.diamondUpgrade20[0]])
        },
        prestigeCountMultiplier: (): number => {
            return this.R_calculateAchievementsByReward.prestigeCountMultiplier.reduce(
                (prod, index) => prod * (this.gameData?.achievements[index] ? this.R_achievements[index].reward!.prestigeCountMultiplier!() : 1),
                1
            )
        },
        transcensionCountMultiplier: (): number => {
            return this.R_calculateAchievementsByReward.transcensionCountMultiplier.reduce(
                (prod, index) =>
                    prod * (this.gameData?.achievements[index] ? this.R_achievements[index].reward!.transcensionCountMultiplier!() : 1),
                1
            )
        },
        reincarnationCountMultiplier: (): number => {
            return this.R_calculateAchievementsByReward.reincarnationCountMultiplier.reduce(
                (prod, index) =>
                    prod * (this.gameData?.achievements[index] ? this.R_achievements[index].reward!.reincarnationCountMultiplier!() : 1),
                1
            )
        },
        duplicationRuneUnlock: (): boolean => {
            return Boolean(this.gameData?.achievements[this.R_calculateAchievementsByReward.duplicationRuneUnlock[0]])
        },
        offeringBonus: (): number => {
            return this.R_calculateAchievementsByReward.offeringBonus.reduce(
                (prod, index) => prod * (this.gameData?.achievements[index] ? this.R_achievements[index].reward!.offeringBonus!() : 1),
                1
            )
        },
        obtainiumBonus: (): number => {
            return this.R_calculateAchievementsByReward.obtainiumBonus.reduce(
                (prod, index) => prod * (this.gameData?.achievements[index] ? this.R_achievements[index].reward!.obtainiumBonus!() : 1),
                1
            )
        },
        salvage: (): number => {
            return this.R_calculateAchievementsByReward.salvage.reduce(
                (sum, index) => sum + (this.gameData?.achievements[index] ? this.R_achievements[index].reward!.salvage!() : 0),
                0
            )
        },
        prismRuneUnlock: (): boolean => {
            return Boolean(this.gameData?.achievements[this.R_calculateAchievementsByReward.prismRuneUnlock[0]])
        },
        thriftRuneUnlock: (): boolean => {
            return Boolean(this.gameData?.achievements[this.R_calculateAchievementsByReward.thriftRuneUnlock[0]])
        },
        transcendToPrestige: (): boolean => {
            return Boolean(this.gameData?.achievements[this.R_calculateAchievementsByReward.transcendToPrestige[0]])
        },
        reincarnationToTranscend: (): boolean => {
            return Boolean(this.gameData?.achievements[this.R_calculateAchievementsByReward.reincarnationToTranscend[0]])
        },
        freeAntUpgrades: (): number => {
            return this.R_calculateAchievementsByReward.freeAntUpgrades.reduce(
                (sum, index) => sum + (this.gameData?.achievements[index] ? this.R_achievements[index].reward!.freeAntUpgrades!() : 0),
                0
            )
        },
        antSacrificeCountMultiplier: (): number => {
            return this.R_calculateAchievementsByReward.antSacrificeCountMultiplier.reduce(
                (prod, index) =>
                    prod * (this.gameData?.achievements[index] ? this.R_achievements[index].reward!.antSacrificeCountMultiplier!() : 1),
                1
            )
        },
        autoAntSacrifice: (): boolean => {
            return Boolean(this.gameData?.achievements[this.R_calculateAchievementsByReward.autoAntSacrifice[0]])
        },
        antSpeed2UpgradeImprover: (): number => {
            return this.R_calculateAchievementsByReward.antSpeed2UpgradeImprover.reduce(
                (sum, index) => sum + (this.gameData?.achievements[index] ? this.R_achievements[index].reward!.antSpeed2UpgradeImprover!() : 0),
                0
            )
        }
    }

    async dumpDataForHeater() {
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

        if (!this.gameData) return 0;
        const data = this.gameData;

        try {
            const { additive, raw, total } = this.calculateLuck(true) as { additive: number, raw: number, total: number };
            const true_luck = this.calculateLuck(true, true) as { additive: number, raw: number, total: number };
            const ambrosiaGainChance = (total - 100 * Math.floor(total / 100)) / 100;
            const trueAmbrosiaGainChance = (true_luck.total - 100 * Math.floor(true_luck.total / 100)) / 100;
            const blueberries = (this.calculateBlueBerries() as number);
            const ambSpeedMult = (this.calculateAmbrosiaSpeed() as number);
            const ambSpeed = blueberries * ambSpeedMult;

            const heaterData = {
                ...this.gameData,
                hs_data: {
                    lifeTimeAmbrosia: data.lifetimeAmbrosia,
                    lifeTimeRedAmbrosia: data.lifetimeRedAmbrosia,
                    quarks: data.worlds,
                    platonic4x4: data.platonicUpgrades[19],
                    baseLuck: raw,
                    luckMult: additive,
                    totalLuck: total,
                    //trueBaseLuck: true_luck.raw,
                    //redAmbrosiaLuck: (this.R_calculateRedAmbrosiaLuck() as number),
                    luckConversion: (this.R_calculateLuckConversion() as number),
                    totalCubes: this.R_calculateTotalCubes(),
                    //effectiveSingularity: data.highestSingularityCount,
                    transcription: 0.55 + data.octUpgrades.octeractOneMindImprover.level / 150,
                    ascSpeed: this.R_calculateAscensionSpeedMult(),
                    blueberries: blueberries,
                    bonusRow2: this.R_calculateRedAmbrosiaUpgradeValue('freeLevelsRow2'),
                    bonusRow3: this.R_calculateRedAmbrosiaUpgradeValue('freeLevelsRow3'),
                    bonusRow4: this.R_calculateRedAmbrosiaUpgradeValue('freeLevelsRow4'),
                    bonusRow5: this.R_calculateRedAmbrosiaUpgradeValue('freeLevelsRow5'),
                    spread: this.R_calculateAscensionSpeedExponentSpread(),
                    totalInfinityVouchers: this.R_calculateAllShopTablets(),
                    tokens: this.campaignData?.tokens,
                    maxTokens: this.campaignData?.maxTokens,
                    isAtMaxTokens: this.campaignData?.isAtMaxTokens,
                    isEvent: this.isEvent,
                    bellStacks: this.eventData?.HAPPY_HOUR_BELL.amount,
                    personalQuarkBonus: this.meData?.bonus.quarkBonus,
                    blueAmbrosiaBarValue: data.blueberryTime,
                    redAmbrosiaBarValue: data.redAmbrosiaTime,
                    blueAmbrosiaBarMax: this.R_calculateRequiredBlueberryTime(),
                    redAmbrosiaBarMax: this.R_calculateRequiredRedAmbrosiaTime(),
                    ambrosiaSpeedMult: ambSpeedMult,
                    ambrosiaSpeed: ambSpeed,
                    ambrosiaGainChance: ambrosiaGainChance,
                    trueAmbrosiaGainChance: trueAmbrosiaGainChance,
                    ambrosiaAcceleratorCount: data.shopUpgrades.shopAmbrosiaAccelerator,
                    pseudoCoinUpgrades: {
                        ambrosiaGenerationBuffLevel: this.pseudoData?.playerUpgrades.find(u => u.internalName === "AMBROSIA_GENERATION_BUFF")?.level,
                        ambrosiaLuckBuffLevel: this.pseudoData?.playerUpgrades.find(u => u.internalName === "AMBROSIA_LUCK_BUFF")?.level,
                        baseObtainiumBuffLevel: this.pseudoData?.playerUpgrades.find(u => u.internalName === "BASE_OBTAINIUM_BUFF")?.level,
                        baseOfferingBuffLevel: this.pseudoData?.playerUpgrades.find(u => u.internalName === "BASE_OFFERING_BUFF")?.level,
                        cubeBuffLevel: this.pseudoData?.playerUpgrades.find(u => u.internalName === "CUBE_BUFF")?.level,
                        redAmbrosiaGenerationBuffLevel: this.pseudoData?.playerUpgrades.find(u => u.internalName === "RED_GENERATION_BUFF")?.level,
                        redAmbrosiaLuckBuffLevel: this.pseudoData?.playerUpgrades.find(u => u.internalName === "RED_LUCK_BUFF")?.level,
                    },
                    redAmbrosiaUpgrades: {
                        tutorial: this.R_calculateRedAmbrosiaUpgradeValue('tutorial'),
                        conversionImprovement1: this.R_calculateRedAmbrosiaUpgradeValue('conversionImprovement1'),
                        conversionImprovement2: this.R_calculateRedAmbrosiaUpgradeValue('conversionImprovement2'),
                        conversionImprovement3: this.R_calculateRedAmbrosiaUpgradeValue('conversionImprovement3'),
                        freeTutorialLevels: this.R_calculateRedAmbrosiaUpgradeValue('freeTutorialLevels'),
                        freeLevelsRow2: this.R_calculateRedAmbrosiaUpgradeValue('freeLevelsRow2'),
                        freeLevelsRow3: this.R_calculateRedAmbrosiaUpgradeValue('freeLevelsRow3'),
                        freeLevelsRow4: this.R_calculateRedAmbrosiaUpgradeValue('freeLevelsRow4'),
                        freeLevelsRow5: this.R_calculateRedAmbrosiaUpgradeValue('freeLevelsRow5'),
                        blueberryGenerationSpeed: this.R_calculateRedAmbrosiaUpgradeValue('blueberryGenerationSpeed'),
                        blueberryGenerationSpeed2: this.R_calculateRedAmbrosiaUpgradeValue('blueberryGenerationSpeed2'),
                        regularLuck: this.R_calculateRedAmbrosiaUpgradeValue('regularLuck'),
                        regularLuck2: this.R_calculateRedAmbrosiaUpgradeValue('regularLuck2'),
                        redGenerationSpeed: this.R_calculateRedAmbrosiaUpgradeValue('redGenerationSpeed'),
                        redLuck: this.R_calculateRedAmbrosiaUpgradeValue('redLuck'),
                        redAmbrosiaCube: this.R_calculateRedAmbrosiaUpgradeValue('redAmbrosiaCube'),
                        redAmbrosiaObtainium: this.R_calculateRedAmbrosiaUpgradeValue('redAmbrosiaObtainium'),
                        redAmbrosiaOffering: this.R_calculateRedAmbrosiaUpgradeValue('redAmbrosiaOffering'),
                        redAmbrosiaCubeImprover: this.R_calculateRedAmbrosiaUpgradeValue('redAmbrosiaCubeImprover'),
                        viscount: this.R_calculateRedAmbrosiaUpgradeValue('viscount'),
                        infiniteShopUpgrades: this.R_calculateRedAmbrosiaUpgradeValue('infiniteShopUpgrades'),
                        redAmbrosiaAccelerator: this.R_calculateRedAmbrosiaUpgradeValue('redAmbrosiaAccelerator'),
                        salvageYinYang: this.R_calculateRedAmbrosiaUpgradeValue('salvageYinYang'),
                        blueberries: this.R_calculateRedAmbrosiaUpgradeValue('blueberries'),
                    },
                    isInsideSingularityChallenge: data.insideSingularityChallenge,
                }
            }

            return heaterData;
        } catch (err) {
            const errorMsg = err instanceof Error ? `${err.message}\n${err.stack}` : String(err);
            HSLogger.error(`Failed to calculate game data for heater export\n${errorMsg}`, this.context);

            HSUI.Notify('Failed to calculate game data for heater export', {
                position: 'top',
                notificationType: "error"
            });

            return;
        }
    }
}