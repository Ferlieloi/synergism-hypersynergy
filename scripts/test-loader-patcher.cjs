const assert = require('node:assert/strict')
const patchBundle = require('../synergism_modloader/lib/patcher')

const filler = 'x+=1;'.repeat(400)
const fixtures = [
  {
    name: 'esbuild boolean shorthand',
    fnName: 'aa',
    code: 'aa=async(e=!0)=>{p.offlinetick=Date.now();p.lastExportedSave=Date.now();read("Synergysave2")}'
  },
  {
    name: 'literal true and distant save key',
    fnName: 'bb',
    code: `bb = async (shouldSave = true) => { player.offlinetick = Date.now(); player.lastExportedSave = Date.now(); ${filler} read('Synergysave2') }`
  },
  {
    name: 'synchronous arrow',
    fnName: 'cc',
    code: 'cc=(e=true)=>{player.offlinetick=Date.now();player.lastExportedSave=Date.now();read("Synergysave2")}'
  },
  {
    name: 'assigned async function',
    fnName: 'dd',
    code: 'dd=async function(e=true){player.offlinetick=Date.now();player.lastExportedSave=Date.now();read("Synergysave2")}'
  },
  {
    name: 'named async function declaration',
    fnName: 'exportSynergism',
    code: 'async function exportSynergism(e=true){player.offlinetick=Date.now();player.lastExportedSave=Date.now();read("Synergysave2")}'
  },
  {
    name: 'ignores an earlier save-key distractor',
    fnName: 'ee',
    code: 'reset=e=>{write("Synergysave2")};ee=async(e=>0);ee=async(e=true)=>{player.offlinetick=Date.now();player.lastExportedSave=Date.now();read("Synergysave2")}'
  }
]

const originalLog = console.log
const originalWarn = console.warn
console.log = () => {}
console.warn = () => {}

try {
  for (const fixture of fixtures) {
    const patched = patchBundle(fixture.code)
    assert.ok(
      patched.includes(`window.__HS_exportData=${fixture.fnName};`),
      `${fixture.name}: export function was not exposed`
    )
    assert.ok(
      patched.indexOf('window.__HS_exportData=') < patched.indexOf('offlinetick'),
      `${fixture.name}: exposure was not injected at the function entry`
    )
  }

  const unrelated = 'save=e=>{read("Synergysave2")}'
  assert.equal(patchBundle(unrelated), unrelated, 'unrelated save-key use must not be patched')
} finally {
  console.log = originalLog
  console.warn = originalWarn
}

console.log(`Export patch regression checks passed (${fixtures.length} variants).`)
