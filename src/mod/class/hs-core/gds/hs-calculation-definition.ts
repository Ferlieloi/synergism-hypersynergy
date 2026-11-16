import { AntUpgrades, CalculationMode, HSCalculationDefinition, HSCalculationParamOption, HSCalculationParams, hepteractTypeList, SingularityDebuffs } from "../../../types/data-types/hs-gamedata-api-types";
import { EventBuffType } from "../../../types/data-types/hs-event-data";
import { CHALLENGE15_CORRUPTION_KEYS, CORRUPTION_CUBE_TYPES, CORRUPTION_EFFECT_KEYS } from "./hs-gamedata-api-corruption";
import { challenge15Rewards, redAmbrosiaUpgradeCalculationCollection } from "./hs-gamedata-tables";

// ===== Param options for the Tools tab =====

const optionsFromKeys = (keys: readonly string[]): HSCalculationParamOption[] => keys.map((key) => ({ label: key, value: key }));

// A numeric enum also maps its values back to its names
const optionsFromNumericEnum = (enumObject: Record<string, string | number>): HSCalculationParamOption[] => Object.entries(enumObject)
    .filter(([, value]) => typeof value === "number")
    .map(([label, value]) => ({ label, value }));

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

const EVENT_BUFF_PARAM: HSCalculationParams = {
    paramName: "buff",
    paramType: "EventBuffType",
    options: optionsFromNumericEnum(EventBuffType)
};

const SINGULARITY_DEBUFF_OPTIONS = optionsFromKeys([
    "Offering", "Obtainium", "Salvage", "Global Speed", "Researches", "Ant ELO",
    "Ascension Speed", "Cubes", "Cube Upgrades", "Platonic Costs", "Hepteract Costs"
] satisfies SingularityDebuffs[]);

// Read from the save again at the click, after its forced save; "current" is 0 inside an ascension challenge, as in the game
const CORRUPTION_LEVEL_PARAM: HSCalculationParams = {
    paramName: "level",
    paramType: "number",
    options: (data) => [
        { label: "current", value: data && data.currentChallenge.ascension === 0 ? data.corruptions.used : 0 },
        { label: "next", value: data?.corruptions.next },
    ]
};

// -1 is the current ascension's level with its free levels, 0 inside an ascension challenge, as in the game
const CUBE_CORRUPTION_LEVEL_PARAM: HSCalculationParams = {
    paramName: "level",
    paramType: "number",
    options: (data) => [
        { label: "current", value: -1 },
        { label: "next", value: data?.corruptions.next },
    ]
};

