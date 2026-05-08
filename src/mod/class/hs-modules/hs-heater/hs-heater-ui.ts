import Decimal from "break_infinity.js";
import { HSModuleManager } from "../../hs-core/module/hs-module-manager";
import { HSUI } from "../../hs-core/hs-ui";
import { HSUIC } from "../../hs-core/hs-ui-components";
import { HSGameDataAPI } from "../../hs-core/gds/hs-gamedata-api";
import { HSHeaterAPI } from "./hs-heater-api";
import type { HeaterExportData, HeaterOptimizerInput, HeaterOptimizationResult } from "../../../types/data-types/hs-heater-types";
import { HSInputType } from "../../../types/module-types/hs-ui-types";
import { HSUtils } from "../../hs-utils/hs-utils";

export class HSHeaterUI {
    private static readonly inputDefinitions = [
        { key: "amb",                       label: "Lifetime Ambrosia",     type: "number",  url: "Pictures/Achievements/Progressive/AmbrosiaCount.png" },
        { key: "ramb",                      label: "Lifetime Red Ambrosia", type: "number",  url: "Pictures/Achievements/Progressive/RedAmbrosiaCount.png" },
        { key: "ambSpeed",                  label: "Ambrosia Bar Speed/s",  type: "number",  url: "Pictures/PseudoShop/AMBROSIATimeSkip.png" },
        { key: "luckBaseNonAmb",            label: "Base Luck",             type: "number",  url: "Pictures/Achievements/Rewards/AmbrosiaLuck.png" },
        { key: "luckMultNonAmb",            label: "Base Luck Mult",        type: "number",  url: "Pictures/PseudoShop/AMBROSIA_LUCK_BUFF.png" },
        { key: "redLuckBase",               label: "Base Red Luck",         type: "number",  url: "Pictures/Achievements/Rewards/RedAmbrosiaLuck.png" },
        { key: "luckConversion",            label: "Luck Conversion",       type: "number",  url: "Pictures/RedAmbrosia/RedAmbrosiaConversionImprovement1.png" },
        { key: "quarksOwned",               label: "Quarks Owned",          type: "number",  url: "Pictures/Default/Quark.png" },
        { key: "qHept",                     label: "Quark Hepteract",       type: "number",  url: "Pictures/Default/HepteractQuark.png" },
        { key: "plat4x4",                   label: "Plat 4x4",              type: "number",  url: "Pictures/Default/PlatonicUpgrade19.png" },
        { key: "cubesExpTotal",             label: "Total Cubes Exp.",      type: "number",  url: "Pictures/Default/WowCube.png" },
        { key: "reducedSingularity",        label: "Reduced Singularity",   type: "number",  url: "Pictures/Default/Singularity.png" },
        { key: "isInsideExalt",             label: "Inside Exalt",          type: "boolean", url: "Pictures/Default/TinySChalTime.png" },
        { key: "postAoag",                  label: "Post-AoAG (Obt/Off)",   type: "boolean", url: "Pictures/Runes/Antiquities.png" },
        { key: "transcription",             label: "Transcription",         type: "number",  url: "Pictures/Default/OcteractOneMindImprover.png" },
        { key: "ascSpeed",                  label: "Asc. Speed",            type: "number",  url: "Pictures/Default/TinySpeedAscension.png" },
        { key: "ascSpread",                 label: "Asc. Spread",           type: "number",  url: "Pictures/Default/SingularityAscensionSpeed.png" },
        { key: "baseObt",                   label: "Base Obtainium",        type: "number",  url: "Pictures/Default/Obtainium.png" },
        { key: "baseOff",                   label: "Base Offering",         type: "number",  url: "Pictures/Default/Offering.png" },
        { key: "blueberries",               label: "Blueberries Owned",     type: "number",  url: "Pictures/Default/Blueberries.png" },
        { key: "bonusRow2",                 label: "Bonus Row 2",           type: "number",  url: "Pictures/RedAmbrosia/RedAmbrosiaFreeLevelsRow2.png" },
        { key: "bonusRow3",                 label: "Bonus Row 3",           type: "number",  url: "Pictures/RedAmbrosia/RedAmbrosiaFreeLevelsRow3.png" },
        { key: "bonusRow4",                 label: "Bonus Row 4",           type: "number",  url: "Pictures/RedAmbrosia/RedAmbrosiaFreeLevelsRow4.png" },
        { key: "bonusRow5",                 label: "Bonus Row 5",           type: "number",  url: "Pictures/RedAmbrosia/RedAmbrosiaFreeLevelsRow5.png" },
        { key: "runeMaxExp",                label: "Max Rune Exp.",         type: "number",  url: "Pictures/Runes/Speed.png" },
        { key: "runeSiRC",                  label: "SI Rune Coeff",         type: "number",  url: "Pictures/Runes/SuperiorIntellect.png" },
        { key: "runeSiBonusLevelsTotal",    label: "SI Bonus Levels (total)",      type: "number",  url: "Pictures/Runes/SuperiorIntellect.png" },
        { key: "runeIaBonusLevelsTotal",    label: "IA Bonus Levels (total)",      type: "number",  url: "Pictures/Runes/InfiniteAscent.png" },
        { key: "runeIaBonusLevelsTalisman", label: "IA Bonus Levels (talisman)",   type: "number",  url: "Pictures/Runes/InfiniteAscent.png" },
        { key: "baseTalismanPower",         label: "Talisman Power Mult.",  type: "number",  url: "Pictures/Default/BlueberryTalismanBonusRuneLevel.png" },
        { key: "jack",                      label: "Jack of All Trades",    type: "boolean", url: "Pictures/Default/ShopPanthema.png" },
        { key: "chronometerLevel",          label: "Chronometer Level",     type: "number",  url: "Pictures/Default/ShopChronometerInfinity.png" },
        { key: "freeShopQLevels",           label: "Free Shop Q. Levels",   type: "number",  url: "Pictures/Default/Quark.png" },
        { key: "totalVouchers",             label: "Total Vouchers",        type: "number",  url: "Pictures/Default/ShopInfiniteShopUpgrades.png" },
        { key: "shopAmbrosiaGeneration1",   label: "Shop Ambrosia Gen 1",   type: "number",  url: "Pictures/Default/ShopAmbrosiaGeneration1.png" },
        { key: "shopAmbrosiaGeneration2",   label: "Shop Ambrosia Gen 2",   type: "number",  url: "Pictures/Default/ShopAmbrosiaGeneration2.png" },
        { key: "shopAmbrosiaGeneration3",   label: "Shop Ambrosia Gen 3",   type: "number",  url: "Pictures/Default/ShopAmbrosiaGeneration3.png" },
        { key: "shopAmbrosiaGeneration4",   label: "Shop Ambrosia Gen 4",   type: "number",  url: "Pictures/Default/ShopAmbrosiaGeneration4.png" },
        { key: "shopAmbrosiaLuck1",         label: "Shop Ambrosia Luck 1",  type: "number",  url: "Pictures/Default/ShopAmbrosiaLuck1.png" },
        { key: "shopAmbrosiaLuck2",         label: "Shop Ambrosia Luck 2",  type: "number",  url: "Pictures/Default/ShopAmbrosiaLuck2.png" },
        { key: "shopAmbrosiaLuck3",         label: "Shop Ambrosia Luck 3",  type: "number",  url: "Pictures/Default/ShopAmbrosiaLuck3.png" },
        { key: "shopAmbrosiaLuck4",         label: "Shop Ambrosia Luck 4",  type: "number",  url: "Pictures/Default/ShopAmbrosiaLuck4.png" },
        { key: "shopRedLuck1",              label: "Shop Red Luck 1",       type: "number",  url: "Pictures/Default/ShopRedLuck1.png" },
        { key: "shopRedLuck2",              label: "Shop Red Luck 2",       type: "number",  url: "Pictures/Default/ShopRedLuck2.png" },
        { key: "shopRedLuck3",              label: "Shop Red Luck 3",       type: "number",  url: "Pictures/Default/ShopRedLuck3.png" },
        { key: "shopImproveQuarkHept1",     label: "Shop QHept 1",          type: "number",  url: "Pictures/Default/ShopImprovedQuarkHepteract0.png" },
        { key: "shopImproveQuarkHept2",     label: "Shop QHept 2",          type: "number",  url: "Pictures/Default/ShopImprovedQuarkHepteract.png" },
        { key: "shopImproveQuarkHept3",     label: "Shop QHept 3",          type: "number",  url: "Pictures/Default/ShopImprovedQuarkHepteract2.png" },
        { key: "shopImproveQuarkHept4",     label: "Shop QHept 4",          type: "number",  url: "Pictures/Default/ShopImprovedQuarkHepteract3.png" },
        { key: "shopImproveQuarkHept5",     label: "Shop QHept 5",          type: "number",  url: "Pictures/Default/ShopImprovedQuarkHepteractInfinity.png" },
    ] as const;

