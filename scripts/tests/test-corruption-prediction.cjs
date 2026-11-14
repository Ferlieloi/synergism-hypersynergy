const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const esbuild = require('esbuild');
const { PRESETS, loadStubs } = require('../harness/lib/node-stubs.cjs');

async function main() {
    const root = path.resolve(__dirname, '../..');
    const base = './src/mod/class/hs-modules/hs-corruption-predictor/';
    const built = await esbuild.build({
        stdin: { contents: `export * from '${base}hs-corruption-prediction';
            export * from '${base}hs-corruption-prediction-model';
            export * from '${base}hs-corruption-coin-input';
            export { HSGameDataAPI } from './src/mod/class/hs-core/gds/hs-gamedata-api';`, resolveDir: root, loader: 'ts' },
        bundle: true, write: false, platform: 'node', format: 'cjs',
        define: { HS_DEV_BUILD: 'true', HS_BUILD_VERSION: '"test"' },
        banner: { js: PRESETS.gds.banner },
        plugins: [{ name: 'gds-stubs', setup: build => loadStubs(build, PRESETS.gds.stubs) }],
    });
    const runtime = new Module(path.join(root, 'corruption-test-runtime.cjs'), module);
    runtime.filename = path.join(root, 'corruption-test-runtime.cjs');
    runtime.paths = module.paths;
    globalThis.window ??= globalThis;
    runtime._compile(built.outputFiles[0].text, runtime.filename);
    const { cappedCoinRateLog10, challengeRequirementLog10, predictCorruptionLevel, findOptimalCorruption,
        buildCorruptionPredictionModel, HSGameDataAPI, buildCorruptionCoinInput } = runtime.exports;
    for (const tax of [0.1, 1, 3, 0.00001]) {
        const n = Math.floor(275 / (Math.log10(1.01) * tax)) - 1;
        const expected = n + 123 - Math.log10(1.01) * n * n / 550 * tax + 2 + Math.log10(40);
        assert.ok(Math.abs(cappedCoinRateLog10(tax, 123, 2) - expected) < Math.max(1, expected) * 1e-12);
    }
    const model = {
        maxLevel: 6, caps: [0, ...Array(10).fill(10)], c10Reduction: 0,
        reincarnationReduction: 1, transcensionReduction: 1, c9c10Scaling: 1,
        coinRateLog10: () => 2.5e9 * 9 + 100,
        hyperchallenge: level => 2 ** level,
        rewardLog10: (level, c) => level * Math.log10(1.1) + c[10] * Math.log10(1.5),
    };
    for (const c of [0, 24, 25, 99, 100]) {
        assert.equal(challengeRequirementLog10(model, 1, c, 0), 10 * (1 + Math.min(c, 99)) ** 2 * 10 ** (Math.max(0, c - 99) / 15));
        assert.equal(challengeRequirementLog10(model, 10, c, 2), 2.5e9 * 4 * (1 + Math.min(c, 24)) ** 2 * 10 ** (Math.max(0, c - 24) / 12));
    }
    const best = findOptimalCorruption(model);
    const brute = Array.from({ length: 7 }, (_, level) => predictCorruptionLevel(model, level)).sort((a, b) => b.scoreLog10 - a.scoreLog10 || a.level - b.level)[0];
    assert.deepEqual(best, brute);
    assert.ok(best.level < model.maxLevel, 'the result may be below the maximum level');
    assert.equal(findOptimalCorruption({ ...model, coinRateLog10: () => 0 }), null, 'no C10 means no payout');
    assert.equal(findOptimalCorruption({ ...model, rewardLog10: () => 0 }).level, 0, 'ties prefer the easier level');
    assert.throws(() => findOptimalCorruption({ ...model, c9c10Scaling: 0 }));
    const seen = [];
    predictCorruptionLevel({ ...model, coinRateLog10: (challenge, c) => { seen.push([challenge, ...c]); return model.coinRateLog10(); } }, 0);
    assert.ok(seen.some(row => row[0] === 10 && row[7] === 10), 'C6 bonuses carry into C10');
    assert.ok(seen.filter(row => row[0] === 10).length > 1, 'C10 gains update production before the next completion');
    assert.deepEqual(model.caps, [0, ...Array(10).fill(10)], 'search never writes its input caps');

    const reference = require('../fixtures/gds-reference.json');
    const data = structuredClone(reference.base);
    data.highestchallengecompletions = [...data.challengecompletions];
    const api = new HSGameDataAPI({ moduleName: 'HSGameDataAPI', context: 'HSGameDataAPI' });
    api._updateGameData(data);
    const before = JSON.stringify(data);
    const normal = { ...data, currentChallenge: { transcension: 0, reincarnation: 0, ascension: 0 } };
    const coinInput = buildCorruptionCoinInput(api, normal, 0);
    assert.ok(coinInput.taxExponentWithoutRunes > 0);
    assert.ok(Number.isFinite(coinInput.globalSpeedLog10WithoutRunesAndBrick));
    assert.equal(JSON.stringify(data), before, 'input export never mutates the source save');
    assert.throws(() => buildCorruptionPredictionModel(api, { ...data, currentChallenge: { ...data.currentChallenge, ascension: 15 } }), /Leave/);
    assert.equal(JSON.stringify(data), before, 'refused predictions leave the save intact');
    const actualModel = buildCorruptionPredictionModel(api, normal);
    const started = performance.now();
    const prediction = findOptimalCorruption(actualModel);
    assert.ok(prediction && prediction.level <= actualModel.maxLevel && prediction.completions[10] > 0);
    assert.equal(JSON.stringify(data), before, 'a complete search leaves the reference save intact');
    console.log(`Reference snapshot: level ${prediction.level}, C10 ${prediction.completions[10]}, ${(performance.now() - started).toFixed(1)}ms`);
    console.log('Corruption prediction checks passed');
}
main().then(() => process.exit(0)).catch(error => { console.error(error); process.exit(1); });
