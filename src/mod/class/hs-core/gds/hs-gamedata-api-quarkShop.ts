import { ShopUpgradeGroups } from "../../../types/data-types/hs-gamedata-api-types"
import type { ShopUpgradeHelperContext, CalculationCache } from "../../../types/data-types/hs-gamedata-api-types"
import { HSLogger } from "../hs-logger";
import { SHOP_UPGRADE_GROUPS_BY_KEY } from "./stored-vars-and-calculations"

const QUARKSHOP_CACHE_PREFIX = 'QUARKSHOP_';

const getShopLevelCacheName = (upgradeKey: string): string => `${QUARKSHOP_CACHE_PREFIX}SHOP_LEVEL_${upgradeKey}`;
const getShopBonusLevelsCacheName = (upgradeKey: string): string => `${QUARKSHOP_CACHE_PREFIX}BONUS_LEVELS_${upgradeKey}`;
const getShopUpgradeTypeBonusLevelsCacheName = (type: ShopUpgradeGroups): string => `${QUARKSHOP_CACHE_PREFIX}TYPE_BONUS_${type}`;
const getQuarkShopBonusLevelsCacheName = (): string => `${QUARKSHOP_CACHE_PREFIX}FREE_QUARK_BONUS_LEVELS`;

export class ShopUpgradeHelper {
    constructor(private readonly ctx: ShopUpgradeHelperContext) {}
    
    getShopUpgradeGroups(upgradeKey: string): ShopUpgradeGroups[] { return getShopUpgradeGroups(upgradeKey, this.ctx) }
    isUtilityShopUpgrade(upgradeKey: string): boolean { return isUtilityShopUpgrade(upgradeKey, this.ctx) }
    getRawShopUpgradeLevel(upgradeKey: string): number { return getRawShopUpgradeLevel(upgradeKey, this.ctx) }
    getShopUpgradeTypeBonusLevels(type: ShopUpgradeGroups): number { return getShopUpgradeTypeBonusLevels(type, this.ctx) }
    getShopBonusLevels(upgradeKey: string): number { return getShopBonusLevels(upgradeKey, this.ctx) }
    R_getShopLevel(upgradeKey: string): number { return R_getShopLevel(upgradeKey, this.ctx) }
    getShopLevelCalculationVars(upgradeKey: string): number[] { return getShopLevelCalculationVars(upgradeKey, this.ctx) }
    getShopUpgradeEffects<T extends string, K extends string>(upgradeKey: T, key: K): any { return getShopUpgradeEffects(upgradeKey, key, this.ctx) }
    calculateShopUpgradeEffect(upgradeKey: string, level: number, key: string): any { return calculateShopUpgradeEffect(upgradeKey, level, key, this.ctx) }
    getQuarkShopBonusLevels(): number { return getQuarkShopBonusLevels(this.ctx) }
}


export const getShopUpgradeGroups = (upgradeKey: string, env: ShopUpgradeHelperContext): ShopUpgradeGroups[] => {
    return SHOP_UPGRADE_GROUPS_BY_KEY[upgradeKey] ?? []
}

export const isUtilityShopUpgrade = (upgradeKey: string, env: ShopUpgradeHelperContext): boolean => {
    return getShopUpgradeGroups(upgradeKey, env).includes(ShopUpgradeGroups.Utility)
}

export const getRawShopUpgradeLevel = (upgradeKey: string, env: ShopUpgradeHelperContext): number => {
    const gameData = env.getGameData()
    return gameData?.shopUpgrades[upgradeKey as keyof typeof gameData.shopUpgrades] ?? 0
}

