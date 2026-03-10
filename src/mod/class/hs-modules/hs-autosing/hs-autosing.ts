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
import { HSAutosingStrategy, GetFromDOMOptions, PhaseOption, phases, CorruptionLoadout, AutosingStrategyPhase, SPECIAL_ACTIONS, createDefaultAoagPhase, AOAG_PHASE_ID, AOAG_PHASE_NAME, LOADOUT_ACTION_VALUE, IF_JUMP_VALUE } from "../../../types/module-types/hs-autosing-types";
import { HSAutosingModal } from "./hs-autosingModal";
import { ALLOWED } from "../../../types/module-types/hs-autosing-types";
import { HSGlobal } from "../../hs-core/hs-global";
import { HSGameState, MainView } from "../../hs-core/hs-gamestate";
import { HSAutosingSettingsFixer } from './hs-autosingSettingsFixer';
import { PlayerData } from "../../../types/data-types/hs-player-savedata";

/*
    Class: HSAutosing
    IsExplicitHSModule: Yes
    Description: 
        Hypersynergism module that performs autosings.
    Author: XxmolkxX
*/

const ZERO_CORRUPTIONS: CorruptionLoadout = {
    viscosity: 0,
    drought: 0,
    deflation: 0,
    extinction: 0,
    illiteracy: 0,
    recession: 0,
    dilation: 0,
    hyperchallenge: 0,
};

const SPECIAL_ACTION_LABEL_BY_ID = new Map<number, string>(SPECIAL_ACTIONS.map((a) => [a.value, a.label] as const));

type ChallengeAccessor = {
    button?: HTMLButtonElement;
    levelElement?: HTMLParagraphElement;
    isActive: () => boolean;
    getLevelText: () => string;
    getCompletions: () => Decimal;
    getGoal: () => Decimal;
};

export class HSAutosing extends HSModule implements HSGameDataSubscriber {
    gameDataSubscriptionId?: string;

    private gameDataAPI?: HSGameDataAPI;
    private gameDataResolver?: (value: void) => void;
    private latestGameDataSnapshot?: PlayerData;
    private latestGameDataSnapshotTimestamp?: number;

    private strategy?: HSAutosingStrategy;
    private loadoutByName: Map<string, CorruptionLoadout> = new Map();
    private autosingEnabled = false;
    private targetSingularity = 0;
    private sleepTime = 10;
    private prevActionTime: number = 0;
    private stopAtSingularitysEnd: boolean = false;
    private hasWarnedMissingStageFunc: boolean = false;
    private storedC15: Decimal = new Decimal(0);
    private challengeAccessors: Record<number, ChallengeAccessor> = {};

    // DOM Elements - Settings & UI
    private settingsTab!: HTMLButtonElement;
    private settingsSubTab!: HTMLButtonElement;
    private misc!: HTMLButtonElement;
    private stage!: HTMLParagraphElement;

    // DOM Elements - Challenges
    private challengeButtons: Record<number, HTMLButtonElement> = {};
    private levelElements: Record<number, HTMLParagraphElement> = {};

    // DOM Elements - Challenge Actions
    private exitTranscBtn!: HTMLButtonElement;
    private exitReincBtn!: HTMLButtonElement;
    private exitAscBtn!: HTMLButtonElement;
    private ascendBtn!: HTMLButtonElement;

    // DOM Elements - Elevator & Navigation
    private elevatorTeleportButton!: HTMLButtonElement;
    private elevatorInput!: HTMLInputElement;

    // DOM Elements - Auto Toggles
    private autoChallengeButton!: HTMLButtonElement;
    private autoAntSacrificeButton!: HTMLButtonElement;
    private autoAscendButton!: HTMLButtonElement;

    // DOM Elements - Heptract Auto-Buy
    private chronosHeptAutoBuyBtn!: HTMLButtonElement;
    private hyperHeptAutoBuyBtn!: HTMLButtonElement;
    private quarkHeptAutoBuyBtn!: HTMLButtonElement;
    private challHeptAutoBuyBtn!: HTMLButtonElement;
    private abyssHeptAutoBuyBtn!: HTMLButtonElement;
    private accelHeptAutoBuyBtn!: HTMLButtonElement;
    private boostHeptAutoBuyBtn!: HTMLButtonElement;
    private multHeptAutoBuyBtn!: HTMLButtonElement;
    private orbsAutoBuyBtn!: HTMLButtonElement;

    // DOM Elements - Ambrosia Loadouts
    private ambrosia_early_cube!: HTMLButtonElement;
    private ambrosia_late_cube!: HTMLButtonElement;
    private ambrosia_quark!: HTMLButtonElement;
    private ambrosia_obt!: HTMLButtonElement;
    private ambrosia_off!: HTMLButtonElement;
    private ambrosia_luck!: HTMLButtonElement;

    // DOM Elements - Misc
    private antSacrifice!: HTMLButtonElement;
    private coin!: HTMLButtonElement;
    private AOAG!: HTMLButtonElement;
    private exalt2Btn!: HTMLButtonElement;
    private exaltTimer!: HTMLSpanElement;
    private importBtn!: HTMLButtonElement;
    private saveType!: HTMLInputElement;
    private exportBtn!: HTMLButtonElement;
    private exportBtnClone?: HTMLButtonElement;

    // DOM Elements - Corruptions
    private corrCurrent: Record<string, HTMLElement | null> = {};
    private corrNext: Record<string, HTMLElement | null> = {};
    private corruptionPromptInput!: HTMLInputElement;
    private corruptionPromptOkBtn!: HTMLButtonElement;
    private addCodeAllBtn!: HTMLButtonElement;
    private timeCodeBtn!: HTMLButtonElement;

    // DOM Elements - Antiquities
    private antiquitiesRuneLockedContainer!: HTMLDivElement;

    // State Management
    private endStageDone: boolean = false;
    private observerActivated: boolean = false;
    private endStagePromise?: Promise<void>;
    private endStageResolve?: () => void;
    private antiquitiesObserver?: MutationObserver;

    // Module References
    private stageFunc!: (arg0: number) => any;
    private gamestate!: HSGameState;
    private autosingSettingsFixer?: HSAutosingSettingsFixer;
    private autosingModal?: HSAutosingModal;

    // Strategy Caches
    private readonly phaseIndexByOption = new Map<PhaseOption, number>(phases.map((p, i) => [p, i] as const));
    private strategyPhaseRanges?: Array<{ phase: AutosingStrategyPhase; startIndex: number; endIndex: number }>;
    private finalPhaseConfig?: AutosingStrategyPhase;

    // ============================================================================
    // INITIALIZATION
    // ============================================================================

    init(): Promise<void> {
        HSLogger.log(`Initializing HSAutosing module`, this.context);

        this.autosingSettingsFixer = new HSAutosingSettingsFixer({ moduleName: 'HSAutosingSettingsFixer', context: this.context });

        this.autosingEnabled = false;
        this.targetSingularity = 0;
        this.cacheSettingsElements();
        this.cacheChallengeElements();
        this.cacheButtonElements();
        this.cacheCorruptionElements();
        this.cacheMiscElements();

        this.isInitialized = true;
        HSLogger.log(`HSAutosing module initialized`, this.context);
        return Promise.resolve();
    }

