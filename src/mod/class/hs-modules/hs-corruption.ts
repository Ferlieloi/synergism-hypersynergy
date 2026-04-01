import { HSElementHooker } from "../hs-core/hs-elementhooker";
import { HSLogger } from "../hs-core/hs-logger";
import { CorruptionLevels } from "../../types/data-types/hs-player-savedata";

export type HSCorruptionValueKey = keyof CorruptionLevels;

export interface HSCorruptionValueCells {
    viscosity: HTMLElement | null;
    drought: HTMLElement | null;
    deflation: HTMLElement | null;
    extinction: HTMLElement | null;
    illiteracy: HTMLElement | null;
    recession: HTMLElement | null;
    dilation: HTMLElement | null;
    hyperchallenge: HTMLElement | null;
}

export interface HSCorruptionLoadout {
    slotIndex: number; // 1-based slot identifier
    name: string;
    levels: CorruptionLevels;
    loadButton: HTMLButtonElement | null;
    saveButton: HTMLButtonElement | null;
    valueCells: HSCorruptionValueCells;
}

export type HSCorruptionValuesMap = Record<HSCorruptionValueKey, HTMLElement | null>;

export class HSCorruption {
    static readonly corruptionNames: HSCorruptionValueKey[] = [
        "viscosity",
        "drought",
        "deflation",
        "extinction",
        "illiteracy",
        "recession",
        "dilation",
        "hyperchallenge",
    ];

    static cachedCurrent: HSCorruptionValuesMap | null = null;
    static cachedNext: HSCorruptionValuesMap | null = null;

    private static corruptionObservers: Array<(current: CorruptionLevels, next: CorruptionLevels) => void> = [];
    private static mutationObserver: MutationObserver | null = null;


    // =================================
    // ------------ Public -------------
    // =================================

    static async getUserLoadouts(): Promise<HSCorruptionLoadout[]> {
        await HSElementHooker.HookElement('#corruptionLoadouts');
        const rows = Array.from(document.querySelectorAll<HTMLTableRowElement>('#corruptionLoadouts tr'));
        const validRows = rows.slice(1).filter(row => {
            const name = row.querySelector<HTMLTableCellElement>('.corrLoadoutName')?.textContent ?? '';
            const normalized = HSCorruption.#normalizeLoadoutName(name.toLowerCase());
            return normalized !== 'next' && normalized.length > 0;
        });

        return validRows.map((row, index) => HSCorruption.#getLoadoutFromRow(row, index));
    }

    static matches(levelsA: CorruptionLevels, levelsB: CorruptionLevels): boolean {
        return HSCorruption.corruptionNames.every(name => levelsA[name] === levelsB[name]);
    }

    // =================================
    // ------------ Helpers ------------
    // =================================

    static #normalizeLoadoutName(name: string): string {
        return name.trim().replace(/[:\s]+$/g, "");
    }

