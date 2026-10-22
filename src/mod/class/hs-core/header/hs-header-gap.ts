/** Collapses unused space after the header's last visible module while keeping its layout cells intact. */
export class HSHeaderGap {
    static #enabled = false;
    static #frame?: number;
    static #observer?: MutationObserver;
    static #resize?: ResizeObserver;
    static #regions = new WeakSet<HTMLElement>();
    static #modules = new WeakSet<HTMLElement>();
    static readonly #REGION_IDS = ['ascensionStats', 'headerGrid', 'quickbarsRow'];

    static setEnabled(enabled: boolean): void {
        HSHeaderGap.#enabled = enabled;
        document.documentElement.classList.toggle('hs-remove-header-gap', enabled);
        HSHeaderGap.#observer?.disconnect();
        HSHeaderGap.#resize?.disconnect();
        if (HSHeaderGap.#frame !== undefined) cancelAnimationFrame(HSHeaderGap.#frame);
        HSHeaderGap.#frame = undefined;
        HSHeaderGap.#clear();
        if (!enabled) return;
        const header = document.getElementById('mainHeader');
        if (!header) return;
        HSHeaderGap.#regions = new WeakSet();
        HSHeaderGap.#modules = new WeakSet();
        HSHeaderGap.#observer = new MutationObserver(() => HSHeaderGap.#schedule());
        HSHeaderGap.#resize = new ResizeObserver(() => HSHeaderGap.#schedule());
        HSHeaderGap.#observer.observe(header, { childList: true, attributes: true, attributeFilter: ['class'] });
        HSHeaderGap.#observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-mobile'] });
        HSHeaderGap.#schedule();
    }

    static #clear(): void {
        for (const id of HSHeaderGap.#REGION_IDS) {
            const region = document.getElementById(id);
            region?.classList.remove('hs-header-gap-last', 'hs-header-gap-empty');
            region?.style.removeProperty('--hs-header-gap-margin');
        }
    }

    static #schedule(): void {
        if (!HSHeaderGap.#enabled || HSHeaderGap.#frame !== undefined) return;
        HSHeaderGap.#frame = requestAnimationFrame(() => {
            HSHeaderGap.#frame = undefined;
            HSHeaderGap.#refresh();
        });
    }

    static #refresh(): void {
        HSHeaderGap.#clear();
        if (!HSHeaderGap.#enabled || document.getElementById('mainHeader')?.classList.contains('headerEditMode')) return;
        let last: { element: HTMLElement; bottom: number } | undefined;
        let contentBottom = -Infinity;
        for (const id of HSHeaderGap.#REGION_IDS) {
            const region = document.getElementById(id);
            if (!region) continue;
            if (!HSHeaderGap.#regions.has(region)) {
                HSHeaderGap.#regions.add(region);
                HSHeaderGap.#observer?.observe(region, { childList: true });
                HSHeaderGap.#resize?.observe(region);
            }
            const modules = id === 'quickbarsRow' ? Array.from(region.children).filter((el): el is HTMLElement => el instanceof HTMLElement)
                : Array.from(region.querySelectorAll<HTMLElement>('.headerModule'));
            let visible = false;
            for (const module of modules) {
                if (!HSHeaderGap.#modules.has(module)) {
                    HSHeaderGap.#modules.add(module);
                    HSHeaderGap.#resize?.observe(module);
                    HSHeaderGap.#observer?.observe(module, {
                        attributes: true, attributeFilter: ['class', 'data-size', 'data-hs-header-vertical', 'hidden'],
                    });
                }
                const box = module.getBoundingClientRect();
                if (!box.width || !box.height) continue;
                visible = true;
                contentBottom = Math.max(contentBottom, box.bottom);
                // The levels line can hang below the top row, outside its module's box.
                for (const line of module.querySelectorAll<HTMLElement>('.hs-corruption-header-levels')) {
                    const bounds = line.getBoundingClientRect();
                    if (bounds.height) contentBottom = Math.max(contentBottom, bounds.bottom);
                }
            }
            if (!visible) {
                region.classList.add('hs-header-gap-empty');
                continue;
            }
            const bottom = region.getBoundingClientRect().bottom;
            if (!last || bottom >= last.bottom) last = { element: region, bottom };
        }
        if (last) {
            last.element.classList.add('hs-header-gap-last');
            last.element.style.setProperty('--hs-header-gap-margin', `${contentBottom - last.bottom}px`);
        }
    }
}
