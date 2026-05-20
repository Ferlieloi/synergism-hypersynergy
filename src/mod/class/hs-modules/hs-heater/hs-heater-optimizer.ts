import type { HeaterOptimizerInput, HeaterOptimizationResult, HeaterResultRow, HeaterResultRowMatrix, } from "../../../types/data-types/hs-heater-types";

/*
    This file closely match the script on Rus9384's sheet (credits to him),
    in order to be easily updatable when the sheet updates (and vice-versa...)
    Sheet link: https://docs.google.com/spreadsheets/d/105yoI41lk8UJ2PThTkV0tWKNli5R0K1WuaSphKl13R0/edit?gid=1484254243#gid=1484254243
*/

// ===========================================================================
// Internal state types
// ===========================================================================

interface UpgradeEffectMap {
    luck?:  (input: number, level: number, loadout: Loadout) => number;
    mLuck?: (input: number, level: number, loadout: Loadout) => number;
    quark?: (input: number, level: number, loadout: Loadout) => number;
    cube?:  (input: number, level: number, loadout: Loadout, p4x4?: number) => number;
    oct?:   (input: number, level: number, loadout: Loadout) => number;
    speed?: (input: number, level: number, loadout: Loadout) => number;
    rSpeed?:(input: number, level: number, loadout: Loadout) => number;
    rLuck?: (input: number, level: number, loadout: Loadout) => number;
    obt?:   (input: number, level: number, loadout: Loadout) => number;
    off?:   (input: number, level: number, loadout: Loadout) => number;
    mObt?:  (input: number, level: number, loadout: Loadout) => number;
    mOff?:  (input: number, level: number, loadout: Loadout) => number;
}

interface UpgradeParameters {
    maxLevel:       number;
    cost:           (level: number) => number;
    effects:        UpgradeEffectMap;
    row:            number;
    blueberryCost:  number;
    prerequisites:  Partial<Record<string, number>>;
    ignoresExalt:   boolean;
    costArray?:     number[];
}


// ===========================================================================
// Stats object (mirrors the sheet_script `stats` const, populated from input)
// ===========================================================================

interface Stats {
    amb:             number;
    rAmb:            number;
    lifetimeAmbExp:  number;
    ambSpeed:        number;
    baseLuck:        number;
    baseMLuck:       number;
    baseRLuck:       number;
    rLuck:           number;
    luckConversion:  number;
    quarks:          number;
    qHept:           number;
    cubeExp:         number;
    sing:            number;
    exalt:           number;
    postAoAG:        boolean;
    mind:            number;
    aSpeed:          number;
    spread:          number;
    baseObt:         number;
    baseOff:         number;
    blueberries:     number;
    bonus:           number[];
    runeExp:         number;
    runeCoefSI:      number;
    bonusSI:         number;
    baseSI:          number;
    expIA:           number;
    bonusIA:         number;
    talismanIA:      number;
    talismanP:       number;
    baseIACube:      number;
    baseIAQuark:     number;
    patreon:         number;
    jack:            boolean;
    voucher:         number;
    shopQuark:       number;
    chronometer:     number;
    shopLuck:        number;
    shopRLuck:       number[];
    shopAmb:         number[];
    qHeptExp:        number;
    ossifiedTactics: number;
    ossifiedTactics2:number;
    redberries:      number;
    viscount:        boolean;
}


// ===========================================================================
// Options (mirrors the sheet_script `options` const, populated from input)
// ===========================================================================

interface Options {
    calculateAmb:       boolean;
    calculateQuarks:    boolean;
    calculateCubes:     boolean;
    calculateOct:       boolean;
    calculateOff:       boolean;
    calculateHyperflux: boolean;
    calculateAmbOct:    boolean;
    calculateGen:       boolean;
}


// ===========================================================================
// Module-level mutable state (reset on each call to createHeaterOptimizerResultFromInput)
// ===========================================================================

let stats: Stats = {
    amb: 0,
    rAmb: 0,
    lifetimeAmbExp: 0,
    ambSpeed: 1,
    baseLuck: 0,
    baseMLuck: 0,
    baseRLuck: 0,
    rLuck: 0,
    luckConversion: 20,
    quarks: 0,
    qHept: 0,
    cubeExp: 0,
    sing: 0,
    exalt: 0,
    postAoAG: false,
    mind: 0.5,
    aSpeed: 1,
    spread: 0,
    baseObt: 1,
    baseOff: 1,
    blueberries: 3,
    bonus: [0, 0, 0, 0, 0],
    runeExp: 0,
    runeCoefSI: 30,
    bonusSI: 0,
    baseSI: 1,
    expIA: 0,
    bonusIA: 0,
    talismanIA: 0,
    talismanP: 1,
    baseIACube: 1,
    baseIAQuark: 1,
    patreon: 0,
    jack: false,
    voucher: 0,
    shopQuark: 0,
    chronometer: 0,
    shopLuck: 0,
    shopRLuck: [0, 0, 0, 0],
    shopAmb: [0, 0, 0, 0],
    qHeptExp: 0,
    ossifiedTactics: 0,
    redberries: 0,
    viscount: false,
    ossifiedTactics2: 0,
};

let options: Options = {
    calculateAmb: false, calculateQuarks:    false, calculateCubes:  false, calculateOct: false,
    calculateOff: false, calculateHyperflux: false, calculateAmbOct: false, calculateGen: false,
};


// ===========================================================================
// Upgrade class
// ===========================================================================

class Upgrade {

    maxLevel:       number;
    cost:           (level: number) => number;
    effects:        UpgradeEffectMap;
    row:            number;
    blueberryCost:  number;
    prerequisites:  Partial<Record<string, number>>;
    ignoresExalt:   boolean;
    costArray?:     number[];

    constructor(parameters: Partial<UpgradeParameters> = {}) {

        this.maxLevel      = parameters.maxLevel      ?? 0;
        this.cost          = parameters.cost          ?? (() => 0);
        this.effects       = parameters.effects       ?? {};
        this.row           = parameters.row           ?? 0;
        this.blueberryCost = parameters.blueberryCost ?? 0;
        this.prerequisites = parameters.prerequisites ?? {};
        this.ignoresExalt  = parameters.ignoresExalt  ?? false;

        if (parameters.costArray !== undefined) {
            this.costArray = parameters.costArray;
        }

    }

    static singDebuff(sing = 0, stat = ""): number {

        const effectiveSing = (): number => {
            let eff = sing * Math.min(4.75, 0.075 * sing + 1);
            if (sing > 10)
                eff *= 1.5 * Math.min(4, 0.125 * sing - 0.25);
            if (sing > 25)
                eff *= 2.5 * Math.min(6, 0.06 * sing - 0.5);
            if (sing > 36)
                eff *= 4 * Math.min(5, sing / 18 - 1) * Math.pow(1.1, Math.min(sing - 36, 64));
            if (sing > 50)
                eff *= 5 * Math.min(8, 0.04 * sing - 1) * Math.pow(1.1, Math.min(sing - 50, 50));
            if (sing > 100)
                eff *= 0.08 * sing * Math.pow(1.1, sing - 100);
            if (sing > 150)
                eff *= 2 * Math.pow(1.05, sing - 150);
            if (sing > 200)
                eff *= 1.5 * Math.pow(1.275, sing - 200);
            if (sing > 215)
                eff *= 1.25 * Math.pow(1.2, sing - 215);
            if (sing > 230)
                eff *= 2;
            if (sing > 269)
                eff *= Math.pow(3, sing - 268);
            return eff;
        };

        const effSing = effectiveSing();
        if (stat === "mOff") {
            let result = Math.pow(1.02, sing) * (1 + Math.sqrt(effSing) / 4);
            result *= sing < 150 ? 3 * Math.sqrt(effSing + 1) : Math.pow(effSing, 2 / 3) / 400;
            return result;
        } else if (stat === "cube") {
            let result = 2 * Math.pow(1.03, Math.max(0, sing - 100));
            if (sing < 150)
                result = 3 * (1 + (Math.sqrt(effSing) * result) / 4);
            else
                result = 1 + (Math.pow(effSing, 0.75) * result) / 1000;
            return result;
        }

        return 1;

    }

    static ambrosiaRuneOOMBonusCost(): number[] {
        const result: number[] = [0];
        for (let level = 1; level <= 100; level++)
            result.push(result[level - 1] + Math.ceil(2500 * (Math.pow(level, 1.5) - Math.pow(level - 1, 1.5))));
        return result;
    }

