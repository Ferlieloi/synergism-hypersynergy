import { HSModuleOptions } from '../../../types/hs-types';
import { HSModule } from '../../hs-core/module/hs-module';
import { HSLogger } from '../../hs-core/hs-logger';
import { HSSettings } from "../../hs-core/settings/hs-settings";

/**
 * Class: HSAutosingSettingsFixer
 * Description: Automates, corrects, and manages game settings for AutoSing.
 * Author: Copilot (based on HSQOLButtons)
 */
export class HSAutosingSettingsFixer extends HSModule {
    init(): Promise<void> {
        HSLogger.log('HSAutosingSettingsFixer fake-load', "HSAutosingSettingsFixer");
        return Promise.resolve();
    }

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
     * Constructs the HSAutosingSettingsFixer and logs initialization.
     * @param moduleOptions Options for module configuration and context.
     */
    constructor(moduleOptions: HSModuleOptions) {
        super(moduleOptions);
        HSLogger.log('HSAutosingSettingsFixer initialized', "HSAutosingSettingsFixer");
    }

    /**
     * Initialize the fixer: ensure toggles, percent elements, and text fields are correct.
     */


    /**
     * Public API to run all setting fixes. Can be invoked repeatedly without
     * reconstructing the fixer instance.
     */
    public async fixAllSettings(): Promise<void> {
        await this.ensureAllTogglesOn();
        await this.ensurePercentSuffixElements();
        await this.ensureGreenButtons();
        await this.ensureChallengeAutoStates();
        await this.ensureNumberInputFields();
        await this.disableUnwantedSettings();
    }

    /**
     * List of number input fields and their expected values retrieved from HSSettings.
     * Each entry specifies a selector and the value to set.
     */
    private getRequirementsFromSettings(): Array<{ selector: string, expected: number }> {
        if (!HSSettings || typeof HSSettings.getSetting !== 'function') {
            HSLogger.error('HSSettings is not initialized!', "HSAutosingSettingsFixer");
            return [];
        }
        try {
            const autoCubeOpeningPercent = Number(HSSettings.getSetting('autosing3to6DCubeOpeningPercent').getValue());
            const tessAutoBuyPercent = Number(HSSettings.getSetting('autosingTessBuildingAutoBuyPercent').getValue());
            const autoChallStartTimer = Number(HSSettings.getSetting('autosingAutoChallTimerStart').getValue());
            const autoChallExitTimer = Number(HSSettings.getSetting('autosingAutoChallTimerExit').getValue());
            const autoChallEnterTimer = Number(HSSettings.getSetting('autosingAutoChallTimerEnter').getValue());

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
            HSLogger.warn(`getRequirementsFromSettings: failed to read HSSettings: ${err}`, "HSAutosingSettingsFixer");
            return [];
        }
    }

    /**
     * Ensure all toggles are in their required state by checking text and clicking if needed.
     * If the text does not match the expected value, the button is clicked to toggle it.
     */
    public async ensureAllTogglesOn(): Promise<void> {
        const corrected: string[] = [];
        const failed: string[] = [];

        for (const req of HSAutosingSettingsFixer.TOGGLE_REQUIREMENTS) {
            const el = document.querySelector(req.selector) as HTMLElement | null;
            if (!el) {
                HSLogger.warn(`ensureAllTogglesOn: Element not found: ${req.selector}`, "HSAutosingSettingsFixer");
                continue;
            }
            if ((el.textContent || '').trim() !== req.expected) {
                try {
                    el.click();
                    await new Promise(res => setTimeout(res, 50));
                    if ((el.textContent || '').trim() !== req.expected) {
                        failed.push(req.selector);
                    } else {
                        corrected.push(req.selector);
                    }
                } catch {
                    failed.push(req.selector);
                }
            }
        }

        if (corrected.length > 0 || failed.length > 0) {
            HSLogger.warn(`ensureAllTogglesOn: corrected=${corrected.length}, failed=${failed.length}${failed.length > 0 ? ` [${failed.join(', ')}]` : ''}`, "HSAutosingSettingsFixer");
        } else {
            HSLogger.debug(`ensureAllTogglesOn: all toggles already correct`, "HSAutosingSettingsFixer");
        }
    }

