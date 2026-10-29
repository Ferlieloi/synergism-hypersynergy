import { HSLogger } from "../../hs-core/hs-logger";
import { HSModuleManager } from "../../hs-core/module/hs-module-manager";
import { HSSettings } from "../../hs-core/settings/hs-settings";
import { HSUtils } from "../../hs-utils/hs-utils";
import { HSGameDataAPI } from "../../hs-core/gds/hs-gamedata-api";
import { goldenQuarkUpgradeMinimumSingularity } from "../../hs-core/gds/hs-gamedata-tables";
import { GoldenQuarkUpgradeKey } from "../../../types/data-types/hs-gamedata-api-types";
import type { GameData } from "../../../types/data-types/hs-player-savedata";
import { HSGameDialogs } from "../../hs-core/dialogs/hs-game-dialogs";
import { HSUI } from "../../hs-core/hs-ui";
import { GQPlanUpgrade, planGQDistribution } from "./hs-gq-distributor-plan";

/**
 * Class: HSGQDistributor
 * IsExplicitHSModule: No
 * Description:
 *     Created by HSQOLButtons. The GQ Distributor under the shop's Golden Quarks: spends the unspent GQ on the
 *     unmaxed GQ upgrades following ratios the player sets, through the game's purchase dialog.
 * Author: XxmolkxX, Shewchou
 */
export class HSGQDistributor {
    #context: string;
    #scanningGQUpgrades = false;
    #gqDistributorRenderVersion = 0;

    constructor(context: string) {
        this.#context = context;
    }

    /** True while the upgrade scan clicks the game's hide-maxed GQ toggle (those clicks aren't the player's). */
    isScanning(): boolean {
        return this.#scanningGQUpgrades;
    }

