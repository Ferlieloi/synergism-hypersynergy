import { HSUI } from "../../../hs-core/hs-ui"
import { HSAutosingStrategy, AutosingStrategyPhase, AOAG_PHASE_ID, AOAG_PHASE_NAME, createDefaultAoagPhase, CorruptionLoadoutDefinition } from "../../../../types/module-types/hs-autosing-types"
import { HSModuleManager } from "../../../hs-core/module/hs-module-manager";
import { openStrategyPhaseModal } from "./hs-autosing-strategyPhase-modal";
import { HSSettings } from "../../../hs-core/settings/hs-settings";
import { openAutosingCorruptionLoadoutsModal } from "./hs-autosing-corruption-loadouts-modal";
import { HSLogger } from '../../../hs-core/hs-logger';

export class HSAutosingStrategyModal {
    static async open(existingStrategy?: HSAutosingStrategy, selectValue?: number, parentModalId?: string): Promise<void> {
        const uiMod = HSModuleManager.getModule<HSUI>('HSUI');
        if (!uiMod || !uiMod.uiReady) return;

        const isEditMode = !!existingStrategy;

        const clonePhase = (phase: AutosingStrategyPhase) => JSON.parse(JSON.stringify(phase)) as AutosingStrategyPhase;
        const cloneLoadouts = (loadouts: CorruptionLoadoutDefinition[]) => JSON.parse(JSON.stringify(loadouts)) as CorruptionLoadoutDefinition[];
        const defaultAoagPhase = createDefaultAoagPhase();

        const strategyDraft: HSAutosingStrategy = existingStrategy
            ? {
                strategyName: existingStrategy.strategyName,
                strategy: JSON.parse(JSON.stringify(existingStrategy.strategy)),
                aoagPhase: existingStrategy.aoagPhase
                    ? clonePhase(existingStrategy.aoagPhase)
                    : clonePhase(defaultAoagPhase),
                corruptionLoadouts: cloneLoadouts(existingStrategy.corruptionLoadouts ?? [])
            }
            : {
                strategyName: "",
                strategy: [],
                aoagPhase: clonePhase(defaultAoagPhase),
                corruptionLoadouts: []
            };

        if (strategyDraft.strategy.length > 0) {
            const aoagIndex = strategyDraft.strategy.findIndex(p => p.phaseId === AOAG_PHASE_ID);
            if (aoagIndex !== -1) {
                if (!strategyDraft.aoagPhase) {
                    strategyDraft.aoagPhase = clonePhase(strategyDraft.strategy[aoagIndex]);
                }
                strategyDraft.strategy.splice(aoagIndex, 1);
            }
        }

        if (strategyDraft.aoagPhase) {
            strategyDraft.aoagPhase.phaseId = AOAG_PHASE_ID;
        }

        const fixPhaseChain = () => {
            for (let i = 1; i < strategyDraft.strategy.length; i++) {
                const prevPhase = strategyDraft.strategy[i - 1];
                const currentPhase = strategyDraft.strategy[i];
                currentPhase.startPhase = prevPhase.endPhase;
            }
        };

        const updatePhaseListUI = () => {
            const listDiv = document.getElementById("hs-autosing-phase-list");
            if (!listDiv) return;

            const aoagHtml = strategyDraft.aoagPhase
                ? `
                    <div class="hs-strategy-phase-item">
                        <div class="hs-strategy-phase-text">
                            <strong>${AOAG_PHASE_NAME}</strong>
                        </div>
                        <div class="hs-strategy-btn hs-strategy-btn-icon hs-strategy-btn-edit" data-action="edit-aoag">
                            ✎
                        </div>
                    </div>
                `
                : '';

            const phaseHtml = strategyDraft.strategy.length === 0
                ? '<div class="hs-strategy-empty-state">No strategy phases added yet.</div>'
                : strategyDraft.strategy
                    .map((p, i) => `
                        <div class="hs-strategy-phase-item">
                            <div class="hs-strategy-phase-text">
                                Phase ${i + 1}: ${p.startPhase} <span class="hs-strategy-phase-arrow">→</span> <strong>${p.endPhase}</strong>
                            </div>
                            <div class="hs-strategy-btn hs-strategy-btn-icon hs-strategy-btn-edit" data-phase-index="${i}" data-action="edit">
                                ✎
                            </div>
                            <div class="hs-strategy-btn hs-strategy-btn-icon hs-strategy-btn-delete" data-phase-index="${i}" data-action="delete">
                                ×
                            </div>
                        </div>
                    `)
                    .join("");

            listDiv.innerHTML = `${aoagHtml}${phaseHtml}`;
        };

        const modalContent = {
            htmlContent: `
                <div class="hs-strategy-modal-container" id="hs-strategy-modal-root">
                    <div class="hs-strategy-input-section">
                        <div class="hs-strategy-input-label">Strategy Name</div>
                        <input 
                            type="text" 
                            id="hs-autosing-strategy-name" 
                            class="hs-strategy-name-input"
                            placeholder="Enter strategy name..."
                            value="${strategyDraft.strategyName}"
                            ${isEditMode ? 'disabled style="background:#000;color:#888;cursor:not-allowed;"' : ''}
                        />
                    </div>

                    <div class="hs-strategy-input-section">
                        <div class="hs-strategy-input-label">Strategy Phases</div>
                        <div id="hs-autosing-phase-list" class="hs-strategy-phase-list">
                            <div class="hs-strategy-empty-state">No strategy phases added yet.</div>
                        </div>
                    </div>

                    <div class="hs-strategy-error" id="hs-strategy-error" style="display: none; color: #ef5350; padding: 10px; background: rgba(239, 83, 80, 0.1); border: 1px solid #ef5350; border-radius: 3px; margin-top: 10px;"></div>

                    <div class="hs-strategy-btn-group">
                        <div class="hs-strategy-btn hs-strategy-btn-secondary" id="hs-autosing-loadouts-btn">
                            Create Corruption Loadouts
                        </div>
                        <div class="hs-strategy-btn hs-strategy-btn-secondary" id="hs-autosing-add-phase-btn">
                            + Add Phase
                        </div>
                        <div class="hs-strategy-btn hs-strategy-btn-primary" id="hs-autosing-create-btn">
                            ${isEditMode ? 'Update Strategy' : 'Create Strategy'}
                        </div>
                    </div>
                </div>
            `,
            title: isEditMode ? "Edit Autosing Strategy" : "Create Autosing Strategy",
            parentModalId: parentModalId
        };

        const modalID = await uiMod.Modal(modalContent);

        setTimeout(() => {
            const modalRoot = document.querySelector('.hs-strategy-modal-container');
            if (!modalRoot) return;

            updatePhaseListUI();

            modalRoot.addEventListener("click", async (e) => {
                const el = e.target as HTMLElement;
                const action = el.dataset.action;
                const phaseIndex = el.dataset.phaseIndex;

                if (el.id === "hs-autosing-add-phase-btn") {
                    await openStrategyPhaseModal(
                        uiMod,
                        strategyDraft.strategy,
                        strategyDraft.corruptionLoadouts ?? [],
                        (newPhase) => {
                            strategyDraft.strategy.push(newPhase);
                            fixPhaseChain();
                            updatePhaseListUI();
                        },
                        undefined, // onUpdate
                        undefined, // existingPhase
                        modalID // parentModalId
                    );
                } else if (el.id === "hs-autosing-create-btn") {
                    const errorBox = document.getElementById("hs-strategy-error");
                    const nameInput = document.getElementById("hs-autosing-strategy-name") as HTMLInputElement;
                    strategyDraft.strategyName = nameInput?.value || "Unnamed Strategy";
                    try {
                        if (isEditMode) {
                            HSSettings.saveStrategyToStorage(strategyDraft, existingStrategy!.strategyName);
                            HSAutosingStrategyModal.updateStrategyDropdownList();
                            HSSettings.selectAutosingStrategyByName(existingStrategy!.strategyName);
                            HSLogger.log(`[HSAutosing] Strategy "${strategyDraft.strategyName}" updated.`, 'HSAutosingStrategyModal');
                            HSUI.Notify(`Strategy "${strategyDraft.strategyName}" updated`, {
                                notificationType: "success"
                            });
                        } else {
                            HSSettings.saveStrategyToStorage(strategyDraft);
                            HSAutosingStrategyModal.updateStrategyDropdownList();
                            HSSettings.selectAutosingStrategyByName(strategyDraft.strategyName);
                            HSLogger.log(`[HSAutosing] Strategy "${strategyDraft.strategyName}" created and selected.`, 'HSAutosingStrategyModal');
                            HSUI.Notify(`Strategy "${strategyDraft.strategyName}" created and selected.`, {
                                notificationType: "success"
                            });
                        }
                        uiMod.CloseModal(modalID);
                    } catch (err) {
                        if (errorBox) {
                            errorBox.textContent = (err as Error).message;
                            errorBox.style.display = "block";
                        }
                    }
                } else if (action === "edit-aoag") {
                    if (!strategyDraft.aoagPhase) return;

                    await openStrategyPhaseModal(
                        uiMod,
                        [],
                        strategyDraft.corruptionLoadouts ?? [],
                        () => { },
                        (updatedPhase) => {
                            updatedPhase.phaseId = AOAG_PHASE_ID;
                            strategyDraft.aoagPhase = updatedPhase;
                            updatePhaseListUI();
                        },
                        strategyDraft.aoagPhase,
                        modalID,
                        { isSpecialPhase: true, displayName: AOAG_PHASE_NAME }
                    );
                } else if (action === "edit" && phaseIndex !== undefined) {
                    const index = parseInt(phaseIndex);
                    const phase = strategyDraft.strategy[index];

                    await openStrategyPhaseModal(
                        uiMod,
                        strategyDraft.strategy.slice(0, index),
                        strategyDraft.corruptionLoadouts ?? [],
                        () => { }, // onCreate not needed for edit
                        (updatedPhase) => {
                            strategyDraft.strategy[index] = updatedPhase;
                            fixPhaseChain();
                            updatePhaseListUI();
                        },
                        phase,
                        modalID // parentModalId
                    );
                } else if (action === "delete" && phaseIndex !== undefined) {
                    const index = parseInt(phaseIndex);
                    strategyDraft.strategy.splice(index, 1);
                    fixPhaseChain();
                    updatePhaseListUI();
                } else if (el.id === "hs-autosing-loadouts-btn") {
                    await openAutosingCorruptionLoadoutsModal(uiMod, strategyDraft, modalID);
                }
            });
        }, 0);
    }

