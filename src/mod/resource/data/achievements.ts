export interface Achievement {
    group: string
    reward?: string
}

export const achRewards: Record<AchievementRewards, () => number | boolean> = {
    acceleratorPower: (): number => {
        return achievementsByReward.acceleratorPower.reduce(
            (sum, index) => sum + (player.achievements[index] ? achievements[index].reward!.acceleratorPower!() : 0),
            0
        )
    },
    accelerators: (): number => {
        return achievementsByReward.accelerators.reduce(
            (sum, index) => sum + (player.achievements[index] ? achievements[index].reward!.accelerators!() : 0),
            0
        )
    },
    multipliers: (): number => {
        return achievementsByReward.multipliers.reduce(
            (sum, index) => sum + (player.achievements[index] ? achievements[index].reward!.multipliers!() : 0),
            0
        )
    },
    accelBoosts: (): number => {
        return achievementsByReward.accelBoosts.reduce(
            (sum, index) => sum + (player.achievements[index] ? achievements[index].reward!.accelBoosts!() : 0),
            0
        )
    },
    crystalMultiplier: (): number => {
        return achievementsByReward.crystalMultiplier.reduce(
            (prod, index) => prod * (player.achievements[index] ? achievements[index].reward!.crystalMultiplier!() : 1),
            1
        )
    },
    quarkGain: (): number => {
        return achievementsByReward.quarkGain.reduce(
            (prod, index) => prod * (player.achievements[index] ? achievements[index].reward!.quarkGain!() : 1),
            1
        )
    },
    taxReduction: (): number => {
        return achievementsByReward.taxReduction.reduce(
            (prod, index) => prod * (player.achievements[index] ? achievements[index].reward!.taxReduction!() : 1),
            1
        )
    },
    particleGain: (): number => {
        return achievementsByReward.particleGain.reduce(
            (prod, index) => prod * (player.achievements[index] ? achievements[index].reward!.particleGain!() : 1),
            1
        )
    },
    chronosTalisman: (): boolean => {
        return Boolean(player.achievements[achievementsByReward.chronosTalisman[0]])
    },
    midasTalisman: (): boolean => {
        return Boolean(player.achievements[achievementsByReward.midasTalisman[0]])
    },
    metaphysicsTalisman: (): boolean => {
        return Boolean(player.achievements[achievementsByReward.metaphysicsTalisman[0]])
    },
    polymathTalisman: (): boolean => {
        return Boolean(player.achievements[achievementsByReward.polymathTalisman[0]])
    },
    wowSquareTalisman: (): boolean => {
        return Boolean(player.achievements[achievementsByReward.wowSquareTalisman[0]])
    },
    conversionExponent: (): number => {
        return achievementsByReward.conversionExponent.reduce(
            (sum, index) => sum + (player.achievements[index] ? achievements[index].reward!.conversionExponent!() : 0),
            0
        )
    },
    talismanPower: (): number => {
        return achievementsByReward.talismanPower.reduce(
            (sum, index) => sum + (player.achievements[index] ? achievements[index].reward!.talismanPower!() : 0),
            0
        )
    },
    sacrificeMult: (): number => {
        return achievementsByReward.sacrificeMult.reduce(
            (prod, index) => prod * (player.achievements[index] ? achievements[index].reward!.sacrificeMult!() : 1),
            1
        )
    },
    antSpeed: (): number => {
        return achievementsByReward.antSpeed.reduce(
            (prod, index) => prod * (player.achievements[index] ? achievements[index].reward!.antSpeed!() : 1),
            1
        )
    },
    antSacrificeUnlock: (): boolean => {
        return Boolean(player.achievements[achievementsByReward.antSacrificeUnlock[0]])
    },
    antAutobuyers: (): number => {
        return achievementsByReward.antAutobuyers.reduce(
            (sum, index) => sum + (player.achievements[index] ? achievements[index].reward!.antAutobuyers!() : 0),
            0
        )
    },
    preserveAnthillCount: (): boolean => {
        return Boolean(player.achievements[achievementsByReward.preserveAnthillCount[0]])
    },
    preserveAnthillCountSingularity: (): boolean => {
        return Boolean(player.achievements[achievementsByReward.preserveAnthillCountSingularity[0]])
    },
    inceptusAutobuy: (): boolean => {
        return Boolean(player.achievements[achievementsByReward.inceptusAutobuy[0]])
    },
    fortunaeAutobuy: (): boolean => {
        return Boolean(player.achievements[achievementsByReward.fortunaeAutobuy[0]])
    },
    tributumAutobuy: (): boolean => {
        return Boolean(player.achievements[achievementsByReward.tributumAutobuy[0]])
    },
    celeritasAutobuy: (): boolean => {
        return Boolean(player.achievements[achievementsByReward.celeritasAutobuy[0]])
    },
    exploratoremAutobuy: (): boolean => {
        return Boolean(player.achievements[achievementsByReward.exploratoremAutobuy[0]])
    },
    sacrificiumAutobuy: (): boolean => {
        return Boolean(player.achievements[achievementsByReward.sacrificiumAutobuy[0]])
    },
    experientiaAutobuy: (): boolean => {
        return Boolean(player.achievements[achievementsByReward.experientiaAutobuy[0]])
    },
    hicAutobuy: (): boolean => {
        return Boolean(player.achievements[achievementsByReward.hicAutobuy[0]])
    },
    scientiaAutobuy: (): boolean => {
        return Boolean(player.achievements[achievementsByReward.scientiaAutobuy[0]])
    },
    praemoenioAutobuy: (): boolean => {
        return Boolean(player.achievements[achievementsByReward.praemoenioAutobuy[0]])
    },
    phylacteriumAutobuy: (): boolean => {
        return Boolean(player.achievements[achievementsByReward.phylacteriumAutobuy[0]])
    },
    antELOAdditive: (): number => {
        return achievementsByReward.antELOAdditive.reduce(
            (sum, index) => sum + (player.achievements[index] ? achievements[index].reward!.antELOAdditive!() : 0),
            0
        )
    },
    antELOAdditiveMultiplier: (): number => {
        return achievementsByReward.antELOAdditiveMultiplier.reduce(
            (prod, index) =>
                prod + (player.achievements[index] ? achievements[index].reward!.antELOAdditiveMultiplier!() : 0),
            0
        )
    },
    ascensionCountMultiplier: (): number => {
        return achievementsByReward.ascensionCountMultiplier.reduce(
            (prod, index) =>
                prod * (player.achievements[index] ? achievements[index].reward!.ascensionCountMultiplier!() : 1),
            1
        )
    },
    ascensionCountAdditive: (): number => {
        return achievementsByReward.ascensionCountAdditive.reduce(
            (sum, index) => sum + (player.achievements[index] ? achievements[index].reward!.ascensionCountAdditive!() : 0),
            0
        )
    },
    wowCubeGain: (): number => {
        return achievementsByReward.wowCubeGain.reduce(
            (prod, index) => prod * (player.achievements[index] ? achievements[index].reward!.wowCubeGain!() : 1),
            1
        )
    },
    wowTesseractGain: (): number => {
        return achievementsByReward.wowTesseractGain.reduce(
            (prod, index) => prod * (player.achievements[index] ? achievements[index].reward!.wowTesseractGain!() : 1),
            1
        )
    },
    wowHypercubeGain: (): number => {
        return achievementsByReward.wowHypercubeGain.reduce(
            (prod, index) => prod * (player.achievements[index] ? achievements[index].reward!.wowHypercubeGain!() : 1),
            1
        )
    },
    wowPlatonicGain: (): number => {
        return achievementsByReward.wowPlatonicGain.reduce(
            (prod, index) => prod * (player.achievements[index] ? achievements[index].reward!.wowPlatonicGain!() : 1),
            1
        )
    },
    wowHepteractGain: (): number => {
        return achievementsByReward.wowHepteractGain.reduce(
            (prod, index) => prod * (player.achievements[index] ? achievements[index].reward!.wowHepteractGain!() : 1),
            1
        )
    },
    ascensionScore: (): number => {
        return achievementsByReward.ascensionScore.reduce(
            (prod, index) => prod * (player.achievements[index] ? achievements[index].reward!.ascensionScore!() : 1),
            1
        )
    },
    ascensionRewardScaling: (): boolean => {
        return Boolean(player.achievements[achievementsByReward.ascensionRewardScaling[0]])
    },
    constUpgrade1Buff: (): number => {
        return achievementsByReward.constUpgrade1Buff.reduce(
            (sum, index) => sum + (player.achievements[index] ? achievements[index].reward!.constUpgrade1Buff!() : 0),
            0
        )
    },
    constUpgrade2Buff: (): number => {
        return achievementsByReward.constUpgrade2Buff.reduce(
            (sum, index) => sum + (player.achievements[index] ? achievements[index].reward!.constUpgrade2Buff!() : 0),
            0
        )
    },
    platonicToHypercubes: (): number => {
        return achievementsByReward.platonicToHypercubes.reduce(
            (sum, index) => sum + (player.achievements[index] ? achievements[index].reward!.platonicToHypercubes!() : 0),
            0
        )
    },
    statTracker: (): boolean => {
        return Boolean(player.achievements[achievementsByReward.statTracker[0]])
    },
    overfluxConversionRate: (): number => {
        return achievementsByReward.overfluxConversionRate.reduce(
            (prod, index) => prod * (player.achievements[index] ? achievements[index].reward!.overfluxConversionRate!() : 1),
            1
        )
    },
    diamondUpgrade18: (): boolean => {
        return Boolean(player.achievements[achievementsByReward.diamondUpgrade18[0]])
    },
    diamondUpgrade19: (): boolean => {
        return Boolean(player.achievements[achievementsByReward.diamondUpgrade19[0]])
    },
    diamondUpgrade20: (): boolean => {
        return Boolean(player.achievements[achievementsByReward.diamondUpgrade20[0]])
    },
    prestigeCountMultiplier: (): number => {
        return achievementsByReward.prestigeCountMultiplier.reduce(
            (prod, index) => prod * (player.achievements[index] ? achievements[index].reward!.prestigeCountMultiplier!() : 1),
            1
        )
    },
    transcensionCountMultiplier: (): number => {
        return achievementsByReward.transcensionCountMultiplier.reduce(
            (prod, index) =>
                prod * (player.achievements[index] ? achievements[index].reward!.transcensionCountMultiplier!() : 1),
            1
        )
    },
    reincarnationCountMultiplier: (): number => {
        return achievementsByReward.reincarnationCountMultiplier.reduce(
            (prod, index) =>
                prod * (player.achievements[index] ? achievements[index].reward!.reincarnationCountMultiplier!() : 1),
            1
        )
    },
    duplicationRuneUnlock: (): boolean => {
        return Boolean(player.achievements[achievementsByReward.duplicationRuneUnlock[0]])
    },
    offeringBonus: (): number => {
        return achievementsByReward.offeringBonus.reduce(
            (prod, index) => prod * (player.achievements[index] ? achievements[index].reward!.offeringBonus!() : 1),
            1
        )
    },
    obtainiumBonus: (): number => {
        return achievementsByReward.obtainiumBonus.reduce(
            (prod, index) => prod * (player.achievements[index] ? achievements[index].reward!.obtainiumBonus!() : 1),
            1
        )
    },
    salvage: (): number => {
        return achievementsByReward.salvage.reduce(
            (sum, index) => sum + (player.achievements[index] ? achievements[index].reward!.salvage!() : 0),
            0
        )
    },
    prismRuneUnlock: (): boolean => {
        return Boolean(player.achievements[achievementsByReward.prismRuneUnlock[0]])
    },
    thriftRuneUnlock: (): boolean => {
        return Boolean(player.achievements[achievementsByReward.thriftRuneUnlock[0]])
    },
    transcendToPrestige: (): boolean => {
        return Boolean(player.achievements[achievementsByReward.transcendToPrestige[0]])
    },
    reincarnationToTranscend: (): boolean => {
        return Boolean(player.achievements[achievementsByReward.reincarnationToTranscend[0]])
    },
    freeAntUpgrades: (): number => {
        return achievementsByReward.freeAntUpgrades.reduce(
            (sum, index) => sum + (player.achievements[index] ? achievements[index].reward!.freeAntUpgrades!() : 0),
            0
        )
    },
    antSacrificeCountMultiplier: (): number => {
        return achievementsByReward.antSacrificeCountMultiplier.reduce(
            (prod, index) =>
                prod * (player.achievements[index] ? achievements[index].reward!.antSacrificeCountMultiplier!() : 1),
            1
        )
    },
    autoAntSacrifice: (): boolean => {
        return Boolean(player.achievements[achievementsByReward.autoAntSacrifice[0]])
    },
    antSpeed2UpgradeImprover: (): number => {
        return achievementsByReward.antSpeed2UpgradeImprover.reduce(
            (sum, index) => sum + (player.achievements[index] ? achievements[index].reward!.antSpeed2UpgradeImprover!() : 0),
            0
        )
    }
}

