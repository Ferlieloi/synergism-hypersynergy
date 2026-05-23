import { HSModuleManager } from "../../hs-core/module/hs-module-manager";
import { HSGameDataAPI } from "../../hs-core/gds/hs-gamedata-api";
import { redAmbrosiaUpgradeCalculationCollection } from "../../hs-core/gds/stored-vars-and-calculations";
import { HSHeaterResultStore } from "./hs-heater-result-store";
import type { HeaterOptimizerInput, HeaterRedAmbCommonValues, HeaterRedAmbUpgradeEffects } from "../../../types/data-types/hs-heater-types";
import type { RedAmbrosiaUpgradeCalculationConfig, RedAmbrosiaUpgradeKey, RedAmbrosiaUpgradeRewards } from "../../../types/data-types/hs-gamedata-api-types";
import { escapeHtml, normalizeHeaterFusion, computeHeaterFusionValue, computeHeaterFusionGain, computeHeaterRedAmbrosiaSheetValue } from "./hs-heater-utils";

export type RedAmbrosiaUpgradeCategoryEffectValue = number | "N / A" | "-";
export type RedAmbrosiaUpgradeCefLogValue = number | "-" | "N / A" | "Never";

export interface RedAmbrosiaUpgradeTableRow {
    upgradeKey: RedAmbrosiaUpgradeKey;
    label: string;
    iconUrl?: string;
    level: number;
    maxLevel: number;
    nextCost: number | "Maxed";
    ambrosiaEffectRaw?: RedAmbrosiaUpgradeCategoryEffectValue;
    ambrosiaEffect: RedAmbrosiaUpgradeCategoryEffectValue;
    ambrosiaCefLog: RedAmbrosiaUpgradeCefLogValue;
    redAmbrosiaEffectRaw?: RedAmbrosiaUpgradeCategoryEffectValue;
    redAmbrosiaEffect: RedAmbrosiaUpgradeCategoryEffectValue;
    redAmbrosiaCefLog: RedAmbrosiaUpgradeCefLogValue;
    octeractEffectRaw?: RedAmbrosiaUpgradeCategoryEffectValue;
    octeractEffect: RedAmbrosiaUpgradeCategoryEffectValue;
    octeractCefLog: RedAmbrosiaUpgradeCefLogValue;
}

const SHOW_RED_AMBROSIA_RAW_COLUMNS = false; // Set to true when debugging raw values

const EXCLUDED_RED_AMBROSIA_UPGRADES: RedAmbrosiaUpgradeKey[] = [
    'redAmbrosiaFreeAccumulator',
    'redAmbrosiaObtainium',
    'redAmbrosiaOffering',
    'freeOfferingUpgrades',
    'salvageYinYang',
    'freeObtainiumUpgrades',
];

const BASE_AMBROSIA_EFFECT_KEYS = [
    'conversionImprovement1',
    'blueberryGenerationSpeed',
    'regularLuck',
    'blueberries',
    'freeLevelsRow2',
    'freeLevelsRow3',
    'conversionImprovement2',
    'redGenerationSpeed',
    'redLuck',
    'freeLevelsRow4',
    'viscount',
    'freeLevelsRow5',
    'conversionImprovement3',
    'blueberryGenerationSpeed2',
    'regularLuck2',
] as const;

const OCTERACT_EFFECT_KEYS = [
    'tutorial',
    'freeTutorialLevels',
    'regularLuck',
    'blueberries',
    'freeLevelsRow2',
    'redAmbrosiaCube',
    'freeLevelsRow3',
    'freeLevelsRow4',
    'redAmbrosiaCubeImprover',
    'infiniteShopUpgrades',
    'freeCubeUpgrades',
    'viscount',
    'freeLevelsRow5',
    'regularLuck2',
    'freeSpeedUpgrades',
] as const;

const RED_AMBROSIA_EFFECT_KEYS = BASE_AMBROSIA_EFFECT_KEYS;
const AMBROSIA_EFFECT_KEYS = [...BASE_AMBROSIA_EFFECT_KEYS, 'redAmbrosiaAccelerator'] as const;

const RED_AMBROSIA_EFFECT_KEY_SET = new Set<RedAmbrosiaEffectKey>(RED_AMBROSIA_EFFECT_KEYS as readonly RedAmbrosiaEffectKey[]);
const AMBROSIA_EFFECT_KEY_SET = new Set<AmbrosiaEffectKey>(AMBROSIA_EFFECT_KEYS as readonly AmbrosiaEffectKey[]);
const OCTERACT_EFFECT_KEY_SET = new Set<OcteractEffectKey>(OCTERACT_EFFECT_KEYS as readonly OcteractEffectKey[]);

