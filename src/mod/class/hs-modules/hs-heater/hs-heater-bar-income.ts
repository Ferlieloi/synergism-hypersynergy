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
    const redProduction = Math.max(0, input.redPointsPerSecond);
    const redBatches = redRoute * redProduction;
    const throughputBatches = reactor.blueCapacity * reactor.encabulatorSpeed
        / 100 / 3_600 / recipeBlue;
    const purpleToBlue = reactor.purpleFillBluePoints / blueRequirement
        + Number(reactor.barDependenceEnabled);
    const purpleToRed = reactor.purpleFillRedPoints / redRequirement
        + Number(reactor.barDependenceEnabled);
    const cancer = reactor.cancerPurplePointsPerBlueOrRedFill;
    const feedbackDenominator = purpleRequirement - cancer * (purpleToBlue + purpleToRed);
    if (!(feedbackDenominator > 0)) {
        throw new Error('Heater bar-fill feedback has no finite steady-state rate.');
    }

    const ratesAtBlueProduction = (blueProduction: number) => {
        const blueBatches = blueRoute * blueProduction / recipeBlue;
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
            (blueProduction - totalRoutedBatches * recipeBlue) / blueRequirement);
        const regularRedFills = Math.max(0,
            (redProduction - totalRoutedBatches) / redRequirement);
        const purplePoints = (normalBatches + 0.1 * overflowBatches) * recipePurple;
        const purpleFills = (purplePoints + cancer * (regularBlueFills + regularRedFills))
            / feedbackDenominator;
        return {
            blue: regularBlueFills + purpleToBlue * purpleFills,
            red: regularRedFills + purpleToRed * purpleFills,
            purple: purpleFills,
        };
    };

    // Red Ambrosia Accelerator calls addTimers('ambrosia') for each red
    // reward, thereby producing additional blue points. The system is
    // piecewise linear; its only breakpoints are where blue routing meets
    // the red-reactant or encabulator limits. Solve each region directly
    // instead of iterating over thousands of game ticks per candidate.
    const baseBlueProduction = Math.max(0, input.bluePointsPerSecond);
    const accelerator = Math.max(0, input.acceleratorSecondsPerRedAmbrosia)
        * redAmbrosiaPerFill;
    let blueProduction = baseBlueProduction;
    if (accelerator > 0) {
        const breakpoints = [0,
            blueRoute > 0 ? redBatches * recipeBlue / blueRoute : Number.POSITIVE_INFINITY,
            blueRoute > 0 ? throughputBatches * recipeBlue / blueRoute : Number.POSITIVE_INFINITY]
            .filter((value) => Number.isFinite(value) && value >= 0)
            .sort((left, right) => left - right);
        const boundaries = [...new Set(breakpoints), Number.POSITIVE_INFINITY];
        let solved = false;
        for (let index = 0; index < boundaries.length - 1; index++) {
            const left = boundaries[index];
            const right = boundaries[index + 1];
            const probe = Number.isFinite(right) ? right : left + Math.max(1, baseBlueProduction);
            if (probe <= left) continue;
            const leftRedFills = ratesAtBlueProduction(left).red;
            const slope = (ratesAtBlueProduction(probe).red - leftRedFills) / (probe - left);
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

    const rates = ratesAtBlueProduction(blueProduction);
    return {
        blueAmbrosiaPerSecond: reactor.barDependenceEnabled ? 0 : rates.blue * blueAmbrosiaPerFill,
        redAmbrosiaPerSecond: reactor.barDependenceEnabled ? 0 : rates.red * redAmbrosiaPerFill,
        blueFillsPerSecond: rates.blue,
        redFillsPerSecond: rates.red,
        purpleFillsPerSecond: rates.purple,
    };
}