    private cacheSettingsElements(): void {
        this.settingsTab = document.getElementById('settingstab') as HTMLButtonElement;
        this.settingsSubTab = document.getElementById('switchSettingSubTab4') as HTMLButtonElement;
        this.misc = document.getElementById('kMisc') as HTMLButtonElement;
        this.stage = document.getElementById('gameStageStatistic') as HTMLParagraphElement;
    }

    private cacheChallengeElements(): void {
        for (let i = 1; i <= 15; i++) {
            const btn = document.getElementById(`challenge${i}`) as HTMLButtonElement;
            if (btn) this.challengeButtons[i] = btn;

            const el = document.getElementById(`challenge${i}level`) as HTMLParagraphElement;
            if (el) this.levelElements[i] = el;
        }
        this.buildChallengeAccessors();
    }

    private cacheButtonElements(): void {
        this.exitTranscBtn = document.getElementById('challengebtn') as HTMLButtonElement;
        this.exitReincBtn = document.getElementById('reincarnatechallengebtn') as HTMLButtonElement;
        this.exitAscBtn = document.getElementById('ascendChallengeBtn') as HTMLButtonElement;
        this.ascendBtn = document.getElementById('ascendbtn') as HTMLButtonElement;
        this.autoChallengeButton = document.getElementById('toggleAutoChallengeStart') as HTMLButtonElement;
        this.autoAntSacrificeButton = document.getElementById('toggleAutoSacrificeAnt') as HTMLButtonElement;
        this.autoAscendButton = document.getElementById('ascensionAutoEnable') as HTMLButtonElement;
        this.antSacrifice = document.getElementById(`antSacrifice`) as HTMLButtonElement;
        this.coin = document.getElementById('buycoin1') as HTMLButtonElement;
        this.AOAG = document.getElementById('antiquitiesRuneSacrifice') as HTMLButtonElement;
        this.exalt2Btn = document.getElementById('oneChallengeCap') as HTMLButtonElement;
        this.exaltTimer = document.getElementById('ascSingChallengeTimeTakenStats') as HTMLSpanElement;
        this.elevatorTeleportButton = document.getElementById('elevatorTeleportButton') as HTMLButtonElement;
        this.elevatorInput = document.getElementById('elevatorTargetInput') as HTMLInputElement;
        this.importBtn = document.querySelector('#corruptionLoadoutTable button.corrImport') as HTMLButtonElement;
    }

    private cacheHeptractButtons(): void {
        this.chronosHeptAutoBuyBtn = document.getElementById('chronosHepteractAuto') as HTMLButtonElement;
        this.hyperHeptAutoBuyBtn = document.getElementById('hyperrealismHepteractAuto') as HTMLButtonElement;
        this.quarkHeptAutoBuyBtn = document.getElementById('quarkHepteractAuto') as HTMLButtonElement;
        this.challHeptAutoBuyBtn = document.getElementById('challengeHepteractAuto') as HTMLButtonElement;
        this.abyssHeptAutoBuyBtn = document.getElementById('abyssHepteractAuto') as HTMLButtonElement;
        this.accelHeptAutoBuyBtn = document.getElementById('acceleratorHepteractAuto') as HTMLButtonElement;
        this.boostHeptAutoBuyBtn = document.getElementById('acceleratorBoostHepteractAuto') as HTMLButtonElement;
        this.multHeptAutoBuyBtn = document.getElementById('multiplierHepteractAuto') as HTMLButtonElement;
        this.orbsAutoBuyBtn = document.getElementById('hepteractToQuarkTradeAuto') as HTMLButtonElement;
    }

    private cacheCorruptionElements(): void {
        this.corruptionPromptInput = document.getElementById('prompt_text') as HTMLInputElement;
        this.corruptionPromptOkBtn = document.getElementById('ok_prompt') as HTMLButtonElement;
        this.addCodeAllBtn = document.getElementById("addCodeAll") as HTMLButtonElement;
        this.timeCodeBtn = document.getElementById("timeCode") as HTMLButtonElement;

        const corrNames = ["viscosity", "drought", "deflation", "extinction", "illiteracy", "recession", "dilation", "hyperchallenge"];
        corrNames.forEach(name => {
            this.corrCurrent[name] = document.getElementById(`corrCurrent${name}`);
            this.corrNext[name] = document.getElementById(`corrNext${name}`);
        });
    }

    private cacheMiscElements(): void {
        this.endStageDone = false;
        this.observerActivated = false;
        this.stageFunc = (window as any).__HS_synergismStage;
        this.antiquitiesRuneLockedContainer = document.getElementById('antiquitiesRuneLockedContainer') as HTMLDivElement;
        this.gamestate = HSModuleManager.getModule<HSGameState>("HSGameState") as HSGameState;
        this.saveType = document.getElementById('saveType') as HTMLInputElement;
        this.exportBtn = document.getElementById('exportgame') as HTMLButtonElement;
        this.exportBtnClone = this.exportBtn ? (this.exportBtn.cloneNode(true) as HTMLButtonElement) : undefined;

        if (this.exportBtnClone && (window as any).__HS_EXPORT_EXPOSED) {
            this.setupExportButtonClone();
        }
    }

