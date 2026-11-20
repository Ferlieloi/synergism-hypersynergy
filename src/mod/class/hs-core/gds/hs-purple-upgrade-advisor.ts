import type {
    AmbrosiaBarIncome,
    AmbrosiaBarIncomeInput,
    AmbrosiaBarIncomeReactor,
} from "../../../types/data-types/hs-ambrosia-income-types";
import { calculateAmbrosiaBarIncome } from "./hs-ambrosia-bar-income";
import {
    getPurpleAmbrosiaUpgradeNextCost,
    getPurpleReactorUpgradeNextCost,
    type PurpleAmbrosiaUpgradeKey,
    type PurpleReactorUpgradeKey,
} from "./hs-gamedata-api-purple";

/** The save's state the ranking starts from. */
export interface PurpleAdvisorInput {
    income: AmbrosiaBarIncomeInput;
    reactorLevels: Partial<Record<PurpleReactorUpgradeKey, number>>;
    zodiacLevels: Partial<Record<PurpleAmbrosiaUpgradeKey, number>>;
    lifetimePurpleHoney: number;
    ariesDigits: number;
    /** Synthesis: Purple Honey and Red Ambrosia spent to craft one Purple Ambrosia. */
    craftPurpleHoneyCost: number;
    craftRedAmbrosiaCost: number;
}

export interface PurpleUpgradeAdvice {
    kind: 'reactor' | 'zodiac';
    key: PurpleReactorUpgradeKey | PurpleAmbrosiaUpgradeKey;
    nextLevel: number;
    /** A reactor upgrade's price, or a zodiac upgrade's Purple Ambrosia crafted from Purple Honey. */
    honeyCost: number;
    /** Zodiac upgrades only, else 0. */
    purpleAmbrosiaCost: number;
    redAmbrosiaCost: number;
    /** Income after the purchase / before it. */
    honeyRatio: number;
    ambrosiaRatio: number;
    redAmbrosiaRatio: number;
    /** ln(honeyRatio) / honeyCost: Purple Honey growth per Purple Honey spent. */
    value: number;
}

export interface PurpleAdvisorResult {
    base: AmbrosiaBarIncome;
    /** Best first; only upgrades that raise Purple Honey income. Empty when there's none (no income, Exalt 10). */
    advice: PurpleUpgradeAdvice[];
}

interface Candidate {
    kind: 'reactor' | 'zodiac';
    key: PurpleReactorUpgradeKey | PurpleAmbrosiaUpgradeKey;
    /** The income input with one more level, from the current level. */
    apply: (input: AmbrosiaBarIncomeInput, level: number, context: PurpleAdvisorInput) => AmbrosiaBarIncomeInput;
}

const change = (input: AmbrosiaBarIncomeInput, values: Partial<AmbrosiaBarIncomeInput>,
    reactor: Partial<AmbrosiaBarIncomeReactor> = {}): AmbrosiaBarIncomeInput =>
    ({ ...input, ...values, reactor: { ...input.reactor, ...reactor } });

// Effects mirror SynergismOfficial/src/Purple.ts and PurpleAmbrosiaUpgrades.ts
const capacity = (key: PurpleReactorUpgradeKey, perLevel: number): Candidate => ({
    kind: 'reactor', key,
    apply: (input) => change(input, {}, { blueCapacity: input.reactor.blueCapacity + perLevel }),
});
const speed = (key: PurpleReactorUpgradeKey): Candidate => ({
    kind: 'reactor', key,
    apply: (input) => change(input, {}, { encabulatorSpeed: input.reactor.encabulatorSpeed + 3 / 50 }),
});
const luck = (key: PurpleReactorUpgradeKey): Candidate => ({
    kind: 'reactor', key,
    apply: (input) => change(input, { purpleHoneyLuck: input.purpleHoneyLuck + 1 }),
});
const efficiency = (key: PurpleReactorUpgradeKey): Candidate => ({
    kind: 'reactor', key,
    apply: (input) => change(input, { purpleHoneyPerExtraction: input.purpleHoneyPerExtraction + 0.01 }),
});
const barSize = (key: PurpleReactorUpgradeKey): Candidate => ({
    kind: 'reactor', key,
    apply: (input, level) => change(input, {}, {
        purpleRequirementWithoutTwoMind: input.reactor.purpleRequirementWithoutTwoMind
            * (1 - 0.004 * (level + 1)) / (1 - 0.004 * level),
    }),
});
// Honey Power: Ambrosia / Red Ambrosia, a generation multiplier
const lifetimeHoneyPower = (level: number, lifetimePurpleHoney: number): number =>
    1 + +(level > 0) * (0.02 + 0.002 * level) * Math.log(1 + lifetimePurpleHoney / 100);
const aries = (level: number, digits: number): number => 1 + 0.0002 * level * digits;

