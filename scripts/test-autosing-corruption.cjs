const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const esbuild = require('esbuild');

// Run the real phase/action executor, migration and corruption controls against a small game boundary.
// The test-only methods expose private entry points in memory; the shipped class has none of them.
async function main() {
    const root = path.resolve(__dirname, '..');
    const autosing = path.join(root, 'src/mod/class/hs-modules/hs-autosing/hs-autosing.ts');
    const stubs = {
        'hs-module': 'export class HSModule { constructor() { this.context = "Test"; } }',
        'hs-module-manager': 'export const HSModuleManager = { getModule() {} };',
        'hs-global': 'export const HSGlobal = { get exposedPlayer() { return globalThis.__corruptionTest.live ? globalThis.__corruptionTest.player : null; } };',
        'hs-logger': 'export const HSLogger = { debug() {}, log() {}, warn() {}, error() {} };',
        'hs-ui': 'export const HSUI = { Notify() {} };',
        'hs-settings': 'export const HSSettings = {};',
        'hs-gamedata-api': 'export class HSGameDataAPI {}',
        'hs-autosingModal': 'export class HSAutosingModal {}',
        'hs-autosingSettingsFixer': 'export class HSAutosingSettingsFixer {}',
        'hs-gamestate': 'export class HSGameState {} export class MainView {}',
        'hs-subtab-memory': 'export class HSSubtabMemory {}',
        'hs-game-dialogs': `export const HSGameDialogs = {
            isQueueIdle: () => !globalThis.__corruptionTest.confirmation,
            whenQueueIdle: () => { globalThis.__corruptionTest.dialogWaits++; return globalThis.__corruptionTest.confirmation; }
        };`,
        'hs-utils': `export const HSUtils = {
            sleepUntilElapsed: async () => { globalThis.__corruptionTest.beforeWait?.(); },
            waitForNextTack() { throw new Error('Corruption actions must not wait for a game tick'); }
        };`,
    };
    const bundled = await esbuild.build({
        stdin: { contents: `export { HSAutosing } from './src/mod/class/hs-modules/hs-autosing/hs-autosing';
            export { HSStrategyManager } from './src/mod/class/hs-modules/hs-autosing/hs-strategy-manager';
            export { SPECIAL_ACTION_BY_ID } from './src/mod/types/module-types/hs-autosing-types';`, resolveDir: root, loader: 'ts' },
        bundle: true, write: false, platform: 'node', format: 'cjs', define: { HS_DEV_BUILD: 'false' },
        plugins: [{ name: 'autosing-game-boundary', setup(build) {
            build.onResolve({ filter: /hs-[\w-]+$/ }, args => {
                const name = args.path.split('/').pop();
                if (stubs[name]) return { path: name, namespace: 'test' };
            });
            build.onLoad({ filter: /.*/, namespace: 'test' }, args => ({ contents: stubs[args.path], loader: 'ts' }));
            build.onLoad({ filter: /hs-autosing\.ts$/ }, () => ({
                contents: fs.readFileSync(autosing, 'utf8').replace('    init(): Promise<void> {', `
                    configureForTest(ascend: any, exit: any, action: any, progress: any) {
                        this.#autosingEnabled = true;
                        this.#corruptionManager = new HSAutosingCorruption();
                        this.#ascendBtn = ascend;
                        this.#exitAscBtn = exit;
                        this.#antSacrifice = action;
                        this.#exposedPlayer = HSGlobal.exposedPlayer;
                        this.#hasLivePlayer = !!this.#exposedPlayer;
                        this.#challengeProgressElements[2] = progress;
                    }
                    runPhaseForTest(phase: AutosingStrategyPhase) { return this.#executePhase(phase); }
                    cancelForTest() { this.#autosingEnabled = false; }
                    init(): Promise<void> {`),
                loader: 'ts',
            }));
        } }],
    });
    const runtime = new Module(path.join(root, 'autosing-test-runtime.cjs'), module);
    runtime.filename = path.join(root, 'autosing-test-runtime.cjs');
    runtime.paths = module.paths;
    runtime._compile(bundled.outputFiles[0].text, runtime.filename);
    const { HSAutosing, HSStrategyManager, SPECIAL_ACTION_BY_ID } = runtime.exports;
    const step = (challengeNumber, extra = {}) => ({
        challengeNumber, challengeCompletions: 0, challengeWaitTime: 0, challengeMaxTime: 0, ...extra,
    });
    const phase = steps => ({ startPhase: 'challenge10', endPhase: 'end', strat: steps });
    const originalDocument = globalThis.document;
    const originalState = globalThis.__corruptionTest;
    let scenarios = 0;
    try {
        const setup = ({ next = 5, used = 5, cap = 100, live = true, confirm = false, challenge = 0 } = {}) => {
            const state = globalThis.__corruptionTest = {
                player: { corruptions: { next, used }, currentChallenge: { ascension: challenge } },
                live, events: [], dialogWaits: 0, c15Coins: 42, savedC15Score: 0,
            };
            const progress = { textContent: challenge ? 'Challenge 15: 42' : '' };
            const input = {
                value: String(next),
                dispatchEvent(event) {
                    assert.equal(event.type, 'change');
                    state.player.corruptions.next = Math.min(cap, Math.max(0, Math.floor(Number(input.value))));
                    input.value = String(state.player.corruptions.next);
                    state.events.push(['select', state.player.corruptions.next]);
                },
            };
            globalThis.document = { getElementById: id => id === 'corruptionLevelInput' ? input : null };
            const apply = () => {
                state.player.corruptions.used = state.player.corruptions.next;
                state.c15Coins = 0;
                state.events.push(['ascend', state.player.corruptions.used]);
            };
            const ascend = {
                matches: () => true,
                click() {
                    if (!confirm) return apply();
                    state.confirmation = new Promise(resolve => { state.confirm = () => {
                        apply(); state.confirmation = undefined; resolve();
                    }; });
                },
            };
            const exit = {
                matches: () => true,
                click() {
                    if (!state.player.currentChallenge.ascension) return;
                    state.savedC15Score = state.c15Coins;
                    state.player.currentChallenge.ascension = 0;
                    progress.textContent = '';
                    ascend.click();
                },
            };
            const runner = new HSAutosing({});
            runner.configureForTest(ascend, exit, { click: () => state.events.push(['action', state.player.corruptions.used]) }, progress);
            return { runner, state };
        };

        // A migrated phase starts with its requested level, with exactly one ascension.
        const migrated = HSStrategyManager.normalizeCorruptions({ strategyName: 'legacy', strategy: [
            { startPhase: 'start', endPhase: 'challenge10', strat: [step(152)] },
            { ...phase([step(152)]), corruptionLevel: 20 },
        ] });
        let { runner, state } = setup();
        await runner.runPhaseForTest(migrated.strategy[1]);
        assert.deepEqual(state.events, [['select', 20], ['ascend', 20], ['action', 20]]);
        assert.equal(state.dialogWaits, 0);
        scenarios++;

        // A corruption change inside C15 exits it before resetting, preserving the score; the old Exit step is a no-op.
        for (const live of [true, false]) {
            ({ runner, state } = setup({ challenge: 15, live }));
            await runner.runPhaseForTest(phase([
                step(403, { corruptionLevel: 20 }), ...(live ? [step(103)] : []), step(152),
            ]));
            assert.deepEqual(state.events, [['select', 20], ['ascend', 20], ['action', 20]]);
            assert.equal(state.savedC15Score, 42);
            assert.equal(state.player.currentChallenge.ascension, 0);
            scenarios++;
        }

        // Selecting an already pending level must still apply it to the current ascension.
        ({ runner, state } = setup({ next: 20, used: 5 }));
        await runner.runPhaseForTest(phase([step(403, { corruptionLevel: 20 }), step(152)]));
        assert.deepEqual(state.events, [['ascend', 20], ['action', 20]]);
        scenarios++;

        // A set-level action in the middle of a phase resets before the following action.
        ({ runner, state } = setup());
        await runner.runPhaseForTest(phase([step(152), step(403, { corruptionLevel: 20 }), step(152)]));
        assert.deepEqual(state.events, [['ascend', 5], ['action', 5], ['select', 20], ['ascend', 20], ['action', 20]]);
        scenarios++;

        // The game's cap wins, on both the live-player and bookmarklet paths, including repeated phase passes.
        for (const live of [true, false]) {
            ({ runner, state } = setup({ cap: 12, live }));
            const capped = phase([step(403, { corruptionLevel: 20 }), step(152)]);
            await runner.runPhaseForTest(capped);
            await runner.runPhaseForTest(capped);
            assert.deepEqual(state.events, [
                ['select', 12], ['ascend', 12], ['action', 12],
                ['select', 12], ['ascend', 12], ['action', 12],
            ]);
            scenarios++;
        }

        // With an asynchronous game confirmation, no following action runs before the reset finishes.
        ({ runner, state } = setup({ confirm: true }));
        const pending = runner.runPhaseForTest(phase([step(403, { corruptionLevel: 20 }), step(152)]));
        assert.deepEqual(state.events, [['select', 20]]);
        assert.equal(state.dialogWaits, 1);
        state.confirm();
        await pending;
        assert.deepEqual(state.events, [['select', 20], ['ascend', 20], ['action', 20]]);
        scenarios++;

        // A stop during the leading step's wait must not select a level or ascend afterwards.
        ({ runner, state } = setup());
        state.beforeWait = () => runner.cancelForTest();
        await runner.runPhaseForTest(phase([step(403, { corruptionLevel: 20, challengeWaitBefore: 100 }), step(152)]));
        assert.deepEqual(state.events, []);
        scenarios++;

        // Retired action 404 migrates in both regular and AOAG phases, retaining targets, waits and IF indices.
        const old = { strategyName: 'old effective targets', strategy: [phase([
            step(404, { corruptionLevel: 20, challengeWaitBefore: 50, comment: 'target' }),
            step(200, { ifJump: { id: 'jump', ifJumpIndex: 0 } }),
        ])], aoagPhase: phase([step(404, { corruptionLevel: 50 })]) };
        const normalized = HSStrategyManager.normalizeCorruptions(old);
        assert.equal(normalized.strategy[0].strat[0].challengeNumber, 403);
        assert.equal(normalized.strategy[0].strat[0].corruptionLevel, 20);
        assert.equal(normalized.strategy[0].strat[0].challengeWaitBefore, 50);
        assert.equal(normalized.strategy[0].strat[0].comment, 'target');
        assert.equal(normalized.strategy[0].strat[1].ifJump.ifJumpIndex, 0);
        assert.equal(normalized.aoagPhase.strat[0].challengeNumber, 403);
        assert.equal(normalized.aoagPhase.strat[0].corruptionLevel, 50);
        assert.deepEqual(HSStrategyManager.normalizeCorruptions(normalized), normalized);
        assert.equal(old.strategy[0].strat[0].challengeNumber, 404, 'normalization must not mutate its input');
        assert.equal(SPECIAL_ACTION_BY_ID.has(404), false);
        scenarios++;

        const directory = path.join(root, 'src/mod/resource/json/strategies');
        for (const filename of fs.readdirSync(directory).filter(name => name.endsWith('.json') && name !== 'manifest.json')) {
            const strategy = JSON.parse(fs.readFileSync(path.join(directory, filename), 'utf8'));
            HSStrategyManager.validateStrategy(strategy);
            for (const entry of [...strategy.strategy, strategy.aoagPhase].filter(Boolean)) {
                assert.ok(entry.strat.every(action => action.challengeNumber !== 404), filename);
            }
            scenarios++;
        }
        console.log(`Passed ${scenarios} Autosing corruption scenarios.`);
    } finally {
        if (originalDocument === undefined) delete globalThis.document;
        else globalThis.document = originalDocument;
        if (originalState === undefined) delete globalThis.__corruptionTest;
        else globalThis.__corruptionTest = originalState;
    }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
