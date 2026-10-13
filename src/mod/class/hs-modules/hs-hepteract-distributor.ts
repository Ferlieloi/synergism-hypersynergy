import { HSModuleOptions } from "../../types/hs-types";
import { HSElementHooker } from "../hs-core/hs-elementhooker";
import { HSGlobal } from "../hs-core/hs-global";
import { HSLogger } from "../hs-core/hs-logger";
import { HSUI } from "../hs-core/hs-ui";
import { HSModule } from "../hs-core/module/hs-module";
import { HSModuleManager } from "../hs-core/module/hs-module-manager";
import { HSSettings } from "../hs-core/settings/hs-settings";
import { HSNumberParser } from "../hs-utils/hs-number-parser";
import { HSUtils } from "../hs-utils/hs-utils";
import type { HSGameDataAPI } from "../hs-core/gds/hs-gamedata-api";
import type { HSAutosing } from "./hs-autosing/hs-autosing";
import type { HepteractKeys } from "../../types/data-types/hs-player-savedata";
import { HepteractPlan, HepteractPlanState, HepteractPlanType, planHepteractDistribution } from "./hs-hepteract-distributor-plan";
import { HEPTERACT_DATA, HepteractState, readHepteract } from "./hs-hepteract-state";
import distributorCSS from "inline:../../resource/css/module/hs-hepteract-distributor.css";

type HepteractKey = Exclude<HepteractKeys, 'quark'>;

interface HepteractInfo {
    key: HepteractKey;
    label: string;
}

// In the forge's order. The Quark hepteract has no row, as in quick expand: it also spends quarks.
const HEPTERACTS: HepteractInfo[] = [
    { key: 'chronos', label: 'Chronos' },
    { key: 'hyperrealism', label: 'Hyperrealism' },
    { key: 'challenge', label: 'Challenge' },
    { key: 'abyss', label: 'Abyss' },
    { key: 'accelerator', label: 'Accelerator' },
    { key: 'acceleratorBoost', label: 'Accelerator Boost' },
    { key: 'multiplier', label: 'Multiplier' },
];

/** One of the game's own on/off buttons: its state is read from the live player, and changed by clicking it. */
interface GameSwitch {
    id: string;
    isOn: (player: any) => boolean;
}

const hepteractAuto = (key: string): GameSwitch => ({ id: `${key}HepteractAuto`, isOn: player => player.hepteracts?.[key]?.AUTO === true });
// Every hepteract's Auto, the Quark one included: at an ascension, each type with Auto on gets the same amount
const HEPTERACT_AUTOS: GameSwitch[] = [...HEPTERACTS.map(info => info.key), 'quark'].map(hepteractAuto);
const ORBS_AUTO: GameSwitch = { id: 'hepteractToQuarkTradeAuto', isOn: player => player.overfluxOrbsAutoBuy === true };
// With it on, the game only ascends once Challenge 10 is completed again, and asks a Confirm
const ASCENSION_CONFIRMATION: GameSwitch = { id: 'toggle31', isOn: player => player.toggles?.[31] === true };
// What the game also does at each ascension (Reset.ts): suspended for the Distributor's own ascensions
const ASCENSION_AUTOMATIONS: GameSwitch[] = [
    { id: 'openCubes', isOn: player => player.autoOpenCubes === true },
    { id: 'openTesseracts', isOn: player => player.autoOpenTesseracts === true },
    { id: 'openHypercubes', isOn: player => player.autoOpenHypercubes === true },
    { id: 'openPlatonicCube', isOn: player => player.autoOpenPlatonicsCubes === true },
    { id: 'toggleAutoCubeUpgrades', isOn: player => player.autoCubeUpgradesToggle === true },
    { id: 'toggleAutoPlatonicUpgrades', isOn: player => player.autoPlatonicUpgradesToggle === true },
    { id: 'tesseractautobuytoggle', isOn: player => player.tesseractAutoBuyerToggle === true },
];