export const getShopUpgradeTypeBonusLevels = (type: ShopUpgradeGroups, env: ShopUpgradeHelperContext): number => {
    const cacheName = getShopUpgradeTypeBonusLevelsCacheName(type) as keyof CalculationCache;
    const calculationVars = getShopUpgradeTypeBonusLevelCalculationVars(type, env);
    const cached = env.checkCalculationCache(cacheName, calculationVars);
    if (cached !== undefined) return cached;

    const result = (() => {
        switch (type) {
            case ShopUpgradeGroups.Offering:
                return env.getSingularityChallengeEffect('noQuarkUpgrades', 'freeOfferingLevels')
                    + env.R_getRuneEffects('topHat').freeOfferingLevels
                    + env.R_getRedAmbrosiaUpgradeEffects('freeOfferingUpgrades').levels
            case ShopUpgradeGroups.Obtainium:
                return env.getSingularityChallengeEffect('noQuarkUpgrades', 'freeObtainiumLevels')
                    + env.R_getRuneEffects('topHat').freeObtainiumLevels
                    + env.R_getRedAmbrosiaUpgradeEffects('freeObtainiumUpgrades').levels
            case ShopUpgradeGroups.Cubes:
                return env.getSingularityChallengeEffect('noQuarkUpgrades', 'freeCubeLevels')
                    + env.R_getRuneEffects('topHat').freeCubeLevels
                    + env.R_getRedAmbrosiaUpgradeEffects('freeCubeUpgrades').levels
            case ShopUpgradeGroups.Speed:
                return env.getSingularityChallengeEffect('noQuarkUpgrades', 'freeSpeedLevels')
                    + env.R_getRuneEffects('topHat').freeSpeedLevels
                    + env.R_getRedAmbrosiaUpgradeEffects('freeSpeedUpgrades').levels
            case ShopUpgradeGroups.Quark:
                return env.getSingularityChallengeEffect('noQuarkUpgrades', 'freeQuarkLevel')
                    + env.R_getAmbrosiaUpgradeEffects('ambrosiaFreeQuarkUpgrades').freeQuarkUpgrades
            case ShopUpgradeGroups.AmbrosiaLuck:
                return env.R_getAmbrosiaUpgradeEffects('ambrosiaFreeLuckUpgrades').freeLuckUpgrades
            case ShopUpgradeGroups.RedAmbrosiaLuck:
                return env.R_getAmbrosiaUpgradeEffects('ambrosiaFreeRedLuckUpgrades').freeRedLuckUpgrades
            case ShopUpgradeGroups.AmbrosiaGeneration:
                return env.R_getAmbrosiaUpgradeEffects('ambrosiaFreeGenerationUpgrades').freeGenerationUpgrades
            case ShopUpgradeGroups.InfinityUpgrades:
                return env.R_calculateFreeShopInfinityUpgrades(false).reduce((sum, value) => sum + value, 0)
                    + env.getSingularityChallengeEffect('noQuarkUpgrades', 'freeInfinityLevels')
                    + env.R_getRuneEffects('topHat').freeInfinityLevels
            case ShopUpgradeGroups.Utility:
                return 0
            default:
                return 0
        }
    })();

    env.updateCalculationCache(cacheName, { value: result, cachedBy: calculationVars });
    return result;
}

export const getShopBonusLevels = (upgradeKey: string, env: ShopUpgradeHelperContext): number => {
    const cacheName = getShopBonusLevelsCacheName(upgradeKey) as keyof CalculationCache;
    const calculationVars = getShopLevelCalculationVars(upgradeKey, env);
    const cached = env.checkCalculationCache(cacheName, calculationVars);
    if (cached !== undefined) return cached;

    const rawLevel = getRawShopUpgradeLevel(upgradeKey, env)
    if (rawLevel <= 0) {
        env.updateCalculationCache(cacheName, { value: 0, cachedBy: calculationVars });
        return 0
    }

    const result = getShopUpgradeGroups(upgradeKey, env)        .reduce((sum, group) => sum + getShopUpgradeTypeBonusLevels(group, env), 0)

    env.updateCalculationCache(cacheName, { value: result, cachedBy: calculationVars });
    return result
}

