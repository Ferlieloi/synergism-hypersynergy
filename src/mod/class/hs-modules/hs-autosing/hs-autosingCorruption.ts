import { CorruptionLoadout, CorruptionLoadoutDefinition, AutosingStrategyPhase } from "../../../types/module-types/hs-autosing-types";
import { HSLogger } from "../../hs-core/hs-logger";
import { HSGlobal } from "../../hs-core/hs-global";
import { HSUtils } from "../../hs-utils/hs-utils";
import { HSGameDialogs } from "../../hs-core/dialogs/hs-game-dialogs";

export const CORRUPTION_NAMES = ['viscosity', 'drought', 'deflation', 'extinction', 'illiteracy', 'recession', 'dilation', 'hyperchallenge'] as const;

export const ZERO_CORRUPTIONS: CorruptionLoadout = {
    viscosity: 0, drought: 0, deflation: 0, extinction: 0,
    illiteracy: 0, recession: 0, dilation: 0, hyperchallenge: 0,
};

export const ANT_CORRUPTIONS: CorruptionLoadout = {
    viscosity: 16, drought: 0, deflation: 16, extinction: 0,
    illiteracy: 5, recession: 16, dilation: 0, hyperchallenge: 16,
};

export class HSAutosingCorruption {
    static readonly #DOM_IMPORT_TIMEOUT_MS = 2000;
    static readonly #DOM_IMPORT_MAX_CLICKS = 5;
    readonly #context = 'HSAutosingCorruption';

    readonly #corrNext: Record<string, HTMLElement | null>;
    readonly #corruptionStatsContainer: HTMLElement | null | undefined;
    readonly #importBtn: HTMLButtonElement;
    #applyCorruptionsFunc: ((json: string) => boolean) | null;
    #lastAppliedCorruptionsJson: string | null = null;

    #loadoutByName: Map<string, Readonly<CorruptionLoadout>> = new Map();
    readonly #loadoutJson = new WeakMap<Readonly<CorruptionLoadout>, string>();

    constructor(
        corrNext: Record<string, HTMLElement | null>,
        corruptionStatsContainer: HTMLElement | null | undefined,
        importBtn: HTMLButtonElement,
    ) {
        this.#corrNext = corrNext;
        this.#corruptionStatsContainer = corruptionStatsContainer;
        this.#importBtn = importBtn;
        this.#applyCorruptionsFunc = null;
    }

    setApplyCorruptionsFunc(fn: ((json: string) => boolean) | null): void {
        this.#applyCorruptionsFunc = fn;
    }

    #corruptionsMatchDOM(target: Readonly<CorruptionLoadout>): boolean {
        for (const name of CORRUPTION_NAMES) {
            const el = this.#corrNext[`corrNext${name}`] ?? this.#corrNext[name];
            if (!el) return false;
            if (parseInt(el.textContent || '0', 10) !== target[name]) return false;
        }
        return true;
    }

    invalidateAppliedCache(): void {
        this.#lastAppliedCorruptionsJson = null;
    }

    async setCorruptions(corruptions: Readonly<CorruptionLoadout>, force: boolean = false): Promise<void> {
        // Only immutable named loadouts have cached JSON. Ad-hoc inputs may change
        // between calls, so keep serializing those from their current values.
        const jsonString = this.#loadoutJson.get(corruptions) ?? JSON.stringify(corruptions);
        if (!force && jsonString === this.#lastAppliedCorruptionsJson) return;

        // Fast path: call applyCorruptions directly — no UI clicks, no prompt, synchronous.
        if (this.#applyCorruptionsFunc) {
            const success = this.#applyCorruptionsFunc(jsonString);
            if (!success) {
                HSLogger.warn(`Failed to set corruptions: ${jsonString}`, this.#context);
                return;
            }
            this.#lastAppliedCorruptionsJson = jsonString;
            HSLogger.debug(() => `Corruptions set: ${jsonString}`, this.#context);
            return;
        }

        // DOM Fallback. Time-limited: it would otherwise click forever if the import never matches
        // (also after autosing has stopped, and a new start waits for autosing's chains to end).
        // Clicks import only while no dialog is open, a few times at most: with a dialog open, each click
        // would queue one more import Prompt, all shown later. Its session answers the Prompt with the loadout,
        // and dismisses the Alert of a rejected import.
        const deadline = performance.now() + HSAutosingCorruption.#DOM_IMPORT_TIMEOUT_MS;
        let importClicks = 0;
        while (true) {
            if (importClicks < HSAutosingCorruption.#DOM_IMPORT_MAX_CLICKS && HSGameDialogs.isQueueIdle()) {
                importClicks++;
                HSGameDialogs.act('corruptionImport', { prompt: { ok: jsonString }, alert: 'dismiss' }, () => this.#importBtn.click());
            }
            await HSUtils.yield();
            if (this.#corruptionsMatchDOM(corruptions)) {
                this.#lastAppliedCorruptionsJson = jsonString;
                HSLogger.debug(() => `Corruptions DOM match: ${jsonString}`, this.#context);
                break;
            }
            if (performance.now() >= deadline) {
                HSLogger.warn(`Failed to set corruptions through the import prompt within ${HSAutosingCorruption.#DOM_IMPORT_TIMEOUT_MS} ms: ${jsonString}`, this.#context);
                break;
            }
        }
    }

    getPhaseCorruptionLoadout(phaseConfig: AutosingStrategyPhase): Readonly<CorruptionLoadout> | null {
        if (phaseConfig.corruptionLoadoutName === null || phaseConfig.corruptionLoadoutName === "") return null;
        if (phaseConfig.corruptionLoadoutName === undefined) return phaseConfig.corruptions ?? null;

        const named = this.#getLoadoutByName(phaseConfig.corruptionLoadoutName);
        return named ?? phaseConfig.corruptions ?? null;
    }

    buildLoadoutCache(defs: CorruptionLoadoutDefinition[]): void {
        this.#loadoutByName.clear();
        for (const d of defs) {
            const loadout = Object.freeze({ ...d.loadout });
            this.#loadoutByName.set(d.name, loadout);
            this.#loadoutJson.set(loadout, JSON.stringify(loadout));
        }
    }
    
    async applyLoadoutByName(name?: string | null): Promise<void> {
        const loadout = this.#getLoadoutByName(name);
        if (!loadout) {
            HSLogger.debug(() => `Loadout not found: ${name ?? "(none)"}`, this.#context);
            return;
        }
        await this.setCorruptions(loadout);
    }

    #getLoadoutByName(name?: string | null): Readonly<CorruptionLoadout> | null {
        if (!name) return null;
        return this.#loadoutByName.get(name) ?? null;
    }
}
