import { ShopUpgradeGroups } from "../../../types/data-types/hs-gamedata-api-types"
import { parseGameDataNumber } from "./hs-gamedata-utils";
import { SHOP_UPGRADE_GROUPS_BY_KEY } from "./stored-vars-and-calculations"
import type { ShopUpgradeHelperContext, CalculationCache, CalculationMode } from "../../../types/data-types/hs-gamedata-api-types"
import { HSLogger } from "../hs-logger";

const QUARKSHOP_CACHE_PREFIX = 'QUARKSHOP_';

const getShopFreeLevelsCubeCacheName                                = (): string => `${QUARKSHOP_CACHE_PREFIX}FREE_CUBE_LEVELS`;
const getShopFreeLevelsAscensionSpeedCacheName                      = (): string => `${QUARKSHOP_CACHE_PREFIX}FREE_ASCENSION_SPEED_LEVELS`;
const getShopFreeLevelsQuarkCacheName                               = (): string => `${QUARKSHOP_CACHE_PREFIX}FREE_QUARK_BONUS_LEVELS`;
const getShopLevelCacheName                       = (upgradeKey: string): string => `${QUARKSHOP_CACHE_PREFIX}SHOP_LEVEL_${upgradeKey}`;
const getShopBonusLevelsCacheName                 = (upgradeKey: string): string => `${QUARKSHOP_CACHE_PREFIX}BONUS_LEVELS_${upgradeKey}`;
const getShopUpgradeTypeBonusLevelsCacheName = (type: ShopUpgradeGroups): string => `${QUARKSHOP_CACHE_PREFIX}TYPE_BONUS_${type}`;

export class ShopUpgradeHelper {
    readonly #ctx: ShopUpgradeHelperContext;
    #lastGameData?: object;
    readonly #shopUpgradeGroupsCache = new Map<string, ShopUpgradeGroups[]>();
    readonly #isUtilityShopUpgradeCache = new Map<string, boolean>();
    readonly #shopUpgradeTypeBonusLevelCalculationVarsCache = new Map<ShopUpgradeGroups, number[]>();
    readonly #shopLevelCalculationVarsCache = new Map<string, number[]>();
    readonly #shopLevelCache = new Map<string, number>();
    readonly #shopEffectCache = new Map<string, any>();
    readonly #shopLevelFreeLevelsCalculationVarsCache = new Map<string, number[]>();
    readonly #shopLevelFreeLevelsCache = new Map<string, number>();
    readonly #shopEffectFreeLevelsCache = new Map<string, any>();

    constructor(ctx: ShopUpgradeHelperContext) {
        this.#ctx = ctx;
    }
    
