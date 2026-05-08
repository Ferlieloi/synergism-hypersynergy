import Decimal from "break_infinity.js";
import { HSGlobal } from "../hs-global";
import {
    AntUpgrades,
    CachedValue,
    CalculationCache,
    RuneKeys,
    SynergismLevelMilestones,
    TalismanKeys,
    TalismanTypeMap,
    TalismanHelperContext,
} from "../../../types/data-types/hs-gamedata-api-types";
import {
    TALISMAN_ACHIEVEMENT_DESC_INSCRIPT_VALUES,
    TALISMAN_ACHIEVEMENT_EFFECT_INSCRIPT_VALUES,
    TALISMAN_CHRONOS_INSCRIPT_VALUES,
    TALISMAN_COOKIEGRANDMA_INSCRIPT_VALUES,
    TALISMAN_EXEMPTION_INSCRIPT_VALUES,
    TALISMAN_METAPHYSICS_INSCRIPT_VALUES,
    TALISMAN_MIDAS_INSCRIPT_VALUES,
    TALISMAN_MORTUUS_INSCRIPT_VALUES,
    TALISMAN_PLASTIC_INSCRIPT_VALUES,
    TALISMAN_POLYMATH_INSCRIPT_VALUES,
    TALISMAN_WOWSQUARE_INSCRIPT_VALUES,
    TALISMAN_HORSESHOE_INSCRIPT_VALUES,
} from "../../../types/data-types/hs-gamedata-api-types";
import {
    TALISMAN_BASE_COEFFICIENTS,
    TALISMAN_RARITY_VALUES,
    getTalismanBaseMult,
    getTalismanCostType,
    getTalismanExponentialRatio,
    getTalismanMaxLevel,
    talismanCostKeys,
    TalismanCostKey,
    regularCostProgressionDecimal,
    exponentialCostProgressionDecimal,
} from "./stored-vars-and-calculations";
import { HSLogger } from "../hs-logger";

export class TalismanHelper {
    constructor(private readonly ctx: TalismanHelperContext) {}

    R_allTalismanRuneBonusStatsSum = () => R_allTalismanRuneBonusStatsSum(this.ctx)
    R_getTalismanEffects = <K extends TalismanKeys>(t: K, rarity?: number): TalismanTypeMap[K] => R_getTalismanEffects(t, rarity, this.ctx)
    getTalismanLevel = (t: TalismanKeys): number => getTalismanLevel(t, this.ctx)
    getTalismanRarity = (t: TalismanKeys): number => getTalismanRarity(t, this.ctx)
    calculateTalismanRarityTotal = (): number => calculateTalismanRarityTotal(this.ctx)
    R_getRuneBonusFromIndividualTalisman = (t: TalismanKeys, rune: RuneKeys): number => R_getRuneBonusFromIndividualTalisman(t, rune, this.ctx)
    R_getRuneBonusFromAllTalismans = (rune: RuneKeys): number => R_getRuneBonusFromAllTalismans(rune, this.ctx)
    R_getTalismanLevelCap = (t: TalismanKeys): number => R_getTalismanLevelCap(t, this.ctx)
    R_universalTalismanMaxLevelIncreasers = (): number => R_universalTalismanMaxLevelIncreasers(this.ctx)
    isTalismanUnlocked = (t: TalismanKeys): boolean => isTalismanUnlocked(t, this.ctx)
}

