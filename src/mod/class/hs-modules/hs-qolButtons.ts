import { HSModuleOptions } from "../../types/hs-types";
import { SINGULARITY_VIEW } from "../../types/module-types/hs-gamestate-types";
import { HSGameState, SingularityView } from "../hs-core/hs-gamestate";
import { HSGlobal } from "../hs-core/hs-global";
import { HSLogger } from "../hs-core/hs-logger";
import { HSModule } from "../hs-core/module/hs-module";
import { HSModuleManager } from "../hs-core/module/hs-module-manager";
import { HSElementHooker } from "../hs-core/hs-elementhooker";
import { HSSettings } from "../hs-core/settings/hs-settings";
import { HSSetting } from "../hs-core/settings/hs-setting";
import { HSUtils } from "../hs-utils/hs-utils";
import { HSSettingsDefinition } from "../../types/module-types/hs-settings-types";


/*
    Class: QOLButtons
    IsExplicitHSModule: Yes
    Description: 
        Hypersynergism module which adds qol buttons to the game.
    Author: Swiffy, XxmolkxX, the creator of original autosing script (httpsnet?) (hide gq/oct buttons) and Core (syn UI bar)
*/

export class HSQOLButtons extends HSModule {
    static SYN_UI_SETTING_KEY: keyof HSSettingsDefinition = 'enableAutomationQuickBar';

    // Shared selector arrays for cube & hepteract groups
    private static readonly CUBE_SELECTORS = [
        '#openCubes',
        '#openTesseracts',
        '#openHypercubes',
        '#openPlatonicCube',
        '#toggleAutoCubeUpgrades',
        '#toggleAutoPlatonicUpgrades'
    ];

    private static readonly HEPTERACT_SELECTORS = [
        '#chronosHepteractAuto',
        '#hyperrealismHepteractAuto',
        '#challengeHepteractAuto',
        '#abyssHepteractAuto',
        '#acceleratorHepteractAuto',
        '#acceleratorBoostHepteractAuto',
        '#multiplierHepteractAuto',
        '#hepteractToQuarkTradeAuto'
    ];

    private static readonly RUNE_SELECTORS = [
        '#toggleautosacrifice',
        '#toggleautoBuyFragments',
        '#toggleautofortify',
        '#toggle36',
        '#toggle37'
    ];

    // Syn UI toggle definitions — order determines button order in the bar
    private static readonly SYN_UI_TOGGLES: { key: string; DOM: string; innerHTMLwhenON?: string; icon?: string }[] = [
        { key: 'Challenge', DOM: '#toggleAutoChallengeStart', innerHTMLwhenON: 'Auto Challenge Sweep [ON]', icon: 'Challenge1.png' },
        { key: 'Research', DOM: '#toggleautoresearch', innerHTMLwhenON: 'Automatic: ON', icon: 'Obtainium.png' },
        { key: 'ManualResearch', DOM: '#toggleautoresearchmode', innerHTMLwhenON: 'Automatic mode: Cheapest' },
        { key: 'Anthill', DOM: '#toggleAutoSacrificeAnt', innerHTMLwhenON: 'Auto Sacrifice: ON', icon: 'AntSacrifice.png' }
    ];

    // syn UI container (header bar)
    automationQuickBarContainer: HTMLDivElement | null = null;
    automationQuickBarObservers: string[] = [];

    #offeringPotion: HTMLElement | null;
    #obtainiumPotion: HTMLElement | null;
    #config: MutationObserverInit;
    #offeringPotionObserver: MutationObserver;
    #obtainiumPotionObserver: MutationObserver;

