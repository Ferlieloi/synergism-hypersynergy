import type { HSGameDataAPI } from '../../hs-core/gds/hs-gamedata-api';
import { parseGameDataDecimal, getBlessingEXP, getSpiritEXP, getRuneEXP } from '../../hs-core/gds/hs-gamedata-utils';
import { AntUpgrades } from '../../../types/data-types/hs-gamedata-api-types';
import { AchievementId } from '../../hs-core/gds/hs-gamedata-api-achievement';
import { heaterCoinRunePurchasedLevel } from '../hs-heater/hs-heater-coins';
import type { GameData } from '../../../types/data-types/hs-player-savedata';
import type { CorruptionProductionRun } from './hs-corruption-prediction';
import type { CorruptionGrowth } from './hs-corruption-growth';
// Buy.ts / Variables.ts. Currencies below are log10 amounts, not JS currency values.
const COSTS = [[100, 1000, 2e4, 4e5, 8e6], [100, 1e5, 1e15, 1e40, 1e100], [1, 100, 1e4, 1e8, 1e16], [1, 100, 1e4, 1e8, 1e16]];
const GROWTH = [[1, 2, 3, 4, 5], [1, 3, 6, 10, 15], [1, 3, 6, 10, 15], [1, 1, 1, 1, 1]];
const BASE_PRODUCTION = [[0.25, 2.5, 25, 250, 2500], [0.05, 0.0005, 0.00005, 0.000005, 0.000005], [1, 0.01, 0.001, 0.0002, 0.00004], [0.25, 0.2, 0.15, 0.1, 0.5]];
const CRYSTAL_UPGRADE_COSTS = [6, 15, 20, 40, 100];
const CRYSTAL_UPGRADE_COST_INCREASES = [8, 15, 20, 40, 100];
const CONVERSION_ACHIEVEMENTS = [AchievementId.GenerationAch1, AchievementId.GenerationAch2,
    AchievementId.GenerationAch3, AchievementId.GenerationAch4, AchievementId.Chal1NoGen,
    AchievementId.Chal2NoGen, AchievementId.Chal3NoGen];
const UPGRADE_COSTS = [0, 6, 7, 8, 10, 12, 20, 35, 50, 75, 100, 55, 75, 125, 150, 200, 250, 500, 750, 1000, 1500,
    5, 15, 25, 40, 60, 45, 75, 100, 125, 150, 150, 400, 800, 1600, 3200, 10000, 20000, 50000, 100000, 200000,
    1, 2, 3, 5, 6, 7, 42, 65, 87, 150, 300, 500, 1000, 1500, 2000, 3000, 6000, 12000, 25000, 75000,
    0, 1, 2, 2, 3, 5, 6, 10, 15, 22, 30, 37, 45, 52, 60, 1900, 2500, 3000, 10000, 21397,
    3, 6, 9, 12, 15, 60, 90, 7, 8, 8, 10, 13, 60, 1, 2, 4, 8, 16, 25, 40,
    12, 16, 20, 30, 50, 500, 1250, 5000, 25000, 125000, 1500, 7500, 30000, 150000, 1000000, 250, 1000, 5000, 25000, 125000,
    1e3, 1e6, 1e9, 1e12, 1e15];
