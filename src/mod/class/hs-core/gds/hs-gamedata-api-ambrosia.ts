import { redAmbrosiaUpgradeCalculationCollection } from "./stored-vars-and-calculations";
import { EventBuffType } from "../../../types/data-types/hs-event-data";
import { HSGlobal } from "../hs-global";
import type { GameData, RedAmbrosiaUpgrades } from "../../../types/data-types/hs-player-savedata";
import type { AmbrosiaUpgradeNames, AmbrosiaUpgradeRewards, AmbrosiaUpgradeCalculationCollection, AmbrosiaUpgradeCalculationConfig, AmbrosiaUpgradeEffectContext, RedAmbrosiaUpgradeRewards, RedAmbrosiaUpgradeKey, AmbrosiaUpgradeCalculationConfig as AmbrosiaUpgradeCalculationConfigAny, CachedValue, CalculationCache, CalculationMode } from "../../../types/data-types/hs-gamedata-api-types";
import { HSLogger } from "../hs-logger";

export interface AmbrosiaHelperContext {
    getGameData: () => GameData | undefined;
    getMeData: () => any;
    calculateLuck: (reduce_vals?: boolean, true_base?: boolean) => { luckBase: number; luckMult: number; luckTotal: number } | any;
    getShopUpgradeEffects: (upgradeKey: string, effectKey: string, mode?: CalculationMode) => number | boolean;
    getSingularityChallengeEffect: (challengeKey: string, effectKey: string) => number;
    getAmbrosiaUpgradeEffects: (upgradeKey: string, mode?: CalculationMode) => any;
    getRedAmbrosiaUpgradeEffects: (upgradeKey: string) => any;
    getPCoinUpgradeLevel: (upgradeName: string) => number;
    getCampaignTokens: () => number;
    getEventBellAmount: () => number;
    isEvent: boolean;
    calculateEventSourceBuff: (buffType: EventBuffType) => number;
    checkCalculationCache: (cacheName: keyof CalculationCache, calculationVars: number[]) => number | undefined;
    updateCalculationCache: (cacheName: keyof CalculationCache, item: CachedValue) => void;
}

export class AmbrosiaHelper {
    readonly #ctx: AmbrosiaHelperContext;

    constructor(ctx: AmbrosiaHelperContext) {
        this.#ctx = ctx;
    }

