import { AutosingStrategyPhase, Challenge, isCorruptionLevelStep, SPECIAL_ACTIONS, IF_JUMP_VALUE, IsJumpChallenge, ModalInput, IfJumpParams } from "../../../../types/module-types/hs-autosing-types";
import { HSUI } from "../../../hs-core/hs-ui";
import { HSUtils } from "../../../hs-utils/hs-utils";
import { HSAutosingEditorWindows } from "./hs-autosing-editor-windows";
import { escapeHtml } from "../../hs-heater/hs-heater-utils";

type IfJumpMode = NonNullable<IfJumpParams["ifJumpMode"]>;

// What the selected action is, for the fields to show
interface FieldContext {
    inputs: ReadonlySet<ModalInput>;
    isIfJump: boolean;
    ifJumpMode: IfJumpMode;
}

type FieldKey = 'action' | 'challengeNum' | 'completions' | 'corruptionLevel' | 'waitBefore' | 'waitInside' | 'maxTime'
    | 'comment' | 'ifJumpMode' | 'ifJumpChallenge' | 'ifJumpMultiplier' | 'ifJumpOperator' | 'ifJumpValue';

interface FieldRowBase {
    label: string;
    // Spans both columns
    wide?: boolean;
    // Always shown when absent
    shown?: (context: FieldContext) => boolean;
}

interface InputRow extends FieldRowBase {
    key: FieldKey;
    // The <option>s of a select; an input otherwise
    options?: string;
    type?: 'number' | 'text';
    attributes?: string;
    initial: string;
    // The step's value for this field (undefined: the initial value)
    load?: (step: Challenge) => string | number | undefined;
}

interface NoteRow extends FieldRowBase {
    note: string;
}

type FieldRow = InputRow | NoteRow;

// The inputs a standard challenge step uses (a special action lists its own)
const STANDARD_CHALLENGE_INPUTS: ReadonlySet<ModalInput> = new Set<ModalInput>(["challengeNum", "completions", "waitTime", "maxTime"]);
const SPECIAL_ACTION_BY_ID = new Map<number, (typeof SPECIAL_ACTIONS)[number]>(SPECIAL_ACTIONS.map(a => [a.value, a] as const));

const isIfJumpStep = (step: Challenge): step is IsJumpChallenge => step.challengeNumber === IF_JUMP_VALUE && step.ifJump !== undefined;
const isSpecialStep = (step: Challenge) => SPECIAL_ACTION_BY_ID.has(step.challengeNumber);
// A step's own value, for the fields of a standard challenge or special action (not an IF jump)
const fromAction = (read: (step: Challenge) => string | number | undefined) =>
    (step: Challenge) => isIfJumpStep(step) ? undefined : read(step);
const fromIfJump = (read: (jump: IfJumpParams) => string | number | undefined) =>
    (step: Challenge) => isIfJumpStep(step) ? read(step.ifJump) : undefined;
const inIfJumpMode = (mode: IfJumpMode) => (c: FieldContext) => c.isIfJump && c.ifJumpMode === mode;

