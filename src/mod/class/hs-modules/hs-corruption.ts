import { HSLogger } from "../hs-core/hs-logger";
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
 * Description: The mod's addition to the game's corruption header modules ("Corruption loadouts" and its loadout
 *     page module): the corruption levels under their slots, and optionally the game's cleanse button in place of their leading icon.
 *     Autosing has its own corruption import (HSAutosingCorruption).
 */
export class HSCorruption {
    static readonly #context = 'HSCorruption';
    // The full module, then its loadout page module (8 slots a page): the same line on each
    static readonly #HEADER_MODULE_IDS = ['corruptionLoadoutsHeader', 'corruptionLoadoutPageHeader'];
    static readonly #LEVELS_CLASS = 'hs-corruption-header-levels';

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

    static #levelsDisplay: { lines: { module: HTMLElement; element: HTMLElement; current: HTMLElement; next: HTMLElement }[]; observer: MutationObserver } | null = null;
    static #cleanseButtons = new Map<string, { button: HTMLButtonElement; icon: HTMLImageElement; place: Comment }>();

    /**
     * Move the game's cleanse button (a slot, with its own icon, click and keyboard behavior) from the end of the slots
     * to the place of the module's leading icon, which is hidden meanwhile. Put right after the icon, so a module's
     * children stay icon, then slots for the CSS that follows them (hs-header-edit-settings.css).
     */
    static setHeaderIconCleanse(enabled: boolean): void {
        if (!enabled) {
            for (const { button, icon, place } of HSCorruption.#cleanseButtons.values()) {
                place.replaceWith(button);
                button.classList.remove('hs-corruption-icon-cleanse');
                icon.style.display = '';
            }
            HSCorruption.#cleanseButtons.clear();
            return;
        }
        for (const [index, id] of HSCorruption.#HEADER_MODULE_IDS.entries()) {
            if (HSCorruption.#cleanseButtons.has(id)) continue;
            const icon = document.getElementById(id)?.querySelector<HTMLImageElement>(':scope > img');
            const button = document.getElementById(index === 0 ? 'corruptionCleanseHeader' : 'corruptionCleansePageHeader');
            if (!icon || !(button instanceof HTMLButtonElement)) continue;
            const place = document.createComment('HS cleanse button position');
            button.before(place);
            icon.after(button);
            button.classList.add('hs-corruption-icon-cleanse');
            icon.style.display = 'none';
            HSCorruption.#cleanseButtons.set(id, { button, icon, place });
        }
    }


    // =================================
    // --------- Header: levels --------
    // =================================

    /**
     * A line under the icon and slots of the game's corruption header modules (in the top row, hanging into the
     * row's bottom margin, so the row keeps its alignment: hs-quickbars.css): the current corruption levels,
     * then the next ones when they differ. Refreshed when the game rewrites its corruption stats (corrCurrent* /
     * corrNext*, at a level change, a loadout load, a cleanse, each ascension, whatever tab is shown): one observer on
     * them, no polling. The levels come from the live player; without it (bookmarklet), from those spans.
     * The spans can be wrong: entering C15, the game's reset writes the next loadout into them, then sets the C15
     * loadout (all 11) without redrawing (Reset.ts, reset then applyChallengeInitialModifiers), so they stay wrong
     * until the next change. The observer's callback runs after that whole click, so the live player is right then.
     * Action of the corruptionHeaderLevels setting (turned off while autosing runs).
     */
    static setHeaderLevels(enabled: boolean): void {
        if (!enabled) {
            const display = HSCorruption.#levelsDisplay;
            if (!display) return;
            HSCorruption.#levelsDisplay = null;
            display.observer.disconnect();
            for (const line of display.lines) {
                line.element.remove();
                line.module.classList.remove('hs-corruption-levels-shown');
            }
            return;
        }

        if (HSCorruption.#levelsDisplay) return;
        // The page module came with the game of 2026-10-21: none on an older game
        const modules = HSCorruption.#HEADER_MODULE_IDS
            .map(id => document.getElementById(id))
            .filter((module): module is HTMLElement => module !== null);
        const stats = document.getElementById('corruptionStatsLoadouts');
        if (modules.length === 0 || !stats) { HSLogger.debug(() => 'No corruption loadouts module in the game header, or no corruption stats: no corruption levels', HSCorruption.#context); return; }

        const lines = modules.map(module => {
            const element = document.createElement('div');
            element.className = HSCorruption.#LEVELS_CLASS;
            const current = document.createElement('span');
            current.className = 'hs-corruption-header-levels-current';
            const next = document.createElement('span');
            next.className = 'hs-corruption-header-levels-next';
            element.append(current, next);

            module.append(element);
            module.classList.add('hs-corruption-levels-shown');
            return { module, element, current, next };
        });

        const observer = new MutationObserver(() => HSCorruption.#refreshHeaderLevels());
        observer.observe(stats, { childList: true, characterData: true, subtree: true });

        HSCorruption.#levelsDisplay = { lines, observer };
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

        for (const line of display.lines) {
            if (line.current.textContent !== current) line.current.textContent = current;
            if (line.next.textContent !== nextText) line.next.textContent = nextText;
        }
    }
}
