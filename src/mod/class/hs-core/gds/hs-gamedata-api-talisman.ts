import Decimal from "break_infinity.js";
import { HSGlobal } from "../hs-global";
import { parseGameDataDecimal } from "./hs-gamedata-utils";
import { AntUpgrades, CalculationCache, RuneKeys, TalismanKeys, TalismanTypeMap, TalismanHelperContext, } from "../../../types/data-types/hs-gamedata-api-types";
import { TALISMAN_ACHIEVEMENT_EFFECT_INSCRIPT_VALUES, TALISMAN_CHRONOS_INSCRIPT_VALUES, TALISMAN_COOKIEGRANDMA_INSCRIPT_VALUES, TALISMAN_EXEMPTION_INSCRIPT_VALUES, TALISMAN_METAPHYSICS_INSCRIPT_VALUES, TALISMAN_MIDAS_INSCRIPT_VALUES, TALISMAN_MORTUUS_INSCRIPT_VALUES, TALISMAN_PLASTIC_INSCRIPT_VALUES, TALISMAN_POLYMATH_INSCRIPT_VALUES, TALISMAN_WOWSQUARE_INSCRIPT_VALUES, TALISMAN_HORSESHOE_INSCRIPT_VALUES } from "../../../types/data-types/hs-gamedata-api-types";
import { TALISMAN_BASE_COEFFICIENTS, TALISMAN_RARITY_VALUES, getTalismanBaseMult, getTalismanCostType, getTalismanExponentialRatio, getTalismanMaxLevel, talismanCostKeys, TalismanCostKey, regularCostProgressionDecimal, exponentialCostProgressionDecimal, } from "./stored-vars-and-calculations";
import { HSLogger } from "../hs-logger";

const TALISMAN_KEYS = Object.keys(TALISMAN_BASE_COEFFICIENTS) as TalismanKeys[];
const TALISMAN_RUNE_KEYS = TALISMAN_KEYS.length > 0
    ? Object.keys(TALISMAN_BASE_COEFFICIENTS[TALISMAN_KEYS[0]]) as RuneKeys[]
    : [] as RuneKeys[];

export class TalismanHelper {
    #lastGameData?: ReturnType<TalismanHelperContext['getGameData']>
    readonly #talismanLevelCache = new Map<TalismanKeys, number>()
    readonly #talismanRarityCache = new Map<TalismanKeys, number>()
    readonly #talismanLevelCapCache = new Map<TalismanKeys, number>()
    readonly #talismanUnlockedCache = new Map<TalismanKeys, boolean>()
    readonly #talismanEffectsCache = new Map<TalismanKeys, Map<number, unknown>>()
    #allRuneBonusesCache?: Record<RuneKeys, number>
    #statsComputed = false
    #ctx: TalismanHelperContext

    constructor(ctx: TalismanHelperContext) {
        this.#ctx = ctx;
    }

