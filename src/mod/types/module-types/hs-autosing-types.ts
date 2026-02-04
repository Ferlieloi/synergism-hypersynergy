export const IF_JUMP_VALUE = 200;

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
    { label: "Cleanse corruptions", value: 110 },
    { label: "Wait", value: 111 },
    { label: "Auto Challenge Toggle", value: 115 },
    { label: "Store C15", value: 116 },
    { label: "Max C11", value: 117 },
    { label: "Max C12", value: 118 },
    { label: "Max C13", value: 119 },
    { label: "Max C14", value: 120 },
    { label: "If-jump", value: IF_JUMP_VALUE },
    { label: "Set phase corruptions", value: 201 },
    { label: "Set corruptions 1", value: 501 },
    { label: "Set corruptions 2", value: 502 },
    { label: "Set corruptions 3", value: 503 },
    { label: "Set corruptions 4", value: 504 },
    { label: "Set corruptions 5", value: 505 },
    { label: "Set corruptions 6", value: 506 },
    { label: "Set corruptions 7", value: 507 },
    { label: "Set corruptions 8", value: 508 },
    { label: "Set corruptions 9", value: 509 },
    { label: "Restart Autosing", value: 999 },
] as const;

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
}

export interface AutosingStrategyPhase {
    startPhase: PhaseOption;
    endPhase: PhaseOption;
    corruptions: CorruptionLoadout;
    strat: Challenge[];
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