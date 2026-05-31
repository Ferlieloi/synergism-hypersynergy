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
        githubOwner: 'Ferlieloi',    // Can be removed if you prefer
        isLatestVersion: true,
        checkIntervalMs: 1800000     // 30min
    }

    // --- GENERAL ---
    static General = {
        // Version number bumping should be done in package.json.version
        currentModVersion: (typeof HS_BUILD_VERSION !== 'undefined') ? HS_BUILD_VERSION : '0.0.0',
        isModFullyLoaded: false,
        isDev: ((window as any).__HS_IS_DEV ? (window as any).__HS_IS_DEV : false),

        // Wiki needs to be cloned !
        get modGithubUrl() { return `https://github.com/${HSGlobal.Release.githubOwner}/synergism-hypersynergy/`; },
        get modWikiUrl() { return `https://github.com/${HSGlobal.Release.githubOwner}/synergism-hypersynergy/wiki/`; },
        get modWikiFeaturesUrl() { return `https://github.com/${HSGlobal.Release.githubOwner}/synergism-hypersynergy/wiki/Mod-Features`; },
        get modDiscordThreadUrl() { return 'https://discord.com/channels/677271830838640680/1456904896099127367'; },
        heaterUrl: 'https://docs.google.com/spreadsheets/d/105yoI41lk8UJ2PThTkV0tWKNli5R0K1WuaSphKl13R0/'
    };

    // --- COMMON ---
    static Common = {
        eventAPIUrl: 'wss://synergism.cc/consumables/connect',
        pseudoAPIurl: 'https://synergism.cc/stripe/upgrades',
        meAPIurl: 'https://synergism.cc/api/v1/users/me',

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
        logLevel: ELogLevel.ALL,
        logSize: 5000
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
            'patchConfig',
            'usesGameData',
        ],
        gameDataRequiredTooltip: 'This feature requires Game Data Sniffing to be enabled.',

        // When game data is disabled, we will auto-disable all features that use it
        // This blacklist is to ensure that auto-disable ignores these features even if they use game data
        gameDataCheckBlacklist: [
            'useGameData',
            'stopSniffOnError',
            // These settings below auto-enable GDS when toggled on,
            // so they should be allowed to toggle even when GDS is off
            'ambrosiaIdleSwap',
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

    // HSAmbrosia
    static HSAmbrosia = {
        storageKey: 'ambrosia-loadouts',
        quickBarId: 'hs-ambrosia-slots-wrapper',
        quickBarLoadoutIdPrefix: 'hs-ambrosia-quickbar',

        idleSwapQuickIconUrl: './Pictures/Simplified/Blueberries.png',
        idleSwapIndicatorId: 'hs-ambrosia-loadout-idle-swap-indicator',
        idleSwapMaxBlueThreshold: 97,
        idleSwapMinBlueThreshold: 3,
        idleSwapMaxRedThreshold: 99,
        idleSwapMinRedThreshold: 1,

        // Constants ripped from the game code
        TIME_PER_AMBROSIA: 45,
        TIME_PER_RED_AMBROSIA: 100000,
        digitReduction: 4,

        blueBarId: 'hs-blue-progress-bar',
        blueBarProgressId: 'hs-blue-progress',
        blueBarProgressTextId: 'hs-blue-progress-text',
        redBarId: 'hs-red-progress-bar',
        redBarProgressId: 'hs-red-progress',
        redBarProgressTextId: 'hs-red-progress-text',
        barWrapperId: 'hs-minibars-wrapper',
    }

    // HSCorruptionQuickbar
    static HSCorruptionQuickbar = {
        storageKey: 'corruption-loadouts',
        quickBarId: 'hs-corruption-slots-wrapper',
        quickBarLoadoutIdPrefix: 'hs-corruption-quickbar',
    }

    // HSQOLAutomationQuickbar
    static HSQOLAutomationQuickbar = {
        quickBarId: 'hs-automation-slots-wrapper',
        quickBarLoadoutIdPrefix: 'hs-automation-quickbar',
    }

    // HSQOLEventsQuickbar
    static HSQOLEventsQuickbar = {
        quickBarId: 'hs-events-slots-wrapper',
        quickBarLoadoutIdPrefix: 'hs-events-quickbar',
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
                    'toggleRuneSubTab3',
                    'toggleRuneSubTab4'
                ],
                subViewsSelector: ['#toggleRuneSubTab1', '#toggleRuneSubTab2', '#toggleRuneSubTab3', '#toggleRuneSubTab4'],
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
            [MAIN_VIEW.SINGULARITY, {
                subViewIds: [
                    'toggleSingularitySubTab1',
                    'toggleSingularitySubTab2',
                    'toggleSingularitySubTab3',
                    'toggleSingularitySubTab4',
                    'toggleSingularitySubTab5'
                ],
                subViewsSelector: ['#toggleSingularitySubTab1', '#toggleSingularitySubTab2', '#toggleSingularitySubTab3', '#toggleSingularitySubTab4', '#toggleSingularitySubTab5'],
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
                    'switchSettingSubTab9',
                    'switchSettingSubTab10'
                ],
                subViewsSelector: ['#switchSettingSubTab1', '#switchSettingSubTab2', '#switchSettingSubTab3', '#switchSettingSubTab4', '#switchSettingSubTab5', '#switchSettingSubTab6', '#switchSettingSubTab7', '#switchSettingSubTab8', '#switchSettingSubTab9', '#switchSettingSubTab10'],
                viewClassName: 'SettingsView'
            }],
            [MAIN_VIEW.PSEUDOCOINS, {
                subViewIds: [
                    'cartSubTab1',
                    'cartSubTab2',
                    'cartSubTab3',
                    'cartSubTab4',
                    'cartSubTab5',
                    'cartSubTab6'
                ],
                subViewsSelector: ['#cartSubTab1', '#cartSubTab2', '#cartSubTab3', '#cartSubTab4', '#cartSubTab5', '#cartSubTab6'],
                viewClassName: 'PseudoCoinView'
            }]
        ])
    }

    // HSGameData
    static HSGameData = {
        fetchedDataRefreshInterval: 60000,
        campaignTokenRefreshInterval: 60000,
        globalEventRefreshInterval: 1000 * 60 * 10, // 10 minutes
        gdsSpeedMs: 66,
        gdsCSSId: 'hs-game-data-turbo-css'
    }
}
