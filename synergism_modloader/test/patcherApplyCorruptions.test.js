const test = require('node:test')
const assert = require('node:assert/strict')
const { patchBundle } = require('../lib/patcher.js')

// applyCorruptions' body, in the shape of the minified bundle: the legacy "a/b/c" format or JSON, then the next corruptions
const applyBody = (p = 'e') =>
    `let t;if(!${p})return!1;if(${p}.includes("/")&&${p}.split("/").length===8)t=mx(${p}.split("/").map(Number));` +
    `else{let r=JSON.parse(${p});t=Tn.parse(r)}` +
    'return t?(n.corruptions.next.setCorruptionLevelsWithChallengeRequirement(t),Ga(!0,0),!0):!1'
// corruptionLoadLoadout, the same setter without the import: must not be picked
const loadLoadout = 'kg=e=>{let t=n.corruptions.saves[e];n.corruptions.next.setCorruptionLevelsWithChallengeRequirement(t),Ga(!0)}'
// importCorruptionsPrompt, the game's own caller
const prompt = (name = 'fx') => `Rp=e=>${name}(e)?!0:(D("corruptions.importCorruptionsPrompt.importError"),!1)`

const run = (declarations, window) => {
    const warnings = []
    const code = patchBundle(
        '"use strict";const n={corruptions:{saves:[{a:1}],next:{v:null,setCorruptionLevelsWithChallengeRequirement(t){this.v=t}}}},' +
        'mx=a=>({legacy:a.length}),Tn={parse:r=>r},Ga=()=>{},D=()=>{};' +
        `${declarations}return {Rp,kg,n};`,
        { log() {}, warn: (...a) => warnings.push(a.join(' ')) })
    return { game: new Function('window', code)(window), warnings: warnings.filter(w => w.includes('applyCorruptions')) }
}

test('applyCorruptions: exposed when the bundle runs, same function as the game uses', () => {
    const window = {}
    const { game, warnings } = run(`let ${loadLoadout},fx=e=>{${applyBody()}},${prompt()};`, window)
    assert.deepEqual(warnings, [])
    assert.equal(typeof window.__HS_applyCorruptions, 'function')
    assert.equal(window.__HS_applyCorruptions('{"viscosity":3}'), true)
    assert.deepEqual(game.n.corruptions.next.v, { viscosity: 3 })
    assert.equal(window.__HS_applyCorruptions('1/2/3/4/5/6/7/8'), true)
    assert.deepEqual(game.n.corruptions.next.v, { legacy: 8 })
    assert.equal(window.__HS_applyCorruptions(''), false)
    // The game's own calls still work
    assert.equal(game.Rp('{"drought":1}'), true)
    assert.deepEqual(game.n.corruptions.next.v, { drought: 1 })
    game.kg(0)
    assert.deepEqual(game.n.corruptions.next.v, { a: 1 })
})

test('applyCorruptions: parameter not named "e", names starting with "$", other ".includes("/")"', () => {
    const window = {}
    const others = 'q=e=>e.includes("/"),w=a=>{let $x=a=>a;return a.includes(\'/\')?$x(1):JSON.parse(a)},'
    const { game, warnings } = run(`let ${others}${loadLoadout},$x=a=>{${applyBody('a')}},${prompt('$x')};`, window)
    assert.deepEqual(warnings, [])
    assert.equal(window.__HS_applyCorruptions('{"hyperchallenge":5}'), true)
    assert.deepEqual(game.n.corruptions.next.v, { hyperchallenge: 5 })
    assert.equal(game.Rp('{"drought":1}'), true)
})

test('applyCorruptions: a function declaration is exposed at its first call', () => {
    const window = {}
    const { game, warnings } = run(`function fx(e){${applyBody()}}let ${loadLoadout},${prompt()};`, window)
    assert.deepEqual(warnings, [])
    assert.equal(window.__HS_applyCorruptions, undefined)
    assert.equal(game.Rp('{"drought":1}'), true)
    assert.equal(window.__HS_applyCorruptions('{"drought":2}'), true)
    assert.deepEqual(game.n.corruptions.next.v, { drought: 2 })
})

test('applyCorruptions: not found, bundle left unchanged with a warning', () => {
    const window = {}
    const { warnings } = run(`let ${loadLoadout},fx=e=>e.includes("/"),${prompt()};`, window)
    assert.equal(window.__HS_applyCorruptions, undefined)
    assert.equal(warnings.length, 1)
})
