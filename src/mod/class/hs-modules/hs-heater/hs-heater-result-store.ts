import { buildHeaterTypeSemanticId, getHeaterTypeBranchIndex, getHeaterTypeConfig, getHeaterTypeRowCount, resolveHeaterTypeLabel } from "./hs-heater-result-config";
import type { HeaterOptimizationResult, HeaterResultArrayKey, HeaterResultRow, NormalizedHeaterResultEntry } from "../../../types/data-types/hs-heater-types";

export type { NormalizedHeaterResultEntry } from "../../../types/data-types/hs-heater-types";

type ResultKey = HeaterResultArrayKey;


// ================================================================
// Result normalization / transformation
// ================================================================

export function normalizeHeaterOptimizationResult(
    result: HeaterOptimizationResult
): NormalizedHeaterResultEntry[] {
    const normalizedEntries: NormalizedHeaterResultEntry[] = [];
    const resultEntries = Object.entries(result)
        .filter(([key]) => key !== "input") as Array<[ResultKey, HeaterOptimizationResult[ResultKey]]>;

    for (const [key, value] of resultEntries) {
        if (!Array.isArray(value) || value.length === 0 || !Array.isArray(value[0])) {
            continue;
        }

        const config = getHeaterTypeConfig(key);
        if (!config) continue;

        const rowCount = getHeaterTypeRowCount(key);
        const isRowBased = rowCount > 1;

        if (isRowBased) {
            for (let rowIndex = 0; rowIndex < value.length; rowIndex++) {
                const semanticId = buildHeaterTypeSemanticId(key, rowIndex);
                const label = resolveHeaterTypeLabel(semanticId);
                if (!label) continue;
                normalizedEntries.push({
                    semanticId,
                    label,
                    section: config.section,
                    rowData: value[rowIndex],
                    key,
                    rowIndex,
                    isRowBased: true,
                });
            }
        } else {
            const semanticId = buildHeaterTypeSemanticId(key);
            const label = resolveHeaterTypeLabel(semanticId) ?? String(semanticId);
            normalizedEntries.push({
                semanticId,
                label,
                section: config.section,
                rowData: value[0],
                key,
                rowIndex: 0,
                isRowBased: false,
            });
        }
    }

    return normalizedEntries;
}


// ================================================================
// Result store / selected semantic ID helpers
// ================================================================

export class HSHeaterResultStore {
    static #currentNormalizedResult: NormalizedHeaterResultEntry[] | null = null;
    static #currentRawResult: HeaterOptimizationResult | null = null;

    static getCurrentNormalizedResult(): NormalizedHeaterResultEntry[] | null {
        return this.#currentNormalizedResult;
    }

    static getCurrentRawResult(): HeaterOptimizationResult | null {
        return this.#currentRawResult;
    }

    static collectSelectedSemanticIds(modal: HTMLElement, options?: { enabledOnly?: boolean }): Set<string> {
        const typeSelects = Array.from(modal.querySelectorAll('.hs-heater-type-select')) as HTMLSelectElement[];
        const typeCheckboxes = Array.from(modal.querySelectorAll('.hs-heater-type-select-checkbox')) as HTMLInputElement[];
        const enabledOnly = options?.enabledOnly ?? false;
        const selectedSemanticIds = new Set<string>();

        for (let i = 0; i < typeSelects.length; i++) {
            const semanticId = (typeSelects[i].value || '').trim();
            if (!semanticId || semanticId === 'none') continue;
            if (enabledOnly) {
                const checkbox = typeCheckboxes[i];
                if (!checkbox?.checked) continue;
            }
            selectedSemanticIds.add(semanticId);
        }

        return selectedSemanticIds;
    }

    static getUnavailableRequiredBranchIndexes(selectedSemanticIds: Set<string>): Set<number> {
        if (selectedSemanticIds.size === 0) return new Set<number>();

        const normalizedResult = this.getCurrentNormalizedResult();
        if (!normalizedResult) {
            const unavailableBranchIndexes = new Set<number>();
            for (const semanticId of selectedSemanticIds) {
                const branchIndex = getHeaterTypeBranchIndex(semanticId);
                if (branchIndex !== null) {
                    unavailableBranchIndexes.add(branchIndex);
                }
            }
            return unavailableBranchIndexes;
        }

        const availableSemanticIds = new Set<string>(normalizedResult.map((entry) => entry.semanticId as string));
        const unavailableBranchIndexes = new Set<number>();

        for (const semanticId of selectedSemanticIds) {
            if (availableSemanticIds.has(semanticId)) continue;
            const branchIndex = getHeaterTypeBranchIndex(semanticId);
            if (branchIndex !== null) {
                unavailableBranchIndexes.add(branchIndex);
            }
        }

        return unavailableBranchIndexes;
    }

    static setResultFromRaw(result: HeaterOptimizationResult): void {
        this.#currentRawResult = result;
        this.#currentNormalizedResult = normalizeHeaterOptimizationResult(result);
    }

    static clearCurrentNormalizedResult(): void {
        this.#currentNormalizedResult = null;
        this.#currentRawResult = null;
    }

    static getLoadoutJsonBySemanticId(semanticId: string): string | null {
        if (!this.#currentNormalizedResult) return null;
        const entry = this.#currentNormalizedResult.find((item) => item.semanticId === semanticId);
        const loadoutJson = entry?.rowData?.[0];
        return typeof loadoutJson === 'string' ? loadoutJson : null;
    }
}
