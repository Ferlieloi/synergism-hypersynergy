import { EventBuffType } from '../../../types/data-types/hs-event-data';
import type { HSGameDataAPI } from '../../hs-core/gds/hs-gamedata-api';
import { parseGameDataDecimal } from '../../hs-core/gds/hs-gamedata-utils';
import type { GameData } from '../../../types/data-types/hs-player-savedata';
import type { SingularityChallengeDataKeys } from '../../../types/data-types/hs-gamedata-api-types';
import { createHeaterCoinsC15Evaluator } from '../hs-heater/hs-heater-coins';
import { buildCorruptionCoinInput } from './hs-corruption-coin-input';
import { corruptionCompletionCeilings, type CorruptionPredictionModel } from './hs-corruption-prediction';
import { createCorruptionProductionRun, corruptionProductionStats } from './hs-corruption-production';
import { createCorruptionGrowth, type CorruptionGrowthState } from './hs-corruption-growth';
import { AchievementId } from '../../hs-core/gds/hs-gamedata-api-achievement';
import { projectCorruptionTributes, type AscensionPayout } from './hs-corruption-snapshot';

export const CORRUPTION_TARGETS = {
    cubes: 'Cubes', tesseracts: 'Tesseracts', hypercubes: 'Hypercubes',
    platonics: 'Platonic cubes', hepteracts: 'Hepteracts',
} as const;
export type CorruptionTarget = keyof typeof CORRUPTION_TARGETS;
export const CORRUPTION_TARGET_ORDER: readonly CorruptionTarget[] = Object.keys(CORRUPTION_TARGETS) as CorruptionTarget[];
const CRYSTAL_AUTOBUY_MILESTONES = [
    'tier1CrystalAutobuy', 'tier2CrystalAutobuy', 'tier3CrystalAutobuy', 'tier4CrystalAutobuy', 'tier5CrystalAutobuy',
] as const;

export function getCorruptionExalt(data: GameData): SingularityChallengeDataKeys | undefined {
    const keys = Object.keys(data.singularityChallenges) as SingularityChallengeDataKeys[];
    return keys.find(key => data.singularityChallenges[key].enabled);
}

export function assertCorruptionPredictionMode(data: GameData): void {
    if (data.currentChallenge.ascension !== 0) throw new Error('Leave the ascension challenge first.');
    if (data.insideSingularityChallenge && !getCorruptionExalt(data)) {
        throw new Error('Wait for the Exalt to finish loading.');
    }
}

export function corruptionMaxLevel(data: GameData): number {
    return data.challengecompletions[11] > 0
        ? data.corruptions.highestCleared + (data.highestSingularityCount >= 2 ? 2 : 1)
        : 0;
}

export function canEarnCorruptionTarget(api: HSGameDataAPI, data: GameData, target: CorruptionTarget, level: number): boolean {
    return api.corruption.isCorruptionCubeUnlocked(level, target)
        && (target !== 'tesseracts' || data.challengecompletions[11] > 0)
        && (target !== 'hypercubes' || data.highestchallengecompletions[13] > 0)
        && (target !== 'platonics' || data.highestchallengecompletions[14] > 0);
}

export function corruptionChallengeCaps(api: HSGameDataAPI, data: GameData): number[] {
    if (data.singularityChallenges.oneChallengeCap.enabled) return [0, ...Array<number>(10).fill(1)];
    const cap = (i: number) => {
        if (i <= 5) return data.researches[105] > 0 ? 400 : 25 + 5 * data.researches[65 + i];
        return 40 + 4 * (data.cubeUpgrades[29] ?? 0)
            + api.quarkShop.getShopUpgradeEffects('challengeExtension', 'reincarnationChallengeCap')
            + (data.platonicUpgrades[5] > 0 ? 10 : 0) + (data.platonicUpgrades[10] > 0 ? 10 : 0)
            + (data.platonicUpgrades[15] > 0 ? 30 : 0)
            + api.goldenQuark.getGQUpgradeEffect('singChallengeExtension', 'reincarnationCapIncrease')
            + api.goldenQuark.getGQUpgradeEffect('singChallengeExtension2', 'reincarnationCapIncrease')
            + api.goldenQuark.getGQUpgradeEffect('singChallengeExtension3', 'reincarnationCapIncrease')
            + Number(api.getSingularityChallengeEffect('oneChallengeCap', 'capIncrease') ?? 0)
            + Number(api.getSingularityChallengeEffect('oneChallengeCap', 'reinCapIncrease2') ?? 0);
    };
    return [0, ...Array.from({ length: 10 }, (_, i) => cap(i + 1))];
}