    private setupExportButtonClone(): void {
        this.exportBtnClone!.addEventListener(
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
        return this.autosingEnabled;
    }

    setStopAtSingularitysEnd(value: boolean): void {
        this.stopAtSingularitysEnd = value;
    }

    getStopAtSingularitysEnd(): boolean {
        return this.stopAtSingularitysEnd;
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
        this.refreshGameDataSnapshot();
        if (this.gameDataResolver) {
            this.gameDataResolver();
            this.gameDataResolver = undefined;
        }
        return Promise.resolve();
    }

    private refreshGameDataSnapshot(): void {
        if (this.gameDataAPI) {
            const data = this.gameDataAPI.getGameData();
            this.latestGameDataSnapshot = data;
            if (typeof data !== 'undefined') {
                this.latestGameDataSnapshotTimestamp = Date.now();
            }
        }
    }

    private getGameDataSnapshot(): PlayerData | undefined {
        const now = Date.now();
        const ageMs = this.latestGameDataSnapshotTimestamp ? now - this.latestGameDataSnapshotTimestamp : Infinity;
        if (!this.latestGameDataSnapshot || ageMs > 1000) {
            this.refreshGameDataSnapshot();
        }
        return this.latestGameDataSnapshot;
    }

    // ============================================================================
    // ENABLE / DISABLE AUTOSING
    // ============================================================================

    async enableAutoSing(): Promise<void> {
        if (!HSGlobal.General.isModFullyLoaded) {
            HSUI.Notify("Hypersynergism is still loading. Please wait before starting Auto-Sing.", { notificationType: "warning" });
            return;
        }

        if (this.isInExalt()) {
            HSUI.Notify("Cannot start Auto-Sing while inside a singularity challenge.", { notificationType: "warning" });
            return;
        }

        this.autosingEnabled = true;
        this.stopAtSingularitysEnd = false;
        this.endStagePromise = undefined;

        if (!await this.validateAutosingSetup()) {
            this.stopAutosing();
            return;
        }

        this.gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        this.refreshGameDataSnapshot();
        this.subscribeGameDataChanges();
        await new Promise<void>(resolve => {
            this.gameDataResolver = resolve;
        });
        this.refreshGameDataSnapshot();
        const gameData = this.getGameDataSnapshot();

        if (!await this.validateSingularityRequirements(gameData)) {
            this.stopAutosing();
            return;
        }

        const strategy = await this.loadStrategy();
        if (!strategy) {
            this.stopAutosing();
            return;
        }

        this.strategy = strategy;
        this.rebuildStrategyPhaseCaches();
        this.buildLoadoutCache();

        await this.loadAmbrosiaLoadoutButtons();

        HSLogger.log(`Autosing enabled for target singularity: ${this.targetSingularity}`, this.context);

        this.autosingModal?.destroy();
        this.autosingModal = new HSAutosingModal();

        if (!this.autosingSettingsFixer) {
            this.autosingSettingsFixer = new HSAutosingSettingsFixer({ moduleName: 'HSAutosingSettingsFixer', context: this.context });
        }
        await this.autosingSettingsFixer.fixAllSettings();

        this.performAutosingLogic();
    }

    public stopAutosing(options?: { showReviewModal?: boolean }): void {
        if (!this.autosingEnabled) { return; }
        const showReviewModal = options?.showReviewModal ?? false;

        this.stopAutosingCore({
            modalDisposition: showReviewModal ? 'review' : 'destroy'
        });

            const singSetting = HSSettings.getSetting("startAutosing");
            if (singSetting && singSetting.isEnabled()) {
                singSetting.disable();
            }

        HSLogger.log(`Autosing stopped.`, this.context);
    }

    private stopAutosingCore(options: { modalDisposition: 'review' | 'destroy' }): void {
        this.autosingEnabled = false;
        this.saveType.checked = false;
        this.unsubscribeGameDataChanges();
        this.antiquitiesObserver?.disconnect();
        this.antiquitiesObserver = undefined;

        if (this.endStageResolve) {
            try {
                this.endStageResolve();
            } catch (e) {
                /* ignore */
            }
            this.endStageResolve = undefined;
        }

        this.endStagePromise = undefined;

        if (this.autosingModal) {
            if (options.modalDisposition === 'review') {
                this.autosingModal.enterReviewMode();
            } else {
                this.autosingModal.destroy();
                this.autosingModal = undefined;
            }
        }

        HSUtils.stopDialogWatcher();
    }

    public closeAutosingModalAfterReview(): void {
        if (this.autosingModal) {
            this.autosingModal.destroy();
            this.autosingModal = undefined;
        }
    }

    private async validateAutosingSetup(): Promise<boolean> {
        HSUtils.startDialogWatcher();

        const quickbarSetting = HSSettings.getSetting('ambrosiaQuickBar');
        if (quickbarSetting && !quickbarSetting.isEnabled()) {
            HSLogger.log("Autosing requirement: Enabling Ambrosia Quick Bar now.", this.context);
            quickbarSetting.enable();
        }

        const singularitySetting = HSSettings.getSetting('singularityNumber') as HSNumericSetting;
        this.targetSingularity = singularitySetting.getValue();

        return true;
    }

    private async validateSingularityRequirements(gameData: any): Promise<boolean> {
        if (!gameData) {
            HSLogger.debug("Could not get game data", this.context);
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

        if (this.targetSingularity > gameData.highestSingularityCount) {
            HSLogger.log(`Target singularity bigger than highest. Going to highest.`);
            this.targetSingularity = gameData.highestSingularityCount;
        }

        return true;
    }

    private async loadStrategy(): Promise<HSAutosingStrategy | null> {
        const strategySetting = HSSettings.getSetting("autosingStrategy");
        const selectedValue = strategySetting.getValue();
        const control = strategySetting.getDefinition().settingControl;

        if (!control?.selectOptions) {
            HSUI.Notify("Strategy selector not available", { notificationType: "warning" });
            return null;
        }

        const selectedOption = control.selectOptions.find(
            opt => opt.value.toString() === HSUtils.asString(selectedValue)
        );

        if (!selectedOption) {
            HSUI.Notify("Selected strategy not found - Autosing stopped", { notificationType: "warning" });
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
            HSLogger.debug(`Autosing: Strategy "${selectedRawName}" not found or failed to load.`, this.context);
            HSUI.Notify("Could not find or load strategy", { notificationType: "warning" });
            return null;
        }

        // Strategies are stored with OLD special action IDs for cross-version compatibility.
        // Migrate to new IDs in-memory only — this copy is never persisted.
        const runtimeStrategy: HSAutosingStrategy = JSON.parse(JSON.stringify(strategy));
        HSSettings.migrateStrategyActionIdsAuto(runtimeStrategy, 'toNew');
        HSLogger.log(`Autosing: loaded strategy "${selectedRawName}" (migrated to runtime IDs in-memory)`, this.context);

        return runtimeStrategy;
    }

    private async loadAmbrosiaLoadoutButtons(): Promise<void> {
        const earlyCubeVal = HSSettings.getSetting("autosingEarlyCubeLoadout").getValue();
        const lateCubeVal = HSSettings.getSetting("autosingLateCubeLoadout").getValue();
        const quarkVal = HSSettings.getSetting("autosingQuarkLoadout").getValue();
        const obtVal = HSSettings.getSetting("autosingObtLoadout").getValue();
        const offVal = HSSettings.getSetting("autosingOffLoadout").getValue();
        const ambrosiaVal = HSSettings.getSetting("autosingAmbrosiaLoadout").getValue();

        const ambPrefix = HSGlobal.HSAmbrosia.quickBarLoadoutIdPrefix;
        this.ambrosia_early_cube = document.getElementById(`${ambPrefix}-blueberryLoadout${earlyCubeVal}`) as HTMLButtonElement;
        this.ambrosia_late_cube = document.getElementById(`${ambPrefix}-blueberryLoadout${lateCubeVal}`) as HTMLButtonElement;
        this.ambrosia_quark = document.getElementById(`${ambPrefix}-blueberryLoadout${quarkVal}`) as HTMLButtonElement;
        this.ambrosia_obt = document.getElementById(`${ambPrefix}-blueberryLoadout${obtVal}`) as HTMLButtonElement;
        this.ambrosia_off = document.getElementById(`${ambPrefix}-blueberryLoadout${offVal}`) as HTMLButtonElement;
        this.ambrosia_luck = document.getElementById(`${ambPrefix}-blueberryLoadout${ambrosiaVal}`) as HTMLButtonElement;

        if (!this.ambrosia_early_cube || !this.ambrosia_late_cube || !this.ambrosia_quark || !this.ambrosia_obt || !this.ambrosia_off || !this.ambrosia_luck) {
            HSLogger.debug("Autosing: Required Ambrosia loadout buttons missing.", this.context);
            HSUI.Notify("Could not find all required Ambrosia loadout buttons", { notificationType: "warning" });
            throw new Error("Missing ambrosia loadout buttons");
        }
    }

    // ============================================================================
    // MAIN AUTOSING LOGIC
    // ============================================================================

    private async performAutosingLogic(): Promise<void> {
        this.ambrosia_luck.click();
        await this.useAddAndTimeCodes();

        try {
            if (this.autosingModal) {
                const { HSQuickbarManager } = await import("../hs-quickbarManager");
                await HSQuickbarManager.getInstance().whenSectionInjected('ambrosia');
                const q = await this.getCurrentQuarks();
                const gq = await this.getCurrentGoldenQuarks();
                this.autosingModal.start(this.strategy!, q, gq);
                this.autosingModal.show();
            }

            await this.performSingularity(true);

            while (this.isAutosingEnabled()) {
                if (this.endStageDone || this.observerActivated) {
                    await this.endStagePromise;
                    continue;
                }

                while (this.isAutosingEnabled() && !this.endStageDone && !this.observerActivated) {
                    const stage = await this.getStage();
                    await this.matchStageToStrategy(stage);
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            HSLogger.debug(`Error during autosing logic: ${errorMessage}`, this.context);
            this.stopAutosing();
        }
    }

    private async matchStageToStrategy(stage: string | null): Promise<void> {
        if (!stage || !this.strategy) return;

        if (!this.strategyPhaseRanges) this.rebuildStrategyPhaseCaches();

        let phaseConfig: AutosingStrategyPhase | null = null;
        let stageStart: PhaseOption | null = null;
        let stageEnd: PhaseOption | null = null;

        if (stage === 'final') {
            phaseConfig = this.finalPhaseConfig ?? null;
            if (!phaseConfig) {
                HSLogger.debug("No final phase found in strategy", this.context);
                return;
            }

            stageStart = phaseConfig.startPhase;
            stageEnd = phaseConfig.endPhase;

            await this.executePhase(phaseConfig);
            return;
        }

        // Find the unique dash split where both sides are valid PhaseOptions
        for (let dashIndex = stage.indexOf('-'); dashIndex !== -1; dashIndex = stage.indexOf('-', dashIndex + 1)) {
            const startCandidate = stage.slice(0, dashIndex);
            const endCandidate = stage.slice(dashIndex + 1);

            if (this.isPhaseOption(startCandidate) && this.isPhaseOption(endCandidate)) {
                stageStart = startCandidate;
                stageEnd = endCandidate;
                break;
            }
        }

        if (!stageStart || !stageEnd) {
            stageStart = "singularity";
            stageEnd = "end";
        }

        const stageStartIndex: number = this.getPhaseIndex(stageStart);
        const stageEndIndex: number = this.getPhaseIndex(stageEnd);

        if (stageStartIndex === -1 || stageEndIndex === -1) {
            HSLogger.debug(`Unknown stage ${stage}`, this.context);
            return;
        }

        const ranges = this.strategyPhaseRanges ?? [];
        phaseConfig = ranges.find((r) => stageStartIndex >= r.startIndex && stageEndIndex <= r.endIndex)?.phase ?? null;

        if (!phaseConfig) {
            HSLogger.debug(`No strategy phase matched for stage ${stage}`, this.context);
            return;
        }

        HSLogger.debug(`executing phase: ${phaseConfig.startPhase}-${phaseConfig.endPhase}`, this.context);
        await this.executePhase(phaseConfig);
    }

    // ============================================================================
    // PHASE EXECUTION
    // ============================================================================

    private async executePhase(
        phaseConfig: AutosingStrategyPhase,
        options?: {
            phaseLabelOverride?: string;
            skipInitialCorruptions?: boolean;
            skipInitialAscend?: boolean;
            ignoreObserverActivated?: boolean;
        }
    ): Promise<void> {
        const phaseLabel = options?.phaseLabelOverride ?? `${phaseConfig.startPhase}-${phaseConfig.endPhase}`;
        this.autosingModal?.setCurrentPhase(phaseLabel);

        if (!options?.skipInitialCorruptions) {
            const phaseLoadout = this.getPhaseCorruptionLoadout(phaseConfig);
            if (phaseLoadout) {
                await this.setCorruptions(phaseLoadout);
            }
        }

        if (!options?.skipInitialAscend) {
            this.ascendBtn.click();
        }

        for (let i = 0; i < phaseConfig.strat.length; i++) {
            // Autosing disabled or AOAG observer activated
            if (!this.autosingEnabled || (this.observerActivated && !(phaseConfig.endPhase === "end") && !options?.ignoreObserverActivated)) {
                this.autosingModal?.recordPhase(phaseLabel);
                return;
            }

            if (this.autosingModal?.getIsPaused()) {
                HSUI.Notify('Autosing is paused.');
                while (this.autosingModal?.getIsPaused() && this.isAutosingEnabled()) {
                    await HSUtils.sleep(500);
                }
                HSUI.Notify('Autosing resumed.');
            }

            const jumpIndex = await this.executeStrategyAction(phaseConfig, i);
            if (typeof jumpIndex === 'number') {
                // set loop index to jumpIndex-1 because the for-loop will increment it
                i = jumpIndex - 1;
            }
            this.prevActionTime = performance.now();
        }

        if (phaseConfig.endPhase == "end") {
            this.endStageDone = true;
        }
        
        // setTimeout to avoid loosing ~2ms in the critical path ?...
        setTimeout(() => this.autosingModal?.recordPhase(phaseLabel), 0);
    }

    private async executeStrategyAction(phaseConfig: AutosingStrategyPhase, actionIndex: number): Promise<number | null> {
        const challenge = phaseConfig.strat[actionIndex];

        if (challenge.challengeWaitBefore && challenge.challengeWaitBefore > 0) {
            await HSUtils.sleepUntilElapsed(this.prevActionTime, challenge.challengeWaitBefore);
        }

        if (challenge.challengeNumber == 401) {
            const phaseLoadout = this.getPhaseCorruptionLoadout(phaseConfig);
            if (phaseLoadout) {
                await this.setCorruptions(phaseLoadout);
            }
        } else if (challenge.challengeNumber == LOADOUT_ACTION_VALUE) {
            await this.applyLoadoutByName(challenge.loadoutName);
        } else if (challenge.challengeNumber == IF_JUMP_VALUE) {
            return await this.handleIfJumpAction(challenge);
        } else if (challenge.challengeNumber >= 100) {
            HSLogger.debug(`Autosing: Performing special action: ${SPECIAL_ACTION_LABEL_BY_ID.get(challenge.challengeNumber) ?? challenge.challengeNumber}`, this.context);
            await this.performSpecialAction(challenge.challengeNumber, challenge.challengeWaitTime, challenge.challengeMaxTime);
        } else {
            HSLogger.debug(`Autosing: waiting for: ${challenge.challengeCompletions ?? 0} completions of challenge${challenge.challengeNumber}, max time: ${challenge.challengeMaxTime}`, this.context);
            await this.waitForCompletion(
                challenge.challengeNumber,
                challenge.challengeCompletions ?? 0,
                challenge.challengeMaxTime,
                challenge.challengeWaitTime,
            );
        }

        return null;
    }

    private async handleIfJumpAction(challenge: any): Promise<number | null> {
        const mode = challenge.ifJump?.ifJumpMode;
        const operator = challenge.ifJump?.ifJumpOperator;

        switch (mode) {
            case "challenges":
                const _ifIdx = challenge.ifJump?.ifJumpChallenge ?? -1;
                const challengeCompletions = (_ifIdx >= 1 && _ifIdx <= 15)
                    ? this.getChallengeAccessor(_ifIdx).getCompletions()
                    : new Decimal(0);
                if (operator === ">" && challengeCompletions.gt(challenge.ifJump?.ifJumpValue ?? 0)) {
                    if (challenge.ifJump?.ifJumpIndex !== undefined) {
                        return challenge.ifJump.ifJumpIndex;
                    }
                } else if (operator === "<" && challengeCompletions.lt(challenge.ifJump?.ifJumpValue ?? 0)) {
                    if (challenge.ifJump?.ifJumpIndex !== undefined) {
                        return challenge.ifJump.ifJumpIndex;
                    }
                }
                break;
            case "stored_c15":
                const exponent = challenge.ifJump?.ifJumpMultiplier ?? 0;
                const c15Score = this.getChallengeAccessor(15).getCompletions();
                const targetStats = this.storedC15.plus(exponent);

                if ((operator === ">" && c15Score.gt(targetStats)) ||
                    (operator === "<" && c15Score.lt(targetStats))) {
                    if (challenge.ifJump?.ifJumpIndex !== undefined) {
                        return challenge.ifJump.ifJumpIndex;
                    }
                }
                break;
        }

        return null;
    }

    // ============================================================================
    // SPECIAL ACTIONS
    // ============================================================================

    private async performSpecialAction(actionId: number, waitTime: number, maxTime: number): Promise<void> {
        switch (actionId) {
            case 101: // Exit Transcension challenge
                this.exitTranscBtn.click();
                break;
            case 102: // Exit Reincarnation challenge
                this.exitReincBtn.click();
                break;
            case 103: // Exit Ascension challenge
                this.exitAscBtn.click();
                break;
            case 104:
                this.ascendBtn.click();
                break;
            case 151: // Wait
                break;
            case 152: // Ant sac
                await this.antSacrifice.click();
                break;
            case 153: // auto Challenge Toggle
                this.autoChallengeButton.click();
                this.exitTranscBtn.click();
                this.exitReincBtn.click();
                break;
            case 154: // Auto Ant-Sac Toggle
                await this.autoAntSacrificeButton.click();
                break;
            case 155: // Auto Ascend Toggle
                await this.autoAscendButton.click();
                break;
            case 211: // Max C11
                await this.maxC11to14WithC10(11);
                break;
            case 212: // Max C12
                await this.maxC11to14WithC10(12);
                break;
            case 213: // Max C13
                await this.maxC11to14WithC10(13);
                break;
            case 214: // Max C14
                await this.maxC11to14WithC10(14);
                break;
            case 215: // store C15
                this.storedC15 = this.getChallengeAccessor(15).getCompletions();
                break;
            case 301: // Early Cube
                await this.setAmbrosiaLoadout(this.ambrosia_early_cube);
                break;
            case 302: // Late Cube
                await this.setAmbrosiaLoadout(this.ambrosia_late_cube);
                break;
            case 303: // Quark
                await this.setAmbrosiaLoadout(this.ambrosia_quark);
                break;
            case 304: // Obt loadout
                await this.setAmbrosiaLoadout(this.ambrosia_obt);
                break;
            case 305: // Off loadout
                await this.setAmbrosiaLoadout(this.ambrosia_off);
                break;
            case 306: // Ambrosia loadout
                await this.setAmbrosiaLoadout(this.ambrosia_luck);
                break;
            case 400: // Zero Corruptions
                await this.setCorruptions(ZERO_CORRUPTIONS);
                break;
            case 402: // Ant Corruptions
                const antCorruptions = { viscosity: 16, drought: 0, deflation: 16, extinction: 0, illiteracy: 5, recession: 16, dilation: 0, hyperchallenge: 16 } as CorruptionLoadout;
                await this.setCorruptions(antCorruptions);
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
                await this.C1to10UntilNoMoreCompletions((actionId - 600) as any, waitTime, maxTime);
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
                await this.clickHeptractButton(actionId);
                break;
            case 901:
                this.AOAG.click();
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

    private async clickHeptractButton(actionId: number): Promise<void> {
        switch (actionId) {
            case 701:
                this.chronosHeptAutoBuyBtn?.click();
                break;
            case 702:
                this.hyperHeptAutoBuyBtn?.click();
                break;
            case 703:
                this.quarkHeptAutoBuyBtn?.click();
                break;
            case 704:
                this.challHeptAutoBuyBtn?.click();
                break;
            case 705:
                this.abyssHeptAutoBuyBtn?.click();
                break;
            case 706:
                this.accelHeptAutoBuyBtn?.click();
                break;
            case 707:
                this.boostHeptAutoBuyBtn?.click();
                break;
            case 708:
                this.multHeptAutoBuyBtn?.click();
                break;
            case 709:
                this.orbsAutoBuyBtn?.click();
                break;
        }
    }



    private async waitForCompletion(
        challengeIndex: number,
        minCompletions: number,
        maxTime: number = 99999999,
        waitTime: number = 0
    ): Promise<void> {
        const sleepInterval = 5;
        const accessor = this.getChallengeAccessor(challengeIndex);
        const challengeBtn = accessor.button;
        const isActive = accessor.isActive;
        const getLevelText = accessor.getLevelText;
        const getCompletions = accessor.getCompletions;
        const getGoal = accessor.getGoal;

        if (!challengeBtn) {
            HSLogger.debug(`Challenge button ${challengeIndex} not found`, this.context);
            return;
        }

        if (!accessor.levelElement) {
            HSLogger.debug(`Challenge level element ${challengeIndex} not found`, this.context);
            return;
        }

        let attempts = 0;
        const maxAttempts = 5;
        while (isActive() && attempts < maxAttempts) {
            HSLogger.debug(`Already in challenge ${challengeIndex}, waiting for exit (attempt ${attempts + 1}/${maxAttempts})`, this.context);
            attempts++;
            await HSUtils.sleep(5);
        }

        while (!isActive()) {
            this.fastDoubleClick(challengeBtn);
            if (isActive()) {
                break;
            }
            await HSUtils.sleep(5);
        }

        if (!isActive()) {
            HSLogger.warn(`Timeout: Failed to enter challenge ${challengeIndex}`, this.context);
            return;
        }

        this.coin.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, isPrimary: true }));

        const startTime = performance.now();
        const endTime = startTime + maxTime;

        const maxPossible = challengeIndex === 15
            ? new Decimal(Infinity)
            : getGoal();
        const minCompletionsDecimal = new Decimal(minCompletions);
        let lastText = '';
        let currentCompletions = new Decimal(0);

        while (performance.now() < endTime) {
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
                HSLogger.debug(`Autosing: challenge${challengeIndex}. ${currentCompletions} completions reached`, this.context);
                return;
            }

            const nowInner = performance.now();
            const remaining = endTime - nowInner;
            const sleepMs = (remaining > 0 && remaining < sleepInterval) ? Math.max(0, remaining) : sleepInterval;
            await HSUtils.sleep(sleepMs);
        }

        // No warning if minCompletions = 0 because it's ok strategy-wise
        if (challengeIndex <= 10 && minCompletions !== 0) {
            HSLogger.warn(`Timeout: Challenge ${challengeIndex} failed to reach ${minCompletions} completions within ${maxTime} ms`, this.context);
        }
    }

    private getChallengeAccessor(challengeIndex: number): ChallengeAccessor {
        return this.challengeAccessors[challengeIndex] ?? this.makeChallengeAccessor(challengeIndex);
    }

    private buildChallengeAccessors(): void {
        for (let i = 1; i <= 15; i++) {
            this.challengeAccessors[i] = this.makeChallengeAccessor(i);
        }
    }

    private makeChallengeAccessor(challengeIndex: number): ChallengeAccessor {
        const challengeBtn = this.challengeButtons[challengeIndex];
        const levelElement = this.levelElements[challengeIndex];

        const getLevelText = () => levelElement?.textContent ?? '';
        const parseValue = (text: string) => new Decimal(this.parseNumber(text));

        const getCompletions = () => {
            const text = getLevelText();
            if (challengeIndex === 15) {
                return this.parseDecimal(text);
            }
            return parseValue(text.split('/')[0] ?? '0');
        };

        const getGoal = () => {
            if (!levelElement) {
                return new Decimal(9999);
            }
            const goalText = levelElement.innerText ?? '';
            if (goalText.includes('/')) {
                const parts = goalText.split('/');
                return challengeIndex === 15
                    ? this.parseDecimal(parts[1].trim())
                    : parseValue(parts[1].trim());
            }
            return new Decimal(9999);
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

    private async maxC11to14WithC10(challengeIndex: 11 | 12 | 13 | 14): Promise<void> {
        await this.waitForCompletion(challengeIndex, 0, 0, 0);
        await this.waitForCompletion(10, 0, 0, 0);

        let c11to14CurrentCompletions = this.getChallengeAccessor(challengeIndex).getCompletions();
        await HSUtils.sleep(50);

        while (true) {
            await HSUtils.sleep(50);
            const c11to14CurrentCompletions2 = this.getChallengeAccessor(challengeIndex).getCompletions();
            if (c11to14CurrentCompletions2.eq(c11to14CurrentCompletions)) {
                return;
            }
            c11to14CurrentCompletions = c11to14CurrentCompletions2;
        }
    }

    private async C1to10UntilNoMoreCompletions(challengeIndex: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10, initialWaitTime: number, maxTime: number): Promise<void> {
        await this.waitForCompletion(challengeIndex, 0, 0, 0);
        const accessor = this.getChallengeAccessor(challengeIndex);
        const getCompletions = accessor.getCompletions;
        const maxPossible = accessor.getGoal();
        let c1to10CurrentCompletions = getCompletions();
        let timeSinceNoMoreCompletion = performance.now();

        await HSUtils.sleep(initialWaitTime);

        while (true) {
            const c1to10CurrentCompletions2 = getCompletions();
            const now = performance.now();

            if (!c1to10CurrentCompletions2.eq(c1to10CurrentCompletions)) {
                timeSinceNoMoreCompletion = now;
                c1to10CurrentCompletions = c1to10CurrentCompletions2;
            }

            if (now >= timeSinceNoMoreCompletion + maxTime || c1to10CurrentCompletions2.gte(maxPossible)) {
                HSLogger.debug(`Challenge${challengeIndex}: maxed or no more completions after ${maxTime}ms`, this.context);
                return;
            }

            await HSUtils.sleep(10);
        }
    }

    // ============================================================================
    // CORRUPTION LOGIC
    // ============================================================================

    private async setCorruptions(corruptions: CorruptionLoadout): Promise<void> {
        if (!this.corruptionPromptInput || !this.corruptionPromptOkBtn) {
            HSLogger.debug("Error: could not access corruption prompt elements", this.context);
            return;
        }

        const jsonString = JSON.stringify(corruptions);
        const targetCorruptions = corruptions;

        while (true) {
            this.importBtn.click();
            this.corruptionPromptInput.value = jsonString;
            await HSUtils.click(this.corruptionPromptOkBtn);

            const current = this.getNextCorruptionsFromCache();
            if (this.corruptionsMatch(current, targetCorruptions)) {
                HSLogger.debug(`Corruptions set: ${this.stringifyCorruptions(corruptions)}`, this.context);
                break;
            }
            await HSUtils.sleep(this.sleepTime);
        }
    }

    private corruptionsMatch(a: CorruptionLoadout, b: CorruptionLoadout): boolean {
        return a.viscosity === b.viscosity &&
            a.drought === b.drought &&
            a.deflation === b.deflation &&
            a.extinction === b.extinction &&
            a.illiteracy === b.illiteracy &&
            a.recession === b.recession &&
            a.dilation === b.dilation &&
            a.hyperchallenge === b.hyperchallenge;
    }

    private getNextCorruptionsFromCache(): CorruptionLoadout {
        const getVal = (name: string) => {
            const el = this.corrNext[name];
            return el ? parseInt(el.textContent || '0', 10) : 0;
        };

        return {
            viscosity: getVal("viscosity"),
            drought: getVal("drought"),
            deflation: getVal("deflation"),
            extinction: getVal("extinction"),
            illiteracy: getVal("illiteracy"),
            recession: getVal("recession"),
            dilation: getVal("dilation"),
            hyperchallenge: getVal("hyperchallenge")
        };
    }

    private getPhaseCorruptionLoadout(phaseConfig: AutosingStrategyPhase): CorruptionLoadout | null {
        if (phaseConfig.corruptionLoadoutName === null || phaseConfig.corruptionLoadoutName === "") {
            return null;
        }

        if (phaseConfig.corruptionLoadoutName === undefined) {
            return phaseConfig.corruptions ?? null;
        }

        const named = this.getLoadoutByName(phaseConfig.corruptionLoadoutName);
        return named ?? phaseConfig.corruptions ?? null;
    }

    private async applyLoadoutByName(name?: string | null): Promise<void> {
        const loadout = this.getLoadoutByName(name);
        if (!loadout) {
            HSLogger.debug(`Loadout not found: ${name ?? "(none)"}`, this.context);
            return;
        }
        await this.setCorruptions(loadout);
    }

    private getLoadoutByName(name?: string | null): CorruptionLoadout | null {
        if (!name) return null;
        if (this.loadoutByName.size > 0) {
            const l = this.loadoutByName.get(name);
            return l ? { ...l } : null;
        }

        const loadouts = this.strategy?.corruptionLoadouts ?? [];
        const match = loadouts.find(loadout => loadout.name === name);
        return match ? { ...match.loadout } : null;
    }

    private stringifyCorruptions(loadout: CorruptionLoadout): string {
        return [
            loadout.viscosity,
            loadout.drought,
            loadout.deflation,
            loadout.extinction,
            loadout.illiteracy,
            loadout.recession,
            loadout.dilation,
            loadout.hyperchallenge
        ].join(',');
    }

    private buildLoadoutCache(): void {
        this.loadoutByName.clear();
        const defs = this.strategy?.corruptionLoadouts ?? [];
        for (const d of defs) {
            this.loadoutByName.set(d.name, { ...d.loadout });
        }
    }

    private antiBuyCoinBug(initialDelayMs = 0, intervalMs = 10, repeatCount = 10): void {
        HSLogger.debug(`antiBuyCoinBug: called, ${initialDelayMs}ms initial delay, ${intervalMs}ms interval, ${repeatCount} attempts`, this.context);
        window.setTimeout(() => {
            let attempt = 0;
            const intervalId = window.setInterval(() => {
                attempt++;
                this.coin.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, isPrimary: true }));

                if (attempt >= repeatCount) {
                    window.clearInterval(intervalId);
                    HSLogger.debug(`antiBuyCoinBug: completed ${attempt} attempts, stopping.`, this.context);
                }
            }, intervalMs);
        }, initialDelayMs);
    }

    private antiBuyCoinBugViaExpose(initialDelayMs = 0, intervalMs = 10, stableMs = 200): void {
        HSLogger.debug(`antiBuyCoinBugViaExpose: called, ${initialDelayMs}ms initial delay, ${intervalMs}ms interval, stops after ${stableMs}ms stable`, this.context);

        window.setTimeout(() => {
            const snapBefore = this.getGameDataSnapshot();
            const snapshotAgeMs = this.latestGameDataSnapshotTimestamp
                ? Date.now() - this.latestGameDataSnapshotTimestamp
                : -1;
            HSLogger.debug(
                `antiBuyCoinBugViaExpose PRE-BURST STATE (after ${initialDelayMs}ms delay):\n` +
                `  snapshot age: ${snapshotAgeMs}ms (stale if >1000)\n` +
                `  upgrades[81]: ${snapBefore?.upgrades?.['81'] ?? 'N/A'} (1=bought, 0=not bought)\n` +
                `  PP/diamonds: ${snapBefore?.prestigePoints ?? 'N/A'} (need >=1000 to buy upg81)\n` +
                `  coins: ${snapBefore?.coins ?? 'N/A'}\n` +
                `  firstOwnedCoin: ${snapBefore?.firstOwnedCoin ?? 'N/A'}`, this.context
            );

            let attempt = 0;
            let stableAt: number | null = null; // timestamp when upgrades[81] first became 1

            const intervalId = window.setInterval(() => {
                attempt++;

                //const result = (window as any).__HS_GAME_API?.ensureWorkerAutobuyer?.();
                const result = (window as any).__HS_GAME_API?.checkWorkerAutobuyer?.();
                const snapAttempt = this.getGameDataSnapshot();
                const snapshotAgeMs = this.latestGameDataSnapshotTimestamp
                    ? Date.now() - this.latestGameDataSnapshotTimestamp
                    : -1;
                const upg81 = snapAttempt?.upgrades?.['81'] ?? 'N/A';

                HSLogger.debug(
                    `antiBuyCoinBugViaExpose: try ${attempt} — ` +
                    `snapshot age: ${snapshotAgeMs}ms, ` +
                    `upgrades[81]: ${upg81}, ` +
                    `PP/diamonds: ${snapAttempt?.prestigePoints ?? 'N/A'}, ` +
                    `coins: ${snapAttempt?.coins ?? 'N/A'}, ` +
                    `firstOwnedCoin: ${snapAttempt?.firstOwnedCoin ?? 'N/A'}.`, this.context
                );

                if (upg81 === 1) {
                    if (stableAt === null) stableAt = Date.now();
                    const stableForMs = Date.now() - stableAt;
                    if (stableForMs >= stableMs) {
                        window.clearInterval(intervalId);
                        const snapAfter = this.getGameDataSnapshot();
                        HSLogger.debug(
                            `antiBuyCoinBugViaExpose: upgrades[81] stable for ${stableForMs}ms — done. ` +
                            `  upgrades[81]: ${snapAfter?.upgrades?.['81'] ?? 'N/A'}\n` +
                            `  PP/diamonds: ${snapAfter?.prestigePoints ?? 'N/A'}\n` +
                            `  coins: ${snapAfter?.coins ?? 'N/A'}\n` +
                            `  firstOwnedCoin: ${snapAfter?.firstOwnedCoin ?? 'N/A'}`, this.context
                        );
                    }
                } else {
                    stableAt = null; // reset if it flipped back to 0
                }
            }, intervalMs);
        }, initialDelayMs);
    }

    // ============================================================================
    // AMBROSIA LOADOUT
    // ============================================================================

    private async setAmbrosiaLoadout(loadout: HTMLButtonElement): Promise<void> {
        while (!this.isInAmbLoadout(loadout)) {
            loadout.click();
            if (this.isInAmbLoadout(loadout)) {
                return;
            }
            await HSUtils.sleep(this.sleepTime);
        }
    }

    private isInAmbLoadout(loadout: HTMLButtonElement): boolean {
        return !!loadout?.classList.contains('hs-ambrosia-active-slot');
    }

    // ============================================================================
    // STAGE & PHASES
    // ============================================================================

    private async getStage(): Promise<string> {
        if (this.stageFunc) {
            try {
                const stage = this.stageFunc(0);
                HSLogger.debug(`Got stage directly: ${stage}`, this.context);
                return stage;
            } catch (error) {
                HSLogger.debug(`Error getting stage from stageFunc: ${error}`, this.context);
            }
        } else {
            if (!this.hasWarnedMissingStageFunc) {
                HSLogger.debug("Performance Warning: 'synergismStage' function not exposed.", this.context);
                this.hasWarnedMissingStageFunc = true;
            }
        }

        try {
            const raw = this.stage?.textContent ?? '';
            const m = raw.match(/Current Game Section:\s*(.+)/);
            if (m && m[1]) {
                HSLogger.debug(`Got stage from element: ${m[1]}`, this.context);
                return m[1].trim();
            }
        } catch (e) {
            HSLogger.debug(`Error reading stage element: ${e}`, this.context);
        }

        return this.getStageViaDOM();
    }

    private async getStageViaDOM(): Promise<string> {
        this.settingsTab.click();
        this.settingsSubTab.click();
        this.misc.click();

        const stageText = await this.getFromDOM<string>(this.stage, {
            regex: /Current Game Section:\s*(.+)/,
            predicate: t => t.includes("Current Game Section:")
        });

        return stageText || "";
    }

    private async getFromDOM<T>(
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

    private isPhaseOption(value: string): value is PhaseOption {
        return this.phaseIndexByOption.has(value as PhaseOption);
    }

    private getPhaseIndex(phase: PhaseOption): number {
        return this.phaseIndexByOption.get(phase) ?? -1;
    }

    private rebuildStrategyPhaseCaches(): void {
        if (!this.strategy) {
            this.strategyPhaseRanges = undefined;
            this.finalPhaseConfig = undefined;
            return;
        }

        this.finalPhaseConfig = this.strategy.strategy.find(p => p.endPhase === 'end') ?? undefined;
        this.strategyPhaseRanges = this.strategy.strategy
            .map((p) => {
                const startIndex = this.getPhaseIndex(p.startPhase);
                const endIndex = this.getPhaseIndex(p.endPhase);
                return { phase: p, startIndex, endIndex };
            })
            .filter((r) => r.startIndex !== -1 && r.endIndex !== -1);
    }

    // ============================================================================
    // SINGULARITY LOGIC
    // ============================================================================

    private async performSingularity(skipRecord: boolean = false): Promise<void> {
        const prevMainView = this.gamestate.getCurrentUIView<MainView>('MAIN_VIEW');
        const [qBefore, gqBefore] = await Promise.all([
            this.getCurrentQuarks(),
            this.getCurrentGoldenQuarks(),
        ]);

        const c15ScoreBefore = this.getChallengeAccessor(15).getCompletions();
        await this.enterAndLeaveExalt();

        this.endStageDone = false;
        this.observerActivated = false;
        this.elevatorInput.value = this.targetSingularity.toString();
        this.elevatorInput.dispatchEvent(new Event('input', { bubbles: true }));
        this.elevatorTeleportButton.click();


        const [qAfter, gqAfter, stageInitial] = await Promise.all([
            this.getCurrentQuarks(),
            this.getCurrentGoldenQuarks(),
            this.getStage(),
        ]);

        const gqGain = Math.max(0, gqAfter - gqBefore);
        const qGain = Math.max(0, qAfter - qBefore);

        // setTimeout to avoid loosing ~2ms in the critical path ?...
        setTimeout(() => {
            if (!skipRecord) {
                this.autosingModal?.recordSingularity(gqGain, gqAfter, qGain, qAfter, c15ScoreBefore);
            }
        }, 0);

        prevMainView.goto();
        HSLogger.debug("Singularity performed", this.context);

        let stage = stageInitial;
        while (!this.isAllowedStage(stage)) {
            await HSUtils.sleep(1);
            stage = await this.getStage();
        }

        this.antiBuyCoinBug(0, 15, 10);
        // this.antiBuyCoinBugViaExpose(0, 10, 50);

        this.observeAntiquitiesRune();
        this.prevActionTime = performance.now();
    }

    private async enterAndLeaveExalt(): Promise<void> {
        while (!this.isInExalt()) {
            await HSUtils.click(this.exalt2Btn);
            await HSUtils.sleep(this.sleepTime);
        }

        while (this.isInExalt()) {
            await HSUtils.click(this.exalt2Btn);
            await HSUtils.sleep(this.sleepTime);
        }
    }

    private isInExalt(): boolean {
        const style = window.getComputedStyle(this.exaltTimer);
        return style.display !== "none";
    }

    private isAllowedStage(stage: string): boolean {
        return ALLOWED.some(allowed => stage.includes(allowed));
    }

    private getCurrentQuarks(): Promise<number> {
        const data = this.getGameDataSnapshot();
        return Promise.resolve(data?.worlds ?? 0);
    }

    private getCurrentGoldenQuarks(): Promise<number> {
        const data = this.getGameDataSnapshot();
        return Promise.resolve(data?.goldenQuarks ?? 0);
    }

    // ============================================================================
    // ANTIQUITIES
    // ============================================================================

    private observeAntiquitiesRune(): void {
        if (!this.antiquitiesRuneLockedContainer) {
            HSLogger.debug("Could not find antiquitiesRuneLockedContainer element", this.context);
            return;
        }

        this.antiquitiesObserver?.disconnect();

        this.antiquitiesObserver = new MutationObserver(mutations => {
            for (const mutation of mutations) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                    const style = (mutation.target as HTMLElement).style;
                    if (style.display === 'none') {
                        HSLogger.debug('antiquitiesRuneLockedContainer hidden - buying antiquities', this.context);
                        this.observerActivated = true;
                        this.antiquitiesObserver?.disconnect();
                        this.antiquitiesObserver = undefined;
                        this.performFinalStage();
                        break;
                    }
                }
            }
        });

        this.antiquitiesObserver.observe(this.antiquitiesRuneLockedContainer, { attributes: true, attributeFilter: ['style'] });
    }

