import { octeractUpgradeMaxLevels } from "./stored-vars-and-calculations";
import type { GameData } from "../../../types/data-types/hs-player-savedata";
import type { OcteractUpgradeKey } from "../../../types/data-types/hs-gamedata-api-types";

export interface OcteractHelperContext {
    getGameData: () => GameData | undefined;
    getSavedUpgradeFreeLevel: (upgrade?: { freeLevel?: number; freeLevels?: number }) => number;
}

export class OcteractHelper {
    readonly #ctx: OcteractHelperContext;

    constructor(ctx: OcteractHelperContext) {
        this.#ctx = ctx;
    }

    computeFreeLevelMultiplierOCT(): number {
        return 1 + 0.3 / 100 * (this.#ctx.getGameData()?.cubeUpgrades[78] ?? 0);
    }

    getOcteractUpgradeLevel(upgradeKey: OcteractUpgradeKey): number {
        const saved = this.#ctx.getGameData()?.octUpgrades[upgradeKey];
        if (!saved) return 0;

        const definition = octeractUpgradeMaxLevels[upgradeKey];
        const investment = Number(saved.octeractsInvested);
        if (!Number.isFinite(investment)) {
            return investment === Number.POSITIVE_INFINITY ? definition.maxLevel : Number(saved.level ?? 0);
        }
        if (investment < 0) return 0;

        let low = 0;
        let high = definition.maxLevel;
        while (low < high) {
            const middle = low + Math.ceil((high - low) / 2);
            if (definition.costFormula(middle) <= investment) low = middle;
            else high = middle - 1;
        }
        return low;
    }

    computeOcteractFreeLevelSoftcap(upgradeKey: OcteractUpgradeKey): number {
        const data = this.#ctx.getGameData();
        if (!data) return 0;

        const upgrade = data.octUpgrades[upgradeKey];
        if (!upgrade) return 0;

        const freeLevelMult = this.computeFreeLevelMultiplierOCT();
        return this.#ctx.getSavedUpgradeFreeLevel(upgrade) * freeLevelMult;
    }

    actualOcteractUpgradeTotalLevels(upgradeKey: OcteractUpgradeKey): number {
        const data = this.#ctx.getGameData();
        if (!data) return 0;

        const upgrade = data.octUpgrades[upgradeKey];
        if (!upgrade) return 0;
        const definition = octeractUpgradeMaxLevels[upgradeKey];
        if ((data.singularityChallenges.noOcteracts.enabled || data.singularityChallenges.sadisticPrequel.enabled)
            && !definition.qualityOfLife) return 0;

        const level = this.getOcteractUpgradeLevel(upgradeKey);
        const actualFreeLevels = this.computeOcteractFreeLevelSoftcap(upgradeKey);
        if (!Number.isFinite(level) || !Number.isFinite(actualFreeLevels)) return 0;

        if (level >= actualFreeLevels) {
            return actualFreeLevels + level;
        }

        return 2 * Math.sqrt(actualFreeLevels * level);
    }

    getOcteractUpgradeEffect(upgradeKey: OcteractUpgradeKey, effectKey?: string): number {
        const data = this.#ctx.getGameData();
        if (!data) return 0;

        const upgrade = octeractUpgradeMaxLevels[upgradeKey];
        const totalLevels = this.actualOcteractUpgradeTotalLevels(upgradeKey);
        if (!Number.isFinite(totalLevels)) return 0;

        if ((upgradeKey === 'octeractImprovedAscensionSpeed' || upgradeKey === 'octeractImprovedAscensionSpeed2')
            && effectKey === 'ascensionSpeedMult') {
            return 1 + totalLevels * data.singularityCount / 2000;
        }

        return upgrade.effect ? upgrade.effect(totalLevels, effectKey) : 0;
    }
}
