const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const vm = require('node:vm');
const esbuild = require('esbuild');
const Decimal = require('break_infinity.js');
const { PRESETS, loadStubs } = require('../harness/lib/node-stubs.cjs');
const corruptionWorkerPlugin = require('../corruption-worker-plugin.cjs');

async function checkWorker(root, input, expected, capScore, oneCap) {
    const built = await esbuild.build({
        absWorkingDir: root,
        stdin: { contents: "import source from 'hs-corruption-worker-source'; output.source = source;" },
        bundle: true, write: false, platform: 'browser',
        plugins: [corruptionWorkerPlugin({ minify: true })],
    });
    const output = {};
    vm.runInNewContext(built.outputFiles[0].text, { output });
    let response;
    const self = { postMessage: message => { response = structuredClone(message); } };
    // MessageChannel initializes when GDS loads HSUtils. Calculations never use either port.
    vm.runInNewContext(output.source, { self, console, MessageChannel: class { port1 = {}; port2 = {}; } });
    const send = data => {
        self.onmessage({ data: structuredClone(data) });
        return response;
    };
    assert.match(send({ phase: 'detailed', levels: [expected.level] }).error, /not started/);
    assert.equal(send({ phase: 'prepare', input, includeBounds: true }).capScores[expected.level], capScore);
    assert.equal(send({ phase: 'scan', levels: [0] }).results[0].scoreLog10, -Infinity);
    assert.deepEqual(send({ phase: 'detailed', levels: [expected.level] }).results, [expected]);
    const prepared = send({ phase: 'prepare', input: oneCap.input, includeBounds: true });
    assert.equal(prepared.capScores[0], oneCap.capScore, 'the worker bounds payout with C8’s five starting completions');
    assert.equal(prepared.observed.completions[8], 5);
    const simulated = send({ phase: 'scan', levels: [0] }).results[0];
    assert.equal(simulated.completions[8], 5, 'a fast sweep keeps the native above-cap grant');
}

async function checkAdaptiveScan(scan) {
    const max = 141;
    const capScores = Array.from({ length: max + 1 }, (_, level) => level);
    const makeResult = (level, scoreLog10, c10) => ({ level, scoreLog10, completions: [...Array(10).fill(0), c10] });
    const fixture = capScores.map(level => makeResult(level, level < 50 ? level - Math.max(0, level - 42) * 2 : -Infinity, +(level < 50)));
    async function run(rows, bounds = capScores, observed) {
        const seen = new Set();
        const ranked = await scan(rows.length - 1, bounds, observed, async levels => levels.map(level => {
            assert.ok(!seen.has(level), `Level ${level} was searched twice`);
            seen.add(level);
            return rows[level];
        }));
        return { best: ranked.slice(0, 3).map(row => row.level), seen };
    }
    const ordinary = await run(fixture);
    assert.deepEqual(ordinary.best, [42, 41, 43], 'a tie prefers the lower level');
    assert.ok(ordinary.seen.size < 40, 'both losing tails can be pruned');
    const observed = { ...makeResult(135, 110, 1), observed: true };
    assert.deepEqual((await run(fixture, capScores, observed)).best, [135, 42, 41],
        'an observed run beyond the simulated C10 frontier can win');

    const recovery = [...fixture];
    recovery[53] = makeResult(53, 20, 1);
    recovery[121] = makeResult(121, 120, 1);
    assert.deepEqual((await run(recovery)).best, [121, 42, 41],
        'C10 returning in the boundary audit keeps the upper range in play');

    const locked = fixture.map(row => row.level < 60 ? { ...row, scoreLog10: -Infinity } : row);
    locked[121] = recovery[121];
    assert.deepEqual((await run(locked, capScores.map(level => level < 60 ? -Infinity : level))).best, [121],
        'an empty shortlist triggers a wider search for the chosen resource');
    const small = await run(fixture.slice(0, 8), capScores.slice(0, 8));
    assert.equal(small.seen.size, 8, 'small ranges are scanned in full');
}

