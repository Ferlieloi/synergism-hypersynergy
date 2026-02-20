/**
 * HSAutosingTimerModal
 * Modal for autosing timer and quark/golden quark gain tracking.
 * Handles UI orchestration, DOM caching, batching updates, and chart/stat rendering.
 * Integrates modular helpers for phase stats, charting, and export.
 * Maintains unified metrics with running averages for time, quarks, and golden quarks.
 *
 * Author: XxmolkxX
 */
import { HSSettings } from "../../hs-core/settings/hs-settings";
import { HSModuleManager } from "../../hs-core/module/hs-module-manager";
import { HSGameDataAPI } from "../../hs-core/gds/hs-gamedata-api";
import { HSGlobal } from "../../hs-core/hs-global";
import { HSAutosingStrategy, phases } from "../../../types/module-types/hs-autosing-types";
import { HSAutosing } from "./hs-autosing";
import { HSAutosingDB } from './hs-autosingDB';
import { HSAutosingExportManager } from './hs-autosingExportManager';
import { createPhaseStatsHeader, createPhaseRowDom, updatePhaseRowDom, createPhaseEmptyNode, PhaseRowDom } from "./hs-autosingPhaseStats";
import { SparklineDom, buildSparklineDom, updateSparkline } from './hs-autosingSparkline';
import Decimal from "break_infinity.js";
import { formatNumber, formatNumberWithSign, formatDecimal, formatTime } from "./hs-autosingFormatUtils";
import {
    getAverageLast,
    getStandardDeviation,
    getQuarksPerSecond,
    getPhaseAverage,
    getPhaseStandardDeviation,
    getC15AverageLast,
    getC15StdLast,
    getLogC15Variance,
    getLogC15Std,
    getLogC15Mean
} from "./hs-autosingStatsUtils";
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';

interface SingularityBundle {
    singularityNumber: number;
    totalTime: number;
    quarksGained: number;
    goldenQuarksGained: number;
    phases: { [phaseName: string]: number };
    timestamp: number;
    c15?: string;
}

// =============================
// Class Properties and Fields
// =============================

export class HSAutosingTimerModal {
    // --- DOM Elements & UI State ---
    private timerDisplay: HTMLDivElement | null = null;
    private timerHeader: HTMLDivElement | null = null;
    private timerContent: HTMLDivElement | null = null;
    private dynamicContent: HTMLDivElement | null = null;
    private exportButton: HTMLButtonElement | null = null;
    private chartToggleBtn: HTMLButtonElement | null = null;
    private minimizeBtn!: HTMLButtonElement;
    private pauseBtn!: HTMLButtonElement;
    private stopButton!: HTMLButtonElement;
    private restartButton!: HTMLButtonElement;
    private finishStopBtn!: HTMLButtonElement;
    private isMinimized: boolean = false;
    private isPaused: boolean = false;
    private isDragging: boolean = false;
    private isResizing: boolean = false;
    private dragOffset = { x: 0, y: 0 };
    private resizeStart = { width: 0, height: 0, x: 0, y: 0 };
    private dragBounds = { width: 0, height: 0, maxX: 0, maxY: 0 };
    private staticDomInitialized: boolean = false;

    // --- Cached DOM Nodes ---
    private phaseNameSpan: HTMLElement | null = null;
    private footerSection: HTMLElement | null = null;
    private singValSpan: HTMLElement | null = null;
    private singTargetSpan: HTMLElement | null = null;
    private singHighestSpan: HTMLElement | null = null;
    private progressValSpan: HTMLElement | null = null;
    private c15TopSpan: HTMLElement | null = null;
    private c15SigmaSpan: HTMLElement | null = null;
    private quarksTotalSpan: HTMLElement | null = null;
    private quarksRateValSpan: HTMLElement | null = null;
    private quarksRateHrSpan: HTMLElement | null = null;
    private gquarksTotalSpan: HTMLElement | null = null;
    private gquarksRateValSpan: HTMLElement | null = null;
    private gquarksRateHrSpan: HTMLElement | null = null;
    private avg1Span: HTMLElement | null = null;
    private avg10Span: HTMLElement | null = null;
    private avg50Span: HTMLElement | null = null;
    private avgAllSpan: HTMLElement | null = null;
    private avgAllCountSpan: HTMLElement | null = null;
    private avg10LabelSpan: HTMLElement | null = null;
    private avg50LabelSpan: HTMLElement | null = null;
    private totalTimeSpan: HTMLElement | null = null;
    private maxTimeSpan: HTMLElement | null = null;
    private minTimeSpan: HTMLElement | null = null;
    private quarksTotalGainsSpan: HTMLElement | null = null;
    private quarksMaxGainsSpan: HTMLElement | null = null;
    private quarksMinGainsSpan: HTMLElement | null = null;
    private gquarksTotalGainsSpan: HTMLElement | null = null;
    private gquarksMaxGainsSpan: HTMLElement | null = null;
    private gquarksMinGainsSpan: HTMLElement | null = null;
    private phaseStatsContainer: HTMLElement | null = null;
    private sparklineQuarksContainer: HTMLElement | null = null;
    private sparklineGoldenQuarksContainer: HTMLElement | null = null;
    private sparklineTimeContainer: HTMLElement | null = null;
    private phaseHeaderNodes: HTMLDivElement[] = [];
    private avgSpanParts: Map<HTMLElement, { main: HTMLSpanElement; sd: HTMLSpanElement }> = new Map();

    // --- Data & State ---
    private db: HSAutosingDB;
    private exportManager: HSAutosingExportManager | null = null;
    private showDetailedData: boolean = true;
    private advancedDataCollectionEnabled: boolean = false;
    private strategy: any = null;
    private strategyName: string = '';
    private loadoutsOrder: string[] = [];
    private modVersion: string = '';
    private singTarget: number = 0;
    private singHighest: number = 0;
    private singularityCount: number = 0;
    private lastSingularityTimestamp: number = 0;
    private startTime: number = 0;
    private _currentPhaseName: string = '';
    private currentSingularityStart: number = 0;
    private currentPhaseStart: number = 0;
    private currentSingularityPhases: Map<string, number> = new Map();
    private lastRecordedPhaseName: string | null = null;
    private liveTimerInterval: number | null = null;
    private compressedBundles: string[] = [];
    private singularityBundles: (string | SingularityBundle)[] = [];

    // --- Charting & Stats ---
    private sparklineMaxPoints: number = 50;
    private phaseHistory: Map<string, {
        count: number;
        totalTime: number;
        sumSq: number;
        lastTime: number;
        repeats: number;
    }> = new Map();
    private c15Count: number = 0;
    private c15Mean: Decimal = new Decimal(0);
    private c15M2: Decimal = new Decimal(0);
    private logC15Count: number = 0;
    private logC15Mean: number = 0;
    private logC15M2: number = 0;
    private latestQuarksTotal: number = 0;
    private latestGoldenQuarksTotal: number = 0;
    private sparklineQuarks: SparklineDom | null = null;
    private sparklineGoldenQuarks: SparklineDom | null = null;
    private sparklineTimes: SparklineDom | null = null;
    // --- Footer DOM Spans (for version/strategy/loadouts info) ---
    private footerVersionSpan: HTMLElement | null = null;
    private footerStrategySpan: HTMLElement | null = null;
    private footerLoadoutsSpan: HTMLElement | null = null;

    // --- Mouse Event Handlers (for drag/resize) ---
    private onMouseMoveHandler = (e: MouseEvent) => this.onMouseMove(e);
    private onMouseUpHandler = () => this.onMouseUp();

    // --- Cached/Computed Data ---
    private cachedStrategyOrder: string[] = [];
    private cachedStrategyOrderIndex: Map<string, number> = new Map();
    private cachedGlobalPhaseIndex: Map<string, number> = new Map();

    // --- Render Batching & Change Tracking ---
    // These flags and version numbers ensure that expensive DOM updates only happen when needed.
    // This is critical for performance, especially with large or frequently updated tables.
    private renderPending: boolean = false;
    private renderGeneralPending: boolean = false;
    private renderPhasesPending: boolean = false;
    private renderSparklinesPending: boolean = false;
    private renderExportPending: boolean = false;
    private lastRenderedPhaseHistoryVersion: number = -1;
    private lastRenderedSparklineVersion: number = -1;
    private lastRenderedDetailsVisibilityVersion: number = -1;
    private phaseHistoryVersion: number = 0;
    private sparklineVersion: number = 0;
    private detailsVisibilityVersion: number = 0;

    // --- Sizing & Layout ---
    private autoResized: boolean = false;
    private computedMaxWidth: number | null = null; // px
    private computedMaxHeight: number | null = null; // px
    private computedGraphWidth: number | null = null; // px

