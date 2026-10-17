import { HSModuleManager } from "../../hs-core/module/hs-module-manager";
import { HSUI } from "../../hs-core/hs-ui";
import { HSHeaterUIStyles } from "./hs-heater-ui-styles";
import { buildRedAmbrosiaUpgradeTableHtml, type RedAmbrosiaUpgradeSortKey, type RedAmbrosiaUpgradeSortState } from "./hs-heater-red-ambrosia-table";
import { EPredefinedPosition } from "../../../types/module-types/hs-ui-types";

function buildRedAmbrosiaModalHtml(
    compactView = true,
    sortState: RedAmbrosiaUpgradeSortState,
): string {
    return buildRedAmbrosiaUpgradeTableHtml(undefined, compactView, sortState);
}

export class HSHeaterRedAmbrosiaModalController {
    static currentRedAmbrosiaModalId: string | null = null;
    static #currentRedAmbrosiaModalObserver: MutationObserver | null = null;
    static #isCompactRedAmbrosiaView = true;
    static #sortState: RedAmbrosiaUpgradeSortState = { key: null, direction: null };

    static async openRedAmbrosiaUpgradeModal(): Promise<void> {
        const hsui = HSModuleManager.getModule<HSUI>('HSUI');
        if (!hsui) return;

        HSHeaterUIStyles.ensureHeaterStylesInjected();

        const content = buildRedAmbrosiaModalHtml(this.#isCompactRedAmbrosiaView, this.#sortState);

        if (this.currentRedAmbrosiaModalId) {
            const existingModal = document.getElementById(this.currentRedAmbrosiaModalId);
            if (existingModal) {
                const body = existingModal.querySelector('.hs-modal-body');
                if (body) {
                    body.innerHTML = content;
                    this.attachModalHandlers(existingModal);
                    return;
                }
            }
            this.currentRedAmbrosiaModalId = null;
        }

        this.currentRedAmbrosiaModalId = await hsui.Modal({
            title: 'Red Ambrosia Upgrades',
            htmlContent: content,
            position: EPredefinedPosition.RIGHT,
            headerClass: 'hs-heater-redamb-header',
            bodyClass: 'hs-heater-redamb-body',
            styles: {
                width: 'auto',
                height: 'auto',
            },
        });

        const outputModal = this.currentRedAmbrosiaModalId ? document.getElementById(this.currentRedAmbrosiaModalId) : null;
        if (outputModal) {
            this.attachModalHandlers(outputModal);
            this.monitorRedAmbrosiaModalRemoval(outputModal);
        } else {
            this.currentRedAmbrosiaModalId = null;
        }
    }

    private static attachModalHandlers(modal: HTMLElement): void {
        const toggleButton = modal.querySelector<HTMLButtonElement>('#hs-heater-red-ambrosia-action-btn');
        if (toggleButton) {
            toggleButton.onclick = () => {
                this.#isCompactRedAmbrosiaView = !this.#isCompactRedAmbrosiaView;
                this.#renderModalBody(modal);
            };
        }

        modal.querySelectorAll<HTMLButtonElement>('[data-cef-sort-key]').forEach((button) => {
            button.onclick = () => {
                const sortKey = button.dataset.cefSortKey as RedAmbrosiaUpgradeSortKey | undefined;
                if (!sortKey) return;

                if (this.#sortState.key !== sortKey) {
                    this.#sortState = { key: sortKey, direction: 'ascending' };
                } else if (this.#sortState.direction === 'ascending') {
                    this.#sortState = { key: sortKey, direction: 'descending' };
                } else {
                    this.#sortState = { key: null, direction: null };
                }
                this.#renderModalBody(modal);
            };
        });
    }

    static #renderModalBody(modal: HTMLElement): void {
        const body = modal.querySelector('.hs-modal-body');
        if (!body) return;

        body.innerHTML = buildRedAmbrosiaModalHtml(this.#isCompactRedAmbrosiaView, this.#sortState);
        this.attachModalHandlers(modal);
    }

    static async closeCurrentRedAmbrosiaModal(): Promise<void> {
        if (!this.currentRedAmbrosiaModalId) return;
        const hsui = HSModuleManager.getModule<HSUI>('HSUI');
        if (!hsui) return;
        await hsui.CloseModal(this.currentRedAmbrosiaModalId);
        this.currentRedAmbrosiaModalId = null;
        this.#sortState = { key: null, direction: null };
    }

    private static monitorRedAmbrosiaModalRemoval(modal: HTMLElement): void {
        if (this.#currentRedAmbrosiaModalObserver) return;

        this.#currentRedAmbrosiaModalObserver = new MutationObserver(() => {
            if (modal.isConnected) return;
            this.cleanupRedAmbrosiaModalState();
        });

        this.#currentRedAmbrosiaModalObserver.observe(document.body, {
            childList: true,
            subtree: true,
        });
    }

    private static cleanupRedAmbrosiaModalState(): void {
        if (this.#currentRedAmbrosiaModalObserver) {
            this.#currentRedAmbrosiaModalObserver.disconnect();
            this.#currentRedAmbrosiaModalObserver = null;
        }
        this.currentRedAmbrosiaModalId = null;
        this.#sortState = { key: null, direction: null };
    }
}
