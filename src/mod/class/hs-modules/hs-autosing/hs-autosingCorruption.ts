import { CorruptionLoadout, CorruptionLoadoutDefinition, AutosingStrategyPhase } from "../../../types/module-types/hs-autosing-types";
import { HSLogger } from "../../hs-core/hs-logger";
import { HSGlobal } from "../../hs-core/hs-global";
import { HSUtils } from "../../hs-utils/hs-utils";

export const CORRUPTION_NAMES = ['viscosity', 'drought', 'deflation', 'extinction', 'illiteracy', 'recession', 'dilation', 'hyperchallenge'] as const;

export const ZERO_CORRUPTIONS: CorruptionLoadout = {
    viscosity: 0,
    drought: 0,
    deflation: 0,
    extinction: 0,
    illiteracy: 0,
    recession: 0,
    dilation: 0,
    hyperchallenge: 0,
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
            const el = this.#corrNext[name];
            if (!el) return false;
            if (parseInt(el.textContent || '0', 10) !== target[name]) return false;
        }
        return true;
    }

    #corruptionsMatchExposedPlayer(target: CorruptionLoadout): boolean {
        const next = HSGlobal.exposedPlayer!.corruptions?.next;
        if (!next) return false;
        for (const name of CORRUPTION_NAMES) {
            if (next.getLevel(name) !== target[name]) return false;
        }
        return true;
    }

    async setCorruptions(corruptions: CorruptionLoadout): Promise<void> {
        const jsonString = JSON.stringify(corruptions);

        // Fast path: call applyCorruptions directly — no UI clicks, no prompt, synchronous.
        if (this.#applyCorruptionsFunc) {
            this.#applyCorruptionsFunc(jsonString);
            HSLogger.debug(() => `Corruptions set (fast): ${jsonString}`, this.#context);
            // while(!await this.#waitForCorruptionMatch(corruptions, 500));    // Should not be needed...
            return;
        }

        // Fallback: click-based flow with DOM observer.
        this.#importBtn.click();
        this.#corruptionPromptInput.value = jsonString;
        this.#corruptionPromptOkBtn.click();
        while(!await this.#waitForCorruptionMatch(corruptions, 500));
        HSLogger.debug(() => `Corruptions set: ${jsonString}`, this.#context);
        return;
    }

    async #waitForCorruptionMatch(targetCorruptions: CorruptionLoadout, timeoutMs = 500): Promise<boolean> {
        // Fast path: player.corruptions.next is updated synchronously by the game's click handler.
        // This one should not be needed since setCorruptions should handle it, and we're already supposed to be on the fall-back path...
        if (HSGlobal.exposedPlayer) {
            if (this.#corruptionsMatchExposedPlayer(targetCorruptions)) return true;
            const endTime = performance.now() + timeoutMs;
            while (performance.now() < endTime) {
                await HSUtils.waitForNextTick();
                if (this.#corruptionsMatchExposedPlayer(targetCorruptions)) return true;
            }
            return false;
        }

        // Fallback: DOM observer
        if (this.#corruptionsMatchDOM(targetCorruptions)) return true;

        const container = this.#corruptionStatsContainer;
        if (!container) return false;

        return new Promise<boolean>((resolve) => {
            let finished = false;
            const cleanup = (result: boolean) => {
                if (finished) return;
                finished = true;
                clearTimeout(timeoutId);
                observer.disconnect();
                resolve(result);
            };
            const observer = new MutationObserver(() => {
                if (this.#corruptionsMatchDOM(targetCorruptions)) cleanup(true);
            });
            const timeoutId = window.setTimeout(() => { cleanup(false); }, timeoutMs);

            observer.observe(container, { childList: true, characterData: true, subtree: true });
            if (this.#corruptionsMatchDOM(targetCorruptions)) {
                cleanup(true);
            }
        });
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
