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
    { label: "Ambrosia Early Cube loadout", value: 105 },
    { label: "Ambrosia Late Cube loadout", value: 106 },
    { label: "Ambrosia Quark loadout", value: 107 },
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
    hyperchallenged: number;
}

export interface Challenge {
    challengeNumber: number;
    challengeCompletions?: number;
    challengeMaxTime?: number;
    challengeWaitTime: number;
}