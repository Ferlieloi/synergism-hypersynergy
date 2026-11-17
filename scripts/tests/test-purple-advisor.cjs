const assert = require('node:assert/strict');
const path = require('node:path');
const Module = require('node:module');
const esbuild = require('esbuild');

// rankPurpleUpgrades against fancia's Purple Heater sheet ("Formatted" tab, its own example): the sheet's
// closed-form model holds with Two Mind on, overcap off, 100% routing and enough red, where it must give the
// same effect ratios as the mod's income model. Expected values are the sheet's computed cells.
const root = path.resolve(__dirname, '../..');
const runtime = new Module(path.join(root, 'purple-advisor-test.cjs'), module);
runtime._compile(esbuild.buildSync({
    entryPoints: [path.join(root, 'src/mod/class/hs-core/gds/hs-purple-upgrade-advisor.ts')],
    bundle: true, write: false, platform: 'node', format: 'cjs',
}).outputFiles[0].text, path.join(root, 'purple-advisor-test.cjs'));
const { rankPurpleUpgrades } = runtime.exports;

const close = (actual, expected, label, tolerance = 1e-8) => assert.ok(
    Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance * Math.max(1, Math.abs(expected)),
    `${label}: ${actual} != ${expected}`);

// Sheet inputs: S296, 5 levels of each Pseudo-Coin purple upgrade, RB Fusion 100, Aries 25 with 4 digits,
// Gemini 10, rebate 6, Cancer 10, Scorpio 2, purple luck 378, efficiency 2.68
const income = {
    reactor: {
        blueRoutingPercent: 100, redRoutingPercent: 100, blueStoredPoints: 0, redStoredPoints: 0,
        blueCapacity: 5e9, encabulatorSpeed: 21,
        purpleRequirementWithoutTwoMind: 250_000 * 0.92 * 0.9 ** 3,
        cancerPurplePointsPerBlueOrRedFill: 5_000,
        purpleFillBluePoints: 50_000 * 16, purpleFillRedPoints: 25 * 16,
        scorpioConversionMultiplier: 1.2, ariesBarPointMultiplier: 1.02,
        overcapEnabled: false, barDependenceEnabled: false,
    },
    bluePointsPerSecond: 242_903, redPointsPerSecond: 882,
    blueRequirementWithoutTwoMind: 1e7, redRequirementWithoutTwoMind: 7_500,
    blueLuck: 25_321, redLuck: 3_470, purpleHoneyLuck: 378, purpleHoneyPerExtraction: 2.68,
    flatAmbrosiaPerBlueFill: 0, acceleratorSecondsPerRedAmbrosia: 3, twoMind: true,
};
const maxed = {
    tutorial: 15, purpleEfficiency1: 20, purpleEfficiency2: 20, purpleEfficiency3: 30, purpleEfficiency4: 30,
    purpleHoneyLuck1: 10, purpleHoneyLuck2: 15, purpleHoneyLuck3: 20, purpleHoneyLuck4: 5,
    purpleHalfLife1: 50, purpleHalfLife2: 50, purpleHalfLife3: 50, purpleHalfLife4: 0,
    purpleCapacityExpander1: 10_000, purpleCapacityExpander2: 10_000, purpleCapacityExpander3: 0, purpleCapacityExpander4: 0,
    purpleHoneyRequirementReduction1: 25, purpleHoneyRequirementReduction2: 25,
    purpleHoneyRequirementReduction3: 25, purpleHoneyRequirementReduction4: 0,
    lifetimeHoneyAmbrosia: 10, lifetimeHoneyRedAmbrosia: 15,
};
const sheetCase = {
    income, reactorLevels: maxed,
    zodiacLevels: { aries: 25, gemini: 10, cancer: 10, scorpio: 2, libra: 1 },
    lifetimePurpleHoney: 1e6, ariesDigits: 4, craftPurpleHoneyCost: 400, craftRedAmbrosiaCost: 2_000,
};

const result = rankPurpleUpgrades(sheetCase);
const byKey = Object.fromEntries(result.advice.map((advice) => [advice.key, advice]));

// Base fill rates: the sheet's Blue / Red / Purple Bar per second
close(result.base.blueFillsPerSecond, 0.2648037261, 'blue fills');
close(result.base.redFillsPerSecond, 0.09866131802, 'red fills');
close(result.base.purpleFillsPerSecond, 0.2525386018, 'purple fills');

