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
import { HSAutosingTimerModal } from "./hs-autosingTimerModal";
import { ALLOWED } from "../../../types/module-types/hs-autosing-types";
import { HSGlobal } from "../../hs-core/hs-global";
import { HSGameState, MainView } from "../../hs-core/hs-gamestate";

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

export class HSAutosing extends HSModule implements HSGameDataSubscriber {
    gameDataSubscriptionId?: string;

    private gameDataAPI?: HSGameDataAPI;

    private gameDataResolver?: (value: void) => void;

    private strategy?: HSAutosingStrategy;
    private loadoutByName: Map<string, CorruptionLoadout> = new Map();
    private autosingEnabled = false;
    private advancedDataCollectionEnabledAtStart: boolean = false;
    private targetSingularity = 0;
    private sleepTime = 10;
    private settingsTab!: HTMLButtonElement;
    private settingsSubTab!: HTMLButtonElement;
    private misc!: HTMLButtonElement;
    private stage!: HTMLParagraphElement;
    private challengeButtons: Record<number, HTMLButtonElement> = {};
    private levelElements: Record<number, HTMLParagraphElement> = {};
    private exitTranscBtn!: HTMLButtonElement;
    private exitReincBtn!: HTMLButtonElement;
    private exitAscBtn!: HTMLButtonElement;
    private ascendBtn!: HTMLButtonElement;
    private elevatorTeleportButton!: HTMLButtonElement;
    private elevatorInput!: HTMLInputElement;
    private autoChallengeButton!: HTMLButtonElement;
    private ambrosia_early_cube!: HTMLButtonElement;
    private ambrosia_late_cube!: HTMLButtonElement;
    private ambrosia_quark!: HTMLButtonElement;
    private ambrosia_obt!: HTMLButtonElement;
    private ambrosia_off!: HTMLButtonElement;
    private ambrosia_ambrosia!: HTMLButtonElement;
    private antSacrifice!: HTMLButtonElement;
    private coin!: HTMLButtonElement;
    private timerModal!: HSAutosingTimerModal;
    private prevActionTime: number = 0;
    private AOAG!: HTMLButtonElement;
    private endStageDone: boolean = false;
    private observerActivated: boolean = false;
    private importBtn!: HTMLButtonElement;
    private exalt2Btn!: HTMLButtonElement;
    private exaltTimer!: HTMLSpanElement;
    private antiquitiesObserver?: MutationObserver;
    private endStagePromise?: Promise<void>;
    private endStageResolve?: () => void;
    private stageFunc!: (arg0: number) => any;
    private gamestate!: HSGameState;

    // Cached DOM Elements
    private corrCurrent: Record<string, HTMLElement | null> = {};
    private corrNext: Record<string, HTMLElement | null> = {};
    private corruptionPromptInput!: HTMLInputElement;
    private corruptionPromptOkBtn!: HTMLButtonElement;
    private addCodeAllBtn!: HTMLButtonElement;
    private timeCodeBtn!: HTMLButtonElement;
    private saveType!: HTMLInputElement;
    private exportBtn!: HTMLButtonElement;

    private stopAtSingularitysEnd: boolean = false;
    private hasWarnedMissingStageFunc: boolean = false;

    private storedC15: Decimal = new Decimal(0);

    private readonly phaseIndexByOption = new Map<PhaseOption, number>(phases.map((p, i) => [p, i] as const));
    private strategyPhaseRanges?: Array<{ phase: AutosingStrategyPhase; startIndex: number; endIndex: number }>;
    private finalPhaseConfig?: AutosingStrategyPhase;
    private antiquitiesRuneLockedContainer!: HTMLDivElement;


