// What the Singularity search fields share (docs/features/singularity-search.md): the field with its Clear button and
// result count, the clickable words under it, the list of results, and reading a game tooltip without showing it.

import { matchesSearch, searchTerms } from "./hs-singularity-search-match";

/**
 * A search field: the text, then at its right end, inside it, the number of results and a Clear button (hidden while
 * empty). Nothing moves or resizes as they appear. Escape clears the field and leaves it.
 */
export class HSSearchField {
    readonly element: HTMLElement;
    readonly #input: HTMLInputElement;
    readonly #clearButton: HTMLElement;
    readonly #count: HTMLElement;
    readonly #end: HTMLElement;
    readonly #onChange: () => void;

    constructor(placeholder: string, onChange: () => void) {
        this.#onChange = onChange;

        const field = document.createElement('div');
        field.className = 'hs-sing-search-field';

        const input = document.createElement('input');
        input.className = 'hs-sing-search-input';
        input.type = 'text';
        input.placeholder = placeholder;
        input.autocomplete = 'off';
        input.spellcheck = false;
        input.addEventListener('input', () => this.#changed());
        input.addEventListener('keydown', (event) => {
            if (event.key !== 'Escape') return;
            // The focus leaves the field below: without this, the game's hotkeys would get the key
            event.stopPropagation();
            input.value = '';
            this.#changed();
            input.blur();
        });

        const clearButton = document.createElement('button');
        clearButton.className = 'hs-sing-search-clear';
        clearButton.type = 'button';
        clearButton.textContent = 'Clear';
        clearButton.addEventListener('click', () => {
            this.fill('');
        });

        const count = document.createElement('span');
        count.className = 'hs-sing-search-count';

        // Over the text box's right end: typed text stops before it (#fitText)
        const end = document.createElement('div');
        end.className = 'hs-sing-search-end';
        end.append(count, clearButton);

        field.append(input, end);
        this.element = field;
        this.#input = input;
        this.#clearButton = clearButton;
        this.#count = count;
        this.#end = end;
        this.#changed(false);
    }

    get value(): string {
        return this.#input.value;
    }

    /** Puts the text in the field, searches, and leaves the focus in it. */
    fill(text: string): void {
        this.#input.value = text;
        this.#changed();
        this.#input.focus();
    }

    /** Empties the field and ends the search, the focus untouched. */
    clear(): void {
        this.#input.value = '';
        this.#changed();
    }

    /**
     * The count inside the field; empty hides it. Typed text stops before it. `short` replaces `text` when the field
     * is too narrow for it (a narrow window), `text` then being the field's tooltip (the count lets the mouse through).
     */
    setCount(text: string, short?: string): void {
        this.#count.textContent = text;
        this.#input.title = '';
        // Room for a few typed characters at least. offsetWidth: an input's clientWidth shrinks with its padding,
        // which follows the count.
        if (short !== undefined && this.#end.offsetWidth > this.#input.offsetWidth - 60) {
            this.#count.textContent = short;
            this.#input.title = text;
        }
        this.#fitText();
    }

    #changed(notify = true): void {
        this.#clearButton.style.display = this.#input.value === '' ? 'none' : '';
        this.#fitText();
        if (notify) this.#onChange();
    }

    /** Typed text stops before the count and the Clear button. */
    #fitText(): void {
        const endWidth = this.#end.offsetWidth;
        this.#input.style.paddingRight = endWidth === 0 ? '' : `${endWidth + 8}px`;
    }
}

/**
 * The clickable words under a field: a click fills the field and searches. The words are English in every language.
 */
export class HSSearchWords {
    readonly element: HTMLElement;
    readonly #buttons = new Map<string, HTMLElement>();

    constructor(words: readonly string[], field: HSSearchField) {
        const row = document.createElement('div');
        row.className = 'hs-sing-search-words';
        for (const word of words) {
            const button = document.createElement('button');
            button.type = 'button';
            button.textContent = word;
            button.addEventListener('click', () => field.fill(word));
            row.append(button);
            this.#buttons.set(word, button);
        }
        this.element = row;
    }

    /**
     * Hides a word that finds nothing in `texts` (normalized searchable texts): nothing unlocked yet on that subject,
     * or another wording in the game's language.
     */
    refresh(texts: readonly string[]): void {
        this.#buttons.forEach((button, word) => {
            const terms = searchTerms(word);
            button.style.display = texts.some(text => matchesSearch(text, terms)) ? '' : 'none';
        });
    }
}

/**
 * The list of the matching elements' tooltips, as cards: one column, scrolled inside, its height down to the window's
 * bottom (hs-singularity-search.css). Placed by its owner.
 */
export class HSSearchResults {
    readonly element: HTMLElement;
    readonly #emptyText: string;

    constructor(emptyText: string) {
        this.element = document.createElement('div');
        this.element.className = 'hs-sing-search-results';
        this.#emptyText = emptyText;
    }

    /**
     * The cards, with `hint` under the last one; an empty list shows `emptyText`, with `hint` under it; null empties the
     * list (no search, or no room for it).
     */
    show(cards: HTMLElement[] | null, hint?: string): void {
        this.element.scrollTop = 0;
        // For its height down to the window's bottom
        this.element.style.setProperty('--hs-sing-search-results-top', `${this.element.getBoundingClientRect().top}px`);

        if (!cards) {
            this.element.replaceChildren();
            return;
        }
        const hintLine = hint ? document.createElement('div') : null;
        if (hintLine) {
            hintLine.className = 'hs-sing-search-hint';
            hintLine.textContent = hint ?? '';
        }
        if (cards.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'hs-sing-search-empty';
            empty.textContent = this.#emptyText;
            if (hintLine) empty.append(hintLine);
            this.element.replaceChildren(empty);
        } else {
            this.element.replaceChildren(...cards, ...(hintLine ? [hintLine] : []));
        }
    }
}

/**
 * A copy of the tooltip the game opens when the mouse moves over the element, or null when it opens none: on a touch
 * device the game opens them with a click. Opened and closed in the same task, so nothing is painted. `closeEvent` is
 * the one the element's own listener closes the tooltip on.
 * Closes a tooltip that was open (the mouse resting on another element); the game opens it again at the next move.
 */
export function readHoverTooltip(element: HTMLElement, closeEvent: 'mouseleave' | 'mouseout'): HTMLElement | null {
    const content = document.getElementById('modalContent');
    if (!content) return null;

    // Emptied first: what's left after the event is this element's tooltip, nothing older. The game rebuilds an
    // empty content in full.
    content.replaceChildren();
    element.dispatchEvent(new MouseEvent('mousemove', { clientX: 0, clientY: 0 }));
    const copy = content.childNodes.length > 0 ? content.cloneNode(true) as HTMLElement : null;
    element.dispatchEvent(new MouseEvent(closeEvent));

    copy?.removeAttribute('id');
    return copy;
}
