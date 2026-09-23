import type {
  HeaterOptimizationResult,
  HeaterOptimizerInput,
  HeaterRedAmbUpgradeEffects,
} from '../../../types/data-types/hs-heater-types'
import type { HeaterBranchId } from './hs-heater-result-config'
import { HSHeaterOptimizer } from './hs-heater-optimizer'

declare const HS_HEATER_WORKER_SOURCE: string

type HeaterWorkerResponse =
  | { id: number; ok: true; result: HeaterOptimizationResult }
  | { id: number; ok: false; error: string }

type SerializedHeaterOptimizerInput = Omit<
  HeaterOptimizerInput,
  'runeSiExp' | 'runeIaExp' | 'runeIaBonusLevelsTotal' | 'runeIaBonusLevelsTalisman' | 'baseTalismanPower'
> & {
  runeSiExp: string
  runeIaExp: string
  runeIaBonusLevelsTotal: string
  runeIaBonusLevelsTalisman: string
  baseTalismanPower: string
}

const BRANCH_GROUPS: readonly (readonly HeaterBranchId[])[] = [
  // Groups run sequentially in disposable workers. Cube/SR reuse their
  // Cube/Voucher and Luck-Cube frontiers; Quarks/Obt/Off reuse their Luck,
  // Rune and Voucher inputs but keep separate objective-specific frontiers.
  ['hyperflux'],
  ['cubes', 'sr'],
  ['oct', 'gen'],
  ['luck', 'ambOct'],
  ['quarks', 'obtOff'],
]

const ALL_BRANCHES = BRANCH_GROUPS.flat()
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
): HeaterBranchId[][] {
  return BRANCH_GROUPS
    .map(group => group.filter(branch => input.heaterOptions[branch]))
    .filter(group => group.length > 0)
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

function runWorker(sourceUrl: string, id: number, input: HeaterOptimizerInput): Promise<HeaterOptimizationResult> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(sourceUrl)
    const cleanup = (): void => worker.terminate()
    worker.onmessage = (event: MessageEvent<HeaterWorkerResponse>): void => {
      if (event.data.id !== id)
        return
      cleanup()
      if (event.data.ok)
        resolve(event.data.result)
      else
        reject(new Error(event.data.error))
    }
    worker.onerror = (event): void => {
      cleanup()
      reject(new Error(event.message || 'Heater worker failed'))
    }
    worker.postMessage({ id, input: serializeInput(input) })
  })
}

export class HSHeaterOptimizerRunner {
  static async createResult(input: HeaterOptimizerInput): Promise<HeaterOptimizationResult> {
    if (!ALL_BRANCHES.some(branch => input.heaterOptions[branch]))
      return { input }

    const cacheKey = JSON.stringify(serializeInput(input))
    const cached = resultCache.get(cacheKey)
    if (cached !== undefined) {
      resultCache.delete(cacheKey)
      resultCache.set(cacheKey, cached)
      return { ...cached, input }
    }

    if (typeof Worker === 'undefined' || typeof HS_HEATER_WORKER_SOURCE !== 'string' || !HS_HEATER_WORKER_SOURCE) {
      await new Promise<void>(resolve => setTimeout(resolve, 0))
      const result = HSHeaterOptimizer.createHeaterOptimizerResultFromInput(input)
      cacheResult(cacheKey, result)
      return result
    }

    // A branch keeps several large Pareto frontiers alive at once. Running
    // multiple branches in parallel multiplies that peak and can exhaust the
    // browser process even though each individual search fits. Terminating a
    // worker between groups also releases its entire heap deterministically.
    const activeGroups = activeBranchGroups(input)
    const sourceUrl = URL.createObjectURL(new Blob([HS_HEATER_WORKER_SOURCE], { type: 'text/javascript' }))
    try {
      const results: HeaterOptimizationResult[] = []
      for (let index = 0; index < activeGroups.length; index++) {
        results.push(await runWorker(sourceUrl, index, inputForBranches(input, activeGroups[index])))
        // Let the browser dispose of the terminated worker's heap before a
        // second large branch starts allocating its own frontiers.
        if (index + 1 < activeGroups.length)
          await new Promise<void>(resolve => setTimeout(resolve, 50))
      }
      const result = mergeResults(input, results)
      cacheResult(cacheKey, result)
      return result
    } finally {
      URL.revokeObjectURL(sourceUrl)
    }
  }
}