    /**
     * Unified array for chart metrics: each entry represents a singularity event.
     * All chart/stat logic now unified on singularityMetrics.
     */
    private singularityMetrics: Array<{
        timestamp: number;
        duration: number;
        quarksGained: number;
        goldenQuarksGained: number;
        phases: Record<string, number>;
        c15?: string;
        runningAvgDuration: number;
        runningAvgQuarksPerSecond: number;
        runningAvgGoldenQuarksPerSecond: number;
    }> = [];


    // =============================
    // Constructor and Initialization
    // =============================

    constructor() {
        this.db = new HSAutosingDB('HSAutosingTimerDB', 'singularityBundles', 10);
        this.createTimerDisplay();
        this.setupDragAndResize();
        this.cachedGlobalPhaseIndex = new Map();
        phases.forEach((phase, i) => {
            this.cachedGlobalPhaseIndex.set(phase as unknown as string, i);
        });
    }

    /**
     * Creates and initializes the timer modal display, including header, content, and controls.
     * Caches DOM nodes for performance.
     */
    private createTimerDisplay(): void {
        this.timerDisplay = document.createElement('div');
        this.timerDisplay.id = 'hs-autosing-timer-display';
        this.timerDisplay.style.display = 'none';
        // Contain the modal to limit layout/paint impact on the rest of the document.
        // This helps isolate style/layout calculations from the page.
        // Note: supported in modern browsers.
        this.timerDisplay.style.contain = 'layout paint';

        /* ---------- HEADER ---------- */
        this.timerHeader = document.createElement('div');
        this.timerHeader.className = 'hs-timer-header';

        const title = document.createElement('span');
        title.textContent = '⏱️ Autosing';
        title.className = 'hs-timer-title';

        // PAUSE BUTTON
        this.pauseBtn = document.createElement('button');
        this.pauseBtn.id = 'hs-timer-ctrl-pause';
        this.pauseBtn.textContent = '⏸️';
        this.pauseBtn.title = "Pause Autosing";
        this.pauseBtn.className = 'hs-timer-ctrl-btn';
        this.pauseBtn.onclick = () => {
            this.isPaused = !this.isPaused;
            this.pauseBtn.textContent = this.isPaused ? '▶️' : '⏸️';
            this.pauseBtn.title = this.isPaused ? 'Resume Autosing' : 'Pause Autosing';
        };
        this.stopButton = document.createElement('button');
        this.stopButton.id = 'hs-timer-ctrl-stop';
        this.stopButton.textContent = '🔴';
        this.stopButton.title = "Stop Autosing NOW";
        this.stopButton.className = 'hs-timer-ctrl-btn';
        this.stopButton.onclick = () => {
            const toggle = document.getElementById('hs-setting-auto-sing-enabled');
            if (toggle) toggle.click();
        };

        this.restartButton = document.createElement('button');
        this.restartButton.id = 'hs-timer-ctrl-restart';
        this.restartButton.textContent = '🔄';
        this.restartButton.title = "Restart Singularity from the beginning";
        this.restartButton.className = 'hs-timer-ctrl-btn';
        this.restartButton.onclick = async () => {
            const autosingMod = HSModuleManager.getModule<HSAutosing>('HSAutosing');
            if (autosingMod) {
                // Stop autosing
                autosingMod.stopAutosing();
                // Wait a bit for cleanup
                await new Promise(resolve => setTimeout(resolve, 500));
                // Re-enable autosing (simulates starting from beginning)
                const toggle = document.getElementById('hs-setting-auto-sing-enabled');
                if (toggle) toggle.click();
            }
        };

        this.finishStopBtn = document.createElement('button');
        this.finishStopBtn.id = 'hs-timer-ctrl-finish-stop';
        this.finishStopBtn.textContent = '🟠';
        this.finishStopBtn.title = "Stop Autosing at the end of current Singularity";
        this.finishStopBtn.className = 'hs-timer-ctrl-btn';
        this.finishStopBtn.onclick = () => {
            const autosingMod = HSModuleManager.getModule<HSAutosing>('HSAutosing');
            if (autosingMod) {
                const newState = !autosingMod.isStopAtSingularitysEnd();
                autosingMod.setStopAtSingularitysEnd(newState);
                this.finishStopBtn.style.backgroundColor = newState ? '#ff9800' : '';
            }
        };

        this.chartToggleBtn = document.createElement('button');
        this.chartToggleBtn.id = 'hs-timer-ctrl-chart-toggle';
        this.chartToggleBtn.textContent = '📊';
        this.chartToggleBtn.title = "Toggle Detailed Data Visibility";
        this.chartToggleBtn.className = 'hs-timer-ctrl-btn hs-timer-ctrl-btn-secondary';
        this.chartToggleBtn.onclick = () => {
            this.showDetailedData = !this.showDetailedData;
            this.chartToggleBtn!.textContent = '📊'; // Revert to chart icon after toggle
            this.detailsVisibilityVersion++;

            // Sparklines render also handles detailed-only visibility toggles.
            this.requestRender({ sparklines: true, phases: this.showDetailedData });
        };

        this.chartToggleBtn.onmouseenter = () => {
            if (this.showDetailedData) {
                this.chartToggleBtn!.textContent = '✖️';
            }
        };

        this.chartToggleBtn.onmouseleave = () => {
            this.chartToggleBtn!.textContent = '📊';
        };

        this.minimizeBtn = document.createElement('button');
        this.minimizeBtn.id = 'hs-timer-ctrl-minimize';
        this.minimizeBtn.textContent = '−';
        this.minimizeBtn.title = "Minimize";
        this.minimizeBtn.className = 'hs-timer-ctrl-btn hs-timer-ctrl-btn-secondary';
        this.minimizeBtn.onclick = () => this.toggleMinimize();

        this.timerHeader.appendChild(title);
        this.timerHeader.appendChild(document.createElement('div')); // Spacer

        const controls = document.createElement('div');
        controls.className = 'hs-timer-controls';
        controls.appendChild(this.pauseBtn);
        controls.appendChild(this.restartButton);
        controls.appendChild(this.stopButton);
        controls.appendChild(this.finishStopBtn);
        controls.appendChild(this.chartToggleBtn);
        controls.appendChild(this.minimizeBtn);
        this.timerHeader.appendChild(controls);


        /* ---------- CONTENT ---------- */
        this.timerContent = document.createElement('div');
        this.timerContent.className = 'hs-timer-content';

        // Dynamic area (updated every tick)
        this.dynamicContent = document.createElement('div');
        this.dynamicContent.innerHTML = `
            <div class="hs-timer-section">
                <div class="hs-farming-grid">
                    <div class="hs-section-header-title">FARMING <span id="hs-sing-val">#0 / #0</span></div>
                    <div class="hs-value-cell hs-detailed-value"><span id="hs-c15-top" class="hs-c15-top"></span></div>
                    <div class="hs-label-cell"><span class="hs-timer-label">Completed:</span> <span id="hs-progress-val">0</span></div>
                    <div class="hs-value-cell hs-detailed-value"><span id="hs-c15-sigma"></span></div>
                </div>
                <div class="hs-info-line-phase"><span class="hs-timer-label">Phase:</span> <span id="hs-phase-name-val">&nbsp;</span> <span id="hs-phase-timer-val"></span></div>
            </div>

            <hr class="hs-timer-hr">

            <div class="hs-timer-section">
                <div class="hs-times-grid">
                    <div class="hs-section-header-title hs-section-header-title-full">TIMES</div>
                    <div class="hs-label-cell"><span class="hs-timer-label">Last 1:</span></div>
                    <div class="hs-value-cell"><span id="hs-avg-1">-</span></div>
                    <div class="hs-label-cell hs-detailed-cell"><span class="hs-timer-label hs-detailed-value">Total:</span></div>
                    <div class="hs-value-cell hs-detailed-cell"><span id="hs-total-time" class="hs-detailed-value">-</span></div>
                    <div class="hs-label-cell"><span id="hs-avg-10-lbl" class="hs-timer-label">Last 10:</span></div>
                    <div class="hs-value-cell"><span id="hs-avg-10">-</span></div>
                    <div class="hs-label-cell hs-detailed-cell"><span class="hs-timer-label hs-detailed-value">Max:</span></div>
                    <div class="hs-value-cell hs-detailed-cell"><span id="hs-max-time" class="hs-detailed-value">-</span></div>
                    <div class="hs-label-cell"><span id="hs-avg-50-lbl" class="hs-timer-label">Last 50:</span></div>
                    <div class="hs-value-cell"><span id="hs-avg-50">-</span></div>
                    <div class="hs-label-cell hs-detailed-cell"><span class="hs-timer-label hs-detailed-value">Min:</span></div>
                    <div class="hs-value-cell hs-detailed-cell"><span id="hs-min-time" class="hs-detailed-value">-</span></div>
                    <div class="hs-label-cell"><span id="hs-avg-all-lbl" class="hs-timer-label">All <span id="hs-avg-all-count">0</span>:</span></div>
                    <div class="hs-value-cell"><span id="hs-avg-all">-</span></div>
                    <div></div>
                    <div></div>
                </div>
                <div id="hs-sparkline-time-container" class="hs-sparkline-row"></div>
            </div>

            <hr class="hs-timer-hr">

            <div class="hs-timer-section">
                <div class="hs-section-grid">
                    <div class="hs-section-header-title-span2">QUARKS</div>
                    <div class="hs-label-cell hs-detailed-cell"><span class="hs-timer-label hs-detailed-value">Current:</span></div>
                    <div class="hs-value-cell hs-detailed-cell"><span class="hs-detailed-value" id="hs-quarks-total">0</span></div>
                    <div class="hs-label-cell"><span class="hs-timer-label">Rate:</span></div>
                    <div class="hs-value-cell"><span id="hs-quarks-rate-val" class="hs-quarks-rate-color">0/s</span> <span id="hs-quarks-rate-val-hr"> (0/hr)</span></div>
                    <div class="hs-label-cell hs-detailed-cell"><span class="hs-timer-label hs-detailed-value">Max:</span></div>
                    <div class="hs-value-cell hs-detailed-cell"><span id="hs-quarks-max-gains" class="hs-detailed-value">-</span></div>
                    <div class="hs-label-cell"><span class="hs-timer-label">Gained:</span></div>
                    <div class="hs-value-cell"><span id="hs-quarks-total-gains" class="hs-quarks-rate-color">-</span></div>
                    <div class="hs-label-cell hs-detailed-cell"><span class="hs-timer-label hs-detailed-value">Min:</span></div>
                    <div class="hs-value-cell hs-detailed-cell"><span id="hs-quarks-min-gains" class="hs-detailed-value">-</span></div>
                </div>
                <div id="hs-sparkline-quarks-container" class="hs-sparkline-row"></div>
            </div>

            <hr class="hs-timer-hr">

            <div class="hs-timer-section">
                <div class="hs-section-grid">
                    <div class="hs-section-header-title-span2">GOLDEN QUARKS</div>
                    <div class="hs-label-cell hs-detailed-cell"><span class="hs-timer-label hs-detailed-value">Current:</span></div>
                    <div class="hs-value-cell hs-detailed-cell"><span class="hs-detailed-value" id="hs-gquarks-total">0</span></div>
                    <div class="hs-label-cell"><span class="hs-timer-label">Rate:</span></div>
                    <div class="hs-value-cell"><span id="hs-gquarks-rate-val" class="hs-gquarks-rate-color">0/s</span> <span id="hs-gquarks-rate-val-hr"> (0/hr)</span></div>
                    <div class="hs-label-cell hs-detailed-cell"><span class="hs-timer-label hs-detailed-value">Max:</span></div>
                    <div class="hs-value-cell hs-detailed-cell"><span id="hs-gquarks-max-gains" class="hs-detailed-value">-</span></div>
                    <div class="hs-label-cell"><span class="hs-timer-label">Gained:</span></div>
                    <div class="hs-value-cell"><span id="hs-gquarks-total-gains" class="hs-gquarks-rate-color">-</span></div>
                    <div class="hs-label-cell hs-detailed-cell"><span class="hs-timer-label hs-detailed-value">Min:</span></div>
                    <div class="hs-value-cell hs-detailed-cell"><span id="hs-gquarks-min-gains" class="hs-detailed-value">-</span></div>
                </div>
                <div id="hs-sparkline-goldenquarks-container" class="hs-sparkline-row"></div>
            </div>

            <div id="hs-phase-stats-wrapper">
                <hr class="hs-timer-hr">
                <div id="hs-phase-stats-section" class="hs-timer-section">
                    <div id="hs-phase-stats-container" class="hs-stats-grid"></div>
                </div>
                <hr class="hs-timer-hr">
            </div>

            <div id="hs-footer-section" class="hs-footer-info hs-timer-section">
                <div class="hs-info-line-detailed"><span class="hs-timer-label">Module Version: v</span> <span id="hs-footer-version" class="hs-detailed-value"></span></div>
                <div class="hs-info-line-detailed"><span class="hs-timer-label">Active Strategy: </span> <span id="hs-footer-strategy" class="hs-detailed-value"></span></div>
                <div class="hs-info-line-detailed hs-footer-loadouts"><span class="hs-timer-label">Amb Loadouts Order: </span> <span id="hs-footer-loadouts" class="hs-detailed-value"></span></div>
            </div>
        `;
        this.timerContent.appendChild(this.dynamicContent);

        /* ---------- RESIZE HANDLE ---------- */
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'hs-resize-handle';
        resizeHandle.onmousedown = (e) => this.startResize(e);

        /* ---------- ASSEMBLE ---------- */
        this.timerDisplay.appendChild(this.timerHeader);
        this.timerDisplay.appendChild(this.timerContent);
        this.timerDisplay.appendChild(resizeHandle);
        document.body.appendChild(this.timerDisplay);

        // AFTER appending to body, find and cache elements
        this.phaseNameSpan = document.getElementById('hs-phase-name-val');
        this.footerSection = document.getElementById('hs-footer-section');
        this.singValSpan = document.getElementById('hs-sing-val');
        this.progressValSpan = document.getElementById('hs-progress-val');

        // Cache frequently updated nodes (avoid repeated getElementById during renders)
        this.quarksTotalSpan = document.getElementById('hs-quarks-total');
        this.quarksRateValSpan = document.getElementById('hs-quarks-rate-val');
        this.quarksRateHrSpan = document.getElementById('hs-quarks-rate-val-hr');
        this.gquarksTotalSpan = document.getElementById('hs-gquarks-total');
        this.gquarksRateValSpan = document.getElementById('hs-gquarks-rate-val');
        this.gquarksRateHrSpan = document.getElementById('hs-gquarks-rate-val-hr');

        this.avg1Span = document.getElementById('hs-avg-1');
        this.avg10Span = document.getElementById('hs-avg-10');
        this.avg50Span = document.getElementById('hs-avg-50');
        this.avgAllSpan = document.getElementById('hs-avg-all');
        this.avgAllCountSpan = document.getElementById('hs-avg-all-count');

        this.c15TopSpan = document.getElementById('hs-c15-top');
        this.c15SigmaSpan = document.getElementById('hs-c15-sigma');

        this.avg10LabelSpan = document.getElementById('hs-avg-10-lbl');
        this.avg50LabelSpan = document.getElementById('hs-avg-50-lbl');

        this.totalTimeSpan = document.getElementById('hs-total-time');
        this.maxTimeSpan = document.getElementById('hs-max-time');
        this.minTimeSpan = document.getElementById('hs-min-time');
        this.quarksTotalGainsSpan = document.getElementById('hs-quarks-total-gains');
        this.quarksMaxGainsSpan = document.getElementById('hs-quarks-max-gains');
        this.quarksMinGainsSpan = document.getElementById('hs-quarks-min-gains');
        this.gquarksTotalGainsSpan = document.getElementById('hs-gquarks-total-gains');
        this.gquarksMaxGainsSpan = document.getElementById('hs-gquarks-max-gains');
        this.gquarksMinGainsSpan = document.getElementById('hs-gquarks-min-gains');

        this.phaseStatsContainer = document.getElementById('hs-phase-stats-container');

        this.sparklineQuarksContainer = document.getElementById('hs-sparkline-quarks-container');
        this.sparklineGoldenQuarksContainer = document.getElementById('hs-sparkline-goldenquarks-container');
        this.sparklineTimeContainer = document.getElementById('hs-sparkline-time-container');

        // Cache footer value spans
        this.footerVersionSpan = document.getElementById('hs-footer-version');
        this.footerStrategySpan = document.getElementById('hs-footer-strategy');
        this.footerLoadoutsSpan = document.getElementById('hs-footer-loadouts');

        // Persistent export button
        this.exportButton = document.createElement('button');
        this.exportButton.id = 'hs-export-data-btn';
        this.exportButton.className = 'hs-export-btn';
        this.exportButton.style.display = 'none';
        this.exportButton.onclick = () => {
            if (this.exportManager) {
                this.exportManager.exportDataAsCSV(compressToUTF16, decompressFromUTF16);
            }
        };
        this.timerContent.appendChild(this.exportButton);

        // Initialize export manager after exportButton is created
        this.exportManager = new HSAutosingExportManager({
            db: this.db,
            getCompressedBundles: () => this.compressedBundles,
            exportButton: this.exportButton,
            getAdvancedDataCollectionEnabled: () => this.advancedDataCollectionEnabled,
            getSingularityBundlesCount: () => this.singularityBundles.length
        });

        // Build stable DOM for sections that will be updated frequently.
        this.ensureStaticDom();
    }

