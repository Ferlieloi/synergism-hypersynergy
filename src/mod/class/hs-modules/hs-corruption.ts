import { HSElementHooker } from "../hs-core/hs-elementhooker";
import { HSLogger } from "../hs-core/hs-logger";
import { HSUtils } from "../hs-utils/hs-utils";
import { HSGameDialogs } from "../hs-core/dialogs/hs-game-dialogs";
import { HSGlobal } from "../hs-core/hs-global";

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

/**
 * Class: HSCorruption
 * IsExplicitHSModule: No
 * Description: The mod's additions to the game's "Corruption loadouts" header module, each with its setting:
 *     the cleanse button on its icon (corruptionHeaderCleanse) and the corruption levels above it (corruptionHeaderLevels).
 *     Also imports a corruption loadout into the next corruptions, for the cleanse. Autosing has its own (HSAutosingCorruption).
 */
export class HSCorruption {
    static readonly #context = 'HSCorruption';
    static readonly #DOM_IMPORT_TIMEOUT_MS = 2000;
    static readonly #DOM_IMPORT_MAX_CLICKS = 5;
    static readonly #HEADER_MODULE_ID = 'corruptionLoadoutsHeader';
    static readonly #CLEANSE_ICON_SRC = 'Pictures/Default/CorruptExit.png';

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
    static readonly ZERO_CORRUPTIONS: HSCorruptionLevels = {
        viscosity: 0,
        drought: 0,
        deflation: 0,
        extinction: 0,
        illiteracy: 0,
        recession: 0,
        dilation: 0,
        hyperchallenge: 0,
    };

    static #nextCorruptionEls: Partial<Record<keyof HSCorruptionLevels, HTMLElement | null>> | null = null;
    static #importBtn: HTMLButtonElement | null = null;

    /** The module's icon while it is the cleanse button, with the game's own picture to put back. */
    static #cleanseIcon: { icon: HTMLImageElement; gameSrc: string } | null = null;
    static #levelsDisplay: { element: HTMLElement; current: HTMLElement; next: HTMLElement; observer: MutationObserver } | null = null;


    // =================================
    // -------- Header: cleanse --------
    // =================================