    static runeLevelSI(runeCoefDelta = 0, talismanPDelta = 0) {
      let level = (stats.runeExp - 12) * (stats.runeCoefSI + runeCoefDelta)
      let talismanL = Math.max(0, stats.bonusSI - 10000) // Assuming free levels from tesseract upgrades and exp
      let bonusL = Math.min(10000, stats.bonusSI)
      level += bonusL + talismanL * talismanPDelta / stats.talismanP
      return Math.floor(level)
    }

    static runeLevelIA(runeCoefDelta = 0, talismanPDelta = 0): number {
        let level = (stats.expIA - 75) * (0.5 + runeCoefDelta);
        level += stats.bonusIA + stats.talismanIA * talismanPDelta / stats.talismanP;
        return Math.floor(level);
    }

    static chronometerEffect(level = 0, mind = 1): number {

        if (stats.chronometer <= 0)
            return 1;

        let aSpeed = stats.aSpeed;
        aSpeed = Math.pow(aSpeed, 1 / (1 + stats.spread * (aSpeed >= 1 ? 1 : -1)));

        const exponent = mind * aSpeed >= 1 ? 1 + stats.spread : 1 - stats.spread;
        const oldLevel = Math.floor(stats.chronometer / 40);
        const newLevel = Math.floor((stats.chronometer + level) / 40);
        const effect   = Math.pow(1.006, level * exponent) * Math.pow(aSpeed, 0.001 * (newLevel - oldLevel));

        return effect;

    }

    static ambGeneration(level = 0): number {
        let speed = 1;
        speed *= 1 + 0.01 * level / (1 + 0.01 * stats.shopAmb[0]);
        speed *= 1 + 0.01 * level / (1 + 0.01 * stats.shopAmb[1]);
        speed *= 1 + 0.01 * level / (1 + 0.01 * stats.shopAmb[2]);
        speed *= 1 + 0.001 * level / (1 + 0.001 * stats.shopAmb[3]);
        if (stats.jack)
            speed *= 1 + 0.001 * (1 + 0.01 * stats.voucher) * level;
        return speed;
    }

    static luckConversion(level = 0): number {
        let conversion = stats.shopRLuck.reduce((result, value) => result + Math.floor(value / 20) * 0.01, stats.luckConversion);
        const levels = stats.shopRLuck.map(value => value > 0 ? value + level : 0);
        levels[2] += stats.shopRLuck[2] > 0 ? level : 0;
        conversion = levels.reduce((result, value) => result - Math.floor(value / 20) * 0.01, conversion);
        return Math.max(conversion, 1e-6); // Sheet only have 'return conversion'
    }

    static rLuck(level = 0, loadout: Loadout): number {
        let rLuck = stats.baseRLuck + Math.floor((loadout.luck - 100) / Upgrade.luckConversion(level));
        rLuck += stats.shopRLuck[0] > 0 ? level * 0.05   : 0;
        rLuck += stats.shopRLuck[1] > 0 ? level * 0.075  : 0;
        rLuck += stats.shopRLuck[2] > 0 ? level * 0.2    : 0; // Each bonus level applies twice
        if (stats.jack)
            rLuck += 0.05 * (1 + 0.01 * stats.voucher);
        return rLuck;
    }

    static rSpeed(speed = 1): number {
        return Math.min(speed, Math.sqrt(1000 * speed));
    }

    static shopQuark(level = 0): number {
        const base   = 1 + 0.2 * Math.log2(1 + stats.qHept / 500);
        let result   = Math.pow(base, stats.qHeptExp * 0.1 * level);
        const jack   = 0.001 * (1 + 0.01 * stats.voucher);
        result      *= 1 + jack * 0.1 * level / (1 + jack * stats.shopQuark);
        return result;
    }

}


// ===========================================================================
// upgrades object (mirrors sheet_script `upgrades` const)
// ===========================================================================

// Forward-declare so Upgrade instances can reference it
const upgrades: Record<string, Upgrade> = {};

const _runeOOMCostArray = Upgrade.ambrosiaRuneOOMBonusCost();

