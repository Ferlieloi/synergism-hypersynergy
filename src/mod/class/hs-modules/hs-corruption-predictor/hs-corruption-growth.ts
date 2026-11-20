import Decimal from 'break_infinity.js';
import type { GameData, GameDecimal } from '../../../types/data-types/hs-player-savedata';
import { AntUpgrades, type RuneKeys } from '../../../types/data-types/hs-gamedata-api-types';
import { EventBuffType } from '../../../types/data-types/hs-event-data';
import { AchievementId } from '../../hs-core/gds/hs-gamedata-api-achievement';
import type { HSGameDataAPI } from '../../hs-core/gds/hs-gamedata-api';
import { getBlessingEXP, getRuneEXP, getSpiritEXP, parseGameDataDecimal } from '../../hs-core/gds/hs-gamedata-utils';
import { heaterCoinRunePurchasedLevel } from '../hs-heater/hs-heater-coins';
import { addProductionLogs, subtractLogs, type CorruptionProductionStats } from './hs-corruption-production';
import { ANT_MASTERY } from './hs-corruption-ant-mastery';

export interface CorruptionGrowthState {
    production: CorruptionProductionStats;
    globalSpeedLog10: number;
    taxExponent: number;
}

export interface CorruptionGrowth {
    state(challenge: number, completions: readonly number[], upgrades: readonly number[]): CorruptionGrowthState;
    awardReset(challenge: number, completions: readonly number[], upgrades: readonly number[], crystal: number): void;
    advance(seconds: number, challenge: number, completions: readonly number[], upgrades: readonly number[],
        crystal: number, particles: number, speed: number): number;
}

const FIRST_RUNES = ['speed', 'duplication', 'prism', 'thrift', 'superiorIntellect'] as const;
const RUNES = [...FIRST_RUNES, 'infiniteAscent', 'antiquities', 'horseShoe',
    'finiteDescent', 'topHat'] as const satisfies readonly RuneKeys[];
const BLESSING_COSTS = [1e6, 1e7, 1e9, 1e12, 1e15];
const SPIRIT_COSTS = [1e45, 1e52, 1e60, 1e72, 1e85];
// AntProducers and AntUpgrades data, with logarithmic costs and generation rates.
const PRODUCERS: readonly (readonly [cost: number, scale: number, production: number])[] = [
    [0, Math.log10(3), -2], [1, 1, Math.log10(1.5e-4)], [5, 2, Math.log10(5e-6)],
    [12, 4, Math.log10(3e-5)], [145, 8, -30], [700, 16, -90], [5000, 32, -600],
    [25000, 64, -3500], [1e6, 128, -110000]];
const UPGRADE_COSTS: readonly (readonly [cost: number, scale: number])[] = [
    [2, 1], [2, 1], [3, 1], [3, 1], [5, 2], [6, 2], [11, 2], [15, 3],
    [20, 3], [6, 2], [120, 20], [300, 100], [70, 4], [400, 10], [300, 2], [37777, 2000]];
const PRODUCER_UNLOCKS = [AchievementId.AntCrumbsTier5, AchievementId.SacMultTier1, AchievementId.SacMultTier2,
    AchievementId.SacMultTier3, AchievementId.SacMultTier4, AchievementId.SacMultTier5, AchievementId.SacMultTier6,
    AchievementId.SacMultTier7, AchievementId.SacMultTier8];
const ELO_THRESHOLDS = [[100, 100], [100, 1000], [100, 3000], [700, 20000], [Infinity, 100000]];
const ANT_UPDATE = 0.05;
const STAT_UPDATE = 0.5;
const MIND_DIVISOR = 1e6;
const log = Math.log10;
const decimal = (value: Decimal) => value as unknown as GameDecimal;
const fromLog = (exponent: number) => exponent === -Infinity ? new Decimal(0) : Decimal.pow(10, exponent);
const sum = (values: readonly number[]) => values.reduce((a, b) => a + b, 0);
const logProduct = (factors: readonly number[]) => sum(factors.map(log));

function getStages(elo: number): [number, number] {
    let stages = 0;
    for (const [length, cost] of ELO_THRESHOLDS) {
        const earned = Math.min(length, Math.floor(elo / cost));
        elo -= earned * cost;
        stages += earned;
        if (earned < length) return [stages, cost - elo];
    }
    return [stages, Infinity];
}

