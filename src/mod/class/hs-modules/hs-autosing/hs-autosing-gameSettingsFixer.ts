import { HSModuleOptions } from '../../../types/hs-types';
import { HSModule } from '../../hs-core/module/hs-module';
import { HSLogger } from '../../hs-core/hs-logger';

/**
 * Class: HSAutosingGameSettingsFixer
 * Description: Automates, corrects, and manages game settings for AutoSing.
 * Author: Copilot (based on HSQOLButtons)
 */
export class HSAutosingGameSettingsFixer extends HSModule {
    /**
     * List of toggle requirements: selector and expected text.
     * Each entry specifies a selector and the text that should be present when ON.
     */
    private static readonly TOGGLE_REQUIREMENTS: Array<{ selector: string, expected: string }> = [
        // Buildings
        { selector: '#toggle1.auto.autobuyerToggleButton', expected: 'Auto [ON]' },
        { selector: '#toggle2.auto.autobuyerToggleButton', expected: 'Auto [ON]' },
        { selector: '#toggle3.auto.autobuyerToggleButton', expected: 'Auto [ON]' },
        { selector: '#toggle4.auto.autobuyerToggleButton', expected: 'Auto [ON]' },
        { selector: '#toggle5.auto.autobuyerToggleButton', expected: 'Auto [ON]' },
        { selector: '#toggle6.auto.autobuyerToggleButton', expected: 'Auto [ON]' },
        { selector: '#toggle7.auto.autobuyerToggleButton', expected: 'Auto [ON]' },
        { selector: '#toggle8.auto.autobuyerToggleButton', expected: 'Auto [ON]' },
        { selector: '#toggle10.auto.autobuyerToggleButton', expected: 'Auto [ON]' },
        { selector: '#toggle11.auto.autobuyerToggleButton', expected: 'Auto [ON]' },
        { selector: '#toggle12.auto.autobuyerToggleButton', expected: 'Auto [ON]' },
        { selector: '#toggle13.auto.autobuyerToggleButton', expected: 'Auto [ON]' },
        { selector: '#toggle14.auto.autobuyerToggleButton', expected: 'Auto [ON]' },
        { selector: '#toggle16.auto.autobuyerToggleButton', expected: 'Auto [ON]' },
        { selector: '#toggle17.auto.autobuyerToggleButton', expected: 'Auto [ON]' },
        { selector: '#toggle18.auto.autobuyerToggleButton', expected: 'Auto [ON]' },
        { selector: '#toggle19.auto.autobuyerToggleButton', expected: 'Auto [ON]' },
        { selector: '#toggle20.auto.autobuyerToggleButton', expected: 'Auto [ON]' },
        { selector: '#toggle22.auto.autobuyerToggleButton', expected: 'Auto [ON]' },
        { selector: '#toggle23.auto.autobuyerToggleButton', expected: 'Auto [ON]' },
        { selector: '#toggle24.auto.autobuyerToggleButton', expected: 'Auto [ON]' },
        { selector: '#toggle25.auto.autobuyerToggleButton', expected: 'Auto [ON]' },
        { selector: '#toggle26.auto.autobuyerToggleButton', expected: 'Auto [ON]' },
        { selector: '#tesseractAutoToggle1.auto.autobuyerToggleButton', expected: 'Auto [ON]' },
        { selector: '#tesseractAutoToggle2.auto.autobuyerToggleButton', expected: 'Auto [ON]' },
        { selector: '#tesseractAutoToggle3.auto.autobuyerToggleButton', expected: 'Auto [ON]' },
        { selector: '#tesseractAutoToggle4.auto.autobuyerToggleButton', expected: 'Auto [ON]' },
        { selector: '#tesseractAutoToggle5.auto.autobuyerToggleButton', expected: 'Auto [ON]' },
        { selector: '#toggle15.auto', expected: 'Auto Prestige [OFF]' },
        { selector: '#toggle21.auto', expected: 'Auto Transcend [OFF]' },
        { selector: '#toggle27.auto', expected: 'Auto Reincarnate [OFF]' },
        { selector: '#tesseractautobuytoggle', expected: 'Auto Buy: ON' },
        { selector: '#tesseractautobuymode', expected: 'Mode: PERCENTAGE' },
        // Upgrades
        { selector: '#coinAutoUpgrade.autobuyerToggleButton', expected: 'Auto: ON' },
        { selector: '#prestigeAutoUpgrade.autobuyerToggleButton', expected: 'Auto: ON' },
        { selector: '#transcendAutoUpgrade.autobuyerToggleButton', expected: 'Auto: ON' },
        { selector: '#reincarnateAutoUpgrade.autobuyerToggleButton', expected: 'Auto: ON' },
        { selector: '#generatorsAutoUpgrade.autobuyerToggleButton', expected: 'Auto: ON' },
        // Runes
        { selector: '#toggleautosacrifice', expected: 'Auto Rune: ON' },
        { selector: '#toggleautoBuyFragments', expected: 'Auto Buy: ON' },
        { selector: '#toggleautofortify', expected: 'Auto Fortify: ON' },
        { selector: '#toggle36.auto', expected: 'Auto: ON' },
        { selector: '#toggle37.auto', expected: 'Auto: ON' },
        // Challenges
        { selector: '#toggleAutoChallengeStart', expected: 'Auto Challenge Sweep [OFF]' },
        // Researches
        { selector: '#toggleresearchbuy', expected: 'Upgrade: MAX [if possible]' },
        { selector: '#toggleautoresearch', expected: 'Automatic: ON' },
        { selector: '#toggleautoresearchmode', expected: 'Automatic mode: Cheapest' },
        // Ants
        { selector: '#toggleAutoSacrificeAnt', expected: 'Auto Sacrifice: OFF' },
        // Cube
        { selector: '#toggleAutoCubeUpgrades', expected: 'Auto Upgrades: [ON]' },
        { selector: '#toggleAutoPlatonicUpgrades', expected: 'Auto Upgrades: [ON]' },
        // Hepteracts
        { selector: '#chronosHepteractAuto.singularity', expected: 'Auto: ON' },
        { selector: '#hyperrealismHepteractAuto.singularity', expected: 'Auto: ON' },
        { selector: '#quarkHepteractAuto.singularity', expected: 'Auto: OFF' },
        { selector: '#challengeHepteractAuto.singularity', expected: 'Auto: ON' },
        { selector: '#abyssHepteractAuto.singularity', expected: 'Auto: ON' },
        { selector: '#acceleratorHepteractAuto.singularity', expected: 'Auto: ON' },
        { selector: '#acceleratorBoostHepteractAuto.singularity', expected: 'Auto: ON' },
        { selector: '#multiplierHepteractAuto.singularity', expected: 'Auto: ON' },
        { selector: '#hepteractToQuarkTradeAuto.singularity', expected: 'Auto: ON' },
        // Others
        { selector: '#ascensionAutoEnable', expected: 'Auto Ascend [OFF]' },
    ];

