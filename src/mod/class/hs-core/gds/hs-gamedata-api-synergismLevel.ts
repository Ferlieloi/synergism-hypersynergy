import { AntProducers, LAST_ANT_PRODUCER, type AmbrosiaUpgradeNames, type GoldenQuarkUpgradeKey, type OcteractUpgradeKey, type RedAmbrosiaUpgradeKey, type SingularityChallengeDataKeys } from "../../../types/data-types/hs-gamedata-api-types";
import type { GameData } from "../../../types/data-types/hs-player-savedata";
import type { HSGameDataAPI } from "./hs-gamedata-api";
import { dailyFreeLevelCaps } from "./hs-gamedata-api-goldenQuark";
import { dailyOcteractFreeLevelCaps } from "./hs-gamedata-api-octeract";
import { goldenQuarkUpgradeMaxLevels, octeractUpgradeMaxLevels, SINGULARITY_CHALLENGE_DATA } from "./hs-gamedata-tables";

/** Achievement-point inputs copied from SynergismOfficial/src/Shop.ts. */
const QUARK_UPGRADE_MAX_LEVELS: Record<string, number> = {
    offeringEX: 60, offeringAuto: 100, obtainiumEX: 60, obtainiumAuto: 100,
    instantChallenge: 1, antSpeed: 60, cashGrab: 60, shopTalisman: 1,
    seasonPass: 60, challengeExtension: 5, challengeTome: 15, cubeToQuark: 1,
    tesseractToQuark: 1, hypercubeToQuark: 1, seasonPass2: 100, seasonPass3: 100,
    chronometer: 60, infiniteAscent: 1, calculator: 5, calculator2: 12,
    calculator3: 10, calculator4: 10, calculator5: 100, calculator6: 100,
    constantEX: 2, powderEX: 50, chronometer2: 100, chronometer3: 1000,
    seasonPassY: 100, seasonPassZ: 1000, challengeTome2: 5, instantChallenge2: 1,
    cubeToQuarkAll: 100, cashGrab2: 1000, chronometerZ: 1000, offeringEX2: 1000,
    obtainiumEX2: 1000, powderAuto: 100, seasonPassLost: 1000, challenge15Auto: 1,
    extraWarp: 1, autoWarp: 1, improveQuarkHept: 10, improveQuarkHept2: 10,
    improveQuarkHept3: 10, improveQuarkHept4: 10, shopImprovedDaily: 20,
    shopImprovedDaily2: 10, shopImprovedDaily3: 15, shopImprovedDaily4: 25,
    offeringEX3: 1000, obtainiumEX3: 1000, improveQuarkHept5: 7777,
    chronometerInfinity: 1000, seasonPassInfinity: 1000,
    shopSingularityPenaltyDebuff: 4, shopAmbrosiaLuckMultiplier4: 4, calculator7: 50,
    shopOcteractAmbrosiaLuck: 2, shopAmbrosiaGeneration1: 25,
    shopAmbrosiaGeneration2: 30, shopAmbrosiaGeneration3: 35,
    shopAmbrosiaGeneration4: 1000, shopAmbrosiaLuck1: 40, shopAmbrosiaLuck2: 50,
    shopAmbrosiaLuck3: 60, shopAmbrosiaLuck4: 1000, shopRedLuck1: 1000,
    shopRedLuck2: 1000, shopRedLuck3: 1000, shopRedLuck4: 1000,
    shopCashGrabUltra: 5, shopAmbrosiaAccelerator: 5, shopEXUltra: 80,
    shopChronometerS: 1, shopAmbrosiaUltra: 5, shopSingularitySpeedup: 1,
    shopSingularityPotency: 1, shopSadisticRune: 1, shopInfiniteShopUpgrades: 100,
    shopHorseShoe: 1, shopPurpleBarRebate: 10, shopPanthema: 1,
};

