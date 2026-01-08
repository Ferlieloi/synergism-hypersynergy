export interface Achievement {
    pointValue: number;
    group: string;
    reward?: string;
}

export type ProgressiveAchievements =
    | 'runeLevel'
    | 'freeRuneLevel'
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

export interface ProgressiveAchievement {
    maxPointValue: number
    pointsAwarded: (cached: number) => number
    updateValue: () => number // Number to compare to existing caches
    useCachedValue: boolean
    rewardedAP: number // Updating achievementPoints: pointsAwarded() - rewardedAP
    extraI18n?: () => Record<string, number>
    displayOrder: number
    displayCondition: () => boolean
}



export const achievements: Achievement[] = [
    {
        "pointValue": 5,
        "group": "ungrouped"
    },
    {
        "pointValue": 5,
        "group": "firstOwnedCoin"
    },
    {
        "pointValue": 10,
        "group": "firstOwnedCoin"
    },
    {
        "pointValue": 15,
        "group": "firstOwnedCoin",
        "reward": "{ acceleratorPower: () => 0.001 }"
    },
    {
        "pointValue": 20,
        "group": "firstOwnedCoin"
    },
    {
        "pointValue": 25,
        "group": "firstOwnedCoin",
        "reward": "{ accelerators: () => Math.floor(player.firstOwnedCoin / 500) }"
    },
    {
        "pointValue": 30,
        "group": "firstOwnedCoin",
        "reward": "{ multipliers: () => Math.floor(player.firstOwnedCoin / 1000) }"
    },
    {
        "pointValue": 35,
        "group": "firstOwnedCoin",
        "reward": "{ accelBoosts: () => Math.floor(player.firstOwnedCoin / 2000) }"
    },
    {
        "pointValue": 5,
        "group": "secondOwnedCoin"
    },
    {
        "pointValue": 10,
        "group": "secondOwnedCoin"
    },
    {
        "pointValue": 15,
        "group": "secondOwnedCoin",
        "reward": "{ acceleratorPower: () => 0.0015 }"
    },
    {
        "pointValue": 20,
        "group": "secondOwnedCoin"
    },
    {
        "pointValue": 25,
        "group": "secondOwnedCoin",
        "reward": "{ accelerators: () => Math.floor(player.secondOwnedCoin / 500) }"
    },
    {
        "pointValue": 30,
        "group": "secondOwnedCoin",
        "reward": "{ multipliers: () => Math.floor(player.secondOwnedCoin / 1000) }"
    },
    {
        "pointValue": 35,
        "group": "secondOwnedCoin",
        "reward": "{ accelBoosts: () => Math.floor(player.secondOwnedCoin / 2000) }"
    },
    {
        "pointValue": 5,
        "group": "thirdOwnedCoin"
    },
    {
        "pointValue": 10,
        "group": "thirdOwnedCoin"
    },
    {
        "pointValue": 15,
        "group": "thirdOwnedCoin",
        "reward": "{ acceleratorPower: () => 0.002 }"
    },
    {
        "pointValue": 20,
        "group": "thirdOwnedCoin"
    },
    {
        "pointValue": 25,
        "group": "thirdOwnedCoin",
        "reward": "{ accelerators: () => Math.floor(player.thirdOwnedCoin / 500) }"
    },
    {
        "pointValue": 30,
        "group": "thirdOwnedCoin",
        "reward": "{ multipliers: () => Math.floor(player.thirdOwnedCoin / 1000) }"
    },
    {
        "pointValue": 35,
        "group": "thirdOwnedCoin",
        "reward": "{ accelBoosts: () => Math.floor(player.thirdOwnedCoin / 2000) }"
    },
    {
        "pointValue": 5,
        "group": "fourthOwnedCoin"
    },
    {
        "pointValue": 10,
        "group": "fourthOwnedCoin"
    },
    {
        "pointValue": 15,
        "group": "fourthOwnedCoin",
        "reward": "{ acceleratorPower: () => 0.002 }"
    },
    {
        "pointValue": 20,
        "group": "fourthOwnedCoin"
    },
    {
        "pointValue": 25,
        "group": "fourthOwnedCoin",
        "reward": "{ accelerators: () => Math.floor(player.thirdOwnedCoin / 500) }"
    },
    {
        "pointValue": 30,
        "group": "fourthOwnedCoin",
        "reward": "{ multipliers: () => Math.floor(player.thirdOwnedCoin / 1000) }"
    },
    {
        "pointValue": 35,
        "group": "fourthOwnedCoin",
        "reward": "{ accelBoosts: () => Math.floor(player.thirdOwnedCoin / 2000) }"
    },
    {
        "pointValue": 5,
        "group": "fifthOwnedCoin"
    },
    {
        "pointValue": 10,
        "group": "fifthOwnedCoin"
    },
    {
        "pointValue": 15,
        "group": "fifthOwnedCoin",
        "reward": "{ acceleratorPower: () => 0.003 }"
    },
    {
        "pointValue": 20,
        "group": "fifthOwnedCoin"
    },
    {
        "pointValue": 25,
        "group": "fifthOwnedCoin",
        "reward": "{ accelerators: () => Math.floor(player.fifthOwnedCoin / 500) }"
    },
    {
        "pointValue": 30,
        "group": "fifthOwnedCoin",
        "reward": "{ multipliers: () => Math.floor(player.fifthOwnedCoin / 1000) }"
    },
    {
        "pointValue": 35,
        "group": "fifthOwnedCoin",
        "reward": "{ accelBoosts: () => Math.floor(player.fifthOwnedCoin / 2000) }"
    },
    {
        "pointValue": 5,
        "group": "prestigePointGain"
    },
    {
        "pointValue": 10,
        "group": "prestigePointGain",
        "reward": "{ crystalMultiplier: () => Math.max(1, Decimal.log(player.prestigePoints, Math.E)) }"
    },
    {
        "pointValue": 15,
        "group": "prestigePointGain"
    },
    {
        "pointValue": 20,
        "group": "prestigePointGain"
    },
    {
        "pointValue": 25,
        "group": "prestigePointGain"
    },
    {
        "pointValue": 30,
        "group": "prestigePointGain"
    },
    {
        "pointValue": 35,
        "group": "prestigePointGain"
    },
    {
        "pointValue": 5,
        "group": "transcendPointGain"
    },
    {
        "pointValue": 10,
        "group": "transcendPointGain"
    },
    {
        "pointValue": 15,
        "group": "transcendPointGain",
        "reward": "{ taxReduction: () => 0.95 }"
    },
    {
        "pointValue": 20,
        "group": "transcendPointGain",
        "reward": "{ taxReduction: () => 0.95 }"
    },
    {
        "pointValue": 25,
        "group": "transcendPointGain",
        "reward": "{ taxReduction: () => 0.9 }"
    },
    {
        "pointValue": 30,
        "group": "transcendPointGain"
    },
    {
        "pointValue": 35,
        "group": "transcendPointGain"
    },
    {
        "pointValue": 5,
        "group": "reincarnationPointGain",
        "reward": "{ particleGain: () => 2 }"
    },
    {
        "pointValue": 10,
        "group": "reincarnationPointGain"
    },
    {
        "pointValue": 15,
        "group": "reincarnationPointGain"
    },
    {
        "pointValue": 20,
        "group": "reincarnationPointGain"
    },
    {
        "pointValue": 25,
        "group": "reincarnationPointGain"
    },
    {
        "pointValue": 30,
        "group": "reincarnationPointGain"
    },
    {
        "pointValue": 35,
        "group": "reincarnationPointGain"
    },
    {
        "pointValue": 5,
        "group": "ungrouped",
        "reward": "{ multipliers: () => 1 }"
    },
    {
        "pointValue": 10,
        "group": "ungrouped",
        "reward": "{ multipliers: () => 2 }"
    },
    {
        "pointValue": 15,
        "group": "ungrouped",
        "reward": "{ multipliers: () => 4 }"
    },
    {
        "pointValue": 20,
        "group": "ungrouped",
        "reward": "{ accelerators: () => 2 }"
    },
    {
        "pointValue": 25,
        "group": "ungrouped",
        "reward": "{ accelerators: () => 4 }"
    },
    {
        "pointValue": 30,
        "group": "ungrouped",
        "reward": "{ accelerators: () => 8 }"
    },
    {
        "pointValue": 35,
        "group": "ungrouped"
    },
    {
        "pointValue": 5,
        "group": "ungrouped"
    },
    {
        "pointValue": 10,
        "group": "ungrouped"
    },
    {
        "pointValue": 15,
        "group": "ungrouped"
    },
    {
        "pointValue": 15,
        "group": "ungrouped"
    },
    {
        "pointValue": 20,
        "group": "ungrouped"
    },
    {
        "pointValue": 30,
        "group": "ungrouped"
    },
    {
        "pointValue": 40,
        "group": "ungrouped"
    },
    {
        "pointValue": 10,
        "group": "ungrouped",
        "reward": "{ conversionExponent: () => 0.01 }"
    },
    {
        "pointValue": 10,
        "group": "ungrouped",
        "reward": "{ conversionExponent: () => 0.01 }"
    },
    {
        "pointValue": 15,
        "group": "ungrouped",
        "reward": "{ conversionExponent: () => 0.01 }"
    },
    {
        "pointValue": 20,
        "group": "ungrouped",
        "reward": "{ conversionExponent: () => 0.01 }"
    },
    {
        "pointValue": 25,
        "group": "ungrouped",
        "reward": "{ conversionExponent: () => 0.01 }"
    },
    {
        "pointValue": 25,
        "group": "ungrouped",
        "reward": "{ conversionExponent: () => 0.01 }"
    },
    {
        "pointValue": 50,
        "group": "ungrouped",
        "reward": "{ conversionExponent: () => 0.01 }"
    },
    {
        "pointValue": 5,
        "group": "challenge1"
    },
    {
        "pointValue": 10,
        "group": "challenge1"
    },
    {
        "pointValue": 15,
        "group": "challenge1"
    },
    {
        "pointValue": 20,
        "group": "challenge1"
    },
    {
        "pointValue": 25,
        "group": "challenge1",
        "reward": "{ taxReduction: () => 0.96 }"
    },
    {
        "pointValue": 30,
        "group": "challenge1"
    },
    {
        "pointValue": 35,
        "group": "challenge1"
    },
    {
        "pointValue": 5,
        "group": "challenge2"
    },
    {
        "pointValue": 10,
        "group": "challenge2"
    },
    {
        "pointValue": 15,
        "group": "challenge2"
    },
    {
        "pointValue": 20,
        "group": "challenge2"
    },
    {
        "pointValue": 25,
        "group": "challenge2",
        "reward": "{ taxReduction: () => 0.96 }"
    },
    {
        "pointValue": 30,
        "group": "challenge2"
    },
    {
        "pointValue": 35,
        "group": "challenge2"
    },
    {
        "pointValue": 5,
        "group": "challenge3"
    },
    {
        "pointValue": 10,
        "group": "challenge3"
    },
    {
        "pointValue": 15,
        "group": "challenge3"
    },
    {
        "pointValue": 20,
        "group": "challenge3"
    },
    {
        "pointValue": 25,
        "group": "challenge3",
        "reward": "{ taxReduction: () => 0.96 }"
    },
    {
        "pointValue": 30,
        "group": "challenge3"
    },
    {
        "pointValue": 35,
        "group": "challenge3"
    },
    {
        "pointValue": 5,
        "group": "challenge4"
    },
    {
        "pointValue": 10,
        "group": "challenge4"
    },
    {
        "pointValue": 15,
        "group": "challenge4"
    },
    {
        "pointValue": 20,
        "group": "challenge4"
    },
    {
        "pointValue": 25,
        "group": "challenge4",
        "reward": "{ taxReduction: () => 0.96 }"
    },
    {
        "pointValue": 30,
        "group": "challenge4"
    },
    {
        "pointValue": 35,
        "group": "challenge4"
    },
    {
        "pointValue": 5,
        "group": "challenge5"
    },
    {
        "pointValue": 10,
        "group": "challenge5"
    },
    {
        "pointValue": 15,
        "group": "challenge5"
    },
    {
        "pointValue": 20,
        "group": "challenge5"
    },
    {
        "pointValue": 25,
        "group": "challenge5",
        "reward": "{ taxReduction: () => 0.96 }"
    },
    {
        "pointValue": 30,
        "group": "challenge5"
    },
    {
        "pointValue": 35,
        "group": "challenge5"
    },
    {
        "pointValue": 5,
        "group": "challenge6"
    },
    {
        "pointValue": 10,
        "group": "challenge6"
    },
    {
        "pointValue": 15,
        "group": "challenge6"
    },
    {
        "pointValue": 20,
        "group": "challenge6"
    },
    {
        "pointValue": 25,
        "group": "challenge6",
        "reward": "{ taxReduction: () => 0.95 }"
    },
    {
        "pointValue": 30,
        "group": "challenge6",
        "reward": "{\n      taxReduction: () =>\n        Math.pow(\n          0.9925,\n          player.challengecompletions[6] + player.challengecompletions[7] + player.challengecompletions[8]\n            + player.challengecompletions[9] + player.challengecompletions[10]\n        )\n    }"
    },
    {
        "pointValue": 35,
        "group": "challenge6"
    },
    {
        "pointValue": 5,
        "group": "challenge7",
        "reward": "{ diamondUpgrade18: () => 0 }"
    },
    {
        "pointValue": 10,
        "group": "challenge7"
    },
    {
        "pointValue": 15,
        "group": "challenge7"
    },
    {
        "pointValue": 20,
        "group": "challenge7"
    },
    {
        "pointValue": 25,
        "group": "challenge7",
        "reward": "{ taxReduction: () => 0.95 }"
    },
    {
        "pointValue": 30,
        "group": "challenge7"
    },
    {
        "pointValue": 35,
        "group": "challenge7",
        "reward": "{ chronosTalisman: () => 1 }"
    },
    {
        "pointValue": 5,
        "group": "challenge8",
        "reward": "{ diamondUpgrade19: () => 1 }"
    },
    {
        "pointValue": 10,
        "group": "challenge8"
    },
    {
        "pointValue": 15,
        "group": "challenge8"
    },
    {
        "pointValue": 20,
        "group": "challenge8"
    },
    {
        "pointValue": 25,
        "group": "challenge8",
        "reward": "{ taxReduction: () => 0.95 }"
    },
    {
        "pointValue": 30,
        "group": "challenge8"
    },
    {
        "pointValue": 35,
        "group": "challenge8",
        "reward": "{ midasTalisman: () => 1 }"
    },
    {
        "pointValue": 5,
        "group": "challenge9",
        "reward": "{ diamondUpgrade20: () => 1 }"
    },
    {
        "pointValue": 10,
        "group": "challenge9",
        "reward": "{ talismanPower: () => 0.02 }"
    },
    {
        "pointValue": 15,
        "group": "challenge9",
        "reward": "{ talismanPower: () => 0.02 }"
    },
    {
        "pointValue": 20,
        "group": "challenge9",
        "reward": "{ sacrificeMult: () => 1.25, experientiaAutobuy: () => 1 }"
    },
    {
        "pointValue": 25,
        "group": "challenge9"
    },
    {
        "pointValue": 30,
        "group": "challenge9"
    },
    {
        "pointValue": 35,
        "group": "challenge9",
        "reward": "{ metaphysicsTalisman: () => 1 }"
    },
    {
        "pointValue": 5,
        "group": "challenge10"
    },
    {
        "pointValue": 10,
        "group": "challenge10"
    },
    {
        "pointValue": 15,
        "group": "challenge10"
    },
    {
        "pointValue": 20,
        "group": "challenge10",
        "reward": "{ talismanPower: () => 0.025 }"
    },
    {
        "pointValue": 25,
        "group": "challenge10",
        "reward": "{ talismanPower: () => 0.025 }"
    },
    {
        "pointValue": 30,
        "group": "challenge10"
    },
    {
        "pointValue": 35,
        "group": "challenge10",
        "reward": "{ polymathTalisman: () => 1 }"
    },
    {
        "pointValue": 5,
        "group": "accelerators"
    },
    {
        "pointValue": 10,
        "group": "accelerators",
        "reward": "{ acceleratorPower: () => 0.01 }"
    },
    {
        "pointValue": 15,
        "group": "accelerators"
    },
    {
        "pointValue": 20,
        "group": "accelerators",
        "reward": "{ accelerators: () => 5 }"
    },
    {
        "pointValue": 25,
        "group": "accelerators",
        "reward": "{ accelerators: () => 12 }"
    },
    {
        "pointValue": 30,
        "group": "accelerators",
        "reward": "{ accelerators: () => 25 }"
    },
    {
        "pointValue": 35,
        "group": "accelerators",
        "reward": "{ accelerators: () => 50 }"
    },
    {
        "pointValue": 5,
        "group": "multipliers"
    },
    {
        "pointValue": 10,
        "group": "multipliers",
        "reward": "{ multipliers: () => 1 }"
    },
    {
        "pointValue": 15,
        "group": "multipliers"
    },
    {
        "pointValue": 20,
        "group": "multipliers",
        "reward": "{ multipliers: () => 1 }"
    },
    {
        "pointValue": 25,
        "group": "multipliers",
        "reward": "{ multipliers: () => 3 }"
    },
    {
        "pointValue": 30,
        "group": "multipliers",
        "reward": "{ multipliers: () => 6 }"
    },
    {
        "pointValue": 35,
        "group": "multipliers",
        "reward": "{ multipliers: () => 10 }"
    },
    {
        "pointValue": 5,
        "group": "acceleratorBoosts"
    },
    {
        "pointValue": 10,
        "group": "acceleratorBoosts"
    },
    {
        "pointValue": 15,
        "group": "acceleratorBoosts"
    },
    {
        "pointValue": 20,
        "group": "acceleratorBoosts"
    },
    {
        "pointValue": 25,
        "group": "acceleratorBoosts"
    },
    {
        "pointValue": 30,
        "group": "acceleratorBoosts"
    },
    {
        "pointValue": 35,
        "group": "acceleratorBoosts"
    },
    {
        "pointValue": 5,
        "group": "antCrumbs",
        "reward": "{ antSpeed: () => Decimal.log(player.ants.crumbs.plus(10), 10) }"
    },
    {
        "pointValue": 10,
        "group": "antCrumbs"
    },
    {
        "pointValue": 15,
        "group": "antCrumbs",
        "reward": "{ antSpeed: () => 1.2 }"
    },
    {
        "pointValue": 20,
        "group": "antCrumbs",
        "reward": "{ antSpeed: () => 1.25 }"
    },
    {
        "pointValue": 25,
        "group": "antCrumbs",
        "reward": "{ antSpeed: () => 1.4, antSacrificeUnlock: () => 1, antAutobuyers: () => 1 }"
    },
    {
        "pointValue": 30,
        "group": "antCrumbs",
        "reward": "{ antSpeed: () => 1 + player.ants.immortalELO / 1000, scientiaAutobuy: () => 1 }"
    },
    {
        "pointValue": 35,
        "group": "antCrumbs"
    },
    {
        "pointValue": 5,
        "group": "sacMult",
        "reward": "{ antAutobuyers: () => 1, inceptusAutobuy: () => 1, fortunaeAutobuy: () => 1 }"
    },
    {
        "pointValue": 10,
        "group": "sacMult",
        "reward": "{ antAutobuyers: () => 1, tributumAutobuy: () => 1 }"
    },
    {
        "pointValue": 15,
        "group": "sacMult",
        "reward": "{ antAutobuyers: () => 1, celeritasAutobuy: () => 1, exploratoremAutobuy: () => 1 }"
    },
    {
        "pointValue": 20,
        "group": "sacMult",
        "reward": "{ antAutobuyers: () => 1, sacrificiumAutobuy: () => 1 }"
    },
    {
        "pointValue": 25,
        "group": "sacMult",
        "reward": "{ antAutobuyers: () => 1 }"
    },
    {
        "pointValue": 30,
        "group": "sacMult",
        "reward": "{ antAutobuyers: () => 1 }"
    },
    {
        "pointValue": 35,
        "group": "sacMult",
        "reward": "{ antAutobuyers: () => 1 }"
    },
    {
        "pointValue": 5,
        "group": "ascensionCount",
        "reward": "{ freeAntUpgrades: () => 2 }"
    },
    {
        "pointValue": 10,
        "group": "ascensionCount",
        "reward": "{ preserveAnthillCount: () => 1, antSacrificeCountMultiplier: () => 2 }"
    },
    {
        "pointValue": 15,
        "group": "ascensionCount"
    },
    {
        "pointValue": 20,
        "group": "ascensionCount",
        "reward": "{ wowSquareTalisman: () => 1 }"
    },
    {
        "pointValue": 25,
        "group": "ascensionCount",
        "reward": "{\n      ascensionCountMultiplier: () => Math.log10(calculateAscensionScore().effectiveScore + 100) - 1\n    }"
    },
    {
        "pointValue": 30,
        "group": "ascensionCount",
        "reward": "{\n      ascensionCountAdditive: () => (player.ascensionCounter > 10) ? 100 : 0\n    }"
    },
    {
        "pointValue": 35,
        "group": "ascensionCount",
        "reward": "{\n      ascensionCountAdditive: () => (player.ascensionCounter > 10) ? player.ascensionCounterReal * 2 : 0,\n      wowCubeGain: () => 1 + 2 * Math.min(1, player.ascensionCount / 5e8)\n    }"
    },
    {
        "pointValue": 5,
        "group": "constant"
    },
    {
        "pointValue": 10,
        "group": "constant"
    },
    {
        "pointValue": 15,
        "group": "constant"
    },
    {
        "pointValue": 20,
        "group": "constant",
        "reward": "{ wowCubeGain: () => 1 + Decimal.log(player.ascendShards.add(1), 10) / 400 }"
    },
    {
        "pointValue": 25,
        "group": "constant"
    },
    {
        "pointValue": 30,
        "group": "constant",
        "reward": "{\n      wowCubeGain: () => 1 + 249 * Math.min(1, Decimal.log(player.ascendShards.plus(1), 10) / 100000),\n      wowTesseractGain: () => 1 + 249 * Math.min(1, Decimal.log(player.ascendShards.plus(1), 10) / 100000)\n    }"
    },
    {
        "pointValue": 35,
        "group": "constant",
        "reward": "{ wowPlatonicGain: () => 1 + 19 * Math.min(1, Decimal.log(player.ascendShards.plus(1), 10) / 100000) }"
    },
    {
        "pointValue": 10,
        "group": "challenge11",
        "reward": "{ statTracker: () => 1 }"
    },
    {
        "pointValue": 20,
        "group": "challenge11"
    },
    {
        "pointValue": 30,
        "group": "challenge11"
    },
    {
        "pointValue": 40,
        "group": "challenge11"
    },
    {
        "pointValue": 50,
        "group": "challenge11"
    },
    {
        "pointValue": 60,
        "group": "challenge11",
        "reward": "{ ascensionCountAdditive: () => player.ascensionCounter * 2 }"
    },
    {
        "pointValue": 70,
        "group": "challenge11",
        "reward": "{ talismanPower: () => 0.01 }"
    },
    {
        "pointValue": 10,
        "group": "challenge12",
        "reward": "{ ascensionRewardScaling: () => 1 }"
    },
    {
        "pointValue": 20,
        "group": "challenge12"
    },
    {
        "pointValue": 30,
        "group": "challenge12"
    },
    {
        "pointValue": 40,
        "group": "challenge12"
    },
    {
        "pointValue": 50,
        "group": "challenge12"
    },
    {
        "pointValue": 60,
        "group": "challenge12",
        "reward": "{ ascensionCountAdditive: () => player.ascensionCounter * 2 }"
    },
    {
        "pointValue": 70,
        "group": "challenge12",
        "reward": "{ talismanPower: () => 0.01 }"
    },
    {
        "pointValue": 10,
        "group": "challenge13"
    },
    {
        "pointValue": 20,
        "group": "challenge13"
    },
    {
        "pointValue": 30,
        "group": "challenge13"
    },
    {
        "pointValue": 40,
        "group": "challenge13"
    },
    {
        "pointValue": 50,
        "group": "challenge13"
    },
    {
        "pointValue": 60,
        "group": "challenge13",
        "reward": "{ ascensionCountAdditive: () => player.ascensionCounter * 2 }"
    },
    {
        "pointValue": 70,
        "group": "challenge13",
        "reward": "{ talismanPower: () => 0.01 }"
    },
    {
        "pointValue": 10,
        "group": "challenge14"
    },
    {
        "pointValue": 20,
        "group": "challenge14"
    },
    {
        "pointValue": 30,
        "group": "challenge14"
    },
    {
        "pointValue": 40,
        "group": "challenge14"
    },
    {
        "pointValue": 50,
        "group": "challenge14"
    },
    {
        "pointValue": 60,
        "group": "challenge14",
        "reward": "{\n      ascensionCountAdditive: () => player.ascensionCounter * 2,\n      wowPlatonicGain: () => 1 + 2 * Math.min(1, player.ascensionCount / 2.674e9)\n    }"
    },
    {
        "pointValue": 70,
        "group": "challenge14"
    },
    {
        "pointValue": 5,
        "group": "ascensionScore"
    },
    {
        "pointValue": 10,
        "group": "ascensionScore"
    },
    {
        "pointValue": 15,
        "group": "ascensionScore"
    },
    {
        "pointValue": 20,
        "group": "ascensionScore"
    },
    {
        "pointValue": 25,
        "group": "ascensionScore"
    },
    {
        "pointValue": 30,
        "group": "ascensionScore"
    },
    {
        "pointValue": 35,
        "group": "ascensionScore"
    },
    {
        "pointValue": 10,
        "group": "speedBlessing"
    },
    {
        "pointValue": 20,
        "group": "speedBlessing"
    },
    {
        "pointValue": 30,
        "group": "speedBlessing"
    },
    {
        "pointValue": 10,
        "group": "speedSpirit"
    },
    {
        "pointValue": 20,
        "group": "speedSpirit"
    },
    {
        "pointValue": 30,
        "group": "speedSpirit"
    },
    {
        "pointValue": 50,
        "group": "ungrouped"
    },
    {
        "pointValue": 50,
        "group": "ungrouped"
    },
    {
        "pointValue": 50,
        "group": "ungrouped"
    },
    {
        "pointValue": 50,
        "group": "ungrouped"
    },
    {
        "pointValue": 50,
        "group": "ungrouped"
    },
    {
        "pointValue": 50,
        "group": "ungrouped"
    },
    {
        "pointValue": 50,
        "group": "ungrouped"
    },
    {
        "pointValue": 50,
        "group": "ungrouped"
    },
    {
        "pointValue": 50,
        "group": "ungrouped"
    },
    {
        "pointValue": 50,
        "group": "ungrouped"
    },
    {
        "pointValue": 50,
        "group": "ungrouped"
    },
    {
        "pointValue": 50,
        "group": "ungrouped"
    },
    {
        "pointValue": 100,
        "group": "ungrouped",
        "reward": "{\n      quarkGain: () => 1.05\n    }"
    },
    {
        "pointValue": 150,
        "group": "ungrouped",
        "reward": "{\n      quarkGain: () => 1.05\n    }"
    },
    {
        "pointValue": 50,
        "group": "ungrouped"
    },
    {
        "pointValue": 40,
        "group": "ascensionScore",
        "reward": "{ wowHypercubeGain: () => 1.1 }"
    },
    {
        "pointValue": 45,
        "group": "ascensionScore",
        "reward": "{ wowCubeGain: () => 1.1 }"
    },
    {
        "pointValue": 50,
        "group": "ascensionScore",
        "reward": "{ wowTesseractGain: () => 1.1 }"
    },
    {
        "pointValue": 55,
        "group": "ascensionScore",
        "reward": "{ wowPlatonicGain: () => 1.1, overfluxConversionRate: () => 1.05 }"
    },
    {
        "pointValue": 60,
        "group": "ascensionScore",
        "reward": "{ overfluxConversionRate: () => 1.05 }"
    },
    {
        "pointValue": 65,
        "group": "ascensionScore",
        "reward": "{ wowHepteractGain: () => 1.1 }"
    },
    {
        "pointValue": 70,
        "group": "ascensionScore",
        "reward": "{ ascensionScore: () => Math.pow(1.01, hepteracts.abyss.TIMES_CAP_EXTENDED) }"
    },
    {
        "pointValue": 40,
        "group": "ascensionCount",
        "reward": "{ ascensionCountMultiplier: () => 1.1 }"
    },
    {
        "pointValue": 45,
        "group": "ascensionCount",
        "reward": "{ ascensionCountMultiplier: () => 1.1 }"
    },
    {
        "pointValue": 50,
        "group": "ascensionCount"
    },
    {
        "pointValue": 55,
        "group": "ascensionCount"
    },
    {
        "pointValue": 60,
        "group": "ascensionCount"
    },
    {
        "pointValue": 65,
        "group": "ascensionCount"
    },
    {
        "pointValue": 70,
        "group": "ascensionCount",
        "reward": "{ quarkGain: () => 1 + 0.1 * Math.min(player.ascensionCount / 1e15, 1) }"
    },
    {
        "pointValue": 40,
        "group": "constant",
        "reward": "{ ascensionScore: () => 1 + Math.min(Decimal.log(player.ascendShards.add(1), 10) / 1e5, 1) }"
    },
    {
        "pointValue": 45,
        "group": "constant"
    },
    {
        "pointValue": 50,
        "group": "constant"
    },
    {
        "pointValue": 55,
        "group": "constant",
        "reward": "{\n      wowHepteractGain: () => 1 + Math.min(Decimal.log(player.ascendShards.add(1), 10) / 1e6, 1),\n      constUpgrade1Buff: () => 0.01,\n      constUpgrade2Buff: () => 0.01\n    }"
    },
    {
        "pointValue": 60,
        "group": "constant",
        "reward": "{ platonicToHypercubes: () => Math.min(1, Decimal.log(player.ascendShards.add(1), 10) / 1e6) }"
    },
    {
        "pointValue": 65,
        "group": "constant"
    },
    {
        "pointValue": 70,
        "group": "constant"
    },
    {
        "pointValue": 10,
        "group": "singularityCount"
    },
    {
        "pointValue": 20,
        "group": "singularityCount"
    },
    {
        "pointValue": 30,
        "group": "singularityCount"
    },
    {
        "pointValue": 40,
        "group": "singularityCount"
    },
    {
        "pointValue": 50,
        "group": "singularityCount"
    },
    {
        "pointValue": 60,
        "group": "singularityCount"
    },
    {
        "pointValue": 70,
        "group": "singularityCount"
    },
    {
        "pointValue": 40,
        "group": "firstOwnedCoin"
    },
    {
        "pointValue": 45,
        "group": "firstOwnedCoin"
    },
    {
        "pointValue": 50,
        "group": "firstOwnedCoin"
    },
    {
        "pointValue": 40,
        "group": "secondOwnedCoin"
    },
    {
        "pointValue": 45,
        "group": "secondOwnedCoin"
    },
    {
        "pointValue": 50,
        "group": "secondOwnedCoin"
    },
    {
        "pointValue": 40,
        "group": "thirdOwnedCoin"
    },
    {
        "pointValue": 45,
        "group": "thirdOwnedCoin"
    },
    {
        "pointValue": 50,
        "group": "thirdOwnedCoin"
    },
    {
        "pointValue": 40,
        "group": "fourthOwnedCoin"
    },
    {
        "pointValue": 45,
        "group": "fourthOwnedCoin"
    },
    {
        "pointValue": 50,
        "group": "fourthOwnedCoin"
    },
    {
        "pointValue": 40,
        "group": "fifthOwnedCoin"
    },
    {
        "pointValue": 45,
        "group": "fifthOwnedCoin"
    },
    {
        "pointValue": 50,
        "group": "fifthOwnedCoin"
    },
    {
        "pointValue": 40,
        "group": "prestigePointGain"
    },
    {
        "pointValue": 45,
        "group": "prestigePointGain"
    },
    {
        "pointValue": 50,
        "group": "prestigePointGain"
    },
    {
        "pointValue": 40,
        "group": "transcendPointGain"
    },
    {
        "pointValue": 45,
        "group": "transcendPointGain"
    },
    {
        "pointValue": 50,
        "group": "transcendPointGain"
    },
    {
        "pointValue": 40,
        "group": "reincarnationPointGain"
    },
    {
        "pointValue": 45,
        "group": "reincarnationPointGain"
    },
    {
        "pointValue": 50,
        "group": "reincarnationPointGain"
    },
    {
        "pointValue": 40,
        "group": "challenge1"
    },
    {
        "pointValue": 45,
        "group": "challenge1"
    },
    {
        "pointValue": 50,
        "group": "challenge1"
    },
    {
        "pointValue": 40,
        "group": "challenge2"
    },
    {
        "pointValue": 45,
        "group": "challenge2"
    },
    {
        "pointValue": 50,
        "group": "challenge2"
    },
    {
        "pointValue": 40,
        "group": "challenge3"
    },
    {
        "pointValue": 45,
        "group": "challenge3"
    },
    {
        "pointValue": 50,
        "group": "challenge3"
    },
    {
        "pointValue": 40,
        "group": "challenge4"
    },
    {
        "pointValue": 45,
        "group": "challenge4"
    },
    {
        "pointValue": 50,
        "group": "challenge4"
    },
    {
        "pointValue": 40,
        "group": "challenge5"
    },
    {
        "pointValue": 45,
        "group": "challenge5"
    },
    {
        "pointValue": 50,
        "group": "challenge5"
    },
    {
        "pointValue": 40,
        "group": "challenge6"
    },
    {
        "pointValue": 45,
        "group": "challenge6"
    },
    {
        "pointValue": 50,
        "group": "challenge6"
    },
    {
        "pointValue": 40,
        "group": "challenge7"
    },
    {
        "pointValue": 45,
        "group": "challenge7"
    },
    {
        "pointValue": 50,
        "group": "challenge7"
    },
    {
        "pointValue": 40,
        "group": "challenge8"
    },
    {
        "pointValue": 45,
        "group": "challenge8"
    },
    {
        "pointValue": 50,
        "group": "challenge8"
    },
    {
        "pointValue": 40,
        "group": "challenge9"
    },
    {
        "pointValue": 45,
        "group": "challenge9"
    },
    {
        "pointValue": 50,
        "group": "challenge9"
    },
    {
        "pointValue": 40,
        "group": "challenge10"
    },
    {
        "pointValue": 45,
        "group": "challenge10"
    },
    {
        "pointValue": 50,
        "group": "challenge10"
    },
    {
        "pointValue": 40,
        "group": "accelerators"
    },
    {
        "pointValue": 45,
        "group": "accelerators"
    },
    {
        "pointValue": 50,
        "group": "accelerators"
    },
    {
        "pointValue": 40,
        "group": "multipliers"
    },
    {
        "pointValue": 45,
        "group": "multipliers"
    },
    {
        "pointValue": 50,
        "group": "multipliers"
    },
    {
        "pointValue": 40,
        "group": "acceleratorBoosts"
    },
    {
        "pointValue": 45,
        "group": "acceleratorBoosts"
    },
    {
        "pointValue": 50,
        "group": "acceleratorBoosts"
    },
    {
        "pointValue": 40,
        "group": "antCrumbs"
    },
    {
        "pointValue": 45,
        "group": "antCrumbs"
    },
    {
        "pointValue": 50,
        "group": "antCrumbs"
    },
    {
        "pointValue": 40,
        "group": "sacMult"
    },
    {
        "pointValue": 45,
        "group": "sacMult"
    },
    {
        "pointValue": 50,
        "group": "sacMult",
        "reward": "{ antAutobuyers: () => 1 }"
    },
    {
        "pointValue": 75,
        "group": "ascensionCount"
    },
    {
        "pointValue": 80,
        "group": "ascensionCount"
    },
    {
        "pointValue": 85,
        "group": "ascensionCount"
    },
    {
        "pointValue": 90,
        "group": "ascensionCount"
    },
    {
        "pointValue": 95,
        "group": "ascensionCount"
    },
    {
        "pointValue": 100,
        "group": "ascensionCount"
    },
    {
        "pointValue": 75,
        "group": "constant"
    },
    {
        "pointValue": 80,
        "group": "constant"
    },
    {
        "pointValue": 85,
        "group": "constant"
    },
    {
        "pointValue": 90,
        "group": "constant"
    },
    {
        "pointValue": 95,
        "group": "constant"
    },
    {
        "pointValue": 100,
        "group": "constant"
    },
    {
        "pointValue": 80,
        "group": "challenge11"
    },
    {
        "pointValue": 90,
        "group": "challenge11"
    },
    {
        "pointValue": 100,
        "group": "challenge11"
    },
    {
        "pointValue": 110,
        "group": "challenge11"
    },
    {
        "pointValue": 120,
        "group": "challenge11"
    },
    {
        "pointValue": 80,
        "group": "challenge12"
    },
    {
        "pointValue": 90,
        "group": "challenge12"
    },
    {
        "pointValue": 100,
        "group": "challenge12"
    },
    {
        "pointValue": 110,
        "group": "challenge12"
    },
    {
        "pointValue": 120,
        "group": "challenge12"
    },
    {
        "pointValue": 80,
        "group": "challenge13"
    },
    {
        "pointValue": 90,
        "group": "challenge13"
    },
    {
        "pointValue": 100,
        "group": "challenge13"
    },
    {
        "pointValue": 110,
        "group": "challenge13"
    },
    {
        "pointValue": 120,
        "group": "challenge13"
    },
    {
        "pointValue": 80,
        "group": "challenge14"
    },
    {
        "pointValue": 90,
        "group": "challenge14"
    },
    {
        "pointValue": 100,
        "group": "challenge14"
    },
    {
        "pointValue": 110,
        "group": "challenge14"
    },
    {
        "pointValue": 120,
        "group": "challenge14"
    },
    {
        "pointValue": 40,
        "group": "speedBlessing"
    },
    {
        "pointValue": 50,
        "group": "speedBlessing"
    },
    {
        "pointValue": 60,
        "group": "speedBlessing"
    },
    {
        "pointValue": 70,
        "group": "speedBlessing"
    },
    {
        "pointValue": 80,
        "group": "speedBlessing"
    },
    {
        "pointValue": 90,
        "group": "speedBlessing"
    },
    {
        "pointValue": 100,
        "group": "speedBlessing"
    },
    {
        "pointValue": 40,
        "group": "speedSpirit"
    },
    {
        "pointValue": 50,
        "group": "speedSpirit"
    },
    {
        "pointValue": 60,
        "group": "speedSpirit"
    },
    {
        "pointValue": 70,
        "group": "speedSpirit"
    },
    {
        "pointValue": 80,
        "group": "speedSpirit"
    },
    {
        "pointValue": 90,
        "group": "speedSpirit"
    },
    {
        "pointValue": 100,
        "group": "speedSpirit"
    },
    {
        "pointValue": 2,
        "group": "runeLevel"
    },
    {
        "pointValue": 4,
        "group": "runeLevel"
    },
    {
        "pointValue": 6,
        "group": "runeLevel"
    },
    {
        "pointValue": 8,
        "group": "runeLevel"
    },
    {
        "pointValue": 10,
        "group": "runeLevel"
    },
    {
        "pointValue": 12,
        "group": "runeLevel"
    },
    {
        "pointValue": 14,
        "group": "runeLevel"
    },
    {
        "pointValue": 16,
        "group": "runeLevel"
    },
    {
        "pointValue": 18,
        "group": "runeLevel"
    },
    {
        "pointValue": 20,
        "group": "runeLevel"
    },
    {
        "pointValue": 22,
        "group": "runeLevel"
    },
    {
        "pointValue": 24,
        "group": "runeLevel"
    },
    {
        "pointValue": 26,
        "group": "runeLevel"
    },
    {
        "pointValue": 28,
        "group": "runeLevel"
    },
    {
        "pointValue": 30,
        "group": "runeLevel"
    },
    {
        "pointValue": 2,
        "group": "runeFreeLevel"
    },
    {
        "pointValue": 4,
        "group": "runeFreeLevel"
    },
    {
        "pointValue": 6,
        "group": "runeFreeLevel"
    },
    {
        "pointValue": 8,
        "group": "runeFreeLevel"
    },
    {
        "pointValue": 10,
        "group": "runeFreeLevel"
    },
    {
        "pointValue": 12,
        "group": "runeFreeLevel"
    },
    {
        "pointValue": 14,
        "group": "runeFreeLevel"
    },
    {
        "pointValue": 16,
        "group": "runeFreeLevel"
    },
    {
        "pointValue": 18,
        "group": "runeFreeLevel"
    },
    {
        "pointValue": 20,
        "group": "runeFreeLevel"
    },
    {
        "pointValue": 22,
        "group": "runeFreeLevel"
    },
    {
        "pointValue": 24,
        "group": "runeFreeLevel"
    },
    {
        "pointValue": 26,
        "group": "runeFreeLevel"
    },
    {
        "pointValue": 28,
        "group": "runeFreeLevel"
    },
    {
        "pointValue": 30,
        "group": "runeFreeLevel"
    },
    {
        "pointValue": 5,
        "group": "campaignTokens"
    },
    {
        "pointValue": 10,
        "group": "campaignTokens"
    },
    {
        "pointValue": 15,
        "group": "campaignTokens"
    },
    {
        "pointValue": 20,
        "group": "campaignTokens"
    },
    {
        "pointValue": 25,
        "group": "campaignTokens"
    },
    {
        "pointValue": 30,
        "group": "campaignTokens"
    },
    {
        "pointValue": 35,
        "group": "campaignTokens"
    },
    {
        "pointValue": 40,
        "group": "campaignTokens"
    },
    {
        "pointValue": 45,
        "group": "campaignTokens"
    },
    {
        "pointValue": 50,
        "group": "campaignTokens"
    },
    {
        "pointValue": 2,
        "group": "prestigeCount"
    },
    {
        "pointValue": 4,
        "group": "prestigeCount",
        "reward": "{ prestigeCountMultiplier: () => Math.max(1, 1 + Math.floor(Math.log10(player.prestigeCount))) }"
    },
    {
        "pointValue": 6,
        "group": "prestigeCount",
        "reward": "{ duplicationRuneUnlock: () => 1 }"
    },
    {
        "pointValue": 8,
        "group": "prestigeCount",
        "reward": "{ offeringBonus: () => 1 + 0.02 * Math.max(1, 1 + Math.floor(Math.log10(player.prestigeCount))) }"
    },
    {
        "pointValue": 10,
        "group": "prestigeCount"
    },
    {
        "pointValue": 12,
        "group": "prestigeCount"
    },
    {
        "pointValue": 14,
        "group": "prestigeCount",
        "reward": "{ transcendToPrestige: () => 1 }"
    },
    {
        "pointValue": 16,
        "group": "prestigeCount"
    },
    {
        "pointValue": 18,
        "group": "prestigeCount",
        "reward": "{ transcensionCountMultiplier: () => Math.min(4, 1.25 + 2.75 * Math.floor(player.prestigecounter / 10)) }"
    },
    {
        "pointValue": 20,
        "group": "prestigeCount"
    },
    {
        "pointValue": 22,
        "group": "prestigeCount"
    },
    {
        "pointValue": 24,
        "group": "prestigeCount"
    },
    {
        "pointValue": 26,
        "group": "prestigeCount"
    },
    {
        "pointValue": 28,
        "group": "prestigeCount"
    },
    {
        "pointValue": 30,
        "group": "prestigeCount"
    },
    {
        "pointValue": 3,
        "group": "transcensionCount"
    },
    {
        "pointValue": 6,
        "group": "transcensionCount",
        "reward": "{ transcensionCountMultiplier: () => Math.max(1, 1 + Math.floor(Math.log10(player.transcendCount))) }"
    },
    {
        "pointValue": 9,
        "group": "transcensionCount",
        "reward": "{ salvage: () => 2 * Math.max(1, 1 + Math.floor(Math.log10(player.transcendCount))) }"
    },
    {
        "pointValue": 12,
        "group": "transcensionCount",
        "reward": "{ prismRuneUnlock: () => 1 }"
    },
    {
        "pointValue": 15,
        "group": "transcensionCount"
    },
    {
        "pointValue": 18,
        "group": "transcensionCount"
    },
    {
        "pointValue": 21,
        "group": "transcensionCount",
        "reward": "{ reincarnationToTranscend: () => 1 }"
    },
    {
        "pointValue": 24,
        "group": "transcensionCount"
    },
    {
        "pointValue": 27,
        "group": "transcensionCount",
        "reward": "{ reincarnationCountMultiplier: () => Math.min(4, 1.25 + 2.75 * Math.floor(player.prestigecounter / 1000)) }"
    },
    {
        "pointValue": 30,
        "group": "transcensionCount"
    },
    {
        "pointValue": 33,
        "group": "transcensionCount"
    },
    {
        "pointValue": 36,
        "group": "transcensionCount"
    },
    {
        "pointValue": 39,
        "group": "transcensionCount"
    },
    {
        "pointValue": 42,
        "group": "transcensionCount"
    },
    {
        "pointValue": 45,
        "group": "transcensionCount"
    },
    {
        "pointValue": 4,
        "group": "reincarnationCount"
    },
    {
        "pointValue": 8,
        "group": "reincarnationCount",
        "reward": "{ reincarnationCountMultiplier: () => Math.max(1, 1 + Math.floor(Math.log10(player.reincarnationCount))) }"
    },
    {
        "pointValue": 12,
        "group": "reincarnationCount",
        "reward": "{ obtainiumBonus: () => 1 + 0.02 * Math.max(1, 1 + Math.floor(Math.log10(player.reincarnationCount))) }"
    },
    {
        "pointValue": 16,
        "group": "reincarnationCount"
    },
    {
        "pointValue": 20,
        "group": "reincarnationCount",
        "reward": "{ thriftRuneUnlock: () => 1 }"
    },
    {
        "pointValue": 24,
        "group": "reincarnationCount"
    },
    {
        "pointValue": 28,
        "group": "reincarnationCount"
    },
    {
        "pointValue": 32,
        "group": "reincarnationCount"
    },
    {
        "pointValue": 36,
        "group": "reincarnationCount",
        "reward": "{\n      prestigeCountMultiplier: () => Math.min(4, 1.25 + 2.75 * Math.floor(player.prestigecounter / 1e6)),\n      ascensionCountMultiplier: () => Math.min(1.25, 1 + 0.25 * Math.floor(player.ascensionCounter / 1e6))\n    }"
    },
    {
        "pointValue": 40,
        "group": "reincarnationCount"
    },
    {
        "pointValue": 44,
        "group": "reincarnationCount"
    },
    {
        "pointValue": 48,
        "group": "reincarnationCount"
    },
    {
        "pointValue": 52,
        "group": "reincarnationCount"
    },
    {
        "pointValue": 56,
        "group": "reincarnationCount"
    },
    {
        "pointValue": 60,
        "group": "reincarnationCount"
    },
    {
        "pointValue": 3,
        "group": "sacCount",
        "reward": "{ freeAntUpgrades: () => 1 }"
    },
    {
        "pointValue": 6,
        "group": "sacCount",
        "reward": "{ antSacrificeCountMultiplier: () => 2, hicAutobuy: () => 1 }"
    },
    {
        "pointValue": 9,
        "group": "sacCount",
        "reward": "{ autoAntSacrifice: () => 1 }"
    },
    {
        "pointValue": 12,
        "group": "sacCount",
        "reward": "{ antELOAdditiveMultiplier: () => 0.01, praemoenioAutobuy: () => 1 }"
    },
    {
        "pointValue": 15,
        "group": "sacCount",
        "reward": "{ antELOAdditive: () => 25 }"
    },
    {
        "pointValue": 17,
        "group": "sacCount",
        "reward": "{ antSpeed2UpgradeImprover: () => achievementLevel, phylacteriumAutobuy: () => 1 }"
    },
    {
        "pointValue": 19,
        "group": "sacCount"
    },
    {
        "pointValue": 21,
        "group": "sacCount"
    },
    {
        "pointValue": 23,
        "group": "sacCount"
    },
    {
        "pointValue": 25,
        "group": "sacCount",
        "reward": "{ preserveAnthillCountSingularity: () => 1 }"
    },
    {
        "pointValue": 40,
        "group": "sacCount"
    }
]