type AmbrosiaEffectKey    = typeof AMBROSIA_EFFECT_KEYS[number];
type RedAmbrosiaEffectKey = typeof RED_AMBROSIA_EFFECT_KEYS[number];
type OcteractEffectKey    = typeof OCTERACT_EFFECT_KEYS[number];

function isAmbrosiaEffectKey(upgradeKey: RedAmbrosiaUpgradeKey): upgradeKey is AmbrosiaEffectKey {
    return AMBROSIA_EFFECT_KEY_SET.has(upgradeKey as AmbrosiaEffectKey);
}
function isRedAmbrosiaEffectKey(upgradeKey: RedAmbrosiaUpgradeKey): upgradeKey is RedAmbrosiaEffectKey {
    return RED_AMBROSIA_EFFECT_KEY_SET.has(upgradeKey as RedAmbrosiaEffectKey);
}
function isOcteractEffectKey(upgradeKey: RedAmbrosiaUpgradeKey): upgradeKey is OcteractEffectKey {
    return OCTERACT_EFFECT_KEY_SET.has(upgradeKey as OcteractEffectKey);
}

function getCurrentHSGameDataAPI(): HSGameDataAPI | undefined {
    return HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
}

function getCurrentRedAmbrosiaOptimizerContext(): {
    input?: HeaterOptimizerInput;
    commonValues?: HeaterRedAmbCommonValues;
    redAmbUpgradeEffects?: HeaterRedAmbUpgradeEffects;
} {
    const result = HSHeaterResultStore.getCurrentRawResult();
    if (!result) { return {}; } 
    return {
        input: result.input,
        commonValues: result.redAmbCommonValues,
        redAmbUpgradeEffects: result.redAmbUpgradeEffects,
    };
}

function computeRedAmbrosiaEffectValue(
    upgradeKey: RedAmbrosiaEffectKey,
    level: number,
    context: ReturnType<typeof getCurrentRedAmbrosiaOptimizerContext>,
): number | undefined {
    const { input, commonValues, redAmbUpgradeEffects } = context;
    const luck = commonValues?.luck;
    const mLuck = commonValues?.mLuck;
    const totalRedLuck = commonValues?.totalRedLuck;
    const luckConversion = commonValues?.luckConversion;

    const hasLuckConversionStats = luck !== undefined && luckConversion !== undefined && totalRedLuck !== undefined;
    const hasMLuckConversionStats = mLuck !== undefined && luckConversion !== undefined && totalRedLuck !== undefined;

    switch (upgradeKey) {
        case 'conversionImprovement1':
        case 'conversionImprovement2':
        case 'conversionImprovement3': {
            if (!hasLuckConversionStats) { return undefined; }
            const denominator = luckConversion - 1;
            if (!(denominator > 0 && totalRedLuck > 0)) { return undefined; }
            return 1 + ((luck / denominator) - (luck / luckConversion)) / totalRedLuck;
        }
        case 'regularLuck':
        case 'regularLuck2': {
            if (!hasMLuckConversionStats) { return undefined; }
            return 1 + (2 * (1 + mLuck)) / luckConversion / totalRedLuck;
        }
        case 'blueberryGenerationSpeed':
        case 'blueberryGenerationSpeed2': {
            if (!input) { return undefined; }
            const fusion = input.ambSpeedNonAmbBerries * input.patreonBonus;
            const coefficient = upgradeKey === 'blueberryGenerationSpeed' ? 0.002 : 0.001;
            const speed = fusion * (1 + coefficient * level);
            if (!(speed > 0)) { return 1; }
            const delta = fusion * coefficient;
            const numerator = (1 + delta / speed) * Math.min(speed + delta, 1000);
            const denominator = Math.min(speed, 1000);
            return Math.sqrt(numerator / denominator);
        }
        case 'redGenerationSpeed': {
            return 1 + 0.003 / (1 + 0.003 * level);
        }
        case 'redLuck': {
            if (totalRedLuck === undefined) { return undefined; }
            return 1 + 1 / totalRedLuck;
        }
        case 'blueberries':
        case 'freeLevelsRow2':
        case 'freeLevelsRow3':
        case 'freeLevelsRow4':
        case 'freeLevelsRow5':
        case 'viscount': {
            if (!redAmbUpgradeEffects) { return undefined; }
            const effectValue = redAmbUpgradeEffects[upgradeKey]?.rEffect;
            return typeof effectValue === 'number' ? effectValue : undefined;
        }
        default:
            return undefined;
    }
}

