import { HSHeaterAPI } from "./hs-heater-api";
import type { HSUI } from "../../hs-core/hs-ui";
import type { HeaterOptimizationResult, HeaterOptimizerInput } from "../../../types/data-types/hs-heater-types";

export class HSHeaterUI {
    static async openOptimizerResultModal(optimizerResult: HeaterOptimizationResult, hsui: HSUI): Promise<string> {
        const html = this.buildOptimizerModalHtml(optimizerResult);
        const modalId = await hsui.Modal({
            title: 'True Heater Optimizer',
            htmlContent: html,
            needsToLoad: true
        });

        const modal = document.getElementById(modalId);
        if (!modal) return modalId;

        const recalcButton = modal.querySelector('[data-heater-optimize-recalc]') as HTMLButtonElement | null;
        recalcButton?.addEventListener('click', () => {
            const form = modal.querySelector('[data-heater-optimize-form]') as HTMLElement | null;
            if (!form) return;

            const input = this.collectOptimizerInputFromForm(form);
            const updatedResult = HSHeaterAPI.createHeaterOptimizerResultFromInput(input);
            const resultsContainer = modal.querySelector('[data-heater-optimizer-results]') as HTMLElement | null;
            if (!resultsContainer) return;

            const html = this.buildOptimizerResultsHtml(updatedResult);
            resultsContainer.innerHTML = html || '<div style="padding: 10px; color: #666;">No optimizer results generated for the current input. Check active modules and values.</div>';
        });

        return modalId;
    }

    static buildOptimizerModalHtml(optimizerResult: HeaterOptimizationResult): string {
        let html = `<div style="font-family: var(--hs-font-family); line-height: 1.4;">`;
        if (optimizerResult.notes.length > 0) {
            html += `<h2>Notes</h2><ul>${optimizerResult.notes.map((note: string) => `<li>${this.escapeHtml(note)}</li>`).join('')}</ul>`;
        }

        html += this.renderOptimizerInputEditor(optimizerResult.input);
        html += `<div data-heater-optimizer-results>${this.buildOptimizerResultsHtml(optimizerResult)}</div>`;
        html += `</div>`;
        return html;
    }

    static renderOptimizerInputEditor(input: HeaterOptimizerInput): string {
        const inputFields: Array<{ key: Exclude<keyof HeaterOptimizerInput, 'active'>; label: string; step: string }> = [
            { key: 'amb', label: 'Lifetime Ambrosia', step: '1' },
            { key: 'quark', label: 'Quarks', step: '1' },
            { key: 'plat4x4', label: 'Platonic 4x4', step: '1' },
            { key: 'baseluck', label: 'Base Luck', step: 'any' },
            { key: 'multluck', label: 'Luck Multiplier', step: 'any' },
            { key: 'cube', label: 'Total Cubes', step: '1' },
            { key: 'singularity', label: 'Effective Singularity', step: 'any' },
            { key: 'postaoag', label: 'Antiquities Active', step: '1' },
            { key: 'transcription', label: 'Transcription', step: 'any' },
            { key: 'ascspeed1', label: 'Ascension Speed 1', step: 'any' },
            { key: 'ascspeed2', label: 'Ascension Speed 2', step: 'any' },
            { key: 'spread', label: 'Spread', step: 'any' },
            { key: 'voucher', label: 'Total Vouchers', step: '1' },
            { key: 'baseobt', label: 'Base Obtainium Buff Amount', step: '1' },
            { key: 'baseoff', label: 'Base Offering Buff Amount', step: '1' },
            { key: 'bb', label: 'Blueberries', step: '1' },
            { key: 'bonusRow2', label: 'Row 2 Bonus', step: '1' },
            { key: 'bonusRow3', label: 'Row 3 Bonus', step: '1' },
            { key: 'bonusRow4', label: 'Row 4 Bonus', step: '1' },
            { key: 'bonusRow5', label: 'Row 5 Bonus', step: '1' },
            { key: 'ramb', label: 'Lifetime Red Ambrosia', step: '1' },
            { key: 'runeexp', label: 'Rune Experience', step: '1' },
            { key: 'sirc', label: 'SIRC', step: '1' },
            { key: 'bonussi', label: 'Bonus SI', step: '1' },
            { key: 'totalbonusia', label: 'Total Bonus IA', step: '1' },
            { key: 'talismanbonusia', label: 'Talisman Bonus IA', step: '1' },
            { key: 'btp', label: 'Base Talisman Power', step: '1' },
        ];

        const fieldRows = inputFields.map((field) => `
            <div style="display: grid; grid-template-columns: 2fr 3fr; gap: 12px; align-items: center;">
                <label style="font-size: 0.95rem;">${this.escapeHtml(field.label)}</label>
                <input
                    type="number"
                    step="${field.step}"
                    min="0"
                    data-optimizer-input="${field.key}"
                    value="${this.escapeHtml(String(input[field.key]))}"
                    style="width: 100%; padding: 6px; border: 1px solid rgba(0,0,0,0.15); border-radius: 4px;"
                />
            </div>`).join('');

        const activeInputs = input.active.map((active, index) => `
            <label style="display: flex; align-items: center; gap: 8px; font-size: 0.95rem;">
                <input type="checkbox" data-optimizer-active="${index}" ${active ? 'checked' : ''} />
                ${this.escapeHtml(`Active ${index}`)}
            </label>`).join('');

        return `
            <h3 style="margin-bottom: 4px;">Optimizer Input</h3>
            <div data-heater-optimize-form style="display: grid; gap: 12px; margin-bottom: 14px;">
                ${fieldRows}
                <div>
                    <h4 style="margin: 8px 0 6px;">Active modules</h4>
                    <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px 12px;">
                        ${activeInputs}
                    </div>
                </div>
            </div>
            <div style="margin-bottom: 18px;">
                <button type="button" data-heater-optimize-recalc style="padding: 8px 14px; font-size: 0.95rem; background: #2d6cdf; color: white; border: none; border-radius: 4px; cursor: pointer;">Recalculate</button>
            </div>`;
    }

