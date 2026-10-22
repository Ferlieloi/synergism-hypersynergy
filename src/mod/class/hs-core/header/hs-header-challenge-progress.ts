import { HSGlobal } from '../hs-global';

interface ProgressView { module: HTMLElement; native: HTMLElement; compact: HTMLElement; }

/** A compact view of the native formatted scores, without rewriting text the game owns. */
export class HSHeaderChallengeProgress {
    static #enabled = false;
    static #views: ProgressView[] = [];
    static #resize?: ResizeObserver;

    static setEnabled(enabled: boolean): void {
        HSHeaderChallengeProgress.#enabled = enabled;
        document.documentElement.classList.toggle('hs-compact-challenge-text', enabled);
        for (const view of HSHeaderChallengeProgress.#views) HSHeaderChallengeProgress.#refresh(view);
    }

    static install(): void {
        HSHeaderChallengeProgress.#resize ??= new ResizeObserver(entries => {
            for (const entry of entries) {
                const view = HSHeaderChallengeProgress.#views.find(view => view.module === entry.target);
                if (view) HSHeaderChallengeProgress.#fit(view);
            }
        });
        for (const module of document.querySelectorAll<HTMLElement>('.headerProgress')) {
            const native = module.querySelector<HTMLElement>('.fitText');
            if (!native || module.querySelector('.hs-header-progress-compact')) continue;
            const compact = document.createElement('span');
            compact.className = 'hs-header-progress-compact';
            module.append(compact);
            const view = { module, native, compact };
            HSHeaderChallengeProgress.#views.push(view);
            const observer = new MutationObserver(() => HSHeaderChallengeProgress.#refresh(view));
            observer.observe(native, {
                childList: true, characterData: true, subtree: true,
                attributes: true, attributeFilter: ['data-placeholder'],
            });
            observer.observe(module, { attributes: true, attributeFilter: ['class', 'data-size', 'hidden'] });
            HSHeaderChallengeProgress.#resize.observe(module);
            HSHeaderChallengeProgress.#refresh(view);
        }
    }

    static #refresh(view: ProgressView): void {
        const { module, native, compact } = view;
        // The game's translations mark the formatted amounts and scores with spans.
        const values = Array.from(native.children, child => child.textContent?.trim() ?? '').filter(Boolean);
        const fullText = native.textContent?.trim() || native.dataset.placeholder || '';
        const score = module.id === 'ascensionChallengeProgress'
            && HSGlobal.exposedPlayer?.currentChallenge.ascension === 15;
        const text = score
            ? (fullText.includes('→') ? values.slice(0, 2).join(' → ') : values[0])
            : values.slice(0, 2).join(' / ');
        // Inactive modules keep the game's named editor preview so each challenge tier is identifiable.
        const display = text || fullText || '—';
        if (compact.textContent !== display) compact.textContent = display;
        compact.title = fullText;
        compact.setAttribute('aria-label', fullText);
        HSHeaderChallengeProgress.#fit(view);
    }

    static #fit({ module, compact }: ProgressView): void {
        if (!HSHeaderChallengeProgress.#enabled || !module.clientWidth || !module.clientHeight) return;
        // Fit within both dimensions, starting from the module's native size rather than an old fitted font.
        let size = Math.min(Number.parseFloat(getComputedStyle(module).fontSize), module.clientHeight / 1.2);
        compact.style.fontSize = `${size}px`;
        const width = module.clientWidth - 1;
        if (compact.scrollWidth > width) {
            size *= width / compact.scrollWidth;
            compact.style.fontSize = `${size}px`;
        }
    }
}
