import { AutosingStrategyPhase } from "../../../types/module-types/hs-autosing-types";
import { HSLogger } from "../../hs-core/hs-logger";
import { HSGlobal } from "../../hs-core/hs-global";

/**
 * Class: HSAutosingCorruption
 * IsExplicitHSModule: No
 * Description: Sets the game's corruption level for autosing's phases and actions. Since the game's 4.4.0, one level
 *     (player.corruptions.next, used from the next ascension). It is set through the game's own level input, so the
 *     game checks it: a level above what the player can reach now is lowered to it, without any message.
 * Author: Shewchou
 */
export class HSAutosingCorruption {
    readonly #context = 'HSAutosingCorruption';

    readonly #levelInput: HTMLInputElement;
    readonly #maxButton: HTMLButtonElement;

    constructor(levelInput: HTMLInputElement, maxButton: HTMLButtonElement) {
        this.#levelInput = levelInput;
        this.#maxButton = maxButton;
    }

    /** The level the next ascension will use. Without the live player, the game's input: it writes there the level it kept. */
    #getNextLevel(): number {
        return HSGlobal.exposedPlayer?.corruptions.next ?? Number(this.#levelInput.value);
    }

    /**
     * Sets the next corruption level (synchronous, no dialog). Compared with the game's current level, not with the
     * last one asked: a level the game lowered is asked again by the next call.
     */
    setLevel(level: number): void {
        if (this.#getNextLevel() === level) return;

        // The game's change listener runs setNextCorruptionLevel: the level is checked, the Corruption tab updated
        this.#levelInput.value = String(level);
        this.#levelInput.dispatchEvent(new Event('change'));

        const kept = this.#getNextLevel();
        if (kept === level) HSLogger.debug(() => `Corruption level set: ${level}`, this.#context);
        else HSLogger.debug(() => `Corruption level ${level} asked, the game kept ${kept} (the highest reachable now)`, this.#context);
    }

    /** The game's Max button: the highest level the player can reach now. */
    setMaxLevel(): void {
        this.#maxButton.click();
        HSLogger.debug(() => `Corruption level set to the max: ${this.#getNextLevel()}`, this.#context);
    }

    /** Sets the phase's level, when it has one (empty: the phase leaves the level as it is). */
    applyPhaseLevel(phaseConfig: AutosingStrategyPhase): void {
        if (phaseConfig.corruptionLevel !== null) this.setLevel(phaseConfig.corruptionLevel);
    }
}