    init(): Promise<void> {
        HSLogger.log(`Initializing HSAutosing module`, this.context);

        this.autosingEnabled = false;
        this.targetSingularity = 0;
        this.settingsTab = document.getElementById('settingstab') as HTMLButtonElement;
        this.settingsSubTab = document.getElementById('switchSettingSubTab4') as HTMLButtonElement;
        this.misc = document.getElementById('kMisc') as HTMLButtonElement;
        this.stage = document.getElementById('gameStageStatistic') as HTMLParagraphElement;
        for (let i = 1; i <= 15; i++) {
            const btn = document.getElementById(`challenge${i}`) as HTMLButtonElement;
            if (btn) {
                this.challengeButtons[i] = btn;
            }
        }
        for (let i = 1; i <= 15; i++) {
            const el = document.getElementById(`challenge${i}level`) as HTMLParagraphElement;
            if (el) {
                this.levelElements[i] = el;
            }
        }
        this.exitTranscBtn = document.getElementById('challengebtn') as HTMLButtonElement;
        this.exitReincBtn = document.getElementById('reincarnatechallengebtn') as HTMLButtonElement;
        this.exitAscBtn = document.getElementById('ascendChallengeBtn') as HTMLButtonElement;
        this.ascendBtn = document.getElementById('ascendbtn') as HTMLButtonElement;
        this.autoChallengeButton = document.getElementById('toggleAutoChallengeStart') as HTMLButtonElement;
        this.antSacrifice = document.getElementById(`antSacrifice`) as HTMLButtonElement;
        this.coin = document.getElementById('buycoin1') as HTMLButtonElement;
        this.AOAG = document.getElementById('antiquitiesRuneSacrifice') as HTMLButtonElement;
        this.endStageDone = false;
        this.observerActivated = false;
        this.stageFunc = (window as any).__HS_synergismStage;
        this.elevatorTeleportButton = document.getElementById('elevatorTeleportButton') as HTMLButtonElement;
        this.elevatorInput = document.getElementById('elevatorTargetInput') as HTMLInputElement;
        this.importBtn = document.querySelector('#corruptionLoadoutTable button.corrImport') as HTMLButtonElement;
        this.exalt2Btn = document.getElementById('oneChallengeCap') as HTMLButtonElement;
        this.exaltTimer = document.getElementById('ascSingChallengeTimeTakenStats') as HTMLSpanElement;
        this.antiquitiesRuneLockedContainer = document.getElementById('antiquitiesRuneLockedContainer') as HTMLDivElement;
        this.gamestate = HSModuleManager.getModule<HSGameState>("HSGameState") as HSGameState;
        this.saveType = document.getElementById('saveType') as HTMLInputElement;
        this.exportBtn = document.getElementById('exportgame') as HTMLButtonElement;

        // Cache elements for corruptions and codes
        this.corruptionPromptInput = document.getElementById('prompt_text') as HTMLInputElement;
        this.corruptionPromptOkBtn = document.getElementById('ok_prompt') as HTMLButtonElement;
        this.addCodeAllBtn = document.getElementById("addCodeAll") as HTMLButtonElement;
        this.timeCodeBtn = document.getElementById("timeCode") as HTMLButtonElement;

        // Cache corruption elements
        const corrNames = ["viscosity", "drought", "deflation", "extinction", "illiteracy", "recession", "dilation", "hyperchallenge"];
        corrNames.forEach(name => {
            this.corrCurrent[name] = document.getElementById(`corrCurrent${name}`);
            this.corrNext[name] = document.getElementById(`corrNext${name}`);
        });

        if (!this.timerModal) {
            this.timerModal = new HSAutosingTimerModal();
        }
        HSLogger.log(`HSAutosing module initialized`, this.context);
        return Promise.resolve();
    }

    isAutosingEnabled(): boolean {
        return this.autosingEnabled;
    }

    public setStopAtSingularitysEnd(value: boolean) {
        this.stopAtSingularitysEnd = value;
    }

    public isStopAtSingularitysEnd(): boolean {
        return this.stopAtSingularitysEnd;
    }

    subscribeGameDataChanges() {
        const gameDataMod = HSModuleManager.getModule<HSGameData>('HSGameData');

        if (gameDataMod && !this.gameDataSubscriptionId) {
            this.gameDataSubscriptionId = gameDataMod.subscribeGameDataChange(this.gameDataCallback.bind(this));
            HSLogger.log('Subscribed to game data changes for autosing', this.context);
        }
    }

    unsubscribeGameDataChanges() {
        const gameDataMod = HSModuleManager.getModule<HSGameData>('HSGameData');

        if (gameDataMod && this.gameDataSubscriptionId) {
            gameDataMod.unsubscribeGameDataChange(this.gameDataSubscriptionId);
            this.gameDataSubscriptionId = undefined;
            HSLogger.log('Unsubscribed from game data changes for autosing', this.context);
        }
    }

    gameDataCallback(): Promise<void> {
        if (this.gameDataResolver) {
            this.gameDataResolver();
            this.gameDataResolver = undefined;
        }
        return Promise.resolve();
    }