function computeAmbrosiaEffectRawValue(
    upgradeKey: AmbrosiaEffectKey,
    level: number,
    redAmbRawEffect: number | undefined,
    acceleratorLevel: number,
    context: ReturnType<typeof getCurrentRedAmbrosiaOptimizerContext>,
): number | undefined {
    const { input, commonValues } = context;
    const totalRedLuck = commonValues?.totalRedLuck;
    if (!input || totalRedLuck === undefined) {
        return undefined;
    }

    const fusionValue = computeHeaterFusionValue(
        normalizeHeaterFusion(acceleratorLevel, input.rBar, input.rSpeed),
        totalRedLuck,
        1,
    );

    const requiresRawValue = new Set<AmbrosiaEffectKey>([
        'conversionImprovement1',
        'conversionImprovement2',
        'redGenerationSpeed',
        'redLuck',
        'conversionImprovement3',
        'blueberryGenerationSpeed',
        'blueberryGenerationSpeed2',
        'regularLuck',
        'regularLuck2',
    ]);

    if (redAmbRawEffect === undefined && requiresRawValue.has(upgradeKey)) {
        return undefined;
    }

    switch (upgradeKey) {
        case 'conversionImprovement1':
        case 'conversionImprovement2':
        case 'redGenerationSpeed':
        case 'redLuck':
        case 'conversionImprovement3':
            return computeHeaterFusionGain(fusionValue, redAmbRawEffect!);
        case 'blueberryGenerationSpeed':
            return computeHeaterRedAmbrosiaSheetValue(level, fusionValue, redAmbRawEffect!, 0.002);
        case 'blueberryGenerationSpeed2':
            return computeHeaterRedAmbrosiaSheetValue(level, fusionValue, redAmbRawEffect!, 0.001);
        case 'regularLuck':
        case 'regularLuck2':
            return redAmbRawEffect! * computeHeaterFusionGain(fusionValue, redAmbRawEffect!);
        case 'redAmbrosiaAccelerator': {
            if (input.rBar <= 0) { return undefined; }
            const rawFusion = input.rSpeed / input.rBar * totalRedLuck / 100;
            const normalized = (level > 0 ? 1 : 0) + 0.02 * level;
            return (1 + (1.02 + 0.02 * level) * rawFusion) / (1 + normalized * rawFusion);
        }
        case 'blueberries':
        case 'freeLevelsRow2':
        case 'freeLevelsRow3':
        case 'freeLevelsRow4':
        case 'freeLevelsRow5':
        case 'viscount': {
            const effectValue = context.redAmbUpgradeEffects?.[upgradeKey]?.bEffect;
            return typeof effectValue === 'number' ? effectValue : undefined;
        }
        default:
            return undefined;
    }
}

function computeRedAmbrosiaRawToDisplay(
    upgradeKey: RedAmbrosiaEffectKey,
    value: number | undefined,
    context: ReturnType<typeof getCurrentRedAmbrosiaOptimizerContext>,
): number | undefined {
    if (upgradeKey !== 'blueberries' || value === undefined) {
        return value;
    }

    const { input } = context;
    const speed = (input?.ambSpeedNonAmbBerries ?? 0) * (input?.patreonBonus ?? 0);
    const blueberries = input?.blueberries ?? 0;
    if (!(speed > 0 && blueberries > 0)) {
        return value;
    }

    const delta = speed / blueberries;
    const numerator = (1 + delta / speed) * Math.min(speed + delta, 1000);
    const denominator = Math.min(speed, 1000);
    return value * Math.sqrt(numerator / denominator);
}

function computeAmbrosiaRawToDisplay(
    upgradeKey: AmbrosiaEffectKey,
    value: number | undefined,
    context: ReturnType<typeof getCurrentRedAmbrosiaOptimizerContext>,
): number | undefined {
    if (value === undefined) {
        return undefined;
    }

    if (upgradeKey === 'blueberries') {
        const blueberries = context.input?.blueberries ?? 0;
        if (blueberries <= 0) {
            return value;
        }
        return value * (1 + 1 / blueberries);
    }

    return value;
}

