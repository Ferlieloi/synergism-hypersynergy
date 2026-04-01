import { HSModuleManager } from "../hs-core/module/hs-module-manager";
import { HSElementHooker } from "../hs-core/hs-elementhooker";
import { HSUtils } from "../hs-utils/hs-utils";
import { HSLogger } from "../hs-core/hs-logger";
import { HSUI } from "../hs-core/hs-ui";
import { HSSettings } from "../hs-core/settings/hs-settings";
import { HSCorruption, HSCorruptionLoadout } from "./hs-corruption";
import { CorruptionLevels } from "../../types/data-types/hs-player-savedata";

const CORRUPTION_ICON_STORAGE_KEY = 'hs-corruption-loadout-icons';

export class HSQOLCorruptionQuickbar {
    #context = 'HSQOLCorruptionQuickbar';

    #container: HTMLDivElement | null = null;
    #corruptionSummaryWrapper: HTMLDivElement | null = null;
    #currentCorruptionsTextEl: HTMLDivElement | null = null;
    #nextCorruptionTextEl: HTMLDivElement | null = null;
    #summaryToggleBtn: HTMLButtonElement | null = null;
    #slotsWrapper: HTMLDivElement | null = null;
    #isSummaryVisible = true;
    #slots: HTMLButtonElement[] = [];
    #loadouts: HSCorruptionLoadout[] = [];
    #corruptionObserverUnsubscribe: (() => void) | null = null;

    #corruptionLoadoutIcons: Map<number, string> = new Map();
    #isPickingIcon = false;
    #pickTargetSlotIndex: number | null = null;
    #pickDocClickListener: ((event: MouseEvent) => void) | null = null;
    #wasGdsEnabled: boolean | null = null;

    public createSection(): HTMLElement {
        const container = document.createElement('div');
        container.id = 'corruptionQuickBar';
        container.className = 'hs-corruption-quickbar';
        return container;
    }

    public async setup(container: HTMLDivElement): Promise<void> {
        this.#container = container;
        this.#reset();

        this.#corruptionSummaryWrapper = document.createElement('div');
        this.#corruptionSummaryWrapper.className = 'hs-corruption-summary-wrapper';

        this.#summaryToggleBtn = document.createElement('button');
        this.#summaryToggleBtn.id = 'hs-corruption-summary-toggle';
        this.#summaryToggleBtn.type = 'button';
        this.#summaryToggleBtn.textContent = '▾';
        this.#summaryToggleBtn.addEventListener('click', () => {
            if (!this.#corruptionSummaryWrapper || !this.#summaryToggleBtn) return;
            this.#isSummaryVisible = !this.#isSummaryVisible;
            this.#corruptionSummaryWrapper.classList.toggle('hs-hidden', !this.#isSummaryVisible);
            this.#summaryToggleBtn.textContent = this.#isSummaryVisible ? '▾' : '▸';
        });

        this.#currentCorruptionsTextEl = document.createElement('div');
        this.#currentCorruptionsTextEl.id = 'hs-corruption-current-value';

        this.#nextCorruptionTextEl = document.createElement('div');
        this.#nextCorruptionTextEl.id = 'hs-corruption-next-value';
        this.#nextCorruptionTextEl.classList.add('hs-hidden');

        this.#corruptionSummaryWrapper.appendChild(this.#currentCorruptionsTextEl);
        this.#corruptionSummaryWrapper.appendChild(this.#nextCorruptionTextEl);
        this.#corruptionSummaryWrapper.classList.toggle('hs-hidden', !this.#isSummaryVisible);

        this.#container?.appendChild(this.#summaryToggleBtn!);
        this.#slotsWrapper = document.createElement('div');
        this.#slotsWrapper.className = 'hs-corruption-slots-wrapper';

        this.#container?.appendChild(this.#corruptionSummaryWrapper);
        this.#container?.appendChild(this.#slotsWrapper);

