import { HSModuleOptions } from "../../types/hs-types";
import { SINGULARITY_VIEW } from "../../types/module-types/hs-gamestate-types";
import { HSGameState, SingularityView } from "../hs-core/hs-gamestate";
import { HSLogger } from "../hs-core/hs-logger";
import { HSModule } from "../hs-core/module/hs-module";
import { HSModuleManager } from "../hs-core/module/hs-module-manager";
import { HSElementHooker } from "../hs-core/hs-elementhooker";
import { HSSettings } from "../hs-core/settings/hs-settings";
import { HSSetting } from "../hs-core/settings/hs-setting";
import { HSUtils } from "../hs-utils/hs-utils";
import { HSSettingsDefinition } from "../../types/module-types/hs-settings-types";
import { HSGameDataAPI } from "../hs-core/gds/hs-gamedata-api";
import { goldenQuarkUpgradeMaxLevels, octeractUpgradeMaxLevels } from "../hs-core/gds/stored-vars-and-calculations";
import { GoldenQuarkUpgradeKey, OcteractUpgradeKey } from "../../types/data-types/hs-gamedata-api-types";
import { HSQuickbarManager } from "./hs-quickbarManager";
import type { QUICKBAR_ID } from "./hs-quickbarManager";
import { HSUI } from "../hs-core/hs-ui";

type AutomationSelectorExpectation = 'ON' | 'OFF' | string;
type AutomationSelectorSpec = string | { selector: string; expected?: AutomationSelectorExpectation };
type AutomationSelectorVisibilityMode = 'self' | 'parent' | 'none';
type AutomationQuickbarRenderKey =
    | 'AutoChallenge'
    | 'BuildingsAndUpgrades'
    | 'Rune'
    | 'Research'
    | 'AutoAntSacrifice'
    | 'Cube'
    | 'Hepteract'
    | 'AutoAscend';

type AutomationQuickbarSoloConfig = {
    kind: 'solo';
    actionDOM: string;
    checks: readonly AutomationSelectorSpec[];
    selectorVisibility?: AutomationSelectorVisibilityMode;
    hideWhenFullyEnabledMinHighestSingularityCount?: number;
    buttonId: string;
    label: string;
    iconSrc: string;
    minHighestSingularityCount?: number;
};

type AutomationQuickbarGroupConfig = {
    kind: 'group';
    selectors: readonly AutomationSelectorSpec[];
    selectorVisibility?: AutomationSelectorVisibilityMode;
    hideWhenFullyEnabledMinHighestSingularityCount?: number;
    buttonId: string;
    label: string;
    iconSrc: string;
    minHighestSingularityCount?: number;
};

type AutomationQuickbarToggleConfig = AutomationQuickbarSoloConfig | AutomationQuickbarGroupConfig;

/*
    Class: QOLButtons
    IsExplicitHSModule: Yes
    Description: 
        Hypersynergism module which adds qol buttons to the game.
    Author: Swiffy, XxmolkxX, the creator of original autosing script (httpsnet?) (hide gq/oct buttons) and Core (syn UI bar)
*/
export class HSQOLButtons extends HSModule {
    // Tracks active tab visit unsubscribers per SINGULARITY_VIEW. 
    #tabVisitUnsubscribers: Map<SINGULARITY_VIEW, () => void> = new Map();

    // Shared selector arrays for the different groups
    private static readonly automationBuildingsAndUpgradesSelectors = [
        { selector: '#toggle1.auto.autobuyerToggleButton' },
        { selector: '#toggle2.auto.autobuyerToggleButton' },
        { selector: '#toggle3.auto.autobuyerToggleButton' },
        { selector: '#toggle4.auto.autobuyerToggleButton' },
        { selector: '#toggle5.auto.autobuyerToggleButton' },
        { selector: '#toggle6.auto.autobuyerToggleButton' },
        { selector: '#toggle7.auto.autobuyerToggleButton' },
        { selector: '#toggle8.auto.autobuyerToggleButton' },
        { selector: '#toggle10.auto.autobuyerToggleButton' },
        { selector: '#toggle11.auto.autobuyerToggleButton' },
        { selector: '#toggle12.auto.autobuyerToggleButton' },
        { selector: '#toggle13.auto.autobuyerToggleButton' },
        { selector: '#toggle14.auto.autobuyerToggleButton' },
        { selector: '#toggle16.auto.autobuyerToggleButton' },
        { selector: '#toggle17.auto.autobuyerToggleButton' },
        { selector: '#toggle18.auto.autobuyerToggleButton' },
        { selector: '#toggle19.auto.autobuyerToggleButton' },
        { selector: '#toggle20.auto.autobuyerToggleButton' },
        { selector: '#toggle22.auto.autobuyerToggleButton' },
        { selector: '#toggle23.auto.autobuyerToggleButton' },
        { selector: '#toggle24.auto.autobuyerToggleButton' },
        { selector: '#toggle25.auto.autobuyerToggleButton' },
        { selector: '#toggle26.auto.autobuyerToggleButton' },
        { selector: '#tesseractAutoToggle1.auto.autobuyerToggleButton' },
        { selector: '#tesseractAutoToggle2.auto.autobuyerToggleButton' },
        { selector: '#tesseractAutoToggle3.auto.autobuyerToggleButton' },
        { selector: '#tesseractAutoToggle4.auto.autobuyerToggleButton' },
        { selector: '#tesseractAutoToggle5.auto.autobuyerToggleButton' },
        { selector: '#tesseractautobuytoggle', expected: 'Auto Buy: ON' },
        { selector: '#tesseractautobuymode', expected: 'Mode: PERCENTAGE' },
        { selector: '#coinAutoUpgrade.autobuyerToggleButton', expected: 'Auto: ON' },
        { selector: '#prestigeAutoUpgrade.autobuyerToggleButton', expected: 'Auto: ON' },
        { selector: '#transcendAutoUpgrade.autobuyerToggleButton', expected: 'Auto: ON' },
        { selector: '#reincarnateAutoUpgrade.autobuyerToggleButton', expected: 'Auto: ON' },
        { selector: '#generatorsAutoUpgrade.autobuyerToggleButton', expected: 'Auto: ON' },
    ] as const satisfies readonly AutomationSelectorSpec[];

    private static readonly automationRuneSelectors = [
        '#toggleautosacrifice',
        '#toggleautoBuyFragments',
        '#toggleautofortify',
        '#toggle36',
        '#toggle37'
    ];

    private static readonly automationResearchSelectors = [
        { selector: '#toggleresearchbuy', expected: 'Upgrade: MAX [if possible]' },
        { selector: '#toggleautoresearch', expected: 'Automatic: ON' },
        { selector: '#toggleautoresearchmode', expected: 'Automatic mode: Cheapest' },
    ] as const satisfies readonly AutomationSelectorSpec[];

    private static readonly automationCubeSelectors = [
        '#openCubes',
        '#openTesseracts',
        '#openHypercubes',
        '#openPlatonicCube',
        '#toggleAutoCubeUpgrades',
        '#toggleAutoPlatonicUpgrades'
    ];

    private static readonly automationHepteractSelectors = [
        '#chronosHepteractAuto',
        '#hyperrealismHepteractAuto',
        '#challengeHepteractAuto',
        '#abyssHepteractAuto',
        '#acceleratorHepteractAuto',
        '#acceleratorBoostHepteractAuto',
        '#multiplierHepteractAuto',
        '#hepteractToQuarkTradeAuto'
    ];

