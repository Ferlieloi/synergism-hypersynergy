export const IF_JUMP_VALUE = 200;
// Sets the corruption level held by the step (Challenge.corruptionLevel)
export const SET_CORRUPTION_LEVEL_VALUE = 403;
// Sets the step's level minus the player's free levels: the lowest level that reaches it once they're added
export const SET_CORRUPTION_LEVEL_MINUS_FREE_VALUE = 404;
// The steps holding a level in Challenge.corruptionLevel
export const isCorruptionLevelStep = (challengeNumber: number): boolean =>
    challengeNumber === SET_CORRUPTION_LEVEL_VALUE || challengeNumber === SET_CORRUPTION_LEVEL_MINUS_FREE_VALUE;

export const ALLOWED = [
    "start",
    "prestige",
    "transcend",
    "reincarnate",
    "ant",
    "sacrifice",
    "ascension",
] as const;

export const phases = [
    "start",
    "prestige",
    "transcend",
    "reincarnate",
    "ant",
    "sacrifice",
    "ascension",
    "challenge10",
    "challenge11",
    "challenge12",
    "challenge13",
    "challenge14",
    "w5x10max",
    "alpha",
    "p2x1x10",
    "p3x1",
    "beta",
    "1e15-expo",
    "omega",
    "singularity",
    "end",
] as const;

export const AOAG_PHASE_ID = "aoag" as const;
export const AOAG_PHASE_NAME = "AOAG Unlocked Phase" as const;

// Standard input fields that can be enabled per special action.
// "waitBefore" and "comment" are always enabled and not listed here.
export type ModalInput = "challengeNum" | "completions" | "waitTime" | "maxTime" | "corruptionLevel";

export const SPECIAL_ACTIONS = [
    { label: "Exit Transcension challenge",     value: 101, inputs: [] as const },
    { label: "Exit Reincarnation challenge",    value: 102, inputs: [] as const },
    { label: "Exit Ascension challenge",        value: 103, inputs: [] as const },
    { label: "Ascend",                          value: 104, inputs: [] as const },
    
    { label: "Wait",                            value: 151, inputs: [] as const },
    { label: "Ant Sacrifice",                   value: 152, inputs: [] as const },
    { label: "Auto Challenge Toggle",           value: 153, inputs: [] as const },
    { label: "Auto Ant-Sac Toggle",             value: 154, inputs: [] as const },
    { label: "Auto Ascend Toggle",              value: 155, inputs: [] as const },

    { label: "If-jump",                         value: IF_JUMP_VALUE, inputs: [] as const },

    { label: "Max C11",                         value: 211, inputs: ["maxTime"] as const },
    { label: "Max C12",                         value: 212, inputs: ["maxTime"] as const },
    { label: "Max C13",                         value: 213, inputs: ["maxTime"] as const },
    { label: "Max C14",                         value: 214, inputs: ["maxTime"] as const },
    { label: "Store C15",                       value: 215, inputs: [] as const },

    { label: "Ambrosia pre-AOAG loadout",       value: 301, inputs: [] as const },
    { label: "Ambrosia post-AOAG Cube loadout", value: 302, inputs: [] as const },
    { label: "Ambrosia Quark loadout",          value: 303, inputs: [] as const },
    { label: "Ambrosia Obt loadout",            value: 304, inputs: [] as const },
    { label: "Ambrosia Off loadout",            value: 305, inputs: [] as const },
    { label: "Ambrosia Luck loadout",           value: 306, inputs: [] as const },

    // 400 ("Corrup 0*") became a "Set corruption level" step at level 0 (HSStrategyManager converts it)
    { label: "Corruption level from phase (reapply)", value: 401, inputs: [] as const },
    { label: "Set corruption level",            value: SET_CORRUPTION_LEVEL_VALUE, inputs: ["corruptionLevel"] as const },
    { label: "Set corruption level minus free levels", value: SET_CORRUPTION_LEVEL_MINUS_FREE_VALUE, inputs: ["corruptionLevel"] as const },
    // 402 ("Corrup Ants") was removed with the game's 4.4.0: HSStrategyManager removes its steps from old strategies

    { label: "C1 until no more completions within maxTime ms (after initially waiting waitTime ms)",  value: 601, inputs: ["maxTime", "waitTime"] as const },
    { label: "C2 until no more completions within maxTime ms (after initially waiting waitTime ms)",  value: 602, inputs: ["maxTime", "waitTime"] as const },
    { label: "C3 until no more completions within maxTime ms (after initially waiting waitTime ms)",  value: 603, inputs: ["maxTime", "waitTime"] as const },
    { label: "C4 until no more completions within maxTime ms (after initially waiting waitTime ms)",  value: 604, inputs: ["maxTime", "waitTime"] as const },
    { label: "C5 until no more completions within maxTime ms (after initially waiting waitTime ms)",  value: 605, inputs: ["maxTime", "waitTime"] as const },
    { label: "C6 until no more completions within maxTime ms (after initially waiting waitTime ms)",  value: 606, inputs: ["maxTime", "waitTime"] as const },
    { label: "C7 until no more completions within maxTime ms (after initially waiting waitTime ms)",  value: 607, inputs: ["maxTime", "waitTime"] as const },
    { label: "C8 until no more completions within maxTime ms (after initially waiting waitTime ms)",  value: 608, inputs: ["maxTime", "waitTime"] as const },
    { label: "C9 until no more completions within maxTime ms (after initially waiting waitTime ms)",  value: 609, inputs: ["maxTime", "waitTime"] as const },
    { label: "C10 until no more completions within maxTime ms (after initially waiting waitTime ms)", value: 610, inputs: ["maxTime", "waitTime"] as const },

    { label: "Forge Auto-Buy Toggle - Chronos Hept",        value: 701, inputs: [] as const },
    { label: "Forge Auto-Buy Toggle - Hyperreal Hept",      value: 702, inputs: [] as const },
    { label: "Forge Auto-Buy Toggle - Quarks Hept",         value: 703, inputs: [] as const },
    { label: "Forge Auto-Buy Toggle - Challenge Hept",      value: 704, inputs: [] as const },
    { label: "Forge Auto-Buy Toggle - Abyss Hept",          value: 705, inputs: [] as const },
    { label: "Forge Auto-Buy Toggle - Accelerator Hept",    value: 706, inputs: [] as const },
    { label: "Forge Auto-Buy Toggle - Boost Hept",          value: 707, inputs: [] as const },
    { label: "Forge Auto-Buy Toggle - Multiplier Hept",     value: 708, inputs: [] as const },
    { label: "Forge Auto-Buy Toggle - Orbs",                value: 709, inputs: [] as const },

    { label: "Click AOAG",          value: 901, inputs: [] as const },
    { label: "Restart Autosing",    value: 902, inputs: [] as const },
    { label: "Stop Autosing",       value: 903, inputs: [] as const },
] as const;

