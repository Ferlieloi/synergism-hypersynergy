export interface AmbrosiaBarIncomeReactor {
    blueRoutingPercent: number;
    redRoutingPercent: number;
    blueStoredPoints: number;
    redStoredPoints: number;
    blueCapacity: number;
    encabulatorSpeed: number;
    purpleRequirementWithoutTwoMind: number;
    cancerPurplePointsPerBlueOrRedFill: number;
    purpleFillBluePoints: number;
    purpleFillRedPoints: number;
    scorpioConversionMultiplier: number;
    ariesBarPointMultiplier: number;
    overcapEnabled: boolean;
    barDependenceEnabled: boolean;
}

export interface AmbrosiaBarIncomeInput {
    reactor: AmbrosiaBarIncomeReactor;
    bluePointsPerSecond: number;
    redPointsPerSecond: number;
    blueRequirementWithoutTwoMind: number;
    redRequirementWithoutTwoMind: number;
    blueLuck: number;
    redLuck: number;
    purpleHoneyLuck: number;
    purpleHoneyPerExtraction: number;
    flatAmbrosiaPerBlueFill: number;
    acceleratorSecondsPerRedAmbrosia: number;
    twoMind: boolean;
}

export interface AmbrosiaBarIncome {
    blueAmbrosiaPerSecond: number;
    redAmbrosiaPerSecond: number;
    purpleHoneyPerSecond: number;
    blueFillsPerSecond: number;
    redFillsPerSecond: number;
    purpleFillsPerSecond: number;
}