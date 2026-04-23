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
import { HSQuickbarManager } from "../hs-qolQuickbarManager";

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
export class HSAutosing extends HSModule {
    static readonly #DECIMAL_INFINITY = new Decimal(Infinity);
    static readonly #DECIMAL_9999 = new Decimal(9999);
    static readonly #DECIMAL_0 = new Decimal(0);
    static readonly #BACKGROUND_COLOR_REGEX = /background-color/i;
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
    #upg81Btn!: HTMLButtonElement;

    // DOM Elements - Antiquities
    #antiquitiesRuneLockedContainer!: HTMLDivElement;

    // State Management
    #endStageDone: boolean = false;
    #antiquitiesObserver?: MutationObserver;
    #antiquitiesObserverActivated: boolean = false;
    #endStagePromise?: Promise<void>;
    #endStagePromiseResolve?: () => void;
    #upg81Observer?: MutationObserver;
    #upg81Promise?: Promise<boolean>;
    #upg81PromiseResolve?: (value: boolean) => void;
    #upg81ClickTimerId?: number;
    #exaltStateObserver?: MutationObserver;
    #waitForExaltStateActive?: {
        targetState: boolean;
        resolve: (value: boolean) => void;
        finished: boolean;
    };
    #challengeCompletionObserver?: MutationObserver;
    #challengeObserverActive?: {
        predicate: () => boolean;
        resolve: () => void;
        finished: boolean;
    };
    #waitForClassConditionObserver?: MutationObserver;
    #waitForClassConditionObservedElement?: Element;
    #waitForClassConditionActive?: {
        element: Element;
        condition: () => boolean;
        resolve: (value: boolean) => void;
        finished: boolean;
    };
    #waitForInnerTextObserver?: MutationObserver;
    #waitForInnerTextObservedElement?: HTMLElement;
    #waitForInnerTextActive?: {
        el: HTMLElement;
        predicate: (text: string) => boolean;
        resolve: () => void;
        reject: (error: Error) => void;
        finished: boolean;
    };

    // Game References
    #stageFunc?: (arg0: number) => any;
    #getMaxChallengesFunc?: (i: number) => number;
    #applyCorruptionsFunc?: (json: string) => boolean;