function computeOcteractFreeCubeRaw(level: number, input: HeaterOptimizerInput): number {
    const effects = [
        0.015,
        0.0075,
        0.01 * input.currentSingularity,
        0.001,
        0.005 * (1 + input.freeShopLevelsInfinity / 100),
    ];
    const baseValues = [100, 100, 1000, 1000, 0];
    const product = effects.reduce((current, effect, index) => {
        const denominator = 1 + effect * (baseValues[index] + 24.5 + level);
        return current * (1 + effect / denominator);
    }, 1);
    return product * Math.pow(1.012, 1.25);
}

function computeOcteractFreeSpeedRaw(level: number, input: HeaterOptimizerInput): number {
    const effects = [
        0.012,
        0.006,
        0.015,
        0.001 * input.currentSingularity,
        0.005 * (1 + input.freeShopLevelsInfinity / 100),
    ];
    const baseValues = [100, 100, 1000, 1000, 0];
    const product = effects.reduce((current, effect, index) => {
        const denominator = 1 + effect * (baseValues[index] + 24.5 + level);
        return current * (1 + effect / denominator);
    }, 1);
    const mind = input.transcription > 0 ? 0.55 + input.transcription / 150 : 0.5;
    return Math.pow(product * 1.006, (1 + input.ascSpread) * mind);
}

function computeOcteractEffectRawValue(
    upgradeKey: OcteractEffectKey,
    level: number,
    context: ReturnType<typeof getCurrentRedAmbrosiaOptimizerContext>,
): number | undefined {
    const { input, redAmbUpgradeEffects } = context;

    switch (upgradeKey) {
        case 'tutorial':
            return 1.01;
        case 'freeTutorialLevels':
            return 1 + 0.05 / (1.5 + 0.05 * level);
        case 'regularLuck':
        case 'regularLuck2':
            return redAmbUpgradeEffects?.ossifiedTactics?.octEffect ?? undefined;
        case 'blueberries':
            return redAmbUpgradeEffects?.blueberries?.octEffect ?? undefined;
        case 'freeLevelsRow2':
            return redAmbUpgradeEffects?.freeLevelsRow2?.octEffect ?? undefined;
        case 'redAmbrosiaCube':
            if (!input) { return undefined; }
            return 1 + Math.pow(input.ramb, 0.4) / 100;
        case 'freeLevelsRow3':
            return redAmbUpgradeEffects?.freeLevelsRow3?.octEffect ?? undefined;
        case 'freeLevelsRow4':
            return redAmbUpgradeEffects?.freeLevelsRow4?.octEffect ?? undefined;
        case 'redAmbrosiaCubeImprover':
            if (!input) { return undefined; }
            return (1 + Math.pow(input.ramb, 0.41 + level / 100) / 100)
                / (1 + Math.pow(input.ramb, 0.4 + level / 100) / 100);
        case 'infiniteShopUpgrades':
            if (!input) { return undefined; }
            const infiniteMind = input.transcription > 0 ? 0.55 + input.transcription / 150 : 0.5;
            return Math.pow(1.012, 1.25) * Math.pow(1.006, (1 + input.ascSpread) * infiniteMind);
        case 'freeCubeUpgrades':
            if (!input) { return undefined; }
            return computeOcteractFreeCubeRaw(level, input);
        case 'viscount':
            return redAmbUpgradeEffects?.viscount?.octEffect ?? undefined;
        case 'freeLevelsRow5':
            return redAmbUpgradeEffects?.freeLevelsRow5?.octEffect ?? undefined;
        case 'freeSpeedUpgrades':
            if (!input) { return undefined; }
            return computeOcteractFreeSpeedRaw(level, input);
        default:
            return undefined;
    }
}

function getRedAmbrosiaUpgradeCategoryEffect(
    reward: Record<string, unknown>,
    effectKeys: readonly string[],
): RedAmbrosiaUpgradeCategoryEffectValue {
    for (const key of effectKeys) {
        const value = reward[key];
        if (typeof value === 'number') {
            return value;
        }
    }
    return 'N / A';
}

