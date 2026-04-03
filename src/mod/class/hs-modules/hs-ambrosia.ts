import { HSGameDataSubscriber, HSModuleOptions, HSPersistable } from "../../types/hs-types";
import { AmbrosiaUpgradeCalculationCollection, AmbrosiaUpgradeCalculationConfig } from "../../types/data-types/hs-gamedata-api-types";
import { AmbrosiaUpgradeData, AmbrosiaUpgrades, PlayerData } from "../../types/data-types/hs-player-savedata";
import { AMBROSIA_ICON, AMBROSIA_LOADOUT_SLOT, HSAmbrosiaLoadoutState } from "../../types/module-types/hs-ambrosia-types";
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
import { HSStorage } from "../hs-core/hs-storage";
import { HSUI } from "../hs-core/hs-ui";
import { HSUtils } from "../hs-utils/hs-utils";
import { HSGameDataAPI } from "../hs-core/gds/hs-gamedata-api";
import { HSAmbrosiaHelper } from "./hs-ambrosiaHelper";
import minibarCSS from "inline:../../resource/css/module/hs-ambrosia.css";

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

    #ambrosiaGrid: HTMLElement | null = null;
    #loadoutsSlots: HTMLElement[] = [];

    #loadoutContainer: HTMLElement | null = null;
    #pageHeader: HTMLElement | null = null;

    #loadoutState: HSAmbrosiaLoadoutState = new Map<AMBROSIA_LOADOUT_SLOT, AMBROSIA_ICON>();

    activeLoadout?: AMBROSIA_LOADOUT_SLOT;

    public quickbar: HSAmbrosiaQuickbar;

    #_delegateAddHandler?: (e: Event) => Promise<void>;
    #_delegateTimeHandler?: (e: Event) => Promise<void>;

    #quickbarCSS = `
        #${HSGlobal.HSAmbrosia.quickBarId} > .blueberryLoadoutSlot:hover {
            filter: brightness(150%);
        }
    `;

    #quickbarCSSId = 'hs-ambrosia-quickbar-css';
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

    #idleLoadoutCSSId = 'hs-ambrosia-idle-loadout-css';
    #minibarCSSId = 'hs-ambrosia-minibar-css';

    #isIdleSwapEnabled = false;
    #blueAmbrosiaProgressBar?: HTMLDivElement;
    #redAmbrosiaProgressBar?: HTMLDivElement;

    #debugElement?: HTMLDivElement;

    #berryMinibarsEnabled = false;
    #blueProgressMinibarElement?: HTMLDivElement;
    #redProgressMinibarElement?: HTMLDivElement;


    // ==============================================
    // -------------------- Init --------------------
    // ==============================================

    constructor(moduleOptions: HSModuleOptions) {
        super(moduleOptions);
        this.quickbar = new HSAmbrosiaQuickbar(this);
    }

    async init() {
        HSLogger.log(`Initializing HSAmbrosia module`, this.context);
        HSLogger.debug('init() called', this.context);

        await this.#initializeDomRefs();
        this.#ensureDragDropBindings();

        await this.loadState();

        await this.quickbar.init();

        await this.#createPersistentMinibars();

        await this.#injectImportFromClipboardButton();
        this.#setupLoadoutContainerEvents();

        this.isInitialized = true;
        HSSettings.refreshAmbrosiaLoadoutDropdowns();
    }

    async #initializeDomRefs() {
        const [ambrosiaGrid, loadoutsSlots, loadoutContainer, pageHeader] = await Promise.all([
            HSElementHooker.HookElement('#blueberryUpgradeContainer'),
            HSElementHooker.HookElements('.blueberryLoadoutSlot'),
            HSElementHooker.HookElement('#bbLoadoutContainer'),
            HSElementHooker.HookElement('header')
        ]);
        this.#ambrosiaGrid = ambrosiaGrid;
        this.#loadoutsSlots = loadoutsSlots;
        this.#loadoutContainer = loadoutContainer;
        this.#pageHeader = pageHeader;
    }

    #setupAmbrosiaIconsDragDrop() {
        for (const [id, icon] of HSGlobal.HSAmbrosia.ambrosiaLoadoutIcons.entries()) {
            const amrosiaGridElement = document.querySelector(`#${icon.draggableIconId}`) as HTMLElement;
            if (amrosiaGridElement) {
                amrosiaGridElement.draggable = true;
                amrosiaGridElement.dataset.hsid = id;
                amrosiaGridElement.addEventListener('dragstart', (e) => {
                    if (!e.dataTransfer) return;
                    const id = (e.currentTarget as HTMLElement)?.dataset.hsid;
                    if (!id) return;
                    HSLogger.log(`Drag start ${id}`, this.context);
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('hs-amb-drag', id);
                });
            }
        }
    }

    #ensureDragDropBindings() {
        this.#setupAmbrosiaIconsDragDrop();
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

        this.#loadoutContainer.delegateEventListener('dragenter', '.blueberryLoadoutSlot', this.#onLoadoutDragEnter);
        this.#loadoutContainer.delegateEventListener('dragover', '.blueberryLoadoutSlot', this.#onLoadoutDragOver);
        this.#loadoutContainer.delegateEventListener('drop', '.blueberryLoadoutSlot', this.#onLoadoutDrop.bind(this));
        this.#loadoutContainer.delegateEventListener('contextmenu', '.blueberryLoadoutSlot', this.#onLoadoutContextMenu.bind(this));
        this.#loadoutContainer.delegateEventListener('click', '.blueberryLoadoutSlot', this.#onLoadoutClick.bind(this));
    }

    #onLoadoutDragEnter(e: DragEvent) {
        if (e.dataTransfer && e.dataTransfer.types.includes('hs-amb-drag')) {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.effectAllowed = 'move';
        }
    }

    #onLoadoutDragOver(e: DragEvent) {
        if (e.dataTransfer && e.dataTransfer.types.includes('hs-amb-drag')) {
            e.preventDefault();
            e.stopPropagation();
            e.dataTransfer.effectAllowed = 'move';
        }
    }

    async #onLoadoutDrop(e: DragEvent) {
        // Handle dropping an ambrosia icon onto a loadout slot.
        // This method purely translates drag context into model state then persists.
        const target = e.target as HTMLButtonElement;
        if (!e.dataTransfer || !e.dataTransfer.types.includes('hs-amb-drag') || !target) return;

        e.preventDefault();
        e.stopPropagation();

        const iconEnum = HSAmbrosiaHelper.getIconEnumById(e.dataTransfer.getData('hs-amb-drag'));
        const slotElementId = target.dataset.originalId || target.id;

        if (!iconEnum) {
            HSLogger.warn(`Invalid icon ID: ${iconEnum}`, this.context);
            return;
        }

        if (!HSGlobal.HSAmbrosia.ambrosiaLoadoutIcons.has(iconEnum)) {
            HSLogger.warn(`Could not find loadout slot entry for ${iconEnum}`, this.context);
            return;
        }

        if (!target.classList.contains('blueberryLoadoutSlot')) {
            return;
        }

        if (!slotElementId) return;

        const slotEnum = HSAmbrosiaHelper.getSlotEnumBySlotId(slotElementId);
        if (!slotEnum) {
            HSLogger.warn(`Invalid slot ID: ${slotElementId}`, this.context);
            return;
        }

        const icon = HSGlobal.HSAmbrosia.ambrosiaLoadoutIcons.get(iconEnum);
        if (!icon) {
            HSLogger.warn(`Could not find icon for ${iconEnum}`, this.context);
            return;
        }

        this.#applyIconToSlot(slotEnum, iconEnum);
        this.#loadoutState.set(slotEnum, iconEnum);
        this.saveState();
        await this.updateQuickBar();
    }

    async #onLoadoutContextMenu(e: MouseEvent) {
        e.preventDefault();
        const slotElement = e.target as HTMLButtonElement;
        if (!slotElement) return;

        const slotElementId = slotElement.id;
        const slotEnum = HSAmbrosiaHelper.getSlotEnumBySlotId(slotElementId);
        if (!slotEnum) {
            HSLogger.warn(`No slot enum found for slot ID: ${slotElementId}`, this.context);
            return;
        }

        const iconEnum = this.#loadoutState.get(slotEnum);
        if (!iconEnum) {
            HSLogger.warn(`No icon found for slot ID: ${slotElementId}`, this.context);
            return;
        }

        slotElement.classList.remove('hs-ambrosia-slot');
        slotElement.style.backgroundImage = '';
        this.#loadoutState.delete(slotEnum);
        this.saveState();
        await this.updateQuickBar();
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

    getLoadoutState(): HSAmbrosiaLoadoutState {
        return this.#loadoutState;
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
            HSLogger.debug('Minibar wrapper already exists in group wrapper', this.context);
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
            document.querySelector('#bbLoadoutContainer'),
            document.querySelector('#hs-ambrosia-quick-loadout-container') // Just in case
        ];

        containers.forEach(container => {
            if (container) {
                container.querySelectorAll('.hs-rainbow-border').forEach(slot => {
                    slot.classList.remove('hs-rainbow-border');
                });
            }
        });

        HSLogger.log('Ambrosia loadout state reset (Storage Updated)', this.context);
    }

    async setActiveLoadout(slotNumber: number, forceUpdate: boolean = false) {
        // Ensure quickbar section is injected before manipulating DOM
        await HSQuickbarManager.getInstance().whenSectionInjected('ambrosia');
        // Dynamically resolve slot id
        const slotId = `blueberryLoadout${slotNumber}`;
        const slotElement = this.#loadoutsSlots.find(slot => slot.id === slotId);
        if (!slotElement) {
            HSLogger.warn(`Invalid loadout slot sent to setActiveLoadout: ${slotNumber}`, this.context);
            return;
        }
        const slotEnum = HSAmbrosiaHelper.getSlotEnumBySlotId(slotId);
        if (!slotEnum) {
            HSLogger.warn(`No slot enum found for slot ID: ${slotId}`, this.context);
            return;
        }
        // Only update if the slot is not already active, or if forceUpdate is true
        if (this.activeLoadout !== slotEnum || forceUpdate) {
            this.activeLoadout = slotEnum;
            // Update Visuals
            await this.#updateActiveLoadout(slotEnum);
            HSLogger.log(`Programmatically set active loadout to ${slotNumber}`, this.context);
        }
    }

    async #updateActiveLoadout(slotEnum?: AMBROSIA_LOADOUT_SLOT) {
        if (!slotEnum) {
            HSLogger.warn('No slot specified to #updateActiveLoadout', this.context);
            return;
        }

        // Normalize & validate incoming slot value using helper.
        const resolvedSlot = HSAmbrosiaHelper.resolveAmbrosiaLoadout(slotEnum);
        if (!resolvedSlot) {
            HSLogger.warn('Invalid or unknown slot passed to #updateActiveLoadout: ' + slotEnum, this.context);
            return;
        }

        this.activeLoadout = resolvedSlot;

        await HSQuickbarManager.getInstance().whenSectionInjected('ambrosia');

        const slotNumber = HSAmbrosiaHelper.getLoadoutNumberFromSlot(resolvedSlot);
        if (!slotNumber) {
            HSLogger.warn('Could not parse loadout number from resolvedSlot:' + resolvedSlot, this.context);
            return;
        }

        await this.#syncQuickbarActiveSlot(slotNumber);
        await this.#syncOriginalBarActiveSlot(slotNumber);

        HSLogger.debug('Switched Ambrosia loadout to ' + resolvedSlot, this.context);
    }

    async #syncQuickbarActiveSlot(slotNumber: number) {
        const groupWrapper = HSQuickbarManager.getInstance().getSection('ambrosia');
        if (!groupWrapper) {
            HSLogger.warn('Could not find group wrapper for quickbar', this.context);
            return;
        }
        const quickBar = groupWrapper.querySelector(`#${HSGlobal.HSAmbrosia.quickBarId}`) as HTMLElement;
        if (!quickBar) {
            HSLogger.warn('Could not find quickbar element', this.context);
            return;
        }

        const slots = quickBar.querySelectorAll('.blueberryLoadoutSlot');
        slots.forEach((slot) => slot.classList.remove('hs-rainbow-border'));

        const targetId = `hs-ambrosia-quickbar-blueberryLoadout${slotNumber}`;
        const activeSlot = quickBar.querySelector(`#${targetId}`);
        if (activeSlot) {
            activeSlot.classList.add('hs-rainbow-border');
        } else {
            HSLogger.warn(`No activeSlot found in quickBar for slot ${slotNumber}`, this.context);
        }
    }

    async #syncOriginalBarActiveSlot(slotNumber: number) {
        const originalQuickBar = document.querySelector('#bbLoadoutContainer');
        if (!originalQuickBar) {
            HSLogger.warn('Could not find original quickbar container', this.context);
            return;
        }

        const slots = originalQuickBar.querySelectorAll('.blueberryLoadoutSlot');
        slots.forEach((slot) => slot.classList.remove('hs-rainbow-border'));

        const targetId = `blueberryLoadout${slotNumber}`;
        const activeSlot = originalQuickBar.querySelector(`#${targetId}`);
        if (activeSlot) {
            activeSlot.classList.add('hs-rainbow-border');
        } else {
            HSLogger.warn(`No activeSlot found in originalQuickBar for slot ${slotNumber}`, this.context);
        }
    }

    private calculateAmbUpgradeLevelFromSave(upgradeName: keyof AmbrosiaUpgrades, invested: number, saveData: PlayerData): number {
        const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        if (!gameDataAPI) return 0;

        const investmentParameters = ((gameDataAPI.R_ambrosiaUpgradeCalculationCollection as AmbrosiaUpgradeCalculationCollection)[upgradeName]) as AmbrosiaUpgradeCalculationConfig<any>;
        if (!investmentParameters) return 0;

        return gameDataAPI.investToAmbrosiaUpgrade(
            0,
            invested,
            investmentParameters.costPerLevel,
            investmentParameters.maxLevel,
            investmentParameters.costFunction
        );
    }

    public findBestMatchingAmbrosiaLoadout(saveData: PlayerData): { id: string | undefined; score: number } {
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
                const totalLevel = currentLevelData ? this.calculateAmbUpgradeLevelFromSave(upgradeKey as keyof AmbrosiaUpgrades, currentLevelData.ambrosiaInvested, saveData) : 0;

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

    public performInitialActiveLoadoutMatch(saveData: PlayerData): void {
        if (!saveData) return;

        this.resetActiveLoadout();

        const { id: bestMatchId, score: highestScore } = this.findBestMatchingAmbrosiaLoadout(saveData);
        const SIMILARITY_THRESHOLD = 0.8;

        if (bestMatchId && highestScore >= SIMILARITY_THRESHOLD) {
            HSLogger.debug(`Initial load - BEST MATCH: Loadout ${bestMatchId} is ${(highestScore * 100).toFixed(1)}% compliant.`, this.context);
            this.setActiveLoadout(parseInt(bestMatchId, 10), true);
        } else if (bestMatchId) {
            HSLogger.debug(`Initial load - No compliant loadout found. Closest was ${bestMatchId} at ${(highestScore * 100).toFixed(1)}% (Threshold: 80%).`, this.context);
        } else {
            HSLogger.debug(`Initial load - No saved loadouts found to match.`, this.context);
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

    #applyIconToSlot(slot: AMBROSIA_LOADOUT_SLOT, iconEnum: AMBROSIA_ICON) {
        const slotElement = document.querySelector(`[id="${slot}"]`) as HTMLElement;

        if (!slotElement) {
            HSLogger.warn(`Could not find slot element for ${slot}`, this.context);
            return;
        }

        const icon = HSGlobal.HSAmbrosia.ambrosiaLoadoutIcons.get(iconEnum);

        if (!icon) {
            HSLogger.warn(`Could not find icon for ${iconEnum}`, this.context);
            return;
        }

        slotElement.classList.add('hs-ambrosia-slot');
        slotElement.style.backgroundImage = `url(${icon.url})`;
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

        const promises = [
            HSElementHooker.HookElement('#addCode'),
            HSElementHooker.HookElement('#addCodeAll'),
            HSElementHooker.HookElement('#addCodeOne'),
            HSElementHooker.HookElement('#timeCode')
        ];

        const results = await Promise.allSettled(promises);

        const buttons = results.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value as HTMLButtonElement;
            } else {
                return null;
            }
        });

        if (buttons.some(button => button === null)) {
            HSLogger.warn(`Problem with enabling auto loadout`, this.context);
            return;
        }

        const [addCodeBtn, addCodeAllBtn, addCodeOneBtn, timeButton] = buttons as HTMLButtonElement[];

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
        const promises = [
            HSElementHooker.HookElement('#addCode'),
            HSElementHooker.HookElement('#addCodeAll'),
            HSElementHooker.HookElement('#addCodeOne'),
            HSElementHooker.HookElement('#timeCode')
        ];

        const results = await Promise.allSettled(promises);

        const buttons = results.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value as HTMLButtonElement;
            } else {
                return null;
            }
        });

        if (buttons.some(button => button === null)) {
            HSLogger.warn(`Problem with disabling auto loadout`, this.context);
            return;
        }

        const [addCodeBtn, addCodeAllBtn, addCodeOneBtn, timeButton] = buttons as HTMLButtonElement[];

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
        const activeLoadout = this.activeLoadout;
        const addLoadoutSetting = HSSettings.getSetting('autoLoadoutAdd') as HSSelectStringSetting;

        if (activeLoadout && addLoadoutSetting) {
            const addLoadout = HSAmbrosiaHelper.convertSettingLoadoutToSlot(addLoadoutSetting.getValue());
            const loadoutSlot = await HSElementHooker.HookElement(`#${addLoadout} `) as HTMLButtonElement;

            await HSAmbrosiaHelper.ensureLoadoutModeIsLoad();

            await HSUtils.hiddenAction(async () => {
                loadoutSlot.click();
            });
        }
    }

    async #timeCodeButtonHandler(e: Event) {
        const activeLoadout = this.activeLoadout;
        const timeLoadoutSetting = HSSettings.getSetting('autoLoadoutTime') as HSSelectStringSetting;

        if (activeLoadout && timeLoadoutSetting) {
            const timeLoadout = HSAmbrosiaHelper.convertSettingLoadoutToSlot(timeLoadoutSetting.getValue());
            const loadoutSlot = await HSElementHooker.HookElement(`#${timeLoadout} `) as HTMLButtonElement;

            await HSAmbrosiaHelper.ensureLoadoutModeIsLoad();

            await HSUtils.hiddenAction(async () => {
                loadoutSlot.click();
            });
        }
    }


    // ==============================================
    // ---------------- Persistence -----------------
    // ==============================================

    async saveState(): Promise<any> {
        const storageModule = HSModuleManager.getModule('HSStorage') as HSStorage;

        if (storageModule) {
            const payload = {
                loadoutState: Array.from(this.#loadoutState.entries()),
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
            const data = storageModule.getData(HSGlobal.HSAmbrosia.storageKey) as string;

            if (!data) {
                HSLogger.warn(`loadState - No data found`, this.context);
                return;
            }

            try {
                const parsedData = JSON.parse(data);

                // Backwards-compatible format support:
                // - Old versions stored a plain array of [slot, icon] pairs
                // - New versions store {loadoutState, activeLoadout}
                if (Array.isArray(parsedData)) {
                    this.#loadoutState = new Map(parsedData as [AMBROSIA_LOADOUT_SLOT, AMBROSIA_ICON][]);
                } else if (parsedData && typeof parsedData === 'object') {
                    if (parsedData.loadoutState) {
                        this.#loadoutState = new Map(parsedData.loadoutState as [AMBROSIA_LOADOUT_SLOT, AMBROSIA_ICON][]);
                    }

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
        const importBtn = await HSElementHooker.HookElement(
            '#importBlueberriesButton'
        ) as HTMLButtonElement;

        if (!importBtn) return;

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
        // Quick Import invoked
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
            const lines = text.split('\n').map(line => line.trim());
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

            // Check if we're in SAVE mode and switch to LOAD mode
            const currentMode = modeToggle.innerText;
            // blueberry toggle state

            // If the current mode is SAVE, we need to switch to LOAD mode
            // This is so that the user never accidentally saves a loadout when using the quickbar
            if (currentMode.includes('LOAD ')) {
                // switched blueberry mode to LOAD
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
                    const reason = alertText || 'Unknown error';
                    failures.push({ index: i + 1, reason });
                    // record failure for later reporting

                    // Clear the file input to avoid residual state
                    try {
                        fileInput.files = new DataTransfer().files;
                    } catch (e) {
                        // ignore
                    }

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
                HSUI.Notify(`Imported ${importedCount} loadout(s); ${failures.length} failed (see logs)`, {
                    notificationType: 'warning'
                });
                HSLogger.debug(`Quick Import detailed failures: ${failureSummary}`, this.context);
            } else {
                HSUI.Notify(`Imported ${importedCount} loadout(s), skipped ${skippedCount} empty slot(s)`, {
                    notificationType: 'success'
                });
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
            HSLogger.debug(`Quick Import exception message: ${msg}; clipboardLen=${text?.length ?? 'n/a'}; imported=${importedCount ?? 0}; skipped=${skippedCount ?? 0}; failures=${JSON.stringify(failures ?? [])}`, this.context);

            HSUI.Notify('Quick Import failed', {
                notificationType: 'error'
            });
        } finally {
            await HSUtils.stopDialogWatcher();
            // 🔹 Restore previously active loadout slot
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
        const self = this;
        const gameStateMod = HSModuleManager.getModule<HSGameState>('HSGameState');

        if (gameStateMod) {
            this.#gameStateMainViewSubscriptionId = gameStateMod.subscribeGameStateChange('MAIN_VIEW', this.#gameStateCallbackMain.bind(this));

            this.#gameStateSubViewSubscriptionId = gameStateMod.subscribeGameStateChange('SINGULARITY_VIEW', async (previousView: GameView<VIEW_TYPE>, currentView: GameView<VIEW_TYPE>) => {
                if (currentView.getId() === SINGULARITY_VIEW.AMBROSIA) {
                    this.#blueAmbrosiaProgressBar = await HSElementHooker.HookElement('#ambrosiaProgressBar') as HTMLDivElement;
                    this.#redAmbrosiaProgressBar = await HSElementHooker.HookElement('#pixelProgressBar') as HTMLDivElement;
                    this.#isIdleSwapEnabled = true;
                    this.#maybeInsertIdleLoadoutIndicator();
                    this.subscribeGameDataChanges();

                } else {
                    this.#isIdleSwapEnabled = false;
                    this.#removeIdleLoadoutIndicator();
                    this.unsubscribeGameDataChanges();
                }
            });

            // If we're already in the ambrosia view
            if (gameStateMod.getCurrentUIView("SINGULARITY_VIEW").getId() === SINGULARITY_VIEW.AMBROSIA &&
                gameStateMod.getCurrentUIView("MAIN_VIEW").getId() === MAIN_VIEW.SINGULARITY) {
                this.#blueAmbrosiaProgressBar = await HSElementHooker.HookElement('#ambrosiaProgressBar') as HTMLDivElement;
                this.#redAmbrosiaProgressBar = await HSElementHooker.HookElement('#pixelProgressBar') as HTMLDivElement;
                this.#isIdleSwapEnabled = true;
                this.#maybeInsertIdleLoadoutIndicator();
                this.subscribeGameDataChanges();
            }
        } else {
            HSLogger.warn('HSAmbrosia.enableIdleSwap() - gameStateMod==undefined', 'hs-enable-idleswap-gamestate');
        }

        if (!this.#debugElement)
            this.#debugElement = document.querySelector('#hs-panel-debug-gamedata-currentambrosia') as HTMLDivElement;
    }

    disableIdleSwap() {
        this.#isIdleSwapEnabled = false;
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

    subscribeGameDataChanges() {
        const gameDataMod = HSModuleManager.getModule<HSGameData>('HSGameData');

        if (gameDataMod && !this.gameDataSubscriptionId) {
            this.gameDataSubscriptionId = gameDataMod.subscribeGameDataChange(this.gameDataCallback.bind(this));
            HSLogger.debug('Subscribed to game data changes', this.context);
        }
    }

    unsubscribeGameDataChanges() {
        const gameDataMod = HSModuleManager.getModule<HSGameData>('HSGameData');

        if (gameDataMod && this.gameDataSubscriptionId) {
            // Only actually unsubscribe if all ambrosia feature which use GDS are disabled
            if (!this.#isIdleSwapEnabled && !this.#berryMinibarsEnabled) {
                gameDataMod.unsubscribeGameDataChange(this.gameDataSubscriptionId);
                this.gameDataSubscriptionId = undefined;
                HSLogger.debug('Unsubscribed from game data changes', this.context);
            }
        }
    }

    async gameDataCallback() {
        const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');

        if (!gameDataAPI) return;

        const gameData = gameDataAPI.getGameData();

        if (!gameData) return;

        if (gameData.blueberryTime != null && gameData.redAmbrosiaTime != null) {

            const blueAmbrosiaBarValue = gameData.blueberryTime;
            const redAmbrosiaBarValue = gameData.redAmbrosiaTime;
            const blueAmbrosiaBarMax = gameDataAPI.R_calculateRequiredBlueberryTime();
            const redAmbrosiaBarMax = gameDataAPI.R_calculateRequiredRedAmbrosiaTime();
            const blueAmbrosiaPercent = ((blueAmbrosiaBarValue / blueAmbrosiaBarMax) * 100);
            const redAmbrosiaPercent = ((redAmbrosiaBarValue / redAmbrosiaBarMax) * 100);

            const blueberrySpeedMults = (gameDataAPI.calculateAmbrosiaSpeed() as number);
            const blueberries = (gameDataAPI.R_calculateBlueBerries() as number);
            const ambrosiaSpeed = blueberrySpeedMults * blueberries;
            const ambrosiaAcceleratorCount = gameData.shopUpgrades.shopAmbrosiaAccelerator;
            const ambrosiaLuck = gameDataAPI.calculateLuck() as { additive: number; raw: number; total: number; };
            const bonusAmbrosia = (gameData.singularityChallenges.noAmbrosiaUpgrades.completions > 0) ? 1 : 0
            const ambrosiaGainPerGen = (ambrosiaLuck.total / 100) + bonusAmbrosia;
            const ambrosiaGainChance = (ambrosiaLuck.total - 100 * Math.floor(ambrosiaLuck.total / 100)) / 100;
            let accelerationSeconds = 0;
            let accelerationAmount = 0;
            let accelerationPercent = 0;
            const bluePercentageSpeed = (ambrosiaSpeed / blueAmbrosiaBarMax) * 100;
            const bluePercentageSafeThreshold = bluePercentageSpeed;

            const maxAccelMultiplier = (1 / 2)
                + (3 / 5 - 1 / 2) * +(gameData.singularityChallenges.noAmbrosiaUpgrades.completions >= 15)
                + (2 / 3 - 3 / 5) * +(gameData.singularityChallenges.noAmbrosiaUpgrades.completions >= 19)
                + (3 / 4 - 2 / 3) * +(gameData.singularityChallenges.noAmbrosiaUpgrades.completions >= 20);

            if (ambrosiaAcceleratorCount > 0 && ambrosiaSpeed > 0) {
                const secondsToNextAmbrosia = blueAmbrosiaBarMax / ambrosiaSpeed;
                accelerationSeconds = Math.min(
                    secondsToNextAmbrosia * maxAccelMultiplier,
                    ambrosiaGainPerGen * 0.2 * ambrosiaAcceleratorCount
                );
                accelerationAmount = 1; //accelerationSeconds * ambrosiaSpeed;
                accelerationPercent = (accelerationAmount / blueAmbrosiaBarMax) * 100;
            }

            if (this.#isIdleSwapEnabled) {
                if (this.#blueAmbrosiaProgressBar && this.#redAmbrosiaProgressBar) {
                    const idleSwapLoadoutNormalSetting = HSSettings.getSetting('ambrosiaIdleSwapNormalLoadout') as HSSelectStringSetting;
                    const idleSwapLoadout100Setting = HSSettings.getSetting('ambrosiaIdleSwap100Loadout') as HSSelectStringSetting;

                    if (idleSwapLoadoutNormalSetting && idleSwapLoadout100Setting) {
                        const normalLoadoutValue = idleSwapLoadoutNormalSetting.getValue();
                        const loadout100Value = idleSwapLoadout100Setting.getValue();

                        if (!Number.isInteger(parseInt(normalLoadoutValue, 10)) || !Number.isInteger(parseInt(loadout100Value, 10))) {
                            const idleSwapSetting = HSSettings.getSetting("ambrosiaIdleSwap") as HSSetting<boolean>;

                            if (idleSwapSetting) {
                                idleSwapSetting.disable();
                            }

                            HSLogger.log(`Idle swap was disabled due to unconfigured loadouts`, this.context);
                            return;
                        }

                        const normalLoadout = HSAmbrosiaHelper.convertSettingLoadoutToSlot(idleSwapLoadoutNormalSetting.getValue());
                        const loadout100 = HSAmbrosiaHelper.convertSettingLoadoutToSlot(idleSwapLoadout100Setting.getValue());

                        let blueSwapThresholdNormalMin = bluePercentageSafeThreshold + accelerationPercent;
                        let blueSwapThresholdNormalMax = blueSwapThresholdNormalMin + bluePercentageSafeThreshold;

                        let blueSwapThreshold100Min = 100 - bluePercentageSafeThreshold;
                        let blueSwapThreshold100Max = 100;

                        let redSwapThresholdNormalMin = HSGlobal.HSAmbrosia.idleSwapMinRedThreshold;
                        let redSwapThresholdNormalMax = redSwapThresholdNormalMin + HSGlobal.HSAmbrosia.idleSwapMinRedThreshold;

                        let redSwapThreshold100Min = HSGlobal.HSAmbrosia.idleSwapMaxRedThreshold;
                        let redSwapThreshold100Max = 100;

                        if ((blueAmbrosiaPercent >= blueSwapThreshold100Min && blueAmbrosiaPercent <= blueSwapThreshold100Max) ||
                            (redAmbrosiaPercent >= redSwapThreshold100Min && redAmbrosiaPercent <= redSwapThreshold100Max)) {
                            if (this.activeLoadout !== loadout100) {
                                const loadoutSlot = await HSElementHooker.HookElement(`#${loadout100} `) as HTMLButtonElement;

                                await HSAmbrosiaHelper.ensureLoadoutModeIsLoad();

                                await HSUtils.hiddenAction(async () => {
                                    loadoutSlot.click();
                                });
                            }
                        } else if ((blueAmbrosiaPercent >= blueSwapThresholdNormalMin && blueAmbrosiaPercent <= blueSwapThresholdNormalMax) ||
                            (redAmbrosiaPercent >= redSwapThresholdNormalMin && redAmbrosiaPercent <= redSwapThresholdNormalMax)) {
                            if (this.activeLoadout !== normalLoadout) {
                                const loadoutSlot = await HSElementHooker.HookElement(`#${normalLoadout} `) as HTMLButtonElement;

                                await HSAmbrosiaHelper.ensureLoadoutModeIsLoad();

                                await HSUtils.hiddenAction(async () => {
                                    loadoutSlot.click();
                                });
                            }
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
                        ADD LUK: ${ambrosiaLuck.additive.toFixed(2)} </br>
                        RAW LUK: ${ambrosiaLuck.raw.toFixed(2)} </br>
                        TOT LUK: ${ambrosiaLuck.total.toFixed(2)} </br>
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
            }

            if (this.#berryMinibarsEnabled) {
                if (this.#blueProgressMinibarElement && this.#redProgressMinibarElement) {
                    this.#blueProgressMinibarElement.style.width = `${blueAmbrosiaPercent}% `;
                    this.#redProgressMinibarElement.style.width = `${redAmbrosiaPercent}% `;
                } else {
                    HSLogger.warnOnce(`
        HSAmbrosia.gameDataCallback() - minibar element(s) undefined.
            blue: ${this.#blueProgressMinibarElement},
        red: ${this.#redProgressMinibarElement} `, 'hs-minibars-undefined');
                }
            } else {
                HSLogger.logOnce('HSAmbrosia.gameDataCallback() - berryMinibarsEnabled was false', 'hs-minibars-false');
            }
        }
    };

    #gameStateCallbackMain(previousView: GameView<VIEW_TYPE>, currentView: GameView<VIEW_TYPE>) {
        const gameStateMod = HSModuleManager.getModule<HSGameState>('HSGameState');

        if (gameStateMod) {
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

        if (indicatorExists)
            return;

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
