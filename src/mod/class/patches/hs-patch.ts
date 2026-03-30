/**
 * Class: HSPatch
 * IsExplicitHSModule: No
 * Description:
 *     Abstract base class for defining patches that can be applied to the game.
 *     Each patch should implement the applyPatch and revertPatch methods to modify
 *     the game's behavior or appearance as needed.
 * Author: Swiffy
 */
export abstract class HSPatch {
    #patchName: string;

    constructor(patchName: string) {
        this.#patchName = patchName;
    }

    get patchName(): string {
        return this.#patchName;
    }

    abstract applyPatch(): void | Promise<void>;
    abstract revertPatch(): void | Promise<void>;
}