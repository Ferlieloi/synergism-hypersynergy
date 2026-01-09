import { HSGameDataSubscriber } from "../../../types/hs-types";
import { HSGameData } from "../../hs-core/gds/hs-gamedata";
import { HSModuleManager } from "../../hs-core/module/hs-module-manager";
import { HSGameDataAPI } from "../../hs-core/gds/hs-gamedata-api";
import { HSModule } from "../../hs-core/module/hs-module";
import { HSLogger } from "../../hs-core/hs-logger";
import { HSUI } from "../../hs-core/hs-ui";
import { HSSettings } from "../../hs-core/settings/hs-settings";
import { HSNumericSetting } from "../../hs-core/settings/hs-setting";
import { HSUtils } from "../../hs-utils/hs-utils";
import { HSAutosingStrategy, PhaseOption, phases, CorruptionLoadout, AutosingStrategyPhase, SPECIAL_ACTIONS } from "../../../types/module-types/hs-autosing-types";
import { HSElementHooker } from "../../hs-core/hs-elementhooker";
import { HSDebug } from "../../hs-core/hs-debug";

export class HSAutosing extends HSModule implements HSGameDataSubscriber {
    gameDataSubscriptionId?: string;

    private gameDataResolver?: (value: void) => void;

    private strategy?: HSAutosingStrategy;

    private autosingEnabled = false;
    private targetSingularity = 0;
    private sleepTime = 50;
    private buildingsTab!: HTMLButtonElement;
    private challengeTab!: HTMLButtonElement;
    private runesTab!: HTMLButtonElement;
    private corruptionsTab!: HTMLButtonElement;
    private settingsTab!: HTMLButtonElement;
    private singularityTab!: HTMLButtonElement;
    private challengeButtons: Record<number, HTMLButtonElement> = {};
    private exitTranscBtn!: HTMLButtonElement;
    private exitReincBtn!: HTMLButtonElement;
    private exitAscBtn!: HTMLButtonElement;
    private ascendBtn!: HTMLButtonElement;
    private ambrosia_early_cube: HTMLButtonElement | null = null;
    private ambrosia_late_cube: HTMLButtonElement | null = null;
    private ambrosia_quark: HTMLButtonElement | null = null;
    private antSacrifice: HTMLButtonElement | null = null;
    private coin!: HTMLButtonElement;
    private C11Unlocked = false;
    private C12Unlocked = false;
    private C13Unlocked = false;
    private C14Unlocked = false;
    private C15Unlocked = false;
    private sing = 0;



    init(): Promise<void> {
        HSLogger.log(`Initializing HSAutosing module`, this.context);

        this.autosingEnabled = false;
        this.targetSingularity = 0;

        this.buildingsTab = document.getElementById('buildingstab') as HTMLButtonElement;
        this.challengeTab = document.getElementById('challengetab') as HTMLButtonElement;
        this.runesTab = document.getElementById('runestab') as HTMLButtonElement;
        this.corruptionsTab = document.getElementById('traitstab') as HTMLButtonElement;
        this.settingsTab = document.getElementById('settingstab') as HTMLButtonElement;
        this.singularityTab = document.getElementById('singularitytab') as HTMLButtonElement;
        for (let i = 1; i <= 15; i++) {
            const btn = document.getElementById(`challenge${i}`) as HTMLButtonElement;
            if (btn) {
                this.challengeButtons[i] = btn;
            }
        }
        this.exitTranscBtn = document.getElementById('challengebtn') as HTMLButtonElement;
        this.exitReincBtn = document.getElementById('reincarnatechallengebtn') as HTMLButtonElement;
        this.exitAscBtn = document.getElementById('ascendChallengeBtn') as HTMLButtonElement;
        this.ascendBtn = document.getElementById('ascendbtn') as HTMLButtonElement;
        this.antSacrifice = document.getElementById(`antSacrifice`) as HTMLButtonElement;
        this.coin = document.getElementById('buycoin1') as HTMLButtonElement;

        if (!this.buildingsTab || !this.challengeTab || !this.settingsTab || !this.singularityTab || !this.challengeButtons || !this.exitAscBtn || !this.exitReincBtn) {
            HSLogger.debug("Error during autosing initialization: could not find main tabs", this.context);
            return Promise.resolve();
        }

        HSLogger.log(`HSAutosing module initialized`, this.context);
        return Promise.resolve();
    }

