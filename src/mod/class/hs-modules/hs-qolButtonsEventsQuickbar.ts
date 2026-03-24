import { HSModuleManager } from "../hs-core/module/hs-module-manager";
import { HSGameDataAPI } from "../hs-core/gds/hs-gamedata-api";
import { HSLogger } from "../hs-core/hs-logger";

/**
 * Events Quickbar component.
 *
 * Responsibility:
 * - Create and manage a small quickbar that displays time-limited event indicators
 *   (e.g. Happy Hour, Lotus of Rejuvenation) in the header quickbars row.
 * - Subscribe to `HSGameDataAPI` for updates and refresh the DOM accordingly.
 *
 * Lifecycle:
 * - `createSection()` returns a container element for injection.
 * - `setup()` builds child DOM and subscribes to updates.
 * - `teardown()` unsubscribes and clears runtime state.
 */
export class HSQOLEventsQuickbar {
    private container: HTMLDivElement | null = null;
    private elements?: {
        happyHourSpan: HTMLSpanElement;
        happyHourAmountSpan: HTMLSpanElement;
        lotusSpan: HTMLSpanElement;
    };
    private unsubscribeEventData: (() => void) | null = null;

    /** Create and return the root DOM element for the Events quickbar section. */
    public createSection(): HTMLElement {
        const container = document.createElement('div');
        container.id = 'eventsQuickBar';
        container.className = 'hs-events-quickbar';
        return container;
    }

    /** Setup the quickbar section after injection. */
    public setup(container: HTMLDivElement): void {
        this.container = container;
        this.resetRuntime();
        this.createDOM();
        this.setupSubscription();
    }

    /** Teardown the quickbar section and cleanup resources. */
    public teardown(): void {
        this.cleanupSubscription();
        this.resetRuntime();
        this.container = null;
    }

    /** Reset ephemeral runtime state for the quickbar. */
    private resetRuntime(): void {
        if (this.container) this.container.innerHTML = '';
        this.elements = undefined;
    }

    /** Create the child DOM structure for the quickbar and cache element references. */
    private createDOM(): void {
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

        // Cache references for fast updates later
        this.elements = {
            happyHourSpan,
            happyHourAmountSpan: happyHourAmountSpan,
            lotusSpan
        };

        this.container.appendChild(happyHourSpan);
        this.container.appendChild(lotusSpan);
        HSLogger.debug('Events quickbar DOM created', 'HSQOLEventsQuickbar');
    }

    /** Pull latest event data and update the quickbar DOM. */
    private updateDOM(): void {
        if (!this.elements) return;
        const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        if (!gameDataAPI) return;
        const eventData = gameDataAPI.getEventData();
        if (!eventData) return;

        // Extract relevant events
        const happyHourEvent = eventData?.HAPPY_HOUR_BELL;
        const lotusEvent = eventData?.LOTUS_OF_REJUVENATION;
        const happyHourAmount = happyHourEvent?.amount ?? 0;

        // Build tooltip texts
        let hhTooltipText = '';
        if (happyHourEvent?.ends && happyHourEvent.ends.length > 0) {
            const hhEndsTimes = happyHourEvent.ends
                .map((e: any) => new Date(e).toLocaleTimeString(undefined, { hour12: false }))
                .join(', ');
            hhTooltipText = `${happyHourAmount} HH ending at: ${hhEndsTimes}`;
        } else {
            hhTooltipText = 'No active HH';
        }

        let lotusTooltipText = '';
        if (lotusEvent?.ends && lotusEvent.ends.length > 0) {
            const lotusEndTime = new Date(lotusEvent.ends[0]).toLocaleTimeString(undefined, { hour12: false });
            lotusTooltipText = `Lotus until: ${lotusEndTime}`;
        } else {
            lotusTooltipText = 'No active Lotus';
        }

        // Update cached elements with computed values and adjust visibility classes
        const { happyHourSpan, happyHourAmountSpan, lotusSpan } = this.elements;
        happyHourSpan.title = hhTooltipText;
        happyHourAmountSpan.textContent = `${happyHourAmount}`;
        if (happyHourEvent?.ends?.length === 0) {
            happyHourSpan.classList.add('no-event');
        } else {
            happyHourSpan.classList.remove('no-event');
        }

        lotusSpan.title = lotusTooltipText;
        if (lotusEvent?.ends?.length === 0) {
            lotusSpan.classList.add('hs-hidden');
        } else {
            lotusSpan.classList.remove('hs-hidden');
        }

        HSLogger.debug(`Events quickbar updated: Happy Hour: "${hhTooltipText}", Lotus: "${lotusTooltipText}"`, 'HSQOLEventsQuickbar');
    }

    /** Subscribe to game-data event changes and schedule DOM updates. */
    private setupSubscription(): void {
        if (this.unsubscribeEventData) return;
        if (!this.elements) return;
        const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        if (!gameDataAPI) return;

        if (gameDataAPI && typeof gameDataAPI.subscribeEventDataChange === 'function') {
            this.unsubscribeEventData = gameDataAPI.subscribeEventDataChange(() => { this.updateDOM(); }) ?? null;
            HSLogger.debug('Subscribed to event data changes for Events Quickbar', 'HSQOLEventsQuickbar');
        }
    }

    /** Cleanup any active subscription to game-data changes. */
    private cleanupSubscription(): void {
        if (this.unsubscribeEventData) {
            try { this.unsubscribeEventData(); } catch (e) { /* ignore */ }
            this.unsubscribeEventData = null;
            HSLogger.debug('Unsubscribed from event data changes for Events Quickbar', 'HSQOLEventsQuickbar');
        }
    }
}
