import { AutoAscensionModes, type GameData } from '../../../types/data-types/hs-player-savedata';
import { AchievementId } from '../../hs-core/gds/hs-gamedata-api-achievement';
import { parseGameDataDecimal, parseGameDataNumber } from '../../hs-core/gds/hs-gamedata-utils';

export interface AscensionPayout {
    wowCubes: number;
    wowTesseracts: number;
    wowHypercubes: number;
    wowPlatonicCubes: number;
}

const GAME_COUNTS = new Set(['worlds', 'wowCubes', 'wowTesseracts', 'wowHypercubes', 'wowPlatonicCubes']);
const TRIBUTE_WEIGHTS = {
    accelerator: 0.2, multiplier: 0.2, offering: 0.1, runeExp: 0.1, obtainium: 0.1, antSpeed: 0.1,
    antSacrifice: 0.05, antELO: 0.05, talismanBonus: 0.05, globalSpeed: 0.05,
};

/** Decimal.toJSON() prints "Infinity" above exponent 9e15, even with finite fields.
 * Read the original object in the replacer to preserve the game's Decimal fields. */
export function snapshotCorruptionData(data: GameData): GameData {
    return JSON.parse(JSON.stringify(data, function (this: Record<string, unknown>, key, value) {
        const source = this[key];
        if (source && typeof source === 'object') {
            const { mantissa, exponent } = source as { mantissa?: unknown; exponent?: unknown };
            if (typeof mantissa === 'number' && typeof exponent === 'number') return { mantissa, exponent };
            if (GAME_COUNTS.has(key)) {
                const count = Number(source);
                if (Number.isFinite(count)) return count;
            }
        }
        return value;
    })) as GameData;
}

/** Expected tributes from the ascension that sets the candidate corruption. No cube is opened in the live game. */
export function projectCorruptionTributes(data: GameData, payout: AscensionPayout): GameData {
    if (data.highestSingularityCount < 10 || data.challengecompletions[10] <= 0) return data;
    const countToOpen = (resource: keyof AscensionPayout, percent: number) => {
        const gain = Number.isFinite(payout[resource]) ? Math.max(0, payout[resource]) : 0;
        return Math.floor(Math.min(1e300, parseGameDataNumber(data[resource]) + gain) * (percent / 100));
    };
    const platonics = data.autoOpenPlatonicsCubes && data.challengecompletions[14] > 0
        ? countToOpen('wowPlatonicCubes', data.openPlatonicsCubes) : 0;
    const hypercubes = data.autoOpenHypercubes && data.challengecompletions[13] > 0
        ? countToOpen('wowHypercubes', data.openHypercubes) : 0;
    const tesseracts = data.autoOpenTesseracts && data.challengecompletions[11] > 0
        && (!data.tesseractAutoBuyerToggle || data.resetToggleModes?.ascension === AutoAscensionModes.percentage)
        ? countToOpen('wowTesseracts', data.openTesseracts) : 0;
    const cubes = data.autoOpenCubes ? countToOpen('wowCubes', data.openCubes) : 0;
    const platonicConversion = data.achievements[AchievementId.ConstantTier12]
        ? Math.min(1, parseGameDataDecimal(data.ascendShards).plus(1).log10() / 1e6) : 0;
    const openedHypercubes = hypercubes + Math.floor(platonics * platonicConversion);
    const openedTesseracts = tesseracts + Math.floor(100 * openedHypercubes * data.researches[183]);
    const openedCubes = cubes + Math.floor(12 * openedTesseracts * data.researches[153]);
    const bonusCubes = 1 + (data.cubeUpgrades[13] ?? 0) / 20 + (data.cubeUpgrades[23] ?? 0) / 20 + (data.cubeUpgrades[33] ?? 0) / 20;
    const tributeResearch = (1 + data.researches[138] / 1000) * (1 + 0.8 * data.researches[168] / 1000)
        * (1 + 0.6 * data.researches[198] / 1000);
    const tributes = Object.values(data.cubeBlessings).reduce((sum, count) => sum + count, 0);
    const cubeCapacity = Math.max(0, 1e300 - tributes);
    const taxman = data.singularityChallenges.taxmanLastStand;
    const taxedCubes = taxman.enabled && taxman.completions >= 5;
    const cubeTributes = taxedCubes ? Math.min(cubeCapacity, openedCubes * tributeResearch) : openedCubes * tributeResearch;
    const cubeDivisor = taxedCubes ? (1 + Math.log1p(tributes + cubeTributes)) ** 3 : 1;
    const addTributes = (current: typeof data.cubeBlessings, amount: number) => {
        const result = { ...current };
        for (const key of Object.keys(TRIBUTE_WEIGHTS) as (keyof typeof TRIBUTE_WEIGHTS)[]) {
            result[key] += amount * TRIBUTE_WEIGHTS[key];
        }
        return result;
    };
    const statues = platonics / 40000 * (data.cubeUpgrades[64] ? 2 : 1);
    return {
        ...data,
        cubeBlessings: addTributes(data.cubeBlessings, Math.min(cubeCapacity, cubeTributes * bonusCubes / cubeDivisor)),
        tesseractBlessings: addTributes(data.tesseractBlessings, openedTesseracts),
        hypercubeBlessings: addTributes(data.hypercubeBlessings, openedHypercubes),
        platonicBlessings: {
            cubes: data.platonicBlessings.cubes + 0.33 * platonics,
            tesseracts: data.platonicBlessings.tesseracts + 0.33 * platonics,
            hypercubes: data.platonicBlessings.hypercubes + 0.33 * platonics,
            platonics: data.platonicBlessings.platonics + 0.0099 * platonics,
            hypercubeBonus: data.platonicBlessings.hypercubeBonus + statues,
            taxes: data.platonicBlessings.taxes + statues,
            scoreBonus: data.platonicBlessings.scoreBonus + statues,
            globalSpeed: data.platonicBlessings.globalSpeed + statues,
        },
    };
}