/** Only the shortlist advances the reset-sensitive parts of the live snapshot. */
export function createCorruptionGrowth(api: HSGameDataAPI, source: GameData, level: number,
    calculateState: (api: HSGameDataAPI, data: GameData) => CorruptionGrowthState): CorruptionGrowth {
    const before = api.createCalculationSnapshot(source);
    const levelReward = before.calculateSynergismLevel();
    const sing = source.highestSingularityCount;
    const { limitedAscensions, limitedTime, noOcteracts, taxmanLastStand, barDependence } = source.singularityChallenges;
    const taxmanCap = taxmanLastStand.enabled && taxmanLastStand.completions >= 2;
    const antSpeedExponent = taxmanLastStand.enabled && taxmanLastStand.completions >= 8 ? 0.23 : 1;
    const barIncome = barDependence.enabled ? before.ambrosia.calculateAmbrosiaBarIncome() : null;
    // Bar Dependence awards reset time on blue rewards and ascension time on red rewards.
    const resetClockRate = barDependence.enabled ? 0.01 * (barIncome?.blueRewardPerSecond ?? 0) : 1;
    const ascensionClockRate = barDependence.enabled ? 0.05 * (barIncome?.redRewardPerSecond ?? 0) : 1;
    const ascensionCrumbs = sing >= 20 ? 100 : 0;
    const sacrificeCrumbs = sing >= 20 ? 50 : 0;
    const r = (i: number) => source.researches[i] ?? 0;
    const cube = (i: number) => source.cubeUpgrades[i] ?? 0;
    const plat = (i: number) => source.platonicUpgrades[i] ?? 0;
    const ach = (i: AchievementId) => Number(!!source.achievements[i]);
    const stage = {
        ...source,
        currentChallenge: { ascension: 0, transcension: 0, reincarnation: 0 },
        corruptions: { ...source.corruptions, used: level, next: level, ascensionLevel: level },
        challengecompletions: [...source.challengecompletions],
        highestchallengecompletions: [...source.highestchallengecompletions],
        upgrades: [...source.upgrades],
        ascensionCount: source.ascensionCount + Number(limitedAscensions.enabled),
        ascensionCounter: 0,
        runeEXP: RUNES.map(key => decimal(getRuneEXP(source, key))),
        blessingEXP: FIRST_RUNES.map(key => decimal(getBlessingEXP(source, key))),
        spiritEXP: FIRST_RUNES.map(key => decimal(getSpiritEXP(source, key))),
        ants: { ...source.ants, upgrades: { ...source.ants.upgrades }, crumbs: decimal(fromLog(ascensionCrumbs)),
            crumbsThisSacrifice: decimal(fromLog(0)), immortalELO: 0, rebornELO: 0 },
    } satisfies GameData;
    const snapshot = api.createCalculationSnapshot(stage);
    const ascensionSpeed = before.goldenQuark.getGQUpgradeEffect('oneMind', 'unlocked')
        ? MIND_DIVISOR : snapshot.calculateAscensionSpeedMult();
    // The detailed run keeps achievement and account progression at the starting snapshot.
    snapshot.calculateSynergismLevel = () => levelReward;
    for (const [i, key] of RUNES.entries()) {
        if (i >= 5 && key !== 'finiteDescent') continue;
        const seed = snapshot.rune.runes[key].costCoefficient.times(Decimal.pow(10, 3 * cube(26) / snapshot.rune.getLevelsPerOOM(key)).minus(1));
        stage.runeEXP[i] = decimal(seed);
    }
    stage.challengecompletions.fill(0, 1, 11);
    stage.highestchallengecompletions.fill(0, 1, 11);

    const antToggles = source.ants.toggles;
    const tiers = Math.min(PRODUCERS.length, sum(PRODUCER_UNLOCKS.map(ach)));
    const autobuy = [ach(AchievementId.SacMultTier1), ach(AchievementId.SacMultTier1), ach(AchievementId.SacMultTier2),
        ach(AchievementId.SacMultTier3), ach(AchievementId.SacMultTier3), ach(AchievementId.SacMultTier4),
        ach(AchievementId.SacCountTier2), ach(AchievementId.AntCrumbsTier6), ach(AchievementId.SacCountTier2),
        ach(AchievementId.SacCountTier2), ach(AchievementId.SacCountTier2), r(145),
        before.getLevelMilestone('antSpeed2Autobuyer'), before.getLevelMilestone('wowCubesAutobuyer'),
        before.getLevelMilestone('ascensionScoreAutobuyer'), before.getLevelMilestone('mortuus2Autobuyer')];
    const owned = Array<number>(PRODUCERS.length).fill(0);
    const generated = [...owned];
    const masteries = [...owned];
    const masteryCaps = owned.map((_, i) => source.ants.masteries[i]?.highestMastery ?? 0);
    const purchased = stage.ants.upgrades;
    const resetAnts = (ascension: boolean) => {
        owned.fill(0);
        generated.fill(-Infinity);
        masteries.fill(0);
        owned[0] = sing >= 15 ? 40 : sing >= 10 ? 20 : 0;
        owned[1] = sing >= 15 ? 20 : 0;
        owned[2] = sing >= 20 ? 25 : 0;
        for (let i = 0; i < UPGRADE_COSTS.length; i++) {
            if (i === AntUpgrades.Mortuus2) continue;
            if (ascension || i === AntUpgrades.AntSpeed || i === AntUpgrades.AntSacrifice || i === AntUpgrades.AntELO)
                purchased[i] = 0;
        }
        purchased[AntUpgrades.AntSpeed] = sing >= 20 ? 25 : sing >= 10 ? 10 : 0;
        if (sing >= 20) purchased[AntUpgrades.Mortuus] = Math.max(1, purchased[AntUpgrades.Mortuus]);
    };
    resetAnts(true);

    const halfMind = before.goldenQuark.getGQUpgradeEffect('halfMind', 'unlocked');
    const hyperTribute = before.calculateHypercubeBlessingMultiplierPlatonicBlessing() / 1000;
    const tribute = (n: number, p: number) => n < 1000 ? n : 1000 ** (1 - p) * n ** p;
    const tributeLog = (n: number, power: number) => n < 1000 ? log(n) : 3 * (1 - power) + power * log(n);
    const nestedTribute = (key: 'offering' | 'antSacrifice' | 'antELO', hyper: number, tess: number) => {
        const hyperEffect = 1 + hyperTribute * tribute(source.hypercubeBlessings[key] ?? 0, hyper);
        return 1 + hyperEffect / 1000 * tribute(source.tesseractBlessings[key] ?? 0, tess);
    };
    const offeringCubeLog = addProductionLogs(0, log(nestedTribute('offering', 1 / 6, 1 / 3) / 2000)
        + tributeLog(source.cubeBlessings.offering ?? 0, 2 / 3 + cube(24) / 150));
    const sacrificeCubeLog = addProductionLogs(0, log(nestedTribute('antSacrifice', 1 / 12, 1 / 6) / 5000)
        + tributeLog(source.cubeBlessings.antSacrifice ?? 0, 2 / 3 + cube(15) / 50));
    const antSpeedCubeLog = (2 + cube(22) / 40) * log(1 + (source.cubeBlessings.antSpeed ?? 0) / 1000
        + 0.1 * Math.min(source.cubeBlessings.antSpeed ?? 0, 1)) + log(1 + (source.tesseractBlessings.antSpeed ?? 0) / 1000)
        + log(1 + hyperTribute * tribute(source.hypercubeBlessings.antSpeed ?? 0, 0.5));
    const tokens = before.getCampaignData()?.tokens ?? 0;
    const campaignOffering = 1 + 0.004 * Math.min(tokens, 25) - 0.4 * Math.expm1(-Math.max(tokens - 25, 0) / 500)
        - 0.5 * Math.expm1(-Math.max(tokens - 2500, 0) / 5000);
    const offeringKeys = ['offeringEX', 'cashGrab', 'shopPanthema', 'cashGrab2', 'offeringEX2', 'offeringEX3', 'shopEXUltra'] as const;
    const gqOffering = ['starterPack', 'singOfferings1', 'singOfferings2', 'singOfferings3', 'singCitadel', 'singCitadel2'] as const;
    const offeringGQLevels = gqOffering.map(key => before.goldenQuark.actualGQUpgradeTotalLevels(key));
    const [starter, charge, storm, tempest, citadel, citadel2] = offeringGQLevels;
    const citadelMult = (n: number) => (1 + 0.02 * n) * (1 + Math.floor(n / 10) / 100);
    const purpleOffering = before.purple.getPurpleReactorUpgradeLevel('offerings');
    const purpleELO = before.purple.getPurpleReactorUpgradeLevel('lifetimeHoneyAntELO');
    const purpleReborn = before.purple.getPurpleReactorUpgradeLevel('lifetimeHoneyRebornELOSpeed');
    const honey = source.purpleReactor?.lifetimePurpleHoney ?? 0;
    const octeracts = Math.min(1e300, source.totalWowOcteracts ?? 0);
    const octeractBonus = noOcteracts.enabled ? 1 : octeracts < 1000 ? 1 + 0.002 * octeracts : 3 * (log(octeracts) - 2)
        ** (2 + Number(before.getSingularityChallengeEffect('noOcteracts', 'octeractPow') ?? 0));
    const obtainiumLog = Math.max(0, parseGameDataDecimal(source.obtainium).log10());
    const taxmanOfferingLog = taxmanLastStand.enabled ? -Math.min(500, Math.floor(1 + obtainiumLog)) * log(2.5) : 0;
    const timeLimit = limitedTime.completions >= 10 ? 114 - 6 * (limitedTime.completions - 10) : 660 - 60 * limitedTime.completions;
    const timePenaltyLog = limitedTime.enabled
        ? log(limitedTime.completions >= 10 ? 60 + 10 * (limitedTime.completions - 10) : 10 + 3 * limitedTime.completions) / 60 : 0;
    const singularityClockRate = before.ambrosia.getAmbrosiaUpgradeEffects('ambrosiaBrickOfLead').singularitySpeedMult;
    const offeringFixedLog = offeringCubeLog + levelReward * log(1.01) + Math.max(0, levelReward - 100) * log(1.02)
        + taxmanOfferingLog - parseGameDataDecimal(before.corruption.getCorruptionEffect(level, 'drought')).log10()
        + logProduct([1 + r(119) / 200, 1 + 0.02 * (source.constantUpgrades[3] ?? 0), tokens > 0 ? 1.2 : 1,
            campaignOffering, 1 + 0.12 * source.challengecompletions[12], 1 + r(200) / 10000,
            1 + 0.05 * cube(46), 1 + 0.0002 * cube(50), 1 + plat(5), 1 + 2.5 * plat(10), 1 + 5 * plat(15),
            before.calculateChallenge15Reward('offering'), 1 / before.calculateSingularityDebuff('Offering'),
            1 + cube(54) / 100, 1 + 0.01 * before.octeract.actualOcteractUpgradeTotalLevels('octeractOfferings1'),
            before.getSingularityChallengeEffect('noOcteracts', 'offeringBonus') ? octeractBonus ** 1.25 : 1,
            before.ambrosia.getAmbrosiaUpgradeEffects('ambrosiaOffering1').offeringMult,
            before.ambrosia.getRedAmbrosiaUpgradeEffects('tutorial').offeringMult,
            before.ambrosia.getRedAmbrosiaUpgradeEffects('redAmbrosiaOffering').unlockRedAmbrosiaOffering
                ? 1 + (source.lifetimeRedAmbrosia ?? 0) ** 0.6 / 100 : 1,
            1 + Math.log1p(purpleOffering / 100) * 1.002 ** Math.floor(purpleOffering / 100),
            ...offeringKeys.map(key => before.quarkShop.getShopUpgradeEffects(key, 'offeringMult')),
            1 + 5 * starter, 1 + 0.02 * charge, 1 + 0.08 * storm, 1 + 0.04 * tempest,
            citadelMult(citadel), citadelMult(citadel2),
            1 + before.calculateEventSourceBuff(EventBuffType.Offering)]);
    const autoRune = source.autoSacrificeToggle && before.quarkShop.getShopUpgradeEffects('offeringAuto', 'autoRune');
    const allRunes = !!cube(20);
    const selectedRune = (source as GameData & { autoSacrificeRune?: number | null; autoSacrifice?: number });
    const runeIndex = selectedRune.autoSacrificeRune ?? ((selectedRune.autoSacrifice ?? 0) - 1);
    const runeInterval = 1 / Math.max(1, before.quarkShop.getShopUpgradeEffects('offeringAuto', 'autoRuneSpeedMult')
        * (allRunes ? 2 : 1) * before.getLevelMilestone('runeAutobuyImprover'));
    const canBuyRune = RUNES.map((key, i) => (allRunes || runeIndex === i) && (i !== 5 || sing >= 30)
        && (i !== 6 || sing >= 50) && before.rune.runes[key].isUnlocked(source));
    const runeCount = Math.max(1, canBuyRune.filter(Boolean).length);
    const freeAntLevels = (c: readonly number[]) => (c[9] + Math.round(2000 * (1 - 0.999 ** (source.constantUpgrades[6] ?? 0)))
        + 12 * source.challengecompletions[11] + 2 * r(97) + 2 * r(98) + r(102) + 2 * r(132) + Math.floor(r(200) / 200)
        + before.achievement.AchRewards.freeAntUpgrades()) * before.calculateChallenge15Reward('bonusAntLevel');
    const antSpeedBase = 1.1 + (r(101) + r(162)) / 1000;
    // The run advances blessing EXP, using the saved Obtainium balance as its reference.
    const antBlessingMultiplier = (1 + 6.9 * r(134) / 100) * before.talisman.getTalismanEffects('midas').blessingBonus
        * (1 + 0.1 * parseGameDataDecimal(source.epicFragments).plus(1).log10() * r(174))
        * (1 + 2 * r(194) / 100) * (1 + 0.25 * r(160)) * before.calculateChallenge15Reward('blessingBonus');
    const antConstant = antSpeedCubeLog + logProduct([1 + 0.1 * parseGameDataDecimal(source.ascendShards).plus(1).log10()
        * (source.constantUpgrades[5] ?? 0), before.calculateChallenge15Reward('antSpeed'),
        1 + 0.2 * ach(AchievementId.AntCrumbsTier3), 1 + 0.25 * ach(AchievementId.AntCrumbsTier4),
        1 + 0.4 * ach(AchievementId.AntCrumbsTier5),
        1 + 99999 * before.octeract.actualOcteractUpgradeTotalLevels('octeractStarter'),
        sing >= 100 ? 1e12 : sing >= 70 ? 1e6 : sing >= 40 ? 1e3 : sing > 0 ? 4.44 : 1]);
    const eloPerk = [2, 10, 26, 50, 82, 122, 170, 197, 226, 257, 290].filter(n => source.singularityCount >= n).length;
    const eloMultPerk = [3, 11, 27, 51, 83, 123, 171, 198, 227, 258, 291].filter(n => source.singularityCount >= n).length;
    const eloBase = (levelReward >= 60 ? 25 * Math.min(71, levelReward - 59) + 50 * Math.max(0, Math.min(100, levelReward - 100))
        + 100 * Math.max(0, levelReward - 200) : 0) + before.quarkShop.getShopUpgradeEffects('antSpeed', 'antELO')
        + 25 * (r(108) + r(109)) + 2 * r(120) + 50 * r(123) + 0.02 * r(169) + 666 * r(178);
    const eloMult = 1 + before.calculateSingularityDebuff('Ant ELO') + (eloMultPerk > 0 ? 0.001 + 0.0009 * (eloMultPerk - 1) : 0)
        - before.corruption.getCorruptionEffectNumber(level, 'blunders')
        + (purpleELO > 0 ? (0.0001 + 0.00001 * purpleELO) * Math.log1p(honey) : 0);
    const eloRegen = 0.01 * (1 + r(110) / 50) * (1 + r(120) / 250) * (1 + r(148) / 50)
        * before.talisman.getTalismanEffects('mortuus').antBonus * (1 + plat(12) / 10)
        * (1 + 0.1 * log(1 + source.cubeBlessings.antELO) * nestedTribute('antELO', 1 / 6, 1 / 3)) ** (1 + cube(25) / 100)
        * (purpleReborn > 0 ? 1 + (0.04 + 0.004 * purpleReborn) * Math.log1p(honey / 100) : 1);
    const rebornEloBonus = limitedTime.enabled && before.rune.getRuneLevelFromEXP('antiquities', getRuneEXP(source, 'antiquities')) === 0
        ? 5 : 1;
    const speedPerks = [1, 9, 25, 49, 81, 121, 169, 196, 225, 256, 289]
        .filter(n => source.singularityCount >= n).length;
    const stageSpeed = 0.98 + (speedPerks > 0 ? 0.0001 + 0.00009 * (speedPerks - 1) : 0);

    let crumbs = ascensionCrumbs, crumbsThisSacrifice = 0, offerings = -Infinity;
    let antReal = 0, antTime = 0, prestigeTime = 0, runeTime = 0, antTimer = 0;
    let passiveOfferings = 0;
    let clock = 0, refreshedAt = -Infinity, stageIndex = -1, effectiveELO = 0, antSpeedRune = 1, antBlessingLog = 0;
    let cached: CorruptionGrowthState;
    let speedLog = 0;

    function sync(challenge: number, c: readonly number[], upgrades: readonly number[]): HSGameDataAPI {
        stage.currentChallenge.transcension = challenge <= 5 ? challenge : 0;
        stage.currentChallenge.reincarnation = challenge >= 6 ? challenge : 0;
        stage.ants.crumbs = decimal(fromLog(crumbs));
        stage.ants.crumbsThisSacrifice = decimal(fromLog(crumbsThisSacrifice));
        for (let i = 1; i <= 10; i++) {
            stage.challengecompletions[i] = c[i];
            stage.highestchallengecompletions[i] = Math.max(stage.highestchallengecompletions[i], c[i]);
        }
        stage.upgrades = [...upgrades];
        snapshot.clearCache();
        return snapshot;
    }

    function offeringGain(ctx: HSGameDataAPI, crystal: number, timerMultiplier: number): number {
        const base = sum(ctx.allBaseOfferingStats.map(line => Number(line.stat())));
        const c = stage.challengecompletions;
        const u = stage.upgrades;
        const antOffering = ctx.antUpgrade.getAntUpgradeEffectValue(AntUpgrades.Offerings, 'offeringMult');
        const thrift = ctx.rune.getRuneLevelFromEXP('thrift', getRuneEXP(stage, 'thrift')) + ctx.rune.getRuneFreeLevels('thrift');
        const thriftSpirit = heaterCoinRunePurchasedLevel(getSpiritEXP(stage, 'thrift'), SPIRIT_COSTS[3], 2)
            * heaterCoinRunePurchasedLevel(getBlessingEXP(stage, 'thrift'), BLESSING_COSTS[3], 4)
            * thrift * (1 + 0.08 * r(164)) * (1 + 2 * r(194) / 100) * ctx.calculateChallenge15Reward('spiritBonus') / 77777700;
        const timePenalty = Math.max(0, (source.singChallengeTimer ?? 0) + clock * singularityClockRate - timeLimit) * timePenaltyLog;
        return log(base) + Math.max(0, offeringFixedLog - timePenalty + (ctx.rune.getRuneEffects('antiquities').offeringLog10 ?? 0)
            + logProduct([1 + Math.sqrt(Math.max(0, crystal)) / 5, ctx.rune.getRuneEffects('superiorIntellect').offeringMult ?? 1,
                1 + c[6] / 50 + (c[8] + c[10]) / 25, 1 + 0.2 * u[38], 1 + 2 * u[75],
                1 + sum(c) * r(85) / 10000, antOffering, 1 + thriftSpirit, timerMultiplier]));
    }

    function awardOfferings(gain: number): void {
        const limit = taxmanCap ? addProductionLogs(offerings + 2, 0) : Infinity;
        offerings = addProductionLogs(offerings, Math.min(gain, limit));
    }

    function buyRunes(ctx: HSGameDataAPI): void {
        const salvage = ctx.rune.calculateTotalSalvage() / 30;
        if (sing >= 15) {
            for (const [enabled, exp] of [[source.toggles?.[36], stage.blessingEXP], [source.toggles?.[37], stage.spiritEXP]] as const) {
                if (!enabled) continue;
                const budget = offerings - 1;
                if (budget < 0) continue;
                for (let i = 0; i < exp.length; i++)
                    exp[i] = decimal(fromLog(addProductionLogs(parseGameDataDecimal(exp[i]).log10(), budget + salvage)));
                offerings -= log(2);
            }
        }
        const budget = offerings - (allRunes ? log(2 * runeCount) : 0);
        if (budget < 0) return;
        for (const [i, key] of RUNES.entries()) {
            if (!canBuyRune[i]) continue;
            const current = getRuneEXP(stage, key);
            const level = ctx.rune.getRuneLevelFromEXP(key, current);
            const expPerOffering = (i < 5 ? ctx.rune.firstFiveRuneEXPMult(level) : ctx.rune.universalRuneEXPMult(level)).log10();
            const available = fromLog(addProductionLogs(current.log10(), budget + expPerOffering));
            const next = ctx.rune.getRuneLevelFromEXP(key, available);
            if (next <= level) continue;
            const spentEXP = ctx.rune.runes[key].costCoefficient.times(Decimal.pow(10, next / ctx.rune.getLevelsPerOOM(key)).minus(1));
            const spend = Math.max(0, Math.min(budget, subtractLogs(spentEXP.log10(), current.log10()) - expPerOffering));
            stage.runeEXP[i] = decimal(spentEXP);
            offerings = subtractLogs(offerings, spend);
        }
    }

    function buyLevels(current: number, cost: number, scale: number, maxBuy: boolean): number {
        const sunkCost = current > 0 ? cost + scale * (current - 1) : -Infinity;
        const budget = addProductionLogs(crumbs, sunkCost);
        const limit = Math.max(current, 1 + Math.floor((budget - cost) / scale));
        const next = maxBuy ? limit : Math.min(limit, current + 1);
        if (next > current) crumbs = subtractLogs(crumbs, subtractLogs(cost + scale * (next - 1), sunkCost));
        return next;
    }

    return {
        state(challenge, c, upgrades) {
            if (challenge !== stageIndex || clock - refreshedAt >= STAT_UPDATE - 1e-9) {
                const ctx = sync(challenge, c, upgrades);
                cached = calculateState(ctx, stage);
                const rune = 'superiorIntellect';
                antSpeedRune = ctx.rune.getRuneEffects(rune).antSpeed ?? 1;
                const runeLevel = ctx.rune.getRuneLevelFromEXP(rune, getRuneEXP(stage, rune)) + ctx.rune.getRuneFreeLevels(rune);
                const blessingLevel = heaterCoinRunePurchasedLevel(getBlessingEXP(stage, rune), BLESSING_COSTS[4], 4);
                antBlessingLog = obtainiumLog * Math.log1p(runeLevel * blessingLevel * antBlessingMultiplier / 1e6);
                refreshedAt = clock;
                stageIndex = challenge;
            }
            return cached;
        },
        awardReset(challenge, c, upgrades, crystal) {
            const timer = prestigeTime / 10;
            const timerMultiplier = (before.getLevelMilestone('offeringTimerScaling') ? timer : Math.min(1, timer))
                * (halfMind ? 10 ** speedLog / MIND_DIVISOR : 1);
            awardOfferings(offeringGain(sync(challenge, c, upgrades), crystal, timerMultiplier));
            prestigeTime = 0;
        },
        advance(seconds, challenge, c, upgrades, crystal, particles, speed) {
            speedLog = speed;
            clock += seconds;
            const resetTime = seconds * (halfMind ? MIND_DIVISOR : 10 ** speed);
            prestigeTime += resetTime * resetClockRate;
            stage.ascensionCounter += seconds * ascensionSpeed * ascensionClockRate;
            antReal += seconds;
            antTime += resetTime;
            runeTime += seconds;
            antTimer += seconds;
            const freeAnt = freeAntLevels(c);
            const antLevel = (i: AntUpgrades) => purchased[i] + Math.min(purchased[i], freeAnt);
            if (c[8] > 0 || cube(48) > 0) {
                const purchases = owned[0];
                const crumbsLog = Math.max(1, crumbs);
                const antSpeed = antConstant + antBlessingLog + (speed > 0 ? (1 + 3 * upgrades[79]) * speed : speed)
                    + stage.ants.rebornELO * log(1.02) + antLevel(AntUpgrades.AntSpeed) * log(antSpeedBase)
                    + purchases * log((1 + upgrades[77] / 250) * (1 + r(96) / 5000) * (1 + cube(65) / 250))
                    + c[9] * log(1.1) + 5 * source.challengecompletions[11] + sum(stage.highestchallengecompletions) * log(1 + plat(12) / 100)
                    + logProduct([1 + 0.6 * upgrades[39], 1 + 4 * upgrades[76],
                        upgrades[78] ? 1 + 0.005 * parseGameDataDecimal(source.maxOfferings).plus(1).log10() ** 2 : 1,
                        1 + r(117) * stage.ants.antSacrificeCount / 10000, 1 + r(147) * crumbsLog, 1 + r(177) * crumbsLog,
                        antSpeedRune, ach(AchievementId.AntCrumbsTier1) ? crumbsLog : 1,
                        ach(AchievementId.AntCrumbsTier6) ? 1 + stage.ants.immortalELO / 1000 : 1]);
                for (let i = PRODUCERS.length - 1; i >= 0; i--) {
                    const mastery = masteries[i];
                    const [, , bonus, power] = ANT_MASTERY[i];
                    const production = addProductionLogs(log(owned[i]), generated[i]) + PRODUCERS[i][2]
                        + antSpeed * antSpeedExponent + log(seconds) + bonus[mastery] + owned[i] * log(1 + mastery * power + 0.01 * Math.min(1, mastery));
                    if (i === 0) {
                        crumbs = addProductionLogs(crumbs, production);
                        crumbsThisSacrifice = addProductionLogs(crumbsThisSacrifice, production);
                    } else generated[i - 1] = addProductionLogs(generated[i - 1], production);
                }
            }
            const elo = stage.ants.immortalELO;
            if (stage.ants.rebornELO < elo) {
                const [stages, remaining] = getStages(stage.ants.rebornELO);
                let gain = Math.min(elo - stage.ants.rebornELO, seconds * eloRegen * rebornEloBonus * effectiveELO
                    * (1 + 0.1 * upgrades[124]) * stageSpeed ** stages
                    * [1.15, 1.25, 1.4, 2, 3].reduce((factor, boost, i) => owned[i + 4] ? factor * boost : factor, 1));
                if (gain >= remaining) gain = remaining + (gain - remaining) * stageSpeed;
                stage.ants.rebornELO = Math.min(elo, stage.ants.rebornELO + gain);
            }
            if (antTimer >= ANT_UPDATE - 1e-9) {
                antTimer %= ANT_UPDATE;
                if (antToggles.autobuyMasteries) {
                    for (let i = tiers - 1; i >= 0; i--) {
                        const [requirements, costs] = ANT_MASTERY[i];
                        while (masteries[i] < Math.min(masteryCaps[i], costs.length)
                            && requirements[masteries[i]] <= stage.ants.rebornELO && costs[masteries[i]] <= particles) {
                            particles = subtractLogs(particles, costs[masteries[i]]);
                            masteries[i]++;
                        }
                    }
                }
                if (antToggles.autobuyProducers) {
                    for (let i = tiers - 1; i >= 0; i--)
                        owned[i] = buyLevels(owned[i], PRODUCERS[i][0], PRODUCERS[i][1], antToggles.maxBuyProducers);
                }
                if (antToggles.autobuyUpgrades) {
                    for (let i = 0; i < UPGRADE_COSTS.length; i++) {
                        if (autobuy[i]) purchased[i] = buyLevels(purchased[i], ...UPGRADE_COSTS[i], antToggles.maxBuyUpgrades);
                    }
                }
                const antEloPerk = eloPerk > 0 ? Math.min(2e5, elo) * (0.02 + 0.018 * (eloPerk - 1))
                    + Math.min(1.8e6, Math.max(0, elo - 2e5)) * (0.001 + 0.0009 * (eloPerk - 1)) : 0;
                effectiveELO = Math.floor((eloBase + owned[0] + c[10] * 100
                    + 5 * Math.min(200, antLevel(AntUpgrades.AntSacrifice)) + antEloPerk)
                    * Math.max(0.01, eloMult + sum([0.01, 0.01, 0.01, 0.02, 0.02].filter((_, i) => owned[4 + i]))));
                if (cube(49)) stage.ants.immortalELO = Math.max(elo, effectiveELO);
            }
            const rebornMax = stage.ants.immortalELO - stage.ants.rebornELO < 0.001;
            const threshold = antToggles.autoSacrificeThreshold;
            const modes = [antTime >= threshold, antReal >= threshold, effectiveELO - stage.ants.immortalELO >= Math.floor(threshold), rebornMax];
            if (antToggles.autoSacrificeEnabled && (ach(AchievementId.AntCrumbsTier5) || sing >= 10) && crumbsThisSacrifice >= 40
                && antReal >= ANT_UPDATE && (!antToggles.onlySacrificeMaxRebornELO || rebornMax)
                && (modes[antToggles.autoSacrificeMode] || (antToggles.alwaysSacrificeMaxRebornELO && rebornMax))) {
                const [stages] = getStages(stage.ants.rebornELO);
                const antMultiplier = logProduct([Math.sqrt(1 + antLevel(AntUpgrades.AntSacrifice) / 10), 1 + r(103) / 20,
                    1 + r(104) / 20, 1 + c[10] / 50, 1 + r(122) / 50, 1 + 0.03 * r(133), 1 + 0.02 * r(163),
                    1 + r(193) / 100, 1 + 0.25 * upgrades[40], antTime / 10])
                    + (halfMind ? speed - log(MIND_DIVISOR) : 0) + sacrificeCubeLog + stages * log(1.05);
                awardOfferings(offeringGain(sync(challenge, c, upgrades), crystal, 1) + antMultiplier);
                stage.ants.immortalELO = Math.max(stage.ants.immortalELO, effectiveELO);
                stage.ants.rebornELO = 0;
                crumbs = sacrificeCrumbs;
                crumbsThisSacrifice = 0;
                antReal = antTime = 0;
                resetAnts(false);
                refreshedAt = -Infinity;
            }
            if (autoRune && runeTime >= runeInterval && offerings >= 0) {
                buyRunes(sync(challenge, c, upgrades));
                runeTime = 0;
                refreshedAt = -Infinity;
            }
            if (c[3] > 0 || stage.highestchallengecompletions[3] > 0) {
                passiveOfferings += seconds / 2;
                const earned = Math.floor(passiveOfferings);
                offerings = addProductionLogs(offerings, log(earned));
                passiveOfferings -= earned;
            }
            return particles;
        },
    };
}
