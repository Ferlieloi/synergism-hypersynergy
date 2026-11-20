import workerSource from 'hs-corruption-worker-source';
import { rankCorruptionResults, shortlistCorruptionLevels, type CorruptionPrediction } from './hs-corruption-prediction';
import { corruptionMaxLevel } from './hs-corruption-prediction-model';
import type { CorruptionSearchInput, CorruptionWorkerRequest, CorruptionWorkerResponse } from './hs-corruption-worker';
import { scanCorruptionAdaptively } from './hs-corruption-adaptive-scan';

type WorkerResult = Extract<CorruptionWorkerResponse, { ok: true }>;

/** Each worker scores one batch at a time and retains its calculation model between batches. */
class CorruptionWorker {
    readonly #worker: Worker;
    #pending?: { resolve: (result: WorkerResult) => void; reject: (error: Error) => void };
    #failure?: Error;

    constructor(url: string) {
        this.#worker = new Worker(url);
        this.#worker.onmessage = ({ data }: MessageEvent<CorruptionWorkerResponse>) => {
            const pending = this.#pending;
            this.#pending = undefined;
            if (data.ok) pending?.resolve(data);
            else pending?.reject(new Error(data.error));
        };
        this.#worker.onerror = event => {
            event.preventDefault();
            this.#fail(new Error(event.message || 'The corruption worker could not start.'));
        };
        this.#worker.onmessageerror = () => this.#fail(new Error('The corruption worker returned unreadable data.'));
    }

    #fail(error: Error): void {
        this.#failure = error;
        this.#pending?.reject(error);
        this.#pending = undefined;
    }

    run(request: CorruptionWorkerRequest): Promise<WorkerResult> {
        if (this.#failure) return Promise.reject(this.#failure);
        return new Promise((resolve, reject) => {
            this.#pending = { resolve, reject };
            try {
                this.#worker.postMessage(request);
            } catch (error) {
                this.#pending = undefined;
                reject(error);
            }
        });
    }

    close(): void {
        this.#fail(new Error('The corruption search ended.'));
        this.#worker.terminate();
    }
}

export interface CorruptionSearchResult {
    best: CorruptionPrediction;
    current?: CorruptionPrediction;
}

export async function searchCorruption(input: CorruptionSearchInput, compareCurrent: boolean,
    workerCount: 1 | 2 = navigator.hardwareConcurrency > 1 ? 2 : 1): Promise<CorruptionSearchResult | null> {
    if (typeof Worker === 'undefined') throw new Error('Corruption prediction requires background workers.');
    const max = corruptionMaxLevel(input.data);
    if (!Number.isInteger(max) || max < 0 || max > 10000) throw new Error('Unsupported challenge limits or scaling');
    const lanes = Math.min(workerCount, max + 1);
    const url = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }));
    const workers: CorruptionWorker[] = [];
    try {
        for (let lane = 0; lane < lanes; lane++) workers.push(new CorruptionWorker(url));
        const [prepared] = await Promise.all(workers.map((worker, lane) =>
            worker.run({ phase: 'prepare', input, includeBounds: lane === 0 })));
        const score = async (levels: number[], phase: 'scan' | 'detailed') => {
            const results: CorruptionPrediction[] = [];
            const batchSize = phase === 'scan' ? 2 : 1;
            let next = 0;
            await Promise.all(workers.map(async worker => {
                while (next < levels.length) {
                    const batch = levels.slice(next, next + batchSize);
                    next += batchSize;
                    results.push(...(await worker.run({ phase, levels: batch })).results);
                }
            }));
            return results;
        };
        if (!prepared.capScores) throw new Error('The corruption worker did not return payout bounds.');
        const ranked = await scanCorruptionAdaptively(max, prepared.capScores, prepared.observed,
            levels => score(levels, 'scan'));
        if (!ranked.length) return null;
        const shortlist = shortlistCorruptionLevels(ranked, max, prepared.observed?.level);
        const currentLevel = Math.min(input.data.corruptions.used, max);
        const detailLevels = [...new Set(compareCurrent ? [...shortlist, currentLevel] : shortlist)];
        const details = await score(detailLevels, 'detailed');
        const best = rankCorruptionResults(details.filter(result => shortlist.includes(result.level)))[0] ?? ranked[0];
        if (!compareCurrent) return { best };
        const current = currentLevel === best.level ? best : details.find(result => result.level === currentLevel);
        return { best, current };
    } finally {
        for (const worker of workers) worker.close();
        URL.revokeObjectURL(url);
    }
}
