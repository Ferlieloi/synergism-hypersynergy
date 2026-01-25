import { HSModuleOptions } from "../../types/hs-types";
import { ANT_VIEW, ANT_VIEW_BUTTON_IDS, BUILDING_VIEW, BUILDING_VIEW_BUTTON_IDS, CHALLENGE_VIEW, CHALLENGE_VIEW_BUTTON_IDS, CUBE_VIEW, CUBE_VIEW_BUTTON_IDS, GAME_STATE_CHANGE, HSViewState, HSViewStateRecord, MAIN_VIEW, MAIN_VIEW_BUTTON_IDS, PSEUDOCOIN_VIEW, PSEUDOCOIN_VIEW_BUTTON_IDS, RUNE_VIEW, RUNE_VIEW_BUTTON_IDS, SETTINGS_VIEW, SETTINGS_VIEW_BUTTON_IDS, SINGULARITY_VIEW, SINGULARITY_VIEW_BUTTON_IDS, View, VIEW_KEY, VIEW_TYPE } from "../../types/module-types/hs-gamestate-types";
import { HSUtils } from "../hs-utils/hs-utils";
import { HSElementHooker } from "./hs-elementhooker";
import { HSGlobal } from "./hs-global";
import { HSLogger } from "./hs-logger";
import { HSModule } from "./module/hs-module";

export class HSGameState extends HSModule {

    #UNKNOWN_VIEW = -1;

