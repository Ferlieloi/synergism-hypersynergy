import { MeData } from "../../../types/data-types/hs-me-data";
import { GameData } from "../../../types/data-types/hs-player-savedata";
import { PseudoGameData } from "../../../types/data-types/hs-pseudo-data";
import { HSUtils } from "../../hs-utils/hs-utils";
import { HSElementHooker } from "../hs-elementhooker";
import { HSGameDataAPI } from "./hs-gamedata-api";
import { HSGlobal } from "../hs-global";
import { HSLogger } from "../hs-logger";
import { HSModule } from "../module/hs-module";
import { HSModuleManager } from "../module/hs-module-manager";
import { HSSetting } from "../settings/hs-setting";
import { HSSettings } from "../settings/hs-settings";
import { HSUI } from "../hs-ui";
import { HSAutosing } from "../../hs-modules/hs-autosing/hs-autosing";
import { HSAmbrosia } from "../../hs-modules/hs-ambrosia";
import { ConsumableGameEvents } from "../../../types/data-types/hs-event-data";
import { HSModuleOptions } from "../../../types/hs-types";
import { CampaignData } from "../../../types/data-types/hs-campaign-data";

/**
 * Class: HSGameData
 * IsExplicitHSModule: Yes
 * Description: 
 *     Core module responsible for fetching, processing, and providing game data to other modules.
 *     Handles Game Data Sniffing (GDS) via localStorage and MITM techniques, manages campaign tokens, pseudo/me data,
 *     and subscribes to consumable game events via WebSocket. Provides APIs for other modules to access game data.
 */
export class HSGameData extends HSModule {
    // --- Save Data & State ---
    #saveDataLocalStorageKey = 'Synergysave2';
    #saveData?: GameData;
    #lastB64Save?: string;
    
    isSteam = false;

    // --- MITM / Encoding / Native JS Hooks ---
    #mitm_gamedata: string | undefined;
    #last_mitm_gamedata?: string;
    #mitm_atob_data: string | undefined;
    #mitmProcessScheduled = false;
    #mitmCaptureCount = 0;
    #btoaHacked = false;
    #atobHacked = false;
    #nativeBtoa?: typeof window.btoa;
    #nativeAtob?: typeof window.atob;

