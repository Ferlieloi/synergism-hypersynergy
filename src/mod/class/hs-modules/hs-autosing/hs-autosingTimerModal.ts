/*
    Class: HSAutosingTimerModule
    IsExplicitHSModule: No
    Description: 
        Class that implements a modal for the autosing timer and for tracking (golden)quark gain.
        Updated with manual phase setter and phase merging logic.
    Author: XxmolkxX
*/
import { HSSettings } from "../../hs-core/settings/hs-settings";
import { HSModuleManager } from "../../hs-core/module/hs-module-manager";
import { HSGameDataAPI } from "../../hs-core/gds/hs-gamedata-api";
import { HSAutosingStrategy, phases } from "../../../types/module-types/hs-autosing-types";
import { HSGlobal } from "../../hs-core/hs-global";
import { HSAutosing } from "./hs-autosing";

interface SingularityBundle {
    singularityNumber: number;
    totalTime: number;
    quarksGained: number;
    goldenQuarksGained: number;
    totalQuarks: number;
    totalGoldenQuarks: number;
    phases: { [phaseName: string]: number };
    timestamp: number;
}

export class HSAutosingTimerModal {
    private timerDisplay: HTMLDivElement | null = null;
    private timerHeader: HTMLDivElement | null = null;
    private timerContent: HTMLDivElement | null = null;
    private isMinimized: boolean = false;
    private isDragging: boolean = false;
    private isResizing: boolean = false;
    private dragOffset = { x: 0, y: 0 };
    private resizeStart = { width: 0, height: 0, x: 0, y: 0 };

    private onMouseMoveHandler = (e: MouseEvent) => this.onMouseMove(e);
    private onMouseUpHandler = () => this.onMouseUp();

    private timestamps: number[] = [];
    private quarksHistory: number[] = [];
    private goldenQuarksHistory: number[] = [];
    private quarksGains: number[] = [];
    private goldenQuarksGains: number[] = [];
    private quarksAmounts: number[] = [];
    private goldenQuarksAmounts: number[] = [];
    private durationsHistory: number[] = [];
    private startTime: number = 0;

    // Phase tracking
    private currentSingularityStart: number = 0;
    private currentPhaseStart: number = 0;
    private _currentPhaseName: string = ''; // Backing field for setter
    private _currentStepName: string = '';  // Tracking current execution step
    private _currentStepStart: number = 0;
    private _currentStepMaxTime: number | null = null;
    private phaseHistory: Map<string, { times: number[], totalTime: number, lastTime: number, repeats: number }> = new Map();
    private currentSingularityPhases: Map<string, number> = new Map();
    private currentSingularityNumber: number = 0;

    // Merge Logic State
    private lastRecordedPhaseName: string | null = null;

    // Live timer
    private liveTimerInterval: number | null = null;
    private currentLiveTime: number = 0;

    // Advanced data collection
    private singularityBundles: SingularityBundle[] = [];
    private sessionQuarksGained: number = 0;
    private sessionGoldenQuarksGained: number = 0;
    private initialQuarksWallet: number = 0;
    private initialGoldenQuarksWallet: number = 0;
    private lastGoldenQuarksWallet: number = 0;

    // Checksum for O(1) avg calculations
    private cumulativeQuarksGained: number = 0;
    private cumulativeGoldenQuarksGained: number = 0;
    private cumulativeSingularityTime: number = 0;
    private cumulativeQuarksRate: number = 0;
    private cumulativeGoldenQuarksRate: number = 0;

    // Latest snapshot for UI display
    private latestQuarksTotal: number = 0;
    private latestGoldenQuarksTotal: number = 0;

    // Cached Stats (calculated at start)
    private singTarget: number = 0;
    private singHighest: number = 0;
    private strategyName: string = '';
    private loadoutsOrder: string[] = [];
    private modVersion: string = '';
    private strategy: HSAutosingStrategy | null = null;

    private exportButton: HTMLButtonElement | null = null;
    private dynamicContent: HTMLDivElement | null = null;
    private showDetailedData: boolean = true;
    private stopButton!: HTMLButtonElement;
    private finishStopBtn!: HTMLButtonElement;
    private chartToggleBtn: HTMLButtonElement | null = null;
    private minimizeBtn!: HTMLButtonElement;

    // Cached Spans & Containers for Ticker
    private liveTimerSpan: HTMLElement | null = null;
    private phaseTimerSpan: HTMLElement | null = null;
    private stepTimerSpan: HTMLElement | null = null;
    private stepContainer: HTMLElement | null = null;
    private phaseNameSpan: HTMLElement | null = null;
    private stepNameSpan: HTMLElement | null = null;
    private footerSection: HTMLElement | null = null;
    private singValSpan: HTMLElement | null = null;
    private progressValSpan: HTMLElement | null = null;

    private cachedStrategyOrder: string[] = [];

    // Cached nodes for general stats updates
    private quarksTotalSpan: HTMLElement | null = null;
    private quarksPrevSpan: HTMLElement | null = null;
    private quarksRateValSpan: HTMLElement | null = null;
    private quarksRateHrSpan: HTMLElement | null = null;
    private gquarksTotalSpan: HTMLElement | null = null;
    private gquarksPrevSpan: HTMLElement | null = null;
    private gquarksRateValSpan: HTMLElement | null = null;
    private gquarksRateHrSpan: HTMLElement | null = null;
    private avg1Span: HTMLElement | null = null;
    private avg10Span: HTMLElement | null = null;
    private avg50Span: HTMLElement | null = null;
    private avgAllSpan: HTMLElement | null = null;
    private avgAllCountSpan: HTMLElement | null = null;
    private avg10LabelSpan: HTMLElement | null = null;
    private avg50LabelSpan: HTMLElement | null = null;

    // Cached nodes for phase stats & sparklines
    private phaseStatsContainer: HTMLElement | null = null;
    private phaseStatsWrapper: HTMLElement | null = null;
    private sparklineContainer1: HTMLElement | null = null;
    private sparklineContainer2: HTMLElement | null = null;
    private sparklineContainer3: HTMLElement | null = null;
    private footerVersionSpan: HTMLElement | null = null;
    private footerStrategySpan: HTMLElement | null = null;
    private footerLoadoutsSpan: HTMLElement | null = null;

    // Render batching / change tracking
    private renderPending: boolean = false;
    private renderGeneralPending: boolean = false;
    private renderPhasesPending: boolean = false;
    private renderSparklinesPending: boolean = false;
    private renderExportPending: boolean = false;

    private phaseHistoryVersion: number = 0;
    private lastRenderedPhaseHistoryVersion: number = -1;
    private sparklineVersion: number = 0;
    private lastRenderedSparklineVersion: number = -1;
    private detailsVisibilityVersion: number = 0;
    private lastRenderedDetailsVisibilityVersion: number = -1;

    constructor() {
        this.createTimerDisplay();
        this.setupDragAndResize();
    }

