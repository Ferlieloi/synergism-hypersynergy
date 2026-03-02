
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

type SelectorExpectation = 'ON' | 'OFF' | string;
type AutomationSelectorSpec = string | { selector: string; expected?: SelectorExpectation };
type QuickbarRenderKey =
    | 'BuildingsAndUpgrades'
    | 'AutoChallenge'
    | 'Rune'
    | 'Research'
    | 'AutoAntSacrifice'
    | 'Cube'
    | 'Hepteract'
    | 'AutoAscend';

type SynQuickbarConfig = {
    kind: 'syn';
    actionDOM: string;
    checks: readonly AutomationSelectorSpec[];
    buttonId: string;
    label: string;
    iconSrc: string;
};

type GroupQuickbarConfig = {
    kind: 'group';
    selectors: readonly AutomationSelectorSpec[];
    buttonId: string;
    label: string;
    iconSrc: string;
};

type QuickbarToggleConfig = SynQuickbarConfig | GroupQuickbarConfig;

/*
    Class: QOLButtons
    IsExplicitHSModule: Yes
    Description: 
        Hypersynergism module which adds qol buttons to the game.
    Author: Swiffy, XxmolkxX, the creator of original autosing script (httpsnet?) (hide gq/oct buttons) and Core (syn UI bar)
*/

export class HSQOLButtons extends HSModule {
    static SYN_UI_SETTING_KEY: keyof HSSettingsDefinition = 'enableAutomationQuickBar';

    // Shared selector arrays for the different groups
    private static readonly buildingsAndUpgradesSelectors = [
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
        { selector: '#toggle15.auto', expected: 'OFF' },
        { selector: '#toggle21.auto', expected: 'OFF' },
        { selector: '#toggle27.auto', expected: 'OFF' },
        { selector: '#tesseractautobuytoggle', expected: 'Auto Buy: ON' },
        { selector: '#tesseractautobuymode', expected: 'Mode: PERCENTAGE' },
        { selector: '#coinAutoUpgrade.autobuyerToggleButton', expected: 'Auto: ON' },
        { selector: '#prestigeAutoUpgrade.autobuyerToggleButton', expected: 'Auto: ON' },
        { selector: '#transcendAutoUpgrade.autobuyerToggleButton', expected: 'Auto: ON' },
        { selector: '#reincarnateAutoUpgrade.autobuyerToggleButton', expected: 'Auto: ON' },
        { selector: '#generatorsAutoUpgrade.autobuyerToggleButton', expected: 'Auto: ON' },
    ] as const satisfies readonly AutomationSelectorSpec[];

    private static readonly runeSelectors = [
        '#toggleautosacrifice',
        '#toggleautoBuyFragments',
        '#toggleautofortify',
        '#toggle36',
        '#toggle37'
    ];

    private static readonly researchSelectors = [
        { selector: '#toggleautoresearch', expected: 'Automatic: ON' },
        { selector: '#toggleautoresearchmode', expected: 'Automatic mode: Cheapest' },
    ] as const satisfies readonly AutomationSelectorSpec[];

    private static readonly cubeSelectors = [
        '#openCubes',
        '#openTesseracts',
        '#openHypercubes',
        '#openPlatonicCube',
        '#toggleAutoCubeUpgrades',
        '#toggleAutoPlatonicUpgrades'
    ];

    private static readonly hepteractSelectors = [
        '#chronosHepteractAuto',
        '#hyperrealismHepteractAuto',
        '#challengeHepteractAuto',
        '#abyssHepteractAuto',
        '#acceleratorHepteractAuto',
        '#acceleratorBoostHepteractAuto',
        '#multiplierHepteractAuto',
        '#hepteractToQuarkTradeAuto'
    ];

