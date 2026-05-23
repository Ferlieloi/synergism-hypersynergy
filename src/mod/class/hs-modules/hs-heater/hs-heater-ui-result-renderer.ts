import { escapeHtml } from "./hs-heater-utils";
import { getEffectiveHeaterIconSrc } from "./hs-heater-icon-store";
import { getHeaterResultSectionDefinitions, type HeaterResultSectionDef } from "./hs-heater-result-config";
import type { NormalizedHeaterResultEntry } from "./hs-heater-result-store";
import type { HeaterResultArrayKey, HeaterResultRow } from "../../../types/data-types/hs-heater-types";

type ResultKey = HeaterResultArrayKey;

const RESULT_COL_INDEX = {
    loadout:       0,
    blueberryCost: 2,
    cost:          3,
    effect:        4,
    p4x4:          5,
    maxed:         6,
} as const;

const RESULT_TABLE_TOTAL_COLS = 7;

type NormalizedResultRow = {
    loadoutValue:       HeaterResultRow[typeof RESULT_COL_INDEX.loadout];
    blueberryCostValue: HeaterResultRow[typeof RESULT_COL_INDEX.blueberryCost];
    costValue:          HeaterResultRow[typeof RESULT_COL_INDEX.cost];
    effectValue:        HeaterResultRow[typeof RESULT_COL_INDEX.effect];
    p4x4Value:          HeaterResultRow[typeof RESULT_COL_INDEX.p4x4];
    maxedValue:         HeaterResultRow[typeof RESULT_COL_INDEX.maxed];
};

function buildTypeLabelWithIcon(label: string, semanticId?: string): string {
    const safeLabel = escapeHtml(label);
    const effectiveIconSrc = semanticId ? getEffectiveHeaterIconSrc(semanticId) : null;
    if (!effectiveIconSrc) return `<span class="hs-heater-type-label">${safeLabel}</span>`;

    const buttonClasses = "hs-heater-type-icon-button";
    const dataAttr = semanticId ? `data-heater-icon-id="${escapeHtml(semanticId)}"` : "";
    const titleText = semanticId ? `title="Alt+click to edit icon; right-click to clear override"` : "";

    return `
        <button type="button" class="${buttonClasses}" ${dataAttr} ${titleText}>
            <img class="hs-heater-type-icon" src="${escapeHtml(effectiveIconSrc)}" alt="" aria-hidden="true" />
            <span class="hs-heater-type-label">${safeLabel}</span>
        </button>`;
}

function formatCostCellValue(value: HeaterResultRow[typeof RESULT_COL_INDEX.cost | typeof RESULT_COL_INDEX.blueberryCost]): string {
    const raw = String(value).trim();
    if (!/^-?\d+$/.test(raw)) {
        return escapeHtml(String(value));
    }
    const sign = raw.startsWith("-") ? "-" : "";
    const digits = sign ? raw.slice(1) : raw;
    const groupedDigits = digits.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    return escapeHtml(`${sign}${groupedDigits}`);
}

function normalizeArrayResultRow(row: HeaterResultRow): NormalizedResultRow {
    return {
        loadoutValue:       row[RESULT_COL_INDEX.loadout],
        blueberryCostValue: row[RESULT_COL_INDEX.blueberryCost],
        costValue:          row[RESULT_COL_INDEX.cost],
        effectValue:        row[RESULT_COL_INDEX.effect],
        p4x4Value:          row[RESULT_COL_INDEX.p4x4],
        maxedValue:         row[RESULT_COL_INDEX.maxed],
    };
}

function buildHeaderTooltipLabel(label: string, tooltip: string): string {
    return `<th class="hs-heater-header-tooltip" data-tooltip="${escapeHtml(tooltip)}">${escapeHtml(label)}</th>`;
}

function buildArraySectionHeaderRow(showP4x4: boolean, effectHeader: string): string {
    const blueberryHeader = `<img src="Pictures/Default/Blueberries.png" class="hs-heater-header-icon" />`;
    const effectLabel = showP4x4
        ? buildHeaderTooltipLabel(effectHeader, "Effect do not consider hyperflux.")
        : `<th>${escapeHtml(effectHeader)}</th>`;
    const p4x4Label = showP4x4
        ? buildHeaderTooltipLabel("p4x4 eq", `"p4x4 eq" indicates the amount\n`
                                            + `of p4x4 you need to buy for the\n`
                                            + `loadout in this row to be better\n`
                                            + `than the ones above it.`)
        : `<th>p4x4 eq</th>`;

    return showP4x4
        ? `<tr class="hs-heater-header-row"><th>Types</th><th>Loadout</th><th>${blueberryHeader}</th><th>Cost</th>${effectLabel}${p4x4Label}<th>Maxed?</th></tr>`
        : `<tr class="hs-heater-header-row"><th>Types</th><th>Loadout</th><th>${blueberryHeader}</th><th>Cost</th><th colspan="2">${escapeHtml(effectHeader)}</th><th>Maxed?</th></tr>`;
}

function buildLoadoutActionControls(escapedFullLoadout: string, isValidJson: boolean): string {
    if (!isValidJson) return "";
    const copyButton = `<button class="hs-heater-copy-loadout-btn hs-heater-json-tooltip-trigger" type="button" data-loadout="${escapedFullLoadout}">Copy</button>`;
    const importButton = `<button class="hs-heater-import-loadout-btn" type="button" data-loadout="${escapedFullLoadout}">Import</button>`;
    return `${copyButton}${importButton}`;
}

