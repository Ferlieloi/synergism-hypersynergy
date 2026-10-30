import { HSGlobal } from "../hs-global";
import { HSLogger } from "../hs-logger";
import { HSUI } from "../hs-ui";
import { HSCorruptionLevel, HSCorruptionLevelButton, HSCorruptionToggle } from "../hs-corruption-level";
import { HSNumberParser } from "../../hs-utils/hs-number-parser";
import corruptionHeaderCSS from "inline:../../../resource/css/module/hs-corruption-header.css";

const MODULE_ID = 'corruptionLevelHeader';
const TEXT_ID = 'corruptionLevelHeaderText';
const POPOVER_ID = 'hs-corruption-popover';
const CONTROLS_CLASS = 'hs-corruption-header-controls';
const REFRESH_MS = 250;
// The game's level row, in its order and with its classes; the Max text is the game's (translated)
const BUTTONS: { button: HSCorruptionLevelButton; text: string; className: string }[] = [
    { button: 'min', text: '0', className: 'corruptionReset' },
    { button: 'down10', text: '-10', className: 'corruptionReset' },
    { button: 'down1', text: '-1', className: 'corruptionDown' },
    { button: 'up1', text: '+1', className: 'corruptionUp' },
    { button: 'up10', text: '+10', className: 'corruptionMax' },
    { button: 'max', text: 'Max', className: 'corruptionMax' },
];
// Short names (user's choice), the game's sentence as their tooltip
const TOGGLES: { toggle: HSCorruptionToggle; label: string; fallbackTitle: string }[] = [
    { toggle: 'autoIncrease', label: 'Auto-climb', fallbackTitle: 'Move up to each newly unlocked level automatically' },
    { toggle: 'cleanseToHighest', label: 'Cleanse to highest', fallbackTitle: 'Cleanse to your highest cleared level instead of level 0' },
];
// As the game's Confirm button, shown 10 s after its Cleanse
const CLEANSE_CONFIRM_MS = 10000;

interface HSCorruptionPlayer {
    corruptions?: { used?: number };
    currentChallenge?: { ascension?: number };
    highestSingularityCount?: number;
}

interface HSCorruptionPopover {
    element: HTMLElement;
    title: HTMLElement;
    row: HTMLElement;
    input: HTMLInputElement;
    maxButton: HTMLButtonElement;
    cleanse: HTMLButtonElement;
    cleanseIcon: HTMLImageElement;
    cleanseConfirm: HTMLElement;
    toggles: { toggle: HSCorruptionToggle; label: HTMLElement; checkbox: HTMLInputElement; fallbackTitle: string }[];
}

/**
 * Class: HSCorruptionHeader
 * IsExplicitHSModule: No
 * Description:
 *     The mod's additions to the game's "Corruption level" header module (corruptionLevelHeader, "used/max"):
 *     - Next level and controls (setting corruptionHeaderControls): " → 30" in silver after the game's text while the
 *       next ascension's level differs from the one shown (in an ascension challenge the game shows 0). A click on
 *       the module opens a popover under it with the Corruption tab's cleanse (its icon; a second click within 10 s
 *       confirms, as the game's Cleanse then Confirm), its level row (0, -10, -1, input, +1, +10, Max) and its two
 *       toggles, all done through the game's own controls (HSCorruptionLevel). The cleanse and the row are hidden
 *       while the max is 0 (as the game's row). Read every 250 ms while the module is seen; no patcher feature (without
 *       the live player, the levels come from the game's text and controls).
 *     - Keep visible (setting corruptionHeaderAlwaysShown): the game shows the module once Challenge 11 is completed,
 *       so it hid at the start of each singularity; kept after the first singularity (when the game unlocks its
 *       Corruption tab). Needs the patcher's capture of the unlock checks (window.__HS_headerModuleUnlocks).
 * Author: Shewchou
 */
export class HSCorruptionHeader {
    static #context = 'HSCorruptionHeader';
    static #cssInjected = false;
    static #timer?: ReturnType<typeof setInterval>;
    static #module?: HTMLElement;
    static #text?: HTMLElement;
    static #next?: HTMLSpanElement;
    static #popover?: HSCorruptionPopover;
    static #open = false;
    // While the cleanse waits for its confirming click
    static #cleanseTimer?: ReturnType<typeof setTimeout>;
    // The game's own unlock check of the module, while the mod's replaces it
    static #gameUnlock?: () => boolean;

    // ======================================================
    // --------------- Next level and controls ---------------
    // ======================================================

