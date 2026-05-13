import type Decimal from "break_infinity.js";
import { GameData } from "./hs-player-savedata";

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
    postAoag: number;
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
    runeSiBonusLevelsTotal: Decimal;
    runeIaExp: Decimal;
    runeIaBonusLevelsTotal: Decimal;
    runeIaBonusLevelsTalisman: Decimal;
    baseTalismanPower: Decimal;
    patreonBonus: number;
    activeBells: number;
    jack: boolean;
    freeShopLevelsInfinity: number;
    freeShopLevelsCube: number;
    freeShopLevelsSpeed: number;
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
    heaterOptions: boolean[];
    ossifiedTactics: number;
    ossifiedTactics2: number;
    redberries: number;
    viscount: boolean;
}

export interface HeaterOptimizationResult {
    input: HeaterOptimizerInput;
    // calculateAmb
    luck?: any[][];    // Q4  — best luck loadout
    rLuck?: any[][];   // Q5  — best red luck loadout
    allAmb?: any[][];  // Q6  — best all-ambrosia loadout
    // calculateQuarks
    quarks?: any[][];  // Q7  — best quarks loadout
    // calculateCubes
    cubes?: any[][];   // Q8  — best cubes loadout
    // calculateOct
    oct?: any[][];     // Q9  — best octeract loadout
    // calculateOff
    obt?: any[][];     // Q10 — best obtainium loadout
    off?: any[][];     // Q11 — best offering loadout
    // calculateHyperflux (up to 8 rows: hyperflux level 0–7)
    hyperflux?: any[][];
    // calculateAmbOct
    ambOct?: any[][];  // Q25 — best amb+oct loadout
    // calculateGen (3 rows: gen level 1–3)
    gen?: any[][];
}
