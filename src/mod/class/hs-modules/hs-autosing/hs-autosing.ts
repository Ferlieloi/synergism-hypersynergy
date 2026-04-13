import Decimal from "break_infinity.js";
import { HSModuleManager } from "../../hs-core/module/hs-module-manager";
import { HSGameDataAPI } from "../../hs-core/gds/hs-gamedata-api";
import { HSModule } from "../../hs-core/module/hs-module";
import { HSLogger } from "../../hs-core/hs-logger";
import { HSUI } from "../../hs-core/hs-ui";
import { HSSettings } from "../../hs-core/settings/hs-settings";
import { HSNumericSetting } from "../../hs-core/settings/hs-setting";
import { HSUtils } from "../../hs-utils/hs-utils";
import { HSAutosingStrategy, GetFromDOMOptions, PhaseOption, phases, AutosingStrategyPhase, Challenge, SPECIAL_ACTIONS, createDefaultAoagPhase, AOAG_PHASE_ID, AOAG_PHASE_NAME, LOADOUT_ACTION_VALUE, IF_JUMP_VALUE, ALLOWED } from "../../../types/module-types/hs-autosing-types";
import { HSAutosingModal } from "./hs-autosingModal";
import { HSGlobal } from "../../hs-core/hs-global";
import { HSGameState, MainView } from "../../hs-core/hs-gamestate";
import { HSAutosingSettingsFixer } from './hs-autosingSettingsFixer';
import { HSAutosingCorruption, CORRUPTION_NAMES, ZERO_CORRUPTIONS, ANT_CORRUPTIONS } from './hs-autosingCorruption';

const SPECIAL_ACTION_LABEL_BY_ID = new Map<number, string>(SPECIAL_ACTIONS.map((a) => [a.value, a.label] as const));
const STAGE_REGEX = /Current Game Section:\s*(.+)/;
const ALLOWED_REGEX = new RegExp(ALLOWED.join('|'));
const SKIP_INITIAL_ASCEND_OPTS = { skipInitialAscend: true } as const;

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
export class HSAutosing extends HSModule {
    static readonly #DECIMAL_INFINITY = new Decimal(Infinity);
    static readonly #DECIMAL_9999 = new Decimal(9999);
    static readonly #DECIMAL_0 = new Decimal(0);
    #gameDataAPI?: HSGameDataAPI;

    #corruptionManager!: HSAutosingCorruption;

    #strategy?: HSAutosingStrategy;
    #autosingEnabled = false;
    #targetSingularity = 0;
    #prevActionTime: number = 0;
    #stopAtSingularitysEnd: boolean = false;
    #hasWarnedMissingStageFunc: boolean = false;
    #storedC15: number = 0;
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
    #heptractBtns: HTMLButtonElement[] = [];

    // DOM Elements - Ambrosia Loadouts
    #ambrosia_early_cube!: HTMLButtonElement;
    #ambrosia_late_cube!: HTMLButtonElement;
    #ambrosia_quark!: HTMLButtonElement;
    #ambrosia_obt!: HTMLButtonElement;
    #ambrosia_off!: HTMLButtonElement;
    #ambrosia_luck!: HTMLButtonElement;

    // DOM Elements - Misc
    #antSacrifice!: HTMLButtonElement;
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

