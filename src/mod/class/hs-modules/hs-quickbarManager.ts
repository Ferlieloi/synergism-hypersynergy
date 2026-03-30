import { HSLogger } from "../hs-core/hs-logger";

// Canonical factory: must return an object with `element` and optional `teardown`.
export type QuickbarSectionFactory = () => { element: HTMLElement; teardown?: () => void };
export type QUICKBAR_ID = typeof HSQuickbarManager.QUICKBAR_IDS[keyof typeof HSQuickbarManager.QUICKBAR_IDS];

/**
 * Class: HSQuickbarManager
 * IsExplicitHSModule: No
 * Description: Manages registration, injection, ordering, and lifecycle of small UI quickbar
 *     sections injected into the page header. Each section is provided via a
 *     `QuickbarSectionFactory` that returns an element and optional teardown.
 *
 * Public lifecycle: registerSection -> injectSection/setup -> removeSection.
 */
export class HSQuickbarManager {
    #context = 'HSQuickbarManager';
    static #instance: HSQuickbarManager;
    #sectionFactories: Map<QUICKBAR_ID, QuickbarSectionFactory> = new Map();
    #sectionElements: Map<QUICKBAR_ID, HTMLElement> = new Map();
    #injected = false;
    #sectionInjectedCallbacks: Map<QUICKBAR_ID, (() => void)[]> = new Map();
    #sectionOrder: QUICKBAR_ID[] = [];

    /** Canonical, type-safe quickbar IDs. Use for all quickbar references. */
    public static readonly QUICKBAR_IDS = {
        EVENTS: 'events',
        AUTOMATION: 'automation',
        // OTHER: 'other', // add other quickbars as needed
        AMBROSIA_MINIBARS: 'ambrosia-minibars',
        AMBROSIA: 'ambrosia',
    } as const;

