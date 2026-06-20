const els = {
  statusPill: document.getElementById('statusPill'),

  steamPathInput: document.getElementById('steamPathInput'),
  browseSteamBtn: document.getElementById('browseSteamBtn'),
  autodetectSteamBtn: document.getElementById('autodetectSteamBtn'),
  gameDirOutput: document.getElementById('gameDirOutput'),
  gameDirStatus: document.getElementById('gameDirStatus'),

  sevenZipInput: document.getElementById('sevenZipInput'),
  browse7zBtn: document.getElementById('browse7zBtn'),
  autodetect7zBtn: document.getElementById('autodetect7zBtn'),
  sevenZipStatus: document.getElementById('sevenZipStatus'),

  toStep2Btn: document.getElementById('toStep2Btn'),
  backTo1Btn: document.getElementById('backTo1Btn'),
  backTo2Btn: document.getElementById('backTo2Btn'),
  toStep3Btn: document.getElementById('toStep3Btn'),

  modRefSelect: document.getElementById('modRefSelect'),
  refreshRefsBtn: document.getElementById('refreshRefsBtn'),
  refsStatus: document.getElementById('refsStatus'),
  modUrlPreview: document.getElementById('modUrlPreview'),
  patcherUrlPreview: document.getElementById('patcherUrlPreview'),
  channelToggle: document.getElementById('channelToggle'),
  channelStatus: document.getElementById('channelStatus'),

  summaryGameDir: document.getElementById('summaryGameDir'),
  summaryChannel: document.getElementById('summaryChannel'),
  summaryModRef: document.getElementById('summaryModRef'),
  updateBanner: document.getElementById('updateBanner'),
  mismatchBanner: document.getElementById('mismatchBanner'),
  quickSwitchBtn: document.getElementById('quickSwitchBtn'),

  launchOnlyBtn: document.getElementById('launchOnlyBtn'),
  patchAndLaunchBtn: document.getElementById('patchAndLaunchBtn'),
  console: document.getElementById('console')
}

const EXE_NAME = 'Synergism-win-x64.exe'

let state = {
  steamPath: '',
  gameDir: '',
  sevenZipPath: '',
  channel: 'live',
  modRef: '',
  lastPatchedExe: '',
  channels: []
}

// ─── Step navigation ─────────────────────────────────────────────────────
const TAB_NAMES = ['locate', 'build', 'patch']

function goToStep(n) {
  // Show/hide step panels
  document.querySelectorAll('.step').forEach(el => {
    el.classList.toggle('is-active', Number(el.dataset.step) === n)
  })

  // Tab active state
  document.querySelectorAll('#tabs button').forEach(btn => {
    const idx = TAB_NAMES.indexOf(btn.dataset.tab) + 1
    btn.classList.toggle('tab-active', idx === n)
  })

  // Mini step indicator nodes
  for (let i = 1; i <= 3; i++) {
    const node = document.getElementById(`node${i}`)
    if (!node) continue
    node.classList.toggle('current', i === n)
    node.classList.toggle('done', i < n)
  }

  // Fill lines
  const fill1 = document.getElementById('fill1')
  const fill2 = document.getElementById('fill2')
  if (fill1) fill1.style.width = n > 1 ? '100%' : '0%'
  if (fill2) fill2.style.width = n > 2 ? '100%' : '0%'

  updateSummary()
}

// Allow clicking tabs to navigate back (not forward to unvisited steps)
document.querySelectorAll('#tabs button').forEach(btn => {
  btn.addEventListener('click', async () => {
    const target = TAB_NAMES.indexOf(btn.dataset.tab) + 1
    if (target === 3) {
      await window.loader.saveConfig({ channel: state.channel, modRef: state.modRef })
      updateSummary()
      await refreshUpdateBanner()
    }
    goToStep(target)
  })
})

