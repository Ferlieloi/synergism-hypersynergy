import { HSModuleOptions } from "../../types/hs-types";
import { HSSetting } from "../hs-core/settings/hs-setting";
import { HSGameData } from "../hs-core/gds/hs-gamedata";
import { HSGlobal } from "../hs-core/hs-global";
import { HSLogger } from "../hs-core/hs-logger";
import { HSUI } from "../hs-core/hs-ui";
import { HSModule } from "../hs-core/module/hs-module";
import { HSModuleManager } from "../hs-core/module/hs-module-manager";
import { HSSettings } from "../hs-core/settings/hs-settings";
import type { HSAmbrosia } from "./hs-ambrosia";
import type { HSAutosing } from "./hs-autosing/hs-autosing";

const TICK_MS = 10_000;
const MINUTE_MS = 60_000;

const DB_NAME = 'hs-auto-export';
const DB_STORE = 'state';
const DB_FOLDER_KEY = 'folder';
const DB_FILES_KEY = 'files';
// File names remembered when "Keep only the last X files" is off
const MAX_TRACKED_FILES = 1000;

const FOLDER_BUTTON_ID = 'hs-setting-auto-export-save-folder-button';
const FOLDER_BUTTON_TEXT = 'Choose folder';
const FOLDER_ACCESS = { mode: 'readwrite' };
// A picker that is closed answers at once
const PICKER_ANSWER_MS = 1500;
// The picker is on screen well within this time after the button's click
const PICKER_SHOW_MS = 4000;

// none: no folder chosen. locked: a folder is remembered, the browser wants a click or a key press before
// giving it back (at every page load). asking: that request is running. refused: it was not given.
type HSExportFolderState = 'none' | 'ready' | 'locked' | 'asking' | 'refused';

/**
 * Class: HSAutoExport
 * IsExplicitHSModule: Yes
 * Description:
 *     The "Export the save every X minutes" setting.
 *     Clicks the game's own Export button once the last export is older than the duration, so the export
 *     rewards (quarks, golden quarks) are given and the file is the game's own.
 *     The clock is the game's lastExportedSave: an export by hand restarts it, a reload doesn't.
 *     An ambrosia loadout can be loaded for the export, the player's tree is put back right after
 *     (the rewards are computed inside the click).
 *     Skipped while Auto-Sing is active (it exports for its quarks, with its own loadout), and while the
 *     offline popup is open.
 *     Export folder (File System Access API, not in Firefox): the player picks a folder once, and the mod
 *     writes the file there itself, in place of the game's download. It is the only way on Steam, where
 *     every download opens a "Save as" dialog. The folder is kept in IndexedDB with the names of the files
 *     written, so that only those are ever removed ("Keep only the last X files").
 * Author: maenhiir
 */
export class HSAutoExport extends HSModule {
    #loadedAt = Date.now();
    // Last export seen by the mod (its own, or a click on the game's button)
    #lastExportAt = 0;
    #noticesShown = new Set<string>();

    // FileSystemDirectoryHandle (not in every TypeScript DOM library)
    #folder?: any;
    #folderState: HSExportFolderState = 'none';
    // Names of the files written into the folder, oldest first
    #files: string[] = [];
    // The game's next download is the timed export's: it goes into the folder
    #captureNextDownload = false;
    // The browser's folder picker is open (it only allows one)
    #picking = false;
    #pickId = 0;
    #folderButtonHelp?: string;
    // Set once a pick got no answer (#pickerStuck)
    #pickerFrame?: HTMLIFrameElement;

    constructor(moduleOptions: HSModuleOptions) {
        super(moduleOptions);
    }

    async init() {
        HSLogger.log(`Initializing HSAutoExport module`, this.context);

        try {
            await this.#loadFolder();
        } catch (error) {
            HSLogger.warn(`Timed save export: could not read the remembered export folder (${error})`, this.context);
        }

        // For players without the live player. Not the silent clicks that only expose the patched export function.
        document.getElementById('exportgame')?.addEventListener('click', () => {
            if (!(window as any).__HS_SILENT_EXPORT) this.#lastExportAt = Date.now();
        });
        document.addEventListener('click', (e) => {
            this.#onDownloadClick(e);
            this.#onPlayerInput(e);
        }, true);
        document.addEventListener('keydown', (e) => this.#onPlayerInput(e), true);

        setInterval(() => {
            try {
                this.#refreshFolderButton();
                this.#tick();
            } catch (error) {
                HSLogger.error(`Timed save export failed: ${error}`, this.context);
            }
        }, TICK_MS);

        this.isInitialized = true;
    }

    // ==============================================
    // ------------------ The clock ------------------
    // ==============================================

    #isEnabled(): boolean {
        return HSSettings.getSetting('autoExportSave')?.isEnabled() === true;
    }

