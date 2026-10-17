import { EventBuffType } from "../../types/data-types/hs-event-data";
import { HSSettingType } from "../../types/module-types/hs-settings-types";
import { CSSValue } from "../../types/module-types/hs-ui-types";
import { HSLogger } from "../hs-core/hs-logger";

/**
 * Class: HSUtils
 * IsExplicitHSModule: No
 * Description: 
 *     Static utility module for Hypersynergism.
 *     Functionalities include:
 *         - wait() method to wait for an arbitrary amount of time
 *         - uuidv4() for generating UUIDs
 *         - domid() method for generating DOM-compliant unique ids
 *         - hashCode() for calculating a unique hash for arbitrary string
 *         - N() for pretty printing numbers
 * Author: Swiffy
 */
export class HSUtils {
    static #context = 'HSUtils';
    static sleep = (ms: number): Promise<void> => new Promise<void>(resolve => setTimeout(resolve, ms));
    static tackTime = 5; // for bookmark/steam (no tack hook)

    static #_onAfterTack: ((fn: () => void) => void) | null = null;

    /** The patcher honours __HS_AUTO_CONFIRM (Confirm and Alert). Set before the mod loads, by any patcher version. */
    static isAutoConfirmPatched(): boolean {
        return !!(window as any).__HS_AUTO_CONFIRM_PATCHED;
    }

    static setAutoConfirm(value: boolean): void {
        (window as any).__HS_AUTO_CONFIRM = value;
    }

