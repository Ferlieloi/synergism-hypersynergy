const workerSourcePlugin = require('./heater-worker-plugin.cjs');

// GDS also exposes browser-only tools. Keep the DOM logger and UI out of the
// worker bundle, while using the same calculation classes and registries.
const workerDiagnostics = {
    name: 'corruption-worker-diagnostics',
    setup(build) {
        build.onResolve({ filter: /\/hs-(logger|ui)$/ }, ({ path }) => ({
            path: path.slice(path.lastIndexOf('/') + 1),
            namespace: 'corruption-worker-diagnostics',
        }));
        build.onLoad({ filter: /^hs-logger$/, namespace: 'corruption-worker-diagnostics' }, () => ({
            contents: `const seen = new Set();
                export const HSLogger = {
                    debug() {},
                    errorOnce(message, context, id) {
                        if (seen.has(id)) return;
                        seen.add(id);
                        console.error(context, message);
                    },
                };`,
        }));
        build.onLoad({ filter: /^hs-ui$/, namespace: 'corruption-worker-diagnostics' }, () => ({
            contents: `export const HSUI = {
                Notify() { throw new Error('Game UI is unavailable in a corruption worker.'); }
            };`,
        }));
    },
};

module.exports = function corruptionWorkerPlugin({ minify } = {}) {
    return workerSourcePlugin({
        entryPoint: 'src/mod/class/hs-modules/hs-corruption-predictor/hs-corruption-worker.ts',
        sourceModule: 'hs-corruption-worker-source',
        plugins: [workerDiagnostics],
        minify,
    });
};
