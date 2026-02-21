import { HSModuleOptions } from '../../../types/hs-types';
import { HSModule } from '../../hs-core/module/hs-module';
import { HSLogger } from '../../hs-core/hs-logger';
import { HSSettings } from "../../hs-core/settings/hs-settings";

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
        '#openPlatonicCube.autoOpens',
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
     * List of selectors for elements that only rely on 'blur' to persist values in the vanilla UI.
     */
    private static readonly UPDATE_ON_BLUR_REQUIREMENTS: Array<{ selector: string, expected: number }> = [
        { selector: '#buyRuneBlessingInput', expected: 1000000 },
        { selector: '#buyRuneSpiritInput', expected: 1000000 },
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
        HSLogger.log('[HSAutosing] User Settings Fixer - Starting', this.context);
        await this.ensureAllTogglesOn();
        await this.ensurePercentSuffixElements();
        await this.ensureGreenButtons();
        await this.ensureChallengeAutoStates();
        await this.ensureNumberInputFields();
    }

    /**
     * List of number input fields and their expected values retrieved from HSSettings.
     * Each entry specifies a selector and the value to set.
     */
    private getRequirementsFromSettings(): Array<{ selector: string, expected: number }> {
        if (!HSSettings || typeof HSSettings.getSetting !== 'function') {
            HSLogger.log('[HSAutosing][ERROR] HSSettings is not initialized!', this.context);
            return [];
        }
        try {
            const autoCubeOpeningPercent = Number(HSSettings.getSetting('autosing3to6DCubeOpeningPercent').getValue());
            const tessAutoBuyPercent = Number(HSSettings.getSetting('autosingTessBuildingAutoBuyPercent').getValue());
            const autoChallStartTimer = Number(HSSettings.getSetting('autosingAutoChallTimerStart').getValue());
            const autoChallExitTimer = Number(HSSettings.getSetting('autosingAutoChallTimerExit').getValue());
            const autoChallEnterTimer = Number(HSSettings.getSetting('autosingAutoChallTimerEnter').getValue());

            HSLogger.log(
                `[HSAutosing][TRACE] getRequirementsFromSettings values: autoCubeOpeningPercent=${autoCubeOpeningPercent}, tessAutoBuyPercent=${tessAutoBuyPercent}, autoChallStartTimer=${autoChallStartTimer}, autoChallExitTimer=${autoChallExitTimer}, autoChallEnterTimer=${autoChallEnterTimer}`,
                this.context
            );

            const reqs = [
                { selector: '#cubeOpensInput.autoOpensInput', expected: autoCubeOpeningPercent },
                { selector: '#tesseractsOpensInput.autoOpensInput', expected: autoCubeOpeningPercent },
                { selector: '#hypercubesOpensInput.autoOpensInput', expected: autoCubeOpeningPercent },
                { selector: '#platonicCubeOpensInput.autoOpensInput', expected: autoCubeOpeningPercent },
                { selector: '#tesseractAmount.tesseractautobuyamount', expected: tessAutoBuyPercent },
                { selector: '#startAutoChallengeTimerInput.research150', expected: autoChallStartTimer },
                { selector: '#exitAutoChallengeTimerInput.research150', expected: autoChallExitTimer },
                { selector: '#enterAutoChallengeTimerInput.research150', expected: autoChallEnterTimer },
            ];

            return reqs;
        } catch (err) {
            HSLogger.log(`[HSAutosing][ERROR] getRequirementsFromSettings: failed to read HSSettings: ${err}`, this.context);
            return [];
        }
    }

    /**
     * Ensure all toggles are in their required state by checking text and clicking if needed.
     * If the text does not match the expected value, the button is clicked to toggle it.
     */
    public async ensureAllTogglesOn(): Promise<void> {
        for (const req of HSAutosingGameSettingsFixer.TOGGLE_REQUIREMENTS) {
            const el = document.querySelector(req.selector) as HTMLElement | null;
            if (!el) {
                HSLogger.log(`[HSAutosing][WARN] ensureAllTogglesOn: Element not found for selector: ${req.selector}`, this.context);
                continue;
            }
            const text = (el.textContent || '').trim();
            if (text !== req.expected) {
                try {
                    el.click();
                    await new Promise(res => setTimeout(res, 50));
                    const newText = (el.textContent || '').trim();
                    if (newText !== req.expected) {
                        HSLogger.log(`[HSAutosing][ERROR] ensureAllTogglesOn: Failed to set ${req.selector} to '${req.expected}' after click. Current text: '${newText}'`, this.context);
                    } else {
                        HSLogger.log(`[HSAutosing][INFO] ensureAllTogglesOn: Successfully set ${req.selector} to '${req.expected}'`, this.context);
                    }
                } catch (e) {
                    HSLogger.log(`[HSAutosing][ERROR] ensureAllTogglesOn: Failed to click ${req.selector}: ${e}`, this.context);
                }
            }
        }
    }

    /**
     * Ensure all elements in PERCENT_SUFFIX_ELEMENTS have text ending with '%'.
     * If not, click the element to try to correct it.
     */
    private async ensurePercentSuffixElements(): Promise<void> {
        for (const sel of HSAutosingGameSettingsFixer.PERCENT_SUFFIX_ELEMENTS) {
            const el = document.querySelector(sel) as HTMLElement | null;
            if (!el) {
                HSLogger.log(`[HSAutosing][WARN] ensurePercentSuffixElements: Element not found for selector: ${sel}`, this.context);
                continue;
            }
            const text = (el.textContent || '').trim();
            if (!text.endsWith('%')) {
                try {
                    el.click();
                    await new Promise(res => setTimeout(res, 50));
                    const newText = (el.textContent || '').trim();
                    if (!newText.endsWith('%')) {
                        HSLogger.log(`[HSAutosing][ERROR] ensurePercentSuffixElements: Failed to set ${sel} to text ending with '%' after click. Current text: '${newText}'`, this.context);
                    } else {
                        HSLogger.log(`[HSAutosing][INFO] ensurePercentSuffixElements: Successfully set ${sel} to text ending with '%'`, this.context);
                    }
                } catch (e) {
                    HSLogger.log(`[HSAutosing][ERROR] ensurePercentSuffixElements: Failed to click ${sel}: ${e}`, this.context);
                }
            }
        }
        HSLogger.log('[HSAutosing][DEBUG] ensurePercentSuffixElements: finished', this.context);
    }

    /**
     * Ensure all number input fields have their expected value.
     * If not, set the value.
     */
    private async ensureNumberInputFields(): Promise<void> {
        HSLogger.log('[HSAutosing][DEBUG] ensureNumberInputFields: start', this.context);
        const settingsReqs = this.getRequirementsFromSettings();
        HSLogger.log(`[HSAutosing][TRACE] ensureNumberInputFields: got ${settingsReqs.length} requirements from settings`, this.context);

        const requirements = [...settingsReqs];
        requirements.push(...HSAutosingGameSettingsFixer.UPDATE_ON_BLUR_REQUIREMENTS);
        HSLogger.log(`[HSAutosing][TRACE] ensureNumberInputFields: total requirements after push = ${requirements.length}`, this.context);

        const matches = (current: string, expected: any): boolean => {
            if (typeof expected === 'number') {
                const n = Number(current);
                return !Number.isNaN(n) && n === expected;
            }
            return current === String(expected);
        };
        
        for (const req of requirements) {
            HSLogger.log(`[HSAutosing][DEBUG] ensureNumberInputFields: processing selector='${req.selector}' expected='${req.expected}'`, this.context);
            const expectedStr = String(req.expected);
            let success = false;

            for (let attempt = 1; attempt <= 3; attempt++) {
                HSLogger.log(`[HSAutosing][TRACE] ensureNumberInputFields: attempt ${attempt} for ${req.selector}`, this.context);
                const el = document.querySelector(req.selector) as HTMLInputElement | null;
                if (!el) {
                    HSLogger.log(`[HSAutosing][WARN] ensureNumberInputFields: Number input field not found for selector: ${req.selector}`, this.context);
                    break;
                }

                HSLogger.log(`[HSAutosing][TRACE] ensureNumberInputFields: current value='${el.value}'`, this.context);
                // If already correct, skip
                if (matches(el.value, req.expected)) {
                    HSLogger.log(`[HSAutosing][INFO] ensureNumberInputFields: ${req.selector} already matches expected value '${expectedStr}'`, this.context);
                    success = true;
                    break;
                }

                HSLogger.log(`[HSAutosing][DEBUG] ensureNumberInputFields: setting ${req.selector} -> '${expectedStr}' (focus, set, dispatch, blur)`, this.context);
                try {
                    el.focus();
                    el.value = expectedStr;
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                    el.blur();
                } catch (e) {
                    HSLogger.log(`[HSAutosing][ERROR] ensureNumberInputFields: interaction error for ${req.selector}: ${e}`, this.context);
                }

                await new Promise(res => setTimeout(res, 50));

                // re-query in case the element was replaced
                const updatedEl = document.querySelector(req.selector) as HTMLInputElement | null;
                if (!updatedEl) {
                    HSLogger.log(`[HSAutosing][WARN] ensureNumberInputFields: element disappeared after interaction for ${req.selector}`, this.context);
                    break;
                }

                HSLogger.log(`[HSAutosing][TRACE] ensureNumberInputFields: after wait current='${updatedEl.value}' expected='${expectedStr}'`, this.context);
                if (matches(updatedEl.value, req.expected)) {
                    HSLogger.log(`[HSAutosing][INFO] ensureNumberInputFields: confirmed ${req.selector}='${expectedStr}' (attempt ${attempt})`, this.context);
                    success = true;
                    break;
                }
                HSLogger.log(`[HSAutosing][WARN] ensureNumberInputFields: attempt ${attempt} failed for ${req.selector}. current='${updatedEl.value}' expected='${expectedStr}'`, this.context);
            }

            if (!success) {
                HSLogger.log(`[HSAutosing][ERROR] ensureNumberInputFields: Failed to set value for ${req.selector} after 3 attempts. expected='${expectedStr}'`, this.context);
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
                HSLogger.log(`[HSAutosing][WARN] ensureGreenButtons: Element not found for selector: ${sel}`, this.context);
                continue;
            }
            if (el.style.backgroundColor !== 'green') {
                try {
                    el.click();
                    setTimeout(() => {
                        if (el.style.backgroundColor !== 'green') {
                            HSLogger.log(`[HSAutosing][ERROR] ensureGreenButtons: Failed to set background-color of ${sel} to green after click. current='${el.style.backgroundColor}'`, this.context);
                        } else {
                            HSLogger.log(`[HSAutosing][INFO] ensureGreenButtons: Successfully set background-color of ${sel} to green`, this.context);
                        }
                    }, 50);
                } catch (e) {
                    HSLogger.log(`[HSAutosing][ERROR] ensureGreenButtons: Failed to click ${sel}: ${e}`, this.context);
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
                HSLogger.log(`[HSAutosing][WARN] ensureChallengeAutoStates: Challenge element not found: ${challengeSel}`, this.context);
                continue;
            }
            if (!toggleEl) {
                HSLogger.log(`[HSAutosing][WARN] ensureChallengeAutoStates: Toggle element not found: ${toggleSel}`, this.context);
                continue;
            }
            try {
                challengeEl.click();
            } catch (e) {
                HSLogger.log(`[HSAutosing][ERROR] ensureChallengeAutoStates: Failed to click ${challengeSel}: ${e}`, this.context);
                continue;
            }
            // Wait briefly for UI update
            await new Promise(res => setTimeout(res, 50));
            const toggleText = (toggleEl.textContent || '').trim();
            if (!toggleText.startsWith(expectedPrefix)) {
                HSLogger.log(`[HSAutosing][WARN] ensureChallengeAutoStates: Toggle text for ${toggleSel} does not start with expected prefix '${expectedPrefix}'. Current: '${toggleText}'`, this.context);
                continue;
            }
            if (toggleText !== expectedFull) {
                try {
                    toggleEl.click();
                } catch (e) {
                    HSLogger.log(`[HSAutosing][ERROR] ensureChallengeAutoStates: Failed to click ${toggleSel}: ${e}`, this.context);
                    continue;
                }
                await new Promise(res => setTimeout(res, 50));
                const newToggleText = (toggleEl.textContent || '').trim();
                if (newToggleText !== expectedFull) {
                    HSLogger.log(`[HSAutosing][ERROR] ensureChallengeAutoStates: Failed to set ${toggleSel} to '${expectedFull}' after click. Current text: '${newToggleText}'`, this.context);
                } else {
                    HSLogger.log(`[HSAutosing][INFO] ensureChallengeAutoStates: Successfully set ${toggleSel} to '${expectedFull}' for challenge ${i}`, this.context);
                }
            }
        }
    }
}