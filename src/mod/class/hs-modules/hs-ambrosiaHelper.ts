import { AMBROSIA_ICON, AMBROSIA_LOADOUT_SLOT } from "../../types/module-types/hs-ambrosia-types";
import { HSSetting } from "../hs-core/settings/hs-setting";
import { HSSettings } from "../hs-core/settings/hs-settings";
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
        // `activeAmbrosiaLoadout` setting may contain colored text or tags; remove them first.
        if (value === null || value === undefined) return undefined;

        const raw = HSUtils.removeColorTags(String(value)).trim();
        if (!raw) return undefined;

        return this.getSlotEnumBySlotId(raw);
    }

    /** Format a user-visible active loadout status string. */
    static formatActiveAmbrosiaLoadout(resolvedSlot?: AMBROSIA_LOADOUT_SLOT): string {
        if (!resolvedSlot) {
            return "<red>Unknown</red>";
        }

        const loadoutNumber = this.getLoadoutNumberFromSlot(resolvedSlot);
        if (!loadoutNumber || loadoutNumber <= 0) {
            return "<red>Unknown</red>";
        }

        return `<green>Loadout ${loadoutNumber}</green>`;
    }

    /** Mark current active ambrosia loadout as unknown and disable autoLoadout if enabled. */
    static setActiveAmbrosiaLoadoutToUnknown(): void {
        // Keep user-facing state deterministic when no valid active loadout is present.
        const activeLoadoutSetting = HSSettings.getSetting('activeAmbrosiaLoadout') as HSSetting<string>;
        if (activeLoadoutSetting) {
            activeLoadoutSetting.setValue('<red>Unknown</red>');
        } else {
            HSLogger.debug('setActiveAmbrosiaLoadoutToUnknown - active Ambrosia loadout setting missing', this.#context);
        }

        // If auto switching is enabled, disable it until valid loadout state is restored.
        const autoLoadoutSetting = HSSettings.getSetting('addTimeAutoLoadouts') as HSSetting<boolean>;
        if (autoLoadoutSetting && autoLoadoutSetting.isEnabled()) {
            autoLoadoutSetting.disable();
            HSLogger.debug('Invalid current-active loadout value detected; autoLoadout disabled', this.#context);
        }
    }

    /** Set and format the current active loadout in the settings. */
    static setActiveLoadoutSetting(resolvedSlot: AMBROSIA_LOADOUT_SLOT | undefined): void {
        if (!resolvedSlot) {
            this.setActiveAmbrosiaLoadoutToUnknown();
            return;
        }

        const activeLoadoutSetting = HSSettings.getSetting('activeAmbrosiaLoadout') as HSSetting<string>;
        if (!activeLoadoutSetting) {
            HSLogger.warn('setActiveLoadoutSetting - activeAmbrosiaLoadout setting missing', this.#context);
            return;
        }

        const state = this.formatActiveAmbrosiaLoadout(resolvedSlot);
        activeLoadoutSetting.setValue(state);
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
            if (currentMode.includes('SAVE')) {
                modeButton.click();
            }
        }
    }
}