    #viewClasses: Record<string, new (name: string) => GameView<VIEW_TYPE>> = {
        "BuildingView": BuildingView,
        "RuneView": RuneView,
        "ChallengeView": ChallengeView,
        "AntView": AntView,
        "CubeView": CubeView,
        "SettingsView": SettingsView,
        "SingularityView": SingularityView,
        "PseudoCoinView": PseudoCoinView,
    };

    #viewStates: HSViewStateRecord = {
        MAIN_VIEW: { currentView: new MainView('unknown'), previousView: new MainView('unknown'), viewChangeSubscribers: new Map() },
        BUILDING_VIEW: { currentView: new BuildingView('unknown'), previousView: new BuildingView('unknown'), viewChangeSubscribers: new Map() },
        RUNE_VIEW: { currentView: new RuneView('unknown'), previousView: new RuneView('unknown'), viewChangeSubscribers: new Map() },
        CHALLENGE_VIEW: { currentView: new ChallengeView('unknown'), previousView: new ChallengeView('unknown'), viewChangeSubscribers: new Map() },
        ANT_VIEW: { currentView: new AntView('unknown'), previousView: new AntView('unknown'), viewChangeSubscribers: new Map() },
        CUBE_VIEW: { currentView: new CubeView('unknown'), previousView: new CubeView('unknown'), viewChangeSubscribers: new Map() },
        SETTINGS_VIEW: { currentView: new SettingsView('unknown'), previousView: new SettingsView('unknown'), viewChangeSubscribers: new Map() },
        SINGULARITY_VIEW: { currentView: new SingularityView('unknown'), previousView: new SingularityView('unknown'), viewChangeSubscribers: new Map() },
        PSEUDOCOIN_VIEW: { currentView: new PseudoCoinView('unknown'), previousView: new PseudoCoinView('unknown'), viewChangeSubscribers: new Map() }
    };

    #mainUIViews: string[] = [
        'buildings',
        'upgrades',
        'statistics',
        'runes',
        'challenges',
        'research',
        'ants',
        'cubes',
        'campaigns',
        'traits',
        'settings',
        'shop',
        'singularity',
        'event',
        'pseudoCoins',
    ];

    constructor(moduleOptions: HSModuleOptions) {
        super(moduleOptions);
    }

    async init() {
        const self = this;
        HSLogger.log(`Initializing HSGameState module`, this.context);

        // Setup watchers and handling for when main UI view changes
        for (const view of this.#mainUIViews) {
            const viewElement = document.querySelector(`#${view}`) as HTMLDivElement;

            HSElementHooker.watchElement(viewElement, async (viewState: { view: string, state: string }) => {
                const { view, state } = viewState;

                if (state !== 'none') {
                    const uiView = new MainView(view);

                    if (uiView.getId() !== MAIN_VIEW.UNKNOWN) {
                        self.#viewStates.MAIN_VIEW.previousView = self.#viewStates.MAIN_VIEW.currentView;
                        self.#viewStates.MAIN_VIEW.currentView = uiView;
                        HSLogger.debug(`Main UI view changed ${self.#viewStates.MAIN_VIEW.previousView.getName()} -> ${self.#viewStates.MAIN_VIEW.currentView.getName()}`, self.context);
                    } else {
                        HSLogger.warn(`Main UI view ${view} not found`, self.context);
                        return;
                    }

                    // Notify subscribers of the main view change
                    self.#viewStates.MAIN_VIEW.viewChangeSubscribers.forEach((callback) => {
                        try {
                            callback(
                                self.#viewStates.MAIN_VIEW.previousView,
                                self.#viewStates.MAIN_VIEW.currentView
                            );
                        } catch (e) {
                            HSLogger.error(`Error when trying to call MAIN VIEW change subscriber callback: ${e}`, self.context);
                        }
                    });

                    this.#resolveSubViewChanges(uiView.getId());
                }
            },
                {
                    characterData: false,
                    childList: false,
                    subtree: false,
                    attributes: true,
                    attributeOldValue: false,
                    attributeFilter: ['style'],
                    valueParser: (element, mutations) => {
                        for (const mutation of mutations) {
                            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                                const target = mutation.target as HTMLElement;
                                const display = target.style.getPropertyValue('display');
                                return {
                                    view: target.id,
                                    state: display
                                }
                            }
                        }
                    }
                });
        }

        HSGlobal.HSGameState.viewProperties.forEach(async (viewProperties, mainViewId) => {
            for (const subViewId of viewProperties.subViewIds) {
                const viewElement = document.querySelector(`#${subViewId}`) as HTMLElement;

                HSElementHooker.watchElement(viewElement, async (viewState: { view: string, state: string }) => {
                    const { view, state } = viewState;

                    if (state !== 'none') {
                        let subViewInstance: GameView<VIEW_TYPE> | undefined = undefined;

                        try {
                            const ViewClass = this.#viewClasses[viewProperties.viewClassName];

                            if (!ViewClass) {
                                throw new Error(`Class "${viewProperties.viewClassName}" not found in viewClasses for mainViewId ${mainViewId}`);
                            }

                            subViewInstance = new ViewClass(subViewId);

                        } catch (error) {
                            HSLogger.warn(`Failed to instantiate sub-view ${viewProperties.viewClassName}: ${error}`, self.context);
                            return;
                        }

                        const viewKey = subViewInstance.getViewKey() as VIEW_KEY;

                        //console.log(subViewId, viewElement, state, viewKey, subViewInstance, subViewInstance.getId())

                        if (subViewInstance.getId() !== self.#UNKNOWN_VIEW) {

                            self.#viewStates[viewKey].previousView = self.#viewStates[viewKey].currentView;
                            self.#viewStates[viewKey].currentView = subViewInstance;

                            const previousView = self.#viewStates[viewKey].previousView;
                            const currentView = self.#viewStates[viewKey].currentView;

                            // Notify subscribers of the main view change
                            self.#viewStates[viewKey].viewChangeSubscribers.forEach((callback) => {
                                try {
                                    callback(previousView, currentView);
                                } catch (e) {
                                    HSLogger.error(`Error when trying to call CUBE VIEW change subscriber callback: ${e}`, self.context);
                                }
                            });

                            HSLogger.debug(`Subview changed ${previousView.getName()} -> ${currentView.getName()}`, self.context);
                        } else {
                            HSLogger.warn(`Subview ${view} not found`, self.context);
                            return;
                        }
                    }
                },
                    {
                        characterData: false,
                        childList: false,
                        subtree: false,
                        attributes: true,
                        attributeOldValue: false,
                        attributeFilter: ['style'],
                        valueParser: (element, mutations) => {
                            for (const mutation of mutations) {
                                if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                                    const target = mutation.target as HTMLElement;
                                    const display = target.style.getPropertyValue('display');
                                    return {
                                        view: target.id,
                                        state: display
                                    }
                                }
                            }
                        }
                    });
            }
        });
        // Setup watchers and handling for when cube tab changes


        this.isInitialized = true;
    }

    subscribeGameStateChange<T extends GameView<VIEW_TYPE>>(viewKey: VIEW_KEY, callback: (previousView: T, currentView: T) => void): string | undefined {
        const id = HSUtils.uuidv4();

        this.#viewStates[viewKey]
            .viewChangeSubscribers
            .set(
                id,
                callback as (previousView: GameView<VIEW_TYPE>, currentView: GameView<VIEW_TYPE>) => void
            );

        return id;
    }

    unsubscribeGameStateChange(viewKey: VIEW_KEY, subscriptionId: string) {
        if (this.#viewStates[viewKey].viewChangeSubscribers.has(subscriptionId)) {
            this.#viewStates[viewKey].viewChangeSubscribers.delete(subscriptionId);
        } else {
            HSLogger.warn(`Subscription ID ${subscriptionId} not found for view key ${viewKey}`, this.context);
        }
    }

    async #resolveSubViewChanges(mainViewId: MAIN_VIEW) {
        const self = this;
        const viewProperties = HSGlobal.HSGameState.viewProperties.get(mainViewId);

        if (!viewProperties) {
            HSLogger.debug(`No view properties found for main view ID ${mainViewId}`, this.context);
            return;
        }

        const tabs = await HSElementHooker.HookElements(viewProperties.subViewsSelector);

        tabs.forEach(async (tab) => {
            const tabId = tab.id;
            const tabState = tab.style.getPropertyValue('display');

            if (tabState !== 'none') {
                let subViewInstance: GameView<VIEW_TYPE> | undefined = undefined;

                try {
                    const ViewClass = this.#viewClasses[viewProperties.viewClassName];

                    if (!ViewClass) {
                        throw new Error(`Class "${viewProperties.viewClassName}" not found in viewClasses for mainViewId ${mainViewId}`);
                    }

                    subViewInstance = new ViewClass(tabId);

                } catch (error) {
                    HSLogger.warn(`Failed to instantiate sub-view ${viewProperties.viewClassName} for tab ${tabId}: ${error}`, self.context);
                    return;
                }

                const viewKey = subViewInstance.getViewKey() as VIEW_KEY;

                if (subViewInstance && subViewInstance.getId() !== this.#UNKNOWN_VIEW) {
                    self.#viewStates[viewKey].previousView = self.#viewStates[viewKey].currentView;
                    self.#viewStates[viewKey].currentView = subViewInstance;

                    const previousView = (self.#viewStates as any)[viewKey].previousView;
                    const currentView = (self.#viewStates as any)[viewKey].currentView;

                    // Notify subscribers of the main view change
                    self.#viewStates[viewKey].viewChangeSubscribers.forEach((callback) => {
                        try {
                            callback(previousView, currentView);
                        } catch (e) {
                            HSLogger.error(`Error when trying to call VIEW change subscriber callback: ${e}`, self.context);
                        }
                    });
                } else {
                    HSLogger.warn(`Sub-view tab ${tabId} (for ${viewProperties.viewClassName}) resolved to UNKNOWN or failed to initialize.`, self.context);
                }
            }
        });
    }

    getCurrentUIView<T extends GameView<VIEW_TYPE>>(viewKey: VIEW_KEY): T {
        return this.#viewStates[viewKey].currentView as T;
    }

    /**
     * Get the previous sub-view (if any) for a given main view
     */
    getPreviousSubViewForMainView(mainView: MainView): GameView<VIEW_TYPE> | undefined {
        const mainViewId = mainView.getId();

        const subViewMap: Record<number, VIEW_KEY> = {
            [MAIN_VIEW.CUBES]: 'CUBE_VIEW',
            [MAIN_VIEW.SINGULARITY]: 'SINGULARITY_VIEW',
            [MAIN_VIEW.BUILDINGS]: 'BUILDING_VIEW',
            [MAIN_VIEW.RUNES]: 'RUNE_VIEW',
            [MAIN_VIEW.CHALLENGES]: 'CHALLENGE_VIEW',
            [MAIN_VIEW.ANTS]: 'ANT_VIEW',
            [MAIN_VIEW.SETTINGS]: 'SETTINGS_VIEW',
            [MAIN_VIEW.PSEUDOCOINS]: 'PSEUDOCOIN_VIEW',
        };

        const viewKey = subViewMap[mainViewId];
        return viewKey ? this.getCurrentUIView(viewKey) : undefined;
    }
}

