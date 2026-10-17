const esbuild = require('esbuild');
const inlineImport = require('esbuild-plugin-inline-import');
const fs = require('fs');
const path = require('path');

const baseOptions = {
    entryPoints: ['src/mod/index.ts'],
    bundle: true,
    outfile: 'out.js',
    plugins: [
        inlineImport({
            filter: /^inline:/
        })
    ],
    legalComments: 'none',
    logLevel: 'info',
    // 'node esbuild.config.js dev' needs to be restarted in order to pick up changes to the version
    define: {
        HS_BUILD_VERSION: JSON.stringify(require('./package.json').version)
    }
};

// Present in the dev tools' code (ids, CSS, storage), which must never reach the release bundle
const DEV_ONLY_MARKER = 'hs-dev-tools';

// Copy loader files to build directory for dev server
function copyLoaderFiles() {
    const srcDir = path.join(__dirname, 'src', 'loader');
    const destDir = path.join(__dirname, 'build', 'src', 'loader');

    // Create destination directory if it doesn't exist
    if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
    }

    // Copy all .js files from src/loader to build/src/loader
    const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.js'));
    for (const file of files) {
        const srcPath = path.join(srcDir, file);
        const destPath = path.join(destDir, file);
        fs.copyFileSync(srcPath, destPath);
        console.log(`Copied ${file} to build/src/loader/`);
    }

    // Browser userscripts load the same patcher module packaged with the desktop loader.
    const patcherSource = path.join(__dirname, 'synergism_modloader', 'lib', 'patcher.js');
    const patcherDest = path.join(__dirname, 'build', 'synergism_modloader', 'lib', 'patcher.js');
    fs.mkdirSync(path.dirname(patcherDest), { recursive: true });
    fs.copyFileSync(patcherSource, patcherDest);
}

// Build function with environment-specific options
async function build(env) {
    // Always generate the strategy manifest before building
    try {
        require('child_process').execSync('node scripts/generate-strategy-manifest.js', { stdio: 'inherit' });
    } catch (err) {
        console.error('Failed to generate strategy manifest:', err);
        process.exit(1);
    }
    try {
        const workerBuild = await esbuild.build({
            entryPoints: ['src/mod/class/hs-modules/hs-heater/hs-heater-optimizer-worker.ts'],
            bundle: true,
            write: false,
            platform: 'browser',
            format: 'iife',
            minify: env === 'release',
            legalComments: 'none',
            logLevel: 'silent',
            plugins: baseOptions.plugins,
            define: baseOptions.define,
        });
        const heaterWorkerSource = workerBuild.outputFiles[0].text;
        const options = {
            ...baseOptions,
            outfile: env === 'release' ? 'release/mod/hypersynergism_release.js' : 'build/hypersynergism.js',
            minify: env === 'release',
            sourcemap: false,
            define: {
                ...baseOptions.define,
                HS_HEATER_WORKER_SOURCE: JSON.stringify(heaterWorkerSource),
                // False in the release build only: code under `if (HS_DEV_BUILD)` (the dev tools) is left out of it
                HS_DEV_BUILD: JSON.stringify(env !== 'release'),
            },
        };

        if (env === 'dev') {
            // Copy loader files for dev server
            copyLoaderFiles();
            // Watch src/loader for changes and re-copy immediately
            const srcLoaderDir = path.join(__dirname, 'src', 'loader');
            fs.watch(srcLoaderDir, (eventType, filename) => {
                if (filename && filename.endsWith('.js')) {
                    copyLoaderFiles();
                }
            });
            fs.watch(path.join(__dirname, 'synergism_modloader', 'lib', 'patcher.js'), copyLoaderFiles);
            console.log('Watching browser loaders and shared patcher for changes...');
            // For watch mode
            const ctx = await esbuild.context(options);
            await ctx.watch();
        } else if (env === 'release') {
            // Built in memory first: the bundle players get is only written once it's checked to hold no dev-only code
            const result = await esbuild.build({ ...options, write: false });
            const output = result.outputFiles[0];
            if (output.text.includes(DEV_ONLY_MARKER)) {
                console.error(`Release build refused: dev-only code ("${DEV_ONLY_MARKER}") ended up in the bundle. ${path.relative(__dirname, output.path)} was not written.`);
                process.exit(1);
            }
            fs.writeFileSync(output.path, output.contents);
            console.log(`Build completed for ${env} environment`);
        } else {
            await esbuild.build(options);
            console.log(`Build completed for ${env} environment`);
        }
    } catch (err) {
        console.error('Build failed:', err);
        process.exit(1);
    }
}

// Get environment from command line args
const env = process.argv[2] || 'build';
build(env);
