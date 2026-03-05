// HSAutosingExportManager.ts
// Handles export logic for autosing data (CSV, etc.)
// To be filled in next steps

import { decompressFromUTF16 } from 'lz-string';
import type { HSAutosingDB } from './hs-autosingDB';

interface SingularityBundle {
    singularityNumber: number;
    totalTime: number;
    quarksGained: number;
    goldenQuarksGained: number;
    phases: { [phaseName: string]: number };
    timestamp: number;
    c15?: string;
}

/**
 * Handles export logic for autosing data (CSV, etc.).
 * Encapsulates all export-related UI and data operations.
 */
export class HSAutosingExportManager {
    private db: HSAutosingDB;
    private getCompressedBundles: () => string[];
    private exportButton: HTMLButtonElement | null;
    private getAdvancedDataCollectionEnabled: () => boolean;
    private getSingularityBundlesCount: () => number;

    /**
     * Constructs a new export manager.
     * @param options - Dependency injection for DB, data accessors, and UI elements.
     */
    constructor(options: {
        db: HSAutosingDB,
        getCompressedBundles: () => string[],
        exportButton: HTMLButtonElement | null,
        getAdvancedDataCollectionEnabled: () => boolean,
        getSingularityBundlesCount: () => number
    }) {
        this.db = options.db;
        this.getCompressedBundles = options.getCompressedBundles;
        this.exportButton = options.exportButton;
        this.getAdvancedDataCollectionEnabled = options.getAdvancedDataCollectionEnabled;
        this.getSingularityBundlesCount = options.getSingularityBundlesCount;
    }

    /**
     * Updates the export button's state and text based on data availability and settings.
     * Disables or hides the button if export is not possible.
     */
    public updateExportButton(): void {
        if (!this.exportButton) return;
        const isEnabled = this.getAdvancedDataCollectionEnabled();
        const hasData = this.getCompressedBundles().length > 0;
        const visible = isEnabled;
        this.exportButton.style.display = visible ? 'block' : 'none';
        if (visible) {
            this.exportButton.disabled = !hasData;
            this.exportButton.style.opacity = hasData ? '1' : '0.5';
            this.exportButton.textContent = hasData
                ? `📊 Export Data (${this.getSingularityBundlesCount()} singularities)`
                : '📊 No Data to Export';
        }
    }

    /**
     * Exports all autosing data as a CSV file.
     * Flushes any remaining batch to the DB, decompresses all bundles, and triggers a download.
     * @param compressToUTF16 - Compression function for flushing batch.
     * @param decompressFromUTF16 - Decompression function for reading bundles.
     */
    public exportDataAsCSV(
        compressToUTF16: (input: string) => string,
        decompressFromUTF16: (input: string) => string
    ): void {
        if (!this.getAdvancedDataCollectionEnabled()) {
            alert('No data to export');
            return;
        }
        this.db.flushBatch(compressToUTF16).then(() => {
            const compressedBundles = this.getCompressedBundles();
            const localBundles: SingularityBundle[] = [];
            for (const compressed of compressedBundles) {
                const batch: SingularityBundle[] = JSON.parse(decompressFromUTF16(compressed));
                localBundles.push(...batch);
            }
            const allPhaseNames = new Set<string>();
            localBundles.forEach((bundle: SingularityBundle) => {
                Object.keys(bundle.phases).forEach((phase: string) => allPhaseNames.add(phase));
            });
            const sortedPhaseNames = Array.from(allPhaseNames).sort();
            const headers = [
                'Singularity Number',
                'Total Time (s)',
                'C15',
                'Quarks Gained',
                'Golden Quarks Gained',
                'Timestamp',
                ...sortedPhaseNames.map((phase: string) => `Phase: ${phase} (s)`)
            ];
            const rows = localBundles.map((bundle: SingularityBundle) => {
                const row = [
                    bundle.singularityNumber.toString(),
                    bundle.totalTime.toFixed(3),
                    bundle.c15 ?? '',
                    bundle.quarksGained.toExponential(6),
                    bundle.goldenQuarksGained.toExponential(6),
                    new Date(bundle.timestamp).toISOString(),
                    ...sortedPhaseNames.map((phase: string) => (bundle.phases[phase] || '').toString())
                ];
                return row.join(',');
            });
            const csv = [headers.join(','), ...rows].join('\n');
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
            link.setAttribute('href', url);
            link.setAttribute('download', `autosing_data_${timestamp}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }
}
