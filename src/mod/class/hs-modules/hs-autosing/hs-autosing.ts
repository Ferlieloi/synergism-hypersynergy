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
import { HSAutosingStrategy, PhaseOption, phases, CorruptionLoadout, AutosingStrategyPhase } from "../../../types/module-types/hs-autosing-types";
import { HSElementHooker } from "../../hs-core/hs-elementhooker";

export class HSAutosing extends HSModule implements HSGameDataSubscriber {
    gameDataSubscriptionId?: string;

    private gameDataResolver?: (value: void) => void;

    private strategy?: HSAutosingStrategy;

    private autosingEnabled = false;
    private targetSingularity = 0;
    private sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
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
    private C11Unlocked = false;
    private C12Unlocked = false;
    private C13Unlocked = false;
    private C14Unlocked = false;
    private C15Unlocked = false;


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

        if (!this.buildingsTab || !this.challengeTab || !this.settingsTab || !this.singularityTab || !this.challengeButtons || !this.exitAscBtn || !this.exitReincBtn) {
            this.showError("Error during autosing initialization: could not find main tabs");
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
        const singularitySetting = HSSettings.getSetting('singularityNumber') as HSNumericSetting;
        this.targetSingularity = singularitySetting.getValue();
        this.subscribeGameDataChanges();


        new Promise<void>(resolve => {
            this.gameDataResolver = resolve;
        })


        const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        if (!gameDataAPI) {
            this.showError("Could not find HSGameDataAPI module");
            this.stopAutosing();
            return Promise.resolve();
        }

        const gameData = gameDataAPI.getGameData();
        if (!gameData) {
            this.showError("Could not get game data");
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
            await this.setElevator();
            let sing = 0;

            while (this.isAutosingEnabled()) {
                HSLogger.debug("clicking singularity button", this.context);

                await this.click(this.ambrosia_quark);
                await this.click(this.ascendBtn);
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
                    await this.sleep(this.sleepTime);
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

                sing += 1;
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.showError(`Error during autosing logic: ${errorMessage}`);
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
        const el = document.getElementById(`challenge${challengeIndex}`);
        return !!el?.classList.contains('challengeActive');
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
                console.log(`Invalid stage format ${stage}`);
                return;
            }

            const stageStartIndex: number = this.getPhaseIndex(stageStart);
            const stageEndIndex: number = this.getPhaseIndex(stageEnd);

            if (stageStartIndex === -1 || stageEndIndex === -1) {
                console.log(`Unknown stage ${stage}`);
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
                console.log(`No strategy phase matched for stage ${stage}`);
                return;
            }
        }

        await this.executePhase(phaseConfig);
    }

    private isPhaseOption(value: string): value is PhaseOption {
        return (phases as readonly string[]).includes(value);
    }

    private async executePhase(phaseConfig: AutosingStrategyPhase): Promise<void> {
        await this.setCorruptions(phaseConfig.corruptions);

        this.challengeTab.click();

        for (const challenge of phaseConfig.strat) {
            // Special actions (100+)
            if (challenge.challengeNumber >= 100) {
                HSLogger.debug(`Autosing: Perorming special action: ${challenge.challengeNumber}`, this.context);
                await this.performSpecialAction(challenge.challengeNumber);
                continue;
            }

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
            await this.sleep(this.sleepTime);
        }
    }

    private async performSpecialAction(actionId: number): Promise<void> {
        switch (actionId) {
            case 101: // Exit Transcension challenge
                await this.click(this.exitTranscBtn);
                break;
            case 102: // Exit Reincarnation challenge
                await this.click(this.exitReincBtn);
                break;
            case 103: // Exit Ascension challenge
                await this.click(this.exitAscBtn);
                break;
            case 104: // Ascend
                await this.click(this.ascendBtn);
                break;
            case 105: // Early Cube
                if (this.ambrosia_early_cube) {
                    await this.click(this.ambrosia_early_cube);
                    await this.clickOkayAlert();
                }
                break;
            case 106: // Late Cube
                if (this.ambrosia_late_cube) {
                    await this.click(this.ambrosia_late_cube);
                    await this.clickOkayAlert();
                }
                break;
            case 107: // Quark
                if (this.ambrosia_quark) {
                    await this.click(this.ambrosia_quark);
                    await this.clickOkayAlert();
                }
                break;
            default:
                HSLogger.log(`Unknown special action ${actionId}`, this.context);
        }
    }

