const assert = require('node:assert/strict')
const { readFileSync } = require('node:fs')
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

    const capSource = [
      'player={researches:Array(106).fill(0),cubeUpgrades:Array(30).fill(0),singularityChallenges:{oneChallengeCap:{enabled:false}}};',
      'player.cubeUpgrades[29]=3;',
      'noise=(index)=>player.cubeUpgrades[29];',
      'cap=(challenge)=>{',
      'const nested=()=>player.singularityChallenges.oneChallengeCap.enabled;',
      'if(nested())return 1;',
      'if(player.researches[105])return 9001;',
      'if(challenge>5)return 40+4*player.cubeUpgrades[29]+effect("reincarnationChallengeCap");',
      'return 25;',
      '};',
      'function effect(){return 2}'
    ].join('')
    const capContext = { window: {}, console: { log () {}, warn () {}, error () {} } }
    vm.runInNewContext(patchBundle(capSource), capContext)
    assert.equal(capContext.cap(6), 54, 'challenge cap must retain the game behavior')
    assert.equal(capContext.window.__HS_getMaxChallenges, capContext.cap, 'cap exposure must use the enclosing function')

    const distantBody = '{const nested=()=>0;nested()}'.repeat(100)
    const tackSource = [
      'events=[];',
      'timers=(name)=>events.push(name);',
      'noise=()=>timers("autoPotion");',
      `gameTick=(dt)=>{${distantBody}timers("prestige");timers("autoPotion");timers("ascension");timers("quarks");events.push("finished")};`
    ].join('')
    const tackContext = {
      window: {},
      queueMicrotask,
      console: { log () {}, warn () {}, error () {} }
    }
    vm.runInNewContext(patchBundle(tackSource), tackContext)
    tackContext.gameTick(1)
    assert.equal(typeof tackContext.window.__HS_onAfterTack, 'function', 'tack hook must be exposed from a distant body header')
    tackContext.events.length = 0
    tackContext.window.__HS_onAfterTack(() => tackContext.events.push('hook'))
    tackContext.gameTick(1)
    await new Promise(resolve => setImmediate(resolve))
    assert.deepEqual(Array.from(tackContext.events.slice(-2)), ['finished', 'hook'], 'after-tack hook must run after game updates')

    // Rocket Loader inserts a clone of out.js before a MutationObserver can
    // react. Verify that each browser loader marks the clone inert first and
    // still acknowledges its load so Rocket Loader can continue.
    for (const loader of ['hypersynergism.user.js', 'hypersynergism.dev.js']) {
      const loaderSource = readFileSync(`src/loader/${loader}`, 'utf8')
      const start = loaderSource.indexOf('    function interceptInsertedGameScript(node)')
      const end = loaderSource.indexOf('    // ─── Script interception', start)
      assert.ok(start !== -1 && end !== -1, `${loader}: interception code missing`)
      const snippet = loaderSource.slice(start, end)
      let gameExecutions = 0
      let loadAcknowledgements = 0
      let patchStarts = 0
      class FakeNode {
        insertBefore (node) { if (node.type === 'text/javascript') node.execute(); return node }
        appendChild (node) { if (node.type === 'text/javascript') node.execute(); return node }
        replaceChild (node) { if (node.type === 'text/javascript') node.execute(); return node }
      }
      const interceptionContext = {
        Node: FakeNode,
        Event: class { constructor (type) { this.type = type } },
        queueMicrotask,
        debug () {},
        injectPatchedBundle () { patchStarts++ }
      }
      vm.runInNewContext(`let gameScriptDetected=false;${snippet}`, interceptionContext)
      const makeScript = () => ({
        nodeType: 1,
        localName: 'script',
        src: 'https://synergism.cc/dist/out.js',
        type: 'text/javascript',
        getAttribute () { return this.src },
        setAttribute () {},
        execute () { gameExecutions++ },
        dispatchEvent (event) { if (event.type === 'load') this.onload?.() },
        remove () {}
      })
      for (const method of ['insertBefore', 'appendChild', 'replaceChild']) {
        const script = makeScript()
        const parent = new FakeNode()
        parent[method](script, null)
        script.onload = () => { loadAcknowledgements++ }
      }
      await new Promise(resolve => setImmediate(resolve))
      assert.equal(gameExecutions, 0, `${loader}: Rocket Loader's original game copy must not execute`)
      assert.equal(loadAcknowledgements, 3, `${loader}: blocked scripts must acknowledge load`)
      assert.equal(patchStarts, 1, `${loader}: patched bundle fetch must start once`)
    }
  } finally {
    console.log = originalLog
    console.warn = originalWarn
  }

  console.log(`Loader patch regression checks passed (${fixtures.length} export variants, challenge cap, tack, and Rocket Loader interception).`)
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
