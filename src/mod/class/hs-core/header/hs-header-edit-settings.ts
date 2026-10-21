import { HSSettingsDefinition } from "../../../types/module-types/hs-settings-types";
import { HSGlobal } from "../hs-global";
import { HSLogger } from "../hs-logger";
import { HSUI } from "../hs-ui";
import { HSSettings } from "../settings/hs-settings";
import headerEditSettingsCSS from "inline:../../../resource/css/module/hs-header-edit-settings.css";

type HSSlotCountKind = 'corruption' | 'ambrosia';

interface HSSlotCountDef {
    setting: 'headerCorruptionSlotsShown' | 'headerAmbrosiaSlotsShown';
    containerId: string;
    // The game's icon for the header module (its img in the header can be the mod's cleanse button)
    icon: string;
    title: string;
    name: string;
}

interface HSToggleDef {
    setting: keyof HSSettingsDefinition;
    label: string;
    // Shown only when this holds (the line makes no sense otherwise)
    shown?: () => boolean;
    // Added to the tooltip without the header modules patch (bookmarklet)
    withoutPatch?: string;
}

const SLOT_COUNTS: Record<HSSlotCountKind, HSSlotCountDef> = {
    corruption: {
        setting: 'headerCorruptionSlotsShown',
        containerId: 'corruptionLoadoutsHeaderSlots',
        icon: 'Pictures/Tab Icons/Tabs/Corruption.png',
        title: 'How many corruption loadout slots the header shows. The others still work through hotkeys and the Corruption tab.',
        name: 'Corruption',
    },
    ambrosia: {
        setting: 'headerAmbrosiaSlotsShown',
        containerId: 'ambrosiaLoadoutsHeaderSlots',
        icon: 'Pictures/Default/Blueberries.png',
        title: 'How many ambrosia loadout slots the header shows. The others still work through hotkeys and the Ambrosia tab.',
        name: 'Ambrosia',
    },
};

// The mod's modules are header modules only with the patcher's header modules patch; without it, they are in the
// mod's own row (#quickbarsRow), which "Center quick bars" moves
const hasHeaderModules = () => !!(window as any).__HS_HEADER_MODULES_PATCHED;

// In the block's order, before the visible slots
const SECTIONS: { title: string; toggles: HSToggleDef[] }[] = [
    {
        title: 'Layout',
        toggles: [
            { setting: 'headerStatsAtBottom', label: 'Top row at the bottom' },
        ],
    },
    {
        title: 'Mod modules',
        toggles: [
            { setting: 'enableAutomationQuickBar', label: 'Automation bar', withoutPatch: "It shows in the mod's row under the header." },
            { setting: 'ambrosiaMinibars', label: 'Ambrosia minibars', withoutPatch: "They show in the mod's row under the header, and need GDS (turned on with them)." },
            { setting: 'ambrosiaRateHeader', label: 'Ambrosia per hour', shown: hasHeaderModules },
            { setting: 'centerQuickbars', label: 'Center quick bars', shown: () => !hasHeaderModules() },
        ],
    },
    {
        title: 'Corruption modules',
        toggles: [
            { setting: 'corruptionHeaderLevels', label: 'Levels line' },
        ],
    },
];

// The game's most loadout slots of each kind: the stored value for "all"
const MAX_SLOTS = 16;
const BLOCK_ID = 'hs-header-edit-settings';
const HIDE_STYLE_ID = 'hs-header-slot-count-hide-css';

/**
 * Class: HSHeaderEditSettings
 * IsExplicitHSModule: No
 * Description:
 *     "[HS] Header", a block next to the game's header tray (#headerTray, inside #headerEditPanel, which the game only
 *     shows in the header's edit mode and never rebuilds): the mod's header settings, out of the panel.
 *     - Visible slots: how many slots the game's Corruption and Ambrosia loadouts modules show (the first N; the
 *       others are hidden by CSS, nth-child, so the rule outlives the game's rebuild of the slots, and still work
 *       everywhere else). Hidden settings headerCorruptionSlotsShown and headerAmbrosiaSlotsShown, 16 = all. The
 *       slots owned are read from the slots the game draws (all of them in edit mode).
 *     - Checkboxes for the header settings (hidden in the panel), switched through enable()/disable(), with the
 *       panel's GDS check. They follow every change of those settings (HSSettings.onStateChange), wherever it comes
 *       from.
 *     The counters refresh when edit mode shows the block (the slots owned may have changed): a 1 ms CSS animation
 *     restarts each time #headerEditPanel goes from display: none to shown, and its animationstart event triggers
 *     the refresh (no observer, no polling).
 *     No patcher feature: works for every player.
 * Author: maenhiir
 */
