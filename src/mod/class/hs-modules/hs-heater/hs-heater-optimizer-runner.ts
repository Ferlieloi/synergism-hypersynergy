import type {
  HeaterOptimizationResult,
  HeaterOptimizerInput,
  HeaterRedAmbUpgradeEffects,
} from '../../../types/data-types/hs-heater-types'
import type {
  HeaterOptimizerStage,
  HeaterWorkerRequest,
  HeaterWorkerResponse,
  SerializedHeaterOptimizerInput,
} from '../../../types/data-types/hs-heater-worker-types'
import type { HeaterBranchId } from './hs-heater-result-config'
import { HSHeaterOptimizer, takeHeaterOptimizerLogs } from './hs-heater-optimizer'
import type { HeaterOptimizerLog } from './hs-heater-optimizer'
import { HSLogger } from '../../hs-core/hs-logger'
import { escapeLogText } from './hs-heater-utils'

declare const HS_HEATER_WORKER_SOURCE: string

const LOG_CONTEXT = 'HSHeater'

type BranchGroup = { branches: readonly HeaterBranchId[]; lane: 0 | 1 }

const BRANCH_GROUPS: readonly BranchGroup[] = [
  // Groups run in disposable workers. Cube/SR reuse their Cube/Voucher and
  // Luck-Cube frontiers; Quarks/Obt/Off reuse their Luck, Rune and Voucher
  // inputs but keep separate objective-specific frontiers.
  // Purple reuses the Luck branch's luck and voucher tables.
  // Max Amb + Oct reuses the Oct branch's Octeract tables.
  // With two workers, each lane runs its groups one after the other: the two
  // largest (S260: ~0.8 GB peak each) share lane 0, so they never run at once.
  { branches: ['hyperflux'], lane: 0 },
  { branches: ['cubes', 'sr'], lane: 0 },
  { branches: ['oct', 'ambOct'], lane: 1 },
  { branches: ['coinsC15'], lane: 1 },
  { branches: ['luck', 'purple'], lane: 1 },
  { branches: ['quarks', 'obtOff', 'obtAndOff'], lane: 1 },
]

const ALL_BRANCHES = BRANCH_GROUPS.flatMap(group => group.branches)
const RESULT_CACHE_LIMIT = 4
const resultCache = new Map<string, HeaterOptimizationResult>()

function serializeInput(input: HeaterOptimizerInput): SerializedHeaterOptimizerInput {
  return {
    ...input,
    runeSiExp: input.runeSiExp.toString(),
    runeIaExp: input.runeIaExp.toString(),
    runeIaBonusLevelsTotal: input.runeIaBonusLevelsTotal.toString(),
    runeIaBonusLevelsTalisman: input.runeIaBonusLevelsTalisman.toString(),
    baseTalismanPower: input.baseTalismanPower.toString(),
  }
}

function cacheResult(key: string, result: HeaterOptimizationResult): void {
  resultCache.delete(key)
  resultCache.set(key, result)
  while (resultCache.size > RESULT_CACHE_LIMIT) {
    const oldestKey = resultCache.keys().next().value as string | undefined
    if (oldestKey === undefined)
      break
    resultCache.delete(oldestKey)
  }
}

function activeBranchGroups(
  input: HeaterOptimizerInput,
): BranchGroup[] {
  return BRANCH_GROUPS
    .map(group => ({ ...group, branches: group.branches.filter(branch => input.heaterOptions[branch]) }))
    .filter(group => group.branches.length > 0)
}

// Below this, two workers fall back to one. deviceMemory (GB, rounded down,
// at most 8) is Chromium only: unknown counts as enough.
const TWO_WORKERS_MIN_MEMORY_GB = 8
const TWO_WORKERS_MIN_THREADS = 4

// Why this computer can't take two workers, or null if it can
function twoWorkersBlocker(): string | null {
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory
  if (memory !== undefined && memory < TWO_WORKERS_MIN_MEMORY_GB)
    return `${memory} GB of memory reported`
  const threads = navigator.hardwareConcurrency
  if (threads !== undefined && threads < TWO_WORKERS_MIN_THREADS)
    return `${threads} CPU threads reported`
  return null
}

function inputForBranches(input: HeaterOptimizerInput, branches: readonly HeaterBranchId[]): HeaterOptimizerInput {
  const enabled = new Set(branches)
  return {
    ...input,
    heaterOptions: Object.fromEntries(
      Object.keys(input.heaterOptions).map(branch => [branch, enabled.has(branch as HeaterBranchId)]),
    ) as Record<HeaterBranchId, boolean>,
  }
}