    private static readonly QUICKBAR_CONFIG = {
        BuildingsAndUpgrades: {
            kind: 'group',
            selectors: HSQOLButtons.buildingsAndUpgradesSelectors,
            buttonId: 'automationQuickBar-buildings',
            label: 'Buildings and Upgrades',
            iconSrc: './Pictures/Simplified/Coin.png'
        },
        AutoChallenge: {
            kind: 'syn',
            actionDOM: '#toggleAutoChallengeStart',
            checks: [{ selector: '#toggleAutoChallengeStart', expected: 'Auto Challenge Sweep [ON]' }],
            buttonId: 'automationQuickBar-autochallenge',
            label: 'Auto-Challenge',
            iconSrc: './Pictures/Simplified/Challenge1.png'
        },
        Rune: {
            kind: 'group',
            selectors: HSQOLButtons.runeSelectors,
            buttonId: 'automationQuickBar-runes',
            label: 'Rune',
            iconSrc: './Pictures/Simplified/Offering.png'
        },
        Research: {
            kind: 'syn',
            actionDOM: '#toggleautoresearch',
            checks: HSQOLButtons.researchSelectors,
            buttonId: 'automationQuickBar-research',
            label: 'Research',
            iconSrc: './Pictures/Simplified/Obtainium.png'
        },
        AutoAntSacrifice: {
            kind: 'syn',
            actionDOM: '#toggleAutoSacrificeAnt',
            checks: [{ selector: '#toggleAutoSacrificeAnt', expected: 'Auto Sacrifice: ON' }],
            buttonId: 'automationQuickBar-autoantsacrifice',
            label: 'Auto Ant-Sacrifice',
            iconSrc: './Pictures/Simplified/AntSacrifice.png'
        },
        Cube: {
            kind: 'group',
            selectors: HSQOLButtons.cubeSelectors,
            buttonId: 'automationQuickBar-cubes',
            label: 'Cube Auto-Open',
            iconSrc: './Pictures/Default/TinyWow3.png'
        },
        Hepteract: {
            kind: 'group',
            selectors: HSQOLButtons.hepteractSelectors,
            buttonId: 'automationQuickBar-hepteracts',
            label: 'Hept Auto-Open',
            iconSrc: './Pictures/Default/TinyWow7.png'
        },
        AutoAscend: {
            kind: 'syn',
            actionDOM: '#ascensionAutoEnable',
            checks: [{ selector: '#ascensionAutoEnable', expected: 'Auto Ascend [ON]' }],
            buttonId: 'automationQuickBar-autoascend',
            label: 'Auto Ascend',
            iconSrc: './Pictures/Simplified/AscensionNoBorder.png'
        }
    } as const satisfies Record<QuickbarRenderKey, QuickbarToggleConfig>;

    private static readonly QUICKBAR_RENDER_ORDER: readonly (keyof typeof HSQOLButtons.QUICKBAR_CONFIG)[] = [
        'BuildingsAndUpgrades',
        'AutoChallenge',
        'Rune',
        'Research',
        'AutoAntSacrifice',
        'Cube',
        'Hepteract',
        'AutoAscend'
    ];

    // quickbar section ID
    #quickbarSectionId = 'automation';

    // quickbar container
    automationQuickBarContainer: HTMLDivElement | null = null;
    automationQuickBarObservers: string[] = [];

    #offeringPotion: HTMLElement | null;
    #obtainiumPotion: HTMLElement | null;
    #config: MutationObserverInit;
    #offeringPotionObserver: MutationObserver;
    #obtainiumPotionObserver: MutationObserver;
    #selectorElementCache = new Map<string, HTMLElement | null>();
    #selectorMatcherCache = new Map<string, (el: HTMLElement | null) => boolean>();
    #queuedAutomationFrameId: number | null = null;


    /** Resolve a syn UI element by selector, falling back to window globals for cube upgrade toggles. */
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
            if (/Auto\s*:\s*ON/i.test(text)) return true;
            if (/Auto\s*:\s*OFF/i.test(text)) return false;
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