    /**
     * Automation Quickbar visibility rules:
        * - Any toggle with `minHighestSingularityCount` is shown based on threshold only.
        * - Other toggles are shown only when at least one linked selector is visible in DOM
        *   (DOM-only check via inline `style.display`).
        * - Per-toggle visibility target is configurable via `selectorVisibility`.
        * - Optional `hideWhenFullyEnabledMinHighestSingularityCount` hides already-fully-on
        *   toggles once the requested singularity threshold is reached.
     */
    private static readonly AUTOMATION_QUICKBAR_CONFIG = {
        AutoChallenge: {
            kind: 'solo',
            actionDOM: '#toggleAutoChallengeStart',
            checks: [{ selector: '#toggleAutoChallengeStart', expected: 'Auto Challenge Sweep [ON]' }],
            buttonId: 'automationQuickBar-autochallenge',
            label: 'Auto-Challenge',
            iconSrc: './Pictures/Simplified/Challenge1.png'
        },
        BuildingsAndUpgrades: {
            kind: 'group',
            selectors: HSQOLButtons.automationBuildingsAndUpgradesSelectors,
            hideWhenFullyEnabledMinHighestSingularityCount: 25,
            buttonId: 'automationQuickBar-buildings',
            label: 'Buildings and Upgrades',
            iconSrc: './Pictures/Simplified/Coin.png'
        },
        Rune: {
            kind: 'group',
            selectors: HSQOLButtons.automationRuneSelectors,
            buttonId: 'automationQuickBar-runes',
            label: 'Runes',
            iconSrc: './Pictures/Simplified/Offering.png'
        },
        Research: {
            kind: 'group',
            selectors: HSQOLButtons.automationResearchSelectors,
            hideWhenFullyEnabledMinHighestSingularityCount: 11,
            buttonId: 'automationQuickBar-research',
            label: 'Research',
            iconSrc: './Pictures/Simplified/Obtainium.png'
        },
        AutoAntSacrifice: {
            kind: 'solo',
            actionDOM: '#toggleAutoSacrificeAnt',
            checks: [{ selector: '#toggleAutoSacrificeAnt', expected: 'Auto Sacrifice: ON' }],
            selectorVisibility: 'parent',
            buttonId: 'automationQuickBar-autoantsacrifice',
            label: 'Auto-Sacrifice',
            iconSrc: './Pictures/Simplified/AntSacrifice.png'
        },
        Cube: {
            kind: 'group',
            selectors: HSQOLButtons.automationCubeSelectors,
            buttonId: 'automationQuickBar-cubes',
            label: 'Cube Auto-Open',
            iconSrc: './Pictures/Default/TinyWow3.png',
        },
        Hepteract: {
            kind: 'group',
            selectors: HSQOLButtons.automationHepteractSelectors,
            buttonId: 'automationQuickBar-hepteracts',
            label: 'Hept Auto-Open',
            iconSrc: './Pictures/Default/TinyWow7.png',
            minHighestSingularityCount: 15
        },
        AutoAscend: {
            kind: 'solo',
            actionDOM: '#ascensionAutoEnable',
            checks: [{ selector: '#ascensionAutoEnable', expected: 'Auto Ascend [ON]' }],
            buttonId: 'automationQuickBar-autoascend',
            label: 'Auto Ascend',
            iconSrc: './Pictures/Simplified/AscensionNoBorder.png',
            minHighestSingularityCount: 25
        }
    } as const satisfies Record<AutomationQuickbarRenderKey, AutomationQuickbarToggleConfig>;

    // Keep internal config keys here; labels/icons/behavior come from AUTOMATION_QUICKBAR_CONFIG.
    private static readonly AUTOMATION_QUICKBAR_RENDER_ORDER: readonly (keyof typeof HSQOLButtons.AUTOMATION_QUICKBAR_CONFIG)[] = [
        'AutoChallenge',
        'BuildingsAndUpgrades',
        'Rune',
        'Research',
        'AutoAntSacrifice',
        'Cube',
        'Hepteract',
        'AutoAscend'
    ];

    // quickbar container
    automationQuickBarContainer: HTMLDivElement | null = null;
    #automationQuickBarWatcherBySelector = new Map<string, { watcherId: string; element: HTMLElement }>();
    #automationQuickbarBootstrapTimeoutIds: number[] = [];
    
    private eventsQuickBarElements?: {
        happyHourSpan: HTMLSpanElement;
        happyHourAmountSpan: HTMLSpanElement;
        lotusSpan: HTMLSpanElement;
    };
    #eventsQuickbarUnsubscribe: (() => void) | null = null;
    eventsQuickBarContainer: HTMLDivElement | null = null;

    #offeringPotion: HTMLElement | null;
    #obtainiumPotion: HTMLElement | null;
    #config: MutationObserverInit;
    #offeringPotionObserver: MutationObserver;
    #obtainiumPotionObserver: MutationObserver;
    #selectorElementCache = new Map<string, HTMLElement | null>();
    #selectorMatcherCache = new Map<string, (el: HTMLElement | null) => boolean>();
    #queuedAutomationFrameId: number | null = null;

    private static readonly AUTOMATION_QUICKBAR_WATCH_OPTS: {
        childList: boolean;
        subtree: boolean;
        overrideThrottle: boolean;
        characterData: boolean;
        attributes: boolean;
        attributeFilter: string[];
    } = {
        childList: true,
        subtree: false,
        overrideThrottle: true,
        characterData: false,
        attributes: true,
        attributeFilter: ['style', 'class', 'aria-pressed', 'aria-checked']
    };

    private static readonly AUTOMATION_QUICKBAR_BOOTSTRAP_RETRY_MS = [50, 150, 500, 1000, 2000] as const;


    /** Resolve an automation quickbar element by selector, falling back to window globals for cube upgrade toggles. */
    private resolveAutomationQuickBarElement(sel: string): HTMLElement | null {
        const el = document.querySelector(sel) as HTMLElement | null;
        if (el) return el;

        if (sel === '#toggleAutoCubeUpgrades') {
            return (window as any).toggleAutoCubeUpgrades as HTMLElement | null;
        }
        if (sel === '#toggleAutoPlatonicUpgrades') {
            return (window as any).toggleAutoPlatonicUpgrades as HTMLElement | null;
        }

        return null;
    }

    /** Determine whether a game toggle element is currently in the "on" state. */
    private isElementOn(el: HTMLElement | null): boolean {
        if (!el) return false;
        try {
            const ariaPressed = el.getAttribute('aria-pressed');
            if (ariaPressed === 'true') return true;
            const ariaChecked = el.getAttribute('aria-checked');
            if (ariaChecked === 'true') return true;

            const text = (el.textContent || '').trim();
            if (/Auto\s+Open\s*\[OFF\]/i.test(text)) return false;
            if (/Auto\s+Open\s*\[(ON|OFF)\]/i.test(text)) return /\[ON\]/i.test(text);
            if (/Auto\s+Open\s*"?\d+%"?/i.test(text)) return true;

            const openMatch = text.match(/Open\s+(Cubes|Tesseracts|Hypercubes|Platonic)\s*:?\s*\[(ON|OFF)\]/i);
            if (openMatch) return openMatch[2].toUpperCase() === 'ON';

            if (/Auto\s+Upgrades:\s*\[ON\]/i.test(text)) return true;
            if (/Auto\s+Upgrades:\s*\[OFF\]/i.test(text)) return false;

            const cls = el.className || '';
            if (/\b(on|enabled|active)\b/i.test(cls)) return true;
            if (/\bON\b/i.test(text) || /enabled/i.test(text)) return true;
        } catch (e) {
            HSLogger.log(`isElementOn check failed: ${e}`, this.context);
        }
        return false;
    }

    private normalizeToggleText(text: string): string {
        return text.replace(/\s+/g, ' ').trim();
    }
    
    private selectorToString(selectorSpec: AutomationSelectorSpec): string {
        return typeof selectorSpec === 'string' ? selectorSpec : selectorSpec.selector;
    }

    private expectedToString(selectorSpec: AutomationSelectorSpec): string {
        if (typeof selectorSpec === 'string' || selectorSpec.expected === undefined) {
            return 'ON_DEFAULT';
        }
        return selectorSpec.expected;
    }

    private getCachedAutomationElement(selectorSpec: AutomationSelectorSpec): HTMLElement | null {
        const selector = this.selectorToString(selectorSpec);
        const cached = this.#selectorElementCache.get(selector);
        if (cached && cached.isConnected) {
            return cached;
        }

        const resolved = this.resolveAutomationQuickBarElement(selector);
        this.#selectorElementCache.set(selector, resolved);
        return resolved;
    }

    private getCompiledAutomationSelectorMatcher(selectorSpec: AutomationSelectorSpec): (el: HTMLElement | null) => boolean {
        const selector = this.selectorToString(selectorSpec);
        const expected = typeof selectorSpec === 'string' ? undefined : selectorSpec.expected;
        const matcherKey = `${selector}::${this.expectedToString(selectorSpec)}`;

        const existing = this.#selectorMatcherCache.get(matcherKey);
        if (existing) {
            return existing;
        }

        let matcher: (el: HTMLElement | null) => boolean;

        if (expected === undefined || expected === 'ON') {
            matcher = (el: HTMLElement | null) => this.isElementOn(el);
        } else if (expected === 'OFF') {
            matcher = (el: HTMLElement | null) => !!el && !this.isElementOn(el);
        } else {
            const expectedText = this.normalizeToggleText(expected);
            matcher = (el: HTMLElement | null) => {
                if (!el) return false;
                const currentText = this.normalizeToggleText(el.textContent || '');
                return currentText === expectedText;
            };
        }

        this.#selectorMatcherCache.set(matcherKey, matcher);
        return matcher;
    }

