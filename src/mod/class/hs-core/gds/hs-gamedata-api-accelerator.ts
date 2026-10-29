import Decimal from "break_infinity.js";
import { AntUpgrades } from "../../../types/data-types/hs-gamedata-api-types";
import { parseGameDataDecimal } from "./hs-gamedata-utils";
import type { HSGameDataAPI } from "./hs-gamedata-api";

/**
 * Class: AcceleratorHelper
 * IsExplicitHSModule: No
 * Description:
 *     Accelerators and accelerator boosts: free and total counts, power and effect, and the cube blessings that raise them.
 * Author: Shewchou
 */
export class AcceleratorHelper {
    readonly #api: HSGameDataAPI;

    constructor(api: HSGameDataAPI) {
        this.#api = api;
    }

    calculateAcceleratorHypercubeBlessing = (): number => {
        const data = this.#api.getGameData();
        if (!data) return 1

        const DR = 1 / 12
        const effectPerBlessing = this.#api.calculateHypercubeBlessingMultiplierPlatonicBlessing() / 1000
        const limit = 1000
        const acceleratorBlessings = data.hypercubeBlessings.accelerator ?? 0

        if (acceleratorBlessings < limit) {
            return 1 + effectPerBlessing * acceleratorBlessings
        }

        const limitMult = Math.pow(limit, 1 - DR)
        return 1 + effectPerBlessing * limitMult * Math.pow(acceleratorBlessings, DR)
    }

    calculateAcceleratorTesseractBlessing = (): number => {
        const data = this.#api.getGameData();
        if (!data) return 1

        const DR = 1 / 6
        const effectPerBlessing = this.calculateAcceleratorHypercubeBlessing() / 1000
        const limit = 1000
        const acceleratorBlessings = data.tesseractBlessings.accelerator ?? 0

        if (acceleratorBlessings < limit) {
            return 1 + effectPerBlessing * acceleratorBlessings
        }

        const limitMult = Math.pow(limit, 1 - DR)
        return 1 + effectPerBlessing * limitMult * Math.pow(acceleratorBlessings, DR)
    }

    calculateAcceleratorCubeBlessing = (): number => {
        const data = this.#api.getGameData();
        if (!data) return 0

        const DR = 1 / 3
        const effectPerBlessing = this.calculateAcceleratorTesseractBlessing() / 500
        const limit = 1000
        const acceleratorBlessings = data.cubeBlessings.accelerator ?? 0
        const DRIncrease = (data.cubeUpgrades?.[45] ?? 0) / 300

        if (acceleratorBlessings < limit) {
            return Math.pow(effectPerBlessing * acceleratorBlessings, 1 + DRIncrease)
        }

        const limitMult = Math.pow(limit, 1 - DR + DRIncrease)
        return effectPerBlessing * limitMult * Math.pow(acceleratorBlessings, DR + DRIncrease)
    }

    calculateTotalCoinOwned = (): number => {
        const data = this.#api.getGameData();
        if (!data) return 0
        return (
            (data.firstOwnedCoin ?? 0)
            + (data.secondOwnedCoin ?? 0)
            + (data.thirdOwnedCoin ?? 0)
            + (data.fourthOwnedCoin ?? 0)
            + (data.fifthOwnedCoin ?? 0)
        )
    }

