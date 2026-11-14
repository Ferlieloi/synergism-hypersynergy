import { HSModule } from '../../hs-core/module/hs-module';
import { HSModuleRegistry } from '../../hs-core/module/hs-module-registry';
import { HSElementHooker } from '../../hs-core/hs-elementhooker';
import { HSCorruptionLevel } from '../../hs-core/hs-corruption-level';
import { HSLogger } from '../../hs-core/hs-logger';
import { HSUtils } from '../../hs-utils/hs-utils';
import { buildCorruptionPredictionModel } from './hs-corruption-prediction-model';
import { findOptimalCorruption, predictCorruptionLevel } from './hs-corruption-prediction';
import type { GameData } from '../../../types/data-types/hs-player-savedata';

function predictionKey(data: GameData): string {
    return JSON.stringify([data.singularityCount, data.highestSingularityCount, data.corruptions.highestCleared,
        data.researches, data.cubeUpgrades, data.platonicUpgrades, data.ambrosiaUpgrades, data.runeEXP,
        data.shopUpgrades, data.goldenQuarkUpgrades, data.octUpgrades, data.redAmbrosiaUpgrades,
        data.purpleAmbrosiaUpgrades, data.currentChallenge.ascension, data.insideSingularityChallenge]);
}

/**
 * Class: HSCorruptionPredictor
 * IsExplicitHSModule: Yes
 * Description: Estimates the best corruption level for a fixed two-pass challenge sweep.
 * Author: XxMolkxX
 */
export class HSCorruptionPredictor extends HSModule {
    async init(): Promise<void> {
        const controls = await HSElementHooker.HookElement('#corruptionLevelControls');
        if (!controls || document.getElementById('hs-corruption-predictor')) return;
        const panel = document.createElement('div');
        panel.id = 'hs-corruption-predictor';
        panel.style.cssText = 'margin:8px 0;min-height:32px';
        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = 'Find optimal level';
        button.className = 'corruptionMax';
        button.title = 'Estimate ordinary cubes after two C1–C10 sweeps: 0.5s then 20s per challenge, with 0.1s gaps. Assumes capped production and maxed C6–C8.';
        const output = document.createElement('div');
        output.setAttribute('role', 'status');
        output.style.cssText = 'color:var(--silver-text-color,#aaa);margin-top:6px';
        panel.append(button, output);
        controls.after(panel);
        button.addEventListener('click', async () => {
            button.disabled = true;
            button.textContent = 'Calculating…';
            output.replaceChildren();
            await new Promise(resolve => setTimeout(resolve, 0));
            try {
                if (!HSUtils.isGameLoaded()) throw new Error('Wait for the save to finish loading.');
                const api = HSModuleRegistry.getModule('HSGameDataAPI');
                const live = api?.getGameData();
                if (!api || !live) throw new Error('Game data is not available yet.');
                const snapshot = JSON.parse(JSON.stringify(live)) as GameData;
                const key = predictionKey(snapshot);
                const isolated = api.createCalculationSnapshot(snapshot);
                const model = buildCorruptionPredictionModel(isolated, snapshot);
                const best = findOptimalCorruption(model);
                if (!best) throw new Error('No level is predicted to complete C10 under these assumptions.');
                const current = predictCorruptionLevel(model, Math.min(snapshot.corruptions.used, model.maxLevel));
                const summary = document.createElement('div');
                summary.textContent = `Estimated level: ${best.level}. C10 completions: ${best.completions[10]}.`;
                const assumptions = document.createElement('div');
                assumptions.textContent = 'Production-ceiling estimate: assumes immediate capped coin production, maxed C6–C8, and fixed upgrades, runes, ants and building counts. Startup can change the winner.';
                const details = document.createElement('details');
                const caption = document.createElement('summary');
                caption.textContent = 'Predicted challenge completions';
                const counts = document.createElement('div');
                counts.textContent = best.completions.slice(1).map((n, i) => `C${i + 1}: ${n}`).join(' · ');
                details.append(caption, counts);
                const comparison = document.createElement('div');
                const ratioLog = best.scoreLog10 - current.scoreLog10;
                comparison.textContent = Number.isFinite(ratioLog)
                    ? `Relative cube yield vs level ${current.level}: ${ratioLog < 6 ? (10 ** ratioLog).toFixed(2) + '×' : '10^' + ratioLog.toFixed(2) + '×'}.`
                    : `Level ${current.level} is predicted to fail C10.`;
                const use = document.createElement('button');
                use.type = 'button';
                use.className = 'corruptionMax';
                use.textContent = `Use level ${best.level}`;
                use.addEventListener('click', () => {
                    try {
                        const now = api.getGameData();
                        if (!now || predictionKey(now) !== key) throw new Error('Progression changed. Find the optimal level again.');
                        buildCorruptionPredictionModel(api.createCalculationSnapshot(now), now);
                        if (HSCorruptionLevel.getToggle('autoIncrease')) throw new Error('Turn off Auto-climb before applying an estimated level.');
                        const autosing = HSModuleRegistry.getModule('HSAutosing');
                        if (autosing?.isAutosingActive()) throw new Error('Stop Autosing before applying an estimated level.');
                        const kept = HSCorruptionLevel.setNext(best.level);
                        if (kept !== best.level) throw new Error('The game could not select this level. Calculate again.');
                        use.textContent = `Next ascension: level ${kept}`;
                        use.disabled = true;
                    } catch (error) {
                        const message = error instanceof Error ? error.message : 'Could not apply the level.';
                        const warning = document.createElement('div');
                        warning.textContent = message;
                        output.append(warning);
                        HSLogger.warn(message, this.context);
                    }
                });
                output.append(summary, comparison, assumptions, details, use);
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Prediction failed.';
                output.textContent = message;
                HSLogger.warn(message, this.context);
            } finally {
                button.disabled = false;
                button.textContent = 'Find optimal level';
            }
        });
        this.isInitialized = true;
    }
}
