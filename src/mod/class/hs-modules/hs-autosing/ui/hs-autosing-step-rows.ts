import { Challenge, IF_JUMP_VALUE, IsJumpChallenge } from "../hs-autosing-types";

// The rows of the strategy editor's actions list, and moving a step among them (docs/features/autosing-editor.md)

export const isIfJumpStep = (step: Challenge): step is IsJumpChallenge => step.challengeNumber === IF_JUMP_VALUE && step.ifJump !== undefined;

// A step, an IF jump's "Jump here" row (drawn before the step the IF jumps to), or the "Add Here" separator
export type StepListRow =
    | { kind: 'step'; index: number }
    | { kind: 'target'; ifStep: IsJumpChallenge; ifIndex: number }
    | { kind: 'separator' };

// The list's rows, top to bottom: before each step the "Add Here" separator if new steps go there, then the "Jump
// here" rows that jump to it, in the order of their IFs; after the last step, the same for the end of the phase.
// A target outside the list has no row
export function stepListRows(steps: readonly Challenge[], separatorIndex: number): StepListRow[] {
    const targets = new Map<number, StepListRow[]>();
    steps.forEach((step, ifIndex) => {
        if (!isIfJumpStep(step)) return;
        const index = step.ifJump.ifJumpIndex;
        targets.set(index, [...(targets.get(index) ?? []), { kind: 'target', ifStep: step, ifIndex }]);
    });
    const rows: StepListRow[] = [];
    for (let index = 0; index <= steps.length; index++) {
        if (Math.max(separatorIndex, 0) === index) rows.push({ kind: 'separator' });
        rows.push(...(targets.get(index) ?? []));
        if (index < steps.length) rows.push({ kind: 'step', index });
    }
    return rows;
}

// The number of rows above a step
export function stepSlot(steps: readonly Challenge[], separatorIndex: number, index: number): number {
    return stepListRows(steps, separatorIndex).findIndex(row => row.kind === 'step' && row.index === index);
}

// Moves steps[from] so that `slot` of the other rows are above it. Every other row keeps its place, the separator
// and "Jump here" rows included (also the dragged step's own one: it stays before the next step). Each IF's target,
// and the separator's index, become the index of the step below their row (none: the phase's length). Changes the
// targets in place
export function moveStep(steps: readonly Challenge[], separatorIndex: number, from: number, slot: number): { steps: Challenge[]; separatorIndex: number } {
    const rows = stepListRows(steps, separatorIndex).filter(row => !(row.kind === 'step' && row.index === from));
    rows.splice(Math.max(0, Math.min(slot, rows.length)), 0, { kind: 'step', index: from });
    const moved: Challenge[] = [];
    let movedSeparator = separatorIndex;
    // A row's index is the number of steps above it: the step below it, once added
    for (const row of rows) {
        if (row.kind === 'step') moved.push(steps[row.index]);
        else if (row.kind === 'target') row.ifStep.ifJump.ifJumpIndex = moved.length;
        else movedSeparator = moved.length;
    }
    return { steps: moved, separatorIndex: movedSeparator };
}