Object.assign(upgrades, {
    ambrosiaTutorial: new Upgrade({
        maxLevel: 10,
        cost: level => level * level,
    }),
    ambrosiaQuarks1: new Upgrade({
        maxLevel: 100,
        cost: level => Math.pow(level, 3),
        effects: {
            quark: (input, level) => input * (1 + 0.01 * level),
        },
        row: 1,
        prerequisites: {
            ambrosiaTutorial: 10
        },
    }),
    ambrosiaCubes1: new Upgrade({
        maxLevel: 100,
        cost: level => Math.pow(level, 3),
        effects: {
            cube: (input, level) => input * (1 + 0.05 * level) * Math.pow(1.1, Math.floor(level / 5)),
            oct:  (input, level) => input * (1 + 0.05 * level) * Math.pow(1.1, Math.floor(level / 5)),
        },
        row: 1,
        prerequisites: {
            ambrosiaTutorial: 10
        },
    }),
    ambrosiaLuck1: new Upgrade({
        maxLevel: 100,
        cost: level => Math.pow(level, 3),
        effects: {
            luck: (input, level) => input + 2 * level + 12 * Math.floor(level / 10),
        },
        row: 1,
        prerequisites: {
            ambrosiaTutorial: 10
        },
    }),
    ambrosiaQuarkCube1: new Upgrade({
        maxLevel: 25,
        cost: level => 250 * Math.pow(level, 3),
        effects: {
            cube: (input, level) => input * (1 + 0.001 * Math.floor(Math.pow(Math.log10(stats.quarks + 1) + 1, 2)) * level),
            oct:  (input, level) => input * (1 + 0.001 * Math.floor(Math.pow(Math.log10(stats.quarks + 1) + 1, 2)) * level),
        },
        row: 2,
        blueberryCost: 1,
        prerequisites: {
            ambrosiaCubes1: 30,
            ambrosiaQuarks1: 20
        },
    }),
    ambrosiaLuckCube1: new Upgrade({
        maxLevel: 25,
        cost: level => 250 * Math.pow(level, 3),
        effects: {
            cube: (input, level, loadout) => input * (1 + 0.0005 * loadout.luck * level),
            oct:  (input, level, loadout) => input * (1 + 0.0005 * loadout.luck * level),
        },
        row: 2,
        blueberryCost: 1,
        prerequisites: {
            ambrosiaCubes1: 30,
            ambrosiaLuck1: 20
        },
    }),
    ambrosiaCubeQuark1: new Upgrade({
        maxLevel: 25,
        cost: level => 500 * Math.pow(level, 3),
        effects: {
            quark: (input, level) => input * (1 + 0.0001 * stats.cubeExp * level),
        },
        row: 2,
        blueberryCost: 1,
        prerequisites: {
            ambrosiaQuarks1: 30,
            ambrosiaCubes1: 20
        },
    }),
    ambrosiaLuckQuark1: new Upgrade({
        maxLevel: 25,
        cost: level => 500 * Math.pow(level, 3),
        effects: {
            quark: (input, level, loadout) => input * (1 + 0.0001 * Math.min(loadout.luck, Math.sqrt(1000 * loadout.luck)) * level),
        },
        row: 2,
        blueberryCost: 1,
        prerequisites: {
            ambrosiaQuarks1: 30,
            ambrosiaLuck1: 20
        },
    }),
    ambrosiaCubeLuck1: new Upgrade({
        maxLevel: 25,
        cost: level => 100 * Math.pow(level, 3),
        effects: {
            luck: (input, level) => input + 0.02 * stats.cubeExp * level,
        },
        row: 2,
        blueberryCost: 1,
        prerequisites: {
            ambrosiaLuck1: 30,
            ambrosiaCubes1: 20
        },
    }),
    ambrosiaQuarkLuck1: new Upgrade({
        maxLevel: 25,
        cost: level => 100 * Math.pow(level, 3),
        effects: {
            luck: (input, level) => input + 0.02 * Math.floor(Math.pow(Math.log10(stats.quarks + 1) + 1, 2)) * level,
        },
        row: 2,
        blueberryCost: 1,
        prerequisites: {
            ambrosiaLuck1: 30,
            ambrosiaQuarks1: 20
        },
    }),
    ambrosiaQuarks2: new Upgrade({
        maxLevel: 100,
        cost: level => 500 * level * level,
        effects: {
            quark: (input, level, loadout) => input * (1 + (0.01 + Math.floor(loadout.effectiveLevel("ambrosiaQuarks1") / 10) * 0.001) * level),
        },
        row: 3,
        blueberryCost: 1,
        prerequisites: {
            ambrosiaQuarks1: 40
        },
    }),
    ambrosiaCubes2: new Upgrade({
        maxLevel: 100,
        cost: level => 500 * level * level,
        effects: {
            cube: (input, level, loadout) => input * (1 + (0.1 + 0.01 * Math.floor(loadout.effectiveLevel("ambrosiaCubes1") / 10)) * level) * Math.pow(1.15, Math.floor(level / 5)),
            oct:  (input, level, loadout) => input * (1 + (0.1 + 0.01 * Math.floor(loadout.effectiveLevel("ambrosiaCubes1") / 10)) * level) * Math.pow(1.15, Math.floor(level / 5)),
        },
        row: 3,
        blueberryCost: 1,
        prerequisites: {
            ambrosiaCubes1: 40
        },
    }),
    ambrosiaLuck2: new Upgrade({
        maxLevel: 100,
        cost: level => 250 * level * level,
        effects: {
            luck: (input, level, loadout) => input + (3 + 0.3 * Math.floor(loadout.effectiveLevel("ambrosiaLuck1") / 10)) * level + 40 * Math.floor(level / 10),
        },
        row: 3,
        blueberryCost: 1,
        prerequisites: {
            ambrosiaLuck1: 40
        },
    }),
    ambrosiaQuarks3: new Upgrade({
        maxLevel: 10,
        cost: level => (725000 + 25000 * level) * level,
        effects: {
            quark: (input, level, loadout) => input * (1 + 0.05 * (1 + 0.01 * loadout.effectiveLevel("ambrosiaQuarks2")) * level),
        },
        row: 4,
        blueberryCost: 3,
        prerequisites: {
            ambrosiaQuarks1: 100,
            ambrosiaQuarks2: 50
        },
    }),
    ambrosiaCubes3: new Upgrade({
        maxLevel: 100,
        cost: level => (72500 + 2500 * level) * level,
        effects: {
            cube: (input, level, loadout) => input * (1 + 0.2 * (1 + 0.03 * loadout.effectiveLevel("ambrosiaCubes2")) * level) * Math.pow(1.2, Math.floor(level / 5)),
            oct:  (input, level, loadout) => input * (1 + 0.2 * (1 + 0.03 * loadout.effectiveLevel("ambrosiaCubes2")) * level) * Math.pow(1.2, Math.floor(level / 5)),
        },
        row: 4,
        blueberryCost: 3,
        prerequisites: {
            ambrosiaCubes1: 100,
            ambrosiaCubes2: 50
        },
    }),
    ambrosiaLuck3: new Upgrade({
        maxLevel: 100,
        cost: level => 50000 * level,
        effects: {
            luck: (input, level) => input + stats.blueberries * level,
        },
        row: 4,
        blueberryCost: 3,
        prerequisites: {
            ambrosiaLuck1: 90,
            ambrosiaLuck2: 50
        },
    }),
    ambrosiaLuck4: new Upgrade({
        maxLevel: 50,
        cost: level => (240000 + 10000 * level) * level,
        effects: {
            mLuck: (input, level) => input + 0.0001 * stats.lifetimeAmbExp * level,
        },
        row: 4,
        blueberryCost: 5,
    }),
    ambrosiaPatreon: new Upgrade({
        maxLevel: 1,
        cost: level => level,
        effects: {
            speed: input => input * (1 + stats.patreon),
        },
    }),
    ambrosiaObtainium1: new Upgrade({
        maxLevel: 2,
        cost: level => 50000 * (Math.pow(25, level) - 1) / 24,
        effects: {
            mObt: (input, level, loadout) => input * (1 + 0.001 * loadout.luck * level),
        },
        blueberryCost: 1,
    }),
    ambrosiaOffering1: new Upgrade({
        maxLevel: 2,
        cost: level => 50000 * (Math.pow(25, level) - 1) / 24,
        effects: {
            mOff: (input, level, loadout) => input * (1 + 0.001 * loadout.luck * level),
        },
        blueberryCost: 1,
    }),
    ambrosiaHyperflux: new Upgrade({
        maxLevel: 7,
        cost: level => ([0, 33333, 99999, 199998, 333330, 499995, 999990, 2499975])[level] ?? 0,
        effects: {
            cube: (input, level, _loadout, p4x4 = 50) => input * Math.pow(1 + 0.01 * level, p4x4),
        },
        blueberryCost: 3,
    }),
    ambrosiaBaseOffering1: new Upgrade({
        maxLevel: 40,
        cost: level => 5 * Math.pow(level, 3),
        effects: {
            off: (input, level) => input + level,
        },
        row: 1,
        blueberryCost: 1,
    }),
    ambrosiaBaseObtainium1: new Upgrade({
        maxLevel: 20,
        cost: level => 40 * Math.pow(level, 3),
        effects: {
            obt: (input, level) => input + level,
        },
        row: 1,
        blueberryCost: 1,
    }),
    ambrosiaBaseOffering2: new Upgrade({
        maxLevel: 60,
        cost: level => 20 * Math.pow(level, 3),
        effects: {
            off: (input, level) => input + level,
        },
        row: 3,
        blueberryCost: 2,
        prerequisites: {
            ambrosiaBaseOffering1: 30,
            ambrosiaBaseObtainium1: 10
        },
    }),
    ambrosiaBaseObtainium2: new Upgrade({
        maxLevel: 30,
        cost: level => 160 * Math.pow(level, 3),
        effects: {
            obt: (input, level) => input + level,
        },
        row: 3,
        blueberryCost: 2,
        prerequisites: {
            ambrosiaBaseObtainium1: 15,
            ambrosiaBaseOffering1: 20
        },
    }),
    ambrosiaSingReduction1: new Upgrade({
        maxLevel: 2,
        cost: level => 1e5 * (Math.pow(99, level) - 1) / 98,
        effects: {
            cube: (input, level) => stats.exalt > 0 || stats.postAoAG ? input : input * Upgrade.singDebuff(stats.sing, "cube") / Upgrade.singDebuff(stats.sing - level, "cube"),
            mOff: (input, level) => stats.exalt > 0 || stats.postAoAG ? input : input * Upgrade.singDebuff(stats.sing, "mOff") / Upgrade.singDebuff(stats.sing - level, "mOff"),
            mObt: (input, level) => stats.exalt > 0 || stats.postAoAG ? input : input * Upgrade.singDebuff(stats.sing, "mOff") / Upgrade.singDebuff(stats.sing - level, "mOff"),
        },
        blueberryCost: 2,
        prerequisites: {
            ambrosiaHyperflux: 4
        },
    }),
    ambrosiaInfiniteShopUpgrades1: new Upgrade({
        maxLevel: 20,
        cost: level => 25000 * level,
        effects: {
            cube: (input, level) => stats.exalt === 4 ? input : input * Math.pow(1.012, level) * Upgrade.chronometerEffect(level),
            oct:  (input, level) => stats.exalt === 4 ? input : input * Math.pow(1.012, 1.25 * level) * Upgrade.chronometerEffect(level, stats.mind),
            mObt: (input, level) => stats.exalt === 4 ? input : input * Math.pow(1.012, level),
            mOff: (input, level) => stats.exalt === 4 ? input : input * Math.pow(1.012, level),
        },
        row: 3,
        blueberryCost: 1,
        prerequisites: {
            ambrosiaCubes1: 70,
            ambrosiaBaseOffering1: 20,
            ambrosiaBaseObtainium1: 10
        },
    }),
    ambrosiaInfiniteShopUpgrades2: new Upgrade({
        maxLevel: 20,
        cost: level => 75000 * level,
        effects: {
            cube: (input, level) => stats.exalt === 4 ? input : input * Math.pow(1.012, level) * Math.pow(1.006, (1 + stats.spread) * level),
            oct:  (input, level) => stats.exalt === 4 ? input : input * Math.pow(1.012, 1.25 * level) * Math.pow(1.006, (1 + stats.spread) * stats.mind * level),
            mObt: (input, level) => stats.exalt === 4 ? input : input * Math.pow(1.012, level),
            mOff: (input, level) => stats.exalt === 4 ? input : input * Math.pow(1.012, level),
        },
        row: 4,
        blueberryCost: 2,
        prerequisites: {
            ambrosiaInfiniteShopUpgrades1: 20,
            ambrosiaCubes2: 50,
            ambrosiaBaseOffering2: 20,
            ambrosiaBaseObtainium2: 10
        },
    }),
    ambrosiaSingReduction2: new Upgrade({
        maxLevel: 2,
        cost: level => 1.25e7 * (Math.pow(3, level) - 1) / 2,
        effects: {
            cube: (input, level) => stats.exalt > 0 && !stats.postAoAG ? input * Upgrade.singDebuff(stats.sing, "cube") / Upgrade.singDebuff(stats.sing - level, "cube") : input,
            mOff: (input, level) => stats.exalt > 0 && !stats.postAoAG ? input * Upgrade.singDebuff(stats.sing, "mOff") / Upgrade.singDebuff(stats.sing - level, "mOff") : input,
            mObt: (input, level) => stats.exalt > 0 && !stats.postAoAG ? input * Upgrade.singDebuff(stats.sing, "mOff") / Upgrade.singDebuff(stats.sing - level, "mOff") : input,
        },
        blueberryCost: 4,
        ignoresExalt: true,
    }),
    ambrosiaTalismanBonusRuneLevel: new Upgrade({
        maxLevel: 100,
        cost: level => 100 * level * level,
        effects: {
            cube: input => input, // The effect is computed in ambrosiaRuneOOMBonus
            quark: input => input,
            mObt: input => input,
            mOff: input => input
        },
        row: 1,
    }),
    ambrosiaRuneOOMBonus: new Upgrade({
        maxLevel: 100,
        costArray: _runeOOMCostArray,
        cost: level => _runeOOMCostArray[level] ?? 0,
        effects: {
            cube:  (input, level, loadout) => input * (1 + 0.01  * Upgrade.runeLevelIA(0.001 * level, 0.005 * loadout.effectiveLevel("ambrosiaTalismanBonusRuneLevel"))) / stats.baseIACube,
            quark: (input, level, loadout) => input * (1 + 0.002 * Upgrade.runeLevelIA(0.001 * level, 0.005 * loadout.effectiveLevel("ambrosiaTalismanBonusRuneLevel"))) / stats.baseIAQuark,
            mObt:  (input, level, loadout) => input * (1 + Upgrade.runeLevelSI(level, 0.005 * loadout.effectiveLevel("ambrosiaTalismanBonusRuneLevel"))) / stats.baseSI,
            mOff:  (input, level, loadout) => input * (1 + Upgrade.runeLevelSI(level, 0.005 * loadout.effectiveLevel("ambrosiaTalismanBonusRuneLevel"))) / stats.baseSI,
        },
        row: 3,
    }),
    ambrosiaBrickOfLead: new Upgrade({
        maxLevel: 25,
        cost: level => 10 * Math.pow(level, 3),
        effects: {
            mLuck: (input, level) => input + 0.02 * level,
            speed: (input, level) => input * (1 - 0.02 * level),
        },
        blueberryCost: 4,
    }),
    ambrosiaFreeLuckUpgrades: new Upgrade({
        maxLevel: 25,
        cost: level => 5000 * level * level,
        effects: {
            luck: (input, level) => input + stats.shopLuck * level * (stats.exalt !== 4 ? 1 : 0),
        },
        row: 1,
        blueberryCost: 1,
    }),
    ambrosiaFreeGenerationUpgrades: new Upgrade({
        maxLevel: 3,
        cost: level => 45000 * (Math.pow(10, level) - 1) / 9,
        effects: {
            speed:  (input, level) => stats.exalt === 4 ? input : input * Upgrade.ambGeneration(level),
            rSpeed: (input, level) => stats.exalt === 4 ? input : input * Upgrade.rSpeed(stats.ambSpeed * Upgrade.ambGeneration(level)) / Upgrade.rSpeed(stats.ambSpeed),
        },
        blueberryCost: 1,
    }),
    ambrosiaFreeRedLuckUpgrades: new Upgrade({
        maxLevel: 25,
        cost: level => 10000 * level * level,
        effects: {
            rLuck: (input, level, loadout) => input + (Upgrade.rLuck(level, loadout) - Upgrade.rLuck(0, loadout)) * (stats.exalt !== 4 ? 1 : 0),
        },
        row: 3,
        blueberryCost: 2,
        prerequisites: {
            ambrosiaFreeLuckUpgrades: 10
        },
    }),
    ambrosiaFreeQuarkUpgrades: new Upgrade({
        maxLevel: 10,
        cost: level => 25000 * Math.pow(level, 3),
        effects: {
            quark: (input, level) => stats.exalt === 4 ? input : input * Upgrade.shopQuark(level),
        },
        row: 4,
        blueberryCost: 2,
    }),
});