//  #enterExaltFunc?: () => void;
//  #exitExaltFunc?: () => void;
    #exposedPlayer: typeof HSGlobal.exposedPlayer = null;
    #isExposureReady: boolean = false;
    #gamestate!: HSGameState;

    #autosingModal?: HSAutosingModal;

    // Strategy Caches
    readonly #phaseIndexByOption = new Map<PhaseOption, number>(phases.map((p, i) => [p, i] as const));
    #strategyPhaseRanges?: Array<{ phase: AutosingStrategyPhase; startIndex: number; endIndex: number }>;
    #finalPhaseConfig?: AutosingStrategyPhase;


    // ============================================================================
    // INITIALIZATION - CACHIIIING
    // ============================================================================

    init(): Promise<void> {
        this.isInitialized = true;
        return Promise.resolve();
    }

    #cacheSettingsElements(): boolean {
        const elements = {
            settingsTab:    document.getElementById('settingstab')          as HTMLButtonElement    | null,
            settingsSubTab: document.getElementById('switchSettingSubTab4') as HTMLButtonElement    | null,
            misc:           document.getElementById('kMisc')                as HTMLButtonElement    | null,
            stage:          document.getElementById('gameStageStatistic')   as HTMLParagraphElement | null,
        };
        if (!this.#ensureElements(elements)) return false;

        this.#settingsTab    = elements.settingsTab;
        this.#settingsSubTab = elements.settingsSubTab;
        this.#misc           = elements.misc;
        this.#stage          = elements.stage;
        return true;
    }

    #cacheChallengeElements(): boolean {
        for (let i = 1; i <= 15; i++) {
            const elements = {
                challengeButton: document.getElementById(`challenge${i}`)      as HTMLButtonElement    | null,
                challengeLevel:  document.getElementById(`challenge${i}level`) as HTMLParagraphElement | null,
            };
            if (!this.#ensureElements(elements)) return false;

            this.#challengeButtons[i] = elements.challengeButton;
            this.#levelElements[i]    = elements.challengeLevel;
        }
        this.#buildChallengeAccessors();
        return true;
    }

    #cacheButtonElements(): boolean {
        const elements = {
            exitTranscBtn:          document.getElementById('challengebtn')                   as HTMLButtonElement | null,
            exitReincBtn:           document.getElementById('reincarnatechallengebtn')        as HTMLButtonElement | null,
            exitAscBtn:             document.getElementById('ascendChallengeBtn')             as HTMLButtonElement | null,
            ascendBtn:              document.getElementById('ascendbtn')                      as HTMLButtonElement | null,
            autoChallengeButton:    document.getElementById('toggleAutoChallengeStart')       as HTMLButtonElement | null,
            autoAntSacrificeButton: document.getElementById('toggleAutoSacrificeAnt')         as HTMLButtonElement | null,
            autoAscendButton:       document.getElementById('ascensionAutoEnable')            as HTMLButtonElement | null,
            antSacrifice:           document.getElementById('antSacrifice')                   as HTMLButtonElement | null,
            AOAG:                   document.getElementById('antiquitiesRuneSacrifice')       as HTMLButtonElement | null,
            exalt2Btn:              document.getElementById('oneChallengeCap')                as HTMLButtonElement | null,
            exaltTimer:             document.getElementById('ascSingChallengeTimeTakenStats') as HTMLSpanElement   | null,
            elevatorTeleportButton: document.getElementById('elevatorTeleportButton')         as HTMLButtonElement | null,
            elevatorInput:          document.getElementById('elevatorTargetInput')            as HTMLInputElement  | null,
            upg81Btn:               document.getElementById('upg81')                          as HTMLButtonElement | null,
        };
        if (!this.#ensureElements(elements)) return false;

        this.#exitTranscBtn          = elements.exitTranscBtn;
        this.#exitReincBtn           = elements.exitReincBtn;
        this.#exitAscBtn             = elements.exitAscBtn;
        this.#ascendBtn              = elements.ascendBtn;
        this.#autoChallengeButton    = elements.autoChallengeButton;
        this.#autoAntSacrificeButton = elements.autoAntSacrificeButton;
        this.#autoAscendButton       = elements.autoAscendButton;
        this.#antSacrifice           = elements.antSacrifice;
        this.#AOAG                   = elements.AOAG;
        this.#exalt2Btn              = elements.exalt2Btn;
        this.#exaltTimer             = elements.exaltTimer;
        this.#elevatorTeleportButton = elements.elevatorTeleportButton;
        this.#elevatorInput          = elements.elevatorInput;
        this.#upg81Btn               = elements.upg81Btn;
        return true;
    }

    #cacheHeptractButtons(): boolean {
        const ids = [
            'chronosHepteractAuto',
            'hyperrealismHepteractAuto',
            'quarkHepteractAuto',
            'challengeHepteractAuto',
            'abyssHepteractAuto',
            'acceleratorHepteractAuto',
            'acceleratorBoostHepteractAuto',
            'multiplierHepteractAuto',
            'hepteractToQuarkTradeAuto',
        ];
        const buttonMap = Object.fromEntries(
            ids.map(id => [id, document.getElementById(id) as HTMLButtonElement | null])
        ) as Record<string, HTMLButtonElement | null>;
        if (!this.#ensureElements(buttonMap)) return false;

        this.#heptractBtns = ids.map(id => buttonMap[id]!);
        return true;
    }

    #cacheCorruptionElements(): boolean {
        const corrNextElements: Record<string, HTMLElement | null> = Object.fromEntries(
            CORRUPTION_NAMES.map(name => [`corrNext${name}`, document.getElementById(`corrNext${name}`) as HTMLElement | null])
        ) as Record<string, HTMLElement | null>;

        const elements = {
            addCodeAllBtn:   document.getElementById("addCodeAll")      as HTMLButtonElement | null,
            timeCodeBtn:     document.getElementById("timeCode")        as HTMLButtonElement | null,
            corruptionStats: document.getElementById('corruptionStats') as HTMLElement       | null,
            promptText:      document.getElementById('prompt_text')     as HTMLInputElement  | null,
            okPrompt:        document.getElementById('ok_prompt')       as HTMLButtonElement | null,
            corrImportBtn:   document.querySelector('#corruptionLoadoutTable button.corrImport') as HTMLButtonElement | null,
            ...corrNextElements,
        } as Record<string, HTMLElement | null>;
        if (!this.#ensureElements(elements)) return false;

        const corrNext = Object.fromEntries(
            CORRUPTION_NAMES.map(name => [`corrNext${name}`, elements[`corrNext${name}`] as HTMLElement])
        ) as Record<string, HTMLElement>;

        this.#addCodeAllBtn     = elements.addCodeAllBtn as HTMLButtonElement;
        this.#timeCodeBtn       = elements.timeCodeBtn   as HTMLButtonElement;
        this.#corruptionManager = new HSAutosingCorruption(
            corrNext,
            elements.corruptionStats as HTMLElement,
            elements.promptText      as HTMLInputElement,
            elements.okPrompt        as HTMLButtonElement,
            elements.corrImportBtn   as HTMLButtonElement,
        );
        return true;
    }

    async #cacheAmbrosiaLoadoutButtons(): Promise<boolean> {
        const earlyCubeVal = HSSettings.getSetting("autosingEarlyCubeLoadout").getValue();
        const lateCubeVal  = HSSettings.getSetting("autosingLateCubeLoadout").getValue();
        const quarkVal     = HSSettings.getSetting("autosingQuarkLoadout").getValue();
        const obtVal       = HSSettings.getSetting("autosingObtLoadout").getValue();
        const offVal       = HSSettings.getSetting("autosingOffLoadout").getValue();
        const ambrosiaVal  = HSSettings.getSetting("autosingAmbrosiaLoadout").getValue();

        const ambPrefix = HSGlobal.HSAmbrosia.quickBarLoadoutIdPrefix;
        const elements = {
            earlyCube: document.getElementById(`${ambPrefix}-blueberryLoadout${earlyCubeVal}`) as HTMLButtonElement | null,
            lateCube:  document.getElementById(`${ambPrefix}-blueberryLoadout${lateCubeVal}`)  as HTMLButtonElement | null,
            quark:     document.getElementById(`${ambPrefix}-blueberryLoadout${quarkVal}`)     as HTMLButtonElement | null,
            obt:       document.getElementById(`${ambPrefix}-blueberryLoadout${obtVal}`)       as HTMLButtonElement | null,
            off:       document.getElementById(`${ambPrefix}-blueberryLoadout${offVal}`)       as HTMLButtonElement | null,
            luck:      document.getElementById(`${ambPrefix}-blueberryLoadout${ambrosiaVal}`)  as HTMLButtonElement | null,
        };
        if (!this.#ensureElements(elements)) return false;

        this.#ambrosia_early_cube = elements.earlyCube;
        this.#ambrosia_late_cube  = elements.lateCube;
        this.#ambrosia_quark      = elements.quark;
        this.#ambrosia_obt        = elements.obt;
        this.#ambrosia_off        = elements.off;
        this.#ambrosia_luck       = elements.luck;
        return true;
    }

    #cacheMiscElements(): boolean {
        const elements = {
            saveType:                       document.getElementById('saveType')                       as HTMLInputElement | null,
            antiquitiesRuneLockedContainer: document.getElementById('antiquitiesRuneLockedContainer') as HTMLDivElement   | null,
        };
        if (!this.#ensureElements(elements)) return false;

        this.#saveType = elements.saveType;
        this.#antiquitiesRuneLockedContainer = elements.antiquitiesRuneLockedContainer;
        
        const gamestate = HSModuleManager.getModule<HSGameState>("HSGameState");
        if (!gamestate) {
            HSLogger.warn('HSGameState module not found during misc element caching', this.context);
            return false;
        }
        this.#gamestate = gamestate;
        return true;
    }

    #cacheObservers(): void {
        // upg81 observer, for the antiBuyCoinBug
        if (!this.#upg81Observer && this.#upg81Btn) {
            this.#upg81Observer = new MutationObserver((mutations) => {
                for (const mutation of mutations) {
                    if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                        const isGreen = this.#upg81Btn.classList.contains('green-background');
                        if (isGreen && this.#upg81PromiseResolve) {
                            HSLogger.debug(() => `-------> #upg81 turned green o/`, this.context);
                            this.#stopUpg81Clicking();
                            this.#upg81PromiseResolve(true);
                            this.#upg81PromiseResolve = undefined;
                            this.#upg81Observer?.disconnect();
                        }
                    }
                }
            });
        }

        // Antiquities observer, starting AOAG phase
        if (!this.#antiquitiesObserver && this.#antiquitiesRuneLockedContainer) {
            this.#antiquitiesObserver = new MutationObserver(mutations => {
                for (const mutation of mutations) {
                    if ((mutation.target as HTMLElement).style.display === 'none') {
                        HSLogger.debug(() => 'antiquitiesRuneLockedContainer found hidden - buying antiquities', this.context);
                        this.#antiquitiesObserverActivated = true;
                        this.#antiquitiesObserver?.disconnect();
                        this.#performFinalStage().catch(error => {
                            HSLogger.warn(`Error during final stage: ${error instanceof Error ? error.message : String(error)}`, this.context);
                            this.stopAutosing();
                        });
                        break;
                    }
                }
            });
        }

        // Exalt state observer, to ensure enterAndLeaveExalt does indeed enter and leave
        if (!this.#exaltStateObserver) {
            this.#exaltStateObserver = new MutationObserver(() => {
                if (!this.#waitForExaltStateActive) return;
                if (this.#isInExalt() === this.#waitForExaltStateActive.targetState) {
                    this.#cleanupWaitForExaltState(true);
                }
            });
        }

        // Challenge completion observer, used to check if we're inside a specific challenge or not
        if (!this.#challengeCompletionObserver) {
            this.#challengeCompletionObserver = new MutationObserver(() => {
                if (!this.#challengeObserverActive) return;
                if (this.#challengeObserverActive.predicate()) {
                    this.#cleanupChallengeObserver();
                }
            });
        }

        // Class condition observer, 
        if (!this.#waitForClassConditionObserver) {
            this.#waitForClassConditionObserver = new MutationObserver(() => {
                if (!this.#waitForClassConditionActive) return;
                if (this.#waitForClassConditionActive.condition()) {
                    this.#cleanupWaitForClassCondition(true);
                }
            });
        }

        // Inner text observer, used for checking the stage
        if (!this.#waitForInnerTextObserver) {
            this.#waitForInnerTextObserver = new MutationObserver(() => {
                if (!this.#waitForInnerTextActive) return;
                if (this.#waitForInnerTextActive.predicate(this.#waitForInnerTextActive.el.textContent ?? "")) {
                    this.#cleanupWaitForInnerText(true);
                }
            });
        }
    }

    async #cacheExposedFunctions(): Promise<void> {
        this.#exportBtn = document.getElementById('exportgame') as HTMLButtonElement;
        this.#exportBtnClone = this.#exportBtn ? (this.#exportBtn.cloneNode(true) as HTMLButtonElement) : undefined;
        if (this.#exportBtnClone && (window as any).__HS_EXPORT_EXPOSED)
            this.#setupExportButtonClone();

        this.#exposedPlayer         = HSGlobal.exposedPlayer                    ?? null;
        this.#stageFunc             = (window as any).__HS_synergismStage       ?? null;
        this.#getMaxChallengesFunc  = (window as any).__HS_getMaxChallenges     ?? null;
        const isAutoConfirmPatched  = (window as any).__HS_AUTO_CONFIRM_PATCHED ?? false;
        const isAfterTackHooked     = HSUtils.cacheAfterTackHook();

        // We need either __HS_AUTO_CONFIRM or startDialogWatcher
        if (!isAutoConfirmPatched) HSUtils.startDialogWatcher();

        /*
        const needsCorruptions = !this.#applyCorruptionsFunc;
        const needsExalt       = !this.#enterExaltFunc || !this.#exitExaltFunc;

        HSLogger.debug(() => `Late patchs needed? Corruptions: ${needsCorruptions}, needsExalt: ${needsExalt}`, this.context);
        if (needsCorruptions || needsExalt) {
            HSLogger.debug(() => 'Triggering late patches...', this.context);
            const prevMainView = this.#gamestate.getCurrentUIView<MainView>('MAIN_VIEW');

            // Calling applyCorruptions via setCorruptions exposes window.__HS_applyCorruptions.
            if (needsCorruptions) await this.#corruptionManager.setCorruptions(ZERO_CORRUPTIONS);
                
            // #enterAndLeaveExalt calls enableChallenge then exitChallenge, exposing both
            // window.__HS_enterExalt and window.__HS_exitExalt.
            if (needsExalt) { await this.#enterAndLeaveExalt(); }

            prevMainView.goto();
        }
        */

        // Triggering the late setCorruptions patch in order to check if it's available (could be done at mod load...)
        await this.#corruptionManager.setCorruptions(ZERO_CORRUPTIONS);

        // Read all four: they should now be set on window.
    //  this.#enterExaltFunc       = (window as any).__HS_enterExalt       ?? null;
    //  this.#exitExaltFunc        = (window as any).__HS_exitExalt        ?? null;
        this.#applyCorruptionsFunc = (window as any).__HS_applyCorruptions ?? null;
        this.#corruptionManager.setApplyCorruptionsFunc(this.#applyCorruptionsFunc ?? null);

        this.#isExposureReady = 
            !!(this.#stageFunc && this.#exposedPlayer && this.#getMaxChallengesFunc && isAutoConfirmPatched && isAfterTackHooked && this.#applyCorruptionsFunc 
                // && this.#enterExaltFunc && this.#exitExaltFunc
            );

        const exposureMsg = `Exposure status:
            stageFunc: ${!!this.#stageFunc},
            exposedPlayer: ${!!this.#exposedPlayer},
            getMaxChallengesFunc: ${!!this.#getMaxChallengesFunc},
            onAfterTackHook: ${isAfterTackHooked},
            applyCorruptionsFunc: ${!!this.#applyCorruptionsFunc},
            autoConfirmPatched: ${isAutoConfirmPatched},
            ` +
        //  enterExaltFunc: ${!!this.#enterExaltFunc},
        //  exitExaltFunc: ${!!this.#exitExaltFunc},
            `? isExposureReady: ${this.#isExposureReady}.`;
        if (this.#isExposureReady) HSLogger.debug(() => exposureMsg, this.context);
        else HSLogger.warn(exposureMsg, this.context);
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
                window.setTimeout(() => { (window as any).__HS_exportData = exportBackup; }, 100);
            },
            true
        );
    }

    async cacheAlmostEverything(): Promise<boolean> {
        if (!this.#cacheSettingsElements()) return false;
        if (!this.#cacheChallengeElements()) return false;
        if (!this.#cacheButtonElements()) return false;
        if (!this.#cacheHeptractButtons()) return false;
        if (!this.#cacheCorruptionElements()) return false;
        if (!await this.#cacheAmbrosiaLoadoutButtons()) return false;
        if (!this.#cacheMiscElements()) return false;
        return true;
    }


    // ============================================================================
    // ENABLE / DISABLE AUTOSING
    // ============================================================================

    async enableAutoSing(): Promise<void> {
        if (!await this.cacheAlmostEverything()) { this.stopAutosing(); return; }

        this.#autosingModal?.destroy();
        this.#autosingModal = new HSAutosingModal();
        const strategy = await this.#loadStrategy();
        if (!strategy) { this.stopAutosing(); return; }

        this.#strategy = strategy;
        this.#rebuildStrategyPhaseCaches();
        this.#corruptionManager.buildLoadoutCache(strategy.corruptionLoadouts ?? []);

        if (!HSGlobal.General.isModFullyLoaded) { HSLogger.debug(() => "Hypersynergism is still loading. Please wait before starting Auto-Sing.", this.context); return; }
        if (this.#isInExalt()) { HSLogger.debug(() => "Cannot start Auto-Sing while inside a singularity challenge.", this.context); return; }

        // This needs to be done before cacheExposedFunctions since it enables __HS_AUTO_CONFIRM
        this.#hsSettingsToRestore = await HSAutosingSettingsFixer.fixAllSettings();
        this.#cacheObservers();
        await this.#cacheExposedFunctions();

        this.#autosingEnabled = true;
        this.#stopAtSingularitysEnd = false;
        this.#endStageDone = false;
        this.#antiquitiesObserverActivated = false;
        this.#endStagePromise = undefined;
        this.#hasWarnedMissingStageFunc = false;
        this.#storedC15 = 0;

        if (!await this.#validateAutosingSetupAndRequirements()) { this.stopAutosing(); return; }

        this.#performAutosingLogic();
    }

    public async restartAutosing(): Promise<void> {
        if (this.#autosingEnabled) {
            this.stopAutosing();
        }
        window.setTimeout(() => this.enableAutoSing(), 500);
    }

    public stopAutosing(options?: { showReviewModal?: boolean }): void {
        if (!this.#autosingEnabled) return;
        void this.#stopAutosingCore({ modalDisposition: options?.showReviewModal ? 'review' : 'destroy' });

        const autosingSetting = HSSettings.getSetting("startAutosing");
        if (autosingSetting && autosingSetting.isEnabled()) {
            autosingSetting.disable();
        }
        HSAutosingSettingsFixer.restoreUnwantedSettings(this.#hsSettingsToRestore);
        HSLogger.log(`Autosing stopped.`, this.context);
    }

    async #stopAutosingCore(options: { modalDisposition: 'review' | 'destroy' }): Promise<void> {
        this.#autosingEnabled = false;
        this.#saveType.checked = false;

        this.#antiquitiesObserver?.disconnect();
        this.#antiquitiesObserver = undefined;

        this.#upg81Observer?.disconnect();
        this.#upg81Observer = undefined;
        this.#stopUpg81Clicking();
        this.#upg81PromiseResolve = undefined;
        this.#upg81Promise = undefined;

        this.#exaltStateObserver?.disconnect();
        this.#exaltStateObserver = undefined;
        this.#cleanupWaitForExaltState(false);

        this.#challengeCompletionObserver?.disconnect();
        this.#challengeCompletionObserver = undefined;
        this.#cleanupChallengeObserver();

        this.#waitForClassConditionObserver?.disconnect();
        this.#waitForClassConditionObserver = undefined;
        this.#waitForClassConditionObservedElement = undefined;
        this.#cleanupWaitForClassCondition(false);

        this.#waitForInnerTextObserver?.disconnect();
        this.#waitForInnerTextObserver = undefined;
        this.#waitForInnerTextObservedElement = undefined;
        this.#cleanupWaitForInnerText(false);

        if (this.#endStagePromiseResolve) {
            try { this.#endStagePromiseResolve(); } catch (e) { /* ignore */ }
            this.#endStagePromiseResolve = undefined;
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
        await HSUtils.stopDialogWatcher();
    }

    public closeAutosingModalAfterReview(): void {
        if (this.#autosingModal) {
            this.#autosingModal.destroy();
            this.#autosingModal = undefined;
        }
    }

    async #validateAutosingSetupAndRequirements(): Promise<boolean> {
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
            // window.confirm is the native browser dialog, not the same as the game's
            // patched confirm/alert hooks, so __HS_AUTO_CONFIRM_PATCHED does NOT intercept this.
            if (!window.confirm(`AutoSing is not fully functional until you completed EXALT6 at least once.`)) {
                return false;
            }
        }

        if (this.#targetSingularity > gameData.highestSingularityCount) {
            HSLogger.debug(() => `Target singularity bigger than highest. Going to highest.`);
            this.#targetSingularity = gameData.highestSingularityCount;
        }

        this.#elevatorInput.value = this.#targetSingularity.toString();
        this.#elevatorInput.dispatchEvent(new Event('input', { bubbles: true }));
        HSLogger.log(`Autosing requirements checked for target singularity: ${this.#targetSingularity}`, this.context);

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
            HSUI.Notify(`Could not find or load strategy "${selectedRawName}" - Autosing stopped.`, { notificationType: "warning" });
            return null;
        }

        const runtimeStrategy: HSAutosingStrategy = JSON.parse(JSON.stringify(strategy));

        // Insert special steps at the start of the first phase
        this.#insertAntiBuyCoinBugStep(runtimeStrategy);
        HSLogger.log(`Loaded strategy "${selectedRawName}" (AntiBuyCoinBug step inserted as first step, and potential obt-switch step removed)`, this.context);

        return runtimeStrategy;
    }

    /** Inserts special steps at the start of the first phase's strat array, adjusting ifJump indices. */
    #insertAntiBuyCoinBugStep(strategy: any): void {
        const stepsToInsert = [
            {
                comment: "==> Anti buy coin bug",
                challengeNumber: 999,
                challengeCompletions: 0,
                challengeWaitBefore: 0,
                challengeWaitTime: 0,
                challengeMaxTime: 0
            }
        ];

        if (!strategy || !Array.isArray(strategy.strategy) || strategy.strategy.length === 0) return;
        const firstPhase = strategy.strategy[0];
        if (!firstPhase || !Array.isArray(firstPhase.strat)) return;
        let nbSteps = stepsToInsert.length;

        // Remove probable pre-existing Obt switch as first step
        if (firstPhase.strat[0]?.challengeNumber === 304) {
            firstPhase.strat.splice(0, 1);
            nbSteps--;
        }

        // Insert at the start
        firstPhase.strat.unshift(...stepsToInsert);

        // Adjust ifJump.ifJumpIndex for all steps in the first phase
        for (const step of firstPhase.strat) {
            if (step.ifJump && typeof step.ifJump.ifJumpIndex === 'number') {
                step.ifJump.ifJumpIndex += nbSteps;
            }
        }
    }


    // ============================================================================
    // MAIN AUTOSING LOGIC
    // ============================================================================

    async #performAutosingLogic(): Promise<void> {
        try {
            await this.#useAddAndTimeCodes();

            if (this.#autosingModal) {
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

            // Main autosing loop
            while (this.#autosingEnabled) {
                if (this.#endStageDone || this.#antiquitiesObserverActivated) {
                    await this.#endStagePromise;
                    continue;
                }

                while (this.#autosingEnabled && !this.#endStageDone && !this.#antiquitiesObserverActivated) {
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
            if (!finalPhase) { HSLogger.warn("No final phase found in strategy - Autosing stopped.", this.context); this.stopAutosing(); return; }
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
        if (stageStartIndex === -1 || stageEndIndex === -1) { HSLogger.warn(`Unknown stage ${stage} - Autosing stopped.`, this.context); this.stopAutosing(); return; }

        const phaseConfig = this.#strategyPhaseRanges!.find((r) => stageStartIndex >= r.startIndex && stageEndIndex <= r.endIndex)?.phase ?? null;
        if (!phaseConfig) { HSLogger.warn(`No strategy phase matched for stage ${stage} - Autosing stopped.`, this.context); this.stopAutosing(); return; }

        HSLogger.debug(() => `Executing phase: ${phaseConfig.startPhase}-${phaseConfig.endPhase}`, this.context);
        await this.#executePhase(phaseConfig);
    }


    // ============================================================================
    // PHASE EXECUTION
    // ============================================================================

    async #executePhase(
        phaseConfig: AutosingStrategyPhase,
        options?: {
            phaseLabelOverride?: string;
            ignoreObserverActivated?: boolean;
        }
    ): Promise<void> {
        const phaseLabelOverride      = options?.phaseLabelOverride;
        const ignoreObserverActivated = options?.ignoreObserverActivated;
        const phaseLabel = phaseLabelOverride ?? `${phaseConfig.startPhase}-${phaseConfig.endPhase}`;
        this.#autosingModal?.setCurrentPhase(phaseLabel);

        const phaseLoadout = this.#corruptionManager.getPhaseCorruptionLoadout(phaseConfig);
        if (phaseLoadout)
            await this.#corruptionManager.setCorruptions(phaseLoadout);

        this.#ascendBtn.click();

        const isEndPhase = phaseConfig.endPhase === "end";
        for (let i = 0; i < phaseConfig.strat.length; i++) {
            // Autosing disabled or AOAG observer activated
            if (!this.#autosingEnabled || (this.#antiquitiesObserverActivated && !isEndPhase && !ignoreObserverActivated)) {
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
                    HSLogger.debug(() => `Step#${actionIndex} - C${challenge.challengeNumber}: waiting for ${challenge.challengeCompletions ?? 0} completions, then wait ${challenge.challengeWaitTime}ms (max time: ${challenge.challengeMaxTime}ms)`, this.context);
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
            case 104: // Ascend
                this.#ascendBtn.click();
                break;
            case 151: // Wait
                break;
            case 152: // Ant sac
                this.#antSacrifice.click();
                break;
            case 153: // Auto Challenge Toggle
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
                this.#heptractBtns[actionId - 701]?.click();
                break;
            case 901:
                this.#AOAG.click();
                break;
            case 902: // Restart AutoSing
                this.restartAutosing();
                break;
            case 903: // Stop AutoSing
                this.stopAutosing();
                break;
            case 999: // Anti buy coin bug, in order to be inserted in the strategy
                await this.#waitForGreenUpg81();
                break;
            default:
                HSLogger.warn(`Unknown special action ${actionId}`, this.context);
        }
    }


    // ============================================================================
    // CHALLENGE RESOLUTION
    // ============================================================================

    async #waitForCompletion(
        challengeIndex: number,
        minCompletions: number,
        maxTime: number = 99999999,
        waitTime: number = 0
    ): Promise<void> {
        const sleepInterval = 5;
        const accessor = this.#getChallengeAccessor(challengeIndex);
        const challengeBtn = accessor.button;

        // Fast path: use exposedPlayer.currentChallenge instead of MutationObserver/class polling.
        // player.currentChallenge stores the absolute button index (1-15) per tier, 0 = not active.
        // Multiple tiers can be active simultaneously, but each challenge maps to exactly one field.
        if (this.#isExposureReady) {
            const p = this.#exposedPlayer!;
            const isChallengeActive = challengeIndex <= 5
                ? () => p.currentChallenge.transcension === challengeIndex
                : challengeIndex <= 10
                    ? () => p.currentChallenge.reincarnation === challengeIndex
                    : () => p.currentChallenge.ascension     === challengeIndex;
            while (isChallengeActive()) await HSUtils.yield();
            this.#fastDoubleClick(challengeBtn!);
            while (!isChallengeActive()) await HSUtils.yield();
        } else {
            const isActive = accessor.isActive;
            // The challenge DOM is not always updated when not in the Challenges tab, this is a quickfix for that...
            // I think we could even skip the 'not inside' check and go directly to the double click...?
            const exitButton = challengeIndex <= 5
                ? this.#exitTranscBtn
                : challengeIndex <= 10
                    ? this.#exitReincBtn
                    : this.#exitAscBtn;
            const skipInactiveWait = !HSAutosing.#BACKGROUND_COLOR_REGEX.test(exitButton?.getAttribute('style') ?? '');
            if (!skipInactiveWait) {
                await this.#waitForClassCondition(challengeBtn!, () => !isActive());
            }
            this.#fastDoubleClick(challengeBtn!);
            await this.#waitForClassCondition(challengeBtn!, () => isActive());
        }

        const endTime = performance.now() + maxTime;

        // Fast path: C1-C15 with exposed player: no DOM reads, no Decimal.
        // C1-C14: challengecompletions[i] capped by getMaxChallenges(i).
        // C15: challenge15Exponent (raw score, unbounded maxPossible = Infinity never fires).
        if (this.#isExposureReady) {
            const p2 = this.#exposedPlayer!;
            const isC15 = challengeIndex === 15;
            const maxPossible = isC15 ? Infinity : this.#getMaxChallengesFunc!(challengeIndex);
            let current = 0;

            while (true) {
                const now = performance.now();
                if (now >= endTime) {
                    if (challengeIndex <= 10 && minCompletions !== 0) {
                        HSLogger.warn(`-------> Timeout: C${challengeIndex} only reached ${current}/${minCompletions} completions within ${maxTime} ms`, this.context);
                    }
                    return;
                }
                if (!this.#autosingEnabled) return;

                current = isC15 ? p2.challenge15Exponent : p2.challengecompletions[challengeIndex];
                if (current >= maxPossible || current >= minCompletions) {
                    if (waitTime > 0) await HSUtils.sleep(waitTime);
                    HSLogger.debug(() => `-------> C${challengeIndex}: ${current} ${isC15 ? 'exponent' : 'completions'} reached`, this.context);
                    return;
                }

                const remaining = endTime - now;
                remaining < sleepInterval ? await HSUtils.sleep(remaining) : await HSUtils.waitForNextTack();
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
                if (now >= endTime) { 
                    if (challengeIndex <= 10 && minCompletions !== 0) {
                        HSLogger.warn(`-------> Timeout: C${challengeIndex} only reached ${currentCompletions}/${minCompletions} completions within ${maxTime}ms`, this.context);
                    }
                    return;
                }
                if (!this.#autosingEnabled) return;

                const rawText = getLevelText();
                if (rawText !== lastText) {
                    lastText = rawText;
                    currentCompletions = getCompletions();
                }

                if (currentCompletions.gte(maxPossible) || currentCompletions.gte(minCompletionsDecimal)) {
                    if (waitTime > 0) await HSUtils.sleep(waitTime);
                    HSLogger.debug(() => `-------> C${challengeIndex}: ${currentCompletions} completions reached`, this.context);
                    return;
                }

                const remaining = endTime - now;
                await HSUtils.sleep(remaining < sleepInterval ? remaining : sleepInterval);
            }
        }
    }

    async #maxC11to14WithC10(challengeIndex: 11 | 12 | 13 | 14): Promise<void> {
        await this.#waitForCompletion(challengeIndex, 0, 0, 0);
        await this.#waitForCompletion(10, 0, 0, 0);

        const accessor = this.#getChallengeAccessor(challengeIndex);
        const levelElement = accessor.levelElement;

        // Fast path: no DOM text parsing, no Decimal
        if (this.#isExposureReady) {
            const maxPossible = this.#getMaxChallengesFunc!(challengeIndex);
            if (this.#exposedPlayer!.challengecompletions[challengeIndex] >= maxPossible) return;

            await new Promise<void>((resolve) => {
                if (this.#challengeObserverActive) {
                    this.#cleanupChallengeObserver();
                }

                // I should maybe add back a timeout for this observer...
                this.#challengeObserverActive = {
                    predicate: () => this.#exposedPlayer!.challengecompletions[challengeIndex] >= maxPossible,
                    resolve,
                    finished: false,
                };

                this.#challengeCompletionObserver?.disconnect();
                this.#challengeCompletionObserver?.observe(levelElement!, { childList: true, characterData: true, subtree: true });
                if (this.#challengeObserverActive.predicate()) this.#cleanupChallengeObserver();
            });
        } else {
            // Fallback: DOM text parsing + Decimal
            const getCompletions = accessor.getCompletions;
            const maxPossible = accessor.getGoal();
            if (getCompletions().gte(maxPossible)) return;

            await new Promise<void>((resolve) => {
                if (this.#challengeObserverActive) {
                    this.#cleanupChallengeObserver();
                }

                this.#challengeObserverActive = {
                    predicate: () => getCompletions().gte(maxPossible),
                    resolve,
                    finished: false,
                };

                this.#challengeCompletionObserver?.disconnect();
                this.#challengeCompletionObserver?.observe(levelElement!, { childList: true, characterData: true, subtree: true });
                if (this.#challengeObserverActive.predicate()) this.#cleanupChallengeObserver();
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
                    if (HSLogger.isDebugEnabled) HSLogger.debug(() => `-------> C${challengeIndex}: maxed or no more completions after ${maxTime}ms`, this.context);
                    return;
                }

                await HSUtils.waitForNextTack();
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
                    if (HSLogger.isDebugEnabled) HSLogger.debug(() => `-------> C${challengeIndex}: maxed or no more completions after ${maxTime}ms`, this.context);
                    return;
                }

                await HSUtils.waitForNextTack();
            }
        }
    }


    // ============================================================================
    // STAGE
    // ============================================================================

    async #getStage(): Promise<string> {
        if (this.#isExposureReady) {
            // Fast path with the exposed function: never fall through to DOM navigation.
            // A transient throw during a sing transition returns '' so the wait
            // loop retries on the next tick rather than navigating to Settings.
            try {
                return this.#stageFunc!(0);
            } catch (error) {
                HSLogger.debug(() => `Error getting stage from stageFunc: ${error}`, this.context);
                return '';
            }
        } else {
            // No fast path: warn once, then try text content, then fall back to DOM navigation.
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
        { regex, parser, predicate = t => t.trim().length > 0 }: GetFromDOMOptions<T>
    ): Promise<T | null> {
        if (!el) return null;

        await this.#waitForInnerText(el, predicate);

        const text = el.textContent ?? "";
        const extracted = regex
            ? text.match(regex)?.[1] ?? null
            : text;
        if (!extracted) return null;

        return parser ? parser(extracted.trim()) : (extracted.trim() as unknown as T);
    }


    // ============================================================================
    // SINGULARITY LOGIC
    // ============================================================================

    async #performSingularity(skipRecord: boolean = false): Promise<void> {
        HSLogger.debug(() => "Performing Singularity...", this.context);
        const prevMainView = this.#gamestate.getCurrentUIView<MainView>('MAIN_VIEW');

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

        // antiBuyCoinBug setup (hard-coded inserted first step of the strategy should ensure this promise is resolved)
        this.#upg81Promise = new Promise<boolean>((resolve) => { this.#upg81PromiseResolve = resolve; });
        this.#upg81Observer?.observe(this.#upg81Btn, { attributes: true, attributeFilter: ['class'] });

        await this.#enterAndLeaveExalt();

        this.#endStageDone = false;
        this.#antiquitiesObserverActivated = false;

        if (this.#isExposureReady) {
            // The vanilla Teleport function is simply 1) doing some checks (everything true for us wanting to go lower),
            // 2) updates singularityCount, 3) calls a function to update the UI...
            // So maybe we can skip everything except singularityCount update...
            this.#exposedPlayer!.singularityCount = this.#targetSingularity;
        } else {
            this.#elevatorTeleportButton.click();
        }

        if (!skipRecord) {
            this.#autosingModal?.recordSingularity(gqGain, gq, qGain, q, happyHourStackAmount, c15ScoreBeforeSinging);
        }

        HSLogger.debug(() => "===== Singularity performed =====", this.context);

        // antiBuyCoinBug next step: loop-click upg81 until it turns green (upg81Promise resolved)
        this.#startUpg81Clicking();

        // Obt switch so we start producing Obt ASAP every sing
        await this.#setAmbrosiaLoadout(this.#ambrosia_obt);

        let stage;
        do {
            // Yield before checking if the stage is allowed
            await HSUtils.yield();
            stage = await this.#getStage();
        } while (!this.#isAllowedStage(stage));
        HSLogger.debug(() => `Reached allowed stage: ${stage}`, this.context);

        window.setTimeout(() => prevMainView.goto(), 20);
        this.#observeAntiquitiesRune();
        this.#prevActionTime = performance.now();
    }

    async #enterAndLeaveExalt(): Promise<void> {
        /*
        // Those two functions are less clean, and may not be needed with the auto-confirm...
        // Fast path: 
        if (this.#isExposureReady) {
            this.#enterExaltFunc!();
            this.#exitExaltFunc!();
            return;
        }
        */

        this.#exalt2Btn.click();
        await this.#waitForExaltState(true);

        this.#exalt2Btn.click();
        await this.#waitForExaltState(false);
    }


    // ============================================================================
    // FINAL STAGE 
    // ============================================================================

    async #performFinalStage(): Promise<void> {
        if (!this.#autosingEnabled || this.#endStagePromise) return;

        this.#endStagePromise = new Promise<void>(resolve => { this.#endStagePromiseResolve = resolve; });

        const aoagPhase = this.#strategy?.aoagPhase ?? createDefaultAoagPhase();
        aoagPhase.phaseId = AOAG_PHASE_ID;

        await this.#executePhase(aoagPhase, {
            phaseLabelOverride: AOAG_PHASE_NAME,
            ignoreObserverActivated: true
        });

        this.#prevActionTime = performance.now();
        await this.#matchStageToStrategy('final');

        if (this.#autosingEnabled) {
            // Export to gather a few quarks... (maybe not worth anymore...??? Or maybe for lower sing players...)
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

        this.#endStagePromiseResolve?.();
        this.#endStagePromise = undefined;
        this.#endStagePromiseResolve = undefined;
    }


    // ============================================================================
    // MISC - OPTIONAL PUSH AT THE END BEFORE STOPPING
    // ============================================================================

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
    // MISC - PUBLIC API
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
    // MISC - UTILITY & HELPERS
    // ============================================================================

    async #useAddAndTimeCodes(): Promise<void> {
        await this.#setAmbrosiaLoadout(this.#ambrosia_luck);
        if (this.#addCodeAllBtn) this.#addCodeAllBtn.click();
        if (this.#timeCodeBtn) this.#timeCodeBtn.click();
        await HSUtils.waitForNextTack();
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

    async #setAmbrosiaLoadout(loadout: HTMLButtonElement): Promise<void> {
        loadout.click();
        await this.#waitForClassCondition(loadout, () => this.#isInAmbLoadout(loadout));
    }

    #isInAmbLoadout(loadout: HTMLButtonElement): boolean {
        return loadout.classList.contains('hs-rainbow-border');
    }
    
    #isAllowedStage(stage: string): boolean {
        return ALLOWED_REGEX.test(stage);
    }

    #isInExalt(): boolean {
        // Fast path: use exposedPlayer. No heavy getComputedStyle.
        if (this.#isExposureReady) {
            return this.#exposedPlayer!.insideSingularityChallenge;
        }
        const style = window.getComputedStyle(this.#exaltTimer);
        return style.display !== "none";
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

    #ensureElements<T extends Record<string, Element | null>>(elements: T): elements is { [K in keyof T]: NonNullable<T[K]> } {
        const missing = Object.entries(elements)
            .filter(([, element]) => !element)
            .map(([name]) => name);

        if (missing.length === 0) return true;

        for (const name of missing) { HSLogger.warn(`Required element missing: ${name}`, this.context); }
        if (this.#autosingEnabled) this.stopAutosing();
        return false;
    }

    async #waitIfAutosingPaused(): Promise<void> {
        HSUI.Notify('Autosing paused.');
        while (this.#autosingModal?.getIsPaused() && this.#autosingEnabled) { await HSUtils.sleep(500); }
        this.#autosingEnabled ? HSUI.Notify('Autosing resumed.') : HSUI.Notify('Autosing stopped.');
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


    // ============================================================================
    // MISC - OBSERVER STUFF
    // ============================================================================

    #observeAntiquitiesRune(): void {
        if (!this.#antiquitiesRuneLockedContainer) {
            HSLogger.warn("Performance Warning: MutationObserver for antiquitiesRuneLockedContainer element missing. Aborting.", this.context);
            return;
        }
        this.#antiquitiesObserver?.disconnect();
        this.#antiquitiesObserver?.observe(
            this.#antiquitiesRuneLockedContainer,
            { attributes: true, attributeFilter: ['style'] }
        );
    }

    #startUpg81Clicking(initialTimeout = 0, intervalMs = 5): void {
        if (this.#upg81ClickTimerId !== undefined || !this.#upg81Btn) return;

        const tick = (): void => {
            if (!this.#autosingEnabled || !this.#upg81Promise) {
                this.#stopUpg81Clicking();
                return;
            }

            this.#upg81Btn.click();
            this.#upg81ClickTimerId = window.setTimeout(tick, intervalMs);
        };
        this.#upg81ClickTimerId = window.setTimeout(tick, initialTimeout);
    }

    #stopUpg81Clicking(): void {
        if (this.#upg81ClickTimerId !== undefined) {
            window.clearTimeout(this.#upg81ClickTimerId);
            this.#upg81ClickTimerId = undefined;
        }
    }

    async #waitForGreenUpg81(): Promise<void> {
        if (!this.#upg81Promise) return;
        
        await this.#upg81Promise;

        this.#stopUpg81Clicking();
        this.#upg81Observer?.disconnect();
        this.#upg81PromiseResolve = undefined;
        this.#upg81Promise = undefined;
    }

    #waitForClassCondition(element: Element, condition: () => boolean): Promise<boolean> {
        if (condition()) return Promise.resolve(true);

        if (!this.#waitForClassConditionObserver) {
            HSLogger.warn("Performance Warning: MutationObserver for class condition changes missing and needs to be recreated.", this.context);
            this.#waitForClassConditionObserver = new MutationObserver(() => {
                if (!this.#waitForClassConditionActive) return;
                if (this.#waitForClassConditionActive.condition()) {
                    this.#cleanupWaitForClassCondition(true);
                }
            });
        }

        return new Promise<boolean>((resolve) => {
            if (this.#waitForClassConditionActive) 
                this.#cleanupWaitForClassCondition(false);

            this.#waitForClassConditionActive = {
                element,
                condition,
                resolve,
                finished: false,
            };

            if (this.#waitForClassConditionObservedElement !== element) {
                this.#waitForClassConditionObserver?.disconnect();
                this.#waitForClassConditionObserver?.observe(element, { attributes: true, attributeFilter: ['class'] });
                this.#waitForClassConditionObservedElement = element;
            }

            if (condition()) this.#cleanupWaitForClassCondition(true);
        });
    }

    #waitForInnerText(el: HTMLElement, predicate: (text: string) => boolean = t => t.trim().length > 0): Promise<void> {
        if (predicate(el.textContent ?? "")) return Promise.resolve();

        if (!this.#waitForInnerTextObserver) {
            HSLogger.warn("Performance Warning: MutationObserver for inner text changes missing and needs to be recreated.", this.context);
            this.#waitForInnerTextObserver = new MutationObserver(() => {
                if (!this.#waitForInnerTextActive) return;
                if (this.#waitForInnerTextActive.predicate(this.#waitForInnerTextActive.el.textContent ?? "")) {
                    this.#cleanupWaitForInnerText(true);
                }
            });
        }

        return new Promise<void>((resolve, reject) => {
            if (this.#waitForInnerTextActive) {
                this.#cleanupWaitForInnerText(false);
            }

            this.#waitForInnerTextActive = {
                el,
                predicate,
                resolve,
                reject,
                finished: false,
            };

            if (this.#waitForInnerTextObservedElement !== el) {
                this.#waitForInnerTextObserver?.disconnect();
                this.#waitForInnerTextObserver?.observe(el, {
                    childList: true,
                    characterData: true,
                    subtree: true,
                });
                this.#waitForInnerTextObservedElement = el;
            }

            if (predicate(el.textContent ?? "")) this.#cleanupWaitForInnerText(true);
        });
    }
    
    async #waitForExaltState(targetState: boolean): Promise<boolean> {
        if (this.#isInExalt() === targetState) return true;

        const exaltTimerElement = this.#exaltTimer;
        if (!exaltTimerElement) {
            HSLogger.warn("Could not observe exalt state because exalt timer element is missing.", this.context);
            return false;
        }

        return await new Promise<boolean>((resolve) => {
            if (this.#waitForExaltStateActive) {
                this.#cleanupWaitForExaltState(false);
            }

            this.#waitForExaltStateActive = {
                targetState,
                resolve,
                finished: false,
            };

            this.#exaltStateObserver?.disconnect();
            this.#exaltStateObserver?.observe(exaltTimerElement, { attributes: true, attributeFilter: ['style', 'class'] });
            if (this.#isInExalt() === targetState) this.#cleanupWaitForExaltState(true);
        });
    }

    #cleanupWaitForExaltState(result: boolean): void {
        if (!this.#waitForExaltStateActive || this.#waitForExaltStateActive.finished) return;
        this.#waitForExaltStateActive.finished = true;
        const resolve = this.#waitForExaltStateActive.resolve;
        this.#waitForExaltStateActive = undefined;
        this.#exaltStateObserver?.disconnect();
        resolve(result);
    }

    #cleanupChallengeObserver(): void {
        if (!this.#challengeObserverActive || this.#challengeObserverActive.finished) return;
        this.#challengeObserverActive.finished = true;
        const resolve = this.#challengeObserverActive.resolve;
        this.#challengeObserverActive = undefined;
        this.#challengeCompletionObserver?.disconnect();
        resolve();
    }

    #cleanupWaitForClassCondition(success: boolean): void {
        if (!this.#waitForClassConditionActive || this.#waitForClassConditionActive.finished) return;
        this.#waitForClassConditionActive.finished = true;
        const resolve = this.#waitForClassConditionActive.resolve;
        this.#waitForClassConditionActive = undefined;

        // Should we disconnect them here, since it's often called in burst ? 
        this.#waitForClassConditionObserver?.disconnect();
        this.#waitForClassConditionObservedElement = undefined;

        resolve(success);
    }

    #cleanupWaitForInnerText(success: boolean): void {
        if (!this.#waitForInnerTextActive || this.#waitForInnerTextActive.finished) return;
        this.#waitForInnerTextActive.finished = true;
        const resolve = this.#waitForInnerTextActive.resolve;
        const reject = this.#waitForInnerTextActive.reject;
        this.#waitForInnerTextActive = undefined;

        // Should we disconnect them here, since it's often called in burst ? 
        this.#waitForInnerTextObserver?.disconnect();
        this.#waitForInnerTextObservedElement = undefined;

        if (success) resolve(); else reject(new Error("Wait for inner text aborted")); // We can probably drop the 'reject'
    }
}

