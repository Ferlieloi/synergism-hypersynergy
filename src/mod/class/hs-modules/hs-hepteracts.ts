import { CUBE_VIEW, MAIN_VIEW } from "../../types/module-types/hs-gamestate-types";
import { HSElementHooker } from "../hs-core/hs-elementhooker";
import { HSGameState } from "../hs-core/hs-gamestate";
import { HSGlobal } from "../hs-core/hs-global";
import { HSLogger } from "../hs-core/hs-logger";
import { HSModule } from "../hs-core/module/hs-module";
import { HSModuleManager } from "../hs-core/module/hs-module-manager";
import { HSSetting } from "../hs-core/settings/hs-setting";
import { HSSettings } from "../hs-core/settings/hs-settings";
import { HSUI } from "../hs-core/hs-ui";
import { HSUtils } from "../hs-utils/hs-utils";
import { HSNumberParser } from "../hs-utils/hs-number-parser";
import { HSModuleOptions } from "../../types/hs-types";
import { HSGameDataAPI } from "../hs-core/gds/hs-gamedata-api";
import type { HSGameData } from "../hs-core/gds/hs-gamedata";
import type { HepteractKeys } from "../../types/data-types/hs-player-savedata";
import { parseGameDataNumber } from "../hs-core/gds/hs-gamedata-utils";
import { HSGameDialogs } from "../hs-core/dialogs/hs-game-dialogs";
import { HEPTERACT_DATA, hepteractCapacities, HepteractState, hepteractUnitsToReach, readHepteract } from "./hs-hepteract-state";

type AscensionIncomeSnapshot = {
    perSecond: number;
    onAscension: number;
};

type PlatonicResourceEstimate = {
    resource: string;
    seconds: number;
};

type HepteractQuickExpandEstimate = {
    cost: number;
    amountToCraft: number;
    expandsCapacity: boolean;
    currentBalance: number;
    currentCapacity: number;
};

/**
 * Class: HSHepteracts
 * IsExplicitHSModule: Yes
 * Description: 
 *     Hypersynergism module which implements the following QoL functionalities:
 *         - In-game hepteract ratio display
 *         - "Quick expand and max" functionality when the user clicks one of the hepteract icons
 *         - "Quick expand and max" hepteract cost protection, 
 *           which won't let the user quick expand a hepteract if it would cost too much
 * Author: Swiffy
*/
export class HSHepteracts extends HSModule {
    #heptGrid?: Element;
    #hepteractCraftTexts?: HTMLDivElement;