// The fields above the list, in their order on the page (two columns)
const FIELD_ROWS: readonly FieldRow[] = [
    {
        key: 'action', label: "Special Action:", wide: true, initial: "",
        options: `<option value="">None (Standard Challenge)</option>`
            + SPECIAL_ACTIONS.map(a => `<option value="${a.value}">${a.value} - ${a.label}</option>`).join(""),
        load: step => isIfJumpStep(step) || isSpecialStep(step) ? step.challengeNumber : "",
    },
    {
        key: 'challengeNum', label: "Challenge #:", attributes: `min="1" max="15"`, initial: "1",
        shown: c => c.inputs.has("challengeNum"),
        load: step => isIfJumpStep(step) || isSpecialStep(step) ? undefined : step.challengeNumber,
    },
    {
        key: 'completions', label: "Min Completions:", attributes: `min="1"`, initial: "1",
        shown: c => c.inputs.has("completions"), load: fromAction(step => step.challengeCompletions),
    },
    {
        key: 'corruptionLevel', label: "Corruption Level:", attributes: `min="0" step="1"`, initial: "0",
        shown: c => c.inputs.has("corruptionLevel"), load: fromAction(step => step.corruptionLevel),
    },
    {
        key: 'waitBefore', label: "Wait before (ms):", attributes: `min="0"`, initial: "0",
        load: step => step.challengeWaitBefore,
    },
    {
        key: 'waitInside', label: "Wait inside (ms):", attributes: `min="0"`, initial: "0",
        shown: c => c.inputs.has("waitTime"), load: fromAction(step => step.challengeWaitTime),
    },
    {
        key: 'maxTime', label: "Max Time (ms):", attributes: `min="0"`, initial: "10000",
        shown: c => c.inputs.has("maxTime"), load: fromAction(step => step.challengeMaxTime),
    },
    {
        key: 'comment', label: "Comment:", type: 'text', attributes: `maxlength="200" placeholder="Add a comment (optional)"`, initial: "",
        load: step => step.comment,
    },
    {
        key: 'ifJumpMode', label: "If Jump Mode:", initial: "challenges",
        options: `<option value="challenges">Challenges</option><option value="stored_c15">Stored C15 value</option>`,
        shown: c => c.isIfJump, load: fromIfJump(jump => jump.ifJumpMode),
    },
    {
        key: 'ifJumpChallenge', label: "If Challenge:", attributes: `min="1" max="15"`, initial: "1",
        shown: inIfJumpMode("challenges"), load: fromIfJump(jump => jump.ifJumpChallenge),
    },
    {
        key: 'ifJumpMultiplier', label: "Multiplier (10^x):", initial: "0",
        shown: inIfJumpMode("stored_c15"), load: fromIfJump(jump => jump.ifJumpMultiplier),
    },
    {
        key: 'ifJumpOperator', label: "Condition:", initial: ">",
        options: `<option value=">">&gt;</option><option value="<">&lt;</option>`,
        shown: c => c.isIfJump, load: fromIfJump(jump => jump.ifJumpOperator),
    },
    {
        key: 'ifJumpValue', label: "Value:", initial: "1",
        shown: inIfJumpMode("challenges"), load: fromIfJump(jump => jump.ifJumpValue),
    },
    {
        label: "", note: "Compares to the current C15",
        shown: inIfJumpMode("stored_c15"),
    },
];

const INPUT_ROWS = FIELD_ROWS.filter((row): row is InputRow => 'key' in row);

// What is being dragged: a step, an IF jump's "Jump here" row, or the "Add Here" separator
type DragTarget = { kind: 'step'; index: number } | { kind: 'jumpTarget'; ifId: string } | { kind: 'separator' };

interface DragState {
    target: DragTarget;
    // The dragged element (replaced at each re-render of the list) and its copy left in the list
    element: HTMLElement;
    placeholder: HTMLElement;
    // Where the element was grabbed, and its size
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
    // A step changed places (the step being edited may have moved)
    stepMoved: boolean;
}

/**
 * Class: HSAutosingChallengeModal
 * IsExplicitHSModule: No
 * Description:
 *     The "Configure Strategy Actions" window of the strategy editor: a phase's steps (challenges, special actions,
 *     IF jumps), edited on a copy of the phase's list that Save writes back.
 *     - The fields above the list are described by FIELD_ROWS: which action shows them, and which value of a step
 *       they hold. ✎ loads every value of a step, so an Update keeps the values its action doesn't show.
 *     - Steps, IF jump targets ("Jump here" rows) and the "Add Here" separator (where new steps go) are dragged
 *       with the mouse. The list is drawn again whenever the drop place changes, and the dragged row found again.
 *     - An IF jump's target is a step index (the step it jumps before): adding or deleting a step shifts the
 *       targets after it, moving a step doesn't.
 * Author: XxMolkxX, Shewchou
 */
