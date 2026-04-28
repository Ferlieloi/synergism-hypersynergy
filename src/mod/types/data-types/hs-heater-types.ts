import { PlayerData } from "./hs-player-savedata";

export interface HeaterExportPseudoCoinUpgrades {
    ambrosiaGenerationBuffLevel: number;
    ambrosiaLuckBuffLevel: number;
    baseObtainiumBuffLevel: number;
    baseOfferingBuffLevel: number;
    cubeBuffLevel: number;
    redAmbrosiaGenerationBuffLevel: number;
    redAmbrosiaLuckBuffLevel: number;
}

export interface HeaterExportRedAmbrosiaUpgrades {
    tutorial: number;
    conversionImprovement1: number;
    conversionImprovement2: number;
    conversionImprovement3: number;
    freeTutorialLevels: number;
    freeLevelsRow2: number;
    freeLevelsRow3: number;
    freeLevelsRow4: number;
    freeLevelsRow5: number;
    blueberryGenerationSpeed: number;
    blueberryGenerationSpeed2: number;
    regularLuck: number;
    regularLuck2: number;
    redGenerationSpeed: number;
    redLuck: number;
    redAmbrosiaCube: number;
    redAmbrosiaObtainium: number;
    redAmbrosiaOffering: number;
    redAmbrosiaCubeImprover: number;
    viscount: number;
    infiniteShopUpgrades: number;
    redAmbrosiaAccelerator: number;
    salvageYinYang: number;
    blueberries: number;
}

export interface HeaterExportHsData {
    lifeTimeAmbrosia: number;
    lifeTimeRedAmbrosia: number;
    quarks: number;
    platonic4x4: number;
    baseLuck: number;
    luckMult: number;
    totalLuck: number;
    trueBaseLuck: number;
    redAmbrosiaLuck: number;
    luckConversion: number;
    totalCubes: number;
    effectiveSingularity: number;
    postaoag: boolean;
    transcription: number;
    ascSpeed: number;
    ascSpeed2: number;
    blueberries: number;
    bonusRow2: number;
    bonusRow3: number;
    bonusRow4: number;
    bonusRow5: number;
    spread: number;
    totalInfinityVouchers: number;
    baseTalismanPower: number;
    sirc: number;
    bonussi: number;
    totalbonusia: number;
    talismanbonusia: number;
    tokens: number | null;
    maxTokens: number | null;
    isAtMaxTokens: boolean | null;
    isEvent: boolean | null;
    bellStacks: number | null;
    personalQuarkBonus: number | null;
    blueAmbrosiaBarValue: number;
    redAmbrosiaBarValue: number;
    blueAmbrosiaBarMax: number;
    redAmbrosiaBarMax: number;
    baseObt: number;
    baseOff: number;
    bb: number;
    runeexp: number;
    ambrosiaSpeedMult: number;
    ambrosiaSpeed: number;
    ambrosiaGainChance: number;
    trueAmbrosiaGainChance: number;
    ambrosiaAcceleratorCount: number;
    pseudoCoinUpgrades: HeaterExportPseudoCoinUpgrades;
    redAmbrosiaUpgrades: HeaterExportRedAmbrosiaUpgrades;
    isInsideSingularityChallenge: boolean;
}

export interface HeaterSheetData {
    lifeTimeAmbrosia: number;
    lifeTimeRedAmbrosia: number;
    quarks: number;
    platonic4x4: number;
    baseLuck: number;
    luckMult: number;
    totalLuck: number;
    trueBaseLuck: number;
    totalCubes: number;
    effectiveSingularity: number;
    postaoag: boolean;
    transcription: number;
    ascSpeed: number;
    ascSpeed2: number;
    blueberries: number;
    bonusRow2: number;
    bonusRow3: number;
    bonusRow4: number;
    bonusRow5: number;
    spread: number;
    totalInfinityVouchers: number;
    tokens: number | null;
    maxTokens: number | null;
    isAtMaxTokens: boolean | null;
    isEvent: boolean | null;
    bellStacks: number | null;
    personalQuarkBonus: number | null;
    isInsideSingularityChallenge: boolean;
    blueAmbrosiaBarValue: number;
    redAmbrosiaBarValue: number;
    blueAmbrosiaBarMax: number;
    redAmbrosiaBarMax: number;
    baseObt: number;
    baseOff: number;
    bb: number;
    runeexp: number;
    ambrosiaSpeedMult: number;
    ambrosiaSpeed: number;
    ambrosiaGainChance: number;
    trueAmbrosiaGainChance: number;
    ambrosiaAcceleratorCount: number;
    redAmbrosiaLuck: number;
    baseTalismanPower: number;
    sirc: number;
    bonussi: number;
    totalbonusia: number;
    talismanbonusia: number;
    luckConversion: number;
    pseudoCoinUpgrades: HeaterExportPseudoCoinUpgrades;
}

export interface HeaterPreviewResult {
    sheetData: HeaterSheetData;
    estimatedAmbrosiaRate: number;
    estimatedBlueAmbrosiaBarRemaining: number;
    estimatedRedAmbrosiaBarRemaining: number;
    estimatedBlueAmbrosiaFillTimeSeconds: number;
    estimatedRedAmbrosiaFillTimeSeconds: number;
    blueAmbrosiaBarProgress: number;
    redAmbrosiaBarProgress: number;
}

export interface HeaterOptimizerInput {
    amb: number;
    quark: number;
    plat4x4: number;
    baseluck: number;
    multluck: number;
    cube: number;
    singularity: number;
    postaoag: number;
    transcription: number;
    ascspeed1: number;
    ascspeed2: number;
    spread: number;
    voucher: number;
    baseobt: number;
    baseoff: number;
    bb: number;
    bonusRow2: number;
    bonusRow3: number;
    bonusRow4: number;
    bonusRow5: number;
    ramb: number;
    runeexp: number;
    sirc: number;
    bonussi: number;
    totalbonusia: number;
    talismanbonusia: number;
    btp: number;
    noSingularityUpgradesCompletions: number;
    noAmbrosiaUpgradesCompletions: number;
    active: boolean[];
}

export interface HeaterOptimizationResult {
    input: HeaterOptimizerInput;
    c1?: any[];
    c2?: any[];
    c3?: any[];
    c4?: any[];
    a1?: any[];
    a2?: any[];
    h0?: any[];
    h1?: any[];
    h2?: any[];
    h3?: any[];
    h4?: any[];
    h5?: any[];
    h6?: any[];
    h7?: any[];
    s1?: any[];
    s2?: any[];
    m0?: any[];
    notes: string[];
}

export type HeaterExportData = PlayerData & {
    hs_data: HeaterExportHsData;
};
