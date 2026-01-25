import { BuildingView, CubeView, GameView, MainView, PseudoCoinView, SettingsView, SingularityView } from "../../class/hs-core/hs-gamestate";

export type VIEW_TYPE = MAIN_VIEW | BUILDING_VIEW | RUNE_VIEW | CHALLENGE_VIEW | ANT_VIEW | CUBE_VIEW | SETTINGS_VIEW | SINGULARITY_VIEW | PSEUDOCOIN_VIEW;
export type VIEW_KEY = 'MAIN_VIEW' | 'BUILDING_VIEW' | 'RUNE_VIEW' | 'CHALLENGE_VIEW' | 'ANT_VIEW' | 'CUBE_VIEW' | 'SETTINGS_VIEW' | 'SINGULARITY_VIEW' | 'PSEUDOCOIN_VIEW';

export interface View {
    MAIN_VIEW: MainView;
    BUILDING_VIEW: BuildingView;
    RUNE_VIEW: any; // Placeholder for future implementation
    CHALLENGE_VIEW: any; // Placeholder for future implementation
    ANT_VIEW: any; // Placeholder for future implementation
    CUBE_VIEW: CubeView;
    SETTINGS_VIEW: SettingsView;
    SINGULARITY_VIEW: SingularityView;
    PSEUDOCOIN_VIEW: PseudoCoinView;
}

export enum MAIN_VIEW {
    UNKNOWN = -1,

    BUILDINGS = 1,
    UPGRADES = 2,
    STATISTICS = 3,
    RUNES = 4,
    CHALLENGES = 5,
    RESEARCH = 6,
    ANTS = 7,
    CUBES = 8,
    CAMPAIGNS = 9,
    TRAITS = 10,
    SETTINGS = 11,
    SHOP = 12,
    SINGULARITY = 13,
    EVENT = 14,
    PSEUDOCOINS = 15
}

export enum CUBE_VIEW {
    UNKNOWN = -1,

    CUBE_TRIBUTES = 1,
    TESSERACT_GIFTS = 2,
    HYPERCUBE_BENEDICTIONS = 3,
    PLATONIC_STATUES = 4,
    CUBE_UPGRADES = 5,
    PLATONIC_UPGRADES = 6,
    HEPTERACT_FORGE = 7,
}

export enum BUILDING_VIEW {
    UNKNOWN = -1,

    COIN = 1,
    DIAMOND = 2,
    MYTHOS = 3,
    PARTICLE = 4,
    TESSERACT = 5,
}

export enum RUNE_VIEW {
    UNKNOWN = -1,

    RUNE_1 = 1,
    RUNE_2 = 2,
    RUNE_3 = 3,
    RUNE_4 = 4,
}

export enum CHALLENGE_VIEW {
    UNKNOWN = -1,

    CHALLENGE_1 = 1,
    CHALLENGE_2 = 2,
}

export enum ANT_VIEW {
    UNKNOWN = -1,

    ANT_1 = 1,
    ANT_2 = 2,
    ANT_3 = 3,
}

export enum SETTINGS_VIEW {
    UNKNOWN = -1,

    HEPTERACTS = 1,
    UI = 2,
    LOGGING = 3,
    INPUT = 4,
    AMBROSIA = 5,
    PATCH = 6,
    GAMEDATA = 7,
    SHOP = 8,
    DEBUGGING = 9,
    AUTO_SING = 10,
    QOL_BUTTONS = 11,
    MISC = 12,
}

export enum PSEUDOCOIN_VIEW {
    UNKNOWN = -1,

    CART_1 = 1,
    CART_2 = 2,
    CART_3 = 3,
    CART_4 = 4,
    CART_5 = 5,
    CART_6 = 6,
}

export enum SINGULARITY_VIEW {
    UNKNOWN = -1,

    ELEVATOR = 1,
    SHOP = 2,
    PERKS = 3,
    OCTERACTS = 4,
    AMBROSIA = 5
}