    async enableAutoSing(): Promise<void> {
        this.AOAG = document.getElementById('antiquitiesRuneSacrifice') as HTMLButtonElement;
        this.autosingEnabled = true;
        this.stopAtSingularitysEnd = false;

        // Advanced data collection is checked once at autosing start.
        // While autosing is running, we use this cached value to avoid repeated setting lookups.
        this.advancedDataCollectionEnabledAtStart = !!HSSettings.getSetting('advancedDataCollection')?.isEnabled();

        HSUtils.startDialogWatcher();
        const quickbarSetting = HSSettings.getSetting('ambrosiaQuickBar');

        if (quickbarSetting && !quickbarSetting.isEnabled()) {
            HSUI.Notify("You need to enable the ambrosia quickbar setting before you can use autosing.")
            this.stopAutosing();
            return Promise.resolve();
        }
        const singularitySetting = HSSettings.getSetting('singularityNumber') as HSNumericSetting;
        this.targetSingularity = singularitySetting.getValue();

        this.subscribeGameDataChanges();
        new Promise<void>(resolve => {
            this.gameDataResolver = resolve;
        })


        this.gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        if (!this.gameDataAPI) {
            HSLogger.debug("Could not find HSGameDataAPI module", this.context);
            this.stopAutosing();
            return Promise.resolve();
        }

        const gameData = this.gameDataAPI.getGameData();
        if (!gameData) {
            HSLogger.debug("Could not get game data", this.context);
            this.stopAutosing();
            return Promise.resolve();
        }

        if (this.targetSingularity > gameData.highestSingularityCount) {
            HSLogger.log(`Target singularity bigger than highest singularity. Going to highest.`);
            this.targetSingularity = gameData.highestSingularityCount;
        }

        const strategySetting = HSSettings.getSetting("autosingStrategy");
        const selectedValue = strategySetting.getValue();

        const control = strategySetting.getDefinition().settingControl;
        if (!control?.selectOptions) {
            HSUI.Notify("Strategy selector not available", { notificationType: "warning" });
            this.stopAutosing();
            return Promise.resolve();
        }

        const selectedOption = control.selectOptions.find(
            opt => opt.value.toString() === HSUtils.asString(selectedValue)
        );

        if (!selectedOption) {
            HSUI.Notify("Selected strategy not found", { notificationType: "warning" });
            this.stopAutosing();
            return Promise.resolve();
        }

        const strategies = HSSettings.getStrategies();
        this.strategy = strategies.find(
            s => s.strategyName === selectedOption.text
        );

        if (!this.strategy) {
            HSLogger.debug(`Autosing: Stopping - Strategy "${selectedOption.text}" not found.`, this.context);
            HSUI.Notify("Could not find strategy", { notificationType: "warning" });
            this.stopAutosing();
            return Promise.resolve();
        }

        this.rebuildStrategyPhaseCaches();
        this.buildLoadoutCache();

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
        this.ambrosia_ambrosia = document.getElementById(`${ambPrefix}-blueberryLoadout${ambrosiaVal}`) as HTMLButtonElement;

        if (!this.ambrosia_early_cube || !this.ambrosia_late_cube || !this.ambrosia_quark || !this.ambrosia_obt || !this.ambrosia_off || !this.ambrosia_ambrosia) {
            HSLogger.debug("Autosing: Stopping - Required Ambrosia loadout buttons missing in DOM.", this.context);
            HSUI.Notify("Could not find all required Ambrosia loadout buttons", { notificationType: "warning" });
            this.stopAutosing();
            return Promise.resolve();
        }

        HSLogger.log(`Autosing enabled for target singularity: ${this.targetSingularity}`, this.context);

        if (!this.timerModal) {
            this.timerModal = new HSAutosingTimerModal();
        }

        if (this.timerModal) {
            this.timerModal.show();
        }

        this.performAutosingLogic();
        return Promise.resolve();
    }

    async disableAutoSing(): Promise<void> {
        this.autosingEnabled = false;
        this.advancedDataCollectionEnabledAtStart = false;
        this.stopAutosing();
        this.saveType.checked = false;

        if (this.timerModal) {
            this.timerModal.hide();
        }
        HSLogger.log(`Autosing disabled`, this.context);
        this.unsubscribeGameDataChanges();
        return Promise.resolve();
    }

