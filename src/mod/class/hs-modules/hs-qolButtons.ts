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
                // Small delay to ensure DOM is fully rendered
                setTimeout(() => {
                    this.setGQButtonsVisibility();
                }, 50);
            }
        });

        // Also run immediately if we're already on the shop tab
        const currentView = gameState.getCurrentUIView<SingularityView>('SINGULARITY_VIEW');
        if (currentView.getId() === SINGULARITY_VIEW.SHOP) {
            setTimeout(() => {
                this.disableGQButtons();
            }, 100);
        }
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

    setGQButtonsVisibility(): void {
        const hideMaxedGQUpgradesSetting = HSSettings.getSetting('hideMaxedGQUpgrades') as HSSetting<boolean>;
        if (hideMaxedGQUpgradesSetting.getValue()) {
            this.disableGQButtons();
        } else {
            this.enableGQButtons();
        }
    }

    enableGQButtons(): void {
        const container = document.getElementById('actualSingularityUpgradeContainer');
        if (!container) {
            return;
        }

        const buttons = container.querySelectorAll<HTMLButtonElement>(
            '.singularityUpgrade'
        );

        for (const button of buttons) {
            button.style.display = '';
        }
    }

    disableGQButtons(): void {
        const container = document.getElementById('actualSingularityUpgradeContainer');
        if (!container) return;

        const buttons = container.querySelectorAll<HTMLButtonElement>('.singularityUpgrade');

        if (buttons.length === 0) return;

        // Trigger hover to apply filters
        const mouseOverEvent = new MouseEvent('mouseover', {
            bubbles: true,
            cancelable: true,
            view: window
        });

        buttons[0].dispatchEvent(mouseOverEvent);

        // Give it time for the CSS to actually apply
        setTimeout(() => {
            for (const button of buttons) {
                const filter = button.style.filter || '';
                console.log('Button filter:', filter, 'ID:', button.id);

                // Only hide if we actually got a filter applied AND it doesn't have invert
                // Maxed buttons will have brightness() without invert()
                if (filter && filter !== 'none' && filter !== '' && !filter.includes('invert')) {
                    console.log('Hiding button:', button.id);
                    button.style.display = 'none';
                }
            }

            // Clean up hover state
            const mouseOutEvent = new MouseEvent('mouseout', {
                bubbles: true,
                cancelable: true,
                view: window
            });
            buttons[0].dispatchEvent(mouseOutEvent);
        }, 100); // Give it 50ms for the CSS to apply
    }
}