    private async performFinalStage(): Promise<void> {
        if (this.endStagePromise) return;

        this.endStagePromise = new Promise<void>(resolve => {
            this.endStageResolve = resolve;
        });

        const aoagPhase = this.strategy?.aoagPhase ?? createDefaultAoagPhase();
        aoagPhase.phaseId = AOAG_PHASE_ID;

        await this.executePhase(aoagPhase, {
            phaseLabelOverride: AOAG_PHASE_NAME,
            skipInitialCorruptions: false,
            skipInitialAscend: false,
            ignoreObserverActivated: true
        });

        this.prevActionTime = performance.now();
        await this.matchStageToStrategy('final');

        if (this.isAutosingEnabled()) {
            await this.setAmbrosiaLoadout(this.ambrosia_quark);
            const exportBtn = this.exportBtnClone ?? this.exportBtn;

            if (exportBtn) {
                this.saveType.checked = true;
                exportBtn.click();
            }

            this.ascendBtn.click();

            if (this.stopAtSingularitysEnd && this.autosingEnabled) {
                HSUI.Notify("Standard strategy exited: Auto-Sing will now push this sing before stopping.");
                await this.pushSingularityBeforeStop();
                HSUI.Notify("Auto-Sing stopped at end of singularity as requested.");
                this.stopAutosing();
                return;
            }

            await this.performSingularity();
        }

        this.endStageResolve?.();
        this.endStagePromise = undefined;
        this.endStageResolve = undefined;
    }