const log = (n: number) => n > 0 ? Math.log10(n) : -Infinity;
const log1p = (n: number) => n > 15 ? n : Math.log10(1 + 10 ** n);
export function addProductionLogs(a: number, b: number): number {
    const high = Math.max(a, b);
    return high === -Infinity ? high : high + Math.log10(1 + 10 ** (Math.min(a, b) - high));
}
export const subtractLogs = (a: number, b: number) => a <= b ? -Infinity : a + Math.log10(-Math.expm1((b - a) * Math.LN10));
const sum = (a: readonly number[]) => a.reduce((x, y) => x + y, 0);
const sumLogs = (a: readonly number[]) => a.reduce(addProductionLogs, -Infinity);
export function effectiveFreeProduction(raw: number, hepteract: number, multiplier: number, viscosity: number): number {
    return Math.min(1e100, Math.floor(Math.min(1e300, (raw + hepteract) * multiplier)) / viscosity);
}
/** Inverse of Buy.ts's cumulative quadratic producer curve (also at very large exponents). */
export function affordableProductionBuildings(budget: number, cost: number, growth: number, threshold: number): number {
    if (budget < log(cost))
        return 0;
    const scale = cost / (growth - 1);
    const exponent = log1p(budget + Math.log10(1 + 1e-9) - log(scale)) / log(growth);
    // Avoid squaring the budget exponent, which can be much larger than 1e154.
    return Math.max(0, Math.floor(exponent <= threshold ? exponent
        : threshold / 2 + Math.sqrt(threshold) * Math.sqrt(Math.max(0, exponent - 0.75 * threshold))));
}
function cumulativeCost(count: number, cost: number, growth: number, threshold: number): number {
    if (!count)
        return -Infinity;
    const exponent = count <= threshold ? count : count + (count - threshold) * ((count - threshold) / threshold);
    const power = log(growth) * exponent;
    return log(cost / (growth - 1)) + (power > 15 ? power : log(Math.expm1(power * Math.LN10)));
}
/** Buy.ts accelerator/multiplier curve: quadratic, cubic, then eighth-power softcap. */
export function acceleratorCostCurve(cost: number, growth: number, threshold: number, cubicThreshold: number, delay: number) {
    const cap = Math.max(1e15, threshold);
    const exponent = (n: number) => n + Math.max(0, n - threshold) ** 2 / threshold
        + Math.max(0, n - cubicThreshold) ** 3 / (3 * delay);
    const slope = (n: number) => (n < threshold ? 1 : 1 + 2 * (n - threshold) / threshold) + Math.max(0, n - cubicThreshold) ** 2 / delay;
    const capExponent = exponent(cap), capSlope = slope(cap);
    const scaleLog = log(cost / (growth - 1));
    return {
        cost(n: number) {
            if (!n)
                return -Infinity;
            const e = n <= cap ? exponent(n) : capExponent + capSlope * cap / 8 * ((n / cap) ** 8 - 1);
            const p = e * log(growth);
            return scaleLog + (p > 15 ? p : log(Math.expm1(p * Math.LN10)));
        },
        affordable(budget: number) {
            if (budget < log(cost))
                return 0;
            const e = log1p(budget + log(1 + 1e-9) - scaleLog) / log(growth);
            if (e > capExponent)
                return Math.floor(cap * (1 + 8 * (e - capExponent) / (capSlope * cap)) ** (1 / 8));
            let n = e <= threshold ? e : threshold / 2 + Math.sqrt(threshold) * Math.sqrt(e - 0.75 * threshold);
            if (n > cubicThreshold)
                n = Math.min(n, cubicThreshold + Math.cbrt(3 * delay * Math.max(0, e - exponent(cubicThreshold))));
            for (let i = 0; i < 20; i++) {
                const step = (exponent(n) - e) / slope(n);
                if (Math.abs(step) <= Math.max(1, n) * 1e-13)
                    break;
                n -= step;
            }
            return Math.max(0, Math.floor(n));
        },
    };
}
export function acceleratorBoostCostCurve(delay: number) {
    const threshold = 1000 * delay, cap = 1e15;
    const exponent = (n: number) => 9.5 * n + n * n / 2 + Math.max(0, n - threshold) ** 3 / (3 * delay);
    const slope = (n: number) => 9.5 + n + Math.max(0, n - threshold) ** 2 / delay;
    const capExponent = exponent(cap), capSlope = slope(cap);
    const first = exponent(1);
    const scaleLog = 3 - (first > 15 ? first : log(Math.expm1(first * Math.LN10)));
    return {
        cost(n: number) {
            if (!n)
                return -Infinity;
            const e = n <= cap ? exponent(n) : capExponent + capSlope * cap / 8 * ((n / cap) ** 8 - 1);
            return scaleLog + (e > 15 ? e : log(Math.expm1(e * Math.LN10)));
        },
        affordable(budget: number) {
            if (budget < 3)
                return 0;
            const e = log1p(budget + log(1 + 1e-9) - scaleLog);
            if (e > capExponent)
                return Math.floor(cap * (1 + 8 * (e - capExponent) / (capSlope * cap)) ** (1 / 8));
            let n = Math.sqrt(9.5 ** 2 + 2 * e) - 9.5;
            if (n > threshold)
                n = Math.min(n, threshold + Math.cbrt(3 * delay * Math.max(0, e - exponent(threshold))));
            for (let i = 0; i < 20; i++) {
                const step = (exponent(n) - e) / slope(n);
                if (Math.abs(step) <= Math.max(1, n) * 1e-13)
                    break;
                n -= step;
            }
            return Math.max(0, Math.floor(n));
        },
    };
}
/** Tax.ts: actual gross output is taxed, and then bounded by the tax ceiling. */
export function taxedProductionLog10(gross: number, flat: number, tax: number): number {
    if (gross === -Infinity)
        return gross;
    const base = Math.log10(1.01);
    const vertex = 275 / (base * tax);
    const n = Math.floor(vertex) - 1;
    const excess = Math.max(0, Math.min(n + flat, Math.floor(log1p(gross))) - flat);
    const rounding = n - vertex;
    const ceiling = 137.5 / (base * tax) - base * tax * rounding ** 2 / 550 + flat;
    return Math.min(ceiling, gross - (base * tax * excess) * (excess / 550));
}
export interface CorruptionProductionStats {
    construction: number;
    coinExponent: number;
    antCoinsLog: number;
    buildingPowerResearch: number;
    buildingPowerExponent: number;
    speedRunePower: number;
    duplicationBoosts: number;
    freeAcceleratorMultiplier: number;
    freeMultiplierMultiplier: number;
    prismProductionLog: number;
    achievementPoints: number;
    hepteractAccelerators: number;
    hepteractMultipliers: number;
    acceleratorFinalMultiplier: number;
    multiplierFinalMultiplier: number;
    freeBoostMultiplier: number;
    totalRuneLevels: number;
    acceleratorsPerBoost: number;
    duplicationBlessing: number;
    prismCostReduction: number;
    prismSpiritCap: number;
    commonFragmentsLog4: number;
    multiplierCubeBlessing: number;
    thriftBlessingDelay: number;
}
/** Constants from the current progression, recomputed per challenge (C9 suppresses runes). */
export function corruptionProductionStats(api: HSGameDataAPI, data: GameData): CorruptionProductionStats {
    const r = (i: number) => data.researches[i] ?? 0;
    const late = (indices: number[]) => indices.reduce((v, i, j) => v * (1 + (1 - j * 0.2) * r(i) / 100), 1) * (1 + r(200) / 10000);
    const challengeResearch = (i: number) => 1 + r(i) / 5 * (1 + data.challengecompletions[14] / 2);
    const blessingOther = (1 + 6.9 * r(134) / 100) * api.talisman.getTalismanEffects('midas').blessingBonus
        * (1 + 0.1 * parseGameDataDecimal(data.epicFragments).plus(1).log10() * r(174))
        * (1 + 2 * r(194) / 100) * (1 + 0.25 * r(160)) * api.calculateChallenge15Reward('blessingBonus');
    const runeTotal = (key: 'duplication' | 'prism' | 'thrift') => api.rune.getRuneLevelFromEXP(key, getRuneEXP(data, key)) + api.rune.getRuneFreeLevels(key);
    const spiritOther = (1 + 8 * r(164) / 100) * (1 + 0.15 * parseGameDataDecimal(data.legendaryFragments).plus(1).log10() * r(189))
        * (1 + 2 * r(194) / 100) * api.calculateChallenge15Reward('spiritBonus');
    const bless = (count: number, per: number, dr: number) => 1 + per * (count < 1000 ? count : 1000 ** (1 - dr) * count ** dr);
    const cubeBless = (key: 'accelerator' | 'multiplier', divisor: number, upgrade: number, base: number) => {
        const hyper = bless(data.hypercubeBlessings[key] ?? 0, api.calculateHypercubeBlessingMultiplierPlatonicBlessing() / 1000, 1 / 12);
        const tesseract = bless(data.tesseractBlessings[key] ?? 0, hyper / 1000, 1 / 6);
        const count = data.cubeBlessings[key] ?? 0, extra = (data.cubeUpgrades[upgrade] ?? 0) / 300;
        return count < 1000 ? (base + tesseract / divisor * count) ** (1 + extra)
            : base + tesseract / divisor * 1000 ** (2 / 3 + extra) * count ** (1 / 3 + extra);
    };
    const stats: CorruptionProductionStats = {
        construction: api.building.calculateConstruction(),
        coinExponent: (1 + r(17) * 0.001) * api.calculateChallenge15Reward('coinExponent'),
        antCoinsLog: parseGameDataDecimal(api.antUpgrade.getAntUpgradeEffectValue(AntUpgrades.Coins, 'coinMultiplier')).log10(),
        buildingPowerResearch: (1 + r(36) / 20) * (1 + r(37) / 40) * (1 + r(38) / 40)
            * api.antUpgrade.getAntUpgradeEffectValue(AntUpgrades.BuildingCostScale, 'buildingPowerMult'),
        buildingPowerExponent: (1 + 0.09 * (data.cubeUpgrades[12] ?? 0)) * (1 + 0.05 * (data.cubeUpgrades[36] ?? 0)),
        speedRunePower: api.rune.getRuneEffects('speed').acceleratorPower,
        duplicationBoosts: api.rune.getRuneEffects('duplication').multiplierBoosts,
        freeAcceleratorMultiplier: api.rune.getRuneEffects('speed').multiplicativeAccelerators
            * challengeResearch(1) * (1 + r(6) / 20 + r(7) / 25 + r(8) / 40 + 0.015 * r(9) + r(10) / 200)
            * (1 + r(86) / 20) * late([126, 141, 156, 171, 186]) * (1 + (data.cubeUpgrades[50] ?? 0) / 10000),
        freeMultiplierMultiplier: api.rune.getRuneEffects('duplication').multiplicativeMultipliers
            * challengeResearch(2) * (1 + r(11) / 20 + r(12) / 25 + r(13) / 40 + 0.015 * r(14) + r(15) / 200)
            * (1 + r(87) / 20) * late([128, 143, 158, 173, 188]) * (1 + (data.cubeUpgrades[50] ?? 0) / 10000)
            * api.antUpgrade.getAntUpgradeEffectValue(AntUpgrades.Multipliers, 'multiplierMult'),
        prismProductionLog: api.rune.getRuneEffects('prism').productionLog10,
        achievementPoints: api.achievement.sumEarnedAchievementPoints(),
        hepteractAccelerators: 2000 * api.calculateHepteractEffective('accelerator'),
        hepteractMultipliers: 1000 * api.calculateHepteractEffective('multiplier'),
        acceleratorFinalMultiplier: api.calculateChallenge15Reward('accelerator') * (1 + 3 / 10000 * api.calculateHepteractEffective('accelerator')),
        multiplierFinalMultiplier: api.calculateChallenge15Reward('multiplier') * (1 + 3 / 10000 * api.calculateHepteractEffective('multiplier')),
        freeBoostMultiplier: challengeResearch(3) * (1 + r(16) / 20 + r(17) / 20) * (1 + r(88) / 20)
            * api.antUpgrade.getAntUpgradeEffectValue(AntUpgrades.AcceleratorBoosts, 'acceleratorBoostMult')
            * late([127, 142, 157, 172, 187]) * (1 + (data.cubeUpgrades[50] ?? 0) / 10000)
            * (1 + api.calculateHepteractEffective('acceleratorBoost') / 1000),
        totalRuneLevels: api.rune.calculateTotalRuneLevels(),
        acceleratorsPerBoost: 5 + 2 * r(18) + 2 * r(19) + 3 * r(20) + cubeBless('accelerator', 500, 45, 0),
        duplicationBlessing: 1 + heaterCoinRunePurchasedLevel(getBlessingEXP(data, 'duplication'), 1e7, 4) * runeTotal('duplication') * blessingOther / 1e6,
        prismCostReduction: api.rune.getRuneEffects('prism').costDivisorLog10,
        prismSpiritCap: heaterCoinRunePurchasedLevel(getSpiritEXP(data, 'prism'), 1e60, 2)
            * heaterCoinRunePurchasedLevel(getBlessingEXP(data, 'prism'), 1e9, 4) * runeTotal('prism') * spiritOther / 7.777e7,
        commonFragmentsLog4: parseGameDataDecimal(data.commonFragments).plus(1).log10() / log(4),
        multiplierCubeBlessing: cubeBless('multiplier', 5000, 35, 1),
        thriftBlessingDelay: 1 + heaterCoinRunePurchasedLevel(getBlessingEXP(data, 'thrift'), 1e12, 4) * runeTotal('thrift') * blessingOther / 1e6,
    };
    for (const key of Object.keys(stats) as (keyof CorruptionProductionStats)[]) {
        if (Number.isNaN(stats[key]))
            throw new Error('Production inputs are invalid.');
        stats[key] = Math.min(1e300, stats[key]);
    }
    return stats;
}
interface ProductionOptions {
    data: GameData;
    stats: readonly CorruptionProductionStats[];
    speedLog10: readonly number[];
    tax: (challenge: number, completions: readonly number[], upgrades: readonly number[], baseTax?: number) => number;
    constructionPenalty: number;
    viscosity: number;
    recession: number;
    freeCrystalProducers?: readonly number[];
    growth?: CorruptionGrowth;
}
/** A bounded, sampled startup calculation. Each candidate owns its currencies and producer chains.
 * Research, rune EXP, ants and higher progression remain fixed; ordinary upgrades are repurchased.
 * This is an estimate of a fully automated visit, not the game's complete tick loop. */
