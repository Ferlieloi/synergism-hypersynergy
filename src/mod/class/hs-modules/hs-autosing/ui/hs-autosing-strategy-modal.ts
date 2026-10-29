import { HSUI } from "../../../hs-core/hs-ui"
import { HSAutosingStrategy, AutosingStrategyPhase, AOAG_PHASE_ID, AOAG_PHASE_NAME, createDefaultAoagPhase, phases, PhaseOption } from "../../../../types/module-types/hs-autosing-types"
import { HSModuleManager } from "../../../hs-core/module/hs-module-manager";
import { HSSettingsUI } from "../../../hs-core/settings/hs-settings-ui";
import { HSStrategyManager } from "../hs-strategy-manager";
import { HSLogger } from '../../../hs-core/hs-logger';
import { HSAutosingEditorWindows } from "./hs-autosing-editor-windows";
import { canonicalJson, HSAutosingChallengeModal, openAutosingChallengesModal } from "./hs-autosing-challenge-modal";
import { escapeHtml } from "../../hs-heater/hs-heater-utils";

type StrategyWindowMode = 'create' | 'edit' | 'copy';

// In the game's order
function renderEndOptions(ends: readonly PhaseOption[], selected?: PhaseOption): string {
    return ends.map(end => `<option value="${end}"${end === selected ? " selected" : ""}>${end}</option>`).join("");
}

/**
 * Class: HSAutosingStrategyModal
 * IsExplicitHSModule: No
 * Description:
 *     The strategy window of the strategy editor (create, edit, or view and copy a default strategy): its phases,
 *     each from the previous one's end to the end picked in its row, plus the AOAG phase. Works on a copy that
 *     Create/Update saves.
 *     - A phase's ✎ opens its actions window, which writes its steps into this window's copy on Save.
 *     - The first phase starts at "start", each other one at the previous one's end. A phase's end dropdown only
 *       offers ends before the next phase's end, so a change never breaks the phases after it. The "+" above a
 *       phase inserts one before it, up to the point picked, where that phase then starts.
 *     - Cancel and the window's × ask before dropping changes, this window's or its actions window's, and close
 *       both. Deleting the phase of the open actions window asks first and closes it. Update is refused while the
 *       actions window has unsaved changes.
 * Author: XxMolkxX, Shewchou
 */
export class HSAutosingStrategyModal {
    static readonly #context = 'HSAutosingStrategyModal';
    // The open window (one at a time, see HSAutosingEditorWindows)
    static #current: HSAutosingStrategyModal | null = null;

    #uiMod: HSUI;
    #mode: StrategyWindowMode;
    // The saved name of the strategy edited (edit mode)
    #editedName: string | undefined;
    #draft: HSAutosingStrategy & { aoagPhase: AutosingStrategyPhase };
    // The draft as opened, to tell whether anything changed
    #initial: string;
    #modalId = "";
    #root!: HTMLElement;
    #list!: HTMLElement;
    #nameInput!: HTMLInputElement;
    #addSelect!: HTMLSelectElement;
    #errorBox!: HTMLElement;
    #overlay!: HTMLElement;
    #overlayText!: HTMLElement;
    #overlayConfirm!: HTMLElement;
    // What the overlay's confirm button does
    #onOverlayConfirm: (() => void) | null = null;
    // The actions window opened from this one, and the phase it edits
    #actions: { phase: AutosingStrategyPhase; window: HSAutosingChallengeModal } | null = null;

    static async open(
        existingStrategy?: HSAutosingStrategy,
        options?: {
            duplicateFromDefault?: boolean;
            suggestedName?: string;
            parentModalId?: string;
        }
    ): Promise<void> {
        const uiMod = HSModuleManager.getModule<HSUI>('HSUI');
        if (!uiMod || !uiMod.uiReady) return;
        if (!HSAutosingEditorWindows.claim(uiMod, 'strategy', options?.parentModalId)) return;

        const editor = new HSAutosingStrategyModal(uiMod, existingStrategy, options);
        HSAutosingStrategyModal.#current = editor;
        await editor.#open(options?.parentModalId);
    }

