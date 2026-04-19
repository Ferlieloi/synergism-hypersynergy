import { HSModuleDefinition } from "../types/hs-types";
import { HSLogger } from "./hs-core/hs-logger";
import { HSModuleManager } from "./hs-core/module/hs-module-manager";
import { HSUI } from "./hs-core/hs-ui";
import { HSUIC } from "./hs-core/hs-ui-components";
import corruption_ref_b64 from "inline:../resource/txt/corruption_ref.txt";
import corruption_ref_b64_2 from "inline:../resource/txt/corruption_ref_onemind.txt";
import { HSSettings } from "./hs-core/settings/hs-settings";
import { HSSettingsUI } from "./hs-core/settings/hs-settings-ui";
import { HSGlobal } from "./hs-core/hs-global";
import { HSStorage } from "./hs-core/hs-storage";
import overrideCSS from "inline:../resource/css/hs-overrides.css";
import quickbarsCSS from "inline:../resource/css/module/hs-quickbars.css";
import strategyEditionCSS from "inline:../resource/css/hs-strategy-edition.css";
import { HSInputType, HSNotifyPosition, HSNotifyType } from "../types/module-types/hs-ui-types";
import { HSGameDataAPI } from "./hs-core/gds/hs-gamedata-api";
import { HSUtils } from "./hs-utils/hs-utils";
import { HSGithub } from "./hs-core/github/hs-github";

/**
 * Class: Hypersynergism
 * Description: 
 *     Hypersynergism main class.
 *     Instantiates the module manager and handles calls to building the mod's panel and working with mod's settings
 * Author: Swiffy
*/
export class Hypersynergism {
    // Class context, mainly for HSLogger
    #context = 'HSMain';

    #moduleManager: HSModuleManager;
    #isInitialized = false;

    constructor(modulesToEnable: HSModuleDefinition[]) {
        // Instantiate the module manager
        this.#moduleManager = new HSModuleManager('HSModuleManager', modulesToEnable);
    }

    async preprocessModules() {
        await this.#moduleManager.preprocessModules();
    }

    // Called from loader
    async init() {
        if (this.#isInitialized) return;
        this.#isInitialized = true;
        HSGlobal.General.isModFullyLoaded = false;

        // Wait for game to be ready before doing ANYTHING substantial
        if (!await this.#waitForGameReady()) {
            HSLogger.warn("Hypersynergism: Game load timed out, attempting init anyway...", this.#context);
        }

        HSLogger.log("Initialising Hypersynergism modules", this.#context);

        // Now that game is ready, we can process modules (which might init immediate modules like HSUI)
        await this.preprocessModules();
        await this.#moduleManager.initModules();

        HSLogger.log("Building UI Panel", this.#context);
        this.#buildUIPanelContents();

        HSLogger.log("Injecting style overrides", this.#context);
        this.#injectStyleOverrides();

        // Do this after UI Panel stuff is ready, because
        // syncing basically means syncing the UI with the settings
        await HSSettingsUI.syncSettings(HSSettings.getUIDependencies());
        // Mod fully loaded, so we show HS icon, and update the flag
        const hsui = HSModuleManager.getModule<HSUI>('HSUI');
        hsui?.setPanelControlVisible(true);
        HSGlobal.General.isModFullyLoaded = true;

        await HSUI.Notify(`Hypersynergism v${HSGlobal.General.currentModVersion} loaded`, {
            position: 'top',
            notificationType: "success"
        });

        HSGithub.startVersionPolling(HSGlobal.Release.checkIntervalMs);
    }

    async #waitForGameReady(): Promise<boolean> {
        let attempts = 0;
        // Wait up to 30 seconds
        while (attempts < 300) {
            // Check for key DOM element (buildingstab is usually first to appear)
            // We used to check for (window as any).player but it seems flaky/unavailable in some contexts
            // despite the game being ready. The DOM element is a reliable enough proxy.
            if (document.getElementById('buildingstab')) {
                return true;
            }
            await new Promise(r => setTimeout(r, 100));
            attempts++;
        }
        return false;
    }


    // ===============================
    // --- UI panel construction -----
    // ===============================

    #buildUIPanelContents() {
        const hsui = HSModuleManager.getModule<HSUI>('HSUI');

        if (hsui) {
            hsui.updateTitle(`Hypersynergism v${HSGlobal.General.currentModVersion}`);

            this.#buildToolsTab(hsui);
            this.#buildSettingsTab(hsui);
            this.#buildDebugTab(hsui);

            hsui.renameTab(2, 'Tools');
            hsui.renameTab(3, 'Settings');
            hsui.renameTab(4, 'Debug');
        }
    }

    #injectStyleOverrides() {
        HSUI.injectStyle(overrideCSS, 'hs-override-css');
        HSUI.injectStyle(strategyEditionCSS, 'hs-panel-strategy-edition-css');
        HSUI.injectStyle(quickbarsCSS, 'hs-quickbars-css');
    }

    #buildGridSectionHeader(text: string) {
        return HSUIC.Div({
            class: 'hs-panel-grid-section-header',
            html: text
        });
    }

    #buildGridFullSpanDiv(id: string | undefined, html: string) {
        return HSUIC.Div({
            id,
            class: 'hs-panel-grid-full-span',
            html
        });
    }