    private ensureStaticDom(): void {
        if (this.staticDomInitialized) return;
        this.staticDomInitialized = true;

        this.initSingularityHeaderDom();
        this.initAverageDom();
        this.initPhaseStatsDom();
        this.initSparklineDom();
    }

    private initSingularityHeaderDom(): void {
        if (!this.singValSpan) return;

        // Build the structure once: [S{target}] / [S{highest}]
        this.singValSpan.textContent = '';

        const target = document.createElement('span');
        target.id = 'hs-sing-target';

        const sep = document.createElement('span');
        sep.textContent = ' / ';
        sep.className = 'hs-sing-sep';

        const highest = document.createElement('span');
        highest.id = 'hs-sing-highest';

        this.singValSpan.appendChild(target);
        this.singValSpan.appendChild(sep);
        this.singValSpan.appendChild(highest);

        this.singTargetSpan = target;
        this.singHighestSpan = highest;
    }

    private initAverageDom(): void {
        // avg1 does not show sigma, keep as textContent
        this.ensureAvgSpanStructure(this.avg10Span);
        this.ensureAvgSpanStructure(this.avg50Span);
        this.ensureAvgSpanStructure(this.avgAllSpan);
    }

    private initPhaseStatsDom(): void {
        if (!this.phaseStatsContainer) return;
        this.phaseHeaderNodes = createPhaseStatsHeader();
        // Render initial empty grid
        const frag = document.createDocumentFragment();
        this.phaseHeaderNodes.forEach(n => frag.appendChild(n));
        this.phaseStatsContainer.replaceChildren(frag);
    }

