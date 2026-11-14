# Corruption predictor

The Corruption page's **Find optimal level** button estimates the ordinary cube yield of two C1–C10 sweeps: 0.5 seconds per challenge on the first pass, 20 seconds on the second, with 0.1-second gaps. All visits use their full allocation. Since the duration is fixed, comparing yield also compares income per real second. **Use level** changes the next ascension's level through `HSCorruptionLevel`; computing never changes the live player or starts an ascension. Auto-climb and Autosing must be off before applying a result.

This is an experimental production-ceiling estimator, not a validated startup simulator. It requires Instant Challenge II, corruption unlocked, and previously capped C6–C8. Ascension and singularity challenges are unsupported. The model assumes immediate capped coin production; C6–C8 reach their caps on their first visits. It freezes research, upgrades, ants, runes, loadouts, purchased building counts and the starting atom bonus. The two loops update C1–C5, C9 and C10 through threshold events; C6 and C10 rewards update the tax ceiling as they are earned. Gaps add no progression under those frozen assumptions. No full-game ticks run.

The search enumerates all currently allowed integer levels, prefers the lower level on ties, and rejects candidates with no C10 completion. Output is a relative cube yield, not an absolute payout: the model ranks cube bank × corruption rate × Platonic 1 × C9's OMEGA bonus, with Tau applied. Common reward multipliers cancel. It does not model payout saturation, the floor at small payouts, upgrade purchases or bonus changes during the sweep. It is intended for advanced saves with large payouts below saturation. At high corruption, viscosity/construction/recession can stop production reaching the tax ceiling and change the winning level; the displayed assumption is essential.

Implementation: `hs-modules/hs-corruption-predictor/`. The pure threshold/search engine is separate from the GDS input adapter and UI. `hs-corruption-coin-input.ts` adapts the Heater coin export's tax and speed inputs to ordinary challenges (no C15 tax, dilation or spirit factors). Existing Heater code remains unchanged. Calculation snapshots have independent helpers/caches and mutable completion arrays. The button reads a fresh GDS snapshot at each click, waits until the save loads, and rejects applying across major progression changes.

Formula sources: SynergismOfficial `fc3120ef6e9a929eb577739ce984c2548594875a`, `Tax.ts`, `Challenges.ts`, `Statistics.ts`, `Calculate.ts`, `Platonic.ts`, and `Synergism.ts`. Compare these again when the game updates, including Steam's deployed version.

Validation still needed: real two-loop runs at levels around the predicted winner, comparing per-challenge completions. A save or HS backup and measured challenge results are needed to assess recommendation accuracy and decide whether startup/shard production must be added. The existing GDS reference snapshot exercises the complete search and source-state isolation; it supplies no measured two-loop outcomes.

Manual check with an advanced save, Instant Challenge II and capped C6–C8:

1. Open Ascension → Corruptions. There should be exactly one Find optimal level button below the level controls.
2. Note current/next levels, click Find optimal level. A result or an explicit unsupported-state message appears. Both levels must stay unchanged.
3. Expand Predicted challenge completions: C1–C10 appear, each within its cap, with C10 above zero for a result.
4. With Auto-climb off and Autosing stopped, click Use level N. The next level must become exactly N; the current level must stay unchanged.
5. Enable Auto-climb, recompute and try applying. It must explain that Auto-climb needs turning off and leave both levels unchanged.
6. Enter C15 and calculate. It must ask to leave the challenge and change no game state.
7. With no Instant Challenge II, or C6–C8 below their current caps, calculation must explain the unsupported condition instead of displaying an optimum.
