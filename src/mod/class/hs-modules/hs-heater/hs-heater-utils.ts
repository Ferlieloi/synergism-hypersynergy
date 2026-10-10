export function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

// The number of decimals depends only on the size of the number, and trailing
// zeros are kept (552.00, not 552), so a column of values lines up. With
// fixedDecimals off, trailing zeros are dropped: for values that are counts.
export const formatNumber = (number: number, fixedDecimals = true): string => {
    if (!Number.isFinite(number)) return 'N / A';
    if (number >= 1e6) {
        return number.toLocaleString(undefined, {
            minimumSignificantDigits: fixedDecimals ? 3 : 1,
            maximumSignificantDigits: 3,
            notation: 'scientific',
            roundingMode: 'trunc'
        }).toLowerCase();
    }

    const digits = Math.max(0, Math.min(2, 4 - Math.floor(Math.log10(Math.abs(number)))));
    return number.toLocaleString(undefined, {
        minimumFractionDigits: fixedDecimals ? digits : 0,
        maximumFractionDigits: digits,
        roundingMode: 'trunc'
    });
};

export interface HeaterFusionInputs {
    fusion: number;
    rBar: number;
    rSpeed: number;
    rLuckRLuck: number;
    baseRLuck: number;
}

export function normalizeHeaterFusion(fusion: number, rBar: number, rSpeed: number): number {
    const normalizedFusion = (fusion > 0 ? 1 : 0) + 0.02 * fusion;
    return rBar > 0 ? normalizedFusion * (rSpeed / rBar) : 0;
}

export function computeHeaterFusionValue(fusion: number, rLuckRLuck: number, baseRLuck: number): number {
    return fusion * rLuckRLuck * baseRLuck / 100;
}

export function computeHeaterFusionValueFromStats(inputs: HeaterFusionInputs): number {
    const normalizedFusion = normalizeHeaterFusion(inputs.fusion, inputs.rBar, inputs.rSpeed);
    return computeHeaterFusionValue(normalizedFusion, inputs.rLuckRLuck, inputs.baseRLuck);
}

export function computeHeaterFusionGain(fusionValue: number, multiplier: number): number {
    return (1 + fusionValue * multiplier) / (1 + fusionValue);
}

export function computeHeaterRedAmbrosiaBaseMultiplier(level: number, coefficient = 0.002): number {
    return 1 + coefficient / (1 + coefficient * level);
}

export function computeHeaterRedAmbrosiaSheetValue(
    currentLevel: number,
    fusionValue: number,
    rowMultiplier: number,
    coefficient = 0.002,
): number {
    return computeHeaterRedAmbrosiaBaseMultiplier(currentLevel, coefficient) * computeHeaterFusionGain(fusionValue, rowMultiplier);
}