    // ================================
    // --- Tools tab implementation ---
    // ================================

    #buildToolsTab(hsui: HSUI) {
        const calculationOptions = HSGameDataAPI.getCalculationDefinitions({ toolingSupport: "true" })
            .map((def) => ({
                text: def.supportsReduce ? `${def.calculationName} (C)` : def.calculationName,
                value: def.supportsReduce ? `${def.fnName}|c` : def.fnName,
            }));

        hsui.replaceTabContents(2,
            HSUIC.Grid({
                html: [
                    this.#buildGridSectionHeader('Export tools'),
                    this.#buildGridFullSpanDiv('hs-panel-amb-heater-p', `Export an extended save file string for the <a href="${HSGlobal.General.heaterUrl}" class="hs-link" target="_blank">Ambrosia Heater.</a>`),
                    HSUIC.Button({ id: 'hs-panel-amb-heater-btn', text: 'Export Heater' }),
                    this.#buildGridSectionHeader('References'),
                    HSUIC.Button({ id: 'hs-panel-cor-ref-btn', text: 'Corruption Ref.' }),
                    HSUIC.Button({ id: 'hs-panel-cor-ref-btn-2', text: 'Crpt. Onemind' }),
                    this.#buildGridSectionHeader('Mod links'),
                    HSUIC.Button({ id: 'hs-panel-mod-github-btn', text: 'Mod Github' }),
                    HSUIC.Button({ id: 'hs-panel-mod-wiki-btn', text: 'Mod Wiki' }),
                    HSUIC.Button({ id: 'hs-panel-mod-wiki-features-btn', text: 'Mod Features' }),
                    HSUIC.Button({ id: 'hs-panel-discord-thread-btn', text: 'Discord Thread' }),
                    HSUIC.Button({ id: 'hs-panel-check-version-btn', text: 'CHECK VERSION' }),
                    this.#buildGridSectionHeader('Other tools'),
                    HSUIC.Button({ id: 'hs-panel-dump-settings-btn', text: 'Dump Settings' }),
                    HSUIC.Button({ id: 'hs-panel-dump-gamedata-btn', text: 'Dump Game vars' }),
                    HSUIC.Button({ id: 'hs-panel-exit-exalt-bug-btn', text: 'Fix Exalt Bug' }),
                    HSUIC.Button({ id: 'hs-panel-clear-settings-btn', text: 'CLEAR SETTINGS', styles: { borderColor: 'red' } }),
                    this.#buildGridSectionHeader('Testing tools'),
                    HSUIC.Button({ id: 'hs-panel-test-notify-btn', text: 'Notify test' }),
                    HSUIC.Button({ id: 'hs-panel-test-notify-long-btn', text: 'Notify test 2' }),
                    this.#buildGridSectionHeader('Calculation tools'),
                    this.#buildGridFullSpanDiv('hs-panel-calc-tools-p', `Execute supported calculations and see their results. Calculations denoted with "(C)" support "calculating by components",
                        meaning that the calculation results can be output as an array of components that make up the calculations.<br><br>
                        Note that calculating by components always clears the calculation cache first.`),
                    HSUIC.Select({
                        class: 'hs-panel-setting-block-select-input hs-panel-grid-full-span',
                        id: 'hs-panel-test-calc-sel',
                        type: HSInputType.TEXT
                    }, calculationOptions),
                    HSUIC.Button({ id: 'hs-panel-test-calc-redu-btn', text: 'Calculate reduced', class: 'hs-panel-btn-auto-width' }),
                    HSUIC.Button({ id: 'hs-panel-test-calc-comps-btn', text: 'Calculate components', class: 'hs-panel-btn-auto-width' }),
                    HSUIC.Button({ id: 'hs-panel-test-calc-cache-clear-btn', text: 'Clear cache' }),
                    HSUIC.Button({ id: 'hs-panel-test-calc-cache-dump-btn', text: 'Dump cache' }),
                    this.#buildGridFullSpanDiv('hs-panel-test-calc-latest', ''),
                ],
                styles: {
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gridTemplateRows: '1fr',
                    columnGap: '5px',
                    rowGap: '10px',
                    padding: '5px'
                }
            })
        );

        this.#bindToolsTabEvents(hsui);
    }

    #bindToolsTabEvents(hsui: HSUI) {
        const positions: HSNotifyPosition[] = ["topLeft", "top", "topRight", "right", "bottomRight", "bottom", "bottomLeft", "left"];
        const colors: HSNotifyType[] = ["default", "warning", "error", "success"];
        let p_idx = -1;
        let c_idx = -1;

        this.#bindToolsButton('#hs-panel-amb-heater-btn', async () => {
            const dataModule = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
            if (!dataModule) return;

            const heaterData = await dataModule.dumpDataForHeater();
            if (!heaterData) return;

            const json = JSON.stringify(heaterData);
            const base64 = btoa(json);
            const tsv = HSUtils.base64WithCRLF(base64);
            await navigator.clipboard.writeText(tsv);

            HSUI.Notify('Ambrosia heater data copied to clipboard', {
                position: 'top',
                notificationType: 'success'
            });
        });

        this.#bindToolsButton('#hs-panel-cor-ref-btn', () => {
            hsui.Modal({ htmlContent: `<img class="hs-modal-img" src="${corruption_ref_b64}" />`, needsToLoad: true });
        });

        this.#bindToolsButton('#hs-panel-cor-ref-btn-2', () => {
            hsui.Modal({ htmlContent: `<img class="hs-modal-img" src="${corruption_ref_b64_2}" />`, needsToLoad: true });
        });

        this.#bindToolsButton('#hs-panel-mod-github-btn', () => this.#openUrl(HSGlobal.General.modGithubUrl));
        this.#bindToolsButton('#hs-panel-mod-wiki-btn', () => this.#openUrl(HSGlobal.General.modWikiUrl));
        this.#bindToolsButton('#hs-panel-mod-wiki-features-btn', () => this.#openUrl(HSGlobal.General.modWikiFeaturesUrl));
        this.#bindToolsButton('#hs-panel-discord-thread-btn', () => this.#openUrl(HSGlobal.General.modDiscordThreadUrl));

        this.#bindToolsButton('#hs-panel-dump-settings-btn', () => HSSettings.dumpToConsole());
        this.#bindToolsButton('#hs-panel-dump-gamedata-btn', () => this.#dumpGameData());
        this.#bindToolsButton('#hs-panel-clear-settings-btn', () => this.#clearStoredSettings());
        this.#bindToolsButton('#hs-panel-check-version-btn', () => this.#checkVersion());
        this.#bindToolsButton('#hs-panel-exit-exalt-bug-btn', () => this.#fixExaltBug());
        this.#bindToolsButton('#hs-panel-test-calc-redu-btn', () => this.#runCalculation('reduced'));
        this.#bindToolsButton('#hs-panel-test-calc-comps-btn', () => this.#runCalculation('components'));
        this.#bindToolsButton('#hs-panel-test-calc-cache-clear-btn', () => this.#clearCalcCache());
        this.#bindToolsButton('#hs-panel-test-calc-cache-dump-btn', () => this.#dumpCalcCache());

        this.#bindToolsButton('#hs-panel-test-notify-btn', async () => {
            p_idx = (p_idx + 1) % positions.length;
            c_idx = (c_idx + 1) % colors.length;
            await HSUI.Notify('Test notification', {
                position: positions[p_idx],
                notificationType: colors[c_idx]
            });
        });

        this.#bindToolsButton('#hs-panel-test-notify-long-btn', async () => {
            p_idx = (p_idx + 1) % positions.length;
            c_idx = (c_idx + 1) % colors.length;
            await HSUI.Notify('This is a really very extremely long test notification which tests if the notification works with a long notification test notification ', {
                position: positions[p_idx],
                notificationType: colors[c_idx]
            });
        });
    }

    #bindToolsButton(selector: string, callback: () => void | Promise<void>) {
        document.querySelector(selector)?.addEventListener('click', async () => {
            await callback();
        });
    }


    // ===================================
    // ----- Tools helpers / actions -----
    // ===================================

    #openUrl(url: string) {
        window.open(url, '_blank');
    }

    #clearStoredSettings() {
        const storageMod = HSModuleManager.getModule<HSStorage>('HSStorage');
        if (!storageMod) return;

        storageMod.clearData(HSGlobal.HSSettings.storageKey);
        HSLogger.log('Stored settings cleared', this.#context);
    }

    async #checkVersion() {
        const isLatest = await HSGithub.isLatestTag();

        HSUI.Notify(isLatest
            ? 'You are using the latest version of Hypersynergism!'
            : 'You are NOT using the latest version of Hypersynergism!', {
            position: 'top',
            notificationType: isLatest ? 'success' : 'warning'
        });
    }

    #fixExaltBug() {
        console.log('Attempting to exit an exalt by clicking the active challenge (if any).');

        const singChallengesWrapper = document.querySelector('#singularityChallenges');
        if (!singChallengesWrapper) return;

        const img = singChallengesWrapper.querySelector('img.challenge[style*="background-color: orchid"]') as HTMLElement;
        if (img) {
            console.log('Found active challenge img, clicking:', img);
            img.click();
            return;
        }

        const exposedPlayer = HSGlobal.exposedPlayer;
        if (!exposedPlayer) {
            HSLogger.log('If you are using the bookmark loader, please try again with the TAMPERMONKEY loader instead.', this.#context);
            return;
        }

        if (exposedPlayer.insideSingularityChallenge === false) {
            HSLogger.debug(() => 'No active Exalt found in DOM or exposed stuff... Are you sure you have a bug?', this.#context);
            return;
        }

        exposedPlayer.insideSingularityChallenge = true;
        HSLogger.log('Exalt bug fix done with exposed stuff (?)', this.#context);
    }

    #runCalculation(mode: 'reduced' | 'components') {
        const dataModule = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        const sel = document.querySelector('#hs-panel-test-calc-sel') as HTMLSelectElement | null;
        if (!dataModule || !sel) {
            HSLogger.warn('dataModule or calculation select was null', this.#context);
            return;
        }

        const selValue = sel.value.split('|');
        const calcFnName = selValue[0] as keyof HSGameDataAPI;
        const isComponentMode = mode === 'components';
        const supportsComponent = selValue.includes('c');

        const calcFn = dataModule[calcFnName];
        if (typeof calcFn !== 'function') {
            HSLogger.warn(`${calcFnName} is not a function`, this.#context);
            return;
        }

        const calcFnTyped = calcFn as (...args: unknown[]) => number | number[];

        if (isComponentMode) {
            if (!supportsComponent) {
                HSLogger.warn(`${calcFnName} cannot be calculated by components`, this.#context);
                return;
            }

            dataModule.clearCache();
            const result = calcFnTyped(false);
            if (!Array.isArray(result)) {
                HSLogger.warn(`${calcFnName} did not return an array when expected`, this.#context);
                return;
            }

            const latestDiv = document.querySelector('#hs-panel-test-calc-latest') as HTMLDivElement | null;
            if (latestDiv) {
                latestDiv.innerText = `Last calc result: [${result.toString().split(',').join(', ')}]`;
            }
            console.log(`--- CALCULATED ${calcFnName} ---`);
            console.log(result);
            return;
        }

        const result = calcFnTyped();
        if (Array.isArray(result)) {
            HSLogger.warn(`${calcFnName} returned an array when a number was expected`, this.#context);
            return;
        }

        console.log(`--- CALCULATED ${calcFnName} ---`);
        console.log(result);

        const latestDiv = document.querySelector('#hs-panel-test-calc-latest') as HTMLDivElement | null;
        if (latestDiv) {
            latestDiv.innerText = `Last calc result: ${HSUtils.N(result)}`;
        }
    }

    #clearCalcCache() {
        const dataModule = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        if (!dataModule) return;

        HSLogger.log('Cleared calculation cache', this.#context);
        dataModule.clearCache();
    }

    #dumpCalcCache() {
        const dataModule = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        if (!dataModule) return;

        HSLogger.log('Calculation cache dump', this.#context);
        dataModule.dumpCache();
    }

    #dumpGameData() {
        const dataModule = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        if (!dataModule) return;

        console.log('----- GAME DATA -----');
        console.log(dataModule.getGameData());
        console.log('----- PSEUDO DATA -----');
        console.log(dataModule.getPseudoData());
        console.log('----- CAMPAIGN DATA -----');
        console.log(dataModule.getCampaignData());
        console.log('----- ME DATA -----');
        console.log(dataModule.getMeData());
        console.log('----- EVENT DATA -----');
        console.log(dataModule.getEventData());
    }


    // ===================================
    // --- Settings tab implementation ---
    // ===================================

    #buildSettingsTab(hsui: HSUI) {
        const settingsTabContents = HSSettingsUI.autoBuildSettingsUI(HSSettings.getUIDependencies());

        if (!settingsTabContents.didBuild) return;

        hsui.replaceTabContents(3,
            [settingsTabContents.navHTML, settingsTabContents.pagesHTML].join('')
        );

        this.#bindSettingsTabEvents();
    }

    #bindSettingsTabEvents() {
        document.delegateEventListener('click', '.hs-panel-setting-block-gamedata-icon', (e) => {
            this.#handleGameDataIconClick(e);
        });

        document.delegateEventListener('click', '.hs-panel-subtab', (e) => {
            this.#handleSettingsSubtabClick(e);
        });
    }

    #handleGameDataIconClick(_e: Event) {
        const subtab = document.querySelector('#hs-panel-settings-subtab-gamedata') as HTMLDivElement | null;
        const color = subtab?.dataset.color;

        this.#activateSettingsSubtab('gamedata', subtab, color);

        const gameDataSettingBlock = document.querySelector('#hs-setting-block-gamedata') as HTMLDivElement | null;
        gameDataSettingBlock?.scrollIntoView({
            block: 'start',
            behavior: 'smooth',
        });
    }

    #handleSettingsSubtabClick(e: Event) {
        const target = (e.target as HTMLElement).closest('.hs-panel-subtab') as HTMLDivElement | null;
        const subtab = target?.dataset.subtab;
        const color = target?.dataset.color;

        if (!subtab) return;
        this.#activateSettingsSubtab(subtab, target, color);
    }

    #activateSettingsSubtab(subtab: string, activeTab: HTMLDivElement | null, color?: string) {
        const subSettingsContainer = document.querySelector(`#settings-grid-${subtab}`) as HTMLDivElement | null;
        const allSubSettingContainers = document.querySelectorAll('.hs-panel-settings-grid') as NodeListOf<HTMLDivElement>;
        const allSubTabs = document.querySelectorAll('.hs-panel-subtab') as NodeListOf<HTMLDivElement>;

        if (!subSettingsContainer) return;

        allSubSettingContainers.forEach(container => container.classList.remove('open'));
        allSubTabs.forEach(subTab => subTab.style.backgroundColor = '');

        subSettingsContainer.classList.add('open');
        if (activeTab && color) {
            activeTab.style.backgroundColor = color;
        }
    }


    // ================================
    // --- Debug tab implementation ---
    // ================================

    #buildDebugTab(hsui: HSUI) {
        hsui.replaceTabContents(4,
            HSUIC.Grid({
                class: 'hs-panel-grid-2col',
                html: [
                    this.#buildGridSectionHeader('Mouse'),
                    HSUIC.Div({ id: 'hs-panel-debug-mousepos' }),
                    this.#buildGridSectionHeader('Game Data'),
                    this.#buildGridFullSpanDiv('hs-panel-debug-gamedata-currentambrosia', ''),
                ]
            })
        );
    }

}
