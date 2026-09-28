const test = require('node:test')
const assert = require('node:assert/strict')
const { withRawArchiveAccess } = require('../lib/patchGame')

test('reads game archives without Electron ASAR mapping and restores the setting', async () => {
    const previous = process.noAsar
    await withRawArchiveAccess(async () => {
        assert.equal(process.noAsar, true)
    })
    assert.equal(process.noAsar, previous)

    await assert.rejects(
        withRawArchiveAccess(async () => {
            assert.equal(process.noAsar, true)
            throw new Error('archive failed')
        }),
        /archive failed/
    )
    assert.equal(process.noAsar, previous)
})