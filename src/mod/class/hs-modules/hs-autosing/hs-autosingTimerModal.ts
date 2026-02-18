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
import Decimal from "break_infinity.js";
import { compressToUTF16, decompressFromUTF16 } from 'lz-string';

interface SingularityBundle {
    singularityNumber: number;
    totalTime: number;
    quarksGained: number;
    goldenQuarksGained: number;
    totalQuarks: number;
    totalGoldenQuarks: number;
    phases: { [phaseName: string]: number };
    timestamp: number;
    c15?: string;
}

interface SparklineDom {
    container: HTMLElement;
    svg: SVGSVGElement;
    polyline: SVGPolylineElement;
    ratePolyline: SVGPolylineElement | null;
    maxLine: SVGLineElement;
    minLine: SVGLineElement;
    labelMax: HTMLSpanElement;
    labelAvg: HTMLSpanElement;
    labelMin: HTMLSpanElement;
    isTime: boolean;
    color: string;
    lastWidth: number;
    lastPoints: string;
    lastPointsSecond: string;
    lastMaxY: number;
    lastMinY: number;
    lastMarkerX: number;
    lastLabelMax: string;
    lastLabelAvg: string;
    lastLabelMin: string;
}

interface PhaseRowDom {
    nameCell: HTMLDivElement;
    nameCountSpan: HTMLSpanElement;
    nameTextSpan: HTMLSpanElement;
    loopsCell: HTMLDivElement;
    avgCell: HTMLDivElement;
    sdCell: HTMLDivElement;
    lastCell: HTMLDivElement;
    cells: HTMLDivElement[];
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
    private dragBounds = { width: 0, height: 0, maxX: 0, maxY: 0 };

    private onMouseMoveHandler = (e: MouseEvent) => this.onMouseMove(e);
    private onMouseUpHandler = () => this.onMouseUp();

    private singularityCount: number = 0;
    private lastSingularityTimestamp: number = 0;
    private lastSingularityDuration: number | null = null;
    private quarksGainsCount: number = 0;
    private goldenQuarksGainsCount: number = 0;
    private quarksAmounts: {gain: number, timestamp: number, duration: number}[] = [];
    private goldenQuarksAmounts: {gain: number, timestamp: number, duration: number}[] = [];
    private c15Count: number = 0;
    private c15Mean: Decimal = new Decimal(0);
    private c15M2: Decimal = new Decimal(0);
    // Online (Welford) stats for log(C15) to enable O(1) variance/std computation
    private logC15Count: number = 0;
    private logC15Mean: number = 0;
    private logC15M2: number = 0;
    private durationsHistory: {value: number, timestamp: number}[] = [];
    private startTime: number = 0;

    // Phase tracking
    private currentSingularityStart: number = 0;
    private currentPhaseStart: number = 0;
    private _currentPhaseName: string = ''; // Backing field for setter
    private phaseHistory: Map<string, { count: number, totalTime: number, sumSq: number, lastTime: number, repeats: number }> = new Map();
    private currentSingularityPhases: Map<string, number> = new Map();

    // Merge Logic State
    private lastRecordedPhaseName: string | null = null;

    // Live timer
    private liveTimerInterval: number | null = null;

    // Advanced data collection
    private singularityBundles: SingularityBundle[] = [];
    private compressedBundles: string[] = [];
    private currentBatch: SingularityBundle[] = [];
    private readonly batchSize = 10;
    private dbName = 'HSAutosingData';
    private storeName = 'singularityBundles';

    // Checksum for O(1) avg calculations
    private cumulativeQuarksGained: number = 0;
    private cumulativeGoldenQuarksGained: number = 0;
    private cumulativeSingularityTime: number = 0;

    // Prefix sums for O(1) windowed averages/variance of singularity durations
    private durationsPrefixSum: number[] = [0];
    private durationsPrefixSumSq: number[] = [0];
    private readonly sparklineMaxPoints: number = 50;

    // Latest snapshot for UI display
    private latestQuarksTotal: number = 0;
    private latestGoldenQuarksTotal: number = 0;

    // Running totals for performance optimization (capped arrays)
    private cumulativeDuration: number = 0;
    private maxDuration: number = 0;
    private minDuration: number = Infinity;
    private cumulativeQuarksGains: number = 0;
    private maxQuarksGains: number = 0;
    private minQuarksGains: number = Infinity;
    private cumulativeGQuarksGains: number = 0;
    private maxGQuarksGains: number = 0;
    private minGQuarksGains: number = Infinity;

    // All-time statistics (across all singularities)
    private allTimeCumulativeDuration: number = 0;
    private allTimeMaxDuration: number = 0;
    private allTimeMinDuration: number = Infinity;
    private allTimeCumulativeQuarksGains: number = 0;
    private allTimeMaxQuarksGains: number = 0;
    private allTimeMinQuarksGains: number = Infinity;
    private allTimeCumulativeGQuarksGains: number = 0;
    private allTimeMaxGQuarksGains: number = 0;
    private allTimeMinGQuarksGains: number = Infinity;

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
    private advancedDataCollectionEnabled: boolean = false;
    private stopButton!: HTMLButtonElement;
    private restartButton!: HTMLButtonElement;
    private finishStopBtn!: HTMLButtonElement;
    private chartToggleBtn: HTMLButtonElement | null = null;
    private minimizeBtn!: HTMLButtonElement;

    // Cached Spans & Containers for Ticker
    private liveTimerSpan: HTMLElement | null = null;
    private phaseTimerSpan: HTMLElement | null = null;
    private phaseNameSpan: HTMLElement | null = null;
    private footerSection: HTMLElement | null = null;
    private singValSpan: HTMLElement | null = null;
    private singTargetSpan: HTMLElement | null = null;
    private singHighestSpan: HTMLElement | null = null;
    private progressValSpan: HTMLElement | null = null;
    private c15TopSpan: HTMLElement | null = null;
    private c15SigmaSpan: HTMLElement | null = null;

    private cachedStrategyOrder: string[] = [];
    private cachedStrategyOrderIndex: Map<string, number> = new Map();
    private cachedGlobalPhaseIndex: Map<string, number> = new Map();

    // Cached nodes for general stats updates
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

    // Built-once DOM helpers
    private staticDomInitialized: boolean = false;
    private avgSpanParts: Map<HTMLElement, { main: HTMLSpanElement; sd: HTMLSpanElement }> = new Map();

    private phaseHeaderNodes: HTMLDivElement[] = [];
    private phaseEmptyNode: HTMLDivElement | null = null;
    private phaseRowMap: Map<string, PhaseRowDom> = new Map();

    private sparklineQuarks: SparklineDom | null = null;
    private sparklineGoldenQuarks: SparklineDom | null = null;
    private sparklineTimes: SparklineDom | null = null;

    // Cached nodes for phase stats & sparklines
    private phaseStatsContainer: HTMLElement | null = null;
    private phaseStatsWrapper: HTMLElement | null = null;
    private sparklineContainer1: HTMLElement | null = null;
    private sparklineContainer2: HTMLElement | null = null;
    private sparklineContainer3: HTMLElement | null = null;
    private footerVersionSpan: HTMLElement | null = null;
    private footerStrategySpan: HTMLElement | null = null;
    private footerLoadoutsSpan: HTMLElement | null = null;
    private resizeHandleElem: HTMLElement | null = null;

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

