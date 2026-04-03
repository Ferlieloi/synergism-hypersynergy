import { HSModuleOptions } from "../../types/hs-types";
import { SINGULARITY_VIEW } from "../../types/module-types/hs-gamestate-types";
import { HSGameState, SingularityView } from "../hs-core/hs-gamestate";
import { HSLogger } from "../hs-core/hs-logger";
import { HSModule } from "../hs-core/module/hs-module";
import { HSModuleManager } from "../hs-core/module/hs-module-manager";
import { HSElementHooker } from "../hs-core/hs-elementhooker";
import { HSSettings } from "../hs-core/settings/hs-settings";
import { HSSetting } from "../hs-core/settings/hs-setting";
import { HSUtils } from "../hs-utils/hs-utils";
import { HSSettingsDefinition } from "../../types/module-types/hs-settings-types";
import { HSGameDataAPI } from "../hs-core/gds/hs-gamedata-api";
import { goldenQuarkUpgradeMaxLevels, octeractUpgradeMaxLevels } from "../hs-core/gds/stored-vars-and-calculations";
import { GoldenQuarkUpgradeKey, OcteractUpgradeKey } from "../../types/data-types/hs-gamedata-api-types";
import { HSUI } from "../hs-core/hs-ui";
import { HSQOLAutomationQuickbar } from "./hs-qolQuickbarAutomation";
import { HSQOLEventsQuickbar } from "./hs-qolQuickbarEvents";
import { HSQOLCorruptionQuickbar } from "./hs-qolQuickbarCorruption";
import { HSQuickbarManager } from "./hs-qolQuickbarManager";
import type { QUICKBAR_ID } from "./hs-qolQuickbarManager";

/**
 *  Class: HSQOLButtons
 *  IsExplicitHSModule: Yes
 *  Description: 
 *    Hypersynergism module which adds qol buttons to the game.
 *  Author: Swiffy, XxmolkxX, the creator of original autosing script (httpsnet?) (hide gq/oct buttons) and Core (syn UI bar)
*/
export class HSQOLButtons extends HSModule {
    // Tracks active tab visit unsubscribers per SINGULARITY_VIEW. 
    #tabVisitUnsubscribers: Map<SINGULARITY_VIEW, () => void> = new Map();

    #automationQuickbarHandler: HSQOLAutomationQuickbar | null = null;
    #eventsQuickbarHandler: HSQOLEventsQuickbar | null = null;
    #corruptionQuickbarHandler: HSQOLCorruptionQuickbar | null = null;

    #offeringPotion: HTMLElement | null;
    #obtainiumPotion: HTMLElement | null;
    #config: MutationObserverInit;
    #offeringPotionObserver: MutationObserver;
    #obtainiumPotionObserver: MutationObserver;