export function createCorruptionProductionRun(options: ProductionOptions): CorruptionProductionRun {
    const { data, stats, speedLog10, viscosity, recession, constructionPenalty, growth,
        freeCrystalProducers = Array<number>(5).fill(0) } = options;
    const r = (i: number) => data.researches[i] ?? 0;
    const highestSingularity = data.highestSingularityCount;
    let challenge = 0;
    // The candidate starts at the next ascension. Milestone grants replace its lower-layer balances.
    const initialParticles = highestSingularity >= 15 ? log(2.22) + 2222 : highestSingularity >= 7 ? 100
        : highestSingularity >= 4 ? 16 : highestSingularity >= 3 ? 1 : -Infinity;
    const currency = [2, -Infinity, highestSingularity >= 2 ? log(1001) : -Infinity, initialParticles];
    const owned = [[+(highestSingularity >= 2), 0, 0, 0, 0], [...freeCrystalProducers],
        Array<number>(5).fill(0), Array<number>(5).fill(+(data.cubeUpgrades[27] === 1))];
    const generated = owned.map(() => new Array<number>(5).fill(-Infinity));
    const upgrades = [...data.upgrades];
    upgrades.fill(0, 1, 81);
    upgrades.fill(0, 101);
    if (highestSingularity > 0) upgrades.fill(1, 81, 101);
    let coinsEarned = 2;
    let crystal = -Infinity;
    let mythos = -Infinity;
    let atoms = -Infinity;
    let accelerators = 0;
    let multipliers = 0;
    let acceleratorBoosts = 0;
    const crystalUpgrades = new Array<number>(8).fill(0);
    let lastAcceleratorEffect = 0;
    let lastCompletions: readonly number[] = data.challengecompletions;
    const ach = (id: AchievementId) => data.achievements?.[id] ? 1 : 0;
    const up = (i: number) => upgrades[i] > 0 ? 1 : 0;
    const conversionBonus = 1 + 0.01 * sum(CONVERSION_ACHIEVEMENTS.map(ach));

    function prestigeGain(c: readonly number[]): number {
        if (coinsEarned < 12) return -Infinity;
        const power = challenge === 10 ? 0.0001 : challenge === 5 ? 0.01 : 0.5 + c[5] / 100;
        const bonus = up(16) && challenge !== 5 && challenge !== 10 ? Math.min(1e33, lastAcceleratorEffect / 3) : 0;
        return (coinsEarned - 12) * power + bonus;
    }

    function transcendGain(): number {
        if (coinsEarned < 100) return -Infinity;
        const bonus = up(44) && challenge !== 5 && challenge !== 10 ? Math.min(6, log(1.01) * data.transcendCount) : 0;
        return (coinsEarned - 100) * (challenge === 10 ? 0.001 : 0.03) + bonus;
    }

    function reincarnationGain(): number {
        if (mythos < 300) return -Infinity;
        return (mythos - 300) * (challenge >= 6 ? 0.0001 : 0.01)
            + log(1 + ach(AchievementId.ReincarnationPointGainTier1)) + up(65) * log(5);
    }

    function buyUpgrades() {
        for (let i = 1; i <= 125; i++) {
            if (i >= 81 && i <= 100) continue;
            const family = i <= 80 ? Math.floor((i - 1) / 20) : i <= 105 || i >= 111 && i <= 115 ? 1 : i >= 116 && i <= 120 ? 2 : 0;
            // Avoid assuming upgrades whose progression gate has not been reached.
            const available = data.upgrades[i] > 0 || i <= 5 || (i <= 10 && data.unlocks.prestige)
                || (i <= 15 && data.unlocks.generation) || (i <= 20 && data.unlocks.transcend)
                || (i >= 21 && i <= 30 && data.unlocks.prestige) || (i >= 31 && i <= 35 && data.unlocks.transcend)
                || (i >= 36 && i <= 37 && data.unlocks.reincarnate)
                || (i === 38 && ach(AchievementId.Challenge7Tier1)) || (i === 39 && ach(AchievementId.Challenge8Tier1))
                || (i === 40 && ach(AchievementId.Challenge9Tier1))
                || (i >= 41 && i <= 50 && data.unlocks.transcend) || (i >= 51 && i <= 60 && data.unlocks.reincarnate)
                || (i >= 61 && i <= 75 && data.unlocks.reincarnate)
                || (i >= 76 && i <= 80 && data.unlocks.ascensions)
                || (i >= 121 && (data.cubeUpgrades[19] ?? 0) > 0);
            if (!upgrades[i] && available && currency[family] >= UPGRADE_COSTS[i]) {
                currency[family] = subtractLogs(currency[family], UPGRADE_COSTS[i]);
                upgrades[i] = 1;
            }
        }
    }
    function buyBuildings(s: CorruptionProductionStats) {
        for (let family = 0; family < 4; family++) {
            const divisor = family === 3 ? 1 : challenge === 8 ? 5 : family !== 2 && (challenge === 4 || challenge === 10) ? 2 : 1;
            const threshold = Math.max(1e-100, 1000 * s.construction / constructionPenalty / divisor);
            for (let i = 0; i < 5; i++) {
                const growth = 1.25 ** (GROWTH[family][i] * (challenge === 8 && family !== 3 ? 2 : 1));
                const before = cumulativeCost(owned[family][i], COSTS[family][i], growth, threshold);
                const share = i === 0 && owned[family].every(n => n === 0) ? 1 : 5 - i;
                const budget = addProductionLogs(before, currency[family] - Math.log10(share));
                const count = Math.max(owned[family][i], affordableProductionBuildings(budget, COSTS[family][i], growth, threshold));
                const paid = subtractLogs(cumulativeCost(count, COSTS[family][i], growth, threshold), before);
                currency[family] = subtractLogs(currency[family], paid);
                owned[family][i] = count;
            }
        }
    }
    const run: CorruptionProductionRun = {
        enter(next) {
            growth?.awardReset(challenge, lastCompletions, upgrades, crystal);
            // Entering C1–C5 transcends; entering C6–C10 reincarnates.
            const reincarnationReset = next >= 6 || challenge >= 6;
            const awardParticles = reincarnationReset && !(next >= 6 && challenge > 0 && challenge <= 5);
            currency[2] = reincarnationReset ? -Infinity : addProductionLogs(currency[2], transcendGain());
            if (awardParticles) currency[3] = addProductionLogs(currency[3], reincarnationGain());
            const freeCrystalLevels = next < 6 && challenge >= 6 && up(73) ? 10 : 0;
            challenge = next;
            currency[0] = 2;
            currency[1] = -Infinity;
            owned[0].fill(0);
            owned[1] = [...freeCrystalProducers];
            generated[0].fill(-Infinity);
            generated[1].fill(-Infinity);
            generated[2].fill(-Infinity);
            crystal = -Infinity;
            mythos = -Infinity;
            coinsEarned = 2;
            crystalUpgrades.fill(freeCrystalLevels);
            accelerators = 0;
            multipliers = 0;
            acceleratorBoosts = 0;
            for (let i = 1; i <= 40; i++)
                upgrades[i] = 0;
            upgrades.fill(0, 101, 116);
            upgrades.fill(0, 121, 126);
            if (reincarnationReset) {
                owned[2].fill(0);
                generated[3].fill(-Infinity);
                atoms = -Infinity;
                upgrades.fill(0, 41, 61);
                upgrades.fill(0, 116, 121);
                for (const [research, upgrade] of [[41, 88], [42, 90], [43, 91], [44, 92], [45, 93]]) {
                    upgrades[upgrade] = Math.min(1, r(research));
                }
            }
        },
        advance(seconds, c) {
            if (growth) lastCompletions = c;
            const growthState = growth?.state(challenge, c, upgrades);
            const s = growthState?.production ?? stats[challenge];
            const speed = growthState?.globalSpeedLog10 ?? speedLog10[challenge];
            const dtLog = log(seconds) + speed + log(40);
            buyUpgrades();
            buyBuildings(s);
            const boostCurve = acceleratorBoostCostCurve(s.thriftBlessingDelay * Math.sqrt(s.construction / constructionPenalty));
            const previousBoostCost = boostCurve.cost(acceleratorBoosts);
            const nextBoosts = Math.max(acceleratorBoosts, boostCurve.affordable(addProductionLogs(previousBoostCost, currency[1] - log(2))));
            currency[1] = subtractLogs(currency[1], subtractLogs(boostCurve.cost(nextBoosts), previousBoostCost));
            acceleratorBoosts = nextBoosts;
            for (const isAccelerator of [true, false]) {
                const baseThreshold = isAccelerator ? 125 : 75;
                const delay = challenge === 4 || challenge === 8 ? 1 : 1 + (isAccelerator ? 5 : 2) * c[4] / baseThreshold;
                const threshold = (challenge === 8 ? 1 : challenge === 4 ? (isAccelerator ? 25 : 15) : baseThreshold * delay) * Math.sqrt(s.construction / constructionPenalty);
                const growth = (isAccelerator ? 4 : 10) ** (challenge === 8 ? 2 : 1);
                const curve = acceleratorCostCurve(isAccelerator ? 500 : 10000, growth, threshold, 10000 * delay, (isAccelerator ? 1.32e6 : 2.2e6) * delay);
                const previous = isAccelerator ? accelerators : multipliers;
                const paid = curve.cost(previous);
                const count = Math.max(previous, curve.affordable(addProductionLogs(paid, currency[0] - log(2))));
                currency[0] = subtractLogs(currency[0], subtractLogs(curve.cost(count), paid));
                if (isAccelerator)
                    accelerators = count;
                else
                    multipliers = count;
            }
            const buildings = sum(owned[0]);
            const powerLog = log((1 + (1 - 2 ** (-1 / 160)) * log1p(atoms) + 0.25 * c[8]) * s.buildingPowerResearch) * s.buildingPowerExponent;
            const power = 10 ** Math.min(300, powerLog);
            const buildingMult = buildings * (challenge === 7 ? log1p(powerLog + log(0.05)) : powerLog);
            const firstSix = log(buildings + 1) + Math.min(30, log(1.008) * buildings);
            const diamondUpgrades = sum(upgrades.slice(21, 26));
            const buildingAchievement = (offset: number, divisor: number) => sum(owned[0].map((n, i) => Math.floor(n / divisor) * (data.achievements?.[5 + 7 * i + offset] ? 1 : 0)));
            const freeBoosts = Math.min(1e100, Math.floor((up(26) + up(31) * Math.floor(buildings / 2000) + buildingAchievement(2, 2000)
                + r(93) * Math.floor(s.totalRuneLevels / 20)) * s.freeBoostMultiplier * (up(73) && challenge >= 6 ? 2 : 1)));
            const totalBoosts = freeBoosts + acceleratorBoosts;
            const achievementAccelerators = buildingAchievement(0, 500) + 2 * ach(AchievementId.PrestigeNoAccelerator)
                + 4 * ach(AchievementId.TranscendNoAccelerator) + 8 * ach(AchievementId.ReincarnationNoAccelerator)
                + 5 * ach(AchievementId.AcceleratorsTier4) + 12 * ach(AchievementId.AcceleratorsTier5) + 25 * ach(AchievementId.AcceleratorsTier6) + 50 * ach(AchievementId.AcceleratorsTier7);
            const achievementMultipliers = buildingAchievement(1, 1000) + ach(AchievementId.PrestigeNoMult) + 2 * ach(AchievementId.TranscendNoMult)
                + 4 * ach(AchievementId.ReincarnationNoMult) + ach(AchievementId.MultipliersTier2) + ach(AchievementId.MultipliersTier4)
                + 3 * ach(AchievementId.MultipliersTier5) + 6 * ach(AchievementId.MultipliersTier6) + 10 * ach(AchievementId.MultipliersTier7);
            const freeAccelRaw = (5 * c[2] + 5 * up(21) + 4 * up(22) + 3 * up(23) + 2 * up(24) + up(25) + up(8) * Math.floor(multipliers / 7)
                + up(32) * Math.min(500, Math.floor(log1p(currency[1]) / 25)) + up(45) * Math.min(2500, Math.floor(log1p(mythos)))
                + achievementAccelerators + totalBoosts * s.acceleratorsPerBoost)
                * s.freeAcceleratorMultiplier * 1.01 ** diamondUpgrades * (up(50) && challenge !== 0 ? 1.25 : 1);
            const freeAccel = effectiveFreeProduction(freeAccelRaw, s.hepteractAccelerators, s.acceleratorFinalMultiplier, viscosity);
            const freeMultRaw = ((c[1] > 0 ? 1 : 0) + diamondUpgrades + up(9) * Math.floor(accelerators / 10)
                + up(7) * Math.min(4, 1 + Math.floor(log(owned[0][4] + 1))) + up(49) * Math.min(50, Math.floor(log1p(currency[2]) / 10))
                + up(33) * totalBoosts + up(68) * Math.min(2500, Math.floor(coinsEarned / 1000)) + achievementMultipliers + r(94) * 20 * Math.floor(s.totalRuneLevels / 8))
                * s.freeMultiplierMultiplier * 1.01 ** diamondUpgrades * (1 + 0.03 * up(34) + 0.02 * up(35)) * s.multiplierCubeBlessing
                * (up(50) && challenge !== 0 ? 1.25 : 1);
            const freeMult = effectiveFreeProduction(freeMultRaw, s.hepteractMultipliers, s.multiplierFinalMultiplier, viscosity);
            const rawBoosts = (Math.LN10 / Math.log(3) * log1p(mythos) + s.duplicationBoosts + 2 * c[1])
                * (1 + 0.11 * r(33)) * (1 + 0.11 * r(34)) * (1 + 0.11 * r(35)) * (1 + r(89) / 5) * s.duplicationBlessing;
            const achievementPower = 0.001 * ach(AchievementId.FirstOwnedCoinTier3) + 0.0015 * ach(AchievementId.SecondOwnedCoinTier3)
                + 0.002 * ach(AchievementId.ThirdOwnedCoinTier3) + 0.002 * ach(AchievementId.FourthOwnedCoinTier3)
                + 0.003 * ach(AchievementId.FifthOwnedCoinTier3) + 0.01 * ach(AchievementId.AcceleratorsTier2);
            let acceleratorPower = Math.min(1e300, (1.1 + s.speedRunePower + achievementPower + (up(46) ? 1.05 : 1) * totalBoosts / 100 * (1 + c[2] / 20)) ** (1 + 0.04 * c[7]));
            let multiplierPower = Math.min(1e300, 2 + 0.02 * Math.floor(rawBoosts) ** (1 + 0.04 * c[7]) * (c[7] > 0 ? 1.25 : 1));
            if (challenge === 1) {
                acceleratorPower = Math.max(1, acceleratorPower * 25 / (50 + c[1]) + 0.55);
                multiplierPower = 1;
            }
            if (challenge === 2) {
                acceleratorPower = 1;
                multiplierPower = 1.25 + 0.0012 * rawBoosts * (c[7] > 0 ? 1.25 : 1);
            }
            if (challenge === 3)
                acceleratorPower = 1 + acceleratorPower / 2;
            if (challenge === 7 || challenge === 10) {
                acceleratorPower = 1;
                multiplierPower = 1;
            }
            const a = Math.min(1e300, accelerators / viscosity + freeAccel);
            const m = Math.min(1e300, multipliers / viscosity + freeMult);
            const accelEffect = log(acceleratorPower) * (a + (challenge === 1 ? m : 0));
            lastAcceleratorEffect = accelEffect;
            const multEffect = log(multiplierPower) * m;
            // C9 clears crystal upgrades on entry. The milestone autobuyers still run during the challenge.
            const freeLevels = up(73) && challenge >= 6 ? 10 : 0;
            const crystalBudget = log1p(crystal) + s.prismCostReduction;
            for (let i = 0; i < CRYSTAL_UPGRADE_COSTS.length; i++) {
                if (!freeCrystalProducers[i]) continue;
                const budget = crystalBudget - CRYSTAL_UPGRADE_COSTS[i];
                const bought = Math.floor(Math.sqrt(Math.max(0, 2 * budget / CRYSTAL_UPGRADE_COST_INCREASES[i] + 0.25)) + 0.5);
                crystalUpgrades[i] = Math.max(crystalUpgrades[i], bought + freeLevels);
            }
            const crystalExponent = 1 / 3 + (10 + 0.05 * r(129) * s.commonFragmentsLog4 + s.prismSpiritCap) * (1 - 0.995 ** crystalUpgrades[3])
                + 0.04 * c[3] + 0.08 * r(28) + 0.08 * r(29) + 0.04 * r(30) + 8 * (data.cubeUpgrades[17] ?? 0);
            let coinMult = accelEffect + multEffect + log1p(crystal) * crystalExponent + buildingMult + s.antCoinsLog
                + (data.highestSingularityCount > 0 ? 1.5 * log((data.goldenQuarks ?? 0) + 1) + 2 * log(data.highestSingularityCount + 1) : 0)
                + up(6) * firstSix + (challenge !== 7 ? up(11) * log(1.02) * a : 0)
                + up(12) * Math.min(4, log(1.01) * (data.prestigeCount ?? 0)) + up(20) * 10 * log(buildings / 4 + 1)
                + up(41) * Math.min(30, log1p(currency[2]) / 2) + up(43) * Math.min(30, log(1.01) * data.transcendCount)
                - (challenge === 6 ? 250 : challenge === 7 ? 1250 : challenge === 9 ? 2e6 : 0);
            coinMult *= s.coinExponent * (1 + 0.025 * up(123)) * recession;
            const tiers = owned[0].map((n, i) => {
                let tier = up(i + 1) * firstSix;
                if (i === 0)
                    tier += up(10) * Math.min(50, owned[0][1] / 15) * log(2);
                if (i === 1)
                    tier += up(13) * Math.min(50, 4 / 3 * log1p(addProductionLogs(generated[2][0], log(owned[2][0]))) + 22)
                        + up(19) * Math.min(200, log1p(currency[2] + 30));
                if (i === 2)
                    tier += up(14) * (log(1.15) * freeAccel + 5) + up(18) * Math.min(125, log1p(mythos));
                if (i === 3)
                    tier += up(15) * (log(1.15) * freeAccel + 5) + up(17) * 100;
                if (i === 4)
                    tier += log1p(addProductionLogs(generated[1][0], log(owned[1][0])))
                        * sum([0.1, 0.15, 0.25, 0.25, 0.25].map((e, i) => e * up(106 + i))) * conversionBonus;
                tier += up(56 + i) * [5000, 7500, 15000, 25000, 35000][i];
                return log(n * BASE_PRODUCTION[0][i]) + tier;
            });
            const gross = sumLogs(tiers) + coinMult;
            const tax = options.tax(challenge, c, upgrades, growthState?.taxExponent);
            const gain = gross < -3 ? -Infinity : taxedProductionLog10(gross, s.antCoinsLog + buildingMult, tax) + dtLog;
            if (!Number.isFinite(gain) && gain !== -Infinity)
                throw new Error('Production inputs are outside the supported range. Reload and calculate again.');
            currency[0] = addProductionLogs(currency[0], gain);
            coinsEarned = addProductionLogs(coinsEarned, gain);
            // Autobuyers use the same point gains as the matching reset, scaled by elapsed game time.
            const passiveGain = dtLog - log(4000);
            if (up(93) && coinsEarned >= 16)
                currency[1] = addProductionLogs(currency[1], prestigeGain(c) + passiveGain);
            if (up(100) && coinsEarned >= 100)
                currency[2] = addProductionLogs(currency[2], transcendGain() + passiveGain);
            if ((data.cubeUpgrades[28] ?? 0) > 0 && mythos >= 300)
                currency[3] = addProductionLogs(currency[3], reincarnationGain() + passiveGain);
            let crystalMult = s.prismProductionLog + up(36) * Math.min(5000, Math.max(0, currency[1] / 500))
                + up(63) * Math.min(6000, 6 * log1p(currency[3])) + (r(39) > 0 ? buildingMult / 50 : 0)
                + 4 * r(5) * (1 + data.challengecompletions[14] / 2) + log(2.5) * (r(26) + r(27));
            crystalMult += log(1 + 0.01 * crystalUpgrades[0]) * s.achievementPoints
                + log(1 + crystalUpgrades[1] * log1p(currency[0]) / 100) * (2 + Math.log2(crystalUpgrades[1] + 1))
                + log(1 + (1 + up(122) + 0.001 * r(129) * s.commonFragmentsLog4) * (1 - 0.999 ** crystalUpgrades[2])) * sum(owned[1])
                + log(1 + 0.05 * crystalUpgrades[4]) * sum(c.slice(1, 6));
            let mythosMult = up(37) * 2 * log(Math.max(1, log1p(currency[1]))) + up(42) * Math.min(50, log1p(log1p(currency[1]) / 50 - log(2.5)))
                + up(47) * (log(1.01) * s.achievementPoints + log(s.achievementPoints / 5 + 1)) + up(51) * 2 * log(Math.max(1, totalBoosts));
            if (up(52))
                mythosMult *= 1.025;
            mythosMult += up(64) * 2 * log1p(currency[3]) + (r(40) > 0 ? buildingMult / 250 : 0);
            const mythosTiers = [mythosMult + up(53) * Math.min(1250, accelEffect / 125), mythosMult,
                mythosMult + up(54) * Math.min(2000, multEffect / 180), mythosMult,
                mythosMult + log(1 + c[3] / 200) * sum(owned[2]) + up(55) * 1000 * Math.min(1000, power - 1)];
            const particleTiers = [up(67) * log(1.03) * sum(owned[3]), 0, 0, 0, 0];
            for (const [family, multipliersLog] of [[1, Array(5).fill(crystalMult)], [2, mythosTiers], [3, particleTiers]] as const) {
                const production = owned[family].map((n, i) => addProductionLogs(log(n), generated[family][i]) + log(BASE_PRODUCTION[family][i]) + multipliersLog[i]);
                for (let i = 1; i < 5; i++)
                    generated[family][i - 1] = addProductionLogs(generated[family][i - 1], production[i] + dtLog);
                if (family === 1 && challenge !== 3 && challenge !== 10)
                    crystal = addProductionLogs(crystal, production[0] + dtLog);
                if (family === 2 && challenge !== 3 && challenge !== 10)
                    mythos = addProductionLogs(mythos, production[0] + dtLog);
                if (family === 3)
                    atoms = addProductionLogs(atoms, production[0] + dtLog);
            }
            // The game applies these conversions once per 50 ms autobuyer update, regardless of global speed.
            const conversionTime = log(seconds / 0.05);
            const crystalConversion = 0.08 * conversionBonus * sum(upgrades.slice(111, 116));
            const mythosConversion = 0.05 * conversionBonus * sum(upgrades.slice(116, 121));
            if (crystalConversion > 0) {
                const source = log1p(addProductionLogs(generated[2][0], log(owned[2][0])));
                generated[1][4] = addProductionLogs(generated[1][4], source * crystalConversion + conversionTime);
            }
            if (mythosConversion > 0) {
                const source = log1p(addProductionLogs(generated[3][0], log(owned[3][0])));
                generated[2][4] = addProductionLogs(generated[2][4], source * mythosConversion + conversionTime);
            }
            if (growth) currency[3] = growth.advance(seconds, challenge, c, upgrades, crystal, currency[3], speed);
        },
        amount(challengeId) { return challengeId >= 6 && challengeId <= 8 ? mythos : challengeId <= 5 ? coinsEarned : currency[0]; },
    };
    return run;
}
