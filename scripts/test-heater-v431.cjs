const assert = require('node:assert/strict');
const fs = require('node:fs');
const esbuild = require('esbuild');
const Decimal = require('break_infinity.js');

// Expose internals only in this in-memory test bundle. Production exports
// remain unchanged, and no player save is needed by these regressions.
async function loadOptimizer() {
    const bundle = await esbuild.build({
        stdin: {
            contents: `
                export * from './src/mod/class/hs-modules/hs-heater/hs-heater-optimizer';
                export { inputDefinitions } from './src/mod/class/hs-modules/hs-heater/hs-heater-input-config';
            `,
            resolveDir: process.cwd(),
            loader: 'ts',
        },
        bundle: true,
        platform: 'node',
        format: 'cjs',
        write: false,
        logLevel: 'silent',
        plugins: [{
            name: 'heater-test-internals',
            setup(build) {
                build.onLoad({ filter: /hs-heater-optimizer\.ts$/ }, ({ path }) => ({
                    contents: fs.readFileSync(path, 'utf8') + `
                        export { Upgrade, Loadout, fillStatsAndOptionsFromInput, createCubeLuckEvaluator };
                    `,
                    loader: 'ts',
                }));
            },
        }],
    });
    const module = { exports: {} };
    new Function('module', 'exports', 'require', bundle.outputFiles[0].text)(module, module.exports, require);
    return module.exports;
}

function close(actual, expected, message) {
    assert.ok(Math.abs(actual - expected) <= 1e-10 * Math.max(1, Math.abs(expected)),
        `${message}: ${actual} != ${expected}`);
}

function fixture(inputDefinitions, overrides = {}) {
    return {
        ...Object.fromEntries(inputDefinitions.map(field => [field.key, field.type === 'boolean' ? false : 0])),
        amb: 90_000_000, ramb: 10_000_000, blueberries: 31,
        luckBaseNoAmb: 7000, luckMultNoAmb: 0.3, redLuckBase: 1800, luckConversion: 8.4,
        quarksOwned: 1e30, cubesExpTotal: 1288, currentSingularity: 288,
        exalt5Unlocked: true, exalt9Unlocked: true, oneMindUnlocked: true,
        transcription: 19, ascSpeed: 1e56, ascSpread: 0.096,
        bonusTutorial: 5, bonusRow2: 5, bonusRow3: 5, bonusRow4: 5, bonusRow5: 5,
        runeSiExp: new Decimal(0), runeIaExp: new Decimal(0),
        runeIaBonusLevelsTotal: new Decimal(100), runeIaBonusLevelsTalisman: new Decimal(50),
        baseTalismanPower: new Decimal(2), runeSiBonusLevelsTalismanNoAmbrosia: 0,
        runeSiEffectiveLevelMultiplier: 1, chronometerLevel: 1430,
        shopAmbrosiaLuck1: 40, shopAmbrosiaLuck2: 50, shopAmbrosiaLuck3: 60, shopAmbrosiaLuck4: 1000,
        shopUpgradeRawLevels: {
            seasonPass: 60, seasonPass3: 100, seasonPassY: 100,
            seasonPassZ: 1000, seasonPassLost: 1000, seasonPassInfinity: 1000,
        },
        shopBonusLevelsNoAmbrosia: {
            cubes: 33, infinity: 400, speed: 30, ambrosiaLuck: 5,
            offering: 0, obtainium: 0, quark: 0, redAmbrosiaLuck: 5, ambrosiaGeneration: 5,
        },
        panthemaLevel: 1, ambrosiaUpgradeBonusLevels: { ambrosiaTutorial: 1 },
        ambrosiaUpgradeBlueberryCostReductions: {}, shopUpgradesDisabled: false,
        blueBarRequirementBeforeRounding: 40_000_000, blueBarMaxWithoutTwoMindAndBrick: 40_000_000,
        heaterOptions: { luck: false, quarks: false, cubes: false, oct: true,
            obtOff: false, hyperflux: false, sr: false, ambOct: false },
        ...overrides,
    };
}