export const R_allTalismanRuneBonusStatsSum = (env: TalismanHelperContext): number => {
    const data = env.getGameData();
    if (!data) return 0;

    const taxmanTalismanRuneEffect = env.getSingularityChallengeEffect('taxmanLastStand', 'talismanRuneEffect');
    const talismanPowerAchievement = Number(env.R_getAchievementReward('talismanPower') ?? 0);
    const research5x6 = Number(data.researches[106] ?? 0) / 1000;
    const research5x7 = Number(data.researches[107] ?? 0) / 1000;
    const research5x18 = 2 * Number(data.researches[118] ?? 0) / 1000;
    const research8x25 = 0.004 * Math.floor(Number(data.researches[200] ?? 0) / 10000);
    const cube5x10 = 0.006 * Math.floor(Number(data.cubeUpgrades[50] ?? 0) / 10000);
    const challenge15TalismanBonus = (env.R_calculateChallenge15Reward('talismanBonus') ?? 0) - 1;
    const gqTalismanBonus1 = env.R_getGQUpgradeEffect('singTalismanBonusRunes1') ?? 0;
    const gqTalismanBonus2 = env.R_getGQUpgradeEffect('singTalismanBonusRunes2') ?? 0;
    const gqTalismanBonus3 = env.R_getGQUpgradeEffect('singTalismanBonusRunes3') ?? 0;
    const gqTalismanBonus4 = env.R_getGQUpgradeEffect('singTalismanBonusRunes4') ?? 0;
    const ambrosiaTalismanBonus = env.R_getAmbrosiaUpgradeEffects('ambrosiaTalismanBonusRuneLevel').talismanBonusRuneLevel ?? 0;
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

export const R_getTalismanEffects = <K extends TalismanKeys>(
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

export const getTalismanLevel = (t: TalismanKeys, env: TalismanHelperContext, loadingTalismans = true): number => {
    const data = env.getGameData();
    if (!data) return 0;

    const shards = data.talismans[t];
    const budget: Record<TalismanCostKey, Decimal> = {
        shard: new Decimal(shards.shard),
        commonFragment: new Decimal(shards.commonFragment),
        uncommonFragment: new Decimal(shards.uncommonFragment),
        rareFragment: new Decimal(shards.rareFragment),
        epicFragment: new Decimal(shards.epicFragment),
        legendaryFragment: new Decimal(shards.legendaryFragment),
        mythicalFragment: new Decimal(shards.mythicalFragment),
    };

    let level = 0;
    const baseMult = getTalismanBaseMult(t);
    const costType = getTalismanCostType(t);
    const cap = R_getTalismanLevelCap(t, env);
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

export const getTalismanRarity = (t: TalismanKeys, env: TalismanHelperContext): number => {
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

const getTalismanRarityCalculationVars = (env: TalismanHelperContext): number[] => {
    const data = env.getGameData();
    if (!data) return [0];

    const talismanBudgets = (Object.values(data.talismans) as Array<{
        shard: Decimal;
        commonFragment: Decimal;
        uncommonFragment: Decimal;
        rareFragment: Decimal;
        epicFragment: Decimal;
        legendaryFragment: Decimal;
        mythicalFragment: Decimal;
    }>).flatMap((shards) => [
        shards.shard.toNumber(),
        shards.commonFragment.toNumber(),
        shards.uncommonFragment.toNumber(),
        shards.rareFragment.toNumber(),
        shards.epicFragment.toNumber(),
        shards.legendaryFragment.toNumber(),
        shards.mythicalFragment.toNumber(),
    ]);

    const antUpgradeLevels = Object.values(data.ants.upgrades).map((level) => Number(level ?? 0));
    const achievementValues = Object.values(data.achievements).map(Number);
    const progressiveAchievementValues = Object.values(data.progressiveAchievements).map(Number);
    const singularityChallengeStatus = Object.values(data.singularityChallenges).flatMap((challenge) => [
        challenge.completions,
        Number(challenge.enabled),
        challenge.highestSingularityCompleted,
    ]);

    return [
        ...talismanBudgets,
        ...antUpgradeLevels,
        ...achievementValues,
        ...progressiveAchievementValues,
        data.unlocks.rrow1 ? 1 : 0,
        data.shopUpgrades.shopTalisman ?? 0,
        data.challengecompletions[11] ?? 0,
        data.challengecompletions[13] ?? 0,
        data.researches[200] ?? 0,
        data.cubeUpgrades[67] ?? 0,
        data.cubeUpgrades[80] ?? 0,
        data.octUpgrades.octeractTalismanLevelCap1.level ?? 0,
        data.octUpgrades.octeractTalismanLevelCap2.level ?? 0,
        data.octUpgrades.octeractTalismanLevelCap3.level ?? 0,
        data.octUpgrades.octeractTalismanLevelCap4.level ?? 0,
        ...singularityChallengeStatus,
        Number(HSGlobal.exposedPlayer?.unlocks.talismans ?? 0),
        HSGlobal.exposedPlayer?.ascensionCount ?? 0,
    ];
};

export const calculateTalismanRarityTotal = (env: TalismanHelperContext): number => {
    const data = env.getGameData();
    if (!data) return 0;

    const cacheName = 'R_TalismanRarityTotal' as keyof CalculationCache;
    const calculationVars = getTalismanRarityCalculationVars(env);
    const cached = env.checkCalculationCache(cacheName, calculationVars);
    if (cached !== undefined) return cached;

    const total = (Object.keys(data.talismans) as TalismanKeys[])
        .map((key) => getTalismanRarity(key, env))
        .reduce((sum, rarity) => sum + rarity, 0);

    env.updateCalculationCache(cacheName, { value: total, cachedBy: calculationVars });
    return total;
};

export const R_getRuneBonusFromIndividualTalisman = (t: TalismanKeys, rune: RuneKeys, env: TalismanHelperContext): number => {
    const level = getTalismanLevel(t, env);
    const rarity = getTalismanRarity(t, env);
    if (rarity === 0) return 0;

    let bonusMult = 1;
    if (t === 'metaphysics') {
        const effects = R_getTalismanEffects('metaphysics', rarity, env);
        bonusMult *= effects.talismanEffect;
        bonusMult *= effects.extraTalismanEffect;
    }
    if (t === 'mortuus') {
        bonusMult *= env.R_getAntUpgradeEffect(AntUpgrades.Mortuus2).talismanEffectBuff;
    }

    const coef = TALISMAN_BASE_COEFFICIENTS[t][rune];
    return coef * bonusMult * level * (TALISMAN_RARITY_VALUES[rarity] ?? 0);
};

export const R_getRuneBonusFromAllTalismans = (rune: RuneKeys, env: TalismanHelperContext): number => {
    const specialMultiplier = R_allTalismanRuneBonusStatsSum(env);
    const keys = Object.keys(TALISMAN_BASE_COEFFICIENTS) as TalismanKeys[];
    const totalBonus = keys.reduce(
        (acc, t) => acc + R_getRuneBonusFromIndividualTalisman(t, rune, env),
        0,
    );

    return totalBonus * specialMultiplier;
};

export const R_getTalismanLevelCap = (t: TalismanKeys, env: TalismanHelperContext): number => {
    const baseMax = getTalismanMaxLevel(t);
    let increase = 0;

    if (t !== 'achievement') {
        increase += R_universalTalismanMaxLevelIncreasers(env);
    }

    switch (t) {
        case 'metaphysics':
            increase += (env.getGameData()?.cubeUpgrades[67] ?? 0) > 0 ? 1337 : 0;
            break;
        case 'mortuus':
            increase += env.R_getAntUpgradeEffect(AntUpgrades.Mortuus2).talismanLevelIncreaser;
            break;
        case 'plastic':
            increase += env.getPCoinUpgradeLevel('INSTANT_UNLOCK_1') ? 10 : 0;
            break;
        case 'achievement':
            increase += env.R_getLevelMilestone('achievementTalismanEnhancement');
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

export const R_universalTalismanMaxLevelIncreasers = (env: TalismanHelperContext): number => {
    const data = env.getGameData();
    if (!data) return 0;

    const taxmanTalismanFreeLevel = env.getSingularityChallengeEffect('taxmanLastStand', 'talismanFreeLevel');
    return (
        6 * env.R_CalcECC('ascension', data.challengecompletions[13])
        + Math.floor((data.researches[200] ?? 0) / 400)
        + taxmanTalismanFreeLevel
        + (env.R_getOcteractUpgradeEffect('octeractTalismanLevelCap1') as number)
        + (env.R_getOcteractUpgradeEffect('octeractTalismanLevelCap2') as number)
        + (env.R_getOcteractUpgradeEffect('octeractTalismanLevelCap3') as number)
        + (env.R_getOcteractUpgradeEffect('octeractTalismanLevelCap4') as number)
    );
};

export const isTalismanUnlocked = (t: TalismanKeys, env: TalismanHelperContext): boolean => {
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
            return Boolean(env.R_getAchievementReward('chronosTalisman'));
        case 'midas':
            return Boolean(env.R_getAchievementReward('midasTalisman'));
        case 'metaphysics':
            return Boolean(env.R_getAchievementReward('metaphysicsTalisman'));
        case 'polymath':
            return Boolean(env.R_getAchievementReward('polymathTalisman'));
        case 'mortuus':
            return env.R_getAntUpgradeEffect(AntUpgrades.Mortuus).talismanUnlock;
        case 'plastic':
            return env.isShopTalismanUnlocked();
        case 'wowSquare': {
            const exposedPlayer = HSGlobal.exposedPlayer ?? null;
            return exposedPlayer
                ? exposedPlayer.ascensionCount >= 100
                : data.challengecompletions[11] >= 1;
        }
        case 'achievement':
            return env.R_getLevelMilestone('achievementTalismanUnlock') === 1;
        case 'cookieGrandma':
            return (data.cubeUpgrades[80] ?? 0) > 0;
        case 'horseShoe':
            return Boolean(env.getSingularityChallengeEffect('taxmanLastStand', 'talismanUnlock'));
        default:
            return false;
    }
};
