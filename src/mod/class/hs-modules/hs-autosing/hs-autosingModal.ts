/**
 * HSAutosingModal
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
import { createPhaseRowDom, updatePhaseRowDom, PhaseRowDom } from "./hs-autosingPhaseStats";
import { SparklineDom, buildSparklineDom, updateSparkline } from './hs-autosingSparkline';
import Decimal from "break_infinity.js";
import { formatNumber, formatNumberWithSign, formatDecimal, formatTotalTime } from "./hs-autosingFormatUtils";
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
import { HSLogger } from "../../hs-core/hs-logger";

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

export class HSAutosingModal {
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

    // --- Cached DOM Nodes ---
    private phaseNameSpan: HTMLElement | null = null;
    private footerSection: HTMLElement | null = null;
    private singTargetSpan: HTMLElement | null = null;
    private singHighestSpan: HTMLElement | null = null;
    private completedSingAmountSpan: HTMLElement | null = null;
    private c15TopSpan: HTMLElement | null = null;
    private c15SigmaSpan: HTMLElement | null = null;
    private quarksCurrentAmountSpan: HTMLElement | null = null;
    private quarksRateValSpan: HTMLElement | null = null;
    private quarksRateHrSpan: HTMLElement | null = null;
    private gquarksCurrentAmountSpan: HTMLElement | null = null;
    private gquarksRateValSpan: HTMLElement | null = null;
    private gquarksRateHrSpan: HTMLElement | null = null;
    private avg1Span: HTMLElement | null = null;
    private avg10Span: HTMLElement | null = null;
    private avg50Span: HTMLElement | null = null;
    private avgAllSpan: HTMLElement | null = null;
    private avgAllCountSpan: HTMLElement | null = null;
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
    private phaseRowMap: Map<string, PhaseRowDom> = new Map();
    private sparklineQuarksContainer: HTMLElement | null = null;
    private sparklineGoldenQuarksContainer: HTMLElement | null = null;
    private sparklineTimeContainer: HTMLElement | null = null;
    private phaseHeaderNodes: HTMLDivElement[] = [];
    private avgSpanParts: Map<HTMLElement, { main: HTMLSpanElement; sd: HTMLSpanElement }> = new Map();
    private cachedDetailedEls: HTMLElement[] = [];
    private sectionGrids: HTMLElement[] = [];
    private farmingGrid: HTMLElement | null = null;

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
    private currentPhaseName: string = '';
    private currentPhaseStart: number = 0;
    private currentSingularityPhases: Map<string, number> = new Map();
    private lastRecordedPhaseName: string | null = null;
    private liveTimerInterval: number | null = null;
    private compressedBundles: string[] = [];
    private singularityBundles: (string | SingularityBundle)[] = [];

    // --- All-Time Statistical Summary ---
    private allTimeStats = {
        singCompleted: 0,
        totalDuration: 0,
        meanDuration: 0,
        sumSqDuration: 0,
        minDuration: Infinity,
        maxDuration: 0,
        totalQuarks: 0,
        minQuarks: Infinity,
        maxQuarks: 0,
        meanQuarks: 0,
        sumSqQuarks: 0,
        totalGoldenQuarks: 0,
        minGoldenQuarks: Infinity,
        maxGoldenQuarks: 0,
        meanGoldenQuarks: 0,
        sumSqGoldenQuarks: 0
    };

    // --- Unified array for chart metrics: each entry represents a singularity event.
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

    // --- Charting & Stats ---
    private sparklineMaxPoints: number = 50;
    private phaseHistory: Map<string, {
        phaseCount: number;
        totalTime: number;
        sumSq: number;
        lastTime: number;
        innerLoopCount: number;
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
    private phaseHistoryVersion: number = 0;
    private sparklineVersion: number = 0;

    // --- Sizing & Layout ---
    private autoResized: boolean = false;
    private computedMaxWidth: number | null = null; // px
    private computedMaxHeight: number | null = null; // px
    private computedGraphWidth: number | null = null; // px


    // =============================
    // Constructor and Initialization
    // =============================

    /**
     * Construct the timer modal and initialize core state and DOM.
     */
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
     * Create and initialize the timer modal display, including header, content, and controls.
     * Cache DOM nodes for performance.
     */
    private createTimerDisplay(): void {
        this.timerDisplay = document.createElement('div');
        this.timerDisplay.id = 'hs-autosing-timer-display';
        this.timerDisplay.classList.add('hs-hidden');
        // Contain the modal to limit layout/paint impact on the rest of the document.
        // This helps isolate style/layout calculations from the page.
        // Note: supported in modern browsers.
        this.timerDisplay.style.contain = 'layout paint';


        // ----- HEADER -----
        this.timerHeader = document.createElement('div');
        this.timerHeader.className = 'hs-timer-header';

        const title = document.createElement('span');
        title.textContent = '⏱️ Autosing';
        title.className = 'hs-timer-title';

        // Pause button
        this.pauseBtn = document.createElement('button');
        this.pauseBtn.id = 'hs-timer-ctrl-pause';
        this.pauseBtn.textContent = '⏸️';
        this.pauseBtn.title = "Pause Autosing";
        this.pauseBtn.className = 'hs-timer-ctrl-btn hs-detailed-data';
        this.pauseBtn.onclick = () => {
            this.isPaused = !this.isPaused;
            this.pauseBtn.textContent = this.isPaused ? '▶️' : '⏸️';
            this.pauseBtn.title = this.isPaused ? 'Resume Autosing' : 'Pause Autosing';
        };
        // Restart button
        this.restartButton = document.createElement('button');
        this.restartButton.id = 'hs-timer-ctrl-restart';
        this.restartButton.textContent = '🔄';
        this.restartButton.title = "Restart Singularity from the beginning";
        this.restartButton.className = 'hs-timer-ctrl-btn hs-detailed-data';
        this.restartButton.onclick = async () => {
            const autosingMod = HSModuleManager.getModule<HSAutosing>('HSAutosing');
            if (autosingMod) {
                // Stop autosing, wait a bit, then Re-enable autosing (simulates starting from beginning)
                autosingMod.stopAutosing();
                await new Promise(resolve => setTimeout(resolve, 500));
                const toggle = document.getElementById('hs-setting-auto-sing-enabled');
                if (toggle) toggle.click();
            }
        };
        // Stop BUTTON
        this.stopButton = document.createElement('button');
        this.stopButton.id = 'hs-timer-ctrl-stop';
        this.stopButton.textContent = '🔴';
        this.stopButton.title = "Stop Autosing NOW";
        this.stopButton.className = 'hs-timer-ctrl-btn';
        this.stopButton.onclick = () => {
            const toggle = document.getElementById('hs-setting-auto-sing-enabled');
            if (toggle) toggle.click();
        };
        // Finish & Stop BUTTON
        this.finishStopBtn = document.createElement('button');
        this.finishStopBtn.id = 'hs-timer-ctrl-finish-stop';
        this.finishStopBtn.textContent = '🟠';
        this.finishStopBtn.title = "Stop Autosing at the end of current Singularity";
        this.finishStopBtn.className = 'hs-timer-ctrl-btn hs-detailed-data';
        this.finishStopBtn.onclick = () => {
            const autosingMod = HSModuleManager.getModule<HSAutosing>('HSAutosing');
            if (autosingMod) {
                const newState = !autosingMod.isStopAtSingularitysEnd();
                autosingMod.setStopAtSingularitysEnd(newState);
                this.finishStopBtn.style.backgroundColor = newState ? '#ff9800' : '';
            }
        };
        // Detailed data toggle button
        this.chartToggleBtn = document.createElement('button');
        this.chartToggleBtn.id = 'hs-timer-ctrl-chart-toggle';
        this.chartToggleBtn.textContent = '📊';
        this.chartToggleBtn.title = "Toggle Detailed Data Visibility";
        this.chartToggleBtn.className = 'hs-timer-ctrl-btn hs-timer-ctrl-btn-secondary';
        this.chartToggleBtn.onclick = () => {
            this.toggleDetailedDataVisibility(!this.showDetailedData);
        };
        this.chartToggleBtn.onmouseenter = () => {
            if (this.showDetailedData) {
                this.chartToggleBtn!.textContent = '✖️';
            }
        };
        this.chartToggleBtn.onmouseleave = () => { this.chartToggleBtn!.textContent = '📊'; };
        // Minimize button
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

        // ----- CONTENT -----
        this.timerContent = document.createElement('div');
        this.timerContent.className = 'hs-timer-content';

        this.dynamicContent = document.createElement('div');
        this.dynamicContent.innerHTML = `
            <div class="hs-timer-section">
                <div id="hs-farming-grid">
                    <div class="hs-section-header-title">
                        FARMING
                        <span>
                            <span id="hs-sing-target"></span>
                            <span class="hs-sing-sep"> / </span>
                            <span id="hs-sing-highest"></span>
                        </span>
                    </div>
                    <div class="hs-value-cell hs-detailed-data"><span id="hs-c15-top" class="hs-c15-top hs-secondary-data-style"></span></div>
                    <div class="hs-label-cell"><span class="hs-timer-label">Completed:</span> <span id="hs-completed-sing-amount">0</span></div>
                    <div class="hs-value-cell hs-detailed-data"><span id="hs-c15-sigma" class="hs-secondary-data-style"></span></div>
                </div>
                <div class="hs-info-line-phase hs-detailed-data"><span class="hs-timer-label">Phase:</span> <span id="hs-phase-name-val">&nbsp;</span> <span id="hs-phase-timer-val"></span></div>
            </div>

            <hr class="hs-timer-hr">

            <div class="hs-timer-section">
                <div class="hs-times-grid hs-section-grid">
                    <div class="hs-section-header-title hs-section-header-title-full">TIMES</div>
                    <div class="hs-label-cell"><span class="hs-timer-label">Last 1:</span></div>
                    <div class="hs-value-cell"><span id="hs-avg-1">-</span></div>
                    <div class="hs-label-cell hs-detailed-data"><span class="hs-timer-label hs-secondary-data-style">Total:</span></div>
                    <div class="hs-value-cell hs-detailed-data"><span id="hs-total-time" class="hs-secondary-data-style">-</span></div>
                    <div class="hs-label-cell hs-detailed-data"><span id="hs-avg-10-lbl" class="hs-timer-label">Last 10:</span></div>
                    <div class="hs-value-cell hs-detailed-data">
                        <span id="hs-avg-10">
                            <span class="hs-avg-main"></span>
                            <span class="hs-avg-sd"></span>
                        </span>
                    </div>
                    <div class="hs-label-cell hs-detailed-data"><span class="hs-timer-label hs-secondary-data-style">Max:</span></div>
                    <div class="hs-value-cell hs-detailed-data"><span id="hs-max-time" class="hs-secondary-data-style">-</span></div>
                    <div class="hs-label-cell hs-detailed-data"><span id="hs-avg-50-lbl" class="hs-timer-label">Last 50:</span></div>
                    <div class="hs-value-cell hs-detailed-data">
                        <span id="hs-avg-50">
                            <span class="hs-avg-main"></span>
                            <span class="hs-avg-sd"></span>
                        </span>
                    </div>
                    <div class="hs-label-cell hs-detailed-data"><span class="hs-timer-label hs-secondary-data-style">Min:</span></div>
                    <div class="hs-value-cell hs-detailed-data"><span id="hs-min-time" class="hs-secondary-data-style">-</span></div>
                    <div class="hs-label-cell"><span id="hs-avg-all-lbl" class="hs-timer-label">All <span id="hs-avg-all-count">0</span>:</span></div>
                    <div class="hs-value-cell">
                        <span id="hs-avg-all">
                            <span class="hs-avg-main"></span>
                            <span class="hs-avg-sd"></span>
                        </span>
                    </div>
                    <div></div>
                    <div></div>
                </div>
                <div id="hs-sparkline-time-container" class="hs-sparkline-row hs-detailed-data"></div>
            </div>

            <hr class="hs-timer-hr">

            <div class="hs-timer-section">
                <div class="hs-section-grid">
                    <div class="hs-section-header-title-span2">QUARKS</div>
                    <div class="hs-label-cell hs-detailed-data"><span class="hs-timer-label hs-secondary-data-style">Current:</span></div>
                    <div class="hs-value-cell hs-detailed-data"><span id="hs-quarks-current-amount" class="hs-secondary-data-style">0</span></div>
                    <div class="hs-label-cell"><span class="hs-timer-label">Rate:</span></div>
                    <div class="hs-value-cell"><span id="hs-quarks-rate-val" class="hs-quarks-rate-color">0/s</span> <span id="hs-quarks-rate-val-hr"> (0/hr)</span></div>
                    <div class="hs-label-cell hs-detailed-data"><span class="hs-timer-label hs-secondary-data-style">Max:</span></div>
                    <div class="hs-value-cell hs-detailed-data"><span id="hs-quarks-max-gains" class="hs-secondary-data-style">-</span></div>
                    <div class="hs-label-cell"><span class="hs-timer-label">Gained:</span></div>
                    <div class="hs-value-cell"><span id="hs-quarks-total-gains" class="hs-quarks-rate-color">-</span></div>
                    <div class="hs-label-cell hs-detailed-data"><span class="hs-timer-label hs-secondary-data-style">Min:</span></div>
                    <div class="hs-value-cell hs-detailed-data"><span id="hs-quarks-min-gains" class="hs-secondary-data-style">-</span></div>
                </div>
                <div id="hs-sparkline-quarks-container" class="hs-sparkline-row hs-detailed-data"></div>
            </div>

            <hr class="hs-timer-hr">

            <div class="hs-timer-section">
                <div class="hs-section-grid">
                    <div class="hs-section-header-title-span2">GOLDEN QUARKS</div>
                    <div class="hs-label-cell hs-detailed-data"><span class="hs-timer-label hs-secondary-data-style">Current:</span></div>
                    <div class="hs-value-cell hs-detailed-data"><span id="hs-gquarks-current-amount" class="hs-secondary-data-style">0</span></div>
                    <div class="hs-label-cell"><span class="hs-timer-label">Rate:</span></div>
                    <div class="hs-value-cell"><span id="hs-gquarks-rate-val" class="hs-gquarks-rate-color">0/s</span> <span id="hs-gquarks-rate-val-hr"> (0/hr)</span></div>
                    <div class="hs-label-cell hs-detailed-data"><span class="hs-timer-label hs-secondary-data-style">Max:</span></div>
                    <div class="hs-value-cell hs-detailed-data"><span id="hs-gquarks-max-gains" class="hs-secondary-data-style">-</span></div>
                    <div class="hs-label-cell"><span class="hs-timer-label">Gained:</span></div>
                    <div class="hs-value-cell"><span id="hs-gquarks-total-gains" class="hs-gquarks-rate-color">-</span></div>
                    <div class="hs-label-cell hs-detailed-data"><span class="hs-timer-label hs-secondary-data-style">Min:</span></div>
                    <div class="hs-value-cell hs-detailed-data"><span id="hs-gquarks-min-gains" class="hs-secondary-data-style">-</span></div>
                </div>
                <div id="hs-sparkline-goldenquarks-container" class="hs-sparkline-row hs-detailed-data"></div>
            </div>

            <div id="hs-phase-stats-wrapper" class="hs-detailed-data">
                <hr class="hs-timer-hr">
                <div id="hs-phase-stats-section" class="hs-timer-section">
                    <div id="hs-phase-stats-container" class="hs-phase-stats-grid">
                        <div class="hs-phase-stats-header-title hs-phase-stats-row0">PHASE STATISTICS</div>
                        <div class="hs-phase-stats-header hs-phase-stats-row0">Loops</div>
                        <div class="hs-phase-stats-header hs-phase-stats-row0">Avg</div>
                        <div class="hs-phase-stats-header hs-phase-stats-row0">SD</div>
                        <div class="hs-phase-stats-header hs-phase-stats-row0">Last</div>
                    </div>
                </div>
                <hr class="hs-timer-hr">
            </div>

            <div id="hs-footer-section" class="hs-footer-info hs-timer-section hs-detailed-data">
                <div class="hs-info-line-detailed"><span class="hs-timer-label">Module Version: </span> <span id="hs-footer-version"></span></div>
                <div class="hs-info-line-detailed"><span class="hs-timer-label">Active Strategy: </span> <span id="hs-footer-strategy"></span></div>
                <div class="hs-info-line-detailed hs-footer-loadouts"><span class="hs-timer-label">Amb Loadouts Order: </span> <span id="hs-footer-loadouts"></span></div>
            </div>
        `;
        this.timerContent.appendChild(this.dynamicContent);

        // ----- RESIZE HANDLE -----
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'hs-resize-handle';
        resizeHandle.onmousedown = (e) => this.startResize(e);

        // ----- ASSEMBLE -----
        this.timerDisplay.appendChild(this.timerHeader);
        this.timerDisplay.appendChild(this.timerContent);
        this.timerDisplay.appendChild(resizeHandle);
        document.body.appendChild(this.timerDisplay);

        // Cache frequently updated nodes (avoid repeated getElementById during renders)
        this.cachedDetailedEls = Array.from(document.querySelectorAll('.hs-detailed-data')) as HTMLElement[];
        this.farmingGrid = document.getElementById('hs-farming-grid');
        this.sectionGrids = Array.from(document.querySelectorAll('.hs-section-grid')) as HTMLElement[];
        this.phaseStatsContainer = document.getElementById('hs-phase-stats-container');

        this.singTargetSpan = document.getElementById('hs-sing-target');
        this.singHighestSpan = document.getElementById('hs-sing-highest');
        this.phaseNameSpan = document.getElementById('hs-phase-name-val');
        this.completedSingAmountSpan = document.getElementById('hs-completed-sing-amount');

        this.c15TopSpan = document.getElementById('hs-c15-top');
        this.c15SigmaSpan = document.getElementById('hs-c15-sigma');

        this.totalTimeSpan = document.getElementById('hs-total-time');
        this.maxTimeSpan = document.getElementById('hs-max-time');
        this.minTimeSpan = document.getElementById('hs-min-time');
        this.avg1Span = document.getElementById('hs-avg-1');
        this.avg10Span = document.getElementById('hs-avg-10');
        this.avg50Span = document.getElementById('hs-avg-50');
        this.avgAllSpan = document.getElementById('hs-avg-all');
        this.avgAllCountSpan = document.getElementById('hs-avg-all-count');

        this.quarksCurrentAmountSpan = document.getElementById('hs-quarks-current-amount');
        this.quarksRateValSpan = document.getElementById('hs-quarks-rate-val');
        this.quarksRateHrSpan = document.getElementById('hs-quarks-rate-val-hr');
        this.quarksTotalGainsSpan = document.getElementById('hs-quarks-total-gains');
        this.quarksMaxGainsSpan = document.getElementById('hs-quarks-max-gains');
        this.quarksMinGainsSpan = document.getElementById('hs-quarks-min-gains');
        this.gquarksCurrentAmountSpan = document.getElementById('hs-gquarks-current-amount');
        this.gquarksRateValSpan = document.getElementById('hs-gquarks-rate-val');
        this.gquarksRateHrSpan = document.getElementById('hs-gquarks-rate-val-hr');
        this.gquarksTotalGainsSpan = document.getElementById('hs-gquarks-total-gains');
        this.gquarksMaxGainsSpan = document.getElementById('hs-gquarks-max-gains');
        this.gquarksMinGainsSpan = document.getElementById('hs-gquarks-min-gains');

        this.sparklineQuarksContainer = document.getElementById('hs-sparkline-quarks-container');
        this.sparklineGoldenQuarksContainer = document.getElementById('hs-sparkline-goldenquarks-container');
        this.sparklineTimeContainer = document.getElementById('hs-sparkline-time-container');

        this.sparklineQuarks = buildSparklineDom(this.sparklineQuarksContainer, '#00BCD4', false);
        this.sparklineGoldenQuarks = buildSparklineDom(this.sparklineGoldenQuarksContainer, '#F1FA8C', false);
        this.sparklineTimes = buildSparklineDom(this.sparklineTimeContainer, '#FF8A80', true);

        this.footerSection = document.getElementById('hs-footer-section');
        this.footerVersionSpan = document.getElementById('hs-footer-version');
        this.footerStrategySpan = document.getElementById('hs-footer-strategy');
        this.footerLoadoutsSpan = document.getElementById('hs-footer-loadouts');

        // Persistent export button
        this.exportButton = document.createElement('button');
        this.exportButton.id = 'hs-export-data-btn';
        this.exportButton.className = 'hs-export-btn';
        this.exportButton.classList.add('hs-hidden');
        this.exportButton.onclick = () => {
            if (this.exportManager) {
                this.exportManager.exportDataAsCSV(compressToUTF16, decompressFromUTF16);
            }
        };
        this.timerContent.appendChild(this.exportButton);
        
        /*
        // Initialize export manager after exportButton is created
        this.exportManager = new HSAutosingExportManager({
            db: this.db,
            getCompressedBundles: () => this.compressedBundles,
            exportButton: this.exportButton,
            getAdvancedDataCollectionEnabled: () => this.advancedDataCollectionEnabled,
            getSingularityBundlesCount: () => this.singularityBundles.length
        });
        */
    }

    /**
     * Ensure the average span structure (main/sd) exists for a given element.
     * Returns the created or cached structure.
     */
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

    /**
     * Sync the advanced data collection enabled state from settings.
     */
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
     * Compute and apply auto width and height for the modal and chart containers.
     */
    private computeAndApplyAutoWidth(): void {
        if (!this.timerDisplay || this.autoResized) return;

        // Hard-coded defaults (adjust as desired)
        const FIXED_WIDTH = 350; // px
        const FIXED_HEIGHT = 560; // px

        // Sparkline SVG width: leave space for the label column on the right.
        const FIXED_GRAPH_WIDTH = 286; // px
        const LABELS_ESTIMATE = 55; // px; right-side label column width (based on ~11 chars in a 9px monospaced font-size)

        // Respect viewport so the modal doesn't go off-screen by default.
        const appliedWidth = Math.max(260, Math.min(FIXED_WIDTH, window.innerWidth - 20));
        const appliedHeight = Math.max(400, Math.min(FIXED_HEIGHT, window.innerHeight - 6));

        this.computedMaxWidth = appliedWidth;
        this.computedMaxHeight = appliedHeight + 250;
        // Graph (SVG) width must fit inside the modal
        this.computedGraphWidth = Math.max(120, Math.min(FIXED_GRAPH_WIDTH, appliedWidth - LABELS_ESTIMATE));

        this.timerDisplay.style.width = 'auto';
        this.timerDisplay.style.height = 'auto';

        // Sparkline containers also use auto width to allow modal to auto-resize
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
        const newHeight = Math.max(80, this.resizeStart.height + deltaY);

        // Clamp width to computed max if present (locks max width)
        const maxW = this.computedMaxWidth || Infinity;
        const finalWidth = Math.min(newWidth, maxW + 20);

        this.timerDisplay.style.width = `${finalWidth}px`;
        this.timerDisplay.style.height = `${newHeight}px`;
    }

    /**
     * Toggles modal minimize state using class toggling for visibility/layout.
     */
    private toggleMinimize(): void {
        if (!this.timerContent || !this.timerDisplay) return;

        this.isMinimized = !this.isMinimized;

        this.timerDisplay.classList.add('hs-minimized');
        this.timerContent.classList.toggle('hs-hidden', this.isMinimized);
        this.restartButton?.classList.toggle('hs-hidden', this.isMinimized);
        this.finishStopBtn?.classList.toggle('hs-hidden', this.isMinimized);
        this.chartToggleBtn?.classList.toggle('hs-hidden', this.isMinimized);

        if (this.minimizeBtn) {
            this.minimizeBtn.textContent = this.isMinimized ? '+' : '−';
        }

        if (!this.isMinimized) {
            this.timerDisplay.classList.remove('hs-minimized');
            this.rebuildDetailedDataDom();
        } else {
            this.deleteDetailedDataDom();          
        } 

        this.sparklineVersion++;
        this.phaseHistoryVersion++;
        this.requestRenderAll();
    }

    /**
     * Show or hide all detailed data elements based on visibility flag using the 'hs-detailed-data' class.
     */
    private toggleDetailedDataVisibility(visible: boolean): void {
        if (!this.timerContent || !this.timerDisplay) return;

        this.showDetailedData = visible;

        this.cachedDetailedEls.forEach(el => {
            el.classList.toggle('hs-hidden', !visible);
        });

        this.farmingGrid?.classList.toggle('hs-grid-2col-auto-auto', visible);
        this.farmingGrid?.classList.toggle('hs-grid-1col', !visible);
        this.sectionGrids.forEach(sectionGrid => {
            sectionGrid.classList.toggle('hs-grid-4col', visible);
            sectionGrid.classList.toggle('hs-grid-2col-min-auto', !visible);
        });

        if (visible) {
            this.rebuildDetailedDataDom();
        } else {
            this.deleteDetailedDataDom();          
        }
        
        this.sparklineVersion++;
        this.phaseHistoryVersion++;
        this.requestRenderAll();
    }

    /**
     * (Re)build the DOM structure for detailed data sections that can be toggled on/off,
     *  ensuring a stable structure for efficient updates.
     */
    private rebuildDetailedDataDom(): void {
        /*
        // Times section (Averages/Total/Min/Max)
        this.ensureAvgSpanStructure(this.avg10Span);
        this.ensureAvgSpanStructure(this.avg50Span);

        // Phase stats header
        if (!this.phaseStatsContainer) return;
        this.phaseStatsContainer.innerHTML = `
            <div class="hs-phase-stats-header-title">PHASE STATISTICS</div>
            <div class="hs-phase-stats-header">Loops</div>
            <div class="hs-phase-stats-header">Avg</div>
            <div class="hs-phase-stats-header">SD</div>
            <div class="hs-phase-stats-header">Last</div>
        `;
        */ 
        
        // Sparklines
        this.sparklineQuarks = buildSparklineDom(this.sparklineQuarksContainer, '#00BCD4', false);
        this.sparklineGoldenQuarks = buildSparklineDom(this.sparklineGoldenQuarksContainer, '#F1FA8C', false);
        this.sparklineTimes = buildSparklineDom(this.sparklineTimeContainer, '#FF8A80', true);
    }

    /**
     *  Delete the DOM structure for detailed data sections that can be toggled on/off,
     *  ensuring a stable structure for efficient updates.
     */
    private deleteDetailedDataDom(): void {
        // Delete all phase rows (except the 5 column headers)
        if (this.phaseStatsContainer) {
            while (this.phaseStatsContainer.children.length > 5) {
                this.phaseStatsContainer.removeChild(this.phaseStatsContainer.lastElementChild!);
            }
        }
        this.phaseRowMap.clear();               

        // Clear sparkline containers
        if (this.sparklineTimeContainer) { this.sparklineTimeContainer.innerHTML = ''; }
        if (this.sparklineQuarksContainer) { this.sparklineQuarksContainer.innerHTML = ''; }
        if (this.sparklineGoldenQuarksContainer) { this.sparklineGoldenQuarksContainer.innerHTML = ''; }  
    }

    // =============================
    // Session/Timer Management
    // =============================

    /**
     * Start the live timer for a new singularity.
     * Reset phase tracking and update UI.
     */
    private startLiveTimer(): void {
        HSLogger.log('[Autosing] Starting new singularity');
        this.clearSingularityInterval();
        this.lastSingularityTimestamp = performance.now();
        this.currentPhaseStart = this.lastSingularityTimestamp;
        
        this.currentSingularityPhases.clear();
        this.lastRecordedPhaseName = null;
        this.currentPhaseName = '';

        this.phaseHistoryVersion++;
        this.sparklineVersion++;
        this.requestRenderAll();
    }

    /**
     * Stop the live timer interval.
     */
    private clearSingularityInterval(): void {
        if (this.liveTimerInterval !== null) {
            clearInterval(this.liveTimerInterval);
            this.liveTimerInterval = null;
        }
    }

    /**
     * Start autosing session with given strategy and initial (g)quark values.
     * Reset phase history and metrics.
     */
    public start(strategy: HSAutosingStrategy, initialQuarks: number = 0, initialGoldenQuarks: number = 0): void {
        // Defensive check: Ensure Ambrosia quickbar DOM is present
        const quickbar = document.getElementById(HSGlobal.HSAmbrosia.quickBarId);
        if (!quickbar) {
            console.error('[Autosing] Ambrosia quickbar DOM not found! Autosing mapping aborted. This should never happen if whenSectionInjected was awaited.', this);
            return; 
        }

        // Reset metrics and phase history
        HSLogger.log('[Autosing] start() called: resetting metrics and phase history');
        this.singularityCount = 0;
        this.phaseHistory.clear();
        this.phaseRowMap.clear();
        this.singularityBundles = [];

        this.c15Count = 0;
        this.c15Mean = new Decimal(0);
        this.c15M2 = new Decimal(0);
        this.logC15Count = 0;
        this.logC15Mean = 0;
        this.logC15M2 = 0;

        this.latestQuarksTotal = initialQuarks;
        this.latestGoldenQuarksTotal = initialGoldenQuarks;

        // Cache info at start
        this.modVersion = HSGlobal.General.currentModVersion;
        this.strategy = strategy;
        this.singTarget = this.getSingularityTarget();
        this.singHighest = this.getSingularityHighest();
        this.strategyName = this.getStrategyName();
        this.loadoutsOrder = this.getLoadoutsOrder();
        HSLogger.log(`[Autosing] start() loadoutsOrder: ${JSON.stringify(this.loadoutsOrder)}`);
        this.cachedStrategyOrder = this.strategy.strategy.map((p: { startPhase: string; endPhase: string }) => `${p.startPhase}-${p.endPhase}`);
        HSLogger.log(`[Autosing] start() cachedStrategyOrder: ${JSON.stringify(this.cachedStrategyOrder)}`);

        // Set static stats DOM fields once
        this.setTextEl(this.singTargetSpan, `S${this.singTarget}`);
        this.setTextEl(this.singHighestSpan, `S${this.singHighest}`);
        this.setTextEl(this.footerVersionSpan, `v${this.modVersion}`);
        this.setTextEl(this.footerStrategySpan, this.strategyName);
        this.setTextEl(this.footerLoadoutsSpan, this.loadoutsOrder.join(', '));

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
                HSLogger.log(`[Autosing] AOAG inserted at index ${finalIdx} in cachedStrategyOrder`);
            }
        } else {
            // No explicit end phase found; append AOAG at the end if not present
            if (!this.cachedStrategyOrder.includes(AOAG_NAME)) {
                this.cachedStrategyOrder.push(AOAG_NAME);
                HSLogger.log('[Autosing] AOAG appended to cachedStrategyOrder');
            }
        }
        HSLogger.log(`[Autosing] start() final cachedStrategyOrder: ${JSON.stringify(this.cachedStrategyOrder)}`);

        this.cachedStrategyOrderIndex.clear();
        for (let i = 0; i < this.cachedStrategyOrder.length; i++) {
            this.cachedStrategyOrderIndex.set(this.cachedStrategyOrder[i], i);
        }

        // Check advanced-data-collection once at autosing start (cached).
        this.advancedDataCollectionEnabled = !!HSSettings.getSetting('advancedDataCollection')?.isEnabled();
        if (this.advancedDataCollectionEnabled) {
            this.singularityBundles = [];
            this.compressedBundles = [];
            this.db.clearBundles().catch(console.error);
        } else {
            // Hybrid Minimal: no bundles stored in db
            this.singularityBundles = [];
            this.compressedBundles = [];
        }

        // Reset render versions so next render is a full refresh
        this.phaseHistoryVersion = 0;
        this.lastRenderedPhaseHistoryVersion = -1;
        this.sparklineVersion = 0;
        this.lastRenderedSparklineVersion = -1;

        this.requestRenderAll();

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
                if (phaseData.phaseCount > 0) {
                    // Add the new duration chunk to the existing chunk
                    const prev = phaseData.lastTime;
                    const next = prev + phaseDuration;

                    // Update stats
                    phaseData.totalTime += phaseDuration;
                    phaseData.sumSq += (next * next) - (prev * prev);
                    phaseData.lastTime = next; // Update lastTime to reflect total merged time
                    phaseData.innerLoopCount++; // Increment the number of loops
                }
            }

            // 2. Update Current Singularity Tracking
            const currentVal = this.currentSingularityPhases.get(phase) || 0;
            this.currentSingularityPhases.set(phase, currentVal + phaseDuration);

        } else {
            // STANDARD LOGIC: New Phase
            if (!this.phaseHistory.has(phase)) {
                this.phaseHistory.set(phase, { phaseCount: 0, totalTime: 0, sumSq: 0, lastTime: 0, innerLoopCount: 0 });
            }

            const phaseData = this.phaseHistory.get(phase)!;
            phaseData.phaseCount += 1;
            phaseData.totalTime += phaseDuration; // Accumulate duration
            phaseData.sumSq += phaseDuration * phaseDuration;
            phaseData.lastTime = phaseDuration;
            phaseData.innerLoopCount = 1; // Start at 1 for a new phase

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
        const now = performance.now();
        const singularityDuration = (now - this.lastSingularityTimestamp) / 1000;
        this.lastSingularityTimestamp = now;
        this.singularityCount += 1;

        this.latestGoldenQuarksTotal = currentGoldenQuarks;

        // Handle quarks exactly like golden quarks: use passed totals/gains.
        const realQuarksGain = gainedQuarks;
        this.latestQuarksTotal = currentQuarks;     

        // Add to unified metrics array for charts
        this.addSingularityMetric(
            singularityDuration,
            realQuarksGain,
            gainedGoldenQuarks,
            new Map(this.currentSingularityPhases),
            c15Score
        );

        // --- Update all-time statistical summary (Welford's algorithm)
        this.allTimeStats.singCompleted++;
        // Duration
        const deltaDuration = singularityDuration - this.allTimeStats.meanDuration;
        this.allTimeStats.meanDuration += deltaDuration / this.allTimeStats.singCompleted;
        this.allTimeStats.sumSqDuration += deltaDuration * (singularityDuration - this.allTimeStats.meanDuration);
        this.allTimeStats.totalDuration += singularityDuration;
        // Quarks
        const deltaQuarks = realQuarksGain - this.allTimeStats.meanQuarks;
        this.allTimeStats.meanQuarks += deltaQuarks / this.allTimeStats.singCompleted;
        this.allTimeStats.sumSqQuarks += deltaQuarks * (realQuarksGain - this.allTimeStats.meanQuarks);
        this.allTimeStats.totalQuarks += realQuarksGain;
        // Golden Quarks
        const deltaGoldenQuarks = gainedGoldenQuarks - this.allTimeStats.meanGoldenQuarks;
        this.allTimeStats.meanGoldenQuarks += deltaGoldenQuarks / this.allTimeStats.singCompleted;
        this.allTimeStats.sumSqGoldenQuarks += deltaGoldenQuarks * (gainedGoldenQuarks - this.allTimeStats.meanGoldenQuarks);
        this.allTimeStats.totalGoldenQuarks += gainedGoldenQuarks;
        // Min and Max
        this.allTimeStats.minDuration = Math.min(this.allTimeStats.minDuration, singularityDuration);
        this.allTimeStats.maxDuration = Math.max(this.allTimeStats.maxDuration, singularityDuration);     
        this.allTimeStats.minQuarks = Math.min(this.allTimeStats.minQuarks, realQuarksGain);
        this.allTimeStats.maxQuarks = Math.max(this.allTimeStats.maxQuarks, realQuarksGain);           
        this.allTimeStats.minGoldenQuarks = Math.min(this.allTimeStats.minGoldenQuarks, gainedGoldenQuarks);
        this.allTimeStats.maxGoldenQuarks = Math.max(this.allTimeStats.maxGoldenQuarks, gainedGoldenQuarks);

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
        phases: Map<string, number>,
        c15Score?: Decimal
    ): void {
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
        this.singularityMetrics.push(metric);
        // prune to max points, only keeping as much as needed for charting
        if (this.singularityMetrics.length > this.sparklineMaxPoints) {
            this.singularityMetrics.shift();
        }
    }


    // =============================
    // State Accessors
    // =============================

    /**
     * Return the name of the current phase.
     */
    public getCurrentPhase(): string {
        return this.currentPhaseName;
    }

    /**
     * Public setter to update the current phase name displayed on the timer.
     * Call this at the START of a phase so the user sees what is happening.
     */
    public setCurrentPhase(phaseName: string) {
        this.currentPhaseName = phaseName;
        this.setTextEl(this.phaseNameSpan, phaseName);
        // this.requestRender({ general: true });
    }

    /**
     * Return true if autosing is currently paused.
     */
    public getIsPaused(): boolean {
        return this.isPaused;
    }

    /**
     * Return the number of completed singularities in the current session.
     */
    private getSingularityCount(): number {
        return this.singularityCount;
    }

    /**
     * Return the target singularity number from settings.
     */
    private getSingularityTarget(): number {
        return Number(HSSettings.getSetting('singularityNumber').getValue()) || 0;
    }

    /**
     * Return the highest singularity count from game data.
     */
    private getSingularityHighest(): number {
        const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        const gameData = gameDataAPI?.getGameData();
        return gameData?.highestSingularityCount ?? 0;
    }

    /**
     * Return the name of the current autosing strategy from settings.
     */
    private getStrategyName(): string {
        const setting = HSSettings.getSetting('autosingStrategy');
        const value = setting.getValue();
        const definition = setting.getDefinition();
        const option = definition.settingControl?.selectOptions?.find(opt => String(opt.value) === String(value));

        return option ? option.text : String(value || 'None');
    }

    /**
     * Return the order of ambrosia loadouts for the session from settings.
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
     * Return the duration (in seconds) of the last completed singularity.
     */
    private getLastDuration(): number | null {
        // Return the duration of the last entry in singularityMetrics
        if (this.singularityMetrics.length === 0) return null;
        return this.singularityMetrics[this.singularityMetrics.length - 1].duration;
    }

    // --- All-Time Stats Helpers ---
    private getAllTimeAvgDuration(): number | null {
        return this.allTimeStats.singCompleted ? this.allTimeStats.totalDuration / this.allTimeStats.singCompleted : null;
    }
    private getAllTimeStdDuration(): number | null {
        return this.allTimeStats.singCompleted > 1 ? Math.sqrt(this.allTimeStats.sumSqDuration / this.allTimeStats.singCompleted) : null;
    }
    private getAllTimeAvgQuarks(): number | null {
        return this.allTimeStats.singCompleted ? this.allTimeStats.totalQuarks / this.allTimeStats.singCompleted : null;
    }
    private getAllTimeStdQuarks(): number | null {
        return this.allTimeStats.singCompleted > 1 ? Math.sqrt(this.allTimeStats.sumSqQuarks / this.allTimeStats.singCompleted  ) : null;
    }
    private getAllTimeAvgGoldenQuarks(): number | null {
        return this.allTimeStats.singCompleted ? this.allTimeStats.totalGoldenQuarks / this.allTimeStats.singCompleted : null;
    }
    private getAllTimeStdGoldenQuarks(): number | null {
        return this.allTimeStats.singCompleted > 1 ? Math.sqrt(this.allTimeStats.sumSqGoldenQuarks / this.allTimeStats.singCompleted) : null;
    }

    
    // =============================
    // Render Methods
    // =============================

    /**
     * Request a full render update for all modal sections.
     */
    private requestRenderAll(): void {
        // We reset the versions here to ensure that the next render will update all sections
        this.lastRenderedPhaseHistoryVersion = -1;
        this.lastRenderedSparklineVersion = -1;        
        this.requestRender({ general: true, phases: true, sparklines: true, exportBtn: true });
    }

    /**
     * Request a render update for specific modal sections. Sets pending flags
     * and schedules a render via requestAnimationFrame.
     */
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

    /**
     * Execute pending render updates for modal sections. Only runs if modal is visible and DOM is ready.
     */
    private flushRender(): void {
        if (!this.timerContent || !this.timerDisplay
            || this.timerDisplay.classList.contains('hs-hidden') || this.isMinimized) {
            this.renderGeneralPending = false;
            this.renderPhasesPending = false;
            this.renderSparklinesPending = false;
            this.renderExportPending = false;
            return;
        }

        // Render the mandatory general stats 
        if (this.renderGeneralPending) {
            this.renderSummaryStats();
            this.renderDetailedStats();
        }

        // Only render detailed stats if showDetailedData is true (avoid unnecessary DOM work).
        if (this.renderPhasesPending && this.phaseHistoryVersion !== this.lastRenderedPhaseHistoryVersion) {
            this.renderPhaseStatistics();
        }

        if (this.renderSparklinesPending) {
            if (this.sparklineVersion !== this.lastRenderedSparklineVersion) {
                this.renderSparklines();
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

    /**
     * Set the text content of an element if it differs from the current value.
     */
    private setTextEl(el: HTMLElement | null, text: string): void {
        if (!el) return;
        if (el.textContent !== text) el.textContent = text;
    }

    /**
     * Set the average and standard deviation display for a span element, 
     * using stateless helpers for formatting.
     */
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

    /**
     * Render summary statistics (fields staying visible even if detailed data visibility is OFF).
     */
    private renderSummaryStats(): void {
        if (this.isMinimized) { return; }

        const singTarget = this.getSingularityTarget();
        const singCount = this.getSingularityCount();
        const avg1 = this.getLastDuration();
        const avgAllCount = singCount;
        const avgAll = this.getAllTimeAvgDuration();
        const sdAll = this.getAllTimeStdDuration();
        const allTimeDuration = this.allTimeStats.totalDuration;
        const allTimeQuarks = this.allTimeStats.totalQuarks;
        let allTimeQuarksPerSec = allTimeDuration > 0 ? allTimeQuarks / allTimeDuration : 0;
        const allTimeGoldenQuarks = this.allTimeStats.totalGoldenQuarks;
        let allTimeGoldenQuarksPerSec = allTimeDuration > 0 ? allTimeGoldenQuarks / allTimeDuration : 0;

        // Farming section
        // this.setTextEl(this.singTargetSpan, singTarget ? `${singTarget}` : '-');
        this.setTextEl(this.completedSingAmountSpan, singCount ? `${singCount}` : '-'  );

        // Times section
        this.setTextEl(this.avg1Span, avg1 !== null ? `${avg1.toFixed(2)}s` : '-');
        this.setTextEl(this.avgAllCountSpan, avgAllCount ? `${avgAllCount}` : '-');
        this.setAvgEl(this.avgAllSpan, avgAll, sdAll);
        
        // Quarks section
        this.setTextEl(this.quarksRateValSpan, `${formatNumber(allTimeQuarksPerSec)}/s`);
        this.setTextEl(this.quarksRateHrSpan, `(${formatNumber(allTimeQuarksPerSec * 3600)}/hr)`);
        this.setTextEl(this.quarksTotalGainsSpan, allTimeQuarks > 0 ? formatNumber(allTimeQuarks) : '-');

        // Golden Quarks section
        this.setTextEl(this.gquarksRateValSpan, `${formatNumber(allTimeGoldenQuarksPerSec)}/s`);
        this.setTextEl(this.gquarksRateHrSpan, `(${formatNumber(allTimeGoldenQuarksPerSec * 3600)}/hr)`);
        this.setTextEl(this.gquarksTotalGainsSpan, allTimeGoldenQuarks > 0 ? formatNumber(allTimeGoldenQuarks) : '-');
    }

    /**
     * Render detailed statistics (fields only visible when detailed data visibility is ON)
     */
    private renderDetailedStats(): void {
        if (this.isMinimized || !this.showDetailedData) { return; }
        
        this.renderSummaryStats();
        
        // Farming section (C15 only. Phase handled in his own render function since it updates more frequently)
        const singCompleted = this.getSingularityCount();
        const avgC15 = getC15AverageLast(this.c15Count, this.c15Mean, singCompleted);
        const sdLogC15 = getLogC15Std(this.logC15Count, this.logC15M2);
        const valText = avgC15 ? formatDecimal(avgC15) : '-';
        const sdText = sdLogC15 !== null ? `(σlog ±${sdLogC15.toFixed(3)})` : '';
        this.setTextEl(this.phaseNameSpan, this.currentPhaseName);
        this.setTextEl(this.c15TopSpan, `C15 ${valText}`);
        this.setTextEl(this.c15SigmaSpan, sdText);        

        // Times section
        const avg10 = getAverageLast(this.singularityMetrics, 10);
        const avg50 = getAverageLast(this.singularityMetrics, 50);
        const sd10 = getStandardDeviation(this.singularityMetrics, 10);
        const sd50 = getStandardDeviation(this.singularityMetrics, 50);
        const totalTime = this.allTimeStats.totalDuration;
        const maxTime = this.allTimeStats.maxDuration;
        const minTime = this.allTimeStats.minDuration;
        this.setAvgEl(this.avg10Span, avg10, sd10);
        this.setAvgEl(this.avg50Span, avg50, sd50);
        this.setTextEl(this.totalTimeSpan, totalTime > 0 ? formatTotalTime(totalTime) : '-');
        this.setTextEl(this.maxTimeSpan, maxTime !== 0 ? `${maxTime.toFixed(2)}s` : '-');
        this.setTextEl(this.minTimeSpan, minTime !== 0 && minTime !== Infinity ? `${minTime.toFixed(2)}s` : '-');

        //  Quarks section
        const currentQuarks = this.latestQuarksTotal;
        const maxQuarksGains = this.allTimeStats.maxQuarks;
        const minQuarksGains = this.allTimeStats.minQuarks;
        this.setTextEl(this.quarksCurrentAmountSpan, currentQuarks !== 0 ? formatNumber(currentQuarks) : '-');
        this.setTextEl(this.quarksMaxGainsSpan, maxQuarksGains !== 0 ? formatNumber(maxQuarksGains) : '-');
        this.setTextEl(this.quarksMinGainsSpan, minQuarksGains !== 0 && minQuarksGains !== Infinity ? formatNumber(minQuarksGains) : '-');

        // Golden Quarks section
        const currentGoldenQuarks = this.latestGoldenQuarksTotal;
        const maxGQuarksGains = this.allTimeStats.maxGoldenQuarks;
        const minGQuarksGains = this.allTimeStats.minGoldenQuarks;
        this.setTextEl(this.gquarksCurrentAmountSpan, currentGoldenQuarks > 0 ? formatNumber(currentGoldenQuarks) : '-');
        this.setTextEl(this.gquarksMaxGainsSpan, maxGQuarksGains !== 0 ? formatNumber(maxGQuarksGains) : '-');
        this.setTextEl(this.gquarksMinGainsSpan, minGQuarksGains !== 0 && minGQuarksGains !== Infinity ? formatNumber(minGQuarksGains) : '-');
    }

    /**
     * Render the phase statistics table, sorting and displaying phase data using stateless helpers.
     */
    private renderPhaseStatistics(): void {
        if (!this.phaseStatsContainer) return;
        this.lastRenderedPhaseHistoryVersion = this.phaseHistoryVersion;

        // Only render phase statistics if detailed data is enabled
        if (!this.showDetailedData) {
            return;
        }

        // --- Sorting logic ---
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

        // --- Placeholder logic ---
        if (sortedPhases.length === 0) {
            // Add placeholder if not present
            if (!this.phaseStatsContainer.querySelector('.hs-phase-empty')) {
                const emptyNode = document.createElement('div');
                emptyNode.className = 'hs-phase-empty';
                emptyNode.textContent = 'No data yet...';
                this.phaseStatsContainer.appendChild(emptyNode);
            }
            return;
        } else {
            // Remove placeholder if present
            const emptyNode = this.phaseStatsContainer.querySelector('.hs-phase-empty');
            if (emptyNode) this.phaseStatsContainer.removeChild(emptyNode);
        }

        // --- Row management ---
        // We'll keep a cache of the current DOM order for performance
        // Only update/insert rows as needed; do not remove rows except when hiding all
        let domChildIdx = 5; // skip header (first 5 children)
        let rowIdx = 1; // 0 would be for headers (but not used...)
        for (const [phaseName, phaseData] of sortedPhases) {
            let rowDom = this.phaseRowMap.get(phaseName);
            const avg = phaseData.totalTime / (phaseData.phaseCount || 1);
            const sd = getPhaseStandardDeviation(this.phaseHistory, phaseName) ?? 0;
            const stats = {
                phaseCount: phaseData.phaseCount,
                phaseName,
                innerLoopCount: phaseData.innerLoopCount,
                avg,
                sd,
                last: phaseData.lastTime
            };
            if (!rowDom) {
                // Create and cache new row
                rowDom = createPhaseRowDom(phaseName, phaseData.phaseCount, rowIdx);
                updatePhaseRowDom(rowDom, stats);
                this.phaseRowMap.set(phaseName, rowDom);
                // Insert at correct position
                rowDom.cells.forEach((cell, i) => {
                    this.phaseStatsContainer!.insertBefore(cell, this.phaseStatsContainer!.children[domChildIdx + i] || null);
                });
            } else {
                // Update stats 
                updatePhaseRowDom(rowDom, stats);
            }
            domChildIdx += 5;
            rowIdx++;
        }
    }

    /**
     * Render sparkline charts for quarks, golden quarks, and times,
     * and updates average/stat displays using stateless helpers.
     */
    private renderSparklines(): void {
        // Only render sparklines if detailed data is enabled
        if (this.showDetailedData) {
            updateSparkline(this.sparklineQuarks, this.singularityMetrics, this.computedGraphWidth, formatNumberWithSign, this.sparklineMaxPoints);
            updateSparkline(this.sparklineGoldenQuarks, this.singularityMetrics, this.computedGraphWidth, formatNumberWithSign, this.sparklineMaxPoints);
            updateSparkline(this.sparklineTimes, this.singularityMetrics, this.computedGraphWidth, formatNumberWithSign, this.sparklineMaxPoints);
        }
        this.lastRenderedSparklineVersion = this.sparklineVersion;
    }

    /**
     * Update the export button state using the export manager, if present.
     */
    private updateExportButton(): void {
        if (this.exportManager) {
            this.exportManager.updateExportButton();
        }
    }


    // =============================
    // Misc Modal Stuff
    // =============================

    /**
     * Show the modal. Computes and applies width on first open, then displays the modal.
     */
    public show(): void {
        if (!this.timerDisplay) { return; }
        
        // On first open, compute and apply an appropriate width so that
        // every strategy phase fits on a single line and graphs match.
        if (!this.autoResized) this.computeAndApplyAutoWidth();

        this.timerDisplay.classList.toggle('hs-hidden');
    }

    /**
     * Hide the modal and stop the live timer.
     */
    public hide(): void {
        if (!this.timerDisplay) { return; }
        this.timerDisplay.classList.toggle('hs-hidden');
        this.clearSingularityInterval();
    }

    /**
     * Reset all modal state, stats, and phase history. Stops timer and triggers a full render.
     */
    public reset(): void {
        this.singularityCount = 0;
        this.lastSingularityTimestamp = 0;
        this.phaseHistory.clear();
        this.phaseRowMap.clear();
        this.singularityBundles = [];
        this.compressedBundles = [];
        this.allTimeStats = {
            singCompleted: 0,
            totalDuration: 0,
            meanDuration: 0,
            sumSqDuration: 0,
            minDuration: Infinity,
            maxDuration: 0,
            totalQuarks: 0,
            minQuarks: Infinity,
            maxQuarks: 0,
            meanQuarks: 0,
            sumSqQuarks: 0,
            totalGoldenQuarks: 0,
            minGoldenQuarks: Infinity,
            maxGoldenQuarks: 0,
            meanGoldenQuarks: 0,
            sumSqGoldenQuarks: 0
        };
        this.lastRecordedPhaseName = null;
        this.currentPhaseName = '';
        this.clearSingularityInterval();
        this.phaseHistoryVersion++;
        this.sparklineVersion++;
        this.requestRenderAll();
    }

    /**
     * Destroy the modal, remove event listeners, and clean up DOM elements.
     */
    public destroy(): void {
        this.clearSingularityInterval();
        window.removeEventListener('mousemove', this.onMouseMoveHandler);
        window.removeEventListener('mouseup', this.onMouseUpHandler);
        if (this.timerDisplay && this.timerDisplay.parentNode) {
            this.timerDisplay.parentNode.removeChild(this.timerDisplay);
        }
    }
}
