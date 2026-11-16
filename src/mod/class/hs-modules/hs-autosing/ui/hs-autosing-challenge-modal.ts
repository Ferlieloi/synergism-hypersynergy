import { AutosingStrategyPhase, Challenge, isCorruptionLevelStep, SET_CORRUPTION_LEVEL_VALUE, CLEANSE_CORRUPTION_VALUE, SPECIAL_ACTIONS, SPECIAL_ACTION_BY_ID, type SpecialAction, IF_JUMP_VALUE, FLIP_TOGGLE_VALUES, isSetAutoToggleStep, IsJumpChallenge, ModalInput, IfJumpParams } from "../hs-autosing-types";
import { HSTooltip } from "../../../hs-core/hs-tooltip";
import { HSUI } from "../../../hs-core/hs-ui";
import { HSUtils } from "../../../hs-utils/hs-utils";
import { HSUIXY } from "../../../../types/module-types/hs-ui-types";
import { escapeHtml } from "../../../hs-utils/hs-escape";
import { isIfJumpStep, moveStep, stepListRows, stepSlot, type PairedJump } from "./hs-autosing-step-rows";

type IfJumpMode = NonNullable<IfJumpParams["ifJumpMode"]>;

// What the selected action is, for the fields to show
interface FieldContext {
    // The Special Action dropdown's value ("": a standard challenge)
    action: string;
    inputs: ReadonlySet<ModalInput>;
    isIfJump: boolean;
    ifJumpMode: IfJumpMode;
}

type FieldKey = 'action' | 'challengeNum' | 'forgeItem' | 'completions' | 'corruptionLevel' | 'ascendAfterCorruption' | 'cleanseToHighest' | 'toggleOn' | 'waitBefore' | 'waitInside' | 'maxTime'
    | 'comment' | 'ifJumpMode' | 'ifJumpChallenge' | 'ifJumpMultiplier' | 'ifJumpOperator' | 'ifJumpValue' | 'ifJumpMaxJumps';

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
    type?: 'number' | 'text' | 'checkbox';
    attributes?: string;
    initial: string;
    // The step's value for this field (undefined: the initial value)
    load?: (step: Challenge) => string | number | boolean | undefined;
    // A number input's other rule, checked while the field is shown (any number when absent)
    check?: (context: FieldContext) => NumberCheck;
}

interface NumberCheck {
    isValid: (value: number) => boolean;
    // Shown after the field's label on the Add/Update button
    message: string;
}

interface NoteRow extends FieldRowBase {
    note: string;
}

type FieldRow = InputRow | NoteRow;

// The inputs a standard challenge step uses (a special action lists its own)
const STANDARD_CHALLENGE_INPUTS: ReadonlySet<ModalInput> = new Set<ModalInput>(["challengeNum", "completions", "waitTime", "maxTime"]);

const isSpecialStep = (step: Challenge) => SPECIAL_ACTION_BY_ID.has(step.challengeNumber);
// A step's own value, for the fields of a standard challenge or special action (not an IF jump)
const fromAction = (read: (step: Challenge) => string | number | boolean | undefined) =>
    (step: Challenge) => isIfJumpStep(step) ? undefined : read(step);
const fromIfJump = (read: (jump: IfJumpParams) => string | number | undefined) =>
    (step: Challenge) => isIfJumpStep(step) ? read(step.ifJump) : undefined;
const inIfJumpMode = (mode: IfJumpMode) => (c: FieldContext) => c.isIfJump && c.ifJumpMode === mode;

// Actions picked as one dropdown entry plus a field. A step still holds its action's own id: nothing changes for
// autosing, the logs or the step list
interface ActionFamily {
    // The dropdown's value (not a number: never an action id)
    value: string;
    label: string;
    first: number;
    last: number;
}

// "C1-C10 until no more completions" (601-610): Wait inside, then until no completion within Max Time; Challenge # picks C1-C10
const C1_TO_C10_FAMILY: ActionFamily = { value: "c1to10", label: "601-610 - C1-C10 until no more completions", first: 601, last: 610 };
// "Forge Auto-Buy Toggle - X" (701-709): the Forge item field picks X
const FORGE_FAMILY: ActionFamily = { value: "forge", label: "701-709 - Forge Auto-Buy Toggle", first: 701, last: 709 };
const ACTION_FAMILIES: readonly ActionFamily[] = [C1_TO_C10_FAMILY, FORGE_FAMILY];
const inFamily = (family: ActionFamily, id: number) => id >= family.first && id <= family.last;
const familyOf = (id: number) => ACTION_FAMILIES.find(family => inFamily(family, id));

// A standard challenge's or a 601-610 step's Wait inside is a fixed wait (the other actions don't use it)
const hasFixedWaitInside = (step: Challenge) => step.challengeNumber < 100 || inFamily(C1_TO_C10_FAMILY, step.challengeNumber);

const fixedCheck = (check: NumberCheck) => () => check;
const CHALLENGE_NUMBER: NumberCheck = { isValid: v => Number.isInteger(v) && v >= 1 && v <= 15, message: "1 to 15" };
const C1_TO_C10_NUMBER: NumberCheck = { isValid: v => Number.isInteger(v) && v >= 1 && v <= 10, message: "1 to 10" };
const NOT_NEGATIVE: NumberCheck = { isValid: v => v >= 0, message: "0 or more" };
const WHOLE_NOT_NEGATIVE: NumberCheck = { isValid: v => Number.isInteger(v) && v >= 0, message: "a whole number, 0 or more" };

// The Special Action dropdown's groups, by action id ranges (an action in none of them goes in "Other", at the end).
// labelClass: the colour of the group's step labels in the list (none: white)
const ACTION_GROUPS: readonly { label: string; ranges: readonly [number, number][]; labelClass?: string }[] = [
    { label: "Exit and Ascend", ranges: [[101, 104]] },
    { label: "Game actions", ranges: [[151, 158], [FORGE_FAMILY.first, FORGE_FAMILY.last]] },
    { label: "Condition", ranges: [[IF_JUMP_VALUE, IF_JUMP_VALUE]] },
    { label: "Challenges", ranges: [[211, 215], [C1_TO_C10_FAMILY.first, C1_TO_C10_FAMILY.last]] },
    { label: "Ambrosia loadouts", ranges: [[301, 306]], labelClass: "hs-step-ambrosia" },
    { label: "Corruption level", ranges: [[SET_CORRUPTION_LEVEL_VALUE, CLEANSE_CORRUPTION_VALUE]], labelClass: "hs-step-corruption" },
    { label: "AOAG and Autosing", ranges: [[901, 903]], labelClass: "hs-step-autosing" },
];

const inRanges = (ranges: readonly [number, number][]) => (a: SpecialAction) => ranges.some(([first, last]) => a.value >= first && a.value <= last);

// A challenge's tier colour (the game's): C1-5 Transcension, C6-10 Reincarnation, C11-15 Ascension
const challengeTierClass = (challenge: number) =>
    challenge <= 5 ? "hs-step-transcension" : challenge <= 10 ? "hs-step-reincarnation" : "hs-step-ascension";

// Exit Transcension, Reincarnation and Ascension challenge, Ascend: a challenge of their tier
const TIER_CHALLENGE_OF_EXIT = new Map<number, number>([[101, 1], [102, 6], [103, 11], [104, 11]]);

// The colour class of a step's label: its challenge tier's (standard challenges, exits and Ascend, Max C11-14, Store C15,
// C1-C10 until no more completions), else its action group's
function stepLabelClass(step: Challenge): string {
    const id = step.challengeNumber;
    if (id < 100) return challengeTierClass(id);
    const exitTier = TIER_CHALLENGE_OF_EXIT.get(id);
    if (exitTier !== undefined) return challengeTierClass(exitTier);
    if (id >= 211 && id <= 215) return challengeTierClass(id - 200);
    if (inFamily(C1_TO_C10_FAMILY, id)) return challengeTierClass(id - 600);
    const action = SPECIAL_ACTION_BY_ID.get(id);
    return (action && ACTION_GROUPS.find(g => inRanges(g.ranges)(action))?.labelClass) ?? "";
}

// Only flip their game toggle: hidden in the dropdown, still shown when an older strategy's step is loaded
const isFlipToggle = (id: number) => (FLIP_TOGGLE_VALUES as readonly number[]).includes(id);

