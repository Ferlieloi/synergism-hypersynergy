import { SINGULARITY_VIEW } from "../../../types/module-types/hs-gamestate-types";
import type { PurpleAdvisorResult, PurpleUpgradeAdvice } from "../../hs-core/gds/hs-purple-upgrade-advisor";
import { HSLogger } from "../../hs-core/hs-logger";
import { HSUI } from "../../hs-core/hs-ui";
import { HSModule, type HSModuleOptions } from "../../hs-core/module/hs-module";
import { HSModuleRegistry } from "../../hs-core/module/hs-module-registry";
import { HSUtils } from "../../hs-utils/hs-utils";
import purpleAdvisorCSS from "inline:../../../resource/css/module/hs-purple-advisor.css";

const STYLE_ID = 'hs-purple-advisor-css';
const PANEL_ID = 'hs-purple-advisor';
const SHOWN_ROWS = 5;
// With GDS running, its data comes every 500ms: the ranking only changes when the player buys or changes the loadout
const DATA_REFRESH_MS = 2_000;
// Without GDS each refresh forces a save; slower while autosing runs (its speed comes first)
const FORCED_REFRESH_MS = 5_000;
const FORCED_REFRESH_AUTOSING_MS = 10_000;

// English names, until the game's translations are read (SynergismOfficial translations/en.json)
const FALLBACK_NAMES: Record<string, string> = {
    tutorial: "The Purple Guy's Greeting",
    purpleEfficiency1: 'Chroma-Encabulator Efficiency I', purpleEfficiency2: 'Chroma-Encabulator Efficiency II',
    purpleEfficiency3: 'Chroma-Encabulator Efficiency III', purpleEfficiency4: 'Chroma-Encabulator Efficiency IV',
    purpleHoneyLuck1: 'Purple Honey Luck I', purpleHoneyLuck2: 'Purple Honey Luck II',
    purpleHoneyLuck3: 'Purple Honey Luck III', purpleHoneyLuck4: 'Purple Honey Luck IV',
    purpleHalfLife1: 'All-Natural, Organic Catalyzer I', purpleHalfLife2: 'All-Natural, Organic Catalyzer II',
    purpleHalfLife3: 'All-Natural, Organic Catalyzer III', purpleHalfLife4: 'All-Natural, Organic Catalyzer IV',
    purpleCapacityExpander1: 'Reactant Storage Expansion I', purpleCapacityExpander2: 'Reactant Storage Expansion II',
    purpleCapacityExpander3: 'Reactant Storage Expansion III', purpleCapacityExpander4: 'Reactant Storage Expansion IV',
    purpleHoneyRequirementReduction1: 'Purple Bar Size Reduction I',
    purpleHoneyRequirementReduction2: 'Purple Bar Size Reduction II',
    purpleHoneyRequirementReduction3: 'Purple Bar Size Reduction III',
    purpleHoneyRequirementReduction4: 'Purple Bar Size Reduction IV',
    lifetimeHoneyAmbrosia: 'Honey Power: Ambrosia', lifetimeHoneyRedAmbrosia: 'Honey Power: Red Ambrosia',
    aries: 'Aries', gemini: 'Gemini', cancer: 'Cancer', scorpio: 'Scorpio',
};

/**
 * Class: HSPurpleAdvisor
 * IsExplicitHSModule: Yes
 * Description:
 *     A panel at the top of the Singularity tab's Purple subtab: the next levels of the Purple Reactor and Purple
 *     Ambrosia upgrades that raise Purple Honey income, best Purple Honey return per Purple Honey spent first
 *     (rankPurpleUpgrades, after fancia's Purple Heater sheet), with their effect on Ambrosia and Red Ambrosia income.
 *     Rules: docs/features/purple-advisor.md.
 * Author: Shewchou
 */
