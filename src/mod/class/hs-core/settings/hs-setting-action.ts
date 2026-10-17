import { HSSettingActionParams } from "../../../types/module-types/hs-settings-types";
import { HSAmbrosia } from "../../hs-modules/hs-ambrosia";
import { HSGameData } from "../gds/hs-gamedata";
import { HSLogger } from "../hs-logger";
import { HSModule } from "../module/hs-module";
import { HSModuleManager } from "../module/hs-module-manager";
import { HSMouse } from "../hs-mouse";
import { HSAutosing } from "../../hs-modules/hs-autosing/hs-autosing";
import { HSAutosingStrategyModal } from "../../hs-modules/hs-autosing/ui/hs-autosing-strategy-modal";
import { HSSettings } from "./hs-settings";
import { HSSettingsUI } from "./hs-settings-ui";
import { HSQOLButtons } from "../../hs-modules/hs-qolButtons";
import { HSHepteractDistributor } from "../../hs-modules/hs-hepteract-distributor";
import { HSAutoExport } from "../../hs-modules/hs-auto-export";
import { HSGlobal } from "../hs-global";
import { HSUtils } from "../../hs-utils/hs-utils";
import { HSHiddenDialogs } from "../dialogs/hs-hidden-dialogs";

// Action of an on/off setting that belongs to a module: `on` when the setting is on, `off` when it is off.
// Does nothing if the module isn't loaded.
function moduleToggle<T extends HSModule>(
    moduleName: string,
    on: (mod: T) => unknown,
    off: (mod: T) => unknown
): (params: HSSettingActionParams) => Promise<void> {
    return async (params: HSSettingActionParams) => {
        const mod = HSModuleManager.getModule<T>(moduleName);
        if (!mod) return;

        await (params.disable === true ? off(mod) : on(mod));
    };
}

/**
 * Class: HSSettingActions
 * IsExplicitHSModule: No
 * Description: 
 *     Helper wrapper for HSSettings.
 *     Encapsulates SettingActions and their functionality.
 * Author: Swiffy
*/
export class HSSettingActions {
    // Record for SettingActions
    // If some setting in hs-settings.json has "settingAction" set, the action should be defined here
    #settingActions: Record<string, (params: HSSettingActionParams) => any> = {

        // Let this server as an EXAMPLE SETTINGACTION DEFINITION
        // NOTE THE EXPLICIT HANDLING OF WHEN PARAMS.DISABLE = TRUE
        // Care should be taken to handle this case so the setting will know what to do when it is enabled/disabled
        syncNotificationOpacity: async (params: HSSettingActionParams) => {
            const notifElement = document.querySelector('#notification') as HTMLDivElement;
            const context = params.contextName ?? "HSSettings";

            if (params.disable && params.disable === true) {
                notifElement.style.removeProperty('opacity');
            } else {
                const value = params.value;

                if (notifElement && value && value >= 0 && value <= 1) {
                    notifElement.style.opacity = value.toString();
                }
            }
        },

        // Auto validate Confirm & Alert (not Prompt). Only has an effect without the dialog hook (old patcher):
        // with the hook, the patcher leaves the answers to HSGameDialogs.
        autoConfirmPopups: async (params: HSSettingActionParams) => {
            const context = params.contextName ?? "HSSettings";
            if (params.disable && params.disable === true) {
                HSUtils.setAutoConfirm(false);
            } else {
                if (HSUtils.isAutoConfirmPatched()) {
                    HSUtils.setAutoConfirm(true);
                } else {
                    HSLogger.warn("autoConfirmPopups enabled, but __HS_AUTO_CONFIRM not patched", context);
                }
            }
        },

        // "Hide game dialogs": the checkbox in the game's Confirm and Alert, and the hidden dialogs answered.
        // Also run at load, which adds the ready-made entries a newer mod version brought.
        hideGameDialogs: async (params: HSSettingActionParams) => {
            HSHiddenDialogs.setEnabled(!params.disable);
        },

