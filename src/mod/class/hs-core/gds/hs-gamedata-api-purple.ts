import type { GameData } from "../../../types/data-types/hs-player-savedata";

export interface PurpleHelperContext {
    getGameData: () => GameData | undefined;
    calculateBlueberryInventory: () => number;
    getOcteractUpgradeEffect: (upgradeKey: string, effectKey?: string) => number;
}

export type PurpleReactorUpgradeKey =
    | 'tutorial'
    | 'purpleHoneyRequirementReduction1'
    | 'purpleHoneyRequirementReduction2'
    | 'purpleHoneyRequirementReduction3'
    | 'purpleHoneyRequirementReduction4'
    | 'purpleHalfLife1'
    | 'purpleHalfLife2'
    | 'purpleHalfLife3'
    | 'purpleHalfLife4'
    | 'purpleCapacityExpander1'
    | 'purpleCapacityExpander2'
    | 'purpleCapacityExpander3'
    | 'purpleCapacityExpander4'
    | 'lifetimeHoneyAscensionSpeed'
    | 'lifetimeHoneyAmbrosia'
    | 'lifetimeHoneyRedAmbrosia';

interface PurpleUpgradeDefinition {
    maxLevel: number;
    costFormula: (level: number) => number;
}

// Names and formulas mirror SynergismOfficial/src/Purple.ts. Saved values are
// cumulative Purple Honey investments, so levels must be reconstructed.
const purpleReactorUpgradeData: Record<PurpleReactorUpgradeKey, PurpleUpgradeDefinition> = {
    tutorial: { maxLevel: 15, costFormula: (level) => level * (level + 1) / 2 },
    purpleHalfLife1: { maxLevel: 50, costFormula: (level) => 12 * level },
    purpleHalfLife2: { maxLevel: 50, costFormula: (level) => 240 * level },
    purpleHalfLife3: { maxLevel: 50, costFormula: (level) => 4_800 * level },
    purpleHalfLife4: { maxLevel: 50, costFormula: (level) => 96_000 * level },
    purpleCapacityExpander1: { maxLevel: 10_000, costFormula: (level) => Math.pow(level, 1.1) },
    purpleCapacityExpander2: { maxLevel: 10_000, costFormula: (level) => 10 * Math.pow(level, 1.2) },
    purpleCapacityExpander3: { maxLevel: 10_000, costFormula: (level) => 100 * Math.pow(level, 1.25) },
    purpleCapacityExpander4: { maxLevel: 10_000, costFormula: (level) => 1_000 * Math.pow(level, 1.3) },
    purpleHoneyRequirementReduction1: { maxLevel: 25, costFormula: (level) => 20 * level },
    purpleHoneyRequirementReduction2: { maxLevel: 25, costFormula: (level) => 400 * level },
    purpleHoneyRequirementReduction3: { maxLevel: 25, costFormula: (level) => 8_000 * level },
    purpleHoneyRequirementReduction4: { maxLevel: 25, costFormula: (level) => 160_000 * level },
    lifetimeHoneyAscensionSpeed: { maxLevel: 10, costFormula: (level) => 2_000 * level },
    lifetimeHoneyAmbrosia: { maxLevel: 10, costFormula: (level) => 10_000 * level },
    lifetimeHoneyRedAmbrosia: { maxLevel: 15, costFormula: (level) => 10_000 * level },
};

const purpleAmbrosiaUpgradeData = {
    aries: { maxLevel: 25, costFormula: (level: number) => level * (level + 1) / 2 },
    taurus: { maxLevel: 10, costFormula: (level: number) => 50 * level },
    gemini: { maxLevel: 10, costFormula: (level: number) => 8 * level },
    cancer: { maxLevel: 10, costFormula: (level: number) => 8 * level },
    leo: { maxLevel: 25, costFormula: (level: number) => 125 * level },
    virgo: { maxLevel: 15, costFormula: (level: number) => 60 * level },
    libra: { maxLevel: 1, costFormula: (level: number) => 1001 * level },
    scorpio: { maxLevel: 10, costFormula: (level: number) => 750 * level },
    // Mirrors SynergismOfficial/src/PurpleAmbrosiaUpgrades.ts: the first
    // Sagittarius level costs 40 Purple Ambrosia, then each later level adds 200.
    sagittarius: { maxLevel: 11, costFormula: (level: number) => level > 1 ? 40 + 200 * (level - 1) : 40 * level },
    capricorn: {
        maxLevel: 11,
        costFormula: (level: number) => level > 1 ? 1_000 + 300 * (level - 1) : 1_000 * level,
    },
    aquarius: { maxLevel: 1, costFormula: (level: number) => 3_000 * level },
    pisces: { maxLevel: 1, costFormula: (level: number) => 5_000 * level },
} as const;

export class PurpleHelper {
    readonly #ctx: PurpleHelperContext;

    constructor(ctx: PurpleHelperContext) {
        this.#ctx = ctx;
    }

