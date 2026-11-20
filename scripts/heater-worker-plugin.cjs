const esbuild = require('esbuild');
const fs = require('node:fs');
const path = require('node:path');

// A virtual module, rather than a once-built define: changes to the worker and its imports also rebuild it in dev.
module.exports = function workerSourcePlugin({ entryPoint = 'src/mod/class/hs-modules/hs-heater/hs-heater-optimizer-worker.ts',
    sourceModule = 'hs-heater-worker-source', minify = false, plugins = [], define = {} } = {}) {
    return {
        name: sourceModule,
        setup(build) {
            build.onResolve({ filter: /^hs-.*-worker-source$/ }, ({ path }) => path === sourceModule
                ? { path: 'source', namespace: sourceModule }
                : undefined);
            build.onLoad({ filter: /.*/, namespace: sourceModule }, async () => {
                const root = build.initialOptions.absWorkingDir ?? process.cwd();
                const result = await esbuild.build({
                    absWorkingDir: root, entryPoints: [entryPoint], bundle: true, write: false,
                    platform: 'browser', format: 'iife', minify, legalComments: 'none', logLevel: 'silent',
                    plugins, define, metafile: true,
                });
                const watchFiles = Object.keys(result.metafile.inputs)
                    .map(file => path.resolve(root, file.replace(/^inline:/, '')))
                    .filter(file => fs.existsSync(file));
                return { contents: `export default ${JSON.stringify(result.outputFiles[0].text)};`, loader: 'js', watchFiles };
            });
        },
    };
};
