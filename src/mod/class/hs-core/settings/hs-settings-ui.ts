import { HSSettingBase, HSSettingControl, HSSettingControlGroup, HSSettingControlPage, HSSettingRecord, HSSettingsDefinition, HSSettingType } from "../../../types/module-types/hs-settings-types";
import { HSModuleManager } from "../module/hs-module-manager";
import { HSAmbrosia } from "../../hs-modules/hs-ambrosia";
import { HSStorage } from "../hs-storage";
import { HSUI } from "../hs-ui";
import { HSGlobal } from "../hs-global";
import { HSUIC } from "../hs-ui-components";
import { HSInputType, HSUICSelectOption } from "../../../types/module-types/hs-ui-types";
import { HSLogger } from "../hs-logger";
import { HSSetting } from "./hs-setting";
import { HSSettings } from "./hs-settings";
import { HSStrategyManager } from "./hs-strategy-manager";
import { HSAutosingStrategyModal } from "../../hs-modules/hs-autosing/ui/hs-autosing-strategy-modal";
import { HSUtils } from "../../hs-utils/hs-utils";
import { HSAutosingStrategy } from "../../../types/module-types/hs-autosing-types";
import sIconB64 from "inline:../../../resource/txt/s_icon.txt";

type HSSettingBaseWithHidden<T extends HSSettingType> = HSSettingBase<T> & { hidden?: boolean };

export interface HSSettingsUIDependencies {
    settingsParsed: boolean;
    settings: HSSettingRecord;
    settingsControlGroups: Record<string, HSSettingControlGroup>;
    settingsControlPages: Record<keyof HSSettingControlPage, HSSettingControlPage>;
    settingEnabledString: string;
    settingDisabledString: string;
    settingChangeDelegate: (e: Event, settingObj: HSSetting<HSSettingType>) => Promise<void>;
    settingToggleDelegate: (e: MouseEvent, settingObj: HSSetting<HSSettingType>) => Promise<void>;
}

export class HSSettingsUI {
    static readonly #context = 'HSSettingsUI';