    static collectOptimizerInputFromForm(form: HTMLElement): HeaterOptimizerInput {
        const input = {} as HeaterOptimizerInput;
        const inputFields: Array<Exclude<keyof HeaterOptimizerInput, 'active'>> = [
            'amb', 'quark', 'plat4x4', 'baseluck', 'multluck', 'cube', 'singularity', 'postaoag', 'transcription', 'ascspeed1', 'ascspeed2', 'spread', 'voucher', 'baseobt', 'baseoff', 'bb', 'bonusRow2', 'bonusRow3', 'bonusRow4', 'bonusRow5', 'ramb', 'runeexp', 'sirc', 'bonussi', 'totalbonusia', 'talismanbonusia', 'btp'
        ];

        for (const key of inputFields) {
            const element = form.querySelector(`[data-optimizer-input="${key}"]`) as HTMLInputElement | null;
            input[key] = element ? (parseFloat(element.value) || 0) : 0;
        }

        input.active = Array.from({ length: 8 }, (_, index) => {
            const checkbox = form.querySelector(`[data-optimizer-active="${index}"]`) as HTMLInputElement | null;
            return Boolean(checkbox?.checked);
        });

        return input;
    }

    static buildOptimizerResultsHtml(optimizerResult: HeaterOptimizationResult): string {
        let html = '';
        html += this.renderGroupedBatchSection('Common Loadouts', [
            { label: 'C1: Quarks', value: optimizerResult.c1 },
            { label: 'C2: 3-7D Cubes', value: optimizerResult.c2 },
            { label: 'C3: Octeracts', value: optimizerResult.c3 },
            { label: 'C4: Luck', value: optimizerResult.c4 },
        ]);
        html += this.renderGroupedBatchSection('A0 Loadouts', [
            { label: 'A1: Obtainium', value: optimizerResult.a1 },
            { label: 'A2: Offering', value: optimizerResult.a2 },
        ]);
        html += this.renderGroupedBatchSection('p4x4 Loadouts', [
            { label: 'H0: Octeracts', value: optimizerResult.h0 },
            { label: 'H1', value: optimizerResult.h1 },
            { label: 'H2', value: optimizerResult.h2 },
            { label: 'H3', value: optimizerResult.h3 },
            { label: 'H4', value: optimizerResult.h4 },
            { label: 'H5', value: optimizerResult.h5 },
            { label: 'H6', value: optimizerResult.h6 },
            { label: 'H7', value: optimizerResult.h7 },
            { label: 'S1: Max SR1', value: optimizerResult.s1 },
            { label: 'S2: Max SR2', value: optimizerResult.s2 },
        ]);
        html += this.renderGroupedBatchSection('Amb+Oct', [
            { label: 'M0: Max Luck', value: optimizerResult.m0 },
        ]);
        return html;
    }

