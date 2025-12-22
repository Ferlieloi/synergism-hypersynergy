import { HSGameDataSubscriber, HSModuleOptions } from "../../types/hs-types";
import { HSGameData } from "../hs-core/gds/hs-gamedata";
import { HSModuleManager } from "../hs-core/module/hs-module-manager";
import { HSGameDataAPI } from "../hs-core/gds/hs-gamedata-api";
import { HSUtils } from "../hs-utils/hs-utils";
import { HSModule } from "../hs-core/module/hs-module";
import { HSLogger } from "../hs-core/hs-logger";
import { HSUI } from "../hs-core/hs-ui";
import { PlayerData } from "../../types/data-types/hs-player-savedata";

export class HSAutosing extends HSModule implements HSGameDataSubscriber {
    gameDataSubscriptionId?: string;

    private autosingEnabled = false;
    private targetSingularity = 0;
    private sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
    private sleepTime = 20;
    private buildingsTab!: HTMLButtonElement;
    private challengeTab!: HTMLButtonElement;
    private runesTab!: HTMLButtonElement;
    private corruptionsTab!: HTMLButtonElement;
    private settingsTab!: HTMLButtonElement;
    private singularityTab!: HTMLButtonElement;
    private c5!: HTMLButtonElement;
    private c6!: HTMLButtonElement;
    private c7!: HTMLButtonElement;
    private c8!: HTMLButtonElement;
    private c9!: HTMLButtonElement;
    private c10!: HTMLButtonElement;
    private c11!: HTMLButtonElement;
    private c12!: HTMLButtonElement;
    private c13!: HTMLButtonElement;
    private c14!: HTMLButtonElement;
    private c15!: HTMLButtonElement;
    private exitReincBtn!: HTMLButtonElement;
    private exitAscBtn!: HTMLButtonElement;
    private ascendBtn!: HTMLButtonElement;

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
        this.c5 = document.getElementById('challenge5') as HTMLButtonElement;
        this.c6 = document.getElementById('challenge6') as HTMLButtonElement;
        this.c7 = document.getElementById('challenge7') as HTMLButtonElement;
        this.c8 = document.getElementById('challenge8') as HTMLButtonElement;
        this.c9 = document.getElementById('challenge9') as HTMLButtonElement;
        this.c10 = document.getElementById('challenge10') as HTMLButtonElement;
        this.c11 = document.getElementById('challenge11') as HTMLButtonElement;
        this.c12 = document.getElementById('challenge12') as HTMLButtonElement;
        this.c13 = document.getElementById('challenge13') as HTMLButtonElement;
        this.c14 = document.getElementById('challenge14') as HTMLButtonElement;
        this.c15 = document.getElementById('challenge15') as HTMLButtonElement;
        this.exitReincBtn = document.getElementById('reincarnatechallengebtn') as HTMLButtonElement;
        this.exitAscBtn = document.getElementById('ascendChallengeBtn') as HTMLButtonElement;
        this.ascendBtn = document.getElementById('ascendbtn') as HTMLButtonElement;

        if (!this.buildingsTab || !this.challengeTab || !this.settingsTab || !this.singularityTab || !this.c5 || !this.c6 || !this.c7 || !this.c8 || !this.c9 || !this.c10 || !this.c11 || !this.c12 || !this.c13 || !this.c14 || !this.c15 || !this.exitAscBtn || !this.exitReincBtn) {
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
        return Promise.resolve();
    }

    async toggleAutosing(targetSingularity: number): Promise<void> {
        this.autosingEnabled = !this.autosingEnabled;
        this.targetSingularity = targetSingularity;

        if (this.autosingEnabled) {
            this.subscribeGameDataChanges();
            this.performAutosingLogic();
        } else {
            this.stopAutosing();
        }

        HSLogger.log(`Autosing ${this.autosingEnabled ? "enabled" : "disabled"} for target singularity: ${targetSingularity}`, this.context);
        return Promise.resolve();
    }

