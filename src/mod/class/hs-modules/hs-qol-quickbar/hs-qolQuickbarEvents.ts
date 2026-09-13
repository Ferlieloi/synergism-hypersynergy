import { HSModuleManager } from "../../hs-core/module/hs-module-manager";
import { HSGameDataAPI } from "../../hs-core/gds/hs-gamedata-api";
import { HSLogger } from "../../hs-core/hs-logger";
import { HSQOLQuickbarBase } from "./hs-qolQuickbarBase";
import { HSWebSocket } from "../../hs-core/hs-websocket";

/**
 * Class: HSQOLEventsQuickbar
 * IsExplicitHSModule: No
 * Description: Events Quickbar component.
 *     Create and manage a small quickbar that displays time-limited event indicators
 *     (e.g. Happy Hour, Lotus of Rejuvenation) in the header quickbars row.
 *     Subscribe to `HSGameDataAPI` for updates and refresh the DOM accordingly.
 *     Provide a stable public lifecycle: `createSection()`, `setup()`, `teardown()`.
 */
export class HSQOLEventsQuickbar extends HSQOLQuickbarBase {
    protected readonly context = 'HSQOLEventsQuickbar';
    protected readonly sectionIdInternal = 'eventsQuickBar';
    protected readonly sectionIdCss = 'eventsQuickBar';

