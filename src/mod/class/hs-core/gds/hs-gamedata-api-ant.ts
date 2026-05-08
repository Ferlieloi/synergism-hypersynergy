import Decimal from "break_infinity.js";
import {
    AntUpgrades,
    CalculationCache,
} from "../../../types/data-types/hs-gamedata-api-types";
import type {
    AntUpgradeTypeMap,
    AntUpgradeHelperContext,
} from "../../../types/data-types/hs-gamedata-api-types";

export class AntUpgradeHelper {
    constructor(private readonly ctx: AntUpgradeHelperContext) {}

    public readonly R_antUpgradeData = buildAntUpgradeData(this.ctx);

    R_getAntUpgradeEffect = <K extends AntUpgrades>(antUpgrade: K): AntUpgradeTypeMap[K] => {
        const actualLevel = this.R_calculateTrueAntLevel(antUpgrade);
        return this.R_antUpgradeData[antUpgrade].effect(actualLevel) as AntUpgradeTypeMap[K];
    }

    R_computeFreeAntUpgradeLevels = (): number => {
        return computeFreeAntUpgradeLevels(this.ctx);
    }

    R_calculateTrueAntLevel = (antUpgrade: AntUpgrades): number => {
        const data = this.ctx.getGameData();
        if (!data) return 0;

        const upgradeData = this.R_antUpgradeData[antUpgrade];
        const freeLevels = computeFreeAntUpgradeLevels(this.ctx);
        const corruptionDivisor = upgradeData.exemptFromCorruption
            ? 1
            : this.ctx.R_calculateCorruptionEffect(data.corruptions.used, 'extinction');

        if (data.currentChallenge.ascension === 11) {
            return Math.min(data.ants.upgrades[antUpgrade], freeLevels) / corruptionDivisor;
        }

        return (data.ants.upgrades[antUpgrade] + Math.min(data.ants.upgrades[antUpgrade], freeLevels)) / corruptionDivisor;
    }
}

export const getAntUpgradeEffect = <K extends AntUpgrades>(
    antUpgrade: K,
    env: AntUpgradeHelperContext,
): AntUpgradeTypeMap[K] => {
    const actualLevel = calculateTrueAntLevel(antUpgrade, env);
    return buildAntUpgradeData(env)[antUpgrade].effect(actualLevel) as AntUpgradeTypeMap[K];
};

export const computeFreeAntUpgradeLevels = (env: AntUpgradeHelperContext): number => {
    const data = env.getGameData();
    if (!data) return 0;

    const cacheName = 'R_FreeAntUpgradeLevels' as keyof CalculationCache;
    const calculationVars = [
        data.challengecompletions[9],
        data.constantUpgrades[6] ?? 0,
        data.challengecompletions[11],
        data.researches[97] ?? 0,
        data.researches[98] ?? 0,
        data.researches[102] ?? 0,
        data.researches[132] ?? 0,
        data.researches[200] ?? 0,
        Number(env.R_getAchievementReward('freeAntUpgrades') ?? 0),
        data.challenge15Exponent ?? 0,
        data.currentChallenge.ascension,
        data.challengecompletions[8],
    ];

    const cached = env.checkCalculationCache(cacheName, calculationVars);
    if (cached !== undefined) return cached;

    let bonusLevels = 0;
    bonusLevels += env.R_CalcECC('reincarnation', data.challengecompletions[9]);
    bonusLevels += Math.round(2000 * (1 - Math.pow(0.999, data.constantUpgrades[6] ?? 0)));
    bonusLevels += 12 * env.R_CalcECC('ascension', data.challengecompletions[11]);
    bonusLevels += 2 * data.researches[97];
    bonusLevels += 2 * data.researches[98];
    bonusLevels += data.researches[102];
    bonusLevels += 2 * data.researches[132];
    bonusLevels += Math.floor((1 / 200) * data.researches[200]);
    bonusLevels += Number(env.R_getAchievementReward('freeAntUpgrades') ?? 0);
    bonusLevels *= env.R_calculateChallenge15Reward('bonusAntLevel');

    if (data.currentChallenge.ascension === 11) {
        bonusLevels += Math.floor(
            3 * data.challengecompletions[8]
            + 5 * data.challengecompletions[9]
        );
        env.updateCalculationCache(cacheName, { value: bonusLevels, cachedBy: calculationVars });
        return bonusLevels;
    }

    env.updateCalculationCache(cacheName, { value: bonusLevels, cachedBy: calculationVars });
    return bonusLevels;
};

export const calculateTrueAntLevel = (antUpgrade: AntUpgrades, env: AntUpgradeHelperContext): number => {
    const data = env.getGameData();
    if (!data) return 0;

    const cacheName = 'R_CalculateTrueAntLevel' as keyof CalculationCache;
    const freeLevels = computeFreeAntUpgradeLevels(env);
    const isExempt = buildAntUpgradeData(env)[antUpgrade].exemptFromCorruption ? 1 : 0;
    const corruptionDivisor = isExempt
        ? 1
        : env.R_calculateCorruptionEffect(data.corruptions.used, 'extinction');

    const calculationVars = [
        Number(antUpgrade),
        data.ants.upgrades[antUpgrade],
        freeLevels,
        data.currentChallenge.ascension,
        data.corruptions.used.levels.extinction,
        isExempt,
    ];

    const cached = env.checkCalculationCache(cacheName, calculationVars);
    if (cached !== undefined) return cached;

    const result = data.currentChallenge.ascension === 11
        ? Math.min(data.ants.upgrades[antUpgrade], freeLevels) / corruptionDivisor
        : (data.ants.upgrades[antUpgrade] + Math.min(data.ants.upgrades[antUpgrade], freeLevels)) / corruptionDivisor;

    env.updateCalculationCache(cacheName, { value: result, cachedBy: calculationVars });
    return result;
};

