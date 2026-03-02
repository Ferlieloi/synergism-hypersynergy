import { HSSettingActionParams } from "../../../types/module-types/hs-settings-types";
import { HSAmbrosia } from "../../hs-modules/hs-ambrosia";
import { HSPatches } from "../../hs-modules/hs-patches";
import { HSGameData } from "../gds/hs-gamedata";
import { HSLogger } from "../hs-logger";
import { HSModuleManager } from "../module/hs-module-manager";
import { HSMouse } from "../hs-mouse";
import { HSAutosing } from "../../hs-modules/hs-autosing/hs-autosing";
import { } from "../../hs-modules/hs-autosing/ui/hs-autosing-strategy-modal";
import { HSAutosingStrategyModal } from "../../hs-modules/hs-autosing/ui/hs-autosing-strategy-modal";
import { HSSettings } from "./hs-settings";
import { HSQOLButtons } from "../../hs-modules/hs-qolButtons";
import { HSGlobal } from "../hs-global";
import { HSUI } from "../hs-ui";
import { HSQuickbarManager } from '../../hs-modules/hs-quickbarManager';
/*
    Class: HSSettingActions
    IsExplicitHSModule: No
    Description: 
        Helper wrapper for HSSettings.
        Encapsulates SettingActions and their functionality.
    Author: Swiffy
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

        logTimestamp: async (params: HSSettingActionParams) => {
            if (params.disable && params.disable === true) {
                HSLogger.setTimestampDisplay(false);
            } else {
                HSLogger.setTimestampDisplay(true);
            }
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

        ambrosiaQuickBarAction: async (params: HSSettingActionParams) => {
            const context = params.contextName ?? "HSSettings";

            const ambrosiaMod = HSModuleManager.getModule<HSAmbrosia>('HSAmbrosia');

            if (ambrosiaMod) {
                if (params.disable && params.disable === true) {
                    await ambrosiaMod.hideQuickBar();
                } else {
                    await ambrosiaMod.showQuickBar();
                }
            }
        },

        ambrosiaMinibarAction: async (params: HSSettingActionParams) => {
            const context = params.contextName ?? "HSSettings";

            const ambrosiaMod = HSModuleManager.getModule<HSAmbrosia>('HSAmbrosia');

            if (ambrosiaMod) {
                if (params.disable && params.disable === true) {
                    await ambrosiaMod.disableBerryMinibars();
                } else {
                    // Auto-enable GDS if not already enabled
                    const gdsSettingEnabled = HSSettings.getSetting('useGameData')?.isEnabled();
                    if (!gdsSettingEnabled) {
                        HSSettings.getSetting('useGameData')?.enable();
                    }
                    await ambrosiaMod.enableBerryMinibars();
                }
            }
        },

        patch: async (params: HSSettingActionParams) => {
            const context = params.contextName ?? "HSSettings";

            if (!params.patchConfig || !params.patchConfig.patchName) {
                HSLogger.error("No patch config provided for setting action", context);
                return;
            }

            const patchMod = HSModuleManager.getModule<HSPatches>('HSPatches');

            if (patchMod) {
                if (params.disable && params.disable === true) {
                    console.log("Disabling patch", params.patchConfig.patchName, context);
                    await patchMod.revertPatch(params.patchConfig.patchName);
                } else {
                    console.log("Enabling patch", params.patchConfig.patchName, context);
                    await patchMod.applyPatch(params.patchConfig.patchName);
                }
            }
        },

        useGameData: async (params: HSSettingActionParams) => {
            const context = params.contextName ?? "HSSettings";

            const gameDataMod = HSModuleManager.getModule<HSGameData>('HSGameData');

            if (gameDataMod) {
                if (params.disable && params.disable === true) {
                    gameDataMod.disableGDS();
                } else {
                    gameDataMod.enableGDS();
                }
            }
        },

        autoLoadout: async (params: HSSettingActionParams) => {
            const context = params.contextName ?? "HSSettings";

            const ambrosiaMod = HSModuleManager.getModule<HSAmbrosia>('HSAmbrosia');

            if (ambrosiaMod) {
                if (params.disable && params.disable === true) {
                    await ambrosiaMod.disableAutoLoadout();
                } else {
                    await ambrosiaMod.enableAutoLoadout();
                }
            }
        },
                
        ambrosiaIdleSwapAction: async (params: HSSettingActionParams) => {
            const context = params.contextName ?? "HSSettings";

            const ambrosiaMod = HSModuleManager.getModule<HSAmbrosia>('HSAmbrosia');
            let newState: boolean | undefined;

            if (ambrosiaMod) {
                if (params.disable && params.disable === true) {
                    ambrosiaMod.disableIdleSwap();
                    newState = false;
                } else {
                    // Auto-enable GDS if not already enabled
                    const gdsSettingEnabled = HSSettings.getSetting('useGameData')?.isEnabled();
                    if (!gdsSettingEnabled) {
                        HSSettings.getSetting('useGameData')?.enable();
                    }
                    await ambrosiaMod.enableIdleSwap();
                    newState = true;
                }
                // Update quick access button
                const quickMenuBtn = document.querySelector('button[data-type="ambrosia-idle-swap"]');
                if (quickMenuBtn) {
                    const stateHtml = newState
                        ? '<span style="color: #4caf50; font-weight: bold;">ON</span>'
                        : '<span style="color: #e53935; font-weight: bold;">OFF</span>';
                    quickMenuBtn.innerHTML = `<span style="display: inline-block; width: 20px; height: 18px; text-align: center; margin-right: 5px; overflow: hidden;"><img src="${HSGlobal.HSAmbrosia.idleSwapQuickIconUrl}" style="max-width: 100%; max-height: 100%; object-fit: contain; transform: scale(1.3);"></span>Ambrosia Swapper [${stateHtml}]`;
                }

                HSUI.Notify(`Ambrosia AFK Swapper toggled ${newState ? 'ON' : 'OFF'}.`, {
                    position: 'top',
                    notificationType: 'default'
                });
            }
        },

        startAutosingAction: async (params: HSSettingActionParams) => {
            const context = params.contextName ?? "HSSettings";

            const autosingMod = HSModuleManager.getModule<HSAutosing>('HSAutosing');
            if (autosingMod) {
                if (params.disable && params.disable === true) {
                    await autosingMod.disableAutoSing();
                } else {
                    // Auto-enable GDS if not already enabled
                    const gdsSettingEnabled = HSSettings.getSetting('useGameData')?.isEnabled();
                    if (!gdsSettingEnabled) {
                        HSSettings.getSetting('useGameData')?.enable();
                    }
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
            await HSSettings.editSelectedStrategy();
        },
        deleteAutosingStrategy: async (params: HSSettingActionParams) => {
            const context = params.contextName ?? "HSSettings";
            await HSSettings.deleteSelectedStrategy();
        },

        exportAutosingStrategy: async (params: HSSettingActionParams) => {
            const context = params.contextName ?? "HSSettings";
            await HSSettings.exportSelectedStrategy();
        },

        migrateIdsAndExportAutosingStrategy: async (params: HSSettingActionParams) => {
            const context = params.contextName ?? "HSSettings";
            await HSSettings.exportSelectedStrategy(true);
        },

        importAutosingStrategy: async (params: HSSettingActionParams) => {
            const context = params.contextName ?? "HSSettings";
            await HSSettings.importStrategy();
        },

        hideMaxedGQUpgradesAction: async (params: HSSettingActionParams) => {
            const context = params.contextName ?? "HSSettings";
            const qolButtonsMod = HSModuleManager.getModule<HSQOLButtons>('HSQOLButtons');
            if (qolButtonsMod) {
                qolButtonsMod.setGQButtonsVisibility();
            }
        },

        hideMaxedOctUpgradesAction: async (params: HSSettingActionParams) => {
            const context = params.contextName ?? "HSSettings";
            const qolButtonsMod = HSModuleManager.getModule<HSQOLButtons>('HSQOLButtons');
            if (qolButtonsMod) {
                qolButtonsMod.setOctButtonsVisibility();
            }
        },

        enableGQDistributorAction: async (params: HSSettingActionParams) => {
            const context = params.contextName ?? "HSSettings";
            const qolButtonsMod = HSModuleManager.getModule<HSQOLButtons>('HSQOLButtons');
            if (qolButtonsMod) {
                if (params.disable && params.disable === true) {
                    qolButtonsMod.hideGQDistributor();
                } else {
                    qolButtonsMod.showGQDistributor();
                }
            }
        },

        enableAutomationQuickBarAction: async (params: HSSettingActionParams) => {
            const context = params.contextName ?? "HSSettings";
            const qolButtonsMod = HSModuleManager.getModule<HSQOLButtons>('HSQOLButtons');
            if (!qolButtonsMod) return;

            // Remove or inject the quickbar section based on setting
            const quickbarSectionId = 'automation';
            // Fallback to import if not on window
            const HSQuickbarManagerImport = HSQuickbarManager.getInstance();

            // Use explicit module teardown/setup wrappers so watcher and RAF lifecycle stays correct
            // when this setting is toggled multiple times.
            if (params.disable && params.disable === true) {
                qolButtonsMod.teardownAutomationQuickbarWrapper();
                HSQuickbarManagerImport.removeSection(quickbarSectionId);
            } else {
                HSQuickbarManagerImport.registerSection(quickbarSectionId, () => qolButtonsMod.getAutomationQuickbarSection());
                HSQuickbarManagerImport.injectSection(quickbarSectionId);
                // Ensure quickbar is populated after injection
                HSQuickbarManagerImport.whenSectionInjected(quickbarSectionId).then(() => {
                    const section = HSQuickbarManagerImport.getSection(quickbarSectionId) as HTMLDivElement;
                    if (section) {
                        qolButtonsMod.automationQuickBarContainer = section;
                        qolButtonsMod.setupAutomationQuickbarWrapper();
                    } else {
                        HSLogger.warn(`Quickbar section '${quickbarSectionId}' not found during automation quickbar setup.`, context);
                    }
                });
            }
        }
    }

    constructor() { }

    getAction(actionName: string): ((params: HSSettingActionParams) => any) | null {
        const self = this;

        if (actionName in this.#settingActions) {
            return (params: HSSettingActionParams) => {
                self.#settingActions[actionName](params);
            };
        } else {
            return null;
        }
    }
}