/** Purple Reactor AP data copied from SynergismOfficial/src/Purple.ts. */
const PURPLE_REACTOR_AP_DATA: Array<{
    key: string;
    maxLevel: number;
    perLevelAP: number;
    maxLevelAP: number;
    costFormula: (level: number) => number;
}> = [
    { key: 'tutorial', maxLevel: 15, perLevelAP: 1, maxLevelAP: 0, costFormula: (level) => level * (level + 1) / 2 },
    { key: 'purpleEfficiency1', maxLevel: 20, perLevelAP: 0.5, maxLevelAP: 5, costFormula: (level) => 3 * level },
    { key: 'purpleEfficiency2', maxLevel: 20, perLevelAP: 0.5, maxLevelAP: 10, costFormula: (level) => 60 * level },
    { key: 'purpleEfficiency3', maxLevel: 30, perLevelAP: 0.5, maxLevelAP: 10, costFormula: (level) => 1_200 * level },
    { key: 'purpleEfficiency4', maxLevel: 30, perLevelAP: 0.5, maxLevelAP: 15, costFormula: (level) => 24_000 * level },
    { key: 'purpleHoneyLuck1', maxLevel: 10, perLevelAP: 1, maxLevelAP: 5, costFormula: (level) => 7 * level },
    { key: 'purpleHoneyLuck2', maxLevel: 15, perLevelAP: 1, maxLevelAP: 5, costFormula: (level) => 140 * level },
    { key: 'purpleHoneyLuck3', maxLevel: 20, perLevelAP: 1, maxLevelAP: 5, costFormula: (level) => 2_800 * level },
    { key: 'purpleHoneyLuck4', maxLevel: 25, perLevelAP: 1, maxLevelAP: 5, costFormula: (level) => 56_000 * level },
    { key: 'purpleHalfLife1', maxLevel: 50, perLevelAP: 0.2, maxLevelAP: 10, costFormula: (level) => 12 * level },
    { key: 'purpleHalfLife2', maxLevel: 50, perLevelAP: 0.3, maxLevelAP: 10, costFormula: (level) => 240 * level },
    { key: 'purpleHalfLife3', maxLevel: 50, perLevelAP: 0.4, maxLevelAP: 10, costFormula: (level) => 4_800 * level },
    { key: 'purpleHalfLife4', maxLevel: 50, perLevelAP: 0.5, maxLevelAP: 10, costFormula: (level) => 96_000 * level },
    { key: 'paperweight', maxLevel: 100, perLevelAP: 0.3, maxLevelAP: 20, costFormula: (level) => Math.pow(level, 3) },
    { key: 'purpleCapacityExpander1', maxLevel: 10_000, perLevelAP: 0, maxLevelAP: 30, costFormula: (level) => Math.pow(level, 1.1) },
    { key: 'purpleCapacityExpander2', maxLevel: 10_000, perLevelAP: 0, maxLevelAP: 40, costFormula: (level) => 10 * Math.pow(level, 1.2) },
    { key: 'purpleCapacityExpander3', maxLevel: 10_000, perLevelAP: 0, maxLevelAP: 50, costFormula: (level) => 100 * Math.pow(level, 1.25) },
    { key: 'purpleCapacityExpander4', maxLevel: 10_000, perLevelAP: 0, maxLevelAP: 60, costFormula: (level) => 1_000 * Math.pow(level, 1.3) },
    { key: 'purpleHoneyRequirementReduction1', maxLevel: 25, perLevelAP: 0.4, maxLevelAP: 5, costFormula: (level) => 20 * level },
    { key: 'purpleHoneyRequirementReduction2', maxLevel: 25, perLevelAP: 0.4, maxLevelAP: 5, costFormula: (level) => 400 * level },
    { key: 'purpleHoneyRequirementReduction3', maxLevel: 25, perLevelAP: 0.4, maxLevelAP: 5, costFormula: (level) => 8_000 * level },
    { key: 'purpleHoneyRequirementReduction4', maxLevel: 25, perLevelAP: 0.4, maxLevelAP: 5, costFormula: (level) => 160_000 * level },
    { key: 'obtainium', maxLevel: 100_000, perLevelAP: 0, maxLevelAP: 40, costFormula: (level) => 10 * Math.pow(level, 1.2) },
    { key: 'offerings', maxLevel: 100_000, perLevelAP: 0, maxLevelAP: 40, costFormula: (level) => 10 * Math.pow(level, 1.2) },
    { key: 'lifetimeHoneyQuarks', maxLevel: 10, perLevelAP: 1, maxLevelAP: 5, costFormula: (level) => 500 * level },
    { key: 'lifetimeHoneyGlobalSpeed', maxLevel: 10, perLevelAP: 1, maxLevelAP: 0, costFormula: (level) => 2_000 * level },
    { key: 'lifetimeHoneyAscensionSpeed', maxLevel: 10, perLevelAP: 1, maxLevelAP: 0, costFormula: (level) => 2_000 * level },
    { key: 'lifetimeHoneyAmbrosia', maxLevel: 10, perLevelAP: 1, maxLevelAP: 5, costFormula: (level) => 10_000 * level },
    { key: 'lifetimeHoneyRedAmbrosia', maxLevel: 15, perLevelAP: 1, maxLevelAP: 0, costFormula: (level) => 10_000 * level },
    { key: 'lifetimeHoneyAntELO', maxLevel: 50, perLevelAP: 1, maxLevelAP: 5, costFormula: (level) => 15_000 * level },
    { key: 'lifetimeHoneyRebornELOSpeed', maxLevel: 50, perLevelAP: 1, maxLevelAP: 0, costFormula: (level) => 15_000 * level },
    { key: 'purpleQuarkGain', maxLevel: 5, perLevelAP: 2, maxLevelAP: 10, costFormula: (level) => 2_000 * (Math.pow(4, level) - 1) / 3 },
];