    /**
     * The icon at the start of the game's "Corruption loadouts" header module as a cleanse button, as on the old
     * corruption quickbar: one click, no confirmation. Action of the corruptionHeaderCleanse setting.
     * In the header's edit mode the game swallows every click inside a module, so moving the module can't cleanse.
     */
    static setHeaderCleanse(enabled: boolean): void {
        if (!enabled) {
            const saved = HSCorruption.#cleanseIcon;
            if (!saved) return;
            HSCorruption.#cleanseIcon = null;
            saved.icon.removeEventListener('click', HSCorruption.#cleanse);
            saved.icon.classList.remove('hs-corruption-cleanse');
            saved.icon.setAttribute('src', saved.gameSrc);
            saved.icon.removeAttribute('title');
            return;
        }

        if (HSCorruption.#cleanseIcon) return;
        // A child of the module: the levels line (setHeaderLevels) holds no image
        const icon = document.querySelector<HTMLImageElement>(`#${HSCorruption.#HEADER_MODULE_ID} > img`);
        if (!icon) { HSLogger.debug(() => 'No corruption loadouts module in the game header: no cleanse button', HSCorruption.#context); return; }

        HSCorruption.#cleanseIcon = { icon, gameSrc: icon.getAttribute('src') ?? '' };
        icon.classList.add('hs-corruption-cleanse');
        icon.src = HSCorruption.#CLEANSE_ICON_SRC;
        icon.title = 'Cleanse: all corruptions to 0';
        icon.addEventListener('click', HSCorruption.#cleanse);
    }

    /**
     * Clicks the game's own Confirm of its two-step cleanse (current and next corruptions to 0), then imports 0 into
     * the next corruptions, as the game refuses a cleanse inside C15.
     */
    static #cleanse = (): void => {
        const confirmButton = document.getElementById('corruptionCleanseConfirm');
        if (!confirmButton) { HSLogger.warn('Could not find #corruptionCleanseConfirm to cleanse', HSCorruption.#context); return; }
        confirmButton.click();
        void HSCorruption.importCorruptionLoadout(HSCorruption.ZERO_CORRUPTIONS);
    };


    // =================================
    // --------- Header: levels --------
    // =================================

    /**
     * A line above the icon and slots of the game's "Corruption loadouts" header module: the current corruption levels,
     * then the next ones when they differ. Refreshed when the game rewrites its corruption stats (corrCurrent* /
     * corrNext*, at a level change, a loadout load, a cleanse, each ascension, whatever tab is shown): one observer on
     * them, no polling. The levels come from the live player; without it (bookmarklet), from those spans.
     * The spans can be wrong: entering C15, the game's reset writes the next loadout into them, then sets the C15
     * loadout (all 11) without redrawing (Reset.ts, reset then applyChallengeInitialModifiers), so they stay wrong
     * until the next change. The observer's callback runs after that whole click, so the live player is right then.
     * Action of the corruptionHeaderLevels setting (turned off while autosing runs).
     */
    static setHeaderLevels(enabled: boolean): void {
        const module = document.getElementById(HSCorruption.#HEADER_MODULE_ID);

        if (!enabled) {
            const display = HSCorruption.#levelsDisplay;
            if (!display) return;
            HSCorruption.#levelsDisplay = null;
            display.observer.disconnect();
            display.element.remove();
            module?.classList.remove('hs-corruption-levels-shown');
            return;
        }

        if (HSCorruption.#levelsDisplay) return;
        const stats = document.getElementById('corruptionStatsLoadouts');
        if (!module || !stats) { HSLogger.debug(() => 'No corruption loadouts module in the game header, or no corruption stats: no corruption levels', HSCorruption.#context); return; }

        const element = document.createElement('div');
        element.id = 'hs-corruption-header-levels';
        const current = document.createElement('span');
        current.className = 'hs-corruption-header-levels-current';
        const next = document.createElement('span');
        next.className = 'hs-corruption-header-levels-next';
        element.append(current, next);

        module.prepend(element);
        module.classList.add('hs-corruption-levels-shown');

        const observer = new MutationObserver(() => HSCorruption.#refreshHeaderLevels());
        observer.observe(stats, { childList: true, characterData: true, subtree: true });

        HSCorruption.#levelsDisplay = { element, current, next, observer };
        HSCorruption.#refreshHeaderLevels();
    }

    static #refreshHeaderLevels(): void {
        const display = HSCorruption.#levelsDisplay;
        if (!display) return;

        // The live player's corruptions are CorruptionLoadout instances (getLevel), not the save's shape it is typed with
        type LiveLoadout = { getLevel?: (name: keyof HSCorruptionLevels) => number } | undefined;
        const corruptions = HSGlobal.exposedPlayer?.corruptions as unknown as { used: LiveLoadout; next: LiveLoadout } | undefined;
        const read = (loadout: 'used' | 'next', prefix: string) => {
            const live = corruptions?.[loadout];
            return HSCorruption.#CORRUPTION_NAMES
                .map((name) => typeof live?.getLevel === 'function'
                    ? String(live.getLevel(name))
                    // Else the spans, by id each time: the game rebuilds them (corruptionButtonsAdd)
                    : document.getElementById(`${prefix}${name}`)?.textContent?.trim() || '0')
                .join('/');
        };
        const current = read('used', 'corrCurrent');
        const next = read('next', 'corrNext');
        const nextText = next === current ? '' : ` ⇨ ${next}`;

        if (display.current.textContent !== current) display.current.textContent = current;
        if (display.next.textContent !== nextText) display.next.textContent = nextText;
    }


    // =================================
    // ------------ Import -------------
    // =================================

    static async importCorruptionLoadout(levels: HSCorruptionLevels): Promise<boolean> {
        // Fast path (exposed function)
        const jsonString = JSON.stringify(levels);
        const applyCorruptions = (window as any).__HS_applyCorruptions as ((json: string) => boolean) | undefined;
        if (typeof applyCorruptions === 'function') {
            return applyCorruptions(jsonString);
        }

        // DOM Fallback, as HSAutosingCorruption.setCorruptions(): clicks import only while no dialog is open, a few
        // times at most (with a dialog open, each click would queue one more import Prompt), and gives up after a while.
        // Its session answers the Prompt with the loadout, and dismisses the Alert of a rejected import.
        await HSCorruption.#cacheElements();
        const importBtn = HSCorruption.#importBtn;
        if (!importBtn) { HSLogger.warn('importCorruptionLoadout: corruption import DOM elements unavailable', HSCorruption.#context); return false; }

        const deadline = performance.now() + HSCorruption.#DOM_IMPORT_TIMEOUT_MS;
        let importClicks = 0;
        while (true) {
            if (importClicks < HSCorruption.#DOM_IMPORT_MAX_CLICKS && HSGameDialogs.isQueueIdle()) {
                importClicks++;
                HSGameDialogs.act('corruptionImport', { prompt: { ok: jsonString }, alert: 'dismiss' }, () => importBtn.click());
            }
            await HSUtils.yield();
            if (HSCorruption.#nextLevelsMatch(levels)) {
                return true;
            }
            if (performance.now() >= deadline) {
                HSLogger.warn(`Failed to import corruptions through the import prompt within ${HSCorruption.#DOM_IMPORT_TIMEOUT_MS} ms: ${jsonString}`, HSCorruption.#context);
                return false;
            }
        }
    }

    /** Whether the next corruptions shown in the corruption stats are these levels. */
    static #nextLevelsMatch(levels: HSCorruptionLevels): boolean {
        const elements = HSCorruption.#nextCorruptionEls;
        if (!elements) return false;
        return HSCorruption.#CORRUPTION_NAMES.every((name) => {
            const element = elements[name];
            const shown = element ? parseInt(element.textContent || '0', 10) : 0;
            return shown === levels[name];
        });
    }

    /** Cache the corruption import button and the next corruption values of the corruption stats. */
    static async #cacheElements(): Promise<void> {
        await HSElementHooker.HookElement('#corruptionLoadoutTable');
        HSCorruption.#importBtn = document.querySelector<HTMLButtonElement>('#corruptionLoadoutTable button.corrImport');

        await HSElementHooker.HookElement('#corruptionStats');
        const next: Partial<Record<keyof HSCorruptionLevels, HTMLElement | null>> = {};
        HSCorruption.#CORRUPTION_NAMES.forEach((name) => {
            next[name] = document.getElementById(`corrNext${name}`);
        });
        HSCorruption.#nextCorruptionEls = next;
    }
}
