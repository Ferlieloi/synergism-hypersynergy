// Bundles a TypeScript entry that imports the mod's code ('@repo/...' = src/mod) for node, with the modules that need
// the browser or the whole mod replaced by stubs, then runs it with the remaining arguments. No game, no Chrome.
// Usage: node scripts/harness/node-run.mjs <entry.ts> [args...]
// The entry picks its stubs with a comment in its first lines: // harness-stubs: gds | heater | <regex on file paths>
// Env: SWAP=<file name>=<path> bundles <path> in place of the repo's file of that name (a scratch copy to compare with)
import { spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const esbuild = createRequire(path.join(repo, 'package.json'))('esbuild')

const PRESETS = {
    // HSGameDataAPI's formulas on a save: the module system, the UI, settings and the GDS engine are stubbed
    gds: {
        stubs: /(hs-ui|hs-logger|hs-module-manager|[\\/]hs-gamedata|hs-settings|hs-storage)\.ts$/,
        banner: `globalThis.window ??= globalThis; globalThis.document ??= new Proxy({}, { get: () => () => null });`,
    },
    // The heater optimizer: its input builder runs, the UI around it is stubbed. hs-utils is stubbed too, so the
    // entry wraps the Decimal fields itself.
    heater: {
        stubs: /(hs-ui-components|hs-settings|hs-icons|hs-utils|hs-heater-icon-store|hs-heater-result-store)\.ts$/,
        banner: '',
    },
}

const [entry, ...args] = process.argv.slice(2)
if (!entry) { console.error('usage: node scripts/harness/node-run.mjs <entry.ts> [args...]'); process.exit(1) }
const directive = readFileSync(entry, 'utf8').split('\n').slice(0, 15).join('\n').match(/harness-stubs:\s*(\S+)/)?.[1]
const preset = PRESETS[directive] ?? { stubs: directive ? new RegExp(directive) : /^$/, banner: '' }
const [swapName, swapPath] = (process.env.SWAP ?? '').split('=')

const outDir = path.join(repo, 'local', 'harness-out', 'node')
mkdirSync(outDir, { recursive: true })
const outfile = path.join(outDir, path.basename(entry).replace(/\.ts$/, '') + '.mjs')

await esbuild.build({
    entryPoints: [entry], bundle: true, platform: 'node', format: 'esm', outfile,
    // Explicit: esbuild's lookup would otherwise pick up any stray tsconfig.json above a scratch folder
    tsconfig: path.join(repo, 'tsconfig.json'),
    nodePaths: [path.join(repo, 'node_modules')],
    alias: { '@repo': path.join(repo, 'src/mod') },
    define: { HS_DEV_BUILD: 'true', HS_BUILD_VERSION: '"harness"' },
    banner: { js: `${preset.banner} import { createRequire as __cr } from 'module'; const require = __cr(import.meta.url);` },
    logLevel: 'warning',
    plugins: [{
        name: 'harness-stubs',
        setup(build) {
            if (swapName && swapPath) build.onLoad({ filter: new RegExp(`[\\\\/]${swapName.replace(/\./g, '\\.')}$`) }, a => ({ loader: 'ts', contents: readFileSync(swapPath, 'utf8'), resolveDir: path.dirname(a.path) }))
            // Each stubbed module keeps its export names (a CommonJS Proxy would lose named imports), all bound to one
            // Proxy that answers anything. Its `then` is undefined, or an `await` on it would hang.
            build.onLoad({ filter: preset.stubs }, a => {
                const names = [...readFileSync(a.path, 'utf8').matchAll(/export\s+(?:abstract\s+)?(?:class|const|function|let|enum)\s+(\w+)/g)].map(m => m[1])
                return {
                    loader: 'js',
                    contents: `const s = new Proxy(function () {}, { get: (t, k) => k === 'then' ? undefined : s, apply: () => s, construct: () => s });\n`
                        + names.map(n => `export const ${n} = s;`).join('\n'),
                }
            })
        },
    }],
})

// The entry ends with process.exit: something in the bundle keeps node alive otherwise
const run = spawnSync(process.execPath, [outfile, ...args], { stdio: 'inherit' })
process.exit(run.status ?? 1)
