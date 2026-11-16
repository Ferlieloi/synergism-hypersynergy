import { HSLogger } from "../../hs-core/hs-logger";
import { HSCorruptionLevel } from "../../hs-core/hs-corruption-level";

/**
 * Class: HSAutosingCorruption
 * IsExplicitHSModule: No
 * Description: Sets the game's corruption level for autosing's steps and its AOAG phase, and cleanses it. Since the game's 4.4.0, one level
 *     (player.corruptions.next, used from the next ascension), set through the game's own controls (HSCorruptionLevel),
 *     so the game checks it: a level above what the player can reach now is lowered to it, without any message.
 * Author: Shewchou
 */
export class HSAutosingCorruption {
    readonly #context = 'HSAutosingCorruption';

    /**
     * Sets the next corruption level (synchronous, no dialog). Compared with the game's current level, not with the
     * last one asked: a level the game lowered is asked again by the next call.
     */
    setLevel(level: number): void {
        if (HSCorruptionLevel.getNext() === level) return;

        const kept = HSCorruptionLevel.setNext(level);
        if (kept === level) HSLogger.debug(() => `Corruption level set: ${level}`, this.#context);
        else HSLogger.debug(() => `Corruption level ${level} asked, the game kept ${kept} (the highest reachable now)`, this.#context);
    }

    /**
     * The game's cleanse (synchronous, no dialog, no ascension): the current level is lowered at once to 0, or to the
     * highest level cleared when toHighest, and the next level set to it. The game's "Cleanse to highest" toggle is set
     * for this cleanse only, then put back as the player had it. Returns the level the game kept.
     */
    cleanse(toHighest: boolean): number {
        const playerToggle = HSCorruptionLevel.getToggle('cleanseToHighest');
        HSCorruptionLevel.setToggle('cleanseToHighest', toHighest);
        const kept = HSCorruptionLevel.cleanse();
        HSCorruptionLevel.setToggle('cleanseToHighest', playerToggle);
        HSLogger.debug(() => `Corruptions cleansed${toHighest ? ' to the highest level cleared' : ''}: next level ${kept}`, this.#context);
        return kept;
    }

    /** The game's Max button: the highest level the player can reach now. */
    setMaxLevel(): void {
        const kept = HSCorruptionLevel.press('max');
        HSLogger.debug(() => `Corruption level set to the max: ${kept}`, this.#context);
    }
}