export abstract class GameView<T extends VIEW_TYPE> {
    #name: string;
    #viewKey: string;

    constructor(name: string, viewKey: string) {
        this.#name = name;
        this.#viewKey = viewKey;
    }

    getName(): string {
        return this.#name;
    }

    getViewKey(): string {
        return this.#viewKey;
    }

    abstract getId(): T
    abstract getViewEnum(view: string): T

    /**
     * Navigate to this view by clicking its associated button
     */
    goto(): void {
        const id = this.getId();
        let buttonId = '';

        // Determine which button ID mapping to use based on view type
        if (id in MAIN_VIEW_BUTTON_IDS) {
            buttonId = MAIN_VIEW_BUTTON_IDS[id as MAIN_VIEW];
        } else if (id in BUILDING_VIEW_BUTTON_IDS) {
            buttonId = BUILDING_VIEW_BUTTON_IDS[id as BUILDING_VIEW];
        } else if (id in RUNE_VIEW_BUTTON_IDS) {
            buttonId = RUNE_VIEW_BUTTON_IDS[id as RUNE_VIEW];
        } else if (id in CHALLENGE_VIEW_BUTTON_IDS) {
            buttonId = CHALLENGE_VIEW_BUTTON_IDS[id as CHALLENGE_VIEW];
        } else if (id in ANT_VIEW_BUTTON_IDS) {
            buttonId = ANT_VIEW_BUTTON_IDS[id as ANT_VIEW];
        } else if (id in CUBE_VIEW_BUTTON_IDS) {
            buttonId = CUBE_VIEW_BUTTON_IDS[id as CUBE_VIEW];
        } else if (id in SETTINGS_VIEW_BUTTON_IDS) {
            buttonId = SETTINGS_VIEW_BUTTON_IDS[id as SETTINGS_VIEW];
        } else if (id in SINGULARITY_VIEW_BUTTON_IDS) {
            buttonId = SINGULARITY_VIEW_BUTTON_IDS[id as SINGULARITY_VIEW];
        } else if (id in PSEUDOCOIN_VIEW_BUTTON_IDS) {
            buttonId = PSEUDOCOIN_VIEW_BUTTON_IDS[id as PSEUDOCOIN_VIEW];
        }

        if (!buttonId) {
            HSLogger.warn(`No button ID mapping found for view: ${this.getName()}`);
            return;
        }

        const button = document.getElementById(buttonId);
        if (!button) {
            HSLogger.warn(`Button element not found for ID: ${buttonId} (view: ${this.getName()})`);
            return;
        }

        button.click();
    }
}

