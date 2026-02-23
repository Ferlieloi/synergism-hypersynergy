// hs-autosingFormatUtils.ts
// Formatting helpers for autosing modules
import Decimal from "break_infinity.js";

/**
 * Formats a number in exponential notation (2 decimals).
 */
export function formatNumber(num: number): string {
    return Number(num).toExponential(2).replace('+', '');
}

/**
 * Formats a number in exponential notation with sign.
 */
export function formatNumberWithSign(num: number): string {
    return Number(num).toExponential(2);
}

/**
 * Formats a Decimal value in exponential notation (2 decimals).
 */
export function formatDecimal(d: Decimal | null | undefined): string {
    if (d === null || d === undefined) return '-';
    try {
        let s = (d as Decimal).toExponential(2);
        s = s.replace(/E/g, 'e').replace(/\+/g, '');
        return s;
    } catch (e) {
        try {
            let s2 = new Decimal(d as any).toExponential(2);
            s2 = s2.replace(/E/g, 'e').replace(/\+/g, '');
            return s2;
        } catch (e2) {
            return String(d);
        }
    }
}

/**
 * Formats a number of seconds as a human-readable time string.
 */
export function formatTotalTime(seconds: number): string {
    const totalSeconds = Math.floor(seconds);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
        return `${hours}h${minutes.toString().padStart(2, '0')}m${secs.toString().padStart(2, '0')}s`;
    } else if (minutes > 0) {
        return `${minutes}m${secs.toString().padStart(2, '0')}s`;
    } else {
        return `${secs}s`;
    }
}
