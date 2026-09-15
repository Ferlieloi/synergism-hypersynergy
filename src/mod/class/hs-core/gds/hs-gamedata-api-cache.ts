import { HSGlobal } from "../hs-global";
import { HSLogger } from "../hs-logger";
import { CalculationCache, CachedValue, ShopUpgradeGroups } from "../../../types/data-types/hs-gamedata-api-types";
import { ACHIEVEMENT_REWARD_TYPES } from "../../../types/data-types/hs-gamedata-api-types";
import { EventBuffType } from "../../../types/data-types/hs-event-data";
import { HSUtils } from "../../hs-utils/hs-utils";
import { SHOP_UPGRADE_GROUPS_BY_KEY, SHOP_UPGRADE_TYPE_KEYS } from "./stored-vars-and-calculations";
import type { AmbrosiaHelper } from "./hs-gamedata-api-ambrosia";

export const checkCalculationCache = <T = number>(
    cache: CalculationCache,
    cacheName: keyof CalculationCache,
    checkCacheAgainst: number[],
): T | undefined => {
    if (!(cacheName in cache)) {
        HSLogger.debug(() => `Could not find cache for '${cacheName}'`);
        return undefined;
    }

    const cached = cache[cacheName];

    if (cached.value === undefined || cached.cachedBy.length === 0) {
        if (HSGlobal.Debug.calculationCacheDebugMode)
            console.log(`Cache missed (reason: null value or empty cache) for ${cacheName} with value ${cached.value}`);

        return undefined;
    }
    if (cached.cachedBy.length !== checkCacheAgainst.length) {
        if (HSGlobal.Debug.calculationCacheDebugMode)
            console.warn(`Cache missed (reason: cache length mismatch) for ${cacheName} with value ${cached.value}`);

        return undefined;
    }
    for (let i = 0; i < cached.cachedBy.length; i++) {
        if (cached.cachedBy[i] !== checkCacheAgainst[i]) {
            if (HSGlobal.Debug.calculationCacheDebugMode) {
                console.log(`Cache missed (reason: calc var mismatch) for ${cacheName} (${cached.cachedBy[i]})`);
            }

            return undefined;
        }
    }

    if (HSGlobal.Debug.calculationCacheDebugMode)
        console.log(`Hit cache for ${cacheName} with value ${cached.value}`);

    return cached.value as T;
}

export const updateCalculationCache = (
    cache: CalculationCache,
    cacheName: keyof CalculationCache,
    newCachedValue: CachedValue,
): void => {
    if (newCachedValue.cachedBy.length === 0 || newCachedValue.value === null || newCachedValue.value === undefined) {
        if (HSGlobal.Debug.calculationCacheDebugMode)
            console.warn(`Rejected cache update for ${cacheName} (value: ${newCachedValue.value}, cachedBy: ${newCachedValue.cachedBy.length})`);

        return;
    }
    cache[cacheName] = newCachedValue;
}

export const clearCalculationCache = (template: CalculationCache): CalculationCache => {
    return { ...template };
}

export const dumpCalculationCache = (cache: CalculationCache): void => {
    console.table(cache);
}

export const createQuarkShopCalculationCacheEntries = (): Record<string, CachedValue> => {
    const entries: Record<string, CachedValue> = {};

    const addCacheEntry = (name: string): void => {
        entries[name] = { value: undefined, cachedBy: [] };
    };

    const upgradeKeys = new Set<string>(Object.keys(SHOP_UPGRADE_GROUPS_BY_KEY));
    const extraQuarkShopUpgradeKeys = [
        'shopAmbrosiaLuckMultiplier4',
        'shopOcteractAmbrosiaLuck',
        'shopAmbrosiaUltra',
        'shopAmbrosiaAccelerator',
        'shopCashGrabUltra',
        'shopEXUltra',
        'shopChronometerS',
        'shopImprovedDaily',
        'shopImprovedDaily2',
        'shopImprovedDaily3',
        'shopImprovedDaily4',
        'shopSingularitySpeedup',
        'shopSingularityPotency',
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
        addCacheEntry(`QUARKSHOP_SHOP_LEVEL_${upgradeKey}_FREE`);
        addCacheEntry(`QUARKSHOP_BONUS_LEVELS_${upgradeKey}`);
        addCacheEntry(`QUARKSHOP_BONUS_LEVELS_${upgradeKey}_FREE`);
    }
    for (const group of Object.values(ShopUpgradeGroups).filter((value): value is ShopUpgradeGroups => typeof value === 'number')) {
        addCacheEntry(`QUARKSHOP_TYPE_BONUS_${group}`);
        addCacheEntry(`QUARKSHOP_TYPE_BONUS_${group}_FREE`);
    }

    addCacheEntry('QUARKSHOP_FREE_QUARK_BONUS_LEVELS');
    return entries;
};

