const { spawn } = require('node:child_process')
const path = require('node:path')

const projectRoot = path.resolve(__dirname, '..')
const isWindows = process.platform === 'win32'

const processes = [
  {
    name: 'build watcher',
    command: process.execPath,
    args: ['esbuild.config.js', 'dev'],
    shell: false
  },
  {
    name: 'HTTP server',
    command: 'http-server',
    args: ['./build/', '--mimetypes', './mimes.types', '--cors'],
    shell: isWindows
  }
]

const children = processes.map(({ name, command, args, shell }) => {
  const child = spawn(command, args, {
    cwd: projectRoot,
    stdio: 'inherit',
    shell
  })

  child.once('error', (error) => {
    console.error(`${name} failed to start:`, error)
    shutdown(1)
  })

  child.once('exit', (code, signal) => {
    if (shuttingDown) return
    console.error(`${name} stopped unexpectedly (${signal ?? `exit ${code ?? 1}`}).`)
    shutdown(code ?? 1)
  })

  return child
})

let shuttingDown = false

function shutdown (exitCode) {
  if (shuttingDown) return
  shuttingDown = true

  for (const child of children) {
    if (child.exitCode === null && !child.killed) {
      child.kill()
    }
  }

  setTimeout(() => process.exit(exitCode), 250)
}

process.once('SIGINT', () => shutdown(130))
process.once('SIGTERM', () => shutdown(143))