    static escapeHtml(value: string): string {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/'/g, '&#39;')
            .replace(/"/g, '&quot;');
    }

    static renderGroupedBatchSection(title: string, sections: Array<{ label: string; value: unknown; rowLabels?: string[] }>): string {
        const rows: Array<{ label: string; values: Array<string | number | boolean> }> = [];

        for (const section of sections) {
            if (!section.value) continue;

            const parsedRows = this.parseOptimizerBatchRows(section.value);
            if (parsedRows.length === 0) continue;

            for (let index = 0; index < parsedRows.length; index++) {
                const label = section.rowLabels?.[index] ?? section.label;
                rows.push({ label, values: parsedRows[index] });
            }
        }

        if (rows.length === 0) {
            return '';
        }

        const tableRows = rows.map((row) => {
            const loadout = String(row.values[0]);
            const cost = row.values.length > 1 ? String(row.values[1]) : '';
            const metric1 = row.values.length > 2 ? String(row.values[2]) : '';
            const metric2 = row.values.length > 3 ? String(row.values[3]) : '';
            const metric3 = row.values.length > 4 ? String(row.values[4]) : '';
            const metric4 = row.values.length > 5 ? String(row.values[5]) : '';
            const max = row.values.length > 6 ? String(row.values[6]) : '';
            return `
                <tr>
                    <td style="padding: 8px; border: 1px solid rgba(0,0,0,0.1); white-space: nowrap;">${this.escapeHtml(row.label)}</td>
                    <td style="padding: 8px; border: 1px solid rgba(0,0,0,0.1); text-align: right;">${this.escapeHtml(cost)}</td>
                    <td style="padding: 8px; border: 1px solid rgba(0,0,0,0.1); text-align: right;">${this.escapeHtml(metric1)}</td>
                    <td style="padding: 8px; border: 1px solid rgba(0,0,0,0.1); text-align: right;">${this.escapeHtml(metric2)}</td>
                    <td style="padding: 8px; border: 1px solid rgba(0,0,0,0.1); text-align: right;">${this.escapeHtml(metric3)}</td>
                    <td style="padding: 8px; border: 1px solid rgba(0,0,0,0.1); text-align: right;">${this.escapeHtml(metric4)}</td>
                    <td style="padding: 8px; border: 1px solid rgba(0,0,0,0.1); text-align: center;">${this.escapeHtml(max)}</td>
                    <td style="padding: 8px; border: 1px solid rgba(0,0,0,0.1); white-space: nowrap;">
                        <button type="button" style="font-size: 0.85rem; padding: 4px 8px;" data-loadout='${this.escapeHtml(loadout)}' onclick="navigator.clipboard.writeText(this.dataset.loadout)">Copy</button>
                    </td>
                </tr>`;
        }).join('');

        return `
            <h3 style="margin-bottom: 4px;">${title}</h3>
            <div style="overflow-x: auto; margin-bottom: 8px;">
                <table style="width: 100%; border-collapse: collapse; font-family: var(--hs-font-family); font-size: 0.95rem;">
                    <thead>
                        <tr>
                            <th style="padding: 8px; border: 1px solid rgba(0,0,0,0.15); text-align: left; background: rgba(0,0,0,0.03);">Loadout</th>
                            <th style="padding: 8px; border: 1px solid rgba(0,0,0,0.15); text-align: right; background: rgba(0,0,0,0.03);">Cost</th>
                            <th style="padding: 8px; border: 1px solid rgba(0,0,0,0.15); text-align: right; background: rgba(0,0,0,0.03);">Metric 1</th>
                            <th style="padding: 8px; border: 1px solid rgba(0,0,0,0.15); text-align: right; background: rgba(0,0,0,0.03);">Metric 2</th>
                            <th style="padding: 8px; border: 1px solid rgba(0,0,0,0.15); text-align: right; background: rgba(0,0,0,0.03);">Metric 3</th>
                            <th style="padding: 8px; border: 1px solid rgba(0,0,0,0.15); text-align: right; background: rgba(0,0,0,0.03);">Metric 4</th>
                            <th style="padding: 8px; border: 1px solid rgba(0,0,0,0.15); text-align: center; background: rgba(0,0,0,0.03);">Max</th>
                            <th style="padding: 8px; border: 1px solid rgba(0,0,0,0.15); text-align: center; background: rgba(0,0,0,0.03);">Copy</th>
                        </tr>
                    </thead>
                    <tbody>${tableRows}</tbody>
                </table>
            </div>`;
    }

    static parseOptimizerBatchRows(value: unknown): Array<Array<string | number | boolean>> {
        if (this.isOptimizerBatchRow(value)) {
            return [value as Array<string | number | boolean>];
        }
        if (Array.isArray(value) && value.length > 0 && this.isOptimizerBatchRow(value[0])) {
            return value as Array<Array<string | number | boolean>>;
        }
        return [];
    }

    static isOptimizerBatchRow(value: unknown): value is Array<string | number | boolean> {
        return Array.isArray(value) && value.length >= 2 && typeof value[0] === 'string';
    }
}