    // Game References
    #stageFunc?: (arg0: number) => any;
    #getMaxChallengesFunc?: (i: number) => number;
    #applyCorruptionsFunc?: (json: string) => boolean;
    #enterExaltFunc?: () => void;
    #exitExaltFunc?: () => void;
    #teleportLowerFunc?: (target: number) => void;
    #exposedPlayer: typeof HSGlobal.exposedPlayer = null;
    #isExposureReady: boolean = false;
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
        this.isInitialized = true;
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
        this.#AOAG = document.getElementById('antiquitiesRuneSacrifice') as HTMLButtonElement;
        this.#exalt2Btn = document.getElementById('oneChallengeCap') as HTMLButtonElement;
        this.#exaltTimer = document.getElementById('ascSingChallengeTimeTakenStats') as HTMLSpanElement;
        this.#elevatorTeleportButton = document.getElementById('elevatorTeleportButton') as HTMLButtonElement;
        this.#elevatorInput = document.getElementById('elevatorTargetInput') as HTMLInputElement;
    }

    #cacheHeptractButtons(): void {
        this.#heptractBtns = [
            document.getElementById('chronosHepteractAuto'),
            document.getElementById('hyperrealismHepteractAuto'),
            document.getElementById('quarkHepteractAuto'),
            document.getElementById('challengeHepteractAuto'),
            document.getElementById('abyssHepteractAuto'),
            document.getElementById('acceleratorHepteractAuto'),
            document.getElementById('acceleratorBoostHepteractAuto'),
            document.getElementById('multiplierHepteractAuto'),
            document.getElementById('hepteractToQuarkTradeAuto'),
        ] as HTMLButtonElement[];
    }

    #cacheCorruptionElements(): void {
        this.#addCodeAllBtn = document.getElementById("addCodeAll") as HTMLButtonElement;
        this.#timeCodeBtn = document.getElementById("timeCode") as HTMLButtonElement;

        const corrNext = Object.fromEntries(
            CORRUPTION_NAMES.map(name => [name, document.getElementById(`corrNext${name}`)])
        );

        this.#corruptionManager = new HSAutosingCorruption(
            corrNext,
            document.getElementById('corruptionStats'),
            document.getElementById('prompt_text') as HTMLInputElement,
            document.getElementById('ok_prompt') as HTMLButtonElement,
            document.querySelector('#corruptionLoadoutTable button.corrImport') as HTMLButtonElement,
        );
    }

    #cacheMiscElements(): void {
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

    async #cacheExposedFunctions(): Promise<void> {        
        this.#stageFunc             = (window as any).__HS_synergismStage       ?? null;
        this.#getMaxChallengesFunc  = (window as any).__HS_getMaxChallenges     ?? null;
        this.#exposedPlayer         = HSGlobal.exposedPlayer                    ?? null;
        const isAutoConfirmPatched  = (window as any).__HS_AUTO_CONFIRM_PATCHED ?? false;
        const isAfterTickHooked     = HSUtils.cacheAfterTickHook();

        const needsCorruptions = !this.#applyCorruptionsFunc;
        const needsTeleport    = !this.#teleportLowerFunc;
        const needsExalt       = !this.#enterExaltFunc || !this.#exitExaltFunc;

        if (needsCorruptions || needsTeleport || needsExalt) {
            HSLogger.debug(() => 'Triggering late-exposed patches...', this.context);
            const prevMainView = this.#gamestate.getCurrentUIView<MainView>('MAIN_VIEW');

            // Calling applyCorruptions via setCorruptions exposes window.__HS_applyCorruptions.
            if (needsCorruptions) await this.#corruptionManager.setCorruptions(ZERO_CORRUPTIONS);
                
            // #enterAndLeaveExalt calls enableChallenge then exitChallenge, exposing both
            // window.__HS_enterExalt and window.__HS_exitExalt.
            if (needsExalt) await this.#enterAndLeaveExalt();

            // Clicking the elevator teleport button calls teleportToSingularity, which exposes
            // window.__HS_teleportLower at the start of its body before any dialog.
            if (needsTeleport) {
                this.#elevatorInput.value = this.#targetSingularity.toString();
                this.#elevatorInput.dispatchEvent(new Event('input', { bubbles: true }));
                this.#elevatorTeleportButton.click();
            }
            prevMainView.goto();
        }

        // Read all four — they should now be set on window.
        this.#applyCorruptionsFunc = (window as any).__HS_applyCorruptions ?? null;
        this.#teleportLowerFunc    = (window as any).__HS_teleportLower    ?? null;
        this.#enterExaltFunc       = (window as any).__HS_enterExalt       ?? null;
        this.#exitExaltFunc        = (window as any).__HS_exitExalt        ?? null;
        this.#corruptionManager.setApplyCorruptionsFunc(this.#applyCorruptionsFunc ?? null);

        this.#isExposureReady = !!(this.#stageFunc && this.#exposedPlayer && this.#getMaxChallengesFunc && isAutoConfirmPatched && isAfterTickHooked
                                    && this.#applyCorruptionsFunc && this.#teleportLowerFunc && this.#enterExaltFunc && this.#exitExaltFunc );

        const exposureMsg = `Exposure status — 
            stageFunc: ${!!this.#stageFunc},
            exposedPlayer: ${!!this.#exposedPlayer},
            getMaxChallengesFunc: ${!!this.#getMaxChallengesFunc},
            onAfterTickHook: ${isAfterTickHooked},
            applyCorruptionsFunc: ${!!this.#applyCorruptionsFunc},
            teleportLowerFunc: ${!!this.#teleportLowerFunc},
            enterExaltFunc: ${!!this.#enterExaltFunc},
            exitExaltFunc: ${!!this.#exitExaltFunc},
            autoConfirmPatched: ${isAutoConfirmPatched},
            → isExposureReady: ${this.#isExposureReady}.`;
        if (this.#isExposureReady) {
            HSLogger.debug(() => exposureMsg, this.context);
        } else {
            HSLogger.warn(exposureMsg, this.context);
        }
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
    // ENABLE / DISABLE AUTOSING
    // ============================================================================

    async enableAutoSing(): Promise<void> {
        this.#cacheSettingsElements();
        this.#cacheChallengeElements();
        this.#cacheButtonElements();
        this.#cacheHeptractButtons();
        this.#cacheCorruptionElements();
        this.#cacheMiscElements();

        if (!HSGlobal.General.isModFullyLoaded) {
            HSLogger.debug(() => "Hypersynergism is still loading. Please wait before starting Auto-Sing.", this.context);
            return;
        }
        if (this.#isInExalt()) {
            HSLogger.debug(() => "Cannot start Auto-Sing while inside a singularity challenge.", this.context);
            return;
        }

        this.#autosingEnabled = true;
        this.#stopAtSingularitysEnd = false;
        this.#endStageDone = false;
        this.#observerActivated = false;
        this.#endStagePromise = undefined;
        this.#hasWarnedMissingStageFunc = false;
        this.#storedC15 = 0;
        this.#hsSettingsToRestore = await HSAutosingSettingsFixer.fixAllSettings();
        
        if (!await this.#validateAutosingSetupAndRequirements()) {
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
        this.#corruptionManager.buildLoadoutCache(strategy.corruptionLoadouts ?? []);
        if (!await this.#loadAmbrosiaLoadoutButtons()) { this.stopAutosing(); return; }
        
        await this.#cacheExposedFunctions();

        HSLogger.log(`Autosing enabled for target singularity: ${this.#targetSingularity}`, this.context);

        this.#autosingModal?.destroy();
        this.#autosingModal = new HSAutosingModal();

        this.#performAutosingLogic();
    }

    public stopAutosing(options?: { showReviewModal?: boolean }): void {
        if (!this.#autosingEnabled) return;
        this.#stopAutosingCore({ modalDisposition: options?.showReviewModal ? 'review' : 'destroy' });

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
        this.#antiquitiesObserver?.disconnect();
        this.#antiquitiesObserver = undefined;

        if (this.#endStageResolve) {
            try { this.#endStageResolve(); } catch (e) { /* ignore */ }
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
    async #validateAutosingSetupAndRequirements(): Promise<boolean> {
        if (!(window as any).__HS_AUTO_CONFIRM_PATCHED) {
            HSUtils.startDialogWatcher();
        }

        const quickbarSetting = HSSettings.getSetting('ambrosiaQuickBar');
        if (quickbarSetting && !quickbarSetting.isEnabled()) {
            HSLogger.log("Autosing requirement: Enabling Ambrosia Quick Bar now.", this.context);
            quickbarSetting.enable();
        }

        const singularitySetting = HSSettings.getSetting('singularityNumber') as HSNumericSetting;
        this.#targetSingularity = singularitySetting.getValue();

        this.#gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        await this.#gameDataAPI?.prepareForAutosing(); 
        const gameData = await this.#gameDataAPI?.getForcedGameData(); 

        if (!gameData) {
            HSLogger.warn("Could not get game data", this.context);
            return false;
        }

        if (gameData.highestSingularityCount < 40) {
            HSUI.Notify("AutoSing is an end-game QoL feature. S256+ is expected. Not available until you unlock EXALT2.", { notificationType: "warning" });
            return false;
        }

        if (gameData.highestSingularityCount < 216) {
            // window.confirm is the native browser dialog — not the same as the game's
            // patched confirm/alert hooks, so __HS_AUTO_CONFIRM_PATCHED does NOT intercept this.
            if (!window.confirm(`AutoSing is not fully functional until you completed EXALT6 at least once.`)) {
                return false;
            }
        }

        if (this.#targetSingularity > gameData.highestSingularityCount) {
            HSLogger.debug(() => `Target singularity bigger than highest. Going to highest.`);
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
            return null;
        }

        const selectedOption = control.selectOptions.find(
            opt => opt.value.toString() === HSUtils.asString(selectedValue)
        );

        if (!selectedOption) {
            HSUI.Notify("Selected strategy not found - Autosing stopped.", { notificationType: "warning" });
            return null;
        }

        const defaultNames = HSSettings.getDefaultStrategyNames();
        const selectedRawName = selectedOption.value.toString();
        const strategy = defaultNames.includes(selectedRawName)
            ? await HSSettings.loadDefaultStrategyByName(selectedRawName)
            : (HSSettings.getStrategies().find(s => s.strategyName === selectedRawName) ?? null);

        if (!strategy) {
            HSLogger.warn(`Strategy "${selectedRawName}" not found or failed to load.`, this.context);
            HSUI.Notify("Could not find or load strategy - Autosing stopped.", { notificationType: "warning" });
            return null;
        }

        const runtimeStrategy: HSAutosingStrategy = JSON.parse(JSON.stringify(strategy));
        // MIGRATION NEXT STEP - This should not be needed anymore (except if users click the migrate button). To be removed.
        // Migrate to new IDs in-memory only — this copy is never persisted.
        HSSettings.migrateStrategyActionIdsAuto(runtimeStrategy, 'toNew');
        HSLogger.log(`Loaded strategy "${selectedRawName}" (migrated to runtime IDs in-memory)`, this.context);

        return runtimeStrategy;
    }

    async #loadAmbrosiaLoadoutButtons(): Promise<boolean> {
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
            return false;
        }
        return true;
    }


    // ============================================================================
    // MAIN AUTOSING LOGIC
    // ============================================================================

    async #performAutosingLogic(): Promise<void> {
        try {
            await this.#useAddAndTimeCodes();

            if (this.#autosingModal) {
                const { HSQuickbarManager } = await import("../hs-qolQuickbarManager");
                await HSQuickbarManager.getInstance().whenSectionInjected('ambrosia');
                let quarks: number;
                let goldenQuarks: number;
                if (this.#isExposureReady) {
                    quarks = Number(this.#exposedPlayer!.worlds);
                    goldenQuarks = Number(this.#exposedPlayer!.goldenQuarks);
                } else {
                    const data = await this.#gameDataAPI?.getLatestAutosingData();
                    quarks = data?.quarks ?? 0;
                    goldenQuarks = data?.goldenQuarks ?? 0;
                }
                this.#autosingModal.start(this.#strategy!, quarks, goldenQuarks);
                this.#autosingModal.show();
            }

            await this.#performSingularity(true);

            while (this.#autosingEnabled) {
                if (this.#endStageDone || this.#observerActivated) {
                    await this.#endStagePromise;
                    continue;
                }

                while (this.#autosingEnabled && !this.#endStageDone && !this.#observerActivated) {
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

        if (stage === 'final') {
            const finalPhase = this.#finalPhaseConfig;
            if (!finalPhase) {
                HSLogger.warn("No final phase found in strategy - Autosing stopped.", this.context);
                this.stopAutosing();
                return;
            }
            await this.#executePhase(finalPhase);
            return;
        }

        // Find the unique dash split where both sides are valid PhaseOptions.
        // Call getPhaseIndex directly (returns -1 for unknown) instead of isPhaseOption+getPhaseIndex
        // to halve the number of Map lookups per candidate.
        let stageStartIndex = -1;
        let stageEndIndex   = -1;

        for (let dashIndex = stage.indexOf('-'); dashIndex !== -1; dashIndex = stage.indexOf('-', dashIndex + 1)) {
            const si = this.#getPhaseIndex(stage.slice(0, dashIndex) as PhaseOption);
            if (si === -1) continue;
            const ei = this.#getPhaseIndex(stage.slice(dashIndex + 1) as PhaseOption);
            if (ei !== -1) { stageStartIndex = si; stageEndIndex = ei; break; }
        }

        if (stageStartIndex === -1) {
            stageStartIndex = this.#getPhaseIndex("singularity" as PhaseOption);
            stageEndIndex   = this.#getPhaseIndex("end" as PhaseOption);
        }

        if (stageStartIndex === -1 || stageEndIndex === -1) {
            HSLogger.warn(`Unknown stage ${stage} - Autosing stopped.`, this.context);
            this.stopAutosing();
            return;
        }

        const phaseConfig = this.#strategyPhaseRanges!.find((r) => stageStartIndex >= r.startIndex && stageEndIndex <= r.endIndex)?.phase ?? null;

        if (!phaseConfig) {
            HSLogger.warn(`No strategy phase matched for stage ${stage} - Autosing stopped.`, this.context);
            this.stopAutosing();
            return;
        }

        HSLogger.debug(() => `Executing phase: ${phaseConfig.startPhase}-${phaseConfig.endPhase}`, this.context);
        if (phaseConfig.startPhase === "start")
            await this.#executePhase(phaseConfig, SKIP_INITIAL_ASCEND_OPTS);
        else
            await this.#executePhase(phaseConfig);
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
        // TODO: all those options can probably be simplified or even avoided
        const phaseLabelOverride      = options?.phaseLabelOverride;
        const skipInitialCorruptions  = options?.skipInitialCorruptions;
        const skipInitialAscend       = options?.skipInitialAscend;
        const ignoreObserverActivated = options?.ignoreObserverActivated;
        const phaseLabel = phaseLabelOverride ?? `${phaseConfig.startPhase}-${phaseConfig.endPhase}`;
        this.#autosingModal?.setCurrentPhase(phaseLabel);

        if (!skipInitialCorruptions) {
            const phaseLoadout = this.#corruptionManager.getPhaseCorruptionLoadout(phaseConfig);
            if (phaseLoadout)
                await this.#corruptionManager.setCorruptions(phaseLoadout);
        }

        if (!skipInitialAscend) this.#ascendBtn.click();

        // Ensure coin autobuyer (upgrades[81]) is active before entering challenges.
        // We detect purchase via the DOM: #upg81 gets a green background when bought.
        if (phaseConfig.startPhase === 'start') await this.#antiBuyCoinBug2();

        const isEndPhase = phaseConfig.endPhase === "end";
        for (let i = 0; i < phaseConfig.strat.length; i++) {
            // Autosing disabled or AOAG observer activated
            if (!this.#autosingEnabled || (this.#observerActivated && !isEndPhase && !ignoreObserverActivated)) {
                this.#autosingModal?.recordPhase(phaseLabel);
                return;
            }

            if (this.#autosingModal?.getIsPaused()) await this.#waitIfAutosingPaused();

            const jumpIndex = await this.#executeStrategyAction(phaseConfig, i);
            if (typeof jumpIndex === 'number') {
                // set loop index to jumpIndex-1 because the for-loop will increment it
                i = jumpIndex - 1;
            }
            this.#prevActionTime = performance.now();
        }

        if (phaseConfig.endPhase === "end") this.#endStageDone = true;

        this.#autosingModal?.recordPhase(phaseLabel);
    }

    async #executeStrategyAction(phaseConfig: AutosingStrategyPhase, actionIndex: number): Promise<number | null> {
        const challenge = phaseConfig.strat[actionIndex];

        const wb = challenge.challengeWaitBefore ?? 0;
        if (wb > 0)
            await HSUtils.sleepUntilElapsed(this.#prevActionTime, wb, this.context);

        switch (challenge.challengeNumber) {
            case 401: {
                const phaseLoadout = this.#corruptionManager.getPhaseCorruptionLoadout(phaseConfig);
                if (phaseLoadout) await this.#corruptionManager.setCorruptions(phaseLoadout);
                break;
            }
            case LOADOUT_ACTION_VALUE:
                await this.#corruptionManager.applyLoadoutByName(challenge.loadoutName);
                break;
            case IF_JUMP_VALUE:
                return this.#handleIfJumpAction(challenge);
            default:
                if (challenge.challengeNumber >= 100) {
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
        }
        return null;
    }

    #handleIfJumpAction(challenge: Challenge): number | null {
        const jump = challenge.ifJump;
        const mode = jump?.ifJumpMode;
        const operator = jump?.ifJumpOperator;
        const jumpIndex = jump?.ifJumpIndex;

        switch (mode) {
            case "challenges": {
                const ifIdx = jump!.ifJumpChallenge ?? -1;
                const value = jump!.ifJumpValue ?? 0;
                const completions = this.#isExposureReady && ifIdx >= 1 && ifIdx <= 15
                    ? (ifIdx === 15
                        ? this.#exposedPlayer!.challenge15Exponent
                        : this.#exposedPlayer!.challengecompletions[ifIdx])
                    : (ifIdx >= 1 && ifIdx <= 15
                        ? this.#getChallengeAccessor(ifIdx).getCompletions().toNumber()
                        : 0);
                if (jumpIndex !== undefined &&
                    ((operator === ">" && completions > value) ||
                     (operator === "<" && completions < value))) {
                    return jumpIndex;
                }
                break;
            }
            case "stored_c15": {
                const exponent = jump!.ifJumpMultiplier ?? 0;
                const c15Score = this.#isExposureReady
                    ? this.#exposedPlayer!.challenge15Exponent
                    : this.#getChallengeAccessor(15).getCompletions().toNumber();
                if (jumpIndex !== undefined &&
                    ((operator === ">" && c15Score > this.#storedC15 + exponent) ||
                     (operator === "<" && c15Score < this.#storedC15 + exponent))) {
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
                this.#antSacrifice.click();
                break;
            case 153: // auto Challenge Toggle
                this.#autoChallengeButton.click();
                this.#exitTranscBtn.click();
                this.#exitReincBtn.click();
                break;
            case 154: // Auto Ant-Sac Toggle
                this.#autoAntSacrificeButton.click();
                break;
            case 155: // Auto Ascend Toggle
                this.#autoAscendButton.click();
                break;
            case 211:
            case 212:
            case 213:
            case 214: // Max C11-C14
                await this.#maxC11to14WithC10((actionId - 200) as 11 | 12 | 13 | 14);
                break;
            case 215: // store C15
                this.#storedC15 = this.#isExposureReady
                    ? this.#exposedPlayer!.challenge15Exponent
                    : this.#getChallengeAccessor(15).getCompletions().toNumber();
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
                await this.#C1to10UntilNoMoreCompletions((actionId - 600) as (1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10), waitTime, maxTime);
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
                this.#clickHeptractButton(actionId);
                break;
            case 901:
                this.#AOAG.click();
                break;
            case 902: // Restart AutoSing
                this.stopAutosing();
                window.setTimeout(() => this.enableAutoSing(), 500);
                break;
            case 903: // Stop AutoSing
                this.stopAutosing();
                break;
            default:
                HSLogger.warn(`Unknown special action ${actionId}`, this.context);
        }
    }

    #clickHeptractButton(actionId: number): void {
        this.#heptractBtns[actionId - 701]?.click();
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

        if (!challengeBtn || !accessor.levelElement) {
            HSLogger.debug(() => `Challenge element ${challengeIndex} not found - Autosing stopped.`, this.context);
            this.stopAutosing();
            return;
        }

        // Fast path: use exposedPlayer.currentChallenge instead of MutationObserver/class polling.
        // player.currentChallenge stores the absolute button index (1-15) per tier, 0 = not active.
        // Multiple tiers can be active simultaneously, but each challenge maps to exactly one field.
        if (this.#isExposureReady) {
            const p = this.#exposedPlayer!;
            const isChallengeActive = challengeIndex <= 5
                ? () => p.currentChallenge.transcension === challengeIndex
                : challengeIndex <= 10
                    ? () => p.currentChallenge.reincarnation === challengeIndex
                    : () => p.currentChallenge.ascension === challengeIndex;
            while (isChallengeActive()) await HSUtils.waitForNextTick();
            this.#fastDoubleClick(challengeBtn);
            while (!isChallengeActive()) await HSUtils.waitForNextTick();
        } else {
            while (!await HSUtils.waitForClassCondition(challengeBtn, () => !isActive(), 500));
            this.#fastDoubleClick(challengeBtn);
            while (!await HSUtils.waitForClassCondition(challengeBtn, () => isActive(), 500));
        }

        const endTime = performance.now() + maxTime;

        // Fast path: C1-C15 with exposed player — no DOM reads, no Decimal.
        // C1-C14: challengecompletions[i] capped by getMaxChallenges(i).
        // C15: challenge15Exponent (raw score, unbounded — maxPossible = Infinity never fires).
        if (this.#isExposureReady) {
            const p2 = this.#exposedPlayer!;
            const isC15 = challengeIndex === 15;
            const maxPossible = isC15 ? Infinity : this.#getMaxChallengesFunc!(challengeIndex);

            while (true) {
                const now = performance.now();
                if (now >= endTime) break;

                if (!this.#autosingEnabled) return;

                const current = isC15 ? p2.challenge15Exponent : p2.challengecompletions[challengeIndex];
                if (current >= maxPossible) return;

                if (current >= minCompletions) {
                    if (waitTime > 0) await HSUtils.sleep(waitTime);
                    if (HSLogger.isDebugEnabled) HSLogger.debug(() => `-------> C${challengeIndex}: ${current} ${isC15 ? 'exponent' : 'completions'} reached`, this.context);
                    return;
                }

                const remaining = endTime - now;
                remaining < sleepInterval ? await HSUtils.sleep(remaining) : await HSUtils.waitForNextTick();
            }
        } else {
            // Fallback: DOM text parsing + Decimal
            const getLevelText = accessor.getLevelText;
            const getCompletions = accessor.getCompletions;
            const maxPossible = accessor.getGoal();
            const minCompletionsDecimal = minCompletions === 0 ? HSAutosing.#DECIMAL_0 : new Decimal(minCompletions);
            let lastText = '';
            let currentCompletions = HSAutosing.#DECIMAL_0;

            while (true) {
                const now = performance.now();
                if (now >= endTime) break;
                if (!this.#autosingEnabled) return;

                const rawText = getLevelText();
                if (rawText !== lastText) {
                    lastText = rawText;
                    currentCompletions = getCompletions();
                }

                if (currentCompletions.gte(maxPossible)) return;
                if (currentCompletions.gte(minCompletionsDecimal)) {
                    if (waitTime > 0) await HSUtils.sleep(waitTime);
                    if (HSLogger.isDebugEnabled) HSLogger.debug(() => `-------> C${challengeIndex}: ${currentCompletions} completions reached`, this.context);
                    return;
                }

                const remaining = endTime - now;
                await HSUtils.sleep(remaining < sleepInterval ? remaining : sleepInterval);
            }
        }

        // No warning if minCompletions = 0 because it's ok strategy-wise
        if (challengeIndex <= 10 && minCompletions !== 0) {
            HSLogger.warn(`-------> Timeout: C${challengeIndex} failed to reach ${minCompletions} completions within ${maxTime} ms`, this.context);
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
                const goalText = getLevelText();
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
        if (!levelElement) return;

        if (this.#isExposureReady) {
            const maxPossible = this.#getMaxChallengesFunc!(challengeIndex);
            if (this.#exposedPlayer!.challengecompletions[challengeIndex] >= maxPossible) return;

            await new Promise<void>((resolve) => {
                let finished = false;
                const cleanup = (): void => {
                    if (finished) return;
                    finished = true;
                    clearTimeout(timeoutId);
                    observer.disconnect();
                    resolve();
                };
                const observer = new MutationObserver(() => { if (this.#exposedPlayer!.challengecompletions[challengeIndex] >= maxPossible) cleanup(); });
                const timeoutId = window.setTimeout(() => cleanup(), 3000);

                observer.observe(levelElement, { childList: true, characterData: true, subtree: true });
                if (this.#exposedPlayer!.challengecompletions[challengeIndex] >= maxPossible) cleanup();
            });
        } else {
            // Fallback: DOM text parsing + Decimal
            const getCompletions = accessor.getCompletions;
            const maxPossible = accessor.getGoal();
            if (getCompletions().gte(maxPossible)) return;

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
    }

    async #C1to10UntilNoMoreCompletions(challengeIndex: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10, initialWaitTime: number, maxTime: number): Promise<void> {
        await this.#waitForCompletion(challengeIndex, 0, 0, 0);

        await HSUtils.sleep(initialWaitTime);

        // Fast path: use exposedPlayer.challengecompletions instead of MutationObserver/class polling.
        if (this.#isExposureReady) {
            const p = this.#exposedPlayer!;
            const maxPossible = this.#getMaxChallengesFunc!(challengeIndex);
            let currentCompletions = p.challengecompletions[challengeIndex];
            let timeSinceNoMoreCompletion = performance.now();
            let deadline = timeSinceNoMoreCompletion + maxTime;

            while (true) {
                if (!this.#autosingEnabled) return;

                const now = performance.now();
                const newCompletions = p.challengecompletions[challengeIndex];
                if (newCompletions !== currentCompletions) {
                    currentCompletions = newCompletions;
                    timeSinceNoMoreCompletion = now;
                    deadline = now + maxTime;
                }

                if (now >= deadline || currentCompletions >= maxPossible) {
                    if (HSLogger.isDebugEnabled) HSLogger.debug(() => `C${challengeIndex}: maxed or no more completions after ${maxTime}ms`, this.context);
                    return;
                }

                await HSUtils.waitForNextTick();
            }
        } else {
            // Fallback: DOM text parsing + Decimal
            const accessor = this.#getChallengeAccessor(challengeIndex);
            const getLevelText = accessor.getLevelText;
            const getCompletions = accessor.getCompletions;
            const maxPossible = accessor.getGoal();
            let c1to10CurrentCompletions = getCompletions();
            let timeSinceNoMoreCompletion = performance.now();
            let lastRawText = getLevelText();

            while (true) {
                if (!this.#autosingEnabled) return;

                const now = performance.now();
                const rawText = getLevelText();
                if (rawText !== lastRawText) {
                    lastRawText = rawText;
                    const newCompletions = getCompletions();
                    if (!newCompletions.eq(c1to10CurrentCompletions)) {
                        c1to10CurrentCompletions = newCompletions;
                        timeSinceNoMoreCompletion = now;
                    }
                }

                if (now >= timeSinceNoMoreCompletion + maxTime || c1to10CurrentCompletions.gte(maxPossible)) {
                    if (HSLogger.isDebugEnabled) HSLogger.debug(() => `C${challengeIndex}: maxed or no more completions after ${maxTime}ms`, this.context);
                    return;
                }

                await HSUtils.waitForNextTick();
            }
        }
    }

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
            if (isGreen()) {
                window.clearTimeout(timer);
                observer.disconnect();
                resolve(true);
            }
        });

        const elapsedStr = (performance.now() - waitStart).toFixed(0);
        if (turned) HSLogger.debug(() => `[COIN-FIX] #upg81 turned green after ${elapsedStr}ms`, this.context);
        else        HSLogger.warn(`[COIN-FIX] #upg81 still not green after ${maxWaitMs}ms...`, this.context);
    }


    // ============================================================================
    // AMBROSIA LOADOUT
    // ============================================================================

    async #setAmbrosiaLoadout(loadout: HTMLButtonElement): Promise<void> {
        loadout.click();
        if (this.#isInAmbLoadout(loadout)) return;
        while (!await HSUtils.waitForClassCondition(loadout, () => this.#isInAmbLoadout(loadout), 500));
    }

    #isInAmbLoadout(loadout: HTMLButtonElement): boolean {
        return loadout.classList.contains('hs-rainbow-border');
    }


    // ============================================================================
    // STAGE & PHASES
    // ============================================================================

    async #getStage(): Promise<string> {
        if (this.#isExposureReady) {
            // Fast path has the function: never fall through to DOM navigation.
            // A transient throw during a sing transition returns '' so the wait
            // loop retries on the next tick rather than navigating to Settings.
            try {
                return this.#stageFunc!(0);
            } catch (error) {
                if (HSLogger.isDebugEnabled) HSLogger.debug(() => `Error getting stage from stageFunc: ${error}`, this.context);
                return '';
            }
        }

        // No fast path — warn once, then try text content, then fall back to DOM navigation.
        if (!this.#hasWarnedMissingStageFunc) {
            HSLogger.warn("Performance Warning: 'synergismStage' function not exposed.", this.context);
            this.#hasWarnedMissingStageFunc = true;
        }

        try {
            const raw = this.#stage?.textContent ?? '';
            const m = raw.match(STAGE_REGEX);
            if (m && m[1]) {
                return m[1].trim();
            }
        } catch (e) { HSLogger.warn(`Error reading stage element: ${e}`, this.context); }

        return this.#getStageViaDOM();
    }

    async #getStageViaDOM(): Promise<string> {
        HSLogger.debug(() => "Getting stage via DOM navigation (slow)", this.context);
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

    #getPhaseIndex(phase: PhaseOption): number {
        return this.#phaseIndexByOption.get(phase) ?? -1;
    }

    #rebuildStrategyPhaseCaches(): void {
        if (!this.#strategy) {
            this.#strategyPhaseRanges = undefined;
            this.#finalPhaseConfig = undefined;
            return;
        }

        this.#finalPhaseConfig = this.#strategy.strategy.find(p => p.endPhase === 'end');
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
        // TODO: investigate tab switching / not restoring...
        // HSLogger.debug(() => `saving prevMainView: ${prevMainView.getName()}`, this.context);

        let q: number;
        let gq: number;
        let c15ScoreBeforeSinging: Decimal;
        if (this.#isExposureReady) {
            q = Number(this.#exposedPlayer!.worlds);
            gq = Number(this.#exposedPlayer!.goldenQuarks);
            c15ScoreBeforeSinging = new Decimal(this.#exposedPlayer!.challenge15Exponent);
        } else {
            const data = await this.#gameDataAPI?.getLatestAutosingData();
            q = data?.quarks ?? 0;
            gq = data?.goldenQuarks ?? 0;
            c15ScoreBeforeSinging = this.#getChallengeAccessor(15).getCompletions();
        }
        const happyHourStackAmount = this.#gameDataAPI?.getEventData()?.HAPPY_HOUR_BELL.amount ?? 0;
        const gqGain = Math.max(0, gq - this.#previousGoldenQuarkAmount);
        const qGain = Math.max(0, q - this.#previousQuarkAmount);
        this.#previousQuarkAmount = q;
        this.#previousGoldenQuarkAmount = gq;

        await this.#enterAndLeaveExalt();
        this.#endStageDone = false;
        this.#observerActivated = false;
        if (this.#isExposureReady) {
            this.#teleportLowerFunc!(this.#targetSingularity);
        } else {
            this.#elevatorInput.value = this.#targetSingularity.toString();
            this.#elevatorInput.dispatchEvent(new Event('input', { bubbles: true }));
            this.#elevatorTeleportButton.click();
        }

        const stageInitial = await this.#getStage();

        if (!skipRecord) {
            this.#autosingModal?.recordSingularity(gqGain, gq, qGain, q, happyHourStackAmount, c15ScoreBeforeSinging);
        }

        prevMainView.goto();
        // HSLogger.debug(() => `restoring prevMainView: ${prevMainView.getName()}`, this.context);
        HSLogger.debug(() => "Singularity performed", this.context);

        let stage = stageInitial;
        while (!this.#isAllowedStage(stage)) {
            await HSUtils.yield();
            stage = await this.#getStage();
        }
        HSLogger.debug(() => `Reached allowed stage: ${stage}`, this.context);

        this.#observeAntiquitiesRune();
        this.#prevActionTime = performance.now();
    }

    async #enterAndLeaveExalt(): Promise<void> {
        /*
        // Those two are 'less clean', and may not be needed with the auto-confirm...
        // Fast path: 
        if (this.#isExposureReady) {
            this.#enterExaltFunc!();
            this.#exitExaltFunc!();
            return;
        }*/
        this.#exalt2Btn.click();
        await this.#waitForExaltState(true);
        this.#exalt2Btn.click();
        await this.#waitForExaltState(false);
    }

    async #waitIfAutosingPaused(): Promise<void> {
        HSUI.Notify('Autosing is paused.');
        while (this.#autosingModal?.getIsPaused() && this.#autosingEnabled) { await HSUtils.sleep(500); }
        HSUI.Notify('Autosing resumed.');
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
                if (this.#isInExalt() === targetState) cleanup();
            });
            const timeoutId = window.setTimeout(() => { cleanup(); }, timeoutMs);

            observer.observe(exaltTimerElement, { attributes: true, attributeFilter: ['style', 'class'] });
            if (this.#isInExalt() === targetState) cleanup();
        });

        if (this.#isInExalt() !== targetState) {
            HSLogger.warn(`Timeout waiting for exalt ${targetState ? 'enter' : 'exit'} state; falling back to polling.`, this.context);
            while (this.#isInExalt() !== targetState) {
                await HSUtils.waitForNextTick();
            }
        }
    }

    #isInExalt(): boolean {
        // Fast path: use exposedPlayer. No heavy getComputedStyle.
        if (this.#isExposureReady) {
            return this.#exposedPlayer!.insideSingularityChallenge;
        }
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
                if ((mutation.target as HTMLElement).style.display === 'none') {
                    HSLogger.debug(() => 'antiquitiesRuneLockedContainer found hidden - buying antiquities', this.context);
                    this.#observerActivated = true;
                    this.#antiquitiesObserver?.disconnect();
                    this.#antiquitiesObserver = undefined;
                    this.#performFinalStage().catch(error => {
                        HSLogger.warn(`Error during final stage: ${error instanceof Error ? error.message : String(error)}`, this.context);
                        this.stopAutosing();
                    });
                    break;
                }
            }
        });

        this.#antiquitiesObserver.observe(this.#antiquitiesRuneLockedContainer, { attributes: true, attributeFilter: ['style'] });
    }


    // ============================================================================
    // FINAL STAGE (& optional push sing before stop)
    // ============================================================================

    async #performFinalStage(): Promise<void> {
        if (!this.#autosingEnabled || this.#endStagePromise) return;

        this.#endStagePromise = new Promise<void>(resolve => {
            this.#endStageResolve = resolve;
        });

        const aoagPhase = this.#strategy?.aoagPhase ?? createDefaultAoagPhase();
        aoagPhase.phaseId = AOAG_PHASE_ID;

        await this.#executePhase(aoagPhase, {
            phaseLabelOverride: AOAG_PHASE_NAME,
            ignoreObserverActivated: true
        });

        this.#prevActionTime = performance.now();
        await this.#matchStageToStrategy('final');

        if (this.#autosingEnabled) {
            await this.#setAmbrosiaLoadout(this.#ambrosia_quark);
            const exportBtn = this.#exportBtnClone ?? this.#exportBtn;

            if (exportBtn) {
                this.#saveType.checked = true;
                exportBtn.click();
            }

            this.#ascendBtn.click();

            if (this.#stopAtSingularitysEnd) {
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
        this.#ambrosia_luck.click();
        if (this.#addCodeAllBtn) this.#addCodeAllBtn.click();
        if (this.#timeCodeBtn) this.#timeCodeBtn.click();
        await HSUtils.waitForNextTick();
    }

    #parseDecimal(text: string): Decimal {
        const cleanText = text.replace(/,/g, '').trim();
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