    static #getValueCellsFromRow(row: HTMLTableRowElement): HSCorruptionValueCells {
        return {
            viscosity: row.querySelector<HTMLElement>(".testviscosity"),
            drought: row.querySelector<HTMLElement>(".testdrought"),
            deflation: row.querySelector<HTMLElement>(".testdeflation"),
            extinction: row.querySelector<HTMLElement>(".testextinction"),
            illiteracy: row.querySelector<HTMLElement>(".testilliteracy"),
            recession: row.querySelector<HTMLElement>(".testrecession"),
            dilation: row.querySelector<HTMLElement>(".testdilation"),
            hyperchallenge: row.querySelector<HTMLElement>(".testhyperchallenge"),
        };
    }

    static getLevelsFromCells(cells: HSCorruptionValueCells): CorruptionLevels {
        return {
            viscosity: Number(cells.viscosity?.textContent ?? 0),
            drought: Number(cells.drought?.textContent ?? 0),
            deflation: Number(cells.deflation?.textContent ?? 0),
            extinction: Number(cells.extinction?.textContent ?? 0),
            illiteracy: Number(cells.illiteracy?.textContent ?? 0),
            recession: Number(cells.recession?.textContent ?? 0),
            dilation: Number(cells.dilation?.textContent ?? 0),
            hyperchallenge: Number(cells.hyperchallenge?.textContent ?? 0),
        };
    }

    static getLevelsFromCurrentElements(current: HSCorruptionValuesMap): CorruptionLevels {
        const result = {} as any;
        HSCorruption.corruptionNames.forEach((name) => {
            result[name] = Number(current[name]?.textContent ?? 0);
        });
        return result as CorruptionLevels;
    }

    static getLevelsFromNextElements(next: HSCorruptionValuesMap): CorruptionLevels {
        const result = {} as any;
        HSCorruption.corruptionNames.forEach((name) => {
            result[name] = Number(next[name]?.textContent ?? 0);
        });
        return result as CorruptionLevels;
    }

    static #getLoadoutFromRow(row: HTMLTableRowElement, slotIndex: number): HSCorruptionLoadout { 
        const nameCell = row.querySelector<HTMLTableCellElement>(".corrLoadoutName");
        const rawName = nameCell?.textContent ?? `Loadout ${slotIndex + 1}`;
        const slotName = HSCorruption.#normalizeLoadoutName(rawName);

        const valueCells = HSCorruption.#getValueCellsFromRow(row);
        const levels = HSCorruption.getLevelsFromCells(valueCells);

        return {
            slotIndex: slotIndex + 1,
            name: slotName,
            levels,
            loadButton: row.querySelector<HTMLButtonElement>(".corrLoad"),
            saveButton: row.querySelector<HTMLButtonElement>(".corrSave"),
            valueCells,
        };
    }

    static updateLoadout(loadout: HSCorruptionLoadout): void {
        loadout.levels = HSCorruption.getLevelsFromCells(loadout.valueCells);
    }

    static getCurrentCorruptionLevelsCached(): CorruptionLevels {
        if (!HSCorruption.cachedCurrent) {
            throw new Error('HSCorruption cached current values not initialized');
        }

        return HSCorruption.getLevelsFromCurrentElements(HSCorruption.cachedCurrent);
    }

    static getNextCorruptionLevelsCached(): CorruptionLevels {
        if (!HSCorruption.cachedNext) {
            throw new Error('HSCorruption cached next values not initialized');
        }

        return HSCorruption.getLevelsFromNextElements(HSCorruption.cachedNext);
    }

    static async getCurrentCorruptionLevels(): Promise<CorruptionLevels> {
        if (!HSCorruption.cachedCurrent) {
            await HSCorruption.cacheCorruptionElements();
        }

        return HSCorruption.getLevelsFromCurrentElements(HSCorruption.cachedCurrent!);
    }

    static async getNextCorruptionLevels(): Promise<CorruptionLevels> {
        if (!HSCorruption.cachedNext) {
            await HSCorruption.cacheCorruptionElements();
        }

        return HSCorruption.getLevelsFromNextElements(HSCorruption.cachedNext!);
    }


    // =================================
    // ------------ Caching ------------
    // =================================
    
    static async cacheCorruptionElements(): Promise<void> {
        await HSElementHooker.HookElement('#corruptionLoadouts');

        const current = {} as HSCorruptionValuesMap;
        const next = {} as HSCorruptionValuesMap;

        HSCorruption.corruptionNames.forEach((name) => {
            current[name] = document.getElementById(`corrCurrent${name}`);
            next[name] = document.getElementById(`corrNext${name}`);

            if (!current[name] || !next[name]) {
                if (HSLogger) {
                    HSLogger.warn(`HSCorruption.cacheCorruptionElements: Missing corrCurrent/corrNext element for ${name}`, 'HSCorruption');
                }
            }
        });

        HSCorruption.cachedCurrent = current;
        HSCorruption.cachedNext = next;
    }

    static clearCache(): void {
        HSCorruption.stopCorruptionObservation();
        HSCorruption.cachedCurrent = null;
        HSCorruption.cachedNext = null;
    }


    // =================================
    // ----------- Observers -----------
    // =================================

    static observeCurrentCorruptions(callback: (current: CorruptionLevels, next: CorruptionLevels) => void): () => void {
        HSCorruption.corruptionObservers.push(callback);

        // Immediately emit current values if available.
        if (HSCorruption.cachedCurrent && HSCorruption.cachedNext) {
            callback(HSCorruption.getLevelsFromCurrentElements(HSCorruption.cachedCurrent), HSCorruption.getLevelsFromNextElements(HSCorruption.cachedNext));
        }

        const unsubscribe = () => {
            HSCorruption.corruptionObservers = HSCorruption.corruptionObservers.filter((cb) => cb !== callback);
        };

        return unsubscribe;
    }

    static async startCorruptionObservation(): Promise<void> {
        await HSCorruption.cacheCorruptionElements();

        if (!HSCorruption.cachedCurrent || !HSCorruption.cachedNext) {
            return;
        }

        if (HSCorruption.mutationObserver) {
            return;
        }

        const elements = [
            ...Object.values(HSCorruption.cachedCurrent),
            ...Object.values(HSCorruption.cachedNext),
        ].filter(Boolean) as HTMLElement[];

        if (elements.length === 0) {
            return;
        }

        const notify = () => {
            if (!HSCorruption.cachedCurrent || !HSCorruption.cachedNext) return;
            const current = HSCorruption.getLevelsFromCurrentElements(HSCorruption.cachedCurrent);
            const next = HSCorruption.getLevelsFromNextElements(HSCorruption.cachedNext);
            HSCorruption.corruptionObservers.forEach((cb) => cb(current, next));
        };

        HSCorruption.mutationObserver = new MutationObserver(() => {
            notify();
        });

        elements.forEach((element) => {
            HSCorruption.mutationObserver?.observe(element, {
                childList: true,
                characterData: true,
                subtree: true,
            });
        });

        // Initial notification.
        notify();
    }

    static stopCorruptionObservation(): void {
        if (HSCorruption.mutationObserver) {
            HSCorruption.mutationObserver.disconnect();
            HSCorruption.mutationObserver = null;
        }

        HSCorruption.corruptionObservers = [];
    }
}