export const createDefaultAoagPhase = (): AutosingStrategyPhase => ({
    phaseId: AOAG_PHASE_ID,
    startPhase: "ascension",
    endPhase: "ascension",
    corruptionLevel: 0,
    strat: [
        {
            challengeNumber: 103,
            challengeCompletions: 0,
            challengeWaitTime: 0,
            challengeMaxTime: 0
        },
        {
            challengeNumber: SET_CORRUPTION_LEVEL_VALUE,
            corruptionLevel: 0,
            challengeCompletions: 0,
            challengeWaitTime: 0,
            challengeMaxTime: 0
        },
        {
            challengeNumber: 104,
            challengeCompletions: 0,
            challengeWaitTime: 0,
            challengeMaxTime: 0
        },
        {
            challengeNumber: 151,
            challengeCompletions: 0,
            challengeWaitTime: 0,
            challengeMaxTime: 0,
            challengeWaitBefore: 100
        },
        {
            challengeNumber: 152,
            challengeCompletions: 0,
            challengeWaitTime: 0,
            challengeMaxTime: 0
        },
        {
            challengeNumber: 151,
            challengeCompletions: 0,
            challengeWaitTime: 0,
            challengeMaxTime: 0,
            challengeWaitBefore: 1
        },
        {
            challengeNumber: 901,
            challengeCompletions: 0,
            challengeWaitTime: 0,
            challengeMaxTime: 0
        }
    ]
});

export type PhaseOption = (typeof phases)[number];

export interface HSAutosingStrategy {
    strategyName: string;
    strategy: AutosingStrategyPhase[];
    aoagPhase?: AutosingStrategyPhase;
}

export interface AutosingStrategyPhase {
    phaseId?: string;
    startPhase: PhaseOption;
    endPhase: PhaseOption;
    // The game's corruption level since its 4.4.0 (one level instead of 8 corruptions), set at the phase's start.
    // null: the phase leaves the level as it is
    corruptionLevel: number | null;
    strat: Challenge[];
}

export interface IfJumpParams {
    id: string;
    ifJumpMode?: "challenges" | "stored_c15";  // Mode for if-jump comparison
    ifJumpChallenge: number;   // 1–15 (used in challenges mode)
    ifJumpOperator: ">" | "<";
    ifJumpValue: number;       // Comparison value (used in challenges mode)
    ifJumpMultiplier?: number; // 10^x multiplier (used in stored_c15 mode)
    ifJumpIndex: number;
};

export interface Challenge {
    challengeNumber: number;
    challengeCompletions: number;
    challengeWaitTime: number;
    challengeMaxTime: number;
    challengeWaitBefore?: number;
    comment?: string;
    // "Set corruption level" step (SET_CORRUPTION_LEVEL_VALUE)
    corruptionLevel?: number;

    // Optional special-action params
    ifJump?: IfJumpParams;
};

export type IsJumpChallenge = Challenge & {
    ifJump: {
        id: string;
        ifJumpMode?: "challenges" | "stored_c15";
        ifJumpChallenge: number;   // 1–15
        ifJumpOperator: ">" | "<";
        ifJumpValue: number;
        ifJumpMultiplier?: number;
        ifJumpIndex: number;
    };
};