    isAutosingEnabled(): boolean {
        return this.autosingEnabled;
    }

    subscribeGameDataChanges() {
        const gameDataMod = HSModuleManager.getModule<HSGameData>('HSGameData');

        if (gameDataMod && !this.gameDataSubscriptionId) {
            this.gameDataSubscriptionId = gameDataMod.subscribeGameDataChange(this.gameDataCallback.bind(this));
            HSLogger.log('Subscribed to game data changes for autosing', this.context);
        }
    }

    unsubscribeGameDataChanges() {
        const gameDataMod = HSModuleManager.getModule<HSGameData>('HSGameData');

        if (gameDataMod && this.gameDataSubscriptionId) {
            gameDataMod.unsubscribeGameDataChange(this.gameDataSubscriptionId);
            this.gameDataSubscriptionId = undefined;
            HSLogger.log('Unsubscribed from game data changes for autosing', this.context);
        }
    }

    gameDataCallback(): Promise<void> {
        if (this.gameDataResolver) {
            this.gameDataResolver();
            this.gameDataResolver = undefined;
        }
        return Promise.resolve();
    }

    async enableAutoSing(): Promise<void> {
        HSUtils.startDialogWatcher();
        this.autosingEnabled = true;
        const singularitySetting = HSSettings.getSetting('singularityNumber') as HSNumericSetting;
        this.targetSingularity = singularitySetting.getValue();
        this.subscribeGameDataChanges();


        new Promise<void>(resolve => {
            this.gameDataResolver = resolve;
        })


        const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        if (!gameDataAPI) {
            HSLogger.debug("Could not find HSGameDataAPI module", this.context);
            this.stopAutosing();
            return Promise.resolve();
        }

        const gameData = gameDataAPI.getGameData();
        if (!gameData) {
            HSLogger.debug("Could not get game data", this.context);
            this.stopAutosing();
            return Promise.resolve();
        }

        if (this.targetSingularity > gameData.highestSingularityCount) {
            HSLogger.log(`target singularity cannot be bigger than highest singularity`);
            this.stopAutosing();
            return Promise.resolve();
        }
        this.unsubscribeGameDataChanges();

        this.performAutosingLogic();

        HSLogger.log(`Autosing enabled for target singularity: ${this.targetSingularity}`, this.context);
        return Promise.resolve();
    }

    async disableAutoSing(): Promise<void> {
        this.autosingEnabled = false;
        this.stopAutosing();
        HSLogger.log(`Autosing disabled`, this.context);
        return Promise.resolve();
    }

