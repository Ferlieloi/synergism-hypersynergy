const RELEASES_URL = 'https://api.github.com/repos/Ferlieloi/synergism-hypersynergy/releases?per_page=100'
const DOWNLOAD_URL = 'https://github.com/Ferlieloi/synergism-hypersynergy/releases/download'

async function latestLauncherTag(fetchReleases = fetch) {
    const response = await fetchReleases(RELEASES_URL, {
        headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'Hypersynergism-Loader' }
    })
    if (!response.ok) throw new Error(`GitHub release check failed (${response.status}).`)
    const releases = await response.json()
    if (!Array.isArray(releases)) throw new Error('GitHub returned an invalid release list.')
    const launcherReleases = releases.filter(release =>
        !release.draft && !release.prerelease
        && /^loader-v\d+\.\d+\.\d+$/.test(release.tag_name)
        && release.assets?.some(asset => asset.name === 'latest.yml'))
    launcherReleases.sort((a, b) => b.tag_name.slice(8).localeCompare(
        a.tag_name.slice(8), undefined, { numeric: true }))
    return launcherReleases[0]?.tag_name || null
}

function createLauncherUpdater({ app, updater, notify, findRelease = latestLauncherTag }) {
    const supported = app.isPackaged && process.platform === 'win32'
    let status = {
        phase: supported ? 'idle' : 'unavailable',
        currentVersion: app.getVersion(),
        availableVersion: null,
        percent: 0,
        error: null
    }
    let checkInProgress = null

    function getStatus() {
        return { ...status }
    }

    function setStatus(patch) {
        status = { ...status, ...patch }
        notify(getStatus())
    }

    if (supported) {
        updater.autoDownload = true
        updater.autoInstallOnAppQuit = false

        updater.on('checking-for-update', () => setStatus({ phase: 'checking', error: null }))
        updater.on('update-not-available', () => setStatus({ phase: 'up-to-date', availableVersion: null, percent: 0 }))
        updater.on('update-available', info => setStatus({
            phase: 'downloading', availableVersion: info.version, percent: 0, error: null
        }))
        updater.on('download-progress', progress => setStatus({
            phase: 'downloading', percent: Math.max(0, Math.min(100, Math.round(progress.percent)))
        }))
        updater.on('update-downloaded', info => setStatus({
            phase: 'ready', availableVersion: info.version, percent: 100, error: null
        }))
        updater.on('update-cancelled', () => setStatus({
            phase: 'error', error: 'The update download was cancelled.'
        }))
        updater.on('error', error => setStatus({
            phase: 'error', error: error?.message || String(error)
        }))
    }

    function check() {
        if (!supported || status.phase === 'downloading' || status.phase === 'ready' || status.phase === 'installing') {
            return Promise.resolve(getStatus())
        }
        if (checkInProgress) return checkInProgress

        setStatus({ phase: 'checking', error: null })
        checkInProgress = Promise.resolve()
            .then(async () => {
                const tag = await findRelease()
                if (!tag) {
                    setStatus({ phase: 'no-release', error: null })
                    return
                }
                updater.setFeedURL({ provider: 'generic', url: `${DOWNLOAD_URL}/${encodeURIComponent(tag)}/` })
                await updater.checkForUpdates()
            })
            .catch(error => {
                setStatus({ phase: 'error', error: error?.message || String(error) })
            })
            .then(getStatus)
            .finally(() => { checkInProgress = null })
        return checkInProgress
    }

    function install() {
        if (!supported || status.phase !== 'ready') {
            return { ok: false, error: 'No launcher update is ready to install.' }
        }
        setStatus({ phase: 'installing' })
        setImmediate(() => {
            try {
                updater.quitAndInstall(true, true)
            } catch (error) {
                setStatus({ phase: 'error', error: error?.message || String(error) })
            }
        })
        return { ok: true }
    }

    return { getStatus, check, install }
}

module.exports = { createLauncherUpdater, latestLauncherTag }
