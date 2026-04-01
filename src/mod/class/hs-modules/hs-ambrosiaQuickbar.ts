import type { HSAmbrosia } from "./hs-ambrosia";
import { HSQuickbarManager } from "./hs-quickbarManager";
import { HSLogger } from "../hs-core/hs-logger";
import { HSUI } from "../hs-core/hs-ui";
import { HSUtils } from "../hs-utils/hs-utils";
import { HSSetting } from "../hs-core/settings/hs-setting";
import { HSSettings } from "../hs-core/settings/hs-settings";
import { HSGlobal } from "../hs-core/hs-global";
import { HSAmbrosiaHelper } from "./hs-ambrosiaHelper";
import { AMBROSIA_ICON, AMBROSIA_LOADOUT_SLOT } from "../../types/module-types/hs-ambrosia-types";

export class HSAmbrosiaQuickbar {
    readonly context = 'HSAmbrosiaQuickbar';
    readonly host: HSAmbrosia;
    #quickBarClickHandlers: Map<HTMLButtonElement, (e: Event) => Promise<void>> = new Map();

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
            HSLogger.debug("Ambrosia Quickbar section factory called", this.context);
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
                HSLogger.debug("quickbar hidden due to settings", this.context);
            } else {
                quickbar.style.display = "";
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
            HSLogger.debug("Quickbar already exists in group wrapper", this.context);
            return;
        }

        const loadoutContainer = this.host.getLoadoutContainer();
        if (loadoutContainer) {
            const clone = loadoutContainer.cloneNode(true) as HTMLElement;
            clone.id = HSGlobal.HSAmbrosia.quickBarId;
            clone.style.display = "none";

            const cloneSettingButton = clone.querySelector(".blueberryLoadoutSetting") as HTMLButtonElement;
            const cloneLoadoutButtons = clone.querySelectorAll(".blueberryLoadoutSlot") as NodeListOf<HTMLButtonElement>;

            cloneLoadoutButtons.forEach((button) => {
                const buttonId = button.id;
                button.dataset.originalId = buttonId;
                button.id = `${HSGlobal.HSAmbrosia.quickBarLoadoutIdPrefix}-${buttonId}`;

                const buttonHandler = async (e: Event) => {
                    await this.onQuickBarClick(e, buttonId);
                };

                this.#quickBarClickHandlers.set(button, buttonHandler);
                button.addEventListener("click", buttonHandler);
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

            await this.refreshQuickbarIcons();
            await this.host.refreshActiveLoadoutFromState();
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
        clone.style.display = "";

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
            btn.replaceWith(btn.cloneNode(true));
        });

        quickbar.querySelectorAll(".blueberryLoadoutSlot").forEach((button: Element) => {
            const btn = button as HTMLButtonElement;
            const buttonId = btn.dataset.originalId || "";
            const buttonHandler = async (e: Event) => {
                await this.onQuickBarClick(e, buttonId);
            };
            btn.addEventListener("click", buttonHandler);
            this.#quickBarClickHandlers.set(btn, buttonHandler);
        });
    }

    cleanupQuickbarClickHandlers() {
        for (const [button, handler] of this.#quickBarClickHandlers.entries()) {
            button.removeEventListener("click", handler);
        }
        this.#quickBarClickHandlers.clear();
    }

    async refreshQuickbarIcons() {
        const hostState = this.host.getLoadoutState();
        const ambQuickBar = this.host.getPageHeader()?.querySelector(`#${HSGlobal.HSAmbrosia.quickBarId}`) as HTMLElement;

        if (ambQuickBar) {
            const quickbarSlots = ambQuickBar.querySelectorAll(".blueberryLoadoutSlot") as NodeListOf<HTMLElement>;
            quickbarSlots.forEach((slot) => {
                const originalSlotId = slot.dataset.originalId;
                if (!originalSlotId) return;
                const slotEnum = HSAmbrosiaHelper.getSlotEnumBySlotId(originalSlotId);
                if (!slotEnum) return;
                const iconEnum = hostState.get(slotEnum);
                if (iconEnum) {
                    const icon = HSGlobal.HSAmbrosia.ambrosiaLoadoutIcons.get(iconEnum);
                    if (icon) {
                        slot.classList.add("hs-ambrosia-slot");
                        slot.style.backgroundImage = `url(${icon.url})`;
                    }
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
                const slotEnum = HSAmbrosiaHelper.getSlotEnumBySlotId(slot.id);
                if (!slotEnum) return;
                const iconEnum = hostState.get(slotEnum);
                if (iconEnum) {
                    const icon = HSGlobal.HSAmbrosia.ambrosiaLoadoutIcons.get(iconEnum);
                    if (icon) {
                        slot.classList.add("hs-ambrosia-slot");
                        slot.style.backgroundImage = `url(${icon.url})`;
                    }
                } else {
                    slot.classList.remove("hs-ambrosia-slot");
                    slot.style.backgroundImage = "";
                }
            });

            let hint: HTMLSpanElement | null = document.getElementById("bbLoadoutIconHint");
            if (hostState.size === 0) {
                if (!hint) {
                    hint = document.createElement("span");
                    hint.id = "bbLoadoutIconHint";
                    hint.textContent = "Drag&drop icons from the grid to the bar! (Right-click on a slot to clear)";
                    hint.style.color = "#93acc2";
                    hint.style.marginTop = "5px";
                    originalBar.parentElement?.insertBefore(hint, originalBar);
                }
            } else {
                if (hint) hint.remove();
            }
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
        const realButton = document.querySelector(`#${buttonId} `) as HTMLButtonElement;

        if (realButton) {
            await HSAmbrosiaHelper.ensureLoadoutModeIsLoad();
            await HSUtils.hiddenAction(async () => {
                realButton.click();
            });
        } else {
            HSLogger.warn(`Could not find real button for ${buttonId}`, this.context);
        }
    }

    async showQuickBar() {
        const groupWrapper = await this.ensureAmbrosiaSection();
        if (!groupWrapper) {
            HSLogger.warn("Could not find group wrapper for quickbar", this.context);
            return;
        }
        const wrapper = groupWrapper.querySelector(`#${HSGlobal.HSAmbrosia.quickBarId}`) as HTMLElement;
        if (wrapper) {
            wrapper.style.display = "";
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
        this.cleanupQuickbarClickHandlers();
        HSQuickbarManager.getInstance().removeSection("ambrosia");
        HSUI.removeInjectedStyle(this.host.getQuickbarCSSId());
    }

    private async ensureAmbrosiaSection(): Promise<HTMLElement | null> {
        await HSQuickbarManager.getInstance().whenSectionInjected("ambrosia");
        const section = HSQuickbarManager.getInstance().getSection("ambrosia");
        return section ?? null;
    }
}
