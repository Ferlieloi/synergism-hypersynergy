import { HSUI } from "../../../hs-core/hs-ui"
import { HSUIC } from "../../../hs-core/hs-ui-components";
import { HSInputType, EPredefinedPosition } from "../../../../types/module-types/hs-ui-types";
import { HSAutosingStrategy } from "../../../../types/module-types/hs-autosing-types"
import { HSModuleManager } from "../../../hs-core/module/hs-module-manager";
import { openStrategyPhaseModal } from "./hs-autosing-strategyPhase-modal";

export class HSAutosingStrategyModal {
    static async open(): Promise<void> {
        const uiMod = HSModuleManager.getModule<HSUI>('HSUI');
        if (!uiMod || !uiMod.uiReady) return;

        const strategyDraft: HSAutosingStrategy = {
            strategyName: "",
            strategy: []
        };

        const modalContent = {
            htmlContent: HSUIC.Flex({
                styles: {
                    flexDirection: "column",
                    gap: "12px",
                    padding: "14px",
                    width: "480px"
                },
                html: [
                    HSUIC.Input({
                        id: "hs-autosing-strategy-name",
                        type: HSInputType.TEXT,
                        props: { placeholder: "Strategy name" }
                    }),
                    HSUIC.Div({
                        id: "hs-autosing-phase-list",
                        html: "No strategy phases added yet."
                    }),
                    HSUIC.Button({
                        id: "hs-autosing-add-phase-btn",
                        text: "Add phase"
                    }),
                    HSUIC.Button({
                        id: "hs-autosing-create-btn",
                        text: "Create Strategy"
                    })
                ],
            }), title: "Create Autosing Strategy"
        }

        const modalID = await uiMod.Modal(modalContent);

        // 2. Helper function to refresh the phase list in the UI
        const updatePhaseListUI = () => {
            const listDiv = document.getElementById("hs-autosing-phase-list");
            if (!listDiv) return;

            if (strategyDraft.strategy.length === 0) {
                listDiv.innerHTML = "No strategy phases added yet.";
                return;
            }

            // Create a simple text summary of the phases
            listDiv.innerHTML = strategyDraft.strategy
                .map((p, i) => `<div>Phase ${i + 1}: ${p.startPhase} → <strong>${p.endPhase}</strong></div>`)
                .join("");
        };

        // 3. Add Event Listeners to the Main Modal
        // We use a small timeout or wait for the next frame to ensure the DOM is ready
        setTimeout(() => {
            // Handle "Add strategy phase" button
            const addPhaseBtn = document.getElementById("hs-autosing-add-phase-btn");
            addPhaseBtn?.addEventListener("click", async () => {
                // Call your existing function!
                await openStrategyPhaseModal(
                    uiMod,
                    strategyDraft.strategy,
                    (newPhase) => {
                        // This runs when the user clicks "Done" in the second modal
                        strategyDraft.strategy.push(newPhase);
                        updatePhaseListUI();
                    }
                );
            });

            // Handle "Create Strategy" (final save)
            const createBtn = document.getElementById("hs-autosing-create-btn");
            createBtn?.addEventListener("click", () => {
                const nameInput = document.getElementById("hs-autosing-strategy-name") as HTMLInputElement;
                strategyDraft.strategyName = nameInput?.value || "Unnamed Strategy";

                console.log("Final Strategy Created:", strategyDraft);
                uiMod.CloseModal(modalID);
            });
        }, 0);
    }
}
