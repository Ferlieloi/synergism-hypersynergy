import { HSLogger } from '../../hs-core/hs-logger';
import { HSSettings } from "../../hs-core/settings/hs-settings";
import { HSSettingsDefinition } from '../../../types/module-types/hs-settings-types';
import { HSGameState, MainView } from '../../hs-core/hs-gamestate';
import { HSModuleManager } from '../../hs-core/module/hs-module-manager';
import { HSAmbrosiaHelper } from '../hs-ambrosiaHelper';

/**
 * Class: HSAutosingSettingsFixer
 * IsExplicitHSModule: No
 * Description: Automates, corrects, and manages game settings for AutoSing.
 */
export class HSAutosingSettingsFixer {
    static readonly #context = 'HSAutosingSettingsFixer';

    /**
     * List of toggle requirements: selector and expected text.
     * Each entry specifies a selector and the text that should be present when ON.
     */
    static readonly #TOGGLE_REQUIREMENTS: Array<{ selector: string, expected: string }> = [
        // Buildings
        { selector: '#toggle1.auto.autobuyerToggleButton', expected: '2px solid green' },
        { selector: '#toggle2.auto.autobuyerToggleButton', expected: '2px solid green' },
        { selector: '#toggle3.auto.autobuyerToggleButton', expected: '2px solid green' },
        { selector: '#toggle4.auto.autobuyerToggleButton', expected: '2px solid green' },
        { selector: '#toggle5.auto.autobuyerToggleButton', expected: '2px solid green' },
        { selector: '#toggle6.auto.autobuyerToggleButton', expected: '2px solid green' },
        { selector: '#toggle7.auto.autobuyerToggleButton', expected: '2px solid green' },
        { selector: '#toggle8.auto.autobuyerToggleButton', expected: '2px solid green' },
        { selector: '#toggle10.auto.autobuyerToggleButton', expected: '2px solid green' },
        { selector: '#toggle11.auto.autobuyerToggleButton', expected: '2px solid green' },
        { selector: '#toggle12.auto.autobuyerToggleButton', expected: '2px solid green' },
        { selector: '#toggle13.auto.autobuyerToggleButton', expected: '2px solid green' },
        { selector: '#toggle14.auto.autobuyerToggleButton', expected: '2px solid green' },
        { selector: '#toggle16.auto.autobuyerToggleButton', expected: '2px solid green' },
        { selector: '#toggle17.auto.autobuyerToggleButton', expected: '2px solid green' },
        { selector: '#toggle18.auto.autobuyerToggleButton', expected: '2px solid green' },
        { selector: '#toggle19.auto.autobuyerToggleButton', expected: '2px solid green' },
        { selector: '#toggle20.auto.autobuyerToggleButton', expected: '2px solid green' },
        { selector: '#toggle22.auto.autobuyerToggleButton', expected: '2px solid green' },
        { selector: '#toggle23.auto.autobuyerToggleButton', expected: '2px solid green' },
        { selector: '#toggle24.auto.autobuyerToggleButton', expected: '2px solid green' },
        { selector: '#toggle25.auto.autobuyerToggleButton', expected: '2px solid green' },
        { selector: '#toggle26.auto.autobuyerToggleButton', expected: '2px solid green' },
        { selector: '#tesseractAutoToggle1.auto.autobuyerToggleButton', expected: '2px solid green' },
        { selector: '#tesseractAutoToggle2.auto.autobuyerToggleButton', expected: '2px solid green' },
        { selector: '#tesseractAutoToggle3.auto.autobuyerToggleButton', expected: '2px solid green' },
        { selector: '#tesseractAutoToggle4.auto.autobuyerToggleButton', expected: '2px solid green' },
        { selector: '#tesseractAutoToggle5.auto.autobuyerToggleButton', expected: '2px solid green' },
        { selector: '#toggle15.auto', expected: '2px solid red' },
        { selector: '#toggle21.auto', expected: '2px solid red' },
        { selector: '#toggle27.auto', expected: '2px solid red' },
        { selector: '#tesseractautobuytoggle', expected: '2px solid green' },
        { selector: '#tesseractautobuymode', expected: 'Mode: PERCENTAGE' },
        // Upgrades
        { selector: '#coinAutoUpgrade.autobuyerToggleButton', expected: '2px solid green' },
        { selector: '#prestigeAutoUpgrade.autobuyerToggleButton', expected: '2px solid green' },
        { selector: '#transcendAutoUpgrade.autobuyerToggleButton', expected: '2px solid green' },
        { selector: '#reincarnateAutoUpgrade.autobuyerToggleButton', expected: '2px solid green' },
        { selector: '#generatorsAutoUpgrade.autobuyerToggleButton', expected: '2px solid green' },
        // Runes
        { selector: '#toggleautosacrifice', expected: '2px solid green' },
        { selector: '#toggleautoBuyFragments', expected: '2px solid white' },
        { selector: '#toggleautofortify', expected: '2px solid green' },
        { selector: '#toggle36.auto', expected: '2px solid green' },
        { selector: '#toggle37.auto', expected: '2px solid green' },
        // Challenges
        { selector: '#toggleAutoChallengeStart', expected: '2px solid red' },
        // Researches
        { selector: '#toggleresearchbuy', expected: 'Upgrade: MAX [if possible]' },
        { selector: '#toggleautoresearch', expected: 'Automatic: ON' },
        { selector: '#toggleautoresearchmode', expected: 'Automatic mode: Cheapest' },
        // Ants
        { selector: '#toggleAutoSacrificeAnt', expected: 'Auto Sacrifice: OFF' },
        // Cube
        { selector: '#toggleAutoCubeUpgrades', expected: '2px solid green' },
        { selector: '#toggleAutoPlatonicUpgrades', expected: '2px solid green' },
        // Hepteracts
        { selector: '#chronosHepteractAuto.singularity', expected: '2px solid green' },
        { selector: '#hyperrealismHepteractAuto.singularity', expected: '2px solid green' },
        { selector: '#quarkHepteractAuto.singularity', expected: '2px solid red' },
        { selector: '#challengeHepteractAuto.singularity', expected: '2px solid green' },
        { selector: '#abyssHepteractAuto.singularity', expected: '2px solid green' },
        { selector: '#acceleratorHepteractAuto.singularity', expected: '2px solid green' },
        { selector: '#acceleratorBoostHepteractAuto.singularity', expected: '2px solid green' },
        { selector: '#multiplierHepteractAuto.singularity', expected: '2px solid green' },
        { selector: '#hepteractToQuarkTradeAuto.singularity', expected: '2px solid green' },
        // Others
        { selector: '#ascensionAutoEnable', expected: '2px solid red' },
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
        await HSAmbrosiaHelper.ensureLoadoutModeIsLoad();
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
            if ((toggleElement.textContent || '').trim() !== toggleReq.expected && (toggleElement.style.border || '').trim() !== toggleReq.expected) {
                try {
                    toggleElement.click();
                    await new Promise(res => setTimeout(res, 50)); // Wait for DOM update
                    if ((toggleElement.textContent || '').trim() !== toggleReq.expected && (toggleElement.style.border || '').trim() !== toggleReq.expected) {
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
            HSLogger.debug(() => `ensureAllTogglesOn: all toggles already correct`, HSAutosingSettingsFixer.#context);
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
            HSLogger.debug(() => `ensurePercentSuffixElements: all elements already correct`, HSAutosingSettingsFixer.#context);
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
        const valuesMatch = (currentValue: string, expected: number): boolean => {
            const numeric = Number(currentValue);
            return !Number.isNaN(numeric) && numeric === expected;
        };

        // Save user tab
        const gamestate = HSModuleManager.getModule<HSGameState>("HSGameState") as HSGameState;
        const prevMainView = gamestate.getCurrentUIView<MainView>('MAIN_VIEW');

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
                HSLogger.debug(() => `ensureNumberInputFields: already correct: ${req.selector}='${inputElement.value}'`, HSAutosingSettingsFixer.#context);
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

        // Restore user tab
        window.setTimeout(() => prevMainView.goto(), 20);

        // Log final verification result
        if (correctedSelectors.length > 0 || failedSelectors.length > 0) {
            HSLogger.warn(`ensureNumberInputFields: failed=${failedSelectors.length}${failedSelectors.length > 0 ? ` [${failedSelectors.join(', ')}]` : ''}, corrected=${correctedSelectors.length}${correctedSelectors.length > 0 ? ` [${correctedSelectors.join(', ')}]` : ''}`, HSAutosingSettingsFixer.#context);
        } else {
            HSLogger.debug(() => `ensureNumberInputFields: all elements already correct`, HSAutosingSettingsFixer.#context);
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
            HSLogger.debug(() => `ensureGreenButtons: all elements already correct`, HSAutosingSettingsFixer.#context);
        }
    }

    /**
     * Ensure challenge auto states for challenge 1-10.
     */
    static async #ensureChallengeAutoStates(): Promise<void> {
        // Track which challenge selectors were corrected or failed
        const correctedChallenges: string[] = [];
        const failedChallenges: string[] = [];

        const toggleElement = document.querySelector('#toggleAutoChallengeIgnore') as HTMLElement | null;
        if (!toggleElement) {
            HSLogger.warn(`ensureChallengeAutoStates: #toggleAutoChallengeIgnore not found`, HSAutosingSettingsFixer.#context);
            return;
        }

        // Loop through challenges 1-10 and ensure correct auto state
        for (let challengeIndex = 1; challengeIndex <= 10; challengeIndex++) {
            const expectedPrefix = `Automatically Run Chal.${challengeIndex}`;
            const expectedFullText = `${expectedPrefix} [ON]`;
            const challengeElement = document.querySelector(`#challenge${challengeIndex}.challenge`) as HTMLElement | null;

            if (!challengeElement) {
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
            HSLogger.debug(() => `ensureChallengeAutoStates: all elements already correct`, HSAutosingSettingsFixer.#context);
        }
    }

    static async #disableUnwantedSettings(): Promise<string[]> {
        const performanceSettingKeys = [
            'enableCorruptionQuickBar',
            'enableAutomationQuickBar',
            'ambrosiaMinibars',
            'ambrosiaIdleSwap',
            'useGameData'
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
                HSLogger.debug(() => `disableUnwantedSettings: disabled "${settingKey}"`, HSAutosingSettingsFixer.#context);
            }
        }
        // Enable autoConfirmPopups for autosing. Tracked with '+' prefix so restore knows to disable it.
        const autoConfirmSetting = HSSettings.getSetting('autoConfirmPopups');
        if (autoConfirmSetting) {
            if (!autoConfirmSetting.isEnabled()) {
                autoConfirmSetting.enable();
                disabledSettings.push('+autoConfirmPopups');
                HSLogger.debug(() => `disableUnwantedSettings: enabled "autoConfirmPopups" for autosing`, HSAutosingSettingsFixer.#context);
            }
        } else {
            HSLogger.warn(`disableUnwantedSettings: setting "autoConfirmPopups" not found`, HSAutosingSettingsFixer.#context);
        }

        if (disabledSettings.length > 0) {
            HSLogger.log(`disableUnwantedSettings: disabled ${disabledSettings.length} performance-impacting setting(s) (${disabledSettings.join(', ')})`, HSAutosingSettingsFixer.#context);
        } else {
            HSLogger.debug(() => `disableUnwantedSettings: all performance-impacting settings already disabled`, HSAutosingSettingsFixer.#context);
        }
        return disabledSettings;
    }

    public static restoreUnwantedSettings(settingsToRestore: string[]): void {
        // Reverse order to re-enable GDS first.
        // Keys prefixed with '+' were enabled by autosing and must be disabled on restore.
        for (let i = settingsToRestore.length - 1; i >= 0; i--) {
            const raw = settingsToRestore[i];
            const inverted = raw.startsWith('+');
            const settingKey = inverted ? raw.slice(1) : raw;
            const setting = HSSettings.getSetting(settingKey as keyof HSSettingsDefinition);
            if (setting) {
                if (inverted) {
                    setting.disable();
                } else {
                    setting.enable();
                }
                HSLogger.log(`restoreUnwantedSettings: restored "${settingKey}"`, HSAutosingSettingsFixer.#context);
            } else {
                HSLogger.warn(`restoreUnwantedSettings: setting "${settingKey}" not found or cannot be restored`, HSAutosingSettingsFixer.#context);
            }
        }
    }
}
