const esbuild = require('esbuild')
const inlineImport = require('esbuild-plugin-inline-import')

esbuild.build({
  entryPoints: ['./scripts/run-heater-cube-experiments.ts'],
  bundle: true,
  platform: 'node',
  format: 'cjs',
  outfile: 'build/run-heater-cube-experiments.cjs',
  plugins: [inlineImport({ filter: /^inline:/ })],
  define: { HS_BUILD_VERSION: JSON.stringify(require('../package.json').version) },
}).catch(error => {
  console.error(error)
  process.exitCode = 1
})