function mergeRedAmbEffects(
  target: HeaterRedAmbUpgradeEffects | undefined,
  source: HeaterRedAmbUpgradeEffects | undefined,
): HeaterRedAmbUpgradeEffects | undefined {
  if (source === undefined)
    return target
  const merged: HeaterRedAmbUpgradeEffects = { ...(target ?? {}) }
  for (const [name, effects] of Object.entries(source)) {
    const key = name as keyof HeaterRedAmbUpgradeEffects
    merged[key] = { ...(merged[key] ?? {}), ...effects }
  }
  return merged
}

function mergeResults(input: HeaterOptimizerInput, parts: HeaterOptimizationResult[]): HeaterOptimizationResult {
  const merged: HeaterOptimizationResult = { input }
  for (const part of parts) {
    for (const [key, value] of Object.entries(part)) {
      if (key === 'input' || key === 'redAmbUpgradeEffects')
        continue
      ;(merged as unknown as Record<string, unknown>)[key] = value
    }
    merged.redAmbUpgradeEffects = mergeRedAmbEffects(
      merged.redAmbUpgradeEffects,
      part.redAmbUpgradeEffects,
    )
  }
  return merged
}

// The optimizer's warnings and errors, written to the mod's log. The log tab
// renders a line as HTML, and a stack trace can hold "<anonymous>".
function writeOptimizerLogs(logs: readonly HeaterOptimizerLog[]): void {
  for (const log of logs) {
    if (log.level === 'error')
      HSLogger.error(escapeLogText(log.message), log.context)
    else
      HSLogger.warn(escapeLogText(log.message), log.context)
  }
}

function formatSeconds(ms: number): string {
  return `${(ms / 1000).toFixed(1)} s`
}

// One debug line per group with the optimizer's stage times. A stage that
// holds sub-stages is listed after them, with their total.
function logStages(branches: string, stages: readonly HeaterOptimizerStage[]): void {
  HSLogger.debug(() => `Heat stages, ${branches}: ${stages
    .filter(stage => stage.elapsedMs >= 50)
    .map(stage => `${stage.name} ${formatSeconds(stage.elapsedMs)}`)
    .join(', ') || 'none over 0.05 s'}`, LOG_CONTEXT)
}

// A heat the player cancelled: not a failure, and nothing of it is kept.
export class HSHeatCancelledError extends Error {
  constructor() {
    super('Heat cancelled')
    this.name = 'HSHeatCancelledError'
  }
}

// Each stops one running worker of the heat in progress
const runningWorkerStops = new Set<() => void>()
let heatCancelled = false

function stopRunningWorkers(): void {
  for (const stop of [...runningWorkerStops])
    stop()
}

function runWorker(
  sourceUrl: string,
  id: number,
  input: HeaterOptimizerInput,
): Promise<{ result: HeaterOptimizationResult; stages: HeaterOptimizerStage[] }> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(sourceUrl)
    const stop = (): void => {
      cleanup()
      reject(new HSHeatCancelledError())
    }
    const cleanup = (): void => {
      runningWorkerStops.delete(stop)
      worker.terminate()
    }
    runningWorkerStops.add(stop)
    worker.onmessage = (event: MessageEvent<HeaterWorkerResponse>): void => {
      if (event.data.id !== id)
        return
      cleanup()
      writeOptimizerLogs(event.data.logs)
      if (event.data.ok)
        resolve({ result: event.data.result, stages: event.data.stages })
      else
        reject(new Error(event.data.error))
    }
    worker.onerror = (event): void => {
      cleanup()
      reject(new Error(event.message || 'Heater worker failed'))
    }
    const request: HeaterWorkerRequest = { id, input: serializeInput(input) }
    worker.postMessage(request)
  })
}

export class HSHeaterOptimizerRunner {
  // A heat can only be cancelled when it runs in a worker: without one it
  // runs on the page, which is frozen until it ends.
  static get canCancel(): boolean {
    return typeof Worker !== 'undefined' && typeof HS_HEATER_WORKER_SOURCE === 'string' && !!HS_HEATER_WORKER_SOURCE
  }

  // Cancels the heat in progress: its workers are terminated, the groups
  // already heated are dropped, and createResult rejects with
  // HSHeatCancelledError.
  static cancel(): void {
    heatCancelled = true
    stopRunningWorkers()
  }