    // Auto-resize / graph sizing
    private autoResized: boolean = false;
    private computedMaxWidth: number | null = null; // px
    private computedMaxHeight: number | null = null; // px
    private computedGraphWidth: number | null = null; // px

    constructor() {
        this.createTimerDisplay();
        this.setupDragAndResize();
        this.cachedGlobalPhaseIndex = new Map();
        phases.forEach((phase, i) => {
            this.cachedGlobalPhaseIndex.set(phase as unknown as string, i);
        });
    }

    private async openDB(): Promise<IDBDatabase> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);
            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName, { keyPath: 'id', autoIncrement: true });
                }
            };
            request.onsuccess = (event) => {
                resolve((event.target as IDBOpenDBRequest).result);
            };
            request.onerror = (event) => {
                reject(event.target);
            };
        });
    }

    private async storeBundle(compressedBundle: string): Promise<void> {
        const db = await this.openDB();
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        store.add({ data: compressedBundle, timestamp: Date.now() });
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    private async loadBundles(): Promise<string[]> {
        const db = await this.openDB();
        const transaction = db.transaction([this.storeName], 'readonly');
        const store = transaction.objectStore(this.storeName);
        const request = store.getAll();
        return new Promise((resolve, reject) => {
            request.onsuccess = () => {
                const results = request.result as { data: string }[];
                resolve(results.map(r => r.data));
            };
            request.onerror = () => reject(request.error);
        });
    }

    private async clearBundles(): Promise<void> {
        const db = await this.openDB();
        const transaction = db.transaction([this.storeName], 'readwrite');
        const store = transaction.objectStore(this.storeName);
        store.clear();
        return new Promise((resolve, reject) => {
            transaction.oncomplete = () => resolve();
            transaction.onerror = () => reject(transaction.error);
        });
    }

    private ensureStaticDom(): void {
        if (this.staticDomInitialized) return;
        this.staticDomInitialized = true;

        this.initSingularityHeaderDom();
        this.initAverageDom();
        this.initPhaseStatsDom();
        this.initSparklineDom();
    }

    private syncAdvancedDataCollectionEnabled(): void {
        const setting = HSSettings.getSetting('advancedDataCollection');
        const enabled = !!setting && setting.isEnabled();
        if (enabled === this.advancedDataCollectionEnabled) return;

        this.advancedDataCollectionEnabled = enabled;
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

    private initAverageDom(): void {
        // avg1 does not show sigma, keep as textContent
        this.ensureAvgSpanStructure(this.avg10Span);
        this.ensureAvgSpanStructure(this.avg50Span);
        this.ensureAvgSpanStructure(this.avgAllSpan);
    }

    private initPhaseStatsDom(): void {
        if (!this.phaseStatsContainer) return;

        this.phaseHeaderNodes = [];
        this.phaseEmptyNode = document.createElement('div');
        this.phaseEmptyNode.className = 'hs-phase-empty';
        this.phaseEmptyNode.textContent = 'No data yet...';

        const mkHeader = (label: string, isTitle = false) => {
            const div = document.createElement('div');
            div.className = isTitle ? 'hs-phase-header-title' : 'hs-phase-header';
            div.textContent = label;
            return div;
        };

        this.phaseHeaderNodes.push(mkHeader('PHASE STATISTICS', true));
        this.phaseHeaderNodes.push(mkHeader('Loops'));
        this.phaseHeaderNodes.push(mkHeader('Avg'));
        this.phaseHeaderNodes.push(mkHeader('SD'));
        this.phaseHeaderNodes.push(mkHeader('Last'));

        // Render initial empty grid
        const frag = document.createDocumentFragment();
        this.phaseHeaderNodes.forEach(n => frag.appendChild(n));
        frag.appendChild(this.phaseEmptyNode);
        this.phaseStatsContainer.replaceChildren(frag);
    }

    private createPhaseRowDom(phaseName: string): PhaseRowDom {
        const mkCell = (className: string) => {
            const div = document.createElement('div');
            div.className = className;
            return div;
        };

        const nameCell = mkCell('hs-phase-name');
        const nameCountSpan = document.createElement('span');
        nameCountSpan.className = 'hs-phase-count';
        const nameTextSpan = document.createElement('span');
        nameTextSpan.className = 'hs-phase-text';
        nameTextSpan.textContent = phaseName;
        nameCell.appendChild(nameCountSpan);
        nameCell.appendChild(nameTextSpan);

        const loopsCell = mkCell('hs-phase-loops');
        const avgCell = mkCell('hs-phase-avg');
        const sdCell = mkCell('hs-phase-sd');
        const lastCell = mkCell('hs-phase-last');

        const cells = [nameCell, loopsCell, avgCell, sdCell, lastCell];
        return { nameCell, nameCountSpan, nameTextSpan, loopsCell, avgCell, sdCell, lastCell, cells };
    }

    private initSparklineDom(): void {
        const build = (container: HTMLElement | null, color: string, isTime: boolean): SparklineDom | null => {
            if (!container) return null;

            // Build [svg][labels] once.
            container.textContent = '';

            const ns = 'http://www.w3.org/2000/svg';
            const svg = document.createElementNS(ns, 'svg');
            svg.setAttribute('height', '30');
            svg.style.display = 'block';
            svg.style.overflow = 'visible';

            const polyline = document.createElementNS(ns, 'polyline');
            polyline.setAttribute('fill', 'none');
            polyline.setAttribute('stroke', color);
            polyline.setAttribute('stroke-width', '1');
            polyline.setAttribute('stroke-opacity', '0.8');

            let ratePolyline: SVGPolylineElement | null = null;
            ratePolyline = document.createElementNS(ns, 'polyline');
            ratePolyline.setAttribute('fill', 'none');
            ratePolyline.setAttribute('stroke', color);
            ratePolyline.setAttribute('stroke-width', '1');
            ratePolyline.setAttribute('stroke-opacity', '0.5');
            ratePolyline.setAttribute('stroke-dasharray', '2,2');

            const maxLine = document.createElementNS(ns, 'line');
            maxLine.setAttribute('stroke', color);
            maxLine.setAttribute('stroke-width', '1');

            const minLine = document.createElementNS(ns, 'line');
            minLine.setAttribute('stroke', color);
            minLine.setAttribute('stroke-width', '1');

            svg.appendChild(polyline);
            if (ratePolyline) svg.appendChild(ratePolyline);
            svg.appendChild(maxLine);
            svg.appendChild(minLine);

            const labels = document.createElement('div');
            labels.className = 'hs-sparkline-labels';

            const labelMax = document.createElement('span');
            labelMax.className = 'hs-sparkline-muted';
            const labelAvg = document.createElement('span');
            labelAvg.className = 'hs-sparkline-avg';
            labelAvg.style.color = color;
            labelAvg.style.fontWeight = 'bold';
            const labelMin = document.createElement('span');
            labelMin.className = 'hs-sparkline-muted';

            labels.appendChild(labelMax);
            labels.appendChild(labelAvg);
            labels.appendChild(labelMin);

            container.appendChild(svg);
            container.appendChild(labels);

            return { container, svg, polyline, ratePolyline, maxLine, minLine, labelMax, labelAvg, labelMin, isTime, color, lastWidth: 0, lastPoints: '', lastPointsSecond: '', lastMarkerX: 0, lastMaxY: 0, lastMinY: 0, lastLabelMax: '', lastLabelAvg: '', lastLabelMin: '' };
        };

        this.sparklineQuarks = build(this.sparklineContainer1, '#00BCD4', false);
        this.sparklineGoldenQuarks = build(this.sparklineContainer2, '#F1FA8C', false);
        this.sparklineTimes = build(this.sparklineContainer3, '#FF8A80', true);
    }

    private updateSparkline(dom: SparklineDom | null, data: any[]): void {
        if (!dom) return;
        // Only show meaningful sparklines when at least 2 points exist.
        if (data.length < 2) {
            dom.polyline.setAttribute('points', '');
            if (dom.ratePolyline) dom.ratePolyline.setAttribute('points', '');
            dom.labelMax.textContent = '';
            dom.labelAvg.textContent = '';
            dom.labelMin.textContent = '';
            return;
        }

        const gw = this.computedGraphWidth || 230;
        const times = data.map(d => d.timestamp);
        const minTime = Math.min(...times);
        const maxTime = Math.max(...times);
        const timeRange = maxTime - minTime || 1;

        const widthChanged = dom.lastWidth !== gw;
        if (widthChanged) {
            dom.svg.setAttribute('width', `${gw}`);
            dom.lastWidth = gw;
        }

        if (dom.isTime) {
            // For times, use standard logic but with time-based x
            const values = data.map(d => d.value);
            const min = Math.min(...values);
            const max = Math.max(...values);
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            const points = data.map(d => {
                const x = ((d.timestamp - minTime) / timeRange) * gw;
                const y = 30 - ((d.value - min) / (max - min || 1)) * 30;
                return `${x},${y}`;
            }).join(' ');

            if (dom.lastPoints !== points) {
                dom.polyline.setAttribute('points', points);
                dom.lastPoints = points;
            }

            const pointsSecond: string[] = [];
            for (let i = 0; i < data.length; i++) {
                const x = (i / (data.length - 1)) * gw;
                const y = 30 - ((data[i].value - min) / (max - min || 1)) * 30;
                pointsSecond.push(`${x},${y}`);
            }
            const pointsSecondStr = pointsSecond.join(' ');
            if (dom.ratePolyline && dom.lastPointsSecond !== pointsSecondStr) {
                dom.ratePolyline.setAttribute('points', pointsSecondStr);
                dom.lastPointsSecond = pointsSecondStr;
            }

            const markerX = Math.max(0, gw - 4);
            const maxY = 30 - ((max - min) / (max - min || 1)) * 30;
            const minY = 30 - ((min - min) / (max - min || 1)) * 30;

            if (dom.lastMarkerX !== markerX || widthChanged || dom.lastMaxY !== maxY) {
                const gwStr = `${gw}`;
                const markerXStr = `${markerX}`;
                const maxYStr = `${maxY}`;
                dom.maxLine.setAttribute('x1', markerXStr);
                dom.maxLine.setAttribute('x2', gwStr);
                dom.maxLine.setAttribute('y1', maxYStr);
                dom.maxLine.setAttribute('y2', maxYStr);
                dom.lastMarkerX = markerX;
                dom.lastMaxY = maxY;
            }

            if (dom.lastMarkerX !== markerX || widthChanged || dom.lastMinY !== minY) {
                const gwStr = `${gw}`;
                const markerXStr = `${markerX}`;
                const minYStr = `${minY}`;
                dom.minLine.setAttribute('x1', markerXStr);
                dom.minLine.setAttribute('x2', gwStr);
                dom.minLine.setAttribute('y1', minYStr);
                dom.minLine.setAttribute('y2', minYStr);
                dom.lastMarkerX = markerX;
                dom.lastMinY = minY;
            }

            const labelMax = `${max.toFixed(2)}s`;
            const labelAvg = `${avg.toFixed(2)}s avg`;
            const labelMin = `${min.toFixed(2)}s`;
            if (dom.lastLabelMax !== labelMax) {
                dom.labelMax.textContent = labelMax;
                dom.lastLabelMax = labelMax;
            }
            if (dom.lastLabelAvg !== labelAvg) {
                dom.labelAvg.textContent = labelAvg;
                dom.lastLabelAvg = labelAvg;
            }
            if (dom.lastLabelMin !== labelMin) {
                dom.labelMin.textContent = labelMin;
                dom.lastLabelMin = labelMin;
            }
        } else {
            // For quarks/golden
            let last50TotalGain = 0;
            let last50TotalTime = 0;
            let sessionTotalGain = 0;
            let sessionTotalTime = 0;
            let minY = Infinity;
            let maxY = -Infinity;
            const runningAverages: number[] = [];
            const individualRates: number[] = [];
            // First pass: calculate running averages and individual rates
            for (let i = 0; i < data.length; i++) {
                const d = data[i];
                // For session running average (solid line)
                sessionTotalGain += d.gain;
                sessionTotalTime += d.duration;
                const runningAvg = sessionTotalGain / sessionTotalTime;
                runningAverages.push(runningAvg);
                // For last 50 average (label)
                if (i >= data.length - 50) {
                    last50TotalGain += d.gain;
                    last50TotalTime += d.duration;
                }
                const individualRate = d.gain / d.duration;
                individualRates.push(individualRate);
            }
            // Find min/max across both running averages and individual rates
            for (let i = 0; i < data.length; i++) {
                minY = Math.min(minY, runningAverages[i], individualRates[i]);
                maxY = Math.max(maxY, runningAverages[i], individualRates[i]);
            }
            const yRange = maxY - minY || 1;
            const pointsMain: string[] = [];
            const pointsSecond: string[] = [];
            // Second pass: build points for polylines
            for (let i = 0; i < data.length; i++) {
                const d = data[i];
                const x = ((d.timestamp - minTime) / timeRange) * gw;
                const yMain = 30 - ((runningAverages[i] - minY) / yRange) * 30;
                pointsMain.push(`${x},${yMain}`);
                const ySecond = 30 - ((individualRates[i] - minY) / yRange) * 30;
                pointsSecond.push(`${x},${ySecond}`);
            }

            const pointsMainStr = pointsMain.join(' ');
            const pointsSecondStr = pointsSecond.join(' ');

            if (dom.lastPoints !== pointsMainStr) {
                dom.polyline.setAttribute('points', pointsMainStr);
                dom.lastPoints = pointsMainStr;
            }

            if (dom.ratePolyline && dom.lastPointsSecond !== pointsSecondStr) {
                dom.ratePolyline.setAttribute('points', pointsSecondStr);
                dom.lastPointsSecond = pointsSecondStr;
            }

            const markerX = Math.max(0, gw - 4);
            const maxYPos = 30 - ((maxY - minY) / yRange) * 30;
            const minYPos = 30 - ((minY - minY) / yRange) * 30;

            if (dom.lastMarkerX !== markerX || widthChanged || dom.lastMaxY !== maxYPos) {
                const gwStr = `${gw}`;
                const markerXStr = `${markerX}`;
                const maxYStr = `${maxYPos}`;
                dom.maxLine.setAttribute('x1', markerXStr);
                dom.maxLine.setAttribute('x2', gwStr);
                dom.maxLine.setAttribute('y1', maxYStr);
                dom.maxLine.setAttribute('y2', maxYStr);
                dom.lastMarkerX = markerX;
                dom.lastMaxY = maxYPos;
            }

            if (dom.lastMarkerX !== markerX || widthChanged || dom.lastMinY !== minYPos) {
                const gwStr = `${gw}`;
                const markerXStr = `${markerX}`;
                const minYStr = `${minYPos}`;
                dom.minLine.setAttribute('x1', markerXStr);
                dom.minLine.setAttribute('x2', gwStr);
                dom.minLine.setAttribute('y1', minYStr);
                dom.minLine.setAttribute('y2', minYStr);
                dom.lastMarkerX = markerX;
                dom.lastMinY = minYPos;
            }

            const labelMax = `${this.formatNumberWithSign(maxY)} /s`;
            const labelAvg = `${this.formatNumberWithSign(last50TotalGain / last50TotalTime)} /s`;
            const labelMin = `${this.formatNumberWithSign(minY)} /s`;
            if (dom.lastLabelMax !== labelMax) {
                dom.labelMax.textContent = labelMax;
                dom.lastLabelMax = labelMax;
            }
            if (dom.lastLabelAvg !== labelAvg) {
                dom.labelAvg.textContent = labelAvg;
                dom.lastLabelAvg = labelAvg;
            }
            if (dom.lastLabelMin !== labelMin) {
                dom.labelMin.textContent = labelMin;
                dom.lastLabelMin = labelMin;
            }
        }
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

            if (this.showDetailedData) {
                // Showing detailed data: enable auto-sizing
                this.timerDisplay!.style.width = 'auto';
                this.timerDisplay!.style.height = 'auto';
            } else {
                // Hiding detailed data: lock current width to prevent shrinking
                const currentWidth = this.timerDisplay!.offsetWidth;
                this.timerDisplay!.style.width = `${currentWidth}px`;
            }

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
                <div id="hs-sparkline-container-3" class="hs-sparkline-row"></div>
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
                <div id="hs-sparkline-container-1" class="hs-sparkline-row"></div>
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
                <div id="hs-sparkline-container-2" class="hs-sparkline-row"></div>
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
                <div class="hs-info-line-detailed"><span class="hs-timer-label">Active Strategy: </span> <span id="hs-footer-strategy" class="hs-detailed-value"></span></div>
                <div class="hs-info-line-detailed hs-footer-loadouts"><span class="hs-timer-label">Amb Loadouts Order: </span> <span id="hs-footer-loadouts" class="hs-detailed-value"></span></div>
            </div>
        `;
        this.timerContent.appendChild(this.dynamicContent);

        /* ---------- RESIZE HANDLE ---------- */
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'hs-resize-handle';
        resizeHandle.onmousedown = (e) => this.startResize(e);
        this.resizeHandleElem = resizeHandle;

        /* ---------- ASSEMBLE ---------- */
        this.timerDisplay.appendChild(this.timerHeader);
        this.timerDisplay.appendChild(this.timerContent);
        this.timerDisplay.appendChild(resizeHandle);
        document.body.appendChild(this.timerDisplay);

        // AFTER appending to body, find and cache elements
        this.liveTimerSpan = document.getElementById('hs-live-timer-val');
        this.phaseTimerSpan = document.getElementById('hs-phase-timer-val');
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

        // Build stable DOM for sections that will be updated frequently.
        this.ensureStaticDom();
    }

    private updateExportButton(): void {
        if (!this.exportButton) return;

        // Advanced data collection is checked once at autosing start.
        // While autosing is running, we use the cached value.
        const isEnabled = this.advancedDataCollectionEnabled;
        const hasData = this.compressedBundles.length > 0;

        const visible = isEnabled;

        this.exportButton.style.display = visible ? 'block' : 'none';

        if (visible) {
            this.exportButton.disabled = !hasData;
            this.exportButton.style.opacity = hasData ? '1' : '0.5';
            this.exportButton.textContent = hasData
                ? `📊 Export Data (${this.singularityBundles.length} singularities)`
                : '📊 No Data to Export';
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

    /**
     * Apply a fixed modal size on first open (no text measuring).
     * Also sets a fixed graph SVG width so the right-side labels remain visible.
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
        // NOTE: do not force a minimum larger than the fixed width.
        const appliedWidth = Math.max(260, Math.min(FIXED_WIDTH, window.innerWidth - 40));
        const appliedHeight = Math.max(240, Math.min(FIXED_HEIGHT, window.innerHeight - 40));

        this.computedMaxWidth = appliedWidth;
        this.computedMaxHeight = appliedHeight + 250;
        // Graph (SVG) width must fit inside the modal
        this.computedGraphWidth = Math.max(120, Math.min(FIXED_GRAPH_WIDTH, appliedWidth - LABELS_ESTIMATE));

        this.timerDisplay.style.width = 'auto';
        this.timerDisplay.style.height = 'auto';

        // Sparkline containers also use auto width to allow modal to auto-size
        if (this.sparklineContainer1) {
            this.sparklineContainer1.style.width = 'auto';
        }
        if (this.sparklineContainer2) {
            this.sparklineContainer2.style.width = 'auto';
        }
        if (this.sparklineContainer3) {
            this.sparklineContainer3.style.width = 'auto';
        }

        this.autoResized = true;
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
        this.dragBounds.width = rect.width;
        this.dragBounds.height = rect.height;
        this.dragBounds.maxX = Math.max(0, window.innerWidth - rect.width);
        this.dragBounds.maxY = Math.max(0, window.innerHeight - rect.height);
    }

    private drag(e: MouseEvent): void {
        if (!this.timerDisplay || !this.isDragging) return;

        const x = Math.min(Math.max(0, e.clientX - this.dragOffset.x), this.dragBounds.maxX);
        const y = Math.min(Math.max(0, e.clientY - this.dragOffset.y), this.dragBounds.maxY);

        this.timerDisplay.style.left = `${x}px`;
        this.timerDisplay.style.top = `${y}px`;
        this.timerDisplay.style.right = 'auto';
        this.timerDisplay.style.bottom = 'auto';
    }

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
            if (this.resizeHandleElem) this.resizeHandleElem.style.display = 'none';
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
            if (this.resizeHandleElem) this.resizeHandleElem.style.display = '';
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

        // Perform a single UI refresh so labels reflect the reset state.
        this.updateTimers();
    }

    private stopLiveTimer(): void {
        if (this.liveTimerInterval !== null) {
            clearInterval(this.liveTimerInterval);
            this.liveTimerInterval = null;
        }
    }

    public start(strategy: HSAutosingStrategy, initialQuarks: number = 0, initialGoldenQuarks: number = 0): void {
        this.singularityCount = 0;
        this.lastSingularityTimestamp = 0;
        this.lastSingularityDuration = null;
        this.quarksGainsCount = 0;
        this.goldenQuarksGainsCount = 0;
        this.durationsHistory = [];
        this.cumulativeDuration = 0;
        this.maxDuration = 0;
        this.minDuration = Infinity;
        this.allTimeCumulativeDuration = 0;
        this.allTimeMaxDuration = 0;
        this.allTimeMinDuration = Infinity;
        this.quarksAmounts = [];
        this.cumulativeQuarksGains = 0;
        this.maxQuarksGains = 0;
        this.minQuarksGains = Infinity;
        this.allTimeCumulativeQuarksGains = 0;
        this.allTimeMaxQuarksGains = 0;
        this.allTimeMinQuarksGains = Infinity;
        this.goldenQuarksAmounts = [];
        this.cumulativeGQuarksGains = 0;
        this.maxGQuarksGains = 0;
        this.minGQuarksGains = Infinity;
        this.allTimeCumulativeGQuarksGains = 0;
        this.allTimeMaxGQuarksGains = 0;
        this.allTimeMinGQuarksGains = Infinity;
        this.durationsPrefixSum = [0];
        this.durationsPrefixSumSq = [0];
        this.startTime = performance.now();
        this.lastSingularityTimestamp = this.startTime;
        this.phaseHistory.clear();
        this.singularityBundles = [];

        this.cumulativeQuarksGained = 0;
        this.cumulativeGoldenQuarksGained = 0;
        this.cumulativeSingularityTime = 0;

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
        this.cachedStrategyOrder = this.strategy.strategy.map(p => `${p.startPhase}-${p.endPhase}`);

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
            this.currentBatch = [];
            this.clearBundles().catch(console.error);
        } else {
            // Hybrid Minimal: no bundles stored
            this.singularityBundles = [];
            this.compressedBundles = [];
            this.currentBatch = [];
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

    public async recordPhase(phase: string): Promise<void> {
        const now = performance.now();
        const timeSinceStart = (now - this.currentSingularityStart) / 1000;
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


    public recordSingularity(gainedGoldenQuarks: number, currentGoldenQuarks: number, gainedQuarks: number, currentQuarks: number, c15Score?: Decimal): void {
        const now = performance.now();
        const singularityDuration = (now - this.lastSingularityTimestamp) / 1000;
        this.lastSingularityTimestamp = now;
        this.lastSingularityDuration = singularityDuration;
        this.singularityCount += 1;

        this.latestGoldenQuarksTotal = currentGoldenQuarks;

        // Handle quarks exactly like golden quarks: use passed totals/gains.
        const realQuarksGain = gainedQuarks;

        this.latestQuarksTotal = currentQuarks;

        if (singularityDuration > 0) {
            // Update all-time statistics
            this.allTimeCumulativeDuration += singularityDuration;
            this.allTimeMaxDuration = Math.max(this.allTimeMaxDuration, singularityDuration);
            this.allTimeMinDuration = Math.min(this.allTimeMinDuration, singularityDuration);

            // Use wallet delta (realQuarksGain) to keep rates consistent with what the player sees.
            this.quarksGainsCount += 1;
            this.quarksAmounts.push({gain: realQuarksGain, timestamp: now, duration: singularityDuration});
            this.cumulativeQuarksGains += realQuarksGain;
            this.maxQuarksGains = Math.max(this.maxQuarksGains, realQuarksGain);
            this.minQuarksGains = Math.min(this.minQuarksGains, realQuarksGain);
            // Update all-time
            this.allTimeCumulativeQuarksGains += realQuarksGain;
            this.allTimeMaxQuarksGains = Math.max(this.allTimeMaxQuarksGains, realQuarksGain);
            this.allTimeMinQuarksGains = Math.min(this.allTimeMinQuarksGains, realQuarksGain);
            if (this.quarksAmounts.length > this.sparklineMaxPoints) {
                const removed = this.quarksAmounts.shift()!;
                this.cumulativeQuarksGains -= removed.gain;
                // Recalculate max/min for capped array
                if (this.quarksAmounts.length > 0) {
                    this.maxQuarksGains = Math.max(...this.quarksAmounts.map(q => q.gain));
                    this.minQuarksGains = Math.min(...this.quarksAmounts.map(q => q.gain));
                } else {
                    this.maxQuarksGains = 0;
                    this.minQuarksGains = Infinity;
                }
            }

            this.goldenQuarksGainsCount += 1;
            this.goldenQuarksAmounts.push({gain: gainedGoldenQuarks, timestamp: now, duration: singularityDuration});
            this.cumulativeGQuarksGains += gainedGoldenQuarks;
            this.maxGQuarksGains = Math.max(this.maxGQuarksGains, gainedGoldenQuarks);
            this.minGQuarksGains = Math.min(this.minGQuarksGains, gainedGoldenQuarks);
            // Update all-time
            this.allTimeCumulativeGQuarksGains += gainedGoldenQuarks;
            this.allTimeMaxGQuarksGains = Math.max(this.allTimeMaxGQuarksGains, gainedGoldenQuarks);
            this.allTimeMinGQuarksGains = Math.min(this.allTimeMinGQuarksGains, gainedGoldenQuarks);
            if (this.goldenQuarksAmounts.length > this.sparklineMaxPoints) {
                const removed = this.goldenQuarksAmounts.shift()!;
                this.cumulativeGQuarksGains -= removed.gain;
                // Recalculate max/min for capped array
                if (this.goldenQuarksAmounts.length > 0) {
                    this.maxGQuarksGains = Math.max(...this.goldenQuarksAmounts.map(g => g.gain));
                    this.minGQuarksGains = Math.min(...this.goldenQuarksAmounts.map(g => g.gain));
                } else {
                    this.maxGQuarksGains = 0;
                    this.minGQuarksGains = Infinity;
                }
            }

            // O(1) optimization updates
            this.cumulativeSingularityTime += singularityDuration;
            this.cumulativeQuarksGained += realQuarksGain;
            this.cumulativeGoldenQuarksGained += gainedGoldenQuarks;
        }

        // Track duration sums for O(1) windowed average/variance
        this.pushDurationValue(singularityDuration, now);
        const lastDurationSum = this.durationsPrefixSum[this.durationsPrefixSum.length - 1] || 0;
        const lastDurationSumSq = this.durationsPrefixSumSq[this.durationsPrefixSumSq.length - 1] || 0;
        this.durationsPrefixSum.push(lastDurationSum + singularityDuration);
        this.durationsPrefixSumSq.push(lastDurationSumSq + (singularityDuration * singularityDuration));

        // Advanced data collection
        if (this.advancedDataCollectionEnabled) {
            const bundle: SingularityBundle = {
                singularityNumber: this.singularityCount,
                totalTime: singularityDuration,
                quarksGained: realQuarksGain,
                goldenQuarksGained: gainedGoldenQuarks,
                totalQuarks: this.latestQuarksTotal,
                totalGoldenQuarks: currentGoldenQuarks,
                phases: Object.fromEntries(this.currentSingularityPhases),
                timestamp: Date.now()
            };

            if (c15Score !== undefined) {
                bundle.c15 = c15Score.toString();
            }

            this.singularityBundles.push(bundle);
            this.currentBatch.push(bundle);

            if (this.currentBatch.length >= this.batchSize) {
                const compressed = compressToUTF16(JSON.stringify(this.currentBatch));
                this.compressedBundles.push(compressed);
                this.storeBundle(compressed).catch(console.error);
                this.currentBatch = [];
            }
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

    private getSingularityCount(): number {
        return this.singularityCount;
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
        return this.lastSingularityDuration;
    }

    private getAverageLast(n: number): number | null {
        const totalCount = this.durationsPrefixSum.length - 1;
        if (n <= 0 || totalCount < n) {
            return null;
        }
        const sum = this.durationsPrefixSum[totalCount] - this.durationsPrefixSum[totalCount - n];
        return sum / n;
    }

    private getQuarksPerSecond(isGolden: boolean): number | null {
        const count = isGolden ? this.goldenQuarksGainsCount : this.quarksGainsCount;
        if (count === 0 || this.cumulativeSingularityTime <= 0) return null;
        const total = isGolden ? this.cumulativeGoldenQuarksGained : this.cumulativeQuarksGained;
        return total / this.cumulativeSingularityTime;
    }

    private formatNumber(num: number): string {
        return Number(num).toExponential(2).replace('+', '');
    }

    private formatNumberWithSign(num: number): string {
        return Number(num).toExponential(2);
    }

    private formatDecimal(d: Decimal | null | undefined): string {
        if (d === null || d === undefined) return '-';
        try {
            let s = (d as Decimal).toExponential(2);
            // Normalize to lowercase 'e' and remove explicit plus signs in exponent
            s = s.replace(/E/g, 'e').replace(/\+/g, '');
            return s;
        } catch (e) {
            try {
                let s2 = new Decimal(d as any).toExponential(2);
                s2 = s2.replace(/E/g, 'e').replace(/\+/g, '');
                return s2;
            } catch (e2) {
                return String(d);
            }
        }
    }

    private formatTime(seconds: number): string {
        const totalSeconds = Math.floor(seconds);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;

        if (hours > 0) {
            return `${hours}h${minutes.toString().padStart(2, '0')}m${secs.toString().padStart(2, '0')}s`;
        } else if (minutes > 0) {
            return `${minutes}m${secs.toString().padStart(2, '0')}s`;
        } else {
            return `${secs}s`;
        }
    }

    private getPhaseAverage(phase: string): number | null {
        const phaseData = this.phaseHistory.get(phase);
        if (!phaseData || phaseData.count === 0) {
            return null;
        }
        return phaseData.totalTime / phaseData.count;
    }

    private getPhaseStandardDeviation(phase: string): number | null {
        const phaseData = this.phaseHistory.get(phase);
        if (!phaseData || phaseData.count <= 1) {
            return null;
        }
        const count = phaseData.count;
        const mean = phaseData.totalTime / count;
        const variance = (phaseData.sumSq / count) - (mean * mean);
        return Math.sqrt(Math.max(0, variance));
    }

    private getStandardDeviation(n: number): number | null {
        const totalCount = this.durationsPrefixSum.length - 1;
        if (n <= 0 || totalCount <= 0) {
            return null;
        }
        const count = Math.min(n, totalCount);
        const sum = this.durationsPrefixSum[totalCount] - this.durationsPrefixSum[totalCount - count];
        const sumSq = this.durationsPrefixSumSq[totalCount] - this.durationsPrefixSumSq[totalCount - count];
        const mean = sum / count;
        const variance = (sumSq / count) - (mean * mean);
        return Math.sqrt(Math.max(0, variance));
    }

    private getC15AverageLast(n: number): Decimal | null {
        if (n <= 0 || this.c15Count === 0) return null;
        return this.c15Mean;
    }

    private getC15StdLast(n: number): Decimal | null {
        if (n <= 0 || this.c15Count <= 1) return null;
        const variance = this.c15M2.div(this.c15Count);
        return variance.pow(0.5);
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

    private exportDataAsCSV(): void {
        if (!this.advancedDataCollectionEnabled || (this.compressedBundles.length === 0 && this.currentBatch.length === 0)) {
            alert('No data to export');
            return;
        }

        const bundles: SingularityBundle[] = [];

        // Decompress completed batches
        for (const compressed of this.compressedBundles) {
            const batch: SingularityBundle[] = JSON.parse(decompressFromUTF16(compressed));
            bundles.push(...batch);
        }

        // Add any remaining in current batch
        bundles.push(...this.currentBatch);

        // Collect all unique phase names
        const allPhaseNames = new Set<string>();
        bundles.forEach(bundle => {
            Object.keys(bundle.phases).forEach(phase => allPhaseNames.add(phase));
        });
        const sortedPhaseNames = Array.from(allPhaseNames).sort();

        // Build CSV header
        const headers = [
            'Singularity Number',
            'Total Time (s)',
            'C15',
            'Quarks Gained',
            'Golden Quarks Gained',
            'Total Quarks',
            'Total Golden Quarks',
            'Timestamp',
            ...sortedPhaseNames.map(phase => `Phase: ${phase} (s)`)
        ];

        // Build CSV rows
        const rows = bundles.map(bundle => {
            const row = [
                bundle.singularityNumber.toString(),
                bundle.totalTime.toFixed(3),
                bundle.c15 ?? '',
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

    private pushDurationValue(value: number, timestamp: number): void {
        this.durationsHistory.push({value, timestamp});
        this.cumulativeDuration += value;
        this.maxDuration = Math.max(this.maxDuration, value);
        this.minDuration = Math.min(this.minDuration, value);
        if (this.durationsHistory.length > this.sparklineMaxPoints) {
            const removed = this.durationsHistory.shift()!;
            this.cumulativeDuration -= removed.value;
            // Recalculate max/min since removed might have been the max/min
            if (this.durationsHistory.length > 0) {
                this.maxDuration = Math.max(...this.durationsHistory.map(d => d.value));
                this.minDuration = Math.min(...this.durationsHistory.map(d => d.value));
            } else {
                this.maxDuration = 0;
                this.minDuration = Infinity;
            }
        }
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
        this.setTextEl(this.quarksTotalSpan, this.formatNumber(currentQuarks));

        const quarksPerSec = this.getQuarksPerSecond(false);
        if (quarksPerSec !== null) {
            this.setTextEl(this.quarksRateValSpan, `${this.formatNumber(quarksPerSec)}/s`);
            this.setTextEl(this.quarksRateHrSpan, `(${this.formatNumber(quarksPerSec * 3600)}/hr)`);
        } else {
            this.setTextEl(this.quarksRateValSpan, `0/s`);
            this.setTextEl(this.quarksRateHrSpan, `(0/hr)`);
        }

        // 3. Golden Quarks
        this.setTextEl(this.gquarksTotalSpan, this.formatNumber(currentGoldenQuarks));

        const goldenQuarksPerSec = this.getQuarksPerSecond(true);
        if (goldenQuarksPerSec !== null) {
            this.setTextEl(this.gquarksRateValSpan, `${this.formatNumber(goldenQuarksPerSec)}/s`);
            this.setTextEl(this.gquarksRateHrSpan, `(${this.formatNumber(goldenQuarksPerSec * 3600)}/hr)`);
        } else {
            this.setTextEl(this.gquarksRateValSpan, `0/s`);
            this.setTextEl(this.gquarksRateHrSpan, `(0/hr)`);
        }

        // 4. Averages
        const avg1 = this.getLastDuration();
        const avg10 = this.getAverageLast(10);
        const avg50 = this.getAverageLast(50);
        const avgAll = this.getAverageLast(count);

        const sd10 = this.getStandardDeviation(10);
        const sd50 = this.getStandardDeviation(50);
        const sdAll = this.getStandardDeviation(count);

        this.setTextEl(this.avg1Span, avg1 !== null ? `${avg1.toFixed(2)}s` : '-');
        this.setAvgEl(this.avg10Span, avg10, sd10);
        this.setAvgEl(this.avg50Span, avg50, sd50);
        this.setTextEl(this.avgAllCountSpan, count.toString());
        this.setAvgEl(this.avgAllSpan, avgAll, sdAll);

        // Total, Max, Min Times (all-time)
        const totalTime = this.allTimeCumulativeDuration;
        const maxTime = this.singularityCount > 0 ? this.allTimeMaxDuration : null;
        const minTime = this.singularityCount > 0 ? this.allTimeMinDuration : null;
        this.setTextEl(this.totalTimeSpan, totalTime > 0 ? this.formatTime(totalTime) : '-');
        this.setTextEl(this.maxTimeSpan, maxTime !== null && maxTime !== 0 ? `${maxTime.toFixed(2)}s` : '-');
        this.setTextEl(this.minTimeSpan, minTime !== null && minTime !== Infinity ? `${minTime.toFixed(2)}s` : '-');

        // C15 display: show average and std of log(C15) (inline)
        if (this.c15TopSpan && this.c15SigmaSpan) {
            const avgC15 = this.getC15AverageLast(count);
            const sdLogC15 = this.getLogC15Std();
            const valText = avgC15 ? this.formatDecimal(avgC15) : '-';
            const sdText = sdLogC15 !== null ? `(σlog ±${sdLogC15.toFixed(3)})` : '';
            this.setTextEl(this.c15TopSpan, `C15 ${valText}`);
            this.setTextEl(this.c15SigmaSpan, sdText);
            this.c15TopSpan.title = '';
        }

        // Quarks Gains (all-time)
        const totalQuarksGains = this.allTimeCumulativeQuarksGains;
        const maxQuarksGains = this.singularityCount > 0 ? this.allTimeMaxQuarksGains : null;
        const minQuarksGains = this.singularityCount > 0 ? this.allTimeMinQuarksGains : null;
        this.setTextEl(this.quarksTotalGainsSpan, totalQuarksGains > 0 ? this.formatNumber(totalQuarksGains) : '-');
        this.setTextEl(this.quarksMaxGainsSpan, maxQuarksGains !== null && maxQuarksGains !== 0 ? this.formatNumber(maxQuarksGains) : '-');
        this.setTextEl(this.quarksMinGainsSpan, minQuarksGains !== null && minQuarksGains !== Infinity ? this.formatNumber(minQuarksGains) : '-');

        // Golden Quarks Gains (all-time)
        const totalGQuarksGains = this.allTimeCumulativeGQuarksGains;
        const maxGQuarksGains = this.singularityCount > 0 ? this.allTimeMaxGQuarksGains : null;
        const minGQuarksGains = this.singularityCount > 0 ? this.allTimeMinGQuarksGains : null;
        this.setTextEl(this.gquarksTotalGainsSpan, totalGQuarksGains > 0 ? this.formatNumber(totalGQuarksGains) : '-');
        this.setTextEl(this.gquarksMaxGainsSpan, maxGQuarksGains !== null && maxGQuarksGains !== 0 ? this.formatNumber(maxGQuarksGains) : '-');
        this.setTextEl(this.gquarksMinGainsSpan, minGQuarksGains !== null && minGQuarksGains !== Infinity ? this.formatNumber(minGQuarksGains) : '-');
    }

    private renderPhaseStatistics(): void {
        const phaseContainer = this.phaseStatsContainer;
        if (!phaseContainer) return;

        this.ensureStaticDom();

        const sortedPhases = Array.from(this.phaseHistory.entries())
            .sort((a, b) => {
                const idxA = this.cachedStrategyOrderIndex.get(a[0]);
                const idxB = this.cachedStrategyOrderIndex.get(b[0]);

                // If both are in the strategy, respect strategy order
                if (idxA !== undefined && idxB !== undefined) return idxA - idxB;

                // If one is in strategy, it comes first
                if (idxA !== undefined) return -1;
                if (idxB !== undefined) return 1;

                // Fallback: Use global phases list for predictable ordering
                const globalIdxA = this.cachedGlobalPhaseIndex.get(a[0]) ?? 999;
                const globalIdxB = this.cachedGlobalPhaseIndex.get(b[0]) ?? 999;
                return globalIdxA - globalIdxB;
            });

        const orderedRows: PhaseRowDom[] = [];

        for (const [phaseName, data] of sortedPhases) {
            if (data.count <= 0) continue;

            const avg = data.totalTime / data.count;
            const last = data.lastTime;
            const sd = this.getPhaseStandardDeviation(phaseName);
            const sdStr = sd !== null ? `±${sd.toFixed(2)}s` : '±0.00s';
            const avgLoops = 1 + (data.repeats / data.count);
            const count = data.count;

            let row = this.phaseRowMap.get(phaseName);
            if (!row) {
                row = this.createPhaseRowDom(phaseName);
                this.phaseRowMap.set(phaseName, row);
            }

            row.nameCountSpan.textContent = `x${count} `;
            row.nameTextSpan.textContent = phaseName;
            row.loopsCell.textContent = `x${avgLoops.toFixed(2)}`;
            row.avgCell.textContent = `${avg.toFixed(2)}s`;
            row.sdCell.textContent = sdStr;
            row.lastCell.textContent = `${last.toFixed(2)}s`;

            orderedRows.push(row);
        }

        const frag = document.createDocumentFragment();
        this.phaseHeaderNodes.forEach(n => frag.appendChild(n));

        if (orderedRows.length === 0) {
            if (this.phaseEmptyNode) frag.appendChild(this.phaseEmptyNode);
        } else {
            for (const row of orderedRows) {
                row.cells.forEach(cell => frag.appendChild(cell));
            }
        }

        phaseContainer.replaceChildren(frag);
    }

    private renderSparklines(): void {
        this.ensureStaticDom();

        if (this.showDetailedData) {
            this.setTextEl(this.footerVersionSpan, this.modVersion);
            this.setTextEl(this.footerStrategySpan, this.strategyName);
            this.setTextEl(this.footerLoadoutsSpan, this.loadoutsOrder.join(', '));

            this.updateSparkline(this.sparklineQuarks, this.quarksAmounts);
            this.updateSparkline(this.sparklineGoldenQuarks, this.goldenQuarksAmounts);
            this.updateSparkline(this.sparklineTimes, this.durationsHistory);

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

            // Show detailed cells
            const detailedCells = this.timerDisplay?.querySelectorAll('.hs-detailed-cell');
            detailedCells?.forEach(cell => {
                (cell as HTMLElement).style.visibility = 'visible';
            });

            // Show all rows when detailed data is on
            const avg10Label = this.timerDisplay?.querySelector('#hs-avg-10-lbl')?.parentElement;
            const avg10Value = this.timerDisplay?.querySelector('#hs-avg-10')?.parentElement;
            const avg50Label = this.timerDisplay?.querySelector('#hs-avg-50-lbl')?.parentElement;
            const avg50Value = this.timerDisplay?.querySelector('#hs-avg-50')?.parentElement;
            const maxLabel = this.timerDisplay?.querySelector('#hs-max-time')?.parentElement?.previousElementSibling;
            const maxValue = this.timerDisplay?.querySelector('#hs-max-time')?.parentElement;
            const minLabel = this.timerDisplay?.querySelector('#hs-min-time')?.parentElement?.previousElementSibling;
            const minValue = this.timerDisplay?.querySelector('#hs-min-time')?.parentElement;

            if (avg10Label) (avg10Label as HTMLElement).style.display = '';
            if (avg10Value) (avg10Value as HTMLElement).style.display = '';
            if (avg50Label) (avg50Label as HTMLElement).style.display = '';
            if (avg50Value) (avg50Value as HTMLElement).style.display = '';
            if (maxLabel) (maxLabel as HTMLElement).style.display = '';
            if (maxValue) (maxValue as HTMLElement).style.display = '';
            if (minLabel) (minLabel as HTMLElement).style.display = '';
            if (minValue) (minValue as HTMLElement).style.display = '';
        } else {
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

            // Hide detailed cells
            const detailedCells = this.timerDisplay?.querySelectorAll('.hs-detailed-cell');
            detailedCells?.forEach(cell => {
                (cell as HTMLElement).style.visibility = 'hidden';
            });

            // Hide specific rows completely when detailed data is off
            const avg10Label = this.timerDisplay?.querySelector('#hs-avg-10-lbl')?.parentElement;
            const avg10Value = this.timerDisplay?.querySelector('#hs-avg-10')?.parentElement;
            const avg50Label = this.timerDisplay?.querySelector('#hs-avg-50-lbl')?.parentElement;
            const avg50Value = this.timerDisplay?.querySelector('#hs-avg-50')?.parentElement;
            const maxLabel = this.timerDisplay?.querySelector('#hs-max-time')?.parentElement?.previousElementSibling;
            const maxValue = this.timerDisplay?.querySelector('#hs-max-time')?.parentElement;
            const minLabel = this.timerDisplay?.querySelector('#hs-min-time')?.parentElement?.previousElementSibling;
            const minValue = this.timerDisplay?.querySelector('#hs-min-time')?.parentElement;

            if (avg10Label) (avg10Label as HTMLElement).style.display = 'none';
            if (avg10Value) (avg10Value as HTMLElement).style.display = 'none';
            if (avg50Label) (avg50Label as HTMLElement).style.display = 'none';
            if (avg50Value) (avg50Value as HTMLElement).style.display = 'none';
            if (maxLabel) (maxLabel as HTMLElement).style.display = 'none';
            if (maxValue) (maxValue as HTMLElement).style.display = 'none';
            if (minLabel) (minLabel as HTMLElement).style.display = 'none';
            if (minValue) (minValue as HTMLElement).style.display = 'none';
        }
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
        this.lastSingularityDuration = null;
        this.quarksGainsCount = 0;
        this.goldenQuarksGainsCount = 0;
        this.quarksAmounts = [];
        this.cumulativeQuarksGains = 0;
        this.maxQuarksGains = 0;
        this.minQuarksGains = Infinity;
        this.allTimeCumulativeQuarksGains = 0;
        this.allTimeMaxQuarksGains = 0;
        this.allTimeMinQuarksGains = Infinity;
        this.goldenQuarksAmounts = [];
        this.cumulativeGQuarksGains = 0;
        this.maxGQuarksGains = 0;
        this.minGQuarksGains = Infinity;
        this.allTimeCumulativeGQuarksGains = 0;
        this.allTimeMaxGQuarksGains = 0;
        this.allTimeMinGQuarksGains = Infinity;
        this.c15Count = 0;
        this.c15Mean = new Decimal(0);
        this.c15M2 = new Decimal(0);
        this.logC15Count = 0;
        this.logC15Mean = 0;
        this.logC15M2 = 0;
        this.durationsHistory = [];
        this.cumulativeDuration = 0;
        this.maxDuration = 0;
        this.minDuration = Infinity;
        this.allTimeCumulativeDuration = 0;
        this.allTimeMaxDuration = 0;
        this.allTimeMinDuration = Infinity;
        this.durationsPrefixSum = [0];
        this.durationsPrefixSumSq = [0];
        this.startTime = 0;
        this.phaseHistory.clear();
        this.singularityBundles = [];
        this.compressedBundles = [];
        this.currentBatch = [];
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

    private updateTimers(): void {
        if (!this.dynamicContent || this.isMinimized) return;

        // Live timers removed: do not update per-tick values for 'current' or phase timers.
        // Keep placeholders cleared so no stale values remain.
        if (this.liveTimerSpan) this.liveTimerSpan.textContent = '';
        if (this.phaseTimerSpan) this.phaseTimerSpan.textContent = '';
    }

    /**
     * Logic to generate SVG path and metadata for singularity charts.
     * Handles 'flat' data (no change) by centering the line and aligning the avgY to it.
     */
    private generateSparklineMetadata(data: {value: number, time: number}[], width: number, height: number): { path: string, points: string, max: number, min: number, avg: number, maxY: number, minY: number, lastX: number, lastY: number } {
        if (data.length < 1) return { path: '', points: '', max: 0, min: 0, avg: 0, maxY: 0, minY: height, lastX: 0, lastY: height / 2 };
        const startIdx = Math.max(0, data.length - 50);
        let max = -Infinity;
        let min = Infinity;
        let sum = 0;
        let count = 0;

        for (let i = startIdx; i < data.length; i++) {
            const v = data[i].value;
            if (v > max) max = v;
            if (v < min) min = v;
            sum += v;
            count++;
        }
        const avg = count > 0 ? (sum / count) : 0;

        // Handle flat data quickly
        if (count === 0) return { path: '', points: '', max: 0, min: 0, avg: 0, maxY: 0, minY: height, lastX: 0, lastY: height / 2 };

        const formattedMax = this.formatNumber(max);
        const formattedMin = this.formatNumber(min);
        if (formattedMax === formattedMin || count === 1) {
            const centerY = height / 2;
            const pts = `0,${centerY.toFixed(1)} ${width},${centerY.toFixed(1)}`;
            return {
                path: `M 0,${centerY.toFixed(1)} L ${width},${centerY.toFixed(1)}`,
                points: pts,
                max: max,
                min: min,
                avg: avg,
                maxY: centerY,
                minY: centerY,
                lastX: width,
                lastY: centerY
            };
        }

        const range = max - min;
        const padding = range * 0.1;
        const displayMin = min - padding;
        const displayRange = range + 2 * padding;

        // Build points string without intermediate object allocations
        const ptsArr: string[] = new Array(count);
        let lastX = 0;
        let lastY = height / 2;
        const minTime = data[startIdx].time;
        const maxTime = data[startIdx + count - 1].time;
        const timeRange = maxTime - minTime;
        for (let idx = 0; idx < count; idx++) {
            const item = data[startIdx + idx];
            const val = item.value;
            const time = item.time;
            const x = timeRange > 0 ? ((time - minTime) / timeRange) * width : (count === 1 ? width : (idx / (count - 1)) * width);
            const y = height - ((val - displayMin) / displayRange) * height;
            ptsArr[idx] = `${x.toFixed(1)},${y.toFixed(1)}`;
            lastX = x;
            lastY = y;
        }

        const pointsStr = ptsArr.join(' ');
        const maxY = height - ((max - displayMin) / displayRange) * height;
        const minY = height - ((min - displayMin) / displayRange) * height;

        return {
            path: `M ${pointsStr.replace(/ /g, ' L ')}`,
            points: pointsStr,
            max: max,
            min: min,
            avg: avg,
            maxY: maxY,
            minY: minY,
            lastX: lastX,
            lastY: lastY
        };
    }

}