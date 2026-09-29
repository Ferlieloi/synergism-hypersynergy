const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

test('shared patcher supports installed Steam loaders and browser loaders', () => {
    const source = fs.readFileSync(path.join(__dirname, '../lib/patcher.js'), 'utf8')
    const moduleShim = { exports: {} }
    const quietConsole = { log() {}, warn() {} }
    // Match the evaluation used by Loader 0.2.6 and earlier.
    const load = new Function('module', 'exports', 'console', source + '\nreturn module.exports')
    const patcher = load(moduleShim, moduleShim.exports, quietConsole)

    assert.equal(typeof patcher, 'function')
    assert.equal(typeof patcher.patchBundle, 'function')
    assert.equal(typeof patcher.startBrowserLoader, 'function')

    const steamSync = '(e||t-n>=6e4)&&'
    assert.equal(patcher(steamSync), '(t - n >= 6e4)&&')
    assert.equal(patcher.patchBundle(steamSync, { log() {}, warn() {} }), steamSync)
})