    #cachedElements?: {
        happyHourSpan: HTMLSpanElement;
        happyHourAmountSpan: HTMLSpanElement;
        lotusSpan: HTMLSpanElement;
        globalEventSpan: HTMLSpanElement;
    };
    #unsubscribeEventData: (() => void) | null = null;
    #unsubscribeVanillaGlobalEvent: (() => void) | null = null;

    /** Create and inject the base DOM structure for the events quickbar into the container. */
    protected createDOM(): void {
        if (!this.container) return;

        // Happy Hour display (amount + bell image)
        const happyHourSpan = document.createElement('span');
        happyHourSpan.id = 'events-quickbar-happy-hour-span';
        happyHourSpan.style.cursor = 'help';

        const happyHourAmountSpan = document.createElement('span');
        happyHourSpan.appendChild(happyHourAmountSpan);

        const happyHourImg = document.createElement('img');
        happyHourImg.className = 'events-quickbar-event-img';
        happyHourImg.src = 'Pictures/PseudoShop/HAPPY_HOUR_BELL.png';
        happyHourSpan.appendChild(happyHourImg);

        // Lotus event display (image only)
        const lotusSpan = document.createElement('span');
        lotusSpan.id = 'events-quickbar-lotus-span';
        lotusSpan.style.cursor = 'help';

        const lotusImg = document.createElement('img');
        lotusImg.className = 'events-quickbar-event-img';
        lotusImg.src = 'Pictures/PseudoShop/LOTUS.png';
        lotusSpan.appendChild(lotusImg);

        // Global event display (image only)
        const globalEventSpan = document.createElement('span');
        globalEventSpan.id = 'events-quickbar-global-event-span';
        globalEventSpan.style.cursor = 'help';

        const globalEventImg = document.createElement('img');
        globalEventImg.className = 'events-quickbar-event-img';
        globalEventImg.src = 'Pictures/transcended-monthly-sub.png';
        globalEventSpan.appendChild(globalEventImg);

        // default status before any WS update: no active HH and hidden Lotus / global event.
        happyHourSpan.classList.add('no-event');
        lotusSpan.classList.add('hs-hidden');
        globalEventSpan.classList.add('hs-hidden');

        // Cache references for fast updates later
        this.#cachedElements = {
            happyHourSpan,
            happyHourAmountSpan,
            lotusSpan,
            globalEventSpan
        };

        this.container.appendChild(happyHourSpan);
        this.container.appendChild(lotusSpan);
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

    /** Setup subscription hook to event data updates from HSGameDataAPI. */
    #setupSubscription(): void {
        if (this.#unsubscribeEventData) return;
        if (!this.#cachedElements) return;

        const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        if (!gameDataAPI) return;

        if (typeof gameDataAPI.subscribeEventDataChange === 'function') {
            this.#unsubscribeEventData = gameDataAPI.subscribeEventDataChange(() => { this.#updateDOM(); }) ?? null;
            HSLogger.debug(() => 'Subscribed to event data changes for Events Quickbar', this.context);
        }

        if (typeof gameDataAPI.subscribeVanillaGlobalEventChange === 'function') {
            this.#unsubscribeVanillaGlobalEvent = gameDataAPI.subscribeVanillaGlobalEventChange(() => { this.#updateDOM(); }) ?? null;
            HSLogger.debug(() => 'Subscribed to vanilla global event changes for Events Quickbar', this.context);
        }
    }

    /** Cleanup event subscription and release callback references. */
    #cleanupSubscription(): void {
        if (this.#unsubscribeEventData) {
            try { this.#unsubscribeEventData(); } catch (e) { /* ignore */ }
            this.#unsubscribeEventData = null;
            HSLogger.debug(() => 'Unsubscribed from event data changes for Events Quickbar', this.context);
        }

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

        const eventData = gameDataAPI.getEventData();
        const vanillaGlobalEvent = gameDataAPI.getVanillaGlobalEvent();

        const { happyHourSpan, happyHourAmountSpan, lotusSpan, globalEventSpan } = this.#cachedElements;

        const happyHourEvent = eventData?.HAPPY_HOUR_BELL;
        const lotusEvent = eventData?.LOTUS_OF_REJUVENATION;
        const happyHourAmount = happyHourEvent?.amount ?? 0;

        const hhTooltipText = this.#formatHappyHourTooltip(happyHourEvent, happyHourAmount);
        const lotusTooltipText = this.#formatLotusTooltip(lotusEvent);
        const globalEventTooltip = this.#formatGlobalEventTooltip(vanillaGlobalEvent);

        happyHourSpan.title = hhTooltipText;
        lotusSpan.title = lotusTooltipText;
        globalEventSpan.title = globalEventTooltip;
        happyHourAmountSpan.textContent = `${happyHourAmount}`;

        const happyHourActive = Array.isArray(happyHourEvent?.ends) && happyHourEvent.ends.length > 0;
        const lotusActive = Array.isArray(lotusEvent?.ends) && lotusEvent.ends.length > 0;
        const globalEventActive = !!vanillaGlobalEvent;

        happyHourSpan.classList.toggle('no-event', !happyHourActive);
        happyHourSpan.classList.toggle('crazy-happy-hour', happyHourAmount > 4);
        lotusSpan.classList.toggle('hs-hidden', !lotusActive);
        globalEventSpan.classList.toggle('hs-hidden', !globalEventActive);

        HSLogger.debug(() => `Events quickbar updated: Happy Hour: "${hhTooltipText}", Lotus: "${lotusTooltipText}", Global Event: "${globalEventTooltip}"`, this.context);
    }

    /** Format happy hour event end-times into tooltip text. */
    #formatHappyHourTooltip(happyHourEvent: any, happyHourAmount: number): string {
        if (happyHourEvent?.ends && happyHourEvent.ends.length > 0) {
            const maxDisplayed = 4;
            const displayed = happyHourEvent.ends
                .slice(0, maxDisplayed)
                .map((e: any) => new Date(e).toLocaleTimeString(undefined, { hour12: false }));

            const moreCount = happyHourEvent.ends.length - displayed.length;
            const suffix = moreCount > 0 ? `, (+${moreCount}...)` : '';
            return `${happyHourAmount} HH ending at: ${displayed.join(', ')}${suffix}`;
        }
        return 'No active HH';
    }

    /** Format lotus event end-time into tooltip text. */
    #formatLotusTooltip(lotusEvent: any): string {
        if (lotusEvent?.ends && lotusEvent.ends.length > 0) {
            const lotusEndTime = new Date(lotusEvent.ends[0]).toLocaleTimeString(undefined, { hour12: false });
            return `Lotus until: ${lotusEndTime}`;
        }
        return 'No active Lotus';
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
