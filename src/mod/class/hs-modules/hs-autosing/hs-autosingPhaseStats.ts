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
 * Creates 5 cell divs for a phase row, with a data-row-index for identification.
 * @param phaseName
 * @param phaseCount
 * @param rowIndex
 */
export function createPhaseRowDom(phaseName = '', phaseCount = 0, rowIndex = 0): PhaseRowDom {
    const rowIndexStr = rowIndex.toString();

    // Name cell
    const nameCell = document.createElement('div');
    nameCell.className = 'hs-phase-name';
    nameCell.dataset.rowIndex = rowIndexStr;
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
    innerLoopsCell.dataset.rowIndex = rowIndexStr;

    const avgCell = document.createElement('div');
    avgCell.className = 'hs-phase-avg';
    avgCell.dataset.rowIndex = rowIndexStr;

    const sdCell = document.createElement('div');
    sdCell.className = 'hs-phase-sd';
    sdCell.dataset.rowIndex = rowIndexStr;

    const lastCell = document.createElement('div');
    lastCell.className = 'hs-phase-last';
    lastCell.dataset.rowIndex = rowIndexStr;

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
    // Pre-format all values, then only touch DOM if changed
    const countText = `x${stats.phaseCount} `;
    const loopsText = 'x' + stats.innerLoopCount.toFixed(2);
    const avgText = stats.avg.toFixed(2) + 's';
    const sdText = '\u00B1' + stats.sd.toFixed(2);
    const lastText = stats.last.toFixed(2) + 's';

    if (dom.phaseCountSpan.textContent !== countText) dom.phaseCountSpan.textContent = countText;
    if (dom.nameTextSpan.textContent !== stats.phaseName) dom.nameTextSpan.textContent = stats.phaseName;
    if (dom.innerLoopsCell.textContent !== loopsText) dom.innerLoopsCell.textContent = loopsText;
    if (dom.avgCell.textContent !== avgText) dom.avgCell.textContent = avgText;
    if (dom.sdCell.textContent !== sdText) dom.sdCell.textContent = sdText;
    if (dom.lastCell.textContent !== lastText) dom.lastCell.textContent = lastText;
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
