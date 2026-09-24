const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const esbuild = require('esbuild');

const source = fs.readFileSync('src/mod/class/hs-modules/hs-heater/hs-heater-bar-income.ts', 'utf8');
const { code } = esbuild.transformSync(source, { loader: 'ts', format: 'cjs' });
const moduleObject = { exports: {} };
vm.runInNewContext(code, { module: moduleObject, exports: moduleObject.exports });
const { calculateHeaterBarIncome } = moduleObject.exports;

const reactor = {
  blueRoutingPercent: 0,
  redRoutingPercent: 0,
  blueStoredPoints: 0,
  redStoredPoints: 0,
  blueCapacity: 1e9,
  encabulatorSpeed: 12,
  purpleRequirementWithoutTwoMind: 250000,
  cancerPurplePointsPerBlueOrRedFill: 0,
  purpleFillBluePoints: 0,
  purpleFillRedPoints: 0,
  scorpioConversionMultiplier: 1,
  ariesBarPointMultiplier: 1,
  overcapEnabled: false,
  barDependenceEnabled: false,
};
const base = {
  reactor,
  bluePointsPerSecond: 1e6,
  redPointsPerSecond: 750,
  blueRequirementWithoutTwoMind: 20e6,
  redRequirementWithoutTwoMind: 15000,
  blueLuck: 200,
  redLuck: 300,
  flatAmbrosiaPerBlueFill: 0,
  acceleratorSecondsPerRedAmbrosia: 0,
  twoMind: false,
};
const near = (actual, expected) => assert.ok(
  Math.abs(actual - expected) < 1e-10 * Math.max(1, Math.abs(expected)),
  `${actual} != ${expected}`,
);

const ordinary = calculateHeaterBarIncome(base);
near(ordinary.blueAmbrosiaPerSecond, 0.1);
near(ordinary.redAmbrosiaPerSecond, 0.15);
// One-sided routing eventually fills only that tank. With no opposite
// reactant supply, sustained ordinary bar rates return to the no-routing
// rates even when the saved slider says 100%.
for (const [blueRoutingPercent, redRoutingPercent] of [[100, 0], [0, 100]]) {
  const oneSided = calculateHeaterBarIncome({
    ...base,
    reactor: { ...reactor, blueRoutingPercent, redRoutingPercent },
  });
  near(oneSided.blueAmbrosiaPerSecond, ordinary.blueAmbrosiaPerSecond);
  near(oneSided.redAmbrosiaPerSecond, ordinary.redAmbrosiaPerSecond);
}
const twoMind = calculateHeaterBarIncome({ ...base, twoMind: true });
near(twoMind.blueAmbrosiaPerSecond, ordinary.blueAmbrosiaPerSecond);
near(twoMind.redAmbrosiaPerSecond, ordinary.redAmbrosiaPerSecond);
near(calculateHeaterBarIncome({ ...base, flatAmbrosiaPerBlueFill: 1 }).blueAmbrosiaPerSecond, 0.15);
near(calculateHeaterBarIncome({ ...base, flatAmbrosiaPerBlueFill: 1, twoMind: true }).blueAmbrosiaPerSecond, 0.2);

const routed = calculateHeaterBarIncome({
  ...base,
  bluePointsPerSecond: 1000,
  redPointsPerSecond: 1,
  reactor: { ...reactor, blueCapacity: 1e15, blueRoutingPercent: 50, redRoutingPercent: 50 },
});
near(routed.blueAmbrosiaPerSecond, 0.00005);
near(routed.redAmbrosiaPerSecond, 0.0001);
near(routed.purpleFillsPerSecond, 0.0002);

const feedback = calculateHeaterBarIncome({
  ...base,
  reactor: {
    ...reactor,
    cancerPurplePointsPerBlueOrRedFill: 500,
    purpleFillBluePoints: 50000,
    purpleFillRedPoints: 25,
  },
});
assert.ok(feedback.blueAmbrosiaPerSecond > ordinary.blueAmbrosiaPerSecond);
assert.ok(feedback.redAmbrosiaPerSecond > ordinary.redAmbrosiaPerSecond);
assert.ok(feedback.purpleFillsPerSecond > 0);

// At 100% routing, ordinary bars can still fill from Purple-fill rebates.
const fullyRouted = calculateHeaterBarIncome({
  ...base,
  bluePointsPerSecond: 1000,
  redPointsPerSecond: 1,
  reactor: {
    ...reactor,
    blueCapacity: 1e15,
    blueRoutingPercent: 100,
    redRoutingPercent: 100,
    purpleFillBluePoints: 50000,
    purpleFillRedPoints: 25,
  },
});
near(fullyRouted.purpleFillsPerSecond, 0.0004);
assert.ok(fullyRouted.blueAmbrosiaPerSecond > 0);
assert.ok(fullyRouted.redAmbrosiaPerSecond > 0);