    private getCompiledSelectorMatcher(selectorSpec: AutomationSelectorSpec): (el: HTMLElement | null) => boolean {
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
        const gameState = HSModuleManager.getModule('HSGameState') as HSGameState;

        // Register a placeholder quickbar section immediately for instant injection
        HSLogger.debug('[HSQOLButtons]: Registering placeholder quickbar section for instant injection', this.context);
        const placeholder = document.createElement('div');
        placeholder.id = 'automationQuickBar';
        placeholder.textContent = 'Loading Automation Quickbar...';
        HSQuickbarManager.getInstance().registerSection(this.#quickbarSectionId, () => placeholder);

        gameState.subscribeGameStateChange<SingularityView>('SINGULARITY_VIEW', (previousView, currentView) => {
            if (currentView.getId() === SINGULARITY_VIEW.SHOP) {
                setTimeout(() => {
                    this.setGQButtonsVisibility();
                }, 20);
            }
        });

        gameState.subscribeGameStateChange<SingularityView>('SINGULARITY_VIEW', (previousView, currentView) => {
            if (currentView.getId() === SINGULARITY_VIEW.OCTERACTS) {
                setTimeout(() => {
                    this.setOctButtonsVisibility();
                }, 20);
            }
        });

        // Apply visibility on load in case the user is already on the relevant tab
        setTimeout(() => {
            this.setGQButtonsVisibility();
            this.setOctButtonsVisibility();
        }, 50);

        this.#injectAdd10Button();

        // Register and apply syn UI setting (show automation status bar)
        try {
            const existing = HSSettings.getSetting(HSQOLButtons.SYN_UI_SETTING_KEY) as HSSetting<boolean> | undefined;
            if (!existing && (HSSettings as any).registerSetting) {
                (HSSettings as any).registerSetting(HSQOLButtons.SYN_UI_SETTING_KEY, {
                    name: 'Enable syn UI bar',
                    description: 'Show automation status bar (syn UI) in header',
                    type: 'boolean',
                    value: true
                });
            }
        } catch (e) {
            HSLogger.log(`Register syn UI setting failed: ${e}`, this.context);
        }

        // Replace the placeholder with the real quickbar section as soon as possible
        HSLogger.debug('[HSQOLButtons]: Replacing placeholder with real quickbar section', this.context);
        HSQuickbarManager.getInstance().removeSection(this.#quickbarSectionId);
        HSQuickbarManager.getInstance().registerSection(this.#quickbarSectionId, () => this.getAutomationQuickbarSection());
        HSQuickbarManager.getInstance().injectSection(this.#quickbarSectionId); // Only update Automation section

        // Synchronize with quickbar injection using promise-based API
        HSQuickbarManager.getInstance().whenSectionInjected(this.#quickbarSectionId).then(() => {
            this.automationQuickBarContainer = HSQuickbarManager.getInstance().getSection(this.#quickbarSectionId) as HTMLDivElement;
            this.#setupAutomationQuickbar();
        });
    }

    /** Returns a prepared Automation quickbar DOM node for the quickbarsRow. */
    public getAutomationQuickbarSection(): HTMLElement {
        const container = document.createElement('div');
        container.id = 'automationQuickBar';
        container.className = 'hs-automation-quickbar';
        return container;
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
        if (this.#queuedAutomationFrameId !== null) {
            window.cancelAnimationFrame(this.#queuedAutomationFrameId);
            this.#queuedAutomationFrameId = null;
        }
        this.#clearAutomationQuickBarWatchers();

        const left = document.createElement('span');
        left.className = 'left';
        const center = document.createElement('span');
        center.className = 'center';
        const right = document.createElement('span');
        right.className = 'right';
        this.automationQuickBarContainer.innerHTML = '';
        this.automationQuickBarContainer.appendChild(left);
        this.automationQuickBarContainer.appendChild(center);
        this.automationQuickBarContainer.appendChild(right);

        const stateUpdaters: Array<() => void> = [];

        const setButtonState = (btn: HTMLButtonElement, targetsCount: number, allOn: boolean, allOff: boolean) => {
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

        const getCompiledGroupSelectors = (selectors: readonly AutomationSelectorSpec[]) => {
            const existing = compiledGroupSelectors.get(selectors);
            if (existing) return existing;

            const compiled = selectors.map(selectorSpec => ({
                selectorSpec,
                matcher: this.getCompiledSelectorMatcher(selectorSpec)
            }));
            compiledGroupSelectors.set(selectors, compiled);
            return compiled;
        };

        const getGroupState = (selectors: readonly AutomationSelectorSpec[]) => {
            const compiledSelectors = getCompiledGroupSelectors(selectors);

            const targets = selectors
                .map((selectorSpec, idx) => {
                    const sel = this.selectorToString(selectorSpec);
                    const el = this.getCachedAutomationElement(selectorSpec);
                    const isOn = compiledSelectors[idx].matcher(el);
                    return { sel, el, isOn };
                })
                .filter((x): x is { sel: string; el: HTMLElement; isOn: boolean } => !!x.el);

            const states = targets.map(t => t.isOn);
            const allOn = states.length > 0 && states.every(Boolean);
            const allOff = states.length > 0 && states.every(s => !s);
            return { targets, states, allOn, allOff };
        };

        const updateUIState = () => {
            stateUpdaters.forEach(update => update());
        };

        const requestUpdateUI = () => this.queueAutomationQuickbarRender(updateUIState);

        const addQuickbarToggle = (toggleKey: keyof typeof HSQOLButtons.QUICKBAR_CONFIG) => {
            const config = HSQOLButtons.QUICKBAR_CONFIG[toggleKey];

            if (config.kind === 'syn') {
                const compiledChecks = config.checks.map(spec => ({
                    spec,
                    matcher: this.getCompiledSelectorMatcher(spec)
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
                    const target = this.getCachedAutomationElement(config.actionDOM);
                    if (target) {
                        try { target.click(); } catch (e) { HSLogger.log(`Failed to click target ${config.actionDOM}: ${e}`, this.context); }
                    } else {
                        HSLogger.log(`Target element for ${toggleKey} not found: ${config.actionDOM}`, this.context);
                    }
                    requestUpdateUI();
                });

                stateUpdaters.push(() => {
                    const checkStates = compiledChecks.map(({ spec, matcher }) => {
                        const el = this.getCachedAutomationElement(spec);
                        return matcher(el);
                    });

                    const enabled = checkStates.length > 0 && checkStates.every(Boolean);
                    btn.classList.remove('enabled', 'disabled', 'mixed');
                    btn.classList.add(enabled ? 'enabled' : 'disabled');
                    btn.disabled = checkStates.length === 0;
                });

                left.appendChild(btn);
                return;
            }

            const btn = this.#createGroupButton(
                config.selectors,
                config.label,
                config.label,
                config.iconSrc,
                requestUpdateUI
            );
            btn.id = config.buttonId;

            stateUpdaters.push(() => {
                const { targets, allOn, allOff } = getGroupState(config.selectors);
                setButtonState(btn, targets.length, allOn, allOff);
            });

            left.appendChild(btn);
        };

        for (const item of HSQOLButtons.QUICKBAR_RENDER_ORDER) {
            addQuickbarToggle(item);
        }

        updateUIState();

        // Register MutationObserver watchers for all tracked elements
        this.#registerAutomationQuickBarWatchers(requestUpdateUI);
        setTimeout(requestUpdateUI, 10);
    }

    #clearAutomationQuickBarWatchers(): void {
        for (const watcherId of this.automationQuickBarObservers) {
            HSElementHooker.stopWatching(watcherId);
        }
        this.automationQuickBarObservers = [];
    }

    /** Cleanup observers/render queue/container for the automation quickbar. */
    #teardownAutomationQuickbar(): void {
        if (this.#queuedAutomationFrameId !== null) {
            window.cancelAnimationFrame(this.#queuedAutomationFrameId);
            this.#queuedAutomationFrameId = null;
        }
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
    #createGroupButton(
        selectors: readonly AutomationSelectorSpec[],
        title: string,
        ariaLabel: string,
        iconSrc: string,
        updateUI: () => void
    ): HTMLButtonElement {
        const compiledSelectors = selectors.map(selectorSpec => ({
            selectorSpec,
            matcher: this.getCompiledSelectorMatcher(selectorSpec)
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
                    const el = this.getCachedAutomationElement(selectorSpec);
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

    /** Register MutationObserver watchers for all syn UI tracked elements. */
    #registerAutomationQuickBarWatchers(updateUI: () => void): void {
        const watchOpts = { childList: true, subtree: false, overrideThrottle: true, characterData: true };

        const allSelectorSet = new Set<string>();
        const configs = Object.values(HSQOLButtons.QUICKBAR_CONFIG) as readonly QuickbarToggleConfig[];

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

        const allSelectors = Array.from(allSelectorSet);

        for (const sel of allSelectors) {
            try {
                const el = this.getCachedAutomationElement(sel);
                if (!el) continue;
                const id = HSElementHooker.watchElement(el, () => updateUI(), watchOpts);
                if (id) this.automationQuickBarObservers.push(id as string);
            } catch (e) {
                HSLogger.log(`Error setting watcher for ${sel}: ${e}`, this.context);
            }
        }
    }

    // Public API for settings action
    showAutomationQuickBar(): void {
        // No-op: quickbar is now managed by HSQuickbarManager
    }

    // Deprecated: hideAutomationQuickBar is now managed by HSQuickbarManager
    hideAutomationQuickBar(): void {
        // No-op: quickbar is now managed by HSQuickbarManager
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

    setGQButtonsVisibility(): void {
        const hideMaxedGQUpgradesSetting = HSSettings.getSetting('hideMaxedGQUpgrades') as HSSetting<boolean>;

        if (hideMaxedGQUpgradesSetting.getValue()) {
            this.#disableGQButtons();
        } else {
            this.#enableGQButtons();
        }
    }

    setOctButtonsVisibility(): void {
        const hideMaxedOctUpgradesSetting = HSSettings.getSetting('hideMaxedOctUpgrades') as HSSetting<boolean>;

        if (hideMaxedOctUpgradesSetting.getValue()) {
            this.#disableOctButtons();
        } else {
            this.#enableOctButtons();
        }
    }

    #enableButtons(containerId: string, selector: string): void {
        const container = document.getElementById(containerId);
        if (!container) return;

        const buttons = container.querySelectorAll<HTMLButtonElement>(selector);
        buttons.forEach(button => button.style.display = '');
    }

    #enableOctButtons(): void {
        this.#enableButtons('singularityOcteracts', '.octeractUpgrade');
    }

    #enableGQButtons(): void {
        this.#enableButtons('actualSingularityUpgradeContainer', '.singularityUpgrade');
    }

    #disableOctButtons(): void {
        const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        if (!gameDataAPI) return;
        const gameData = gameDataAPI.getGameData();
        if (!gameData) return;

        const container = document.getElementById('singularityOcteracts');
        if (!container) return;

        const buttons = Array.from(
            container.querySelectorAll<HTMLElement>('.octeractUpgrade')
        );

        for (const button of buttons) {
            const upgradeKey = button.id as OcteractUpgradeKey;
            const maxLevel = octeractUpgradeMaxLevels[upgradeKey]?.maxLevel;
            const currentLevel = gameData.octUpgrades[upgradeKey]?.level ?? 0;

            if (maxLevel !== undefined && maxLevel !== -1 && currentLevel >= maxLevel) {
                button.style.display = 'none';
            } else {
                button.style.display = '';
            }
        }
    }

    #disableGQButtons(): void {
        const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        if (!gameDataAPI) return;
        const gameData = gameDataAPI.getGameData();
        if (!gameData) return;

        const container = document.getElementById('actualSingularityUpgradeContainer');
        if (!container) return;

        const buttons = Array.from(
            container.querySelectorAll<HTMLElement>('.singularityUpgrade')
        );

        for (const button of buttons) {
            const upgradeKey = button.id as GoldenQuarkUpgradeKey;
            const maxLevel = goldenQuarkUpgradeMaxLevels[upgradeKey]?.maxLevel;
            const currentLevel = gameData.goldenQuarkUpgrades[upgradeKey]?.level ?? 0;

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
            let totalRatio = 0;
            const ratios: { [key: string]: number } = {};

            for (const id in inputs) {
                const val = parseFloat(inputs[id].value) || 0;
                if (val > 0) {
                    ratios[id] = val;
                    totalRatio += val;
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

            if (totalRatio === 0) return;

            if (!promptInput || !okPrompt || !okAlert) return;

            distributeBtn.disabled = true;
            distributeBtn.style.opacity = '0.6';
            distributeBtn.style.cursor = 'not-allowed';

            const ids = Object.keys(ratios);
            let current = 0;

            for (const id in ratios) {
                current++;
                const amountToSpend = Math.floor(totalGQ * (ratios[id] / totalRatio));
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

    /** Public wrapper to call the private setup method for Automation Quickbar. */
    public setupAutomationQuickbarWrapper(): void {
        this.#setupAutomationQuickbar();
    }

    /** Public wrapper to cleanup observers/raf for Automation Quickbar. */
    public teardownAutomationQuickbarWrapper(): void {
        this.#teardownAutomationQuickbar();
    }

}