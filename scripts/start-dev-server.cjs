const { execSync, spawn, spawnSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const isWindows = process.platform === 'win32'

// Runs the globally installed http-server through node itself: through its .cmd shim, Windows puts a cmd.exe
// between us and the server, and killing that cmd.exe leaves the server running.
function findHttpServerEntry () {
  try {
    const globalRoot = execSync('npm root -g', { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
    const entry = path.join(globalRoot, 'http-server', 'bin', 'http-server')
    if (fs.existsSync(entry)) return entry
  } catch {}
  return null
}
const httpServerEntry = findHttpServerEntry()

function httpServerProcess (name, args, optional = false) {
  if (httpServerEntry) {
    return { name, command: process.execPath, args: [httpServerEntry, ...args], shell: false, optional }
  }
  return { name, command: 'http-server', args, shell: isWindows, optional }
}

// The website preview (local/site/, rebuilt at each change of its sources) is optional: when it stops (no Python, a
// port taken), the mod's build and server keep running.
const siteDir = path.join(projectRoot, 'local', 'site')
fs.mkdirSync(siteDir, { recursive: true })

const processes = [
  {
    name: 'build watcher',
    command: process.execPath,
    args: ['esbuild.config.js', 'dev'],
    shell: false
  },
  httpServerProcess('HTTP server', ['./build/', '--mimetypes', './mimes.types', '--cors']),
  {
    name: 'website watcher',
    command: process.execPath,
    args: ['scripts/tools/watch-site.cjs'],
    shell: false,
    optional: true
  },
  // No cache, so a reload shows the latest build; silent, or every request would be logged.
  httpServerProcess('website server', [siteDir, '-p', '8081', '-c-1', '-s'], true)
]

let shuttingDown = false
let exitCode = 0

// No child reads the console: on Windows, http-server reads it in raw mode, which turns Ctrl+C into a key press only
// it sees, instead of a signal every process gets.
const children = processes.map(({ name, command, args, shell, optional }) => {
  const child = spawn(command, args, {
    cwd: projectRoot,
    stdio: ['ignore', 'inherit', 'inherit'],
    shell
  })

  child.once('error', (error) => {
    console.error(`${name} failed to start:`, error)
    if (!optional) shutdown(1)
  })

  child.once('exit', (code, signal) => {
    if (shuttingDown) {
      exitWhenAllStopped()
      return
    }
    // Ctrl+C reaches the children too, and one may exit before our SIGINT handler runs: wait a moment before
    // calling it unexpected.
    setTimeout(() => {
      if (shuttingDown) {
        // stopped with the others
      } else if (optional) {
        console.error(`${name} stopped (${signal ?? `exit ${code}`}); the mod's build and server keep running.`)
      } else {
        console.error(`${name} stopped unexpectedly (${signal ?? `exit ${code}`}).`)
        shutdown(code || 1)
      }
      exitWhenAllStopped()
    }, 200)
  })

  return child
})

function isRunning (child) {
  return child.pid !== undefined && child.exitCode === null && child.signalCode === null
}

// On Windows, kill() only ends the process itself: taskkill /T also ends whatever it started.
function stopChild (child) {
  if (!isRunning(child)) return
  if (isWindows) {
    spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
  } else {
    child.kill()
  }
}

function exitWhenAllStopped () {
  if (shuttingDown && !children.some(isRunning)) process.exit(exitCode)
}

function shutdown (code) {
  if (shuttingDown) return
  shuttingDown = true
  exitCode = code

  for (const child of children) stopChild(child)

  exitWhenAllStopped()
  setTimeout(() => {
    const left = children.filter(isRunning).map((child) => child.pid)
    if (left.length > 0) console.error(`Some processes did not stop (PID ${left.join(', ')}).`)
    process.exit(exitCode)
  }, 5000).unref()
}

process.once('SIGINT', () => shutdown(130))
process.once('SIGTERM', () => shutdown(143))
