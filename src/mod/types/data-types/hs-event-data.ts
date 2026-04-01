/** Types of buffs that can be applied by events. */
export enum EventBuffType {
    Quark = 0,
    GoldenQuark = 1,
    Cubes = 2,
    PowderConversion = 3,
    AscensionSpeed = 4,
    GlobalSpeed = 5,
    AscensionScore = 6,
    AntSacrifice = 7,
    Offering = 8,
    Obtainium = 9,
    Octeract = 10,
    BlueberryTime = 11,
    AmbrosiaLuck = 12,
    OneMind = 13
}

/** Represents a single game event following the info-all > active[] format from the WebSocket. */
export interface GameEvent {
    name: string;
    internalName: string;
    endsAt: number;
}

/**
 * Internal identifiers for tracked game events.
 * Notes: The LOTUS_OF_REJUVENATION isn't technically part of the vanilla "event" system (it's not in info-all);
 */
export enum GameEventID {
    HAPPY_HOUR_BELL = "HAPPY_HOUR_BELL",
    LOTUS_OF_REJUVENATION = "LOTUS_OF_REJUVENATION"
}

/** All possible response types for game event WebSocket messages. */
export enum GameEventResponseType {
    INFO_ALL = "info-all", // All infos
    JOIN = "join",
    WARN = "warn",
    ERROR = "error",
    CONSUMED = "consumed", // Happy Hour only (start)
    CONSUMABLE_ENDED = "consumable-ended", // Happy Hour only (end)
    LOTUS = "lotus", // when bought
    APPLIED_LOTUS = "applied-lotus", 
    LOTUS_ACTIVE = "lotus-active",
    LOTUS_ENDED = "lotus-ended",
    TIPS = "tips", // when received
    APPLIED_TIP = "applied-tip",
    TIP_BACKLOG = "tip-backlog",
    TIME_SKIP = "time-skip",
    THANKS = "thanks"
}

/** Represents an item in the player's event-related inventory (e.g., lotus). */
export interface InventoryItem {
    type: string; // The game only uses this for 'lotus' (for now..?)
    amount: number;
    used: number;
}

/** WebSocket response for 'info-all', listing all active events, tips, and inventory. */
export interface InfoAllEventResponse {
    type: GameEventResponseType.INFO_ALL;
    active: GameEvent[];
    tips: number;
    inventory: InventoryItem[]; // The game only uses this for 'lotus' (for now..?)
}

/** WebSocket response for 'join' event (connection established). */
export interface JoinEventResponse {
    type: GameEventResponseType.JOIN;
}

/** WebSocket response for warnings. */
export interface WarnEventResponse {
    type: GameEventResponseType.WARN;
    message: string;
}

/** WebSocket response for errors. */
export interface ErrorEventResponse {
    type: GameEventResponseType.ERROR;
    message: string;
}

/** WebSocket response for a consumable event being started (only Happy Hour). */
export interface ConsumedEventResponse {
    type: GameEventResponseType.CONSUMED;
    consumable: string;
    displayName: string;
    startedAt: number;
}

/** WebSocket response for a consumable event ending (only Happy Hour). */
export interface ConsumableEndedEventResponse {
    type: GameEventResponseType.CONSUMABLE_ENDED;
    consumable: string;
    name: string;
}

/** WebSocket response for buying a lotus. */
export interface LotusEventResponse {
    type: GameEventResponseType.LOTUS;
    consumableName: string;
    amount: number;
}

/** WebSocket response for applying a lotus effect. */
export interface AppliedLotusEventResponse {
    type: GameEventResponseType.APPLIED_LOTUS;
    remaining: number; // milliseconds remaining
    lifetimePurchased: number;
}

/** WebSocket response for an active lotus effect. */
export interface LotusActiveEventResponse {
    type: GameEventResponseType.LOTUS_ACTIVE;
    remainingMs: number; // milliseconds remaining
}

/** WebSocket response for a lotus effect ending. */
export interface LotusEndedEventResponse {
    type: GameEventResponseType.LOTUS_ENDED;
}

/** WebSocket response for receiving tips. */
export interface TipsEventResponse {
    type: GameEventResponseType.TIPS;
    tips: number;
}

/** WebSocket response for applying a tip. */
export interface AppliedTipEventResponse {
    type: GameEventResponseType.APPLIED_TIP;
    amount: number;
    remaining: number;
}

/** WebSocket response for receiving a backlog of tips. */
export interface TipBacklogEventResponse {
    type: GameEventResponseType.TIP_BACKLOG;
    tips: number;
}

/** WebSocket response for a time skip event. */
export interface TimeSkipEventResponse {
    type: GameEventResponseType.TIME_SKIP;
    consumableName: string;
    id: string;
    amount: number; // minutes skipped
}

/** WebSocket response for a 'thanks' event. */
export interface ThanksEventResponse {
    type: GameEventResponseType.THANKS;
}

/** Union type for all possible game event WebSocket responses. */
export type GameEventResponse =
    | InfoAllEventResponse
    | JoinEventResponse
    | WarnEventResponse
    | ErrorEventResponse
    | ConsumedEventResponse
    | ConsumableEndedEventResponse
    | LotusEventResponse
    | AppliedLotusEventResponse
    | LotusActiveEventResponse
    | LotusEndedEventResponse
    | TipsEventResponse
    | AppliedTipEventResponse
    | TipBacklogEventResponse
    | TimeSkipEventResponse
    | ThanksEventResponse

/** State for a single consumable game event (amount, end times, display name). */
export interface ConsumableGameEvent {
    amount: number;
    ends: number[];
    displayName: string;
}

/** Mapping of GameEventID to their corresponding ConsumableGameEvent state. */
export type ConsumableGameEvents = {
    [key in GameEventID]: ConsumableGameEvent;
};

/*  Example info-all event payload:
{
    "type": "info-all",
    "active": [
        {
            "name": "Happy Hour Bell",
            "internalName": "HAPPY_HOUR_BELL",
            "endsAt": 1747402573000
        },
        {
            "name": "Happy Hour Bell",
            "internalName": "HAPPY_HOUR_BELL",
            "endsAt": 1747402576000
        }
    ],
    "tips": 0,
    "inventory": [
        {
            "type": "lotus",
            "amount": 24,
            "used": 3
        }
    ]
}
*/