    private async pushSingularityBeforeStop(): Promise<void> {
        this.ambrosia_late_cube.click();
        await this.setCorruptions(ZERO_CORRUPTIONS);

        await this.maxC11to14WithC10(11);
        await this.maxC11to14WithC10(12);
        await this.maxC11to14WithC10(13);
        await this.maxC11to14WithC10(14);

        await this.setCorruptions(
            { viscosity: 16, drought: 16, deflation: 16, extinction: 16, illiteracy: 16, recession: 16, dilation: 16, hyperchallenge: 16 }
        );

        await this.autoChallengeButton.click();

        for (let i = 1; i <= 2; i++) {
            await this.executePushLoop();
        }

        await this.executeLastPushLoop();
        await this.exitTranscBtn.click();
        await HSUtils.sleep(1000);
        await this.setAmbrosiaLoadout(this.ambrosia_late_cube);
        await this.autoChallengeButton.click();
        await this.exitAscBtn.click();
        await this.setAmbrosiaLoadout(this.ambrosia_luck);
    }

    private async executePushLoop(): Promise<void> {
        await this.waitForCompletion(15, 0, 0, 0);
        await this.setAmbrosiaLoadout(this.ambrosia_obt);
        await HSUtils.sleep(3500);
        await this.setAmbrosiaLoadout(this.ambrosia_off);
        await HSUtils.sleep(100);
        await this.antSacrifice.click();
        await HSUtils.sleep(100);
        await this.setAmbrosiaLoadout(this.ambrosia_late_cube);

        await this.exitAscBtn.click();
        await this.setAmbrosiaLoadout(this.ambrosia_off);
        await HSUtils.sleep(3500);
        await this.antSacrifice.click();
        await HSUtils.sleep(100);
        await this.setAmbrosiaLoadout(this.ambrosia_late_cube);
    }

