/*
    Watches what the player website is built from and rebuilds a preview into local/site/ at each change
    (build-docs.py --out local/site), leaving docs/ untouched. Run with `npm run site`; start-dev-server.bat
    starts it too. Needs Python (PYTHON overrides the command).
*/
const { spawn, spawnSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..', '..')
const outDir = path.join(root, 'local', 'site')

// Folders whose every file feeds the site.
const watchedFolders = ['docs/data', 'docs/css', 'docs/js', 'docs/res', 'src/mod/resource/img']
// Single files, watched through their folder: editors that save by replacing the file break a watch on the file.
const watchedFiles = [
  'package.json',
  'scripts/tools/build-docs.py',
  'src/mod/resource/json/hs-settings.json',
  'src/mod/resource/json/hs-settings-control-pages.json',
  'src/mod/resource/json/hs-settings-control-groups.json',
  'src/mod/class/hs-core/hs-global.ts',
  'src/mod/class/hs-core/gds/hs-calculation-definition.ts'
]

function log (line) {
  const time = new Date().toLocaleTimeString()
  console.log(`[site ${time}] ${line}`)
}

function findPython () {
  const candidates = process.env.PYTHON ? [process.env.PYTHON] : ['python', 'python3', 'py']
  for (const command of candidates) {
    const result = spawnSync(command, ['--version'], { stdio: 'ignore' })
    if (!result.error && result.status === 0) return command
  }
  return null
}

const python = findPython()
if (!python) {
  log('Python not found (set PYTHON to its command): the website preview is not built.')
  process.exit(1)
}

let building = false
let pending = false
let timer = null

function build () {
  if (building) {
    pending = true
    return
  }
  building = true
  const started = Date.now()
  const child = spawn(python, ['scripts/tools/build-docs.py', '--out', outDir], { cwd: root })
  let output = ''
  child.stdout.on('data', (chunk) => { output += chunk })
  child.stderr.on('data', (chunk) => { output += chunk })
  child.once('error', (error) => {
    building = false
    log(`build-docs.py failed to start: ${error.message}`)
  })
  child.once('close', (code) => {
    building = false
    if (code === 0) {
      const summary = output.match(/^Built [^.]*/m)
      log(`${summary ? summary[0] : 'Rebuilt'} (${Date.now() - started} ms)`)
    } else {
      log(`build failed (exit ${code}):\n${output.trimEnd()}`)
    }
    if (pending) {
      pending = false
      build()
    }
  })
}

// An editor's save often fires several events: wait for them to settle.
function scheduleBuild () {
  clearTimeout(timer)
  timer = setTimeout(build, 250)
}

for (const folder of watchedFolders) {
  fs.watch(path.join(root, folder), { recursive: true }, scheduleBuild)
}

const filesByFolder = new Map()
for (const file of watchedFiles) {
  const folder = path.dirname(file)
  if (!filesByFolder.has(folder)) filesByFolder.set(folder, new Set())
  filesByFolder.get(folder).add(path.basename(file))
}
for (const [folder, names] of filesByFolder) {
  fs.watch(path.join(root, folder), (event, filename) => {
    if (!filename || names.has(path.basename(filename.toString()))) scheduleBuild()
  })
}

fs.mkdirSync(outDir, { recursive: true })
log(`watching the website's sources; preview in ${path.relative(root, outDir)}`)
build()