    #getUnmaxedGQUpgrades(highestSingularity: number): { id: string, src: string }[] {
        const toggle = document.getElementById('toggleMaxedGoldenQuarkUpgrades') as HTMLButtonElement | null;
        const container = document.getElementById('actualSingularityUpgradeContainer');
        if (!toggle || !container) return [];
        const wasHidden = toggle.getAttribute('aria-pressed') === 'true';
        this.#scanningGQUpgrades = true;
        try {
            if (!wasHidden) toggle.click();
            if (toggle.getAttribute('aria-pressed') !== 'true') return [];
            // The game's toggle synchronously adds this class to maxed upgrades.
            return Array.from(container.querySelectorAll<HTMLButtonElement>('button.singularityUpgrade'))
                .filter(button => !button.classList.contains('upgradeHiddenByMaxLevel')
                    && highestSingularity >= (goldenQuarkUpgradeMinimumSingularity[button.id as GoldenQuarkUpgradeKey] ?? 0))
                .map(button => ({ id: button.id, src: button.querySelector('img')?.src ?? '' }))
                .filter(upgrade => upgrade.id && upgrade.src);
        } finally {
            if (!wasHidden && toggle.getAttribute('aria-pressed') === 'true') toggle.click();
            this.#scanningGQUpgrades = false;
        }
    }

    #getGQDistributorRatios(): Record<string, number> {
        const saved = HSSettings.getSetting('gqDistributorRatios').getValue();
        if (typeof saved === 'string' && saved) {
            try {
                const ratios = JSON.parse(saved) as Record<string, unknown>;
                if (ratios && typeof ratios === 'object' && !Array.isArray(ratios)) {
                    return Object.fromEntries(Object.entries(ratios).filter(([, value]) =>
                        typeof value === 'number' && Number.isFinite(value) && value >= 0
                    )) as Record<string, number>;
                }
            } catch { /* Ignore malformed saved ratios. */ }
        }
        return {};
    }

    async show(): Promise<void> {
        const renderVersion = ++this.#gqDistributorRenderVersion;
        const container = document.getElementById('goldenQuarksDisplay');
        if (!container) return;
        let gameData: GameData | undefined;
        try {
            gameData = await HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI')?.getForcedGameData();
        } catch (error) {
            HSLogger.warn(`Could not load GQ distributor save data: ${error}`, this.#context);
        }
        if (!gameData || renderVersion !== this.#gqDistributorRenderVersion) return;
        document.getElementById('hs-gq-distributor')?.remove();

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

        const unmaxedUpgrades = this.#getUnmaxedGQUpgrades(gameData.highestSingularityCount);
        const savedRatios = this.#getGQDistributorRatios();

        const inputs: { [key: string]: HTMLInputElement } = {};
        // The inputs show 2 decimals at most; savedRatios keeps the exact values, and Distribute reads those
        const shownRatio = (ratio: number): string => (Math.round(ratio * 100) / 100).toString();
        // No spin buttons: they take room on the right, which pushes the number off the icon's axis
        HSUI.injectStyle(`
            #hs-gq-distributor input[type="number"] { appearance: textfield; -moz-appearance: textfield; }
            #hs-gq-distributor input[type="number"]::-webkit-outer-spin-button,
            #hs-gq-distributor input[type="number"]::-webkit-inner-spin-button { appearance: none; -webkit-appearance: none; margin: 0; }
        `, 'hs-gq-distributor-css');
        // The game's name of each upgrade, for the skip summary (the id until resolved)
        const upgradeNames = new Map<string, string>();

        unmaxedUpgrades.forEach((upgrade) => {
            const wrapper = document.createElement('div');
            wrapper.style.display = 'flex';
            wrapper.style.flexDirection = 'column';
            wrapper.style.alignItems = 'center';

            const img = document.createElement('img');
            img.src = upgrade.src;
            img.alt = upgrade.id;
            img.style.width = '32px';
            img.style.height = '32px';
            img.style.marginBottom = '5px';
            wrapper.appendChild(img);
            void HSUtils.getGameTranslation(`singularity.data.${upgrade.id}.name`).then((name) => {
                if (!name) return;
                upgradeNames.set(upgrade.id, name);
                img.title = name;
            });

            const input = document.createElement('input');
            input.type = 'number';
            input.min = '0';
            input.step = 'any';
            input.setAttribute('aria-label', `${upgrade.id} distribution ratio`);
            input.value = shownRatio(savedRatios[upgrade.id] ?? 0);
            input.style.width = '60px';
            input.style.textAlign = 'center';
            // The game gives every input a left padding, which shifts centred text to the right
            input.style.padding = '0';
            inputs[upgrade.id] = input;
            wrapper.appendChild(input);

            input.addEventListener('input', () => {
                const val = parseFloat(input.value) || 0;
                savedRatios[upgrade.id] = Number.isFinite(val) ? Math.max(0, val) : 0;
                HSSettings.getSetting('gqDistributorRatios').setValue(JSON.stringify(savedRatios));
            });
            // Once the player is done typing (blur or Enter), not at each key
            input.addEventListener('change', () => {
                input.value = shownRatio(savedRatios[upgrade.id] ?? 0);
            });

            inputsContainer.appendChild(wrapper);
        });

        const distributeBtn = document.createElement('button');
        distributeBtn.id = 'hs-gq-distribute';
        distributeBtn.textContent = 'Distribute';

        const statusLabel = document.createElement('div');
        statusLabel.style.marginTop = '6px';
        statusLabel.style.fontSize = '12px';
        statusLabel.style.color = '#aaa';
        statusLabel.style.minHeight = '16px';
        statusLabel.style.textAlign = 'center';
        // The skip summary takes one line per reason, and can be selected and copied (the game blocks it on mobile)
        statusLabel.style.whiteSpace = 'pre-line';
        statusLabel.style.userSelect = 'text';

        // Any new status cancels a pending auto-clear, so an older timer can't wipe a newer message
        let statusClearTimer: ReturnType<typeof setTimeout> | undefined;
        const setStatus = (text: string, clearAfterMs?: number) => {
            clearTimeout(statusClearTimer);
            statusClearTimer = undefined;
            statusLabel.textContent = text;
            if (clearAfterMs !== undefined) {
                statusClearTimer = setTimeout(() => { statusLabel.textContent = ''; }, clearAfterMs);
            }
        };

        const matchRatios = document.createElement('button');
        matchRatios.id = 'hs-gq-match-invested-ratios';
        matchRatios.type = 'button';
        matchRatios.textContent = 'Match invested ratios';
        matchRatios.title = 'Set the inputs to the proportions of GQ already invested, without spending any GQ.';

        const resetRatios = document.createElement('button');
        resetRatios.id = 'hs-gq-reset-ratios';
        resetRatios.type = 'button';
        resetRatios.textContent = 'Reset';
        resetRatios.addEventListener('click', () => {
            for (const id of Object.keys(savedRatios)) savedRatios[id] = 0;
            for (const [id, input] of Object.entries(inputs)) {
                savedRatios[id] = 0;
                input.value = '0';
            }
            HSSettings.getSetting('gqDistributorRatios').setValue(JSON.stringify(savedRatios));
            setStatus('Ratios reset.');
        });

        const actions = document.createElement('div');
        actions.style.display = 'flex';
        actions.style.justifyContent = 'center';
        actions.style.alignItems = 'center';
        actions.style.gap = '8px';
        actions.style.marginTop = '10px';
        for (const button of [distributeBtn, matchRatios, resetRatios]) {
            button.style.padding = '5px 15px';
            button.style.cursor = 'pointer';
            actions.appendChild(button);
        }

        const balanceLabel = document.createElement('label');
        balanceLabel.style.marginTop = '10px';
        balanceLabel.title = 'On: bring total GQ investments as close as possible to the entered ratios using your available GQ. Off: split only your unspent GQ using those ratios.';
        const balanceInvestments = document.createElement('input');
        balanceInvestments.id = 'hs-gq-balance-investments';
        balanceInvestments.type = 'checkbox';
        balanceInvestments.checked = HSSettings.getSetting('gqDistributorBalanceInvestments').getValue() === true;
        balanceInvestments.addEventListener('change', () => {
            HSSettings.getSetting('gqDistributorBalanceInvestments').setValue(balanceInvestments.checked);
        });
        balanceLabel.appendChild(balanceInvestments);
        const balanceText = document.createElement('span');
        balanceText.textContent = ' Balance total investments';
        balanceLabel.appendChild(balanceText);
        distributor.appendChild(balanceLabel);

        const keepSkippedLabel = document.createElement('label');
        keepSkippedLabel.style.marginTop = '4px';
        keepSkippedLabel.title = 'On: the GQ share of skipped upgrades (maxed, or next level too expensive) stays unspent. Off: it is shared between the other upgrades.';
        const keepSkippedShare = document.createElement('input');
        keepSkippedShare.id = 'hs-gq-keep-skipped-share';
        keepSkippedShare.type = 'checkbox';
        keepSkippedShare.checked = HSSettings.getSetting('gqDistributorKeepSkippedShare').getValue() === true;
        keepSkippedShare.addEventListener('change', () => {
            HSSettings.getSetting('gqDistributorKeepSkippedShare').setValue(keepSkippedShare.checked);
        });
        keepSkippedLabel.appendChild(keepSkippedShare);
        const keepSkippedText = document.createElement('span');
        keepSkippedText.textContent = ' Keep the share of skipped upgrades';
        keepSkippedLabel.appendChild(keepSkippedText);
        distributor.appendChild(keepSkippedLabel);

        // While a match or a distribution runs
        const setControlsDisabled = (disabled: boolean) => {
            for (const control of [distributeBtn, matchRatios, resetRatios, balanceInvestments, keepSkippedShare]) control.disabled = disabled;
        };

        const syncInvestedRatios = (data: GameData): boolean => {
            const investments = Object.keys(inputs).map(id => ({
                id, invested: Math.max(0, data.goldenQuarkUpgrades[id as GoldenQuarkUpgradeKey]?.goldenQuarksInvested ?? 0)
            }));
            const largest = Math.max(0, ...investments.map(entry => entry.invested));
            if (largest === 0) return false;
            // Normalize to a largest weight of 100 for readable inputs and huge balances.
            for (const { id, invested } of investments) {
                savedRatios[id] = invested / largest * 100;
                inputs[id].value = shownRatio(savedRatios[id]);
            }
            HSSettings.getSetting('gqDistributorRatios').setValue(JSON.stringify(savedRatios));
            return true;
        };

        matchRatios.addEventListener('click', async () => {
            setControlsDisabled(true);
            try {
                const data = await HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI')?.getForcedGameData();
                if (!data) throw new Error('Player save unavailable.');
                setStatus(syncInvestedRatios(data) ? 'Ratios matched to existing investments.' : 'No GQ invested yet; ratios unchanged.');
            } catch (error) {
                HSLogger.warn(`Could not match invested GQ ratios: ${error}`, this.#context);
                setStatus('Could not read your current save. Try again.');
            } finally {
                setControlsDisabled(false);
            }
        });

        const costInput = document.getElementById('purchasePromptCost') as HTMLInputElement | null;
        const okPurchase = document.getElementById('ok_purchasePrompt') as HTMLButtonElement | null;
        const cancelPurchase = document.getElementById('cancel_purchasePrompt') as HTMLButtonElement | null;
        const purchaseWrapper = document.getElementById('purchasePromptWrapper');
        const confirmationBox = document.getElementById('confirmationBox');

        // The game refuses an unaffordable or maxed upgrade with an alert instead (dismissed by the session),
        // which ends in the timeout below
        const waitForPurchaseDialog = (): Promise<void> =>
            new Promise((resolve, reject) => {
                const isVisible = () => purchaseWrapper?.style.display === 'block';
                if (isVisible()) { resolve(); return; }

                const observer = new MutationObserver(() => {
                    if (isVisible()) finish();
                });
                const finish = (error?: Error) => {
                    clearTimeout(timer);
                    observer.disconnect();
                    if (error) reject(error);
                    else resolve();
                };
                observer.observe(confirmationBox!, { attributes: true, subtree: true, attributeFilter: ['style'] });
                // Short: the game opens it synchronously on click, and unbuyable upgrades are filtered out beforehand
                const timer = setTimeout(() => finish(new Error('Purchase dialog did not open.')), 2000);
            });

        distributeBtn.addEventListener('click', async () => {
            if (!costInput || !okPurchase || !cancelPurchase || !purchaseWrapper || !confirmationBox) {
                setStatus('Purchase dialog unavailable.');
                return;
            }

            setControlsDisabled(true);
            distributeBtn.style.opacity = '0.6';
            distributeBtn.style.cursor = 'not-allowed';
            if (!HSGameDialogs.isQueueIdle()) setStatus('Waiting for the open game dialog to close…');
            try {
                // Holds the dialog lock from the save snapshot to the last purchase
                await HSGameDialogs.run('gqDistributor', {}, async (s) => {
                    // One fresh save snapshot per distribution; continuous GDS stays unchanged.
                    const gameData = await HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI')?.getForcedGameData();
                    if (!gameData) throw new Error('Player save unavailable.');
                    const totalGQ = gameData.goldenQuarks;
                    const ratios: Record<string, number> = {};
                    for (const id in inputs) {
                        const val = savedRatios[id] ?? 0;
                        if (Number.isFinite(val) && val > 0) ratios[id] = val;
                    }
                    if (Object.keys(ratios).length === 0) {
                        setStatus('No ratio set.');
                        return;
                    }

                    // Skip the upgrades the game would refuse with an alert instead of the purchase dialog:
                    // maxed since the list was built (e.g. a previous distribution), or next level costing
                    // more than the whole balance.
                    // Their share goes to the other upgrades, or stays unspent with "Keep the share of skipped upgrades".
                    const gqHelper = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI')?.goldenQuark;
                    type SkipReason = 'maxed' | 'tooExpensive' | 'shareTooSmall' | 'aboveRatio';
                    const skipped: Record<SkipReason, string[]> = { maxed: [], tooExpensive: [], shareTooSmall: [], aboveRatio: [] };
                    // One line per skip reason. `share` says what became of the share of the upgrades skipped
                    // before the allocation; a share too small for a level is never spent, whatever the checkbox.
                    const skipSummary = (header: string, share?: string): string => {
                        const shareNote = share ? ` (${share})` : '';
                        const labels: Record<SkipReason, string> = {
                            maxed: `Maxed${shareNote}`,
                            tooExpensive: `Next level costs more than all your GQ${shareNote}`,
                            shareTooSmall: 'Share too small for one level (left unspent)',
                            aboveRatio: 'Already at or above its ratio'
                        };
                        const lines = (Object.keys(labels) as SkipReason[])
                            .filter(reason => skipped[reason].length > 0)
                            .map(reason => `${labels[reason]}: ${skipped[reason].map(id => upgradeNames.get(id) ?? id).join(' · ')}`);
                        const count = Object.values(skipped).reduce((sum, ids) => sum + ids.length, 0);
                        return [`${header} ${count} skipped:`, ...lines].join('\n');
                    };
                    const nextLevelCostById = new Map<string, number>();
                    const buyableIds = Object.keys(ratios).filter((id) => {
                        if (!gqHelper) return true;
                        const key = id as GoldenQuarkUpgradeKey;
                        const level = gqHelper.getGQUpgradeLevel(key);
                        if (level >= gqHelper.computeGQUpgradeMaxLevel(key)) {
                            skipped.maxed.push(id);
                            return false;
                        }
                        const nextLevelCost = gqHelper.getGQUpgradeCumulativeCost(key, level + 1)
                            - gqHelper.getGQUpgradeCumulativeCost(key, level);
                        if (nextLevelCost > totalGQ) {
                            skipped.tooExpensive.push(id);
                            return false;
                        }
                        nextLevelCostById.set(id, nextLevelCost);
                        return true;
                    });
                    if (buyableIds.length === 0) {
                        setStatus(skipSummary('Nothing to buy.'));
                        return;
                    }
                    // Keeping their share: skipped upgrades still take part in the allocation (so the others
                    // get the same share as if they were buyable), then their own share is not spent.
                    const keepSkipped = keepSkippedShare.checked;
                    const balance = balanceInvestments.checked;
                    const buyable = new Set(buyableIds);
                    const planUpgrades: GQPlanUpgrade[] = (keepSkipped ? Object.keys(ratios) : buyableIds).map(id => ({
                        id,
                        weight: ratios[id] ?? 0,
                        invested: Math.max(0, gameData.goldenQuarkUpgrades[id as GoldenQuarkUpgradeKey]?.goldenQuarksInvested ?? 0),
                        buyable: buyable.has(id)
                    }));
                    const plan = planGQDistribution(planUpgrades, totalGQ, balance);
                    if (!plan) {
                        setStatus('No Golden Quarks to spend.');
                        return;
                    }
                    const plannedSpendById = plan.spendById;

                    // Only numbers and the game's upgrade ids: nothing to escape
                    HSLogger.log(
                        `GQ Distributor: budget=${plan.budget} plannedTotal=${plan.total} unallocated=${Math.max(0, plan.budget - plan.total)} planned=${JSON.stringify(
                            planUpgrades.map(({ id, weight, invested }) => ({ id, weight, invested, spend: plannedSpendById.get(id) ?? 0 }))
                        )}`,
                        this.#context
                    );

                    let current = 0;
                    for (const id of buyableIds) {
                        current++;
                        const amountToSpend = plannedSpendById.get(id) ?? 0;
                        setStatus(`Buying ${current}/${buyableIds.length} — spending ${amountToSpend.toLocaleString()} GQ…`);

                        if (amountToSpend <= 0) {
                            // Balancing gives nothing to an upgrade already at its target; otherwise the share rounds to 0
                            skipped[balance ? 'aboveRatio' : 'shareTooSmall'].push(id);
                            setStatus(`Skipped ${current}/${buyableIds.length} (0 GQ)`);
                            continue;
                        }
                        // Checked here, not left to the purchase dialog: the game refuses with an alert instead of
                        // opening it when the balance left after the previous purchases can't buy a level.
                        // The balance always covers what's left to spend, so an allocation that buys a level can't be refused.
                        if (amountToSpend < (nextLevelCostById.get(id) ?? 0)) {
                            skipped.shareTooSmall.push(id);
                            setStatus(`Skipped ${current}/${buyableIds.length} (share too small for one level)`);
                            continue;
                        }

                        const btn = document.getElementById(id) as HTMLButtonElement;
                        if (!btn) continue;

                        if (s.ended) throw new Error('Time limit reached.');
                        // A dialog opened meanwhile (the player's, the game's) would delay the purchase dialog
                        if (!HSGameDialogs.isQueueIdle()) throw new Error('A game dialog opened.');
                        s.act({ purchasePrompt: 'show', alert: 'dismiss' }, () => {
                            btn.dispatchEvent(new MouseEvent('click', { shiftKey: true, bubbles: true }));
                        });
                        try {
                            await waitForPurchaseDialog();
                        } catch {
                            // Unbuyable upgrades are filtered out beforehand: a missing dialog is unexpected,
                            // so stop the whole distribution here and name the upgrade (the outer catch reports it).
                            // If it opens later, the hook cancels it (the session has ended by then).
                            throw new Error(`Purchase dialog did not open for ${id}.`);
                        }

                        // Let the game calculate affordable levels and enforce upgrade caps.
                        costInput.value = amountToSpend.toString();
                        costInput.dispatchEvent(new Event('input', { bubbles: true }));
                        if (okPurchase.disabled) {
                            cancelPurchase.click();
                            skipped.shareTooSmall.push(id);
                            setStatus(`Skipped ${current}/${buyableIds.length} (share too small for one level)`);
                        } else {
                            // The game confirms multi-level and One Mind purchases with an Alert, chained after this click
                            if (!s.act({ alert: 'dismiss' }, () => okPurchase.click())) {
                                cancelPurchase.click();
                                throw new Error('Time limit reached.');
                            }
                        }

                        // Let the purchase settle, and its alert be dismissed
                        await HSUtils.sleep(0);

                        // Dismiss any hover tooltip the programmatic click may have triggered
                        btn.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
                        btn.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
                        btn.blur();
                    }
                    if (Object.values(skipped).some(ids => ids.length > 0)) {
                        // Stays until the next status, so it can be read and copied
                        setStatus(skipSummary('Done.', keepSkipped ? 'share kept' : 'share given to the others'));
                    } else {
                        setStatus('Done!', 3000);
                    }
                });
            } catch (error) {
                HSLogger.warn(`GQ distribution failed: ${error}`, this.#context);
                setStatus(`Distribution stopped: ${error instanceof Error ? error.message : 'purchase failed.'}`);
            } finally {
                setControlsDisabled(false);
                distributeBtn.style.opacity = '';
                distributeBtn.style.cursor = 'pointer';
            }
        });
        distributor.appendChild(actions);
        distributor.appendChild(statusLabel);

        container.parentNode?.insertBefore(distributor, container.nextSibling);
    }

    hide(): void {
        this.#gqDistributorRenderVersion++;
        const distributor = document.getElementById('hs-gq-distributor');
        if (distributor) {
            distributor.style.display = 'none';
        }
    }
}
