import { HSUI } from "../../../hs-core/hs-ui"
import { HSUIC } from "../../../hs-core/hs-ui-components";
import { HSInputType, EPredefinedPosition } from "../../../../types/module-types/hs-ui-types";
import { HSAutosingStrategy } from "../../../../types/module-types/hs-autosing-types"
import { HSModuleManager } from "../../../hs-core/module/hs-module-manager";

export class HSAutosingStrategyModal {
    static async open(): Promise<void> {
        const uiMod = HSModuleManager.getModule<HSUI>('HSUI');
        if (!uiMod || !uiMod.uiReady) return;

        const strategyDraft: HSAutosingStrategy = {
            strategyName: "",
            strategy: []
        };

        const modalContent = HSUIC.Flex({
            styles: {
                flexDirection: "column",
                gap: "12px",
                padding: "14px",
                width: "480px"
            },
            html: [
                HSUIC.P({ text: "Create Autosing Strategy" }),
                HSUIC.Input({
                    id: "hs-autosing-strategy-name",
                    type: HSInputType.TEXT,
                    props: { placeholder: "Strategy name" }
                }),
                HSUIC.Div({
                    id: "hs-autosing-phase-list",
                    html: "No strategy phases added yet."
                }),
                HSUIC.Button({
                    id: "hs-autosing-add-phase-btn",
                    text: "Add strategy phase"
                }),
                HSUIC.Button({
                    id: "hs-autosing-create-btn",
                    text: "Create Strategy"
                })
            ]
        });

        await uiMod.Modal({
            position: EPredefinedPosition.CENTER,
            htmlContent: modalContent
        });
    }
}