    #clearCachesIfGameDataChanged(): void {
        const gameData = this.#ctx.getGameData();
        if (gameData !== this.#lastGameData) {
            this.#lastGameData = gameData;
            this.#talismanLevelCache.clear();
            this.#talismanRarityCache.clear();
            this.#talismanLevelCapCache.clear();
            this.#talismanUnlockedCache.clear();
            this.#talismanEffectsCache.clear();
            this.#allRuneBonusesCache = undefined;
            this.#statsComputed = false;
        }
    }

    #getTalismanKeys(): TalismanKeys[] {
        const data = this.#ctx.getGameData();
        if (!data) return [];
        return Object.keys(data.talismans) as TalismanKeys[];
    }

    #calculateTalismanRarityFromLevel(t: TalismanKeys, level: number, unlocked: boolean): number {
        if (!unlocked) return 0;

        const maxLevel = getTalismanMaxLevel(t);
        const levelRatio = level / maxLevel;
        let extraRarity = 0;
        if (levelRatio >= 1) {
            if (levelRatio >= 2) extraRarity += 1;
            if (levelRatio >= 4) extraRarity += 1;
            if (levelRatio >= 8) extraRarity += 1;
        }

        return 1 + Math.min(6, Math.floor(6 * levelRatio)) + extraRarity;
    }

    #computeAllTalismanStats(): void {
        if (this.#statsComputed) return;
        this.#clearCachesIfGameDataChanged();

        const keys = this.#getTalismanKeys();
        for (const key of keys) {
            const unlocked = isTalismanUnlocked(key, this.#ctx);
            this.#talismanUnlockedCache.set(key, unlocked);
        }

        for (const key of keys) {
            const level = getTalismanLevel(key, this.#ctx);
            this.#talismanLevelCache.set(key, level);
        }

        for (const key of keys) {
            const level = this.#talismanLevelCache.get(key) ?? 0;
            const unlocked = this.#talismanUnlockedCache.get(key) ?? false;
            const rarity = this.#calculateTalismanRarityFromLevel(key, level, unlocked);
            this.#talismanRarityCache.set(key, rarity);
        }

        this.#statsComputed = true;
    }

    #computeAllRuneBonuses(): Record<RuneKeys, number> {
        if (this.#allRuneBonusesCache) return this.#allRuneBonusesCache;
        this.#computeAllTalismanStats();

        const totalBonuses = TALISMAN_RUNE_KEYS.reduce((acc, rune) => {
            acc[rune] = 0;
            return acc;
        }, {} as Record<RuneKeys, number>);

        for (const talisman of TALISMAN_KEYS) {
            const level = this.#talismanLevelCache.get(talisman) ?? 0;
            const rarity = this.#talismanRarityCache.get(talisman) ?? 0;
            if (rarity === 0) continue;

            let bonusMult = 1;
            if (talisman === 'metaphysics') {
                const effects = this.getTalismanEffects('metaphysics', rarity);
                bonusMult *= effects.talismanEffect;
                bonusMult *= effects.extraTalismanEffect;
            }
            if (talisman === 'mortuus') {
                bonusMult *= this.#ctx.getAntUpgradeEffectValue(AntUpgrades.Mortuus2, 'talismanEffectBuff');
            }

            const rarityValue = TALISMAN_RARITY_VALUES[rarity] ?? 0;
            const talismanMultiplier = level * rarityValue * bonusMult;

            for (const rune of TALISMAN_RUNE_KEYS) {
                const coef = TALISMAN_BASE_COEFFICIENTS[talisman][rune];
                totalBonuses[rune] += coef * talismanMultiplier;
            }
        }

        const specialMultiplier = this.allTalismanRuneBonusStatsSum();
        for (const rune of TALISMAN_RUNE_KEYS) {
            totalBonuses[rune] *= specialMultiplier;
        }

        this.#allRuneBonusesCache = totalBonuses;
        return totalBonuses;
    }

    allTalismanRuneBonusStatsSum = (): number => {
        this.#clearCachesIfGameDataChanged();
        const data = this.#ctx.getGameData();
        const cacheName = 'AllTalismanRuneBonusStatsSum' as keyof CalculationCache;
        const calculationVars = [
            data?.researches?.[106] ?? 0,
            data?.researches?.[107] ?? 0,
            data?.researches?.[118] ?? 0,
            data?.researches?.[200] ?? 0,
            data?.cubeUpgrades?.[50] ?? 0,
            Number(this.#ctx.getAchievementReward('talismanPower') ?? 0),
            this.#ctx.calculateChallenge15Reward('talismanBonus') ?? 0,
            this.#ctx.getGQUpgradeEffect('singTalismanBonusRunes1') ?? 0,
            this.#ctx.getGQUpgradeEffect('singTalismanBonusRunes2') ?? 0,
            this.#ctx.getGQUpgradeEffect('singTalismanBonusRunes3') ?? 0,
            this.#ctx.getGQUpgradeEffect('singTalismanBonusRunes4') ?? 0,
            this.#ctx.getAmbrosiaUpgradeEffects('ambrosiaTalismanBonusRuneLevel').talismanBonusRuneLevel ?? 0,
            this.#ctx.getSingularityChallengeEffect('taxmanLastStand', 'talismanRuneEffect') ?? 0,
        ];

        const cached = this.#ctx.checkCalculationCache(cacheName, calculationVars);
        if (cached !== undefined) return cached;

        const result = allTalismanRuneBonusStatsSum(this.#ctx);
        this.#ctx.updateCalculationCache(cacheName, { value: result, cachedBy: calculationVars });
        return result;
    }

    getTalismanEffects = <K extends TalismanKeys>(t: K, rarity?: number): TalismanTypeMap[K] => {
        this.#computeAllTalismanStats();
        const actualRarity = rarity === undefined ? this.getTalismanRarity(t) : rarity;
        let rarityCache = this.#talismanEffectsCache.get(t);
        if (!rarityCache) {
            rarityCache = new Map<number, unknown>();
            this.#talismanEffectsCache.set(t, rarityCache);
        }

        if (rarityCache.has(actualRarity)) {
            return rarityCache.get(actualRarity) as TalismanTypeMap[K];
        }

        const result = getTalismanEffects(t, actualRarity, this.#ctx);
        rarityCache.set(actualRarity, result);
        return result;
    }

    getTalismanLevel = (t: TalismanKeys): number => {
        this.#computeAllTalismanStats();
        return this.#talismanLevelCache.get(t) ?? 0;
    }

    getTalismanRarity = (t: TalismanKeys): number => {
        this.#computeAllTalismanStats();
        return this.#talismanRarityCache.get(t) ?? 0;
    }

    calculateTalismanRarityTotal = (): number => {
        this.#computeAllTalismanStats();
        return Array.from(this.#talismanRarityCache.values()).reduce((sum, rarity) => sum + rarity, 0);
    }

    getRuneBonusFromAllTalismansBatch = (): Record<RuneKeys, number> => {
        this.#computeAllTalismanStats();
        return this.#computeAllRuneBonuses();
    }

    getRuneBonusFromAllTalismans = (rune: RuneKeys): number => {
        this.#computeAllTalismanStats();
        const bonuses = this.#computeAllRuneBonuses();
        return bonuses[rune] ?? 0;
    }

    getTalismanLevelCap = (t: TalismanKeys): number => {
        this.#clearCachesIfGameDataChanged();
        const cached = this.#talismanLevelCapCache.get(t);
        if (cached !== undefined) return cached;

        const result = getTalismanLevelCap(t, this.#ctx);
        this.#talismanLevelCapCache.set(t, result);
        return result;
    }

    universalTalismanMaxLevelIncreasers = (): number => universalTalismanMaxLevelIncreasers(this.#ctx)

    isTalismanUnlocked = (t: TalismanKeys): boolean => {
        this.#computeAllTalismanStats();
        return this.#talismanUnlockedCache.get(t) ?? false;
    }
}

const allTalismanRuneBonusStatsSum = (env: TalismanHelperContext): number => {
    const data = env.getGameData();
    if (!data) return 0;

    const taxmanTalismanRuneEffect = env.getSingularityChallengeEffect('taxmanLastStand', 'talismanRuneEffect');
    const talismanPowerAchievement = Number(env.getAchievementReward('talismanPower') ?? 0);
    const research5x6 = Number(data.researches[106] ?? 0) / 1000;
    const research5x7 = Number(data.researches[107] ?? 0) / 1000;
    const research5x18 = 2 * Number(data.researches[118] ?? 0) / 1000;
    const research8x25 = 0.004 * Math.floor(Number(data.researches[200] ?? 0) / 10000);
    const cube5x10 = 0.006 * Math.floor(Number(data.cubeUpgrades[50] ?? 0) / 10000);
    const challenge15TalismanBonus = (env.calculateChallenge15Reward('talismanBonus') ?? 0) - 1;
    const gqTalismanBonus1 = env.getGQUpgradeEffect('singTalismanBonusRunes1') ?? 0;
    const gqTalismanBonus2 = env.getGQUpgradeEffect('singTalismanBonusRunes2') ?? 0;
    const gqTalismanBonus3 = env.getGQUpgradeEffect('singTalismanBonusRunes3') ?? 0;
    const gqTalismanBonus4 = env.getGQUpgradeEffect('singTalismanBonusRunes4') ?? 0;
    const ambrosiaTalismanBonus = env.getAmbrosiaUpgradeEffects('ambrosiaTalismanBonusRuneLevel').talismanBonusRuneLevel ?? 0;
    const taxmanTalismanEffect = taxmanTalismanRuneEffect ?? 0;

    const total = (
        1
        + talismanPowerAchievement
        + research5x6
        + research5x7
        + research5x18
        + research8x25
        + cube5x10
        + challenge15TalismanBonus
        + gqTalismanBonus1
        + gqTalismanBonus2
        + gqTalismanBonus3
        + gqTalismanBonus4
        + ambrosiaTalismanBonus
        + taxmanTalismanEffect
    );

    if (!Number.isFinite(total) || Number.isNaN(total)) { HSLogger.errorOnce(`<red>Invalid talisman power sum</red>`, "GameDataAPI-Talisman"); return 0; }


    return total;
};

const getTalismanEffects = <K extends TalismanKeys>(
    t: K,
    rarity: number | undefined,
    env: TalismanHelperContext,
): TalismanTypeMap[K] => {
    if (rarity === undefined) rarity = getTalismanRarity(t, env);
    const rarityIndex = Math.max(0, Math.min(10, rarity));

    switch (t) {
        case 'exemption':
            return {
                taxReduction: TALISMAN_EXEMPTION_INSCRIPT_VALUES[rarityIndex] ?? 0,
                duplicationOOMBonus: rarityIndex >= 6 ? 12 : 0,
            } as TalismanTypeMap[K];
        case 'chronos':
            return {
                globalSpeed: TALISMAN_CHRONOS_INSCRIPT_VALUES[rarityIndex] ?? 1,
                speedOOMBonus: rarityIndex >= 6 ? 12 : 0,
            } as TalismanTypeMap[K];
        case 'midas':
            return {
                blessingBonus: TALISMAN_MIDAS_INSCRIPT_VALUES[rarityIndex] ?? 1,
                thriftOOMBonus: rarityIndex >= 6 ? 12 : 0,
            } as TalismanTypeMap[K];
        case 'metaphysics':
            return {
                talismanEffect: TALISMAN_METAPHYSICS_INSCRIPT_VALUES[rarityIndex] ?? 1,
                extraTalismanEffect: rarityIndex >= 6 ? 1.07 : 1,
            } as TalismanTypeMap[K];
        case 'polymath':
            return {
                ascensionSpeedBonus: TALISMAN_POLYMATH_INSCRIPT_VALUES[rarityIndex] ?? 1,
                SIOOMBonus: rarityIndex >= 6 ? 12 : 0,
            } as TalismanTypeMap[K];
        case 'mortuus':
            return {
                antBonus: TALISMAN_MORTUUS_INSCRIPT_VALUES[rarityIndex] ?? 1,
                prismOOMBonus: rarityIndex >= 6 ? 12 : 0,
            } as TalismanTypeMap[K];
        case 'plastic':
            return {
                quarkBonus: TALISMAN_PLASTIC_INSCRIPT_VALUES[rarityIndex] ?? 1,
            } as TalismanTypeMap[K];
        case 'wowSquare':
            return {
                evenDimBonus: TALISMAN_WOWSQUARE_INSCRIPT_VALUES[rarityIndex] ?? 1,
                oddDimBonus: rarityIndex >= 6 ? 1.20 : 1,
            } as TalismanTypeMap[K];
        case 'achievement':
            return {
                positiveSalvageMult: TALISMAN_ACHIEVEMENT_EFFECT_INSCRIPT_VALUES[rarityIndex] ?? 0,
                negativeSalvageMult: rarityIndex >= 6 ? -0.02 : 0,
            } as TalismanTypeMap[K];
        case 'cookieGrandma':
            return {
                freeCorruptionLevel: TALISMAN_COOKIEGRANDMA_INSCRIPT_VALUES[rarityIndex] ?? 0,
                cookieSix: rarityIndex >= 6,
            } as TalismanTypeMap[K];
        case 'horseShoe':
            return {
                luckPercentage: TALISMAN_HORSESHOE_INSCRIPT_VALUES[rarityIndex] ?? 0,
                redLuck: rarityIndex >= 6 ? 40 : 0,
            } as TalismanTypeMap[K];
        default:
            throw new Error(`Unknown talisman key: ${t}`);
    }
};

const getTalismanLevel = (t: TalismanKeys, env: TalismanHelperContext, loadingTalismans = true): number => {
    const data = env.getGameData();
    if (!data) return 0;

    const shards = data.talismans[t];
    const budget: Record<TalismanCostKey, Decimal> = {
        shard: parseGameDataDecimal(shards.shard),
        commonFragment: parseGameDataDecimal(shards.commonFragment),
        uncommonFragment: parseGameDataDecimal(shards.uncommonFragment),
        rareFragment: parseGameDataDecimal(shards.rareFragment),
        epicFragment: parseGameDataDecimal(shards.epicFragment),
        legendaryFragment: parseGameDataDecimal(shards.legendaryFragment),
        mythicalFragment: parseGameDataDecimal(shards.mythicalFragment),
    };

    let level = 0;
    const baseMult = getTalismanBaseMult(t);
    const costType = getTalismanCostType(t);
    const cap = getTalismanLevelCap(t, env);
    const smallBufferMult = loadingTalismans ? new Decimal(1.0001) : new Decimal(1);

    while (level < cap) {
        const costs = costType === 'regular'
            ? regularCostProgressionDecimal(baseMult, level)
            : exponentialCostProgressionDecimal(baseMult, level, getTalismanExponentialRatio(t));

        let canAfford = true;

        for (const item of talismanCostKeys) {
            const cost = costs[item];
            if (cost.gt(budget[item].times(smallBufferMult))) {
                canAfford = false;
                break;
            }
        }

        if (!canAfford) break;

        for (const item of talismanCostKeys) {
            budget[item] = budget[item].minus(costs[item]);
        }

        level++;
    }

    return level;
};

const getTalismanRarity = (t: TalismanKeys, env: TalismanHelperContext): number => {
    const level = getTalismanLevel(t, env);
    const unlocked = isTalismanUnlocked(t, env);
    if (!unlocked) return 0;

    const maxLevel = getTalismanMaxLevel(t);
    const levelRatio = level / maxLevel;

    let extraRarity = 0;
    if (levelRatio >= 1) {
        if (levelRatio >= 2) extraRarity += 1;
        if (levelRatio >= 4) extraRarity += 1;
        if (levelRatio >= 8) extraRarity += 1;
    }

    return 1 + Math.min(6, Math.floor(6 * levelRatio)) + extraRarity;
};


const getTalismanLevelCap = (t: TalismanKeys, env: TalismanHelperContext): number => {
    const baseMax = getTalismanMaxLevel(t);
    let increase = 0;

    if (t !== 'achievement') {
        increase += universalTalismanMaxLevelIncreasers(env);
    }

    switch (t) {
        case 'metaphysics':
            increase += (env.getGameData()?.cubeUpgrades[67] ?? 0) > 0 ? 1337 : 0;
            break;
        case 'mortuus':
            increase += env.getAntUpgradeEffectValue(AntUpgrades.Mortuus2, 'talismanLevelIncreaser');
            break;
        case 'plastic':
            increase += env.getPCoinUpgradeLevel('INSTANT_UNLOCK_1') ? 10 : 0;
            break;
        case 'achievement':
            increase += env.getLevelMilestone('achievementTalismanEnhancement');
            break;
        case 'cookieGrandma':
            increase += 54;
            break;
        case 'horseShoe':
            increase += 88;
            break;
    }

    return baseMax + increase;
};

const universalTalismanMaxLevelIncreasers = (env: TalismanHelperContext): number => {
    const data = env.getGameData();
    if (!data) return 0;

    const taxmanTalismanFreeLevel = env.getSingularityChallengeEffect('taxmanLastStand', 'talismanFreeLevel');
    return (
        6 * env.CalcECC('ascension', data.challengecompletions[13])
        + Math.floor((data.researches[200] ?? 0) / 400)
        + taxmanTalismanFreeLevel
        + (env.getOcteractUpgradeEffect('octeractTalismanLevelCap1') as number)
        + (env.getOcteractUpgradeEffect('octeractTalismanLevelCap2') as number)
        + (env.getOcteractUpgradeEffect('octeractTalismanLevelCap3') as number)
        + (env.getOcteractUpgradeEffect('octeractTalismanLevelCap4') as number)
    );
};

const isTalismanUnlocked = (t: TalismanKeys, env: TalismanHelperContext): boolean => {
    const data = env.getGameData();
    if (!data) return false;

    switch (t) {
        case 'exemption': {
            const exposedPlayer = HSGlobal.exposedPlayer ?? null;
            return exposedPlayer
                ? exposedPlayer.unlocks.talismans
                : data.unlocks.rrow1;
        }
        case 'chronos':
            return Boolean(env.getAchievementReward('chronosTalisman'));
        case 'midas':
            return Boolean(env.getAchievementReward('midasTalisman'));
        case 'metaphysics':
            return Boolean(env.getAchievementReward('metaphysicsTalisman'));
        case 'polymath':
            return Boolean(env.getAchievementReward('polymathTalisman'));
        case 'mortuus':
            return env.getAntUpgradeEffectValue(AntUpgrades.Mortuus, 'talismanUnlock');
        case 'plastic':
            return env.isShopTalismanUnlocked();
        case 'wowSquare': {
            const exposedPlayer = HSGlobal.exposedPlayer ?? null;
            return exposedPlayer
                ? exposedPlayer.ascensionCount >= 100
                : data.challengecompletions[11] >= 1;
        }
        case 'achievement':
            return env.getLevelMilestone('achievementTalismanUnlock') === 1;
        case 'cookieGrandma':
            return (data.cubeUpgrades[80] ?? 0) > 0;
        case 'horseShoe':
            return Boolean(env.getPurpleAmbrosiaUpgradeEffects('capricorn', 'horseshoeTalismanUnlocked'));
        default:
            return false;
    }
};
