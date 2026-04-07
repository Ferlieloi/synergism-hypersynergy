import { EPredefinedPosition, HSNotifyOptions, HSPanelTabDefinition, HSUIDOMCoordinates, HSUIModalOptions, HSUIXY } from "../../types/module-types/hs-ui-types";
import { HSUtils } from "../hs-utils/hs-utils";
import { HSElementHooker } from "./hs-elementhooker";
import { HSGlobal } from "./hs-global";
import { HSLogger } from "./hs-logger";
import { HSSettingsUI } from "./settings/hs-settings-ui";
import { HSModule } from "./module/hs-module";
import { HSUIC } from "./hs-ui-components";
import panelCoreCSS from "inline:../../resource/css/hs-panel-core.css";
import autosingModalCSS from "inline:../../resource/css/module/hs-autosing-modal.css";
import animationsCSS from "inline:../../resource/css/hs-animations.css";
import utilitiesCSS from "inline:../../resource/css/hs-utilities.css";
import panelHTML from "inline:../../resource/html/hs-panel.html";
import { HSModuleOptions } from "../../types/hs-types";

/**
 * Class: HSUI
 * IsExplicitHSModule: Yes
 * Description: 
 *     UI modules for Hypersynergism.
 *     Mostly responsible for handling everything related to the mod's panel,
 *     but also contains methods such as:
 *         - injectCSS() for injecting arbitrary styles in to the DOM
 *         - injectHTML() for injecting arbitrary HTML in to the DOM
 *         - Modal() for creating and displaying custom modals
 * Author: Swiffy
*/
export class HSUI extends HSModule {
    static #staticContext = 'HSUI';

    #staticPanelHtml: string;
    #staticPanelCss: string;

    uiReady = false;

    #uiPanel?: HTMLDivElement;
    #uiPanelTitle?: HTMLDivElement;
    #uiPanelCloseBtn?: HTMLDivElement;
    #uiPanelOpenBtn?: HTMLDivElement;

    #loggerElement?: HTMLElement;
    #logClearBtn?: HTMLButtonElement;
    #logCopyBtn?: HTMLButtonElement;

    static #modPanelOpen = false;

    #activeModals: Set<HTMLDivElement> = new Set();
    #modalParents: Map<string, string> = new Map();

    static #injectedStyles = new Map<string, string>();
    static #injectedStylesHolder?: HTMLStyleElement;

    #tabHeaderCache: Map<number, HTMLDivElement> = new Map();
    #tabBodyCache: Map<number, HTMLDivElement> = new Map();
    #panelBodyCache: HTMLDivElement[] = [];

    readonly #tabConfigMap: Map<number, HSPanelTabDefinition>;