function buildArraySectionDataRow(
    entry: NormalizedHeaterResultEntry,
    showP4x4: boolean,
    rowSpan: number,
    selectedSemanticIds: Set<string> = new Set(),
): string {
    const rowModel = normalizeArrayResultRow(entry.rowData);
    const loadoutValue = rowModel.loadoutValue;
    const isUnaffordable = loadoutValue === "Unaffordable";
    const fullLoadout = isUnaffordable ? "" : loadoutValue;
    const escapedFullLoadout = escapeHtml(fullLoadout);
    const isValidJson = !isUnaffordable && fullLoadout.trim().startsWith("{") && fullLoadout.trim().endsWith("}");
    const actionControlsHtml = buildLoadoutActionControls(escapedFullLoadout, isValidJson);
    const isSelectedType = selectedSemanticIds.has(entry.semanticId);
    const typeCellClass = isSelectedType ? ' class="hs-heater-selected-type-cell"' : '';

    const loadoutCell = isUnaffordable
        ? `<td>${escapeHtml(String(loadoutValue))}</td>`
        : `<td><div class="hs-heater-loadout-buttons">${actionControlsHtml}</div></td>`;
    const resultCell = rowSpan === 1
        ? `<td${typeCellClass}>${buildTypeLabelWithIcon(entry.label, entry.semanticId)}</td>`
        : entry.rowIndex === 0
            ? `<td${typeCellClass} rowspan="${rowSpan}">${buildTypeLabelWithIcon(entry.label, entry.semanticId)}</td>`
            : "";
    const blueberryCostCell = `<td>${formatCostCellValue(rowModel.blueberryCostValue)}</td>`;
    const costCell = `<td>${formatCostCellValue(rowModel.costValue)}</td>`;
    const effectCell = showP4x4
        ? `<td>${escapeHtml(String(rowModel.effectValue))}</td>`
        : `<td colspan="2">${escapeHtml(String(rowModel.effectValue))}</td>`;
    const p4x4Cell = showP4x4 ? `<td>${escapeHtml(String(rowModel.p4x4Value))}</td>` : "";
    const maxCell = `<td>${rowModel.maxedValue === true ? '<span class="hs-heater-status-maxed">✔</span>' : rowModel.maxedValue === false ? '<span class="hs-heater-status-unmaxed">✘</span>' : escapeHtml(String(rowModel.maxedValue))}</td>`;
    return `<tr>${resultCell}${loadoutCell}${blueberryCostCell}${costCell}${effectCell}${p4x4Cell}${maxCell}</tr>`;
}

function buildArraySectionRows(sectionDef: HeaterResultSectionDef, entriesByKey: Map<ResultKey, NormalizedHeaterResultEntry[]>, selectedSemanticIds: Set<string> = new Set()): string {
    const matching = sectionDef.keys
        .filter((key) => entriesByKey.has(key))
        .map((key) => ({ key, entries: entriesByKey.get(key)! }));
    if (matching.length === 0) return "";

    const titleRow = `<tr><td colspan="${RESULT_TABLE_TOTAL_COLS}" class="hs-heater-title-row">${escapeHtml(sectionDef.title)}</td></tr>`;
    const headerRow = buildArraySectionHeaderRow(sectionDef.showP4x4, sectionDef.effectHeader);
    const dataRows = matching
        .map(({ key, entries }) => {
            const rowSpan = entries[0].isRowBased ? 1 : entries.length;
            return entries.map((entry) => buildArraySectionDataRow(entry, sectionDef.showP4x4, rowSpan, selectedSemanticIds)).join("");
        })
        .join("");
    return titleRow + headerRow + dataRows;
}

function buildArrayResultSection(entriesByKey: Map<ResultKey, NormalizedHeaterResultEntry[]>, selectedSemanticIds: Set<string> = new Set()): string {
    const sectionDefs = getHeaterResultSectionDefinitions();
    const allRows = sectionDefs.map((sectionDef) => buildArraySectionRows(sectionDef, entriesByKey, selectedSemanticIds)).join("");
    return `
        <div class="hs-heater-results-wrapper">
            <div class="hs-heater-results-topbar">
                <div class="hs-heater-results-topbar-help" aria-label="Heater results help" tabindex="0">?</div>
            </div>
            <table class="hs-heater-subtable hs-heater-results-table">
                <tbody>${allRows}</tbody>
            </table>
        </div>
    `;
}

function groupNormalizedResultEntriesByKey(entries: NormalizedHeaterResultEntry[]): Map<ResultKey, NormalizedHeaterResultEntry[]> {
    const map = new Map<ResultKey, NormalizedHeaterResultEntry[]>();
    for (const entry of entries) {
        const group = map.get(entry.key);
        if (group) group.push(entry);
        else map.set(entry.key, [entry]);
    }
    return map;
}

export function buildResultTableHtmlFromNormalized(normalizedEntries: NormalizedHeaterResultEntry[], selectedSemanticIds: Set<string> = new Set()): string {
    if (normalizedEntries.length === 0) return "";

    const entriesByKey = groupNormalizedResultEntriesByKey(normalizedEntries);
    return buildArrayResultSection(entriesByKey, selectedSemanticIds);
}
