import { MeData } from "../../../types/data-types/hs-me-data";
import { PlayerData } from "../../../types/data-types/hs-player-savedata";
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
import { GameEventResponse, GameEventType, ConsumableGameEvent, ConsumableGameEvents } from "../../../types/data-types/hs-event-data";
import { HSWebSocket } from "../hs-websocket";
import { HSModuleOptions } from "../../../types/hs-types";

export class HSGameData extends HSModule {
    #saveDataLocalStorageKey = 'Synergysave2';

    #saveDataCheckInterval?: number;

    #saveData?: PlayerData;

    // Turbo mode
    #turboEnabled = false;
    #manualSaveButton?: HTMLButtonElement;
    #saveinfoElement?: HTMLParagraphElement;

    #turboCSS = `
        #savegame {
            display: none !important;
        }

        #saveinfo {
            display: none !important;
        }
    `;

    #saveInterval?: number;

    #gameDataDebugElement?: HTMLDivElement;

    #gameDataSubscribers: Map<string, (data: PlayerData) => void> = new Map<string, (data: PlayerData) => void>();

    #singularityButton?: HTMLImageElement;
    #importSaveButton?: HTMLLabelElement;
    #singularityChallengeButtons?: HTMLDivElement[];
    #singularityEventHandler?: (e: MouseEvent) => Promise<void>;
    #loadFromFileEventHandler?: (e: MouseEvent) => Promise<void>;

    // These are not used
    #wasUsingGDS = false;

    #playerPseudoUpgrades?: PseudoGameData;
    #meBonuses?: MeData;

    #gameDataAPI?: HSGameDataAPI;
    #fetchedDataRefreshInterval?: number;

    #lastB64Save?: string;

    #campaignTokenElement?: HTMLHeadingElement;
    #campaignTokenRefreshInterval?: number;

    #campaignData: CampaignData = {
        tokens: 0,
        maxTokens: 0,
        isAtMaxTokens: false,
    }

    #gameEvents: ConsumableGameEvents = {
        HAPPY_HOUR_BELL: {
            amount: 0,
            ends: [],
            displayName: "Happy Hour Bell",
        },
    };

    #btoaHacked = false;
    #mitm_gamedata?: string;

    #saveTriggerEvent: Event;

    #lastForceFetch = 0;
    #ForceFetchCooldown = 5000;

    constructor(moduleOptions: HSModuleOptions) {
        super(moduleOptions);
        this.#campaignTokenElement = document.querySelector('#campaignTokenCount') as HTMLHeadingElement;

        this.#saveTriggerEvent = new Event('click');
    }

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
            HSLogger.error(`Could not fetch pseudo data`, this.context);
        }

        try {
            const meQuery = await fetch(HSGlobal.Common.meAPIurl);
            const data = await meQuery.json() as MeData;

            this.#meBonuses = data;
            this.#meDataUpdated();
        } catch (err) {
            HSLogger.error(`Could not fetch me data`, this.context);
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

    async forceUpdateAllData() {
        const now = Date.now();

        if (now - this.#lastForceFetch < this.#ForceFetchCooldown) {
            HSLogger.warn("Forced data refresh on cooldown", this.context);
            return;
        }

        this.#lastForceFetch = now;

        await this.#refreshFetchedData();
        await this.#refreshCampaignTokens();
        await this.#refreshFetchedData();
        this.#hackJSNativebtoa();

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

    #registerWebSocket() {
        const self = this;
        const wsMod = HSModuleManager.getModule<HSWebSocket>('HSWebSocket');

        if (wsMod) {
            wsMod.registerWebSocket<GameEventResponse>('consumable-event-socket', {
                url: HSGlobal.Common.eventAPIUrl,
                onMessage: async (msg) => {
                    if (msg?.type === GameEventType.INFO_ALL) {
                        self.#resetEventData();

                        if (msg.active && msg.active.length > 0) {
                            HSLogger.debug(`Caught WS event: ${msg.type} - event count: ${msg.active.length}}`, 'WebSocket');

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
                    } else if (msg?.type === GameEventType.ERROR) {
                        HSLogger.debug(`Caught ERROR`, this.context);
                        self.#resetEventData();
                    } else if (msg?.type === GameEventType.EVENT_ENDED) {
                        HSLogger.debug(`Caught EVENT_ENDED`, this.context);
                        const consumable = self.#gameEvents[msg?.consumable as keyof ConsumableGameEvents];
                        consumable.ends.shift();
                        consumable.amount--;
                        self.#eventDataUpdated();
                    } else if (msg?.type === GameEventType.JOIN) {
                        HSLogger.debug(`Caught JOIN (connection established)`, this.context);
                    }

                },

                onRetriesFailed: async () => {
                    self.#resetEventData();
                    self.#eventDataUpdated();
                }
            })
        }
    }

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

    async #refreshFetchedData() {
        HSLogger.debug(`Refreshing fetched data`, this.context);

        try {
            const upgradesQuery = await fetch('https://synergism.cc/stripe/upgrades');
            const data = await upgradesQuery.json() as PseudoGameData;

            this.#playerPseudoUpgrades = data;
            this.#pseudoDataUpdated();
        } catch (err) {
            HSLogger.error(`Could not fetch pseudo data`, this.context);
        }

        try {
            const meQuery = await fetch('https://synergism.cc/api/v1/users/me');
            const data = await meQuery.json() as MeData;

            this.#meBonuses = data;
            this.#meDataUpdated();
        } catch (err) {
            HSLogger.error(`Could not fetch me data`, this.context);
        }
    }

    #processSaveDataWithRAF() {
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

        requestAnimationFrame(this.#processSaveDataWithRAF.bind(this));
    }

    #processSaveDataWithRAFExperimental() {
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

        requestAnimationFrame(this.#processSaveDataWithRAFExperimental.bind(this));
    }

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
            this.#processSaveDataWithRAFExperimental();
        } else {
            this.#processSaveDataWithRAF();
        }
    }

    #hackJSNativebtoa() {
        if (this.#btoaHacked)
            return;

        const self = this;

        // Store ref to native btoa
        const _btoa = window.btoa;

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

    async #loadFromFileHandler(e: MouseEvent) {
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

        const watcherId = HSElementHooker.watchElement(offlineContainer, (viewState: { view: string, state: string }) => {
            if (viewState.state !== 'none') {
                HSLogger.log("Offline container visible - Save loaded (GDS)", self.context);

                // Flash GDS Strategy:
                // To ensure cleanup works reliably, we temporarily enable GDS (if it was off).
                // This forces all UI components to initialize and be hookable/cleanable.

                const ambrosiaModule = HSModuleManager.getModule<HSAmbrosia>('HSAmbrosia');

                if (self.#wasUsingGDS) {
                    // User had GDS ON. Just turn it back on and clean.
                    HSLogger.debug("Restoring GDS state (ON)...", self.context);
                    self.enableGDS();
                    if (ambrosiaModule) ambrosiaModule.resetActiveLoadout();
                } else {
                    // User had GDS OFF. We must "Flash" it ON to clean up, then turn OFF.
                    HSLogger.debug("Flashing GDS for cleanup...", self.context);
                    self.enableGDS();

                    // Clean
                    if (ambrosiaModule) ambrosiaModule.resetActiveLoadout();

                    // Wait for game state to settle and cleanup to take effect, then restore OFF state
                    setTimeout(() => {
                        self.disableGDS();
                        HSLogger.debug("Cleanup done. GDS disabled (Restored state)", self.context);
                    }, 2000);
                }

                // Stop watching offline container
                setTimeout(() => {
                    if (watcherId && !watcherStopped) {
                        HSElementHooker.stopWatching(watcherId);
                        watcherStopped = true;
                    }
                }, 1000);

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
            }, 1000);
            window.removeEventListener('focus', focusHandler);
        };
        window.addEventListener('focus', focusHandler);
    }


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

    subscribeGameDataChange(callback: (data: PlayerData) => void): string | undefined {
        const id = HSUtils.uuidv4();
        this.#gameDataSubscribers.set(id, callback);
        return id;
    }

    unsubscribeGameDataChange(id: string) {
        if (this.#gameDataSubscribers.has(id)) {
            this.#gameDataSubscribers.delete(id);
        } else {
            HSLogger.warn(`Could not unsubscribe from game data change. ID ${id} not found`, this.context);
        }
    }

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
    }

    #pseudoDataUpdated() {
        if (this.#gameDataAPI && this.#playerPseudoUpgrades) {
            this.#gameDataAPI._updatePseudoData(this.#playerPseudoUpgrades);
        }
    }

    #meDataUpdated() {
        if (this.#gameDataAPI && this.#meBonuses) {
            this.#gameDataAPI._updateMeData(this.#meBonuses);
        }
    }

    #campaignDataUpdated() {
        if (this.#gameDataAPI && this.#campaignData) {
            this.#gameDataAPI._updateCampaignData(this.#campaignData);
        }
    }

    #eventDataUpdated() {
        if (this.#gameDataAPI && this.#gameEvents) {
            this.#gameDataAPI._updateEventData(this.#gameEvents);
        }
    }

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
            const match = TOKEN_EL.innerText.match(/^You have (\d+) \/ (\d+) .+$/);

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
}