    readonly #quickbarSubMenuItems = [
        { label: 'Ambrosia', btnId: 'hs-setting-qol-ambrosia-quickbar-btn' },
        { label: 'Amb minibars', btnId: 'hs-setting-ambrosia-minibar-btn' },
        { label: 'Corruption', btnId: 'hs-setting-qol-enable-corruption-quickbar-btn' },
        { label: 'Automation', btnId: 'hs-setting-qol-enable-syn-ui-btn' },
        { label: 'Events', btnId: 'hs-setting-qol-enable-events-quickbar-btn' }
    ];

    #tabs: HSPanelTabDefinition[] = [
        {
            tabId: 1,
            tabBodySel: '.hs-panel-body-1',
            tabSel: '#hs-panel-tab-1',
            panelDisplayType: 'flex'
        },
        {
            tabId: 2,
            tabBodySel: '.hs-panel-body-2',
            tabSel: '#hs-panel-tab-2',
            panelDisplayType: 'block'
        },
        {
            tabId: 3,
            tabBodySel: '.hs-panel-body-3',
            tabSel: '#hs-panel-tab-3',
            panelDisplayType: 'block'
        },
        {
            tabId: 4,
            tabBodySel: '.hs-panel-body-4',
            tabSel: '#hs-panel-tab-4',
            panelDisplayType: 'block'
        },
        {
            tabId: 5,
            tabBodySel: '.hs-panel-body-5',
            tabSel: '#hs-panel-tab-5',
            panelDisplayType: 'block'
        }
    ];

    static #notifyBackgroundColors = {
        'default': '#192a56',
        'warning': '#cd6133',
        'error': '#b33939',
        'success': '#009432'
    };

    static #notifyTransitions: Record<string, Record<string, string>> = {
        topLeft: { top: '15px' },
        top: { top: '15px' },
        topRight: { top: '15px' },
        right: { right: '15px' },
        bottomRight: { bottom: '15px' },
        bottom: { bottom: '15px' },
        bottomLeft: { bottom: '15px' },
        left: { left: '15px' }
    };


    // ========================================
    // ------ Initialization / lifecycle ------
    // ========================================

    constructor(moduleOptions: HSModuleOptions) {
        super(moduleOptions);
        this.#staticPanelCss = panelCoreCSS + autosingModalCSS + animationsCSS + utilitiesCSS;
        this.#staticPanelHtml = panelHTML;
        this.#tabConfigMap = new Map(this.#tabs.map((tab) => [tab.tabId, tab]));
    }

    async init(): Promise<void> {
        HSLogger.log("Initialising HSUI module", this.context);

        await this.#initializePanelMarkup();
        await this.#initializePanelElements();
        this.#setupPanelInteractions();
        this.#setupPanelToggle();
        this.#createQuickAccessMenu();

        this.uiReady = true;
        this.isInitialized = true;

        this.#deferAutoSingStrategyOptGroupUpdate();
    }

    async #initializePanelMarkup(): Promise<void> {
        HSUI.#injectedStylesHolder = document.createElement('style');
        HSUI.#injectedStylesHolder.id = HSGlobal.HSUI.injectedStylesDomId;
        document.head.appendChild(HSUI.#injectedStylesHolder);

        // Inject UI panel styles
        HSUI.injectStyle(this.#staticPanelCss, 'hs-panel-css');

        // Create temp div, inject UI panel HTML and append the contents to body
        HSUI.injectHTMLString(this.#staticPanelHtml);
    }

    async #initializePanelElements(): Promise<void> {
        // Find the UI elements in DOM and store the refs
        this.#uiPanel = await HSElementHooker.HookElement('#hs-panel') as HTMLDivElement;
        this.#uiPanelTitle = await HSElementHooker.HookElement('#hs-panel-version') as HTMLDivElement;
        this.#uiPanelCloseBtn = await HSElementHooker.HookElement('.hs-panel-header-right') as HTMLDivElement;
        this.#loggerElement = await HSElementHooker.HookElement('#hs-ui-log') as HTMLElement;
        this.#logClearBtn = await HSElementHooker.HookElement('#hs-ui-log-clear') as HTMLButtonElement;
        this.#logCopyBtn = await HSElementHooker.HookElement('#hs-ui-log-copy') as HTMLButtonElement;

        const panelHandle = await HSElementHooker.HookElement('.hs-panel-header') as HTMLDivElement;
        const panelResizeHandle = await HSElementHooker.HookElement('.hs-resizer') as HTMLDivElement;

        this.#makeDraggable(this.#uiPanel, panelHandle);
        this.#makeResizable(this.#uiPanel, panelResizeHandle);
    }

    #setupPanelInteractions(): void {
        if (!this.#uiPanelCloseBtn) return;

        this.#uiPanelCloseBtn.addEventListener('click', async () => {
            if (HSUI.#modPanelOpen && this.#uiPanel) {
                await this.#uiPanel.transition({ opacity: 0 });
                HSUI.#modPanelOpen = false;
                this.#uiPanel.classList.add('hs-panel-closed');
            }
        });

        if (this.#logClearBtn) {
            this.#logClearBtn.addEventListener('click', () => HSLogger.clear());
        }

        if (this.#logCopyBtn) {
            this.#logCopyBtn.addEventListener('click', async () => {
                if (!this.#loggerElement) return;
                try {
                    await navigator.clipboard.writeText(this.#loggerElement.textContent || '');
                    HSUI.Notify('Log copied to clipboard!', { notificationType: 'success' });
                } catch (err) {
                    HSLogger.error('Failed to copy log to clipboard', this.context);
                }
            });
        }

        // Bind panel controls
        this.#panelBodyCache = Array.from(document.querySelectorAll('.hs-panel-body')) as HTMLDivElement[];
        const tabs = document.querySelectorAll<HTMLDivElement>('.hs-panel-tab');

        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.#handlePanelTabClick(e.currentTarget as HTMLDivElement, tabs);
            });
        });
    }

    #handlePanelTabClick(tabEl: HTMLDivElement, tabs: NodeListOf<HTMLDivElement>): void {
        const tabId = tabEl.dataset.tab ? parseInt(tabEl.dataset.tab, 10) : null;
        if (!tabId || tabEl.classList.contains('hs-tab-selected')) return;

        const tabConfig = this.#tabConfigMap.get(tabId);
        if (!tabConfig) {
            HSLogger.error(`Could not find tab config for tabId ${tabId}`, this.context);
            return;
        }

        tabs.forEach(t => t.classList.remove('hs-tab-selected'));
        tabEl.classList.add('hs-tab-selected');

        this.#panelBodyCache.forEach(panel => {
            panel.classList.remove('hs-panel-body-open-flex');
            panel.classList.remove('hs-panel-body-open-block');
        });

        const targetPanel = this.#getTabBody(tabId);
        if (!targetPanel) return;

        targetPanel.classList.add(tabConfig.panelDisplayType === 'flex'
            ? 'hs-panel-body-open-flex'
            : 'hs-panel-body-open-block');

        if (tabId === 1) HSLogger.scrollToBottom();
    }

    #setupPanelToggle(): void {
        if (!this.#uiPanel) return;

        this.#uiPanelOpenBtn = document.createElement('div');
        this.#uiPanelOpenBtn.id = 'hs-panel-control';
        this.#uiPanelOpenBtn.style.display = 'none';

        this.#uiPanelOpenBtn.addEventListener('click', async () => {
            if (HSUI.#modPanelOpen && this.#uiPanel) {
                await this.#uiPanel.transition({ opacity: 0 });
                HSUI.#modPanelOpen = false;
                this.#uiPanel.classList.add('hs-panel-closed');
            } else if (this.#uiPanel) {
                HSUI.#modPanelOpen = true;
                this.#uiPanel.style.opacity = '0';
                this.#uiPanel.classList.remove('hs-panel-closed');

                HSLogger.scrollToBottom();
                await this.#uiPanel.transition({ opacity: 0.92 });
            }
        });

        document.body.appendChild(this.#uiPanelOpenBtn);
    }

    #deferAutoSingStrategyOptGroupUpdate(): void {
        setTimeout(() => {
            try {
                const dropdown = document.getElementById('autosingStrategy');
                if (dropdown) {
                    HSSettingsUI.updateStrategyDropdownList();
                }
            } catch (e) {
                console.error('Failed to update autosingStrategy dropdown:', e);
            }
        }, 0);
    }


    // ========================================
    // ---------- Quick access menu -----------
    // ========================================

    #createQuickAccessMenu() {
        if (!this.#uiPanelOpenBtn) return;

        const quickMenu = this.#buildQuickAccessMenuContainer();
        const quickbarsSubmenu = this.#buildQuickbarsSubmenu();
        const quickbarsBtn = this.#buildQuickbarsButton();
        const autoSingBtn = this.#buildQuickAccessButton('autosing', '▶', 'Start Auto-Sing (S256+)', () => this.#toggleAutoSing());
        const heaterBtn = this.#buildQuickAccessButton('amb-heater', '🔥', 'Amb Heater Export', () => this.#triggerHeaterExport());

        quickMenu.appendChild(quickbarsSubmenu);
        quickMenu.appendChild(quickbarsBtn);
        quickMenu.appendChild(autoSingBtn);
        quickMenu.appendChild(heaterBtn);
        document.body.appendChild(quickMenu);

        this.#attachQuickAccessMenuHandlers(quickMenu, quickbarsBtn, quickbarsSubmenu);
    }

    #buildQuickAccessMenuContainer(): HTMLDivElement {
        const quickMenu = document.createElement('div');
        quickMenu.id = 'hs-quick-access-menu';
        quickMenu.style.display = 'none';
        return quickMenu;
    }

    #buildQuickbarsButton(): HTMLButtonElement {
        const quickbarsBtn = document.createElement('button');
        quickbarsBtn.setAttribute('data-type', 'quickbars');
        quickbarsBtn.innerHTML = `
            <span style="display: inline-block; width: 20px; text-align: center; margin-right: 5px;">☰</span>
            <span>Quickbars</span>
            <span class="quickbars-arrow">&gt;</span>
        `;

        quickbarsBtn.addEventListener('click', () => this.#toggleQuickbarsBulk());

        return quickbarsBtn;
    }

    #buildQuickbarsSubmenu(): HTMLDivElement {
        const quickbarsSubmenu = document.createElement('div');
        quickbarsSubmenu.id = 'hs-quickbars-submenu';
        quickbarsSubmenu.style.display = 'none';

        this.#quickbarSubMenuItems.forEach(({ label, btnId }) => {
            quickbarsSubmenu.appendChild(this.#createQuickbarToggle(label, btnId));
        });

        return quickbarsSubmenu;
    }

    #buildQuickAccessButton(type: string, icon: string, label: string, onClick: () => void): HTMLButtonElement {
        const button = document.createElement('button');
        button.innerHTML = `
            <span style="display: inline-block; width: 20px; text-align: center; margin-right: 5px;">${icon}</span>
            <span>${label}</span>
        `;
        button.setAttribute('data-type', type);
        button.addEventListener('click', onClick);
        return button;
    }

    #createQuickbarToggle(label: string, btnId: string): HTMLElement {
        const btn = document.createElement('button');
        btn.textContent = label;
        btn.addEventListener('click', () => {
            const toggleBtn = document.getElementById(btnId) as HTMLElement | null;
            if (toggleBtn) {
                toggleBtn.click();
                HSLogger.debug(`${label} quickbar toggled via quickbars submenu`, this.context);
            }
        });
        return btn;
    }

    #attachQuickAccessMenuHandlers(quickMenu: HTMLDivElement, quickbarsBtn: HTMLButtonElement, quickbarsSubmenu: HTMLDivElement) {
        let hoverTimeout: number | null = null;

        const showMenu = () => {
            if (hoverTimeout) clearTimeout(hoverTimeout);
            quickMenu.style.display = 'flex';
        };

        const hideMenu = () => {
            hoverTimeout = window.setTimeout(() => {
                quickMenu.style.display = 'none';
            }, 200);
        };

        const showSubmenu = () => { quickbarsSubmenu.style.display = 'block'; };
        const hideSubmenu = () => { quickbarsSubmenu.style.display = 'none'; };

        this.#uiPanelOpenBtn?.addEventListener('mouseenter', showMenu);
        this.#uiPanelOpenBtn?.addEventListener('mouseleave', hideMenu);
        quickMenu.addEventListener('mouseenter', showMenu);
        quickMenu.addEventListener('mouseleave', hideMenu);

        quickbarsBtn.addEventListener('mouseenter', showSubmenu);
        quickbarsBtn.addEventListener('mouseleave', hideSubmenu);
        quickbarsSubmenu.addEventListener('mouseenter', showSubmenu);
        quickbarsSubmenu.addEventListener('mouseleave', hideSubmenu);
    }

    #toggleQuickbarsBulk() {
        const toggleIds = this.#quickbarSubMenuItems.map(({ btnId }) => btnId);

        const toggles = toggleIds.map(id => document.getElementById(id));
        const states = toggles.map(btn => btn ? !btn.classList.contains('hs-disabled') : false);
        const enabledCount = states.filter(Boolean).length;

        if (enabledCount > 0 && enabledCount < states.length) {
            toggles.forEach((btn, i) => {
                if (!states[i] && btn) btn.click();
            });
        } else {
            toggles.forEach(btn => { if (btn) btn.click(); });
        }
    }

    #toggleAutoSing() {
        const autoSingToggle = document.getElementById('hs-setting-auto-sing-enabled') as HTMLElement | null;
        if (autoSingToggle) {
            autoSingToggle.click();
            HSLogger.log('Auto-Sing toggled via quick menu', this.context);
        }
    }

    #triggerHeaterExport() {
        const heaterExportBtn = document.getElementById('hs-panel-amb-heater-btn') as HTMLElement | null;
        if (heaterExportBtn) {
            heaterExportBtn.click();
            HSLogger.log('Ambrosia Heater exported via quick menu', this.context);
        }
    }


    // ========================================
    // ----------- Panel utilities ------------
    // ========================================

    static isModPanelOpen() {
        return HSUI.#modPanelOpen;
    }

    // Makes element draggable with mouse
    #makeDraggable(element: HTMLElement, dragHandle: HTMLElement) {
        let pos1 = 0;
        let pos2 = 0;
        let pos3 = 0;
        let pos4 = 0;

        const elementDrag = (e: MouseEvent) => {
            e.preventDefault();

            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;

            let newTop = element.offsetTop - pos2;
            let newLeft = element.offsetLeft - pos1;

            const modalRect = element.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            const minVisibleHeight = 45;
            const padding = 10;

            newLeft = Math.max(
                -(modalRect.width - minVisibleHeight),
                Math.min(newLeft, viewportWidth - minVisibleHeight)
            );

            newTop = Math.max(
                padding,
                Math.min(newTop, viewportHeight - minVisibleHeight)
            );

            element.style.top = `${newTop}px`;
            element.style.left = `${newLeft}px`;
        };

        const closeDragElement = () => {
            document.removeEventListener('mousemove', elementDrag);
            document.removeEventListener('mouseup', closeDragElement);
        };

        const dragMouseDown = (e: MouseEvent) => {
            e.preventDefault();

            pos3 = e.clientX;
            pos4 = e.clientY;
            document.addEventListener('mousemove', elementDrag);
            document.addEventListener('mouseup', closeDragElement);
        };

        dragHandle.addEventListener('mousedown', dragMouseDown);
    }

    #makeResizable(element: HTMLElement, resizeHandle: HTMLElement) {
        const resizable = element;
        const resizer = resizeHandle;
        let isResizing = false;
        let startX: number;
        let startY: number;
        let startWidth: number;
        let startHeight: number;

        const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            startX = e.clientX;
            startY = e.clientY;
            startWidth = resizable.offsetWidth;
            startHeight = resizable.offsetHeight;

            // Remove max-height constraint from challenges list container when user starts resizing
            const challengesContainer = resizable.querySelector('.hs-challenges-list-container') as HTMLElement;
            if (challengesContainer) {
                challengesContainer.style.maxHeight = 'none';
            }

            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
        });

        function resize(e: MouseEvent) {
            if (!isResizing) return;

            const newWidth = clamp(startWidth + (e.clientX - startX), 500, 2500);
            const newHeight = clamp(startHeight + (e.clientY - startY), 400, 1500);

            resizable.style.width = `${newWidth}px`;
            resizable.style.height = `${newHeight}px`;
        }

        function stopResize() {
            isResizing = false;
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
        }
    }

    async getLogElement(): Promise<HTMLElement> {
        if (this.#loggerElement) {
            return this.#loggerElement;
        } else {
            const logEl = await HSElementHooker.HookElement('#hs-ui-log') as HTMLTextAreaElement;
            this.#loggerElement = logEl;
            return logEl;
        }
    }


    // ========================================
    // ----- Tab / panel content helpers ------
    // ========================================

    #getTabBody(tabId: number): HTMLDivElement | null {
        if (this.#tabBodyCache.has(tabId)) {
            return this.#tabBodyCache.get(tabId) || null;
        }

        const tab = this.#tabConfigMap.get(tabId);
        if (!tab) return null;

        const tabBody = document.querySelector(tab.tabBodySel) as HTMLDivElement | null;
        if (tabBody) {
            this.#tabBodyCache.set(tabId, tabBody);
        }
        return tabBody;
    }

    #getTabHeader(tabId: number): HTMLDivElement | null {
        if (this.#tabHeaderCache.has(tabId)) {
            return this.#tabHeaderCache.get(tabId) || null;
        }

        const tab = this.#tabConfigMap.get(tabId);
        if (!tab) return null;

        const tabHeader = document.querySelector(tab.tabSel) as HTMLDivElement | null;
        if (tabHeader) {
            this.#tabHeaderCache.set(tabId, tabHeader);
        }
        return tabHeader;
    }

    replaceTabContents(tabId: number, htmlContent: string) {
        const tabBody = this.#getTabBody(tabId);
        if (!tabBody) {
            HSLogger.warn('Could not find tab to replace contents', this.context);
            return;
        }

        tabBody.innerHTML = htmlContent;
        HSLogger.debug(`Replaced tab ${tabId} content`, this.context);
    }

    updateTitle(newTitle: string) {
        if (this.#uiPanelTitle) {
            this.#uiPanelTitle.innerText = newTitle;
        } else {
            HSLogger.warn(`Could not update panel title`, this.context);
        }
    }

    setPanelControlVisible(visible: boolean) {
        if (!this.#uiPanelOpenBtn) {
            HSLogger.warn(`Could not update panel control visibility`, this.context);
            return;
        }

        this.#uiPanelOpenBtn.style.display = visible ? 'block' : 'none';
    }

    renameTab(tabId: number, newName: string) {
        const tabHeader = this.#getTabHeader(tabId);
        if (!tabHeader) {
            HSLogger.warn('Could not find tab to rename', this.context);
            return;
        }

        tabHeader.innerHTML = newName;
    }


    // ========================================
    // ---- Style / DOM injection helpers -----
    // ========================================

    static #isStyleStringEmpty(styleString: string): boolean {
        if (!HSUtils.isString(styleString)) {
            return true;
        }

        const match = styleString.match(/\{([\s\S]*)\}/);
        if (!match) {
            return true;
        }

        return match[1].trim().length === 0;
    }

    // Can be used to inject arbitrary CSS into the page
    static injectStyle(styleString: string, styleId?: string) {
        if (styleString && !this.#isStyleStringEmpty(styleString)) {

            const targetStyleId = styleId ?? 'hs-injected-style-' + HSUtils.domid();

            if (!this.#injectedStyles.has(targetStyleId)) {
                this.#injectedStyles.set(targetStyleId, styleString);
            }

            this.updateInjectedStyleBlock();
        }
    }

    // Can be used to inject arbitrary CSS into the page
    static removeInjectedStyle(styleId: string) {
        if (this.#injectedStyles.has(styleId)) {
            this.#injectedStyles.delete(styleId);
            this.updateInjectedStyleBlock();
            HSLogger.debug(`Removed injected CSS`, this.#staticContext);
        } else {
            HSLogger.debug(`<yellow>Could not find style with id ${styleId}</yellow>`, this.#staticContext);
        }
    }

    static #updatePending = false;

    static updateInjectedStyleBlock() {
        if (HSUI.#updatePending) return;

        HSUI.#updatePending = true;

        setTimeout(() => {
            HSUI.#updatePending = false;

            if (!HSUI.#injectedStylesHolder) {
                HSUI.#injectedStylesHolder = document.createElement('style');
                HSUI.#injectedStylesHolder.id = HSGlobal.HSUI.injectedStylesDomId;
                document.head.appendChild(HSUI.#injectedStylesHolder);
            }

            HSUI.#injectedStylesHolder.innerHTML = Array.from(HSUI.#injectedStyles.values()).join('');

            HSLogger.debug(`Flushed ${HSUI.#injectedStyles.size} styles`, HSUI.#staticContext);
        }, 0);
    }

    // Can be used to inject arbitrary HTML
    // injectFunction can be supplied to control where the HTML is injected
    static injectHTMLString(htmlString: string, injectFunction?: (node: ChildNode) => void) {
        const div = document.createElement('div');
        div.innerHTML = htmlString;

        while (div.firstChild) {
            if (injectFunction) {
                injectFunction(div.firstChild);
            } else {
                document.body.appendChild(div.firstChild);
            }
        };
    }

    // Can be used to inject arbitrary HTML
    // injectFunction can be supplied to control where the HTML is injected
    static injectHTMLElement(element: HTMLElement, injectFunction: (htmlElement: HTMLElement) => void) {
        injectFunction(element);
    }


    // ========================================
    // ------------ Modal helpers -------------
    // ========================================

    async #waitForModalImages(modal: HTMLDivElement): Promise<void> {
        const images = modal.querySelectorAll<HTMLImageElement>('.hs-modal-body img');
        const imagePromises = Array.from(images).map((img) => {
            return new Promise<void>((resolve) => {
                if (img.complete) {
                    resolve();
                } else {
                    img.addEventListener('load', () => resolve());
                    img.addEventListener('error', () => resolve());
                }
            });
        });

        await Promise.all(imagePromises);
    }

    #clampModalPosition(modal: HTMLDivElement, coordinates: HSUIXY): HSUIXY {
        const { width, height } = modal.getBoundingClientRect();
        const padding = 10;
        const maxX = window.innerWidth - width - padding;
        const maxY = window.innerHeight - height - padding;

        return {
            x: Math.max(padding, Math.min(coordinates.x, maxX)),
            y: Math.max(padding, Math.min(coordinates.y, maxY))
        };
    }

    #attachModalHandlers(modal: HTMLDivElement, modalHead: HTMLDivElement | null): void {
        if (modalHead) {
            this.#makeDraggable(modal, modalHead);
        }

        const modalResizer = modal.querySelector('.hs-modal-resizer') as HTMLElement | null;
        if (modalResizer) {
            this.#makeResizable(modal, modalResizer);
        }

        modal.addEventListener('click', async (e) => {
            const closeTarget = (e.target as HTMLElement)?.closest('[data-close]') as HTMLElement | null;
            const dClose = closeTarget?.dataset.close;

            if (dClose) {
                await this.CloseModal(dClose);
            }
        });
    }

    #resolveCoordinates(coordinates: HSUIDOMCoordinates = EPredefinedPosition.CENTER, relativeTo?: HTMLElement, parentModalId?: string): HSUIXY {
        let position = { x: 0, y: 10 };

        const windowCenterX = window.innerWidth / 2;

        let relativeX = 0;

        if (relativeTo) {
            const elementRect = relativeTo.getBoundingClientRect();
            relativeX = elementRect.width;
        }

        if (Number.isInteger(coordinates)) {
            switch (coordinates) {
                case EPredefinedPosition.CENTER:
                    let prevModal: HTMLElement | null = null;

                    if (parentModalId) {
                        prevModal = document.querySelector(`#${parentModalId}`) as HTMLElement;
                    }

                    if (!prevModal && HSUI.#modPanelOpen) {
                        prevModal = document.querySelector('#hs-panel') as HTMLElement;
                    }

                    if (prevModal) {
                        position.x = prevModal.offsetLeft + 50;
                    } else {
                        position.x = windowCenterX - (relativeX / 2);
                    }
                    break;
                case EPredefinedPosition.RIGHT:
                    position.x = window.innerWidth - 25 - relativeX;
                    break;
                case EPredefinedPosition.LEFT:
                    position.x = 25;
                    break;
                default:
                    position.x = windowCenterX - (relativeX / 2);
                    break;
            }
        } else {
            const custom = coordinates as HSUIXY;
            position.x = custom.x;
            position.y = custom.y;
        }

        return position;
    }

    // Opens a new modal
    async Modal(modalOptions: HSUIModalOptions): Promise<string> {
        const uuid = `hs-dom-${HSUtils.uuidv4()}`;
        const html = HSUIC._modal({
            ...modalOptions,
            id: uuid,
            title: modalOptions.title || '',
            styles: {
                opacity: 0
            }
        });

        HSUI.injectHTMLString(html);

        const modal = document.getElementById(uuid) as HTMLDivElement | null;
        if (!modal) return uuid;

        const modalHead = modal.querySelector('.hs-modal-head') as HTMLDivElement | null;

        this.#activeModals.add(modal);
        if (modalOptions.parentModalId) {
            this.#modalParents.set(uuid, modalOptions.parentModalId);
        }

        if (modalOptions.needsToLoad === true) {
            await this.#waitForModalImages(modal);
        }

        const finalCoords = this.#clampModalPosition(
            modal,
            this.#resolveCoordinates(modalOptions.position, modal, modalOptions.parentModalId)
        );

        modal.style.left = `${finalCoords.x}px`;
        modal.style.top = `${finalCoords.y}px`;

        await modal.transition({ opacity: 1 });
        this.#attachModalHandlers(modal, modalHead);

        return uuid;
    }

    async CloseModal(modalId?: string): Promise<void> {
        if (modalId) {
            const modal = document.getElementById(modalId) as HTMLDivElement | null;
            if (modal) {
                await modal.transition({
                    opacity: 0
                });
                modal.remove();
                this.#activeModals.delete(modal);
            } else {
                const staleModal = Array.from(this.#activeModals).find((activeModal) => activeModal.id === modalId);
                if (staleModal) {
                    this.#activeModals.delete(staleModal);
                }
            }

            this.#modalParents.delete(modalId);
        } else {
            // Close all modals
            for (const modal of Array.from(this.#activeModals)) {
                if (modal.isConnected) {
                    await modal.transition({
                        opacity: 0
                    });
                    modal.remove();
                }
                this.#activeModals.delete(modal);
            }
            this.#modalParents.clear();
        }
    }


    // ========================================
    // --------- Notification helpers ---------
    // ========================================

    static #getNotifyPositionStyles(position: string, width: number, height: number): Record<string, string> {
        return {
            topLeft: { top: `-${height}px`, left: '15px' },
            top: { top: `-${height}px`, left: `calc(50vw - ${width / 2}px)` },
            topRight: { top: `-${height}px`, right: '15px' },
            right: { top: `calc(50vh - ${height / 2}px)`, right: `-${width}px` },
            bottomRight: { bottom: `-${height}px`, right: '15px' },
            bottom: { bottom: `-${height}px`, left: `calc(50vw - ${width / 2}px)` },
            bottomLeft: { bottom: `-${height}px`, left: '15px' },
            left: { top: `calc(50vh - ${height / 2}px)`, left: `-${width}px` }
        }[position] || { bottom: `-${height}px`, right: '15px' };
    }

    static #getNotifyStyles(options: HSNotifyOptions): Record<string, string> {
        return {
            ...HSUI.#getNotifyPositionStyles(options.position, options.width, options.height),
            opacity: '1',
            backgroundColor: HSUI.#notifyBackgroundColors[options.notificationType],
            width: `${options.width}px`,
            height: `${options.height}px`
        };
    }

    static async Notify(text: string, notifyOptions?: Partial<HSNotifyOptions>) {
        HSLogger.log(`${text}`, 'Notify');
        const options: HSNotifyOptions = {
            position: notifyOptions?.position ?? "bottomRight",
            popDuration: notifyOptions?.popDuration ?? 400,
            displayDuration: notifyOptions?.displayDuration ?? 4000,
            hideDuration: notifyOptions?.hideDuration ?? 2300,
            notificationType: notifyOptions?.notificationType ?? "default",
            width: notifyOptions?.width ?? 300,
            height: notifyOptions?.height ?? 50
        };

        const notificationDiv = document.createElement('div');
        const notificationText = document.createElement('div');

        notificationDiv.className = HSGlobal.HSUI.notifyClassName;
        notificationText.className = HSGlobal.HSUI.notifyTextClassName;

        notificationDiv.style.cssText = HSUtils.objectToCSS(HSUI.#getNotifyStyles(options));

        notificationText.innerText = text;
        notificationDiv.appendChild(notificationText);

        document.body.querySelectorAll(`.${HSGlobal.HSUI.notifyClassName}`).forEach(n => {
            (n as HTMLElement).clearTransitions();
            n.remove();
        });

        document.body.appendChild(notificationDiv);

        await notificationDiv.transition({
            ...HSUI.#notifyTransitions[options.position],
        }, options.popDuration, `linear(0, 0.408 26.7%, 0.882 50.9%, 0.999 57.7%, 0.913 65.3%, 0.893 68.8%, 0.886 72.4%, 0.903 78.5%, 0.986 92.3%, 1)`);

        await HSUtils.wait(options.displayDuration);

        await notificationDiv.transition({
            'opacity': '0'
        }, options.hideDuration, `linear`);

        notificationText.remove();
        notificationDiv.remove();
    }
}