    /**
     * List of selectors for elements whose text should end with '%'.
     * Used for open cubes/tesseracts/hypercubes/platonic cubes auto-open toggles.
     */
    private static readonly PERCENT_SUFFIX_ELEMENTS: string[] = [
        '#openCubes.autoOpens',
        '#openTesseracts.autoOpens',
        '#openHypercubes.autoOpens',
        '#openPlatonicCubes.autoOpens',
    ];

    /**
     * List of text fields and their expected values.
     * Each entry specifies a selector and the value to set.
     */
    private static readonly TEXT_FIELD_REQUIREMENTS: Array<{ selector: string, expected: string }> = [
        { selector: '#tesseractAmount.tesseractautobuyamount', expected: '50' },
        { selector: '#buyRuneBlessingInput', expected: '1000000' },
        { selector: '#buyRuneSpiritInput', expected: '1000000' },
        { selector: '#startAutoChallengeTimerInput.research150', expected: '0' },
        { selector: '#exitAutoChallengeTimerInput.research150', expected: '0.2' },
        { selector: '#enterAutoChallengeTimerInput.research150', expected: '0.1' },
        { selector: '#cubeOpensInput.autoOpensInput', expected: '75' },
        { selector: '#tesseractsOpensInput.autoOpensInput', expected: '75' },
        { selector: '#hypercubesOpensInput.autoOpensInput', expected: '75' },
        { selector: '#platonicCubeOpensInput.autoOpensInput', expected: '75' },
    ];

