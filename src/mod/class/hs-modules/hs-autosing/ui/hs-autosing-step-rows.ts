import { Challenge, IF_JUMP_VALUE, IsJumpChallenge } from "../hs-autosing-types";

// The rows of the strategy editor's actions list, and moving a step among them (docs/features/autosing-editor.md)

export const isIfJumpStep = (step: Challenge): step is IsJumpChallenge => step.challengeNumber === IF_JUMP_VALUE && step.ifJump !== undefined;

// A step, or an IF jump's "Jump here" row (drawn before the step the IF jumps to)
export type StepListRow = { kind: 'step'; index: number } | { kind: 'target'; ifStep: IsJumpChallenge; ifIndex: number };

// The list's rows, top to bottom: before each step the "Jump here" rows that jump to it, in the order of their IFs,
// then those that jump to the end of the phase. A target outside the list has no row
export function stepListRows(steps: readonly Challenge[]): StepListRow[] {
    const targets = new Map<number, StepListRow[]>();
    steps.forEach((step, ifIndex) => {
        if (!isIfJumpStep(step)) return;
        const index = step.ifJump.ifJumpIndex;
        targets.set(index, [...(targets.get(index) ?? []), { kind: 'target', ifStep: step, ifIndex }]);
    });
    const rows: StepListRow[] = [];
    for (let index = 0; index <= steps.length; index++) {
        rows.push(...(targets.get(index) ?? []));
        if (index < steps.length) rows.push({ kind: 'step', index });
    }
    return rows;
}

// The number of rows above a step
export function stepSlot(steps: readonly Challenge[], index: number): number {
    return stepListRows(steps).findIndex(row => row.kind === 'step' && row.index === index);
}

// Moves steps[from] so that `slot` of the other rows are above it. Every other row keeps its place, "Jump here" rows
// included (also the dragged step's own one: it stays before the next step). Each IF's target becomes the index of
// the step below its "Jump here" row (the end of the phase: none). Changes the targets in place; returns the new list
export function moveStep(steps: readonly Challenge[], from: number, slot: number): Challenge[] {
    const rows = stepListRows(steps).filter(row => !(row.kind === 'step' && row.index === from));
    rows.splice(Math.max(0, Math.min(slot, rows.length)), 0, { kind: 'step', index: from });
    const moved: Challenge[] = [];
    const waiting: IsJumpChallenge[] = [];
    for (const row of rows) {
        if (row.kind === 'target') {
            waiting.push(row.ifStep);
            continue;
        }
        for (const ifStep of waiting) ifStep.ifJump.ifJumpIndex = moved.length;
        waiting.length = 0;
        moved.push(steps[row.index]);
    }
    for (const ifStep of waiting) ifStep.ifJump.ifJumpIndex = moved.length;
    return moved;
}
