import { AutosingStrategyPhase, Challenge } from "../../../../types/module-types/hs-autosing-types";
import { HSUI } from "../../../hs-core/hs-ui";
import { SPECIAL_ACTIONS } from "../../../../types/module-types/hs-autosing-types";

export async function openAutosingChallengesModal(
    uiMod: HSUI,
    stratData: AutosingStrategyPhase["strat"]
): Promise<void> {


    const getSpecialActionLabel = (num: number): string | null =>
        SPECIAL_ACTIONS.find(a => a.value === num)?.label ?? null;

    const modalId = "hs-autosing-challenges-modal";
    const workingChallenges: Challenge[] = [...stratData];

    // Helper to render the list inside the modal
    const renderChallengeList = (): string => {
        if (workingChallenges.length === 0) {
            return '<div class="hs-challenges-empty-state">No challenges added yet.</div>';
        }

        return workingChallenges
            .map((entry, index) => {
                const actionLabel = getSpecialActionLabel(entry.challengeNumber);
                const isSpecial = !!actionLabel;

                const displayText = isSpecial
                    ? `<strong>${actionLabel}</strong>`
                    : `Challenge ${entry.challengeNumber} (${entry.challengeCompletions} completions)`;

                return `
                <div class="hs-challenge-item">
                    <div class="hs-challenge-item-text">
                        ${displayText}
                        <div>
                            Wait after goal reached: ${entry.challengeWaitTime}ms ${!isSpecial ? `| Max: ${entry.challengeMaxTime}ms` : ''}
                        </div>
                    </div>
                    <div class="hs-challenge-controls">
                        <div class="hs-challenge-btn hs-challenge-btn-edit" id="hs-challenge-edit-${index}" data-index="${index}">✎</div>
                        <div class="hs-challenge-btn" id="hs-challenge-up-${index}" data-index="${index}">↑</div>
                        <div class="hs-challenge-btn hs-challenge-btn-delete" id="hs-challenge-delete-${index}" data-index="${index}">×</div>
                        <div class="hs-challenge-btn" id="hs-challenge-down-${index}" data-index="${index}">↓</div>
                    </div>
                </div>`;
            })
            .join("");
    };

    const updateChallengeListUI = () => {
        const listContainer = document.getElementById("hs-challenge-list-container");
        if (listContainer) listContainer.innerHTML = renderChallengeList();
    };

    const modalContent = {
        htmlContent: `
    <div id="${modalId}" class="hs-challenges-modal-container">
        <div class="hs-challenges-input-section">
            <div class="hs-challenges-input-row" style="grid-column: 1 / -1;">
                <div class="hs-challenges-input-label">Special Action:</div>
                <select id="hs-challenge-action-select" class="hs-challenges-input">
                    <option value="">None (Standard Challenge)</option>
                    ${SPECIAL_ACTIONS.map(a => `<option value="${a.value}">${a.label}</option>`).join("")}
                </select>
            </div>
            <div class="hs-challenges-input-row">
                <div class="hs-challenges-input-label">Challenge #:</div>
                <input type="number" id="hs-challenge-num-input" class="hs-challenges-input" min="1" max="15" value="1" />
            </div>
            <div class="hs-challenges-input-row">
                <div class="hs-challenges-input-label">Min Completions:</div>
                <input type="number" id="hs-challenge-completions-input" class="hs-challenges-input" min="1" value="1" />
            </div>
            <div class="hs-challenges-input-row">
                <div class="hs-challenges-input-label">Wait (ms):</div>
                <input type="number" id="hs-challenge-wait-input" class="hs-challenges-input" min="0" value="0" />
            </div>
            <div class="hs-challenges-input-row">
                <div class="hs-challenges-input-label">Max Time (ms):</div>
                <input type="number" id="hs-challenge-max-time-input" class="hs-challenges-input" min="100" value="10000" />
            </div>
            <div class="hs-challenges-add-btn" id="hs-challenge-add-btn">Add Action/Challenge</div>
        </div>

        <div class="hs-challenges-list-container">
            <div id="hs-challenge-list-container">
                ${renderChallengeList()}
            </div>
        </div>

        <div class="hs-challenges-footer">
            <div class="hs-challenges-footer-btn hs-challenges-cancel-btn" id="hs-challenges-cancel-btn">Cancel</div>
            <div class="hs-challenges-footer-btn hs-challenges-save-btn" id="hs-challenges-save-btn">Save Strategy</div>
        </div>
    </div>`,
        title: "Configure Strategy Actions"
    };

    const modalInstance = await uiMod.Modal(modalContent);
    let editingIndex: number | null = null;

    // Logic to disable inputs based on whether a Special Action is selected
    const updateInputState = () => {
        const actionSelect = document.getElementById("hs-challenge-action-select") as HTMLSelectElement;
        const isSpecial = !!actionSelect?.value;

        const challengeNum = document.getElementById("hs-challenge-num-input") as HTMLInputElement;
        const minCompletions = document.getElementById("hs-challenge-completions-input") as HTMLInputElement;
        const maxTime = document.getElementById("hs-challenge-max-time-input") as HTMLInputElement;

        [challengeNum, minCompletions, maxTime].forEach(el => {
            if (el) {
                el.disabled = isSpecial;
                el.parentElement!.style.opacity = isSpecial ? "0.4" : "1";
            }
        });
    };

    const resetInputs = () => {
        (document.getElementById("hs-challenge-num-input") as HTMLInputElement).value = "1";
        (document.getElementById("hs-challenge-completions-input") as HTMLInputElement).value = "0";
        (document.getElementById("hs-challenge-wait-input") as HTMLInputElement).value = "0";
        (document.getElementById("hs-challenge-max-time-input") as HTMLInputElement).value = "1000000";
        (document.getElementById("hs-challenge-action-select") as HTMLSelectElement).value = "";
        (document.getElementById("hs-challenge-add-btn") as HTMLElement).textContent = "Add Action/Challenge";
        editingIndex = null;
        updateInputState();
    };

    setTimeout(() => {
        const root = document.getElementById(modalId);
        const actionSelect = document.getElementById("hs-challenge-action-select") as HTMLSelectElement;

        actionSelect?.addEventListener("change", updateInputState);

        root?.addEventListener("click", (e) => {
            const el = e.target as HTMLElement;
            const id = el.id;

            // ADD / UPDATE
            if (id === "hs-challenge-add-btn") {
                const isSpecial = !!actionSelect.value;
                const newEntry: Challenge = {
                    challengeNumber: isSpecial ? Number(actionSelect.value) : Number((document.getElementById("hs-challenge-num-input") as HTMLInputElement).value),
                    challengeCompletions: isSpecial ? 0 : Number((document.getElementById("hs-challenge-completions-input") as HTMLInputElement).value),
                    challengeWaitTime: Number((document.getElementById("hs-challenge-wait-input") as HTMLInputElement).value),
                    challengeMaxTime: isSpecial ? 0 : Number((document.getElementById("hs-challenge-max-time-input") as HTMLInputElement).value)
                };

                if (editingIndex !== null) workingChallenges[editingIndex] = newEntry;
                else workingChallenges.push(newEntry);

                updateChallengeListUI();
                resetInputs();
            }

            // EDIT
            if (id.startsWith("hs-challenge-edit-")) {
                editingIndex = Number(el.dataset.index);
                const item = workingChallenges[editingIndex];
                const actionLabel = getSpecialActionLabel(item.challengeNumber);

                if (actionLabel) {
                    actionSelect.value = String(item.challengeNumber);
                } else {
                    actionSelect.value = "";
                    (document.getElementById("hs-challenge-num-input") as HTMLInputElement).value = String(item.challengeNumber);
                    (document.getElementById("hs-challenge-completions-input") as HTMLInputElement).value = String(item.challengeCompletions);
                    (document.getElementById("hs-challenge-max-time-input") as HTMLInputElement).value = String(item.challengeMaxTime);
                }

                (document.getElementById("hs-challenge-wait-input") as HTMLInputElement).value = String(item.challengeWaitTime);
                (document.getElementById("hs-challenge-add-btn") as HTMLElement).textContent = "Update Action";
                updateInputState();
            }

            // DELETE
            if (id.startsWith("hs-challenge-delete-")) {
                workingChallenges.splice(Number(el.dataset.index), 1);
                updateChallengeListUI();
                resetInputs();
            }

            // REORDER UP
            if (id.startsWith("hs-challenge-up-")) {
                const idx = Number(el.dataset.index);
                if (idx > 0) {
                    [workingChallenges[idx], workingChallenges[idx - 1]] = [workingChallenges[idx - 1], workingChallenges[idx]];
                    updateChallengeListUI();
                }
            }

            // REORDER DOWN
            if (id.startsWith("hs-challenge-down-")) {
                const idx = Number(el.dataset.index);
                if (idx < workingChallenges.length - 1) {
                    [workingChallenges[idx], workingChallenges[idx + 1]] = [workingChallenges[idx + 1], workingChallenges[idx]];
                    updateChallengeListUI();
                }
            }

            // SAVE
            if (id === "hs-challenges-save-btn") {
                stratData.length = 0;
                stratData.push(...workingChallenges);
                uiMod.CloseModal(modalInstance);
            }

            // CANCEL
            if (id === "hs-challenges-cancel-btn") {
                uiMod.CloseModal(modalInstance);
            }
        });
    }, 0);
}