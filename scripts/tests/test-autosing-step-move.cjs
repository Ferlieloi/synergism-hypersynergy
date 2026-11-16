const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const esbuild = require('esbuild');

// Dragging a step in the strategy editor (docs/features/autosing-editor.md, "IF targets"): every "Jump here" row
// stays between the same rows, and each IF's target follows its row.
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
    // The rows as text: "IF>n" an IF with its current target, "[IF>n@i]" the "Jump here" row of the IF at index i
    const label = step => step.ifJump ? `IF>${step.ifJump.ifJumpIndex}` : step.name;
    const view = steps => stepListRows(steps).map(row => row.kind === 'target'
        ? `[${label(row.ifStep)}@${row.ifIndex}]` : label(steps[row.index])).join(' ');
    const targets = steps => steps.filter(step => step.ifJump).map(step => step.ifJump.ifJumpIndex);
    // Moves a copy (moveStep changes the targets in place)
    const move = (steps, from, slot) => moveStep(structuredClone(steps), from, slot);

    // The rows' order: "Jump here" rows before their step, in the order of their IFs, then the end-of-phase ones
    let steps = list('A', 'IF>0', 'B', 'IF>0', 'IF>4');
    assert.equal(view(steps), '[IF>0@1] [IF>0@3] A IF>0 B IF>0 [IF>4@4] IF>4');
    assert.equal(stepSlot(steps, 0), 2);
    assert.equal(stepSlot(steps, 4), 7);

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

    // A drag through several places and back leaves the list as it was
    steps = list('Before', 'Set', 'IF>2', 'IF>0', 'Exit');
    let current = structuredClone(steps);
    let index = 1;
    for (const slot of [3, 4, 5, 6, 5, 4, 3, 2, 1, 0, 1, 2]) {
        const step = current[index];
        current = moveStep(current, index, slot);
        index = current.indexOf(step);
        assert.equal(stepSlot(current, index), slot);
    }
    assert.deepEqual(current, steps);

    // Same place: no change
    assert.deepEqual(move(steps, 1, stepSlot(steps, 1)), steps);

    console.log('autosing step move tests passed');
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
