const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('loader', {
    loadConfig: () => ipcRenderer.invoke('config:load'),
    saveConfig: (partial) => ipcRenderer.invoke('config:save', partial),

    autodetectSteam: () => ipcRenderer.invoke('steam:autodetect'),
    locateGame: (steamPath) => ipcRenderer.invoke('steam:locate-game', steamPath),
    selectSteamFolder: () => ipcRenderer.invoke('dialog:select-steam-folder'),

    autodetect7z: () => ipcRenderer.invoke('sevenzip:autodetect'),
    select7z: () => ipcRenderer.invoke('dialog:select-7z'),

    getChannels: () => ipcRenderer.invoke('channels:list'),
    getModRefs: (channel) => ipcRenderer.invoke('mod:get-refs', channel),
    resolveModUrl: (channel, ref) => ipcRenderer.invoke('mod:resolve-url', channel, ref),
    resolvePatcherUrl: (channel, ref) => ipcRenderer.invoke('patcher:resolve-url', channel, ref),

    runPatch: (args) => ipcRenderer.invoke('patch:run', args),
    checkUpdateNeeded: (args) => ipcRenderer.invoke('game:check-update-needed', args),
    checkVersionMismatch: (args) => ipcRenderer.invoke('mod:check-version-mismatch', args),
    quickSwitchMod: (args) => ipcRenderer.invoke('mod:quick-switch', args),
    launchGame: (exePath, modUrl) => ipcRenderer.invoke('game:launch', exePath, modUrl),

    openPath: (target) => ipcRenderer.invoke('shell:open-path', target),
    openExternal: (url) => ipcRenderer.invoke('shell:open-external', url),

    onPatchLog: (callback) => {
        const listener = (_e, line) => callback(line)
        ipcRenderer.on('patch:log', listener)
        return () => ipcRenderer.removeListener('patch:log', listener)
    }
})
