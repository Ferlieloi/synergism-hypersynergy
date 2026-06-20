const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

// ─── Steam install path (Windows registry) ─────────────────────────────────
function detectSteamPathWindows() {
    const queries = [
        ['HKCU\\Software\\Valve\\Steam', 'SteamPath'],
        ['HKLM\\SOFTWARE\\WOW6432Node\\Valve\\Steam', 'InstallPath'],
        ['HKLM\\SOFTWARE\\Valve\\Steam', 'InstallPath']
    ]

    for (const [key, value] of queries) {
        try {
            const out = execFileSync('reg', ['query', key, '/v', value], { encoding: 'utf-8' })
            const match = out.match(new RegExp(`${value}\\s+REG_SZ\\s+(.+)`))
            if (match) {
                const p = match[1].trim()
                if (p && fs.existsSync(p)) return p
            }
        } catch {
            // key not present, try next
        }
    }

    // Common fallback locations
    const fallbacks = [
        'C:\\Program Files (x86)\\Steam',
        'C:\\Program Files\\Steam'
    ]
    return fallbacks.find(p => fs.existsSync(p)) || null
}

// ─── Library folders (handles games installed on other drives) ────────────
function parseLibraryFolders(steamPath) {
    const vdfPath = path.join(steamPath, 'steamapps', 'libraryfolders.vdf')
    const libraries = [steamPath]

    try {
        const raw = fs.readFileSync(vdfPath, 'utf-8')
        // Lines look like:   "path"		"D:\\SteamLibrary"
        const re = /"path"\s*"([^"]+)"/g
        let m
        while ((m = re.exec(raw)) !== null) {
            const p = m[1].replace(/\\\\/g, '\\')
            if (!libraries.includes(p)) libraries.push(p)
        }
    } catch {
        // No libraryfolders.vdf — just use the main Steam path
    }

    return libraries
}

// ─── Find the installed game folder across all libraries ──────────────────
function findGameDir(steamPath, appName) {
    if (!steamPath || !fs.existsSync(steamPath)) return null

    for (const lib of parseLibraryFolders(steamPath)) {
        const candidate = path.join(lib, 'steamapps', 'common', appName)
        if (fs.existsSync(candidate)) return candidate
    }
    return null
}

function getBundledSevenZipPath(app) {
    const dir = app?.isPackaged
        ? path.join(process.resourcesPath, '7zip-bin')
        : path.join(__dirname, '..', 'vendor', '7zip')
    const exe = path.join(dir, '7z.exe')
    return fs.existsSync(exe) ? exe : null
}

// ─── Find a full 7-Zip install (needed for NSIS-installer extraction) ─────
// Note: the lightweight "7za" binaries bundled by npm packages like
// 7zip-bin do NOT include the NSIS module, so we specifically need a real
// 7-Zip install (the one with 7z.exe + the Formats/NSIS plugin).
function detectSevenZip() {
    try {
        const out = execFileSync('reg', ['query', 'HKLM\\SOFTWARE\\7-Zip', '/v', 'Path'], { encoding: 'utf-8' })
        const match = out.match(/Path\s+REG_SZ\s+(.+)/)
        if (match) {
            const exe = path.join(match[1].trim(), '7z.exe')
            if (fs.existsSync(exe)) return exe
        }
    } catch {
        // not found in registry
    }

    const fallbacks = [
        'C:\\Program Files\\7-Zip\\7z.exe',
        'C:\\Program Files (x86)\\7-Zip\\7z.exe'
    ]
    return fallbacks.find(p => fs.existsSync(p)) || null
}

module.exports = { detectSteamPathWindows, findGameDir, parseLibraryFolders, detectSevenZip, getBundledSevenZipPath }