    #isSteam(): boolean {
        return HSModuleManager.getModule<HSGameData>('HSGameData')?.isSteam === true;
    }

    #notifyOnce(id: string, text: string): void {
        if (this.#noticesShown.has(id)) return;
        this.#noticesShown.add(id);
        HSUI.Notify(text, { notificationType: 'warning' });
        HSLogger.warn(text, this.context);
    }

    #tick(): void {
        const setting = HSSettings.getSetting('autoExportSave') as HSSetting<number> | undefined;
        if (!setting?.isEnabled()) return;

        const minutes = Number(setting.getValue());
        if (!Number.isFinite(minutes) || minutes <= 0) return;
        if (Date.now() - this.#lastExport() < minutes * MINUTE_MS) return;

        if (HSModuleManager.getModule<HSAutosing>('HSAutosing')?.isAutosingActive()) return;
        if (document.getElementById('offlineContainer')?.style.display === 'flex') return;

        // An export is due
        if (this.#folderState === 'none') {
            // In a browser, the file is downloaded as usual
            if (this.#isSteam()) {
                this.#notifyOnce('steam-folder', 'Timed save export: choose an export folder first (Game Data settings). On Steam, a download would open a "Save as" dialog each time');
                return;
            }
        } else if (this.#folderState === 'locked') {
            // A player away since the page load: any click or key press gives the folder back (#onPlayerInput)
            this.#notifyOnce('locked', 'Timed save export: click anywhere in the game to give the export folder back');
            return;
        } else if (this.#folderState !== 'ready') {
            // The request is running, or access was refused (told once)
            return;
        }

        this.#export();
    }

    #lastExport(): number {
        const saved = Number(HSGlobal.exposedPlayer?.lastExportedSave);
        // Without the live player (bookmark load), counted from the page load. A date in the future
        // (a save from another clock) counts as never exported.
        const fromSave = Number.isFinite(saved) ? (saved > Date.now() ? 0 : saved) : this.#loadedAt;
        return Math.max(this.#lastExportAt, fromSave);
    }

    #export(): void {
        const exportButton = document.getElementById('exportgame');
        if (!exportButton) return;

        // Also when the export gives no file (the game refuses to save during a time warp): next try in a full duration
        this.#lastExportAt = Date.now();

        // A file even when the player exports to the clipboard: the box is unticked for this export.
        // The game reads it a few microtasks after the click, so it's ticked back in the next task.
        // Its stored preference is not touched (setting the property fires no event).
        const saveType = document.getElementById('saveType') as HTMLInputElement | null;
        const toClipboard = saveType?.checked === true;
        if (saveType && toClipboard) {
            saveType.checked = false;
            setTimeout(() => { saveType.checked = true; }, 0);
        }

        // The game's download comes in those same microtasks (#onDownloadClick)
        const intoFolder = this.#folderState === 'ready';
        if (intoFolder) {
            this.#captureNextDownload = true;
            setTimeout(() => {
                if (!this.#captureNextDownload) return;
                this.#captureNextDownload = false;
                HSLogger.warn('Timed save export: the game gave no file (it refuses to save during a time warp)', this.context);
            }, 0);
        }

        const loadout = String(HSSettings.getSetting('autoExportSaveLoadout')?.getValue() ?? '');
        const ambrosia = HSModuleManager.getModule<HSAmbrosia>('HSAmbrosia');
        let note: string | undefined;
        if (loadout && ambrosia) {
            note = ambrosia.runWithLoadout(loadout, 'autoExport', () => exportButton.click());
        } else {
            exportButton.click();
        }

        if (note) HSLogger.log(`Timed save export done; ${note}`, this.context);
        else HSLogger.log(loadout ? `Timed save export done, with loadout ${loadout}` : 'Timed save export done', this.context);
    }

    // ==============================================
    // --------------- Export folder ----------------
    // ==============================================

    /** "Choose folder" button. Needs the player's click: the browser only opens its folder picker for one. */
    async chooseFolder(): Promise<void> {
        // Once the window's own picker is stuck (#pickerStuck), a frame's picker is used
        const pickerWindow: Window = this.#pickerFrame?.contentWindow ?? window;
        const picker = (pickerWindow as any).showDirectoryPicker;
        if (typeof picker !== 'function') {
            HSUI.Notify(this.#pickerFrame
                ? 'The folder picker is not available any more: restart the game, then choose a folder again'
                : 'Your browser can\'t write into a folder: the timed export downloads its files as usual', { notificationType: 'warning' });
            return;
        }

        if (this.#picking) {
            HSUI.Notify('The folder picker is already open (it may be behind the game window)', { notificationType: 'warning' });
            return;
        }

        let folder: any;
        const pick = ++this.#pickId;
        this.#picking = true;
        const stopWatching = this.#isSteam() ? this.#watchStuckPicker(pick) : undefined;
        try {
            folder = await picker.call(pickerWindow, { id: 'hs-auto-export', startIn: 'downloads', ...FOLDER_ACCESS });
        } catch (error) {
            // AbortError: the picker was closed without a choice
            if ((error as Error)?.name !== 'AbortError') {
                const restart = this.#pickerFrame ? ' Restart the game, then choose a folder again.' : '';
                HSUI.Notify(`Export folder not set: ${(error as Error)?.message ?? error}${restart}`, { notificationType: 'warning' });
            }
            return;
        } finally {
            stopWatching?.();
            // Not when this pick was given up as stuck and another one is running
            if (this.#pickId === pick) this.#picking = false;
        }

        // The same folder picked again keeps its list of files
        let sameFolder = false;
        try { sameFolder = this.#folder !== undefined && await this.#folder.isSameEntry(folder) === true; } catch { sameFolder = false; }
        if (!sameFolder) this.#files = [];

        this.#folder = folder;
        this.#folderState = 'ready';
        this.#noticesShown.clear();
        try {
            await this.#store(DB_FOLDER_KEY, folder);
            await this.#store(DB_FILES_KEY, this.#files);
        } catch (error) {
            HSLogger.warn(`Timed save export: the export folder could not be remembered, it is set until the page is reloaded (${error})`, this.context);
        }
        this.#refreshFolderButton();
        HSUI.Notify(`Timed save export: files go into "${folder.name}"`);
        HSLogger.log(`Timed save export: export folder set to "${folder.name}"`, this.context);
    }

    /**
     * Steam only. The game's Electron refuses some folders (Downloads, Documents, the Desktop themselves) without
     * a word: the picker closes and its promise never settles (seen 2026-10-13; Chrome shows a dialog and opens
     * the picker again). So once the picker is closed, a pick that has no answer is given up.
     * "Closed" is the window getting the focus back, or the player's input reaching the page again (a picker
     * keeps both away); input only counts after a few seconds, the time for the picker to show.
     * @returns stops the watch.
     */
    #watchStuckPicker(pick: number): () => void {
        let timer: number | undefined;
        const startedAt = Date.now();
        const closed = () => {
            if (timer !== undefined) return;
            timer = window.setTimeout(() => {
                if (this.#picking && this.#pickId === pick) this.#pickerStuck();
            }, PICKER_ANSWER_MS);
        };
        const onInput = (e: Event) => {
            if (e.isTrusted && Date.now() - startedAt > PICKER_SHOW_MS) closed();
        };

        const inputEvents = ['mousemove', 'pointerdown', 'keydown'];
        window.addEventListener('focus', closed);
        for (const name of inputEvents) window.addEventListener(name, onInput, true);
        return () => {
            window.removeEventListener('focus', closed);
            for (const name of inputEvents) window.removeEventListener(name, onInput, true);
            if (timer !== undefined) window.clearTimeout(timer);
        };
    }

    /**
     * A window whose picker never answered refuses every later one ("File picker already active") until the page
     * is reloaded. A frame is another window with a picker of its own: the next pick goes through a new one.
     * It is made now, before the player's next click, so that click counts for it too. Frames are never removed:
     * a folder picked through one belongs to it.
     */
    #pickerStuck(): void {
        this.#picking = false;

        const frame = document.createElement('iframe');
        frame.style.display = 'none';
        frame.setAttribute('aria-hidden', 'true');
        document.body.appendChild(frame);
        this.#pickerFrame = frame;

        const text = 'That folder can\'t be used: Downloads, Documents and the Desktop themselves are refused. Press "Choose folder" again and pick or create a folder inside one of them';
        HSUI.Notify(text, { notificationType: 'warning' });
        HSLogger.warn(`Timed save export: ${text}`, this.context);
    }

    /** "Forget folder" button. The files already written stay where they are. */
    async forgetFolder(): Promise<void> {
        if (this.#folderState === 'none') {
            HSUI.Notify('No export folder is set');
            return;
        }

        this.#folder = undefined;
        this.#folderState = 'none';
        this.#files = [];
        this.#noticesShown.clear();
        try {
            await this.#store(DB_FOLDER_KEY, undefined);
            await this.#store(DB_FILES_KEY, undefined);
        } catch (error) {
            HSLogger.warn(`Timed save export: the export folder could not be forgotten (${error})`, this.context);
        }
        this.#refreshFolderButton();
        HSUI.Notify(this.#isSteam()
            ? 'Export folder forgotten: no timed export until a folder is chosen'
            : 'Export folder forgotten: the timed export downloads its files as usual');
    }

    async #loadFolder(): Promise<void> {
        const folder = await this.#read(DB_FOLDER_KEY);
        if (!folder || typeof folder.queryPermission !== 'function') return;

        const files = await this.#read(DB_FILES_KEY);
        this.#files = Array.isArray(files) ? files.filter(name => typeof name === 'string') : [];
        this.#folder = folder;
        this.#folderState = await folder.queryPermission(FOLDER_ACCESS) === 'granted' ? 'ready' : 'locked';
    }

    /**
     * A remembered folder is given back by the browser at the player's first click or key press of a page load
     * (seen on Steam: no dialog; Chrome shows its own prompt). Asked once per page load, and only while the
     * setting is on.
     * Asked in the next task, once the click's own handlers have run: the click that turns the setting on
     * counts too (the browser accepts the request for a few seconds after an input).
     */
    #onPlayerInput(e: Event): void {
        if (!e.isTrusted || this.#folderState !== 'locked') return;
        setTimeout(() => this.#askFolderBack(), 0);
    }

    #askFolderBack(): void {
        if (this.#folderState !== 'locked' || !this.#isEnabled()) return;

        const folder = this.#folder;
        this.#folderState = 'asking';
        void (async () => {
            let granted = false;
            try {
                granted = await folder.requestPermission(FOLDER_ACCESS) === 'granted';
            } catch {
                // This input didn't count for the browser (some keys): the next one asks again
                if (this.#folder === folder) this.#folderState = 'locked';
                return;
            }
            if (this.#folder !== folder) return;
            this.#folderState = granted ? 'ready' : 'refused';
            this.#refreshFolderButton();
            if (!granted) this.#notifyOnce('refused', 'Timed save export: access to the export folder was not given. Choose the folder again, or forget it (Game Data settings)');
        })();
    }

    /** The game exports with a click on a link it builds, holding the file's name and the save. */
    #onDownloadClick(e: Event): void {
        if (!this.#captureNextDownload) return;
        const link = e.target;
        if (!(link instanceof HTMLAnchorElement) || link.id !== 'downloadSave') return;

        const href = link.getAttribute('href') ?? '';
        const comma = href.indexOf(',');
        if (!href.startsWith('data:') || comma < 0) return;

        this.#captureNextDownload = false;
        e.preventDefault();
        void this.#writeIntoFolder(link.getAttribute('download') ?? '', href.slice(comma + 1));
    }

    async #writeIntoFolder(gameFileName: string, save: string): Promise<void> {
        const folder = this.#folder;
        let fileName = HSAutoExport.#cleanFileName(gameFileName) || `Synergism-${Date.now()}.txt`;
        try {
            let file: any;
            try {
                file = await folder.getFileHandle(fileName, { create: true });
            } catch (error) {
                // A name the browser refuses (TypeError): the mod's own name
                if ((error as Error)?.name !== 'TypeError') throw error;
                fileName = `Synergism-${Date.now()}.txt`;
                file = await folder.getFileHandle(fileName, { create: true });
            }
            const writable = await file.createWritable();
            await writable.write(save);
            await writable.close();
        } catch (error) {
            // Folder removed or renamed, access taken back
            if (this.#folder === folder && (error as Error)?.name === 'NotAllowedError') this.#folderState = 'locked';
            const isSteam = this.#isSteam();
            HSUI.Notify(isSteam
                ? 'Timed save export: could not write into the export folder (the rewards were collected). Choose the folder again (Game Data settings)'
                : 'Timed save export: could not write into the export folder, the file is downloaded instead', { notificationType: 'warning' });
            HSLogger.warn(`Timed save export: could not write "${fileName}" into the export folder (${error})`, this.context);
            if (!isSteam) this.#download(fileName, save);
            this.#refreshFolderButton();
            return;
        }

        HSLogger.log(`Timed save export: "${fileName}" written into "${folder.name}"`, this.context);
        if (this.#folder !== folder) return;

        this.#files = this.#files.filter(name => name !== fileName);
        this.#files.push(fileName);
        await this.#removeOldFiles(folder);
        try {
            await this.#store(DB_FILES_KEY, this.#files);
        } catch (error) {
            HSLogger.warn(`Timed save export: the list of written files could not be saved (${error})`, this.context);
        }
    }

    /**
     * The game's file name follows a pattern typed by the player, and a download lets the browser replace what a
     * file name can't hold. Written by the mod, the name has to be clean already.
     */
    static #cleanFileName(name: string): string {
        let cleaned = '';
        for (const char of name) {
            cleaned += char.charCodeAt(0) < 32 || '<>:"/\\|?*'.includes(char) ? '_' : char;
        }
        // Windows refuses a name ending with a dot or a space
        return cleaned.trim().replace(/[. ]+$/, '');
    }

    /** Only files this module wrote are removed: the folder can hold anything else. */
    async #removeOldFiles(folder: any): Promise<void> {
        const setting = HSSettings.getSetting('autoExportSaveKeep') as HSSetting<number> | undefined;
        const keep = Math.floor(Number(setting?.getValue()));
        if (!setting?.isEnabled() || !Number.isFinite(keep) || keep < 1) {
            // Not removed, only no longer remembered
            if (this.#files.length > MAX_TRACKED_FILES) this.#files.splice(0, this.#files.length - MAX_TRACKED_FILES);
            return;
        }

        let removed = 0;
        while (this.#files.length > keep) {
            const fileName = this.#files.shift()!;
            try {
                await folder.removeEntry(fileName);
                removed++;
            } catch (error) {
                // NotFoundError: already removed or renamed by the player
                if ((error as Error)?.name !== 'NotFoundError') {
                    HSLogger.warn(`Timed save export: could not remove "${fileName}" (${error})`, this.context);
                }
            }
        }
        if (removed > 0) HSLogger.log(`Timed save export: ${removed} older file${removed === 1 ? '' : 's'} removed (the last ${keep} are kept)`, this.context);
    }

    /** A plain download, as the game does it. */
    #download(fileName: string, save: string): void {
        const link = document.createElement('a');
        link.setAttribute('href', `data:text/plain;charset=utf-8,${save}`);
        link.setAttribute('download', fileName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    /** The button shows the folder. The settings panel is built after the modules: refreshed at each tick too. */
    #refreshFolderButton(): void {
        const button = document.getElementById(FOLDER_BUTTON_ID);
        if (!button) return;

        // Its help text, set by the settings panel
        if (this.#folderButtonHelp === undefined) this.#folderButtonHelp = button.title;

        // The state comes first: the button's width cuts a long text at its end
        let text = FOLDER_BUTTON_TEXT;
        let title = this.#folderButtonHelp;
        if (this.#folder) {
            const name = this.#folder.name;
            text = `Folder: ${name}`;
            title = `Export folder: ${name}`;
            // With the setting off, nothing is asked: the folder is only shown
            if ((this.#folderState === 'locked' || this.#folderState === 'asking') && this.#isEnabled()) {
                text = `Waiting for a click: ${name}`;
                title += '. Given back at your first click or key press in the game.';
            } else if (this.#folderState === 'refused') {
                text = `No access: ${name}`;
                title += '. Access was not given: choose the folder again.';
            }
        }
        if (button.textContent !== text) {
            button.textContent = text;
            button.title = title;
        }
    }

    // ==============================================
    // ----------------- IndexedDB ------------------
    // ==============================================
    // A folder handle can't be stored as text (HSStorage): IndexedDB keeps it as it is.

    #openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);
            request.onupgradeneeded = () => { request.result.createObjectStore(DB_STORE); };
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async #read(key: string): Promise<any> {
        const db = await this.#openDB();
        try {
            return await new Promise((resolve, reject) => {
                const request = db.transaction(DB_STORE).objectStore(DB_STORE).get(key);
                request.onsuccess = () => resolve(request.result);
                request.onerror = () => reject(request.error);
            });
        } finally {
            db.close();
        }
    }

    /** undefined removes the key. */
    async #store(key: string, value: unknown): Promise<void> {
        const db = await this.#openDB();
        try {
            await new Promise<void>((resolve, reject) => {
                const transaction = db.transaction(DB_STORE, 'readwrite');
                if (value === undefined) transaction.objectStore(DB_STORE).delete(key);
                else transaction.objectStore(DB_STORE).put(value, key);
                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(transaction.error);
                transaction.onabort = () => reject(transaction.error);
            });
        } finally {
            db.close();
        }
    }
}