function buildRedAmbrosiaUpgradeCefLog(
    effect: RedAmbrosiaUpgradeCategoryEffectValue,
    cost: number | "Maxed",
): RedAmbrosiaUpgradeCefLogValue {
    if (effect === 'N / A' || effect === '-') {
        return effect;
    }
    if (typeof cost !== 'number' || cost <= 0) {
        return '-';
    }
    if (!Number.isFinite(effect) || effect <= 1) {
        return '-';
    }
    const delta = Math.pow(effect, 1 / cost) - 1;
    if (!(delta > 0)) {
        return '-';
    }
    return -Math.log10(delta);
}

function buildRedAmbrosiaUpgradeRow(
    upgradeKey: RedAmbrosiaUpgradeKey,
    label: string,
    iconUrl: string | undefined,
    level: number,
    maxLevel: number,
    nextCost: number | "Maxed",
    computedRedAmbrosiaEffectRaw: number | undefined,
    computedAmbrosiaEffectRaw: number | undefined,
    computedOcteractEffectRaw: number | undefined,
    rewardAmbrosiaEffect: RedAmbrosiaUpgradeCategoryEffectValue,
    rewardRedAmbrosiaEffect: RedAmbrosiaUpgradeCategoryEffectValue,
    optimizerContext: ReturnType<typeof getCurrentRedAmbrosiaOptimizerContext>,
): RedAmbrosiaUpgradeTableRow {
    const ambrosiaEffect = isAmbrosiaEffectKey(upgradeKey)
        ? computeAmbrosiaRawToDisplay(upgradeKey, computedAmbrosiaEffectRaw, optimizerContext) ?? rewardAmbrosiaEffect
        : rewardAmbrosiaEffect;
    const redAmbrosiaEffect: RedAmbrosiaUpgradeCategoryEffectValue = isRedAmbrosiaEffectKey(upgradeKey)
        ? computeRedAmbrosiaRawToDisplay(upgradeKey, computedRedAmbrosiaEffectRaw, optimizerContext) ?? rewardRedAmbrosiaEffect
        : rewardRedAmbrosiaEffect;
    const octeractEffect: RedAmbrosiaUpgradeCategoryEffectValue = isOcteractEffectKey(upgradeKey)
        ? computedOcteractEffectRaw ?? '-'
        : '-';

    return {
        upgradeKey,
        label,
        iconUrl,
        level,
        maxLevel,
        nextCost,
        ambrosiaEffectRaw: computedAmbrosiaEffectRaw,
        ambrosiaEffect,
        ambrosiaCefLog: buildRedAmbrosiaUpgradeCefLog(ambrosiaEffect, nextCost),
        redAmbrosiaEffectRaw: computedRedAmbrosiaEffectRaw,
        redAmbrosiaEffect,
        redAmbrosiaCefLog: buildRedAmbrosiaUpgradeCefLog(redAmbrosiaEffect, nextCost),
        octeractEffectRaw: computedOcteractEffectRaw,
        octeractEffect,
        octeractCefLog: buildRedAmbrosiaUpgradeCefLog(octeractEffect, nextCost),
    };
}

function applyMaxedRowOverrides(row: RedAmbrosiaUpgradeTableRow): RedAmbrosiaUpgradeTableRow {
    return {
        ...row,
        ambrosiaEffect: '-',
        ambrosiaCefLog: '-',
        redAmbrosiaEffect: '-',
        redAmbrosiaCefLog: '-',
        octeractEffect: '-',
        octeractCefLog: '-',
    };
}

function formatRedAmbrosiaUpgradeCategoryValue(value: RedAmbrosiaUpgradeCategoryEffectValue | undefined): string {
    if (value === undefined || value === 'N / A' || value === '-') { return value === undefined ? '-' : value; }
    return value.toFixed(9);
}

function formatRedAmbrosiaUpgradeCefLogValue(value: RedAmbrosiaUpgradeCefLogValue): string {
    if (typeof value !== 'number') { return value; }
    return value.toFixed(9);
}