const getRawTopHatDependencies = (env: ShopUpgradeHelperContext): number[] => {
    const data = env.getGameData();
    if (!data) return [0, 0, 0];

    return [
        data.runes.topHat?.toNumber() ?? 0,
        data.currentChallenge.reincarnation,
        data.singularityChallenges.noQuarkUpgrades.completions,
    ]
}

const getRawFreeShopInfinityDependencies = (env: ShopUpgradeHelperContext): number[] => {
    const data = env.getGameData();
    if (!data) return [];

    return [
        data.highestSingularityCount,
        data.goldenQuarkUpgrades.singInfiniteShopUpgrades.level,
        data.octUpgrades.octeractInfiniteShopUpgrades.level,
        data.shopUpgrades.shopInfiniteShopUpgrades,
        data.redAmbrosiaUpgrades.infiniteShopUpgrades,
        data.singularityChallenges.noAmbrosiaUpgrades.enabled ? 1 : 0,
        ...Object.values(data.singularityChallenges).map((challenge) => challenge.completions),
        data.redAmbrosiaUpgrades.freeLevelsRow4,
        data.redAmbrosiaUpgrades.freeLevelsRow5,
        data.ambrosiaUpgrades.ambrosiaInfiniteShopUpgrades1.ambrosiaInvested,
        data.ambrosiaUpgrades.ambrosiaInfiniteShopUpgrades2.ambrosiaInvested,
        ...getRawTopHatDependencies(env),
    ]
}

export const getShopUpgradeTypeBonusLevelCalculationVars = (type: ShopUpgradeGroups, env: ShopUpgradeHelperContext): number[] => {
    const data = env.getGameData();
    if (!data) return [];

    const noQuarkCompletions = data.singularityChallenges.noQuarkUpgrades.completions;

    switch (type) {
        case ShopUpgradeGroups.Offering:
            return [
                noQuarkCompletions,
                ...getRawTopHatDependencies(env),
                data.redAmbrosiaUpgrades.freeOfferingUpgrades,
            ]
        case ShopUpgradeGroups.Obtainium:
            return [
                noQuarkCompletions,
                ...getRawTopHatDependencies(env),
                data.redAmbrosiaUpgrades.freeObtainiumUpgrades,
            ]
        case ShopUpgradeGroups.Cubes:
            return [
                noQuarkCompletions,
                ...getRawTopHatDependencies(env),
                data.redAmbrosiaUpgrades.freeCubeUpgrades,
            ]
        case ShopUpgradeGroups.Speed:
            return [
                noQuarkCompletions,
                ...getRawTopHatDependencies(env),
                data.redAmbrosiaUpgrades.freeSpeedUpgrades,
            ]
        case ShopUpgradeGroups.Quark:
            return [
                noQuarkCompletions,
                data.ambrosiaUpgrades.ambrosiaFreeQuarkUpgrades.ambrosiaInvested,
                data.redAmbrosiaUpgrades.freeLevelsRow5,
            ]
        case ShopUpgradeGroups.AmbrosiaLuck:
            return [
                data.ambrosiaUpgrades.ambrosiaFreeLuckUpgrades.ambrosiaInvested,
                data.redAmbrosiaUpgrades.freeLevelsRow2,
            ]
        case ShopUpgradeGroups.RedAmbrosiaLuck:
            return [
                data.ambrosiaUpgrades.ambrosiaFreeRedLuckUpgrades.ambrosiaInvested,
                data.redAmbrosiaUpgrades.freeLevelsRow4,
            ]
        case ShopUpgradeGroups.AmbrosiaGeneration:
            return [
                data.ambrosiaUpgrades.ambrosiaFreeGenerationUpgrades.ambrosiaInvested,
                data.redAmbrosiaUpgrades.freeLevelsRow3,
            ]
        case ShopUpgradeGroups.InfinityUpgrades:
            return getRawFreeShopInfinityDependencies(env)
        case ShopUpgradeGroups.Utility:
            return []
        default:
            return []
    }
}

