import { HSUI } from "../../../hs-core/hs-ui";
import { HSInputType } from "../../../../types/module-types/hs-ui-types";
import { AutosingStrategyPhase, Challenge } from "../../../../types/module-types/hs-autosing-types";

export async function openAutosingChallengesModal(
    uiMod: HSUI,
    stratData: AutosingStrategyPhase["strat"]
): Promise<void> {
    const modalId = "hs-autosing-challenges-modal";

    // Inject styles once for all challenge list items
    HSUI.injectStyle(`
        .hs-challenge-item {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px;
            background-color: #2a2a2a;
            border-radius: 4px;
            margin-bottom: 6px;
        }
        .hs-challenge-item-text {
            flex: 1;
            font-weight: 500;
        }
        .hs-challenge-btn {
            padding: 4px 8px;
            min-width: 30px;
            cursor: pointer;
            background-color: #192a56;
            border-radius: 4px;
            text-align: center;
            user-select: none;
        }
        .hs-challenge-btn:hover {
            opacity: 0.8;
        }
        .hs-challenge-btn-edit {
            padding: 4px 12px;
        }
        .hs-challenge-btn-delete {
            background-color: #b33939;
        }
        .hs-challenges-input-section {
            display: flex;
            flex-direction: column;
            gap: 10px;
            padding: 12px;
            background-color: #1a1a1a;
            border-radius: 6px;
        }
        .hs-challenges-input-row {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .hs-challenges-input-label {
            width: 120px;
            font-weight: bold;
        }
        .hs-challenges-input {
            flex: 1;
        }
        .hs-challenges-footer {
            display: flex;
            justify-content: flex-end;
            gap: 8px;
            margin-top: 12px;
        }
    `, 'hs-challenges-modal-styles');

    // Local working copy of challenges
    const workingChallenges: Challenge[] = [...stratData];

    const renderChallengeList = (): string => {
        if (workingChallenges.length === 0) {
            return '<div style="color: #888; padding: 10px;">No challenges added yet.</div>';
        }

        return workingChallenges
            .map((entry, index) => `
                <div class="hs-challenge-item">
                    <div class="hs-challenge-item-text">Challenge ${entry.challengeNumber} × ${entry.challengeCompletions} (wait: ${entry.challengeWaitTime}ms)</div>
                    <div class="hs-challenge-btn" id="hs-challenge-up-${index}" data-index="${index}">↑</div>
                    <div class="hs-challenge-btn" id="hs-challenge-down-${index}" data-index="${index}">↓</div>
                    <div class="hs-challenge-btn hs-challenge-btn-edit" id="hs-challenge-edit-${index}" data-index="${index}">Edit</div>
                    <div class="hs-challenge-btn hs-challenge-btn-delete" id="hs-challenge-delete-${index}" data-index="${index}">×</div>
                </div>
            `)
            .join("");
    };

    const updateChallengeList = () => {
        const listContainer = document.getElementById("hs-challenge-list-container");
        if (listContainer) {
            listContainer.innerHTML = renderChallengeList();
        }
    };

    const modalContent = {
        htmlContent: `
            <div id="${modalId}" style="display: flex; flex-direction: column; gap: 16px; padding: 14px; width: 480px; max-height: 600px;">
                <!-- Input section -->
                <div class="hs-challenges-input-section">
                    <div class="hs-challenges-input-row">
                        <div class="hs-challenges-input-label">Challenge:</div>
                        <input 
                            type="number" 
                            id="hs-challenge-num-input" 
                            class="hs-panel-input-number hs-challenges-input"
                            min="1" 
                            max="15" 
                            value="1" 
                            placeholder="1-15"
                        />
                    </div>
                    <div class="hs-challenges-input-row">
                        <div class="hs-challenges-input-label">Completions:</div>
                        <input 
                            type="number" 
                            id="hs-challenge-completions-input" 
                            class="hs-panel-input-number hs-challenges-input"
                            min="1" 
                            value="1" 
                            placeholder="Number of completions"
                        />
                    </div>
                    <div class="hs-challenges-input-row">
                        <div class="hs-challenges-input-label">Wait Time (ms):</div>
                        <input 
                            type="number" 
                            id="hs-challenge-wait-input" 
                            class="hs-panel-input-number hs-challenges-input"
                            min="0" 
                            value="0" 
                            placeholder="Wait time in miliseconds"
                        />
                    </div>
                    <div 
                        class="hs-panel-btn" 
                        id="hs-challenge-add-btn" 
                        style="margin-top: 8px; background-color: #009432;"
                    >
                        Add Challenge
                    </div>
                </div>

                <!-- Challenge list -->
                <div style="flex: 1; overflow-y: auto; max-height: 300px;">
                    <div id="hs-challenge-list-container">
                        ${renderChallengeList()}
                    </div>
                </div>

                <!-- Footer buttons -->
                <div class="hs-challenges-footer">
                    <div class="hs-panel-btn" id="hs-challenges-cancel-btn">Cancel</div>
                    <div class="hs-panel-btn" id="hs-challenges-save-btn" style="background-color: #192a56;">Done</div>
                </div>
            </div>
        `,
        id: modalId,
        title: "Configure Challenges"
    };

    const modalInstance = await uiMod.Modal(modalContent);

    // Track if we're editing an existing challenge
    let editingIndex: number | null = null;

    // Helper to clear/reset inputs
    const resetInputs = () => {
        const challengeInput = document.getElementById("hs-challenge-num-input") as HTMLInputElement;
        const completionsInput = document.getElementById("hs-challenge-completions-input") as HTMLInputElement;
        const waitInput = document.getElementById("hs-challenge-wait-input") as HTMLInputElement;
        const addBtn = document.getElementById("hs-challenge-add-btn") as HTMLButtonElement;

        if (challengeInput) challengeInput.value = "1";
        if (completionsInput) completionsInput.value = "1";
        if (waitInput) waitInput.value = "0";
        if (addBtn) addBtn.textContent = "Add Challenge";

        editingIndex = null;
    };

    // Event delegation
    setTimeout(() => {
        const modalRoot = document.getElementById(modalId);
        if (!modalRoot) return;

        modalRoot.addEventListener("click", (e) => {
            const el = e.target as HTMLElement;
            const elementId = el.id;

            // Add/Update challenge
            if (elementId === "hs-challenge-add-btn") {
                const challengeInput = document.getElementById("hs-challenge-num-input") as HTMLInputElement;
                const completionsInput = document.getElementById("hs-challenge-completions-input") as HTMLInputElement;
                const waitInput = document.getElementById("hs-challenge-wait-input") as HTMLInputElement;

                const challenge = Math.max(1, Math.min(15, Number(challengeInput?.value) || 1));
                const completions = Math.max(1, Number(completionsInput?.value) || 1);
                const waitTime = Math.max(0, Number(waitInput?.value) || 0);

                if (editingIndex !== null) {
                    // Update existing
                    workingChallenges[editingIndex] = {
                        challengeNumber: challenge,
                        challengeCompletions: completions,
                        challengeWaitTime: waitTime
                    };
                } else {
                    // Add new
                    workingChallenges.push({
                        challengeNumber: challenge,
                        challengeCompletions: completions,
                        challengeWaitTime: waitTime
                    });
                }

                updateChallengeList();
                resetInputs();
                return;
            }

            // Move up
            if (elementId.startsWith("hs-challenge-up-")) {
                const index = Number(el.dataset.index);
                if (index > 0) {
                    [workingChallenges[index - 1], workingChallenges[index]] =
                        [workingChallenges[index], workingChallenges[index - 1]];
                    updateChallengeList();
                    resetInputs(); // Cancel any ongoing edit
                }
                return;
            }

            // Move down
            if (elementId.startsWith("hs-challenge-down-")) {
                const index = Number(el.dataset.index);
                if (index < workingChallenges.length - 1) {
                    [workingChallenges[index], workingChallenges[index + 1]] =
                        [workingChallenges[index + 1], workingChallenges[index]];
                    updateChallengeList();
                    resetInputs(); // Cancel any ongoing edit
                }
                return;
            }

            // Edit
            if (elementId.startsWith("hs-challenge-edit-")) {
                const index = Number(el.dataset.index);
                const entry = workingChallenges[index];

                const challengeInput = document.getElementById("hs-challenge-num-input") as HTMLInputElement;
                const completionsInput = document.getElementById("hs-challenge-completions-input") as HTMLInputElement;
                const waitInput = document.getElementById("hs-challenge-wait-input") as HTMLInputElement;
                const addBtn = document.getElementById("hs-challenge-add-btn") as HTMLButtonElement;

                if (challengeInput) challengeInput.value = String(entry.challengeNumber);
                if (completionsInput) completionsInput.value = String(entry.challengeCompletions);
                if (waitInput) waitInput.value = String(entry.challengeWaitTime);
                if (addBtn) addBtn.textContent = "Update Challenge";

                editingIndex = index;
                return;
            }

            // Delete
            if (elementId.startsWith("hs-challenge-delete-")) {
                const index = Number(el.dataset.index);
                workingChallenges.splice(index, 1);
                updateChallengeList();
                resetInputs();
                return;
            }

            // Save
            if (elementId === "hs-challenges-save-btn") {
                // Copy working challenges back to the original array
                stratData.length = 0;
                stratData.push(...workingChallenges);
                HSUI.removeInjectedStyle('hs-challenges-modal-styles');
                uiMod.CloseModal(modalInstance);
                return;
            }

            // Cancel
            if (elementId === "hs-challenges-cancel-btn") {
                HSUI.removeInjectedStyle('hs-challenges-modal-styles');
                uiMod.CloseModal(modalInstance);
                return;
            }
        });
    }, 0);
}

// "auto-sing": {
//         "page": "auto-sing",
//         "pageName": "auto-sing",
//         "pageColor": "grey",
//         "order": 10
//     },