import { HSModuleManager } from "../../hs-core/module/hs-module-manager";
import { HSGameDataAPI } from "../../hs-core/gds/hs-gamedata-api";
import { HSLogger } from "../../hs-core/hs-logger";
import { HSQOLQuickbarBase } from "./hs-qolQuickbarBase";

/**
 * Class: HSQOLEventsQuickbar
 * IsExplicitHSModule: No
 * Description: Events Quickbar component.
 *     Create and manage a small quickbar that displays the active global event indicator
 *     in the header quickbars row.
 *     Subscribe to `HSGameDataAPI` for updates and refresh the DOM accordingly.
 *     Provide a stable public lifecycle: `createSection()`, `setup()`, `teardown()`.
 */
export class HSQOLEventsQuickbar extends HSQOLQuickbarBase {
    protected readonly context = 'HSQOLEventsQuickbar';
    protected readonly sectionIdInternal = 'eventsQuickBar';
    protected readonly sectionIdCss = 'eventsQuickBar';

    #cachedElements?: {
        globalEventSpan: HTMLSpanElement;
    };
    #unsubscribeVanillaGlobalEvent: (() => void) | null = null;

    /** Create and inject the base DOM structure for the events quickbar into the container. */
    protected createDOM(): void {
        if (!this.container) return;

        // Global event display (image only)
        const globalEventSpan = document.createElement('span');
        globalEventSpan.id = 'events-quickbar-global-event-span';
        globalEventSpan.style.cursor = 'help';

        const globalEventImg = document.createElement('img');
        globalEventImg.className = 'events-quickbar-event-img';
        globalEventImg.src = 'Pictures/transcended-monthly-sub.png';
        globalEventSpan.appendChild(globalEventImg);

        // default status before the first update: hidden global event.
        globalEventSpan.classList.add('hs-hidden');

        // Cache references for fast updates later
        this.#cachedElements = {
            globalEventSpan
        };

        this.container.appendChild(globalEventSpan);

        HSLogger.debug(() => 'Events quickbar DOM created', this.context);
    }

    protected cleanupDOM(): void {
        if (this.container) this.container.innerHTML = '';
        this.#cachedElements = undefined;
    }

    protected async onSetup(): Promise<void> {
        this.#setupSubscription();
        this.#updateDOM();
    }

    protected onTeardown(): void {
        this.#cleanupSubscription();
    }

    /** Setup subscription hook to vanilla global event updates from HSGameDataAPI. */
    #setupSubscription(): void {
        if (this.#unsubscribeVanillaGlobalEvent) return;
        if (!this.#cachedElements) return;

        const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        if (!gameDataAPI) return;

        if (typeof gameDataAPI.subscribeVanillaGlobalEventChange === 'function') {
            this.#unsubscribeVanillaGlobalEvent = gameDataAPI.subscribeVanillaGlobalEventChange(() => { this.#updateDOM(); }) ?? null;
            HSLogger.debug(() => 'Subscribed to vanilla global event changes for Events Quickbar', this.context);
        }
    }

    /** Cleanup event subscription and release callback references. */
    #cleanupSubscription(): void {
        if (this.#unsubscribeVanillaGlobalEvent) {
            try { this.#unsubscribeVanillaGlobalEvent(); } catch (e) { /* ignore */ }
            this.#unsubscribeVanillaGlobalEvent = null;
            HSLogger.debug(() => 'Unsubscribed from vanilla global event changes for Events Quickbar', this.context);
        }
    }

    /** Pull latest event data and refresh the quickbar UI. */
    #updateDOM(): void {
        if (!this.#cachedElements) return;

        const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        if (!gameDataAPI) return;

        const vanillaGlobalEvent = gameDataAPI.getVanillaGlobalEvent();

        const { globalEventSpan } = this.#cachedElements;

        const globalEventTooltip = this.#formatGlobalEventTooltip(vanillaGlobalEvent);

        globalEventSpan.title = globalEventTooltip;
        globalEventSpan.classList.toggle('hs-hidden', !vanillaGlobalEvent);

        HSLogger.debug(() => `Events quickbar updated: Global Event: "${globalEventTooltip}"`, this.context);
    }

    /** Format global event tooltip text for a single vanilla global event. */
    #formatGlobalEventTooltip(vanillaGlobalEvent: any): string {
        if (!vanillaGlobalEvent) {
            return 'No active Global Event';
        }

        const endTime = vanillaGlobalEvent.end ? new Date(vanillaGlobalEvent.end).toLocaleString() : 'unknown end';
        const names = Array.isArray(vanillaGlobalEvent.name) ? vanillaGlobalEvent.name : [vanillaGlobalEvent.name];

        if (names.length === 1) {
            return `${names[0]} active until ${endTime}`;
        }

        return names.map((name: string) => `${name} active until ${endTime}`).join('\n');
    }
}