    static async syncSettings(deps: HSSettingsUIDependencies): Promise<void> {
        HSLogger.log(`Syncing mod settings`, this.#context);

        if (!deps.settingsParsed) {
            HSLogger.error(`Could not sync settings - settings not parsed yet`, this.#context);
            return;
        }

        for (const [, settingObj] of Object.typedEntries(deps.settings)) {
            const setting = settingObj.getDefinition();
            const controlSettings = settingObj.hasControls() ? setting.settingControl : undefined;

            if (controlSettings) {
                const controlType = controlSettings.controlType;
                const controlOptions = controlSettings.controlOptions;

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

                        valueElement.value = HSUtils.asString(setting.settingValue);
                        valueElement.addEventListener('change', async (e) => { await deps.settingChangeDelegate(e, settingObj); });
                    }
                } else if (controlType === "select") {
                    const settingValue = HSUtils.asString(setting.settingValue);
                    const selectElement = document.querySelector(`#${controlSettings.controlId}`) as HTMLSelectElement;

                    if (selectElement) {
                        if (selectElement.multiple) {
                            const values = setting.settingValue;
                            if (Array.isArray(values)) {
                                for (const option of Array.from(selectElement.options)) {
                                    option.selected = values.includes(option.value);
                                }
                            } else {
                                for (const option of Array.from(selectElement.options)) {
                                    option.selected = false;
                                }
                            }
                        } else {
                            const optionExists = Array.from(selectElement.options).some(option => option.value === settingValue);

                            if (optionExists) {
                                selectElement.value = settingValue;
                            } else {
                                selectElement.value = "";
                                HSLogger.warn(`Setting value ${settingValue} does not exist in select options for setting ${setting.settingName}`, this.#context);
                            }
                        }

                        selectElement.addEventListener('change', async (e) => { await deps.settingChangeDelegate(e, settingObj); });
                    }
                } else if (controlType === "state") {
                    const settingValue = HSUtils.parseColorTags(HSUtils.asString(setting.settingValue));
                    const stateElement = document.querySelector(`#${controlSettings.controlId}`) as HTMLSelectElement;

                    if (stateElement) {
                        stateElement.innerHTML = settingValue;
                    }
                } else if (controlType === "button") {
                    const buttonElement = document.querySelector(`#${controlSettings.controlId}`) as HTMLButtonElement;

                    if (buttonElement) {
                        buttonElement.addEventListener('click', async (e) => { await deps.settingChangeDelegate(e, settingObj); });
                    }
                }

                if (controlSettings.controlEnabledId) {
                    const toggleElement = document.querySelector(`#${controlSettings.controlEnabledId}`) as HTMLDivElement;

                    if (toggleElement) {
                        if (setting.enabled) {
                            toggleElement.innerText = deps.settingEnabledString;
                            toggleElement.classList.remove('hs-disabled');
                        } else {
                            toggleElement.innerText = deps.settingDisabledString;
                            toggleElement.classList.add('hs-disabled');
                        }

                        toggleElement.addEventListener('click', async (e) => { await deps.settingToggleDelegate(e, settingObj); });
                    }
                }

                await settingObj.initialAction("state", setting.enabled);
            }
        }

        HSLogger.log(`Finished syncing mod settings`, this.#context);
        this.applyHiddenVanillaTabsSetting();
    }

    static applyHiddenVanillaTabsSetting(): void {
        const setting = HSSettings.getSetting('hiddenVanillaTabs');
        if (!setting) return;

        const hiddenVanillaTabs = setting.getValue();
        if (!Array.isArray(hiddenVanillaTabs)) return;

        const tabElements = document.querySelectorAll<HTMLElement>('#tabrow > button');
        for (const tabElement of Array.from(tabElements)) {
            if (!tabElement.id) continue;
            tabElement.style.display = hiddenVanillaTabs.includes(tabElement.id) ? 'none' : '';
        }
    }

    static filterLoadoutSelectOptions(options: HSUICSelectOption[], maxLoadouts: number): HSUICSelectOption[] {
        return options.filter((option) => {
            const valueRaw = option.value;

            if (valueRaw === "" || String(valueRaw).toLowerCase() === "none")
                return true;

            const parsed = parseInt(String(valueRaw), 10);
            if (Number.isInteger(parsed)) {
                if (parsed <= 0) return false;
                if (parsed > maxLoadouts) return false;
                return true;
            }
            return true;
        });
    }

    static refreshAmbrosiaLoadoutDropdowns(): void {
        const getSettings = HSSettings.getSettings;
        const ambrosiaMod = HSModuleManager.getModule<HSAmbrosia>('HSAmbrosia');
        if (!ambrosiaMod) {
            HSLogger.warn(`HSAmbrosia module not found. Dropdown lists for Ambrosia loadouts defaulted to 16.`, HSSettingsUI.#context);
            return;
        }

        const count = ambrosiaMod.getAmbrosiaLoadoutsAmount();
        const maxLoadouts = count > 0 ? count : 16;

        const settingsEntries = Object.typedEntries(getSettings());
        for (const [, setting] of settingsEntries) {
            const control = setting.getDefinition().settingControl;
            if (!control || !control.selectOptions) continue;
            if (!control.selectOptions.some((option) => /loadout\s*\d+/i.test(option.text))) continue;

            const filtered = this.filterLoadoutSelectOptions(control.selectOptions, maxLoadouts);
            control.selectOptions = filtered;

            const currentValue = setting.getValue();
            if (currentValue && currentValue !== '' && !filtered.some(opt => String(opt.value) === String(currentValue))) {
                setting.setValue('');
            }

            const htmlSelect = document.querySelector(`#${control.controlId}`) as HTMLSelectElement | null;
            if (htmlSelect) {
                htmlSelect.innerHTML = '';
                for (const option of filtered) {
                    const opt = document.createElement('option');
                    opt.value = String(option.value);
                    opt.text = option.text;
                    if (String(option.value) === String(currentValue)) {
                        opt.selected = true;
                    }
                    htmlSelect.appendChild(opt);
                }
            }
        }
    }

    static autoBuildSettingsUI(deps: HSSettingsUIDependencies): { didBuild: boolean; navHTML: string; pagesHTML: string } {
        if (!deps.settingsParsed) {
            HSLogger.error(`Could not build settings UI - settings not parsed yet`, this.#context);
            return { didBuild: false, navHTML: '', pagesHTML: '' };
        }

        const sortedSettings = this.#sortSettingsByControlGroup(deps.settings, deps.settingsControlGroups);
        const sortedPages = this.#sortPagesByOrder(deps.settingsControlPages);
        const navHTML = this.#buildSubTabNav(sortedPages, sortedSettings);
        const { didBuild, pagesHTML } = this.#buildPagesHTML(sortedSettings, deps.settingsControlGroups);

        return {
            didBuild,
            navHTML,
            pagesHTML: Array.from(pagesHTML.values()).flat().join('')
        };
    }

    static updateStrategyDropdownList(): void {
        const setting = HSSettings.getSetting("autosingStrategy");
        const control = setting.getDefinition().settingControl;
        if (!control?.selectOptions) return;

        const { defaultStrategiesOptions, userStrategiesOptions } = HSSettings.getMergedStrategyOptions();
        control.selectOptions.length = 0;
        control.selectOptions.push(...defaultStrategiesOptions, ...userStrategiesOptions);

        let savedStrategy = undefined;
        const storageMod = HSModuleManager.getModule<HSStorage>("HSStorage");
        if (storageMod && typeof storageMod.getData === "function") {
            let settingsData = storageMod.getData(HSGlobal.HSSettings.storageKey);
            if (settingsData) {
                const parsed = typeof settingsData === "string" ? JSON.parse(settingsData) : settingsData;
                if (parsed && parsed.autosingStrategy && parsed.autosingStrategy.settingValue) {
                    savedStrategy = parsed.autosingStrategy.settingValue;
                }
            }
        }

        const selectEl = document.querySelector(`#${control.controlId}`) as HTMLSelectElement | null;
        if (selectEl) {
            selectEl.innerHTML = "";
            if (defaultStrategiesOptions.length > 0) {
                const optgroupDefault = document.createElement('optgroup');
                optgroupDefault.label = 'Default Strategies';
                for (const opt of defaultStrategiesOptions) {
                    const option = document.createElement('option');
                    option.text = opt.text;
                    option.value = String(opt.value);
                    option.setAttribute('data-default', 'true');
                    optgroupDefault.appendChild(option);
                }
                selectEl.appendChild(optgroupDefault);
            }

            if (userStrategiesOptions.length > 0) {
                const optgroupUser = document.createElement('optgroup');
                optgroupUser.label = 'User Strategies';
                for (const opt of userStrategiesOptions) {
                    const option = document.createElement('option');
                    option.text = opt.text;
                    option.value = String(opt.value);
                    option.setAttribute('data-default', 'false');
                    optgroupUser.appendChild(option);
                }
                selectEl.appendChild(optgroupUser);
            }

            let toSelect = savedStrategy;
            if (!toSelect || !Array.from(selectEl.options).some(opt => opt.value === toSelect)) {
                if (selectEl.options.length > 0) {
                    toSelect = selectEl.options[0].value;
                }
            }
            if (toSelect) {
                selectEl.value = toSelect;
                setting.setValue(toSelect);
            }
            HSLogger.log(`Strategy dropdown rebuilt with ${defaultStrategiesOptions.length} default and ${userStrategiesOptions.length} user strategies. Selected: ${toSelect}`, this.#context);
        }
    }

    static selectAutosingStrategyByName(strategyName: string): void {
        const setting = HSSettings.getSetting("autosingStrategy");
        const control = setting.getDefinition().settingControl;
        if (control?.selectOptions) {
            const selectEl = document.querySelector(`#${control.controlId}`) as HTMLSelectElement | null;
            if (selectEl) {
                selectEl.value = strategyName;
            }
            setting.setValue(strategyName);
        } else {
            HSLogger.warn(`Could not select autosing strategy '${strategyName}' because control is unavailable`, this.#context);
        }
    }

    static #sortSettingsByControlGroup(
        settings: HSSettingRecord,
        controlGroups: Record<string, HSSettingControlGroup>,
    ): [string, HSSetting<HSSettingType>][] {
        return Object.entries(settings).sort((a, b) => {
            const aControlGroup = a[1].getDefinition().settingControl?.controlGroup;
            const bControlGroup = b[1].getDefinition().settingControl?.controlGroup;

            if (aControlGroup && bControlGroup) {
                return (controlGroups[aControlGroup].order || 0) - (controlGroups[bControlGroup].order || 0);
            } else if (aControlGroup) {
                return -1;
            } else if (bControlGroup) {
                return 1;
            }
            return 0;
        });
    }

    static #sortPagesByOrder(pages: Record<keyof HSSettingControlPage, HSSettingControlPage>): [keyof HSSettingControlPage, HSSettingControlPage][] {
        return (Object.entries(pages) as [keyof HSSettingControlPage, HSSettingControlPage][]).sort((a, b) => {
            const aPage = a[1].order;
            const bPage = b[1].order;

            if (aPage && bPage) {
                return (aPage || 0) - (bPage || 0);
            } else if (aPage) {
                return -1;
            } else if (bPage) {
                return 1;
            }
            return 0;
        });
    }

    static #buildSubTabNav(
        sortedPages: [keyof HSSettingControlPage, HSSettingControlPage][],
        sortedSettings: [string, HSSetting<HSSettingType>][],
    ): string {
        const subTabs: string[] = [];

        for (const [key, page] of sortedPages) {
            const haveAnySettingsForPage = sortedSettings.some(setting => setting[1].getDefinition().settingControl?.controlPage === key);
            if (!haveAnySettingsForPage) continue;

            subTabs.push(HSUIC.Div({
                class: 'hs-panel-subtab',
                id: `hs-panel-settings-subtab-${key}`,
                data: new Map([['subtab', key], ['color', page.pageColor || '']]),
                props: {
                    style: page.pageColor ? `--hs-panel-subtab-border-color: ${page.pageColor};` : ''
                },
                html: page.pageName
            }));
        }

        return HSUIC.Div({
            class: 'hs-panel-subtabs',
            html: subTabs
        });
    }

    static #buildPagesHTML(
        sortedSettings: [string, HSSetting<HSSettingType>][],
        controlGroups: Record<string, HSSettingControlGroup>,
    ) {
        const pagesHTML: Map<keyof HSSettingControlPage, string[]> = new Map();
        let didBuild = true;
        let currentControlGroup: string | null = null;

        for (const [key, settingObj] of sortedSettings) {
            const setting = settingObj.getDefinition() as HSSettingBaseWithHidden<HSSettingType>;

            if (setting.hidden === true) continue;

            const controls = setting.settingControl;
            if (!controls) {
                HSLogger.error(`Error autobuilding settings UI, controls not defined for setting ${key}`, this.#context);
                didBuild = false;
                break;
            }

            const pageHTMLs = pagesHTML.get(controls.controlPage) || [];

            if (controls.controlGroup !== currentControlGroup) {
                currentControlGroup = controls.controlGroup;
                const controlGroup = controlGroups[controls.controlGroup];
                pageHTMLs.push(HSUIC.Div({
                    class: 'hs-panel-grid-section-header',
                    html: controlGroup.groupName
                }));
            }

            const blockHTML = this.#buildSettingBlock(settingObj, setting, controls);
            if (!blockHTML) {
                didBuild = false;
                break;
            }

            pageHTMLs.push(blockHTML);
            pagesHTML.set(controls.controlPage, pageHTMLs);
        }

        for (const [pageName, pages] of pagesHTML.entries()) {
            pagesHTML.set(pageName, [HSUIC.Div({
                class: 'hs-panel-settings-grid',
                id: `settings-grid-${pageName}`,
                html: pages
            })]);
        }

        return { didBuild, pagesHTML };
    }

    static #buildSettingBlock(
        settingObj: HSSetting<HSSettingType>,
        setting: HSSettingBaseWithHidden<HSSettingType>,
        controls: HSSettingControl,
    ): string | null {
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

        const components: string[] = [];

        if (controls.controlType === 'switch') {
            components.push(this.#buildSettingTextWrapper(setting, controls, gameDataIcon));
        } else if (controls.controlType === 'button') {
            components.push(HSUIC.Button({
                id: controls.controlId!,
                text: setting.settingDescription || 'Error: No button text'
            }));
        } else {
            const convertedType = this.#resolveControlTypeInput(controls.controlType);
            if (!convertedType) {
                HSLogger.error(`Error autobuilding settings UI, control type resolution failed (how??)`, this.#context);
                return null;
            }

            components.push(this.#buildSettingTextWrapper(setting, controls, gameDataIcon));
            const valueRowChildren = this.#buildSettingValueChildren(controls, convertedType, setting);
            if (!valueRowChildren) return null;

            if (controls.controlEnabledId) {
                components.push(HSUIC.Div({
                    class: 'hs-panel-setting-block-input-row',
                    html: valueRowChildren
                }));
            } else {
                components.push(...valueRowChildren);
            }
        }

        let blockClass = 'hs-panel-setting-block';
        if (controls.controlType === 'button' && controls.controlGroup === 'auto-sing-strategy-controls') {
            blockClass += ' hs-inline-button';
        }

        return HSUIC.Div({
            id: setting.settingBlockId,
            class: blockClass,
            html: components
        });
    }

    static #resolveControlTypeInput(controlType: string): HSInputType | null {
        switch (controlType) {
            case 'text':
                return HSInputType.TEXT;
            case 'number':
                return HSInputType.NUMBER;
            case 'select':
                return HSInputType.SELECT;
            case 'state':
                return HSInputType.STATE;
            default:
                return null;
        }
    }

    static #buildSettingTextWrapper(setting: HSSettingBase<HSSettingType>, controls: HSSettingControl, gameDataIcon: string) {
        const children: string[] = [];
        if (controls.controlEnabledId) {
            children.push(HSUIC.Button({
                class: 'hs-panel-setting-block-btn',
                id: controls.controlEnabledId,
                text: ''
            }));
        }

        children.push(HSUIC.P({
            class: 'hs-panel-setting-block-text',
            props: { title: setting.settingHelpText },
            text: setting.settingDescription
        }));

        if (gameDataIcon) {
            children.push(gameDataIcon);
        }

        return HSUIC.Div({
            class: 'hs-panel-setting-block-text-wrapper',
            html: children
        });
    }

    static #buildSettingValueChildren(
        controls: HSSettingControl,
        convertedType: HSInputType,
        setting: HSSettingBase<HSSettingType>,
    ) {
        const valueRowChildren: string[] = [];

        if (convertedType === HSInputType.NUMBER || convertedType === HSInputType.TEXT) {
            valueRowChildren.push(HSUIC.Input({
                class: 'hs-panel-setting-block-num-input',
                id: controls.controlId,
                type: convertedType
            }));
        } else if (convertedType === HSInputType.SELECT) {
            if (controls.selectOptions && controls.controlId === 'hs-setting-auto-sing-strategy') {
                const { defaultStrategiesOptions, userStrategiesOptions } = HSSettings.getMergedStrategyOptions();
                controls.selectOptions.length = 0;
                controls.selectOptions.push(...defaultStrategiesOptions, ...userStrategiesOptions);
                HSLogger.log(`Merged strategy options for select input: ${controls.selectOptions.length} total options (${defaultStrategiesOptions.length} default, ${userStrategiesOptions.length} user)`, this.#context);
            }

            if (!controls.selectOptions) {
                HSLogger.error(`Error autobuilding settings UI, ${setting.settingName} does not have selectOptions defined`, this.#context);
                return null;
            }

            valueRowChildren.push(HSUIC.Select({
                class: 'hs-panel-setting-block-select-input',
                id: controls.controlId,
                type: convertedType,
                props: controls.props
            }, controls.selectOptions));
        } else if (convertedType === HSInputType.STATE) {
            valueRowChildren.push(HSUIC.P({
                class: 'hs-panel-setting-block-state',
                id: controls.controlId,
                text: ''
            }));
        }

        return valueRowChildren;
    }

    static async deleteSelectedStrategy(): Promise<void> {
        const strategySetting = HSSettings.getSetting("autosingStrategy");
        const selectedValue = strategySetting.getValue();
        if (!selectedValue || selectedValue === '') {
            HSUI.Notify("Please select a strategy to delete", { notificationType: "warning" });
            return;
        }

        const control = strategySetting.getDefinition().settingControl;
        if (!control?.selectOptions) {
            HSUI.Notify("Strategy dropdown not available", { notificationType: "error" });
            return;
        }

        const selectedOption = control.selectOptions.find(opt => opt.value.toString() === selectedValue);
        if (!selectedOption) {
            HSUI.Notify("Selected strategy not found in dropdown", { notificationType: "error" });
            return;
        }

        const strategyName = selectedOption.value.toString();
        const defaultNames = HSSettings.getDefaultStrategyNames();
        if (defaultNames.includes(strategyName)) {
            HSUI.Notify("You cannot delete default strategies.", { notificationType: "warning" });
            return;
        }

        if (!confirm(`Are you sure you want to delete strategy "${strategyName}"?`)) {
            return;
        }

        const saved = HSStrategyManager.deleteStrategyFromStorage(strategyName, "HSSettings");
        if (!saved) {
            HSUI.Notify("Failed to delete strategy from localStorage", { notificationType: "error" });
            return;
        }

        HSSettingsUI.updateStrategyDropdownList();

        const firstDefault = defaultNames[0];
        if (firstDefault) {
            HSSettingsUI.selectAutosingStrategyByName(firstDefault);
        }

        HSUI.Notify(`Strategy "${strategyName}" deleted. Defaulted to ${firstDefault ? '"' + firstDefault + '"' : 'none'}.`, { notificationType: "success" });
    }

    static async exportSelectedStrategy(): Promise<void> {
        const strategySetting = HSSettings.getSetting("autosingStrategy");
        const selectedValue = strategySetting.getValue();
        if (!selectedValue || selectedValue === '') {
            HSUI.Notify("Please select a strategy to export", { notificationType: "warning" });
            return;
        }

        const control = strategySetting.getDefinition().settingControl;
        if (!control?.selectOptions) {
            HSUI.Notify("Strategy dropdown not available", { notificationType: "error" });
            return;
        }

        const selectedOption = control.selectOptions.find(opt => opt.value.toString() === selectedValue);
        if (!selectedOption) {
            HSUI.Notify("Selected strategy not found in dropdown", { notificationType: "error" });
            return;
        }

        const strategyName = selectedOption.value.toString();
        let strategy = HSSettings.getStrategies().find(s => s.strategyName === strategyName);
        if (!strategy && HSSettings.getDefaultStrategyNames().includes(strategyName)) {
            strategy = await HSSettings.loadDefaultStrategyByName(strategyName) || undefined;
        }

        if (!strategy) {
            HSUI.Notify("Strategy not found - cannot export", { notificationType: "error" });
            return;
        }

        try {
            const strategyJson = JSON.stringify(strategy, null, 2);
            await navigator.clipboard.writeText(strategyJson);
            HSUI.Notify(`Strategy "${strategyName}" copied to clipboard`, { notificationType: "success" });
        } catch {
            HSUI.Notify("Failed to copy strategy to clipboard", { notificationType: "error" });
        }
    }

    static async importStrategy(): Promise<void> {
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

            const cancelBtn = document.querySelector(`#${modalId} #import-strategy-cancel`) as HTMLButtonElement;
            if (cancelBtn) {
                cancelBtn.dataset.close = modalId;
            }

            const submitBtn = document.querySelector(`#${modalId} #import-strategy-submit`) as HTMLButtonElement;
            const nameInput = document.querySelector(`#${modalId} #import-strategy-name`) as HTMLInputElement;
            const jsonInput = document.querySelector(`#${modalId} #import-strategy-json`) as HTMLTextAreaElement;

            jsonInput.addEventListener('input', () => {
                if (nameInput.value.trim()) {
                    return;
                }

                try {
                    const parsed = JSON.parse(jsonInput.value) as Partial<HSAutosingStrategy>;
                    if (parsed && typeof parsed.strategyName === 'string' && parsed.strategyName.trim()) {
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

                if (!strategyName) {
                    HSUI.Notify("Please enter a strategy name", {
                        notificationType: "warning"
                    });
                    return;
                }

                const existingStrategies = HSSettings.getStrategies();
                if (existingStrategies.some(s => s.strategyName === strategyName)) {
                    HSUI.Notify(`Strategy "${strategyName}" already exists`, {
                        notificationType: "warning"
                    });
                    return;
                }

                let parsedStrategy: HSAutosingStrategy;
                try {
                    parsedStrategy = JSON.parse(strategyJson);
                } catch (error) {
                    HSUI.Notify("Invalid JSON format", {
                        notificationType: "error"
                    });
                    return;
                }

                HSSettings.validateStrategy(parsedStrategy);
                parsedStrategy.strategyName = strategyName;

                try {
                    const { saved } = HSStrategyManager.saveStrategyToStorage(parsedStrategy, undefined, "HSSettings");
                    if (!saved) {
                        HSUI.Notify("Failed to save strategy", {
                            notificationType: "error"
                        });
                        return;
                    }

                    // Refresh the dropdown list after import
                    HSSettingsUI.updateStrategyDropdownList();
                    HSSettingsUI.selectAutosingStrategyByName(strategyName);
                    HSLogger.log(`Strategy "${strategyName}" imported and selected.`, "HSSettings");
                    HSUI.Notify(`Strategy "${strategyName}" imported successfully and selected.`, {
                        notificationType: "success"
                    });

                    const modal = document.querySelector(`#${modalId}`) as HTMLDivElement;
                    if (modal) {
                        await modal.transition({ opacity: 0 });
                        modal.parentElement?.removeChild(modal);
                    }
                } catch (error) {
                    HSUI.Notify("Failed to save strategy", {
                        notificationType: "error"
                    });
                    HSLogger.log(`Strategy import failed: ${error}`, "HSSettings");
                }
            });
        } else {
            HSUI.Notify("Failed to find HSUI", {
                notificationType: "error"
            });
        }
    }

    static async editSelectedStrategy(): Promise<void> {
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

        const selectedStrategyName = selectedOption.value.toString();
        const defaultNames = HSSettings.getDefaultStrategyNames();
        const isDefaultStrategy = defaultNames.includes(selectedStrategyName);

        const strategies = HSSettings.getStrategies();
        let strategy = strategies.find(s => s.strategyName === selectedStrategyName);

        if (!strategy && isDefaultStrategy) {
            strategy = await HSSettings.loadDefaultStrategyByName(selectedStrategyName) || undefined;
        }

        if (!strategy) {
            HSUI.Notify("Strategy not found - Cannot edit", {
                notificationType: "error"
            });
            return;
        }

        if (isDefaultStrategy) {
            await HSAutosingStrategyModal.open(strategy, {
                duplicateFromDefault: true,
                suggestedName: `${strategy.strategyName}_copy`
            });
        } else {
            await HSAutosingStrategyModal.open(strategy);
        }
    }
}