    private async setCorruptions(corruptions: CorruptionLoadout): Promise<void> {
        this.corruptionsTab.click();
        const corrLoadoutsBtn = document.getElementById('corrLoadoutsBtn') as HTMLButtonElement;

        if (!corrLoadoutsBtn) {
            this.showError("Error: could not access corruptions loadout button");
            return Promise.resolve();
        }
        corrLoadoutsBtn.click();

        const importBtn = document.querySelector('#corruptionLoadoutTable button.corrImport') as HTMLButtonElement;
        if (!importBtn) {
            this.showError("Error: could not access corruption import button");
            return Promise.resolve();
        }
        importBtn.click();

        const corruptionsInput = document.getElementById('prompt_text') as HTMLInputElement;
        if (!corruptionsInput) {
            this.showError("Error: could not access prompt input");
            return Promise.resolve();
        }

        const loadoutJson = {
            viscosity: corruptions.viscosity,
            drought: corruptions.drought,
            deflation: corruptions.deflation,
            extinction: corruptions.extinction,
            illiteracy: corruptions.illiteracy,
            recession: corruptions.recession,
            dilation: corruptions.dilation,
            hyperchallenged: corruptions.hyperchallenged
        };

        corruptionsInput.value = JSON.stringify(loadoutJson);

        const okayBtn = document.getElementById('ok_prompt') as HTMLButtonElement;
        if (!okayBtn) {
            this.showError("Error: could not access prompt OK button");
            return Promise.resolve();
        }

        await this.click(okayBtn);
        await this.click(this.ascendBtn);
    }

    private stopAutosing() {
        this.autosingEnabled = false;
        this.unsubscribeGameDataChanges();
        const singSetting = HSSettings.getSetting("startAutosing");
        singSetting.disable();
    }

    private async getStage(): Promise<string> {
        await this.click(this.settingsTab);
        const settingsSubTab = document.getElementById('switchSettingSubTab4') as HTMLButtonElement;
        if (!settingsSubTab) {
            this.showError("Error during autosing logic: could not access settings to read stage");
            this.stopAutosing();
        }
        settingsSubTab.click();
        const misc = document.getElementById('kMisc') as HTMLButtonElement;
        if (!misc) {
            this.showError("Error during autosing logic: could not access settings to read stage");
            this.stopAutosing();
        }
        misc.click();
        const stage = await this.waitForElement('gameStageStatistic');
        if (!stage) {
            this.showError("Error during autosing logic: could not access settings to read stage");
            this.stopAutosing();
        }
        await this.waitForInnerText(stage, t => /Current Game Section:/.test(t));
        const regex = new RegExp('Current Game Section: (.*)');
        const match = stage.innerText.match(regex);

        if (!match) {
            console.error("Could not find game stage");
            return "";
        }
        return match[1].trim();
    }

