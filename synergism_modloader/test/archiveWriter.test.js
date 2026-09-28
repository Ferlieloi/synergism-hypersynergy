const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { Writable } = require('node:stream')
const asar = require('@electron/asar')
const { createPackageAndWait } = require('../lib/archiveWriter')

test('waits for the archive output stream to close', async () => {
    const output = new Writable({ write(_chunk, _encoding, done) { done() } })
    let completed = false
    const packageTask = createPackageAndWait({ createPackage: async () => output }, 'source', 'archive.asar')
        .then(() => { completed = true })

    await new Promise(resolve => setImmediate(resolve))
    assert.equal(completed, false)
    output.end()
    await packageTask
    assert.equal(output.closed, true)
    assert.equal(completed, true)
})

test('creates a readable archive before returning', async t => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-asar-test-'))
    t.after(() => fs.rmSync(root, { recursive: true, force: true }))
    const source = path.join(root, 'source')
    const archive = path.join(root, 'app.asar')
    fs.mkdirSync(source)
    fs.writeFileSync(path.join(source, 'build.txt'), 'ready')

    await createPackageAndWait(asar, source, archive)
    assert.equal(asar.extractFile(archive, 'build.txt').toString(), 'ready')
})