    getFreeAcceleratorBoost = (): number => {
        const data = this.#api.getGameData();
        if (!data) return 0

        let boost = 0

        if ((data.upgrades?.[26] ?? 0) > 0.5) {
            boost += 1
        }
        if ((data.upgrades?.[31] ?? 0) > 0.5) {
            boost += Math.floor(this.calculateTotalCoinOwned() / 2000)
        }
        boost += Number(this.#api.achievement.AchRewards.accelBoosts())
        boost += (data.researches?.[93] ?? 0) * Math.floor(this.#api.rune.calculateTotalRuneLevels() / 20)

        boost *= 1 + (data.researches?.[3] ?? 0) / 5 * (1 + (data.challengecompletions?.[14] ?? 0) / 2)
        boost *= 1 + (data.researches?.[16] ?? 0) / 20 + (data.researches?.[17] ?? 0) / 20
        boost *= 1 + (data.researches?.[88] ?? 0) / 20
        boost *= this.#api.antUpgrade.getAntUpgradeEffectValue(AntUpgrades.AcceleratorBoosts, 'acceleratorBoostMult')
        boost *= 1 + (data.researches?.[127] ?? 0) / 100
        boost *= 1 + 0.008 * (data.researches?.[142] ?? 0)
        boost *= 1 + 0.006 * (data.researches?.[157] ?? 0)
        boost *= 1 + 0.004 * (data.researches?.[172] ?? 0)
        boost *= 1 + 0.002 * (data.researches?.[187] ?? 0)
        boost *= 1 + 0.0001 * (data.researches?.[200] ?? 0)
        boost *= 1 + 0.0001 * (data.cubeUpgrades?.[50] ?? 0)
        boost *= 1 + (1 / 1000) * this.#api.calculateHepteractEffective('acceleratorBoost')

        if ((data.upgrades?.[73] ?? 0) > 0.5 && data.currentChallenge.reincarnation !== 0) {
            boost *= 2
        }

        return Math.min(1e100, Math.floor(boost))
    }

    calculateTotalAcceleratorBoost = (): number => {
        const data = this.#api.getGameData();
        if (!data) return 0
        return Math.floor((data.acceleratorBoostBought ?? 0) + this.getFreeAcceleratorBoost())
    }

    getAcceleratorMultiplier = (): number => {
        const data = this.#api.getGameData();
        if (!data) return 1

        let multiplier = 1

        multiplier *= 1 + (data.researches?.[1] ?? 0) / 5 * (1 + (data.challengecompletions?.[14] ?? 0) / 2)
        multiplier *= 1 + (data.researches?.[6] ?? 0) / 20 + (data.researches?.[7] ?? 0) / 25 + (data.researches?.[8] ?? 0) / 40 + (3 / 200) * (data.researches?.[9] ?? 0) + (data.researches?.[10] ?? 0) / 200
        multiplier *= 1 + (data.researches?.[86] ?? 0) / 20
        multiplier *= 1 + (data.researches?.[126] ?? 0) / 100
        multiplier *= 1 + 0.008 * (data.researches?.[141] ?? 0)
        multiplier *= 1 + 0.006 * (data.researches?.[156] ?? 0)
        multiplier *= 1 + 0.004 * (data.researches?.[171] ?? 0)
        multiplier *= 1 + 0.002 * (data.researches?.[186] ?? 0)
        multiplier *= 1 + 0.0001 * (data.researches?.[200] ?? 0)
        multiplier *= 1 + 0.0001 * (data.cubeUpgrades?.[50] ?? 0)
        multiplier *= Math.pow(
            1.01,
            (data.upgrades?.[21] ?? 0)
            + (data.upgrades?.[22] ?? 0)
            + (data.upgrades?.[23] ?? 0)
            + (data.upgrades?.[24] ?? 0)
            + (data.upgrades?.[25] ?? 0)
        )

        if (
            (data.currentChallenge.transcension !== 0 || data.currentChallenge.reincarnation !== 0)
            && (data.upgrades?.[50] ?? 0) > 0.5
        ) {
            multiplier *= 1.25
        }

        return multiplier
    }

    getFreeAccelerator = (): number => {
        const data = this.#api.getGameData();
        if (!data) return 0

        // SynergismOfficial/src/Statistics.ts freeAcceleratorAdditiveStats
        let accelerator = 0
        if ((data.upgrades?.[8] ?? 0) !== 0) {
            accelerator += Math.floor((data.multiplierBought ?? 0) / 7)
        }
        accelerator += [5, 4, 3, 2, 1].reduce((sum, amount, i) => sum + ((data.upgrades?.[21 + i] ?? 0) !== 0 ? amount : 0), 0)
        if ((data.upgrades?.[32] ?? 0) !== 0) {
            accelerator += Math.min(500, Math.floor(parseGameDataDecimal(data.prestigePoints).add(1).log10() / 25))
        }
        if ((data.upgrades?.[45] ?? 0) !== 0) {
            accelerator += Math.min(2500, Math.floor(parseGameDataDecimal(data.transcendShards).add(1).log10()))
        }
        accelerator += Number(this.#api.achievement.AchRewards.accelerators())
        accelerator += 5 * (data.challengecompletions?.[2] ?? 0)
        accelerator += this.calculateTotalAcceleratorBoost() * (
            5
            + 2 * (data.researches?.[18] ?? 0)
            + 2 * (data.researches?.[19] ?? 0)
            + 3 * (data.researches?.[20] ?? 0)
            + this.calculateAcceleratorCubeBlessing()
        )

        if (data.unlocks?.prestige) {
            const speedEffects = this.#api.rune.getRuneEffects('speed')
            accelerator *= Number(speedEffects.multiplicativeAccelerators ?? 1)
        }

        accelerator *= this.getAcceleratorMultiplier()
        // SynergismOfficial/src/Calculate.ts calculateFreeAccelMult: Challenge 15's viscosity is a power
        accelerator = Math.pow(accelerator, this.#api.corruption.getChallenge15CorruptionEffect('viscosity'))

        accelerator += 2000 * this.#api.calculateHepteractEffective('accelerator')
        accelerator *= this.#api.calculateChallenge15Reward('accelerator')
        accelerator *= 1 + 3 * this.#api.calculateHepteractEffective('accelerator') / 10000
        // Capped at 1e300 here, and at 1e100 once divided by viscosity (getTotalAccelerator)
        accelerator = Math.min(1e300, Math.floor(accelerator))

        return accelerator
    }

    // SynergismOfficial/src/Synergism.ts updateAllTick and SynergismOfficial/src/Calculate.ts
    // calculateEffectiveFreeAccelMult: the corruption level's viscosity divides every accelerator, then the free ones
    // are capped at 1e100
    getTotalAccelerator = (): number => {
        const data = this.#api.getGameData();
        if (!data) return 0

        const viscosity = this.#api.corruption.getCorruptionEffect(this.#api.corruption.getActiveCorruptionLevel(), 'viscosity') as number
        return (data.acceleratorBought ?? 0) / viscosity + Math.min(1e100, this.getFreeAccelerator() / viscosity)
    }

    getAcceleratorPower = (): number => {
        const data = this.#api.getGameData();
        if (!data) return 0

        const achievementBonus = Number(this.#api.achievement.AchRewards.acceleratorPower())
        const challenge2Completions = data.challengecompletions?.[2] ?? 0
        const tuSevenMulti = (data.upgrades?.[46] ?? 0) > 0.5 ? 1.05 : 1

        const speedEffects = this.#api.rune.getRuneEffects('speed')
        const base = 1.1
            + (speedEffects.acceleratorPower ?? 0)
            + achievementBonus
            + tuSevenMulti * (this.calculateTotalAcceleratorBoost() / 100) * (1 + challenge2Completions / 20)

        const exponent = 1 + 0.04 * (data.challengecompletions?.[7] ?? 0)
        // SynergismOfficial/src/Synergism.ts updateAllTick: capped at 1e300 (raw C7 completions overflow it)
        return Math.min(1e300, Math.pow(base, exponent))
    }

    getAcceleratorEffect = (): Decimal => {
        const data = this.#api.getGameData();
        if (!data) return new Decimal(1)

        const acceleratorPower = this.getAcceleratorPower()
        const totalAccelerator = this.getTotalAccelerator()
        const totalMultiplier = data.multiplierBought

        const exponent = data.currentChallenge.transcension === 1
            ? totalAccelerator + totalMultiplier
            : totalAccelerator

        let effect = Decimal.pow(acceleratorPower, exponent)

        if (data.currentChallenge.reincarnation === 10) {
            effect = new Decimal(1)
        }

        return effect
    }
}