els.toStep2Btn.addEventListener('click', async () => {
  await window.loader.saveConfig({
    steamPath: state.steamPath,
    gameDir: state.gameDir,
    sevenZipPath: state.sevenZipPath
  })
  goToStep(2)
})
els.backTo1Btn.addEventListener('click', () => goToStep(1))
els.toStep3Btn.addEventListener('click', async () => {
  await window.loader.saveConfig({ channel: state.channel, modRef: state.modRef })
  updateSummary()
  await refreshUpdateBanner()
  goToStep(3)
})
els.backTo2Btn.addEventListener('click', () => goToStep(2))

// ─── Status pill ─────────────────────────────────────────────────────────
function setPill(text, kind) {
  els.statusPill.textContent = text
  els.statusPill.className = `pill pill-${kind}`
}

// ─── Step 1: Steam + 7-Zip detection ────────────────────────────────────
async function refreshGameDirFromSteamPath() {
  if (!state.steamPath) return
  const { gameDir } = await window.loader.locateGame(state.steamPath)
  state.gameDir = gameDir || ''
  els.gameDirOutput.value = gameDir || ''
  if (gameDir) {
    els.gameDirStatus.textContent = 'Found Synergism in this Steam library.'
    els.gameDirStatus.className = 'status-line ok'
  } else {
    els.gameDirStatus.textContent = "Couldn't find Synergism under this Steam install — check the path or that the game is installed."
    els.gameDirStatus.className = 'status-line error'
  }
  updateContinueButton()
}

els.steamPathInput.addEventListener('change', () => {
  state.steamPath = els.steamPathInput.value.trim()
  refreshGameDirFromSteamPath()
})

els.browseSteamBtn.addEventListener('click', async () => {
  const picked = await window.loader.selectSteamFolder()
  if (picked) {
    state.steamPath = picked
    els.steamPathInput.value = picked
    refreshGameDirFromSteamPath()
  }
})

els.autodetectSteamBtn.addEventListener('click', async () => {
  els.gameDirStatus.textContent = 'Searching…'
  els.gameDirStatus.className = 'status-line'
  const { steamPath, gameDir } = await window.loader.autodetectSteam()
  if (steamPath) {
    state.steamPath = steamPath
    els.steamPathInput.value = steamPath
  }
  state.gameDir = gameDir || ''
  els.gameDirOutput.value = gameDir || ''
  if (gameDir) {
    els.gameDirStatus.textContent = 'Found Synergism automatically.'
    els.gameDirStatus.className = 'status-line ok'
  } else {
    els.gameDirStatus.textContent = steamPath
      ? "Found Steam, but couldn't find Synergism in any library — check it's installed."
      : "Couldn't find a Steam install automatically — set the folder manually."
    els.gameDirStatus.className = 'status-line error'
  }
  updateContinueButton()
})

els.sevenZipInput.addEventListener('change', () => {
  state.sevenZipPath = els.sevenZipInput.value.trim()
  updateContinueButton()
})

els.browse7zBtn.addEventListener('click', async () => {
  const picked = await window.loader.select7z()
  if (picked) {
    state.sevenZipPath = picked
    els.sevenZipInput.value = picked
    els.sevenZipStatus.textContent = ''
    updateContinueButton()
  }
})

els.autodetect7zBtn.addEventListener('click', async () => {
  const found = await window.loader.autodetect7z()
  if (found) {
    state.sevenZipPath = found
    els.sevenZipInput.value = found
    els.sevenZipStatus.textContent = 'Found 7-Zip automatically.'
    els.sevenZipStatus.className = 'status-line ok'
  } else {
    els.sevenZipStatus.textContent = 'Could not find 7-Zip — install it or browse to 7z.exe manually.'
    els.sevenZipStatus.className = 'status-line error'
  }
  updateContinueButton()
})

function updateContinueButton() {
  els.toStep2Btn.disabled = !(state.gameDir && state.sevenZipPath)
}

document.querySelectorAll('a[data-external]').forEach(a => {
  a.addEventListener('click', (e) => {
    e.preventDefault()
    window.loader.openExternal(a.dataset.external)
  })
})

