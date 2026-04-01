import { MeData } from "../../../types/data-types/hs-me-data";
import { AmbrosiaUpgradeData, AmbrosiaUpgrades, PlayerData } from "../../../types/data-types/hs-player-savedata";
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
import { CampaignData } from "../../../types/data-types/hs-campaign-data";
import { GameEventResponse, GameEventResponseType, ConsumableGameEvents, GameEventID } from "../../../types/data-types/hs-event-data";
import { HSWebSocket } from "../hs-websocket";
import { HSModuleOptions } from "../../../types/hs-types";
import { AmbrosiaUpgradeCalculationCollection, AmbrosiaUpgradeCalculationConfig } from "../../../types/data-types/hs-gamedata-api-types";

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
    #saveData?: PlayerData;
    #lastB64Save?: string;
    #wasUsingGDS = false;
    #hasPerformedInitialLoadoutMatch = false;

    // --- MITM / Encoding / Native JS Hooks ---
    #mitm_gamedata: string | undefined;
    #mitm_atob_data: string | undefined;
    #btoaHacked = false;
    #atobHacked = false;
    #nativeBtoa?: typeof window.btoa;
    #nativeAtob?: typeof window.atob;

    // --- Turbo Mode & Intervals ---
    #turboEnabled = false;
    #turboCSS = `
        #savegame {
            display: none !important;
        }
        #saveinfo {
            display: none !important;
        }
    `;
    #saveInterval?: number;
    #fetchedDataRefreshInterval?: number;

    // --- DOM Elements ---
    #manualSaveButton?: HTMLButtonElement;
    #saveinfoElement?: HTMLParagraphElement;
    #gameDataDebugElement?: HTMLDivElement;
    #singularityButton?: HTMLImageElement;
    #importSaveButton?: HTMLLabelElement;
    #singularityChallengeButtons?: HTMLDivElement[];
    #campaignTokenElement?: HTMLHeadingElement;

    // --- Event Handlers ---
    #singularityEventHandler?: (e: MouseEvent) => Promise<void>;
    #loadFromFileEventHandler?: (e: MouseEvent) => Promise<void>;

    // --- Data APIs & Subscribers ---
    #gameDataSubscribers: Map<string, (data: PlayerData) => void> = new Map();
    #gameDataAPI?: HSGameDataAPI;

    // --- Player/Me/Campaign Data ---
    #playerPseudoUpgrades?: PseudoGameData;
    #meBonuses?: MeData;
    #campaignTokenRefreshInterval?: number;
    #campaignData: CampaignData = {
        tokens: 0,
        maxTokens: 0,
        isAtMaxTokens: false,
    };

    // --- Game Events ---
    #gameEvents: ConsumableGameEvents = {
        HAPPY_HOUR_BELL: { amount: 0, ends: [], displayName: "Happy Hour Bell" },
        LOTUS_OF_REJUVENATION: { amount: 0, ends: [], displayName: "Lotus of Rejuvenation" }
    };

    // --- Miscellaneous ---
    #saveTriggerEvent: Event;
    #lastForceFetch = 0;
    #ForceFetchCooldown = 5000;

    constructor(moduleOptions: HSModuleOptions) {
        super(moduleOptions);
        this.#campaignTokenElement = document.querySelector('#campaignTokenCount') as HTMLHeadingElement;

        this.#saveTriggerEvent = new Event('click');
    }

    /**
     * Initializes the HSGameData module, sets up DOM elements, fetches pseudo and me data,
     * registers the WebSocket, and hooks the import button for save file interception.
     * @returns Promise<void>
     */
    async init() {
        const self = this;
        HSLogger.log(`Initializing HSGameData module`, this.context);

        this.#singularityButton = document.querySelector('#singularitybtn') as HTMLImageElement;
        this.#singularityChallengeButtons = Array.from(document.querySelectorAll('#singularityChallenges > div.singularityChallenges > div'));
        this.#importSaveButton = document.querySelector('#importFileButton') as HTMLLabelElement;

        try {
            const upgradesQuery = await fetch(HSGlobal.Common.pseudoAPIurl);
            const data = await upgradesQuery.json() as PseudoGameData;

            this.#playerPseudoUpgrades = data;
            this.#pseudoDataUpdated();
        } catch (err) {
            HSLogger.error(`Could not fetch pseudo data: ${err}`, this.context);
        }

        try {
            const meQuery = await fetch(HSGlobal.Common.meAPIurl);
            const data = await meQuery.json() as MeData;

            this.#meBonuses = data;
            this.#meDataUpdated();
        } catch (err) {
            HSLogger.error(`Could not fetch me data: ${err}`, this.context);
        }

        this.#gameDataAPI = HSModuleManager.getModule('HSGameDataAPI') as HSGameDataAPI;
        this.#registerWebSocket();
        this.isInitialized = true;

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

        if (now - this.#lastForceFetch < this.#ForceFetchCooldown) {
            HSLogger.warn("Forced data refresh on cooldown", this.context);
            return;
        }

        this.#lastForceFetch = now;

        await this.#refreshFetchedData();
        await this.#refreshCampaignTokens();
        // Do we need this redundant call ?!
        await this.#refreshFetchedData();
        this.#hackJSNativebtoa();
        this.#hackJSNativeAtob();

        const saveBtn = await HSElementHooker.HookElement('#savegame') as HTMLButtonElement;

        if (saveBtn) {
            saveBtn.dispatchEvent(this.#saveTriggerEvent);
        }

        if (this.#mitm_gamedata)
            this.#saveData = JSON.parse(this.#mitm_gamedata) as PlayerData;

        this.#pseudoDataUpdated();
        this.#meDataUpdated();
        this.#campaignDataUpdated();
        this.#saveDataUpdated();
    }

    /**
     * Fetches pseudo and me data from remote APIs and updates internal state.
     * @returns Promise<void>
     */
    async #refreshFetchedData() {
        HSLogger.debug(`Refreshing fetched data`, this.context);

        try {
            const upgradesQuery = await fetch('https://synergism.cc/stripe/upgrades');
            const data = await upgradesQuery.json() as PseudoGameData;

            this.#playerPseudoUpgrades = data;
            this.#pseudoDataUpdated();
        } catch (err) {
            HSLogger.error(`Could not fetch pseudo data: ${err}`, this.context);
        }

        try {
            const meQuery = await fetch('https://synergism.cc/api/v1/users/me');
            const data = await meQuery.json() as MeData;

            this.#meBonuses = data;
            this.#meDataUpdated();
        } catch (err) {
            HSLogger.error(`Could not fetch me data: ${err}`, this.context);
        }
    }

    /**
     * Resets all game event data to default values and triggers event data update.
     * @returns void
     */
    #resetEventData() {
        for (const key of Object.keys(this.#gameEvents)) {
            this.#gameEvents[key as keyof ConsumableGameEvents] = {
                amount: 0,
                ends: [],
                displayName: ''
            }
        }

        this.#eventDataUpdated();
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
                HSLogger.debug(`Could not call game data change callback. No save data found`, this.context);
            }
        });

        if (!this.#hasPerformedInitialLoadoutMatch && this.#saveData) {
            // There's probably a better place to put this...
            HSSettings.updateStrategyDropdownList();
            this.#performInitialLoadoutMatch();
            this.#hasPerformedInitialLoadoutMatch = true;
        }
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
     * Updates campaign data in the game data API.
     * @returns void
     */
    #campaignDataUpdated() {
        if (this.#gameDataAPI && this.#campaignData) {
            this.#gameDataAPI._updateCampaignData(this.#campaignData);
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


    // --- WebSocket/Event Handling ---

    /**
     * Sets up the WebSocket connection for consumable game events.
     * Registers a handler for incoming messages that updates internal event state based on event type:
     * - INFO_ALL: Resets event data, then processes active events, updating their end times, amounts, and display names. Unknown events are logged as warnings.
     * - CONSUMED: Updates Happy Hour event, setting end time, amount, and display name.
     * - CONSUMABLE_ENDED: Removes ended Happy Hour event and decrements amount.
     * - APPLIED_LOTUS, LOTUS_ACTIVE, LOTUS_ENDED: Updates Lotus event end times and amounts.
     * - Other event types: Not used.
     * Handles retry failures by resetting event data and triggering an update.
     * @returns void
     */
    #registerWebSocket() {
        const self = this;
        const wsMod = HSModuleManager.getModule<HSWebSocket>('HSWebSocket');

        if (wsMod) {
            wsMod.registerWebSocket<GameEventResponse>('consumable-event-socket', {
                url: HSGlobal.Common.eventAPIUrl,
                onMessage: async (msg) => {
                    HSLogger.debug(`onMessage received: ${JSON.stringify(msg)}`, this.context);
                    switch (msg?.type) {
                        case GameEventResponseType.INFO_ALL: {
                            self.#resetEventData();
                            if (msg.active && msg.active.length > 0) {
                                HSLogger.debug(`Caught WS event: ${msg.type} - event count: ${msg.active.length}`, this.context);
                                for (const { internalName, endsAt, name } of msg.active) {
                                    const consumable = self.#gameEvents[internalName as keyof ConsumableGameEvents];
                                    consumable.ends.push(endsAt);
                                    consumable.amount++;
                                    consumable.displayName = name;
                                }
                                self.#eventDataUpdated();
                            } else {
                                HSLogger.debug(`Caught INFO_ALL, but no active events`, this.context);
                            }
                            break;
                        }
                        case GameEventResponseType.CONSUMED: {
                            HSLogger.debug(`Caught CONSUMED event (Happy Hour)`, this.context);
                            const consumable = self.#gameEvents[msg.consumable as keyof ConsumableGameEvents];
                            if (consumable) {
                                consumable.ends.push(msg.startedAt + 3600 * 1000);
                                consumable.amount++;
                                consumable.displayName = msg.displayName;
                                self.#eventDataUpdated();
                            } else {
                                HSLogger.warn(`Unknown event: ${msg.consumable}`, this.context);
                            }
                            break;
                        }
                        case GameEventResponseType.CONSUMABLE_ENDED: {
                            HSLogger.debug(`Caught CONSUMABLE_ENDED (Happy Hour)`, this.context);
                            const consumable = self.#gameEvents[msg.consumable as keyof ConsumableGameEvents];
                            if (consumable) {
                                consumable.ends.shift();
                                consumable.amount--;
                                self.#eventDataUpdated();
                            } else {
                                HSLogger.warn(`Unknown event: ${msg.consumable}`, this.context);
                            }
                            break;
                        }

                        case GameEventResponseType.APPLIED_LOTUS: {
                            HSLogger.debug(`Caught APPLIED_LOTUS event`, this.context);
                            const consumable = self.#gameEvents[GameEventID.LOTUS_OF_REJUVENATION as keyof ConsumableGameEvents];
                            if (consumable) {
                                const newEnd = performance.now() + msg.remaining;
                                consumable.ends[0] = newEnd;
                                consumable.amount = 1;
                                self.#eventDataUpdated();
                            } else {
                                HSLogger.warn(`Unknown event: ${GameEventID.LOTUS_OF_REJUVENATION}`, this.context);
                            }
                            break;
                        }
                        case GameEventResponseType.LOTUS_ACTIVE: {
                            HSLogger.debug(`Caught LOTUS_ACTIVE event`, this.context);
                            const consumable = self.#gameEvents[GameEventID.LOTUS_OF_REJUVENATION as keyof ConsumableGameEvents];
                            if (consumable) {
                                consumable.ends[0] = performance.now() + msg.remainingMs;
                                consumable.amount = 1;
                                self.#eventDataUpdated();
                            } else {
                                HSLogger.warn(`Unknown event: ${GameEventID.LOTUS_OF_REJUVENATION}`, this.context);
                            }
                            break;
                        }
                        case GameEventResponseType.LOTUS_ENDED: {
                            HSLogger.debug(`Caught LOTUS_ENDED event`, this.context);
                            const consumable = self.#gameEvents[GameEventID.LOTUS_OF_REJUVENATION as keyof ConsumableGameEvents];
                            if (consumable) {
                                consumable.ends.shift();
                                consumable.amount = 0;
                                self.#eventDataUpdated();
                            } else {
                                HSLogger.warn(`Unknown event: ${GameEventID.LOTUS_OF_REJUVENATION}`, this.context);
                            }
                            break;
                        }
                        case GameEventResponseType.LOTUS: {
                            HSLogger.debug(`Caught LOTUS (bought) event`, this.context);
                            break;
                        }
                        case GameEventResponseType.TIPS: {
                            HSLogger.debug(`Caught TIPS (received) event`, this.context);
                            break;
                        }
                        case GameEventResponseType.APPLIED_TIP: {
                            HSLogger.debug(`Caught APPLIED_TIP event`, this.context);
                            break;
                        }
                        case GameEventResponseType.TIP_BACKLOG: {
                            HSLogger.debug(`Caught TIP_BACKLOG event`, this.context);
                            break;
                        }
                        case GameEventResponseType.TIME_SKIP: {
                            HSLogger.debug(`Caught TIME_SKIP event`, this.context);
                            break;
                        }
                        case GameEventResponseType.THANKS: {
                            HSLogger.debug(`Caught THANKS event`, this.context);
                            break;
                        }
                        case GameEventResponseType.JOIN: {
                            HSLogger.debug(`Caught JOIN (connection established)`, this.context);
                            break;
                        }
                        case GameEventResponseType.WARN: {
                            HSLogger.warn(`Caught WARNING: ${msg.message}`, this.context);
                            break;
                        }
                        case GameEventResponseType.ERROR: {
                            HSLogger.warn(`Caught ERROR`, this.context);
                            self.#resetEventData();
                            break;
                        }
                        default: {
                            HSLogger.debug(`Caught unknown event type: ${msg}`, this.context);
                        }
                    }
                },
                onRetriesFailed: async () => {
                    self.#resetEventData();
                    self.#eventDataUpdated();
                }
            })
        }
    }


    // --- Save Data Processing ---

    /**
     * Processes save data from localStorage using requestAnimationFrame loop.
     * Updates internal save data and handles errors.
     * @returns void
     */
    #processSaveDataWithRAF = () => {
        if (!this.#turboEnabled) return;

        const saveDataB64 = localStorage.getItem(this.#saveDataLocalStorageKey);

        if (saveDataB64 && saveDataB64 !== this.#lastB64Save) {
            this.#lastB64Save = saveDataB64;

            try {
                this.#saveData = JSON.parse(atob(saveDataB64)) as PlayerData;
                this.#saveDataUpdated();
            } catch (error) {
                HSLogger.debug(`<red>Error processing save data:</red> ${error}`, this.context);
                this.#maybeStopSniffOnError();
            }
        }

        requestAnimationFrame(this.#processSaveDataWithRAF);
    }

    /**
     * Processes save data from MITM using requestAnimationFrame loop.
     * Updates internal save data and handles errors.
     * @returns void
     */
    #processSaveDataWithRAFExperimental = () => {
        if (!this.#turboEnabled) return;

        if (this.#mitm_gamedata) {
            try {
                this.#saveData = JSON.parse(this.#mitm_gamedata) as PlayerData;
                this.#saveDataUpdated();
            } catch (error) {
                HSLogger.debug(`<red>Error processing save data:</red> ${error}`, this.context);
                this.#maybeStopSniffOnError();
            }
        }

        requestAnimationFrame(this.#processSaveDataWithRAFExperimental);
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
                HSLogger.debug(`Stopped game data sniffing on error`, this.context);
                useGameDataSetting.disable();
            }
        } else {
            HSLogger.debug(`maybeStopSniffOnError() - Issue with fetching settings: ${useGameDataSetting}, ${stopSniffOnErrorSetting}`, this.context);
        }
    }


    // --- GDS (Game Data Sniffing) Control ---

    /**
     * Enables Game Data Sniffing (GDS) mode, sets up intervals, hooks DOM elements,
     * and starts save processing. Handles turbo mode and experimental GDS.
     * @returns Promise<void>
     */
    async enableGDS() {
        const self = this;

        if (this.#turboEnabled) return;

        HSUI.injectStyle(this.#turboCSS, HSGlobal.HSGameData.turboCSSId);

        if (this.#saveInterval) clearInterval(this.#saveInterval);

        await this.#refreshFetchedData();

        if (this.#fetchedDataRefreshInterval)
            clearInterval(this.#fetchedDataRefreshInterval);

        this.#fetchedDataRefreshInterval = setInterval(() => { self.#refreshFetchedData(); }, HSGlobal.HSGameData.fetchedDataRefreshInterval);

        this.#refreshCampaignTokens();

        if (this.#campaignTokenRefreshInterval) {
            clearInterval(this.#campaignTokenRefreshInterval);
        }

        if (!this.#campaignData.isAtMaxTokens)
            this.#campaignTokenRefreshInterval = setInterval(() => { self.#refreshCampaignTokens(); }, HSGlobal.HSGameData.campaignTokenRefreshInterval);

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
        }, HSGlobal.HSGameData.turboModeSpeedMs)

        if (!this.#singularityButton)
            this.#singularityButton = await HSElementHooker.HookElement('#singularitybtn') as HTMLImageElement;

        if (!this.#singularityChallengeButtons)
            this.#singularityChallengeButtons = Array.from(document.querySelectorAll('#singularityChallenges > div.singularityChallenges > div'));



        HSLogger.info(`GDS = ON`, this.context);
        this.#turboEnabled = true;

        if (HSGlobal.Common.experimentalGDS) {
            this.#hackJSNativebtoa();
            this.#hackJSNativeAtob();
            this.#processSaveDataWithRAFExperimental();
        } else {
            this.#processSaveDataWithRAF();
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

        if (this.#fetchedDataRefreshInterval)
            clearInterval(this.#fetchedDataRefreshInterval);

        if (this.#campaignTokenRefreshInterval)
            clearInterval(this.#campaignTokenRefreshInterval);

        HSUI.removeInjectedStyle(HSGlobal.HSGameData.turboCSSId);

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
        this.#turboEnabled = false;
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
            // Small check so we hopefully mitm just when we have the save
            if (s && s.length > 0 && s[0] === '{') {
                self.#mitm_gamedata = s;
            } // Snatch the save json before it is encoded

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
            gameDataSetting.disable();

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
                            const saveData = JSON.parse(self.#mitm_atob_data) as PlayerData;
                            const { id: bestMatchId, score: highestScore } = self.#findBestMatchingAmbrosiaLoadout(saveData);

                            const SIMILARITY_THRESHOLD = 0.8;

                            if (bestMatchId && highestScore >= SIMILARITY_THRESHOLD) {
                                HSLogger.debug(` -> BEST MATCH: Loadout ${bestMatchId} is ${(highestScore * 100).toFixed(1)}% compliant.`, self.context);
                                if (ambrosiaModule) {
                                    // AWAIT the activation to ensure it completes before any other logic runs
                                    await ambrosiaModule.setActiveLoadout(parseInt(bestMatchId!), true);
                                }
                            } else if (bestMatchId) {
                                HSLogger.debug(`No compliant loadout found. Closest was ${bestMatchId} at ${(highestScore * 100).toFixed(1)}% (Threshold: 80%).`, self.context);
                            } else {
                                HSLogger.debug(`No saved loadouts found to match.`, self.context);
                            }
                        } catch (e) {
                            HSLogger.warn(`Failed to analyze save data for loadout restoration: ${e}`, self.context);
                        }
                    } else {
                        HSLogger.debug(`No captured save data (mitm_atob_data is empty).`, self.context);
                    }

                    if (!self.#wasUsingGDS) {
                        // Wait for game state to settle and cleanup to take effect, then restore OFF state
                        setTimeout(() => {
                            self.disableGDS();
                            HSLogger.debug("Cleanup done. GDS disabled (Restored state)", self.context);
                        }, 2000);
                    } else {
                        HSLogger.debug("GDS remained enabled (Restored state)", self.context);
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
                    const anyChallengeActive = challengeTargets
                        .map((t) => document.querySelector(`#${t}`)?.getAttribute('style')?.includes('orchid'))
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
                    gameDataSetting.disable();
                    /*
                    await HSUI.Notify('GDS temporarily disabled for Sing and will be re-enabled soon', {
                        position: 'topRight',
                        notificationType: 'warning'
                    });*/

                    await HSUtils.wait(4000);

                    const gdsSetting = HSSettings.getSetting('useGameData') as HSSetting<boolean>;

                    if (gdsSetting && this.#wasUsingGDS && !gdsSetting.isEnabled()) {
                        HSLogger.debug(`Re-enabled GDS`, this.context);
                        gdsSetting.enable();
                    } else {
                        HSLogger.debug(`GDS was already enabled (WoW fast!)`, this.context);
                    }

                    this.#wasUsingGDS = false;
                }
            }
        }
    }

    /**
     * Refreshes campaign token data from the DOM and updates campaign state.
     * @returns void
     */
    #refreshCampaignTokens() {
        HSLogger.debug(`Refreshing campaign data`, this.context);

        if (!this.#campaignTokenElement) {
            const el = document.querySelector('#campaignTokenCount') as HTMLHeadingElement;

            if (el) {
                this.#campaignTokenElement = el;
            } else {
                return;
            }
        }

        const TOKEN_EL = this.#campaignTokenElement;

        if (TOKEN_EL) {
            const match = TOKEN_EL.textContent?.match(/^You have (\d+) \/ (\d+) .+$/);

            if (match && match[1] && match[2]) {
                const leftValue = parseInt(match[1], 10);
                const rightValue = parseInt(match[2], 10);
                this.#campaignData.tokens = leftValue;
                this.#campaignData.maxTokens = rightValue;
                this.#campaignData.isAtMaxTokens = ((leftValue > 0 && rightValue > 0) && (leftValue === rightValue));
                this.#campaignDataUpdated();
            }
        }

        if (this.#campaignData.isAtMaxTokens && this.#campaignTokenRefreshInterval) {
            HSLogger.debug(`Dynamic clear of campaign token refresh interval, player is at max`, this.context);
            clearInterval(this.#campaignTokenRefreshInterval);
        }
    }


    // --- Subscription Management ---

    /**
     * Subscribes a callback to game data changes.
     * @param callback Function to call when game data changes.
     * @returns Subscription ID string or undefined.
     */
    subscribeGameDataChange(callback: (data: PlayerData) => void): string | undefined {
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


    // --- Ambrosia Loadouts Logic ---

    /**
     * Calculates the effective level of an Ambrosia upgrade based on invested amount and save data.
     * @param upgradeName Name of the Ambrosia upgrade.
     * @param invested Amount invested in the upgrade.
     * @param saveData Player save data.
     * @returns Calculated upgrade level as a number.
     */
    #calculateAmbUpgradeLevelFromSave(upgradeName: keyof AmbrosiaUpgrades, invested: number, saveData: PlayerData): number {
        if (!this.#gameDataAPI) return 0;

        const investmentParameters = ((this.#gameDataAPI.R_ambrosiaUpgradeCalculationCollection as AmbrosiaUpgradeCalculationCollection)[upgradeName]) as AmbrosiaUpgradeCalculationConfig<any>;
        if (!investmentParameters) return 0;

        // Calculate purchased levels only; free levels are handled separately.
        const level = this.#gameDataAPI.investToAmbrosiaUpgrade(
            0,
            invested,
            investmentParameters.costPerLevel,
            investmentParameters.maxLevel,
            investmentParameters.costFunction
        );
        return level;
    }

    /**
     * Finds the best matching saved Ambrosia loadout based on the player's current save data.
     * Compares upgrades and calculates a similarity score for each loadout.
     * Returns the loadout ID and score of the best match.
     * @param saveData Player save data.
     * @returns Object with best match loadout ID and similarity score.
     */
    #findBestMatchingAmbrosiaLoadout(saveData: PlayerData): { id: string | undefined, score: number } {
        const currentUpgrades = saveData.ambrosiaUpgrades;
        const savedLoadouts = saveData.blueberryLoadouts;

        if (!currentUpgrades || !savedLoadouts) {
            return { id: undefined, score: 0 };
        }

        let bestMatchId: string | undefined;
        let highestScore = 0;

        HSLogger.debug(`Analyzing save data... Found ${Object.keys(savedLoadouts).length} saved loadouts.`, this.context);

        for (const [loadoutId, loadoutDef] of Object.entries(savedLoadouts)) {
            if (!loadoutDef || Object.keys(loadoutDef).length === 0) continue;

            let matches = 0;
            let totalUpgrades = 0;
            const upgrades = Object.entries(loadoutDef);

            for (const [upgradeKey, savedLevel] of upgrades) {
                if (upgradeKey === 'ambrosiaTutorial' || upgradeKey === 'ambrosiaPatreon') continue;

                totalUpgrades++;

                const currentLevelData = currentUpgrades[upgradeKey as keyof AmbrosiaUpgrades] as AmbrosiaUpgradeData;
                const totalLevel = currentLevelData ? this.#calculateAmbUpgradeLevelFromSave(upgradeKey as keyof AmbrosiaUpgrades, currentLevelData.ambrosiaInvested, saveData) : 0;

                if (totalLevel === savedLevel) {
                    matches++;
                }
            }

            const score = totalUpgrades > 0 ? (matches / totalUpgrades) : 0;

            if (score > highestScore) {
                highestScore = score;
                bestMatchId = loadoutId;
            }

            if (score === 1) break;
        }

        return { id: bestMatchId, score: highestScore };
    }
    
    /**
     * Performs the initial loadout matching when the game is first loaded.
     * Sets the active loadout if a compliant match is found.
     * @returns void
     */
    #performInitialLoadoutMatch() {
        const ambrosiaModule = HSModuleManager.getModule<HSAmbrosia>('HSAmbrosia');
        if (ambrosiaModule && this.#saveData) {
            // Reset active loadout
            ambrosiaModule.resetActiveLoadout();

            const { id: bestMatchId, score: highestScore } = this.#findBestMatchingAmbrosiaLoadout(this.#saveData);

            const SIMILARITY_THRESHOLD = 0.8;

            if (bestMatchId && highestScore >= SIMILARITY_THRESHOLD) {
                HSLogger.debug(`Initial load - BEST MATCH: Loadout ${bestMatchId} is ${(highestScore * 100).toFixed(1)}% compliant.`, this.context);
                ambrosiaModule.setActiveLoadout(parseInt(bestMatchId!), true);
            } else if (bestMatchId) {
                HSLogger.debug(`Initial load - No compliant loadout found. Closest was ${bestMatchId} at ${(highestScore * 100).toFixed(1)}% (Threshold: 80%).`, this.context);
            } else {
                HSLogger.debug(`Initial load - No saved loadouts found to match.`, this.context);
            }
        }
    }
}
