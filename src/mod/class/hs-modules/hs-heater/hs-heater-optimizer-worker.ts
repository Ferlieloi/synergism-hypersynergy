import type { HeaterOptimizationResult, HeaterOptimizerInput } from '../../../types/data-types/hs-heater-types'
import Decimal from 'break_infinity.js'
import { HSHeaterOptimizer, takeHeaterOptimizerLogs } from './hs-heater-optimizer'
import type { HeaterOptimizerLog } from './hs-heater-optimizer'

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

type HeaterWorkerRequest = {
  id: number
  input: SerializedHeaterOptimizerInput
}

type HeaterWorkerResponse =
  | { id: number; ok: true; result: HeaterOptimizationResult; logs: HeaterOptimizerLog[] }
  | { id: number; ok: false; error: string; logs: HeaterOptimizerLog[] }

const workerScope = self as unknown as {
  onmessage: ((event: MessageEvent<HeaterWorkerRequest>) => void) | null
  postMessage: (message: HeaterWorkerResponse) => void
}

workerScope.onmessage = (event): void => {
  const { id, input: serializedInput } = event.data
  try {
    const input: HeaterOptimizerInput = {
      ...serializedInput,
      runeSiExp: new Decimal(serializedInput.runeSiExp),
      runeIaExp: new Decimal(serializedInput.runeIaExp),
      runeIaBonusLevelsTotal: new Decimal(serializedInput.runeIaBonusLevelsTotal),
      runeIaBonusLevelsTalisman: new Decimal(serializedInput.runeIaBonusLevelsTalisman),
      baseTalismanPower: new Decimal(serializedInput.baseTalismanPower),
    }
    const result = HSHeaterOptimizer.createHeaterOptimizerResultFromInput(input)
    workerScope.postMessage({ id, ok: true, result, logs: takeHeaterOptimizerLogs() })
  } catch (error) {
    workerScope.postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.stack ?? error.message : String(error),
      logs: takeHeaterOptimizerLogs(),
    })
  }
}
