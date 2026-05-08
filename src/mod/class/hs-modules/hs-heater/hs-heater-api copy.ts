import Decimal from "break_infinity.js";
import { HSModuleManager } from "../../hs-core/module/hs-module-manager";
import { HSGameDataAPI } from "../../hs-core/gds/hs-gamedata-api";
import type { AmbrosiaUpgradeNames } from "../../../types/data-types/hs-gamedata-api-types";
import type { HeaterOptimizerInput, HeaterOptimizationResult } from "../../../types/data-types/hs-heater-types";

export class HSHeaterAPI {

    static createHeaterOptimizerResultFromInput(input: HeaterOptimizerInput): HeaterOptimizationResult {
        const {
            amb,
            ramb,
            ambSpeed,
            luckBaseNonAmb,
            luckMultNonAmb,
            redLuckBase,
            luckConversion,
            quarksOwned,
            qHept,
            plat4x4,
            cubesExpTotal,
            reducedSingularity,
            isInsideExalt,
            postAoag,
            transcription,
            ascSpeed,
            ascSpread,
            baseObt,
            baseOff,
            blueberries,
            bonusRow2,
            bonusRow3,
            bonusRow4,
            bonusRow5,
            runeMaxExp,
            runeSiRC,
            runeSiBonusLevelsTotal,
            runeIaBonusLevelsTotal,
            runeIaBonusLevelsTalisman,
            baseTalismanPower,
            jack,
            totalVouchers,
            shopAmbrosiaGeneration1,
            shopAmbrosiaGeneration2,
            shopAmbrosiaGeneration3,
            shopAmbrosiaGeneration4,
            shopAmbrosiaLuck1,
            shopAmbrosiaLuck2,
            shopAmbrosiaLuck3,
            shopAmbrosiaLuck4,
            shopRedLuck1,
            shopRedLuck2,
            shopRedLuck3,
            shopImproveQuarkHept1,
            shopImproveQuarkHept2,
            shopImproveQuarkHept3,
            shopImproveQuarkHept4,
            shopImproveQuarkHept5,
            active
        } = input;

        const shopQuark = shopImproveQuarkHept1 + shopImproveQuarkHept2 + shopImproveQuarkHept3 + shopImproveQuarkHept4 + shopImproveQuarkHept5;
        const exalt = Number(isInsideExalt);
        const qHeptExp = 0;


        const baseluck = luckBaseNonAmb;
        const multluck = luckMultNonAmb;

        const shopLuck =
              (shopAmbrosiaLuck1 > 0 ? 2 : 0)
            + (shopAmbrosiaLuck2 > 0 ? 2 : 0)
            + (shopAmbrosiaLuck3 > 0 ? 2 : 0)
            + (shopAmbrosiaLuck4 > 0 ? 0.6 : 0);

        const bonus = [
            [bonusRow2, 0],
            [bonusRow3, 0],
            [bonusRow4, 0],
            [bonusRow5, 0],
        ];

        const module_name = [
            "ambrosiaTutorial",
            "ambrosiaPatreon",
            "ambrosiaObtainium1",
            "ambrosiaOffering1",
            "ambrosiaHyperflux",
            "ambrosiaQuarks1",
            "ambrosiaCubes1",
            "ambrosiaLuck1",
            "ambrosiaCubeQuark1",
            "ambrosiaLuckQuark1",
            "ambrosiaLuckCube1",
            "ambrosiaQuarkCube1",
            "ambrosiaCubeLuck1",
            "ambrosiaQuarkLuck1",
            "ambrosiaQuarks2",
            "ambrosiaCubes2",
            "ambrosiaLuck2",
            "ambrosiaQuarks3",
            "ambrosiaCubes3",
            "ambrosiaLuck3",
            "ambrosiaBaseObtainium1",
            "ambrosiaBaseOffering1",
            "ambrosiaBaseObtainium2",
            "ambrosiaBaseOffering2",
            "ambrosiaSingReduction1",
            "ambrosiaSingReduction2",
            "ambrosiaInfiniteShopUpgrades1",
            "ambrosiaInfiniteShopUpgrades2",
            "ambrosiaLuck4",
            "ambrosiaTalismanBonusRuneLevel",
            "ambrosiaRuneOOMBonus",
            "ambrosiaBrickOfLead",
            "ambrosiaFreeLuckUpgrades",
            "ambrosiaFreeGenerationUpgrades",
            "ambrosiaFreeRedLuckUpgrades",
            "ambrosiaFreeQuarkUpgrades",
        ];
        
        const true_base_tree = Array.from({ length: module_name.length }, (_, i) => Math.floor(Math.pow(10, 1 - i)));
        const max_level = [
            10, 1, 2, 2, 7, 100, 100, 100, 25, 25, 25, 25, 25, 25, 100, 100, 100, 10, 100, 100, 20, 40, 30, 60, 2, 2, 20, 20, 50, 100, 100,
            25, 25, 3, 40, 10,
        ];
        const alt_level_list = [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 5, 6, 7, 14, 15, 16, 0, 0, 0, 0, 0, 0, 0, 26, 0, 0, 0,
            0, 0, 0, 0, 0,
        ];
        const bonus_level = [
            -1, -1, -1, -1, -1, 0, 0, 0, 1, 1, 1, 1, 1, 1, 2, 2, 2, 3, 3, 3, -1, -1, -1, -1, -1, -1, -1, -1, 3, -1, 2,
            -1, -1, -1, -1, -1,
        ];
        const obtofoff = [
            0, 0, 1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 1, 2, 3, 3, 3, 3, 0, 3, 3,
            0, 0, 0, 0, 0,
        ];
        const multiluck = [
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0,
            0, 0, 0, 0, 0,
        ];
        const force_tree = new Array(module_name.length).fill(0);

        let matrix_L_I: Array<[number[], number, number]> = [];
        let matrix_Q_I: Array<[number[], number, number]> = [];
        let matrix_C_I: Array<[number[], number, number]> = [];

        const output: HeaterOptimizationResult = {
            input,
        };

        const greater_than_1 = 1 - 2 * Number(ascSpeed < 1);
        const reduced_asc = Math.pow(Math.pow(ascSpeed, 1 / (1 + ascSpread * greater_than_1)), greater_than_1);
        const transcriptionEffect = 0.55 + transcription / 150;
        const l4_digits = 2 + Math.floor(Math.log10(Math.max(1, amb))) + Math.floor(Math.log10(Math.max(1, ramb)));
        const originalSItotal = new Decimal(Math.floor((runeMaxExp - 12) * runeSiRC)).plus(runeSiBonusLevelsTotal);
        const originalIAtotal = new Decimal(Math.floor((runeMaxExp - 75) * (0.5 + 0.001 * bonus[2][0]))).plus(runeIaBonusLevelsTotal);
        const originalIAtotalNumber = originalIAtotal.toNumber();

        function singDebuff(singnum: number): [number, number] {
            function effectiveSing(sing: number): number {
                let eff = sing * Math.min(4.75, 0.75 * sing / 10 + 1);
                if (sing > 10) {
                    eff *= 1.5 * Math.min(4, 1.25 * sing / 10 - 0.25);
                }
                if (sing > 25) {
                    eff *= 2.5 * Math.min(6, 1.5 * sing / 25 - 0.5);
                }
                if (sing > 36) {
                    eff *= 4 * Math.min(5, sing / 18 - 1) * Math.pow(1.1, Math.min(sing - 36, 64));
                }
                if (sing > 50) {
                    eff *= 5 * Math.min(8, 2 * sing / 50 - 1) * Math.pow(1.1, Math.min(sing - 50, 50));
                }
                if (sing > 100) {
                    eff *= 2 * sing / 25 * Math.pow(1.1, sing - 100);
                }
                if (sing > 150) {
                    eff *= 2 * Math.pow(1.05, sing - 150);
                }
                if (sing > 200) {
                    eff *= 1.5 * Math.pow(1.275, sing - 200);
                }
                if (sing > 215) {
                    eff *= 1.25 * Math.pow(1.2, sing - 215);
                }
                if (sing > 230) {
                    eff *= 2;
                }
                if (sing > 269) {
                    eff *= Math.pow(3, Math.max(0, sing - 269) + 1);
                }
                return eff;
            }

            const effSing = effectiveSing(singnum);
            let cubemult = 1;
            if (singnum < 150) {
                cubemult *= 1 + Math.sqrt(effSing) / 5;
            } else {
                cubemult *= 1 + Math.pow(effSing, 0.75) / 10000;
            }
            let temp = 1;
            if (singnum >= 100) {
                temp = Math.pow(1.02, singnum - 100);
            }
            if (singnum < 150) {
                cubemult *= 1 + (Math.sqrt(effSing) * temp / 4);
            } else {
                cubemult *= 1 + (Math.pow(effSing, 0.75) * temp / 1000);
            }
            let omult = Math.pow(1.02, singnum);
            if (singnum < 150) {
                omult *= Math.sqrt(effSing + 1);
            } else {
                omult *= Math.pow(effSing, 2 / 3) / 400;
            }
            omult *= 1 + Math.sqrt(effSing) / 4;
            return [cubemult, omult];
        }

        function singReductionEffect(singnum: number, count: number): [number, number] {
            const [cubeA, obtA] = singDebuff(singnum);
            const [cubeB, obtB] = singDebuff(singnum - count);
            return [cubeA / cubeB, obtA / obtB];
        }

        function deltaIA(ctype: number, delta: Decimal): Decimal {
            let newIAtotal = new Decimal(-1);
            if (ctype === 1) {
                newIAtotal = originalIAtotal.plus(runeIaBonusLevelsTalisman.times(delta).dividedBy(baseTalismanPower));
            } else if (ctype === 2) {
                newIAtotal = new Decimal(runeMaxExp - 75).times(new Decimal(0.5).plus(delta)).floor().plus(runeIaBonusLevelsTotal);
            }
            return newIAtotal.minus(originalIAtotal);
        }

        function changeinIA(ctype: number, delta: Decimal): [Decimal, Decimal] {
            let newIAtotal = new Decimal(-1);
            if (ctype === 1) {
                newIAtotal = originalIAtotal.plus(runeIaBonusLevelsTalisman.times(delta).dividedBy(baseTalismanPower));
            } else if (ctype === 2) {
                newIAtotal = new Decimal(runeMaxExp - 75).times(new Decimal(0.5).plus(delta)).floor().plus(runeIaBonusLevelsTotal);
            }
            const qchange = newIAtotal.plus(500).div(originalIAtotal.plus(500));
            const cchange = newIAtotal.plus(100).div(originalIAtotal.plus(100));
            return [qchange, cchange];
        }

        function rSpeed(speed: number): number {
            return Math.min(speed, Math.sqrt(1000 * speed));
        }

        function ambGeneration(level = 0): number {
            let speed = 1;
            speed *= 1 + 0.01 * level / (1 + 0.01 * shopAmbrosiaGeneration1);
            speed *= 1 + 0.01 * level / (1 + 0.01 * shopAmbrosiaGeneration2);
            speed *= 1 + 0.01 * level / (1 + 0.01 * shopAmbrosiaGeneration3);
            speed *= 1 + 0.001 * level / (1 + 0.001 * shopAmbrosiaGeneration4);
            if (jack)
                speed *= 1 + 0.001 * (1 + 0.01 * totalVouchers) * level;
            return speed;
        }

        function shopQuarkEffect(level = 0): number {
            const base = 1 + 0.2 * Math.log2(1 + qHept / 500);
            let result = Math.pow(base, qHeptExp * 0.001 * level);
            const jackBonus = 0.001 * (1 + 0.01 * totalVouchers);
            result *= 1 + jackBonus * 0.1 * level / (1 + jackBonus * shopQuark);
            return result;
        }

        function rLuckValue(level = 0, luck = 0): number {
            let conversion = luckConversion;
            conversion += Math.floor(shopRedLuck1 / 20) * 0.01;
            conversion += Math.floor(shopRedLuck2 / 20) * 0.01;
            conversion += Math.floor(shopRedLuck3 / 20) * 0.01;

            const levels = [
                shopRedLuck1 > 0 ? shopRedLuck1 + level : 0,
                shopRedLuck2 > 0 ? shopRedLuck2 + level : 0,
                shopRedLuck3 > 0 ? shopRedLuck3 + level : 0,
            ];
            levels[2] += shopRedLuck3 > 0 ? level : 0;

            conversion = levels.reduce((result, value) => result - Math.floor(value / 20) * 0.01, conversion);
            conversion = Math.max(conversion, 1e-6);

            let result = redLuckBase + Math.floor(luck / conversion);
            if (shopRedLuck1 > 0)
                result += level * 0.05;
            if (shopRedLuck2 > 0)
                result += level * 0.075;
            if (shopRedLuck3 > 0)
                result += level * 0.2;
            if (jack)
                result += 0.05 * (1 + 0.01 * totalVouchers);
            return result;
        }

        function rLuckDelta(level = 0, luck = 0): number {
            return rLuckValue(level, luck) - rLuckValue(0, luck);
        }

        function talismanO(delta: Decimal): Decimal {
            const newbonusSI = runeSiBonusLevelsTotal.times(delta).dividedBy(baseTalismanPower);
            return new Decimal(1).plus(newbonusSI.div(originalSItotal));
        }

        function rcmO(level: number): Decimal {
            const newSI = new Decimal(Math.floor((runeMaxExp - 12) * (runeSiRC + level - bonus[2][0]))).plus(runeSiBonusLevelsTotal);
            return newSI.div(originalSItotal);
        }

        function arrayToText(loadout: number[]): string {
            const txts = loadout.map((value, index) => `"${module_name[index]}":${value.toString()}`);
            return `{${txts.join(",")}}`;
        }

        type HeaterPrerequisiteMap = Partial<Record<AmbrosiaUpgradeNames, Partial<Record<AmbrosiaUpgradeNames, number>>>>;
        const ambrosiaPrerequisiteCache: HeaterPrerequisiteMap = {};

        function getAmbrosiaPrerequisites(): HeaterPrerequisiteMap {
            if (Object.keys(ambrosiaPrerequisiteCache).length > 0) {
                return ambrosiaPrerequisiteCache;
            }

            const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>("HSGameDataAPI");
            if (!gameDataAPI) {
                return ambrosiaPrerequisiteCache;
            }

            const collection = gameDataAPI.ambrosia.R_ambrosiaUpgradeCalculationCollection;
            for (const upgradeKey of Object.keys(collection) as AmbrosiaUpgradeNames[]) {
                const prerequisites = collection[upgradeKey].prerequisites;
                if (prerequisites && Object.keys(prerequisites).length > 0) {
                    ambrosiaPrerequisiteCache[upgradeKey] = prerequisites;
                }
            }

            return ambrosiaPrerequisiteCache;
        }

        function enforceAmbrosiaPrerequisites(tree: number[]): void {
            const prerequisites = getAmbrosiaPrerequisites();
            if (Object.keys(prerequisites).length === 0) {
                return;
            }

            let changed = true;
            while (changed) {
                changed = false;

                for (let i = 0; i < module_name.length; i++) {
                    const upgradeKey = module_name[i] as AmbrosiaUpgradeNames;
                    const prereq = prerequisites[upgradeKey];
                    if (!prereq) {
                        continue;
                    }

                    const currentLevel = tree[i];
                    if (currentLevel <= 0) {
                        continue;
                    }

                    for (const [requiredUpgrade, requiredLevel] of Object.entries(prereq)) {
                        const reqIndex = module_name.indexOf(requiredUpgrade as AmbrosiaUpgradeNames);
                        if (reqIndex < 0) {
                            continue;
                        }
                        if (tree[reqIndex] < requiredLevel) {
                            tree[reqIndex] = requiredLevel;
                            changed = true;
                        }
                    }
                }
            }
        }

        const rcmcost: number[] = [0];
        function calculateRCMcost() {
            for (let i = 1; i <= 100; i++) {
                const delta = Math.ceil(2500 * (Math.pow(i, 1.5) - Math.pow(i - 1, 1.5)));
                rcmcost.push(rcmcost[i - 1] + delta);
            }
        }
        calculateRCMcost();

        function calculateCost(upgrade: number, level: number): number {
            switch (upgrade) {
                case 0:
                    return 10 * level;
                case 1:
                    return level;
                case 2:
                    switch (level) {
                        case 0:
                            return 0;
                        case 1:
                            return 50000;
                        case 2:
                            return 1300000;
                    }
                    break;
                case 3:
                    switch (level) {
                        case 0:
                            return 0;
                        case 1:
                            return 50000;
                        case 2:
                            return 1300000;
                    }
                    break;
                case 4:
                    switch (level) {
                        case 0:
                            return 0;
                        case 1:
                            return 33333;
                        case 2:
                            return 99999;
                        case 3:
                            return 199998;
                        case 4:
                            return 333330;
                        case 5:
                            return 499995;
                        case 6:
                            return 999990;
                        case 7:
                            return 2499975;
                        default:
                            return 1e9;
                    }
                case 5:
                case 6:
                case 7:
                    return Math.pow(level, 3);
                case 8:
                    return Math.pow(level, 3) * 500;
                case 9:
                    return Math.pow(level, 3) * 500;
                case 10:
                    return Math.pow(level, 3) * 250;
                case 11:
                    return Math.pow(level, 3) * 250;
                case 12:
                    return Math.pow(level, 3) * 100;
                case 13:
                    return Math.pow(level, 3) * 100;
                case 14:
                    return Math.pow(level, 2) * 500;
                case 15:
                    return Math.pow(level, 2) * 500;
                case 16:
                    return Math.pow(level, 2) * 250;
                case 17:
                    return level * (1450000 + 50000 * level) / 2;
                case 18:
                    return level * (145000 + 5000 * level) / 2;
                case 19:
                    return level * 50000;
                case 20:
                    return Math.pow(level, 3) * 40;
                case 21:
                    return Math.pow(level, 3) * 5;
                case 22:
                    return Math.pow(level, 3) * 160;
                case 23:
                    return Math.pow(level, 3) * 20;
                case 24:
                    return 100000 * (99 ** level - 1) / (99 - 1);
                case 25:
                    return level ** 2 * 12500000;
                case 26:
                    return level * 25000;
                case 27:
                    return level * 75000;
                case 28:
                    return (480000 + 20000 * level) * level / 2;
                case 29:
                    return 100 * level * level;
                case 30:
                    return rcmcost[level];
                case 31:
                    return 10 * Math.pow(level, 3);
                case 32:
                    return 5000 * Math.pow(level, 2);
                case 33:
                    return 45000 * (Math.pow(10, level) - 1) / 9;
                case 34:
                    return 20000 * Math.pow(level, 2);
                case 35:
                    return 25000 * Math.pow(level, 3);
                default:
                    return NaN;
            }
            return NaN;
        }

        function hyperfluxcost(level: number): number {
            return Math.min(level, 5) * (Math.min(level, 5) + 1) * 33333 / 2 +
                33333 * 15 * (Math.pow(3, Math.max(Math.min(level - 5, 2), 0)) - 1) / 2;
        }

        function calculateLoadoutCost(loadout: number[]): number {
            return loadout.reduce((cost, level, index) => cost + calculateCost(index, level), 0);
        }

        function calculateTrueEffect(upgrade: number, level: number, luck: number, altlevel = 0): [number, number, number, number, number, number] {
            switch (upgrade) {
                case 0:
                    return [0, 1 + 0.01 * level, 1 + 0.05 * level, 1 + 0.05 * level, 0, 1];
                case 1:
                    return [0, 1, 1, 1, 0, 1];
                case 2:
                    return [0, 1, 1, 1, 0, 1 + 0.001 * level * luck];
                case 3:
                    return [0, 1, 1, 1, 0, 1 + 0.001 * level * luck];
                case 4:
                    return [0, 1, Math.pow(1 + level * 0.01, plat4x4), 1, 0, 1];
                case 5:
                    return [0, 1 + 0.01 * level, 1, 1, 0, 1];
                case 6:
                    return [0, 1, (1 + level * 0.05) * Math.pow(1.1, Math.floor(level / 5)), (1 + level * 0.05) * Math.pow(1.1, Math.floor(level / 5)), 0, 1];
                case 7:
                    return [2 * level + 12 * Math.floor(level / 10), 1, 1, 1, 0, 1];
                case 8:
                    return [0, 1 + 0.0001 * level * cubesExpTotal, 1, 1, 0, 1];
                case 9:
                    return [0, 1 + 0.0001 * level * Math.min(luck, Math.pow(1000 * luck, 0.5)), 1, 1, 0, 1];
                case 10:
                    return [0, 1, 1 + 0.0005 * level * luck, 1 + 0.0005 * level * luck, 0, 1];
                case 11:
                    return [0, 1, 1 + 0.001 * level * quarksOwned, 1 + 0.001 * level * quarksOwned, 0, 1];
                case 12:
                    return [0.02 * level * cubesExpTotal, 1, 1, 1, 0, 1];
                case 13:
                    return [0.02 * level * quarksOwned, 1, 1, 1, 0, 1];
                case 14:
                    return [0, 1 + level * (0.01 + Math.floor(altlevel / 10) / 1000), 1, 1, 0, 1];
                case 15:
                    return [0, 1, (1 + level * (0.1 + 0.01 * Math.floor(altlevel / 10))) * Math.pow(1.15, Math.floor(level / 5)), (1 + level * (0.1 + 0.01 * Math.floor(altlevel / 10))) * Math.pow(1.15, Math.floor(level / 5)), 0, 1];
                case 16:
                    return [level * (3 + 0.3 * Math.floor(altlevel / 10)) + 40 * Math.floor(level / 10), 1, 1, 1, 0, 1];
                case 17:
                    return [0, 1 + 0.05 * level * (1 + 0.01 * altlevel), 1, 1, 0, 1];
                case 18:
                    return [0, 1, (1 + 0.2 * level * (1 + 0.03 * altlevel)) * Math.pow(1.2, Math.floor(level / 5)), (1 + 0.2 * level * (1 + 0.03 * altlevel)) * Math.pow(1.2, Math.floor(level / 5)), 0, 1];
                case 19:
                    return [level * blueberries, 1, 1, 1, 0, 1];
                case 20:
                    return [0, 1, 1, 1, level, 1];
                case 21:
                    return [0, 1, 1, 1, level, 1];
                case 22:
                    return [0, 1, 1, 1, level, 1];
                case 23:
                    return [0, 1, 1, 1, level, 1];
                case 24:
                    return [0, 1, singReductionEffect(reducedSingularity, level)[0], singReductionEffect(reducedSingularity, level)[0], 0, singReductionEffect(reducedSingularity, level)[1]];
                case 25:
                    return [0, 1, singReductionEffect(reducedSingularity, level)[0], singReductionEffect(reducedSingularity, level)[0], 0, singReductionEffect(reducedSingularity, level)[1]];
                case 26:
                    return [
                        0,
                        1,
                        Math.pow(1.012 * Math.pow(1.006, 1 + ascSpread * greater_than_1), level) *
                            Math.pow(reduced_asc * Math.pow(1.006, level), 0.001 * (Math.floor((totalVouchers + level) / 40) - Math.floor(totalVouchers / 40))),
                        Math.pow(1.012, level * 1.25) *
                            Math.pow(
                                Math.pow(1.006, level * (1 + ascSpread * greater_than_1)) * Math.pow(reduced_asc * Math.pow(1.006, level), 0.001 * (Math.floor((totalVouchers + level) / 40) - Math.floor(totalVouchers / 40))),
                                transcriptionEffect
                            ),
                        0,
                        Math.pow(1.012, level) * Math.pow(1.06, Math.floor((totalVouchers + level) / 25) - Math.floor(totalVouchers / 25)),
                    ];
                case 27:
                    return [
                        0,
                        1,
                        Math.pow(1.012 * Math.pow(1.006, 1 + ascSpread * greater_than_1), level) *
                            Math.pow(reduced_asc * Math.pow(1.006, level), 0.001 * (Math.floor((totalVouchers + level + altlevel) / 40) - Math.floor((totalVouchers + altlevel) / 40))),
                        Math.pow(1.012, level * 1.25) *
                            Math.pow(
                                Math.pow(1.006, level * (1 + ascSpread * greater_than_1)) * Math.pow(reduced_asc * Math.pow(1.006, level), 0.001 * (Math.floor((totalVouchers + level + altlevel) / 40) - Math.floor((totalVouchers + altlevel) / 40))),
                                transcriptionEffect
                            ),
                        0,
                        Math.pow(1.012, level) * Math.pow(1.06, Math.floor((totalVouchers + level + altlevel) / 25) - Math.floor((totalVouchers + altlevel) / 25)),
                    ];
                case 28:
                    return [0.0001 * l4_digits * level, 1, 1, 1, 0, 1];
                case 29: {
                    const [qchange, cchange] = changeinIA(1, new Decimal(0.005).times(level));
                    const qchangeNumber = qchange.toNumber();
                    const cchangeNumber = cchange.toNumber();
                    return [0, qchangeNumber, cchangeNumber, 1, 0, talismanO(new Decimal(0.005).times(level)).toNumber()];
                }
                case 30: {
                    const [qchange, cchange] = changeinIA(2, new Decimal(0.001).times(level));
                    const qchangeNumber = qchange.toNumber();
                    const cchangeNumber = cchange.toNumber();
                    return [0, qchangeNumber, cchangeNumber, 1, 0, rcmO(level).toNumber()];
                }
                case 31:
                    return [level / 50, 1, 1 - 0.02 * level, 1 - 0.02 * level, 0, 1];
                case 32:
                    return [shopLuck * level, 1, 1, 1, 0, 1];
                case 33:
                    return [0, 1, 1, ambGeneration(level), 0, 1];
                case 34:
                    return [rLuckDelta(level, luck), 1, 1, 1, 0, 1];
                case 35: {
                    const quarkMult = shopQuarkEffect(level);
                    const cubeMult = quarkMult * (1.5 + 0.5 * (1 - Math.pow(0.9, shopQuark + 0.1 * level - 1)));
                    return [0, quarkMult, cubeMult, cubeMult, 0, 1];
                }
                default:
                    return [0, 1, 1, 1, 0, 1];
            }
        }

        function calculateEffect(upgrade: number, level: number, luck = 0, altlevel = 0): [number, number, number, number, number, number] {
            let transfer_level = level;
            if (bonus_level[upgrade] !== -1) {
                transfer_level += bonus[bonus_level[upgrade]][0];
            }
            return calculateTrueEffect(upgrade, transfer_level, luck, altlevel);
        }

        let luck_zero = 0;

        /**
         * Calculate full heater loadout effect.
         * @param loadout current upgrade levels
         * @param calibrationLuckZero optional override used only during initial baseline calibration
         */
        function calculateLoadoutEffect(loadout: number[], calibrationLuckZero?: number): [number, number, number, number, number, number, number, number] {
            const appliedLuckZero = calibrationLuckZero ?? luck_zero;
            let e_luck = baseluck - appliedLuckZero;
            let m_luck = multluck;
            const levels = [...loadout];
            for (let i = 0; i < levels.length; i++) {
                const [a] = calculateEffect(i, levels[i], baseluck, levels[alt_level_list[i]]);
                e_luck += a * Number(i !== 28);
                m_luck += a * Number(i === 28);
            }
            e_luck *= 1 + m_luck;
            let e_quark = 1;
            let e_cube = 1;
            let e_oct = 1;
            let a_obt = 0;
            let a_off = 0;
            let m_obt = 1;
            let m_off = 1;
            for (let i = 0; i < levels.length; i++) {
                const [a, b, c, d, e, f] = calculateEffect(i, levels[i], e_luck, levels[alt_level_list[i]]);
                e_quark *= b;
                e_cube *= c;
                e_oct *= d;
                if (obtofoff[i] % 2 === 1) {
                    a_obt += e;
                    m_obt *= f;
                }
                if (obtofoff[i] > 1) {
                    a_off += e;
                    m_off *= f;
                }
            }
            return [e_luck, e_quark, e_cube, e_oct, a_obt, a_off, m_obt, m_off];
        }

        // Calibrate luck_zero from the true base tree baseline, matching the ggsheet logic.
        luck_zero = calculateLoadoutEffect(true_base_tree, 0)[0] / (1 + multluck + calculateEffect(28, 0)[0]) - baseluck;

        function Matrix_assembly(full_matrix: any[]): any[] {
            full_matrix.sort((x, y) => ((x[1] === y[1]) ? (y[2] - x[2]) : (x[1] - y[1])));
            const matrix: any[] = [full_matrix[0]];
            let lst = 0;
            for (let i = 1; i < full_matrix.length; i++) {
                if (full_matrix[i][2] > full_matrix[lst][2]) {
                    lst = i;
                    matrix.push(full_matrix[i]);
                }
            }
            return matrix;
        }

        function L_I_matrix_generator(): Array<[number[], number, number]> {
            const full_matrix: Array<[number[], number, number]> = [];
            for (let x = 0; x <= 100; x++) {
                for (let t = 0; t <= 100 * Number(x >= 40); t++) {
                    for (let j = 0; j <= 100 * Number(x >= 90) * Number(t >= 50); j++) {
                        const cost = calculateCost(7, x) + calculateCost(16, t) + calculateCost(19, j);
                        const effect = Math.round((calculateEffect(7, x)[0] + calculateEffect(16, t, 0, x)[0] + calculateEffect(19, j, 0, x)[0]) * 100) / 100;
                        full_matrix.push([[x, t, j], cost, effect]);
                    }
                }
            }
            return Matrix_assembly(full_matrix);
        }

        function L_I_1_matrix_generator(matrix_L_I_0: any[]): any[] {
            const full_matrix: any[] = [];
            for (let i = 0; i < matrix_L_I_0.length; i++) {
                for (let j = 0; j <= 50; j++) {
                    const cost = matrix_L_I_0[i][1] + calculateCost(28, j);
                    const bluck = matrix_L_I_0[i][2];
                    const mluck = calculateEffect(28, j)[0];
                    const effect = (baseluck + bluck - luck_zero) * (1 + multluck + mluck);
                    const copy = [...matrix_L_I_0[i][0]];
                    copy.push(j);
                    full_matrix.push([copy, cost, effect, bluck, mluck]);
                }
            }
            return Matrix_assembly(full_matrix);
        }

        function L_D_matrix_generator(cubeValue: number, quarkValue: number, type = 0): any[] {
            let cube_pre = 1;
            let quark_pre = 1;
            if (type % 2 === 1) {
                quark_pre = 0;
            }
            if (type > 1) {
                cube_pre = 0;
            }
            const full_matrix: any[] = [];
            for (let y = 0; y <= 25; y++) {
                for (let z = 0; z <= 25; z++) {
                    const cost = 100 * y ** 3 + 100 * z ** 3 + 8000 * Number(y > 0) * cube_pre + 8000 * Number(z > 0) * quark_pre;
                    const effect = 0.02 * (y + bonus[1][0]) * cubeValue + 0.02 * (z + bonus[1][0]) * quarkValue;
                    full_matrix.push([[y, z], cost, effect]);
                }
            }
            return Matrix_assembly(full_matrix);
        }

        function L_matrix_generator(matrix_L_I: any[], matrix_L_D_0: any[]): any[] {
            const full_matrix: any[] = [];
            for (let i = 0; i < matrix_L_I.length; i++) {
                for (let j = 0; j <= (matrix_L_D_0.length - 1) * Number(matrix_L_I[i][0][0] >= 30); j++) {
                    const cost = matrix_L_I[i][1] + matrix_L_D_0[j][1];
                    const bluck = matrix_L_I[i][3] + matrix_L_D_0[j][2];
                    const mluck = matrix_L_I[i][4];
                    const effect = (baseluck + bluck - luck_zero) * (1 + multluck + mluck);
                    full_matrix.push([matrix_L_I[i][0].concat(matrix_L_D_0[j][0]), cost, effect, bluck, mluck]);
                }
            }
            return Matrix_assembly(full_matrix);
        }

        function Luck_batch(matrix_L_0: any[], tree: number[], ambTotal: number): any[] {
            const cost = calculateLoadoutCost(tree);
            let pointer = 0;
            let vector: any[] = [];
            for (let i = 0; i < matrix_L_0.length; i++) {
                if (ambTotal - cost < matrix_L_0[i][1]) {
                    break;
                }
                vector = matrix_L_0[i][0];
                pointer = i;
            }
            const max = pointer === matrix_L_0.length - 1;
            tree[5] = Number(vector[5] > 0) * 20;
            tree[6] = Number(vector[4] > 0) * 20;
            tree[7] = vector[0];
            tree[12] = vector[4];
            tree[13] = vector[5];
            tree[16] = vector[1];
            tree[19] = vector[2];
            tree[28] = vector[3];
            enforceAmbrosiaPrerequisites(tree);
            const effect = calculateLoadoutEffect(tree);
            const batch: any[] = [tree, calculateLoadoutCost(tree), effect[0], effect[1], effect[2], effect[3], max];
            batch[0] = arrayToText(batch[0] as number[]);
            return batch;
        }

        function Q_I_matrix_generator(): any[] {
            const full_matrix: any[] = [];
            for (let x = 0; x <= 100; x++) {
                for (let t = 0; t <= 100 * Number(x >= 40); t++) {
                    const cost = calculateCost(5, x) + calculateCost(14, t);
                    const effect = (1 + 0.01 * (x + bonus[0][0])) * (1 + (t + bonus[2][0]) * (0.01 + Math.floor((x + bonus[0][0]) / 10) / 1000));
                    full_matrix.push([[x, t], cost, effect]);
                }
            }
            return Matrix_assembly(full_matrix);
        }

        function Q_I_1_matrix_generator(): any[] {
            const matrix_1 = Q_I_matrix_generator();
            const full_matrix: any[] = [];
            for (let i = 0; i < matrix_1.length; i++) {
                for (let j = 0; j <= 10 * Number(matrix_1[i][0][0] >= 100) * Number(matrix_1[i][0][1] >= 50); j++) {
                    const cost = matrix_1[i][1] + j * (1450000 + 50000 * j) / 2;
                    const effect = matrix_1[i][2] * (1 + 0.05 * (j + bonus[3][0]) * (1 + 0.01 * (matrix_1[i][0][1] + bonus[2][0])));
                    const copy = [...matrix_1[i][0]];
                    copy.push(j);
                    full_matrix.push([copy, cost, effect]);
                }
            }
            return Matrix_assembly(full_matrix);
        }

        function Q_P_matrix_generator(matrix_Q_I_1: any[]): any[] {
            const full_matrix: any[] = [];
            for (let i = 0; i < matrix_Q_I_1.length; i++) {
                for (let c = 0; c <= 25 * Number(matrix_Q_I_1[i][0][0] >= 30); c++) {
                    const cost = matrix_Q_I_1[i][1] + 500 * c ** 3 + 8000 * Number(c > 0);
                    const effect = matrix_Q_I_1[i][2] * calculateEffect(8, c, 0, 0)[1];
                    const copy = [...matrix_Q_I_1[i][0]];
                    copy.push(c);
                    full_matrix.push([copy, cost, effect]);
                }
            }
            return Matrix_assembly(full_matrix);
        }

        function Rune_IA_matrix_generator(): Array<[number[], number, number]> {
            const full_matrix: Array<[number[], number, number]> = [];
            for (let i = 0; i <= 100; i++) {
                for (let j = 0; j <= 100; j++) {
                    const cost = calculateCost(29, i) + calculateCost(30, j);
                    const effect = deltaIA(1, new Decimal(0.005).times(i)).plus(deltaIA(2, new Decimal(0.001).times(j + bonus[2][0]))).toNumber();
                    full_matrix.push([[i, j], cost, effect]);
                }
            }
            return Matrix_assembly(full_matrix);
        }

        function Q_R_matrix_generator(matrix_Q_P: any[], matrix_RuneIA: any[]): any[] {
            const full_matrix: any[] = [];
            for (let i = 0; i < matrix_Q_P.length; i++) {
                for (let j = 0; j < matrix_RuneIA.length; j++) {
                    const cost = matrix_Q_P[i][1] + matrix_RuneIA[j][1];
                    const effect = matrix_Q_P[i][2] * (1 + matrix_RuneIA[j][2] / (500 + originalIAtotalNumber));
                    full_matrix.push([matrix_Q_P[i][0].concat(matrix_RuneIA[j][0]), cost, effect]);
                }
            }
            return Matrix_assembly(full_matrix);
        }

        function Q_tree_generator(matrix_Q_P: any[], ambTotal: number, matrix_L: any[], matrix_L_backup: any[] = []): any[] | undefined {
            const full_matrix: any[] = [];
            function Luck_to_effect(luck_value: number): number {
                return luck_value <= 1000 ? luck_value : Math.pow(1000 * luck_value, 0.5);
            }
            const luck_0 = matrix_L[0][2];
            for (let i = 0; i < matrix_Q_P.length; i++) {
                let cost = matrix_Q_P[i][1];
                if (cost > ambTotal) {
                    break;
                }
                for (let j = 0; j <= 25 * Number(matrix_Q_P[i][0][0] >= 30); j++) {
                    cost = matrix_Q_P[i][1] + 500 * j ** 3;
                    let effect = matrix_Q_P[i][2];
                    let pointer = 0;
                    if (cost > ambTotal) {
                        break;
                    }
                    if ((j + bonus[2][0]) > 0) {
                        pointer = matrix_L.length - 1;
                        for (let k = 0; k <= pointer; k++) {
                            if (matrix_L[k][1] > ambTotal - cost) {
                                pointer = k - 1;
                                cost += matrix_L[pointer][1];
                                effect *= calculateEffect(9, j, matrix_L[pointer][2], 0)[1];
                                break;
                            }
                        }
                        if (pointer === matrix_L.length - 1) {
                            cost += matrix_L[pointer][1];
                            effect *= calculateEffect(9, j, matrix_L[pointer][2], 0)[1];
                        }
                        if (pointer === 0 && j > 0) {
                            j = 0;
                            cost = matrix_Q_P[i][1];
                            effect = matrix_Q_P[i][2];
                            const copy = [...matrix_Q_P[i][0]];
                            copy.push(j);
                            full_matrix.push([copy.concat(matrix_L[0][0]), cost, effect]);
                            break;
                        }
                    }
                    if (cost <= ambTotal) {
                        const copy = [...matrix_Q_P[i][0]];
                        copy.push(j);
                        full_matrix.push([copy.concat(matrix_L[pointer][0]), cost, effect, i]);
                    }
                }
            }
            let bestRow: any[] | undefined;
            let bestEffect = 1;
            let bestCost = 0;
            for (let i = 0; i < full_matrix.length; i++) {
                if (full_matrix[i][2] > bestEffect || (full_matrix[i][2] === bestEffect && full_matrix[i][1] < bestCost)) {
                    bestCost = full_matrix[i][1];
                    bestEffect = full_matrix[i][2];
                    bestRow = full_matrix[i];
                }
            }
            return bestRow?.[0];
        }

        function Quark_batch(matrix_Q_R: any[], matrix_L: any[], tree: number[], ambTotal: number): any[] {
            const cost = calculateLoadoutCost(tree);
            const vector = Q_tree_generator(matrix_Q_R, ambTotal - cost, matrix_L);
            if (!vector) {
                return ["Unaffordable", 0, NaN, 0, NaN, NaN, false];
            }
            const copy = [...tree];
            copy[5] = vector[0];
            copy[6] = Number(vector[6] > 0) * 20;
            copy[7] = vector[7];
            copy[8] = vector[3];
            copy[9] = vector[6];
            copy[12] = vector[11];
            copy[13] = vector[12];
            copy[14] = vector[1];
            copy[16] = vector[8];
            copy[17] = vector[2];
            copy[19] = vector[9];
            copy[28] = vector[10];
            copy[29] = vector[4];
            copy[30] = vector[5];
            enforceAmbrosiaPrerequisites(copy);
            const max =
                copy[5] === 100 &&
                copy[6] === 20 &&
                copy[7] === 100 &&
                copy[8] === 25 &&
                copy[9] === 25 &&
                copy[12] === 25 &&
                copy[13] === 25 &&
                copy[14] === 100 &&
                copy[16] === 100 &&
                copy[17] === 10 &&
                copy[19] === 100 &&
                copy[28] === 50 &&
                copy[29] === 100 &&
                copy[30] === 100;
            const effect = calculateLoadoutEffect(copy);
            const batch: any[] = [copy, calculateLoadoutCost(copy), effect[0], effect[1], effect[2], effect[3], max];
            batch[0] = arrayToText(batch[0] as number[]);
            return batch;
        }

        function C_I_matrix_generator(): Array<[number[], number, number]> {
            const full_matrix: Array<[number[], number, number]> = [];
            for (let a = 0; a <= 100; a++) {
                for (let d = 0; d <= 100 * Number(a >= 40); d++) {
                    const cost = calculateCost(6, a) + calculateCost(15, d);
                    const effect = (1 + (a + bonus[0][0]) * 0.05) * Math.pow(1.1, Math.floor((a + bonus[0][0]) / 5))
                        * (1 + (d + bonus[2][0]) * (0.1 + 0.01 * Math.floor((a + bonus[0][0]) / 10)))
                        * Math.pow(1.15, Math.floor((d + bonus[2][0]) / 5));
                    full_matrix.push([[a, d], cost, effect]);
                }
            }
            return Matrix_assembly(full_matrix);
        }

        function C_I_1_matrix_generator(matrix_C_I: Array<[number[], number, number]>): Array<[number[], number, number]> {
            const full_matrix: Array<[number[], number, number]> = [];
            for (let i = 0; i < matrix_C_I.length; i++) {
                for (let j = 0; j <= 100 * Number(matrix_C_I[i][0][0] >= 100) * Number(matrix_C_I[i][0][1] >= 50); j++) {
                    const cost = matrix_C_I[i][1] + calculateCost(18, j);
                    const effect = matrix_C_I[i][2]
                        * (1 + 0.2 * (j + bonus[3][0]) * (1 + 0.03 * (matrix_C_I[i][0][1] + bonus[2][0])))
                        * Math.pow(1.2, Math.floor((j + bonus[3][0]) / 5));
                    const copy = [...matrix_C_I[i][0]];
                    copy.push(j);
                    full_matrix.push([copy, cost, effect]);
                }
            }
            return Matrix_assembly(full_matrix);
        }

        function C_Inf_matrix_generator(type = 0): Array<[number[], number, number]> {
            const full_matrix: Array<[number[], number, number]> = [[[0, 0], 0, 1]];
            for (let i = 1; i <= 20; i++) {
                const cost = 80000 + i * 25000;
                const effect = type === 0
                    ? calculateEffect(26, i, 0, 0)[2]
                    : calculateEffect(26, i, 0, 0)[3];
                full_matrix.push([[i, 0], cost, effect]);
            }
            for (let i = 1; i <= 20; i++) {
                const cost = 1090000 + i * 75000;
                const effect = type === 0
                    ? calculateEffect(26, 25, 0, 0)[2] * calculateEffect(27, i, 0, 25)[2]
                    : calculateEffect(26, 25, 0, 0)[3] * calculateEffect(27, i, 0, 25)[3];
                full_matrix.push([[20, i], cost, effect]);
            }
            return full_matrix;
        }

        function C_Inf_1_matrix_generator(type = 0): Array<[number[], number, number]> {
            const matrix_1 = C_I_1_matrix_generator(C_I_matrix_generator());
            const matrix_2 = C_Inf_matrix_generator(type);
            const full_matrix: Array<[number[], number, number]> = [];
            for (let i = 0; i < matrix_1.length; i++) {
                for (let j = 0; j <= (matrix_1[i][0][0] >= 70 ? 20 : 0) + (matrix_1[i][0][1] >= 50 ? 20 : 0); j++) {
                    const cost = matrix_1[i][1] + matrix_2[j][1];
                    const effect = matrix_1[i][2] * matrix_2[j][2];
                    full_matrix.push([matrix_1[i][0].concat(matrix_2[j][0]), cost, effect]);
                }
            }
            return Matrix_assembly(full_matrix);
        }

        function C_P_matrix_generator(matrix_C_I_1: Array<[number[], number, number]>, prereq = 1): Array<[number[], number, number]> {
            const full_matrix: Array<[number[], number, number]> = [];
            for (let i = 0; i < matrix_C_I_1.length; i++) {
                for (let c = 0; c <= 25 * Number(matrix_C_I_1[i][0][0] >= 30); c++) {
                    const cost = matrix_C_I_1[i][1] + 250 * c ** 3 + 8000 * Number(c > 0) * prereq - 8000 * Number(prereq === 0);
                    const effect = matrix_C_I_1[i][2] * (1 + 0.001 * (c + bonus[2][0]) * quarksOwned);
                    const copy = [...matrix_C_I_1[i][0]];
                    copy.push(c);
                    full_matrix.push([copy, cost, effect]);
                }
            }
            return Matrix_assembly(full_matrix);
        }

        function O_R_matrix_generator(matrix_C_P: Array<[number[], number, number]>): Array<[number[], number, number]> {
            const full_matrix: Array<[number[], number, number]> = [];
            for (let i = 0; i < matrix_C_P.length; i++) {
                full_matrix.push([matrix_C_P[i][0].concat([0, 0]), matrix_C_P[i][1], matrix_C_P[i][2]]);
            }
            return full_matrix;
        }

        function C_R_matrix_generator(matrix_C_P: Array<[number[], number, number]>, matrix_C_R: Array<[number[], number, number]>): Array<[number[], number, number]> {
            const full_matrix: Array<[number[], number, number]> = [];
            for (let i = 0; i < matrix_C_P.length; i++) {
                for (let j = 0; j < matrix_C_R.length; j++) {
                    const cost = matrix_C_P[i][1] + matrix_C_R[j][1];
                    const effect = matrix_C_P[i][2] * (1 + matrix_C_R[j][2] / (100 + originalIAtotalNumber));
                    full_matrix.push([matrix_C_P[i][0].concat(matrix_C_R[j][0]), cost, effect]);
                }
            }
            return Matrix_assembly(full_matrix);
        }

        function C_H_matrix_generator(matrix_C_P: Array<[number[], number, number]>, force_h = -1, type = 1): Array<[number[], number, number]> {
            const full_matrix: Array<[number[], number, number]> = [];
            let hs = Array.from({ length: 8 }, (_, i) => i);
            if (force_h !== -1) {
                hs = [force_h];
            }
            if (force_tree[24] !== 0) {
                hs = hs.filter((e) => e >= 4);
            }
            for (let i = 0; i < matrix_C_P.length; i++) {
                for (let h = 0; h < hs.length; h++) {
                    const maxS = (((exalt === 0 ? Number(hs[h] >= 4) : 0) + (exalt === 1 ? 1 : 0)) * 2) * Number(type === 0);
                    for (let s = (0 + force_tree[24] * Number(!exalt) + force_tree[25] * Number(exalt)); s <= maxS; s++) {
                        const cost = matrix_C_P[i][1] + calculateCost(4, hs[h]) + calculateCost(24 + (exalt === 1 ? 1 : 0), s);
                        const effect = matrix_C_P[i][2] * Math.pow(1 + hs[h] * 0.01, plat4x4) * singReductionEffect(reducedSingularity, s)[0];
                        full_matrix.push([matrix_C_P[i][0].concat([hs[h], s * Number(exalt === 0), s * Number(exalt === 1)]), cost, effect]);
                    }
                }
            }
            return Matrix_assembly(full_matrix);
        }

        function C_tree_generator(matrix_C: Array<[number[], number, number]>, matrix_L: Array<[number[], number, number]>, amb_total: number, matrix_L_backup: Array<[number[], number, number]> = []): number[] | undefined {
            const full_matrix: Array<[number[], number, number]> = [];
            for (let i = 0; i < matrix_C.length; i++) {
                let cost = matrix_C[i][1];
                if (cost > amb_total) {
                    break;
                }
                for (let j = 0; j <= 25 * Number(matrix_C[i][0][0] >= 30); j++) {
                    cost = matrix_C[i][1] + 250 * j ** 3;
                    let effect = matrix_C[i][2];
                    let pointer = 0;
                    if (cost > amb_total) {
                        break;
                    }
                    if (matrix_L.length === 1) {
                        cost += matrix_L[0][1];
                        effect *= calculateEffect(10, j, matrix_L[pointer][2], 0)[2];
                    } else if ((j + bonus[2][0]) > 0) {
                        pointer = matrix_L.length - 1;
                        for (let k = 0; k <= pointer; k++) {
                            if (matrix_L[k][1] > amb_total - cost) {
                                pointer = k - 1;
                                cost += matrix_L[pointer][1];
                                effect *= calculateEffect(10, j, matrix_L[pointer][2], 0)[2];
                                break;
                            }
                        }
                        if (pointer === matrix_L.length - 1 && matrix_L.length !== 1) {
                            cost += matrix_L[pointer][1];
                            effect *= calculateEffect(10, j, matrix_L[pointer][2], 0)[2];
                        }
                        if (pointer === 0 && j > 0) {
                            j = 0;
                            cost = matrix_C[i][1];
                            effect = matrix_C[i][2];
                            const copy = [...matrix_C[i][0]];
                            copy.push(j);
                            full_matrix.push([copy.concat(matrix_L[0][0]), cost, effect]);
                            break;
                        }
                    }
                    if (cost <= amb_total) {
                        const copy = [...matrix_C[i][0]];
                        copy.push(j);
                        full_matrix.push([copy.concat(matrix_L[pointer][0]), cost, effect]);
                    }
                }
            }
            let bestRow: [number[], number, number] | undefined;
            let bestEffect = 1;
            let bestCost = 0;
            for (let i = 0; i < full_matrix.length; i++) {
                if (full_matrix[i][2] > bestEffect || (full_matrix[i][2] === bestEffect && full_matrix[i][1] < bestCost)) {
                    bestCost = full_matrix[i][1];
                    bestEffect = full_matrix[i][2];
                    bestRow = full_matrix[i];
                }
            }
            return bestRow?.[0];
        }

        function Cube_batch(matrix_C_H: Array<[number[], number, number]>, matrix_L: Array<[number[], number, number]>, tree: number[], amb_total: number): [string, number, number, number, number, number, boolean] {
            const max_h = matrix_C_H[matrix_C_H.length - 1][0][8];
            const hasnt_talisman = matrix_C_H[matrix_C_H.length - 1][0][6] === 0;
            const cost = calculateLoadoutCost(tree);
            const vector = C_tree_generator(matrix_C_H, matrix_L, amb_total - cost, []);
            if (!vector) {
                return ["Unaffordable", 0, NaN, 0, NaN, NaN, false];
            }
            tree[4] = vector[8];
            tree[5] = vector[5] > 0 ? 20 : 0;
            tree[6] = vector[0];
            tree[7] = vector[12];
            tree[10] = vector[11];
            tree[11] = vector[5];
            tree[12] = vector[16];
            tree[13] = vector[17];
            tree[15] = vector[1];
            tree[16] = vector[13];
            tree[18] = vector[2];
            tree[19] = vector[14];
            tree[20] = (vector[3] > 0 ? 10 : 0) + (vector[4] > 0 ? 5 : 0);
            tree[21] = (vector[3] > 0 ? 20 : 0) + (vector[4] > 0 ? 10 : 0);
            tree[22] = vector[4] > 0 ? 10 : 0;
            tree[23] = vector[4] > 0 ? 20 : 0;
            tree[24] = vector[9];
            tree[25] = vector[10];
            tree[26] = vector[3];
            tree[27] = vector[4];
            tree[28] = vector[15];
            tree[29] = vector[6];
            tree[30] = vector[7];
            enforceAmbrosiaPrerequisites(tree);
            const max =
                tree[4] >= max_h &&
                tree[6] === 100 &&
                tree[7] === 100 &&
                tree[10] === 25 &&
                tree[11] === 25 &&
                tree[12] === 25 &&
                tree[13] === 25 &&
                tree[15] === 100 &&
                tree[16] === 100 &&
                tree[18] === 100 &&
                tree[19] === 100 &&
                tree[26] === 20 &&
                tree[27] === 20 &&
                tree[28] === 50 &&
                (hasnt_talisman || (tree[29] === 100 && tree[30] === 100));
            const effect = calculateLoadoutEffect(tree);
            const batch: [string, number, number, number, number, number, boolean] = [
                arrayToText(tree),
                calculateLoadoutCost(tree),
                effect[0],
                effect[1],
                effect[2],
                effect[3],
                max,
            ];
            return batch;
        }

        function Base_Obt_matrix_generator(): Array<[number[], number, number, number]> {
            const full_matrix: Array<[number[], number, number, number]> = [];
            for (let a = 0; a <= 20; a++) {
                for (let b = 0; b <= 30 * Number(a >= 15); b++) {
                    for (let c = 0; c <= 20 * Number(a >= 10) + 20 * Number(b >= 10); c++) {
                        const t1 = Math.min(20, c);
                        const t2 = Math.max(0, c - 20);
                        const base_module_cost = calculateCost(20, a) + calculateCost(22, b) + calculateCost(26, t1) + calculateCost(27, t2);
                        const basic_alt_cost = calculateCost(21, Math.max(20 * Number(b > 0), 20 * Number(t1 > 0), 30 * Number(t2 > 0))) + calculateCost(23, 20 * Number(t2 > 0));
                        const cube_cost = calculateCost(6, 70 * Number(t1 > 0)) + calculateCost(15, 50 * Number(t2 > 0));
                        const cost = base_module_cost + basic_alt_cost + cube_cost;
                        const base_increase = a + b;
                        const base_effect = 1 + base_increase / baseObt;
                        const mult_effect = calculateEffect(26, c, 0, 0)[5];
                        const effect = base_effect * mult_effect;
                        full_matrix.push([[a, b, t1, t2], cost, effect, base_increase]);
                    }
                }
            }
            return Matrix_assembly(full_matrix) as Array<[number[], number, number, number]>;
        }

        function Base_Off_matrix_generator(): Array<[number[], number, number, number]> {
            const full_matrix: Array<[number[], number, number, number]> = [];
            for (let a = 0; a <= 40; a++) {
                for (let b = 0; b <= 60 * Number(a >= 30); b++) {
                    for (let c = 0; c <= 20 * Number(a >= 20) + 20 * Number(b >= 20); c++) {
                        const t1 = Math.min(20, c);
                        const t2 = Math.max(0, c - 20);
                        const base_module_cost = calculateCost(21, a) + calculateCost(23, b) + calculateCost(26, t1) + calculateCost(27, t2);
                        const basic_alt_cost = calculateCost(20, Math.max(10 * Number(b > 0), 10 * Number(t1 > 0), 15 * Number(t2 > 0))) + calculateCost(22, 10 * Number(t2 > 0));
                        const cube_cost = calculateCost(6, 70 * Number(t1 > 0)) + calculateCost(15, 50 * Number(t2 > 0));
                        const cost = base_module_cost + basic_alt_cost + cube_cost;
                        const base_increase = a + b;
                        const base_effect = 1 + base_increase / baseOff;
                        const mult_effect = calculateEffect(26, c, 0, 0)[5];
                        const effect = base_effect * mult_effect;
                        full_matrix.push([[a, b, t1, t2], cost, effect, base_increase]);
                    }
                }
            }
            return Matrix_assembly(full_matrix) as Array<[number[], number, number, number]>;
        }

        function Rune_SI_matrix_generator(): Array<[number[], number, number]> {
            const full_matrix: Array<[number[], number, number]> = [];
            for (let i = 0; i <= 100; i++) {
                for (let j = 0; j <= 100; j++) {
                    const cost = calculateCost(29, i) + calculateCost(30, j);
                    const effect = calculateEffect(29, i, 0, 0)[5] * calculateEffect(30, j, 0, 0)[5];
                    full_matrix.push([[i, j], cost, effect]);
                }
            }
            return Matrix_assembly(full_matrix);
        }

        function Obt_I_generator(type = 0): Array<[number[], number, number, number]> {
            const matrix_1 = type === 0 ? Base_Obt_matrix_generator() : Base_Off_matrix_generator();
            const matrix_2 = Rune_SI_matrix_generator();
            const full_matrix: Array<[number[], number, number, number]> = [];
            for (let i = 0; i < matrix_1.length; i++) {
                for (let j = 0; j < matrix_2.length; j++) {
                    const cost = matrix_1[i][1] + matrix_2[j][1];
                    const effect = matrix_1[i][2] * matrix_2[j][2];
                    const base_increase = matrix_1[i][3];
                    full_matrix.push([matrix_1[i][0].concat(matrix_2[j][0]), cost, effect, base_increase]);
                }
            }
            return Matrix_assembly(full_matrix) as Array<[number[], number, number, number]>;
        }

        function Obt_SR_matrix_generator(matrix_Obt: Array<[number[], number, number, number]>, type = 1): Array<[number[], number, number, number]> {
            const full_matrix: Array<[number[], number, number, number]> = [];
            for (let i = 0; i < matrix_Obt.length; i++) {
                for (let s = 0; s <= 2 * Number(type === 0); s++) {
                    const cost = matrix_Obt[i][1] + calculateCost(4, 4 * Number(exalt === 0) * Number(s > 0)) + calculateCost(24 + (exalt === 1 ? 1 : 0), s);
                    const effect = matrix_Obt[i][2] * singReductionEffect(reducedSingularity, s)[1];
                    full_matrix.push([matrix_Obt[i][0].concat([s * Number(exalt === 0), s * Number(exalt === 1)]), cost, effect, matrix_Obt[i][3]]);
                }
            }
            return Matrix_assembly(full_matrix) as Array<[number[], number, number, number]>;
        }

        function O_tree_generator(matrix_O: any[], matrix_L: any[], amb_total: number): any[] | undefined {
            const full_matrix: any[] = [];
            for (let i = 0; i < matrix_O.length; i++) {
                let cost = matrix_O[i][1];
                if (cost > amb_total) {
                    break;
                }
                for (let j = 0; j <= 2; j++) {
                    cost = matrix_O[i][1] + calculateCost(2, j);
                    let effect = matrix_O[i][2];
                    let pointer = 0;
                    if (cost > amb_total) {
                        break;
                    }
                    if (matrix_L.length === 1) {
                        cost += matrix_L[0][1];
                        effect *= calculateEffect(2, j, matrix_L[pointer][2], 0)[5];
                    } else if (j > 0) {
                        pointer = matrix_L.length - 1;
                        for (let k = 0; k <= pointer; k++) {
                            if (matrix_L[k][1] > amb_total - cost) {
                                pointer = k - 1;
                                cost += matrix_L[pointer][1];
                                effect *= calculateEffect(2, j, matrix_L[pointer][2], 0)[5];
                                break;
                            }
                        }
                        if (pointer === matrix_L.length - 1 && matrix_L.length !== 1) {
                            cost += matrix_L[pointer][1];
                            effect *= calculateEffect(2, j, matrix_L[pointer][2], 0)[5];
                        }
                        if (pointer === 0 && j > 0) {
                            j = 0;
                            cost = matrix_O[i][1];
                            effect = matrix_O[i][2];
                            const copy = [...matrix_O[i][0]];
                            copy.push(j);
                            full_matrix.push([copy.concat(matrix_L[0][0]), cost, effect, matrix_O[i][3]]);
                            break;
                        }
                    }
                    if (cost <= amb_total) {
                        const copy = [...matrix_O[i][0]];
                        copy.push(j);
                        full_matrix.push([copy.concat(matrix_L[pointer][0]), cost, effect, matrix_O[i][3]]);
                    }
                }
            }
            let bestRow: any[] | undefined;
            let effect = 1;
            let cost = 0;
            for (let i = 0; i < full_matrix.length; i++) {
                if (full_matrix[i][2] > effect || (full_matrix[i][2] === effect && full_matrix[i][1] < cost)) {
                    cost = full_matrix[i][1];
                    effect = full_matrix[i][2];
                    bestRow = full_matrix[i];
                }
            }
            return bestRow;
        }

        function O_batch(matrix_O: any[], matrix_L: any[], tree: number[], amb_total: number, type = 0): any[] {
            const cost = calculateLoadoutCost(tree);
            const output = O_tree_generator(matrix_O, matrix_L, amb_total - cost);
            if (!output) {
                return ["Unaffordable", 0, NaN, 0, NaN, NaN, false];
            }
            const vector = output[0];
            tree[2] = type === 0 ? vector[8] : 0;
            tree[3] = type === 1 ? vector[8] : 0;
            tree[4] = vector[6] > 0 ? 4 : 0;
            tree[5] = vector[14] > 0 ? 20 : 0;
            tree[6] = Math.max(vector[13] > 0 ? 20 : 0, vector[2] > 0 ? 70 : 0);
            tree[7] = vector[9];
            tree[12] = vector[13];
            tree[13] = vector[14];
            tree[15] = vector[3] > 0 ? 50 : 0;
            tree[16] = vector[10];
            tree[19] = vector[11];
            tree[20] = Math.max(type === 0 ? vector[0] : 0, vector[1] > 0 ? 10 : 0, vector[2] > 0 ? 10 : 0, vector[3] > 0 ? 15 : 0);
            tree[21] = Math.max(type === 1 ? vector[0] : 0, vector[1] > 0 ? 20 : 0, vector[2] > 0 ? 20 : 0, vector[3] > 0 ? 30 : 0);
            tree[22] = Math.max(type === 0 ? vector[1] : 0, vector[3] > 0 ? 10 : 0);
            tree[23] = Math.max(type === 1 ? vector[1] : 0, vector[3] > 0 ? 20 : 0);
            tree[24] = vector[6];
            tree[25] = vector[7];
            tree[26] = vector[2];
            tree[27] = vector[3];
            tree[28] = vector[12];
            tree[29] = vector[4];
            tree[30] = vector[5];
            enforceAmbrosiaPrerequisites(tree);
            const max = ((tree[2] === 2) || (tree[3] === 2)) && tree[7] === 100 && tree[12] === 25 && tree[13] === 25 && tree[16] === 100 && tree[19] === 100 && ((tree[20] === 20) || (tree[21] === 40)) && ((tree[22] === 30) || (tree[23] === 60)) && tree[27] === 20 && tree[28] === 50 && tree[29] === 100 && tree[30] === 100 && (postAoag === 1 || tree[24] === 2 || tree[25] === 2);
            const effect = calculateLoadoutEffect(tree);
            if (type === 0) {
                return [arrayToText(tree), calculateLoadoutCost(tree), 0, 0, effect[4], effect[6], max];
            }
            return [arrayToText(tree), calculateLoadoutCost(tree), 0, 0, effect[5], effect[7], max];
        }

        matrix_L_I = L_I_matrix_generator();
        matrix_L_I = L_I_1_matrix_generator(matrix_L_I);
        matrix_Q_I = Q_I_1_matrix_generator();
        matrix_C_I = C_Inf_1_matrix_generator(0);
        const matrix_O_I = C_Inf_1_matrix_generator(1);
        const matrix_RuneIA = Rune_IA_matrix_generator();

        let matrix_L_0: Array<[number[], number, number]> = [];
        let matrix_L_3: Array<[number[], number, number]> = [];
        let matrix_Q_P: Array<[number[], number, number]> = [];
        let matrix_Q_R: Array<[number[], number, number]> = [];
        let matrix_C_P: Array<[number[], number, number]> = [];
        let matrix_C_R: Array<[number[], number, number]> = [];
        let matrix_O_P: Array<[number[], number, number]> = [];
        let matrix_O_R: Array<[number[], number, number]> = [];
        let matrix_O_H_0: Array<[number[], number, number]> = [];
        let matrix_Obt_I: Array<[number[], number, number, number]> = [];
        let matrix_Off_I: Array<[number[], number, number, number]> = [];
        let matrix_Obt_SR: Array<[number[], number, number, number]> = [];
        let matrix_Off_SR: Array<[number[], number, number, number]> = [];

        if (active[3] || active[4] || active[7]) {
            const matrix_L_D_0 = L_D_matrix_generator(cubesExpTotal, quarksOwned, 0);
            matrix_L_0 = L_matrix_generator(matrix_L_I, matrix_L_D_0);
        }
        if (active[0] || active[1] || active[2] || active[5] || active[6]) {
            const matrix_L_D_3 = L_D_matrix_generator(cubesExpTotal, quarksOwned, 3);
            matrix_L_3 = L_matrix_generator(matrix_L_I, matrix_L_D_3);
            matrix_L_3 = [matrix_L_3[0], ...matrix_L_3.slice(20)];
        }
        if (active[0]) {
            matrix_Q_P = Q_P_matrix_generator(matrix_Q_I);
            matrix_Q_R = Q_R_matrix_generator(matrix_Q_P, matrix_RuneIA);
        }
        if (active[1] || active[5] || active[6]) {
            matrix_C_P = C_P_matrix_generator(matrix_C_I);
            matrix_C_R = C_R_matrix_generator(matrix_C_P, matrix_RuneIA);
        }
        if (active[2]) {
            matrix_O_P = C_P_matrix_generator(matrix_O_I);
            matrix_O_R = O_R_matrix_generator(matrix_O_P);
            matrix_O_H_0 = C_H_matrix_generator(matrix_O_R, 0);
        }
        if (active[4]) {
            matrix_Obt_I = Obt_I_generator(0);
            matrix_Off_I = Obt_I_generator(1);
            if (postAoag === 0) {
                matrix_Obt_SR = Obt_SR_matrix_generator(matrix_Obt_I, 0);
                matrix_Off_SR = Obt_SR_matrix_generator(matrix_Off_I, 0);
            } else {
                matrix_Obt_SR = Obt_SR_matrix_generator(matrix_Obt_I, 1);
                matrix_Off_SR = Obt_SR_matrix_generator(matrix_Off_I, 1);
            }
        }

        if (active[0]) {
            const tree = [...true_base_tree];
            output.c1 = [Quark_batch(matrix_Q_R, matrix_L_3, tree, amb)];
        }
        if (active[1]) {
            const tree = [...true_base_tree];
            const matrix_C_H = C_H_matrix_generator(matrix_C_R);
            output.c2 = [Cube_batch(matrix_C_H, matrix_L_3, tree, amb)];
        }
        if (active[2]) {
            const tree = [...true_base_tree];
            output.c3 = [Cube_batch(matrix_O_H_0, matrix_L_3, tree, amb)];
        }
        if (active[3]) {
            const tree = [...true_base_tree];
            output.c4 = [Luck_batch(matrix_L_0, tree, amb)];
        }

        if (active[4]) {
            const treeObt = [...true_base_tree];
            output.a1 = [O_batch(matrix_Obt_SR, matrix_L_0, treeObt, amb, 0)];
            const treeOff = [...true_base_tree];
            output.a2 = [O_batch(matrix_Off_SR, matrix_L_0, treeOff, amb, 1)];
        }

        if (active[5]) {
            const outputRows: Array<[string, number, number, number, number, number, boolean]> = [];
            const costArray = [101, 33434, 100100, 200099, 333431, 500096, 1000091, 2500076];
            for (let i = 0; i <= 7; i++) {
                if (costArray[i] < amb) {
                    const tree = [...true_base_tree];
                    const matrix_C_H = C_H_matrix_generator(matrix_C_R, i, 0);
                    const batch = Cube_batch(matrix_C_H, matrix_L_3, tree, amb);
                    batch[2] = batch[1];
                    batch[4] = (calculateLoadoutEffect(tree)[2]) / calculateEffect(4, i, 0, 0)[2];
                    if (i === 0) {
                        batch[5] = 0;
                    } else {
                        const previousValue = outputRows[i - 1][4];
                        const nextValue = batch[4];
                        batch[5] = Math.ceil(Math.log10(previousValue / nextValue) / Math.log10((1 + 0.01 * i) / (1 + 0.01 * (i - 1))));
                        if (batch[5] > 50) {
                            batch[5] = "Never" as unknown as number;
                        }
                    }
                    outputRows.push(batch);
                } else {
                    outputRows.push(["Unaffordable", 0, NaN, 0, NaN, NaN, false]);
                }
            }
            if (typeof outputRows[4][5] === "number" && outputRows[4][5] <= 0) {
                outputRows[0][5] = "Never" as unknown as number;
                outputRows[1][5] = "Never" as unknown as number;
                outputRows[2][5] = "Never" as unknown as number;
                outputRows[3][5] = "Never" as unknown as number;
                outputRows[4][5] = 0 as unknown as number;
            }
            type HeaterRowKey = 'h0' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'h7';
            for (let i = 0; i < outputRows.length; i++) {
                const key = `h${i}` as HeaterRowKey;
                output[key] = [outputRows[i]];
            }
        }

        if (active[6]) {
            const outputRows: Array<[string, number, number, number, number, number, boolean]> = [];
            const tree = [...true_base_tree];
            const basecost_1 = 333431;
            const basecost_2 = 101;
            if (exalt) {
                outputRows.push(["In Exalt", 0, NaN, 0, NaN, 0, false]);
            } else if (amb < basecost_1 + calculateCost(24, 1)) {
                outputRows.push(["Unaffordable", 0, NaN, 0, NaN, 0, false]);
            } else {
                let r1 = 1;
                const cost_1 = Array.from({ length: max_level[24] }, (_, i) => basecost_1 + calculateCost(24, i + 1));
                for (let i = 1; i <= max_level[24]; i++) {
                    if (amb >= cost_1[i - 1]) {
                        r1 = i;
                    } else {
                        break;
                    }
                }
                force_tree[24] = r1;
                const matrix_C_H = C_H_matrix_generator(matrix_C_R, -1, 0);
                const batch = Cube_batch(matrix_C_H, matrix_L_3, tree, amb);
                batch[4] = batch[1];
                outputRows.push(batch);
                force_tree[24] = 0;
            }
            if (!exalt) {
                outputRows.push(["Outside Exalt", 0, NaN, 0, NaN, 0, false]);
            } else if (amb < basecost_2 + calculateCost(25, 1)) {
                outputRows.push(["Unaffordable", 0, NaN, 0, NaN, 0, false]);
            } else {
                let r2 = 1;
                const cost_2 = Array.from({ length: max_level[25] }, (_, i) => basecost_2 + calculateCost(25, i + 1));
                for (let i = 1; i <= max_level[25]; i++) {
                    if (amb >= cost_2[i - 1]) {
                        r2 = i;
                    } else {
                        break;
                    }
                }
                force_tree[25] = r2;
                const matrix_C_H = C_H_matrix_generator(matrix_C_R, -1, 0);
                const batch = Cube_batch(matrix_C_H, matrix_L_3, tree, amb);
                batch[4] = batch[1];
                outputRows.push(batch);
                force_tree[25] = 0;
            }
            output.s1 = [outputRows[0]];
            output.s2 = [outputRows[1]];
        }

        if (active[7]) {
            const tree = [...true_base_tree];
            const affordable = Luck_batch(matrix_L_0, tree, amb)[6];
            if (!affordable) {
                output.m0 = [["Unaffordable", 0, NaN, 0, NaN, NaN, false]];
            } else {
                const matrix_C_P_2 = C_P_matrix_generator(matrix_C_I, 0);
                const matrix_C_R_2 = C_R_matrix_generator(matrix_C_P_2, matrix_RuneIA);
                const matrix_C_H = C_H_matrix_generator(matrix_C_R_2, 0).slice(20);
                const tree2 = [...true_base_tree];
                output.m0 = [Cube_batch(matrix_C_H, [matrix_L_0[matrix_L_0.length - 1]], tree2, amb)];
            }
        }

        return output;
    }
}