    static #floorLog10PlusOne(value: number): number {
        return Math.floor(Math.log10(value + 1));
    }

    static #ceilLog10PlusOne(value: number): number {
        return Math.ceil(Math.log10(value + 1));
    }

    #getWorldsLog10Squared(): number {
        const worlds = Number(this.#ctx.getGameData()?.worlds ?? 0);
        return Math.floor(Math.pow(Math.log10(worlds + 1) + 1, 2));
    }

    #getWowResourceLogSum(): number {
        const data = this.#ctx.getGameData();
        if (!data) return 6;

        return (
            AmbrosiaHelper.#floorLog10PlusOne(Number(data.wowCubes))
            + AmbrosiaHelper.#floorLog10PlusOne(Number(data.wowTesseracts))
            + AmbrosiaHelper.#floorLog10PlusOne(Number(data.wowHypercubes))
            + AmbrosiaHelper.#floorLog10PlusOne(Number(data.wowPlatonicCubes))
            + AmbrosiaHelper.#floorLog10PlusOne(Number(data.wowAbyssals ?? 0))
            + AmbrosiaHelper.#floorLog10PlusOne(Number(data.wowOcteracts ?? 0))
            + 6
        );
    }

    #getLifetimeAmbrosiaLogSum(): number {
        const data = this.#ctx.getGameData();
        if (!data) return 0;

        return (
            AmbrosiaHelper.#ceilLog10PlusOne(Number(data.lifetimeRedAmbrosia ?? 0))
            + AmbrosiaHelper.#ceilLog10PlusOne(Number(data.lifetimeAmbrosia ?? 0))
        );
    }

    #getAmbrosiaUpgradeCacheName(upgradeName: AmbrosiaUpgradeNames, freeLevelsOnly: boolean): keyof CalculationCache {
        return (`AMB_${upgradeName}${freeLevelsOnly ? '_FREE' : ''}`) as keyof CalculationCache;
    }

    redAmbrosiaUpgradeCalculationCollection = redAmbrosiaUpgradeCalculationCollection;

    ambrosiaUpgradeCalculationCollection: AmbrosiaUpgradeCalculationCollection = {
        ambrosiaTutorial: {
            costPerLevel: 1,
            maxLevel: 10,
            ignoreEXALT: false,
            costFormula: (n: number, cpl: number): number =>
                cpl * ((n + 1) ** 2 - n ** 2),
            effects: (n: number) => {
                const cubeAmount = 1 + 0.05 * n;
                const quarkAmount = 1 + 0.01 * n;
                return {
                    quarks: quarkAmount,
                    cubes: cubeAmount,
                };
            },
            extraLevelCalc: () => this.getRedAmbrosiaUpgradeEffects('freeTutorialLevels').freeLevels,
        },

        ambrosiaQuarks1: {
            costPerLevel: 1,
            maxLevel: 100,
            ignoreEXALT: false,
            costFormula: (n: number, cpl: number): number =>
                cpl * ((n + 1) ** 3 - n ** 3),
            effects: (n: number) => {
                const quarkAmount = 1 + 0.01 * n;
                return {
                    quarks: quarkAmount,
                };
            },
            extraLevelCalc: () => this.getRedAmbrosiaUpgradeEffects('freeLevelsRow2').freeLevels,
            prerequisites: {
                ambrosiaTutorial: 10,
            },
        },

        ambrosiaCubes1: {
            costPerLevel: 1,
            maxLevel: 100,
            ignoreEXALT: false,
            costFormula: (n: number, cpl: number): number =>
                cpl * ((n + 1) ** 3 - n ** 3),
            effects: (n: number) => {
                const cubeAmount = (1 + 0.05 * n) * Math.pow(1.1, Math.floor(n / 5));
                return {
                    cubes: cubeAmount,
                };
            },
            extraLevelCalc: () => this.getRedAmbrosiaUpgradeEffects('freeLevelsRow2').freeLevels,
            prerequisites: {
                ambrosiaTutorial: 10,
            },
        },

        ambrosiaLuck1: {
            costPerLevel: 1,
            maxLevel: 100,
            ignoreEXALT: false,
            costFormula: (n: number, cpl: number): number =>
                cpl * ((n + 1) ** 3 - n ** 3),
            effects: (n: number) => {
                const val = 2 * n + 12 * Math.floor(n / 10);
                return {
                    ambrosiaLuck: val,
                };
            },
            extraLevelCalc: () => this.getRedAmbrosiaUpgradeEffects('freeLevelsRow2').freeLevels,
            prerequisites: {
                ambrosiaTutorial: 10,
            },
        },

        ambrosiaQuarkCube1: {
            costPerLevel: 250,
            maxLevel: 25,
            ignoreEXALT: false,
            costFormula: (n: number, cpl: number): number =>
                cpl * ((n + 1) ** 3 - n ** 3),
            effects: (n: number) => {
                const baseVal = 0.001 * n;
                const val = 1 + baseVal * this.#getWorldsLog10Squared();
                return {
                    cubes: val,
                };
            },
            extraLevelCalc: () => this.getRedAmbrosiaUpgradeEffects('freeLevelsRow3').freeLevels,
            prerequisites: {
                ambrosiaCubes1: 30,
                ambrosiaQuarks1: 20,
            },
        },

        ambrosiaLuckCube1: {
            costPerLevel: 250,
            maxLevel: 25,
            ignoreEXALT: false,
            costFormula: (n: number, cpl: number): number =>
                cpl * ((n + 1) ** 3 - n ** 3),
            effects: (n: number) => {
                const baseVal = 0.0005 * n;
                const luck = this.calculateLuck();
                const val = 1 + baseVal * luck.luckTotal;
                return {
                    cubes: val,
                };
            },
            extraLevelCalc: () => this.getRedAmbrosiaUpgradeEffects('freeLevelsRow3').freeLevels,
            prerequisites: {
                ambrosiaCubes1: 30,
                ambrosiaLuck1: 20,
            },
        },

        ambrosiaCubeQuark1: {
            costPerLevel: 500,
            maxLevel: 25,
            ignoreEXALT: false,
            costFormula: (n: number, cpl: number): number =>
                cpl * ((n + 1) ** 3 - n ** 3),
            effects: (n: number) => {
                const baseVal = 0.0001 * n;
                const val = 1 + baseVal * this.#getWowResourceLogSum();
                return {
                    quarks: val,
                };
            },
            extraLevelCalc: () => this.getRedAmbrosiaUpgradeEffects('freeLevelsRow3').freeLevels,
            prerequisites: {
                ambrosiaQuarks1: 30,
                ambrosiaCubes1: 20,
            },
        },

        ambrosiaLuckQuark1: {
            costPerLevel: 500,
            maxLevel: 25,
            ignoreEXALT: false,
            costFormula: (n: number, cpl: number): number =>
                cpl * ((n + 1) ** 3 - n ** 3),
            effects: (n: number) => {
                const baseVal = 0.0001 * n;
                const luck = this.calculateLuck();
                const effectiveLuck = Math.min(luck.luckTotal, Math.pow(1000, 0.5) * Math.pow(luck.luckTotal, 0.5));
                const val = 1 + baseVal * effectiveLuck;
                return {
                    quarks: val,
                };
            },
            extraLevelCalc: () => this.getRedAmbrosiaUpgradeEffects('freeLevelsRow3').freeLevels,
            prerequisites: {
                ambrosiaQuarks1: 30,
                ambrosiaLuck1: 20,
            },
        },

        ambrosiaCubeLuck1: {
            costPerLevel: 100,
            maxLevel: 25,
            ignoreEXALT: false,
            costFormula: (n: number, cpl: number): number =>
                cpl * ((n + 1) ** 3 - n ** 3),
            effects: (n: number) => {
                const baseVal = 0.02 * n;
                const val = baseVal * this.#getWowResourceLogSum();
                return {
                    ambrosiaLuck: val,
                };
            },
            extraLevelCalc: () => this.getRedAmbrosiaUpgradeEffects('freeLevelsRow3').freeLevels,
            prerequisites: {
                ambrosiaLuck1: 30,
                ambrosiaCubes1: 20,
            },
        },

        ambrosiaQuarkLuck1: {
            costPerLevel: 100,
            maxLevel: 25,
            ignoreEXALT: false,
            costFormula: (n: number, cpl: number): number =>
                cpl * ((n + 1) ** 3 - n ** 3),
            effects: (n: number) => {
                const baseVal = 0.02 * n;
                const val = baseVal * this.#getWorldsLog10Squared();
                return {
                    ambrosiaLuck: val,
                };
            },
            extraLevelCalc: () => this.getRedAmbrosiaUpgradeEffects('freeLevelsRow3').freeLevels,
            prerequisites: {
                ambrosiaLuck1: 30,
                ambrosiaQuarks1: 20,
            },
        },

        ambrosiaQuarks2: {
            costPerLevel: 500,
            maxLevel: 100,
            ignoreEXALT: false,
            costFormula: (n: number, cpl: number): number =>
                cpl * ((n + 1) ** 2 - n ** 2),
            effects: (n: number, ctx?: AmbrosiaUpgradeEffectContext) => {
                const quark1Level = ctx?.getAmbrosiaUpgradeLevel('ambrosiaQuarks1') ?? this.calculateAmbrosiaUpgradeValue('ambrosiaQuarks1');
                const quarkAmount =
                    1 +
                    (0.01 + Math.floor(quark1Level / 10) / 1000) * n;
                return {
                    quarks: quarkAmount,
                };
            },
            extraLevelCalc: () => this.getRedAmbrosiaUpgradeEffects('freeLevelsRow4').freeLevels,
            prerequisites: {
                ambrosiaQuarks1: 40,
            },
        },

        ambrosiaCubes2: {
            costPerLevel: 500,
            maxLevel: 100,
            ignoreEXALT: false,
            costFormula: (n: number, cpl: number): number =>
                cpl * ((n + 1) ** 2 - n ** 2),
            effects: (n: number, ctx?: AmbrosiaUpgradeEffectContext) => {
                const cubes1Level = ctx?.getAmbrosiaUpgradeLevel('ambrosiaCubes1') ?? this.calculateAmbrosiaUpgradeValue('ambrosiaCubes1');
                const cubeAmount =
                    (1 + (0.1 + 10 * (Math.floor(cubes1Level / 10) / 1000)) * n) *
                    Math.pow(1.15, Math.floor(n / 5));
                return {
                    cubes: cubeAmount,
                };
            },
            extraLevelCalc: () => this.getRedAmbrosiaUpgradeEffects('freeLevelsRow4').freeLevels,
            prerequisites: {
                ambrosiaCubes1: 40,
            },
        },

        ambrosiaLuck2: {
            costPerLevel: 250,
            maxLevel: 100,
            ignoreEXALT: false,
            costFormula: (n: number, cpl: number): number =>
                cpl * ((n + 1) ** 2 - n ** 2),
            effects: (n: number, ctx?: AmbrosiaUpgradeEffectContext) => {
                const luck1Level = ctx?.getAmbrosiaUpgradeLevel('ambrosiaLuck1') ?? this.calculateAmbrosiaUpgradeValue('ambrosiaLuck1');
                const val =
                    (3 + 0.3 * Math.floor(luck1Level / 10)) * n +
                    40 * Math.floor(n / 10);
                return {
                    ambrosiaLuck: val,
                };
            },
            extraLevelCalc: () => this.getRedAmbrosiaUpgradeEffects('freeLevelsRow4').freeLevels,
            prerequisites: {
                ambrosiaLuck1: 40,
            },
        },

        ambrosiaQuarks3: {
            costPerLevel: 750000,
            maxLevel: 10,
            ignoreEXALT: false,
            costFormula: (n: number, cpl: number): number => cpl + 50000 * n,
            effects: (n: number, ctx?: AmbrosiaUpgradeEffectContext) => {
                const quarks2Level = ctx?.getAmbrosiaUpgradeLevel('ambrosiaQuarks2') ?? this.calculateAmbrosiaUpgradeValue('ambrosiaQuarks2');
                const quark2Mult = 1 + quarks2Level / 100;
                const quark3Base = 0.05 * n;
                const quarkAmount = 1 + quark3Base * quark2Mult;
                return {
                    quarks: quarkAmount,
                };
            },
            extraLevelCalc: () => this.getRedAmbrosiaUpgradeEffects('freeLevelsRow5').freeLevels,
            prerequisites: {
                ambrosiaQuarks1: 100,
                ambrosiaQuarks2: 50,
            },
        },

        ambrosiaCubes3: {
            costPerLevel: 75000,
            maxLevel: 100,
            ignoreEXALT: false,
            costFormula: (n: number, cpl: number): number => cpl + 5000 * n,
            effects: (n: number, ctx?: AmbrosiaUpgradeEffectContext) => {
                const cubes2Level = ctx?.getAmbrosiaUpgradeLevel('ambrosiaCubes2') ?? this.calculateAmbrosiaUpgradeValue('ambrosiaCubes2');
                const cube2Multi = 1 + 3 * cubes2Level / 100;
                const cube3Base = 0.2 * n;
                const cube3Exponential = Math.pow(1.2, Math.floor(n / 5));
                const cubeAmount = (1 + cube3Base * cube2Multi) * cube3Exponential;
                return {
                    cubes: cubeAmount,
                };
            },
            extraLevelCalc: () => this.getRedAmbrosiaUpgradeEffects('freeLevelsRow5').freeLevels,
            prerequisites: {
                ambrosiaCubes1: 100,
                ambrosiaCubes2: 50,
            },
        },

        ambrosiaLuck3: {
            costPerLevel: 50000,
            maxLevel: 100,
            ignoreEXALT: false,
            costFormula: (_n: number, cpl: number): number => cpl,
            effects: (n: number) => {
                const perLevel = this.calculateBlueberryInventory(true) as number;
                return {
                    ambrosiaLuck: perLevel * n,
                };
            },
            extraLevelCalc: () => this.getRedAmbrosiaUpgradeEffects('freeLevelsRow5').freeLevels,
            prerequisites: {
                ambrosiaLuck1: 90,
                ambrosiaLuck2: 50,
            },
        },

        ambrosiaLuck4: {
            costPerLevel: 250000,
            maxLevel: 50,
            ignoreEXALT: false,
            costFormula: (n: number, cpl: number): number => cpl + 20000 * n,
            effects: (n: number) => {
                const digits =
                    this.#getLifetimeAmbrosiaLogSum();
                return {
                    ambrosiaLuckPercentage: (1 / 10000) * digits * n,
                };
            },
            extraLevelCalc: () => this.getRedAmbrosiaUpgradeEffects('freeLevelsRow5').freeLevels,
        },

        ambrosiaPatreon: {
            costPerLevel: 1,
            maxLevel: 1,
            ignoreEXALT: false,
            costFormula: (n: number, cpl: number): number =>
                cpl * ((n + 1) ** 2 - n ** 2),
            effects: (n: number) => {
                const val = 1 + (n * (this.#ctx.getMeData()?.bonus.quarks ?? 0)) / 100;
                return {
                    blueberryGeneration: val,
                };
            },
            extraLevelCalc: () => 0,
        },

        ambrosiaObtainium1: {
            costPerLevel: 50000,
            maxLevel: 2,
            ignoreEXALT: false,
            costFormula: (n: number, cpl: number): number => cpl * 25 ** n,
            effects: (n: number) => {
                const { luckTotal } = this.calculateLuck(true) as { luckTotal: number };
                return {
                    luckMult: n,
                    obtainiumMult: n * luckTotal,
                };
            },
            extraLevelCalc: () => 0,
        },

        ambrosiaOffering1: {
            costPerLevel: 50000,
            maxLevel: 2,
            ignoreEXALT: false,
            costFormula: (n: number, cpl: number): number => cpl * 25 ** n,
            effects: (n: number) => {
                const luck = this.calculateLuck();
                return {
                    luckMult: n,
                    offeringMult: n * luck.luckTotal,
                };
            },
            extraLevelCalc: () => 0,
        },

        ambrosiaHyperflux: {
            costPerLevel: 33333,
            maxLevel: 7,
            ignoreEXALT: false,
            costFormula: (n: number, cpl: number): number =>
                (cpl + 33333 * Math.min(4, n)) * Math.max(1, 3 ** (n - 4)),
            effects: (n: number) => {
                const fourByFourBase = n;
                return {
                    hyperFlux: Math.pow(
                        1 + 1 / 100 * fourByFourBase,
                        this.#ctx.getGameData()?.platonicUpgrades[19] ?? 0,
                    ),
                };
            },
            extraLevelCalc: () => 0,
        },

        ambrosiaBaseOffering1: {
            costPerLevel: 5,
            maxLevel: 40,
            ignoreEXALT: false,
            costFormula: (n: number, cpl: number): number =>
                cpl * ((n + 1) ** 3 - n ** 3),
            effects: (n: number) => ({
                offering: n,
            }),
            extraLevelCalc: () => this.getRedAmbrosiaUpgradeEffects('freeLevelsRow2').freeLevels,
        },

        ambrosiaBaseObtainium1: {
            costPerLevel: 40,
            maxLevel: 20,
            ignoreEXALT: false,
            costFormula: (n: number, cpl: number): number =>
                cpl * ((n + 1) ** 3 - n ** 3),
            effects: (n: number) => ({
                obtainium: n,
            }),
            extraLevelCalc: () => this.getRedAmbrosiaUpgradeEffects('freeLevelsRow2').freeLevels,
        },

        ambrosiaBaseOffering2: {
            costPerLevel: 20,
            maxLevel: 60,
            ignoreEXALT: false,
            costFormula: (n: number, cpl: number): number =>
                cpl * ((n + 1) ** 3 - n ** 3),
            effects: (n: number) => ({
                offering: n,
            }),
            extraLevelCalc: () => this.getRedAmbrosiaUpgradeEffects('freeLevelsRow4').freeLevels,
            prerequisites: {
                ambrosiaBaseOffering1: 30,
                ambrosiaBaseObtainium1: 10,
            },
        },

        ambrosiaBaseObtainium2: {
            costPerLevel: 160,
            maxLevel: 30,
            ignoreEXALT: false,
            costFormula: (n: number, cpl: number): number =>
                cpl * ((n + 1) ** 3 - n ** 3),
            effects: (n: number) => ({
                obtainium: n,
            }),
            extraLevelCalc: () => this.getRedAmbrosiaUpgradeEffects('freeLevelsRow4').freeLevels,
            prerequisites: {
                ambrosiaBaseObtainium1: 15,
                ambrosiaBaseOffering1: 20,
            },
        },

        ambrosiaSingReduction1: {
            costPerLevel: 100000,
            maxLevel: 2,
            ignoreEXALT: false,
            costFormula: (n: number, cpl: number): number =>
                cpl * 99 ** n,
            effects: (n: number) => {
                const val = this.#ctx.getGameData()?.insideSingularityChallenge ? 0 : n;
                return {
                    singularityReduction: val,
                };
            },
            extraLevelCalc: () => 0,
            prerequisites: {
                ambrosiaHyperflux: 4,
            },
        },

        ambrosiaInfiniteShopUpgrades1: {
            costPerLevel: 25000,
            maxLevel: 20,
            ignoreEXALT: false,
            costFormula: (_n: number, cpl: number): number => cpl,
            effects: (n: number) => ({
                freeLevels: n,
            }),
            extraLevelCalc: () => this.getRedAmbrosiaUpgradeEffects('freeLevelsRow4').freeLevels,
            prerequisites: {
                ambrosiaCubes1: 70,
                ambrosiaBaseOffering1: 20,
                ambrosiaBaseObtainium1: 10,
            },
        },

        ambrosiaInfiniteShopUpgrades2: {
            costPerLevel: 75000,
            maxLevel: 20,
            ignoreEXALT: false,
            costFormula: (_n: number, cpl: number): number => cpl,
            effects: (n: number) => ({
                freeLevels: n,
            }),
            extraLevelCalc: () => this.getRedAmbrosiaUpgradeEffects('freeLevelsRow5').freeLevels,
            prerequisites: {
                ambrosiaInfiniteShopUpgrades1: 20,
                ambrosiaCubes2: 50,
                ambrosiaBaseOffering2: 20,
                ambrosiaBaseObtainium2: 10,
            },
        },

        ambrosiaSingReduction2: {
            costPerLevel: 1.25e7,
            maxLevel: 2,
            ignoreEXALT: false,
            costFormula: (n: number, cpl: number): number =>
                cpl * 3 ** n,
            effects: (n: number) => {
                const val = this.#ctx.getGameData()?.insideSingularityChallenge ? n : 0;
                return {
                    singularityReduction: val,
                };
            },
            extraLevelCalc: () => 0,
        },

        ambrosiaTalismanBonusRuneLevel: {
            costPerLevel: 100,
            maxLevel: 100,
            ignoreEXALT: false,
            costFormula: (n: number, cpl: number): number =>
                cpl * ((n + 1) ** 2 - n ** 2),
            effects: (n: number) => ({
                talismanBonusRuneLevel: n / 200,
            }),
            extraLevelCalc: () => this.getRedAmbrosiaUpgradeEffects('freeLevelsRow2').freeLevels,
        },

        ambrosiaRuneOOMBonus: {
            costPerLevel: 2500,
            maxLevel: 100,
            ignoreEXALT: false,
            costFormula: (n: number, cpl: number): number =>
                Math.ceil(cpl * ((n + 1) ** 1.5 - n ** 1.5)),
            effects: (n: number) => ({
                runeOOMBonus: n,
                infiniteAscentOOMBonus: n / 1000,
            }),
            extraLevelCalc: () => this.getRedAmbrosiaUpgradeEffects('freeLevelsRow4').freeLevels,
        },

        ambrosiaBrickOfLead: {
            costPerLevel: 10,
            maxLevel: 25,
            ignoreEXALT: false,
            costFormula: (n: number, cpl: number): number =>
                cpl * (Math.pow(n + 1, 3) - Math.pow(n, 3)),
            effects: (n: number) => ({
                barRequirementMult: 1 / (1 - n / 50),
                additiveLuckMult: n / 50,
                singularitySpeedMult: 1 - n / 100,
            }),
            extraLevelCalc: () => 0,
        },

        ambrosiaFreeLuckUpgrades: {
            costPerLevel: 5000,
            maxLevel: 25,
            ignoreEXALT: false,
            costFormula: (n: number, cpl: number): number =>
                cpl * (Math.pow(n + 1, 2) - Math.pow(n, 2)),
            effects: (n: number) => ({
                freeLuckUpgrades: n,
            }),
            extraLevelCalc: () => this.getRedAmbrosiaUpgradeEffects('freeLevelsRow2').freeLevels,
        },

        ambrosiaFreeGenerationUpgrades: {
            costPerLevel: 5000,
            maxLevel: 3,
            ignoreEXALT: false,
            costFormula: (n: number, cpl: number): number =>
                cpl * (Math.pow(10, n + 1) - Math.pow(10, n)),
            effects: (n: number) => ({
                freeGenerationUpgrades: n,
            }),
            extraLevelCalc: () => 0, // INTENDED (no bonus levels applied)
        },

        ambrosiaFreeRedLuckUpgrades: {
            costPerLevel: 20000,
            maxLevel: 40,
            ignoreEXALT: false,
            costFormula: (n: number, cpl: number): number =>
                cpl * (Math.pow(n + 1, 2) - Math.pow(n, 2)),
            effects: (n: number) => ({
                freeRedLuckUpgrades: n,
            }),
            extraLevelCalc: () => this.getRedAmbrosiaUpgradeEffects('freeLevelsRow4').freeLevels,
            prerequisites: {
                ambrosiaFreeLuckUpgrades: 10,
            },
        },

        ambrosiaFreeQuarkUpgrades: {
            costPerLevel: 25000,
            maxLevel: 10,
            ignoreEXALT: false,
            costFormula: (n: number, cpl: number): number =>
                cpl * (Math.pow(n + 1, 3) - Math.pow(n, 3)),
            effects: (n: number) => ({
                freeQuarkUpgrades: n / 10,
            }),
            extraLevelCalc: () => this.getRedAmbrosiaUpgradeEffects('freeLevelsRow5').freeLevels,
        },
    };

    getRedAmbrosiaUpgradeEffects = <T extends RedAmbrosiaUpgradeKey>(upgradeKey: T): RedAmbrosiaUpgradeRewards[T] => {
        const currentLevel = this.calculateRedAmbrosiaUpgradeValue(upgradeKey);
        return this.redAmbrosiaUpgradeCalculationCollection[upgradeKey].effects(currentLevel, this.#ctx.getGameData()) as RedAmbrosiaUpgradeRewards[T];
    };

    getAmbrosiaUpgradeEffectiveLevels = <T extends AmbrosiaUpgradeNames>(upgradeKey: T): number => {
        const data = this.#ctx.getGameData();
        if (!data) return 0;

        if (!(upgradeKey in data.ambrosiaUpgrades)) return 0;
        if (!(upgradeKey in this.ambrosiaUpgradeCalculationCollection)) return 0;

        const upgradeConfig = this.ambrosiaUpgradeCalculationCollection[upgradeKey];
        const effectiveLevels = this.calculateAmbrosiaUpgradeValue(upgradeKey);

        return ((data.singularityChallenges.noAmbrosiaUpgrades.enabled || data.singularityChallenges.sadisticPrequel.enabled) && !upgradeConfig.ignoreEXALT)
            ? 0
            : effectiveLevels;
    };

    #getAmbrosiaUpgradeEffectsFreeLevelsOnly = <T extends AmbrosiaUpgradeNames>(upgradeKey: T): AmbrosiaUpgradeRewards[T] => {
        const upgradeConfig = this.ambrosiaUpgradeCalculationCollection[upgradeKey];
        const freeLevelCount = upgradeConfig.extraLevelCalc?.() ?? 0;

        const ctx: AmbrosiaUpgradeEffectContext = {
            freeLevelsOnly: true,
            getAmbrosiaUpgradeLevel: (name) => this.calculateAmbrosiaUpgradeValue(name, true),
        };

        return upgradeConfig.effects(freeLevelCount, ctx) as AmbrosiaUpgradeRewards[T];
    };

    getAmbrosiaUpgradeEffects = <T extends AmbrosiaUpgradeNames>(upgradeKey: T, mode: CalculationMode = 'normal'): AmbrosiaUpgradeRewards[T] => {
        return mode === 'true_base'
            ? this.#getAmbrosiaUpgradeEffectsFreeLevelsOnly(upgradeKey)
            : this.ambrosiaUpgradeCalculationCollection[upgradeKey].effects(this.getAmbrosiaUpgradeEffectiveLevels(upgradeKey)) as AmbrosiaUpgradeRewards[T];
    };

    get maxRedAmbrosiaUpgradeAP(): number {
        return Object.values(this.redAmbrosiaUpgradeCalculationCollection).reduce((acc: number, upgrade) => {
            if (upgrade.maxLevel === -1) {
                return acc;
            }
            return acc + 10;
        }, 0);
    }

    calculateAmbrosiaGenerationShopUpgrade(reduce_vals = true, true_base = false) {
        const data = this.#ctx.getGameData();
        if (!data) return 0;

        const cacheName = (`AmbrosiaGenerationShopUpgrade${true_base ? '_TRUE_BASE' : ''}`) as keyof CalculationCache;
        const calculationVars: number[] = [
            data.shopUpgrades.shopAmbrosiaGeneration1,
            data.shopUpgrades.shopAmbrosiaGeneration2,
            data.shopUpgrades.shopAmbrosiaGeneration3,
            data.shopUpgrades.shopAmbrosiaGeneration4,
            data.ambrosiaUpgrades.ambrosiaFreeGenerationUpgrades.ambrosiaInvested,
            data.redAmbrosiaUpgrades.freeLevelsRow3,
            data.singularityChallenges.noAmbrosiaUpgrades.enabled ? 1 : 0,
            data.singularityChallenges.sadisticPrequel.enabled ? 1 : 0,
        ];

        const cached = this.#ctx.checkCalculationCache(cacheName, calculationVars);
        if (reduce_vals && cached !== undefined) return cached;

        const mode = true_base ? 'true_base' : 'normal';
        const vals = [
            this.#ctx.getShopUpgradeEffects('shopAmbrosiaGeneration1', 'ambrosiaGenerationMult', mode) as number,
            this.#ctx.getShopUpgradeEffects('shopAmbrosiaGeneration2', 'ambrosiaGenerationMult', mode) as number,
            this.#ctx.getShopUpgradeEffects('shopAmbrosiaGeneration3', 'ambrosiaGenerationMult', mode) as number,
            this.#ctx.getShopUpgradeEffects('shopAmbrosiaGeneration4', 'ambrosiaGenerationMult', mode) as number,
        ];

        const reduced = vals.reduce((a, b) => a * b, 1);
        this.#ctx.updateCalculationCache(cacheName, { value: reduced, cachedBy: calculationVars });
        return reduce_vals ? reduced : vals;
    }

    calculateAmbrosiaGenerationSingularityUpgrade(reduce_vals = true) {
        const data = this.#ctx.getGameData();
        if (!data) return 0;

        const cacheName = 'AmbrosiaGenerationSingularityUpgrade' as keyof CalculationCache;
        const calculationVars: number[] = [
            data.goldenQuarkUpgrades.singAmbrosiaGeneration.level,
            data.goldenQuarkUpgrades.singAmbrosiaGeneration2.level,
            data.goldenQuarkUpgrades.singAmbrosiaGeneration3.level,
            data.goldenQuarkUpgrades.singAmbrosiaGeneration4.level,
        ];

        const cached = this.#ctx.checkCalculationCache(cacheName, calculationVars);
        if (reduce_vals && cached !== undefined) return cached;

        const vals = [
            1 + data.goldenQuarkUpgrades.singAmbrosiaGeneration.level / 100,
            1 + data.goldenQuarkUpgrades.singAmbrosiaGeneration2.level / 100,
            1 + data.goldenQuarkUpgrades.singAmbrosiaGeneration3.level / 100,
            1 + (2 * data.goldenQuarkUpgrades.singAmbrosiaGeneration4.level) / 100,
        ];

        const reduced = vals.reduce((a, b) => a * b, 1);
        this.#ctx.updateCalculationCache(cacheName, { value: reduced, cachedBy: calculationVars });
        return reduce_vals ? reduced : vals;
    }

    calculateAmbrosiaGenerationOcteractUpgrade(reduce_vals = true) {
        const data = this.#ctx.getGameData();
        if (!data) return 0;

        const cacheName = 'AmbrosiaGenerationOcteractUpgrade' as keyof CalculationCache;
        const calculationVars: number[] = [
            data.octUpgrades.octeractAmbrosiaGeneration.level,
            data.octUpgrades.octeractAmbrosiaGeneration2.level,
            data.octUpgrades.octeractAmbrosiaGeneration3.level,
            data.octUpgrades.octeractAmbrosiaGeneration4.level,
        ];

        const cached = this.#ctx.checkCalculationCache(cacheName, calculationVars);
        if (reduce_vals && cached !== undefined) return cached;

        const vals = [
            1 + data.octUpgrades.octeractAmbrosiaGeneration.level / 100,
            1 + data.octUpgrades.octeractAmbrosiaGeneration2.level / 100,
            1 + data.octUpgrades.octeractAmbrosiaGeneration3.level / 100,
            1 + (2 * data.octUpgrades.octeractAmbrosiaGeneration4.level) / 100,
        ];

        const reduced = vals.reduce((a, b) => a * b, 1);
        this.#ctx.updateCalculationCache(cacheName, { value: reduced, cachedBy: calculationVars });
        return reduce_vals ? reduced : vals;
    }

    calculateCampaignAmbrosiaSpeedBonus() {
        const tokens = this.#ctx.getCampaignTokens();
        const cacheName = 'CampaignAmbrosiaSpeedBonus' as keyof CalculationCache;
        const calculationVars: number[] = [tokens];
        const cached = this.#ctx.checkCalculationCache(cacheName, calculationVars);
        if (cached !== undefined) return cached;

        let campaignBlueberrySpeedBonus;
        if (tokens < 2000) {
            campaignBlueberrySpeedBonus = 1;
        } else {
            campaignBlueberrySpeedBonus = 1 + 0.02 * 1 / 2000 * Math.min(tokens - 2000, 2000) + 0.03 * (1 - Math.exp(-Math.max(tokens - 4000, 0) / 2000));
        }

        this.#ctx.updateCalculationCache(cacheName, { value: campaignBlueberrySpeedBonus, cachedBy: calculationVars });
        return campaignBlueberrySpeedBonus;
    }

    private calculateAmbrosiaGenerationSpeedPatreonBonus(): number {
        const me = this.#ctx.getMeData();
        if (!me) return 1;
        const blueberryGeneration = this.#ctx.getAmbrosiaUpgradeEffects('ambrosiaPatreon').blueberryGeneration;
        return 1 + (blueberryGeneration * 100 * (1 + me.globalBonus / 100) * (1 + me.personalBonus / 100) - 100) / 100;
    }

    calculateAmbrosiaGenerationSpeed(reduce_vals = true, true_base = true) {
        const data = this.#ctx.getGameData();
        const meBonuses = this.#ctx.getMeData();
        if (!data || !meBonuses) return 0;

        const cacheName = (`AmbrosiaGenerationSpeedRaw${true_base ? '_TRUE_BASE' : ''}`) as keyof CalculationCache;
        const P_GEN_BUFF_LVL = this.#ctx.getPCoinUpgradeLevel('AMBROSIA_GENERATION_BUFF');
        const campaignBlueberrySpeedBonus = this.calculateCampaignAmbrosiaSpeedBonus();
        const AMBROSIA_UNLOCKED_GATE = data.singularityChallenges.noSingularityUpgrades.completions > 0 ? 1 : 0;
        const RED_AMB_GEN_1 = this.#ctx.getRedAmbrosiaUpgradeEffects('blueberryGenerationSpeed').blueberryGenerationSpeed;
        const RED_AMB_GEN_2 = this.#ctx.getRedAmbrosiaUpgradeEffects('blueberryGenerationSpeed2').blueberryGenerationSpeed;
        const ambrosiaGenerationShopUpgrade = this.calculateAmbrosiaGenerationShopUpgrade(true, true_base) as number;
        const ambrosiaGenerationSingularityUpgrade = this.calculateAmbrosiaGenerationSingularityUpgrade(true) as number;
        const ambrosiaGenerationOcteractUpgrade = this.calculateAmbrosiaGenerationOcteractUpgrade(true) as number;
        const ambrosiaPatreonBlueberryGeneration = true_base ? 1 : this.calculateAmbrosiaGenerationSpeedPatreonBonus();
        const panthemaAmbrosiaGenerationMult = this.#ctx.getShopUpgradeEffects('shopPanthema', 'ambrosiaGenerationMult', true_base ? 'true_base' : 'normal') as number;
        const oneChallengeCap = this.#ctx.getSingularityChallengeEffect('oneChallengeCap', 'blueberrySpeedMult');
        const noAmbrosiaUpgrades = this.#ctx.getSingularityChallengeEffect('noAmbrosiaUpgrades', 'blueberrySpeedMult');
        const eventBlueberryTimeBuff = this.#ctx.isEvent ? 1 + this.#ctx.calculateEventSourceBuff(EventBuffType.BlueberryTime) : 1;
        const cookie76Bonus = 1 + 0.01 * (data.cubeUpgrades[76] ?? 0) * this.calculateNumberOfThresholds();

        const calculationVars: number[] = [
            AMBROSIA_UNLOCKED_GATE,
            P_GEN_BUFF_LVL,
            campaignBlueberrySpeedBonus,
            meBonuses.globalBonus,
            meBonuses.personalBonus,
            RED_AMB_GEN_1,
            RED_AMB_GEN_2,
            data.shopUpgrades.shopAmbrosiaGeneration1,
            data.shopUpgrades.shopAmbrosiaGeneration2,
            data.shopUpgrades.shopAmbrosiaGeneration3,
            data.shopUpgrades.shopAmbrosiaGeneration4,
            data.ambrosiaUpgrades.ambrosiaFreeGenerationUpgrades.ambrosiaInvested,
            data.redAmbrosiaUpgrades.freeLevelsRow3,
            data.singularityChallenges.noAmbrosiaUpgrades.enabled ? 1 : 0,
            data.singularityChallenges.sadisticPrequel.enabled ? 1 : 0,
            data.goldenQuarkUpgrades.singAmbrosiaGeneration.level,
            data.goldenQuarkUpgrades.singAmbrosiaGeneration2.level,
            data.goldenQuarkUpgrades.singAmbrosiaGeneration3.level,
            data.goldenQuarkUpgrades.singAmbrosiaGeneration4.level,
            data.octUpgrades.octeractAmbrosiaGeneration.level,
            data.octUpgrades.octeractAmbrosiaGeneration2.level,
            data.octUpgrades.octeractAmbrosiaGeneration3.level,
            data.octUpgrades.octeractAmbrosiaGeneration4.level,
            this.#ctx.getAmbrosiaUpgradeEffects('ambrosiaPatreon').blueberryGeneration,
            oneChallengeCap,
            noAmbrosiaUpgrades,
            data.cubeUpgrades[76] ?? 0,
            data.lifetimeAmbrosia,
            this.#ctx.getShopUpgradeEffects('shopCashGrabUltra', 'ambrosiaGenerationMult') as number,
            data.shopUpgrades.shopPanthema,
            this.#ctx.isEvent ? 1 : 0,
            eventBlueberryTimeBuff,
        ];

        const cached = this.#ctx.checkCalculationCache(cacheName, calculationVars);
        if (reduce_vals && cached !== undefined) return cached;

        const vals = [
            AMBROSIA_UNLOCKED_GATE,
            P_GEN_BUFF_LVL ? 1 + P_GEN_BUFF_LVL * 0.05 : 1,
            campaignBlueberrySpeedBonus,
            ambrosiaGenerationShopUpgrade,
            ambrosiaGenerationSingularityUpgrade,
            ambrosiaGenerationOcteractUpgrade,
            ambrosiaPatreonBlueberryGeneration,
            panthemaAmbrosiaGenerationMult,
            oneChallengeCap,
            noAmbrosiaUpgrades,
            RED_AMB_GEN_1,
            RED_AMB_GEN_2,
            cookie76Bonus,
            this.#ctx.getShopUpgradeEffects('shopCashGrabUltra', 'ambrosiaGenerationMult') as number,
            eventBlueberryTimeBuff,
        ];

        const reduced = vals.reduce((a, b) => a * b, 1);
        this.#ctx.updateCalculationCache(cacheName, { value: reduced, cachedBy: calculationVars });
        return reduce_vals ? reduced : vals;
    }

    calculateRequiredBlueberryTime() {
        const data = this.#ctx.getGameData();
        if (!data) return 0;
        const cacheName = 'RequiredBlueberryTime' as keyof CalculationCache;
        const timePerAmbrosia = HSGlobal.HSAmbrosia.TIME_PER_AMBROSIA; // Currently 45

        const calculationVars: number[] = [
            data.lifetimeAmbrosia,
            data.shopUpgrades.shopAmbrosiaAccelerator,
            data.singularityChallenges.noAmbrosiaUpgrades.completions,
            data.ambrosiaUpgrades.ambrosiaBrickOfLead.ambrosiaInvested,
            data.singularityChallenges.noAmbrosiaUpgrades.enabled ? 1 : 0,
            data.singularityChallenges.sadisticPrequel.enabled ? 1 : 0,
        ];

        const cached = this.#ctx.checkCalculationCache(cacheName, calculationVars);
        if (cached !== undefined) return cached;

        let val = timePerAmbrosia;
        val += Math.floor((data.lifetimeAmbrosia / 300));

        const acceleratorMult = this.#ctx.getShopUpgradeEffects('shopAmbrosiaAccelerator', 'ambrosiaPointRequirementMult') as number;
        const brickOfLeadMult = this.getAmbrosiaUpgradeEffects('ambrosiaBrickOfLead').barRequirementMult;

        val *= acceleratorMult;
        val *= brickOfLeadMult;

        if (data.lifetimeAmbrosia >= 10000) {
            const extraScalingPower = Math.log10(4);
            val *= Math.pow(data.lifetimeAmbrosia / 10000, extraScalingPower);
            val = Math.ceil(val);
        }

        this.#ctx.updateCalculationCache(cacheName, { value: val, cachedBy: calculationVars });
        return val;
    }

    calculateRequiredRedAmbrosiaTime() {
        const data = this.#ctx.getGameData();
        if (!data) return 0;

        const cacheName = 'RequiredRedAmbrosiaTime' as keyof CalculationCache;
        const calculationVars: number[] = [
            data.lifetimeRedAmbrosia,
            data.singularityChallenges.limitedTime.completions,
        ];

        const cached = this.#ctx.checkCalculationCache(cacheName, calculationVars);
        if (cached !== undefined) return cached;

        const redBarRequirementMultiplier = this.#ctx.getSingularityChallengeEffect('limitedTime', 'barRequirementMultiplier');

        let val = HSGlobal.HSAmbrosia.TIME_PER_RED_AMBROSIA;
        val += 200 * data.lifetimeRedAmbrosia;

        const max = 1e6 * +redBarRequirementMultiplier;
        val *= +redBarRequirementMultiplier;

        const reduced = Math.min(max, val);
        this.#ctx.updateCalculationCache(cacheName, { value: reduced, cachedBy: calculationVars });
        return reduced;
    }

    calculateNumberOfThresholds() {
        const data = this.#ctx.getGameData();
        if (!data) return 0;
        const cacheName = 'NumberOfThresholds' as keyof CalculationCache;
        const digitReduction = HSGlobal.HSAmbrosia.digitReduction;

        const calculationVars: number[] = [
            data.lifetimeAmbrosia,
        ];

        const cached = this.#ctx.checkCalculationCache(cacheName, calculationVars);
        if (cached !== undefined) return cached;

        const numDigits = data.lifetimeAmbrosia > 0 ? 1 + Math.floor(Math.log10(data.lifetimeAmbrosia)) : 0;
        const matissa = Math.floor(data.lifetimeAmbrosia / Math.pow(10, numDigits - 1));

        const extraReduction = matissa >= 3 ? 1 : 0;
        const reduced = Math.max(0, 2 * (numDigits - digitReduction) - 1 + extraReduction);

        this.#ctx.updateCalculationCache(cacheName, { value: reduced, cachedBy: calculationVars });
        return reduced;
    }

    calculateToNextThreshold() {
        const data = this.#ctx.getGameData();
        if (!data) return 0;
        const cacheName = 'ToNextThreshold' as keyof CalculationCache;
        const digitReduction = HSGlobal.HSAmbrosia.digitReduction;

        const calculationVars: number[] = [
            data.lifetimeAmbrosia,
        ];

        const cached = this.#ctx.checkCalculationCache(cacheName, calculationVars);
        if (cached !== undefined) return cached;

        const numThresholds = this.calculateNumberOfThresholds();
        let val;

        if (numThresholds === 0) {
            val = 10000 - data.lifetimeAmbrosia;
        } else {
            if (numThresholds % 2 === 0) {
                val = Math.pow(10, numThresholds / 2 + digitReduction) - data.lifetimeAmbrosia;
            } else {
                val = 3 * Math.pow(10, (numThresholds - 1) / 2 + digitReduction) - data.lifetimeAmbrosia;
            }
        }

        this.#ctx.updateCalculationCache(cacheName, { value: val, cachedBy: calculationVars });
        return val;
    }

    calculateAmbrosiaUpgradeValue(upgradeName: AmbrosiaUpgradeNames, freeLevelsOnly = false) {
        const data = this.#ctx.getGameData();
        if (!data) return 0;
        const cacheName = this.#getAmbrosiaUpgradeCacheName(upgradeName, freeLevelsOnly);

        if (!(upgradeName in data.ambrosiaUpgrades)) return 0;
        if (!(upgradeName in this.ambrosiaUpgradeCalculationCollection)) return 0;

        const investmentParameters = this.ambrosiaUpgradeCalculationCollection[upgradeName] as AmbrosiaUpgradeCalculationConfig<any>;
        const calculationVars: number[] = [
            data.ambrosiaUpgrades[upgradeName].ambrosiaInvested,
            investmentParameters.extraLevelCalc(),
        ];
        const cached = this.#ctx.checkCalculationCache(cacheName, calculationVars);

        if (cached !== undefined) return cached;

        if (freeLevelsOnly) {
            const reduced = investmentParameters.extraLevelCalc();
            this.#ctx.updateCalculationCache(cacheName, { value: reduced, cachedBy: calculationVars });
            return reduced;
        }

        const upgradeValue = this.investToAmbrosiaUpgrade(
            investmentParameters.extraLevelCalc(),
            data.ambrosiaUpgrades[upgradeName].ambrosiaInvested,
            investmentParameters.costPerLevel,
            investmentParameters.maxLevel,
            investmentParameters.costFormula,
        );

        const reduced = upgradeValue;
        this.#ctx.updateCalculationCache(cacheName, { value: reduced, cachedBy: calculationVars });
        return reduced;
    }

    calculateRedAmbrosiaUpgradeValue(upgradeName: keyof RedAmbrosiaUpgrades) {
        const data = this.#ctx.getGameData();
        if (!data) return 0;
        const cacheName = `REDAMB_${upgradeName}` as keyof CalculationCache;

        if (!(upgradeName in data.redAmbrosiaUpgrades)) return 0;
        if (!(upgradeName in this.redAmbrosiaUpgradeCalculationCollection)) return 0;

        const calculationVars: number[] = [data.redAmbrosiaUpgrades[upgradeName]];
        const cached = this.#ctx.checkCalculationCache(cacheName, calculationVars);
        if (cached !== undefined) return cached;

        const investmentParameters = this.redAmbrosiaUpgradeCalculationCollection[upgradeName];

        const upgradeValue = this.investToRedAmbrosiaUpgrade(
            data.redAmbrosiaUpgrades[upgradeName],
            investmentParameters.costPerLevel,
            investmentParameters.maxLevel,
            investmentParameters.costFunction,
        );

        const reduced = upgradeValue;
        this.#ctx.updateCalculationCache(cacheName, { value: reduced, cachedBy: calculationVars });
        return reduced;
    }

    investToAmbrosiaUpgrade(
        free: number,
        budget: number,
        costPerLevel: number,
        maxLevel: number,
        constFunction: (n: number, cpl: number) => number,
    ) {
        let level = 0;
        let nextCost = constFunction(level, costPerLevel);

        while (budget >= nextCost) {
            budget -= nextCost;
            level += 1;
            nextCost = constFunction(level, costPerLevel);

            if (level >= maxLevel) {
                break;
            }
        }

        level += free;
        return level;
    }

    investToRedAmbrosiaUpgrade(
        budget: number,
        costPerLevel: number,
        maxLevel: number,
        constFunction: (n: number, cpl: number) => number,
    ) {
        let level = 0;
        let nextCost = constFunction(level, costPerLevel);

        while (budget >= nextCost) {
            budget -= nextCost;
            level += 1;
            nextCost = constFunction(level, costPerLevel);

            if (level >= maxLevel) {
                break;
            }
        }

        return level;
    }

    calculateLuck(reduce_vals = true, true_base = false) {
        return this.#ctx.calculateLuck(reduce_vals, true_base);
    }

    calculateBlueberryInventory(reduce_vals = true): number | number[] {
        const gameData = this.#ctx.getGameData();
        if (!gameData) return 0;

        const noAmbrosiaFactor = this.#ctx.getSingularityChallengeEffect('noAmbrosiaUpgrades', 'blueberries');

        const vals = [
            +(gameData.singularityChallenges.noSingularityUpgrades.completions > 0) * 3,
            +(gameData.goldenQuarkUpgrades.blueberries.level),
            +(gameData.octUpgrades.octeractBlueberries.level),
            +(this.getRedAmbrosiaUpgradeEffects('blueberries').blueberries),
            this.calculateSingularityMilestoneBlueberries(),
            noAmbrosiaFactor,
        ];

        const reduced = vals.reduce((a, b) => a + b, 0);
        return reduce_vals ? reduced : vals;
    }

    calculateSingularityMilestoneBlueberries(): number {
        const gameData = this.#ctx.getGameData();
        if (!gameData) return 0;

        const cacheName = 'SingularityMilestoneBlueberries' as keyof CalculationCache;
        const calculationVars: number[] = [gameData.highestSingularityCount];

        const cached = this.#ctx.checkCalculationCache(cacheName, calculationVars);
        if (cached !== undefined) return cached;

        let val = 0;

        if (gameData.highestSingularityCount >= 270) val = 5;
        else if (gameData.highestSingularityCount >= 256) val = 4;
        else if (gameData.highestSingularityCount >= 192) val = 3;
        else if (gameData.highestSingularityCount >= 128) val = 2;
        else if (gameData.highestSingularityCount >= 64) val = 1;

        const reduced = val;
        this.#ctx.updateCalculationCache(cacheName, { value: reduced, cachedBy: calculationVars });
        return reduced;
    }
}
