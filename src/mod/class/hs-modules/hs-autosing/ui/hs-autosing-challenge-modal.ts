import { AutosingStrategyPhase, Challenge } from "../../../../types/module-types/hs-autosing-types";
import { HSUI } from "../../../hs-core/hs-ui";
import { SPECIAL_ACTIONS, IF_JUMP_VALUE, IsJumpChallenge } from "../../../../types/module-types/hs-autosing-types";
import { HSUtils } from "../../../hs-utils/hs-utils";

type JumpTargetInfo = {
    ifIndex: number;
    ifId: string;
};

export async function openAutosingChallengesModal(
    uiMod: HSUI,
    stratData: AutosingStrategyPhase["strat"],
    startPhase: string,
    endPhase: string,
): Promise<void> {
    const modalId = "hs-autosing-challenges-modal";
    const workingChallenges: Challenge[] = [...stratData];

    const getSpecialActionLabel = (num: number): string | null => SPECIAL_ACTIONS.find(a => a.value === num)?.label ?? null;
    const isIfJumpEntry = (entry: Challenge): entry is IsJumpChallenge => { return entry.challengeNumber === IF_JUMP_VALUE && entry.ifJump !== undefined; };
    const formatMs = (ms: number) => `${ms.toLocaleString()}ms`;

    const renderIfBlock = (entry: IsJumpChallenge, index: number) => `
    <div class="hs-challenge-item hs-if-block"
        data-index="${index}"
        data-if-index="${index}"
        data-if-id="${entry.ifJump.id}">
        <div class="hs-challenge-drag-handle">⋮⋮</div>
        
        <div class="hs-if-content">
            <strong>IF</strong>
            challenge ${entry.ifJump.ifJumpChallenge}
            ${entry.ifJump.ifJumpOperator}
            ${entry.ifJump.ifJumpValue}
        </div>

        <div style="flex-grow: 1;"></div>

        <div class="hs-challenge-btn hs-challenge-btn-edit" id="hs-challenge-edit-${index}" data-index="${index}">✎</div>
        <div class="hs-challenge-btn hs-challenge-btn-delete" id="hs-challenge-delete-${index}" data-index="${index}">×</div>
    </div>
    `;

    const renderIfTarget = (ifIndex: number, ifId: string) => `
        <div class="hs-challenge-item hs-if-target"
            data-jump-for="${ifIndex}"
            data-if-id="${ifId}">
            <div class="hs-challenge-drag-handle">⋮⋮</div>
            ↳ Jump here (IF)
        </div>
    `;

    const renderNormalEntry = (entry: Challenge, index: number) => {
        const actionLabel = getSpecialActionLabel(entry.challengeNumber);

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
                    Wait outside: ${formatMs(entry.challengeWaitAfter ?? 0)} |
                    Wait inside: ${formatMs(entry.challengeWaitTime)}
                    ${!isSpecial
                ? ` | Max: ${formatMs(entry.challengeMaxTime ?? -1)}`
                : ""}
                </div>
            </div>
            <div class="hs-challenge-btn hs-challenge-btn-edit" id="hs-challenge-edit-${index}" data-index="${index}">✎</div>
            <div class="hs-challenge-btn hs-challenge-btn-delete" id="hs-challenge-delete-${index}" data-index="${index}">×</div>
        </div>
        `;
    };

    // Helper to render the list inside the modal
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


    const updateUI = () => {
        const container = document.getElementById("hs-challenge-list-container");
        if (container) {
            container.innerHTML = renderChallengeList();
            attachDragListeners();
            attachHoverListeners();
        }
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
                <div class="hs-challenges-input-label">Wait outside (ms):</div>
                <input type="number" id="hs-challenge-wait-outside-input" class="hs-challenges-input" min="0" value="0" />
            </div>
            <div class="hs-challenges-input-row">
                <div class="hs-challenges-input-label">Wait inside (ms):</div>
                <input type="number" id="hs-challenge-wait-inside-input" class="hs-challenges-input" min="0" value="0" />
            </div>
            <div class="hs-challenges-input-row">
                <div class="hs-challenges-input-label">Max Time (ms):</div>
                <input type="number" id="hs-challenge-max-time-input" class="hs-challenges-input" min="100" value="10000" />
            </div>
            <div class="hs-challenges-input-row hs-if-jump-row" style="display:none;">
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

                <div class="hs-challenges-input-row hs-if-jump-row" style="display:none;">
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
        title: `Configure Strategy Actions (${startPhase}-${endPhase})`
    };

    const modalInstance = await uiMod.Modal(modalContent);
    let editingIndex: number | null = null;
    let draggedElement: HTMLElement | null = null;
    let draggedIndex: number | null = null;
    let placeholder: HTMLElement | null = null;
    let isJumpTargetDrag = false;
    let jumpTargetIfIndex: number | null = null;

    // Throttle function for performance optimization
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

    // Attach hover listeners for highlighting jump pairs
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

    // Get visual index (position in rendered list accounting for jump targets)
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

    // Drag and drop functionality with optimizations
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

    // Logic to disable inputs based on whether a Special Action is selected
    const updateInputState = () => {
        const actionSelect = document.getElementById(
            "hs-challenge-action-select"
        ) as HTMLSelectElement;

        const isSpecial = !!actionSelect?.value;
        const isIfJump = Number(actionSelect.value) === IF_JUMP_VALUE;

        const standardInputs = [
            "hs-challenge-num-input",
            "hs-challenge-completions-input",
            "hs-challenge-max-time-input"
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
    };

    const resetInputs = () => {
        (document.getElementById("hs-challenge-num-input") as HTMLInputElement).value = "1";
        (document.getElementById("hs-challenge-completions-input") as HTMLInputElement).value = "0";
        (document.getElementById("hs-challenge-wait-inside-input") as HTMLInputElement).value = "0";
        (document.getElementById("hs-challenge-wait-outside-input") as HTMLInputElement).value = "0";
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
        attachDragListeners();
        attachHoverListeners();

        root?.addEventListener("click", (e) => {
            const el = e.target as HTMLElement;
            const id = el.id;

            // ADD / UPDATE
            if (id === "hs-challenge-add-btn") {
                const isSpecial = !!actionSelect.value;
                const isIfJump = Number(actionSelect.value) === IF_JUMP_VALUE;

                let newEntry: Challenge;

                if (isIfJump) {
                    const existingEntry = editingIndex !== null ? workingChallenges[editingIndex] : null;
                    newEntry = {
                        challengeNumber: IF_JUMP_VALUE,
                        challengeCompletions: 0,
                        challengeWaitTime: 0,
                        challengeMaxTime: 0,

                        ifJump: {
                            id: HSUtils.uuidv4(),
                            ifJumpChallenge: Number(
                                (document.getElementById("hs-if-jump-challenge") as HTMLInputElement).value
                            ),
                            ifJumpOperator: (document.getElementById("hs-if-jump-operator") as HTMLSelectElement).value as ">" | "<",
                            ifJumpValue: Number(
                                (document.getElementById("hs-if-jump-value") as HTMLInputElement).value
                            ),
                            ifJumpIndex: existingEntry?.ifJump?.ifJumpIndex ?? workingChallenges.length + 1

                        }
                    } as Challenge & any;
                } else {
                    newEntry = {
                        challengeNumber: isSpecial
                            ? Number(actionSelect.value)
                            : Number((document.getElementById("hs-challenge-num-input") as HTMLInputElement).value),
                        challengeCompletions: isSpecial ? 0 : Number((document.getElementById("hs-challenge-completions-input") as HTMLInputElement).value),
                        challengeWaitTime: Number((document.getElementById("hs-challenge-wait-inside-input") as HTMLInputElement).value),
                        challengeWaitAfter: Number((document.getElementById("hs-challenge-wait-outside-input") as HTMLInputElement).value),
                        challengeMaxTime: isSpecial ? 0 : Number((document.getElementById("hs-challenge-max-time-input") as HTMLInputElement).value)
                    };
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
                const actionLabel = getSpecialActionLabel(item.challengeNumber);

                if (isIfJumpEntry(item)) {
                    actionSelect.value = String(IF_JUMP_VALUE);

                    (document.getElementById("hs-if-jump-challenge") as HTMLInputElement).value =
                        String(item.ifJump?.ifJumpChallenge);

                    (document.getElementById("hs-if-jump-operator") as HTMLSelectElement).value =
                        item.ifJump?.ifJumpOperator ?? '>';

                    (document.getElementById("hs-if-jump-value") as HTMLInputElement).value =
                        String(item.ifJump?.ifJumpValue);

                    (document.getElementById("hs-challenge-wait-inside-input") as HTMLInputElement).value = String(item.challengeWaitTime);
                    (document.getElementById("hs-challenge-wait-outside-input") as HTMLInputElement).value = String(item.challengeWaitAfter ?? 0);

                    (document.getElementById("hs-challenge-add-btn") as HTMLElement).textContent = "Update Action";
                    updateInputState();
                    return;
                }

                if (actionLabel) {
                    actionSelect.value = String(item.challengeNumber);
                } else {
                    actionSelect.value = "";
                    (document.getElementById("hs-challenge-num-input") as HTMLInputElement).value = String(item.challengeNumber);
                    (document.getElementById("hs-challenge-completions-input") as HTMLInputElement).value = String(item.challengeCompletions);
                    (document.getElementById("hs-challenge-max-time-input") as HTMLInputElement).value = String(item.challengeMaxTime);
                }

                (document.getElementById("hs-challenge-wait-inside-input") as HTMLInputElement).value = String(item.challengeWaitTime);
                (document.getElementById("hs-challenge-wait-outside-input") as HTMLInputElement).value = String(item.challengeWaitAfter ?? 0);
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