export type ProgressiveAchievements =
    | 'runeLevel'
    | 'freeRuneLevel'
    | 'quarkUpgrades'
    | 'antMasteries'
    | 'rebornELO'
    | 'talismanRarities'
    | 'singularityCount'
    | 'ambrosiaCount'
    | 'redAmbrosiaCount'
    | 'singularityUpgrades'
    | 'octeractUpgrades'
    | 'redAmbrosiaUpgrades'
    | 'exalts'
    | 'purpleHoneyUpgrades'
    | 'purpleAmbrosiaUpgrades'

/**
 * Class: SynergismLevelHelper
 * IsExplicitHSModule: No
 * Description:
 *     The Synergism level: the achievement points of the achievements and of the progressive achievements
 *     (pointsAwarded in SynergismOfficial/src/Achievements.ts), and the AP calculations they need.
 * Author: XxMolkxX
 */
export class SynergismLevelHelper {
    readonly #api: HSGameDataAPI;

    // calculateSynergismLevel's result for the current data, until the cache generation changes
    #synergismLevel: number | undefined;
    #lastCacheGeneration?: number;

    // The points of each progressive achievement. Its argument is the value the save holds for it, which only some read
    readonly #progressiveAchievementPoints: Record<ProgressiveAchievements, (saved: number) => number>;

    constructor(api: HSGameDataAPI) {
        this.#api = api;
        this.#progressiveAchievementPoints = this.#createProgressiveAchievementPoints();
    }