export const R_getShopLevel = (upgradeKey: string, env: ShopUpgradeHelperContext): number => {
    const cacheName = getShopLevelCacheName(upgradeKey) as keyof CalculationCache;
    const calculationVars = getShopLevelCalculationVars(upgradeKey, env);
    const cached = env.checkCalculationCache(cacheName, calculationVars);
    if (cached !== undefined) return cached;

    const rawLevel = getRawShopUpgradeLevel(upgradeKey, env)
    const gameData = env.getGameData()
    let result = rawLevel
    if (gameData?.singularityChallenges.noQuarkUpgrades.enabled && !isUtilityShopUpgrade(upgradeKey, env)) {
        result = 0
    } else if (upgradeKey !== 'shopPanthema') {
        result = rawLevel + getShopBonusLevels(upgradeKey, env)
    }

    env.updateCalculationCache(cacheName, { value: result, cachedBy: calculationVars });
    return result
}

export const getShopLevelCalculationVars = (upgradeKey: string, env: ShopUpgradeHelperContext): number[] => {
    const rawLevel = getRawShopUpgradeLevel(upgradeKey, env)
    const gameData = env.getGameData()
    const noQuarkLock = gameData?.singularityChallenges.noQuarkUpgrades.enabled && !isUtilityShopUpgrade(upgradeKey, env) ? 1 : 0

    return [
        rawLevel,
        noQuarkLock,
        ...(rawLevel > 0
            ? getShopUpgradeGroups(upgradeKey, env)
                .flatMap((group) => getShopUpgradeTypeBonusLevelCalculationVars(group, env))
            : []),
    ]
}

export const getShopUpgradeEffects = <T extends string, K extends string>(upgradeKey: T, key: K, env: ShopUpgradeHelperContext): any => {
    const shopLevel = R_getShopLevel(upgradeKey, env)
    return calculateShopUpgradeEffect(upgradeKey, shopLevel, key, env)
}

export const getQuarkShopBonusLevels = (env: ShopUpgradeHelperContext): number => {
    const cacheName = getQuarkShopBonusLevelsCacheName() as keyof CalculationCache;
    const data = env.getGameData();
    if (!data) return 0;

    const calculationVars = [
        data.singularityChallenges.noQuarkUpgrades.completions,
        env.R_getAmbrosiaUpgradeEffects('ambrosiaFreeQuarkUpgrades').freeQuarkUpgrades,
        data.redAmbrosiaUpgrades.freeLevelsRow5,
    ];
    const cached = env.checkCalculationCache(cacheName, calculationVars);
    if (cached !== undefined) return cached;

    const result = env.getSingularityChallengeEffect('noQuarkUpgrades', 'freeQuarkLevel')
        + env.R_getAmbrosiaUpgradeEffects('ambrosiaFreeQuarkUpgrades').freeQuarkUpgrades

    env.updateCalculationCache(cacheName, { value: result, cachedBy: calculationVars });
    return result
}

