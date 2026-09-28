const test = require('node:test')
const assert = require('node:assert/strict')
const { EventEmitter } = require('node:events')
const { createLauncherUpdater, latestLauncherTag } = require('../lib/launcherUpdater')

function setup(isPackaged = true, findRelease = async () => 'loader-v0.2.1') {
    const updater = new EventEmitter()
    const states = []
    const feeds = []
    updater.setFeedURL = options => feeds.push(options)
    const controller = createLauncherUpdater({
        app: { isPackaged, getVersion: () => '0.2.0' },
        updater,
        notify: state => states.push(state),
        findRelease
    })
    return { updater, states, controller, feeds }
}

test('downloads a newer launcher and installs only after explicit restart', async () => {
    const { updater, controller, feeds } = setup()
    let installs = 0
    updater.checkForUpdates = async () => {
        updater.emit('update-available', { version: '0.2.1' })
    }
    updater.quitAndInstall = (silent, runAfter) => {
        assert.equal(silent, true)
        assert.equal(runAfter, true)
        installs++
    }

    assert.equal(updater.autoDownload, true)
    assert.equal(updater.autoInstallOnAppQuit, false)
    assert.equal(controller.install().ok, false)
    await controller.check()
    assert.deepEqual(feeds, [{ provider: 'generic', url: 'https://github.com/Ferlieloi/synergism-hypersynergy/releases/download/loader-v0.2.1/' }])
    assert.equal(controller.getStatus().phase, 'downloading')
    updater.emit('download-progress', { percent: 51.7 })
    assert.equal(controller.getStatus().percent, 52)
    updater.emit('update-downloaded', { version: '0.2.1' })
    assert.equal(controller.getStatus().phase, 'ready')
    assert.equal(installs, 0)

    assert.equal(controller.install().ok, true)
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(installs, 1)
})

test('coalesces update checks and allows retry after an error', async () => {
    const { updater, controller } = setup()
    let checks = 0
    let finishCheck
    updater.checkForUpdates = () => {
        checks++
        return new Promise(resolve => { finishCheck = resolve })
    }

    const first = controller.check()
    const second = controller.check()
    assert.equal(first, second)
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(checks, 1)
    updater.emit('update-not-available')
    finishCheck()
    await first
    assert.equal(controller.getStatus().phase, 'up-to-date')

    updater.checkForUpdates = async () => { throw new Error('Network unavailable') }
    await controller.check()
    assert.equal(controller.getStatus().phase, 'error')
    assert.match(controller.getStatus().error, /Network unavailable/)
})

test('does not check for updates in the development app', async () => {
    const { controller } = setup(false)
    assert.equal((await controller.check()).phase, 'unavailable')
    assert.equal(controller.install().ok, false)
})

test('ignores mod releases and selects the newest published launcher with update metadata', async () => {
    const releases = [
        { tag_name: 'v2.14.4a', assets: [{ name: 'latest.yml' }] },
        { tag_name: 'loader-v0.2.9', assets: [{ name: 'latest.yml' }] },
        { tag_name: 'loader-v0.2.10', assets: [{ name: 'latest.yml' }] },
        { tag_name: 'loader-v0.3.0', draft: true, assets: [{ name: 'latest.yml' }] },
        { tag_name: 'loader-v0.2.11', assets: [] }
    ]
    const tag = await latestLauncherTag(async () => ({ ok: true, json: async () => releases }))
    assert.equal(tag, 'loader-v0.2.10')
})

test('reports an unpublished launcher without calling the updater', async () => {
    const { updater, controller, feeds } = setup(true, async () => null)
    updater.checkForUpdates = () => { throw new Error('Should not check without release files') }
    await controller.check()
    assert.equal(controller.getStatus().phase, 'no-release')
    assert.deepEqual(feeds, [])
})