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
    logLevel: 'info'
};

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
}

// Build function with environment-specific options
async function build(env) {
    try {
        const options = {
            ...baseOptions,
            outfile: env === 'release' ? 'release/mod/hypersynergism_release.js' : 'build/hypersynergism.js',
            minify: env === 'release',
            sourcemap: false,
        };

        if (env === 'dev') {
            // Copy loader files for dev server
            copyLoaderFiles();

            // For watch mode
            const ctx = await esbuild.context(options);
            await ctx.watch();
        } else {
            // For build and release
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
