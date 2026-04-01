import { HSElementHooker } from "../hs-core/hs-elementhooker";
import { HSPatch } from "./hs-patch";

/**
 * Class: PATCH_TestPatch
 * IsExplicitHSModule: No
 * Description:
 *     Simple test patch to verify that the patching system is working correctly.
 *     Changes the color of the building tab button to red when applied, and reverts it back when removed.
 * Author: Swiffy
 */
export class PATCH_TestPatch extends HSPatch {
    async applyPatch(): Promise<void> {
        const buildingBtn = await HSElementHooker.HookElement('#buildingstab') as HTMLButtonElement;
        buildingBtn.style.color = 'red';
    }

    async revertPatch(): Promise<void> {
        const buildingBtn = await HSElementHooker.HookElement('#buildingstab') as HTMLButtonElement;
        buildingBtn.style.color = '';
    }
}
