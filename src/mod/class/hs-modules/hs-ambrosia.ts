import { HSGameDataSubscriber, HSModuleOptions, HSPersistable } from "../../types/hs-types";
import { AmbrosiaUpgradeCalculationCollection, AmbrosiaUpgradeCalculationConfig } from "../../types/data-types/hs-gamedata-api-types";
import { AmbrosiaUpgradeData, AmbrosiaUpgrades, GameData } from "../../types/data-types/hs-player-savedata";
import { AMBROSIA_LOADOUT_SLOT } from "../../types/module-types/hs-ambrosia-types";
import { MAIN_VIEW, SINGULARITY_VIEW } from "../../types/module-types/hs-gamestate-types";
import { HSElementHooker } from "../hs-core/hs-elementhooker";
import { HSGameData } from "../hs-core/gds/hs-gamedata";
import { HSGameState } from "../hs-core/hs-gamestate";
import { HSGlobal } from "../hs-core/hs-global";
import { HSQuickbarManager } from "./hs-qolQuickbarManager";
import { HSAmbrosiaQuickbar } from "./hs-ambrosiaQuickbar";
import { HSLogger } from "../hs-core/hs-logger";
import { HSModule } from "../hs-core/module/hs-module";
import { HSModuleManager } from "../hs-core/module/hs-module-manager";
import { HSSelectStringSetting, HSSetting } from "../hs-core/settings/hs-setting";
import { HSSettings } from "../hs-core/settings/hs-settings";
import { HSSettingsUI } from "../hs-core/settings/hs-settings-ui";
import { HSStorage } from "../hs-core/hs-storage";
import { HSUI } from "../hs-core/hs-ui";
import { HSUtils } from "../hs-utils/hs-utils";
import { HSGameDataAPI } from "../hs-core/gds/hs-gamedata-api";
import { HSAmbrosiaHelper } from "./hs-ambrosiaHelper";
import { HSSettingsDefinition } from "../../types/module-types/hs-settings-types";
import minibarCSS from "inline:../../resource/css/module/hs-ambrosia-minibars.css";

/**
 * Class: HSAmbrosia
 * IsExplicitHSModule: Yes
 * Description: Hypersynergism module which manages ambrosia loadouts and quickbar interactions.
 * Author: Swiffy
 */
