import Decimal from "break_infinity.js";
import { HSModuleManager } from "../../hs-core/module/hs-module-manager";
import { HSUI } from "../../hs-core/hs-ui";
import { HSUIC } from "../../hs-core/hs-ui-components";
import { HSGameDataAPI } from "../../hs-core/gds/hs-gamedata-api";
import { HSHeaterAPI } from "./hs-heater-api";
import type { HeaterOptimizerInput, HeaterOptimizationResult } from "../../../types/data-types/hs-heater-types";
import { HSInputType } from "../../../types/module-types/hs-ui-types";
import { HSUtils } from "../../hs-utils/hs-utils";

export class HSHeaterUI {
    private static readonly inputDefinitions = [
        { key: "amb",                       label: "Lifetime Ambrosia",         type: "number",  url: "Pictures/Achievements/Progressive/AmbrosiaCount.png" },
        { key: "ramb",                      label: "Lifetime Red Ambrosia",     type: "number",  url: "Pictures/Achievements/Progressive/RedAmbrosiaCount.png" },
        { key: "ambSpeedNonAmbBerries",     label: "Base Amb Speed/s",          type: "number",  url: "Pictures/PseudoShop/AMBROSIATimeSkip.png" },
        { key: "blueberries",               label: "Blueberries Owned",         type: "number",  url: "Pictures/Default/Blueberries.png" },
        { key: "luckBaseNonAmb",            label: "Base Luck",                 type: "number",  url: "Pictures/Achievements/Rewards/AmbrosiaLuck.png" },
        { key: "luckMultNonAmb",            label: "Base Luck Mult",            type: "percent", url: "Pictures/PseudoShop/AMBROSIA_LUCK_BUFF.png" },
        { key: "redLuckBase",               label: "Base Red Luck",             type: "number",  url: "Pictures/Achievements/Rewards/RedAmbrosiaLuck.png" },
        { key: "luckConversion",            label: "Luck Conversion",           type: "number",  url: "Pictures/RedAmbrosia/RedAmbrosiaConversionImprovement1.png" },
        { key: "quarksOwned",               label: "Quarks Owned",              type: "number",  url: "Pictures/Default/Quark.png" },
        { key: "qHept",                     label: "Quark Hepteract",           type: "number",  url: "Pictures/Default/HepteractQuark.png" },
        { key: "cubesExpTotal",             label: "Total Cubes Exp.",          type: "number",  url: "Pictures/Default/WowCube.png" },
        { key: "currentSingularity",        label: "Current Singularity",       type: "number",  url: "Pictures/Default/Singularity.png" },
        { key: "singularityReducers",       label: "Singularity Reducers",      type: "number",  url: "Pictures/Default/BlueberrySingReduction.png" },
        { key: "exalt",                     label: "Exalt?",                    type: "number",  url: "Pictures/Default/TinySChalTime.png" },
        { key: "postAoag",                  label: "Post-AoAG (Obt/Off)",       type: "boolean", url: "Pictures/Runes/Antiquities.png" },
        { key: "transcription",             label: "Transcription",             type: "number",  url: "Pictures/Default/OcteractOneMindImprover.png" },
        { key: "ascSpeed",                  label: "Asc. Speed",                type: "number",  url: "Pictures/Default/TinySpeedAscension.png" },
        { key: "ascSpread",                 label: "Asc. Spread",               type: "number",  url: "Pictures/Default/SingularityAscensionSpeed.png" },
        { key: "baseObt",                   label: "Base Obtainium",            type: "number",  url: "Pictures/Default/Obtainium.png" },
        { key: "baseOff",                   label: "Base Offering",             type: "number",  url: "Pictures/Default/Offering.png" },
        { key: "bonusRow2",                 label: "Bonus Row 2",               type: "number",  url: "Pictures/RedAmbrosia/RedAmbrosiaFreeLevelsRow2.png" },
        { key: "bonusRow3",                 label: "Bonus Row 3",               type: "number",  url: "Pictures/RedAmbrosia/RedAmbrosiaFreeLevelsRow3.png" },
        { key: "bonusRow4",                 label: "Bonus Row 4",               type: "number",  url: "Pictures/RedAmbrosia/RedAmbrosiaFreeLevelsRow4.png" },
        { key: "bonusRow5",                 label: "Bonus Row 5",               type: "number",  url: "Pictures/RedAmbrosia/RedAmbrosiaFreeLevelsRow5.png" },
        { key: "runeSiExp",                 label: "SI Rune Exp.",              type: "text",    url: "Pictures/Runes/SuperiorIntellect.png" },
        { key: "runeSiRC",                  label: "SI Rune Coeff",             type: "number",  url: "Pictures/Runes/SuperiorIntellect.png" },
        { key: "runeSiBonusLevelsTotal",    label: "SI Bonus Levels",           type: "number",  url: "Pictures/Runes/SuperiorIntellect.png" },
        { key: "runeIaExp",                 label: "IA Rune Exp.",              type: "text",    url: "Pictures/Runes/InfiniteAscent.png" },
        { key: "runeIaBonusLevelsTotal",    label: "IA Bonus Levels (total)",   type: "number",  url: "Pictures/Runes/InfiniteAscent.png" },
        { key: "runeIaBonusLevelsTalisman", label: "IA Bonus Levels (talisman)",type: "number",  url: "Pictures/Runes/InfiniteAscent.png" },
        { key: "baseTalismanPower",         label: "Talisman Power Mult.",      type: "number",  url: "Pictures/Default/BlueberryTalismanBonusRuneLevel.png" },
        { key: "patreonBonus",              label: "Patreon Bonus",             type: "percent", url: "Pictures/PseudoShop/GOLDEN_QUARK_BUFF.png" },
        { key: "activeBells",               label: "Active Bells",              type: "number",  url: "Pictures/PseudoShop/HAPPY_HOUR_BELL.png" },
        { key: "jack",                      label: "Jack of All Trades",        type: "boolean", url: "Pictures/Default/ShopPanthema.png" },
        { key: "freeShopLevelsInfinity",    label: "Free Infinity Upgrades",    type: "number",  url: "Pictures/Default/ShopInfiniteShopUpgrades.png" },
        { key: "freeShopLevelsCube",        label: "Free Shop C. Levels",       type: "number",  url: "Pictures/Default/Quark.png" },
        { key: "freeShopLevelsSpeed",       label: "Free Shop Sp. Levels",      type: "number",  url: "Pictures/Default/Quark.png" },
        { key: "freeShopLevelsQuark",       label: "Free Shop Q. Levels",       type: "number",  url: "Pictures/Default/Quark.png" },
        { key: "chronometerLevel",          label: "Chronometer Level",         type: "number",  url: "Pictures/Default/ShopChronometerInfinity.png" },
        { key: "shopAmbrosiaLuck1",         label: "Shop Ambrosia Luck 1",      type: "number",  url: "Pictures/Default/ShopAmbrosiaLuck1.png" },
        { key: "shopAmbrosiaLuck2",         label: "Shop Ambrosia Luck 2",      type: "number",  url: "Pictures/Default/ShopAmbrosiaLuck2.png" },
        { key: "shopAmbrosiaLuck3",         label: "Shop Ambrosia Luck 3",      type: "number",  url: "Pictures/Default/ShopAmbrosiaLuck3.png" },
        { key: "shopAmbrosiaLuck4",         label: "Shop Ambrosia Luck 4",      type: "number",  url: "Pictures/Default/ShopAmbrosiaLuck4.png" },
        { key: "shopRedLuck1",              label: "Shop Red Luck 1",           type: "number",  url: "Pictures/Default/ShopRedLuck1.png" },
        { key: "shopRedLuck2",              label: "Shop Red Luck 2",           type: "number",  url: "Pictures/Default/ShopRedLuck2.png" },
        { key: "shopRedLuck3",              label: "Shop Red Luck 3",           type: "number",  url: "Pictures/Default/ShopRedLuck3.png" },
        { key: "shopAmbrosiaGeneration1",   label: "Shop Ambrosia Gen 1",       type: "number",  url: "Pictures/Default/ShopAmbrosiaGeneration1.png" },
        { key: "shopAmbrosiaGeneration2",   label: "Shop Ambrosia Gen 2",       type: "number",  url: "Pictures/Default/ShopAmbrosiaGeneration2.png" },
        { key: "shopAmbrosiaGeneration3",   label: "Shop Ambrosia Gen 3",       type: "number",  url: "Pictures/Default/ShopAmbrosiaGeneration3.png" },
        { key: "shopAmbrosiaGeneration4",   label: "Shop Ambrosia Gen 4",       type: "number",  url: "Pictures/Default/ShopAmbrosiaGeneration4.png" },
        { key: "shopImproveQuarkHept1",     label: "Shop QHept 1",              type: "number",  url: "Pictures/Default/ShopImprovedQuarkHepteract0.png" },
        { key: "shopImproveQuarkHept2",     label: "Shop QHept 2",              type: "number",  url: "Pictures/Default/ShopImprovedQuarkHepteract.png" },
        { key: "shopImproveQuarkHept3",     label: "Shop QHept 3",              type: "number",  url: "Pictures/Default/ShopImprovedQuarkHepteract2.png" },
        { key: "shopImproveQuarkHept4",     label: "Shop QHept 4",              type: "number",  url: "Pictures/Default/ShopImprovedQuarkHepteract3.png" },
        { key: "shopImproveQuarkHept5",     label: "Shop QHept ∞",              type: "number",  url: "Pictures/Default/ShopImprovedQuarkHepteractInfinity.png" },
        { key: "ossifiedTactics",           label: "Ossified Tactics",          type: "number",  url: "Pictures/RedAmbrosia/RedAmbrosiaRegularLuck.png" },
        { key: "ossifiedTactics2",          label: "Ossified Tactics II",       type: "number",  url: "Pictures/RedAmbrosia/RedAmbrosiaRegularLuck.png" },
        { key: "redberries",                label: "Berries that are... blue?", type: "number",  url: "Pictures/RedAmbrosia/RedAmbrosiaBlueberries.png" },
        { key: "viscount",                  label: "Viscount",                  type: "boolean", url: "Pictures/RedAmbrosia/RedAmbrosiaTutorial.png" },
    ] as const;