    // --- Turbo Mode & Intervals ---
    #gdsEnabled = false;
    // Reasons the engine is paused (autosing, save import...) while the GDS setting may stay ON.
    // The engine only runs when no pause is left and the setting is ON.
    #enginePauses = new Set<string>();
    #importPauseSequence = 0;
    // Ends the "Load from file" import still waiting for its save, if any
    #abortPendingImport?: () => void;
    // Bumped by disableGDS(): a start begun under an older generation is cancelled
    #engineGeneration = 0;
    #engineStart?: { generation: number, promise: Promise<void> };
    #gdsCSS = `
        #savegame {
            font-size: 0;
        }
        #savegame::after {
            content: "[HS] Perma-saved by GDS";
            font-size: 12px;
            visibility: visible;
        }
        #saveinfo {
            display: none !important;
        }
    `;
    #saveInterval?: number;

    // --- DOM Elements ---
    #manualSaveButton?: HTMLButtonElement;
    #saveinfoElement?: HTMLParagraphElement;
    #gameDataDebugElement?: HTMLDivElement;
    #campaignTokenElement?: HTMLHeadingElement;
    #importSaveButton?: HTMLLabelElement;

    // --- Event Handlers ---
    #loadFromFileEventHandler?: (e: MouseEvent) => Promise<void>;

    // --- Data APIs & Subscribers ---
    #gameDataSubscribers: Map<string, (data: GameData) => void> = new Map();
    #gameDataAPI?: HSGameDataAPI;

    // --- Player/Me/Campaign Data ---
    #playerPseudoUpgrades?: PseudoGameData;
    #meBonuses?: MeData;
    #campaignData: CampaignData = {
        tokens: 0,
        maxTokens: 0,
        isAtMaxTokens: false
    };

    // --- Game Events ---
    #gameEvents: ConsumableGameEvents = {
        HAPPY_HOUR_BELL: { amount: 0, ends: [], displayName: "Happy Hour Bell" }
    };

    // --- Miscellaneous ---
    #saveTriggerEvent: Event;
    #lastForceFetch = 0;
    #ForceFetchCooldown = 1000;

    constructor(moduleOptions: HSModuleOptions) {
        super(moduleOptions);
        this.#saveTriggerEvent = new Event('click');
    }

    /**
     * Returns true when the current renderer environment appears to be Steam/Electron.
     * Uses the exposed Steam bridge plus Electron-specific runtime hints.
     */
    #isSteamElectron(): boolean {
        const steam = (window as unknown as { steam?: unknown }).steam as any;
        const hasSteamBridge = typeof steam === 'object' && steam !== null
            && typeof steam.cloudWriteFile === 'function'
            && typeof steam.getSteamId === 'function';

        const hasElectronUserAgent = typeof navigator === 'object'
            && typeof navigator.userAgent === 'string'
            && /\bElectron\b/.test(navigator.userAgent);

        const hasElectronProcess = typeof (window as any).process === 'object'
            && typeof (window as any).process?.versions?.electron === 'string';

        const isSteamElectron = hasSteamBridge || hasElectronUserAgent || hasElectronProcess;
        HSLogger.debug(() => `Steam/Electron env detection: ${isSteamElectron}.`, this.context);
        return isSteamElectron;
    }

    /**
     * Caches DOM elements used during initialization and later operations.
     * @returns void
     */
    #cacheDomElements() {
        this.#importSaveButton = document.querySelector('#importFileButton') as HTMLLabelElement;
        this.#manualSaveButton = document.querySelector('#savegame') as HTMLButtonElement;
        this.#saveinfoElement = document.querySelector('#saveinfo') as HTMLParagraphElement;
        this.#campaignTokenElement = document.querySelector('#campaignTokenCount') as HTMLHeadingElement;
    }

    /**
     * Initializes the HSGameData module, sets up DOM elements, fetches pseudo and me data,
     * registers the WebSocket, and hooks the import button for save file interception.
     * @returns Promise<void>
     */
    async init() {
        const self = this;
        HSLogger.log(`Initializing HSGameData module`, this.context);

        this.#cacheDomElements();

        // Called by the patched game at the start of importSynergism, with its reset flag (patcher: save import hook)
        (window as any).__HS_onSaveImport = (reset: unknown) => this.#onSaveImport(!!reset);

        // Set before the fetches: the fetched data only reaches the API through this reference.
        // This is the only automatic fetch (asked by the game's dev: too much traffic on these endpoints);
        // afterwards only forceUpdateAllData() fetches again, on a player's action (heater, backup).
        // A PseudoCoin purchase or a login after the page load is seen at the next reload.
        this.#gameDataAPI = HSModuleManager.getModule('HSGameDataAPI') as HSGameDataAPI;
        await this.#refreshFetchedData();

        this.#startConsumablesPoll();
        this.#startGlobalEventCapture();
        this.isInitialized = true;

        this.isSteam = this.#isSteamElectron();

        // Always hook the import button regardless of GDS setting
        // We do this asynchronously to not block init if the element takes time to appear
        (async () => {
            if (!this.#importSaveButton) {
                // Try to hook with a short timeout, but keep trying via the HookElement internal retry if properly configured
                // Or just await it here since we are in a detached async block
                const btn = await HSElementHooker.HookElement('#importFileButton');
                if (btn) this.#importSaveButton = btn as HTMLLabelElement;
            }

            if (this.#importSaveButton && !this.#loadFromFileEventHandler) {
                this.#loadFromFileEventHandler = async (e: MouseEvent) => { self.#loadFromFileHandler(e); }
                this.#importSaveButton.addEventListener('click', this.#loadFromFileEventHandler, { capture: true });
                HSLogger.log("Save file import interceptor registered", this.context);
            }
        })();
    }

    /**
     * The game is about to load a save, whatever the source (patched game only).
     * A singularity, entering or leaving an Exalt and the game reset load one too, with reset = true:
     * nothing to do for them, and autosing goes through here at every singularity, so that path stays one test.
     * The other loads replace the save: autosing can't go on. A cloud save and the Steam cloud are only seen here;
     * "Load from file" has already stopped autosing at its button's click.
     */
    #onSaveImport(reset: boolean): void {
        if (reset) return;

        const autosing = HSModuleManager.getModule<HSAutosing>('HSAutosing');
        if (!autosing?.isAutosingActive()) return;

        autosing.stopAutosing({ saveReplaced: true });
        // After the stop: autosing mutes the log while it runs
        HSLogger.log("Auto-Sing stopped: the game is loading a save", this.context);
        HSUI.Notify("Auto-Sing stopped: a save was loaded", { position: 'top', notificationType: 'warning' });
    }


    // --- Core Data Fetch/Update ---

    /**
     * Forces a refresh of all game data, including fetched data, campaign tokens, and save data.
     * Applies cooldown to prevent excessive refreshes.
     * @returns Promise<void>
     */
    async forceUpdateAllData() {
        const now = Date.now();
        if (now - this.#lastForceFetch < this.#ForceFetchCooldown) { HSLogger.warn("Forced data refresh on cooldown", this.context); return; }
        this.#lastForceFetch = now;

        await this.#refreshFetchedData();
        this.#refreshCampaignTokens();
        await this.forceRefreshGameData();

        this.#pseudoDataUpdated();
        this.#meDataUpdated();
        this.#campaignDataUpdated();
    }

    /** Reads the exact token total rendered by CampaignManager in the game. */
    #refreshCampaignTokens() {
        this.#campaignTokenElement ||= document.querySelector('#campaignTokenCount') as HTMLHeadingElement;
        const text = this.#campaignTokenElement?.textContent ?? '';
        // The text is translated ("You have 3 / 4 tokens!", "У вас 3 / 4 жетонов!"...): match only the numbers
        const match = text.match(/(\d+)\s*\/\s*(\d+)/);
        if (!match) return;

        const tokens = Number.parseInt(match[1], 10);
        const maxTokens = Number.parseInt(match[2], 10);
        this.#campaignData = {
            tokens,
            maxTokens,
            isAtMaxTokens: tokens > 0 && maxTokens > 0 && tokens === maxTokens
        };
    }

    #campaignDataUpdated() {
        if (this.#gameDataAPI) {
            this.#gameDataAPI._updateCampaignData(this.#campaignData);
        }
    }

    /**
     * SYNCHRONOUSLY triggers a game save and returns the raw save JSON captured by the btoa hook.
     * For callers that cannot await (e.g. right before a click whose ordering matters).
     * @returns The fresh save JSON, or undefined if no save was captured (e.g. during a time warp)
     */
    forceCaptureRawSaveSync(): string | undefined {
        const saveBtn = this.#manualSaveButton ?? document.getElementById('savegame') as HTMLButtonElement | null;
        if (!saveBtn) return undefined;

        this.#hackJSNativebtoa();

        // The game's save handler calls btoa synchronously, so a capture happens before dispatchEvent returns
        const captureCountBefore = this.#mitmCaptureCount;
        saveBtn.dispatchEvent(this.#saveTriggerEvent);

        return this.#mitmCaptureCount !== captureCountBefore ? this.#mitm_gamedata : undefined;
    }

    /**
     * Forces a refresh of save-derived game data only, without updating fetched pseudo/me/campaign data.
     * @returns Promise<void>
     */
    async forceRefreshGameData(): Promise<void> {
        const saveBtn = await HSElementHooker.HookElement('#savegame') as HTMLButtonElement | null;
        // Both have an early return if already patched...
        this.#hackJSNativebtoa();
        this.#hackJSNativeAtob();

        if (saveBtn) {
            saveBtn.dispatchEvent(this.#saveTriggerEvent);
            // The game's save handler calls btoa synchronously, while our
            // capture hook schedules the data update in a microtask.  Yield
            // once so the freshly serialized save (including campaigns) is
            // available before parsing it below.
            await new Promise<void>((resolve) => queueMicrotask(resolve));
        } else {
            HSLogger.warn('Could not find #savegame to force refresh game data', this.context);
        }

        if (this.#mitm_gamedata) {
            try {
                this.#saveData = JSON.parse(this.#mitm_gamedata) as GameData;
            } catch (err) {
                HSLogger.error(`Failed to parse save data during forceRefreshGameData: ${err}`, this.context);
            }
        }

        // In browsers where the save button does not pass through the hooked
        // btoa function, localStorage is still the game's authoritative save
        // source. Prefer it when it contains the campaign manager so the
        // heater cannot fall back to inheritance tokens alone.
        const storedSave = localStorage.getItem(this.#saveDataLocalStorageKey);
        if (storedSave) {
            try {
                const atobFn = this.#nativeAtob ?? window.atob;
                const parsedStoredSave = JSON.parse(atobFn(storedSave)) as GameData;
                const currentCampaignState = this.#saveData?.campaigns as unknown as
                    { campaigns?: Record<string, number> } | Record<string, number> | undefined;
                const currentCampaigns = currentCampaignState && 'campaigns' in currentCampaignState
                    ? currentCampaignState.campaigns
                    : currentCampaignState;
                if ((!currentCampaigns || typeof currentCampaigns !== 'object') && parsedStoredSave?.campaigns) {
                    this.#saveData = parsedStoredSave;
                }
            } catch (err) {
                HSLogger.debug(() => `Could not parse localStorage save during force refresh: ${err}`, this.context);
            }
        }

        this.#saveDataUpdated();
    }

    /**
     * Fetches pseudo and me data from remote APIs and updates internal state.
     * @returns Promise<void>
     */
    async #refreshFetchedData() {
        // HSLogger.debug(() => `Refreshing fetched data`, this.context);
        try {
            const upgradesQuery = await fetch(HSGlobal.Common.pseudoAPIurl, { headers: HSGlobal.Common.modRequestHeaders });
            const data = await upgradesQuery.json() as PseudoGameData;

            this.#playerPseudoUpgrades = data;
            this.#pseudoDataUpdated();
        } catch (err) { HSLogger.error(`Could not fetch pseudo data: ${err}`, this.context); }

        try {
            const meQuery = await fetch(HSGlobal.Common.meAPIurl, { headers: HSGlobal.Common.modRequestHeaders });
            const data = await meQuery.json() as MeData;

            this.#meBonuses = data;
            this.#meDataUpdated();
        } catch (err) { HSLogger.error(`Could not fetch me data: ${err}`, this.context); }
    }

    /**
     * Updates game data and notifies all subscribers.
     * Also triggers initial loadout match if needed.
     * @returns void
     */
    #saveDataUpdated() {
        if (this.#gameDataAPI && this.#saveData) {
            this.#gameDataAPI._updateGameData(this.#saveData);
        }

        this.#gameDataSubscribers.forEach((callback) => {
            if (this.#saveData) {
                callback(this.#saveData);
            } else {
                HSLogger.debug(() => `Could not call game data change callback. No save data found`, this.context);
            }
        });
    }

    /**
     * Updates pseudo data in the game data API.
     * @returns void
     */
    #pseudoDataUpdated() {
        if (this.#gameDataAPI && this.#playerPseudoUpgrades) {
            this.#gameDataAPI._updatePseudoData(this.#playerPseudoUpgrades);
        }
    }

    /**
     * Updates me bonuses in the game data API.
     * @returns void
     */
    #meDataUpdated() {
        if (this.#gameDataAPI && this.#meBonuses) {
            this.#gameDataAPI._updateMeData(this.#meBonuses);
        }
    }

    /**
     * Updates event data in the game data API.
     * @returns void
     */
    #eventDataUpdated() {
        if (this.#gameDataAPI && this.#gameEvents) {
            this.#gameDataAPI._updateEventData(this.#gameEvents);
        }
    }


    // --- Consumables (Happy Hour Bells) ---

    /**
     * Follows the game's active Happy Hour Bells, read once a second from the game's own record
     * (window.__HS_consumables, exposed by the patcher; filled by the game's consumables WebSocket).
     * The mod no longer opens a connection of its own: the server refuses a second one for the same account.
     * Without the patcher's capture (bookmarklet, older patch) the bells stay at 0.
     * @returns void
     */
    #startConsumablesPoll() {
        if (!(window as any).__HS_consumables) {
            HSLogger.log(`Happy Hour Bells not readable (the game is not patched for it): counted as 0`, this.context);
            return;
        }

        let lastKey = '';
        const read = () => {
            const bell = (window as any).__HS_consumables?.HAPPY_HOUR_BELL;
            const amount = typeof bell?.amount === 'number' ? bell.amount : 0;
            const ends: number[] = Array.isArray(bell?.ends) ? bell.ends.filter((e: unknown) => typeof e === 'number') : [];
            const key = `${amount}|${ends.join(',')}`;
            if (key === lastKey) return;
            lastKey = key;

            this.#gameEvents.HAPPY_HOUR_BELL = {
                amount,
                ends,
                displayName: (typeof bell?.displayName === 'string' && bell.displayName) || 'Happy Hour Bell'
            };
            this.#eventDataUpdated();
        };

        read();
        setInterval(read, HSGlobal.HSGameData.consumablesPollInterval);
    }

    // --- Global event ---

    /**
     * Follows the game's global event: the patcher hands over each answer the game gets from
     * https://synergism.cc/events/get (Event.ts eventCheck, at load then every 5 minutes), and keeps the last one in
     * window.__HS_globalEvent, read here once because the game's first fetch comes before the mod loads.
     * The mod doesn't fetch it (the game's dev asked for less traffic). Without the patch (bookmarklet, older patch)
     * there is no global event. A save without dayCheck makes the game skip its fetch: no event, as in the game.
     * @returns void
     */
    #startGlobalEventCapture() {
        const w = window as any;
        if (!w.__HS_GLOBAL_EVENT_PATCHED) {
            HSLogger.log(`Global event not readable (the game is not patched for it): counted as none`, this.context);
            return;
        }

        w.__HS_onGlobalEvent = (json: unknown) => this.#gameDataAPI?._updateVanillaGlobalEvent(json);
        if (w.__HS_globalEvent !== undefined) this.#gameDataAPI?._updateVanillaGlobalEvent(w.__HS_globalEvent);
    }


    // --- Save Data Processing ---

    /**
     * Processes save data from localStorage using requestAnimationFrame loop.
     * Updates internal save data and handles errors.
     * @returns void
     */
    #processSaveDataWithRAF = () => {
        if (!this.#gdsEnabled) return;

        const saveDataB64 = localStorage.getItem(this.#saveDataLocalStorageKey);

        if (saveDataB64 && saveDataB64 !== this.#lastB64Save) {
            this.#lastB64Save = saveDataB64;

            try {
                this.#saveData = JSON.parse(atob(saveDataB64)) as GameData;
                this.#saveDataUpdated();
            } catch (error) {
                HSLogger.debug(() => `<red>Error processing save data:</red> ${error}`, this.context);
            }
        }

        requestAnimationFrame(this.#processSaveDataWithRAF);
    }


    // --- GDS (Game Data Sniffing) Control ---

    /**
     * Whether the GDS engine is currently running, i.e. the cached game data is kept up to date.
     * Can be false while the GDS setting is ON (engine paused by autosing or a save import).
     */
    isGDSRunning(): boolean {
        return this.#gdsEnabled;
    }

    /**
     * Pauses the GDS engine without touching the GDS setting, so the setting can't be left OFF
     * if the pause is never released (reload, crash...). The engine stays stopped until every
     * pause is released.
     * @param reason Identifies the pause, released by resumeGDS() with the same value.
     */
    async pauseGDS(reason: string): Promise<void> {
        this.#enginePauses.add(reason);
        HSLogger.debug(() => `GDS paused (${reason})`, this.context);
        if (this.#gdsEnabled) await this.disableGDS();
    }

    /**
     * Releases a pause taken by pauseGDS(). Restarts the engine when no pause is left
     * and the GDS setting is ON.
     * @param reason The value given to pauseGDS().
     * @returns true when the engine was restarted.
     */
    async resumeGDS(reason: string): Promise<boolean> {
        if (!this.#enginePauses.delete(reason)) return false;
        HSLogger.debug(() => `GDS pause released (${reason})`, this.context);
        if (this.#enginePauses.size > 0) return false;
        if (!(HSSettings.getSetting('useGameData')?.isEnabled() ?? false)) return false;

        await this.enableGDS();
        return this.#gdsEnabled;
    }

    /**
     * Enables Game Data Sniffing (GDS) mode, sets up intervals, hooks DOM elements,
     * and starts save processing. Handles turbo mode and experimental GDS.
     * Does nothing while the engine is paused (see pauseGDS()).
     * @returns Promise<void>
     */
    async enableGDS() {
        if (this.#gdsEnabled) return;
        if (this.#enginePauses.size > 0) {
            HSLogger.debug(() => `GDS start deferred, paused by: ${[...this.#enginePauses].join(', ')}`, this.context);
            return;
        }

        // Concurrent callers share one start, so the intervals are never installed twice.
        // A start cancelled by disableGDS() isn't shared: it ends by itself without starting anything.
        if (this.#engineStart?.generation !== this.#engineGeneration) {
            const start = {
                generation: this.#engineGeneration,
                promise: this.#startEngine(this.#engineGeneration).finally(() => {
                    if (this.#engineStart === start) this.#engineStart = undefined;
                })
            };
            this.#engineStart = start;
        }
        return this.#engineStart.promise;
    }

    async #startEngine(generation: number) {
        // Every wait happens before anything is installed: the start can be cancelled meanwhile
        if (!this.#manualSaveButton) {
            this.#manualSaveButton = await HSElementHooker.HookElement('#savegame') as HTMLButtonElement;
        }

        if (!this.#saveinfoElement) {
            this.#saveinfoElement = await HSElementHooker.HookElement('#saveinfo') as HTMLParagraphElement;
        }

        // Cancelled while waiting by disableGDS() or pauseGDS() (e.g. GDS turned off, autosing started)
        if (generation !== this.#engineGeneration || this.#enginePauses.size > 0 || this.#gdsEnabled) {
            HSLogger.debug(() => `GDS start cancelled`, this.context);
            return;
        }

        HSUI.injectStyle(this.#gdsCSS, HSGlobal.HSGameData.gdsCSSId);
        if (this.#saveInterval) clearInterval(this.#saveInterval);

        this.#saveInterval = setInterval(() => {
            if (this.#manualSaveButton && this.#saveinfoElement && this.#saveTriggerEvent) {
                this.#manualSaveButton.dispatchEvent(this.#saveTriggerEvent);
            }
        }, HSGlobal.HSGameData.gdsSpeedMs)

        HSLogger.info(`GDS = ON`, this.context);
        this.#gdsEnabled = true;

        if (HSGlobal.Common.experimentalGDS) {
            this.#hackJSNativebtoa();
            this.#hackJSNativeAtob();
            this.#processSaveDataExperimental();
        } else {
            this.#processSaveDataWithRAF();
        }
    }

    /**
     * Processes save data from MITM when new encoded save JSON has been captured.
     */
    #processSaveDataExperimental = () => {
        if (!this.#gdsEnabled) return;

        if (this.#mitm_gamedata && this.#mitm_gamedata !== this.#last_mitm_gamedata) {
            this.#last_mitm_gamedata = this.#mitm_gamedata;

            try {
                this.#saveData = JSON.parse(this.#mitm_gamedata) as GameData;
                this.#saveDataUpdated();
            } catch (error) {
                HSLogger.debug(() => `<red>Error processing save data:</red> ${error}`, this.context);
            }
        }
    }

    /**
     * Disables Game Data Sniffing (GDS) mode, clears intervals
     * and removes injected styles.
     * @returns Promise<void>
     */
    async disableGDS() {
        // Cancels a start still waiting in #startEngine()
        this.#engineGeneration++;

        if (this.#saveInterval) {
            clearInterval(this.#saveInterval);
            this.#saveInterval = undefined;
        }

        HSUI.removeInjectedStyle(HSGlobal.HSGameData.gdsCSSId);

        // The loadFromFileEventHandler is NOT removed here:
        // it must remain active to intercept save loads even when GDS is disabled.

        HSLogger.info(`GDS turbo = OFF`, this.context);
        this.#gdsEnabled = false;
    }

    /**
     * Prepares for autosing by hacking native btoa and atob functions.
     * @returns Promise<void>
     */
    async prepareForAutosing() {
        this.#hackJSNativebtoa();
        this.#hackJSNativeAtob();
    }

    /**
     * Dispatches a save event and extracts quarks and goldenQuarks from the latest save data.
     * @returns Promise<{ quarks: number; goldenQuarks: number } | null>
     */
    async getLatestAutosingData(): Promise<{ quarks: number; goldenQuarks: number } | null> {
        const saveButton = await HSElementHooker.HookElement('#savegame') as HTMLButtonElement;
        
        saveButton.dispatchEvent(this.#saveTriggerEvent);
        
        if (this.#mitm_gamedata) {
            try {
                // Parse only the needed fields
                const parsed = JSON.parse(this.#mitm_gamedata);
                const quarks = typeof parsed.worlds === 'number' ? parsed.worlds : 0;
                const goldenQuarks = typeof parsed.goldenQuarks === 'number' ? parsed.goldenQuarks : 0;
                return { quarks, goldenQuarks };
            } catch (e) {
                HSLogger.error(`Failed to parse mitm_gamedata for autosing: ${e}`, this.context);
                return null;
            }
        }
        return null;
    }

    /**
     * Hacks the native atob function to capture decoded save data.
     * @returns void
     */
    #hackJSNativeAtob() {
        if (this.#atobHacked) return;

        const self = this;
        const _atob = window.atob;

        if (!this.#nativeAtob) this.#nativeAtob = _atob;

        window.atob = function (s) {
            const decoded = _atob(s);
            // Quick check for JSON-like structure to capture save data
            if (decoded && decoded.trim().startsWith('{')) {
                self.#mitm_atob_data = decoded;
            }
            return decoded;
        }

        this.#atobHacked = true;
    }

    /**
     * Hacks the native btoa function to capture encoded save data.
     * @returns void
     */
    #hackJSNativebtoa() {
        if (this.#btoaHacked)
            return;

        const self = this;

        // Store ref to native btoa
        const _btoa = window.btoa;

        if (!this.#nativeBtoa) this.#nativeBtoa = _btoa;

        // Overwrite btoa
        window.btoa = function (s) {
            // Capture raw save JSON before the game encodes it to base64.
            // This is the save payload as the game produces it.
            if (s && s.length > 0 && s[0] === '{') {
                self.#mitm_gamedata = s;
                self.#mitmCaptureCount++;
                if (!self.#mitmProcessScheduled) {
                    self.#mitmProcessScheduled = true;
                    queueMicrotask(() => {
                        self.#mitmProcessScheduled = false;
                        self.#processSaveDataExperimental();
                    });
                }
            }
            // Call the original btoa so everything still works normally
            return _btoa(s);
        }

        this.#btoaHacked = true;
    }

    /**
     * Handles save file import: pauses the GDS engine and stops autosing if active,
     * watches for offline container visibility, restores active ambrosia loadout,
     * then brings the GDS engine back in line with the GDS setting.
     * The GDS setting itself is never changed here, so a cancelled or failed import
     * can't leave GDS turned off.
     * @param e MouseEvent from the import button click.
     * @returns Promise<void>
     */
    async #loadFromFileHandler(e: MouseEvent) {
        this.#mitm_atob_data = undefined; // Clear stale save data
        const gameDataSetting = HSSettings.getSetting("useGameData") as HSSetting<boolean>;
        const isGdsSettingEnabled = () => gameDataSetting?.isEnabled() ?? false;
        // Shown as paused when the setting is ON, even if autosing had already paused the engine
        const announcePause = isGdsSettingEnabled();
        // Ends the "GDS paused" notification shown below, only when one was shown
        const notifyResumed = (reason: string) => {
            if (!announcePause) return;
            HSUI.Notify(`GDS resumed (${reason})`, { position: 'top', notificationType: 'success' });
        };

        // An older click still waiting (e.g. no event came back from its dialog) is ended here.
        // Each click gets its own pause, so an older click can't release a newer one.
        this.#abortPendingImport?.();
        const pauseReason = `import-${++this.#importPauseSequence}`;
        // Taken before stopping autosing, so autosing releasing its own pause doesn't restart the engine
        await this.pauseGDS(pauseReason);

        // Autosing can't go on with another save, whatever the GDS state
        const autosing = HSModuleManager.getModule<HSAutosing>('HSAutosing');
        // Also a start in progress or a pending restart, which would run on the imported save
        const stopsAutosing = autosing?.isAutosingActive() ?? false;
        if (stopsAutosing) {
            HSLogger.log("Load from file clicked - Stopping Auto-Sing", this.context);
            autosing!.stopAutosing();
        }

        if (stopsAutosing && announcePause) {
            HSUI.Notify("Auto-Sing stopped and GDS paused for save file import", { position: 'top', notificationType: 'warning' });
        } else if (stopsAutosing) {
            HSUI.Notify("Auto-Sing stopped for save file import", { position: 'top', notificationType: 'warning' });
        } else if (announcePause) {
            HSUI.Notify('GDS paused for save file import', { position: 'top', notificationType: 'warning' });
        }

        // Always run the detection/cleanup logic, regardless of previous GDS state
        // We start watching the offline container to detect when the save is actually loaded
        const offlineContainer = await HSElementHooker.HookElement('#offlineContainer') as HTMLDivElement;
        const self = this;
        let watcherStopped = false;
        // Set below, once the dialog listeners exist
        let stopWaitingForLoad = () => { };

        const watcherId = HSElementHooker.watchElement(offlineContainer, async (viewState: { view: string, state: string }) => {
            if (viewState.state !== 'none' && !watcherStopped) {
                // IMMEDIATELY mark as stopped and disconnect to prevent multiple fires during lag
                watcherStopped = true;
                stopWaitingForLoad();

                try {
                    HSLogger.log("Offline container visible - Save loaded (GDS)", self.context);

                    // Ensure GDS is enabled for UI sync - AWAIT it because it triggers CPU heavy refreshes
                    if (await self.resumeGDS(pauseReason)) {
                        notifyResumed('save loaded');
                    } else {
                        // Setting OFF: run the engine briefly for the cleanup, stopped again below
                        await self.enableGDS();
                    }

                    const ambrosiaModule = HSModuleManager.getModule<HSAmbrosia>('HSAmbrosia');
                    if (ambrosiaModule) {
                        // AWAIT reset to ensure it finishes before we start matching or setting
                        await ambrosiaModule.resetActiveLoadout();
                    }

                    // --- Restore Correct Loadout Logic ---
                    if (self.#mitm_atob_data) {
                        try {
                            const saveData = JSON.parse(self.#mitm_atob_data) as GameData;
                            if (ambrosiaModule) {
                                await ambrosiaModule.performInitialActiveLoadoutMatch(saveData);
                            }
                        } catch (e) {
                            HSLogger.warn(`Failed to analyze save data for loadout restoration: ${e}`, self.context);
                        }
                    } else {
                        HSLogger.debug(() => `No captured save data (mitm_atob_data is empty).`, self.context);
                    }

                    if (!isGdsSettingEnabled()) {
                        // Wait for game state to settle and cleanup to take effect, then restore OFF state
                        setTimeout(() => {
                            // The player may have turned GDS on in the meantime
                            if (isGdsSettingEnabled()) return;
                            self.disableGDS();
                            HSLogger.debug(() => "Cleanup done. GDS disabled (Restored state)", self.context);
                        }, 2000);
                    } else {
                        HSLogger.debug(() => "GDS remained enabled (Restored state)", self.context);
                    }
                } catch (e) {
                    HSLogger.error(`Critical error during GDS save load restoration: ${e}`, self.context);
                }
            }
        }, {
            attributes: true,
            attributeFilter: ['style'],
            valueParser: (element, mutations) => {
                for (const mutation of mutations) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                        const target = mutation.target as HTMLElement;
                        const display = target.style.getPropertyValue('display');
                        return {
                            view: target.id,
                            state: display
                        }
                    }
                }
                return { view: element.id, state: element.style.getPropertyValue('display') };
            }
        });

        // --- No save loaded: dialog cancelled, or the game refused the file (it only shows an Alert) ---
        const fileInput = document.getElementById('importfile') as HTMLInputElement | null;
        let noLoadTimer: number | undefined;
        let fileChosen = false;

        const stopWaiting = () => {
            watcherStopped = true;
            window.clearTimeout(noLoadTimer);
            fileInput?.removeEventListener('cancel', onCancel);
            fileInput?.removeEventListener('change', onChange);
            window.removeEventListener('focus', onFocus);
            if (watcherId) HSElementHooker.stopWatching(watcherId);
            if (self.#abortPendingImport === abortThisImport) self.#abortPendingImport = undefined;
        };
        stopWaitingForLoad = stopWaiting;

        const endWithoutLoad = (reason: string) => {
            if (watcherStopped) return;
            stopWaiting();
            HSLogger.log(`Save file import ended without a save loaded (${reason})`, self.context);
            void self.resumeGDS(pauseReason).then((resumed) => {
                if (resumed) notifyResumed('no save loaded');
            });
        };

        // Fired when the dialog is closed without choosing a file
        const onCancel = () => endWithoutLoad('dialog cancelled');
        // A file was chosen: the game reads it and shows the offline popup if it loads it
        const onChange = () => {
            fileChosen = true;
            window.clearTimeout(noLoadTimer);
            noLoadTimer = window.setTimeout(() => endWithoutLoad('file not loaded by the game'), 10_000);
        };
        // Fallback when 'cancel' isn't supported. 'change' may come just after 'focus', hence the long delay
        const onFocus = () => {
            window.removeEventListener('focus', onFocus);
            if (fileChosen) return;
            noLoadTimer = window.setTimeout(() => endWithoutLoad('dialog closed'), 10_000);
        };

        fileInput?.addEventListener('cancel', onCancel);
        fileInput?.addEventListener('change', onChange);
        window.addEventListener('focus', onFocus);

        // A new click ends this import without resuming: the new click takes its own pause right after
        const abortThisImport = () => {
            if (watcherStopped) return;
            stopWaiting();
            this.#enginePauses.delete(pauseReason);
        };
        this.#abortPendingImport = abortThisImport;
    }

    // --- Subscription Management ---

    /**
     * Subscribes a callback to game data changes.
     * @param callback Function to call when game data changes.
     * @returns Subscription ID string or undefined.
     */
    subscribeGameDataChange(callback: (data: GameData) => void): string | undefined {
        const id = HSUtils.uuidv4();
        this.#gameDataSubscribers.set(id, callback);
        return id;
    }

    /**
     * Unsubscribes a callback from game data changes by ID.
     * @param id Subscription ID to remove.
     * @returns void
     */
    unsubscribeGameDataChange(id: string) {
        if (this.#gameDataSubscribers.has(id)) {
            this.#gameDataSubscribers.delete(id);
        } else {
            HSLogger.warn(`Could not unsubscribe from game data change. ID ${id} not found`, this.context);
        }
    }
}
