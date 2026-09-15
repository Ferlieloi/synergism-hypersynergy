import Decimal from "break_infinity.js";
import { calcECC, parseGameDataDecimal } from "./hs-gamedata-utils";
import { AntUpgrades, RUNE_KEYS } from "../../../types/data-types/hs-gamedata-api-types";
import type { GameData } from "../../../types/data-types/hs-player-savedata";
import type { CalculationCache, RuneKeys, RuneTypeMap, RuneHelperContext } from "../../../types/data-types/hs-gamedata-api-types";

const RUNE_KEY_INDEX = new Map<RuneKeys, number>(RUNE_KEYS.map((rune, index) => [rune, index]))

export class RuneHelper {
    readonly #ctx: RuneHelperContext;
    #lastGameData?: GameData;
    readonly #runeEffectsCache = new Map<RuneKeys, Map<number, unknown>>();
    readonly #runeEffectiveLevelCache = new Map<RuneKeys, number>();
    readonly #runeFreeLevelsCache = new Map<RuneKeys, number>();
    readonly #costLog10Cache = new Map<RuneKeys, number>();
    readonly #levelsPerOOMIncreaseCache = new Map<RuneKeys, number>();
    readonly #levelsPerOOMCache = new Map<RuneKeys, number>();
    #totalRuneLevelsCache?: number;

    constructor(context: RuneHelperContext) {
        this.#ctx = context;
        for (const rune of RUNE_KEYS) {
            this.#costLog10Cache.set(rune, this.runes[rune].costCoefficient.log10());
        }
    }

