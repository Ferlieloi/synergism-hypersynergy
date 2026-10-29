import { HSElementHooker } from "../../hs-core/hs-elementhooker";
import { HSGlobal } from "../../hs-core/hs-global";
import { HSLogger } from "../../hs-core/hs-logger";
import { HSModuleManager } from "../../hs-core/module/hs-module-manager";
import { HSSelectStringSetting } from "../../hs-core/settings/hs-setting";
import { HSSettings } from "../../hs-core/settings/hs-settings";
import { HSUI } from "../../hs-core/hs-ui";
import { HSGameDialogs } from "../../hs-core/dialogs/hs-game-dialogs";
import type { HSAutosing } from "../hs-autosing/hs-autosing";
import { HSAmbrosiaHelper } from "./hs-ambrosia-helper";
import type { HSAmbrosiaSlots } from "./hs-ambrosia-parts";

/**
 * Class: HSAmbrosiaAutoLoadout
 * IsExplicitHSModule: No
 * Description:
 *     Created by HSAmbrosia. Auto-Loadout: a click on the game's Add or Time code buttons loads the loadout chosen for
 *     that code first, then loads the previous one back once the code has paid out.
 * Author: Swiffy, Shewchou
 */
export class HSAmbrosiaAutoLoadout {
    #context: string;
    #slots: HSAmbrosiaSlots;

    #addCodeButton: HTMLButtonElement | null = null;
    #addCodeAllButton: HTMLButtonElement | null = null;
    #addCodeOneButton: HTMLButtonElement | null = null;
    #timeCodeButton: HTMLButtonElement | null = null;
    // Auto-Loadout: the slot to load back once the code has paid out
    #pendingCodeRestore: { slot: HTMLButtonElement, codeSlotId: string } | undefined;

    #_delegateAddHandler?: (e: Event) => Promise<void>;
    #_delegateTimeHandler?: (e: Event) => Promise<void>;

    constructor(context: string, slots: HSAmbrosiaSlots) {
        this.#context = context;
        this.#slots = slots;
    }

    async init(): Promise<void> {
        const [addCodeButton, addCodeAllButton, addCodeOneButton, timeCodeButton] = await Promise.all([
            HSElementHooker.HookElement('#addCode'),
            HSElementHooker.HookElement('#addCodeAll'),
            HSElementHooker.HookElement('#addCodeOne'),
            HSElementHooker.HookElement('#timeCode'),
        ]);

        this.#addCodeButton = addCodeButton as HTMLButtonElement;
        this.#addCodeAllButton = addCodeAllButton as HTMLButtonElement;
        this.#addCodeOneButton = addCodeOneButton as HTMLButtonElement;
        this.#timeCodeButton = timeCodeButton as HTMLButtonElement;
    }