    /**
     * List of selectors for elements that must have style 'background-color: green;'.
     */
    private static readonly GREEN_BUTTONS: string[] = [
        '#coin100k.buyAmountBtn',
        '#crystal100k.buyAmountBtn',
        '#mythos100k.buyAmountBtn',
        '#particle100k.buyAmountBtn',
        '#tesseract100k.buyAmountBtn',
        '#offering100k.buyAmountBtn',
    ];

    /**
     * Constructs the HSAutosingGameSettingsFixer and logs initialization.
     * @param moduleOptions Options for module configuration and context.
     */
    constructor(moduleOptions: HSModuleOptions) {
        super(moduleOptions);
        HSLogger.log('HSAutosingGameSettingsFixer initialized', this.context);
    }

    /**
     * Initialize the fixer: ensure toggles, percent elements, and text fields are correct.
     */
    async init(): Promise<void> {
        this.ensureAllTogglesOn();
        this.ensurePercentSuffixElements();
        this.ensureTextFields();
        this.ensureGreenButtons();
        await this.ensureChallengeAutoStates();
    }

    /**
     * Ensure all toggles are in their required state by checking text and clicking if needed.
     * If the text does not match the expected value, the button is clicked to toggle it.
     */
    public ensureAllTogglesOn(): void {
        for (const req of HSAutosingGameSettingsFixer.TOGGLE_REQUIREMENTS) {
            const el = document.querySelector(req.selector) as HTMLElement | null;
            if (!el) {
                HSLogger.log(`Element not found for selector: ${req.selector}`, this.context);
                continue;
            }
            const text = (el.textContent || '').trim();
            if (text !== req.expected) {
                try {
                    el.click();
                    HSLogger.log(`Clicked ${req.selector} to set to '${req.expected}'.`, this.context);
                    setTimeout(() => {
                        const newText = (el.textContent || '').trim();
                        if (newText !== req.expected) {
                            HSLogger.log(`Failed to set ${req.selector} to '${req.expected}' after click. Current text: '${newText}'`, this.context);
                        }
                    }, 50);
                } catch (e) {
                    HSLogger.log(`Failed to click ${req.selector}: ${e}`, this.context);
                }
            }
        }
    }

    /**
     * Ensure all elements in PERCENT_SUFFIX_ELEMENTS have text ending with '%'.
     * If not, click the element to try to correct it.
     */
    private ensurePercentSuffixElements(): void {
        for (const sel of HSAutosingGameSettingsFixer.PERCENT_SUFFIX_ELEMENTS) {
            const el = document.querySelector(sel) as HTMLElement | null;
            if (!el) {
                HSLogger.log(`Element not found for selector: ${sel}`, this.context);
                continue;
            }
            const text = (el.textContent || '').trim();
            if (!text.endsWith('%')) {
                try {
                    el.click();
                    HSLogger.log(`Clicked ${sel} to set text ending with '%' (was '${text}').`, this.context);
                    setTimeout(() => {
                        const newText = (el.textContent || '').trim();
                        if (!newText.endsWith('%')) {
                            HSLogger.log(`Failed to set ${sel} to text ending with '%' after click. Current text: '${newText}'`, this.context);
                        }
                    }, 50);
                } catch (e) {
                    HSLogger.log(`Failed to click ${sel}: ${e}`, this.context);
                }
            }
        }
    }

    /**
     * Ensure all text fields have their expected value. If not, set the value.
     */
    private ensureTextFields(): void {
        for (const req of HSAutosingGameSettingsFixer.TEXT_FIELD_REQUIREMENTS) {
            const el = document.querySelector(req.selector) as HTMLInputElement | null;
            if (!el) {
                HSLogger.log(`Element not found for selector: ${req.selector}`, this.context);
                continue;
            }
            if (el.value !== req.expected) {
                try {
                    el.value = req.expected;
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    HSLogger.log(`Set ${req.selector} to '${req.expected}'.`, this.context);
                    setTimeout(() => {
                        if (el.value !== req.expected) {
                            HSLogger.log(`Failed to set ${req.selector} to '${req.expected}' after input. Current value: '${el.value}'`, this.context);
                        }
                    }, 50);
                } catch (e) {
                    HSLogger.log(`Failed to set ${req.selector}: ${e}`, this.context);
                }
            }
        }
    }

