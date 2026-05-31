import { goldenQuarkUpgradeMaxLevels } from "./stored-vars-and-calculations";
import type { GameData } from "../../../types/data-types/hs-player-savedata";
import type { CalculationMode, GoldenQuarkUpgradeKey, OcteractUpgradeKey } from "../../../types/data-types/hs-gamedata-api-types";

export interface GoldenQuarkHelperContext {
    getGameData: () => GameData | undefined;
    getShopUpgradeEffects: (upgradeKey: string, effectKey: string, mode?: CalculationMode) => number | boolean;
    getSavedUpgradeFreeLevel: (upgrade?: { freeLevel?: number; freeLevels?: number }) => number;
    getOcteractUpgradeEffect: (upgradeKey: OcteractUpgradeKey, effectKey?: string) => number;
    getFavoriteUpgradeMaxedDependencyCount: () => number;
}

export class GoldenQuarkHelper {
    readonly #ctx: GoldenQuarkHelperContext;

    constructor(ctx: GoldenQuarkHelperContext) {
        this.#ctx = ctx;
    }

    computeFreeLevelMultiplierGQ(): number {
        return Number(this.#ctx.getShopUpgradeEffects('shopSingularityPotency', 'freeUpgradeMult')) + 0.3 / 100 * (this.#ctx.getGameData()?.cubeUpgrades[75] ?? 0);
    }

    computeGQUpgradeFreeLevelSoftcap(upgradeKey: GoldenQuarkUpgradeKey): number {
        const data = this.#ctx.getGameData();
        if (!data) return 0;

        const upgrade = data.goldenQuarkUpgrades[upgradeKey];
        const freeLevelMult = this.computeFreeLevelMultiplierGQ();
        const freeLevel = this.#ctx.getSavedUpgradeFreeLevel(upgrade);

        const baseRealFreeLevels = freeLevelMult * freeLevel;
        return Math.min(upgrade.level, baseRealFreeLevels) + Math.sqrt(Math.max(0, baseRealFreeLevels - upgrade.level));
    }

    computeGQUpgradeMaxLevel(upgradeKey: GoldenQuarkUpgradeKey): number {
        const data = this.#ctx.getGameData();
        if (!data) return 0;

        const upgrade = goldenQuarkUpgradeMaxLevels[upgradeKey];
        if (!upgrade.canExceedCap) {
            return upgrade.maxLevel;
        }

        let cap = upgrade.maxLevel;
        const overclockPerks = [50, 60, 75, 100, 125, 150, 175, 200, 225, 250];
        for (const perk of overclockPerks) {
            if (data.highestSingularityCount >= perk) {
                cap += 1;
            } else {
                break;
            }
        }

        cap += this.#ctx.getOcteractUpgradeEffect('octeractSingUpgradeCap', 'goldenQuarkUpgradeCapIncrease');
        return cap;
    }

    actualGQUpgradeTotalLevels(upgradeKey: GoldenQuarkUpgradeKey): number {
        const data = this.#ctx.getGameData();
        if (!data) return 0;

        const upgrade = goldenQuarkUpgradeMaxLevels[upgradeKey];

        if ((data.singularityChallenges.noSingularityUpgrades.enabled || data.singularityChallenges.sadisticPrequel.enabled) && !upgrade.qualityOfLife) {
            return 0;
        }
        if ((data.singularityChallenges.limitedAscensions.enabled || data.singularityChallenges.limitedTime.enabled || data.singularityChallenges.sadisticPrequel.enabled)
            && upgradeKey === 'platonicDelta') {
            return 0;
        }

        const actualFreeLevels = this.computeGQUpgradeFreeLevelSoftcap(upgradeKey);
        const level = Number(data.goldenQuarkUpgrades[upgradeKey].level ?? 0);
        const linearLevels = level + actualFreeLevels;
        let polynomialLevels = 0;

        if (this.#ctx.getOcteractUpgradeEffect('octeractImprovedFree')) {
            let exponent = 0.6;
            exponent += this.#ctx.getOcteractUpgradeEffect('octeractImprovedFree2');
            exponent += this.#ctx.getOcteractUpgradeEffect('octeractImprovedFree3');
            exponent += this.#ctx.getOcteractUpgradeEffect('octeractImprovedFree4');
            polynomialLevels = Math.pow(level * actualFreeLevels, exponent);
        }

        return Math.max(linearLevels, polynomialLevels);
    }

    getGQUpgradeEffect(upgradeKey: GoldenQuarkUpgradeKey): number {
        const upgrade = goldenQuarkUpgradeMaxLevels[upgradeKey];
        const totalLevels = this.actualGQUpgradeTotalLevels(upgradeKey);

        if (upgradeKey === 'favoriteUpgrade') {
            return this.calculateFavoriteUpgradeEffect(totalLevels);
        }

        return upgrade.effect ? upgrade.effect(totalLevels) : 0;
    }

    calculateFavoriteUpgradeEffect(totalLevels: number): number {
        const maxedCount = this.#ctx.getFavoriteUpgradeMaxedDependencyCount();
        return 1 + totalLevels / 5000 * (maxedCount + 6);
    }
}
