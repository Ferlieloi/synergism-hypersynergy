import { HSModuleManager } from "../../hs-core/module/hs-module-manager";
import { HSUI } from "../../hs-core/hs-ui";
import { HSHeaterUIStyles } from "./hs-heater-ui-styles";
import { buildRedAmbrosiaUpgradeTableHtml } from "./hs-heater-red-ambrosia-table";
import { EPredefinedPosition } from "../../../types/module-types/hs-ui-types";

function buildRedAmbrosiaModalHtml(): string {
    return buildRedAmbrosiaUpgradeTableHtml();
}

export class HSHeaterRedAmbrosiaModalController {
    static currentRedAmbrosiaModalId: string | null = null;
    static #currentRedAmbrosiaModalObserver: MutationObserver | null = null;

    static async openRedAmbrosiaUpgradeModal(): Promise<void> {
        const hsui = HSModuleManager.getModule<HSUI>('HSUI');
        if (!hsui) return;

        HSHeaterUIStyles.ensureHeaterStylesInjected();

        const content = buildRedAmbrosiaModalHtml();

        if (this.currentRedAmbrosiaModalId) {
            const existingModal = document.getElementById(this.currentRedAmbrosiaModalId);
            if (existingModal) {
                const body = existingModal.querySelector('.hs-modal-body');
                if (body) {
                    body.innerHTML = content;
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
            this.monitorRedAmbrosiaModalRemoval(outputModal);
        } else {
            this.currentRedAmbrosiaModalId = null;
        }
    }

    static async closeCurrentRedAmbrosiaModal(): Promise<void> {
        if (!this.currentRedAmbrosiaModalId) return;
        const hsui = HSModuleManager.getModule<HSUI>('HSUI');
        if (!hsui) return;
        await hsui.CloseModal(this.currentRedAmbrosiaModalId);
        this.currentRedAmbrosiaModalId = null;
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
    }
}
