import { EventBuffType } from '../../../types/data-types/hs-event-data';
import type { HSGameDataAPI } from '../../hs-core/gds/hs-gamedata-api';
import { parseGameDataDecimal } from '../../hs-core/gds/hs-gamedata-utils';
import { AntUpgrades } from '../../../types/data-types/hs-gamedata-api-types';
import type { GameData } from '../../../types/data-types/hs-player-savedata';
import { createHeaterCoinsC15Evaluator } from '../hs-heater/hs-heater-coins';
import { buildCorruptionCoinInput } from './hs-corruption-coin-input';
import { cappedCoinRateLog10, type CorruptionPredictionModel } from './hs-corruption-prediction';

export function buildCorruptionPredictionModel(api: HSGameDataAPI, data: GameData): CorruptionPredictionModel {
    if (data.currentChallenge.ascension !== 0 || data.insideSingularityChallenge) throw new Error('Leave the ascension or singularity challenge first.');
    if (!(data.challengecompletions[11] > 0)) throw new Error('Complete Challenge 11 to unlock corruption levels.');
    if (!api.quarkShop.getShopUpgradeEffects('instantChallenge2', 'unlocked')) throw new Error('This estimate requires Instant Challenge II.');
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
    const caps = [0, ...Array.from({ length: 10 }, (_, i) => cap(i + 1))];
    if ([6, 7, 8].some(i => data.highestchallengecompletions[i] < caps[i])) {
        throw new Error('This estimate requires C6–C8 to have reached their current completion caps.');
    }
    const baseline = { ...data, currentChallenge: { transcension: 0, reincarnation: 0, ascension: 0 },
        challengecompletions: [...data.challengecompletions] };
    for (let i = 1; i <= 10; i++) baseline.challengecompletions[i] = 0;
    const context = {
        exalt: 0, singularity: data.singularityCount,
        postAoag: true,
        talismanPower: api.talisman.allTalismanRuneBonusStatsSum('true_base'),
    };
    const blessingCount = data.platonicBlessings.globalSpeed ?? 0;
    const blessingSpeed = 1 + (blessingCount < 1e4 ? blessingCount : 1e4 ** (7 / 8) * blessingCount ** (1 / 8)) / 1e4;
    const speedFactors = [blessingSpeed,
        api.goldenQuark.getGQUpgradeEffect('intermediatePack', 'globalSpeedMult'),
        1 + api.octeract.actualOcteractUpgradeTotalLevels('octeractImprovedGlobalSpeed') * data.singularityCount / 100,
        Number(api.getSingularityChallengeEffect('limitedTime', 'ascensionSpeed') ?? 1),
        api.quarkShop.getShopUpgradeEffects('shopChronometerS', 'globalSpeedMult'),
        1 + api.calculateEventSourceBuff(EventBuffType.GlobalSpeed)];
    const fixedSpeedLog = speedFactors.reduce((sum, n) => sum + Math.log10(n), 0);
    const states = [0, 9].map(challenge => {
        const stage = { ...baseline, currentChallenge: { ...baseline.currentChallenge, reincarnation: challenge } };
        const stageAPI = api.createCalculationSnapshot(stage);
        const input = buildCorruptionCoinInput(stageAPI, stage, api.getCampaignData()?.tokens ?? 0);
        const state = createHeaterCoinsC15Evaluator(input, { ...context, postAoag: true })({
            coefficient: input.baselineCoefficientModuleLevel, talisman: input.baselineTalismanModuleLevel,
            stabilizer: 0, brick: api.ambrosia.calculateAmbrosiaUpgradeValue('ambrosiaBrickOfLead'),
        });
        state.globalSpeedLog10 = Math.min(151, state.globalSpeedLog10) + fixedSpeedLog
            - Math.log10(stageAPI.calculateSingularityDebuff('Global Speed'));
        return state;
    });
    const antFlat = parseGameDataDecimal(api.antUpgrade.getAntUpgradeEffectValue(AntUpgrades.Coins, 'coinMultiplier')).log10();
    const atomPower = 1 + (1 - 2 ** (-1 / 160)) * parseGameDataDecimal(data.reincarnationShards).plus(1).log10();
    const researchPower = (1 + data.researches[36] / 20) * (1 + data.researches[37] / 40) * (1 + data.researches[38] / 40)
        * api.antUpgrade.getAntUpgradeEffectValue(AntUpgrades.BuildingCostScale, 'buildingPowerMult');
    const coinBuildings = api.building.getTotalCoinBuildingsOwned();
    const shardLog = parseGameDataDecimal(data.ascendShards).plus(1).log10();
    const c10TaxFactor = (data.upgrades[125] ?? 0) * Math.log(1 + shardLog) / 300;
    const snapshotAPI = api.createCalculationSnapshot(baseline);
    return {
        maxLevel: data.corruptions.highestCleared + (data.highestSingularityCount >= 2 ? 2 : 1), caps,
        c10Reduction: 1e8 * [140, 155, 170, 185].reduce((sum, i) => sum + data.researches[i], 0)
            + api.quarkShop.getShopUpgradeEffects('challengeTome', 'c10RequirementReduction')
            + api.quarkShop.getShopUpgradeEffects('challengeTome2', 'c10RequirementReduction'),
        c9c10Scaling: 1 + api.quarkShop.getShopUpgradeEffects('challengeTome', 'c9c10ScalingReduction')
            + api.quarkShop.getShopUpgradeEffects('challengeTome2', 'c9c10ScalingReduction'),
        reincarnationReduction: api.calculateChallenge15Reward('reincarnationChallengeReduction'),
        transcensionReduction: api.calculateChallenge15Reward('transcendChallengeReduction'),
        hyperchallenge: level => api.corruption.getCorruptionEffectNumber(level, 'hyperchallenge'),
        coinRateLog10: (challenge, completions) => {
            const state = states[challenge === 9 ? 1 : 0];
            const tax = Math.max(1e-300, state.taxExponent * (completions[6] > 0 ? 0.965 ** completions[6] / 1.075 : 1)
                * Math.exp(-c10TaxFactor * completions[10]));
            const powerLog = Math.log10((atomPower + 0.25 * completions[8]) * researchPower)
                * (1 + 0.09 * (data.cubeUpgrades[12] ?? 0)) * (1 + 0.05 * (data.cubeUpgrades[36] ?? 0));
            return cappedCoinRateLog10(tax, antFlat + coinBuildings * powerLog, state.globalSpeedLog10);
        },
        rewardLog10: (level, completions) => {
            for (let i = 1; i <= 10; i++) baseline.challengecompletions[i] = completions[i];
            baseline.corruptions = { ...data.corruptions, used: level, next: level, ascensionLevel: level };
            snapshotAPI.clearCache();
            const effective = api.corruption.getEffectiveCorruptionLevel(level);
            return (Math.log10(snapshotAPI.calculateCubeBank() as number)
                + Math.log10(api.corruption.getCorruptionCubeRate('cubes', effective))
                + Math.log10(1 + 0.01 * effective * data.platonicUpgrades[1])
                + Math.log10(1.01) * data.platonicUpgrades[15] * completions[9]) * api.goldenQuark.getGQUpgradeEffect('platonicTau', 'tauPower');
        },
    };
}