    /** True when a window edits this strategy: it is brought to the front. */
    static showEditorOf(strategyName: string): boolean {
        const editor = HSAutosingStrategyModal.#current;
        if (!editor || editor.#editedName !== strategyName || !editor.#isOpen()) return false;
        void editor.#uiMod.BringModalToFront(editor.#modalId);
        return true;
    }

    private constructor(uiMod: HSUI, existingStrategy: HSAutosingStrategy | undefined, options?: { duplicateFromDefault?: boolean; suggestedName?: string }) {
        this.#uiMod = uiMod;
        this.#mode = !existingStrategy ? 'create' : options?.duplicateFromDefault ? 'copy' : 'edit';
        this.#editedName = this.#mode === 'edit' ? existingStrategy!.strategyName : undefined;

        const strategy: AutosingStrategyPhase[] = existingStrategy ? structuredClone(existingStrategy.strategy) : [];
        // An older format kept the AOAG phase in the list
        const aoagIndex = strategy.findIndex(p => p.phaseId === AOAG_PHASE_ID);
        const aoagFromList = aoagIndex === -1 ? undefined : strategy.splice(aoagIndex, 1)[0];
        const aoagPhase = existingStrategy?.aoagPhase ? structuredClone(existingStrategy.aoagPhase) : aoagFromList ?? createDefaultAoagPhase();
        aoagPhase.phaseId = AOAG_PHASE_ID;

        this.#draft = {
            strategyName: this.#mode === 'copy'
                ? (options?.suggestedName ?? `${existingStrategy!.strategyName}_copy`)
                : existingStrategy?.strategyName ?? "",
            strategy,
            aoagPhase
        };
        this.#fixPhaseChain();
        this.#initial = this.#canonical(this.#draft.strategyName);
    }