    private async performAutosingLogic(): Promise<void> {
        // START OF Autosinging Logic
        const ambrosia_late_cube = document.getElementById('hs-ambrosia-quickbar-blueberryLoadout2') as HTMLButtonElement;
        const ambrosia_quark = document.getElementById('hs-ambrosia-quickbar-blueberryLoadout1') as HTMLButtonElement;

        if (!ambrosia_late_cube || !ambrosia_quark) {
            console.error("Error during autosing logic: a button not found at the start of singularity");
            this.stopAutosing()
        }

        try {
            const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');

            if (!gameDataAPI) {
                this.showError("Could not find HSGameDataAPI module");
                this.stopAutosing()
                return Promise.resolve();
            }

            const gameData = gameDataAPI.getGameData();

            if (!gameData) {
                this.showError("Could not get game data");
                this.stopAutosing()
                return Promise.resolve();;
            }

            // Check if target singularity is valid
            if (this.targetSingularity > gameData.highestSingularityCount) {
                this.showError(`Target singularity ${this.targetSingularity} is greater than highest reached ${gameData.highestSingularityCount}`);
                this.stopAutosing()
                return Promise.resolve();;
            }

            HSLogger.log(`Performing autosing logic: current=${gameData.singularityCount}, target=${this.targetSingularity}`, this.context);

            await this.setElevator();
            await this.performSingularity();

            let loop = 0;

            while (this.isAutosingEnabled()) {
                let stage = await this.getStage();
                await this.runStage(stage);
                console.log(`Completed stage: ${stage}`);

                if (stage === "antiquities-singularity") {
                    console.log("STAGE BREAK")
                    break;
                }
                await this.sleep(this.sleepTime);
            }
            console.log("Antiquities reached, stopping autosing");

            this.stopAutosing()

        } catch (error) {
            this.showError("Error during autosing logic:");
            this.stopAutosing()
        }

        //this.performAutosingLogic();
        return Promise.resolve();;
    }

    private async haveAntiquities(): Promise<boolean> {
        await this.click(this.runesTab);
        const antiquitiesRuneLevel = document.getElementById('runeAntiquitiesLevel') as HTMLSpanElement;
        if (!antiquitiesRuneLevel) {
            this.showError("Error during autosing logic: could not access antiquities rune level");
        }
        const level = this.parseNumber(antiquitiesRuneLevel.innerText);
        return level > 0;
    }


    private async runStage(stage: string | null): Promise<void> {
        switch (stage) {
            case "start-prestige":
                await this.preC14();
                break;
            case "prestige-transcend":
                await this.preC14();
                break;
            case "transcend-reincarnate":
                await this.preC14();
                break;
            case "reincarnate-ant":
                await this.preC14();
                break;
            case "ant-sacrifice":
                await this.preC14();
                break;
            case "sacrifice-ascension":
                await this.preC14();
                break;
            case "ascension-challenge10":
                await this.preC14();
                break;
            case "challenge10-challenge11":
                await this.preC14();
                break;
            case "challenge11-challenge12":
                await this.preC14();
                break;
            case "challenge12-challenge13":
                await this.preC14();
                break;
            case "challenge13-challenge14":
                await this.preC14();
            case "challenge14-w5x10max":
                await this.preC14();
                break;
            case "w5x10max-alpha":
                await this.c14_w5x10();
                break;
            case "alpha-p2x1x10":
                await this.w5x10_p3x1();
                break;
            case "p2x1x10-p3x1":
                await this.w5x10_p3x1();
                break;
            case "p3x1-beta":
                await this.p3x1_p3x5();
                break;
            case "beta-1e15-expo":
                await this.p3x1_p3x5();
                break;
            case "1e15-expo-omega":
                await this.p3x1_p3x5();
                break;
            case "omega-singularity":
                await this.p3x5_antiquities();
                break;
            default:
                await this.p3x5_antiquities();
                break;
        }
        return Promise.resolve();
    }