export class HSPurpleAdvisor extends HSModule {
    #shown = false;
    #tabActive = false;
    #panel?: HTMLDivElement;
    #rows: HTMLTableRowElement[] = [];
    #signature?: string;
    #subscriptionId?: string;
    #timer?: ReturnType<typeof setTimeout>;
    #lastRefresh = 0;
    #names = new Map<string, string>();
    #namesRequested = false;
    readonly #percent = new Intl.NumberFormat(undefined, { maximumSignificantDigits: 3, signDisplay: 'exceptZero' });
    readonly #integer = new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 });

    constructor(moduleOptions: HSModuleOptions) {
        super(moduleOptions);
    }

    async init(): Promise<void> {
        HSLogger.log('Initialising HSPurpleAdvisor module', this.context);

        // Called at once with the subtab's current state
        HSModuleRegistry.getModule('HSGameState')?.subscribeSubtab('SINGULARITY_VIEW', SINGULARITY_VIEW.PURPLE, (isActive) => {
            this.#tabActive = isActive;
            if (!this.#shown) return;
            if (isActive) this.#start();
            else this.#stop();
        });

        // Shown from the Debug tab's checkbox (dev builds), until its release as a setting
        this.isInitialized = true;
    }

    show(): void {
        if (this.#shown) return;
        this.#shown = true;
        HSUI.injectStyle(purpleAdvisorCSS, STYLE_ID);
        HSUI.flushInjectedStyles();
        if (this.#tabActive) this.#start();
    }

    hide(): void {
        this.#shown = false;
        this.#stop();
        this.#panel?.remove();
        this.#panel = undefined;
        this.#rows = [];
        this.#signature = undefined;
        HSUI.removeInjectedStyle(STYLE_ID);
    }

    // ------------------------------------------------------------------
    // Refresh: from GDS's data while the subtab is open, else by forcing a save
    // ------------------------------------------------------------------

    #start(): void {
        if (!this.#ensurePanel()) return;
        this.#requestNames();

        const gameData = HSModuleRegistry.getModule('HSGameData');
        if (gameData && !this.#subscriptionId) {
            this.#subscriptionId = gameData.subscribeGameDataChange(() => this.#onGameData());
        }
        void this.#refresh(!this.#isGDSRunning());
    }

    #stop(): void {
        if (this.#subscriptionId) {
            HSModuleRegistry.getModule('HSGameData')?.unsubscribeGameDataChange(this.#subscriptionId);
            this.#subscriptionId = undefined;
        }
        this.#clearTimer();
    }

    #isGDSRunning(): boolean {
        return HSModuleRegistry.getModule('HSGameData')?.isGDSRunning() ?? false;
    }

    #onGameData(): void {
        if (!this.#shown || !this.#tabActive) return;
        if (performance.now() - this.#lastRefresh < DATA_REFRESH_MS) return;
        void this.#refresh(false);
    }

    async #refresh(force: boolean): Promise<void> {
        this.#lastRefresh = performance.now();
        this.#clearTimer();
        try {
            const api = HSModuleRegistry.getModule('HSGameDataAPI');
            const data = api && (force ? await api.getForcedGameData() : api.getGameData());
            if (!this.#shown || !this.#tabActive) return;
            this.#render(api && data ? api.calculatePurpleUpgradeAdvice() : null);
        } catch (error) {
            HSLogger.warnOnce(`Could not rank the Purple upgrades: ${error}`, this.context, 'hs-purple-advisor');
            this.#renderMessage('Could not rank the upgrades (see the Log)');
        } finally {
            this.#scheduleForcedRefresh();
        }
    }

    /** Without GDS, nothing else refreshes the panel. */
    #scheduleForcedRefresh(): void {
        if (!this.#shown || !this.#tabActive || this.#isGDSRunning()) return;
        const autosingActive = HSModuleRegistry.getModule('HSAutosing')?.isAutosingActive() ?? false;
        this.#timer = setTimeout(() => {
            this.#timer = undefined;
            void this.#refresh(!this.#isGDSRunning());
        }, autosingActive ? FORCED_REFRESH_AUTOSING_MS : FORCED_REFRESH_MS);
    }

    #clearTimer(): void {
        if (this.#timer === undefined) return;
        clearTimeout(this.#timer);
        this.#timer = undefined;
    }

    // ------------------------------------------------------------------
    // Panel
    // ------------------------------------------------------------------

    /** The panel above the reactor, with its rows reserved so its height never changes. */
    #ensurePanel(): boolean {
        if (this.#panel?.isConnected) return true;

        const anchor = document.getElementById('purpleHoneyDisplay');
        if (!anchor) {
            HSLogger.warnOnce('No #purpleHoneyDisplay: the Purple upgrade advisor is not shown', this.context, 'hs-purple-advisor-anchor');
            return false;
        }

        const panel = document.createElement('div');
        panel.id = PANEL_ID;
        panel.title = 'Next levels of the Purple Reactor and Purple Ambrosia upgrades, best Purple Honey gained per '
            + 'Purple Honey spent first (Purple Ambrosia counted at its synthesis cost), for the active loadout and '
            + "routing. From fancia's Purple Heater.";

        const title = document.createElement('p');
        title.className = 'hs-purple-advisor-title';
        title.append('Best Purple buys ');
        const tag = document.createElement('span');
        tag.className = 'hs-purple-advisor-dim';
        tag.textContent = '[HS]';
        title.append(tag);

        const table = document.createElement('table');
        const head = table.createTHead().insertRow();
        for (const label of ['Upgrade', 'Cost', 'phoney/h', 'amb/h', 'ramb/h']) {
            const cell = document.createElement('th');
            cell.textContent = label;
            head.appendChild(cell);
        }
        const body = table.createTBody();
        this.#rows = Array.from({ length: SHOWN_ROWS }, () => {
            const row = body.insertRow();
            for (let index = 0; index < 5; index++) row.insertCell();
            return row;
        });

        panel.append(title, table);
        anchor.after(panel);
        this.#panel = panel;
        this.#signature = undefined;
        return true;
    }