// Red upgrades (used only for cap checks in the optimizer loop)
const redUpgrades: Record<string, Upgrade> = {
    regularLuck:  new Upgrade({ maxLevel: 100  }),
    blueberries:  new Upgrade({ maxLevel: 5    }),
    viscount:     new Upgrade({ maxLevel: 1    }),
    regularLuck2: new Upgrade({ maxLevel: 250  }),
};


// ===========================================================================
// Loadout class
// ===========================================================================

class Loadout {

    upgradeLevels: Record<string, number>;
    private costCache:  number | null;
    private statCache:  Record<string, number>;

    constructor(loadout?: Loadout | Record<string, number>) {
        this.upgradeLevels = {};
        if (loadout instanceof Loadout) {
            Object.assign(this.upgradeLevels, loadout.upgradeLevels);
        } else if (loadout !== undefined) {
            Object.assign(this.upgradeLevels, loadout);
        }
        this.upgradeLevels.ambrosiaPatreon = 1; // Always buy 1 level of ambrosiaPatreon
        this.costCache = null;
        this.statCache = {};
    }

    // Returns cost of a specific upgrade in the loadout
    getCost(upgrade: string): number {
        return upgrades[upgrade].cost(this.upgradeLevels[upgrade] ?? 0);
    }

    // Returns total cost of the entire loadout
    get cost(): number {
        if (this.costCache === null) {
            this.costCache = 0;
            for (const upgrade in this.upgradeLevels)
                this.costCache += this.getCost(upgrade);
        }
        return this.costCache;
    }

    // Returns total blueberry cost of the entire loadout
    get blueberryCost(): number {
        let result = 0;
        for (const upgrade in this.upgradeLevels)
            if ((this.upgradeLevels[upgrade] ?? 0) > 0)
                result += upgrades[upgrade]?.blueberryCost ?? 0;
        return result;
    }

    // Returns effective level of an upgrade that accounts for bonus levels
    effectiveLevel(upgrade: string): number {
        let level = this.upgradeLevels[upgrade] ?? 0;
        level += stats.bonus[upgrades[upgrade]?.row ?? 0] ?? 0;
        return level;
    }

    // Returns effect of a specific upgrade in the loadout
    getEffect(input: number, upgrade: string, effect: keyof UpgradeEffectMap): number {
        const upgradeData = upgrades[upgrade];
        if (!upgradeData) return input;
        if (!upgradeData.ignoresExalt && (stats.exalt === 6 || stats.exalt === 8))
            return input;
        const fn = upgradeData.effects[effect] as ((input: number, level: number, loadout: Loadout) => number) | undefined;
        if (fn !== undefined)
            return fn(input, this.effectiveLevel(upgrade), this);
        return input;
    }

    get luck(): number {
        return this.getStat("luck");
    }

    // Returns the total value of a given stat for the loadout
    getStat(stat: string, override = false): number {
        if (this.statCache[stat] == null || override) {
            this.statCache[stat] = stat === "mLuck" ? stats.baseMLuck : 1;
            switch (stat) {
                case "luck": {
                    let luck = stats.baseLuck;
                    for (const upgrade in upgrades)
                        luck = this.getEffect(luck, upgrade, "luck");
                    this.statCache[stat] = luck * (1 + this.getStat("mLuck"));
                    break;
                }
                case "ambOct":
                    this.statCache[stat] = this.getStat("allAmb") * this.getStat("oct");
                    break;
                case "amb": {
                    const amount = this.luck + (stats.rAmb > 0 ? 1 : 0);
                    this.statCache[stat] = amount * this.getStat("speed");
                    break;
                }
                case "rLuck":
                    this.statCache[stat] = Upgrade.rLuck(this.effectiveLevel("ambrosiaFreeRedLuckUpgrades"), this);
                    break;
                case "rAmb":
                    this.statCache[stat] = this.getStat("rLuck") * this.getStat("rSpeed");
                    break;
                case "allAmb":
                    this.statCache[stat] = this.getStat("amb") * this.getStat("rAmb");
                    break;
                case "off": {
                    let off = stats.baseOff;
                    for (const upgrade in upgrades)
                        off = this.getEffect(off, upgrade, "off");
                    this.statCache[stat] = off * this.getStat("mOff");
                    break;
                }
                case "obt": {
                    let obt = stats.baseObt;
                    for (const upgrade in upgrades)
                        obt = this.getEffect(obt, upgrade, "obt");
                    this.statCache[stat] = obt * this.getStat("mObt");
                    break;
                }
                default:
                    for (const upgrade in upgrades)
                        this.statCache[stat] = this.getEffect(this.statCache[stat], upgrade, stat as keyof UpgradeEffectMap);
            }
        }
        return this.statCache[stat];
    }

