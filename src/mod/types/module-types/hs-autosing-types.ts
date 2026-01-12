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
    { label: "Ambrosia Quark loadout", value: 112 },
    { label: "Ambrosia Obt/Off loadout", value: 113 },
    { label: "Ambrosia Ambrosia loadout", value: 107 },
    { label: "Ant Sacrifice", value: 108 },
    { label: "Load Ant Speed Corruptions", value: 109 },
    { label: "Cleanse corruptions", value: 110 },
    { label: "Wait", value: 111 },
    { label: "if-jump", value: IF_JUMP_VALUE },
    { label: "Set phase corruptions", value: 201 },
] as const;


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
    ifJumpChallenge: number;   // 1–15
    ifJumpOperator: ">" | "<";
    ifJumpValue: number;
    ifJumpIndex: number;
};

export interface Challenge {
    challengeNumber: number;
    challengeCompletions: number;
    challengeWaitTime: number;
    challengeMaxTime: number;
    challengeWaitAfter?: number;

    // Optional special-action params
    ifJump?: IfJumpParams;
};

export type IsJumpChallenge = Challenge & {
    ifJump: {
        id: string;
        ifJumpChallenge: number;   // 1–15
        ifJumpOperator: ">" | "<";
        ifJumpValue: number;
        ifJumpIndex: number;
    };
};