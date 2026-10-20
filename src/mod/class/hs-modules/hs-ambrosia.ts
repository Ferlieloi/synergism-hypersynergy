import { HSGameDataSubscriber, HSModuleOptions } from "../../types/hs-types";
import { AmbrosiaUpgradeCalculationCollection, AmbrosiaUpgradeCalculationConfig } from "../../types/data-types/hs-gamedata-api-types";
import { AmbrosiaUpgradeData, AmbrosiaUpgrades, GameData } from "../../types/data-types/hs-player-savedata";
import { AMBROSIA_LOADOUT_SLOT } from "../../types/module-types/hs-ambrosia-types";
import { MAIN_VIEW, SINGULARITY_VIEW } from "../../types/module-types/hs-gamestate-types";
import { HSElementHooker } from "../hs-core/hs-elementhooker";
import { HSGameData } from "../hs-core/gds/hs-gamedata";
import { HSGameState } from "../hs-core/hs-gamestate";
import { HSGlobal } from "../hs-core/hs-global";
import { HSQuickbarManager } from "./hs-qol-quickbar/hs-qolQuickbarManager";
import { HSAmbrosiaQuickbar } from "./hs-ambrosiaQuickbar";
import { HSLogger } from "../hs-core/hs-logger";
import { HSModule } from "../hs-core/module/hs-module";
import { HSModuleManager } from "../hs-core/module/hs-module-manager";
import { HSSelectStringSetting } from "../hs-core/settings/hs-setting";
import { HSSettings } from "../hs-core/settings/hs-settings";
import { HSSettingsUI } from "../hs-core/settings/hs-settings-ui";
import { HSStorage } from "../hs-core/hs-storage";
import { HSUI } from "../hs-core/hs-ui";
import { HSUtils } from "../hs-utils/hs-utils";
import { HSGameDataAPI } from "../hs-core/gds/hs-gamedata-api";
import { HSAmbrosiaHelper } from "./hs-ambrosiaHelper";
import minibarCSS from "inline:../../resource/css/module/hs-ambrosia-minibars.css";
import { HSGameDialogs } from "../hs-core/dialogs/hs-game-dialogs";
import type { HSAutosing } from "./hs-autosing/hs-autosing";

interface HSQuickImportSummary {
    importedCount: number;
    skippedCount: number;
    failures: { index: number; reason: string }[];
}

type HSAmbrosiaTree = Record<string, number>;

/** A temporary ambrosia tree holding the singularity reducers (HSAmbrosia.prepareSingReducerSwap). */
export interface HSSingReducerSwap {
    /** How many singularity reducers the temporary tree has more than the player's own tree. */
    added: number;
    /** The level of the Talisman Power upgrade (ambrosiaTalismanBonusRuneLevel) in the temporary tree. */
    talismanLevel: number;
    /** How many levels that is more than in the player's own tree. Negative: fewer, the ambrosia was short. */
    talismanAdded: number;
    /** Loads the temporary tree. @returns whether the game took it. */
    apply(): boolean;
    /** Loads the player's own tree back, unless it is still there. @returns whether it is there now. */
    restore(): boolean;
}

/** What the temporary tree is asked to hold (HSAmbrosia.prepareSingReducerSwap). */
export interface HSSingReducerSwapOptions {
    /** Raise the singularity reducer. Off where one brings nothing: the player's own level is kept. */
    reducers: boolean;
    /** Raise Talisman Power as far as the ambrosia left by the reducer allows. Off: the player's own level is kept. */
    raiseTalisman: boolean;
    /** Swap even when no reducer can be added, for Talisman Power alone. */
    talismanAlone: boolean;
}

/**
 * `swap`: a temporary tree is worth loading. `stop`: it would be, once the player has done what the text says.
 * `note`: why the reducers can't be raised here, when the player should know (also with a `swap` made for
 * Talisman Power alone).
 */
export interface HSSingReducerPlan {
    swap?: HSSingReducerSwap;
    note?: string;
    stop?: string;
}

/**
 * Class: HSAmbrosia
 * IsExplicitHSModule: Yes
 * Description: Hypersynergism module which manages ambrosia loadouts and quickbar interactions.
 * Author: Swiffy
 */
