import { HSLogger } from "../hs-core/hs-logger";

type QuickbarSectionFactory = () => HTMLElement;
export type QUICKBAR_ID = typeof HSQuickbarManager.QUICKBAR_IDS[keyof typeof HSQuickbarManager.QUICKBAR_IDS];
export class HSQuickbarManager {
    private static instance: HSQuickbarManager;
    private sectionFactories: Map<QUICKBAR_ID, QuickbarSectionFactory> = new Map();
    private sectionElements: Map<QUICKBAR_ID, HTMLElement> = new Map();
    private injected = false;
    private sectionInjectedCallbacks: Map<QUICKBAR_ID, (() => void)[]> = new Map();
    private sectionOrder: QUICKBAR_ID[] = [];

    /** Canonical, type-safe quickbar IDs. Use for all quickbar references. */
    public static readonly QUICKBAR_IDS = {
        EVENTS: 'events',
        AUTOMATION: 'automation',
        // OTHER: 'other', // add other quickbars as needed
        AMBROSIA: 'ambrosia',
    } as const;

    // Hard-coded desired order for quickbars (left-to-right)
    private static readonly QUICKBAR_ORDER: QUICKBAR_ID[] = [
        HSQuickbarManager.QUICKBAR_IDS.EVENTS,     // left-most
        HSQuickbarManager.QUICKBAR_IDS.AUTOMATION, 
        HSQuickbarManager.QUICKBAR_IDS.AMBROSIA    // right-most
    ];

    // --- Promise-based synchronization additions ---
    private sectionInjectedPromises: Map<QUICKBAR_ID, Promise<void>> = new Map();
    private sectionInjectedResolvers: Map<QUICKBAR_ID, () => void> = new Map();


    private constructor() {}


    public static getInstance(): HSQuickbarManager {
        if (!HSQuickbarManager.instance) {
            HSQuickbarManager.instance = new HSQuickbarManager();
        }
        return HSQuickbarManager.instance;
    }

    /**
     * Ensure #quickbarsRow exists in the DOM, inserted before .navbar in header.
     * Returns the #quickbarsRow element.
     */
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

    /**
     * Get #quickbarsRow if present, else undefined.
     */
    public static getQuickbarsRow(): HTMLDivElement | undefined {
        let header = document.querySelector('header');
        if (!header) return undefined;
        return header.querySelector('#quickbarsRow') as HTMLDivElement | null || undefined;
    }

    /**
     * Register a quickbar section by id and factory function.
     * If already registered, replaces the factory.
     */
    public registerSection(id: QUICKBAR_ID, factory: QuickbarSectionFactory): void {
        // Diagnostic log
        HSLogger.debug(`registerSection(${id}) called`, "HSQuickbarManager");
        this.sectionFactories.set(id, factory);
        if (!this.sectionOrder.includes(id)) {
            this.sectionOrder.push(id);
        }
        this.injected = false;
        // --- Promise-based: create a new promise if not present ---
        if (!this.sectionInjectedPromises.has(id)) {
            this.sectionInjectedPromises.set(id, new Promise(resolve => {
                this.sectionInjectedResolvers.set(id, resolve);
            }));
        }
    }
   
