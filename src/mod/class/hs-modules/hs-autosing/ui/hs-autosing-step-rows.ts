import { Challenge, IF_JUMP_VALUE, IsJumpChallenge } from "../hs-autosing-types";

// The rows of the strategy editor's actions list, and moving a step among them (docs/features/autosing-editor.md)

export const isIfJumpStep = (step: Challenge): step is IsJumpChallenge => step.challengeNumber === IF_JUMP_VALUE && step.ifJump !== undefined;

// A step, an IF jump's "Jump here" row (drawn before the step the IF jumps to), or the "Add Here" separator
export type StepListRow =
    | { kind: 'step'; index: number }
    | { kind: 'target'; ifStep: IsJumpChallenge; ifIndex: number }
    | { kind: 'separator' };

/** The IF and the distance to its destination when a Shift-drag begins. */
export interface PairedJump {
    id: string;
    offset: number;
}

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

function dragRows(steps: readonly Challenge[], separatorIndex: number, paired?: PairedJump): StepListRow[] {
    const rows = stepListRows(steps, separatorIndex);
    return paired ? rows.filter(row => row.kind !== 'target' || row.ifStep.ifJump.id !== paired.id) : rows;
}

// The number of stationary rows above a step
export function stepSlot(steps: readonly Challenge[], separatorIndex: number, index: number, paired?: PairedJump): number {
    return dragRows(steps, separatorIndex, paired).findIndex(row => row.kind === 'step' && row.index === index);
}

// Stationary markers and the separator go before the next step. A Shift-dragged IF's marker keeps its original
// distance from that IF, limited by the start and end of the phase. Changes the targets in place.
export function moveStep(steps: readonly Challenge[], separatorIndex: number, from: number, slot: number,
    paired?: PairedJump): { steps: Challenge[]; separatorIndex: number } {
    const rows = dragRows(steps, separatorIndex, paired).filter(row => !(row.kind === 'step' && row.index === from));
    rows.splice(Math.max(0, Math.min(slot, rows.length)), 0, { kind: 'step', index: from });
    const moved: Challenge[] = [];
    let movedSeparator = separatorIndex;
    // A row's index is the number of steps above it: the step below it, once added
    for (const row of rows) {
        if (row.kind === 'step') moved.push(steps[row.index]);
        else if (row.kind === 'target') row.ifStep.ifJump.ifJumpIndex = moved.length;
        else movedSeparator = moved.length;
    }
    const jump = steps[from].ifJump;
    if (paired && jump?.id === paired.id) {
        jump.ifJumpIndex = Math.max(0, Math.min(moved.length, moved.indexOf(steps[from]) + paired.offset));
    }
    return { steps: moved, separatorIndex: movedSeparator };
}
