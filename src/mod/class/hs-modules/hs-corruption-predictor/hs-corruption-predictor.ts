import { HSModule } from '../../hs-core/module/hs-module';
import { HSModuleRegistry } from '../../hs-core/module/hs-module-registry';
import { HSElementHooker } from '../../hs-core/hs-elementhooker';
import { HSCorruptionLevel } from '../../hs-core/hs-corruption-level';
import { HSGlobal } from '../../hs-core/hs-global';
import { HSLogger } from '../../hs-core/hs-logger';
import { HSUI } from '../../hs-core/hs-ui';
import { HSIcons } from '../../hs-utils/hs-icons';
import { HSUtils } from '../../hs-utils/hs-utils';
import type { GameData } from '../../../types/data-types/hs-player-savedata';
import {
    assertCorruptionPredictionMode, canEarnCorruptionTarget, corruptionMaxLevel, getCorruptionExalt, CORRUPTION_TARGET_ORDER,
    CORRUPTION_TARGETS, type CorruptionTarget,
} from './hs-corruption-prediction-model';
import type { CorruptionPrediction } from './hs-corruption-prediction';
import { searchCorruption } from './hs-corruption-search';
import { snapshotCorruptionData } from './hs-corruption-snapshot';
import predictorCSS from 'inline:../../../resource/css/module/hs-corruption-predictor.css';

type TargetPreference = CorruptionTarget | 'auto';
const TARGET_PREFERENCE_KEY = 'corruption-predictor-target';
const ESTIMATE_TITLE = 'Estimate the yield after four C1–C10 sweeps.';
const ASSUMPTIONS = 'Models automatic purchases, rune XP and ant growth. Research stays fixed.';
const RESOURCE_SHORT_LABELS: Record<CorruptionTarget, string> = {
    cubes: 'Cu', tesseracts: 'Te', hypercubes: 'Hy', platonics: 'Pl', hepteracts: 'He',
};

interface PredictorControls {
    button: HTMLButtonElement;
    status: HTMLElement;
}

interface PredictorQuickbar extends PredictorControls {
    element: HTMLElement;
    choices: Map<TargetPreference, HTMLButtonElement>;
}

/**
 * Class: HSCorruptionPredictor
 * IsExplicitHSModule: Yes
 * Description: Estimates corruption yields for the Corruption page and its header quickbar.
 * Author: XxMolkxX
 */
export class HSCorruptionPredictor extends HSModule {
    #preference: TargetPreference = 'auto';
    #available: CorruptionTarget[] = [];
    #busy = false;
    #page?: PredictorControls & { select: HTMLSelectElement; result: HTMLElement };
    #quickbar?: PredictorQuickbar;

