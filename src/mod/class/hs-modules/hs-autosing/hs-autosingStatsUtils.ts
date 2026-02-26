// hs-autosingStatsUtils.ts
// Stateless statistical helpers for autosing modules
import Decimal from "break_infinity.js";

/**
 * Returns the average duration of the last n entries in metrics.
 */
export function getAverageLast(metrics: Array<{ duration: number }>, n: number): number | null {
    if (n <= 0 || metrics.length < n) return null;
    const sum = metrics.slice(-n).reduce((acc, m) => acc + m.duration, 0);
    return sum / n;
}

/**
 * Returns the standard deviation of the last n durations in metrics.
 */
export function getStandardDeviation(metrics: Array<{ duration: number }>, n: number): number | null {
    if (n <= 1 || metrics.length < n) return null;
    const slice = metrics.slice(-n);
    const mean = slice.reduce((acc, m) => acc + m.duration, 0) / n;
    const variance = slice.reduce((acc, m) => acc + Math.pow(m.duration - mean, 2), 0) / n;
    return Math.sqrt(Math.max(0, variance));
}

/**
 * Returns the average quarks (or golden quarks) per second for all recorded metrics.
 */
export function getQuarksPerSecond(metrics: Array<{ duration: number, quarksGained: number, goldenQuarksGained: number }>, isGolden: boolean): number | null {
    if (metrics.length === 0) return null;
    let total = 0, totalTime = 0;
    for (const m of metrics) {
        if (isGolden) {
            total += m.goldenQuarksGained;
        } else {
            total += m.quarksGained;
        }
        totalTime += m.duration;
    }
    if (totalTime <= 0) return null;
    return total / totalTime;
}

/**
 * Returns the average for a phase from phaseHistory.
 */
export function getPhaseAverage(phaseHistory: Map<string, { phaseCount: number, totalTime: number }>, phase: string): number | null {
    const phaseData = phaseHistory.get(phase);
    if (!phaseData || phaseData.phaseCount === 0) return null;
    return phaseData.totalTime / phaseData.phaseCount;
}

/**
 * Returns the standard deviation for a phase from phaseHistory.
 */
export function getPhaseStandardDeviation(phaseHistory: Map<string, { phaseCount: number, totalTime: number, sumSq: number }>, phase: string): number | null {
    const phaseData = phaseHistory.get(phase);
    if (!phaseData || phaseData.phaseCount <= 1) return null;
    const phaseCount = phaseData.phaseCount;
    const mean = phaseData.totalTime / phaseCount;
    // Sample variance: (sumOfSquares - n*mean^2)/(n-1)
    const variance = (phaseData.sumSq - phaseCount * mean * mean) / (phaseCount - 1);
    return Math.sqrt(Math.max(0, variance));
}

/**
 * Returns the average C15 value for the last n, given count and mean.
 */
export function getC15AverageLast(c15Count: number, c15Mean: Decimal, n: number): Decimal | null {
    if (n <= 0 || c15Count === 0) return null;
    return c15Mean;
}

/**
 * Returns the stddev for C15 values, given count and M2.
 */
export function getC15StdLast(c15Count: number, c15M2: Decimal, n: number): Decimal | null {
    if (n <= 0 || c15Count <= 1) return null;
    const variance = c15M2.div(c15Count);
    return variance.pow(0.5);
}

/**
 * Returns the population variance of ln(C15) using incremental Welford stats.
 */
export function getLogC15Variance(logC15Count: number, logC15M2: number): number | null {
    if (logC15Count === 0) return null;
    return logC15M2 / logC15Count;
}

/**
 * Returns the population standard deviation of ln(C15).
 */
export function getLogC15Std(logC15Count: number, logC15M2: number): number | null {
    const v = getLogC15Variance(logC15Count, logC15M2);
    return v === null ? null : Math.sqrt(v);
}

/**
 * Returns the mean of ln(C15).
 */
export function getLogC15Mean(logC15Count: number, logC15Mean: number): number | null {
    return logC15Count === 0 ? null : logC15Mean;
}
