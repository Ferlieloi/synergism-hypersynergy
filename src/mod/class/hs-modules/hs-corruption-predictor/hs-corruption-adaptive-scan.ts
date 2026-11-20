import { rankCorruptionResults, type CorruptionPrediction } from './hs-corruption-prediction';

const FULL_SCAN_MAX = 15;
const COARSE_INTERVALS = 8;
const C10_BOUNDARY_MARGIN = 5;
const SCORE_BATCH_SIZE = 4;

/** A sampled C10 frontier. Require a second zero and reject any sampled recovery above the first zero. */
function c10Boundary(samples: Iterable<CorruptionPrediction>): { positive: number; zero: number } | undefined {
    let positive = -1;
    let zero = Infinity;
    let zeroCount = 0;
    for (const { level, completions } of samples) {
        if (completions[10] > 0) positive = Math.max(positive, level);
        else {
            zero = Math.min(zero, level);
            zeroCount++;
        }
    }
    if (positive >= 0 && positive < zero && zeroCount >= 2) return { positive, zero };
}

/** Find the simulated fast-scan shortlist before running the more expensive production model. */
export async function scanCorruptionAdaptively(max: number, capScores: readonly number[],
    observed: CorruptionPrediction | undefined,
    evaluate: (levels: number[]) => Promise<CorruptionPrediction[]>): Promise<CorruptionPrediction[]> {
    const sampled = new Map<number, CorruptionPrediction>();
    const probe = async (levels: number[]) => {
        const unsampled = levels.filter(level => !sampled.has(level));
        if (!unsampled.length) return;
        for (const result of await evaluate(unsampled)) sampled.set(result.level, result);
    };
    const rank = () => {
        const results = new Map(sampled);
        if (observed && observed.scoreLog10 > (results.get(observed.level)?.scoreLog10 ?? -Infinity)) {
            results.set(observed.level, observed);
        }
        return rankCorruptionResults([...results.values()]);
    };
    const range = (low: number, high: number) => Array.from({ length: high - low + 1 }, (_, i) => low + i);
    const observedLevels = observed ? [observed.level] : [];
    if (max <= FULL_SCAN_MAX) {
        await probe(range(0, max));
        return rank();
    }

    const stride = Math.ceil(max / COARSE_INTERVALS);
    const coarse = new Set([0, max, ...observedLevels]);
    for (let level = stride; level < max; level += stride) coarse.add(level);
    await probe([...coarse]);

    let upper = max;
    let boundary = c10Boundary(sampled.values());
    while (boundary && boundary.zero - boundary.positive > C10_BOUNDARY_MARGIN) {
        const step = Math.round((boundary.zero - boundary.positive) / 3);
        await probe([boundary.positive + step, boundary.zero - step]);
        boundary = c10Boundary(sampled.values());
    }
    if (boundary) {
        const auditEnd = Math.min(max, boundary.zero + C10_BOUNDARY_MARGIN);
        await probe(range(boundary.positive + 1, auditEnd));
        if (c10Boundary(sampled.values())) upper = auditEnd;
    }

    const scanRemaining = async (limit: number) => {
        const remaining = range(0, limit)
            .filter(level => !sampled.has(level) && capScores[level] > -Infinity)
            .sort((a, b) => capScores[b] - capScores[a] || a - b);
        let ranked = rank();
        for (let i = 0; i < remaining.length; i += SCORE_BATCH_SIZE) {
            const third = ranked[2]?.scoreLog10 ?? -Infinity;
            // Even all completions at these levels could not displace the leading candidates.
            const batch = remaining.slice(i, i + SCORE_BATCH_SIZE).filter(level => capScores[level] >= third);
            if (!batch.length) break;
            await probe(batch);
            ranked = rank();
        }
        return ranked;
    };
    const ranked = await scanRemaining(upper);
    return upper < max && ranked.length < 3 ? scanRemaining(max) : ranked;
}