// ─── Step 2: channel + mod build selection ──────────────────────────────
function renderChannelToggle() {
  els.channelToggle.innerHTML = ''
  for (const ch of state.channels) {
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'btn-channel'
    btn.dataset.channel = ch.id
    btn.textContent = ch.label
    btn.classList.toggle('is-active', ch.id === state.channel)
    btn.addEventListener('click', async () => {
      if (state.channel === ch.id) return
      state.channel = ch.id
      state.modRef = '' // let loadModRefs pick this channel's default ref
      renderChannelToggle()
      await loadModRefs()
    })
    els.channelToggle.appendChild(btn)
  }
  const active = state.channels.find(c => c.id === state.channel)
  els.channelStatus.textContent = active ? `${active.description} (${active.repo})` : ''
  els.channelStatus.className = 'status-line'
}

async function loadModRefs() {
  els.refsStatus.textContent = 'Loading branches and tags…'
  els.refsStatus.className = 'status-line'
  const { branches, tags, defaultRef, error } = await window.loader.getModRefs(state.channel)

  els.modRefSelect.innerHTML = ''
  const addGroup = (label, names) => {
    if (!names.length) return
    const group = document.createElement('optgroup')
    group.label = label
    for (const name of names) {
      const opt = document.createElement('option')
      opt.value = name
      opt.textContent = name
      group.appendChild(opt)
    }
    els.modRefSelect.appendChild(group)
  }
  addGroup('Branches', branches)
  addGroup('Tags', tags)

  const options = [...els.modRefSelect.options]
  if (state.modRef && options.some(o => o.value === state.modRef)) {
    els.modRefSelect.value = state.modRef
  } else if (options.some(o => o.value === defaultRef)) {
    state.modRef = defaultRef
    els.modRefSelect.value = defaultRef
  } else if (options.length) {
    state.modRef = options[0].value
  }

  if (error) {
    els.refsStatus.textContent = `Couldn't reach GitHub (${error}) — showing the default branch only.`
    els.refsStatus.className = 'status-line error'
  } else {
    els.refsStatus.textContent = `${branches.length} branch(es), ${tags.length} tag(s) available.`
    els.refsStatus.className = 'status-line ok'
  }
  await updateUrlPreviews()
}

async function updateUrlPreviews() {
  els.modUrlPreview.value = await window.loader.resolveModUrl(state.channel, state.modRef)
  els.patcherUrlPreview.value = await window.loader.resolvePatcherUrl(state.channel, state.modRef)
}

els.modRefSelect.addEventListener('change', () => {
  state.modRef = els.modRefSelect.value
  updateUrlPreviews()
})

els.refreshRefsBtn.addEventListener('click', loadModRefs)

// ─── Step 3: summary, patch, launch ─────────────────────────────────────
function updateSummary() {
  els.summaryGameDir.textContent = state.gameDir || '—'
  const active = state.channels.find(c => c.id === state.channel)
  els.summaryChannel.textContent = active ? active.label : (state.channel || '—')
  els.summaryModRef.textContent = state.modRef || '—'
}

function appendConsoleLine(line, kind) {
  const div = document.createElement('div')
  if (kind) div.className = `line-${kind}`
  div.textContent = line
  els.console.appendChild(div)
  els.console.scrollTop = els.console.scrollHeight
}

window.loader.onPatchLog((line) => {
  appendConsoleLine(line, /error|fail/i.test(line) ? 'error' : null)
})

async function refreshUpdateBanner() {
  if (!state.gameDir) return
  const { needsRepatch } = await window.loader.checkUpdateNeeded({ gameDir: state.gameDir, exeName: EXE_NAME })
  els.updateBanner.classList.toggle('is-hidden', !needsRepatch)

  // Check if the selected channel/ref differs from what was last patched
  const { mismatch, lastChannel, lastModRef } = await window.loader.checkVersionMismatch({
    channel: state.channel,
    modRef: state.modRef
  })
  els.mismatchBanner.classList.toggle('is-hidden', !mismatch || !state.lastPatchedExe)
  els.quickSwitchBtn.style.display = (mismatch && state.lastPatchedExe) ? '' : 'none'
  els.quickSwitchBtn.disabled = needsRepatch  // can't quick-switch if game needs full repatch anyway

  els.launchOnlyBtn.disabled = needsRepatch || !state.lastPatchedExe || mismatch
}

