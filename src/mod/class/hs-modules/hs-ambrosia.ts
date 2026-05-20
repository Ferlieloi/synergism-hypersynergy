import { HSGameDataSubscriber, HSModuleOptions, HSPersistable } from "../../types/hs-types";
import { AmbrosiaUpgradeCalculationCollection, AmbrosiaUpgradeCalculationConfig } from "../../types/data-types/hs-gamedata-api-types";
import { AmbrosiaUpgradeData, AmbrosiaUpgrades, GameData } from "../../types/data-types/hs-player-savedata";
import { AMBROSIA_LOADOUT_SLOT } from "../../types/module-types/hs-ambrosia-types";
import { MAIN_VIEW, SINGULARITY_VIEW, VIEW_TYPE } from "../../types/module-types/hs-gamestate-types";
import { HSElementHooker } from "../hs-core/hs-elementhooker";
import { HSGameData } from "../hs-core/gds/hs-gamedata";
import { GameView, HSGameState } from "../hs-core/hs-gamestate";
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
import minibarCSS from "inline:../../resource/css/module/hs-ambrosia-minibars.css";
import { HSSettingsDefinition } from "../../types/module-types/hs-settings-types";

/**
 * Class: HSAmbrosia
 * IsExplicitHSModule: Yes
 * Description: Hypersynergism module which manages ambrosia loadouts and quickbar interactions.
 * Author: Swiffy
 */
