import { HSModuleOptions } from "../../types/hs-types";
import { HSModule } from "./module/hs-module";

/**
 * Class: HSDebug
 * IsExplicitHSModule: Yes
 * Description:
 *     A simple module to help with debugging. Currently does not have any functionality, but serves as a template for future modules.
 * Author: Swiffy
 */
export class HSDebug extends HSModule {
    static #context: string;

    constructor(moduleOptions : HSModuleOptions) {
        super(moduleOptions);
        HSDebug.#context = moduleOptions.context;
    }

    async init() {
        this.isInitialized = true;
    }
}