els.patchAndLaunchBtn.addEventListener('click', async () => {
  els.console.innerHTML = ''
  els.patchAndLaunchBtn.disabled = true
  els.launchOnlyBtn.disabled = true
  setPill('Patching…', 'busy')
  appendConsoleLine(`Patching with "${state.channel}" build "${state.modRef}"…`)

  const result = await window.loader.runPatch({
    gameDir: state.gameDir,
    sevenZipPath: state.sevenZipPath,
    channel: state.channel,
    modRef: state.modRef
  })

  if (result.ok) {
    state.lastPatchedExe = result.launchExePath
    setPill('Patched', 'ok')
    appendConsoleLine(`Launching ${result.launchExePath}`, 'ok')
    const modUrl = await window.loader.resolveModUrl(state.channel, state.modRef)
    const launch = await window.loader.launchGame(result.launchExePath, modUrl)
    if (!launch.ok) appendConsoleLine(`Launch failed: ${launch.error}`, 'error')
  } else {
    setPill('Error', 'error')
    appendConsoleLine(`Patch failed: ${result.error}`, 'error')
  }

  els.patchAndLaunchBtn.disabled = false
  await refreshUpdateBanner()
})

els.launchOnlyBtn.addEventListener('click', async () => {
  if (!state.lastPatchedExe) return
  const cfg = await window.loader.loadConfig()
  const modUrl = await window.loader.resolveModUrl(
    cfg.lastPatchedChannel || state.channel,
    cfg.lastPatchedModRef || state.modRef
  )
  const launch = await window.loader.launchGame(state.lastPatchedExe, modUrl)
  if (!launch.ok) appendConsoleLine(`Launch failed: ${launch.error}`, 'error')
})

els.quickSwitchBtn.addEventListener('click', async () => {
  els.quickSwitchBtn.disabled = true
  setPill('Switching…', 'busy')
  const modUrl = await window.loader.resolveModUrl(state.channel, state.modRef)
  const result = await window.loader.quickSwitchMod({ modUrl, channel: state.channel, modRef: state.modRef })
  if (result.ok) {
    setPill('Switched', 'ok')
    appendConsoleLine(`Mod URL switched to ${modUrl} — launching now.`, 'ok')
    await refreshUpdateBanner()
    const launch = await window.loader.launchGame(state.lastPatchedExe, modUrl)
    if (!launch.ok) appendConsoleLine(`Launch failed: ${launch.error}`, 'error')
  } else {
    setPill('Error', 'error')
    appendConsoleLine(`Quick switch failed: ${result.error}`, 'error')
  }
  els.quickSwitchBtn.disabled = false
})

  // ─── Startup: load persisted config and pre-fill everything ────────────
  ; (async function init() {
    const cfg = await window.loader.loadConfig()
    state.steamPath = cfg.steamPath || ''
    state.gameDir = cfg.gameDir || ''
    state.sevenZipPath = cfg.sevenZipPath || ''
    state.lastPatchedExe = cfg.lastPatchedExe || ''

    state.channels = await window.loader.getChannels()
    state.channel = (cfg.channel && state.channels.some(c => c.id === cfg.channel))
      ? cfg.channel
      : (state.channels[0]?.id || 'live')
    state.modRef = cfg.modRef || ''

    els.steamPathInput.value = state.steamPath
    els.gameDirOutput.value = state.gameDir
    els.sevenZipInput.value = state.sevenZipPath
    updateContinueButton()

    renderChannelToggle()
    await loadModRefs()
    updateSummary()
    await refreshUpdateBanner()
    goToStep(1)
  })()
