import { HSModuleOptions } from "../../types/hs-types";
import { ETalismanFragmentIndex } from "../../types/module-types/hs-talismans-types";
import { HSElementHooker } from "../hs-core/hs-elementhooker";
import { HSLogger } from "../hs-core/hs-logger";
import { HSModule } from "../hs-core/module/hs-module";
import { HSSettings } from "../hs-core/settings/hs-settings";

/*
    Class: HSTalismans
    IsExplicitHSModule: Yes
    Description: 
        Hypersynergism module which adds an enhanced "Cycle BUY" button next to the vanilla talisman "Buy All" button that cycles through fragments
    Author: Swiffy
*/
export class HSTalismans extends HSModule {
    #talismanBuyButtons : HTMLButtonElement[] = []; 
    #buyAllButton? : Element;
    #enhancedButton?: HTMLButtonElement;

    #currentButtonIndex = ETalismanFragmentIndex.BLUE;

    #indexResetTimeout: number | null = null;
    #indexResetTimeoutTime = 3000;

    // Mapping from enum values to display names
    #fragmentNames = ['Yellow', 'White', 'Green', 'Blue', 'Purple', 'Orange', 'Red'];
    
    // Mapping from enum values to colors
    #fragmentColors = ['#ffff00', '#ffffff', '#32cd32', '#008b8b', '#dda0dd', '#ffa500', '#ed143d'];

    constructor(moduleOptions : HSModuleOptions) {
        super(moduleOptions);
    }

    #updateButtonText() {
        if (this.#enhancedButton) {
            const nextFragment = this.#fragmentNames[this.#currentButtonIndex];
            const nextColor = this.#fragmentColors[this.#currentButtonIndex];
            this.#enhancedButton.innerHTML = `Cycle BUY<br>(Next: <span style="color: ${nextColor};">${nextFragment}</span>)`;
        }
    }

    async init(): Promise<void> {
        const self = this;

        HSLogger.log("Initialising HSTalismans module", this.context);
        
        const enableTalismansSetting = HSSettings.getSetting('enableTalismansModule');
        if (!enableTalismansSetting || !enableTalismansSetting.isEnabled()) {
            HSLogger.log("HSTalismans module is disabled via settings", this.context);
            this.isInitialized = true;
            return;
        }
        
        this.#buyAllButton = await HSElementHooker.HookElement('#buyTalismanAll') as HTMLButtonElement;
        this.#talismanBuyButtons = await HSElementHooker.HookElements('.fragmentBtn') as HTMLButtonElement[];

        // Create a new enhanced "Cycle BBUY" button next to the vanilla one
        const enhancedBuyAllButton = document.createElement('button');
        enhancedBuyAllButton.id = 'hs-enhanced-buy-talisman-all';
        this.#enhancedButton = enhancedBuyAllButton;
        enhancedBuyAllButton.className = this.#buyAllButton.className; // Keep the class for any CSS rules
        
        // Copy all styling from the vanilla button
        const vanillaStyle = window.getComputedStyle(this.#buyAllButton);
        enhancedBuyAllButton.style.cssText = vanillaStyle.cssText;
        
        // Override specific properties for proper alignment and spacing
        enhancedBuyAllButton.style.verticalAlign = 'baseline'; // Ensure vertical alignment
        enhancedBuyAllButton.style.border = '2px solid white';
        enhancedBuyAllButton.style.padding = '4px';

        // Set initial text
        this.#updateButtonText();

        // Insert the new button after the vanilla button
        this.#buyAllButton.parentNode?.insertBefore(enhancedBuyAllButton, this.#buyAllButton.nextSibling);

        enhancedBuyAllButton.addEventListener('click', (e) => {
            if(self.#indexResetTimeout)
                clearTimeout(self.#indexResetTimeout);

            if(self.#talismanBuyButtons.length === 0) return;
            
            self.#talismanBuyButtons[self.#currentButtonIndex].click();
            self.#currentButtonIndex++;

            if(self.#currentButtonIndex > self.#talismanBuyButtons.length - 1) {
                self.#currentButtonIndex = 0;
            }

            // Update button text to show next fragment
            self.#updateButtonText();

            self.#indexResetTimeout = setTimeout(() => {
                self.#currentButtonIndex = ETalismanFragmentIndex.BLUE;
                self.#updateButtonText();
            }, self.#indexResetTimeoutTime);
        });

        HSLogger.log("Fragments 'Cycle BUY' button added next to vanilla button", this.context);
        this.isInitialized = true;
    }
}
