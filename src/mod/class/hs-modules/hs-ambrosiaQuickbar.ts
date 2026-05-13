import type { HSAmbrosia } from "./hs-ambrosia";
import { HSQuickbarManager } from "./hs-qolQuickbarManager";
import { HSLogger } from "../hs-core/hs-logger";
import { HSUI } from "../hs-core/hs-ui";
import { HSUtils } from "../hs-utils/hs-utils";
import { HSSetting } from "../hs-core/settings/hs-setting";
import { HSSettings } from "../hs-core/settings/hs-settings";
import { HSGlobal } from "../hs-core/hs-global";
import { HSAmbrosiaHelper } from "./hs-ambrosiaHelper";

export class HSAmbrosiaQuickbar {
    readonly context = 'HSAmbrosiaQuickbar';
    readonly host: HSAmbrosia;
    #quickBarClickHandlers: Map<HTMLButtonElement, (e: Event) => Promise<void>> = new Map();
    #quickBarContextMenuHandlers: Map<HTMLButtonElement, (e: Event) => void> = new Map();
    #originalQuickBarButtons: Map<string, HTMLButtonElement> = new Map();

    // Icon picking (mirrors HSQOLCorruptionQuickbar)
    readonly #AMBROSIA_ICON_STORAGE_KEY = 'hs-ambrosia-quickbar-icons';
    #ambrosiaSlotIcons: Map<string, string> = new Map();
    #isPickingIcon = false;
    #pickTargetSlotId: string | null = null;
    #pickDocClickListener: ((event: MouseEvent) => void) | null = null;
    #wasGdsEnabled: boolean | null = null;

    constructor(host: HSAmbrosia) {
        this.host = host;
    }

    async init() {
        await this.ensureInjectedQuickbar();
        await this.setupQuickbar();
    }