export function computeRedAmbrosiaUpgradeRows(gameDataApi?: HSGameDataAPI): RedAmbrosiaUpgradeTableRow[] {
    const api = gameDataApi ?? getCurrentHSGameDataAPI();
    const gameData = api?.getGameData?.();
    const optimizerContext = getCurrentRedAmbrosiaOptimizerContext();
    const redAmbrosiaAcceleratorLevel = api?.ambrosia.calculateRedAmbrosiaUpgradeValue('redAmbrosiaAccelerator') ?? 0;

    return (Object.entries(redAmbrosiaUpgradeCalculationCollection) as [RedAmbrosiaUpgradeKey, RedAmbrosiaUpgradeCalculationConfig<any>][]) 
        .filter(([upgradeKey]) => !EXCLUDED_RED_AMBROSIA_UPGRADES.includes(upgradeKey))
        .map(([upgradeKey, config]) => {
            const level = api?.ambrosia.calculateRedAmbrosiaUpgradeValue(upgradeKey) ?? 0;
            const maxLevel = config.maxLevel;
            const isMaxLevel = level >= maxLevel;
            const nextCost = isMaxLevel ? 'Maxed' : config.costFunction(level, config.costPerLevel);
            const label = config.label;
            const iconUrl = config.url;

            const computedRedAmbrosiaEffectRaw = isRedAmbrosiaEffectKey(upgradeKey)
                ? computeRedAmbrosiaEffectValue(upgradeKey, level, optimizerContext)
                : undefined;
            const computedAmbrosiaEffectRaw = isAmbrosiaEffectKey(upgradeKey)
                ? computeAmbrosiaEffectRawValue(upgradeKey, level, computedRedAmbrosiaEffectRaw, redAmbrosiaAcceleratorLevel, optimizerContext)
                : undefined;
            const computedOcteractEffectRaw = isOcteractEffectKey(upgradeKey)
                ? computeOcteractEffectRawValue(upgradeKey, level, optimizerContext)
                : undefined;

            const reward = config.effects(level, gameData) as Record<string, unknown>;
            const rewardAmbrosiaEffect = getRedAmbrosiaUpgradeCategoryEffect(reward, AMBROSIA_EFFECT_KEYS);
            const rewardRedAmbrosiaEffect = getRedAmbrosiaUpgradeCategoryEffect(reward, RED_AMBROSIA_EFFECT_KEYS);

            const row = buildRedAmbrosiaUpgradeRow(
                upgradeKey,
                label,
                iconUrl,
                level,
                maxLevel,
                nextCost,
                computedRedAmbrosiaEffectRaw,
                computedAmbrosiaEffectRaw,
                computedOcteractEffectRaw,
                rewardAmbrosiaEffect,
                rewardRedAmbrosiaEffect,
                optimizerContext,
            );

            return isMaxLevel ? applyMaxedRowOverrides(row) : row;
        });
}

function renderRedAmbrosiaUpgradeRowHtml(row: RedAmbrosiaUpgradeTableRow, showRawColumns = false): string {
    const isMaxed = row.nextCost === 'Maxed';
    const costCell = isMaxed ? 'Maxed' : String(row.nextCost);
    const iconCell = row.iconUrl
        ? `<img src="${escapeHtml(row.iconUrl)}" alt="${escapeHtml(row.label)}" class="hs-heater-red-ambrosia-icon">`
        : '';

    return `
        <tr class="hs-heater-red-ambrosia-row${isMaxed ? ' hs-heater-red-ambrosia-maxed-row' : ''}">
            <td class="hs-heater-red-ambrosia-icon-cell">${iconCell}</td>
            <td>${escapeHtml(row.label)}</td>
            <td>${escapeHtml(String(row.level))}</td>
            <td>${escapeHtml(String(row.maxLevel))}</td>
            <td>${escapeHtml(costCell)}</td>
            ${showRawColumns ? `<td>${escapeHtml(formatRedAmbrosiaUpgradeCategoryValue(row.ambrosiaEffectRaw))}</td>` : ''}
            <td>${escapeHtml(formatRedAmbrosiaUpgradeCategoryValue(row.ambrosiaEffect))}</td>
            <td>${escapeHtml(formatRedAmbrosiaUpgradeCefLogValue(row.ambrosiaCefLog))}</td>
            ${showRawColumns ? `<td>${escapeHtml(formatRedAmbrosiaUpgradeCategoryValue(row.redAmbrosiaEffectRaw))}</td>` : ''}
            <td>${escapeHtml(formatRedAmbrosiaUpgradeCategoryValue(row.redAmbrosiaEffect))}</td>
            <td>${escapeHtml(formatRedAmbrosiaUpgradeCefLogValue(row.redAmbrosiaCefLog))}</td>
            ${showRawColumns ? `<td>${escapeHtml(formatRedAmbrosiaUpgradeCategoryValue(row.octeractEffectRaw))}</td>` : ''}
            <td>${escapeHtml(formatRedAmbrosiaUpgradeCategoryValue(row.octeractEffect))}</td>
            <td>${escapeHtml(formatRedAmbrosiaUpgradeCefLogValue(row.octeractCefLog))}</td>
        </tr>
    `;
}