// A family's actions show as its one entry, at its first action's place
function renderActionOptions(): string {
    const group = (label: string, actions: readonly SpecialAction[]) => {
        const options = new Set(actions.map(a => {
            const family = familyOf(a.value);
            return family ? `<option value="${family.value}">${family.label}</option>`
                : `<option value="${a.value}"${isFlipToggle(a.value) ? " hidden" : ""}>${a.value} - ${a.label}</option>`;
        }));
        return options.size === 0 ? "" : `<optgroup label="${label}">${[...options].join("")}</optgroup>`;
    };
    const inAnyGroup = inRanges(ACTION_GROUPS.flatMap(g => g.ranges));
    return `<option value="">None (Standard Challenge)</option>`
        + ACTION_GROUPS.map(g => group(g.label, g.ranges.flatMap(range => SPECIAL_ACTIONS.filter(inRanges([range]))))).join("")
        + group("Other", SPECIAL_ACTIONS.filter(a => !inAnyGroup(a)));
}

// The Forge item field: each 701-709 action, named by what its label says after "Forge Auto-Buy Toggle - "
const FORGE_ITEM_OPTIONS = SPECIAL_ACTIONS.filter(a => inFamily(FORGE_FAMILY, a.value))
    .map(a => `<option value="${a.value}">${a.label.replace(/^Forge Auto-Buy Toggle - /, "")}</option>`).join("");

// The fields above the list, in their order on the page (two columns)
const FIELD_ROWS: readonly FieldRow[] = [
    {
        key: 'action', label: "Special Action:", wide: true, initial: "",
        options: renderActionOptions(),
        load: step => isIfJumpStep(step) || isSpecialStep(step) ? familyOf(step.challengeNumber)?.value ?? step.challengeNumber : "",
    },
    {
        label: "", note: "Until no more completions within Max Time, after first waiting Wait inside", wide: true,
        shown: c => c.action === C1_TO_C10_FAMILY.value,
    },
    {
        // A standard challenge's number, or C1-C10 for 601-610
        key: 'challengeNum', label: "Challenge #:", attributes: `min="1" max="15"`, initial: "1",
        check: c => c.action === C1_TO_C10_FAMILY.value ? C1_TO_C10_NUMBER : CHALLENGE_NUMBER,
        shown: c => c.inputs.has("challengeNum"),
        load: step => inFamily(C1_TO_C10_FAMILY, step.challengeNumber) ? step.challengeNumber - 600
            : isIfJumpStep(step) || isSpecialStep(step) ? undefined : step.challengeNumber,
    },
    {
        key: 'forgeItem', label: "Forge item:", initial: String(FORGE_FAMILY.first), options: FORGE_ITEM_OPTIONS,
        shown: c => c.action === FORGE_FAMILY.value,
        load: step => inFamily(FORGE_FAMILY, step.challengeNumber) ? step.challengeNumber : undefined,
    },
    {
        // 0: enters the challenge, then waits inside
        key: 'completions', label: "Min Completions:", attributes: `min="0"`, initial: "1", check: fixedCheck(NOT_NEGATIVE),
        shown: c => c.inputs.has("completions"), load: fromAction(step => step.challengeCompletions),
    },
    {
        // The game lowers a level above what the player can reach: no upper bound here
        key: 'corruptionLevel', label: "Corruption Level:", attributes: `min="0" step="1"`, initial: "0", check: fixedCheck(WHOLE_NOT_NEGATIVE),
        shown: c => c.inputs.has("corruptionLevel"), load: fromAction(step => step.corruptionLevel),
    },
    {
        key: 'ascendAfterCorruption', label: "Ascend immediately", type: 'checkbox', initial: "true",
        shown: c => c.inputs.has("corruptionLevel"), load: fromAction(step => step.ascendAfterCorruption ?? true),
    },
    {
        key: 'cleanseToHighest', label: "Cleanse to highest cleared level", type: 'checkbox', initial: "false",
        shown: c => c.inputs.has("cleanseToHighest"), load: fromAction(step => step.cleanseToHighest ?? false),
    },
    {
        key: 'toggleOn', label: "State:", initial: "true",
        options: `<option value="true">ON</option><option value="false">OFF</option>`,
        shown: c => c.inputs.has("toggleOn"), load: fromAction(step => step.toggleOn ?? true),
    },
    {
        key: 'waitBefore', label: "Wait before (ms):", attributes: `min="0"`, initial: "0", check: fixedCheck(NOT_NEGATIVE),
        load: step => step.challengeWaitBefore,
    },
    {
        key: 'waitInside', label: "Wait inside (ms):", attributes: `min="0"`, initial: "0", check: fixedCheck(NOT_NEGATIVE),
        shown: c => c.inputs.has("waitTime"), load: fromAction(step => step.challengeWaitTime),
    },
    {
        key: 'maxTime', label: "Max Time (ms):", attributes: `min="0"`, initial: "10000", check: fixedCheck(NOT_NEGATIVE),
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
        key: 'ifJumpChallenge', label: "If Challenge:", attributes: `min="1" max="15"`, initial: "1", check: fixedCheck(CHALLENGE_NUMBER),
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
    {
        key: 'ifJumpMaxJumps', label: "Max jumps (0 = no limit):", attributes: `min="0"`, initial: "0", check: fixedCheck(WHOLE_NOT_NEGATIVE),
        shown: c => c.isIfJump, load: fromIfJump(jump => jump.ifJumpMaxJumps),
    },
];

const INPUT_ROWS = FIELD_ROWS.filter((row): row is InputRow => 'key' in row);

// The footer's "?" tooltip: a term, then what it does
const HELP_LINES: readonly [string, string][] = [
    ["Enter", "In a field: Add / Update the step"],
    ["Ctrl+Z", "Undo"],
    ["Ctrl+Y, Ctrl+Shift+Z", "Redo"],
    ["", "Shortcuts work after a click in this window, not while typing in a field"],
    ["⋮⋮", "Drag a step, a \"Jump here\" row, or \"Add Here\" (where new steps go)"],
    ["Double-click", "On a step: \"Add Here\" goes below it"],
    ["Shift + drag", "Press Shift while dragging an IF to pick up its jump marker. Release Shift to leave the marker in place"],
    ["IF targets", "Drag the colored arrow or its \"Jump here\" row to change the destination"],
    ["→ step N", "Click: shows the other row of the IF"],
    ["↺", "A loop: the IF jumps back"],
    ["Max jumps", "An IF jumps at most this many times per phase pass, then goes on to the next step"],
    ["Fixed time", "Every Wait before, plus the Wait inside of challenges and C1-C10 steps. IF jumps not followed"],
    ["Corruption level", "Sets the actual level. Ascend immediately applies it now (exits an active Ascension challenge); unchecked only loads it for the next ascension. Free reward levels are added by the game"],
];

// What is being dragged: a step, an IF jump's "Jump here" row, or the "Add Here" separator
type DragTarget = { kind: 'step'; index: number } | { kind: 'jumpTarget'; ifId: string } | { kind: 'separator' };

interface LiftedRow {
    element: HTMLElement;
    placeholder?: HTMLElement;
    // Where the element was grabbed, and its size
    offsetX: number;
    offsetY: number;
    width: number;
    height: number;
}

interface DragViewport {
    left: number;
    top: number;
    width: number;
    height: number;
    listTopAtZero: number;
}

interface DragState {
    target: DragTarget;
    pairedJump?: PairedJump;
    primary: LiftedRow;
    companion?: LiftedRow;
    connector?: SVGSVGElement;
    layer: HTMLElement;
    ghosts: HTMLElement;
    stepRows: Map<Challenge, HTMLElement>;
    jumpRows: Map<string, HTMLElement>;
    separator: HTMLElement;
    // The last mouse position, for the auto-scroll (no mousemove while the mouse stays still)
    mouseX: number;
    mouseY: number;
    frame: number;
    geometry?: { midpoints: number[]; slot: number };
    viewport: DragViewport;
    viewportDirty: boolean;
    scrollTop: number;
    // The list before the drag, for Undo
    before: Snapshot;
}

// What Undo puts back
interface Snapshot {
    steps: Challenge[];
    separatorIndex: number;
}

// JSON with each object's keys sorted: two values with the same contents give the same text
export const canonicalJson = (value: unknown) => JSON.stringify(value, (_key, item: unknown) =>
    item !== null && typeof item === 'object' && !Array.isArray(item)
        ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0))
        : item);

// Auto-scroll while dragging: the zone along the list's top and bottom edges, and the speed at its edge (and past it)
const AUTO_SCROLL_ZONE_PX = 40;
const AUTO_SCROLL_MAX_PX_PER_FRAME = 12;
const JUMP_COLORS = ["#a996ff", "#6cddce", "#ffa770", "#86bbff", "#f395bc", "#d8df76", "#80daa2"];

