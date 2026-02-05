// Challenge Modal Builder for Autosing
// This file builds and manages the modal UI for configuring autosing challenge strategies.
// It supports adding, editing, deleting, and reordering challenges, including special actions and IF jump logic.
// Major features: drag-and-drop, jump targets, input state management, and modal lifecycle.
import { AutosingStrategyPhase, Challenge, CorruptionLoadoutDefinition, LOADOUT_ACTION_VALUE } from "../../../../types/module-types/hs-autosing-types";
import { HSUI } from "../../../hs-core/hs-ui";
import { SPECIAL_ACTIONS, IF_JUMP_VALUE, IsJumpChallenge } from "../../../../types/module-types/hs-autosing-types";
import { HSUtils } from "../../../hs-utils/hs-utils";

// Helper type for mapping IF jump targets in the challenge list
type JumpTargetInfo = {
    ifIndex: number;
    ifId: string;
};

export async function openAutosingChallengesModal(
    uiMod: HSUI,
    stratData: AutosingStrategyPhase["strat"],
    startPhase: string,
    endPhase: string,
    corruptionLoadouts: CorruptionLoadoutDefinition[],
    parentModalId?: string,
    displayName?: string
): Promise<void> {
    // Modal builder entry point. Copies strategy data and sets up modal UI.
    const modalId = "hs-autosing-challenges-modal";
    const workingChallenges: Challenge[] = [...stratData];

    // Precompute map for fast special-action label lookup
    const SPECIAL_ACTION_LABEL_BY_ID = new Map<number, string>(SPECIAL_ACTIONS.map(a => [a.value, a.label] as const));

    // Utility: Get label for special actions (fast via map)
    const getSpecialActionLabel = (entry: Challenge): string | null => {
        if (entry.challengeNumber === LOADOUT_ACTION_VALUE) {
            return entry.loadoutName ? `Load Corruption Loadout: ${entry.loadoutName}` : "Load Corruption Loadout";
        }
        return SPECIAL_ACTION_LABEL_BY_ID.get(entry.challengeNumber) ?? null;
    };
    // Type guard: Is this entry an IF jump?
    const isIfJumpEntry = (entry: Challenge): entry is IsJumpChallenge => { return entry.challengeNumber === IF_JUMP_VALUE && entry.ifJump !== undefined; };
    // Format milliseconds for display
    const formatMs = (ms: number) => `${ms.toLocaleString()}ms`;

    // Render an IF jump block (conditional logic)
    const renderIfBlock = (entry: IsJumpChallenge, index: number) => {
        const mode = entry.ifJump.ifJumpMode ?? "challenges";
        const isChallengesMode = mode === "challenges";

        let contentHtml: string;
        if (isChallengesMode) {
            contentHtml = `
                <strong>IF</strong>
                challenge ${entry.ifJump.ifJumpChallenge}
                ${entry.ifJump.ifJumpOperator}
                ${entry.ifJump.ifJumpValue}
            `;
        } else {
            // Stored C15 mode
            const multiplier = entry.ifJump.ifJumpMultiplier ?? 0;
            const multiplierDisplay = multiplier === 0 ? "" : ` × 10^${multiplier}`;
            contentHtml = `
                <strong>IF</strong>
                Stored C15${multiplierDisplay}
                ${entry.ifJump.ifJumpOperator}
                Current C15
            `;
        }

        return `
    <div class="hs-challenge-item hs-if-block"
        data-index="${index}"
        data-if-index="${index}"
        data-if-id="${entry.ifJump.id}">
        <div class="hs-challenge-drag-handle">⋮⋮</div>
        
        <div class="hs-if-content">
            ${contentHtml}
        </div>

        <div style="flex-grow: 1;"></div>

        <div class="hs-challenge-btn hs-challenge-btn-edit" id="hs-challenge-edit-${index}" data-index="${index}">✎</div>
        <div class="hs-challenge-btn hs-challenge-btn-delete" id="hs-challenge-delete-${index}" data-index="${index}">×</div>
    </div>
    `;
    };

    // Render a jump target placeholder for IF jumps
    const renderIfTarget = (ifIndex: number, ifId: string) => `
        <div class="hs-challenge-item hs-if-target"
            data-jump-for="${ifIndex}"
            data-if-id="${ifId}">
            <div class="hs-challenge-drag-handle">⋮⋮</div>
            ↳ Jump here (IF)
        </div>
    `;

    // Render a standard challenge or special action entry
    const renderNormalEntry = (entry: Challenge, index: number) => {
        const actionLabel = getSpecialActionLabel(entry);

        const isSpecial = !!actionLabel;

        const displayText = isSpecial
            ? `<strong>${actionLabel}</strong>`
            : `Challenge ${entry.challengeNumber}
     (${entry.challengeCompletions} completions)`;

        return `
        <div class="hs-challenge-item" data-index="${index}">
            <div class="hs-challenge-drag-handle">⋮⋮</div>
            <div class="hs-challenge-item-text">
                ${displayText}
                <div class="hs-challenge-meta">
                    Wait before: ${formatMs(entry.challengeWaitBefore ?? 0)} 
                    ${!isSpecial
                ? ` | Wait inside: ${formatMs(entry.challengeWaitTime)}`
                : ""}
                    ${!isSpecial
                ? ` | Max: ${formatMs(entry.challengeMaxTime ?? -1)}`
                : ""}
                </div>
                ${entry.comment ? `<div class=\"hs-challenge-comment\">🗨️ ${entry.comment}</div>` : ""}
            </div>
            <div class="hs-challenge-btn hs-challenge-btn-edit" id="hs-challenge-edit-${index}" data-index="${index}">✎</div>
            <div class="hs-challenge-btn hs-challenge-btn-delete" id="hs-challenge-delete-${index}" data-index="${index}">×</div>
        </div>
        `;
    };

    // Render the full challenge list, inserting jump targets at correct positions
    // Handles mapping IF jumps to their targets and rendering all entries
    const renderChallengeList = () => {
        const elements: string[] = [];

        // Build a map of where jump targets should appear
        const jumpTargetMap: Map<number, JumpTargetInfo[]> = new Map();

        workingChallenges.forEach((entry, index) => {
            if (isIfJumpEntry(entry)) {
                const targetIndex = entry.ifJump.ifJumpIndex;

                if (!jumpTargetMap.has(targetIndex)) {
                    jumpTargetMap.set(targetIndex, []);
                }

                jumpTargetMap.get(targetIndex)!.push({
                    ifIndex: index,
                    ifId: entry.ifJump.id
                });
            }
        })

        // Render items with jump targets inserted at appropriate positions
        workingChallenges.forEach((entry, index) => {
            // Render any jump targets that should appear before this index
            if (jumpTargetMap.has(index)) {
                jumpTargetMap.get(index)!.forEach(ifAction => {
                    const entry = workingChallenges[ifAction.ifIndex] as IsJumpChallenge;
                    elements.push(renderIfTarget(ifAction.ifIndex, entry.ifJump.id));
                });
            }

            // Render the actual challenge
            if (isIfJumpEntry(entry)) {
                elements.push(renderIfBlock(entry as IsJumpChallenge, index));
            } else {
                elements.push(renderNormalEntry(entry, index));
            }
        });

        // Render any jump targets that should appear at the end
        const endIndex = workingChallenges.length;
        if (jumpTargetMap.has(endIndex)) {
            jumpTargetMap.get(endIndex)!.forEach(ifAction => {
                const entry = workingChallenges[ifAction.ifIndex] as IsJumpChallenge;
                elements.push(renderIfTarget(ifAction.ifIndex, entry.ifJump.id));
            });
        }

        return elements.join("");
    };


    // Update the modal UI after changes (re-render list, re-attach listeners)
    const updateUI = () => {
        const container = document.getElementById("hs-challenge-list-container");
        if (container) {
            container.innerHTML = renderChallengeList();
            attachDragListeners();
            attachHoverListeners();
        }
    };

    const loadoutOptions = corruptionLoadouts.length > 0
        ? `
            <option value="" disabled>-- Corruption Loadouts --</option>
            ${corruptionLoadouts
                .map(loadout => `<option value="loadout:${loadout.name}">Load Corruption Loadout: ${loadout.name}</option>`)
                .join("")}
        `
        : "";

    // Modal content definition (HTML and title)
    const modalContent = {
        htmlContent: `
    <div id="${modalId}" class="hs-challenges-modal-container">
        <div class="hs-challenges-input-section">
            <div class="hs-challenges-input-row" style="grid-column: 1 / -1; grid-template-columns: 120px 1fr;">
            <div class="hs-challenges-input-label">Special Action:</div>
                <select id="hs-challenge-action-select" class="hs-challenges-input">
                    <option value="">None (Standard Challenge)</option>
                    ${SPECIAL_ACTIONS.map(a => `<option value="${a.value}">${a.label}</option>`).join("")}
                    ${loadoutOptions}
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
                <div class="hs-challenges-input-label">Wait before (ms):</div>
                <input type="number" id="hs-challenge-wait-before-input" class="hs-challenges-input" min="0" value="0" />
            </div>
            <div class="hs-challenges-input-row">
                <div class="hs-challenges-input-label">Wait inside (ms):</div>
                <input type="number" id="hs-challenge-wait-inside-input" class="hs-challenges-input" min="0" value="0" />
            </div>
            <div class="hs-challenges-input-row">
                <div class="hs-challenges-input-label">Max Time (ms):</div>
                <input type="number" id="hs-challenge-max-time-input" class="hs-challenges-input" min="0" value="10000" />
            </div>
            <div class="hs-challenges-input-row">
                <div class="hs-challenges-input-label">Comment:</div>
                <input type="text" id="hs-challenge-comment-input" class="hs-challenges-input" maxlength="200" placeholder="Add a comment (optional)" />
            </div>
            <div class="hs-challenges-input-row hs-if-jump-row" style="display:none;">
                <div class="hs-challenges-input-label">If Jump Mode</div>
                <select id="hs-if-jump-mode" class="hs-challenges-input">
                    <option value="challenges">Challenges</option>
                    <option value="stored_c15">Stored C15 value</option>
                </select>
            </div>

            <div class="hs-challenges-input-row hs-if-jump-row hs-if-jump-challenge-row" style="display:none;">
                <div class="hs-challenges-input-label">If Challenge</div>
                <input type="number"
                    id="hs-if-jump-challenge"
                    class="hs-challenges-input"
                    min="1"
                    max="15"
                    value="1" />
            </div>

                <div class="hs-challenges-input-row hs-if-jump-row" style="display:none;">
                    <div class="hs-challenges-input-label">Condition</div>
                    <select id="hs-if-jump-operator" class="hs-challenges-input">
                        <option value=">">&gt;</option>
                        <option value="<">&lt;</option>
                    </select>
                </div>

                <div class="hs-challenges-input-row hs-if-jump-row hs-if-jump-value-row" style="display:none;">
                    <div class="hs-challenges-input-label">Value</div>
                    <input type="number"
                        id="hs-if-jump-value"
                        class="hs-challenges-input"
                        value="1" />
                </div>
            </div>
            <div class="hs-challenges-add-btn" id="hs-challenge-add-btn">Add Action/Challenge</div>

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
        title: displayName ? `Configure ${displayName}` : `Configure Strategy Actions (${startPhase}-${endPhase})`
    };

    const modalInstance = await uiMod.Modal({
        ...modalContent,
        parentModalId
    });
    // State variables for editing, drag-and-drop, and jump target management
    let editingIndex: number | null = null;
    let draggedElement: HTMLElement | null = null;
    let draggedIndex: number | null = null;
    let placeholder: HTMLElement | null = null;
    let isJumpTargetDrag = false;
    let jumpTargetIfIndex: number | null = null;

    // Throttle function for performance optimization (limits drag event frequency)
    const throttle = (func: Function, limit: number) => {
        let inThrottle: boolean;
        return function (this: any, ...args: any[]) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    };

    // Attach hover listeners for highlighting IF jump pairs in the UI
    const attachHoverListeners = () => {
        document.querySelectorAll(".hs-challenge-item").forEach(item => {
            const el = item as HTMLElement;
            const ifId = el.dataset.ifId;
            if (!ifId) return;

            el.addEventListener("mouseenter", () => {
                document
                    .querySelectorAll(`[data-if-id="${ifId}"]`)
                    .forEach(e => e.classList.add("hs-jump-highlight"));
            });

            el.addEventListener("mouseleave", () => {
                document
                    .querySelectorAll(`[data-if-id="${ifId}"]`)
                    .forEach(e => e.classList.remove("hs-jump-highlight"));
            });
        });
    };

    // Get visual index (position in rendered list, including jump targets)
    const getVisualIndex = (element: HTMLElement): number => {
        const container = document.getElementById("hs-challenge-list-container");
        if (!container) return 0;

        const allItems = Array.from(container.querySelectorAll(".hs-challenge-item"));
        return allItems.indexOf(element);
    };

    // Convert visual index to array index (skipping jump targets)
    const visualToArrayIndex = (visualIndex: number): number => {
        const container = document.getElementById("hs-challenge-list-container");
        if (!container) return 0;

        const allItems = Array.from(container.querySelectorAll(".hs-challenge-item"));
        let arrayIndex = 0;

        for (let i = 0; i <= visualIndex && i < allItems.length; i++) {
            const item = allItems[i] as HTMLElement;
            if (!item.dataset.jumpFor) {
                if (i === visualIndex) return arrayIndex;
                arrayIndex++;
            }
        }

        return Math.min(arrayIndex, workingChallenges.length);
    };

    // Attach drag-and-drop listeners for reordering challenges and jump targets
    // Handles both normal entries and IF jump target blocks
    const attachDragListeners = () => {
        const items = document.querySelectorAll(".hs-challenge-item");

        items.forEach((item) => {
            const dragHandle = item.querySelector(".hs-challenge-drag-handle") as HTMLElement;

            dragHandle.addEventListener("mousedown", (e) => {
                e.preventDefault();
                const target = item as HTMLElement;

                // Check if this is a jump target (fake block)
                isJumpTargetDrag = target.dataset.jumpFor !== undefined;

                if (isJumpTargetDrag) {
                    jumpTargetIfIndex = Number(target.dataset.jumpFor);
                    draggedIndex = null;
                } else if (target.dataset.index !== undefined) {
                    draggedIndex = Number(target.dataset.index);
                    jumpTargetIfIndex = null;
                } else {
                    return;
                }

                draggedElement = target;

                const rect = target.getBoundingClientRect();
                const offsetX = e.clientX - rect.left;
                const offsetY = e.clientY - rect.top;

                // Create placeholder
                placeholder = target.cloneNode(true) as HTMLElement;
                placeholder.style.opacity = "0.3";
                placeholder.style.pointerEvents = "none";

                const originalWidth = target.getBoundingClientRect().width; // Get precise width including padding
                const originalHeight = target.getBoundingClientRect().height;
                // Style dragged element
                target.style.position = "fixed";
                target.style.zIndex = "1000";
                target.style.cursor = "grabbing";
                target.style.pointerEvents = "none";
                target.style.width = originalWidth + "px";
                target.style.height = originalHeight + "px";
                target.style.boxSizing = "border-box";
                target.style.boxShadow = "0 8px 16px rgba(0,0,0,0.3)";
                target.style.transform = "scale(1.03)";
                target.style.transition = "transform 0.15s ease";

                // Insert placeholder
                target.parentNode?.insertBefore(placeholder, target);

                const moveAt = (clientX: number, clientY: number) => {
                    if (draggedElement) {
                        draggedElement.style.left = (clientX - offsetX) + "px";
                        draggedElement.style.top = (clientY - offsetY) + "px";
                    }
                };

                moveAt(e.clientX, e.clientY);

                const onMouseMove = throttle((e: MouseEvent) => {
                    const listContainer = document.getElementById("hs-challenge-list-container");
                    if (!listContainer) return;
                    moveAt(e.clientX, e.clientY);

                    if (draggedElement) {
                        draggedElement.style.display = "none";
                        const elemBelow = document.elementFromPoint(e.clientX, e.clientY);
                        draggedElement.style.display = "";

                        if (!elemBelow) return;

                        const droppableBelow = elemBelow.closest(".hs-challenge-item") as HTMLElement;
                        const containerRect = listContainer.getBoundingClientRect();
                        const isBelowList = e.clientY > containerRect.bottom - 5;

                        if (
                            (droppableBelow &&
                                droppableBelow !== draggedElement &&
                                droppableBelow !== placeholder)
                            || isBelowList
                        ) {

                            const dropVisualIndex = getVisualIndex(droppableBelow);
                            const currentVisualIndex = getVisualIndex(draggedElement);

                            if (dropVisualIndex === currentVisualIndex) return;

                            // For jump targets: update ifJumpIndex
                            if (isJumpTargetDrag && jumpTargetIfIndex !== null) {
                                const dropArrayIndex = isBelowList
                                    ? workingChallenges.length
                                    : visualToArrayIndex(dropVisualIndex);
                                const ifEntry = workingChallenges[jumpTargetIfIndex];

                                if (isIfJumpEntry(ifEntry)) {
                                    ifEntry.ifJump.ifJumpIndex = dropArrayIndex;

                                    const listContainer = document.getElementById("hs-challenge-list-container");
                                    if (listContainer) {
                                        const currentScroll = listContainer.scrollTop;
                                        listContainer.innerHTML = renderChallengeList();
                                        listContainer.scrollTop = currentScroll;

                                        // Find and restore dragged element
                                        const newDraggedElement = document.querySelector(
                                            `[data-jump-for="${jumpTargetIfIndex}"]`
                                        ) as HTMLElement;

                                        if (newDraggedElement) {
                                            draggedElement = newDraggedElement;
                                            placeholder = newDraggedElement.cloneNode(true) as HTMLElement;
                                            placeholder.style.opacity = "0.3";
                                            placeholder.style.pointerEvents = "none";

                                            newDraggedElement.style.position = "fixed";
                                            newDraggedElement.style.zIndex = "1000";
                                            newDraggedElement.style.cursor = "grabbing";
                                            newDraggedElement.style.pointerEvents = "none";
                                            newDraggedElement.style.width = newDraggedElement.offsetWidth + "px";
                                            newDraggedElement.style.boxShadow = "0 8px 16px rgba(0,0,0,0.3)";
                                            newDraggedElement.style.transform = "scale(1.03)";
                                            newDraggedElement.parentNode?.insertBefore(placeholder, newDraggedElement);
                                            moveAt(e.clientX, e.clientY);
                                        }

                                        attachDragListeners();
                                        attachHoverListeners();
                                    }
                                }
                            }
                            // For regular items: reorder in array
                            else if (draggedIndex !== null && droppableBelow.dataset.index !== undefined) {
                                const dropIndex = Number(droppableBelow.dataset.index);

                                if (dropIndex !== draggedIndex) {
                                    const draggedItem = workingChallenges[draggedIndex];
                                    workingChallenges.splice(draggedIndex, 1);
                                    workingChallenges.splice(dropIndex, 0, draggedItem);
                                    draggedIndex = dropIndex;

                                    const listContainer = document.getElementById("hs-challenge-list-container");
                                    if (listContainer) {
                                        const currentScroll = listContainer.scrollTop;
                                        listContainer.innerHTML = renderChallengeList();
                                        listContainer.scrollTop = currentScroll;

                                        const newDraggedElement = document.querySelector(
                                            `[data-index="${draggedIndex}"]`
                                        ) as HTMLElement;

                                        if (newDraggedElement && !newDraggedElement.dataset.jumpFor) {
                                            draggedElement = newDraggedElement;
                                            placeholder = newDraggedElement.cloneNode(true) as HTMLElement;
                                            placeholder.style.opacity = "0.3";
                                            placeholder.style.pointerEvents = "none";

                                            newDraggedElement.style.position = "fixed";
                                            newDraggedElement.style.zIndex = "1000";
                                            newDraggedElement.style.cursor = "grabbing";
                                            newDraggedElement.style.pointerEvents = "none";
                                            newDraggedElement.style.width = newDraggedElement.offsetWidth + "px";
                                            newDraggedElement.style.boxShadow = "0 8px 16px rgba(0,0,0,0.3)";
                                            newDraggedElement.style.transform = "scale(1.03)";
                                            newDraggedElement.parentNode?.insertBefore(placeholder, newDraggedElement);
                                            moveAt(e.clientX, e.clientY);
                                        }

                                        attachDragListeners();
                                        attachHoverListeners();
                                    }
                                }
                            }
                        }
                    }
                }, 16);

                const onMouseUp = () => {
                    if (draggedElement) {
                        draggedElement.style.position = "";
                        draggedElement.style.zIndex = "";
                        draggedElement.style.cursor = "";
                        draggedElement.style.pointerEvents = "";
                        draggedElement.style.width = "";
                        draggedElement.style.boxShadow = "";
                        draggedElement.style.transform = "";
                        draggedElement.style.left = "";
                        draggedElement.style.top = "";
                        draggedElement.style.transition = "";
                    }

                    if (placeholder && placeholder.parentNode) {
                        placeholder.parentNode.removeChild(placeholder);
                    }

                    draggedElement = null;
                    draggedIndex = null;
                    isJumpTargetDrag = false;
                    jumpTargetIfIndex = null;
                    placeholder = null;

                    document.removeEventListener("mousemove", onMouseMove as any);
                    document.removeEventListener("mouseup", onMouseUp);

                    resetInputs();
                };

                document.addEventListener("mousemove", onMouseMove as any);
                document.addEventListener("mouseup", onMouseUp);
            });

            dragHandle.style.cursor = "grab";
        });
    };

    // Update input state: disables/enables fields based on selected action type
    // Handles IF jump mode toggling and input visibility
    const updateInputState = () => {
        const actionSelect = document.getElementById(
            "hs-challenge-action-select"
        ) as HTMLSelectElement;
        const ifJumpModeSelect = document.getElementById(
            "hs-if-jump-mode"
        ) as HTMLSelectElement;

        const actionValue = actionSelect?.value ?? "";
        const isSpecial = actionValue !== "";
        const isIfJump = actionValue === String(IF_JUMP_VALUE);
        const ifJumpMode = ifJumpModeSelect?.value ?? "challenges";
        const isChallengesMode = ifJumpMode === "challenges";

        const standardInputs = [
            "hs-challenge-num-input",
            "hs-challenge-completions-input",
            "hs-challenge-max-time-input",
            "hs-challenge-wait-inside-input"
        ];

        // Toggle standard inputs
        standardInputs.forEach(id => {
            const el = document.getElementById(id) as HTMLInputElement;
            if (el) {
                el.disabled = isSpecial;
                el.parentElement!.style.opacity = isSpecial ? "0.4" : "1";
                el.parentElement!.style.display = isIfJump ? "none" : "";
            }
        });

        // Toggle if-jump inputs
        document
            .querySelectorAll(".hs-if-jump-row")
            .forEach(el => {
                (el as HTMLElement).style.display = isIfJump ? "" : "none";
            });

        // Handle if-jump challenge row based on mode (1st box)
        const challengeRow = document.querySelector(".hs-if-jump-challenge-row") as HTMLElement;
        const challengeInput = document.getElementById("hs-if-jump-challenge") as HTMLInputElement;
        const challengeLabel = challengeRow?.querySelector(".hs-challenges-input-label") as HTMLElement;

        // Handle if-jump value row (3rd box)
        const valueRow = document.querySelector(".hs-if-jump-value-row") as HTMLElement;
        const valueInput = document.getElementById("hs-if-jump-value") as HTMLInputElement;
        const valueLabel = valueRow?.querySelector(".hs-challenges-input-label") as HTMLElement;

        if (challengeRow && challengeInput && challengeLabel) {
            if (isIfJump) {
                challengeRow.style.display = "";

                if (isChallengesMode) {
                    // Editable mode for Challenges
                    challengeLabel.textContent = "If Challenge";
                    challengeInput.type = "number";
                    challengeInput.min = "1";
                    challengeInput.max = "15";
                    challengeInput.disabled = false;
                    challengeInput.value = challengeInput.dataset.lastChallengeValue ?? "1";
                    challengeInput.style.opacity = "1";
                    challengeInput.style.cursor = "";
                    challengeRow.style.opacity = "1";
                } else {
                    // Stored C15 mode: show exponent input for 10^x multiplier
                    // Store the current challenge value before switching
                    if (challengeInput.max === "15" && challengeInput.value) {
                        challengeInput.dataset.lastChallengeValue = challengeInput.value;
                    }

                    challengeLabel.textContent = "Multiplier (10^x)";
                    challengeInput.type = "number";
                    challengeInput.min = "";
                    challengeInput.max = "";
                    challengeInput.disabled = false;
                    if (challengeInput.value === "") {
                        challengeInput.value =
                            challengeInput.dataset.lastExponentValue ?? "0";
                    }
                    challengeInput.style.opacity = "1";
                    challengeInput.style.cursor = "";
                    challengeRow.style.opacity = "1";
                }
            } else {
                challengeRow.style.display = "none";
            }
        }

        // Handle value row (3rd box) based on mode
        if (valueRow && valueInput && valueLabel) {
            if (isIfJump) {
                valueRow.style.display = "";

                if (isChallengesMode) {
                    // Editable mode for Challenges - normal value input
                    valueLabel.textContent = "Value";
                    valueInput.type = "number";
                    valueInput.disabled = false;
                    valueInput.value = valueInput.dataset.lastValue ?? "1";
                    valueInput.style.opacity = "1";
                    valueInput.style.cursor = "";
                    valueRow.style.opacity = "1";
                } else {
                    // Stored C15 mode: show "Current C15 value" as disabled
                    // Store the current value before switching
                    if (valueInput.type === "number" && valueInput.value && !valueInput.disabled) {
                        valueInput.dataset.lastValue = valueInput.value;
                    }

                    valueLabel.textContent = "Compare To";
                    valueInput.type = "text";
                    valueInput.disabled = true;
                    valueInput.value = "Current C15 value";
                    valueInput.style.opacity = "0.6";
                    valueInput.style.cursor = "not-allowed";
                    valueRow.style.opacity = "0.8";
                }
            } else {
                valueRow.style.display = "none";
            }
        }
    };

    // Reset all input fields to default values and update input state
    const resetInputs = () => {
        (document.getElementById("hs-challenge-num-input") as HTMLInputElement).value = "1";
        (document.getElementById("hs-challenge-completions-input") as HTMLInputElement).value = "0";
        (document.getElementById("hs-challenge-wait-inside-input") as HTMLInputElement).value = "0";
        (document.getElementById("hs-challenge-wait-before-input") as HTMLInputElement).value = "0";
        (document.getElementById("hs-challenge-max-time-input") as HTMLInputElement).value = "1000000";
        (document.getElementById("hs-challenge-action-select") as HTMLSelectElement).value = "";
        (document.getElementById("hs-if-jump-mode") as HTMLSelectElement).value = "challenges";
        (document.getElementById("hs-challenge-add-btn") as HTMLElement).textContent = "Add Action/Challenge";
        editingIndex = null;
        updateInputState();
    };

    // Main modal event handler setup (runs after modal is rendered)
    setTimeout(() => {
        const root = document.getElementById(modalId);
        const actionSelect = document.getElementById("hs-challenge-action-select") as HTMLSelectElement;
        const ifJumpModeSelect = document.getElementById("hs-if-jump-mode") as HTMLSelectElement;

        actionSelect?.addEventListener("change", updateInputState);
        ifJumpModeSelect?.addEventListener("change", updateInputState);
        attachDragListeners();
        attachHoverListeners();

        // Main click event handler for modal buttons (add, edit, delete, save, cancel)
        root?.addEventListener("click", (e) => {
            const el = e.target as HTMLElement;
            const id = el.id;

            // ADD / UPDATE
            if (id === "hs-challenge-add-btn") {
                const actionValue = actionSelect.value;
                const isIfJump = actionValue === String(IF_JUMP_VALUE);
                const isLoadout = actionValue.startsWith("loadout:");
                const isSpecial = actionValue !== "";

                let newEntry: Challenge;
                const commentValue = (document.getElementById("hs-challenge-comment-input") as HTMLInputElement)?.value?.trim() ?? "";

                if (isIfJump) {
                    const existingEntry = editingIndex !== null ? workingChallenges[editingIndex] : null;
                    const ifJumpMode = ifJumpModeSelect.value as "challenges" | "stored_c15";
                    const isChallengesMode = ifJumpMode === "challenges";

                    newEntry = {
                        challengeNumber: IF_JUMP_VALUE,
                        challengeCompletions: 0,
                        challengeWaitTime: 0,
                        challengeMaxTime: 0,

                        ifJump: {
                            id: existingEntry?.ifJump?.id ?? HSUtils.uuidv4(),
                            ifJumpMode: ifJumpMode,
                            ifJumpChallenge: isChallengesMode
                                ? Number((document.getElementById("hs-if-jump-challenge") as HTMLInputElement).value)
                                : 15, // Default to 15 for stored_c15 mode
                            ifJumpOperator: (document.getElementById("hs-if-jump-operator") as HTMLSelectElement).value as ">" | "<",
                            ifJumpValue: isChallengesMode
                                ? Number((document.getElementById("hs-if-jump-value") as HTMLInputElement).value)
                                : 0, // Not used in stored_c15 mode
                            ifJumpMultiplier: isChallengesMode
                                ? 0 // Not used in challenges mode
                                : Number((document.getElementById("hs-if-jump-challenge") as HTMLInputElement).value),
                            ifJumpIndex: existingEntry?.ifJump?.ifJumpIndex ?? workingChallenges.length + 1

                        }
                    } as Challenge & any;
                    if (commentValue) (newEntry as any).comment = commentValue;
                } else if (isLoadout) {
                    const loadoutName = actionValue.replace("loadout:", "");
                    newEntry = {
                        challengeNumber: LOADOUT_ACTION_VALUE,
                        challengeCompletions: 0,
                        challengeWaitTime: Number((document.getElementById("hs-challenge-wait-inside-input") as HTMLInputElement).value),
                        challengeWaitBefore: Number((document.getElementById("hs-challenge-wait-before-input") as HTMLInputElement).value),
                        challengeMaxTime: 0,
                        loadoutName
                    };
                    if (commentValue) (newEntry as any).comment = commentValue;
                } else {
                    newEntry = {
                        challengeNumber: isSpecial
                            ? Number(actionValue)
                            : Number((document.getElementById("hs-challenge-num-input") as HTMLInputElement).value),
                        challengeCompletions: isSpecial ? 0 : Number((document.getElementById("hs-challenge-completions-input") as HTMLInputElement).value),
                        challengeWaitTime: Number((document.getElementById("hs-challenge-wait-inside-input") as HTMLInputElement).value),
                        challengeWaitBefore: Number((document.getElementById("hs-challenge-wait-before-input") as HTMLInputElement).value),
                        challengeMaxTime: isSpecial ? 0 : Number((document.getElementById("hs-challenge-max-time-input") as HTMLInputElement).value)
                    };
                    if (commentValue) (newEntry as any).comment = commentValue;
                }

                if (editingIndex !== null) workingChallenges[editingIndex] = newEntry;
                else workingChallenges.push(newEntry);

                updateUI();
                resetInputs();
            }

            // EDIT
            if (id.startsWith("hs-challenge-edit-")) {
                editingIndex = Number(el.dataset.index);
                const item = workingChallenges[editingIndex];
                const actionLabel = getSpecialActionLabel(item);

                // Set comment field for editing
                (document.getElementById("hs-challenge-comment-input") as HTMLInputElement).value = item.comment ?? "";

                if (isIfJumpEntry(item)) {
                    actionSelect.value = String(IF_JUMP_VALUE);

                    // Set the mode first
                    const mode = item.ifJump?.ifJumpMode ?? "challenges";
                    ifJumpModeSelect.value = mode;

                    // Set values based on mode
                    if (mode === "challenges") {
                        (document.getElementById("hs-if-jump-challenge") as HTMLInputElement).value =
                            String(item.ifJump?.ifJumpChallenge ?? 1);
                        (document.getElementById("hs-if-jump-value") as HTMLInputElement).value =
                            String(item.ifJump?.ifJumpValue ?? 1);
                    } else {
                        // stored_c15 mode - challenge input holds multiplier
                        (document.getElementById("hs-if-jump-challenge") as HTMLInputElement).value =
                            String(item.ifJump?.ifJumpMultiplier ?? 0);
                    }

                    (document.getElementById("hs-if-jump-operator") as HTMLSelectElement).value =
                        item.ifJump?.ifJumpOperator ?? '>';

                    (document.getElementById("hs-challenge-wait-inside-input") as HTMLInputElement).value = String(item.challengeWaitTime);
                    (document.getElementById("hs-challenge-wait-before-input") as HTMLInputElement).value = String(item.challengeWaitBefore ?? 0);

                    (document.getElementById("hs-challenge-add-btn") as HTMLElement).textContent = "Update Action";

                    updateInputState();
                    return;
                }

                if (item.challengeNumber === LOADOUT_ACTION_VALUE) {
                    actionSelect.value = item.loadoutName ? `loadout:${item.loadoutName}` : "";
                } else if (actionLabel) {
                    actionSelect.value = String(item.challengeNumber);
                } else {
                    actionSelect.value = "";
                    (document.getElementById("hs-challenge-num-input") as HTMLInputElement).value = String(item.challengeNumber);
                    (document.getElementById("hs-challenge-completions-input") as HTMLInputElement).value = String(item.challengeCompletions);
                    (document.getElementById("hs-challenge-max-time-input") as HTMLInputElement).value = String(item.challengeMaxTime);
                }

                (document.getElementById("hs-challenge-wait-inside-input") as HTMLInputElement).value = String(item.challengeWaitTime);
                (document.getElementById("hs-challenge-wait-before-input") as HTMLInputElement).value = String(item.challengeWaitBefore ?? 0);
                (document.getElementById("hs-challenge-add-btn") as HTMLElement).textContent = "Update Action";
                updateInputState();
            }

            // DELETE
            if (id.startsWith("hs-challenge-delete-")) {
                workingChallenges.splice(Number(el.dataset.index), 1);
                updateUI();
                resetInputs();
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