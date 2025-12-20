import { HSGameDataSubscriber, HSModuleOptions } from "../../types/hs-types";
import { HSGameData } from "../hs-core/gds/hs-gamedata";
import { HSModuleManager } from "../hs-core/module/hs-module-manager";
import { HSGameDataAPI } from "../hs-core/gds/hs-gamedata-api";
import { HSUtils } from "../hs-utils/hs-utils";
import { HSModule } from "../hs-core/module/hs-module";
import { HSLogger } from "../hs-core/hs-logger";
import { HSUI } from "../hs-core/hs-ui";

export class HSAutosing extends HSModule implements HSGameDataSubscriber {
    gameDataSubscriptionId?: string;

    private autosingEnabled = false;
    private autosingRunning = false;
    private targetSingularity = 0;
    private sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    private sleepTime = 20;

    init(): Promise<void> {
        HSLogger.log(`Initializing HSAutosing module`, this.context);

        this.autosingEnabled = false;
        this.autosingRunning = false;
        this.targetSingularity = 0;

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

    async gameDataCallback() {
        if (this.autosingEnabled && !this.autosingRunning) {
            this.autosingRunning = true;
            await this.performAutosingLogic();
        }
    }

    async toggleAutosing(targetSingularity: number) {
        this.autosingEnabled = !this.autosingEnabled;
        this.targetSingularity = targetSingularity;

        if (this.autosingEnabled) {
            this.subscribeGameDataChanges();
        } else {
            this.stopAutosing();
        }

        HSLogger.log(`Autosing ${this.autosingEnabled ? "enabled" : "disabled"} for target singularity: ${targetSingularity}`, this.context);
    }

    private async performAutosingLogic() {

        // START OF Autosinging Logic
        const ambrosia_late_cube = document.getElementById('hs-ambrosia-quickbar-blueberryLoadout2') as HTMLButtonElement;
        const ambrosia_quark = document.getElementById('hs-ambrosia-quickbar-blueberryLoadout1') as HTMLButtonElement;
        const buildings_tab = document.getElementById('buildingstab') as HTMLButtonElement;
        const challenge_tab = document.getElementById('challengetab') as HTMLButtonElement;
        const coin = document.getElementById('buycoin1') as HTMLButtonElement;
        const c5 = document.getElementById('challenge5') as HTMLButtonElement;
        const c6 = document.getElementById('challenge6') as HTMLButtonElement;
        const c7 = document.getElementById('challenge7') as HTMLButtonElement;
        const c8 = document.getElementById('challenge8') as HTMLButtonElement;
        const c9 = document.getElementById('challenge9') as HTMLButtonElement;
        const c10 = document.getElementById('challenge10') as HTMLButtonElement;
        const c11 = document.getElementById('challenge11') as HTMLButtonElement;
        const c12 = document.getElementById('challenge12') as HTMLButtonElement;
        const c13 = document.getElementById('challenge13') as HTMLButtonElement;
        const c14 = document.getElementById('challenge14') as HTMLButtonElement;
        const c15 = document.getElementById('challenge15') as HTMLButtonElement;
        const exitBtn = document.getElementById('ascendChallengeBtn') as HTMLButtonElement;

        if (!c5 || !c6 || !c7 || !c8 || !c9 || !c10 || !c11 || !c12 || !c13 || !c14 || !c15 || !coin || !exitBtn || !ambrosia_late_cube || !ambrosia_quark || !buildings_tab || !challenge_tab) {
            console.error("Error during autosing logic: a button not found at the start of singularity");
            this.stopAutosing()
        }

        try {
            const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');

            if (!gameDataAPI) {
                this.showError("Could not find HSGameDataAPI module");
                this.stopAutosing()
                return;
            }

            const gameData = gameDataAPI.getGameData();

            if (!gameData) {
                this.showError("Could not get game data");
                this.stopAutosing()
                return;
            }

            // Check if target singularity is valid
            if (this.targetSingularity > gameData.highestSingularityCount) {
                this.showError(`Target singularity ${this.targetSingularity} is greater than highest reached ${gameData.highestSingularityCount}`);
                this.stopAutosing()
                return;
            }

            HSLogger.log(`Performing autosing logic: current=${gameData.singularityCount}, target=${this.targetSingularity}`, this.context);

            await this.setElevator();
            await this.performSingularity();

            while (this.isAutosingEnabled) {
                let stage = this.getStage();
                this.runStage(stage);
                console.log(`Completed stage: ${stage}`);
                this.sleep(this.sleepTime * 10);
            }

            this.stopAutosing()
            this.autosingRunning = false;

        } catch (error) {
            this.showError("Error during autosing logic:");
            this.stopAutosing()
        }
    }

    private async runStage(stage: string | null) {
        switch (stage) {
            case "sacrifice-ascension":
                await this.preC14();
            case "challenge14-w5x10max":
                await this.c14_w5x10();
            case "alpha-p2x1x10":
                await this.w5x10_p3x1();
            case "p2x1x10-p3x1":
                await this.w5x10_p3x1();
            case "p3x1-beta":
                await this.p3x1_p3x5();
            case "beta-1e15-expo":
                await this.p3x1_p3x5();
            case "1e15-expo-omega":
                await this.p3x1_p3x5();
            case "omega-singularity":
                await this.p3x5_antiquities();
            default:
                await this.antiquities_singularity();
        }
    }

    private async preC14() {
        const corruptions = [0, 0, 0, 0, 0, 0, 0, 0] as number[];

        const c8 = document.getElementById('challenge8') as HTMLButtonElement;
        const c9 = document.getElementById('challenge9') as HTMLButtonElement;
        const c10 = document.getElementById('challenge10') as HTMLButtonElement;
        const c11 = document.getElementById('challenge11') as HTMLButtonElement;
        const c12 = document.getElementById('challenge12') as HTMLButtonElement;
        const c13 = document.getElementById('challenge13') as HTMLButtonElement;
        const c14 = document.getElementById('challenge14') as HTMLButtonElement;
        const exitBtn = document.getElementById('ascendChallengeBtn') as HTMLButtonElement;
        const challenge_tab = document.getElementById('challengetab') as HTMLButtonElement;

        if (!c8 || !c9 || !c10 || !c11 || !c12 || !c13 || !c14 || !exitBtn || !challenge_tab) {
            console.error("Error during autosing logic: a button not found at pre c14");
            this.stopAutosing()
        }
        challenge_tab.click();
        this.DblClick(c10);
        await this.waitForCompletion(10, 1);
        exitBtn.click();
        this.DblClick(c11);
        this.DblClick(c10);
        await this.waitForCompletion(11, 0);
        exitBtn.click();
        this.DblClick(c12);
        this.DblClick(c10);
        await this.waitForCompletion(12, 0);
        exitBtn.click();
        this.DblClick(c13);
        this.DblClick(c10);
        await this.waitForCompletion(13, 0);
        exitBtn.click();
        this.DblClick(c14);
        this.DblClick(c10);
        await this.waitForCompletion(14, 0);
        exitBtn.click();
        console.log("Completed pre c14 challenges");
    }

    private setCorruptions(corruptions: number[]) {
    }

    private async c14_w5x10() {
        const corruptions = [0, 4, 1, 0, 4, 11, 6, 14] as number[];
    }

    private async w5x10_p3x1() {
        const corruptions = [3, 7, 7, 16, 4, 12, 16, 16] as number[];
    }

    private async p3x1_p3x5() {
        const corruptions = [6, 11, 10, 16, 16, 13, 16, 16] as number[];
    }

    private async p3x5_antiquities() {
        const corruptions = [10, 6, 7, 16, 16, 16, 16, 15] as number[];
    }

    private async antiquities_singularity() {
        const corruptions = [16, 16, 16, 16, 16, 16, 16, 16] as number[];
    }

    private stopAutosing() {
        this.autosingEnabled = false;
        this.autosingRunning = false;
        this.unsubscribeGameDataChanges();
    }

    private getStage() {
        const stage = document.getElementById('gameStageStatistic') as HTMLParagraphElement;
        if (!stage) {
            this.showError("Error during autosing logic: could not access settings to read stage");
            this.stopAutosing()
        }
        const regex = new RegExp('Current Game Stage: (.*)');
        const match = stage.innerText.match(regex);

        if (!match) {
            console.error("Could not find game stage");
            return null;
        }
        return match[1].trim()
    }

    private async setElevator() {
        // Navigate to singularity tab
        const singularityTab = document.getElementById('singularitytab') as HTMLElement;
        if (!singularityTab) {
            this.showError("Error during autosing logic: singularity tab not found");
            this.stopAutosing()
        }
        singularityTab.click();

        // Set elevator target input
        const elevatorInput = document.getElementById('elevatorTargetInput') as HTMLInputElement;
        if (!elevatorInput) {
            this.showError("Error during autosing logic: elevator input not found");
            this.stopAutosing()
        }
        elevatorInput.value = this.targetSingularity.toString();
        // Trigger input event to update the game state
        elevatorInput.dispatchEvent(new Event('input', { bubbles: true }));
        // Lock elevator and confirm teleport
        const checkbox = document.getElementById('elevatorLockToggle') as HTMLInputElement;
        if (!checkbox) {
            this.showError("Error during autosing logic: elevator checkbox not found");
            this.stopAutosing()
        }
        checkbox.checked = true;

        const challengeTab = document.getElementById('challengetab') as HTMLButtonElement;
        if (!challengeTab) {
            this.showError("Error during autosing logic: challenge tab not found");
            this.stopAutosing()
        }
        challengeTab.click();
    }

    private async performSingularity() {
        const singularityButton = document.getElementById('singularitybtn') as HTMLButtonElement
        if (!singularityButton) {
            this.showError("Error during autosing logic: singularity button not found");
            this.stopAutosing()
        }
        this.click(singularityButton);
        const okay = document.getElementById('ok_confirm') as HTMLButtonElement;
        if (!okay) {
            this.showError("Error during autosing logic: okay button not found");
            this.stopAutosing()
        }
        this.click(okay);
        await this.sleep(this.sleepTime);
        const okay2 = document.getElementById('ok_confirm') as HTMLButtonElement;
        if (!okay2) {
            this.showError("Error during autosing logic: okay button not found");
            this.stopAutosing()
        }
        this.click(okay2);

        const ambrosia_early_cube = document.getElementById('hs-ambrosia-quickbar-blueberryLoadout4') as HTMLButtonElement;
        if (!ambrosia_early_cube) {
            this.showError("Error during autosing logic: ambrosia early cube button not found");
        } else {
            ambrosia_early_cube.click();
        }

    }

    private async waitForCompletion(challengeIndex: number, minCompletions: number) {
        let attempts = 0;
        let previousCompletions = -1;
        const maxAttempts = 10000; //100 seconds max
        const completions = document.getElementById(`challenge${challengeIndex}level`) as HTMLParagraphElement;
        while (attempts < maxAttempts) {
            const completionsNumber = completions ? this.parseNumber(completions.innerText) : 0;
            if (minCompletions == 0) {
                if (previousCompletions == completionsNumber && completionsNumber > 0) {
                    return;
                }
                await this.sleep(this.sleepTime * 2);
                previousCompletions = completionsNumber;
            } else {
                if (completionsNumber >= minCompletions) {
                    await this.sleep(this.sleepTime);
                    return;
                }
            }
            await this.sleep(50);
            attempts++;

        }
        console.error(`Timeout waiting for challenge ${challengeIndex} to reach ${minCompletions} completions`);
        this.stopAutosing();
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

    private async click(button: HTMLButtonElement) {
        button.click()
        await this.sleep(this.sleepTime)
    }

    async DblClick(element: HTMLElement) {
        element.click();
        // Wait 50ms to simulate human speed
        await new Promise(res => setTimeout(res, 5));
        element.click();
        this.sleep(this.sleepTime);

        // Then fire the dblclick event just in case
        element.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    }
}