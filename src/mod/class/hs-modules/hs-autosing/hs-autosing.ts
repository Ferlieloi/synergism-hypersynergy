import { HSGameDataSubscriber } from "../../../types/hs-types";
import Decimal from "break_infinity.js";
import { HSGameData } from "../../hs-core/gds/hs-gamedata";
import { HSModuleManager } from "../../hs-core/module/hs-module-manager";
import { HSGameDataAPI } from "../../hs-core/gds/hs-gamedata-api";
import { HSModule } from "../../hs-core/module/hs-module";
import { HSLogger } from "../../hs-core/hs-logger";
import { HSUI } from "../../hs-core/hs-ui";
import { HSSettings } from "../../hs-core/settings/hs-settings";
import { HSNumericSetting } from "../../hs-core/settings/hs-setting";
import { HSUtils } from "../../hs-utils/hs-utils";
import { HSAutosingStrategy, GetFromDOMOptions, PhaseOption, phases, AutosingStrategyPhase, SPECIAL_ACTIONS, createDefaultAoagPhase, AOAG_PHASE_ID, AOAG_PHASE_NAME, LOADOUT_ACTION_VALUE, IF_JUMP_VALUE, ALLOWED } from "../../../types/module-types/hs-autosing-types";
import { HSAutosingModal } from "./hs-autosingModal";
import { HSGlobal } from "../../hs-core/hs-global";
import { HSGameState, MainView } from "../../hs-core/hs-gamestate";
import { HSAutosingSettingsFixer } from './hs-autosingSettingsFixer';
import { HSAutosingCorruption, CORRUPTION_NAMES, ZERO_CORRUPTIONS, ANT_CORRUPTIONS } from './hs-autosingCorruption';

const SPECIAL_ACTION_LABEL_BY_ID = new Map<number, string>(SPECIAL_ACTIONS.map((a) => [a.value, a.label] as const));
const STAGE_REGEX = /Current Game Section:\s*(.+)/;
const ALLOWED_REGEX = new RegExp(ALLOWED.join('|'));

type ChallengeAccessor = {
    button?: HTMLButtonElement;
    levelElement?: HTMLParagraphElement;
    isActive: () => boolean;
    getLevelText: () => string;
    getCompletions: () => Decimal;
    getGoal: () => Decimal;
};

/**
 * Class: HSAutosing
 * IsExplicitHSModule: Yes
 * Description: Hypersynergism module that performs autosings.
 * Author: XxMolkxX
 */
export class HSAutosing extends HSModule implements HSGameDataSubscriber {
    gameDataSubscriptionId?: string;

    static readonly #DECIMAL_INFINITY = new Decimal(Infinity);
    static readonly #DECIMAL_9999 = new Decimal(9999);
    static readonly #DECIMAL_0 = new Decimal(0);
    #gameDataAPI?: HSGameDataAPI;
    #gameDataResolver?: (value: void) => void;

    #corruptionManager!: HSAutosingCorruption;

    #strategy?: HSAutosingStrategy;
    #autosingEnabled = false;
    #targetSingularity = 0;
    #sleepTime = 10;
    #prevActionTime: number = 0;
    #stopAtSingularitysEnd: boolean = false;
    #hasWarnedMissingStageFunc: boolean = false;
    #storedC15: Decimal = HSAutosing.#DECIMAL_0;
    #challengeAccessors: Record<number, ChallengeAccessor> = {};
    #hsSettingsToRestore: string[] = [];
    #previousQuarkAmount: number = 0;
    #previousGoldenQuarkAmount: number = 0;

    // DOM Elements - Settings & UI
    #settingsTab!: HTMLButtonElement;
    #settingsSubTab!: HTMLButtonElement;
    #misc!: HTMLButtonElement;
    #stage!: HTMLParagraphElement;

    // DOM Elements - Challenges
    #challengeButtons: Record<number, HTMLButtonElement> = {};
    #levelElements: Record<number, HTMLParagraphElement> = {};

    // DOM Elements - Challenge Actions
    #exitTranscBtn!: HTMLButtonElement;
    #exitReincBtn!: HTMLButtonElement;
    #exitAscBtn!: HTMLButtonElement;
    #ascendBtn!: HTMLButtonElement;

    // DOM Elements - Elevator & Navigation
    #elevatorTeleportButton!: HTMLButtonElement;
    #elevatorInput!: HTMLInputElement;

    // DOM Elements - Auto Toggles
    #autoChallengeButton!: HTMLButtonElement;
    #autoAntSacrificeButton!: HTMLButtonElement;
    #autoAscendButton!: HTMLButtonElement;

    // DOM Elements - Heptract Auto-Buy
    #chronosHeptAutoBuyBtn!: HTMLButtonElement;
    #hyperHeptAutoBuyBtn!: HTMLButtonElement;
    #quarkHeptAutoBuyBtn!: HTMLButtonElement;
    #challHeptAutoBuyBtn!: HTMLButtonElement;
    #abyssHeptAutoBuyBtn!: HTMLButtonElement;
    #accelHeptAutoBuyBtn!: HTMLButtonElement;
    #boostHeptAutoBuyBtn!: HTMLButtonElement;
    #multHeptAutoBuyBtn!: HTMLButtonElement;
    #orbsAutoBuyBtn!: HTMLButtonElement;

    // DOM Elements - Ambrosia Loadouts
    #ambrosia_early_cube!: HTMLButtonElement;
    #ambrosia_late_cube!: HTMLButtonElement;
    #ambrosia_quark!: HTMLButtonElement;
    #ambrosia_obt!: HTMLButtonElement;
    #ambrosia_off!: HTMLButtonElement;
    #ambrosia_luck!: HTMLButtonElement;

    // DOM Elements - Misc
    #antSacrifice!: HTMLButtonElement;
    #coin!: HTMLButtonElement;
    #AOAG!: HTMLButtonElement;
    #exalt2Btn!: HTMLButtonElement;
    #exaltTimer!: HTMLSpanElement;
    #saveType!: HTMLInputElement;
    #exportBtn!: HTMLButtonElement;
    #exportBtnClone?: HTMLButtonElement;
    #addCodeAllBtn!: HTMLButtonElement;
    #timeCodeBtn!: HTMLButtonElement;

    // DOM Elements - Antiquities
    #antiquitiesRuneLockedContainer!: HTMLDivElement;

    // State Management
    #endStageDone: boolean = false;
    #observerActivated: boolean = false;
    #endStagePromise?: Promise<void>;
    #endStageResolve?: () => void;
    #antiquitiesObserver?: MutationObserver;

    // Module References
    #stageFunc?: (arg0: number) => any;
    #gamestate!: HSGameState;

    #autosingModal?: HSAutosingModal;

    // Strategy Caches
    readonly #phaseIndexByOption = new Map<PhaseOption, number>(phases.map((p, i) => [p, i] as const));
    #strategyPhaseRanges?: Array<{ phase: AutosingStrategyPhase; startIndex: number; endIndex: number }>;
    #finalPhaseConfig?: AutosingStrategyPhase;

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    init(): Promise<void> {
        HSLogger.log(`Initializing HSAutosing module`, this.context);

        this.#autosingEnabled = false;
        this.#targetSingularity = 0;
        this.#cacheSettingsElements();
        this.#cacheChallengeElements();
        this.#cacheButtonElements();
        this.#cacheHeptractButtons();
        this.#cacheCorruptionElements();
        this.#cacheMiscElements();

        this.isInitialized = true;
        HSLogger.log(`HSAutosing module initialized`, this.context);
        return Promise.resolve();
    }