async function main() {
    const root = path.resolve(__dirname, '../..');
    const base = './src/mod/class/hs-modules/hs-corruption-predictor/';
    const built = await esbuild.build({
        stdin: { contents: `export * from '${base}hs-corruption-prediction';
            export * from '${base}hs-corruption-adaptive-scan';
            export * from '${base}hs-corruption-prediction-model';
            export * from '${base}hs-corruption-coin-input';
            export * from '${base}hs-corruption-snapshot';
            export * from '${base}hs-corruption-production';
            export * from '${base}hs-corruption-growth';
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
        buildCorruptionPredictionModel, corruptionChallengeCaps, canEarnCorruptionTarget, corruptionMaxLevel, CORRUPTION_TARGET_ORDER,
        scanCorruptionAdaptively, corruptionCompletionCeilings,
        HSGameDataAPI, buildCorruptionCoinInput,
        snapshotCorruptionData, projectCorruptionTributes, taxedProductionLog10, affordableProductionBuildings, acceleratorCostCurve, acceleratorBoostCostCurve,
        addProductionLogs, createCorruptionProductionRun, createCorruptionGrowth, effectiveFreeProduction } = runtime.exports;
    for (const tax of [0.1, 1, 3, 0.00001]) {
        const n = Math.floor(275 / (Math.log10(1.01) * tax)) - 1;
        const expected = n + 123 - Math.log10(1.01) * n * n / 550 * tax + 2 + Math.log10(40);
        assert.ok(Math.abs(cappedCoinRateLog10(tax, 123, 2) - expected) < Math.max(1, expected) * 1e-12);
    }
    const constantProduction = (rate, seen = [], visits = []) => () => {
        let challenge = 0, amount = -Infinity, visit;
        return {
            enter(next) { challenge = next; amount = -Infinity; visit = {challenge:next, seconds:0}; visits.push(visit); },
            advance(seconds, c) {
                if (!visit) this.enter(0);
                seen.push([challenge, ...c]);
                visit.seconds += seconds;
                amount = addProductionLogs(amount, rate + Math.log10(seconds));
            },
            amount() { return amount; },
        };
    };
    const model = {
        maxLevel: 6, caps: [0, ...Array(10).fill(10)], c10Reduction: 0,
        reincarnationReduction: 1, transcensionReduction: 1, c9c10Scaling: 1,
        createProductionRun: constantProduction(2.5e9 * 9 + 100),
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
    assert.equal(findOptimalCorruption({ ...model, createProductionRun: constantProduction(0) }), null, 'no C10 means no payout');
    const measured = [0, ...Array(10).fill(10)];
    assert.deepEqual(findOptimalCorruption({
        ...model, observed: { level: 6, completions: measured }, createProductionRun: constantProduction(0),
    }), { level: 6, completions: measured, scoreLog10: model.rewardLog10(6, measured), observed: true },
    'a completed run can outrank a lower simulated yield at the same level');
    assert.equal(findOptimalCorruption({ ...model, rewardLog10: () => 0 }).level, 0, 'ties prefer the easier level');
    assert.throws(() => findOptimalCorruption({ ...model, c9c10Scaling: 0 }));
    const shortlistModel = {
        ...model, caps: [0, ...Array(9).fill(0), 2], hyperchallenge: () => 1, rewardLog10: level => level,
        createProductionRun: level => constantProduction(level <= 3 ? 1e10 + 100 : 0)(),
        createDetailedProductionRun: level => constantProduction(level === 4 ? 1e10 + 100 : 0)(),
    };
    assert.equal(predictCorruptionLevel(shortlistModel, 4).completions[10], 0);
    assert.equal(findOptimalCorruption(shortlistModel).level, 4, 'the detailed pass can rescue a neighbor screened out on C10');
    assert.equal(findOptimalCorruption({ ...shortlistModel, createDetailedProductionRun: constantProduction(0) }).level, 3,
        'a detailed pass with no usable payout falls back to the first scan');
    assert.equal(findOptimalCorruption({
        ...shortlistModel, rewardLog10: () => 1, createDetailedProductionRun: constantProduction(1e10 + 100),
    }).level, 0, 'the lower level also wins a detailed tie');
    const seen = [];
    predictCorruptionLevel({ ...model, createProductionRun: constantProduction(2.5e9 * 9 + 100, seen) }, 0);
    assert.ok(seen.some(row => row[0] === 10 && row[7] === 10), 'C6 bonuses carry into C10');
    assert.ok(seen.filter(row => row[0] === 10).length > 1, 'C10 gains update production before the next completion');
    assert.deepEqual(model.caps, [0, ...Array(10).fill(10)], 'search never writes its input caps');
    const omegaTicks = [];
    predictCorruptionLevel({
        ...model, singleCompletionPerTick: true, createProductionRun: constantProduction(1e20, omegaTicks),
    }, 0, 2);
    assert.deepEqual(omegaTicks.filter(row => row[0] === 1).slice(0, 6).map(row => row[2]), [0, 0, 1, 1, 2, 2],
        'Taxman’s Omega rule grants one completion per game tick, even at finer simulation resolution');

    // At 1e9 coins/s C1 needs 10 seconds: none of the three short visits
    // completes it, while the final long visit does. Other challenges are capped.
    const visits = [];
    const fourPass = predictCorruptionLevel({ ...model,
        caps: [0, 1, ...Array(9).fill(0)],
        createProductionRun: constantProduction(9, [], visits),
    }, 0);
    const attempts = visits.filter(visit => visit.challenge === 1).map(visit => visit.seconds);
    assert.deepEqual(attempts.slice(0, 3), [0.5, 0.5, 0.5], 'three short sweeps precede the long sweep');
    assert.ok(attempts[3] >= 10 - 1e-9 && attempts[3] <= 10.25, 'the final visit exits when the challenge caps');
    assert.ok(Math.abs(visits.reduce((seconds, visit) => seconds + visit.seconds, 0) - 219) < 1e-9,
        'all time is preserved, including the remainder of capped visits and gaps');
    assert.equal(fourPass.completions[1], 1);

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
    assert.throws(()=>buildCorruptionPredictionModel(api, normal), /precision/, 'serialized Infinity is not silently treated as a smaller exponent');
    assert.throws(() => buildCorruptionPredictionModel(api, {
        ...normal, ascendShards: snapshotCorruptionData({ ascendShards: new Decimal('Infinity') }).ascendShards,
    }), /precision/, 'the game can revive serialized Infinity as a finite-looking sentinel');
    // The GDS fixture contains a serialized Infinity. Use an explicit synthetic finite
    // Decimal for integration testing; this is not a recovered player measurement.
    const finite = {...normal, ascendShards: {mantissa:1, exponent:1e18}};
    const finiteAPI = api.createCalculationSnapshot(finite);
    const actualModel = buildCorruptionPredictionModel(finiteAPI, finite);
    const inExalt = key => {
        const exalt = structuredClone(finite);
        exalt.insideSingularityChallenge = true;
        for (const status of Object.values(exalt.singularityChallenges)) status.enabled = false;
        exalt.singularityChallenges[key].enabled = true;
        return exalt;
    };
    const oneCapData = inExalt('oneChallengeCap');
    oneCapData.challengecompletions[8] = 5;
    oneCapData.challengecompletions[10] = 1;
    const oneCapAPI = finiteAPI.createCalculationSnapshot(oneCapData);
    const oneCapModel = buildCorruptionPredictionModel(oneCapAPI, oneCapData, 'cubes');
    assert.deepEqual(oneCapModel.caps, [0, ...Array(10).fill(1)]);
    assert.equal(oneCapModel.startingCompletions[8], 5);
    assert.equal(oneCapModel.observed.completions[8], 5);
    assert.equal(corruptionCompletionCeilings(oneCapModel.caps, oneCapModel.startingCompletions)[8], 5);
    const noQuarkData = inExalt('noQuarkUpgrades');
    noQuarkData.shopUpgrades = { ...noQuarkData.shopUpgrades, instantChallenge: 1, instantChallenge2: 1, challengeExtension: 5 };
    noQuarkData.goldenQuarkUpgrades = {
        ...noQuarkData.goldenQuarkUpgrades, halfMind: { goldenQuarksInvested: 1.66e12, freeLevel: 0 },
    };
    const noQuarkAPI = finiteAPI.createCalculationSnapshot(noQuarkData);
    assert.equal(noQuarkAPI.quarkShop.getShopUpgradeEffects('instantChallenge2', 'unlocked'), true);
    assert.equal(noQuarkAPI.quarkShop.getShopLevel('challengeExtension'), 0);
    assert.equal(noQuarkAPI.goldenQuark.getGQUpgradeEffect('halfMind', 'unlocked'), 1);
    const noQuarkModel = buildCorruptionPredictionModel(noQuarkAPI, noQuarkData, 'cubes');
    assert.equal(noQuarkModel.retainTranscensionCompletions, true);
    assert.equal(noQuarkModel.caps[10], actualModel.caps[10] - 10);
    for (const key of Object.keys(finite.singularityChallenges)) {
        const exalt = inExalt(key);
        const exaltAPI = api.createCalculationSnapshot(exalt);
        const model = buildCorruptionPredictionModel(exaltAPI, exalt, 'cubes');
        assert.ok(Number.isFinite(model.rewardLog10(0, model.caps)), key);
        const detailed = model.createDetailedProductionRun(0);
        detailed.enter(10);
        detailed.advance(0.025, model.startingCompletions);
        assert.ok(!Number.isNaN(detailed.amount(10)), key + ' detailed startup');
        exalt.challengecompletions[11] = 0;
        assert.throws(() => buildCorruptionPredictionModel(exaltAPI, exalt, 'cubes'), /Complete Challenge 11/, key);
    }
    const taxman = inExalt('taxmanLastStand');
    taxman.singularityChallenges.taxmanLastStand.completions = 8;
    assert.equal(buildCorruptionPredictionModel(api.createCalculationSnapshot(taxman), taxman, 'cubes').singleCompletionPerTick, true);
    const limited = inExalt('limitedAscensions');
    limited.singularityChallenges.limitedAscensions.completions = 3;
    limited.ascensionCount = 19;
    assert.equal(api.createCalculationSnapshot(limited).calculateLimitedAscensionsDebuff(), 1);
    limited.ascensionCount++;
    assert.equal(api.createCalculationSnapshot(limited).calculateLimitedAscensionsDebuff(), 2);
    function growthSample(autobuy, obtainium = '0', blessingEXP = '0', oneMind = false) {
        const input = structuredClone(finite);
        input.autoSacrificeToggle = autobuy;
        input.obtainium = obtainium;
        input.blessingEXP = ['0', '0', '0', '0', blessingEXP];
        input.goldenQuarkUpgrades = {
            ...input.goldenQuarkUpgrades, oneMind: { goldenQuarksInvested: oneMind ? 1.66e13 : 0, freeLevel: 0 },
        };
        input.cubeUpgrades[20] = 1;
        input.cubeUpgrades[48] = 1;
        input.ants.toggles.autobuyUpgrades = autobuy;
        input.ants.toggles.maxBuyUpgrades = true;
        input.ants.toggles.autoSacrificeEnabled = false;
        const original = JSON.stringify(input);
        const completions = Array(11).fill(0);
        const upgrades = Array(126).fill(0);
        let sampled;
        const growth = createCorruptionGrowth(api.createCalculationSnapshot(input), input, 0, (context, stage) => {
            sampled = {
                rune: stage.runeEXP[0].log10(),
                antSpeedUpgrade: stage.ants.upgrades[0],
                crumbs: stage.ants.crumbs.log10(),
                producedCrumbs: stage.ants.crumbsThisSacrifice.log10(),
                ascensionTime: stage.ascensionCounter,
            };
            return { globalSpeedLog10: 3, taxExponent: 1 };
        });
        growth.state(0, completions, upgrades);
        const reset = sampled;
        growth.advance(0.5, 0, completions, upgrades, 100, 3, 3);
        growth.awardReset(0, completions, upgrades, 100);
        growth.advance(1, 0, completions, upgrades, 100, 3, 3);
        growth.state(0, completions, upgrades);
        assert.equal(JSON.stringify(input), original, 'each detailed candidate owns its simulated player data');
        return { reset, after: sampled };
    }
    const automatedGrowth = growthSample(true);
    assert.equal(automatedGrowth.reset.antSpeedUpgrade, 25, 'the next ascension starts with its ant speed milestone');
    assert.equal(automatedGrowth.reset.crumbs, 100, 'the S20 ascension grant is 1e100 crumbs');
    assert.equal(automatedGrowth.reset.producedCrumbs, 0, 'the grant does not count toward the sacrifice threshold');
    assert.ok(automatedGrowth.after.rune > automatedGrowth.reset.rune, 'offering autobuy rebuilds rune EXP');
    assert.ok(automatedGrowth.after.antSpeedUpgrade > automatedGrowth.reset.antSpeedUpgrade, 'crumbs rebuild ant upgrades');
    const manualGrowth = growthSample(false);
    assert.equal(manualGrowth.after.rune, manualGrowth.reset.rune, 'the detailed run respects disabled rune autobuying');
    assert.equal(manualGrowth.after.antSpeedUpgrade, manualGrowth.reset.antSpeedUpgrade, 'the detailed run respects disabled ant autobuying');
    assert.equal(growthSample(false, '0', '0', true).after.ascensionTime, 1.5e6,
        'One Mind advances the rune EXP clock by one million ascension seconds per real second');
    const blessedGrowth = growthSample(false, '1e100', '1e1000');
    const noObtainiumGrowth = growthSample(false, '0', '1e1000');
    assert.equal(growthSample(false, '1e100').after.producedCrumbs, manualGrowth.after.producedCrumbs);
    assert.ok(blessedGrowth.after.producedCrumbs > noObtainiumGrowth.after.producedCrumbs,
        'the Superior Intellect blessing converts Obtainium into ant production');
    const targetData = {
        ...finite, challenge15Exponent: 0, highestchallengecompletions: [...finite.highestchallengecompletions],
        corruptions: { ...finite.corruptions, highestCleared: 4 },
    };
    targetData.highestchallengecompletions[13] = 0;
    targetData.highestchallengecompletions[14] = 0;
    const eligibleTargets = () => CORRUPTION_TARGET_ORDER.filter(target =>
        canEarnCorruptionTarget(api.createCalculationSnapshot(targetData), targetData, target, corruptionMaxLevel(targetData)));
    assert.deepEqual(eligibleTargets(), ['cubes', 'tesseracts'], 'C11 alone makes tesseracts the highest eligible objective');
    targetData.highestchallengecompletions[13] = 1;
    targetData.highestchallengecompletions[14] = 1;
    assert.equal(eligibleTargets().at(-1), 'hypercubes', 'platonic cubes need an allowed level of at least 11');
    targetData.corruptions.highestCleared = 18;
    targetData.challenge15Exponent = 1e15;
    assert.equal(eligibleTargets().at(-1), 'hepteracts', 'hepteracts require the C15 reward and an allowed level of at least 20');
    assert.deepEqual(corruptionChallengeCaps(api, data).slice(6), [150,150,150,150,150], 'all three GQ extensions contribute their missing 20 completions');
    const huge = { ...finite, ascendShards: Decimal.fromMantissaExponent_noNormalize(2, 1e90),
        nested: [{value: Decimal.fromMantissaExponent_noNormalize(3,1e100)}] };
    assert.equal(JSON.parse(JSON.stringify(huge)).ascendShards, 'Infinity');
    const preserved = snapshotCorruptionData(huge);
    assert.deepEqual(preserved.ascendShards, {mantissa:2,exponent:1e90});
    assert.deepEqual(preserved.nested[0].value, {mantissa:3,exponent:1e100});
    preserved.nested[0].value.exponent=1;
    assert.equal(huge.nested[0].value.exponent,1e100,'the cloned Decimal is isolated');

    const tributeInput = snapshotCorruptionData({
        ...data, wowCubes: { valueOf: () => 20 }, autoOpenCubes: true, openCubes: 50,
        autoOpenTesseracts: true, openTesseracts: 50, tesseractAutoBuyerToggle: false, wowTesseracts: 20,
        autoOpenHypercubes: false, autoOpenPlatonicsCubes: false,
        cubeBlessings: { accelerator: 0 }, tesseractBlessings: { accelerator: 0 },
        researches: Array(201).fill(0), cubeUpgrades: Array(81).fill(0),
    });
    tributeInput.researches[153] = 1;
    const withTributes = projectCorruptionTributes(tributeInput, {
        wowCubes: 180, wowTesseracts: 20, wowHypercubes: 0, wowPlatonicCubes: 0,
    });
    assert.equal(withTributes.tesseractBlessings.accelerator, 4, 'automatic opening uses the balance plus the payout');
    assert.equal(withTributes.cubeBlessings.accelerator, 68, 'opened tesseracts also grant cube tributes');
    assert.equal(tributeInput.cubeBlessings.accelerator, 0, 'projection leaves the input untouched');
    const taxedTributes = { ...tributeInput, singularityChallenges: taxman.singularityChallenges };
    const withoutPenalty = 68;
    const projected = projectCorruptionTributes(taxedTributes, {
        wowCubes: 180, wowTesseracts: 20, wowHypercubes: 0, wowPlatonicCubes: 0,
    });
    assert.ok(Math.abs(projected.cubeBlessings.accelerator
        - withoutPenalty / (1 + Math.log1p(340)) ** 3) < 1e-12,
        'Taxman reduces cube tributes after research and conversions');
    assert.equal(projected.tesseractBlessings.accelerator, 4, 'the tribute penalty is specific to opening Cubes');

    for (const tax of [0.1,1,0.0001]) for (const gross of [0,100,1e5,1e10]) {
        const flat=12;
        const n=Math.floor(275/(Math.log10(1.01)*tax))-1;
        const e=Math.max(0,Math.min(n+flat,Math.floor(Decimal.pow(10,gross).plus(1).log10()))-flat);
        const expected=Math.min(gross-Math.log10(1.01)*tax*e*e/550,n+flat-Math.log10(1.01)*tax*n*n/550);
        assert.ok(Math.abs(taxedProductionLog10(gross,flat,tax)-expected)<Math.max(1,Math.abs(expected))*1e-12);
    }
    assert.equal(affordableProductionBuildings(2,100,1.25,1000),1,'the initial 100 coins buy the first worker');
    assert.equal(effectiveFreeProduction(1e300,0,1e100,1e300),1,'the 1e300 cap is applied after the multiplier and before viscosity');
    assert.equal(effectiveFreeProduction(1000,500,2,100),30);
    for (const count of [1,25,1000,10000]) {
        const e=count<=1000?count:count+(count-1000)**2/1000;
        const budget=new Decimal(100/(1.25-1)).times(Decimal.pow(1.25,e).minus(1)).log10();
        assert.equal(affordableProductionBuildings(budget,100,1.25,1000),count);
    }
    const curve=acceleratorCostCurve(500,4,125,10000,1.32e6);
    for (const count of [1,125,1000,10000,50000,1e16]) {
        assert.ok(Math.abs(curve.affordable(curve.cost(count))-count)<=Math.max(1,count*1e-10));
    }
    const boostCurve=acceleratorBoostCostCurve(2);
    for(const count of [1,100,2000,50000,1e16]) assert.ok(Math.abs(boostCurve.affordable(boostCurve.cost(count))-count)<=Math.max(1,count*1e-10));
    const emptyStats={construction:1,coinExponent:1,antCoinsLog:0,buildingPowerResearch:1,buildingPowerExponent:1,
        speedRunePower:0,duplicationBoosts:0,freeAcceleratorMultiplier:1,freeMultiplierMultiplier:1,
        prismProductionLog:0,achievementPoints:0,hepteractAccelerators:0,hepteractMultipliers:0,acceleratorFinalMultiplier:1,multiplierFinalMultiplier:1,
        freeBoostMultiplier:1,totalRuneLevels:0,acceleratorsPerBoost:5,duplicationBlessing:1,prismCostReduction:0,prismSpiritCap:0,
        commonFragmentsLog4:0,multiplierCubeBlessing:1,thriftBlessingDelay:1};
    const earlyData={researches:Array(201).fill(0),cubeUpgrades:Array(81).fill(0),upgrades:Array(126).fill(0),
        unlocks:{},highestSingularityCount:0,goldenQuarks:0,prestigeCount:0,transcendCount:0,
        reincarnationPoints:'0',particleBuildings:Array(5).fill(0),challengecompletions:Array(16).fill(0)};
    const earlyOptions={data:earlyData,level:0,stats:Array(11).fill(emptyStats),speedLog10:Array(11).fill(0),
        tax:()=>1e-20,constructionPenalty:1,viscosity:1,recession:1};
    const early=createCorruptionProductionRun(earlyOptions);
    early.enter(1); early.advance(1,Array(11).fill(0));
    assert.ok(Math.abs(early.amount(1)-Math.log10(110))<1e-10,'one worker earns ten coins per real second at speed one');
    early.enter(6); early.advance(20,Array(11).fill(0));
    assert.equal(early.amount(6),-Infinity,'no mythos production does not grant capped C6');
    const earlyModel={...model,maxLevel:33,createProductionRun:()=>createCorruptionProductionRun(earlyOptions)};
    assert.equal(findOptimalCorruption(earlyModel),null,'a generous tax ceiling cannot create C10 production in an early state');
    assert.deepEqual(earlyData.upgrades,Array(126).fill(0),'simulated purchases do not mutate input upgrades');
    const grown=createCorruptionProductionRun({...earlyOptions,speedLog10:Array(11).fill(6)});
    grown.enter(1);
    for(let i=0;i<20;i++) grown.advance(0.025,Array(11).fill(0));
    assert.ok(grown.amount(1)>early.amount(1),'production grows through purchases when game time is available');
    const poor=structuredClone(earlyData);
    poor.upgrades[1]=1;
    const strongStats={...emptyStats,antCoinsLog:1e8};
    const normalRun=createCorruptionProductionRun({...earlyOptions,data:poor,stats:Array(11).fill(strongStats)});
    const recessed=createCorruptionProductionRun({...earlyOptions,data:poor,stats:Array(11).fill(strongStats),recession:1e-6,constructionPenalty:20});
    normalRun.enter(10); recessed.enter(10);
    for(let i=0;i<20;i++){normalRun.advance(0.025,Array(11).fill(0));recessed.advance(0.025,Array(11).fill(0));}
    assert.ok(normalRun.amount(10)>recessed.amount(10),'corruption reduces achievable C10 production even with the same tax ceiling');

    function c9CoinProduction(prismSpiritCap, tier4CrystalAutobuy) {
        const run = createCorruptionProductionRun({
            ...earlyOptions,
            stats: Array(11).fill({ ...strongStats, prismProductionLog: 100, prismSpiritCap }),
            freeCrystalProducers: [1, 1, 1, tier4CrystalAutobuy, 1],
        });
        run.enter(9);
        const completions = Array(11).fill(0);
        for (let i = 0; i < 20; i++) run.advance(0.025, completions);
        return run.amount(9);
    }
    assert.ok(c9CoinProduction(100, 1) > c9CoinProduction(0, 1), 'the tier 4 crystal autobuyer restores its coin exponent bonus inside C9');
    assert.equal(c9CoinProduction(100, 0), c9CoinProduction(0, 0), 'the tier 4 crystal upgrade requires its autobuy milestone');

    function c9WithMythosConversion(unlocked) {
        const data = structuredClone(earlyData);
        data.highestSingularityCount = 15;
        data.unlocks = { prestige: true, transcend: true, reincarnate: true };
        data.researches[45] = 1;
        data.upgrades[111] = Number(unlocked);
        const run = createCorruptionProductionRun({
            ...earlyOptions, data, stats: Array(11).fill(strongStats), freeCrystalProducers: [1, 1, 1, 1, 1],
        });
        run.enter(9);
        const completions = Array(11).fill(0);
        for (let i = 0; i < 20; i++) run.advance(0.025, completions);
        return run.amount(9);
    }
    assert.ok(c9WithMythosConversion(true) > c9WithMythosConversion(false), 'mythos conversion increases crystal-backed coin production');

    const scoreCompletions=[0,400,400,400,400,400,150,150,150,150,150];
    const cubeModel=buildCorruptionPredictionModel(finiteAPI,finite,'cubes');
    const hepteractModel=buildCorruptionPredictionModel(finiteAPI,finite,'hepteracts');
    const tau=finiteAPI.goldenQuark.getGQUpgradeEffect('platonicTau','tauPower');
    const effective=finiteAPI.corruption.getEffectiveCorruptionLevel(60);
    const cubeExpected=(Math.log10(1.05)+Math.log10((1+0.01*effective*finite.platonicUpgrades[1])/(1+0.01*(effective-1)*finite.platonicUpgrades[1])))*tau;
    assert.ok(Math.abs(cubeModel.rewardLog10(60,scoreCompletions)-cubeModel.rewardLog10(59,scoreCompletions)-cubeExpected)<1e-12);
    assert.ok(Math.abs(hepteractModel.rewardLog10(60,scoreCompletions)-hepteractModel.rewardLog10(59,scoreCompletions)-Math.log10(1.1)*tau)<1e-12);
    assert.equal(actualModel.rewardLog10(60,scoreCompletions),hepteractModel.rewardLog10(60,scoreCompletions),'hepteracts are the default objective');
    assert.equal(hepteractModel.rewardLog10(0,scoreCompletions),-Infinity,'free corruption levels do not bypass the raw-level hepteract unlock');
    const started = performance.now();
    const prediction = findOptimalCorruption(actualModel);
    assert.ok(prediction && prediction.level <= actualModel.maxLevel && prediction.completions[10] > 0);
    const refined=predictCorruptionLevel(actualModel,prediction.level,2,true);
    assert.deepEqual(refined.completions,prediction.completions,'the integration snapshot winner has stable completions at double resolution');
    const context = { ...finiteAPI.getCalculationContext(), pcoinLevels: { BASE_OFFERING_BUFF: 3 },
        talismanUnlocks: { exemption: false, wowSquare: true } };
    const transferred = HSGameDataAPI.fromCalculationContext(finite, context);
    assert.deepEqual(transferred.createCalculationSnapshot(finite).getTalismanProgressUnlocks(), context.talismanUnlocks);
    assert.equal(transferred.createCalculationSnapshot(finite).getPCoinUpgradeLevel('BASE_OFFERING_BUFF'), 3);
    const transferredModel = buildCorruptionPredictionModel(transferred, finite);
    const candidate = predictCorruptionLevel(transferredModel, prediction.level, 1, true);
    await checkWorker(root, { data: finite, context, target: 'hepteracts' }, candidate,
        transferredModel.rewardLog10(candidate.level, transferredModel.caps), {
            input: { data: oneCapData, context: oneCapAPI.getCalculationContext(), target: 'cubes' },
            capScore: oneCapModel.rewardLog10(0, corruptionCompletionCeilings(oneCapModel.caps, oneCapModel.startingCompletions)),
        });
    await checkAdaptiveScan(scanCorruptionAdaptively);
    assert.equal(JSON.stringify(data), before, 'a complete search leaves the reference save intact');
    console.log(`Reference snapshot: level ${prediction.level}, C10 ${prediction.completions[10]}, ${(performance.now() - started).toFixed(1)}ms`);
    console.log('Corruption prediction checks passed');
}
main().then(() => process.exit(0)).catch(error => { console.error(error); process.exit(1); });
