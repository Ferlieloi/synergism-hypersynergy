import type Decimal from "break_infinity.js";
import type { HeaterBranchId, HeaterResultArrayKey } from "../../class/hs-modules/hs-heater/hs-heater-result-config";
export type { HeaterResultArrayKey } from "../../class/hs-modules/hs-heater/hs-heater-result-config";

export interface HeaterOptimizerInput {
    amb: number;
    ramb: number;
    ambSpeedNonAmbBerries: number;
    blueberries: number;
    luckBaseNonAmb: number;
    luckMultNonAmb: number;
    redLuckBase: number;
    luckConversion: number;
    quarksOwned: number;
    qHept: number;
    cubesExpTotal: number;
    currentSingularity: number;
    singularityReducers: number;
    exalt: number;
    postAoag: boolean;
    transcription: number;
    ascSpeed: number;
    ascSpread: number;
    baseObt: number;
    baseOff: number;
    bonusRow2: number;
    bonusRow3: number;
    bonusRow4: number;
    bonusRow5: number;
    runeSiExp: Decimal;
    runeSiRC: number;
    runeSiBonusLevelsTotal: number;
    runeIaExp: Decimal;
    runeIaBonusLevelsTotal: Decimal;
    runeIaBonusLevelsTalisman: Decimal;
    baseTalismanPower: Decimal;
    patreonBonus: number;
    activeBells: number;
    jack: boolean;
    freeShopLevelsInfinity: number;
    freeShopLevelsQuark: number;
    chronometerLevel: number;
    shopAmbrosiaLuck1: number;
    shopAmbrosiaLuck2: number;
    shopAmbrosiaLuck3: number;
    shopAmbrosiaLuck4: number;
    shopRedLuck1: number;
    shopRedLuck2: number;
    shopRedLuck3: number;
    shopAmbrosiaGeneration1: number;
    shopAmbrosiaGeneration2: number;
    shopAmbrosiaGeneration3: number;
    shopAmbrosiaGeneration4: number;
    shopImproveQuarkHept1: number;
    shopImproveQuarkHept2: number;
    shopImproveQuarkHept3: number;
    shopImproveQuarkHept4: number;
    shopImproveQuarkHept5: number;
    ossifiedTactics: number;
    ossifiedTactics2: number;
    redberries: number;
    fusion: number;
    viscount: boolean;
    rBar: number;
    rSpeed: number;
    heaterOptions: Record<HeaterBranchId, boolean>;
}

export type HeaterResultAffordableRow = [
    loadoutJson: string,
    sheetSpacerA: null,
    blueberryCost: number,
    cost: number,
    effect: string,
    p4x4Eq: number | "Never" | "",
    isMaxed: boolean,
];

export type HeaterResultUnaffordableRow = [
    loadoutLabel: "Unaffordable",
    sheetSpacerA: null,
    blueberryCost: "N / A",
    cost:   "N / A",
    effect: "N / A",
    p4x4Eq: "N / A",
    isMaxed: false,
];

export type HeaterResultRow = HeaterResultAffordableRow | HeaterResultUnaffordableRow;
export type HeaterResultRowMatrix = HeaterResultRow[];

export type HeaterResultSheetRow = {
    loadout:        string;
    blueberryCost:  number | "N / A";
    cost:           number | "N / A";
    costDetail:     number | "Maxed" | "N / A";
    effect:         string;
    p4x4Eq:         number | "Never" | "" | "N / A";
    maxed:          boolean;
    p4Effect:       number | "-" | "N / A";
    p4CefLog:       number | "-" | "N / A" | "Never";
    p9Effect:       number | "-" | "N / A";
    p9CefLog:       number | "-" | "N / A" | "Never";
};

export type HeaterResultSheetRowMatrix = HeaterResultSheetRow[];

export type RowBasedResultKey = import("../../class/hs-modules/hs-heater/hs-heater-result-config").RowBasedResultKey;
export type SingleResultKey = Exclude<HeaterResultArrayKey, RowBasedResultKey>;
export type HeaterTypeSemanticId = 'none' | SingleResultKey | `${RowBasedResultKey}:${number}`;
export type HeaterResultSectionId = 'common' | 'obtOff' | 'p4x4' | 'hybrid';

export type HeaterRedAmbUpgradeEffectName =
    | 'ossifiedTactics'
    | 'blueberries'
    | 'freeLevelsRow2'
    | 'freeLevelsRow3'
    | 'freeLevelsRow4'
    | 'freeLevelsRow5'
    | 'viscount';

export type HeaterRedAmbUpgradeEffect = {
    rEffect?: number;
    bEffect?: number;
    octEffect?: number;
};

export type HeaterRedAmbUpgradeEffects = Partial<Record<HeaterRedAmbUpgradeEffectName, HeaterRedAmbUpgradeEffect>>;

export type HeaterRedAmbCommonValues = {
    luck: number;
    mLuck: number;
    luckConversion: number;
    totalRedLuck: number;
    rLuckEffectRatio: number;
};

export type NormalizedHeaterResultEntry = {
    semanticId: HeaterTypeSemanticId;
    label: string;
    rowData: HeaterResultRow;
    key: HeaterResultArrayKey;
    section: HeaterResultSectionId;
    rowIndex: number;
    isRowBased: boolean;
};

export interface HeaterOptimizationResult {
    input: HeaterOptimizerInput;
    luck?: HeaterResultRowMatrix;
    rLuck?: HeaterResultRowMatrix;
    allAmb?: HeaterResultRowMatrix;
    quarks?: HeaterResultRowMatrix;
    cubes?: HeaterResultRowMatrix;
    oct?: HeaterResultRowMatrix;
    obt?: HeaterResultRowMatrix;
    off?: HeaterResultRowMatrix;
    voucher?: HeaterResultRowMatrix;
    hyperflux?: HeaterResultRowMatrix;
    sr1?: HeaterResultRowMatrix;
    sr2?: HeaterResultRowMatrix;
    ambOct?: HeaterResultRowMatrix;
    gen?: HeaterResultRowMatrix;
    redAmbUpgradeEffects?: HeaterRedAmbUpgradeEffects;
    redAmbCommonValues?: HeaterRedAmbCommonValues;
}
