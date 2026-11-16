const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const esbuild = require('esbuild');

// Dragging a step in the strategy editor (docs/features/autosing-editor.md, "IF targets", "Dragging"): every "Jump
// here" row and the "Add Here" separator stay between the same rows; each IF's target and the separator follow their row.
async function main() {
    const root = path.resolve(__dirname, '../..');
    const bundled = await esbuild.build({
        entryPoints: [path.join(root, 'src/mod/class/hs-modules/hs-autosing/ui/hs-autosing-step-rows.ts')],
        bundle: true, write: false, platform: 'node', format: 'cjs',
    });
    const filename = path.join(root, 'step-rows-test-runtime.cjs');
    const runtime = new Module(filename, module);
    runtime.filename = filename;
    runtime._compile(bundled.outputFiles[0].text, filename);
    const { moveStep, stepSlot, stepListRows } = runtime.exports;

    // A list from a compact text: "A" a step, "IF>n" an IF jumping before step index n
    const list = (...names) => names.map(name => name.startsWith('IF>')
        ? { challengeNumber: 200, name, ifJump: { id: name, ifJumpIndex: Number(name.slice(3)) } }
        : { challengeNumber: 1, name });
    // No "Add Here" row (it is always drawn in the editor): keeps the "Jump here" cases short
    const NONE = Infinity;
    // The rows as text: "IF>n" an IF with its current target, "[IF>n@i]" the "Jump here" row of the IF at index i,
    // "|" the separator
    const label = step => step.ifJump ? `IF>${step.ifJump.ifJumpIndex}` : step.name;
    const view = (steps, separator = NONE) => stepListRows(steps, separator).map(row => row.kind === 'separator' ? '|'
        : row.kind === 'target' ? `[${label(row.ifStep)}@${row.ifIndex}]` : label(steps[row.index])).join(' ');
    const targets = steps => steps.filter(step => step.ifJump).map(step => step.ifJump.ifJumpIndex);
    // Moves a copy (moveStep changes the targets in place); the new list
    const move = (steps, from, slot) => moveStep(structuredClone(steps), NONE, from, slot).steps;
    // The same with a separator: the rows as text
    const moveView = (steps, separator, from, slot) => {
        const moved = moveStep(structuredClone(steps), separator, from, slot);
        return view(moved.steps, moved.separatorIndex);
    };
    const slotOf = (steps, index) => stepSlot(steps, NONE, index);

    // The rows' order: "Jump here" rows before their step, in the order of their IFs, then the end-of-phase ones
    let steps = list('A', 'IF>0', 'B', 'IF>0', 'IF>4');
    assert.equal(view(steps), '[IF>0@1] [IF>0@3] A IF>0 B IF>0 [IF>4@4] IF>4');
    assert.equal(slotOf(steps, 0), 2);
    assert.equal(slotOf(steps, 4), 7);

    // The reported case: Set corruption (1) dragged below the second IF; the self-loop IF stays a self-loop
    steps = list('Before', 'Set', 'IF>2', 'IF>0', 'Exit');
    assert.equal(view(steps), '[IF>0@3] Before Set [IF>2@2] IF>2 IF>0 Exit');
    let moved = move(steps, 1, 5);
    assert.deepEqual(moved.map(s => s.name), ['Before', 'IF>2', 'IF>0', 'Set', 'Exit']);
    assert.deepEqual(targets(moved), [1, 0]);
    assert.equal(view(moved), '[IF>0@2] Before [IF>1@1] IF>1 IF>0 Set Exit');

    // Dropped just above or just below a "Jump here" row: the mouse decides
    steps = list('A', 'B', 'C', 'IF>2');
    assert.equal(view(steps), 'A B [IF>2@3] C IF>2');
    moved = move(steps, 0, 1);
    assert.equal(view(moved), 'B A [IF>2@3] C IF>2');
    assert.deepEqual(targets(moved), [2]);
    moved = move(steps, 0, 2);
    assert.equal(view(moved), 'B [IF>1@3] A C IF>1');
    assert.deepEqual(targets(moved), [1]);

    // The step below a "Jump here" row dragged away: the row stays, before the next step
    moved = move(steps, 2, 0);
    assert.equal(view(moved), 'C A B [IF>3@3] IF>3');
    // ...or at the end of the phase when there is none
    steps = list('IF>2', 'A', 'B');
    moved = move(steps, 2, 0);
    assert.equal(view(moved), 'B IF>3 A [IF>3@1]');
    assert.deepEqual(targets(moved), [3]);

    // An end-of-phase row: a step dropped below it becomes its target
    steps = list('A', 'IF>3', 'B');
    assert.equal(view(steps), 'A IF>3 B [IF>3@1]');
    moved = move(steps, 0, 3);
    assert.equal(view(moved), 'IF>2 B [IF>2@0] A');
    assert.deepEqual(targets(moved), [2]);
    moved = move(steps, 0, 2);
    assert.deepEqual(targets(moved), [3]);

    // Several rows before one step: dropped between them
    steps = list('A', 'B', 'IF>1', 'IF>1');
    assert.equal(view(steps), 'A [IF>1@2] [IF>1@3] B IF>1 IF>1');
    moved = move(steps, 0, 1);
    assert.equal(view(moved), '[IF>0@2] A [IF>1@3] B IF>0 IF>1');
    assert.deepEqual(targets(moved), [0, 1]);

    // An IF dragged: its own row stays, so a self-loop dragged down becomes a longer loop
    steps = list('A', 'IF>1', 'B');
    moved = move(steps, 1, 3);
    assert.equal(view(moved), 'A [IF>1@2] B IF>1');
    // Dragged above its own row, it jumps forward over nothing
    moved = move(steps, 1, 1);
    assert.equal(view(moved), 'A IF>2 [IF>2@1] B');

    // Shift-drag carries the IF's marker and its offset, including a self-loop.
    let paired = { id: steps[1].ifJump.id, offset: 0 };
    moved = moveStep(structuredClone(steps), NONE, 1, 2, paired).steps;
    assert.equal(view(moved), 'A B [IF>2@2] IF>2');
    assert.equal(stepSlot(moved, NONE, 2, paired), 2);

    // Shift-drag still leaves other markers and Add Here in their drop slots.
    steps = list('A', 'IF>0', 'B', 'IF>2', 'C');
    paired = { id: steps[1].ifJump.id, offset: -1 };
    const shifted = moveStep(structuredClone(steps), 2, 1, 6, paired);
    assert.equal(view(shifted.steps, shifted.separatorIndex), 'A | [IF>1@2] B IF>1 [IF>3@4] C IF>3');

    // Moving back from a clamped destination restores the original distance during the same drag.
    steps = list('A', 'IF>3', 'B');
    paired = { id: steps[1].ifJump.id, offset: 2 };
    moved = moveStep(structuredClone(steps), NONE, 1, 2, paired).steps;
    assert.equal(view(moved), 'A B IF>3 [IF>3@2]');
    assert.deepEqual(moveStep(moved, NONE, 2, 1, paired).steps, steps);

    // "Add Here": drawn above the "Jump here" rows of its place, at the top for an index at or below 0
    steps = list('A', 'IF>0', 'IF>2');
    assert.equal(view(steps, 0), '| [IF>0@1] A IF>0 [IF>2@2] IF>2');
    assert.equal(view(steps, -1), '| [IF>0@1] A IF>0 [IF>2@2] IF>2');
    assert.equal(view(steps, 2), '[IF>0@1] A IF>0 | [IF>2@2] IF>2');
    assert.equal(view(steps, 3), '[IF>0@1] A IF>0 [IF>2@2] IF>2 |');

    // A step dragged across "Add Here" leaves it in place, and lands above or below it by the mouse
    steps = list('A', 'B', 'C');
    assert.equal(view(steps, 1), 'A | B C');
    assert.equal(moveView(steps, 1, 0, 2), '| B A C');
    assert.equal(moveView(steps, 1, 2, 1), 'A C | B');
    assert.equal(moveView(steps, 1, 2, 2), 'A | C B');
    // The step below it dragged away: it stays, before the next step (or at the end)
    assert.equal(moveView(steps, 1, 1, 3), 'A | C B');
    assert.equal(moveView(steps, 2, 2, 0), 'C A B |');

    // A drag through several places and back leaves the list as it was
    steps = list('Before', 'Set', 'IF>2', 'IF>0', 'Exit');
    const separator = 3;
    assert.equal(view(steps, separator), '[IF>0@3] Before Set [IF>2@2] IF>2 | IF>0 Exit');
    let current = { steps: structuredClone(steps), separatorIndex: separator };
    let index = 1;
    for (const slot of [3, 4, 5, 6, 7, 6, 5, 4, 3, 2, 1, 0, 1, 2]) {
        const step = current.steps[index];
        current = moveStep(current.steps, current.separatorIndex, index, slot);
        index = current.steps.indexOf(step);
        assert.equal(stepSlot(current.steps, current.separatorIndex, index), slot);
    }
    assert.deepEqual(current, { steps, separatorIndex: separator });

    // Same place: no change
    assert.deepEqual(moveStep(structuredClone(steps), separator, 1, stepSlot(steps, separator, 1)), { steps, separatorIndex: separator });

    console.log('autosing step move tests passed');
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
