import Decimal from "break_infinity.js";
import { AutoAscensionModes } from "../../../types/data-types/hs-player-savedata";

export const parseNumericStringIfSafe = (value: unknown): number | undefined => {
    if (typeof value !== 'string') return undefined;

    const trimmed = value.trim();
    if (trimmed.length === 0) return undefined;

    const parsed = Number(trimmed);
    return Number.isNaN(parsed) ? undefined : parsed;
};

export const parseGameDataDecimal = (value: unknown, fallback?: Decimal): Decimal => {
    if (value == null) {
        return fallback ?? new Decimal(0);
    }

    if (value instanceof Decimal) {
        return value;
    }

    if (typeof value === 'number') {
        if (Number.isFinite(value)) {
            return new Decimal(value);
        }
        return new Decimal(value.toString());
    }

    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed.length === 0) {
            return fallback ?? new Decimal(0);
        }

        try {
            return new Decimal(trimmed);
        } catch {
            return fallback ?? new Decimal(0);
        }
    }

    try {
        return new Decimal(value as any);
    } catch {
        return fallback ?? new Decimal(0);
    }
};

export const parseGameDataNumber = (value: unknown, fallback = 0): number => {
    if (value == null) {
        return fallback;
    }

    if (typeof value === 'number') {
        return value;
    }

    const stringParsed = parseNumericStringIfSafe(value);
    if (stringParsed !== undefined) {
        return stringParsed;
    }

    const decimal = parseGameDataDecimal(value, new Decimal(0));
    const parsed = decimal.toNumber();
    if (Number.isFinite(parsed)) {
        return parsed;
    }

    return parsed === Number.POSITIVE_INFINITY || parsed === Number.NEGATIVE_INFINITY ? parsed : fallback;
};

export const floorLog10PlusOne = (value: number): number =>
    value > 0 ? 1 + Math.floor(Math.log10(value)) : 1;

export const calculateSigmoidExponential = (constant: number, coefficient: number): number =>
    1 + (constant - 1) * (1 - Math.exp(-coefficient));

export const findInsertionIndex = (target: number, array: number[]): number => {
    let index = 0;
    while (index < array.length && target >= array[index]) {
        index += 1;
    }
    return index;
};

// ECC stands for "Effective Challenge Completions"
export const calcECC = (type: 'transcend' | 'reincarnation' | 'ascension', completions: number): number => {
    let effective = 0;
    switch (type) {
        case 'transcend':
            effective += Math.min(100, completions);
            effective += 1 / 20 * (Math.min(1000, Math.max(100, completions)) - 100);
            effective += 1 / 100 * (Math.max(1000, completions) - 1000);
            return effective;
        case 'reincarnation':
            effective += Math.min(25, completions);
            effective += 1 / 2 * (Math.min(75, Math.max(25, completions)) - 25);
            effective += 1 / 10 * (Math.max(75, completions) - 75);
            return effective;
        case 'ascension':
            effective += Math.min(10, completions);
            effective += 1 / 2 * (Math.max(10, completions) - 10);
            return effective;
    }
};


/** Whether the tesseract auto-buyer is in percentage mode (player.resetToggleModes.ascension). */
export const isTesseractAutoBuyPercentageMode = (resetToggleModes: { ascension?: AutoAscensionModes } | undefined): boolean =>
    resetToggleModes?.ascension === AutoAscensionModes.percentage;