    private static readonly heaterOptionLabels = [
        "Luck",   // a[0]: calculateAmb
        "Quarks",                      // a[1]: calculateQuarks
        "3-7D Cubes",                  // a[2]: calculateCubes
        "Octeracts",                   // a[3]: calculateOct
        "Obtaining + Offering",        // a[4]: calculateOff
        "Hyperflux (p4x4, pre-AoAG)",  // a[5]: calculateHyperflux
        "Amb + Oct",                   // a[6]: calculateAmbOct
        "Generation + Oct",            // a[7]: calculateGen
    ];

    private static currentResultModalId: string | null = null;

    private static readonly resultKeyDisplayMap: Record<string, string> = {
        luck:     'Luck',
        rLuck:    'Red Luck',
        allAmb:   'All Ambrosia',
        quarks:   'Quarks',
        cubes:    '3-7D Cubes',
        oct:      'Octeracts',
        obt:      'Obtaining',
        off:      'Offering',
        hyperflux:'Hyperflux (h0–h7)',
        ambOct:   'Amb + Oct',
        gen:      'Generation (gen1–gen3)',
    };

    /** Per-row labels for keys whose rows each deserve their own Result cell. */
    private static readonly resultKeyRowLabels: Record<string, string[]> = {
        hyperflux: ['H0', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7'],
        gen:       ['Gen 1 + Oct', 'Gen 2 + Oct', 'Gen 3 + Oct'],
    };

    private static translateResultKey(key: string): string {
        return this.resultKeyDisplayMap[key] ?? key;
    }

    static async openHeaterComputationModal(): Promise<void> {
        const hsui = HSModuleManager.getModule<HSUI>('HSUI');
        if (!hsui) return;
        const dataModule = HSModuleManager.getModule<HSGameDataAPI>("HSGameDataAPI");
        if (!dataModule) return;
        const heaterData = await dataModule.dumpDataForHeater();
        if (!heaterData) return;

        const initialInput = this.buildOptimizerInput(heaterData);

        HSUI.injectStyle(`
            .hs-heater-modal-block { display: inline-flex; gap: 14px; max-width: 860px; width: max-content; }
            .hs-heater-results-modal-block { display: block; max-width: none; width: auto; }
            .hs-heater-scrollable { max-height: calc(100vh - 150px); overflow-y: auto; }
            .hs-heater-modal-left { flex: 0 1 auto; width: auto; min-width: 100px; }
            .hs-heater-modal-right { flex: 0 0 auto; display: flex; flex-direction: column; gap: 12px; width: auto; }
            .hs-heater-input-table, .hs-heater-results-table, .hs-heater-subtable { border-collapse: collapse; }
            .hs-heater-input-table { width: auto; table-layout: fixed; }
            .hs-heater-results-table, .hs-heater-subtable { width: auto; table-layout: auto; }
            .hs-heater-input-table td, .hs-heater-input-table th,
            .hs-heater-results-table td, .hs-heater-results-table th,
            .hs-heater-subtable td, .hs-heater-subtable th { padding: 0px 2px; border: 1px solid rgba(255,255,255,0.08); }
            .hs-heater-input-table td, .hs-heater-input-table th { height: 20px; line-height: 20px; min-height: 20px; }
            .hs-heater-input-table td:first-child, .hs-heater-input-table th:first-child { width: auto; white-space: nowrap; }
            .hs-heater-input-table td:nth-child(2), .hs-heater-input-table th:nth-child(2) { width: 200px; }
            .hs-heater-input-table td:nth-child(3), .hs-heater-input-table th:nth-child(3) { width: auto; text-align: center; }
            .hs-heater-results-table th:first-child, .hs-heater-results-table td:first-child { width: auto; white-space: nowrap; }
            .hs-heater-results-table th:last-child, .hs-heater-results-table td:last-child { width: auto; }
            .hs-heater-input-table input { width: 100%; min-width: 165px; box-sizing: border-box; height: 18px; }
            .hs-heater-lock-button { border: none; background: transparent; cursor: pointer; padding: 0; }
            .hs-heater-lock-button:hover { transform: scale(1.05); }
            .hs-heater-lock-cell-locked { background: rgba(179, 25, 25, 0.58); }
            .hs-heater-results-table th, .hs-heater-subtable th { text-align: left; }
            .hs-heater-active-grid { display: grid; grid-template-columns: 1fr; gap: 8px; }
            .hs-heater-active-label { display: flex; align-items: center; gap: 6px; }
            .hs-heater-section-title { margin: 0 0 6px 0; font-weight: bold; }
            .hs-heater-result-cell { white-space: normal; word-break: break-word; }
            .hs-heater-results-wrapper { overflow-x: auto; }
            .hs-heater-loadout-cell { display: flex; align-items: center; gap: 8px; }
            .hs-heater-loadout-buttons { display: flex; align-items: center; gap: 8px; flex-wrap: nowrap; }
            .hs-heater-loadout-preview { display: inline-block; max-width: 320px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
            .hs-heater-copy-loadout-btn, .hs-heater-import-loadout-btn { cursor: pointer; padding: 4px 8px; font-size: 0.85em; }
            .hs-heater-section-group { margin-bottom: 12px; }
            .hs-heater-section-group-title { font-weight: bold; margin: 8px 0 2px 0; font-size: 0.95em; opacity: 0.75; }
            .hs-heater-tooltip-wrap { position: relative; display: inline-block; cursor: help; }
            .hs-heater-tooltip-text { display: none; position: absolute; z-index: 9999; left: 0; top: 100%; background: #1e1e1e; color: #e0e0e0; border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; padding: 6px 8px; white-space: pre; font-family: monospace; font-size: 0.78em; max-height: 280px; overflow-y: auto; min-width: 220px; max-width: 480px; box-shadow: 0 4px 12px rgba(0,0,0,0.5); }
            .hs-heater-tooltip-wrap:hover .hs-heater-tooltip-text, .hs-heater-tooltip-wrap:focus .hs-heater-tooltip-text { display: block; }
        `);

        const content = `
            <div class="hs-heater-modal-block">
                <div class="hs-heater-modal-left hs-heater-scrollable">
                    ${this.buildInputTable(initialInput)}
                </div>
                <div class="hs-heater-modal-right hs-heater-scrollable">
                    <div>${HSUIC.Button({ id: 'hs-heater-update-inputs-btn', text: 'Update 🔓 Inputs', styles: { width: 'auto' } })}</div>
                    <div>${this.buildHeaterOptionToggleGrid(initialInput.heaterOptions)}</div>
                    <div>${HSUIC.Button({ id: 'hs-heater-recalculate-btn', text: '(Re)Compute', styles: { width: 'auto' } })}</div>
                </div>
            </div>
        `;

        const modalId = await hsui.Modal({
            title: 'Ambrosia Heater Inputs',
            htmlContent: content,
            // TODO: redo this below...
            styles: {
                maxWidth: '860px',
                height: 'auto',
                minHeight: '200px',
                maxHeight: 'calc(100vh - 20px)'
            }
        });

        this.attachModalHandlers(modalId);
    }

    private static async openHeaterResultModal(result: HeaterOptimizationResult, parentModalId?: string): Promise<void> {
        const hsui = HSModuleManager.getModule<HSUI>('HSUI');
        if (!hsui) { HSUI.Notify('Failed to open heater result modal because UI was unavailable.', { position: 'top', notificationType: 'error' }); return; }

        if (this.currentResultModalId) {
            const updated = this.updateResultModalContent(result);
            if (updated) {
                return;
            }
            this.currentResultModalId = null;
        }

        const content = `
            <div class="hs-heater-results-modal-block">
                <div>
                    <div class="hs-heater-results-wrapper">${this.buildResultTable(result)}</div>
                </div>
            </div>
        `;

        this.currentResultModalId = await hsui.Modal({
            title: 'Ambrosia Heater Results',
            htmlContent: content,
            parentModalId,
            styles: {
                width: 'auto',
                minHeight: '520px',
                maxHeight: 'calc(100vh - 20px)',
                overflow: 'auto'
            }
        });
    }

    private static updateResultModalContent(result: HeaterOptimizationResult): boolean {
        if (!this.currentResultModalId) return false;
        const modal = document.getElementById(this.currentResultModalId);
        if (!modal) return false;
        const body = modal.querySelector('.hs-modal-body');
        if (!body) return false;

        body.innerHTML = `
            <div class="hs-heater-results-modal-block">
                <div>
                    <div class="hs-heater-results-wrapper">${this.buildResultTable(result)}</div>
                </div>
            </div>
        `;

        modal.style.width = 'auto';
        modal.style.minWidth = '0';
        modal.style.maxWidth = 'none';
        return true;
    }

    private static buildOptimizerInput(exportData: any): HeaterOptimizerInput {
        return {
            amb:                    exportData.hs_data.lifetimeAmbrosia,
            ramb:                   exportData.hs_data.lifetimeRedAmbrosia,
            ambSpeedNonAmbBerries:  exportData.hs_data.ambSpeedNonAmbBerries,
            blueberries:            exportData.hs_data.blueberries,
            luckBaseNonAmb:         exportData.hs_data.luckBaseNonAmb,
            luckMultNonAmb:         exportData.hs_data.luckMultNonAmb - 1, // same as the sheet
            redLuckBase:            exportData.hs_data.redLuckBase,
            luckConversion:         exportData.hs_data.luckConversion,
            quarksOwned:            exportData.hs_data.quarksOwned,
            qHept:                  exportData.hs_data.qHept,
            cubesExpTotal:          exportData.hs_data.cubesExpTotal,
            currentSingularity:     exportData.hs_data.currentSingularity,
            singularityReducers:    exportData.hs_data.singularityReducers,
            exalt:                  exportData.hs_data.exalt,
            postAoag:               exportData.hs_data.postAoag,
            transcription:          exportData.hs_data.transcription,
            ascSpeed:               exportData.hs_data.ascSpeed,
            ascSpread:              exportData.hs_data.ascSpread,
            baseObt:                exportData.hs_data.baseObt,
            baseOff:                exportData.hs_data.baseOff,
            bonusRow2:              exportData.hs_data.bonusRow2,
            bonusRow3:              exportData.hs_data.bonusRow3,
            bonusRow4:              exportData.hs_data.bonusRow4,
            bonusRow5:              exportData.hs_data.bonusRow5,
            runeSiExp:                  exportData.hs_data.runeSiExp,
            runeSiRC:                   exportData.hs_data.runeSiRC,
            runeSiBonusLevelsTotal:     exportData.hs_data.runeSiBonusLevelsTotal,
            runeIaExp:                  exportData.hs_data.runeIaExp,
            runeIaBonusLevelsTotal:     exportData.hs_data.runeIaBonusLevelsTotal,
            runeIaBonusLevelsTalisman:  exportData.hs_data.runeIaBonusLevelsTalisman,
            baseTalismanPower:          exportData.hs_data.baseTalismanPower,
            patreonBonus:               exportData.hs_data.patreonBonus,
            activeBells:                exportData.hs_data.activeBells,
            jack:                       exportData.hs_data.jack,
            freeShopLevelsInfinity:     exportData.hs_data.freeShopLevelsInfinity,
            freeShopLevelsCube:         exportData.hs_data.freeShopLevelsCube,
            freeShopLevelsSpeed:        exportData.hs_data.freeShopLevelsSpeed,
            freeShopLevelsQuark:        exportData.hs_data.freeShopLevelsQuark,
            chronometerLevel:           exportData.hs_data.chronometerLevel,
            shopAmbrosiaLuck1:          exportData.hs_data.shopAmbrosiaLuck1,
            shopAmbrosiaLuck2:          exportData.hs_data.shopAmbrosiaLuck2,
            shopAmbrosiaLuck3:          exportData.hs_data.shopAmbrosiaLuck3,
            shopAmbrosiaLuck4:          exportData.hs_data.shopAmbrosiaLuck4,
            shopRedLuck1:               exportData.hs_data.shopRedLuck1,
            shopRedLuck2:               exportData.hs_data.shopRedLuck2,
            shopRedLuck3:               exportData.hs_data.shopRedLuck3,
            shopAmbrosiaGeneration1:    exportData.hs_data.shopAmbrosiaGeneration1,
            shopAmbrosiaGeneration2:    exportData.hs_data.shopAmbrosiaGeneration2,
            shopAmbrosiaGeneration3:    exportData.hs_data.shopAmbrosiaGeneration3,
            shopAmbrosiaGeneration4:    exportData.hs_data.shopAmbrosiaGeneration4,
            shopImproveQuarkHept1:      exportData.hs_data.shopImproveQuarkHept1,
            shopImproveQuarkHept2:      exportData.hs_data.shopImproveQuarkHept2,
            shopImproveQuarkHept3:      exportData.hs_data.shopImproveQuarkHept3,
            shopImproveQuarkHept4:      exportData.hs_data.shopImproveQuarkHept4,
            shopImproveQuarkHept5:      exportData.hs_data.shopImproveQuarkHept5,
            heaterOptions:              Array(this.heaterOptionLabels.length).fill(true),
            ossifiedTactics:            exportData.hs_data.redAmbrosiaUpgrades.regularLuck,
            ossifiedTactics2:           exportData.hs_data.redAmbrosiaUpgrades.regularLuck2,
            redberries:                 exportData.hs_data.redAmbrosiaUpgrades.blueberries,
            viscount:                   exportData.hs_data.redAmbrosiaUpgrades.viscount ? true : false,
        };
    }

    private static buildInputTable(input: HeaterOptimizerInput): string {
        const rows = this.inputDefinitions.map((field) => {
            const fieldId = `hs-heater-input-${field.key}`;
            const lockId = `hs-heater-lock-${field.key}`;
            const value = input[field.key] as number | Decimal | boolean;
            let displayedValue = '';
            if (typeof value === 'number' && Number.isFinite(value)) {
                displayedValue = field.type === 'percent' ? String(value * 100) : String(value);
            } else if (value instanceof Decimal) {
                displayedValue = value.toString();
            }
            const iconHtml = field.url
                ? `<img src="${field.url}" alt="${this.escapeHtml(field.label)}" width="20" height="20" style="display:block; margin:auto;" />`
                : '';
            const inputHtml = field.type === "boolean"
                ? HSUIC.Input({ id: fieldId, type: HSInputType.CHECK, props: value ? { checked: 'true' } : undefined })
                : field.type === 'percent'
                    ? `<div style="display:inline-flex;align-items:center;gap:2px;width:100%;">${HSUIC.Input({ id: fieldId, type: HSInputType.NUMBER, props: { value: displayedValue, step: 'any', min: '0' }, styles: { width: '100%' } })}<span>%</span></div>`
                    : HSUIC.Input({
                        id: fieldId,
                        type: field.type === 'text' ? HSInputType.TEXT : HSInputType.NUMBER,
                        props: field.type === 'text'
                            ? { value: displayedValue }
                            : { value: displayedValue, step: 'any', min: '0' },
                        styles: { width: '100%' }
                    });

            return `
                <tr>
                    <td>${iconHtml}</td>
                    <td>${field.label}</td>
                    <td>${inputHtml}</td>
                    <td><button type="button" id="${lockId}" class="hs-heater-lock-button disable-hover-color" data-field-key="${field.key}" data-locked="false" aria-label="Toggle lock">🔓</button></td>
                </tr>
            `;
        });

        return `
            <table class="hs-heater-input-table">
                <tbody>${rows.join('')}</tbody>
            </table>
        `;
    }

    private static setFieldLockState(modal: HTMLElement, fieldKey: string, locked: boolean): void {
        const lockButton = modal.querySelector<HTMLButtonElement>(`#hs-heater-lock-${fieldKey}`);
        if (!lockButton) return;

        lockButton.dataset.locked = String(locked);
        lockButton.textContent = locked ? '🔒' : '🔓';

        const lockCell = lockButton.parentElement;
        if (lockCell) {
            lockCell.classList.toggle('hs-heater-lock-cell-locked', locked);
        }
    }

    private static isFieldLocked(modal: HTMLElement, fieldKey: string): boolean {
        const lockButton = modal.querySelector<HTMLButtonElement>(`#hs-heater-lock-${fieldKey}`);
        if (!lockButton) return false;
        return lockButton.dataset.locked === 'true';
    }

    private static toggleFieldLock(modal: HTMLElement, fieldKey: string): void {
        const currentlyLocked = this.isFieldLocked(modal, fieldKey);
        this.setFieldLockState(modal, fieldKey, !currentlyLocked);
    }

    private static attachInputLockHandlers(modal: HTMLElement): void {
        this.inputDefinitions.forEach((field) => {
            const element = modal.querySelector<HTMLInputElement>(`#hs-heater-input-${field.key}`);
            if (!element) return;

            element.addEventListener('change', () => {
                this.setFieldLockState(modal, field.key, true);
            });
        });
    }

    private static applyOptimizerInputToFields(modal: HTMLElement, input: HeaterOptimizerInput, applyLocked = true): void {
        this.inputDefinitions.forEach((field) => {
            if (!applyLocked && this.isFieldLocked(modal, field.key)) return;

            const element = modal.querySelector<HTMLInputElement>(`#hs-heater-input-${field.key}`);
            if (!element) return;

            if (field.type === "boolean") {
                element.checked = Boolean(input[field.key]);
            } else if (field.type === 'number') {
                element.value = String(input[field.key] ?? 0);
            } else if (field.type === 'percent') {
                element.value = String((input[field.key] as number) * 100);
            }
        });
    }

    private static buildHeaterOptionToggleGrid(active: boolean[]): string {
        const checkboxRows = this.heaterOptionLabels.map((label, index) => {
            const fieldId = `hs-heater-input-active-${index}`;
            const checked = active[index] ? 'checked' : '';
            return `
                <label class="hs-heater-active-label">
                    <input type="checkbox" id="${fieldId}" ${checked} />
                    ${label}
                </label>
            `;
        });

        return `
            <div class="hs-heater-active-grid">${checkboxRows.join('')}</div>
        `;
    }

    private static buildResultTable(result: HeaterOptimizationResult): string {
        const scalarRows: string[] = [];
        const arrayRows: Array<{ key: string; rows: any[][] }> = [];

        Object.entries(result)
            .filter(([key]) => key !== 'input')
            .forEach(([key, value]) => {
                if (Array.isArray(value) && value.length > 0 && Array.isArray(value[0])) {
                    arrayRows.push({ key, rows: value as any[][] });
                } else {
                    const cellHtml = this.formatResultCell(value, key);
                    scalarRows.push(`
                        <tr>
                            <td>${this.escapeHtml(this.translateResultKey(key))}</td>
                            <td class="hs-heater-result-cell">${cellHtml}</td>
                        </tr>
                    `);
                }
            });

        let html = '';
        if (scalarRows.length > 0) {
            html += `
                <table class="hs-heater-results-table">
                    <thead>
                        <tr><th>Result</th><th>Value</th></tr>
                    </thead>
                    <tbody>${scalarRows.join('')}</tbody>
                </table>
            `;
        }

        if (arrayRows.length > 0) {
            html += this.buildArrayResultSection(arrayRows);
        }

        return html;
    }

    private static formatResultCell(value: unknown, key: string): string {
        if (Array.isArray(value)) {
            return `<pre style="margin:0;">${this.escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
        }

        if (typeof value === 'object' && value !== null) {
            return `<pre style="margin:0;">${this.escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
        }

        return this.escapeHtml(String(value));
    }

    private static buildArrayResultSection(arrayRows: Array<{ key: string; rows: any[][] }>): string {
        // Section definitions: title, ordered result keys, whether P4x4 column is shown.
        // The table always has 6 logical columns: Result | Loadout | Cost | Effect | P4x4 | Max
        const sectionDefs: Array<{ title: string; keys: string[]; showP4x4: boolean }> = [
            { title: 'Common Loadouts',           keys: ['luck', 'rLuck', 'allAmb', 'quarks', 'cubes', 'oct', 'obt', 'off'], showP4x4: false },
            { title: 'p4x4 (pre-AoAG) Loadouts (Effect do not consider hyperflux)',     keys: ['hyperflux'],                 showP4x4: true  },
            { title: 'Hybrid Loadouts',           keys: ['ambOct', 'gen'],                                                   showP4x4: false },
        ];

        const TOTAL_COLS = 6;
        const rowsByKey = new Map<string, any[][]>(arrayRows.map(({ key, rows }) => [key, rows]));

        const buildSectionRows = ({ title, keys, showP4x4 }: { title: string; keys: string[]; showP4x4: boolean }): string => {
            const matching = keys.filter(k => rowsByKey.has(k)).map(k => ({ key: k, rows: rowsByKey.get(k)! }));
            if (matching.length === 0) return '';

            // Section title row spanning all columns
            const titleRow = `<tr><td colspan="${TOTAL_COLS}" style="font-weight:bold;text-align:center;padding:4px 2px;background:rgba(255,255,255,0.05);">${this.escapeHtml(title)}</td></tr>`;

            // Header row — Effect spans 2 cols when P4x4 is hidden
            const headerRow = showP4x4
                ? `<tr><th>Result</th><th>Loadout</th><th>Cost</th><th>Effect</th><th>P4x4</th><th>Max</th></tr>`
                : `<tr><th>Result</th><th>Loadout</th><th>Cost</th><th colspan="2">Effect</th><th>Max</th></tr>`;

            const dataRows = matching.map(({ key, rows }) =>
                rows.map((row, rowIndex) => {
                    // row layout: [0]=format, [1]=null, [2]=null, [3]=cost, [4]=effect, [5]=p4x4, [6]=max
                    const loadoutValue = row[0];
                    const isUnaffordable = loadoutValue === 'Unaffordable';
                    const fullLoadout = isUnaffordable ? '' : (typeof loadoutValue === 'string' ? loadoutValue : JSON.stringify(loadoutValue));
                    const escapedFullLoadout = this.escapeHtml(fullLoadout);
                    const isValidJson = !isUnaffordable && fullLoadout.trim().startsWith('{') && fullLoadout.trim().endsWith('}');

                    const copyButton   = isValidJson ? `<button class="hs-heater-copy-loadout-btn" type="button" data-loadout="${escapedFullLoadout}">Copy</button>` : '';
                    const importButton = isValidJson ? `<button class="hs-heater-import-loadout-btn" type="button" data-loadout="${escapedFullLoadout}">Import</button>` : '';
                    const tooltipContent = isValidJson
                        ? this.escapeHtml(fullLoadout.replace(/((?:[^,]*,){1})/g, '$1\n'))
                        : '';
                    const previewIcon  = isValidJson
                        ? `<span class="hs-heater-tooltip-wrap" tabindex="0">🔍<span class="hs-heater-tooltip-text">${tooltipContent}</span></span>`
                        : '';
                    const loadoutCell = isUnaffordable
                        ? `<td>${this.escapeHtml(String(loadoutValue))}</td>`
                        : `<td><div class="hs-heater-loadout-buttons">${previewIcon}${copyButton}${importButton}</div></td>`;

                    const perRowLabels = this.resultKeyRowLabels[key];
                    const resultCell = perRowLabels
                        ? `<td>${this.escapeHtml(perRowLabels[rowIndex] ?? String(rowIndex))}</td>`
                        : rowIndex === 0
                            ? `<td rowspan="${rows.length}">${this.escapeHtml(this.translateResultKey(key))}</td>`
                            : '';
                    const costCell   = `<td>${this.escapeHtml(String(row[3]))}</td>`;
                    const effectCell = showP4x4
                        ? `<td>${this.escapeHtml(String(row[4]))}</td>`
                        : `<td colspan="2">${this.escapeHtml(String(row[4]))}</td>`;
                    const p4x4Cell   = showP4x4 ? `<td>${this.escapeHtml(String(row[5]))}</td>` : '';
                    const maxCell    = `<td>${this.escapeHtml(String(row[6]))}</td>`;

                    return `<tr>${resultCell}${loadoutCell}${costCell}${effectCell}${p4x4Cell}${maxCell}</tr>`;
                }).join('')
            ).join('');

            return titleRow + headerRow + dataRows;
        };

        const allRows = sectionDefs.map(buildSectionRows).join('');
        return `
            <div class="hs-heater-results-wrapper">
                <table class="hs-heater-subtable hs-heater-results-table">
                    <tbody>${allRows}</tbody>
                </table>
            </div>`;
    }

    private static escapeHtml(value: string): string {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    private static async copyLoadoutToClipboard(loadout: string): Promise<void> {
        try {
            await navigator.clipboard.writeText(loadout);
            HSUI.Notify('Loadout copied to clipboard.', { position: 'top', notificationType: 'success' });
        } catch {
            HSUI.Notify('Failed to copy loadout to clipboard.', { position: 'top', notificationType: 'error' });
        }
    }

    private static async importLoadoutToGame(loadout: string): Promise<void> {
        const fileInput = document.getElementById('importBlueberries') as HTMLInputElement | null;
        if (!fileInput) {
            HSUI.Notify('Failed to import loadout: game import file input was not found.', { position: 'top', notificationType: 'error' });
            return;
        }

        if (typeof DataTransfer === 'undefined' || typeof File === 'undefined' || typeof Blob === 'undefined') {
            HSUI.Notify('Loadout import is not supported by this browser.', { position: 'top', notificationType: 'error' });
            return;
        }

        try {
            const blob = new Blob([loadout], { type: 'application/json' });
            const file = new File([blob], 'heater-import.json', { type: 'application/json' });
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            fileInput.files = dataTransfer.files;
            fileInput.dispatchEvent(new Event('change', { bubbles: true }));
            HSUI.Notify('Loadout import sent to game.', { position: 'top', notificationType: 'success' });
        } catch (err) {
            HSUI.Notify('Failed to import loadout to game.', { position: 'top', notificationType: 'error' });
        }
    }

    private static attachModalHandlers(modalId: string): void {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        const updateInputsButton = modal.querySelector('#hs-heater-update-inputs-btn') as HTMLElement | null;
        updateInputsButton?.addEventListener('click', async () => {
            const originalText = updateInputsButton.textContent;
            if (originalText !== null) {
                updateInputsButton.textContent = `${originalText} ⏳`;
            }
            updateInputsButton.style.pointerEvents = 'none';
            await HSUtils.waitForNextTack();

            try {
                const dataModule = HSModuleManager.getModule<HSGameDataAPI>("HSGameDataAPI");
                if (!dataModule) { HSUI.Notify('Failed to update inputs because data module was unavailable.', { position: 'top', notificationType: 'error' }); return; }
                const heaterData = await dataModule.dumpDataForHeater();
                if (!heaterData) { HSUI.Notify('Failed to update inputs because heater data could not be loaded.', { position: 'top', notificationType: 'error' }); return; }

                const updatedInput = this.buildOptimizerInput(heaterData);
                this.applyOptimizerInputToFields(modal, updatedInput, false);
                HSUI.Notify('Heater inputs updated.', { position: 'top', notificationType: 'success' });
            } finally {
                updateInputsButton.style.pointerEvents = '';
                if (originalText !== null) {
                    updateInputsButton.textContent = originalText;
                }
            }
        });

        const recalcButton = modal.querySelector('#hs-heater-recalculate-btn') as HTMLElement | null;
        recalcButton?.addEventListener('click', async () => {
            const originalText = recalcButton.textContent;
            recalcButton.textContent = `${originalText} ⏳`;
            recalcButton.style.pointerEvents = 'none';
            await HSUtils.waitForNextTack();

            try {
                const updatedInput = this.readInputValues(modal);
                const updatedResult = HSHeaterAPI.createHeaterOptimizerResultFromInput(updatedInput);
                await this.openHeaterResultModal(updatedResult, modalId);
            } finally {
                recalcButton.style.pointerEvents = '';
                if (originalText !== null) {
                    recalcButton.textContent = originalText;
                }
            }
        });

        this.attachInputLockHandlers(modal);

        modal.addEventListener('click', (event) => {
            const target = event.target as HTMLElement | null;
            if (!target) return;

            if (target.classList.contains('hs-heater-lock-button')) {
                const fieldKey = target.dataset.fieldKey;
                if (fieldKey) {
                    this.toggleFieldLock(modal, fieldKey);
                }
                return;
            }

            const loadout = target.getAttribute('data-loadout');
            if (!loadout) return;
            if (target.classList.contains('hs-heater-copy-loadout-btn')) {
                void this.copyLoadoutToClipboard(loadout);
                return;
            }
            if (target.classList.contains('hs-heater-import-loadout-btn')) {
                void this.importLoadoutToGame(loadout);
            }
        });
    }

    private static readInputValues(modal: HTMLElement): HeaterOptimizerInput {
        const readNumber = (id: string, fallback = 0): number => {
            const element = modal.querySelector<HTMLInputElement>(`#${id}`);
            if (!element) return fallback;
            const value = Number(element.value);
            return Number.isFinite(value) ? value : fallback;
        };

        const readPercent = (id: string, fallback = 0): number => {
            const element = modal.querySelector<HTMLInputElement>(`#${id}`);
            if (!element) return fallback;
            const value = Number(element.value) / 100;
            return Number.isFinite(value) ? value : fallback;
        };

        const readDecimal = (id: string, fallback = 0): Decimal => {
            const element = modal.querySelector<HTMLInputElement>(`#${id}`);
            if (!element) return new Decimal(fallback);

            const value = element.value.trim();
            if (value === '') return new Decimal(fallback);

            try {
                return new Decimal(value);
            } catch {
                return new Decimal(fallback);
            }
        };

        const readBoolean = (id: string): boolean => {
            const element = modal.querySelector<HTMLInputElement>(`#${id}`);
            return element?.checked ?? false;
        };

        const heaterOptions = this.heaterOptionLabels.map((_, index) => {
            return readBoolean(`hs-heater-input-active-${index}`);
        });

        return {
            amb:                    readNumber('hs-heater-input-amb'),
            ramb:                   readNumber('hs-heater-input-ramb'),
            ambSpeedNonAmbBerries:  readNumber('hs-heater-input-ambSpeedNonAmbBerries'),
            luckBaseNonAmb:         readNumber('hs-heater-input-luckBaseNonAmb'),
            luckMultNonAmb:         readPercent('hs-heater-input-luckMultNonAmb'),
            redLuckBase:            readNumber('hs-heater-input-redLuckBase'),
            luckConversion:         readNumber('hs-heater-input-luckConversion'),
            quarksOwned:            readNumber('hs-heater-input-quarksOwned'),
            qHept:                  readNumber('hs-heater-input-qHept'),
            cubesExpTotal:          readNumber('hs-heater-input-cubesExpTotal'),
            currentSingularity:     readNumber('hs-heater-input-currentSingularity'),
            singularityReducers:    readNumber('hs-heater-input-singularityReducers'),
            exalt:                  readNumber('hs-heater-input-exalt'),
            postAoag:               readBoolean('hs-heater-input-postaoag') ? 1 : 0,
            transcription:          readNumber('hs-heater-input-transcription'),
            ascSpeed:               readNumber('hs-heater-input-ascSpeed'),
            ascSpread:              readNumber('hs-heater-input-ascSpread'),
            baseObt:                readNumber('hs-heater-input-baseObt'),
            baseOff:                readNumber('hs-heater-input-baseOff'),
            blueberries:            readNumber('hs-heater-input-blueberries'),
            bonusRow2:              readNumber('hs-heater-input-bonusRow2'),
            bonusRow3:              readNumber('hs-heater-input-bonusRow3'),
            bonusRow4:              readNumber('hs-heater-input-bonusRow4'),
            bonusRow5:              readNumber('hs-heater-input-bonusRow5'),
            runeSiExp:                  readDecimal('hs-heater-input-runeSiExp'),
            runeSiRC:                   readNumber('hs-heater-input-runeSiRC'),
            runeSiBonusLevelsTotal:     readDecimal('hs-heater-input-runeSiBonusLevelsTotal'),
            runeIaExp:                  readDecimal('hs-heater-input-runeIaExp'),
            runeIaBonusLevelsTotal:     readDecimal('hs-heater-input-runeIaBonusLevelsTotal'),
            runeIaBonusLevelsTalisman:  readDecimal('hs-heater-input-runeIaBonusLevelsTalisman'),
            baseTalismanPower:          readDecimal('hs-heater-input-baseTalismanPower'),
            patreonBonus:               readPercent('hs-heater-input-patreonBonus'),
            activeBells:                readNumber('hs-heater-input-activeBells'),
            jack:                       readBoolean('hs-heater-input-jack'),
            freeShopLevelsInfinity:     readNumber('hs-heater-input-freeShopLevelsInfinity'),
            freeShopLevelsCube:         readNumber('hs-heater-input-freeShopLevelsCube'),
            freeShopLevelsSpeed:        readNumber('hs-heater-input-freeShopLevelsSpeed'),
            freeShopLevelsQuark:        readNumber('hs-heater-input-freeShopLevelsQuark'),
            chronometerLevel:           readNumber('hs-heater-input-chronometerLevel'),
            shopAmbrosiaGeneration1:    readNumber('hs-heater-input-shopAmbrosiaGeneration1'),
            shopAmbrosiaGeneration2:    readNumber('hs-heater-input-shopAmbrosiaGeneration2'),
            shopAmbrosiaGeneration3:    readNumber('hs-heater-input-shopAmbrosiaGeneration3'),
            shopAmbrosiaGeneration4:    readNumber('hs-heater-input-shopAmbrosiaGeneration4'),
            shopAmbrosiaLuck1:          readNumber('hs-heater-input-shopAmbrosiaLuck1'),
            shopAmbrosiaLuck2:          readNumber('hs-heater-input-shopAmbrosiaLuck2'),
            shopAmbrosiaLuck3:          readNumber('hs-heater-input-shopAmbrosiaLuck3'),
            shopAmbrosiaLuck4:          readNumber('hs-heater-input-shopAmbrosiaLuck4'),
            shopRedLuck1:               readNumber('hs-heater-input-shopRedLuck1'),
            shopRedLuck2:               readNumber('hs-heater-input-shopRedLuck2'),
            shopRedLuck3:               readNumber('hs-heater-input-shopRedLuck3'),
            shopImproveQuarkHept1:      readNumber('hs-heater-input-shopImproveQuarkHept1'),
            shopImproveQuarkHept2:      readNumber('hs-heater-input-shopImproveQuarkHept2'),
            shopImproveQuarkHept3:      readNumber('hs-heater-input-shopImproveQuarkHept3'),
            shopImproveQuarkHept4:      readNumber('hs-heater-input-shopImproveQuarkHept4'),
            shopImproveQuarkHept5:      readNumber('hs-heater-input-shopImproveQuarkHept5'),
            heaterOptions,
            ossifiedTactics:            readNumber('hs-heater-input-ossifiedTactics'),
            ossifiedTactics2:           readNumber('hs-heater-input-ossifiedTactics2'),
            redberries:                 readNumber('hs-heater-input-redberries'),
            viscount:                   readBoolean('hs-heater-input-viscount'),
        };
    }
}
