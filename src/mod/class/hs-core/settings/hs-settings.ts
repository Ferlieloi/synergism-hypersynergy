import { AutosingStrategy, HSSettingBase, HSSettingControlGroup, HSSettingControlPage, HSSettingRecord, HSSettingsDefinition, HSSettingType } from "../../../types/module-types/hs-settings-types";
import { HSAutosingStrategy, AutosingStrategyPhase, phases } from "../../../types/module-types/hs-autosing-types";
import { HSUtils } from "../../hs-utils/hs-utils";
import { HSLogger } from "../hs-logger";
import { HSModule } from "../module/hs-module";
import settings from "inline:../../../resource/json/hs-settings.json";
import settings_control_groups from "inline:../../../resource/json/hs-settings-control-groups.json";
import settings_control_pages from "inline:../../../resource/json/hs-settings-control-pages.json";
import strategies from "inline:../../../resource/json/hs-settings-strategies.json";
import { HSUI } from "../hs-ui";
import { HSUIC } from "../hs-ui-components";
import { HSInputType } from "../../../types/module-types/hs-ui-types";
import { HSSettingActions } from "./hs-setting-action";
import { HSBooleanSetting, HSNumericSetting, HSSelectNumericSetting, HSSelectStringSetting, HSSetting, HSStateSetting, HSStringSetting, HSButtonSetting } from "./hs-setting";
import { HSModuleManager } from "../module/hs-module-manager";
import { HSStorage } from "../hs-storage";
import { HSGlobal } from "../hs-global";
import sIconB64 from "inline:../../../resource/txt/s_icon.txt";
import { HSModuleOptions } from "../../../types/hs-types";
import { HSAutosingStrategyModal } from "../../hs-modules/hs-autosing/ui/hs-autosing-strategy-modal";

/*
    Class: HSSettings
    IsExplicitHSModule: Yes
    Description: 
        Hypersynergism's settings module.
        Responsibilities include:
            - Parsing settings from JSON
            (- Saving and loading settings)
            - Building the settings panel with setting inputs
            - Binding appropriate events to setting changes and on/off toggles
            - Keeping internal settings states in sync with DOM
    Author: Swiffy
*/
export class HSSettings extends HSModule {
    static #staticContext = '';

    static #settings: HSSettingRecord = {} as HSSettingRecord;
    static #settingsControlGroups: Record<string, HSSettingControlGroup>;
    static #settingsControlPages: Record<keyof HSSettingControlPage, HSSettingControlPage>;

    static #settingsParsed = false;
    static #settingsSynced = false;
    static #saveTimeout: any;

    static #settingEnabledString = "✓";
    static #settingDisabledString = "✗";

    static #strategies: HSAutosingStrategy[] = []

    #settingActions: HSSettingActions;

    constructor(moduleOptions: HSModuleOptions) {
        super(moduleOptions);

        HSSettings.#staticContext = this.context;
        this.#settingActions = new HSSettingActions();

        HSLogger.log(`Parsing mod settings`, this.context);

        // Read hs-settings-control-groups.json and parse it
        try {
            HSLogger.log(`Parsing control groups`, this.context);
            HSSettings.#settingsControlGroups = JSON.parse(settings_control_groups) as Record<string, HSSettingControlGroup>;
        } catch (e) {
            HSLogger.error(`Error parsing control groups ${e}`, this.context);
            HSSettings.#settingsParsed = false;
        }

        // Read hs-settings-control-pages.json and parse it
        try {
            HSLogger.log(`Parsing control pages`, this.context);
            HSSettings.#settingsControlPages = JSON.parse(settings_control_pages) as Record<keyof HSSettingControlPage, HSSettingControlPage>;
        } catch (e) {
            HSLogger.error(`Error parsing control pages ${e}`, this.context);
            HSSettings.#settingsParsed = false;
        }

        try {
            HSLogger.log(`Parsing settings.json`, this.context);

            // Parse and resolve the settings from hs-settings.json and localStorage
            // This will also validate the settings and figure out things like 
            // if some settings are missing from localStorage (happens when new settings are added)
            const resolvedSettings = this.#resolveSettings();

            let gameDataSettingState;

            if ("useGameData" in resolvedSettings) {
                const gameDataSetting = resolvedSettings.useGameData;
                gameDataSettingState = gameDataSetting.enabled;
            } else {
                gameDataSettingState = false;
            }

            // Set default values for each setting
            for (const [key, setting] of Object.typedEntries<HSSettingsDefinition>(resolvedSettings)) {

                if (setting.settingType === 'boolean' || HSUtils.isBoolean(setting.settingValue)) {
                    (setting as any).settingValue = false;
                }

                // If somehow we're loading a setting that uses game data, but game data is disabled in the loaded settings
                // We disable this setting too
                if (setting.usesGameData && setting.enabled && !gameDataSettingState) {
                    if (!HSGlobal.HSSettings.gameDataCheckBlacklist.includes(key)) {
                        HSLogger.info(`Disabled ${setting.settingDescription} on load because GDS is not on`, this.context);
                        setting.enabled = false;
                    }
                }

                this.#validateSetting(setting, HSSettings.#settingsControlGroups);

                const settingActionName = ('settingAction' in setting) ? setting.settingAction : undefined;
                const settingAction = settingActionName ? this.#settingActions.getAction(settingActionName) : null;

                // Instantiate the setting as HSSetting objects based on their type
                if (setting.settingType === 'numeric') {

                    if (!('settingValueMultiplier' in setting as any))
                        (setting as any).settingValueMultiplier = 1;

                    (HSSettings.#settings as any)[key] = new HSNumericSetting(
                        setting as unknown as HSSettingBase<number>,
                        settingAction,
                        HSSettings.#settingEnabledString,
                        HSSettings.#settingDisabledString
                    );
                } else if (setting.settingType === 'string') {
                    (HSSettings.#settings as any)[key] = new HSStringSetting(
                        setting as unknown as HSSettingBase<string>,
                        settingAction,
                        HSSettings.#settingEnabledString,
                        HSSettings.#settingDisabledString
                    );
                } else if (setting.settingType === 'boolean') {
                    (HSSettings.#settings as any)[key] = new HSBooleanSetting(
                        setting as unknown as HSSettingBase<boolean>,
                        settingAction,
                        HSSettings.#settingEnabledString,
                        HSSettings.#settingDisabledString
                    );
                } else if (setting.settingType === 'selectnumeric') {
                    if (!('settingValueMultiplier' in setting as any))
                        (setting as any).settingValueMultiplier = 1;

                    (HSSettings.#settings as any)[key] = new HSSelectNumericSetting(
                        setting as unknown as HSSettingBase<number>,
                        settingAction,
                        HSSettings.#settingEnabledString,
                        HSSettings.#settingDisabledString
                    );
                } else if (setting.settingType === 'selectstring') {
                    (HSSettings.#settings as any)[key] = new HSSelectStringSetting(
                        setting as unknown as HSSettingBase<string>,
                        settingAction,
                        HSSettings.#settingEnabledString,
                        HSSettings.#settingDisabledString
                    );
                } else if (setting.settingType === 'state') {
                    (HSSettings.#settings as any)[key] = new HSStateSetting(
                        setting as unknown as HSSettingBase<string>,
                        settingAction,
                        HSSettings.#settingEnabledString,
                        HSSettings.#settingDisabledString
                    );
                } else if (setting.settingType === 'button') {
                    (HSSettings.#settings as any)[key] = new HSButtonSetting(
                        setting as unknown as HSSettingBase<null>,
                        settingAction,
                        HSSettings.#settingEnabledString,
                        HSSettings.#settingDisabledString
                    );
                } else {
                    throw new Error(`Could not parse setting ${key.toString()} (settingType: ${setting.settingType}, settingValue: ${setting.settingValue})`);
                }
            }

            HSSettings.saveSettingsToStorage();
            HSSettings.#settingsParsed = true;
        } catch (e) {
            HSLogger.error(`Error parsing mod settings ${e}`, this.context);
            HSSettings.#settingsParsed = false;
        }
    }