    #render(result: PurpleAdvisorResult | null): void {
        if (!this.#ensurePanel()) return;
        if (!result) {
            this.#renderMessage('Waiting for save data');
            return;
        }
        if (!(result.base.purpleHoneyPerSecond > 0)) {
            this.#renderMessage(HSModuleRegistry.getModule('HSGameDataAPI')?.getGameData()?.singularityChallenges.barDependence.enabled
                ? 'No Purple Honey in this challenge'
                : 'No Purple Honey income with this loadout and routing');
            return;
        }
        if (result.advice.length === 0) {
            this.#renderMessage('Nothing left that raises Purple Honey income');
            return;
        }

        const shown = result.advice.slice(0, SHOWN_ROWS);
        const signature = shown.map((advice) => [advice.key, advice.nextLevel, advice.honeyCost,
            this.#formatPercent(advice.honeyRatio), this.#formatPercent(advice.ambrosiaRatio),
            this.#formatPercent(advice.redAmbrosiaRatio), this.#name(advice.key)].join('|')).join('/');
        if (signature === this.#signature) return;
        this.#signature = signature;

        const honeyPerHour = result.base.purpleHoneyPerSecond * 3_600;
        this.#rows.forEach((row, index) => {
            const advice = shown[index];
            if (advice) this.#renderAdvice(row, advice, honeyPerHour);
            else this.#clearRow(row);
        });
    }

    #renderAdvice(row: HTMLTableRowElement, advice: PurpleUpgradeAdvice, honeyPerHour: number): void {
        const [nameCell, costCell, honeyCell, blueCell, redCell] = Array.from(row.cells);
        row.classList.remove('hs-purple-advisor-message');
        nameCell.colSpan = 1;
        for (const cell of [costCell, honeyCell, blueCell, redCell]) cell.hidden = false;