    static enableControls(): void {
        if (HSCorruptionHeader.#timer !== undefined) return;
        const module = document.getElementById(MODULE_ID);
        const text = document.getElementById(TEXT_ID);
        if (!module || !text) {
            HSLogger.debug(() => 'No corruption level module in the game header: no next level', HSCorruptionHeader.#context);
            return;
        }
        HSCorruptionHeader.#injectStyle();

        // After the game's text, never inside it: the game rewrites that span
        const next = document.createElement('span');
        next.className = 'hs-corruption-header-next';
        text.after(next);
        HSCorruptionHeader.#module = module;
        HSCorruptionHeader.#text = text;
        HSCorruptionHeader.#next = next;

        // In edit mode the game's capture listener stops the click before it reaches the module
        module.addEventListener('click', HSCorruptionHeader.#onModuleClick);
        document.documentElement.classList.add(CONTROLS_CLASS);
        HSCorruptionHeader.#timer = setInterval(() => HSCorruptionHeader.#refresh(), REFRESH_MS);
        HSCorruptionHeader.#refresh();
    }

    static disableControls(): void {
        if (HSCorruptionHeader.#timer === undefined) return;
        clearInterval(HSCorruptionHeader.#timer);
        HSCorruptionHeader.#timer = undefined;
        HSCorruptionHeader.#close();
        HSCorruptionHeader.#module?.removeEventListener('click', HSCorruptionHeader.#onModuleClick);
        HSCorruptionHeader.#next?.remove();
        HSCorruptionHeader.#next = undefined;
        document.documentElement.classList.remove(CONTROLS_CLASS);
    }

    static #injectStyle(): void {
        if (HSCorruptionHeader.#cssInjected) return;
        HSCorruptionHeader.#cssInjected = true;
        HSUI.injectStyle(corruptionHeaderCSS, 'hs-corruption-header-css');
        HSUI.flushInjectedStyles();
    }

    /** The level the module shows (the game's activeCorruptionLevel) and the max, NaN when unknown. */
    static #levels(): { shown: number; max: number } {
        // "25/132", both exact integers (format(x, 0, true))
        const [textShown, max] = HSNumberParser.parseAll(HSCorruptionHeader.#text?.textContent);
        const player = HSGlobal.exposedPlayer as HSCorruptionPlayer | null;
        const used = player?.corruptions?.used;
        if (typeof used !== 'number') return { shown: textShown ?? NaN, max: max ?? NaN };
        return { shown: (player?.currentChallenge?.ascension ?? 0) !== 0 ? 0 : used, max: max ?? NaN };
    }

    static #refresh(): void {
        const module = HSCorruptionHeader.#module;
        const next = HSCorruptionHeader.#next;
        if (!module || !next || document.hidden || !module.isConnected) return;

        const seen = module.checkVisibility?.() ?? true;
        const editing = document.getElementById('mainHeader')?.classList.contains('headerEditMode') === true;
        if (HSCorruptionHeader.#open && (!seen || editing)) HSCorruptionHeader.#close();
        // In the tray outside edit mode, or locked
        if (!seen) return;

        try {
            const { shown, max } = HSCorruptionHeader.#levels();
            const level = HSCorruptionLevel.getNext();
            const text = Number.isFinite(level) && level !== shown ? ` → ${Intl.NumberFormat().format(level)}` : '';
            if (next.textContent !== text) next.textContent = text;
            if (HSCorruptionHeader.#open) HSCorruptionHeader.#refreshPopover(level, max);
        } catch (error) {
            HSLogger.warnOnce(`Could not draw the next corruption level: ${error}`, 'hs-corruption-header');
        }
    }

    // ======================================================
    // ----------------------- Popover -----------------------
    // ======================================================

    static #onModuleClick = (): void => {
        if (HSCorruptionHeader.#open) HSCorruptionHeader.#close();
        else HSCorruptionHeader.#openPopover();
    };

    // A press outside the popover and the module closes it (the module's own click toggles it)
    static #onDocumentPointerDown = (event: PointerEvent): void => {
        const target = event.target;
        if (!(target instanceof Node)) return;
        if (HSCorruptionHeader.#popover?.element.contains(target) || HSCorruptionHeader.#module?.contains(target)) return;
        HSCorruptionHeader.#close();
    };

    static #onKeyDown = (event: KeyboardEvent): void => {
        if (event.key === 'Escape') HSCorruptionHeader.#close();
    };

    static #openPopover(): void {
        const module = HSCorruptionHeader.#module;
        if (!module) return;
        const popover = HSCorruptionHeader.#popover ??= HSCorruptionHeader.#buildPopover();

        // The game's texts at each opening: they follow a language switch
        popover.title.textContent = HSCorruptionLevel.inputLabel() ?? 'Corruption level for next Ascension';
        popover.maxButton.textContent = HSCorruptionLevel.buttonText('max') ?? 'Max';
        for (const { toggle, label, fallbackTitle } of popover.toggles) {
            label.title = HSCorruptionLevel.toggleLabel(toggle) ?? fallbackTitle;
        }
        const icon = HSCorruptionLevel.cleanseIcon();
        if (icon && popover.cleanseIcon.getAttribute('src') !== icon) popover.cleanseIcon.src = icon;
        HSCorruptionHeader.#disarmCleanse();

        popover.element.hidden = false;
        HSCorruptionHeader.#open = true;
        document.addEventListener('pointerdown', HSCorruptionHeader.#onDocumentPointerDown, true);
        document.addEventListener('keydown', HSCorruptionHeader.#onKeyDown);
        HSCorruptionHeader.#refreshPopover(HSCorruptionLevel.getNext(), HSCorruptionHeader.#levels().max);
    }

    static #close(): void {
        if (!HSCorruptionHeader.#open) return;
        HSCorruptionHeader.#open = false;
        HSCorruptionHeader.#disarmCleanse();
        if (HSCorruptionHeader.#popover) HSCorruptionHeader.#popover.element.hidden = true;
        document.removeEventListener('pointerdown', HSCorruptionHeader.#onDocumentPointerDown, true);
        document.removeEventListener('keydown', HSCorruptionHeader.#onKeyDown);
    }

    static #buildPopover(): HSCorruptionPopover {
        const element = document.createElement('div');
        element.id = POPOVER_ID;
        element.hidden = true;

        const title = document.createElement('div');
        title.className = 'hs-corr-pop-title';

        const row = document.createElement('div');
        row.className = 'hs-corr-pop-row';
        const input = document.createElement('input');
        input.type = 'number';
        input.min = '0';
        input.step = '1';
        input.className = 'hs-corr-pop-input';
        input.addEventListener('change', () => {
            const level = Math.floor(Number(input.value));
            // Emptied or not a number: the game would set 0
            if (input.value.trim() === '' || !Number.isFinite(level)) HSCorruptionHeader.#apply(() => HSCorruptionLevel.getNext());
            else HSCorruptionHeader.#apply(() => HSCorruptionLevel.setNext(level));
        });
        input.addEventListener('keydown', event => { if (event.key === 'Enter') input.blur(); });

        // Left of the row: the game's cleanse icon, with "OK?" over it while it waits for the second click
        const cleanse = document.createElement('button');
        cleanse.type = 'button';
        cleanse.className = 'hs-corr-pop-cleanse';
        const cleanseIcon = document.createElement('img');
        cleanseIcon.src = 'Pictures/Default/CorruptExit.png';
        cleanseIcon.alt = '';
        const cleanseConfirm = document.createElement('span');
        cleanseConfirm.className = 'hs-corr-pop-cleanse-confirm';
        cleanse.append(cleanseIcon, cleanseConfirm);
        cleanse.addEventListener('click', () => HSCorruptionHeader.#onCleanseClick());
        row.append(cleanse);

        let maxButton: HTMLButtonElement | undefined;
        for (const def of BUTTONS) {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = def.className;
            button.textContent = def.text;
            button.addEventListener('click', () => HSCorruptionHeader.#apply(() => HSCorruptionLevel.press(def.button)));
            // The input between -1 and +1, as on the game's tab
            if (def.button === 'up1') row.append(input);
            row.append(button);
            if (def.button === 'max') maxButton = button;
        }

        // The game's toggles on its tab, side by side
        const toggleRow = document.createElement('div');
        toggleRow.className = 'hs-corr-pop-toggles';
        const toggles = TOGGLES.map(({ toggle, label: text, fallbackTitle }) => {
            const label = document.createElement('label');
            label.className = 'corruptionToggle hs-corr-pop-toggle';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.addEventListener('change', () => {
                HSCorruptionLevel.setToggle(toggle, checkbox.checked);
                const enabled = HSCorruptionLevel.getToggle(toggle);
                checkbox.checked = enabled;
                HSLogger.debug(() => `Corruption ${toggle}: ${enabled}`, HSCorruptionHeader.#context);
                HSCorruptionHeader.#refresh();
            });
            const name = document.createElement('span');
            name.textContent = text;
            label.append(checkbox, name);
            toggleRow.append(label);
            return { toggle, label, checkbox, fallbackTitle };
        });

        element.append(title, row, toggleRow);
        document.body.append(element);
        return { element, title, row, input, maxButton: maxButton!, cleanse, cleanseIcon, cleanseConfirm, toggles };
    }

    // A first click waits 10 s for a second one, as the game's Cleanse then Confirm: a cleanse lowers the current level at once
    static #onCleanseClick(): void {
        if (HSCorruptionHeader.#cleanseTimer === undefined) {
            const popover = HSCorruptionHeader.#popover;
            if (!popover) return;
            // Short, over the icon: the button keeps its size (the game's Confirm text is its tooltip)
            popover.cleanse.classList.add('hs-armed');
            popover.cleanseConfirm.textContent = 'OK?';
            popover.cleanse.title = HSCorruptionLevel.cleanseTexts().confirm ?? 'Confirm';
            HSCorruptionHeader.#cleanseTimer = setTimeout(() => HSCorruptionHeader.#disarmCleanse(), CLEANSE_CONFIRM_MS);
            return;
        }
        HSCorruptionHeader.#disarmCleanse();
        HSCorruptionHeader.#apply(() => HSCorruptionLevel.cleanse());
        HSLogger.debug(() => 'Corruptions cleansed', HSCorruptionHeader.#context);
    }

    static #disarmCleanse(): void {
        if (HSCorruptionHeader.#cleanseTimer !== undefined) {
            clearTimeout(HSCorruptionHeader.#cleanseTimer);
            HSCorruptionHeader.#cleanseTimer = undefined;
        }
        const popover = HSCorruptionHeader.#popover;
        if (!popover) return;
        popover.cleanse.classList.remove('hs-armed');
        popover.cleanseConfirm.textContent = '';
        const cleanse = HSCorruptionLevel.cleanseTexts().cleanse ?? 'Cleanse';
        popover.cleanse.title = cleanse;
        popover.cleanse.setAttribute('aria-label', cleanse);
    }

    /** A change through the game's controls, then the module and popover show what the game kept. */
    static #apply(change: () => number): void {
        const kept = change();
        HSLogger.debug(() => `Next corruption level: ${kept}`, HSCorruptionHeader.#context);
        // The input shows the kept level even while focused (a level the game lowered)
        if (HSCorruptionHeader.#popover && Number.isFinite(kept)) HSCorruptionHeader.#popover.input.value = String(kept);
        HSCorruptionHeader.#refresh();
    }

    static #refreshPopover(level: number, max: number): void {
        const popover = HSCorruptionHeader.#popover;
        const module = HSCorruptionHeader.#module;
        if (!popover || !module) return;

        // The game hides its level row while the max is 0
        popover.row.hidden = !(max > 0);
        // Not while the player types in it
        const value = Number.isFinite(level) ? String(level) : '';
        if (document.activeElement !== popover.input && popover.input.value !== value) popover.input.value = value;
        for (const { toggle, checkbox } of popover.toggles) {
            const enabled = HSCorruptionLevel.getToggle(toggle);
            if (checkbox.checked !== enabled) checkbox.checked = enabled;
        }

        // Centred under the module, kept inside the page's width (the header can move: edit mode, the window's size)
        const rect = module.getBoundingClientRect();
        const width = popover.element.offsetWidth;
        const pageWidth = document.documentElement.clientWidth;
        const left = Math.max(8, Math.min(rect.left + (rect.width - width) / 2, pageWidth - width - 8));
        popover.element.style.left = `${left + window.scrollX}px`;
        popover.element.style.top = `${rect.bottom + window.scrollY}px`;
    }

    // ======================================================
    // --------------------- Keep visible --------------------
    // ======================================================

    /**
     * Replaces the game's unlock check of the module (Challenge 11 completed, HeaderModules.ts) with "that, or a
     * singularity done", sets headerModuleLocked and renders (the game checks its locks only at its next revealStuff,
     * as HSHeaderModules.register); off puts the game's check back. The object lives for the page: a singularity
     * keeps it. Changing the check, not the CSS: the render counts grid rows from the same checks.
     */
    static setAlwaysShown(enabled: boolean): void {
        const unlocks = window.__HS_headerModuleUnlocks;
        const render = window.__HS_renderHeaderLayout;
        if (!unlocks || typeof render !== 'function') return;

        const gameUnlock = HSCorruptionHeader.#gameUnlock ?? unlocks[MODULE_ID];
        if (typeof gameUnlock !== 'function') return;
        if (enabled) {
            if (HSCorruptionHeader.#gameUnlock) return;
            HSCorruptionHeader.#gameUnlock = gameUnlock;
            unlocks[MODULE_ID] = () => {
                const player = HSGlobal.exposedPlayer as HSCorruptionPlayer | null;
                return gameUnlock() || (player?.highestSingularityCount ?? 0) > 0;
            };
        } else {
            if (!HSCorruptionHeader.#gameUnlock) return;
            HSCorruptionHeader.#gameUnlock = undefined;
            unlocks[MODULE_ID] = gameUnlock;
        }

        try { document.getElementById(MODULE_ID)?.classList.toggle('headerModuleLocked', !unlocks[MODULE_ID]()); } catch { /* the game's next check decides */ }
        try {
            render();
        } catch (e) {
            HSLogger.warn(`The game's header could not be rendered: ${e}`, HSCorruptionHeader.#context);
        }
    }
}