    async init(): Promise<void> {
        this.#addStrategiesToOptions(HSSettings.#strategies)
        this.isInitialized = true;
    }

    static async syncSettings() {
        HSLogger.log(`Syncing mod settings`, HSSettings.#staticContext);

        if (!HSSettings.#settingsParsed) {
            HSLogger.error(`Could not sync settings - settings not parsed yet`, HSSettings.#staticContext);
            return;
        }

        // Update the setting UI controls with the configured values in hs-settings.json
        for (const [key, settingObj] of Object.typedEntries(HSSettings.#settings)) {

            const setting = settingObj.getDefinition();
            const controlSettings = settingObj.hasControls() ? setting.settingControl : undefined;

            if (controlSettings) {
                const controlType = controlSettings.controlType;
                const controlOptions = controlSettings.controlOptions;

                // Render input for all the text and number settings
                // NOTE: switch settings do not need any input to be rendered
                if (controlType === "text" || controlType === "number") {
                    const valueElement = document.querySelector(`#${controlSettings.controlId}`) as HTMLInputElement;

                    if (valueElement) {
                        if (controlType === "number" && controlOptions) {
                            if ('min' in controlOptions) valueElement.setAttribute('min', controlOptions.min!.toString());
                            if ('max' in controlOptions) valueElement.setAttribute('max', controlOptions.max!.toString());
                            if ('step' in controlOptions) valueElement.setAttribute('step', controlOptions.step!.toString());
                        } else if (controlType === "text" && controlOptions) {
                            if ('placeholder' in controlOptions) valueElement.setAttribute('placeholder', controlOptions.placeholder!);
                        }

                        // Set the input value to the JSON setting value
                        valueElement.value = HSUtils.asString(setting.settingValue);

                        // Listen for changes in the UI input to change the setting value
                        valueElement.addEventListener('change', async (e) => { await this.#settingChangeDelegate(e, settingObj); });
                    }
                } else if (controlType === "select") { // Render input for all the select settings
                    const settingValue = HSUtils.asString(setting.settingValue);
                    const selectElement = document.querySelector(`#${controlSettings.controlId}`) as HTMLSelectElement;

                    if (selectElement) {
                        const optionExists = Array.from(selectElement.options).some(option => option.value === settingValue);

                        if (optionExists) {
                            // Set the input value to the JSON setting value
                            selectElement.value = settingValue;
                        } else {
                            selectElement.value = ""; // Set to empty string if the value doesn't exist in the options
                            HSLogger.warn(`Setting value ${settingValue} does not exist in select options for setting ${key}`, HSSettings.#staticContext);
                        }

                        // Listen for changes in the UI input to change the setting value
                        selectElement.addEventListener('change', async (e) => { await this.#settingChangeDelegate(e, settingObj); });
                    }
                } else if (controlType === "state") { // Render input for all the select settings
                    const settingValue = HSUtils.parseColorTags(HSUtils.asString(setting.settingValue));
                    const stateElement = document.querySelector(`#${controlSettings.controlId}`) as HTMLSelectElement;

                    if (stateElement) {
                        stateElement.innerHTML = settingValue;
                    }
                } else if (controlType === "button") {
                    // Buttons should invoke the setting's handleChange when clicked
                    const buttonElement = document.querySelector(`#${controlSettings.controlId}`) as HTMLButtonElement;

                    if (buttonElement) {
                        buttonElement.addEventListener('click', async (e) => { await this.#settingChangeDelegate(e, settingObj); });
                    }
                }

                // This sets up the  "✓" / "✗" button next to the setting input (switch type settings just need this one)
                if (controlSettings.controlEnabledId) {
                    const toggleElement = document.querySelector(`#${controlSettings.controlEnabledId}`) as HTMLDivElement;

                    if (toggleElement) {
                        if (setting.enabled) {
                            toggleElement.innerText = HSSettings.#settingEnabledString;
                            toggleElement.classList.remove('hs-disabled');
                        } else {
                            toggleElement.innerText = HSSettings.#settingDisabledString;
                            toggleElement.classList.add('hs-disabled');
                        }

                        // Handle toggling the setting on/off
                        toggleElement.addEventListener('click', async (e) => { await this.#settingToggleDelegate(e, settingObj); });
                    }
                }

                await settingObj.initialAction("state", setting.enabled);
            }
        }

        HSLogger.log(`Finished syncing mod settings`, HSSettings.#staticContext);
        this.#settingsSynced = true;
    }

    // Builds the settings UI in the mod's panel
    static autoBuildSettingsUI(): { didBuild: boolean, navHTML: string, pagesHTML: string } {
        const self = this;

        if (!HSSettings.#settingsParsed) {
            HSLogger.error(`Could not sync settings - settings not parsed yet`, HSSettings.#staticContext);
            return { didBuild: false, navHTML: '', pagesHTML: '' };
        }

        const settingsBlocks: string[] = [];
        let didBuild = true;

        // Sort the settings by their control group
        const sortedSettings = Object.entries(HSSettings.#settings).sort((a, b) => {
            const aControlGroup = a[1].getDefinition().settingControl?.controlGroup;
            const bControlGroup = b[1].getDefinition().settingControl?.controlGroup;

            if (aControlGroup && bControlGroup) {
                return (HSSettings.#settingsControlGroups[aControlGroup].order || 0) - (HSSettings.#settingsControlGroups[bControlGroup].order || 0);
            } else if (aControlGroup) {
                return -1;
            } else if (bControlGroup) {
                return 1;
            } else {
                return 0;
            }
        });

        // Sort the pages
        const sortedPages = (Object.entries(HSSettings.#settingsControlPages) as [keyof HSSettingControlPage, HSSettingControlPage][]).sort((a, b) => {
            const aPage = a[1].order;
            const bPage = b[1].order;

            if (aPage && bPage) {
                return (aPage || 0) - (bPage || 0);
            } else if (aPage) {
                return -1;
            } else if (bPage) {
                return 1;
            } else {
                return 0;
            }
        });

        const subTabs = [];

        for (const [key, page] of sortedPages) {
            const haveAnySettingsForPage = sortedSettings.some(setting => setting[1].getDefinition().settingControl?.controlPage === key);

            if (!haveAnySettingsForPage) continue;

            subTabs.push(HSUIC.Div({
                class: 'hs-panel-subtab',
                id: `hs-panel-settings-subtab-${key}`,
                data: new Map([['subtab', key], ['color', page.pageColor || '']]),
                styles: {
                    border: page.pageColor ? `1px solid ${page.pageColor}` : `1px solid gray`
                },
                html: page.pageName
            }));
        }

        let navHTML = HSUIC.Div({
            class: 'hs-panel-subtabs',
            html: subTabs
        });

        let pagesHTML: Map<keyof HSSettingControlPage, string[]> = new Map();

        let currentControlGroup: string | null = null;

        for (const [key, settingObj] of sortedSettings) {
            const setting = settingObj.getDefinition();
            const controls = setting.settingControl;
            const settingBlockId = setting.settingBlockId || undefined;

            let gameDataIcon = "";

            if (setting.usesGameData) {
                gameDataIcon = HSUIC.Image({
                    class: 'hs-panel-setting-block-gamedata-icon',
                    src: sIconB64,
                    width: 18,
                    height: 18,
                    props: { title: HSGlobal.HSSettings.gameDataRequiredTooltip },
                });
            }

            if (controls) {
                const pageHTMLs = pagesHTML.get(controls.controlPage) || [];
                let components: string[] = [];

                // Check if the control group is different from the previous one
                // If so, create a new setting group header
                if (!currentControlGroup || currentControlGroup !== controls.controlGroup) {
                    currentControlGroup = controls.controlGroup;
                    const controlGroup = HSSettings.#settingsControlGroups[currentControlGroup];

                    // Create control group header
                    pageHTMLs.push(HSUIC.Div({
                        html: controlGroup.groupName,
                        styles: {
                            borderBottom: '1px solid limegreen',
                            gridColumn: 'span 2',
                            marginBottom: '15px'
                        }
                    }))
                }

                if (controls.controlType === "switch") {
                    components = [
                        HSUIC.Div({
                            class: 'hs-panel-setting-block-text-wrapper',
                            styles: {
                                display: 'flex',
                                flexDirection: 'row',
                                alignItems: 'center',
                            },
                            html: [
                                HSUIC.P({
                                    class: 'hs-panel-setting-block-text',
                                    props: { title: setting.settingHelpText },
                                    text: setting.settingDescription,
                                    styles: { margin: '0' }
                                }),
                                gameDataIcon
                            ]
                        }),
                    ]

                    if (controls.controlEnabledId) {
                        components.push(HSUIC.Button({ class: 'hs-panel-setting-block-btn hs-panel-settings-block-btn-standalone', id: controls.controlEnabledId, text: "" }))
                    }
                } else if (controls.controlType === "button") {
                    components = [
                        HSUIC.Button({
                            id: controls.controlId!,
                            text: setting.settingDescription || 'Error: No button text'
                        })
                    ];
                } else {
                    let convertedType: HSInputType | null = null;

                    switch (controls.controlType) {
                        case "text":
                            convertedType = HSInputType.TEXT;
                            break;
                        case "number":
                            convertedType = HSInputType.NUMBER;
                            break;
                        case "select":
                            convertedType = HSInputType.SELECT;
                            break;
                        case "state":
                            convertedType = HSInputType.STATE;
                            break;
                        default:
                            convertedType = null;
                    }

                    if (convertedType) {
                        // Setting header
                        components = [
                            HSUIC.Div({
                                class: 'hs-panel-setting-block-text-wrapper',
                                styles: {
                                    display: 'flex',
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                },
                                html: [
                                    HSUIC.P({
                                        class: 'hs-panel-setting-block-text',
                                        props: { title: setting.settingHelpText },
                                        text: setting.settingDescription,
                                        styles: { margin: '0' }
                                    }),
                                    gameDataIcon
                                ]
                            })
                        ];

                        // Setting value input
                        if (convertedType === HSInputType.NUMBER || convertedType === HSInputType.TEXT) {
                            components.push(HSUIC.Input({ class: 'hs-panel-setting-block-num-input', id: controls.controlId, type: convertedType }));
                        } else if (convertedType === HSInputType.SELECT) {
                            if (controls.selectOptions) {
                                components.push(HSUIC.Select(
                                    { class: 'hs-panel-setting-block-select-input', id: controls.controlId, type: convertedType },
                                    controls.selectOptions
                                ));
                            } else {
                                HSLogger.error(`Error autobuilding settings UI, ${setting.settingName} does not have selectOptions defined`, self.#staticContext);
                                didBuild = false;
                                break;
                            }
                        } else if (convertedType === HSInputType.STATE) {
                            components.push(HSUIC.P({ class: 'hs-panel-setting-block-state', id: controls.controlId, text: "" }));
                        }

                        // Create setting on/off toggle
                        if (controls.controlEnabledId) {
                            components.push(HSUIC.Button({ class: 'hs-panel-setting-block-btn', id: controls.controlEnabledId, text: "" }))
                        }
                    } else {
                        HSLogger.error(`Error autobuilding settings UI, control type resolution failed (how??)`, self.#staticContext);
                        didBuild = false;
                        break;
                    }
                }

                // Create setting block which contains the setting header, value input and on/off toggle

                // Add special class for inline button layout in strategy rows
                let blockClass = 'hs-panel-setting-block';
                if (controls.controlType === "button" &&
                    (controls.controlGroup === "auto-sing-strategy-controls")) {
                    blockClass += ' hs-inline-button';
                }

                pageHTMLs.push(HSUIC.Div({
                    id: settingBlockId,
                    class: blockClass,
                    html: components
                }));

                pagesHTML.set(controls.controlPage, pageHTMLs);
            } else {
                HSLogger.error(`Error autobuilding settings UI, controls not defined for setting ${key}`, self.#staticContext);
                didBuild = false;
                break;
            }
        }

        for (const [pageName, pages] of pagesHTML.entries()) {
            pagesHTML.set(pageName, [HSUIC.Div({
                class: 'hs-panel-settings-grid',
                id: `settings-grid-${pageName}`,
                html: pages
            })]);
        }

        const flatPages = [];

        for (const [pageName, pages] of pagesHTML.entries()) {
            flatPages.push(pages.join(''));
        }

        return {
            didBuild,
            navHTML: navHTML,
            pagesHTML: flatPages.join('')
        };
    }

    static validateStrategy(strategy: HSAutosingStrategy) {
        if (!strategy) throw new Error('Strategy is undefined');
        if (!('strategyName' in strategy)) throw new Error('Strategy is missing strategyName property');
        if (!('strategy' in strategy)) throw new Error('Strategy is missing strategy property');
        if (!Array.isArray(strategy.strategy)) throw new Error('Strategy.strategy must be an array');
        const components = strategy.strategy as AutosingStrategyPhase[];
        if (components.length === 0) {
            throw new Error('Strategy has no components');
        }
        let remainingPhases = [...phases];

        for (let i = 0; i < components.length; i++) {
            const component = components[i];
            const { startPhase, endPhase, corruptions, strat: challenges } = component;

            if (!corruptions) {
                throw new Error(
                    `Component ${i + 1} (${startPhase} → ${endPhase}) has no corruptions defined`,
                );
            }

            if (!Array.isArray(challenges) || challenges.length === 0) {
                throw new Error(
                    `Component ${i + 1} (${startPhase} → ${endPhase}) must have at least one challenge`,
                );
            }

            // Rule: must start at leftmost remaining phase
            if (remainingPhases[0] !== startPhase) {
                throw new Error(
                    `Component ${i + 1} must start at "${remainingPhases[0]}", got "${startPhase}"`,
                );
            }

            const endIndex = remainingPhases.indexOf(endPhase);

            if (endIndex === -1) {
                throw new Error(
                    `Component ${i + 1} ends at "${endPhase}", which is not valid or already consumed`,
                );
            }

            // Consume phases from the left
            remainingPhases = remainingPhases.slice(endIndex);
        }
        // all phases must be consumed
        if (remainingPhases.length > 1) {
            throw new Error(
                `Uncovered phases: ${remainingPhases.join(', ')}`,
            );
        }
    }

    #validateSetting(setting: HSSettingBase<HSSettingType>, controlGroups: Record<string, HSSettingControlGroup>) {
        if (!setting) throw new Error(`Setting is undefined (wtf)`);

        // These should be the same as HSSettingsControlType in hs-settings-types.ts
        const validControlTypes = ['text', 'number', 'switch', 'select', 'state', 'button'];

        // These should be the same as HSSettingJSONType in hs-settings-types.ts
        const validSettingTypes = ['numeric', 'string', 'boolean', 'selectnumeric', 'selectstring', 'state', 'button'];

        // Check the name first so we can use it in the error messages
        if (!('settingName' in setting)) throw new Error(`Setting is missing settingName property`);

        const settingName = setting.settingName;

        // Check the basic properties
        if (!('enabled' in setting)) throw new Error(`Setting '${settingName}' is missing enabled property`);
        if (!('settingDescription' in setting)) throw new Error(`Setting '${settingName}' is missing settingDescription property`);
        if (!('settingValue' in setting)) throw new Error(`Setting '${settingName}' is missing settingValue property`);
        if (!('settingType' in setting)) throw new Error(`Setting '${settingName}' is missing settingType property`);

        // Check if the settingType is valid
        if (!validSettingTypes.includes(setting.settingType))
            throw new Error(`Setting '${settingName}' has invalid settingType property`);

        const settingType = setting.settingType;

        // Check if the settingValue is valid for the settingType
        if (settingType === 'numeric') {
            if (!HSUtils.isNumeric(setting.settingValue))
                throw new Error(`Setting '${settingName}' has invalid settingValue property for settingType ${settingType}`);
        }
        else if (settingType === 'string') {
            if (!HSUtils.isString(setting.settingValue))
                throw new Error(`Setting '${settingName}' has invalid settingValue property for settingType ${settingType}`);
        }
        else if (settingType === 'boolean') {
            if (!HSUtils.isBoolean(setting.settingValue))
                throw new Error(`Setting '${settingName}' has invalid settingValue property for settingType ${settingType}`);
        }
        else if (settingType === 'selectnumeric') {
            if (!HSUtils.isString(setting.settingValue) && !HSUtils.isNumeric(setting.settingValue))
                throw new Error(`Setting '${settingName}' has invalid settingValue property for settingType ${settingType}`);
        }
        else if (settingType === 'selectstring') {
            if (!HSUtils.isString(setting.settingValue) && !HSUtils.isNumeric(setting.settingValue))
                throw new Error(`Setting '${settingName}' has invalid settingValue property for settingType ${settingType}`);
        }

        // If the setting defines a settingControl, check the properties
        if ('settingControl' in setting) {
            if (setting.settingControl) {
                const settingControl = setting.settingControl;

                if (settingControl.controlType !== "switch" && !('controlId' in settingControl))
                    throw new Error(`Setting '${settingName}' has settingControl defined and it is not type'switch', but it is missing controlId property`);
                if (!('controlType' in settingControl))
                    throw new Error(`Setting '${settingName}' has settingControl defined, but it is missing controlType property`);
                if (!('controlGroup' in settingControl))
                    throw new Error(`Setting '${settingName}' has settingControl defined, but it is missing controlGroup property`);

                if (!validControlTypes.includes(settingControl.controlType))
                    throw new Error(`Setting '${settingName}' has invalid controlType property`);

                const controlGroup = settingControl.controlGroup;

                if (!(controlGroup in controlGroups))
                    throw new Error(`Setting '${settingName}' has invalid controlGroup property`);
            }
        }
    }

    static getSetting<K extends keyof HSSettingsDefinition>(settingName: K): HSSetting<HSSettingType> {
        return this.#settings[settingName];
    }

    static getSettings(): HSSettingRecord {
        return this.#settings;
    }

    static getStrategies(): HSAutosingStrategy[] {
        return this.#strategies;
    }


    // Serializes all current settings into a JSON string
    static #serializeSettings(): string {
        const serializeableSettings: Partial<HSSettingBase<HSSettingType>> = {}

        for (const [key, setting] of Object.typedEntries(this.#settings)) {
            const definition = { ...setting.getDefinition() as Partial<HSSettingBase<HSSettingType>> };

            // Remove properties that should not be saved into localStorage
            const blackList = HSGlobal.HSSettings.serializationBlackList;

            for (const blackListKey of blackList) {
                if ((definition as any)[blackListKey]) delete (definition as any)[blackListKey];
            }

            (serializeableSettings as any)[key] = definition;
        }

        return JSON.stringify(serializeableSettings);
    }

    static saveStrategiesToStorage(
        strategy?: HSAutosingStrategy,
        strategyName?: string
    ) {
        const storageMod = HSModuleManager.getModule<HSStorage>('HSStorage');
        if (!storageMod) {
            throw new Error("Could not find Storage Module");
        }

        let strategies: HSAutosingStrategy[] | null = storageMod.getData(HSGlobal.HSSettings.strategiesKey);
        if (!Array.isArray(strategies)) {
            strategies = [];
        }

        if (!strategy && strategyName) {
            // Deletion: remove from both storage and memory
            const updatedStrategies = strategies.filter(
                s => s.strategyName !== strategyName
            );

            // Remove from memory (but preserve default strategies)
            HSSettings.#strategies = HSSettings.#strategies.filter(
                s => s.strategyName !== strategyName
            );

            storageMod.setData(
                HSGlobal.HSSettings.strategiesKey,
                updatedStrategies
            );
            this.#removeStrategyFromOptions(strategyName);

            HSLogger.debug(`<green>Strategy removed</green>`, this.#staticContext);
            return;
        }

        if (strategy) {
            this.validateStrategy(strategy);
            const isUpdate = !!strategyName;
            const nameExists = strategies.some(s => {
                if (s.strategyName !== strategy.strategyName) return false;
                if (!isUpdate) return true;
                return s.strategyName !== strategyName;
            });

            if (nameExists) {
                throw new Error(`Strategy with name "${strategy.strategyName}" already exists.`);
            }

            let updatedStrategies = strategies;

            if (isUpdate) {
                updatedStrategies = strategies.filter(
                    s => s.strategyName !== strategyName
                );
                this.#removeStrategyFromOptions(strategyName);

                // Also remove from memory
                HSSettings.#strategies = HSSettings.#strategies.filter(
                    s => s.strategyName !== strategyName
                );
            }

            updatedStrategies = updatedStrategies.concat(strategy);

            // Add to memory instead of replacing
            HSSettings.#strategies.push(strategy);

            const saved = storageMod.setData(
                HSGlobal.HSSettings.strategiesKey,
                updatedStrategies.filter(s => s.strategyName !== "default_strategy")
            );

            this.#addStrategyToOptions(strategy);

            if (!saved) {
                HSLogger.warn(
                    `Could not save Strategy to localStorage`,
                    this.#staticContext
                );
            } else {
                HSLogger.debug(
                    `<green>Strategy ${isUpdate ? "updated" : "saved"} to localStorage</green>`,
                    this.#staticContext
                );
            }
        }
    }

    static async deleteSelectedStrategy() {
        const strategySetting = HSSettings.getSetting("autosingStrategy");
        const selectedValue = strategySetting.getValue();

        if (!selectedValue || selectedValue === '') {
            HSUI.Notify("Please select a strategy to delete", {
                notificationType: "warning"
            });
            return;
        }

        const control = strategySetting.getDefinition().settingControl;
        if (!control?.selectOptions) return;

        const selectedOption = control.selectOptions.find(opt => opt.value.toString() === selectedValue);
        if (!selectedOption) return;

        const strategyName = selectedOption.text;

        if (strategyName == "default_strategy") {
            HSUI.Notify("cannot delete default strategy")
            return;
        }

        if (!confirm(`Are you sure you want to delete strategy "${strategyName}"?`)) {
            return;
        }

        HSSettings.saveStrategiesToStorage(undefined, strategyName);

        HSUI.Notify(`Strategy "${strategyName}" deleted`, {
            notificationType: "success"
        });
    }

    static async exportSelectedStrategy() {
        const strategySetting = HSSettings.getSetting("autosingStrategy");
        const selectedValue = strategySetting.getValue();

        if (!selectedValue || selectedValue === '') {
            HSUI.Notify("Please select a strategy to export", {
                notificationType: "warning"
            });
            return;
        }

        const control = strategySetting.getDefinition().settingControl;
        if (!control?.selectOptions) return;

        const selectedOption = control.selectOptions.find(opt => opt.value.toString() === selectedValue);
        if (!selectedOption) return;

        const strategyName = selectedOption.text;

        const strategies = HSSettings.getStrategies();
        const strategy = strategies.find(s => s.strategyName === strategyName);

        if (!strategy) {
            HSUI.Notify("Strategy not found", {
                notificationType: "error"
            });
            return;
        }

        try {
            const strategyJson = JSON.stringify(strategy, null, 2);
            await navigator.clipboard.writeText(strategyJson);

            HSUI.Notify(`Strategy "${strategyName}" copied to clipboard`, {
                notificationType: "success"
            });
        } catch (error) {
            HSUI.Notify("Failed to copy strategy to clipboard", {
                notificationType: "error"
            });
            HSLogger.log(`Export failed: ${error}`, 'HSAutosing');
        }
    }

    static async importStrategy() {
        const uiMod = HSModuleManager.getModule<HSUI>('HSUI');
        if (uiMod) {
            const modalId = await uiMod.Modal({
                title: 'Import Strategy',
                htmlContent: `
            <div style="display: flex; flex-direction: column; gap: 15px; padding: 10px;">
                <div>
                    <label for="import-strategy-name" style="display: block; margin-bottom: 5px; font-weight: bold;">Strategy Name:</label>
                    <input type="text" id="import-strategy-name" placeholder="Enter strategy name" style="width: 100%; padding: 8px; box-sizing: border-box;" />
                </div>
                <div>
                    <label for="import-strategy-json" style="display: block; margin-bottom: 5px; font-weight: bold;">Strategy JSON:</label>
                    <textarea id="import-strategy-json" placeholder="Paste strategy JSON here" rows="10" style="width: 100%; padding: 8px; box-sizing: border-box; font-family: monospace;"></textarea>
                </div>
                <div style="display: flex; gap: 10px; justify-content: flex-end;">
                    <button id="import-strategy-cancel" data-close="${'modal-will-be-replaced'}" style="padding: 8px 16px; cursor: pointer;">Cancel</button>
                    <button id="import-strategy-submit" style="padding: 8px 16px; cursor: pointer; background-color: #4CAF50; color: white; border: none;">Import</button>
                </div>
            </div>
        `
            });

            // Update the cancel button's data-close attribute with the actual modal ID
            const cancelBtn = document.querySelector(`#${modalId} #import-strategy-cancel`) as HTMLButtonElement;
            if (cancelBtn) {
                cancelBtn.dataset.close = modalId;
            }

            const submitBtn = document.querySelector(`#${modalId} #import-strategy-submit`) as HTMLButtonElement;
            const nameInput = document.querySelector(`#${modalId} #import-strategy-name`) as HTMLInputElement;
            const jsonInput = document.querySelector(`#${modalId} #import-strategy-json`) as HTMLTextAreaElement;

            jsonInput.addEventListener('input', () => {
                // Do not overwrite a name the user already typed
                if (nameInput.value.trim()) {
                    return;
                }

                try {
                    const parsed = JSON.parse(jsonInput.value) as Partial<HSAutosingStrategy>;

                    if (
                        parsed &&
                        typeof parsed.strategyName === 'string' &&
                        parsed.strategyName.trim()
                    ) {
                        nameInput.value = parsed.strategyName.trim();
                    }
                } catch {
                    // Ignore invalid JSON while typing
                }
            });

            if (!submitBtn || !nameInput || !jsonInput) {
                HSUI.Notify("Failed to create import modal", {
                    notificationType: "error"
                });
                return;
            }

            submitBtn.addEventListener('click', async () => {
                const strategyName = nameInput.value.trim();
                const strategyJson = jsonInput.value.trim();

                // Validate name
                if (!strategyName) {
                    HSUI.Notify("Please enter a strategy name", {
                        notificationType: "warning"
                    });
                    return;
                }

                // Check if name already exists
                const existingStrategies = HSSettings.getStrategies();
                if (existingStrategies.some(s => s.strategyName === strategyName)) {
                    HSUI.Notify(`Strategy "${strategyName}" already exists`, {
                        notificationType: "warning"
                    });
                    return;
                }

                // Validate JSON
                let parsedStrategy: HSAutosingStrategy;
                try {
                    parsedStrategy = JSON.parse(strategyJson);
                } catch (error) {
                    HSUI.Notify("Invalid JSON format", {
                        notificationType: "error"
                    });
                    return;
                }

                this.validateStrategy(parsedStrategy);

                // Update the strategy name to the user's input
                parsedStrategy.strategyName = strategyName;

                // Save the strategy
                try {
                    HSSettings.saveStrategiesToStorage(parsedStrategy);

                    HSUI.Notify(`Strategy "${strategyName}" imported successfully`, {
                        notificationType: "success"
                    });

                    // Close the modal
                    const modal = document.querySelector(`#${modalId}`) as HTMLDivElement;
                    if (modal) {
                        await modal.transition({ opacity: 0 });
                        modal.parentElement?.removeChild(modal);
                    }
                } catch (error) {
                    HSUI.Notify("Failed to save strategy", {
                        notificationType: "error"
                    });
                    HSLogger.log(`Import failed: ${error}`, 'HSAutosing');
                }
            });
        } else {
            HSUI.Notify("Failed to find HSUI", {
                notificationType: "error"
            });
        }
    }

    static async exportAllModSettings() {
        const storageMod = HSModuleManager.getModule<HSStorage>('HSStorage');
        if (!storageMod) {
            HSUI.Notify("Storage module not found", { notificationType: "error" });
            return;
        }

        try {
            const data = {
                settings: storageMod.getData(HSGlobal.HSSettings.storageKey),
                strategies: storageMod.getData(HSGlobal.HSSettings.strategiesKey),
                ambrosia: storageMod.getData(HSGlobal.HSAmbrosia.storageKey),
                version: HSGlobal.General.currentModVersion,
                timestamp: Date.now()
            };

            const json = JSON.stringify(data);
            // Use btoa safely for UTF-8 (escape/unescape is a common hack for this)
            const encoded = btoa(unescape(encodeURIComponent(json)));
            await navigator.clipboard.writeText(encoded);

            HSUI.Notify("All mod settings exported to clipboard!", {
                notificationType: "success"
            });
        } catch (error) {
            HSUI.Notify("Export failed", { notificationType: "error" });
            HSLogger.error(`Full export failed: ${error}`, HSSettings.#staticContext);
        }
    }

    static async importAllModSettings() {
        const uiMod = HSModuleManager.getModule<HSUI>('HSUI');
        if (!uiMod) {
            HSUI.Notify("UI module not found", { notificationType: "error" });
            return;
        }

        const modalId = await uiMod.Modal({
            title: 'Import All Mod Settings',
            htmlContent: `
                <div style="display: flex; flex-direction: column; gap: 15px; padding: 10px;">
                    <div style="color: #ff4444; font-weight: bold; border: 1px solid #ff4444; padding: 10px; border-radius: 4px; background: rgba(255, 68, 68, 0.1);">
                        ⚠️ WARNING: This will overwrite ALL your current settings, strategies, and Ambrosia loadouts. This action is permanent and cannot be undone!
                    </div>
                    <div>
                        <label for="import-all-json" style="display: block; margin-bottom: 5px; font-weight: bold;">Paste Export Code:</label>
                        <textarea id="import-all-json" placeholder="Paste your export code here..." rows="10" style="width: 100%; padding: 8px; box-sizing: border-box; font-family: monospace; background: #111; color: #eee; border: 1px solid #444; border-radius: 4px;"></textarea>
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: flex-end;">
                        <button id="import-all-cancel" style="padding: 10px 20px; cursor: pointer; background: #333; color: white; border: 1px solid #555; border-radius: 4px;">Cancel</button>
                        <button id="import-all-submit" style="padding: 10px 20px; cursor: pointer; background-color: #d32f2f; color: white; border: none; border-radius: 4px; font-weight: bold; box-shadow: 0 0 10px rgba(211, 47, 47, 0.5);">OVERWRITE & IMPORT</button>
                    </div>
                </div>
            `
        });

        const modal = document.querySelector(`#${modalId}`) as HTMLDivElement;
        const submitBtn = modal.querySelector('#import-all-submit') as HTMLButtonElement;
        const jsonInput = modal.querySelector('#import-all-json') as HTMLTextAreaElement;
        const cancelBtn = modal.querySelector('#import-all-cancel') as HTMLButtonElement;

        cancelBtn.addEventListener('click', async () => {
            // Close the modal
            if (modal) {
                await (modal as any).transition({ opacity: 0 });
                modal.parentElement?.removeChild(modal);
            }
        });

        submitBtn.addEventListener('click', async () => {
            const code = jsonInput.value.trim();
            if (!code) {
                HSUI.Notify("Please paste an export code", { notificationType: "warning" });
                return;
            }

            try {
                // Decode safely for UTF-8
                const json = decodeURIComponent(escape(atob(code)));
                const decoded = JSON.parse(json);

                // Basic validation
                if (!decoded || (!decoded.settings && !decoded.strategies && !decoded.ambrosia)) {
                    throw new Error("Invalid export code format");
                }

                const storageMod = HSModuleManager.getModule<HSStorage>('HSStorage');
                if (!storageMod) throw new Error("Storage module not found");

                // Overwrite the storage
                if (decoded.settings) storageMod.setData(HSGlobal.HSSettings.storageKey, decoded.settings);
                if (decoded.strategies) storageMod.setData(HSGlobal.HSSettings.strategiesKey, decoded.strategies);
                if (decoded.ambrosia) storageMod.setData(HSGlobal.HSAmbrosia.storageKey, decoded.ambrosia);

                HSUI.Notify("Settings imported successfully! Reloading...", { notificationType: "success" });

                // Close modal and reload
                setTimeout(() => location.reload(), 1500);

            } catch (error) {
                HSUI.Notify("Import failed: " + (error as Error).message, { notificationType: "error" });
                HSLogger.error(`Full import failed: ${error}`, HSSettings.#staticContext);
            }
        });
    }

    static async restoreAllModSettings() {
        const storageMod = HSModuleManager.getModule<HSStorage>('HSStorage');

        if (storageMod) {
            HSLogger.info(`Restoring all mod settings to defaults...`, HSSettings.#staticContext);

            // Clear all mod data
            storageMod.clearData(HSGlobal.HSSettings.storageKey);
            storageMod.clearData(HSGlobal.HSSettings.strategiesKey);
            storageMod.clearData(HSGlobal.HSAmbrosia.storageKey);

            // Reload the page to reset state
            location.reload();
        } else {
            HSLogger.error(`Could not find HSStorage module for restoration`, HSSettings.#staticContext);
        }
    }

    static async editSelectedStrategy() {
        const strategySetting = HSSettings.getSetting("autosingStrategy");
        const selectedValue = strategySetting.getValue();

        if (!selectedValue || selectedValue === '') {
            HSUI.Notify("Please select a strategy to edit", {
                notificationType: "warning"
            });
            return;
        }

        const control = strategySetting.getDefinition().settingControl;
        if (!control?.selectOptions) return;

        const selectedOption = control.selectOptions.find(opt => opt.value.toString() === selectedValue);
        if (!selectedOption) return;

        const strategies = HSSettings.getStrategies();
        const strategy = strategies.find(s => s.strategyName === selectedOption.text);

        if (!strategy) {
            HSUI.Notify("Cannot edit selected strategy", {
                notificationType: "error"
            });
            return;
        }
        if (strategy.strategyName == "default_strategy") {
            HSUI.Notify("cannot edit default strategy")
            return;
        }

        await HSAutosingStrategyModal.open(strategy, selectedValue as number);
    }

    static saveSettingsToStorage() {
        if (this.#saveTimeout) {
            clearTimeout(this.#saveTimeout);
        }

        this.#saveTimeout = setTimeout(() => {
            const storageMod = HSModuleManager.getModule<HSStorage>('HSStorage');

            if (storageMod) {
                const serializedSettings = this.#serializeSettings();
                const saved = storageMod.setData(HSGlobal.HSSettings.storageKey, serializedSettings);

                if (!saved) {
                    HSLogger.warn(`Could not save settings to localStorage`, this.#staticContext);
                } else {
                    HSLogger.debug(`<green>Settings saved to localStorage</green>`, this.#staticContext);
                }
            }
            this.#saveTimeout = undefined;
        }, 250);
    }

    // Parses the default strategies read from strategies.json
    #parseDefaultStrategies(): HSAutosingStrategy[] {
        const defaultStrategies = JSON.parse(strategies) as HSAutosingStrategy[];

        for (const strategy of defaultStrategies) {
            if (!strategy) continue;
            HSSettings.validateStrategy(strategy);
        }

        return defaultStrategies as HSAutosingStrategy[];
    }

    // Parses the default settings read from settings.json
    #parseDefaultSettings(): HSSettingsDefinition {
        const defaultSettings = JSON.parse(settings) as Partial<HSSettingsDefinition>;

        for (const [key, setting] of Object.typedEntries<Partial<HSSettingsDefinition>>(defaultSettings)) {
            if (!setting) continue;

            if (setting.settingType === 'boolean' || HSUtils.isBoolean(setting.settingValue)) {
                (setting as any).settingValue = false;
            }

            // Try fixing select type settings if they're missing some things
            if (setting.settingType === 'selectnumeric' || setting.settingType === 'selectstring') {
                // If there is no (default) value defined, define it as empty string
                if (!("settingValue" in setting))
                    (setting as any).settingValue = "";

                // Make sure that the selectOptions contains a default option with value ""
                if ("settingControl" in setting && setting.settingControl) {
                    const settingControl = setting.settingControl;

                    if ("selectOptions" in settingControl && settingControl.selectOptions) {
                        const hasDefaultOption = settingControl.selectOptions.find(option => {
                            return option.value === "";
                        });

                        if (!hasDefaultOption) {
                            settingControl.selectOptions.unshift({
                                text: "None",
                                value: ""
                            });
                        }
                    }
                }
            }

            if (setting.settingType === 'numeric' || setting.settingType === 'selectnumeric' || HSUtils.isNumeric(setting.settingValue)) {
                if (!('settingValueMultiplier' in setting as any))
                    (setting as any).settingValueMultiplier = 1;
            }

            if (setting.settingType === 'state') {
                if (!("settingValue" in setting))
                    (setting as any).settingValue = "<red>null</red>";
            }

            this.#validateSetting(setting, HSSettings.#settingsControlGroups);
        }

        return defaultSettings as HSSettingsDefinition;
    }

    // Loads and parses stored autosingStrategies
    #parseStoredStrategies(): HSAutosingStrategy[] | null {
        const storageMod = HSModuleManager.getModule<HSStorage>('HSStorage');

        if (!storageMod) {
            HSLogger.warn(`Could not find HSStorage module`, this.context);
            return null;
        }
        const loaded = storageMod.getData<HSAutosingStrategy[]>(HSGlobal.HSSettings.strategiesKey);

        if (loaded) {
            return Array.isArray(loaded) ? loaded : [loaded];
        }

        return null;
    }


    // Loads and parses settings from local storage as JSON
    #parseStoredSettings(): Partial<HSSettingsDefinition> | null {
        const storageMod = HSModuleManager.getModule<HSStorage>('HSStorage');

        if (storageMod) {
            const loaded = storageMod.getData<string>(HSGlobal.HSSettings.storageKey);

            if (loaded) {
                return JSON.parse(loaded) as Partial<HSSettingsDefinition>;
            } else {
                HSLogger.warn(`Could not load settings from localStorage`, this.context);
                return null;
            }
        } else {
            HSLogger.warn(`Could not find HSStorage module`, this.context);
            return null;
        }
    }

    #addStrategiesToOptions(strategies: HSAutosingStrategy[]) {
        for (const strategy of strategies) {
            if (strategy.strategyName === undefined) {
                throw new Error('Strategy name is missing. Cannot add strategy to options.');
            }
        }

        for (const strategy of strategies) {
            HSSettings.#addStrategyToOptions(strategy);
        }
    }

    static #removeStrategyFromOptions(strategyName: string) {
        const setting = this.getSetting("autosingStrategy");
        const control = setting.getDefinition().settingControl;

        if (!control?.selectOptions) return;
        const optionIndex = control.selectOptions.findIndex(o => o.text === strategyName);

        if (optionIndex !== -1) {
            const optionValue = control.selectOptions[optionIndex].value;
            control.selectOptions.splice(optionIndex, 1);
            const selectEl = document.querySelector(
                `#${control.controlId}`
            ) as HTMLSelectElement | null;

            if (selectEl) {
                const optionToRem = selectEl.querySelector(`option[value="${optionValue}"]`);
                if (optionToRem) {
                    optionToRem.remove();
                }
            }
        }
    }

    static #addStrategyToOptions(strategy: HSAutosingStrategy) {
        const setting = this.getSetting("autosingStrategy");
        const control = setting.getDefinition().settingControl;

        if (!control?.selectOptions) return;

        const nextValue =
            control.selectOptions.length > 0
                ? Math.max(...control.selectOptions.map(o => Number(o.value))) + 1
                : 1;

        control.selectOptions.push({
            text: strategy.strategyName,
            value: nextValue
        });

        // Update DOM if already rendered
        const selectEl = document.querySelector(
            `#${control.controlId}`
        ) as HTMLSelectElement | null;

        if (selectEl) {
            const option = document.createElement("option");
            option.value = String(nextValue);
            option.textContent = strategy.strategyName;
            selectEl.appendChild(option);
        }
    }

    #resolveSettings(): HSSettingsDefinition {
        const defaultSettings = this.#parseDefaultSettings();
        const defaultStrategies = this.#parseDefaultStrategies();
        HSSettings.#strategies.push(...defaultStrategies)

        try {
            const loadedSettings = this.#parseStoredSettings();
            const loadedStrategies = this.#parseStoredStrategies();

            if (loadedStrategies) {
                HSSettings.#strategies.push(...loadedStrategies);
            }
            const resolved = JSON.parse(JSON.stringify(defaultSettings));

            if (loadedSettings) {
                HSLogger.log(`<green>Found settings from localStorage!</green>`, this.context);

                // Process each top-level key that exists in defaultSettings (A)
                Object.keys(defaultSettings).forEach(topLevelKey => {
                    // Skip if this top-level key doesn't exist in loadedSettings (B)
                    if (!(topLevelKey in loadedSettings)) return;

                    // For each property in the top-level object in loadedSettings (B)
                    // If it exists in defaultSettings (A), use B's value
                    // This preserves new properties in A that don't exist in B
                    Object.keys((loadedSettings as any)[topLevelKey]).forEach(nestedKey => {
                        if (nestedKey in (defaultSettings as any)[topLevelKey]) {
                            const bValue = (loadedSettings as any)[topLevelKey][nestedKey];

                            // If this is a nested object (but not an array), recursively merge
                            if (
                                bValue !== null &&
                                typeof bValue === 'object' &&
                                !Array.isArray(bValue) &&
                                typeof (defaultSettings as any)[topLevelKey][nestedKey] === 'object' &&
                                !Array.isArray((defaultSettings as any)[topLevelKey][nestedKey])
                            ) {
                                // For nested objects, preserve structure from A but override with values from B
                                // where the keys exist in both
                                const mergedNestedObj = {
                                    ...((defaultSettings as any)[topLevelKey][nestedKey]), // Start with all properties from A
                                };

                                // Override with B's values where they exist
                                Object.keys(bValue).forEach(deepKey => {
                                    if (deepKey in mergedNestedObj) {
                                        mergedNestedObj[deepKey] = bValue[deepKey];
                                    }
                                });

                                // Update the resolved object
                                (resolved as any)[topLevelKey][nestedKey] = mergedNestedObj;
                            } else {
                                // For primitive values or arrays, just use B's value directly
                                (resolved as any)[topLevelKey][nestedKey] = bValue;
                            }
                        }
                        // If nestedKey doesn't exist in A, we ignore it (doesn't get copied to resolved)
                    });
                });
                return resolved as HSSettingsDefinition;
            } else {
                return defaultSettings;
            }
        } catch (err) {
            HSLogger.error(`Error while resolving settings`, this.context);
            console.log(err);
            return defaultSettings;
        }
    }

    static async #settingChangeDelegate(e: Event, settingObj: HSSetting<HSSettingType>) {
        await settingObj.handleChange(e);
    }

    static async #settingToggleDelegate(e: MouseEvent, settingObj: HSSetting<HSSettingType>) {
        await settingObj.handleToggle(e);
    }

    static dumpToConsole() {
        console.log('------------------ HYPERSYNERGISM CURRENT SETTINGS DUMP START ------------------');
        if (this.#settings)
            console.log(this.#settings);
        else
            console.log('NO SETTINGS FOUND (wtf)');
        console.log('------------------ HYPERSYNERGISM CURRENT SETTINGS DUMP END ------------------');
    }
}