    /**
     * Public setter to update the current phase name displayed on the timer.
     * Call this at the START of a phase so the user sees what is happening.
     */
    public setCurrentPhase(name: string) {
        this._currentPhaseName = name;
        if (this.phaseNameSpan) {
            this.phaseNameSpan.textContent = name || '\u00A0';
        }
        this.updateTimers();
    }

    public setCurrentStep(name: string, maxTime: number | null = null) {
        if (this._currentStepName === name && this._currentStepMaxTime === maxTime) {
            return;
        }
        this._currentStepName = name;
        this._currentStepStart = performance.now();
        this._currentStepMaxTime = maxTime;

        if (this.stepNameSpan) {
            this.stepNameSpan.textContent = name || '\u00A0';
        }
        this.updateTimers();
    }

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

    public getCurrentPhase(): string {
        return this._currentPhaseName;
    }

    private createTimerDisplay(): void {
        this.timerDisplay = document.createElement('div');
        this.timerDisplay.id = 'hs-autosing-timer-display';
        this.timerDisplay.style.display = 'none';

        /* ---------- HEADER ---------- */
        this.timerHeader = document.createElement('div');
        this.timerHeader.className = 'hs-timer-header';

        const title = document.createElement('span');
        title.textContent = '⏱️ Autosing Timer';
        title.className = 'hs-timer-title';

        this.stopButton = document.createElement('button');
        this.stopButton.textContent = '🔴';
        this.stopButton.title = "Stop Autosing NOW";
        this.stopButton.className = 'hs-stop-btn';
        this.stopButton.onclick = () => {
            const toggle = document.getElementById('hs-setting-auto-sing-enabled');
            if (toggle) toggle.click();
        };

        this.finishStopBtn = document.createElement('button');
        this.finishStopBtn.textContent = '🟠';
        this.finishStopBtn.title = "Stop Autosing at the end of current Singularity";
        this.finishStopBtn.className = 'hs-stop-btn';
        this.finishStopBtn.onclick = () => {
            const autosingMod = HSModuleManager.getModule<HSAutosing>('HSAutosing');
            if (autosingMod) {
                const newState = !autosingMod.isStopAtSingularitysEnd();
                autosingMod.setStopAtSingularitysEnd(newState);
                this.finishStopBtn.style.backgroundColor = newState ? '#ff9800' : '';
            }
        };

        this.chartToggleBtn = document.createElement('button');
        this.chartToggleBtn.textContent = '📊';
        this.chartToggleBtn.title = "Toggle Detailed Data Visibility";
        this.chartToggleBtn.className = 'hs-minimize-btn'; // Reusing style
        this.chartToggleBtn.style.marginRight = '8px';
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
        this.minimizeBtn.textContent = '−';
        this.minimizeBtn.title = "Minimize";
        this.minimizeBtn.className = 'hs-minimize-btn';
        this.minimizeBtn.onclick = () => this.toggleMinimize();

        this.timerHeader.appendChild(title);
        this.timerHeader.appendChild(document.createElement('div')); // Spacer



        const controls = document.createElement('div');
        controls.className = 'hs-timer-controls'; // Assuming this might need flex if parent isn't
        controls.style.display = 'flex'; // Keeping flex here for alignment if not in class
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
                <div class="hs-section-header">FARMING <span id="hs-sing-val" style="color: #fff; font-weight: normal; margin-left: 8px;">#0 / #0</span></div>
                <div class="hs-info-line"><span class="hs-timer-label" style="color: #fff;">Completed:</span> <span id="hs-progress-val" style="color: #00E676; font-weight: bold; margin-left: 6px;">0</span></div>
                <div class="hs-info-line"><span class="hs-timer-label" style="color: #fff;">Phase:</span> <span id="hs-phase-name-val" style="color: #B33A3A; font-weight: bold; margin-left: 6px;">&nbsp;</span> <span id="hs-phase-timer-val" style="color: #FF8A80; margin-left: 4px;"></span></div>
                <div id="hs-step-container" class="hs-info-line-detailed">
                    <span class="hs-timer-label">Step:</span> <span id="hs-step-name-val" class="hs-detailed-value" style="margin-left: 6px;">&nbsp;</span> <span id="hs-step-timer-val" class="hs-detailed-value" style="margin-left: 4px; color: #FF8A80;"></span>
                </div>
            </div>

            <hr class="hs-timer-hr">

            <div class="hs-timer-section">
                <div class="hs-section-header">TIMES</div>
                <div class="hs-times-grid">
                    <span class="hs-timer-label" style="color: #fff;">Current:</span> <span id="hs-live-timer-val" style="color: #FF8A80; font-weight: bold;">0.00s</span>
                    <span class="hs-timer-label" style="color: #fff;">Last 1:</span> <span id="hs-avg-1" style="color: #FF8A80; font-weight: bold;">-</span>
                     <span id="hs-avg-10-lbl" class="hs-timer-label" style="color: #fff;">Last 10:</span> <span id="hs-avg-10" style="color: #FF8A80; font-weight: bold;">-</span>
                     <span id="hs-avg-50-lbl" class="hs-timer-label" style="color: #fff;">Last 50:</span> <span id="hs-avg-50" style="color: #FF8A80; font-weight: bold;">-</span>
                    <span id="hs-avg-all-lbl" class="hs-timer-label" style="color: #fff;">All <span id="hs-avg-all-count" style="color: #fff; font-weight: bold;">0</span>:</span> <span id="hs-avg-all" style="color: #FF8A80; font-weight: bold;">-</span>
                </div>
                <div id="hs-sparkline-container-3" class="hs-sparkline-row"></div>
            </div>

            <hr class="hs-timer-hr">

            <div class="hs-timer-section">
                <div class="hs-section-header">QUARKS</div>
                <div class="hs-info-line">
                    <span class="hs-timer-label" style="color: #fff;">Total:</span>
                    <span id="hs-quarks-total" style="color: #00BCD4; font-weight: bold; margin-left: 6px;">0</span>
                    <span id="hs-quarks-prev" style="color: #666; font-size: 11px; margin-left: 4px;"> (⇦0)</span>
                </div>
                <div id="hs-quarks-rate-row" class="hs-info-line">
                    <span class="hs-timer-label" style="color: #fff;">Rate:</span>
                    <span id="hs-quarks-rate-val" style="color: #00BCD4; font-weight: bold; margin-left: 6px;">0/s</span>
                    <span id="hs-quarks-rate-val-hr" style="color: #666; font-size: 11px; margin-left: 4px;"> (0/hr)</span>
                </div>
                <div id="hs-sparkline-container-1" class="hs-sparkline-row"></div>
            </div>

            <hr class="hs-timer-hr">

            <div class="hs-timer-section">
                <div class="hs-section-header">GOLDEN QUARKS</div>
                <div class="hs-info-line">
                    <span class="hs-timer-label" style="color: #fff;">Total:</span>
                    <span id="hs-gquarks-total" style="color: #F1FA8C; font-weight: bold; margin-left: 6px;">0</span>
                    <span id="hs-gquarks-prev" style="color: #666; font-size: 11px; margin-left: 4px;"> (⇦0)</span>
                </div>
                <div id="hs-gquarks-rate-row" class="hs-info-line">
                    <span class="hs-timer-label" style="color: #fff;">Rate:</span>
                    <span id="hs-gquarks-rate-val" style="color: #F1FA8C; font-weight: bold; margin-left: 6px;">0/s</span>
                    <span id="hs-gquarks-rate-val-hr" style="color: #666; font-size: 11px; margin-left: 4px;"> (0/hr)</span>
                </div>
                <div id="hs-sparkline-container-2" class="hs-sparkline-row"></div>
            </div>

            <div id="hs-phase-stats-wrapper">
                <hr class="hs-timer-hr">
                <div id="hs-phase-stats-section" class="hs-timer-section">
                    <div class="hs-section-header">PHASE STATISTICS</div>
                    <div id="hs-phase-stats-container" class="hs-stats-grid"></div>
                </div>
                <hr class="hs-timer-hr">
            </div>

            <div id="hs-footer-section" class="hs-footer-info hs-timer-section" style="border-bottom: none; opacity: 0.7; padding-top: 0;">
                <div class="hs-info-line-detailed"><span class="hs-timer-label">Module Version:</span> <span id="hs-footer-version" class="hs-detailed-value" style="margin-left: 6px; font-weight: normal;"></span></div>
                <div class="hs-info-line-detailed"><span class="hs-timer-label">Active Strategy:</span> <span id="hs-footer-strategy" class="hs-detailed-value" style="margin-left: 6px; font-weight: normal;"></span></div>
                <div class="hs-info-line-detailed" style="white-space: pre-wrap; margin-top: 2px;"><span class="hs-timer-label">Amb Loadouts Order:</span> <span id="hs-footer-loadouts" class="hs-detailed-value" style="margin-left: 6px; font-weight: normal;"></span></div>
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
        this.liveTimerSpan = document.getElementById('hs-live-timer-val');
        this.phaseTimerSpan = document.getElementById('hs-phase-timer-val');
        this.stepTimerSpan = document.getElementById('hs-step-timer-val');
        this.stepContainer = document.getElementById('hs-step-container');
        this.phaseNameSpan = document.getElementById('hs-phase-name-val');
        this.stepNameSpan = document.getElementById('hs-step-name-val');
        this.footerSection = document.getElementById('hs-footer-section');
        this.singValSpan = document.getElementById('hs-sing-val');
        this.progressValSpan = document.getElementById('hs-progress-val');

        // Cache frequently updated nodes (avoid repeated getElementById during renders)
        this.quarksTotalSpan = document.getElementById('hs-quarks-total');
        this.quarksPrevSpan = document.getElementById('hs-quarks-prev');
        this.quarksRateValSpan = document.getElementById('hs-quarks-rate-val');
        this.quarksRateHrSpan = document.getElementById('hs-quarks-rate-val-hr');
        this.gquarksTotalSpan = document.getElementById('hs-gquarks-total');
        this.gquarksPrevSpan = document.getElementById('hs-gquarks-prev');
        this.gquarksRateValSpan = document.getElementById('hs-gquarks-rate-val');
        this.gquarksRateHrSpan = document.getElementById('hs-gquarks-rate-val-hr');

        this.avg1Span = document.getElementById('hs-avg-1');
        this.avg10Span = document.getElementById('hs-avg-10');
        this.avg50Span = document.getElementById('hs-avg-50');
        this.avgAllSpan = document.getElementById('hs-avg-all');
        this.avgAllCountSpan = document.getElementById('hs-avg-all-count');

        this.avg10LabelSpan = document.getElementById('hs-avg-10-lbl');
        this.avg50LabelSpan = document.getElementById('hs-avg-50-lbl');

        this.phaseStatsContainer = document.getElementById('hs-phase-stats-container');
        this.phaseStatsWrapper = document.getElementById('hs-phase-stats-wrapper');

        this.sparklineContainer1 = document.getElementById('hs-sparkline-container-1');
        this.sparklineContainer2 = document.getElementById('hs-sparkline-container-2');
        this.sparklineContainer3 = document.getElementById('hs-sparkline-container-3');

        this.footerVersionSpan = document.getElementById('hs-footer-version');
        this.footerStrategySpan = document.getElementById('hs-footer-strategy');
        this.footerLoadoutsSpan = document.getElementById('hs-footer-loadouts');

        // Persistent export button
        this.exportButton = document.createElement('button');
        this.exportButton.id = 'hs-export-data-btn';
        this.exportButton.className = 'hs-export-btn';
        this.exportButton.style.display = 'none';
        this.exportButton.onclick = () => this.exportDataAsCSV();
        this.timerContent.appendChild(this.exportButton);
    }