        const corruptionContainer = await HSElementHooker.HookElement('#corruptionLoadouts');
        if (!corruptionContainer || !(corruptionContainer instanceof HTMLElement)) {
            HSLogger.warn('Corruption quickbar setup: #corruptionLoadouts not found', this.#context);
            return;
        }

        await this.#cacheCorruptionElements();
        await this.#loadCorruptionLoadoutIconsFromStorage();
        await this.#buildSlots();

        this.#corruptionObserverUnsubscribe = HSCorruption.observeCurrentCorruptions((current, next) => {
            this.#refreshActive(current, next);
        });

        await HSCorruption.startCorruptionObservation();

    }

    public teardown(): void {
        if (this.#corruptionObserverUnsubscribe) {
            this.#corruptionObserverUnsubscribe();
            this.#corruptionObserverUnsubscribe = null;
        }

        this.#reset();
        HSCorruption.clearCache();
        this.#container = null;
    }

    #reset(): void {
        if (this.#container) this.#container.innerHTML = '';
        this.#corruptionSummaryWrapper = null;
        this.#currentCorruptionsTextEl = null;
        this.#nextCorruptionTextEl = null;
        this.#summaryToggleBtn = null;
        this.#slotsWrapper = null;
        this.#loadouts = [];
        this.#slots = [];
    }

    async #cacheCorruptionElements(): Promise<void> {
        if (!HSCorruption.cachedCurrent || !HSCorruption.cachedNext) {
            await HSCorruption.cacheCorruptionElements();
        }
    }

    async #buildSlots(): Promise<void> {
        if (!this.#container) return;

        const loadouts = await HSCorruption.getUserLoadouts();
        if (!loadouts.length) {
            HSLogger.warn('No corruption loadouts found (#corruptionLoadouts tr)', this.#context);
            return;
        }

        loadouts.forEach((loadout, index) => {
            const slotName = loadout.name;
            const loadButton = loadout.loadButton;
            const saveButton = loadout.saveButton;

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

            slot.addEventListener('click', async (event) => {
                if (event.altKey) {
                    event.preventDefault();
                    event.stopPropagation();
                    this.#startPickupMode(index);
                    return;
                }
/*
                if (loadButton) {
                    loadButton.click();
                    await HSUtils.sleep(50); // let game process
                    this.#refreshActive();
                }
*/
            });

            slot.addEventListener('contextmenu', (event) => {
                event.preventDefault();
                event.stopPropagation();
                this.#clearIconForSlot(index);
                HSUI.Notify('Corruption slot icon cleared', { notificationType: 'default' });
            });
/*
            if (saveButton) {
                saveButton.addEventListener('click', async () => {
                    await HSUtils.sleep(60); // wait for values to propagate after save
                    this.#updateLoadoutFromIndex(index);
                    this.#refreshActive();
                });
            }
*/           
            this.#slotsWrapper?.appendChild(slot);
            this.#slots.push(slot);

            this.#applySlotIconFromStore(slot);
            this.#loadouts.push(loadout);
        });
    }

    #updateLoadoutFromIndex(index: number): void {
        const loadout = this.#loadouts[index];
        if (!loadout) return;

        HSCorruption.updateLoadout(loadout);

        const slot = this.#slots[index];
        if (slot) {
            slot.title = `🔧 ${loadout.name}`;
            slot.setAttribute('aria-label', loadout.name);
        }
    }

    #refreshActive(current: CorruptionLevels, next: CorruptionLevels): void {

        if (!this.#container) return;

        this.#displayCorruptionStrings(current, next);

        this.#slots.forEach((slot) => {
            slot.classList.remove('hs-rainbow-border');
            slot.classList.remove('hs-corruption-next-slot');
        });

        let matchedCurrent = false;
        let matchedNext = false;

        this.#loadouts.forEach((loadout, index) => {
            const slot = this.#slots[index];
            if (!slot) return;

            if (HSCorruption.matches(loadout.levels, current)) {
                slot.classList.add('hs-rainbow-border');
                matchedCurrent = true;
            } else if (HSCorruption.matches(loadout.levels, next)) {
                slot.classList.add('hs-corruption-next-slot');
                matchedNext = true;
            }
        });

        this.#container.classList.toggle('hs-corruption-current-unknown', !matchedCurrent);
        this.#container.classList.toggle('hs-corruption-next-unknown', !matchedNext);
    }

    #displayCorruptionStrings(current: CorruptionLevels, next: CorruptionLevels): void {
        const formatLevels = (levels: CorruptionLevels) =>
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

    #getSlotKey(slotIndex: number): number {
        return slotIndex + 1;
    }


    // =================================
    // ------- Icons management --------
    // =================================

    async #loadCorruptionLoadoutIconsFromStorage(): Promise<void> {
        try {
            const raw = localStorage.getItem(CORRUPTION_ICON_STORAGE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw) as Record<string, string>;
            this.#corruptionLoadoutIcons = new Map(Object.entries(parsed).map(([k, v]) => [Number(k), v] as [number, string]));
        } catch (error) {
            HSLogger.warn(`Failed to load corruption loadout icons: ${String(error)}`, this.#context);
            this.#corruptionLoadoutIcons = new Map();
        }
    }

    #saveCorruptionLoadoutIconsToStorage(): void {
        try {
            const obj: Record<string, string> = {};
            this.#corruptionLoadoutIcons.forEach((url, key) => {
                obj[String(key)] = url;
            });
            localStorage.setItem(CORRUPTION_ICON_STORAGE_KEY, JSON.stringify(obj));
        } catch (error) {
            HSLogger.warn(`Failed to save corruption loadout icons: ${String(error)}`, this.#context);
        }
    }

    #applySlotIconFromStore(slot: HTMLButtonElement): void {
        const slotKey = slot.dataset.quickbarIndex;
        if (!slotKey) return;
        const slotNumber = Number(slotKey);
        if (Number.isNaN(slotNumber)) return;
        const url = this.#corruptionLoadoutIcons.get(slotNumber);

        this.#updateSlotIcon(slot, url ?? null);
        if (url) {
            slot.classList.add('hs-corruption-slot-icon');
        } else {
            slot.classList.remove('hs-corruption-slot-icon');
        }
    }

    #setIconForSlot(slotIndex: number, iconUrl: string): void {
        const key = this.#getSlotKey(slotIndex);
        this.#corruptionLoadoutIcons.set(key, iconUrl);
        this.#saveCorruptionLoadoutIconsToStorage();

        const slot = this.#slots[slotIndex];
        if (slot) {
            this.#updateSlotIcon(slot, iconUrl);
        }
    }

    #clearIconForSlot(slotIndex: number): void {
        const key = this.#getSlotKey(slotIndex);
        this.#corruptionLoadoutIcons.delete(key);
        this.#saveCorruptionLoadoutIconsToStorage();

        const slot = this.#slots[slotIndex];
        if (slot) {
            this.#updateSlotIcon(slot, null);
        }
    }

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
            if (match && match[1]) {
                return match[1];
            }
        }
        return null;
    }

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
            if (!target || !this.#container) {
                this.#endPickupMode();
                return;
            }

            if (this.#pickTargetSlotIndex === null) {
                this.#endPickupMode();
                return;
            }

            const iconUrl = this.#findIconUrlFromEventTarget(event.target);
            if (!iconUrl) {
                HSUI.Notify('No usable icon found on clicked element; pick mode ended. Retry by Alt+clicking a slot.', { notificationType: 'warning' });
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