    // Reusable MessageChannel for sub-millisecond event-loop yielding.
    // Queue-based so concurrent yields (if ever) work correctly.
    static readonly #_yieldChannel = (() => {
        const resolvers: (() => void)[] = [];
        const { port1, port2 } = new MessageChannel();
        port2.onmessage = () => resolvers.shift()?.();
        return { port1, resolvers };
    })();

    static yield = (fn?: () => void): Promise<void> =>
        new Promise<void>(resolve => {
            if (fn) {
                fn();
            }

            HSUtils.#_yieldChannel.resolvers.push(resolve);
            HSUtils.#_yieldChannel.port1.postMessage(null);
        });

    static cacheAfterTackHook(): boolean {
        HSUtils.#_onAfterTack = (window as any).__HS_onAfterTack ?? null;
        return HSUtils.#_onAfterTack !== null;
    }

    static isAfterTackHooked(): boolean {
        return HSUtils.#_onAfterTack !== null;
    }

    // Resolves as a microtask immediately after the next game tack() completes
    // If no tack hook is available, waits 5ms instead
    static waitForNextTack = (tackCount = 1): Promise<void> => {
        if (tackCount <= 0) { return Promise.resolve(); }

        if (!HSUtils.#_onAfterTack) {
            HSUtils.cacheAfterTackHook();
            if (!HSUtils.#_onAfterTack) return HSUtils.sleep(HSUtils.tackTime * tackCount);
        }

        if (tackCount === 1) {
            return new Promise<void>(resolve => HSUtils.#_onAfterTack!(resolve));
        }

        return new Promise<void>((resolve) => {
            let remaining = tackCount;
            const next = () => {
                remaining -= 1;
                if (remaining <= 0) {
                    resolve();
                } else {
                    HSUtils.#_onAfterTack!(next);
                }
            };
            HSUtils.#_onAfterTack!(next);
        });
    };

    // Simple promise-based wait/delay utility method
    static wait(delay: number) {
        return new Promise(function (resolve) {
            setTimeout(resolve, delay);
        });
    }

    static async sleepUntilElapsed(
        prevTime: number,
        delayMs: number,
        context?: string
    ): Promise<void> {
        if (delayMs <= 0) return;

        const elapsed = performance.now() - prevTime;
        const remaining = delayMs - elapsed;

        if (remaining > 0) {
            if (HSLogger.isDebugEnabled) HSLogger.debug(() => `-------> Sleeping for ${remaining.toFixed(2)} ms to enforce delay of ${delayMs} ms`, context ?? HSUtils.#context);
            await HSUtils.sleep(remaining);
        } else {
            if (HSLogger.isDebugEnabled) HSLogger.debug(() => `-------> No need to sleep, elapsed time ${elapsed.toFixed(2)} ms already exceeds delay of ${delayMs} ms`, context ?? HSUtils.#context);
        }
    }

    static uuidv4(): string {
        return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
            (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
        );
    }

    static domid(): string {
        return "hs-rnd-00000000000".replace(/[018]/g, c =>
            (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
        );
    }

    static getExponent(num: number): number {
        return Math.pow(10, num);
    }

    static hashCode(str: string): number {
        let hash = 0;
        let i;
        let chr;

        if (str.length === 0) return hash;

        for (i = 0; i < str.length; i++) {
            chr = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0;
        }

        return hash;
    }

    static async computeHash(data: string): Promise<string> {
        const encoder = new TextEncoder();
        const dataBuffer = encoder.encode(data);
        const hashBuffer = await crypto.subtle.digest('SHA-1', dataBuffer);

        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    static N(num: string | number, precision: number = 2, expDecimals: number = 2) {
        let tempNum = 0;
        let numString = '';

        try {
            if (typeof num === "string")
                tempNum = parseFloat(num);
            else
                tempNum = num;

            if (tempNum > 1_000_000) {
                numString = tempNum.toExponential(expDecimals).replace('+', '');
            } else {
                numString = tempNum.toFixed(precision);
            }
        } catch (e) {
            HSLogger.error(`HSUtils.N FAILED FOR ${num}`, HSUtils.#context);
            return numString;
        }

        return numString;
    }

    static getTime(): string {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const seconds = now.getSeconds();
        const milliseconds = now.getMilliseconds();

        const formattedHours = hours.toString().padStart(2, '0');
        const formattedMinutes = minutes.toString().padStart(2, '0');
        const formattedSeconds = seconds.toString().padStart(2, '0');
        const formattedMilliseconds = milliseconds.toString().padStart(3, '0');

        return `${formattedHours}:${formattedMinutes}:${formattedSeconds}.${formattedMilliseconds}`;
    }

    static camelToKebab(str: string) {
        return str
            .replace(/^([A-Z])/, (match) => match.toLowerCase())
            .replace(/([A-Z])/g, (match) => '-' + match.toLowerCase());
    }

    static kebabToCamel(str: string) {
        return str.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    }

    static objectToCSS<T extends Record<string, CSSValue>>(obj: T): string {
        let cssString = ``;

        if (obj === undefined || obj === null) {
            return '';
        }

        for (const [key, value] of Object.entries(obj)) {
            if (value !== undefined && value !== null) {
                cssString += `${this.camelToKebab(key)}: ${value};\n`;
            }
        }

        return cssString;
    }

    // This is jQuery's solution to this problem - it is surprisingly difficult
    // https://github.com/jquery/jquery/blob/76687566f0569dc832f13e901f0d2ce74016cd4d/test/data/jquery-3.7.1.js#L10641
    static isNumeric(n: any) {
        return !isNaN(n - parseFloat(n));
    }

    static isString(n: any) {
        return (typeof n === 'string' || n instanceof String);
    }

    static isBoolean(n: any) {
        return (typeof n == "boolean");
    }

    static nullProxy<T>(proxyName: string): T {
        const nullProxy = new Proxy({}, {
            get: () => {
                HSLogger.warn(`Get operation intercepted by Null Proxy '${proxyName}', something is not right`, this.#context);
                return nullProxy;
            },
            set: () => {
                HSLogger.warn(`Set operation intercepted by Null Proxy '${proxyName}', something is not right`, this.#context);
                return true;
            }
        });

        return nullProxy as T;
    }

    /**
     * A CSS url() value for any URL. Always quoted: an unquoted url() is invalid when the URL contains
     * spaces, quotes or parentheses (e.g. "Pictures/PurpleAmbrosia/Purple Upgrades/PurpleHoney.png"),
     * and the browser then silently ignores the whole CSS value.
     */
    static cssUrl(url: string): string {
        return `url(${JSON.stringify(url)})`;
    }

    static #translationFiles = new Map<string, Promise<Record<string, unknown> | undefined>>();

    /** Fetch a game translation file the same way the game does (cached per language). */
    static #loadTranslationFile(lang: string): Promise<Record<string, unknown> | undefined> {
        let file = this.#translationFiles.get(lang);
        if (!file) {
            file = fetch(`./translations/${lang}.json`)
                .catch(() => fetch(`https://synergism.cc/translations/${lang}.json`))
                .then(r => r.ok ? r.json() as Promise<Record<string, unknown>> : undefined)
                .catch(() => undefined)
                .then(json => {
                    // Don't cache failures, so a later call can retry
                    if (!json) this.#translationFiles.delete(lang);
                    return json;
                });
            this.#translationFiles.set(lang, file);
        }
        return file;
    }

    /** A whole game translation file (e.g. 'en'), fetched as the game does and cached. Undefined if unreachable. */
    static getGameTranslationFile(lang: string): Promise<Record<string, unknown> | undefined> {
        return this.#loadTranslationFile(lang);
    }

    /**
     * Get a game UI string (e.g. 'ambrosia.importTree.success') in the player's language.
     * Uses the game's i18next when the patcher exposed it, else the game's translation files,
     * with English as fallback like the game. Returns undefined if the key can't be resolved.
     * Optional `vars` fill the {{placeholders}}, like i18next.t(key, vars).
     */
    static async getGameTranslation(key: string, vars?: Record<string, string | number>): Promise<string | undefined> {
        const i18n = (window as any).__HS_i18next;
        if (typeof i18n?.t === 'function') {
            const text = i18n.t(key, vars);
            if (typeof text === 'string' && text !== key) return text;
        }

        const resolve = (file: Record<string, unknown> | undefined): string | undefined => {
            const value = key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown> | undefined)?.[part], file);
            if (typeof value !== 'string' || value.length === 0) return undefined;
            if (!vars) return value;
            return value.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, name: string) => name in vars ? String(vars[name]) : match);
        };

        const lang = localStorage.getItem('language') || 'en';
        const text = resolve(await this.#loadTranslationFile(lang));
        if (text || lang === 'en') return text;
        return resolve(await this.#loadTranslationFile('en'));
    }

    // Replace color tags for panel logging
    static parseColorTags(msg: string): string {
        const tagPattern = /<([a-zA-Z]+|#[0-9A-Fa-f]{3,8})>(.*?)<\/\1>/g;

        // Replace all matched patterns with span elements
        return msg.replace(tagPattern, (match, colorName, content) => {
            return `<span style="color: ${colorName}">${content}</span>`;
        });
    }

    // Remove color tags for console logging
    static removeColorTags(msg: string): string {
        try {
            const tagPattern = /<([a-zA-Z]+|#[0-9A-Fa-f]{3,6})>(.*?)<\/\1>/g;

            return msg.replace(tagPattern, (match, colorName, content) => {
                return `${content}`;
            });
        } catch (e) {
            console.warn("Error removing color tags from log message", e);
            return `${msg}`;
        }
    }

    static async Noop() {
        return;
    }

    static eventBuffNumToName(buff: EventBuffType) {
        const reverse = {
            0: 'Quark',
            1: 'GoldenQuark',
            2: 'Cubes',
            3: 'PowderConversion',
            4: 'AscensionSpeed',
            5: 'GlobalSpeed',
            6: 'AscensionScore',
            7: 'AntSacrifice',
            8: 'Offering',
            9: 'Obtainium',
            10: 'Octeract',
            11: 'BlueberryTime',
            12: 'AmbrosiaLuck',
            13: 'OneMind',
        }

        return reverse[buff];
    }

    static asString(settingValue: HSSettingType): string {
        if (settingValue === null) return '';
        return String(settingValue);
    }

    static async waitForInnerText(
        el: HTMLElement,
        predicate: (text: string) => boolean = t => t.trim().length > 0,
        timeoutMs = 2000
    ): Promise<void> {
        // if already satisfied, don't set up observers/timers.
        if (predicate(el.textContent ?? "")) return;

        // Wait until a mutation makes the predicate true.
        return new Promise((resolve, reject) => {
            let finished = false;

            const observer = new MutationObserver(() => {
                if (predicate(el.textContent ?? "")) {
                    cleanup();
                    resolve();
                }
            });

            const timeout = window.setTimeout(() => {
                cleanup();
                reject(new Error("Timed out waiting for inner text"));
            }, timeoutMs);

            const cleanup = () => {
                if (finished) return;
                finished = true;
                clearTimeout(timeout);
                observer.disconnect();
            };

            observer.observe(el, {
                childList: true,
                characterData: true,
                subtree: true
            });
        });
    }


    static waitForNextMutation(
        el: HTMLElement,
        timeoutMs = 2000
    ): Promise<void> {
        const root = el.parentElement ?? el;

        return new Promise((resolve, reject) => {
            let finished = false;

            const observer = new MutationObserver(() => {
                cleanup();
                resolve();
            });

            const timeout = window.setTimeout(() => {
                cleanup();
                reject(new Error("Timed out waiting for next mutation"));
            }, timeoutMs);

            const cleanup = () => {
                if (finished) return;
                finished = true;
                clearTimeout(timeout);
                observer.disconnect();
            };

            observer.observe(root, {
                childList: true,
                subtree: true,
                characterData: true
            });
        });
    }

    static waitForClassCondition(
        element: Element, condition: () => boolean,
        timeoutMs: number
    ): Promise<boolean> {
        if (condition()) return Promise.resolve(true);
        return new Promise<boolean>((resolve) => {
            let finished = false;
            const cleanup = (success: boolean): void => {
                if (finished) return;
                finished = true;
                clearTimeout(timeoutId);
                observer.disconnect();
                resolve(success);
            };
            const observer = new MutationObserver(() => { if (condition()) cleanup(true); });
            const timeoutId = window.setTimeout(() => cleanup(false), timeoutMs);
            observer.observe(element, { attributes: true, attributeFilter: ['class'] });
            if (condition()) cleanup(true);
        });
    }

    static async click(button: HTMLButtonElement): Promise<void> {
        button.click();
        await HSUtils.sleep(HSUtils.tackTime);
        return Promise.resolve();
    }

    static async DblClick(element: HTMLElement): Promise<void> {
        element.click();
        await new Promise(res => setTimeout(res, 5));
        element.click();
        await HSUtils.sleep(HSUtils.tackTime);
        element.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        return Promise.resolve();
    }

    static base64WithCRLF(
        base64: string,
        chunkSize = 49000
    ): string {
        const parts: string[] = [];

        for (let i = 0; i < base64.length; i += chunkSize) {
            parts.push(base64.slice(i, i + chunkSize));
        }

        // Add a thrid empty part if there's only 2, in order to fill the 3 cells on the ggsheet
        if (parts.length === 2) {
            parts.push(" ");
        }

        return parts.join("\r\n");
    }

    static getCorruptions(mode: "current" | "next") {
        const getLevel = (id: string): number => {
            const element = document.getElementById(id);
            // Use parseInt and default to 0 if the element is missing or text is invalid
            return element ? parseInt(element.textContent || '0', 10) : 0;
        };
        if (mode === "current") {
            const a = {
                viscosity: getLevel('corrCurrentviscosity'),
                drought: getLevel('corrCurrentdrought'),
                deflation: getLevel('corrCurrentdeflation'),
                extinction: getLevel('corrCurrentextinction'),
                illiteracy: getLevel('corrCurrentilliteracy'),
                recession: getLevel('corrCurrentrecession'),
                dilation: getLevel('corrCurrentdilation'),
                hyperchallenge: getLevel('corrCurrenthyperchallenge')
            };
            return a;
        } else {
            return {
                viscosity: getLevel('corrNextviscosity'),
                drought: getLevel('corrNextdrought'),
                deflation: getLevel('corrNextdeflation'),
                extinction: getLevel('corrNextextinction'),
                illiteracy: getLevel('corrNextilliteracy'),
                recession: getLevel('corrNextrecession'),
                dilation: getLevel('corrNextdilation'),
                hyperchallenge: getLevel('corrNexthyperchallenge')
            };
        }
    }

    static sumContents(arr: (number | null)[]): number {
        return arr.reduce<number>((acc, val) => acc + (val ?? 0), 0);
    }
}