    // Recursively sets levels of all upgrades to produce a valid loadout
    satisfyPrerequisites(): void {
        let repeat = true;
        while (repeat) {
            repeat = false;
            for (const upgrade in this.upgradeLevels) {
                for (const prerequisite in upgrades[upgrade]?.prerequisites) {
                    const required = upgrades[upgrade].prerequisites[prerequisite] ?? 0;
                    if ((this.upgradeLevels[prerequisite] ?? 0) < required) {
                        this.upgradeLevels[prerequisite] = required;
                        repeat = true;
                    }
                }
            }
        }
    }

    fixBlueberryUpgrades(): void {

        if (this.blueberryCost <= stats.blueberries)
            return;

        // Mirror the GS switch/case (with intentional fallthrough) to pre-remove
        // the shop groups first for specific over-budget amounts, before touching luck4.
        // eslint-disable-next-line no-fallthrough
        switch (this.blueberryCost - stats.blueberries) {
            case 9:
            case 10:
                this.upgradeLevels.ambrosiaInfiniteShopUpgrades1 = 0;
                this.upgradeLevels.ambrosiaBaseObtainium1        = 0;
                this.upgradeLevels.ambrosiaBaseOffering1         = 0;
            // falls through
            case 6:
            case 7:
                this.upgradeLevels.ambrosiaInfiniteShopUpgrades2 = 0;
                this.upgradeLevels.ambrosiaBaseObtainium2        = 0;
                this.upgradeLevels.ambrosiaBaseOffering2         = 0;
        }

        if (this.blueberryCost - stats.blueberries === 1)
            this.upgradeLevels.ambrosiaFreeLuckUpgrades = 0;

        // Remove the weakest/most expensive upgrades first
        if (this.blueberryCost > stats.blueberries) { // This frees 6 blueberries
            this.upgradeLevels.ambrosiaLuck4 = 0; // This frees 5 blueberries
            if (this.blueberryCost - stats.blueberries === 1)
                this.upgradeLevels.ambrosiaFreeLuckUpgrades = 0;
        }

        if (this.blueberryCost > stats.blueberries) { // This frees 6 blueberries
            this.upgradeLevels.ambrosiaInfiniteShopUpgrades2 = 0;
            this.upgradeLevels.ambrosiaBaseObtainium2        = 0;
            this.upgradeLevels.ambrosiaBaseOffering2         = 0;
            if (this.blueberryCost - stats.blueberries === 1)
                this.upgradeLevels.ambrosiaFreeLuckUpgrades = 0;
        }

        if (this.blueberryCost > stats.blueberries) { // This frees 3 blueberries
            this.upgradeLevels.ambrosiaInfiniteShopUpgrades1 = 0;
            this.upgradeLevels.ambrosiaBaseObtainium1        = 0;
            this.upgradeLevels.ambrosiaBaseOffering1         = 0;
            if (this.blueberryCost > stats.blueberries)
                this.upgradeLevels.ambrosiaFreeLuckUpgrades = 0;
        }

        this.costCache  = null;
        this.statCache  = {};

    }

    get format(): string {
        const upgradeLevels: Record<string, number> = {};
        for (const upgrade in upgrades)
            if ((this.upgradeLevels[upgrade] ?? 0) > 0)
                upgradeLevels[upgrade] = this.upgradeLevels[upgrade];
        return JSON.stringify(upgradeLevels);
    }

    generateOutput(stat: string, maxLoadout: Loadout, p4x4 = 0): HeaterResultRow {

        this.costCache = null;
        if (this.cost > stats.amb || stat === "")
            return ["Unaffordable", null, "N / A", "N / A", "N / A", "N / A", false];

        const baseLoadout = new Loadout();
        const effect = this.getStat(stat) / baseLoadout.getStat(stat);
        let effectStr: string;
        if (effect >= 1e6) {
            effectStr = effect.toExponential(2);
        } else {
            const digits = Math.max(0, Math.min(2, 4 - Math.floor(Math.log10(Math.max(effect, 1)))));
            effectStr = effect.toFixed(digits);
        }

        return [
            this.format,
            null,
            this.blueberryCost,
            this.cost,
            effectStr,
            p4x4 > 50 ? "Never" : p4x4,
            this.getStat(stat) >= maxLoadout.getStat(stat),
        ];

    }

    // Combines upgrades from both loadouts
    static union(loadout1: Loadout, loadout2: Loadout): Loadout {
        const result = new Loadout(loadout1);
        for (const upgrade in loadout2.upgradeLevels)
            result.upgradeLevels[upgrade] = Math.max(result.upgradeLevels[upgrade] ?? 0, loadout2.upgradeLevels[upgrade]);
        return result;
    }

}


// ===========================================================================
// Table helpers (mirrors sheet_script trimTable/generateTable/mergeTables/findOpt)
// ===========================================================================

// Removes suboptimal loadouts from the table
function trimTable(table: Loadout[], stat: string): Loadout[] {
    table.sort((a, b) => a.cost === b.cost ? b.getStat(stat) - a.getStat(stat) : a.cost - b.cost);
    const result: Loadout[] = [table[0]];
    let last = 0;
    for (let i = 1; i < table.length; i++) {
        if (table[i].getStat(stat) > table[last].getStat(stat)) {
            last = i;
            result.push(table[i]);
        }
    }
    return result;
}

// Generates a table of locally optimal loadouts for selected upgrades
function generateTable(selectedUpgrades: string[], stat: string, minLevels: Record<string, number> = {}): Loadout[] {

    const table: Loadout[] = [];

    const processUpgrade = (upgradeIndex: number, parentLoadout: Loadout): void => {

        if (upgradeIndex >= selectedUpgrades.length)
            return;
        const upgradeName = selectedUpgrades[upgradeIndex];
        const upgrade = upgrades[upgradeName];

        if ((minLevels[upgradeName] ?? 0) <= 0)
            processUpgrade(upgradeIndex + 1, parentLoadout); // Process the next upgrade without having any levels in the current upgrade

        const preLoadout = new Loadout(parentLoadout);
        for (const prerequisite in upgrade.prerequisites) {
            // Avoid double calculations
            if (selectedUpgrades.includes(prerequisite) && (preLoadout.upgradeLevels[prerequisite] ?? 0) < (upgrade.prerequisites[prerequisite] ?? 0))
                return;
        }
        preLoadout.upgradeLevels[upgradeName] = 1;
        preLoadout.satisfyPrerequisites();
        if (preLoadout.blueberryCost > stats.blueberries)
            return;

        for (let level = minLevels[upgradeName] ?? 1; level <= upgrade.maxLevel; level++) {

            const cost = preLoadout.cost + upgrade.cost(level);
            if (stats.amb <= cost)
                return; // No point in adding unaffordable loadouts to the table

            const loadout = new Loadout(preLoadout);
            loadout.upgradeLevels[upgradeName] = level;
            table.push(loadout);

            processUpgrade(upgradeIndex + 1, loadout);

        }

    };

    const baseUpgrades: Record<string, number> = {};
    for (const upgrade of selectedUpgrades)
        baseUpgrades[upgrade] = 0;
    const emptyLoadout = new Loadout(baseUpgrades);
    table.push(emptyLoadout);
    processUpgrade(0, emptyLoadout);
    return trimTable(table, stat);

}

// Merges two tables with locally optimal loadouts
function mergeTables(table1: Loadout[], table2: Loadout[], stat: string, minLevels: Record<string, number> = {}): Loadout[] {
    const result: Loadout[] = [];
    for (const item1 of table1) {
        for (const item2 of table2) {
            const union = Loadout.union(item1, item2);
            if (2 * union.cost - item1.cost - item2.cost > stats.amb)
                break; // Every next loadout will be more expensive
            let skip = false;
            for (const upgrade in minLevels) {
                if ((union.upgradeLevels[upgrade] ?? 0) < minLevels[upgrade]) {
                    skip = true;
                    break;
                }
            }
            if (!skip && union.cost <= stats.amb && union.blueberryCost <= stats.blueberries)
                result.push(union); // No point in adding unaffordable loadouts to the table
        }
    }
    if (result.length <= 0)
        result.push(new Loadout());
    return trimTable(result, stat);
}