        logTimestamp: async (params: HSSettingActionParams) => {
            if (params.disable && params.disable === true) {
                HSLogger.setTimestampDisplay(false);
            } else {
                HSLogger.setTimestampDisplay(true);
            }
        },

        showDebugLogs: async (params: HSSettingActionParams) => {
            HSLogger.updateDebugEnabled();
        },

        reactiveMouseHover: async (params: HSSettingActionParams) => {
            const context = params.contextName ?? "HSSettings";

            if (params.disable && params.disable === true) {
                HSMouse.clearInterval('hover');
            }
        },

        autoClick: async (params: HSSettingActionParams) => {
            const context = params.contextName ?? "HSSettings";

            if (params.disable && params.disable === true) {
                HSMouse.clearInterval('click');
            }
        },

        ambrosiaQuickBarAction: moduleToggle<HSAmbrosia>('HSAmbrosia',
            (mod) => mod.showQuickBar(),
            (mod) => mod.hideQuickBar()
        ),

        ambrosiaMinibarAction: moduleToggle<HSAmbrosia>('HSAmbrosia',
            (mod) => {
                // Auto-enable GDS if not already enabled
                const gdsSettingEnabled = HSSettings.getSetting('useGameData')?.isEnabled();
                if (!gdsSettingEnabled) {
                    HSSettings.getSetting('useGameData')?.enable();
                }
                return mod.enableBerryMinibars();
            },
            (mod) => mod.disableBerryMinibars()
        ),

        hiddenVanillaTabsAction: async (params: HSSettingActionParams) => {
            HSSettingsUI.applyHiddenVanillaTabsSetting();
        },

        // Not awaited: the GDS start and stop run on their own
        useGameData: moduleToggle<HSGameData>('HSGameData',
            (mod) => { void mod.enableGDS(); },
            (mod) => { void mod.disableGDS(); }
        ),

        addTimeAutoLoadoutsAction: moduleToggle<HSAmbrosia>('HSAmbrosia',
            (mod) => mod.enableAutoLoadout(),
            (mod) => mod.disableAutoLoadout()
        ),

        /* RETIRED: The Ambrosia AFK/idle swapper is no longer useful after the
         * corresponding game update. Keep the old action here as commented
         * reference so the feature can be reconstructed if the game changes.
        ambrosiaIdleSwapAction: async (params: HSSettingActionParams) => {
            const context = params.contextName ?? "HSSettings";

            const ambrosiaMod = HSModuleManager.getModule<HSAmbrosia>('HSAmbrosia');

            const startAutosingEnabled = HSSettings.getSetting('startAutosing')?.isEnabled() ?? false;
            HSLogger.debug(() => `ambrosiaIdleSwapAction called disable=${Boolean(params.disable)} startAutosingEnabled=${startAutosingEnabled}`, context);

            if (ambrosiaMod) {
                if (params.disable && params.disable === true) {
                    // HSLogger.debug(() => `ambrosiaIdleSwapAction disable stack: ${new Error().stack ?? 'n/a'}`, context);
                    ambrosiaMod.disableIdleSwap();
                } else {
                    // Auto-enable GDS if not already enabled
                    const gdsSettingEnabled = HSSettings.getSetting('useGameData')?.isEnabled();
                    if (!gdsSettingEnabled) {
                        HSSettings.getSetting('useGameData')?.enable();
                    }
                    await ambrosiaMod.enableIdleSwap();
                }
            }
        },
        */

        startAutosingAction: async (params: HSSettingActionParams) => {
            const context = params.contextName ?? "HSSettings";

            if (!params.disable && !HSGlobal.General.isModFullyLoaded) {
                HSLogger.log("Hypersynergism is still loading. Please wait before starting Auto-Sing.", context);
                HSSettings.getSetting('startAutosing')?.disable();
                return;
            }

            const autosingMod = HSModuleManager.getModule<HSAutosing>('HSAutosing');
            if (autosingMod) {
                if (params.disable && params.disable === true) {
                    // Review mode: we stop autosing process but keep the modal visible
                    autosingMod.stopAutosing({ showReviewModal: true });
                } else {
                    await autosingMod.enableAutoSing();
                }
            }
        },

