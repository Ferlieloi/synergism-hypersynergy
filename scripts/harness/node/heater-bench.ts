// harness-stubs: heater
// One heat in node on an HS backup's heater data (diagnostics.heater): times each stage and peak memory.
// Node times match the browser's.
// Usage: node scripts/harness/node-run.mjs scripts/harness/node/heater-bench.ts <backup.json> <branch[+branch...]>
//        (branches: the keys of heaterOptions, e.g. cubes, quarks, obtOff, luck, hyperflux)
// Env: AMB / EXALT override the input, OUT=<file> dumps the result rows,
//      SWAP=hs-heater-optimizer.ts=<copy.ts> runs a modified optimizer against the same input
import Decimal from 'break_infinity.js'
import { readFileSync, writeFileSync } from 'fs'
import { HSHeaterUIInput } from '@repo/class/hs-modules/hs-heater/ui/hs-heater-ui-input'
import { HSHeaterOptimizer } from '@repo/class/hs-modules/hs-heater/hs-heater-optimizer'

const [file, groupArg] = process.argv.slice(2)
if (!file || !groupArg) { console.error('usage: ... heater-bench.ts <backup.json> <branch[+branch...]>'); process.exit(1) }
const backup = JSON.parse(readFileSync(file, 'utf8'))
const h = backup.diagnostics?.heater
if (!h) { console.error('no diagnostics.heater in this backup (a backup from a build before 59f71ca3?)'); process.exit(1) }
// Backups from before the Active Bells input lack the NoBells fields
if (h.totalAdditiveLuckMultiplierNoAmbNoBells === undefined && !h.activeBells) {
    h.totalAdditiveLuckMultiplierNoAmbNoBells = h.totalAdditiveLuckMultiplierNoAmb
    h.finalAmbrosiaBarPointsSNoAmbNoBells = h.finalAmbrosiaBarPointsSNoAmb
    h.totalRedLuckNoAmbNoBells = h.totalRedLuckNoAmb
    h.globalEventBlueBarBonus ??= 0
}
// The backup's block is the bare hs_data: wrapped, or every input is 0
const input = HSHeaterUIInput.buildOptimizerInput({ hs_data: h })
// The modal converts the text fields to Decimal
for (const f of HSHeaterUIInput.inputDefinitions) if (f.type === 'text') (input as any)[f.key] = new Decimal(String((input as any)[f.key] ?? 0))
if (process.env.AMB) input.amb = Number(process.env.AMB)
if (process.env.EXALT) (input as any).exalt = Number(process.env.EXALT)
const group = groupArg.split('+')
input.heaterOptions = Object.fromEntries(Object.keys(input.heaterOptions).map(b => [b, group.includes(b)])) as any

const t0 = performance.now()
const { result, diagnostics } = HSHeaterOptimizer.runExperiment(input)
const total = performance.now() - t0
console.log(`== ${groupArg}: ${(total / 1000).toFixed(1)} s, peak RSS ${(process.resourceUsage().maxRSS / 1e3).toFixed(0)} MB`)
for (const s of diagnostics.stages)
    console.log(`  ${s.name.padEnd(28)} ${(s.elapsedMs / 1000).toFixed(2).padStart(7)} s  ${JSON.stringify(s.sizes)}`)
if (process.env.OUT) { const { input: _i, ...rest } = result as any; writeFileSync(process.env.OUT, JSON.stringify(rest, null, 1)) }
process.exit(0)
