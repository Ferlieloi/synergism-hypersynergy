/**
 * Phase statistics logic for the Autosing modal.
 *
 * This module provides all DOM creation, update, and calculation logic for displaying
 * phase statistics in the autosing modal. It is fully decoupled from the modal class
 * and can be reused for any phase-based stat table.
 *
 * Extracted from hs-autosingModal.ts (2026-02-19) as part of modularization.
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
    nameCell: HTMLDivElement;
    nameCountSpan: HTMLSpanElement;
    nameTextSpan: HTMLSpanElement;
    innerLoopsCell: HTMLDivElement;
    avgCell: HTMLDivElement;
    sdCell: HTMLDivElement;
    lastCell: HTMLDivElement;
    cells: HTMLDivElement[];
    rowIndex: number;
}

/**
 * Creates the header DOM nodes for the phase stats table.
 * @returns Array of header divs (title and column headers)
 */
/*
export function createPhaseStatsHeader(): HTMLDivElement[] {
    function mkHeader(text: string, isTitle = false): HTMLDivElement {
        const div = document.createElement('div');
        div.textContent = text;
        div.className = isTitle ? 'hs-phase-stats-header-title' : 'hs-phase-stats-header';
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
*/

/**
 * Creates 5 cell divs for a phase row, with a data-row-index for identification.
 * @param phaseName
 * @param count
 * @param rowIndex
 */
export function createPhaseRowDom(phaseName = '', count = 0, rowIndex = 0): PhaseRowDom {
    // Name cell
    const nameCell = document.createElement('div');
    nameCell.className = 'hs-phase-name';
    nameCell.dataset.rowIndex = rowIndex.toString();
    const nameCountSpan = document.createElement('span');
    nameCountSpan.className = 'hs-phase-count';
    nameCountSpan.textContent = count ? `x${count} ` : '';
    const nameTextSpan = document.createElement('span');
    nameTextSpan.className = 'hs-phase-text';
    nameTextSpan.textContent = phaseName;
    nameCell.appendChild(nameCountSpan);
    nameCell.appendChild(nameTextSpan);

    // Stat cells
    const innerLoopsCell = document.createElement('div');
    innerLoopsCell.className = 'hs-phase-loops';
    innerLoopsCell.dataset.rowIndex = rowIndex.toString();

    const avgCell = document.createElement('div');
    avgCell.className = 'hs-phase-avg';
    avgCell.dataset.rowIndex = rowIndex.toString();

    const sdCell = document.createElement('div');
    sdCell.className = 'hs-phase-sd';
    sdCell.dataset.rowIndex = rowIndex.toString();

    const lastCell = document.createElement('div');
    lastCell.className = 'hs-phase-last';
    lastCell.dataset.rowIndex = rowIndex.toString();

    const cells = [nameCell, innerLoopsCell, avgCell, sdCell, lastCell];
    return { nameCell, nameCountSpan, nameTextSpan, innerLoopsCell, avgCell, sdCell, lastCell, cells, rowIndex };
}

/**
 * Updates a phase row DOM with new statistics and phase info.
 * @param dom The PhaseRowDom to update
 * @param stats Object with loopCount, avg, sd, last, phaseName, count
 */
export function updatePhaseRowDom(
    dom: PhaseRowDom,
    stats: { count?: number; phaseName?: string; innerLoopCount: number; avg: number; sd: number; last: number }
) {
    if (typeof stats.phaseName === 'string') dom.nameTextSpan.textContent = stats.phaseName;
    if (typeof stats.count === 'number') dom.nameCountSpan.textContent = `x${stats.count} `;
    // Loops: always show 2 decimals, prefix 'x'
    dom.innerLoopsCell.textContent = 'x' + stats.innerLoopCount.toFixed(2);
    // Avg: value with 2 decimals, suffix 's'
    dom.avgCell.textContent = stats.avg.toFixed(2) + 's';
    // SD: prefix with ± (U+00B1), 2 decimals
    dom.sdCell.textContent = '\u00B1' + stats.sd.toFixed(2);
    // Last: value with 2 decimals, suffix 's'
    dom.lastCell.textContent = stats.last.toFixed(2) + 's';
}

/**
 * Utility to compute phase statistics from a phaseHistory map.
 * @param phaseHistory Map of phase name to { count, totalTime, sumSq, lastTime, repeats }
 * @param phase The phase name to compute stats for
 * @returns Object with innerLoopCount, avg, sd, last values
 */
export function getPhaseStats(
    phaseHistory: Map<string, { count: number; totalTime: number; sumSq: number; lastTime: number; innerLoopCount: number }>,
    phase: string
) {
    const entry = phaseHistory.get(phase);
    if (!entry || entry.count === 0) return { innerLoopCount: 0, avg: 0, sd: 0, last: 0 };
    const innerLoopCount = entry.innerLoopCount;
    const avg = entry.totalTime / innerLoopCount;
    // Population standard deviation
    const sd = innerLoopCount > 1 ? Math.sqrt(entry.sumSq / innerLoopCount) : 0;
    const last = entry.lastTime;
    return { innerLoopCount, avg, sd, last };
}