export class HSAmbrosia extends HSModule
    implements HSPersistable, HSGameDataSubscriber {

    gameDataSubscriptionId?: string;
    #ambrosiaViewSubscriptionId?: string;

    #loadoutsSlots: HTMLElement[] = [];

    #loadoutContainer: HTMLElement | null = null;
    #blueberryUpgradeContainer: HTMLElement | null = null;
    #pageHeader: HTMLElement | null = null;

    #addCodeButton: HTMLButtonElement | null = null;
    #addCodeAllButton: HTMLButtonElement | null = null;
    #addCodeOneButton: HTMLButtonElement | null = null;
    #timeCodeButton: HTMLButtonElement | null = null;
    #importBlueberriesButton: HTMLButtonElement | null = null;
    #importBlueberriesInput: HTMLInputElement | null = null;
    #blueberryToggleModeButton: HTMLButtonElement | null = null;
    #persistentAmbrosiaLevelsToggleButton: HTMLButtonElement | null = null;
    #loadoutContainerClickHandler?: (e: MouseEvent) => Promise<void>;
    #isLoadoutClickHandlerAttached = false;
    #persistentAmbrosiaLevelsToggleHandler?: (event: Event) => void;
    #isAmbrosiaTabActive = false;
    #state = {
        persistentAmbrosiaLevelsDisplayEnabled: true
    };
    #debugElement?: HTMLDivElement;

    activeLoadout?: AMBROSIA_LOADOUT_SLOT;

    public quickbar: HSAmbrosiaQuickbar;

    #cachedGameDataAPI?: HSGameDataAPI;
    #cachedGameDataMod?: HSGameData;

    #cachedIdleSwapOcteractSetting?: HSSelectStringSetting;
    #cachedIdleSwapNormalLuckSetting?: HSSelectStringSetting;
    #cachedIdleSwapRedLuckSetting?: HSSelectStringSetting;
    #cachedIdleSwapOcteractLoadoutValue?: string;
    #cachedIdleSwapNormalLuckLoadoutValue?: string;
    #cachedIdleSwapRedLuckLoadoutValue?: string;
    #cachedIdleSwapOcteractLoadout?: string;
    #cachedIdleSwapNormalLuckLoadout?: string;
    #cachedIdleSwapRedLuckLoadout?: string;
    #cachedIdleSwapLoadoutButtons: Map<string, HTMLButtonElement> = new Map();

    #_delegateAddHandler?: (e: Event) => Promise<void>;
    #_delegateTimeHandler?: (e: Event) => Promise<void>;

    #isIdleSwapEnabled = false;
    #isIdleSwapActive = false;
    #blueAmbrosiaProgressBar?: HTMLDivElement;
    #redAmbrosiaProgressBar?: HTMLDivElement;
    #holdBlueLuckUntilReset = false;
    #lastBlueBarValue?: number;
    #cachedNormalLuckBlueBarRequired?: number;
    #cachedNormalLuckLoadoutValue?: string;

    #berryMinibarsEnabled = false;
    #blueProgressMinibarElement?: HTMLDivElement;
    #redProgressMinibarElement?: HTMLDivElement;

    #hasPerformedInitialLoadoutMatch = false;

    #quickbarCSSId = 'hs-ambrosia-quickbar-css';
    #idleLoadoutCSSId = 'hs-ambrosia-idle-loadout-css';
    #minibarCSSId = 'hs-ambrosia-minibar-css';
    #quickbarCSS = `
        #${HSGlobal.HSAmbrosia.quickBarId} > .blueberryLoadoutSlot:hover {
            filter: brightness(150%);
        }
    `;
    #idleLoadoutCSS = `
        #hs-ambrosia-loadout-idle-swap-indicator {
            margin-bottom: 10px;
            font-family: fantasy;
            letter-spacing: 3px;
            background: linear-gradient(to right, #774ed1 20%, #00affa 30%, #0190cd 70%, #774ed1 80%);
            -webkit-background-clip: text;
            background-clip: text;
            -webkit-text-fill-color: transparent;
            background-size: 500% auto;
            animation: hs-loadout-ind-glow 3.5s ease-in-out infinite alternate;
        }
        @keyframes hs-loadout-ind-glow {
            0% {
                background-position: 0% 50%;
            }
            100% {
                background-position: 100% 50%;
            }
        }
        @-webkit-keyframes hs-loadout-ind-glow {
            0% {
                background-position: 0% 50%;
            }
            100% {
                background-position: 100% 50%;
            }
        }
    `;


    // ==============================================
    // -------------------- Init --------------------
    // ==============================================

    constructor(moduleOptions: HSModuleOptions) {
        super(moduleOptions);
        this.quickbar = new HSAmbrosiaQuickbar(this);
    }

    async init() {
        HSLogger.log(`Initializing HSAmbrosia module`, this.context);

        await this.#cacheDomRefs();
        this.#attachLoadoutClickHandler();

        await this.loadState();

        await this.quickbar.init();

        await this.#createPersistentMinibars();

        await this.#injectImportFromClipboardButton();

        this.#subscribeGameStateViewChanges();

        HSSettingsUI.refreshAmbrosiaLoadoutDropdowns();
        this.isInitialized = true;
    }

    async #cacheDomRefs() {
        const [loadoutsSlots, loadoutContainer, blueberryUpgradeContainer, pageHeader, addCodeButton, addCodeAllButton, addCodeOneButton, timeCodeButton, importBlueberriesButton, importBlueberriesInput, blueberryToggleModeButton] = await Promise.all([
            HSElementHooker.HookElements('.blueberryLoadoutSlot'),
            HSElementHooker.HookElement('#bbLoadoutContainer'),
            HSElementHooker.HookElement('#blueberryUpgradeContainer'),
            HSElementHooker.HookElement('header'),
            HSElementHooker.HookElement('#addCode'),
            HSElementHooker.HookElement('#addCodeAll'),
            HSElementHooker.HookElement('#addCodeOne'),
            HSElementHooker.HookElement('#timeCode'),
            HSElementHooker.HookElement('#importBlueberriesButton'),
            HSElementHooker.HookElement('#importBlueberries'),
            HSElementHooker.HookElement('#blueberryToggleMode')
        ]);

        this.#loadoutsSlots = loadoutsSlots;
        this.#loadoutContainer = loadoutContainer;
        this.#blueberryUpgradeContainer = blueberryUpgradeContainer;
        this.#pageHeader = pageHeader;
        this.#addCodeButton = addCodeButton as HTMLButtonElement;
        this.#addCodeAllButton = addCodeAllButton as HTMLButtonElement;
        this.#addCodeOneButton = addCodeOneButton as HTMLButtonElement;
        this.#timeCodeButton = timeCodeButton as HTMLButtonElement;
        this.#importBlueberriesButton = importBlueberriesButton as HTMLButtonElement;
        this.#importBlueberriesInput = importBlueberriesInput as HTMLInputElement;
        this.#blueberryToggleModeButton = blueberryToggleModeButton as HTMLButtonElement;
    }

    public async initializeActiveLoadoutFromGameData(): Promise<void> {
        const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        if (!gameDataAPI) return;
        let gameData = gameDataAPI.getGameData();
        if (!gameData) gameData = await gameDataAPI.getForcedGameData();
        if (!gameData) { HSLogger.warn('Could not retrieve game data to perform the initial ambrosia loadout match', this.context); return; }

        await this.#performInitialActiveLoadoutMatchOnce(gameData);
    }

    async #ensureAmbrosiaSection(): Promise<HTMLElement | null> {
        await HSQuickbarManager.getInstance().whenSectionInjected('ambrosia');
        const section = HSQuickbarManager.getInstance().getSection('ambrosia');
        return section ?? null;
    }


    // ==============================================
    // --------------- Loadout Events ---------------
    // ==============================================

    #attachAmbrosiaTabEvents() {
        if (this.#loadoutContainer) {
            this.#attachLoadoutClickHandler();
        }

        void this.#hookPersistentAmbrosiaLevelsToggleButton();
    }

    #detachAmbrosiaTabEvents() {
        // The loadout click handler stays attached even when the Ambrosia tab is hidden.
        // Persistent quickbar clicks rely on the original loadout click event to update active loadout state.

        if (this.#persistentAmbrosiaLevelsToggleButton && this.#persistentAmbrosiaLevelsToggleHandler) {
            this.#persistentAmbrosiaLevelsToggleButton.removeEventListener('click', this.#persistentAmbrosiaLevelsToggleHandler);
        }
    }

    #attachLoadoutClickHandler() {
        if (!this.#loadoutContainer || this.#isLoadoutClickHandlerAttached) return;

        this.#loadoutContainerClickHandler ??= this.#onLoadoutClick.bind(this);
        const handler = this.#loadoutContainerClickHandler;
        this.#loadoutContainer.delegateEventListener('click', '.blueberryLoadoutSlot', handler);
        this.#isLoadoutClickHandlerAttached = true;
    }

    async #onLoadoutClick(e: MouseEvent) {
        const slotElement = (e.target as HTMLElement).closest('.blueberryLoadoutSlot') as HTMLButtonElement | null;
        if (!slotElement) return;

        const slotElementId = slotElement.id;
        const slotEnum = HSAmbrosiaHelper.getSlotEnumBySlotId(slotElementId);
        if (!slotEnum) {
            HSLogger.warn(`No slot enum found for slot ID: ${slotElementId}`, this.context);
            return;
        }

        this.updateActiveLoadout(slotEnum);
    }


    // ==============================================
    // ---- Ambrosia Quickbar (UI, events, sync) ----
    // ==============================================

    getLoadoutContainer(): HTMLElement | null {
        return this.#loadoutContainer;
    }

    getPageHeader(): HTMLElement | null {
        return this.#pageHeader;
    }

    getQuickbarCSS(): string {
        return this.#quickbarCSS;
    }

    getQuickbarCSSId(): string {
        return this.#quickbarCSSId;
    }

    refreshActiveLoadoutFromState() {
        const resolvedCurrent = HSAmbrosiaHelper.resolveAmbrosiaLoadout(this.activeLoadout);
        if (resolvedCurrent) {
            this.updateActiveLoadout(resolvedCurrent);
        }
    }

    updateQuickBar() {
        this.quickbar.updateQuickBar();
    }

    async showQuickBar() {
        await this.quickbar.showQuickBar();
    }

    async hideQuickBar() {
        await this.quickbar.hideQuickBar();
    }

    // Never used, and not really any need for it since we want HSAmbrosia basically always ON
    async destroy() {
        await this.quickbar.destroy();
        await this.disableBerryMinibars();
        this.unsubscribeGameDataChanges();
        this.#unsubscribeGameStateViewChanges();

        // Remove style tokens
        HSUI.removeInjectedStyle(this.#minibarCSSId);
        HSUI.removeInjectedStyle(this.#idleLoadoutCSSId);

        this.isInitialized = false;
        this.activeLoadout = undefined;
    }


    // ==============================================
    // -------- Ambrosia Minibars (Quickbar) --------
    // ==============================================

    async enableBerryMinibars() {
        await HSQuickbarManager.getInstance().whenSectionInjected('ambrosia');
        const groupWrapper = HSQuickbarManager.getInstance().getSection('ambrosia');
        if (!groupWrapper) {
            HSLogger.warn('Could not find group wrapper for minibars', this.context);
            return;
        }
        const barWrapper = groupWrapper.querySelector(`#${HSGlobal.HSAmbrosia.barWrapperId}`) as HTMLElement;
        if (barWrapper) {
            barWrapper.style.display = 'block';
            HSUI.injectStyle(minibarCSS, this.#minibarCSSId);
            this.subscribeGameDataChanges();
            this.#berryMinibarsEnabled = true;

            // Restore automation/corruption summary headers when minibars quickbar is enabled.
            HSAmbrosiaHelper.setQuickbarTopTextVisibility(true);
        } else {
            HSLogger.warn('Could not find minibar wrapper', this.context);
        }
    }

    async disableBerryMinibars() {
        await HSQuickbarManager.getInstance().whenSectionInjected('ambrosia');
        const groupWrapper = HSQuickbarManager.getInstance().getSection('ambrosia');
        if (!groupWrapper) {
            HSLogger.warn('Could not find group wrapper for minibars', this.context);
            return;
        }
        const barWrapper = groupWrapper.querySelector(`#${HSGlobal.HSAmbrosia.barWrapperId}`) as HTMLElement;
        if (barWrapper) {
            barWrapper.style.display = 'none';
            HSUI.removeInjectedStyle(this.#minibarCSSId);
        } else {
            HSLogger.warn('Could not find bar wrapper element', this.context);
        }

        // Hide automation/corruption summary headers when minibars quickbar is disabled.
        HSAmbrosiaHelper.setQuickbarTopTextVisibility(false);

        this.#berryMinibarsEnabled = false;
        this.unsubscribeGameDataChanges();
    }

    async #createPersistentMinibars() {
        if (!this.#pageHeader) return;

        // Check if already exists
        const quickbarsRow = HSQuickbarManager.ensureQuickbarsRow();
        let groupWrapper = quickbarsRow.querySelector('#hs-ambrosia-group-wrapper') as HTMLElement;
        if (!groupWrapper) {
            groupWrapper = document.createElement('div');
            groupWrapper.id = 'hs-ambrosia-group-wrapper';
            groupWrapper.className = 'hs-quickbar';
            groupWrapper.style.display = 'flex';
            groupWrapper.style.flexDirection = 'column';
            groupWrapper.style.justifyContent = "flex-end";
            quickbarsRow.appendChild(groupWrapper);
        }
        // Move to last child if not already
        if (quickbarsRow.lastChild !== groupWrapper) {
            quickbarsRow.appendChild(groupWrapper);
        }

        // Check if minibarWrapper already exists
        if (groupWrapper.querySelector(`#${HSGlobal.HSAmbrosia.barWrapperId}`)) {
            HSLogger.debug(() => 'Minibar wrapper already exists in group wrapper', this.context);
            return;
        }

        // Blue bar
        const blueBarOriginal = await HSElementHooker.HookElement('#ambrosiaProgressBar');
        const blueBarClone = blueBarOriginal.cloneNode(true) as HTMLDivElement;
        const blueBarProgress = blueBarClone.querySelector('#ambrosiaProgress') as HTMLDivElement;
        const blueBarProgressText = blueBarClone.querySelector('#ambrosiaProgressText') as HTMLDivElement;

        blueBarClone.id = HSGlobal.HSAmbrosia.blueBarId;
        blueBarProgress.id = HSGlobal.HSAmbrosia.blueBarProgressId;
        blueBarProgressText.id = HSGlobal.HSAmbrosia.blueBarProgressTextId;

        // Red bar
        const redBarOriginal = await HSElementHooker.HookElement('#pixelProgressBar');
        const redBarClone = redBarOriginal.cloneNode(true) as HTMLDivElement;
        const redBarProgress = redBarClone.querySelector('#pixelProgress') as HTMLDivElement;
        const redBarProgressText = redBarClone.querySelector('#pixelProgressText') as HTMLDivElement;

        redBarClone.id = HSGlobal.HSAmbrosia.redBarId;
        redBarProgress.id = HSGlobal.HSAmbrosia.redBarProgressId;
        redBarProgressText.id = HSGlobal.HSAmbrosia.redBarProgressTextId;

        // Wrapper for both
        const minibarWrapper = document.createElement('div') as HTMLDivElement;
        minibarWrapper.id = HSGlobal.HSAmbrosia.barWrapperId;
        minibarWrapper.style.display = 'none';
        minibarWrapper.appendChild(blueBarClone);
        minibarWrapper.appendChild(redBarClone);

        // Append minibarWrapper as first child of groupWrapper
        if (groupWrapper.firstChild) {
            groupWrapper.insertBefore(minibarWrapper, groupWrapper.firstChild);
        } else {
            groupWrapper.appendChild(minibarWrapper);
        }

        this.#blueProgressMinibarElement = blueBarProgress;
        this.#redProgressMinibarElement = redBarProgress;
    }


    // ==============================================
    // ------------ Active Loadout State ------------
    // ==============================================

    async resetActiveLoadout() {
        // Ensure quickbar section is injected before manipulating DOM
        await this.#ensureAmbrosiaSection();
        this.activeLoadout = undefined;

        // Clear visual state from both containers
        const containers = [
            this.#pageHeader?.querySelector(`#${HSGlobal.HSAmbrosia.quickBarId}`),
            this.#loadoutContainer,
            document.querySelector('#hs-ambrosia-slots-wrapper') // Just in case
        ];

        containers.forEach(container => {
            if (container) {
                container.querySelectorAll('.hs-rainbow-border').forEach(slot => {
                    slot.classList.remove('hs-rainbow-border');
                });
            }
        });
    }

    updateActiveLoadout(slotEnum?: AMBROSIA_LOADOUT_SLOT) {
        if (!slotEnum) { HSLogger.warn('No slot specified to #updateActiveLoadout', this.context); return; }

        // Normalize & validate incoming slot value using helper.
        const resolvedSlot = HSAmbrosiaHelper.resolveAmbrosiaLoadout(slotEnum);
        if (!resolvedSlot) { HSLogger.warn('Invalid or unknown slot passed to #updateActiveLoadout: ' + slotEnum, this.context); return; }

        this.activeLoadout = resolvedSlot as AMBROSIA_LOADOUT_SLOT;

        const isInjected = HSQuickbarManager.getInstance().isInjected("ambrosia");
        if (!isInjected) { HSLogger.warn("updateActiveLoadout() fail: quickbar not injected", this.context); return; }

        const slotNumber = HSAmbrosiaHelper.getLoadoutNumberFromSlot(resolvedSlot);
        if (!slotNumber) { HSLogger.warn('Could not parse loadout number from resolvedSlot:' + resolvedSlot, this.context); return; }

        this.quickbar.syncActiveSlot(slotNumber);

        HSLogger.debug(() => 'Switched Ambrosia loadout to ' + resolvedSlot, this.context);
    }

    private calculateAmbUpgradeLevelFromSave(upgradeName: keyof AmbrosiaUpgrades, invested: number): number {
        const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        if (!gameDataAPI) return 0;

        const investmentParameters = ((gameDataAPI.ambrosia.ambrosiaUpgradeCalculationCollection as AmbrosiaUpgradeCalculationCollection)[upgradeName]) as AmbrosiaUpgradeCalculationConfig<any>;
        if (!investmentParameters) return 0;

        return gameDataAPI.ambrosia.investToAmbrosiaUpgrade(
            0,
            invested,
            investmentParameters.costPerLevel,
            investmentParameters.maxLevel,
            investmentParameters.costFormula
        );
    }

    private calculateBlueBarRequirementForLoadout(saveData: GameData, loadoutNumber: number): number | undefined {
        const loadout = saveData.blueberryLoadouts?.[loadoutNumber];
        if (!loadout || Object.keys(loadout).length === 0) return;

        const brickLevel = (loadout as Record<string, number>).ambrosiaBrickOfLead ?? 0;

        let val = HSGlobal.HSAmbrosia.TIME_PER_AMBROSIA;
        val += Math.floor(saveData.lifetimeAmbrosia / 300);

        const exalt5Comps = saveData.singularityChallenges.noAmbrosiaUpgrades.completions;
        const acceleratorMult = 1 - 0.006 * exalt5Comps * saveData.shopUpgrades.shopAmbrosiaAccelerator;
        const brickOfLeadMult = 1 / (1 - brickLevel / 50);

        val *= acceleratorMult;
        val *= brickOfLeadMult;

        if (saveData.lifetimeAmbrosia >= 10000) {
            const extraScalingPower = Math.log10(4);
            val *= Math.pow(saveData.lifetimeAmbrosia / 10000, extraScalingPower);
            return Math.ceil(val);
        }

        return val;
    }

    public findBestMatchingAmbrosiaLoadout(saveData: GameData): { id: string | undefined; score: number } {
        const currentUpgrades = saveData.ambrosiaUpgrades;
        const savedLoadouts = saveData.blueberryLoadouts;

        if (!currentUpgrades || !savedLoadouts) {
            return { id: undefined, score: 0 };
        }

        let bestMatchId: string | undefined;
        let highestScore = 0;

        HSLogger.debug(() => `Analyzing save data... Found ${Object.keys(savedLoadouts).length} saved loadouts.`, this.context);

        for (const [loadoutId, loadoutDef] of Object.entries(savedLoadouts)) {
            if (!loadoutDef || Object.keys(loadoutDef).length === 0) continue;

            let matches = 0;
            let totalUpgrades = 0;
            const upgrades = Object.entries(loadoutDef);

            for (const [upgradeKey, savedLevel] of upgrades) {
                if (upgradeKey === 'ambrosiaTutorial' || upgradeKey === 'ambrosiaPatreon') continue;

                totalUpgrades++;

                const currentLevelData = currentUpgrades[upgradeKey as keyof AmbrosiaUpgrades] as AmbrosiaUpgradeData;
                const totalLevel = currentLevelData ? this.calculateAmbUpgradeLevelFromSave(upgradeKey as keyof AmbrosiaUpgrades, currentLevelData.ambrosiaInvested) : 0;

                if (totalLevel === savedLevel) {
                    matches++;
                }
            }

            const score = totalUpgrades > 0 ? matches / totalUpgrades : 0;

            if (score > highestScore) {
                highestScore = score;
                bestMatchId = loadoutId;
            }

            if (score === 1) {
                break;
            }
        }

        return { id: bestMatchId, score: highestScore };
    }

    public async performInitialActiveLoadoutMatch(saveData: GameData): Promise<void> {
        if (!saveData) return;

        await this.resetActiveLoadout();
        const { id: bestMatchId, score: highestScore } = this.findBestMatchingAmbrosiaLoadout(saveData);
        const SIMILARITY_THRESHOLD = 0.8;

        if (bestMatchId && highestScore >= SIMILARITY_THRESHOLD) {
            // Ensure quickbar section is injected before manipulating DOM
            await HSQuickbarManager.getInstance().whenSectionInjected('ambrosia');

            const slotNumber = parseInt(bestMatchId, 10);
            const slotId = `blueberryLoadout${slotNumber}`;
            const slotElement = this.#loadoutsSlots.find(slot => slot.id === slotId);
            if (!slotElement) { HSLogger.warn(`Invalid loadout slot: ${slotNumber}`, this.context); return; }
            const slotEnum = HSAmbrosiaHelper.getSlotEnumBySlotId(slotId);
            if (!slotEnum) { HSLogger.warn(`No slot enum found for slot ID: ${slotId}`, this.context); return; }

            this.updateActiveLoadout(slotEnum);

            HSLogger.debug(() => `Initial load - Ambrosia loadout best match: ${bestMatchId} is ${(highestScore * 100).toFixed(1)}% compliant. `, this.context);
        } else if (bestMatchId) {
            HSLogger.debug(() => `Initial load - No compliant Ambrosia loadout found. Closest was ${bestMatchId} at ${(highestScore * 100).toFixed(1)}% (Threshold: 80%).`, this.context);
        } else {
            HSLogger.debug(() => `Initial load - No saved Ambrosia loadouts found to match.`, this.context);
        }
    }

    public getAmbrosiaLoadoutsAmount(): number {
        return this.#loadoutsSlots.filter((slot) => slot.style.display !== 'none').length;
    }

    // ==============================================
    // ------- Add/Time Auto Loadout Behavior -------
    // ==============================================

    async enableAutoLoadout() {

        // Use module canonical state instead of the removed setting.
        if (!this.activeLoadout) {
            const autoLoadoutsSetting = HSSettings.getSetting('addTimeAutoLoadouts') as HSSetting<boolean>;

            if (autoLoadoutsSetting && autoLoadoutsSetting.isEnabled()) {
                autoLoadoutsSetting.disable();
            }

            HSLogger.warn(`Could not enable auto loadout - current loadout state is not known!`, this.context);
            return;
        }

        await HSAmbrosiaHelper.cacheBlueberryToggleModeButton();

        const addCodeBtn = this.#addCodeButton;
        const addCodeAllBtn = this.#addCodeAllButton;
        const addCodeOneBtn = this.#addCodeOneButton;
        const timeButton = this.#timeCodeButton;

        if (!addCodeBtn || !addCodeAllBtn || !addCodeOneBtn || !timeButton) {
            HSLogger.warn(`Problem with enabling auto loadout`, this.context);
            return;
        }

        if (!this.#_delegateAddHandler) {
            this.#_delegateAddHandler = async (e: Event) => { await this.#addCodeButtonHandler(e); };
        }

        if (!this.#_delegateTimeHandler) {
            this.#_delegateTimeHandler = async (e: Event) => { await this.#timeCodeButtonHandler(e); };
        }

        addCodeBtn.removeEventListener('click', this.#_delegateAddHandler, { capture: true });
        addCodeBtn.addEventListener('click', this.#_delegateAddHandler, { capture: true });

        addCodeAllBtn.removeEventListener('click', this.#_delegateAddHandler, { capture: true });
        addCodeAllBtn.addEventListener('click', this.#_delegateAddHandler, { capture: true });

        addCodeOneBtn.removeEventListener('click', this.#_delegateAddHandler, { capture: true });
        addCodeOneBtn.addEventListener('click', this.#_delegateAddHandler, { capture: true });

        timeButton.removeEventListener('click', this.#_delegateTimeHandler, { capture: true });
        timeButton.addEventListener('click', this.#_delegateTimeHandler, { capture: true });

        HSLogger.log(`Enabled auto loadout`, this.context);
    }

    async disableAutoLoadout() {
        const addCodeBtn = this.#addCodeButton;
        const addCodeAllBtn = this.#addCodeAllButton;
        const addCodeOneBtn = this.#addCodeOneButton;
        const timeButton = this.#timeCodeButton;

        if (!addCodeBtn || !addCodeAllBtn || !addCodeOneBtn || !timeButton) {
            HSLogger.warn(`Problem with disabling auto loadout`, this.context);
            return;
        }

        if (this.#_delegateAddHandler) {
            addCodeBtn.removeEventListener('click', this.#_delegateAddHandler, { capture: true });
            addCodeAllBtn.removeEventListener('click', this.#_delegateAddHandler, { capture: true });
            addCodeOneBtn.removeEventListener('click', this.#_delegateAddHandler, { capture: true });
        }

        if (this.#_delegateTimeHandler)
            timeButton.removeEventListener('click', this.#_delegateTimeHandler, { capture: true });

        HSLogger.log(`Disabled auto loadout`, this.context);
    }

    async #addCodeButtonHandler(e: Event) {
        // const originalLoadout = this.activeLoadout;
        // const originalLoadoutBtn = this.quickbar.getClonedButtonRef(originalLoadout);
        const addLoadoutSetting = HSSettings.getSetting('autoLoadoutAdd') as HSSelectStringSetting;

        if (addLoadoutSetting) {
            const addLoadout = HSAmbrosiaHelper.convertSettingLoadoutToSlot(addLoadoutSetting.getValue());
            const addLoadoutBtn = this.quickbar.getClonedButtonRef(addLoadout);
            if (!addLoadout || !addLoadoutBtn) { HSLogger.warn('Invalid autoLoadoutAdd setting - cannot resolve addLoadout or loadoutSlot', this.context); return; }

            HSAmbrosiaHelper.ensureLoadoutMode('LOAD');

            // We DON'T want any await before that...
            // This calls hiddenAction via the quickbar click which kills all popups except Prompts
            // (so 'Add All' and 'Add x1' will be taken care of. And 'Add'/'Add x10' will have the Prompt remaining, and 'Add x10' will handle his own Prompt)
            // hiddenAction will trigger the loadout switch, then awaits a bit, which will let the game take back control,
            // the game will handle the loadout switch first, then finally be able to handle the Add click
            addLoadoutBtn.click();
        }
    }

    async #timeCodeButtonHandler(e: Event) {
        // const originalLoadout = this.activeLoadout;
        // const originalLoadoutBtn = this.quickbar.getClonedButtonRef(originalLoadout);
        const timeLoadoutSetting = HSSettings.getSetting('autoLoadoutTime') as HSSelectStringSetting;

        if (timeLoadoutSetting) {
            const timeLoadout = HSAmbrosiaHelper.convertSettingLoadoutToSlot(timeLoadoutSetting.getValue());
            const timeLoadoutBtn = this.quickbar.getClonedButtonRef(timeLoadout);
            if (!timeLoadout || !timeLoadoutBtn) { HSLogger.warn('Invalid autoLoadoutTime setting - cannot resolve timeLoadout or loadoutSlot', this.context); return; }

            HSAmbrosiaHelper.ensureLoadoutMode('LOAD');

            // We DON'T want any await before that... See Add comment above...
            timeLoadoutBtn.click();
        }
    }


    // ==============================================
    // ---------------- Persistence -----------------
    // ==============================================

    async saveState(): Promise<void> {
        const storageModule = HSModuleManager.getModule('HSStorage') as HSStorage;

        if (storageModule) {
            const payload = {
                persistentAmbrosiaLevelsDisplayEnabled: this.#state.persistentAmbrosiaLevelsDisplayEnabled
            };
            storageModule.setData(HSGlobal.HSAmbrosia.storageKey, JSON.stringify(payload));
        } else {
            HSLogger.warn(`saveState - Could not find storage module`, this.context);
        }
    }

    async loadState(): Promise<void> {
        const storageModule = HSModuleManager.getModule('HSStorage') as HSStorage;

        if (!storageModule) { return; }

        const data = storageModule.getData(HSGlobal.HSAmbrosia.storageKey);
        if (!data) { return; }

        let parsedData: any = data;
        if (typeof data === 'string') {
            try {
                parsedData = JSON.parse(data);
            } catch {
                return;
            }
        }

        try {
            if (parsedData && typeof parsedData === 'object' && !Array.isArray(parsedData)) {
                if ('persistentAmbrosiaLevelsDisplayEnabled' in parsedData) {
                    this.#state.persistentAmbrosiaLevelsDisplayEnabled = Boolean(parsedData.persistentAmbrosiaLevelsDisplayEnabled);
                } else if ('permaAmbLevelsDisplayEnabled' in parsedData) {
                    this.#state.persistentAmbrosiaLevelsDisplayEnabled = Boolean(parsedData.permaAmbLevelsDisplayEnabled);
                }
            }
        } catch (e) {
            HSLogger.warn(`loadState - Error parsing data`, this.context);
            return;
        }
    }


    // ==============================================
    // ----- Persistent Ambrosia Levels Display -----
    // ==============================================

    async #hookPersistentAmbrosiaLevelsToggleButton() {
        const button = this.#persistentAmbrosiaLevelsToggleButton ?? await HSElementHooker.HookElement('#showCurrAmbrosiaUpgrades') as HTMLButtonElement;
        if (!button) { HSLogger.warn('hookPersistentAmbrosiaLevelsToggleButton() could not find #showCurrAmbrosiaUpgrades', this.context); return; }
        this.#persistentAmbrosiaLevelsToggleButton = button;

        button.removeAttribute('title');
        button.setAttribute('aria-label', 'Toggle persistent Amb Levels Display');
        button.dataset.tooltip = 'Toggle persistent Amb Levels Display';
        button.classList.add('hs-tooltip');

        this.#persistentAmbrosiaLevelsToggleHandler ??= (event: Event) => {
            event.preventDefault();
            event.stopPropagation();
            HSLogger.debug(() => 'persistentAmbrosiaLevelsToggle clicked', this.context);
            if (this.#state.persistentAmbrosiaLevelsDisplayEnabled) {
                this.#disablePersistentAmbrosiaLevelsDisplay();
            } else {
                this.#enablePersistentAmbrosiaLevelsDisplay();
            }
        };

        button.addEventListener('click', this.#persistentAmbrosiaLevelsToggleHandler);

        if (this.#state.persistentAmbrosiaLevelsDisplayEnabled) {
            this.#enablePersistentAmbrosiaLevelsDisplay();
        }
    }

    #enablePersistentAmbrosiaLevelsDisplay() {
        if (!this.#persistentAmbrosiaLevelsToggleButton) { HSLogger.warn('enablePersistentAmbrosiaLevelsDisplay() missing button reference', this.context); return; }

        this.#state.persistentAmbrosiaLevelsDisplayEnabled = true;
        this.#persistentAmbrosiaLevelsToggleButton.classList.add('hs-ambrosia-current-levels-active');
        this.#persistentAmbrosiaLevelsToggleButton.textContent = '📌';

        if (this.#isAmbrosiaTabActive) {
            this.#attachPersistentAmbrosiaLevelsDisplayListeners();
            this.#displayPersistentAmbrosiaLevels();
        }

        void this.saveState();
    }

    #disablePersistentAmbrosiaLevelsDisplay() {
        if (!this.#persistentAmbrosiaLevelsToggleButton) { HSLogger.warn('disablePersistentAmbrosiaLevelsDisplay() missing button reference', this.context); return; }
        this.#persistentAmbrosiaLevelsToggleButton.textContent = '🔎';

        this.#state.persistentAmbrosiaLevelsDisplayEnabled = false;
        this.#persistentAmbrosiaLevelsToggleButton.classList.remove('hs-ambrosia-current-levels-active');

        this.#detachPersistentAmbrosiaLevelsDisplayListeners();

        void this.saveState();

        if (!this.#blueberryUpgradeContainer?.matches(':hover')) {
            this.#restorePersistentAmbrosiaLevelsDisplay();
        }
    }

    #shouldRestorePersistentAmbrosiaLevelsDisplay() {
        if (!this.#state.persistentAmbrosiaLevelsDisplayEnabled) return false;
        if (this.#blueberryUpgradeContainer?.matches(':hover')) return false;
        if (this.#loadoutsSlots.some((loadoutSlot) => loadoutSlot.matches(':hover'))) return false;
        return true;
    }

    #maybeRestorePersistentAmbrosiaLevelsDisplay() {
        if (!this.#shouldRestorePersistentAmbrosiaLevelsDisplay()) return;
        this.#displayPersistentAmbrosiaLevels();
    }

    #persistentAmbrosiaLevelsContainerEnterHandler = (event: Event) => {
        if (!this.#state.persistentAmbrosiaLevelsDisplayEnabled) return;
        if (!this.#blueberryUpgradeContainer) return;
        if (!event.isTrusted) return;

        this.#hidePersistentAmbrosiaLevelsDisplay();
    };

    #persistentAmbrosiaLevelsContainerLeaveHandler = (event: Event) => {
        if (!this.#state.persistentAmbrosiaLevelsDisplayEnabled) return;
        if (!this.#blueberryUpgradeContainer) return;
        if (!event.isTrusted) return;

        setTimeout(() => {
            this.#maybeRestorePersistentAmbrosiaLevelsDisplay();
        }, 0);
    };

    #persistentAmbrosiaLevelsSlotMouseOutHandler = (event: MouseEvent) => {
        if (!this.#state.persistentAmbrosiaLevelsDisplayEnabled) return;
        if (!(event.target instanceof HTMLElement)) return;

        const slot = event.target.closest('.blueberryLoadoutSlot');
        if (!slot) return;

        const relatedTarget = event.relatedTarget;
        if (relatedTarget instanceof Node && slot.contains(relatedTarget)) { return; }

        setTimeout(() => {
            this.#maybeRestorePersistentAmbrosiaLevelsDisplay();
        }, 0);
    };

    #displayPersistentAmbrosiaLevels() {
        const button = this.#persistentAmbrosiaLevelsToggleButton;
        if (!button) { HSLogger.warn('displayPersistentAmbrosiaLevels() missing persistent levels button', this.context); return; }

        const event = new MouseEvent('mouseover', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        button.dispatchEvent(event);
    }

    #attachPersistentAmbrosiaLevelsDisplayListeners() {
        this.#detachPersistentAmbrosiaLevelsDisplayListeners();
        if (this.#blueberryUpgradeContainer) {
            this.#blueberryUpgradeContainer.addEventListener('mouseenter', this.#persistentAmbrosiaLevelsContainerEnterHandler);
            this.#blueberryUpgradeContainer.addEventListener('mouseleave', this.#persistentAmbrosiaLevelsContainerLeaveHandler);
        }
        if (this.#loadoutContainer) {
            this.#loadoutContainer.addEventListener('mouseout', this.#persistentAmbrosiaLevelsSlotMouseOutHandler);
        }
    }

    #detachPersistentAmbrosiaLevelsDisplayListeners() {
        if (this.#blueberryUpgradeContainer) {
            this.#blueberryUpgradeContainer.removeEventListener('mouseenter', this.#persistentAmbrosiaLevelsContainerEnterHandler);
            this.#blueberryUpgradeContainer.removeEventListener('mouseleave', this.#persistentAmbrosiaLevelsContainerLeaveHandler);
        }
        if (this.#loadoutContainer) {
            this.#loadoutContainer.removeEventListener('mouseout', this.#persistentAmbrosiaLevelsSlotMouseOutHandler);
        }
    }

    #subscribeGameStateViewChanges() {
        const gameStateMod = HSModuleManager.getModule<HSGameState>('HSGameState');
        if (!gameStateMod) { HSLogger.warn('subscribeGameStateViewChanges() - gameStateMod==undefined', 'hs-ambrosia-gamestate'); return; }

        if (!this.#ambrosiaViewSubscriptionId) {
            this.#ambrosiaViewSubscriptionId = gameStateMod.subscribeForView(
                MAIN_VIEW.SINGULARITY,
                SINGULARITY_VIEW.AMBROSIA,
                (isActive) => {
                    if (isActive) { // Ambrosia Tab Enter
                        this.#onAmbrosiaTabEnter();
                    } else { // Ambrosia Tab Leave
                        this.#onAmbrosiaTabLeave();
                    }
                }
            );
        }
    }

    #unsubscribeGameStateViewChanges() {
        const gameStateMod = HSModuleManager.getModule<HSGameState>('HSGameState');
        if (!gameStateMod) return;

        if (this.#ambrosiaViewSubscriptionId) {
            gameStateMod.unsubscribeForView(this.#ambrosiaViewSubscriptionId);
            this.#ambrosiaViewSubscriptionId = undefined;
        }
    }

    #onAmbrosiaTabEnter() {
        if (this.#isAmbrosiaTabActive) return;
        this.#isAmbrosiaTabActive = true;

        this.#attachAmbrosiaTabEvents();

        if (this.#isIdleSwapEnabled) {
            void this.#activateIdleSwap();
        }

        if (!this.#state.persistentAmbrosiaLevelsDisplayEnabled) return;

        this.#enablePersistentAmbrosiaLevelsDisplay();
    }

    #onAmbrosiaTabLeave() {
        if (!this.#isAmbrosiaTabActive) return;
        this.#isAmbrosiaTabActive = false;

        this.#detachAmbrosiaTabEvents();
        this.#detachPersistentAmbrosiaLevelsDisplayListeners();

        if (this.#isIdleSwapEnabled) {
            this.#deactivateIdleSwap();
        }

        if (this.#state.persistentAmbrosiaLevelsDisplayEnabled) {
            this.#restorePersistentAmbrosiaLevelsDisplay();
        }
    }

    #hidePersistentAmbrosiaLevelsDisplay() {
        const button = this.#persistentAmbrosiaLevelsToggleButton;
        if (!button) { HSLogger.warn('hidePersistentAmbrosiaLevelsDisplay() missing persistent levels button', this.context); return; }

        const event = new MouseEvent('mouseout', {
            bubbles: true,
            cancelable: true,
            view: window,
            relatedTarget: document.body
        });
        button.dispatchEvent(event);
    }

    #restorePersistentAmbrosiaLevelsDisplay() {
        const button = this.#persistentAmbrosiaLevelsToggleButton;
        if (!button) { HSLogger.warn('restorePersistentAmbrosiaLevelsDisplay() missing persistent levels button', this.context); return; }

        if (button.matches(':hover')) {
            HSLogger.debug(() => 'restorePersistentAmbrosiaLevelsDisplay() button still hovered; deferring to normal hover state', this.context);
            return;
        }

        const event = new MouseEvent('mouseout', {
            bubbles: true,
            cancelable: true,
            view: window,
            relatedTarget: document.body
        });
        button.dispatchEvent(event);
    }


    // ==============================================
    // --- Ambrosia Loadouts (Quick) Import Rules ---
    // ==============================================

    async #injectImportFromClipboardButton() {
        const importBtn = this.#importBlueberriesButton ?? await HSElementHooker.HookElement('#importBlueberriesButton') as HTMLButtonElement;
        if (!importBtn) return;
        if (!this.#importBlueberriesButton) {
            this.#importBlueberriesButton = importBtn;
        }

        if (document.getElementById('hs-ambrosia-extra-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'hs-ambrosia-extra-btn';
        btn.className = 'ambrosiaLoadoutBtn';
        btn.textContent = 'Quick Import';

        importBtn.parentElement?.insertBefore(
            btn,
            importBtn.nextSibling
        );

        btn.addEventListener('click', () => this.#handleQuickImport());
    }

    async #handleQuickImport() {
        const autoConfirmSetting = HSSettings.getSetting('autoConfirmPopups' as keyof HSSettingsDefinition);
        let restoreAutoConfirm = autoConfirmSetting && autoConfirmSetting.isEnabled();
        if (autoConfirmSetting) {
            autoConfirmSetting.disable();
        }
        const afkSwapperSetting = HSSettings.getSetting('ambrosiaIdleSwap' as keyof HSSettingsDefinition);
        let restoreAfkSwapper = afkSwapperSetting && afkSwapperSetting.isEnabled();
        if (afkSwapperSetting) {
            afkSwapperSetting.disable();
        }
        let previouslyActiveSlot: HTMLButtonElement | null = null;
        let text: string | undefined;
        let importedCount = 0;
        let skippedCount = 0;
        let failures: { index: number; reason: string }[] = [];
        try {
            previouslyActiveSlot = document.querySelector(
                '.blueberryLoadoutSlot.hs-rainbow-border'
            ) as HTMLButtonElement | null;
            // previous active slot logged only on error

            text = await navigator.clipboard.readText();
            // clipboard length hidden

            if (!text || typeof text !== 'string') {
                HSUI.Notify('Clipboard does not contain valid loadout data', {
                    notificationType: 'warning'
                });
                return;
            }

            // Split clipboard by lines
            const lines = text.split(/\r?\n|\r/g).map(line => line.trim());
            // parsed clipboard lines

            // Validate we have between 1 and 16 loadouts
            if (lines.length === 0 || lines.length > 16) {
                HSUI.Notify(`Invalid number of loadouts: ${lines.length}. Expected 1 - 16.`, {
                    notificationType: 'warning'
                });
                return;
            }

            const fileInput = document.getElementById('importBlueberries') as HTMLInputElement;
            const modeToggle = await HSElementHooker.HookElement('#blueberryToggleMode') as HTMLButtonElement;

            if (!fileInput) {
                throw new Error('Import input element not found');
            }

            if (!modeToggle) {
                throw new Error('Mode toggle button not found');
            }

            // If the current mode is LOAD, we need to switch to SAVE mode
            // TODO: update HSAmbrosiaHelper.ensureLoadoutModeIsLoad to handle either save or load with a parameter
            const currentMode = modeToggle.innerText;
            if (currentMode.includes('LOAD ')) {
                // switch blueberry mode to SAVE
                modeToggle.click();
            }

            importedCount = 0;
            skippedCount = 0;

            // Use dynamic slot resolution
            const loadoutsSlots = this.#loadoutsSlots;

            failures = [];

            // starting loadout import loop
            for (let i = 0; i < lines.length; i++) {
                const loadoutData = lines[i];
                // per-line processing
                // Skip empty lines
                if (!loadoutData) {
                    skippedCount++;
                    // skipped empty line
                    continue;
                }

                // Use dynamic slot element
                const loadoutBtn = loadoutsSlots[i] as HTMLButtonElement;
                if (!loadoutBtn) {
                    HSLogger.warn(`Loadout slot element for index ${i} not found`, this.context);
                    // no slot element for index
                    continue;
                }

                const blob = new Blob([loadoutData], { type: 'application/json' });
                const file = new File([blob], 'quick-import.json', { type: 'application/json' });
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;
                // file input set and dispatched
                const event = new Event('change', { bubbles: true });
                fileInput.dispatchEvent(event);

                // Wait for the import alert (the game shows an alert after file selection).
                // If the alert appears but its content is empty, poll a bit longer for text to materialize.
                let alertText = '';
                let alertWrapper: HTMLElement | null;
                let okAlert: HTMLButtonElement | null;

                for (let attempt = 0; attempt < 50; attempt++) {
                    alertWrapper = document.getElementById('alertWrapper');
                    if (alertWrapper && alertWrapper.style.display === 'block') {
                        // poll a bit for text just in case
                        for (let inner = 0; inner < 40; inner++) {
                            await HSUtils.sleep(5);
                            const scroll = alertWrapper.querySelector('.scrollbar');
                            const candidate = (scroll && scroll.textContent) ? scroll.textContent.trim() : (alertWrapper.textContent || '').trim();
                            if (candidate.length > 0) {
                                alertText = candidate;
                                break;
                            }
                        }

                        okAlert = document.getElementById('ok_alert') as HTMLButtonElement | null;
                        if (okAlert) {
                            okAlert.click();
                        }

                        // Wait for it to close
                        let alertStillPresent = true;
                        for (let clearWait = 0; clearWait < 20; clearWait++) {
                            await HSUtils.sleep(5);
                            alertWrapper = document.getElementById('alertWrapper');
                            if (!alertWrapper || alertWrapper.style.display !== 'block') {
                                alertStillPresent = false;
                                break;
                            }
                            // Re-click if stuck
                            okAlert = document.getElementById('ok_alert') as HTMLButtonElement | null;
                            if (okAlert) okAlert.click();
                        }
                        break;
                    }
                    await HSUtils.sleep(5);
                }

                const isSuccess = (alertText || '').toLowerCase().includes('tree successfully imported');

                if (!isSuccess) {
                    // record failure for later reporting
                    const reason = alertText || 'Unknown error';
                    failures.push({ index: i + 1, reason });

                    // Clear the file input to avoid residual state
                    try {
                        fileInput.files = new DataTransfer().files;
                    } catch (e) { /* ignore */ }

                    // do not click save on this slot
                    continue;
                }

                // Import succeeded -> now click the loadout button to save into the slot
                loadoutBtn.click();

                // Wait for confirm dialog and click OK to accept overwriting the slot; keep clicking until dismissed
                let confirmWrapper: HTMLElement | null;
                let okConfirm: HTMLButtonElement | null;

                for (let attempt = 0; attempt < 50; attempt++) {
                    confirmWrapper = document.getElementById('confirmWrapper');
                    if (confirmWrapper && confirmWrapper.style.display === 'block') {
                        okConfirm = document.getElementById('ok_confirm') as HTMLButtonElement | null;
                        if (okConfirm) {
                            okConfirm.click();
                        }

                        // Wait for it to close
                        let confirmStillPresent = true;
                        for (let clearWait = 0; clearWait < 20; clearWait++) {
                            await HSUtils.sleep(5);
                            confirmWrapper = document.getElementById('confirmWrapper');
                            if (!confirmWrapper || confirmWrapper.style.display !== 'block') {
                                confirmStillPresent = false;
                                break;
                            }
                            // Re-click if stuck
                            okConfirm = document.getElementById('ok_confirm') as HTMLButtonElement | null;
                            if (okConfirm) okConfirm.click();
                        }
                        break;
                    }
                    await HSUtils.sleep(5);
                }

                // Success path
                importedCount++;
            }
            // summary: imported/skipped/failed
            modeToggle.click();

            if (failures.length > 0) {
                const failureSummary = failures.map(f => `#${f.index}: ${f.reason}`).join('; ');
                // Short user-facing notification; detailed info logged for debugging
                HSUI.Notify(`Imported ${importedCount} loadout(s); ${failures.length} failed (see logs)`, { notificationType: 'warning' });
                HSLogger.debug(() => `Quick Import detailed failures: ${failureSummary}`, this.context);
            } else {
                HSUI.Notify(`Imported ${importedCount} loadout(s), skipped ${skippedCount} empty slot(s)`, { notificationType: 'success' });
            }
        } catch (err: unknown) {
            const msg =
                err instanceof Error
                    ? err.message
                    : typeof err === 'string'
                        ? err
                        : 'Unknown error';

            HSLogger.error(`Quick Import failed: ${msg}`, this.context, true);
            // Log detailed error context for debugging
            HSLogger.debug(() => `Quick Import exception message: ${msg}; clipboardLen=${text?.length ?? 'n/a'}; imported=${importedCount ?? 0}; skipped=${skippedCount ?? 0}; failures=${JSON.stringify(failures ?? [])}`, this.context);

            HSUI.Notify('Quick Import failed', { notificationType: 'error' });
        } finally {
            await HSUtils.stopDialogWatcher();
            if (restoreAutoConfirm) {
                autoConfirmSetting.enable();
            }
            if (restoreAfkSwapper) {
                afkSwapperSetting.enable();
            }
            // Restore previously active loadout slot
            if (previouslyActiveSlot) {
                previouslyActiveSlot.click();
            }
            // cleanup complete
        }
    }


    // ==============================================
    // -------- AFK/Idle Swapper & Game Data --------
    // ==============================================

    async enableIdleSwap() {
        HSLogger.debug(() => 'Enabling Ambrosia Idle Swap', this.context);

        this.#isIdleSwapEnabled = true;
        this.#cachedNormalLuckBlueBarRequired = undefined;
        this.#cachedNormalLuckLoadoutValue = undefined;
        this.#initIdleSwapSettingsCache();

        if (this.#isAmbrosiaTabActive) {
            await this.#activateIdleSwap();
        }

        if (!this.#debugElement)
            this.#debugElement = document.querySelector('#hs-panel-debug-gamedata-currentambrosia') as HTMLDivElement;
    }

    async #activateIdleSwap(): Promise<void> {
        if (!this.#isIdleSwapEnabled || this.#isIdleSwapActive || !this.#isAmbrosiaTabActive) return;

        this.#blueAmbrosiaProgressBar = await HSElementHooker.HookElement('#ambrosiaProgressBar') as HTMLDivElement;
        this.#redAmbrosiaProgressBar = await HSElementHooker.HookElement('#pixelProgressBar') as HTMLDivElement;
        this.#cacheIdleSwapLoadoutButtons();
        this.#isIdleSwapActive = true;
        this.#maybeInsertIdleLoadoutIndicator();
        this.subscribeGameDataChanges();

        if (!this.#debugElement)
            this.#debugElement = document.querySelector('#hs-panel-debug-gamedata-currentambrosia') as HTMLDivElement;
    }

    disableIdleSwap() {
        this.#isIdleSwapEnabled = false;
        this.#deactivateIdleSwap();
        this.#holdBlueLuckUntilReset = false;
        this.#lastBlueBarValue = undefined;
        this.#cachedNormalLuckBlueBarRequired = undefined;
        this.#cachedNormalLuckLoadoutValue = undefined;
        this.#cachedIdleSwapOcteractSetting = undefined;
        this.#cachedIdleSwapNormalLuckSetting = undefined;
        this.#cachedIdleSwapRedLuckSetting = undefined;
        this.#cachedIdleSwapOcteractLoadoutValue = undefined;
        this.#cachedIdleSwapNormalLuckLoadoutValue = undefined;
        this.#cachedIdleSwapRedLuckLoadoutValue = undefined;
        this.#cachedIdleSwapOcteractLoadout = undefined;
        this.#cachedIdleSwapNormalLuckLoadout = undefined;
        this.#cachedIdleSwapRedLuckLoadout = undefined;
        this.#cachedIdleSwapLoadoutButtons.clear();
    }

    #deactivateIdleSwap() {
        if (!this.#isIdleSwapActive) return;

        this.#isIdleSwapActive = false;
        this.#holdBlueLuckUntilReset = false;
        this.#lastBlueBarValue = undefined;
        this.#cachedNormalLuckBlueBarRequired = undefined;
        this.#cachedNormalLuckLoadoutValue = undefined;
        this.#removeIdleLoadoutIndicator();
        this.unsubscribeGameDataChanges();
    }

    #initIdleSwapSettingsCache() {
        this.#cachedIdleSwapOcteractSetting = HSSettings.getSetting('ambrosiaIdleSwapOcteractLoadout') as HSSelectStringSetting;
        this.#cachedIdleSwapNormalLuckSetting = HSSettings.getSetting('ambrosiaIdleSwapNormalLuckLoadout') as HSSelectStringSetting;
        this.#cachedIdleSwapRedLuckSetting = HSSettings.getSetting('ambrosiaIdleSwapRedLuckLoadout') as HSSelectStringSetting;
        this.#refreshIdleSwapSettingsCache();
    }

    #refreshIdleSwapSettingsCache() {
        if (!this.#cachedIdleSwapOcteractSetting || !this.#cachedIdleSwapNormalLuckSetting || !this.#cachedIdleSwapRedLuckSetting) {
            this.#cachedIdleSwapOcteractLoadoutValue = undefined;
            this.#cachedIdleSwapNormalLuckLoadoutValue = undefined;
            this.#cachedIdleSwapRedLuckLoadoutValue = undefined;
            this.#cachedIdleSwapOcteractLoadout = undefined;
            this.#cachedIdleSwapNormalLuckLoadout = undefined;
            this.#cachedIdleSwapRedLuckLoadout = undefined;
            return;
        }

        const octeractLoadoutValue = this.#cachedIdleSwapOcteractSetting.getValue();
        const normalLuckLoadoutValue = this.#cachedIdleSwapNormalLuckSetting.getValue();
        const redLuckLoadoutValue = this.#cachedIdleSwapRedLuckSetting.getValue();

        if (this.#cachedIdleSwapOcteractLoadoutValue !== octeractLoadoutValue) {
            this.#cachedIdleSwapOcteractLoadoutValue = octeractLoadoutValue;
            this.#cachedIdleSwapOcteractLoadout = HSAmbrosiaHelper.convertSettingLoadoutToSlot(octeractLoadoutValue);
        }

        if (this.#cachedIdleSwapNormalLuckLoadoutValue !== normalLuckLoadoutValue) {
            this.#cachedIdleSwapNormalLuckLoadoutValue = normalLuckLoadoutValue;
            this.#cachedIdleSwapNormalLuckLoadout = HSAmbrosiaHelper.convertSettingLoadoutToSlot(normalLuckLoadoutValue);
            this.#cachedNormalLuckBlueBarRequired = undefined;
        }

        if (this.#cachedIdleSwapRedLuckLoadoutValue !== redLuckLoadoutValue) {
            this.#cachedIdleSwapRedLuckLoadoutValue = redLuckLoadoutValue;
            this.#cachedIdleSwapRedLuckLoadout = HSAmbrosiaHelper.convertSettingLoadoutToSlot(redLuckLoadoutValue);
        }
    }

    #cacheIdleSwapLoadoutButtons() {
        this.#cachedIdleSwapLoadoutButtons.clear();

        const buttons = this.quickbar.getCurrentOriginalLoadoutButtons();
        for (const button of buttons) {
            if (button.id) {
                this.#cachedIdleSwapLoadoutButtons.set(button.id, button);
            }
        }
    }

    subscribeGameDataChanges() {
        const gameDataMod = HSModuleManager.getModule<HSGameData>('HSGameData');
        const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');

        if (gameDataMod && gameDataAPI && !this.gameDataSubscriptionId) {
            this.#cachedGameDataMod = gameDataMod;
            this.#cachedGameDataAPI = gameDataAPI;
            this.gameDataSubscriptionId = gameDataMod.subscribeGameDataChange(this.gameDataCallback.bind(this));
            HSLogger.debug(() => 'Subscribed to game data changes', this.context);
        }
    }

    unsubscribeGameDataChanges() {
        const gameDataMod = this.#cachedGameDataMod ?? HSModuleManager.getModule<HSGameData>('HSGameData');

        if (gameDataMod && this.gameDataSubscriptionId) {
            // Only actually unsubscribe if no feature currently needs game data
            if (!this.#isIdleSwapActive && !this.#berryMinibarsEnabled) {
                gameDataMod.unsubscribeGameDataChange(this.gameDataSubscriptionId);
                this.gameDataSubscriptionId = undefined;
                HSLogger.debug(() => 'Unsubscribed from game data changes', this.context);
            }
        }
    }

    async #performInitialActiveLoadoutMatchOnce(gameData: GameData): Promise<void> {
        if (this.#hasPerformedInitialLoadoutMatch) return;

        await this.performInitialActiveLoadoutMatch(gameData);
        this.#hasPerformedInitialLoadoutMatch = true;
    }

    async gameDataCallback() { 
        const gameDataAPI = this.#cachedGameDataAPI || (this.#cachedGameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI'));
        if (!gameDataAPI) return;

        const gameData = gameDataAPI.getGameData();
        if (!gameData) return;

        if (gameData.blueberryTime != null && gameData.redAmbrosiaTime != null) {
            const blueAmbrosiaBarValue = gameData.blueberryTime;
            const redAmbrosiaBarValue = gameData.redAmbrosiaTime;
            const blueAmbrosiaBarMax = gameDataAPI.ambrosia.calculateRequiredBlueberryTime();
            const redAmbrosiaBarMax = gameDataAPI.ambrosia.calculateRequiredRedAmbrosiaTime();
            const blueAmbrosiaPercent = ((blueAmbrosiaBarValue / blueAmbrosiaBarMax) * 100);
            const redAmbrosiaPercent = ((redAmbrosiaBarValue / redAmbrosiaBarMax) * 100);

            if (this.#berryMinibarsEnabled) {
                this.#updateBerryMinibars(
                    blueAmbrosiaBarMax,
                    redAmbrosiaBarMax,
                    blueAmbrosiaPercent,
                    redAmbrosiaPercent
                );
            }

            if (this.#isIdleSwapActive) {
                this.#refreshIdleSwapSettingsCache();

                const blueberrySpeedMults = (gameDataAPI.ambrosia.calculateAmbrosiaGenerationSpeed(true, false) as number);
                const blueberries = (gameDataAPI.ambrosia.calculateBlueberryInventory() as number);
                const ambrosiaSpeed = blueberrySpeedMults * blueberries;
                const ambrosiaAcceleratorCount = gameData.shopUpgrades.shopAmbrosiaAccelerator;
                const ambrosiaLuck = gameDataAPI.luck.calculateLuck() as { luckBase: number; luckMult: number; luckTotal: number; };
                const bonusAmbrosia = (gameData.singularityChallenges.noAmbrosiaUpgrades.completions > 0) ? 1 : 0;
                const ambrosiaGainPerGen = (ambrosiaLuck.luckTotal / 100) + bonusAmbrosia;
                const bluePercentageSpeed = (ambrosiaSpeed / blueAmbrosiaBarMax) * 100;
                const bluePercentageSafeThreshold = bluePercentageSpeed;
                const hasBlueBarReset = this.#lastBlueBarValue !== undefined && blueAmbrosiaBarValue < this.#lastBlueBarValue;

                const maxAccelMultiplier = (1 / 2)
                    + (3 / 5 - 1 / 2) * +(gameData.singularityChallenges.noAmbrosiaUpgrades.completions >= 15)
                    + (2 / 3 - 3 / 5) * +(gameData.singularityChallenges.noAmbrosiaUpgrades.completions >= 19)
                    + (3 / 4 - 2 / 3) * +(gameData.singularityChallenges.noAmbrosiaUpgrades.completions >= 20);

                let accelerationSeconds = 0;
                let accelerationAmount = 0;
                let accelerationPercent = 0;
                if (ambrosiaAcceleratorCount > 0 && ambrosiaSpeed > 0) {
                    const secondsToNextAmbrosia = blueAmbrosiaBarMax / ambrosiaSpeed;
                    accelerationSeconds = Math.min(
                        secondsToNextAmbrosia * maxAccelMultiplier,
                        ambrosiaGainPerGen * 0.2 * ambrosiaAcceleratorCount
                    );
                    accelerationAmount = 1; //accelerationSeconds * ambrosiaSpeed;
                    accelerationPercent = (accelerationAmount / blueAmbrosiaBarMax) * 100;
                }

                await this.#evaluateIdleSwap(
                    gameData,
                    blueAmbrosiaBarValue,
                    redAmbrosiaBarValue,
                    blueAmbrosiaBarMax,
                    redAmbrosiaBarMax,
                    blueAmbrosiaPercent,
                    redAmbrosiaPercent,
                    blueberrySpeedMults,
                    blueberries,
                    ambrosiaAcceleratorCount,
                    ambrosiaLuck,
                    accelerationAmount,
                    accelerationPercent,
                    bluePercentageSpeed,
                    bluePercentageSafeThreshold,
                    hasBlueBarReset
                );

                this.#lastBlueBarValue = blueAmbrosiaBarValue;
            }
        }
    };

    #updateBerryMinibars(
        blueAmbrosiaBarMax: number,
        redAmbrosiaBarMax: number,
        blueAmbrosiaPercent: number,
        redAmbrosiaPercent: number
    ) {
        if (!this.#berryMinibarsEnabled) {
            HSLogger.logOnce('HSAmbrosia.gameDataCallback() - berryMinibarsEnabled was false', 'hs-minibars-false');
            return;
        }

        if (this.#blueProgressMinibarElement && this.#redProgressMinibarElement) {
            if (!Number.isFinite(blueAmbrosiaBarMax) || blueAmbrosiaBarMax <= 0) {
                HSLogger.warnOnce(`HSAmbrosia.gameDataCallback() - invalid blueAmbrosiaBarMax: ${blueAmbrosiaBarMax}`, 'hs-minibars-invalid-blue-max');
            }
            if (!Number.isFinite(redAmbrosiaBarMax) || redAmbrosiaBarMax <= 0) {
                HSLogger.warnOnce(`HSAmbrosia.gameDataCallback() - invalid redAmbrosiaBarMax: ${redAmbrosiaBarMax}`, 'hs-minibars-invalid-red-max');
            }
            if (!Number.isFinite(blueAmbrosiaPercent) || !Number.isFinite(redAmbrosiaPercent)) {
                HSLogger.warnOnce(`HSAmbrosia.gameDataCallback() - invalid minibar percents: blue=${blueAmbrosiaPercent}, red=${redAmbrosiaPercent}`, 'hs-minibars-invalid-percents');
            }
            this.#blueProgressMinibarElement.style.width = `${blueAmbrosiaPercent}% `;
            this.#redProgressMinibarElement.style.width = `${redAmbrosiaPercent}% `;
        } else {
            HSLogger.warnOnce(`
        HSAmbrosia.gameDataCallback() - minibar element(s) undefined.
            blue: ${this.#blueProgressMinibarElement},
        red: ${this.#redProgressMinibarElement} `, 'hs-minibars-undefined');
        }
    }

    async #evaluateIdleSwap(
        gameData: GameData,
        blueAmbrosiaBarValue: number,
        redAmbrosiaBarValue: number,
        blueAmbrosiaBarMax: number,
        redAmbrosiaBarMax: number,
        blueAmbrosiaPercent: number,
        redAmbrosiaPercent: number,
        blueberrySpeedMults: number,
        blueberries: number,
        ambrosiaAcceleratorCount: number,
        ambrosiaLuck: { luckBase: number; luckMult: number; luckTotal: number; },
        accelerationAmount: number,
        accelerationPercent: number,
        bluePercentageSpeed: number,
        bluePercentageSafeThreshold: number,
        hasBlueBarReset: boolean
    ) {
        if (!this.#isIdleSwapEnabled) return;
        if (!this.#blueAmbrosiaProgressBar || !this.#redAmbrosiaProgressBar) return;

        const idleSwapOcteractSetting = this.#cachedIdleSwapOcteractSetting ?? HSSettings.getSetting('ambrosiaIdleSwapOcteractLoadout') as HSSelectStringSetting;
        const idleSwapNormalLuckSetting = this.#cachedIdleSwapNormalLuckSetting ?? HSSettings.getSetting('ambrosiaIdleSwapNormalLuckLoadout') as HSSelectStringSetting;
        const idleSwapRedLuckSetting = this.#cachedIdleSwapRedLuckSetting ?? HSSettings.getSetting('ambrosiaIdleSwapRedLuckLoadout') as HSSelectStringSetting;

        if (!idleSwapOcteractSetting || !idleSwapNormalLuckSetting || !idleSwapRedLuckSetting) return;

        const octeractLoadoutValue = this.#cachedIdleSwapOcteractLoadoutValue ?? idleSwapOcteractSetting.getValue();
        const normalLuckLoadoutValue = this.#cachedIdleSwapNormalLuckLoadoutValue ?? idleSwapNormalLuckSetting.getValue();
        const redLuckLoadoutValue = this.#cachedIdleSwapRedLuckLoadoutValue ?? idleSwapRedLuckSetting.getValue();

        const octeractLoadout = this.#cachedIdleSwapOcteractLoadout ?? HSAmbrosiaHelper.convertSettingLoadoutToSlot(octeractLoadoutValue);
        const normalLuckLoadout = this.#cachedIdleSwapNormalLuckLoadout ?? HSAmbrosiaHelper.convertSettingLoadoutToSlot(normalLuckLoadoutValue);
        const redLuckLoadout = this.#cachedIdleSwapRedLuckLoadout ?? HSAmbrosiaHelper.convertSettingLoadoutToSlot(redLuckLoadoutValue);

        if (!Number.isInteger(parseInt(octeractLoadoutValue, 10)) || !Number.isInteger(parseInt(normalLuckLoadoutValue, 10)) || !Number.isInteger(parseInt(redLuckLoadoutValue, 10))) {
            HSLogger.warnOnce(
                'Idle swap is enabled but loadout settings are not fully configured; skipping autoswap logic until configured',
                'hs-amb-idleswap-unconfigured-loadouts'
            );
            return;
        }

        if (this.#cachedNormalLuckLoadoutValue !== normalLuckLoadoutValue) {
            this.#cachedNormalLuckLoadoutValue = normalLuckLoadoutValue;
            this.#cachedNormalLuckBlueBarRequired = undefined;
        }

        if (this.#cachedNormalLuckBlueBarRequired === undefined) {
            const normalLuckLoadoutNumber = parseInt(normalLuckLoadoutValue, 10);
            if (Number.isInteger(normalLuckLoadoutNumber)) {
                this.#cachedNormalLuckBlueBarRequired = this.calculateBlueBarRequirementForLoadout(gameData, normalLuckLoadoutNumber);
            }
        }

        const normalLuckBlueBarRequired = this.#cachedNormalLuckBlueBarRequired;
        const canUseNormalLuckBlueRequirement = normalLuckBlueBarRequired !== undefined;

        let blueSwapThresholdRedMin = 100 - bluePercentageSafeThreshold;

        const blueSwapBufferPercent = Math.max(0, Math.min(95, bluePercentageSafeThreshold + accelerationPercent));
        const normalLuckBlueSwapThreshold = canUseNormalLuckBlueRequirement
            ? normalLuckBlueBarRequired * (1 - blueSwapBufferPercent / 100)
            : 0;

        const shouldSwapToBlueLuck = canUseNormalLuckBlueRequirement
            ? blueAmbrosiaBarValue >= normalLuckBlueSwapThreshold
            : blueAmbrosiaPercent >= blueSwapThresholdRedMin;

        let redSwapThresholdRedMin = HSGlobal.HSAmbrosia.idleSwapMaxRedThreshold;

        let targetLoadout: string | undefined;
        const isKnownSwapLoadout =
            this.activeLoadout === octeractLoadout
            || this.activeLoadout === normalLuckLoadout
            || this.activeLoadout === redLuckLoadout;

        if (this.#holdBlueLuckUntilReset && hasBlueBarReset) {
            this.#holdBlueLuckUntilReset = false;
        }

        if (this.#holdBlueLuckUntilReset) {
            targetLoadout = normalLuckLoadout;
        } else if (this.activeLoadout === redLuckLoadout) {
            if (redAmbrosiaPercent < redSwapThresholdRedMin) {
                if (shouldSwapToBlueLuck) {
                    targetLoadout = normalLuckLoadout;
                    this.#holdBlueLuckUntilReset = true;
                } else {
                    targetLoadout = octeractLoadout;
                }
            } else {
                targetLoadout = redLuckLoadout;
            }
        } else if (this.activeLoadout === normalLuckLoadout) {
            if (blueAmbrosiaPercent < blueSwapThresholdRedMin) {
                targetLoadout = octeractLoadout;
            } else {
                targetLoadout = normalLuckLoadout;
            }
        } else if (redAmbrosiaPercent >= redSwapThresholdRedMin) {
            targetLoadout = redLuckLoadout;
        } else if (shouldSwapToBlueLuck) {
            targetLoadout = normalLuckLoadout;
            this.#holdBlueLuckUntilReset = true;
        } else if (!isKnownSwapLoadout) {
            targetLoadout = octeractLoadout;
        } else {
            targetLoadout = this.activeLoadout;
        }

        if (targetLoadout && this.activeLoadout !== targetLoadout) {
            let loadoutSlot = this.#cachedIdleSwapLoadoutButtons.get(targetLoadout);
            if (!loadoutSlot) {
                loadoutSlot = await HSElementHooker.HookElement(`#${targetLoadout} `) as HTMLButtonElement;
                if (loadoutSlot) {
                    this.#cachedIdleSwapLoadoutButtons.set(targetLoadout, loadoutSlot);
                }
            }

            if (loadoutSlot) {
                HSAmbrosiaHelper.ensureLoadoutMode('LOAD');
                await HSUtils.hiddenAction(async () => {
                    loadoutSlot!.click();
                });
            }
        }

        if (this.#debugElement && HSUI.isModPanelOpen()) {
            const newDebugElement = document.createElement('div');

            newDebugElement.innerHTML = `
        BLUE - Value: ${blueAmbrosiaBarValue.toFixed(2)}, Max: ${blueAmbrosiaBarMax}, Percent: ${blueAmbrosiaPercent.toFixed(2)} <br>
            RED - Value: ${redAmbrosiaBarValue.toFixed(2)}, Max: ${redAmbrosiaBarMax}, Percent: ${redAmbrosiaPercent.toFixed(2)} <br>
                BLUE SPD MLT: ${blueberrySpeedMults.toFixed(2)} <br>
                    BLUE SPD %: ${bluePercentageSpeed.toFixed(2)} <br>
                        BERRY: ${blueberries} </br>
                        TOT BLU: ${(blueberrySpeedMults * blueberries).toFixed(2)} </br>
        ------------------------</br>
                        BASE LUK: ${ambrosiaLuck.luckBase.toFixed(2)} </br>
                        MULT LUK: ${ambrosiaLuck.luckMult.toFixed(2)} </br>
                        TOT LUK: ${ambrosiaLuck.luckTotal.toFixed(2)} </br>
        ------------------------</br>
                        ACC CNT: ${ambrosiaAcceleratorCount} </br>
                        ACCEL AMOUNT: ${accelerationAmount.toFixed(2)} </br>
        ACCEL %: ${accelerationPercent.toFixed(2)} </br>
            `;

            this.#debugElement.innerHTML = '';
            while (newDebugElement.firstChild) {
                this.#debugElement.appendChild(newDebugElement.firstChild);
            }
        }
    }

    #maybeInsertIdleLoadoutIndicator() {
        const indicatorExists = document.querySelector(`#${HSGlobal.HSAmbrosia.idleSwapIndicatorId} `) as HTMLElement;
        if (indicatorExists) {
            return;
        }
        const loadoutIndicator = document.createElement('div') as HTMLDivElement;
        loadoutIndicator.id = HSGlobal.HSAmbrosia.idleSwapIndicatorId;
        loadoutIndicator.innerText = "IDLE SWAP ENABLED WHILE IN THIS VIEW";

        HSUI.injectHTMLElement(loadoutIndicator, (element) => {
            const parent = document.querySelector('#singularityAmbrosia') as HTMLElement;
            const child = document.querySelector('#ambrosiaProgressBar') as HTMLElement;

            parent?.insertBefore(element, child as Node);
        });

        HSUI.injectStyle(this.#idleLoadoutCSS, this.#idleLoadoutCSSId);
    }

    #removeIdleLoadoutIndicator() {
        const loadoutIndicator = document.querySelector(`#${HSGlobal.HSAmbrosia.idleSwapIndicatorId} `) as HTMLElement;

        if (loadoutIndicator) {
            loadoutIndicator.remove();
        }

        HSUI.removeInjectedStyle(this.#idleLoadoutCSSId);
    }
}