    #reconstructLevel(invested: number, definition: PurpleUpgradeDefinition, tolerance = 0): number {
        let low = 0;
        let high = definition.maxLevel;
        while (low < high) {
            const middle = low + Math.ceil((high - low) / 2);
            if (definition.costFormula(middle) <= invested + tolerance) low = middle;
            else high = middle - 1;
        }
        return low;
    }

    getPurpleReactorUpgradeLevel(upgradeKey: PurpleReactorUpgradeKey): number {
        const invested = Number(this.#ctx.getGameData()?.purpleReactorUpgrades?.[upgradeKey] ?? 0);
        if (!Number.isFinite(invested) || invested < 0) return 0;
        return this.#reconstructLevel(invested, purpleReactorUpgradeData[upgradeKey], 0.001);
    }

    getPurpleReactorUpgradeEffects(upgradeKey: PurpleReactorUpgradeKey, effectKey: string): number {
        const data = this.#ctx.getGameData();
        if (!data) return 0;
        const level = this.getPurpleReactorUpgradeLevel(upgradeKey);
        const lifetimePurpleHoney = Number(data.purpleReactor?.lifetimePurpleHoney ?? 0);

        if (upgradeKey === 'tutorial') return 1 + 0.01 * level;
        // SynergismOfficial/src/Purple.ts: all four catalysts add 3/50 per level.
        if (upgradeKey.startsWith('purpleHalfLife') && effectKey === 'encabulatorSpeed') {
            return 3 / 50 * level;
        }
        if (upgradeKey.startsWith('purpleCapacityExpander')) {
            const capacityPerLevel = upgradeKey === 'purpleCapacityExpander1' ? 125_000
                : upgradeKey === 'purpleCapacityExpander4' ? 175_000 : 150_000;
            if (effectKey === 'ambrosiaCapacity') return capacityPerLevel * level;
            if (effectKey === 'redCapacity') return capacityPerLevel / 1_000 * level;
        }
        if (upgradeKey.startsWith('purpleHoneyRequirementReduction')) return 1 - 0.004 * level;

        const logHoney = Math.log(1 + lifetimePurpleHoney / 100);
        if (upgradeKey === 'lifetimeHoneyAscensionSpeed' && effectKey === 'ascensionSpeedMultiplier') {
            return 1 + +(level > 0) * (0.08 + 0.008 * level) * logHoney;
        }
        if (upgradeKey === 'lifetimeHoneyAmbrosia' && effectKey === 'ambrosiaGenerationSpeed') {
            return 1 + +(level > 0) * (0.02 + 0.002 * level) * logHoney;
        }
        if (upgradeKey === 'lifetimeHoneyRedAmbrosia' && effectKey === 'redAmbrosiaGenerationSpeed') {
            return 1 + +(level > 0) * (0.02 + 0.002 * level) * logHoney;
        }
        return 0;
    }

    getPurpleAmbrosiaUpgradeLevel(upgradeKey: keyof typeof purpleAmbrosiaUpgradeData): number {
        const invested = Number(this.#ctx.getGameData()?.purpleAmbrosiaUpgrades?.[upgradeKey] ?? 0);
        if (!Number.isFinite(invested) || invested < 0) return 0;
        return this.#reconstructLevel(invested, purpleAmbrosiaUpgradeData[upgradeKey]);
    }

    getPurpleAmbrosiaUpgradeEffects(upgradeKey: keyof typeof purpleAmbrosiaUpgradeData, effectKey: string): number {
        const data = this.#ctx.getGameData();
        if (!data) return 0;
        const level = this.getPurpleAmbrosiaUpgradeLevel(upgradeKey);
        if (upgradeKey === 'aries' && effectKey === 'universalBarPointMult') {
            const digits = [data.lifetimeAmbrosia, data.lifetimeRedAmbrosia, data.lifetimePurpleAmbrosia ?? 0]
                .reduce((total, ambrosia) => total + (ambrosia > 0 ? Math.floor(Math.log10(ambrosia)) + 1 : 0), 0);
            return 1 + 0.0002 * level * digits;
        }
        if (upgradeKey === 'leo' && effectKey === 'unassignedBlueberyLuck') {
            const unassignedBlueberries = this.#ctx.calculateBlueberryInventory() - data.spentBlueberries;
            return unassignedBlueberries >= 5 ? unassignedBlueberries * level : 0;
        }
        if (upgradeKey === 'taurus' && effectKey === 'taxDivisor') return 1 + level / 10;
        if (upgradeKey === 'gemini') {
            return effectKey === 'ambrosiaBarPointsOnFill' ? 50_000 * level : 25 * level;
        }
        if (upgradeKey === 'cancer' && effectKey === 'purpleBarPointsOnFill') return 500 * level;
        if (upgradeKey === 'virgo' && effectKey === 'assignedBlueberrySalvage') return data.spentBlueberries * level;
        if (upgradeKey === 'libra' && effectKey === 'overcapToggleUnlocked') return +(level > 0);
        if (upgradeKey === 'scorpio' && effectKey === 'purpleReactorConversionMult') return 1 + level / 10;
        if (upgradeKey === 'sagittarius') {
            if (effectKey === 'horseShoeRuneCoefficient') {
                return level >= 2 ? (1 / 20) * 0.1 * (level - 1) : 0;
            }
            return +(level > 0);
        }
        if (upgradeKey === 'capricorn') {
            if (effectKey === 'antiquitiesOfAntGodCoefficient') {
                return level >= 2 ? (1 / 50) * 0.1 * (level - 1) : 0;
            }
            return +(level > 0);
        }
        if (upgradeKey === 'aquarius' && effectKey === 'infiniteTranscriptionExponent') {
            return level / 100 * this.#ctx.getOcteractUpgradeEffect('octeractOneMindImprover', 'ascendSpeedExponent');
        }
        if (upgradeKey === 'pisces' && effectKey === 'platonicBetaAtStart') return +(level > 0);
        return 0;
    }
}