        createAutosingStrategy: async (params: HSSettingActionParams) => {
            const context = params.contextName ?? "HSSettings";
            await HSAutosingStrategyModal.open();
        },

        editAutosingStrategy: async (params: HSSettingActionParams) => {
            const context = params.contextName ?? "HSSettings";
            await HSSettingsUI.editSelectedStrategy();
        },
        deleteAutosingStrategy: async (params: HSSettingActionParams) => {
            const context = params.contextName ?? "HSSettings";
            await HSSettingsUI.deleteSelectedStrategy();
        },

        exportAutosingStrategy: async (params: HSSettingActionParams) => {
            const context = params.contextName ?? "HSSettings";
            await HSSettingsUI.exportSelectedStrategy();
        },

        importAutosingStrategy: async (params: HSSettingActionParams) => {
            const context = params.contextName ?? "HSSettings";
            await HSSettingsUI.importStrategy();
        },

        hideMaxedGQUpgradesAction: async (params: HSSettingActionParams) => {
            const context = params.contextName ?? "HSSettings";
            const qolButtonsMod = HSModuleManager.getModule<HSQOLButtons>('HSQOLButtons');
            if (qolButtonsMod) {
                qolButtonsMod.setMaxedGQUpgradesVisibility();
            }
        },

        hideMaxedOctUpgradesAction: async (params: HSSettingActionParams) => {
            const context = params.contextName ?? "HSSettings";
            const qolButtonsMod = HSModuleManager.getModule<HSQOLButtons>('HSQOLButtons');
            if (qolButtonsMod) {
                qolButtonsMod.setMaxedOctUpgradesVisibility();
            }
        },

        enableGQDistributorAction: moduleToggle<HSQOLButtons>('HSQOLButtons',
            (mod) => mod.showGQDistributor(),
            (mod) => mod.hideGQDistributor()
        ),

        autoExportSaveFolderAction: async (params: HSSettingActionParams) => {
            await HSModuleManager.getModule<HSAutoExport>('HSAutoExport')?.chooseFolder();
        },

        autoExportSaveForgetFolderAction: async (params: HSSettingActionParams) => {
            await HSModuleManager.getModule<HSAutoExport>('HSAutoExport')?.forgetFolder();
        },

        enableHepteractDistributorAction: moduleToggle<HSHepteractDistributor>('HSHepteractDistributor',
            (mod) => mod.showDistributor(),
            (mod) => mod.hideDistributor()
        ),

        enableAutomationQuickBarAction: moduleToggle<HSQOLButtons>('HSQOLButtons',
            (mod) => mod.enableAutomationQuickbar(),
            (mod) => mod.disableAutomationQuickbar()
        ),

        enableEventsQuickBarAction: moduleToggle<HSQOLButtons>('HSQOLButtons',
            (mod) => mod.enableEventsQuickbar(),
            (mod) => mod.disableEventsQuickbar()
        ),

        enableCorruptionQuickBarAction: moduleToggle<HSQOLButtons>('HSQOLButtons',
            (mod) => mod.enableCorruptionQuickbar(),
            (mod) => mod.disableCorruptionQuickbar()
        )
    }

    constructor() { }

    getAction(actionName: string): ((params: HSSettingActionParams) => any) | null {
        const self = this;

        if (actionName in this.#settingActions) {
            // The action's promise is not returned, on purpose: no caller waits for a setting action
            // (at load, each one would hold back the next settings). So a failure is logged here.
            return (params: HSSettingActionParams) => {
                void (async () => self.#settingActions[actionName](params))().catch((err) => {
                    HSLogger.error(`Setting action ${actionName} failed: ${err}`, params.contextName ?? "HSSettings");
                    console.error(err);
                });
            };
        } else {
            return null;
        }
    }
}
