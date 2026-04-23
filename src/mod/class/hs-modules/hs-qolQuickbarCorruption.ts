import { HSElementHooker } from "../hs-core/hs-elementhooker";
import { HSUtils } from "../hs-utils/hs-utils";
import { HSLogger } from "../hs-core/hs-logger";
import { HSModuleManager } from "../hs-core/module/hs-module-manager";
import { HSUI } from "../hs-core/hs-ui";
import { HSSettings } from "../hs-core/settings/hs-settings";
import { HSGameDataAPI } from "../hs-core/gds/hs-gamedata-api";
import { HSCorruption, HSCorruptionLevels, HSCorruptionUserLoadout } from "./hs-corruption";
import { HSQOLQuickbarBase } from "./hs-qolQuickbarBase";

type HSQOLCorruptionStatusTarget = 'noSingularityUpgrades' | 'noOcteracts' | 'sadisticPrequel';
type HSQOLCorruptionPlatonicTarget = 'platUpg5' | 'platUpg10';
type HSQOLCorruptionChallengeLevelTarget = 'challenge11level' | 'challenge12level' | 'challenge13level' | 'challenge14level';
type HSQOLCorruptionDomTarget = HSQOLCorruptionStatusTarget | HSQOLCorruptionPlatonicTarget | HSQOLCorruptionChallengeLevelTarget;

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

    // DOM elements
    #corruptionSummaryWrapper: HTMLDivElement | null = null;
    #currentCorruptionsTextEl: HTMLDivElement | null = null;
    #nextCorruptionTextEl:     HTMLDivElement | null = null;
    #corruptionCleanseQuickButton:   HTMLButtonElement | null = null;
    #corruptionCleanseVanillaButton: HTMLButtonElement | null = null;
    #slotsWrapper: HTMLDivElement | null = null;
    #slots: HTMLButtonElement[] = [];

    // Loadouts stuff
    #loadouts: HSCorruptionUserLoadout[] = [];
    #lastRefreshCurrent: HSCorruptionLevels | null = null;
    #lastRefreshNext:    HSCorruptionLevels | null = null;

    // Icon persistence
    readonly #CORRUPTION_ICON_STORAGE_KEY = 'hs-corruption-loadout-icons';
    #corruptionLoadoutIcons: Map<number, string> = new Map();

    // Corruption cap calculations
    readonly #statusTargets: readonly HSQOLCorruptionStatusTarget[] = ['noSingularityUpgrades', 'noOcteracts', 'sadisticPrequel'];
    readonly #platonicTargets: readonly HSQOLCorruptionPlatonicTarget[] = ['platUpg5', 'platUpg10'];
    readonly #challengeLevelTargets: readonly HSQOLCorruptionChallengeLevelTarget[] = ['challenge11level', 'challenge12level', 'challenge13level', 'challenge14level'];
    #maxCorruptionLevel = 0;
    #lastRefreshMaxCorruptionLevel = 0;
    #cachedPlatonicTau = false;
    #cachedPlatonicAlpha = false;
    #cachedPlatonicBeta = false;
    #cachedCorruptionFourteenAmount = 0;
    #cachedOcteractCorruptionAmount = 0;
    #cachedNoSingularityUpgradesActive = false;
    #cachedNoOcteractsActive = false;
    #cachedSadisticPrequelActive = false;
    #cachedHighestCompletedChallengeLevel = 0;

    #domMutationObservers: Array<{ id: string; observer: MutationObserver }> = [];
    #cachedDomElements: Map<string, HTMLElement> = new Map();

    // Icon picking
    #isPickingIcon = false;
    #pickTargetSlotIndex: number | null = null;
    #pickDocClickListener: ((event: MouseEvent) => void) | null = null;
    #wasGdsEnabled: boolean | null = null;

    // Event handlers
    #slotEventHandlers: Map<HTMLButtonElement, { click: (event: MouseEvent) => Promise<void>; contextmenu: (event: MouseEvent) => void }> = new Map();
    #corruptionCleanseButtonHandler: ((event: MouseEvent) => Promise<void>) | null = null;
    #corruptionObserverUnsubscribe: (() => void) | null = null;


    // ======================================================
    // ------------- Lifecycle / DOM management -------------
    // ======================================================

    /** Create DOM elements for the corruption quickbar section. */
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

        this.#corruptionCleanseButtonHandler = async (event: MouseEvent) => {
            event.preventDefault();
            event.stopPropagation();
            const confirmButton = this.#getCachedCorruptionCleanseConfirmButton();
            if (confirmButton) {
                confirmButton.click();
                // The import zero is only for when we are in C15 and cleanse is 'badly handled' by vanilla
                await HSCorruption.importCorruptionLoadout(HSCorruption.ZERO_CORRUPTIONS);
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
        if (!corruptionContainer || !(corruptionContainer instanceof HTMLElement)) { HSLogger.warn('Corruption quickbar setup: #corruptionLoadouts not found', this.context); return; }

        // Oct and GQ upgrades are a pain to get with DOM, and GDS is a bit heavy
        // So I'm only checking their values once on setup via GameData
        // (and if players buy them, they need to disable/re-enable the quickbar)
        await this.#cacheForcedGameData();
        if (!this.#cachedPlatonicTau) {
            this.#refreshPlatonicUpgradeFlagsFromDOM();
        }
        this.#refreshChallengeAndStatusFlagsFromDOM();
        this.#maxCorruptionLevel = this.#calculateMaxCorruptionLevel();

        await HSCorruption.cacheCorruptionElements();
        this.#loadCorruptionIcons();
        await this.#buildSlots();

        if (!this.#corruptionCleanseQuickButton && this.#slotsWrapper) {
            const cleanseButton = this.#createCorruptionCleanseButton();
            this.#slotsWrapper.appendChild(cleanseButton);
            this.#corruptionCleanseQuickButton = cleanseButton;
        }

        this.#setupCorruptionObserver();
        await HSCorruption.startCorruptionObservation('#corruptionStatsLoadouts');
        await this.#setupDomObservers();
    }

    /** Tear down quickbar and release resources/observers. */
    protected onTeardown(): void {
        this.#endPickupMode();
        this.#cleanupCorruptionObserver();
        this.#cleanupSlotEventHandlers();
        this.#cleanupCorruptionCleanseButton();
        this.#cleanupDomObservers();
        this.#reset();
        HSCorruption.clearCache();
    }


    // ======================================================
    // -------------- Setup / teardown helpers --------------
    // ======================================================

    /** Subscribe to corruption state updates and track active loadout matching. */
    #setupCorruptionObserver(): void {
        if (this.#corruptionObserverUnsubscribe) return;

        this.#corruptionObserverUnsubscribe = HSCorruption.observeCorruption((current, next) => {
            this.#refreshActive(current, next);
        });
    }

    /** Cache forced game data on initial setup to avoid repeated runtime lookups. */
    async #cacheForcedGameData(): Promise<void> {
        const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        if (!gameDataAPI) return;
        let gameData = gameDataAPI.getGameData();
        if (!gameData) gameData = await gameDataAPI.getForcedGameData();
        if (!gameData) return;

        this.#cachedPlatonicTau = (gameData.goldenQuarkUpgrades?.platonicTau?.level ?? 0) > 0;
        this.#cachedCorruptionFourteenAmount = gameData.goldenQuarkUpgrades?.corruptionFourteen?.level ?? 0;
        this.#cachedOcteractCorruptionAmount = gameData.octUpgrades?.octeractCorruption?.level ?? 0;
    }

    /** Observe relevant DOM state changes that affect max corruption calculations. */
    async #setupDomObservers(): Promise<void> {
        this.#cleanupDomObservers();

        const targetIds: HSQOLCorruptionDomTarget[] = [...this.#statusTargets];

        if (!this.#cachedPlatonicTau) {
            // Those are only needed when Tau is not bought
            targetIds.push(...this.#platonicTargets); // Alpha + Beta
            targetIds.push(...this.#challengeLevelTargets); // C11-14
        }

        for (const id of targetIds) {
            await HSElementHooker.HookElement(`#${id}`);
            const element = document.getElementById(id);
            if (!element) {
                HSLogger.debug(() => `HSQOLCorruptionQuickbar DOM observer target not found: ${id}`, this.context);
                continue;
            }
            this.#cachedDomElements.set(id, element);

            const observer = new MutationObserver(() => {
                if (this.#processDomMutationTarget(id)) return;

                const newMax = this.#calculateMaxCorruptionLevel();
                if (newMax !== this.#maxCorruptionLevel) {
                    this.#maxCorruptionLevel = newMax;
                    void this.#refreshCurrentLoadedCorruptions();
                }
            });

            const isClassOnlyTarget = this.#isPlatonicTarget(id);
            const isChallengeLevelTarget = this.#isChallengeLevelTarget(id);
            const observerOptions: MutationObserverInit = {
                attributes: true,
                attributeFilter: isClassOnlyTarget ? ['class'] : ['style'],
                childList: isChallengeLevelTarget,
                characterData: isChallengeLevelTarget,
                subtree: isChallengeLevelTarget,
            };
            observer.observe(element, observerOptions);

            this.#domMutationObservers.push({ id, observer });
        }
    }

    /** Route DOM mutation updates for the observed target into a handler. */
    #processDomMutationTarget(id: HSQOLCorruptionDomTarget): boolean {
        if (this.#isPlatonicTarget(id)) {
            return this.#handlePlatonicTargetMutation();
        }
        if (this.#isChallengeLevelTarget(id)) {
            return this.#handleChallengeLevelTargetMutation();
        }
        if (this.#isStatusTarget(id)) {
            return this.#handleStatusTargetMutation();
        }
        return false;
    }

    /** Refresh cached platonic upgrade flags and update max corruption if needed. */
    #handlePlatonicTargetMutation(): boolean {
        const previousAlpha = this.#cachedPlatonicAlpha;
        const previousBeta = this.#cachedPlatonicBeta;
        this.#refreshPlatonicUpgradeFlagsFromDOM();

        if (this.#cachedPlatonicAlpha !== previousAlpha || this.#cachedPlatonicBeta !== previousBeta) {
            return this.#maybeRefreshMaxCorruptionLevel();
        }
        return false;
    }

    /** Refresh highest completed challenge data and update max corruption if needed. */
    #handleChallengeLevelTargetMutation(): boolean {
        const previousHighestChallenge = this.#cachedHighestCompletedChallengeLevel;
        this.#cachedHighestCompletedChallengeLevel = this.#calculateHighestCompletedChallengeLevel();

        if (this.#cachedHighestCompletedChallengeLevel !== previousHighestChallenge) {
            return this.#maybeRefreshMaxCorruptionLevel();
        }
        return false;
    }

    /** Refresh cached singularity/status flags and update max corruption if needed. */
    #handleStatusTargetMutation(): boolean {
        const previousNoSingularityUpgradesActive = this.#cachedNoSingularityUpgradesActive;
        const previousNoOcteractsActive = this.#cachedNoOcteractsActive;
        const previousSadisticPrequelActive = this.#cachedSadisticPrequelActive;

        this.#cachedNoSingularityUpgradesActive = this.#isSingularityChallengeActive('noSingularityUpgrades');
        this.#cachedNoOcteractsActive = this.#isSingularityChallengeActive('noOcteracts');
        this.#cachedSadisticPrequelActive = this.#isSingularityChallengeActive('sadisticPrequel');

        if (this.#cachedNoSingularityUpgradesActive !== previousNoSingularityUpgradesActive ||
            this.#cachedNoOcteractsActive !== previousNoOcteractsActive ||
            this.#cachedSadisticPrequelActive !== previousSadisticPrequelActive) {
            return this.#maybeRefreshMaxCorruptionLevel();
        }
        return false;
    }

    /** Recalculate the max corruption cap and refresh loaded corruptions if it changed. */
    #maybeRefreshMaxCorruptionLevel(): boolean {
        const newMax = this.#calculateMaxCorruptionLevel();
        if (newMax !== this.#maxCorruptionLevel) {
            this.#maxCorruptionLevel = newMax;
            void this.#refreshCurrentLoadedCorruptions();
            return true;
        }
        return false;
    }

    /** Disconnect and clear any DOM mutation observers used by this quickbar. */
    #cleanupDomObservers(): void {
        for (const entry of this.#domMutationObservers) {
            entry.observer.disconnect();
        }
        this.#domMutationObservers = [];
    }

    /** Unsubscribe corruption state observer if subscribed. */
    #cleanupCorruptionObserver(): void {
        if (this.#corruptionObserverUnsubscribe) {
            this.#corruptionObserverUnsubscribe();
            this.#corruptionObserverUnsubscribe = null;
        }
    }

    /** Remove click/context menu event listeners from saved slot buttons. */
    #cleanupSlotEventHandlers(): void {
        for (const [slot, handlers] of this.#slotEventHandlers.entries()) {
            slot.removeEventListener('click', handlers.click);
            slot.removeEventListener('contextmenu', handlers.contextmenu);
        }
        this.#slotEventHandlers.clear();
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
        this.#cachedPlatonicTau = false;
        this.#cachedPlatonicAlpha = false;
        this.#cachedPlatonicBeta = false;
        this.#cachedCorruptionFourteenAmount = 0;
        this.#cachedOcteractCorruptionAmount = 0;
        this.#cachedNoSingularityUpgradesActive = false;
        this.#cachedNoOcteractsActive = false;
        this.#cachedSadisticPrequelActive = false;
        this.#cachedHighestCompletedChallengeLevel = 0;
        this.#cachedDomElements.clear();
        this.#isPickingIcon = false;
        this.#pickTargetSlotIndex = null;
    }


    // ======================================================
    // ----------------- DOM/cache helpers ------------------
    // ======================================================

    /** Get a cached DOM element or query and cache it lazily. */
    #getCachedElement(id: string): HTMLElement | null {
        const cached = this.#cachedDomElements.get(id);
        if (cached)
            return cached;

        const element = document.getElementById(id);
        if (element)
            this.#cachedDomElements.set(id, element);
        return element;
    }

    /** Refresh cached platonic alpha/beta upgrade flags from the DOM. */
    #refreshPlatonicUpgradeFlagsFromDOM(): void {
        this.#cachedPlatonicAlpha = this.#isPlatonicUpgradeBought('platUpg5');
        this.#cachedPlatonicBeta  = this.#isPlatonicUpgradeBought('platUpg10');
    }

    /** Refresh cached challenge and status state from DOM elements. */
    #refreshChallengeAndStatusFlagsFromDOM(): void {
        this.#cachedNoSingularityUpgradesActive = this.#isSingularityChallengeActive('noSingularityUpgrades');
        this.#cachedNoOcteractsActive           = this.#isSingularityChallengeActive('noOcteracts');
        this.#cachedSadisticPrequelActive       = this.#isSingularityChallengeActive('sadisticPrequel');
        this.#cachedHighestCompletedChallengeLevel = this.#calculateHighestCompletedChallengeLevel();
    }

    /** Determine the highest completed challenge level from the challenge UI. */
    #calculateHighestCompletedChallengeLevel(): number {
        if (this.#hasCompletedChallenge('challenge14level')) return 14;
        if (this.#hasCompletedChallenge('challenge13level')) return 13;
        if (this.#hasCompletedChallenge('challenge12level')) return 12;
        if (this.#hasCompletedChallenge('challenge11level')) return 11;
        return 0;
    }

    /** Check whether the DOM target is a platonic upgrade element. */
    #isPlatonicTarget(id: HSQOLCorruptionDomTarget): boolean {
        return this.#platonicTargets.includes(id as HSQOLCorruptionPlatonicTarget);
    }

    /** Check whether the DOM target is a challenge level element. */
    #isChallengeLevelTarget(id: HSQOLCorruptionDomTarget): boolean {
        return this.#challengeLevelTargets.includes(id as HSQOLCorruptionChallengeLevelTarget);
    }

    /** Check whether the DOM target is a status/challenge toggle element. */
    #isStatusTarget(id: HSQOLCorruptionDomTarget): boolean {
        return this.#statusTargets.includes(id as HSQOLCorruptionStatusTarget);
    }

    /** Check whether a platonic upgrade button is marked as bought. */
    #isPlatonicUpgradeBought(id: string): boolean {
        const element = this.#getCachedElement(id);
        if (!element) return false;
        return element.classList.contains('green-background');
    }

    /** Get and cache the vanilla corruption cleanse confirmation button. */
    #getCachedCorruptionCleanseConfirmButton(): HTMLButtonElement | null {
        if (this.#corruptionCleanseVanillaButton)
            return this.#corruptionCleanseVanillaButton;

        const confirmButton = document.getElementById('corruptionCleanseConfirm') as HTMLButtonElement | null;
        this.#corruptionCleanseVanillaButton = confirmButton;
        return confirmButton;
    }


    // ======================================================
    // --------- Corruption loadout / slot creation ---------
    // ======================================================

    /** Build each corruption loadout slot button and apply saved icons. */
    async #buildSlots(): Promise<void> {
        if (!this.container || !this.#slotsWrapper) return;
        if (this.#slots.length > 0) return;

        await HSElementHooker.HookElement('#corruptionStatsLoadouts');
        const loadouts = await HSCorruption.getUserLoadouts();
        if (!loadouts.length) { HSLogger.warn('No corruption loadouts found.', this.context); return; }

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
                await HSUtils.waitForNextTack();
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


    // ======================================================
    // ---------- Max corruption / challenge state ----------
    // ======================================================

    /** Calculate the current maximum allowed corruption level for the quickbar. */
    #calculateMaxCorruptionLevel(): number {
        const noSingularityUpgradesActive = this.#cachedNoSingularityUpgradesActive;
        const noOcteractsActive = this.#cachedNoOcteractsActive;
        const sadisticPrequelActive = this.#cachedSadisticPrequelActive;
        const noCorruptionFourteen = sadisticPrequelActive || noSingularityUpgradesActive;
        const noCorruptionOcteract = sadisticPrequelActive || noOcteractsActive;
        let max = 0;

        if (this.#cachedPlatonicTau) {
            max = 13;
        } else {
            const highest = this.#cachedHighestCompletedChallengeLevel;
            if (highest >= 14)
                max = 11;
            else if (highest >= 13)
                max = 9;
            else if (highest >= 12)
                max = 7;
            else if (highest >= 11)
                max = 5;
            if (this.#cachedPlatonicAlpha)
                max += 1;
            if (this.#cachedPlatonicBeta)
                max += 1;
        }
        if (!noCorruptionFourteen)
            max += this.#cachedCorruptionFourteenAmount;
        if (!noCorruptionOcteract)
            max += this.#cachedOcteractCorruptionAmount;
        return max;
    }

    /** Detect whether a given challenge completion target is considered complete. */
    #hasCompletedChallenge(id: string): boolean {
        const element = this.#getCachedElement(id);
        if (!element) return false;
        const text = element.textContent?.trim();
        if (!text) return false;

        const raw = text.split('/')[0].trim();
        return raw.length > 0 && raw[0] !== '0';
    }

    /** Determine if a singularity challenge is currently active by style. */
    #isSingularityChallengeActive(id: string): boolean {
        const element = this.#getCachedElement(id);
        if (!element) return false;

        const styleValue = element.getAttribute('style') ?? '';
        if (styleValue.includes('orchid')) {
            return true;
        }
        return (element as HTMLElement).style.backgroundColor === 'orchid';
    }

    
    // ======================================================
    // ---------- Active refresh / display update -----------
    // ======================================================

    /** Refresh active loadout highlight and current/next corruption status display. */
    #refreshActive(current: HSCorruptionLevels, next: HSCorruptionLevels): void {
        if (!this.container) return;

        const currentIsSame = this.#lastRefreshCurrent ? HSCorruption.matches(current, this.#lastRefreshCurrent) : false;
        const nextIsSame = this.#lastRefreshNext ? HSCorruption.matches(next, this.#lastRefreshNext) : false;
        const maxCapIsSame = this.#maxCorruptionLevel === this.#lastRefreshMaxCorruptionLevel;
        if (currentIsSame && nextIsSame && maxCapIsSame) return;

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

        const visibleCorruptionKeys = this.#getVisibleCorruptionKeys();

        this.#loadouts.forEach((loadout, index) => {
            const slot = this.#slots[index];
            if (!slot) return;

            const normalizedLevels = HSCorruption.normalizeLevels(loadout.levels, this.#maxCorruptionLevel);
            const currentMatch = this.#levelsMatchOnKeys(normalizedLevels, current, visibleCorruptionKeys);
            const nextMatch = !currentMatch && this.#levelsMatchOnKeys(normalizedLevels, next, visibleCorruptionKeys);
            if (currentMatch) {
                slot.classList.add('hs-rainbow-border');
            } else if (nextMatch) {
                slot.classList.add('hs-silver-border');
            }
        });

        const cleanseCurrentMatch = this.#levelsMatchOnKeys(current, HSCorruption.ZERO_CORRUPTIONS, visibleCorruptionKeys);
        const cleanseNextMatch = this.#levelsMatchOnKeys(next, HSCorruption.ZERO_CORRUPTIONS, visibleCorruptionKeys);
        if (this.#corruptionCleanseQuickButton) {
            if (cleanseCurrentMatch) {
                this.#corruptionCleanseQuickButton.classList.add('hs-rainbow-border');
            }
            if (cleanseNextMatch) {
                this.#corruptionCleanseQuickButton.classList.add('hs-silver-border');
            }
        }
    }

    /** Refresh current corruption values and update quickbar active state. */
    async #refreshCurrentLoadedCorruptions(): Promise<void> {
        if (!this.container) return;
        const { current, next } = await HSCorruption.getBothLoadedCorruptions();
        this.#refreshActive(current, next);
    }

    /** Display current and next corruption level strings under summary. */
    #displayCorruptionStrings(current: HSCorruptionLevels, next: HSCorruptionLevels): void {
        const currentText = HSCorruption.formatLevels(current);
        const nextText = HSCorruption.formatLevels(next);
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

    #getVisibleCorruptionKeys(): (keyof HSCorruptionLevels)[] {
        const names = HSCorruption.corruptionNames;
        if (this.#cachedPlatonicTau) {
            return names;
        }

        const highestChallenge = this.#cachedHighestCompletedChallengeLevel;
        if (highestChallenge >= 14) {
            return names;
        }
        if (highestChallenge >= 13) {
            return names.slice(0, 6);
        }
        if (highestChallenge >= 12) {
            return names.slice(0, 4);
        }
        return names.slice(0, 2);
    }

    #levelsMatchOnKeys(a: HSCorruptionLevels, b: HSCorruptionLevels, keys: (keyof HSCorruptionLevels)[]): boolean {
        return keys.every((key) => a[key] === b[key]);
    }


    // ======================================================
    // ----------------- Icons management -------------------
    // ======================================================

    /** Apply stored icon class/style to a quickbar slot based on loaded metadata. */
    #applySlotIcon(slot: HTMLButtonElement): void {
        const slotKey = slot.dataset.quickbarIndex;
        if (!slotKey) return;
        const slotNumber = Number(slotKey);
        if (Number.isNaN(slotNumber)) return;
        const url = this.#getCorruptionLoadoutIcon(slotNumber);

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
        this.#setCorruptionLoadoutIcon(key, iconUrl);

        const slot = this.#slots[slotIndex];
        if (slot) {
            this.#updateSlotIcon(slot, iconUrl);
        }
    }

    /** Clear stored icon for a slot and update UI. */
    #clearIconForSlot(slotIndex: number): void {
        const key = slotIndex + 1;
        this.#clearCorruptionLoadoutIcon(key);
        const slot = this.#slots[slotIndex];
        if (slot) {
            this.#updateSlotIcon(slot, null);
        }
    }

    #loadCorruptionIcons(): void {
        try {
            const raw = localStorage.getItem(this.#CORRUPTION_ICON_STORAGE_KEY);
            if (!raw) {
                this.#corruptionLoadoutIcons = new Map();
                return;
            }
            const parsed = JSON.parse(raw) as Record<string, string>;
            this.#corruptionLoadoutIcons = new Map(Object.entries(parsed).map(([k, v]) => [Number(k), v] as [number, string]));
        } catch (error) {
            HSLogger.warn(`HSQOLCorruptionQuickbar.loadCorruptionIcons failed: ${String(error)}`, this.context);
            this.#corruptionLoadoutIcons = new Map();
        }
    }

    #saveCorruptionIcons(): void {
        try {
            const obj: Record<string, string> = {};
            this.#corruptionLoadoutIcons.forEach((url, key) => {
                obj[String(key)] = url;
            });
            localStorage.setItem(this.#CORRUPTION_ICON_STORAGE_KEY, JSON.stringify(obj));
        } catch (error) {
            HSLogger.warn(`HSQOLCorruptionQuickbar.saveCorruptionIcons failed: ${String(error)}`, this.context);
        }
    }

    #getCorruptionLoadoutIcon(slotKey: number): string | undefined {
        return this.#corruptionLoadoutIcons.get(slotKey);
    }

    #setCorruptionLoadoutIcon(slotKey: number, iconUrl: string): void {
        this.#corruptionLoadoutIcons.set(slotKey, iconUrl);
        this.#saveCorruptionIcons();
    }

    #clearCorruptionLoadoutIcon(slotKey: number): void {
        this.#corruptionLoadoutIcons.delete(slotKey);
        this.#saveCorruptionIcons();
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

    /** Enter slot icon pick mode to select an icon from page elements. */
    #startPickupMode(slotIndex: number): void {
        if (this.#isPickingIcon) { HSLogger.debug(() => 'Icon pickup mode already active; request ignored.', this.context); return; }

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
            if (!target || !this.container || this.container.contains(target)) { this.#endPickupMode(); return; }
            if (this.#pickTargetSlotIndex === null) { this.#endPickupMode(); return; }

            const iconUrl = this.#findIconUrlFromEventTarget(target);
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
}
