import { HSUI } from "../../../hs-core/hs-ui";
import { HSUIC } from "../../../hs-core/hs-ui-components";
import { HSInputType, EPredefinedPosition } from "../../../../types/module-types/hs-ui-types";
import { CorruptionLoadout } from "../../../../types/module-types/hs-autosing-types";
import viscosity from "../../../../resource/txt/viscosity_icon.txt";
import drought from "../../../../resource/txt/drought_icon.txt";
import deflation from "../../../../resource/txt/deflation_icon.txt";
import extinction from "../../../../resource/txt/extinction_icon.txt";
import illiteracy from "../../../../resource/txt/illiteracy_icon.txt";
import recession from "../../../../resource/txt/recession_icon.txt";
import dilation from "../../../../resource/txt/dilation_icon.txt";
import hyperchallenged from "../../../../resource/txt/hyperchallenged_icon.txt";

type CorruptionKey = keyof CorruptionLoadout;

export const CorruptionIcons: Record<CorruptionKey, string> = {
    viscosity,
    drought,
    deflation,
    extinction,
    illiteracy,
    recession,
    dilation,
    hyperchallenged: hyperchallenged
};

const corruptionMeta: Record<CorruptionKey, { label: string }> = {
    viscosity: { label: "Viscosity" },
    drought: { label: "Drought" },
    deflation: { label: "Deflation" },
    extinction: { label: "Extinction" },
    illiteracy: { label: "Illiteracy" },
    recession: { label: "Recession" },
    dilation: { label: "Dilation" },
    hyperchallenged: { label: "Hyperchallenged" }
};

export async function openAutosingCorruptionModal(
    uiMod: HSUI,
    loadout: CorruptionLoadout
): Promise<void> {
    const modalId = "hs-autosing-corruption-modal";

    const corruptionRows = (Object.keys(corruptionMeta) as CorruptionKey[]).map(key =>
        HSUIC.Flex({
            styles: {
                alignItems: "center",
                gap: "10px",
                marginBottom: "6px"
            },
            html: [
                HSUIC.Image({
                    src: CorruptionIcons[key],
                    width: 32,
                    height: 32,
                    props: { alt: `${corruptionMeta[key].label} icon` }
                }),
                HSUIC.Div({
                    styles: { flex: "1", fontWeight: "bold" },
                    html: corruptionMeta[key].label
                }),
                HSUIC.Input({
                    id: `hs-corruption-${key}`,
                    type: HSInputType.NUMBER,
                    props: {
                        min: "0",
                        max: "16",
                        value: String(loadout[key] ?? 0)
                    },
                    styles: {
                        width: "60px"
                    }
                })
            ]
        })
    );

    const modalContent = {
        htmlContent: HSUIC.Flex({
            styles: {
                flexDirection: "column",
                gap: "12px",
                padding: "14px",
                width: "360px"
            },
            html: [
                ...corruptionRows,
                HSUIC.Flex({
                    styles: { justifyContent: "flex-end", marginTop: "12px" },
                    html: [
                        HSUIC.Button({
                            id: "hs-corruption-save-btn",
                            text: "Done"
                        })
                    ]
                })
            ]
        }),
        id: modalId,
        title: "Create Corruption Loadout"
    }

    const modalInstance = await uiMod.Modal(modalContent);

    // Save button behavior
    setTimeout(() => {
        document
            .getElementById("hs-corruption-save-btn")
            ?.addEventListener("click", () => {
                (Object.keys(corruptionMeta) as CorruptionKey[]).forEach(key => {
                    const input = document.getElementById(
                        `hs-corruption-${key}`
                    ) as HTMLInputElement;

                    const value = Math.max(0, Math.min(16, Number(input?.value) || 0));
                    loadout[key] = value;
                });

                uiMod.CloseModal(modalInstance); // modalInstance is the ID string
            });
    }, 0);
}
