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
import { HSAutosingTimerModal } from "./hs-autosingTimerModal";
import { ALLOWED } from "../../../types/module-types/hs-autosing-types";

/*
    Class: HSAutosing
    IsExplicitHSModule: Yes
    Description: 
        Hypersynergism module that performs autosings.
    Author: XxmolkxX
*/

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

export class HSAutosing extends HSModule implements HSGameDataSubscriber {
    gameDataSubscriptionId?: string;

    private gameDataResolver?: (value: void) => void;

    private strategy?: HSAutosingStrategy;
    private autosingEnabled = false;
    private targetSingularity = 0;
    private sleepTime = 10;
    private buildingsTab!: HTMLButtonElement;
    private challengeTab!: HTMLButtonElement;
    private settingsTab!: HTMLButtonElement;
    private singularityTab!: HTMLButtonElement;
    private challengeButtons: Record<number, HTMLButtonElement> = {};
    private exitTranscBtn!: HTMLButtonElement;
    private exitReincBtn!: HTMLButtonElement;
    private exitAscBtn!: HTMLButtonElement;
    private ascendBtn!: HTMLButtonElement;
    private autoChallengeButton!: HTMLButtonElement;
    private ambrosia_early_cube!: HTMLButtonElement;
    private ambrosia_late_cube!: HTMLButtonElement;
    private ambrosia_quark!: HTMLButtonElement;
    private ambrosia_obt!: HTMLButtonElement;
    private ambrosia_off!: HTMLButtonElement;
    private ambrosia_ambrosia!: HTMLButtonElement;
    private antSacrifice!: HTMLButtonElement;
    private coin!: HTMLButtonElement;
    private timerModal!: HSAutosingTimerModal;
    private singTab2!: HTMLButtonElement;
    private prevActionTime: number = 0;
    private AOAG!: HTMLButtonElement;
    private singBtn!: HTMLButtonElement;
    private singularityWasDisabled: boolean = false;
    private endStageDone: boolean = false;