const CANDIDATES: readonly Candidate[] = [
    capacity('purpleCapacityExpander1', 125_000),
    capacity('purpleCapacityExpander2', 150_000),
    capacity('purpleCapacityExpander3', 150_000),
    capacity('purpleCapacityExpander4', 175_000),
    speed('purpleHalfLife1'), speed('purpleHalfLife2'), speed('purpleHalfLife3'), speed('purpleHalfLife4'),
    luck('purpleHoneyLuck1'), luck('purpleHoneyLuck2'), luck('purpleHoneyLuck3'), luck('purpleHoneyLuck4'),
    efficiency('purpleEfficiency1'), efficiency('purpleEfficiency2'),
    efficiency('purpleEfficiency3'), efficiency('purpleEfficiency4'),
    barSize('purpleHoneyRequirementReduction1'), barSize('purpleHoneyRequirementReduction2'),
    barSize('purpleHoneyRequirementReduction3'), barSize('purpleHoneyRequirementReduction4'),
    {
        kind: 'reactor', key: 'tutorial',
        apply: (input, level) => {
            const ratio = (1 + 0.01 * (level + 1)) / (1 + 0.01 * level);
            return change(input, {
                bluePointsPerSecond: input.bluePointsPerSecond * ratio,
                redPointsPerSecond: input.redPointsPerSecond * ratio,
            });
        },
    },
    {
        kind: 'reactor', key: 'lifetimeHoneyAmbrosia',
        apply: (input, level, context) => change(input, {
            bluePointsPerSecond: input.bluePointsPerSecond
                * lifetimeHoneyPower(level + 1, context.lifetimePurpleHoney)
                / lifetimeHoneyPower(level, context.lifetimePurpleHoney),
        }),
    },
    {
        kind: 'reactor', key: 'lifetimeHoneyRedAmbrosia',
        apply: (input, level, context) => change(input, {
            redPointsPerSecond: input.redPointsPerSecond
                * lifetimeHoneyPower(level + 1, context.lifetimePurpleHoney)
                / lifetimeHoneyPower(level, context.lifetimePurpleHoney),
        }),
    },
    {
        // Aries multiplies blue and red generation and the reactor's purple output
        kind: 'zodiac', key: 'aries',
        apply: (input, level, context) => {
            const ratio = aries(level + 1, context.ariesDigits) / aries(level, context.ariesDigits);
            return change(input, {
                bluePointsPerSecond: input.bluePointsPerSecond * ratio,
                redPointsPerSecond: input.redPointsPerSecond * ratio,
            }, { ariesBarPointMultiplier: input.reactor.ariesBarPointMultiplier * ratio });
        },
    },
    {
        kind: 'zodiac', key: 'gemini',
        apply: (input) => change(input, {}, {
            purpleFillBluePoints: input.reactor.purpleFillBluePoints + 50_000,
            purpleFillRedPoints: input.reactor.purpleFillRedPoints + 25,
        }),
    },
    {
        kind: 'zodiac', key: 'cancer',
        apply: (input) => change(input, {}, {
            cancerPurplePointsPerBlueOrRedFill: input.reactor.cancerPurplePointsPerBlueOrRedFill + 500,
        }),
    },
    {
        kind: 'zodiac', key: 'scorpio',
        apply: (input, level) => change(input, {}, {
            scorpioConversionMultiplier: (1 + (level + 1) / 10),
        }),
    },
    // Not Libra: its overcap trades Ambrosia for Purple Honey (all of it at 100% routing), a choice rather than a gain
];

const ratio = (after: number, before: number): number =>
    before > 0 ? after / before : after > 0 ? Number.POSITIVE_INFINITY : 1;

/**
 * Ranks the next level of each Purple upgrade that acts on the bars by Purple Honey growth per Purple Honey spent,
 * as fancia's Purple Heater sheet does, over the mod's sustained income model. Pure: data in, data out.
 */
export function rankPurpleUpgrades(input: PurpleAdvisorInput): PurpleAdvisorResult {
    const base = calculateAmbrosiaBarIncome(input.income);
    const advice: PurpleUpgradeAdvice[] = [];
    if (!(base.purpleHoneyPerSecond > 0)) return { base, advice };

    for (const candidate of CANDIDATES) {
        const isReactor = candidate.kind === 'reactor';
        const level = (isReactor
            ? input.reactorLevels[candidate.key as PurpleReactorUpgradeKey]
            : input.zodiacLevels[candidate.key as PurpleAmbrosiaUpgradeKey]) ?? 0;
        const nextCost = isReactor
            ? getPurpleReactorUpgradeNextCost(candidate.key as PurpleReactorUpgradeKey, level)
            : getPurpleAmbrosiaUpgradeNextCost(candidate.key as PurpleAmbrosiaUpgradeKey, level);
        if (nextCost === null || !(nextCost > 0)) continue;

        let income: AmbrosiaBarIncome;
        try {
            income = calculateAmbrosiaBarIncome(candidate.apply(input.income, level, input));
        } catch {
            // The model has no sustained rate for this change: leave the upgrade out
            continue;
        }

        const honeyCost = isReactor ? nextCost : nextCost * input.craftPurpleHoneyCost;
        const honeyRatio = ratio(income.purpleHoneyPerSecond, base.purpleHoneyPerSecond);
        const value = Math.log(honeyRatio) / honeyCost;
        if (!(value > 0) || !Number.isFinite(value)) continue;

        advice.push({
            kind: candidate.kind,
            key: candidate.key,
            nextLevel: level + 1,
            honeyCost,
            purpleAmbrosiaCost: isReactor ? 0 : nextCost,
            redAmbrosiaCost: isReactor ? 0 : nextCost * input.craftRedAmbrosiaCost,
            honeyRatio,
            ambrosiaRatio: ratio(income.blueRewardPerSecond, base.blueRewardPerSecond),
            redAmbrosiaRatio: ratio(income.redRewardPerSecond, base.redRewardPerSecond),
            value,
        });
    }
    advice.sort((left, right) => right.value - left.value);
    return { base, advice };
}