    private async waitForElement(id: string): Promise<HTMLElement> {
        return new Promise(resolve => {
            const existing = document.getElementById(id);
            if (existing) return resolve(existing);

            const observer = new MutationObserver(() => {
                const el = document.getElementById(id);
                if (el) {
                    observer.disconnect();
                    resolve(el);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }

    private async waitForInnerText(
        el: HTMLElement,
        predicate: (text: string) => boolean = t => t.trim().length > 0
    ): Promise<void> {
        if (predicate(el.innerText)) return;

        return new Promise(resolve => {
            const observer = new MutationObserver(() => {
                if (predicate(el.innerText)) {
                    observer.disconnect();
                    resolve();
                }
            });

            observer.observe(el, {
                childList: true,
                characterData: true,
                subtree: true
            });
        });
    }

    private async setElevator(): Promise<void> {
        // Navigate to singularity tab
        this.singularityTab.click();
        // Set elevator target input
        const elevatorInput = document.getElementById('elevatorTargetInput') as HTMLInputElement;
        if (!elevatorInput) {
            this.showError("Error during autosing logic: elevator input not found");
            this.stopAutosing();
        }
        elevatorInput.value = this.targetSingularity.toString();
        // Trigger input event to update the game state
        elevatorInput.dispatchEvent(new Event('input', { bubbles: true }));
        // Lock elevator and confirm teleport
        const checkbox = document.getElementById('elevatorLockToggle') as HTMLInputElement;
        if (!checkbox) {
            this.showError("Error during autosing logic: elevator checkbox not found");
            this.stopAutosing();
        }
        checkbox.checked = true;
        return Promise.resolve();
    }

    private async clickOkayAlert(): Promise<void> {
        const okay = document.getElementById('ok_alert') as HTMLButtonElement;
        if (okay) {
            await this.click(okay);
        }
        return Promise.resolve();
    }

    private async clickOkayConfirm(): Promise<void> {
        const okay = document.getElementById('ok_confirm') as HTMLButtonElement;
        if (okay) {
            await this.click(okay);
        }
        return Promise.resolve();
    }

    private async performSingularity(): Promise<void> {
        const singularityButton = document.getElementById('singularitybtn') as HTMLButtonElement;
        if (!singularityButton) {
            this.showError("Error during autosing logic: singularity button not found");
            this.stopAutosing();
        }
        await this.click(singularityButton);

        await this.clickOkayConfirm();
        await this.clickOkayAlert();

        const buildings_tab = document.getElementById('buildingstab') as HTMLButtonElement;
        if (!buildings_tab) {
            this.showError("Error during autosing logic: buildings tab button not found");
            this.stopAutosing();
        }
        this.buildingsTab.click();

        const coin = document.getElementById('buycoin1') as HTMLButtonElement;
        if (!coin) {
            this.showError("Error during autosing logic: coin button not found");
            this.stopAutosing();
        }
        HSLogger.debug("Buying first coin building: ", this.context);
        await this.click(coin);
        await this.sleep(this.sleepTime);

        this.C11Unlocked = false;
        this.C12Unlocked = false;
        this.C13Unlocked = false;
        this.C14Unlocked = false;
        this.C15Unlocked = false;

        return Promise.resolve();
    }

    private async waitForCompletion(
        challengeIndex: number,
        minCompletions: number,
        maxTime: number = 99999999,
        waitTime: number = 0
    ): Promise<void> {
        const sleepInterval = 10; // Fixed sleep interval inside function
        let totalTimeElapsed = 0;

        const completionsEl = document.getElementById(`challenge${challengeIndex}level`) as HTMLParagraphElement | null;
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

            await this.DblClick(challengeBtn);
            await this.sleep(100); // debounce double-clicks
            totalTimeElapsed += 100;
        }

        if (!this.isInChallenge(challengeIndex)) {
            HSLogger.debug(
                `Timeout: Failed to enter challenge ${challengeIndex}`,
                this.context
            );
            return Promise.resolve();
        }

        while (totalTimeElapsed < maxTime) {
            if (!this.isAutosingEnabled()) {
                this.stopAutosing();
                return Promise.resolve();
            }

            const currentCompletions = completionsEl ? this.parseNumber(completionsEl.innerText) : 0;

            if (currentCompletions >= minCompletions) {
                this.markChallengeUnlocked(challengeIndex);
                if (waitTime > 0) {
                    await this.sleep(waitTime);
                }
                return Promise.resolve();
            }

            await this.sleep(sleepInterval);
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

    showError(message: string) {
        HSLogger.log(message, this.context);
        HSUI.Notify('Failed to acquire game data for heater export', {
            position: 'top',
            notificationType: "error"
        });
    }

    private async click(button: HTMLButtonElement): Promise<void> {
        button.click();
        await this.sleep(this.sleepTime);
        return Promise.resolve();
    }

    async DblClick(element: HTMLElement): Promise<void> {
        element.click();
        await new Promise(res => setTimeout(res, 5));
        element.click();
        await this.sleep(this.sleepTime);
        element.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        return Promise.resolve();
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
            11: [10, 104],
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
            hyperchallenged: 0,
        };

        await this.setCorruptions(ZERO_CORRUPTIONS);

        for (let c = 11; c <= target; c++) {
            const reqs = prerequisites[c];
            if (!reqs) continue;

            for (const req of reqs) {
                HSLogger.debug(`Running prerequisite c${req} for c${c}`, this.context);
                await this.waitForCompletion(req, 1, 60000, 500);
                await this.sleep(this.sleepTime);
            }
        }
    }
}