export class HSHeaderEditSettings {
    static #context = 'HSHeaderEditSettings';
    static #slotValues = new Map<HSSlotCountKind, HTMLElement>();
    static #minusButtons = new Map<HSSlotCountKind, HTMLButtonElement>();
    static #plusButtons = new Map<HSSlotCountKind, HTMLButtonElement>();
    static #checkboxes = new Map<keyof HSSettingsDefinition, HTMLInputElement>();
    static #hideRuleInjected = false;

    /** Hides the slots above the counts, and adds the block next to the game's header tray. */
    static install(): void {
        if (document.getElementById(BLOCK_ID)) return;

        HSUI.injectStyle(headerEditSettingsCSS, 'hs-header-edit-settings-css');
        HSHeaderEditSettings.#writeHideRule();
        HSUI.flushInjectedStyles();

        const tray = document.getElementById('headerTray');
        if (!tray) {
            HSLogger.warn('The game\'s header tray was not found: no [HS] Header block (the saved slot counts still apply)', HSHeaderEditSettings.#context);
            return;
        }

        const block = document.createElement('div');
        block.id = BLOCK_ID;
        const title = document.createElement('span');
        title.className = 'hs-hes-title';
        title.textContent = '[HS] Header';
        const sections = document.createElement('div');
        sections.className = 'hs-hes-sections';
        for (const section of SECTIONS) {
            const element = HSHeaderEditSettings.#buildToggleSection(section.title, section.toggles);
            if (element) sections.append(element);
        }
        sections.append(HSHeaderEditSettings.#buildSlotSection());
        block.append(title, sections);

        block.addEventListener('animationstart', () => HSHeaderEditSettings.#refresh());
        // A setting turned on or off elsewhere while the block is shown (the panel, GDS turning its dependents off
        // and back on, Auto-Sing)
        HSSettings.onStateChange(name => {
            const checkbox = HSHeaderEditSettings.#checkboxes.get(name as keyof HSSettingsDefinition);
            if (checkbox) checkbox.checked = HSSettings.getSetting(name as keyof HSSettingsDefinition).isEnabled();
        });
        tray.after(block);
        HSHeaderEditSettings.#refresh();
    }

    static #buildSection(title: string): HTMLElement {
        const section = document.createElement('div');
        section.className = 'hs-hes-section';
        const subtitle = document.createElement('span');
        subtitle.className = 'hs-hes-subtitle';
        subtitle.textContent = title;
        section.append(subtitle);
        return section;
    }

    // ======================================================
    // -------------------- Visible slots --------------------
    // ======================================================

    static #buildSlotSection(): HTMLElement {
        const section = HSHeaderEditSettings.#buildSection('Visible slots');
        for (const kind of Object.keys(SLOT_COUNTS) as HSSlotCountKind[]) {
            const def = SLOT_COUNTS[kind];
            const line = document.createElement('div');
            line.className = 'hs-hes-slots';
            line.title = def.title;

            const icon = document.createElement('img');
            icon.src = def.icon;
            icon.alt = def.name;

            const minus = document.createElement('button');
            minus.type = 'button';
            minus.textContent = '−';
            minus.addEventListener('click', () => HSHeaderEditSettings.#step(kind, -1));

            const value = document.createElement('span');
            value.className = 'hs-hes-slots-value';

            const plus = document.createElement('button');
            plus.type = 'button';
            plus.textContent = '+';
            plus.addEventListener('click', () => HSHeaderEditSettings.#step(kind, 1));

            HSHeaderEditSettings.#slotValues.set(kind, value);
            HSHeaderEditSettings.#minusButtons.set(kind, minus);
            HSHeaderEditSettings.#plusButtons.set(kind, plus);
            line.append(icon, minus, value, plus);
            section.append(line);
        }
        return section;
    }

    // The saved count, 1 to 16 (anything else in storage counts as all)
    static #getCount(kind: HSSlotCountKind): number {
        const value = Number(HSSettings.getSetting(SLOT_COUNTS[kind].setting).getValue());
        return Number.isInteger(value) && value >= 1 && value <= MAX_SLOTS ? value : MAX_SLOTS;
    }

    // The slots the game draws: all owned ones in edit mode, 0 while the module was never drawn
    static #getOwned(kind: HSSlotCountKind): number {
        return document.getElementById(SLOT_COUNTS[kind].containerId)?.children.length ?? 0;
    }

    static #step(kind: HSSlotCountKind, delta: number): void {
        const owned = HSHeaderEditSettings.#getOwned(kind);
        if (owned === 0) return;

        const shown = Math.min(HSHeaderEditSettings.#getCount(kind), owned);
        const next = Math.max(1, Math.min(owned, shown + delta));
        // All the slots owned: stored as 16, so slots bought later show too
        const stored = next >= owned ? MAX_SLOTS : next;
        if (stored !== HSHeaderEditSettings.#getCount(kind)) {
            HSSettings.getSetting(SLOT_COUNTS[kind].setting).setValue(stored);
            HSHeaderEditSettings.#writeHideRule();
            HSUI.flushInjectedStyles();
            HSLogger.log(`${SLOT_COUNTS[kind].name} loadout slots shown in the header: ${stored === MAX_SLOTS ? 'all' : stored}`, HSHeaderEditSettings.#context);
        }
        HSHeaderEditSettings.#refresh();
    }

    static #writeHideRule(): void {
        const rules: string[] = [];
        for (const kind of Object.keys(SLOT_COUNTS) as HSSlotCountKind[]) {
            const count = HSHeaderEditSettings.#getCount(kind);
            if (count < MAX_SLOTS) {
                rules.push(`#${SLOT_COUNTS[kind].containerId} > .headerLoadoutSlot:nth-child(n+${count + 1}) { display: none; }`);
            }
        }
        // injectStyle keeps an existing block of the same id; removing a missing one logs a warning
        if (HSHeaderEditSettings.#hideRuleInjected) HSUI.removeInjectedStyle(HIDE_STYLE_ID);
        HSHeaderEditSettings.#hideRuleInjected = rules.length > 0;
        if (rules.length > 0) HSUI.injectStyle(rules.join('\n'), HIDE_STYLE_ID);
    }

    // ======================================================
    // ---------------------- Settings ----------------------
    // ======================================================

    static #buildToggleSection(title: string, toggles: HSToggleDef[]): HTMLElement | null {
        const shown = toggles.filter(toggle => !toggle.shown || toggle.shown());
        if (shown.length === 0) return null;

        const section = HSHeaderEditSettings.#buildSection(title);
        for (const toggle of shown) {
            const definition = HSSettings.getSetting(toggle.setting)?.getDefinition();
            if (!definition) continue;

            // As "[HS] Keep my header layout" (HSHeaderKeepOnImport)
            const label = document.createElement('label');
            label.className = 'hs-hes-toggle';
            const help = [definition.settingHelpText, hasHeaderModules() ? undefined : toggle.withoutPatch];
            label.title = help.filter(Boolean).join(' ');
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.addEventListener('change', () => HSHeaderEditSettings.#toggle(toggle.setting, checkbox.checked));
            label.append(checkbox, toggle.label);

            HSHeaderEditSettings.#checkboxes.set(toggle.setting, checkbox);
            section.append(label);
        }
        return section;
    }

    static #toggle(name: keyof HSSettingsDefinition, enabled: boolean): void {
        const setting = HSSettings.getSetting(name);
        const definition = setting.getDefinition();

        // As the panel: no setting that needs GDS while GDS is off (except those that turn it on themselves)
        if (enabled && HSSettings.usesGameData(definition)
            && !HSGlobal.HSSettings.gameDataCheckBlacklist.includes(definition.settingName)
            && !HSSettings.getSetting('useGameData')?.isEnabled()) {
            HSLogger.warn(`Enable GDS before enabling ${definition.settingDescription}!`, HSHeaderEditSettings.#context);
            void HSUI.Notify(`Turn on Game Data Sniffing (mod panel) before "${definition.settingDescription}".`, { notificationType: 'warning' });
            HSHeaderEditSettings.#refresh();
            return;
        }

        HSLogger.log(`${definition.settingName}: ${!enabled} -> ${enabled}`, HSHeaderEditSettings.#context);
        if (enabled) setting.enable();
        else setting.disable();
        HSHeaderEditSettings.#refresh();
    }

    // ======================================================
    // ----------------------- Refresh -----------------------
    // ======================================================

    static #refresh(): void {
        for (const kind of Object.keys(SLOT_COUNTS) as HSSlotCountKind[]) {
            const owned = HSHeaderEditSettings.#getOwned(kind);
            const count = HSHeaderEditSettings.#getCount(kind);
            const all = count >= MAX_SLOTS || (owned > 0 && count >= owned);
            HSHeaderEditSettings.#slotValues.get(kind)!.textContent = all ? 'All' : `${count}`;
            HSHeaderEditSettings.#minusButtons.get(kind)!.disabled = owned === 0 || Math.min(count, owned) <= 1;
            HSHeaderEditSettings.#plusButtons.get(kind)!.disabled = owned === 0 || all;
        }
        for (const [name, checkbox] of HSHeaderEditSettings.#checkboxes) {
            checkbox.checked = HSSettings.getSetting(name).isEnabled();
        }
    }
}
