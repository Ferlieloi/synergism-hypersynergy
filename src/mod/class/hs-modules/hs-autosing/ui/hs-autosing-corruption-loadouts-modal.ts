import { HSUI } from "../../../hs-core/hs-ui";
import { AOAG_PHASE_NAME, CorruptionLoadout, CorruptionLoadoutDefinition, HSAutosingStrategy } from "../../../../types/module-types/hs-autosing-types";
import viscosity from "../../../../resource/txt/viscosity_icon.txt";
import drought from "../../../../resource/txt/drought_icon.txt";
import deflation from "../../../../resource/txt/deflation_icon.txt";
import extinction from "../../../../resource/txt/extinction_icon.txt";
import illiteracy from "../../../../resource/txt/illiteracy_icon.txt";
import recession from "../../../../resource/txt/recession_icon.txt";
import dilation from "../../../../resource/txt/dilation_icon.txt";
import hyperchallenge from "../../../../resource/txt/hyperchallenge_icon.txt";

type CorruptionKey = keyof CorruptionLoadout;

const CorruptionIcons: Record<CorruptionKey, string> = {
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

const createEmptyLoadout = (): CorruptionLoadout => ({
    viscosity: 0,
    drought: 0,
    deflation: 0,
    extinction: 0,
    illiteracy: 0,
    recession: 0,
    dilation: 0,
    hyperchallenge: 0
});

const findLoadoutUsages = (strategy: HSAutosingStrategy, name: string): string[] => {
    const usages: string[] = [];

    strategy.strategy.forEach(phase => {
        if (phase.corruptionLoadoutName === name) {
            usages.push(`Phase ${phase.startPhase}-${phase.endPhase}`);
        }
        phase.strat.forEach(entry => {
            if (entry.loadoutName === name) {
                usages.push(`Action in ${phase.startPhase}-${phase.endPhase}`);
            }
        });
    });

    if (strategy.aoagPhase) {
        if (strategy.aoagPhase.corruptionLoadoutName === name) {
            usages.push(AOAG_PHASE_NAME);
        }
        strategy.aoagPhase.strat.forEach(entry => {
            if (entry.loadoutName === name) {
                usages.push(`Action in ${AOAG_PHASE_NAME}`);
            }
        });
    }

    return usages;
};

const updateLoadoutReferences = (strategy: HSAutosingStrategy, oldName: string, newName: string) => {
    strategy.strategy.forEach(phase => {
        if (phase.corruptionLoadoutName === oldName) {
            phase.corruptionLoadoutName = newName;
        }
        phase.strat.forEach(entry => {
            if (entry.loadoutName === oldName) {
                entry.loadoutName = newName;
            }
        });
    });

    if (strategy.aoagPhase) {
        if (strategy.aoagPhase.corruptionLoadoutName === oldName) {
            strategy.aoagPhase.corruptionLoadoutName = newName;
        }
        strategy.aoagPhase.strat.forEach(entry => {
            if (entry.loadoutName === oldName) {
                entry.loadoutName = newName;
            }
        });
    }
};

const openCorruptionLoadoutEditorModal = async (
    uiMod: HSUI,
    existingNames: string[],
    existingLoadout?: CorruptionLoadoutDefinition,
    parentModalId?: string
): Promise<CorruptionLoadoutDefinition | null> => {
    const modalId = "hs-autosing-corruption-loadout-editor";
    const isEdit = !!existingLoadout;
    const workingLoadout = existingLoadout ? { ...existingLoadout.loadout } : createEmptyLoadout();
    const originalName = existingLoadout?.name ?? "";

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
                value="${workingLoadout[key] ?? 0}"
            />
        </div>
    `).join("");

    const modalContent = {
        htmlContent: `
            <div id="${modalId}" class="hs-corruption-modal-container">
                <div class="hs-strategy-input-section">
                    <div class="hs-strategy-input-label">Loadout Name</div>
                    <input
                        type="text"
                        id="hs-corruption-loadout-name"
                        class="hs-strategy-name-input"
                        placeholder="Enter loadout name..."
                        value="${originalName}"
                    />
                </div>
                <div class="hs-corruption-grid">
                    ${corruptionRows}
                </div>
                <div class="hs-strategy-error" id="hs-corruption-loadout-editor-error" style="display:none;"></div>
                <div class="hs-corruption-footer">
                    <div class="hs-corruption-done-btn" id="hs-corruption-loadout-save-btn">
                        ${isEdit ? "Save" : "Create"}
                    </div>
                    <div class="hs-corruption-done-btn" id="hs-corruption-loadout-cancel-btn">
                        Cancel
                    </div>
                </div>
            </div>
        `,
        title: isEdit ? "Edit Corruption Loadout" : "Create Corruption Loadout"
    };

    const modalInstance = await uiMod.Modal({
        ...modalContent,
        parentModalId
    });

    return new Promise(resolve => {
        setTimeout(() => {
            const errorBox = document.getElementById("hs-corruption-loadout-editor-error") as HTMLDivElement | null;

            const closeModal = (result: CorruptionLoadoutDefinition | null) => {
                HSUI.removeInjectedStyle("hs-corruption-modal-styles");
                uiMod.CloseModal(modalInstance);
                resolve(result);
            };

            document.getElementById("hs-corruption-loadout-save-btn")?.addEventListener("click", () => {
                const nameInput = document.getElementById("hs-corruption-loadout-name") as HTMLInputElement | null;
                const nameValue = nameInput?.value.trim() ?? "";

                if (!nameValue) {
                    if (errorBox) {
                        errorBox.textContent = "Loadout name is required.";
                        errorBox.style.display = "block";
                    }
                    return;
                }

                const nameTaken = existingNames.some(name => name === nameValue && name !== originalName);
                if (nameTaken) {
                    if (errorBox) {
                        errorBox.textContent = `Loadout name "${nameValue}" already exists.`;
                        errorBox.style.display = "block";
                    }
                    return;
                }

                (Object.keys(corruptionMeta) as CorruptionKey[]).forEach(key => {
                    const input = document.getElementById(`hs-corruption-${key}`) as HTMLInputElement;
                    const value = Math.max(0, Math.min(16, Number(input?.value) || 0));
                    workingLoadout[key] = value;
                });

                closeModal({
                    name: nameValue,
                    loadout: workingLoadout
                });
            });

            document.getElementById("hs-corruption-loadout-cancel-btn")?.addEventListener("click", () => {
                closeModal(null);
            });
        }, 0);
    });
};

export async function openAutosingCorruptionLoadoutsModal(
    uiMod: HSUI,
    strategy: HSAutosingStrategy,
    parentModalId?: string
): Promise<void> {
    const modalId = "hs-autosing-corruption-loadouts-modal";
    if (!Array.isArray(strategy.corruptionLoadouts)) strategy.corruptionLoadouts = [];

    const loadouts = strategy.corruptionLoadouts;

    const renderList = () => {
        const container = document.getElementById("hs-corruption-loadout-list");
        if (!container) return;

        if (loadouts.length === 0) {
            container.innerHTML = '<div class="hs-strategy-empty-state">No corruption loadouts created yet.</div>';
            return;
        }

        container.innerHTML = loadouts.map((loadout, index) => `
            <div class="hs-strategy-phase-item">
                <div class="hs-strategy-phase-text">
                    <strong>${loadout.name}</strong>
                </div>
                <div class="hs-strategy-btn hs-strategy-btn-icon hs-strategy-btn-edit" data-loadout-index="${index}" data-action="edit">
                    ✎
                </div>
                <div class="hs-strategy-btn hs-strategy-btn-icon hs-strategy-btn-delete" data-loadout-index="${index}" data-action="delete">
                    ×
                </div>
            </div>
        `).join("");
    };

    const modalContent = {
        htmlContent: `
            <div class="hs-strategy-modal-container" id="${modalId}">
                <div class="hs-strategy-input-section">
                    <div class="hs-strategy-input-label">Corruption Loadouts</div>
                    <div id="hs-corruption-loadout-list" class="hs-strategy-phase-list"></div>
                </div>
                <div class="hs-strategy-error" id="hs-corruption-loadout-error" style="display:none;"></div>
                <div class="hs-strategy-btn-group">
                    <div class="hs-strategy-btn hs-strategy-btn-secondary" id="hs-corruption-loadout-create">
                        + Create Loadout
                    </div>
                    <div class="hs-strategy-btn hs-strategy-btn-primary" id="hs-corruption-loadout-done">
                        Done
                    </div>
                </div>
            </div>
        `,
        title: "Corruption Loadouts"
    };

    const modalInstance = await uiMod.Modal({
        ...modalContent,
        parentModalId
    });

    setTimeout(() => {
        const root = document.getElementById(modalId);
        const errorBox = document.getElementById("hs-corruption-loadout-error") as HTMLDivElement | null;

        const showError = (message: string) => {
            if (!errorBox) return;
            errorBox.textContent = message;
            errorBox.style.display = "block";
        };

        const clearError = () => {
            if (!errorBox) return;
            errorBox.textContent = "";
            errorBox.style.display = "none";
        };

        renderList();

        root?.addEventListener("click", async (e) => {
            const el = e.target as HTMLElement;
            const action = el.dataset.action;
            const index = el.dataset.loadoutIndex ? Number(el.dataset.loadoutIndex) : -1;

            if (el.id === "hs-corruption-loadout-create") {
                clearError();
                const created = await openCorruptionLoadoutEditorModal(uiMod, loadouts.map(l => l.name), undefined, modalInstance);
                if (created) {
                    loadouts.push(created);
                    renderList();
                }
            }

            if (action === "edit" && index >= 0) {
                clearError();
                const existing = loadouts[index];
                const updated = await openCorruptionLoadoutEditorModal(uiMod, loadouts.map(l => l.name), existing, modalInstance);
                if (updated) {
                    if (existing.name !== updated.name) {
                        updateLoadoutReferences(strategy, existing.name, updated.name);
                    }
                    loadouts[index] = updated;
                    renderList();
                }
            }

            if (action === "delete" && index >= 0) {
                clearError();
                const loadout = loadouts[index];
                const usages = findLoadoutUsages(strategy, loadout.name);
                if (usages.length > 0) {
                    showError(`Cannot delete loadout "${loadout.name}". In use by: ${usages.join(", ")}.`);
                    return;
                }
                loadouts.splice(index, 1);
                renderList();
            }

            if (el.id === "hs-corruption-loadout-done") {
                HSUI.removeInjectedStyle("hs-strategy-modal-styles");
                uiMod.CloseModal(modalInstance);
            }
        });
    }, 0);
}
