import { HSGameDataAPI, type HSGameCalculationContext } from '../../hs-core/gds/hs-gamedata-api';
import type { GameData } from '../../../types/data-types/hs-player-savedata';
import {
    buildCorruptionPredictionModel, canEarnCorruptionTarget, CORRUPTION_TARGETS, type CorruptionTarget,
} from './hs-corruption-prediction-model';
import {
    corruptionCompletionCeilings, scoreCorruptionLevels, validateCorruptionModel,
    type CorruptionPrediction, type CorruptionPredictionModel,
} from './hs-corruption-prediction';
import type { AscensionPayout } from './hs-corruption-snapshot';

export interface CorruptionSearchInput {
    data: GameData;
    context: HSGameCalculationContext;
    target: CorruptionTarget;
    payout?: AscensionPayout;
}

export type CorruptionWorkerRequest =
    | { phase: 'prepare'; input: CorruptionSearchInput; includeBounds: boolean }
    | { phase: 'scan' | 'detailed'; levels: number[] };

export type CorruptionWorkerResponse =
    | { ok: true; results: CorruptionPrediction[]; capScores?: number[]; observed?: CorruptionPrediction }
    | { ok: false; error: string };

const scope = self as unknown as {
    onmessage: ((event: MessageEvent<CorruptionWorkerRequest>) => void) | null;
    postMessage(response: CorruptionWorkerResponse): void;
};

let model: CorruptionPredictionModel | undefined;
let simulated: CorruptionPredictionModel | undefined;
scope.onmessage = ({ data: request }) => {
    try {
        if (request.phase === 'prepare') {
            const { data, context, target, payout } = request.input;
            const api = HSGameDataAPI.fromCalculationContext(data, context);
            const prepared = buildCorruptionPredictionModel(api, data, target, payout);
            validateCorruptionModel(prepared);
            if (!canEarnCorruptionTarget(api, data, target, prepared.maxLevel)) {
                throw new Error(`${CORRUPTION_TARGETS[target]} are locked. Select an available resource or Auto.`);
            }
            model = prepared;
            simulated = { ...prepared, observed: undefined };
            if (!request.includeBounds) {
                scope.postMessage({ ok: true, results: [] });
                return;
            }
            const ceilings = corruptionCompletionCeilings(prepared.caps, prepared.startingCompletions);
            const capScores = Array.from({ length: prepared.maxLevel + 1 }, (_, level) => {
                const score = prepared.rewardLog10(level, ceilings);
                // An invalid theoretical bound cannot justify dropping a level.
                return Number.isNaN(score) ? Infinity : score;
            });
            const observation = prepared.observed;
            const observed = observation && observation.level >= 0 && observation.level <= prepared.maxLevel
                ? { ...observation, completions: [...observation.completions],
                    scoreLog10: prepared.rewardLog10(observation.level, observation.completions), observed: true as const }
                : undefined;
            if (observed && (Number.isNaN(observed.scoreLog10) || observed.scoreLog10 === Infinity)) {
                throw new Error('Invalid reward estimate');
            }
            scope.postMessage({ ok: true, results: [], capScores, observed });
            return;
        }
        if (!model || !simulated) throw new Error('The corruption search has not started.');
        const detailed = request.phase === 'detailed';
        const results = scoreCorruptionLevels(detailed ? model : simulated, request.levels, detailed);
        scope.postMessage({ ok: true, results });
    } catch (error) {
        scope.postMessage({ ok: false, error: error instanceof Error ? error.message : String(error) });
    }
};
