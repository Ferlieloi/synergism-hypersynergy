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


/*
    Class: QOLButtons
    IsExplicitHSModule: Yes
    Description: 
        Hypersynergism module which adds qol buttons to the game.
    Author: Swiffy and XxmolkxX and creator of original autosing script
*/

export class HSQOLButtons extends HSModule {
    #offeringPotion: HTMLElement | null;
    #obtainiumPotion: HTMLElement | null;

    #config: MutationObserverInit;

    #offeringPotionObserver: MutationObserver;
    #obtainiumPotionObserver: MutationObserver;

    octUpgradesInitialized: boolean = false;
    gqUpgradesInitialized: boolean = false;

    constructor(moduleOptions: HSModuleOptions) {
        super(moduleOptions);

        this.#offeringPotion = document.getElementById("offeringPotionHide");
        this.#obtainiumPotion = document.getElementById("obtainiumPotionHide");
        this.#config = { attributes: false, childList: true, subtree: true };

        this.#offeringPotionObserver = new MutationObserver((mutations, observer) => {
            this.#offeringMutationTrigger(mutations, observer);
        });

        this.#obtainiumPotionObserver = new MutationObserver((mutations, observer) => {
            this.#obtainiumMutationTrigger(mutations, observer);
        });
    }

    async init(): Promise<void> {
        HSLogger.log("Initialising HSPotions module", this.context);
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
    }

    observe() {
        this.#offeringPotionObserver.observe(this.#offeringPotion as Node, this.#config);
        this.#obtainiumPotionObserver.observe(this.#obtainiumPotion as Node, this.#config);
    }

    #offeringMutationTrigger(mutations: MutationRecord[], observer: MutationObserver) {
        const moddedButton = document.getElementById("offeringPotionMultiUseButton");

        if (moddedButton === null) {
            const useOfferingPotionButton = document.getElementById("useofferingpotion");
            const buyOfferingPotionButton = document.getElementById("buyofferingpotion");

            if (!useOfferingPotionButton || !buyOfferingPotionButton) {
                HSLogger.warn("Could not find native buttons for use/buy offering potions", this.context);
                return;
            }

            if (useOfferingPotionButton) {
                let clone = useOfferingPotionButton.cloneNode(true) as HTMLElement;

                clone.id = "offeringPotionMultiUseButton";
                clone.textContent = "CONSUME 10x";

                clone.addEventListener('click', () => {
                    for (let i = 0; i < 10; i++) {
                        useOfferingPotionButton.click();
                    }
                })

                useOfferingPotionButton.parentNode?.insertBefore(clone, useOfferingPotionButton.nextSibling);
            }

            if (buyOfferingPotionButton) {
                let clone2 = buyOfferingPotionButton.cloneNode(true) as HTMLElement;

                clone2.id = "offeringPotionMultiBuyButton";
                clone2.textContent = "BUY 10x";

                clone2.addEventListener('click', () => {
                    for (let i = 0; i < 10; i++) {
                        buyOfferingPotionButton.click();
                        setTimeout(() => { document.getElementById("ok_confirm")?.click(); }, 1);
                    }
                })

                buyOfferingPotionButton.parentNode?.insertBefore(clone2, buyOfferingPotionButton.nextSibling);
            }

            this.#offeringPotionObserver.disconnect();
            HSLogger.log("Offering potion multi buy / consume buttons injected", this.context);
        }
    };

    #obtainiumMutationTrigger(mutations: MutationRecord[], observer: MutationObserver) {
        const moddedButton = document.getElementById("obtainiumPotionMultiUseButton");

        if (moddedButton === null) {
            const useObtainiumPotionButton = document.getElementById("useobtainiumpotion");
            const buyObtainiumPotionButton = document.getElementById("buyobtainiumpotion");

            if (!useObtainiumPotionButton || !buyObtainiumPotionButton) {
                HSLogger.warn("Could not find native buttons for use/buy obtainium potions", this.context);
                return;
            }

            if (useObtainiumPotionButton) {
                let clone = useObtainiumPotionButton.cloneNode(true) as HTMLElement;

                clone.id = "obtainiumPotionMultiUseButton";
                clone.textContent = "CONSUME 10x";

                clone.addEventListener('click', () => {
                    for (let i = 0; i < 10; i++) {
                        useObtainiumPotionButton.click();
                    }
                })

                useObtainiumPotionButton.parentNode?.insertBefore(clone, useObtainiumPotionButton.nextSibling);
            }

            if (buyObtainiumPotionButton) {
                let clone2 = buyObtainiumPotionButton.cloneNode(true) as HTMLElement;

                clone2.id = "obtainiumPotionMultiBuyButton";
                clone2.textContent = "BUY 10x";

                clone2.addEventListener('click', () => {
                    for (let i = 0; i < 10; i++) {
                        buyObtainiumPotionButton.click();
                        setTimeout(() => { document.getElementById("ok_confirm")?.click(); }, 1);
                    }
                })

                buyObtainiumPotionButton.parentNode?.insertBefore(clone2, buyObtainiumPotionButton.nextSibling);
            }

            this.#obtainiumPotionObserver.disconnect();
            HSLogger.log("Obtainium potion multi buy / consume buttons injected", this.context);
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
            display: 'flex',
            width: '100%',
            gap: '0',
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