const ORB_COST = 250000;
const OPENED_CLASS = 'hs-hept-distributor-opened';
const LOCKED_CLASS = 'hs-hept-distributor-locked';
const SETTLE_TIME_LIMIT_MS = 2000;
// The game's auto-craft stops on a full meter as long as what is left can't pay back one more expansion, which
// takes at least a third more than the planned cost: 5% above it absorbs a cost slightly off (the cost check
// allows 1%) without ever reaching that
const AMOUNT_MARGIN = 1.05;
const ASCENSION_WARNING = 'Distribute ascends several times in a row: your current ascension ends.';

/**
 * Class: HSHepteractDistributor
 * IsExplicitHSModule: Yes
 * Description:
 *     The Hepteract Distributor, a panel in the Hepteract Forge opened by a button on the forge's welcome line
 *     (it then takes the place of the forge's three intro lines).
 *     It spends the owned hepteracts on the hepteract types so that their balances follow the ratios the player
 *     set (the rule is in hs-hepteract-distributor-plan.ts). A percentage can go to Overflux Orbs first.
 *     Crafting goes through the game's own Auto craft, which runs at an ascension and takes no other resource
 *     than hepteracts: the Distributor ascends once per type, with only that type's Auto on and the game's
 *     autocraft percentage set to that type's exact share. The player's switches and percentage are put back
 *     at the end. Needs the live player object (patched game).
 * Author: maenhiir
 */
export class HSHepteractDistributor extends HSModule {
    #tab?: HTMLElement;
    #openButton?: HTMLButtonElement;
    #panel?: HTMLElement;
    #status?: HTMLElement;
    #controls: (HTMLButtonElement | HTMLInputElement)[] = [];
    #distributeButton?: HTMLButtonElement;
    #matchButton?: HTMLButtonElement;
    #ratioInputs = new Map<HepteractKey, HTMLInputElement>();
    #cells = new Map<HepteractKey, HTMLElement>();
    #orbsIcon?: HTMLElement;

    #ratios: Partial<Record<HepteractKey, number>> = {};
    #shown = false;
    #running = false;
    // The "not available" line currently in the status, if any
    #shownReason?: string;

    constructor(moduleOptions: HSModuleOptions) {
        super(moduleOptions);
    }

    async init(): Promise<void> {
        HSLogger.log('Initialising HSHepteractDistributor module', this.context);
        this.#ratios = this.#loadRatios();
        // Shown by the enableHepteractDistributor setting's action (HSSettings.syncSettings)
        this.isInitialized = true;
    }

