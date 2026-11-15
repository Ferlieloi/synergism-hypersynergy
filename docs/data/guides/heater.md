# Ambrosia Heater guide

The Ambrosia Heater finds, for your save, the best Ambrosia upgrade tree for each goal: Ambrosia itself, Quarks, Cubes, Octeracts, Obtainium, Offerings and more. Then it puts those trees into your game's loadout slots. This guide walks through a first heat; every option is on the [Heater's wiki page](https://ferlieloi.github.io/synergism-hypersynergy/docs/wiki/heater.html).

## Open it

![The Ambrosia Heater Inputs window: what the Heater read from your save on the left; the loadouts to heat, Start Heater and your loadout order on the right](../../res/guides/heater-inputs@2x.webp#past-headings)

Open the mod panel (the mod's icon, top left), then Tools → **Ambrosia Heater**. The [menu by the mod's icon](https://ferlieloi.github.io/synergism-hypersynergy/docs/wiki/interface.html#quick-menu) opens it too. The **Ambrosia Heater Inputs** window opens, filled from your game: its left column holds what the Heater read from your save, which you rarely need to change.

## Say which slot holds what

Under **Your Loadout Order** ①, each line is one of the game's loadout slots (L1, L2…). Pick what each slot is for: All Ambrosia, Quarks, Octeracts, an H row for cubes before AOAG… Leave a slot you don't want the Heater to touch at **None**.

The checkbox ② at the end of a line says whether **Import All** fills that slot: untick a slot to keep its tree as it is.

## Heat

1. Under **Loadouts to heat** ③, tick what to compute. **☰** ④ at the end of that line ticks exactly what your slots need, the quickest heat. Obt + Off is slower and starts unticked.
2. Click **🔥 Start Heater** ⑤. A heat usually takes under a minute; the button counts the seconds, and **✖** next to it cancels.

## Read the results

![The Ambrosia Heater results window after a heat: common, Obtainium and Offering, p4x4 and hybrid loadouts](../../res/guides/heater-results@2x.webp#past-headings)

The results window opens when the heat ends. Each row is the best tree for one goal, grouped in sections: Common Loadouts, Obtainium & Offering Loadouts, p4x4 (pre-AoAG) Loadouts, Hybrid Loadouts.

- **Blueberries and Ambrosia** Ⓐ (the two icons): what the tree costs.
- **Effect** Ⓑ: what the tree gives for its goal.
- **Maxed:** ✔ means more Ambrosia or Blueberries wouldn't improve that tree. ✘ Ⓒ means they would: the icon after it says which one, and hovering the ✘ shows the levels still missing.
- **Unaffordable** Ⓓ: you can't buy that tree yet; the figure in red is what you're short of.
- **Cubes before AOAG:** the H0–H7 rows, one per Hyperflux level. Their **p4x4 eq** Ⓔ is how many P4x4 you need for that row to beat the rows above it, and **★ now** Ⓕ marks the best one at your current P4x4.

A **Red Ambrosia Upgrades** window opens with the results: it compares those upgrades for your save.

## Import them in your slots

- For one tree only: **Import** on its row puts it into the loadout slot currently active; **Copy** copies it as text, ready for a [**Quick Import**](https://ferlieloi.github.io/synergism-hypersynergy/docs/wiki/ambrosia.html#quick-import) (Ambrosia tab).
- **Import All ☑ Loadouts** ⑥ (in the Inputs window) writes each ticked slot's tree into it. A slot set to **Best H (P4x4 now)** gets the H row that wins at your P4x4 at that moment.
- **Sync All Icons** ⑦ gives each slot an icon that matches its role.
- **Sync All Loadout Settings** ⑧ gives your slots' roles to [Auto-Sing](https://ferlieloi.github.io/synergism-hypersynergy/docs/wiki/autosing.html#autosing-loadouts), the [ADD and TIME code loadouts](https://ferlieloi.github.io/synergism-hypersynergy/docs/wiki/ambrosia.html#code-loadouts) and the [timed export](https://ferlieloi.github.io/synergism-hypersynergy/docs/wiki/saves.html#export-loadout), so you don't set them by hand.

## When to heat again

Heat again when your Ambrosia or Blueberries have grown, or after upgrades that change your Ambrosia luck or speed. The Heater reads your game when it opens: if its window was already open, click **Update 🔓 Inputs** first.

> [!TIP]
> Before a big change of trees, make a [backup](https://ferlieloi.github.io/synergism-hypersynergy/docs/wiki/saves.html#full-backup) (Tools → Backup & Restore → Export to file): your old loadouts are in it.