function jumpLine(from: number, to: number, edge: number, x: number, targetEdge = edge): string {
    const direction = Math.sign(to - from) || 1;
    const radius = Math.min(4, Math.floor(Math.abs(to - from) / 2));
    const path = `M ${edge} ${from} H ${x + radius} Q ${x} ${from} ${x} ${from + direction * radius} V ${to - direction * radius} Q ${x} ${to} ${x + radius} ${to} H ${targetEdge - 3}`;
    return `<path d="${path}"/><circle cx="${edge}" cy="${from}" r="2.6"/><path class="hs-jump-arrow" d="M ${targetEdge - 5} ${to - 3.5} L ${targetEdge} ${to} L ${targetEdge - 5} ${to + 3.5} Z"/>`;
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
 *       with the mouse. The preview moves existing rows as the drop place changes.
 *       A double-click on a step moves the separator below it.
 *     - Jump markers and Add Here stay between rows during a drag. Shift-drag moves an IF and its marker together.
 *       Colored lines connect the IFs to their draggable destinations.
 *     - The fields the action shows are checked as they are typed: a bad value turns red and Add/Update says why
 *       and refuses. Never corrected. Enter in a field = Add/Update.
 *     - Edit mode follows the edited step through drags, duplicates and deletes (renumbered); Undo/Redo leave it.
 *     - Families of actions (601-610, 701-709) are one dropdown entry plus a field that picks the action.
 *     - Each change of the steps can be undone and redone (the "Add Here" separator's moves alone are not changes).
 *       Cancel and the window's × ask before dropping a copy that differs from the saved steps.
 *     - The footer shows the phase's fixed waits, the list run once (IF jumps not followed), and a help box.
 *     - The strategy window that opened it (one such window per phase) can ask whether it has unsaved changes,
 *       close it (changes dropped), change its title and bring it to the front; Save tells it.
 * Author: XxMolkxX, Shewchou
 */
export class HSAutosingChallengeModal {
    #uiMod: HSUI;
    #stratData: Challenge[];
    #title: string;
    #onSaved: () => void;
    #modalId = "";
    #root!: HTMLElement;
    // Closed, or asked to close while it opens
    #closed = false;
    // A deep copy: the IF jump targets are changed in place, which Cancel must undo too
    #steps: Challenge[];
    // Where new steps are added (the separator's index)
    #separatorIndex: number;
    // The step loaded in the fields by ✎ (null: the button adds a new step)
    #editingIndex: number | null = null;
    #fields = new Map<FieldKey, HTMLInputElement | HTMLSelectElement>();
    #rows: { row: FieldRow; element: HTMLElement }[] = [];
    #list!: HTMLElement;
    #jumpColors = new Map<string, string>();
    #jumpFrame = 0;
    #jumpResize?: ResizeObserver;
    #highlightedJump?: string;
    // The list's scrolling box
    #listContainer!: HTMLElement;
    #addButton!: HTMLElement;
    // Shown in edit mode, next to "Update step N"
    #cancelEditButton!: HTMLElement;
    #undoButton!: HTMLElement;
    #redoButton!: HTMLElement;
    #fixedTime!: HTMLElement;
    // "Discard unsaved changes?", over the window
    #discardOverlay!: HTMLElement;
    #drag: DragState | null = null;
    // The list before each change, the last one at the end
    #undoStack: Snapshot[] = [];
    // The lists undone, the last one undone at the end (emptied by a new change)
    #redoStack: Snapshot[] = [];
    // Why Add/Update is refused: the first shown field with a bad value (null: none)
    #badReason: string | null = null;
    // The page's last mouse press was in this window: Ctrl+Z / Ctrl+Y are for it
    #lastPressInside = true;

    constructor(uiMod: HSUI, stratData: Challenge[], title: string, onSaved: () => void) {
        this.#uiMod = uiMod;
        this.#stratData = stratData;
        this.#title = title;
        this.#onSaved = onSaved;
        this.#steps = structuredClone(stratData);
        this.#separatorIndex = this.#steps.length;
    }

    // position: none = HSUI's place next to the parent window
    async open(parentModalId?: string, position?: HSUIXY): Promise<void> {
        this.#modalId = await this.#uiMod.Modal({ htmlContent: this.#renderWindow(), title: this.#title, parentModalId, position });
        if (this.#closed) {
            void this.#uiMod.CloseModal(this.#modalId);
            return;
        }

        const root = document.getElementById(this.#modalId);
        if (!root) return;
        // Changed while the window was opening
        this.setTitle(this.#title);
        this.#root = root;
        this.#list = root.querySelector<HTMLElement>(".hs-challenge-list")!;
        this.#listContainer = root.querySelector<HTMLElement>(".hs-challenges-list-container")!;
        this.#addButton = root.querySelector<HTMLElement>('[data-action="add"]')!;
        this.#cancelEditButton = root.querySelector<HTMLElement>('[data-action="cancel-edit"]')!;
        this.#undoButton = root.querySelector<HTMLElement>('[data-action="undo"]')!;
        this.#redoButton = root.querySelector<HTMLElement>('[data-action="redo"]')!;
        this.#fixedTime = root.querySelector<HTMLElement>(".hs-challenges-fixed-time")!;
        this.#discardOverlay = root.querySelector<HTMLElement>(".hs-editor-overlay")!;
        HSTooltip.set(root.querySelector<HTMLElement>(".hs-challenges-help-btn")!, { html: HSTooltip.list(HELP_LINES), delay: 0, placement: 'above', maxWidth: 560 });
        for (const element of root.querySelectorAll<HTMLElement>("[data-row]")) {
            this.#rows.push({ row: FIELD_ROWS[Number(element.dataset.row)], element });
        }
        for (const field of root.querySelectorAll<HTMLInputElement | HTMLSelectElement>("[data-field]")) {
            this.#fields.set(field.dataset.field as FieldKey, field);
        }

        this.#field('action').addEventListener("change", () => this.#showFields());
        this.#field('ifJumpMode').addEventListener("change", () => this.#showFields());
        // The values are checked as they are typed
        const inputSection = root.querySelector<HTMLElement>(".hs-challenges-input-section")!;
        inputSection.addEventListener("input", () => this.#checkFields());
        inputSection.addEventListener("change", () => this.#checkFields());
        // Enter in a typed field = Add/Update (a dropdown keeps its own Enter)
        inputSection.addEventListener("keydown", e => {
            if (e.key !== "Enter" || e.isComposing || !(e.target instanceof HTMLInputElement)) return;
            e.preventDefault();
            this.#addOrUpdate();
        });
        root.addEventListener("click", e => this.#onClick(e));
        // The window's ×: on its own button, so that HSUI's handler on the window never sees a click held back
        root.querySelector<HTMLElement>(".hs-modal-close-btn")?.addEventListener("click", e => {
            if (!this.#isChanged()) return;
            e.stopPropagation();
            this.#discardOverlay.hidden = false;
        });
        this.#list.addEventListener("mousedown", e => this.#onListMouseDown(e));
        this.#list.addEventListener("dblclick", e => this.#onListDoubleClick(e));
        // An IF jump and its target are highlighted together
        this.#list.addEventListener("mouseover", e => {
            if (!this.#drag) this.#highlightJump((e.target as HTMLElement).closest<HTMLElement>("[data-if-id]")?.dataset.ifId);
        });
        this.#list.addEventListener("mouseleave", () => {
            if (!this.#drag) this.#highlightJump(undefined);
        });
        this.#jumpResize = new ResizeObserver(() => {
            if (this.#drag) {
                this.#drag.geometry = undefined;
                this.#drag.viewportDirty = true;
                this.#requestDragFrame();
            }
            this.#queueJumpLines();
        });
        this.#jumpResize.observe(this.#list);
        this.#jumpResize.observe(this.#listContainer);
        document.addEventListener("mousedown", this.#onPageMouseDown, true);
        document.addEventListener("keydown", this.#onPageKeyDown);

        this.#fillFields(null);
        this.#showFooter();
        this.#queueJumpLines();
    }

    // ----- Window and list HTML -----

    #renderWindow(): string {
        const rows = FIELD_ROWS.map((row, i) => {
            const classes = `hs-challenges-input-row${row.wide ? " hs-challenges-input-row-wide" : ""}`;
            const content = 'note' in row
                ? `<div class="hs-challenges-input-note">${row.note}</div>`
                : this.#renderControl(row);
            const label = 'type' in row && row.type === 'checkbox' ? '' : `<div class="hs-challenges-input-label">${row.label}</div>`;
            return `<div class="${classes}" data-row="${i}">${label}${content}</div>`;
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
                <div class="hs-challenges-footer-btn hs-challenges-small-btn hs-challenges-help-btn">?</div>
                <div class="hs-challenges-footer-btn hs-challenges-small-btn hs-challenges-undo-btn" data-action="undo" title="Undo (Ctrl+Z)">↶ Undo</div>
                <div class="hs-challenges-footer-btn hs-challenges-small-btn hs-challenges-undo-btn" data-action="redo" title="Redo (Ctrl+Y)">↷ Redo</div>
                <div class="hs-challenges-fixed-time" title="Every Wait before, plus the Wait inside of challenges and C1-C10 steps. IF jumps not followed."></div>
                <div class="hs-challenges-footer-btn hs-challenges-cancel-btn" data-action="cancel">Cancel</div>
                <div class="hs-challenges-footer-btn hs-challenges-save-btn" data-action="save">Save</div>
            </div>
            <div class="hs-editor-overlay" hidden>
                <div class="hs-editor-overlay-box">
                    <div>Discard unsaved changes?</div>
                    <div class="hs-editor-overlay-buttons">
                        <div class="hs-challenges-footer-btn hs-challenges-cancel-btn" data-action="keep-editing">Keep editing</div>
                        <div class="hs-challenges-footer-btn hs-editor-overlay-confirm" data-action="discard">Discard</div>
                    </div>
                </div>
            </div>
        </div>`;
    }

    #renderControl(row: InputRow): string {
        const common = `class="hs-challenges-input" data-field="${row.key}"`;
        if (row.type === 'checkbox') return `<label class="hs-challenges-checkbox"><input type="checkbox" ${common} />${row.label}</label>`;
        return row.options !== undefined
            ? `<select ${common}>${row.options}</select>`
            : `<input type="${row.type ?? "number"}" ${common} ${row.attributes ?? ""} />`;
    }

    // The steps, with each IF jump's target before the step it jumps to and the separator where new steps go
    #renderList(): string {
        const rows = stepListRows(this.#steps, this.#separatorIndex);
        const connectors = rows.some(row => row.kind === 'target') ? '<svg class="hs-jump-lines" aria-hidden="true"></svg>' : '';
        return connectors + rows.map(row => {
            switch (row.kind) {
                case 'step': return this.#renderStep(this.#steps[row.index], row.index);
                case 'target': return this.#renderJumpTarget(row.ifStep, row.ifIndex);
                case 'separator': return this.#renderSeparator();
            }
        }).join("");
    }

    // After any change of the steps or of the separator
    #redrawList(): void {
        this.#list.innerHTML = this.#renderList();
        if (this.#drag) this.#drag.geometry = undefined;
        else this.#showFooter();
        this.#highlightJump(this.#highlightedJump);
        this.#queueJumpLines();
    }

    #jumpRowAttrs(id: string): string {
        let color = this.#jumpColors.get(id);
        if (color === undefined) {
            const index = this.#jumpColors.size;
            color = JUMP_COLORS[index] ?? `hsl(${(index * 137.508) % 360} 72% 72%)`;
            this.#jumpColors.set(id, color);
        }
        return `data-if-id="${escapeHtml(id)}" style="--hs-jump-color:${color}"`;
    }

    #queueJumpLines(): void {
        if (this.#jumpFrame || !this.#list.querySelector(".hs-jump-lines")) return;
        this.#jumpFrame = requestAnimationFrame(() => {
            this.#jumpFrame = 0;
            this.#drawJumpLines();
        });
    }

    #drawJumpLines(): void {
        const svg = this.#list.querySelector<SVGSVGElement>(".hs-jump-lines");
        if (!svg) return;
        const listTop = this.#list.getBoundingClientRect().top;
        const mid = (row: Element) => {
            const rect = row.getBoundingClientRect();
            return Math.round(rect.top - listTop + rect.height / 2);
        };
        const targets = new Map(Array.from(this.#list.querySelectorAll<HTMLElement>(".hs-if-target:not(.hs-challenge-lifted)"),
            row => [row.dataset.ifId!, mid(row)]));
        const pairs = Array.from(this.#list.querySelectorAll<HTMLElement>(".hs-if-block:not(.hs-challenge-lifted)"), row => {
            const id = row.dataset.ifId!;
            const from = mid(row);
            const to = targets.get(id)!;
            return { id, from, to, top: Math.min(from, to), bottom: Math.max(from, to) };
        }).sort((a, b) => a.top - b.top || b.bottom - a.bottom);
        const lanes: number[] = [];
        const routed = pairs.map(pair => {
            const free = lanes.findIndex(bottom => bottom + 3 < pair.top);
            const lane = free === -1 ? lanes.length : free;
            lanes[lane] = pair.bottom;
            return { ...pair, lane };
        });
        const gutter = svg.clientWidth;
        const edge = gutter - 3;
        const spacing = Math.min(5, Math.max(0, gutter - 15) / Math.max(1, lanes.length - 1));
        svg.innerHTML = routed.map(({ id, from, to, lane }) => {
            const x = 3 + (lanes.length - 1 - lane) * spacing;
            const highlight = id === this.#highlightedJump ? " hs-jump-highlight" : "";
            return `<g class="hs-jump-line${highlight}" ${this.#jumpRowAttrs(id)}>${jumpLine(from, to, edge, x)}</g>`;
        }).join("");
    }

    #showFooter(): void {
        this.#undoButton.classList.toggle("hs-challenges-undo-btn-off", this.#undoStack.length === 0);
        this.#redoButton.classList.toggle("hs-challenges-undo-btn-off", this.#redoStack.length === 0);
        // Fixed waits only: what a challenge or an action waits for in the game isn't known here
        let ms = 0;
        for (const step of this.#steps) {
            ms += step.challengeWaitBefore ?? 0;
            if (hasFixedWaitInside(step)) ms += step.challengeWaitTime ?? 0;
        }
        this.#fixedTime.textContent = `Fixed time: ${(ms / 1000).toLocaleString(undefined, { minimumFractionDigits: 3, maximumFractionDigits: 3 })} s`;
    }

    #renderStep(step: Challenge, index: number): string {
        const isIfJump = isIfJumpStep(step);
        const classes = `hs-challenge-item${isIfJump ? " hs-if-block" : ""}${index === this.#editingIndex ? " hs-challenge-item-editing" : ""}`;
        const ifId = isIfJump ? ` ${this.#jumpRowAttrs(step.ifJump.id)}` : "";
        const dragHint = isIfJump ? ' title="Hold Shift while dragging this IF to move its jump marker too"' : "";
        return `
        <div class="${classes}" data-index="${index}"${ifId}>
            <div class="hs-challenge-step-no">${index + 1}</div>
            <div class="hs-challenge-drag-handle"${dragHint}>⋮⋮</div>
            <div class="${isIfJump ? "hs-if-content" : "hs-challenge-item-text"}">
                ${this.#renderStepText(step, index)}
                <div class="hs-challenge-meta">${this.#renderStepMeta(step)}</div>
                ${step.comment ? `<div class="hs-challenge-comment">🗨️ ${escapeHtml(step.comment)}</div>` : ""}
            </div>
            <div class="hs-challenge-btn hs-challenge-btn-edit" data-action="edit" title="Edit">✎</div>
            <div class="hs-challenge-btn hs-challenge-btn-duplicate" data-action="duplicate" title="Duplicate">⧉</div>
            <div class="hs-challenge-btn hs-challenge-btn-delete" data-action="delete" title="Delete">×</div>
        </div>`;
    }

    // An IF jump that jumps back, to its own step or one before it
    #renderLoopMark(step: IsJumpChallenge, ifIndex: number): string {
        return step.ifJump.ifJumpIndex <= ifIndex ? ` <span class="hs-challenge-loop" title="Loop: jumps back">↺</span>` : "";
    }

    #jumpLabel(step: IsJumpChallenge, index: number): string {
        const target = step.ifJump.ifJumpIndex;
        const destination = target === this.#steps.length ? "end of phase" : `step ${target + 1}`;
        return `→ ${destination}${this.#renderLoopMark(step, index)}`;
    }

    #jumpMarkerLabel(step: IsJumpChallenge, index: number): string {
        return `(IF step ${index + 1}${this.#renderLoopMark(step, index)})`;
    }

    #renderStepText(step: Challenge, index: number): string {
        const actionId = (id: number) => `<span class="hs-challenge-action-id">(${id})</span>`;
        if (isIfJumpStep(step)) {
            const jump = step.ifJump;
            const condition = (jump.ifJumpMode ?? "challenges") === "challenges"
                ? `challenge ${jump.ifJumpChallenge} ${jump.ifJumpOperator} ${jump.ifJumpValue}`
                : `Stored C15${jump.ifJumpMultiplier ? ` × 10^${jump.ifJumpMultiplier}` : ""} ${jump.ifJumpOperator} Current C15`;
            // The step that runs next when the condition holds (the logs' "jump to step N"); a click shows its "Jump here" row
            return `<strong>IF</strong> ${escapeHtml(condition)} `
                + `<span class="hs-challenge-jump-to hs-challenge-jump-link" data-action="show-target">${this.#jumpLabel(step, index)}</span> `
                + actionId(IF_JUMP_VALUE);
        }
        const labelClass = stepLabelClass(step);
        const action = SPECIAL_ACTION_BY_ID.get(step.challengeNumber);
        if (!action) return `<span class="${labelClass}">Challenge ${step.challengeNumber}</span> (${step.challengeCompletions} completions)`;
        const label = isCorruptionLevelStep(step.challengeNumber)
            ? `${action.label}: ${step.corruptionLevel ?? 0} (${step.ascendAfterCorruption === false ? 'next ascension' : 'ascend now'})`
            : step.challengeNumber === CLEANSE_CORRUPTION_VALUE
                ? `${action.label} (${step.cleanseToHighest === true ? 'to highest cleared' : 'to 0'})`
                : isSetAutoToggleStep(step.challengeNumber) ? `${action.label} (${step.toggleOn === false ? 'OFF' : 'ON'})` : action.label;
        return `<strong class="${labelClass}">${label}</strong> ${actionId(step.challengeNumber)}`;
    }

    #renderStepMeta(step: Challenge): string {
        const ms = (value: number) => `${value.toLocaleString()}ms`;
        const inputs = this.#inputsOf(isIfJumpStep(step) ? String(IF_JUMP_VALUE) : isSpecialStep(step) ? String(step.challengeNumber) : "");
        const parts = [`Wait before: ${ms(step.challengeWaitBefore ?? 0)}`];
        if (inputs.has("waitTime")) parts.push(`Wait inside: ${ms(step.challengeWaitTime)}`);
        if (inputs.has("maxTime")) parts.push(`Max: ${ms(step.challengeMaxTime ?? -1)}`);
        const maxJumps = isIfJumpStep(step) ? step.ifJump.ifJumpMaxJumps ?? 0 : 0;
        if (maxJumps > 0) parts.push(`Max jumps: ${maxJumps}`);
        return parts.join(" | ");
    }

    // ifIndex: the IF jump's index, shown as its step number (a click shows the IF)
    #renderJumpTarget(step: IsJumpChallenge, ifIndex: number): string {
        return `
        <div class="hs-challenge-item hs-if-target" ${this.#jumpRowAttrs(step.ifJump.id)}>
            <span class="hs-challenge-drag-handle hs-jump-endpoint" title="Drag to change jump destination"></span>
            <div class="hs-challenge-step-no"></div>
            <div class="hs-challenge-drag-handle">⋮⋮</div>
            ↳ Jump here <span class="hs-challenge-jump-to hs-challenge-jump-link" data-action="show-if">${this.#jumpMarkerLabel(step, ifIndex)}</span>
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
        this.#highlightedJump = ifId;
        for (const element of this.#list.querySelectorAll(".hs-jump-highlight")) element.classList.remove("hs-jump-highlight");
        if (ifId === undefined) return;
        for (const element of this.#list.querySelectorAll(`[data-if-id="${CSS.escape(ifId)}"]`)) element.classList.add("hs-jump-highlight");
    }

    // Flashes a row, after scrolling the list just enough to show it and the row past it (a row already in view: no scroll)
    #showRow(element: HTMLElement | null): void {
        if (!element) return;
        const container = this.#listContainer;
        const viewTop = container.getBoundingClientRect().top + container.clientTop;
        const viewBottom = viewTop + container.clientHeight;
        const rect = element.getBoundingClientRect();
        let offset = 0;
        if (rect.top < viewTop) offset = (element.previousElementSibling?.getBoundingClientRect().top ?? rect.top) - viewTop;
        else if (rect.bottom > viewBottom) offset = (element.nextElementSibling?.getBoundingClientRect().bottom ?? rect.bottom) - viewBottom;
        if (offset !== 0) container.scrollTo({ top: container.scrollTop + offset, behavior: "smooth" });
        element.classList.remove("hs-jump-flash");
        // Restarts the flash when the row is still flashing
        void element.offsetWidth;
        element.classList.add("hs-jump-flash");
    }

    // ----- Fields -----

    #field(key: FieldKey): HTMLInputElement | HTMLSelectElement {
        return this.#fields.get(key)!;
    }

    #number(key: FieldKey): number {
        return Number(this.#field(key).value);
    }

    // The inputs an action uses ("": a standard challenge; a family: its actions', plus Challenge # for C1-C10)
    #inputsOf(action: string): ReadonlySet<ModalInput> {
        if (action === "") return STANDARD_CHALLENGE_INPUTS;
        const family = ACTION_FAMILIES.find(f => f.value === action);
        const inputs = new Set<ModalInput>(SPECIAL_ACTION_BY_ID.get(family ? family.first : Number(action))?.inputs ?? []);
        if (family === C1_TO_C10_FAMILY) inputs.add("challengeNum");
        return inputs;
    }

    // The action id the dropdown and the fields pick
    #actionId(action: string): number {
        if (action === "") return this.#number('challengeNum');
        if (action === C1_TO_C10_FAMILY.value) return C1_TO_C10_FAMILY.first - 1 + this.#number('challengeNum');
        if (action === FORGE_FAMILY.value) return this.#number('forgeItem');
        return Number(action);
    }

    #context(): FieldContext {
        const action = this.#field('action').value;
        return {
            action,
            inputs: this.#inputsOf(action),
            isIfJump: action === String(IF_JUMP_VALUE),
            ifJumpMode: this.#field('ifJumpMode').value as IfJumpMode,
        };
    }

    #showFields(): void {
        const context = this.#context();
        for (const { row, element } of this.#rows) {
            element.hidden = row.shown !== undefined && !row.shown(context);
        }
        this.#checkFields();
    }

    // Puts a step's values in the fields (null: the initial values). keepComment: a comment being typed for the next step
    #fillFields(step: Challenge | null, keepComment = false): void {
        for (const row of INPUT_ROWS) {
            if (row.key === 'comment' && keepComment) continue;
            const value = step ? row.load?.(step) : undefined;
            if (row.type === 'checkbox') (this.#field(row.key) as HTMLInputElement).checked = value === undefined ? row.initial === 'true' : value === true;
            else this.#field(row.key).value = value === undefined ? row.initial : String(value);
        }
        this.#showFields();
    }

    // Turns the shown number fields with a bad value red; Add/Update says why (the first one) and refuses.
    // The fields an action hides aren't checked
    #checkFields(): void {
        const context = this.#context();
        this.#badReason = null;
        for (const { row, element } of this.#rows) {
            if (!('key' in row) || row.options !== undefined || row.type === 'text' || row.type === 'checkbox') continue;
            let reason: string | null = null;
            if (!element.hidden) {
                const text = this.#field(row.key).value.trim();
                const value = Number(text);
                const check = row.check?.(context);
                if (text === "" || !Number.isFinite(value)) reason = "a number";
                else if (check && !check.isValid(value)) reason = check.message;
            }
            this.#field(row.key).classList.toggle("hs-challenges-input-invalid", reason !== null);
            if (reason !== null && this.#badReason === null) this.#badReason = `${row.label.replace(/:$/, "")}: ${reason}`;
        }
        this.#showAddButtonText();
    }

    // The step the fields describe. previous: the step being updated
    #buildStep(previous: Challenge | null): Challenge {
        const action = this.#field('action').value;
        let step: Challenge;
        if (action === String(IF_JUMP_VALUE)) {
            const mode = this.#field('ifJumpMode').value as IfJumpMode;
            const isChallengesMode = mode === "challenges";
            // A new IF jumps to the step after it
            // Written only when set: an old IF updated without one stays unchanged
            const maxJumps = this.#number('ifJumpMaxJumps');
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
                    ifJumpIndex: previous?.ifJump?.ifJumpIndex ?? (this.#editingIndex ?? this.#separatorIndex) + 1,
                    ...(maxJumps > 0 ? { ifJumpMaxJumps: maxJumps } : {}),
                },
            };
        } else {
            step = {
                challengeNumber: this.#actionId(action),
                challengeCompletions: this.#number('completions'),
                challengeWaitTime: this.#number('waitInside'),
                challengeWaitBefore: this.#number('waitBefore'),
                challengeMaxTime: this.#number('maxTime'),
            };
            if (isCorruptionLevelStep(step.challengeNumber)) {
                step.corruptionLevel = this.#number('corruptionLevel');
                step.ascendAfterCorruption = (this.#field('ascendAfterCorruption') as HTMLInputElement).checked;
                step.challengeCompletions = 0;
            } else if (step.challengeNumber === CLEANSE_CORRUPTION_VALUE) {
                step.cleanseToHighest = (this.#field('cleanseToHighest') as HTMLInputElement).checked;
                step.challengeCompletions = 0;
            } else if (isSetAutoToggleStep(step.challengeNumber)) {
                step.toggleOn = this.#field('toggleOn').value === "true";
                step.challengeCompletions = 0;
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
        this.#showAddButtonText();
        this.#cancelEditButton.hidden = index === null;
        this.#redrawList();
    }

    // A bad value: the reason, in the button's own box (red)
    #showAddButtonText(): void {
        this.#addButton.classList.toggle("hs-challenges-add-btn-refused", this.#badReason !== null);
        this.#addButton.textContent = this.#badReason
            ?? (this.#editingIndex === null ? "Add Action/Challenge" : `Update step ${this.#editingIndex + 1}`);
    }

    // ----- Steps -----

    // Adding and deleting a step shifts the jump destinations that follow it.
    #shiftJumpTargets(index: number, delta: 1 | -1): void {
        for (const step of this.#steps) {
            if (!isIfJumpStep(step)) continue;
            const target = step.ifJump.ifJumpIndex;
            if (target > index || (delta === 1 && target === index)) step.ifJump.ifJumpIndex += delta;
        }
    }

    #snapshot(): Snapshot {
        return { steps: structuredClone(this.#steps), separatorIndex: this.#separatorIndex };
    }

    // To call before each change of the steps (before: the list before a drag). A new change can't be redone over
    #saveForUndo(before: Snapshot = this.#snapshot()): void {
        this.#undoStack.push(before);
        this.#redoStack.length = 0;
    }

    // Puts the list back as it was before the last change; the list left goes to the other stack
    #undo(): void {
        this.#travel(this.#undoStack, this.#redoStack);
    }

    #redo(): void {
        this.#travel(this.#redoStack, this.#undoStack);
    }

    // Leaves edit mode (the edited step may be gone); in add mode the typed fields stay
    #travel(from: Snapshot[], to: Snapshot[]): void {
        const snapshot = from.pop();
        if (!snapshot) return;
        to.push(this.#snapshot());
        this.#steps = snapshot.steps;
        this.#separatorIndex = snapshot.separatorIndex;
        if (this.#editingIndex !== null) this.#setEditing(null);
        else this.#redrawList();
    }

    // The copy differs from the saved steps (an Update that left a step as it was isn't a change)
    #isChanged(): boolean {
        return canonicalJson(this.#steps) !== canonicalJson(this.#stratData);
    }

    #addOrUpdate(): void {
        // The button already says why
        if (this.#badReason !== null || this.#drag) return;
        if (this.#editingIndex !== null) {
            const step = this.#buildStep(this.#steps[this.#editingIndex]);
            if (canonicalJson([step]) !== canonicalJson([this.#steps[this.#editingIndex]])) {
                this.#saveForUndo();
                this.#steps[this.#editingIndex] = step;
            }
            this.#setEditing(null);
            return;
        }
        const step = this.#buildStep(null);
        this.#saveForUndo();
        this.#shiftJumpTargets(this.#separatorIndex, 1);
        this.#steps.splice(this.#separatorIndex, 0, step);
        this.#separatorIndex++;
        this.#fillFields(null, true);
        this.#redrawList();
    }

    // A copy of a step right after it, added as a new step there. Edit mode stays on the edited step
    #duplicate(index: number): void {
        this.#saveForUndo();
        this.#keepEditing(() => {
            this.#shiftJumpTargets(index + 1, 1);
            // A copied IF jumps where its original does (after the shift)
            const copy = structuredClone(this.#steps[index]);
            if (isIfJumpStep(copy)) copy.ifJump.id = HSUtils.uuidv4();
            this.#steps.splice(index + 1, 0, copy);
            if (this.#separatorIndex > index) this.#separatorIndex++;
        });
        this.#redrawList();
    }

    #delete(index: number): void {
        this.#saveForUndo();
        this.#keepEditing(() => {
            this.#steps.splice(index, 1);
            this.#shiftJumpTargets(index, -1);
            if (index < this.#separatorIndex) this.#separatorIndex--;
        });
        this.#redrawList();
    }

    // Runs a change of the list that keeps the step objects (not Undo/Redo, which leave edit mode): edit mode follows
    // the edited step wherever it lands, renumbered, with the fields as typed. Its step deleted: edit mode ends
    #keepEditing(change: () => void): void {
        const edited = this.#editingIndex === null ? null : this.#steps[this.#editingIndex];
        change();
        if (edited === null) return;
        const index = this.#steps.indexOf(edited);
        if (index === -1) {
            this.#setEditing(null);
            return;
        }
        this.#editingIndex = index;
        this.#showAddButtonText();
    }

    #onClick(e: MouseEvent): void {
        const target = e.target as HTMLElement;
        const action = target.closest<HTMLElement>("[data-action]")?.dataset.action;
        const index = Number(target.closest<HTMLElement>(".hs-challenge-item")?.dataset.index);
        const ifId = target.closest<HTMLElement>("[data-if-id]")?.dataset.ifId;
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
            case "duplicate":
                this.#duplicate(index);
                break;
            case "delete":
                this.#delete(index);
                break;
            case "show-target":
                this.#showRow(this.#list.querySelector<HTMLElement>(`.hs-if-target[data-if-id="${CSS.escape(ifId!)}"]:not(.hs-challenge-lifted)`));
                break;
            case "show-if":
                this.#showRow(this.#list.querySelector<HTMLElement>(`.hs-if-block[data-if-id="${CSS.escape(ifId!)}"]:not(.hs-challenge-lifted)`));
                break;
            case "undo":
                this.#undo();
                break;
            case "redo":
                this.#redo();
                break;
            case "save":
                this.#stratData.length = 0;
                this.#stratData.push(...this.#steps);
                this.#onSaved();
                this.close();
                break;
            case "cancel":
                if (this.#isChanged()) this.#discardOverlay.hidden = false;
                else this.close();
                break;
            case "keep-editing":
                this.#discardOverlay.hidden = true;
                break;
            case "discard":
                this.close();
                break;
        }
    }

    // A double-click on a step moves the separator below it (its buttons, link and handle keep their clicks)
    #onListDoubleClick(e: MouseEvent): void {
        const target = e.target as HTMLElement;
        if (this.#drag || target.closest("[data-action], .hs-challenge-drag-handle")) return;
        const row = target.closest<HTMLElement>(".hs-challenge-item[data-index]");
        if (!row) return;
        const index = Number(row.dataset.index);
        if (this.#separatorIndex === index + 1) return;
        // The step stays under the mouse when the separator leaves from above it
        const top = row.getBoundingClientRect().top;
        this.#separatorIndex = index + 1;
        this.#redrawList();
        const moved = this.#list.querySelector<HTMLElement>(`.hs-challenge-item[data-index="${index}"]`);
        if (moved) this.#listContainer.scrollTop += moved.getBoundingClientRect().top - top;
    }

    // ----- For the strategy window -----

    /** Open, or opening. */
    isOpen(): boolean {
        return !this.#closed && (this.#modalId === "" || document.getElementById(this.#modalId) !== null);
    }

    hasUnsavedChanges(): boolean {
        return this.isOpen() && this.#isChanged();
    }

    /** Closes the window without saving (while it opens: as soon as it is open). */
    close(): void {
        if (this.#closed) return;
        this.#closed = true;
        this.#removePageListeners();
        if (this.#modalId !== "") void this.#uiMod.CloseModal(this.#modalId);
    }

    setTitle(title: string): void {
        this.#title = title;
        const titleElement = this.#modalId === "" ? null : document.getElementById(this.#modalId)?.querySelector(".hs-modal-title");
        if (titleElement) titleElement.textContent = title;
    }

    /** Its id ("" while it opens), to place the next window from it. */
    get modalId(): string {
        return this.#modalId;
    }

    bringToFront(): void {
        if (this.#modalId !== "") void this.#uiMod.BringModalToFront(this.#modalId);
    }

    // ----- Ctrl+Z, Ctrl+Y -----

    #removePageListeners(): void {
        this.#jumpResize?.disconnect();
        cancelAnimationFrame(this.#jumpFrame);
        if (this.#drag) this.#clearDrag();
        document.removeEventListener("mousedown", this.#onPageMouseDown, true);
        document.removeEventListener("keydown", this.#onPageKeyDown);
    }

    // The window can also go without #close (HSUI's ×)
    #isGone(): boolean {
        if (this.#root.isConnected) return false;
        this.#removePageListeners();
        return true;
    }

    #onPageMouseDown = (e: MouseEvent): void => {
        if (this.#isGone()) return;
        this.#lastPressInside = this.#root.contains(e.target as Node);
    };

    // Ctrl+Z undoes, Ctrl+Y or Ctrl+Shift+Z redoes, when this window was the last one clicked; a field keeps its own
    #onPageKeyDown = (e: KeyboardEvent): void => {
        if (this.#isGone()) return;
        if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
        const key = e.key.toLowerCase();
        const isUndo = key === "z" && !e.shiftKey;
        const isRedo = (key === "y" && !e.shiftKey) || (key === "z" && e.shiftKey);
        if (!isUndo && !isRedo) return;
        if (!this.#lastPressInside || this.#drag || !this.#discardOverlay.hidden) return;
        const focused = document.activeElement;
        if (focused instanceof HTMLInputElement || focused instanceof HTMLSelectElement || focused instanceof HTMLTextAreaElement
            || (focused instanceof HTMLElement && focused.isContentEditable)) return;
        e.preventDefault();
        if (isUndo) this.#undo();
        else this.#redo();
    };

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
        const layer = document.createElement("div");
        layer.className = "hs-challenge-drag-layer";
        layer.setAttribute("aria-hidden", "true");
        const ghosts = document.createElement("div");
        ghosts.className = "hs-challenge-drag-ghosts";
        layer.append(ghosts);
        const scrollTop = this.#listContainer.scrollTop;
        this.#drag = {
            target,
            primary: this.#captureLifted(element, e.clientX, e.clientY),
            layer,
            ghosts,
            stepRows: new Map(Array.from(this.#list.querySelectorAll<HTMLElement>(".hs-challenge-item[data-index]"),
                item => [this.#steps[Number(item.dataset.index)], item])),
            jumpRows: new Map(Array.from(this.#list.querySelectorAll<HTMLElement>(".hs-if-target"),
                item => [item.dataset.ifId!, item])),
            separator: this.#list.querySelector<HTMLElement>(".hs-challenge-separator")!,
            mouseX: e.clientX,
            mouseY: e.clientY,
            frame: 0,
            viewport: this.#measureDragViewport(scrollTop),
            viewportDirty: false,
            scrollTop,
            before: this.#snapshot(),
        };
        this.#list.append(layer);
        this.#positionDragLayer();
        this.#lift(this.#drag.primary);
        this.#setPairedDrag(e.shiftKey);
        this.#moveLifted();
        this.#highlightJump(row?.dataset.ifId);
        this.#queueJumpLines();
        document.addEventListener("mousemove", this.#onDragMove);
        document.addEventListener("mouseup", this.#onDragEnd);
        document.addEventListener("keydown", this.#onDragShift);
        document.addEventListener("keyup", this.#onDragShift);
        document.addEventListener("scroll", this.#onDragScroll, true);
        window.addEventListener("resize", this.#onDragViewportChange);
    }

    #captureLifted(element: HTMLElement, mouseX: number, mouseY: number): LiftedRow {
        const { left, top, width, height } = element.getBoundingClientRect();
        return { element, offsetX: mouseX - left, offsetY: mouseY - top, width, height };
    }

    #onDragShift = (e: KeyboardEvent): void => {
        if (!this.#drag || e.key !== "Shift") return;
        this.#setPairedDrag(e.shiftKey);
        this.#moveLifted();
    };

    #setPairedDrag(held: boolean): void {
        const drag = this.#drag;
        if (!drag || drag.target.kind !== 'step' || held === !!drag.pairedJump) return;
        const step = this.#steps[drag.target.index];
        if (!isIfJumpStep(step)) return;

        if (!held) {
            // Keep the previewed destination and return its marker to the list.
            const companion = drag.companion!;
            companion.element.classList.remove("hs-challenge-lifted");
            companion.element.style.width = "";
            companion.element.style.height = "";
            companion.element.style.left = "";
            companion.element.style.top = "";
            companion.placeholder!.replaceWith(companion.element);
            drag.connector?.remove();
            drag.pairedJump = undefined;
            drag.companion = undefined;
            drag.connector = undefined;
            drag.geometry = undefined;
            this.#list.classList.remove("hs-challenge-dragging-pair");
            this.#queueJumpLines();
            return;
        }

        const marker = drag.jumpRows.get(step.ifJump.id);
        if (!marker) return;
        // Base the distance on the order currently on screen, even after reordering without Shift.
        drag.pairedJump = { id: step.ifJump.id, offset: step.ifJump.ifJumpIndex - drag.target.index };
        drag.companion = this.#captureLifted(marker, drag.mouseX, drag.mouseY);
        drag.geometry = undefined;
        this.#liftCompanion();
        this.#highlightJump(step.ifJump.id);
        this.#queueJumpLines();
    }

    // Takes the element out of the list, under the mouse, and leaves a faded copy in its place
    #lift(row: LiftedRow): void {
        const { element } = row;
        const placeholder = element.cloneNode(true) as HTMLElement;
        placeholder.classList.add("hs-challenge-placeholder");
        element.replaceWith(placeholder);
        element.classList.add("hs-challenge-lifted");
        element.style.width = `${row.width}px`;
        element.style.height = `${row.height}px`;
        element.style.left = `${-row.offsetX}px`;
        element.style.top = `${-row.offsetY}px`;
        row.placeholder = placeholder;
        this.#drag!.ghosts.append(element);
    }

    #updateDragPreview(): void {
        const drag = this.#drag!;
        drag.geometry = undefined;
        const rows = stepListRows(this.#steps, this.#separatorIndex);
        let next: HTMLElement = drag.layer;
        for (let index = rows.length - 1; index >= 0; index--) {
            const row = rows[index];
            const element = row.kind === 'step' ? drag.stepRows.get(this.#steps[row.index])!
                : row.kind === 'target' ? drag.jumpRows.get(row.ifStep.ifJump.id)! : drag.separator;
            const placeholder = element === drag.primary.element ? drag.primary.placeholder
                : element === drag.companion?.element ? drag.companion.placeholder : undefined;
            if (row.kind === 'step') {
                const step = this.#steps[row.index];
                const label = isIfJumpStep(step) ? this.#jumpLabel(step, row.index) : undefined;
                this.#updateDragRow(element, row.index, label);
                if (placeholder) this.#updateDragRow(placeholder, row.index, label);
            } else if (row.kind === 'target') {
                const label = this.#jumpMarkerLabel(row.ifStep, row.ifIndex);
                this.#updateDragRow(element, undefined, label);
                if (placeholder) this.#updateDragRow(placeholder, undefined, label);
            }
            const inList = placeholder ?? element;
            if (inList.nextElementSibling !== next) this.#list.insertBefore(inList, next);
            next = inList;
        }
        this.#queueJumpLines();
    }

    #updateDragRow(row: HTMLElement, index: number | undefined, jumpLabel: string | undefined): void {
        if (index !== undefined && row.dataset.index !== String(index)) {
            row.dataset.index = String(index);
            row.querySelector(".hs-challenge-step-no")!.textContent = String(index + 1);
        }
        if (jumpLabel !== undefined) {
            const link = row.querySelector(".hs-challenge-jump-link")!;
            if (link.innerHTML !== jumpLabel) link.innerHTML = jumpLabel;
        }
    }

    #liftCompanion(): void {
        const drag = this.#drag!;
        const companion = drag.companion!;
        this.#lift(companion);
        this.#list.classList.add("hs-challenge-dragging-pair");
        if (!drag.connector) {
            const from = drag.primary.height / 2 - drag.primary.offsetY;
            const to = companion.height / 2 - companion.offsetY;
            const top = Math.min(from, to) - 5;
            const gutter = this.#list.querySelector<SVGSVGElement>(".hs-jump-lines")!.clientWidth;
            const left = Math.min(-drag.primary.offsetX, -companion.offsetX) - gutter;
            const sourceEdge = -drag.primary.offsetX - left - 3;
            const targetEdge = -companion.offsetX - left - 3;
            const connector = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            connector.classList.add("hs-jump-line", "hs-jump-lifted-line", "hs-jump-highlight");
            connector.style.setProperty("--hs-jump-color", this.#jumpColors.get(drag.pairedJump!.id)!);
            connector.setAttribute("width", String(Math.max(sourceEdge, targetEdge) + 3));
            connector.setAttribute("height", String(Math.abs(from - to) + 10));
            connector.setAttribute("aria-hidden", "true");
            connector.style.left = `${left}px`;
            connector.style.top = `${top}px`;
            connector.innerHTML = jumpLine(from - top, to - top, sourceEdge, 3, targetEdge);
            drag.connector = connector;
        }
        drag.ghosts.append(drag.connector);
    }

    #moveLifted(): void {
        const { ghosts, viewport, mouseX, mouseY } = this.#drag!;
        ghosts.style.transform = `translate3d(${mouseX - viewport.left}px, ${mouseY - viewport.top}px, 0)`;
    }

    #measureDragViewport(scrollTop: number): DragViewport {
        const container = this.#listContainer;
        const box = container.getBoundingClientRect();
        return {
            left: box.left + container.clientLeft,
            top: box.top + container.clientTop,
            width: container.clientWidth,
            height: container.clientHeight,
            listTopAtZero: this.#list.getBoundingClientRect().top + scrollTop,
        };
    }

    #positionDragLayer(): void {
        const { layer, viewport } = this.#drag!;
        layer.style.left = `${viewport.left}px`;
        layer.style.top = `${viewport.top}px`;
        layer.style.width = `${viewport.width}px`;
        layer.style.height = `${viewport.height}px`;
    }

    // Measure stationary rows only after the preview changes or resizes. List-relative centers survive scrolling.
    #measureDragGeometry(listTop: number): NonNullable<DragState['geometry']> {
        const { target, pairedJump } = this.#drag!;
        const shown = ":not(.hs-challenge-lifted):not(.hs-challenge-placeholder)";
        const rows = this.#list.querySelectorAll<HTMLElement>(target.kind === 'step'
            ? `.hs-challenge-item${shown}, .hs-challenge-separator${shown}`
            : `.hs-challenge-item[data-index]${shown}`);
        const midpoints = Array.from(rows, row => {
            const rect = row.getBoundingClientRect();
            return rect.top + rect.height / 2 - listTop;
        });
        const slot = target.kind === 'step' ? stepSlot(this.#steps, this.#separatorIndex, target.index, pairedJump)
            : target.kind === 'separator' ? this.#separatorIndex
            : this.#steps.find(step => isIfJumpStep(step) && step.ifJump.id === target.ifId)?.ifJump?.ifJumpIndex ?? -1;
        return { midpoints, slot };
    }

    // Moves the dragged item to the place under the mouse; false when it is already there. place: the number of rows
    // above it (a step: every row, the others keeping their place; otherwise steps only)
    #dropAt(place: number): boolean {
        const target = this.#drag!.target;
        switch (target.kind) {
            case 'step': {
                const paired = this.#drag!.pairedJump;
                const step = this.#steps[target.index];
                this.#keepEditing(() => {
                    ({ steps: this.#steps, separatorIndex: this.#separatorIndex } = moveStep(this.#steps, this.#separatorIndex, target.index, place, paired));
                });
                target.index = this.#steps.indexOf(step);
                return true;
            }
            case 'jumpTarget': {
                const step = this.#steps.find(step => isIfJumpStep(step) && step.ifJump.id === target.ifId);
                if (!step?.ifJump || step.ifJump.ifJumpIndex === place) return false;
                step.ifJump.ifJumpIndex = place;
                return true;
            }
            case 'separator':
                if (place === this.#separatorIndex) return false;
                this.#separatorIndex = place;
                return true;
        }
    }

    // Hit-test the drop preview from cached coordinates. Floating rows move independently in mousemove.
    #followMouse(): void {
        const drag = this.#drag!;
        const listTop = drag.viewport.listTopAtZero - drag.scrollTop;
        const { midpoints, slot } = drag.geometry ??= this.#measureDragGeometry(listTop);
        const mouseY = drag.mouseY - listTop;
        const next = midpoints.findIndex(y => mouseY < y);
        const place = next < 0 ? midpoints.length : next;
        if (place !== slot && this.#dropAt(place)) this.#updateDragPreview();
    }

    #onDragMove = (e: MouseEvent): void => {
        const drag = this.#drag;
        if (!drag) return;
        drag.mouseX = e.clientX;
        drag.mouseY = e.clientY;
        this.#setPairedDrag(e.shiftKey);
        this.#moveLifted();
        this.#requestDragFrame();
    };

    #requestDragFrame(): void {
        const drag = this.#drag!;
        if (!drag.frame) drag.frame = requestAnimationFrame(this.#renderDragFrame);
    }

    #onDragViewportChange = (): void => {
        if (!this.#drag) return;
        this.#drag.viewportDirty = true;
        this.#requestDragFrame();
    };

    #onDragScroll = (e: Event): void => {
        const drag = this.#drag;
        if (!drag) return;
        if (e.target !== this.#listContainer) {
            if (e.target === document || (e.target instanceof Element && e.target.contains(this.#listContainer))) {
                this.#onDragViewportChange();
            }
            return;
        }
        drag.scrollTop = this.#listContainer.scrollTop;
        this.#requestDragFrame();
    };

    // Pixels per frame to scroll the list by (negative: up): faster as the mouse nears the list's edge, or goes past it
    #autoScrollSpeed(): number {
        const { viewport, mouseY } = this.#drag!;
        const depth = Math.max(viewport.top + AUTO_SCROLL_ZONE_PX - mouseY,
            mouseY - (viewport.top + viewport.height - AUTO_SCROLL_ZONE_PX));
        if (depth <= 0) return 0;
        const speed = Math.ceil(Math.min(1, depth / AUTO_SCROLL_ZONE_PX) * AUTO_SCROLL_MAX_PX_PER_FRAME);
        return mouseY < viewport.top + viewport.height / 2 ? -speed : speed;
    }

    // Coalesce pointer moves and auto-scroll into one update per frame.
    #renderDragFrame = (): void => {
        const drag = this.#drag;
        if (!drag) return;
        drag.frame = 0;
        if (drag.viewportDirty) {
            drag.scrollTop = this.#listContainer.scrollTop;
            drag.viewport = this.#measureDragViewport(drag.scrollTop);
            drag.viewportDirty = false;
            this.#positionDragLayer();
            this.#moveLifted();
        }
        const beforeScroll = drag.scrollTop;
        const speed = this.#autoScrollSpeed();
        if (speed) {
            this.#listContainer.scrollTop = beforeScroll + speed;
            drag.scrollTop = this.#listContainer.scrollTop;
        }
        this.#followMouse();
        if (beforeScroll !== drag.scrollTop) this.#requestDragFrame();
    };

    #clearDrag(): void {
        document.removeEventListener("mousemove", this.#onDragMove);
        document.removeEventListener("mouseup", this.#onDragEnd);
        document.removeEventListener("keydown", this.#onDragShift);
        document.removeEventListener("keyup", this.#onDragShift);
        document.removeEventListener("scroll", this.#onDragScroll, true);
        window.removeEventListener("resize", this.#onDragViewportChange);
        if (this.#drag) {
            cancelAnimationFrame(this.#drag.frame);
            this.#drag.layer.remove();
        }
        this.#drag = null;
        this.#list.classList.remove("hs-challenge-dragging-pair");
    }

    #onDragEnd = (e: MouseEvent): void => {
        const drag = this.#drag;
        if (!drag) return;
        // A fast drop can happen before the queued frame sees the last mouse position.
        if (drag.frame || drag.mouseX !== e.clientX || drag.mouseY !== e.clientY) {
            drag.mouseX = e.clientX;
            drag.mouseY = e.clientY;
            this.#followMouse();
        }
        this.#clearDrag();
        // One change per drag, if the steps differ at the end (a step dropped back in its place: none)
        if (canonicalJson(drag.before.steps) !== canonicalJson(this.#steps)) this.#saveForUndo(drag.before);
        this.#redrawList();
    };
}

/**
 * Opens the actions window on a phase's steps, which Save replaces (then calls onSaved). Returns the window at once,
 * while it opens.
 */
export function openAutosingChallengesModal(
    uiMod: HSUI,
    stratData: AutosingStrategyPhase["strat"],
    title: string,
    parentModalId: string,
    onSaved: () => void,
    position?: HSUIXY
): HSAutosingChallengeModal {
    const actionsWindow = new HSAutosingChallengeModal(uiMod, stratData, title, onSaved);
    void actionsWindow.open(parentModalId, position);
    return actionsWindow;
}