    #cacheSettingsElements(): void {
        this.#settingsTab = document.getElementById('settingstab') as HTMLButtonElement;
        this.#settingsSubTab = document.getElementById('switchSettingSubTab4') as HTMLButtonElement;
        this.#misc = document.getElementById('kMisc') as HTMLButtonElement;
        this.#stage = document.getElementById('gameStageStatistic') as HTMLParagraphElement;
    }

    #cacheChallengeElements(): void {
        for (let i = 1; i <= 15; i++) {
            const btn = document.getElementById(`challenge${i}`) as HTMLButtonElement;
            if (btn) this.#challengeButtons[i] = btn;

            const el = document.getElementById(`challenge${i}level`) as HTMLParagraphElement;
            if (el) this.#levelElements[i] = el;
        }
        this.#buildChallengeAccessors();
    }

    #cacheButtonElements(): void {
        this.#exitTranscBtn = document.getElementById('challengebtn') as HTMLButtonElement;
        this.#exitReincBtn = document.getElementById('reincarnatechallengebtn') as HTMLButtonElement;
        this.#exitAscBtn = document.getElementById('ascendChallengeBtn') as HTMLButtonElement;
        this.#ascendBtn = document.getElementById('ascendbtn') as HTMLButtonElement;
        this.#autoChallengeButton = document.getElementById('toggleAutoChallengeStart') as HTMLButtonElement;
        this.#autoAntSacrificeButton = document.getElementById('toggleAutoSacrificeAnt') as HTMLButtonElement;
        this.#autoAscendButton = document.getElementById('ascensionAutoEnable') as HTMLButtonElement;
        this.#antSacrifice = document.getElementById(`antSacrifice`) as HTMLButtonElement;
        this.#coin = document.getElementById('buycoin1') as HTMLButtonElement;
        this.#AOAG = document.getElementById('antiquitiesRuneSacrifice') as HTMLButtonElement;
        this.#exalt2Btn = document.getElementById('oneChallengeCap') as HTMLButtonElement;
        this.#exaltTimer = document.getElementById('ascSingChallengeTimeTakenStats') as HTMLSpanElement;
        this.#elevatorTeleportButton = document.getElementById('elevatorTeleportButton') as HTMLButtonElement;
        this.#elevatorInput = document.getElementById('elevatorTargetInput') as HTMLInputElement;
    }

    #cacheHeptractButtons(): void {
        this.#chronosHeptAutoBuyBtn = document.getElementById('chronosHepteractAuto') as HTMLButtonElement;
        this.#hyperHeptAutoBuyBtn = document.getElementById('hyperrealismHepteractAuto') as HTMLButtonElement;
        this.#quarkHeptAutoBuyBtn = document.getElementById('quarkHepteractAuto') as HTMLButtonElement;
        this.#challHeptAutoBuyBtn = document.getElementById('challengeHepteractAuto') as HTMLButtonElement;
        this.#abyssHeptAutoBuyBtn = document.getElementById('abyssHepteractAuto') as HTMLButtonElement;
        this.#accelHeptAutoBuyBtn = document.getElementById('acceleratorHepteractAuto') as HTMLButtonElement;
        this.#boostHeptAutoBuyBtn = document.getElementById('acceleratorBoostHepteractAuto') as HTMLButtonElement;
        this.#multHeptAutoBuyBtn = document.getElementById('multiplierHepteractAuto') as HTMLButtonElement;
        this.#orbsAutoBuyBtn = document.getElementById('hepteractToQuarkTradeAuto') as HTMLButtonElement;
    }

    #cacheCorruptionElements(): void {
        this.#addCodeAllBtn = document.getElementById("addCodeAll") as HTMLButtonElement;
        this.#timeCodeBtn = document.getElementById("timeCode") as HTMLButtonElement;

        const corrNext: Record<string, HTMLElement | null> = {};
        CORRUPTION_NAMES.forEach(name => {
            corrNext[name] = document.getElementById(`corrNext${name}`);
        });

        this.#corruptionManager = new HSAutosingCorruption(
            corrNext,
            document.getElementById('corruptionStats'),
            document.getElementById('prompt_text') as HTMLInputElement,
            document.getElementById('ok_prompt') as HTMLButtonElement,
            document.querySelector('#corruptionLoadoutTable button.corrImport') as HTMLButtonElement
        );
    }

    #cacheMiscElements(): void {
        this.#endStageDone = false;
        this.#observerActivated = false;
        this.#stageFunc = (window as any).__HS_synergismStage;
        this.#antiquitiesRuneLockedContainer = document.getElementById('antiquitiesRuneLockedContainer') as HTMLDivElement;
        this.#gamestate = HSModuleManager.getModule<HSGameState>("HSGameState") as HSGameState;
        this.#saveType = document.getElementById('saveType') as HTMLInputElement;
        this.#exportBtn = document.getElementById('exportgame') as HTMLButtonElement;
        this.#exportBtnClone = this.#exportBtn ? (this.#exportBtn.cloneNode(true) as HTMLButtonElement) : undefined;

        if (this.#exportBtnClone && (window as any).__HS_EXPORT_EXPOSED) {
            this.#setupExportButtonClone();
        }
    }

    #setupExportButtonClone(): void {
        this.#exportBtnClone!.addEventListener(
            'click',
            () => {
                const hasExportHook = Object.prototype.hasOwnProperty.call(window, "__HS_exportData")
                    && typeof (window as any).__HS_exportData !== "undefined";
                if (!hasExportHook) return;

                const exportBackup = (window as any).__HS_exportData;
                (window as any).__HS_exportData = undefined;
                window.setTimeout(() => {
                    (window as any).__HS_exportData = exportBackup;
                }, 100);
            },
            true
        );
    }

    // ============================================================================
    // PUBLIC API
    // ============================================================================

    isAutosingEnabled(): boolean {
        return this.#autosingEnabled;
    }

    setStopAtSingularitysEnd(value: boolean): void {
        this.#stopAtSingularitysEnd = value;
    }

    getStopAtSingularitysEnd(): boolean {
        return this.#stopAtSingularitysEnd;
    }

    // ============================================================================
    // GAME DATA SUBSCRIPTION
    // ============================================================================

    subscribeGameDataChanges(): void {
        const gameDataMod = HSModuleManager.getModule<HSGameData>('HSGameData');
        if (gameDataMod && !this.gameDataSubscriptionId) {
            this.gameDataSubscriptionId = gameDataMod.subscribeGameDataChange(this.gameDataCallback.bind(this));
            HSLogger.log('Subscribed to game data changes for autosing', this.context);
        }
    }

    unsubscribeGameDataChanges(): void {
        const gameDataMod = HSModuleManager.getModule<HSGameData>('HSGameData');
        if (gameDataMod && this.gameDataSubscriptionId) {
            gameDataMod.unsubscribeGameDataChange(this.gameDataSubscriptionId);
            this.gameDataSubscriptionId = undefined;
            HSLogger.log('Unsubscribed from game data changes for autosing', this.context);
        }
    }

    gameDataCallback(): Promise<void> {
        if (this.#gameDataResolver) {
            this.#gameDataResolver();
            this.#gameDataResolver = undefined;
        }
        return Promise.resolve();
    }

    // ============================================================================
    // ENABLE / DISABLE AUTOSING
    // ============================================================================

    async enableAutoSing(): Promise<void> {
        if (!HSGlobal.General.isModFullyLoaded) {
            HSUI.Notify("Hypersynergism is still loading. Please wait before starting Auto-Sing.", { notificationType: "warning" });
            this.stopAutosing();
            return;
        }

        if (this.#isInExalt()) {
            HSUI.Notify("Cannot start Auto-Sing while inside a singularity challenge.", { notificationType: "warning" });
            this.stopAutosing();
            return;
        }

        this.#autosingEnabled = true;
        this.#stopAtSingularitysEnd = false;
        this.#endStagePromise = undefined;

        if (!await this.#validateAutosingSetup()) {
            this.stopAutosing();
            return;
        }

        this.#gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        await this.#gameDataAPI?.prepareForAutosing(); 
        const gameData = await this.#gameDataAPI?.getForcedGameData(); 

        if (!await this.#validateSingularityRequirements(gameData)) {
            this.stopAutosing();
            return;
        }

        const strategy = await this.#loadStrategy();
        if (!strategy) {
            this.stopAutosing();
            return;
        }

        this.#strategy = strategy;
        this.#rebuildStrategyPhaseCaches();
        this.#corruptionManager.buildLoadoutCache(this.#strategy?.corruptionLoadouts ?? []);

        await this.#loadAmbrosiaLoadoutButtons();

        HSLogger.log(`Autosing enabled for target singularity: ${this.#targetSingularity}`, this.context);

        this.#autosingModal?.destroy();
        this.#autosingModal = new HSAutosingModal();

        this.#hsSettingsToRestore = await HSAutosingSettingsFixer.fixAllSettings();

        this.#performAutosingLogic();
    }

    public stopAutosing(options?: { showReviewModal?: boolean }): void {
        if (!this.#autosingEnabled) { return; }
        const showReviewModal = options?.showReviewModal ?? false;

        this.#stopAutosingCore({
            modalDisposition: showReviewModal ? 'review' : 'destroy'
        });

        const autosingSetting = HSSettings.getSetting("startAutosing");
        if (autosingSetting && autosingSetting.isEnabled()) {
            autosingSetting.disable();
        }
        HSAutosingSettingsFixer.restoreUnwantedSettings(this.#hsSettingsToRestore);

        HSLogger.log(`Autosing stopped.`, this.context);
    }

    #stopAutosingCore(options: { modalDisposition: 'review' | 'destroy' }): void {
        this.#autosingEnabled = false;
        this.#saveType.checked = false;
        this.unsubscribeGameDataChanges();
        this.#antiquitiesObserver?.disconnect();
        this.#antiquitiesObserver = undefined;

        if (this.#endStageResolve) {
            try {
                this.#endStageResolve();
            } catch (e) {
                /* ignore */
            }
            this.#endStageResolve = undefined;
        }

        this.#endStagePromise = undefined;

        if (this.#autosingModal) {
            if (options.modalDisposition === 'review') {
                this.#autosingModal.enterReviewMode();
            } else {
                this.#autosingModal.destroy();
                this.#autosingModal = undefined;
            }
        }

        HSUtils.stopDialogWatcher();
    }

    public closeAutosingModalAfterReview(): void {
        if (this.#autosingModal) {
            this.#autosingModal.destroy();
            this.#autosingModal = undefined;
        }
    }

    async #validateAutosingSetup(): Promise<boolean> {
        HSUtils.startDialogWatcher();

        const quickbarSetting = HSSettings.getSetting('ambrosiaQuickBar');
        if (quickbarSetting && !quickbarSetting.isEnabled()) {
            HSLogger.log("Autosing requirement: Enabling Ambrosia Quick Bar now.", this.context);
            quickbarSetting.enable();
        }

        const singularitySetting = HSSettings.getSetting('singularityNumber') as HSNumericSetting;
        this.#targetSingularity = singularitySetting.getValue();

        return true;
    }

    async #validateSingularityRequirements(gameData: any): Promise<boolean> {
        if (!gameData) {
            HSLogger.warn("Could not get game data", this.context);
            return false;
        }

        if (gameData.highestSingularityCount < 40) {
            confirm(`AutoSing is an end-game QoL feature. S256+ is expected. Not available until you unlock EXALT2.`);
            return false;
        }

        if (gameData.highestSingularityCount < 216) {
            if (!confirm(`AutoSing is not fully functional until you completed EXALT6 at least once.`)) {
                return false;
            }
            HSUI.Notify("You acknowledged that your highest sing is too low.", { popDuration: 10000, notificationType: "warning" });
        }

        if (this.#targetSingularity > gameData.highestSingularityCount) {
            HSLogger.log(`Target singularity bigger than highest. Going to highest.`);
            this.#targetSingularity = gameData.highestSingularityCount;
        }

        return true;
    }

    async #loadStrategy(): Promise<HSAutosingStrategy | null> {
        const strategySetting = HSSettings.getSetting("autosingStrategy");
        const selectedValue = strategySetting.getValue();
        const control = strategySetting.getDefinition().settingControl;

        if (!control?.selectOptions) {
            HSUI.Notify("Strategy selector not available - Autosing stopped.", { notificationType: "warning" });
            this.stopAutosing();
            return null;
        }

        const selectedOption = control.selectOptions.find(
            opt => opt.value.toString() === HSUtils.asString(selectedValue)
        );

        if (!selectedOption) {
            HSUI.Notify("Selected strategy not found - Autosing stopped.", { notificationType: "warning" });
            this.stopAutosing();
            return null;
        }

        const defaultNames = HSSettings.getDefaultStrategyNames();
        const selectedRawName = selectedOption.value.toString();
        let strategy: HSAutosingStrategy | null = null;

        if (defaultNames.includes(selectedRawName)) {
            strategy = await HSSettings.loadDefaultStrategyByName(selectedRawName);
        } else {
            const strategies = HSSettings.getStrategies();
            strategy = strategies.find(s => s.strategyName === selectedRawName) || null;
        }

        if (!strategy) {
            HSLogger.warn(`Strategy "${selectedRawName}" not found or failed to load.`, this.context);
            HSUI.Notify("Could not find or load strategy - Autosing stopped.", { notificationType: "warning" });
            this.stopAutosing();
            return null;
        }

        const runtimeStrategy: HSAutosingStrategy = JSON.parse(JSON.stringify(strategy));
        // MIGRATION NEXT STEP - This should not be needed anymore (except if users click the migrate button). To be removed.
        // Migrate to new IDs in-memory only — this copy is never persisted.
        HSSettings.migrateStrategyActionIdsAuto(runtimeStrategy, 'toNew');
        HSLogger.log(`Loaded strategy "${selectedRawName}" (migrated to runtime IDs in-memory)`, this.context);

        return runtimeStrategy;
    }

    async #loadAmbrosiaLoadoutButtons(): Promise<void> {
        const earlyCubeVal = HSSettings.getSetting("autosingEarlyCubeLoadout").getValue();
        const lateCubeVal = HSSettings.getSetting("autosingLateCubeLoadout").getValue();
        const quarkVal = HSSettings.getSetting("autosingQuarkLoadout").getValue();
        const obtVal = HSSettings.getSetting("autosingObtLoadout").getValue();
        const offVal = HSSettings.getSetting("autosingOffLoadout").getValue();
        const ambrosiaVal = HSSettings.getSetting("autosingAmbrosiaLoadout").getValue();

        const ambPrefix = HSGlobal.HSAmbrosia.quickBarLoadoutIdPrefix;
        this.#ambrosia_early_cube = document.getElementById(`${ambPrefix}-blueberryLoadout${earlyCubeVal}`) as HTMLButtonElement;
        this.#ambrosia_late_cube = document.getElementById(`${ambPrefix}-blueberryLoadout${lateCubeVal}`) as HTMLButtonElement;
        this.#ambrosia_quark = document.getElementById(`${ambPrefix}-blueberryLoadout${quarkVal}`) as HTMLButtonElement;
        this.#ambrosia_obt = document.getElementById(`${ambPrefix}-blueberryLoadout${obtVal}`) as HTMLButtonElement;
        this.#ambrosia_off = document.getElementById(`${ambPrefix}-blueberryLoadout${offVal}`) as HTMLButtonElement;
        this.#ambrosia_luck = document.getElementById(`${ambPrefix}-blueberryLoadout${ambrosiaVal}`) as HTMLButtonElement;

        if (!this.#ambrosia_early_cube || !this.#ambrosia_late_cube || !this.#ambrosia_quark || !this.#ambrosia_obt || !this.#ambrosia_off || !this.#ambrosia_luck) {
            HSLogger.warn("Required Ambrosia loadout buttons missing.", this.context);
            HSUI.Notify("Could not find all required Ambrosia loadout buttons - Autosing stopped.", { notificationType: "warning" });
            this.stopAutosing();
            throw new Error("Missing ambrosia loadout buttons");
        }
    }

    // ============================================================================
    // MAIN AUTOSING LOGIC
    // ============================================================================

    async #performAutosingLogic(): Promise<void> {
        this.#ambrosia_luck.click();
        await this.#useAddAndTimeCodes();

        try {
            if (this.#autosingModal) {
                const { HSQuickbarManager } = await import("../hs-qolQuickbarManager");
                await HSQuickbarManager.getInstance().whenSectionInjected('ambrosia');
                const gameData = await this.#gameDataAPI?.getLatestAutosingData() ?? { quarks: 0, goldenQuarks: 0 };
                this.#autosingModal.start(this.#strategy!, gameData.quarks, gameData.goldenQuarks);
                this.#autosingModal.show();
            }

            await this.#performSingularity(true);

            while (this.isAutosingEnabled()) {
                if (this.#endStageDone || this.#observerActivated) {
                    await this.#endStagePromise;
                    continue;
                }

                while (this.isAutosingEnabled() && !this.#endStageDone && !this.#observerActivated) {
                    const stage = await this.#getStage();
                    await this.#matchStageToStrategy(stage);
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            HSLogger.warn(`Error during autosing logic: ${errorMessage}`, this.context);
            this.stopAutosing();
        }
    }

    async #matchStageToStrategy(stage: string | null): Promise<void> {
        if (!stage || !this.#strategy) return;

        if (!this.#strategyPhaseRanges) this.#rebuildStrategyPhaseCaches();

        let phaseConfig: AutosingStrategyPhase | null = null;
        let stageStart: PhaseOption | null = null;
        let stageEnd: PhaseOption | null = null;

        if (stage === 'final') {
            phaseConfig = this.#finalPhaseConfig ?? null;
            if (!phaseConfig) {
                HSLogger.warn("No final phase found in strategy - Autosing stopped.", this.context);
                this.stopAutosing();
                return;
            }

            await this.#executePhase(phaseConfig);
            return;
        }

        // Find the unique dash split where both sides are valid PhaseOptions
        for (let dashIndex = stage.indexOf('-'); dashIndex !== -1; dashIndex = stage.indexOf('-', dashIndex + 1)) {
            const startCandidate = stage.slice(0, dashIndex);
            const endCandidate = stage.slice(dashIndex + 1);

            if (this.#isPhaseOption(startCandidate) && this.#isPhaseOption(endCandidate)) {
                stageStart = startCandidate;
                stageEnd = endCandidate;
                break;
            }
        }

        if (!stageStart || !stageEnd) {
            stageStart = "singularity";
            stageEnd = "end";
        }

        const stageStartIndex: number = this.#getPhaseIndex(stageStart);
        const stageEndIndex: number = this.#getPhaseIndex(stageEnd);

        if (stageStartIndex === -1 || stageEndIndex === -1) {
            HSLogger.warn(`Unknown stage ${stage} - Autosing stopped.`, this.context);
            this.stopAutosing();
            return;
        }

        phaseConfig = this.#strategyPhaseRanges!.find((r) => stageStartIndex >= r.startIndex && stageEndIndex <= r.endIndex)?.phase ?? null;

        if (!phaseConfig) {
            HSLogger.warn(`No strategy phase matched for stage ${stage} - Autosing stopped.`, this.context);
            this.stopAutosing();
            return;
        }

        HSLogger.debug(() => `Executing phase: ${phaseConfig.startPhase}-${phaseConfig.endPhase}`, this.context);
        if (phaseConfig.startPhase === "start") {
            await this.#executePhase(phaseConfig, { skipInitialAscend: true });
        } else {
            await this.#executePhase(phaseConfig);
        }
    }

    // ============================================================================
    // PHASE EXECUTION
    // ============================================================================

    async #executePhase(
        phaseConfig: AutosingStrategyPhase,
        options?: {
            phaseLabelOverride?: string;
            skipInitialCorruptions?: boolean;
            skipInitialAscend?: boolean;
            ignoreObserverActivated?: boolean;
        }
    ): Promise<void> {
        const phaseLabel = options?.phaseLabelOverride ?? `${phaseConfig.startPhase}-${phaseConfig.endPhase}`;
        this.#autosingModal?.setCurrentPhase(phaseLabel);

        if (!options?.skipInitialCorruptions) {
            const phaseLoadout = this.#corruptionManager.getPhaseCorruptionLoadout(phaseConfig);
            if (phaseLoadout) {
                await this.#corruptionManager.setCorruptions(phaseLoadout);
            }
        }

        if (!options?.skipInitialAscend) {
            this.#ascendBtn.click();
        }

        // Ensure coin autobuyer (upgrades[81]) is active before entering challenges.
        // We detect purchase via the DOM: #upg81 gets a green background when bought.
        if (phaseConfig.startPhase === 'start') {
            await this.#antiBuyCoinBug2();
        }

        for (let i = 0; i < phaseConfig.strat.length; i++) {
            // Autosing disabled or AOAG observer activated
            if (!this.#autosingEnabled || (this.#observerActivated && !(phaseConfig.endPhase === "end") && !options?.ignoreObserverActivated)) {
                this.#autosingModal?.recordPhase(phaseLabel);
                return;
            }

            if (this.#autosingModal?.getIsPaused()) {
                HSUI.Notify('Autosing is paused.');
                while (this.#autosingModal?.getIsPaused() && this.isAutosingEnabled()) {
                    await HSUtils.sleep(500);
                }
                HSUI.Notify('Autosing resumed.');
            }

            const jumpIndex = await this.#executeStrategyAction(phaseConfig, i);
            if (typeof jumpIndex === 'number') {
                // set loop index to jumpIndex-1 because the for-loop will increment it
                i = jumpIndex - 1;
            }
            this.#prevActionTime = performance.now();
        }

        if (phaseConfig.endPhase == "end") {
            this.#endStageDone = true;
        }

        this.#autosingModal?.recordPhase(phaseLabel);
    }

    async #executeStrategyAction(phaseConfig: AutosingStrategyPhase, actionIndex: number): Promise<number | null> {
        const challenge = phaseConfig.strat[actionIndex];

        if (challenge.challengeWaitBefore && challenge.challengeWaitBefore > 0) {
            await HSUtils.sleepUntilElapsed(this.#prevActionTime, challenge.challengeWaitBefore, this.context);
        }

        if (challenge.challengeNumber == 401) {
            const phaseLoadout = this.#corruptionManager.getPhaseCorruptionLoadout(phaseConfig);
            if (phaseLoadout) {
                await this.#corruptionManager.setCorruptions(phaseLoadout);
            }
        } else if (challenge.challengeNumber == LOADOUT_ACTION_VALUE) {
            await this.#corruptionManager.applyLoadoutByName(challenge.loadoutName);
        } else if (challenge.challengeNumber == IF_JUMP_VALUE) {
            return await this.#handleIfJumpAction(challenge);
        } else if (challenge.challengeNumber >= 100) {
            HSLogger.debug(() => `Step#${actionIndex} - SA: ${SPECIAL_ACTION_LABEL_BY_ID.get(challenge.challengeNumber) ?? challenge.challengeNumber}`, this.context);
            await this.#performSpecialAction(challenge.challengeNumber, challenge.challengeWaitTime, challenge.challengeMaxTime);
        } else {
            HSLogger.debug(() => `Step#${actionIndex} - C${challenge.challengeNumber}: waiting for ${challenge.challengeCompletions ?? 0} completions, max time: ${challenge.challengeMaxTime}`, this.context);
            await this.#waitForCompletion(
                challenge.challengeNumber,
                challenge.challengeCompletions ?? 0,
                challenge.challengeMaxTime,
                challenge.challengeWaitTime,
            );
        }

        return null;
    }

    async #handleIfJumpAction(challenge: any): Promise<number | null> {
        const mode = challenge.ifJump?.ifJumpMode;
        const operator = challenge.ifJump?.ifJumpOperator;
        const jumpIndex = challenge.ifJump?.ifJumpIndex;

        switch (mode) {
            case "challenges": {
                const ifIdx = challenge.ifJump?.ifJumpChallenge ?? -1;
                const completions = (ifIdx >= 1 && ifIdx <= 15)
                    ? this.#getChallengeAccessor(ifIdx).getCompletions()
                    : HSAutosing.#DECIMAL_0;
                const value = challenge.ifJump?.ifJumpValue ?? 0;
                if (jumpIndex !== undefined &&
                    ((operator === ">" && completions.gt(value)) ||
                     (operator === "<" && completions.lt(value)))) {
                    return jumpIndex;
                }
                break;
            }
            case "stored_c15": {
                const exponent = challenge.ifJump?.ifJumpMultiplier ?? 0;
                const c15Score = this.#getChallengeAccessor(15).getCompletions();
                const targetStats = this.#storedC15.plus(exponent);
                if (jumpIndex !== undefined &&
                    ((operator === ">" && c15Score.gt(targetStats)) ||
                     (operator === "<" && c15Score.lt(targetStats)))) {
                    return jumpIndex;
                }
                break;
            }
        }

        return null;
    }

    // ============================================================================
    // SPECIAL ACTIONS
    // ============================================================================

    async #performSpecialAction(actionId: number, waitTime: number, maxTime: number): Promise<void> {
        switch (actionId) {
            case 101: // Exit Transcension challenge
                this.#exitTranscBtn.click();
                break;
            case 102: // Exit Reincarnation challenge
                this.#exitReincBtn.click();
                break;
            case 103: // Exit Ascension challenge
                this.#exitAscBtn.click();
                break;
            case 104:
                this.#ascendBtn.click();
                break;
            case 151: // Wait
                break;
            case 152: // Ant sac
                await this.#antSacrifice.click();
                break;
            case 153: // auto Challenge Toggle
                this.#autoChallengeButton.click();
                this.#exitTranscBtn.click();
                this.#exitReincBtn.click();
                break;
            case 154: // Auto Ant-Sac Toggle
                await this.#autoAntSacrificeButton.click();
                break;
            case 155: // Auto Ascend Toggle
                await this.#autoAscendButton.click();
                break;
            case 211: // Max C11
                await this.#maxC11to14WithC10(11);
                break;
            case 212: // Max C12
                await this.#maxC11to14WithC10(12);
                break;
            case 213: // Max C13
                await this.#maxC11to14WithC10(13);
                break;
            case 214: // Max C14
                await this.#maxC11to14WithC10(14);
                break;
            case 215: // store C15
                this.#storedC15 = this.#getChallengeAccessor(15).getCompletions();
                break;
            case 301: // Early Cube
                await this.#setAmbrosiaLoadout(this.#ambrosia_early_cube);
                break;
            case 302: // Late Cube
                await this.#setAmbrosiaLoadout(this.#ambrosia_late_cube);
                break;
            case 303: // Quark
                await this.#setAmbrosiaLoadout(this.#ambrosia_quark);
                break;
            case 304: // Obt loadout
                await this.#setAmbrosiaLoadout(this.#ambrosia_obt);
                break;
            case 305: // Off loadout
                await this.#setAmbrosiaLoadout(this.#ambrosia_off);
                break;
            case 306: // Ambrosia loadout
                await this.#setAmbrosiaLoadout(this.#ambrosia_luck);
                break;
            case 400: // Zero Corruptions
                await this.#corruptionManager.setCorruptions(ZERO_CORRUPTIONS);
                break;
            case 402: // Ant Corruptions
                await this.#corruptionManager.setCorruptions(ANT_CORRUPTIONS);
                break;
            case 601:
            case 602:
            case 603:
            case 604:
            case 605:
            case 606:
            case 607:
            case 608:
            case 609:
            case 610:
                await this.#C1to10UntilNoMoreCompletions((actionId - 600) as any, waitTime, maxTime);
                break;
            case 701:
            case 702:
            case 703:
            case 704:
            case 705:
            case 706:
            case 707:
            case 708:
            case 709:
                await this.#clickHeptractButton(actionId);
                break;
            case 901:
                this.#AOAG.click();
                break;
            case 902: // Restart AutoSing
                const restartBtn = document.getElementById('hs-timer-ctrl-restart') as HTMLButtonElement;
                if (restartBtn) restartBtn.click();
                break;
            case 903: // Stop AutoSing
                const stopBtn = document.getElementById('hs-timer-ctrl-stop') as HTMLButtonElement;
                if (stopBtn) stopBtn.click();
                break;
            default:
                HSLogger.warn(`Unknown special action ${actionId}`, this.context);
        }
    }

    async #clickHeptractButton(actionId: number): Promise<void> {
        switch (actionId) {
            case 701:
                this.#chronosHeptAutoBuyBtn?.click();
                break;
            case 702:
                this.#hyperHeptAutoBuyBtn?.click();
                break;
            case 703:
                this.#quarkHeptAutoBuyBtn?.click();
                break;
            case 704:
                this.#challHeptAutoBuyBtn?.click();
                break;
            case 705:
                this.#abyssHeptAutoBuyBtn?.click();
                break;
            case 706:
                this.#accelHeptAutoBuyBtn?.click();
                break;
            case 707:
                this.#boostHeptAutoBuyBtn?.click();
                break;
            case 708:
                this.#multHeptAutoBuyBtn?.click();
                break;
            case 709:
                this.#orbsAutoBuyBtn?.click();
                break;
        }
    }

    async #waitForCompletion(
        challengeIndex: number,
        minCompletions: number,
        maxTime: number = 99999999,
        waitTime: number = 0
    ): Promise<void> {
        const sleepInterval = 5;
        const accessor = this.#getChallengeAccessor(challengeIndex);
        const challengeBtn = accessor.button;
        const isActive = accessor.isActive;
        const getLevelText = accessor.getLevelText;
        const getCompletions = accessor.getCompletions;
        const getGoal = accessor.getGoal;

        if (!challengeBtn || !accessor.levelElement) {
            HSLogger.debug(() => `Challenge element ${challengeIndex} not found - Autosing stopped.`, this.context);
            this.stopAutosing();
            return;
        }

        await HSUtils.waitForClassCondition(challengeBtn, () => !isActive(), 500);

        this.#fastDoubleClick(challengeBtn);
        await HSUtils.waitForClassCondition(challengeBtn, () => isActive(), 300);
        while (!isActive()) {
            await HSUtils.sleep(1);
        }

        const startTime = performance.now();
        const endTime = startTime + maxTime;

        const maxPossible = getGoal();
        const minCompletionsDecimal = minCompletions === 0 ? HSAutosing.#DECIMAL_0 : new Decimal(minCompletions);
        let lastText = '';
        let currentCompletions = HSAutosing.#DECIMAL_0;

        while (true) {
            const now = performance.now();
            if (now >= endTime) break;

            if (!this.isAutosingEnabled()) {
                this.stopAutosing();
                return;
            }

            const rawText = getLevelText();
            if (rawText !== lastText) {
                lastText = rawText;
                currentCompletions = getCompletions();
            }

            if (currentCompletions.gte(maxPossible)) {
                return;
            }

            if (currentCompletions.gte(minCompletionsDecimal)) {
                if (waitTime > 0) {
                    await HSUtils.sleep(waitTime);
                }
                HSLogger.debug(() => `    ---> C${challengeIndex}: ${currentCompletions} completions reached`, this.context);
                return;
            }

            const remaining = endTime - now;
            const sleepMs = (remaining > 0 && remaining < sleepInterval) ? Math.max(0, remaining) : sleepInterval;
            await HSUtils.sleep(sleepMs);
        }

        // No warning if minCompletions = 0 because it's ok strategy-wise
        if (challengeIndex <= 10 && minCompletions !== 0) {
            HSLogger.warn(`    ---> Timeout: C${challengeIndex} failed to reach ${minCompletions} completions within ${maxTime} ms`, this.context);
        }
    }

    #getChallengeAccessor(challengeIndex: number): ChallengeAccessor {
        return this.#challengeAccessors[challengeIndex] ?? this.#makeChallengeAccessor(challengeIndex);
    }

    #buildChallengeAccessors(): void {
        for (let i = 1; i <= 15; i++) {
            this.#challengeAccessors[i] = this.#makeChallengeAccessor(i);
        }
    }

    #makeChallengeAccessor(challengeIndex: number): ChallengeAccessor {
        const challengeBtn = this.#challengeButtons[challengeIndex];
        const levelElement = this.#levelElements[challengeIndex];

        const getLevelText = () => levelElement?.textContent ?? '';
        const parseValue = (text: string) => new Decimal(this.#parseNumber(text));

        const getCompletions = challengeIndex === 15
            ? () => this.#parseDecimal(getLevelText())
            : () => {
                const text = getLevelText();
                const slashIdx = text.indexOf('/');
                return parseValue(slashIdx === -1 ? text : text.slice(0, slashIdx));
            };

        const getGoal = challengeIndex === 15
            ? () => HSAutosing.#DECIMAL_INFINITY
            : () => {
                if (!levelElement) return HSAutosing.#DECIMAL_9999;
                const goalText = levelElement.textContent ?? '';
                const slashIdx = goalText.indexOf('/');
                return slashIdx !== -1 ? parseValue(goalText.slice(slashIdx + 1).trim()) : HSAutosing.#DECIMAL_9999;
            };

        return {
            button: challengeBtn,
            levelElement,
            isActive: () => !!challengeBtn?.classList.contains('challengeActive'),
            getLevelText,
            getCompletions,
            getGoal,
        };
    }

    async #maxC11to14WithC10(challengeIndex: 11 | 12 | 13 | 14): Promise<void> {
        await this.#waitForCompletion(challengeIndex, 0, 0, 0);
        await this.#waitForCompletion(10, 0, 0, 0);

        const accessor = this.#getChallengeAccessor(challengeIndex);
        const levelElement = accessor.levelElement;
        const getCompletions = accessor.getCompletions;
        const maxPossible = accessor.getGoal();
        if (!levelElement || getCompletions().gte(maxPossible)) return;

        await new Promise<void>((resolve) => {
            let finished = false;
            const cleanup = (): void => {
                if (finished) return;
                finished = true;
                clearTimeout(timeoutId);
                observer.disconnect();
                resolve();
            };
            const observer = new MutationObserver(() => { if (getCompletions().gte(maxPossible)) cleanup(); });
            const timeoutId = window.setTimeout(() => cleanup(), 3000);

            observer.observe(levelElement, { childList: true, characterData: true, subtree: true });
            if (getCompletions().gte(maxPossible)) cleanup();
        });
    }

    async #C1to10UntilNoMoreCompletions(challengeIndex: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10, initialWaitTime: number, maxTime: number): Promise<void> {
        await this.#waitForCompletion(challengeIndex, 0, 0, 0);
        const accessor = this.#getChallengeAccessor(challengeIndex);
        const getLevelText = accessor.getLevelText;
        const getCompletions = accessor.getCompletions;
        const maxPossible = accessor.getGoal();
        let c1to10CurrentCompletions = getCompletions();
        let timeSinceNoMoreCompletion = performance.now();
        let lastRawText = getLevelText();

        await HSUtils.sleep(initialWaitTime);

        while (true) {
            const rawText = getLevelText();
            if (rawText !== lastRawText) {
                lastRawText = rawText;
                const newCompletions = getCompletions();
                if (!newCompletions.eq(c1to10CurrentCompletions)) {
                    c1to10CurrentCompletions = newCompletions;
                    timeSinceNoMoreCompletion = performance.now();
                }
            }
            const now = performance.now();

            if (now >= timeSinceNoMoreCompletion + maxTime || c1to10CurrentCompletions.gte(maxPossible)) {
                HSLogger.debug(() => `    C${challengeIndex}: maxed or no more completions after ${maxTime}ms`, this.context);
                return;
            }

            await HSUtils.sleep(10);
        }
    }

    // ============================================================================
    // CORRUPTION LOGIC — see HSAutosingCorruption
    // ============================================================================

    /*
    #antiBuyCoinBug(initialDelayMs = 0, intervalMs = 10, repeatCount = 10): void {
        HSLogger.debug(() => `[COIN-DIAG] antiBuyCoinBug: called, ${initialDelayMs}ms initial delay, ${intervalMs}ms interval, ${repeatCount} attempts`, this.context);
        window.setTimeout(() => {
            let attempt = 0;
            const intervalId = window.setInterval(() => {
                attempt++;
                this.#coin.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, isPrimary: true }));

                // Exposed player use
                HSLogger.debug(() => `[COIN-DIAG] antiBuyCoinBug: Reading firstOwnedCoin = ${HSGlobal.exposedPlayer?.firstOwnedCoin}`, this.context);
                if (HSGlobal.exposedPlayer && HSGlobal.exposedPlayer.firstOwnedCoin === 0) {
                    HSLogger.debug(() => `[COIN-DIAG] antiBuyCoinBug: Detected firstOwnedCoin is 0, incrementing to prevent bug.`, this.context);
                    HSGlobal.exposedPlayer.firstOwnedCoin++;
                    HSLogger.debug(() => `[COIN-DIAG] antiBuyCoinBug: Reading firstOwnedCoin = ${HSGlobal.exposedPlayer?.firstOwnedCoin}`, this.context);
                }

                if (attempt >= repeatCount) {
                    window.clearInterval(intervalId);
                    HSLogger.debug(() => `[COIN-DIAG] antiBuyCoinBug: completed ${attempt} attempts, stopping.`, this.context);
                }
            }, intervalMs);
        }, initialDelayMs);
    }
    */

    async #antiBuyCoinBug2(maxWaitMs = 2000): Promise<void> {
        const upg81El = document.getElementById('upg81') as HTMLElement | null;
        if (!upg81El) {
            HSLogger.warn(`[COIN-FIX] #upg81 element not found in DOM`, this.context);
            return;
        }
        const isGreen = () => upg81El.classList.contains('green-background');
        if (isGreen()) return;
        const waitStart = performance.now();
        HSLogger.debug(() => `[COIN-FIX] Waiting for #upg81 to be bought (turn green)...`, this.context);

        const turned = await new Promise<boolean>(resolve => {
            const timer = window.setTimeout(() => {
                observer.disconnect();
                resolve(false);
            }, maxWaitMs);
            const observer = new MutationObserver(() => {
                if (isGreen()) {
                    window.clearTimeout(timer);
                    observer.disconnect();
                    resolve(true);
                }
            });

            observer.observe(upg81El, { attributes: true, attributeFilter: ['class'] });
        });

        const elapsedStr = (performance.now() - waitStart).toFixed(0);
        if (turned) {
            HSLogger.debug(() => `[COIN-FIX] #upg81 turned green after ${elapsedStr}ms`, this.context);
        } else {
            HSLogger.warn(`[COIN-FIX] #upg81 still not green after ${maxWaitMs}ms...`, this.context);
        }
    }

    // ============================================================================
    // AMBROSIA LOADOUT
    // ============================================================================

    async #setAmbrosiaLoadout(loadout: HTMLButtonElement): Promise<void> {
        loadout.click();
        await this.#waitForAmbrosiaLoadoutSelected(loadout, 500);
    }

    async #waitForAmbrosiaLoadoutSelected(loadout: HTMLButtonElement, timeoutMs = 500): Promise<void> {
        if (this.#isInAmbLoadout(loadout)) {
            return;
        }

        await HSUtils.waitForClassCondition(loadout, () => this.#isInAmbLoadout(loadout), timeoutMs);

        if (!this.#isInAmbLoadout(loadout)) {
            HSLogger.debug(() => `Ambrosia loadout did not select within ${timeoutMs}ms, falling back to polling.`, this.context);
            while (!this.#isInAmbLoadout(loadout)) {
                await HSUtils.sleep(this.#sleepTime);
            }
        }
    }

    #isInAmbLoadout(loadout: HTMLButtonElement): boolean {
        return !!loadout?.classList.contains('hs-rainbow-border');
    }

    // ============================================================================
    // STAGE & PHASES
    // ============================================================================

    async #getStage(): Promise<string> {
        if (this.#stageFunc) {
            try {
                const stage = this.#stageFunc(0);
                HSLogger.debug(() => `Got stage directly: ${stage}`, this.context);
                return stage;
            } catch (error) {
                HSLogger.debug(() => `Error getting stage from stageFunc: ${error}`, this.context);
            }
        } else {
            if (!this.#hasWarnedMissingStageFunc) {
                HSLogger.warn("Performance Warning: 'synergismStage' function not exposed.", this.context);
                this.#hasWarnedMissingStageFunc = true;
            }
        }

        try {
            const raw = this.#stage?.textContent ?? '';
            const m = raw.match(STAGE_REGEX);
            if (m && m[1]) {
                HSLogger.debug(() => `Got stage from element: ${m[1]}`, this.context);
                return m[1].trim();
            }
        } catch (e) {
            HSLogger.warn(`Error reading stage element: ${e}`, this.context);
        }

        return this.#getStageViaDOM();
    }

    async #getStageViaDOM(): Promise<string> {
        this.#settingsTab.click();
        this.#settingsSubTab.click();
        this.#misc.click();

        const stageText = await this.#getFromDOM<string>(this.#stage, {
            regex: STAGE_REGEX,
            predicate: t => t.includes("Current Game Section:")
        });

        return stageText || "";
    }

    async #getFromDOM<T>(
        el: HTMLElement | null,
        {
            regex,
            parser,
            timeoutMs = 2000,
            predicate = t => t.trim().length > 0
        }: GetFromDOMOptions<T>
    ): Promise<T | null> {
        if (!el) return null;

        await HSUtils.waitForInnerText(el, predicate, timeoutMs);

        const text = el.textContent ?? "";
        const extracted = regex
            ? text.match(regex)?.[1] ?? null
            : text;

        if (!extracted) return null;

        return parser ? parser(extracted.trim()) : (extracted.trim() as unknown as T);
    }

    #isPhaseOption(value: string): value is PhaseOption {
        return this.#phaseIndexByOption.has(value as PhaseOption);
    }

    #getPhaseIndex(phase: PhaseOption): number {
        return this.#phaseIndexByOption.get(phase) ?? -1;
    }

    #rebuildStrategyPhaseCaches(): void {
        if (!this.#strategy) {
            this.#strategyPhaseRanges = undefined;
            this.#finalPhaseConfig = undefined;
            return;
        }

        this.#finalPhaseConfig = this.#strategy.strategy.find(p => p.endPhase === 'end') ?? undefined;
        this.#strategyPhaseRanges = this.#strategy.strategy
            .map((p) => {
                const startIndex = this.#getPhaseIndex(p.startPhase);
                const endIndex = this.#getPhaseIndex(p.endPhase);
                return { phase: p, startIndex, endIndex };
            })
            .filter((r) => r.startIndex !== -1 && r.endIndex !== -1);
    }

    // ============================================================================
    // SINGULARITY LOGIC
    // ============================================================================

    async #performSingularity(skipRecord: boolean = false): Promise<void> {
        const prevMainView = this.#gamestate.getCurrentUIView<MainView>('MAIN_VIEW');
        
        const [gameData, happyHourStackAmount] = await Promise.all([
            this.#gameDataAPI?.getLatestAutosingData() ?? { quarks: 0, goldenQuarks: 0 },
            this.#gameDataAPI?.getEventData()?.HAPPY_HOUR_BELL.amount ?? 0
        ]);
        const gq = gameData?.goldenQuarks ?? 0;
        const q = gameData?.quarks ?? 0;
        const gqGain = Math.max(0, gq - this.#previousGoldenQuarkAmount);
        const qGain = Math.max(0, q - this.#previousQuarkAmount);
        this.#previousQuarkAmount = q;
        this.#previousGoldenQuarkAmount = gq;
        const c15ScoreBeforeSinging = this.#getChallengeAccessor(15).getCompletions();

        await this.#enterAndLeaveExalt();

        this.#endStageDone = false;
        this.#observerActivated = false;
        this.#elevatorInput.value = this.#targetSingularity.toString();
        this.#elevatorInput.dispatchEvent(new Event('input', { bubbles: true }));
        this.#elevatorTeleportButton.click();
        
        const stageInitial = await this.#getStage();

        if (!skipRecord) {
            this.#autosingModal?.recordSingularity(gqGain, gq, qGain, q, happyHourStackAmount, c15ScoreBeforeSinging);
        }

        prevMainView.goto();
        HSLogger.debug(() => "Singularity performed", this.context);

        let stage = stageInitial;
        while (!this.#isAllowedStage(stage)) {
            await HSUtils.sleep(1);
            stage = await this.#getStage();
        }

        // this.#antiBuyCoinBug(0, 15, 20);

        this.#observeAntiquitiesRune();
        this.#prevActionTime = performance.now();
    }

    async #enterAndLeaveExalt(): Promise<void> {
        HSUtils.clickWithoutSleep(this.#exalt2Btn);
        await this.#waitForExaltState(true);

        HSUtils.clickWithoutSleep(this.#exalt2Btn);
        await this.#waitForExaltState(false);
    }

    async #waitForExaltState(targetState: boolean, timeoutMs = 3000): Promise<void> {
        if (this.#isInExalt() === targetState) { return; }
        const exaltTimerElement = this.#exaltTimer;
        if (!exaltTimerElement) {
            HSLogger.warn("Could not observe exalt state because exalt timer element is missing.", this.context);
            return;
        }

        await new Promise<void>((resolve) => {
            let finished = false;
            const cleanup = (): void => {
                if (finished) return;
                finished = true;
                clearTimeout(timeoutId);
                observer.disconnect();
                resolve();
            };
            const observer = new MutationObserver(() => {
                if (this.#isInExalt() === targetState) {
                    cleanup();
                }
            });
            const timeoutId = window.setTimeout(() => { cleanup(); }, timeoutMs);

            observer.observe(exaltTimerElement, { attributes: true, attributeFilter: ['style', 'class'] });
            if (this.#isInExalt() === targetState) { cleanup(); }
        });

        if (this.#isInExalt() !== targetState) {
            HSLogger.warn(`Timeout waiting for exalt ${targetState ? 'enter' : 'exit'} state; falling back to polling.`, this.context);
            while (this.#isInExalt() !== targetState) {
                await HSUtils.sleep(this.#sleepTime);
            }
        }
    }

    #isInExalt(): boolean {
        const style = window.getComputedStyle(this.#exaltTimer);
        return style.display !== "none";
    }

    #isAllowedStage(stage: string): boolean {
        return ALLOWED_REGEX.test(stage);
    }


    // ============================================================================
    // ANTIQUITIES
    // ============================================================================

    #observeAntiquitiesRune(): void {
        if (!this.#antiquitiesRuneLockedContainer) {
            HSLogger.warn("Could not find antiquitiesRuneLockedContainer element", this.context);
            return;
        }

        this.#antiquitiesObserver?.disconnect();

        this.#antiquitiesObserver = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const style = (mutation.target as HTMLElement).style;
                    if (style.display === 'none') {
                        HSLogger.debug(() => 'antiquitiesRuneLockedContainer found hidden - buying antiquities', this.context);
                        this.#observerActivated = true;
                        this.#antiquitiesObserver?.disconnect();
                        this.#antiquitiesObserver = undefined;
                        this.#performFinalStage();
                        break;
                    }
                }
            }
        });

        this.#antiquitiesObserver.observe(this.#antiquitiesRuneLockedContainer, { attributes: true, attributeFilter: ['style'] });
    }

    async #performFinalStage(): Promise<void> {
        if (this.#endStagePromise) return;

        this.#endStagePromise = new Promise<void>(resolve => {
            this.#endStageResolve = resolve;
        });

        const aoagPhase = this.#strategy?.aoagPhase ?? createDefaultAoagPhase();
        aoagPhase.phaseId = AOAG_PHASE_ID;

        await this.#executePhase(aoagPhase, {
            phaseLabelOverride: AOAG_PHASE_NAME,
            skipInitialCorruptions: false,
            skipInitialAscend: false,
            ignoreObserverActivated: true
        });

        this.#prevActionTime = performance.now();
        await this.#matchStageToStrategy('final');

        if (this.isAutosingEnabled()) {
            await this.#setAmbrosiaLoadout(this.#ambrosia_quark);
            const exportBtn = this.#exportBtnClone ?? this.#exportBtn;

            if (exportBtn) {
                this.#saveType.checked = true;
                exportBtn.click();
            }

            this.#ascendBtn.click();

            if (this.#stopAtSingularitysEnd && this.#autosingEnabled) {
                HSUI.Notify("Standard strategy exited: Auto-Sing will now push this sing before stopping.");
                await this.#pushSingularityBeforeStop();
                HSUI.Notify("Auto-Sing stopped at end of singularity as requested.");
                this.stopAutosing();
                return;
            }

            await this.#performSingularity();
        }

        this.#endStageResolve?.();
        this.#endStagePromise = undefined;
        this.#endStageResolve = undefined;
    }

    async #pushSingularityBeforeStop(): Promise<void> {
        this.#ambrosia_late_cube.click();
        await this.#corruptionManager.setCorruptions(ZERO_CORRUPTIONS);

        await this.#maxC11to14WithC10(11);
        await this.#maxC11to14WithC10(12);
        await this.#maxC11to14WithC10(13);
        await this.#maxC11to14WithC10(14);

        await this.#corruptionManager.setCorruptions(
            { viscosity: 16, drought: 16, deflation: 16, extinction: 16, illiteracy: 16, recession: 16, dilation: 16, hyperchallenge: 16 }
        );

        await this.#autoChallengeButton.click();

        for (let i = 1; i <= 2; i++) {
            await this.#executePushLoop();
        }

        await this.#executeLastPushLoop();
        await this.#exitTranscBtn.click();
        await HSUtils.sleep(2000);
        await this.#setAmbrosiaLoadout(this.#ambrosia_late_cube);
        await this.#autoChallengeButton.click();
        await this.#exitAscBtn.click();
        await this.#setAmbrosiaLoadout(this.#ambrosia_luck);
    }

    async #executePushLoop(): Promise<void> {
        await this.#waitForCompletion(15, 0, 0, 0);
        await this.#setAmbrosiaLoadout(this.#ambrosia_obt);
        await HSUtils.sleep(4500);
        await this.#setAmbrosiaLoadout(this.#ambrosia_off);
        await HSUtils.sleep(100);
        await this.#antSacrifice.click();
        await HSUtils.sleep(100);
        await this.#setAmbrosiaLoadout(this.#ambrosia_late_cube);

        await this.#exitAscBtn.click();
        await this.#setAmbrosiaLoadout(this.#ambrosia_off);
        await HSUtils.sleep(4500);
        await this.#antSacrifice.click();
        await HSUtils.sleep(100);
        await this.#setAmbrosiaLoadout(this.#ambrosia_late_cube);
    }

    async #executeLastPushLoop(): Promise<void> {
        await this.#waitForCompletion(15, 0, 0, 0);
        await this.#setAmbrosiaLoadout(this.#ambrosia_obt);
        await HSUtils.sleep(4500);
        await this.#setAmbrosiaLoadout(this.#ambrosia_off);
        await HSUtils.sleep(100);
        await this.#antSacrifice.click();
        await HSUtils.sleep(100);
        await this.#setAmbrosiaLoadout(this.#ambrosia_obt);

        await this.#waitForCompletion(6, 150,  1200, 0);
        await this.#waitForCompletion(1, 9001, 1200, 0);
        await this.#waitForCompletion(2, 9001, 1200, 0);
        await this.#waitForCompletion(3, 9001, 1200, 0);
        await this.#waitForCompletion(4, 9001, 1200, 0);
        await this.#waitForCompletion(5, 9001, 1200, 0);
    }

    // ============================================================================
    // UTILITY & HELPERS
    // ============================================================================

    async #useAddAndTimeCodes(): Promise<void> {
        if (this.#addCodeAllBtn) this.#addCodeAllBtn.click();
        if (this.#timeCodeBtn) this.#timeCodeBtn.click();
        await HSUtils.sleep(0);
    }

    #parseDecimal(text: string): Decimal {
        let cleanText = text.replace(/,/g, '').trim();
        try {
            return new Decimal(cleanText);
        } catch (e) {
            return HSAutosing.#DECIMAL_0;
        }
    }

    #parseNumber(text: string): number {
        const parsed = parseFloat(text.replace(/,/g, '').trim());
        return isNaN(parsed) ? 0 : parsed;
    }

    #fastDoubleClick(element: HTMLElement): void {
        element.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    }
}