class HSAutosingChallengeModal {
    #uiMod: HSUI;
    #stratData: Challenge[];
    #modalId = "";
    // A deep copy: the IF jump targets are changed in place, which Cancel must undo too
    #steps: Challenge[];
    // Where new steps are added (the separator's index)
    #separatorIndex: number;
    // The step loaded in the fields by ✎ (null: the button adds a new step)
    #editingIndex: number | null = null;
    #fields = new Map<FieldKey, HTMLInputElement | HTMLSelectElement>();
    #rows: { row: FieldRow; element: HTMLElement }[] = [];
    #list!: HTMLElement;
    #addButton!: HTMLElement;
    // Shown in edit mode, next to "Update step N"
    #cancelEditButton!: HTMLElement;
    #drag: DragState | null = null;

    constructor(uiMod: HSUI, stratData: Challenge[]) {
        this.#uiMod = uiMod;
        this.#stratData = stratData;
        this.#steps = structuredClone(stratData);
        this.#separatorIndex = this.#steps.length;
    }

    async open(title: string, parentModalId?: string): Promise<void> {
        this.#modalId = await this.#uiMod.Modal({ htmlContent: this.#renderWindow(), title, parentModalId });
        HSAutosingEditorWindows.opened('challenges', this.#modalId);

        const root = document.getElementById(this.#modalId);
        if (!root) return;
        this.#list = root.querySelector<HTMLElement>(".hs-challenge-list")!;
        this.#addButton = root.querySelector<HTMLElement>('[data-action="add"]')!;
        this.#cancelEditButton = root.querySelector<HTMLElement>('[data-action="cancel-edit"]')!;
        for (const element of root.querySelectorAll<HTMLElement>("[data-row]")) {
            this.#rows.push({ row: FIELD_ROWS[Number(element.dataset.row)], element });
        }
        for (const field of root.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-field]")) {
            this.#fields.set(field.dataset.field as FieldKey, field);
        }

        this.#field('action').addEventListener("change", () => this.#showFields());
        this.#field('ifJumpMode').addEventListener("change", () => this.#showFields());
        root.addEventListener("click", e => this.#onClick(e));
        this.#list.addEventListener("mousedown", e => this.#onListMouseDown(e));
        // An IF jump and its target are highlighted together
        this.#list.addEventListener("mouseover", e => this.#highlightJump((e.target as HTMLElement).closest<HTMLElement>("[data-if-id]")?.dataset.ifId));
        this.#list.addEventListener("mouseleave", () => this.#highlightJump(undefined));

        this.#fillFields(null);
    }

    // ----- Window and list HTML -----

    #renderWindow(): string {
        const rows = FIELD_ROWS.map((row, i) => {
            const classes = `hs-challenges-input-row${row.wide ? " hs-challenges-input-row-wide" : ""}`;
            const content = 'note' in row
                ? `<div class="hs-challenges-input-note">${row.note}</div>`
                : this.#renderControl(row);
            return `<div class="${classes}" data-row="${i}"><div class="hs-challenges-input-label">${row.label}</div>${content}</div>`;
        }).join("");

        return `
        <div class="hs-challenges-modal-container">
            <div class="hs-challenges-input-section">${rows}</div>
            <div class="hs-challenges-add-row">
                <div class="hs-challenges-add-btn" data-action="add">Add Action/Challenge</div>
                <div class="hs-challenges-edit-cancel-btn" data-action="cancel-edit" hidden>Cancel</div>
            </div>
            <div class="hs-challenges-list-container hs-scrollbar-themed">
                <div class="hs-challenge-list">${this.#renderList()}</div>
            </div>
            <div class="hs-challenges-footer">
                <div class="hs-challenges-footer-btn hs-challenges-cancel-btn" data-action="cancel">Cancel</div>
                <div class="hs-challenges-footer-btn hs-challenges-save-btn" data-action="save">Save Strategy</div>
            </div>
        </div>`;
    }

    #renderControl(row: InputRow): string {
        const common = `class="hs-challenges-input" data-field="${row.key}"`;
        return row.options !== undefined
            ? `<select ${common}>${row.options}</select>`
            : `<input type="${row.type ?? "number"}" ${common} ${row.attributes ?? ""} />`;
    }

