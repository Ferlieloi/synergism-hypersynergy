const assert = require('node:assert/strict')
const test = require('node:test')
const vm = require('node:vm')
const { buildInjectorCode } = require('../lib/injectorTemplate')

test('Steam injector waits for mod initialization and does not start it twice', async () => {
    let finishInitialization
    const initialization = new Promise(resolve => { finishInitialization = resolve })
    const messages = []
    let initCalls = 0
    const window = { hypersynergism: { init: () => { initCalls++ } } }
    const document = {
        createElement: () => ({ textContent: '' }),
        head: {
            appendChild() { window.__HS_INIT_PROMISE = initialization }
        }
    }
    const context = {
        window, document,
        process: { env: {} },
        fetch: async () => ({ ok: true, text: async () => 'mod source' }),
        console: { log: (...args) => messages.push(args.join(' ')), error: () => {} }
    }

    vm.runInNewContext(buildInjectorCode('https://example.test/mod.js'), context)
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(initCalls, 0)
    assert.equal(messages.some(message => message.includes('Mod initialized')), false)

    finishInitialization()
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(messages.some(message => message.includes('Mod initialized')), true)
})

test('Steam injector reports a failed mod download', async () => {
    const errors = []
    let appended = false
    const context = {
        window: {},
        document: {
            createElement: () => ({ textContent: '' }),
            head: { appendChild() { appended = true } }
        },
        process: { env: {} },
        fetch: async () => ({ ok: false, status: 503 }),
        console: { log: () => {}, error: (...args) => errors.push(args) }
    }

    vm.runInNewContext(buildInjectorCode('https://example.test/mod.js'), context)
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(appended, false)
    assert.match(String(errors[0]?.[1]), /HTTP 503/)
})
