import { HSUI } from "../../../hs-core/hs-ui";
import { CorruptionLoadoutDefinition } from "../../../../types/module-types/hs-autosing-types";

export async function openAutosingCorruptionModal(
    uiMod: HSUI,
    loadouts: CorruptionLoadoutDefinition[],
    selectedLoadoutRef: { value: string | null },
    parentModalId?: string,
    onDone?: (selectedValue: string | null) => void
): Promise<void> {
    const modalId = "hs-autosing-corruption-modal";
    const selectedName = selectedLoadoutRef.value ?? "";

    const loadoutRows = loadouts.length
        ? loadouts.map(loadout => {
            const isChecked = loadout.name === selectedName ? "checked" : "";
            return `
                <label class="hs-corruption-loadout-item">
                    <input type="radio" name="hs-corruption-loadout" value="${loadout.name}" ${isChecked} />
                    <span class="hs-corruption-loadout-name">${loadout.name}</span>
                </label>
            `;
        }).join("")
        : `<div class="hs-corruption-empty">No corruption loadouts created yet.</div>`;

    const noneChecked = selectedName === "" ? "checked" : "";

    const modalContent = {
        htmlContent: `
            <div id="${modalId}" class="hs-corruption-modal-container">
                <div class="hs-corruption-list">
                    <label class="hs-corruption-loadout-item">
                        <input type="radio" name="hs-corruption-loadout" value="" ${noneChecked} />
                        <span class="hs-corruption-loadout-name">None</span>
                    </label>
                    ${loadoutRows}
                </div>
                <div class="hs-corruption-footer">
                    <div class="hs-corruption-done-btn" id="hs-corruption-save-btn">
                        Done
                    </div>
                </div>
            </div>
        `,
        title: "Select Corruption Loadout"
    };

    const modalInstance = await uiMod.Modal({
        ...modalContent,
        parentModalId
    });

    setTimeout(() => {
        document.getElementById("hs-corruption-save-btn")?.addEventListener("click", () => {
            const selected = document.querySelector('input[name="hs-corruption-loadout"]:checked') as HTMLInputElement | null;
            const value = selected?.value ?? "";
            selectedLoadoutRef.value = value.length > 0 ? value : null;

            onDone?.(selectedLoadoutRef.value);

            HSUI.removeInjectedStyle('hs-corruption-modal-styles');
            uiMod.CloseModal(modalInstance);
        });
    }, 0);
}