    private static readonly activeLabels = ["C1: Quarks", "C2: 3-7D Cubes", "C3: Octeracts", "C4: Luck", "A: Obt/Off", "H: p4x4 (pre-AOAG)", "S: Max SR", "M: Amb + Oct"];

    private static currentResultModalId: string | null = null;

    private static readonly resultKeyDisplayMap: Record<string, string> = {
        c1: 'C1: Quarks',
        c2: 'C2: 3-7D Cubes',
        c3: 'C3: Octeracts',
        c4: 'C4: Luck',
        a1: 'A1: Obtaining',
        a2: 'A2: Offering',
        h0: 'H0: Octeracts',
        h1: 'H1',
        h2: 'H2',
        h3: 'H3',
        h4: 'H4',
        h5: 'H5',
        h6: 'H6',
        h7: 'H7',
        s1: 'S1: Max SR1',
        s2: 'S2: Max SR2',
        m0: 'M0: Max Luck',
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
            .hs-heater-input-table input { width: 100%; min-width: 155px; box-sizing: border-box; height: 18px; }
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
        `);

        const content = `
            <div class="hs-heater-modal-block">
                <div class="hs-heater-modal-left hs-heater-scrollable">
                    ${this.buildInputTable(initialInput)}
                </div>
                <div class="hs-heater-modal-right hs-heater-scrollable">
                    <div>${HSUIC.Button({ id: 'hs-heater-update-inputs-btn', text: 'Update 🔓 Inputs' })}</div>
                    <div>${this.buildActiveToggleGrid(initialInput.active)}</div>
                    <div>${HSUIC.Button({ id: 'hs-heater-recalculate-btn', text: '(Re)Compute' })}</div>
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
                maxHeight: 'calc(100vh - 80px)'
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
                maxHeight: 'calc(100vh - 80px)',
                overflow: 'auto'
            }
        });
    }

    private static updateResultModalContent(result: HeaterOptimizationResult): boolean {
        if (!this.currentResultModalId) return false;
        const modal = document.getElementById(this.currentResultModalId);
        if (!modal)return false;
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
            amb:                exportData.hs_data.lifetimeAmbrosia,
            ramb:               exportData.hs_data.lifetimeRedAmbrosia,
            ambSpeed:           exportData.hs_data.ambSpeed,
            luckBaseNonAmb:     exportData.hs_data.luckBaseNonAmb,
            luckMultNonAmb:     exportData.hs_data.luckMultNonAmb,
            redLuckBase:        exportData.hs_data.redLuckBase,
            luckConversion:     exportData.hs_data.luckConversion,
            quarksOwned:        exportData.hs_data.quarksOwned,
            qHept:              exportData.hs_data.qHept,
            plat4x4:            exportData.hs_data.plat4x4,
            cubesExpTotal:      exportData.hs_data.cubesExpTotal,
            reducedSingularity: exportData.hs_data.reducedSingularity,
            isInsideExalt:      exportData.hs_data.isInsideExalt,
            postAoag:           exportData.hs_data.postAoag,
            transcription:      exportData.hs_data.transcription,
            ascSpeed:           exportData.hs_data.ascSpeed,
            ascSpread:          exportData.hs_data.ascSpread,
            baseObt:            exportData.hs_data.baseObt,
            baseOff:            exportData.hs_data.baseOff,
            blueberries:        exportData.hs_data.blueberries,
            bonusRow2:          exportData.hs_data.bonusRow2,
            bonusRow3:          exportData.hs_data.bonusRow3,
            bonusRow4:          exportData.hs_data.bonusRow4,
            bonusRow5:          exportData.hs_data.bonusRow5,
            runeMaxExp:                 exportData.hs_data.runeMaxExp,
            runeSiRC:                   exportData.hs_data.runeSiRC,
            runeSiBonusLevelsTotal:     exportData.hs_data.runeSiBonusLevelsTotal,
            runeIaBonusLevelsTotal:     exportData.hs_data.runeIaBonusLevelsTotal,
            runeIaBonusLevelsTalisman:  exportData.hs_data.runeIaBonusLevelsTalisman,
            baseTalismanPower:          exportData.hs_data.baseTalismanPower,
            jack:                       exportData.hs_data.jack,
            chronometerLevel:           exportData.hs_data.chronometerLevel,
            freeShopQLevels:            exportData.hs_data.freeShopQLevels,
            totalVouchers:              exportData.hs_data.totalVouchers,
            shopAmbrosiaLuck1:          exportData.hs_data.shopAmbrosiaLuck1,
            shopAmbrosiaLuck2:          exportData.hs_data.shopAmbrosiaLuck2,
            shopAmbrosiaLuck3:          exportData.hs_data.shopAmbrosiaLuck3,
            shopAmbrosiaLuck4:          exportData.hs_data.shopAmbrosiaLuck4,
            shopAmbrosiaGeneration1:    exportData.hs_data.shopAmbrosiaGeneration1,
            shopAmbrosiaGeneration2:    exportData.hs_data.shopAmbrosiaGeneration2,
            shopAmbrosiaGeneration3:    exportData.hs_data.shopAmbrosiaGeneration3,
            shopAmbrosiaGeneration4:    exportData.hs_data.shopAmbrosiaGeneration4,
            shopRedLuck1:               exportData.hs_data.shopRedLuck1,
            shopRedLuck2:               exportData.hs_data.shopRedLuck2,
            shopRedLuck3:               exportData.hs_data.shopRedLuck3,
            shopImproveQuarkHept1:      exportData.hs_data.shopImproveQuarkHept1,
            shopImproveQuarkHept2:      exportData.hs_data.shopImproveQuarkHept2,
            shopImproveQuarkHept3:      exportData.hs_data.shopImproveQuarkHept3,
            shopImproveQuarkHept4:      exportData.hs_data.shopImproveQuarkHept4,
            shopImproveQuarkHept5:      exportData.hs_data.shopImproveQuarkHept5,
            active: Array(this.activeLabels.length).fill(true),
        };
    }

    private static buildInputTable(input: HeaterOptimizerInput): string {
        const rows = this.inputDefinitions.map((field) => {
            const fieldId = `hs-heater-input-${field.key}`;
            const lockId = `hs-heater-lock-${field.key}`;
            const value = input[field.key] as number | Decimal | boolean;
            let displayedValue = '';
            if (typeof value === 'number' && Number.isFinite(value)) {
                displayedValue = String(value);
            } else if (value instanceof Decimal) {
                displayedValue = value.toString();
            }
            const iconHtml = field.url
                ? `<img src="${field.url}" alt="${this.escapeHtml(field.label)}" width="20" height="20" style="display:block; margin:auto;" />`
                : '';
            const inputHtml = field.type === "boolean"
                ? HSUIC.Input({ id: fieldId, type: HSInputType.CHECK, props: value ? { checked: 'true' } : undefined })
                : HSUIC.Input({ id: fieldId, type: HSInputType.NUMBER, props: { value: displayedValue, step: 'any', min: '0' }, styles: { width: '100%' } });

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
            }
        });
    }

    private static buildActiveToggleGrid(active: boolean[]): string {
        const checkboxRows = this.activeLabels.map((label, index) => {
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
        const headers = ['Result', 'Loadout', 'Cost', 'Effect 1', 'Effect 2', 'Effect 3', 'Effect 4', 'Max'];
        const headerHtml = headers.map((header) => `<th>${this.escapeHtml(header)}</th>`).join('');

        const bodyHtml = arrayRows.map(({ key, rows }) => {
            return rows.map((row, rowIndex) => {
                const loadoutValue = row[0];
                const fullLoadout = typeof loadoutValue === 'string' ? loadoutValue : JSON.stringify(loadoutValue);
                const escapedFullLoadout = this.escapeHtml(fullLoadout);
                const isValidJsonLoadout = typeof fullLoadout === 'string' && fullLoadout.trim().startsWith('{') && fullLoadout.trim().endsWith('}');
                const copyButton = isValidJsonLoadout ? `<button class="hs-heater-copy-loadout-btn" type="button" data-loadout="${escapedFullLoadout}">Copy</button>` : '';
                const importButton = isValidJsonLoadout ? `<button class="hs-heater-import-loadout-btn" type="button" data-loadout="${escapedFullLoadout}">Import</button>` : '';
                const loadoutContent = isValidJsonLoadout
                    ? `<div class="hs-heater-loadout-buttons">${copyButton}${importButton}</div>`
                    : `<div class="hs-heater-loadout-cell"><span class="hs-heater-loadout-preview">${this.escapeHtml(fullLoadout.length > 30 ? `${fullLoadout.slice(0, 30)}…` : fullLoadout)}</span></div>`;
                const resultCell = rowIndex === 0 ? `<td rowspan="${rows.length}">${this.escapeHtml(this.translateResultKey(key))}</td>` : '';
                const cells = [resultCell, `<td>${loadoutContent}</td>`, ...row.slice(1).map((value) => `<td>${this.escapeHtml(String(value))}</td>` )];
                return `<tr>${cells.join('')}</tr>`;
            }).join('');
        }).join('');

        return `
            <div class="hs-heater-results-wrapper">
                <table class="hs-heater-subtable hs-heater-results-table">
                    <thead><tr>${headerHtml}</tr></thead>
                    <tbody>${bodyHtml}</tbody>
                </table>
            </div>
        `;
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
        if (navigator.clipboard?.writeText) {
            try {
                await navigator.clipboard.writeText(loadout);
                HSUI.Notify('Loadout copied to clipboard.', { position: 'top', notificationType: 'success' });
                return;
            } catch {
                HSUI.Notify('Failed to copy loadout to clipboard.', { position: 'top', notificationType: 'error' });
                return;
            }
        }

        const textarea = document.createElement('textarea');
        textarea.value = loadout;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        HSUI.Notify('Loadout copied to clipboard.', { position: 'top', notificationType: 'success' });
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
                HSUI.Notify('Inputs updated from current heater data.', { position: 'top', notificationType: 'success' });
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

        const readDecimal = (id: string, fallback = 0): Decimal => {
            return new Decimal(readNumber(id, fallback));
        };

        const readBoolean = (id: string): boolean => {
            const element = modal.querySelector<HTMLInputElement>(`#${id}`);
            return element?.checked ?? false;
        };

        const active = this.activeLabels.map((_, index) => {
            return readBoolean(`hs-heater-input-active-${index}`);
        });

        return {
            amb:                readNumber('hs-heater-input-amb'),
            ramb:               readNumber('hs-heater-input-ramb'),
            ambSpeed:           readNumber('hs-heater-input-ambSpeed'),
            luckBaseNonAmb:     readNumber('hs-heater-input-luckBaseNonAmb'),
            luckMultNonAmb:     readNumber('hs-heater-input-luckMultNonAmb'),
            redLuckBase:        readNumber('hs-heater-input-redLuckBase'),
            luckConversion:     readNumber('hs-heater-input-luckConversion'),
            quarksOwned:        readNumber('hs-heater-input-quarksOwned'),
            qHept:              readNumber('hs-heater-input-qHept'),
            plat4x4:            readNumber('hs-heater-input-plat4x4'),
            cubesExpTotal:      readNumber('hs-heater-input-cubesExpTotal'),
            reducedSingularity: readNumber('hs-heater-input-reducedSingularity'),
            isInsideExalt:      readBoolean('hs-heater-input-isInsideExalt'),
            postAoag:           readBoolean('hs-heater-input-postaoag') ? 1 : 0,
            transcription:      readNumber('hs-heater-input-transcription'),
            ascSpeed:           readNumber('hs-heater-input-ascSpeed'),
            ascSpread:          readNumber('hs-heater-input-ascSpread'),
            baseObt:            readNumber('hs-heater-input-baseObt'),
            baseOff:            readNumber('hs-heater-input-baseOff'),
            blueberries:        readNumber('hs-heater-input-blueberries'),
            bonusRow2:          readNumber('hs-heater-input-bonusRow2'),
            bonusRow3:          readNumber('hs-heater-input-bonusRow3'),
            bonusRow4:          readNumber('hs-heater-input-bonusRow4'),
            bonusRow5:          readNumber('hs-heater-input-bonusRow5'),
            runeMaxExp:         readNumber('hs-heater-input-runeMaxExp'),
            runeSiRC:           readNumber('hs-heater-input-runeSiRC'),
            runeSiBonusLevelsTotal:     readDecimal('hs-heater-input-runeSiBonusLevelsTotal'),
            runeIaBonusLevelsTotal:     readDecimal('hs-heater-input-runeIaBonusLevelsTotal'),
            runeIaBonusLevelsTalisman:  readDecimal('hs-heater-input-runeIaBonusLevelsTalisman'),
            baseTalismanPower:          readDecimal('hs-heater-input-baseTalismanPower'),
            jack:                       readBoolean('hs-heater-input-jack'),
            freeShopQLevels:            readNumber('hs-heater-input-freeShopQLevels'),
            chronometerLevel:           readNumber('hs-heater-input-chronometerLevel'),
            totalVouchers:              readNumber('hs-heater-input-totalVouchers'),
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
            active,
        };
    }
}