    private initSparklineDom(): void {
        this.sparklineQuarks = buildSparklineDom(this.sparklineQuarksContainer, '#00BCD4', false);
        this.sparklineGoldenQuarks = buildSparklineDom(this.sparklineGoldenQuarksContainer, '#F1FA8C', false);
        this.sparklineTimes = buildSparklineDom(this.sparklineTimeContainer, '#FF8A80', true);
    }

    private ensureAvgSpanStructure(el: HTMLElement | null): { main: HTMLSpanElement; sd: HTMLSpanElement } | null {
        if (!el) return null;
        const cached = this.avgSpanParts.get(el);
        if (cached) return cached;

        el.textContent = '';
        const main = document.createElement('span');
        main.className = 'hs-avg-main';
        const sd = document.createElement('span');
        sd.className = 'hs-avg-sd';
        el.appendChild(main);
        el.appendChild(sd);

        const parts = { main, sd };
        this.avgSpanParts.set(el, parts);
        return parts;
    }

    private syncAdvancedDataCollectionEnabled(): void {
        const setting = HSSettings.getSetting('advancedDataCollection');
        const enabled = !!setting && setting.isEnabled();
        if (enabled === this.advancedDataCollectionEnabled) return;

        this.advancedDataCollectionEnabled = enabled;
    }


    // =============================
    // Modal Controls (Drag/Resize/Minimize)
    // =============================

    /**
     * Computes and applies auto width and height for the modal and chart containers.
     */
    private computeAndApplyAutoWidth(): void {
        if (!this.timerDisplay || this.autoResized) return;

        // Hard-coded defaults (adjust as desired)
        const FIXED_WIDTH = 400; // px
        const FIXED_HEIGHT = 650; // px

        // Sparkline SVG width: leave space for the label column on the right.
        // (Sparkline row is flex: [svg][labels])
        const FIXED_GRAPH_WIDTH = 400; // px
        const LABELS_ESTIMATE = 110; // px; right-side label column width (based on ~11 chars in a 9px monospaced font-size)

        // Respect viewport so the modal doesn't go off-screen by default.
        const appliedWidth = Math.max(260, Math.min(FIXED_WIDTH, window.innerWidth - 40));
        const appliedHeight = Math.max(240, Math.min(FIXED_HEIGHT, window.innerHeight - 40));

        this.computedMaxWidth = appliedWidth;
        this.computedMaxHeight = appliedHeight + 250;
        // Graph (SVG) width must fit inside the modal
        this.computedGraphWidth = Math.max(120, Math.min(FIXED_GRAPH_WIDTH, appliedWidth - LABELS_ESTIMATE));

        this.timerDisplay.style.width = 'auto';
        this.timerDisplay.style.height = 'auto';

        // Sparkline containers also use auto width to allow modal to auto-size
        if (this.sparklineQuarksContainer) {
            this.sparklineQuarksContainer.style.width = 'auto';
        }
        if (this.sparklineGoldenQuarksContainer) {
            this.sparklineGoldenQuarksContainer.style.width = 'auto';
        }
        if (this.sparklineTimeContainer) {
            this.sparklineTimeContainer.style.width = 'auto';
        }

        this.autoResized = true;
    }

    /**
     * Sets up drag and resize handlers for the modal.
     */
    private setupDragAndResize(): void {
        if (!this.timerHeader || !this.timerDisplay) return;

        // Dragging
        this.timerHeader.onmousedown = (e) => {
            if (e.target === this.timerHeader || (e.target as HTMLElement).tagName === 'SPAN') {
                this.startDrag(e);
            }
        };

        window.addEventListener('mousemove', this.onMouseMoveHandler);
        window.addEventListener('mouseup', this.onMouseUpHandler);
    }

    /**
     * Handles mouse move events for dragging and resizing.
     */
    private onMouseMove(e: MouseEvent): void {
        if (this.isDragging) {
            this.drag(e);
        } else if (this.isResizing) {
            this.resize(e);
        }
    }

    /**
     * Handles mouse up events to stop dragging or resizing.
     */
    private onMouseUp(): void {
        this.isDragging = false;
        this.isResizing = false;
    }

    /**
     * Starts dragging the modal.
     */
    private startDrag(e: MouseEvent): void {
        if (!this.timerDisplay) return;
        this.isDragging = true;
        const rect = this.timerDisplay.getBoundingClientRect();
        this.dragOffset.x = e.clientX - rect.left;
        this.dragOffset.y = e.clientY - rect.top;
        this.dragBounds.width = rect.width;
        this.dragBounds.height = rect.height;
        this.dragBounds.maxX = Math.max(0, window.innerWidth - rect.width);
        this.dragBounds.maxY = Math.max(0, window.innerHeight - rect.height);
    }

    /**
     * Updates modal position while dragging.
     */
    private drag(e: MouseEvent): void {
        if (!this.timerDisplay || !this.isDragging) return;

        const x = Math.min(Math.max(0, e.clientX - this.dragOffset.x), this.dragBounds.maxX);
        const y = Math.min(Math.max(0, e.clientY - this.dragOffset.y), this.dragBounds.maxY);

        this.timerDisplay.style.left = `${x}px`;
        this.timerDisplay.style.top = `${y}px`;
        this.timerDisplay.style.right = 'auto';
        this.timerDisplay.style.bottom = 'auto';
    }

    /**
     * Starts resizing the modal.
     */
    private startResize(e: MouseEvent): void {
        if (!this.timerDisplay) return;
        if (this.isMinimized) return;
        e.preventDefault();
        this.isResizing = true;
        const rect = this.timerDisplay.getBoundingClientRect();
        this.resizeStart = {
            width: rect.width,
            height: rect.height,
            x: e.clientX,
            y: e.clientY
        };
    }

    /**
     * Updates modal size while resizing.
     */
    private resize(e: MouseEvent): void {
        if (!this.timerDisplay || !this.isResizing) return;

        const deltaX = e.clientX - this.resizeStart.x;
        const deltaY = e.clientY - this.resizeStart.y;

        const newWidth = Math.max(200, this.resizeStart.width + deltaX);
        const newHeight = Math.max(100, this.resizeStart.height + deltaY);

        // Clamp width to computed max if present (locks max width)
        const maxW = this.computedMaxWidth || Infinity;
        const finalWidth = Math.min(newWidth, maxW);

        this.timerDisplay.style.width = `${finalWidth}px`;
        this.timerDisplay.style.height = `${newHeight}px`;
    }