export class HSAmbrosia extends HSModule
    implements HSGameDataSubscriber {

    // Import through the game's dialogs (no exposedPlayer): up to 16 lines, each waiting up to ~1.5 s for its dialogs
    static readonly #GAME_IMPORT_TIME_LIMIT_MS = 120000;
    // A single loadout goes into the slot the game marks as active; none is marked after a page load,
    // and the slot guessed from the save (silver border) may be wrong, so the import is refused
    static readonly #NO_ACTIVE_LOADOUT_REASON = 'No active loadout: load a loadout first';

    gameDataSubscriptionId?: string;
    #ambrosiaViewSubscriptionId?: string;

    #loadoutsSlots: HTMLElement[] = [];

    #loadoutContainer: HTMLElement | null = null;
    #blueberryUpgradeContainer: HTMLElement | null = null;
    #pageHeader: HTMLElement | null = null;

    #addCodeButton: HTMLButtonElement | null = null;
    #addCodeAllButton: HTMLButtonElement | null = null;
    #addCodeOneButton: HTMLButtonElement | null = null;
    #timeCodeButton: HTMLButtonElement | null = null;
    // Auto-Loadout: the slot to load back once the code has paid out
    #pendingCodeRestore: { slot: HTMLButtonElement, codeSlotId: string } | undefined;
    #importBlueberriesButton: HTMLButtonElement | null = null;
    #persistentAmbrosiaLevelsToggleButton: HTMLButtonElement | null = null;
    #loadoutContainerClickHandler?: (e: MouseEvent) => Promise<void>;
    #gameActiveLoadoutObserver?: MutationObserver;
    #isLoadoutClickHandlerAttached = false;
    #persistentAmbrosiaLevelsToggleHandler?: (event: Event) => void;
    #isAmbrosiaTabActive = false;
    #persistentAmbrosiaLevelsSignature?: string;
    // RETIRED: #debugElement was used only by the Ambrosia AFK/idle swapper.
    // #debugElement?: HTMLDivElement;

    activeLoadout?: AMBROSIA_LOADOUT_SLOT;
    /** Whether the game marks activeLoadout as its active slot (rainbow border) or it's our guess from the save (silver). */
    #activeLoadoutConfirmed = false;

    public quickbar: HSAmbrosiaQuickbar;

    #cachedGameDataAPI?: HSGameDataAPI;
    #cachedGameDataMod?: HSGameData;

    // RETIRED: Ambrosia AFK/idle swapper state.
    // #cachedIdleSwapOcteractSetting?: HSSelectStringSetting;
    // #cachedIdleSwapNormalLuckSetting?: HSSelectStringSetting;
    // #cachedIdleSwapRedLuckSetting?: HSSelectStringSetting;
    // #cachedIdleSwapOcteractLoadoutValue?: string;
    // #cachedIdleSwapNormalLuckLoadoutValue?: string;
    // #cachedIdleSwapRedLuckLoadoutValue?: string;
    // #cachedIdleSwapOcteractLoadout?: string;
    // #cachedIdleSwapNormalLuckLoadout?: string;
    // #cachedIdleSwapRedLuckLoadout?: string;
    // #cachedIdleSwapLoadoutButtons: Map<string, HTMLButtonElement> = new Map();

    #_delegateAddHandler?: (e: Event) => Promise<void>;
    #_delegateTimeHandler?: (e: Event) => Promise<void>;

    // #isIdleSwapEnabled = false;
    // #isIdleSwapActive = false;
    // #blueAmbrosiaProgressBar?: HTMLDivElement;
    // #redAmbrosiaProgressBar?: HTMLDivElement;
    // #holdBlueLuckUntilReset = false;
    // #lastBlueBarValue?: number;
    // #cachedNormalLuckBlueBarRequired?: number;
    // #cachedNormalLuckLoadoutValue?: string;

    #berryMinibarsEnabled = false;
    #blueProgressMinibarElement?: HTMLDivElement;
    #redProgressMinibarElement?: HTMLDivElement;
    #purpleProgressMinibarBarElement?: HTMLDivElement;
    #purpleProgressMinibarElement?: HTMLDivElement;
    #blueIncomeElement?: HTMLParagraphElement;
    #redIncomeElement?: HTMLParagraphElement;
    #purpleIncomeElement?: HTMLParagraphElement;
    #barIncomeRefreshQueue: Promise<void> = Promise.resolve();
    #barIncomeRefreshTimer?: ReturnType<typeof setTimeout>;
    #lastBarIncomeDataRefresh = 0;

    #hasPerformedInitialLoadoutMatch = false;

    #quickbarCSSId = 'hs-ambrosia-quickbar-css';
    // RETIRED: #idleLoadoutCSSId = 'hs-ambrosia-idle-loadout-css';
    #minibarCSSId = 'hs-ambrosia-minibar-css';
    #quickbarCSS = `
        #${HSGlobal.HSAmbrosia.quickBarId} > .blueberryLoadoutSlot:hover {
            filter: brightness(150%);
        }
    `;
    /* RETIRED: Ambrosia AFK/idle swapper indicator styling.
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
    */


    // ==============================================
    // -------------------- Init --------------------
    // ==============================================

    constructor(moduleOptions: HSModuleOptions) {
        super(moduleOptions);
        this.quickbar = new HSAmbrosiaQuickbar(this);
    }

    async init() {
        HSLogger.log(`Initializing HSAmbrosia module`, this.context);

        await this.#cacheDomRefs();
        await HSAmbrosiaHelper.cacheBlueberryToggleModeButton();

        this.#attachLoadoutClickHandler();

        this.#migrateLegacyPersistentAmbrosiaLevelsState();

        await this.quickbar.init();
        this.#observeGameActiveLoadout();

        await this.#createPersistentMinibars();

        await this.#injectImportFromClipboardButton();

        this.#subscribeGameStateViewChanges();

        HSSettingsUI.refreshAmbrosiaLoadoutDropdowns();
        this.isInitialized = true;
    }

    async #cacheDomRefs() {
        const [loadoutsSlots, loadoutContainer, blueberryUpgradeContainer, pageHeader, addCodeButton, addCodeAllButton, addCodeOneButton, timeCodeButton, importBlueberriesButton] = await Promise.all([
            HSElementHooker.HookElements('.blueberryLoadoutSlot'),
            HSElementHooker.HookElement('#bbLoadoutContainer'),
            HSElementHooker.HookElement('#blueberryUpgradeContainer'),
            HSElementHooker.HookElement('header'),
            HSElementHooker.HookElement('#addCode'),
            HSElementHooker.HookElement('#addCodeAll'),
            HSElementHooker.HookElement('#addCodeOne'),
            HSElementHooker.HookElement('#timeCode'),
            HSElementHooker.HookElement('#importBlueberriesButton')
        ]);

        this.#loadoutsSlots = loadoutsSlots;
        this.#loadoutContainer = loadoutContainer;
        this.#blueberryUpgradeContainer = blueberryUpgradeContainer;
        this.#pageHeader = pageHeader;
        this.#addCodeButton = addCodeButton as HTMLButtonElement;
        this.#addCodeAllButton = addCodeAllButton as HTMLButtonElement;
        this.#addCodeOneButton = addCodeOneButton as HTMLButtonElement;
        this.#timeCodeButton = timeCodeButton as HTMLButtonElement;
        this.#importBlueberriesButton = importBlueberriesButton as HTMLButtonElement;
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

    async #attachAmbrosiaTabEvents() {
        if (this.#loadoutContainer) {
            this.#attachLoadoutClickHandler();
        }

        await this.#hookPersistentAmbrosiaLevelsToggleButton();
    }

    #detachAmbrosiaTabEvents() {
        // The loadout click handler stays attached even when the Ambrosia tab is hidden.
        // Persistent quickbar clicks rely on the original loadout click event to update active loadout state.

        if (this.#persistentAmbrosiaLevelsToggleButton && this.#persistentAmbrosiaLevelsToggleHandler) {
            this.#persistentAmbrosiaLevelsToggleButton.removeEventListener('click', this.#persistentAmbrosiaLevelsToggleHandler);
        }
    }

    #attachLoadoutClickHandler() {
        if (!this.#loadoutContainer || this.#isLoadoutClickHandlerAttached) return;

        this.#loadoutContainerClickHandler ??= this.#onLoadoutClick.bind(this);
        const handler = this.#loadoutContainerClickHandler;
        this.#loadoutContainer.delegateEventListener('click', '.blueberryLoadoutSlot', handler);
        this.#isLoadoutClickHandlerAttached = true;
    }

    async #onLoadoutClick(e: MouseEvent) {
        const slotElement = (e.target as HTMLElement).closest('.blueberryLoadoutSlot') as HTMLButtonElement | null;
        if (!slotElement) return;

        // The active loadout itself is not set here anymore: #observeGameActiveLoadout follows the game's marker,
        // which only moves when the load (or save) actually succeeded.

        // Programmatic slot clicks (quickbar, Add/Time codes, heater...) don't move the mouse,
        // so the hover handlers won't refresh the persistent levels: do it here.
        this.#queuePersistentAmbrosiaLevelsRefresh();

        // Only a successful load changes the active modules. The game's own
        // slot handler has already run (this listener is delegated, bubble
        // phase), so the active class reflects the result of this click.
        if (this.#isAmbrosiaTabActive
            && HSAmbrosiaHelper.isLoadoutMode('loadTree')
            && slotElement.classList.contains('activeBlueberryLoadout')) {
            void this.#queueBarIncomeRefresh(true);
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

    refreshActiveLoadoutFromState() {
        const resolvedCurrent = HSAmbrosiaHelper.resolveAmbrosiaLoadout(this.activeLoadout);
        if (resolvedCurrent) {
            this.updateActiveLoadout(resolvedCurrent);
        }
    }

    async showQuickBar() {
        await this.quickbar.showQuickBar();
    }

    async hideQuickBar() {
        await this.quickbar.hideQuickBar();
    }


    // ==============================================
    // -------- Ambrosia Minibars (Quickbar) --------
    // ==============================================

    async enableBerryMinibars() {
        await HSQuickbarManager.getInstance().whenSectionInjected('ambrosia');
        const groupWrapper = HSQuickbarManager.getInstance().getSection('ambrosia');
        if (!groupWrapper) {
            HSLogger.warn('Could not find group wrapper for minibars', this.context);
            return;
        }
        const barWrapper = groupWrapper.querySelector(`#${HSGlobal.HSAmbrosia.barWrapperId}`) as HTMLElement;
        if (barWrapper) {
            barWrapper.style.display = 'flex';
            HSUI.injectStyle(minibarCSS, this.#minibarCSSId);
            this.subscribeGameDataChanges();
            this.#berryMinibarsEnabled = true;
            const gameDataAPI = this.#cachedGameDataAPI
                ?? HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
            const gameData = gameDataAPI?.getGameData() ?? await gameDataAPI?.getForcedGameData();
            if (this.#berryMinibarsEnabled && gameData) {
                this.#updateBerryMinibars(gameData, gameDataAPI);
            }

            // Restore automation/corruption summary headers when minibars quickbar is enabled.
            HSAmbrosiaHelper.setQuickbarTopTextVisibility(true);
        } else {
            HSLogger.warn('Could not find minibar wrapper', this.context);
        }
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

        // Hide automation/corruption summary headers when minibars quickbar is disabled.
        HSAmbrosiaHelper.setQuickbarTopTextVisibility(false);

        this.#berryMinibarsEnabled = false;
        this.unsubscribeGameDataChanges();
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

        // Build independent bars rather than cloning the game's bars. The game uses an
        // inline scaleX transform now, which would otherwise be copied at an arbitrary
        // progress value and multiply the minibar's own progress updates.
        const blueBar = document.createElement('div');
        const blueBarProgress = document.createElement('div');
        blueBar.id = HSGlobal.HSAmbrosia.blueBarId;
        blueBarProgress.id = HSGlobal.HSAmbrosia.blueBarProgressId;
        blueBar.appendChild(blueBarProgress);

        const redBar = document.createElement('div');
        const redBarProgress = document.createElement('div');
        redBar.id = HSGlobal.HSAmbrosia.redBarId;
        redBarProgress.id = HSGlobal.HSAmbrosia.redBarProgressId;
        redBar.appendChild(redBarProgress);

        // Purple Honey fills symmetrically from both outer edges toward the center.
        const purpleBar = document.createElement('div');
        const purpleBarProgress = document.createElement('div');
        purpleBar.id = HSGlobal.HSAmbrosia.purpleBarId;
        purpleBarProgress.id = HSGlobal.HSAmbrosia.purpleBarProgressId;
        for (let i = 0; i < 2; i++) {
            const half = document.createElement('div');
            half.className = 'hs-purple-progress-fill';
            purpleBarProgress.appendChild(half);
        }
        purpleBar.style.display = 'none';
        purpleBar.appendChild(purpleBarProgress);

        // Wrapper for both
        const minibarWrapper = document.createElement('div') as HTMLDivElement;
        minibarWrapper.id = HSGlobal.HSAmbrosia.barWrapperId;
        minibarWrapper.style.display = 'none';
        minibarWrapper.appendChild(blueBar);
        minibarWrapper.appendChild(redBar);
        minibarWrapper.appendChild(purpleBar);

        // Append minibarWrapper as first child of groupWrapper
        if (groupWrapper.firstChild) {
            groupWrapper.insertBefore(minibarWrapper, groupWrapper.firstChild);
        } else {
            groupWrapper.appendChild(minibarWrapper);
        }

        this.#blueProgressMinibarElement = blueBarProgress;
        this.#redProgressMinibarElement = redBarProgress;
        this.#purpleProgressMinibarBarElement = purpleBar;
        this.#purpleProgressMinibarElement = purpleBarProgress;
    }


    // ==============================================
    // ------------ Active Loadout State ------------
    // ==============================================

    /** The real loadout slot the game marks as active (last successfully loaded or saved), if any. */
    #getGameActiveSlot(): HTMLButtonElement | undefined {
        return this.#loadoutsSlots.find(slot => slot.classList.contains('activeBlueberryLoadout')) as HTMLButtonElement | undefined;
    }

    /**
     * The slot the quickbar shows as loaded: the one the game marks, else ours. The game marks none after a page
     * load or any save load (singularities included): then it's our guess from the save at load (silver border),
     * or the slot loaded before the save load. Imports go there. Undefined when none is shown, or it's locked.
     */
    #shownLoadoutSlot(): HTMLButtonElement | undefined {
        const slot = this.#getGameActiveSlot()
            ?? this.#loadoutsSlots.find(loadoutSlot => loadoutSlot.id === this.activeLoadout) as HTMLButtonElement | undefined;
        return slot && slot.style.display !== 'none' ? slot : undefined;
    }

    /**
     * The game is the source of truth for the active loadout: it marks a slot (activeBlueberryLoadout) only
     * after a successful load or save, on any tab. Follow it. Until it marks one (it marks none at page load),
     * the best match found from the save at load is kept.
     */
    #observeGameActiveLoadout(): void {
        this.#gameActiveLoadoutObserver?.disconnect();

        const syncFromGame = () => {
            const gameSlot = this.#getGameActiveSlot();
            if (!gameSlot) return;
            const slotEnum = HSAmbrosiaHelper.getSlotEnumBySlotId(gameSlot.id);
            // Also when it marks the slot we guessed: the guess becomes confirmed (silver -> rainbow)
            if (slotEnum && (slotEnum !== this.activeLoadout || !this.#activeLoadoutConfirmed)) this.updateActiveLoadout(slotEnum);
        };

        this.#gameActiveLoadoutObserver = new MutationObserver(syncFromGame);
        for (const slot of this.#loadoutsSlots) {
            this.#gameActiveLoadoutObserver.observe(slot, { attributes: true, attributeFilter: ['class'] });
        }
        syncFromGame();
    }

    async resetActiveLoadout() {
        // Ensure quickbar section is injected before manipulating DOM
        await this.#ensureAmbrosiaSection();
        this.activeLoadout = undefined;
        this.#activeLoadoutConfirmed = false;

        // Clear visual state from both containers
        const containers = [
            this.#pageHeader?.querySelector(`#${HSGlobal.HSAmbrosia.quickBarId}`),
            this.#loadoutContainer,
            document.querySelector('#hs-ambrosia-slots-wrapper') // Just in case
        ];

        containers.forEach(container => {
            if (container) {
                container.querySelectorAll('.hs-rainbow-border, .hs-silver-border').forEach(slot => {
                    slot.classList.remove('hs-rainbow-border', 'hs-silver-border');
                });
            }
        });
    }

    updateActiveLoadout(slotEnum?: AMBROSIA_LOADOUT_SLOT) {
        if (!slotEnum) { HSLogger.warn('No slot specified to #updateActiveLoadout', this.context); return; }

        // Normalize & validate incoming slot value using helper.
        const resolvedSlot = HSAmbrosiaHelper.resolveAmbrosiaLoadout(slotEnum);
        if (!resolvedSlot) { HSLogger.warn('Invalid or unknown slot passed to #updateActiveLoadout: ' + slotEnum, this.context); return; }

        this.activeLoadout = resolvedSlot as AMBROSIA_LOADOUT_SLOT;
        // Confirmed once the game marks this slot; until then (none marked after a page load) it's our guess from the save
        this.#activeLoadoutConfirmed = this.#getGameActiveSlot()?.id === resolvedSlot;

        const isInjected = HSQuickbarManager.getInstance().isInjected("ambrosia");
        if (!isInjected) { HSLogger.warn("updateActiveLoadout() fail: quickbar not injected", this.context); return; }

        const slotNumber = HSAmbrosiaHelper.getLoadoutNumberFromSlot(resolvedSlot);
        if (!slotNumber) { HSLogger.warn('Could not parse loadout number from resolvedSlot:' + resolvedSlot, this.context); return; }

        this.quickbar.syncActiveSlot(slotNumber, this.#activeLoadoutConfirmed);

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

    /* RETIRED: Ambrosia AFK/idle swapper blue-bar calculation.
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
    */

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

    /**
     * Another save replaced the game's (cloud save, Steam cloud, file: the patched game's save import, reset = false).
     * The game marks no slot, and ours is still the old save's: guessed again from the save now loaded, read from
     * the live player (the same fields as a save). Without the live player, no slot is shown.
     */
    public async matchActiveLoadoutToLoadedSave(): Promise<void> {
        const player = HSGlobal.exposedPlayer as unknown as GameData | undefined;
        if (!player) { await this.resetActiveLoadout(); return; }
        await this.performInitialActiveLoadoutMatch(player);
    }

    public async performInitialActiveLoadoutMatch(saveData: GameData): Promise<void> {
        if (!saveData) return;

        // The game's marker, when it has set one, is authoritative: no need to guess
        const gameSlot = this.#getGameActiveSlot();
        const gameSlotEnum = gameSlot ? HSAmbrosiaHelper.getSlotEnumBySlotId(gameSlot.id) : undefined;
        if (gameSlotEnum) {
            this.updateActiveLoadout(gameSlotEnum);
            return;
        }

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

            this.updateActiveLoadout(slotEnum);

            HSLogger.debug(() => `Initial load - Ambrosia loadout best match: ${bestMatchId} is ${(highestScore * 100).toFixed(1)}% compliant. `, this.context);
        } else if (bestMatchId) {
            HSLogger.debug(() => `Initial load - No compliant Ambrosia loadout found. Closest was ${bestMatchId} at ${(highestScore * 100).toFixed(1)}% (Threshold: 80%).`, this.context);
        } else {
            HSLogger.debug(() => `Initial load - No saved Ambrosia loadouts found to match.`, this.context);
        }
    }

    public getAmbrosiaLoadoutsAmount(): number {
        return this.#loadoutsSlots.filter((slot) => slot.style.display !== 'none').length;
    }

    // ==============================================
    // ------- Add/Time Auto Loadout Behavior -------
    // ==============================================

    async enableAutoLoadout() {

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
            this.#_delegateAddHandler = async (e: Event) => { await this.#addCodeButtonHandler(e); };
        }

        if (!this.#_delegateTimeHandler) {
            this.#_delegateTimeHandler = async (e: Event) => { await this.#timeCodeButtonHandler(e); };
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

    // Auto-Loadout runs from a capture listener on the code buttons, so before the game's own listener.
    // The quickbar click loads the loadout synchronously (HSAmbrosiaQuickbar.onQuickBarClick): it's in place
    // before the game uses the code, whoever clicked. No await before that click.
    // Once the code's dialogs are over (it has paid out), the previous loadout is loaded back.
    // Not while autosing runs: autosing sets its own loadout before using the codes.

    async #addCodeButtonHandler(e: Event) {
        if (HSModuleManager.getModule<HSAutosing>('HSAutosing')?.isAutosingActive()) return;
        const addLoadoutSetting = HSSettings.getSetting('autoLoadoutAdd') as HSSelectStringSetting;

        if (addLoadoutSetting) {
            const addLoadout = HSAmbrosiaHelper.convertSettingLoadoutToSlot(addLoadoutSetting.getValue());
            const addLoadoutBtn = this.quickbar.getClonedButtonRef(addLoadout);
            if (!addLoadout || !addLoadoutBtn) { HSLogger.warn('Invalid autoLoadoutAdd setting - cannot resolve addLoadout or loadoutSlot', this.context); return; }

            this.#switchLoadoutForCode(addLoadoutBtn, addLoadout);
        }
    }

    async #timeCodeButtonHandler(e: Event) {
        if (HSModuleManager.getModule<HSAutosing>('HSAutosing')?.isAutosingActive()) return;
        const timeLoadoutSetting = HSSettings.getSetting('autoLoadoutTime') as HSSelectStringSetting;

        if (timeLoadoutSetting) {
            const timeLoadout = HSAmbrosiaHelper.convertSettingLoadoutToSlot(timeLoadoutSetting.getValue());
            const timeLoadoutBtn = this.quickbar.getClonedButtonRef(timeLoadout);
            if (!timeLoadout || !timeLoadoutBtn) { HSLogger.warn('Invalid autoLoadoutTime setting - cannot resolve timeLoadout or loadoutSlot', this.context); return; }

            // The game's listener runs next, for this same click: the act's answers cover the time code's Confirm
            // and Alerts (claimed through the click event). An instant answer only pays out with Cube Upgrade
            // Cx11 (cubeUpgrades[61]) at 100: below, the winning window is at least 6 s away, so it always loses.
            // Cx11 goes back to 0 at every singularity: checked at each click, the dialogs are shown meanwhile.
            // Without the save (bookmarklet): always answered at once.
            const cx11Level = HSGlobal.exposedPlayer?.cubeUpgrades?.[61];
            if (cx11Level === undefined || cx11Level >= 100) {
                HSGameDialogs.act('autoLoadoutTime', { confirm: 'ok', alert: 'dismiss' }, () => this.#switchLoadoutForCode(timeLoadoutBtn, timeLoadout));
            } else {
                HSUI.Notify('Auto-Loadout Time: Cx11 is not maxed, so the time code is shown for you to time it (an instant answer would always lose)', { notificationType: 'default' });
                this.#switchLoadoutForCode(timeLoadoutBtn, timeLoadout);
            }
        }
    }

    /**
     * Loads the code's loadout (through its quickbar copy), then loads the previous one back once the queue is
     * idle: the code's dialogs are over, so it has paid out. The previous one is the slot the quickbar shows,
     * also when the game marks none (after a page load or any save load): then its saved loadout is loaded, even
     * if the tree had changed since. Skipped when no slot was shown, when the player switched or saved meanwhile,
     * or when autosing started. One restore at a time: a second code meanwhile keeps the first previous slot.
     */
    #switchLoadoutForCode(codeLoadoutBtn: HTMLButtonElement, codeSlotId: string) {
        const previousSlot = this.#pendingCodeRestore?.slot ?? this.#shownLoadoutSlot();
        codeLoadoutBtn.click();
        if (!previousSlot || previousSlot.id === codeSlotId) {
            this.#pendingCodeRestore = undefined;
            return;
        }

        const isNew = !this.#pendingCodeRestore;
        this.#pendingCodeRestore = { slot: previousSlot, codeSlotId };
        if (!isNew) return;

        void HSGameDialogs.whenQueueIdle().then(() => {
            const restore = this.#pendingCodeRestore;
            this.#pendingCodeRestore = undefined;
            if (!restore) return;
            if (HSModuleManager.getModule<HSAutosing>('HSAutosing')?.isAutosingActive()) return;
            if (this.#getGameActiveSlot()?.id !== restore.codeSlotId) return;
            this.#reloadLoadoutSlot(restore.slot, 'autoLoadoutRestore');
        });
    }

    // ==============================================
    // ----- Persistent Ambrosia Levels Display -----
    // ==============================================

    /** The "Keep upgrade levels shown on the tree" setting, the only record of the 📌/🔎 state. */
    get #persistentAmbrosiaLevelsEnabled(): boolean {
        return HSSettings.getSetting('persistentAmbrosiaLevels')?.isEnabled() ?? true;
    }

    /**
     * Before the setting, the state had a storage key of its own (hs-ambrosia-loadouts, despite its name).
     * Carried into the setting once, then removed; an old backup brings it back and goes through here again.
     * Temporary (added 2026-10-18): can be removed a few releases later, with its call in init().
     * Without it, a leftover key is just ignored and the setting keeps its default.
     */
    #migrateLegacyPersistentAmbrosiaLevelsState() {
        const legacyKey = 'ambrosia-loadouts';
        const storage = HSModuleManager.getModule<HSStorage>('HSStorage');
        if (!storage || localStorage.getItem(`${HSGlobal.HSStorage.storagePrefix}${legacyKey}`) === null) return;

        let stored: unknown = storage.getData(legacyKey);
        try {
            // Written as a JSON string inside JSON
            if (typeof stored === 'string') stored = JSON.parse(stored);
        } catch {
            stored = null;
        }

        if (stored && typeof stored === 'object' && !Array.isArray(stored)) {
            const record = stored as Record<string, unknown>;
            const value = 'persistentAmbrosiaLevelsDisplayEnabled' in record ? record.persistentAmbrosiaLevelsDisplayEnabled
                : 'permaAmbLevelsDisplayEnabled' in record ? record.permaAmbLevelsDisplayEnabled
                    : undefined;
            const setting = HSSettings.getSetting('persistentAmbrosiaLevels');
            if (value !== undefined && setting) {
                setting.setValue(Boolean(value));
                HSLogger.log(`Persistent ambrosia levels display (${Boolean(value) ? 'on' : 'off'}) moved into its setting`, this.context);
            }
        }

        storage.clearData(legacyKey);
    }

    async #hookPersistentAmbrosiaLevelsToggleButton() {
        const button = this.#persistentAmbrosiaLevelsToggleButton ?? await HSElementHooker.HookElement('#showCurrAmbrosiaUpgrades') as HTMLButtonElement;
        if (!button) { HSLogger.warn('hookPersistentAmbrosiaLevelsToggleButton() could not find #showCurrAmbrosiaUpgrades', this.context); return; }
        this.#persistentAmbrosiaLevelsToggleButton = button;

        button.title = 'Toggle persistent Amb Levels Display';
        button.setAttribute('aria-label', 'Toggle persistent Amb Levels Display');
        button.classList.remove('hs-tooltip');

        this.#persistentAmbrosiaLevelsToggleHandler ??= (event: Event) => {
            event.preventDefault();
            event.stopPropagation();
            HSLogger.debug(() => 'persistentAmbrosiaLevelsToggle clicked', this.context);
            // The setting saves, updates its panel switch and runs its action (applyPersistentAmbrosiaLevelsSetting)
            const setting = HSSettings.getSetting('persistentAmbrosiaLevels');
            if (this.#persistentAmbrosiaLevelsEnabled) {
                setting.disable();
            } else {
                setting.enable();
            }
        };

        button.addEventListener('click', this.#persistentAmbrosiaLevelsToggleHandler);

        if (this.#persistentAmbrosiaLevelsEnabled) {
            this.#enablePersistentAmbrosiaLevelsDisplay();
        }
    }

    /** Action of the persistentAmbrosiaLevels setting (panel switch or 📌/🔎 click). */
    applyPersistentAmbrosiaLevelsSetting(enabled: boolean) {
        // Button not hooked yet (Ambrosia tab not opened since the load): the hook applies the setting
        if (!this.#persistentAmbrosiaLevelsToggleButton) return;

        if (enabled) {
            this.#enablePersistentAmbrosiaLevelsDisplay();
        } else {
            this.#disablePersistentAmbrosiaLevelsDisplay();
        }
    }

    #enablePersistentAmbrosiaLevelsDisplay() {
        if (!this.#persistentAmbrosiaLevelsToggleButton) { HSLogger.warn('enablePersistentAmbrosiaLevelsDisplay() missing button reference', this.context); return; }

        this.#persistentAmbrosiaLevelsToggleButton.classList.add('hs-ambrosia-current-levels-active');
        this.#persistentAmbrosiaLevelsToggleButton.textContent = '📌';

        if (this.#isAmbrosiaTabActive) {
            this.#attachPersistentAmbrosiaLevelsDisplayListeners();
            this.#displayPersistentAmbrosiaLevels();
            // Fresh render: the next GDS update only records the tree as reference
            this.#persistentAmbrosiaLevelsSignature = undefined;
        }
    }

    #disablePersistentAmbrosiaLevelsDisplay() {
        if (!this.#persistentAmbrosiaLevelsToggleButton) { HSLogger.warn('disablePersistentAmbrosiaLevelsDisplay() missing button reference', this.context); return; }
        this.#persistentAmbrosiaLevelsToggleButton.textContent = '🔎';
        this.#persistentAmbrosiaLevelsToggleButton.classList.remove('hs-ambrosia-current-levels-active');

        this.#detachPersistentAmbrosiaLevelsDisplayListeners();

        if (!this.#blueberryUpgradeContainer?.matches(':hover')) {
            this.#restorePersistentAmbrosiaLevelsDisplay();
        }
    }

    #shouldRestorePersistentAmbrosiaLevelsDisplay() {
        if (!this.#persistentAmbrosiaLevelsEnabled) return false;
        if (this.#blueberryUpgradeContainer?.matches(':hover')) return false;
        if (this.#loadoutsSlots.some((loadoutSlot) => loadoutSlot.matches(':hover'))) return false;
        return true;
    }

    #maybeRestorePersistentAmbrosiaLevelsDisplay() {
        if (!this.#shouldRestorePersistentAmbrosiaLevelsDisplay()) return;
        this.#displayPersistentAmbrosiaLevels();
    }

    #persistentAmbrosiaLevelsContainerEnterHandler = (event: Event) => {
        if (!this.#persistentAmbrosiaLevelsEnabled) return;
        if (!this.#blueberryUpgradeContainer) return;
        if (!event.isTrusted) return;

        this.#hidePersistentAmbrosiaLevelsDisplay();
    };

    #persistentAmbrosiaLevelsContainerLeaveHandler = (event: Event) => {
        if (!this.#persistentAmbrosiaLevelsEnabled) return;
        if (!this.#blueberryUpgradeContainer) return;
        if (!event.isTrusted) return;

        setTimeout(() => {
            this.#maybeRestorePersistentAmbrosiaLevelsDisplay();
        }, 0);
    };

    #persistentAmbrosiaLevelsSlotMouseOutHandler = (event: MouseEvent) => {
        if (!this.#persistentAmbrosiaLevelsEnabled) return;
        if (!(event.target instanceof HTMLElement)) return;

        const slot = event.target.closest('.blueberryLoadoutSlot');
        if (!slot) return;

        const relatedTarget = event.relatedTarget;
        if (relatedTarget instanceof Node && slot.contains(relatedTarget)) { return; }

        setTimeout(() => {
            this.#maybeRestorePersistentAmbrosiaLevelsDisplay();
        }, 0);
    };

    #displayPersistentAmbrosiaLevels() {
        const button = this.#persistentAmbrosiaLevelsToggleButton;
        if (!button) { HSLogger.warn('displayPersistentAmbrosiaLevels() missing persistent levels button', this.context); return; }

        // The game's level display only adds classes (dimmed, superDimmed, maxBlueberryLevel)
        // and never removes them, so reset it first (its mouseout handler) to avoid stale styles.
        this.#hidePersistentAmbrosiaLevelsDisplay();

        const event = new MouseEvent('mouseover', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        button.dispatchEvent(event);
    }

    /** Re-render the persistent levels once the game has processed a tree change. */
    #queuePersistentAmbrosiaLevelsRefresh() {
        if (!this.#isAmbrosiaTabActive) return;
        setTimeout(() => {
            this.#maybeRestorePersistentAmbrosiaLevelsDisplay();
        }, 0);
    }

    /** Refresh the persistent levels when the tree in the save data changed (any source: game, mod, autosing). */
    #refreshPersistentAmbrosiaLevelsOnTreeChange(gameData: GameData) {
        if (!this.#isAmbrosiaTabActive || !this.#persistentAmbrosiaLevelsEnabled) return;

        // The 🔎 view also shows red and purple levels, so they are part of the signature
        const signature = JSON.stringify(gameData.ambrosiaUpgrades) + JSON.stringify(gameData.redAmbrosiaUpgrades);
        if (signature === this.#persistentAmbrosiaLevelsSignature) return;

        const isFirstSignature = this.#persistentAmbrosiaLevelsSignature === undefined;
        this.#persistentAmbrosiaLevelsSignature = signature;
        if (!isFirstSignature) {
            this.#maybeRestorePersistentAmbrosiaLevelsDisplay();
        }
    }

    #attachPersistentAmbrosiaLevelsDisplayListeners() {
        this.#detachPersistentAmbrosiaLevelsDisplayListeners();
        if (this.#blueberryUpgradeContainer) {
            this.#blueberryUpgradeContainer.addEventListener('mouseenter', this.#persistentAmbrosiaLevelsContainerEnterHandler);
            this.#blueberryUpgradeContainer.addEventListener('mouseleave', this.#persistentAmbrosiaLevelsContainerLeaveHandler);
        }
        if (this.#loadoutContainer) {
            this.#loadoutContainer.addEventListener('mouseout', this.#persistentAmbrosiaLevelsSlotMouseOutHandler);
        }
    }

    #detachPersistentAmbrosiaLevelsDisplayListeners() {
        if (this.#blueberryUpgradeContainer) {
            this.#blueberryUpgradeContainer.removeEventListener('mouseenter', this.#persistentAmbrosiaLevelsContainerEnterHandler);
            this.#blueberryUpgradeContainer.removeEventListener('mouseleave', this.#persistentAmbrosiaLevelsContainerLeaveHandler);
        }
        if (this.#loadoutContainer) {
            this.#loadoutContainer.removeEventListener('mouseout', this.#persistentAmbrosiaLevelsSlotMouseOutHandler);
        }
    }

    #subscribeGameStateViewChanges() {
        const gameStateMod = HSModuleManager.getModule<HSGameState>('HSGameState');
        if (!gameStateMod) { HSLogger.warn('subscribeGameStateViewChanges() - gameStateMod==undefined', 'hs-ambrosia-gamestate'); return; }

        if (!this.#ambrosiaViewSubscriptionId) {
            this.#ambrosiaViewSubscriptionId = gameStateMod.subscribeForView(
                MAIN_VIEW.SINGULARITY,
                SINGULARITY_VIEW.AMBROSIA,
                (isActive) => {
                    if (isActive) { // Ambrosia Tab Enter
                        this.#onAmbrosiaTabEnter();
                    } else { // Ambrosia Tab Leave
                        this.#onAmbrosiaTabLeave();
                    }
                }
            );
        }
    }

    async #onAmbrosiaTabEnter() {
        if (this.#isAmbrosiaTabActive) return;
        this.#isAmbrosiaTabActive = true;

        this.#ensureBarIncomeElements();
        await this.#attachAmbrosiaTabEvents();
        this.subscribeGameDataChanges();
        void this.#queueBarIncomeRefresh(!this.#isGDSRunning());

        // RETIRED: Ambrosia AFK/idle swapper activation on tab entry.
        // if (this.#isIdleSwapEnabled) {
        //     void this.#activateIdleSwap();
        // }

        if (!this.#persistentAmbrosiaLevelsEnabled) return;

        this.#enablePersistentAmbrosiaLevelsDisplay();
    }

    #onAmbrosiaTabLeave() {
        if (!this.#isAmbrosiaTabActive) return;
        this.#isAmbrosiaTabActive = false;
        this.#clearScheduledBarIncomeRefresh();
        this.unsubscribeGameDataChanges();

        this.#detachAmbrosiaTabEvents();
        this.#detachPersistentAmbrosiaLevelsDisplayListeners();

        // RETIRED: Ambrosia AFK/idle swapper deactivation on tab exit.
        // if (this.#isIdleSwapEnabled) {
        //     this.#deactivateIdleSwap();
        // }

        if (this.#persistentAmbrosiaLevelsEnabled) {
            this.#restorePersistentAmbrosiaLevelsDisplay();
        }
    }

    #ensureBarIncomeElements(): void {
        const ensureElement = (sectionId: string, elementId: string): HTMLParagraphElement | undefined => {
            const section = document.getElementById(sectionId);
            if (!section) return undefined;

            let element = section.querySelector<HTMLParagraphElement>(`#${elementId}`);
            if (!element) {
                element = document.createElement('p');
                element.id = elementId;
                element.className = 'ambrosiaResourceModifiers';
                element.title = 'Sustained expected rate for the active Ambrosia loadout.';
                element.setAttribute('aria-live', 'polite');
                section.appendChild(element);
            }
            return element;
        };

        this.#blueIncomeElement = ensureElement('ambrosiaDisplay', 'hs-ambrosia-expected-hourly');
        this.#redIncomeElement = ensureElement('redAmbrosiaDisplay', 'hs-red-ambrosia-expected-hourly');
        this.#purpleIncomeElement = ensureElement('purpleAmbrosiaDisplay', 'hs-purple-ambrosia-expected-hourly');
    }

    // Cached game data is only current while the GDS engine runs (it can be paused with the setting ON)
    #isGDSRunning(): boolean {
        return HSModuleManager.getModule<HSGameData>('HSGameData')?.isGDSRunning() ?? false;
    }

    #queueBarIncomeRefresh(forceRefresh: boolean): Promise<void> {
        const refresh = async () => {
            if (!this.#isAmbrosiaTabActive) return;

            this.#ensureBarIncomeElements();
            const gameDataAPI = this.#cachedGameDataAPI
                ?? HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
            if (!gameDataAPI) {
                this.#setBarIncomeUnavailable();
                return;
            }

            try {
                const gameData = forceRefresh
                    ? await gameDataAPI.getForcedGameData()
                    : gameDataAPI.getGameData();
                if (!this.#isAmbrosiaTabActive) return;
                if (!gameData) {
                    this.#setBarIncomeUnavailable();
                    return;
                }

                const income = gameDataAPI.ambrosia.calculateAmbrosiaBarIncome();
                if (!income) {
                    this.#setBarIncomeUnavailable();
                    return;
                }

                const bluePerHour = income.blueAmbrosiaPerSecond * 3_600;
                const redPerHour = income.redAmbrosiaPerSecond * 3_600;
                const purplePerHour = income.purpleHoneyPerSecond * 3_600;
                this.#renderIncomeRate(
                    this.#blueIncomeElement,
                    Number.isFinite(bluePerHour) ? HSUtils.N(bluePerHour) : 'unavailable',
                    'amb',
                    'var(--amber-text-color)'
                );
                this.#renderIncomeRate(
                    this.#redIncomeElement,
                    Number.isFinite(redPerHour) ? HSUtils.N(redPerHour) : 'unavailable',
                    'ramb',
                    'red'
                );
                this.#renderIncomeRate(
                    this.#purpleIncomeElement,
                    Number.isFinite(purplePerHour) ? HSUtils.N(purplePerHour) : 'unavailable',
                    'phoney',
                    'var(--purple-text-color)'
                );
            } catch (error) {
                HSLogger.warn(`Could not calculate expected Ambrosia income: ${error}`, this.context);
                this.#setBarIncomeUnavailable();
            }
        };

        // Every refresh restarts the timer, so it only fires when GDS delivers nothing
        // (setting off, or paused): with GDS running, #refreshBarIncomeOnGameData refreshes every 500ms.
        const queuedRefresh = this.#barIncomeRefreshQueue.then(refresh, refresh)
            .finally(() => this.#scheduleBarIncomeRefresh());
        this.#barIncomeRefreshQueue = queuedRefresh.catch((error) => {
            HSLogger.warn(`Ambrosia income refresh failed: ${error}`, this.context);
        });
        return queuedRefresh;
    }

    /** With GDS running, new save data comes about 15 times a second: refresh the rates from it, every 500ms at most. */
    #refreshBarIncomeOnGameData(): void {
        if (!this.#isAmbrosiaTabActive) return;

        const now = performance.now();
        if (now - this.#lastBarIncomeDataRefresh < 500) return;
        this.#lastBarIncomeDataRefresh = now;

        void this.#queueBarIncomeRefresh(false);
    }

    #setBarIncomeUnavailable(): void {
        this.#renderIncomeRate(this.#blueIncomeElement, 'unavailable', 'amb', 'var(--amber-text-color)');
        this.#renderIncomeRate(this.#redIncomeElement, 'unavailable', 'ramb', 'red');
        this.#renderIncomeRate(this.#purpleIncomeElement, 'unavailable', 'phoney', 'var(--purple-text-color)');
    }

    #renderIncomeRate(
        element: HTMLParagraphElement | undefined,
        amount: string,
        resource: 'amb' | 'ramb' | 'phoney',
        color: string
    ): void {
        if (!element) return;

        // The element is aria-live: an unchanged rate must not be written again
        if (element.textContent === `[HS] ${amount} ${resource} / hour`) return;

        const amountElement = document.createElement('span');
        amountElement.style.color = color;
        amountElement.textContent = amount;
        element.replaceChildren(
            document.createTextNode('[HS] '),
            amountElement,
            document.createTextNode(` ${resource} / hour`)
        );
    }

    #scheduleBarIncomeRefresh(): void {
        this.#clearScheduledBarIncomeRefresh();
        if (!this.#isAmbrosiaTabActive) return;

        // Without GDS each refresh forces a save: every 2s, but 10s while autosing runs (it pauses GDS, and its speed comes first).
        // With GDS running the timer is only a safety net.
        const autosingActive = HSModuleManager.getModule<HSAutosing>('HSAutosing')?.isAutosingActive() ?? false;
        const delay = this.#isGDSRunning() || autosingActive ? 10_000 : 2_000;

        this.#barIncomeRefreshTimer = setTimeout(() => {
            this.#barIncomeRefreshTimer = undefined;
            void this.#queueBarIncomeRefresh(!this.#isGDSRunning());
        }, delay);
    }

    #clearScheduledBarIncomeRefresh(): void {
        if (this.#barIncomeRefreshTimer !== undefined) {
            clearTimeout(this.#barIncomeRefreshTimer);
            this.#barIncomeRefreshTimer = undefined;
        }
    }

    #hidePersistentAmbrosiaLevelsDisplay() {
        const button = this.#persistentAmbrosiaLevelsToggleButton;
        if (!button) { HSLogger.warn('hidePersistentAmbrosiaLevelsDisplay() missing persistent levels button', this.context); return; }

        const event = new MouseEvent('mouseout', {
            bubbles: true,
            cancelable: true,
            view: window,
            relatedTarget: document.body
        });
        button.dispatchEvent(event);
    }

    #restorePersistentAmbrosiaLevelsDisplay() {
        const button = this.#persistentAmbrosiaLevelsToggleButton;
        if (!button) { HSLogger.warn('restorePersistentAmbrosiaLevelsDisplay() missing persistent levels button', this.context); return; }

        if (button.matches(':hover')) {
            HSLogger.debug(() => 'restorePersistentAmbrosiaLevelsDisplay() button still hovered; deferring to normal hover state', this.context);
            return;
        }

        const event = new MouseEvent('mouseout', {
            bubbles: true,
            cancelable: true,
            view: window,
            relatedTarget: document.body
        });
        button.dispatchEvent(event);
    }


    // ==============================================
    // --- Ambrosia Loadouts (Quick) Import Rules ---
    // ==============================================

    // The game includes every Ambrosia module in its blueberry-tree export.
    // Older Heater/clipboard loadouts may omit keys, so the quick importer
    // fills any missing module with level zero before handing it to the game.
    static readonly #quickImportAmbrosiaKeys = [
        'ambrosiaTutorial',
        'ambrosiaQuarks1',
        'ambrosiaCubes1',
        'ambrosiaLuck1',
        'ambrosiaQuarkCube1',
        'ambrosiaLuckCube1',
        'ambrosiaCubeQuark1',
        'ambrosiaLuckQuark1',
        'ambrosiaCubeLuck1',
        'ambrosiaQuarkLuck1',
        'ambrosiaQuarks2',
        'ambrosiaCubes2',
        'ambrosiaLuck2',
        'ambrosiaQuarks3',
        'ambrosiaQuarks4',
        'ambrosiaCubes3',
        'ambrosiaCubes4',
        'ambrosiaFreeCubeUpgrades',
        'ambrosiaLuck3',
        'ambrosiaLuck4',
        'ambrosiaPatreon',
        'ambrosiaObtainium1',
        'ambrosiaOffering1',
        'ambrosiaHyperflux',
        'ambrosiaBaseOffering1',
        'ambrosiaBaseObtainium1',
        'ambrosiaBaseOffering2',
        'ambrosiaBaseObtainium2',
        'ambrosiaFreeObtainiumUpgrades',
        'ambrosiaFreeOfferingUpgrades',
        'ambrosiaSingReduction1',
        'ambrosiaInfiniteShopUpgrades1',
        'ambrosiaInfiniteShopUpgrades2',
        'ambrosiaInfiniteShopUpgrades3',
        'ambrosiaSingReduction2',
        'ambrosiaTalismanBonusRuneLevel',
        'ambrosiaRuneOOMBonus',
        'ambrosiaBrickOfLead',
        'ambrosiaFreeLuckUpgrades',
        'ambrosiaFreeGenerationUpgrades',
        'ambrosiaFreeRedLuckUpgrades',
        'ambrosiaFreeQuarkUpgrades',
        'twoMind',
    ] as const;

    static #normalizeQuickImportLoadout(line: string): string {
        try {
            const parsed = JSON.parse(line) as unknown;
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return line;

            const normalized = { ...(parsed as Record<string, unknown>) };
            for (const key of HSAmbrosia.#quickImportAmbrosiaKeys) {
                normalized[key] ??= 0;
            }
            return JSON.stringify(normalized);
        } catch {
            // Let the game's importer produce its normal invalid-file error.
            return line;
        }
    }

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
        let text: string | undefined;
        try {
            text = await navigator.clipboard.readText();
            // clipboard length hidden

            if (!text || typeof text !== 'string') {
                HSUI.Notify('Clipboard does not contain valid loadout data', {
                    notificationType: 'warning'
                });
                return;
            }

            // Split clipboard by lines
            const lines = text.split(/\r?\n|\r/g).map(line => line.trim());

            // Validate we have between 1 and 16 loadouts
            if (lines.length === 0 || lines.length > 16) {
                HSUI.Notify(`Invalid number of loadouts: ${lines.length}. Expected 1 - 16.`, {
                    notificationType: 'warning'
                });
                return;
            }

            const isSingleLoadout = lines.length === 1 || (lines.length === 2 && lines[1] === '');
            // Named in the notification: the shown slot can be a guess, a wrong one is seen at once
            const shownSlot = this.#shownLoadoutSlot();
            const singleSlotNumber = isSingleLoadout && shownSlot ? this.#getSlotNumber(shownSlot) : undefined;
            let summary: HSQuickImportSummary;
            if (HSGlobal.exposedPlayer) {
                summary = this.#importLinesDirect(lines, isSingleLoadout);
            } else {
                if (this.#refuseGameImportDuringAutosing()) return;
                summary = await HSGameDialogs.run('quickImport', { timeLimitMs: HSAmbrosia.#GAME_IMPORT_TIME_LIMIT_MS },
                    () => this.#importLinesThroughGame(lines, isSingleLoadout));
            }
            const { importedCount, skippedCount, failures } = summary;

            // summary: imported/skipped/failed
            if (isSingleLoadout && importedCount === 0 && failures.length === 1) {
                // One line: its reason fits in the notification
                HSUI.Notify(`Quick Import failed: ${failures[0].reason}`, { notificationType: 'warning' });
            } else if (failures.length > 0) {
                const failureSummary = failures.map(f => `#${f.index}: ${f.reason}`).join('; ');
                // Short user-facing notification; detailed info logged for debugging
                HSUI.Notify(`Imported ${importedCount} loadout(s); ${failures.length} failed (see logs)`, { notificationType: 'warning' });
                HSLogger.debug(() => `Quick Import detailed failures: ${failureSummary}`, this.context);
            } else if (isSingleLoadout && importedCount === 1 && singleSlotNumber !== undefined) {
                HSUI.Notify(`Loadout imported to slot ${singleSlotNumber}`, { notificationType: 'success' });
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

            HSLogger.error(`Quick Import failed: ${msg}`, this.context, true);
            // Log detailed error context for debugging
            HSLogger.debug(() => `Quick Import exception message: ${msg}; clipboardLen=${text?.length ?? 'n/a'}`, this.context);

            HSUI.Notify('Quick Import failed', { notificationType: 'error' });
        }
    }

    /**
     * With the patched game: writes each loadout straight into the save (player.blueberryLoadouts), as the game's
     * own save does. No dialog, no loadout mode switch, the live tree untouched, all in one synchronous step: safe
     * while autosing runs. Then loads the slot the quickbar shows (#shownLoadoutSlot) if it was written, so the
     * live tree matches it and the game marks it.
     * One line goes into that slot; several go into slots 1 to 16, in order (empty lines skipped).
     */
    #importLinesDirect(lines: string[], isSingleLoadout: boolean): HSQuickImportSummary {
        const summary: HSQuickImportSummary = { importedCount: 0, skippedCount: 0, failures: [] };
        const shownSlot = this.#shownLoadoutSlot();
        const shownSlotNumber = shownSlot ? this.#getSlotNumber(shownSlot) : undefined;
        let shownSlotWritten = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (!line) {
                summary.skippedCount++;
                continue;
            }

            const slotNumber = isSingleLoadout ? shownSlotNumber : i + 1;
            const result = slotNumber === undefined
                ? { success: false, reason: HSAmbrosia.#NO_ACTIVE_LOADOUT_REASON }
                : this.#writeLoadout(slotNumber, line);
            if (!result.success) {
                summary.failures.push({ index: i + 1, reason: result.reason ?? 'Unknown error' });
                continue;
            }
            summary.importedCount++;
            if (slotNumber === shownSlotNumber) shownSlotWritten = true;
        }

        if (shownSlot && shownSlotWritten) this.#reloadLoadoutSlot(shownSlot);
        return summary;
    }

    #getSlotNumber(slot: HTMLElement): number | undefined {
        const slotEnum = HSAmbrosiaHelper.getSlotEnumBySlotId(slot.id);
        return slotEnum ? HSAmbrosiaHelper.getLoadoutNumberFromSlot(slotEnum) : undefined;
    }

    /** Writes one loadout line into a slot of the save, once the game's own validation (patcher) accepts it. */
    #writeLoadout(slotNumber: number, line: string): { success: boolean; reason?: string } {
        const player = HSGlobal.exposedPlayer;
        if (!player) return { success: false, reason: 'Game not patched' };
        const slot = this.#loadoutsSlots.find(loadoutSlot => loadoutSlot.id === `blueberryLoadout${slotNumber}`);
        if (!slot || slot.style.display === 'none') return { success: false, reason: `Loadout ${slotNumber} is locked` };

        let tree: unknown;
        try {
            tree = JSON.parse(HSAmbrosia.#normalizeQuickImportLoadout(line));
        } catch {
            tree = undefined;
        }
        if (!tree || typeof tree !== 'object' || Array.isArray(tree)) return { success: false, reason: 'Not a loadout (invalid JSON)' };

        const validate = (window as any).__HS_validateBlueberryTree;
        if (typeof validate === 'function') {
            if (!validate(tree)) {
                return { success: false, reason: 'Rejected by the game: locked upgrade, missing prerequisite, or not enough ambrosia or blueberries' };
            }
        } else {
            HSLogger.debug(() => `Quick Import: the game's tree validation is not patched, loadout ${slotNumber} written unchecked`, this.context);
        }

        player.blueberryLoadouts[slotNumber] = tree;
        return { success: true };
    }

    /** Loads a slot (e.g. so the live tree matches what was just written into it). Its success Alert is dismissed. */
    #reloadLoadoutSlot(slot: HTMLButtonElement, owner = 'quickImport') {
        HSAmbrosiaHelper.ensureLoadoutMode('loadTree');
        HSGameDialogs.act(owner, { alert: 'dismiss' }, () => slot.click());
        this.#queuePersistentAmbrosiaLevelsRefresh();
    }

    // ==============================================
    // ---- Temporary tree: singularity reducers ----
    // ==============================================

    /**
     * For the Hepteract Distributor: a tree holding the singularity reducer that counts where the player is
     * (reducer 1 outside an Exalt, with its Hyperflux prerequisite; reducer 2 inside), to load for the time of
     * the crafts. Nothing else is kept, except Talisman Power (ambrosiaTalismanBonusRuneLevel): with the Horseshoe
     * shop upgrade it raises the Horseshoe rune, which lowers every singularity penalty. It is chosen after the
     * reducer, which it must never cost a level: raised as far as the ambrosia left allows when asked, else kept
     * at the player's own level.
     * The game only loads a tree from a loadout slot (#loadTreeThroughSlot). The slot used is the one the game
     * marks; it marks none after a save load (every singularity), and then the one the quickbar remembers is
     * used, if it holds exactly the live tree. So the live tree, the slots and the game's mark end as they were
     * (or the mark on a slot holding the live tree).
     * Only reads the game: nothing changes before apply().
     */
    prepareSingReducerSwap(options: HSSingReducerSwapOptions): HSSingReducerPlan {
        const player = HSGlobal.exposedPlayer;
        const gameValidate = (window as any).__HS_validateBlueberryTree;
        if (!player || typeof gameValidate !== 'function') {
            return { note: 'Singularity reducers not used: the game\'s patch is too old (patch the game again).' };
        }
        const validate = (tree: HSAmbrosiaTree): boolean => {
            try { return gameValidate(tree) === true; } catch { return false; }
        };

        const liveTree = this.#readLiveTree();
        if (!liveTree) return { note: 'Singularity reducers not used: could not read your ambrosia tree.' };

        const insideExalt = Boolean(player.insideSingularityChallenge);
        const reducer = insideExalt ? 'ambrosiaSingReduction2' : 'ambrosiaSingReduction1';
        const liveLevel = liveTree[reducer] ?? 0;
        const configs = this.#ambrosiaUpgradeConfigs();
        const maxLevel = configs?.[reducer]?.maxLevel ?? 0;
        const talisman = 'ambrosiaTalismanBonusRuneLevel';
        const liveTalisman = liveTree[talisman] ?? 0;

        const treeWith = (reducerLevel: number, talismanLevel: number): HSAmbrosiaTree => {
            const tree: HSAmbrosiaTree = Object.fromEntries(Object.keys(liveTree).map(key => [key, 0]));
            tree[reducer] = reducerLevel;
            // Reducer 1's prerequisite
            if (!insideExalt && reducerLevel > 0) tree.ambrosiaHyperflux = 4;
            if (talisman in liveTree) tree[talisman] = talismanLevel;
            return tree;
        };

        // The highest reducer level the game accepts (unlocked, ambrosia and blueberries), above the live one
        let reducerLevel: number | undefined;
        let note: string | undefined;
        if (options.reducers) {
            for (let level = maxLevel; level > liveLevel && reducerLevel === undefined; level--) {
                if (validate(treeWith(level, 0))) reducerLevel = level;
            }
            if (reducerLevel === undefined && liveLevel < maxLevel) {
                const exalt = insideExalt ? 'noAmbrosiaUpgrades' : 'noSingularityUpgrades';
                note = player.singularityChallenges?.[exalt]?.completions > 0
                    ? 'Singularity reducers not used: your ambrosia or blueberries can\'t pay for more of them.'
                    : `Singularity reducers not used: locked (Exalt ${insideExalt ? 5 : 1} not completed).`;
            }
        }
        if (reducerLevel === undefined) {
            // No reducer to add: the player's own level, in a tree only worth loading for Talisman Power
            if (!options.talismanAlone || !validate(treeWith(liveLevel, 0))) return { note };
            reducerLevel = liveLevel;
        }

        // Talisman Power costs no blueberries: the highest level the ambrosia left by the reducer pays for, up to
        // its maximum when it is to be raised, else up to the player's own level (so the swap doesn't lose it)
        let talismanLevel = 0;
        let highest = options.raiseTalisman
            ? configs?.[talisman]?.maxLevel ?? 0
            : player.shopUpgrades?.shopHorseShoe > 0 ? liveTalisman : 0;
        while (talismanLevel < highest) {
            const middle = talismanLevel + Math.ceil((highest - talismanLevel) / 2);
            if (validate(treeWith(reducerLevel, middle))) talismanLevel = middle;
            else highest = middle - 1;
        }
        if (reducerLevel === liveLevel && talismanLevel <= liveTalisman) return { note };

        const tree = treeWith(reducerLevel, talismanLevel);
        if (!validate(liveTree)) {
            return { note: 'Singularity reducers not used: the game would not load your current ambrosia tree back.' };
        }

        const slot = this.#getGameActiveSlot() ?? this.#rememberedSlotHolding(liveTree);
        if (!slot) {
            return {
                stop: 'Singularity reducers: the game marks no ambrosia loadout, and your tree is not the quickbar\'s loadout. '
                    + 'Load or save a loadout, then press Distribute again. Nothing was spent.'
            };
        }

        const temporaryTree = tree;
        const isLive = (expected: HSAmbrosiaTree): boolean => {
            const now = this.#readLiveTree();
            return now !== undefined && this.#isSameTree(now, expected);
        };
        return {
            note,
            swap: {
                added: reducerLevel - liveLevel,
                talismanLevel,
                talismanAdded: talismanLevel - liveTalisman,
                apply: () => this.#loadTreeThroughSlot(slot, temporaryTree) && isLive(temporaryTree),
                restore: () => isLive(liveTree) || (this.#loadTreeThroughSlot(slot, liveTree) && isLive(liveTree)),
            }
        };
    }

    #ambrosiaUpgradeConfigs(): Record<string, AmbrosiaUpgradeCalculationConfig<any> | undefined> | undefined {
        return HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI')?.ambrosia.ambrosiaUpgradeCalculationCollection as
            Record<string, AmbrosiaUpgradeCalculationConfig<any> | undefined> | undefined;
    }

    /**
     * The live tree as the game would save it ({ upgrade: level }), from what the live player has invested in
     * each upgrade: the levels themselves are not in the player object. Undefined when an amount is not the
     * exact price of a level (an upgrade the mod doesn't know, a formula changed by a game update).
     */
    #readLiveTree(): HSAmbrosiaTree | undefined {
        const upgrades = HSGlobal.exposedPlayer?.ambrosiaUpgrades as Record<string, Partial<AmbrosiaUpgradeData> | undefined> | undefined;
        const configs = this.#ambrosiaUpgradeConfigs();
        if (!upgrades || !configs) return undefined;

        const tree: HSAmbrosiaTree = {};
        for (const [key, state] of Object.entries(upgrades)) {
            // Two Mind only costs blueberries (the game reads its level the same way)
            if (key === 'twoMind') {
                tree[key] = (state?.blueberriesInvested ?? 0) > 0 ? 1 : 0;
                continue;
            }

            const invested = state?.ambrosiaInvested ?? 0;
            const config = configs[key];
            let level = 0;
            let spent = 0;
            while (config && level < config.maxLevel) {
                const cost = config.costFormula(level, config.costPerLevel);
                if (!(cost > 0) || spent + cost > invested * (1 + 1e-9)) break;
                spent += cost;
                level++;
            }
            if (!(Math.abs(invested - spent) <= invested * 1e-9)) return undefined;
            tree[key] = level;
        }
        return tree;
    }

    /** Whether a saved loadout loads as this tree. As the game does at a load, a saved level above the maximum counts as the maximum. */
    #isSameTree(saved: Record<string, unknown>, tree: HSAmbrosiaTree): boolean {
        const configs = this.#ambrosiaUpgradeConfigs();
        for (const key of new Set([...Object.keys(saved), ...Object.keys(tree)])) {
            const savedLevel = Math.min(Number(saved[key] ?? 0), configs?.[key]?.maxLevel ?? Infinity);
            if (savedLevel !== (tree[key] ?? 0)) return false;
        }
        return true;
    }

    /** The slot the quickbar shows as loaded, when its saved loadout is exactly this tree. */
    #rememberedSlotHolding(tree: HSAmbrosiaTree): HTMLButtonElement | undefined {
        const slot = this.#loadoutsSlots.find(loadoutSlot => loadoutSlot.id === this.activeLoadout) as HTMLButtonElement | undefined;
        if (!slot || slot.style.display === 'none') return undefined;

        const slotNumber = this.#getSlotNumber(slot);
        const saved = slotNumber === undefined ? undefined : HSGlobal.exposedPlayer?.blueberryLoadouts?.[slotNumber];
        if (!saved || typeof saved !== 'object' || Object.keys(saved).length === 0) return undefined;
        return this.#isSameTree(saved as Record<string, unknown>, tree) ? slot : undefined;
    }

    /**
     * Loads a tree that is in no slot: it is written into this slot for the time of the click, then the slot's
     * own loadout is put back. The game reads the slot at the click and loads at once, so all of it is one
     * synchronous step, and the slot is the one the game marks afterwards. The Alert (loaded, or refused) is
     * dismissed. The player's loadout mode is put back.
     * @returns false when nothing was clicked.
     */
    #loadTreeThroughSlot(slot: HTMLButtonElement, tree: HSAmbrosiaTree): boolean {
        const player = HSGlobal.exposedPlayer;
        const slotNumber = this.#getSlotNumber(slot);
        if (!player?.blueberryLoadouts || slotNumber === undefined) return false;

        const playerMode = player.blueberryLoadoutMode;
        HSAmbrosiaHelper.ensureLoadoutMode('loadTree');
        // In SAVE mode, the click would save the live tree into the slot
        if (player.blueberryLoadoutMode !== 'loadTree') return false;

        const saved = player.blueberryLoadouts[slotNumber];
        player.blueberryLoadouts[slotNumber] = { ...tree };
        try {
            HSGameDialogs.act('temporaryTree', { alert: 'dismiss' }, () => slot.click());
        } finally {
            player.blueberryLoadouts[slotNumber] = saved;
            if (playerMode === 'saveTree') HSAmbrosiaHelper.ensureLoadoutMode('saveTree');
        }
        this.#queuePersistentAmbrosiaLevelsRefresh();
        return true;
    }

    // ==============================================
    // ------ A loadout for one action's time -------
    // ==============================================

    /**
     * Runs a synchronous action with a loadout loaded, then puts the player's tree back (the timed save export).
     * The tree comes back through a slot: the one the game marks, else the one the quickbar remembers when it
     * holds exactly the live tree (the game marks none after a save load, so after every singularity). With no
     * such slot the loadout is loaded all the same and stays loaded (the user's choice).
     * Unsaved changes to the tree are kept when it can be read from the live player and the game accepts it;
     * otherwise (bookmark load, older patch) the marked slot's own loadout is loaded back.
     * The action always runs, and the player's loadout mode is put back.
     * @returns undefined when the loadout was used and the tree put back, else what happened.
     */
    runWithLoadout(loadoutSetting: string, owner: string, action: () => void): string | undefined {
        const skip = (reason: string): string => {
            action();
            return reason;
        };

        const slotId = HSAmbrosiaHelper.convertSettingLoadoutToSlot(loadoutSetting);
        const target = this.#loadoutsSlots.find(slot => slot.id === slotId) as HTMLButtonElement | undefined;
        if (!target || target.style.display === 'none') return skip(`loadout ${loadoutSetting} is locked`);

        const player = HSGlobal.exposedPlayer;
        const slotNumber = this.#getSlotNumber(target);
        const saved = slotNumber === undefined ? undefined : player?.blueberryLoadouts?.[slotNumber];
        if (player && (!saved || Object.keys(saved).length === 0)) return skip(`loadout ${loadoutSetting} is empty`);

        const liveTree = this.#readLiveTree();
        const backSlot = this.#getGameActiveSlot() ?? (liveTree ? this.#rememberedSlotHolding(liveTree) : undefined);
        // Already the loaded one
        if (backSlot === target) {
            action();
            return undefined;
        }

        // The tree is only written into a slot when the game's check (patcher) accepts it: else the slot is loaded back
        const gameValidate = (window as any).__HS_validateBlueberryTree;
        let treeToRestore: HSAmbrosiaTree | undefined;
        if (liveTree && typeof gameValidate === 'function') {
            try { if (gameValidate(liveTree) === true) treeToRestore = liveTree; } catch { treeToRestore = undefined; }
        }

        const wasSaveMode = HSAmbrosiaHelper.isLoadoutMode('saveTree');
        let result: string | undefined;
        try {
            this.#reloadLoadoutSlot(target, owner);
            if (this.#getGameActiveSlot() !== target) {
                // Refused by the game: the tree and the mark are as they were
                result = skip(`the game refused to load loadout ${loadoutSetting}`);
            } else {
                try {
                    action();
                } finally {
                    if (!backSlot) {
                        result = `loadout ${loadoutSetting} stays loaded (the game marked no loadout to come back to)`;
                    } else {
                        if (treeToRestore) this.#loadTreeThroughSlot(backSlot, treeToRestore);
                        else this.#reloadLoadoutSlot(backSlot, owner);
                        if (this.#getGameActiveSlot() !== backSlot) result = `loadout ${loadoutSetting} stays loaded (your previous loadout could not be loaded back)`;
                    }
                }
            }
        } finally {
            // In SAVE mode, the player's next slot click must still save
            if (wasSaveMode) HSAmbrosiaHelper.ensureLoadoutMode('saveTree');
        }
        return result;
    }

    /** Without the patched game, imports go through the game's import and loadout clicks: not while autosing runs. */
    #refuseGameImportDuringAutosing(): boolean {
        if (!HSModuleManager.getModule<HSAutosing>('HSAutosing')?.isAutosingActive()) return false;
        HSUI.Notify('Loadout import is unavailable while Auto-Sing runs (the game is not patched)', { notificationType: 'warning' });
        return true;
    }

    /**
     * Without the patched game (bookmarklet): imports each line through the game's tree import and reads its
     * result Alert, then saves it into its slot. Runs inside HSGameDialogs.run(), so hidden dialogs (the import's
     * success Alert, the overwrite Confirm) are left shown for it to read and answer. Several lines need SAVE mode: the game can't load an empty slot
     * (an empty tree is invalid), so load + quick save can't target one. Never while autosing runs: its loadout
     * switches would save into its slots.
     */
    async #importLinesThroughGame(lines: string[], isSingleLoadout: boolean): Promise<HSQuickImportSummary> {
        const summary: HSQuickImportSummary = { importedCount: 0, skippedCount: 0, failures: [] };
        // The real slot to reload afterwards: the game's marker, else the one the quickbar shows
        const previouslyActiveSlot = this.#shownLoadoutSlot();
        try {
            const fileInput = document.getElementById('importBlueberries') as HTMLInputElement;
            if (!fileInput) { throw new Error('Import input element not found'); }

            // A single loadout goes through the game's quick save (no mode switch).
            // Several loadouts target arbitrary slots, which still needs SAVE mode.
            if (!isSingleLoadout) {
                HSAmbrosiaHelper.ensureLoadoutMode('saveTree');
            }

            for (let i = 0; i < lines.length; i++) {
                const loadoutData = lines[i];
                // Skip empty lines
                if (!loadoutData) {
                    summary.skippedCount++;
                    continue;
                }

                const result = isSingleLoadout
                    ? await this.#importLoadoutLineToActiveSlot(loadoutData)
                    : await this.#importLoadoutLine(loadoutData, i);

                if (result.skipped) {
                    summary.skippedCount++;
                    continue;
                }
                if (!result.success) {
                    summary.failures.push({ index: i + 1, reason: result.reason ?? 'Unknown error' });
                    continue;
                }

                summary.importedCount++;
            }
        } finally {
            HSAmbrosiaHelper.ensureLoadoutMode('loadTree');
            // The imports replaced the live tree: back to the loadout that was active (a refused or failed import changed nothing)
            if (previouslyActiveSlot && summary.importedCount > 0) this.#reloadLoadoutSlot(previouslyActiveSlot);
        }
        return summary;
    }

    async #importLoadoutLine(line: string, slotIndex: number): Promise<{ success: boolean; skipped?: boolean; reason?: string }> {
        const loadoutBtn = this.#loadoutsSlots[slotIndex] as HTMLButtonElement | undefined;
        if (!loadoutBtn) {
            HSLogger.warn(`Loadout slot element for index ${slotIndex} not found`, this.context);
            return { success: false, reason: 'Loadout slot element not found' };
        }

        const importResult = await this.#importTreeFromLine(line);
        if (!importResult.success) return importResult;

        // Import succeeded -> now click the loadout button to save into the slot
        loadoutBtn.click();
        await HSAmbrosia.#acceptOverwriteConfirm();

        return { success: true };
    }

    /**
     * Import a loadout into the slot the quickbar shows (#shownLoadoutSlot), as with the patched game. The game's
     * import loads the tree, then it is saved into the slot, which the game then marks. With the game's own mark,
     * through #blueberryQuickSave, without touching the loadout mode. Without one (the quick save only saves into
     * the marked slot), or without the quick save button: SAVE mode and a click on the slot.
     * Refused when the quickbar shows none.
     */
    async #importLoadoutLineToActiveSlot(line: string): Promise<{ success: boolean; skipped?: boolean; reason?: string }> {
        const gameActiveSlot = this.#getGameActiveSlot();
        const targetSlot = this.#shownLoadoutSlot();
        if (!targetSlot) return { success: false, reason: HSAmbrosia.#NO_ACTIVE_LOADOUT_REASON };
        const quickSaveBtn = document.getElementById('blueberryQuickSave') as HTMLButtonElement | null;

        if (!quickSaveBtn || targetSlot !== gameActiveSlot) {
            HSAmbrosiaHelper.ensureLoadoutMode('saveTree');
            try {
                return await this.#importLoadoutLine(line, this.#loadoutsSlots.indexOf(targetSlot));
            } finally {
                HSAmbrosiaHelper.ensureLoadoutMode('loadTree');
            }
        }

        const importResult = await this.#importTreeFromLine(line);
        if (!importResult.success) return importResult;

        quickSaveBtn.click();
        await HSAmbrosia.#acceptOverwriteConfirm();

        // No slot click happened, so sync our active loadout with the game's
        this.updateActiveLoadout(HSAmbrosiaHelper.getSlotEnumBySlotId(targetSlot.id));

        return { success: true };
    }

    /** Feed a loadout line to the game's tree import and wait for its result alert. */
    async #importTreeFromLine(line: string): Promise<{ success: boolean; reason?: string }> {
        const fileInput = document.getElementById('importBlueberries') as HTMLInputElement | null;
        if (!fileInput) {
            throw new Error('Import input element not found');
        }

        // Resolved before the import so the alert check below doesn't wait on a fetch
        const successText = await HSUtils.getGameTranslation('ambrosia.importTree.success');

        const normalizedLine = HSAmbrosia.#normalizeQuickImportLoadout(line);
        const blob = new Blob([normalizedLine], { type: 'application/json' });
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
        for (let attempt = 0; attempt < 50; attempt++) {
            const alertWrapper = document.getElementById('alertWrapper');
            if (alertWrapper && alertWrapper.style.display === 'block') {
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

                for (let clearWait = 0; clearWait < 20; clearWait++) {
                    await HSUtils.sleep(5);
                    const currentAlertWrapper = document.getElementById('alertWrapper');
                    if (!currentAlertWrapper || currentAlertWrapper.style.display !== 'block') {
                        break;
                    }
                    const retryOkAlert = document.getElementById('ok_alert') as HTMLButtonElement | null;
                    if (retryOkAlert) retryOkAlert.click();
                }
                break;
            }
            await HSUtils.sleep(5);
        }

        // Match the game's success message in the player's language (English kept as fallback)
        const normalizedAlert = alertText.toLowerCase();
        const isSuccess = [successText, 'Tree successfully imported']
            .some(text => !!text && normalizedAlert.includes(text.trim().toLowerCase()));
        if (!isSuccess) {
            try {
                // Clear the file input to avoid residual state
                fileInput.files = new DataTransfer().files;
            } catch { /* ignore */ }
            return { success: false, reason: alertText || 'Unknown error' };
        }

        // The game applied the imported tree (no slot click involved)
        this.#queuePersistentAmbrosiaLevelsRefresh();

        return { success: true };
    }

    /** Wait for the game's overwrite confirm dialog and click OK; keep clicking until dismissed. */
    static async #acceptOverwriteConfirm(): Promise<void> {
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
                    if (retryOkConfirm) retryOkConfirm.click();
                }
                break;
            }
            await HSUtils.sleep(5);
        }
    }

    public async importLoadoutToActiveSlot(loadout: string): Promise<{ success: boolean; skipped?: boolean; reason?: string }> {
        try {
            let result: { success: boolean; skipped?: boolean; reason?: string };
            // Named in the notification: the shown slot can be a guess, a wrong one is seen at once
            const shownSlot = this.#shownLoadoutSlot();
            const slotNumber = shownSlot ? this.#getSlotNumber(shownSlot) : undefined;
            if (HSGlobal.exposedPlayer) {
                const summary = this.#importLinesDirect([loadout.trim()], true);
                result = summary.importedCount > 0
                    ? { success: true }
                    : { success: false, reason: summary.failures[0]?.reason ?? 'Empty loadout' };
            } else {
                if (this.#refuseGameImportDuringAutosing()) return { success: false, reason: 'Auto-Sing is running' };
                result = await HSGameDialogs.run('quickImport', { timeLimitMs: HSAmbrosia.#GAME_IMPORT_TIME_LIMIT_MS },
                    () => this.#importLoadoutLineToActiveSlot(loadout));
            }
            if (!result.success) {
                HSLogger.warn(`importLoadoutToActiveSlot failed: ${JSON.stringify({ source: 'importLoadoutToActiveSlot', reason: result.reason })}`, this.context);
                HSUI.Notify(`Failed to import loadout${result.reason ? `: ${result.reason}` : ''}`, { position: 'top', notificationType: 'error' });
                return result;
            }

            HSUI.Notify(slotNumber !== undefined ? `Loadout imported to slot ${slotNumber}.` : 'Loadout imported.', { position: 'top', notificationType: 'success' });
            return result;
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            HSLogger.error(`importLoadoutToActiveSlot exception: ${JSON.stringify({ source: 'importLoadoutToActiveSlot', loadoutPreview: loadout.slice(0, 180) })} ${message}`, this.context);
            HSUI.Notify('Failed to import loadout.', { position: 'top', notificationType: 'error' });
            return { success: false, reason: message };
        }
    }


    // ==============================================
    // -------- AFK/Idle Swapper & Game Data --------
    // ==============================================

    /* RETIRED: Ambrosia AFK/idle swapper lifecycle and caches.
    async enableIdleSwap() {
        HSLogger.debug(() => 'Enabling Ambrosia Idle Swap', this.context);

        this.#isIdleSwapEnabled = true;
        this.#cachedNormalLuckBlueBarRequired = undefined;
        this.#cachedNormalLuckLoadoutValue = undefined;
        this.#initIdleSwapSettingsCache();

        if (this.#isAmbrosiaTabActive) {
            await this.#activateIdleSwap();
        }

        if (!this.#debugElement)
            this.#debugElement = document.querySelector('#hs-panel-debug-gamedata-currentambrosia') as HTMLDivElement;
    }

    async #activateIdleSwap(): Promise<void> {
        if (!this.#isIdleSwapEnabled || this.#isIdleSwapActive || !this.#isAmbrosiaTabActive) return;

        this.#blueAmbrosiaProgressBar = await HSElementHooker.HookElement('#ambrosiaProgressBar') as HTMLDivElement;
        this.#redAmbrosiaProgressBar = await HSElementHooker.HookElement('#pixelProgressBar') as HTMLDivElement;
        this.#cacheIdleSwapLoadoutButtons();
        this.#isIdleSwapActive = true;
        this.#maybeInsertIdleLoadoutIndicator();
        this.subscribeGameDataChanges();

        if (!this.#debugElement)
            this.#debugElement = document.querySelector('#hs-panel-debug-gamedata-currentambrosia') as HTMLDivElement;
    }

    disableIdleSwap() {
        this.#isIdleSwapEnabled = false;
        this.#deactivateIdleSwap();
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
    }

    #deactivateIdleSwap() {
        if (!this.#isIdleSwapActive) return;

        this.#isIdleSwapActive = false;
        this.#holdBlueLuckUntilReset = false;
        this.#lastBlueBarValue = undefined;
        this.#cachedNormalLuckBlueBarRequired = undefined;
        this.#cachedNormalLuckLoadoutValue = undefined;
        this.#removeIdleLoadoutIndicator();
        this.unsubscribeGameDataChanges();
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
    */

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
            // Only actually unsubscribe if the remaining minibar feature does not need game data.
            // RETIRED condition also checked: !this.#isIdleSwapActive
            if (!this.#berryMinibarsEnabled && !this.#isAmbrosiaTabActive) {
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

        this.#refreshPersistentAmbrosiaLevelsOnTreeChange(gameData);
        this.#refreshBarIncomeOnGameData();

        if (this.#berryMinibarsEnabled) {
            this.#updateBerryMinibars(gameData, gameDataAPI);
        }

        if (gameData.blueberryTime != null && gameData.redAmbrosiaTime != null) {
            const blueAmbrosiaBarValue = gameData.blueberryTime;
            const redAmbrosiaBarValue = gameData.redAmbrosiaTime;
            const blueAmbrosiaBarMax = gameDataAPI.ambrosia.calculateRequiredBlueberryTime();
            const redAmbrosiaBarMax = gameDataAPI.ambrosia.calculateRequiredRedAmbrosiaTime();
            const blueAmbrosiaPercent = ((blueAmbrosiaBarValue / blueAmbrosiaBarMax) * 100);
            const redAmbrosiaPercent = ((redAmbrosiaBarValue / redAmbrosiaBarMax) * 100);

            /* RETIRED: Ambrosia AFK/idle swapper evaluation.
            if (this.#isIdleSwapActive) {
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
            */
        }
    };

    #updateBerryMinibars(gameData?: GameData, gameDataAPI?: HSGameDataAPI) {
        if (!this.#berryMinibarsEnabled) {
            HSLogger.logOnce('HSAmbrosia.gameDataCallback() - berryMinibarsEnabled was false', 'hs-minibars-false');
            return;
        }

        gameDataAPI ??= this.#cachedGameDataAPI
            ?? HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        gameData ??= gameDataAPI?.getGameData();

        // Enabling the quickbar can precede the first save-data refresh.
        // The subscription will render the bars as soon as data arrives.
        if (!gameDataAPI || !gameData) return;

        if (this.#blueProgressMinibarElement && this.#redProgressMinibarElement) {
            const blueRequirement = gameDataAPI.ambrosia.calculateRequiredBlueberryTime();
            const redRequirement = gameDataAPI.ambrosia.calculateRequiredRedAmbrosiaTime();
            const blueProgress = blueRequirement > 0
                ? Math.min(1, Math.max(0, gameData.blueberryTime / blueRequirement))
                : 0;
            const redProgress = redRequirement > 0
                ? Math.min(1, Math.max(0, gameData.redAmbrosiaTime / redRequirement))
                : 0;

            // These are the same save values and requirement formulas used by the
            // game, so they continue updating even when its bar elements are stale.
            this.#blueProgressMinibarElement.style.transform = `scaleX(${blueProgress})`;
            this.#redProgressMinibarElement.style.transform = `scaleX(${redProgress})`;
        } else {
            HSLogger.warnOnce(`
        HSAmbrosia.gameDataCallback() - progress data or minibar element(s) undefined.
            game data: ${gameData},
            game data API: ${gameDataAPI},
            minibar blue: ${this.#blueProgressMinibarElement},
            minibar red: ${this.#redProgressMinibarElement} `, 'hs-minibars-undefined');
        }

        const purpleTabLabel = document.querySelector<HTMLElement>('[i18n="tabs.singularity.purple"]');
        const purpleTabButton = purpleTabLabel?.closest('button')
            ?? document.getElementById('toggleSingularitySubTab6');
        const purpleUnlocked = purpleTabButton instanceof HTMLElement
            && !purpleTabButton.hidden
            && purpleTabButton.getAttribute('aria-hidden') !== 'true'
            && getComputedStyle(purpleTabButton).display !== 'none';

        if (this.#purpleProgressMinibarBarElement) {
            this.#purpleProgressMinibarBarElement.style.display = purpleUnlocked ? 'block' : 'none';
        }
        if (!purpleUnlocked) return;

        const purpleData = gameData as (GameData & { purpleHoneyProgress?: number }) | undefined;
        if (gameDataAPI && purpleData?.purpleHoneyProgress != null && this.#purpleProgressMinibarElement) {
            const purpleRequirement = gameDataAPI.ambrosia.calculatePurpleHoneyConversionFactor();
            const progress = purpleRequirement > 0
                ? Math.min(1, Math.max(0, purpleData.purpleHoneyProgress / purpleRequirement))
                : 0;
            this.#purpleProgressMinibarElement.style.setProperty('--progress-fill', String(progress));
        } else {
            HSLogger.warnOnce(`
        HSAmbrosia.gameDataCallback() - purple progress data or minibar element undefined.
            progress: ${purpleData?.purpleHoneyProgress},
            minibar: ${this.#purpleProgressMinibarElement} `, 'hs-purple-minibar-undefined');
        }
    }

    /* RETIRED: Ambrosia AFK/idle loadout selection and indicator.
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
        const isKnownSwapLoadout =
            this.activeLoadout === octeractLoadout
            || this.activeLoadout === normalLuckLoadout
            || this.activeLoadout === redLuckLoadout;

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
        } else if (!isKnownSwapLoadout) {
            targetLoadout = octeractLoadout;
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
                HSAmbrosiaHelper.ensureLoadoutMode('loadTree');
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
    */
}
