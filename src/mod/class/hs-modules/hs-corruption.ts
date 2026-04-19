import { HSElementHooker } from "../hs-core/hs-elementhooker";
import { HSLogger } from "../hs-core/hs-logger";
import { HSUtils } from "../hs-utils/hs-utils";

export interface HSCorruptionLevels {
    viscosity: number;
    drought: number;
    deflation: number;
    extinction: number;
    illiteracy: number;
    recession: number;
    dilation: number;
    hyperchallenge: number;
}

export interface HSCorruptionLoadoutElements {
    viscosity: HTMLElement | null;
    drought: HTMLElement | null;
    deflation: HTMLElement | null;
    extinction: HTMLElement | null;
    illiteracy: HTMLElement | null;
    recession: HTMLElement | null;
    dilation: HTMLElement | null;
    hyperchallenge: HTMLElement | null;
}

export interface HSCorruptionUserLoadout {
    name: string;
    levels: HSCorruptionLevels;
    elements: HSCorruptionLoadoutElements;
    loadButton: HTMLButtonElement | null;
    saveButton: HTMLButtonElement | null;
}

export type HSCorruptionUserLoadouts = HSCorruptionUserLoadout[];

export class HSCorruption {
    static readonly #context = 'HSCorruption';

    static readonly #CORRUPTION_NAMES: (keyof HSCorruptionLevels)[] = [
        "viscosity",
        "drought",
        "deflation",
        "extinction",
        "illiteracy",
        "recession",
        "dilation",
        "hyperchallenge",
    ];
    static readonly #ZERO_CORRUPTIONS: HSCorruptionLevels = {
        viscosity: 0,
        drought: 0,
        deflation: 0,
        extinction: 0,
        illiteracy: 0,
        recession: 0,
        dilation: 0,
        hyperchallenge: 0,
    };
    static #corruptionObservers: Array<(current: HSCorruptionLevels, next: HSCorruptionLevels) => void> = [];
    static #mutationObserver: MutationObserver | null = null;
    
    static #currentCorruptionEls: HSCorruptionLoadoutElements | null = null;
    static #nextCorruptionEls: HSCorruptionLoadoutElements | null = null;
    static #currentCorruptionLevels: HSCorruptionLevels | null = null;
    static #nextCorruptionLevels: HSCorruptionLevels | null = null;
    static #userLoadouts: HSCorruptionUserLoadouts = [];
    
    static #corruptionPromptInput: HTMLInputElement | null = null;
    static #corruptionPromptOkBtn: HTMLButtonElement | null = null;
    static #importBtn: HTMLButtonElement | null = null;
    static #importSleepTime = 10;

    static readonly #CORRUPTION_ICON_STORAGE_KEY = 'hs-corruption-loadout-icons';
    static #corruptionLoadoutIcons: Map<number, string> = new Map();

    // =================================
    // ------- Helpers & Getters -------
    // =================================

    static match(a: HSCorruptionLevels, b: HSCorruptionLevels): boolean {
        return  a.viscosity      === b.viscosity    &&
                a.drought        === b.drought      &&
                a.deflation      === b.deflation    &&
                a.extinction     === b.extinction   &&
                a.illiteracy     === b.illiteracy   &&
                a.recession      === b.recession    &&
                a.dilation       === b.dilation     &&
                a.hyperchallenge === b.hyperchallenge;
    }

    static get corruptionNames(): (keyof HSCorruptionLevels)[] {
        return [...HSCorruption.#CORRUPTION_NAMES];
    }

    static matches(a: HSCorruptionLevels, b: HSCorruptionLevels): boolean {
        return HSCorruption.match(a, b);
    }

    static observeCorruptions(callback: (current: HSCorruptionLevels, next: HSCorruptionLevels) => void): () => void {
        return HSCorruption.observeCorruption(callback);
    }

    static async cacheCorruptionElements(): Promise<void> {
        await HSCorruption.#cacheLoadedCorruptionElements();
    }

    static async getBothLoadedCorruptions(): Promise<{ current: HSCorruptionLevels; next: HSCorruptionLevels }> {
        await HSCorruption.refreshLoadedCorruptions();

        return {
            current: HSCorruption.#currentCorruptionLevels ?? HSCorruption.#ZERO_CORRUPTIONS,
            next: HSCorruption.#nextCorruptionLevels ?? HSCorruption.#ZERO_CORRUPTIONS,
        };
    }

    static updateLoadout(loadout: HSCorruptionUserLoadout): void {
        HSLogger.debug(() => 'HSCorruption.updateLoadout: no-op placeholder', this.#context);
    }

    static #buildCorruptionLevels(elems: HSCorruptionLoadoutElements): HSCorruptionLevels {
        const getVal = (name: keyof HSCorruptionLevels) => {
            const el = elems[name];
            return el ? parseInt(el.textContent || '0', 10) : 0;
        };

        return {
            viscosity: getVal("viscosity"),
            drought: getVal("drought"),
            deflation: getVal("deflation"),
            extinction: getVal("extinction"),
            illiteracy: getVal("illiteracy"),
            recession: getVal("recession"),
            dilation: getVal("dilation"),
            hyperchallenge: getVal("hyperchallenge")
        };
    }

    /** Return cached user corruption loadouts if available; otherwise cache them first. */
    static async getUserLoadouts(): Promise<HSCorruptionUserLoadouts> {
        if (!HSCorruption.#userLoadouts.length) await HSCorruption.#cacheUserLoadoutsElements();
        return this.#userLoadouts;
    }

    /** Return the currently loaded corruption levels (refresh from DOM first). */
    static async getCurrentLoadedCorruption(): Promise<HSCorruptionLevels> {
        if (!HSCorruption.#currentCorruptionEls) { await HSCorruption.#cacheLoadedCorruptionElements(); }
        await HSCorruption.refreshLoadedCorruptions();
        return this.#currentCorruptionLevels ?? this.#ZERO_CORRUPTIONS;
    }

    /** Return the next planned corruption levels (refresh from DOM first). */
    static async getNextLoadedCorruption(): Promise<HSCorruptionLevels> {
        if (!HSCorruption.#nextCorruptionEls) { await HSCorruption.#cacheLoadedCorruptionElements(); }
        await HSCorruption.refreshLoadedCorruptions();
        return this.#nextCorruptionLevels ?? this.#ZERO_CORRUPTIONS;
    }

    /** Return both current and next corruption levels after refresh. */
    static async getBothLoadedCorruption(): Promise<{ current: HSCorruptionLevels; next: HSCorruptionLevels }> {
        if (!HSCorruption.#currentCorruptionEls || !HSCorruption.#nextCorruptionEls) { await HSCorruption.#cacheLoadedCorruptionElements(); }
        await HSCorruption.refreshLoadedCorruptions();
        return {
            current: this.#currentCorruptionLevels ?? this.#ZERO_CORRUPTIONS,
            next: this.#nextCorruptionLevels ?? this.#ZERO_CORRUPTIONS
        };
    }

    /** Refresh the cached current/next corruption numeric levels from DOM elements. */
    static async refreshLoadedCorruptions(): Promise<void> {
        if (!HSCorruption.#currentCorruptionEls || !HSCorruption.#nextCorruptionEls) { await HSCorruption.#cacheLoadedCorruptionElements(); }

        if (HSCorruption.#currentCorruptionEls) {
            HSCorruption.#currentCorruptionLevels = HSCorruption.#buildCorruptionLevels(HSCorruption.#currentCorruptionEls);
        }

        if (HSCorruption.#nextCorruptionEls) {
            HSCorruption.#nextCorruptionLevels = HSCorruption.#buildCorruptionLevels(HSCorruption.#nextCorruptionEls);
        }
    }
      

    // =================================
    // ---------- DOM caching ----------
    // =================================

    /** Cache corruption import dialog DOM elements for later operations. */
    static async #cacheImportCorruptionElements(): Promise<void> {
        HSCorruption.#importBtn = document.querySelector<HTMLButtonElement>('#corruptionLoadoutTable button.corrImport');
        HSCorruption.#corruptionPromptInput = document.getElementById('prompt_text') as HTMLInputElement | null;
        HSCorruption.#corruptionPromptOkBtn = document.getElementById('ok_prompt') as HTMLButtonElement | null;
    }

    /** Cache corruption table DOM elements for current/next corruption values. */
    static async #cacheLoadedCorruptionElements(): Promise<void> {
        await HSElementHooker.HookElement('#corruptionStats');

        const current = {} as HSCorruptionLoadoutElements;
        const next = {} as HSCorruptionLoadoutElements;

        HSCorruption.#CORRUPTION_NAMES.forEach((name) => {
            current[name] = document.getElementById(`corrCurrent${name}`);
            next[name] = document.getElementById(`corrNext${name}`);
        });

        HSCorruption.#currentCorruptionEls = current;
        HSCorruption.#nextCorruptionEls = next;
    }

    /** Cache user-defined corruption loadout entries from the table. */
    static async #cacheUserLoadoutsElements(): Promise<void> {
        await HSElementHooker.HookElement('#corruptionLoadoutTable');

        const names = HSCorruption.#CORRUPTION_NAMES;
        const rows = Array.from(document.querySelectorAll<HTMLTableRowElement>('#corruptionLoadoutTable tr'));
        const validRows = rows
            .slice(1) // First line is the "Next" loadout
            .filter(row => {
                const name = row.querySelector<HTMLTableCellElement>('.corrLoadoutName')?.textContent ?? '';
                const normalized = name.slice(0, -1); // Last character is ':'
                return normalized !== 'Next' && normalized.length > 0;
            });
            
        HSCorruption.#userLoadouts = validRows.map((row) => {
            const nameCell = row.querySelector<HTMLTableCellElement>('.corrLoadoutName');
            const slotName = nameCell?.textContent?.slice(0, -1) ?? '';

            const elements = {} as HSCorruptionLoadoutElements;
            const levels = {} as HSCorruptionLevels;

            for (let i = 0; i < names.length; i++) {
                const key = names[i];
                const el = row.querySelector<HTMLElement>(`.test${key}`);
                elements[key] = el;
                const raw = el?.textContent ?? '0';
                levels[key] = Number(raw) || 0;
            }

            return {
                name: slotName,
                levels,
                elements,
                loadButton: row.querySelector<HTMLButtonElement>('.corrLoad'),
                saveButton: row.querySelector<HTMLButtonElement>('.corrSave'),
            };
        });
    }

    static loadCorruptionLoadoutIcons(): void {
        try {
            const raw = localStorage.getItem(HSCorruption.#CORRUPTION_ICON_STORAGE_KEY);
            if (!raw) {
                HSCorruption.#corruptionLoadoutIcons = new Map();
                return;
            }
            const parsed = JSON.parse(raw) as Record<string, string>;
            HSCorruption.#corruptionLoadoutIcons = new Map(Object.entries(parsed).map(([k, v]) => [Number(k), v] as [number, string]));
        } catch (error) {
            HSLogger.warn(`HSCorruption.loadCorruptionLoadoutIcons failed: ${String(error)}`, HSCorruption.#context);
            HSCorruption.#corruptionLoadoutIcons = new Map();
        }
    }

    static saveCorruptionLoadoutIcons(): void {
        try {
            const obj: Record<string, string> = {};
            HSCorruption.#corruptionLoadoutIcons.forEach((url, key) => {
                obj[String(key)] = url;
            });
            localStorage.setItem(HSCorruption.#CORRUPTION_ICON_STORAGE_KEY, JSON.stringify(obj));
        } catch (error) {
            HSLogger.warn(`HSCorruption.saveCorruptionLoadoutIcons failed: ${String(error)}`, HSCorruption.#context);
        }
    }

    static getCorruptionLoadoutIcon(slotKey: number): string | undefined {
        return HSCorruption.#corruptionLoadoutIcons.get(slotKey);
    }

    static setCorruptionLoadoutIcon(slotKey: number, iconUrl: string): void {
        HSCorruption.#corruptionLoadoutIcons.set(slotKey, iconUrl);
        HSCorruption.saveCorruptionLoadoutIcons();
    }

    static clearCorruptionLoadoutIcon(slotKey: number): void {
        HSCorruption.#corruptionLoadoutIcons.delete(slotKey);
        HSCorruption.saveCorruptionLoadoutIcons();
    }

    static clearCache(): void {
        HSCorruption.stopCorruptionObservation();
        HSCorruption.#currentCorruptionEls = null;
        HSCorruption.#nextCorruptionEls = null;
        HSCorruption.#currentCorruptionLevels = null;
        HSCorruption.#nextCorruptionLevels = null;
        HSCorruption.#userLoadouts = [];
        HSCorruption.#corruptionPromptInput = null;
        HSCorruption.#corruptionPromptOkBtn = null;
        HSCorruption.#importBtn = null;
        HSCorruption.#corruptionLoadoutIcons = new Map();
    }


    // =================================
    // -------- Observers Setup --------
    // =================================

    /** Subscribe to corruption state updates and returns an unsubscribe callback. */
    static observeCorruption(callback: (current: HSCorruptionLevels, next: HSCorruptionLevels) => void): () => void {
        if (!HSCorruption.#corruptionObservers.includes(callback)) {
            HSCorruption.#corruptionObservers.push(callback);
        }

        // Immediately emit current values if available.
        if (HSCorruption.#currentCorruptionLevels && HSCorruption.#nextCorruptionLevels) {
            callback(HSCorruption.#currentCorruptionLevels, HSCorruption.#nextCorruptionLevels);
        }

        const unsubscribe = () => {
            HSCorruption.#corruptionObservers = HSCorruption.#corruptionObservers.filter((cb) => cb !== callback);
        };

        return unsubscribe;
    }

    /** Notify all registered observers of the current corruption match state. */
    static #notifyCorruptionObservers(): void {
        const current = HSCorruption.#currentCorruptionLevels;
        const next = HSCorruption.#nextCorruptionLevels;

        if (!current || !next) {
            HSLogger.debug(() => 'HSCorruption.#notifyCorruptionObservers: corruption levels not ready', this.#context);
            return;
        }

        HSCorruption.#corruptionObservers.forEach((cb) => cb(current, next));
    }

    /** Start observing changes on the corruption loadout table and notify subscribers. */
    static async startCorruptionObservationContainer(containerSelector: string = '#corruptionStatsLoadouts'): Promise<void> {
        await HSCorruption.#cacheLoadedCorruptionElements();

        if (HSCorruption.#mutationObserver) { return; }

        const container = document.querySelector<HTMLElement>(containerSelector);
        if (!container) {
            HSLogger.warn(`startCorruptionObservationContainer: container not found (${containerSelector})`, HSCorruption.#context);
            return;
        }

        const notify = async () => {
            await HSCorruption.refreshLoadedCorruptions();
            HSCorruption.#notifyCorruptionObservers();
        };

        HSCorruption.#mutationObserver = new MutationObserver(() => { notify(); });
        HSCorruption.#mutationObserver.observe(container, {
            childList: true,
            characterData: true,
            subtree: true,
        });

        // Initial notification.
        notify();
    }

    static stopCorruptionObservationContainer(): void {
        HSCorruption.stopCorruptionObservation();
    }

    static stopCorruptionObservation(): void {
        if (HSCorruption.#mutationObserver) {
            HSCorruption.#mutationObserver.disconnect();
            HSCorruption.#mutationObserver = null;
        }
    }


    // =================================
    // ------------ Import -------------
    // =================================

    /** Import corruption levels via the game import UI (no confirmation). */
    static async importCorruption(corruptions: HSCorruptionLevels): Promise<void> {
        if (!HSCorruption.#importBtn || !HSCorruption.#corruptionPromptInput || !HSCorruption.#corruptionPromptOkBtn) {
            await HSCorruption.#cacheImportCorruptionElements();
        }

        if (!HSCorruption.#importBtn || !HSCorruption.#corruptionPromptInput || !HSCorruption.#corruptionPromptOkBtn) {
            HSLogger.warn('HSCorruption.importCorruption: Could not find import UI elements', this.#context);
            return;
        }

        const jsonString = JSON.stringify(corruptions);
        HSCorruption.#importBtn.click();
        HSCorruption.#corruptionPromptInput.value = jsonString;
        HSCorruption.#corruptionPromptOkBtn.click();
    }

    /** Import corruption and poll until applied, returns success/failure. */
    static async importCorruptionAndConfirm(corruptions: HSCorruptionLevels): Promise<boolean> {
        if (!HSCorruption.#importBtn || !HSCorruption.#corruptionPromptInput || !HSCorruption.#corruptionPromptOkBtn) {
            await HSCorruption.#cacheImportCorruptionElements();
        }
        if (!HSCorruption.#importBtn || !HSCorruption.#corruptionPromptInput || !HSCorruption.#corruptionPromptOkBtn || !HSCorruption.#nextCorruptionLevels) {
            HSLogger.warn("HSCorruption.importCorruptionAndConfirm: Could not find import UI elements", this.#context);
            return false;
        }

        const jsonString = JSON.stringify(corruptions);

        for (let attempt = 0; attempt < 30; attempt++) {
            HSCorruption.#importBtn.click();
            HSCorruption.#corruptionPromptInput.value = jsonString;
            HSCorruption.#corruptionPromptOkBtn.click();

            await HSUtils.sleep(HSCorruption.#importSleepTime);

            await HSCorruption.refreshLoadedCorruptions();
            if (HSCorruption.match(HSCorruption.#nextCorruptionLevels, corruptions)) {
                HSLogger.debug(() => `HSCorruption.importCorruptionAndConfirm: success (${Object.values(corruptions).join(',')})`, this.#context);
                return true;
            }

            HSLogger.debug(() => `HSCorruption.importCorruptionAndConfirm: retry ${attempt + 1}/30`, this.#context);
        }

        HSLogger.warn("HSCorruption.importCorruptionAndConfirm: failed to apply target corruption values", this.#context);
        return false;
    }
}
