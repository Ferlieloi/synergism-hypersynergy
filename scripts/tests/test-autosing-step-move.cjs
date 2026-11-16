const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const esbuild = require('esbuild');

// Dragging a step keeps the dragged IF and self-loops attached while independent rows stay in place.
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
    const { attachedJumps, jumpDestination, moveStep, stepSlot, stepListRows } = runtime.exports;
    const list = (...names) => names.map((name, index) => name.startsWith('IF>')
        ? { challengeNumber: 200, name, ifJump: { id: String(index), ifJumpOffset: Number(name.slice(3)) - index } }
        : { challengeNumber: 1, name });
    const NONE = Infinity;
    const label = (steps, step, index) => step.ifJump ? `IF>${jumpDestination(step.ifJump, index, steps.length)}` : step.name;
    const view = (steps, separator = NONE) => stepListRows(steps, separator).map(row => row.kind === 'separator' ? '|'
        : row.kind === 'target' ? `[${label(steps, row.ifStep, row.ifIndex)}@${row.ifIndex}]` : label(steps, steps[row.index], row.index)).join(' ');
    const move = (steps, from, slot, separator = NONE, attached = attachedJumps(steps, from)) =>
        moveStep(structuredClone(steps), separator, from, slot, attached);
    const movedView = (steps, from, slot, separator) => {
        const moved = move(steps, from, slot, separator);
        return view(moved.steps, moved.separatorIndex);
    };

    // The reported case: Set moves past the IFs; the existing self-loop stays attached.
    let steps = list('Before', 'Set', 'IF>2', 'IF>0', 'Exit');
    assert.equal(view(steps), '[IF>0@3] Before Set [IF>2@2] IF>2 IF>0 Exit');
    assert.equal(movedView(steps, 1, 4), '[IF>0@2] Before [IF>1@1] IF>1 IF>0 Set Exit');

    // An ordinary step can still land on either side of an independent marker.
    steps = list('A', 'B', 'C', 'IF>2');
    assert.equal(movedView(steps, 0, 1), 'B A [IF>2@3] C IF>2');
    assert.equal(movedView(steps, 0, 2), 'B [IF>1@3] A C IF>1');
    assert.equal(movedView(steps, 2, 0), 'C A B [IF>3@3] IF>3');
    assert.equal(movedView(list('IF>2', 'A', 'B'), 2, 0), 'B IF>3 A [IF>3@1]');
    assert.equal(movedView(list('A', 'B', 'IF>1', 'IF>1'), 0, 1), '[IF>0@2] A [IF>1@3] B IF>0 IF>1');

    // Dragging an IF carries its signed offset, including zero.
    assert.equal(movedView(list('A', 'IF>1', 'B'), 1, 2), 'A B [IF>2@2] IF>2');
    assert.equal(movedView(list('A', 'B', 'IF>0', 'C'), 2, 3), 'A [IF>1@3] B C IF>1');
    steps = move(list('A', 'IF>3', 'B'), 1, 2).steps;
    assert.equal(steps[2].ifJump.ifJumpOffset, 2, 'dragging past the boundary retains the offset until drop');
    assert.equal(view(steps), 'A B IF>3 [IF>3@2]');

    // Add Here stays in place and remains a drop slot on either side.
    steps = list('A', 'B', 'C');
    assert.equal(movedView(steps, 0, 2, 1), '| B A C');
    assert.equal(movedView(steps, 2, 1, 1), 'A C | B');
    assert.equal(movedView(steps, 2, 2, 1), 'A | C B');
    assert.equal(movedView(steps, 1, 3, 1), 'A | C B');

    // A temporarily created self-loop remains independent until the end of the drag.
    steps = list('A', 'B', 'IF>1', 'C');
    const attached = attachedJumps(steps, 1);
    const moved = move(steps, 1, 1, NONE, attached).steps;
    assert.equal(moved[2].ifJump.ifJumpOffset, 0);
    const restored = move(moved, 1, 2, NONE, attached).steps;
    assert.deepEqual(restored, steps);
    assert.equal(stepSlot(steps, NONE, 1, attached), 2);

    console.log('autosing step move tests passed');
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