    /**
     * Inject or update a single quickbar section by id, without affecting others.
     * If the section is not registered, does nothing.
     * If no parent is provided, uses ensureQuickbarsRow().
     */
    public injectSection(id: QUICKBAR_ID, parent?: HTMLElement): void {
        HSLogger.debug(`injectSection(${id}) called`, "HSQuickbarManager");
        const row = parent || HSQuickbarManager.ensureQuickbarsRow();
        if (!row) return;

        // Only inject/update the targeted quickbar section
        // Remove existing element for this section if present
        const existing = this.sectionElements.get(id);
        if (existing && existing.parentElement === row) {
            row.removeChild(existing);
        }

        // Update sectionOrder to match QUICKBAR_ORDER, only including registered sections
        this.sectionOrder = HSQuickbarManager.QUICKBAR_ORDER.filter(sectionId => this.sectionFactories.has(sectionId));

        // Find the correct insertion index for this section
        const insertIndex = this.sectionOrder.indexOf(id);
        if (insertIndex === -1) return; // Not registered

        // Create the new element
        const factory = this.sectionFactories.get(id);
        if (!factory) return;
        HSLogger.debug(`injecting section ${id}`, "HSQuickbarManager");
        const el = factory();

        // Find the next quickbar element in order (if any)
        let nextElement: HTMLElement | null = null;
        for (let i = insertIndex + 1; i < this.sectionOrder.length; i++) {
            const nextId = this.sectionOrder[i];
            const nextEl = this.sectionElements.get(nextId);
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
        this.sectionElements.set(id, el);

        // Call section injected callbacks if any
        const callbacks = this.sectionInjectedCallbacks.get(id);
        if (callbacks) {
            for (const cb of callbacks) {
                try { cb(); } catch (e) { /* ignore */ }
            }
        }
        // --- Promise-based: resolve the injection promise ---
        const resolver = this.sectionInjectedResolvers.get(id);
        if (resolver) {
            resolver();
            this.sectionInjectedResolvers.delete(id);
        }
    }

    /**
     * Returns a promise that resolves when the given section is injected.
     * Use this for robust async coordination.
     */
    public whenSectionInjected(id: QUICKBAR_ID): Promise<void> {
        // If already injected, return resolved promise
        if (this.sectionElements.has(id)) {
            return Promise.resolve();
        }
        // Otherwise, return or create the promise
        if (!this.sectionInjectedPromises.has(id)) {
            this.sectionInjectedPromises.set(id, new Promise(resolve => {
                this.sectionInjectedResolvers.set(id, resolve);
            }));
        }
        return this.sectionInjectedPromises.get(id)!;
    }

    /**
     * Register a callback to be called when a section is injected.
     * If already injected, calls immediately.
     */
    public onSectionInjected(id: QUICKBAR_ID, callback: () => void): void {
        HSLogger.debug(`onSectionInjected(${id}) called`, "HSQuickbarManager");
        if (this.sectionElements.has(id)) {
            // Already injected, call immediately
            HSLogger.debug(`section ${id} already injected, calling callback immediately`, "HSQuickbarManager");
            callback();
            return;
        }
        if (!this.sectionInjectedCallbacks.has(id)) {
            this.sectionInjectedCallbacks.set(id, []);
        }
        this.sectionInjectedCallbacks.get(id)!.push(callback);
    }

    /**
     * Get the order of registered section IDs
     */
    public getSectionOrder(): QUICKBAR_ID[] {
        return [...this.sectionOrder];
    }

    /**
     * Get the DOM element for a registered section (after injection)
     */
    public getSection(id: QUICKBAR_ID): HTMLElement | undefined {
        HSLogger.debug(`getSection(${id}) called`, "HSQuickbarManager");
        return this.sectionElements.get(id);
    }

    public enableQuickbar(
        id: QUICKBAR_ID,
        factory: QuickbarSectionFactory,
        setupCallback?: (section: HTMLElement) => void
    ): void {
        this.registerSection(id, factory);
        this.injectSection(id);
        this.whenSectionInjected(id).then(() => {
            const section = this.getSection(id);
            if (section && setupCallback) {
                try { setupCallback(section); } catch (e) { /* ignore errors in callback */ }
            }
        });
    }

    public disableQuickbar(
        id: QUICKBAR_ID,
        teardownCallback?: () => void
    ): void {
        if (teardownCallback) {
            try { teardownCallback(); } catch (e) { /* ignore */ }
        }
        this.removeSection(id);
    }

    /**
     * Remove a section by ID
     */
    public removeSection(id: QUICKBAR_ID): void {
        HSLogger.debug(`removeSection(${id}) called`, "HSQuickbarManager");
        this.sectionFactories.delete(id);
        this.sectionOrder = this.sectionOrder.filter(x => x !== id);
        const el = this.sectionElements.get(id);
        if (el && el.parentElement) {
            el.parentElement.removeChild(el);
        }
        this.sectionElements.delete(id);
        this.injected = false;
    }
}
