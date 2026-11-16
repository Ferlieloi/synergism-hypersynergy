import { HSElementHooker } from "../../hs-core/hs-elementhooker";
import { HSLogger } from "../../hs-core/hs-logger";
import { HSSearchField, HSSearchResults, HSSearchWords, readHoverTooltip } from "./hs-singularity-search-field";
import { matchesSearch, normalizeSearchText, searchTerms } from "./hs-singularity-search-match";

const ACTIVE_CLASS = 'hs-sing-search-active';
const HIT_CLASS = 'hs-sing-search-hit';
// On the column while the cards cover it
const COVERED_CLASS = 'hs-sing-search-covered';
// The game's class on a maxed upgrade its "Maxed Upgrades: HIDE" toggle hides
const HIDDEN_MAXED_CLASS = 'upgradeHiddenByMaxLevel';
// Golden Quarks: the gap between the cards and the box, the narrowest cards worth showing, the widest
const BESIDE_GAP = 16;
const BESIDE_MIN_WIDTH = 280;
const BESIDE_MAX_WIDTH = 440;

export interface HSUpgradeGridOptions {
    /** In the log: "Golden Quark", "Octeract" */
    name: string;
    containerId: string;
    /** The upgrade AP line at the top of the grid's box: the field goes right under it, unless there's a column */
    apLineId: string;
    /**
     * The column beside the box (the octeract stats): the field goes at its top, the cards over the rest of it.
     * Without one, the cards go left of the box.
     */
    columnId?: string;
    upgradeSelector: string;
    maxedToggleId: string;
    placeholder: string;
    /** The clickable words under the field */
    words: readonly string[];
}

interface HSReadUpgrade {
    upgrade: HTMLElement;
    text: string;
}

/**
 * The search field of an upgrade grid (Golden Quarks, Octeracts): the matching upgrades stay lit, the others are
 * dimmed, and their tooltips are listed as cards where there's room for them. Part of HSSingularitySearch.
 */
export class HSUpgradeGridSearch {
    readonly #options: HSUpgradeGridOptions;
    readonly #context: string;
    #shown = false;
    #container?: HTMLElement;
    #row?: HTMLElement;
    #field?: HSSearchField;
    #words?: HSSearchWords;
    #results?: HSSearchResults;
    #upgrades: HSReadUpgrade[] = [];

    constructor(options: HSUpgradeGridOptions, context: string) {
        this.#options = options;
        this.#context = context;
    }

