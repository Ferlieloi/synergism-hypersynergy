import { CalculationMode, HSCalculationDefinition, HSCalculationParamOption, HSCalculationParams, hepteractTypeList, SingularityDebuffs } from "../../../types/data-types/hs-gamedata-api-types";
import { EventBuffType } from "../../../types/data-types/hs-event-data";
import { challenge15Rewards, redAmbrosiaUpgradeCalculationCollection } from "./hs-gamedata-tables";

// ===== Param options for the Tools tab =====

const optionsFromKeys = (keys: readonly string[]): HSCalculationParamOption[] => keys.map((key) => ({ label: key, value: key }));

const MODE_PARAM: HSCalculationParams = {
    paramName: "mode",
    paramType: "CalculationMode",
    defaultValue: "normal",
    options: optionsFromKeys(["normal", "true_base", "non_ambrosia"] satisfies CalculationMode[])
};

const SINGULARITY_COUNT_PARAM: HSCalculationParams = {
    paramName: "singularityCount",
    paramType: "number",
    defaultValue: -1,
    label: "Singularity (-1: current)"
};

// A numeric enum also maps its values back to its names
const EVENT_BUFF_OPTIONS: HSCalculationParamOption[] = Object.entries(EventBuffType)
    .filter(([, value]) => typeof value === "number")
    .map(([label, value]) => ({ label, value }));

const SINGULARITY_DEBUFF_OPTIONS = optionsFromKeys([
    "Offering", "Obtainium", "Salvage", "Global Speed", "Researches", "Ant ELO",
    "Ascension Speed", "Cubes", "Cube Upgrades", "Platonic Costs", "Hepteract Costs"
] satisfies SingularityDebuffs[]);