    async enable() {

        await HSAmbrosiaHelper.cacheBlueberryToggleModeButton();

        const addCodeBtn = this.#addCodeButton;
        const addCodeAllBtn = this.#addCodeAllButton;
        const addCodeOneBtn = this.#addCodeOneButton;
        const timeButton = this.#timeCodeButton;

        if (!addCodeBtn || !addCodeAllBtn || !addCodeOneBtn || !timeButton) {
            HSLogger.warn(`Problem with enabling auto loadout`, this.#context);
            return;
        }

        if (!this.#_delegateAddHandler) {
            this.#_delegateAddHandler = async (e: Event) => { await this.#addCodeButtonHandler(e); };
        }

        if (!this.#_delegateTimeHandler) {
            this.#_delegateTimeHandler = async (e: Event) => { await this.#timeCodeButtonHandler(e); };
        }

        addCodeBtn.removeEventListener('click', this.#_delegateAddHandler, { capture: true });
        addCodeBtn.addEventListener('click', this.#_delegateAddHandler, { capture: true });

        addCodeAllBtn.removeEventListener('click', this.#_delegateAddHandler, { capture: true });
        addCodeAllBtn.addEventListener('click', this.#_delegateAddHandler, { capture: true });

        addCodeOneBtn.removeEventListener('click', this.#_delegateAddHandler, { capture: true });
        addCodeOneBtn.addEventListener('click', this.#_delegateAddHandler, { capture: true });

        timeButton.removeEventListener('click', this.#_delegateTimeHandler, { capture: true });
        timeButton.addEventListener('click', this.#_delegateTimeHandler, { capture: true });

        HSLogger.log(`Enabled auto loadout`, this.#context);
    }

    async disable() {
        const addCodeBtn = this.#addCodeButton;
        const addCodeAllBtn = this.#addCodeAllButton;
        const addCodeOneBtn = this.#addCodeOneButton;
        const timeButton = this.#timeCodeButton;

        if (!addCodeBtn || !addCodeAllBtn || !addCodeOneBtn || !timeButton) {
            HSLogger.warn(`Problem with disabling auto loadout`, this.#context);
            return;
        }

        if (this.#_delegateAddHandler) {
            addCodeBtn.removeEventListener('click', this.#_delegateAddHandler, { capture: true });
            addCodeAllBtn.removeEventListener('click', this.#_delegateAddHandler, { capture: true });
            addCodeOneBtn.removeEventListener('click', this.#_delegateAddHandler, { capture: true });
        }

        if (this.#_delegateTimeHandler)
            timeButton.removeEventListener('click', this.#_delegateTimeHandler, { capture: true });

        HSLogger.log(`Disabled auto loadout`, this.#context);
    }

    // Auto-Loadout runs from a capture listener on the code buttons, so before the game's own listener.
    // The slot click loads the loadout synchronously (HSAmbrosiaSlots.load): it's in place before the game uses
    // the code, whoever clicked. No await before that click.
    // Once the code's dialogs are over (it has paid out), the previous loadout is loaded back.
    // Not while autosing runs: autosing sets its own loadout before using the codes.

    async #addCodeButtonHandler(e: Event) {
        if (HSModuleManager.getModule<HSAutosing>('HSAutosing')?.isAutosingActive()) return;
        const addLoadoutSetting = HSSettings.getSetting('autoLoadoutAdd') as HSSelectStringSetting;

        if (addLoadoutSetting) {
            const addLoadout = HSAmbrosiaHelper.convertSettingLoadoutToSlot(addLoadoutSetting.getValue());
            const addLoadoutBtn = this.#slots.byId(addLoadout);
            if (!addLoadout || !addLoadoutBtn) { HSLogger.warn('Invalid autoLoadoutAdd setting - cannot resolve addLoadout or loadoutSlot', this.#context); return; }

            this.#switchLoadoutForCode(addLoadoutBtn, addLoadout);
        }
    }

    async #timeCodeButtonHandler(e: Event) {
        if (HSModuleManager.getModule<HSAutosing>('HSAutosing')?.isAutosingActive()) return;
        const timeLoadoutSetting = HSSettings.getSetting('autoLoadoutTime') as HSSelectStringSetting;

        if (timeLoadoutSetting) {
            const timeLoadout = HSAmbrosiaHelper.convertSettingLoadoutToSlot(timeLoadoutSetting.getValue());
            const timeLoadoutBtn = this.#slots.byId(timeLoadout);
            if (!timeLoadout || !timeLoadoutBtn) { HSLogger.warn('Invalid autoLoadoutTime setting - cannot resolve timeLoadout or loadoutSlot', this.#context); return; }

            // The game's listener runs next, for this same click: the act's answers cover the time code's Confirm
            // and Alerts (claimed through the click event). An instant answer only pays out with Cube Upgrade
            // Cx11 (cubeUpgrades[61]) at 100: below, the winning window is at least 6 s away, so it always loses.
            // Cx11 goes back to 0 at every singularity: checked at each click, the dialogs are shown meanwhile.
            // Without the save (bookmarklet): always answered at once.
            const cx11Level = HSGlobal.exposedPlayer?.cubeUpgrades?.[61];
            if (cx11Level === undefined || (cx11Level ?? 0) >= 100) {
                HSGameDialogs.act('autoLoadoutTime', { confirm: 'ok', alert: 'dismiss' }, () => this.#switchLoadoutForCode(timeLoadoutBtn, timeLoadout));
            } else {
                HSUI.Notify('Auto-Loadout Time: Cx11 is not maxed, so the time code is shown for you to time it (an instant answer would always lose)', { notificationType: 'default' });
                this.#switchLoadoutForCode(timeLoadoutBtn, timeLoadout);
            }
        }
    }

    /**
     * Loads the code's loadout, then loads the previous one back once the queue is idle: the code's dialogs are
     * over, so it has paid out. The previous one is the slot shown as loaded, also when the game marks none
     * (after a page load or any save load): then its saved loadout is loaded, even if the tree had changed since.
     * Skipped when no slot was shown, when the player switched or saved meanwhile, or when autosing started.
     * One restore at a time: a second code meanwhile keeps the first previous slot.
     */
    #switchLoadoutForCode(codeLoadoutBtn: HTMLButtonElement, codeSlotId: string) {
        const previousSlot = this.#pendingCodeRestore?.slot ?? this.#slots.shown();
        this.#slots.load(codeLoadoutBtn, 'autoLoadout');
        if (!previousSlot || previousSlot.id === codeSlotId) {
            this.#pendingCodeRestore = undefined;
            return;
        }

        const isNew = !this.#pendingCodeRestore;
        this.#pendingCodeRestore = { slot: previousSlot, codeSlotId };
        if (!isNew) return;

        void HSGameDialogs.whenQueueIdle().then(() => {
            const restore = this.#pendingCodeRestore;
            this.#pendingCodeRestore = undefined;
            if (!restore) return;
            if (HSModuleManager.getModule<HSAutosing>('HSAutosing')?.isAutosingActive()) return;
            if (this.#slots.gameActive()?.id !== restore.codeSlotId) return;
            this.#slots.load(restore.slot, 'autoLoadoutRestore');
        });
    }
}
