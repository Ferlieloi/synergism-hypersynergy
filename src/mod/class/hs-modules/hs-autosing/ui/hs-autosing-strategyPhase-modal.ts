import {
    phases,
    AutosingStrategyPhase,
    PhaseOption
} from "../../../../types/module-types/hs-autosing-types";
import { openAutosingCorruptionModal } from "./hs-autosing-corruption-modal";
import { openAutosingChallengesModal } from "./hs-autosing-challenge-modal";
import { HSUI } from "../../../hs-core/hs-ui"
import { HSSettings } from "../../../hs-core/settings/hs-settings"

export async function openStrategyPhaseModal(
    uiMod: HSUI,
    existingPhases: AutosingStrategyPhase[],
    onCreate: (phase: AutosingStrategyPhase) => void,
    onUpdate?: (phase: AutosingStrategyPhase) => void,
    existingPhase?: AutosingStrategyPhase,
    parentModalId?: string
) {
    const isEditing = !!existingPhase;

    const lastPhaseEnd: PhaseOption = existingPhases.length
        ? existingPhases[existingPhases.length - 1].endPhase
        : "start";

    const workingCorruptions: AutosingStrategyPhase["corruptions"] =
        existingPhase?.corruptions || {
            viscosity: 0,
            drought: 0,
            deflation: 0,
            extinction: 0,
            illiteracy: 0,
            recession: 0,
            dilation: 0,
            hyperchallenge: 0
        };

    const workingStrat: AutosingStrategyPhase["strat"] =
        existingPhase?.strat || [];

    const lastPhaseIndex = phases.indexOf(lastPhaseEnd);
    const validEndPhases = phases.slice(lastPhaseIndex + 1);

    const selectOptions = validEndPhases
        .map(
            (phase, i) =>
                `<option value="${phase}" ${existingPhase?.endPhase === phase
                    ? "selected"
                    : i === 0
                        ? "selected"
                        : ""
                }>${phase}</option>`
        )
        .join("");

    const modalContent = {
        htmlContent: `
        <div class="hs-phase-modal-container">
            <div class="hs-phase-select-group">
                <label class="hs-phase-label">Starting Phase</label>
                <select class="hs-phase-select" disabled>
                    <option selected>
                        ${existingPhase?.startPhase ?? lastPhaseEnd}
                    </option>
                </select>
            </div>

            <div class="hs-phase-select-group">
                <label class="hs-phase-label">Ending Phase</label>
                <select
                    id="hs-autosing-end-phase"
                    class="hs-phase-select"
                >
                    ${selectOptions}
                </select>
            </div>

            <div class="hs-phase-config-group">
                <div class="hs-phase-config-btn" id="hs-autosing-phase-corruptions">
                    Configure Corruptions
                </div>
                <div class="hs-phase-config-btn" id="hs-autosing-phase-challenges">
                    Configure Challenges
                </div>
            </div>

            <div class="hs-phase-footer">
                <div class="hs-phase-done-btn" id="hs-autosing-phase-done">
                    ${isEditing ? "Save" : "Create Phase"}
                </div>
                <div class="hs-phase-error" id="hs-phase-error" style="display:none;"></div>
            </div>
        </div>
        `,
        title: isEditing ? `Edit Strategy Phase ${existingPhase.startPhase}-${existingPhase.endPhase}` : `Create Strategy Phase`,
        parentModalId: parentModalId
    };

    const modalId = await uiMod.Modal(modalContent);

    setTimeout(() => {
        const root = document.querySelector(".hs-phase-modal-container");
        if (!root) return;

        root.addEventListener("click", async (e) => {
            const el = e.target as HTMLElement;

            if (el.id === "hs-autosing-phase-done") {
                const select = document.getElementById("hs-autosing-end-phase") as HTMLSelectElement;
                const endPhase = select?.value as PhaseOption;
                if (!endPhase) return;

                const updatedPhase: AutosingStrategyPhase = {
                    // Keep the original start phase if editing, otherwise use lastPhaseEnd
                    startPhase: existingPhase ? existingPhase.startPhase : lastPhaseEnd,
                    endPhase,
                    corruptions: { ...workingCorruptions },
                    strat: [...workingStrat]
                };

                if (isEditing && onUpdate) {
                    onUpdate(updatedPhase);
                } else {
                    onCreate(updatedPhase);
                }

                HSUI.removeInjectedStyle("hs-phase-modal-styles");
                uiMod.CloseModal(modalId);
            }

            if (el.id === "hs-autosing-phase-corruptions") {
                await openAutosingCorruptionModal(uiMod, workingCorruptions, modalId);
            }

            if (el.id === "hs-autosing-phase-challenges") {
                await openAutosingChallengesModal(uiMod, workingStrat, existingPhase?.startPhase ?? "error", existingPhase?.endPhase ?? "error", modalId);
            }
        });
    }, 0);
}