    async init(): Promise<void> {
        const controls = await HSElementHooker.HookElement('#corruptionLevelControls');
        if (!controls || document.getElementById('hs-corruption-predictor')) return;
        HSUI.injectStyle(predictorCSS, 'hs-corruption-predictor-css');
        HSUI.flushInjectedStyles();

        const saved = HSModuleRegistry.getModule('HSStorage')?.getData<string>(TARGET_PREFERENCE_KEY);
        if (typeof saved === 'string' && Object.hasOwn(CORRUPTION_TARGETS, saved)) this.#preference = saved as CorruptionTarget;

        const panel = document.createElement('section');
        panel.id = 'hs-corruption-predictor';
        panel.setAttribute('aria-label', 'Corruption predictor');
        const row = document.createElement('div');
        row.className = 'hs-corr-predictor-toolbar';
        const label = document.createElement('label');
        label.textContent = 'Optimise for';
        const select = document.createElement('select');
        select.id = 'hs-corruption-predictor-target';
        for (const preference of ['auto', ...CORRUPTION_TARGET_ORDER] as const) {
            const option = document.createElement('option');
            option.value = preference;
            option.textContent = this.#preferenceLabel(preference);
            select.append(option);
        }
        label.append(select);
        select.addEventListener('change', () => this.#setPreference(select.value as TargetPreference));

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'corruptionMax hs-corr-predictor-action';
        button.textContent = 'Find optimal level';
        button.title = ESTIMATE_TITLE;
        button.addEventListener('click', () => void this.#estimate('page'));
        const status = document.createElement('div');
        status.className = 'hs-corr-predictor-status';
        status.setAttribute('role', 'status');
        const result = document.createElement('div');
        result.className = 'hs-corr-predictor-result';
        row.append(label, button);
        panel.append(row, status, result);
        controls.after(panel);

        this.#page = { select, button, status, result };
        this.#refreshTargets();
        this.#renderTargets();
        HSModuleRegistry.getModule('HSGameData')?.subscribeGameDataChange(() => this.#refreshTargets());
        this.isInitialized = true;
    }

    /** The header mounts this row when the quickbar first opens. */
    getQuickbar(): HTMLElement | undefined {
        if (!this.isInitialized) return;
        this.#quickbar ??= this.#buildQuickbar();
        this.#refreshTargets();
        this.#renderTargets();
        this.#renderBusy();
        for (const target of CORRUPTION_TARGET_ORDER) {
            const face = this.#quickbar.choices.get(target)?.firstElementChild as HTMLElement | null | undefined;
            if (!face) continue;
            const source = document.getElementById(`corruptionCubeIcon${target}`);
            const icon = source ? HSIcons.fromElement(source) : null;
            face.style.backgroundImage = '';
            face.textContent = icon ? '' : RESOURCE_SHORT_LABELS[target];
            if (icon) HSIcons.applyBackground(face, icon, 18);
        }
        return this.#quickbar.element;
    }

    #buildQuickbar(): PredictorQuickbar {
        const element = document.createElement('div');
        element.className = 'hs-corr-predictor-quickbar';
        const group = document.createElement('div');
        group.className = 'hs-corr-predictor-choices';
        group.setAttribute('role', 'group');
        group.setAttribute('aria-label', 'Optimise for');
        const choices = new Map<TargetPreference, HTMLButtonElement>();
        for (const preference of ['auto', ...CORRUPTION_TARGET_ORDER] as const) {
            const choice = document.createElement('button');
            choice.type = 'button';
            choice.dataset.target = preference;
            choice.className = 'hs-corr-predictor-choice';
            const face = document.createElement('span');
            face.setAttribute('aria-hidden', 'true');
            face.textContent = preference === 'auto' ? 'Auto' : RESOURCE_SHORT_LABELS[preference];
            choice.append(face);
            choice.addEventListener('click', () => this.#setPreference(preference));
            choices.set(preference, choice);
            group.append(choice);
        }
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'corruptionMax hs-corr-predictor-action';
        button.textContent = 'Set best';
        button.addEventListener('click', () => void this.#estimate('quickbar'));
        const row = document.createElement('div');
        row.className = 'hs-corr-predictor-quickbar-row';
        row.append(group, button);
        const status = document.createElement('div');
        status.className = 'hs-corr-predictor-status';
        status.setAttribute('role', 'status');
        element.append(row, status);
        return { element, choices, button, status };
    }

    #target(): CorruptionTarget {
        return this.#preference === 'auto' ? this.#available.at(-1) ?? 'cubes' : this.#preference;
    }

    #preferenceLabel(preference: TargetPreference): string {
        if (preference !== 'auto') return CORRUPTION_TARGETS[preference];
        const highest = this.#available.at(-1);
        return highest ? `Auto · ${CORRUPTION_TARGETS[highest]}` : 'Auto';
    }

    #setPreference(preference: TargetPreference): void {
        if (this.#busy || preference === this.#preference) return;
        if (preference !== 'auto' && !this.#available.includes(preference)) return;
        this.#preference = preference;
        const storage = HSModuleRegistry.getModule('HSStorage');
        if (preference === 'auto') storage?.clearData(TARGET_PREFERENCE_KEY);
        else storage?.setData(TARGET_PREFERENCE_KEY, preference);
        this.#clearResults();
        this.#renderTargets();
    }

    #refreshTargets(): void {
        const api = HSModuleRegistry.getModule('HSGameDataAPI');
        const data = HSUtils.isGameLoaded() ? api?.getGameData() : undefined;
        if (!api || !data) return;
        const max = corruptionMaxLevel(data);
        const available = max > 0
            ? CORRUPTION_TARGET_ORDER.filter(target => canEarnCorruptionTarget(api, data, target, max))
            : [];
        if (available.length === this.#available.length && available.every((target, i) => target === this.#available[i])) return;
        const previousTarget = this.#target();
        const previousAvailable = this.#available.includes(previousTarget);
        this.#available = available;
        if (this.#target() !== previousTarget || previousAvailable !== available.includes(previousTarget)) this.#clearResults();
        this.#renderTargets();
    }

    #renderTargets(): void {
        if (this.#page) {
            for (const option of this.#page.select.options) {
                const preference = option.value as TargetPreference;
                option.textContent = this.#preferenceLabel(preference);
                option.disabled = preference !== 'auto' && !this.#available.includes(preference);
            }
            this.#page.select.value = this.#preference;
        }
        if (this.#quickbar) {
            const label = `Set the next corruption level for ${CORRUPTION_TARGETS[this.#target()]}`;
            this.#quickbar.button.title = label;
            this.#quickbar.button.setAttribute('aria-label', label);
            for (const [preference, choice] of this.#quickbar.choices) {
                const available = preference === 'auto' || this.#available.includes(preference);
                const selected = preference === this.#preference;
                const name = this.#preferenceLabel(preference);
                choice.hidden = !available && !selected;
                choice.title = available ? name : `${name} is locked`;
                choice.setAttribute('aria-label', choice.title);
                choice.setAttribute('aria-pressed', String(selected));
                choice.disabled = !available || this.#busy;
            }
        }
    }

    #clearResults(): void {
        this.#page?.result.replaceChildren();
        for (const controls of [this.#page, this.#quickbar]) {
            if (controls) this.#showStatus(controls.status, '');
        }
    }

    #renderBusy(): void {
        if (this.#page) this.#page.select.disabled = this.#busy;
        for (const controls of [this.#page, this.#quickbar]) {
            if (controls) controls.button.disabled = this.#busy;
        }
        if (this.#quickbar) {
            for (const [preference, choice] of this.#quickbar.choices) {
                choice.disabled = this.#busy || (preference !== 'auto' && !this.#available.includes(preference));
            }
        }
    }

    async #estimate(surface: 'page' | 'quickbar'): Promise<void> {
        const controls = surface === 'page' ? this.#page : this.#quickbar;
        if (!controls || this.#busy) return;
        this.#refreshTargets();
        const target = this.#target();
        const targetName = CORRUPTION_TARGETS[target];
        if (surface === 'page') this.#page?.result.replaceChildren();
        this.#busy = true;
        this.#renderBusy();
        this.#showStatus(controls.status, `Estimating ${targetName.toLowerCase()} yield…`);
        try {
            if (!HSUtils.isGameLoaded()) throw new Error('Wait for the save to finish loading.');
            const api = HSModuleRegistry.getModule('HSGameDataAPI');
            const game = HSModuleRegistry.getModule('HSGameData');
            const player = HSGlobal.exposedPlayer;
            const live = player ?? api?.getGameData();
            if (!api || !live) throw new Error('Game data is not available yet.');
            if (surface === 'quickbar') this.#assertCanApply(live);
            else assertCorruptionPredictionMode(live);
            const revision = game?.saveImportRevision;
            const exalt = getCorruptionExalt(live);
            const data = snapshotCorruptionData(live);
            const payout = player && data.challengecompletions[10] > 0
                ? window.__HS_calculateAscensionPayout?.() : undefined;
            const assertCurrent = () => {
                const latestPlayer = HSGlobal.exposedPlayer;
                const latest = latestPlayer ?? api.getGameData();
                if (latest && getCorruptionExalt(latest) !== exalt) {
                    throw new Error('The active Exalt changed. Calculate again.');
                }
                if (!HSUtils.isGameLoaded() || !latest || revision !== game?.saveImportRevision
                    || latestPlayer !== player || latest.firstPlayed !== data.firstPlayed
                    || latest.singularityCount !== data.singularityCount) {
                    throw new Error('The save or singularity changed. Calculate again.');
                }
                this.#refreshTargets();
                if (target !== this.#target()) throw new Error('The selected resource changed. Calculate again.');
            };
            const result = await searchCorruption({ data, context: api.getCalculationContext(), target, payout }, surface === 'page');
            assertCurrent();
            if (!result) throw new Error(`No ${targetName.toLowerCase()} yield is predicted. Check C10 progression.`);
            const { best, current } = result;
            if (surface === 'quickbar') {
                const kept = this.#applyLevel(best.level);
                this.#showStatus(controls.status, `Next ascension set to ${kept}`);
            } else if (current) {
                this.#showStatus(controls.status, '');
                this.#showResult(best, current, targetName, assertCurrent);
            }
        } catch (error) {
            this.#reportError(controls.status, error);
        } finally {
            this.#busy = false;
            this.#renderBusy();
        }
    }

    #showResult(best: CorruptionPrediction, current: CorruptionPrediction, targetName: string, assertCurrent: () => void): void {
        const page = this.#page;
        if (!page) return;
        const headline = document.createElement('div');
        headline.className = 'hs-corr-predictor-headline';
        const level = document.createElement('strong');
        level.textContent = `Estimated level ${best.level}`;
        const use = document.createElement('button');
        use.type = 'button';
        use.className = 'corruptionMax hs-corr-predictor-action';
        use.textContent = `Use level ${best.level}`;
        const applyStatus = document.createElement('div');
        applyStatus.className = 'hs-corr-predictor-status';
        applyStatus.setAttribute('role', 'status');
        use.addEventListener('click', () => {
            if (this.#busy) return;
            try {
                assertCurrent();
                const kept = this.#applyLevel(best.level);
                use.disabled = true;
                this.#showStatus(applyStatus, `Next ascension set to ${kept}`);
            } catch (error) {
                this.#reportError(applyStatus, error);
            }
        });
        headline.append(level, use);

        const summary = document.createElement('div');
        summary.className = 'hs-corr-predictor-summary';
        const ratioLog = best.scoreLog10 - current.scoreLog10;
        const ratio = ratioLog < 6 ? `${(10 ** ratioLog).toFixed(2)}×` : `10^${ratioLog.toFixed(2)}×`;
        summary.textContent = Number.isFinite(ratioLog)
            ? `${targetName} · ${ratio} vs level ${current.level} · C10: ${best.completions[10]}`
            : `${targetName} · No predicted yield at level ${current.level} · C10: ${best.completions[10]}`;

        const details = document.createElement('details');
        const caption = document.createElement('summary');
        caption.textContent = best.observed ? 'Current run’s challenge completions' : 'Predicted challenge completions';
        const counts = document.createElement('ul');
        counts.className = 'hs-corr-predictor-counts';
        best.completions.slice(1).forEach((count, i) => {
            const item = document.createElement('li');
            item.textContent = `C${i + 1}: ${count}`;
            counts.append(item);
        });
        const assumptions = document.createElement('small');
        assumptions.textContent = ASSUMPTIONS;
        details.append(caption, counts, assumptions);
        page.result.replaceChildren(headline, summary, applyStatus, details);
    }

    #assertCanApply(data: GameData): void {
        assertCorruptionPredictionMode(data);
        if (HSCorruptionLevel.getToggle('autoIncrease')) throw new Error('Turn off Auto-climb before applying an estimated level.');
        if (HSModuleRegistry.getModule('HSAutosing')?.isAutosingActive()) throw new Error('Stop Autosing before applying an estimated level.');
    }

    #applyLevel(level: number): number {
        if (!HSUtils.isGameLoaded()) throw new Error('Wait for the save to finish loading.');
        const data = HSGlobal.exposedPlayer ?? HSModuleRegistry.getModule('HSGameDataAPI')?.getGameData();
        if (!data) throw new Error('Game data is not available yet.');
        this.#assertCanApply(data);
        const max = corruptionMaxLevel(data);
        if (max <= 0) throw new Error('Complete Challenge 11 to unlock corruption levels.');
        if (level > max) throw new Error('This corruption level is locked. Calculate again.');
        const kept = HSCorruptionLevel.setNext(level);
        if (kept !== level) throw new Error('The game could not select this level. Calculate again.');
        return kept;
    }

    #showStatus(status: HTMLElement, message: string, isError = false): void {
        status.textContent = message;
        status.classList.toggle('hs-corr-predictor-error', isError);
    }

    #reportError(status: HTMLElement, error: unknown): void {
        const message = error instanceof Error ? error.message : 'Prediction failed.';
        this.#showStatus(status, message, true);
        HSLogger.warn(message, this.context);
    }
}
