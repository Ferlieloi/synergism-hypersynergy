import {
    phases,
    AutosingStrategyPhase,
    PhaseOption
} from "../../../../types/module-types/hs-autosing-types";
import { HSUI } from "../../../hs-core/hs-ui";
import { HSUICSelectOption } from "../../../../types/module-types/hs-ui-types";
import { openAutosingCorruptionModal } from "./hs-autosing-corruption-modal";
import { openAutosingChallengesModal } from "./hs-autosing-challenge-modal";


export async function openStrategyPhaseModal(
    uiMod: HSUI,
    existingPhases: AutosingStrategyPhase[],
    onCreate: (phase: AutosingStrategyPhase) => void
) {
    const lastPhaseEnd: PhaseOption = existingPhases.length
        ? existingPhases[existingPhases.length - 1].endPhase
        : "start";

    const lastPhaseIndex = phases.indexOf(lastPhaseEnd);

    // Only allow phases AFTER the last end phase (including "end")
    const validEndPhases = phases.slice(lastPhaseIndex + 1);

    const selectOptions: HSUICSelectOption[] = validEndPhases.map((phase, i) => ({
        value: phase,
        text: phase,
        selected: i === 0
    }));

    const modalId = `hs-autosing-phase-modal-${existingPhases.length}`;

    const modalContent = {
        htmlContent: `
            <div id="${modalId}">
                <div class="hs-modal-body">
                    <label for="hs-autosing-start-phase">Starting Phase:</label>
                    <select id="hs-autosing-start-phase" disabled>
                        <option value="${lastPhaseEnd}" selected>
                            ${lastPhaseEnd || "(start)"}
                        </option>
                    </select>

                    <label for="hs-autosing-end-phase" style="margin-top:1rem;">
                        Ending Phase:
                    </label>
                    <select id="hs-autosing-end-phase">
                        ${selectOptions
                .map(
                    opt =>
                        `<option value="${opt.value}" ${opt.selected ? "selected" : ""
                        }>${opt.text}</option>`
                )
                .join("")}
                    </select>

                    <div style="margin-top:1rem;">
                        <button
                            id="hs-autosing-phase-corruptions"
                            class="hs-btn-secondary"
                        >
                            Configure Corruptions
                        </button>
                        <button
                            id="hs-autosing-phase-challenges"
                            class="hs-btn-secondary"
                        >
                            Configure Challenges
                        </button>
                    </div>
                </div>

                <div class="hs-modal-footer">
                    <button
                        id="hs-autosing-phase-done"
                        class="hs-btn-primary"
                    >
                        Done
                    </button>
                    <button
                        id="hs-autosing-phase-cancel"
                        class="hs-btn-secondary"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        `,
        id: modalId,
        title: "Create Autosing Strategy Phase"
    };

    const workingCorruptions: AutosingStrategyPhase["corruptions"] = {
        viscosity: 0,
        drought: 0,
        deflation: 0,
        extinction: 0,
        illiteracy: 0,
        recession: 0,
        dilation: 0,
        hyperchallenged: 0
    };

    const workingStrat: AutosingStrategyPhase["strat"] = [];

    // Create modal
    const actualModalId = await uiMod.Modal(modalContent);

    // Event delegation
    const modalRoot = document.getElementById(modalId);

    if (!modalRoot) {
        console.error(`Could not find modal with ID: ${modalId}`);
        return;
    }

    modalRoot.addEventListener("click", (e) => {
        const el = e.target as HTMLElement;
        if (!el?.id) return;

        switch (el.id) {
            case "hs-autosing-phase-done": {
                const select = document.getElementById(
                    "hs-autosing-end-phase"
                ) as HTMLSelectElement;

                const endPhase = select?.value as PhaseOption;
                if (!endPhase) return;

                const newPhase: AutosingStrategyPhase = {
                    startPhase: lastPhaseEnd,
                    endPhase,
                    corruptions: { ...workingCorruptions },
                    strat: { ...workingStrat }
                };

                onCreate(newPhase);
                uiMod.CloseModal(actualModalId);
                break;
            }

            case "hs-autosing-phase-cancel":
                uiMod.CloseModal(actualModalId);
                break;

            case "hs-autosing-phase-corruptions":
                openAutosingCorruptionModal(uiMod, workingCorruptions);
                break;


            case "hs-autosing-phase-challenges":
                openAutosingChallengesModal(uiMod, workingStrat)
                break;
        }
    });

}