    /**
     * Toggles modal minimize state.
     */
    private toggleMinimize(): void {
        if (!this.timerContent || !this.timerDisplay) return;

        this.isMinimized = !this.isMinimized;

        if (this.isMinimized) {
            // Lock width to current size before hiding content
            const currentWidth = this.timerDisplay.offsetWidth;
            this.timerDisplay.style.minWidth = `${currentWidth}px`;
            this.timerContent.style.display = 'none';
            this.timerDisplay.style.height = 'auto';
            if (this.stopButton) this.stopButton.style.display = 'none';
            if (this.finishStopBtn) this.finishStopBtn.style.display = 'none';
            if (this.chartToggleBtn) this.chartToggleBtn.style.display = 'none';
            // Removed unused: resizeHandleElem
            if (this.minimizeBtn) this.minimizeBtn.textContent = '+';
        } else {
            // Restore auto-sizing - recalculate dimensions for new content
            this.timerDisplay.style.minWidth = '';
            this.timerDisplay.style.width = 'auto';
            this.timerDisplay.style.height = 'auto';
            this.timerContent.style.display = 'block';
            if (this.stopButton) this.stopButton.style.display = 'block';
            if (this.finishStopBtn) this.finishStopBtn.style.display = 'block';
            if (this.chartToggleBtn) this.chartToggleBtn.style.display = 'block';
            // Removed unused: resizeHandleElem
            if (this.minimizeBtn) this.minimizeBtn.textContent = '−';
            this.updateDisplay();
        }
    }


    // =============================
    // Session/Timer Management
    // =============================

    /**
     * Starts the live timer for a new singularity.
     * Resets phase tracking and updates UI.
     */
    private startLiveTimer(): void {
        this.stopLiveTimer();
        this.currentSingularityStart = performance.now();
        this.currentPhaseStart = this.currentSingularityStart;
        this.currentSingularityPhases.clear();

        this.lastRecordedPhaseName = null;
        this._currentPhaseName = '';

        // Perform a single UI refresh so labels reflect the reset state.
        this.updateDisplay();
    }

    /**
     * Stops the live timer interval.
     */
    private stopLiveTimer(): void {
        if (this.liveTimerInterval !== null) {
            clearInterval(this.liveTimerInterval);
            this.liveTimerInterval = null;
        }
    }

    /**
     * Starts autosing session with given strategy and initial quark values.
     * Resets stats, phase history, and metrics.
     */
    public start(strategy: HSAutosingStrategy, initialQuarks: number = 0, initialGoldenQuarks: number = 0): void {
        this.singularityCount = 0;
        this.lastSingularityTimestamp = 0;
        // Legacy stat resets removed; all stats now handled by singularityMetrics
        // Legacy array/stat resets removed; handled by singularityMetrics
        this.startTime = performance.now();
        this.lastSingularityTimestamp = this.startTime;
        this.phaseHistory.clear();
        this.singularityBundles = [];

        // Reset C15 online stats
        this.c15Count = 0;
        this.c15Mean = new Decimal(0);
        this.c15M2 = new Decimal(0);

        // Reset log(C15) online stats
        this.logC15Count = 0;
        this.logC15Mean = 0;
        this.logC15M2 = 0;

        this.latestQuarksTotal = initialQuarks;
        this.latestGoldenQuarksTotal = initialGoldenQuarks;

        // Cache stats at start
        this.strategy = strategy;
        this.singTarget = this.getSingularityTarget();
        this.singHighest = this.getSingularityHighest();
        this.strategyName = this.getStrategyName();
        this.loadoutsOrder = this.getLoadoutsOrder();
        this.cachedStrategyOrder = this.strategy.strategy.map((p: { startPhase: string; endPhase: string }) => `${p.startPhase}-${p.endPhase}`);

        // Ensure AOAG appears before the final 'end' phase in the timer ordering.
        // Some phases are recorded using the human-friendly AOAG_PHASE_NAME (override),
        // so include that name in the cached order directly just before the phase that ends with 'end'.
        const AOAG_NAME = 'AOAG Unlocked Phase';

        const finalIdx = this.cachedStrategyOrder.findIndex(s => s.endsWith('-end'));
        if (finalIdx >= 0) {
            // Insert AOAG just before the final end-phase marker
            // But avoid duplicating if already present
            if (!this.cachedStrategyOrder.includes(AOAG_NAME)) {
                this.cachedStrategyOrder.splice(finalIdx, 0, AOAG_NAME);
            }
        } else {
            // No explicit end phase found; append AOAG at the end if not present
            if (!this.cachedStrategyOrder.includes(AOAG_NAME)) {
                this.cachedStrategyOrder.push(AOAG_NAME);
            }
        }

        this.cachedStrategyOrderIndex.clear();
        for (let i = 0; i < this.cachedStrategyOrder.length; i++) {
            this.cachedStrategyOrderIndex.set(this.cachedStrategyOrder[i], i);
        }
        this.modVersion = HSGlobal.General.currentModVersion;

        // Check advanced-data-collection once at autosing start (cached).
        this.advancedDataCollectionEnabled = !!HSSettings.getSetting('advancedDataCollection')?.isEnabled();
        if (this.advancedDataCollectionEnabled) {
            this.singularityBundles = [];
            this.compressedBundles = [];
            this.db.clearBundles().catch(console.error);
        } else {
            // Hybrid Minimal: no bundles stored
            this.singularityBundles = [];
            this.compressedBundles = [];
        }

        // Reset render versions so next render is a full refresh
        this.phaseHistoryVersion = 0;
        this.lastRenderedPhaseHistoryVersion = -1;
        this.sparklineVersion = 0;
        this.lastRenderedSparklineVersion = -1;
        this.detailsVisibilityVersion = 0;
        this.lastRenderedDetailsVisibilityVersion = -1;

        this.requestRender({ general: true, phases: true, sparklines: true, exportBtn: true });

        this.startLiveTimer();
    }

    /**
     * Records the completion of a phase, updating phase history and current singularity tracking.
     */
    public async recordPhase(phase: string): Promise<void> {
        const now = performance.now();
        const phaseDuration = (now - this.currentPhaseStart) / 1000;

        // MERGE LOGIC: Check if we are repeating the same phase
        if (phase === this.lastRecordedPhaseName) {

            // 1. Update Global History (extend the last entry)
            if (this.phaseHistory.has(phase)) {
                const phaseData = this.phaseHistory.get(phase)!;
                if (phaseData.count > 0) {
                    // Add the new duration chunk to the existing chunk
                    const prev = phaseData.lastTime;
                    const next = prev + phaseDuration;

                    // Update stats
                    phaseData.totalTime += phaseDuration;
                    phaseData.sumSq += (next * next) - (prev * prev);
                    phaseData.lastTime = next; // Update lastTime to reflect total merged time
                    phaseData.repeats++; // Increment repeat count for this sequence
                }
            }

            // 2. Update Current Singularity Tracking
            const currentVal = this.currentSingularityPhases.get(phase) || 0;
            this.currentSingularityPhases.set(phase, currentVal + phaseDuration);

        } else {
            // STANDARD LOGIC: New Phase
            if (!this.phaseHistory.has(phase)) {
                this.phaseHistory.set(phase, { count: 0, totalTime: 0, sumSq: 0, lastTime: 0, repeats: 0 });
            }

            const phaseData = this.phaseHistory.get(phase)!;
            phaseData.count += 1;
            phaseData.totalTime += phaseDuration; // Accumulate duration
            phaseData.sumSq += phaseDuration * phaseDuration;
            phaseData.lastTime = phaseDuration;

            // Store phase time for current singularity
            this.currentSingularityPhases.set(phase, phaseDuration);

            this.lastRecordedPhaseName = phase;
        }

        // Prepare for next phase
        this.currentPhaseStart = now;

        // Phase stats are the only section that changes per phase.
        this.phaseHistoryVersion++;
        if (this.showDetailedData) {
            this.requestRender({ phases: true });
        }
    }

