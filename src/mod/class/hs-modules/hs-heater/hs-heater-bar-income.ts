import type { HeaterOptimizerInput } from '../../../types/data-types/hs-heater-types';

type Reactor = NonNullable<HeaterOptimizerInput['reactor']>;

export interface HeaterBarIncomeInput {
    reactor: Reactor;
    bluePointsPerSecond: number;
    redPointsPerSecond: number;
    blueRequirementWithoutTwoMind: number;
    redRequirementWithoutTwoMind: number;
    blueLuck: number;
    redLuck: number;
    flatAmbrosiaPerBlueFill: number;
    acceleratorSecondsPerRedAmbrosia: number;
    twoMind: boolean;
}

export interface HeaterBarIncome {
    blueAmbrosiaPerSecond: number;
    redAmbrosiaPerSecond: number;
    blueFillsPerSecond: number;
    redFillsPerSecond: number;
    purpleFillsPerSecond: number;
}

/**
 * Expected, sustained bar-fill rates for a fixed loadout. The game performs
 * the same routing, conversion and fill effects in 0.125-second batches
 * (SynergismOfficial/src/Calculate.ts and Helper.ts). Fractional fills here
 * are their long-run average; RNG rewards use their exact expectation.
 * Switching-loadout progress loss is intentionally not a build penalty.
 */
