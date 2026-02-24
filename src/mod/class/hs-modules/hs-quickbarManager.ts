// hs-quickbarManager.ts
// HSQuickbarManager: Central manager for quickbar sections in hs-autosing

type QuickbarSectionFactory = () => HTMLElement;

export class HSQuickbarManager {
    private static instance: HSQuickbarManager;
    private sectionFactories: Map<string, QuickbarSectionFactory> = new Map();
    private sectionElements: Map<string, HTMLElement> = new Map();
    private injected = false;
    private sectionInjectedCallbacks: Map<string, (() => void)[]> = new Map();
    private sectionOrder: string[] = [];

    // Hard-coded desired order for quickbars (left-to-right)
    private static readonly QUICKBAR_ORDER: string[] = [
        'automation', // left-most
        'other',      // add other quickbars here
        'ambrosia'    // right-most
    ];

    // --- Promise-based synchronization additions ---
    private sectionInjectedPromises: Map<string, Promise<void>> = new Map();
    private sectionInjectedResolvers: Map<string, () => void> = new Map();

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
        if (!header) throw new Error('Header element not found');
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
    public registerSection(id: string, factory: QuickbarSectionFactory): void {
        // Diagnostic log
        if ((window as any).HSLogger) (window as any).HSLogger.debug(`[HSQuickbarManager]: registerSection(${id}) called`);
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
    public injectSection(id: string, parent?: HTMLElement): void {
        if ((window as any).HSLogger) (window as any).HSLogger.debug(`[HSQuickbarManager]: injectSection(${id}) called`);
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
        if ((window as any).HSLogger) (window as any).HSLogger.debug(`[HSQuickbarManager]: injecting section ${id}`);
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
    public whenSectionInjected(id: string): Promise<void> {
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
    public onSectionInjected(id: string, callback: () => void): void {
        if ((window as any).HSLogger) (window as any).HSLogger.debug(`[HSQuickbarManager]: onSectionInjected(${id}) called`);
        if (this.sectionElements.has(id)) {
            // Already injected, call immediately
            if ((window as any).HSLogger) (window as any).HSLogger.debug(`[HSQuickbarManager]: section ${id} already injected, calling callback immediately`);
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
    public getSectionOrder(): string[] {
        return [...this.sectionOrder];
    }

    /**
     * Get the DOM element for a registered section (after injection)
     */
    public getSection(id: string): HTMLElement | undefined {
        if ((window as any).HSLogger) (window as any).HSLogger.debug(`[HSQuickbarManager]: getSection(${id}) called`);
        return this.sectionElements.get(id);
    }

    /**
     * Remove a section by ID
     */
    public removeSection(id: string): void {
        this.sectionFactories.delete(id);
        this.sectionOrder = this.sectionOrder.filter(x => x !== id);
        const el = this.sectionElements.get(id);
        if (el && el.parentElement) {
            el.parentElement.removeChild(el);
        }
        this.sectionElements.delete(id);
        this.injected = false;
    }


    /**
     * Inject all registered quickbar sections into the quickbar row in order.
     * If no parent is provided, uses ensureQuickbarsRow().
     * Calls any registered section injected callbacks after injection.
     */
    /*
    public injectAll(parent?: HTMLElement): void {
        if ((window as any).HSLogger) (window as any).HSLogger.debug(`[HSQuickbarManager]: injectAll called`);
        const row = parent || HSQuickbarManager.ensureQuickbarsRow();
        if (!row) return;
        // Remove previous injected elements
        for (const el of this.sectionElements.values()) {
            if (el.parentElement === row) {
                row.removeChild(el);
            }
        }
        this.sectionElements.clear();
        // Update sectionOrder to match QUICKBAR_ORDER, only including registered sections
        this.sectionOrder = HSQuickbarManager.QUICKBAR_ORDER.filter(id => this.sectionFactories.has(id));

        // Inject in hard-coded order
        for (const id of this.sectionOrder) {
            const factory = this.sectionFactories.get(id);
            if (!factory) continue;
            if ((window as any).HSLogger) (window as any).HSLogger.debug(`[HSQuickbarManager]: injecting section ${id}`);
            const el = factory();
            row.appendChild(el);
            this.sectionElements.set(id, el);
            // Call section injected callbacks if any
            const callbacks = this.sectionInjectedCallbacks.get(id);
            if (callbacks) {
                for (const cb of callbacks) {
                    try { cb(); } catch (e) { } // ignore callback errors
                }
            }
            // --- Promise-based: resolve the injection promise ---
            const resolver = this.sectionInjectedResolvers.get(id);
            if (resolver) {
                resolver();
                // Remove resolver after use to avoid memory leaks
                this.sectionInjectedResolvers.delete(id);
            }
        }
        this.injected = true;
    }
    */
}