export const achievements: Achievement[] =
    [
        {
            "group": "ungrouped"
        },
        {
            "group": "firstOwnedCoin"
        },
        {
            "group": "firstOwnedCoin"
        },
        {
            "group": "firstOwnedCoin",
            "reward": "{ acceleratorPower: () => 0.001 }"
        },
        {
            "group": "firstOwnedCoin"
        },
        {
            "group": "firstOwnedCoin",
            "reward": "{ accelerators: () => Math.floor(unlockCondition: 0 / 500) }"
        },
        {
            "group": "firstOwnedCoin",
            "reward": "{ multipliers: () => Math.floor(unlockCondition: 0 / 1000) }"
        },
        {
            "group": "firstOwnedCoin",
            "reward": "{ accelBoosts: () => Math.floor(unlockCondition: 0 / 2000) }"
        },
        {
            "group": "secondOwnedCoin"
        },
        {
            "group": "secondOwnedCoin"
        },
        {
            "group": "secondOwnedCoin",
            "reward": "{ acceleratorPower: () => 0.0015 }"
        },
        {
            "group": "secondOwnedCoin"
        },
        {
            "group": "secondOwnedCoin",
            "reward": "{ accelerators: () => Math.floor(unlockCondition: 0 / 500) }"
        },
        {
            "group": "secondOwnedCoin",
            "reward": "{ multipliers: () => Math.floor(unlockCondition: 0 / 1000) }"
        },
        {
            "group": "secondOwnedCoin",
            "reward": "{ accelBoosts: () => Math.floor(unlockCondition: 0 / 2000) }"
        },
        {
            "group": "thirdOwnedCoin"
        },
        {
            "group": "thirdOwnedCoin"
        },
        {
            "group": "thirdOwnedCoin",
            "reward": "{ acceleratorPower: () => 0.002 }"
        },
        {
            "group": "thirdOwnedCoin"
        },
        {
            "group": "thirdOwnedCoin",
            "reward": "{ accelerators: () => Math.floor(unlockCondition: 0 / 500) }"
        },
        {
            "group": "thirdOwnedCoin",
            "reward": "{ multipliers: () => Math.floor(unlockCondition: 0 / 1000) }"
        },
        {
            "group": "thirdOwnedCoin",
            "reward": "{ accelBoosts: () => Math.floor(unlockCondition: 0 / 2000) }"
        },
        {
            "group": "fourthOwnedCoin"
        },
        {
            "group": "fourthOwnedCoin"
        },
        {
            "group": "fourthOwnedCoin",
            "reward": "{ acceleratorPower: () => 0.002 }"
        },
        {
            "group": "fourthOwnedCoin"
        },
        {
            "group": "fourthOwnedCoin",
            "reward": "{ accelerators: () => Math.floor(unlockCondition: 0 / 500) }"
        },
        {
            "group": "fourthOwnedCoin",
            "reward": "{ multipliers: () => Math.floor(unlockCondition: 0 / 1000) }"
        },
        {
            "group": "fourthOwnedCoin",
            "reward": "{ accelBoosts: () => Math.floor(unlockCondition: 0 / 2000) }"
        },
        {
            "group": "fifthOwnedCoin"
        },
        {
            "group": "fifthOwnedCoin"
        },
        {
            "group": "fifthOwnedCoin",
            "reward": "{ acceleratorPower: () => 0.003 }"
        },
        {
            "group": "fifthOwnedCoin"
        },
        {
            "group": "fifthOwnedCoin",
            "reward": "{ accelerators: () => Math.floor(unlockCondition: 0 / 500) }"
        },
        {
            "group": "fifthOwnedCoin",
            "reward": "{ multipliers: () => Math.floor(unlockCondition: 0 / 1000) }"
        },
        {
            "group": "fifthOwnedCoin",
            "reward": "{ accelBoosts: () => Math.floor(unlockCondition: 0 / 2000) }"
        },
        {
            "group": "prestigePointGain"
        },
        {
            "group": "prestigePointGain",
            "reward": "{ crystalMultiplier: () => Math.max(1, Decimal.log(unlockCondition: 0, Math.E)) }"
        },
        {
            "group": "prestigePointGain"
        },
        {
            "group": "prestigePointGain"
        },
        {
            "group": "prestigePointGain"
        },
        {
            "group": "prestigePointGain"
        },
        {
            "group": "prestigePointGain"
        },
        {
            "group": "transcendPointGain"
        },
        {
            "group": "transcendPointGain"
        },
        {
            "group": "transcendPointGain",
            "reward": "{ taxReduction: () => 0.95 }"
        },
        {
            "group": "transcendPointGain",
            "reward": "{ taxReduction: () => 0.95 }"
        },
        {
            "group": "transcendPointGain",
            "reward": "{ taxReduction: () => 0.9 }"
        },
        {
            "group": "transcendPointGain"
        },
        {
            "group": "transcendPointGain"
        },
        {
            "group": "reincarnationPointGain",
            "reward": "{ particleGain: () => 2 }"
        },
        {
            "group": "reincarnationPointGain"
        },
        {
            "group": "reincarnationPointGain"
        },
        {
            "group": "reincarnationPointGain"
        },
        {
            "group": "reincarnationPointGain"
        },
        {
            "group": "reincarnationPointGain"
        },
        {
            "group": "reincarnationPointGain"
        },
        {
            "group": "ungrouped",
            "reward": "{ multipliers: () => 1 }"
        },
        {
            "group": "ungrouped",
            "reward": "{ multipliers: () => 2 }"
        },
        {
            "group": "ungrouped",
            "reward": "{ multipliers: () => 4 }"
        },
        {
            "group": "ungrouped",
            "reward": "{ accelerators: () => 2 }"
        },
        {
            "group": "ungrouped",
            "reward": "{ accelerators: () => 4 }"
        },
        {
            "group": "ungrouped",
            "reward": "{ accelerators: () => 8 }"
        },
        {
            "group": "ungrouped"
        },
        {
            "group": "ungrouped"
        },
        {
            "group": "ungrouped"
        },
        {
            "group": "ungrouped"
        },
        {
            "group": "ungrouped"
        },
        {
            "group": "ungrouped"
        },
        {
            "group": "ungrouped"
        },
        {
            "group": "ungrouped"
        },
        {
            "group": "ungrouped",
            "reward": "{ conversionExponent: () => 0.01 }"
        },
        {
            "group": "ungrouped",
            "reward": "{ conversionExponent: () => 0.01 }"
        },
        {
            "group": "ungrouped",
            "reward": "{ conversionExponent: () => 0.01 }"
        },
        {
            "group": "ungrouped",
            "reward": "{ conversionExponent: () => 0.01 }"
        },
        {
            "group": "ungrouped",
            "reward": "{ conversionExponent: () => 0.01 }"
        },
        {
            "group": "ungrouped",
            "reward": "{ conversionExponent: () => 0.01 }"
        },
        {
            "group": "ungrouped",
            "reward": "{ conversionExponent: () => 0.01 }"
        },
        {
            "group": "challenge1"
        },
        {
            "group": "challenge1"
        },
        {
            "group": "challenge1"
        },
        {
            "group": "challenge1"
        },
        {
            "group": "challenge1",
            "reward": "{ taxReduction: () => 0.96 }"
        },
        {
            "group": "challenge1"
        },
        {
            "group": "challenge1"
        },
        {
            "group": "challenge2"
        },
        {
            "group": "challenge2"
        },
        {
            "group": "challenge2"
        },
        {
            "group": "challenge2"
        },
        {
            "group": "challenge2",
            "reward": "{ taxReduction: () => 0.96 }"
        },
        {
            "group": "challenge2"
        },
        {
            "group": "challenge2"
        },
        {
            "group": "challenge3"
        },
        {
            "group": "challenge3"
        },
        {
            "group": "challenge3"
        },
        {
            "group": "challenge3"
        },
        {
            "group": "challenge3",
            "reward": "{ taxReduction: () => 0.96 }"
        },
        {
            "group": "challenge3"
        },
        {
            "group": "challenge3"
        },
        {
            "group": "challenge4"
        },
        {
            "group": "challenge4"
        },
        {
            "group": "challenge4"
        },
        {
            "group": "challenge4"
        },
        {
            "group": "challenge4",
            "reward": "{ taxReduction: () => 0.96 }"
        },
        {
            "group": "challenge4"
        },
        {
            "group": "challenge4"
        },
        {
            "group": "challenge5"
        },
        {
            "group": "challenge5"
        },
        {
            "group": "challenge5"
        },
        {
            "group": "challenge5"
        },
        {
            "group": "challenge5",
            "reward": "{ taxReduction: () => 0.96 }"
        },
        {
            "group": "challenge5"
        },
        {
            "group": "challenge5"
        },
        {
            "group": "challenge6"
        },
        {
            "group": "challenge6"
        },
        {
            "group": "challenge6"
        },
        {
            "group": "challenge6"
        },
        {
            "group": "challenge6",
            "reward": "{ taxReduction: () => 0.95 }"
        },
        {
            "group": "challenge6",
            "reward": "{\n            taxReduction: () =>\n                Math.pow(\n                    0.9925,\n                    unlockCondition: 0[6] + unlockCondition: 0[7] + unlockCondition: 0[8]\n                + unlockCondition: 0[9] + unlockCondition: 0[10]\n                )\n        }"
        },
        {
            "group": "challenge6"
        },
        {
            "group": "challenge7",
            "reward": "{ diamondUpgrade18: () => 0 }"
        },
        {
            "group": "challenge7"
        },
        {
            "group": "challenge7"
        },
        {
            "group": "challenge7"
        },
        {
            "group": "challenge7",
            "reward": "{ taxReduction: () => 0.95 }"
        },
        {
            "group": "challenge7"
        },
        {
            "group": "challenge7",
            "reward": "{ chronosTalisman: () => 1 }"
        },
        {
            "group": "challenge8",
            "reward": "{ diamondUpgrade19: () => 1 }"
        },
        {
            "group": "challenge8"
        },
        {
            "group": "challenge8"
        },
        {
            "group": "challenge8"
        },
        {
            "group": "challenge8",
            "reward": "{ taxReduction: () => 0.95 }"
        },
        {
            "group": "challenge8"
        },
        {
            "group": "challenge8",
            "reward": "{ midasTalisman: () => 1 }"
        },
        {
            "group": "challenge9",
            "reward": "{ diamondUpgrade20: () => 1 }"
        },
        {
            "group": "challenge9",
            "reward": "{ talismanPower: () => 0.02 }"
        },
        {
            "group": "challenge9",
            "reward": "{ talismanPower: () => 0.02 }"
        },
        {
            "group": "challenge9",
            "reward": "{ sacrificeMult: () => 1.25, experientiaAutobuy: () => 1 }"
        },
        {
            "group": "challenge9"
        },
        {
            "group": "challenge9"
        },
        {
            "group": "challenge9",
            "reward": "{ metaphysicsTalisman: () => 1 }"
        },
        {
            "group": "challenge10"
        },
        {
            "group": "challenge10"
        },
        {
            "group": "challenge10"
        },
        {
            "group": "challenge10",
            "reward": "{ talismanPower: () => 0.025 }"
        },
        {
            "group": "challenge10",
            "reward": "{ talismanPower: () => 0.025 }"
        },
        {
            "group": "challenge10"
        },
        {
            "group": "challenge10",
            "reward": "{ polymathTalisman: () => 1 }"
        },
        {
            "group": "accelerators"
        },
        {
            "group": "accelerators",
            "reward": "{ acceleratorPower: () => 0.01 }"
        },
        {
            "group": "accelerators"
        },
        {
            "group": "accelerators",
            "reward": "{ accelerators: () => 5 }"
        },
        {
            "group": "accelerators",
            "reward": "{ accelerators: () => 12 }"
        },
        {
            "group": "accelerators",
            "reward": "{ accelerators: () => 25 }"
        },
        {
            "group": "accelerators",
            "reward": "{ accelerators: () => 50 }"
        },
        {
            "group": "multipliers"
        },
        {
            "group": "multipliers",
            "reward": "{ multipliers: () => 1 }"
        },
        {
            "group": "multipliers"
        },
        {
            "group": "multipliers",
            "reward": "{ multipliers: () => 1 }"
        },
        {
            "group": "multipliers",
            "reward": "{ multipliers: () => 3 }"
        },
        {
            "group": "multipliers",
            "reward": "{ multipliers: () => 6 }"
        },
        {
            "group": "multipliers",
            "reward": "{ multipliers: () => 10 }"
        },
        {
            "group": "acceleratorBoosts"
        },
        {
            "group": "acceleratorBoosts"
        },
        {
            "group": "acceleratorBoosts"
        },
        {
            "group": "acceleratorBoosts"
        },
        {
            "group": "acceleratorBoosts"
        },
        {
            "group": "acceleratorBoosts"
        },
        {
            "group": "acceleratorBoosts"
        },
        {
            "group": "antCrumbs",
            "reward": "{ antSpeed: () => Decimal.log(unlockCondition: 0(10), 10) }"
        },
        {
            "group": "antCrumbs"
        },
        {
            "group": "antCrumbs",
            "reward": "{ antSpeed: () => 1.2 }"
        },
        {
            "group": "antCrumbs",
            "reward": "{ antSpeed: () => 1.25 }"
        },
        {
            "group": "antCrumbs",
            "reward": "{ antSpeed: () => 1.4, antSacrificeUnlock: () => 1, antAutobuyers: () => 1 }"
        },
        {
            "group": "antCrumbs",
            "reward": "{ antSpeed: () => 1 + unlockCondition: 0 / 1000, scientiaAutobuy: () => 1 }"
        },
        {
            "group": "antCrumbs"
        },
        {
            "group": "sacMult",
            "reward": "{ antAutobuyers: () => 1, inceptusAutobuy: () => 1, fortunaeAutobuy: () => 1 }"
        },
        {
            "group": "sacMult",
            "reward": "{ antAutobuyers: () => 1, tributumAutobuy: () => 1 }"
        },
        {
            "group": "sacMult",
            "reward": "{ antAutobuyers: () => 1, celeritasAutobuy: () => 1, exploratoremAutobuy: () => 1 }"
        },
        {
            "group": "sacMult",
            "reward": "{ antAutobuyers: () => 1, sacrificiumAutobuy: () => 1 }"
        },
        {
            "group": "sacMult",
            "reward": "{ antAutobuyers: () => 1 }"
        },
        {
            "group": "sacMult",
            "reward": "{ antAutobuyers: () => 1 }"
        },
        {
            "group": "sacMult",
            "reward": "{ antAutobuyers: () => 1 }"
        },
        {
            "group": "ascensionCount",
            "reward": "{ freeAntUpgrades: () => 2 }"
        },
        {
            "group": "ascensionCount",
            "reward": "{ preserveAnthillCount: () => 1, antSacrificeCountMultiplier: () => 2 }"
        },
        {
            "group": "ascensionCount"
        },
        {
            "group": "ascensionCount",
            "reward": "{ wowSquareTalisman: () => 1 }"
        },
        {
            "group": "ascensionCount",
            "reward": "{\n            ascensionCountMultiplier: () => Math.log10(calculateAscensionScore().effectiveScore + 100) - 1\n        }"
        },
        {
            "group": "ascensionCount",
            "reward": "{\n            ascensionCountAdditive: () => (unlockCondition: 0 > 10) ?100: 0\n    }"
        },
        {
            "group": "ascensionCount",
            "reward": "{\n        ascensionCountAdditive: () => (unlockCondition: 0 > 10) ?unlockCondition: 0 * 2 : 0,\n            wowCubeGain: () => 1 + 2 * Math.min(1, unlockCondition: 0 / 5e8)\n    }"
        },
        {
            "group": "constant"
        },
        {
            "group": "constant"
        },
        {
            "group": "constant"
        },
        {
            "group": "constant",
            "reward": "{ wowCubeGain: () => 1 + Decimal.log(unlockCondition: 0(1), 10) / 400 }"
        },
        {
            "group": "constant"
        },
        {
            "group": "constant",
            "reward": "{\n        wowCubeGain: () => 1 + 249 * Math.min(1, Decimal.log(unlockCondition: 0(1), 10) / 100000),\n            wowTesseractGain: () => 1 + 249 * Math.min(1, Decimal.log(unlockCondition: 0(1), 10) / 100000)\n    }"
        },
        {
            "group": "constant",
            "reward": "{ wowPlatonicGain: () => 1 + 19 * Math.min(1, Decimal.log(unlockCondition: 0(1), 10) / 100000) }"
        },
        {
            "group": "challenge11",
            "reward": "{ statTracker: () => 1 }"
        },
        {
            "group": "challenge11"
        },
        {
            "group": "challenge11"
        },
        {
            "group": "challenge11"
        },
        {
            "group": "challenge11"
        },
        {
            "group": "challenge11",
            "reward": "{ ascensionCountAdditive: () => unlockCondition: 0 * 2 }"
        },
        {
            "group": "challenge11",
            "reward": "{ talismanPower: () => 0.01 }"
        },
        {
            "group": "challenge12",
            "reward": "{ ascensionRewardScaling: () => 1 }"
        },
        {
            "group": "challenge12"
        },
        {
            "group": "challenge12"
        },
        {
            "group": "challenge12"
        },
        {
            "group": "challenge12"
        },
        {
            "group": "challenge12",
            "reward": "{ ascensionCountAdditive: () => unlockCondition: 0 * 2 }"
        },
        {
            "group": "challenge12",
            "reward": "{ talismanPower: () => 0.01 }"
        },
        {
            "group": "challenge13"
        },
        {
            "group": "challenge13"
        },
        {
            "group": "challenge13"
        },
        {
            "group": "challenge13"
        },
        {
            "group": "challenge13"
        },
        {
            "group": "challenge13",
            "reward": "{ ascensionCountAdditive: () => unlockCondition: 0 * 2 }"
        },
        {
            "group": "challenge13",
            "reward": "{ talismanPower: () => 0.01 }"
        },
        {
            "group": "challenge14"
        },
        {
            "group": "challenge14"
        },
        {
            "group": "challenge14"
        },
        {
            "group": "challenge14"
        },
        {
            "group": "challenge14"
        },
        {
            "group": "challenge14",
            "reward": "{\n        ascensionCountAdditive: () => unlockCondition: 0 * 2,\n            wowPlatonicGain: () => 1 + 2 * Math.min(1, unlockCondition: 02.674e9)\n    }"
        },
        {
            "group": "challenge14"
        },
        {
            "group": "ascensionScore"
        },
        {
            "group": "ascensionScore"
        },
        {
            "group": "ascensionScore"
        },
        {
            "group": "ascensionScore"
        },
        {
            "group": "ascensionScore"
        },
        {
            "group": "ascensionScore"
        },
        {
            "group": "ascensionScore"
        },
        {
            "group": "speedBlessing"
        },
        {
            "group": "speedBlessing"
        },
        {
            "group": "speedBlessing"
        },
        {
            "group": "speedSpirit"
        },
        {
            "group": "speedSpirit"
        },
        {
            "group": "speedSpirit"
        },
        {
            "group": "ungrouped"
        },
        {
            "group": "ungrouped"
        },
        {
            "group": "ungrouped"
        },
        {
            "group": "ungrouped"
        },
        {
            "group": "ungrouped"
        },
        {
            "group": "ungrouped"
        },
        {
            "group": "ungrouped"
        },
        {
            "group": "ungrouped"
        },
        {
            "group": "ungrouped"
        },
        {
            "group": "ungrouped"
        },
        {
            "group": "ungrouped"
        },
        {
            "group": "ungrouped"
        },
        {
            "group": "ungrouped",
            "reward": "{\n        quarkGain: () => 1.05\n    }"
        },
        {
            "group": "ungrouped",
            "reward": "{\n        quarkGain: () => 1.05\n    }"
        },
        {
            "group": "ungrouped"
        },
        {
            "group": "ascensionScore",
            "reward": "{ wowHypercubeGain: () => 1.1 }"
        },
        {
            "group": "ascensionScore",
            "reward": "{ wowCubeGain: () => 1.1 }"
        },
        {
            "group": "ascensionScore",
            "reward": "{ wowTesseractGain: () => 1.1 }"
        },
        {
            "group": "ascensionScore",
            "reward": "{ wowPlatonicGain: () => 1.1, overfluxConversionRate: () => 1.05 }"
        },
        {
            "group": "ascensionScore",
            "reward": "{ overfluxConversionRate: () => 1.05 }"
        },
        {
            "group": "ascensionScore",
            "reward": "{ wowHepteractGain: () => 1.1 }"
        },
        {
            "group": "ascensionScore",
            "reward": "{ ascensionScore: () => Math.pow(1.01, hepteracts.abyss.TIMES_CAP_EXTENDED) }"
        },
        {
            "group": "ascensionCount",
            "reward": "{ ascensionCountMultiplier: () => 1.1 }"
        },
        {
            "group": "ascensionCount",
            "reward": "{ ascensionCountMultiplier: () => 1.1 }"
        },
        {
            "group": "ascensionCount"
        },
        {
            "group": "ascensionCount"
        },
        {
            "group": "ascensionCount"
        },
        {
            "group": "ascensionCount"
        },
        {
            "group": "ascensionCount",
            "reward": "{ quarkGain: () => 1 + 0.1 * Math.min(unlockCondition: 0 / 1e15, 1) }"
        },
        {
            "group": "constant",
            "reward": "{ ascensionScore: () => 1 + Math.min(Decimal.log(unlockCondition: 0(1), 10) / 1e5, 1) }"
        },
        {
            "group": "constant"
        },
        {
            "group": "constant"
        },
        {
            "group": "constant",
            "reward": "{\n        wowHepteractGain: () => 1 + Math.min(Decimal.log(unlockCondition: 0(1), 10) / 1e6, 1),\n            constUpgrade1Buff: () => 0.01,\n                constUpgrade2Buff: () => 0.01\n    }"
        },
        {
            "group": "constant",
            "reward": "{ platonicToHypercubes: () => Math.min(1, Decimal.log(unlockCondition: 0(1), 10) / 1e6) }"
        },
        {
            "group": "constant"
        },
        {
            "group": "constant"
        },
        {
            "group": "singularityCount"
        },
        {
            "group": "singularityCount"
        },
        {
            "group": "singularityCount"
        },
        {
            "group": "singularityCount"
        },
        {
            "group": "singularityCount"
        },
        {
            "group": "singularityCount"
        },
        {
            "group": "singularityCount"
        },
        {
            "group": "firstOwnedCoin"
        },
        {
            "group": "firstOwnedCoin"
        },
        {
            "group": "firstOwnedCoin"
        },
        {
            "group": "secondOwnedCoin"
        },
        {
            "group": "secondOwnedCoin"
        },
        {
            "group": "secondOwnedCoin"
        },
        {
            "group": "thirdOwnedCoin"
        },
        {
            "group": "thirdOwnedCoin"
        },
        {
            "group": "thirdOwnedCoin"
        },
        {
            "group": "fourthOwnedCoin"
        },
        {
            "group": "fourthOwnedCoin"
        },
        {
            "group": "fourthOwnedCoin"
        },
        {
            "group": "fifthOwnedCoin"
        },
        {
            "group": "fifthOwnedCoin"
        },
        {
            "group": "fifthOwnedCoin"
        },
        {
            "group": "prestigePointGain"
        },
        {
            "group": "prestigePointGain"
        },
        {
            "group": "prestigePointGain"
        },
        {
            "group": "transcendPointGain"
        },
        {
            "group": "transcendPointGain"
        },
        {
            "group": "transcendPointGain"
        },
        {
            "group": "reincarnationPointGain"
        },
        {
            "group": "reincarnationPointGain"
        },
        {
            "group": "reincarnationPointGain"
        },
        {
            "group": "challenge1"
        },
        {
            "group": "challenge1"
        },
        {
            "group": "challenge1"
        },
        {
            "group": "challenge2"
        },
        {
            "group": "challenge2"
        },
        {
            "group": "challenge2"
        },
        {
            "group": "challenge3"
        },
        {
            "group": "challenge3"
        },
        {
            "group": "challenge3"
        },
        {
            "group": "challenge4"
        },
        {
            "group": "challenge4"
        },
        {
            "group": "challenge4"
        },
        {
            "group": "challenge5"
        },
        {
            "group": "challenge5"
        },
        {
            "group": "challenge5"
        },
        {
            "group": "challenge6"
        },
        {
            "group": "challenge6"
        },
        {
            "group": "challenge6"
        },
        {
            "group": "challenge7"
        },
        {
            "group": "challenge7"
        },
        {
            "group": "challenge7"
        },
        {
            "group": "challenge8"
        },
        {
            "group": "challenge8"
        },
        {
            "group": "challenge8"
        },
        {
            "group": "challenge9"
        },
        {
            "group": "challenge9"
        },
        {
            "group": "challenge9"
        },
        {
            "group": "challenge10"
        },
        {
            "group": "challenge10"
        },
        {
            "group": "challenge10"
        },
        {
            "group": "accelerators"
        },
        {
            "group": "accelerators"
        },
        {
            "group": "accelerators"
        },
        {
            "group": "multipliers"
        },
        {
            "group": "multipliers"
        },
        {
            "group": "multipliers"
        },
        {
            "group": "acceleratorBoosts"
        },
        {
            "group": "acceleratorBoosts"
        },
        {
            "group": "acceleratorBoosts"
        },
        {
            "group": "antCrumbs"
        },
        {
            "group": "antCrumbs"
        },
        {
            "group": "antCrumbs"
        },
        {
            "group": "sacMult"
        },
        {
            "group": "sacMult"
        },
        {
            "group": "sacMult",
            "reward": "{ antAutobuyers: () => 1 }"
        },
        {
            "group": "ascensionCount"
        },
        {
            "group": "ascensionCount"
        },
        {
            "group": "ascensionCount"
        },
        {
            "group": "ascensionCount"
        },
        {
            "group": "ascensionCount"
        },
        {
            "group": "ascensionCount"
        },
        {
            "group": "constant"
        },
        {
            "group": "constant"
        },
        {
            "group": "constant"
        },
        {
            "group": "constant"
        },
        {
            "group": "constant"
        },
        {
            "group": "constant"
        },
        {
            "group": "challenge11"
        },
        {
            "group": "challenge11"
        },
        {
            "group": "challenge11"
        },
        {
            "group": "challenge11"
        },
        {
            "group": "challenge11"
        },
        {
            "group": "challenge12"
        },
        {
            "group": "challenge12"
        },
        {
            "group": "challenge12"
        },
        {
            "group": "challenge12"
        },
        {
            "group": "challenge12"
        },
        {
            "group": "challenge13"
        },
        {
            "group": "challenge13"
        },
        {
            "group": "challenge13"
        },
        {
            "group": "challenge13"
        },
        {
            "group": "challenge13"
        },
        {
            "group": "challenge14"
        },
        {
            "group": "challenge14"
        },
        {
            "group": "challenge14"
        },
        {
            "group": "challenge14"
        },
        {
            "group": "challenge14"
        },
        {
            "group": "speedBlessing"
        },
        {
            "group": "speedBlessing"
        },
        {
            "group": "speedBlessing"
        },
        {
            "group": "speedBlessing"
        },
        {
            "group": "speedBlessing"
        },
        {
            "group": "speedBlessing"
        },
        {
            "group": "speedBlessing"
        },
        {
            "group": "speedSpirit"
        },
        {
            "group": "speedSpirit"
        },
        {
            "group": "speedSpirit"
        },
        {
            "group": "speedSpirit"
        },
        {
            "group": "speedSpirit"
        },
        {
            "group": "speedSpirit"
        },
        {
            "group": "speedSpirit"
        },
        {
            "group": "runeLevel"
        },
        {
            "group": "runeLevel"
        },
        {
            "group": "runeLevel"
        },
        {
            "group": "runeLevel"
        },
        {
            "group": "runeLevel"
        },
        {
            "group": "runeLevel"
        },
        {
            "group": "runeLevel"
        },
        {
            "group": "runeLevel"
        },
        {
            "group": "runeLevel"
        },
        {
            "group": "runeLevel"
        },
        {
            "group": "runeLevel"
        },
        {
            "group": "runeLevel"
        },
        {
            "group": "runeLevel"
        },
        {
            "group": "runeLevel"
        },
        {
            "group": "runeLevel"
        },
        {
            "group": "runeFreeLevel"
        },
        {
            "group": "runeFreeLevel"
        },
        {
            "group": "runeFreeLevel"
        },
        {
            "group": "runeFreeLevel"
        },
        {
            "group": "runeFreeLevel"
        },
        {
            "group": "runeFreeLevel"
        },
        {
            "group": "runeFreeLevel"
        },
        {
            "group": "runeFreeLevel"
        },
        {
            "group": "runeFreeLevel"
        },
        {
            "group": "runeFreeLevel"
        },
        {
            "group": "runeFreeLevel"
        },
        {
            "group": "runeFreeLevel"
        },
        {
            "group": "runeFreeLevel"
        },
        {
            "group": "runeFreeLevel"
        },
        {
            "group": "runeFreeLevel"
        },
        {
            "group": "campaignTokens"
        },
        {
            "group": "campaignTokens"
        },
        {
            "group": "campaignTokens"
        },
        {
            "group": "campaignTokens"
        },
        {
            "group": "campaignTokens"
        },
        {
            "group": "campaignTokens"
        },
        {
            "group": "campaignTokens"
        },
        {
            "group": "campaignTokens"
        },
        {
            "group": "campaignTokens"
        },
        {
            "group": "campaignTokens"
        },
        {
            "group": "prestigeCount"
        },
        {
            "group": "prestigeCount",
            "reward": "{ prestigeCountMultiplier: () => Math.max(1, 1 + Math.floor(Math.log10(unlockCondition: 0))) }"
        },
        {
            "group": "prestigeCount",
            "reward": "{ duplicationRuneUnlock: () => 1 }"
        },
        {
            "group": "prestigeCount",
            "reward": "{ offeringBonus: () => 1 + 0.02 * Math.max(1, 1 + Math.floor(Math.log10(unlockCondition: 0))) }"
        },
        {
            "group": "prestigeCount"
        },
        {
            "group": "prestigeCount"
        },
        {
            "group": "prestigeCount",
            "reward": "{ transcendToPrestige: () => 1 }"
        },
        {
            "group": "prestigeCount"
        },
        {
            "group": "prestigeCount",
            "reward": "{ transcensionCountMultiplier: () => Math.min(4, 1.25 + 2.75 * Math.floor(unlockCondition: 0 / 10)) }"
        },
        {
            "group": "prestigeCount"
        },
        {
            "group": "prestigeCount"
        },
        {
            "group": "prestigeCount"
        },
        {
            "group": "prestigeCount"
        },
        {
            "group": "prestigeCount"
        },
        {
            "group": "prestigeCount"
        },
        {
            "group": "transcensionCount"
        },
        {
            "group": "transcensionCount",
            "reward": "{ transcensionCountMultiplier: () => Math.max(1, 1 + Math.floor(Math.log10(unlockCondition: 0))) }"
        },
        {
            "group": "transcensionCount",
            "reward": "{ salvage: () => 2 * Math.max(1, 1 + Math.floor(Math.log10(unlockCondition: 0))) }"
        },
        {
            "group": "transcensionCount",
            "reward": "{ prismRuneUnlock: () => 1 }"
        },
        {
            "group": "transcensionCount"
        },
        {
            "group": "transcensionCount"
        },
        {
            "group": "transcensionCount",
            "reward": "{ reincarnationToTranscend: () => 1 }"
        },
        {
            "group": "transcensionCount"
        },
        {
            "group": "transcensionCount",
            "reward": "{ reincarnationCountMultiplier: () => Math.min(4, 1.25 + 2.75 * Math.floor(unlockCondition: 0 / 1000)) }"
        },
        {
            "group": "transcensionCount"
        },
        {
            "group": "transcensionCount"
        },
        {
            "group": "transcensionCount"
        },
        {
            "group": "transcensionCount"
        },
        {
            "group": "transcensionCount"
        },
        {
            "group": "transcensionCount"
        },
        {
            "group": "reincarnationCount"
        },
        {
            "group": "reincarnationCount",
            "reward": "{ reincarnationCountMultiplier: () => Math.max(1, 1 + Math.floor(Math.log10(unlockCondition: 0))) }"
        },
        {
            "group": "reincarnationCount",
            "reward": "{ obtainiumBonus: () => 1 + 0.02 * Math.max(1, 1 + Math.floor(Math.log10(unlockCondition: 0))) }"
        },
        {
            "group": "reincarnationCount"
        },
        {
            "group": "reincarnationCount",
            "reward": "{ thriftRuneUnlock: () => 1 }"
        },
        {
            "group": "reincarnationCount"
        },
        {
            "group": "reincarnationCount"
        },
        {
            "group": "reincarnationCount"
        },
        {
            "group": "reincarnationCount",
            "reward": "{\n        prestigeCountMultiplier: () => Math.min(4, 1.25 + 2.75 * Math.floor(unlockCondition: 0 / 1e6)),\n            ascensionCountMultiplier: () => Math.min(1.25, 1 + 0.25 * Math.floor(unlockCondition: 0 / 1e6))\n    }"
        },
        {
            "group": "reincarnationCount"
        },
        {
            "group": "reincarnationCount"
        },
        {
            "group": "reincarnationCount"
        },
        {
            "group": "reincarnationCount"
        },
        {
            "group": "reincarnationCount"
        },
        {
            "group": "reincarnationCount"
        },
        {
            "group": "sacCount",
            "reward": "{ freeAntUpgrades: () => 1 }"
        },
        {
            "group": "sacCount",
            "reward": "{ antSacrificeCountMultiplier: () => 2, hicAutobuy: () => 1 }"
        },
        {
            "group": "sacCount",
            "reward": "{ autoAntSacrifice: () => 1 }"
        },
        {
            "group": "sacCount",
            "reward": "{ antELOAdditiveMultiplier: () => 0.01, praemoenioAutobuy: () => 1 }"
        },
        {
            "group": "sacCount",
            "reward": "{ antELOAdditive: () => 25 }"
        },
        {
            "group": "sacCount",
            "reward": "{ antSpeed2UpgradeImprover: () => achievementLevel, phylacteriumAutobuy: () => 1 }"
        },
        {
            "group": "sacCount"
        },
        {
            "group": "sacCount"
        },
        {
            "group": "sacCount"
        },
        {
            "group": "sacCount",
            "reward": "{ preserveAnthillCountSingularity: () => 1 }"
        },
        {
            "group": "sacCount"
        }
    ]