    async showDistributor(): Promise<void> {
        this.#shown = true;
        this.#tab ??= await HSElementHooker.HookElement('#cubeTab7') as HTMLElement;
        // Turned off again while waiting for the forge
        if (!this.#shown) return;

        HSUI.injectStyle(distributorCSS, 'hs-hept-distributor-css');
        this.#openButton ??= this.#buildOpenButton();
        this.#panel ??= this.#buildPanel();
        this.#tab.prepend(this.#openButton, this.#panel);
        this.#setOpened(HSSettings.getSetting('hepteractDistributorOpen').getValue() === true, false);
    }

    hideDistributor(): void {
        this.#shown = false;
        this.#openButton?.remove();
        this.#panel?.remove();
        this.#tab?.classList.remove(OPENED_CLASS);
    }

    // ── Panel ────────────────────────────────────────────────────────────────────────────────────────

    #buildOpenButton(): HTMLButtonElement {
        const button = document.createElement('button');
        button.id = 'hs-hept-distributor-open';
        button.type = 'button';
        button.textContent = 'Distributor';
        button.title = 'Hepteract Distributor: spend your hepteracts on the hepteract types following ratios';
        button.addEventListener('click', () => this.#setOpened(true));
        return button;
    }

    #buildPanel(): HTMLElement {
        const panel = document.createElement('div');
        panel.id = 'hs-hept-distributor';
        // What makes it unavailable (an Exalt, autosing) changes while the panel stays open
        panel.addEventListener('mouseenter', () => this.#refreshAvailability());

        const minimize = document.createElement('button');
        minimize.id = 'hs-hept-distributor-minimize';
        minimize.type = 'button';
        minimize.textContent = '–';
        minimize.title = 'Minimize';
        minimize.addEventListener('click', () => this.#setOpened(false));
        panel.appendChild(minimize);

        const title = document.createElement('div');
        title.className = 'hs-hept-distributor-title';
        title.textContent = 'Hepteract Distributor';
        title.title = 'A ratio is the balance a hepteract should hold, compared with the others (0: left alone).\n'
            + 'Distribute gives the hepteract furthest behind its ratio its next step (fill to the top, or expand then '
            + 'fill to the top), again and again, until that one can\'t pay.\n'
            + 'It crafts through the game\'s Auto craft, so only hepteracts are spent.';
        panel.appendChild(title);

        const cells = document.createElement('div');
        cells.className = 'hs-hept-distributor-cells';
        panel.appendChild(cells);

        for (const info of HEPTERACTS) {
            const cell = document.createElement('label');
            cell.className = 'hs-hept-distributor-cell';
            cell.appendChild(HSHepteractDistributor.#iconSlot());

            const input = document.createElement('input');
            input.type = 'number';
            input.min = '0';
            input.step = 'any';
            input.setAttribute('aria-label', `${info.label} ratio`);
            input.value = HSHepteractDistributor.#shownRatio(this.#ratios[info.key] ?? 0);
            input.addEventListener('input', () => {
                const value = parseFloat(input.value);
                this.#ratios[info.key] = Number.isFinite(value) && value > 0 ? value : 0;
                this.#saveRatios();
            });
            // Once the player is done typing (blur or Enter), not at each key
            input.addEventListener('change', () => {
                input.value = HSHepteractDistributor.#shownRatio(this.#ratios[info.key] ?? 0);
            });
            cell.appendChild(input);

            cells.appendChild(cell);
            this.#cells.set(info.key, cell);
            this.#ratioInputs.set(info.key, input);
            this.#controls.push(input);
        }

        const orbsCell = document.createElement('label');
        orbsCell.className = 'hs-hept-distributor-cell hs-hept-distributor-orbs';
        orbsCell.title = 'This part of your hepteracts buys Overflux Orbs first (250,000 each). The ratios run on what is left.';
        this.#orbsIcon = HSHepteractDistributor.#iconSlot();
        orbsCell.appendChild(this.#orbsIcon);
        const orbsField = document.createElement('span');
        orbsField.className = 'hs-hept-distributor-orbs-field';
        const orbsInput = document.createElement('input');
        orbsInput.type = 'number';
        orbsInput.min = '0';
        orbsInput.max = '100';
        orbsInput.step = 'any';
        orbsInput.setAttribute('aria-label', 'Percentage of hepteracts for Overflux Orbs');
        orbsInput.value = String(this.#orbsPercent());
        orbsInput.addEventListener('input', () => {
            const value = parseFloat(orbsInput.value);
            HSSettings.getSetting('hepteractDistributorOrbsPercent')
                .setValue(Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0);
        });
        orbsInput.addEventListener('change', () => { orbsInput.value = String(this.#orbsPercent()); });
        orbsField.append(orbsInput, '% first');
        orbsCell.appendChild(orbsField);
        cells.appendChild(orbsCell);
        this.#controls.push(orbsInput);

        const partialLabel = document.createElement('label');
        partialLabel.className = 'hs-hept-distributor-option';
        partialLabel.title = 'Off: only whole steps, so every meter ends full, and what can\'t pay a whole step stays unspent.\n'
            + 'On: what is left goes into the hepteract furthest behind anyway. It only expands when at least what the '
            + 'expansion consumes can be crafted back, so a balance never goes down.';
        const partial = document.createElement('input');
        partial.type = 'checkbox';
        partial.checked = HSSettings.getSetting('hepteractDistributorAllowPartial').getValue() === true;
        partial.addEventListener('change', () => {
            HSSettings.getSetting('hepteractDistributorAllowPartial').setValue(partial.checked);
        });
        partialLabel.append(partial, 'Allow partly filled meters');
        panel.appendChild(partialLabel);
        this.#controls.push(partial);

        const actions = document.createElement('div');
        actions.className = 'hs-hept-distributor-actions';
        const button = (text: string, hint: string, onClick: () => void): HTMLButtonElement => {
            const element = document.createElement('button');
            element.type = 'button';
            element.textContent = text;
            element.title = hint;
            element.addEventListener('click', onClick);
            actions.appendChild(element);
            this.#controls.push(element);
            return element;
        };
        this.#distributeButton = button('Distribute',
            'Spend your hepteracts following the ratios.\n'
            + 'The game only crafts without the other resources at an ascension: the Distributor ascends once to collect '
            + 'your ascension\'s reward, then once per hepteract it crafts, with only that one\'s Auto on.\n'
            + 'Your Auto switches, the autocraft percentage and the ascension confirmation are put back as they were.',
            () => void this.#distribute());
        this.#matchButton = button('Match current', 'Set the ratios from the current capacities, without spending anything.', () => this.#matchCurrent());
        button('Reset', 'Set every ratio to 0.', () => this.#resetRatios());
        panel.appendChild(actions);

        const warning = document.createElement('div');
        warning.className = 'hs-hept-distributor-warning';
        warning.textContent = ASCENSION_WARNING;
        panel.appendChild(warning);

        this.#status = document.createElement('div');
        this.#status.className = 'hs-hept-distributor-status';
        panel.appendChild(this.#status);

        return panel;
    }

    static #iconSlot(): HTMLElement {
        const slot = document.createElement('span');
        slot.className = 'hs-hept-distributor-icon';
        return slot;
    }

    /**
     * The game's icons are sprites set as inline styles on its own images, and change with the theme:
     * copied again each time the panel opens.
     */
    #refreshIcons(): void {
        const copy = (slot: HTMLElement | null | undefined, imageId: string, label: string) => {
            const image = document.getElementById(imageId);
            if (!slot || !image) return;
            const icon = image.cloneNode(false) as HTMLElement;
            icon.removeAttribute('id');
            icon.removeAttribute('class');
            icon.title = label;
            slot.replaceChildren(icon);
        };
        for (const info of HEPTERACTS) {
            copy(this.#cells.get(info.key)?.querySelector<HTMLElement>('.hs-hept-distributor-icon'), `${info.key}HepteractImage`, info.label);
        }
        copy(this.#orbsIcon, 'hepteractToQuarkImage', 'Overflux Orbs');
    }

    #refreshLocked(): void {
        for (const info of HEPTERACTS) {
            this.#cells.get(info.key)?.classList.toggle(LOCKED_CLASS, HSHepteractDistributor.#isLocked(info.key));
        }
    }

    #setOpened(opened: boolean, save = true): void {
        this.#tab?.classList.toggle(OPENED_CLASS, opened);
        if (opened) {
            this.#refreshIcons();
            this.#refreshLocked();
            this.#refreshAvailability();
        }
        if (save) HSSettings.getSetting('hepteractDistributorOpen').setValue(opened);
    }

    #setStatus(text: string): void {
        this.#shownReason = undefined;
        if (this.#status) this.#status.textContent = text;
    }

    /**
     * Why the Distributor can't run right now, if it can't.
     * Exalt 3 limits the ascensions and Exalt 7 is timed: nothing is done for the player there (the user's choice).
     */
    #unavailableReason(): string | undefined {
        const player = HSGlobal.exposedPlayer;
        if (!player) {
            return 'Not available with the bookmark: the Distributor needs the game loaded through the mod loader (Tampermonkey script or Steam loader).';
        }
        // The game's Auto craft only runs from the first singularity (Reset.ts)
        if (!(player.highestSingularityCount >= 1) || player.unlocks?.ascensions !== true) {
            return 'Not available before your first singularity: the game\'s Auto craft, which the Distributor uses, unlocks there.';
        }
        if (player.singularityChallenges?.limitedAscensions?.enabled) return 'Not available inside Exalt 3.';
        if (player.singularityChallenges?.limitedTime?.enabled) return 'Not available inside Exalt 7.';
        if (HSModuleManager.getModule<HSAutosing>('HSAutosing')?.isAutosingActive()) return 'Not available while autosing is running.';
        return undefined;
    }

    /** Disables Distribute while it can't run, and says why in the status line (without replacing a summary by nothing). */
    #refreshAvailability(): void {
        if (this.#running) return;
        const reason = this.#unavailableReason();
        if (this.#distributeButton) this.#distributeButton.disabled = reason !== undefined;
        if (this.#matchButton) this.#matchButton.disabled = !HSGlobal.exposedPlayer;

        if (reason !== undefined) {
            this.#setStatus(reason);
            this.#shownReason = reason;
        } else if (this.#shownReason !== undefined) {
            this.#setStatus('');
        }
    }

    #setControlsDisabled(disabled: boolean): void {
        for (const control of this.#controls) control.disabled = disabled;
    }

    // ── Ratios ───────────────────────────────────────────────────────────────────────────────────────

    #loadRatios(): Partial<Record<HepteractKey, number>> {
        const ratios: Partial<Record<HepteractKey, number>> = {};
        const saved = HSSettings.getSetting('hepteractDistributorRatios').getValue();
        if (typeof saved !== 'string' || !saved) return ratios;
        try {
            const parsed = JSON.parse(saved) as Record<string, unknown> | null;
            for (const info of HEPTERACTS) {
                const value = parsed?.[info.key];
                if (typeof value === 'number' && Number.isFinite(value) && value > 0) ratios[info.key] = value;
            }
        } catch { /* Malformed saved ratios: none set */ }
        return ratios;
    }

    #saveRatios(): void {
        HSSettings.getSetting('hepteractDistributorRatios').setValue(JSON.stringify(this.#ratios));
    }

    #showRatios(): void {
        for (const [key, input] of this.#ratioInputs) {
            input.value = HSHepteractDistributor.#shownRatio(this.#ratios[key] ?? 0);
        }
    }

    /** The fields show 6 digits at most; #ratios keeps the exact values, and Distribute reads those. */
    static #shownRatio(ratio: number): string {
        if (!(ratio > 0)) return '0';
        const rounded = Number(ratio.toPrecision(6));
        return rounded >= 1e9 || rounded < 1e-4 ? rounded.toExponential().replace('+', '') : String(rounded);
    }

    #orbsPercent(): number {
        const value = HSSettings.getSetting('hepteractDistributorOrbsPercent').getValue();
        return typeof value === 'number' && Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
    }

    #resetRatios(): void {
        this.#ratios = {};
        this.#saveRatios();
        this.#showRatios();
        this.#setStatus('Ratios reset.');
    }

    /** Ratios from the current capacities (the smallest one counts for 1). Locked hepteracts keep theirs. */
    #matchCurrent(): void {
        this.#refreshLocked();
        const capacities = new Map<HepteractKey, number>();
        for (const info of HEPTERACTS) {
            if (HSHepteractDistributor.#isLocked(info.key)) continue;
            const live = HSHepteractDistributor.#readLive(info);
            if (live) capacities.set(info.key, live.finalCapacity);
        }
        if (capacities.size === 0) {
            this.#setStatus('Could not read the hepteracts.');
            return;
        }
        const smallest = Math.min(...capacities.values());
        for (const [key, capacity] of capacities) this.#ratios[key] = capacity / smallest;
        this.#saveRatios();
        this.#showRatios();
        this.#setStatus('Ratios set from the current capacities.');
    }

    // ── Game state ───────────────────────────────────────────────────────────────────────────────────

    /** The game writes "LOCKED" in a locked hepteract's meter, and "balance / capacity" otherwise (forge shown). */
    static #isLocked(key: HepteractKey): boolean {
        return !(document.getElementById(`${key}ProgressBarText`)?.textContent ?? '').includes('/');
    }

    static #readLive(info: HepteractInfo): HepteractState | null {
        return readHepteract(HSGlobal.exposedPlayer, info.key);
    }

    static #ownedHepteracts(): number {
        const owned = HSGlobal.exposedPlayer?.wowAbyssals;
        return typeof owned === 'number' && Number.isFinite(owned) ? owned : NaN;
    }

    /** The planner's input: the unlocked hepteracts with a ratio, from the live player. */
    #readState(costMultiplier: number): HepteractPlanState {
        const hepteracts = HSHepteractDistributor.#ownedHepteracts();
        if (Number.isNaN(hepteracts)) throw new Error('Could not read the hepteracts.');

        const types: HepteractPlanType[] = [];
        for (const info of HEPTERACTS) {
            const ratio = this.#ratios[info.key] ?? 0;
            if (!(ratio > 0) || HSHepteractDistributor.#isLocked(info.key)) continue;
            const live = HSHepteractDistributor.#readLive(info);
            if (!live) throw new Error('Could not read the hepteracts.');
            types.push({ key: info.key, ratio, ...live, unitCost: HEPTERACT_DATA[info.key].conversion * costMultiplier });
        }
        return { hepteracts, types };
    }

    /**
     * The singularity debuff on hepteract costs, from a fresh save read, then checked against the cost the game
     * itself shows for a Chronos unit (3 digits): a game update changing the formula must not spend anything.
     */
    async #readCostMultiplier(): Promise<number> {
        const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        const gameData = await gameDataAPI?.getForcedGameData();
        if (!gameDataAPI || !gameData) throw new Error('Could not read your current save.');

        const multiplier = gameDataAPI.calculateSingularityDebuff('Hepteract Costs');
        if (typeof multiplier !== 'number' || !Number.isFinite(multiplier) || multiplier <= 0) {
            throw new Error('Could not compute the hepteract cost.');
        }

        // The game fills the forge's description for the hepteract under the mouse. The sentence is translated:
        // its first number is the hepteract cost in every language ({{x}} of "oneCost")
        document.getElementById('chronosHepteract')?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
        const shown = HSNumberParser.parse(document.getElementById('hepteractCostText')?.textContent);
        const computed = HEPTERACT_DATA.chronos.conversion * multiplier;
        if (Number.isNaN(shown) || Math.abs(shown - computed) > computed * 0.011 + 1) {
            throw new Error(`Cost check failed (a Chronos unit: the game shows ${Number.isNaN(shown) ? 'nothing' : HSUtils.N(shown, 0)}, `
                + `the mod computes ${HSUtils.N(computed, 0)}). Nothing was spent.`);
        }
        return multiplier;
    }

    // ── Distribution ─────────────────────────────────────────────────────────────────────────────────

    async #distribute(): Promise<void> {
        if (this.#running) return;
        const reason = this.#unavailableReason();
        if (reason !== undefined) {
            this.#refreshAvailability();
            return;
        }
        if (!HEPTERACTS.some(info => (this.#ratios[info.key] ?? 0) > 0) && this.#orbsPercent() <= 0) {
            this.#setStatus('No ratio set.');
            return;
        }

        this.#running = true;
        this.#setControlsDisabled(true);
        this.#setStatus('Distributing…');
        try {
            const costMultiplier = await this.#readCostMultiplier();
            // The save read takes a moment: autosing may have started, or an Exalt been entered, meanwhile
            const lateReason = this.#unavailableReason();
            if (lateReason !== undefined) throw new Error(lateReason);
            this.#setStatus(await this.#run(costMultiplier));
        } catch (error) {
            HSLogger.warn(`Hepteract distribution stopped: ${error}`, this.context);
            this.#setStatus(`Stopped: ${error instanceof Error ? error.message : error}`);
        } finally {
            this.#running = false;
            this.#setControlsDisabled(false);
            this.#refreshLocked();
            if (this.#matchButton) this.#matchButton.disabled = !HSGlobal.exposedPlayer;
        }
    }

    /**
     * The crafting, through ascensions. Every ascension resets at once when the game's ascension confirmation is
     * off, with no dialog: the whole run is one go, before the game ticks, paints or saves, so the player's
     * switches and percentage are never seen changed.
     * @returns the summary for the status line.
     */
    async #run(costMultiplier: number): Promise<string> {
        const startedAt = performance.now();
        const allowPartial = HSSettings.getSetting('hepteractDistributorAllowPartial').getValue() === true;
        const orbsPercent = this.#orbsPercent();
        const orbsToBuy = (owned: number) => Math.floor(Math.floor(owned * orbsPercent / 100) / ORB_COST);

        // Nothing to craft with what is owned: the player's ascension is left alone (its reward isn't known)
        const firstPlan = planHepteractDistribution(this.#readState(costMultiplier), allowPartial);
        const player = HSGlobal.exposedPlayer;
        if (!player) throw new Error('Could not read the game.');
        if (firstPlan.targets.length === 0 && !(orbsToBuy(HSHepteractDistributor.#ownedHepteracts()) >= 1)) {
            const notes = player.challengecompletions?.[10] > 0
                ? ['The reward of your current ascension is not counted: ascend, then press Distribute again.']
                : [];
            return this.#summary({ plan: firstPlan, orbsPercent, ascensions: 0, notes });
        }

        const original = new Map<GameSwitch, boolean>();
        const turn = (gameSwitch: GameSwitch, on: boolean): boolean => {
            if (!original.has(gameSwitch)) original.set(gameSwitch, gameSwitch.isOn(player));
            return HSHepteractDistributor.#setSwitch(gameSwitch, on);
        };
        const originalPercentage = player.hepteractAutoCraftPercentage;
        const balances = new Map<HepteractKey, { before: number, after: number }>();
        const notes: string[] = [];
        let orbsBought: number | undefined;
        let ascensions = 0;
        let plan = firstPlan;

        try {
            for (const gameSwitch of [...HEPTERACT_AUTOS, ORBS_AUTO, ASCENSION_CONFIRMATION]) {
                if (!turn(gameSwitch, false)) throw new Error('Could not switch the game\'s Auto and confirmation off. Nothing was spent.');
            }

            // The current ascension's reward, with the player's automations as they are. No Auto is on: no craft.
            // Without a Challenge 10 completion the game gives no reward, as for every ascension that follows
            if (player.challengecompletions?.[10] > 0) {
                await this.#ascend(() => !(player.challengecompletions?.[10] > 0), 'The game did not ascend. Nothing was spent.');
                ascensions++;
            }

            // Not fatal: below singularity 10 the game ignores these clicks, and doesn't auto-open either
            for (const gameSwitch of ASCENSION_AUTOMATIONS) turn(gameSwitch, false);

            if (orbsPercent > 0) {
                orbsBought = 0;
                if (orbsToBuy(HSHepteractDistributor.#ownedHepteracts()) >= 1) {
                    const orbsBefore = Number(player.overfluxOrbs);
                    // Orbs Auto alone: the game spends this percentage of the stock on Orbs
                    player.hepteractAutoCraftPercentage = orbsPercent;
                    if (!turn(ORBS_AUTO, true)) throw new Error('Could not switch Orbs Auto on.');
                    await this.#ascend(() => Number(player.overfluxOrbs) > orbsBefore, 'The game did not buy the Orbs.');
                    ascensions++;
                    turn(ORBS_AUTO, false);
                    orbsBought = Number(player.overfluxOrbs) - orbsBefore;
                }
            }

            // The stock is now exact: the reward is in, and the next ascensions give none
            plan = planHepteractDistribution(this.#readState(costMultiplier), allowPartial);
            for (const target of plan.targets) {
                const info = HEPTERACTS.find(hepteract => hepteract.key === target.key)!;
                const auto = HEPTERACT_AUTOS[HEPTERACTS.indexOf(info)];
                const before = HSHepteractDistributor.#readLive(info)!.balance;
                const owned = HSHepteractDistributor.#ownedHepteracts();

                // With one Auto on, the game gives it owned x percentage / 100. Its prompt only takes whole
                // percentages, its formula any number: the exact share is written, and put back at the end
                const amount = target.partial ? owned : Math.min(owned, (target.units * AMOUNT_MARGIN + 0.5) * HEPTERACT_DATA[info.key].conversion * costMultiplier);
                player.hepteractAutoCraftPercentage = owned > 0 ? Math.min(100, amount / owned * 100) : 0;
                if (!turn(auto, true)) throw new Error(`Could not switch ${info.label}'s Auto on.`);
                await this.#ascend(() => HSHepteractDistributor.#readLive(info)?.balance !== before, `The game did not craft ${info.label}.`);
                ascensions++;
                turn(auto, false);

                const after = HSHepteractDistributor.#readLive(info)!.balance;
                balances.set(info.key, { before, after });
                if (!target.partial && after !== target.balance) {
                    notes.push(`${info.label} ended at ${HSUtils.N(after, 0)}, not the planned ${HSUtils.N(target.balance, 0)}.`);
                }
            }
        } finally {
            player.hepteractAutoCraftPercentage = originalPercentage;
            for (const [gameSwitch, on] of original) {
                if (!HSHepteractDistributor.#setSwitch(gameSwitch, on)) notes.push(`Could not put the game's switch #${gameSwitch.id} back.`);
            }
        }

        // What the last type could not afford, on what is left now
        const left = planHepteractDistribution(this.#readState(costMultiplier), allowPartial);
        HSLogger.debug(() => `Hepteract distribution: ${plan.steps} steps over ${ascensions} ascensions in `
            + `${Math.round(performance.now() - startedAt)} ms, cost multiplier ${costMultiplier}`, this.context);
        return this.#summary({ plan: left, balances, orbsPercent, orbsBought, ascensions, notes });
    }

    #summary(run: {
        plan: HepteractPlan,
        balances?: Map<HepteractKey, { before: number, after: number }>,
        orbsPercent: number,
        orbsBought?: number,
        ascensions: number,
        notes?: string[],
    }): string {
        const label = (key: string) => HEPTERACTS.find(hepteract => hepteract.key === key)?.label ?? key;
        const crafted = [...run.balances ?? []].map(([key, balance]) => `${label(key)} ${HSUtils.N(balance.before, 0)} → ${HSUtils.N(balance.after, 0)}`);
        const count = run.ascensions === 0 ? '' : ` in ${run.ascensions} ascension${run.ascensions === 1 ? '' : 's'}`;
        const lines = [crafted.length > 0 ? `Done${count}. ${crafted.join(' · ')}` : `Done${count}. No hepteract crafted.`];

        if (run.orbsBought !== undefined && run.orbsBought > 0) {
            lines.push(`Orbs: ${HSUtils.N(run.orbsBought, 0)} bought.`);
        } else if (run.orbsPercent > 0) {
            lines.push(`Orbs: ${run.orbsPercent}% of your hepteracts can't pay one (${ORB_COST.toLocaleString()} each).`);
        }
        if (run.plan.waitingFor) {
            const owned = HSHepteractDistributor.#ownedHepteracts();
            lines.push(`Next: ${label(run.plan.waitingFor.key)}, which needs ${HSUtils.N(run.plan.waitingFor.hepteractsNeeded, 0)} hepteracts (you have ${HSUtils.N(owned, 0)}).`);
        }
        const locked = HEPTERACTS.filter(info => (this.#ratios[info.key] ?? 0) > 0 && HSHepteractDistributor.#isLocked(info.key));
        if (locked.length > 0) lines.push(`Locked: ${locked.map(info => info.label).join(' · ')}`);
        lines.push(...run.notes ?? []);
        return lines.join('\n');
    }

    /** Puts one of the game's switches in a state, by clicking it when it isn't. @returns whether it is now. */
    static #setSwitch(gameSwitch: GameSwitch, on: boolean): boolean {
        const player = HSGlobal.exposedPlayer;
        if (gameSwitch.isOn(player) !== on) document.getElementById(gameSwitch.id)?.click();
        return gameSwitch.isOn(player) === on;
    }

    /**
     * Clicks the game's Ascend button, then waits until the live player shows the result (at once, normally).
     * The click also opens the button's hover modal: it is closed through the game's own mouseout handler,
     * as autosing does.
     */
    async #ascend(done: () => boolean, failure: string): Promise<void> {
        const button = document.getElementById('ascendbtn');
        if (!button) throw new Error('The game\'s Ascend button was not found.');
        try {
            button.click();
        } finally {
            if (!button.matches(':hover, :focus')) button.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }));
        }
        if (!done() && !await HSHepteractDistributor.#settle(done)) throw new Error(failure);
    }

    /** Waits until `done`: a few microtasks first, then tasks. */
    static async #settle(done: () => boolean): Promise<boolean> {
        for (let i = 0; i < 30; i++) {
            if (done()) return true;
            await Promise.resolve();
        }
        const deadline = performance.now() + SETTLE_TIME_LIMIT_MS;
        while (performance.now() < deadline) {
            await HSUtils.sleep(0);
            if (done()) return true;
        }
        return false;
    }
}