    get #gameData(): GameData | undefined {
        return this.#api.getGameData();
    }

    #createProgressiveAchievementPoints(): Record<ProgressiveAchievements, (saved: number) => number> {
        return {
            runeLevel: (saved) => Math.min(200, Math.floor(saved / 1000)) + Math.min(400, Math.floor(saved / 2500))
                + Math.min(400, Math.floor(saved / 12500)),
            freeRuneLevel: (saved) => Math.min(100, Math.floor(saved / 250)) + Math.min(200, Math.floor(saved / 750))
                + Math.min(200, Math.floor(saved / 2500)),
            quarkUpgrades: () => this.calculateQuarkUpgradeAchievementAP(),
            antMasteries: () => {
                let pointValue = 0
                const data = this.#gameData;
                if (!data) return 0;
                for (let ant = AntProducers.Workers; ant <= LAST_ANT_PRODUCER; ant++) {
                    const highestMastery = data.ants.masteries[ant]?.highestMastery ?? 0;
                    pointValue += 3 * highestMastery
                    if (highestMastery >= 12) {
                        pointValue += 4
                    }
                }
                return pointValue
            },
            rebornELO: () => {
                const leaderboardELO = this.calculateLeaderboardValue(this.#gameData?.ants.highestRebornELOEver ?? [])
                return Math.min(100, Math.floor(leaderboardELO / 100))
                    + Math.min(150, Math.floor(leaderboardELO / 1000))
                    + Math.min(150, Math.floor(leaderboardELO / 9000))
                    + Math.min(200, Math.floor(leaderboardELO / 75000))
                    + Math.min(400, Math.floor(leaderboardELO / 150000))
            },
            singularityCount: () => {
                const highestSing = this.#gameData?.highestSingularityCount ?? 0;
                return 9 * highestSing
                    + 3 * Math.max(0, highestSing - 100)
                    + 3 * Math.max(0, highestSing - 200)
            },
            ambrosiaCount: (saved) => Math.min(200, Math.floor(saved / 100))
                + Math.min(200, Math.floor(saved / 10000))
                + Math.min(400, Math.floor(400 * Math.sqrt(saved / 1e8))),
            redAmbrosiaCount: (saved) => Math.min(200, Math.floor(saved / 25))
                + Math.min(200, Math.floor(saved / 2500))
                + Math.min(400, Math.floor(400 * saved / 5e6))
                + Math.min(200, Math.floor(200 * saved / 1.25e7)),
            exalts: () => {
                let pointValue = 0
                const data = this.#gameData;
                if (!data) return 0;
                for (const chal of Object.keys(data.singularityChallenges) as SingularityChallengeDataKeys[]) {
                    pointValue += this.getSingChalApReward(chal)
                }
                return pointValue
            },
            singularityUpgrades: () => {
                let pointValue = 0
                const data = this.#gameData;
                if (!data) return 0;
                for (const upgradeKey of Object.keys(goldenQuarkUpgradeMaxLevels) as GoldenQuarkUpgradeKey[]) {
                    const maxLevel = goldenQuarkUpgradeMaxLevels[upgradeKey].maxLevel
                    const playerLevel = this.#api.goldenQuark.getGQUpgradeLevel(upgradeKey)

                    if (playerLevel >= maxLevel) {
                        pointValue += 6
                    }
                    const freeCap = dailyFreeLevelCaps[upgradeKey];
                    if (freeCap !== undefined && this.#api.getSavedUpgradeFreeLevel(data.goldenQuarkUpgrades[upgradeKey]) >= freeCap) {
                        pointValue += 6;
                    }
                }
                return pointValue;
            },
            octeractUpgrades: () => {
                let pointValue = 0
                const data = this.#gameData;
                if (!data) return 0;
                for (const upgradeKey of Object.keys(octeractUpgradeMaxLevels) as OcteractUpgradeKey[]) {
                    const maxLevel = octeractUpgradeMaxLevels[upgradeKey].maxLevel
                    const playerLevel = this.#api.octeract.getOcteractUpgradeLevel(upgradeKey)
                    if (maxLevel !== -1 && playerLevel >= maxLevel) {
                        pointValue += 8
                    }
                    const freeCap = dailyOcteractFreeLevelCaps[upgradeKey];
                    if (freeCap !== undefined && this.#api.getSavedUpgradeFreeLevel(data.octUpgrades[upgradeKey]) >= freeCap) {
                        pointValue += 8;
                    }
                }
                return pointValue
            },
            redAmbrosiaUpgrades: () => {
                let pointValue = 0
                if (!this.#gameData) return 0;
                const ambrosia = this.#api.ambrosia;
                for (const upgradeKey of Object.keys(ambrosia.redAmbrosiaUpgradeCalculationCollection) as RedAmbrosiaUpgradeKey[]) {
                    const maxLevel = ambrosia.redAmbrosiaUpgradeCalculationCollection[upgradeKey].maxLevel
                    const playerLevel = ambrosia.calculateRedAmbrosiaUpgradeValue(upgradeKey);
                    if (maxLevel !== -1 && playerLevel >= maxLevel) {
                        pointValue += 10
                    }
                }
                return pointValue
            },
            purpleHoneyUpgrades: () => this.calculatePurpleReactorAchievementAP(),
            purpleAmbrosiaUpgrades: () => this.calculatePurpleAmbrosiaAchievementAP(),
            talismanRarities: (saved) => 5 * saved,
        };
    }

    getSingChalApReward(chal: SingularityChallengeDataKeys): number {
        const data = this.#gameData;
        if (!data) return 0;

        const chalData = SINGULARITY_CHALLENGE_DATA[chal];
        if (!chalData) return 0;

        const completions = data.singularityChallenges[chal]?.completions ?? 0;

        return chalData.achievementPointValue(completions);
    }

    /** Mirrors quarkUpgradeAP() from SynergismOfficial/src/Shop.ts. */
    calculateQuarkUpgradeAchievementAP(): number {
        const data = this.#gameData;
        if (!data) return 0;
        return Object.entries(QUARK_UPGRADE_MAX_LEVELS).reduce((total, [key, maxLevel]) => {
            const level = Number((data.shopUpgrades as unknown as Record<string, unknown>)[key] ?? 0);
            return total + (level === maxLevel ? 4 : 0);
        }, 0);
    }

    /** Mirrors calculatePurpleReactorAP() from SynergismOfficial/src/Purple.ts. */
    calculatePurpleReactorAchievementAP(): number {
        const data = this.#gameData;
        if (!data) return 0;

        let totalAP = 0;
        for (const upgrade of PURPLE_REACTOR_AP_DATA) {
            const invested = Number((data.purpleReactorUpgrades as Record<string, unknown> | undefined)?.[upgrade.key] ?? 0);
            if (!Number.isFinite(invested) || invested <= 0) continue;

            // Savedata stores cumulative investment, while the game stores the
            // current level. Reconstruct the level using the same cost formula.
            let low = 0;
            let high = upgrade.maxLevel;
            while (low < high) {
                const middle = low + Math.ceil((high - low) / 2);
                if (upgrade.costFormula(middle) <= invested + 0.001) low = middle;
                else high = middle - 1;
            }

            totalAP += low * upgrade.perLevelAP;
            if (low >= upgrade.maxLevel) totalAP += upgrade.maxLevelAP;
        }
        return Math.floor(totalAP);
    }

    /** Mirrors the purpleAmbrosiaUpgrades achievement in SynergismOfficial/src/Achievements.ts. */
    calculatePurpleAmbrosiaAchievementAP(): number {
        const data = this.#gameData;
        if (!data) return 0;

        let totalAP = 0;

        // Synthesis upgrades use a linear Purple Ambrosia investment for their
        // level; AP is awarded in the same intervals as Synthesis.ts.
        const synthesisAP = [
            ['redAmbrosiaReduction', 500, 50, 5],
            ['purpleHoneyReduction', 100, 10, 5],
            ['subatomicShavings', 100, 10, 5],
            ['exceptionalLieGroup', 30, 3, 5],
        ] as const;
        const synthesis = (data as unknown as { synthesisUpgrades?: Record<string, Record<string, number>> }).synthesisUpgrades;
        const purpleAmbrosiaCostPerLevel: Record<string, number> = {
            redAmbrosiaReduction: 1,
            purpleHoneyReduction: 5,
            subatomicShavings: 20,
            exceptionalLieGroup: 100,
        };
        for (const [key, maxLevel, levelsPerAP, apPerInterval] of synthesisAP) {
            const invested = Number(synthesis?.[key]?.purpleAmbrosia ?? 0);
            const level = Math.min(maxLevel, Math.max(0, Math.floor(invested / purpleAmbrosiaCostPerLevel[key])));
            totalAP += Math.floor(level / levelsPerAP) * apPerInterval;
        }

        const purpleZodiacMaxLevels = {
            aries: 25, taurus: 10, gemini: 10, cancer: 10, leo: 25, virgo: 15,
            libra: 1, scorpio: 10, sagittarius: 11, capricorn: 11, aquarius: 1, pisces: 1,
        } as const;
        for (const [key, maxLevel] of Object.entries(purpleZodiacMaxLevels)) {
            if (this.#api.purple.getPurpleAmbrosiaUpgradeLevel(key as keyof typeof purpleZodiacMaxLevels) >= maxLevel) {
                totalAP += 12;
            }
        }

        // Purple enchantments are worth 5 AP when their official max level is reached.
        const ambrosia = this.#api.ambrosia;
        for (const key of Object.keys(ambrosia.ambrosiaUpgradeCalculationCollection) as AmbrosiaUpgradeNames[]) {
            const level = ambrosia.calculatePurpleAmbrosiaEnchantmentLevel(key);
            const maxLevel = ambrosia.getPurpleAmbrosiaEnchantmentMaxLevel(key);
            if (maxLevel > 0 && level >= maxLevel) totalAP += 5;
        }
        return totalAP;
    }

    calculateLeaderboardValue(leaderboard: ReadonlyArray<{ readonly elo: number; readonly sacrificeId: number }>): number {
        let total = 0
        const LEADERBOARD_WEIGHTS = [1, 0.8, 0.6, 0.4, 0.2]
        for (let i = 0; i < Math.min(leaderboard.length, LEADERBOARD_WEIGHTS.length); i++) {
            total += leaderboard[i].elo * LEADERBOARD_WEIGHTS[i]
        }
        return Math.floor(total)
    }

    /**
     * Cached until the cache generation changes: about 0.1 ms, and an ambrosia rate refresh asks for it 8 times
     * (luck, red luck, red speed, purple honey…). Everything it reads comes in through the _update* methods,
     * which all bump the generation.
     */
    calculateSynergismLevel(): number {
        const data = this.#gameData;
        if (!data) return 0;
        const generation = this.#api.getCacheGeneration();
        if (generation !== this.#lastCacheGeneration) {
            this.#lastCacheGeneration = generation;
            this.#synergismLevel = undefined;
        }
        if (this.#synergismLevel !== undefined) return this.#synergismLevel;

        let achievementPoints = 0;

        achievementPoints += this.#api.achievement.achievements.reduce((sum, ach, index) => {
            return sum + (data.achievements[index] ? ach.pointValue : 0)
        }, 0)

        for (const k of Object.keys(this.#progressiveAchievementPoints) as ProgressiveAchievements[]) {
            const savedValue = data.progressiveAchievements[k] ?? 0;
            const effectiveValue = k === 'talismanRarities' && savedValue === 0
                ? this.#api.talisman.calculateTalismanRarityTotal()
                : savedValue;
            achievementPoints += this.#progressiveAchievementPoints[k](effectiveValue);
        }

        let level: number;
        if (achievementPoints < 2500) {
            level = Math.floor(achievementPoints / 50)
        } else {
            level = 50 + Math.floor((achievementPoints - 2500) / 100)
        }

        this.#synergismLevel = level;
        return level
    }
}
