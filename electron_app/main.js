const { app, BrowserWindow, protocol } = require('electron')

protocol.registerSchemesAsPrivileged([
    {
        scheme: 'app',
        privileges: {
            standard: true,
            secure: true,
            supportFetchAPI: true
        }
    }
])

const path = require('path')
const fs = require('fs')

const { patchBundle } = require('./patcher')

const gameDir = path.join(__dirname, 'extracted/dist/')

const https = require('https')

const cacheDir = path.join(__dirname, 'cache')
const modCachePath = path.join(cacheDir, 'hypersynergism.js')

// ensure cache exists
if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir)
}

function download(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            if (res.statusCode !== 200) {
                return reject(new Error('HTTP ' + res.statusCode))
            }

            let data = ''
            res.on('data', chunk => data += chunk)
            res.on('end', () => resolve(data))
        }).on('error', reject)
    })
}

async function getModCode() {
    const repo = 'maenhiir'
    const version = 'master'

    const url = `https://cdn.jsdelivr.net/gh/${repo}/synergism-hypersynergy@${version}/release/mod/hypersynergism_release.js?t=${Date.now()}`

    try {
        console.log('[HS] Fetching latest mod...')

        const code = await download(url)

        fs.writeFileSync(modCachePath, code)

        console.log('[HS] Mod updated & cached')

        return code

    } catch (e) {
        console.warn('[HS] Download failed, using cache...')

        if (fs.existsSync(modCachePath)) {
            return fs.readFileSync(modCachePath, 'utf-8')
        }

        throw new Error('No cached mod available')
    }
}

function injectMod(code) {
    try {
        console.log('[HS] Executing mod via eval')

        const fn = new Function(code + '\n//# sourceURL=hypersynergism.js')
        fn()

        console.log('[HS] hypersynergism:', window.hypersynergism)

        window.hypersynergism?.init?.()

        console.log('[HS] Init attempted')
    } catch (e) {
        console.error('[HS] Injection failed', e)
    }
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            contextIsolation: false,
            nodeIntegration: false
        }
    })
    win.webContents.on('did-finish-load', async () => {
        console.log('[LOADER] Page loaded, injecting mod...')

        try {
            const modCode = await getModCode()

            await win.webContents.executeJavaScript(`
                (function() {
                    try {
                        const code = ${JSON.stringify(modCode)};
                        
                        const script = document.createElement('script');
                        script.textContent = code;
                        document.head.appendChild(script);

                        window.hypersynergism?.init?.();

                        console.log('[HS] Mod initialized');
                    } catch (e) {
                        console.error('[HS] Injection failed', e);
                    }
                })();
            `)

        } catch (e) {
            console.error('[HS] Failed to load mod:', e)
        }
    })
    win.webContents.openDevTools()
    win.loadURL('app://-/index.html')
}

app.whenReady().then(() => {

    protocol.handle('app', async (req) => {
        const url = new URL(req.url)

        let relativePath = url.pathname.replace(/^\/+/, '')
        if (relativePath === '') relativePath = 'index.html'

        const filePath = path.join(gameDir, relativePath)

        if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
            return new Response('', { status: 404 })
        }

        if (filePath.endsWith(path.join('dist', 'out.js'))) {
            console.log('[LOADER] Intercepting out.js')

            const original = fs.readFileSync(filePath, 'utf-8')
            const patched = patchBundle(original)

            return new Response(patched, {
                headers: { 'Content-Type': 'application/javascript' }
            })
        }

        try {
            return new Response(fs.readFileSync(filePath))
        } catch {
            return new Response('', { status: 404 })
        }
    })

    createWindow()
})