    private async performAutosingLogic(): Promise<void> {
        this.ambrosia_ambrosia.click();
        await this.useAddAndTimeCodes();

        try {
            if (this.timerModal) {
                const q = await this.getCurrentQuarks();
                const gq = await this.getCurrentGoldenQuarks();
                this.timerModal.start(this.strategy!, q, gq);
            }
            // The first singularity triggered by autosing startup is used
            // to reach the target state but should not be counted in the
            // recorded history—skip recording for this initial run.
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

    private getPhaseIndex(phase: PhaseOption): number {
        return this.phaseIndexByOption.get(phase) ?? -1;
    }

    private isInChallenge(challengeIndex: number): boolean {
        const challenge = this.challengeButtons[challengeIndex];
        return !!challenge?.classList.contains('challengeActive');
    }

    /**
     * Legacy helper to ensure coins are available for very early-game restarts.
     * Refactored to use direct PlayerData access instead of DOM scraping.
     */
    private async buyCoin(): Promise<void> {
        let coins = await this.getCoins();

        while (coins < 1000 && this.autosingEnabled) {
            await HSUtils.click(this.coin);
            coins = await this.getCoins();
        }
    }

    /**
     * Directly retrieves the coin balance from PlayerData.
     * Optimized to avoid DOM manipulation and heavy parsing.
     */
    private async getCoins(): Promise<number> {
        return this.getCoinsViaGDS();
    }

    private async getCoinsViaGDS(): Promise<number> {
        const data = this.gameDataAPI?.getGameData();
        if (!data || data.coins === undefined) return 0;

        // Wrap in Decimal constructor to ensure .toNumber() exists,
        // as serialized data may lose class methods.
        return new Decimal(data.coins).toNumber();
    }

    private async useAddAndTimeCodes() {
        if (this.addCodeAllBtn) this.addCodeAllBtn.click();
        if (this.timeCodeBtn) this.timeCodeBtn.click();
        await HSUtils.sleep(0);
    }

    private isInAmbLoadout(loadout: HTMLButtonElement): boolean {
        return !!loadout?.classList.contains('hs-ambrosia-active-slot');
    }

    async matchStageToStrategy(stage: string | null): Promise<void> {
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

            HSLogger.debug(`Executing final phase: ${stageStart}-${stageEnd}`, this.context);
            if (this.timerModal) {
                this.timerModal.setCurrentPhase(`${stageStart}-${stageEnd}`);
            }

            await this.executePhase(phaseConfig);
            return;
        }

        // Find the unique dash split where both sides are valid PhaseOptions.
        // This supports stage strings that may contain multiple '-' characters.
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
        if (this.timerModal) {
            this.timerModal.setCurrentPhase(phaseConfig.startPhase + '-' + phaseConfig.endPhase);
        }
        await this.executePhase(phaseConfig);
        return;
    }

    private isPhaseOption(value: string): value is PhaseOption {
        return this.phaseIndexByOption.has(value as PhaseOption);
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

    private buildLoadoutCache(): void {
        this.loadoutByName.clear();
        const defs = this.strategy?.corruptionLoadouts ?? [];
        for (const d of defs) {
            // store a shallow copy so callers won't mutate originals
            this.loadoutByName.set(d.name, { ...d.loadout });
        }
    }

    private getChallengeCompletions(challengeNumber: number): Decimal {
        const chal = this.levelElements[challengeNumber];
        if (!chal) return new Decimal(0);
        if (challengeNumber === 15) {
            const currentCompletions = this.parseDecimal(chal.textContent ?? '0');
            return currentCompletions;
        }
        const currentCompletions = this.parseDecimal((chal.textContent ?? '0').split('/')[0]);
        return currentCompletions;
    }

    private getStepLabelAndMaxTime(challenge: any): { label: string; maxTime: number | null } {
        let label = "";
        let maxTime: number | null = null;

        if (challenge.challengeNumber === LOADOUT_ACTION_VALUE) {
            label = challenge.loadoutName ? `Load Corruption Loadout: ${challenge.loadoutName}` : "Load Corruption Loadout";
        } else if (challenge.challengeNumber === 201) {
            label = "Load Phase Corruptions";
        } else if (challenge.challengeNumber === IF_JUMP_VALUE) {
            label = "Jump Logic";
        } else if (challenge.challengeNumber >= 100) {
            label = SPECIAL_ACTION_LABEL_BY_ID.get(challenge.challengeNumber) ?? `Action ${challenge.challengeNumber}`;
        } else {
            label = `Wait for C${challenge.challengeNumber} x${challenge.challengeCompletions || 0}`;
            if (challenge.challengeMaxTime) maxTime = challenge.challengeMaxTime;
        }

        return { label, maxTime };
    }

    private getLoadoutByName(name?: string | null): CorruptionLoadout | null {
        if (!name) return null;
        if (this.loadoutByName.size > 0) {
            const l = this.loadoutByName.get(name);
            return l ? { ...l } : null;
        }

        // Fallback: strategy not yet cached, search array (backwards compat)
        const loadouts = this.strategy?.corruptionLoadouts ?? [];
        const match = loadouts.find(loadout => loadout.name === name);
        return match ? { ...match.loadout } : null;
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
            HSLogger.debug(`Autosing: Loadout not found: ${name ?? "(none)"}`, this.context);
            return;
        }
        await this.setCorruptions(loadout);
    }

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
        if (this.timerModal) {
            this.timerModal.setCurrentPhase(phaseLabel);
        }
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
            if (!this.autosingEnabled || (this.observerActivated && !(phaseConfig.endPhase === "end") && !options?.ignoreObserverActivated)) {
                // If observerActivated stops execution, record the current phase before exiting
                if (this.timerModal) {
                    try {
                        this.timerModal.recordPhase(phaseLabel);
                    } catch (e) {
                        HSLogger.debug(`Error recording phase on early exit: ${e}`, this.context);
                    }
                }
                return;
            }

            const challenge = phaseConfig.strat[i];

            // Report current step to modal
            if (this.timerModal && this.advancedDataCollectionEnabledAtStart) {
                const { label, maxTime } = this.getStepLabelAndMaxTime(challenge);
                this.timerModal.setCurrentStep(label, maxTime);
            }


            if (challenge.challengeWaitBefore && challenge.challengeWaitBefore > 0) {
                await HSUtils.sleepUntilElapsed(this.prevActionTime, challenge.challengeWaitBefore);
            }

            if (challenge.challengeNumber == 201) {
                const phaseLoadout = this.getPhaseCorruptionLoadout(phaseConfig);
                if (phaseLoadout) {
                    await this.setCorruptions(phaseLoadout);
                }
            } else if (challenge.challengeNumber == LOADOUT_ACTION_VALUE) {
                await this.applyLoadoutByName(challenge.loadoutName);
            } else if (challenge.challengeNumber == IF_JUMP_VALUE) { // Jump action
                const mode = challenge.ifJump?.ifJumpMode;
                const operator = challenge.ifJump?.ifJumpOperator;

                switch (mode) {
                    case "challenges":
                        const challengeCompletions = this.getChallengeCompletions(challenge.ifJump?.ifJumpChallenge ?? -1)
                        if (operator === ">") {
                            if (challengeCompletions.gt(challenge.ifJump?.ifJumpValue ?? 0))
                                if (challenge.ifJump?.ifJumpIndex !== undefined)
                                    i = challenge.ifJump?.ifJumpIndex - 1;
                        } else if (operator === "<") {
                            if (challengeCompletions.lt(challenge.ifJump?.ifJumpValue ?? 0))
                                if (challenge.ifJump?.ifJumpIndex !== undefined)
                                    i = challenge.ifJump?.ifJumpIndex - 1;
                        }
                        break;
                    case "stored_c15":
                        const exponent = challenge.ifJump?.ifJumpMultiplier ?? 0;
                        const c15Score = this.getChallengeCompletions(15);

                        // We compare 10^(stored + x) vs 10^current
                        // So effectively: stored + x vs current
                        const targetStats = this.storedC15.plus(exponent);

                        if (operator === ">") {
                            // If current > target
                            if (c15Score.gt(targetStats))
                                if (challenge.ifJump?.ifJumpIndex !== undefined)
                                    i = challenge.ifJump?.ifJumpIndex - 1;
                        } else if (operator === "<") {
                            // If current < target
                            if (c15Score.lt(targetStats))
                                if (challenge.ifJump?.ifJumpIndex !== undefined)
                                    i = challenge.ifJump?.ifJumpIndex - 1;
                        }
                        break;
                    default:
                        break;
                }
            } else if (challenge.challengeNumber >= 100) { // Special actions (100+)
                HSLogger.debug(`Autosing: Performing special action: ${SPECIAL_ACTION_LABEL_BY_ID.get(challenge.challengeNumber) ?? challenge.challengeNumber}`, this.context);
                await this.performSpecialAction(challenge.challengeNumber);
            } else {
                HSLogger.debug(`Autosing: waiting for: ${challenge.challengeCompletions ?? 0} completions of challenge${challenge.challengeNumber}, after reaching goal waiting ${challenge.challengeWaitTime}ms inside, max time: ${challenge.challengeMaxTime}`, this.context);
                await this.waitForCompletion(
                    challenge.challengeNumber,
                    challenge.challengeCompletions ?? 0,
                    challenge.challengeMaxTime,
                    challenge.challengeWaitTime,
                );
            }
            this.prevActionTime = performance.now();
        }
        if (phaseConfig.endPhase == "end") {
            this.endStageDone = true;
        }
        if (this.timerModal) {
            this.timerModal.recordPhase(phaseLabel);
        }
    }


    private async performSpecialAction(actionId: number): Promise<void> {
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
            case 104: // Ascend
                this.ascendBtn.click();
                break;
            case 105: // Early Cube
                await this.setAmbrosiaLoadout(this.ambrosia_early_cube);
                break;
            case 106: // Late Cube
                await this.setAmbrosiaLoadout(this.ambrosia_late_cube);

                break;
            case 107: // Quark
                await this.setAmbrosiaLoadout(this.ambrosia_quark);
                break;
            case 108: // Ant sac
                await this.antSacrifice.click();
                break;
            case 109: // Ant Corruptions
                const antCorruptions = { viscosity: 16, drought: 0, deflation: 16, extinction: 0, illiteracy: 5, recession: 16, dilation: 0, hyperchallenge: 16 } as CorruptionLoadout;
                await this.setCorruptions(antCorruptions);
                break;
            case 110: // Cleanse
                await this.setCorruptions(ZERO_CORRUPTIONS);
                break;
            case 111: // Wait
                break;
            case 112: // Obt loadout
                await this.setAmbrosiaLoadout(this.ambrosia_obt);
                break;
            case 113: // Off loadout
                await this.setAmbrosiaLoadout(this.ambrosia_off);
                break;
            case 114: // Ambrosia loadout
                await this.setAmbrosiaLoadout(this.ambrosia_ambrosia);
                break;
            case 115: // auto Challenge Toggle
                this.autoChallengeButton.click();
                this.exitTranscBtn.click();
                this.exitReincBtn.click();
                break;
            case 116: // store C15
                this.storedC15 = this.getChallengeCompletions(15);
                break;
            case 117: // Max C11
                await this.maxC11to14WithC10(11);
                break;
            case 118: // Max C12
                await this.maxC11to14WithC10(12);
                break;
            case 119: // Max C13
                await this.maxC11to14WithC10(13);
                break;
            case 120: // Max C14
                await this.maxC11to14WithC10(14);
                break;
            case 121: // Click AOAG
                this.AOAG.click();
                break;
            case 501: // Special Corruptions 1 - challenge14 - w5x10max
                const corruptions501 = { viscosity: 1, drought: 7, deflation: 4, extinction: 11, illiteracy: 0, recession: 14, dilation: 4, hyperchallenge: 2 } as CorruptionLoadout;
                await this.setCorruptions(corruptions501);
                break;
            case 502: // Special Corruptions 2 - w5x10max - p2x1x10
                const corruptions502 = { viscosity: 2, drought: 15, deflation: 3, extinction: 11, illiteracy: 14, recession: 14, dilation: 5, hyperchallenge: 2 } as CorruptionLoadout;
                await this.setCorruptions(corruptions502);
                break;
            case 503: // Special Corruptions 3 - p2x1x10 - p3x1
                const corruptions503 = { viscosity: 3, drought: 16, deflation: 1, extinction: 12, illiteracy: 16, recession: 15, dilation: 6, hyperchallenge: 7 } as CorruptionLoadout;
                await this.setCorruptions(corruptions503);
                break;
            case 504: // Special Corruptions 4 - p3x1 - beta
                const corruptions504 = { viscosity: 3, drought: 16, deflation: 1, extinction: 12, illiteracy: 16, recession: 15, dilation: 6, hyperchallenge: 7 } as CorruptionLoadout;
                await this.setCorruptions(corruptions504);
                break;
            case 505: // Special Corruptions 5 - beta - 1e15-expo
                const corruptions505 = { viscosity: 3, drought: 16, deflation: 1, extinction: 12, illiteracy: 16, recession: 15, dilation: 6, hyperchallenge: 7 } as CorruptionLoadout;
                await this.setCorruptions(corruptions505);
                break;
            case 506: // Special Corruptions 6 - 1e15-expo - omega
                const corruptions506 = { viscosity: 6, drought: 16, deflation: 16, extinction: 13, illiteracy: 16, recession: 16, dilation: 11, hyperchallenge: 10 } as CorruptionLoadout;
                await this.setCorruptions(corruptions506);
                break;
            case 507: // Special Corruptions 7 - omega - singularity
                const corruptions507 = { viscosity: 10, drought: 16, deflation: 16, extinction: 16, illiteracy: 16, recession: 14, dilation: 14, hyperchallenge: 13 } as CorruptionLoadout;
                await this.setCorruptions(corruptions507);
                break;
            case 508: // Special Corruptions 8 - singularity - end
                const corruptions508 = { viscosity: 16, drought: 16, deflation: 16, extinction: 16, illiteracy: 16, recession: 16, dilation: 16, hyperchallenge: 16 } as CorruptionLoadout;
                await this.setCorruptions(corruptions508);
                break;
            case 999: // Restart AutoSing
                const restartBtn = document.getElementById('hs-timer-ctrl-restart') as HTMLButtonElement;
                if (restartBtn) restartBtn.click();
                break;
            default:
                HSLogger.log(`Unknown special action ${actionId}`, this.context);
        }
    }

    private async setAmbrosiaLoadout(loadout: HTMLButtonElement): Promise<void> {
        while (!this.isInAmbLoadout(loadout)) {
            loadout.click();

            // Check immediately after click
            if (this.isInAmbLoadout(loadout)) {
                return;
            }

            // Only sleep if not yet loaded
            await HSUtils.sleep(this.sleepTime);
        }
    }

    private stringifyCorruptions(loadout: CorruptionLoadout): string {
        const values = [
            loadout.viscosity,
            loadout.drought,
            loadout.deflation,
            loadout.extinction,
            loadout.illiteracy,
            loadout.recession,
            loadout.dilation,
            loadout.hyperchallenge
        ];
        return values.join(',');
    }

    private async setCorruptions(corruptions: CorruptionLoadout): Promise<void> {
        if (!this.corruptionPromptInput) {
            HSLogger.debug("Error: could not access prompt input", this.context);
            return;
        }

        if (!this.corruptionPromptOkBtn) {
            HSLogger.debug("Error: could not access prompt okay button", this.context);
            return;
        }

        const jsonString = JSON.stringify(corruptions);
        const targetViscosity = corruptions.viscosity;
        const targetDrought = corruptions.drought;
        const targetDeflation = corruptions.deflation;
        const targetExtinction = corruptions.extinction;
        const targetIlliteracy = corruptions.illiteracy;
        const targetRecession = corruptions.recession;
        const targetDilation = corruptions.dilation;
        const targetHyperchallenge = corruptions.hyperchallenge;

        while (true) {
            this.importBtn.click();
            this.corruptionPromptInput.value = jsonString;
            await HSUtils.click(this.corruptionPromptOkBtn);

            const current = this.getNextCorruptionsFromCache();
            if (
                current.viscosity === targetViscosity &&
                current.drought === targetDrought &&
                current.deflation === targetDeflation &&
                current.extinction === targetExtinction &&
                current.illiteracy === targetIlliteracy &&
                current.recession === targetRecession &&
                current.dilation === targetDilation &&
                current.hyperchallenge === targetHyperchallenge
            ) {
                HSLogger.debug(`Corruptions set successfully: ${this.stringifyCorruptions(corruptions)}`, this.context);
                break;
            }
            await HSUtils.sleep(this.sleepTime);
        }
    }

    private getNextCorruptionsFromCache(): CorruptionLoadout {
        const getVal = (name: string) => {
            const el = this.corrNext[name];
            // Default to 0 if element missing or invalid text
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

    public stopAutosing() {
        this.autosingEnabled = false;
        this.unsubscribeGameDataChanges();
        this.antiquitiesObserver?.disconnect(); // Ensure observer is cleared
        this.antiquitiesObserver = undefined;
        const singSetting = HSSettings.getSetting("startAutosing");
        singSetting.disable();
        if (this.timerModal) {
            this.timerModal.destroy();
            this.timerModal = undefined!;
        }
        HSUtils.stopDialogWatcher();
    }

    private async getStage(): Promise<string> {
        // Access the exposed synergismStage function directly

        if (!this.stageFunc) {
            if (!this.hasWarnedMissingStageFunc) {
                HSLogger.debug("Performance Warning: 'synergismStage' function not exposed. Falling back to slow DOM-based stage detection.", this.context);
                this.hasWarnedMissingStageFunc = true;
            }
            // Fallback to old method
            return this.getStageViaDOM();
        }

        try {
            const stage = this.stageFunc(0);
            HSLogger.debug(`Got stage directly: ${stage}`, this.context);
            return stage;
        } catch (error) {
            HSLogger.debug(`Error getting stage: ${error}`, this.context);
            // Fallback to old method
            return this.getStageViaDOM();
        }
    }

    private async getStageViaDOM(): Promise<string> {
        this.settingsTab.click();
        this.settingsSubTab.click();
        this.misc.click();

        const stageText = await this.getFromDOM<string>(this.stage, {
            regex: /Current Game Section:\s*(.+)/,
            predicate: t => t.includes("Current Game Section:")
        });

        if (!stageText) {
            HSLogger.debug("Could not find game stage text", this.context);
            return "";
        }

        HSLogger.debug(`Found stage: ${stageText} in settings`, this.context);
        return stageText;
    }

    /**
     * Robust DOM text retrieval with a safety predicate and timeout.
     * Prevents logic from hanging if an expected element is temporarily empty.
     */
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

    /**
     * Handles the complex animation of entering and leaving an Exaltation challenge.
     */
    private async enterAndLeaveExalt(): Promise<void> {
        const prevMainView = this.gamestate.getCurrentUIView<MainView>('MAIN_VIEW');

        const isInChallenge = () => {
            const style = window.getComputedStyle(this.exaltTimer);
            return style.display !== "none";
        };
        // Enter the challenge
        while (!isInChallenge()) {
            await HSUtils.click(this.exalt2Btn);
            await HSUtils.sleep(this.sleepTime);
        }
        // Leave the challenge
        while (isInChallenge()) {
            await HSUtils.click(this.exalt2Btn);
            await HSUtils.sleep(this.sleepTime);
        }
        prevMainView.goto();
    }

    private async getCurrentGoldenQuarks(): Promise<number> {
        const data = this.gameDataAPI?.getGameData();
        return data?.goldenQuarks ?? 0;
    }

    private async getCurrentQuarks(): Promise<number> {
        const data = this.gameDataAPI?.getGameData();
        return data?.worlds ?? 0;
    }

    private async getQuarksGain(): Promise<number> {
        const data = this.gameDataAPI?.getGameData();
        return data?.quarksThisSingularity ?? 0;
    }

    private async performSingularity(skipRecord: boolean = false): Promise<void> {
        const [qBefore, gqBefore] = await Promise.all([
            this.getCurrentQuarks(),
            this.getCurrentGoldenQuarks(),
        ]);
        await this.enterAndLeaveExalt();

        this.endStageDone = false;
        this.observerActivated = false;
        this.elevatorInput.value = this.targetSingularity.toString();
        // Trigger input event to update the game state
        this.elevatorInput.dispatchEvent(new Event('input', { bubbles: true }));
        this.elevatorTeleportButton.click();
        const [qAfter, gqAfter, stageInitial] = await Promise.all([
            this.getCurrentQuarks(),
            this.getCurrentGoldenQuarks(),
            this.getStage(),
        ]);

        const gqGain = Math.max(0, gqAfter - gqBefore);
        const qGain = Math.max(0, qAfter - qBefore);
        if (this.timerModal && !skipRecord) {
            this.timerModal.recordSingularity(gqGain, gqAfter, qGain, qAfter);
        }

        HSLogger.debug("Singularity performed", this.context);

        let stage = stageInitial;
        while (!this.isAllowedStage(stage)) {
            await HSUtils.sleep(1);
            stage = await this.getStage();
        }
        this.observeAntiquitiesRune()
        //await this.buyCoin()
        this.prevActionTime = performance.now();

        return Promise.resolve()
    }

    private isAllowedStage(stage: string): boolean {
        for (let i = 0, len = ALLOWED.length; i < len; i++) {
            if (stage.indexOf(ALLOWED[i]) !== -1) return true;
        }
        return false;
    }

    private getActiveC11to14Challenge(): number | null {
        for (let i = 11; i <= 14; i++) {
            if (this.isInChallenge(i)) {
                return i;
            }
        }
        return null;
    }

    private async waitForCompletion(
        challengeIndex: number,
        minCompletions: number,
        maxTime: number = 99999999,
        waitTime: number = 0
    ): Promise<void> {
        const sleepInterval = 10;
        const challengeBtn = this.challengeButtons[challengeIndex];
        const levelElement = this.levelElements[challengeIndex];
        if (!challengeBtn) {
            HSLogger.debug(`Challenge button ${challengeIndex} not found`, this.context);
            return Promise.resolve();
        }
        if (!levelElement) {
            HSLogger.debug(`Challenge level element ${challengeIndex} not found`, this.context);
            return Promise.resolve();
        }

        while (this.isInChallenge(challengeIndex)) {
            await HSUtils.sleep(5);
        }

        while (!this.isInChallenge(challengeIndex)) {
            this.fastDoubleClick(challengeBtn);
            if (this.isInChallenge(challengeIndex)) {
                break;
            }
            await HSUtils.sleep(5);
        }
        if (!this.isInChallenge(challengeIndex)) {
            HSLogger.debug(
                `Timeout: Failed to enter challenge ${challengeIndex}`,
                this.context
            );
            return Promise.resolve();
        }

        this.coin.click();

        const startTime = performance.now();
        const endTime = startTime + maxTime;

        let maxPossible: Decimal;
        if (challengeIndex === 15) {
            maxPossible = new Decimal(Infinity);
        } else {
            const maxPossibleText = levelElement.textContent ?? '';
            const parts = maxPossibleText.split('/');
            maxPossible = this.parseDecimal((parts[1] ?? '0').trim());
        }

        const minCompletionsDecimal = new Decimal(minCompletions);
        let lastText = '';
        let currentCompletions = new Decimal(0);

        while (performance.now() < endTime) {
            if (!this.isAutosingEnabled()) {
                this.stopAutosing();
                return Promise.resolve();
            }

            const rawText = levelElement.textContent ?? '';
            if (rawText !== lastText) {
                lastText = rawText;
                currentCompletions = this.parseDecimal(rawText.split('/')[0] ?? '0');
            }

            if (currentCompletions.gte(maxPossible)) {
                return Promise.resolve();
            } else if (currentCompletions.gte(minCompletionsDecimal)) {
                if (waitTime > 0) {
                    await HSUtils.sleep(waitTime);
                }
                return Promise.resolve();
            }
            await HSUtils.sleep(sleepInterval);
        }
        if (challengeIndex <= 10) {
            HSLogger.debug(`Timeout: Challenge ${challengeIndex} failed to reach ${minCompletions} completions within ${maxTime} ms`, this.context);
        }
    }

    /**
     * Maxes out a C11-14 challenge by entering it and waiting for C10 to push completions.
     * Waits until C11-14 completions stop increasing, then returns.
     */
    private async maxC11to14WithC10(challengeIndex: 11 | 12 | 13 | 14): Promise<void> {
        // Enter the C11-14 challenge, then C10
        await this.waitForCompletion(challengeIndex, 0, 0, 0);
        await this.waitForCompletion(10, 0, 0, 0);

        // Wait for the C11-14 completions to stop increasing
        let c11to14CurrentCompletions = this.getChallengeCompletions(challengeIndex);
        while (true) {
            await HSUtils.sleep(50);
            const c11to14CurrentCompletions2 = this.getChallengeCompletions(challengeIndex);
            if (c11to14CurrentCompletions2.eq(c11to14CurrentCompletions)) {
                return Promise.resolve(); // Completions stopped, exit
            }
            c11to14CurrentCompletions = c11to14CurrentCompletions2;
        }
    }

    private getChallengeGoal(challenge: number): number {
        const chal = document.getElementById(`challenge${challenge}level`) as HTMLParagraphElement | null;
        if (!chal) return 0;
        const text = chal.innerText;
        if (text.includes('/')) {
            const parts = text.split('/');
            return this.parseNumber(parts[1].trim());
        }
        return 9999;
    }

    private parseNumber(text: string): number {
        const parsed = parseFloat(text.replace(/,/g, '').trim());
        return isNaN(parsed) ? 0 : parsed;
    }

    private parseDecimal(text: string): Decimal {
        let cleanText = text.replace(/,/g, '').trim();
        // Remove known suffixes if any, though Decimal usually handles e-notation.
        // If the game uses specific suffixes (like M, B, T, etc.), we might need more complex logic.
        // Assuming standard number or scientific notation for now.
        try {
            return new Decimal(cleanText);
        } catch (e) {
            return new Decimal(0);
        }
    }

    private fastDoubleClick(element: HTMLElement): void {
        element.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    }

    private observeAntiquitiesRune(): void {

        if (!this.antiquitiesRuneLockedContainer) {
            HSLogger.debug("Could not find antiquitiesRuneLockedContainer element", this.context);
            return;
        }

        // Disconnect any previous observer
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

    private async performFinalStage() {
        if (this.endStagePromise) return; // already running

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
            this.saveType.checked = true;
            this.exportBtn.click();
            this.ascendBtn.click();

            // Stop at singularity's end requested
            if (this.stopAtSingularitysEnd && this.autosingEnabled) {
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

        await this.performSpecialAction(117); // Max C11
        await this.performSpecialAction(118); // Max C12
        await this.performSpecialAction(119); // Max C13
        await this.performSpecialAction(120); // Max C14

        await this.setCorruptions({ viscosity: 16, drought: 16, deflation: 16, extinction: 16, illiteracy: 16, recession: 16, dilation: 16, hyperchallenge: 16 });

        await this.waitForCompletion(15, 0, 7777, 0);
        this.autoChallengeButton.click();
        await HSUtils.sleep(3000);

        this.exitAscBtn.click();
        this.ambrosia_ambrosia.click();

        return Promise.resolve();
    }
}
