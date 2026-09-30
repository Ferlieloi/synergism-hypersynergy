const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')
const { detectSteamPathWindows, detectSevenZip } = require('../lib/steamLocator')

test('Steam registry detection yields so the window can process events while a query is pending', async t => {
    const steamPath = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-steam-'))
    t.after(() => fs.rmSync(steamPath, { recursive: true, force: true }))
    let completeQuery
    const detection = detectSteamPathWindows({
        platform: 'win32',
        run: (_command, _args, options, callback) => {
            assert.equal(options.timeout, 3000)
            assert.equal(options.windowsHide, true)
            completeQuery = callback
        }
    })
    let resolved = false
    detection.then(() => { resolved = true })
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(resolved, false)
    completeQuery(null, `SteamPath    REG_SZ    ${steamPath}\r\n`)
    assert.equal(await detection, steamPath)
})

test('Steam detection tries the next registry key after a timeout', async t => {
    const steamPath = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-steam-'))
    t.after(() => fs.rmSync(steamPath, { recursive: true, force: true }))
    let calls = 0
    const result = await detectSteamPathWindows({
        platform: 'win32',
        run: (_command, args, _options, callback) => {
            calls++
            if (calls === 1) callback(Object.assign(new Error('timed out'), { killed: true }))
            else callback(null, `${args[3]}    REG_SZ    ${steamPath}\r\n`)
        }
    })
    assert.equal(calls, 2)
    assert.equal(result, steamPath)
})

test('7-Zip detection resolves the executable from an asynchronous registry query', async t => {
    const installPath = fs.mkdtempSync(path.join(os.tmpdir(), 'hs-7zip-'))
    t.after(() => fs.rmSync(installPath, { recursive: true, force: true }))
    const exe = path.join(installPath, '7z.exe')
    fs.writeFileSync(exe, '')
    const result = await detectSevenZip({
        platform: 'win32',
        run: (_command, _args, options, callback) => {
            assert.equal(options.timeout, 3000)
            setImmediate(() => callback(null, `Path    REG_SZ    ${installPath}\r\n`))
        }
    })
    assert.equal(result, exe)
})

test('registry detection does not spawn Windows commands on other platforms', async () => {
    const options = { platform: 'linux', run: () => assert.fail('Unexpected Windows command') }
    await detectSteamPathWindows(options)
    await detectSevenZip(options)
})
