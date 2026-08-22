const assert = require('node:assert/strict')
const vm = require('node:vm')
const patchBundle = require('../synergism_modloader/lib/patcher')

const filler = 'x+=1;'.repeat(400)
const fixtures = [
  {
    name: 'esbuild boolean shorthand',
    fnName: 'aa',
    outputFn: 'za',
    code: 'za=async(t,f)=>{emit(t,f)};aa=async(e=!0)=>{p.offlinetick=Date.now();p.lastExportedSave=Date.now();read("Synergysave2");await za(save,file())}'
  },
  {
    name: 'literal true and distant save key',
    fnName: 'bb',
    outputFn: 'zb',
    code: `zb=async(t,f)=>{emit(t,f)};bb = async (shouldSave = true) => { player.offlinetick = Date.now(); player.lastExportedSave = Date.now(); ${filler} read('Synergysave2'); await zb(save, file()) }`
  },
  {
    name: 'assigned async function',
    fnName: 'dd',
    outputFn: 'zd',
    code: 'zd=async function(t,f){emit(t,f)};dd=async function(e=true){player.offlinetick=Date.now();player.lastExportedSave=Date.now();read("Synergysave2");await zd(save,file())}'
  },
  {
    name: 'named async function declaration',
    fnName: 'exportSynergism',
    outputFn: 'exportData',
    code: 'async function exportData(t,f){emit(t,f)};async function exportSynergism(e=true){player.offlinetick=Date.now();player.lastExportedSave=Date.now();read("Synergysave2");await exportData(save,file())}'
  },
  {
    name: 'ignores an earlier save-key distractor',
    fnName: 'ee',
    outputFn: 'ze',
    code: 'reset=e=>{write("Synergysave2")};ze=async(t,f)=>{emit(t,f)};noop=async e=>e;ee=async(e=true)=>{player.offlinetick=Date.now();player.lastExportedSave=Date.now();read("Synergysave2");await ze(save,file())}'
  },
  {
    name: 'exportgame click-handler with changed export internals',
    fnName: 'ff',
    outputFn: 'zf',
    bodyMarker: 'changedExportInternals',
    code: 'zf=async(t,f)=>{"saveType";"clipboard";emit(t,f)};telemetry=async()=>{};ff=async(e=true)=>{changedExportInternals();await zf(save,file());await telemetry()};c("exportgame").addEventListener("click",()=>ff())'
  },
  {
    name: 'exportgame direct click-handler',
    fnName: 'gg',
    outputFn: 'zg',
    bodyMarker: 'directExportHandler',
    code: 'zg=async function(t,f){emit(t,f)};gg=async function(){directExportHandler();await zg(save,file())};c("exportgame").addEventListener("click",gg)'
  }
]

const originalLog = console.log
const originalWarn = console.warn
console.log = () => {}
console.warn = () => {}

async function main () {
  try {
    for (const fixture of fixtures) {
      const patched = patchBundle(fixture.code)
      assert.ok(
        patched.includes(`window.__HS_exportSynergism=${fixture.fnName};`),
        `${fixture.name}: exportSynergism was not exposed`
      )
      assert.ok(
        patched.includes(`window.__HS_exportData=${fixture.outputFn};window.__HS_EXPORT_OUTPUT_PATCHED=true;`),
        `${fixture.name}: exportData was not exposed and guarded`
      )
      const bodyMarker = fixture.bodyMarker ?? 'offlinetick'
      assert.ok(
        patched.indexOf('window.__HS_exportSynergism=') < patched.indexOf(bodyMarker),
        `${fixture.name}: exposure was not injected at the function entry`
      )
      const outputMarker = patched.indexOf('if(window.__HS_SUPPRESS_EXPORT_ONCE)')
      assert.ok(
        outputMarker !== -1 && outputMarker < patched.indexOf('emit('),
        `${fixture.name}: output guard was not injected at the start of exportData`
      )
    }

    const unrelated = 'save=e=>{read("Synergysave2")}'
    assert.equal(patchBundle(unrelated), unrelated, 'unrelated save-key use must not be patched')

    const runtimeSource = [
      'outputs=0;quarks=0;',
      'out=async(t,f)=>{outputs++};',
      'exp=async()=>{quarks++;await out("save","file")};',
      'dom=()=>({addEventListener(){}});',
      'dom("exportgame").addEventListener("click",()=>exp());'
    ].join('')
    const context = { window: {}, console: { log () {}, warn () {}, error () {} } }
    vm.runInNewContext(patchBundle(runtimeSource), context)

    context.window.__HS_SILENT_EXPORT = true
    await context.exp()
    await context.exp()
    assert.equal(context.quarks, 0, 'silent exposure must never award quarks')

    context.window.__HS_SILENT_EXPORT = false
    context.window.__HS_SUPPRESS_EXPORT_ONCE = true
    await context.window.__HS_exportSynergism()
    assert.equal(context.quarks, 1, 'quark-only export must run exportSynergism')
    assert.equal(context.outputs, 0, 'quark-only export must suppress save output')
    assert.equal(context.window.__HS_SUPPRESS_EXPORT_ONCE, false, 'output guard must be one-shot')

    await context.window.__HS_exportSynergism()
    assert.equal(context.quarks, 2, 'normal export must still run exportSynergism')
    assert.equal(context.outputs, 1, 'normal export must still output the save')
  } finally {
    console.log = originalLog
    console.warn = originalWarn
  }

  console.log(`Export patch regression checks passed (${fixtures.length} variants).`)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