    private async executeLastPushLoop(): Promise<void> {
        await this.waitForCompletion(15, 0, 0, 0);
        await this.setAmbrosiaLoadout(this.ambrosia_obt);
        await HSUtils.sleep(3500);
        await this.setAmbrosiaLoadout(this.ambrosia_off);
        await HSUtils.sleep(100);
        await this.antSacrifice.click();
        await HSUtils.sleep(100);
        await this.setAmbrosiaLoadout(this.ambrosia_obt);

        await this.waitForCompletion(6, 150, 1000, 0);
        await this.waitForCompletion(1, 9001, 1000, 0);
        await this.waitForCompletion(2, 9001, 1000, 0);
        await this.waitForCompletion(3, 9001, 1000, 0);
        await this.waitForCompletion(4, 9001, 1000, 0);
        await this.waitForCompletion(5, 9001, 1000, 0);
    }

    // ============================================================================
    // UTILITY & HELPERS
    // ============================================================================

    private async buyCoin(): Promise<void> {
        let coins = await this.getCoins();
        while (coins < 1000 && this.autosingEnabled) {
            await HSUtils.click(this.coin);
            coins = await this.getCoins();
        }
    }

    private async getCoins(): Promise<number> {
        return this.getCoinsViaGDS();
    }

    private async getCoinsViaGDS(): Promise<number> {
        const data = this.getGameDataSnapshot();
        if (!data || data.coins === undefined) return 0;
        return new Decimal(data.coins).toNumber();
    }

    private async useAddAndTimeCodes(): Promise<void> {
        if (this.addCodeAllBtn) this.addCodeAllBtn.click();
        if (this.timeCodeBtn) this.timeCodeBtn.click();
        await HSUtils.sleep(0);
    }

    private parseDecimal(text: string): Decimal {
        let cleanText = text.replace(/,/g, '').trim();
        try {
            return new Decimal(cleanText);
        } catch (e) {
            return new Decimal(0);
        }
    }

    private parseNumber(text: string): number {
        const parsed = parseFloat(text.replace(/,/g, '').trim());
        return isNaN(parsed) ? 0 : parsed;
    }

    private fastDoubleClick(element: HTMLElement): void {
        element.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    }
}
