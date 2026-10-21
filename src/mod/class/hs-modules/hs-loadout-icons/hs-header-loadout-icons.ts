import { HSModuleOptions } from "../../../types/hs-types";
import { HSLogger } from "../../hs-core/hs-logger";
import { HSUI } from "../../hs-core/hs-ui";
import { HSModule } from "../../hs-core/module/hs-module";
import headerLoadoutIconsCSS from "inline:../../../resource/css/module/hs-header-loadout-icons.css";
import { HSLoadoutIconStore } from "./hs-loadout-icon-store";
import { HSQuickbarIconPickerController } from "./hs-loadout-icon-picker";

type HSHeaderLoadoutKind = 'ambrosia' | 'corruption';

interface HSHeaderLoadoutSlot {
    kind: HSHeaderLoadoutKind;
    slot: number;
}

interface HSHeaderLoadoutKindDef {
    containerId: string;
    store: HSLoadoutIconStore;
    storeKey: (slot: number) => string;
}

const KINDS: Record<HSHeaderLoadoutKind, HSHeaderLoadoutKindDef> = {
    ambrosia: {
        containerId: 'ambrosiaLoadoutsHeaderSlots',
        store: HSLoadoutIconStore.ambrosia,
        storeKey: slot => `blueberryLoadout${slot}`,
    },
    corruption: {
        containerId: 'corruptionLoadoutsHeaderSlots',
        store: HSLoadoutIconStore.corruption,
        storeKey: slot => `${slot}`,
    },
};

const SLOT_CLASS = 'hs-header-loadout-custom';
const ICON_CLASS = 'hs-header-loadout-icon';
const PICK_ROW_ID = 'hs-header-loadout-pick-row';
const PICK_MODE_CLASS = 'hs-quickbar-slot-pickmode';

/**
 * Class: HSHeaderLoadoutIcons
 * IsExplicitHSModule: Yes
 * Description:
 *     Any image of the game as the icon of a slot of the game's Corruption and Ambrosia loadouts header
 *     modules. The game only offers corruption or ambrosia upgrade icons, and saves them in the save
 *     (player.headerLayouts.*.loadoutIcons, zod-checked), so the mod's icons stay in HSLoadoutIconStore
 *     (per browser, one per slot for both layouts) and are painted over the game's slots. A mod icon wins
 *     over the game's.
 *     - Painting: an img + the slot number, as the game draws its own icons. The game's data-icon is left
 *       alone, so its redraw (only when data-icon differs from the saved icon) skips the slot. An observer
 *       on each slot container paints again when the game rebuilds the slots or redraws one.
 *     - Picking: in the header's edit mode, the game's icon modal for a slot gets a "Pick any game icon"
 *       row (outside #modalContent, which the game patches every 250 ms), which starts the icon picker.
 *     - Clearing: the player's choice in that modal (an icon or the plain number) clears the mod icon.
 *     No patcher feature: works for every player.
 * Author: maenhiir
 */
export class HSHeaderLoadoutIcons extends HSModule {
    // The slot the player last pressed in the header's edit mode: the game's icon modal is for it
    #pressedSlot: HSHeaderLoadoutSlot | null = null;