export class MainView extends GameView<MAIN_VIEW> {
    #id: MAIN_VIEW;

    constructor(name: string) {
        super(name, 'MAIN_VIEW');
        this.#id = this.getViewEnum(name);
    }

    getViewEnum(view: string): MAIN_VIEW {
        switch (view) {
            case 'buildings': return MAIN_VIEW.BUILDINGS;
            case 'upgrades': return MAIN_VIEW.UPGRADES;
            case 'statistics': return MAIN_VIEW.STATISTICS;
            case 'runes': return MAIN_VIEW.RUNES;
            case 'challenges': return MAIN_VIEW.CHALLENGES;
            case 'research': return MAIN_VIEW.RESEARCH;
            case 'ants': return MAIN_VIEW.ANTS;
            case 'cubes': return MAIN_VIEW.CUBES;
            case 'campaigns': return MAIN_VIEW.CAMPAIGNS;
            case 'traits': return MAIN_VIEW.TRAITS;
            case 'settings': return MAIN_VIEW.SETTINGS;
            case 'shop': return MAIN_VIEW.SHOP;
            case 'singularity': return MAIN_VIEW.SINGULARITY;
            case 'event': return MAIN_VIEW.EVENT;
            case 'pseudoCoins': return MAIN_VIEW.PSEUDOCOINS;
        }
        return MAIN_VIEW.UNKNOWN;
    }