// Finds the globally optimal loadout among affordable ones
function findOpt(table1: Loadout[], table2: Loadout[], stat: string, budget = stats.amb): Loadout {

    let power = 0;
    let j = 0;
    const upperBounds: Array<{ budget: number; loadout: Loadout } | undefined> = [];
    // An optimization for large tables
    if (stat !== "allAmb" && table1.length > 100 && table2.length > 100) {
        // Only consider 100 points in each table
        for (let i = 1; i <= table1.length; i += (table1.length - 1) / 100) {
            for (let next = j; Math.round(next) < table2.length; next += (table2.length - 1) / 100) {
                const loadout1 = table1.at(-Math.round(i))!;
                const loadout2 = table2[Math.round(next)];
                const union = Loadout.union(loadout1, loadout2);
                if (2 * union.cost - loadout1.cost - loadout2.cost > budget) {
                    // This unaffordable loadout serves as a local upper bound
                    upperBounds.push({ budget: loadout1.cost, loadout: loadout2 });
                    break; // Every next loadout will be more expensive
                }
                if (union.cost > budget || union.blueberryCost > stats.blueberries)
                    continue; // Can't afford this loadout, try the next one
                power = Math.max(power, union.getStat(stat)); // The best approximate solution
                j = next;
            }
        }
    }

    let opt = table1[0];
    j = 0;
    for (let i = 1; i <= table1.length; i++) {
        const ref = table1.at(-i)!;
        // Find appropriate loadout2 from previously computed upper bounds
        const upperBound = upperBounds.findLast(entry => entry !== undefined && entry.budget >= ref.cost)?.loadout;
        if (upperBound !== undefined) {
            const boundUnion = Loadout.union(ref, upperBound);
            if (boundUnion.getStat(stat) < power)
                continue; // Every loadout generated with table.at(-i) will be suboptimal
        }
        let union = Loadout.union(ref, table2[j]);
        union.fixBlueberryUpgrades();
        if (union.cost > budget)
            continue; // Can't afford this loadout, try a cheaper one
        for (let next = j + 1; next < table2.length; next++) {
            const nextUnion = Loadout.union(ref, table2[next]);
            nextUnion.fixBlueberryUpgrades();
            // Function 'union(i, next).cost' might not be monotone for 'next' because of overlapping upgrades
            // Therefore we compare only total cost of upgrades present in only one of two loadouts at once
            if (2 * nextUnion.cost - ref.cost - table2[next].cost > budget)
                break; // Every next loadout will be more expensive
            if (nextUnion.getStat(stat) <= union.getStat(stat))
                continue;
            if (nextUnion.cost > budget)
                continue; // Can't afford this loadout, try the next one
            union = nextUnion;
            j = next;
        }
        const statDiff = union.getStat(stat) - opt.getStat(stat);
        // If one loadout is stronger than the other, choose it
        // If both are equally powerful, choose the cheaper one
        if (statDiff > 0 || (statDiff === 0 && union.cost < opt.cost))
            opt = union;
    }

    return opt;

}


// ===========================================================================
// Input mapping: HeaterOptimizerInput → stats + options
// ===========================================================================

function fillStatsFromInput(input: HeaterOptimizerInput): void {
    const {
        amb, ramb, ambSpeedNonAmbBerries, blueberries,
        luckBaseNonAmb, luckMultNonAmb, redLuckBase, luckConversion,
        quarksOwned, qHept, cubesExpTotal,
        currentSingularity, singularityReducers,
        exalt, postAoag, transcription,
        ascSpeed, ascSpread, baseObt, baseOff,
        bonusRow2, bonusRow3, bonusRow4, bonusRow5,
        runeSiExp, runeSiRC, runeSiBonusLevelsTotal,
        runeIaExp, runeIaBonusLevelsTotal, runeIaBonusLevelsTalisman,
        baseTalismanPower,
        patreonBonus,
        activeBells,
        jack, freeShopLevelsInfinity,
        chronometerLevel,
        shopAmbrosiaLuck1, shopAmbrosiaLuck2, shopAmbrosiaLuck3, shopAmbrosiaLuck4,
        shopRedLuck1, shopRedLuck2, shopRedLuck3,
        shopAmbrosiaGeneration1, shopAmbrosiaGeneration2, shopAmbrosiaGeneration3, shopAmbrosiaGeneration4,
        shopImproveQuarkHept1, shopImproveQuarkHept2, shopImproveQuarkHept3, shopImproveQuarkHept4, shopImproveQuarkHept5,
        heaterOptions,
        ossifiedTactics, ossifiedTactics2, redberries, viscount,
    } = input;

    // --- Lifetime ambrosia exp: log10((1 + amb) * (1 + rAmb)) + 2
    stats.amb            = amb;
    stats.rAmb           = ramb;
    stats.lifetimeAmbExp = Math.log10((1 + amb) * (1 + ramb)) + 2;

    // --- Ambrosia generation speed (non-ambrosia contributions)
    stats.ambSpeed    = ambSpeedNonAmbBerries;
    stats.blueberries = blueberries;

    // --- Luck
    stats.baseLuck       = luckBaseNonAmb;
    stats.baseMLuck      = luckMultNonAmb + 0.1 * activeBells;
    stats.baseRLuck      = redLuckBase;
    stats.luckConversion = luckConversion;

    // --- Economy
    stats.quarks  = quarksOwned;
    stats.qHept   = qHept;
    stats.cubeExp = cubesExpTotal + 6;

    // --- Singularity
    stats.sing     = currentSingularity - singularityReducers;
    stats.exalt    = exalt;
    stats.postAoAG = postAoag;

    // --- Mind / ascension
    stats.mind   = transcription > 0 ? 0.55 + transcription / 150 : 0.5;
    stats.aSpeed = ascSpeed;
    stats.spread = ascSpread;

    // --- Base resource multipliers
    stats.baseObt = baseObt;
    stats.baseOff = baseOff;

    // --- Bonus levels per row (index 0 unused, rows 1–4)
    stats.bonus = [0, bonusRow2, bonusRow3, bonusRow4, bonusRow5];

    // --- Runes & Talismans
    stats.runeExp    = runeSiExp.log10();
    stats.runeCoefSI = runeSiRC;
    stats.bonusSI    = runeSiBonusLevelsTotal;
    stats.baseSI     = 1 + Upgrade.runeLevelSI();
    stats.expIA      = runeIaExp.log10();
    stats.bonusIA    = runeIaBonusLevelsTotal.toNumber();
    stats.talismanIA = runeIaBonusLevelsTalisman.toNumber();
    stats.talismanP  = baseTalismanPower.toNumber();

    // --- baseIACube/baseIAQuark: depend on current (no-loadout) runeLevelIA
    stats.baseIACube  = 1 + 0.01  * Upgrade.runeLevelIA();
    stats.baseIAQuark = 1 + 0.002 * Upgrade.runeLevelIA();

    // --- Patreon / jack / voucher
    stats.patreon = patreonBonus;
    stats.jack    = jack;
    stats.voucher = freeShopLevelsInfinity; // voucher = free shop levels (infinity line)

    // --- Shop quark base (sum of the 5 quark hept shop upgrades, minus the jack cut bonus)
    const shopQuarkBase = shopImproveQuarkHept1 + shopImproveQuarkHept2
                        + shopImproveQuarkHept3 + shopImproveQuarkHept4
                        + shopImproveQuarkHept5;
    stats.shopQuark = shopQuarkBase - 0.1 * bonusRow5; // removing 1981 Cut from base (bonus[4])

    // --- Chronometer
    stats.chronometer = chronometerLevel;

    // --- Shop luck: count non-zero ambrosiaLuck shop upgrades (×2 per tier), luck4 = 0.6
    stats.shopLuck  = (shopAmbrosiaLuck1 > 0 ? 2 : 0)
                    + (shopAmbrosiaLuck2 > 0 ? 2 : 0)
                    + (shopAmbrosiaLuck3 > 0 ? 2 : 0)
                    + (shopAmbrosiaLuck4 > 0 ? 0.6 : 0);
    if (jack)
        stats.shopLuck += 0.2 * (1 + 0.01 * stats.voucher);

    // --- Shop red luck levels
    stats.shopRLuck = [shopRedLuck1, shopRedLuck2, shopRedLuck3, 0];

    // --- Shop ambrosia generation levels
    stats.shopAmb = [shopAmbrosiaGeneration1, shopAmbrosiaGeneration2,
                     shopAmbrosiaGeneration3, shopAmbrosiaGeneration4];

    // --- qHept exponent bonus from shop improve-quark-hept upgrades (each non-zero = +0.01)
    stats.qHeptExp = [shopImproveQuarkHept1, shopImproveQuarkHept2,
                      shopImproveQuarkHept3, shopImproveQuarkHept4]
                        .filter(Boolean).length * 0.01;
    stats.qHeptExp += shopImproveQuarkHept5 > 0 ? 0.0001 : 0;

    // --- Red amb berries / viscount / ossified tactics
    stats.ossifiedTactics  = ossifiedTactics;
    stats.ossifiedTactics2 = ossifiedTactics2;
    stats.redberries       = redberries;
    stats.viscount         = viscount;

    // --- Adjust baseLuck/baseMLuck/baseRLuck/baseObt/baseOff to remove the
    //     contribution already included in the base loadout (mirrors fillSpreadsheetData).
    const baseLoadout  = new Loadout();
    stats.baseRLuck    = redLuckBase - Math.floor((stats.baseLuck * (1 + stats.baseMLuck) - 100) / stats.luckConversion);
    stats.baseLuck    -= (baseLoadout.luck) / (1 + stats.baseMLuck) - stats.baseLuck;
    stats.baseMLuck   -= upgrades.ambrosiaLuck4.effects.mLuck!(0, stats.bonus[upgrades.ambrosiaLuck4.row] ?? 0, baseLoadout);
    stats.baseObt     -= baseLoadout.getStat("obt") / baseLoadout.getStat("mObt") - stats.baseObt;
    stats.baseOff     -= baseLoadout.getStat("off") / baseLoadout.getStat("mOff") - stats.baseOff;
}