    /**
     * Ensure all elements in PERCENT_SUFFIX_ELEMENTS have text ending with '%'.
     * If not, click the element to try to correct it.
     */
    private async ensurePercentSuffixElements(): Promise<void> {
        const corrected: string[] = [];
        const failed: string[] = [];

        for (const sel of HSAutosingSettingsFixer.PERCENT_SUFFIX_ELEMENTS) {
            const el = document.querySelector(sel) as HTMLElement | null;
            if (!el) continue;
            if (!(el.textContent || '').trim().endsWith('%')) {
                try {
                    el.click();
                    await new Promise(res => setTimeout(res, 50));
                    if (!(el.textContent || '').trim().endsWith('%')) {
                        failed.push(sel);
                    } else {
                        corrected.push(sel);
                    }
                } catch {
                    failed.push(sel);
                }
            }
        }

        if (corrected.length > 0 || failed.length > 0) {
            HSLogger.warn(`ensurePercentSuffixElements: corrected=${corrected.length}, failed=${failed.length}${failed.length > 0 ? ` [${failed.join(', ')}]` : ''}`, "HSAutosingSettingsFixer");
        } else {
            HSLogger.debug(`ensurePercentSuffixElements: all elements already correct`, "HSAutosingSettingsFixer");
        }
    }

    /**
     * Ensure all number input fields have their expected value.
     * If not, set the value.
     */
    private async ensureNumberInputFields(): Promise<void> {
        const requirements = [...this.getRequirementsFromSettings(), ...HSAutosingSettingsFixer.UPDATE_ON_BLUR_REQUIREMENTS];

        const matches = (current: string, expected: any): boolean => {
            if (typeof expected === 'number') {
                const n = Number(current);
                return !Number.isNaN(n) && n === expected;
            }
            return current === String(expected);
        };

        const corrected: string[] = [];
        const failed: string[] = [];

        for (const req of requirements) {
            const expectedStr = String(req.expected);

            const elInitial = document.querySelector(req.selector) as HTMLInputElement | null;
            if (!elInitial) {
                HSLogger.warn(`ensureNumberInputFields: element not found: ${req.selector}`, this.context);
                continue;
            }
            if (matches(elInitial.value, req.expected)) continue;

            HSLogger.warn(`ensureNumberInputFields: mismatch ${req.selector}: current='${elInitial.value}' expected='${expectedStr}'`, this.context);

            let success = false;
            for (let attempt = 1; attempt <= 3; attempt++) {
                const el = document.querySelector(req.selector) as HTMLInputElement | null;
                if (!el) {
                    HSLogger.warn(`ensureNumberInputFields: element disappeared on attempt ${attempt}: ${req.selector}`, this.context);
                    break;
                }

                try {
                    el.focus();
                    el.value = expectedStr;
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                    el.blur();
                } catch {
                    break;
                }

                await new Promise(res => setTimeout(res, 50));

                const updatedEl = document.querySelector(req.selector) as HTMLInputElement | null;
                if (!updatedEl) {
                    HSLogger.warn(`ensureNumberInputFields: element disappeared after blur on attempt ${attempt}: ${req.selector}`, this.context);
                    break;
                }

                if (matches(updatedEl.value, req.expected)) {
                    success = true;
                    break;
                }
                HSLogger.warn(`ensureNumberInputFields: attempt ${attempt} failed for ${req.selector}: got='${updatedEl.value}' expected='${expectedStr}'`, this.context);
            }

            if (success) {
                corrected.push(req.selector);
            } else {
                failed.push(req.selector);
            }
        }

        if (corrected.length > 0 || failed.length > 0) {
            HSLogger.warn(`ensureNumberInputFields: corrected=${corrected.length}, failed=${failed.length}${failed.length > 0 ? ` [${failed.join(', ')}]` : ''}`, this.context);
        } else {
            HSLogger.debug(`ensureNumberInputFields: all elements already correct`, this.context);
        }
    }