    async show(): Promise<void> {
        this.#shown = true;
        const { name, containerId, upgradeSelector, maxedToggleId } = this.#options;

        this.#container ??= await HSElementHooker.HookElement(`#${containerId}`) ?? undefined;
        const firstUpgrade = await HSElementHooker.HookElement(`#${containerId} ${upgradeSelector}`);
        if (!this.#container || !firstUpgrade) {
            HSLogger.warn(`${name} upgrade search not added: game elements not found`, this.#context);
            return;
        }
        // Turned off again while waiting for the game
        if (!this.#shown) return;

        if (!readHoverTooltip(firstUpgrade, 'mouseout')) {
            HSLogger.log(`${name} upgrade search not added: upgrade tooltips only open on hover`, this.#context);
            return;
        }

        if (!this.#row) {
            this.#row = this.#build();
            // Showing or hiding the maxed upgrades changes the count. Read once the game's own listener has run.
            document.getElementById(maxedToggleId)?.addEventListener('click', () => {
                window.setTimeout(() => this.#search(), 0);
            });
        }
        this.refresh();
    }

    hide(): void {
        this.#shown = false;
        if (!this.#row || !this.#field) return;

        this.#field.clear();
        this.#row.remove();
        this.#results?.element.remove();
        this.#upgrades = [];
    }

    /**
     * The subtab was opened, or the field added: the field is put back in place (the game rebuilds the octeract box
     * the first time its subtab opens) and the tooltips read again, for their current text and language.
     */
    refresh(): void {
        if (!this.#shown || !this.#row || !this.#container) return;

        this.#place();
        this.#upgrades = this.#readUpgrades();
        this.#words?.refresh(this.#upgrades.map(({ text }) => text));
        this.#search();
    }

    #build(): HTMLElement {
        const row = document.createElement('div');
        row.className = 'hs-sing-search-row';
        this.#field = new HSSearchField(this.#options.placeholder, () => this.#search());
        this.#words = new HSSearchWords(this.#options.words, this.#field);
        this.#results = new HSSearchResults('No upgrade found');
        row.append(this.#field.element, this.#words.element);
        return row;
    }

    /** The column's top, or under the box's AP line; the cards in the column, or beside the box (out of it: its hover
     * styles would apply to the grid's icons while the mouse is on the cards). */
    #place(): void {
        if (!this.#row || !this.#results || !this.#container) return;

        const column = this.#column();
        if (column) {
            if (this.#row.parentElement !== column) column.prepend(this.#row);
            if (this.#results.element.parentElement !== column) column.append(this.#results.element);
            return;
        }

        if (!this.#row.isConnected) {
            const apLine = document.getElementById(this.#options.apLineId);
            if (apLine?.parentElement === this.#container) apLine.after(this.#row);
            else this.#container.prepend(this.#row);
        }
        if (!this.#results.element.isConnected) this.#container.after(this.#results.element);
    }

    #column(): HTMLElement | null {
        return this.#options.columnId ? document.getElementById(this.#options.columnId) : null;
    }

    #search(): void {
        if (!this.#field || !this.#container) return;

        const terms = searchTerms(this.#field.value);
        const searching = terms.length > 0;
        const hits = searching
            ? this.#upgrades.filter(({ text }) => matchesSearch(text, terms)).map(({ upgrade }) => upgrade)
            : [];
        const hitSet = new Set(hits);

        for (const { upgrade } of this.#upgrades) upgrade.classList.toggle(HIT_CLASS, hitSet.has(upgrade));
        this.#container.classList.toggle(ACTIVE_CLASS, searching);

        const shownHits = hits.filter(upgrade => !upgrade.classList.contains(HIDDEN_MAXED_CLASS));
        const hidden = hits.length - shownHits.length;
        const hint = hidden === 0 ? undefined
            : `${hidden} maxed upgrade${hidden === 1 ? '' : 's'} match, hidden by the game's Maxed Upgrades button`;
        this.#showCards(searching ? shownHits : null, hint);

        if (!searching) {
            this.#field.setCount('');
            return;
        }
        const shown = shownHits.length;
        const results = `${shown} result${shown === 1 ? '' : 's'}`;
        if (hidden === 0) this.#field.setCount(results);
        else this.#field.setCount(`${results} (+${hidden} hidden)`, `${shown} (+${hidden})`);
    }

    /**
     * The cards of the upgrades found, read again for their current values. None where there's no room: the
     * dimming alone shows them. The maxed upgrades the game's toggle hides get none: they're counted apart, and
     * `hint` says so under the cards.
     */
    #showCards(upgrades: HTMLElement[] | null, hint?: string): void {
        if (!this.#results) return;

        const column = this.#column();
        const fits = upgrades !== null && this.#positionResults(column);
        column?.classList.toggle(COVERED_CLASS, fits);
        this.#results.show(fits ? upgrades.map(HSUpgradeGridSearch.#readCard) : null, hint);
    }

    /** Puts the cards' box in place for this window's layout; false when there's no room for it. */
    #positionResults(column: HTMLElement | null): boolean {
        const results = this.#results?.element;
        if (!results || !this.#row || !this.#container) return false;

        if (column) {
            // The game stacks the column over the grid in a narrow window: the cards would cover the grid
            if (column.getBoundingClientRect().right > this.#container.getBoundingClientRect().left) return false;
            results.style.top = `${this.#row.offsetTop + this.#row.offsetHeight + 6}px`;
            return true;
        }

        // The room left of the box, which the game centres
        const room = this.#container.getBoundingClientRect().left - BESIDE_GAP - 8;
        if (room < BESIDE_MIN_WIDTH) return false;
        const width = Math.min(room, BESIDE_MAX_WIDTH);
        results.style.width = `${width}px`;
        results.style.top = `${this.#container.offsetTop}px`;
        results.style.left = `${this.#container.offsetLeft - BESIDE_GAP - width}px`;
        return true;
    }

    /** Every upgrade of the grid, maxed ones hidden by the game's toggle included: they are counted apart. */
    #readUpgrades(): HSReadUpgrade[] {
        const upgrades: HSReadUpgrade[] = [];
        this.#container?.querySelectorAll<HTMLElement>(this.#options.upgradeSelector).forEach((upgrade) => {
            const tooltip = readHoverTooltip(upgrade, 'mouseout');
            if (tooltip) upgrades.push({ upgrade, text: HSUpgradeGridSearch.#searchableText(upgrade, tooltip) });
        });
        return upgrades;
    }

    /**
     * Name and description only: the level, cost and AP lines would make "level" or "quarks" match every upgrade.
     * The tooltip's first line is the name. Its description is the game's translated text, also on the button's
     * aria-label: taken from there, as the tooltip's lines carry no class.
     * textContent, as the tooltip's still hidden when it's read and innerText would be empty.
     */
    static #searchableText(upgrade: HTMLElement, tooltip: HTMLElement): string {
        const name = tooltip.querySelector(':scope > span')?.textContent ?? '';
        const description = upgrade.getAttribute('aria-label') ?? '';
        return normalizeSearchText(`${name} ${description}`);
    }

    /**
     * The upgrade's tooltip as a compact card: name and level on one row, description, effect. The cost, the quarks
     * or octeracts spent and the AP lines are left to the game's tooltip, on the lit upgrade in the grid.
     * The tooltip's lines carry no class: they're the spans between its <br>, the description the light blue one, the
     * effect the next gold one. Another shape (a game update) gives the whole tooltip.
     */
    static #readCard(upgrade: HTMLElement): HTMLElement {
        const card = document.createElement('div');
        card.className = 'hs-sing-search-card';
        const tooltip = readHoverTooltip(upgrade, 'mouseout');
        if (!tooltip) return card;

        const lines: Node[][] = [[]];
        for (const node of [...tooltip.childNodes]) {
            if (node.nodeName === 'BR') lines.push([]);
            else lines[lines.length - 1].push(node);
        }
        const coloured = (line: Node[], colour: string) =>
            line.some(node => node instanceof HTMLElement && (node.getAttribute('style') ?? '').includes(colour));
        const descriptionIndex = lines.findIndex(line => coloured(line, '--lightblue-color'));
        const effectIndex = descriptionIndex < 2 ? -1
            : lines.findIndex((line, i) => i > descriptionIndex && coloured(line, '--gold-color'));

        if (effectIndex < 0) {
            card.append(...tooltip.childNodes);
            return card;
        }

        const part = (className: string, nodes: Node[]) => {
            const element = document.createElement('div');
            element.className = className;
            element.append(...nodes);
            return element;
        };
        const title = part('hs-sing-search-card-title', lines[0]);
        title.append(part('hs-sing-search-card-level', lines[1]));
        card.append(
            title,
            part('hs-sing-search-card-description', lines[descriptionIndex]),
            part('hs-sing-search-card-effect', lines[effectIndex]),
        );
        return card;
    }
}