export const progressiveAchievements: Record<ProgressiveAchievements, ProgressiveAchievement> = [
    {
        "pointsAwarded": "pointsAwarded: (cached: number) => {\n            console.log(cached)\n            return Math.min(200, Math.floor(cached / 1000)) + Math.min(400, Math.floor(cached / 2500))\n                + Math.min(400, Math.floor(cached / 12500))\n        }"
    },
    {
        "pointsAwarded": "pointsAwarded: (cached: number) => {\n            return Math.min(100, Math.floor(cached / 250)) + Math.min(200, Math.floor(cached / 750))\n                + Math.min(200, Math.floor(cached / 2500))\n        }"
    },
    {
        "pointsAwarded": "pointsAwarded: (_cached: number) => {\n            let pointValue = 0\n            for (let ant = AntProducers.Workers; ant <= LAST_ANT_PRODUCER; ant++) {\n                pointValue += 3 * player.ants.masteries[ant].highestMastery\n                if (player.ants.masteries[ant].highestMastery >= 12) {\n                    pointValue += 4\n                }"
    },
    {
        "pointsAwarded": "pointsAwarded: (_cached: number) => {\n            const leaderboardELO = calculateLeaderboardValue(player.ants.highestRebornELOEver)\n            return Math.min(100, Math.floor(leaderboardELO / 100))\n                + Math.min(150, Math.floor(leaderboardELO / 1000))\n                + Math.min(150, Math.floor(leaderboardELO / 9000))\n                + Math.min(200, Math.floor(leaderboardELO / 75000))\n                + Math.min(400, Math.floor(leaderboardELO / 150000))\n        }"
    },
    {
        "pointsAwarded": "pointsAwarded: (_cached: number) => {\n            return 9 * player.highestSingularityCount\n                + 3 * Math.max(0, player.highestSingularityCount - 100)\n                + 3 * Math.max(0, player.highestSingularityCount - 200)\n        }"
    },
    {
        "pointsAwarded": "pointsAwarded: (cached: number) => {\n            return Math.min(200, Math.floor(cached / 100))\n                + Math.min(200, Math.floor(cached / 10000))\n                + Math.min(400, Math.floor(400 * Math.sqrt(cached / 1e8)))\n        }"
    },
    {
        "pointsAwarded": "pointsAwarded: (cached: number) => {\n            return Math.min(200, Math.floor(cached / 25))\n                + Math.min(200, Math.floor(cached / 2500))\n                + Math.min(400, Math.floor(400 * cached / 5e6))\n                + Math.min(200, Math.floor(200 * cached / 1.25e7))\n        }"
    },
    {
        "pointsAwarded": "pointsAwarded: (_cached: number) => {\n            let pointValue = 0\n            for (const chal of Object.keys(player.singularityChallenges) as SingularityChallengeDataKeys[]) {\n                pointValue += player.singularityChallenges[chal].rewardAP\n            }"
    },
    {
        "pointsAwarded": "pointsAwarded: (_cached: number) => {\n            let pointValue = 0\n            // Go through all sing upgrades. if the max level is NOT -1, add 5 points if the upgrade level equals max level\n            for (const upgrade of Object.values(goldenQuarkUpgrades)) {\n                if (upgrade.maxLevel !== -1 && upgrade.level >= upgrade.maxLevel) {\n                    pointValue += 5\n                }"
    },
    {
        "pointsAwarded": "pointsAwarded: (_cached: number) => {\n            let pointValue = 0\n            // Go through all octeract upgrades. if the max level is NOT -1, add 8 points if the upgrade level equals max level\n            for (const upgrade of Object.values(octeractUpgrades)) {\n                if (upgrade.maxLevel !== -1 && upgrade.level >= upgrade.maxLevel) {\n                    pointValue += 8\n                }"
    },
    {
        "pointsAwarded": "pointsAwarded: () => {\n            let pointValue = 0\n            for (const upgrade of Object.values(redAmbrosiaUpgrades)) {\n                if (upgrade.level >= upgrade.maxLevel) {\n                    pointValue += 10\n                }"
    },
    {
        "pointsAwarded": "pointsAwarded: (cached: number) => {\n            return 5 * cached\n        }"
    }
]



