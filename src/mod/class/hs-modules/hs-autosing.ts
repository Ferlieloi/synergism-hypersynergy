import { HSGameDataSubscriber, HSModuleOptions } from "../../types/hs-types";
import { HSGameData } from "../hs-core/gds/hs-gamedata";
import { HSModuleManager } from "../hs-core/module/hs-module-manager";
import { HSGameDataAPI } from "../hs-core/gds/hs-gamedata-api";
import { HSUtils } from "../hs-utils/hs-utils";
import { HSModule } from "../hs-core/module/hs-module";

export class HSAutosing extends HSModule implements HSGameDataSubscriber {
    gameDataSubscriptionId?: string;

    private autosingEnabled = false;
    private autosingRunning = false;
    private targetSingularity = 0;
    private sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    private sleepTime = 20;

    init(): Promise<void> {
        this.autosingEnabled = false;
        this.autosingRunning = false;
        this.targetSingularity = 0;

        console.log("HSAutosing module initialized");
        return Promise.resolve();
    }

    subscribeGameDataChanges() {
        const gameDataMod = HSModuleManager.getModule<HSGameData>('HSGameData');

        if (gameDataMod && !this.gameDataSubscriptionId) {
            this.gameDataSubscriptionId = gameDataMod.subscribeGameDataChange(this.gameDataCallback.bind(this));
            console.log('Subscribed to game data changes for autosing');
        }
    }

    unsubscribeGameDataChanges() {
        const gameDataMod = HSModuleManager.getModule<HSGameData>('HSGameData');

        if (gameDataMod && this.gameDataSubscriptionId) {
            gameDataMod.unsubscribeGameDataChange(this.gameDataSubscriptionId);
            this.gameDataSubscriptionId = undefined;
            console.log('Unsubscribed from game data changes for autosing');
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

        console.log(
            `Autosing ${this.autosingEnabled ? "enabled" : "disabled"} for target singularity: ${targetSingularity}`
        );
    }

    private async performAutosingLogic() {
        try {
            const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');

            if (!gameDataAPI) {
                console.error("Could not find HSGameDataAPI module");
                this.stopAutosing()
                return;
            }

            const gameData = gameDataAPI.getGameData();

            if (!gameData) {
                console.error("Could not get game data");
                this.stopAutosing()
                return;
            }

            // Check if target singularity is valid
            if (this.targetSingularity > gameData.highestSingularityCount) {
                console.warn(`Target singularity ${this.targetSingularity} is greater than highest reached ${gameData.highestSingularityCount}`);
                this.stopAutosing()
                return;
            }

            console.log(`Performing autosing logic: current=${gameData.singularityCount}, target=${this.targetSingularity}`);

            // Use hidden actions to set the elevator target and toggle lock without opening UI

            // Navigate to singularity tab
            const singularityTab = document.getElementById('singularitytab') as HTMLElement;
            if (!singularityTab) {
                console.error("Error during autosing logic: singularity tab not found");
                this.stopAutosing()
            }
            singularityTab.click();

            // Set elevator target input
            const elevatorInput = document.getElementById('elevatorTargetInput') as HTMLInputElement;
            if (!elevatorInput) {
                console.error("Error during autosing logic: elevator input not found");
                this.stopAutosing()
            }
            elevatorInput.value = this.targetSingularity.toString();
            // Trigger input event to update the game state
            elevatorInput.dispatchEvent(new Event('input', { bubbles: true }));

            const checkbox = document.getElementById('elevatorLockToggle') as HTMLInputElement;
            if (!checkbox) {
                console.error("Error during autosing logic: elevator checkbox not found");
                this.stopAutosing()
            }
            checkbox.checked = true;

            const elevatorButton = document.getElementById('elevatorTeleportButton') as HTMLButtonElement;
            if (!elevatorButton) {
                console.error("Error during autosing logic: elevator button not found");
                this.stopAutosing()
            }
            elevatorButton.click();
            const okay = document.getElementById('ok_confirm') as HTMLButtonElement;
            if (!okay) {
                console.error("Error during autosing logic: okay button not found");
                this.stopAutosing()
            }
            okay.click();
            await this.sleep(10);
            const okay2 = document.getElementById('ok_confirm') as HTMLButtonElement;
            if (okay2) {
                okay2.click();
                await this.sleep(10);
            }

            const okay3 = document.getElementById('ok_alert') as HTMLButtonElement;
            if (!okay3) {
                console.error("Error during autosing logic: okay2 button not found");
                this.stopAutosing()

            }
            okay3.click();
            await this.sleep(10);
            const okay4 = document.getElementById('ok_alert') as HTMLButtonElement;
            if (okay4) {
                okay4.click();
                await this.sleep(10);
            }
            // START OF SINGULARITY
            const ambrosia_early_cube = document.getElementById('hs-ambrosia-quickbar-blueberryLoadout4') as HTMLButtonElement;
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
            if (!c5 || !c6 || !c7 || !c8 || !c9 || !c10 || !c11 || !c12 || !c13 || !c14 || !c15 || !coin || !exitBtn || !ambrosia_early_cube || !ambrosia_late_cube || !ambrosia_quark || !buildings_tab || !challenge_tab) {
                console.error("Error during autosing logic: a button not found at the start of singularity");
                this.stopAutosing()
            }
            ambrosia_early_cube.click();
            buildings_tab.click();
            await this.sleep(10);
            coin.click();
            await this.sleep(100);
            challenge_tab.click();
            this.DblClick(c10);
            await this.waitForCompletion(10, 1);
            exitBtn.click();
            await this.sleep(this.sleepTime);
            this.DblClick(c11);
            this.DblClick(c10);
            await this.waitForCompletion(11, 0);
            exitBtn.click();
            await this.sleep(this.sleepTime);
            this.DblClick(c12);
            this.DblClick(c10);
            await this.waitForCompletion(12, 0);
            exitBtn.click();
            await this.sleep(this.sleepTime);
            this.DblClick(c13);
            this.DblClick(c10);
            await this.waitForCompletion(13, 0);
            exitBtn.click();
            await this.sleep(this.sleepTime);
            this.DblClick(c14);
            this.DblClick(c10);
            await this.waitForCompletion(14, 0);
            exitBtn.click();
            await this.sleep(this.sleepTime);
            this.DblClick(c15);
            await this.waitForCompletion(15, 0);
            exitBtn.click();

            this.stopAutosing()
            this.autosingRunning = false;

        } catch (error) {
            console.error("Error during autosing logic:", error);
            this.stopAutosing()
        }
    }
    private stopAutosing() {
        this.autosingEnabled = false;
        this.autosingRunning = false;
        this.unsubscribeGameDataChanges();
    }

    private async waitForCompletion(challengeIndex: number, minCompletions: number) {
        let attempts = 0;
        let previousCompletions = -1;
        const maxAttempts = 10000; //100 seconds max
        const completions = document.getElementById(`challenge${challengeIndex}level`);
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

    async DblClick(element: HTMLElement) {
        element.click();
        // Wait 50ms to simulate human speed
        await new Promise(res => setTimeout(res, 5));
        element.click();
        this.sleep(20);

        // Then fire the dblclick event just in case
        element.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
    }

    private parseNumber(text: string): number {
        let cleanText = text.replace(/,/g, '').trim();
        if (cleanText.includes('/')) {
            cleanText = cleanText.split('/')[0];
        }
        const result = Number(cleanText);
        return isNaN(result) ? 0 : result;
    }

    isAutosingEnabled(): boolean {
        return this.autosingEnabled;
    }
}