const buildAntUpgradeData = (env: AntUpgradeHelperContext) => ({
    [AntUpgrades.AntSpeed]: {
        exemptFromCorruption: false,
        effect: (n: number) => {
            const data = env.getGameData();
            let baseMul = 1.1;
            baseMul += (data?.researches[101] ?? 0) / 1000;
            baseMul += (data?.researches[162] ?? 0) / 1000;
            return {
                antSpeed: Decimal.pow(baseMul, n),
            };
        },
    },
    [AntUpgrades.Coins]: {
        exemptFromCorruption: false,
        effect: (n: number) => {
            const data = env.getGameData();
            let divisor = 1;
            if (data?.currentChallenge.ascension === 15) {
                divisor = 100 + 9900 * (1000 + n) / (1000 + n ** 2);
            }
            const baseExponent = 999999 + env.R_calculateSigmoidExponential(49000001, n / 3000);
            const bonusExponent = 250 * n;
            const exponent = (baseExponent + bonusExponent) / divisor;
            const coinMult = Decimal.max(1, Decimal.pow(data?.ants.crumbs ?? 0, exponent));
            return {
                crumbToCoinExp: exponent,
                coinMultiplier: coinMult,
            };
        },
    },
    [AntUpgrades.Taxes]: {
        exemptFromCorruption: false,
        effect: (n: number) => ({
            taxReduction: 0.005 + 0.995 * Math.pow(0.99, n),
        }),
    },
    [AntUpgrades.AcceleratorBoosts]: {
        exemptFromCorruption: false,
        effect: (n: number) => ({
            acceleratorBoostMult: env.R_calculateSigmoidExponential(20, n / 1000),
        }),
    },
    [AntUpgrades.Multipliers]: {
        exemptFromCorruption: false,
        effect: (n: number) => ({
            multiplierMult: env.R_calculateSigmoidExponential(40, n / 1000),
        }),
    },
    [AntUpgrades.Offerings]: {
        exemptFromCorruption: false,
        effect: (n: number) => ({
            offeringMult: Math.pow(1 + n / 10, 0.5),
        }),
    },
    [AntUpgrades.BuildingCostScale]: {
        exemptFromCorruption: false,
        effect: (n: number) => {
            const scalePercent = 3 * n;
            const buildingPowerMult = 1 + n / 100;
            return {
                buildingCostScale: scalePercent / 100,
                buildingPowerMult,
            };
        },
    },
    [AntUpgrades.Salvage]: {
        exemptFromCorruption: false,
        effect: (n: number) => ({
            salvage: 120 * (1 - Math.pow(0.995, n)),
        }),
    },
    [AntUpgrades.FreeRunes]: {
        exemptFromCorruption: false,
        effect: (n: number) => ({
            freeRuneLevel: 3000 * (1 - Math.pow(1 - 1 / 3000, n)),
        }),
    },
    [AntUpgrades.Obtainium]: {
        exemptFromCorruption: false,
        effect: (n: number) => ({
            obtainiumMult: Math.pow(1 + n / 10, 0.5),
        }),
    },
    [AntUpgrades.AntSacrifice]: {
        exemptFromCorruption: false,
        effect: (n: number) => ({
            antSacrificeMultiplier: Math.pow(1 + n / 10, 0.5),
            elo: Math.round(5 * Math.min(200, n)),
        }),
    },
    [AntUpgrades.Mortuus]: {
        exemptFromCorruption: true,
        effect: (n: number) => ({
            talismanUnlock: n > 0,
            globalSpeed: 2 - Math.pow(0.99, n),
        }),
    },
    [AntUpgrades.AntELO]: {
        exemptFromCorruption: false,
        effect: (n: number) => {
            const data = env.getGameData();
            const antSacrificeLimitCount = n + 200 * Math.min(1, n);
            const upgradeImprover = Math.min(n, Number(env.R_getAchievementReward('antSpeed2UpgradeImprover') ?? 0));
            const effectiveSacs = Math.min(
                antSacrificeLimitCount + upgradeImprover,
                data?.ants.antSacrificeCount ?? 0 + upgradeImprover,
            );
            const antELO = effectiveSacs;
            return {
                antELO,
                antSacrificeLimitCount,
            };
        },
    },
    [AntUpgrades.Mortuus2]: {
        exemptFromCorruption: true,
        effect: (n: number) => ({
            talismanLevelIncreaser: Math.min(1200, Math.floor(n / 2)),
            talismanEffectBuff: 1 + 0.65 * (1 - Math.pow(0.999, n)) + 0.005 * Math.min(20, n),
            ascensionSpeed: 1 + 0.5 * (1 - Math.pow(0.996, n)),
        }),
    },
    [AntUpgrades.AscensionScore]: {
        exemptFromCorruption: true,
        effect: (n: number) => ({
            ascensionScoreBase: 100000 * (1 - Math.pow(0.999, n)),
            cubesBanked: 3 * Math.min(200, n) + 2500 * (1 - Math.pow(1 - 1 / 2750, n)) + 96900 * (1 - Math.pow(1 - 1 / 969000, n)),
        }),
    },
    [AntUpgrades.WowCubes]: {
        exemptFromCorruption: true,
        effect: (n: number) => ({
            wowCubes: 2 - Math.pow(0.999, n),
        }),
    },
});