    init(): Promise<void> {
        HSLogger.log(`Initializing HSAutosing module`, this.context);

        this.autosingEnabled = false;
        this.targetSingularity = 0;

        this.buildingsTab = document.getElementById('buildingstab') as HTMLButtonElement;
        this.challengeTab = document.getElementById('challengetab') as HTMLButtonElement;
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
        this.autoChallengeButton = document.getElementById('toggleAutoChallengeStart') as HTMLButtonElement;
        this.antSacrifice = document.getElementById(`antSacrifice`) as HTMLButtonElement;
        this.coin = document.getElementById('buycoin1') as HTMLButtonElement;
        this.singTab2 = document.getElementById('toggleSingularitySubTab2') as HTMLButtonElement;
        this.AOAG = document.getElementById('antiquitiesRuneSacrifice') as HTMLButtonElement;
        this.singularityWasDisabled = false;
        this.endStageDone = false;
        this.singBtn = document.querySelector('#singularitybtn') as HTMLButtonElement;
        if (!this.timerModal || !this.buildingsTab || !this.challengeTab || !this.settingsTab || !this.singularityTab || !this.challengeButtons || !this.exitAscBtn || !this.exitReincBtn) {
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
        this.AOAG = document.getElementById('antiquitiesRuneSacrifice') as HTMLButtonElement;
        this.autosingEnabled = true;
        HSUtils.startDialogWatcher();
        const quickbarSettng = HSSettings.getSetting('ambrosiaQuickBar');

        if (quickbarSettng && !quickbarSettng.isEnabled()) {
            HSUI.Notify("You need to enable the ambrosia quickbar setting before you can use autosing.")
            this.stopAutosing();
            return Promise.resolve();
        }
        const singularitySetting = HSSettings.getSetting('singularityNumber') as HSNumericSetting;
        this.targetSingularity = singularitySetting.getValue();

        this.timerModal = new HSAutosingTimerModal();
        if (this.timerModal) {
            this.timerModal.show();
        }

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
        if (this.timerModal) {
            this.timerModal.hide();
        }
        HSLogger.log(`Autosing disabled`, this.context);
        return Promise.resolve();
    }

    private async performAutosingLogic(): Promise<void> {
        // START OF Autosinging Logic
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
        const obtVal = HSSettings.getSetting("autosingObtLoadout").getValue();
        const offVal = HSSettings.getSetting("autosingOffLoadout").getValue();
        const ambrosiaVal = HSSettings.getSetting("autosingAmbrosiaLoadout").getValue();

        this.ambrosia_early_cube = document.getElementById(`hs-ambrosia-quickbar-blueberryLoadout${earlyCubeVal}`) as HTMLButtonElement;
        this.ambrosia_late_cube = document.getElementById(`hs-ambrosia-quickbar-blueberryLoadout${lateCubeVal}`) as HTMLButtonElement;
        this.ambrosia_quark = document.getElementById(`hs-ambrosia-quickbar-blueberryLoadout${quarkVal}`) as HTMLButtonElement;
        this.ambrosia_obt = document.getElementById(`hs-ambrosia-quickbar-blueberryLoadout${obtVal}`) as HTMLButtonElement;
        this.ambrosia_off = document.getElementById(`hs-ambrosia-quickbar-blueberryLoadout${offVal}`) as HTMLButtonElement;
        this.ambrosia_ambrosia = document.getElementById(`hs-ambrosia-quickbar-blueberryLoadout${ambrosiaVal}`) as HTMLButtonElement;

        if (!this.ambrosia_early_cube || !this.ambrosia_late_cube || !this.ambrosia_quark || !this.ambrosia_obt || !this.ambrosia_off || !this.ambrosia_ambrosia) {
            HSUI.Notify("Could not find all required Ambrosia loadout buttons", { notificationType: "warning" });
            this.stopAutosing();
            return Promise.resolve();
        }

        try {
            if (this.timerModal) {
                this.timerModal.start();
            }
            while (this.isAutosingEnabled()) {
                await this.setAmbrosiaLoadout(this.ambrosia_quark);
                (this.ascendBtn).click();
                await this.performSingularity();
                let sawDisabled = false;

                while (this.isAutosingEnabled() && !this.endStageDone) {
                    const stage = await this.getStage();
                    await this.matchStageToStrategy(stage);
                }
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            HSLogger.debug(`Error during autosing logic: ${errorMessage}`, this.context);
            this.stopAutosing();
        }
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
            stageStart = "singularity";
            stageEnd = "end";
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

        HSLogger.debug(`executing phase: ${phaseConfig.startPhase}-${phaseConfig.endPhase}`, this.context);
        if (this.timerModal) {
            this.timerModal.setCurrentPhase(phaseConfig.startPhase + '-' + phaseConfig.endPhase);
        }
        await this.executePhase(phaseConfig);
    }

    private isPhaseOption(value: string): value is PhaseOption {
        return (phases as readonly string[]).includes(value);
    }

    private getChallengeCompletions(challengeNumber: number): number {
        const chal = document.getElementById(`challenge${challengeNumber}level`) as HTMLParagraphElement | null;
        if (!chal) return 0;
        if (challengeNumber === 15) {
            const currentCompletions = this.parseNumber(chal.innerText);
            return currentCompletions;
        }
        const currentCompletions = this.parseNumber(chal.innerText.split('/')[0]);
        return currentCompletions;
    }

    private async executePhase(phaseConfig: AutosingStrategyPhase): Promise<void> {
        await this.setCorruptions(phaseConfig.corruptions);
        this.ascendBtn.click();
        this.challengeTab.click();

        for (let i = 0; i < phaseConfig.strat.length; i++) {
            if (!this.autosingEnabled) return;

            const singularityEnabled = this.checkSingularityActivated();
            if (this.singularityWasDisabled && singularityEnabled && phaseConfig.endPhase != "end") {
                HSLogger.debug('Singularity button ACTIVATED during phase execution - breaking early', this.context);
                this.ascendBtn.click();
                break;
            }
            if (!singularityEnabled) {
                this.singularityWasDisabled = true;
            }

            const challenge = phaseConfig.strat[i];
            if (challenge.challengeNumber == 201) await this.setCorruptions(phaseConfig.corruptions);
            else if (challenge.challengeNumber == 200) { // Jump action (200)
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
                if (challenge.challengeWaitBefore && challenge.challengeWaitBefore > 0) {
                    await HSUtils.sleepUntilElapsed(this.prevActionTime, challenge.challengeWaitBefore ?? 0);
                }
                await this.performSpecialAction(challenge.challengeNumber);
                continue;
            } else {
                HSLogger.debug(`Autosing: waiting for: ${challenge.challengeCompletions ?? 0} completions of challenge${challenge.challengeNumber},waiting before: ${challenge.challengeWaitBefore}ms, after reaching goal waiting ${challenge.challengeWaitTime}ms inside \nMAX TIME: ${challenge.challengeMaxTime}`, this.context);
                await HSUtils.sleepUntilElapsed(this.prevActionTime, challenge.challengeWaitBefore ?? 0);
                await this.waitForCompletion(
                    challenge.challengeNumber,
                    challenge.challengeCompletions ?? 0,
                    challenge.challengeMaxTime,
                    challenge.challengeWaitTime,
                );
            }
        }
        if (phaseConfig.endPhase == "end") {
            this.endStageDone = true;
        }
        if (this.timerModal) {
            this.timerModal.recordPhase(`${phaseConfig.startPhase}-${phaseConfig.endPhase}`);
        }
    }


    private async performSpecialAction(actionId: number): Promise<void> {
        switch (actionId) {
            case 101: // Exit Transcension challenge
                this.exitTranscBtn.click();
                break;
            case 102: // Exit Reincarnation challenge
                this.exitReincBtn.click();
                break;
            case 103: // Exit Ascension challenge
                this.exitAscBtn.click();
                break;
            case 104: // Ascend
                this.ascendBtn.click();
                break;
            case 105: // Early Cube
                await this.setAmbrosiaLoadout(this.ambrosia_early_cube);
                break;
            case 106: // Late Cube
                await this.setAmbrosiaLoadout(this.ambrosia_late_cube);

                break;
            case 107: // Quark
                await this.setAmbrosiaLoadout(this.ambrosia_quark);
                break;
            case 108: // Ant sac
                await this.antSacrifice.click();
                break;
            case 109: // Ant Corruptions
                const antCorruptions = { viscosity: 16, drought: 0, deflation: 16, extinction: 0, illiteracy: 5, recession: 16, dilation: 0, hyperchallenge: 16 } as CorruptionLoadout;
                await this.setCorruptions(antCorruptions);
                break;
            case 110: // Cleanse
                await this.setCorruptions(ZERO_CORRUPTIONS);
                break;
            case 111: // Wait
                break;
            case 112: // Obt loadout
                await this.setAmbrosiaLoadout(this.ambrosia_obt);
                break;
            case 113: // Off loadout
                await this.setAmbrosiaLoadout(this.ambrosia_off);
                break;
            case 114: // Ambrosia loadout
                await this.setAmbrosiaLoadout(this.ambrosia_ambrosia);
                break;
            case 115: // auto Challenge Toggle
                this.autoChallengeButton.click();
                this.exitTranscBtn.click();
                this.exitReincBtn.click();
                break;
            case 116: // Buy AOAG
                if (this.AOAG && this.AOAG.classList.contains('runeButtonAvailable')) {
                    this.AOAG.click();
                    HSLogger.log(`Tried to buy AOAG!`, this.context);
                } else {
                    HSLogger.log(`Tried to buy AOAG,  but it was not yet unlocked`, this.context);
                }
                break;
            default:
                HSLogger.log(`Unknown special action ${actionId}`, this.context);
        }
        this.prevActionTime = performance.now();
    }

    private async setAmbrosiaLoadout(loadout: HTMLButtonElement): Promise<void> {
        const maxAttempts = 50; // 50 * 20ms = 1 second max
        let attempts = 0;
        while (attempts < maxAttempts && !this.isInAmbLoadout(loadout)) {
            loadout.click();

            // Check immediately after click
            if (this.isInAmbLoadout(loadout)) {
                return;
            }

            // Only sleep if not yet loaded
            await HSUtils.sleep(this.sleepTime);
            attempts++;
        }

        if (!this.isInAmbLoadout(loadout)) {
            HSLogger.debug("Warning: Failed to set ambrosia loadout after max attempts", this.context);
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
        const importBtn = document.querySelector('#corruptionLoadoutTable button.corrImport') as HTMLButtonElement;
        if (!importBtn) {
            HSLogger.debug("Error: could not access corruption import button", this.context);
        }

        const corruptionsInput = document.getElementById('prompt_text') as HTMLInputElement;
        if (!corruptionsInput) {
            HSLogger.debug("Error: could not access prompt input", this.context);
            return;
        }

        const okayBtn = document.getElementById('ok_prompt') as HTMLButtonElement;
        if (!okayBtn) {
            HSLogger.debug("Error: could not access prompt okay button", this.context);
            return;
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

        while (true) {
            importBtn.click();
            corruptionsInput.value = JSON.stringify(loadoutJson);
            await HSUtils.click(okayBtn);
            const current = HSUtils.getCorruptions("next");
            if (JSON.stringify(current) === JSON.stringify(corruptions)) {
                HSLogger.debug(`Corruptions set successfully: ${this.stringifyCorruptions(corruptions)}`, this.context);
                break;
            }
        }
        this.prevActionTime = performance.now();
    }

    private stopAutosing() {
        this.autosingEnabled = false;
        this.unsubscribeGameDataChanges();
        const singSetting = HSSettings.getSetting("startAutosing");
        singSetting.disable();
        if (this.timerModal) {
            this.timerModal.destroy();
            this.timerModal = undefined!;
        }
        HSUtils.stopDialogWatcher();
    }

    private async getStage(): Promise<string> {
        await HSUtils.click(this.settingsTab);
        const settingsSubTab = document.getElementById('switchSettingSubTab4') as HTMLButtonElement;
        if (!settingsSubTab) {
            HSLogger.debug("Error during autosing logic: could not access settings to read stage", this.context);
            this.stopAutosing();
        }

        const misc = document.getElementById('kMisc') as HTMLButtonElement;
        if (!misc) {
            HSLogger.debug("Error during autosing logic: could not access settings to read stage", this.context);
            this.stopAutosing();
        }

        const stage = await HSUtils.waitForElement('gameStageStatistic');
        if (!stage) {
            HSLogger.debug("Error during autosing logic: could not access settings to read stage", this.context);
            this.stopAutosing();
        }

        // Wait for ANY mutation to the element (even if text is the same)
        await new Promise<void>((resolve) => {
            let mutationDetected = false;

            const observer = new MutationObserver(() => {
                if (!mutationDetected) {
                    mutationDetected = true;
                    observer.disconnect();
                    resolve();
                }
            });

            // Observe before clicking to catch the update
            observer.observe(stage, {
                childList: true,
                subtree: true,
                characterData: true
            });

            settingsSubTab.click();
            misc.click();

            // Safety timeout in case no mutation happens
            setTimeout(() => {
                observer.disconnect();
                resolve();
            }, 100);
        });

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
        const exaltTimer = document.getElementById('ascSingChallengeTimeTakenStats') as HTMLSpanElement;

        if (!exalt2Btn || !exaltTimer) {
            HSLogger.debug("Error: Exalt elements not found", this.context);
            this.stopAutosing();
            return;
        }

        // Returns true if we're currently IN the challenge (timer is visible)
        const isInChallenge = () => {
            const style = window.getComputedStyle(exaltTimer);
            return style.display !== "none";
        };

        // Enter the challenge
        while (!isInChallenge()) {
            await HSUtils.click(exalt2Btn);
            await HSUtils.sleep(this.sleepTime);
        }

        // Leave the challenge
        while (isInChallenge()) {
            await HSUtils.click(exalt2Btn);
            await HSUtils.sleep(this.sleepTime);
        }
    }

    private async getCurrentGoldenQuarks(): Promise<number> {
        // Navigate to singularity tab
        await HSUtils.click(this.singularityTab);
        if (this.singTab2) await HSUtils.click(this.singTab2);
        const quarksElement = document.getElementById('goldenQuarkamount');

        if (!quarksElement) {
            HSLogger.debug("Error: could not find golden quarks display element", this.context);
            return 0;
        }

        // Wait until the element is not empty
        await new Promise<void>((resolve) => {
            // 1. Check if it already has content before starting the observer
            if (quarksElement.textContent?.trim()) {
                return resolve();
            }

            const observer = new MutationObserver(() => {
                const currentText = quarksElement.textContent?.trim();
                // 2. Only resolve if text has actually appeared
                if (currentText && currentText.length > 0) {
                    observer.disconnect();
                    resolve();
                }
            });

            observer.observe(quarksElement, {
                childList: true,
                subtree: true,
                characterData: true
            });


            setTimeout(() => {
                observer.disconnect();
                resolve();
            }, 100);
        });

        const quarksText = quarksElement.textContent || '';

        // Regex optimized for the scientific notation in your image
        const scientificRegex = /\d+([.,]\d+)?[eE][+-]?\d+/;

        const match = quarksText.match(scientificRegex);

        if (!match) {
            HSLogger.debug(`Still no number found in text: "${quarksText}"`, this.context);
            return 0;
        }

        const parsed = parseFloat(match[0].replace(',', '.'));
        HSLogger.debug(`Current Golden Quarks: ${parsed}`, this.context);

        return isNaN(parsed) ? 0 : parsed;
    }

    private async getCurrentQuarks(): Promise<number> {
        // Navigate to singularity tab
        const quarksElement = document.getElementById('quarkDisplay');
        if (!quarksElement) return 0;
        const quarksText = quarksElement.textContent;
        const parsed = parseFloat(quarksText.replace(",", "."));
        HSLogger.debug(`Current Quarks: ${parsed}`, this.context);
        return isNaN(parsed) ? 0 : parsed;
    }

    private async performSingularity(): Promise<void> {
        await this.enterAndLeaveExalt();
        this.singularityWasDisabled = false;
        this.endStageDone = false;
        const gq = await this.getCurrentGoldenQuarks();
        const q = await this.getCurrentQuarks();
        if (this.timerModal) {
            this.timerModal.recordSingularity(q, gq);
        }

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
        await this.buyCoin();
        HSLogger.debug("Singularity performed", this.context);
        let stage = await this.getStage();
        while (!Object.values(ALLOWED).some(phase => stage.includes(phase))) {
            await HSUtils.sleep(1);
            stage = await this.getStage();
        }
        return Promise.resolve()
    }

    private async buyCoin() {
        const coinsElement = document.getElementById("coinDisplay") as HTMLElement;
        if (!coinsElement) HSLogger.debug("Error: Could not buy coin building", this.context)
        let coins = coinsElement.textContent || "0";
        while (!HSUtils.isBiggerThan1000(coins)) {
            await HSUtils.click(this.coin);
            coins = coinsElement.textContent;
        }
    }

    private getActiveC11to14Challenge(): number | null {
        for (let i = 11; i <= 14; i++) {
            if (this.isInChallenge(i)) {
                return i;
            }
        }
        return null;
    }

    private async waitForCompletion(
        challengeIndex: number,
        minCompletions: number,
        maxTime: number = 99999999,
        waitTime: number = 0
    ): Promise<void> {
        const sleepInterval = 10;
        const challengeBtn = this.challengeButtons[challengeIndex];
        if (!challengeBtn) {
            HSLogger.debug(`Challenge button ${challengeIndex} not found`, this.context);
            return Promise.resolve();
        }

        const levelElement = document.getElementById(`challenge${challengeIndex}level`) as HTMLParagraphElement | null;
        if (!levelElement) {
            HSLogger.debug(`Challenge level element ${challengeIndex} not found`, this.context);
            return Promise.resolve();
        }

        let startTime = performance.now();
        while (!this.isInChallenge(challengeIndex) && performance.now() - startTime < maxTime) {
            await HSUtils.DblClick(challengeBtn);
            if (this.isInChallenge(challengeIndex)) {
                break;
            }
            await HSUtils.sleep(sleepInterval);
        }
        if (!this.isInChallenge(challengeIndex)) {
            HSLogger.debug(
                `Timeout: Failed to enter challenge ${challengeIndex}`,
                this.context
            );
            return Promise.resolve();
        }

        startTime = performance.now();

        let maxPossible = 9999;

        if (challengeIndex === 15) {
            maxPossible = Infinity;
        } else {
            const maxPossibleText = levelElement.innerText;
            const parts = maxPossibleText.split('/');
            maxPossible = this.parseNumber(parts[1].trim());
        }

        while (performance.now() - startTime < maxTime) {
            if (!this.isAutosingEnabled()) {
                this.stopAutosing();
                return Promise.resolve();
            }

            const currentText = levelElement.innerText.split('/')[0];
            const currentCompletions = this.parseNumber(currentText);

            if (currentCompletions >= maxPossible || currentCompletions >= minCompletions) {
                // Special handling for C10 when C11-14 are active
                if (challengeIndex === 10) {
                    const activeC11to14 = this.getActiveC11to14Challenge();
                    if (activeC11to14 !== null) {

                        const c11to14LevelElement = document.getElementById(
                            `challenge${activeC11to14}level`
                        ) as HTMLParagraphElement | null;
                        if (!c11to14LevelElement) {
                            return Promise.resolve();
                        }

                        const c11to14MaxPossibleText = c11to14LevelElement.innerText;
                        let c11to14MaxPossible = 72;
                        const parts = c11to14MaxPossibleText.split('/');
                        c11to14MaxPossible = this.parseNumber(parts[1].trim());
                        let c11to14CurrentCompletions = this.parseNumber(c11to14LevelElement.innerText.split('/')[0]);
                        while (true) {
                            await HSUtils.sleep(this.sleepTime);
                            const c11to14CurrentCompletions2 = this.parseNumber(
                                c11to14LevelElement.innerText.split('/')[0]
                            );

                            if (c11to14CurrentCompletions2 === c11to14CurrentCompletions) {
                                return Promise.resolve();
                            }

                            c11to14CurrentCompletions = c11to14CurrentCompletions2;
                        }
                    } else {
                        return Promise.resolve();
                    }
                } else if (currentCompletions >= minCompletions) {
                    if (waitTime > 0) {
                        await HSUtils.sleep(waitTime);
                    }
                    return Promise.resolve();
                }
                else {
                    return Promise.resolve();
                }
            }
            await HSUtils.sleep(sleepInterval);
        }

        HSLogger.debug(`Timeout: Challenge ${challengeIndex} failed to reach ${minCompletions} completions within ${maxTime}ms`);
        this.prevActionTime = performance.now();
    }

    private parseNumber(text: string): number {
        let cleanText = text.replace(/,/g, '.').trim();
        const result = Number(cleanText);
        return isNaN(result) ? 0 : result;
    }

    private checkSingularityActivated(): boolean {
        const filter = getComputedStyle(this.singBtn).getPropertyValue('filter');
        const isEnabled = !filter || filter !== 'contrast(1.25) sepia(1) grayscale(0.25)';

        return isEnabled;
    }
}