export const HSCalculationDefinitions: HSCalculationDefinition[] = [
    {
        calculationName: "Consumable Event Buff",
        fnName: "calculateConsumableEventBuff",
        fnParams: [
            {
                paramName: "buff",
                paramType: "EventBuffType",
                options: EVENT_BUFF_OPTIONS
            }
        ],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Ambrosia Generation Shop Upgrade",
        fnName: "calculateAmbrosiaGenerationShopUpgrade",
        fnParams: [
            {
                paramName: "reduce_vals",
                paramType: "boolean",
                defaultValue: true
            },
            MODE_PARAM
        ],
        supportsReduce: true,
        toolingSupport: true
    },
    {
        calculationName: "Ambrosia Generation Singularity Upgrade",
        fnName: "calculateAmbrosiaGenerationSingularityUpgrade",
        fnParams: [
            {
                paramName: "reduce_vals",
                paramType: "boolean",
                defaultValue: true
            }
        ],
        supportsReduce: true,
        toolingSupport: true
    },
    {
        calculationName: "Ambrosia Generation Octeract Upgrade",
        fnName: "calculateAmbrosiaGenerationOcteractUpgrade",
        fnParams: [
            {
                paramName: "reduce_vals",
                paramType: "boolean",
                defaultValue: true
            }
        ],
        supportsReduce: true,
        toolingSupport: true
    },
    {
        calculationName: "Singularity Milestone Blueberries",
        fnName: "calculateSingularityMilestoneBlueberries",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Dilated Five Leaf Bonus",
        fnName: "calculateDilatedFiveLeafBonus",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Singularity Ambrosia Luck Milestone Bonus",
        fnName: "calculateSingularityAmbrosiaLuckMilestoneBonus",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Ambrosia Luck Shop Upgrade",
        fnName: "calculateAmbrosiaLuckShopUpgrade",
        fnParams: [
            {
                paramName: "reduce_vals",
                paramType: "boolean",
                defaultValue: true
            },
            MODE_PARAM
        ],
        supportsReduce: true,
        toolingSupport: true
    },
    {
        calculationName: "Ambrosia Luck Singularity Upgrade",
        fnName: "calculateAmbrosiaLuckSingularityUpgrade",
        fnParams: [
            {
                paramName: "reduce_vals",
                paramType: "boolean",
                defaultValue: true
            }
        ],
        supportsReduce: true,
        toolingSupport: true
    },
    {
        calculationName: "Ambrosia Luck Octeract Upgrade",
        fnName: "calculateAmbrosiaLuckOcteractUpgrade",
        fnParams: [
            {
                paramName: "reduce_vals",
                paramType: "boolean",
                defaultValue: true
            }
        ],
        supportsReduce: true,
        toolingSupport: true
    },
    {
        calculationName: "Total Cubes",
        fnName: "calculateTotalCubesExp",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    /*

                            SHOULD WE ADD ANYTHING ELSE ????

    */
    {
        calculationName: "Red Ambrosia Upgrade Value",
        fnName: "calculateRedAmbrosiaUpgradeValue",
        fnParams: [
            {
                paramName: "upgradeName",
                paramType: "keyof RedAmbrosiaUpgrades",
                options: optionsFromKeys(Object.keys(redAmbrosiaUpgradeCalculationCollection))
            }
        ],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Campaign Ambrosia Speed Bonus",
        fnName: "calculateCampaignAmbrosiaSpeedBonus",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Campaign Luck Bonus",
        fnName: "calculateCampaignLuckBonus",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Cookie Upgrade 29 Luck",
        fnName: "calculateCookieUpgrade29Luck",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Sum Of Exalt Completions",
        fnName: "calculateSumOfExaltCompletions",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Number Of Thresholds",
        fnName: "calculateNumberOfThresholds",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "To Next Threshold",
        fnName: "calculateToNextThreshold",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Required Blueberry Time",
        fnName: "calculateRequiredBlueberryTime",
        fnParams: [
            {
                paramName: "ignoreTwoMind",
                paramType: "boolean",
                defaultValue: false
            },
            {
                paramName: "ignoreBrickOfLead",
                paramType: "boolean",
                defaultValue: false
            }
        ],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Required Red Ambrosia Time",
        fnName: "calculateRequiredRedAmbrosiaTime",
        fnParams: [
            {
                paramName: "ignoreTwoMind",
                paramType: "boolean",
                defaultValue: false
            }
        ],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Corruption Total Level",
        fnName: "getCorruptionTotalLevel",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Hepteract Effective",
        fnName: "calculateHepteractEffective",
        fnParams: [
            {
                paramName: "heptType",
                paramType: "HepteractType",
                options: optionsFromKeys(hepteractTypeList)
            }
        ],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "All Shop Tablets",
        fnName: "calculateAllShopTablets",
        fnParams: [
            {
                paramName: "reduce_vals",
                paramType: "boolean",
                defaultValue: true
            },
            MODE_PARAM
        ],
        supportsReduce: true,
        toolingSupport: true
    },
    {
        calculationName: "Limited Ascensions Debuff",
        fnName: "calculateLimitedAscensionsDebuff",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Singularity Reductions",
        fnName: "calculateSingularityReductions",
        fnParams: [
            {
                paramName: "reduce_vals",
                paramType: "boolean",
                defaultValue: true
            },
            {
                paramName: "true_base",
                paramType: "boolean",
                defaultValue: false
            }
        ],
        supportsReduce: true,
        toolingSupport: true
    },
    {
        calculationName: "Effective Singularities",
        fnName: "calculateEffectiveSingularities",
        fnParams: [SINGULARITY_COUNT_PARAM],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Singularity Debuff",
        fnName: "calculateSingularityDebuff",
        fnParams: [
            {
                paramName: "debuff",
                paramType: "SingularityDebuffs",
                options: SINGULARITY_DEBUFF_OPTIONS
            },
            SINGULARITY_COUNT_PARAM
        ],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Ascension Speed Exponent Spread",
        fnName: "calculateAscensionSpread",
        fnParams: [
            {
                paramName: "reduce_vals",
                paramType: "boolean",
                defaultValue: true
            },
            MODE_PARAM
        ],
        supportsReduce: true,
        toolingSupport: true
    },
    {
        calculationName: "Challenge 15 Reward",
        fnName: "calculateChallenge15Reward",
        fnParams: [
            {
                paramName: "rewardName",
                paramType: "keyof typeof challenge15Rewards",
                options: optionsFromKeys(Object.keys(challenge15Rewards))
            }
        ],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Raw Ascension Speed Mult",
        fnName: "calculateRawAscensionSpeedMult",
        fnParams: [
            {
                paramName: "reduce_vals",
                paramType: "boolean",
                defaultValue: true
            },
            MODE_PARAM
        ],
        supportsReduce: true,
        toolingSupport: true
    },
    {
        calculationName: "Ascension Speed Mult",
        fnName: "calculateAscensionSpeedMult",
        fnParams: [MODE_PARAM],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Ambrosia Speed",
        fnName: "calculateAmbrosiaGenerationSpeed",
        fnParams: [
            {
                paramName: "reduce_vals",
                paramType: "boolean",
                defaultValue: true
            },
            MODE_PARAM
        ],
        supportsReduce: true,
        toolingSupport: true
    },
    {
        calculationName: "Blueberry Inventory",
        fnName: "calculateBlueberryInventory",
        fnParams: [
            {
                paramName: "reduce_vals",
                paramType: "boolean",
                defaultValue: true
            }
        ],
        supportsReduce: true,
        toolingSupport: true
    },
    {
        calculationName: "Luck",
        fnName: "calculateLuck",
        fnParams: [
            {
                paramName: "reduce_vals",
                paramType: "boolean",
                defaultValue: true
            },
            MODE_PARAM
        ],
        supportsReduce: true,
        toolingSupport: true
    },
    {
        calculationName: "Luck Conversion",
        fnName: "calculateLuckConversion",
        fnParams: [
            {
                paramName: "reduce_vals",
                paramType: "boolean",
                defaultValue: true
            },
            MODE_PARAM
        ],
        supportsReduce: true,
        toolingSupport: true
    },
    {
        calculationName: "Red Ambrosia Luck",
        fnName: "calculateRedAmbrosiaLuck",
        fnParams: [
            {
                paramName: "reduce_vals",
                paramType: "boolean",
                defaultValue: true
            },
            MODE_PARAM
        ],
        supportsReduce: true,
        toolingSupport: true
    },
    {
        calculationName: "Golden Revolution",
        fnName: "calculateGoldenRevolution",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Total Salvage",
        fnName: "calculateTotalSalvage",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Positive Salvage",
        fnName: "calculatePositiveSalvage",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Negative Salvage",
        fnName: "calculateNegativeSalvage",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Dump Data For Heater",
        fnName: "dumpDataForHeater",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: false
    }
];
