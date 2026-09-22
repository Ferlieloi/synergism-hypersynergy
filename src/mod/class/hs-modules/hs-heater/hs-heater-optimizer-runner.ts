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

const PARALLEL_BRANCH_GROUPS: readonly (readonly HeaterBranchId[])[] = [
  // Start the longest measured jobs first so later short jobs can fill idle
  // worker slots. The independent branch results are combined below.
  ['hyperflux'],
  ['sr'],
  ['cubes'],
  ['oct', 'gen'],
  ['luck', 'ambOct'],
  ['quarks'],
  ['obtOff'],
]

const LOW_CORE_BRANCH_GROUPS: readonly (readonly HeaterBranchId[])[] = [
  ['obtOff', 'hyperflux', 'sr'],
  ['quarks', 'luck', 'ambOct', 'cubes', 'oct', 'gen'],
]

const ALL_BRANCHES = PARALLEL_BRANCH_GROUPS.flat()
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
  concurrency: number,
): HeaterBranchId[][] {
  const groups = concurrency <= 1
    ? [ALL_BRANCHES]
    : concurrency === 2
      ? LOW_CORE_BRANCH_GROUPS
      : PARALLEL_BRANCH_GROUPS
  return groups
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

    const availableConcurrency = Math.max(1, Math.min(
      4,
      Math.max(1, (navigator.hardwareConcurrency || 2) - 1),
    ))
    const activeGroups = activeBranchGroups(input, availableConcurrency)
    const sourceUrl = URL.createObjectURL(new Blob([HS_HEATER_WORKER_SOURCE], { type: 'text/javascript' }))
    try {
      const concurrency = Math.min(availableConcurrency, activeGroups.length)
      const results = new Array<HeaterOptimizationResult>(activeGroups.length)
      let nextIndex = 0
      const consume = async (): Promise<void> => {
        while (nextIndex < activeGroups.length) {
          const index = nextIndex++
          results[index] = await runWorker(sourceUrl, index, inputForBranches(input, activeGroups[index]))
        }
      }
      await Promise.all(Array.from({ length: concurrency }, () => consume()))
      const result = mergeResults(input, results)
      cacheResult(cacheKey, result)
      return result
    } finally {
      URL.revokeObjectURL(sourceUrl)
    }
  }
}
