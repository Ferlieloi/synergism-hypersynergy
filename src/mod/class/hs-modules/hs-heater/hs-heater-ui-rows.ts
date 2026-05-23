import type { HeaterOptimizationResult, HeaterResultArrayKey, HeaterResultRow, HeaterResultSheetRow, HeaterResultSheetRowMatrix, } from "../../../types/data-types/hs-heater-types";

function buildHeaterSheetCefLog(effect: number | string, cost: number | string): number | "-" | "N / A" | "Never" {
    if (effect === "N / A" || effect === "-" || effect === "Never") {
        return effect;
    }
    if (typeof cost !== "number" || cost <= 0) {
        return "-";
    }
    const effectValue = typeof effect === "number" ? effect : Number(effect);
    if (!Number.isFinite(effectValue) || effectValue <= 1) {
        return "-";
    }
    const delta = Math.pow(effectValue, 1 / cost) - 1;
    if (!(delta > 0)) {
        return "-";
    }
    return -Math.log10(delta);
}

export function buildHeaterSheetRow(
    row: HeaterResultRow,
    p4Enabled: boolean,
    p9Enabled: boolean,
): HeaterResultSheetRow {
    const loadout = String(row[0]);
    const blueberryCost = row[2] as number | "N / A";
    const cost = row[3] as number | "N / A";
    const effectValue = row[4];
    const effect = String(effectValue);
    const maxed = row[6] === true;
    const isUnavailable = effect === "N / A" || loadout === "Unaffordable";
    const p4Effect: number | "-" | "N / A" =
        isUnavailable || !p4Enabled || maxed ? "-" : (typeof effectValue === "number" ? effectValue : Number(effectValue));
    const p9Effect: number | "-" | "N / A" =
        isUnavailable || !p9Enabled || maxed ? "-" : (typeof effectValue === "number" ? effectValue : Number(effectValue));

    return {
        loadout,
        blueberryCost,
        cost,
        costDetail: maxed ? "Maxed" : cost,
        effect,
        p4x4Eq: row[5] as number | "Never" | "N / A",
        maxed,
        p4Effect,
        p4CefLog: buildHeaterSheetCefLog(p4Effect, cost),
        p9Effect,
        p9CefLog: buildHeaterSheetCefLog(p9Effect, cost),
    };
}

export function buildSheetRowsFromOutput(
    output: HeaterOptimizationResult,
    p4Enabled: boolean,
    p9Enabled: boolean,
): Partial<Record<HeaterResultArrayKey, HeaterResultSheetRowMatrix>> {
    const result: Partial<Record<HeaterResultArrayKey, HeaterResultSheetRowMatrix>> = {};
    const keys: HeaterResultArrayKey[] = [
        'luck', 'rLuck', 'allAmb', 'quarks', 'cubes', 'oct', 'obt', 'off', 'hyperflux', 'ambOct', 'gen'
    ];

    for (const key of keys) {
        const rows = output[key];
        if (rows !== undefined) {
            result[key] = rows.map((row) => buildHeaterSheetRow(row, p4Enabled, p9Enabled));
        }
    }

    return result;
}
