import type { HeaterOptimizerInput, HeaterOptimizationResult } from "../../../types/data-types/hs-heater-types";

export interface HSHeaterFieldMapping {
    exportPath: string;
    sheetLabel: string;
}

// Maps HS heater export paths to the Google Sheet label names used by Pull_value_to_heater()
export const HS_HEATER_EXPORT_TO_SHEET_MAPPINGS: HSHeaterFieldMapping[] = [
    { exportPath: "hs_data.lifeTimeAmbrosia", sheetLabel: "Amb Total" },
    { exportPath: "hs_data.quarks", sheetLabel: "Quark" },
    { exportPath: "hs_data.platonic4x4", sheetLabel: "p4x4" },
    { exportPath: "hs_data.trueBaseLuck", sheetLabel: "trueBaseLuck" },
    { exportPath: "hs_data.luckMult", sheetLabel: "luckMult" },
    { exportPath: "hs_data.totalCubes", sheetLabel: "totalCubes" },
    { exportPath: "hs_data.effectiveSingularity", sheetLabel: "effectiveSingularity" },
    { exportPath: "hs_data.postaoag", sheetLabel: "postaoag" },
    { exportPath: "hs_data.transcription", sheetLabel: "Transcription" },
    { exportPath: "hs_data.ascSpeed", sheetLabel: "ascSpeed" },
    { exportPath: "hs_data.spread", sheetLabel: "spread" },
    { exportPath: "hs_data.totalInfinityVouchers", sheetLabel: "totalInfinityVouchers" },
    { exportPath: "hs_data.ambrosiaSpeed", sheetLabel: "ambrosiaSpeed" },
    { exportPath: "hs_data.redAmbrosiaLuck", sheetLabel: "redAmbrosiaLuck" },
    { exportPath: "hs_data.lifeTimeRedAmbrosia", sheetLabel: "Red Amb Total" },
    { exportPath: "hs_data.pseudoCoinUpgrades.redAmbrosiaGenerationBuffLevel", sheetLabel: "redAmbrosiaGenerationBuffLevel" },
    { exportPath: "hs_data.isInsideSingularityChallenge", sheetLabel: "insideSingularityChallenge" },
    { exportPath: "hs_data.baseObt", sheetLabel: "baseobt" },
    { exportPath: "hs_data.baseOff", sheetLabel: "baseoff" },
    { exportPath: "hs_data.bb", sheetLabel: "bb" },
    { exportPath: "hs_data.bonusRow2", sheetLabel: "bonusRow2" },
    { exportPath: "hs_data.bonusRow3", sheetLabel: "bonusRow3" },
    { exportPath: "hs_data.bonusRow4", sheetLabel: "bonusRow4" },
    { exportPath: "hs_data.bonusRow5", sheetLabel: "bonusRow5" },
    { exportPath: "highestSingularityCount", sheetLabel: "highestSingularityCount" },
    { exportPath: "wowCubes", sheetLabel: "wowCubes" },
    { exportPath: "maxRuneExp", sheetLabel: "maxRuneExp" },
    { exportPath: "hs_data.runeexp", sheetLabel: "runeexp" },
    { exportPath: "hs_data.sirc", sheetLabel: "sirc" },
    { exportPath: "hs_data.bonussi", sheetLabel: "bonussi" },
    { exportPath: "hs_data.totalbonusia", sheetLabel: "totalbonusia" },
    { exportPath: "hs_data.talismanbonusia", sheetLabel: "talismanbonusia" },
    { exportPath: "hs_data.baseTalismanPower", sheetLabel: "btp" },
    { exportPath: "redAmbrosiaUpgrades", sheetLabel: "Red Ambs upgrade" },
    { exportPath: "shopRedLuck1", sheetLabel: "shopRedLuck1" },
    { exportPath: "shopRedLuck2", sheetLabel: "shopRedLuck2" },
    { exportPath: "shopRedLuck3", sheetLabel: "shopRedLuck3" },
];

export const HS_HEATER_EXPORT_TO_SHEET_MAP: Record<string, string> = Object.fromEntries(
    HS_HEATER_EXPORT_TO_SHEET_MAPPINGS.map((mapping) => [mapping.exportPath, mapping.sheetLabel])
);

export class HSHeaterAPI {
    static readonly fieldMappings = HS_HEATER_EXPORT_TO_SHEET_MAPPINGS;
    static readonly fieldMap = HS_HEATER_EXPORT_TO_SHEET_MAP;

    static createHeaterOptimizerResultFromInput(input: HeaterOptimizerInput): HeaterOptimizationResult {
        return {
            input,
            notes: [],
        };
    }
}
