/*
    Type definition collection: HS types
    Description: Collection of general types for Hypersynergism
    Author: Swiffy
*/

import { GameData } from "./data-types/hs-player-savedata";

// Used when listing and loading modules
export type HSModuleDefinition = {
    className: string;
    context: string;
    moduleName?: string;
    loadOrder?: number;
    initImmediate?: boolean;
    moduleColor?: string;

    moduleType?: HSModuleType;
    moduleKind?: HSExternalModuleKind;
    moduleScriptUrl?: string;
    moduleCSSUrl?: string;
    scriptContext?: string;
}

export enum HSModuleType {
    MODULE = 1,
    EXTMODULE = 2
}

export enum HSExternalModuleKind {
    SCRIPT = 1,
    STYLE = 2,
    BOTH = 3
}

export interface HSModuleOptions {
    moduleName: string, 
    context: string, 
    moduleColor?: string
}

export interface HSExternalModuleOptions extends HSModuleOptions {
    moduleKind: HSExternalModuleKind;
    moduleScriptUrl?: string;
    moduleCSSUrl?: string;
    scriptContext: string;
}

export interface HSGameDataSubscriber {
    gameDataSubscriptionId?: string;
    gameDataCallback: (data: GameData) => Promise<void>;
    subscribeGameDataChanges: () => void;
    unsubscribeGameDataChanges: () => void;
}
