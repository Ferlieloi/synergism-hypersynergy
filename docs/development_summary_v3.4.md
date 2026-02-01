# Hypersynergism Fork: Development Summary (v3.4)

This document provides a technical overview of the architectural changes, stability fixes, and feature enhancements implemented in the **Hypersynergism** fork. It is intended for the repository owner and maintainers to provide context for the current state of the project.

---

## 🏗️ 1. Core Architecture & "Critical Fixes"

The fork's stability is built on several key engineering patterns designed to handle the asynchronous and obfuscated nature of the base game.

### A. Deterministic Initialization (The "Handshake")
The mod avoids auto-initialization to prevent race conditions during the game's boot sequence.
- **The Gap**: The game uses "lazy loading" for its UI and internal functions. Objects like `i18next` or Stage Logic are often inaccessible at the moment of script injection.
- **The Solution**: The **Loader (v3.4)** orchestrates a multi-stage handshake:
    1.  **Exposure via UI**: The loader automatically clicks through game settings to trigger the game's internal data population.
    2.  **The Trigger**: Only once `window.__HS_EXPOSED` is confirmed, the loader explicitly calls `hypersynergism.init()`.
- **The Safeguard**: An internal `#isInitialized` flag in the mod's main class prevents redundant setup if the trigger is fired multiple times across different browser events.

### B. Chrome Collision Fix (Registry Lock)
To support patching the game bundle without browser errors, the loader implements a registry lock.
- **Mechanism**: The loader overrides `customElements.define` with a logic gate.
- **Rationale**: Chromium browsers throw an "Illegal constructor" error if an element is registered twice. By locking the registry, we allow the *original* script to fail/crash while keeping the registry clean for our *patched* bundle.

### C. Defensive DOM Hooking
Instead of standard event listeners, the mod uses a custom `HSElementHooker`.
- **Logic**: A polling/retry loop (`setInterval`) manages elements that are destroyed and recreated by the game's TypeScript engine.
- **Safety**: Uses a `nullProxy` pattern to ensure that if an element is missing, the mod doesn't throw a fatal TypeError, but instead fails gracefully.

---

## 🚀 2. Recent Stability & Performance Fixes (v3.4)

### Loader "Wait-for-Body" Guard
Fixed a critical `TypeError` where the game script would attempt `querySelector` on a null `body` during early injection.
- **Fix**: Implemented a `MutationObserver` in the loader to pause injection until `document.body` is parsed.

### Cleanup & Performance
- **Double-Init Prevention**: Reconciled the mod script and loader to ensure a single, controlled entry point.
- **Log Silencing**: Replaced hundreds of high-frequency `Injected new CSS/HTML` logs with a single batched **"Flush"** log. This improves console readability and boot performance while still providing a clear "Success" signal to developers.
- **Ambrosia Logic**: Fixed a logic bug where loadout warnings were appearing erroneously during synchronous state restoration.

---

## 📈 3. Feature Enhancements

### Similarity Engine (Ambrosia)
The mod now handles save-loading more intelligently using a "fuzzier" matching system.
- **Threshold**: Uses an **80% similarity threshold** to restore loadouts.
- **Benefit**: Prevents "Unknown Loadout" errors when loading saves that have minor differences from the stored definitions, common after upstream game updates.

### Auto-Sing Timer Modal 2.0
A total technical rebuild of the statistics dashboard:
- **State-Based Stopping**: The "Finish & Stop" logic allows the mod to complete a multi-stage singularity (including C11-15 pushing and loading Ambrosia Luck Loadout) before handing control back to the user.
- **O(1) Data Processing**: Replaced array-summing logic with cumulative counters, allowing real-time rate calculations with zero impact on the game's frame rate.

---

## 📊 Summary of Modified Files (Since Sync)
- **Stability**: `HSLoader3.4_CollisionFix.js`, `DEV_HSLoader3.4_CollisionFix.js`
- **Automation**: `hs-autosing.ts`, `hs-autosingTimerModal.ts`
- **Core Logic**: `hs-settings.ts`, `hs-ui.ts`, `hs-gamedata.ts`, `hypersynergism.ts`

---

> [!NOTE]
> All architectural patterns and stability fixes documented here are currently active on the `ui-restoration-progress` branch.