    getId(): MAIN_VIEW {
        return this.#id;
    }
}

export class CubeView extends GameView<CUBE_VIEW> {
    #id: CUBE_VIEW

    constructor(name: string) {
        super(name, 'CUBE_VIEW');
        this.#id = this.getViewEnum(name);
    }

    getViewEnum(tab: string): CUBE_VIEW {
        switch (tab) {
            case 'cubeTab1': return CUBE_VIEW.CUBE_TRIBUTES;
            case 'cubeTab2': return CUBE_VIEW.TESSERACT_GIFTS;
            case 'cubeTab3': return CUBE_VIEW.HYPERCUBE_BENEDICTIONS;
            case 'cubeTab4': return CUBE_VIEW.PLATONIC_STATUES;
            case 'cubeTab5': return CUBE_VIEW.CUBE_UPGRADES;
            case 'cubeTab6': return CUBE_VIEW.PLATONIC_UPGRADES;
            case 'cubeTab7': return CUBE_VIEW.HEPTERACT_FORGE;
        }
        return CUBE_VIEW.UNKNOWN;
    }

    getId(): CUBE_VIEW {
        return this.#id;
    }
}

export class SingularityView extends GameView<SINGULARITY_VIEW> {
    #id: SINGULARITY_VIEW;

    constructor(name: string) {
        super(name, 'SINGULARITY_VIEW');
        this.#id = this.getViewEnum(name);
    }

    getViewEnum(tab: string): SINGULARITY_VIEW {
        switch (tab) {
            case 'singularitycontainer1': return SINGULARITY_VIEW.ELEVATOR;
            case 'singularityContainer2': return SINGULARITY_VIEW.SHOP;
            case 'singularityContainer3': return SINGULARITY_VIEW.PERKS;
            case 'singularityContainer4': return SINGULARITY_VIEW.OCTERACTS;
            case 'singularityContainer5': return SINGULARITY_VIEW.AMBROSIA;
        }
        return SINGULARITY_VIEW.UNKNOWN;
    }

    getId(): SINGULARITY_VIEW {
        return this.#id;
    }
}

export class BuildingView extends GameView<BUILDING_VIEW> {
    #id: BUILDING_VIEW;

    constructor(name: string) {
        super(name, 'BUILDING_VIEW');
        this.#id = this.getViewEnum(name);
    }

    getViewEnum(tab: string): BUILDING_VIEW {
        switch (tab) {
            case 'switchToCoinBuilding': return BUILDING_VIEW.COIN;
            case 'switchToDiamondBuilding': return BUILDING_VIEW.DIAMOND;
            case 'switchToMythosBuilding': return BUILDING_VIEW.MYTHOS;
            case 'switchToParticleBuilding': return BUILDING_VIEW.PARTICLE;
            case 'switchToTesseractBuilding': return BUILDING_VIEW.TESSERACT;
        }
        return BUILDING_VIEW.UNKNOWN;
    }

    getId(): BUILDING_VIEW {
        return this.#id;
    }
}

export class RuneView extends GameView<RUNE_VIEW> {
    #id: RUNE_VIEW;

    constructor(name: string) {
        super(name, 'RUNE_VIEW');
        this.#id = this.getViewEnum(name);
    }

    getViewEnum(tab: string): RUNE_VIEW {
        switch (tab) {
            case 'toggleRuneSubTab1': return RUNE_VIEW.RUNE_1;
            case 'toggleRuneSubTab2': return RUNE_VIEW.RUNE_2;
            case 'toggleRuneSubTab3': return RUNE_VIEW.RUNE_3;
            case 'toggleRuneSubTab4': return RUNE_VIEW.RUNE_4;
        }
        return RUNE_VIEW.UNKNOWN;
    }

