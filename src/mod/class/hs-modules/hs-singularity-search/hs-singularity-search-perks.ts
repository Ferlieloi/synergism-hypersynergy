import { HSElementHooker } from "../../hs-core/hs-elementhooker";
import { HSLogger } from "../../hs-core/hs-logger";
import { HSSearchField, HSSearchResults, HSSearchWords, readHoverTooltip } from "./hs-singularity-search-field";
import { matchesSearch, normalizeSearchText, searchTerms } from "./hs-singularity-search-match";

const PERK_SELECTOR = '#singularityPerksGrid .singularityPerkNode';
const ACTIVE_CLASS = 'hs-sing-search-perks-active';
const HIT_CLASS = 'hs-sing-search-hit';
// The clickable words under the field: what fits on one row
const SUBJECTS = ['quark', 'cube', 'oct', 'ant', 'luck', 'salvage', 'token', 'auto', 'challenge', 'purple'];

interface HSReadPerk {
    perk: HTMLElement;
    card: HTMLElement;
    text: string;
}

/**
 * The search field of the Perks / Penalties subtab: the tooltips of the matching perks cover the penalties text, the
 * other perks are dimmed in the tree. Part of HSSingularitySearch.
 */
export class HSPerksSearch {
    readonly #context: string;
    #shown = false;
    #info?: HTMLElement;
    #root?: HTMLElement;
    #field?: HSSearchField;
    #results?: HSSearchResults;
    #words?: HSSearchWords;

    constructor(context: string) {
        this.#context = context;
    }

    async show(): Promise<void> {
        this.#shown = true;

        this.#info ??= await HSElementHooker.HookElement('#singularityInfo') ?? undefined;
        const firstPerk = await HSElementHooker.HookElement(PERK_SELECTOR);
        if (!this.#info || !firstPerk) {
            HSLogger.warn('Perk search not added: game elements not found', this.#context);
            return;
        }
        // Turned off again while waiting for the game
        if (!this.#shown) return;

        if (!HSPerksSearch.#readTooltip(firstPerk)) {
            HSLogger.log('Perk search not added: perk tooltips only open on hover', this.#context);
            return;
        }

        this.#root ??= this.#build();
        this.#info.append(this.#root);
        this.refresh();
    }

    hide(): void {
        this.#shown = false;
        if (!this.#root || !this.#field) return;

        this.#field.clear();
        this.#root.remove();
    }

    /**
     * The subtab was opened, or the field added. A word that finds nothing isn't offered: nothing unlocked yet on
     * that subject, or another wording in the game's language.
     */
    refresh(): void {
        if (!this.#root?.isConnected) return;

        const perks = HSPerksSearch.#readShownPerks();
        this.#words?.refresh(perks.map(({ text }) => text));
        this.#showResults(perks);
    }

    #build(): HTMLElement {
        const root = document.createElement('div');
        root.id = 'hs-sing-search-perks';

        const field = new HSSearchField('[HS] Find a perk (cube, quark...)', () => this.#search());

        const words = new HSSearchWords(SUBJECTS, field);

        const results = new HSSearchResults('No perk found');
        results.element.id = 'hs-sing-search-perks-results';

        root.append(field.element, words.element, results.element);
        this.#field = field;
        this.#results = results;
        this.#words = words;
        return root;
    }

    #search(): void {
        if (!this.#field || !this.#root?.isConnected) return;
        this.#showResults(searchTerms(this.#field.value).length > 0 ? HSPerksSearch.#readShownPerks() : []);
    }

    #showResults(perks: HSReadPerk[]): void {
        if (!this.#field || !this.#results || !this.#info) return;

        const terms = searchTerms(this.#field.value);
        const searching = terms.length > 0;
        const hits = searching ? perks.filter(({ text }) => matchesSearch(text, terms)) : [];
        const cards = hits.map(({ card }) => card);

        this.#info.querySelectorAll(`.${HIT_CLASS}`).forEach(perk => perk.classList.remove(HIT_CLASS));
        hits.forEach(({ perk }) => perk.classList.add(HIT_CLASS));

        this.#info.classList.toggle(ACTIVE_CLASS, searching);
        this.#field.setCount(searching ? `${cards.length} result${cards.length === 1 ? '' : 's'}` : '');
        this.#results.show(searching ? cards : null);
    }

    /** The perks the game shows. What it hides stays hidden: the perks further than its next previews. */
    static #readShownPerks(): HSReadPerk[] {
        const perks: HSReadPerk[] = [];
        document.querySelectorAll<HTMLElement>(PERK_SELECTOR).forEach((perk) => {
            const card = perk.style.display !== 'none' ? HSPerksSearch.#readTooltip(perk) : null;
            if (card) perks.push({ perk, card, text: HSPerksSearch.#searchableText(card) });
        });
        return perks;
    }

    /** A copy of the perk's tooltip as the game draws it, or null when hovering opened none. */
    static #readTooltip(perk: HTMLElement): HTMLElement | null {
        return readHoverTooltip(perk, 'mouseleave')?.querySelector<HTMLElement>(':scope > .singularityPerkModal') ?? null;
    }

    // Name and description only: the level lines would make "level" match every perk.
    // textContent, as the tooltip's still hidden when it's read and innerText would be empty.
    static #searchableText(card: HTMLElement): string {
        const name = card.querySelector('.singularityPerkModalTitle')?.textContent ?? '';
        const description = card.querySelector('.singularityPerkModalDescription')?.textContent ?? '';
        return normalizeSearchText(`${name} ${description}`);
    }
}
