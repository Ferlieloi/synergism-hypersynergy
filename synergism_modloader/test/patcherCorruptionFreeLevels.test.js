const test = require('node:test')
const assert = require('node:assert/strict')
const { patchBundle } = require('../lib/patcher.js')

// corruptionFreeLevels and the corruption display that shows it, in the shape of the minified bundle
const freeLevels = (name = 'Ef') => `${name}=()=>ve(tA)`
const display = (name = 'Ef', free = 'c(r,2,!0)') =>
    `dP=()=>{let e=n.corruptions.next;u("corruptionTierLevel").innerHTML=e;let r=${name}();` +
    `u("corruptionRewardFreeLevels").innerHTML=r>0?s.t("corruptions.tiers.freeLevels",{free:${free}}):"&nbsp;"}`

const run = (declarations, window) => {
    const warnings = []
    const code = patchBundle(
        `"use strict";const n={corruptions:{next:5}},tA=[1,2.5],ve=a=>a.reduce((x,y)=>x+y,0),s={t:(k,v)=>k+v.free},` +
        `c=x=>String(x),el={},u=()=>el;${declarations}return {dP};`,
        { log() {}, warn: (...a) => warnings.push(a.join(' ')) })
    return { game: new Function('window', code)(window), warnings: warnings.filter(w => w.includes('corruptionFreeLevels')) }
}

test('corruptionFreeLevels: exposed once the game draws the corruption display, the game\'s own function', () => {
    const window = {}
    const { game, warnings } = run(`let ${freeLevels()},${display()};`, window)
    assert.deepEqual(warnings, [])
    assert.equal(window.__HS_corruptionFreeLevels, undefined)
    game.dP()
    assert.equal(window.__HS_corruptionFreeLevels(), 3.5)
})

test('corruptionFreeLevels: names starting with "$", {free} without a format call', () => {
    const window = {}
    const { game, warnings } = run(`let ${freeLevels('$f')},${display('$f', 'r')};`, window)
    assert.deepEqual(warnings, [])
    game.dP()
    assert.equal(window.__HS_corruptionFreeLevels(), 3.5)
})

test('corruptionFreeLevels: not found, or not one {free} value, bundle left unchanged with a warning', () => {
    const bodies = [
        `let ${freeLevels()},dP=()=>{};`,
        `let ${freeLevels()},${display('Ef', 'c(r,2,!0),free:r')};`,
        `let ${freeLevels()},${display().replace('let r=Ef();', 'let r=1;')};`
    ]
    for (const body of bodies) {
        const window = {}
        const { game, warnings } = run(body, window)
        assert.equal(warnings.length, 1, body)
        game.dP()
        assert.equal(window.__HS_corruptionFreeLevels, undefined, body)
    }
})