    getId(): RUNE_VIEW {
        return this.#id;
    }
}

export class ChallengeView extends GameView<CHALLENGE_VIEW> {
    #id: CHALLENGE_VIEW;

    constructor(name: string) {
        super(name, 'CHALLENGE_VIEW');
        this.#id = this.getViewEnum(name);
    }

    getViewEnum(tab: string): CHALLENGE_VIEW {
        switch (tab) {
            case 'toggleChallengesSubTab1': return CHALLENGE_VIEW.CHALLENGE_1;
            case 'toggleChallengesSubTab2': return CHALLENGE_VIEW.CHALLENGE_2;
        }
        return CHALLENGE_VIEW.UNKNOWN;
    }

    getId(): CHALLENGE_VIEW {
        return this.#id;
    }
}

export class AntView extends GameView<ANT_VIEW> {
    #id: ANT_VIEW;

    constructor(name: string) {
        super(name, 'ANT_VIEW');
        this.#id = this.getViewEnum(name);
    }

    getViewEnum(tab: string): ANT_VIEW {
        switch (tab) {
            case 'toggleAntSubtab1': return ANT_VIEW.ANT_1;
            case 'toggleAntSubtab2': return ANT_VIEW.ANT_2;
            case 'toggleAntSubtab3': return ANT_VIEW.ANT_3;
        }
        return ANT_VIEW.UNKNOWN;
    }

    getId(): ANT_VIEW {
        return this.#id;
    }
}

export class SettingsView extends GameView<SETTINGS_VIEW> {
    #id: SETTINGS_VIEW;

    constructor(name: string) {
        super(name, 'SETTINGS_VIEW');
        this.#id = this.getViewEnum(name);
    }

    getViewEnum(tab: string): SETTINGS_VIEW {
        switch (tab) {
            case 'switchSettingSubTab1': return SETTINGS_VIEW.HEPTERACTS;
            case 'switchSettingSubTab2': return SETTINGS_VIEW.UI;
            case 'switchSettingSubTab3': return SETTINGS_VIEW.LOGGING;
            case 'switchSettingSubTab4': return SETTINGS_VIEW.INPUT;
            case 'switchSettingSubTab5': return SETTINGS_VIEW.AMBROSIA;
            case 'switchSettingSubTab6': return SETTINGS_VIEW.PATCH;
            case 'switchSettingSubTab7': return SETTINGS_VIEW.GAMEDATA;
            case 'switchSettingSubTab8': return SETTINGS_VIEW.SHOP;
            case 'switchSettingSubTab9': return SETTINGS_VIEW.DEBUGGING;
        }
        return SETTINGS_VIEW.UNKNOWN;
    }

    getId(): SETTINGS_VIEW {
        return this.#id;
    }
}

export class PseudoCoinView extends GameView<PSEUDOCOIN_VIEW> {
    #id: PSEUDOCOIN_VIEW;

    constructor(name: string) {
        super(name, 'PSEUDOCOIN_VIEW');
        this.#id = this.getViewEnum(name);
    }

    getViewEnum(tab: string): PSEUDOCOIN_VIEW {
        switch (tab) {
            case 'cartSubTab1': return PSEUDOCOIN_VIEW.CART_1;
            case 'cartSubTab2': return PSEUDOCOIN_VIEW.CART_2;
            case 'cartSubTab3': return PSEUDOCOIN_VIEW.CART_3;
            case 'cartSubTab4': return PSEUDOCOIN_VIEW.CART_4;
            case 'cartSubTab5': return PSEUDOCOIN_VIEW.CART_5;
            case 'cartSubTab6': return PSEUDOCOIN_VIEW.CART_6;
        }
        return PSEUDOCOIN_VIEW.UNKNOWN;
    }

    getId(): PSEUDOCOIN_VIEW {
        return this.#id;
    }
}