import { EPredefinedPosition, HSNotifyOptions, HSPanelTabDefinition, HSUIDOMCoordinates, HSUIModalOptions, HSUIXY } from "../../types/module-types/hs-ui-types";
import { HSUtils } from "../hs-utils/hs-utils";
import { HSElementHooker } from "./hs-elementhooker";
import { HSGlobal } from "./hs-global";
import { HSLogger } from "./hs-logger";
import { HSModule } from "./module/hs-module";
import { HSUIC } from "./hs-ui-components";
import panelCSS from "inline:../../resource/css/hs-panel.css";
import panelHTML from "inline:../../resource/html/hs-panel.html";
import { HSModuleOptions } from "../../types/hs-types";

/*
    Class: HSUI
    IsExplicitHSModule: Yes
    Description: 
        UI modules for Hypersynergism.
        Mostly responsible for handling everything related to the mod's panel,
        but also contains methods such as:
            - injectCSS() for injecting arbitrary styles in to the DOM
            - injectHTML() for injecting arbitrary HTML in to the DOM
            - Modal() for creating and displaying custom modals
    Author: Swiffy
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

    constructor(moduleOptions: HSModuleOptions) {
        super(moduleOptions);
        this.#staticPanelCss = panelCSS;
        this.#staticPanelHtml = panelHTML;
    }

    async init(): Promise<void> {
        HSLogger.log("Initialising HSUI module", this.context);

        const self = this;

        HSUI.#injectedStylesHolder = document.createElement('style');
        HSUI.#injectedStylesHolder.id = HSGlobal.HSUI.injectedStylesDomId;
        document.head.appendChild(HSUI.#injectedStylesHolder);

        // Inject UI panel styles
        HSUI.injectStyle(this.#staticPanelCss, 'hs-panel-css');

        // Create temp div, inject UI panel HTML and append the contents to body
        HSUI.injectHTMLString(this.#staticPanelHtml);

        // Find the UI elements in DOM and store the refs
        this.#uiPanel = await HSElementHooker.HookElement('#hs-panel') as HTMLDivElement;
        this.#uiPanelTitle = await HSElementHooker.HookElement('#hs-panel-version') as HTMLDivElement;
        this.#uiPanelCloseBtn = await HSElementHooker.HookElement('.hs-panel-header-right') as HTMLDivElement;
        this.#loggerElement = await HSElementHooker.HookElement('#hs-ui-log') as HTMLElement;
        this.#logClearBtn = await HSElementHooker.HookElement('#hs-ui-log-clear') as HTMLButtonElement;
        this.#logCopyBtn = await HSElementHooker.HookElement('#hs-ui-log-copy') as HTMLButtonElement;
        const panelHandle = await HSElementHooker.HookElement('.hs-panel-header') as HTMLDivElement;
        const panelResizeHandle = await HSElementHooker.HookElement('.hs-resizer') as HTMLDivElement;

        // Make the HS UI panel draggable
        this.#makeDraggable(this.#uiPanel, panelHandle);

        // Make the HS UI panel resizable
        this.#makeResizable(this.#uiPanel, panelResizeHandle);

        // Make the HS UI panel closeable
        this.#uiPanelCloseBtn.addEventListener('click', async () => {
            if (HSUI.#modPanelOpen && self.#uiPanel) {
                await self.#uiPanel.transition({
                    opacity: 0
                });

                HSUI.#modPanelOpen = false;
                self.#uiPanel?.classList.add('hs-panel-closed');
            }
        });

        this.#logClearBtn.addEventListener('click', () => {
            HSLogger.clear();
        })

        this.#logCopyBtn.addEventListener('click', async () => {
            if (self.#loggerElement) {
                try {
                    await navigator.clipboard.writeText(self.#loggerElement.textContent || '');
                    HSUI.Notify('Log copied to clipboard!', { notificationType: 'success' });
                } catch (err) {
                    HSLogger.error('Failed to copy log to clipboard', self.context);
                }
            }
        });

        // Bind panel controls
        const tabs = document.querySelectorAll('.hs-panel-tab');

        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tab = e.target as HTMLDivElement;
                const tabId = tab.dataset.tab ? parseInt(tab.dataset.tab, 10) : null;

                if (tab.classList.contains('hs-tab-selected'))
                    return;

                if (tabId) {
                    const tabConfig = self.#tabs.find((tab) => tab.tabId === tabId);

                    if (!tabConfig) {
                        HSLogger.error(`Could not find tab config for tabId ${tabId}`, self.context);
                        return;
                    }

                    tabs.forEach(tab => {
                        tab.classList.remove('hs-tab-selected');
                    });

                    tab.classList.add('hs-tab-selected');

                    document.querySelectorAll('.hs-panel-body').forEach(panel => {
                        panel.classList.remove('hs-panel-body-open-flex');
                        panel.classList.remove('hs-panel-body-open-block');
                    });

                    const targetPanel = document.querySelector(tabConfig.tabBodySel) as HTMLDivElement;

                    if (targetPanel) {
                        switch (tabConfig.panelDisplayType) {
                            case "flex":
                                targetPanel.classList.add('hs-panel-body-open-flex');
                                break;
                            case "block":
                                targetPanel.classList.add('hs-panel-body-open-block');
                                break;
                        }

                        // Log panel (auto scroll to bottom when log tab selected)
                        if (tabId === 1)
                            HSLogger.scrollToBottom();
                    }
                } else {
                    HSLogger.error(`tabId is null`, self.context);
                }
            });
        });

        // Create open button for the HS UI panel
        this.#uiPanelOpenBtn = document.createElement('div');
        this.#uiPanelOpenBtn.id = "hs-panel-control";

        // Toggle button opens/closes the panel
        this.#uiPanelOpenBtn.addEventListener('click', async () => {
            if (HSUI.#modPanelOpen && self.#uiPanel) {
                // Close the panel
                await self.#uiPanel.transition({
                    opacity: 0
                });
                HSUI.#modPanelOpen = false;
                self.#uiPanel.classList.add('hs-panel-closed');
            } else if (!HSUI.#modPanelOpen && self.#uiPanel) {
                // Open the panel
                HSUI.#modPanelOpen = true;
                self.#uiPanel.style.opacity = '0';
                self.#uiPanel.classList.remove('hs-panel-closed');

                HSLogger.scrollToBottom();

                await self.#uiPanel.transition({
                    opacity: 0.92
                });
            }
        });

        document.body.appendChild(this.#uiPanelOpenBtn);

        // Create quick access hover menu
        this.#createQuickAccessMenu();

        this.uiReady = true;
        this.isInitialized = true;
    }

    #createQuickAccessMenu() {
        if (!this.#uiPanelOpenBtn) return;

        // Create the menu container
        const quickMenu = document.createElement('div');
        quickMenu.id = 'hs-quick-access-menu';
        quickMenu.style.cssText = `
            position: absolute;
            top: 45px;
            left: 10px;
            background: rgba(28, 27, 34, 0.95);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 4px;
            padding: 4px 0;
            display: none;
            flex-direction: column;
            gap: 0;
            box-shadow: 2px 4px 12px 0px rgba(0, 0, 0, 0.4);
            z-index: 999999;
            min-width: 180px;
        `;

        // Create Auto-Sing toggle button
        const autoSingBtn = document.createElement('button');
        autoSingBtn.innerHTML = '<span style="color: #4caf50; display: inline-block; width: 20px; text-align: center;">▶</span>Start Auto-Sing';
        autoSingBtn.style.cssText = `
            background: transparent;
            border: none;
            color: #e0e0e0;
            padding: 8px 12px 8px 8px;
            border-radius: 0;
            cursor: pointer;
            font-size: 13px;
            font-weight: 400;
            transition: background 0.15s;
            white-space: nowrap;
            text-align: left;
            width: 100%;
        `;
        autoSingBtn.addEventListener('mouseenter', () => {
            autoSingBtn.style.background = 'rgba(76, 175, 80, 0.25)';
        });
        autoSingBtn.addEventListener('mouseleave', () => {
            autoSingBtn.style.background = 'transparent';
        });
        autoSingBtn.addEventListener('click', () => {
            const autoSingToggle = document.getElementById('hs-setting-auto-sing-enabled') as HTMLElement;
            if (autoSingToggle) {
                autoSingToggle.click();
                HSLogger.log('Auto-Sing toggled via quick menu', this.context);
            }
        });

        // Create Ambrosia Heater export button
        const heaterBtn = document.createElement('button');
        heaterBtn.innerHTML = '<span style="display: inline-block; width: 20px; text-align: center;">🔥</span>Amb Heater Export';
        heaterBtn.style.cssText = `
            background: transparent;
            border: none;
            color: #e0e0e0;
            padding: 8px 12px 8px 8px;
            border-radius: 0;
            cursor: pointer;
            font-size: 13px;
            font-weight: 400;
            transition: background 0.15s;
            white-space: nowrap;
            text-align: left;
            width: 100%;
        `;
        heaterBtn.addEventListener('mouseenter', () => {
            heaterBtn.style.background = 'rgba(255, 152, 0, 0.25)';
        });
        heaterBtn.addEventListener('mouseleave', () => {
            heaterBtn.style.background = 'transparent';
        });
        heaterBtn.addEventListener('click', () => {
            const heaterExportBtn = document.getElementById('hs-panel-amb-heater-btn') as HTMLElement;
            if (heaterExportBtn) {
                heaterExportBtn.click();
                HSLogger.log('Ambrosia Heater exported via quick menu', this.context);
            }
        });

        quickMenu.appendChild(autoSingBtn);
        quickMenu.appendChild(heaterBtn);
        document.body.appendChild(quickMenu);

        // Show/hide menu on hover
        let hoverTimeout: number | null = null;

        this.#uiPanelOpenBtn.addEventListener('mouseenter', () => {
            if (hoverTimeout) clearTimeout(hoverTimeout);
            quickMenu.style.display = 'flex';
        });

        this.#uiPanelOpenBtn.addEventListener('mouseleave', () => {
            hoverTimeout = window.setTimeout(() => {
                quickMenu.style.display = 'none';
            }, 200);
        });

        quickMenu.addEventListener('mouseenter', () => {
            if (hoverTimeout) clearTimeout(hoverTimeout);
            quickMenu.style.display = 'flex';
        });

        quickMenu.addEventListener('mouseleave', () => {
            hoverTimeout = window.setTimeout(() => {
                quickMenu.style.display = 'none';
            }, 200);
        });
    }

    static isModPanelOpen() {
        return HSUI.#modPanelOpen;
    }

    // Makes element draggable with mouse
    #makeDraggable(element: HTMLElement, dragHandle: HTMLElement) {
        let pos1 = 0;
        let pos2 = 0;
        let pos3 = 0;
        let pos4 = 0;

        dragHandle.onmousedown = dragMouseDown;

        function dragMouseDown(e: MouseEvent) {
            e.preventDefault();

            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }

        function elementDrag(e: MouseEvent) {
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

            element.style.top = newTop + "px";
            element.style.left = newLeft + "px";
        }

        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    #makeResizable(element: HTMLElement, resizeHandle: HTMLElement) {
        const resizable = element;
        const resizer = resizeHandle;
        let isResizing = false;
        let startX: number;
        let startY: number;
        let startWidth: number;
        let startHeight: number;

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

            let newWidth = startWidth + (e.clientX - startX);
            let newHeight = startHeight + (e.clientY - startY);

            if (newWidth <= 500)
                newWidth = 500;

            if (newHeight <= 400)
                newHeight = 400;

            if (newWidth >= 2500)
                newWidth = 2500;

            if (newHeight >= 1500)
                newHeight = 1500;

            resizable.style.width = newWidth + 'px';
            resizable.style.height = newHeight + 'px';
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

    replaceTabContents(tabId: number, htmlContent: string) {
        const tab = this.#tabs.find(t => {
            return t.tabId === tabId;
        });

        if (!tab) {
            HSLogger.warn('Could not find tab to replace contents', this.context);
            return;
        }

        const tabBody = document.querySelector(tab.tabBodySel) as HTMLDivElement;

        if (tabBody) {
            tabBody.innerHTML = htmlContent;
            HSLogger.log(`Replaced tab ${tab.tabId} content`, this.context);
        }
    }

    updateTitle(newTitle: string) {
        if (this.#uiPanelTitle) {
            this.#uiPanelTitle.innerText = newTitle;
        } else {
            HSLogger.warn(`Could not update panel title`, this.context);
        }
    }

    static #isStyleStringEmpty(styleString: string): boolean {
        // The style is in form #<someid> { <empty or css rules> }
        // Here we want to check if the brackets contain anything
        let openBracketIdx = styleString.indexOf('{');
        const closeBracketIdx = styleString.indexOf('}');

        if (openBracketIdx > -1 && closeBracketIdx > -1) {
            openBracketIdx++;

            const bracketInsides = styleString.substring(openBracketIdx, closeBracketIdx);

            if (!HSUtils.isString(bracketInsides)) {
                return true;
            } else {
                const bracketsInsidesRemoveWhiteSpace = bracketInsides.replace(/\s+/g, '');
                const areBracketsEmpty = bracketsInsidesRemoveWhiteSpace.length === 0;

                return areBracketsEmpty;
            }
        } else {
            // Not sure of this but lets return true if no brackets are found
            return true;
        }
    }

    // Can be used to inject arbitrary CSS into the page
    static injectStyle(styleString: string, styleId?: string) {
        if (styleString && !this.#isStyleStringEmpty(styleString)) {

            let style_id = styleId ? styleId : 'hs-injected-style-' + HSUtils.domid();

            if (!this.#injectedStyles.has(style_id)) {
                this.#injectedStyles.set(style_id, styleString);
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

            const styleHolder = document.querySelector(`#${HSGlobal.HSUI.injectedStylesDomId}`) as HTMLStyleElement;

            if (!HSUI.#injectedStylesHolder) {
                HSUI.#injectedStylesHolder = document.createElement('style');
                HSUI.#injectedStylesHolder.id = HSGlobal.HSUI.injectedStylesDomId;
                document.head.appendChild(HSUI.#injectedStylesHolder);
            }

            HSUI.#injectedStylesHolder.innerHTML = '';

            HSUI.#injectedStyles.forEach((style, styleId) => {
                HSUI.#injectedStylesHolder!.innerHTML += style;
            });

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

    renameTab(tabId: number, newName: string) {
        const tab = this.#tabs.find(t => {
            return t.tabId === tabId;
        });

        if (!tab) {
            HSLogger.warn('Could not find tab to rename', this.context);
            return;
        }

        const tabEl = document.querySelector(tab.tabSel) as HTMLDivElement;

        if (tabEl) {
            tabEl.innerHTML = newName;
        }
    }

    // Used by modals to calculate their open position
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

        // Create temp div, inject UI panel HTML and append the contents to body
        HSUI.injectHTMLString(html);

        const modal = document.querySelector(`#${uuid}`) as HTMLDivElement;
        const modalHead = document.querySelector(`#${uuid} > .hs-modal-head`) as HTMLDivElement;

        this.#activeModals.add(modal);
        if (modalOptions.parentModalId) {
            this.#modalParents.set(uuid, modalOptions.parentModalId);
        }

        // If the modal contains something (images mainly) which take time to load, needsToLoad should be set to true
        // And this is where we handle / wait for the loading to happen before showing the modal
        if (modalOptions.needsToLoad && modalOptions.needsToLoad === true) {
            const images = document.querySelectorAll(`#${uuid} > .hs-modal-body img`);

            const imagePromises = (Array.from(images) as HTMLImageElement[]).map(img => {
                return new Promise<void>((resolve) => {
                    if (img.complete) {
                        resolve();
                    } else {
                        img.addEventListener('load', () => resolve());
                        img.addEventListener('error', () => {
                            resolve();
                        });
                    }
                });
            });

            // Wait for images to load and then resolve open coordinates for the modal
            await Promise.all(imagePromises);
        }

        if (modal) {
            const finalCoords = this.#resolveCoordinates(modalOptions.position, modal, modalOptions.parentModalId);
            const modalRect = modal.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let finalX = finalCoords.x;
            let finalY = finalCoords.y;

            if (finalX + modalRect.width > viewportWidth - 10) {
                finalX = viewportWidth - modalRect.width - 10;
            }

            if (finalX < 10) {
                finalX = 10;
            }

            if (finalY + modalRect.height > viewportHeight - 10) {
                finalY = viewportHeight - modalRect.height - 10;
            }

            if (finalY < 10) {
                finalY = 10;
            }

            modal.style.left = `${finalX}px`;
            modal.style.top = `${finalY}px`;

            await modal.transition({
                opacity: 1
            });

            // Make the modal draggable
            this.#makeDraggable(modal, modalHead);
            const modalResizer = modal.querySelector('.hs-modal-resizer') as HTMLElement;
            if (modalResizer) {
                this.#makeResizable(modal, modalResizer);
            }

            modal.addEventListener('click', async (e) => {
                const dClose = (e.target as HTMLDivElement).dataset.close;

                if (dClose) {
                    await this.CloseModal(dClose);
                }
            })
        }
        return uuid;
    }

    async CloseModal(modalId?: string): Promise<void> {
        if (modalId) {
            const modal = document.getElementById(modalId) as HTMLDivElement;
            if (modal) {
                await modal.transition({
                    opacity: 0
                });
                modal.remove();
                this.#activeModals.delete(modal);
                this.#modalParents.delete(modalId);
            }
        } else {
            // Close all modals
            for (const modal of this.#activeModals) {
                await modal.transition({
                    opacity: 0
                });
                modal.remove();
            }
            this.#activeModals.clear();
            this.#modalParents.clear();
        }
    }


    static async Notify(text: string, notifyOptions?: Partial<HSNotifyOptions>) {
        const options: HSNotifyOptions = {
            position: notifyOptions?.position ?? "bottomRight",
            popDuration: notifyOptions?.popDuration ?? 400,
            displayDuration: notifyOptions?.displayDuration ?? 4000,
            hideDuration: notifyOptions?.hideDuration ?? 2300,
            notificationType: notifyOptions?.notificationType ?? "default"
        }

        let notificationDiv: HTMLDivElement | null = document.createElement('div');
        let notificationText: HTMLDivElement | null = document.createElement('div');

        notificationDiv.className = HSGlobal.HSUI.notifyClassName;
        notificationText.className = HSGlobal.HSUI.notifyTextClassName;

        const width = 300;
        const height = 50;

        const bgColor = {
            'default': '#192a56',
            'warning': '#cd6133',
            'error': '#b33939',
            'success': '#009432',
        }

        const positions = {
            'topLeft': { top: `-${height}px`, left: `15px` },
            'top': { top: `-${height}px`, left: `calc(50vw - ${width / 2}px)` },
            'topRight': { top: `-${height}px`, right: `15px` },
            'right': { top: `calc(50vh - ${height / 2}px)`, right: `-${width}px` },
            'bottomRight': { bottom: `-${height}px`, right: `15px` },
            'bottom': { bottom: `-${height}px`, left: `calc(50vw - ${width / 2}px)` },
            'bottomLeft': { bottom: `-${height}px`, left: `15px` },
            'left': { top: `calc(50vh - ${height / 2}px)`, left: `-${width}px` },
        }

        const transitions = {
            'topLeft': { top: `15px` },
            'top': { top: `15px` },
            'topRight': { top: `15px` },
            'right': { right: `15px` },
            'bottomRight': { bottom: `15px` },
            'bottom': { bottom: `15px` },
            'bottomLeft': { bottom: `15px` },
            'left': { left: `15px` },
        }

        notificationDiv.style = HSUtils.objectToCSS({
            ...positions[options.position],
            opacity: '1',
            backgroundColor: bgColor[options.notificationType]
        });

        notificationText.innerText = text;
        notificationDiv.appendChild(notificationText);

        document.body.querySelectorAll(`.${HSGlobal.HSUI.notifyClassName}`).forEach(n => {
            (n as HTMLElement).clearTransitions();
            n.remove();
        });

        document.body.appendChild(notificationDiv);

        await notificationDiv.transition({
            ...transitions[options.position],
        }, options.popDuration, `linear(0, 0.408 26.7%, 0.882 50.9%, 0.999 57.7%, 0.913 65.3%, 0.893 68.8%, 0.886 72.4%, 0.903 78.5%, 0.986 92.3%, 1)`);

        await HSUtils.wait(options.displayDuration);

        await notificationDiv.transition({
            'opacity': '0'
        }, options.hideDuration, `linear`);

        notificationText.remove();
        notificationDiv.remove();
        notificationText = null;
        notificationDiv = null;
    }
}