  // onProgress is called before each worker group starts, with the number
  // of groups started so far (from 1), only when the heat runs in a worker.
  // twoWorkers: run the two lanes of BRANCH_GROUPS at once, when this
  // computer reports enough memory and CPU threads.
  static async createResult(
    input: HeaterOptimizerInput,
    onProgress?: (group: number, groupCount: number) => void,
    twoWorkers = false,
  ): Promise<HeaterOptimizationResult> {
    if (!ALL_BRANCHES.some(branch => input.heaterOptions[branch]))
      return { input }

    const cacheKey = JSON.stringify(serializeInput(input))
    const activeGroups = activeBranchGroups(input)
    const groupName = (group: BranchGroup): string => group.branches.join('+')
    const branchNames = activeGroups.map(groupName).join(', ')
    const cached = resultCache.get(cacheKey)
    if (cached !== undefined) {
      resultCache.delete(cacheKey)
      resultCache.set(cacheKey, cached)
      HSLogger.info(`Heat: ${branchNames} (same input as an earlier heat, result reused)`, LOG_CONTEXT)
      return { ...cached, input }
    }

    const startedAt = performance.now()
    heatCancelled = false
    // For the log: the groups a cancel stopped, the group that failed
    const stoppedGroups: string[] = []
    let failedGroup: string | null = null
    try {
      if (typeof Worker === 'undefined' || typeof HS_HEATER_WORKER_SOURCE !== 'string' || !HS_HEATER_WORKER_SOURCE) {
        await new Promise<void>(resolve => setTimeout(resolve, 0))
        let result: HeaterOptimizationResult
        try {
          const experiment = HSHeaterOptimizer.runExperiment(input)
          result = experiment.result
          logStages(branchNames, experiment.diagnostics.stages)
        } finally {
          writeOptimizerLogs(takeHeaterOptimizerLogs())
        }
        cacheResult(cacheKey, result)
        HSLogger.info(`Heat done in ${formatSeconds(performance.now() - startedAt)}, without a worker: ${branchNames}`, LOG_CONTEXT)
        return result
      }

      // A branch keeps several large Pareto frontiers alive at once. Running
      // multiple branches in parallel multiplies that peak and can exhaust the
      // browser process even though each individual search fits: one lane
      // runs its groups one at a time, and at most two lanes run at once.
      // Terminating a worker between groups also releases its entire heap
      // deterministically.
      const indexes = activeGroups.map((_, index) => index)
      const blocker = twoWorkers ? twoWorkersBlocker() : null
      const lanes = twoWorkers && blocker === null
        ? [0, 1].map(lane => indexes.filter(index => activeGroups[index].lane === lane)).filter(lane => lane.length > 0)
        : [indexes]
      const sourceUrl = URL.createObjectURL(new Blob([HS_HEATER_WORKER_SOURCE], { type: 'text/javascript' }))
      try {
        // By group index, so the merge order doesn't depend on which lane ends first
        const results: HeaterOptimizationResult[] = []
        const groupTimes: string[] = []
        let started = 0
        let failure: unknown = null
        const runLane = async (lane: number[]): Promise<void> => {
          for (const [position, index] of lane.entries()) {
            // Cancelled, or the other lane failed, while no worker of this lane was running
            if (heatCancelled || failure !== null)
              return
            const name = groupName(activeGroups[index])
            onProgress?.(++started, activeGroups.length)
            const groupStartedAt = performance.now()
            try {
              const { result: groupResult, stages } = await runWorker(sourceUrl, index, inputForBranches(input, activeGroups[index].branches))
              results[index] = groupResult
              logStages(name, stages)
              groupTimes[index] = `${name} ${formatSeconds(performance.now() - groupStartedAt)}`
            } catch (error) {
              // A worker stopped by a cancel, or by the other lane's failure
              if (error instanceof HSHeatCancelledError) {
                stoppedGroups.push(name)
                return
              }
              failedGroup = name
              failure = error
              // The other lane's results would be dropped: stop it now
              stopRunningWorkers()
              return
            }
            // Let the browser dispose of the terminated worker's heap before a
            // second large branch starts allocating its own frontiers.
            if (position + 1 < lane.length)
              await new Promise<void>(resolve => setTimeout(resolve, 50))
          }
        }
        await Promise.all(lanes.map(runLane))
        if (failure !== null)
          throw failure
        if (heatCancelled)
          throw new HSHeatCancelledError()
        const result = mergeResults(input, results)
        cacheResult(cacheKey, result)
        const workers = lanes.length > 1 ? ' (2 workers)'
          : blocker !== null ? ` (1 worker: ${blocker})` : ''
        HSLogger.info(`Heat done in ${formatSeconds(performance.now() - startedAt)}${workers}: ${groupTimes.filter(Boolean).join(', ')}`, LOG_CONTEXT)
        return result
      } finally {
        URL.revokeObjectURL(sourceUrl)
      }
    } catch (error) {
      if (error instanceof HSHeatCancelledError) {
        const stopped = stoppedGroups.length > 0 ? `while heating ${stoppedGroups.join(' and ')}` : 'between two groups'
        HSLogger.info(`Heat cancelled after ${formatSeconds(performance.now() - startedAt)}, ${stopped}`, LOG_CONTEXT)
        throw error
      }
      // The error itself is logged by the caller. The input is what reproduces it.
      HSLogger.error(`Heat failed after ${formatSeconds(performance.now() - startedAt)}, while heating ${failedGroup ?? branchNames}. Input: ${escapeLogText(cacheKey)}`, LOG_CONTEXT)
      throw error
    }
  }
}