    private async performAutosingLogic(): Promise<void> {
        // START OF Autosinging Logic
        this.sing = 0;
        const strategySetting = HSSettings.getSetting("autosingStrategy");
        const selectedValue = strategySetting.getValue();

        const control = strategySetting.getDefinition().settingControl;
        if (!control?.selectOptions) {
            HSUI.Notify("Strategy selector not available", { notificationType: "warning" });
            this.stopAutosing();
            return Promise.resolve();
        }

        const selectedOption = control.selectOptions.find(
            opt => opt.value.toString() === HSUtils.asString(selectedValue)
        );

        if (!selectedOption) {
            HSUI.Notify("Selected strategy not found", { notificationType: "warning" });
            this.stopAutosing();
            return Promise.resolve();
        }

        const strategies = HSSettings.getStrategies();
        this.strategy = strategies.find(
            s => s.strategyName === selectedOption.text
        );

        if (!this.strategy) {
            HSUI.Notify("Could not find strategy", { notificationType: "warning" });
            this.stopAutosing();
            return Promise.resolve();
        }

        const earlyCubeVal = HSSettings.getSetting("autosingEarlyCubeLoadout").getValue();
        const lateCubeVal = HSSettings.getSetting("autosingLateCubeLoadout").getValue();
        const quarkVal = HSSettings.getSetting("autosingQuarkLoadout").getValue();

        if (earlyCubeVal === lateCubeVal || earlyCubeVal === quarkVal || lateCubeVal === quarkVal) {
            HSUI.Notify("Autosing Ambrosia loadout selection contains the same loadout twice", { notificationType: "warning" });
        }

        this.ambrosia_early_cube = document.getElementById(`hs-ambrosia-quickbar-blueberryLoadout${earlyCubeVal}`) as HTMLButtonElement;
        this.ambrosia_late_cube = document.getElementById(`hs-ambrosia-quickbar-blueberryLoadout${lateCubeVal}`) as HTMLButtonElement;
        this.ambrosia_quark = document.getElementById(`hs-ambrosia-quickbar-blueberryLoadout${quarkVal}`) as HTMLButtonElement;

        if (!this.ambrosia_early_cube || !this.ambrosia_late_cube || !this.ambrosia_quark) {
            HSUI.Notify("An ambrosia button not found at the start of singularity", { notificationType: "warning" });
            this.stopAutosing();
            return Promise.resolve();
        }

        try {

            while (this.isAutosingEnabled()) {
                await HSUtils.click(this.ambrosia_quark);
                await HSUtils.click(this.ascendBtn);
                await this.performSingularity();

                let singularityActivated = false;
                const checkSingularity = () => {
                    const btn = document.querySelector('#singularitybtn');
                    if (!btn) return false;

                    // Use computed style instead of inline style
                    const filter = window.getComputedStyle(btn).getPropertyValue('filter');
                    return !filter || filter === 'none';
                };


                while (this.isAutosingEnabled() && !singularityActivated) {
                    if (checkSingularity()) {
                        singularityActivated = true;
                        HSLogger.debug('Singularity button is now ACTIVATED!');
                        break;
                    }
                    let stage = await this.getStage();
                    await this.matchStageToStrategy(stage);
                    await HSUtils.sleep(this.sleepTime);
                }
                if (this.isAutosingEnabled()) {
                    const finalPhase = this.getFinalStrategyPhase();
                    if (finalPhase) {
                        HSLogger.debug(
                            `Singularity activated — performing final phase: ${finalPhase.startPhase}-${finalPhase.endPhase}`,
                            this.context
                        );
                        await this.matchStageToStrategy("final");
                    }
                }

                this.sing += 1;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            HSLogger.debug(`Error during autosing logic: ${errorMessage}`, this.context);
            this.stopAutosing();
        }
    }

    private getFinalStrategyPhase(): AutosingStrategyPhase | null {
        if (!this.strategy || !this.strategy.strategy.length) return null;
        return this.strategy.strategy[this.strategy.strategy.length - 1];
    }

    private getPhaseIndex(phase: PhaseOption): number {
        return phases.indexOf(phase);
    }

    private isInChallenge(challengeIndex: number): boolean {
        const challenge = document.getElementById(`challenge${challengeIndex}`);
        return !!challenge?.classList.contains('challengeActive');
    }

    private isInAmbLoadout(loadout: HTMLButtonElement): boolean {
        return !!loadout?.classList.contains('hs-ambrosia-active-slot');
    }

    async matchStageToStrategy(stage: string | null): Promise<void> {
        if (!stage || !this.strategy) return;

        let phaseConfig: AutosingStrategyPhase | null = null;

        if (stage.toLowerCase() === 'final') {
            phaseConfig = this.getFinalStrategyPhase();

            if (!phaseConfig) {
                HSLogger.log('No final strategy phase found', this.context); return;
            }
        } else {

            let stageStart: PhaseOption | null = null;
            let stageEnd: PhaseOption | null = null;

            // Find a valid (start, end) phase pair
            for (const start of phases) {
                if (!stage.startsWith(`${start}-`)) continue;

                const possibleEnd = stage.slice(start.length + 1);

                if (this.isPhaseOption(possibleEnd)) {
                    stageStart = start;
                    stageEnd = possibleEnd;
                    break;
                }
            }

            if (!stageStart || !stageEnd) {
                HSLogger.debug(`Invalid stage format ${stage}`, this.context);
                return;
            }

            const stageStartIndex: number = this.getPhaseIndex(stageStart);
            const stageEndIndex: number = this.getPhaseIndex(stageEnd);

            if (stageStartIndex === -1 || stageEndIndex === -1) {
                HSLogger.debug(`Unknown stage ${stage}`, this.context);
                return;
            }

            phaseConfig =
                this.strategy.strategy.find((p: AutosingStrategyPhase) => {
                    const strategyStartIndex = this.getPhaseIndex(p.startPhase);
                    const strategyEndIndex = this.getPhaseIndex(p.endPhase);

                    if (strategyStartIndex === -1 || strategyEndIndex === -1) {
                        return false;
                    }

                    return (
                        stageStartIndex >= strategyStartIndex &&
                        stageEndIndex <= strategyEndIndex
                    );
                }) ?? null;

            if (!phaseConfig) {
                HSLogger.debug(`No strategy phase matched for stage ${stage}`, this.context);
                return;
            }
        }
        HSLogger.debug(`executing phase: ${phaseConfig.startPhase}-${phaseConfig.endPhase}`, this.context);
        await this.executePhase(phaseConfig);
    }

    private isPhaseOption(value: string): value is PhaseOption {
        return (phases as readonly string[]).includes(value);
    }

    private async executePhase(phaseConfig: AutosingStrategyPhase): Promise<void> {
        await this.setCorruptions(phaseConfig.corruptions);

        this.challengeTab.click();

        for (let i = 0; i < phaseConfig.strat.length; i++) {
            if (!this.autosingEnabled) return;
            const challenge = phaseConfig.strat[i];

            if (challenge.challengeNumber == 200) { // Jump action (200)
                const operator = challenge.ifJump?.ifJumpOperator;
                const challengeCompletions = this.getChallengeCompletions(challenge.ifJump?.ifJumpChallenge ?? -1)
                switch (operator) {
                    case ">":
                        if (challengeCompletions > (challenge.ifJump?.ifJumpValue ?? 0))
                            if (challenge.ifJump?.ifJumpIndex !== undefined)
                                i = challenge.ifJump?.ifJumpIndex - 1;
                        break;
                    case "<":
                        if (challengeCompletions < (challenge.ifJump?.ifJumpValue ?? 0))
                            if (challenge.ifJump?.ifJumpIndex !== undefined)
                                i = challenge.ifJump?.ifJumpIndex - 1;
                        break;
                    default:
                        break;
                }
            } else if (challenge.challengeNumber >= 100) { // Special actions (100+)

                HSLogger.debug(`Autosing: Performing special action: ${SPECIAL_ACTIONS.find(a => a.value === challenge.challengeNumber)?.label ?? challenge.challengeNumber}`, this.context);
                await HSUtils.sleep(challenge.challengeWaitTime);
                await this.performSpecialAction(challenge.challengeNumber);
                continue;
            } else {

                if (challenge.challengeNumber >= 11 && challenge.challengeNumber <= 15) {
                    await this.ensureChallengeUnlocked(challenge.challengeNumber);
                }

                HSLogger.debug(`Autosing: waiting for: ${challenge.challengeCompletions ?? 0} completions of challenge${challenge.challengeNumber}, after reaching goal waiting ${challenge.challengeWaitTime}ms \nMAX TIME: ${challenge.challengeWaitTime}ms`, this.context);
                await this.waitForCompletion(
                    challenge.challengeNumber,
                    challenge.challengeCompletions ?? 0,
                    challenge.challengeMaxTime,
                    challenge.challengeWaitTime
                );
                await HSUtils.sleep(this.sleepTime);
            }
        }
    }

    private async performSpecialAction(actionId: number): Promise<void> {
        switch (actionId) {
            case 101: // Exit Transcension challenge
                await HSUtils.click(this.exitTranscBtn);
                break;
            case 102: // Exit Reincarnation challenge
                await HSUtils.click(this.exitReincBtn);
                break;
            case 103: // Exit Ascension challenge
                await HSUtils.click(this.exitAscBtn);
                break;
            case 104: // Ascend
                await HSUtils.click(this.ascendBtn);
                break;
            case 105: // Early Cube
                if (this.ambrosia_early_cube) {
                    await this.setAmbrosiaLoadout(this.ambrosia_early_cube);
                }
                break;
            case 106: // Late Cube
                if (this.ambrosia_late_cube) {
                    await this.setAmbrosiaLoadout(this.ambrosia_late_cube);
                }
                break;
            case 107: // Quark
                if (this.ambrosia_quark) {
                    await this.setAmbrosiaLoadout(this.ambrosia_quark);
                }
                break;
            case 108: // Ant sac
                if (this.antSacrifice) {
                    await HSUtils.click(this.antSacrifice);
                }
                break;
            case 109: // Ant Corruptions
                const antCorruptions = { viscosity: 16, drought: 0, deflation: 16, extinction: 0, illiteracy: 5, recession: 16, dilation: 0, hyperchallenge: 16 } as CorruptionLoadout
                this.setCorruptions(antCorruptions)
                break;
            default:
                HSLogger.log(`Unknown special action ${actionId}`, this.context);
        }
    }

    private async setAmbrosiaLoadout(loadout: HTMLButtonElement) {
        while (!this.isInAmbLoadout(loadout)) {
            await HSUtils.click(loadout);
            await HSUtils.sleep(this.sleepTime);
        }
    }

    private stringifyCorruptions(loadout: CorruptionLoadout): string {
        const values = [
            loadout.viscosity,
            loadout.drought,
            loadout.deflation,
            loadout.extinction,
            loadout.illiteracy,
            loadout.recession,
            loadout.dilation,
            loadout.hyperchallenge
        ];
        return values.join(',');
    }

    private async setCorruptions(corruptions: CorruptionLoadout): Promise<void> {
        let tries = 0
        const importBtn = document.querySelector('#corruptionLoadoutTable button.corrImport') as HTMLButtonElement;
        if (!importBtn) {
            HSLogger.debug("Error: could not access corruption import button", this.context);
        }

        const loadoutJson = {
            viscosity: corruptions.viscosity,
            drought: corruptions.drought,
            deflation: corruptions.deflation,
            extinction: corruptions.extinction,
            illiteracy: corruptions.illiteracy,
            recession: corruptions.recession,
            dilation: corruptions.dilation,
            hyperchallenge: corruptions.hyperchallenge
        };

        while (JSON.stringify(HSUtils.getCorruptions("current")) !== JSON.stringify(corruptions)) {
            if (tries >= 10) {
                HSLogger.log("Could not set corruptions", this.context);
                break;
            }
            tries += 1;
            importBtn.click();

            const corruptionsInput = document.getElementById('prompt_text') as HTMLInputElement;
            if (!corruptionsInput) {
                HSLogger.debug("Error: could not access prompt input", this.context);
            }

            corruptionsInput.value = JSON.stringify(loadoutJson);

            const okayBtn = document.getElementById('ok_prompt') as HTMLButtonElement;

            await HSUtils.click(okayBtn);
            await HSUtils.click(this.ascendBtn);
        }
        HSLogger.debug(`Corruptions: ${this.stringifyCorruptions(corruptions)} set`, this.context)
    }

    private stopAutosing() {
        this.autosingEnabled = false;
        this.unsubscribeGameDataChanges();
        const singSetting = HSSettings.getSetting("startAutosing");
        singSetting.disable();
        HSUtils.stopDialogWatcher();
    }

    private async getStage(): Promise<string> {
        await HSUtils.click(this.settingsTab);
        const settingsSubTab = document.getElementById('switchSettingSubTab4') as HTMLButtonElement;
        if (!settingsSubTab) {
            HSLogger.debug("Error during autosing logic: could not access settings to read stage", this.context);
            this.stopAutosing();
        }
        settingsSubTab.click();
        const misc = document.getElementById('kMisc') as HTMLButtonElement;
        if (!misc) {
            HSLogger.debug("Error during autosing logic: could not access settings to read stage", this.context);
            this.stopAutosing();
        }
        misc.click();
        const stage = await HSUtils.waitForElement('gameStageStatistic');
        if (!stage) {
            HSLogger.debug("Error during autosing logic: could not access settings to read stage", this.context);
            this.stopAutosing();
        }
        await HSUtils.waitForInnerText(stage, t => /Current Game Section:/.test(t));
        const regex = new RegExp('Current Game Section: (.*)');
        const match = stage.innerText.match(regex);

        if (!match) {
            console.error("Could not find game stage");
            return "";
        }
        HSLogger.debug(`Found stage: ${match[1].trim()} in settings`)
        return match[1].trim();
    }

    private async enterAndLeaveExalt(): Promise<void> {
        const exalt2Btn = document.getElementById('oneChallengeCap') as HTMLButtonElement;

        if (!exalt2Btn) {
            HSLogger.debug("Error: Exalt 2 button not found", this.context);
            this.stopAutosing();
            return;
        }
        const isInChallenge = () => exalt2Btn.style.backgroundColor === "orchid";

        while (!isInChallenge()) {
            await HSUtils.click(exalt2Btn);
            await HSUtils.sleep(200);
        }

        while (isInChallenge()) {
            await HSUtils.click(exalt2Btn);
            await HSUtils.sleep(200);
        }
    }

    private async performSingularity(): Promise<void> {
        await this.enterAndLeaveExalt();
        this.C11Unlocked = false;
        this.C12Unlocked = false;
        this.C13Unlocked = false;
        this.C14Unlocked = false;
        this.C15Unlocked = false;

        const elevatorInput = document.getElementById('elevatorTargetInput') as HTMLInputElement;
        if (!elevatorInput) {
            HSLogger.debug("Error during autosing logic: elevator input not found", this.context);
            this.stopAutosing();
        }
        elevatorInput.value = this.targetSingularity.toString();
        // Trigger input event to update the game state
        elevatorInput.dispatchEvent(new Event('input', { bubbles: true }));

        const elevatorTeleportButton = document.getElementById('elevatorTeleportButton') as HTMLButtonElement;
        if (!elevatorTeleportButton) {
            HSLogger.debug("Error during autosing logic: elevator teleport button button not found", this.context);
            this.stopAutosing();
        }
        await HSUtils.click(elevatorTeleportButton);
        await HSUtils.sleep(this.sleepTime);
        await this.buyCoin();
        HSLogger.debug("Singularity performed", this.context);
        return Promise.resolve();
    }

    private async buyCoin() {
        let coins = "0"
        while (HSUtils.isBiggerThan1000(coins)) {
            await HSUtils.click(this.coin);
            const coinsElement = document.getElementById("coinDisplay") as HTMLElement;
            if (!coinsElement) HSLogger.debug("Error: Could not buy coin building", this.context)
            coins = coinsElement.textContent;
        }
    }

    private getChallengeCompletions(challenge: number) {
        const chal = document.getElementById(`challenge${challenge}level`) as HTMLParagraphElement | null;
        const currentCompletions = chal ? this.parseNumber(chal.innerText) : 0;
        return currentCompletions;
    }

    private getChallengeGoal(challenge: number) {
        const chal = document.getElementById(`challenge${challenge}level`) as HTMLParagraphElement | null;
        if (!chal) return 0;
        const text = chal.innerText;
        if (text.includes('/')) {
            const parts = text.split('/');
            return this.parseNumber(parts[1].trim());
        }
        return 9999;
    }

    private async waitForCompletion(
        challengeIndex: number,
        minCompletions: number,
        maxTime: number = 99999999,
        waitTime: number = 0
    ): Promise<void> {
        const sleepInterval = 10; // Fixed sleep interval inside function
        let totalTimeElapsed = 0;
        const challengeBtn = this.challengeButtons[challengeIndex];

        while (!this.isInChallenge(challengeIndex) && totalTimeElapsed < maxTime) {
            if (!this.isAutosingEnabled()) {
                this.stopAutosing();
                return Promise.resolve();
            }

            if (!challengeBtn) {
                HSLogger.debug(
                    `Challenge button ${challengeIndex} not found`,
                    this.context
                );
                return Promise.resolve();
            }

            await HSUtils.DblClick(challengeBtn);
            await HSUtils.sleep(100); // debounce double-clicks
            totalTimeElapsed += 100;
        }

        if (!this.isInChallenge(challengeIndex)) {
            HSLogger.debug(
                `Timeout: Failed to enter challenge ${challengeIndex}`,
                this.context
            );
            return Promise.resolve();
        }

        while (totalTimeElapsed < maxTime && this.isAutosingEnabled()) {
            if (!this.isAutosingEnabled()) {
                this.stopAutosing();
                return Promise.resolve();
            }

            const currentCompletions = this.getChallengeCompletions(challengeIndex);
            const maxPossible = this.getChallengeGoal(challengeIndex);

            if (currentCompletions >= minCompletions || currentCompletions >= maxPossible) {
                this.markChallengeUnlocked(challengeIndex);
                if (waitTime > 0 && !(currentCompletions >= maxPossible)) {
                    await HSUtils.sleep(waitTime);
                }
                return Promise.resolve();
            }

            await HSUtils.sleep(sleepInterval);
            totalTimeElapsed += sleepInterval;
        }

        HSLogger.debug(`Timeout: Challenge ${challengeIndex} failed to reach ${minCompletions} completions within ${maxTime}ms`);
    }

    private parseNumber(text: string): number {
        let cleanText = text.replace(/,/g, '').trim();
        if (cleanText.includes('/')) {
            cleanText = cleanText.split('/')[0];
        }
        const result = Number(cleanText);
        return isNaN(result) ? 0 : result;
    }

    private isChallengeUnlocked(challenge: number): boolean {
        switch (challenge) {
            case 11: return this.C11Unlocked;
            case 12: return this.C12Unlocked;
            case 13: return this.C13Unlocked;
            case 14: return this.C14Unlocked;
            case 15: return this.C15Unlocked;
            default: return true;
        }
    }

    private markChallengeUnlocked(challenge: number): void {
        switch (challenge) {
            case 10: this.C11Unlocked = true; break;
            case 11: this.C12Unlocked = true; break;
            case 12: this.C13Unlocked = true; break;
            case 13: this.C14Unlocked = true; break;
            case 14: this.C15Unlocked = true; break;
        }
    }

    private async ensureChallengeUnlocked(target: number): Promise<void> {
        if (this.isChallengeUnlocked(target)) return;

        HSLogger.debug(`Ensuring unlock path for c${target}`);

        const prerequisites: Record<number, number[]> = {
            11: [10],
            12: [11, 10],
            13: [12, 10],
            14: [13, 10],
            15: [14, 10],
        };

        const ZERO_CORRUPTIONS: CorruptionLoadout = {
            viscosity: 0,
            drought: 0,
            deflation: 0,
            extinction: 0,
            illiteracy: 0,
            recession: 0,
            dilation: 0,
            hyperchallenge: 0,
        };

        await this.setCorruptions(ZERO_CORRUPTIONS);

        for (let c = 11; c <= target; c++) {
            const reqs = prerequisites[c];
            if (!reqs) continue;

            for (const req of reqs) {
                HSLogger.debug(`Running prerequisite c${req} for c${c}`, this.context);
                if (req === 10) {
                    await this.waitForCompletion(req, 1, 60000, 500);
                    await HSUtils.sleep(this.sleepTime);
                } else {
                    await this.waitForCompletion(req, 0, 60000, 0);
                    await HSUtils.sleep(this.sleepTime);
                }

            }
        }
    }
}