    /** Hard-coded desired order for quickbars (left-to-right) */
    static readonly #QUICKBAR_ORDER: QUICKBAR_ID[] = [
        HSQuickbarManager.QUICKBAR_IDS.EVENTS,     // left-most
        HSQuickbarManager.QUICKBAR_IDS.AUTOMATION, 
        HSQuickbarManager.QUICKBAR_IDS.AMBROSIA_MINIBARS,
        HSQuickbarManager.QUICKBAR_IDS.AMBROSIA    // right-most
    ];

    // --- Promise-based synchronization additions ---
    #sectionInjectedPromises: Map<QUICKBAR_ID, Promise<void>> = new Map();
    #sectionInjectedResolvers: Map<QUICKBAR_ID, () => void> = new Map();
    #teardownCallbacks: Map<QUICKBAR_ID, () => void> = new Map();

    constructor() {}

    public static getInstance(): HSQuickbarManager {
        if (!HSQuickbarManager.#instance) {
            HSQuickbarManager.#instance = new HSQuickbarManager();
        }
        return HSQuickbarManager.#instance;
    }

    /** Ensure #quickbarsRow exists in the DOM and return it. */
    public static ensureQuickbarsRow(): HTMLDivElement {
        const header = document.querySelector('header');
        if (!header) throw new Error('[HSQuickbarManager] Header element not found');
        let quickbarsRow = header.querySelector('#quickbarsRow') as HTMLDivElement | null;
        if (!quickbarsRow) {
            quickbarsRow = document.createElement('div');
            quickbarsRow.id = 'quickbarsRow';
            // Insert before .navbar if present, else append to header
            const navbar = header.querySelector('.navbar');
            if (navbar) {
                header.insertBefore(quickbarsRow, navbar);
            } else {
                header.appendChild(quickbarsRow);
            }
        }
        return quickbarsRow;
    }

    /** Get the #quickbarsRow element if it exists, otherwise undefined. */
    public static getQuickbarsRow(): HTMLDivElement | undefined {
        let header = document.querySelector('header');
        if (!header) return undefined;
        return header.querySelector('#quickbarsRow') as HTMLDivElement | null || undefined;
    }

    /** Register a quickbar section factory for the given id. */
    public registerSection(id: QUICKBAR_ID, factory: QuickbarSectionFactory): void {
        HSLogger.debug(`registerSection(${id}) called`, this.#context);
        this.#sectionFactories.set(id, factory);
        if (!this.#sectionOrder.includes(id)) {
            this.#sectionOrder.push(id);
        }
        this.#injected = false;
        // --- Promise-based: create a new promise if not present ---
        if (!this.#sectionInjectedPromises.has(id)) {
            this.#sectionInjectedPromises.set(id, new Promise(resolve => {
                this.#sectionInjectedResolvers.set(id, resolve);
            }));
        }
    }
   
    /** Inject or update the DOM for a single quickbar section. */
    public injectSection(id: QUICKBAR_ID, parent?: HTMLElement): void {
        HSLogger.debug(`injectSection(${id}) called`, this.#context);
        const row = parent || HSQuickbarManager.ensureQuickbarsRow();
        if (!row) return;

        // Remove existing element for this section if present
        const existing = this.#sectionElements.get(id);
        if (existing && existing.parentElement === row) {
            row.removeChild(existing);
        }

        // Update sectionOrder to match QUICKBAR_ORDER, only including registered sections
        this.#sectionOrder = HSQuickbarManager.#QUICKBAR_ORDER.filter(sectionId => this.#sectionFactories.has(sectionId));

        // Find the correct insertion index for this section
        const insertIndex = this.#sectionOrder.indexOf(id);
        if (insertIndex === -1) return; // Not registered

        // Create the new element
        const factory = this.#sectionFactories.get(id);
        if (!factory) return;
        HSLogger.debug(`injecting section ${id}`, this.#context);
        const raw = factory();
        if (!raw || !raw.element) return;
        const el = raw.element;
        const maybeTeardown = raw.teardown;
        if (typeof maybeTeardown === 'function') {
            this.#teardownCallbacks.set(id, maybeTeardown);
        }

        // Find the next quickbar element in order (if any)
        let nextElement: HTMLElement | null = null;
        for (let i = insertIndex + 1; i < this.#sectionOrder.length; i++) {
            const nextId = this.#sectionOrder[i];
            const nextEl = this.#sectionElements.get(nextId);
            if (nextEl && nextEl.parentElement === row) {
                nextElement = nextEl;
                break;
            }
        }

        // Insert before nextElement if found, else append to row
        if (nextElement) {
            row.insertBefore(el, nextElement);
        } else {
            row.appendChild(el);
        }
        this.#sectionElements.set(id, el);

        // Call section injected callbacks if any
        const callbacks = this.#sectionInjectedCallbacks.get(id);
        if (callbacks) {
            for (const cb of callbacks) {
                try { cb(); } catch (e) { /* ignore */ }
            }
        }
        // --- Promise-based: resolve the injection promise ---
        const resolver = this.#sectionInjectedResolvers.get(id);
        if (resolver) {
            resolver();
            this.#sectionInjectedResolvers.delete(id);
        }
    }

    /** Return a promise that resolves when the specified section has been injected. */
    public whenSectionInjected(id: QUICKBAR_ID): Promise<void> {
        if (this.#sectionElements.has(id)) {
            return Promise.resolve();
        }
        if (!this.#sectionInjectedPromises.has(id)) {
            this.#sectionInjectedPromises.set(id, new Promise(resolve => {
                this.#sectionInjectedResolvers.set(id, resolve);
            }));
        }
        return this.#sectionInjectedPromises.get(id)!;
    }

    /** Register a callback to run when a section is injected (calls immediately if already injected). */
    public onSectionInjected(id: QUICKBAR_ID, callback: () => void): void {
        HSLogger.debug(`onSectionInjected(${id}) called`, this.#context);
        if (this.#sectionElements.has(id)) {
            HSLogger.debug(`section ${id} already injected, calling callback immediately`, this.#context);
            callback();
            return;
        }
        if (!this.#sectionInjectedCallbacks.has(id)) {
            this.#sectionInjectedCallbacks.set(id, []);
        }
        this.#sectionInjectedCallbacks.get(id)!.push(callback);
    }

    /** Return the current ordered list of registered section IDs. */
    public getSectionOrder(): QUICKBAR_ID[] {
        return [...this.#sectionOrder];
    }

    /** Return whether the section has already been injected into the DOM. */
    public isInjected(id: QUICKBAR_ID): boolean {
        return this.#sectionElements.has(id);
    }

    /** Get the DOM element for a registered section (after injection). */
    public getSection(id: QUICKBAR_ID): HTMLElement | undefined {
        HSLogger.debug(`getSection(${id}) called`, this.#context);
        return this.#sectionElements.get(id);
    }

    /** Register and enable a quickbar: registers the factory, injects the section, and runs setup callback. */
    public enableQuickbar(
        id: QUICKBAR_ID,
        factory: QuickbarSectionFactory,
        setupCallback?: (section: HTMLElement) => void,
        teardownCallback?: () => void
    ): Promise<HTMLElement> {
        this.registerSection(id, factory);
        // Store or clear teardown callback for this id (may be overridden by factory-returned teardown)
        if (teardownCallback) {
            this.#teardownCallbacks.set(id, teardownCallback);
        } else {
            this.#teardownCallbacks.delete(id);
        }
        this.injectSection(id);
        return this.whenSectionInjected(id).then(() => {
            const section = this.getSection(id)!;
            if (section && setupCallback) {
                try { setupCallback(section); } catch (e) { /* ignore errors in callback */ }
            }
            HSLogger.debug(`Quickbar ${id} enabled`, this.#context);
            return section;
        });
    }

    /** Run an optional teardown callback and disable the quickbar by removing its section. */
    public disableQuickbar(
        id: QUICKBAR_ID,
        teardownCallback?: () => void
    ): void {
        if (teardownCallback) {
            try { teardownCallback(); } catch (e) { /* ignore */ }
        }
        this.removeSection(id);
    }

    /** Remove a section by ID and run any stored teardown callback. */
    public removeSection(id: QUICKBAR_ID): void {
        HSLogger.debug(`removeSection(${id}) called`, this.#context);
        // Call stored teardown callback if any
        const td = this.#teardownCallbacks.get(id);
        if (td) {
            try { td(); } catch (e) { /* ignore teardown errors */ }
            this.#teardownCallbacks.delete(id);
        }

        this.#sectionFactories.delete(id);
        this.#sectionOrder = this.#sectionOrder.filter(x => x !== id);
        const el = this.#sectionElements.get(id);
        if (el && el.parentElement) {
            el.parentElement.removeChild(el);
        }
        this.#sectionElements.delete(id);
        this.#injected = false;
    }
}
