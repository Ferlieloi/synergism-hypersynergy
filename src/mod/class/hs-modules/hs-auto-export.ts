import { HSModuleOptions } from "../../types/hs-types";
import { HSSetting } from "../hs-core/settings/hs-setting";
import { HSGameData } from "../hs-core/gds/hs-gamedata";
import { HSGlobal } from "../hs-core/hs-global";
import { HSLogger } from "../hs-core/hs-logger";
import { HSUI } from "../hs-core/hs-ui";
import { HSModule } from "../hs-core/module/hs-module";
import { HSModuleManager } from "../hs-core/module/hs-module-manager";
import { HSSettings } from "../hs-core/settings/hs-settings";
import type { HSAmbrosia } from "./hs-ambrosia";
import type { HSAutosing } from "./hs-autosing/hs-autosing";

const TICK_MS = 10_000;
const MINUTE_MS = 60_000;

/**
 * Class: HSAutoExport
 * IsExplicitHSModule: Yes
 * Description:
 *     The "Export the save every (minutes)" setting.
 *     Clicks the game's own Export button once the last export is older than the duration, so the export
 *     rewards (quarks, golden quarks) are given and the file is the game's own.
 *     The clock is the game's lastExportedSave: an export by hand restarts it, a reload doesn't.
 *     An ambrosia loadout can be loaded for the export, the player's tree is put back right after
 *     (the rewards are computed inside the click).
 *     Skipped while Auto-Sing is active (it exports for its quarks, with its own loadout), and while the
 *     offline popup is open. Not on Steam yet: every download opens a "Save as" dialog there.
 * Author: maenhiir
 */
export class HSAutoExport extends HSModule {
    #loadedAt = Date.now();
    // Last export seen by the mod (its own, or a click on the game's button)
    #lastExportAt = 0;
    #steamNoticeShown = false;

    constructor(moduleOptions: HSModuleOptions) {
        super(moduleOptions);
    }

    async init() {
        HSLogger.log(`Initializing HSAutoExport module`, this.context);

        // For players without the live player. Not the silent clicks that only expose the patched export function.
        document.getElementById('exportgame')?.addEventListener('click', () => {
            if (!(window as any).__HS_SILENT_EXPORT) this.#lastExportAt = Date.now();
        });
        setInterval(() => {
            try {
                this.#tick();
            } catch (error) {
                HSLogger.error(`Timed save export failed: ${error}`, this.context);
            }
        }, TICK_MS);

        this.isInitialized = true;
    }

    #tick(): void {
        const setting = HSSettings.getSetting('autoExportSave') as HSSetting<number> | undefined;
        if (!setting?.isEnabled()) return;

        if (HSModuleManager.getModule<HSGameData>('HSGameData')?.isSteam) {
            if (!this.#steamNoticeShown) {
                this.#steamNoticeShown = true;
                HSUI.Notify('Timed save export is not available on Steam yet: each download would open a "Save as" dialog', { notificationType: 'warning' });
                HSLogger.warn('Timed save export: not available on Steam yet', this.context);
            }
            return;
        }

        const minutes = Number(setting.getValue());
        if (!Number.isFinite(minutes) || minutes <= 0) return;
        if (Date.now() - this.#lastExport() < minutes * MINUTE_MS) return;

        if (HSModuleManager.getModule<HSAutosing>('HSAutosing')?.isAutosingActive()) return;
        if (document.getElementById('offlineContainer')?.style.display === 'flex') return;

        this.#export();
    }

    #lastExport(): number {
        const saved = Number(HSGlobal.exposedPlayer?.lastExportedSave);
        // Without the live player (bookmark load), counted from the page load. A date in the future
        // (a save from another clock) counts as never exported.
        const fromSave = Number.isFinite(saved) ? (saved > Date.now() ? 0 : saved) : this.#loadedAt;
        return Math.max(this.#lastExportAt, fromSave);
    }

    #export(): void {
        const exportButton = document.getElementById('exportgame');
        if (!exportButton) return;

        // Also when the export gives no file (the game refuses to save during a time warp): next try in a full duration
        this.#lastExportAt = Date.now();

        // A file even when the player exports to the clipboard: the box is unticked for this export.
        // The game reads it a few microtasks after the click, so it's ticked back in the next task.
        // Its stored preference is not touched (setting the property fires no event).
        const saveType = document.getElementById('saveType') as HTMLInputElement | null;
        const toClipboard = saveType?.checked === true;
        if (saveType && toClipboard) {
            saveType.checked = false;
            setTimeout(() => { saveType.checked = true; }, 0);
        }

        const loadout = String(HSSettings.getSetting('autoExportSaveLoadout')?.getValue() ?? '');
        const ambrosia = HSModuleManager.getModule<HSAmbrosia>('HSAmbrosia');
        let note: string | undefined;
        if (loadout && ambrosia) {
            note = ambrosia.runWithLoadout(loadout, 'autoExport', () => exportButton.click());
        } else {
            exportButton.click();
        }

        if (note) HSLogger.log(`Timed save export done; ${note}`, this.context);
        else HSLogger.log(loadout ? `Timed save export done, with loadout ${loadout}` : 'Timed save export done', this.context);
    }
}