export const createAchievementRewardCalculationCacheEntries = (): Record<string, CachedValue> => {
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

export const createEventBuffCalculationCacheEntries = (): Record<string, CachedValue> => {
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

export const createAmbrosiaCalculationCacheEntries = (ambrosiaHelper: AmbrosiaHelper): Record<string, CachedValue> => {
    const entries: Record<string, CachedValue> = {};
    const addCacheEntry = (name: string): void => {
        entries[name] = { value: undefined, cachedBy: [] };
    };

    for (const upgradeName of Object.keys(ambrosiaHelper.ambrosiaUpgradeCalculationCollection)) {
        addCacheEntry(`AMB_${upgradeName}`);
        addCacheEntry(`AMB_${upgradeName}_FREE`);
    }

    for (const upgradeName of Object.keys(ambrosiaHelper.redAmbrosiaUpgradeCalculationCollection)) {
        addCacheEntry(`REDAMB_${upgradeName}`);
    }
    return entries;
};

export const createCoreCalculationCacheEntries = (): Record<string, CachedValue> => {
    const entries: Record<string, CachedValue> = {};
    const addCacheEntry = (name: string): void => {
        entries[name] = { value: undefined, cachedBy: [] };
    };

    const coreKeys = [
        'AmbrosiaGenerationShopUpgrade',
        'AmbrosiaGenerationShopUpgrade_TRUE_BASE',
        'AmbrosiaGenerationShopUpgrade_NON_AMB',
        'AmbrosiaGenerationSingularityUpgrade',
        'AmbrosiaGenerationOcteractUpgrade',
        'AmbrosiaGenerationSpeedRaw',
        'AmbrosiaGenerationSpeedRaw_TRUE_BASE',
        'AmbrosiaGenerationSpeedRaw_NON_AMB',
        'AmbrosiaLuckShopUpgrade',
        'AmbrosiaLuckShopUpgrade_TRUE_BASE',
        'AmbrosiaLuckShopUpgrade_NON_AMB',
        'AmbrosiaLuckSingularityUpgrade',
        'AmbrosiaLuckOcteractUpgrade',
        'PanthemaAmbrosiaLuck',
        'PanthemaAmbrosiaLuck_TRUE_BASE',
        'PanthemaAmbrosiaLuck_NON_AMB',
        'PanthemaRedLuck',
        'PanthemaRedLuck_TRUE_BASE',
        'PanthemaRedLuck_NON_AMB',
        'SingularityReductions',
        'SingularityReductions_TRUE_BASE',
        'LuckConversion',
        'LuckConversion_TRUE_BASE',
        'LuckConversion_NON_AMB',
        'AllShopTablets',
        'AllShopTablets_TRUE_BASE',
        'AllShopTablets_NON_AMB',
        'AllTalismanRuneBonusStatsSum',
        'calculateAscensionScore',
        'CampaignAmbrosiaSpeedBonus',
        'CampaignRune6Bonus',
        'CampaignLuckBonus',
        'Challenge15Reward',
        'CubesExpTotal',
        'DilatedFiveLeafBonus',
        'EffectiveSingularities',
        'FreeAntUpgradeLevels',
        'GetRuneEffectiveLevel',
        'HepteractEffective',
        'NumberOfThresholds',
        'RequiredBlueberryTime',
        'RequiredRedAmbrosiaTime',
        'RawAscensionSpeedMult',
        'RawAscensionSpeedMult_TRUE_BASE',
        'RawAscensionSpeedMult_NON_AMB',
        'RedAmbrosiaLuck',
        'RedAmbrosiaLuck_TRUE_BASE',
        'RedAmbrosiaLuck_NON_AMB',
        'SingularityDebuff',
        'SingularityMilestoneBlueberries',
        'SumOfExaltCompletions',
        'ToNextThreshold',
    ];

    for (const key of coreKeys) {
        addCacheEntry(key);
    }
    return entries;
};

export const createCalculationCache = (ambrosiaHelper: AmbrosiaHelper): CalculationCache => {
    return {
        ...createCoreCalculationCacheEntries(),
        ...createQuarkShopCalculationCacheEntries(),
        ...createAchievementRewardCalculationCacheEntries(),
        ...createAmbrosiaCalculationCacheEntries(ambrosiaHelper),
        ...createEventBuffCalculationCacheEntries(),
    } as CalculationCache;
};
