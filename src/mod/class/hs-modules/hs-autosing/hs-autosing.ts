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
    private timerDisplay: HTMLDivElement | null = null;
    private autosingEnabled = false;
    private targetSingularity = 0;
    private sleepTime = 20;
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
    private ambrosia_obt: HTMLButtonElement | null = null;
    private ambrosia_off: HTMLButtonElement | null = null;
    private ambrosia_ambrosia: HTMLButtonElement | null = null;
    private antSacrifice: HTMLButtonElement | null = null;
    private coin!: HTMLButtonElement;
    private C11Unlocked = false;
    private C12Unlocked = false;
    private C13Unlocked = false;
    private C14Unlocked = false;
    private C15Unlocked = false;
    private timerModal: HSAutosingTimerModal | null = null;
    private singTab2: HTMLButtonElement | null = null;
    private paused = false;
    private pauseResolver: (() => void) | null = null;




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
        this.singTab2 = document.getElementById('toggleSingularitySubTab2') as HTMLButtonElement;

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
        this.autosingEnabled = true;
        HSUtils.startDialogWatcher();
        const quickbarSettng = HSSettings.getSetting('ambrosiaQuickBar');

        if (quickbarSettng && !quickbarSettng.isEnabled()) {
            HSUI.Notify("You need to enable the ambrosia quickbar setting before you can use autosing.")
            this.stopAutosing;
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

        if (earlyCubeVal === lateCubeVal || earlyCubeVal === quarkVal || lateCubeVal === quarkVal) {
            HSUI.Notify("Autosing Ambrosia loadout selection contains the same loadout twice", { notificationType: "warning" });
        }

        try {
            if (this.timerModal) {
                this.timerModal.start();
            }
            while (this.isAutosingEnabled()) {
                await this.setAmbrosiaLoadout(this.ambrosia_quark);
                await HSUtils.click(this.ascendBtn);
                await this.performSingularity();
                let sawDisabled = false;

                while (this.isAutosingEnabled()) {
                    const btn = document.querySelector('#singularitybtn');
                    if (btn) {
                        const filter = getComputedStyle(btn).getPropertyValue('filter');
                        const isEnabled = !filter || filter === 'none';
                        if (!isEnabled) {
                            sawDisabled = true;
                        }
                        if (sawDisabled && isEnabled) {
                            HSLogger.debug('Singularity button ACTIVATED!');
                            break;
                        }
                    }
                    const stage = await this.getStage();
                    await this.matchStageToStrategy(stage);
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
        if (this.timerModal) {
            this.timerModal.setCurrentPhase(phaseConfig.startPhase + '-' + phaseConfig.endPhase);
        }
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
                await HSUtils.sleep(challenge.challengeWaitTime);
                await this.performSpecialAction(challenge.challengeNumber);
                continue;
            } else {

                if (challenge.challengeNumber >= 11 && challenge.challengeNumber <= 15) {
                    await this.ensureChallengeUnlocked(challenge.challengeNumber);
                }

                HSLogger.debug(`Autosing: waiting for: ${challenge.challengeCompletions ?? 0} completions of challenge${challenge.challengeNumber}, after reaching goal waiting ${challenge.challengeWaitTime}ms inside \nMAX TIME: ${challenge.challengeMaxTime}ms and waiting outside: ${challenge.challengeWaitAfter}ms`, this.context);
                await this.waitForCompletion(
                    challenge.challengeNumber,
                    challenge.challengeCompletions ?? 0,
                    challenge.challengeMaxTime,
                    challenge.challengeWaitTime,
                );
                if (challenge.challengeWaitAfter && challenge.challengeWaitAfter > 0) {
                    if (challenge.challengeNumber <= 5) {
                        await HSUtils.click(this.exitTranscBtn);
                        await HSUtils.sleep(challenge.challengeWaitAfter);
                    } else if (challenge.challengeNumber <= 10) {
                        await HSUtils.click(this.exitReincBtn);
                        await HSUtils.sleep(challenge.challengeWaitAfter);
                    } else {
                        await HSUtils.click(this.exitAscBtn);
                        await HSUtils.sleep(challenge.challengeWaitAfter);
                    }
                }
            }
        }
        if (this.timerModal) {
            this.timerModal.recordPhase(`${phaseConfig.startPhase}-${phaseConfig.endPhase}`);
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
                const antCorruptions = { viscosity: 16, drought: 0, deflation: 16, extinction: 0, illiteracy: 5, recession: 16, dilation: 0, hyperchallenge: 16 } as CorruptionLoadout;
                await this.setCorruptions(antCorruptions);
                break;
            case 110: // Cleanse
                await this.setCorruptions(ZERO_CORRUPTIONS);
                break;
            case 111: // Wait
                break;
            case 112: // Obt loadout
                if (this.ambrosia_obt) {
                    await this.setAmbrosiaLoadout(this.ambrosia_obt);
                }
                break;
            case 113: // Off loadout
                if (this.ambrosia_off) {
                    await this.setAmbrosiaLoadout(this.ambrosia_off);
                }
                break;
            case 114: // Ambrosia loadout
                if (this.ambrosia_ambrosia) {
                    await this.setAmbrosiaLoadout(this.ambrosia_ambrosia);
                }
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
        if (tries < 10) HSLogger.debug(`Corruptions: ${this.stringifyCorruptions(corruptions)} set`, this.context)
    }

    private stopAutosing() {
        this.autosingEnabled = false;
        this.unsubscribeGameDataChanges();
        const singSetting = HSSettings.getSetting("startAutosing");
        singSetting.disable();
        if (this.timerModal) {
            this.timerModal.hide();
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
            }, 2000);
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

        if (!exalt2Btn) {
            HSLogger.debug("Error: Exalt 2 button not found", this.context);
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

            // Safety timeout extended slightly to 3s to account for game lag
            setTimeout(() => {
                observer.disconnect();
                resolve();
            }, 3000);
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
        const gq = await this.getCurrentGoldenQuarks();
        const q = await this.getCurrentQuarks();
        if (this.timerModal) {
            this.timerModal.recordSingularity(q, gq);
        }
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
        await this.buyCoin();
        HSLogger.debug("Singularity performed", this.context);
        let stage = await this.getStage();
        while (!Object.values(ALLOWED).some(phase => stage.includes(phase))) {
            await HSUtils.sleep(5);
            stage = await this.getStage();
        }
        return Promise.resolve()
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
        let startTime = performance.now();
        while (!this.isInChallenge(challengeIndex) && performance.now() - startTime < maxTime) {
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
            await HSUtils.sleep(20);
        }
        startTime = performance.now();

        if (!this.isInChallenge(challengeIndex)) {
            HSLogger.debug(
                `Timeout: Failed to enter challenge ${challengeIndex}`,
                this.context
            );
            return Promise.resolve();
        }

        this.markChallengeUnlocked(challengeIndex);

        while (performance.now() - startTime < maxTime) {
            if (!this.isAutosingEnabled()) {
                this.stopAutosing();
                return Promise.resolve();
            }

            const currentCompletions = this.getChallengeCompletions(challengeIndex);
            const maxPossible = this.getChallengeGoal(challengeIndex);

            if (currentCompletions >= maxPossible || currentCompletions >= minCompletions) {
                // Special handling for C10 when C11-14 are active
                if (challengeIndex === 10) {
                    const activeC11to14 = this.getActiveC11to14Challenge();
                    if (activeC11to14 !== null) {
                        // We're in C10 with enough completions to leave and in a C11-14 challenge
                        // Wait for the C11-14 challenge to also complete
                        const c11to14MaxPossible = this.getChallengeGoal(activeC11to14);
                        let c11to14CurrentCompletions = this.getChallengeCompletions(activeC11to14);

                        while (true) {
                            await HSUtils.sleep(10);
                            const c11to14CurrentCompletions2 = this.getChallengeCompletions(activeC11to14);
                            if (c11to14CurrentCompletions2 == c11to14CurrentCompletions) {
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

        await this.setCorruptions(ZERO_CORRUPTIONS);

        for (let c = 11; c <= target; c++) {
            const reqs = prerequisites[c];
            if (!reqs) continue;

            for (const req of reqs) {
                HSLogger.debug(`Running prerequisite c${req} for c${c}`, this.context);
                if (req === 10) {
                    await this.waitForCompletion(req, 1, 60000, 500);
                } else {
                    await this.waitForCompletion(req, 0, 60000, 0);
                }

            }
        }
    }

    async waitForSingularityActivation() {
        return new Promise(resolve => {
            const btn = document.querySelector('#singularitybtn');
            if (!btn) {
                resolve(false);
                return;
            }

            const isEnabled = () => {
                const filter = getComputedStyle(btn).getPropertyValue('filter');
                return !filter || filter === 'none';
            };

            let sawDisabled = !isEnabled(); // require a real transition

            const observer = new MutationObserver(() => {
                if (!this.isAutosingEnabled()) {
                    observer.disconnect();
                    resolve(false);
                    return;
                }

                const enabled = isEnabled();

                if (!enabled) {
                    sawDisabled = true;
                    return;
                }

                if (sawDisabled && enabled) {
                    observer.disconnect();
                    HSLogger.debug('Singularity button ACTIVATED!', this.context);
                    resolve(true);
                }
            });

            observer.observe(btn, {
                attributes: true,
                attributeFilter: ['style', 'class']
            });
        });
    }

}