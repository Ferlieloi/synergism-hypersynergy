import { HSElementHooker } from "../hs-core/hs-elementhooker";
import { HSUtils } from "../hs-utils/hs-utils";
import { HSLogger } from "../hs-core/hs-logger";
import { HSModuleManager } from "../hs-core/module/hs-module-manager";
import { HSUI } from "../hs-core/hs-ui";
import { HSSettings } from "../hs-core/settings/hs-settings";
import { HSGameData } from "../hs-core/gds/hs-gamedata";
import { HSGameDataAPI } from "../hs-core/gds/hs-gamedata-api";
import { HSCorruption, HSCorruptionLevels, HSCorruptionUserLoadout } from "./hs-corruption";
import { HSQOLQuickbarBase } from "./hs-qolQuickbarBase";

/**
 * Class: HSQOLCorruptionQuickbar
 * IsExplicitHSModule: No
 * Description: Corruption Quickbar component.
 *     Render a compact corruption loadout quickbar in the header.
 *     Integrates with the vanilla corruption loadout table and enables quick switching
 *     and custom icon assignment per slot.
 *     Provide a stable public lifecycle: `createSection()`, `setup()`, `teardown()`.
 */
export class HSQOLCorruptionQuickbar extends HSQOLQuickbarBase {
    protected readonly context = 'HSQOLCorruptionQuickbar';
    protected readonly sectionIdInternal = 'corruptionQuickBar';
    protected readonly sectionIdCss = 'corruptionQuickBar';

    #corruptionSummaryWrapper: HTMLDivElement | null = null;
    #currentCorruptionsTextEl: HTMLDivElement | null = null;
    #nextCorruptionTextEl: HTMLDivElement | null = null;
    #slotsWrapper: HTMLDivElement | null = null;
    #slots: HTMLButtonElement[] = [];
    #loadouts: HSCorruptionUserLoadout[] = [];
    #corruptionObserverUnsubscribe: (() => void) | null = null;
    #corruptionCleanseQuickButton: HTMLButtonElement | null = null;
    #corruptionCleanseVanillaButton: HTMLElement | null = null;
    #corruptionCleanseButtonHandler: ((event: MouseEvent) => void) | null = null;
    #maxCorruptionLevel = 0;
    #zeroCorruption: HSCorruptionLevels = { viscosity: 0, drought: 0, deflation: 0, extinction: 0, illiteracy: 0, recession: 0, dilation: 0, hyperchallenge: 0 };
    #lastRefreshCurrent: HSCorruptionLevels | null = null;
    #lastRefreshNext: HSCorruptionLevels | null = null;
    #lastRefreshMaxCorruptionLevel = 0;
    #gameDataSubscriptionId: string | undefined = undefined;

    #isPickingIcon = false;
    #pickTargetSlotIndex: number | null = null;
    #pickDocClickListener: ((event: MouseEvent) => void) | null = null;
    #wasGdsEnabled: boolean | null = null;

    #slotEventHandlers: Map<HTMLButtonElement, { click: (event: MouseEvent) => Promise<void>; contextmenu: (event: MouseEvent) => void }> = new Map();