// Independent 0.125-second reactor loop, following SynergismOfficial's
// Calculate.ts routing/conversion and Helper.ts fill order. Check the
// long-run closed-form rates against actual discrete bar completions.
function simulateFills(input, tickCount = 20000) {
  const dt = 0.125;
  const r = input.reactor;
  const recipeBlue = 1000 * r.scorpioConversionMultiplier;
  const recipePurple = 100 * r.scorpioConversionMultiplier * r.ariesBarPointMultiplier;
  const capBlue = r.blueCapacity;
  const capRed = capBlue / 1000;
  const throughputBlue = capBlue * r.encabulatorSpeed / 100 / 3600 * dt;
  const blueRequirement = input.twoMind ? 1e7 : input.blueRequirementWithoutTwoMind;
  const redRequirement = input.twoMind ? 7500 : input.redRequirementWithoutTwoMind;
  const purpleRequirement = input.twoMind ? 125000 : r.purpleRequirementWithoutTwoMind;
  let storedBlue = r.blueStoredPoints, storedRed = r.redStoredPoints;
  let blueProgress = 0, redProgress = 0, purpleProgress = 0;
  let acceleratedBluePoints = 0;
  let blueFills = 0, redFills = 0, purpleFills = 0;
  function route(points, percent, stored, capacity, counterpart, blue) {
    const requested = points * percent / 100;
    const reserved = Math.min(requested, Math.max(0, capacity - stored));
    let overflow = 0, counterpartSpent = 0, purple = 0;
    if (r.overcapEnabled && requested > reserved) {
      const batches = Math.min(
        (requested - reserved) / (blue ? recipeBlue : 1),
        counterpart / (blue ? 1 : recipeBlue),
      );
      overflow = batches * (blue ? recipeBlue : 1);
      counterpartSpent = batches * (blue ? 1 : recipeBlue);
      purple = batches * recipePurple * 0.1;
    }
    return { stored: stored + reserved, counterpartSpent,
      regular: points - reserved - overflow, purple };
  }
  const warmup = Math.floor(tickCount / 5);
  for (let tick = 0; tick < tickCount; tick++) {
    const batches = Math.min(storedBlue / recipeBlue, storedRed, throughputBlue / recipeBlue);
    storedBlue -= batches * recipeBlue;
    storedRed -= batches;
    purpleProgress += batches * recipePurple;
    const purpleCompleted = Math.floor(purpleProgress / purpleRequirement);
    purpleProgress -= purpleCompleted * purpleRequirement;
    blueProgress += purpleCompleted * r.purpleFillBluePoints;
    redProgress += purpleCompleted * r.purpleFillRedPoints;
    const blue = route(input.bluePointsPerSecond * dt + acceleratedBluePoints,
      r.blueRoutingPercent,
      storedBlue, capBlue, storedRed, true);
    acceleratedBluePoints = 0;
    storedBlue = blue.stored;
    storedRed -= blue.counterpartSpent;
    purpleProgress += blue.purple;
    blueProgress += blue.regular;
    const red = route(input.redPointsPerSecond * dt, r.redRoutingPercent,
      storedRed, capRed, storedBlue, false);
    storedRed = red.stored;
    storedBlue -= red.counterpartSpent;
    purpleProgress += red.purple;
    redProgress += red.regular;
    const blueCompleted = Math.floor(blueProgress / blueRequirement);
    blueProgress -= blueCompleted * blueRequirement;
    purpleProgress += blueCompleted * r.cancerPurplePointsPerBlueOrRedFill;
    const redCompleted = Math.floor(redProgress / redRequirement);
    redProgress -= redCompleted * redRequirement;
    purpleProgress += redCompleted * r.cancerPurplePointsPerBlueOrRedFill;
    acceleratedBluePoints += redCompleted * input.redLuck / 100
      * input.acceleratorSecondsPerRedAmbrosia * input.bluePointsPerSecond;
    if (tick >= warmup) {
      blueFills += blueCompleted;
      redFills += redCompleted;
      purpleFills += purpleCompleted;
    }
  }
  const seconds = (tickCount - warmup) * dt;
  return { blue: blueFills / seconds, red: redFills / seconds,
    purple: purpleFills / seconds };
}

const accelerated = {
  ...base,
  bluePointsPerSecond: 1000,
  redPointsPerSecond: 1,
  blueRequirementWithoutTwoMind: 20,
  redRequirementWithoutTwoMind: 10,
  acceleratorSecondsPerRedAmbrosia: 0.2,
  reactor: {
    ...reactor,
    blueCapacity: 5000,
    encabulatorSpeed: 360,
    blueRoutingPercent: 70,
    redRoutingPercent: 50,
    purpleRequirementWithoutTwoMind: 50,
    cancerPurplePointsPerBlueOrRedFill: 5,
    purpleFillBluePoints: 10,
    purpleFillRedPoints: 2,
  },
};
const acceleratedPredicted = calculateHeaterBarIncome(accelerated);
const acceleratedObserved = simulateFills(accelerated);
for (const [key, expected] of [
  ['blue', acceleratedPredicted.blueFillsPerSecond],
  ['red', acceleratedPredicted.redFillsPerSecond],
  ['purple', acceleratedPredicted.purpleFillsPerSecond],
]) {
  assert.ok(Math.abs(acceleratedObserved[key] - expected) < 0.02 * Math.max(0.01, expected),
    `${key} (red accelerator): ${acceleratedObserved[key]} != ${expected}`);
}
const overcapAccelerated = {
  ...accelerated,
  reactor: {
    ...accelerated.reactor,
    blueRoutingPercent: 50,
    redRoutingPercent: 75,
    overcapEnabled: true,
  },
};
const overcapAcceleratedPredicted = calculateHeaterBarIncome(overcapAccelerated);
const overcapAcceleratedObserved = simulateFills(overcapAccelerated);
for (const [key, expected] of [
  ['blue', overcapAcceleratedPredicted.blueFillsPerSecond],
  ['red', overcapAcceleratedPredicted.redFillsPerSecond],
  ['purple', overcapAcceleratedPredicted.purpleFillsPerSecond],
]) {
  assert.ok(Math.abs(overcapAcceleratedObserved[key] - expected) < 0.03 * Math.max(0.01, expected),
    `${key} (overcap/red accelerator): ${overcapAcceleratedObserved[key]} != ${expected}`);
}

