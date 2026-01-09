import { HSUI } from "../../../hs-core/hs-ui";
import { CorruptionLoadout } from "../../../../types/module-types/hs-autosing-types";
import viscosity from "../../../../resource/txt/viscosity_icon.txt";
import drought from "../../../../resource/txt/drought_icon.txt";
import deflation from "../../../../resource/txt/deflation_icon.txt";
import extinction from "../../../../resource/txt/extinction_icon.txt";
import illiteracy from "../../../../resource/txt/illiteracy_icon.txt";
import recession from "../../../../resource/txt/recession_icon.txt";
import dilation from "../../../../resource/txt/dilation_icon.txt";
import hyperchallenge from "../../../../resource/txt/hyperchallenge_icon.txt";

type CorruptionKey = keyof CorruptionLoadout;

export const CorruptionIcons: Record<CorruptionKey, string> = {
    viscosity,
    drought,
    deflation,
    extinction,
    illiteracy,
    recession,
    dilation,
    hyperchallenge
};

const corruptionMeta: Record<CorruptionKey, { label: string }> = {
    viscosity: { label: "Viscosity" },
    drought: { label: "Drought" },
    deflation: { label: "Deflation" },
    extinction: { label: "Extinction" },
    illiteracy: { label: "Illiteracy" },
    recession: { label: "Recession" },
    dilation: { label: "Dilation" },
    hyperchallenge: { label: "Hyperchallenged" }
};

export async function openAutosingCorruptionModal(
    uiMod: HSUI,
    loadout: CorruptionLoadout
): Promise<void> {
    const modalId = "hs-autosing-corruption-modal";

    const corruptionRows = (Object.keys(corruptionMeta) as CorruptionKey[]).map(key => `
        <div class="hs-corruption-item">
            <img src="${CorruptionIcons[key]}" class="hs-corruption-icon" alt="${corruptionMeta[key].label}" />
            <div class="hs-corruption-label">${corruptionMeta[key].label}</div>
            <input 
                type="number" 
                id="hs-corruption-${key}" 
                class="hs-corruption-input"
                min="0" 
                max="16" 
                value="${loadout[key] ?? 0}"
            />
        </div>
    `).join("");

    const modalContent = {
        htmlContent: `
            <div id="${modalId}" class="hs-corruption-modal-container">
                <div class="hs-corruption-grid">
                    ${corruptionRows}
                </div>
                <div class="hs-corruption-footer">
                    <div class="hs-corruption-done-btn" id="hs-corruption-save-btn">
                        Done
                    </div>
                </div>
            </div>
        `,
        title: "Configure Corruption Loadout"
    };

    const modalInstance = await uiMod.Modal(modalContent);

    setTimeout(() => {
        document.getElementById("hs-corruption-save-btn")?.addEventListener("click", () => {
            (Object.keys(corruptionMeta) as CorruptionKey[]).forEach(key => {
                const input = document.getElementById(`hs-corruption-${key}`) as HTMLInputElement;
                const value = Math.max(0, Math.min(16, Number(input?.value) || 0));
                loadout[key] = value;
            });

            HSUI.removeInjectedStyle('hs-corruption-modal-styles');
            uiMod.CloseModal(modalInstance);
        });
    }, 0);
}