// Reference the v4.3.1 Oct stat lines directly: there is no GlobalCube line.
// This calculation uses the exported baseline and raw candidate purchases,
// without calling any optimizer score/effect/cache helpers.
function gameOctScore(input, levels) {
    const raw = key => levels[key] ?? 0;
    const effective = (key, bonus) => raw(key) + bonus
        + (raw(key) > 0 ? input.ambrosiaUpgradeBonusLevels[key] ?? 0 : 0);
    const vouchers = ['ambrosiaInfiniteShopUpgrades1', 'ambrosiaInfiniteShopUpgrades2', 'ambrosiaInfiniteShopUpgrades3']
        .reduce((sum, key) => sum + effective(key, 0), 0);
    const luck1 = effective('ambrosiaLuck1', input.bonusRow2);
    const luck2 = effective('ambrosiaLuck2', input.bonusRow2);
    const luck1Effect = n => 2 * n + 12 * Math.floor(n / 10);
    const luck2Effect = (n, parent) => (3 + 0.3 * Math.floor(parent / 10)) * n + 40 * Math.floor(n / 10);
    const quarkCoefficient = Math.floor((Math.log10(input.quarksOwned + 1) + 1) ** 2);
    const group = input.shopBonusLevelsNoAmbrosia;
    const freeLuck = effective('ambrosiaFreeLuckUpgrades', 0);
    const infinityBoost = 1 + 0.01 * input.panthemaLevel * (group.infinity + vouchers);
    const baselineBoost = 1 + 0.01 * input.panthemaLevel * group.infinity;
    const additiveLuck = input.luckBaseNoAmb
        + luck1Effect(luck1) - luck1Effect(input.bonusRow2)
        + luck2Effect(luck2, luck1) - luck2Effect(input.bonusRow2, input.bonusRow2)
        + input.blueberries * effective('ambrosiaLuck3', 0)
        + 0.02 * (input.cubesExpTotal + 6) * effective('ambrosiaCubeLuck1', 0)
        + 0.02 * quarkCoefficient * effective('ambrosiaQuarkLuck1', 0)
        + 6.6 * freeLuck
        + 0.2 * input.panthemaLevel * ((group.ambrosiaLuck + freeLuck) * infinityBoost
            - group.ambrosiaLuck * baselineBoost);
    const digits = Math.ceil(Math.log10(input.amb + 1)) + Math.ceil(Math.log10(input.ramb + 1));
    const luck = additiveLuck * (1 + input.luckMultNoAmb + 0.02 * raw('ambrosiaBrickOfLead')
        + 0.0001 * digits * effective('ambrosiaLuck4', 0));
    const cube1 = effective('ambrosiaCubes1', input.bonusRow4);
    const cube2 = effective('ambrosiaCubes2', input.bonusRow4);
    const cube3 = effective('ambrosiaCubes3', input.bonusRow4);
    const cube4 = effective('ambrosiaCubes4', input.bonusRow4);
    let score = (1 + 0.05 * (effective('ambrosiaTutorial', input.bonusTutorial)))
        * (1 + 0.05 * cube1) * 1.1 ** Math.floor(cube1 / 5)
        * (1 + (0.1 + 0.01 * Math.floor(cube1 / 10)) * cube2) * 1.15 ** Math.floor(cube2 / 5)
        * (1 + 0.2 * (1 + 0.03 * cube2) * cube3) * 1.2 ** Math.floor(cube3 / 5)
        * (1 + cube4 / 100) * 1.3 ** Math.floor(cube4 / 5)
        * (1 + 0.001 * quarkCoefficient * effective('ambrosiaQuarkCube1', input.bonusRow4))
        * (1 + 0.0005 * luck * effective('ambrosiaLuckCube1', input.bonusRow4));
    const freeCube = effective('ambrosiaFreeCubeUpgrades', 0);
    for (const [key, coefficient] of [
        ['seasonPass3', 0.015], ['seasonPassY', 0.0075],
        ['seasonPassZ', 0.01 * input.currentSingularity], ['seasonPassLost', 0.001],
    ]) {
        const base = input.shopUpgradeRawLevels[key] + group.cubes;
        score *= (1 + coefficient * (base + freeCube)) / (1 + coefficient * base);
    }
    score *= 1.012 ** (1.25 * (freeCube + vouchers));
    const speedPanthema = (1 + 0.005 * input.panthemaLevel * group.speed * infinityBoost)
        / (1 + 0.005 * input.panthemaLevel * group.speed * baselineBoost);
    const rawSpeed = input.ascSpeed ** (1 / (1 + input.ascSpread))
        * 1.006 ** vouchers * speedPanthema * (1 - 0.01 * raw('ambrosiaBrickOfLead'));
    const spread = input.ascSpread + 0.001 * (Math.floor((input.chronometerLevel + vouchers) / 40)
        - Math.floor(input.chronometerLevel / 40));
    const speed = rawSpeed ** (1 + spread);
    return score * (speed / input.ascSpeed) ** (0.55 + input.transcription / 150);
}