for (const overcapEnabled of [false, true]) {
  const scenario = {
    ...base,
    bluePointsPerSecond: 1000,
    redPointsPerSecond: 1,
    blueRequirementWithoutTwoMind: 20,
    redRequirementWithoutTwoMind: 10,
    reactor: {
      ...reactor,
      blueCapacity: 5000,
      encabulatorSpeed: 360,
      purpleRequirementWithoutTwoMind: 50,
      blueRoutingPercent: 100,
      redRoutingPercent: 100,
      cancerPurplePointsPerBlueOrRedFill: 5,
      purpleFillBluePoints: 10,
      purpleFillRedPoints: 2,
      overcapEnabled,
    },
  };
  const predicted = calculateHeaterBarIncome(scenario);
  const observed = simulateFills(scenario);
  for (const [key, expected] of [
    ['blue', predicted.blueFillsPerSecond],
    ['red', predicted.redFillsPerSecond],
    ['purple', predicted.purpleFillsPerSecond],
  ]) {
    assert.ok(Math.abs(observed[key] - expected) < 0.02 * Math.max(0.01, expected),
      `${key} (${overcapEnabled ? 'overcap' : 'normal'}): ${observed[key]} != ${expected}`);
  }
}

// A full tank is not a permanent 100% diversion. Once the reactor consumes
// reactants, that freed capacity accepts new points. The long-run ordinary
// bar flow is generated points minus actual tank consumption, and any Purple
// fill rebates are added separately.
for (const routing of [50, 100]) {
  const scenario = {
    ...base,
    bluePointsPerSecond: 1000,
    redPointsPerSecond: 1,
    blueRequirementWithoutTwoMind: 20,
    redRequirementWithoutTwoMind: 10,
    reactor: {
      ...reactor,
      blueCapacity: 5000,
      blueStoredPoints: 5000,
      redStoredPoints: 5,
      encabulatorSpeed: 360,
      blueRoutingPercent: routing,
      redRoutingPercent: routing,
      purpleRequirementWithoutTwoMind: 50,
      purpleFillBluePoints: 10,
      purpleFillRedPoints: 2,
    },
  };
  const predicted = calculateHeaterBarIncome(scenario);
  const observed = simulateFills(scenario);
  for (const [key, expected] of [
    ['blue', predicted.blueFillsPerSecond],
    ['red', predicted.redFillsPerSecond],
    ['purple', predicted.purpleFillsPerSecond],
  ]) {
    assert.ok(Math.abs(observed[key] - expected) < 0.02 * Math.max(0.01, expected),
      `${key} (${routing}% full tank): ${observed[key]} != ${expected}`);
  }
}

for (const overcapEnabled of [false, true]) {
  for (const [blueRoutingPercent, redRoutingPercent, redPointsPerSecond] of [
    [25, 100, 0.2], [100, 25, 2], [50, 75, 1], [100, 100, 4],
  ]) {
    const scenario = {
      ...base,
      bluePointsPerSecond: 1000,
      redPointsPerSecond,
      blueRequirementWithoutTwoMind: 20,
      redRequirementWithoutTwoMind: 10,
      reactor: {
        ...reactor,
        blueCapacity: 5000,
        blueStoredPoints: 5000,
        redStoredPoints: 5,
        encabulatorSpeed: 360,
        blueRoutingPercent,
        redRoutingPercent,
        purpleRequirementWithoutTwoMind: 5,
        purpleFillBluePoints: 10,
        purpleFillRedPoints: 2,
        overcapEnabled,
      },
    };
    const predicted = calculateHeaterBarIncome(scenario);
    const observed = simulateFills(scenario);
    for (const [key, expected] of [
      ['blue', predicted.blueFillsPerSecond],
      ['red', predicted.redFillsPerSecond],
      ['purple', predicted.purpleFillsPerSecond],
    ]) {
      assert.ok(Math.abs(observed[key] - expected) < 0.03 * Math.max(0.01, expected),
        `${key} (${blueRoutingPercent}/${redRoutingPercent}, overcap=${overcapEnabled}): ${observed[key]} != ${expected}`);
    }
  }
}

console.log('Heater bar-income checks passed.');
