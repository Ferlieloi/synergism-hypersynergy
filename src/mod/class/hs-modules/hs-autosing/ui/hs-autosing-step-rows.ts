import { Challenge, IF_JUMP_VALUE, IfJumpParams, IsJumpChallenge } from "../hs-autosing-types";

// The rows of the strategy editor's actions list, and moving a step among them (docs/features/autosing-editor.md)

export const isIfJumpStep = (step: Challenge): step is IsJumpChallenge => step.challengeNumber === IF_JUMP_VALUE && step.ifJump !== undefined;

export function jumpDestination(jump: IfJumpParams, index: number, stepCount: number): number {
    return Math.max(0, Math.min(stepCount, index + jump.ifJumpOffset!));
}

export function attachedJumps(steps: readonly Challenge[], from: number): Set<string> {
    return new Set(steps.flatMap((step, index) => isIfJumpStep(step) && (index === from || step.ifJump.ifJumpOffset === 0)
        ? [step.ifJump.id] : []));
}

// A step, an IF jump's "Jump here" row (drawn before the step the IF jumps to), or the "Add Here" separator
export type StepListRow =
    | { kind: 'step'; index: number }
    | { kind: 'target'; ifStep: IsJumpChallenge; ifIndex: number }
    | { kind: 'separator' };

// The list's rows, top to bottom: before each step the "Add Here" separator if new steps go there, then the "Jump
// here" rows that jump to it, in the order of their IFs; after the last step, the same for the end of the phase.
// During a drag, a target outside the list is drawn at the nearest end.
export function stepListRows(steps: readonly Challenge[], separatorIndex: number): StepListRow[] {
    const targets = new Map<number, StepListRow[]>();
    steps.forEach((step, ifIndex) => {
        if (!isIfJumpStep(step)) return;
        const index = jumpDestination(step.ifJump, ifIndex, steps.length);
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

function dragRows(steps: readonly Challenge[], separatorIndex: number, attached: ReadonlySet<string>): StepListRow[] {
    return stepListRows(steps, separatorIndex).filter(row => row.kind !== 'target' || !attached.has(row.ifStep.ifJump.id));
}

// The number of independent rows above a step; attached markers are part of their IF's slot.
export function stepSlot(steps: readonly Challenge[], separatorIndex: number, index: number, attached: ReadonlySet<string>): number {
    return dragRows(steps, separatorIndex, attached).findIndex(row => row.kind === 'step' && row.index === index);
}

// Move a step among the independent rows and recalculate those markers' offsets.
// The dragged IF and any existing self-loops keep their offsets for the whole drag.
export function moveStep(steps: readonly Challenge[], separatorIndex: number, from: number, slot: number,
    attached: ReadonlySet<string>): { steps: Challenge[]; separatorIndex: number } {
    const rows = dragRows(steps, separatorIndex, attached).filter(row => !(row.kind === 'step' && row.index === from));
    rows.splice(Math.max(0, Math.min(slot, rows.length)), 0, { kind: 'step', index: from });
    const moved: Challenge[] = [];
    const destinations = new Map<IfJumpParams, number>();
    let movedSeparator = separatorIndex;
    // A row's index is the number of steps above it: the step below it, once added
    for (const row of rows) {
        if (row.kind === 'step') moved.push(steps[row.index]);
        else if (row.kind === 'target') destinations.set(row.ifStep.ifJump, moved.length);
        else movedSeparator = moved.length;
    }
    for (const [index, { ifJump }] of moved.entries()) {
        if (!ifJump) continue;
        const destination = destinations.get(ifJump);
        if (destination !== undefined) ifJump.ifJumpOffset = destination - index;
    }
    return { steps: moved, separatorIndex: movedSeparator };
}
