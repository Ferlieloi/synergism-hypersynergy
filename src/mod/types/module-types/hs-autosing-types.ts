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

    { label: "Wait", value: 151 },
    { label: "Ant Sacrifice", value: 152 },
    { label: "Auto Challenge Toggle", value: 153 },    

    { label: "If-jump", value: IF_JUMP_VALUE }, // 200

    { label: "Max C11", value: 211 },
    { label: "Max C12", value: 212 },
    { label: "Max C13", value: 213 },
    { label: "Max C14", value: 214 },
    { label: "Store C15", value: 215 },

    { label: "Ambrosia pre-AOAG loadout", value: 301 },
    { label: "Ambrosia post-AOAG Cube loadout", value: 302 },
    { label: "Ambrosia Quark loadout", value: 303 },
    { label: "Ambrosia Obt loadout", value: 304 },
    { label: "Ambrosia Off loadout", value: 305 },
    { label: "Ambrosia Luck loadout", value: 306 },

    { label: "Corrup 0*", value: 400 },
    { label: "Corrup challenge14->w5x10max", value: 401 },
    { label: "Corrup w5x10max->p2x1x10", value: 402 },
    { label: "Corrup p2x1x10->p3x1", value: 403 },
    { label: "Corrup p3x1->beta", value: 404 },
    { label: "Corrup beta->1e15-expo", value: 405 },
    { label: "Corrup 1e15-expo->omega", value: 406 },
    { label: "Corrup omega->sing", value: 407 },
    { label: "Corrup sing->end", value: 408 },
    { label: "Corrup Ants", value: 409 },
    { label: "Corrup from phase (restore)", value: 410 },

    { label: "Click AOAG", value: 901 },
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