import { HSGameDataSubscriber, HSModuleOptions, HSPersistable } from "../../types/hs-types";
import { AMBROSIA_ICON, AMBROSIA_LOADOUT_SLOT, HSAmbrosiaLoadoutState } from "../../types/module-types/hs-ambrosia-types";
import { MAIN_VIEW, SINGULARITY_VIEW, VIEW_TYPE } from "../../types/module-types/hs-gamestate-types";
import { HSElementHooker } from "../hs-core/hs-elementhooker";
import { HSGameData } from "../hs-core/gds/hs-gamedata";
import { GameView, HSGameState } from "../hs-core/hs-gamestate";
import { HSGlobal } from "../hs-core/hs-global";
import { HSQuickbarManager } from "./hs-quickbarManager";
import { HSLogger } from "../hs-core/hs-logger";
import { HSModule } from "../hs-core/module/hs-module";
import { HSModuleManager } from "../hs-core/module/hs-module-manager";
import { HSSelectStringSetting, HSSetting } from "../hs-core/settings/hs-setting";
import { QOLButtonsQuickBarSetting, AmbrosiaMinibarsSetting } from "../../types/module-types/hs-settings-types";
import { HSSettings } from "../hs-core/settings/hs-settings";
import { HSStorage } from "../hs-core/hs-storage";
import { HSUI } from "../hs-core/hs-ui";
import { HSUtils } from "../hs-utils/hs-utils";
import { HSGameDataAPI } from "../hs-core/gds/hs-gamedata-api";
import minibarCSS from "inline:../../resource/css/module/hs-ambrosia.css";