export enum GAME_STATE_CHANGE {
    MAIN_VIEW = 1,
    BUILDING_VIEW = 2,
    RUNE_VIEW = 3,
    CHALLENGE_VIEW = 4,
    ANT_VIEW = 5,
    CUBE_VIEW = 6,
    SETTINGS_VIEW = 7,
    SINGULARITY_VIEW = 8,
    PSEUDOCOIN_VIEW = 9,
}

/**
 * Mapping of view enum values to their clickable button element IDs
 * This allows any view to navigate via the goto() method
 */
export const MAIN_VIEW_BUTTON_IDS: Record<MAIN_VIEW, string> = {
    [MAIN_VIEW.BUILDINGS]: 'buildingstab',
    [MAIN_VIEW.UPGRADES]: 'upgradestab',
    [MAIN_VIEW.STATISTICS]: 'achievementstab',
    [MAIN_VIEW.RUNES]: 'runestab',
    [MAIN_VIEW.CHALLENGES]: 'challengetab',
    [MAIN_VIEW.RESEARCH]: 'researchtab',
    [MAIN_VIEW.ANTS]: 'anttab',
    [MAIN_VIEW.CUBES]: 'cubetab',
    [MAIN_VIEW.CAMPAIGNS]: 'campaigntab',
    [MAIN_VIEW.TRAITS]: 'traitstab',
    [MAIN_VIEW.SETTINGS]: 'settingstab',
    [MAIN_VIEW.SHOP]: 'shoptab',
    [MAIN_VIEW.SINGULARITY]: 'singularitytab',
    [MAIN_VIEW.EVENT]: 'eventtab',
    [MAIN_VIEW.PSEUDOCOINS]: 'pseudoCoinstab',
    [MAIN_VIEW.UNKNOWN]: '',
};

export const BUILDING_VIEW_BUTTON_IDS: Record<BUILDING_VIEW, string> = {
    [BUILDING_VIEW.COIN]: 'switchToCoinBuilding',
    [BUILDING_VIEW.DIAMOND]: 'switchToDiamondBuilding',
    [BUILDING_VIEW.MYTHOS]: 'switchToMythosBuilding',
    [BUILDING_VIEW.PARTICLE]: 'switchToParticleBuilding',
    [BUILDING_VIEW.TESSERACT]: 'switchToTesseractBuilding',
    [BUILDING_VIEW.UNKNOWN]: '',
};

export const RUNE_VIEW_BUTTON_IDS: Record<RUNE_VIEW, string> = {
    [RUNE_VIEW.RUNE_1]: 'toggleRuneSubTab1',
    [RUNE_VIEW.RUNE_2]: 'toggleRuneSubTab2',
    [RUNE_VIEW.RUNE_3]: 'toggleRuneSubTab3',
    [RUNE_VIEW.RUNE_4]: 'toggleRuneSubTab4',
    [RUNE_VIEW.UNKNOWN]: '',
};

export const CHALLENGE_VIEW_BUTTON_IDS: Record<CHALLENGE_VIEW, string> = {
    [CHALLENGE_VIEW.CHALLENGE_1]: 'toggleChallengesSubTab1',
    [CHALLENGE_VIEW.CHALLENGE_2]: 'toggleChallengesSubTab2',
    [CHALLENGE_VIEW.UNKNOWN]: '',
};

export const ANT_VIEW_BUTTON_IDS: Record<ANT_VIEW, string> = {
    [ANT_VIEW.ANT_1]: 'toggleAntSubtab1',
    [ANT_VIEW.ANT_2]: 'toggleAntSubtab2',
    [ANT_VIEW.ANT_3]: 'toggleAntSubtab3',
    [ANT_VIEW.UNKNOWN]: '',
};

