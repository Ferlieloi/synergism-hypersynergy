import { HSModuleManager } from "../hs-core/module/hs-module-manager";
import { HSLogger } from "../hs-core/hs-logger";
import { HSElementHooker } from "../hs-core/hs-elementhooker";
import { HSGameDataAPI } from "../hs-core/gds/hs-gamedata-api";
import { HSQOLQuickbarBase } from "./hs-qolQuickbarBase";

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

/**
 * Class: HSQOLAutomationQuickbar
 * IsExplicitHSModule: No
 * Description: Automation Quickbar component.
 *     Render a compact automation quickbar with buttons that reflect and toggle various automation features (buildings, runes, research, cubes, etc.).
 *     Observe the DOM for relevant automation controls and update button states/visibility reactively.
 *     Provide a stable public lifecycle: `createSection()`, `setup()`, `teardown()`.
 */
export class HSQOLAutomationQuickbar extends HSQOLQuickbarBase {
    protected readonly context = 'HSQOLAutomationQuickbar';
    protected readonly sectionId = 'automationQuickBar';
    protected readonly sectionClass = 'hs-automation-quickbar';

    // quickbar container
    automationQuickBarContainer: HTMLDivElement | null = null;
    #automationQuickBarWatcherBySelector = new Map<string, { watcherId: string; element: HTMLElement }>();
    #automationQuickbarBootstrapTimeoutIds: number[] = [];
    #selectorElementCache = new Map<string, HTMLElement | null>();
    #selectorMatcherCache = new Map<string, (el: HTMLElement | null) => boolean>();
    #queuedAutomationFrameId: number | null = null;

    static readonly #AUTOMATION_QUICKBAR_WATCH_OPTS: {
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

    static readonly #AUTOMATION_QUICKBAR_BOOTSTRAP_RETRY_MS = [50, 150, 500, 1000, 2000] as const;

    static readonly #automationBuildingsAndUpgradesSelectors = [
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