async function main() {
    const x = await loadOptimizer();
    const input = fixture(x.inputDefinitions);
    x.fillStatsAndOptionsFromInput(input);
    const loadout = levels => { const result = new x.Loadout(); result.upgradeLevels = { ...levels }; return result; };
    const empty = loadout({});
    close(x.Upgrade.freeCubeShopEffect(empty, true), 1, 'Red cube free levels are already in the baseline');
    close(x.Upgrade.infinityCubeShopEffect(empty, true), 1, 'Empty Oct shop multiplier');
    close(x.Upgrade.infinityCubeShopEffect(empty), 1, 'Empty Cube shop multiplier');
    close(empty.luck, input.luckBaseNoAmb * (1 + input.luckMultNoAmb), 'Empty luck matches the exported baseline');

    const shopBuild = loadout({ ambrosiaFreeCubeUpgrades: 10, ambrosiaInfiniteShopUpgrades1: 20 });
    close(x.Upgrade.infinityCubeShopEffect(shopBuild, true), 1.012 ** (1.25 * 30), 'Only Oct Infinity Pass effect');
    const group = input.shopBonusLevelsNoAmbrosia;
    const panthema = (1 + 0.005 * (group.cubes + 10) * (1 + 0.01 * (group.infinity + 20)))
        / (1 + 0.005 * group.cubes * (1 + 0.01 * group.infinity));
    close(x.Upgrade.infinityCubeShopEffect(shopBuild), 1.012 ** 30 * panthema, 'Cubes retain global Pass and Panthema');
    const expectedPasses = [['seasonPass3', 0.015], ['seasonPassY', 0.0075],
        ['seasonPassZ', 2.88], ['seasonPassLost', 0.001]].reduce((value, [key, coefficient]) => {
        const base = input.shopUpgradeRawLevels[key] + group.cubes;
        return value * (1 + coefficient * (base + 10)) / (1 + coefficient * base);
    }, 1);
    close(x.Upgrade.freeCubeShopEffect(shopBuild, true), expectedPasses, 'Oct Pass Y/Z each occur once');

    const freeOnly = loadout({ ambrosiaInfiniteShopUpgrades1: 20 });
    close(freeOnly.luck, (input.luckBaseNoAmb + 0.2 * group.ambrosiaLuck * 0.01 * 20)
        * (1 + input.luckMultNoAmb), 'Vouchers boost existing Red shop luck without duplicating it');
    const right = loadout({ ambrosiaLuck1: 90, ambrosiaLuck2: 50, ambrosiaLuck3: 59,
        ambrosiaLuckCube1: 24, ambrosiaBrickOfLead: 23, ambrosiaFreeLuckUpgrades: 2 });
    const evaluator = x.createCubeLuckEvaluator([right], 'oct', false);
    const candidate = evaluator.evaluate(shopBuild, 0, false);
    close(candidate.value, evaluator.materialize(candidate).getStat('oct', true), 'Cached Cube/Luck join matches full Oct score');
    const redFreeLuckOnly = loadout({ ambrosiaLuckCube1: 10 });
    const redEvaluator = x.createCubeLuckEvaluator([redFreeLuckOnly], 'oct', false);
    const redCandidate = redEvaluator.evaluate(shopBuild, 0, false);
    close(redCandidate.value, redEvaluator.materialize(redCandidate).getStat('oct', true),
        'Cached join retains Panthema luck from baseline Red levels with no Free Luck purchase');

    const manual = { ambrosiaTutorial: 10, ambrosiaQuarks1: 20, ambrosiaCubes1: 100,
        ambrosiaLuck1: 90, ambrosiaQuarkCube1: 25, ambrosiaLuckCube1: 24,
        ambrosiaCubeLuck1: 16, ambrosiaQuarkLuck1: 14, ambrosiaCubes2: 100,
        ambrosiaLuck2: 50, ambrosiaCubes3: 100, ambrosiaCubes4: 40,
        ambrosiaFreeCubeUpgrades: 27, ambrosiaLuck3: 59, ambrosiaPatreon: 1,
        ambrosiaBaseOffering1: 20, ambrosiaBaseObtainium1: 10,
        ambrosiaInfiniteShopUpgrades1: 20, ambrosiaInfiniteShopUpgrades2: 20,
        ambrosiaBrickOfLead: 23, ambrosiaFreeLuckUpgrades: 2 };
    close(loadout(manual).getStat('oct'), gameOctScore(input, manual), 'Manual build matches independent v4.3.1 Oct formula');
    const run = x.HSHeaterOptimizer.runExperiment(input, { validateVoucherMergeScores: true });
    const best = JSON.parse(run.result.oct[0][0]);
    const bestLoadout = loadout(best);
    close(bestLoadout.getStat('oct'), gameOctScore(input, best), 'Optimizer winner matches game formula');
    assert.ok(bestLoadout.cost <= input.amb && bestLoadout.blueberryCost <= input.blueberries);
    assert.ok(gameOctScore(input, best) >= gameOctScore(input, manual), 'Heater must beat the manual reference build');

    const disabled = fixture(x.inputDefinitions, { exalt: 6 });
    x.fillStatsAndOptionsFromInput(disabled);
    close(x.Upgrade.addedFreeCubeLevels(shopBuild), 0, 'Exalt 6 suppresses Free Cube purchases');
    const purple = fixture(x.inputDefinitions, { ambrosiaUpgradeBonusLevels: { ambrosiaFreeCubeUpgrades: 3 } });
    x.fillStatsAndOptionsFromInput(purple);
    close(x.Upgrade.addedFreeCubeLevels(empty), 0, 'Unpurchased Purple free levels stay inactive');
    close(x.Upgrade.addedFreeCubeLevels(shopBuild), 13, 'Purchased Purple free levels apply once');
    console.log('Heater v4.3.1 scoring and optimizer regression checks passed.');
}

main().catch(error => { console.error(error); process.exitCode = 1; });
