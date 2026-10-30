import { HSGlobal } from '../hs-global';

/** Button slots share the game's renderer, drag targets and capacity; the patch lets that capacity follow the grid. */
export class HSHeaderButtons {
    static #capacity = 4;
    static #installed = false;
    static #renderQueued = false;

    static install(): void {
        if (HSHeaderButtons.#installed) return;
        HSHeaderButtons.#installed = true;
        if (window.__HS_HEADER_BUTTONS_PATCHED) {
            window.__HS_headerButtonCapacity = () => HSHeaderButtons.#capacity;
        }
        const grid = document.getElementById('headerGrid');
        if (grid) new ResizeObserver(() => HSHeaderButtons.refresh()).observe(grid);
        HSHeaderButtons.refresh();
    }

    static refresh(): void {
        if (!HSHeaderButtons.#installed) return;
        const grid = document.getElementById('headerGrid');
        const header = document.getElementById('mainHeader');
        if (!grid || !header) return;

        const style = getComputedStyle(grid);
        const columns = Number.parseInt(style.getPropertyValue('--header-grid-columns'), 10)
            || (document.documentElement.dataset.mobile === 'true' ? 2 : 7);
        const gap = Number.parseFloat(style.columnGap) || 0;
        const cellWidth = (grid.clientWidth - gap * (columns - 1)) / columns;
        let buttonWidth = 0;
        for (const button of header.querySelectorAll<HTMLElement>('.resetbtn.headerModule')) {
            const width = button.getBoundingClientRect().width;
            if (!width) continue;
            const buttonStyle = getComputedStyle(button);
            const margins = (Number.parseFloat(buttonStyle.marginLeft) || 0) + (Number.parseFloat(buttonStyle.marginRight) || 0);
            // Aligned groups use a 5px gap in place of the game's 5px button margin.
            buttonWidth = Math.max(buttonWidth, width + Math.max(5, margins));
        }
        if (window.__HS_HEADER_BUTTONS_PATCHED && cellWidth > 0 && buttonWidth > 0) {
            // There are eight native reset buttons. Existing larger groups wrap when the window gets narrower.
            const capacity = Math.max(1, Math.min(8, Math.floor(cellWidth / buttonWidth)));
            if (capacity !== HSHeaderButtons.#capacity) {
                HSHeaderButtons.#capacity = capacity;
                if (!HSHeaderButtons.#renderQueued) {
                    HSHeaderButtons.#renderQueued = true;
                    requestAnimationFrame(() => {
                        HSHeaderButtons.#renderQueued = false;
                        window.__HS_renderHeaderLayout?.();
                    });
                }
            }
        }

        const editing = header.classList.contains('headerEditMode');
        const key = document.documentElement.dataset.mobile === 'true' ? 'mobile' : 'desktop';
        const positions = (HSGlobal.exposedPlayer as { headerLayouts?: Record<string, { positions?: Record<string, number> }> } | null)
            ?.headerLayouts?.[key]?.positions;
        const positionOf = (button: HTMLElement): number => positions?.[button.id] ?? Number(button.style.gridColumn || 1) - 1;
        for (const slot of header.querySelectorAll<HTMLElement>('.headerRegion > .headerStackRow')) {
            const buttons = Array.from(slot.querySelectorAll<HTMLElement>(':scope > .resetbtn.headerModule'))
                .filter(button => !button.hidden && !button.classList.contains('headerModuleLocked'))
                .sort((a, b) => positionOf(a) - positionOf(b));
            const aligned = !!slot.dataset.hsHeaderAlign && !editing;
            const capacity = HSHeaderButtons.#capacity;
            slot.style.gridTemplateColumns = `repeat(${capacity}, minmax(0, 1fr))`;
            // The game's mobile default may translate a run of neighbouring slots; explicit alignment is per slot.
            if (slot.dataset.hsHeaderAlign) slot.style.translate = 'none';
            buttons.forEach((button, index) => {
                // Flex alignment uses only real buttons in their saved order, never vacant drag/drop columns.
                // Keep the game's positions underneath it so editing still uses its original drop targets.
                button.style.order = aligned ? String(index) : '';
                const position = positionOf(button);
                button.style.gridColumn = String(position % capacity + 1);
                button.style.gridRow = String(Math.floor(position / capacity) + 1);
            });
        }
    }
}
