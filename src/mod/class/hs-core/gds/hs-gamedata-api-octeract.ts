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
        if (data.singularityChallenges.noOcteracts.enabled || data.singularityChallenges.sadisticPrequel.enabled) return 0;

        const level = Number(upgrade.level ?? 0);
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

        return upgrade.effect ? upgrade.effect(totalLevels, effectKey) : 0;
    }
}