export const calculateShopUpgradeEffect = (
    upgradeKey: string,
    level: number,
    key: string,
    env: ShopUpgradeHelperContext,
): any => {
    switch (upgradeKey) {
        case 'calculator2':
            if (key === 'addCodeCapacity') {
                return 2 * level
            }
            if (key === 'addQuarkMult') {
                return level === 12 ? 1.25 : 1
            }
            break
        case 'calculator3':
            if (key === 'addRewardVarianceMultiplier') {
                return 1 - level / 10
            }
            if (key === 'ascensionTimerAdd') {
                return 60 * level
            }
            break
        case 'calculator4':
            if (key === 'addCodeIntervalMult') {
                return 1 - level / 25
            }
            if (key === 'addCodeCapacity') {
                return level === 10 ? 32 : 0
            }
            break
        case 'calculator5':
            if (key === 'importGQTimerAdd') {
                return 6 * level
            }
            if (key === 'addCodeCapacity') {
                return Math.floor(level / 10) + (level === 100 ? 6 : 0)
            }
            break
        case 'calculator6':
            if (key === 'octeractTimerAdd') {
                return level
            }
            if (key === 'addCodeCapacity') {
                return level === 100 ? 24 : 0
            }
            break
        case 'calculator7':
            if (key === 'blueberryTimerAdd') {
                return level
            }
            if (key === 'addCodeCapacity') {
                return level === 50 ? 48 : 0
            }
            break
        case 'offeringPotion':
            if (key === 'skipSeconds') {
                return 7200
            }
            break
        case 'obtainiumPotion':
            if (key === 'skipSeconds') {
                return 7200
            }
            break
        case 'offeringEX':
            if (key === 'offeringMult') {
                const offeringMult = 1 + 0.06 * level
                const extraMult = Math.pow(1.08, Math.floor(level / 10))
                return offeringMult * extraMult
            }
            break
        case 'offeringAuto':
            if (key === 'autoRune') {
                return level > 0
            }
            if (key === 'autoRuneSpeedMult') {
                return 1 + 0.01 * level
            }
            break
        case 'obtainiumEX':
            if (key === 'obtainiumMult') {
                const obtainiumMult = 1 + 0.06 * level
                const extraMult = Math.pow(1.08, Math.floor(level / 10))
                return obtainiumMult * extraMult
            }
            break
        case 'obtainiumAuto':
            if (key === 'autoResearch') {
                return level > 0
            }
            if (key === 'researchCostMult') {
                return 1 - 0.001 * level
            }
            break
        case 'instantChallenge':
            if (key === 'unlocked') {
                return level > 0
            }
            if (key === 'extraCompPerTick') {
                return 10 * level
            }
            break
        case 'antSpeed':
            if (key === 'antELO') {
                return 4 * level
            }
            break
        case 'cashGrab':
            if (key === 'obtainiumMult' || key === 'offeringMult') {
                return 1 + 0.01 * level
            }
            break
        case 'seasonPass':
            if (key === 'wowCubeMult' || key === 'wowTesseractMult') {
                return 1 + 0.0225 * level
            }
            break
        case 'challengeExtension':
            if (key === 'reincarnationChallengeCap') {
                return 2 * level
            }
            break
        case 'challengeTome':
        case 'challengeTome2':
            if (key === 'c10RequirementReduction') {
                return 2e7 * level
            }
            if (key === 'c9c10ScalingReduction') {
                return -level / 100
            }
            break
        case 'cubeToQuark':
            if (key === 'cubeQuarkMult') {
                return level >= 1 ? 1.5 + 0.5 * (1 - Math.pow(0.9, level - 1)) : 1
            }
            break
        case 'tesseractToQuark':
            if (key === 'tesseractQuarkMult') {
                return level >= 1 ? 1.5 + 0.5 * (1 - Math.pow(0.9, level - 1)) : 1
            }
            break
        case 'hypercubeToQuark':
            if (key === 'hypercubeQuarkMult') {
                return level >= 1 ? 1.5 + 0.5 * (1 - Math.pow(0.9, level - 1)) : 1
            }
            break
        case 'seasonPass2':
            if (key === 'wowHypercubeMult' || key === 'wowPlatonicMult') {
                return 1 + 0.015 * level
            }
            break
        case 'seasonPass3':
            if (key === 'wowHepteractMult' || key === 'wowOcteractMult') {
                return 1 + 0.015 * level
            }
            break
        case 'chronometer':
            if (key === 'ascensionSpeedMult') {
                return 1 + 0.012 * level
            }
            break
        case 'infiniteAscent':
            if (key === 'runeUnlocked') {
                return level > 0
            }
            break
        case 'calculator':
            if (key === 'autoAnswer') {
                return level > 0
            }
            if (key === 'addQuarkMult') {
                return 1 + 0.14 * level
            }
            if (key === 'autoFill') {
                return level === 5
            }
            break
        case 'chronometer2':
            if (key === 'ascensionSpeedMult') {
                return 1 + 0.006 * level
            }
            break
        case 'chronometer3':
            if (key === 'ascensionSpeedMult') {
                return 1 + 0.015 * level
            }
            break
        case 'chronometerInfinity':
            if (key === 'ascensionSpeedMult') {
                return Math.pow(1.006, level)
            }
            if (key === 'exponentSpread') {
                return 0.001 * Math.floor(level / 40)
            }
            break
        case 'seasonPassY':
            if (key === 'globalCubeMult' || key === 'wowOcteractMult') {
                return 1 + 0.0075 * level
            }
            break
        case 'seasonPassZ':
            if (key === 'globalCubeMult' || key === 'wowOcteractMult') {
                const singularityCount = env.getGameData()?.singularityCount ?? 0
                return 1 + 0.01 * level * singularityCount
            }
            break
        case 'instantChallenge2':
            if (key === 'unlocked') {
                return level > 0
            }
            if (key === 'extraCompPerTick') {
                const highestSingularityCount = env.getGameData()?.highestSingularityCount ?? 0
                return level * highestSingularityCount
            }
            break
        case 'cubeToQuarkAll':
            if (key === 'quarkMult') {
                return 1 + 0.002 * level
            }
            break
        case 'cashGrab2':
            if (key === 'obtainiumMult' || key === 'offeringMult') {
                return 1 + 0.005 * level
            }
            break
        case 'chronometerZ':
            if (key === 'ascensionSpeedMult') {
                const singularityCount = env.getGameData()?.singularityCount ?? 0
                return 1 + 0.001 * level * singularityCount
            }
            break
        case 'offeringEX2':
            if (key === 'offeringMult') {
                const singularityCount = env.getGameData()?.singularityCount ?? 0
                return 1 + 0.01 * level * singularityCount
            }
            break
        case 'obtainiumEX2':
            if (key === 'obtainiumMult') {
                const singularityCount = env.getGameData()?.singularityCount ?? 0
                return 1 + 0.01 * level * singularityCount
            }
            break
        case 'powderAuto':
            if (key === 'automaticPowderFraction') {
                return 0.01 * level
            }
            break
        case 'seasonPassLost':
            if (key === 'wowOcteractMult') {
                return 1 + 0.001 * level
            }
            break
        case 'extraWarp':
            if (key === 'additionalWarps') {
                return level
            }
            break
        case 'improveQuarkHept':
        case 'improveQuarkHept2':
        case 'improveQuarkHept3':
        case 'improveQuarkHept4':
            if (key === 'quarkHeptExponent') {
                return 0.01 * level
            }
            break
        case 'improveQuarkHept5':
            if (key === 'quarkHeptExponent') {
                return 0.0001 * level
            }
            break
        case 'powderEX':
            if (key === 'orbToPowderConversionMult') {
                return 1 + 0.02 * level
            }
            break
        case 'offeringEX3':
            if (key === 'offeringMult') {
                return Math.pow(1.012, level)
            }
            if (key === 'baseOfferings') {
                return Math.floor(level / 25)
            }
            break
        case 'obtainiumEX3':
            if (key === 'obtainiumMult') {
                return Math.pow(1.012, level)
            }
            if (key === 'immaculateObtainiuMult') {
                return Math.pow(1.06, Math.floor(level / 25))
            }
            break
        case 'seasonPassInfinity':
            if (key === 'globalCubeMult') {
                return Math.pow(1.012, level)
            }
            if (key === 'wowOcteractMult') {
                return Math.pow(1.012, level * 1.25)
            }
            break
        case 'constantEX':
            if (key === 'maxPercentIncrease') {
                return level
            }
            break
        case 'challenge15Auto':
            if (key === 'unlocked') {
                return level > 0
            }
            break
        case 'autoWarp':
            if (key === 'unlocked') {
                return level > 0
            }
            break
        case 'shopTalisman':
            if (key === 'talismanUnlocked' || key === 'unlocked') {
                return level > 0 || env.getPCoinUpgradeLevel('INSTANT_UNLOCK_1') > 0
            }
            break
        case 'shopImprovedDaily':
            if (key === 'dailyCodeQuarkMult') {
                return 1 + 0.05 * level
            }
            break
        case 'shopImprovedDaily2':
            if (key === 'freeSingularityUpgrades') {
                return level
            }
            if (key === 'dailyCodeGoldenQuarkMult') {
                return 1 + 0.2 * level
            }
            break
        case 'shopImprovedDaily3':
            if (key === 'freeSingularityUpgrades') {
                return level
            }
            if (key === 'dailyCodeGoldenQuarkMult') {
                return 1 + 0.15 * level
            }
            break
        case 'shopImprovedDaily4':
            if (key === 'freeSingularityUpgrades') {
                return level
            }
            if (key === 'dailyCodeGoldenQuarkMult') {
                return 1 + level
            }
            break
        case 'shopAmbrosiaGeneration1':
            if (key === 'ambrosiaGenerationMult') {
                return 1 + 0.01 * level
            }
            break
        case 'shopAmbrosiaGeneration2':
            if (key === 'ambrosiaGenerationMult') {
                return 1 + 0.01 * level
            }
            break
        case 'shopAmbrosiaGeneration3':
            if (key === 'ambrosiaGenerationMult') {
                return 1 + 0.01 * level
            }
            break
        case 'shopAmbrosiaGeneration4':
            if (key === 'ambrosiaGenerationMult') {
                return 1 + 0.001 * level
            }
            break
        case 'shopAmbrosiaAccelerator':
            if (key === 'ambrosiaPointRequirementMult') {
                const data = env.getGameData()
                const ex5Comps = data?.singularityChallenges.noAmbrosiaUpgrades.completions ?? 0
                return 1 - 0.006 * level * ex5Comps
            }
            break
        case 'shopAmbrosiaLuck1':
            if (key === 'ambrosiaLuck') {
                return 2 * level
            }
            break
        case 'shopAmbrosiaLuck2':
            if (key === 'ambrosiaLuck') {
                return 2 * level
            }
            break
        case 'shopAmbrosiaLuck3':
            if (key === 'ambrosiaLuck') {
                return 2 * level
            }
            break
        case 'shopAmbrosiaLuck4':
            if (key === 'ambrosiaLuck') {
                return 0.6 * level
            }
            break
        case 'shopAmbrosiaLuckMultiplier4':
            if (key === 'additiveAmbrosiaLuckMult') {
                return 0.01 * level
            }
            break
        case 'shopOcteractAmbrosiaLuck':
            if (key === 'ambrosiaLuck') {
                const wowOcteracts = Number(env.getGameData()?.wowOcteracts ?? 0)
                const log10Octeracts = wowOcteracts > 0 ? Math.log10(wowOcteracts) : 0
                return level * (1 + Math.floor(Math.max(0, log10Octeracts)))
            }
            break
        case 'shopAmbrosiaUltra':
            if (key === 'ambrosiaLuck') {
                return 2 * level * env.R_calculateSumOfExaltCompletions()
            }
            break
        case 'shopRedLuck1':
            if (key === 'redLuck') {
                return 0.05 * level
            }
            if (key === 'luckConversionRatio') {
                return -0.01 * Math.floor(level / 20)
            }
            break
        case 'shopRedLuck2':
            if (key === 'redLuck') {
                return 0.075 * level
            }
            if (key === 'luckConversionRatio') {
                return -0.01 * Math.floor(level / 20)
            }
            break
        case 'shopRedLuck3':
            if (key === 'redLuck') {
                return 0.1 * level
            }
            if (key === 'luckConversionRatio') {
                return -0.01 * Math.floor(level / 20)
            }
            break
        case 'shopCashGrabUltra': {
            const lifetimeAmbrosia = env.getGameData()?.lifetimeAmbrosia ?? 0
            const ratio = Math.min(1, Math.cbrt(lifetimeAmbrosia / 1e7))
            if (key === 'ambrosiaGenerationMult') {
                return 1 + 0.15 * level * ratio
            }
            if (key === 'cubesMult') {
                return 1 + 1.2 * level * ratio
            }
            if (key === 'quarkMult') {
                return 1 + 0.08 * level * ratio
            }
            break
        }
        case 'shopEXUltra':
            if (key === 'offeringMult' || key === 'obtainiumMult' || key === 'cubeMult') {
                const lifetimeAmbrosia = env.getGameData()?.lifetimeAmbrosia ?? 0
                const ambrosiaMult = Math.min(125 * level, lifetimeAmbrosia / 1000) / 1000
                return 1 + ambrosiaMult
            }
            break
        case 'shopChronometerS':
            if (key === 'ascensionSpeedMult' || key === 'globalSpeedMult') {
                const singularityCount = env.getGameData()?.singularityCount ?? 0
                return Math.pow(1.01, 1 * Math.max(0, singularityCount - 200))
            }
            break
        case 'shopSingularitySpeedup':
            if (key === 'singularityUpgradeSpeedMult') {
                return level > 0 ? 50 : 1
            }
            break
        case 'shopSingularityPotency':
            if (key === 'freeUpgradeMult') {
                return level > 0 ? 3.66 : 1
            }
            break
        case 'shopSadisticRune':
            if (key === 'runeUnlocked') {
                return level > 0
            }
            break
        case 'shopSingularityPenaltyDebuff':
            if (key === 'singularityPenaltyReducers') {
                return level
            }
            break
        case 'shopInfiniteShopUpgrades':
            if (key === 'infiniteVouchers') {
                return Math.floor(0.01 * level * env.R_calculateSumOfExaltCompletions())
            }
            break
        case 'shopHorseShoe':
            if (key === 'bonusHorseLevels') {
                return 3 * level
            }
            if (key === 'singularityPenaltyMult') {
                const horseShoeLevel = env.R_getRuneEffectiveLevel('horseShoe')
                return 1 - Math.min(300, horseShoeLevel * level) / 1000
            }
            break
        case 'shopPanthema': {
            const infinityBoost = 1 + 0.01 * level * env.getShopUpgradeTypeBonusLevels(ShopUpgradeGroups.InfinityUpgrades)
            if (key === 'infinityMetaBoost') {
                return infinityBoost
            }
            if (key === 'offeringMult') {
                return 1 + 0.01 * level * env.getShopUpgradeTypeBonusLevels(ShopUpgradeGroups.Offering) * infinityBoost
            }
            if (key === 'obtainiumMult') {
                return 1 + 0.01 * level * env.getShopUpgradeTypeBonusLevels(ShopUpgradeGroups.Obtainium) * infinityBoost
            }
            if (key === 'cubeMult') {
                return 1 + 0.005 * level * env.getShopUpgradeTypeBonusLevels(ShopUpgradeGroups.Cubes) * infinityBoost
            }
            if (key === 'ascensionSpeedMult') {
                return 1 + 0.005 * level * env.getShopUpgradeTypeBonusLevels(ShopUpgradeGroups.Speed) * infinityBoost
            }
            if (key === 'quarkMult') {
                return 1 + 0.001 * level * env.getShopUpgradeTypeBonusLevels(ShopUpgradeGroups.Quark) * infinityBoost
            }
            if (key === 'ambrosiaGenerationMult') {
                return 1 + 0.001 * level * env.getShopUpgradeTypeBonusLevels(ShopUpgradeGroups.AmbrosiaGeneration) * infinityBoost
            }
            if (key === 'ambrosiaLuck') {
                return 0.2 * level * env.getShopUpgradeTypeBonusLevels(ShopUpgradeGroups.AmbrosiaLuck) * infinityBoost
            }
            if (key === 'redLuck') {
                return 0.05 * level * env.getShopUpgradeTypeBonusLevels(ShopUpgradeGroups.RedAmbrosiaLuck) * infinityBoost
            }
            break
        }
    }

    return 0
}