    /**
     * Updates the autosing strategy dropdown options and selection after create/import/delete.
     * Handles both manifest and user strategies.
     */
    static updateStrategyDropdownList() {
        const setting = HSSettings.getSetting("autosingStrategy");
        const control = setting.getDefinition().settingControl;
        if (!control?.selectOptions) return;

        // Full rebuild: clear existing options
        control.selectOptions.length = 0;

        // Add manifest strategies first (default, undeletable)
        const defaultNames = HSSettings.getDefaultStrategyNames();
        const manifestSet = new Set(defaultNames);
        const defaultStrategiesOptions = [];
        for (const name of defaultNames) {
            defaultStrategiesOptions.push({ text: HSSettings.getStrategyDisplayName(name), value: name, isDefault: true });
        }

        // Add user strategies after (from localStorage)
        const userStrategies = HSSettings.getStrategies().filter(s => !manifestSet.has(s.strategyName));
        const userStrategiesOptions = [];
        for (const s of userStrategies) {
            userStrategiesOptions.push({ text: HSSettings.getStrategyDisplayName(s.strategyName), value: s.strategyName, isDefault: false });
        }

        // Store in selectOptions for programmatic access
        control.selectOptions.push(...defaultStrategiesOptions, ...userStrategiesOptions);

        // Update the actual HTML select element to match the new options, using optgroups
        const selectEl = document.querySelector(`#${control.controlId}`) as HTMLSelectElement | null;
        if (selectEl) {
            // Remove all options
            while (selectEl.options.length > 0) {
                selectEl.remove(0);
            }
            // Create optgroups
            if (defaultStrategiesOptions.length > 0) {
                const optgroupDefault = document.createElement('optgroup');
                optgroupDefault.label = 'Default Strategies';
                for (const opt of defaultStrategiesOptions) {
                    const option = document.createElement('option');
                    option.text = opt.text;
                    option.value = String(opt.value);
                    option.setAttribute('data-default', 'true');
                    optgroupDefault.appendChild(option);
                }
                selectEl.appendChild(optgroupDefault);
            }
            if (userStrategiesOptions.length > 0) {
                const optgroupUser = document.createElement('optgroup');
                optgroupUser.label = 'User Strategies';
                for (const opt of userStrategiesOptions) {
                    const option = document.createElement('option');
                    option.text = opt.text;
                    option.value = String(opt.value);
                    option.setAttribute('data-default', 'false');
                    optgroupUser.appendChild(option);
                }
                selectEl.appendChild(optgroupUser);
            }
        }
    }
}