    octUpgradesInitialized: boolean = false;
    gqUpgradesInitialized: boolean = false;

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
    }

    /** Inject a compact syn UI bar into the header showing automation toggles. */
    injectAutomationQuickBar(): void {
        if (this.automationQuickBarContainer) return;

        // Create an overlay container fixed to the viewport bottom.
        const container = document.createElement('div');
        container.id = 'automationQuickBar';
        document.body.appendChild(container);
        this.automationQuickBarContainer = container as HTMLDivElement;

        const updateUI = () => {
            if (!this.automationQuickBarContainer) return;

            const left = document.createElement('span');
            left.className = 'left';

            // --- Individual toggle buttons (Challenge → Rune → Research → Ants) ---
            for (const t of HSQOLButtons.SYN_UI_TOGGLES) {
                const el = document.querySelector(t.DOM) as HTMLElement | null;
                const enabled = el
                    ? (t.innerHTMLwhenON ? (el.innerHTML === t.innerHTMLwhenON) : this.isElementOn(el))
                    : false;

                // ManualResearch is hidden when already enabled
                if (t.key === 'ManualResearch' && enabled) continue;

                const btn = document.createElement('button');
                btn.className = 'autoToggle ' + (enabled ? 'enabled' : 'disabled');

                if (t.icon) {
                    const img = document.createElement('img');
                    img.src = './Pictures/Simplified/' + t.icon;
                    img.loading = 'lazy';
                    btn.appendChild(img);
                }

                btn.title = t.key;
                btn.setAttribute('aria-label', t.key);
                btn.addEventListener('click', () => {
                    const target = document.querySelector(t.DOM) as HTMLElement | null;
                    if (target) {
                        try { target.click(); } catch (e) { HSLogger.log(`Failed to click target ${t.DOM}: ${e}`, this.context); }
                    } else {
                        HSLogger.log(`Target element for ${t.key} not found: ${t.DOM}`, this.context);
                    }
                    updateUI();
                });

                left.appendChild(btn);

                if (t.key === 'Challenge') {
                    // --- Rune combined group button placed where Rune used to be ---
                    left.appendChild(this.#createGroupButton(
                        HSQOLButtons.RUNE_SELECTORS,
                        'Runes: Auto/Fragments/Fortify/36/37',
                        'Rune toggles',
                        './Pictures/Simplified/Offering.png',
                        updateUI
                    ));
                }
            }

            // --- Cubes combined group button ---
            left.appendChild(this.#createGroupButton(
                HSQOLButtons.CUBE_SELECTORS,
                'Cubes/Tesseracts/Hypercubes/Platonic',
                'Cube toggles',
                './Pictures/Default/TinyWow3.png',
                updateUI
            ));

            // --- Hepteracts combined group button ---
            left.appendChild(this.#createGroupButton(
                HSQOLButtons.HEPTERACT_SELECTORS,
                'Hepteracts',
                'Hepteract toggles',
                './Pictures/Default/TinyWow7.png',
                updateUI
            ));

            const center = document.createElement('span');
            center.className = 'center';
            const right = document.createElement('span');
            right.className = 'right';

            this.automationQuickBarContainer.innerHTML = '';
            this.automationQuickBarContainer.appendChild(left);
            this.automationQuickBarContainer.appendChild(center);
            this.automationQuickBarContainer.appendChild(right);
        };

        // Register MutationObserver watchers for all tracked elements
        this.#registerAutomationQuickBarWatchers(updateUI);

        setTimeout(updateUI, 10);
    }

    /**
     * Create a combined group toggle button for a set of selectors.
     * Clicking toggles all targets on/off as a group.
     */
    #createGroupButton(
        selectors: readonly string[],
        title: string,
        ariaLabel: string,
        iconSrc: string,
        updateUI: () => void
    ): HTMLButtonElement {
        const btn = document.createElement('button');
        btn.className = 'autoToggle';
        btn.title = title;
        btn.setAttribute('aria-label', ariaLabel);

        const img = document.createElement('img');
        img.src = iconSrc;
        img.loading = 'lazy';
        btn.appendChild(img);

        const getTargets = () =>
            selectors
                .map(sel => ({ sel, el: this.resolveAutomationQuickBarElement(sel) }))
                .filter(x => x.el);

        const getState = () => {
            const targets = getTargets();
            const states = targets.map(t => this.isElementOn(t.el));
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

            setTimeout(updateUI, 10);
        });

        return btn;
    }

    /** Register MutationObserver watchers for all syn UI tracked elements. */
    #registerAutomationQuickBarWatchers(updateUI: () => void): void {
        const watchOpts = { childList: true, subtree: false, overrideThrottle: true, characterData: true };

        const allSelectors = [
            ...HSQOLButtons.CUBE_SELECTORS,
            ...HSQOLButtons.HEPTERACT_SELECTORS,
            ...HSQOLButtons.RUNE_SELECTORS,
            ...HSQOLButtons.SYN_UI_TOGGLES.map(t => t.DOM)
        ];

        for (const sel of allSelectors) {
            try {
                const el = this.resolveAutomationQuickBarElement(sel);
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
        if (!this.automationQuickBarContainer) {
            this.injectAutomationQuickBar();
        } else {
            // Already present; ensure visible
            this.automationQuickBarContainer.style.display = '';
        }
    }

    hideAutomationQuickBar(): void {
        // Disconnect observers
        for (const id of this.automationQuickBarObservers) {
            try { HSElementHooker.stopWatching(id); } catch (e) { HSLogger.log(`Error stopping automationQuickBar watcher ${id}: ${e}`, this.context); }
        }
        this.automationQuickBarObservers = [];

        // Remove container
        if (this.automationQuickBarContainer && this.automationQuickBarContainer.parentNode) {
            this.automationQuickBarContainer.parentNode.removeChild(this.automationQuickBarContainer);
        }
        this.automationQuickBarContainer = null;

    }

    observe() {
        this.#offeringPotionObserver.observe(this.#offeringPotion as Node, this.#config);
        this.#obtainiumPotionObserver.observe(this.#obtainiumPotion as Node, this.#config);
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
            HSUtils.sleep(3);
            HSUtils.stopDialogWatcher();
        });

        // Create new container for all buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.id = 'hs-button-container';

        Object.assign(buttonContainer.style, {
            display: 'inline-flex',
            width: 'auto',
            maxWidth: '100%',
            gap: '0',
            flexWrap: 'nowrap',
            alignItems: 'stretch',
        });

        // Style each button to take 25% width
        [addBtn, addAllBtn, add10Btn, addOneBtn].forEach(btn => {
            Object.assign(btn.style, {
                flex: '1',
                minWidth: '0',
            });
        });

        buttonContainer.append(addBtn, addAllBtn, add10Btn, addOneBtn);

        container.innerHTML = '';
        container.appendChild(buttonContainer);
    }

    setGQButtonsVisibility(): void {
        if (this.gqUpgradesInitialized) {
            return;
        }

        this.gqUpgradesInitialized = true;
        const hideMaxedGQUpgradesSetting = HSSettings.getSetting('hideMaxedGQUpgrades') as HSSetting<boolean>;

        if (hideMaxedGQUpgradesSetting.getValue()) {
            this.#disableGQButtons();
        } else {
            this.#enableGQButtons();
        }
    }

    setOctButtonsVisibility(): void {
        if (this.octUpgradesInitialized) {
            return;
        }

        this.octUpgradesInitialized = true;
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

    async #disableButtons(containerId: string, selector: string): Promise<void> {
        const container = document.getElementById(containerId);
        if (!container) return;

        const buttons = Array.from(
            container.querySelectorAll<HTMLElement>(selector)
        );

        for (const button of buttons) {
            this.hoverElement(button);

            // Give modal time to appear & populate
            await HSUtils.sleep(5);

            const modal = document.getElementById('modal') as HTMLDivElement | null;
            if (!modal) {
                this.unhoverElement(button);
                continue;
            }

            const levelSpan = this.findLevelSpan(modal);

            if (!levelSpan) {
                this.unhoverElement(button);
                continue;
            }

            const text = levelSpan.textContent ?? '';

            const match = text.match(/level\s+([\d,]+)(?:\s*\/\s*([\d,]+))?/i);
            if (!match) {
                this.unhoverElement(button);
                continue;
            }

            const current = this.parseNumber(match[1]);
            const max = match[2] ? this.parseNumber(match[2]) : null;

            // Infinite upgrade → don't hide
            if (max === null) {
                this.unhoverElement(button);
                continue;
            }

            // Maxed upgrade → hide
            if (current === max) {
                console.log('Hiding maxed upgrade:', button.id);
                button.style.display = 'none';
            }

            this.unhoverElement(button);
            await HSUtils.sleep(1);
        }
    }

    parseNumber(value: string): number {
        return Number(value.replace(/,/g, ''));
    }

    hoverElement(el: HTMLElement) {
        const rect = el.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        const events = [
            new PointerEvent('pointermove', { bubbles: true, clientX: x, clientY: y }),
            new PointerEvent('pointerenter', { bubbles: true, clientX: x, clientY: y }),
            new MouseEvent('mouseenter', { bubbles: true, clientX: x, clientY: y }),
            new MouseEvent('mouseover', { bubbles: true, clientX: x, clientY: y }),
            new MouseEvent('mousemove', { bubbles: true, clientX: x, clientY: y })
        ];

        events.forEach(e => el.dispatchEvent(e));
    }

    findLevelSpan(modal: HTMLElement): HTMLSpanElement | null {
        const spans = Array.from(modal.querySelectorAll<HTMLSpanElement>('span'));
        for (const span of spans) {
            const text = span.textContent?.trim();
            if (!text) continue;
            const hasLevelNumbers = /(\d{1,3}(?:,\d{3})*)(?:\s*\/\s*(\d{1,3}(?:,\d{3})*))/.test(text)
                || /\blevel\s+\d{1,3}(?:,\d{3})*/i.test(text);

            if (!hasLevelNumbers) continue;
            if (text.length > 100) continue;
            return span;
        }
        return null;
    }

    unhoverElement(el: HTMLElement) {
        const rect = el.getBoundingClientRect();
        const x = rect.left - 10;
        const y = rect.top - 10;

        el.dispatchEvent(new MouseEvent('mouseout', {
            bubbles: true,
            clientX: x,
            clientY: y
        }));
    }

    #enableOctButtons(): void {
        this.#enableButtons('singularityOcteracts', '.octeractUpgrade');
    }

    #enableGQButtons(): void {
        this.#enableButtons('actualSingularityUpgradeContainer', '.singularityUpgrade');
    }

    #disableOctButtons(): void {
        this.#disableButtons('singularityOcteracts', '.octeractUpgrade');
    }

    #disableGQButtons(): void {
        this.#disableButtons('actualSingularityUpgradeContainer', '.singularityUpgrade');
    }
}