    /**
     * Ensure all elements in GREEN_BUTTONS have style 'background-color: green;'.
     * If not, set the style attribute accordingly.
     */
    private ensureGreenButtons(): void {
        for (const sel of HSAutosingGameSettingsFixer.GREEN_BUTTONS) {
            const el = document.querySelector(sel) as HTMLElement | null;
            if (!el) {
                HSLogger.log(`Element not found for selector: ${sel}`, this.context);
                continue;
            }
            if (el.style.backgroundColor !== 'green') {
                try {
                    el.click();
                    HSLogger.log(`Clicked ${sel} to set background-color to green.`, this.context);
                    setTimeout(() => {
                        if (el.style.backgroundColor !== 'green') {
                            HSLogger.log(`Failed to set background-color of ${sel} to green after click. Current color: '${el.style.backgroundColor}'`, this.context);
                        }
                    }, 50);
                } catch (e) {
                    HSLogger.log(`Failed to click ${sel}: ${e}`, this.context);
                }
            }
        }
    }

    /**
     * Ensure challenge auto states for challenge 1-15.
     * For 1-10: ON, for 11-15: OFF. Logs all failures and missing elements.
     */
    private async ensureChallengeAutoStates(): Promise<void> {
        // modified to only check 1-10 for now... 11-15 shouldn't be needed...
        for (let i = 1; i <= 10; i++) {
            const challengeSel = `#challenge${i}.challenge`;
            const toggleSel = '#toggleAutoChallengeIgnore';
            const expectedPrefix = `Automatically Run Chal.${i}`;
            const expectedState = i <= 10 ? '[ON]' : '[OFF]';
            const expectedFull = `${expectedPrefix} ${expectedState}`;
            const challengeEl = document.querySelector(challengeSel) as HTMLElement | null;
            const toggleEl = document.querySelector(toggleSel) as HTMLElement | null;
            if (!challengeEl) {
                HSLogger.log(`Challenge element not found: ${challengeSel}`, this.context);
                continue;
            }
            if (!toggleEl) {
                HSLogger.log(`Toggle element not found: ${toggleSel}`, this.context);
                continue;
            }
            try {
                challengeEl.click();
                HSLogger.log(`Clicked ${challengeSel} to select challenge ${i}.`, this.context);
            } catch (e) {
                HSLogger.log(`Failed to click ${challengeSel}: ${e}`, this.context);
                continue;
            }
            // Wait briefly for UI update
            await new Promise(res => setTimeout(res, 50));
            const toggleText = (toggleEl.textContent || '').trim();
            if (!toggleText.startsWith(expectedPrefix)) {
                HSLogger.log(`Toggle text for ${toggleSel} does not start with '${expectedPrefix}' after selecting challenge ${i}. Current text: '${toggleText}'`, this.context);
                continue;
            }
            if (toggleText !== expectedFull) {
                HSLogger.log(`Toggle text for ${toggleSel} is not '${expectedFull}' after selecting challenge ${i}. Current text: '${toggleText}'`, this.context);
                // Try to toggle
                try {
                    toggleEl.click();
                    HSLogger.log(`Clicked ${toggleSel} to set to '${expectedFull}'.`, this.context);
                } catch (e) {
                    HSLogger.log(`Failed to click ${toggleSel}: ${e}`, this.context);
                    continue;
                }
                await new Promise(res => setTimeout(res, 50));
                const newToggleText = (toggleEl.textContent || '').trim();
                if (newToggleText !== expectedFull) {
                    HSLogger.log(`Failed to set ${toggleSel} to '${expectedFull}' after click. Current text: '${newToggleText}'`, this.context);
                }
            }
        }
    }
}
