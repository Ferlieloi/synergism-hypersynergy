import { HSUI } from "../../../hs-core/hs-ui";

export type HSAutosingEditorWindowKind =
    | 'strategy'
    | 'phase'
    | 'challenges'
    | 'corruptionSelect'
    | 'corruptionLoadouts'
    | 'corruptionLoadoutEditor';

const WINDOW_LABELS: Record<HSAutosingEditorWindowKind, string> = {
    strategy: 'A strategy editor',
    phase: 'A phase window',
    challenges: 'The actions editor',
    corruptionSelect: 'The corruption loadout selection',
    corruptionLoadouts: 'The corruption loadouts window',
    corruptionLoadoutEditor: 'A corruption loadout editor'
};

interface HSAutosingEditorWindow {
    // Undefined while the window opens (HSUI.Modal() resolves once its fade-in is over)
    modalId?: string;
    parentModalId?: string;
}

/**
 * Class: HSAutosingEditorWindows
 * IsExplicitHSModule: No
 * Description:
 *     Keeps at most one window of each kind open in the strategy editor (strategy, phase, actions editor,
 *     corruption windows). Each window finds its elements by fixed ids anywhere in the page, so a second copy
 *     would wire itself to the first one: the newer window did nothing, and the older one ran both windows'
 *     handlers, the second one saving its own stale copy of the data over the first one's changes.
 *     Opening a kind that is already open brings the open window to the front instead. A window whose parent
 *     was closed is removed at once and the new one opens, so no two windows of a kind are ever in the page.
 * Author: maenhiir
 */
export class HSAutosingEditorWindows {
    static #windows = new Map<HSAutosingEditorWindowKind, HSAutosingEditorWindow>();

    /**
     * To call before the window's first await, so that a double click opens one window.
     * Returns false when a window of this kind is already open (or opening): don't open another one.
     */
    static claim(uiMod: HSUI, kind: HSAutosingEditorWindowKind, parentModalId?: string): boolean {
        const open = this.#windows.get(kind);
        if (open) {
            if (open.modalId === undefined) return false;

            const modal = document.getElementById(open.modalId);
            if (modal) {
                const parentClosed = open.parentModalId !== undefined && !document.getElementById(open.parentModalId);
                if (!parentClosed) {
                    void uiMod.BringModalToFront(open.modalId);
                    HSUI.Notify(`${WINDOW_LABELS[kind]} is already open`, { notificationType: 'warning' });
                    return false;
                }
                // Removed at once (no fade-out): its lookups would otherwise reach the new window's twins
                modal.remove();
                void uiMod.CloseModal(open.modalId);
            }
        }

        this.#windows.set(kind, { parentModalId });
        return true;
    }

    /** To call once HSUI.Modal() has returned the window's id. */
    static opened(kind: HSAutosingEditorWindowKind, modalId: string): void {
        const open = this.#windows.get(kind);
        if (open) open.modalId = modalId;
    }
}
