
/**
 * Phase statistics logic for the Autosing modal.
 *
 * This module provides all DOM creation, update, and calculation logic for displaying
 * phase statistics in the autosing timer modal. It is fully decoupled from the modal class
 * and can be reused for any phase-based stat table.
 *
 * Extracted from hs-autosingTimerModal.ts (2026-02-19) as part of modularization.
 *
 * Exports:
 * - PhaseRowDom: Interface for a phase row's DOM structure
 * - createPhaseStatsHeader: Returns header DOM nodes for the phase stats table
 * - createPhaseRowDom: Returns a new row DOM for a phase
 * - updatePhaseRowDom: Updates a row DOM with new stats
 * - createPhaseEmptyNode: Returns a placeholder node for empty state
 * - getPhaseStats: Utility to compute stats from a phaseHistory map
 */

import { phases } from "../../../types/module-types/hs-autosing-types";

/**
 * Interface for a phase row's DOM structure (extended for advanced caching and custom layouts).
 * Includes phase name, count, and a cells array for easy batch updates/caching.
 */
export interface PhaseRowDom {
    row: HTMLDivElement;
    nameCell: HTMLDivElement;
    nameCountSpan: HTMLSpanElement;
    nameTextSpan: HTMLSpanElement;
    loopsCell: HTMLDivElement;
    avgCell: HTMLDivElement;
    sdCell: HTMLDivElement;
    lastCell: HTMLDivElement;
    cells: HTMLDivElement[];
}

/**
 * Creates the header DOM nodes for the phase stats table.
 * @returns Array of header divs (title and column headers)
 */
export function createPhaseStatsHeader(): HTMLDivElement[] {
    function mkHeader(text: string, isTitle = false): HTMLDivElement {
        const div = document.createElement('div');
        div.textContent = text;
        div.className = isTitle ? 'hs-phase-header-title' : 'hs-phase-header';
        return div;
    }
    return [
        mkHeader('PHASE STATISTICS', true),
        mkHeader('Loops'),
        mkHeader('Avg'),
        mkHeader('SD'),
        mkHeader('Last')
    ];
}

/**
 * Creates a new DOM row for a phase's statistics, including phase name and count.
 * @returns PhaseRowDom object containing the row, all cells, and spans for caching.
 */
export function createPhaseRowDom(phaseName = '', count = 0): PhaseRowDom {
    const row = document.createElement('div');
    row.className = 'hs-phase-row';

    // Name cell with count and text
    const nameCell = document.createElement('div');
    nameCell.className = 'hs-phase-name';
    const nameCountSpan = document.createElement('span');
    nameCountSpan.className = 'hs-phase-count';
    nameCountSpan.textContent = count ? `x${count} ` : '';
    const nameTextSpan = document.createElement('span');
    nameTextSpan.className = 'hs-phase-text';
    nameTextSpan.textContent = phaseName;
    nameCell.appendChild(nameCountSpan);
    nameCell.appendChild(nameTextSpan);

    // Stat cells
    const loopsCell = document.createElement('div');
    loopsCell.className = 'hs-phase-loops';
    const avgCell = document.createElement('div');
    avgCell.className = 'hs-phase-avg';
    const sdCell = document.createElement('div');
    sdCell.className = 'hs-phase-sd';
    const lastCell = document.createElement('div');
    lastCell.className = 'hs-phase-last';

    // Order: name, loops, avg, sd, last
    const cells = [nameCell, loopsCell, avgCell, sdCell, lastCell];
    row.append(...cells);
    return { row, nameCell, nameCountSpan, nameTextSpan, loopsCell, avgCell, sdCell, lastCell, cells };
}

/**
 * Updates a phase row DOM with new statistics and phase info.
 * @param dom The PhaseRowDom to update
 * @param stats Object with loopCount, avg, sd, last, phaseName, count
 */
export function updatePhaseRowDom(
    dom: PhaseRowDom,
    stats: { loopCount: number; avg: number; sd: number; last: number; phaseName?: string; count?: number }
) {
    if (typeof stats.phaseName === 'string') dom.nameTextSpan.textContent = stats.phaseName;
    if (typeof stats.count === 'number') dom.nameCountSpan.textContent = `x${stats.count} `;
    dom.loopsCell.textContent = stats.loopCount.toLocaleString();
    dom.avgCell.textContent = stats.avg.toFixed(2);
    dom.sdCell.textContent = stats.sd.toFixed(2);
    dom.lastCell.textContent = stats.last.toFixed(2);
}

/**
 * Creates a placeholder node for when there are no phase stats to display.
 * @returns A div with empty state text
 */
export function createPhaseEmptyNode(): HTMLDivElement {
    const div = document.createElement('div');
    div.className = 'hs-phase-empty';
    div.textContent = 'No data yet...';
    return div;
}

/**
 * Utility to compute phase statistics from a phaseHistory map.
 * @param phaseHistory Map of phase name to { values: number[] }
 * @param phase The phase name to compute stats for
 * @returns Object with loopCount, avg, sd, last values
 */
export function getPhaseStats(phaseHistory: Map<string, { values: number[] }>, phase: string) {
    const entry = phaseHistory.get(phase);
    if (!entry || !entry.values.length) return { loopCount: 0, avg: 0, sd: 0, last: 0 };
    const arr = entry.values;
    const loopCount = arr.length;
    const avg = arr.reduce((a, b) => a + b, 0) / loopCount;
    const sd = Math.sqrt(arr.reduce((a, b) => a + (b - avg) ** 2, 0) / loopCount);
    const last = arr[arr.length - 1];
    return { loopCount, avg, sd, last };
}