    /**
     * Records the completion of a singularity, updating metrics and stats.
     * Stores running averages for duration, quarks, and golden quarks.
     */
    public recordSingularity(gainedGoldenQuarks: number, currentGoldenQuarks: number, gainedQuarks: number, currentQuarks: number, c15Score?: Decimal): void {
        console.log('[hs-autosingTimerModal] recordSingularity called', {
            gainedGoldenQuarks,
            currentGoldenQuarks,
            gainedQuarks,
            currentQuarks,
            c15Score,
            lastSingularityTimestamp: this.lastSingularityTimestamp,
            singularityCount: this.singularityCount,
            advancedDataCollectionEnabled: this.advancedDataCollectionEnabled
        });
        // Log argument validity
        const argValidity = {
            gainedGoldenQuarks: typeof gainedGoldenQuarks === 'number' && !isNaN(gainedGoldenQuarks),
            currentGoldenQuarks: typeof currentGoldenQuarks === 'number' && !isNaN(currentGoldenQuarks),
            gainedQuarks: typeof gainedQuarks === 'number' && !isNaN(gainedQuarks),
            currentQuarks: typeof currentQuarks === 'number' && !isNaN(currentQuarks),
            c15Score: c15Score !== undefined
        };
        console.log('[hs-autosingTimerModal] recordSingularity argument validity', argValidity);

        const now = performance.now();
        const singularityDuration = (now - this.lastSingularityTimestamp) / 1000;
        this.lastSingularityTimestamp = now;
        this.singularityCount += 1;

        this.latestGoldenQuarksTotal = currentGoldenQuarks;

        // Handle quarks exactly like golden quarks: use passed totals/gains.
        const realQuarksGain = gainedQuarks;
        this.latestQuarksTotal = currentQuarks;
        // Log before and after adding metric
        console.log('[hs-autosingTimerModal] addSingularityMetric BEFORE', this.singularityMetrics);        
        // Add to unified metrics array for charts
        this.addSingularityMetric(

            singularityDuration,
            realQuarksGain,
            gainedGoldenQuarks,
            currentQuarks,
            currentGoldenQuarks,
            new Map(this.currentSingularityPhases),
            c15Score
        );
        console.log('[hs-autosingTimerModal] addSingularityMetric AFTER', this.singularityMetrics);

        // Advanced data collection
        if (this.advancedDataCollectionEnabled) {
            const bundle: SingularityBundle = {
                singularityNumber: this.singularityCount,
                totalTime: singularityDuration,
                quarksGained: realQuarksGain,
                goldenQuarksGained: gainedGoldenQuarks,
                phases: Object.fromEntries(this.currentSingularityPhases),
                timestamp: Date.now()
            };
            if (c15Score !== undefined) {
                bundle.c15 = c15Score.toString();
            }
            this.singularityBundles.push(bundle);
            this.db.addBundle(bundle, compressToUTF16).catch(console.error);
        }

        // Store c15 into history if provided (store Decimal for accurate statistics)
        if (c15Score !== undefined) {
            // Update C15 online stats (Decimal Welford)
            const dec = new Decimal(c15Score);
            const k = this.c15Count + 1;
            const delta = dec.minus(this.c15Mean);
            this.c15Mean = this.c15Mean.plus(delta.div(k));
            const delta2 = dec.minus(this.c15Mean);
            this.c15M2 = this.c15M2.plus(delta.times(delta2));
            this.c15Count = k;

            // Update online stats for log(C15) using Welford's algorithm (natural log)
            try {
                const asNumber = Number(dec);
                if (!Number.isNaN(asNumber) && asNumber > 0) {
                    const logVal = Math.log(asNumber);
                    const k = this.logC15Count + 1;
                    const delta = logVal - this.logC15Mean;
                    this.logC15Mean += delta / k;
                    this.logC15M2 += delta * (logVal - this.logC15Mean);
                    this.logC15Count = k;
                }
            } catch (e) {
                // If conversion/logging fails, skip updating online stats but keep the Decimal history
            }
        }

        // New singularity affects general stats + charts.
        this.sparklineVersion++;

        // Reset phase tracking for new singularity
        this.startLiveTimer();

        this.requestRender({ general: true, sparklines: true, exportBtn: true });
    }


    // =============================
    // Data/Stat Management
    // =============================

    /**
     * Adds a new entry to singularityMetrics for unified chart/stat logic.
     */
    private addSingularityMetric(
        singularityDuration: number,
        realQuarksGain: number,
        gainedGoldenQuarks: number,
        currentQuarks: number,
        currentGoldenQuarks: number,
        phases: Map<string, number>,
        c15Score?: Decimal
    ): void {
        // Validate all arguments
        const validity = {
            singularityDuration: typeof singularityDuration === 'number' && !isNaN(singularityDuration),
            realQuarksGain: typeof realQuarksGain === 'number' && !isNaN(realQuarksGain),
            gainedGoldenQuarks: typeof gainedGoldenQuarks === 'number' && !isNaN(gainedGoldenQuarks),
            currentQuarks: typeof currentQuarks === 'number' && !isNaN(currentQuarks),
            currentGoldenQuarks: typeof currentGoldenQuarks === 'number' && !isNaN(currentGoldenQuarks),
            phases: phases instanceof Map,
            c15Score: c15Score === undefined || typeof c15Score === 'object'
        };
        console.log('[hs-autosingTimerModal] addSingularityMetric argument validity', validity);
        if (!validity.singularityDuration || !validity.realQuarksGain || !validity.gainedGoldenQuarks || !validity.currentQuarks || !validity.currentGoldenQuarks) {
            console.error('[hs-autosingTimerModal] addSingularityMetric: Invalid metric arguments', {
                singularityDuration,
                realQuarksGain,
                gainedGoldenQuarks,
                currentQuarks,
                currentGoldenQuarks,
                phases,
                c15Score
            });
        }
        // Compute running averages up to this point (including this entry)
        let runningAvgDuration = singularityDuration;
        let runningAvgQuarksPerSecond = singularityDuration > 0 ? realQuarksGain / singularityDuration : 0;
        let runningAvgGoldenQuarksPerSecond = singularityDuration > 0 ? gainedGoldenQuarks / singularityDuration : 0;
        if (this.singularityMetrics.length > 0) {
            const prevSumDuration = this.singularityMetrics.reduce((acc, m) => acc + m.duration, 0);
            const prevSumQuarks = this.singularityMetrics.reduce((acc, m) => acc + m.quarksGained, 0);
            const prevSumGoldenQuarks = this.singularityMetrics.reduce((acc, m) => acc + m.goldenQuarksGained, 0);
            const n = this.singularityMetrics.length + 1;
            runningAvgDuration = (prevSumDuration + singularityDuration) / n;
            const totalQuarks = prevSumQuarks + realQuarksGain;
            const totalGoldenQuarks = prevSumGoldenQuarks + gainedGoldenQuarks;
            const totalDuration = prevSumDuration + singularityDuration;
            runningAvgQuarksPerSecond = totalDuration > 0 ? totalQuarks / totalDuration : 0;
            runningAvgGoldenQuarksPerSecond = totalDuration > 0 ? totalGoldenQuarks / totalDuration : 0;
        }
        const metric = {
            timestamp: performance.now(),
            duration: singularityDuration,
            quarksGained: realQuarksGain,
            goldenQuarksGained: gainedGoldenQuarks,
            phases: Object.fromEntries(phases),
            c15: c15Score ? c15Score.toString() : undefined,
            runningAvgDuration,
            runningAvgQuarksPerSecond,
            runningAvgGoldenQuarksPerSecond
        };
        console.log('[hs-autosingTimerModal] addSingularityMetric PUSH', metric);
        this.singularityMetrics.push(metric);
        // Optionally: prune to max points for charting
        if (this.singularityMetrics.length > this.sparklineMaxPoints) {
            this.singularityMetrics.shift();
        }
    }


    // =============================
    // State Accessors
    // =============================

    /**
     * Returns the name of the current phase.
     */
    public getCurrentPhase(): string {
        return this._currentPhaseName;
    }

    /**
     * Returns true if autosing is currently paused.
     */
    public getIsPaused(): boolean {
        return this.isPaused;
    }

    private getSingularityCount(): number {
        return this.singularityCount;
    }

    private getSingularityTarget(): number {
        return Number(HSSettings.getSetting('singularityNumber').getValue()) || 0;
    }

    /**
     * Returns the highest singularity count from game data.
     */
    private getSingularityHighest(): number {
        const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        const gameData = gameDataAPI?.getGameData();
        return gameData?.highestSingularityCount ?? 0;
    }

    /**
     * Returns the name of the current autosing strategy.
     */
    private getStrategyName(): string {
        const setting = HSSettings.getSetting('autosingStrategy');
        const value = setting.getValue();
        const definition = setting.getDefinition();
        const option = definition.settingControl?.selectOptions?.find(opt => String(opt.value) === String(value));

        return option ? option.text : String(value || 'None');
    }

    /**
     * Returns the order of ambrosia loadouts for the session.
     */
    private getLoadoutsOrder(): string[] {
        return [
            String(HSSettings.getSetting('autosingEarlyCubeLoadout').getValue()).replace('Loadout ', ''),
            String(HSSettings.getSetting('autosingLateCubeLoadout').getValue()).replace('Loadout ', ''),
            String(HSSettings.getSetting('autosingQuarkLoadout').getValue()).replace('Loadout ', ''),
            String(HSSettings.getSetting('autosingObtLoadout').getValue()).replace('Loadout ', ''),
            String(HSSettings.getSetting('autosingOffLoadout').getValue()).replace('Loadout ', ''),
            String(HSSettings.getSetting('autosingAmbrosiaLoadout').getValue()).replace('Loadout ', '')
        ];
    }