export class HSAmbrosia extends HSModule
    implements HSPersistable, HSGameDataSubscriber {

    gameDataSubscriptionId?: string;
    #gameStateMainViewSubscriptionId?: string;
    #gameStateSubViewSubscriptionId?: string;

    #ambrosiaGrid: HTMLElement | null = null;
    #loadOutsSlots: HTMLElement[] = [];

    #loadOutContainer: HTMLElement | null = null;
    #pageHeader: HTMLElement | null = null;

    #loadoutState: HSAmbrosiaLoadoutState = new Map<AMBROSIA_LOADOUT_SLOT, AMBROSIA_ICON>();

    #currentLoadout?: AMBROSIA_LOADOUT_SLOT;

    #_delegateAddHandler?: (e: Event) => Promise<void>;
    #_delegateTimeHandler?: (e: Event) => Promise<void>;

    #quickBarClickHandlers: Map<HTMLButtonElement, (e: Event) => Promise<void>> = new Map<HTMLButtonElement, (e: Event) => Promise<void>>();

    #quickbarCSS = `
        #${HSGlobal.HSAmbrosia.quickBarId} > .blueberryLoadoutSlot:hover {
            filter: brightness(150%);
        }
        
        .hs-ambrosia-active-slot {
            --angle: 0deg;
            border-image: conic-gradient(
                from var(--angle), 
                #ff5e00, 
                #ff9a00, 
                #ffcd00, 
                #e5ff00, 
                #a5ff00, 
                #00ffc8, 
                #00c8ff, 
                #00a5ff, 
                #9500ff, 
                #ff00e1, 
                #ff0095, 
                #ff5e00
            ) 1;
            
            animation: hue-rotate 6s linear infinite;
        }

        @keyframes hue-rotate {
            to {
                --angle: 360deg;
            }
        }

        @property --angle {
            syntax: '<angle>';
            initial-value: 0deg;
            inherits: false;
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

    constructor(moduleOptions: HSModuleOptions) {
        super(moduleOptions);
    }

    async init() {
        HSLogger.log(`Initializing HSAmbrosia module`, this.context);
        HSLogger.debug('[HSAmbrosia]: init() called', this.context);

        // 1. Begin hooking all required DOM elements in parallel
        const [ambrosiaGrid, loadOutsSlots, loadOutContainer, pageHeader] = await Promise.all([
            HSElementHooker.HookElement('#blueberryUpgradeContainer'),
            HSElementHooker.HookElements('.blueberryLoadoutSlot'),
            HSElementHooker.HookElement('#bbLoadoutContainer'),
            HSElementHooker.HookElement('header')
        ]);
        this.#ambrosiaGrid = ambrosiaGrid;
        HSLogger.debug('[HSAmbrosia]: #ambrosiaGrid hooked', this.context);
        this.#loadOutsSlots = loadOutsSlots;
        HSLogger.debug(`[HSAmbrosia]: #loadOutsSlots hooked, count=${this.#loadOutsSlots.length}`, this.context);
        this.#loadOutContainer = loadOutContainer;
        HSLogger.debug(`[HSAmbrosia]: #loadOutContainer hooked: ${!!this.#loadOutContainer}`, this.context);
        this.#pageHeader = pageHeader;
        this.#debugElement = document.querySelector('#hs-panel-debug-gamedata-currentambrosia') as HTMLDivElement;

        // 2. Ensure group wrapper exists and is last child of #quickbarsRow
        if (this.#pageHeader) {
            const quickbarsRow = HSQuickbarManager.ensureQuickbarsRow();
            let groupWrapper = quickbarsRow.querySelector('#hs-ambrosia-group-wrapper') as HTMLElement;
            if (!groupWrapper) {
                groupWrapper = document.createElement('div');
                groupWrapper.id = 'hs-ambrosia-group-wrapper';
                groupWrapper.style.display = 'flex';
                groupWrapper.style.flexDirection = 'column';
                quickbarsRow.appendChild(groupWrapper);
            } else {
                // Move to last child if not already
                if (quickbarsRow.lastChild !== groupWrapper) {
                    quickbarsRow.appendChild(groupWrapper);
                }
            }
        }

        // 3. Register Ambrosia section factory to return group wrapper
        HSQuickbarManager.getInstance().removeSection('ambrosia');
        HSQuickbarManager.getInstance().registerSection('ambrosia', () => {
            HSLogger.debug('[HSAmbrosia]: Ambrosia section factory called', this.context);
            if (!this.#pageHeader) return document.createElement('div');
            const quickbarsRow = HSQuickbarManager.ensureQuickbarsRow();
            let groupWrapper = quickbarsRow.querySelector('#hs-ambrosia-group-wrapper') as HTMLElement;
            if (!groupWrapper) {
                groupWrapper = document.createElement('div');
                groupWrapper.id = 'hs-ambrosia-group-wrapper';
                groupWrapper.style.display = 'flex';
                groupWrapper.style.flexDirection = 'column';
                quickbarsRow.appendChild(groupWrapper);
            }
            // Always ensure it's last child
            if (quickbarsRow.lastChild !== groupWrapper) {
                quickbarsRow.appendChild(groupWrapper);
            }
            return groupWrapper;
        });
        HSQuickbarManager.getInstance().injectSection('ambrosia');

        // 4. Continue with normal setup
        this.loadState();
        await this.#injectImportFromClipboardButton();
        this.#setupLoadoutContainerEvents();
        HSQuickbarManager.getInstance().whenSectionInjected('ambrosia').then(async () => {
            HSLogger.debug('[HSAmbrosia]: whenSectionInjected promise resolved', this.context);
            const groupWrapper = HSQuickbarManager.getInstance().getSection('ambrosia');
            HSLogger.debug(`[HSAmbrosia]: whenSectionInjected: group wrapper present: ${!!groupWrapper}`, this.context);
            if (!groupWrapper) {
                HSLogger.error('[HSAmbrosia]: whenSectionInjected: group wrapper missing after injection!', this.context, true);
                return;
            }
            // Hybrid: Always create quickbar/minibar, then hide/remove based on settings
            HSLogger.debug('[HSAmbrosia]: Creating persistent quickbar/minibar containers after wrapper injection', this.context);
            await this.#createPersistentQuickbarContainer();
            await this.#createPersistentMinibars();
            // Hide/remove based on settings
            const quickbarSetting = HSSettings.getSetting('ambrosiaQuickBar') as HSSetting<boolean>;
            const minibarSetting = HSSettings.getSetting('ambrosiaMinibars') as HSSetting<boolean>;
            const quickbar = groupWrapper.querySelector(`#${HSGlobal.HSAmbrosia.quickBarId}`) as HTMLElement;
            const minibar = groupWrapper.querySelector(`#${HSGlobal.HSAmbrosia.barWrapperId}`) as HTMLElement;
            if (quickbar) {
                if (quickbarSetting && !quickbarSetting.isEnabled()) {
                    quickbar.style.display = 'none';
                    HSLogger.debug('[HSAmbrosia]: quickbar hidden due to settings', this.context);
                } else {
                    quickbar.style.display = '';
                    this.#setupQuickbarSectionEvents();
                    await this.#refreshQuickbarIcons();
                    if (this.#currentLoadout) {
                        await this.#updateCurrentLoadout(this.#currentLoadout);
                    }
                    HSUI.injectStyle(this.#quickbarCSS, this.#quickbarCSSId);
                }
            }
            if (minibar) {
                if (minibarSetting && !minibarSetting.isEnabled()) {
                    minibar.style.display = 'none';
                    HSLogger.debug('[HSAmbrosia]: minibar hidden due to settings', this.context);
                } else {
                    minibar.style.display = 'block';
                    HSLogger.debug('[HSAmbrosia]: minibar shown due to settings', this.context);
                }
            }
        });

        this.isInitialized = true;
    }

    /**
     * Returns a prepared Ambrosia quickbar DOM node for the quickbarsRow. 
     */
    public getQuickbarSection(): HTMLElement {
        if (!this.#loadOutContainer) {
            HSLogger.error('[HSAmbrosia]: getQuickbarSection called but loadOutContainer is not initialized', this.context, true);
            throw new Error('Ambrosia loadout container not initialized');
        }
        HSLogger.debug('[HSAmbrosia]: getQuickbarSection creating quickbar DOM', this.context);
        // Clone and prepare the quickbar section
        const clone = this.#loadOutContainer.cloneNode(true) as HTMLElement;
        clone.id = HSGlobal.HSAmbrosia.quickBarId;
        clone.style.display = '';
        HSLogger.debug(`[HSAmbrosia]: getQuickbarSection: cloned quickbar container, id=${clone.id}`, this.context);
        // Remove settings button if present
        const cloneSettingButton = clone.querySelector('.blueberryLoadoutSetting') as HTMLButtonElement;
        if (cloneSettingButton) {
            HSLogger.debug('[HSAmbrosia]: getQuickbarSection: removed settings button', this.context);
            cloneSettingButton.remove();
        }
        // Prepare slot buttons (IDs, data attributes) dynamically
        const cloneLoadoutButtons = clone.querySelectorAll('.blueberryLoadoutSlot') as NodeListOf<HTMLButtonElement>;
        HSLogger.debug(`[HSAmbrosia]: getQuickbarSection: found ${cloneLoadoutButtons.length} slot buttons`, this.context);
        cloneLoadoutButtons.forEach((button, idx) => {
            const buttonId = button.id;
            button.dataset.originalId = buttonId;
            // Use original id for dynamic slot resolution
            button.id = buttonId;
        });
        return clone;
    }

    /**
     * Sets up event listeners for the quickbar section after injection.
     */
    #setupQuickbarSectionEvents() {
        // Use the injected quickbar section from HSQuickbarManager
        const quickbar = HSQuickbarManager.getInstance().getSection('ambrosia');
        if (!quickbar) return;
        // Remove any previous listeners (if re-injected)
        quickbar.querySelectorAll('.blueberryLoadoutSlot').forEach((button: Element) => {
            const btn = button as HTMLButtonElement;
            btn.replaceWith(btn.cloneNode(true));
        });
        // Re-query after replaceWith
        quickbar.querySelectorAll('.blueberryLoadoutSlot').forEach((button: Element) => {
            const btn = button as HTMLButtonElement;
            const buttonId = btn.dataset.originalId || '';
            const buttonHandler = async (e: Event) => {
                await this.#quickBarClickHandler(e, buttonId);
            };
            btn.addEventListener('click', buttonHandler);
            this.#quickBarClickHandlers.set(btn, buttonHandler);
        });
    }

    /**
     * Sets up drag/drop and slot event listeners for the in-game loadout container.
     */
    #setupLoadoutContainerEvents() {
        if (!this.#loadOutContainer) return;
        const self = this;
        // ...existing code for dragenter, dragover, drop, contextmenu, click on #loadOutContainer...
        this.#loadOutContainer.delegateEventListener('dragenter', '.blueberryLoadoutSlot', (e) => {
            if (e.dataTransfer) {
                if (e.dataTransfer.types.includes('hs-amb-drag')) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.effectAllowed = "move";
                }
            }
        });
        this.#loadOutContainer.delegateEventListener('dragover', '.blueberryLoadoutSlot', (e) => {
            if (e.dataTransfer) {
                if (e.dataTransfer.types.includes('hs-amb-drag')) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.effectAllowed = "move";
                }
            }
        });
        this.#loadOutContainer.delegateEventListener('drop', '.blueberryLoadoutSlot', async (e) => {
            if (e.dataTransfer && e.dataTransfer.types.includes('hs-amb-drag')) {
                e.preventDefault();
                e.stopPropagation();
                const iconEnum = this.#getIconEnumById(e.dataTransfer.getData('hs-amb-drag'));
                const slotElement = e.target as HTMLButtonElement;
                const slotElementId = slotElement.id;
                if (!iconEnum) {
                    HSLogger.warn(`Invalid icon ID: ${iconEnum}`, this.context);
                    return;
                }
                if (!HSGlobal.HSAmbrosia.ambrosiaLoadoutIcons.has(iconEnum)) {
                    HSLogger.warn(`Could not find loadout slot entry for ${iconEnum}`, this.context);
                    return;
                }
                if (!slotElement.classList.contains('blueberryLoadoutSlot')) {
                    return;
                }
                if (!slotElementId) return;
                const slotEnum = this.#getSlotEnumBySlotId(slotElementId);
                if (!slotEnum) {
                    HSLogger.warn(`Invalid slot ID: ${slotElementId}`, this.context);
                    return;
                }
                const icon = HSGlobal.HSAmbrosia.ambrosiaLoadoutIcons.get(iconEnum)!;
                // Apply the icon to the slot and save the state
                this.#applyIconToSlot(slotEnum, iconEnum);
                this.#loadoutState.set(slotEnum, iconEnum);
                this.saveState();
                await self.updateQuickBar();
            }
        });
        this.#loadOutContainer.delegateEventListener('contextmenu', '.blueberryLoadoutSlot', async (e) => {
            e.preventDefault();
            // Clear the slot icon
            const slotElement = e.target as HTMLButtonElement;
            const slotElementId = slotElement.id;
            const slotEnum = this.#getSlotEnumBySlotId(slotElementId);
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
            await self.updateQuickBar();
        });
        this.#loadOutContainer.delegateEventListener('click', '.blueberryLoadoutSlot', async (e) => {
            const slotElement = e.target as HTMLButtonElement;
            const slotElementId = slotElement.id;
            const slotEnum = this.#getSlotEnumBySlotId(slotElementId);
            if (!slotEnum) {
                HSLogger.warn(`No slot enum found for slot ID: ${slotElementId}`, this.context);
                return;
            }
            // Only update if the slot is not already active
            if (this.#currentLoadout !== slotEnum) {
                await self.#updateCurrentLoadout(slotEnum);
            }
        });
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

    async #updateCurrentLoadout(slotEnum: AMBROSIA_LOADOUT_SLOT) {
        this.#currentLoadout = slotEnum;
        const loadoutStateSetting = HSSettings.getSetting('autoLoadoutState') as HSSetting<string>;

        if (loadoutStateSetting && !HSUtils.removeColorTags(loadoutStateSetting.getValue()).startsWith('Loadout')) {
            loadoutStateSetting.setValue(`<green>${slotEnum}</green>`);
        }

        await HSQuickbarManager.getInstance().whenSectionInjected('ambrosia');
        const groupWrapper = HSQuickbarManager.getInstance().getSection('ambrosia');
        if (!groupWrapper) {
            HSLogger.warn('[HSAmbrosia] Could not find group wrapper for quickbar', this.context);
            return;
        }
        const quickBar = groupWrapper.querySelector(`#${HSGlobal.HSAmbrosia.quickBarId}`) as HTMLElement;
        // Normalize slotEnum to get the loadout number
        let slotNum = '';
        const match = slotEnum.match(/(\d+)$/);
        if (match) {
            slotNum = match[1];
        }
        const originalId = `blueberryLoadout${slotNum}`;
        const quickbarId = `hs-ambrosia-quickbar-blueberryLoadout${slotNum}`;
        if (quickBar) {
            const slots = quickBar.querySelectorAll('.blueberryLoadoutSlot');
            slots.forEach((slot) => {
                slot.classList.remove('hs-ambrosia-active-slot');
            });
            const activeSlot = Array.from(slots).find(slot => slot.id === quickbarId);
            if (activeSlot) {
                activeSlot.classList.add('hs-ambrosia-active-slot');
                HSLogger.debug('[HSAmbrosia] Added active class to:' + activeSlot.id, this.context);
            } else {
                HSLogger.warn('[HSAmbrosia] No activeSlot found in quickBar for slotEnum:' + slotEnum + ' quickbarId:' + quickbarId, this.context);
            }
        } else {
            HSLogger.warn('[HSAmbrosia] Could not find quick bar element', this.context);
        }
        const originalQuickBar = document.querySelector('#bbLoadoutContainer');
        if (originalQuickBar) {
            const slots = originalQuickBar.querySelectorAll('.blueberryLoadoutSlot');
            slots.forEach((slot) => {
                slot.classList.remove('hs-ambrosia-active-slot');
            });
            const activeSlot = Array.from(slots).find(slot => slot.id === originalId);
            if (activeSlot) {
                activeSlot.classList.add('hs-ambrosia-active-slot');
                HSLogger.debug('[HSAmbrosia] Added active class to:' + activeSlot.id, this.context);
            } else {
                HSLogger.warn('[HSAmbrosia] No activeSlot found in originalQuickBar for slotEnum:' + slotEnum + ' originalId:' + originalId, this.context);
            }
        }
        HSLogger.debug('[HSAmbrosia] updateCurrentLoadout complete for' + slotEnum, this.context);
    }

    async #createPersistentQuickbarContainer() {
        if (!this.#pageHeader) return;
        const self = this;

        // Check if already exists
        const quickbarsRow = HSQuickbarManager.ensureQuickbarsRow();
        let groupWrapper = quickbarsRow.querySelector('#hs-ambrosia-group-wrapper') as HTMLElement;
        if (!groupWrapper) {
            groupWrapper = document.createElement('div');
            groupWrapper.id = 'hs-ambrosia-group-wrapper';
            groupWrapper.style.display = 'flex';
            groupWrapper.style.flexDirection = 'column';
            quickbarsRow.appendChild(groupWrapper);
        }
        // Move to last child if not already
        if (quickbarsRow.lastChild !== groupWrapper) {
            quickbarsRow.appendChild(groupWrapper);
        }

        // Check if quickbar already exists
        if (groupWrapper.querySelector(`#${HSGlobal.HSAmbrosia.quickBarId}`)) {
            HSLogger.debug('Quickbar already exists in group wrapper', this.context);
            return;
        }

        if (this.#loadOutContainer) {
            const clone = this.#loadOutContainer.cloneNode(true) as HTMLElement;
            clone.id = HSGlobal.HSAmbrosia.quickBarId;
            clone.style.display = 'none';

            const cloneSettingButton = clone.querySelector('.blueberryLoadoutSetting') as HTMLButtonElement;
            const cloneLoadoutButtons = clone.querySelectorAll('.blueberryLoadoutSlot') as NodeListOf<HTMLButtonElement>;

            cloneLoadoutButtons.forEach((button) => {
                const buttonId = button.id;
                button.dataset.originalId = buttonId;
                button.id = `${HSGlobal.HSAmbrosia.quickBarLoadoutIdPrefix}-${buttonId}`;

                const buttonHandler = async function (e: Event) {
                    await self.#quickBarClickHandler(e, buttonId);
                };

                this.#quickBarClickHandlers.set(button, buttonHandler);
                button.addEventListener('click', buttonHandler);
            });

            if (cloneSettingButton) {
                cloneSettingButton.remove();
            }
            // Append quickbar as second child of groupWrapper
            if (groupWrapper.childNodes.length > 0) {
                if (groupWrapper.childNodes.length === 1) {
                    groupWrapper.appendChild(clone);
                } else {
                    groupWrapper.insertBefore(clone, groupWrapper.childNodes[1]);
                }
            } else {
                groupWrapper.appendChild(clone);
            }
            HSUI.injectStyle(this.#quickbarCSS, this.#quickbarCSSId);

            await this.#refreshQuickbarIcons();

            if (this.#currentLoadout) {
                await this.#updateCurrentLoadout(this.#currentLoadout);
            }
        }
    }

    async showQuickBar() {
        await HSQuickbarManager.getInstance().whenSectionInjected('ambrosia');
        const groupWrapper = HSQuickbarManager.getInstance().getSection('ambrosia');
        if (!groupWrapper) {
            HSLogger.warn('Could not find group wrapper for quickbar', this.context);
            return;
        }
        const wrapper = groupWrapper.querySelector(`#${HSGlobal.HSAmbrosia.quickBarId}`) as HTMLElement;
        if (wrapper) {
            wrapper.style.display = '';
            HSUI.injectStyle(this.#quickbarCSS, this.#quickbarCSSId);
            await this.#refreshQuickbarIcons();
            if (this.#currentLoadout) {
                await this.#updateCurrentLoadout(this.#currentLoadout);
            }
        } else {
            HSLogger.warn('Could not find quickbar wrapper', this.context);
        }
    }

    async hideQuickBar() {
        await HSQuickbarManager.getInstance().whenSectionInjected('ambrosia');
        const groupWrapper = HSQuickbarManager.getInstance().getSection('ambrosia');
        if (!groupWrapper) {
            HSLogger.warn('Could not find group wrapper for quickbar', this.context);
            return;
        }
        const wrapper = groupWrapper.querySelector(`#${HSGlobal.HSAmbrosia.quickBarId}`) as HTMLElement;
        const barWrapper = groupWrapper.querySelector(`#${HSGlobal.HSAmbrosia.barWrapperId}`) as HTMLElement;
        if (wrapper) {
            wrapper.style.display = 'none';
            HSUI.removeInjectedStyle(this.#quickbarCSSId);
        }
        if (barWrapper) {
            barWrapper.style.display = 'block'; // Ensure minibars remain visible
        }
    }

    async #refreshQuickbarIcons() {
        const wrapper = this.#pageHeader?.querySelector(`#${HSGlobal.HSAmbrosia.quickBarId}`) as HTMLElement;
        if (wrapper) {
            const quickbarSlots = wrapper.querySelectorAll('.blueberryLoadoutSlot') as NodeListOf<HTMLElement>;
            quickbarSlots.forEach((slot) => {
                const originalSlotId = slot.dataset.originalId;
                if (!originalSlotId) return;
                const slotEnum = this.#getSlotEnumBySlotId(originalSlotId);
                if (!slotEnum) return;
                const iconEnum = this.#loadoutState.get(slotEnum);
                if (iconEnum) {
                    const icon = HSGlobal.HSAmbrosia.ambrosiaLoadoutIcons.get(iconEnum);
                    if (icon) {
                        slot.classList.add('hs-ambrosia-slot');
                        slot.style.backgroundImage = `url(${icon.url})`;
                    }
                } else {
                    slot.classList.remove('hs-ambrosia-slot');
                    slot.style.backgroundImage = '';
                }
            });
        }

        // Update original bar slots
        const originalBar = document.querySelector('#bbLoadoutContainer');
        if (originalBar) {
            const originalSlots = originalBar.querySelectorAll('.blueberryLoadoutSlot') as NodeListOf<HTMLElement>;
            originalSlots.forEach((slot) => {
                const slotEnum = this.#getSlotEnumBySlotId(slot.id);
                if (!slotEnum) return;
                const iconEnum = this.#loadoutState.get(slotEnum);
                if (iconEnum) {
                    const icon = HSGlobal.HSAmbrosia.ambrosiaLoadoutIcons.get(iconEnum);
                    if (icon) {
                        slot.classList.add('hs-ambrosia-slot');
                        slot.style.backgroundImage = `url(${icon.url})`;
                    }
                } else {
                    slot.classList.remove('hs-ambrosia-slot');
                    slot.style.backgroundImage = '';
                }
            });
        }
    }

    #applyIconToQuickbarSlot(slot: AMBROSIA_LOADOUT_SLOT, iconEnum: AMBROSIA_ICON) {
        const quickbarSlotId = `${HSGlobal.HSAmbrosia.quickBarLoadoutIdPrefix}-${slot}`;
        const slotElement = document.querySelector(`[id="${quickbarSlotId}"]`) as HTMLElement;

        if (!slotElement) {
            HSLogger.warn(`Could not find quickbar slot element for ${slot}`, this.context);
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

    #getIconEnumById(iconId: string): AMBROSIA_ICON | undefined {
        return Object.values(AMBROSIA_ICON).find(
            icon => icon === iconId
        ) as AMBROSIA_ICON | undefined;
    }

    #getSlotEnumBySlotId(slotId: string): AMBROSIA_LOADOUT_SLOT | undefined {
        return Object.values(AMBROSIA_LOADOUT_SLOT).find(
            slot => slot === slotId
        ) as AMBROSIA_LOADOUT_SLOT | undefined;
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

    async saveState(): Promise<any> {
        const storageModule = HSModuleManager.getModule('HSStorage') as HSStorage;

        if (storageModule) {
            const serializedState = JSON.stringify(Array.from(this.#loadoutState.entries()));
            storageModule.setData(HSGlobal.HSAmbrosia.storageKey, serializedState);
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
                const parsedData = JSON.parse(data) as [AMBROSIA_LOADOUT_SLOT, AMBROSIA_ICON][];
                this.#loadoutState = new Map(parsedData);
            } catch (e) {
                HSLogger.warn(`loadState - Error parsing data`, this.context);
                return;
            }
        } else {
            HSLogger.warn(`loadState - Could not find storage module`, this.context);
        }

        const loadoutStateSetting = HSSettings.getSetting('autoLoadoutState') as HSSetting<string>;

        if (loadoutStateSetting) {
            if (!this.#currentLoadout) {
                this.#currentLoadout = HSUtils.removeColorTags(loadoutStateSetting.getValue()) as AMBROSIA_LOADOUT_SLOT;
            }
        } else {
            HSLogger.warn(`loadState - Could not find autoLoadoutState setting`, this.context);
        }
    }

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

    // Helper method to hide the quick bar and recreate it (which updates the icons)
    async updateQuickBar() {
        // Ensure quickbar section is injected before manipulating DOM
        await HSQuickbarManager.getInstance().whenSectionInjected('ambrosia');
        const quickbarSetting = HSSettings.getSetting('ambrosiaQuickBar') as HSSetting<boolean>;

        if (quickbarSetting.isEnabled()) {
            await this.#refreshQuickbarIcons();
        }
    }

    async resetActiveLoadout() {
        // Ensure quickbar section is injected before manipulating DOM
        await HSQuickbarManager.getInstance().whenSectionInjected('ambrosia');
        this.#currentLoadout = undefined;

        const loadoutStateSetting = HSSettings.getSetting('autoLoadoutState') as HSSetting<string>;
        if (loadoutStateSetting) {
            loadoutStateSetting.setValue('<red>Unknown</red>');
        }

        // Clear visual state from both containers
        const containers = [
            this.#pageHeader?.querySelector(`#${HSGlobal.HSAmbrosia.quickBarId}`),
            document.querySelector('#bbLoadoutContainer'),
            document.querySelector('#hs-ambrosia-quick-loadout-container') // Just in case
        ];

        containers.forEach(container => {
            if (container) {
                container.querySelectorAll('.hs-ambrosia-active-slot').forEach(slot => {
                    slot.classList.remove('hs-ambrosia-active-slot');
                });
            }
        });

        HSLogger.log('Ambrosia loadout state reset (Storage Updated)', this.context);
    }

    /**
     * Sets the active loadout programmatically.
     * @param slotNumber The loadout number (1...N)
     * @param forceUpdate Whether to force visual update
     */
    async setActiveLoadout(slotNumber: number, forceUpdate: boolean = false) {
        // Ensure quickbar section is injected before manipulating DOM
        await HSQuickbarManager.getInstance().whenSectionInjected('ambrosia');
        // Dynamically resolve slot id
        const slotId = `blueberryLoadout${slotNumber}`;
        const slotElement = this.#loadOutsSlots.find(slot => slot.id === slotId);
        if (!slotElement) {
            HSLogger.warn(`Invalid loadout slot sent to setActiveLoadout: ${slotNumber}`, this.context);
            return;
        }
        const slotEnum = this.#getSlotEnumBySlotId(slotId);
        if (!slotEnum) {
            HSLogger.warn(`No slot enum found for slot ID: ${slotId}`, this.context);
            return;
        }
        // Only update if the slot is not already active, or if forceUpdate is true
        if (this.#currentLoadout !== slotEnum || forceUpdate) {
            this.#currentLoadout = slotEnum;
            // Update Setting (Persistence)
            const loadoutStateSetting = HSSettings.getSetting('autoLoadoutState') as HSSetting<string>;
            if (loadoutStateSetting) {
                loadoutStateSetting.setValue(`<green>Loadout ${slotNumber}</green>`);
            }
            // Update Visuals
            await this.#updateCurrentLoadout(slotEnum);
            HSLogger.log(`Programmatically set active loadout to ${slotNumber}`, this.context);
        }
    }

    async enableAutoLoadout() {
        const self = this;

        const loadoutStateSetting = HSSettings.getSetting('autoLoadoutState') as HSSetting<string>;

        if ((loadoutStateSetting && loadoutStateSetting.getValue().includes('Unknown')) || !this.#currentLoadout) {
            const autoLoadoutSetting = HSSettings.getSetting('autoLoadout') as HSSetting<boolean>;

            if (autoLoadoutSetting && autoLoadoutSetting.isEnabled()) {
                autoLoadoutSetting.disable();
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
        const self = this;

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
        const currentLoadout = this.#currentLoadout;
        const addLoadoutSetting = HSSettings.getSetting('autoLoadoutAdd') as HSSelectStringSetting;

        if (currentLoadout && addLoadoutSetting) {
            const addLoadout = this.#convertSettingLoadoutToSlot(addLoadoutSetting.getValue());
            const loadoutSlot = await HSElementHooker.HookElement(`#${addLoadout} `) as HTMLButtonElement;

            await this.#maybeTurnLoadoutModeToLoad();

            await HSUtils.hiddenAction(async () => {
                loadoutSlot.click();
            });
        }
    }

    async #timeCodeButtonHandler(e: Event) {
        const currentLoadout = this.#currentLoadout;
        const timeLoadoutSetting = HSSettings.getSetting('autoLoadoutTime') as HSSelectStringSetting;

        if (currentLoadout && timeLoadoutSetting) {
            const timeLoadout = this.#convertSettingLoadoutToSlot(timeLoadoutSetting.getValue());
            const loadoutSlot = await HSElementHooker.HookElement(`#${timeLoadout} `) as HTMLButtonElement;

            await this.#maybeTurnLoadoutModeToLoad();

            await HSUtils.hiddenAction(async () => {
                loadoutSlot.click();
            });
        }
    }

    async #quickBarClickHandler(e: Event, buttonId: string) {
        const realButton = document.querySelector(`#${buttonId} `) as HTMLButtonElement;

        if (realButton) {
            await this.#maybeTurnLoadoutModeToLoad();
            await HSUtils.hiddenAction(async () => {
                realButton.click();
            });

        } else {
            HSLogger.warn(`Could not find real button for ${buttonId}`, this.context);
        }
    }

    async #maybeTurnLoadoutModeToLoad() {
        const modeButton = await HSElementHooker.HookElement('#blueberryToggleMode') as HTMLButtonElement;

        if (modeButton) {
            const currentMode = modeButton.innerText;

            // If the current mode is SAVE, we need to switch to LOAD mode
            // This is so that the user never accidentally saves a loadout when using the quickbar
            if (currentMode.includes('SAVE')) {
                modeButton.click();
            }
        }
    }

    #convertSettingLoadoutToSlot(loadoutNumber: string): AMBROSIA_LOADOUT_SLOT | undefined {
        const loadoutEnum = Object.values(AMBROSIA_LOADOUT_SLOT).find(
            slot => slot === `blueberryLoadout${loadoutNumber}`
        ) as AMBROSIA_LOADOUT_SLOT | undefined;

        if (!loadoutEnum) {
            HSLogger.warn(`Could not convert loadout ${loadoutNumber} to slot`, this.context);
        }

        return loadoutEnum;
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

        if (gameData.blueberryTime && gameData.redAmbrosiaTime) {

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
                accelerationAmount = 1//accelerationSeconds * ambrosiaSpeed;
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

                        const normalLoadout = this.#convertSettingLoadoutToSlot(idleSwapLoadoutNormalSetting.getValue());
                        const loadout100 = this.#convertSettingLoadoutToSlot(idleSwapLoadout100Setting.getValue());

                        let blueSwapTresholdNormalMin = bluePercentageSafeThreshold + accelerationPercent;
                        let blueSwapTresholdNormalMax = blueSwapTresholdNormalMin + bluePercentageSafeThreshold;

                        let blueSwapTreshold100Min = 100 - bluePercentageSafeThreshold;
                        let blueSwapTreshold100Max = 100;

                        let redSwapTresholdNormalMin = HSGlobal.HSAmbrosia.idleSwapMinRedTreshold;
                        let redSwapTresholdNormalMax = redSwapTresholdNormalMin + HSGlobal.HSAmbrosia.idleSwapMinRedTreshold;

                        let redSwapTreshold100Min = HSGlobal.HSAmbrosia.idleSwapMaxRedTreshold;
                        let redSwapTreshold100Max = 100;

                        if ((blueAmbrosiaPercent >= blueSwapTreshold100Min && blueAmbrosiaPercent <= blueSwapTreshold100Max) ||
                            (redAmbrosiaPercent >= redSwapTreshold100Min && redAmbrosiaPercent <= redSwapTreshold100Max)) {
                            if (this.#currentLoadout !== loadout100) {
                                const loadoutSlot = await HSElementHooker.HookElement(`#${loadout100} `) as HTMLButtonElement;

                                await this.#maybeTurnLoadoutModeToLoad();

                                await HSUtils.hiddenAction(async () => {
                                    loadoutSlot.click();
                                });
                            }
                        } else if ((blueAmbrosiaPercent >= blueSwapTresholdNormalMin && blueAmbrosiaPercent <= blueSwapTresholdNormalMax) ||
                            (redAmbrosiaPercent >= redSwapTresholdNormalMin && redAmbrosiaPercent <= redSwapTresholdNormalMax)) {
                            if (this.#currentLoadout !== normalLoadout) {
                                const loadoutSlot = await HSElementHooker.HookElement(`#${normalLoadout} `) as HTMLButtonElement;

                                await this.#maybeTurnLoadoutModeToLoad();

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

    async #handleQuickImport() {
        let previouslyActiveSlot: HTMLButtonElement | null = null;
        try {
            previouslyActiveSlot = document.querySelector(
                '.blueberryLoadoutSlot.hs-ambrosia-active-slot'
            ) as HTMLButtonElement | null;

            const text = await navigator.clipboard.readText();

            if (!text || typeof text !== 'string') {
                HSUI.Notify('Clipboard does not contain valid loadout data', {
                    notificationType: 'warning'
                });
                return;
            }

            // Split clipboard by lines
            const lines = text.split('\n').map(line => line.trim());

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

            // If the current mode is SAVE, we need to switch to LOAD mode
            // This is so that the user never accidentally saves a loadout when using the quickbar
            if (currentMode.includes('LOAD ')) {
                modeToggle.click();
            }

            let importedCount = 0;
            let skippedCount = 0;

            HSUtils.startDialogWatcher();

            // Use dynamic slot resolution
            const loadOutsSlots = this.#loadOutsSlots;
            for (let i = 0; i < lines.length; i++) {
                const loadoutData = lines[i];
                // Skip empty lines
                if (!loadoutData) {
                    skippedCount++;
                    continue;
                }
                // Use dynamic slot element
                const loadoutBtn = loadOutsSlots[i] as HTMLButtonElement;
                if (!loadoutBtn) {
                    HSLogger.warn(`[HSAmbrosia] Loadout slot element for index ${i} not found`, this.context);
                    continue;
                }
                const blob = new Blob([loadoutData], { type: 'application/json' });
                const file = new File([blob], 'quick-import.json', { type: 'application/json' });
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(file);
                fileInput.files = dataTransfer.files;
                const event = new Event('change', { bubbles: true });
                fileInput.dispatchEvent(event);
                await HSUtils.sleep(50);
                loadoutBtn.click();
                await HSUtils.sleep(50);
                importedCount++;
            }
            modeToggle.click();

            HSUI.Notify(`Imported ${importedCount} loadout(s), skipped ${skippedCount} empty slot(s)`, {
                notificationType: 'success'
            });

        } catch (err: unknown) {
            const msg =
                err instanceof Error
                    ? err.message
                    : typeof err === 'string'
                        ? err
                        : 'Unknown error';

            HSLogger.error(`Quick Import failed: ${msg} `, this.context, true);

            HSUI.Notify('Quick Import failed', {
                notificationType: 'error'
            });
        } finally {
            await HSUtils.stopDialogWatcher();
            // 🔹 Restore previously active loadout slot
            if (previouslyActiveSlot) {
                previouslyActiveSlot.click();
            }
        }
    }
}