// Effect ratios (sheet: Purple / Blue / Red Effect columns)
close(byKey.purpleHalfLife4.honeyRatio, 1.002656203, 'Speed 4 purple');
close(byKey.purpleHalfLife4.ambrosiaRatio, 0.9993454086, 'Speed 4 blue');
close(byKey.purpleHalfLife4.redAmbrosiaRatio, 0.9994241216, 'Speed 4 red');
close(byKey.purpleCapacityExpander3.honeyRatio, 1.00002789, 'Capacity 3 purple');
close(byKey.purpleCapacityExpander3.ambrosiaRatio, 0.9999931268, 'Capacity 3 blue');
close(byKey.purpleCapacityExpander4.honeyRatio, 1.000032538, 'Capacity 4 purple');
close(byKey.purpleHoneyLuck4.honeyRatio, 1.002645503, 'Luck 4 purple');
close(byKey.purpleHoneyRequirementReduction4.honeyRatio, 1.004016064, 'Bar Reduction 4 purple');
close(byKey.scorpio.honeyRatio, 1.001408388, 'Scorpio purple');
close(byKey.scorpio.ambrosiaRatio, 1.024093166, 'Scorpio blue');
close(byKey.scorpio.redAmbrosiaRatio, 1.025459286, 'Scorpio red');

// Costs (sheet: Next Cost; zodiac upgrades crafted at 400 honey + 2000 red ambrosia per Purple Ambrosia)
close(byKey.purpleHalfLife4.honeyCost, 96_000, 'Speed 4 cost');
close(byKey.purpleCapacityExpander3.honeyCost, 100, 'Capacity 3 cost');
close(byKey.purpleCapacityExpander4.honeyCost, 1_000, 'Capacity 4 cost');
close(byKey.purpleHoneyLuck4.honeyCost, 56_000, 'Luck 4 cost');
close(byKey.scorpio.purpleAmbrosiaCost, 750, 'Scorpio Purple Ambrosia');
close(byKey.scorpio.honeyCost, 750 * 400, 'Scorpio honey');
close(byKey.scorpio.redAmbrosiaCost, 750 * 2_000, 'Scorpio red ambrosia');
close(byKey.purpleHalfLife4.value, Math.log(1.002656203) / 96_000, 'Speed 4 value (sheet CEF)', 1e-6);

// Maxed upgrades are left out; the rest is best first
for (const key of ['tutorial', 'purpleEfficiency1', 'purpleHalfLife1', 'aries', 'gemini', 'cancer', 'lifetimeHoneyAmbrosia']) {
    assert.equal(byKey[key], undefined, `${key} is maxed`);
}
for (let index = 1; index < result.advice.length; index++) {
    assert.ok(result.advice[index - 1].value >= result.advice[index].value, 'sorted best first');
}

// Honey Power: Ambrosia from level 0 multiplies blue generation by 1 + 0.022 ln(1 + lifetime / 100)
const powerCase = rankPurpleUpgrades({ ...sheetCase, reactorLevels: { ...maxed, lifetimeHoneyAmbrosia: 0 } });
const power = powerCase.advice.find((advice) => advice.key === 'lifetimeHoneyAmbrosia');
assert.ok(power && power.ambrosiaRatio > 1 && power.honeyRatio > 1, 'Honey Power: Ambrosia raises both incomes');
close(power.honeyCost, 10_000, 'Honey Power: Ambrosia cost');

// Libra is never ranked: its overcap trades Ambrosia income for Purple Honey
const libraCase = rankPurpleUpgrades({ ...sheetCase, zodiacLevels: { ...sheetCase.zodiacLevels, libra: 0 } });
assert.equal(libraCase.advice.find((advice) => advice.key === 'libra'), undefined, 'Libra not ranked');

// Exalt 10 (Bar Dependence) earns no Purple Honey: nothing to rank
const exalt10 = rankPurpleUpgrades({ ...sheetCase, income: { ...income, reactor: { ...income.reactor, barDependenceEnabled: true } } });
assert.equal(exalt10.advice.length, 0, 'no advice in Exalt 10');

console.log(`test-purple-advisor: ok (${result.advice.length} upgrades ranked, best ${result.advice[0].key})`);