    static readonly #automationRuneSelectors = [
        '#toggleautosacrifice',
        '#toggleautoBuyFragments',
        '#toggleautofortify',
        '#toggle36',
        '#toggle37'
    ];

    static readonly #automationResearchSelectors = [
        { selector: '#toggleresearchbuy', expected: 'Upgrade: MAX [if possible]' },
        { selector: '#toggleautoresearch', expected: 'Automatic: ON' },
        { selector: '#toggleautoresearchmode', expected: 'Automatic mode: Cheapest' },
    ] as const satisfies readonly AutomationSelectorSpec[];

    static readonly #automationCubeSelectors = [
        '#openCubes',
        '#openTesseracts',
        '#openHypercubes',
        '#openPlatonicCube',
        '#toggleAutoCubeUpgrades',
        '#toggleAutoPlatonicUpgrades'
    ];

    static readonly #automationHepteractSelectors = [
        '#chronosHepteractAuto',
        '#hyperrealismHepteractAuto',
        '#challengeHepteractAuto',
        '#abyssHepteractAuto',
        '#acceleratorHepteractAuto',
        '#acceleratorBoostHepteractAuto',
        '#multiplierHepteractAuto',
        '#hepteractToQuarkTradeAuto'
    ];

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
            selectors: HSQOLAutomationQuickbar.#automationBuildingsAndUpgradesSelectors,
            hideWhenFullyEnabledMinHighestSingularityCount: 25,
            buttonId: 'automationQuickBar-buildings',
            label: 'Buildings and Upgrades',
            iconSrc: './Pictures/Simplified/Coin.png'
        },
        Rune: {
            kind: 'group',
            selectors: HSQOLAutomationQuickbar.#automationRuneSelectors,
            buttonId: 'automationQuickBar-runes',
            label: 'Runes',
            iconSrc: './Pictures/Simplified/Offering.png'
        },
        Research: {
            kind: 'group',
            selectors: HSQOLAutomationQuickbar.#automationResearchSelectors,
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
            selectors: HSQOLAutomationQuickbar.#automationCubeSelectors,
            buttonId: 'automationQuickBar-cubes',
            label: 'Cube Auto-Open',
            iconSrc: './Pictures/Default/TinyWow3.png',
        },
        Hepteract: {
            kind: 'group',
            selectors: HSQOLAutomationQuickbar.#automationHepteractSelectors,
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

    static readonly #AUTOMATION_QUICKBAR_RENDER_ORDER: readonly (keyof typeof HSQOLAutomationQuickbar.AUTOMATION_QUICKBAR_CONFIG)[] = [
        'AutoChallenge',
        'BuildingsAndUpgrades',
        'Rune',
        'Research',
        'AutoAntSacrifice',
        'Cube',
        'Hepteract',
        'AutoAscend'
    ];

    /** Resolve a selector string to an HTMLElement. */
    #resolveAutomationQuickBarElement(sel: string): HTMLElement | null {
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

    /**
     * Heuristically determine whether a given automation toggle/control is "on".
     * Checks ARIA attributes, text content, specific patterns, and CSS class hints.
     * This function is intentionally tolerant of multiple UI representations.
     */
    #isElementOn(el: HTMLElement | null): boolean {
        if (!el) return false;
        try {
            const ariaPressed = el.getAttribute('aria-pressed');
            if (ariaPressed === 'true') return true;
            const ariaChecked = el.getAttribute('aria-checked');
            if (ariaChecked === 'true') return true;
            // Text-based heuristics: look for common status markers
            const text = (el.textContent || '').trim();
            if (/Auto\s+Open\s*\[OFF\]/i.test(text)) return false;
            if (/Auto\s+Open\s*\[(ON|OFF)\]/i.test(text)) return /\[ON\]/i.test(text);
            if (/Auto\s+Open\s*"?\d+%"?/i.test(text)) return true;

            // Matches like "Open Cubes: [ON]"
            const openMatch = text.match(/Open\s+(Cubes|Tesseracts|Hypercubes|Platonic)\s*:?\s*\[(ON|OFF)\]/i);
            if (openMatch) return openMatch[2].toUpperCase() === 'ON';

            // Generic auto-upgrade markers
            if (/Auto\s+Upgrades:\s*\[ON\]/i.test(text)) return true;
            if (/Auto\s+Upgrades:\s*\[OFF\]/i.test(text)) return false;

            // Class-name or inline text hints
            const cls = el.className || '';
            if (/\b(on|enabled|active)\b/i.test(cls)) return true;
            if (/\bON\b/i.test(text) || /enabled/i.test(text)) return true;
        } catch (e) {
            HSLogger.log(`isElementOn check failed: ${e}`, this.context);
        }
        return false;
    }

    /** Normalize toggle text by collapsing whitespace for stable comparisons. */
    #normalizeToggleText(text: string): string {
        return text.replace(/\s+/g, ' ').trim();
    }

    /** Convert an AutomationSelectorSpec to its selector string form. */
    #selectorToString(selectorSpec: AutomationSelectorSpec): string {
        return typeof selectorSpec === 'string' ? selectorSpec : selectorSpec.selector;
    }

    /** Return a canonical string representing the expected state for caching keys. */
    #expectedToString(selectorSpec: AutomationSelectorSpec): string {
        if (typeof selectorSpec === 'string' || selectorSpec.expected === undefined) {
            return 'ON_DEFAULT';
        }
        return selectorSpec.expected;
    }

    /**
     * Return a cached DOM element for the selectorSpec if present, otherwise
     * resolve it and cache the result. Uses `isConnected` to avoid returning
     * stale nodes.
     */
    #getCachedAutomationElement(selectorSpec: AutomationSelectorSpec): HTMLElement | null {
        const selector = this.#selectorToString(selectorSpec);
        const cached = this.#selectorElementCache.get(selector);
        if (cached && cached.isConnected) {
            return cached;
        }

        const resolved = this.#resolveAutomationQuickBarElement(selector);
        this.#selectorElementCache.set(selector, resolved);
        return resolved;
    }

    /**
     * Compile or retrieve a matcher function for a selectorSpec. The matcher
     * will test whether a provided element is considered in the expected state.
     * Results are cached keyed by selector + expected state for performance.
     */
    #getCompiledAutomationSelectorMatcher(selectorSpec: AutomationSelectorSpec): (el: HTMLElement | null) => boolean {
        const selector = this.#selectorToString(selectorSpec);
        const expected = typeof selectorSpec === 'string' ? undefined : selectorSpec.expected;
        const matcherKey = `${selector}::${this.#expectedToString(selectorSpec)}`;

        const existing = this.#selectorMatcherCache.get(matcherKey);
        if (existing) {
            return existing;
        }

        let matcher: (el: HTMLElement | null) => boolean;

        // Build matcher according to expected contract
        if (expected === undefined || expected === 'ON') {
            matcher = (el: HTMLElement | null) => this.#isElementOn(el);
        } else if (expected === 'OFF') {
            matcher = (el: HTMLElement | null) => !!el && !this.#isElementOn(el);
        } else {
            // expected contains a literal text to compare against element text
            const expectedText = this.#normalizeToggleText(expected);
            matcher = (el: HTMLElement | null) => {
                if (!el) return false;
                const currentText = this.#normalizeToggleText(el.textContent || '');
                return currentText === expectedText;
            };
        }

        this.#selectorMatcherCache.set(matcherKey, matcher);
        return matcher;
    }

    /**
     * Schedule a single queued animation-frame render. Coalesces multiple calls
     * so `renderFn` runs once per frame maximum.
     */
    #queueAutomationQuickbarRender(renderFn: () => void): void {
        if (this.#queuedAutomationFrameId !== null) {
            return;
        }

        this.#queuedAutomationFrameId = window.requestAnimationFrame(() => {
            this.#queuedAutomationFrameId = null;
            renderFn();
        });
    }

    /** Helper to read the highestSingularityCount from `HSGameDataAPI`. */
    #getHighestSingularityCount(): number {
        const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        const gameData = gameDataAPI?.getGameData();
        return gameData?.highestSingularityCount ?? 0;
    }

    /** Determine whether a toggle should be visible based on `minHighestSingularityCount`. */
    #isAutomationToggleVisible(config: AutomationQuickbarToggleConfig, highestSingularityCount: number): boolean {
        const minSingularity = config.minHighestSingularityCount;
        if (minSingularity === undefined) {
            return true;
        }
        return highestSingularityCount >= minSingularity;
    }

    /** Whether selector-visibility rules should be applied for this config. */
    #shouldApplyAutomationSelectorVisibility(config: AutomationQuickbarToggleConfig): boolean {
        if (config.minHighestSingularityCount !== undefined) {
            return false;
        }
        return config.selectorVisibility !== 'none';
    }

    /**
     * Should the button be hidden when the underlying automation targets are
     * already fully enabled? This respects a minimum singularity count.
     */
    #shouldHideAutomationButtonWhenFullyEnabled(
        config: AutomationQuickbarToggleConfig,
        highestSingularityCount: number,
        isFullyEnabled: boolean
    ): boolean {
        const minSingularity = config.hideWhenFullyEnabledMinHighestSingularityCount;
        if (minSingularity === undefined || !isFullyEnabled) {
            return false;
        }

        return highestSingularityCount >= minSingularity;
    }

    /** Return the actual element that determines visibility according to config. */
    #getVisibilityTargetElement(el: HTMLElement | null, config: AutomationQuickbarToggleConfig): HTMLElement | null {
        if (!el) return null;
        if (config.selectorVisibility === 'parent') {
            return el.parentElement;
        }
        return el;
    }

    /** Return the automation element if it exists and is visible according to selector-visibility rules in `config`. */
    #getVisibleAutomationElement(selectorSpec: AutomationSelectorSpec, config: AutomationQuickbarToggleConfig): HTMLElement | null {
        const el = this.#getCachedAutomationElement(selectorSpec);
        if (!el) return null;
        if (!this.#shouldApplyAutomationSelectorVisibility(config)) return el;

        const visibilityTarget = this.#getVisibilityTargetElement(el, config);
        return !!visibilityTarget && visibilityTarget.isConnected && visibilityTarget.style.display !== 'none' ? el : null;
    }

    /** Narrowing helper: returns true when element is attached and visible. */
    #isElementVisibleInDom(el: HTMLElement | null): el is HTMLElement {
        return !!el && el.isConnected && el.style.display !== 'none';
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
     * Setup Automation quickbar container and rendering logic.
     * Includes refresh scheduling (raf), watcher registration (DOM mutation),
     * and button creation for each static config entry.
     */
    #setupAutomationQuickbar(): void {
        if (!this.automationQuickBarContainer) return;

        this.#resetAutomationQuickbarRuntime();

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
                matcher: this.#getCompiledAutomationSelectorMatcher(selectorSpec)
            }));
            compiledGroupSelectors.set(selectors, compiled);
            return compiled;
        };

        const getAutomationGroupState = (selectors: readonly AutomationSelectorSpec[], config: AutomationQuickbarToggleConfig) => {
            const compiledSelectors = getAutomationCompiledGroupSelectors(selectors);

            const targets = selectors
                .map((selectorSpec, idx) => {
                    const sel = this.#selectorToString(selectorSpec);
                    const el = this.#getVisibleAutomationElement(selectorSpec, config);
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
            const highestSingularityCount = this.#getHighestSingularityCount();
            stateUpdaters.forEach(update => update(highestSingularityCount));
        };

        const requestAutomationUpdateUI = () => this.#queueAutomationQuickbarRender(updateAutomationUIState);

        const addAutomationQuickbarToggle = (toggleKey: keyof typeof HSQOLAutomationQuickbar.AUTOMATION_QUICKBAR_CONFIG) => {
            const config = HSQOLAutomationQuickbar.AUTOMATION_QUICKBAR_CONFIG[toggleKey];

            if (config.kind === 'solo') {
                const compiledChecks = config.checks.map(spec => ({
                    spec,
                    matcher: this.#getCompiledAutomationSelectorMatcher(spec)
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
                    const target = this.#getVisibleAutomationElement(config.actionDOM, config)
                        ?? compiledChecks
                            .map(({ spec }) => this.#getVisibleAutomationElement(spec, config))
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
                    const meetsSingularityRequirement = this.#isAutomationToggleVisible(config, highestSingularityCount);

                    const visibleActionTarget = this.#getVisibleAutomationElement(config.actionDOM, config);
                    const visibleCheckTargets = compiledChecks.map(({ spec }) => this.#getVisibleAutomationElement(spec, config));
                    const hasVisibleLinkedTarget = !this.#shouldApplyAutomationSelectorVisibility(config)
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

                    if (this.#shouldHideAutomationButtonWhenFullyEnabled(config, highestSingularityCount, enabled)) {
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
                const meetsSingularityRequirement = this.#isAutomationToggleVisible(config, highestSingularityCount);
                const hasVisibleLinkedTarget = !this.#shouldApplyAutomationSelectorVisibility(config) || targets.length > 0;

                btn.style.display = meetsSingularityRequirement && hasVisibleLinkedTarget ? '' : 'none';

                if (!meetsSingularityRequirement || !hasVisibleLinkedTarget) {
                    btn.classList.remove('enabled', 'mixed');
                    btn.classList.add('disabled');
                    btn.disabled = true;
                    return;
                }

                if (this.#shouldHideAutomationButtonWhenFullyEnabled(config, highestSingularityCount, allOn)) {
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

        for (const item of HSQOLAutomationQuickbar.#AUTOMATION_QUICKBAR_RENDER_ORDER) {
            addAutomationQuickbarToggle(item);
        }

        this.#finalizeAutomationQuickbarSetup(updateAutomationUIState, requestAutomationUpdateUI);
    }

    /** Stop and clear all element watchers registered for the automation quickbar. */
    #clearAutomationQuickBarWatchers(): void {
        for (const watcher of this.#automationQuickBarWatcherBySelector.values()) {
            HSElementHooker.stopWatching(watcher.watcherId);
        }
        this.#automationQuickBarWatcherBySelector.clear();
    }

    /** Clear all pending bootstrap retry timeouts used to attempt watcher registration. */
    #clearAutomationQuickbarBootstrapTimeouts(): void {
        for (const timeoutId of this.#automationQuickbarBootstrapTimeoutIds) {
            window.clearTimeout(timeoutId);
        }
        this.#automationQuickbarBootstrapTimeoutIds = [];
    }

    /** * Cleanup observers, cancel queued renders, and remove the quickbar container. */
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
     * Create a group button that toggles multiple selector targets.
     * The button reflects mixed/disabled/enabled states depending on targets.
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
            matcher: this.#getCompiledAutomationSelectorMatcher(selectorSpec)
        }));

        const btn = document.createElement('button');
        btn.className = 'autoToggle';
        btn.title = title;
        btn.setAttribute('aria-label', ariaLabel);

        const img = document.createElement('img');
        img.src = iconSrc;
        img.loading = 'lazy';
        btn.appendChild(img);

        // Gather visible target elements and compute their on/off state
        const getTargets = () =>
            compiledSelectors
                .map(({ selectorSpec, matcher }) => {
                    const sel = this.#selectorToString(selectorSpec);
                    const el = this.#getVisibleAutomationElement(selectorSpec, config);
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

        // Clicking toggles all targets to the desired state (on if any are off)
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

    /** Collect all selector strings referenced by the automation configuration. */
    #collectAutomationQuickbarSelectors(): string[] {
        const allSelectorSet = new Set<string>();
        const configs = Object.values(HSQOLAutomationQuickbar.AUTOMATION_QUICKBAR_CONFIG) as readonly AutomationQuickbarToggleConfig[];

        for (const config of configs) {
            if (config.kind === 'group') {
                for (const selectorSpec of config.selectors) {
                    allSelectorSet.add(this.#selectorToString(selectorSpec));
                }
                continue;
            }

            allSelectorSet.add(config.actionDOM);
            for (const selectorSpec of config.checks) {
                allSelectorSet.add(this.#selectorToString(selectorSpec));
            }
        }

        return Array.from(allSelectorSet);
    }

    /** Register element watchers used to refresh quickbar state/visibility. */
    #registerAutomationQuickBarWatchers(updateUI: () => void): void {
        const watchOpts = HSQOLAutomationQuickbar.#AUTOMATION_QUICKBAR_WATCH_OPTS;

        const allSelectors = this.#collectAutomationQuickbarSelectors();

        for (const sel of allSelectors) {
            try {
                const el = this.#getCachedAutomationElement(sel);
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

    /** Schedule bootstrap retries to attempt watcher registration at increasing delays. */
    #scheduleAutomationQuickbarBootstrapRetries(updateUI: () => void): void {
        this.#clearAutomationQuickbarBootstrapTimeouts();

        for (const delayMs of HSQOLAutomationQuickbar.#AUTOMATION_QUICKBAR_BOOTSTRAP_RETRY_MS) {
            const timeoutId = window.setTimeout(() => {
                if (!this.automationQuickBarContainer) return;
                this.#registerAutomationQuickBarWatchers(updateUI);
                updateUI();
            }, delayMs);

            this.#automationQuickbarBootstrapTimeoutIds.push(timeoutId);
        }
    }

    // Public lifecycle is supplied by HSQOLQuickbarBase via createSection/setup/teardown.
    protected createDOM(): void {
        /* no extra DOM required: #setupAutomationQuickbar is responsible for actual quickbar contents */
    }

    protected cleanupDOM(): void {
        if (this.automationQuickBarContainer) {
            this.automationQuickBarContainer.innerHTML = '';
        }
    }

    protected onSetup(): void {
        this.automationQuickBarContainer = this.container;
        this.#setupAutomationQuickbar();
    }

    protected onTeardown(): void {
        this.#teardownAutomationQuickbar();
        this.automationQuickBarContainer = null;
    }
}