    private queueAutomationQuickbarRender(renderFn: () => void): void {
        if (this.#queuedAutomationFrameId !== null) {
            return;
        }

        this.#queuedAutomationFrameId = window.requestAnimationFrame(() => {
            this.#queuedAutomationFrameId = null;
            renderFn();
        });
    }

    private getHighestSingularityCount(): number {
        const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        const gameData = gameDataAPI?.getGameData();
        return gameData?.highestSingularityCount ?? 0;
    }

    private isAutomationToggleVisible(config: AutomationQuickbarToggleConfig, highestSingularityCount: number): boolean {
        const minSingularity = config.minHighestSingularityCount;
        if (minSingularity === undefined) {
            return true;
        }
        return highestSingularityCount >= minSingularity;
    }

    private shouldApplyAutomationSelectorVisibility(config: AutomationQuickbarToggleConfig): boolean {
        // Threshold-gated toggles are shown/hidden only by singularity count.
        if (config.minHighestSingularityCount !== undefined) {
            return false;
        }
        return config.selectorVisibility !== 'none';
    }

    private shouldHideAutomationButtonWhenFullyEnabled(
        config: AutomationQuickbarToggleConfig,
        highestSingularityCount: number,
        isFullyEnabled: boolean
    ): boolean {
        // Optional QoL rule: hide completed toggles after a progression threshold.
        const minSingularity = config.hideWhenFullyEnabledMinHighestSingularityCount;
        if (minSingularity === undefined || !isFullyEnabled) {
            return false;
        }

        return highestSingularityCount >= minSingularity;
    }

    private getVisibilityTargetElement(el: HTMLElement | null, config: AutomationQuickbarToggleConfig): HTMLElement | null {
        if (!el) return null;
        if (config.selectorVisibility === 'parent') {
            return el.parentElement;
        }
        return el;
    }

    private getVisibleAutomationElement(selectorSpec: AutomationSelectorSpec, config: AutomationQuickbarToggleConfig): HTMLElement | null {
        const el = this.getCachedAutomationElement(selectorSpec);
        if (!el) return null;
        if (!this.shouldApplyAutomationSelectorVisibility(config)) return el;

        const visibilityTarget = this.getVisibilityTargetElement(el, config);
        return this.isElementVisibleInDom(visibilityTarget) ? el : null;
    }

    private isElementVisibleInDom(el: HTMLElement | null): el is HTMLElement {
        return !!el && el.isConnected && el.style.display !== 'none';
    }

    constructor(moduleOptions: HSModuleOptions) {
        super(moduleOptions);

        this.#offeringPotion = document.getElementById('offeringPotionHide');
        this.#obtainiumPotion = document.getElementById('obtainiumPotionHide');
        this.#config = { attributes: false, childList: true, subtree: true };

        this.#offeringPotionObserver = new MutationObserver(
            (mutations, observer) => this.#offeringMutationTrigger(mutations, observer)
        );
        this.#obtainiumPotionObserver = new MutationObserver(
            (mutations, observer) => this.#obtainiumMutationTrigger(mutations, observer)
        );
    }

    async init(): Promise<void> {
        HSLogger.log('Initialising HSQOLButtons module', this.context);
        this.observe();
        this.isInitialized = true;

        // Register tab visit handlers
        this.subscribeToTabVisit(
            SINGULARITY_VIEW.SHOP,
            async () => { this.setMaxedGQUpgradesVisibility(); });

        this.subscribeToTabVisit(
            SINGULARITY_VIEW.OCTERACTS,
            async () => { this.setMaxedOctUpgradesVisibility(); });

        // Any settings-driven feature activation is handled by HSSettings.syncSettings().
        // Only perform module-specific DOM setup here if not settings-driven.
        this.#injectAdd10Button();
        this.injectAFKSwapperToggleButton();
    }

    /** Returns a prepared Automation quickbar DOM node for the quickbarsRow. */
    public getAutomationQuickbarSection(): HTMLElement {
        const container = document.createElement('div');
        container.id = 'automationQuickBar';
        container.className = 'hs-automation-quickbar';
        return container;
    }

    /** Returns a prepared Events quickbar DOM node for the quickbarsRow. */
    public getEventsQuickbarSection(): HTMLElement {
        const container = document.createElement('div');
        container.id = 'eventsQuickBar';
        container.className = 'hs-events-quickbar';
        return container;
    }

    /** Reset queued render state and existing watchers before rebuilding quickbar UI. */
    #resetAutomationQuickbarRuntime(): void {
        if (this.#queuedAutomationFrameId !== null) {
            window.cancelAnimationFrame(this.#queuedAutomationFrameId);
            this.#queuedAutomationFrameId = null;
        }
        this.#clearAutomationQuickbarBootstrapTimeouts();
        this.#clearAutomationQuickBarWatchers();
    }

    /** Apply initial UI state and wire mutation-driven refreshes. */
    #finalizeAutomationQuickbarSetup(updateUIState: () => void, requestUpdateUI: () => void): void {
        updateUIState();
        this.#registerAutomationQuickBarWatchers(requestUpdateUI);
        setTimeout(requestUpdateUI, 10);
        this.#scheduleAutomationQuickbarBootstrapRetries(requestUpdateUI);
    }

    /**
     * Automation quickbar lifecycle:
     * - setup builds DOM once, wires click handlers, registers element watchers, and schedules state updates.
     * - teardown cancels pending frame work, clears watchers, and clears container content.
     * Repeated setup calls are safe and intentionally supported (e.g. settings toggles).
     */
    /** Setup event binding and UI logic for the injected Automation quickbar section. */
    #setupAutomationQuickbar(): void {
        if (!this.automationQuickBarContainer) return;

        this.#resetAutomationQuickbarRuntime();

        // Each button registers an updater that runs in the shared RAF-batched refresh.
        // We pass highestSingularityCount once per cycle to avoid repeating lookups.
        const stateUpdaters: Array<(highestSingularityCount: number) => void> = [];

        const setAutomationButtonState = (btn: HTMLButtonElement, targetsCount: number, allOn: boolean, allOff: boolean) => {
            btn.classList.remove('enabled', 'disabled', 'mixed');
            btn.disabled = targetsCount === 0;
            if (targetsCount === 0) {
                btn.classList.add('disabled');
            } else if (allOn) {
                btn.classList.add('enabled');
            } else if (allOff) {
                btn.classList.add('disabled');
            } else {
                btn.classList.add('mixed');
            }
        };

        const compiledGroupSelectors = new Map<readonly AutomationSelectorSpec[], Array<{
            selectorSpec: AutomationSelectorSpec;
            matcher: (el: HTMLElement | null) => boolean;
        }>>();

        const getAutomationCompiledGroupSelectors = (selectors: readonly AutomationSelectorSpec[]) => {
            const existing = compiledGroupSelectors.get(selectors);
            if (existing) return existing;

            const compiled = selectors.map(selectorSpec => ({
                selectorSpec,
                matcher: this.getCompiledAutomationSelectorMatcher(selectorSpec)
            }));
            compiledGroupSelectors.set(selectors, compiled);
            return compiled;
        };

        const getAutomationGroupState = (selectors: readonly AutomationSelectorSpec[], config: AutomationQuickbarToggleConfig) => {
            const compiledSelectors = getAutomationCompiledGroupSelectors(selectors);

            const targets = selectors
                .map((selectorSpec, idx) => {
                    const sel = this.selectorToString(selectorSpec);
                    const el = this.getVisibleAutomationElement(selectorSpec, config);
                    const isOn = compiledSelectors[idx].matcher(el);
                    return { sel, el, isOn };
                })
                .filter((x): x is { sel: string; el: HTMLElement; isOn: boolean } => !!x.el);

            const states = targets.map(t => t.isOn);
            const allOn = states.length > 0 && states.every(Boolean);
            const allOff = states.length > 0 && states.every(s => !s);
            return { targets, states, allOn, allOff };
        };

        const updateAutomationUIState = () => {
            const highestSingularityCount = this.getHighestSingularityCount();
            stateUpdaters.forEach(update => update(highestSingularityCount));
        };

        const requestAutomationUpdateUI = () => this.queueAutomationQuickbarRender(updateAutomationUIState);

        const addAutomationQuickbarToggle = (toggleKey: keyof typeof HSQOLButtons.AUTOMATION_QUICKBAR_CONFIG) => {
            const config = HSQOLButtons.AUTOMATION_QUICKBAR_CONFIG[toggleKey];

            if (config.kind === 'solo') {
                const compiledChecks = config.checks.map(spec => ({
                    spec,
                    matcher: this.getCompiledAutomationSelectorMatcher(spec)
                }));

                const btn = document.createElement('button');
                btn.className = 'autoToggle';
                btn.id = config.buttonId;

                const img = document.createElement('img');
                img.src = config.iconSrc;
                img.loading = 'lazy';
                btn.appendChild(img);

                btn.title = config.label;
                btn.setAttribute('aria-label', config.label);
                btn.addEventListener('click', () => {
                    const target = this.getVisibleAutomationElement(config.actionDOM, config)
                        ?? compiledChecks
                            .map(({ spec }) => this.getVisibleAutomationElement(spec, config))
                            .find((el): el is HTMLElement => !!el)
                        ?? null;

                    if (target) {
                        try { target.click(); } catch (e) { HSLogger.log(`Failed to click target ${config.actionDOM}: ${e}`, this.context); }
                    } else {
                        HSLogger.log(`Target element for ${toggleKey} not found: ${config.actionDOM}`, this.context);
                    }
                    requestAutomationUpdateUI();
                });

                stateUpdaters.push((highestSingularityCount) => {
                    const meetsSingularityRequirement = this.isAutomationToggleVisible(config, highestSingularityCount);

                    const visibleActionTarget = this.getVisibleAutomationElement(config.actionDOM, config);
                    const visibleCheckTargets = compiledChecks.map(({ spec }) => this.getVisibleAutomationElement(spec, config));
                    const hasVisibleLinkedTarget = !this.shouldApplyAutomationSelectorVisibility(config)
                        || !!visibleActionTarget
                        || visibleCheckTargets.some((el): el is HTMLElement => !!el);

                    btn.style.display = meetsSingularityRequirement && hasVisibleLinkedTarget ? '' : 'none';

                    if (!meetsSingularityRequirement || !hasVisibleLinkedTarget) {
                        btn.classList.remove('enabled', 'mixed');
                        btn.classList.add('disabled');
                        btn.disabled = true;
                        return;
                    }

                    const checkStates = compiledChecks.map(({ matcher }, idx) => {
                        const el = visibleCheckTargets[idx];
                        if (!el) return null;
                        return matcher(el);
                    }).filter((state): state is boolean => state !== null);

                    const enabled = checkStates.length > 0 && checkStates.every(Boolean);

                    if (this.shouldHideAutomationButtonWhenFullyEnabled(config, highestSingularityCount, enabled)) {
                        btn.style.display = 'none';
                        btn.classList.remove('enabled', 'mixed');
                        btn.classList.add('disabled');
                        btn.disabled = true;
                        return;
                    }

                    btn.classList.remove('enabled', 'disabled', 'mixed');
                    btn.classList.add(enabled ? 'enabled' : 'disabled');
                    btn.disabled = checkStates.length === 0;
                });

                this.automationQuickBarContainer?.appendChild(btn);
                return;
            }

            const btn = this.#createAutomationGroupButton(
                config.selectors,
                config,
                config.label,
                config.label,
                config.iconSrc,
                requestAutomationUpdateUI
            );
            btn.id = config.buttonId;

            stateUpdaters.push((highestSingularityCount) => {
                const { targets, allOn, allOff } = getAutomationGroupState(config.selectors, config);
                const meetsSingularityRequirement = this.isAutomationToggleVisible(config, highestSingularityCount);
                const hasVisibleLinkedTarget = !this.shouldApplyAutomationSelectorVisibility(config) || targets.length > 0;

                btn.style.display = meetsSingularityRequirement && hasVisibleLinkedTarget ? '' : 'none';

                if (!meetsSingularityRequirement || !hasVisibleLinkedTarget) {
                    btn.classList.remove('enabled', 'mixed');
                    btn.classList.add('disabled');
                    btn.disabled = true;
                    return;
                }

                if (this.shouldHideAutomationButtonWhenFullyEnabled(config, highestSingularityCount, allOn)) {
                    btn.style.display = 'none';
                    btn.classList.remove('enabled', 'mixed');
                    btn.classList.add('disabled');
                    btn.disabled = true;
                    return;
                }

                setAutomationButtonState(btn, targets.length, allOn, allOff);
            });

            this.automationQuickBarContainer?.appendChild(btn);
        };

        for (const item of HSQOLButtons.AUTOMATION_QUICKBAR_RENDER_ORDER) {
            addAutomationQuickbarToggle(item);
        }

        this.#finalizeAutomationQuickbarSetup(updateAutomationUIState, requestAutomationUpdateUI);
    }

    #clearAutomationQuickBarWatchers(): void {
        for (const watcher of this.#automationQuickBarWatcherBySelector.values()) {
            HSElementHooker.stopWatching(watcher.watcherId);
        }
        this.#automationQuickBarWatcherBySelector.clear();
    }

    #clearAutomationQuickbarBootstrapTimeouts(): void {
        for (const timeoutId of this.#automationQuickbarBootstrapTimeoutIds) {
            window.clearTimeout(timeoutId);
        }
        this.#automationQuickbarBootstrapTimeoutIds = [];
    }

    /** Cleanup observers/render queue/container for the automation quickbar. */
    #teardownAutomationQuickbar(): void {
        if (this.#queuedAutomationFrameId !== null) {
            window.cancelAnimationFrame(this.#queuedAutomationFrameId);
            this.#queuedAutomationFrameId = null;
        }
        this.#clearAutomationQuickbarBootstrapTimeouts();
        this.#clearAutomationQuickBarWatchers();
        if (this.automationQuickBarContainer) {
            this.automationQuickBarContainer.innerHTML = '';
            this.automationQuickBarContainer = null;
        }
    }

    /**
     * Create a combined group toggle button for a set of selectors.
     * Clicking toggles all targets on/off as a group.
     */
    #createAutomationGroupButton(
        selectors: readonly AutomationSelectorSpec[],
        config: AutomationQuickbarToggleConfig,
        title: string,
        ariaLabel: string,
        iconSrc: string,
        updateUI: () => void
    ): HTMLButtonElement {
        const compiledSelectors = selectors.map(selectorSpec => ({
            selectorSpec,
            matcher: this.getCompiledAutomationSelectorMatcher(selectorSpec)
        }));

        const btn = document.createElement('button');
        btn.className = 'autoToggle';
        btn.title = title;
        btn.setAttribute('aria-label', ariaLabel);

        const img = document.createElement('img');
        img.src = iconSrc;
        img.loading = 'lazy';
        btn.appendChild(img);

        const getTargets = () =>
            compiledSelectors
                .map(({ selectorSpec, matcher }) => {
                    const sel = this.selectorToString(selectorSpec);
                    const el = this.getVisibleAutomationElement(selectorSpec, config);
                    const isOn = matcher(el);
                    return { sel, el, isOn };
                })
                .filter((x): x is { sel: string; el: HTMLElement; isOn: boolean } => !!x.el);

        const getState = () => {
            const targets = getTargets();
            const states = targets.map(t => t.isOn);
            const allOn = states.length > 0 && states.every(Boolean);
            const allOff = states.length > 0 && states.every(s => !s);
            return { targets, states, allOn, allOff };
        };

        const { targets, allOn, allOff } = getState();

        btn.classList.remove('enabled', 'disabled', 'mixed');
        btn.disabled = targets.length === 0;
        if (targets.length === 0) {
            btn.classList.add('disabled');
        } else if (allOn) {
            btn.classList.add('enabled');
        } else if (allOff) {
            btn.classList.add('disabled');
        } else {
            btn.classList.add('mixed');
        }

        btn.addEventListener('click', () => {
            const { targets, states, allOn } = getState();
            if (targets.length === 0) return;

            const wantOn = !allOn;
            HSLogger.log(`automationQuickBar: ${ariaLabel} click wantOn=${wantOn} targets=${targets.length}`, this.context);

            targets.forEach((t, idx) => {
                if (!t.el) return;
                const currentlyOn = states[idx];
                if (wantOn !== currentlyOn) {
                    try { t.el.click(); } catch (e) { HSLogger.log(`Failed to click ${t.sel}: ${e}`, this.context); }
                }
            });

            updateUI();
        });

        return btn;
    }

    private collectAutomationQuickbarSelectors(): string[] {
        const allSelectorSet = new Set<string>();
        const configs = Object.values(HSQOLButtons.AUTOMATION_QUICKBAR_CONFIG) as readonly AutomationQuickbarToggleConfig[];

        for (const config of configs) {
            if (config.kind === 'group') {
                for (const selectorSpec of config.selectors) {
                    allSelectorSet.add(this.selectorToString(selectorSpec));
                }
                continue;
            }

            allSelectorSet.add(config.actionDOM);
            for (const selectorSpec of config.checks) {
                allSelectorSet.add(this.selectorToString(selectorSpec));
            }
        }

        return Array.from(allSelectorSet);
    }

    /** Register element watchers used to refresh quickbar state/visibility. */
    #registerAutomationQuickBarWatchers(updateUI: () => void): void {
        // Keep this watcher narrow for performance:
        // - `childList` catches text/content swaps on target elements.
        // - `attributes` tracks style/class visibility and aria state toggles.
        // - `characterData` stays off to avoid noisy text-node-level mutations.
        const watchOpts = HSQOLButtons.AUTOMATION_QUICKBAR_WATCH_OPTS;

        const allSelectors = this.collectAutomationQuickbarSelectors();

        for (const sel of allSelectors) {
            try {
                const el = this.getCachedAutomationElement(sel);
                if (!el) continue;

                const existing = this.#automationQuickBarWatcherBySelector.get(sel);
                if (existing && existing.element === el && existing.element.isConnected) {
                    continue;
                }
                if (existing) {
                    HSElementHooker.stopWatching(existing.watcherId);
                    this.#automationQuickBarWatcherBySelector.delete(sel);
                }

                const id = HSElementHooker.watchElement(el, () => updateUI(), watchOpts);
                if (id) {
                    this.#automationQuickBarWatcherBySelector.set(sel, { watcherId: id as string, element: el });
                }
            } catch (e) {
                HSLogger.log(`Error setting watcher for ${sel}: ${e}`, this.context);
            }
        }
    }

    #scheduleAutomationQuickbarBootstrapRetries(updateUI: () => void): void {
        this.#clearAutomationQuickbarBootstrapTimeouts();

        // Some automation elements mount late during view initialization.
        // Retry watcher binding and one refresh pass a few times after setup.
        for (const delayMs of HSQOLButtons.AUTOMATION_QUICKBAR_BOOTSTRAP_RETRY_MS) {
            const timeoutId = window.setTimeout(() => {
                if (!this.automationQuickBarContainer) return;
                this.#registerAutomationQuickBarWatchers(updateUI);
                updateUI();
            }, delayMs);

            this.#automationQuickbarBootstrapTimeoutIds.push(timeoutId);
        }
    }

    /**
     * Events quickbar lifecycle:
     * - setup clears container, builds DOM once, wires state updaters.
     * - teardown clears container and element refs.
     * Repeated setup calls are safe and intentionally supported.
     */
    #setupEventsQuickbar(): void {
        if (!this.eventsQuickBarContainer) return;
        // Always clear previous DOM and refs
        this.#resetEventsQuickbarRuntime();
        this.createEventsQuickbarDOM();
        this.updateEventsQuickbarDOM();
    }

    /** Reset events quickbar DOM and element refs. */
    #resetEventsQuickbarRuntime(): void {
        if (this.eventsQuickBarContainer) {
            this.eventsQuickBarContainer.innerHTML = '';
        }
        this.eventsQuickBarElements = undefined;
    }

    private createEventsQuickbarDOM() {
        if (!this.eventsQuickBarContainer) return;

        // Bell span
        const happyHourSpan = document.createElement('span');
        happyHourSpan.id = 'events-quickbar-happy-hour-span';
        happyHourSpan.style.cursor = 'help';

        const happyHourAmountSpan = document.createElement('span');
        happyHourSpan.appendChild(happyHourAmountSpan);

        const happyHourImg = document.createElement('img');
        happyHourImg.className = 'events-quickbar-event-img';
        happyHourImg.src = 'Pictures/PseudoShop/HAPPY_HOUR_BELL.png';
        happyHourSpan.appendChild(happyHourImg);

        // Lotus span
        const lotusSpan = document.createElement('span');
        lotusSpan.id = 'events-quickbar-lotus-span';
        lotusSpan.style.cursor = 'help';

        const lotusImg = document.createElement('img');
        lotusImg.className = 'events-quickbar-event-img';
        lotusImg.src = 'Pictures/PseudoShop/LOTUS.png';
        lotusSpan.appendChild(lotusImg);

        // Store references
        this.eventsQuickBarElements = {
            happyHourSpan,
            happyHourAmountSpan: happyHourAmountSpan,
            lotusSpan
        };

        // Inject into container
        this.eventsQuickBarContainer.innerHTML = '';
        this.eventsQuickBarContainer.appendChild(happyHourSpan);
        this.eventsQuickBarContainer.appendChild(lotusSpan);

        HSLogger.debug(`Events quickbar DOM created`, this.context );
    }

    private updateEventsQuickbarDOM() {
        if (!this.eventsQuickBarElements) return;
        const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        const eventData = gameDataAPI?.getEventData();
        const happyHourEvent = eventData?.HAPPY_HOUR_BELL;
        const lotusEvent = eventData?.LOTUS_OF_REJUVENATION;
        const happyHourAmount = happyHourEvent?.amount ?? 0;

        // Build tooltip strings
        let hhTooltipText = '';
        if (happyHourEvent?.ends && happyHourEvent.ends.length > 0) {
            const hhEndsTimes = happyHourEvent.ends.map(e => new Date(e).toLocaleTimeString(undefined, { hour12: false })).join(', ');
            hhTooltipText = `${happyHourAmount} HH ending at: ${hhEndsTimes}`;
        } else {
            hhTooltipText = 'No active HH event';
        }
        let lotusTooltipText = '';
        if (lotusEvent?.ends && lotusEvent.ends.length > 0) {
            const lotusEndTime = new Date(lotusEvent.ends[0]).toLocaleTimeString(undefined, { hour12: false });
            lotusTooltipText = `Lotus until: ${lotusEndTime}`;
        } else {
            lotusTooltipText = 'No active Lotus event';
        }

        // Update DOM elements
        const { happyHourSpan, happyHourAmountSpan, lotusSpan } = this.eventsQuickBarElements;

        happyHourSpan.title = hhTooltipText;
        happyHourAmountSpan.textContent = `${happyHourAmount}`;
        if (happyHourEvent?.ends?.length === 0) {
            happyHourSpan.classList.add('no-event');
        } else {
            happyHourSpan.classList.remove('no-event');
        }

        lotusSpan.title = lotusTooltipText;
        if (lotusEvent?.ends?.length === 0) {
            lotusSpan.classList.add('hs-hidden');
            // lotusSpan.classList.add('no-event');
        } else {
            lotusSpan.classList.remove('hs-hidden');
            // lotusSpan.classList.remove('no-event');
        }

        HSLogger.debug(`Events quickbar updated: Happy Hour: "${hhTooltipText}", Lotus: "${lotusTooltipText}"`, this.context );
    }

    /** Cleanup observers/render queue/container for the events quickbar. */
    #teardownEventsQuickbar(): void {
        if (this.#eventsQuickbarUnsubscribe) {
            this.#eventsQuickbarUnsubscribe();
            this.#eventsQuickbarUnsubscribe = null;
        }
        this.#resetEventsQuickbarRuntime();
        this.eventsQuickBarContainer = null;
    }
    
    observe() {
        if (this.#offeringPotion) {
            this.#offeringPotionObserver.observe(this.#offeringPotion, this.#config);
        }
        if (this.#obtainiumPotion) {
            this.#obtainiumPotionObserver.observe(this.#obtainiumPotion, this.#config);
        }
    }

    #offeringMutationTrigger(mutations: MutationRecord[], observer: MutationObserver) {
        const moddedButton = document.getElementById('offeringPotionMultiUseButton');

        if (moddedButton === null) {
            const useOfferingPotionButton = document.getElementById('useofferingpotion');
            const buyOfferingPotionButton = document.getElementById('buyofferingpotion');

            if (!useOfferingPotionButton || !buyOfferingPotionButton) {
                HSLogger.warn('Could not find native buttons for use/buy offering potions', this.context);
                return;
            }

            if (useOfferingPotionButton) {
                const clone = useOfferingPotionButton.cloneNode(true) as HTMLElement;
                clone.id = 'offeringPotionMultiUseButton';
                clone.textContent = 'CONSUME 10x';
                clone.addEventListener('click', () => {
                    for (let i = 0; i < 10; i++) useOfferingPotionButton.click();
                });
                useOfferingPotionButton.parentNode?.insertBefore(clone, useOfferingPotionButton.nextSibling);
            }

            if (buyOfferingPotionButton) {
                const clone2 = buyOfferingPotionButton.cloneNode(true) as HTMLElement;
                clone2.id = 'offeringPotionMultiBuyButton';
                clone2.textContent = 'BUY 10x';
                clone2.addEventListener('click', () => {
                    for (let i = 0; i < 10; i++) {
                        buyOfferingPotionButton.click();
                        setTimeout(() => { document.getElementById('ok_confirm')?.click(); }, 1);
                    }
                });
                buyOfferingPotionButton.parentNode?.insertBefore(clone2, buyOfferingPotionButton.nextSibling);
            }

            this.#offeringPotionObserver.disconnect();
            HSLogger.log('Offering potion multi buy / consume buttons injected', this.context);
        }
    };

    #obtainiumMutationTrigger(mutations: MutationRecord[], observer: MutationObserver) {
        const moddedButton = document.getElementById('obtainiumPotionMultiUseButton');

        if (moddedButton === null) {
            const useObtainiumPotionButton = document.getElementById('useobtainiumpotion');
            const buyObtainiumPotionButton = document.getElementById('buyobtainiumpotion');

            if (!useObtainiumPotionButton || !buyObtainiumPotionButton) {
                HSLogger.warn('Could not find native buttons for use/buy obtainium potions', this.context);
                return;
            }

            if (useObtainiumPotionButton) {
                const clone = useObtainiumPotionButton.cloneNode(true) as HTMLElement;
                clone.id = 'obtainiumPotionMultiUseButton';
                clone.textContent = 'CONSUME 10x';
                clone.addEventListener('click', () => {
                    for (let i = 0; i < 10; i++) useObtainiumPotionButton.click();
                });
                useObtainiumPotionButton.parentNode?.insertBefore(clone, useObtainiumPotionButton.nextSibling);
            }

            if (buyObtainiumPotionButton) {
                const clone2 = buyObtainiumPotionButton.cloneNode(true) as HTMLElement;
                clone2.id = 'obtainiumPotionMultiBuyButton';
                clone2.textContent = 'BUY 10x';
                clone2.addEventListener('click', () => {
                    for (let i = 0; i < 10; i++) {
                        buyObtainiumPotionButton.click();
                        setTimeout(() => { document.getElementById('ok_confirm')?.click(); }, 1);
                    }
                });
                buyObtainiumPotionButton.parentNode?.insertBefore(clone2, buyObtainiumPotionButton.nextSibling);
            }

            this.#obtainiumPotionObserver.disconnect();
            HSLogger.log('Obtainium potion multi buy / consume buttons injected', this.context);
        }
    };

    async #injectAdd10Button() {
        if (document.getElementById('hs-add-10-btn')) return;

        const container = document.getElementById('addCodeBox');
        if (!container) return;

        const addBtn = container.querySelector('#addCode') as HTMLButtonElement;
        const addAllBtn = container.querySelector('#addCodeAll') as HTMLButtonElement;
        const addOneBtn = container.querySelector('#addCodeOne') as HTMLButtonElement;

        if (!addBtn || !addAllBtn || !addOneBtn) return;

        const add10Btn = document.createElement('button');
        add10Btn.id = 'hs-add-10-btn';
        add10Btn.className = 'hs-add-10-btn';
        add10Btn.textContent = 'Add x10';

        add10Btn.addEventListener('click', async () => {
            addBtn.click();
            const input = document.getElementById('prompt_text') as HTMLInputElement | null;
            if (!input) return;
            input.value = '10';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            HSUtils.startDialogWatcher();
            await HSUtils.sleep(3);
            HSUtils.stopDialogWatcher();
        });

        // Insert the new button next to the existing buttons.
        addAllBtn.parentNode?.insertBefore(add10Btn, addOneBtn);

        // Force the container and its direct child buttons to share width evenly.
        try {
            container.style.display = 'flex';
            container.style.width = 'auto';
            container.style.maxWidth = '480px';
            container.style.margin = '0 auto';
            container.style.marginBottom = '3px';
            container.style.gap = '0';

            const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>('button'));
            buttons.forEach(b => {
                b.style.flex = '1 1 25%';
                b.style.minWidth = '0';
                b.style.boxSizing = 'border-box';
                b.style.height = '30px';
                b.style.padding = '4px 8px';
                b.style.whiteSpace = 'nowrap';
                b.style.overflow = 'hidden';
                b.style.textOverflow = 'ellipsis';
                b.style.display = 'inline-flex';
                b.style.alignItems = 'center';
                b.style.justifyContent = 'center';
            });
        } catch (e) {
            HSLogger.log(`Failed to apply inline layout styles for addCodeBox: ${e}`, this.context);
        }
    }

    public async setMaxedOctUpgradesVisibility(): Promise<void> {
        const hideMaxedOctUpgradesSetting = HSSettings.getSetting('hideMaxedOctUpgrades') as HSSetting<boolean>;
        if (hideMaxedOctUpgradesSetting.getValue()) {
            await this.hideButtons<OcteractUpgradeKey>(
                'singularityOcteracts',
                '.octeractUpgrade',
                (key) => octeractUpgradeMaxLevels[key]?.maxLevel,
                (gameData, key) => gameData.octUpgrades[key]?.level ?? 0
            );
        } else {
            await this.#unhideButtons('singularityOcteracts', '.octeractUpgrade');
        }
    }
    public async setMaxedGQUpgradesVisibility(): Promise<void> {
        const hideMaxedGQUpgradesSetting = HSSettings.getSetting('hideMaxedGQUpgrades') as HSSetting<boolean>;
        if (hideMaxedGQUpgradesSetting.getValue()) {
            await this.hideButtons<GoldenQuarkUpgradeKey>(
                'actualSingularityUpgradeContainer',
                '.singularityUpgrade',
                (key) => goldenQuarkUpgradeMaxLevels[key]?.maxLevel,
                (gameData, key) => gameData.goldenQuarkUpgrades[key]?.level ?? 0
            );
        } else {
            await this.#unhideButtons('actualSingularityUpgradeContainer', '.singularityUpgrade');
        }
    }

    async #unhideButtons(containerId: string, selector: string): Promise<void> {
        try {
            const container = await HSUtils.waitForElement<HTMLElement>(`#${containerId}`, 5000);
            // Wait for at least one matching button to exist
            const start = performance.now();
            const timeoutMs = 5000;
            let buttons: NodeListOf<HTMLButtonElement> | null = null;
            while (true) {
                HSLogger.warn(`#unhideButtons: Waiting for buttons matching '${selector}' in #${containerId}...`, this.context);
                buttons = container.querySelectorAll<HTMLButtonElement>(selector);
                if (buttons.length > 0) {
                    await new Promise(res => setTimeout(res, 100));
                    break;
                }
                if (performance.now() - start > timeoutMs) {
                    throw new Error(`No buttons matching '${selector}' found in #${containerId} after ${timeoutMs}ms`);
                }
                await new Promise(res => setTimeout(res, 100));
            }
            buttons.forEach(button => button.style.display = '');
        } catch (e) {
            HSLogger.warn(`#unhideButtons: Could not find #${containerId} or matching buttons: ${e}`, this.context);
        }
    }

    private async hideButtons<TUpgradeKey extends string>(
        containerId: string,
        selector: string,
        getMaxLevel: (key: TUpgradeKey) => number | undefined,
        getCurrentLevel: (gameData: any, key: TUpgradeKey) => number,
    ): Promise<void> {
        const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        if (!gameDataAPI) return;
        const gameData = gameDataAPI.getGameData();
        if (!gameData) return;

        let container: HTMLElement;
        try {
            container = await HSUtils.waitForElement<HTMLElement>(`#${containerId}`, 1000);
        } catch (e) {
            HSLogger.warn(`#hideButtons: Could not find #${containerId}: ${e}`, this.context);
            return;
        }

        // Wait for at least one matching button to exist (robust to async DOM rendering)
        const start = performance.now();
        const timeoutMs = 1000;
        let buttons: HTMLElement[] = [];
        while (true) {
            buttons = Array.from(container.querySelectorAll<HTMLElement>(selector));
            if (buttons.length > 0) {
                // Wait a bit more... and leave...
                await new Promise(res => setTimeout(res, 100));
                break;
            }
            if (performance.now() - start > timeoutMs) {
                HSLogger.warn(`#hideButtons: No buttons matching '${selector}' found in #${containerId} after ${timeoutMs}ms`, this.context);
                return;
            }
            await new Promise(res => setTimeout(res, 100));
        }

        for (const button of buttons) {
            const upgradeKey = button.id as TUpgradeKey;
            const maxLevel = getMaxLevel(upgradeKey);
            const currentLevel = getCurrentLevel(gameData, upgradeKey);

            if (maxLevel !== undefined && maxLevel !== -1 && currentLevel >= maxLevel) {
                button.style.display = 'none';
            } else {
                button.style.display = '';
            }
        }
    }

    showGQDistributor(): void {
        if (document.getElementById('hs-gq-distributor')) {
            document.getElementById('hs-gq-distributor')!.style.display = '';
            return;
        }

        const container = document.getElementById('goldenQuarksDisplay');
        if (!container) return;

        const distributor = document.createElement('div');
        distributor.id = 'hs-gq-distributor';
        distributor.style.display = 'flex';
        distributor.style.flexDirection = 'column';
        distributor.style.alignItems = 'center';
        distributor.style.marginTop = '10px';
        distributor.style.padding = '10px';
        distributor.style.border = '1px solid #ccc';
        distributor.style.borderRadius = '5px';
        distributor.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';

        const title = document.createElement('h3');
        title.textContent = 'GQ Distributor';
        title.style.margin = '0 0 10px 0';
        distributor.appendChild(title);

        const inputsContainer = document.createElement('div');
        inputsContainer.style.display = 'flex';
        inputsContainer.style.flexWrap = 'wrap';
        inputsContainer.style.justifyContent = 'center';
        inputsContainer.style.gap = '10px';
        distributor.appendChild(inputsContainer);

        const infiniteUpgrades: { id: string, src: string }[] = [];
        const upgradeButtons = document.querySelectorAll<HTMLButtonElement>('#actualSingularityUpgradeContainer .singularityUpgrade');

        upgradeButtons.forEach(btn => {
            const upgradeKey = btn.id as GoldenQuarkUpgradeKey;
            const maxLevel = goldenQuarkUpgradeMaxLevels[upgradeKey]?.maxLevel;
            if (maxLevel === -1) {
                const img = btn.querySelector('img');
                if (img) {
                    infiniteUpgrades.push({ id: btn.id, src: img.src });
                }
            }
        });

        const inputs: { [key: string]: HTMLInputElement } = {};

        infiniteUpgrades.forEach((upgrade, idx) => {
            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.flexDirection = 'column';
            wrapper.style.alignItems = 'center';

            const img = document.createElement('img');
            img.src = upgrade.src;
            img.style.width = '32px';
            img.style.height = '32px';
            img.style.marginBottom = '5px';
            wrapper.appendChild(img);

            const input = document.createElement('input');
            input.type = 'number';
            input.min = '0';
            input.value = '0';
            input.style.width = '60px';
            input.style.textAlign = 'center';
            inputs[upgrade.id] = input;
            wrapper.appendChild(input);

            input.addEventListener('input', () => {
                const settingKey = `gqDistributorRatio${idx + 1}` as keyof HSSettingsDefinition;
                const setting = HSSettings.getSetting(settingKey);
                if (setting) {
                    const val = parseFloat(input.value) || 0;
                    setting.setValue(val);
                }
            });

            inputsContainer.appendChild(wrapper);
        });

        // Load saved ratios from settings
        const upgradeIds = Object.keys(inputs);
        for (let i = 0; i < 8; i++) {
            const settingKey = `gqDistributorRatio${i + 1}` as keyof HSSettingsDefinition;
            const inputKey = upgradeIds[i];
            if (inputKey && inputs[inputKey]) {
                const setting = HSSettings.getSetting(settingKey);
                if (setting) {
                    const ratio = setting.getValue();
                    if (typeof ratio === 'number') {
                        inputs[inputKey].value = ratio.toString();
                    }
                }
            }
        }

        const distributeBtn = document.createElement('button');
        distributeBtn.textContent = 'Distribute';
        distributeBtn.style.marginTop = '10px';
        distributeBtn.style.padding = '5px 15px';
        distributeBtn.style.cursor = 'pointer';

        const statusLabel = document.createElement('div');
        statusLabel.style.marginTop = '6px';
        statusLabel.style.fontSize = '12px';
        statusLabel.style.color = '#aaa';
        statusLabel.style.minHeight = '16px';
        statusLabel.style.textAlign = 'center';

        const setStatus = (text: string) => { statusLabel.textContent = text; };

        const promptInput = document.querySelector('#prompt_text') as HTMLInputElement;
        const okPrompt = document.querySelector('#ok_prompt') as HTMLButtonElement;
        const okAlert = document.querySelector('#ok_alert') as HTMLButtonElement;
        const alertWrapper = document.getElementById('alertWrapper') as HTMLElement | null;
        const promptWrapper = document.getElementById('promptWrapper') as HTMLElement | null;

        // Resolves as soon as the element's display becomes 'block', or after timeoutMs.
        const waitForVisible = (el: HTMLElement | null, timeoutMs: number): Promise<void> =>
            new Promise(resolve => {
                if (!el) { resolve(); return; }
                if (el.style.display === 'block') { resolve(); return; }

                let done = false;
                const finish = () => {
                    if (done) return;
                    done = true;
                    clearTimeout(timer);
                    observer.disconnect();
                    resolve();
                };

                const observer = new MutationObserver(() => {
                    if (el.style.display === 'block') finish();
                });
                observer.observe(el, { attributes: true, attributeFilter: ['style'] });

                const timer = setTimeout(finish, timeoutMs);
            });

        distributeBtn.addEventListener('click', async () => {
            const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
            if (!gameDataAPI) return;
            const gameData = gameDataAPI.getGameData();
            if (!gameData) return;

            const totalGQ = gameData.goldenQuarks;
            const ratios: { [key: string]: number } = {};

            for (const id in inputs) {
                const val = parseFloat(inputs[id].value) || 0;
                if (val > 0) {
                    ratios[id] = val;
                }
            }

            // Save ratios to settings 
            for (let i = 0; i < 8; i++) {
                const settingKey = `gqDistributorRatio${i + 1}` as keyof HSSettingsDefinition;
                const inputKey = upgradeIds[i];
                if (inputKey && inputs[inputKey]) {
                    const setting = HSSettings.getSetting(settingKey);
                    if (setting) {
                        const val = parseFloat(inputs[inputKey].value) || 0;
                        setting.setValue(val);
                    }
                }
            }

            if (!promptInput || !okPrompt || !okAlert) return;

            const ids = Object.keys(ratios);
            if (ids.length === 0) return;
            const gqBudget = Math.max(0, Math.floor(totalGQ));
            const weightEntries = ids.map((id) => {
                const weight = ratios[id] ?? 0;
                const upgradeData = gameData.goldenQuarkUpgrades[id as GoldenQuarkUpgradeKey];
                const invested = Math.max(0, upgradeData?.goldenQuarksInvested ?? 0);
                return { id, weight, invested };
            }).filter(entry => entry.weight > 0);

            if (weightEntries.length === 0 || gqBudget <= 0) return;

            // Cumulative target allocation:
            // choose final invested totals so that each upgrade tracks its weight ratio,
            // while never reducing upgrades that are already over target.
            const targetTotalInvested = weightEntries.reduce((sum, entry) => sum + entry.invested, 0) + gqBudget;
            let activeIndices = weightEntries.map((_, idx) => idx);
            let activeWeightSum = weightEntries.reduce((sum, entry) => sum + entry.weight, 0);
            let inactiveInvestedSum = 0;

            while (activeIndices.length > 0 && activeWeightSum > 0) {

                const lambda = (targetTotalInvested - inactiveInvestedSum) / activeWeightSum;
                const newlyInactive = activeIndices.filter(idx => weightEntries[idx].invested > lambda * weightEntries[idx].weight);

                if (newlyInactive.length === 0) break;
                const newlyInactiveSet = new Set<number>(newlyInactive);
                for (const idx of newlyInactive) {
                    inactiveInvestedSum += weightEntries[idx].invested;
                    activeWeightSum -= weightEntries[idx].weight;
                }
                activeIndices = activeIndices.filter(idx => !newlyInactiveSet.has(idx));
            }

            const activeSet = new Set<number>(activeIndices);
            const lambda = activeWeightSum > 0
                ? (targetTotalInvested - inactiveInvestedSum) / activeWeightSum
                : 0;

            const exactAdditional = weightEntries.map((entry, idx) => {
                const targetFinalInvested = activeSet.has(idx)
                    ? Math.max(entry.invested, lambda * entry.weight)
                    : entry.invested;
                const additional = Math.max(0, targetFinalInvested - entry.invested);
                return {
                    id: entry.id,
                    exactAdditional: additional,
                    floorAdditional: Math.floor(additional),
                    fraction: additional - Math.floor(additional)
                };
            });

            const floorTotal = exactAdditional.reduce((sum, entry) => sum + entry.floorAdditional, 0);
            let remaining = Math.max(0, gqBudget - floorTotal);
            const byFractionDesc = [...exactAdditional].sort((a, b) => b.fraction - a.fraction);
            for (let i = 0; i < byFractionDesc.length && remaining > 0; i++) {
                byFractionDesc[i].floorAdditional += 1;
                remaining -= 1;
            }

            const plannedSpendById = new Map<string, number>(
                exactAdditional.map(entry => [entry.id, entry.floorAdditional])
            );
            const plannedTotal = ids.reduce((sum, id) => sum + (plannedSpendById.get(id) ?? 0), 0);

            HSLogger.debug(
                `[HSQOLButtons][GQDistributor] budget=${gqBudget} plannedTotal=${plannedTotal} unallocated=${Math.max(0, gqBudget - plannedTotal)} planned=${JSON.stringify(
                    ids.map(id => ({
                        id,
                        weight: ratios[id] ?? 0,
                        invested: Math.max(0, gameData.goldenQuarkUpgrades[id as GoldenQuarkUpgradeKey]?.goldenQuarksInvested ?? 0),
                        spend: plannedSpendById.get(id) ?? 0
                    }))
                )}`,
                this.context
            );

            distributeBtn.disabled = true;
            distributeBtn.style.opacity = '0.6';
            distributeBtn.style.cursor = 'not-allowed';

            let current = 0;

            for (const id of ids) {
                current++;
                const amountToSpend = plannedSpendById.get(id) ?? 0;
                setStatus(`Buying ${current}/${ids.length} — spending ${amountToSpend.toLocaleString()} GQ…`);

                if (amountToSpend <= 0) { setStatus(`Skipped ${current}/${ids.length} (0 GQ)`); continue; }

                const btn = document.getElementById(id) as HTMLButtonElement;
                if (!btn) continue;

                // Shift-click opens the game's "how many?" prompt
                btn.dispatchEvent(new MouseEvent('click', { shiftKey: true, bubbles: true }));

                // Wait until the prompt is actually visible before interacting with it
                await waitForVisible(promptWrapper, 5000);

                promptInput.value = amountToSpend.toString();
                promptInput.dispatchEvent(new Event('input', { bubbles: true }));
                okPrompt.click();

                // Wait until the confirmation alert has actually appeared before dismissing
                await waitForVisible(alertWrapper, 5000);
                okAlert.click();

                // Dismiss any hover tooltip the programmatic click may have triggered
                btn.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
                btn.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
                btn.blur();

                // Force a macrotask yield so the browser can paint between purchases
                await new Promise(r => setTimeout(r, 0));
            }

            distributeBtn.disabled = false;
            distributeBtn.style.opacity = '';
            distributeBtn.style.cursor = 'pointer';
            setStatus('Done!');
            setTimeout(() => setStatus(''), 3000);
        });
        distributor.appendChild(distributeBtn);
        distributor.appendChild(statusLabel);

        container.parentNode?.insertBefore(distributor, container.nextSibling);
    }

    hideGQDistributor(): void {
        const distributor = document.getElementById('hs-gq-distributor');
        if (distributor) {
            distributor.style.display = 'none';
        }
    }

    // Internal: Setup event data subscription for Events Quickbar
    #setupEventsQuickbarSubscription(): void {
        if (this.#eventsQuickbarUnsubscribe) {
            HSLogger.debug('Events Quickbar is already subscribed to event data changes', this.context);
            return;
        }
        const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        if (gameDataAPI && typeof gameDataAPI.subscribeEventDataChange === 'function') {
            this.#eventsQuickbarUnsubscribe = gameDataAPI.subscribeEventDataChange(() => {
                this.updateEventsQuickbarDOM();
            }) ?? null;
            HSLogger.debug('Subscribed to event data changes for Events Quickbar', this.context);
        }
    }

    // Internal: Cleanup event data subscription for Events Quickbar
    #cleanupEventsQuickbarSubscription(): void {
        if (this.#eventsQuickbarUnsubscribe) {
            this.#eventsQuickbarUnsubscribe();
            this.#eventsQuickbarUnsubscribe = null;
            HSLogger.debug('Unsubscribed from event data changes for Events Quickbar', this.context);
        }
    }

    /** Public wrapper to enable the Automation Quickbar. */
    public enableAutomationQuickbar(): void {
        this.enableQuickbar(
            HSQuickbarManager.QUICKBAR_IDS.AUTOMATION,
            () => this.getAutomationQuickbarSection(),
            () => this.#setupAutomationQuickbar(),
            (el) => { this.automationQuickBarContainer = el as HTMLDivElement; }
        );
    }

    /** Public wrapper to enable the Events Quickbar. */
    public enableEventsQuickbar(): void {
        this.#cleanupEventsQuickbarSubscription();
        this.enableQuickbar(
            HSQuickbarManager.QUICKBAR_IDS.EVENTS,
            () => this.getEventsQuickbarSection(),
            () => {
                this.#setupEventsQuickbar();
                this.#setupEventsQuickbarSubscription();
            },
            (el) => { this.eventsQuickBarContainer = el as HTMLDivElement; }
        );
    }

    /** Public wrapper to disable the Automation Quickbar. */
    public disableAutomationQuickbar(): void {
        this.disableQuickbar(
            HSQuickbarManager.QUICKBAR_IDS.AUTOMATION,
            () => this.#teardownAutomationQuickbar()
        );
    }

    /** Public wrapper to disable the Events Quickbar. */
    public disableEventsQuickbar(): void {
        this.disableQuickbar(
            HSQuickbarManager.QUICKBAR_IDS.EVENTS,
            () => {
                this.#teardownEventsQuickbar();
                this.#cleanupEventsQuickbarSubscription();
            }
        );
    }

    /**
     * Generic method to enable a quickbar using HSQuickbarManager.
     * @param id - The quickbar ID (use HSQuickbarManager.QUICKBAR_IDS)
     * @param factory - Factory function to create the quickbar section
     * @param setupCallback - Optional setup callback after injection
     * @param containerSetter - Optional setter for the quickbar container
     */
    private enableQuickbar(
        id: QUICKBAR_ID,
        factory: () => HTMLElement,
        setupCallback?: () => void,
        containerSetter?: (el: HTMLElement) => void
    ): void {
        HSLogger.debug(`Enabling Quickbar: ${id}`, this.context);
        HSQuickbarManager.getInstance().enableQuickbar(
            id,
            factory,
            (section) => {
                if (containerSetter) containerSetter(section);
                if (setupCallback) setupCallback();
            }
        );
    }

    /**
     * Generic method to disable a quickbar using HSQuickbarManager.
     * @param id - The quickbar ID (use HSQuickbarManager.QUICKBAR_IDS)
     * @param teardownCallback - Optional teardown callback before removal
     */
    private disableQuickbar(
        id: QUICKBAR_ID,
        teardownCallback?: () => void
    ): void {
        HSLogger.debug(`Disabling Quickbar: ${id}`, this.context);
        if (teardownCallback) teardownCallback();
        HSQuickbarManager.getInstance().disableQuickbar(id);
    }

    /**
     * Injects a custom button into the Ambrosia subtab when active, waiting for DOM readiness.
     */
    public async injectAFKSwapperToggleButton(): Promise<void> {
        if (document.getElementById('hs-ambrosia-loadout-idle-swap-toggle')) return;
        try {
            const parent = await HSUtils.waitForElement<HTMLElement>('#singularityAmbrosia', 1000);
            const child = await HSUtils.waitForElement<HTMLElement>('#ambrosiaProgressBar', 1000);
            const afkSwapperToggle = document.createElement('button');
            afkSwapperToggle.id = 'hs-ambrosia-loadout-idle-swap-toggle';
            afkSwapperToggle.textContent = 'Toggle AFK Swapper';

            afkSwapperToggle.addEventListener('click', () => {
                const idleSwapToggle = document.getElementById('hs-setting-ambrosia-idle-swap-btn') as HTMLElement;
                if (idleSwapToggle) {
                    idleSwapToggle.click();
                }
            });

            HSUI.injectHTMLElement(afkSwapperToggle, (element) => {
                parent.insertBefore(element, child);
            });
        } catch (e) {
            HSLogger.warn(`injectAFKSwapperToggleButton: Could not find required elements: ${e}`, this.context);
        }
    }

    /**
     * DRY helper: subscribe to a SINGULARITY_VIEW tab visit and run a callback.
     * Deduplicates subscriptions per tab. Returns an unsubscribe function.
     */
    private subscribeToTabVisit(
        tabId: SINGULARITY_VIEW,
        onTabVisit: () => void
    ): (() => void) | undefined {
        const gameState = HSModuleManager.getModule<HSGameState>('HSGameState');
        if (!gameState) return;

        // If a subscription for this tab already exists, unsubscribe it first
        const oldUnsub = this.#tabVisitUnsubscribers.get(tabId);
        if (oldUnsub) {
            try {
                oldUnsub();
                HSLogger.debug(`subscribeToTabVisit: Unsubscribed previous handler for tab ${tabId}`, this.context);
            } catch (e) {
                HSLogger.warn(`subscribeToTabVisit: Error unsubscribing previous handler for tab ${tabId}: ${e}`, this.context);
            }
        }

        const subId = gameState.subscribeGameStateChange<SingularityView>(
            'SINGULARITY_VIEW',
            (prev, curr) => {
                if (curr.getId() === tabId) {
                    setTimeout(onTabVisit, 20);
                }
            }
        );
        if (subId) {
            const unsubscribe = () => gameState.unsubscribeGameStateChange('SINGULARITY_VIEW', subId);
            this.#tabVisitUnsubscribers.set(tabId, unsubscribe);
            HSLogger.debug(`subscribeToTabVisit: Subscribed to SINGULARITY_VIEW changes for tab ${tabId}`, this.context);
            return unsubscribe;
        } else {
            HSLogger.warn(`subscribeToTabVisit: Failed to subscribe to SINGULARITY_VIEW changes for tab ${tabId}`, this.context);
            this.#tabVisitUnsubscribers.delete(tabId);
            return;
        }
    }
}


