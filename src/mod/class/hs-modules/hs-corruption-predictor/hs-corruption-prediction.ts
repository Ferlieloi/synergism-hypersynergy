export const CORRUPTION_SWEEP = [0.5, 0.5, 0.5, 20] as const;
export const CORRUPTION_GAP_SECONDS = 0.1;
const TAX_LOG_BASE = Math.log10(1.01);
const BASE_REQUIREMENTS = [0, 10, 20, 60, 100, 200, 125, 500, 7500, 2e8, 2.5e9];
const AUTO_TRANSCENSION_REQUIREMENT_POWERS = [1.25, 1.6, 1.7, 1.45, 2];
const STARTUP_TICK_SECONDS = 0.025;

export interface CorruptionPredictionModel {
    maxLevel: number;
    caps: number[];
    c10Reduction: number;
    reincarnationReduction: number;
    transcensionReduction: number;
    c9c10Scaling: number;
    hyperchallenge: (level: number) => number;
    rewardLog10: (level: number, completions: readonly number[]) => number;
    createProductionRun: (level: number) => CorruptionProductionRun;
    createDetailedProductionRun?: (level: number) => CorruptionProductionRun;
    startingCompletions?: readonly number[];
    singleCompletionPerTick?: boolean;
    autoTranscension?: readonly boolean[];
    retainTranscensionCompletions?: boolean;
    observed?: { level: number; completions: readonly number[] };
}

export interface CorruptionProductionRun {
    enter: (challenge: number) => void;
    advance: (seconds: number, completions: readonly number[]) => void;
    amount: (challenge: number) => number;
}

export interface CorruptionPrediction {
    level: number;
    completions: number[];
    scoreLog10: number;
    observed?: true;
}

