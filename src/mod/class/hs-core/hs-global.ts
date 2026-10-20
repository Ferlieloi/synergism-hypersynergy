import { HSViewProperties, MAIN_VIEW } from "../../types/module-types/hs-gamestate-types";
import { IHSGlobal } from "../../types/module-types/hs-global-types";
import { ELogLevel } from "../../types/module-types/hs-logger-types";

// Build-time injected by esbuild via `define`.
declare const HS_BUILD_VERSION: string;

/**
 * Class: HSGlobal
 * IsExplicitHSModule: No
 * Description:
 *     Static class containing global configuration and constants for the Hypersynergism mod.
 * Author: Swiffy
 */
export const HSGlobal: IHSGlobal = class {

    constructor() {
        throw new Error("Cannot instantiate a static class");
    }

    static get exposedPlayer() {
        return (window as any)[(window as any).symp] || null;
    }

    // --- DEBUG ---
    static Debug = {
        debugMode: false,
        performanceDebugMode: false,
        gameDataDebugMode: false,
        calculationCacheDebugMode: false,
    }

    // --- Release check configuration ---
    static Release = {
        githubOwner: 'Ferlieloi',    // The Live repo: version check fallback and the Mod Github link
        checkIntervalMs: 1800000     // 30min
    }

    // --- GENERAL ---
    static General = {
        // Version number bumping should be done in package.json.version
        currentModVersion: (typeof HS_BUILD_VERSION !== 'undefined') ? HS_BUILD_VERSION : '0.0.0',
        isModFullyLoaded: false,

        get modGithubUrl() { return `https://github.com/${HSGlobal.Release.githubOwner}/synergism-hypersynergy/`; },
        get modDiscordThreadUrl() { return 'https://discord.com/channels/677271830838640680/1456904896099127367'; },
        heaterUrl: 'https://docs.google.com/spreadsheets/d/105yoI41lk8UJ2PThTkV0tWKNli5R0K1WuaSphKl13R0/'
    };

    // --- COMMON ---
    static Common = {
        pseudoAPIurl: 'https://synergism.cc/stripe/upgrades',
        meAPIurl: 'https://synergism.cc/api/v1/users/me',
        // Sent with every request to synergism.cc, so the game's backend can tell the mod's traffic and its version apart
        // (a custom header: Chromium drops a User-Agent set through fetch)
        get modRequestHeaders(): Record<string, string> { return { 'X-HyperSynergism-Version': HSGlobal.General.currentModVersion }; },

        experimentalGDS: true
    }

    // --- HSPrototypes ---
    static HSPrototypes = {
        // Default CSS transition timing 100ms
        defaultTransitionTiming: 100
    }

    // --- HSElementHooker ---
    // watchElement's MutationObserver can fire max 20 times / second
    static HSElementHooker = {
        // HookElement / HookElements
        elementHookUpdateMS: 10,
        elementsHookUpdateMS: 100,
        enableHelementHookTimeout: true,
        elementHookTimeout: 500,

        // Watchers
        watcherThrottlingMS: 50,

        defaultWatcherOptions: {
            greedy: false,
            overrideThrottle: false,
            characterData: true,
            childList: true,
            subtree: true,
            attributes: false,
            attributeOldValue: false,
            attributeFilter: []
        }
    }

    // --- HSLogger ---
    static HSLogger = {
        logLevel: ELogLevel.NONE,
        logSize: 5000,

        // Log tab colors of the contexts that aren't modules (modules have their moduleColor, in index.ts).
        // A module's name gives that module's color, anything else is a CSS color.
        contextColors: {
            // Autosing
            HSAutosingModal: 'HSAutosing',
            HSAutosingSettingsFixer: 'HSAutosing',
            HSAutosingCorruption: 'HSAutosing',
            HSAutosingStrategyModal: 'HSAutosing',
            // Ambrosia
            HSAmbrosiaHelper: 'HSAmbrosia',
            // Settings
            HSSetting: 'HSSettings',
            HSSettingsUI: 'HSSettings',
            // QoL quickbars
            HSQuickbarManager: 'HSQOLButtons',
            HSQOLAutomationQuickbar: 'HSQOLButtons',
            HSCorruption: 'HSQOLButtons',
            HSHeaderModules: 'HSQOLButtons',
            HSLoadoutIconStore: 'HSHeaderLoadoutIcons',
            // UI
            HSUIC: 'HSUI',
            Notify: 'HSUI',
            // Heater
            HSHeater: 'darkorange',
            HSHeaterOptimizer: 'darkorange',
            HSHeaterUIResult: 'darkorange',
            HSHeaterInputModalController: 'darkorange',
            // Game dialogs
            HSGameDialogs: 'hotpink',
            HSHiddenDialogs: 'hotpink',
            HSDialogIdentity: 'hotpink',
            // Core and the rest
            HSMain: 'plum',
            HSLogger: 'plum',
            HSModuleManager: 'plum',
            HSElementHooker: 'plum',
            HSUtils: 'plum',
            Once: 'plum',
            HSBackup: 'plum',
            HSGithub: 'plum',
            HSBookmarkletNotice: 'plum',
            HSDevTools: 'plum',
        }
    }

    // --- HSStorage ---
    static HSStorage = {
        storagePrefix: 'hs-',
    }

    // --- HSUI ---
    static HSUI = {
        injectedStylesDomId: 'hs-injected-styles',
        notifyClassName: 'hs-notification',
        notifyTextClassName: 'hs-notification-text',
    }

    // --- HSUIC ---
    static HSUIC = {
        defaultImageWidth: 32,
        defaultImageHeight: 32,
    }

    // --- HSSettings ---
    static HSSettings = {
        storageKey: 'settings',
        strategiesKey: 'strategies',
        serializationBlackList: [
            'settingDescription',
            'settingHelpText',
            'settingValueMultiplier',
            'defaultValue',
            'settingControl',
            'settingAction',
            'usesGameData',
            'hidden',
            'platforms',
        ],
        gameDataRequiredTooltip: 'This feature requires Game Data Sniffing to be enabled.',

        // Settings exempt from the "GDS must already be enabled" check. Features in
        // this list may enable GDS themselves when switched on.
        gameDataCheckBlacklist: [
            'useGameData',
            // These settings below auto-enable GDS when toggled on,
            // so they should be allowed to toggle even when GDS is off
            'ambrosiaMinibars'
        ]
    }

    static HSMouse = {
        autoClickIgnoredElements: [
            // Hepteract buttons
            '#chronosHepteractCraft',
            '#chronosHepteractCraftMax',
            '#chronosHepteractCap',
            '#chronosHepteractAuto',

            '#hyperrealismHepteractCraft',
            '#hyperrealismHepteractCraftMax',
            '#hyperrealismHepteractCap',
            '#hyperrealismHepteractAuto',

            '#quarkHepteractCraft',
            '#quarkHepteractCraftMax',
            '#quarkHepteractCap',
            '#quarkHepteractAuto',

            '#challengeHepteractCraft',
            '#challengeHepteractCraftMax',
            '#challengeHepteractCap',
            '#challengeHepteractAuto',

            '#abyssHepteractCraft',
            '#abyssHepteractCraftMax',
            '#abyssHepteractCap',
            '#abyssHepteractAuto',

            '#acceleratorHepteractCraft',
            '#acceleratorHepteractCraftMax',
            '#acceleratorHepteractCap',
            '#acceleratorHepteractAuto',

            '#acceleratorBoostHepteractCraft',
            '#acceleratorBoostHepteractCraftMax',
            '#acceleratorBoostHepteractCap',
            '#acceleratorBoostHepteractAuto',

            '#multiplierHepteractCraft',
            '#multiplierHepteractCraftMax',
            '#multiplierHepteractCap',
            '#multiplierHepteractAuto',

            // Orb and powder buttons
            '#hepteractToQuarkTrade',
            '#hepteractToQuarkTradeMax',
            '#hepteractToQuarkTradeAuto',
            '#powderDayWarp',
            '#warpAuto',

            // Autocraft percentage button
            '#hepteractAutoPercentageButton',

            // Auto rune button
            '#toggleautosacrifice',

            // Auto fragment buy toggle button
            '#toggleautoBuyFragments',

            // Auto buy blessings toggle button
            '#toggle36',

            // Auto buy spirits toggle
            '#toggle37',

            // Auto research buy amount button
            '#toggleresearchbuy',

            // Auto research toggle button
            '#toggleautoresearch',

            // Auto research mode button
            '#toggleautoresearchmode',

            // Research hover buy button
            '#toggle38',

            // Ant buy amount button
            '#toggleAntMax',


            // Auto challenge toggle button
            '#toggleAutoChallengeStart',

            // Challenge retry button
            '#retryChallenge',

            // Auto challenge ignore toggle button
            '#toggleAutoChallengeIgnore',

            // Hepteract alert toggle button
            '#toggle35',

            // Alert OK and cancel buttons
            '#ok_prompt',
            '#cancel_prompt',
        ]
    }

    // HSHiddenDialogs
    static HSHiddenDialogs = {
        storageKey: 'hidden-dialogs',
    }

    // HSAmbrosia
    static HSAmbrosia = {
        // Constants ripped from the game code
        TIME_PER_AMBROSIA: 45,
        TIME_PER_RED_AMBROSIA: 1000,
        digitReduction: 4,

        blueBarId: 'hs-blue-progress-bar',
        blueBarProgressId: 'hs-blue-progress',
        blueBarProgressTextId: 'hs-blue-progress-text',
        redBarId: 'hs-red-progress-bar',
        redBarProgressId: 'hs-red-progress',
        redBarProgressTextId: 'hs-red-progress-text',
        purpleBarId: 'hs-purple-progress-bar',
        purpleBarProgressId: 'hs-purple-progress',
        barWrapperId: 'hs-minibars-wrapper',
    }

    // HSGameState
    static HSGameState = {
        viewProperties: new Map<MAIN_VIEW, HSViewProperties>([
            [MAIN_VIEW.BUILDINGS, {
                subViewIds: [
                    'switchToCoinBuilding',
                    'switchToDiamondBuilding',
                    'switchToMythosBuilding',
                    'switchToParticleBuilding',
                    'switchToTesseractBuilding'
                ],
                subViewsSelector: ['#switchToCoinBuilding', '#switchToDiamondBuilding', '#switchToMythosBuilding', '#switchToParticleBuilding', '#switchToTesseractBuilding'],
                viewClassName: 'BuildingView'
            }],
            [MAIN_VIEW.ACHIEVEMENTS, {
                subViewIds: [
                    'toggleAchievementSubTab1',
                    'toggleAchievementSubTab2'
                ],
                subViewsSelector: ['#toggleAchievementSubTab1', '#toggleAchievementSubTab2'],
                viewClassName: 'AchievementView'
            }],
            [MAIN_VIEW.RUNES, {
                subViewIds: [
                    'toggleRuneSubTab1',
                    'toggleRuneSubTab2',
                    'toggleRuneSubTab3'
                ],
                subViewsSelector: ['#toggleRuneSubTab1', '#toggleRuneSubTab2', '#toggleRuneSubTab3'],
                viewClassName: 'RuneView'
            }],
            [MAIN_VIEW.CHALLENGES, {
                subViewIds: [
                    'toggleChallengesSubTab1',
                    'toggleChallengesSubTab2'
                ],
                subViewsSelector: ['#toggleChallengesSubTab1', '#toggleChallengesSubTab2'],
                viewClassName: 'ChallengeView'
            }],
            [MAIN_VIEW.ANTS, {
                subViewIds: [
                    'toggleAntSubtab1',
                    'toggleAntSubtab2',
                    'toggleAntSubtab3'
                ],
                subViewsSelector: ['#toggleAntSubtab1', '#toggleAntSubtab2', '#toggleAntSubtab3'],
                viewClassName: 'AntView'
            }],
            [MAIN_VIEW.CUBES, {
                subViewIds: [
                    'switchCubeSubTab1',
                    'switchCubeSubTab2',
                    'switchCubeSubTab3',
                    'switchCubeSubTab4',
                    'switchCubeSubTab5',
                    'switchCubeSubTab6',
                    'switchCubeSubTab7'
                ],
                subViewsSelector: ['#switchCubeSubTab1', '#switchCubeSubTab2', '#switchCubeSubTab3', '#switchCubeSubTab4', '#switchCubeSubTab5', '#switchCubeSubTab6', '#switchCubeSubTab7'],
                viewClassName: 'CubeView'
            }],
            [MAIN_VIEW.TRAITS, {
                subViewIds: [
                    'corrCampaignsBtn',
                    'corrStatsBtn',
                    'corrLoadoutsBtn'
                ],
                subViewsSelector: ['#corrCampaignsBtn', '#corrStatsBtn', '#corrLoadoutsBtn'],
                viewClassName: 'TraitsView'
            }],
            [MAIN_VIEW.SINGULARITY, {
                subViewIds: [
                    'toggleSingularitySubTab1',
                    'toggleSingularitySubTab2',
                    'toggleSingularitySubTab3',
                    'toggleSingularitySubTab4',
                    'toggleSingularitySubTab5',
                    'toggleSingularitySubTab6'
                ],
                subViewsSelector: ['#toggleSingularitySubTab1', '#toggleSingularitySubTab2', '#toggleSingularitySubTab3', '#toggleSingularitySubTab4', '#toggleSingularitySubTab5', '#toggleSingularitySubTab6'],
                viewClassName: 'SingularityView'
            }],
            [MAIN_VIEW.SETTINGS, {
                subViewIds: [
                    'switchSettingSubTab1',
                    'switchSettingSubTab2',
                    'switchSettingSubTab3',
                    'switchSettingSubTab4',
                    'switchSettingSubTab5',
                    'switchSettingSubTab6',
                    'switchSettingSubTab7',
                    'switchSettingSubTab8',
                    'switchSettingSubTab9'
                ],
                subViewsSelector: ['#switchSettingSubTab1', '#switchSettingSubTab2', '#switchSettingSubTab3', '#switchSettingSubTab4', '#switchSettingSubTab5', '#switchSettingSubTab6', '#switchSettingSubTab7', '#switchSettingSubTab8', '#switchSettingSubTab9'],
                viewClassName: 'SettingsView'
            }],
            [MAIN_VIEW.PSEUDOCOINS, {
                subViewIds: [
                    'cartSubTab1',
                    'cartSubTab2',
                    'cartSubTab3',
                    'cartSubTab4',
                    'cartSubTab5'
                ],
                subViewsSelector: ['#cartSubTab1', '#cartSubTab2', '#cartSubTab3', '#cartSubTab4', '#cartSubTab5'],
                viewClassName: 'PseudoCoinView'
            }]
        ])
    }

    // HSGameData
    static HSGameData = {
        consumablesPollInterval: 1000, // a read of the game's Happy Hour Bells, no request
        gdsSpeedMs: 66,
        gdsCSSId: 'hs-game-data-turbo-css'
    }
}