    async #open(parentModalId?: string): Promise<void> {
        const isEdit = this.#mode === 'edit';
        this.#modalId = await this.#uiMod.Modal({
            htmlContent: `
                <div class="hs-strategy-modal-container">
                    <div class="hs-strategy-input-section">
                        <div class="hs-strategy-input-label">Strategy Name</div>
                        <input type="text" class="hs-strategy-name-input" placeholder="Enter strategy name..."
                            value="${escapeHtml(this.#draft.strategyName)}"${isEdit ? " disabled" : ""} />
                        ${this.#mode === 'copy' ? '<div class="hs-strategy-note">Default strategies are read-only; saving creates a user copy.</div>' : ''}
                    </div>
                    <div class="hs-strategy-input-section">
                        <div class="hs-strategy-input-label">Strategy Phases</div>
                        <div class="hs-strategy-phase-list"></div>
                    </div>
                    <div class="hs-strategy-error" hidden></div>
                    <div class="hs-strategy-btn-group">
                        <select class="hs-strategy-add-select"></select>
                        <div class="hs-strategy-btn hs-strategy-btn-secondary" data-action="cancel">Cancel</div>
                        <div class="hs-strategy-btn hs-strategy-btn-primary" data-action="save">
                            ${isEdit ? 'Update Strategy' : (this.#mode === 'copy' ? 'Save as a new Strategy' : 'Create Strategy')}
                        </div>
                    </div>
                    <div class="hs-editor-overlay" hidden>
                        <div class="hs-editor-overlay-box">
                            <div class="hs-strategy-overlay-text"></div>
                            <div class="hs-editor-overlay-buttons">
                                <div class="hs-challenges-footer-btn hs-challenges-cancel-btn" data-action="overlay-keep">Keep</div>
                                <div class="hs-challenges-footer-btn hs-editor-overlay-confirm" data-action="overlay-confirm"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `,
            title: isEdit ? "Edit Autosing Strategy" : (this.#mode === 'copy' ? "View / Copy Default Strategy" : "Create Autosing Strategy"),
            parentModalId
        });
        HSAutosingEditorWindows.opened('strategy', this.#modalId);

        const modal = document.getElementById(this.#modalId);
        const root = modal?.querySelector<HTMLElement>(".hs-strategy-modal-container");
        if (!modal || !root) return;
        this.#root = root;
        this.#list = root.querySelector<HTMLElement>(".hs-strategy-phase-list")!;
        this.#nameInput = root.querySelector<HTMLInputElement>(".hs-strategy-name-input")!;
        this.#addSelect = root.querySelector<HTMLSelectElement>(".hs-strategy-add-select")!;
        this.#errorBox = root.querySelector<HTMLElement>(".hs-strategy-error")!;
        this.#overlay = root.querySelector<HTMLElement>(".hs-editor-overlay")!;
        this.#overlayText = root.querySelector<HTMLElement>(".hs-strategy-overlay-text")!;
        this.#overlayConfirm = root.querySelector<HTMLElement>('[data-action="overlay-confirm"]')!;

        root.addEventListener("click", e => this.#onClick(e));
        root.addEventListener("change", e => this.#onChange(e));
        // The window's ×: on its own button, so that HSUI's handler on the window never sees a click held back
        modal.querySelector<HTMLElement>(".hs-modal-close-btn")?.addEventListener("click", e => {
            if (this.#hasChanges()) {
                e.stopPropagation();
                this.#ask("Discard unsaved changes?", "Discard", () => this.#close());
            } else {
                this.#actions?.window.close();
            }
        });

        this.#redraw();
    }

    // ----- Phases -----

    // The first phase starts at "start", each other one at the previous one's end
    #fixPhaseChain(): void {
        let start: PhaseOption = "start";
        for (const phase of this.#draft.strategy) {
            phase.startPhase = start;
            start = phase.endPhase;
        }
    }

    #lastEnd(): PhaseOption {
        return this.#draft.strategy.at(-1)?.endPhase ?? "start";
    }

    // After the phase's start, before the next phase's end (its current end kept, whatever it is)
    #endsOf(index: number): PhaseOption[] {
        const phase = this.#draft.strategy[index];
        const next = this.#draft.strategy[index + 1];
        const ends = phases.slice(phases.indexOf(phase.startPhase) + 1, next ? phases.indexOf(next.endPhase) : phases.length);
        return ends.includes(phase.endPhase) ? ends : [...ends, phase.endPhase];
    }

    #addPhase(endPhase: PhaseOption): void {
        this.#draft.strategy.push({ startPhase: this.#lastEnd(), endPhase, strat: [] });
        this.#redraw();
    }

    // A new phase before this one, from its start to the point picked, where this one now starts
    #insertPhase(index: number, endPhase: PhaseOption): void {
        this.#draft.strategy.splice(index, 0, { startPhase: this.#draft.strategy[index].startPhase, endPhase, strat: [] });
        this.#fixPhaseChain();
        this.#redraw();
    }

    // The "+" in the gap above a phase: the points between its start and its end (none: no "+")
    #insertSelect(index: number): string {
        const phase = this.#draft.strategy[index];
        const points = phases.slice(phases.indexOf(phase.startPhase) + 1, phases.indexOf(phase.endPhase));
        return points.length === 0 ? "" : `<span class="hs-strategy-insert" title="Insert a phase before this one">`
            + `<select class="hs-strategy-insert-select"><option value="" selected hidden></option>`
            + `<optgroup label="Insert a phase from ${phase.startPhase} to:">${renderEndOptions(points)}</optgroup></select></span>`;
    }

    #setEnd(index: number, endPhase: PhaseOption): void {
        this.#draft.strategy[index].endPhase = endPhase;
        this.#fixPhaseChain();
        this.#redraw();
    }

    // By object: the list may have changed since the click
    #deletePhase(phase: AutosingStrategyPhase): void {
        const index = this.#draft.strategy.indexOf(phase);
        if (index === -1) return;
        this.#draft.strategy.splice(index, 1);
        this.#fixPhaseChain();
        this.#redraw();
    }

    #phaseAt(element: HTMLElement): AutosingStrategyPhase | undefined {
        const row = element.closest<HTMLElement>(".hs-strategy-phase-item");
        if (!row) return undefined;
        return row.dataset.aoag !== undefined ? this.#draft.aoagPhase : this.#draft.strategy[Number(row.dataset.index)];
    }

    // ----- Actions window -----

    #actionsTitle(phase: AutosingStrategyPhase): string {
        return phase === this.#draft.aoagPhase
            ? `Configure ${AOAG_PHASE_NAME}`
            : `Configure Strategy Actions (${phase.startPhase}-${phase.endPhase})`;
    }

    // The open actions window (null: none, or closed meanwhile)
    #openActions(): { phase: AutosingStrategyPhase; window: HSAutosingChallengeModal } | null {
        if (this.#actions && !this.#actions.window.isOpen()) this.#actions = null;
        return this.#actions;
    }

    #editActions(phase: AutosingStrategyPhase): void {
        // Another phase's window already open: it is brought to the front instead
        const actionsWindow = openAutosingChallengesModal(this.#uiMod, phase.strat, this.#actionsTitle(phase), this.#modalId, () => this.#redraw());
        if (actionsWindow) this.#actions = { phase, window: actionsWindow };
    }

    // ----- Window -----

    #redraw(): void {
        const stepsButton = (phase: AutosingStrategyPhase) => {
            const count = phase.strat.length;
            return `<div class="hs-strategy-btn hs-strategy-btn-icon hs-strategy-btn-steps${count === 0 ? " hs-strategy-btn-steps-empty" : ""}" data-action="edit">✎ ${count} step${count === 1 ? "" : "s"}</div>`;
        };
        const aoagRow = `
            <div class="hs-strategy-phase-item" data-aoag>
                <div class="hs-strategy-phase-text"><strong>${AOAG_PHASE_NAME}</strong></div>
                ${stepsButton(this.#draft.aoagPhase)}
            </div>`;
        const phaseRows = this.#draft.strategy.length === 0
            ? '<div class="hs-strategy-empty-state">No strategy phases added yet.</div>'
            : this.#draft.strategy.map((phase, i) => `
                <div class="hs-strategy-phase-item" data-index="${i}">
                    ${this.#insertSelect(i)}
                    <div class="hs-strategy-phase-text hs-strategy-phase-start"><span>Phase ${i + 1}:</span> <span>${phase.startPhase} <span class="hs-strategy-phase-arrow">→</span></span></div>
                    <select class="hs-strategy-end-select">${renderEndOptions(this.#endsOf(i), phase.endPhase)}</select>
                    ${stepsButton(phase)}
                    <div class="hs-strategy-btn hs-strategy-btn-icon hs-strategy-btn-delete" data-action="delete">×</div>
                </div>`).join("");
        this.#list.innerHTML = aoagRow + phaseRows;

        const lastEnd = this.#lastEnd();
        this.#addSelect.innerHTML = `<option value="" selected hidden>Add phase until…</option>`
            + renderEndOptions(phases.slice(phases.indexOf(lastEnd) + 1));
        this.#addSelect.hidden = lastEnd === "end";

        const actions = this.#openActions();
        actions?.window.setTitle(this.#actionsTitle(actions.phase));
        // The last refused save's reason may no longer hold
        this.#errorBox.hidden = true;
    }

    #canonical(name: string): string {
        return canonicalJson({ name, strategy: this.#draft.strategy, aoagPhase: this.#draft.aoagPhase });
    }

    #hasChanges(): boolean {
        return this.#canonical(this.#nameInput.value) !== this.#initial || !!this.#openActions()?.window.hasUnsavedChanges();
    }

    #isOpen(): boolean {
        return this.#modalId !== "" && document.getElementById(this.#modalId) !== null;
    }

    #ask(text: string, confirmLabel: string, onConfirm: () => void): void {
        this.#overlayText.textContent = text;
        this.#overlayConfirm.textContent = confirmLabel;
        this.#onOverlayConfirm = onConfirm;
        this.#overlay.hidden = false;
    }

    #showError(message: string): void {
        this.#errorBox.textContent = message;
        this.#errorBox.hidden = false;
    }

    #close(): void {
        this.#openActions()?.window.close();
        void this.#uiMod.CloseModal(this.#modalId);
    }

    #onChange(e: Event): void {
        const target = e.target as HTMLSelectElement;
        const index = Number(target.closest<HTMLElement>(".hs-strategy-phase-item")?.dataset.index);
        if (target === this.#addSelect) {
            if (this.#addSelect.value) this.#addPhase(this.#addSelect.value as PhaseOption);
        } else if (target.classList.contains("hs-strategy-end-select")) {
            this.#setEnd(index, target.value as PhaseOption);
        } else if (target.classList.contains("hs-strategy-insert-select")) {
            if (target.value) this.#insertPhase(index, target.value as PhaseOption);
        }
    }

    #onClick(e: MouseEvent): void {
        const target = e.target as HTMLElement;
        const action = target.closest<HTMLElement>("[data-action]")?.dataset.action;
        switch (action) {
            case "edit": {
                const phase = this.#phaseAt(target);
                if (phase) this.#editActions(phase);
                break;
            }
            case "delete": {
                const phase = this.#phaseAt(target);
                if (!phase) break;
                if (this.#openActions()?.phase === phase) {
                    this.#ask(`Phase ${this.#draft.strategy.indexOf(phase) + 1}'s actions window is open. Delete the phase and close it?`, "Delete", () => {
                        this.#openActions()?.window.close();
                        this.#deletePhase(phase);
                    });
                } else {
                    this.#deletePhase(phase);
                }
                break;
            }
            case "cancel":
                if (this.#hasChanges()) this.#ask("Discard unsaved changes?", "Discard", () => this.#close());
                else this.#close();
                break;
            case "save":
                this.#save();
                break;
            case "overlay-keep":
                this.#overlay.hidden = true;
                break;
            case "overlay-confirm":
                this.#overlay.hidden = true;
                this.#onOverlayConfirm?.();
                break;
        }
    }

    #save(): void {
        const context = HSAutosingStrategyModal.#context;
        if (this.#openActions()?.window.hasUnsavedChanges()) {
            this.#showError("Save or close the actions window first");
            return;
        }
        this.#draft.strategyName = this.#nameInput.value || "Unnamed Strategy";
        try {
            const { saved } = HSStrategyManager.saveStrategyToStorage(this.#draft, this.#editedName, context);
            if (!saved) {
                HSUI.Notify("Failed to save strategy", { notificationType: "error" });
                return;
            }
            HSSettingsUI.updateStrategyDropdownList();
            HSSettingsUI.selectAutosingStrategyByName(this.#draft.strategyName);
            if (this.#mode === 'edit') {
                HSLogger.log(`Strategy "${this.#draft.strategyName}" updated.`, context);
                HSUI.Notify(`Strategy "${this.#draft.strategyName}" updated`, { notificationType: "success" });
            } else {
                HSUI.Notify(`Strategy "${this.#draft.strategyName}" ${this.#mode === 'copy' ? 'saved as new and selected' : 'created and selected'}.`, { notificationType: "success" });
            }
            this.#close();
        } catch (err) {
            this.#showError((err as Error).message);
        }
    }
}
