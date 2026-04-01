import { HSLogger } from '../../hs-core/hs-logger';
import { HSSettings } from "../../hs-core/settings/hs-settings";
import { HSSettingsDefinition } from '../../../types/module-types/hs-settings-types';

/**
 * Class: HSAutosingSettingsFixer
 * IsExplicitHSModule: No
 * Description: Automates, corrects, and manages game settings for AutoSing.
 */
export class HSAutosingSettingsFixer {
    static #context = 'HSAutosingSettingsFixer';

    /**
     * List of toggle requirements: selector and expected text.
     * Each entry specifies a selector and the text that should be present when ON.
     */
    static readonly #TOGGLE_REQUIREMENTS: Array<{ selector: string, expected: string }> = [
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
    static readonly #PERCENT_SUFFIX_ELEMENTS: string[] = [
        '#openCubes.autoOpens',
        '#openTesseracts.autoOpens',
        '#openHypercubes.autoOpens',
        '#openPlatonicCube.autoOpens',
    ];

    /**
     * List of selectors for elements that must have style 'background-color: green;'.
     */
    static readonly #GREEN_BUTTONS: string[] = [
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
    static readonly #UPDATE_ON_BLUR_REQUIREMENTS: Array<{ selector: string, expected: number, tab: string, subTab: string }> = [
        { selector: '#buyRuneBlessingInput', expected: 1000000, tab: 'runestab', subTab: 'toggleRuneSubTab3' },
        { selector: '#buyRuneSpiritInput', expected: 1000000, tab: 'runestab', subTab: 'toggleRuneSubTab4' },
    ];

    /**
     * Public API to run all setting fixes. Can be invoked repeatedly without
     * reconstructing the fixer instance.
     */
    public static async fixAllSettings(): Promise<string[]> {
        await HSAutosingSettingsFixer.#ensureAllTogglesOn();
        await HSAutosingSettingsFixer.#ensurePercentSuffixElements();
        await HSAutosingSettingsFixer.#ensureGreenButtons();
        await HSAutosingSettingsFixer.#ensureChallengeAutoStates();
        await HSAutosingSettingsFixer.#ensureNumberInputFields();
        return await HSAutosingSettingsFixer.#disableUnwantedSettings();
    }

    /**
     * List of number input fields and their expected values retrieved from HSSettings.
     * Each entry specifies a selector and the value to set.
     */
    static #getUpdateOnBlurRequirementsFromSettings(): Array<{ selector: string, expected: number, tab: string, subTab: string }> {
        if (!HSSettings || typeof HSSettings.getSetting !== 'function') {
            HSLogger.error('HSSettings is not initialized!', HSAutosingSettingsFixer.#context);
            return [];
        }
        try {
            const autoCubeOpeningPercent = Number(HSSettings.getSetting('autosing3to6DCubeOpeningPercent').getValue());
            const tessAutoBuyPercent = Number(HSSettings.getSetting('autosingTessBuildingAutoBuyPercent').getValue());
            const autoChallStartTimer = Number(HSSettings.getSetting('autosingAutoChallTimerStart').getValue());
            const autoChallExitTimer = Number(HSSettings.getSetting('autosingAutoChallTimerExit').getValue());
            const autoChallEnterTimer = Number(HSSettings.getSetting('autosingAutoChallTimerEnter').getValue());

            const reqs = [
                { selector: '#cubeOpensInput.autoOpensInput', expected: autoCubeOpeningPercent, tab: 'cubetab', subTab: 'switchCubeSubTab1' },
                { selector: '#tesseractsOpensInput.autoOpensInput', expected: autoCubeOpeningPercent, tab: 'cubetab', subTab: 'switchCubeSubTab2' },
                { selector: '#hypercubesOpensInput.autoOpensInput', expected: autoCubeOpeningPercent, tab: 'cubetab', subTab: 'switchCubeSubTab3' },
                { selector: '#platonicCubeOpensInput.autoOpensInput', expected: autoCubeOpeningPercent, tab: 'cubetab', subTab: 'switchCubeSubTab4' },
                { selector: '#tesseractAmount.tesseractautobuyamount', expected: tessAutoBuyPercent, tab: 'buildingstab', subTab: 'switchToTesseractBuilding' },
                { selector: '#startAutoChallengeTimerInput.research150', expected: autoChallStartTimer, tab: 'challengetab', subTab: 'toggleChallengesSubTab1' },
                { selector: '#exitAutoChallengeTimerInput.research150', expected: autoChallExitTimer, tab: 'challengetab', subTab: 'toggleChallengesSubTab1' },
                { selector: '#enterAutoChallengeTimerInput.research150', expected: autoChallEnterTimer, tab: 'challengetab', subTab: 'toggleChallengesSubTab1' },
            ];

            return reqs;
        } catch (err) {
            HSLogger.warn(`getRequirementsFromSettings: failed to read HSSettings: ${err}`, HSAutosingSettingsFixer.#context);
            return [];
        }
    }

    /**
     * Ensure all toggles are in their required state by checking text and clicking if needed.
     * If the text does not match the expected value, the button is clicked to toggle it.
     */
    static async #ensureAllTogglesOn(): Promise<void> {
        // Track which toggle selectors were corrected or failed
        const correctedSelectors: string[] = [];
        const failedSelectors: string[] = [];

        // Loop through all toggle requirements and ensure correct state
        for (const toggleReq of HSAutosingSettingsFixer.#TOGGLE_REQUIREMENTS) {
            const toggleElement = document.querySelector(toggleReq.selector) as HTMLElement | null;
            if (!toggleElement) {
                failedSelectors.push(toggleReq.selector);
                continue;
            }
            if ((toggleElement.textContent || '').trim() !== toggleReq.expected) {
                try {
                    toggleElement.click();
                    await new Promise(res => setTimeout(res, 50)); // Wait for DOM update
                    if ((toggleElement.textContent || '').trim() !== toggleReq.expected) {
                        failedSelectors.push(toggleReq.selector);
                    } else {
                        correctedSelectors.push(toggleReq.selector);
                    }
                } catch {
                    failedSelectors.push(toggleReq.selector);
                }
            }
        }

        // Log final verification result
        if (correctedSelectors.length > 0 || failedSelectors.length > 0) {
            HSLogger.warn(`ensureAllTogglesOn: failed=${failedSelectors.length}${failedSelectors.length > 0 ? ` [${failedSelectors.join(', ')}]` : ''}, corrected=${correctedSelectors.length}${correctedSelectors.length > 0 ? ` [${correctedSelectors.join(', ')}]` : ''}`, HSAutosingSettingsFixer.#context);
        } else {
            HSLogger.debug(`ensureAllTogglesOn: all toggles already correct`, HSAutosingSettingsFixer.#context);
        }
    }

    /**
     * Ensure all elements in PERCENT_SUFFIX_ELEMENTS have text ending with '%'.
     * If not, click the element to try to correct it.
     */
    static async #ensurePercentSuffixElements(): Promise<void> {
        // Track which percent suffix selectors were corrected or failed
        const correctedSelectors: string[] = [];
        const failedSelectors: string[] = [];

        // Loop through all percent suffix elements and ensure correct text
        for (const percentSelector of HSAutosingSettingsFixer.#PERCENT_SUFFIX_ELEMENTS) {
            const percentElement = document.querySelector(percentSelector) as HTMLElement | null;
            if (!percentElement) {
                failedSelectors.push(percentSelector);
                continue;
            }
            if (!(percentElement.textContent || '').trim().endsWith('%')) {
                try {
                    percentElement.click();
                    await new Promise(res => setTimeout(res, 50)); // Wait for DOM update
                    if (!(percentElement.textContent || '').trim().endsWith('%')) {
                        failedSelectors.push(percentSelector);
                    } else {
                        correctedSelectors.push(percentSelector);
                    }
                } catch {
                    failedSelectors.push(percentSelector);
                }
            }
        }

        // Log final verification result
        if (correctedSelectors.length > 0 || failedSelectors.length > 0) {
            HSLogger.warn(`ensurePercentSuffixElements: failed=${failedSelectors.length}${failedSelectors.length > 0 ? ` [${failedSelectors.join(', ')}]` : ''}, corrected=${correctedSelectors.length}${correctedSelectors.length > 0 ? ` [${correctedSelectors.join(', ')}]` : ''}`, HSAutosingSettingsFixer.#context);
        } else {
            HSLogger.debug(`ensurePercentSuffixElements: all elements already correct`, HSAutosingSettingsFixer.#context);
        }
    }

    /**
     * Ensure all number input fields have their expected value.
     * If not, set the value.
     */
    static async #ensureNumberInputFields(): Promise<void> {
        // Gather all requirements for number input fields
        const inputRequirements = [
            ...HSAutosingSettingsFixer.#getUpdateOnBlurRequirementsFromSettings(),
            ...HSAutosingSettingsFixer.#UPDATE_ON_BLUR_REQUIREMENTS
        ];

        // Helper to compare current value to expected
        const valuesMatch = (currentValue: string, expectedValue: any): boolean => {
            if (typeof expectedValue === 'number') {
                const numeric = Number(currentValue);
                return !Number.isNaN(numeric) && numeric === expectedValue;
            }
            return currentValue === String(expectedValue);
        };

        // Track which selectors were corrected or failed
        const correctedSelectors: string[] = [];
        const failedSelectors: string[] = [];

        for (const req of inputRequirements) {
            const expectedStr = String(req.expected);
            const inputElement = document.querySelector(req.selector) as HTMLInputElement | null;
            if (!inputElement) {
                failedSelectors.push(req.selector);
                continue;
            }
            if (valuesMatch(inputElement.value, req.expected)) {
                HSLogger.debug(`ensureNumberInputFields: already correct: ${req.selector}='${inputElement.value}'`, HSAutosingSettingsFixer.#context);
                continue;
            }

            HSLogger.warn(`ensureNumberInputFields: correcting mismatch ${req.selector}: current='${inputElement.value}' expected='${expectedStr}'`, HSAutosingSettingsFixer.#context);
            try {
                // Switch to the required tab and subtab for visibility
                const tabButton = document.getElementById(req.tab) as HTMLButtonElement;
                const subTabButton = document.getElementById(req.subTab) as HTMLButtonElement;
                tabButton?.click();
                await new Promise(res => setTimeout(res, 30)); 
                subTabButton?.click();
                await new Promise(res => setTimeout(res, 30));

                // Set value and trigger events for persistence
                inputElement.focus();
                await new Promise(res => setTimeout(res, 30));
                inputElement.value = expectedStr;
                inputElement.dispatchEvent(new Event('input', { bubbles: true }));
                await new Promise(res => setTimeout(res, 30));
                inputElement.dispatchEvent(new Event('change', { bubbles: true }));
                await new Promise(res => setTimeout(res, 30));
                inputElement.blur();
                await new Promise(res => setTimeout(res, 30));

                // Verify correction
                if (valuesMatch(inputElement.value, req.expected)) {
                    correctedSelectors.push(req.selector);
                } else {
                    failedSelectors.push(req.selector);
                }
            } catch (err) {
                HSLogger.warn(`ensureNumberInputFields: error correcting ${req.selector}: ${err}`, HSAutosingSettingsFixer.#context);
                failedSelectors.push(req.selector);
            }
        }

        // Log final verification result
        if (correctedSelectors.length > 0 || failedSelectors.length > 0) {
            HSLogger.warn(`ensureNumberInputFields: failed=${failedSelectors.length}${failedSelectors.length > 0 ? ` [${failedSelectors.join(', ')}]` : ''}, corrected=${correctedSelectors.length}${correctedSelectors.length > 0 ? ` [${correctedSelectors.join(', ')}]` : ''}`, HSAutosingSettingsFixer.#context);
        } else {
            HSLogger.debug(`ensureNumberInputFields: all elements already correct`, HSAutosingSettingsFixer.#context);
        }
    }

    /**
     * Ensure all elements in GREEN_BUTTONS have style 'background-color: green;'.
     * If not, set the style attribute accordingly.
     */
    static async #ensureGreenButtons(): Promise<void> {
        // Track which green button selectors were corrected or failed
        const correctedSelectors: string[] = [];
        const failedSelectors: string[] = [];

        // Loop through all green button elements and ensure correct style
        for (const greenSelector of HSAutosingSettingsFixer.#GREEN_BUTTONS) {
            const greenButtonElement = document.querySelector(greenSelector) as HTMLElement | null;
            if (!greenButtonElement) {
                failedSelectors.push(greenSelector);
                continue;
            }
            if (greenButtonElement.style.backgroundColor !== 'green') {
                try {
                    greenButtonElement.click();
                    await new Promise(res => setTimeout(res, 50)); // Wait for DOM update
                    if (greenButtonElement.style.backgroundColor !== 'green') {
                        failedSelectors.push(greenSelector);
                    } else {
                        correctedSelectors.push(greenSelector);
                    }
                } catch {
                    failedSelectors.push(greenSelector);
                }
            }
        }

        // Log final verification result
        if (correctedSelectors.length > 0 || failedSelectors.length > 0) {
            HSLogger.warn(`ensureGreenButtons: failed=${failedSelectors.length}${failedSelectors.length > 0 ? ` [${failedSelectors.join(', ')}]` : ''}, corrected=${correctedSelectors.length}${correctedSelectors.length > 0 ? ` [${correctedSelectors.join(', ')}]` : ''}`, HSAutosingSettingsFixer.#context);
        } else {
            HSLogger.debug(`ensureGreenButtons: all elements already correct`, HSAutosingSettingsFixer.#context);
        }
    }

    /**
     * Ensure challenge auto states for challenge 1-15.
     * For 1-10: ON, (for 11-15: OFF maybe later if needed). Logs all failures and missing elements.
     */
    static async #ensureChallengeAutoStates(): Promise<void> {
        // Track which challenge selectors were corrected or failed
        const correctedChallenges: string[] = [];
        const failedChallenges: string[] = [];

        // Loop through challenges 1-10 and ensure correct auto state
        for (let challengeIndex = 1; challengeIndex <= 10; challengeIndex++) {
            const challengeSelector = `#challenge${challengeIndex}.challenge`;
            const toggleSelector = '#toggleAutoChallengeIgnore';
            const expectedPrefix = `Automatically Run Chal.${challengeIndex}`;
            const expectedState = challengeIndex <= 10 ? '[ON]' : '[OFF]';
            const expectedFullText = `${expectedPrefix} ${expectedState}`;
            const challengeElement = document.querySelector(challengeSelector) as HTMLElement | null;
            const toggleElement = document.querySelector(toggleSelector) as HTMLElement | null;

            if (!challengeElement || !toggleElement) {
                failedChallenges.push(`chal${challengeIndex}`);
                continue;
            }

            try {
                challengeElement.click();
            } catch {
                failedChallenges.push(`chal${challengeIndex}`);
                continue;
            }
            await new Promise(res => setTimeout(res, 50)); // Wait for DOM update
            const toggleText = (toggleElement.textContent || '').trim();
            if (!toggleText.startsWith(expectedPrefix) || toggleText === expectedFullText) continue;

            try {
                toggleElement.click();
            } catch {
                failedChallenges.push(`chal${challengeIndex}`);
                continue;
            }

            await new Promise(res => setTimeout(res, 50)); // Wait for DOM update
            if ((toggleElement.textContent || '').trim() !== expectedFullText) {
                failedChallenges.push(`chal${challengeIndex}`);
            } else {
                correctedChallenges.push(`chal${challengeIndex}`);
            }
        }

        // Log final verification result
        if (correctedChallenges.length > 0 || failedChallenges.length > 0) {
            HSLogger.warn(`ensureChallengeAutoStates: failed=${failedChallenges.length}${failedChallenges.length > 0 ? ` [${failedChallenges.join(', ')}]` : ''}, corrected=${correctedChallenges.length}${correctedChallenges.length > 0 ? ` [${correctedChallenges.join(', ')}]` : ''}`, HSAutosingSettingsFixer.#context);
        } else {
            HSLogger.debug(`ensureChallengeAutoStates: all elements already correct`, HSAutosingSettingsFixer.#context);
        }
    }

    static async #disableUnwantedSettings(): Promise<string[]> {
        const performanceSettingKeys = [
            'enableAutomationQuickBar',
            'ambrosiaMinibars',
            'ambrosiaIdleSwap',
            'useGameData'           // Disable GDS last
        ] as const;

        const disabledSettings: string[] = [];
        for (const settingKey of performanceSettingKeys) {
            const setting = HSSettings.getSetting(settingKey);

            if (!setting) {
                HSLogger.warn(`disableUnwantedSettings: setting "${settingKey}" not found`, HSAutosingSettingsFixer.#context);
                continue;
            }

            if (setting.isEnabled()) {
                setting.disable();
                disabledSettings.push(settingKey);
                HSLogger.log(`disableUnwantedSettings: disabled "${settingKey}"`, HSAutosingSettingsFixer.#context);
            }
        }
                    const gdsSettingEnabled = HSSettings.getSetting('useGameData')?.isEnabled();
                    if (gdsSettingEnabled) {
                        HSSettings.getSetting('useGameData')?.disable();
                    }
        if (disabledSettings.length > 0) {
            HSLogger.log(`disableUnwantedSettings: disabled ${disabledSettings.length} performance-impacting setting(s) (${disabledSettings.join(', ')})`, HSAutosingSettingsFixer.#context);
        } else {
            HSLogger.debug(`disableUnwantedSettings: all performance-impacting settings already disabled`, HSAutosingSettingsFixer.#context);
        }
        return disabledSettings;
    }

    public static async restoreUnwantedSettings(settingsToRestore: string[]): Promise<void> {
        // Reverse to re-enable GDS first
        for (let i = settingsToRestore.length - 1; i >= 0; i--) {
            const settingKey = settingsToRestore[i];
            const setting = HSSettings.getSetting(settingKey as keyof HSSettingsDefinition);
            if (setting && typeof setting.enable === 'function') {
                setting.enable();
                HSLogger.log(`restoreUnwantedSettings: restored "${settingKey}"`, HSAutosingSettingsFixer.#context);
            } else {
                HSLogger.warn(`restoreUnwantedSettings: setting "${settingKey}" not found or cannot be re-enabled`, HSAutosingSettingsFixer.#context);
            }
        }
    }
}