    #clearCachesIfGameDataChanged(): void {
        const gameData = this.#ctx.getGameData();
        if (gameData !== this.#lastGameData) {
            this.#lastGameData = gameData;
            this.#runeEffectsCache.clear();
            this.#runeEffectiveLevelCache.clear();
            this.#runeFreeLevelsCache.clear();
            this.#levelsPerOOMIncreaseCache.clear();
            this.#levelsPerOOMCache.clear();
            this.#totalRuneLevelsCache = undefined;
        }
    }

    public readonly runes: Record<RuneKeys, {
        ignoreChal9: boolean
        costCoefficient: Decimal
        levelsPerOOM: number
        levelsPerOOMIncrease: () => number
        effects: (level: number, key?: string) => unknown
        effectiveLevelMult: () => number
        freeLevels: () => number
        runeEXPPerOffering: (purchasedLevels: number) => Decimal
        isUnlocked: (data?: GameData) => boolean
    }> = {
        speed: {
            ignoreChal9: false,
            costCoefficient: new Decimal(50),
            levelsPerOOM: 150,
            levelsPerOOMIncrease: () => {
                const data = this.#ctx.getGameData();
                return (
                    (data?.upgrades[66] ?? 0) * 2
                    + (data?.researches[78] ?? 0)
                    + (data?.researches[111] ?? 0)
                    + calcECC('ascension', (data?.challengecompletions?.[11] ?? 0))
                    + 1.5 * calcECC('ascension', (data?.challengecompletions?.[14] ?? 0))
                    + (data?.cubeUpgrades[16] ?? 0)
                    + this.#ctx.getTalismanEffects('chronos').speedOOMBonus
                    + this.#ctx.getAmbrosiaUpgradeEffects('ambrosiaRuneOOMBonus').runeOOMBonus
                    + this.#ctx.getLevelMilestone('speedRune')
                );
            },
            effects: (n: number) => {
                const acceleratorPower = 0.0002 * n
                const multiplicativeAccelerators = 1 + n / 400
                const globalSpeed = 2 - Math.exp(-Math.cbrt(n) / 100)
                return {
                    acceleratorPower,
                    multiplicativeAccelerators,
                    globalSpeed,
                }
            },
            effectiveLevelMult: () => this.#ctx.firstFiveEffectiveRuneLevelMult(),
            freeLevels: () => this.#ctx.firstFiveFreeLevels() + this.#ctx.getRuneBonusLevels('speed'),
            runeEXPPerOffering: (purchasedLevels: number) => this.universalRuneEXPMult(purchasedLevels),
            isUnlocked: () => true,
        },
        duplication: {
            ignoreChal9: false,
            costCoefficient: new Decimal(20000),
            levelsPerOOM: 120,
            levelsPerOOMIncrease: () => {
                const data = this.#ctx.getGameData();
                return (
                    0.75 * calcECC('transcend', (data?.challengecompletions?.[1] ?? 0))
                    + (data?.upgrades[66] ?? 0) * 2
                    + (data?.researches[90] ?? 0)
                    + (data?.researches[112] ?? 0)
                    + calcECC('ascension', (data?.challengecompletions?.[11] ?? 0))
                    + 1.5 * calcECC('ascension', (data?.challengecompletions?.[14] ?? 0))
                    + this.#ctx.getTalismanEffects('exemption').duplicationOOMBonus
                    + this.#ctx.getAmbrosiaUpgradeEffects('ambrosiaRuneOOMBonus').runeOOMBonus
                    + this.#ctx.getLevelMilestone('duplicationRune')
                );
            },
            effects: (n: number) => {
                const multiplierBoosts = n / 5
                const multiplicativeMultipliers = 1 + n / 400
                const taxReduction = 0.001 + 0.999 * Math.exp(-Math.cbrt(n) / 5)
                return {
                    multiplierBoosts,
                    multiplicativeMultipliers,
                    taxReduction,
                }
            },
            effectiveLevelMult: () => this.#ctx.firstFiveEffectiveRuneLevelMult(),
            freeLevels: () => this.#ctx.firstFiveFreeLevels() + this.#ctx.getRuneBonusLevels('duplication'),
            runeEXPPerOffering: (purchasedLevels: number) => this.universalRuneEXPMult(purchasedLevels),
            isUnlocked: () => Boolean(this.#ctx.getAchievementReward('duplicationRuneUnlock')),
        },
        prism: {
            ignoreChal9: false,
            costCoefficient: new Decimal('5e5'),
            levelsPerOOM: 90,
            levelsPerOOMIncrease: () => {
                const data = this.#ctx.getGameData();
                return (
                    (data?.upgrades[66] ?? 0) * 2
                    + (data?.researches[79] ?? 0)
                    + (data?.researches[113] ?? 0)
                    + calcECC('ascension', (data?.challengecompletions?.[11] ?? 0))
                    + 1.5 * calcECC('ascension', (data?.challengecompletions?.[14] ?? 0))
                    + (data?.cubeUpgrades[16] ?? 0)
                    + this.#ctx.getTalismanEffects('mortuus').prismOOMBonus
                    + this.#ctx.getAmbrosiaUpgradeEffects('ambrosiaRuneOOMBonus').runeOOMBonus
                    + this.#ctx.getLevelMilestone('prismRune')
                );
            },
            effects: (level: number) => {
                const productionLog10 = Math.max(0, 2 * Math.log10(1 + level / 2) + (level / 2) * Math.log10(2) - Math.log10(256))
                const costDivisorLog10 = Math.floor(level / 10)
                return {
                    productionLog10,
                    costDivisorLog10,
                }
            },
            effectiveLevelMult: () => this.#ctx.firstFiveEffectiveRuneLevelMult(),
            freeLevels: () => this.#ctx.firstFiveFreeLevels() + this.#ctx.getRuneBonusLevels('prism'),
            runeEXPPerOffering: (purchasedLevels: number) => this.universalRuneEXPMult(purchasedLevels),
            isUnlocked: () => Boolean(this.#ctx.getAchievementReward('prismRuneUnlock')),
        },
        thrift: {
            ignoreChal9: false,
            costCoefficient: new Decimal('2.5e7'),
            levelsPerOOM: 60,
            levelsPerOOMIncrease: () => {
                const data = this.#ctx.getGameData();
                return (
                    (data?.upgrades[66] ?? 0) * 2
                    + (data?.researches[77] ?? 0)
                    + (data?.researches[114] ?? 0)
                    + calcECC('ascension', (data?.challengecompletions?.[11] ?? 0))
                    + 1.5 * calcECC('ascension', (data?.challengecompletions?.[14] ?? 0))
                    + (data?.cubeUpgrades[37] ?? 0)
                    + this.#ctx.getTalismanEffects('midas').thriftOOMBonus
                    + this.#ctx.getAmbrosiaUpgradeEffects('ambrosiaRuneOOMBonus').runeOOMBonus
                    + this.#ctx.getLevelMilestone('thriftRune')
                );
            },
            effects: (level: number) => {
                const costDelay = Math.min(1e15, level / 125)
                const salvage = 2.5 * Math.log(1 + level / 10)
                const taxReduction = 0.01 + 0.99 * Math.exp(-Math.cbrt(level) / 10)
                return {
                    costDelay,
                    salvage,
                    taxReduction,
                }
            },
            effectiveLevelMult: () => this.#ctx.firstFiveEffectiveRuneLevelMult(),
            freeLevels: () => this.#ctx.firstFiveFreeLevels() + this.#ctx.getRuneBonusLevels('thrift'),
            runeEXPPerOffering: (purchasedLevels: number) => this.universalRuneEXPMult(purchasedLevels),
            isUnlocked: () => Boolean(this.#ctx.getAchievementReward('thriftRuneUnlock')),
        },
        superiorIntellect: {
            ignoreChal9: false,
            costCoefficient: new Decimal('1e12'),
            levelsPerOOM: 30,
            levelsPerOOMIncrease: () => {
                const data = this.#ctx.getGameData();
                return (
                    (data?.upgrades[66] ?? 0) * 2
                    + (data?.researches[115] ?? 0)
                    + calcECC('ascension', (data?.challengecompletions?.[11] ?? 0))
                    + 1.5 * calcECC('ascension', (data?.challengecompletions?.[14] ?? 0))
                    + (data?.cubeUpgrades[37] ?? 0)
                    + this.#ctx.getTalismanEffects('polymath').SIOOMBonus
                    + this.#ctx.getAmbrosiaUpgradeEffects('ambrosiaRuneOOMBonus').runeOOMBonus
                    + this.#ctx.getLevelMilestone('SIRune')
                );
            },
            effects: (level: number) => {
                const offeringMult = 1 + level / 2000
                const obtainiumMult = 1 + level / 200
                const antSpeed = Math.pow(1 + level / 500, 2)
                return {
                    offeringMult,
                    obtainiumMult,
                    antSpeed,
                }
            },
            effectiveLevelMult: () => this.#ctx.firstFiveEffectiveRuneLevelMult() * this.SIEffectiveRuneLevelMult(),
            freeLevels: () => this.#ctx.firstFiveFreeLevels() + this.#ctx.getRuneBonusLevels('superiorIntellect'),
            runeEXPPerOffering: (purchasedLevels: number) => this.universalRuneEXPMult(purchasedLevels),
            isUnlocked: (data?: GameData) => Boolean((data?.researches?.[82] ?? 0) > 0),
        },
        infiniteAscent: {
            ignoreChal9: true,
            costCoefficient: new Decimal('1e75'),
            levelsPerOOM: 1 / 2,
            levelsPerOOMIncrease: () => this.#ctx.getAmbrosiaUpgradeEffects('ambrosiaRuneOOMBonus').infiniteAscentOOMBonus,
            effects: (level: number) => {
                const quarkMult = 1 + level / 500 + (level > 0 ? 0.1 : 0)
                const cubeMult = 1 + level / 100

                const salvagePerkLevels = [30, 40, 61, 81, 111, 131, 161, 191, 236, 260]
                const salvageCoefficient = 0.025 * salvagePerkLevels.filter((x) => x <= (this.#ctx.getGameData()?.highestSingularityCount ?? 0)).length
                const salvage = salvageCoefficient * level

                return {
                    quarkMult,
                    cubeMult,
                    salvage,
                }
            },
            effectiveLevelMult: () => 1,
            freeLevels: () => this.#ctx.getRuneBonusLevels('infiniteAscent'),
            runeEXPPerOffering: (purchasedLevels: number) => this.universalRuneEXPMult(purchasedLevels),
            isUnlocked: () => Boolean(this.#ctx.getSingularityChallengeEffect('noQuarkUpgrades', 'topHatUnlock')),
        },
        antiquities: {
            ignoreChal9: true,
            costCoefficient: new Decimal('1e206'),
            levelsPerOOM: 1 / 50,
            levelsPerOOMIncrease: () => this.#ctx.getPurpleAmbrosiaUpgradeEffects('capricorn', 'antiquitiesOfAntGodCoefficient'),
            effects: (level: number, key?: string) => {
                if (key === 'addCodeCooldownReduction') {
                    return level > 0 ? 0.8 - 0.3 * (level - 1) / (level + 10) : 1
                } else if (key === 'offeringLog10' || key === 'obtainiumLog10') {
                    return Math.round(300 * (1 - Math.pow(1 - 1 / 300, level)))
                } else {
                    return level > 0 ? Math.pow(1.01, Math.min(5, level) * (this.#ctx.getGameData()?.singularityCount ?? 0)) : 1
                }
            },
            effectiveLevelMult: () => 1,
            freeLevels: () => this.#ctx.getRuneBonusLevels('antiquities'),
            runeEXPPerOffering: (purchasedLevels: number) => this.universalRuneEXPMult(purchasedLevels),
            isUnlocked: () => Boolean((this.#ctx.getGameData()?.platonicUpgrades[20] ?? 0) > 0),
        },
        horseShoe: {
            ignoreChal9: true,
            costCoefficient: new Decimal('1e500'),
            levelsPerOOM: 1 / 20,
            levelsPerOOMIncrease: () => this.#ctx.getPurpleAmbrosiaUpgradeEffects('sagittarius', 'horseShoeRuneCoefficient'),
            effects: (level: number) => {
                const ambrosiaLuck = 2 * level
                const redLuck = 2 * level / 5
                const purpleHoneyLuck = level / 5
                return {
                    ambrosiaLuck,
                    redLuck,
                    purpleHoneyLuck,
                }
            },
            effectiveLevelMult: () => 1,
            freeLevels: () => this.#ctx.getRuneBonusLevels('horseShoe'),
            runeEXPPerOffering: (purchasedLevels: number) => this.universalRuneEXPMult(purchasedLevels),
            isUnlocked: () => Boolean(this.#ctx.getPurpleAmbrosiaUpgradeEffects('sagittarius', 'horseshoeRuneUnlocked')),
        },
        finiteDescent: {
            ignoreChal9: true,
            costCoefficient: new Decimal('1e-40'),
            levelsPerOOM: 0.1,
            levelsPerOOMIncrease: () => 0,
            effects: (level: number) => {
                const ascensionScore = level >= 1 ? 1.04 + 0.96 * (level - 1) / (level + 25) : 1
                const corruptionFreeLevels = level >= 1 ? 0.01 + 0.14 * (level - 1) / (level + 16) : 0
                const infiniteAscentFreeLevel = Math.floor(level / 2)
                return {
                    ascensionScore,
                    corruptionFreeLevels,
                    infiniteAscentFreeLevel,
                }
            },
            effectiveLevelMult: () => 1,
            freeLevels: () => 0,
            runeEXPPerOffering: (purchasedLevels: number) => this.universalRuneEXPMult(purchasedLevels),
            isUnlocked: () => Boolean((this.#ctx.getGameData()?.shopUpgrades.shopSadisticRune ?? 0) > 0),
        },
        topHat: {
            ignoreChal9: false,
            costCoefficient: new Decimal(1),
            levelsPerOOM: 1,
            levelsPerOOMIncrease: () => 0,
            effects: (level: number) => {
                return {
                    freeOfferingLevels: Math.round(200 * (1 - Math.pow(0.995, level))) / 10,
                    freeObtainiumLevels: Math.round(200 * (1 - Math.pow(0.995, level))) / 10,
                    freeCubeLevels: Math.round(150 * (1 - Math.pow(0.997, level))) / 10,
                    freeSpeedLevels: Math.round(150 * (1 - Math.pow(0.997, level))) / 10,
                    freeInfinityLevels: Math.round(100 * (1 - Math.pow(0.999, level))) / 10,
                }
            },
            effectiveLevelMult: () => 1,
            freeLevels: () => 0,
            runeEXPPerOffering: (purchasedLevels: number) => this.universalRuneEXPMult(purchasedLevels),
            isUnlocked: () => Boolean(this.#ctx.getSingularityChallengeEffect('noQuarkUpgrades', 'topHatUnlock')),
        },
    }

    public getRuneEffects = <T extends RuneKeys>(rune: T): RuneTypeMap[T] => {
        this.#clearCachesIfGameDataChanged();

        const effectiveLevel = this.getRuneEffectiveLevel(rune);
        let runeCache = this.#runeEffectsCache.get(rune);
        if (!runeCache) {
            runeCache = new Map<number, unknown>();
            this.#runeEffectsCache.set(rune, runeCache);
        }

        if (runeCache.has(effectiveLevel)) {
            return runeCache.get(effectiveLevel) as RuneTypeMap[T];
        }

        const result = this.runes[rune].effects(effectiveLevel) as RuneTypeMap[T];
        runeCache.set(effectiveLevel, result);
        return result;
    }

    public getRuneFreeLevels = (rune: RuneKeys): number => {
        this.#clearCachesIfGameDataChanged();
        const cached = this.#runeFreeLevelsCache.get(rune);
        if (cached !== undefined) {
            return cached;
        }

        const result = this.runes[rune].freeLevels();
        this.#runeFreeLevelsCache.set(rune, result);
        return result;
    }

    public computeEXPToLevel = (rune: RuneKeys, level: number): Decimal => {
        const levelPerOOM = this.getLevelsPerOOM(rune)
        return this.runes[rune].costCoefficient.times(Decimal.pow(10, level / levelPerOOM).minus(1))
    }

    public getLevelsPerOOM = (rune: RuneKeys): number => {
        this.#clearCachesIfGameDataChanged();
        const cached = this.#levelsPerOOMCache.get(rune);
        if (cached !== undefined) {
            return cached;
        }

        const increase = this.runes[rune].levelsPerOOMIncrease();
        const result = this.runes[rune].levelsPerOOM + increase;
        this.#levelsPerOOMIncreaseCache.set(rune, increase);
        this.#levelsPerOOMCache.set(rune, result);
        return result;
    }

    public getRuneEffectiveLevel = (rune: RuneKeys): number => {
        this.#clearCachesIfGameDataChanged();
        if (this.#runeEffectiveLevelCache.has(rune)) {
            return this.#runeEffectiveLevelCache.get(rune)!;
        }

        const data = this.#ctx.getGameData()
        if (!data) return 0

        const runeEXP = parseGameDataDecimal(data.runes[rune])
        const cacheName = 'GetRuneEffectiveLevel' as keyof CalculationCache;
        const runeDef = this.runes[rune]
        const runeIndex = RUNE_KEY_INDEX.get(rune) ?? 0
        const runeExpLog = runeEXP.gt(0)
            ? Number(runeEXP.log10())
            : Number.NEGATIVE_INFINITY
        const effectiveMult = runeDef.effectiveLevelMult()
        const freeLevels = this.getRuneFreeLevels(rune)
        const ignoreChal9 = runeDef.ignoreChal9 ? 1 : 0

        const calculationVars = [
            runeIndex,
            data.currentChallenge.reincarnation,
            ignoreChal9,
            effectiveMult,
            freeLevels,
            runeExpLog,
        ]

        const cached = this.#ctx.checkCalculationCache(cacheName, calculationVars)
        if (cached !== undefined) {
            this.#runeEffectiveLevelCache.set(rune, cached)
            return cached
        }

        if (runeDef.isUnlocked && !runeDef.isUnlocked(data)) {
            this.#ctx.updateCalculationCache(cacheName, { value: 0, cachedBy: calculationVars })
            this.#runeEffectiveLevelCache.set(rune, 0)
            return 0
        }

        if (data.currentChallenge.reincarnation === 9 && !runeDef.ignoreChal9) {
            this.#ctx.updateCalculationCache(cacheName, { value: 1, cachedBy: calculationVars })
            this.#runeEffectiveLevelCache.set(rune, 1)
            return 1
        }

        const runeLevel = this.getRuneLevelFromEXP(rune, runeEXP)
        const effectiveLevel = (runeLevel + freeLevels) * effectiveMult

        this.#ctx.updateCalculationCache(cacheName, { value: effectiveLevel, cachedBy: calculationVars })
        this.#runeEffectiveLevelCache.set(rune, effectiveLevel)
        return effectiveLevel
    }

    public calculateTotalRuneLevels = (): number => {
        this.#clearCachesIfGameDataChanged();
        if (this.#totalRuneLevelsCache !== undefined) {
            return this.#totalRuneLevelsCache;
        }

        const data = this.#ctx.getGameData()
        if (!data) return 0

        const total = RUNE_KEYS.reduce((sum, rune) => {
            const runeEXP = parseGameDataDecimal(data.runes[rune])
            return sum + this.getRuneLevelFromEXP(rune, runeEXP)
        }, 0)

        this.#totalRuneLevelsCache = total
        return total
    }

    getRuneLevelFromEXP = (rune: RuneKeys, runeEXP: Decimal): number => {
        // Mirrors SynergismOfficial/src/Runes.ts updateLevelsFromEXP.
        // The previous log-domain shortcut used log10(EXP) - log10(cost) + 1,
        // which is not log10(EXP / cost + 1) and overcounted almost every rune.
        const log10ExpOverCostPlus1 = Decimal.log10(
            runeEXP.div(this.runes[rune].costCoefficient).plus(1)
        )
        return Math.max(0, Math.floor(this.getLevelsPerOOM(rune) * log10ExpOverCostPlus1))
    }

    public calculateHeaterMaxRuneExp(): number {
        const data = this.#ctx.getGameData();
        if (!data) return 0

        const runeValues = [
            parseGameDataDecimal(data.runes.speed),
            parseGameDataDecimal(data.runes.duplication),
            parseGameDataDecimal(data.runes.prism),
            parseGameDataDecimal(data.runes.thrift),
            parseGameDataDecimal(data.runes.superiorIntellect),
            parseGameDataDecimal(data.runes.infiniteAscent),
        ]

        const maxLog = runeValues.reduce((currentMax, value) => {
            return Math.max(currentMax, value.gt(0) ? value.log10() : Number.NEGATIVE_INFINITY)
        }, Number.NEGATIVE_INFINITY)

        return Math.max(0, maxLog === Number.NEGATIVE_INFINITY ? 0 : maxLog)
    }

    public calculateRuneEffectivenessHypercubeBlessing = () => {
        const data = this.#ctx.getGameData();
        const DR = 1 / 64
        const effectPerBlessing = this.#ctx.calculateHypercubeBlessingMultiplierPlatonicBlessing() / 1000
        const limit = 1000
        if ((data?.hypercubeBlessings.talismanBonus ?? 0) < limit) {
            return 1 + effectPerBlessing * (data?.hypercubeBlessings.talismanBonus ?? 0)
        } else {
            const limitMult = Math.pow(limit, 1 - DR)
            return 1 + effectPerBlessing * limitMult * Math.pow((data?.hypercubeBlessings.talismanBonus ?? 0), DR)
        }
    }

    public calculateRuneEffectivenessTesseractBlessing = () => {
        const data = this.#ctx.getGameData();
        const DR = 1 / 32
        const effectPerBlessing = this.calculateRuneEffectivenessHypercubeBlessing() / 1000
        const limit = 1000
        if ((data?.tesseractBlessings.talismanBonus ?? 0) < limit) {
            return 1 + effectPerBlessing * (data?.tesseractBlessings.talismanBonus ?? 0)
        } else {
            const limitMult = Math.pow(limit, 1 - DR)
            return 1 + effectPerBlessing * limitMult * Math.pow((data?.tesseractBlessings.talismanBonus ?? 0), DR)
        }
    }

    public calculateRuneEffectivenessCubeBlessing = () => {
        const data = this.#ctx.getGameData();
        const DR = 1 / 16
        const effectPerBlessing = this.calculateRuneEffectivenessTesseractBlessing() / 10000
        const limit = 1000
        const DRIncrease = (data?.cubeUpgrades[44] ?? 0) / 1600

        if ((data?.cubeBlessings.talismanBonus ?? 0) < limit) {
            return Math.pow(1 + effectPerBlessing * (data?.cubeBlessings.talismanBonus ?? 0), 1 + DRIncrease)
        } else {
            const limitMult = Math.pow(limit, 1 - DR + DRIncrease)
            return Math.min(
                1e300,
                1 + limitMult * effectPerBlessing * Math.pow((data?.cubeBlessings.talismanBonus ?? 0), DR + DRIncrease)
            )
        }
    }

    public SIEffectiveRuneLevelMult = () => {
        return 1 + ((this.#ctx.getGameData()?.researches[84] ?? 0) / 200)
    }

    public calculateSalvageRuneEXPMultiplier = (): Decimal => {
        const antSalvage = this.#ctx.getAntUpgradeEffectValue(AntUpgrades.Salvage, 'salvage')
        const achievementSalvage = (this.#ctx.getAchievementReward('salvage') as number)
        const totalSalvage = Math.max(0, antSalvage + achievementSalvage)
        const recycleChance = Math.min(0.95, totalSalvage / 100)

        return new Decimal(1).div(new Decimal(1).minus(recycleChance))
    }

    public universalRuneEXPMult = (purchasedLevels: number): Decimal => {
        const data = this.#ctx.getGameData();
        const recycleMultiplier = this.calculateSalvageRuneEXPMultiplier()

        const allRuneExpAdditiveMultiplier = (
            1
            + Math.min(1, data?.highestchallengecompletions[1] ?? 0)
            + (0.4 / 10) * (data?.highestchallengecompletions[1] ?? 0)
            + 0.6 * (data?.researches[22] ?? 0)
            + 0.3 * (data?.researches[23] ?? 0)
            + ((data?.upgrades[71] ?? 0) * purchasedLevels) / 25
        )

        const allRuneExpMultiplier = [
            1 + (data?.researches[91] ?? 0) / 20,
            1 + (data?.researches[92] ?? 0) / 20,
            1 + ((data?.ascensionCounter ?? 0) / 1000) * (data?.cubeUpgrades[32] ?? 0),
            1 + (1 / 10) * (data?.constantUpgrades[8] ?? 0),
            this.#ctx.calculateChallenge15Reward('runeExp')
        ].reduce((x, y) => x.times(y), new Decimal('1'))

        return allRuneExpMultiplier.times(allRuneExpAdditiveMultiplier).times(recycleMultiplier)
    }
}