    private async setCorruptions(corruptions: number[]): Promise<void> {
        this.corruptionsTab.click();
        const corrLoadoutsBtn = document.getElementById('corrLoadoutsBtn') as HTMLButtonElement;

        if (!corrLoadoutsBtn) {
            this.showError("Error during autosing logic: could not access corruptions to set loadout");
        }
        corrLoadoutsBtn.click();

        const importBtn = document.querySelector('#corruptionLoadoutTable button.corrImport') as HTMLButtonElement;

        if (!importBtn) {
            this.showError("Error during autosing logic: could not access corruptions to set loadout");
        }
        importBtn.click();

        const corruptionsInput = document.getElementById('prompt_text') as HTMLInputElement;

        if (!corruptionsInput) {
            this.showError("Error during autosing logic: could not access corruptions to set loadout");
        }
        corruptionsInput.value = corruptions.join('/');

        const okayBtn = document.getElementById('ok_prompt') as HTMLButtonElement;

        if (!okayBtn) {
            this.showError("Error during autosing logic: could not access corruptions to set loadout");
        }
        await this.click(okayBtn);
        await this.click(this.ascendBtn);
        return Promise.resolve();
    }

    private async c15Loop(): Promise<void> {
        this.challengeTab.click();

        const customSleepTime = 50
        const maxAttempts = 10;

        await this.DblClick(this.c15)
        await this.DblClick(this.c10)
        await this.waitForCompletion(10, 0);
        await this.waitForCompletion(15, 1e999, maxAttempts, customSleepTime);
        await this.click(this.ascendBtn);
        await this.click(this.exitAscBtn)

        return Promise.resolve();
    }

    private async preC14(): Promise<void> {
        const corruptions = [0, 0, 0, 0, 0, 0, 0, 0] as number[];
        await this.setCorruptions(corruptions);

        const customSleepTime = 10000
        const maxAttempts = 1000

        this.challengeTab.click();
        await this.DblClick(this.c6)
        await this.waitForCompletion(6, 0);
        await this.DblClick(this.c7)
        await this.waitForCompletion(7, 0);
        await this.DblClick(this.c8)
        await this.waitForCompletion(8, 6, customSleepTime);
        await this.DblClick(this.c9)
        await this.waitForCompletion(9, 2, customSleepTime);
        await this.DblClick(this.c10);
        await this.waitForCompletion(10, 1, maxAttempts);
        this.exitReincBtn.click();
        await this.DblClick(this.c11);
        await this.DblClick(this.c10);
        await this.waitForCompletion(11, 0, customSleepTime);
        await this.exitReincBtn.click();
        this.exitAscBtn.click();
        await this.DblClick(this.c12);
        await this.DblClick(this.c10);
        await this.waitForCompletion(12, 0, customSleepTime);
        this.exitReincBtn.click();
        this.exitAscBtn.click();
        await this.DblClick(this.c13);
        await this.DblClick(this.c10);
        await this.waitForCompletion(13, 0, customSleepTime);
        this.exitReincBtn.click();
        this.exitAscBtn.click();
        await this.DblClick(this.c14);
        await this.DblClick(this.c10);
        await this.waitForCompletion(14, 0, customSleepTime);
        this.exitReincBtn.click();
        this.exitAscBtn.click();
        await this.c15Loop();
        console.log("Completed pre c14 challenges");
        return Promise.resolve();
    }

    private async c14_w5x10(): Promise<void> {
        const corruptions = [0, 4, 1, 0, 4, 11, 6, 14] as number[];
        await this.setCorruptions(corruptions);

        this.challengeTab.click();
        await this.DblClick(this.c6)
        await this.waitForCompletion(6, 0);
        await this.DblClick(this.c7)
        await this.waitForCompletion(7, 0);
        await this.DblClick(this.c8)
        await this.waitForCompletion(8, 0);
        await this.DblClick(this.c9)
        await this.waitForCompletion(9, 0);
        await this.DblClick(this.c10)
        await this.waitForCompletion(10, 0);
        await this.DblClick(this.c5)
        await this.waitForCompletion(5, 0);
        await this.click(this.ascendBtn);
        await this.c15Loop();
        return Promise.resolve();
    }

