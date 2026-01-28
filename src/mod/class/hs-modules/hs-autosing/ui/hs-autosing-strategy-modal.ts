import { HSUI } from "../../../hs-core/hs-ui"
import { HSAutosingStrategy } from "../../../../types/module-types/hs-autosing-types"
import { HSModuleManager } from "../../../hs-core/module/hs-module-manager";
import { openStrategyPhaseModal } from "./hs-autosing-strategyPhase-modal";
import { HSSettings } from "../../../hs-core/settings/hs-settings";

export class HSAutosingStrategyModal {
    static async open(existingStrategy?: HSAutosingStrategy, selectValue?: number, parentModalId?: string): Promise<void> {
        const uiMod = HSModuleManager.getModule<HSUI>('HSUI');
        if (!uiMod || !uiMod.uiReady) return;

        const isEditMode = !!existingStrategy;

        const strategyDraft: HSAutosingStrategy = existingStrategy
            ? {
                strategyName: existingStrategy.strategyName,
                strategy: JSON.parse(JSON.stringify(existingStrategy.strategy))
            }
            : {
                strategyName: "",
                strategy: []
            };

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

            if (strategyDraft.strategy.length === 0) {
                listDiv.innerHTML = '<div class="hs-strategy-empty-state">No strategy phases added yet.</div>';
                return;
            }

            listDiv.innerHTML = strategyDraft.strategy
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
                            HSSettings.saveStrategiesToStorage(strategyDraft, existingStrategy!.strategyName);
                            HSUI.Notify(`Strategy "${strategyDraft.strategyName}" updated`, {
                                notificationType: "success"
                            });
                        } else {
                            HSSettings.saveStrategiesToStorage(strategyDraft);
                            HSUI.Notify(`Strategy "${strategyDraft.strategyName}" created`, {
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
                } else if (action === "edit" && phaseIndex !== undefined) {
                    const index = parseInt(phaseIndex);
                    const phase = strategyDraft.strategy[index];

                    await openStrategyPhaseModal(
                        uiMod,
                        strategyDraft.strategy.slice(0, index),
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
                }
            });
        }, 0);
    }
}