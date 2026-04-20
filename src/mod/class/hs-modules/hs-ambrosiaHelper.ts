import { AMBROSIA_ICON, AMBROSIA_LOADOUT_SLOT } from "../../types/module-types/hs-ambrosia-types";
import { HSLogger } from "../hs-core/hs-logger";
import { HSUtils } from "../hs-utils/hs-utils";
import { HSElementHooker } from "../hs-core/hs-elementhooker";

/**
 * Class: HSAmbrosiaHelper
 * IsExplicitHSModule: No
 * Description:
 *     Static helper class for the HSAmbrosia module. Contains utility methods
 *     for resolving and formatting ambrosia loadout and icon states.
 */
export class HSAmbrosiaHelper {
    static #context: string = 'HSAmbrosiaHelper';

    /** Resolve an ambrosia icon enum by its ID string. */
    static getIconEnumById(iconId: string): AMBROSIA_ICON | undefined {
        return Object.values(AMBROSIA_ICON).find((icon) => icon === iconId) as AMBROSIA_ICON | undefined;
    }

    /** Resolve an ambrosia loadout slot enum by its slot ID string. */
    static getSlotEnumBySlotId(slotId: string): AMBROSIA_LOADOUT_SLOT | undefined {
        return Object.values(AMBROSIA_LOADOUT_SLOT).find((slot) => slot === slotId) as AMBROSIA_LOADOUT_SLOT | undefined;
    }

    /** Extract numeric slot index from slot enum string (e.g., blueberryLoadout1 -> 1). */
    static getLoadoutNumberFromSlot(slot: AMBROSIA_LOADOUT_SLOT): number | undefined {
        // The slot values are expected to have numeric endings in the format "blueberryLoadoutN".
        // This method extracts that tail number and confirms it's a valid positive integer.
        const match = slot.match(/(\d+)$/);
        if (!match) return undefined;

        const value = Number(match[1]);
        return Number.isInteger(value) && value > 0 ? value : undefined;
    }

    /** Normalize a saved/loadout string to a real AMBROSIA_LOADOUT_SLOT enum value. */
    static resolveAmbrosiaLoadout(value?: string | AMBROSIA_LOADOUT_SLOT | null): AMBROSIA_LOADOUT_SLOT | undefined {
        if (value === null || value === undefined) return undefined;

        // Accept canonical and numeric formats, e.g. blueberryLoadout1, Loadout 1, 1.
        const input = String(value);
        const normalized = HSUtils.removeColorTags(input).trim();

        // direct enum style
        const direct = this.getSlotEnumBySlotId(normalized);
        if (direct) return direct;

        // plain number style
        const indexMatch = normalized.match(/^(?:Loadout\s*)?(\d+)$/i);
        if (indexMatch) {
            return this.convertSettingLoadoutToSlot(indexMatch[1]);
        }

        return undefined;
    }

    /** Convert loadout-setting string (e.g. "1") to a real slot enum. */
    static convertSettingLoadoutToSlot(loadoutNumber: string): AMBROSIA_LOADOUT_SLOT | undefined {
        const loadoutEnum = Object.values(AMBROSIA_LOADOUT_SLOT).find(
            slot => slot === `blueberryLoadout${loadoutNumber}`
        ) as AMBROSIA_LOADOUT_SLOT | undefined;

        if (!loadoutEnum) {
            HSLogger.warn(`Could not convert loadout ${loadoutNumber} to slot`, this.#context);
        }

        return loadoutEnum;
    }

    /** Ensure the game is in LOAD mode before clicking slots. */
    static async ensureLoadoutModeIsLoad(): Promise<void> {
        // The module interacts with the real loadout buttons; game must be in load state to avoid accidental save.
        const modeButton = await HSElementHooker.HookElement('#blueberryToggleMode') as HTMLButtonElement;

        if (modeButton) {
            const currentMode = modeButton.innerText;

            // If we're in SAVE mode, toggle to LOAD mode.
            // TODO: exposedPlayer.blueberryLoadoutMode = 'saveTree' / 'loadTree'
            // TODO: update HSAmbrosiaHelper.ensureLoadoutModeIsLoad to handle either save or load with a parameter
            if (currentMode.includes('SAVE')) {
                modeButton.click();
            }
        }
    }

    /** Show or hide other quickbars' summary headers. */
    static setQuickbarTopTextVisibility(visibility: boolean): void {
        const quickbarSummaryElements = document.querySelectorAll('.hs-quickbar-summary-wrapper');

        quickbarSummaryElements.forEach(
            (el) => el.classList.toggle('hs-hidden', !visibility)
        );
    }
}