/** Singularity perks can seed some challenges above the active cap, which only limits new completions. */
export function corruptionCompletionCeilings(caps: readonly number[], startingCompletions?: readonly number[]): number[] {
    return caps.map((cap, challenge) => Math.max(cap, startingCompletions?.[challenge] ?? 0));
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

export function predictCorruptionLevel(model: CorruptionPredictionModel, level: number, resolution = 1,
    detailed = false): CorruptionPrediction {
    if (!Number.isInteger(resolution) || resolution < 1 || resolution > 16) throw new Error('Unsupported prediction resolution');
    const completions = model.startingCompletions ? [...model.startingCompletions] : new Array<number>(11).fill(0);
    const highest = [...completions];
    const run = (detailed ? model.createDetailedProductionRun ?? model.createProductionRun : model.createProductionRun)(level);
    for (const duration of CORRUPTION_SWEEP) {
        for (let challenge = 1; challenge <= 10; challenge++) {
            let elapsed = 0;
            if (completions[challenge] < model.caps[challenge]) {
                const reincarnation = challenge >= 6 && model.autoTranscension !== undefined;
                run.enter(challenge);
                if (reincarnation) completions.fill(0, 1, 6);
                while (elapsed < duration && completions[challenge] < model.caps[challenge]) {
                    const previousElapsed = elapsed;
                    const seconds = Math.min(duration - elapsed, (elapsed < 1 ? STARTUP_TICK_SECONDS : 0.25) / resolution);
                    run.advance(seconds, completions);
                    elapsed += seconds;
                    if (reincarnation) {
                        for (let i = 1; i <= 5; i++) {
                            if (!model.autoTranscension?.[i - 1] || completions[i] >= highest[i]) continue;
                            const amount = run.amount(i) / AUTO_TRANSCENSION_REQUIREMENT_POWERS[i - 1];
                            completions[i] = Math.max(completions[i], Math.min(highest[i], affordable(model, i, amount, level)));
                        }
                    }
                    const amount = run.amount(challenge);
                    if (!Number.isFinite(amount) && amount !== -Infinity) throw new Error('Invalid production estimate');
                    const affordableCompletions = affordable(model, challenge, amount, level);
                    const completionLimit = model.singleCompletionPerTick
                        ? completions[challenge] + Math.floor((elapsed + 1e-9) / STARTUP_TICK_SECONDS)
                            - Math.floor((previousElapsed + 1e-9) / STARTUP_TICK_SECONDS)
                        : model.caps[challenge];
                    const next = Math.min(affordableCompletions, completionLimit);
                    completions[challenge] = Math.max(completions[challenge], next);
                    highest[challenge] = Math.max(highest[challenge], completions[challenge]);
                }
                run.enter(0);
                if (reincarnation) {
                    for (let i = 1; i <= 5; i++) completions[i] = model.retainTranscensionCompletions ? highest[i] : 0;
                }
            }
            // A capped challenge spends the rest of its visit outside the challenge. Keep progressing between visits.
            let remaining = duration - elapsed + CORRUPTION_GAP_SECONDS;
            while (remaining > 1e-9) {
                const seconds = Math.min(remaining, 0.25 / resolution);
                run.advance(seconds, completions);
                remaining -= seconds;
            }
        }
    }
    const scoreLog10 = completions[10] > 0 ? model.rewardLog10(level, completions) : -Infinity;
    if (model.observed?.level === level) {
        const observedScore = model.rewardLog10(level, model.observed.completions);
        if (observedScore > scoreLog10) {
            return { level, completions: [...model.observed.completions], scoreLog10: observedScore, observed: true };
        }
    }
    return { level, completions, scoreLog10 };
}

export function validateCorruptionModel(model: CorruptionPredictionModel): void {
    if (!Number.isInteger(model.maxLevel) || model.maxLevel < 0 || model.maxLevel > 10000
        || model.caps.length !== 11 || model.caps.some(n => !Number.isInteger(n) || n < 0 || n > 10000)
        || !(model.c9c10Scaling > 0) || !(model.c10Reduction < BASE_REQUIREMENTS[10])
        || !(model.reincarnationReduction > 0) || !(model.transcensionReduction > 0)) {
        throw new Error('Unsupported challenge limits or scaling');
    }
}

export function scoreCorruptionLevels(model: CorruptionPredictionModel, levels: Iterable<number>, detailed = false): CorruptionPrediction[] {
    const results: CorruptionPrediction[] = [];
    for (const level of levels) {
        const result = predictCorruptionLevel(model, level, 1, detailed);
        if (Number.isNaN(result.scoreLog10) || result.scoreLog10 === Infinity) throw new Error('Invalid reward estimate');
        results.push(result);
    }
    return results;
}

export function rankCorruptionResults(results: CorruptionPrediction[]): CorruptionPrediction[] {
    return results.filter(result => result.scoreLog10 > -Infinity)
        .sort((a, b) => b.scoreLog10 - a.scoreLog10 || a.level - b.level);
}

export function shortlistCorruptionLevels(ranked: CorruptionPrediction[], maxLevel: number, observedLevel?: number): number[] {
    const shortlist = new Set<number>();
    for (const { level } of ranked.slice(0, 3)) {
        for (let neighbor = Math.max(0, level - 1); neighbor <= Math.min(maxLevel, level + 1); neighbor++) {
            shortlist.add(neighbor);
        }
    }
    if (observedLevel !== undefined && observedLevel >= 0 && observedLevel <= maxLevel) shortlist.add(observedLevel);
    return [...shortlist].sort((a, b) => a - b);
}

export function findOptimalCorruption(model: CorruptionPredictionModel): CorruptionPrediction | null {
    validateCorruptionModel(model);
    const levels = Array.from({ length: model.maxLevel + 1 }, (_, level) => level);
    const ranked = rankCorruptionResults(scoreCorruptionLevels(model, levels));
    if (!model.createDetailedProductionRun || !ranked.length) return ranked[0] ?? null;
    const shortlist = shortlistCorruptionLevels(ranked, model.maxLevel, model.observed?.level);
    return rankCorruptionResults(scoreCorruptionLevels(model, shortlist, true))[0] ?? ranked[0];
}