function fillOptionsFromInput(input: HeaterOptimizerInput): void {
    const a = input.heaterOptions;
    // active array order matches HEATER_BRANCH_DEFINITIONS:
    // [calculateAmb, calculateQuarks, calculateCubes, calculateOct,
    //  calculateOff, calculateHyperflux, calculateGen, calculateAmbOct] // Drift with sheet for UI re-ordering ...
    options.calculateAmb       = a[0]  ?? false;
    options.calculateQuarks    = a[1]  ?? false;
    options.calculateCubes     = a[2]  ?? false;
    options.calculateOct       = a[3]  ?? false;
    options.calculateOff       = a[4]  ?? false;
    options.calculateHyperflux = a[5]  ?? false;
    options.calculateGen       = a[6]  ?? false;
    options.calculateAmbOct    = a[7]  ?? false;
}


// ===========================================================================
// Public API
// ===========================================================================

export class HSHeaterOptimizer {

    static createHeaterOptimizerResultFromInput(input: HeaterOptimizerInput): HeaterOptimizationResult {

        // 1. Populate stats + options from input
        fillStatsFromInput(input);
        fillOptionsFromInput(input);

        // 2. Build maxLoadout (used by generateOutput to detect if a loadout is maxed)
        const maxLoadout = new Loadout();
        for (const upgrade in upgrades)
            maxLoadout.upgradeLevels[upgrade] = upgrades[upgrade].maxLevel;

        // 3. Compute
        const output: HeaterOptimizationResult = { input };
        const tableCache: Record<string, Loadout[]> = {};

        // --- Shared luck tables (used by calculateAmb and calculateAmbOct) ---
        tableCache.tableLuck1      = generateTable(["ambrosiaFreeLuckUpgrades", "ambrosiaLuck3"], "luck");
        tableCache.tableLuckHybrid = generateTable(["ambrosiaQuarkLuck1", "ambrosiaCubeLuck1"], "luck");
        tableCache.tableLuck4      = generateTable(["ambrosiaLuck4"], "mLuck");

        if (options.calculateAmb || options.calculateAmbOct) {
            let tableLuck = generateTable(["ambrosiaLuck1", "ambrosiaLuck2"], "luck");
            tableLuck = mergeTables(tableLuck, tableCache.tableLuck1, "luck");
            tableCache.tableLuckAdd = mergeTables(tableLuck, tableCache.tableLuckHybrid, "luck");
        }

        // --- calculateAmb: Luck ---
        if (options.calculateAmb) {
            const loadoutLuck = findOpt(tableCache.tableLuckAdd, tableCache.tableLuck4, "luck");
            const maxAmbLoadout = new Loadout(maxLoadout);
            maxAmbLoadout.upgradeLevels.ambrosiaBrickOfLead = 0;
            output.luck = [loadoutLuck.generateOutput("luck", maxAmbLoadout)];
        }

        // --- calculateAmb: Red Luck ---
        if (options.calculateAmb) {
            const tableLuckMult = generateTable(["ambrosiaBrickOfLead", "ambrosiaLuck4"], "mLuck");
            const tableRLuck    = generateTable(["ambrosiaFreeRedLuckUpgrades"], "rLuck");
            const tableLuck     = mergeTables(tableLuckMult, tableCache.tableLuckAdd, "rLuck");
            const loadoutRLuck  = findOpt(tableLuck, tableRLuck, "rLuck");
            output.rLuck = [loadoutRLuck.generateOutput("rLuck", maxLoadout)];
        }

        // --- calculateAmb / calculateAmbOct: All Amb ---
        let loadoutAllAmb: Loadout | undefined;
        let optLoadoutAllAmb: Loadout | undefined;
        if (options.calculateAmb || options.calculateAmbOct) {
            const tableSpeed  = generateTable(["ambrosiaFreeGenerationUpgrades"], "amb");
            const tableAmb    = mergeTables(tableCache.tableLuck4, tableSpeed, "amb");
            const tableRLuck2 = generateTable(["ambrosiaFreeRedLuckUpgrades"], "rAmb");
            const tableRAmb   = mergeTables(tableAmb, tableRLuck2, "rAmb");
            tableCache.tableAllAmb = mergeTables(tableCache.tableLuckAdd, tableRAmb, "rAmb");

            const tableBrickOfLead = generateTable(["ambrosiaBrickOfLead"], "mLuck");
            loadoutAllAmb = findOpt(tableCache.tableAllAmb, tableBrickOfLead, "allAmb");
            let optLoadout = new Loadout(maxLoadout);
            optLoadout.upgradeLevels.ambrosiaBrickOfLead = 0;
            optLoadoutAllAmb = findOpt([optLoadout], tableBrickOfLead, "allAmb");

            if (options.calculateAmb) {
                output.allAmb = [loadoutAllAmb.generateOutput("allAmb", optLoadoutAllAmb)];
            }

            // If the true max outperforms our best, disable ambOct (matches sheet behaviour)
            if (
                options.calculateAmbOct &&
                optLoadoutAllAmb.getStat("allAmb") > loadoutAllAmb.getStat("allAmb")
            ) {
                options.calculateAmbOct = false;
                if (input.heaterOptions[6]) {
                    output.ambOct = [maxLoadout.generateOutput("", maxLoadout)];
                }
            }
        }

        // --- Shared luck/rune/voucher tables for cube-class calculations ---
        if (
            options.calculateQuarks || options.calculateCubes || options.calculateOct ||
            options.calculateHyperflux || options.calculateOff || options.calculateGen
        ) {
            const luckMinLevel: Record<string, number> = { ambrosiaLuck1: 20 };
            let tableLuck1  = generateTable(["ambrosiaLuck1", "ambrosiaLuck2"], "luck", luckMinLevel);
            let tableLuck2  = mergeTables(tableLuck1, tableCache.tableLuck1, "luck");
            const tableLuckAdd  = mergeTables(tableLuck2, tableCache.tableLuckHybrid, "luck");
            const tableLuckMult = generateTable(["ambrosiaBrickOfLead", "ambrosiaLuck4"], "mLuck");
            tableCache.tableLuck = mergeTables(tableLuckAdd, tableLuckMult, "luck");
            tableCache.tableRune = generateTable(["ambrosiaTalismanBonusRuneLevel", "ambrosiaRuneOOMBonus"], "cube");
        }

        if (options.calculateQuarks || options.calculateCubes || options.calculateOct || options.calculateOff || options.calculateGen) {
            // Local optima for cubes match local optima for quarks and octeracts
            tableCache.tableVoucher = generateTable(["ambrosiaInfiniteShopUpgrades1", "ambrosiaInfiniteShopUpgrades2"], "cube");
        }

        // --- calculateQuarks ---
        if (options.calculateQuarks) {
            // minLevels is computed in the sheet but not forwarded to generateTable — matching that exactly
            const tableQuark1   = generateTable(["ambrosiaQuarks1", "ambrosiaQuarks2", "ambrosiaQuarks3"], "quark");
            const tableQuark2   = generateTable(["ambrosiaCubeQuark1", "ambrosiaFreeQuarkUpgrades"], "quark");
            const tableQuark3   = mergeTables(tableQuark1, tableQuark2, "quark");
            const tableQuarkR   = mergeTables(tableQuark3, tableCache.tableRune, "quark");
            const tableLuckQuark1 = generateTable(["ambrosiaLuckQuark1"], "quark");
            const tableLuckQuark  = mergeTables(tableCache.tableLuck, tableLuckQuark1, "quark");
            const loadoutQuark  = findOpt(tableQuarkR, tableLuckQuark, "quark");
            output.quarks = [loadoutQuark.generateOutput("quark", maxLoadout)];
        }

        // --- Shared cube tables (cubes / oct / ambOct / hyperflux / gen) ---
        if (options.calculateCubes || options.calculateOct || options.calculateAmbOct || options.calculateHyperflux || options.calculateGen) {
            const minLevels: Record<string, number> = {};
            if (stats.amb >= 1e7) {
                minLevels.ambrosiaCubes1 = 100;
                minLevels.ambrosiaCubes2 = 50;
            } else if (stats.amb >= 1e6) {
                minLevels.ambrosiaCubes1 = 50;
            }
            const tableCube1     = generateTable(["ambrosiaCubes1", "ambrosiaCubes2", "ambrosiaCubes3"], "cube", minLevels);
            const tableQuarkCube = generateTable(["ambrosiaQuarkCube1"], "cube");
            const tableCube2     = mergeTables(tableCube1, tableQuarkCube, "cube", minLevels);
            // Local optima for cubes match local optima for octeracts
            tableCache.tableCubeR = mergeTables(tableCube2, tableCache.tableRune, "cube", minLevels);
        }

        if (options.calculateCubes || options.calculateOct || options.calculateHyperflux || options.calculateGen) {
            const tableLuckCube1 = generateTable(["ambrosiaLuckCube1"], "cube");
            // Local optima for cubes match local optima for octeracts
            tableCache.tableLuckCube = mergeTables(tableCache.tableLuck, tableLuckCube1, "cube");
        }

        // --- calculateCubes ---
        if (options.calculateCubes) {
            const tableCubeV     = mergeTables(tableCache.tableCubeR, tableCache.tableVoucher, "cube");
            const tableCubeH     = generateTable(["ambrosiaHyperflux"], "cube");
            const tableCubeTotal = mergeTables(tableCubeV, tableCubeH, "cube");
            const loadoutCube    = findOpt(tableCubeTotal, tableCache.tableLuckCube, "cube");
            output.cubes = [loadoutCube.generateOutput("cube", maxLoadout)];
        }

        // --- Shared oct table ---
        if (options.calculateOct || options.calculateAmbOct || options.calculateGen) {
            tableCache.tableOctV = mergeTables(tableCache.tableCubeR, tableCache.tableVoucher, "oct");
        }

        // --- calculateOct ---
        if (options.calculateOct) {
            const loadoutOct = findOpt(tableCache.tableOctV, tableCache.tableLuckCube, "oct");
            output.oct = [loadoutOct.generateOutput("oct", maxLoadout)];
        }

        // --- Shared sing table (off / hyperflux) ---
        if (options.calculateOff || options.calculateHyperflux) {
            // Local optima for cubes match local optima for offerings/obtainium
            tableCache.tableSing = generateTable(["ambrosiaSingReduction1", "ambrosiaSingReduction2"], "cube");
        }

        // --- calculateOff: Obt + Off ---
        if (options.calculateOff) {
            const tableObt1    = generateTable(["ambrosiaBaseObtainium1", "ambrosiaBaseObtainium2"], "obt");
            const tableObt2    = generateTable(["ambrosiaObtainium1"], "obt");
            const tableObt3    = mergeTables(tableObt1, tableObt2, "obt");
            const tableObt4    = mergeTables(tableObt3, tableCache.tableVoucher, "obt");
            const tableObtSing = mergeTables(tableObt4, tableCache.tableSing, "obt");
            const tableObtRune = mergeTables(tableObtSing, tableCache.tableRune, "obt")
            const loadoutObt   = findOpt(tableObtRune, tableCache.tableLuck, "obt");
            output.obt = [loadoutObt.generateOutput("obt", maxLoadout)];

            const tableOff1    = generateTable(["ambrosiaBaseOffering1", "ambrosiaBaseOffering2"], "off");
            const tableOff2    = generateTable(["ambrosiaOffering1"], "off");
            const tableOff3    = mergeTables(tableOff1, tableOff2, "off");
            const tableOff4    = mergeTables(tableOff3, tableCache.tableVoucher, "off");
            const tableOffSing = mergeTables(tableOff4, tableCache.tableSing, "off");
            const tableOffRune = mergeTables(tableOffSing, tableCache.tableRune, "off")
            const loadoutOff   = findOpt(tableOffRune, tableCache.tableLuck, "off");
            output.off = [loadoutOff.generateOutput("off", maxLoadout)];
        }

        // --- calculateAmbOct ---
        if (options.calculateAmbOct) {
            const loadoutAmbBase = findOpt(tableCache.tableLuckAdd, tableCache.tableAllAmb, "allAmb");
            const loadoutAmbOct  = findOpt([loadoutAmbBase], tableCache.tableOctV, "ambOct");
            output.ambOct = [loadoutAmbOct.generateOutput("oct", maxLoadout)];
        }

        // --- calculateGen ---
        if (options.calculateGen) {
            const genOutput: HeaterResultRowMatrix = [];
            for (let level = 1; level <= 3; level++) {
                const budget = stats.amb - upgrades.ambrosiaFreeGenerationUpgrades.cost(level);
                if (budget < 0) {
                    genOutput.push(maxLoadout.generateOutput("", maxLoadout));
                    continue;
                }
                const loadoutGen = findOpt(tableCache.tableOctV, tableCache.tableLuckCube, "oct", budget);
                loadoutGen.upgradeLevels.ambrosiaFreeGenerationUpgrades = level;
                genOutput.push(loadoutGen.generateOutput("oct", maxLoadout));
            }
            output.gen = genOutput;
        }

        // --- calculateHyperflux ---
        if (options.calculateHyperflux) {
            const oldPostAoAG = stats.postAoAG;
            stats.postAoAG = false;
            const tableVoucher = generateTable(["ambrosiaInfiniteShopUpgrades1", "ambrosiaInfiniteShopUpgrades2"], "cube");
            const tableCubeV   = mergeTables(tableCache.tableCubeR, tableVoucher, "cube");
            const tableSing    = generateTable(["ambrosiaSingReduction1", "ambrosiaSingReduction2"], "cube");
            tableSing.forEach((loadout) => { loadout.upgradeLevels.ambrosiaHyperflux = 0; });
            const tableCubeVS  = mergeTables(tableCubeV, tableSing, "cube");

            const singPrereq = upgrades.ambrosiaSingReduction1.prerequisites.ambrosiaHyperflux ?? 0;
            const loadoutsH: (Loadout | undefined)[] = new Array(8).fill(undefined);
            const thresholds: number[] = new Array(8).fill(0);

            for (let h = 0; h <= upgrades.ambrosiaHyperflux.maxLevel; h++) {
                const budget = stats.amb - upgrades.ambrosiaHyperflux.cost(h);
                if (budget < 0) break;
                const tableCubeVX = stats.exalt > 0 || h >= singPrereq ? tableCubeVS : tableCubeV;
                loadoutsH[h] = findOpt(tableCubeVX, tableCache.tableLuckCube, "cube", budget);
                thresholds[h] = 0;
                for (let p = h - 1; p >= 0; p--) {
                    if (thresholds[p] > 50)
                        continue;
                    thresholds[h] = loadoutsH[p]!.getStat("cube") / loadoutsH[h]!.getStat("cube");
                    thresholds[h] = Math.log2(thresholds[h]) / Math.log2((1 + 0.01 * h) / (1 + 0.01 * p));
                    thresholds[h] = Math.max(0, Math.ceil(thresholds[h]));
                    if (thresholds[h] > Math.min(50, thresholds[p]))
                        break;
                    thresholds[p] = Infinity;
                }
                loadoutsH[h]!.upgradeLevels.ambrosiaHyperflux = h;
            }

            const hyperOutput: HeaterResultRowMatrix = [];
            for (let i = 0; i < 8; i++) {
                const maxLoadoutH = new Loadout(maxLoadout);
                maxLoadoutH.upgradeLevels.ambrosiaHyperflux = i;
                if (i < (upgrades.ambrosiaSingReduction1.prerequisites.ambrosiaHyperflux ?? 4)) maxLoadoutH.upgradeLevels.ambrosiaSingReduction1 = 0;
                if (loadoutsH[i] === undefined) {
                    hyperOutput.push(maxLoadout.generateOutput("", maxLoadout));
                } else {
                    // Calculating effect without hyperflux
                    loadoutsH[i]!.upgradeLevels.ambrosiaHyperflux = 0; // Resetting hyperflux level to compute effect without it
                    loadoutsH[i]!.getStat("cube", true); // Updating cache
                    loadoutsH[i]!.upgradeLevels.ambrosiaHyperflux = i; // Restoring hyperflux level for correct output
                    hyperOutput.push(loadoutsH[i]!.generateOutput("cube", maxLoadoutH, thresholds[i]));
                }
            }
            output.hyperflux = hyperOutput;
            stats.postAoAG = oldPostAoAG;
        }
        return output;
    }
}
