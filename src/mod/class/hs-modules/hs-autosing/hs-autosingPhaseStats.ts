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


/**
 * Interface for a phase row's DOM structure (extended for advanced caching and custom layouts).
 */
export interface PhaseRowDom {
    nameCell: HTMLDivElement;
    phaseCountSpan: HTMLSpanElement;
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
 * @param phaseCount
 * @param rowIndex
 */
export function createPhaseRowDom(phaseName = '', phaseCount = 0, rowIndex = 0): PhaseRowDom {
    // Name cell
    const nameCell = document.createElement('div');
    nameCell.className = 'hs-phase-name';
    nameCell.dataset.rowIndex = rowIndex.toString();
    const phaseCountSpan = document.createElement('span');
    phaseCountSpan.className = 'hs-phase-count';
    phaseCountSpan.textContent = phaseCount ? `x${phaseCount} ` : '';
    const nameTextSpan = document.createElement('span');
    nameTextSpan.className = 'hs-phase-text';
    nameTextSpan.textContent = phaseName;
    nameCell.appendChild(phaseCountSpan);
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
    return { nameCell, phaseCountSpan, nameTextSpan, innerLoopsCell, avgCell, sdCell, lastCell, cells, rowIndex };
}

/**
 * Updates a phase row DOM with new statistics and phase info.
 * @param dom The PhaseRowDom to update
 * @param stats Object with phaseCount, phaseName, innerLoopCount, avg, sd, last values to display
 */
export function updatePhaseRowDom(
    dom: PhaseRowDom,
    stats: { phaseCount?: number; phaseName: string; innerLoopCount: number; avg: number; sd: number; last: number }
) {
    // Phase count: value with 0 decimal, prefix 'x'
    dom.phaseCountSpan.textContent = `x${stats.phaseCount} `;
    dom.nameTextSpan.textContent = stats.phaseName;
    // Inner loops: always show 2 decimals, prefix 'x'
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
 * @param phaseHistory Map of phase name to { phaseCount, totalTime, sumSq, lastTime, innerLoopCount }
 * @param phase The phase name to compute stats for
 * @returns Object with phaseCount, innerLoopCount, avg, sd, last values
 */
export function getPhaseStats(
    phaseHistory: Map<string, { phaseCount: number; totalTime: number; sumSq: number; lastTime: number; innerLoopCount: number }>,
    phase: string
) {
    const entry = phaseHistory.get(phase);
    if (!entry || entry.phaseCount === 0) return { phaseCount: 0, innerLoopCount: 0, avg: 0, sd: 0, last: 0 };
    const phaseCount = entry.phaseCount;
    const innerLoopCount = entry.innerLoopCount;
    const avg = entry.totalTime / phaseCount;
    // Sample standard deviation
    let sd = 0;
    if (phaseCount > 1) {
        const variance = (entry.sumSq - phaseCount * avg * avg) / (phaseCount - 1);
        sd = Math.sqrt(Math.max(0, variance));
    }
    const last = entry.lastTime;
    return { phaseCount, innerLoopCount, avg, sd, last };
}