function renderRedAmbrosiaUpgradeTableHeaderHtml(showRawColumns = false): string {
    const ambrosiaColspan = showRawColumns ? 3 : 2;
    const redAmbrosiaColspan = showRawColumns ? 3 : 2;
    const octeractColspan = showRawColumns ? 3 : 2;
    return `
        <thead>
            <tr>
                <th rowspan="2"></th>
                <th rowspan="2">Upgrade</th>
                <th rowspan="2">Level</th>
                <th rowspan="2">Max</th>
                <th rowspan="2">Cost</th>
                <th colspan="${ambrosiaColspan}">Ambrosia</th>
                <th colspan="${redAmbrosiaColspan}">Red Ambrosia</th>
                <th colspan="${octeractColspan}">Octeracts</th>
            </tr>
            <tr>
                ${showRawColumns ? '<th>Raw</th>' : ''}
                <th>Effect</th>
                <th>CEF-LOG</th>
                ${showRawColumns ? '<th>Raw</th>' : ''}
                <th>Effect</th>
                <th>CEF-LOG</th>
                ${showRawColumns ? '<th>Raw</th>' : ''}
                <th>Effect</th>
                <th>CEF-LOG</th>
            </tr>
        </thead>
    `;
}

function renderRedAmbrosiaUpgradeContextSummaryHtml(context: ReturnType<typeof getCurrentRedAmbrosiaOptimizerContext>): string {
    const commonValues = context.commonValues;

    const summaryRows = [
        ['Total Luck in Red Luck Loadout', formatRedAmbrosiaUpgradeCategoryValue(commonValues?.luck)],
        ['Total Red Luck', formatRedAmbrosiaUpgradeCategoryValue(commonValues?.totalRedLuck)],
        ['Luck Multiplier in Red Luck Loadout', formatRedAmbrosiaUpgradeCategoryValue(commonValues?.mLuck)],
        ['Total Luck Conversion', formatRedAmbrosiaUpgradeCategoryValue(commonValues?.luckConversion)],
    ];

    const rowsHtml = `
            <tr>
                <td>${escapeHtml(summaryRows[0][0])}</td>
                <td>${escapeHtml(String(summaryRows[0][1]))}</td>
                <td>${escapeHtml(summaryRows[1][0])}</td>
                <td>${escapeHtml(String(summaryRows[1][1]))}</td>
            </tr>
            <tr>
                <td>${escapeHtml(summaryRows[2][0])}</td>
                <td>${escapeHtml(String(summaryRows[2][1]))}</td>
                <td>${escapeHtml(summaryRows[3][0])}</td>
                <td>${escapeHtml(String(summaryRows[3][1]))}</td>
            </tr>
        `;

    return `
        <div class="hs-heater-red-ambrosia-summary">
            <table class="hs-heater-redamb-summary-table">
                <tbody>
                    ${rowsHtml}
                </tbody>
            </table>
        </div>
    `;
}

function renderRedAmbrosiaUpgradeTableHtml(rows: RedAmbrosiaUpgradeTableRow[], context: ReturnType<typeof getCurrentRedAmbrosiaOptimizerContext>): string {
    if (!rows.length) {
        return `<div class="hs-heater-red-ambrosia-empty">No red ambrosia upgrade rows available.</div>`;
    }

    const showRawColumns = SHOW_RED_AMBROSIA_RAW_COLUMNS;
    const rowsHtml = rows.map(row => renderRedAmbrosiaUpgradeRowHtml(row, showRawColumns)).join('');

    return `
        <div class="hs-heater-red-ambrosia-table-section">
            <div class="hs-heater-redamb-table-wrapper">
                <table class="hs-heater-redamb-table hs-heater-red-ambrosia-table">
                    ${renderRedAmbrosiaUpgradeTableHeaderHtml(showRawColumns)}
                    <tbody>
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>
            ${renderRedAmbrosiaUpgradeContextSummaryHtml(context)}
        </div>
    `;
}

export function buildRedAmbrosiaUpgradeTableHtml(gameDataApi?: HSGameDataAPI): string {
    const rows = computeRedAmbrosiaUpgradeRows(gameDataApi);
    const optimizerContext = getCurrentRedAmbrosiaOptimizerContext();
    return renderRedAmbrosiaUpgradeTableHtml(rows, optimizerContext);
}