export const CUBE_VIEW_BUTTON_IDS: Record<CUBE_VIEW, string> = {
    [CUBE_VIEW.CUBE_TRIBUTES]: 'switchCubeSubTab1',
    [CUBE_VIEW.TESSERACT_GIFTS]: 'switchCubeSubTab2',
    [CUBE_VIEW.HYPERCUBE_BENEDICTIONS]: 'switchCubeSubTab3',
    [CUBE_VIEW.PLATONIC_STATUES]: 'switchCubeSubTab4',
    [CUBE_VIEW.CUBE_UPGRADES]: 'switchCubeSubTab5',
    [CUBE_VIEW.PLATONIC_UPGRADES]: 'switchCubeSubTab6',
    [CUBE_VIEW.HEPTERACT_FORGE]: 'switchCubeSubTab7',
    [CUBE_VIEW.UNKNOWN]: '',
};

export const SETTINGS_VIEW_BUTTON_IDS: Record<SETTINGS_VIEW, string> = {
    [SETTINGS_VIEW.HEPTERACTS]: 'switchSettingSubTab1',
    [SETTINGS_VIEW.UI]: 'switchSettingSubTab2',
    [SETTINGS_VIEW.LOGGING]: 'switchSettingSubTab3',
    [SETTINGS_VIEW.INPUT]: 'switchSettingSubTab4',
    [SETTINGS_VIEW.AMBROSIA]: 'switchSettingSubTab5',
    [SETTINGS_VIEW.PATCH]: 'switchSettingSubTab6',
    [SETTINGS_VIEW.GAMEDATA]: 'switchSettingSubTab7',
    [SETTINGS_VIEW.SHOP]: 'switchSettingSubTab8',
    [SETTINGS_VIEW.DEBUGGING]: 'switchSettingSubTab9',
    [SETTINGS_VIEW.AUTO_SING]: 'switchSettingSubTab1',
    [SETTINGS_VIEW.QOL_BUTTONS]: 'switchSettingSubTab1',
    [SETTINGS_VIEW.MISC]: 'switchSettingSubTab1',
    [SETTINGS_VIEW.UNKNOWN]: '',
};

export const SINGULARITY_VIEW_BUTTON_IDS: Record<SINGULARITY_VIEW, string> = {
    [SINGULARITY_VIEW.ELEVATOR]: 'toggleSingularitySubTab1',
    [SINGULARITY_VIEW.SHOP]: 'toggleSingularitySubTab2',
    [SINGULARITY_VIEW.PERKS]: 'toggleSingularitySubTab3',
    [SINGULARITY_VIEW.OCTERACTS]: 'toggleSingularitySubTab4',
    [SINGULARITY_VIEW.AMBROSIA]: 'toggleSingularitySubTab5',
    [SINGULARITY_VIEW.UNKNOWN]: '',
};

export const PSEUDOCOIN_VIEW_BUTTON_IDS: Record<PSEUDOCOIN_VIEW, string> = {
    [PSEUDOCOIN_VIEW.CART_1]: 'cartSubTab1',
    [PSEUDOCOIN_VIEW.CART_2]: 'cartSubTab2',
    [PSEUDOCOIN_VIEW.CART_3]: 'cartSubTab3',
    [PSEUDOCOIN_VIEW.CART_4]: 'cartSubTab4',
    [PSEUDOCOIN_VIEW.CART_5]: 'cartSubTab5',
    [PSEUDOCOIN_VIEW.CART_6]: 'cartSubTab6',
    [PSEUDOCOIN_VIEW.UNKNOWN]: '',
};

export interface HSViewProperties {
    subViewIds: string[];
    subViewsSelector: string | string[];
    viewClassName: string;
}

export interface HSViewState<V extends GameView<VIEW_TYPE>> {
    currentView: V;
    previousView: V;
    viewChangeSubscribers: Map<string, (previousView: V, currentView: V) => void>;
}

export interface HSViewStateRecord {
    [key: string]: HSViewState<GameView<VIEW_TYPE>>;
}