    constructor(moduleOptions: HSModuleOptions) {
        super(moduleOptions);

        this.#offeringPotion = document.getElementById('offeringPotionHide');
        this.#obtainiumPotion = document.getElementById('obtainiumPotionHide');
        this.#config = { attributes: false, childList: true, subtree: true };

        this.#offeringPotionObserver = new MutationObserver(
            () => this.#offeringMutationTrigger()
        );
        this.#obtainiumPotionObserver = new MutationObserver(
            () => this.#obtainiumMutationTrigger()
        );
    }

    async init(): Promise<void> {
        if (this.isInitialized) return;
        HSLogger.log('Initialising HSQOLButtons module', this.context);
        this.observe();
        this.isInitialized = true;

        // Register tab visit handlers
        // (with the current code, we need them to stay always ON)
        this.#subscribeToTabVisit(
            SINGULARITY_VIEW.SHOP,
            async () => { this.setMaxedGQUpgradesVisibility(); }
        );
        this.#subscribeToTabVisit(
            SINGULARITY_VIEW.OCTERACTS,
            async () => { this.setMaxedOctUpgradesVisibility(); }
        );

        // Any settings-driven feature activation is handled by HSSettings.syncSettings().
        // Only perform module-specific DOM setup here if not settings-driven.
        this.#injectAdd10Button();
        this.injectAFKSwapperToggleButton();
    }

    public getEventsQuickbarSection(): HTMLElement {
        const container = document.createElement('div');
        container.id = 'eventsQuickBar';
        container.className = 'hs-events-quickbar';
        return container;
    }
    
    observe() {
        if (this.#offeringPotion) {
            this.#offeringPotionObserver.observe(this.#offeringPotion, this.#config);
        }
        if (this.#obtainiumPotion) {
            this.#obtainiumPotionObserver.observe(this.#obtainiumPotion, this.#config);
        }
    }

    #offeringMutationTrigger() {
        const moddedButton = document.getElementById('offeringPotionMultiUseButton');

        if (moddedButton === null) {
            const useOfferingPotionButton = document.getElementById('useofferingpotion');
            const buyOfferingPotionButton = document.getElementById('buyofferingpotion');

            if (!useOfferingPotionButton || !buyOfferingPotionButton) {
                HSLogger.warn('Could not find native buttons for use/buy offering potions', this.context);
                return;
            }

            if (useOfferingPotionButton) {
                const clone = useOfferingPotionButton.cloneNode(true) as HTMLElement;
                clone.id = 'offeringPotionMultiUseButton';
                clone.textContent = 'CONSUME 10x';
                clone.addEventListener('click', () => {
                    for (let i = 0; i < 10; i++) useOfferingPotionButton.click();
                });
                useOfferingPotionButton.parentNode?.insertBefore(clone, useOfferingPotionButton.nextSibling);
            }

            if (buyOfferingPotionButton) {
                const clone2 = buyOfferingPotionButton.cloneNode(true) as HTMLElement;
                clone2.id = 'offeringPotionMultiBuyButton';
                clone2.textContent = 'BUY 10x';
                clone2.addEventListener('click', () => {
                    for (let i = 0; i < 10; i++) {
                        buyOfferingPotionButton.click();
                        setTimeout(() => { document.getElementById('ok_confirm')?.click(); }, 1);
                    }
                });
                buyOfferingPotionButton.parentNode?.insertBefore(clone2, buyOfferingPotionButton.nextSibling);
            }

            this.#offeringPotionObserver.disconnect();
            HSLogger.log('Offering potion multi buy / consume buttons injected', this.context);
        }
    };

    #obtainiumMutationTrigger() {
        const moddedButton = document.getElementById('obtainiumPotionMultiUseButton');

        if (moddedButton === null) {
            const useObtainiumPotionButton = document.getElementById('useobtainiumpotion');
            const buyObtainiumPotionButton = document.getElementById('buyobtainiumpotion');

            if (!useObtainiumPotionButton || !buyObtainiumPotionButton) {
                HSLogger.warn('Could not find native buttons for use/buy obtainium potions', this.context);
                return;
            }

            if (useObtainiumPotionButton) {
                const clone = useObtainiumPotionButton.cloneNode(true) as HTMLElement;
                clone.id = 'obtainiumPotionMultiUseButton';
                clone.textContent = 'CONSUME 10x';
                clone.addEventListener('click', () => {
                    for (let i = 0; i < 10; i++) useObtainiumPotionButton.click();
                });
                useObtainiumPotionButton.parentNode?.insertBefore(clone, useObtainiumPotionButton.nextSibling);
            }

            if (buyObtainiumPotionButton) {
                const clone2 = buyObtainiumPotionButton.cloneNode(true) as HTMLElement;
                clone2.id = 'obtainiumPotionMultiBuyButton';
                clone2.textContent = 'BUY 10x';
                clone2.addEventListener('click', () => {
                    for (let i = 0; i < 10; i++) {
                        buyObtainiumPotionButton.click();
                        setTimeout(() => { document.getElementById('ok_confirm')?.click(); }, 1);
                    }
                });
                buyObtainiumPotionButton.parentNode?.insertBefore(clone2, buyObtainiumPotionButton.nextSibling);
            }

            this.#obtainiumPotionObserver.disconnect();
            HSLogger.log('Obtainium potion multi buy / consume buttons injected', this.context);
        }
    };

    async #injectAdd10Button() {
        if (document.getElementById('hs-add-10-btn')) return;

        const container = document.getElementById('addCodeBox');
        if (!container) return;

        const addBtn = container.querySelector('#addCode') as HTMLButtonElement;
        const addAllBtn = container.querySelector('#addCodeAll') as HTMLButtonElement;
        const addOneBtn = container.querySelector('#addCodeOne') as HTMLButtonElement;

        if (!addBtn || !addAllBtn || !addOneBtn) return;

        const add10Btn = document.createElement('button');
        add10Btn.id = 'hs-add-10-btn';
        add10Btn.className = 'hs-add-10-btn';
        add10Btn.textContent = 'Add x10';

        add10Btn.addEventListener('click', async () => {
            addBtn.click();
            const input = document.getElementById('prompt_text') as HTMLInputElement | null;
            if (!input) return;
            input.value = '10';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
            HSUtils.startDialogWatcher();
            await HSUtils.sleep(3);
            HSUtils.stopDialogWatcher();
        });

        // Insert the new button next to the existing buttons.
        addAllBtn.parentNode?.insertBefore(add10Btn, addOneBtn);

        // Force the container and its direct child buttons to share width evenly.
        try {
            container.style.display = 'flex';
            container.style.width = 'auto';
            container.style.maxWidth = '480px';
            container.style.margin = '0 auto';
            container.style.marginBottom = '3px';
            container.style.gap = '0';

            const buttons = Array.from(container.querySelectorAll<HTMLButtonElement>('button'));
            buttons.forEach(b => {
                b.style.flex = '1 1 25%';
                b.style.minWidth = '0';
                b.style.boxSizing = 'border-box';
                b.style.height = '30px';
                b.style.padding = '4px 8px';
                b.style.whiteSpace = 'nowrap';
                b.style.overflow = 'hidden';
                b.style.textOverflow = 'ellipsis';
                b.style.display = 'inline-flex';
                b.style.alignItems = 'center';
                b.style.justifyContent = 'center';
            });
        } catch (e) {
            HSLogger.log(`Failed to apply inline layout styles for addCodeBox: ${e}`, this.context);
        }
    }

    public async setMaxedOctUpgradesVisibility(): Promise<void> {
        const hideMaxedOctUpgradesSetting = HSSettings.getSetting('hideMaxedOctUpgrades') as HSSetting<boolean>;
        if (hideMaxedOctUpgradesSetting.getValue()) {
            await this.#hideButtons<OcteractUpgradeKey>(
                'singularityOcteracts',
                '.octeractUpgrade',
                (key) => octeractUpgradeMaxLevels[key]?.maxLevel,
                (gameData, key) => gameData.octUpgrades[key]?.level ?? 0
            );
        } else {
            await this.#unhideButtons('singularityOcteracts', '.octeractUpgrade');
        }
    }

    public async setMaxedGQUpgradesVisibility(): Promise<void> {
        const hideMaxedGQUpgradesSetting = HSSettings.getSetting('hideMaxedGQUpgrades') as HSSetting<boolean>;
        if (hideMaxedGQUpgradesSetting.getValue()) {
            await this.#hideButtons<GoldenQuarkUpgradeKey>(
                'actualSingularityUpgradeContainer',
                '.singularityUpgrade',
                (key) => goldenQuarkUpgradeMaxLevels[key]?.maxLevel,
                (gameData, key) => gameData.goldenQuarkUpgrades[key]?.level ?? 0
            );
        } else {
            await this.#unhideButtons('actualSingularityUpgradeContainer', '.singularityUpgrade');
        }
    }

    async #unhideButtons(containerId: string, selector: string): Promise<void> {
        try {
            const container = await HSElementHooker.HookElement(`#${containerId}`, undefined, 2000);
            const buttons = container.querySelectorAll<HTMLButtonElement>(selector);
            buttons.forEach(button => button.style.display = '');
        } catch (e) {
            HSLogger.warn(`#unhideButtons: Could not find #${containerId} or matching buttons: ${e}`, this.context);
        }
    }

    async #hideButtons<TUpgradeKey extends string>(
        containerId: string,
        selector: string,
        getMaxLevel: (key: TUpgradeKey) => number | undefined,
        getCurrentLevel: (gameData: any, key: TUpgradeKey) => number,
    ): Promise<void> {
        const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        if (!gameDataAPI) return;
        const gameData = gameDataAPI.getGameData();
        if (!gameData) return;

        let container: HTMLElement;
        try {
            container = await HSElementHooker.HookElement(`#${containerId}`, undefined, 2000);
        } catch (e) {
            HSLogger.warn(`#hideButtons: Could not find #${containerId}: ${e}`, this.context);
            return;
        }

        // Wait for at least one matching button to exist (robust to async DOM rendering)
        const start = performance.now();
        const timeoutMs = 1000;
        let buttons: HTMLElement[] = [];
        while (true) {
            buttons = Array.from(container.querySelectorAll<HTMLElement>(selector));
            if (buttons.length > 0) {
                // Wait a bit more... and leave...
                await new Promise(res => setTimeout(res, 50));
                break;
            }
            if (performance.now() - start > timeoutMs) {
                HSLogger.warn(`#hideButtons: No buttons matching '${selector}' found in #${containerId} after ${timeoutMs}ms`, this.context);
                return;
            }
            await new Promise(res => setTimeout(res, 50));
        }

        for (const button of buttons) {
            const upgradeKey = button.id as TUpgradeKey;
            const maxLevel = getMaxLevel(upgradeKey);
            const currentLevel = getCurrentLevel(gameData, upgradeKey);

            if (maxLevel !== undefined && maxLevel !== -1 && currentLevel >= maxLevel) {
                button.style.display = 'none';
            } else {
                button.style.display = '';
            }
        }
    }

    showGQDistributor(): void {
        const existingDistributor = document.getElementById('hs-gq-distributor');
        if (existingDistributor) {
            existingDistributor.style.display = '';
            return;
        }

        const container = document.getElementById('goldenQuarksDisplay');
        if (!container) return;

        const distributor = document.createElement('div');
        distributor.id = 'hs-gq-distributor';
        distributor.style.display = 'flex';
        distributor.style.flexDirection = 'column';
        distributor.style.alignItems = 'center';
        distributor.style.marginTop = '10px';
        distributor.style.padding = '10px';
        distributor.style.border = '1px solid #ccc';
        distributor.style.borderRadius = '5px';
        distributor.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';

        const title = document.createElement('h3');
        title.textContent = 'GQ Distributor';
        title.style.margin = '0 0 10px 0';
        distributor.appendChild(title);

        const inputsContainer = document.createElement('div');
        inputsContainer.style.display = 'flex';
        inputsContainer.style.flexWrap = 'wrap';
        inputsContainer.style.justifyContent = 'center';
        inputsContainer.style.gap = '10px';
        distributor.appendChild(inputsContainer);

        const infiniteUpgrades: { id: string, src: string }[] = [];
        const upgradeButtons = document.querySelectorAll<HTMLButtonElement>('#actualSingularityUpgradeContainer .singularityUpgrade');

        upgradeButtons.forEach(btn => {
            const upgradeKey = btn.id as GoldenQuarkUpgradeKey;
            const maxLevel = goldenQuarkUpgradeMaxLevels[upgradeKey]?.maxLevel;
            if (maxLevel === -1) {
                const img = btn.querySelector('img');
                if (img) {
                    infiniteUpgrades.push({ id: btn.id, src: img.src });
                }
            }
        });

        const inputs: { [key: string]: HTMLInputElement } = {};

        infiniteUpgrades.forEach((upgrade, idx) => {
            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.flexDirection = 'column';
            wrapper.style.alignItems = 'center';

            const img = document.createElement('img');
            img.src = upgrade.src;
            img.style.width = '32px';
            img.style.height = '32px';
            img.style.marginBottom = '5px';
            wrapper.appendChild(img);

            const input = document.createElement('input');
            input.type = 'number';
            input.min = '0';
            input.value = '0';
            input.style.width = '60px';
            input.style.textAlign = 'center';
            inputs[upgrade.id] = input;
            wrapper.appendChild(input);

            input.addEventListener('input', () => {
                const settingKey = `gqDistributorRatio${idx + 1}` as keyof HSSettingsDefinition;
                const setting = HSSettings.getSetting(settingKey);
                if (setting) {
                    const val = parseFloat(input.value) || 0;
                    setting.setValue(val);
                }
            });

            inputsContainer.appendChild(wrapper);
        });

        // Load saved ratios from settings
        const upgradeIds = Object.keys(inputs);
        for (let i = 0; i < 8; i++) {
            const settingKey = `gqDistributorRatio${i + 1}` as keyof HSSettingsDefinition;
            const inputKey = upgradeIds[i];
            if (inputKey && inputs[inputKey]) {
                const setting = HSSettings.getSetting(settingKey);
                if (setting) {
                    const ratio = setting.getValue();
                    if (typeof ratio === 'number') {
                        inputs[inputKey].value = ratio.toString();
                    }
                }
            }
        }

        const distributeBtn = document.createElement('button');
        distributeBtn.textContent = 'Distribute';
        distributeBtn.style.marginTop = '10px';
        distributeBtn.style.padding = '5px 15px';
        distributeBtn.style.cursor = 'pointer';

        const statusLabel = document.createElement('div');
        statusLabel.style.marginTop = '6px';
        statusLabel.style.fontSize = '12px';
        statusLabel.style.color = '#aaa';
        statusLabel.style.minHeight = '16px';
        statusLabel.style.textAlign = 'center';

        const setStatus = (text: string) => { statusLabel.textContent = text; };

        const promptInput = document.querySelector('#prompt_text') as HTMLInputElement;
        const okPrompt = document.querySelector('#ok_prompt') as HTMLButtonElement;
        const okAlert = document.querySelector('#ok_alert') as HTMLButtonElement;
        const alertWrapper = document.getElementById('alertWrapper') as HTMLElement | null;
        const promptWrapper = document.getElementById('promptWrapper') as HTMLElement | null;

        // Resolves as soon as the element's display becomes 'block', or after timeoutMs.
        const waitForVisible = (el: HTMLElement | null, timeoutMs: number): Promise<void> =>
            new Promise(resolve => {
                if (!el) { resolve(); return; }
                if (el.style.display === 'block') { resolve(); return; }

                let done = false;
                const finish = () => {
                    if (done) return;
                    done = true;
                    clearTimeout(timer);
                    observer.disconnect();
                    resolve();
                };

                const observer = new MutationObserver(() => {
                    if (el.style.display === 'block') finish();
                });
                observer.observe(el, { attributes: true, attributeFilter: ['style'] });

                const timer = setTimeout(finish, timeoutMs);
            });

        distributeBtn.addEventListener('click', async () => {
            const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
            if (!gameDataAPI) return;
            const gameData = gameDataAPI.getGameData();
            if (!gameData) return;

            const totalGQ = gameData.goldenQuarks;
            const ratios: { [key: string]: number } = {};

            for (const id in inputs) {
                const val = parseFloat(inputs[id].value) || 0;
                if (val > 0) {
                    ratios[id] = val;
                }
            }

            // Save ratios to settings 
            for (let i = 0; i < 8; i++) {
                const settingKey = `gqDistributorRatio${i + 1}` as keyof HSSettingsDefinition;
                const inputKey = upgradeIds[i];
                if (inputKey && inputs[inputKey]) {
                    const setting = HSSettings.getSetting(settingKey);
                    if (setting) {
                        const val = parseFloat(inputs[inputKey].value) || 0;
                        setting.setValue(val);
                    }
                }
            }

            if (!promptInput || !okPrompt || !okAlert) return;

            const ids = Object.keys(ratios);
            if (ids.length === 0) return;
            const gqBudget = Math.max(0, Math.floor(totalGQ));
            const weightEntries = ids.map((id) => {
                const weight = ratios[id] ?? 0;
                const upgradeData = gameData.goldenQuarkUpgrades[id as GoldenQuarkUpgradeKey];
                const invested = Math.max(0, upgradeData?.goldenQuarksInvested ?? 0);
                return { id, weight, invested };
            }).filter(entry => entry.weight > 0);

            if (weightEntries.length === 0 || gqBudget <= 0) return;

            // Cumulative target allocation:
            // choose final invested totals so that each upgrade tracks its weight ratio,
            // while never reducing upgrades that are already over target.
            const targetTotalInvested = weightEntries.reduce((sum, entry) => sum + entry.invested, 0) + gqBudget;
            let activeIndices = weightEntries.map((_, idx) => idx);
            let activeWeightSum = weightEntries.reduce((sum, entry) => sum + entry.weight, 0);
            let inactiveInvestedSum = 0;

            while (activeIndices.length > 0 && activeWeightSum > 0) {

                const lambda = (targetTotalInvested - inactiveInvestedSum) / activeWeightSum;
                const newlyInactive = activeIndices.filter(idx => weightEntries[idx].invested > lambda * weightEntries[idx].weight);

                if (newlyInactive.length === 0) break;
                const newlyInactiveSet = new Set<number>(newlyInactive);
                for (const idx of newlyInactive) {
                    inactiveInvestedSum += weightEntries[idx].invested;
                    activeWeightSum -= weightEntries[idx].weight;
                }
                activeIndices = activeIndices.filter(idx => !newlyInactiveSet.has(idx));
            }

            const activeSet = new Set<number>(activeIndices);
            const lambda = activeWeightSum > 0
                ? (targetTotalInvested - inactiveInvestedSum) / activeWeightSum
                : 0;

            const exactAdditional = weightEntries.map((entry, idx) => {
                const targetFinalInvested = activeSet.has(idx)
                    ? Math.max(entry.invested, lambda * entry.weight)
                    : entry.invested;
                const additional = Math.max(0, targetFinalInvested - entry.invested);
                return {
                    id: entry.id,
                    exactAdditional: additional,
                    floorAdditional: Math.floor(additional),
                    fraction: additional - Math.floor(additional)
                };
            });

            const floorTotal = exactAdditional.reduce((sum, entry) => sum + entry.floorAdditional, 0);
            let remaining = Math.max(0, gqBudget - floorTotal);
            const byFractionDesc = [...exactAdditional].sort((a, b) => b.fraction - a.fraction);
            for (let i = 0; i < byFractionDesc.length && remaining > 0; i++) {
                byFractionDesc[i].floorAdditional += 1;
                remaining -= 1;
            }

            const plannedSpendById = new Map<string, number>(
                exactAdditional.map(entry => [entry.id, entry.floorAdditional])
            );
            const plannedTotal = ids.reduce((sum, id) => sum + (plannedSpendById.get(id) ?? 0), 0);

            HSLogger.debug(
                `GQ Distributor: budget=${gqBudget} plannedTotal=${plannedTotal} unallocated=${Math.max(0, gqBudget - plannedTotal)} planned=${JSON.stringify(
                    ids.map(id => ({
                        id,
                        weight: ratios[id] ?? 0,
                        invested: Math.max(0, gameData.goldenQuarkUpgrades[id as GoldenQuarkUpgradeKey]?.goldenQuarksInvested ?? 0),
                        spend: plannedSpendById.get(id) ?? 0
                    }))
                )}`,
                this.context
            );

            distributeBtn.disabled = true;
            distributeBtn.style.opacity = '0.6';
            distributeBtn.style.cursor = 'not-allowed';

            let current = 0;

            for (const id of ids) {
                current++;
                const amountToSpend = plannedSpendById.get(id) ?? 0;
                setStatus(`Buying ${current}/${ids.length} — spending ${amountToSpend.toLocaleString()} GQ…`);

                if (amountToSpend <= 0) { setStatus(`Skipped ${current}/${ids.length} (0 GQ)`); continue; }

                const btn = document.getElementById(id) as HTMLButtonElement;
                if (!btn) continue;

                // Shift-click opens the game's "how many?" prompt
                btn.dispatchEvent(new MouseEvent('click', { shiftKey: true, bubbles: true }));

                // Wait until the prompt is actually visible before interacting with it
                await waitForVisible(promptWrapper, 5000);

                promptInput.value = amountToSpend.toString();
                promptInput.dispatchEvent(new Event('input', { bubbles: true }));
                okPrompt.click();

                // Wait until the confirmation alert has actually appeared before dismissing
                await waitForVisible(alertWrapper, 5000);
                okAlert.click();

                // Dismiss any hover tooltip the programmatic click may have triggered
                btn.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
                btn.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
                btn.blur();

                // Force a macrotask yield so the browser can paint between purchases
                await new Promise(r => setTimeout(r, 0));
            }

            distributeBtn.disabled = false;
            distributeBtn.style.opacity = '';
            distributeBtn.style.cursor = 'pointer';
            setStatus('Done!');
            setTimeout(() => setStatus(''), 3000);
        });
        distributor.appendChild(distributeBtn);
        distributor.appendChild(statusLabel);

        container.parentNode?.insertBefore(distributor, container.nextSibling);
    }

    hideGQDistributor(): void {
        const distributor = document.getElementById('hs-gq-distributor');
        if (distributor) {
            distributor.style.display = 'none';
        }
    }

    /** Public wrapper to enable the Automation Quickbar. */
    public enableAutomationQuickbar(): void {
        if (!this.#automationQuickbarHandler) this.#automationQuickbarHandler = new HSQOLAutomationQuickbar();
        const handler = this.#automationQuickbarHandler;
        this.#enableQuickbar(
            HSQuickbarManager.QUICKBAR_IDS.AUTOMATION,
            () => ({
                element: handler!.createSection(),
                teardown: () => {
                    HSLogger.debug('Automation quickbar teardown invoked', this.context);
                    try { handler!.teardown(); }
                    catch (e) { HSLogger.log(`Error during automation quickbar teardown: ${e}`, this.context); }
                }
            }),
            (section) => { try { handler!.setup(section as HTMLDivElement); } catch (e) { HSLogger.log(`Error during automation quickbar setup: ${e}`, this.context); } }
        );
    }

    /** Public wrapper to enable the Events Quickbar. */
    public enableEventsQuickbar(): void {
        if (!this.#eventsQuickbarHandler) this.#eventsQuickbarHandler = new HSQOLEventsQuickbar();
        const handler = this.#eventsQuickbarHandler;
        this.#enableQuickbar(
            HSQuickbarManager.QUICKBAR_IDS.EVENTS,
            () => ({ 
                element: handler!.createSection(),
                teardown: () => { 
                    HSLogger.debug('Events quickbar teardown invoked', this.context);
                    try { handler!.teardown(); } 
                    catch (e) { HSLogger.log(`Error during events quickbar teardown: ${e}`, this.context); }
                }
            }),
            (section) => { try { handler!.setup(section as HTMLDivElement); } catch (e) { HSLogger.log(`Error during events quickbar setup: ${e}`, this.context); } }
        );
    }

    /** Public wrapper to enable the Corruption Quickbar. */
    public enableCorruptionQuickbar(): void {
        if (!this.#corruptionQuickbarHandler) this.#corruptionQuickbarHandler = new HSQOLCorruptionQuickbar();
        const handler = this.#corruptionQuickbarHandler;
        this.#enableQuickbar(
            HSQuickbarManager.QUICKBAR_IDS.CORRUPTION,
            () => ({
                element: handler!.createSection(),
                teardown: () => {
                    HSLogger.debug('Corruption quickbar teardown invoked', this.context);
                    try { handler!.teardown(); } catch (e) { HSLogger.log(`Error during corruption quickbar teardown: ${e}`, this.context); }
                }
            }),
            (section) => {
                handler!.setup(section as HTMLDivElement).catch((e) => {
                    HSLogger.log(`Error during corruption quickbar setup: ${e}`, this.context);
                });
            }
        );
    }

    /** Public wrapper to disable the Automation Quickbar. */
    public disableAutomationQuickbar(): void {
        // Manager will call the stored teardown; just remove the section and drop handler reference.
        this.#disableQuickbar(HSQuickbarManager.QUICKBAR_IDS.AUTOMATION);
        this.#automationQuickbarHandler = null;
    }

    /** Public wrapper to disable the Events Quickbar. */
    public disableEventsQuickbar(): void {
        this.#disableQuickbar(HSQuickbarManager.QUICKBAR_IDS.EVENTS);
        this.#eventsQuickbarHandler = null;
    }

    /** Public wrapper to disable the Corruption Quickbar. */
    public disableCorruptionQuickbar(): void {
        this.#disableQuickbar(HSQuickbarManager.QUICKBAR_IDS.CORRUPTION);
        this.#corruptionQuickbarHandler = null;
    }

    /**
     * Generic method to enable a quickbar using HSQuickbarManager.
     * @param id - The quickbar ID (use HSQuickbarManager.QUICKBAR_IDS)
     * @param factory - Factory function to create the quickbar section
     * @param setupCallback - Optional setup callback after injection
     * @param containerSetter - Optional setter for the quickbar container
     */
    #enableQuickbar(
        id: QUICKBAR_ID,
        factory: () => { element: HTMLElement; teardown?: () => void },
        setupCallback?: (section: HTMLElement) => void,
        teardownCallback?: () => void
    ): Promise<HTMLElement> {
        HSLogger.debug(`Enabling Quickbar: ${id}`, this.context);
        const managerSetup = (section: HTMLElement) => {
            if (setupCallback) setupCallback(section);
        };
        return HSQuickbarManager.getInstance().enableQuickbar(
            id,
            factory as any,
            managerSetup,
            teardownCallback
        );
    }

    /**
     * Generic method to disable a quickbar using HSQuickbarManager.
     * @param id - The quickbar ID (use HSQuickbarManager.QUICKBAR_IDS)
     * @param teardownCallback - Optional teardown callback before removal
     */
    #disableQuickbar(
        id: QUICKBAR_ID,
        teardownCallback?: () => void
    ): void {
        HSLogger.debug(`Disabling Quickbar: ${id}`, this.context);
        if (teardownCallback) teardownCallback();
        HSQuickbarManager.getInstance().disableQuickbar(id);
    }

    /**
     * Injects a custom button into the Ambrosia subtab when active, waiting for DOM readiness.
     */
    public async injectAFKSwapperToggleButton(): Promise<void> {
        if (document.getElementById('hs-ambrosia-loadout-idle-swap-toggle')) return;
        try {
            const parent = await HSElementHooker.HookElement('#singularityAmbrosia', undefined, 2000);
            const child = await HSElementHooker.HookElement('#ambrosiaProgressBar', undefined, 2000);
            const afkSwapperToggle = document.createElement('button');
            afkSwapperToggle.id = 'hs-ambrosia-loadout-idle-swap-toggle';
            afkSwapperToggle.textContent = 'Toggle AFK Swapper';

            afkSwapperToggle.addEventListener('click', () => {
                const idleSwapToggle = document.getElementById('hs-setting-ambrosia-idle-swap-btn') as HTMLElement;
                if (idleSwapToggle) {
                    idleSwapToggle.click();
                }
            });

            HSUI.injectHTMLElement(afkSwapperToggle, (element) => {
                parent.insertBefore(element, child);
            });
        } catch (e) {
            HSLogger.warn(`injectAFKSwapperToggleButton: Could not find required elements: ${e}`, this.context);
        }
    }

    /**
     * Subscribe to a SINGULARITY_VIEW tab visit and run a callback.
     * Deduplicates subscriptions per tab.
     * Returns an unsubscribe function 
     */
    #subscribeToTabVisit( tabId: SINGULARITY_VIEW, onTabVisit: () => void ): (() => void) | null {
        const gameState = HSModuleManager.getModule<HSGameState>('HSGameState');
        if (!gameState) return null;

        // If a subscription for this tab already exists, unsubscribe it first
        const oldUnsub = this.#tabVisitUnsubscribers.get(tabId);
        if (oldUnsub) {
            try {
                oldUnsub();
                HSLogger.debug(`subscribeToTabVisit: Unsubscribed previous handler for tab ${tabId}`, this.context);
            } catch (e) {
                HSLogger.warn(`subscribeToTabVisit: Error unsubscribing previous handler for tab ${tabId}: ${e}`, this.context);
            }
        }

        const subId = gameState.subscribeGameStateChange<SingularityView>(
            'SINGULARITY_VIEW',
            (prev, curr) => {
                if (curr.getId() === tabId) {
                    // small timeout to allow DOM updates
                    setTimeout(onTabVisit, 20);
                }
            }
        );
        
        if (subId) {
            const unsubscribe = () => gameState.unsubscribeGameStateChange('SINGULARITY_VIEW', subId);
            this.#tabVisitUnsubscribers.set(tabId, unsubscribe);
            HSLogger.debug(`subscribeToTabVisit: Subscribed to SINGULARITY_VIEW changes for tab ${tabId}`, this.context);
            // return value not used currently since we don't need it for the ones using it
            return unsubscribe;
        } else {
            HSLogger.warn(`subscribeToTabVisit: Failed to subscribe to SINGULARITY_VIEW changes for tab ${tabId}`, this.context);
            this.#tabVisitUnsubscribers.delete(tabId);
            return null;
        }
    }
}