export function buildCorruptionPredictionModel(api: HSGameDataAPI, data: GameData, target: CorruptionTarget = 'hepteracts',
    payout?: AscensionPayout): CorruptionPredictionModel {
    assertCorruptionPredictionMode(data);
    if (!(data.challengecompletions[11] > 0)) throw new Error('Complete Challenge 11 to unlock corruption levels.');
    if (!api.quarkShop.getShopUpgradeEffects('instantChallenge2', 'unlocked')) throw new Error('This estimate requires Instant Challenge II.');
    const shards = parseGameDataDecimal(data.ascendShards);
    // break_infinity.js revives the serialized string "Infinity" as 1e9000000000000000.
    if (!Number.isFinite(shards.exponent) || (shards.mantissa === 1 && shards.exponent === 9e15)) {
        throw new Error('Ascension shard precision was lost in the save. Calculate from a live game with the original shard value.');
    }
    if (payout) {
        const projected = projectCorruptionTributes(data, payout);
        if (projected !== data) api = api.createCalculationSnapshot(projected);
        data = projected;
    }
    const caps = corruptionChallengeCaps(api, data);
    const baseline = { ...data, currentChallenge: { transcension: 0, reincarnation: 0, ascension: 0 },
        challengecompletions: [...data.challengecompletions] };
    for (let i = 1; i <= 10; i++) baseline.challengecompletions[i] = 0;
    const context = {
        exalt: api.getActiveExalt(), singularity: data.singularityCount,
        postAoag: true,
        talismanPower: api.talisman.allTalismanRuneBonusStatsSum('true_base'),
    };
    const blessingCount = data.platonicBlessings.globalSpeed ?? 0;
    const blessingSpeed = 1 + (blessingCount < 1e4 ? blessingCount : 1e4 ** (7 / 8) * blessingCount ** (1 / 8)) / 1e4;
    const speedFactors = [blessingSpeed,
        api.goldenQuark.getGQUpgradeEffect('intermediatePack', 'globalSpeedMult'),
        1 + api.octeract.actualOcteractUpgradeTotalLevels('octeractImprovedGlobalSpeed') * data.singularityCount / 100,
        Number(api.getSingularityChallengeEffect('limitedTime', 'globalSpeed') ?? 1),
        api.quarkShop.getShopUpgradeEffects('shopChronometerS', 'globalSpeedMult'),
        1 + api.calculateEventSourceBuff(EventBuffType.GlobalSpeed)];
    const fixedSpeedLog = speedFactors.reduce((sum, n) => sum + Math.log10(n), 0);
    const calculateState = (stageAPI: HSGameDataAPI, stage: GameData): CorruptionGrowthState => {
        const input = buildCorruptionCoinInput(stageAPI, stage, api.getCampaignData()?.tokens ?? 0, false);
        const state = createHeaterCoinsC15Evaluator(input, { ...context, postAoag: true })({
            coefficient: input.baselineCoefficientModuleLevel, talisman: input.baselineTalismanModuleLevel,
            stabilizer: 0, brick: api.ambrosia.calculateAmbrosiaUpgradeValue('ambrosiaBrickOfLead'),
        });
        state.globalSpeedLog10 = Math.min(151, state.globalSpeedLog10) + fixedSpeedLog
            - Math.log10(stageAPI.calculateSingularityDebuff('Global Speed'));
        return { ...state, production: corruptionProductionStats(stageAPI, stage) };
    };
    const states = Array.from({ length: 11 }, (_, challenge) => {
        const stage = { ...baseline, currentChallenge: { ascension: 0,
            transcension: challenge <= 5 ? challenge : 0, reincarnation: challenge > 5 ? challenge : 0 } };
        return calculateState(api.createCalculationSnapshot(stage), stage);
    });
    const shardLog = shards.plus(1).log10();
    const c10TaxFactor = Math.log(1 + shardLog) / 300;
    const snapshotAPI = api.createCalculationSnapshot(baseline);
    const freeCrystalProducers = CRYSTAL_AUTOBUY_MILESTONES.map(milestone => api.getLevelMilestone(milestone));
    const startingCompletions = [0, 0, 0, 0, 0, 0, +(data.highestSingularityCount >= 4), +(data.highestSingularityCount >= 7),
        +(data.highestSingularityCount >= 10) + 4 * +(data.highestSingularityCount >= 15), +(data.highestSingularityCount >= 20), 0];
    const startingTotal = startingCompletions.reduce((total, n) => total + n, 0);
    const taxmanOmega = data.singularityChallenges.taxmanLastStand.enabled
        && data.singularityChallenges.taxmanLastStand.completions >= 8;
    const omegaTaxBase = 400 * (1 + data.challengecompletions[13] / 6);
    const observed = data.challengecompletions[10] === caps[10] && caps[10] > 0
        ? { level: api.corruption.getAscensionCorruptionLevel(),
            completions: corruptionCompletionCeilings(caps, startingCompletions)
                .map((ceiling, i) => Math.min(ceiling, data.challengecompletions[i] ?? 0)) }
        : undefined;
    const createRun = (level: number, detailed: boolean) => createCorruptionProductionRun({
        data, stats: states.map(s => s.production), speedLog10: states.map(s => s.globalSpeedLog10), freeCrystalProducers,
        growth: detailed ? createCorruptionGrowth(api, data, level, calculateState) : undefined,
        constructionPenalty: api.corruption.getCorruptionEffectNumber(level, 'construction'),
        viscosity: api.corruption.getCorruptionEffectNumber(level, 'viscosity'),
        recession: api.corruption.getCorruptionEffectNumber(level, 'recession'),
        tax: (challenge, completions, upgrades, baseTax) => Math.max(1e-300,
            (baseTax ?? states[challenge].taxExponent) * (completions[6] > 0 ? 0.965 ** completions[6] / 1.075 : 1)
            * (challenge === 6 ? (1 + completions[6] / 25) ** 2 : 1)
            * Math.exp(-c10TaxFactor * completions[10] * (upgrades[125] ?? 0))
            * (upgrades[121] ? 0.5 : 1)
            * (taxmanOmega ? omegaTaxBase * 1.05 ** Math.max(0, completions.reduce((total, n) => total + n, 0) - startingTotal) : 1)
            * (data.achievements[AchievementId.Challenge6Tier6]
                ? 0.9925 ** completions.slice(6, 11).reduce((a, b) => a + b, 0) : 1)),
    });
    return {
        maxLevel: corruptionMaxLevel(data), caps,
        c10Reduction: 1e8 * [140, 155, 170, 185].reduce((sum, i) => sum + data.researches[i], 0)
            + api.quarkShop.getShopUpgradeEffects('challengeTome', 'c10RequirementReduction')
            + api.quarkShop.getShopUpgradeEffects('challengeTome2', 'c10RequirementReduction'),
        c9c10Scaling: 1 + api.quarkShop.getShopUpgradeEffects('challengeTome', 'c9c10ScalingReduction')
            + api.quarkShop.getShopUpgradeEffects('challengeTome2', 'c9c10ScalingReduction'),
        reincarnationReduction: api.calculateChallenge15Reward('reincarnationChallengeReduction'),
        transcensionReduction: api.calculateChallenge15Reward('transcendChallengeReduction'),
        hyperchallenge: level => api.corruption.getCorruptionEffectNumber(level, 'hyperchallenge'),
        startingCompletions,
        singleCompletionPerTick: taxmanOmega,
        autoTranscension: [71,72,73,74,75].map(i=>data.researches[i]>0),
        retainTranscensionCompletions: !!api.quarkShop.getShopUpgradeEffects('instantChallenge','unlocked'),
        observed,
        createProductionRun: level => createRun(level, false),
        createDetailedProductionRun: level => createRun(level, true),
        rewardLog10: (level, completions) => {
            for (let i = 1; i <= 10; i++) baseline.challengecompletions[i] = completions[i];
            baseline.corruptions = { ...data.corruptions, used: level, next: level, ascensionLevel: level };
            snapshotAPI.clearCache();
            const effective = api.corruption.getEffectiveCorruptionLevel(level);
            if (!canEarnCorruptionTarget(api, data, target, level)) return -Infinity;
            const platonicIndex = { cubes: 1, tesseracts: 2, hypercubes: 3, platonics: 4, hepteracts: 0 }[target];
            const platonicBonus = platonicIndex ? 1 + 0.01 * platonicIndex * effective * data.platonicUpgrades[platonicIndex] : 1;
            const tesseractBonus = target === 'tesseracts' ? 1 + 0.05 * (data.cubeUpgrades[38] ?? 0) * Math.min(20, effective) : 1;
            return (Math.log10(snapshotAPI.calculateCubeBank() as number)
                + Math.log10(api.corruption.getCorruptionCubeRate(target, effective))
                + Math.log10(platonicBonus) + Math.log10(tesseractBonus)
                + Math.log10(1.01) * data.platonicUpgrades[15] * completions[9]) * api.goldenQuark.getGQUpgradeEffect('platonicTau', 'tauPower');
        },
    };
}
