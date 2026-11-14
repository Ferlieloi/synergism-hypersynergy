export const CORRUPTION_SWEEP = [0.5, 20] as const;
export const CORRUPTION_GAP_SECONDS = 0.1;
const TAX_LOG_BASE = Math.log10(1.01);
const BASE_REQUIREMENTS = [0, 10, 20, 60, 100, 200, 125, 500, 7500, 2e8, 2.5e9];

export interface CorruptionPredictionModel {
    maxLevel: number;
    caps: number[];
    c10Reduction: number;
    reincarnationReduction: number;
    transcensionReduction: number;
    c9c10Scaling: number;
    coinRateLog10: (challenge: number, completions: readonly number[]) => number;
    hyperchallenge: (level: number) => number;
    rewardLog10: (level: number, completions: readonly number[]) => number;
}

export interface CorruptionPrediction {
    level: number;
    completions: number[];
    scoreLog10: number;
}

export function cappedCoinRateLog10(tax: number, flat: number, speedLog10: number): number {
    if (!(tax > 0) || !Number.isFinite(tax + flat + speedLog10)) throw new Error('Invalid production inputs');
    const vertex = 275 / (TAX_LOG_BASE * tax);
    const rounding = Math.floor(vertex) - 1 - vertex;
    return 137.5 / (TAX_LOG_BASE * tax) - TAX_LOG_BASE * tax * rounding ** 2 / 550
        + flat + speedLog10 + Math.log10(40);
}

export function challengeRequirementLog10(model: CorruptionPredictionModel, challenge: number, completion: number, level: number): number {
    if (challenge <= 5) return BASE_REQUIREMENTS[challenge] * model.transcensionReduction
        * (1 + Math.min(completion, 99)) ** 2 * 10 ** (Math.max(0, completion - 99) / 15);
    const base = BASE_REQUIREMENTS[challenge] - (challenge === 10 ? model.c10Reduction : 0);
    return base * model.reincarnationReduction * (1 + Math.min(completion, 24)) ** 2
        * 10 ** (Math.max(0, completion - 24) * (challenge >= 9 ? model.c9c10Scaling : 1) / 12)
        * (challenge === 10 ? model.hyperchallenge(level) : 1);
}

function affordable(model: CorruptionPredictionModel, challenge: number, amountLog10: number, level: number): number {
    let low = 0;
    let high = model.caps[challenge];
    while (low < high) {
        const mid = Math.ceil((low + high) / 2);
        if (challengeRequirementLog10(model, challenge, mid - 1, level) <= amountLog10) low = mid;
        else high = mid - 1;
    }
    return low;
}

function logAdd(a: number, b: number): number {
    const high = Math.max(a, b);
    if (high === -Infinity) return high;
    return high + Math.log10(1 + 10 ** (Math.min(a, b) - high));
}

export function predictCorruptionLevel(model: CorruptionPredictionModel, level: number): CorruptionPrediction {
    const completions = new Array<number>(11).fill(0);
    for (const duration of CORRUPTION_SWEEP) {
        for (let challenge = 1; challenge <= 10; challenge++) {
            if (challenge >= 6 && challenge <= 8) {
                completions[challenge] = model.caps[challenge];
                continue;
            }
            let remaining = duration;
            let coins = -Infinity;
            let events = 0;
            while (remaining > 0 && completions[challenge] < model.caps[challenge]) {
                if (++events > 10000) throw new Error('Prediction exceeded its event budget');
                const rate = model.coinRateLog10(challenge, completions);
                if (!Number.isFinite(rate)) throw new Error('Invalid production estimate');
                const requirement = challengeRequirementLog10(model, challenge, completions[challenge], level);
                const neededLog = coins >= requirement ? -Infinity
                    : requirement + Math.log10(-Math.expm1((coins - requirement) * Math.LN10));
                const wait = Math.min(remaining, Math.max(0.005, 10 ** (neededLog - rate)));
                coins = logAdd(coins, rate + Math.log10(wait));
                remaining -= wait;
                const next = affordable(model, challenge, coins, level);
                completions[challenge] = Math.max(completions[challenge], next);
            }
        }
    }
    return { level, completions, scoreLog10: completions[10] > 0 ? model.rewardLog10(level, completions) : -Infinity };
}

export function findOptimalCorruption(model: CorruptionPredictionModel): CorruptionPrediction | null {
    if (!Number.isInteger(model.maxLevel) || model.maxLevel < 0 || model.maxLevel > 10000
        || model.caps.length !== 11 || model.caps.some(n => !Number.isInteger(n) || n < 0 || n > 10000)
        || !(model.c9c10Scaling > 0) || !(model.c10Reduction < BASE_REQUIREMENTS[10])
        || !(model.reincarnationReduction > 0) || !(model.transcensionReduction > 0)) {
        throw new Error('Unsupported challenge limits or scaling');
    }
    let best: CorruptionPrediction | null = null;
    for (let level = 0; level <= model.maxLevel; level++) {
        const result = predictCorruptionLevel(model, level);
        if (Number.isNaN(result.scoreLog10) || result.scoreLog10 === Infinity) throw new Error('Invalid reward estimate');
        if (result.scoreLog10 > (best?.scoreLog10 ?? -Infinity)) best = result;
    }
    return best;
}