    #clearCachesIfGameDataChanged(): void {
        const gameData = this.#ctx.getGameData();
        if (gameData !== this.#lastGameData) {
            this.#lastGameData = gameData;
            this.#shopUpgradeGroupsCache.clear();
            this.#isUtilityShopUpgradeCache.clear();
            this.#shopUpgradeTypeBonusLevelCalculationVarsCache.clear();
            this.#shopLevelCalculationVarsCache.clear();
            this.#shopLevelFreeLevelsCalculationVarsCache.clear();
            this.#shopLevelCache.clear();
            this.#shopLevelFreeLevelsCache.clear();
            this.#shopEffectCache.clear();
            this.#shopEffectFreeLevelsCache.clear();
        }
    }

    #getCachedIsUtilityShopUpgrade(upgradeKey: string): boolean {
        this.#clearCachesIfGameDataChanged();
        const cached = this.#isUtilityShopUpgradeCache.get(upgradeKey);
        if (cached !== undefined) return cached;
        const value = isUtilityShopUpgrade(upgradeKey);
        this.#isUtilityShopUpgradeCache.set(upgradeKey, value);
        return value;
    }

    #getCachedShopUpgradeTypeBonusLevelCalculationVars(type: ShopUpgradeGroups): number[] {
        this.#clearCachesIfGameDataChanged();
        const cached = this.#shopUpgradeTypeBonusLevelCalculationVarsCache.get(type);
        if (cached !== undefined) return cached;
        const vars = getShopUpgradeTypeBonusLevelCalculationVars(type, this.#ctx);
        this.#shopUpgradeTypeBonusLevelCalculationVarsCache.set(type, vars);
        return vars;
    }

    #getShopLevelInputs(upgradeKey: string): {
        rawLevel: number;
        gameData: ReturnType<ShopUpgradeHelperContext["getGameData"]>;
        isUtility: boolean;
    } {
        const rawLevel = getRawShopUpgradeLevel(upgradeKey, this.#ctx);
        const gameData = this.#ctx.getGameData();
        const isUtility = this.#getCachedIsUtilityShopUpgrade(upgradeKey);
        return { rawLevel, gameData, isUtility };
    }

    #getCachedShopLevelDependencies(upgradeKey: string): number[] {
        this.#clearCachesIfGameDataChanged();
        const cached = this.#shopLevelCalculationVarsCache.get(upgradeKey);
        if (cached !== undefined) return cached;

        const { rawLevel, gameData, isUtility } = this.#getShopLevelInputs(upgradeKey);
        const vars = buildShopLevelDependencies(
            upgradeKey,
            rawLevel,
            gameData,
            isUtility,
            (group) => this.#getCachedShopUpgradeTypeBonusLevelCalculationVars(group),
        );

        this.#shopLevelCalculationVarsCache.set(upgradeKey, vars);
        return vars;
    }

    #getCachedShopLevelFreeLevelsDependencies(upgradeKey: string): number[] {
        this.#clearCachesIfGameDataChanged();
        const cached = this.#shopLevelFreeLevelsCalculationVarsCache.get(upgradeKey);
        if (cached !== undefined) return cached;

        const { rawLevel, gameData, isUtility } = this.#getShopLevelInputs(upgradeKey);
        const freeEnv = this.#getFreeLevelsOnlyEnv();

        const vars = buildShopLevelDependencies(
            upgradeKey,
            rawLevel,
            gameData,
            isUtility,
            (group) => getShopUpgradeTypeBonusLevelCalculationVars(group, freeEnv),
        );

        this.#shopLevelFreeLevelsCalculationVarsCache.set(upgradeKey, vars);
        return vars;
    }

    #getCachedShopLevel(upgradeKey: string): number {
        this.#clearCachesIfGameDataChanged();
        const cached = this.#shopLevelCache.get(upgradeKey);
        if (cached !== undefined) return cached;

        const { rawLevel, gameData, isUtility } = this.#getShopLevelInputs(upgradeKey);
        const calculationVars = this.#getCachedShopLevelDependencies(upgradeKey);
        const cacheName = getShopLevelCacheName(upgradeKey) as keyof CalculationCache;
        const cachedValue = this.#ctx.checkCalculationCache(cacheName, calculationVars);
        if (cachedValue !== undefined) {
            this.#shopLevelCache.set(upgradeKey, cachedValue);
            return cachedValue;
        }

        const result = buildShopLevelResult(
            upgradeKey,
            rawLevel,
            gameData,
            isUtility,
            () => getShopBonusLevels(upgradeKey, this.#ctx),
        );

        this.#ctx.updateCalculationCache(cacheName, { value: result, cachedBy: calculationVars });
        this.#shopLevelCache.set(upgradeKey, result);
        return result;
    }

    #getFreeLevelsOnlyEnv(): ShopUpgradeHelperContext {
        const baseEnv = this.#ctx;
        const freeEnv = {
            ...baseEnv,
            getShopUpgradeTypeBonusLevels: (type: ShopUpgradeGroups) => getShopUpgradeTypeBonusLevelsFreeLevelsOnly(type, freeEnv),
            getAmbrosiaUpgradeEffects: (upgradeKey: string, mode: CalculationMode = 'true_base') =>
                baseEnv.getAmbrosiaUpgradeEffects(upgradeKey, mode),
            calculateFreeShopInfinityUpgrades: (reduce_vals: boolean, mode: CalculationMode = 'true_base') =>
                baseEnv.calculateFreeShopInfinityUpgrades(reduce_vals, mode),
        } as ShopUpgradeHelperContext;
        return freeEnv;
    }

    #getNoAmbrosiaEnv(): ShopUpgradeHelperContext {
        const baseEnv = this.#ctx;
        const noAmbrosiaEnv = {
            ...baseEnv,
            getShopUpgradeTypeBonusLevels: (type: ShopUpgradeGroups) =>
                SHOP_UPGRADE_GROUP_CONFIG[type]?.getBonusLevels(noAmbrosiaEnv, 'non_ambrosia') ?? 0,
            getAmbrosiaUpgradeEffects: (upgradeKey: string) =>
                baseEnv.getAmbrosiaUpgradeEffects(upgradeKey, 'non_ambrosia'),
            calculateFreeShopInfinityUpgrades: (reduce_vals: boolean) =>
                baseEnv.calculateFreeShopInfinityUpgrades(reduce_vals, 'non_ambrosia'),
        } as ShopUpgradeHelperContext;
        return noAmbrosiaEnv;
    }

    #getShopLevelFreeLevelsOnly(upgradeKey: string): number {
        this.#clearCachesIfGameDataChanged();
        const cached = this.#shopLevelFreeLevelsCache.get(upgradeKey);
        if (cached !== undefined) return cached;

        const { rawLevel, gameData, isUtility } = this.#getShopLevelInputs(upgradeKey);
        const freeEnv = this.#getFreeLevelsOnlyEnv();
        const calculationVars = this.#getCachedShopLevelFreeLevelsDependencies(upgradeKey);
        const cacheName = (`${getShopLevelCacheName(upgradeKey)}_FREE`) as keyof CalculationCache;
        const cachedValue = this.#ctx.checkCalculationCache(cacheName, calculationVars);
        if (cachedValue !== undefined) {
            this.#shopLevelFreeLevelsCache.set(upgradeKey, cachedValue);
            return cachedValue;
        }

        const result = buildShopLevelResult(
            upgradeKey,
            rawLevel,
            gameData,
            isUtility,
            () => getShopBonusLevels(upgradeKey, freeEnv, 'true_base'),
        );

        this.#ctx.updateCalculationCache(cacheName, { value: result, cachedBy: calculationVars });
        this.#shopLevelFreeLevelsCache.set(upgradeKey, result);
        return result;
    }

    #getCachedShopEffect<T extends string, K extends string>(upgradeKey: T, key: K): any {
        this.#clearCachesIfGameDataChanged();
        const level = this.#getCachedShopLevel(upgradeKey);
        const cacheKey = `${upgradeKey}:${key}:${level}`;
        const cachedResult = this.#shopEffectCache.get(cacheKey);
        if (cachedResult !== undefined) return cachedResult;

        const upgradeEffects = SHOP_UPGRADE_EFFECTS[upgradeKey as string];
        const result = upgradeEffects?.[key as string]?.(level, this.#ctx) ?? 0;
        this.#shopEffectCache.set(cacheKey, result);
        return result;
    }

    #getCachedShopEffectFreeLevelsOnly<T extends string, K extends string>(upgradeKey: T, key: K): any {
        this.#clearCachesIfGameDataChanged();
        const level = this.#getShopLevelFreeLevelsOnly(upgradeKey);
        const cacheKey = `FREE:${upgradeKey}:${key}:${level}`;
        const cachedResult = this.#shopEffectFreeLevelsCache.get(cacheKey);
        if (cachedResult !== undefined) return cachedResult;

        const upgradeEffects = SHOP_UPGRADE_EFFECTS[upgradeKey as string];
        const result = upgradeEffects?.[key as string]?.(level, this.#getFreeLevelsOnlyEnv()) ?? 0;
        this.#shopEffectFreeLevelsCache.set(cacheKey, result);
        return result;
    }

    getShopUpgradeTypeBonusLevels(type: ShopUpgradeGroups, mode: CalculationMode = 'normal'): number {
        if (mode === 'true_base') return getShopUpgradeTypeBonusLevelsFreeLevelsOnly(type, this.#ctx);
        if (mode === 'non_ambrosia') {
            const env = this.#getNoAmbrosiaEnv();
            return SHOP_UPGRADE_GROUP_CONFIG[type]?.getBonusLevels(env, mode) ?? 0;
        }
        return getShopUpgradeTypeBonusLevels(type, this.#ctx);
    }

    getShopLevel(upgradeKey: string, mode: CalculationMode = 'normal'): number {
        if (mode === 'true_base') return this.#getShopLevelFreeLevelsOnly(upgradeKey);
        if (mode === 'non_ambrosia') {
            const { rawLevel, gameData, isUtility } = this.#getShopLevelInputs(upgradeKey);
            const env = this.#getNoAmbrosiaEnv();
            return buildShopLevelResult(
                upgradeKey,
                rawLevel,
                gameData,
                isUtility,
                () => getShopBonusLevels(upgradeKey, env, mode),
            );
        }
        return this.#getCachedShopLevel(upgradeKey);
    }

    getShopLevelDependencies(upgradeKey: string): number[] { return this.#getCachedShopLevelDependencies(upgradeKey) }
    getShopUpgradeEffects<T extends string, K extends string>(upgradeKey: T, key: K, mode: CalculationMode = 'normal'): any {
        if (mode === 'true_base') return this.#getCachedShopEffectFreeLevelsOnly(upgradeKey, key);
        if (mode === 'non_ambrosia') {
            const level = this.getShopLevel(upgradeKey, mode);
            return SHOP_UPGRADE_EFFECTS[upgradeKey]?.[key]?.(level, this.#getNoAmbrosiaEnv()) ?? 0;
        }
        return this.#getCachedShopEffect(upgradeKey, key);
    }
    getShopFreeLevelsQuark(mode: CalculationMode = 'normal'): number {
        if (mode === 'true_base') {
            const env = this.#getFreeLevelsOnlyEnv();
            return getShopFreeLevelsQuark(env, mode);
        }
        return getShopFreeLevelsQuark(this.#ctx);
    }
    getShopFreeLevelsCube(): number { return getShopFreeLevelsCube(this.#ctx) }
    getShopFreeLevelsAscensionSpeed(): number { return getShopFreeLevelsAscensionSpeed(this.#ctx) }
}

const getShopUpgradeGroups = (upgradeKey: string): ShopUpgradeGroups[] => {
    return SHOP_UPGRADE_GROUPS_BY_KEY[upgradeKey] ?? []
}

// Mirrors `freeUpgradeMultiplier` from SynergismOfficial/src/Shop.ts.
const getShopFreeUpgradeMultiplier = (upgradeKey: string): number => {
    if (upgradeKey === 'shopRedLuck3') return 2;
    if (upgradeKey === 'shopRedLuck4') return 3;
    return 1;
}

const isUtilityShopUpgrade = (upgradeKey: string): boolean => {
    return getShopUpgradeGroups(upgradeKey).includes(ShopUpgradeGroups.Utility)
}

const getRawShopUpgradeLevel = (upgradeKey: string, env: ShopUpgradeHelperContext): number => {
    const gameData = env.getGameData()
    return gameData?.shopUpgrades[upgradeKey as keyof typeof gameData.shopUpgrades] ?? 0
}

const buildShopLevelDependencies = (
    upgradeKey: string,
    rawLevel: number,
    gameData: ReturnType<ShopUpgradeHelperContext["getGameData"]>,
    isUtility: boolean,
    getShopUpgradeTypeBonusLevelCalculationVars: (group: ShopUpgradeGroups) => number[],
): number[] => {
    const noQuarkLock = gameData?.singularityChallenges.noQuarkUpgrades.enabled && !isUtility ? 1 : 0;
    const shouldIncludeGroupVars = upgradeKey !== 'shopPanthema' && !isUtility;

    const vars: number[] = [rawLevel, noQuarkLock];
    if (shouldIncludeGroupVars) {
        const groups = getShopUpgradeGroups(upgradeKey);
        for (const group of groups) {
            vars.push(...getShopUpgradeTypeBonusLevelCalculationVars(group));
        }
    }

    return vars;
}

const buildShopLevelResult = (
    upgradeKey: string,
    rawLevel: number,
    gameData: ReturnType<ShopUpgradeHelperContext["getGameData"]>,
    isUtility: boolean,
    getBonusLevels: () => number,
): number => {
    if (gameData?.singularityChallenges.noQuarkUpgrades.enabled && !isUtility) {
        return 0;
    }

    if (upgradeKey === 'shopPanthema') {
        return rawLevel;
    }

    return rawLevel + getBonusLevels();
}

type ShopUpgradeGroupConfig = {
    getCalculationVars: (env: ShopUpgradeHelperContext) => number[];
    getBonusLevels: (env: ShopUpgradeHelperContext, mode?: CalculationMode) => number;
}

const getAmbrosiaEffectMode = (mode: CalculationMode): CalculationMode => mode;

const SHOP_UPGRADE_GROUP_CONFIG: Record<ShopUpgradeGroups, ShopUpgradeGroupConfig> = {
    [ShopUpgradeGroups.Offering]: {
        getCalculationVars: (env) => {
            const data = env.getGameData();
            return [
                data?.singularityChallenges.noQuarkUpgrades.completions ?? 0,
                ...getRawTopHatDependencies(env),
                data?.redAmbrosiaUpgrades.freeOfferingUpgrades ?? 0,
                data?.ambrosiaUpgrades.ambrosiaFreeOfferingUpgrades?.ambrosiaInvested ?? 0,
                data?.ambrosiaUpgrades.ambrosiaFreeOfferingUpgrades?.purpleAmbrosiaInvested ?? 0,
            ];
        },
        getBonusLevels: (env, mode = 'normal') => {
            const topHat = getTopHatRuneEffects(env);
            return env.getSingularityChallengeEffect('noQuarkUpgrades', 'freeOfferingLevels')
                + topHat.freeOfferingLevels
                + env.getRedAmbrosiaUpgradeEffects('freeOfferingUpgrades').levels
                + env.getAmbrosiaUpgradeEffects('ambrosiaFreeOfferingUpgrades', getAmbrosiaEffectMode(mode)).freeOfferingUpgrades;
        },
    },
    [ShopUpgradeGroups.Obtainium]: {
        getCalculationVars: (env) => {
            const data = env.getGameData();
            return [
                data?.singularityChallenges.noQuarkUpgrades.completions ?? 0,
                ...getRawTopHatDependencies(env),
                data?.redAmbrosiaUpgrades.freeObtainiumUpgrades ?? 0,
                data?.ambrosiaUpgrades.ambrosiaFreeObtainiumUpgrades?.ambrosiaInvested ?? 0,
                data?.ambrosiaUpgrades.ambrosiaFreeObtainiumUpgrades?.purpleAmbrosiaInvested ?? 0,
            ];
        },
        getBonusLevels: (env, mode = 'normal') => {
            const topHat = getTopHatRuneEffects(env);
            return env.getSingularityChallengeEffect('noQuarkUpgrades', 'freeObtainiumLevels')
                + topHat.freeObtainiumLevels
                + env.getRedAmbrosiaUpgradeEffects('freeObtainiumUpgrades').levels
                + env.getAmbrosiaUpgradeEffects('ambrosiaFreeObtainiumUpgrades', getAmbrosiaEffectMode(mode)).freeObtainiumUpgrades;
        },
    },
    [ShopUpgradeGroups.Cubes]: {
        getCalculationVars: (env) => {
            const data = env.getGameData();
            return [
                data?.singularityChallenges.noQuarkUpgrades.completions ?? 0,
                ...getRawTopHatDependencies(env),
                data?.redAmbrosiaUpgrades.freeCubeUpgrades ?? 0,
                data?.ambrosiaUpgrades.ambrosiaFreeCubeUpgrades?.ambrosiaInvested ?? 0,
                data?.ambrosiaUpgrades.ambrosiaFreeCubeUpgrades?.purpleAmbrosiaInvested ?? 0,
            ];
        },
        getBonusLevels: (env, mode = 'normal') => {
            const topHat = getTopHatRuneEffects(env);
            return env.getSingularityChallengeEffect('noQuarkUpgrades', 'freeCubeLevels')
                + topHat.freeCubeLevels
                + env.getRedAmbrosiaUpgradeEffects('freeCubeUpgrades').levels
                + env.getAmbrosiaUpgradeEffects('ambrosiaFreeCubeUpgrades', getAmbrosiaEffectMode(mode)).freeCubeUpgrades;
        },
    },
    [ShopUpgradeGroups.Speed]: {
        getCalculationVars: (env) => {
            const data = env.getGameData();
            return [
                data?.singularityChallenges.noQuarkUpgrades.completions ?? 0,
                ...getRawTopHatDependencies(env),
                data?.redAmbrosiaUpgrades.freeSpeedUpgrades ?? 0,
            ];
        },
        getBonusLevels: (env) => {
            const topHat = getTopHatRuneEffects(env);
            return env.getSingularityChallengeEffect('noQuarkUpgrades', 'freeSpeedLevels')
                + topHat.freeSpeedLevels
                + env.getRedAmbrosiaUpgradeEffects('freeSpeedUpgrades').levels;
        },
    },
    [ShopUpgradeGroups.Quark]: {
        getCalculationVars: (env) => {
            const data = env.getGameData();
            return [
                data?.singularityChallenges.noQuarkUpgrades.completions ?? 0,
                data?.ambrosiaUpgrades.ambrosiaFreeQuarkUpgrades.ambrosiaInvested ?? 0,
                data?.ambrosiaUpgrades.ambrosiaFreeQuarkUpgrades.purpleAmbrosiaInvested ?? 0,
                data?.redAmbrosiaUpgrades.freeLevelsRow5 ?? 0,
                data?.singularityChallenges.noAmbrosiaUpgrades.enabled ? 1 : 0,
                data?.singularityChallenges.sadisticPrequel.enabled ? 1 : 0,
            ];
        },
        getBonusLevels: (env, mode = 'normal') => env.getSingularityChallengeEffect('noQuarkUpgrades', 'freeQuarkLevel')
            + env.getAmbrosiaUpgradeEffects('ambrosiaFreeQuarkUpgrades', getAmbrosiaEffectMode(mode)).freeQuarkUpgrades,
    },
    [ShopUpgradeGroups.AmbrosiaLuck]: {
        getCalculationVars: (env) => {
            const data = env.getGameData();
            return [
                data?.ambrosiaUpgrades.ambrosiaFreeLuckUpgrades.ambrosiaInvested ?? 0,
                data?.ambrosiaUpgrades.ambrosiaFreeLuckUpgrades.purpleAmbrosiaInvested ?? 0,
                data?.redAmbrosiaUpgrades.freeLevelsRow2 ?? 0,
                data?.singularityChallenges.noAmbrosiaUpgrades.enabled ? 1 : 0,
                data?.singularityChallenges.sadisticPrequel.enabled ? 1 : 0,
            ];
        },
        getBonusLevels: (env, mode = 'normal') => env.getAmbrosiaUpgradeEffects('ambrosiaFreeLuckUpgrades', getAmbrosiaEffectMode(mode)).freeLuckUpgrades,
    },
    [ShopUpgradeGroups.RedAmbrosiaLuck]: {
        getCalculationVars: (env) => {
            const data = env.getGameData();
            return [
                data?.ambrosiaUpgrades.ambrosiaFreeRedLuckUpgrades.ambrosiaInvested ?? 0,
                data?.ambrosiaUpgrades.ambrosiaFreeRedLuckUpgrades.purpleAmbrosiaInvested ?? 0,
                data?.redAmbrosiaUpgrades.freeLevelsRow2 ?? 0,
                data?.singularityChallenges.noAmbrosiaUpgrades.enabled ? 1 : 0,
                data?.singularityChallenges.sadisticPrequel.enabled ? 1 : 0,
            ];
        },
        getBonusLevels: (env, mode = 'normal') => env.getAmbrosiaUpgradeEffects('ambrosiaFreeRedLuckUpgrades', getAmbrosiaEffectMode(mode)).freeRedLuckUpgrades,
    },
    [ShopUpgradeGroups.AmbrosiaGeneration]: {
        getCalculationVars: (env) => {
            const data = env.getGameData();
            return [
                data?.ambrosiaUpgrades.ambrosiaFreeGenerationUpgrades.ambrosiaInvested ?? 0,
                data?.ambrosiaUpgrades.ambrosiaFreeGenerationUpgrades.purpleAmbrosiaInvested ?? 0,
                data?.redAmbrosiaUpgrades.freeLevelsRow2 ?? 0,
                data?.singularityChallenges.noAmbrosiaUpgrades.enabled ? 1 : 0,
                data?.singularityChallenges.sadisticPrequel.enabled ? 1 : 0,
            ];
        },
        getBonusLevels: (env, mode = 'normal') => env.getAmbrosiaUpgradeEffects('ambrosiaFreeGenerationUpgrades', getAmbrosiaEffectMode(mode)).freeGenerationUpgrades,
    },
    [ShopUpgradeGroups.InfinityUpgrades]: {
        getCalculationVars: (env) => {
            return getRawFreeShopInfinityDependencies(env);
        },
        getBonusLevels: (env, mode = 'normal') => {
            const topHat = getTopHatRuneEffects(env);
            return env.calculateFreeShopInfinityUpgrades(false, mode).reduce((sum, value) => sum + value, 0)
                + env.getSingularityChallengeEffect('noQuarkUpgrades', 'freeInfinityLevels')
                + topHat.freeInfinityLevels;
        },
    },
    [ShopUpgradeGroups.Utility]: {
        getCalculationVars: () => [],
        getBonusLevels: () => 0,
    },
};

const getShopUpgradeTypeBonusLevels = (type: ShopUpgradeGroups, env: ShopUpgradeHelperContext): number => {
    const cacheName = getShopUpgradeTypeBonusLevelsCacheName(type) as keyof CalculationCache;
    const calculationVars = getShopUpgradeTypeBonusLevelCalculationVars(type, env);
    const cached = env.checkCalculationCache(cacheName, calculationVars);
    if (cached !== undefined) return cached;

    const result = SHOP_UPGRADE_GROUP_CONFIG[type]?.getBonusLevels(env, 'normal') ?? 0;

    env.updateCalculationCache(cacheName, { value: result, cachedBy: calculationVars });
    return result;
}

const getShopUpgradeTypeBonusLevelsFreeLevelsOnly = (type: ShopUpgradeGroups, env: ShopUpgradeHelperContext): number => {
    const cacheName = (`${getShopUpgradeTypeBonusLevelsCacheName(type)}_FREE`) as keyof CalculationCache;
    const calculationVars = getShopUpgradeTypeBonusLevelCalculationVars(type, env);
    const cached = env.checkCalculationCache(cacheName, calculationVars);
    if (cached !== undefined) return cached;

    const result = SHOP_UPGRADE_GROUP_CONFIG[type]?.getBonusLevels(env, 'true_base') ?? 0;

    env.updateCalculationCache(cacheName, { value: result, cachedBy: calculationVars });
    return result;
}

const getShopUpgradeTypeBonusLevelCalculationVars = (type: ShopUpgradeGroups, env: ShopUpgradeHelperContext): number[] => {
    return SHOP_UPGRADE_GROUP_CONFIG[type]?.getCalculationVars(env) ?? [];
}

const getShopBonusLevels = (upgradeKey: string, env: ShopUpgradeHelperContext, mode: CalculationMode = 'normal'): number => {
    const cacheName = (mode === 'true_base'
        ? `${getShopBonusLevelsCacheName(upgradeKey)}_FREE`
        : mode === 'non_ambrosia'
            ? `${getShopBonusLevelsCacheName(upgradeKey)}_NO_AMB`
            : getShopBonusLevelsCacheName(upgradeKey)) as keyof CalculationCache;
    const calculationVars = getShopLevelDependencies(upgradeKey, env);
    const cached = env.checkCalculationCache(cacheName, calculationVars);
    if (cached !== undefined) return cached;

    const rawLevel = getRawShopUpgradeLevel(upgradeKey, env);
    if (rawLevel <= 0) {
        env.updateCalculationCache(cacheName, { value: 0, cachedBy: calculationVars });
        return 0;
    }

    const result = getShopFreeUpgradeMultiplier(upgradeKey) * getShopUpgradeGroups(upgradeKey).reduce((sum, group) => sum + (
        mode === 'true_base'
            ? getShopUpgradeTypeBonusLevelsFreeLevelsOnly(group, env)
            : mode === 'non_ambrosia'
                ? SHOP_UPGRADE_GROUP_CONFIG[group]?.getBonusLevels(env, mode) ?? 0
            : getShopUpgradeTypeBonusLevels(group, env)
    ), 0);

    env.updateCalculationCache(cacheName, { value: result, cachedBy: calculationVars });
    return result;
}

const getRawTopHatDependencies = (env: ShopUpgradeHelperContext): number[] => {
    const data = env.getGameData();
    if (!data) return [0, 0, 0];

    return [
        parseGameDataNumber(data.runes.topHat),
        data.currentChallenge.reincarnation,
        data.singularityChallenges.noQuarkUpgrades.completions,
    ]
}

const getRawFreeShopInfinityDependencies = (env: ShopUpgradeHelperContext): number[] => {
    const data = env.getGameData();
    if (!data) return [];

    return [
        data.highestSingularityCount,
        data.goldenQuarkUpgrades.singInfiniteShopUpgrades.goldenQuarksInvested,
        data.octUpgrades.octeractInfiniteShopUpgrades.octeractsInvested,
        data.shopUpgrades.shopInfiniteShopUpgrades,
        data.redAmbrosiaUpgrades.infiniteShopUpgrades,
        data.singularityChallenges.noAmbrosiaUpgrades.enabled ? 1 : 0,
        data.singularityChallenges.sadisticPrequel.enabled ? 1 : 0,
        ...Object.values(data.singularityChallenges).map((challenge) => challenge.completions),
        data.redAmbrosiaUpgrades.freeLevelsRow4,
        data.redAmbrosiaUpgrades.freeLevelsRow5,
        data.ambrosiaUpgrades.ambrosiaInfiniteShopUpgrades1.ambrosiaInvested,
        data.ambrosiaUpgrades.ambrosiaInfiniteShopUpgrades1.purpleAmbrosiaInvested ?? 0,
        data.ambrosiaUpgrades.ambrosiaInfiniteShopUpgrades2.ambrosiaInvested,
        data.ambrosiaUpgrades.ambrosiaInfiniteShopUpgrades2.purpleAmbrosiaInvested ?? 0,
        data.ambrosiaUpgrades.ambrosiaInfiniteShopUpgrades3?.ambrosiaInvested ?? 0,
        data.ambrosiaUpgrades.ambrosiaInfiniteShopUpgrades3?.purpleAmbrosiaInvested ?? 0,
        ...getRawTopHatDependencies(env),
    ]
}

const getShopLevel = (upgradeKey: string, env: ShopUpgradeHelperContext): number => {
    const cacheName = getShopLevelCacheName(upgradeKey) as keyof CalculationCache;
    const calculationVars = getShopLevelDependencies(upgradeKey, env);
    const cached = env.checkCalculationCache(cacheName, calculationVars);
    if (cached !== undefined) return cached;

    const rawLevel = getRawShopUpgradeLevel(upgradeKey, env);
    const gameData = env.getGameData();
    const isUtility = isUtilityShopUpgrade(upgradeKey);
    const result = buildShopLevelResult(
        upgradeKey,
        rawLevel,
        gameData,
        isUtility,
        () => getShopBonusLevels(upgradeKey, env),
    );

    env.updateCalculationCache(cacheName, { value: result, cachedBy: calculationVars });
    return result;
}

const getShopLevelFreeLevelsOnly = (upgradeKey: string, env: ShopUpgradeHelperContext): number => {
    const cacheName = (`${getShopLevelCacheName(upgradeKey)}_FREE`) as keyof CalculationCache;
    const calculationVars = getShopLevelDependencies(upgradeKey, env);
    const cached = env.checkCalculationCache(cacheName, calculationVars);
    if (cached !== undefined) return cached;

    const rawLevel = getRawShopUpgradeLevel(upgradeKey, env);
    const gameData = env.getGameData();
    const isUtility = isUtilityShopUpgrade(upgradeKey);
    const result = buildShopLevelResult(
        upgradeKey,
        rawLevel,
        gameData,
        isUtility,
        () => getShopBonusLevels(upgradeKey, env, 'true_base'),
    );

    env.updateCalculationCache(cacheName, { value: result, cachedBy: calculationVars });
    return result;
}

const getShopLevelDependencies = (upgradeKey: string, env: ShopUpgradeHelperContext): number[] => {
    const rawLevel = getRawShopUpgradeLevel(upgradeKey, env);
    const gameData = env.getGameData();
    const isUtility = isUtilityShopUpgrade(upgradeKey);

    return buildShopLevelDependencies(
        upgradeKey,
        rawLevel,
        gameData,
        isUtility,
        (group) => getShopUpgradeTypeBonusLevelCalculationVars(group, env),
    );
}

const getShopFreeLevelsCube = (env: ShopUpgradeHelperContext): number => {
    // const cacheName = getShopFreeLevelsCubeCacheName() as keyof CalculationCache;
    const data = env.getGameData();
    if (!data) return 0;

    /*
    const calculationVars = [
    ];
    const cached = env.checkCalculationCache(cacheName, calculationVars);
    if (cached !== undefined) return cached;
    */

    const result = env.getSingularityChallengeEffect('noQuarkUpgrades', 'freeCubeLevels')
        + env.getRedAmbrosiaUpgradeEffects('freeCubeUpgrades').levels as number
        + env.getAmbrosiaUpgradeEffects('ambrosiaFreeCubeUpgrades').freeCubeUpgrades as number
        + env.getRuneEffects('topHat').freeCubeLevels;

    // env.updateCalculationCache(cacheName, { value: result, cachedBy: calculationVars });
    return result;
}

const getShopFreeLevelsAscensionSpeed = (env: ShopUpgradeHelperContext): number => {
    // const cacheName = getShopFreeLevelsAscensionSpeedCacheName() as keyof CalculationCache;
    const data = env.getGameData();
    if (!data) return 0;

    /*
    const calculationVars = [
    ];
    const cached = env.checkCalculationCache(cacheName, calculationVars);
    if (cached !== undefined) return cached;
    */

    const result = env.getSingularityChallengeEffect('noQuarkUpgrades', 'freeSpeedLevels')
        + env.getRedAmbrosiaUpgradeEffects('freeSpeedUpgrades').levels as number
        + env.getRuneEffects('topHat').freeSpeedLevels;

    // env.updateCalculationCache(cacheName, { value: result, cachedBy: calculationVars });
    return result;
}

const getShopFreeLevelsQuark = (env: ShopUpgradeHelperContext, mode: CalculationMode = 'normal'): number => {
    const cacheName = (`${getShopFreeLevelsQuarkCacheName()}${mode === 'true_base' ? '_TRUE_BASE' : ''}`) as keyof CalculationCache;
    const data = env.getGameData();
    if (!data) return 0;

    const calculationVars = [
        data.singularityChallenges.noQuarkUpgrades.completions,
        env.getAmbrosiaUpgradeEffects('ambrosiaFreeQuarkUpgrades').freeQuarkUpgrades,
        data.redAmbrosiaUpgrades.freeLevelsRow5,
    ];
    const cached = env.checkCalculationCache(cacheName, calculationVars);
    if (cached !== undefined) return cached;

    const result = env.getSingularityChallengeEffect('noQuarkUpgrades', 'freeQuarkLevel')
        + env.getAmbrosiaUpgradeEffects('ambrosiaFreeQuarkUpgrades').freeQuarkUpgrades;

    env.updateCalculationCache(cacheName, { value: result, cachedBy: calculationVars });
    return result;
}

const getTopHatRuneEffects = (env: ShopUpgradeHelperContext) => env.getRuneEffects('topHat') as {
    freeOfferingLevels: number;
    freeObtainiumLevels: number;
    freeCubeLevels: number;
    freeSpeedLevels: number;
    freeInfinityLevels: number;
};

const getHorseShoeEffectiveLevel = (env: ShopUpgradeHelperContext): number => env.getRuneEffectiveLevel('horseShoe');

// Effect formulas mirror the corresponding definitions in
// SynergismOfficial/src/Shop.ts.
const SHOP_UPGRADE_EFFECTS: Record<string, Record<string, (level: number, env: ShopUpgradeHelperContext) => any>> = {
    calculator2: {
        addCodeCapacity: (level) => 1_800 * level,
        addQuarkMult: (level) => level === 12 ? 1.25 : 1,
    },
    calculator3: {
        addRewardVarianceMultiplier: (level) => 1 - level / 10,
        ascensionTimerAdd: (level) => 60 * level,
    },
    calculator4: {
        addCodeIntervalMult: (level) => 1 - level / 25,
        addCodeCapacity: (level) => level === 10 ? 10_800 : 0,
    },
    calculator5: {
        importGQTimerAdd: (level) => 6 * level,
        addCodeCapacity: (level) => 60 * level + (level === 100 ? 4_800 : 0),
    },
    calculator6: {
        octeractTimerAdd: (level) => level,
        addCodeCapacity: (level) => level === 100 ? 10_800 : 0,
    },
    calculator7: {
        blueberryTimerAdd: (level) => level,
        addCodeCapacity: (level) => level === 50 ? 10_800 : 0,
    },
    offeringPotion: {
        skipSeconds: () => 7200,
    },
    obtainiumPotion: {
        skipSeconds: () => 7200,
    },
    offeringEX: {
        offeringMult: (level) => {
            const offeringMult = 1 + 0.1 * level;
            const extraMult = Math.pow(1.12, Math.floor(level / 10));
            return offeringMult * extraMult;
        },
    },
    offeringAuto: {
        autoRune: (level) => level > 0,
        autoRuneSpeedMult: (level) => 1 + 0.01 * level,
    },
    obtainiumEX: {
        obtainiumMult: (level) => {
            const obtainiumMult = 1 + 0.1 * level;
            const extraMult = Math.pow(1.12, Math.floor(level / 10));
            return obtainiumMult * extraMult;
        },
    },
    obtainiumAuto: {
        autoResearch: (level) => level > 0,
        researchCostMult: (level) => 1 - 0.001 * level,
    },
    instantChallenge: {
        unlocked: (level) => level > 0,
        extraCompPerTick: (level) => 10 * level,
    },
    antSpeed: {
        antELO: (level) => 8 * level,
    },
    cashGrab: {
        obtainiumMult: (level) => 1 + 0.0166 * level,
        offeringMult: (level) => 1 + 0.0166 * level,
    },
    seasonPass: {
        wowCubeMult: (level) => 1 + 0.0375 * level,
        wowTesseractMult: (level) => 1 + 0.0375 * level,
    },
    challengeExtension: {
        reincarnationChallengeCap: (level) => 2 * level,
    },
    challengeTome: {
        c10RequirementReduction: (level) => 2e7 * level,
        c9c10ScalingReduction: (level) => -level / 100,
    },
    challengeTome2: {
        c10RequirementReduction: (level) => 2e7 * level,
        c9c10ScalingReduction: (level) => -level / 100,
    },
    cubeToQuark: {
        cubeQuarkMult: (level) => level >= 1 ? 1.5 + 0.5 * (1 - Math.pow(0.9, level - 1)) : 1,
    },
    tesseractToQuark: {
        tesseractQuarkMult: (level) => level >= 1 ? 1.5 + 0.5 * (1 - Math.pow(0.9, level - 1)) : 1,
    },
    hypercubeToQuark: {
        hypercubeQuarkMult: (level) => level >= 1 ? 1.5 + 0.5 * (1 - Math.pow(0.9, level - 1)) : 1,
    },
    seasonPass2: {
        wowHypercubeMult: (level) => 1 + 0.015 * level,
        wowPlatonicMult: (level) => 1 + 0.015 * level,
    },
    seasonPass3: {
        wowHepteractMult: (level) => 1 + 0.015 * level,
        wowOcteractMult: (level) => 1 + 0.015 * level,
    },
    chronometer: {
        ascensionSpeedMult: (level) => 1 + 0.02 * level,
    },
    infiniteAscent: {
        runeUnlocked: (level) => level > 0,
    },
    calculator: {
        autoAnswer: (level) => level > 0,
        addQuarkMult: (level) => 1 + 0.14 * level,
        autoFill: (level) => level === 5,
    },
    chronometer2: {
        ascensionSpeedMult: (level) => 1 + 0.006 * level,
    },
    chronometer3: {
        ascensionSpeedMult: (level) => 1 + 0.015 * level,
    },
    chronometerInfinity: {
        ascensionSpeedMult: (level) => Math.pow(1.006, level),
        exponentSpread: (level) => 0.001 * Math.floor(level / 40),
    },
    seasonPassY: {
        globalCubeMult: (level) => 1 + 0.0075 * level,
        wowOcteractMult: (level) => 1 + 0.0075 * level,
    },
    seasonPassZ: {
        globalCubeMult: (level, env) => 1 + 0.01 * level * (env.getGameData()?.singularityCount ?? 0),
        wowOcteractMult: (level, env) => 1 + 0.01 * level * (env.getGameData()?.singularityCount ?? 0),
    },
    instantChallenge2: {
        unlocked: (level) => level > 0,
        extraCompPerTick: (level, env) => level * (env.getGameData()?.highestSingularityCount ?? 0),
    },
    cubeToQuarkAll: {
        quarkMult: (level) => 1 + 0.002 * level,
    },
    cashGrab2: {
        obtainiumMult: (level) => 1 + 0.005 * level,
        offeringMult: (level) => 1 + 0.005 * level,
    },
    chronometerZ: {
        ascensionSpeedMult: (level, env) => 1 + 0.001 * level * (env.getGameData()?.singularityCount ?? 0),
    },
    offeringEX2: {
        offeringMult: (level, env) => 1 + 0.01 * level * (env.getGameData()?.singularityCount ?? 0),
    },
    obtainiumEX2: {
        obtainiumMult: (level, env) => 1 + 0.01 * level * (env.getGameData()?.singularityCount ?? 0),
    },
    powderAuto: {
        automaticPowderFraction: (level) => 0.01 * level,
    },
    seasonPassLost: {
        wowOcteractMult: (level) => 1 + 0.001 * level,
    },
    extraWarp: {
        additionalWarps: (level) => level,
    },
    improveQuarkHept: {
        quarkHeptExponent: (level) => 0.01 * level,
    },
    improveQuarkHept2: {
        quarkHeptExponent: (level) => 0.01 * level,
    },
    improveQuarkHept3: {
        quarkHeptExponent: (level) => 0.01 * level,
    },
    improveQuarkHept4: {
        quarkHeptExponent: (level) => 0.01 * level,
    },
    improveQuarkHept5: {
        quarkHeptExponent: (level) => 0.0001 * level,
    },
    powderEX: {
        orbToPowderConversionMult: (level) => 1 + 0.02 * level,
    },
    offeringEX3: {
        offeringMult: (level) => Math.pow(1.012, level),
        baseOfferings: (level) => Math.floor(level / 25),
    },
    obtainiumEX3: {
        obtainiumMult: (level) => Math.pow(1.012, level),
        immaculateObtainiuMult: (level) => Math.pow(1.06, Math.floor(level / 25)),
    },
    seasonPassInfinity: {
        globalCubeMult: (level) => Math.pow(1.012, level),
        wowOcteractMult: (level) => Math.pow(1.012, level * 1.25),
    },
    constantEX: {
        maxPercentIncrease: (level) => level,
    },
    challenge15Auto: {
        unlocked: (level) => level > 0,
    },
    autoWarp: {
        unlocked: (level) => level > 0,
    },
    shopTalisman: {
        talismanUnlocked: (level, env) => level > 0 || env.getPCoinUpgradeLevel('INSTANT_UNLOCK_1') > 0,
        unlocked: (level, env) => level > 0 || env.getPCoinUpgradeLevel('INSTANT_UNLOCK_1') > 0,
    },
    shopImprovedDaily: {
        dailyCodeQuarkMult: (level) => 1 + 0.05 * level,
    },
    shopImprovedDaily2: {
        freeSingularityUpgrades: (level) => level,
        dailyCodeGoldenQuarkMult: (level) => 1 + 0.2 * level,
    },
    shopImprovedDaily3: {
        freeSingularityUpgrades: (level) => level,
        dailyCodeGoldenQuarkMult: (level) => 1 + 0.15 * level,
    },
    shopImprovedDaily4: {
        freeSingularityUpgrades: (level) => level,
        dailyCodeGoldenQuarkMult: (level) => 1 + level,
    },
    shopAmbrosiaGeneration1: {
        ambrosiaGenerationMult: (level) => 1 + 0.01 * level,
    },
    shopAmbrosiaGeneration2: {
        ambrosiaGenerationMult: (level) => 1 + 0.01 * level,
    },
    shopAmbrosiaGeneration3: {
        ambrosiaGenerationMult: (level) => 1 + 0.01 * level,
    },
    shopAmbrosiaGeneration4: {
        ambrosiaGenerationMult: (level) => 1 + 0.001 * level,
    },
    shopAmbrosiaAccelerator: {
        ambrosiaPointRequirementMult: (level, env) => {
            const data = env.getGameData();
            const ex5Comps = data?.singularityChallenges.noAmbrosiaUpgrades.completions ?? 0;
            return 1 - 0.006 * level * ex5Comps;
        },
    },
    shopAmbrosiaLuck1: {
        ambrosiaLuck: (level) => 2 * level,
    },
    shopAmbrosiaLuck2: {
        ambrosiaLuck: (level) => 2 * level,
    },
    shopAmbrosiaLuck3: {
        ambrosiaLuck: (level) => 2 * level,
    },
    shopAmbrosiaLuck4: {
        ambrosiaLuck: (level) => 0.6 * level,
    },
    shopAmbrosiaLuckMultiplier4: {
        additiveAmbrosiaLuckMult: (level) => 0.01 * level,
    },
    shopOcteractAmbrosiaLuck: {
        ambrosiaLuck: (level, env) => {
            const wowOcteracts = env.getGameData()?.wowOcteracts ?? 0;
            const log10Octeracts = wowOcteracts > 0 ? Math.log10(wowOcteracts) : 0;
            return level * (1 + Math.floor(Math.max(0, log10Octeracts)));
        },
    },
    shopAmbrosiaUltra: {
        ambrosiaLuck: (level, env) => 2 * level * env.calculateSumOfExaltCompletions(),
    },
    shopRedLuck1: {
        redLuck: (level) => 0.05 * level,
        luckConversionRatio: (level) => -0.01 * Math.floor(level / 20),
    },
    shopRedLuck2: {
        redLuck: (level) => 0.075 * level,
        luckConversionRatio: (level) => -0.01 * Math.floor(level / 20),
    },
    shopRedLuck3: {
        redLuck: (level) => 0.1 * level,
        luckConversionRatio: (level) => -0.01 * Math.floor(level / 20),
    },
    shopRedLuck4: {
        redLuck: (level) => 0.2 * level,
        luckConversionRatio: (level) => -0.01 * Math.floor(level / 100),
    },
    shopCashGrabUltra: {
        ambrosiaGenerationMult: (level, env) => {
            const lifetimeAmbrosia = env.getGameData()?.lifetimeAmbrosia ?? 0;
            const ratio = Math.min(1, Math.cbrt(lifetimeAmbrosia / 1e7));
            return 1 + 0.15 * level * ratio;
        },
        cubesMult: (level, env) => {
            const lifetimeAmbrosia = env.getGameData()?.lifetimeAmbrosia ?? 0;
            const ratio = Math.min(1, Math.cbrt(lifetimeAmbrosia / 1e7));
            return 1 + 1.2 * level * ratio;
        },
        quarkMult: (level, env) => {
            const lifetimeAmbrosia = env.getGameData()?.lifetimeAmbrosia ?? 0;
            const ratio = Math.min(1, Math.cbrt(lifetimeAmbrosia / 1e7));
            return 1 + 0.08 * level * ratio;
        },
    },
    shopEXUltra: {
        offeringMult: (level, env) => {
            const lifetimeAmbrosia = env.getGameData()?.lifetimeAmbrosia ?? 0;
            const ambrosiaMult = Math.min(125 * level, lifetimeAmbrosia / 1000) / 1000;
            return 1 + ambrosiaMult;
        },
        obtainiumMult: (level, env) => {
            const lifetimeAmbrosia = env.getGameData()?.lifetimeAmbrosia ?? 0;
            const ambrosiaMult = Math.min(125 * level, lifetimeAmbrosia / 1000) / 1000;
            return 1 + ambrosiaMult;
        },
        cubeMult: (level, env) => {
            const lifetimeAmbrosia = env.getGameData()?.lifetimeAmbrosia ?? 0;
            const ambrosiaMult = Math.min(125 * level, lifetimeAmbrosia / 1000) / 1000;
            return 1 + ambrosiaMult;
        },
    },
    shopChronometerS: {
        ascensionSpeedMult: (level, env) => {
            const singularityCount = env.getGameData()?.singularityCount ?? 0;
            return Math.pow(1.01, level * Math.max(0, singularityCount - 200));
        },
        globalSpeedMult: (level, env) => {
            const singularityCount = env.getGameData()?.singularityCount ?? 0;
            return Math.pow(1.01, level * Math.max(0, singularityCount - 200));
        },
    },
    shopSingularitySpeedup: {
        singularityUpgradeSpeedMult: (level) => level > 0 ? 50 : 1,
    },
    shopSingularityPotency: {
        freeUpgradeMult: (level) => level > 0 ? 3.66 : 1,
    },
    shopSadisticRune: {
        runeUnlocked: (level) => level > 0,
    },
    shopSingularityPenaltyDebuff: {
        singularityPenaltyReducers: (level) => level,
    },
    shopInfiniteShopUpgrades: {
        infiniteVouchers: (level, env) => Math.floor(0.01 * level * env.calculateSumOfExaltCompletions()),
    },
    shopHorseShoe: {
        bonusHorseLevels: (level) => 3 * level,
        singularityPenaltyMult: (level, env) => {
            const horseShoeLevel = getHorseShoeEffectiveLevel(env);
            return 1 - Math.min(300, horseShoeLevel * level) / 1000;
        },
    },
    shopPurpleBarRebate: {
        ambrosiaBarPointsPerFill: (level) => 50_000 * level,
        redAmbrosiaBarPointsPerFill: (level) => 25 * level,
    },
    shopPanthema: {
        infinityMetaBoost: (level, env) => 1 + 0.01 * level * env.getShopUpgradeTypeBonusLevels(ShopUpgradeGroups.InfinityUpgrades),
        offeringMult: (level, env) => {
            const infinityBoost = 1 + 0.01 * level * env.getShopUpgradeTypeBonusLevels(ShopUpgradeGroups.InfinityUpgrades);
            return 1 + 0.01 * level * env.getShopUpgradeTypeBonusLevels(ShopUpgradeGroups.Offering) * infinityBoost;
        },
        obtainiumMult: (level, env) => {
            const infinityBoost = 1 + 0.01 * level * env.getShopUpgradeTypeBonusLevels(ShopUpgradeGroups.InfinityUpgrades);
            return 1 + 0.01 * level * env.getShopUpgradeTypeBonusLevels(ShopUpgradeGroups.Obtainium) * infinityBoost;
        },
        cubeMult: (level, env) => {
            const infinityBoost = 1 + 0.01 * level * env.getShopUpgradeTypeBonusLevels(ShopUpgradeGroups.InfinityUpgrades);
            return 1 + 0.005 * level * env.getShopUpgradeTypeBonusLevels(ShopUpgradeGroups.Cubes) * infinityBoost;
        },
        ascensionSpeedMult: (level, env) => {
            const infinityBoost = 1 + 0.01 * level * env.getShopUpgradeTypeBonusLevels(ShopUpgradeGroups.InfinityUpgrades);
            return 1 + 0.005 * level * env.getShopUpgradeTypeBonusLevels(ShopUpgradeGroups.Speed) * infinityBoost;
        },
        quarkMult: (level, env) => {
            const infinityBoost = 1 + 0.01 * level * env.getShopUpgradeTypeBonusLevels(ShopUpgradeGroups.InfinityUpgrades);
            return 1 + 0.001 * level * env.getShopUpgradeTypeBonusLevels(ShopUpgradeGroups.Quark) * infinityBoost;
        },
        ambrosiaGenerationMult: (level, env) => {
            const infinityBoost = 1 + 0.01 * level * env.getShopUpgradeTypeBonusLevels(ShopUpgradeGroups.InfinityUpgrades);
            return 1 + 0.001 * level * env.getShopUpgradeTypeBonusLevels(ShopUpgradeGroups.AmbrosiaGeneration) * infinityBoost;
        },
        ambrosiaLuck: (level, env) => {
            const infinityBoost = 1 + 0.01 * level * env.getShopUpgradeTypeBonusLevels(ShopUpgradeGroups.InfinityUpgrades);
            return 0.2 * level * env.getShopUpgradeTypeBonusLevels(ShopUpgradeGroups.AmbrosiaLuck) * infinityBoost;
        },
        redLuck: (level, env) => {
            const infinityBoost = 1 + 0.01 * level * env.getShopUpgradeTypeBonusLevels(ShopUpgradeGroups.InfinityUpgrades);
            return 0.05 * level * env.getShopUpgradeTypeBonusLevels(ShopUpgradeGroups.RedAmbrosiaLuck) * infinityBoost;
        },
    },
};