        nameCell.replaceChildren(this.#name(advice.key), this.#dim(` → ${advice.nextLevel}`));

        costCell.replaceChildren(this.#formatAmount(advice.honeyCost));
        if (advice.kind === 'zodiac') {
            costCell.append(this.#dim(` + ${this.#formatAmount(advice.redAmbrosiaCost)} ramb`));
            costCell.title = `${this.#formatAmount(advice.purpleAmbrosiaCost)} Purple Ambrosia, crafted from `
                + `${this.#formatAmount(advice.honeyCost)} Purple Honey and ${this.#formatAmount(advice.redAmbrosiaCost)} Red Ambrosia`;
        } else {
            costCell.title = `${this.#formatAmount(advice.honeyCost)} Purple Honey`;
        }

        honeyCell.textContent = this.#formatPercent(advice.honeyRatio);
        honeyCell.title = `${this.#formatSigned(honeyPerHour * (advice.honeyRatio - 1))} Purple Honey per hour`;
        blueCell.textContent = this.#formatPercent(advice.ambrosiaRatio);
        redCell.textContent = this.#formatPercent(advice.redAmbrosiaRatio);
    }

    /** A message in the first row; the other rows stay, empty, so the panel keeps its height. */
    #renderMessage(text: string): void {
        if (!this.#ensurePanel()) return;
        if (this.#signature === `message:${text}`) return;
        this.#signature = `message:${text}`;

        this.#rows.forEach((row, index) => {
            this.#clearRow(row);
            if (index !== 0) return;
            const cells = Array.from(row.cells);
            row.classList.add('hs-purple-advisor-message');
            cells[0].colSpan = cells.length;
            cells.slice(1).forEach((cell) => { cell.hidden = true; });
            cells[0].textContent = text;
        });
    }

    #clearRow(row: HTMLTableRowElement): void {
        row.classList.remove('hs-purple-advisor-message');
        for (const cell of Array.from(row.cells)) {
            cell.replaceChildren();
            cell.removeAttribute('title');
            cell.colSpan = 1;
            cell.hidden = false;
        }
        // Keeps the row's height
        row.cells[0].textContent = ' ';
    }

    #dim(text: string): HTMLSpanElement {
        const span = document.createElement('span');
        span.className = 'hs-purple-advisor-dim';
        span.textContent = text;
        return span;
    }

    #formatPercent(ratio: number): string {
        if (!Number.isFinite(ratio)) return '—';
        const percent = (ratio - 1) * 100;
        if (Math.abs(percent) < 1e-4) return '0%';
        return `${this.#percent.format(percent)}%`;
    }

    #formatSigned(value: number): string {
        return `${value < 0 ? '−' : '+'}${this.#formatAmount(Math.abs(value), 1)}`;
    }

    /** Whole numbers in the browser's format below a million (decimals below 100 when asked), else 1.23e6 */
    #formatAmount(value: number, decimalsBelow100 = 0): string {
        if (value >= 1e6) return HSUtils.N(value);
        if (value < 100 && decimalsBelow100 > 0) {
            return value.toLocaleString(undefined, { maximumFractionDigits: decimalsBelow100 });
        }
        return this.#integer.format(value);
    }

    // ------------------------------------------------------------------
    // Names in the player's language
    // ------------------------------------------------------------------

    #name(key: string): string {
        return this.#names.get(key) ?? FALLBACK_NAMES[key] ?? key;
    }

    /** Once: the game's names, then the panel is drawn again with them. */
    #requestNames(): void {
        if (this.#namesRequested) return;
        this.#namesRequested = true;

        const zodiac = new Set(['aries', 'gemini', 'cancer', 'scorpio']);
        void Promise.all(Object.keys(FALLBACK_NAMES).map(async (key) => {
            const name = await HSUtils.getGameTranslation(zodiac.has(key)
                ? `purpleAmbrosia.data.${key}.name`
                : `purpleReactor.upgrades.${key}.name`);
            if (name) this.#names.set(key, name);
        })).then(() => {
            this.#signature = undefined;
            if (this.#shown && this.#tabActive) void this.#refresh(false);
        });
    }
}