    private updateExportButton(): void {
        if (!this.exportButton) return;

        const advanced = HSSettings.getSetting('advancedDataCollection');
        const isEnabled = advanced && advanced.isEnabled();
        const hasData = this.singularityBundles.length > 0;

        const visible = isEnabled && hasData;

        this.exportButton.style.display = visible ? 'block' : 'none';

        if (visible) {
            this.exportButton.disabled = false;
            this.exportButton.style.opacity = '1';
            this.exportButton.textContent =
                `📊 Export Data (${this.singularityBundles.length} singularities)`;
        } else if (isEnabled && !hasData) {
            // Optional: show but disabled? Or just hide. 
            // Previous code hid it if no data. Keeping that.
            this.exportButton.style.display = 'none';
        }
    }


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

    private onMouseMove(e: MouseEvent): void {
        if (this.isDragging) {
            this.drag(e);
        } else if (this.isResizing) {
            this.resize(e);
        }
    }

    private onMouseUp(): void {
        this.isDragging = false;
        this.isResizing = false;
    }

    private startDrag(e: MouseEvent): void {
        if (!this.timerDisplay) return;
        this.isDragging = true;
        const rect = this.timerDisplay.getBoundingClientRect();
        this.dragOffset.x = e.clientX - rect.left;
        this.dragOffset.y = e.clientY - rect.top;
    }

    private drag(e: MouseEvent): void {
        if (!this.timerDisplay || !this.isDragging) return;

        const x = e.clientX - this.dragOffset.x;
        const y = e.clientY - this.dragOffset.y;

        this.timerDisplay.style.left = `${x}px`;
        this.timerDisplay.style.top = `${y}px`;
        this.timerDisplay.style.right = 'auto';
        this.timerDisplay.style.bottom = 'auto';
    }

