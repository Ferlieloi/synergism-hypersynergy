export const IF_JUMP_VALUE = 200;
export const LOADOUT_ACTION_VALUE = 202;

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
export type ModalInput = "challengeNum" | "completions" | "waitTime" | "maxTime";

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

    { label: "Corrup 0*",                       value: 400, inputs: [] as const },
    { label: "Corrup from phase (reapply)",     value: 401, inputs: [] as const },
    { label: "Corrup Ants",                     value: 402, inputs: [] as const },
    
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
    corruptions: {
        viscosity: 0,
        drought: 0,
        deflation: 0,
        extinction: 0,
        illiteracy: 0,
        recession: 0,
        dilation: 0,
        hyperchallenge: 0
    },
    strat: [
        {
            challengeNumber: 103,
            challengeCompletions: 0,
            challengeWaitTime: 0,
            challengeMaxTime: 0
        },
        {
            challengeNumber: 400,
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
    corruptionLoadouts?: CorruptionLoadoutDefinition[];
}

export interface AutosingStrategyPhase {
    phaseId?: string;
    startPhase: PhaseOption;
    endPhase: PhaseOption;
    corruptions: CorruptionLoadout;
    corruptionLoadoutName?: string | null;
    strat: Challenge[];
}

export interface CorruptionLoadoutDefinition {
    name: string;
    loadout: CorruptionLoadout;
}

export interface CorruptionLoadout {
    viscosity: number;
    drought: number;
    deflation: number;
    extinction: number;
    illiteracy: number;
    recession: number;
    dilation: number;
    hyperchallenge: number;
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
    loadoutName?: string;

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
