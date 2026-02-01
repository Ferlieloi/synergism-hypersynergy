# Hypersynergism Fork: Succinct Dev Summary (v3.4)

High-level summary of architectural improvements and stability fixes in the **Hypersynergism** fork.

---

## 🏗️ 1. Architectural Stability
*   **Deterministic Handshake**: The loader waits for the game to be "Exposed" via UI interaction before triggering `init()`, ensuring all internal game variables are available.
*   **Registry Lock (v3.4)**: Overrides `customElements.define` to block the original game script's registration, preventing "Illegal constructor" collisions on injection.
*   **Defensive Hooking**: Uses polling loops and `nullProxy` patterns to safely manage dynamic DOM elements that are frequently recreated by the game's engine.

---

## 🛠️ 2. Critical Fixes & Cleanup
*   **Wait-for-Body Guard**: Fixed a `TypeError` by using a `MutationObserver` to pause script injection until `document.body` is fully parsed.
*   **Single Entry Point**: Reconciled initialization by adding an internal guard to the mod's `init()` function, allowing the loader to safely trigger it without redundant executions.
*   **Log Optimization**: Replaced hundreds of `Injected new CSS/HTML` logs with a single batched **"Flush"** log for better readability and boot performance.
*   **Debounced Saving**: Uses a **250ms debounce** to collapse rapid settings changes into a single disk write.
*   **Ambrosia Logic**: Resolved a bug causing erroneous loadout warnings during synchronous state restoration.

---

## 🚀 3. Feature Enhancements
*   **Fuzzy Save Sync**: Uses an **80% similarity threshold** to automatically restore Ambrosia loadouts from saves, ensuring stability across minor upstream updates.
*   **"Finish & Stop" Automation**: Rebuilt the Timer Modal to allow the mod to complete multi-stage singularities (including C11-15 pushing and loading Ambrosia Luck Loadout) before handing control back to the user.
*   **O(1) Stats Processing**: Performance-optimized real-time rate calculations to ensure zero frame-rate impact during high-speed play.

---

> [!NOTE]
> All documentation and stability fixes are active on the `ui-restoration-progress` branch.