    private startResize(e: MouseEvent): void {
        if (!this.timerDisplay) return;
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

    private resize(e: MouseEvent): void {
        if (!this.timerDisplay || !this.isResizing) return;

        const deltaX = e.clientX - this.resizeStart.x;
        const deltaY = e.clientY - this.resizeStart.y;

        const newWidth = Math.max(200, this.resizeStart.width + deltaX);
        const newHeight = Math.max(100, this.resizeStart.height + deltaY);

        this.timerDisplay.style.width = `${newWidth}px`;
        this.timerDisplay.style.height = `${newHeight}px`;
    }

    private toggleMinimize(): void {
        if (!this.timerContent || !this.timerDisplay) return;

        this.isMinimized = !this.isMinimized;

        if (this.isMinimized) {
            this.timerContent.style.display = 'none';
            this.timerDisplay.style.height = 'auto';
            if (this.stopButton) this.stopButton.style.display = 'none';
            if (this.finishStopBtn) this.finishStopBtn.style.display = 'none';
            if (this.chartToggleBtn) this.chartToggleBtn.style.display = 'none';
            if (this.minimizeBtn) this.minimizeBtn.textContent = '+';
        } else {
            this.timerContent.style.display = 'block';
            this.timerDisplay.style.height = '';
            if (this.stopButton) this.stopButton.style.display = 'block';
            if (this.finishStopBtn) this.finishStopBtn.style.display = 'block';
            if (this.chartToggleBtn) this.chartToggleBtn.style.display = 'block';
            if (this.minimizeBtn) this.minimizeBtn.textContent = '−';
            this.updateDisplay();
        }
    }

    private startLiveTimer(): void {
        this.stopLiveTimer();
        this.currentSingularityStart = performance.now();
        this.currentPhaseStart = this.currentSingularityStart;
        this.currentSingularityPhases.clear();

        this.lastRecordedPhaseName = null;
        this._currentPhaseName = '';

        this.liveTimerInterval = window.setInterval(() => {
            this.currentLiveTime = (performance.now() - this.currentSingularityStart) / 1000;
            this.updateTimers();
        }, 100);
    }

    private stopLiveTimer(): void {
        if (this.liveTimerInterval !== null) {
            clearInterval(this.liveTimerInterval);
            this.liveTimerInterval = null;
        }
    }

    public start(strategy: HSAutosingStrategy, initialQuarks: number = 0, initialGoldenQuarks: number = 0): void {
        this.quarksHistory = [];
        this.goldenQuarksHistory = [];
        this.quarksGains = [];
        this.goldenQuarksGains = [];
        this.startTime = performance.now();
        // IMPORTANT: `timestamps` includes the start time at index 0.
        // This keeps duration/rate math consistent for the first singularity.
        this.timestamps = [this.startTime];
        this.phaseHistory.clear();
        this.singularityBundles = [];
        this.sessionQuarksGained = 0;
        this.sessionGoldenQuarksGained = 0;
        this.initialQuarksWallet = initialQuarks;
        this.initialGoldenQuarksWallet = initialGoldenQuarks;
        this.lastGoldenQuarksWallet = initialGoldenQuarks;

        this.cumulativeQuarksGained = 0;
        this.cumulativeGoldenQuarksGained = 0;
        this.cumulativeSingularityTime = 0;
        this.cumulativeQuarksRate = 0;
        this.cumulativeGoldenQuarksRate = 0;

        this.latestQuarksTotal = initialQuarks;
        this.latestGoldenQuarksTotal = initialGoldenQuarks;

        // Cache stats at start
        this.strategy = strategy;
        this.singTarget = this.getSingularityTarget();
        this.singHighest = this.getSingularityHighest();
        this.strategyName = this.getStrategyName();
        this.loadoutsOrder = this.getLoadoutsOrder();
        this.cachedStrategyOrder = this.strategy.strategy.map(p => `${p.startPhase}-${p.endPhase}`);
        this.modVersion = HSGlobal.General.currentModVersion;

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

    public recordPhase(phase: string): void {
        const now = performance.now();
        const timeSinceStart = (now - this.currentSingularityStart) / 1000;
        const phaseDuration = (now - this.currentPhaseStart) / 1000;

        // MERGE LOGIC: Check if we are repeating the same phase
        if (phase === this.lastRecordedPhaseName) {

            // 1. Update Global History (extend the last entry)
            if (this.phaseHistory.has(phase)) {
                const phaseData = this.phaseHistory.get(phase)!;
                if (phaseData.times.length > 0) {
                    const lastIdx = phaseData.times.length - 1;
                    // Add the new duration chunk to the existing chunk
                    phaseData.times[lastIdx] += phaseDuration;

                    // Update stats
                    phaseData.totalTime += phaseDuration;
                    phaseData.lastTime = phaseData.times[lastIdx]; // Update lastTime to reflect total merged time
                    phaseData.repeats++; // Increment repeat count for this sequence
                }
            }

            // 2. Update Current Singularity Tracking
            const currentVal = this.currentSingularityPhases.get(phase) || 0;
            this.currentSingularityPhases.set(phase, currentVal + phaseDuration);

        } else {
            // STANDARD LOGIC: New Phase
            if (!this.phaseHistory.has(phase)) {
                this.phaseHistory.set(phase, { times: [], totalTime: 0, lastTime: 0, repeats: 0 });
            }

            const phaseData = this.phaseHistory.get(phase)!;
            phaseData.times.push(phaseDuration);
            phaseData.totalTime += phaseDuration; // Accumulate duration
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

    private pruneHistory(): void {
        const MAX_HISTORY = 1000;
        if (this.timestamps.length > MAX_HISTORY) this.timestamps = this.timestamps.slice(-MAX_HISTORY);
        if (this.quarksHistory.length > MAX_HISTORY) this.quarksHistory = this.quarksHistory.slice(-MAX_HISTORY);
        if (this.goldenQuarksHistory.length > MAX_HISTORY) this.goldenQuarksHistory = this.goldenQuarksHistory.slice(-MAX_HISTORY);
        if (this.quarksGains.length > MAX_HISTORY) this.quarksGains = this.quarksGains.slice(-MAX_HISTORY);
        if (this.goldenQuarksGains.length > MAX_HISTORY) this.goldenQuarksGains = this.goldenQuarksGains.slice(-MAX_HISTORY);
        if (this.quarksAmounts.length > MAX_HISTORY) this.quarksAmounts = this.quarksAmounts.slice(-MAX_HISTORY);
        if (this.goldenQuarksAmounts.length > MAX_HISTORY) this.goldenQuarksAmounts = this.goldenQuarksAmounts.slice(-MAX_HISTORY);
        if (this.durationsHistory.length > MAX_HISTORY) this.durationsHistory = this.durationsHistory.slice(-MAX_HISTORY);
        if (this.singularityBundles.length > MAX_HISTORY) this.singularityBundles = this.singularityBundles.slice(-MAX_HISTORY);
    }

    public recordSingularity(gainedGoldenQuarks: number, currentGoldenQuarks: number, gainedQuarks: number, currentQuarks: number): void {
        const now = performance.now();
        // `timestamps[0]` is the session start time.
        const singularityDuration = (now - this.timestamps[this.timestamps.length - 1]) / 1000;

        this.timestamps.push(now);

        this.latestGoldenQuarksTotal = currentGoldenQuarks;

        // Handle quarks exactly like golden quarks: use passed totals/gains.
        const realQuarksGain = gainedQuarks;
        this.latestQuarksTotal = currentQuarks;

        this.quarksHistory.push(this.latestQuarksTotal);
        this.goldenQuarksHistory.push(currentGoldenQuarks);

        // Advanced data collection
        const advancedDataCollectionSetting = HSSettings.getSetting('advancedDataCollection');
        if (advancedDataCollectionSetting && advancedDataCollectionSetting.isEnabled()) {
            const bundle: SingularityBundle = {
                singularityNumber: this.timestamps.length - 1,
                totalTime: singularityDuration,
                quarksGained: realQuarksGain,
                goldenQuarksGained: gainedGoldenQuarks,
                totalQuarks: this.latestQuarksTotal,
                totalGoldenQuarks: currentGoldenQuarks,
                phases: Object.fromEntries(this.currentSingularityPhases),
                timestamp: Date.now()
            };

            this.singularityBundles.push(bundle);
        }

        if (singularityDuration > 0) {
            // Use wallet delta (realQuarksGain) to keep rates consistent with what the player sees.
            const qRate = realQuarksGain / singularityDuration;
            const gqRate = gainedGoldenQuarks / singularityDuration;

            this.quarksGains.push(qRate);
            this.quarksAmounts.push(realQuarksGain);
            this.durationsHistory.push(singularityDuration);

            this.goldenQuarksGains.push(gqRate);
            this.goldenQuarksAmounts.push(gainedGoldenQuarks);

            // O(1) optimization updates
            this.cumulativeSingularityTime += singularityDuration;
            this.cumulativeQuarksGained += realQuarksGain;
            this.cumulativeGoldenQuarksGained += gainedGoldenQuarks;

            // Track sum of rates for O(1) average rate calculation
            this.cumulativeQuarksRate += qRate;
            this.cumulativeGoldenQuarksRate += gqRate;
        }

        this.sessionQuarksGained += realQuarksGain;

        this.pruneHistory();

        // New singularity affects general stats + charts.
        this.sparklineVersion++;

        // Reset phase tracking for new singularity
        this.startLiveTimer();

        this.requestRender({ general: true, sparklines: true, exportBtn: true });
    }

    private getSingularityCount(): number {
        // Return completed singularities (timestamps includes start time)
        return Math.max(0, this.timestamps.length - 1);
    }

    private getSingularityTarget(): number {
        return Number(HSSettings.getSetting('singularityNumber').getValue()) || 0;
    }

    private getSingularityHighest(): number {
        const gameDataAPI = HSModuleManager.getModule<HSGameDataAPI>('HSGameDataAPI');
        const gameData = gameDataAPI?.getGameData();
        return gameData?.highestSingularityCount ?? 0;
    }

    private getStrategyName(): string {
        const setting = HSSettings.getSetting('autosingStrategy');
        const value = setting.getValue();
        const definition = setting.getDefinition();
        const option = definition.settingControl?.selectOptions?.find(opt => String(opt.value) === String(value));

        return option ? option.text : String(value || 'None');
    }

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

    private getLastDuration(): number | null {
        if (this.timestamps.length < 2) {
            return null;
        }
        return (this.timestamps[this.timestamps.length - 1] - this.timestamps[this.timestamps.length - 2]) / 1000;
    }

    private getAverageLast(n: number): number | null {
        if (n <= 0 || this.timestamps.length <= n) {
            return null;
        }

        // OPTIMIZATION: If requesting average of ALL singularities, use cached total
        // Note: timestamps has 1 more entry than intervals (start time)
        // so the count of completed singularities equals the number of intervals.
        const completedCount = this.timestamps.length - 1;
        if (n === completedCount) {
            return this.cumulativeSingularityTime / n;
        }

        let sum = 0;
        for (let i = 1; i <= n; i++) {
            sum += this.timestamps[this.timestamps.length - i] - this.timestamps[this.timestamps.length - (i + 1)];
        }

        return sum / n / 1000;
    }

    private getQuarksPerSecond(quarks: number[]): number | null {
        const isGolden = quarks === this.goldenQuarksHistory;
        const gains = isGolden ? this.goldenQuarksGains : this.quarksGains;
        if (gains.length === 0) return null;

        // OPTIMIZATION: Use cached cumulative rates
        // This preserves the "Arithmetic Mean of Rates" logic [(r1+r2+...rn)/n]
        const totalRateProxy = isGolden ? this.cumulativeGoldenQuarksRate : this.cumulativeQuarksRate;

        return totalRateProxy / gains.length;
    }

    private getLastQuarksGained(quarks: number[]): number | null {
        if (quarks.length === 0) {
            return null;
        }
        if (quarks.length === 1) {
            const isGolden = quarks === this.goldenQuarksHistory;
            const gains = isGolden ? this.goldenQuarksGains : this.quarksGains;
            if (gains.length === 0) return null;

            // Reconstruct the gain from the rate and the time of the first singularity
            const firstSingTime = (this.timestamps[0] - this.startTime) / 1000;
            return gains[0] * firstSingTime;
        }
        return quarks[quarks.length - 1] - quarks[quarks.length - 2];
    }

    private formatNumber(num: number): string {
        return Number(num).toExponential(2).replace('+', '');
    }

    private getPhaseAverage(phase: string): number | null {
        const phaseData = this.phaseHistory.get(phase);
        if (!phaseData || phaseData.times.length === 0) {
            return null;
        }

        const sum = phaseData.times.reduce((acc, time) => acc + time, 0);
        return sum / phaseData.times.length;
    }

    private getPhaseStandardDeviation(phase: string): number | null {
        const phaseData = this.phaseHistory.get(phase);
        if (!phaseData || phaseData.times.length <= 1) {
            return null;
        }

        const count = phaseData.times.length;
        const mean = phaseData.totalTime / count;

        let sumSq = 0;
        for (const t of phaseData.times) {
            sumSq += Math.pow(t - mean, 2);
        }

        return Math.sqrt(sumSq / count);
    }

    private getStandardDeviation(n: number): number | null {
        if (n <= 0 || this.timestamps.length <= 1) { // Need at least 2 timestamps for 1 interval
            return null;
        }

        const count = Math.min(n, this.timestamps.length - 1);

        // Calculate Mean
        let sum = 0;
        const durations: number[] = [];
        for (let i = 1; i <= count; i++) {
            const duration = (this.timestamps[this.timestamps.length - i] - this.timestamps[this.timestamps.length - (i + 1)]) / 1000;
            durations.push(duration);
            sum += duration;
        }
        const mean = sum / count;

        // Calculate Sum of Squares
        let sumSq = 0;
        for (const d of durations) {
            sumSq += Math.pow(d - mean, 2);
        }

        return Math.sqrt(sumSq / count);
    }

    private exportDataAsCSV(): void {
        if (this.singularityBundles.length === 0) {
            alert('No data to export');
            return;
        }

        // Collect all unique phase names
        const allPhaseNames = new Set<string>();
        this.singularityBundles.forEach(bundle => {
            Object.keys(bundle.phases).forEach(phase => allPhaseNames.add(phase));
        });
        const sortedPhaseNames = Array.from(allPhaseNames).sort();

        // Build CSV header
        const headers = [
            'Singularity Number',
            'Total Time (s)',
            'Quarks Gained',
            'Golden Quarks Gained',
            'Total Quarks',
            'Total Golden Quarks',
            'Timestamp',
            ...sortedPhaseNames.map(phase => `Phase: ${phase} (s)`)
        ];

        // Build CSV rows
        const rows = this.singularityBundles.map(bundle => {
            const row = [
                bundle.singularityNumber.toString(),
                bundle.totalTime.toFixed(3),
                bundle.quarksGained.toExponential(6),
                bundle.goldenQuarksGained.toExponential(6),
                bundle.totalQuarks.toExponential(6),
                bundle.totalGoldenQuarks.toExponential(6),
                new Date(bundle.timestamp).toISOString(),
                ...sortedPhaseNames.map(phase => (bundle.phases[phase] || '').toString())
            ];
            return row.join(',');
        });

        // Combine into CSV
        const csv = [headers.join(','), ...rows].join('\n');

        // Create download
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
    }

    private updateDisplay(): void {
        this.requestRender({ general: true, phases: this.showDetailedData, sparklines: true, exportBtn: true });
    }


    private renderGeneralStats(): void {
        const count = this.getSingularityCount();
        const currentQuarks = this.latestQuarksTotal;
        const previousQuarks = this.quarksHistory.length > 1
            ? this.quarksHistory[this.quarksHistory.length - 2]
            : this.initialQuarksWallet;

        const currentGoldenQuarks = this.latestGoldenQuarksTotal;
        const previousGoldenQuarks = this.goldenQuarksHistory.length > 1
            ? this.goldenQuarksHistory[this.goldenQuarksHistory.length - 2]
            : this.initialGoldenQuarksWallet;

        const setTextEl = (el: HTMLElement | null, text: string) => {
            if (el) el.textContent = text;
        };

        const setHtmlEl = (el: HTMLElement | null, html: string) => {
            if (el) el.innerHTML = html;
        };

        // 1. Singularity & Progress
        const target = this.getSingularityTarget();
        if (target !== this.singTarget) {
            this.singTarget = target;
        }
        const highest = this.getSingularityHighest();
        if (highest !== this.singHighest) {
            this.singHighest = highest;
        }
        if (this.singValSpan) {
            this.singValSpan.innerHTML = `<span style="color: #bcb9b9ff; font-weight: bold; font-size: 13px;">S${this.singTarget}</span> <span style="color: #bcb9b9ff;">/ S${this.singHighest}</span>`;
        }
        setTextEl(this.progressValSpan, count.toString());

        // 2. Quarks
        setTextEl(this.quarksTotalSpan, this.formatNumber(currentQuarks));
        setTextEl(this.quarksPrevSpan, `(⇦${this.formatNumber(previousQuarks)})`);

        const quarksPerSec = this.getQuarksPerSecond(this.quarksHistory);
        if (quarksPerSec !== null) {
            setTextEl(this.quarksRateValSpan, `${this.formatNumber(quarksPerSec)}/s`);
            setTextEl(this.quarksRateHrSpan, `(${this.formatNumber(quarksPerSec * 3600)}/hr)`);
        } else {
            setTextEl(this.quarksRateValSpan, `0/s`);
            setTextEl(this.quarksRateHrSpan, `(0/hr)`);
        }

        // 3. Golden Quarks
        setTextEl(this.gquarksTotalSpan, this.formatNumber(currentGoldenQuarks));
        setTextEl(this.gquarksPrevSpan, `(⇦${this.formatNumber(previousGoldenQuarks)})`);

        const goldenQuarksPerSec = this.getQuarksPerSecond(this.goldenQuarksHistory);
        if (goldenQuarksPerSec !== null) {
            setTextEl(this.gquarksRateValSpan, `${this.formatNumber(goldenQuarksPerSec)}/s`);
            setTextEl(this.gquarksRateHrSpan, `(${this.formatNumber(goldenQuarksPerSec * 3600)}/hr)`);
        } else {
            setTextEl(this.gquarksRateValSpan, `0/s`);
            setTextEl(this.gquarksRateHrSpan, `(0/hr)`);
        }

        // 4. Averages
        const avg1 = this.getLastDuration();
        const avg10 = this.getAverageLast(10);
        const avg50 = this.getAverageLast(50);
        const avgAll = this.getAverageLast(count);

        const sd10 = this.getStandardDeviation(10);
        const sd50 = this.getStandardDeviation(50);
        const sdAll = this.getStandardDeviation(count);

        const fmt = (val: number | null, sd: number | null) => {
            if (val === null) return '-';
            const sdStr = sd !== null ? ` <span style="color: #888; font-size: 10px;">(σ ±${sd.toFixed(2)}s)</span>` : '';
            return `${val.toFixed(2)}s${sdStr}`;
        };

        setHtmlEl(this.avg1Span, avg1 !== null ? `${avg1.toFixed(2)}s` : '-');
        setHtmlEl(this.avg10Span, fmt(avg10, sd10));
        setHtmlEl(this.avg50Span, fmt(avg50, sd50));
        setTextEl(this.avgAllCountSpan, count.toString());
        setHtmlEl(this.avgAllSpan, fmt(avgAll, sdAll));
    }

    private renderPhaseStatistics(): void {
        const phaseContainer = this.phaseStatsContainer;
        if (!phaseContainer) return;

        let html = `
            <div style="color: #888; font-size: 10px; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 4px; display: flex; justify-content: center; justify-self: stretch;">Name</div>
            <div style="color: #888; font-size: 10px; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 4px; display: flex; justify-content: center; justify-self: stretch;">Loops</div>
            <div style="color: #888; font-size: 10px; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 4px; display: flex; justify-content: center; justify-self: stretch;">Avg</div>
            <div style="color: #888; font-size: 10px; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 4px; display: flex; justify-content: center; justify-self: stretch;">SD</div>
            <div style="color: #888; font-size: 10px; font-weight: bold; border-bottom: 1px solid #333; padding-bottom: 4px; display: flex; justify-content: center; justify-self: stretch;">Last</div>
        `;

        const sortedPhases = Array.from(this.phaseHistory.entries())
            .sort((a, b) => {
                const idxA = this.cachedStrategyOrder.indexOf(a[0]);
                const idxB = this.cachedStrategyOrder.indexOf(b[0]);

                // If both are in the strategy, respect strategy order
                if (idxA !== -1 && idxB !== -1) return idxA - idxB;

                // If one is in strategy, it comes first
                if (idxA !== -1) return -1;
                if (idxB !== -1) return 1;

                // Fallback: Use previous reliable sort or just keep A-B
                // Using global phases list fallback for sorting unknown phases somewhat predictably
                const globalIdxA = phases.indexOf(a[0] as any);
                const globalIdxB = phases.indexOf(b[0] as any);
                const safeA = globalIdxA === -1 ? 999 : globalIdxA;
                const safeB = globalIdxB === -1 ? 999 : globalIdxB;
                return safeA - safeB;
            });

        sortedPhases.forEach(([phaseName, data]) => {
            if (data.times.length > 0) {
                const avg = data.totalTime / data.times.length;
                const last = data.lastTime;
                const sd = this.getPhaseStandardDeviation(phaseName);
                const sdStr = sd !== null ? `±${sd.toFixed(2)}s` : '-';
                const avgLoops = 1 + (data.repeats / data.times.length);
                const count = data.times.length;

                html += `
                    <div style="color: #B33A3A; font-size: 12px; padding: 2px 4px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; border-bottom: 1px solid #222; text-align: left; justify-self: start;"><span style="color: #888; font-size: 10px; margin-right: 2px;">x${count}</span> ${phaseName}</div>
                    <div style="color: #888; font-size: 11px; padding: 2px 4px; text-align: right; border-bottom: 1px solid #222;">x${avgLoops.toFixed(2)}</div>
                    <div style="color: #FF8A80; font-size: 12px; padding: 2px 4px; text-align: right; border-bottom: 1px solid #222;">${avg.toFixed(2)}s</div>
                    <div style="color: #888; font-size: 10px; padding: 2px 4px; text-align: right; border-bottom: 1px solid #222;">${sdStr}</div>
                    <div style="color: #FF8A80; font-size: 12px; padding: 2px 4px; text-align: right; border-bottom: 1px solid #222;">${last.toFixed(2)}s</div>
                `;
            }
        });

        phaseContainer.innerHTML = html || '<div style="color: #666; font-style: italic; font-size: 12px; grid-column: span 5;">No data yet...</div>';
    }

    private renderSparklines(): void {
        const setTextEl = (el: HTMLElement | null, text: string) => {
            if (el) el.textContent = text;
        };

        if (this.showDetailedData) {
            setTextEl(this.footerVersionSpan, this.modVersion);
            setTextEl(this.footerStrategySpan, this.strategyName);
            setTextEl(this.footerLoadoutsSpan, this.loadoutsOrder.join(', '));

            // Quarks
            if (this.quarksAmounts.length >= 2) {
                const spark1 = this.generateSparklineMetadata(this.quarksAmounts, 230, 30);
                if (this.sparklineContainer1) {
                    this.sparklineContainer1.innerHTML = `
                        <svg width="230" height="30" style="display: block; overflow: visible;">
                            <line x1="0" y1="${spark1.avgY}" x2="230" y2="${spark1.avgY}" stroke="#00BCD4" stroke-opacity="0.9" stroke-width="1" stroke-dasharray="4, 2" />
                            <polyline fill="none" stroke="#00BCD4" stroke-width="1" stroke-opacity="0.7" points="${spark1.points}" />
                            <line x1="226" y1="${spark1.maxY}" x2="230" y2="${spark1.maxY}" stroke="#00BCD4" stroke-width="1" />
                            <line x1="226" y1="${spark1.minY}" x2="230" y2="${spark1.minY}" stroke="#00BCD4" stroke-width="1" />
                        </svg>
                        <div class="hs-sparkline-labels">
                            <span class="hs-sparkline-muted">+${this.formatNumber(spark1.max)}</span>
                            <span style="color: #00BCD4; font-weight: bold;">+${this.formatNumber(spark1.avg)} avg</span>
                            <span class="hs-sparkline-muted">+${this.formatNumber(spark1.min)}</span>
                        </div>
                    `;
                }
            }

            // Golden Quarks
            if (this.goldenQuarksAmounts.length >= 2) {
                const spark2 = this.generateSparklineMetadata(this.goldenQuarksAmounts, 230, 30);
                if (this.sparklineContainer2) {
                    this.sparklineContainer2.innerHTML = `
                        <svg width="230" height="30" style="display: block; overflow: visible;">
                            <line x1="0" y1="${spark2.avgY}" x2="230" y2="${spark2.avgY}" stroke="#F1FA8C" stroke-opacity="0.9" stroke-width="1" stroke-dasharray="4, 2" />
                            <polyline fill="none" stroke="#F1FA8C" stroke-width="1" stroke-opacity="0.7" points="${spark2.points}" />
                            <line x1="226" y1="${spark2.maxY}" x2="230" y2="${spark2.maxY}" stroke="#F1FA8C" stroke-width="1" />
                            <line x1="226" y1="${spark2.minY}" x2="230" y2="${spark2.minY}" stroke="#F1FA8C" stroke-width="1" />
                        </svg>
                        <div class="hs-sparkline-labels">
                            <span class="hs-sparkline-muted">+${this.formatNumber(spark2.max)}</span>
                            <span style="color: #F1FA8C; font-weight: bold;">+${this.formatNumber(spark2.avg)} avg</span>
                            <span class="hs-sparkline-muted">+${this.formatNumber(spark2.min)}</span>
                        </div>
                    `;
                }
            }

            // Times
            if (this.durationsHistory.length >= 2) {
                const spark3 = this.generateSparklineMetadata(this.durationsHistory, 230, 30);
                if (this.sparklineContainer3) {
                    this.sparklineContainer3.innerHTML = `
                        <svg width="230" height="30" style="display: block; overflow: visible;">
                            <line x1="0" y1="${spark3.avgY}" x2="230" y2="${spark3.avgY}" stroke="#FF8A80" stroke-opacity="0.9" stroke-width="1" stroke-dasharray="4, 2" />
                            <polyline fill="none" stroke="#FF8A80" stroke-width="1" stroke-opacity="0.8" points="${spark3.points}" />
                            <line x1="226" y1="${spark3.maxY}" x2="230" y2="${spark3.maxY}" stroke="#FF8A80" stroke-width="1" />
                            <line x1="226" y1="${spark3.minY}" x2="230" y2="${spark3.minY}" stroke="#FF8A80" stroke-width="1" />
                        </svg>
                        <div class="hs-sparkline-labels">
                            <span class="hs-sparkline-muted">${spark3.max.toFixed(2)}s</span>
                            <span style="color: #FF8A80; font-weight: bold;">${spark3.avg.toFixed(2)}s avg</span>
                            <span class="hs-sparkline-muted">${spark3.min.toFixed(2)}s</span>
                        </div>
                    `;
                }
            }

            if (this.stepContainer) this.stepContainer.style.display = 'block';
            if (this.footerSection) this.footerSection.style.display = 'block';

            // Detailed-only: Phase stats + extended averages
            if (this.phaseStatsWrapper) this.phaseStatsWrapper.style.display = 'block';
            if (this.avg10LabelSpan) this.avg10LabelSpan.style.display = '';
            if (this.avg10Span) this.avg10Span.style.display = '';
            if (this.avg50LabelSpan) this.avg50LabelSpan.style.display = '';
            if (this.avg50Span) this.avg50Span.style.display = '';

            if (this.sparklineContainer1) this.sparklineContainer1.style.display = 'flex';
            if (this.sparklineContainer2) this.sparklineContainer2.style.display = 'flex';
            if (this.sparklineContainer3) this.sparklineContainer3.style.display = 'flex';
        } else {
            if (this.stepContainer) this.stepContainer.style.display = 'none';
            if (this.footerSection) this.footerSection.style.display = 'none';

            // Detailed-only: Phase stats + extended averages
            if (this.phaseStatsWrapper) this.phaseStatsWrapper.style.display = 'none';
            if (this.avg10LabelSpan) this.avg10LabelSpan.style.display = 'none';
            if (this.avg10Span) this.avg10Span.style.display = 'none';
            if (this.avg50LabelSpan) this.avg50LabelSpan.style.display = 'none';
            if (this.avg50Span) this.avg50Span.style.display = 'none';

            if (this.sparklineContainer1) this.sparklineContainer1.style.display = 'none';
            if (this.sparklineContainer2) this.sparklineContainer2.style.display = 'none';
            if (this.sparklineContainer3) this.sparklineContainer3.style.display = 'none';
        }
    }

    public show(): void {
        if (this.timerDisplay) {
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
        this.timestamps = [];
        this.quarksHistory = [];
        this.goldenQuarksHistory = [];
        this.quarksGains = [];
        this.goldenQuarksGains = [];
        this.quarksAmounts = [];
        this.goldenQuarksAmounts = [];
        this.durationsHistory = [];
        this.startTime = 0;
        this.phaseHistory.clear();
        this.singularityBundles = [];
        this.sessionQuarksGained = 0;
        this.sessionGoldenQuarksGained = 0;
        this.lastRecordedPhaseName = null;
        this._currentPhaseName = '';
        this._currentStepName = '';
        this._currentStepMaxTime = null;
        this.stopLiveTimer();
        this.currentLiveTime = 0;
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

    private updateTimers(): void {
        if (!this.dynamicContent || this.isMinimized) return;

        if (this.liveTimerSpan) {
            this.liveTimerSpan.textContent = `${this.currentLiveTime.toFixed(2)}s`;
        }

        const phaseTime = this._currentPhaseName ? (performance.now() - this.currentPhaseStart) / 1000 : 0;
        if (this.phaseTimerSpan) {
            this.phaseTimerSpan.textContent = this._currentPhaseName ? `(${phaseTime.toFixed(2)}s)` : '';
        }

        if (this.showDetailedData) {
            const stepTime = this._currentStepName ? (performance.now() - this._currentStepStart) / 1000 : 0;
            if (this.stepTimerSpan) {
                let stepTimerDisplay = '';
                if (this._currentStepName) {
                    stepTimerDisplay = `(${stepTime.toFixed(2)}s`;
                    if (this._currentStepMaxTime && this._currentStepMaxTime < 999999) {
                        stepTimerDisplay += ` / ${(this._currentStepMaxTime / 1000).toFixed(2)}s`;
                    }
                    stepTimerDisplay += `)`;
                }
                this.stepTimerSpan.textContent = stepTimerDisplay;
            }
        }
    }

    /**
     * Logic to generate SVG path and metadata for singularity charts.
     * Handles 'flat' data (no change) by centering the line and aligning the avgY to it.
     */
    private generateSparklineMetadata(data: number[], width: number, height: number): { path: string, points: string, max: number, min: number, avg: number, avgY: number, maxY: number, minY: number, lastX: number, lastY: number } {
        if (data.length < 1) return { path: '', points: '', max: 0, min: 0, avg: 0, avgY: height / 2, maxY: 0, minY: height, lastX: 0, lastY: height / 2 };

        const startIdx = Math.max(0, data.length - 50);
        let max = -Infinity;
        let min = Infinity;
        let sum = 0;
        let count = 0;
        for (let i = startIdx; i < data.length; i++) {
            const v = data[i];
            if (v > max) max = v;
            if (v < min) min = v;
            sum += v;
            count++;
        }
        const avg = count > 0 ? (sum / count) : 0;

        // If the formatted values are identical, treat as flat line to avoid "noise bumps"
        if (this.formatNumber(max) === this.formatNumber(min)) {
            const centerY = height / 2;
            return {
                path: `M 0,${centerY.toFixed(1)} L ${width},${centerY.toFixed(1)}`,
                points: `0,${centerY.toFixed(1)} ${width},${centerY.toFixed(1)}`,
                max: max,
                min: min,
                avg: avg,
                avgY: centerY,
                maxY: centerY,
                minY: centerY,
                lastX: width,
                lastY: centerY
            };
        }

        const range = max - min;
        if (range === 0 || count === 1) {
            const centerY = height / 2;
            return {
                path: `M 0,${centerY.toFixed(1)} L ${width},${centerY.toFixed(1)}`,
                points: `0,${centerY.toFixed(1)} ${width},${centerY.toFixed(1)}`,
                max: max,
                min: min,
                avg: avg,
                avgY: centerY,
                maxY: centerY,
                minY: centerY,
                lastX: width,
                lastY: centerY
            };
        }

        // Add 10% padding to top and bottom
        const padding = range * 0.1;
        const displayMin = min - padding;
        const displayRange = range + 2 * padding;

        // Use the relevant slice of the provided data (respecting startIdx)
        const subset = data.slice(startIdx);
        const pointsArray = subset.map((val, i) => {
            const x = (i / (subset.length - 1)) * width;
            const y = height - ((val - displayMin) / displayRange) * height;
            return { x, y, str: `${x.toFixed(1)},${y.toFixed(1)}` };
        });

        const pointsStr = pointsArray.map(p => p.str).join(' ');
        const lastPoint = pointsArray[pointsArray.length - 1];

        // Calculate Avg Y position
        const avgY = height - ((avg - displayMin) / displayRange) * height;
        const maxY = height - ((max - displayMin) / displayRange) * height;
        const minY = height - ((min - displayMin) / displayRange) * height;

        return {
            path: `M ${pointsArray.map(p => p.str).join(' L ')}`,
            points: pointsStr,
            max: max,
            min: min,
            avg: avg,
            avgY: avgY,
            maxY: maxY,
            minY: minY,
            lastX: lastPoint.x,
            lastY: lastPoint.y
        };
    }



}