    private async w5x10_p3x1(): Promise<void> {
        const corruptions = [3, 7, 7, 13, 4, 12, 16, 13] as number[];
        await this.setCorruptions(corruptions);

        this.challengeTab.click();
        await this.DblClick(this.c6)
        await this.waitForCompletion(6, 0);
        await this.DblClick(this.c7)
        await this.waitForCompletion(7, 0);
        await this.DblClick(this.c8)
        await this.waitForCompletion(8, 0);
        await this.DblClick(this.c9)
        await this.waitForCompletion(9, 0);
        await this.DblClick(this.c10)
        await this.waitForCompletion(10, 0);
        await this.DblClick(this.c5)
        await this.waitForCompletion(5, 0);
        await this.click(this.ascendBtn);
        await this.c15Loop();
        return Promise.resolve();
    }

    private async p3x1_p3x5(): Promise<void> {
        const corruptions = [6, 11, 10, 16, 16, 13, 16, 16] as number[];
        await this.setCorruptions(corruptions);

        this.challengeTab.click();
        await this.DblClick(this.c6)
        await this.waitForCompletion(6, 0);
        await this.DblClick(this.c7)
        await this.waitForCompletion(7, 0);
        await this.DblClick(this.c8)
        await this.waitForCompletion(8, 0);
        await this.DblClick(this.c9)
        await this.waitForCompletion(9, 0);
        await this.DblClick(this.c10)
        await this.waitForCompletion(10, 0);
        await this.DblClick(this.c5)
        await this.waitForCompletion(5, 0);
        await this.click(this.ascendBtn);
        await this.c15Loop();
        return Promise.resolve();
    }

    private async p3x5_antiquities(): Promise<void> {
        const ambLoadout2 = document.getElementById("hs-ambrosia-quickbar-blueberryLoadout2") as HTMLButtonElement
        if (!ambLoadout2) {
            this.showError(`Blueberry loadout not found`);
        }
        ambLoadout2.click();

        const corruptions = [10, 6, 7, 16, 16, 16, 16, 15] as number[];
        await this.setCorruptions(corruptions);

        this.challengeTab.click();
        await this.DblClick(this.c6)
        await this.waitForCompletion(6, 0);
        await this.DblClick(this.c7)
        await this.waitForCompletion(7, 0);
        await this.DblClick(this.c8)
        await this.waitForCompletion(8, 0);
        await this.DblClick(this.c9)
        await this.waitForCompletion(9, 0);
        await this.DblClick(this.c10)
        await this.waitForCompletion(10, 0);
        await this.DblClick(this.c5)
        await this.waitForCompletion(5, 0);
        await this.click(this.ascendBtn);
        await this.c15Loop();
        return Promise.resolve();
    }

    private async antiquities_singularity(): Promise<void> {
        const corruptions = [0, 0, 0, 0, 0, 0, 0, 0] as number[];
        await this.setCorruptions(corruptions);

        this.challengeTab.click();
        await this.DblClick(this.c11);
        await this.DblClick(this.c10);
        await this.waitForCompletion(11, 72);
        await this.exitReincBtn.click();
        this.exitAscBtn.click();
        await this.DblClick(this.c12);
        await this.DblClick(this.c10);
        await this.waitForCompletion(12, 72);
        this.exitReincBtn.click();
        this.exitAscBtn.click();
        await this.DblClick(this.c13);
        await this.DblClick(this.c10);
        await this.waitForCompletion(13, 72);
        this.exitReincBtn.click();
        this.exitAscBtn.click();
        await this.DblClick(this.c14);
        await this.DblClick(this.c10);
        await this.waitForCompletion(14, 72);
        this.exitReincBtn.click();
        this.exitAscBtn.click();
        await this.c15Loop();
        return Promise.resolve();
    }