    #iconPicker = new HSQuickbarIconPickerController<HSHeaderLoadoutSlot>({
        shouldIgnoreClickTarget: (target: Element) => !!target.closest('.headerLoadoutSlots'),
        setSlotPickModeVisual: (target: HSHeaderLoadoutSlot, active: boolean) => {
            HSHeaderLoadoutIcons.#slotButton(target)?.classList.toggle(PICK_MODE_CLASS, active);
        },
        clearAllSlotPickModeVisuals: () => {
            document.querySelectorAll(`.headerLoadoutSlots > .${PICK_MODE_CLASS}`)
                .forEach(button => button.classList.remove(PICK_MODE_CLASS));
        },
        assignIconToSlot: (target: HSHeaderLoadoutSlot, iconUrl: string) => {
            const def = KINDS[target.kind];
            def.store.set(def.storeKey(target.slot), iconUrl);
        },
    });

    constructor(moduleOptions: HSModuleOptions) {
        super(moduleOptions);
    }

    async init() {
        HSLogger.log(`Initializing HSHeaderLoadoutIcons module`, this.context);

        const modalContent = document.getElementById('modalContent');
        if (!modalContent) {
            HSLogger.warn('The game\'s modal was not found: header loadout icons are off', this.context);
            return;
        }

        // In the page before the first paint (injectStyle alone writes it in the next task): without it, a painted
        // icon stretches to the page's height for a moment. The mod's general CSS comes after every module's init.
        HSUI.injectStyle(headerLoadoutIconsCSS, 'hs-header-loadout-icons-css');
        HSUI.flushInjectedStyles();

        for (const kind of Object.keys(KINDS) as HSHeaderLoadoutKind[]) {
            const container = document.getElementById(KINDS[kind].containerId);
            if (!container) {
                HSLogger.warn(`#${KINDS[kind].containerId} not found: no custom icons on that header module`, this.context);
                continue;
            }
            new MutationObserver(() => this.#paintAll(kind)).observe(container, { childList: true, subtree: true });
            KINDS[kind].store.onChange(() => this.#paintAll(kind));
            this.#paintAll(kind);
        }

        document.addEventListener('pointerdown', this.#onPointerDown, true);
        document.addEventListener('click', this.#onGameIconChoice, true);
        new MutationObserver(() => this.#syncPickRow(modalContent)).observe(modalContent, { childList: true });

        this.isInitialized = true;
    }

    // ======================================================
    // ---------------------- Painting ----------------------
    // ======================================================

    #paintAll(kind: HSHeaderLoadoutKind): void {
        const container = document.getElementById(KINDS[kind].containerId);
        if (!container) return;
        for (const button of container.querySelectorAll<HTMLElement>(':scope > .headerLoadoutSlot')) {
            this.#paint(kind, button);
        }
    }

    #paint(kind: HSHeaderLoadoutKind, button: HTMLElement): void {
        const slot = Number(button.dataset.slot);
        if (!Number.isInteger(slot) || slot < 1) return;

        const def = KINDS[kind];
        const url = def.store.get(def.storeKey(slot));
        const first = button.firstElementChild;
        const painted = first instanceof HTMLImageElement && first.classList.contains(ICON_CLASS);

        if (url) {
            // Already painted with this icon: nothing to do (also ends the observer's echo of our own paint)
            if (painted && first.getAttribute('src') === url && button.childNodes.length === 2) return;

            const image = document.createElement('img');
            image.className = ICON_CLASS;
            image.src = url;
            image.alt = '';
            const number = document.createElement('span');
            number.textContent = `${slot}`;
            button.classList.add(SLOT_CLASS);
            button.replaceChildren(image, number);
        } else if (painted || button.classList.contains(SLOT_CLASS)) {
            button.classList.remove(SLOT_CLASS);
            // The game redraws a slot only when its saved icon differs from data-icon: '' never matches,
            // so it draws its own icon (or the number) at its next header update
            button.dataset.icon = '';
            button.textContent = `${slot}`;
        }
    }

    // ======================================================
    // ---------------------- Picking -----------------------
    // ======================================================

    #onPointerDown = (event: PointerEvent): void => {
        if (!event.isTrusted) return;
        if (!document.getElementById('mainHeader')?.classList.contains('headerEditMode')) return;

        const target = event.target instanceof Element ? event.target : null;
        const button = target?.closest<HTMLElement>('.headerLoadoutSlot');
        if (!button) return;
        const kind = HSHeaderLoadoutIcons.#kindOf(button);
        const slot = Number(button.dataset.slot);
        if (kind && Number.isInteger(slot) && slot >= 1) {
            this.#pressedSlot = { kind, slot };
        }
    };

    /** Adds the pick row while the game's icon modal is open, removes it otherwise. */
    #syncPickRow(modalContent: HTMLElement): void {
        const modal = modalContent.parentElement;
        const iconModalOpen = !!modalContent.querySelector('.headerLoadoutIcons') && this.#pressedSlot !== null;
        const row = document.getElementById(PICK_ROW_ID);

        if (!iconModalOpen || !modal) {
            row?.remove();
            return;
        }
        if (row) return;

        const newRow = document.createElement('div');
        newRow.id = PICK_ROW_ID;
        const pickButton = document.createElement('button');
        pickButton.type = 'button';
        pickButton.textContent = '[HS] Pick any game icon…';
        pickButton.title = 'HyperSynergism: click this, then click any icon or image of the game';
        pickButton.addEventListener('click', this.#onPickClick);
        newRow.appendChild(pickButton);
        modal.appendChild(newRow);
    }

    #onPickClick = (): void => {
        const target = this.#pressedSlot;
        if (!target) return;

        // Close the game's modal through its own choice that changes nothing (the current one): its
        // listener closes it and stops its update timer. Not trusted, so it doesn't clear the mod icon.
        const modalContent = document.getElementById('modalContent');
        const current = modalContent?.querySelector<HTMLButtonElement>('.headerLoadoutIcons > button[aria-pressed="true"]');
        if (current) {
            current.click();
        } else {
            const modal = document.getElementById('modal');
            if (modal) modal.style.display = 'none';
        }
        document.getElementById(PICK_ROW_ID)?.remove();

        this.#iconPicker.start(target);
    };

    /** The player's choice in the game's icon modal (an icon or the plain number) clears the mod icon. */
    #onGameIconChoice = (event: MouseEvent): void => {
        if (!event.isTrusted || !this.#pressedSlot) return;

        const target = event.target instanceof Element ? event.target : null;
        const choice = target?.closest('.headerLoadoutIcons > button');
        if (!choice || !document.getElementById('modalContent')?.contains(choice)) return;

        const def = KINDS[this.#pressedSlot.kind];
        def.store.clear(def.storeKey(this.#pressedSlot.slot));
    };

    // ======================================================
    // ----------------------- Helpers ----------------------
    // ======================================================

    static #kindOf(button: Element): HSHeaderLoadoutKind | null {
        const containerId = button.parentElement?.id;
        for (const kind of Object.keys(KINDS) as HSHeaderLoadoutKind[]) {
            if (KINDS[kind].containerId === containerId) return kind;
        }
        return null;
    }

    static #slotButton(target: HSHeaderLoadoutSlot): HTMLElement | null {
        return document.querySelector<HTMLElement>(`#${KINDS[target.kind].containerId} > .headerLoadoutSlot[data-slot="${target.slot}"]`);
    }
}