    #hepteractBaseNames = [
        'chronos',
        'hyperrealism',
        'quark',
        'challenge',
        'abyss',
        'accelerator',
        'acceleratorBoost',
        'multiplier'
    ];

    #hepteracts: string[] = [];
    #hepteractMeters: string[] = [];

    #boxCounts = {
        chronosHepteract: 0,
        hyperrealismHepteract: 0,
        quarkHepteract: 0,
        challengeHepteract: 0,
        abyssHepteract: 0,
        acceleratorHepteract: 0,
        acceleratorBoostHepteract: 0,
        multiplierHepteract: 0
    };

    #hepteractCosts: { [key: string]: number | null } = {
        chronosHepteract: null,
        hyperrealismHepteract: null,
        quarkHepteract: 100,
        challengeHepteract: null,
        abyssHepteract: null,
        acceleratorHepteract: null,
        acceleratorBoostHepteract: null,
        multiplierHepteract: null
    };


    #ratioElementHtml = `
        <div id="hs-ratio-container">
            <div class="hs-ratio" id="hs-ratio-a">CHR/HYP/CHL: 1 / 123 / 123</div>
            <div class="hs-ratio" id="hs-ratio-b">ACC/BST/MLT: 1 / 123 / 123</div>
            <div class="hs-ratio" id="hs-ratio-c">CHR/ACC: 1 / 123</div>
        </div>`;

    #ratioElementStyle = `
        #hs-ratio-container {
            width: 100%;
            display: grid;
            justify-items: center;
            grid-template-columns: repeat(3, 1fr);
            grid-template-rows: 1fr;
            grid-column-gap: 0px;
            grid-row-gap: 0px;
        }`;

    #ratioElementA?: HTMLElement;
    #ratioElementB?: HTMLElement;
    #ratioElementC?: HTMLElement;

    #hoveredHepteractId: string | null = null;
    #craftTextRefreshTimer?: ReturnType<typeof setInterval>;
    #ascensionIncomeReadQueue: Promise<unknown> = Promise.resolve();

    #platonicUpgradeDescriptions?: HTMLElement;
    #hoveredPlatonicUpgradeId: number | null = null;

    #ownedHepteracts?: number;

    // Quick expand is expected to be spam clicked
    // We need to make sure that hepteract expansion + max goes through
    // and owned hepteracts value is updated before quick expand can be done again
    // Otherwise the hepteract quick expand cost protection might not trigger right
    #expandPending = false;
    #forgeDataVisitActive = false;
    #forgeDataVisitId = 0;
    #forgeCapacityRefreshPromise?: Promise<void>;
    #hasDoubleHepteractCapacity?: boolean;

    constructor(moduleOptions: HSModuleOptions) {
        super(moduleOptions);

        this.#hepteracts = this.#hepteractBaseNames.map(h => {
            return `${h}Hepteract`;
        });

        this.#hepteractMeters = this.#hepteractBaseNames.map(h => {
            return `${h}ProgressBarText`;
        });
    }

    /**
     * Reads the cost of one hepteract from the forge's description, which the game fills for the hovered hepteract.
     * The sentence is translated: its first number is the Hepteract cost in every language ({{x}} of "oneCost").
     */
    #readHepteractCost(hepteractId: string): void {
        if (!(hepteractId in this.#hepteractCosts)) return;

        const cost = HSNumberParser.parse(document.querySelector<HTMLElement>('#hepteractCostText')?.innerText);
        if (!Number.isNaN(cost)) this.#hepteractCosts[hepteractId] = cost;
    }

    /**
     * A hepteract's exact balance and capacities from the live player object (patched game only).
     * The game's display cuts numbers to 3 digits above 1e6, which is not enough to tell whether a click expands.
     */
    #readLiveHepteract(baseName: string): HepteractState | null {
        if (!(baseName in HEPTERACT_DATA)) return null;
        return readHepteract(HSGlobal.exposedPlayer, baseName as HepteractKeys);
    }

    #refreshOwnedHepteracts(): void {
        const liveAmount = HSGlobal.exposedPlayer?.wowAbyssals;
        if (typeof liveAmount === 'number' && Number.isFinite(liveAmount)) {
            this.#ownedHepteracts = liveAmount;
            return;
        }

        const quantity = document.querySelector<HTMLElement>('#hepteractQuantity');
        if (!quantity) return;

        const text = quantity.querySelector('span')?.textContent ?? quantity.textContent ?? '';
        const amount = HSNumberParser.parse(text);
        if (!Number.isNaN(amount)) this.#ownedHepteracts = amount;
    }

    /** Quarks owned: the live player, else the header's quark count, which the game updates on every tab. */
    #readOwnedQuarks(): number | undefined {
        // Number(QuarkHandler) is the quark amount; NaN on an unpatched game
        const liveQuarks = Number(HSGlobal.exposedPlayer?.worlds);
        if (Number.isFinite(liveQuarks)) return liveQuarks;

        const quarks = HSNumberParser.parse(document.querySelector<HTMLElement>('#quarkDisplay')?.textContent ?? '');
        return Number.isNaN(quarks) ? undefined : quarks;
    }

    #beginForgeDataVisit(): void {
        if (this.#forgeDataVisitActive) return;

        // The live player object already tells whether the capacity is doubled: no game data needed
        if (this.#readLiveHepteract('chronos')) return;

        this.#forgeDataVisitActive = true;
        const visitId = ++this.#forgeDataVisitId;
        this.#hasDoubleHepteractCapacity = undefined;
        this.#forgeCapacityRefreshPromise = undefined;

        const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        // Cached data is only current while the GDS engine runs (it can be paused with the setting ON)
        const isGDSRunning = HSModuleManager.getModule<HSGameData>('HSGameData')?.isGDSRunning() ?? false;

        if (isGDSRunning) {
            if (gameDataAPI?.getGameData()) {
                this.#hasDoubleHepteractCapacity = Boolean(
                    gameDataAPI.getSingularityChallengeEffect('limitedAscensions', 'hepteractCap')
                );
            }
            return;
        }

        if (!gameDataAPI) {
            HSLogger.warn('Cannot refresh Hepteract capacity state: game data API is unavailable', this.context);
            return;
        }

        this.#forgeCapacityRefreshPromise = gameDataAPI.getForcedGameData()
            .then(gameData => {
                if (visitId !== this.#forgeDataVisitId || !this.#forgeDataVisitActive || !gameData) return;

                this.#hasDoubleHepteractCapacity = Boolean(
                    gameDataAPI.getSingularityChallengeEffect('limitedAscensions', 'hepteractCap')
                );
            })
            .catch(error => {
                HSLogger.warn(`Failed to refresh Hepteract capacity state: ${error}`, this.context);
            });
    }

    #endForgeDataVisit(): void {
        if (!this.#forgeDataVisitActive) return;

        this.#forgeDataVisitActive = false;
        this.#forgeDataVisitId++;
        this.#forgeCapacityRefreshPromise = undefined;
        this.#hasDoubleHepteractCapacity = undefined;
    }

    #estimateQuickExpandCost(hepteractId: string): HepteractQuickExpandEstimate | null {
        const baseName = hepteractId.replace(/Hepteract$/, '');
        const costPerHepteract = this.#hepteractCosts[hepteractId];
        if (costPerHepteract === null || costPerHepteract === undefined
            || !Number.isFinite(costPerHepteract) || costPerHepteract < 0) {
            return null;
        }

        // A locked hepteract's meter has no "balance / capacity": no estimate for it
        const meterText = document.getElementById(`${baseName}ProgressBarText`)?.innerText ?? '';
        const [balanceText, capacityText] = meterText.split('/');
        if (balanceText === undefined || capacityText === undefined) return null;

        let currentBalance: number;
        let currentCapacity: number;
        let baseCapacity: number;

        const live = this.#readLiveHepteract(baseName);
        if (live) {
            currentBalance = live.balance;
            currentCapacity = live.finalCapacity;
            baseCapacity = live.baseCapacity;
        } else {
            // Unpatched game (bookmarklet): the meter's text, cut to 3 digits above 1e6
            currentBalance = HSNumberParser.parse(balanceText);
            currentCapacity = HSNumberParser.parse(capacityText);
            if (!Number.isFinite(currentBalance) || !Number.isFinite(currentCapacity) || currentCapacity <= 0) {
                return null;
            }

            if (this.#hasDoubleHepteractCapacity === undefined) return null;

            baseCapacity = currentCapacity / (this.#hasDoubleHepteractCapacity ? 2 : 1);
        }

        const expandsCapacity = currentBalance >= baseCapacity;
        const balanceAfterExpand = expandsCapacity
            ? Math.max(0, currentBalance - baseCapacity)
            : currentBalance;
        const targetCapacity = expandsCapacity ? currentCapacity * 2 : currentCapacity;
        const amountToCraft = Math.max(0, targetCapacity - balanceAfterExpand);
        const cost = amountToCraft * costPerHepteract;
        if (!Number.isFinite(cost)) return null;

        return { cost, amountToCraft, expandsCapacity, currentBalance, currentCapacity };
    }

    async init(): Promise<void> {
        const self = this;

        HSLogger.log("Initialising HSHepteracts module", this.context);

        const gameStateMod = HSModuleManager.getModule<HSGameState>('HSGameState');

        if (gameStateMod) {
            const syncForgeDataVisit = () => {
                const isForgeActive = gameStateMod.getCurrentUIView('MAIN_VIEW').getId() === MAIN_VIEW.CUBES
                    && gameStateMod.getCurrentUIView('CUBE_VIEW').getId() === CUBE_VIEW.HEPTERACT_FORGE;

                if (isForgeActive) {
                    self.#beginForgeDataVisit();
                } else {
                    self.#endForgeDataVisit();
                }
            };

            // Owned hepteracts and quarks are read when needed (#refreshOwnedHepteracts, #readOwnedQuarks): no watch to keep
            gameStateMod.subscribeGameStateChange("MAIN_VIEW", syncForgeDataVisit);
            gameStateMod.subscribeGameStateChange("CUBE_VIEW", syncForgeDataVisit);

            syncForgeDataVisit();
        }

        this.#heptGrid = await HSElementHooker.HookElement('#heptGrid');
        this.#hepteractCraftTexts = await HSElementHooker.HookElement('#hepteractCraftTexts') as HTMLDivElement;
        HSUI.injectStyle(`
            #hepteractCraftTexts > #hs-costText {
                min-height: 3.6em;
                line-height: 1.2;
                overflow-wrap: anywhere;
            }
        `);
        this.#getCraftTextSlot();

        this.#heptGrid.childNodes.forEach(node => {
            if (node.nodeType === 1) {
                const htmlNode = node as HTMLElement;
                const id = htmlNode.id

                if (self.#hepteracts.includes(id)) {
                    const craftMaxBtn = document.querySelector(`#${id}CraftMax`) as HTMLElement;
                    const capBtn = document.querySelector(`#${id}Cap`) as HTMLElement;
                    const heptImg = document.querySelector(`#${id}Image`) as HTMLElement;

                    // As hepteract costs are not static and we don't have direct access to them, we need to parse them from the DOM in a "just-in-time" manner...
                    htmlNode.addEventListener('mouseenter', async (e: MouseEvent) => {

                        if (id in self.#hepteractCosts && id === 'quarkHepteract') {
                            return;
                        }

                        self.#readHepteractCost(id);
                    });

                    if (craftMaxBtn && capBtn && heptImg) {

                        // Update and render hepteract total cost when hovering over the image
                        heptImg.addEventListener('mouseenter', (evt) => {
                            const target = evt.target as HTMLImageElement;
                            const targetId = target.id;
                            const isQuarkHepteract = targetId.toLowerCase().includes('quark');
                            self.#startCraftTextRefresh(id, isQuarkHepteract);
                        });

                        heptImg.addEventListener('mouseleave', () => {
                            if (self.#hoveredHepteractId === id) {
                                self.#stopCraftTextRefresh();
                            }
                        });

                        heptImg.addEventListener('click', async (evt) => {
                            const target = evt.target as HTMLImageElement;
                            const targetId = target.id;
                            const isQuarkHepteract = targetId.toLowerCase().includes('quark');

                            if (!targetId) return;

                            // Don't allow quick expand on quark hepteract
                            if (isQuarkHepteract) return;

                            if (self.#expandPending) {
                                HSLogger.debug(() => `Quick expand cancelled, another expand was still pending`, self.context);
                                return;
                            }

                            self.#expandPending = true;

                            const expandCostProtectionSetting = HSSettings.getSetting('expandCostProtection') as HSSetting<number>;
                            if (expandCostProtectionSetting.isEnabled() && self.#forgeCapacityRefreshPromise) {
                                await self.#forgeCapacityRefreshPromise;
                                if (!self.#forgeDataVisitActive) {
                                    self.#expandPending = false;
                                    return;
                                }
                            }

                            self.#refreshOwnedHepteracts();
                            if (self.#ownedHepteracts !== null && self.#ownedHepteracts !== undefined) {
                                if (self.#ownedHepteracts === 0) {
                                    HSLogger.info(`Owned hepteracts is 0`, this.context);
                                    self.#expandPending = false;
                                    return;
                                }

                                const costEstimate = self.#estimateQuickExpandCost(id);
                                const percentHeptOwned = costEstimate
                                    ? costEstimate.cost / self.#ownedHepteracts
                                    : null;
                                const costProtectionNotificationSetting = HSSettings.getSetting('expandCostProtectionNotifications') as HSSetting<boolean>;
                                const notify = costProtectionNotificationSetting?.getValue() !== true;

                                if (!costEstimate && expandCostProtectionSetting.isEnabled()) {
                                    HSLogger.warn(`Cannot estimate quick-expand cost for ${id}; action blocked by cost protection`, self.context);
                                    self.#expandPending = false;
                                    return;
                                }

                                HSLogger.debug(() => `
                                    Current balance: ${HSUtils.N(costEstimate?.currentBalance ?? 0)},
                                    Current capacity: ${HSUtils.N(costEstimate?.currentCapacity ?? 0)},
                                    Estimated craft amount: ${HSUtils.N(costEstimate?.amountToCraft ?? 0)},
                                    Estimated cost: ${HSUtils.N(costEstimate?.cost ?? 0)},
                                    Percent owned: ${HSUtils.N(percentHeptOwned ?? 0)},
                                    Capacity expands: ${costEstimate?.expandsCapacity ?? false}`,
                                    this.context
                                );

                                if (expandCostProtectionSetting.isEnabled() && costEstimate && percentHeptOwned !== null) {
                                    const heptSettingValue = expandCostProtectionSetting.getCalculatedValue();

                                    if (Number.isFinite(heptSettingValue) && percentHeptOwned >= heptSettingValue) {
                                        if (notify)
                                            HSLogger.info(`Hept. cost protection: Cost owned ${HSUtils.N(percentHeptOwned * 100)}% >= ${heptSettingValue * 100}%`, this.context);

                                        self.#expandPending = false;
                                        return;
                                    }
                                }
                            } else {
                                HSLogger.warn(`Owned hepteracts not parsed yet`, this.context);

                                self.#expandPending = false;
                                return;
                            }

                            // With a dialog open, the cap's Confirm would wait behind it, and Craft Max (no Confirm
                            // when the game's #toggle35 is off) would craft before the expansion
                            if (!HSGameDialogs.isQueueIdle()) {
                                HSLogger.info(`Quick expand cancelled: close the open game dialog first`, this.context);
                                self.#expandPending = false;
                                return;
                            }

                            // Cap: its Confirm is answered, its Alert dismissed (shown when #toggle35 is on)
                            HSGameDialogs.act('hepteractQuickExpand', { confirm: 'ok', alert: 'dismiss' }, () => capBtn.click());

                            // The game expands once its Confirm is answered, after an await: Craft Max must come after
                            await HSUtils.wait(25);

                            // Craft Max: same for its Confirm and Alerts (#toggle35 on)
                            HSGameDialogs.act('hepteractQuickExpand', { confirm: 'ok', alert: 'dismiss' }, () => craftMaxBtn.click());

                            await HSUtils.wait(5);

                            if (id !== 'quarkHepteract') {
                                self.#readHepteractCost(id);
                            }

                            self.#refreshOwnedHepteracts();

                            if (self.#hoveredHepteractId === id) {
                                await self.#refreshCraftText(id, isQuarkHepteract);
                            }

                            self.#expandPending = false;
                        });
                    }
                }
            }
        });

        if (document.querySelectorAll('.heptTypeImage').length > 0) {
            HSUI.injectStyle(`
                .heptTypeImage:not(#quarkHepteractImage):not(#hepteractToQuarkImage):not(#overfluxPowderImage) {
                    transform: scale(1);
                    transform-origin: 50% 50%;
                }

                .heptTypeImage:not(#quarkHepteractImage):not(#hepteractToQuarkImage):not(#overfluxPowderImage):hover {
                    transform: scale(1.05);
                    cursor: pointer;
                }

                .heptTypeImage:not(#quarkHepteractImage):not(#hepteractToQuarkImage):not(#overfluxPowderImage):active {
                    transform: scale(0.98);
                }
            `);
        }

        HSLogger.log("Hepteract images now serve as 'quick expand and max' buttons", this.context);
        HSLogger.log("Setting up hepteract ratio watch", this.context);

        HSUI.injectStyle(this.#ratioElementStyle);

        HSUI.injectHTMLString(this.#ratioElementHtml, (node) => {
            const heptGridParent = self.#heptGrid?.parentNode;
            heptGridParent?.insertBefore(node, self.#heptGrid as Node);
        });

        this.#ratioElementA = document.querySelector('#hs-ratio-a') as HTMLElement;
        this.#ratioElementB = document.querySelector('#hs-ratio-b') as HTMLElement;
        this.#ratioElementC = document.querySelector('#hs-ratio-c') as HTMLElement;

        this.#hepteractMeters.forEach(meterId => {
            const meter = document.querySelector(`#${meterId}`) as HTMLElement;
            const boxName = meterId.substring(0, meterId.indexOf('ProgressBar')) + 'Hepteract';

            if (meter && boxName) {
                HSElementHooker.watchElement(meter, (value) => {
                    if (boxName in self.#boxCounts) {
                        (self.#boxCounts as any)[boxName] = value;

                        const box = self.#boxCounts;
                        if (Object.values(box).every(v => v > 0)) {
                            // group 1: CHR / HYP / CHL
                            const min1 = Math.min(box.chronosHepteract, box.hyperrealismHepteract, box.challengeHepteract);
                            const chronosToMinChrHypCha = Math.round(box.chronosHepteract / min1);
                            const hyperToMinChrHypCha = Math.round(box.hyperrealismHepteract / min1);
                            const challengeToMinChrHypCha = Math.round(box.challengeHepteract / min1);

                            // group 2: ACC / BST / MLT
                            const min2 = Math.min(box.acceleratorHepteract, box.acceleratorBoostHepteract, box.multiplierHepteract);
                            const acceleratorToMinAccBooMul = Math.round(box.acceleratorHepteract / min2);
                            const boostToMinAccBooMul = Math.round(box.acceleratorBoostHepteract / min2);
                            const multiplierToMinAccBooMul = Math.round(box.multiplierHepteract / min2);

                            // group 3: CHR / ACC
                            const min3 = Math.min(box.chronosHepteract, box.acceleratorHepteract);
                            const chronosToMinChrAcc = Math.round(box.chronosHepteract / min3);
                            const acceleratorToMinChrAcc = Math.round(box.acceleratorHepteract / min3);

                            if (this.#ratioElementA && this.#ratioElementB && this.#ratioElementC) {
                                this.#ratioElementA.innerText = `CHR/HYP/CHL: ${HSUtils.N(chronosToMinChrHypCha, 0)} / ${HSUtils.N(hyperToMinChrHypCha, 0)} / ${HSUtils.N(challengeToMinChrHypCha, 0)}`;
                                this.#ratioElementB.innerText = `ACC/BST/MLT: ${HSUtils.N(acceleratorToMinAccBooMul, 0)} / ${HSUtils.N(boostToMinAccBooMul, 0)} / ${HSUtils.N(multiplierToMinAccBooMul, 0)}`;
                                this.#ratioElementC.innerText = `CHR/ACC: ${HSUtils.N(chronosToMinChrAcc, 0)} / ${HSUtils.N(acceleratorToMinChrAcc, 0)}`;
                            }
                        }
                    } else {
                        HSLogger.warn(`Key ${boxName} not found in #boxCounts`, self.context);
                    }
                },
                    {
                        valueParser: (element) => {
                            const value = element.innerText;

                            if (typeof value === 'string') {
                                const split = value.split('/');

                                try {
                                    if (split && split[1]) {
                                        const shownCapacity = HSNumberParser.parse(split[1]);
                                        // The shown capacity is cut to 3 digits above 1e6, which puts large ratios off
                                        // (128 becomes 127): the exact one is used when the live player object has it
                                        const live = Number.isNaN(shownCapacity)
                                            ? null
                                            : self.#readLiveHepteract(boxName.replace(/Hepteract$/, ''));
                                        return live ? live.finalCapacity : shownCapacity;
                                    }
                                } catch (e) {
                                    HSLogger.warn(`Parsing failed for ${split}`, self.context);
                                    return '';
                                }
                            }
                            return '';
                        }
                    });
            } else {
                HSLogger.warn(`Invalid meter or boxName`, self.context);
            }
        });

        this.#platonicUpgradeDescriptions = await HSElementHooker.HookElement('#platonicUpgradeDescriptions') as HTMLElement;
        document.querySelectorAll<HTMLImageElement>('.platonicUpgradeImage').forEach((upgradeImage, index) => {
            const upgradeId = index + 1;

            upgradeImage.addEventListener('mouseover', () => {
                self.#hoveredPlatonicUpgradeId = upgradeId;
                self.#showPlatonicUpgradeEstimate('Calculating upgrade time...');
                void HSUtils.yield().then(() => self.#updatePlatonicUpgradeEstimate(upgradeId));
            });

            upgradeImage.addEventListener('mouseleave', () => {
                if (self.#hoveredPlatonicUpgradeId === upgradeId) {
                    self.#hoveredPlatonicUpgradeId = null;
                    self.#removePlatonicUpgradeEstimate();
                }
            });
        });

        this.isInitialized = true;
    }

    #getCraftTextSlot(): HTMLDivElement | null {
        if (!this.#hepteractCraftTexts) return null;

        let costText = this.#hepteractCraftTexts.querySelector<HTMLDivElement>('#hs-costText');
        if (!costText) {
            costText = document.createElement('div');
            costText.id = 'hs-costText';
            costText.style.whiteSpace = 'pre-line';
            // Keep the mod details visible above the game's longer hover description.
            this.#hepteractCraftTexts.prepend(costText);
        }
        return costText;
    }

    #removeCraftText() {
        const costText = this.#getCraftTextSlot();
        if (costText) costText.textContent = '';
    }

    #startCraftTextRefresh(hepteractId: string, isQuarkHepteract: boolean) {
        this.#stopCraftTextRefresh();
        this.#hoveredHepteractId = hepteractId;

        let refreshPending = false;
        const refresh = async () => {
            if (refreshPending || this.#hoveredHepteractId !== hepteractId) return;

            refreshPending = true;
            try {
                await this.#refreshCraftText(hepteractId, isQuarkHepteract);
            } finally {
                refreshPending = false;
            }
        };

        void refresh();
        this.#craftTextRefreshTimer = setInterval(() => void refresh(), 1000);
    }

    #stopCraftTextRefresh() {
        this.#hoveredHepteractId = null;
        if (this.#craftTextRefreshTimer !== undefined) {
            clearInterval(this.#craftTextRefreshTimer);
            this.#craftTextRefreshTimer = undefined;
        }
        this.#removeCraftText();
    }

    async #refreshCraftText(hepteractId: string, isQuarkHepteract: boolean) {
        this.#refreshOwnedHepteracts();
        if (this.#hoveredHepteractId !== hepteractId
            || this.#ownedHepteracts === null
            || this.#ownedHepteracts === undefined) {
            return;
        }

        const estimate = this.#estimateQuickExpandCost(hepteractId);
        if (!estimate) return;

        await this.#updateCraftText(estimate, hepteractId, isQuarkHepteract);
    }

    async #switchAscensionIncomeMode(
        statsElement: HTMLElement,
        incomeElement: HTMLElement,
        unitElement: HTMLElement,
        targetPerSecond: boolean
    ): Promise<boolean> {
        const previousIncomeText = incomeElement.textContent ?? '';
        const incomeUpdated = HSUtils.waitForInnerText(
            incomeElement,
            text => text !== previousIncomeText,
            500
        ).catch(() => undefined);

        statsElement.click();

        if ((unitElement.textContent?.trim() === '/s') !== targetPerSecond) {
            await incomeUpdated;
            return false;
        }

        // The mode marker changes synchronously, but the displayed amount is
        // updated separately by the game's visual refresh interval.
        await incomeUpdated;
        return true;
    }

    async #readAscensionIncome(resourceId: number): Promise<AscensionIncomeSnapshot | null> {
        const statsElementIds = ['', 'ascCubeStats', 'ascTessStats', 'ascHyperStats', 'ascPlatonicStats', 'ascHepteractStats'];
        const incomeElementIds = ['', 'ascCubes', 'ascTess', 'ascHyper', 'ascPlatonic', 'ascHepteract'];
        const statsElement = document.querySelector(`#${statsElementIds[resourceId]}`) as HTMLElement | null;
        const incomeElement = document.querySelector(`#${incomeElementIds[resourceId]}`) as HTMLElement | null;
        const unitElement = document.querySelector(`#unit${resourceId}`) as HTMLElement | null;
        const ascensionSpeedElement = document.querySelector('#ascAscensionTimeAccel') as HTMLElement | null;

        if (!statsElement || !incomeElement || !unitElement || !ascensionSpeedElement) {
            HSLogger.warn(`Could not find ascension resource ${resourceId} or its speed display`, this.context);
            return null;
        }

        const wasPerSecond = unitElement.textContent?.trim() === '/s';
        const readDisplayedIncome = () => HSNumberParser.parse(incomeElement.innerText);
        let rawPerSecond: number;
        let onAscension: number;

        try {
            if (wasPerSecond) {
                rawPerSecond = readDisplayedIncome();
                const switched = await this.#switchAscensionIncomeMode(
                    statsElement,
                    incomeElement,
                    unitElement,
                    false
                );

                if (!switched) {
                    HSLogger.warn(`Could not switch ascension resource ${resourceId} to ascension-gain mode`, this.context);
                    return null;
                }

                onAscension = readDisplayedIncome();
            } else {
                onAscension = readDisplayedIncome();
                const switched = await this.#switchAscensionIncomeMode(
                    statsElement,
                    incomeElement,
                    unitElement,
                    true
                );

                if (!switched) {
                    HSLogger.warn(`Could not switch ascension resource ${resourceId} to /s mode`, this.context);
                    return null;
                }

                rawPerSecond = readDisplayedIncome();
            }

            const ascensionSpeedText = ascensionSpeedElement.innerText.trim();
            const ascensionSpeed = ascensionSpeedText.endsWith('*')
                ? 1e6
                : HSNumberParser.parse(ascensionSpeedText);

            if (Number.isNaN(rawPerSecond) || Number.isNaN(onAscension) || Number.isNaN(ascensionSpeed)) {
                return null;
            }

            return {
                perSecond: rawPerSecond * ascensionSpeed,
                onAscension
            };
        } catch (e) {
            HSLogger.warn(`Error while reading ascension resource ${resourceId} income: ${e}`, this.context);
            return null;
        } finally {
            const isPerSecond = unitElement.textContent?.trim() === '/s';
            if (isPerSecond !== wasPerSecond) {
                await this.#switchAscensionIncomeMode(
                    statsElement,
                    incomeElement,
                    unitElement,
                    wasPerSecond
                );
            }
        }
    }

    #queueAscensionIncomeRead<T>(readIncome: () => Promise<T>): Promise<T> {
        const queuedRead = this.#ascensionIncomeReadQueue.then(readIncome, readIncome);
        this.#ascensionIncomeReadQueue = queuedRead.then(() => undefined, () => undefined);
        return queuedRead;
    }

    #readHepteractIncome(): Promise<AscensionIncomeSnapshot | null> {
        return this.#queueAscensionIncomeRead(() => this.#readAscensionIncome(5));
    }

    #readAllAscensionIncome(): Promise<Array<AscensionIncomeSnapshot | null>> {
        return this.#queueAscensionIncomeRead(() => Promise.all(
            [1, 2, 3, 4, 5].map(resourceId => this.#readAscensionIncome(resourceId))
        ));
    }

    #showPlatonicUpgradeEstimate(text: string) {
        if (!this.#platonicUpgradeDescriptions) return;

        let estimateElement = this.#platonicUpgradeDescriptions.querySelector('#hs-platonic-upgrade-estimate') as HTMLParagraphElement | null;
        if (!estimateElement) {
            estimateElement = document.createElement('p');
            estimateElement.id = 'hs-platonic-upgrade-estimate';
            estimateElement.className = 'platonicPortion';
            estimateElement.style.color = 'cyan';
            this.#platonicUpgradeDescriptions.appendChild(estimateElement);
        }
        estimateElement.innerText = `[HS] ${text}`;
    }

    #removePlatonicUpgradeEstimate() {
        this.#platonicUpgradeDescriptions?.querySelector('#hs-platonic-upgrade-estimate')?.remove();
    }

    #readPlatonicRequirement(elementId: string): number | null {
        const text = document.querySelector(`#${elementId}`)?.textContent ?? '';
        const parsed = HSNumberParser.parse(text.slice(text.lastIndexOf('/') + 1));
        return Number.isNaN(parsed) ? null : parsed;
    }

    #timeUntilResource(
        resource: string,
        required: number,
        owned: number,
        income: AscensionIncomeSnapshot | null
    ): PlatonicResourceEstimate {
        if (required <= owned) return { resource, seconds: 0 };
        if (!income) return { resource, seconds: Number.POSITIVE_INFINITY };

        const remainingAfterAscension = Math.max(0, required - owned - income.onAscension);
        const seconds = remainingAfterAscension === 0
            ? 0
            : income.perSecond > 0
                ? remainingAfterAscension / income.perSecond
                : Number.POSITIVE_INFINITY;
        return { resource, seconds };
    }

    async #updatePlatonicUpgradeEstimate(upgradeId: number) {
        if (this.#hoveredPlatonicUpgradeId !== upgradeId) return;

        const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        if (!gameDataAPI || !gameDataAPI.getGameData()) {
            this.#showPlatonicUpgradeEstimate('Upgrade time unavailable: game data has not loaded yet.');
            return;
        }

        const levelText = document.querySelector('#platonicUpgradeLevel')?.textContent ?? '';
        const levelValues = HSNumberParser.parseAll(levelText);
        if (levelValues.length >= 2 && levelValues[0] >= levelValues[1]) {
            this.#showPlatonicUpgradeEstimate('Time until next level: maxed | Longest requirement: none');
            return;
        }

        const requirements = {
            cubes: this.#readPlatonicRequirement('platonicCubeCost'),
            tesseracts: this.#readPlatonicRequirement('platonicTesseractCost'),
            hypercubes: this.#readPlatonicRequirement('platonicHypercubeCost'),
            platonics: this.#readPlatonicRequirement('platonicPlatonicCost'),
            abyssals: this.#readPlatonicRequirement('platonicHepteractCost')
        };

        if (Object.values(requirements).some(value => value === null)) {
            this.#showPlatonicUpgradeEstimate('Upgrade time unavailable: could not read every requirement.');
            return;
        }

        const income = await this.#readAllAscensionIncome();
        if (this.#hoveredPlatonicUpgradeId !== upgradeId) return;

        // Read owned resources after sampling the header modes so the ETA does
        // not use the older periodic GDS snapshot. This forces one save-derived
        // refresh without enabling GDS turbo mode.
        const gameData = await gameDataAPI.getForcedGameData();
        if (this.#hoveredPlatonicUpgradeId !== upgradeId) return;
        if (!gameData) {
            this.#showPlatonicUpgradeEstimate('Upgrade time unavailable: could not refresh current resources.');
            return;
        }

        const requiredAbyssals = requirements.abyssals ?? 0;
        const abyssHepteract = gameData.hepteracts?.abyss;
        const ownedAbyssals = parseGameDataNumber(abyssHepteract?.BAL ?? 0);
        const hasDoubleCapacity = Boolean(
            gameDataAPI.getSingularityChallengeEffect('limitedAscensions', 'hepteractCap')
        );
        const abyssalsToCraft = hepteractUnitsToReach(
            { balance: ownedAbyssals, ...hepteractCapacities('abyss', abyssHepteract?.TIMES_CAP_EXTENDED ?? 0, hasDoubleCapacity) },
            requiredAbyssals
        );
        const hepteractCostMultiplier = gameDataAPI.calculateSingularityDebuff('Hepteract Costs');
        const rawHepteractsNeeded = abyssalsToCraft * HEPTERACT_DATA.abyss.conversion * hepteractCostMultiplier;
        const abyssCraftCubeCost = abyssalsToCraft * 69 * hepteractCostMultiplier;

        const estimates: PlatonicResourceEstimate[] = [
            this.#timeUntilResource(
                'Wow! Cubes',
                (requirements.cubes ?? 0) + abyssCraftCubeCost,
                parseGameDataNumber(gameData.wowCubes),
                income[0]
            ),
            this.#timeUntilResource('Wow! Tesseracts', requirements.tesseracts ?? 0, parseGameDataNumber(gameData.wowTesseracts), income[1]),
            this.#timeUntilResource('Wow! Hypercubes', requirements.hypercubes ?? 0, parseGameDataNumber(gameData.wowHypercubes), income[2]),
            this.#timeUntilResource('Platonic Cubes', requirements.platonics ?? 0, parseGameDataNumber(gameData.wowPlatonicCubes), income[3]),
            this.#timeUntilResource(
                'Hepteracts for Abyss Hepteracts',
                rawHepteractsNeeded,
                parseGameDataNumber(gameData.wowAbyssals),
                income[4]
            )
        ];

        const bottleneck = estimates.reduce((longest, current) => current.seconds > longest.seconds ? current : longest);
        const longestRequirement = bottleneck.seconds > 0 ? bottleneck.resource : 'none';
        this.#showPlatonicUpgradeEstimate(
            `Time until next level: ${this.#formatDuration(bottleneck.seconds)} | Longest requirement: ${longestRequirement}`
        );
    }

    #formatDuration(seconds: number): string {
        if (!Number.isFinite(seconds)) return '∞';
        if (seconds <= 0) return 'ready now';
        if (seconds < 1) return '<1s';

        let remaining = Math.floor(seconds);
        const units = [
            { label: 'y', seconds: 31_557_600 },
            { label: 'd', seconds: 86_400 },
            { label: 'h', seconds: 3_600 },
            { label: 'm', seconds: 60 },
            { label: 's', seconds: 1 }
        ];
        const parts: string[] = [];

        for (const unit of units) {
            const amount = Math.floor(remaining / unit.seconds);
            if (amount > 0) {
                parts.push(`${amount}${unit.label}`);
                remaining %= unit.seconds;
            }
            if (parts.length === 2) break;
        }

        return parts.join(' ');
    }

    async #updateCraftText(estimate: HepteractQuickExpandEstimate, hepteractId: string, isQuarkHepteract: boolean = false) {
        if (this.#hoveredHepteractId !== hepteractId) return;

        const { cost: buyCost, expandsCapacity } = estimate;

        if (this.#hepteractCraftTexts) {
            const resource = isQuarkHepteract ? 'QUARK' : 'HEPT';
            let etaText = '';

            if (!isQuarkHepteract) {
                const income = await this.#readHepteractIncome();

                if (this.#hoveredHepteractId !== hepteractId) return;

                if (income !== null) {
                    this.#refreshOwnedHepteracts();
                    const remainingCost = Math.max(0, buyCost - (this.#ownedHepteracts ?? 0) - income.onAscension);
                    const secondsUntilAffordable = income.perSecond > 0
                        ? remainingCost / income.perSecond
                        : Number.POSITIVE_INFINITY;
                    const totalSeconds = income.perSecond > 0
                        ? buyCost / income.perSecond
                        : Number.POSITIVE_INFINITY;

                    etaText = `\nTime until affordable: ${this.#formatDuration(secondsUntilAffordable)} (total time: ${this.#formatDuration(totalSeconds)})`;
                }
            }

            if (this.#hoveredHepteractId !== hepteractId) return;

            this.#refreshOwnedHepteracts();
            const owned = isQuarkHepteract ? this.#readOwnedQuarks() : this.#ownedHepteracts;
            const percentOwned = owned && owned > 0 ? buyCost / owned : '∞';
            const persOwn = typeof percentOwned === 'number' ? HSUtils.N(percentOwned * 100) : percentOwned;

            const action = expandsCapacity ? 'max after next expand' : 'fill current capacity';
            const text = `[${this.context}]: Total ${resource} cost to ${action}: ${HSUtils.N(buyCost)} (${persOwn}% of owned)${etaText}`;
            const costText = this.#getCraftTextSlot();
            if (costText) costText.textContent = text;

        }
    }
}
