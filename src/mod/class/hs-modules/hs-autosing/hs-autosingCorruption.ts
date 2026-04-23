import { CorruptionLoadout, CorruptionLoadoutDefinition, AutosingStrategyPhase } from "../../../types/module-types/hs-autosing-types";
import { HSLogger } from "../../hs-core/hs-logger";
import { HSGlobal } from "../../hs-core/hs-global";
import { HSUtils } from "../../hs-utils/hs-utils";

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
    readonly #context = 'HSAutosingCorruption';

    readonly #corrNext: Record<string, HTMLElement | null>;
    readonly #corruptionStatsContainer: HTMLElement | null | undefined;
    readonly #corruptionPromptInput: HTMLInputElement;
    readonly #corruptionPromptOkBtn: HTMLButtonElement;
    readonly #importBtn: HTMLButtonElement;
    #applyCorruptionsFunc: ((json: string) => boolean) | null;

    #loadoutByName: Map<string, CorruptionLoadout> = new Map();

    constructor(
        corrNext: Record<string, HTMLElement | null>,
        corruptionStatsContainer: HTMLElement | null | undefined,
        corruptionPromptInput: HTMLInputElement,
        corruptionPromptOkBtn: HTMLButtonElement,
        importBtn: HTMLButtonElement,
    ) {
        this.#corrNext = corrNext;
        this.#corruptionStatsContainer = corruptionStatsContainer;
        this.#corruptionPromptInput = corruptionPromptInput;
        this.#corruptionPromptOkBtn = corruptionPromptOkBtn;
        this.#importBtn = importBtn;
        this.#applyCorruptionsFunc = null;
    }

    setApplyCorruptionsFunc(fn: ((json: string) => boolean) | null): void {
        this.#applyCorruptionsFunc = fn;
    }

    #corruptionsMatchDOM(target: CorruptionLoadout): boolean {
        for (const name of CORRUPTION_NAMES) {
            const el = this.#corrNext[`corrNext${name}`] ?? this.#corrNext[name];
            if (!el) return false;
            if (parseInt(el.textContent || '0', 10) !== target[name]) return false;
        }
        return true;
    }

    async setCorruptions(corruptions: CorruptionLoadout): Promise<void> {
        const jsonString = JSON.stringify(corruptions);

        // Fast path: call applyCorruptions directly — no UI clicks, no prompt, synchronous.
        if (this.#applyCorruptionsFunc) {
            this.#applyCorruptionsFunc(jsonString);
            HSLogger.debug(() => `Corruptions set: ${jsonString}`, this.#context);
            await HSUtils.yield(); // Should not be needed...
            return;
        }

        // DOM Fallback
        while (true) {
            this.#importBtn.click();
            this.#corruptionPromptInput.value = jsonString;
            this.#corruptionPromptOkBtn.click();
            await HSUtils.yield();
            if (this.#corruptionsMatchDOM(corruptions)) {
                HSLogger.debug(() => `Corruptions DOM match: ${jsonString}`, this.#context);
                break;
            }
        }
    }

    getPhaseCorruptionLoadout(phaseConfig: AutosingStrategyPhase): CorruptionLoadout | null {
        if (phaseConfig.corruptionLoadoutName === null || phaseConfig.corruptionLoadoutName === "") return null;
        if (phaseConfig.corruptionLoadoutName === undefined) return phaseConfig.corruptions ?? null;

        const named = this.#getLoadoutByName(phaseConfig.corruptionLoadoutName);
        return named ?? phaseConfig.corruptions ?? null;
    }

    buildLoadoutCache(defs: CorruptionLoadoutDefinition[]): void {
        this.#loadoutByName.clear();
        for (const d of defs) {
            this.#loadoutByName.set(d.name, { ...d.loadout });
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

    #getLoadoutByName(name?: string | null): CorruptionLoadout | null {
        if (!name) return null;
        const l = this.#loadoutByName.get(name);
        return l ? { ...l } : null;
    }
}