    #registerQuickbarSection() {
        HSQuickbarManager.getInstance().removeSection("ambrosia");
        HSQuickbarManager.getInstance().registerSection("ambrosia", () => {
            HSLogger.debug(() => "Ambrosia Quickbar section factory called", this.context);
            const pageHeader = this.host.getPageHeader();
            if (!pageHeader) return { element: document.createElement("div") };
            const quickbarsRow = HSQuickbarManager.ensureQuickbarsRow();
            let groupWrapper = quickbarsRow.querySelector("#hs-ambrosia-group-wrapper") as HTMLElement;
            if (!groupWrapper) {
                groupWrapper = document.createElement("div");
                groupWrapper.id = "hs-ambrosia-group-wrapper";
                groupWrapper.style.display = "flex";
                groupWrapper.style.flexDirection = "column";
                groupWrapper.style.justifyContent = "flex-end";
                quickbarsRow.appendChild(groupWrapper);
            }
            if (quickbarsRow.lastChild !== groupWrapper) {
                quickbarsRow.appendChild(groupWrapper);
            }
            return { element: groupWrapper };
        });
        HSQuickbarManager.getInstance().injectSection("ambrosia");
    }

    async ensureInjectedQuickbar() {
        const quickbarManager = HSQuickbarManager.getInstance();

        if (!quickbarManager.isInjected("ambrosia")) {
            this.#registerQuickbarSection();
        }

        await quickbarManager.whenSectionInjected("ambrosia");
    }

    public async setupQuickbar() {
        await this.ensureInjectedQuickbar();
        await this.createPersistentQuickbarContainer();

        const groupWrapper = HSQuickbarManager.getInstance().getSection("ambrosia");
        if (!groupWrapper) {
            HSLogger.error("setupQuickbar: group wrapper missing after injection!", this.context, true);
            return;
        }

        const quickbarSetting = HSSettings.getSetting("ambrosiaQuickBar") as HSSetting<boolean>;
        const quickbar = groupWrapper.querySelector(`#${HSGlobal.HSAmbrosia.quickBarId}`) as HTMLElement;

        if (quickbar) {
            if (quickbarSetting && !quickbarSetting.isEnabled()) {
                quickbar.style.display = "none";
                HSLogger.debug(() => "quickbar hidden due to settings", this.context);
            } else {
                this.setupQuickbarSectionEvents();
                await this.refreshQuickbarIcons();
                await this.host.refreshActiveLoadoutFromState();
                HSUI.injectStyle(this.host.getQuickbarCSS(), this.host.getQuickbarCSSId());
            }
        }
    }

    async createPersistentQuickbarContainer() {
        const pageHeader = this.host.getPageHeader();
        if (!pageHeader) return;

        // Load persisted slot icons once before building the container
        if (this.#ambrosiaSlotIcons.size === 0) {
            this.#loadAmbrosiaIcons();
        }

        const quickbarsRow = HSQuickbarManager.ensureQuickbarsRow();
        let groupWrapper = quickbarsRow.querySelector("#hs-ambrosia-group-wrapper") as HTMLElement;
        if (!groupWrapper) {
            groupWrapper = document.createElement("div");
            groupWrapper.id = "hs-ambrosia-group-wrapper";
            groupWrapper.style.display = "flex";
            groupWrapper.style.flexDirection = "column";
            groupWrapper.style.justifyContent = "flex-end";
            quickbarsRow.appendChild(groupWrapper);
        }

        if (quickbarsRow.lastChild !== groupWrapper) {
            quickbarsRow.appendChild(groupWrapper);
        }

        if (groupWrapper.querySelector(`#${HSGlobal.HSAmbrosia.quickBarId}`)) {
            HSLogger.debug(() => "Quickbar already exists in group wrapper", this.context);
            return;
        }

        const loadoutContainer = this.host.getLoadoutContainer();
        if (loadoutContainer) {
            const clone = loadoutContainer.cloneNode(true) as HTMLElement;
            clone.id = HSGlobal.HSAmbrosia.quickBarId;
            clone.className = 'hs-quickbar-slots-wrapper';
            clone.style.display = "inline-flex";

            const cloneSettingButton = clone.querySelector(".blueberryLoadoutSetting") as HTMLButtonElement;
            const cloneLoadoutButtons = clone.querySelectorAll(".blueberryLoadoutSlot") as NodeListOf<HTMLButtonElement>;

            cloneLoadoutButtons.forEach((button) => {
                const buttonId = button.id;
                button.dataset.originalId = buttonId;
                button.id = `${HSGlobal.HSAmbrosia.quickBarLoadoutIdPrefix}-${buttonId}`;
                button.title = 'Alt+Click to pick an icon | Right-click to clear';
                this.#cacheOriginalLoadoutButton(buttonId);
            });

            if (cloneSettingButton) {
                cloneSettingButton.remove();
            }

            if (groupWrapper.childNodes.length > 0) {
                if (groupWrapper.childNodes.length === 1) {
                    groupWrapper.appendChild(clone);
                } else {
                    groupWrapper.insertBefore(clone, groupWrapper.childNodes[1]);
                }
            } else {
                groupWrapper.appendChild(clone);
            }
        }
    }

    public getQuickbarSection(): HTMLElement {
        const loadoutContainer = this.host.getLoadoutContainer();
        if (!loadoutContainer) {
            HSLogger.error("getQuickbarSection called but loadoutContainer is not initialized", this.context, true);
            throw new Error("Ambrosia loadout container not initialized");
        }

        const clone = loadoutContainer.cloneNode(true) as HTMLElement;
        clone.id = HSGlobal.HSAmbrosia.quickBarId;
        clone.className = 'hs-quickbar-slots-wrapper';
        clone.style.display = "inline-flex";

        const cloneSettingButton = clone.querySelector(".blueberryLoadoutSetting") as HTMLButtonElement;
        if (cloneSettingButton) {
            cloneSettingButton.remove();
        }

        const cloneLoadoutButtons = clone.querySelectorAll(".blueberryLoadoutSlot") as NodeListOf<HTMLButtonElement>;
        cloneLoadoutButtons.forEach((button) => {
            const buttonId = button.id;
            button.dataset.originalId = buttonId;
            button.id = buttonId;
        });

        return clone;
    }

    setupQuickbarSectionEvents() {
        const quickbar = HSQuickbarManager.getInstance().getSection("ambrosia");
        if (!quickbar) return;

        quickbar.querySelectorAll(".blueberryLoadoutSlot").forEach((button: Element) => {
            const btn = button as HTMLButtonElement;
            const clone = btn.cloneNode(true) as HTMLButtonElement;
            btn.replaceWith(clone);

            const buttonId = clone.dataset.originalId || "";
            if (buttonId) {
                this.#cacheOriginalLoadoutButton(buttonId);
            }
            clone.title = 'Alt+Click to pick an icon | Right-click to clear';

            const buttonHandler = async (e: Event) => {
                const mouseEvent = e as MouseEvent;
                if (mouseEvent.altKey) {
                    mouseEvent.preventDefault();
                    mouseEvent.stopPropagation();
                    this.#startPickupMode(buttonId);
                    return;
                }
                await this.onQuickBarClick(e, buttonId);
            };
            const contextMenuHandler = (e: Event) => {
                e.preventDefault();
                e.stopPropagation();
                this.#clearIconForSlot(buttonId);
                HSUI.Notify('Ambrosia slot icon cleared', { notificationType: 'default' });
            };
            clone.addEventListener("click", buttonHandler);
            clone.addEventListener("contextmenu", contextMenuHandler);
            this.#quickBarClickHandlers.set(clone, buttonHandler);
            this.#quickBarContextMenuHandlers.set(clone, contextMenuHandler);
        });
    }

    cleanupQuickbarClickHandlers() {
        for (const [button, handler] of this.#quickBarClickHandlers.entries()) {
            button.removeEventListener("click", handler);
        }
        for (const [button, handler] of this.#quickBarContextMenuHandlers.entries()) {
            button.removeEventListener("contextmenu", handler);
        }
        this.#quickBarClickHandlers.clear();
        this.#quickBarContextMenuHandlers.clear();
        this.#originalQuickBarButtons.clear();
    }

    #cacheOriginalLoadoutButton(buttonId: string) {
        if (!buttonId || this.#originalQuickBarButtons.has(buttonId)) return;

        const originalButton = document.getElementById(buttonId) as HTMLButtonElement | null;
        if (originalButton) {
            this.#originalQuickBarButtons.set(buttonId, originalButton);
        }
    }

    async refreshQuickbarIcons() {
        const ambQuickBar = this.host.getPageHeader()?.querySelector(`#${HSGlobal.HSAmbrosia.quickBarId}`) as HTMLElement;

        if (ambQuickBar) {
            const quickbarSlots = ambQuickBar.querySelectorAll(".blueberryLoadoutSlot") as NodeListOf<HTMLElement>;
            quickbarSlots.forEach((slot) => {
                const originalSlotId = slot.dataset.originalId;
                if (!originalSlotId) return;
                const customUrl = this.#getAmbrosiaSlotIcon(originalSlotId);
                if (customUrl) {
                    slot.classList.add("hs-ambrosia-slot");
                    slot.style.backgroundImage = `url(${customUrl})`;
                } else {
                    slot.classList.remove("hs-ambrosia-slot");
                    slot.style.backgroundImage = "";
                }
            });
        }

        const originalBar = document.querySelector("#bbLoadoutContainer");
        if (originalBar) {
            const originalSlots = originalBar.querySelectorAll(".blueberryLoadoutSlot") as NodeListOf<HTMLElement>;
            originalSlots.forEach((slot) => {
                const customUrl = this.#getAmbrosiaSlotIcon(slot.id);
                if (customUrl) {
                    slot.classList.add("hs-ambrosia-slot");
                    slot.style.backgroundImage = `url(${customUrl})`;
                } else {
                    slot.classList.remove("hs-ambrosia-slot");
                    slot.style.backgroundImage = "";
                }
            });
        }
    }

    async updateQuickBar() {
        await HSQuickbarManager.getInstance().whenSectionInjected("ambrosia");
        const quickbarSetting = HSSettings.getSetting("ambrosiaQuickBar") as HSSetting<boolean>;

        if (quickbarSetting.isEnabled()) {
            await this.refreshQuickbarIcons();
        }
    }

    async onQuickBarClick(e: Event, buttonId: string) {
        const realButton = this.#originalQuickBarButtons.get(buttonId) ?? document.getElementById(buttonId) as HTMLButtonElement | null;
        if (!realButton) { HSLogger.warn(`Could not find real button for ${buttonId}`, this.context); return; }

        await HSAmbrosiaHelper.ensureLoadoutModeIsLoad();
        await HSUtils.hiddenAction(async () => { realButton.click(); });
    }

    async showQuickBar() {
        const groupWrapper = await this.ensureAmbrosiaSection();
        if (!groupWrapper) {
            HSLogger.warn("Could not find group wrapper for quickbar", this.context);
            return;
        }
        const wrapper = groupWrapper.querySelector(`#${HSGlobal.HSAmbrosia.quickBarId}`) as HTMLElement;
        if (wrapper) {
            wrapper.style.display = "inline-flex";
            HSUI.injectStyle(this.host.getQuickbarCSS(), this.host.getQuickbarCSSId());
            await this.refreshQuickbarIcons();
            await this.host.refreshActiveLoadoutFromState();
        } else {
            HSLogger.warn("Could not find quickbar wrapper", this.context);
        }
    }

    async hideQuickBar() {
        const groupWrapper = await this.ensureAmbrosiaSection();
        if (!groupWrapper) {
            HSLogger.warn("Could not find group wrapper for quickbar", this.context);
            return;
        }
        const ambQuickBar = groupWrapper.querySelector(`#${HSGlobal.HSAmbrosia.quickBarId}`) as HTMLElement;
        if (ambQuickBar) {
            ambQuickBar.style.display = "none";
            HSUI.removeInjectedStyle(this.host.getQuickbarCSSId());
        }
    }

    async destroy() {
        this.#endPickupMode();
        this.cleanupQuickbarClickHandlers();
        HSQuickbarManager.getInstance().removeSection("ambrosia");
        HSUI.removeInjectedStyle(this.host.getQuickbarCSSId());
    }

    // ======================================================
    // ------------------- Icon storage --------------------
    // ======================================================

    #loadAmbrosiaIcons(): void {
        try {
            const raw = localStorage.getItem(this.#AMBROSIA_ICON_STORAGE_KEY);
            if (!raw) { this.#ambrosiaSlotIcons = new Map(); return; }
            const parsed = JSON.parse(raw) as Record<string, string>;
            this.#ambrosiaSlotIcons = new Map(Object.entries(parsed));
        } catch (error) {
            HSLogger.warn(`HSAmbrosiaQuickbar.loadAmbrosiaIcons failed: ${String(error)}`, this.context);
            this.#ambrosiaSlotIcons = new Map();
        }
    }

    #saveAmbrosiaIcons(): void {
        try {
            const obj: Record<string, string> = {};
            this.#ambrosiaSlotIcons.forEach((url, key) => { obj[key] = url; });
            localStorage.setItem(this.#AMBROSIA_ICON_STORAGE_KEY, JSON.stringify(obj));
        } catch (error) {
            HSLogger.warn(`HSAmbrosiaQuickbar.saveAmbrosiaIcons failed: ${String(error)}`, this.context);
        }
    }

    #getAmbrosiaSlotIcon(slotId: string): string | undefined {
        return this.#ambrosiaSlotIcons.get(slotId);
    }

    #setAmbrosiaSlotIcon(slotId: string, url: string): void {
        this.#ambrosiaSlotIcons.set(slotId, url);
        this.#saveAmbrosiaIcons();
    }

    #clearAmbrosiaSlotIcon(slotId: string): void {
        this.#ambrosiaSlotIcons.delete(slotId);
        this.#saveAmbrosiaIcons();
    }

    #setIconForSlot(slotId: string, url: string): void {
        this.#setAmbrosiaSlotIcon(slotId, url);
        void this.refreshQuickbarIcons();
    }

    #clearIconForSlot(slotId: string): void {
        this.#clearAmbrosiaSlotIcon(slotId);
        void this.refreshQuickbarIcons();
    }

    // ======================================================
    // ------------------- Icon pickup ---------------------
    // ======================================================

    #startPickupMode(slotId: string): void {
        if (this.#isPickingIcon) { HSLogger.debug(() => 'Icon pickup mode already active; request ignored.', this.context); return; }

        this.#wasGdsEnabled = HSSettings.getSetting('useGameData')?.isEnabled() ?? null;
        if (this.#wasGdsEnabled) {
            HSSettings.getSetting('useGameData')?.disable();
        }

        this.#isPickingIcon = true;
        this.#pickTargetSlotId = slotId;

        const groupWrapper = HSQuickbarManager.getInstance().getSection("ambrosia");
        const quickbar = groupWrapper?.querySelector(`#${HSGlobal.HSAmbrosia.quickBarId}`) as HTMLElement | null;
        if (quickbar) {
            quickbar.querySelectorAll(".blueberryLoadoutSlot").forEach((btn) => {
                const b = btn as HTMLElement;
                const originalId = b.dataset.originalId;
                if (originalId === slotId) {
                    b.classList.add("hs-quickbar-slot-pickmode");
                } else {
                    b.classList.remove("hs-quickbar-slot-pickmode");
                }
            });
        }

        HSUI.Notify('Icon picker active: click an in-game icon/image to assign to this slot. Any click ends mode.', { position: 'topRight', notificationType: 'default' });

        this.#pickDocClickListener = (event: MouseEvent) => {
            const target = event.target instanceof Element ? event.target : null;
            if (!target || (quickbar && quickbar.contains(target))) { this.#endPickupMode(); return; }
            if (this.#pickTargetSlotId === null) { this.#endPickupMode(); return; }

            const iconUrl = this.#findIconUrlFromEventTarget(target);
            if (!iconUrl) {
                HSUI.Notify('No usable icon found on the clicked element.', { notificationType: 'warning' });
                this.#endPickupMode();
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            this.#setIconForSlot(this.#pickTargetSlotId, iconUrl);
            HSUI.Notify('Ambrosia slot icon set successfully', { notificationType: 'success' });
            this.#endPickupMode();
        };

        document.addEventListener('click', this.#pickDocClickListener, true);
    }

    #endPickupMode(): void {
        this.#isPickingIcon = false;
        this.#pickTargetSlotId = null;
        if (this.#pickDocClickListener) {
            document.removeEventListener('click', this.#pickDocClickListener, true);
            this.#pickDocClickListener = null;
        }
        const groupWrapper = HSQuickbarManager.getInstance().getSection("ambrosia");
        const quickbar = groupWrapper?.querySelector(`#${HSGlobal.HSAmbrosia.quickBarId}`) as HTMLElement | null;
        if (quickbar) {
            quickbar.querySelectorAll(".blueberryLoadoutSlot").forEach((btn) => {
                (btn as HTMLElement).classList.remove("hs-quickbar-slot-pickmode");
            });
        }
        if (this.#wasGdsEnabled !== null) {
            const gdsSetting = HSSettings.getSetting('useGameData');
            if (gdsSetting) {
                if (this.#wasGdsEnabled && !gdsSetting.isEnabled()) gdsSetting.enable();
                if (!this.#wasGdsEnabled && gdsSetting.isEnabled()) gdsSetting.disable();
            }
            this.#wasGdsEnabled = null;
        }
    }

    #findIconUrlFromEventTarget(target: EventTarget | null): string | null {
        let element = target instanceof Element ? target : null;
        let depth = 0;
        while (element && element !== document.documentElement && depth < 8) {
            const url = this.#getIconUrlFromElement(element);
            if (url) return url;
            element = element.parentElement;
            depth += 1;
        }
        return null;
    }

    #getIconUrlFromElement(element: Element): string | null {
        if (element instanceof HTMLImageElement && element.src) {
            return element.src;
        }
        const style = window.getComputedStyle(element);
        const bg = style.backgroundImage;
        if (bg && bg !== 'none') {
            const match = /^url\(["']?(.*?)["']?\)$/.exec(bg);
            if (match && match[1]) return match[1];
        }
        return null;
    }

    private async ensureAmbrosiaSection(): Promise<HTMLElement | null> {
        await HSQuickbarManager.getInstance().whenSectionInjected("ambrosia");
        const section = HSQuickbarManager.getInstance().getSection("ambrosia");
        return section ?? null;
    }
}
