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

export const SPECIAL_ACTIONS = [
    { label: "Exit Transcension challenge", value: 101 },
    { label: "Exit Reincarnation challenge", value: 102 },
    { label: "Exit Ascension challenge", value: 103 },
    { label: "Ascend", value: 104 },
    { label: "Ambrosia pre-AOAG loadout", value: 105 },
    { label: "Ambrosia post-AOAG Cube loadout", value: 106 },
    { label: "Ambrosia Quark loadout", value: 107 },
    { label: "Ambrosia Obt loadout", value: 112 },
    { label: "Ambrosia Off loadout", value: 113 },
    { label: "Ambrosia Ambrosia loadout", value: 114 },
    { label: "Ant Sacrifice", value: 108 },
    { label: "Load Ant Speed Corruptions", value: 109 },
    { label: "Load Zero corruptions", value: 110 },
    { label: "Wait", value: 111 },
    { label: "Auto Challenge Toggle", value: 115 },
    { label: "Store C15", value: 116 },
    { label: "Max C11", value: 117 },
    { label: "Max C12", value: 118 },
    { label: "Max C13", value: 119 },
    { label: "Max C14", value: 120 },
    { label: "Click AOAG", value: 121 },
    { label: "If-jump", value: IF_JUMP_VALUE },
    { label: "C1 until no more completions within maxTime ms (after initially waiting waitTime ms)", value: 301 },
    { label: "C2 until no more completions within maxTime ms (after initially waiting waitTime ms)", value: 302 },
    { label: "C3 until no more completions within maxTime ms (after initially waiting waitTime ms)", value: 303 },
    { label: "C4 until no more completions within maxTime ms (after initially waiting waitTime ms)", value: 304 },
    { label: "C5 until no more completions within maxTime ms (after initially waiting waitTime ms)", value: 305 },
    { label: "C6 until no more completions within maxTime ms (after initially waiting waitTime ms)", value: 306 },
    { label: "C7 until no more completions within maxTime ms (after initially waiting waitTime ms)", value: 307 },
    { label: "C8 until no more completions within maxTime ms (after initially waiting waitTime ms)", value: 308 },
    { label: "C9 until no more completions within maxTime ms (after initially waiting waitTime ms)", value: 309 },
    { label: "C10 until no more completions within maxTime ms (after initially waiting waitTime ms)", value: 310 },
    { label: "Load phase corruptions", value: 201 },
    { label: "Restart Autosing", value: 999 },
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
            challengeNumber: 110,
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
            challengeNumber: 111,
            challengeCompletions: 0,
            challengeWaitTime: 0,
            challengeMaxTime: 0,
            challengeWaitBefore: 100
        },
        {
            challengeNumber: 108,
            challengeCompletions: 0,
            challengeWaitTime: 0,
            challengeMaxTime: 0
        },
        {
            challengeNumber: 111,
            challengeCompletions: 0,
            challengeWaitTime: 0,
            challengeMaxTime: 0,
            challengeWaitBefore: 1
        },
        {
            challengeNumber: 121,
            challengeCompletions: 0,
            challengeWaitTime: 0,
            challengeMaxTime: 0
        }
    ]
});

export type GetFromDOMOptions<T> = {
    regex?: RegExp;
    parser?: (raw: string) => T;
    timeoutMs?: number;
    predicate?: (text: string) => boolean;
};

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