    // The steps, with each IF jump's target before the step it jumps to and the separator where new steps go
    #renderList(): string {
        // The IF jumps (and their indices) by the index of the step they jump to
        const targetsByIndex = new Map<number, { step: IsJumpChallenge; ifIndex: number }[]>();
        this.#steps.forEach((step, ifIndex) => {
            if (!isIfJumpStep(step)) return;
            const index = step.ifJump.ifJumpIndex;
            targetsByIndex.set(index, [...(targetsByIndex.get(index) ?? []), { step, ifIndex }]);
        });

        const html: string[] = [];
        const addTargets = (index: number) => {
            for (const { step, ifIndex } of targetsByIndex.get(index) ?? []) html.push(this.#renderJumpTarget(step, ifIndex));
        };
        if (this.#separatorIndex <= 0) html.push(this.#renderSeparator());
        this.#steps.forEach((step, index) => {
            addTargets(index);
            html.push(this.#renderStep(step, index));
            if (this.#separatorIndex === index + 1) html.push(this.#renderSeparator());
        });
        addTargets(this.#steps.length);
        return html.join("");
    }

    #redrawList(): void {
        this.#list.innerHTML = this.#renderList();
    }

    #renderStep(step: Challenge, index: number): string {
        const isIfJump = isIfJumpStep(step);
        const classes = `hs-challenge-item${isIfJump ? " hs-if-block" : ""}${index === this.#editingIndex ? " hs-challenge-item-editing" : ""}`;
        const ifId = isIfJump ? ` data-if-id="${step.ifJump.id}"` : "";
        return `
        <div class="${classes}" data-index="${index}"${ifId}>
            <div class="hs-challenge-step-no">${index + 1}</div>
            <div class="hs-challenge-drag-handle">⋮⋮</div>
            <div class="${isIfJump ? "hs-if-content" : "hs-challenge-item-text"}">
                ${this.#renderStepText(step)}
                <div class="hs-challenge-meta">${this.#renderStepMeta(step)}</div>
                ${step.comment ? `<div class="hs-challenge-comment">🗨️ ${escapeHtml(step.comment)}</div>` : ""}
            </div>
            <div class="hs-challenge-btn hs-challenge-btn-edit" data-action="edit">✎</div>
            <div class="hs-challenge-btn hs-challenge-btn-delete" data-action="delete">×</div>
        </div>`;
    }

    #renderStepText(step: Challenge): string {
        const actionId = (id: number) => `<span class="hs-challenge-action-id">(${id})</span>`;
        if (isIfJumpStep(step)) {
            const jump = step.ifJump;
            const condition = (jump.ifJumpMode ?? "challenges") === "challenges"
                ? `challenge ${jump.ifJumpChallenge} ${jump.ifJumpOperator} ${jump.ifJumpValue}`
                : `Stored C15${jump.ifJumpMultiplier ? ` × 10^${jump.ifJumpMultiplier}` : ""} ${jump.ifJumpOperator} Current C15`;
            return `<strong>IF</strong> ${escapeHtml(condition)} ${actionId(IF_JUMP_VALUE)}`;
        }
        const action = SPECIAL_ACTION_BY_ID.get(step.challengeNumber);
        if (!action) return `Challenge ${step.challengeNumber} (${step.challengeCompletions} completions)`;
        const label = isCorruptionLevelStep(step.challengeNumber) ? `${action.label}: ${step.corruptionLevel ?? 0}` : action.label;
        return `<strong>${label}</strong> ${actionId(step.challengeNumber)}`;
    }

    #renderStepMeta(step: Challenge): string {
        const ms = (value: number) => `${value.toLocaleString()}ms`;
        const inputs = this.#inputsOf(isIfJumpStep(step) ? String(IF_JUMP_VALUE) : isSpecialStep(step) ? String(step.challengeNumber) : "");
        const parts = [`Wait before: ${ms(step.challengeWaitBefore ?? 0)}`];
        if (inputs.has("waitTime")) parts.push(`Wait inside: ${ms(step.challengeWaitTime)}`);
        if (inputs.has("maxTime")) parts.push(`Max: ${ms(step.challengeMaxTime ?? -1)}`);
        return parts.join(" | ");
    }

    // ifIndex: the IF jump's index, shown as its step number
    #renderJumpTarget(step: IsJumpChallenge, ifIndex: number): string {
        return `
        <div class="hs-challenge-item hs-if-target" data-if-id="${step.ifJump.id}">
            <div class="hs-challenge-step-no"></div>
            <div class="hs-challenge-drag-handle">⋮⋮</div>
            ↳ Jump here (IF step ${ifIndex + 1})
        </div>`;
    }

    #renderSeparator(): string {
        return `
        <div class="hs-challenge-separator">
            <div class="hs-challenge-separator-line"></div>
            <span class="hs-challenge-separator-label">⋮⋮ Add Here ⋮⋮</span>
            <div class="hs-challenge-separator-line"></div>
        </div>`;
    }

    #highlightJump(ifId: string | undefined): void {
        for (const element of this.#list.querySelectorAll(".hs-jump-highlight")) element.classList.remove("hs-jump-highlight");
        if (ifId === undefined) return;
        for (const element of this.#list.querySelectorAll(`[data-if-id="${ifId}"]`)) element.classList.add("hs-jump-highlight");
    }

    // ----- Fields -----

    #field(key: FieldKey): HTMLInputElement | HTMLSelectElement {
        return this.#fields.get(key)!;
    }

    #number(key: FieldKey): number {
        return Number(this.#field(key).value);
    }

    // The inputs an action uses ("": a standard challenge)
    #inputsOf(action: string): ReadonlySet<ModalInput> {
        if (action === "") return STANDARD_CHALLENGE_INPUTS;
        return new Set<ModalInput>(SPECIAL_ACTION_BY_ID.get(Number(action))?.inputs ?? []);
    }

    #showFields(): void {
        const action = this.#field('action').value;
        const context: FieldContext = {
            inputs: this.#inputsOf(action),
            isIfJump: action === String(IF_JUMP_VALUE),
            ifJumpMode: this.#field('ifJumpMode').value as IfJumpMode,
        };
        for (const { row, element } of this.#rows) {
            element.hidden = row.shown !== undefined && !row.shown(context);
        }
    }

    // Puts a step's values in the fields (null: the initial values). keepComment: a comment being typed for the next step
    #fillFields(step: Challenge | null, keepComment = false): void {
        for (const row of INPUT_ROWS) {
            if (row.key === 'comment' && keepComment) continue;
            const value = step ? row.load?.(step) : undefined;
            this.#field(row.key).value = value === undefined ? row.initial : String(value);
        }
        this.#showFields();
    }

    // The step the fields describe. previous: the step being updated
    #buildStep(previous: Challenge | null): Challenge {
        const action = this.#field('action').value;
        let step: Challenge;
        if (action === String(IF_JUMP_VALUE)) {
            const mode = this.#field('ifJumpMode').value as IfJumpMode;
            const isChallengesMode = mode === "challenges";
            // A new IF jumps to the step after it
            const newTarget = (this.#editingIndex ?? this.#separatorIndex) + 1;
            step = {
                challengeNumber: IF_JUMP_VALUE,
                challengeCompletions: 0,
                challengeWaitTime: 0,
                challengeMaxTime: 0,
                challengeWaitBefore: this.#number('waitBefore'),
                ifJump: {
                    id: previous?.ifJump?.id ?? HSUtils.uuidv4(),
                    ifJumpMode: mode,
                    // Stored C15 mode compares C15; the value and multiplier are each one mode's only
                    ifJumpChallenge: isChallengesMode ? this.#number('ifJumpChallenge') : 15,
                    ifJumpOperator: this.#field('ifJumpOperator').value as IfJumpParams["ifJumpOperator"],
                    ifJumpValue: isChallengesMode ? this.#number('ifJumpValue') : 0,
                    ifJumpMultiplier: isChallengesMode ? 0 : this.#number('ifJumpMultiplier'),
                    ifJumpIndex: previous?.ifJump?.ifJumpIndex ?? newTarget,
                },
            };
        } else {
            step = {
                challengeNumber: action === "" ? this.#number('challengeNum') : Number(action),
                challengeCompletions: this.#number('completions'),
                challengeWaitTime: this.#number('waitInside'),
                challengeWaitBefore: this.#number('waitBefore'),
                challengeMaxTime: this.#number('maxTime'),
            };
            if (isCorruptionLevelStep(step.challengeNumber)) {
                // The game lowers a level above what the player can reach: no upper bound here
                step.corruptionLevel = Math.max(0, Math.floor(this.#number('corruptionLevel') || 0));
            }
        }
        const comment = this.#field('comment').value.trim();
        if (comment) step.comment = comment;
        return step;
    }

    // Loads a step in the fields for an Update (null: leaves edit mode; the fields go back to their initial values)
    #setEditing(index: number | null): void {
        this.#editingIndex = index;
        this.#fillFields(index === null ? null : this.#steps[index]);
        this.#addButton.textContent = index === null ? "Add Action/Challenge" : `Update step ${index + 1}`;
        this.#cancelEditButton.hidden = index === null;
        this.#redrawList();
    }

    // ----- Steps -----

    // A step was added (delta 1) or removed (delta -1) at index: the IF jump targets after it follow their step.
    // A target at the index itself sat before the step now there: it moves down when one is added before it,
    // and stays when the step after it is removed.
    #shiftJumpTargets(index: number, delta: 1 | -1): void {
        for (const step of this.#steps) {
            if (!isIfJumpStep(step)) continue;
            const target = step.ifJump.ifJumpIndex;
            if (target > index || (delta > 0 && target === index)) step.ifJump.ifJumpIndex += delta;
        }
    }

    #addOrUpdate(): void {
        if (this.#editingIndex !== null) {
            this.#steps[this.#editingIndex] = this.#buildStep(this.#steps[this.#editingIndex]);
            this.#setEditing(null);
            return;
        }
        const step = this.#buildStep(null);
        this.#shiftJumpTargets(this.#separatorIndex, 1);
        this.#steps.splice(this.#separatorIndex, 0, step);
        this.#separatorIndex++;
        this.#fillFields(null, true);
        this.#redrawList();
    }

    #delete(index: number): void {
        this.#steps.splice(index, 1);
        this.#shiftJumpTargets(index, -1);
        if (index < this.#separatorIndex) this.#separatorIndex--;
        // The edited step's index may have changed
        if (this.#editingIndex !== null) this.#setEditing(null);
        else this.#redrawList();
    }

    #onClick(e: MouseEvent): void {
        const target = e.target as HTMLElement;
        const action = target.closest<HTMLElement>("[data-action]")?.dataset.action;
        const index = Number(target.closest<HTMLElement>(".hs-challenge-item")?.dataset.index);
        switch (action) {
            case "add":
                this.#addOrUpdate();
                break;
            case "edit":
                // ✎ on the step being edited leaves edit mode
                this.#setEditing(index === this.#editingIndex ? null : index);
                break;
            case "cancel-edit":
                this.#setEditing(null);
                break;
            case "delete":
                this.#delete(index);
                break;
            case "save":
                this.#stratData.length = 0;
                this.#stratData.push(...this.#steps);
                void this.#uiMod.CloseModal(this.#modalId);
                break;
            case "cancel":
                void this.#uiMod.CloseModal(this.#modalId);
                break;
        }
    }

    // ----- Drag and drop -----

    #onListMouseDown(e: MouseEvent): void {
        if (e.button !== 0) return;
        const clicked = e.target as HTMLElement;
        const separator = clicked.closest<HTMLElement>(".hs-challenge-separator");
        const row = clicked.closest(".hs-challenge-drag-handle")?.closest<HTMLElement>(".hs-challenge-item");
        const element = separator ?? row;
        if (!element) return;

        let target: DragTarget;
        if (separator) target = { kind: 'separator' };
        else if (row!.classList.contains("hs-if-target")) target = { kind: 'jumpTarget', ifId: row!.dataset.ifId! };
        else target = { kind: 'step', index: Number(row!.dataset.index) };

        e.preventDefault();
        const rect = element.getBoundingClientRect();
        this.#drag = {
            target, element, placeholder: element,
            offsetX: e.clientX - rect.left,
            offsetY: e.clientY - rect.top,
            width: rect.width,
            height: rect.height,
            stepMoved: false,
        };
        this.#lift(element, e);
        document.addEventListener("mousemove", this.#onDragMove);
        document.addEventListener("mouseup", this.#onDragEnd);
    }

    // Takes the element out of the list, under the mouse, and leaves a faded copy in its place
    #lift(element: HTMLElement, e: MouseEvent): void {
        const drag = this.#drag!;
        const placeholder = element.cloneNode(true) as HTMLElement;
        placeholder.classList.add("hs-challenge-placeholder");
        element.before(placeholder);
        element.classList.add("hs-challenge-lifted");
        element.style.width = `${drag.width}px`;
        element.style.height = `${drag.height}px`;
        drag.element = element;
        drag.placeholder = placeholder;
        this.#moveLifted(e);
    }

    #moveLifted(e: MouseEvent): void {
        const drag = this.#drag!;
        drag.element.style.left = `${e.clientX - drag.offsetX}px`;
        drag.element.style.top = `${e.clientY - drag.offsetY}px`;
    }

    // The number of steps in the list above the mouse (the dragged step left out)
    #stepsAbove(clientY: number): number {
        const rows = this.#list.querySelectorAll<HTMLElement>(".hs-challenge-item[data-index]:not(.hs-challenge-lifted):not(.hs-challenge-placeholder)");
        let count = 0;
        for (const row of rows) {
            const rect = row.getBoundingClientRect();
            if (clientY < rect.top + rect.height / 2) break;
            count++;
        }
        return count;
    }

    // Moves the dragged item to the place under the mouse; false when it is already there
    #dropAt(place: number): boolean {
        const target = this.#drag!.target;
        switch (target.kind) {
            case 'step': {
                if (place === target.index) return false;
                const [step] = this.#steps.splice(target.index, 1);
                this.#steps.splice(place, 0, step);
                target.index = place;
                this.#drag!.stepMoved = true;
                return true;
            }
            case 'jumpTarget': {
                const ifStep = this.#steps.find(step => isIfJumpStep(step) && step.ifJump.id === target.ifId) as IsJumpChallenge | undefined;
                if (!ifStep || ifStep.ifJump.ifJumpIndex === place) return false;
                ifStep.ifJump.ifJumpIndex = place;
                return true;
            }
            case 'separator':
                if (place === this.#separatorIndex) return false;
                this.#separatorIndex = place;
                return true;
        }
    }

    #findDragged(target: DragTarget): HTMLElement | null {
        switch (target.kind) {
            case 'step': return this.#list.querySelector<HTMLElement>(`.hs-challenge-item[data-index="${target.index}"]`);
            case 'jumpTarget': return this.#list.querySelector<HTMLElement>(`.hs-if-target[data-if-id="${target.ifId}"]`);
            case 'separator': return this.#list.querySelector<HTMLElement>(".hs-challenge-separator");
        }
    }

    #onDragMove = (e: MouseEvent): void => {
        const drag = this.#drag;
        if (!drag) return;
        if (this.#dropAt(this.#stepsAbove(e.clientY))) {
            this.#redrawList();
            const element = this.#findDragged(drag.target);
            if (element) this.#lift(element, e);
        }
        this.#moveLifted(e);
    };

    #onDragEnd = (): void => {
        const drag = this.#drag;
        document.removeEventListener("mousemove", this.#onDragMove);
        document.removeEventListener("mouseup", this.#onDragEnd);
        this.#drag = null;
        // The edited step's index may have changed
        if (drag?.stepMoved && this.#editingIndex !== null) this.#setEditing(null);
        else this.#redrawList();
    };
}

export async function openAutosingChallengesModal(
    uiMod: HSUI,
    stratData: AutosingStrategyPhase["strat"],
    startPhase: string,
    endPhase: string,
    parentModalId?: string,
    displayName?: string
): Promise<void> {
    if (!HSAutosingEditorWindows.claim(uiMod, 'challenges', parentModalId)) return;
    const title = displayName ? `Configure ${displayName}` : `Configure Strategy Actions (${startPhase}-${endPhase})`;
    await new HSAutosingChallengeModal(uiMod, stratData).open(title, parentModalId);
}
