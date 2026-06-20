const fs = require('fs')
const path = require('path')

// ─── Channels ────────────────────────────────────────────────────────────
// The mod is published from two different forks: an in-progress "dev" build
// and the stabilized "live" build. Each fork hosts BOTH the in-page mod
// script and its matching electron_app/patcher.js at the same path, so a
// given channel+ref always resolves both files from the SAME repo — never
// mixing a mod script from one fork with a patcher.js from another.
const CHANNELS = {
    live: {
        label: 'Live',
        repo: 'Ferlieloi/synergism-hypersynergy',
        defaultRef: 'master',
        description: 'Stable, released builds.'
    },
    dev: {
        label: 'Dev',
        repo: 'maenhiir/synergism-hypersynergy',
        defaultRef: 'master',
        description: 'In-progress / experimental builds.'
    }
}

// ─── Defaults ────────────────────────────────────────────────────────────
const DEFAULTS = {
    steamAppName: 'Synergism',
    exeName: 'Synergism-win-x64.exe',

    channels: CHANNELS,
    defaultChannel: 'live',

    // Paths are the same inside every channel's repo (same project, two forks).
    modReleasePath: 'release/mod/hypersynergism_release.js',
    patcherPath: 'synergism_modloader/lib/patcher.js'
}

function resolveChannel(channelId) {
    return DEFAULTS.channels[channelId] || DEFAULTS.channels[DEFAULTS.defaultChannel]
}

function listChannels() {
    return Object.entries(DEFAULTS.channels).map(([id, c]) => ({
        id,
        label: c.label,
        repo: c.repo,
        description: c.description,
        defaultRef: c.defaultRef
    }))
}

function configFilePath(app) {
    return path.join(app.getPath('userData'), 'loader-config.json')
}

function loadConfig(app) {
    const file = configFilePath(app)
    try {
        const raw = fs.readFileSync(file, 'utf-8')
        return { ...emptyConfig(), ...JSON.parse(raw) }
    } catch {
        return emptyConfig()
    }
}

function saveConfig(app, config) {
    const file = configFilePath(app)
    fs.mkdirSync(path.dirname(file), { recursive: true })
    fs.writeFileSync(file, JSON.stringify(config, null, 2), 'utf-8')
}

function emptyConfig() {
    return {
        steamPath: '',     // root Steam install, e.g. C:\Program Files (x86)\Steam
        gameDir: '',       // resolved .../steamapps/common/Synergism
        sevenZipPath: '',  // path to 7z.exe (full version, needed for NSIS extraction)
        channel: DEFAULTS.defaultChannel, // 'live' or 'dev' — picks which fork everything comes from
        modRef: '',        // branch/tag within that channel's repo ('' = let the UI pick the channel default)
        lastPatchedExe: '',     // launchable exe produced by the last successful patch
        lastPatchedSourceStat: null, // { size, mtimeMs } of the original exe at patch time
        lastPatchedChannel: '',
        lastPatchedModRef: ''
    }
}

module.exports = { DEFAULTS, CHANNELS, resolveChannel, listChannels, loadConfig, saveConfig, configFilePath }
