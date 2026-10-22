import { HSModuleManager } from "./module/hs-module-manager";
import { HSGameData } from "./gds/hs-gamedata";

/** How the mod was loaded: the Steam game (desktop loader), a browser userscript (Tampermonkey), or the bookmark */
export type HSPlatformName = 'steam' | 'userscript' | 'bookmarklet';

/**
 * Class: HSPlatform
 * IsExplicitHSModule: No
 * Description:
 *     Tells how the mod was loaded. Every userscript loader sets HS_LOADER_INITIALIZED before the game runs,
 *     so a userscript whose patch failed still counts as a userscript. Static only.
 * Author: Shewchou
 */
export class HSPlatform {
    /** null before HSGameData is initialised (it tells Steam from a browser) */
    static get(): HSPlatformName | null {
        const gameData = HSModuleManager.getModule<HSGameData>('HSGameData');
        if (!gameData) return null;
        if (gameData.isSteam) return 'steam';
        return window.HS_LOADER_INITIALIZED ? 'userscript' : 'bookmarklet';
    }
}