    private stopAutosing() {
        this.autosingEnabled = false;
        this.unsubscribeGameDataChanges();
    }

    private async getStage(): Promise<string> {
        await this.click(this.settingsTab);
        const settingsSubTab = document.getElementById('switchSettingSubTab4') as HTMLButtonElement;
        if (!settingsSubTab) {
            this.showError("Error during autosing logic: could not access settings to read stage");
            this.stopAutosing()
        }
        settingsSubTab.click();
        const misc = document.getElementById('kMisc') as HTMLButtonElement;
        if (!misc) {
            this.showError("Error during autosing logic: could not access settings to read stage");
            this.stopAutosing()
        }
        misc.click();
        const stage = await this.waitForElement('gameStageStatistic');
        if (!stage) {
            this.showError("Error during autosing logic: could not access settings to read stage");
            this.stopAutosing()
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
        return Promise.resolve();
    }

    private async performSingularity(): Promise<void> {
        const singularityButton = document.getElementById('singularitybtn') as HTMLButtonElement
        if (!singularityButton) {
            this.showError("Error during autosing logic: singularity button not found");
            this.stopAutosing()
        }
        await this.click(singularityButton);
        const okay = document.getElementById('ok_confirm') as HTMLButtonElement;
        if (!okay) {
            this.showError("Error during autosing logic: okay button not found");
            this.stopAutosing()
        }
        await this.click(okay);
        const okay2 = document.getElementById('ok_alert') as HTMLButtonElement;
        if (!okay2) {
            this.showError("Error during autosing logic: okay button not found");
            this.stopAutosing()
        }
        await this.click(okay2);

        const buildings_tab = document.getElementById('buildingstab') as HTMLButtonElement;
        if (!buildings_tab) {
            this.showError("Error during autosing logic: buildings tab button not found");
            this.stopAutosing()
        }
        this.buildingsTab.click();

        const coin = document.getElementById('buycoin1') as HTMLButtonElement;
        if (!coin) {
            this.showError("Error during autosing logic: coin button not found");
            this.stopAutosing()
        }
        await this.click(coin);
        await this.sleep(this.sleepTime);

        const ambrosia_early_cube = document.getElementById('hs-ambrosia-quickbar-blueberryLoadout4') as HTMLButtonElement;
        if (!ambrosia_early_cube) {
            this.showError("Error during autosing logic: ambrosia early cube button not found");
        } else {
            ambrosia_early_cube.click();
        }
        return Promise.resolve();
    }

    private async waitForCompletion(challengeIndex: number, minCompletions: number, maxAttempts: number = 100, customSleepTime: number = this.sleepTime): Promise<void> {
        let attempts = 0;
        let previousCompletions = -1;
        const completions = document.getElementById(`challenge${challengeIndex}level`) as HTMLParagraphElement;
        while (attempts < maxAttempts) {
            const completionsNumber = completions ? this.parseNumber(completions.innerText) : 0;
            if (minCompletions == 0) {
                if (previousCompletions == completionsNumber && completionsNumber > 0) {
                    return Promise.resolve();
                }
                await this.sleep(customSleepTime);
                previousCompletions = completionsNumber;
            } else {
                if (completionsNumber >= minCompletions) {
                    return Promise.resolve();
                }
                await this.sleep(customSleepTime);
            }
            attempts++;

        }
        console.error(`Timeout waiting for challenge ${challengeIndex} to reach ${minCompletions} completions`);
        return Promise.resolve();

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
        button.click()
        await this.sleep(this.sleepTime)
        return Promise.resolve();
    }

    async DblClick(element: HTMLElement): Promise<void> {
        element.click();
        // Wait 50ms to simulate human speed
        await new Promise(res => setTimeout(res, 5));
        element.click();
        await this.sleep(this.sleepTime);

        // Then fire the dblclick event just in case
        element.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        return Promise.resolve();
    }
}