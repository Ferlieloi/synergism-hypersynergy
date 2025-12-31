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
    ""
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

export interface Challenge {
    challengeNumber: number;
    challengeCompletions: number;
    challengeWaitTime: number;
}