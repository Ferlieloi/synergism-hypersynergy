import { CorruptionLoadout, CorruptionLoadoutDefinition, AutosingStrategyPhase } from "../../../types/module-types/hs-autosing-types";
import { HSLogger } from "../../hs-core/hs-logger";
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
    }

    async setCorruptions(corruptions: CorruptionLoadout): Promise<void> {
        const jsonString = JSON.stringify(corruptions);

        while (true) {
            this.#importBtn.click();
            this.#corruptionPromptInput.value = jsonString;

            HSUtils.clickWithoutSleep(this.#corruptionPromptOkBtn);
            const success = await this.#waitForCorruptionMatch(corruptions, 500);
            if (success) {
                HSLogger.debug(() => `Corruptions set: ${this.#stringifyCorruptions(corruptions)}`, this.#context);
                break;
            }
            HSLogger.debug(() => `Corruptions did not match after timeout: ${this.#stringifyCorruptions(this.#getNextCorruptionsFromCache())}`, this.#context);
        }
    }

    getPhaseCorruptionLoadout(phaseConfig: AutosingStrategyPhase): CorruptionLoadout | null {
        if (phaseConfig.corruptionLoadoutName === null || phaseConfig.corruptionLoadoutName === "") {
            return null;
        }

        if (phaseConfig.corruptionLoadoutName === undefined) {
            return phaseConfig.corruptions ?? null;
        }

        const named = this.#getLoadoutByName(phaseConfig.corruptionLoadoutName);
        return named ?? phaseConfig.corruptions ?? null;
    }

    async applyLoadoutByName(name?: string | null): Promise<void> {
        const loadout = this.#getLoadoutByName(name);
        if (!loadout) {
            HSLogger.debug(() => `Loadout not found: ${name ?? "(none)"}`, this.#context);
            return;
        }
        await this.setCorruptions(loadout);
    }

    buildLoadoutCache(defs: CorruptionLoadoutDefinition[]): void {
        this.#loadoutByName.clear();
        for (const d of defs) {
            this.#loadoutByName.set(d.name, { ...d.loadout });
        }
    }

    #corruptionsMatchDOM(target: CorruptionLoadout): boolean {
        for (const name of CORRUPTION_NAMES) {
            const el = this.#corrNext[name];
            if (!el) return false;
            if (parseInt(el.textContent || '0', 10) !== target[name]) return false;
        }
        return true;
    }

    #getNextCorruptionsFromCache(): CorruptionLoadout {
        const result = {} as CorruptionLoadout;
        for (const name of CORRUPTION_NAMES) {
            const el = this.#corrNext[name];
            result[name] = el ? parseInt(el.textContent || '0', 10) : 0;
        }
        return result;
    }

    async #waitForCorruptionMatch(targetCorruptions: CorruptionLoadout, timeoutMs = 500): Promise<boolean> {
        if (this.#corruptionsMatchDOM(targetCorruptions)) { return true; }

        const container = this.#corruptionStatsContainer;
        if (!container) { return false; }

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
                if (this.#corruptionsMatchDOM(targetCorruptions)) { cleanup(true); }
            });
            const timeoutId = window.setTimeout(() => { cleanup(false); }, timeoutMs);

            observer.observe(container, { childList: true, characterData: true, subtree: true });
            if (this.#corruptionsMatchDOM(targetCorruptions)) {
                cleanup(true);
            }
        });
    }

    #getLoadoutByName(name?: string | null): CorruptionLoadout | null {
        if (!name) return null;
        const l = this.#loadoutByName.get(name);
        return l ? { ...l } : null;
    }

    #stringifyCorruptions(loadout: CorruptionLoadout): string {
        return CORRUPTION_NAMES.map(name => loadout[name]).join(',');
    }
}