export class HSAmbrosia extends HSModule
    implements HSPersistable, HSGameDataSubscriber {

    gameDataSubscriptionId?: string;
    #gameStateMainViewSubscriptionId?: string;
    #gameStateSubViewSubscriptionId?: string;

    #loadoutsSlots: HTMLElement[] = [];

    #loadoutContainer: HTMLElement | null = null;
    #pageHeader: HTMLElement | null = null;

    #addCodeButton: HTMLButtonElement | null = null;
    #addCodeAllButton: HTMLButtonElement | null = null;
    #addCodeOneButton: HTMLButtonElement | null = null;
    #timeCodeButton: HTMLButtonElement | null = null;
    #importBlueberriesButton: HTMLButtonElement | null = null;
    #importBlueberriesInput: HTMLInputElement | null = null;
    #blueberryToggleModeButton: HTMLButtonElement | null = null;
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
        HSLogger.debug(() => 'init() called', this.context);

        await this.#cacheDomRefs();

        await this.loadState();

        await this.quickbar.init();

        await this.#createPersistentMinibars();

        await this.#injectImportFromClipboardButton();
        this.#setupLoadoutContainerEvents();

        HSSettingsUI.refreshAmbrosiaLoadoutDropdowns();
        this.isInitialized = true;
    }

    async #cacheDomRefs() {
        const [loadoutsSlots, loadoutContainer, pageHeader, addCodeButton, addCodeAllButton, addCodeOneButton, timeCodeButton, importBlueberriesButton, importBlueberriesInput, blueberryToggleModeButton] = await Promise.all([
            HSElementHooker.HookElements('.blueberryLoadoutSlot'),
            HSElementHooker.HookElement('#bbLoadoutContainer'),
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

    #setupLoadoutContainerEvents() {
        if (!this.#loadoutContainer) return;

        this.#loadoutContainer.delegateEventListener('click', '.blueberryLoadoutSlot', this.#onLoadoutClick.bind(this));
    }

    async #onLoadoutClick(e: MouseEvent) {
        const slotElement = e.target as HTMLButtonElement;
        if (!slotElement) return;

        const slotElementId = slotElement.id;
        const slotEnum = HSAmbrosiaHelper.getSlotEnumBySlotId(slotElementId);
        if (!slotEnum) {
            HSLogger.warn(`No slot enum found for slot ID: ${slotElementId}`, this.context);
            return;
        }

        if (this.activeLoadout !== slotEnum) {
            await this.#updateActiveLoadout(slotEnum);
        }
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

    async refreshActiveLoadoutFromState() {
        const resolvedCurrent = HSAmbrosiaHelper.resolveAmbrosiaLoadout(this.activeLoadout);
        if (resolvedCurrent) {
            await this.#updateActiveLoadout(resolvedCurrent);
        }
    }

    async updateQuickBar() {
        await this.quickbar.updateQuickBar();
    }

    async showQuickBar() {
        await this.quickbar.showQuickBar();
    }

    async hideQuickBar() {
        await this.quickbar.hideQuickBar();
    }

    async destroy() {
        await this.quickbar.destroy();
        await this.disableBerryMinibars();
        this.unsubscribeGameDataChanges();

        // Remove style tokens
        HSUI.removeInjectedStyle(this.#minibarCSSId);
        HSUI.removeInjectedStyle(this.#idleLoadoutCSSId);

        this.isInitialized = false;
        this.activeLoadout = undefined;
    }


    // ==============================================
    // -------- Ambrosia Minibars (Quickbar) --------
    // ==============================================

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

    async #updateActiveLoadout(slotEnum?: AMBROSIA_LOADOUT_SLOT) {
        if (!slotEnum) { HSLogger.warn('No slot specified to #updateActiveLoadout', this.context); return; }

        // Normalize & validate incoming slot value using helper.
        const resolvedSlot = HSAmbrosiaHelper.resolveAmbrosiaLoadout(slotEnum);
        if (!resolvedSlot) { HSLogger.warn('Invalid or unknown slot passed to #updateActiveLoadout: ' + slotEnum, this.context); return; }

        this.activeLoadout = resolvedSlot as AMBROSIA_LOADOUT_SLOT;

        await HSQuickbarManager.getInstance().whenSectionInjected('ambrosia');

        const slotNumber = HSAmbrosiaHelper.getLoadoutNumberFromSlot(resolvedSlot);
        if (!slotNumber) { HSLogger.warn('Could not parse loadout number from resolvedSlot:' + resolvedSlot, this.context); return; }

        await this.quickbar.syncActiveSlot(slotNumber);

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

            await this.#updateActiveLoadout(slotEnum);

            HSLogger.debug(() => `Initial load - Ambrosia loadout best match: ${bestMatchId} is ${(highestScore * 100).toFixed(1)}% compliant. `, this.context);
        } else if (bestMatchId) {
            HSLogger.debug(() => `Initial load - No compliant Ambrosia loadout found. Closest was ${bestMatchId} at ${(highestScore * 100).toFixed(1)}% (Threshold: 80%).`, this.context);
        } else {
            HSLogger.debug(() => `Initial load - No saved Ambrosia loadouts found to match.`, this.context);
        }
    }

    public getAmbrosiaLoadoutsAmount(): number {
        if (!this.#loadoutsSlots || this.#loadoutsSlots.length === 0) return 0;
        return this.#loadoutsSlots.filter((slot) => {
            if (!slot) return false;
            if (slot.style.display === 'none') return false;
            return true;
        }).length;
    }

    // ==============================================
    // ------- Add/Time Auto Loadout Behavior -------
    // ==============================================

    async enableAutoLoadout() {
        const self = this;

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
            this.#_delegateAddHandler = async (e: Event) => { await self.#addCodeButtonHandler(e); };
        }

        if (!this.#_delegateTimeHandler) {
            this.#_delegateTimeHandler = async (e: Event) => { await self.#timeCodeButtonHandler(e); };
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
        const originalLoadout = this.activeLoadout;
        const originalLoadoutBtn = this.quickbar.getClonedButtonRef(originalLoadout);
        const addLoadoutSetting = HSSettings.getSetting('autoLoadoutAdd') as HSSelectStringSetting;

        if (originalLoadoutBtn && addLoadoutSetting) {
            const addLoadout = HSAmbrosiaHelper.convertSettingLoadoutToSlot(addLoadoutSetting.getValue());
            const addLoadoutBtn = this.quickbar.getClonedButtonRef(addLoadout);
            if (!addLoadout || !addLoadoutBtn) { HSLogger.warn('Invalid autoLoadoutAdd setting - cannot resolve addLoadout or loadoutSlot', this.context); return; }

            // Switch to add loadout
            HSAmbrosiaHelper.ensureLoadoutMode('LOAD');
            addLoadoutBtn.click();

            // Let the game process the click
            await HSUtils.waitForNextTack(2);

            // Restore loadout
            if (originalLoadout !== addLoadout) {
                originalLoadoutBtn.click();
            }
        }
    }

    async #timeCodeButtonHandler(e: Event) {
        const originalLoadout = this.activeLoadout;
        const originalLoadoutBtn = this.quickbar.getClonedButtonRef(originalLoadout);
        const timeLoadoutSetting = HSSettings.getSetting('autoLoadoutTime') as HSSelectStringSetting;

        if (originalLoadoutBtn && timeLoadoutSetting) {
            const timeLoadout = HSAmbrosiaHelper.convertSettingLoadoutToSlot(timeLoadoutSetting.getValue());
            const timeLoadoutBtn = this.quickbar.getClonedButtonRef(timeLoadout);
            if (!timeLoadout || !timeLoadoutBtn) { HSLogger.warn('Invalid autoLoadoutTime setting - cannot resolve timeLoadout or loadoutSlot', this.context); return; }

            // Switch to time loadout
            HSAmbrosiaHelper.ensureLoadoutMode('LOAD');
            timeLoadoutBtn.click();
            
            // Let the game process the click
            await HSUtils.waitForNextTack(2);

            // Restore loadout
            if (originalLoadout !== timeLoadout) {
                originalLoadoutBtn.click();
            }
        }
    }


    // ==============================================
    // ---------------- Persistence -----------------
    // ==============================================

    async saveState(): Promise<any> {
        const storageModule = HSModuleManager.getModule('HSStorage') as HSStorage;

        if (storageModule) {
            const payload = {
                activeLoadout: this.activeLoadout ?? null
            };
            storageModule.setData(HSGlobal.HSAmbrosia.storageKey, JSON.stringify(payload));
        } else {
            HSLogger.warn(`saveState - Could not find storage module`, this.context);
        }
    }

    async loadState(): Promise<void> {
        const storageModule = HSModuleManager.getModule('HSStorage') as HSStorage;

        if (storageModule) {
            const data = storageModule.getData(HSGlobal.HSAmbrosia.storageKey);

            if (!data) {
                HSLogger.warn(`loadState - No data found`, this.context);
                return;
            }

            let parsedData: any = data;
            if (typeof data === 'string') {
                try {
                    parsedData = JSON.parse(data);
                } catch {
                    // TEMPORARY:Legacy raw string format may be stored directly as the active loadout value.
                    this.activeLoadout = HSAmbrosiaHelper.resolveAmbrosiaLoadout(data);
                    return;
                }
            }

            try {
                if (parsedData && typeof parsedData === 'object' && !Array.isArray(parsedData)) {
                    if (parsedData.activeLoadout) {
                        this.activeLoadout = HSAmbrosiaHelper.resolveAmbrosiaLoadout(parsedData.activeLoadout);
                    } else {
                        this.activeLoadout = undefined;
                    }
                }
            } catch (e) {
                HSLogger.warn(`loadState - Error parsing data`, this.context);
                return;
            }
        } else {
            HSLogger.warn(`loadState - Could not find storage module`, this.context);
        }
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
        let previouslyActiveLoadout: AMBROSIA_LOADOUT_SLOT | undefined = this.activeLoadout;
        let text: string | undefined;
        let importedCount = 0;
        let skippedCount = 0;
        let failures: { index: number; reason: string }[] = [];
        try {
            text = await navigator.clipboard.readText();

            if (!text || typeof text !== 'string') { HSUI.Notify('Clipboard does not contain valid loadout data', { notificationType: 'warning' }); return; }

            // Split clipboard by lines and preserve exact raw line structure
            const rawLines = text.split('\n').map(line => line.trim());

            // Validate we have between 1 and 16 lines/loadouts (empty line = no loadout imported at this spot)
            if (rawLines.length === 0 || rawLines.length > 16) { HSUI.Notify(`Invalid number of loadouts: ${rawLines.length}. Expected 1 - 16.`, { notificationType: 'warning' }); return; }

            const hasValidLoadoutLine = rawLines.some(line => line !== '');
            if (!hasValidLoadoutLine) { HSUI.Notify('Clipboard does not contain valid loadout data', { notificationType: 'warning' }); return; }

            const isActiveLoadoutImport = rawLines[0] !== '' && (rawLines.length === 1 || (rawLines.length === 2 && rawLines[1] === ''));
            let fileInput = this.#importBlueberriesInput ?? document.getElementById('importBlueberries') as HTMLInputElement;
            if (!this.#importBlueberriesInput && fileInput) { this.#importBlueberriesInput = fileInput; }

            let modeToggle = this.#blueberryToggleModeButton ?? document.getElementById('blueberryToggleMode') as HTMLButtonElement;
            if (!this.#blueberryToggleModeButton && modeToggle) { this.#blueberryToggleModeButton = modeToggle; }

            if (!fileInput) { throw new Error('Import input element not found'); }
            if (!modeToggle) { throw new Error('Mode toggle button not found'); }

            HSAmbrosiaHelper.ensureLoadoutMode('SAVE');

            importedCount = 0;
            skippedCount = 0;

            const loadoutsSlots = this.#loadoutsSlots;
            failures = [];

            if (isActiveLoadoutImport) {
                if (!previouslyActiveLoadout) {
                    HSLogger.warn('Could not resolve active loadout for one-line import', this.context);
                } else {
                    const previousLoadoutBtn = this.quickbar.getOriginalButtonRef(previouslyActiveLoadout);
                    if (!previousLoadoutBtn) {
                        HSLogger.warn('Could not resolve original button for previously active loadout', this.context);
                    } else {
                        const { success, reason } = await this.#importQuickLoadoutLine(rawLines[0], previousLoadoutBtn, fileInput);
                        if (success) {
                            importedCount++;
                        } else {
                            failures.push({ index: 1, reason });
                        }
                    }
                }
            } else {
                for (let i = 0; i < rawLines.length; i++) {
                    const loadoutData = rawLines[i];
                    if (!loadoutData) {
                        skippedCount++;
                        continue;
                    }

                    const loadoutBtn = loadoutsSlots[i] as HTMLButtonElement | null;
                    if (!loadoutBtn) {
                        HSLogger.warn(`Loadout slot element for index ${i} not found`, this.context);
                        continue;
                    }

                    const { success, reason } = await this.#importQuickLoadoutLine(loadoutData, loadoutBtn, fileInput);
                    if (success) {
                        importedCount++;
                    } else {
                        failures.push({ index: i + 1, reason });
                    }
                }
            }

            modeToggle.click();

            if (failures.length > 0) {
                const failureSummary = failures.map(f => `#${f.index}: ${f.reason}`).join('; ');
                HSUI.Notify(`Imported ${importedCount} loadout(s); ${failures.length} failed (see logs)`, { notificationType: 'warning' });
                HSLogger.log(`Quick Import detailed failures: ${failureSummary}`, this.context);
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

            HSLogger.error(`Quick Import failed: ${msg} `, this.context, true);
            // Log detailed error context for debugging
            HSLogger.log(`Quick Import exception message: ${msg}; clipboardLen=${text?.length ?? 'n/a'}; imported=${importedCount ?? 0}; skipped=${skippedCount ?? 0}; failures=${JSON.stringify(failures ?? [])}`, this.context);

            HSUI.Notify('Quick Import failed', { notificationType: 'error' });
        } finally {
            // Restore previously active loadout slot
            if (previouslyActiveLoadout) {
                const restoreButton = this.quickbar.getOriginalButtonRef(previouslyActiveLoadout);
                if (restoreButton) {
                    restoreButton.click();
                }
            }
            if (restoreAutoConfirm) {
                autoConfirmSetting.enable();
            }
            if (restoreAfkSwapper) {
                afkSwapperSetting.enable();
            }
            await HSUtils.stopDialogWatcher();
            // cleanup complete
        }
    }

    async #importQuickLoadoutLine(
        loadoutData: string,
        loadoutBtn: HTMLButtonElement,
        fileInput: HTMLInputElement
    ): Promise<{ success: boolean; reason: string }> {
        const blob = new Blob([loadoutData], { type: 'application/json' });
        const file = new File([blob], 'quick-import.json', { type: 'application/json' });
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;

        const event = new Event('change', { bubbles: true });
        fileInput.dispatchEvent(event);

        // Wait for the import alert (the game shows an alert after file selection).
        // If the alert appears but its content is empty, poll a bit longer for text to materialize.
        const alertText = await this.#waitForQuickImportAlertText();
        const success = alertText.toLowerCase().includes('tree successfully imported');

        if (!success) {
            try {
                fileInput.files = new DataTransfer().files;
            } catch { /* ignore */ }
            return { success: false, reason: alertText || 'Unknown error' };
        }

        loadoutBtn.click();
        await this.#waitForQuickImportConfirm();

        return { success: true, reason: '' };
    }

    async #waitForQuickImportAlertText(): Promise<string> {
        let alertText = '';

        for (let attempt = 0; attempt < 50; attempt++) {
            const alertWrapper = document.getElementById('alertWrapper');
            if (alertWrapper && alertWrapper.style.display === 'block') {
                // poll a bit for text just in case
                for (let inner = 0; inner < 40; inner++) {
                    await HSUtils.sleep(5);
                    const scroll = alertWrapper.querySelector('.scrollbar');
                    const candidate = (scroll && scroll.textContent)
                        ? scroll.textContent.trim()
                        : (alertWrapper.textContent || '').trim();
                    if (candidate.length > 0) {
                        alertText = candidate;
                        break;
                    }
                }

                const okAlert = document.getElementById('ok_alert') as HTMLButtonElement | null;
                if (okAlert) {
                    okAlert.click();
                }

                // Wait for it to close
                for (let clearWait = 0; clearWait < 20; clearWait++) {
                    await HSUtils.sleep(5);
                    const currentAlertWrapper = document.getElementById('alertWrapper');
                    if (!currentAlertWrapper || currentAlertWrapper.style.display !== 'block') {
                        break;
                    }
                    const retryOkAlert = document.getElementById('ok_alert') as HTMLButtonElement | null;
                    // Re-click if stuck
                    if (retryOkAlert) {
                        retryOkAlert.click();
                    }
                }

                break;
            }
            await HSUtils.sleep(5);
        }

        return alertText;
    }

    async #waitForQuickImportConfirm(): Promise<void> {
        for (let attempt = 0; attempt < 50; attempt++) {
            const confirmWrapper = document.getElementById('confirmWrapper');
            if (confirmWrapper && confirmWrapper.style.display === 'block') {
                const okConfirm = document.getElementById('ok_confirm') as HTMLButtonElement | null;
                if (okConfirm) {
                    okConfirm.click();
                }

                for (let clearWait = 0; clearWait < 20; clearWait++) {
                    await HSUtils.sleep(5);
                    const currentConfirmWrapper = document.getElementById('confirmWrapper');
                    if (!currentConfirmWrapper || currentConfirmWrapper.style.display !== 'block') {
                        break;
                    }
                    const retryOkConfirm = document.getElementById('ok_confirm') as HTMLButtonElement | null;
                    if (retryOkConfirm) {
                        retryOkConfirm.click();
                    }
                }

                break;
            }
            await HSUtils.sleep(5);
        }
    }


    // ==============================================
    // -------- AFK/Idle Swapper & Game Data --------
    // ==============================================

    async enableIdleSwap() {
        HSLogger.debug(() => 'Enabling Ambrosia Idle Swap', this.context);
        const self = this;
        const gameStateMod = HSModuleManager.getModule<HSGameState>('HSGameState');

        this.#cachedNormalLuckBlueBarRequired = undefined;
        this.#cachedNormalLuckLoadoutValue = undefined;
        this.#initIdleSwapSettingsCache();

        if (gameStateMod) {
            const isAlreadyInAmbrosiaView =
                gameStateMod.getCurrentUIView('MAIN_VIEW').getId() === MAIN_VIEW.SINGULARITY
                && gameStateMod.getCurrentUIView('SINGULARITY_VIEW').getId() === SINGULARITY_VIEW.AMBROSIA;

            if (!isAlreadyInAmbrosiaView) {
                await gameStateMod.refreshCurrentViewsFromDOM();
            }

            this.#gameStateMainViewSubscriptionId = gameStateMod.subscribeGameStateChange('MAIN_VIEW', this.#gameStateCallbackMain.bind(this));
            this.#gameStateSubViewSubscriptionId = gameStateMod.subscribeGameStateChange('SINGULARITY_VIEW', async (previousView: GameView<VIEW_TYPE>, currentView: GameView<VIEW_TYPE>) => {
                if (currentView.getId() === SINGULARITY_VIEW.AMBROSIA) {
                    await this.#activateIdleSwapForCurrentSingularityAmbrosiaView();
                } else {
                    this.#isIdleSwapEnabled = false;
                    this.#cachedNormalLuckBlueBarRequired = undefined;
                    this.#cachedNormalLuckLoadoutValue = undefined;
                    this.#removeIdleLoadoutIndicator();
                    this.unsubscribeGameDataChanges();
                }
            });

            // If we're already in the ambrosia view, activate idle swap immediately.
            if (gameStateMod.getCurrentUIView("MAIN_VIEW").getId() === MAIN_VIEW.SINGULARITY) {
                void this.#activateIdleSwapForCurrentSingularityAmbrosiaView();
            }
        } else {
            HSLogger.warn('HSAmbrosia.enableIdleSwap() - gameStateMod==undefined', 'hs-enable-idleswap-gamestate');
        }

        if (!this.#debugElement)
            this.#debugElement = document.querySelector('#hs-panel-debug-gamedata-currentambrosia') as HTMLDivElement;
    }

    async #activateIdleSwapForCurrentSingularityAmbrosiaView(): Promise<void> {
        const gameStateMod = HSModuleManager.getModule<HSGameState>('HSGameState');
        if (!gameStateMod) {
            return;
        }

        let isInAmbrosiaView =
            gameStateMod.getCurrentUIView('MAIN_VIEW').getId() === MAIN_VIEW.SINGULARITY
            && gameStateMod.getCurrentUIView('SINGULARITY_VIEW').getId() === SINGULARITY_VIEW.AMBROSIA;

        if (!isInAmbrosiaView) {
            return;
        }

        this.#blueAmbrosiaProgressBar = await HSElementHooker.HookElement('#ambrosiaProgressBar') as HTMLDivElement;
        this.#redAmbrosiaProgressBar = await HSElementHooker.HookElement('#pixelProgressBar') as HTMLDivElement;
        this.#cacheIdleSwapLoadoutButtons();
        this.#isIdleSwapEnabled = true;
        this.#maybeInsertIdleLoadoutIndicator();
        this.subscribeGameDataChanges();
    }

    disableIdleSwap() {
        this.#isIdleSwapEnabled = false;
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
        this.unsubscribeGameDataChanges();

        const gameStateMod = HSModuleManager.getModule<HSGameState>('HSGameState');

        if (gameStateMod) {
            if (this.#gameStateMainViewSubscriptionId) {
                gameStateMod.unsubscribeGameStateChange('MAIN_VIEW', this.#gameStateMainViewSubscriptionId);
                this.#gameStateMainViewSubscriptionId = undefined;
            }

            if (this.#gameStateSubViewSubscriptionId) {
                gameStateMod.unsubscribeGameStateChange('SINGULARITY_VIEW', this.#gameStateSubViewSubscriptionId);
                this.#gameStateSubViewSubscriptionId = undefined;
            }
        } else {
            HSLogger.warnOnce('HSAmbrosia.disableIdleSwap() - gameStateMod==undefined', 'hs-disable-idleswap-gamestate');
        }

        this.#removeIdleLoadoutIndicator();
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
            // Only actually unsubscribe if all ambrosia feature which use GDS are disabled
            if (!this.#isIdleSwapEnabled && !this.#berryMinibarsEnabled) {
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

            if (this.#isIdleSwapEnabled) {
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

    #gameStateCallbackMain(previousView: GameView<VIEW_TYPE>, currentView: GameView<VIEW_TYPE>) {
        const gameStateMod = HSModuleManager.getModule<HSGameState>('HSGameState');

        if (gameStateMod) {
            if (currentView.getId() === MAIN_VIEW.SINGULARITY) {
                void this.#activateIdleSwapForCurrentSingularityAmbrosiaView();
            }

            if (previousView.getId() === MAIN_VIEW.SINGULARITY &&
                currentView.getId() !== MAIN_VIEW.SINGULARITY &&
                gameStateMod.getCurrentUIView("SINGULARITY_VIEW").getId() === SINGULARITY_VIEW.AMBROSIA
            ) {
                this.#isIdleSwapEnabled = false;
            }
        } else {
            HSLogger.warnOnce('HSAmbrosia.gameStateCallbackMain() - gameStateMod==undefined', 'hs-amb-gamestate-cb');
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