    /**
     * Returns the duration of the last singularity.
     */
    private getLastDuration(): number | null {
        // Return the duration of the last entry in singularityMetrics
        if (this.singularityMetrics.length === 0) return null;
        return this.singularityMetrics[this.singularityMetrics.length - 1].duration;
    }

    /**
     * Returns the average duration of the last n singularities.
     */
    private getAverageLast(n: number): number | null {
        // Legacy durationsPrefixSum logic removed; use singularityMetrics for averages.
        const arr = this.singularityMetrics;
        if (n <= 0 || arr.length < n) return null;
        const sum = arr.slice(-n).reduce((acc, m) => acc + m.duration, 0);
        return sum / n;
    }

    /**
     * Returns the average quarks (or golden quarks) per second for all recorded singularities.
     */
    private getQuarksPerSecond(isGolden: boolean): number | null {
        // Use singularityMetrics for rate calculation
        const arr = this.singularityMetrics;
        if (arr.length === 0) return null;
        let total = 0, totalTime = 0;
        for (const m of arr) {
            if (isGolden) {
                total += m.goldenQuarksGained;
            } else {
                total += m.quarksGained;
            }
            totalTime += m.duration;
        }
        if (totalTime <= 0) return null;
        return total / totalTime;
    }

    /**
     * Return population variance of ln(C15) using incremental Welford stats.
     * O(1) time.
     */
    public getLogC15Variance(): number | null {
        if (this.logC15Count === 0) return null;
        return this.logC15M2 / this.logC15Count;
    }

    /**
     * Return population standard deviation of ln(C15).
     */
    public getLogC15Std(): number | null {
        const v = this.getLogC15Variance();
        return v === null ? null : Math.sqrt(v);
    }

    /**
     * Return mean of ln(C15).
     */
    public getLogC15Mean(): number | null {
        return this.logC15Count === 0 ? null : this.logC15Mean;
    }


    // =============================
    // Render Methods
    // =============================

    private requestRender(opts: { general?: boolean; phases?: boolean; sparklines?: boolean; exportBtn?: boolean } = {}): void {
        if (opts.general) this.renderGeneralPending = true;
        if (opts.phases) this.renderPhasesPending = true;
        if (opts.sparklines) this.renderSparklinesPending = true;
        if (opts.exportBtn) this.renderExportPending = true;

        if (this.renderPending) return;
        this.renderPending = true;

        window.requestAnimationFrame(() => {
            this.renderPending = false;
            this.flushRender();
        });
    }

    private flushRender(): void {
        if (!this.timerContent || !this.timerDisplay) {
            this.renderGeneralPending = false;
            this.renderPhasesPending = false;
            this.renderSparklinesPending = false;
            this.renderExportPending = false;
            return;
        }
        if (this.timerDisplay.style.display === 'none' || this.isMinimized) {
            // UI is hidden; skip DOM work. Next explicit show/unminimize will request a full render.
            this.renderGeneralPending = false;
            this.renderPhasesPending = false;
            this.renderSparklinesPending = false;
            this.renderExportPending = false;
            return;
        }

        if (this.renderGeneralPending) {
            this.renderGeneralStats();
        }
        if (this.renderPhasesPending) {
            // Avoid rebuilding the phase table if nothing changed.
            if (this.phaseHistoryVersion !== this.lastRenderedPhaseHistoryVersion) {
                this.renderPhaseStatistics();
                this.lastRenderedPhaseHistoryVersion = this.phaseHistoryVersion;
            }
        }
        if (this.renderSparklinesPending) {
            const needsSparklineRender =
                this.sparklineVersion !== this.lastRenderedSparklineVersion ||
                this.detailsVisibilityVersion !== this.lastRenderedDetailsVisibilityVersion;

            if (needsSparklineRender) {
                this.renderSparklines();
                this.lastRenderedSparklineVersion = this.sparklineVersion;
                this.lastRenderedDetailsVisibilityVersion = this.detailsVisibilityVersion;
            }
        }
        if (this.renderExportPending) {
            this.updateExportButton();
        }

        this.renderGeneralPending = false;
        this.renderPhasesPending = false;
        this.renderSparklinesPending = false;
        this.renderExportPending = false;
    }

    private updateDisplay(): void {
        this.requestRender({ general: true, phases: this.showDetailedData, sparklines: true, exportBtn: true });
    }

    // Small utility helpers lifted out of render loops to avoid per-render allocations.
    private setTextEl(el: HTMLElement | null, text: string): void {
        if (!el) return;
        if (el.textContent !== text) el.textContent = text;
    }

    private setAvgEl(el: HTMLElement | null, val: number | null, sd: number | null): void {
        if (!el) return;
        const parts = this.ensureAvgSpanStructure(el);
        if (!parts) return;

        if (val === null) {
            if (parts.main.textContent !== '-') parts.main.textContent = '-';
            if (parts.sd.textContent !== '') parts.sd.textContent = '';
            return;
        }

        const mainText = `${val.toFixed(2)}s`;
        const sdText = sd !== null ? ` (σ ±${sd.toFixed(2)}s)` : '';
        if (parts.main.textContent !== mainText) parts.main.textContent = mainText;
        if (parts.sd.textContent !== sdText) parts.sd.textContent = sdText;
    }


    private renderGeneralStats(): void {
        // Update footer values
        this.setTextEl(this.footerVersionSpan, this.modVersion);
        this.setTextEl(this.footerStrategySpan, this.strategyName);
        this.setTextEl(this.footerLoadoutsSpan, this.loadoutsOrder.join(', '));
        const count = this.getSingularityCount();
        const currentQuarks = this.latestQuarksTotal;

        const currentGoldenQuarks = this.latestGoldenQuarksTotal;

        // 1. Singularity & Progress
        const target = this.getSingularityTarget();
        if (target !== this.singTarget) {
            this.singTarget = target;
        }
        const highest = this.getSingularityHighest();
        if (highest !== this.singHighest) {
            this.singHighest = highest;
        }
        this.setTextEl(this.singTargetSpan, `S${this.singTarget}`);
        this.setTextEl(this.singHighestSpan, `S${this.singHighest}`);
        this.setTextEl(this.progressValSpan, count.toString());

        // 2. Quarks
        this.setTextEl(this.quarksTotalSpan, formatNumber(currentQuarks));

        const quarksPerSec = getQuarksPerSecond(this.singularityMetrics, false);
        if (quarksPerSec !== null) {
            this.setTextEl(this.quarksRateValSpan, `${formatNumber(quarksPerSec)}/s`);
            this.setTextEl(this.quarksRateHrSpan, `(${formatNumber(quarksPerSec * 3600)}/hr)`);
        } else {
            this.setTextEl(this.quarksRateValSpan, `0/s`);
            this.setTextEl(this.quarksRateHrSpan, `(0/hr)`);
        }

        // 3. Golden Quarks
        this.setTextEl(this.gquarksTotalSpan, formatNumber(currentGoldenQuarks));

        const goldenQuarksPerSec = getQuarksPerSecond(this.singularityMetrics, true);
        if (goldenQuarksPerSec !== null) {
            this.setTextEl(this.gquarksRateValSpan, `${formatNumber(goldenQuarksPerSec)}/s`);
            this.setTextEl(this.gquarksRateHrSpan, `(${formatNumber(goldenQuarksPerSec * 3600)}/hr)`);
        } else {
            this.setTextEl(this.gquarksRateValSpan, `0/s`);
            this.setTextEl(this.gquarksRateHrSpan, `(0/hr)`);
        }

        // 4. Averages
        const avg1 = this.getLastDuration();
        const avg10 = getAverageLast(this.singularityMetrics, 10);
        const avg50 = getAverageLast(this.singularityMetrics, 50);
        const avgAll = getAverageLast(this.singularityMetrics, count);

        const sd10 = getStandardDeviation(this.singularityMetrics, 10);
        const sd50 = getStandardDeviation(this.singularityMetrics, 50);
        const sdAll = getStandardDeviation(this.singularityMetrics, count);

        this.setTextEl(this.avg1Span, avg1 !== null ? `${avg1.toFixed(2)}s` : '-');
        this.setAvgEl(this.avg10Span, avg10, sd10);
        this.setAvgEl(this.avg50Span, avg50, sd50);
        this.setTextEl(this.avgAllCountSpan, count.toString());
        this.setAvgEl(this.avgAllSpan, avgAll, sdAll);

        // Total, Max, Min Times (all-time)
        // Legacy allTimeCumulativeDuration/max/min logic removed; handled by singularityMetrics.
        const arr = this.singularityMetrics;
        const totalTime = arr.reduce((sum, m) => sum + m.duration, 0);
        const maxTime = arr.length > 0 ? Math.max(...arr.map(m => m.duration)) : null;
        const minTime = arr.length > 0 ? Math.min(...arr.map(m => m.duration)) : null;
        this.setTextEl(this.totalTimeSpan, totalTime > 0 ? formatTime(totalTime) : '-');
        this.setTextEl(this.maxTimeSpan, maxTime !== null && maxTime !== 0 ? `${maxTime.toFixed(2)}s` : '-');
        this.setTextEl(this.minTimeSpan, minTime !== null && minTime !== Infinity ? `${minTime.toFixed(2)}s` : '-');

        // C15 display: show average and std of log(C15) (inline)
        if (this.c15TopSpan && this.c15SigmaSpan) {
            const avgC15 = getC15AverageLast(this.c15Count, this.c15Mean, count);
            const sdLogC15 = getLogC15Std(this.logC15Count, this.logC15M2);
            const valText = avgC15 ? formatDecimal(avgC15) : '-';
            const sdText = sdLogC15 !== null ? `(σlog ±${sdLogC15.toFixed(3)})` : '';
            this.setTextEl(this.c15TopSpan, `C15 ${valText}`);
            this.setTextEl(this.c15SigmaSpan, sdText);
            this.c15TopSpan.title = '';
        }

        // Quarks Gains (all-time, from singularityMetrics)
        const metrics = this.singularityMetrics;
        const totalQuarksGains = metrics.reduce((sum, m) => sum + m.quarksGained, 0);
        const maxQuarksGains = metrics.length > 0 ? Math.max(...metrics.map(m => m.quarksGained)) : null;
        const minQuarksGains = metrics.length > 0 ? Math.min(...metrics.map(m => m.quarksGained)) : null;
        this.setTextEl(this.quarksTotalGainsSpan, totalQuarksGains > 0 ? formatNumber(totalQuarksGains) : '-');
        this.setTextEl(this.quarksMaxGainsSpan, maxQuarksGains !== null && maxQuarksGains !== 0 ? formatNumber(maxQuarksGains) : '-');
        this.setTextEl(this.quarksMinGainsSpan, minQuarksGains !== null && minQuarksGains !== Infinity ? formatNumber(minQuarksGains) : '-');

        // Golden Quarks Gains (all-time, from singularityMetrics)
        const totalGQuarksGains = metrics.reduce((sum, m) => sum + m.goldenQuarksGained, 0);
        const maxGQuarksGains = metrics.length > 0 ? Math.max(...metrics.map(m => m.goldenQuarksGained)) : null;
        const minGQuarksGains = metrics.length > 0 ? Math.min(...metrics.map(m => m.goldenQuarksGained)) : null;
        this.setTextEl(this.gquarksTotalGainsSpan, totalGQuarksGains > 0 ? formatNumber(totalGQuarksGains) : '-');
        this.setTextEl(this.gquarksMaxGainsSpan, maxGQuarksGains !== null && maxGQuarksGains !== 0 ? formatNumber(maxGQuarksGains) : '-');
        this.setTextEl(this.gquarksMinGainsSpan, minGQuarksGains !== null && minGQuarksGains !== Infinity ? formatNumber(minGQuarksGains) : '-');
    }

