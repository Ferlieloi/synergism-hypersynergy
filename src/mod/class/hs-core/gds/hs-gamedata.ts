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
import { HSBooleanSetting, HSSetting } from "../settings/hs-setting";
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
    #saveDataCheckInterval?: number;
    #saveData?: GameData;
    #lastB64Save?: string;
    #wasUsingGDS = false;
    
    isSteam = false;

    // --- MITM / Encoding / Native JS Hooks ---
    #mitm_gamedata: string | undefined;
    #last_mitm_gamedata?: string;
    #mitm_atob_data: string | undefined;
    #mitmProcessScheduled = false;
    #btoaHacked = false;
    #atobHacked = false;
    #nativeBtoa?: typeof window.btoa;
    #nativeAtob?: typeof window.atob;

    // --- Turbo Mode & Intervals ---
    #gdsEnabled = false;
    #gdsCSS = `
        #savegame {
            display: none !important;
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
    #singularityButton?: HTMLImageElement;
    #importSaveButton?: HTMLLabelElement;
    #singularityChallengeButtons?: HTMLDivElement[];

    // --- Event Handlers ---
    #singularityEventHandler?: (e: MouseEvent) => Promise<void>;
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
        this.#singularityButton = document.querySelector('#singularitybtn') as HTMLImageElement;
        this.#singularityChallengeButtons = Array.from(document.querySelectorAll('#singularityChallenges > div.singularityChallenges > div'));
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

        // Set before the fetches: the fetched data only reaches the API through this reference.
        // This is the only automatic fetch (asked by the game's dev: too much traffic on these endpoints);
        // afterwards only forceUpdateAllData() fetches again, on a player's action (heater export).
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
        const match = text.match(/^You have\s+(\d+)\s+\/\s+(\d+)\s+/);
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
                this.#maybeStopSniffOnError();
            }
        }

        requestAnimationFrame(this.#processSaveDataWithRAF);
    }

    /**
     * Stops game data sniffing if error is detected and settings allow it.
     * @returns void
     */
    #maybeStopSniffOnError() {
        if (!this.#saveDataCheckInterval) return;

        const useGameDataSetting = HSSettings.getSetting('useGameData') as HSBooleanSetting;
        const stopSniffOnErrorSetting = HSSettings.getSetting('stopSniffOnError') as HSBooleanSetting;

        if (useGameDataSetting && stopSniffOnErrorSetting) {
            if (stopSniffOnErrorSetting.isEnabled()) {
                HSLogger.debug(() => `Stopped game data sniffing on error`, this.context);
                useGameDataSetting.disable();
            }
        } else {
            HSLogger.debug(() => `maybeStopSniffOnError() - Issue with fetching settings: ${useGameDataSetting}, ${stopSniffOnErrorSetting}`, this.context);
        }
    }


    // --- GDS (Game Data Sniffing) Control ---

    /**
     * Enables Game Data Sniffing (GDS) mode, sets up intervals, hooks DOM elements,
     * and starts save processing. Handles turbo mode and experimental GDS.
     * @returns Promise<void>
     */
    async enableGDS() {
        if (this.#gdsEnabled) return;

        HSUI.injectStyle(this.#gdsCSS, HSGlobal.HSGameData.gdsCSSId);

        if (this.#saveInterval) clearInterval(this.#saveInterval);

        if (!this.#manualSaveButton) {
            this.#manualSaveButton = await HSElementHooker.HookElement('#savegame') as HTMLButtonElement;
        }

        if (!this.#saveinfoElement) {
            this.#saveinfoElement = await HSElementHooker.HookElement('#saveinfo') as HTMLParagraphElement;
        }

        this.#saveInterval = setInterval(() => {
            if (this.#manualSaveButton && this.#saveinfoElement && this.#saveTriggerEvent) {
                this.#manualSaveButton.dispatchEvent(this.#saveTriggerEvent);
            }
        }, HSGlobal.HSGameData.gdsSpeedMs)

        if (!this.#singularityButton)
            this.#singularityButton = await HSElementHooker.HookElement('#singularitybtn') as HTMLImageElement;

        this.#singularityChallengeButtons ||= Array.from(document.querySelectorAll('#singularityChallenges > div.singularityChallenges > div'));

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
                this.#maybeStopSniffOnError();
            }
        }
    }

    /**
     * Disables Game Data Sniffing (GDS) mode, clears intervals,
     * removes injected styles, and detaches event handlers.
     * @returns Promise<void>
     */
    async disableGDS() {
        const self = this;

        if (this.#saveInterval) {
            clearInterval(this.#saveInterval);
            this.#saveInterval = undefined;
        }

        HSUI.removeInjectedStyle(HSGlobal.HSGameData.gdsCSSId);

        if (!this.#singularityButton)
            this.#singularityButton = await HSElementHooker.HookElement('#singularitybtn') as HTMLImageElement;

        if (!this.#singularityChallengeButtons)
            this.#singularityChallengeButtons = await HSElementHooker.HookElements('#singularityChallenges > div.singularityChallenges > div') as HTMLDivElement[];

        if (!this.#importSaveButton)
            this.#importSaveButton = await HSElementHooker.HookElement('#importFileButton') as HTMLLabelElement;

        if (this.#singularityEventHandler) {
            this.#singularityButton.removeEventListener('click', this.#singularityEventHandler, { capture: true });

            this.#singularityChallengeButtons.forEach((btn) => {
                btn.removeEventListener('click', self.#singularityEventHandler!, { capture: true });
            });

            this.#singularityEventHandler = undefined;
        }

        // We do NOT remove the loadFromFileEventHandler here.
        // It must remain active to intercept save loads even when GDS is disabled.
        // if (this.#loadFromFileEventHandler) {
        //    this.#importSaveButton.removeEventListener('click', this.#loadFromFileEventHandler, { capture: true });
        //    this.#loadFromFileEventHandler = undefined;
        // }

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
     * Handles save file import, disables GDS and autosing if active,
     * watches for offline container visibility, restores active ambrosia loadout,
     * and restores GDS state after import.
     * @param e MouseEvent from the import button click.
     * @returns Promise<void>
     */
    async #loadFromFileHandler(e: MouseEvent) {
        this.#mitm_atob_data = undefined; // Clear stale save data
        const gameDataSetting = HSSettings.getSetting("useGameData") as HSSetting<boolean>;

        // Capture state BEFORE we potentially change it
        // If GDS is disabled, this will be false, so the Flash GDS logic will correctly "Flash" it (Enable -> Clean -> Disable)
        this.#wasUsingGDS = gameDataSetting ? gameDataSetting.isEnabled() : false;

        if (gameDataSetting && gameDataSetting.isEnabled()) {
            gameDataSetting.disable({ preserveGameDataDependents: true });

            const autosing = HSModuleManager.getModule<HSAutosing>('HSAutosing');
            if (autosing && autosing.isAutosingEnabled()) {
                HSLogger.log("Load from file clicked - Stopping Auto-Sing (GDS)", this.context);
                autosing.stopAutosing();
                HSUI.Notify("Auto-Sing stopped and GDS disabled for save file import", { position: 'top', notificationType: 'warning' });
            } else {
                HSUI.Notify('GDS has been disabled for save file import', { position: 'top', notificationType: 'warning' });
            }
        }

        // Always run the detection/cleanup logic, regardless of previous GDS state
        // We start watching the offline container to detect when the save is actually loaded
        const offlineContainer = await HSElementHooker.HookElement('#offlineContainer') as HTMLDivElement;
        const self = this;
        let watcherStopped = false;

        const watcherId = HSElementHooker.watchElement(offlineContainer, async (viewState: { view: string, state: string }) => {
            if (viewState.state !== 'none' && !watcherStopped) {
                // IMMEDIATELY mark as stopped and disconnect to prevent multiple fires during lag
                watcherStopped = true;
                if (watcherId) {
                    HSElementHooker.stopWatching(watcherId);
                }

                try {
                    HSLogger.log("Offline container visible - Save loaded (GDS)", self.context);

                    // Ensure GDS is enabled for UI sync - AWAIT it because it triggers CPU heavy refreshes
                    await self.enableGDS();

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

                    if (!self.#wasUsingGDS) {
                        // Wait for game state to settle and cleanup to take effect, then restore OFF state
                        setTimeout(() => {
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

        // Cleanup watcher if user cancels file dialog (focus returns to window)
        const focusHandler = () => {
            setTimeout(() => {
                if (watcherId && !watcherStopped) {
                    if (HSElementHooker.stopWatching(watcherId)) {
                        HSLogger.log("GDS Save Load Watcher timed out (User likely cancelled)", self.context);
                    }
                    watcherStopped = true;
                }
            }, 5000);
            window.removeEventListener('focus', focusHandler);
        };
        window.addEventListener('focus', focusHandler);
    }

    // Not used anymore ? Useful to keep ?
    /**
     * Ensures that GDS is temporarily disabled during a singularity action
     * (to avoid data sync issues or conflicts), then re-enabled after a short delay.
     * It also prevents users from performing a singularity while a challenge is active
     * or when the button is disabled.
     * @param e MouseEvent from the singularity button or challenge button click.
     * @returns Promise<void>
     */
    async #singularityHandler(e: MouseEvent) {
        const target = e.target as HTMLElement;

        const challengeTargets = [
            'noSingularityUpgrades',
            'oneChallengeCap',
            'limitedAscensions',
            'noOcteracts',
            'noAmbrosiaUpgrades',
            'limitedTime',
            'sadisticPrequel',
            'taxmanLastStand',
        ];

        if (target) {
            let canSingularity;
            const styleString = target.getAttribute('style');

            // User pressed singularity challenge button
            if (target.id && challengeTargets.includes(target.id)) {
                // User pressed active sing challenge button (is trying to quit or complete it)
                if (styleString?.includes('orchid')) {
                    canSingularity = true;
                } else {
                    // User pressed non-active sing challenge button
                    // If any challenge is active, user can't sing
                    const challengeButtons = this.#singularityChallengeButtons ?? Array.from(document.querySelectorAll('#singularityChallenges > div.singularityChallenges > div'));
                    const anyChallengeActive = challengeButtons
                        .map((btn) => challengeTargets.includes(btn.id) ? btn.getAttribute('style')?.includes('orchid') : false)
                        .some((b => b === true));

                    // User can't sing because they're trying to swap sing challenge
                    if (anyChallengeActive) {
                        canSingularity = false;
                    } else {
                        canSingularity = true;
                    }
                }
            } else {
                // User pressed the normal sing button
                // Check if the button is grayed out
                if (!styleString?.toLowerCase().includes('grayscale')) {
                    canSingularity = true;
                } else {
                    canSingularity = false;
                }
            }

            if (canSingularity) {
                const gameDataSetting = HSSettings.getSetting("useGameData") as HSSetting<boolean>;

                if (gameDataSetting && gameDataSetting.isEnabled()) {
                    this.#wasUsingGDS = true;
                    //this.#afterSingularityCheckerIntervalElapsed = 0;
                    //clearInterval(this.#afterSingularityCheckerInterval);

                    // From here on these are used
                    gameDataSetting.disable({ preserveGameDataDependents: true });
                    /*
                    await HSUI.Notify('GDS temporarily disabled for Sing and will be re-enabled soon', {
                        position: 'topRight',
                        notificationType: 'warning'
                    });*/

                    await HSUtils.wait(4000);

                    const gdsSetting = HSSettings.getSetting('useGameData') as HSSetting<boolean>;

                    if (gdsSetting && this.#wasUsingGDS && !gdsSetting.isEnabled()) {
                        HSLogger.debug(() => `Re-enabled GDS`, this.context);
                        gdsSetting.enable();
                    } else {
                        HSLogger.debug(() => `GDS was already enabled (WoW fast!)`, this.context);
                    }

                    this.#wasUsingGDS = false;
                }
            }
        }
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
