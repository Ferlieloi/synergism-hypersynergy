import { CUBE_VIEW, MAIN_VIEW } from "../../types/module-types/hs-gamestate-types";
import { HSElementHooker } from "../hs-core/hs-elementhooker";
import { HSGameState } from "../hs-core/hs-gamestate";
import { HSLogger } from "../hs-core/hs-logger";
import { HSModule } from "../hs-core/module/hs-module";
import { HSModuleManager } from "../hs-core/module/hs-module-manager";
import { HSSetting } from "../hs-core/settings/hs-setting";
import { HSSettings } from "../hs-core/settings/hs-settings";
import { HSUI } from "../hs-core/hs-ui";
import { HSUtils } from "../hs-utils/hs-utils";
import { HSModuleOptions } from "../../types/hs-types";
import { HSGameDataAPI } from "../hs-core/gds/hs-gamedata-api";
import { parseGameDataNumber } from "../hs-core/gds/hs-gamedata-utils";

type AscensionIncomeSnapshot = {
    perSecond: number;
    onAscension: number;
};

type PlatonicResourceEstimate = {
    resource: string;
    seconds: number;
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

    #chronosToMinChrHypChaRatio = 0;
    #hyperToMinChrHypChaRatio = 0;
    #challengeToMinChrHypChaRatio = 0;
    #acceleratorToMinAccBooMulRatio = 0;
    #boostToMinAccBooMulRatio = 0;
    #multiplierToMinAccBooMulRatio = 0;
    #chronosToMinChrAccRatio = 0;
    #acceleratorToMinChrAccRatio = 0;


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

    #hepteractForgeView?: HTMLElement;
    #hoveredHepteractId: string | null = null;
    #craftTextRefreshTimer?: ReturnType<typeof setInterval>;
    #ascensionIncomeReadQueue: Promise<unknown> = Promise.resolve();

    #platonicUpgradeDescriptions?: HTMLElement;
    #hoveredPlatonicUpgradeId: number | null = null;

    #ownedHepteractsElement?: HTMLElement;
    #ownedHepteracts?: number;
    #ownedHepteractsWatch?: string;

    #ownedQuarkElement?: HTMLElement;
    #ownedQuarks?: number;
    #ownedQuarksWatch?: string;

    // Quick expand is expected to be spam clicked
    // We need to make sure that hepteract expansion + max goes through
    // and owned hepteracts value is updated before quick expand can be done again
    // Otherwise the hepteract quick expand cost protection might not trigger right
    #expandPending = false;
    #watchUpdatePending = false;

    constructor(moduleOptions: HSModuleOptions) {
        super(moduleOptions);

        this.#hepteracts = this.#hepteractBaseNames.map(h => {
            return `${h}Hepteract`;
        });

        this.#hepteractMeters = this.#hepteractBaseNames.map(h => {
            return `${h}ProgressBarText`;
        });
    }

    async init(): Promise<void> {
        const self = this;

        HSLogger.log("Initialising HSHepteracts module", this.context);

        const gameStateMod = HSModuleManager.getModule<HSGameState>('HSGameState');

        if (gameStateMod) {
            gameStateMod.subscribeGameStateChange("MAIN_VIEW", (prevView, currentView) => {
                if (prevView.getId() === MAIN_VIEW.CUBES &&
                    currentView.getId() !== MAIN_VIEW.CUBES &&
                    gameStateMod.getCurrentUIView("CUBE_VIEW").getId() === CUBE_VIEW.HEPTERACT_FORGE
                ) {
                    if (self.#ownedHepteractsWatch) {
                        HSLogger.debug(() => "Hepteract forge view closed, stopping hepteract watch", this.context);
                        HSElementHooker.stopWatching(self.#ownedHepteractsWatch);
                    }
                    if (self.#ownedQuarksWatch) {
                        HSLogger.debug(() => "Hepteract forge view closed, stopping quark watch", this.context);
                        HSElementHooker.stopWatching(self.#ownedQuarksWatch);
                    }
                }
            });

            gameStateMod.subscribeGameStateChange("CUBE_VIEW", async (prevView, currentView) => {
                if (currentView.getId() === CUBE_VIEW.HEPTERACT_FORGE) {
                    HSLogger.debug(() => "Hepteract forge view opened, starting watch", this.context);
                    self.#ownedHepteractsElement = await HSElementHooker.HookElement('#hepteractQuantity') as HTMLElement;

                    // Sets up a watch to watch for changes in the element which shows owned hepteracts amount
                    self.#ownedHepteractsWatch = HSElementHooker.watchElement(self.#ownedHepteractsElement, (value) => {
                        try {
                            const hepts = parseFloat(HSUtils.unfuckNumericString(value));
                            self.#ownedHepteracts = hepts;
                        } catch (e) {
                            HSLogger.error(`Failed to parse owned hepteracts`, self.context);
                        }

                        self.#watchUpdatePending = false;
                    },
                        {
                            greedy: true,
                            overrideThrottle: true,
                            valueParser: (element) => {
                                const subElement = element.querySelector('span');
                                const value = subElement?.innerText;
                                return value;
                            }
                        });

                    self.#ownedQuarkElement = await HSElementHooker.HookElement('#quarkDisplay') as HTMLElement;
                    const initialQuarks = parseFloat(HSUtils.unfuckNumericString(self.#ownedQuarkElement.innerText));
                    self.#ownedQuarks = initialQuarks;
                    setInterval(() => {
                        const current = document.querySelector('#quarkDisplay');

                        console.log(
                            'Same element?',
                            current === self.#ownedQuarkElement,
                            'Current text:',
                            current?.textContent
                        );
                    }, 5000);
                    self.#ownedQuarksWatch = HSElementHooker.watchElement(self.#ownedQuarkElement, (value) => {
                        try {
                            const quarks = parseFloat(HSUtils.unfuckNumericString(value));
                            self.#ownedQuarks = quarks;
                        } catch (e) {
                            HSLogger.error(`Failed to parse quark amount`, self.context);
                        }

                        self.#watchUpdatePending = false;
                    },
                        {
                            greedy: true,
                            overrideThrottle: true,
                            valueParser: (element) => element.innerText
                        }
                    );
                } else if (prevView.getId() === CUBE_VIEW.HEPTERACT_FORGE) {
                    if (self.#ownedHepteractsWatch) {
                        HSLogger.debug(() => "Hepteract forge view closed, stopping hepteract watch", this.context);
                        HSElementHooker.stopWatching(self.#ownedHepteractsWatch);
                    }
                    if (self.#ownedQuarksWatch) {
                        HSLogger.debug(() => "Hepteract forge view closed, stopping quark watch", this.context);
                        HSElementHooker.stopWatching(self.#ownedQuarksWatch);
                    }
                }
            });
        }

        this.#heptGrid = await HSElementHooker.HookElement('#heptGrid');
        this.#hepteractCraftTexts = await HSElementHooker.HookElement('#hepteractCraftTexts') as HTMLDivElement;

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

                        const costElement = document.querySelector('#hepteractCostText') as HTMLDivElement;

                        if (costElement) {
                            const costString = costElement.innerText;
                            const costMatch = costString.match(/you\s+(.*?)\s+Hepteracts/i);

                            if (costMatch) {
                                const cost = costMatch[1];

                                try {
                                    if (id in self.#hepteractCosts) {
                                        const floatCost = HSUtils.parseFloat2(cost);
                                        (self.#hepteractCosts as any)[id] = floatCost;
                                    }
                                } catch (e) {
                                    HSLogger.warn(`Error while parsing hepteract cost for ${id}`, self.context);
                                }
                            }
                        }
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

                            if (self.#expandPending || self.#watchUpdatePending) {
                                HSLogger.debug(() => `Quick expand cancelled, another expand was still pending (exp ${self.#expandPending}, wtch: ${self.#watchUpdatePending})`, self.context);
                                //self.#expandPending = false;
                                return;
                            }

                            self.#expandPending = true;
                            //self.#watchUpdatePending = true;

                            let buyCost: number | null = null;

                            let percentHeptOwned: number | null = null;
                            //let percentObtOwned = null;
                            //let percentOfferingOwned = null;

                            if (self.#ownedHepteracts !== null && self.#ownedHepteracts !== undefined) {
                                if (self.#ownedHepteracts === 0) {
                                    HSLogger.info(`Owned hepteracts is 0`, this.context);
                                    self.#expandPending = false;
                                    return;
                                }

                                const currentMax = (self.#boxCounts as any)[id];
                                const cubeCost = (self.#hepteractCosts as any)[id];

                                if (currentMax === null || cubeCost === null) {
                                    HSLogger.warn(`Hepteract cost for ${id} not parsed yet`, self.context);
                                }

                                let hepteractDoubleCapSetting = HSSettings.getSetting('expandCostProtectionDoubleCap') as HSSetting<boolean>;
                                let nextHepts = null;

                                if (hepteractDoubleCapSetting.getValue()) {
                                    nextHepts = ((currentMax * 2) /*- currentMax*/)
                                    buyCost = ((currentMax * 2) /*- currentMax*/) * cubeCost;
                                } else {
                                    nextHepts = currentMax * 2;
                                    buyCost = currentMax * 2 * cubeCost;
                                }

                                percentHeptOwned = self.#ownedHepteracts > 0 ? buyCost / self.#ownedHepteracts : 1;

                                /*const obtHolder = await HSElementHooker.HookElement('#obtainiumDisplay') as HTMLElement;
                                const offeringHolder = await HSElementHooker.HookElement('#offeringDisplay') as HTMLElement;

                                if(obtHolder && offeringHolder) {
                                    const obtText = obtHolder.innerText;
                                    const offeringText = offeringHolder.innerText;

                                    if(obtText && offeringText) {
                                        const obtValue = parseFloat(HSUtils.unfuckNumericString(obtHolder.innerText));
                                        const offeringValue = parseFloat(HSUtils.unfuckNumericString(offeringHolder.innerText));

                                        percentObtOwned = ;
                                        percentOfferingOwned = ;
                                    }
                                }*/

                                HSLogger.debug(() => `
                                    Current max: ${currentMax},
                                    Cube cost: ${HSUtils.N(cubeCost ?? 0)},
                                    Next hepts: ${HSUtils.N(nextHepts ?? 0)},
                                    Buy cost: ${HSUtils.N(buyCost ?? 0)},
                                    Percent owned: ${HSUtils.N(percentHeptOwned ?? 0)},
                                    Double Cap: ${hepteractDoubleCapSetting.getValue()}`,
                                    this.context
                                );

                                const expandCostProtectionSetting = HSSettings.getSetting('expandCostProtection') as HSSetting<number>;
                                //const expandCostProtectionObtainiumSetting = HSSettings.getSetting('expandCostProtectionObtainium') as HSSetting<number>;
                                //const expandCostProtectionOfferingSetting = HSSettings.getSetting('expandCostProtectionOffering') as HSSetting<number>;
                                const costProtectionNotificationSetting = HSSettings.getSetting('expandCostProtectionNotifications') as HSSetting<boolean>;

                                const notify = (costProtectionNotificationSetting && costProtectionNotificationSetting.getValue() === true) ? false : true;

                                if (expandCostProtectionSetting.isEnabled()) {
                                    const heptSettingValue = expandCostProtectionSetting.getCalculatedValue();

                                    if (heptSettingValue && (percentHeptOwned >= heptSettingValue)) {
                                        if (notify)
                                            HSLogger.info(`Hept. cost protection: Cost owned ${HSUtils.N(percentHeptOwned * 100)}% >= ${heptSettingValue * 100}%`, this.context);

                                        //self.#watchUpdatePending = false;
                                        self.#expandPending = false;
                                        return;
                                    }
                                }

                                /*if(expandCostProtectionObtainiumSetting.isEnabled()) {
                                    const obtSettingValue = expandCostProtectionObtainiumSetting.getCalculatedValue();

                                    if(obtSettingValue && percentObtOwned >= obtSettingValue) {
                                        if(notify)
                                            HSLogger.info(`Obt. cost protection: ${percentObtOwned.toFixed(2)} >= ${obtSettingValue}`, this.context);
    
                                        self.#watchUpdatePending = false;
                                        self.#expandPending = false;
                                        return;
                                    }
                                }

                                if(expandCostProtectionOfferingSetting.isEnabled()) {
                                    const offeringSettingValue = expandCostProtectionOfferingSetting.getCalculatedValue();

                                    if(offeringSettingValue && percentOfferingOwned >= offeringSettingValue) {
                                        if(notify)
                                            HSLogger.info(`Off. cost protection: ${percentOfferingOwned.toFixed(2)} >= ${offeringSettingValue}`, this.context);
    
                                        self.#watchUpdatePending = false;
                                        self.#expandPending = false;
                                        return;
                                    }
                                }*/
                            } else {
                                HSLogger.warn(`Owned hepteracts not parsed yet`, this.context);

                                self.#watchUpdatePending = false;
                                self.#expandPending = false;
                                return;
                            }

                            // This is the small "ON/OFF" toggle button which is used to enable/disable the hepteract buy notifications
                            const hepteractBuyNotificationToggle = await HSElementHooker.HookElement('#toggle35') as HTMLButtonElement;

                            if (hepteractBuyNotificationToggle && hepteractBuyNotificationToggle.innerText.includes('ON')) {
                                HSLogger.info(`Turned hepteract notification toggle OFF`, this.context);
                                hepteractBuyNotificationToggle.click();
                            }

                            // Perform our cap- and max button clicking
                            await HSUtils.hiddenAction(async () => {
                                capBtn.click();
                            }, "confirm", false, 25);

                            await HSUtils.wait(25);

                            craftMaxBtn.click();

                            if (buyCost && percentHeptOwned) {
                                await self.#updateCraftText(buyCost, percentHeptOwned, id);
                            }

                            await HSUtils.wait(5);

                            if (id !== 'quarkHepteract') {
                                const costElement = document.querySelector('#hepteractCostText') as HTMLDivElement;

                                if (costElement) {
                                    const costString = costElement.innerText;
                                    const costMatch = costString.match(/you\s+(.*?)\s+Hepteracts/i);

                                    if (costMatch) {
                                        const cost = costMatch[1];

                                        try {
                                            if (id in self.#hepteractCosts) {
                                                const floatCost = HSUtils.parseFloat2(cost);
                                                (self.#hepteractCosts as any)[id] = floatCost;
                                            }
                                        } catch (e) {
                                            HSLogger.warn(`Error while parsing NEW hepteract cost for ${id}`, self.context);
                                        }
                                    }
                                }
                            }

                            const ownedHeptQuantElement = !self.#ownedHepteractsElement ? document.querySelector('#hepteractQuantity') as HTMLElement : self.#ownedHepteractsElement;

                            if (ownedHeptQuantElement) {
                                const subElement = ownedHeptQuantElement.querySelector('span') as HTMLSpanElement;

                                if (subElement) {
                                    const value = subElement.innerText;
                                    const hepts = parseFloat(value);
                                    self.#ownedHepteracts = hepts;
                                }
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

                        if (Object.values(self.#boxCounts).every(v => v > 0)) {
                            const box = self.#boxCounts;
                            if (!Object.values(box).every(v => v > 0)) return;

                            // group 1: CHR / HYP / CHL
                            const min1 = Math.min(box.chronosHepteract, box.hyperrealismHepteract, box.challengeHepteract);
                            self.#chronosToMinChrHypChaRatio = Math.round(box.chronosHepteract / min1);
                            self.#hyperToMinChrHypChaRatio = Math.round(box.hyperrealismHepteract / min1);
                            self.#challengeToMinChrHypChaRatio = Math.round(box.challengeHepteract / min1);

                            // group 2: ACC / BST / MLT
                            const min2 = Math.min(box.acceleratorHepteract, box.acceleratorBoostHepteract, box.multiplierHepteract);
                            self.#acceleratorToMinAccBooMulRatio = Math.round(box.acceleratorHepteract / min2);
                            self.#boostToMinAccBooMulRatio = Math.round(box.acceleratorBoostHepteract / min2);
                            self.#multiplierToMinAccBooMulRatio = Math.round(box.multiplierHepteract / min2);

                            // group 3: CHR / ACC
                            const min3 = Math.min(box.chronosHepteract, box.acceleratorHepteract);
                            self.#chronosToMinChrAccRatio = Math.round(box.chronosHepteract / min3);
                            self.#acceleratorToMinChrAccRatio = Math.round(box.acceleratorHepteract / min3);

                            if (this.#ratioElementA && this.#ratioElementB && this.#ratioElementC) {
                                this.#ratioElementA.innerText = `CHR/HYP/CHL: ${HSUtils.N(self.#chronosToMinChrHypChaRatio, 0)} / ${HSUtils.N(self.#hyperToMinChrHypChaRatio, 0)} / ${HSUtils.N(self.#challengeToMinChrHypChaRatio, 0)}`;
                                this.#ratioElementB.innerText = `ACC/BST/MLT: ${HSUtils.N(self.#acceleratorToMinAccBooMulRatio, 0)} / ${HSUtils.N(self.#boostToMinAccBooMulRatio, 0)} / ${HSUtils.N(self.#multiplierToMinAccBooMulRatio, 0)}`;
                                this.#ratioElementC.innerText = `CHR/ACC: ${HSUtils.N(self.#chronosToMinChrAccRatio, 0)} / ${HSUtils.N(self.#acceleratorToMinChrAccRatio, 0)}`;
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
                                        return parseFloat(HSUtils.unfuckNumericString(split[1]));
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

    // Not used yet, but might be useful in the future
    #getHepteractCost(hepteractId: string): { cost: number; percentOwned: number } | undefined {
        const costObj: { cost: number; percentOwned: number } = {
            cost: 0,
            percentOwned: 0
        }

        if (this.#ownedHepteracts !== null && this.#ownedHepteracts !== undefined) {
            if (this.#ownedHepteracts === 0) {
                HSLogger.info(`Owned hepteracts is 0`, this.context);
                return undefined;
            }

            const currentMax = (this.#boxCounts as any)[hepteractId];
            const cubeCost = (this.#hepteractCosts as any)[hepteractId];

            if (currentMax === null || cubeCost === null) {
                HSLogger.warn(`Hepteract cost for ${hepteractId} not parsed yet`, this.context);
                return undefined;
            };

            let hepteractDoubleCapSetting = HSSettings.getSetting('expandCostProtectionDoubleCap') as HSSetting<boolean>;
            let buyCost = null;

            if (hepteractDoubleCapSetting.getValue()) {
                buyCost = currentMax * cubeCost;
            } else {
                buyCost = currentMax * 2 * cubeCost;
            }

            const percentOwned = this.#ownedHepteracts > 0 ? buyCost / this.#ownedHepteracts : 1;

            return {
                cost: buyCost,
                percentOwned: percentOwned
            }
        } else {
            HSLogger.warn(`Owned hepteracts not parsed yet`, this.context);
            return undefined;
        }
    }

    #removeCraftText() {
        this.#hepteractCraftTexts?.querySelector('#hs-costText')?.remove();
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
        if (this.#hoveredHepteractId !== hepteractId
            || this.#ownedHepteracts === null
            || this.#ownedHepteracts === undefined) {
            return;
        }

        const currentMax = (this.#boxCounts as any)[hepteractId];
        const cubeCost = (this.#hepteractCosts as any)[hepteractId];

        if (currentMax === null || currentMax === undefined || cubeCost === null || cubeCost === undefined) return;

        const hepteractDoubleCapSetting = HSSettings.getSetting('expandCostProtectionDoubleCap') as HSSetting<boolean>;
        const buyCost = hepteractDoubleCapSetting.getValue()
            ? (currentMax * 2) * cubeCost * 0.75
            : currentMax * 2 * cubeCost;
        const percentOwned = this.#ownedHepteracts === 0
            ? '∞'
            : buyCost / this.#ownedHepteracts;

        await this.#updateCraftText(buyCost, percentOwned, hepteractId, isQuarkHepteract);
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
        const readDisplayedIncome = () => parseFloat(HSUtils.unfuckNumericString(incomeElement.innerText));
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
                : parseFloat(HSUtils.unfuckNumericString(ascensionSpeedText));

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
        estimateElement.innerText = text;
    }

    #removePlatonicUpgradeEstimate() {
        this.#platonicUpgradeDescriptions?.querySelector('#hs-platonic-upgrade-estimate')?.remove();
    }

    #readPlatonicRequirement(elementId: string): number | null {
        const text = document.querySelector(`#${elementId}`)?.textContent ?? '';
        const requirementText = text.slice(text.lastIndexOf('/') + 1);
        const numericMatch = requirementText.match(/[-+]?\d[\d.,]*(?:e[-+]?\d+)?/i);
        if (!numericMatch) return null;

        const parsed = parseFloat(HSUtils.unfuckNumericString(numericMatch[0]));
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

    #calculateAbyssHepteractsToCraft(
        requiredBalance: number,
        currentBalance: number,
        timesCapacityExtended: number,
        hasDoubleCapacity: boolean
    ): number {
        if (requiredBalance <= currentBalance) return 0;

        let balance = Math.max(0, currentBalance);
        let baseCapacity = Math.pow(2, Math.max(0, Math.floor(timesCapacityExtended)));
        const capacityMultiplier = hasDoubleCapacity ? 2 : 1;
        let finalCapacity = baseCapacity * capacityMultiplier;
        let amountToCraft = 0;

        // Mirrors autoCraftHepteracts: fill the current final capacity, spend
        // the old base capacity to expand, then double both capacities. The
        // double-capacity reward therefore retains 1/4 of the new final cap.
        while (requiredBalance > finalCapacity) {
            const amountToFill = Math.max(0, finalCapacity - balance);
            amountToCraft += amountToFill;
            balance += amountToFill;

            balance = Math.max(0, balance - baseCapacity);
            baseCapacity *= 2;
            finalCapacity = baseCapacity * capacityMultiplier;

            if (!Number.isFinite(amountToCraft) || !Number.isFinite(finalCapacity)) {
                return Number.POSITIVE_INFINITY;
            }
        }

        return amountToCraft + Math.max(0, requiredBalance - balance);
    }

    async #updatePlatonicUpgradeEstimate(upgradeId: number) {
        if (this.#hoveredPlatonicUpgradeId !== upgradeId) return;

        const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        const gameData = gameDataAPI?.getGameData();
        if (!gameDataAPI || !gameData) {
            this.#showPlatonicUpgradeEstimate('Upgrade time unavailable: game data has not loaded yet.');
            return;
        }

        const levelText = document.querySelector('#platonicUpgradeLevel')?.textContent ?? '';
        const levelValues = levelText.match(/\d[\d.,]*(?:e[-+]?\d+)?/gi)
            ?.map(value => parseFloat(HSUtils.unfuckNumericString(value))) ?? [];
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

        const requiredAbyssals = requirements.abyssals ?? 0;
        const abyssHepteract = gameData.hepteracts?.abyss;
        const ownedAbyssals = parseGameDataNumber(abyssHepteract?.BAL ?? 0);
        const hasDoubleCapacity = Boolean(
            gameDataAPI.getSingularityChallengeEffect('limitedAscensions', 'hepteractCap')
        );
        const abyssalsToCraft = this.#calculateAbyssHepteractsToCraft(
            requiredAbyssals,
            ownedAbyssals,
            abyssHepteract?.TIMES_CAP_EXTENDED ?? 0,
            hasDoubleCapacity
        );
        const hepteractCostMultiplier = gameDataAPI.calculateSingularityDebuff('Hepteract Costs');
        const rawHepteractsNeeded = abyssalsToCraft * 1e8 * hepteractCostMultiplier;
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

    async #updateCraftText(buyCost: number, percentOwned: number | string, hepteractId: string, isQuarkHepteract: boolean = false) {
        if (this.#hoveredHepteractId !== hepteractId) return;

        if (this.#hepteractCraftTexts) {
            let persOwn;
            if (isQuarkHepteract) {
                percentOwned = this.#ownedQuarks && this.#ownedQuarks > 0 ? buyCost / this.#ownedQuarks : '∞';
                console.log(`Quark hepteract cost: ${buyCost}, owned quarks: ${this.#ownedQuarks}, percent owned: ${percentOwned}`);
            }

            if (HSUtils.isNumeric(percentOwned)) {
                persOwn = HSUtils.N(percentOwned as number * 100);
            } else {
                persOwn = percentOwned as string;
            }
            const resource = isQuarkHepteract ? 'QUARK' : 'HEPT';
            let etaText = '';

            if (!isQuarkHepteract) {
                const income = await this.#readHepteractIncome();

                if (this.#hoveredHepteractId !== hepteractId) return;

                if (income !== null) {
                    const ownedHepteracts = this.#ownedHepteracts ?? 0;
                    const remainingCost = Math.max(0, buyCost - ownedHepteracts - income.onAscension);
                    const secondsUntilAffordable = income.perSecond > 0
                        ? remainingCost / income.perSecond
                        : Number.POSITIVE_INFINITY;
                    const totalSeconds = income.perSecond > 0
                        ? buyCost / income.perSecond
                        : Number.POSITIVE_INFINITY;

                    etaText = ` | Time until affordable: ${this.#formatDuration(secondsUntilAffordable)} (total time: ${this.#formatDuration(totalSeconds)})`;
                }
            }

            if (this.#hoveredHepteractId !== hepteractId) return;

            const hasCostText = this.#hepteractCraftTexts.querySelector('#hs-costText') as HTMLDivElement;
            const text = `[${this.context}]: Total ${resource} cost to max after next expand: ${HSUtils.N(buyCost)} (${persOwn}% of owned)${etaText}`;
            if (!hasCostText) {
                const costText = document.createElement('div');
                costText.id = 'hs-costText';

                costText.innerText = text;

                this.#hepteractCraftTexts.appendChild(costText);
            } else {
                hasCostText.innerText = text;
            }

        }
    }
}
