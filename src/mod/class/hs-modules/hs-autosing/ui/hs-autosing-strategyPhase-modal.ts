import {
    phases,
    AutosingStrategyPhase,
    PhaseOption,
    CorruptionLoadoutDefinition
} from "../../../../types/module-types/hs-autosing-types";
import { openAutosingCorruptionModal } from "./hs-autosing-corruption-modal";
import { openAutosingChallengesModal } from "./hs-autosing-challenge-modal";
import { HSUI } from "../../../hs-core/hs-ui"

export async function openStrategyPhaseModal(
    uiMod: HSUI,
    existingPhases: AutosingStrategyPhase[],
    corruptionLoadouts: CorruptionLoadoutDefinition[],
    onCreate: (phase: AutosingStrategyPhase) => void,
    onUpdate?: (phase: AutosingStrategyPhase) => void,
    existingPhase?: AutosingStrategyPhase,
    parentModalId?: string,
    options?: {
        isSpecialPhase?: boolean;
        displayName?: string;
        forcedStartPhase?: PhaseOption;
        forcedEndPhase?: PhaseOption;
    }
) {
    const isEditing = !!existingPhase;
    const isSpecialPhase = options?.isSpecialPhase ?? false;
    const displayName = options?.displayName ?? '';

    const lastPhaseEnd: PhaseOption = existingPhases.length
        ? existingPhases[existingPhases.length - 1].endPhase
        : "start";

    const startPhaseValue: PhaseOption =
        options?.forcedStartPhase ?? existingPhase?.startPhase ?? lastPhaseEnd;

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

    let selectedLoadoutName = existingPhase?.corruptionLoadoutName ?? null;

    const lastPhaseIndex = phases.indexOf(startPhaseValue);
    const validEndPhases = isSpecialPhase
        ? [options?.forcedEndPhase ?? existingPhase?.endPhase ?? startPhaseValue]
        : phases.slice(lastPhaseIndex + 1);

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
            ${isSpecialPhase && displayName
                ? `<div class="hs-phase-select-group">
                    <label class="hs-phase-label">Phase</label>
                    <div class="hs-phase-select" style="cursor: default;">${displayName}</div>
                </div>`
                : ""}

            ${!isSpecialPhase
                ? `<div class="hs-phase-select-group">
                        <label class="hs-phase-label">Starting Phase</label>
                        <select class="hs-phase-select" disabled>
                            <option selected>
                                ${startPhaseValue}
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
                    </div>`
                : ""}

            <div class="hs-phase-select-group">
                <label class="hs-phase-label">Corruption Loadout</label>
                <div class="hs-phase-select" id="hs-phase-corruption-selection">
                    ${selectedLoadoutName ?? "None"}
                </div>
            </div>

            <div class="hs-phase-config-group">
                <div class="hs-phase-config-btn" id="hs-autosing-phase-corruptions">
                    Select Corruption Loadout
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
        title: isEditing
            ? (displayName ? `Edit ${displayName}` : `Edit Strategy Phase ${existingPhase.startPhase}-${existingPhase.endPhase}`)
            : (displayName ? `Create ${displayName}` : `Create Strategy Phase`),
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
                const endPhase = (isSpecialPhase
                    ? (options?.forcedEndPhase ?? existingPhase?.endPhase ?? startPhaseValue)
                    : select?.value) as PhaseOption;
                if (!endPhase) return;

                const updatedPhase: AutosingStrategyPhase = {
                    // Keep the original start phase if editing, otherwise use lastPhaseEnd
                    startPhase: existingPhase ? existingPhase.startPhase : startPhaseValue,
                    endPhase,
                    corruptions: { ...workingCorruptions },
                    corruptionLoadoutName: selectedLoadoutName,
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
                    const selectionRef = { value: selectedLoadoutName };
                    void openAutosingCorruptionModal(
                        uiMod,
                        corruptionLoadouts,
                        selectionRef,
                        modalId,
                        (newValue) => {
                            selectedLoadoutName = newValue;

                            // Ensure the draft phase reflects the selection immediately so reopening the selector
                            // (before hitting Save/Create) shows the updated choice.
                            if (existingPhase) {
                                existingPhase.corruptionLoadoutName = selectedLoadoutName;
                            }

                            const label = selectedLoadoutName ? selectedLoadoutName : "None";
                            const selectionEl = document.getElementById("hs-phase-corruption-selection") as HTMLDivElement | null;
                            if (selectionEl) {
                                selectionEl.textContent = label;
                            }
                        }
                    );
            }

            if (el.id === "hs-autosing-phase-challenges") {
                const challengeStart = existingPhase?.startPhase ?? startPhaseValue;
                const challengeEnd = isSpecialPhase ? (options?.forcedEndPhase ?? existingPhase?.endPhase ?? startPhaseValue) : (existingPhase?.endPhase ?? (document.getElementById("hs-autosing-end-phase") as HTMLSelectElement)?.value ?? "error");
                await openAutosingChallengesModal(uiMod, workingStrat, challengeStart, challengeEnd, corruptionLoadouts, modalId, isSpecialPhase ? displayName : undefined);
            }
        });
    }, 0);
}