    /**
     * Ensure all elements in GREEN_BUTTONS have style 'background-color: green;'.
     * If not, set the style attribute accordingly.
     */
    private async ensureGreenButtons(): Promise<void> {
        const corrected: string[] = [];
        const failed: string[] = [];

        for (const sel of HSAutosingSettingsFixer.GREEN_BUTTONS) {
            const el = document.querySelector(sel) as HTMLElement | null;
            if (!el) continue;
            if (el.style.backgroundColor !== 'green') {
                try {
                    el.click();
                    await new Promise(res => setTimeout(res, 50));
                    if (el.style.backgroundColor !== 'green') {
                        failed.push(sel);
                    } else {
                        corrected.push(sel);
                    }
                } catch {
                    failed.push(sel);
                }
            }
        }

        if (corrected.length > 0 || failed.length > 0) {
            HSLogger.warn(`ensureGreenButtons: corrected=${corrected.length}, failed=${failed.length}${failed.length > 0 ? ` [${failed.join(', ')}]` : ''}`, "HSAutosingSettingsFixer");
        } else {
            HSLogger.debug(`ensureGreenButtons: all elements already correct`, "HSAutosingSettingsFixer");
        }
    }

    /**
     * Ensure challenge auto states for challenge 1-15.
     * For 1-10: ON, (for 11-15: OFF maybe later if needed). Logs all failures and missing elements.
     */
    private async ensureChallengeAutoStates(): Promise<void> {
        const corrected: string[] = [];
        const failed: string[] = [];

        // Loop only challenges 1-10 for now... 11-15 shouldn't be needed...
        for (let i = 1; i <= 10; i++) {
            const challengeSel = `#challenge${i}.challenge`;
            const toggleSel = '#toggleAutoChallengeIgnore';
            const expectedPrefix = `Automatically Run Chal.${i}`;
            const expectedState = i <= 10 ? '[ON]' : '[OFF]';
            const expectedFull = `${expectedPrefix} ${expectedState}`;
            const challengeEl = document.querySelector(challengeSel) as HTMLElement | null;
            const toggleEl = document.querySelector(toggleSel) as HTMLElement | null;

            if (!challengeEl || !toggleEl) continue;

            try {
                challengeEl.click();
            } catch {
                failed.push(`chal${i}`);
                continue;
            }
            await new Promise(res => setTimeout(res, 50));
            const toggleText = (toggleEl.textContent || '').trim();
            if (!toggleText.startsWith(expectedPrefix) || toggleText === expectedFull) continue;

            try {
                toggleEl.click();
            } catch {
                failed.push(`chal${i}`);
                continue;
            }

            await new Promise(res => setTimeout(res, 50));
            if ((toggleEl.textContent || '').trim() !== expectedFull) {
                failed.push(`chal${i}`);
            } else {
                corrected.push(`chal${i}`);
            }
        }

        if (corrected.length > 0 || failed.length > 0) {
            HSLogger.warn(`ensureChallengeAutoStates: corrected=${corrected.length}, failed=${failed.length}${failed.length > 0 ? ` [${failed.join(', ')}]` : ''}`, "HSAutosingSettingsFixer");
        } else {
            HSLogger.debug(`ensureChallengeAutoStates: all elements already correct`, "HSAutosingSettingsFixer");
        }
    }

    private async disableUnwantedSettings(): Promise<void> {
        const performanceSettingKeys = [
            'enableAutomationQuickBar',
            'ambrosiaMinibars',
            'ambrosiaIdleSwap'
        ] as const;

        let disabledCount = 0;

        for (const settingKey of performanceSettingKeys) {
            const setting = HSSettings.getSetting(settingKey);

            if (!setting) {
                HSLogger.warn(`disableUnwantedSettings: setting "${settingKey}" not found`, "HSAutosingSettingsFixer");
                continue;
            }

            if (setting.isEnabled()) {
                setting.disable();
                disabledCount++;
                HSLogger.log(`disableUnwantedSettings: disabled "${settingKey}"`, "HSAutosingSettingsFixer");
            }
        }

        if (disabledCount > 0) {
            HSLogger.log(`disableUnwantedSettings: disabled ${disabledCount} performance-impacting setting(s)`, "HSAutosingSettingsFixer");
        } else {
            HSLogger.debug(`disableUnwantedSettings: all performance-impacting settings already disabled`, "HSAutosingSettingsFixer");
        }
    }
}