export const HSCalculationDefinitions: HSCalculationDefinition[] = [
    {
        calculationName: "Event Buff: Consumables",
        group: "Other",
        fnName: "calculateConsumableEventBuff",
        fnParams: [EVENT_BUFF_PARAM],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Ambrosia Speed: Shop Upgrade",
        group: "Ambrosia",
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
        calculationName: "Ambrosia Speed: Singularity Upgrade",
        group: "Ambrosia",
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
        calculationName: "Ambrosia Speed: Octeract Upgrade",
        group: "Ambrosia",
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
        calculationName: "Ambrosia Blueberries: Singularity Milestones",
        group: "Ambrosia",
        fnName: "calculateSingularityMilestoneBlueberries",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Ambrosia Luck: Dilated Five-Leaf Clover",
        group: "Ambrosia",
        fnName: "calculateDilatedFiveLeafBonus",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Ambrosia Luck: Singularity Milestones",
        group: "Ambrosia",
        fnName: "calculateSingularityAmbrosiaLuckMilestoneBonus",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Ambrosia Luck: Shop Upgrade",
        group: "Ambrosia",
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
        calculationName: "Ambrosia Luck: Singularity Upgrade",
        group: "Ambrosia",
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
        calculationName: "Ambrosia Luck: Octeract Upgrade",
        group: "Ambrosia",
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
        calculationName: "Cubes Opened (log10 sum)",
        group: "Ascension & Cubes",
        fnName: "calculateTotalCubesExp",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Red Ambrosia Upgrade Value",
        group: "Red Ambrosia",
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
        calculationName: "Ambrosia Speed: Campaign Bonus",
        group: "Ambrosia",
        fnName: "calculateCampaignAmbrosiaSpeedBonus",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Ambrosia Luck: Campaign Bonus",
        group: "Ambrosia",
        fnName: "calculateCampaignLuckBonus",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Ambrosia Luck: Cookie Upgrade 29",
        group: "Ambrosia",
        fnName: "calculateCookieUpgrade29Luck",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Exalt Completions",
        group: "Singularity",
        fnName: "calculateSumOfExaltCompletions",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Ambrosia Thresholds",
        group: "Ambrosia",
        fnName: "calculateNumberOfThresholds",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Ambrosia Thresholds: Ambrosia to Next",
        group: "Ambrosia",
        fnName: "calculateToNextThreshold",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Ambrosia Bar Requirement",
        group: "Ambrosia",
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
        calculationName: "Red Ambrosia Bar Requirement",
        group: "Red Ambrosia",
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
        calculationName: "Corruption Level",
        group: "Ascension & Cubes",
        fnName: "getActiveCorruptionLevel",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Corruption Level: Free Levels",
        group: "Ascension & Cubes",
        fnName: "calculateFreeCorruptionLevels",
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
        calculationName: "Corruption Level: Effective",
        group: "Ascension & Cubes",
        fnName: "getActiveEffectiveCorruptionLevel",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Corruption Level: Platonic Scaling",
        group: "Ascension & Cubes",
        fnName: "getPlatonicCorruptionScaling",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Hepteract Effective Amount",
        group: "Ascension & Cubes",
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
        calculationName: "Vouchers",
        group: "Other",
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
        calculationName: "Exalt Debuff: Limited Ascensions",
        group: "Singularity",
        fnName: "calculateLimitedAscensionsDebuff",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Singularity Debuff: Reductions",
        group: "Singularity",
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
        calculationName: "Singularity Debuff: Effective Singularities",
        group: "Singularity",
        fnName: "calculateEffectiveSingularities",
        fnParams: [SINGULARITY_COUNT_PARAM],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Singularity Debuff",
        group: "Singularity",
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
        group: "Ascension & Cubes",
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
        group: "Ascension & Cubes",
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
        calculationName: "Ascension Speed Multiplier: Raw",
        group: "Ascension & Cubes",
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
        calculationName: "Ascension Speed Multiplier",
        group: "Ascension & Cubes",
        fnName: "calculateAscensionSpeedMult",
        fnParams: [MODE_PARAM],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Ambrosia Speed",
        group: "Ambrosia",
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
        calculationName: "Ambrosia Blueberries",
        group: "Ambrosia",
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
        calculationName: "Ambrosia Luck",
        group: "Ambrosia",
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
        calculationName: "Red Ambrosia Luck: Conversion",
        group: "Red Ambrosia",
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
        group: "Red Ambrosia",
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
        group: "Singularity",
        fnName: "calculateGoldenRevolution",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Rune Salvage",
        group: "Runes & Talismans",
        fnName: "calculateTotalSalvage",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Rune Salvage: Positive",
        group: "Runes & Talismans",
        fnName: "calculatePositiveSalvage",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Rune Salvage: Negative",
        group: "Runes & Talismans",
        fnName: "calculateNegativeSalvage",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Rune Salvage: First Five Runes",
        group: "Runes & Talismans",
        fnName: "calculateFirstFiveRuneSalvage",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Rune Salvage: Corruption",
        group: "Runes & Talismans",
        fnName: "calculateBadOfferingsSalvage",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    // ----- Ambrosia, luck, purple -----
    {
        // The HSGameDataAPI copy, which hides the helper's: no reduce_vals, hence no components
        calculationName: "Red Ambrosia Speed",
        group: "Red Ambrosia",
        fnName: "calculateRedAmbrosiaGenerationSpeed",
        fnParams: [MODE_PARAM],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Ambrosia Bar Income",
        group: "Ambrosia",
        fnName: "calculateAmbrosiaBarIncome",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Ambrosia Upgrade Value",
        group: "Ambrosia",
        fnName: "calculateAmbrosiaUpgradeValue",
        fnParams: [
            {
                paramName: "upgradeName",
                paramType: "AmbrosiaUpgradeNames",
                options: (data) => optionsFromKeys(Object.keys(data?.ambrosiaUpgrades ?? {}))
            },
            {
                paramName: "freeLevelsOnly",
                paramType: "boolean",
                defaultValue: false
            }
        ],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Ambrosia Luck: Panthema",
        group: "Ambrosia",
        fnName: "calculatePanthemaAmbrosiaLuck",
        fnParams: [MODE_PARAM],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Red Ambrosia Luck: Panthema",
        group: "Red Ambrosia",
        fnName: "calculatePanthemaRedLuck",
        fnParams: [MODE_PARAM],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Purple Honey Luck",
        group: "Ants & Honey",
        fnName: "calculatePurpleHoneyLuck",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Purple Honey Luck Breakdown",
        group: "Ants & Honey",
        fnName: "calculatePurpleHoneyLuckBreakdown",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Purple Honey Per Extraction",
        group: "Ants & Honey",
        fnName: "calculatePurpleHoneyPerExtraction",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    // ----- Cubes, ascension, corruptions -----
    {
        calculationName: "Cube Bank",
        group: "Ascension & Cubes",
        fnName: "calculateCubeBank",
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
        calculationName: "Cube Gain: Corruption Lines",
        group: "Ascension & Cubes",
        fnName: "calculateCubeGainBase",
        fnParams: [
            {
                paramName: "reduce_vals",
                paramType: "boolean",
                defaultValue: true
            },
            {
                paramName: "cube",
                paramType: "CorruptionCubeType",
                options: optionsFromKeys(CORRUPTION_CUBE_TYPES)
            },
            CUBE_CORRUPTION_LEVEL_PARAM
        ],
        supportsReduce: true,
        toolingSupport: true
    },
    {
        calculationName: "Corruption Effect",
        group: "Ascension & Cubes",
        fnName: "getCorruptionEffect",
        fnParams: [
            CORRUPTION_LEVEL_PARAM,
            {
                paramName: "corruption",
                paramType: "CorruptionEffectKey",
                options: optionsFromKeys(CORRUPTION_EFFECT_KEYS)
            }
        ],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Corruption Effect: Challenge 15",
        group: "Ascension & Cubes",
        fnName: "getChallenge15CorruptionEffect",
        fnParams: [
            {
                paramName: "corruption",
                paramType: "Challenge15CorruptionKey",
                options: optionsFromKeys(CHALLENGE15_CORRUPTION_KEYS)
            }
        ],
        supportsReduce: false,
        toolingSupport: true
    },
    // ----- Runes, talismans, other -----
    {
        calculationName: "Rune Levels (Total)",
        group: "Runes & Talismans",
        fnName: "calculateTotalRuneLevels",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Construction: Before Multiplier",
        group: "Other",
        fnName: "calculateRawConstruction",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Construction",
        group: "Other",
        fnName: "calculateConstruction",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Construction: Coin Buildings",
        group: "Other",
        fnName: "calculateCoinConstruction",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Talisman Rarity (Total)",
        group: "Runes & Talismans",
        fnName: "calculateTalismanRarityTotal",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Synergism Level",
        group: "Other",
        fnName: "calculateSynergismLevel",
        fnParams: [],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Ant Upgrade True Level",
        group: "Ants & Honey",
        fnName: "calculateTrueAntLevel",
        fnParams: [
            {
                paramName: "antUpgrade",
                paramType: "AntUpgrades",
                options: optionsFromNumericEnum(AntUpgrades)
            }
        ],
        supportsReduce: false,
        toolingSupport: true
    },
    {
        calculationName: "Event Buff",
        group: "Other",
        fnName: "calculateEventSourceBuff",
        fnParams: [EVENT_BUFF_PARAM],
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