    /** Subscribe to corruption state updates and track active loadout matching. */
    #setupCorruptionObserver(): void {
        if (this.#corruptionObserverUnsubscribe) return;

        this.#corruptionObserverUnsubscribe = HSCorruption.observeCorruptions((current, next) => {
            this.#refreshActive(current, next);
        });
    }

    protected createDOM(): void {
        if (!this.container) return;

        this.#corruptionSummaryWrapper = document.createElement('div');
        this.#corruptionSummaryWrapper.id = 'hs-corruption-summary-wrapper';
        this.#corruptionSummaryWrapper.className = 'hs-quickbar-summary-wrapper';

        const minibarsSetting = document.getElementById('hs-setting-ambrosia-minibar-btn') as HTMLElement;
        if (minibarsSetting && minibarsSetting.classList.contains('hs-disabled'))
            this.#corruptionSummaryWrapper.classList.add('hs-hidden');

        this.#currentCorruptionsTextEl = document.createElement('div');
        this.#currentCorruptionsTextEl.id = 'hs-corruption-current-levels';

        this.#nextCorruptionTextEl = document.createElement('div');
        this.#nextCorruptionTextEl.id = 'hs-corruption-next-levels';
        this.#nextCorruptionTextEl.classList.add('hs-hidden');

        this.#corruptionSummaryWrapper.appendChild(this.#currentCorruptionsTextEl);
        this.#corruptionSummaryWrapper.appendChild(this.#nextCorruptionTextEl);

        this.#slotsWrapper = document.createElement('div');
        this.#slotsWrapper.id = 'hs-corruption-slots-wrapper';
        this.#slotsWrapper.className = 'hs-quickbar-slots-wrapper';

        const infobox = document.createElement('div');
        infobox.id = 'hs-corruption-infobox';
        infobox.textContent = '?';
        infobox.title = 'Alt+Click a slot to pick an icon for it.\nRight-click to clear the assigned icon.';

        this.container.appendChild(this.#corruptionSummaryWrapper);
        this.container.appendChild(this.#slotsWrapper);
        this.container.appendChild(infobox);
    }

    /** Create the immutable corruption cleanse button. */
    #createCorruptionCleanseButton(): HTMLButtonElement {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'hs-corruption-slot hs-corruption-cleanse-button';
        button.title = 'Cleanse';

        this.#corruptionCleanseButtonHandler = (event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();
            const confirmButton = this.#getCachedCorruptionCleanseConfirmButton();
            if (confirmButton) {
                confirmButton.click();
            } else {
                HSLogger.warn('Could not find #corruptionCleanseConfirm to trigger', this.context);
            }
        };

        button.addEventListener('click', this.#corruptionCleanseButtonHandler);
        return button;
    }

    /** Cleans up quickbar DOM content from the container. */
    protected cleanupDOM(): void {
        if (this.container) this.container.innerHTML = '';
    }

    /** Initialize quickbar: load corruption data + build slots + subscribe to updates. */
    protected async onSetup(): Promise<void> {
        const corruptionContainer = await HSElementHooker.HookElement('#corruptionLoadouts');
        if (!corruptionContainer || !(corruptionContainer instanceof HTMLElement)) {
            HSLogger.warn('Corruption quickbar setup: #corruptionLoadouts not found', this.context);
            return;
        }

        const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        if (gameDataAPI) {
            this.#maxCorruptionLevel = gameDataAPI.getMaxCorruptionLevel();
        }

        this.#subscribeGameDataChanges();

        await HSCorruption.cacheCorruptionElements();
        HSCorruption.loadCorruptionLoadoutIcons();
        await this.#buildSlots();

        if (!this.#corruptionCleanseQuickButton && this.#slotsWrapper) {
            const cleanseButton = this.#createCorruptionCleanseButton();
            this.#slotsWrapper.appendChild(cleanseButton);
            this.#corruptionCleanseQuickButton = cleanseButton;
        }

        this.#setupCorruptionObserver();
        await HSCorruption.startCorruptionObservationContainer('#corruptionStatsLoadouts');
    }

    /** Tear down quickbar and release resources/observers. */
    protected onTeardown(): void {
        this.#cleanupCorruptionObserver();
        this.#cleanupSlotEventHandlers();
        this.#cleanupCorruptionCleanseButton();
        this.#unsubscribeGameDataChanges();
        this.#reset();
        HSCorruption.clearCache();
    }

    /** Remove event listeners from the corruption cleanse button. */
    #cleanupCorruptionCleanseButton(): void {
        if (this.#corruptionCleanseQuickButton && this.#corruptionCleanseButtonHandler) {
            this.#corruptionCleanseQuickButton.removeEventListener('click', this.#corruptionCleanseButtonHandler);
        }
        this.#corruptionCleanseQuickButton = null;
        this.#corruptionCleanseVanillaButton = null;
        this.#corruptionCleanseButtonHandler = null;
    }

    #getCachedCorruptionCleanseConfirmButton(): HTMLElement | null {
        if (this.#corruptionCleanseVanillaButton) {
            return this.#corruptionCleanseVanillaButton;
        }

        const confirmButton = document.getElementById('corruptionCleanseConfirm') as HTMLElement | null;
        this.#corruptionCleanseVanillaButton = confirmButton;
        return confirmButton;
    }

    /** Reset instance state and DOM references to defaults. */
    #reset(): void {
        if (this.container) this.container.innerHTML = '';
        this.#corruptionSummaryWrapper = null;
        this.#currentCorruptionsTextEl = null;
        this.#nextCorruptionTextEl = null;
        this.#slotsWrapper = null;
        this.#loadouts = [];
        this.#slots = [];
        this.#corruptionCleanseQuickButton = null;
        this.#corruptionCleanseVanillaButton = null;
        this.#corruptionCleanseButtonHandler = null;
        this.#maxCorruptionLevel = 0;
        this.#isPickingIcon = false;
        this.#pickTargetSlotIndex = null;
    }

    /** Remove click/context menu event listeners from saved slot buttons. */
    #cleanupSlotEventHandlers(): void {
        for (const [slot, handlers] of this.#slotEventHandlers.entries()) {
            slot.removeEventListener('click', handlers.click);
            slot.removeEventListener('contextmenu', handlers.contextmenu);
        }
        this.#slotEventHandlers.clear();
    }

    /** Unsubscribe corruption state observer if subscribed. */
    #cleanupCorruptionObserver(): void {
        if (this.#corruptionObserverUnsubscribe) {
            this.#corruptionObserverUnsubscribe();
            this.#corruptionObserverUnsubscribe = null;
        }
    }

    #subscribeGameDataChanges(): void {
        const gameDataMod = HSModuleManager.getModule<HSGameData>('HSGameData');
        if (gameDataMod && !this.#gameDataSubscriptionId) {
            this.#gameDataSubscriptionId = gameDataMod.subscribeGameDataChange(this.#onGameDataUpdated.bind(this));
            HSLogger.debug(() => 'HSQOLCorruptionQuickbar subscribed to game data changes', this.context);
        }
    }

    #unsubscribeGameDataChanges(): void {
        const gameDataMod = HSModuleManager.getModule<HSGameData>('HSGameData');
        if (gameDataMod && this.#gameDataSubscriptionId) {
            gameDataMod.unsubscribeGameDataChange(this.#gameDataSubscriptionId);
            this.#gameDataSubscriptionId = undefined;
            HSLogger.debug(() => 'HSQOLCorruptionQuickbar unsubscribed from game data changes', this.context);
        }
    }

    #onGameDataUpdated(): void {
        const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        if (!gameDataAPI) return;

        this.#maxCorruptionLevel = gameDataAPI.getMaxCorruptionLevel();
        void this.#refreshCurrentLoadedCorruptions();
    }

    async #refreshCurrentLoadedCorruptions(): Promise<void> {
        if (!this.container) return;

        const { current, next } = await HSCorruption.getBothLoadedCorruptions();
        this.#refreshActive(current, next);
    }

    /** Build each corruption loadout slot button and apply saved icons. */
    async #buildSlots(): Promise<void> {
        if (!this.container || !this.#slotsWrapper) return;
        if (this.#slots.length > 0) return;

        await HSElementHooker.HookElement('#corruptionStatsLoadouts');

        const loadouts = await HSCorruption.getUserLoadouts();
        if (!loadouts.length) {
            HSLogger.warn('No corruption loadouts found.', this.context);
            return;
        }

        this.#loadouts = loadouts;

        loadouts.forEach((loadout, index) => {
            const slot = this.#createSlotButton(loadout, index);
            this.#slotsWrapper?.appendChild(slot);
            this.#slots.push(slot);
            this.#applySlotIcon(slot);
        });
    }

    /** Create a slot button for one corruption loadout row. */
    #createSlotButton(loadout: HSCorruptionUserLoadout, index: number): HTMLButtonElement {
        const slotName = loadout.name;
        const loadButton = loadout.loadButton;

        const slot = document.createElement('button');
        slot.type = 'button';
        slot.className = 'hs-corruption-slot';
        slot.title = `🔧 ${slotName}`;
        slot.setAttribute('aria-label', slotName);
        slot.dataset.corruptionLoadout = slotName;
        slot.dataset.quickbarIndex = String(index + 1);

        const iconEl = document.createElement('div');
        iconEl.className = 'hs-corruption-slot-icon-image';
        slot.appendChild(iconEl);

        const clickHandler = async (event: MouseEvent) => {
            if (event.altKey) {
                event.preventDefault();
                event.stopPropagation();
                this.#startPickupMode(index);
                return;
            }

            if (loadButton) {
                loadButton.click();
                await HSUtils.sleep(50);
                await HSCorruption.refreshLoadedCorruptions();
                const { current, next } = await HSCorruption.getBothLoadedCorruptions();
                this.#refreshActive(current, next);
            }
        };

        const contextMenuHandler = (event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();
            this.#clearIconForSlot(index);
            HSUI.Notify('Corruption slot icon cleared', { notificationType: 'default' });
        };

        slot.addEventListener('click', clickHandler);
        slot.addEventListener('contextmenu', contextMenuHandler);
        this.#slotEventHandlers.set(slot, { click: clickHandler, contextmenu: contextMenuHandler });

        return slot;
    }

    /** Normalize a saved loadout's levels for comparison against currently loaded corruption values. */
    #normalizeLoadoutLevels(levels: HSCorruptionLevels): HSCorruptionLevels {
        if (this.#maxCorruptionLevel <= 0) {
            return levels;
        }

        return HSCorruption.corruptionNames.reduce((normalized, key) => {
            normalized[key] = Math.min(levels[key], this.#maxCorruptionLevel);
            return normalized;
        }, {} as HSCorruptionLevels);
    }

    /** Update slot border and status based on current/next corruption match state. */
    #levelsEqual(a: HSCorruptionLevels | null, b: HSCorruptionLevels | null): boolean {
        if (!a || !b) return false;
        return HSCorruption.corruptionNames.every((key) => a[key] === b[key]);
    }

    #refreshActive(current: HSCorruptionLevels, next: HSCorruptionLevels): void {
        if (!this.container) return;

        const currentIsSame = this.#levelsEqual(current, this.#lastRefreshCurrent);
        const nextIsSame = this.#levelsEqual(next, this.#lastRefreshNext);
        const maxCapIsSame = this.#maxCorruptionLevel === this.#lastRefreshMaxCorruptionLevel;

        if (currentIsSame && nextIsSame && maxCapIsSame) {
            return;
        }

        this.#lastRefreshCurrent = { ...current };
        this.#lastRefreshNext = { ...next };
        this.#lastRefreshMaxCorruptionLevel = this.#maxCorruptionLevel;

        this.#displayCorruptionStrings(current, next);

        this.#slots.forEach((slot) => {
            slot.classList.remove('hs-rainbow-border');
            slot.classList.remove('hs-silver-border');
        });
        if (this.#corruptionCleanseQuickButton) {
            this.#corruptionCleanseQuickButton.classList.remove('hs-rainbow-border');
            this.#corruptionCleanseQuickButton.classList.remove('hs-silver-border');
        }

        this.#loadouts.forEach((loadout, index) => {
            const slot = this.#slots[index];
            if (!slot) return;

            const normalizedLevels = this.#normalizeLoadoutLevels(loadout.levels);
            const currentMatch = HSCorruption.matches(normalizedLevels, current);
            const nextMatch = !currentMatch && HSCorruption.matches(normalizedLevels, next);
            if (currentMatch) {
                slot.classList.add('hs-rainbow-border');
            } else if (nextMatch) {
                slot.classList.add('hs-silver-border');
            }
        });

        const cleanseCurrentMatch = HSCorruption.matches(this.#zeroCorruption, current);
        const cleanseNextMatch = HSCorruption.matches(this.#zeroCorruption, next);
        if (this.#corruptionCleanseQuickButton) {
            if (cleanseCurrentMatch) {
                this.#corruptionCleanseQuickButton.classList.add('hs-rainbow-border');
            }
            if (cleanseNextMatch) {
                this.#corruptionCleanseQuickButton.classList.add('hs-silver-border');
            }
        }
    }

    /** Display current and next corruption level strings under summary. */
    #displayCorruptionStrings(current: HSCorruptionLevels, next: HSCorruptionLevels): void {
        const formatLevels = (levels: HSCorruptionLevels) =>
            HSCorruption.corruptionNames
                .map((name) => String(levels[name] ?? 0))
                .join('/');

        const currentText = formatLevels(current);
        const nextText = formatLevels(next);

        if (this.#currentCorruptionsTextEl) {
            this.#currentCorruptionsTextEl.textContent = currentText;
        }

        const nextIsDifferent = nextText !== currentText;

        if (this.#nextCorruptionTextEl) {
            this.#nextCorruptionTextEl.classList.toggle('hs-hidden', !nextIsDifferent);
            if (nextIsDifferent) {
                this.#nextCorruptionTextEl.textContent = ` ⇨ ${nextText}`;
            }
        }
    }


    // =================================
    // ------- Icons management --------
    // =================================

    /** Apply stored icon class/style to a quickbar slot based on loaded metadata. */
    #applySlotIcon(slot: HTMLButtonElement): void {
        const slotKey = slot.dataset.quickbarIndex;
        if (!slotKey) return;
        const slotNumber = Number(slotKey);
        if (Number.isNaN(slotNumber)) return;
        const url = HSCorruption.getCorruptionLoadoutIcon(slotNumber);

        this.#updateSlotIcon(slot, url ?? null);
        if (url) {
            slot.classList.add('hs-corruption-slot-icon');
        } else {
            slot.classList.remove('hs-corruption-slot-icon');
        }
    }

    /** Assign given icon URL to a slot and persist in corruption storage. */
    #setIconForSlot(slotIndex: number, iconUrl: string): void {
        const key = slotIndex + 1;
        HSCorruption.setCorruptionLoadoutIcon(key, iconUrl);

        const slot = this.#slots[slotIndex];
        if (slot) {
            this.#updateSlotIcon(slot, iconUrl);
        }
    }

    /** Clear stored icon for a slot and update UI. */
    #clearIconForSlot(slotIndex: number): void {
        const key = slotIndex + 1;
        HSCorruption.clearCorruptionLoadoutIcon(key);

        const slot = this.#slots[slotIndex];
        if (slot) {
            this.#updateSlotIcon(slot, null);
        }
    }

    /** Apply icon URL to button element and toggle visual class. */
    #updateSlotIcon(slot: HTMLButtonElement, iconUrl: string | null): void {
        const iconEl = slot.querySelector<HTMLDivElement>('.hs-corruption-slot-icon-image');
        if (!iconEl) return;

        if (iconUrl) {
            iconEl.style.backgroundImage = `url(${iconUrl})`;
            iconEl.style.display = 'block';
            slot.classList.add('hs-corruption-slot-icon');
        } else {
            iconEl.style.backgroundImage = '';
            iconEl.style.display = 'none';
            slot.classList.remove('hs-corruption-slot-icon');
        }
    }

    /** Extract a usable icon URL from the clicked element or its parents. */
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

    /** Return icon URL from element styles or image source, if present. */
    #getIconUrlFromElement(element: Element): string | null {
        if (element instanceof HTMLImageElement && element.src) {
            return element.src;
        }
        const style = window.getComputedStyle(element);
        const bg = style.backgroundImage;
        if (bg && bg !== 'none') {
            const match = /^url\(["']?(.*?)["']?\)$/.exec(bg);
            if (match && match[1]) {
                return match[1];
            }
        }
        return null;
    }

    /** End slot icon pick mode and restore previous game data settings. */
    #endPickupMode(): void {
        this.#isPickingIcon = false;
        this.#pickTargetSlotIndex = null;

        if (this.#pickDocClickListener) {
            document.removeEventListener('click', this.#pickDocClickListener, true);
            this.#pickDocClickListener = null;
        }

        // restore GDS to prior state
        if (this.#wasGdsEnabled !== null) {
            const gdsSetting = HSSettings.getSetting('useGameData');
            if (gdsSetting) {
                if (this.#wasGdsEnabled && !gdsSetting.isEnabled()) {
                    gdsSetting.enable();
                }
                if (!this.#wasGdsEnabled && gdsSetting.isEnabled()) {
                    gdsSetting.disable();
                }
            }
            this.#wasGdsEnabled = null;
        }

        this.#slots.forEach((slot) => slot.classList.remove('hs-corruption-slot-pickmode'));
    }

    /** Enter slot icon pick mode to select an icon from page elements. */
    #startPickupMode(slotIndex: number): void {
        if (this.#isPickingIcon) {
            // this.#cancelPickupMode('Already in pick mode');
            // return;
        }

        this.#wasGdsEnabled = HSSettings.getSetting('useGameData')?.isEnabled() ?? null;
        if (this.#wasGdsEnabled) {
            HSSettings.getSetting('useGameData')?.disable();
        }

        this.#isPickingIcon = true;
        this.#pickTargetSlotIndex = slotIndex;

        this.#slots.forEach((slot, idx) => {
            if (idx === slotIndex) {
                slot.classList.add('hs-corruption-slot-pickmode');
            } else {
                slot.classList.remove('hs-corruption-slot-pickmode');
            }
        });

        HSUI.Notify('Icon picker active: click an in-game icon/image to assign to this slot. Any click ends mode.', { notificationType: 'default' });

        this.#pickDocClickListener = (event: MouseEvent) => {
            const target = event.target instanceof Element ? event.target : null;
            if (!target || !this.container) {
                this.#endPickupMode();
                return;
            }

            if (this.#pickTargetSlotIndex === null) {
                this.#endPickupMode();
                return;
            }

            const iconUrl = this.#findIconUrlFromEventTarget(event.target);
            if (!iconUrl) {
                HSUI.Notify('No usable icon found on the clicked element.', { notificationType: 'warning' });
                this.#endPickupMode();
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            this.#setIconForSlot(this.#pickTargetSlotIndex, iconUrl);
            HSUI.Notify('Corruption slot icon set successfully', { notificationType: 'success' });
            this.#endPickupMode();
        };

        document.addEventListener('click', this.#pickDocClickListener, true);
    }
}