export function calculateHeaterBarIncome(input: HeaterBarIncomeInput): HeaterBarIncome {
    const { reactor } = input;
    const blueRequirement = input.twoMind ? 10_000_000 : input.blueRequirementWithoutTwoMind;
    const redRequirement = input.twoMind ? 7_500 : input.redRequirementWithoutTwoMind;
    const purpleRequirement = input.twoMind ? 125_000 : reactor.purpleRequirementWithoutTwoMind;
    if (!(blueRequirement > 0 && redRequirement > 0 && purpleRequirement > 0)) {
        throw new Error('Heater bar requirements must be positive. Refresh the game-data export.');
    }

    // SynergismOfficial/src/Calculate.ts calculateBarRewardLuck scales only
    // reward luck by fixed / old requirement. The flat Exalt reward is not
    // scaled, so Two Mind can improve blue Ambrosia per second.
    const blueAmbrosiaPerFill = input.blueLuck / 100
        * (input.twoMind ? blueRequirement / input.blueRequirementWithoutTwoMind : 1)
        + input.flatAmbrosiaPerBlueFill;
    const redAmbrosiaPerFill = input.redLuck / 100
        * (input.twoMind ? redRequirement / input.redRequirementWithoutTwoMind : 1);
    const blueRoute = Math.min(1, Math.max(0, reactor.blueRoutingPercent / 100));
    const redRoute = Math.min(1, Math.max(0, reactor.redRoutingPercent / 100));

    // SynergismOfficial/src/PurpleReactor.ts recipe: 1000 blue + 1 red
    // -> 100 purple points, with Scorpio changing both blue cost and purple
    // output, and Aries changing purple output only.
    const recipeBlue = 1_000 * reactor.scorpioConversionMultiplier;
    const recipePurple = 100 * reactor.scorpioConversionMultiplier
        * reactor.ariesBarPointMultiplier;
    const baseRedProduction = Math.max(0, input.redPointsPerSecond);
    const throughputBatches = reactor.blueCapacity * reactor.encabulatorSpeed
        / 100 / 3_600 / recipeBlue;
    const cancer = reactor.cancerPurplePointsPerBlueOrRedFill;

    const ratesAtBlueProduction = (blueProduction: number, purpleFills: number) => {
        // v4.3.1 routes Gemini and Purple Bar Rebates through the tanks after
        // each extraction. Their stored points react on the next tick; in a
        // sustained-rate calculation they join the ordinary point supply.
        const blueSupply = blueProduction + purpleFills * reactor.purpleFillBluePoints;
        const redSupply = baseRedProduction + purpleFills * reactor.purpleFillRedPoints;
        const blueBatches = blueRoute * blueSupply / recipeBlue;
        const redBatches = redRoute * redSupply;
        // With overcap enabled the game routes blue before red each tick.
        // When red routing exceeds blue routing, the red overflow consumes
        // every blue batch after blue is stored, leaving none for the next
        // tick's ordinary conversion. At equal or blue-limited red routing,
        // an ordinary tank reserve remains and converts at the encabulator
        // rate. This order matters even in the long-run average.
        const normalBatches = reactor.overcapEnabled && redBatches > blueBatches
            ? 0 : Math.min(blueBatches, redBatches, throughputBatches);
        // SynergismOfficial/src/Calculate.ts calculatePurpleReactantRouting:
        // once both stores are full, overcap can react matching excess at
        // one tenth of ordinary efficiency. One-sided excess returns to the
        // regular bar rather than disappearing.
        const overflowBatches = reactor.overcapEnabled
            ? Math.min(Math.max(0, blueBatches - normalBatches),
                Math.max(0, redBatches - normalBatches)) : 0;
        const totalRoutedBatches = normalBatches + overflowBatches;
        const regularBlueFills = Math.max(0,
            (blueSupply - totalRoutedBatches * recipeBlue) / blueRequirement);
        const regularRedFills = Math.max(0,
            (redSupply - totalRoutedBatches) / redRequirement);
        const purplePoints = (normalBatches + 0.1 * overflowBatches) * recipePurple;
        // Cancer points arrive after a blue/red fill and count toward the
        // following extraction, so they contribute to the sustained rate.
        const bonusFills = reactor.barDependenceEnabled ? 2 * purpleFills : 0;
        return {
            blue: regularBlueFills + Number(reactor.barDependenceEnabled) * purpleFills,
            red: regularRedFills + Number(reactor.barDependenceEnabled) * purpleFills,
            purple: (purplePoints + cancer * (regularBlueFills + regularRedFills + bonusFills))
                / purpleRequirement,
        };
    };

    // Red-Blue Ultrafusion calls addTimers('ambrosia') according to base Red
    // Luck on each red fill, thereby producing additional blue points. It is
    // piecewise linear; its only breakpoints are where blue routing meets
    // the red-reactant or encabulator limits. Solve each region directly
    // instead of iterating over thousands of game ticks per candidate.
    const baseBlueProduction = Math.max(0, input.bluePointsPerSecond);
    // Ultrafusion uses base Red Luck in v4.3.1, while the Red Ambrosia reward
    // still uses TWO MIND's adjusted per-fill luck.
    const accelerator = Math.max(0, input.acceleratorSecondsPerRedAmbrosia)
        * input.redLuck / 100;
    const solveAtPurpleFills = (purpleFills: number) => {
        let blueProduction = baseBlueProduction;
        if (accelerator > 0) {
            const redBatches = redRoute * (baseRedProduction + purpleFills * reactor.purpleFillRedPoints);
            const rebatedBlue = purpleFills * reactor.purpleFillBluePoints;
            const breakpoints = [0,
                blueRoute > 0 ? redBatches * recipeBlue / blueRoute - rebatedBlue : Number.POSITIVE_INFINITY,
                blueRoute > 0 ? throughputBatches * recipeBlue / blueRoute - rebatedBlue : Number.POSITIVE_INFINITY]
                .filter((value) => Number.isFinite(value) && value >= 0)
                .sort((left, right) => left - right);
            const boundaries = [...new Set(breakpoints), Number.POSITIVE_INFINITY];
            let solved = false;
            for (let index = 0; index < boundaries.length - 1; index++) {
                const left = boundaries[index];
                const right = boundaries[index + 1];
                const probe = Number.isFinite(right) ? right : left + Math.max(1, baseBlueProduction);
                if (probe <= left) continue;
                const leftRedFills = ratesAtBlueProduction(left, purpleFills).red;
                const slope = (ratesAtBlueProduction(probe, purpleFills).red - leftRedFills) / (probe - left);
                const denominator = 1 - baseBlueProduction * accelerator * slope;
                if (denominator <= 0) continue;
                const candidate = baseBlueProduction
                    * (1 + accelerator * (leftRedFills - slope * left)) / denominator;
                if (candidate >= left - 1e-9 * Math.max(1, left)
                    && candidate <= right + 1e-9 * Math.max(1, right)) {
                    blueProduction = Math.max(0, candidate);
                    solved = true;
                    break;
                }
            }
            if (!solved) blueProduction = Number.POSITIVE_INFINITY;
        }
        return ratesAtBlueProduction(blueProduction, purpleFills);
    };

    // Rebate points and Cancer rewards form a feedback loop. A secant step
    // solves each linear routing region directly, with fixed-point steps at
    // routing boundaries. No rebate/Cancer case needs only one evaluation.
    let purpleFills = 0;
    let previousPurpleFills = Number.NaN;
    let previousTarget = Number.NaN;
    let rates = solveAtPurpleFills(purpleFills);
    for (let iteration = 0; iteration < 32; iteration++) {
        if (!Number.isFinite(rates.purple)) {
            throw new Error('Heater bar-fill feedback has no finite steady-state rate.');
        }
        if (Math.abs(rates.purple - purpleFills) <= 1e-10 * Math.max(1, rates.purple)) break;
        const slope = (rates.purple - previousTarget) / (purpleFills - previousPurpleFills);
        const secant = (rates.purple - slope * purpleFills) / (1 - slope);
        const next = Number.isFinite(secant) && slope < 1 && secant >= 0
            && secant <= 4 * Math.max(1, purpleFills, rates.purple)
            ? secant : rates.purple;
        previousPurpleFills = purpleFills;
        previousTarget = rates.purple;
        purpleFills = next;
        rates = solveAtPurpleFills(purpleFills);
        if (iteration === 31) {
            throw new Error('Heater bar-fill feedback did not converge.');
        }
    }
    return {
        blueAmbrosiaPerSecond: reactor.barDependenceEnabled ? 0 : rates.blue * blueAmbrosiaPerFill,
        redAmbrosiaPerSecond: reactor.barDependenceEnabled ? 0 : rates.red * redAmbrosiaPerFill,
        blueFillsPerSecond: rates.blue,
        redFillsPerSecond: rates.red,
        purpleFillsPerSecond: rates.purple,
    };
}