    private renderPhaseStatistics(): void {
        const phaseContainer = this.phaseStatsContainer;
        if (!phaseContainer) return;
        this.ensureStaticDom();
        const sortedPhases = Array.from(this.phaseHistory.entries())
            .sort((a, b) => {
                const idxA = this.cachedStrategyOrderIndex.get(a[0]);
                const idxB = this.cachedStrategyOrderIndex.get(b[0]);
                if (idxA !== undefined && idxB !== undefined) return idxA - idxB;
                if (idxA !== undefined) return -1;
                if (idxB !== undefined) return 1;
                const globalIdxA = this.cachedGlobalPhaseIndex.get(a[0]) ?? 999;
                const globalIdxB = this.cachedGlobalPhaseIndex.get(b[0]) ?? 999;
                return globalIdxA - globalIdxB;
            });
        const orderedRows: ReturnType<typeof createPhaseRowDom>[] = [];
        for (const [phaseName, data] of sortedPhases) {
            if (data.count <= 0) continue;
            let row = createPhaseRowDom();
            updatePhaseRowDom(row, {
                loopCount: 1 + (data.repeats / data.count),
                avg: getPhaseAverage(this.phaseHistory, phaseName) ?? 0,
                sd: getPhaseStandardDeviation(this.phaseHistory, phaseName) ?? 0,
                last: data.lastTime
            });
            if ((row as any).nameTextSpan) (row as any).nameTextSpan.textContent = phaseName;
            if ((row as any).nameCountSpan) (row as any).nameCountSpan.textContent = `x${data.count} `;
            orderedRows.push(row);
        }
        const frag = document.createDocumentFragment();
        this.phaseHeaderNodes.forEach(n => frag.appendChild(n));
        for (const row of orderedRows) {
            if ('cells' in row && Array.isArray(row.cells)) {
                row.cells.forEach(cell => frag.appendChild(cell));
            } else if ('row' in row && row.row instanceof HTMLElement) {
                frag.appendChild(row.row);
            }
        }
        phaseContainer.replaceChildren(frag);
    }

    private renderSparklines(): void {
        /**
         * Sparkline chart interface update:
         * - Modal passes full metrics array and sparklineMaxPoints to chart module.
         * - Chart module slices internally for display and label stats.
         * - See hs-sparkline.ts for details.
         */
        this.ensureStaticDom();

        // Use unified metrics array for all charts
        updateSparkline(this.sparklineQuarks, this.singularityMetrics, this.computedGraphWidth, formatNumberWithSign, this.sparklineMaxPoints);
        updateSparkline(this.sparklineGoldenQuarks, this.singularityMetrics, this.computedGraphWidth, formatNumberWithSign, this.sparklineMaxPoints);
        updateSparkline(this.sparklineTimes, this.singularityMetrics, this.computedGraphWidth, formatNumberWithSign, this.sparklineMaxPoints);
        // Update averages using unified metrics
        // Use stateless helpers for averages and stddevs
        this.setAvgEl(this.avg1Span, getAverageLast(this.singularityMetrics, 1), getStandardDeviation(this.singularityMetrics, 1));
        this.setAvgEl(this.avg10Span, getAverageLast(this.singularityMetrics, 10), getStandardDeviation(this.singularityMetrics, 10));
        this.setAvgEl(this.avg50Span, getAverageLast(this.singularityMetrics, 50), getStandardDeviation(this.singularityMetrics, 50));
        this.setAvgEl(this.avgAllSpan, getAverageLast(this.singularityMetrics, this.singularityMetrics.length), getStandardDeviation(this.singularityMetrics, this.singularityMetrics.length));
        if (this.avgAllCountSpan) this.avgAllCountSpan.textContent = String(this.singularityMetrics.length);
    }

    private updateExportButton(): void {
        if (this.exportManager) {
            this.exportManager.updateExportButton();
        }
    }


    // =============================
    // Public Interface
    // =============================

    /**
     * Public setter to update the current phase name displayed on the timer.
     * Call this at the START of a phase so the user sees what is happening.
     */
    public setCurrentPhase(name: string) {
        this._currentPhaseName = name;
        if (this.phaseNameSpan) {
            this.phaseNameSpan.textContent = name || '\u00A0';
        }
        this.updateDisplay();
    }

    public show(): void {
        if (this.timerDisplay) {
            // On first open, compute and apply an appropriate width so that
            // every strategy phase fits on a single line and graphs match.
            if (!this.autoResized) this.computeAndApplyAutoWidth();

            this.timerDisplay.style.display = 'block';
        }
    }

    public hide(): void {
        if (this.timerDisplay) {
            this.timerDisplay.style.display = 'none';
        }
        this.stopLiveTimer();
    }

    public reset(): void {
        this.singularityCount = 0;
        this.lastSingularityTimestamp = 0;
        // All stats now handled by singularityMetrics
        this.startTime = 0;
        this.phaseHistory.clear();
        this.singularityBundles = [];
        this.compressedBundles = [];
        this.lastRecordedPhaseName = null;
        this._currentPhaseName = '';
        this.stopLiveTimer();
        this.phaseHistoryVersion++;
        this.sparklineVersion++;
        this.requestRender({ general: true, phases: true, sparklines: true, exportBtn: true });
    }

    public destroy(): void {
        this.stopLiveTimer();
        window.removeEventListener('mousemove', this.onMouseMoveHandler);
        window.removeEventListener('mouseup', this.onMouseUpHandler);
        if (this.timerDisplay && this.timerDisplay.parentNode) {
            this.timerDisplay.parentNode.removeChild(this.timerDisplay);
        }
    }

}
