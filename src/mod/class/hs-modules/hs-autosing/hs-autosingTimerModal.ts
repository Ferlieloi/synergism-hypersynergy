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
import { HSAutosingStrategy } from "../../../types/module-types/hs-autosing-types";

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

    private timestamps: number[] = [];
    private quarksHistory: number[] = [];
    private goldenQuarksHistory: number[] = [];
    private quarksGains: number[] = [];
    private goldenQuarksGains: number[] = [];
    private startTime: number = 0;

    // Phase tracking
    private currentSingularityStart: number = 0;
    private currentPhaseStart: number = 0;
    private _currentPhaseName: string = ''; // Backing field for setter
    private phaseHistory: Map<string, { times: number[], totalTime: number, lastTime: number }> = new Map();
    private currentSingularityPhases: Map<string, number> = new Map();
    private currentSingularityNumber: number = 0;

    // Merge Logic State
    private lastRecordedPhaseName: string | null = null;

    // Live timer
    private liveTimerInterval: number | null = null;
    private currentLiveTime: number = 0;

    // Advanced data collection
    private singularityBundles: SingularityBundle[] = [];
    private previousQuarks: number = 0;
    private previousGoldenQuarks: number = 0;

    // Cached Stats (calculated at start)
    private singTarget: number = 0;
    private singHighest: number = 0;
    private strategyName: string = '';
    private loadoutsOrder: string[] = [];
    private strategy: HSAutosingStrategy | null = null;

    private exportButton: HTMLButtonElement | null = null;
    private dynamicContent: HTMLDivElement | null = null;

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
        this.updateDisplay();
    }

    public getCurrentPhase(): string {
        return this._currentPhaseName;
    }

    private createTimerDisplay(): void {
        this.timerDisplay = document.createElement('div');
        this.timerDisplay.id = 'hs-autosing-timer-display';
        this.timerDisplay.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.9);
        color: #fff;
        border-radius: 8px;
        font-family: monospace;
        font-size: 14px;
        z-index: 10000;
        min-width: 200px;
        width: 350px;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        display: none;
        overflow: hidden;
    `;

        /* ---------- HEADER ---------- */
        this.timerHeader = document.createElement('div');
        this.timerHeader.style.cssText = `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 8px 12px;
        cursor: move;
        display: flex;
        justify-content: space-between;
        align-items: center;
        user-select: none;
        border-radius: 8px 8px 0 0;
    `;

        const title = document.createElement('span');
        title.textContent = '⏱️ Autosing Timer';
        title.style.fontWeight = 'bold';

        const minimizeBtn = document.createElement('button');
        minimizeBtn.textContent = '−';
        minimizeBtn.style.cssText = `
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        width: 20px;
        height: 20px;
        border-radius: 4px;
        cursor: pointer;
        font-size: 16px;
        padding: 0;
    `;
        minimizeBtn.onclick = () => this.toggleMinimize();

        this.timerHeader.appendChild(title);
        this.timerHeader.appendChild(minimizeBtn);

        /* ---------- CONTENT ---------- */
        this.timerContent = document.createElement('div');
        this.timerContent.style.cssText = `
        padding: 12px;
        background: rgba(0, 0, 0, 0.9);
    `;

        // Dynamic area (updated every tick)
        this.dynamicContent = document.createElement('div');
        this.timerContent.appendChild(this.dynamicContent);

        // Persistent export button
        this.exportButton = document.createElement('button');
        this.exportButton.id = 'hs-export-data-btn';
        this.exportButton.className = 'hs-export-btn';
        this.exportButton.style.display = 'none';
        this.exportButton.onclick = () => this.exportDataAsCSV();
        this.timerContent.appendChild(this.exportButton);

        /* ---------- RESIZE HANDLE ---------- */
        const resizeHandle = document.createElement('div');
        resizeHandle.style.cssText = `
        position: absolute;
        bottom: 0;
        right: 0;
        width: 15px;
        height: 15px;
        cursor: nwse-resize;
        background: linear-gradient(135deg, transparent 0%, transparent 50%, rgba(255, 255, 255, 0.3) 50%);
    `;
        resizeHandle.onmousedown = (e) => this.startResize(e);

        /* ---------- ASSEMBLE ---------- */
        this.timerDisplay.appendChild(this.timerHeader);
        this.timerDisplay.appendChild(this.timerContent);
        this.timerDisplay.appendChild(resizeHandle);
        document.body.appendChild(this.timerDisplay);

        /* ---------- STATIC STYLES ---------- */
        const style = document.createElement('style');
        style.textContent = `
        @keyframes hs-color_rotate {
            0% { color: #ff5e00; }
            100% { color: #ff5e00; }
        }

        .hs-rainbow-text {
            font-weight: bold;
            animation: hs-color_rotate 6s linear infinite;
        }

        .hs-export-btn {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
            border: none;
            color: white;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
            margin-top: 8px;
            width: 100%;
        }

        .hs-export-btn:hover {
            box-shadow: 0 4px 12px rgba(56, 239, 125, 0.4);
        }
    `;
        document.head.appendChild(style);
    }

    private updateExportButton(): void {
        if (!this.exportButton) return;

        const advanced = HSSettings.getSetting('advancedDataCollection');
        const visible =
            advanced &&
            advanced.isEnabled() &&
            this.singularityBundles.length > 0;

        this.exportButton.style.display = visible ? 'block' : 'none';

        if (visible) {
            this.exportButton.textContent =
                `📊 Export Data (${this.singularityBundles.length} singularities)`;
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

        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.drag(e);
            } else if (this.isResizing) {
                this.resize(e);
            }
        });

        document.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.isResizing = false;
        });
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
            const minimizeBtn = this.timerHeader?.querySelector('button');
            if (minimizeBtn) minimizeBtn.textContent = '+';
        } else {
            this.timerContent.style.display = 'block';
            this.timerDisplay.style.height = '';
            const minimizeBtn = this.timerHeader?.querySelector('button');
            if (minimizeBtn) minimizeBtn.textContent = '−';
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
            this.updateDisplay();
        }, 100);
    }

    private stopLiveTimer(): void {
        if (this.liveTimerInterval !== null) {
            clearInterval(this.liveTimerInterval);
            this.liveTimerInterval = null;
        }
    }

    public start(strategy: HSAutosingStrategy): void {
        this.timestamps = [];
        this.quarksHistory = [];
        this.goldenQuarksHistory = [];
        this.startTime = performance.now();
        this.phaseHistory.clear();
        this.singularityBundles = [];
        this.previousQuarks = 0;
        this.previousGoldenQuarks = 0;

        // Cache stats at start
        this.strategy = strategy;
        this.singTarget = this.getSingularityTarget();
        this.singHighest = this.getSingularityHighest();
        this.strategyName = this.getStrategyName();
        this.loadoutsOrder = this.getLoadoutsOrder();

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
                }
            }

            // 2. Update Current Singularity Tracking
            const currentVal = this.currentSingularityPhases.get(phase) || 0;
            this.currentSingularityPhases.set(phase, currentVal + phaseDuration);

        } else {
            // STANDARD LOGIC: New Phase
            if (!this.phaseHistory.has(phase)) {
                this.phaseHistory.set(phase, { times: [], totalTime: 0, lastTime: 0 });
            }

            const phaseData = this.phaseHistory.get(phase)!;
            phaseData.times.push(phaseDuration);
            phaseData.totalTime = timeSinceStart; // Record relative end time
            phaseData.lastTime = phaseDuration;

            // Store phase time for current singularity
            this.currentSingularityPhases.set(phase, phaseDuration);

            this.lastRecordedPhaseName = phase;
        }

        // Prepare for next phase
        this.currentPhaseStart = now;

        // Note: We do NOT clear _currentPhaseName here, we leave it.
        // If the user wants to change it, they will call the setter.

        this.updateDisplay();
    }

    public recordSingularity(quarks: number, goldenQuarks: number): void {
        const now = performance.now();

        this.timestamps.push(now);
        this.quarksHistory.push(quarks);
        this.goldenQuarksHistory.push(goldenQuarks);

        // Advanced data collection
        const advancedDataCollectionSetting = HSSettings.getSetting('advancedDataCollection');
        if (advancedDataCollectionSetting && advancedDataCollectionSetting.isEnabled()) {
            const singularityTime = this.timestamps.length < 2
                ? (now - this.startTime) / 1000
                : (now - this.timestamps[this.timestamps.length - 2]) / 1000;

            const quarksGained = this.previousQuarks > 0 ? quarks - this.previousQuarks : 0;
            const goldenQuarksGained = this.previousGoldenQuarks > 0 ? goldenQuarks - this.previousGoldenQuarks : 0;

            const bundle: SingularityBundle = {
                singularityNumber: this.timestamps.length,
                totalTime: singularityTime,
                quarksGained: quarksGained,
                goldenQuarksGained: goldenQuarksGained,
                totalQuarks: quarks,
                totalGoldenQuarks: goldenQuarks,
                phases: Object.fromEntries(this.currentSingularityPhases),
                timestamp: Date.now()
            };

            this.singularityBundles.push(bundle);
        }

        const qGain = this.previousQuarks > 0 ? quarks - this.previousQuarks : 0;
        const gqGain = this.previousGoldenQuarks > 0 ? goldenQuarks - this.previousGoldenQuarks : 0;
        this.quarksGains.push(qGain);
        this.goldenQuarksGains.push(gqGain);

        this.previousQuarks = quarks;
        this.previousGoldenQuarks = goldenQuarks;

        // Reset phase tracking for new singularity
        this.startLiveTimer();

        this.updateDisplay();
    }

    private getSingularityCount(): number {
        return Math.max(0, this.timestamps.length);
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

        let sum = 0;
        for (let i = 1; i <= n; i++) {
            sum += this.timestamps[this.timestamps.length - i] - this.timestamps[this.timestamps.length - (i + 1)];
        }

        return sum / n / 1000;
    }

    private getQuarksPerSecond(quarks: number[]): number | null {
        if (quarks.length < 2) {
            return null;
        }

        const firstQuarks = quarks[0];
        const lastQuarks = quarks[quarks.length - 1];
        const quarksDiff = lastQuarks - firstQuarks;

        const totalTimeSeconds = (this.timestamps[this.timestamps.length - 1] - this.startTime) / 1000;

        if (totalTimeSeconds <= 0) {
            return null;
        }

        return quarksDiff / totalTimeSeconds;
    }

    private getLastQuarksGained(quarks: number[]): number | null {
        if (quarks.length < 2) {
            return null;
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
        if (!this.timerContent || !this.timerDisplay) return;
        if (this.timerDisplay.style.display === 'none' || this.isMinimized) {
            return;
        }

        const count = this.getSingularityCount();
        const lastDuration = this.getLastDuration();
        const avg5 = this.getAverageLast(5);
        const avg10 = this.getAverageLast(10);
        const avg50 = this.getAverageLast(50);
        const avgAll = this.getAverageLast(count - 1);
        const goldenQuarksPerSec = this.getQuarksPerSecond(this.goldenQuarksHistory);
        const lastGoldenQuarks = this.getLastQuarksGained(this.goldenQuarksHistory);
        const currentGoldenQuarks = this.goldenQuarksHistory.length > 0
            ? this.goldenQuarksHistory[this.goldenQuarksHistory.length - 1]
            : 0;
        const quarksPerSec = this.getQuarksPerSecond(this.quarksHistory);
        const lastQuarks = this.getLastQuarksGained(this.quarksHistory);
        const currentQuarks = this.quarksHistory.length > 0
            ? this.quarksHistory[this.quarksHistory.length - 1]
            : 0;

        let html = `<style>
@keyframes hs-color_rotate {
    0%   { color: #ff5e00; }
    9%   { color: #ff9a00; }
    18%  { color: #ffcd00; }
    27%  { color: #e5ff00; }
    36%  { color: #a5ff00; }
    45%  { color: #00ffc8; }
    54%  { color: #00c8ff; }
    63%  { color: #00a5ff; }
    72%  { color: #9500ff; }
    81%  { color: #ff00e1; }
    90%  { color: #ff0095; }
    100% { color: #ff5e00; }
}

.hs-rainbow-text {
    color: #ff5e00;
    font-weight: bold;
    animation: hs-color_rotate 6s linear infinite;
}

.hs-export-btn {
    background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
    border: none;
    color: white;
    padding: 6px 12px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    font-weight: bold;
    margin-top: 8px;
    width: 100%;
    transition: all 0.3s ease;
}

.hs-export-btn:hover {
    box-shadow: 0 4px 12px rgba(56, 239, 125, 0.4);
}

.hs-export-btn:active {
    transform: translateY(0);
}
</style>`;

        // Live Timer Section
        html += `<div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #444;">
            <div style="font-size: 11px; color: #bcb9b9ff; margin-bottom: 4px;">CURRENT SINGULARITY: #${this.singTarget} / #${this.singHighest}</div>
            <div style="margin-bottom: 4px;">Time: <span style="color: #00E676; font-weight: bold; font-size: 16px;">${this.currentLiveTime.toFixed(2)}s</span></div>`;

        // Use the backing field _currentPhaseName which is set via the setter
        if (this._currentPhaseName) {
            const phaseTime = (performance.now() - this.currentPhaseStart) / 1000;
            html += `<div>Phase: <span style="color: #FF6B6B; font-weight: bold;">${this._currentPhaseName}</span> (<span style="color: #FFD93D;">${phaseTime.toFixed(2)}s</span>)</div>`;
        }

        html += `</div>`;

        html += `<div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #444;">
            <div style="font-size: 11px; color: #888; margin-bottom: 4px;">PROGRESS</div>
            <div>Singularities: <span style="color: #4CAF50; font-weight: bold;">${count}</span></div>
        </div>`;

        if (currentQuarks > 0) {
            html += `<div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #444;">
                <div style="font-size: 11px; color: #888; margin-bottom: 4px;">QUARKS</div>
                <div style="margin-bottom: 4px;">Total: 
                    <span style="color: #00BCD4; font-weight: bold;">
                        ${this.formatNumber(currentQuarks)}
                    </span>
                </div>`;

            if (quarksPerSec !== null && quarksPerSec > 0) {
                html += `<div>Rate: 
                    <span style="color: #4DD0E1; font-weight: bold;">
                        ${this.formatNumber(quarksPerSec)}/s
                    </span>
                </div>`;
            }

            if (this.quarksGains.length > 1) {
                const path = this.generateSparklinePath(this.quarksGains, 300, 30);
                html += `<svg width="100%" height="30" style="margin-top: 4px; display: block; overflow: visible;">
                    <path d="${path}" fill="none" stroke="#00BCD4" stroke-width="1.5" vector-effect="non-scaling-stroke" />
                </svg>`;
            }

            html += `</div>`;
        }

        if (currentGoldenQuarks > 0) {
            html += `<div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #444;">
                <div style="font-size: 11px; color: #888; margin-bottom: 4px;">GOLDEN QUARKS</div>
                <div style="margin-bottom: 4px;">Total: <span style="color: #FFD700; font-weight: bold;">${this.formatNumber(currentGoldenQuarks)}</span></div>`;


            if (goldenQuarksPerSec !== null && goldenQuarksPerSec > 0) {
                html += `<div>Rate: <span style="color: #ffbf00; font-weight: bold;">${this.formatNumber(goldenQuarksPerSec)}/s</span></div>`;
            }

            if (this.goldenQuarksGains.length > 1) {
                const avgY = this.getSparklineAverage(this.goldenQuarksGains, 30);
                const path = this.generateSparklinePath(this.goldenQuarksGains, 300, 30);
                html += `<svg width="100%" height="30" style="margin-top: 4px; display: block; overflow: visible;">
                    <line x1="0" y1="${avgY.toFixed(1)}" x2="300" y2="${avgY.toFixed(1)}" stroke="#FFD700" stroke-width="1" stroke-dasharray="2,2" opacity="0.4" />
                    <path d="${path}" fill="none" stroke="#FFD700" stroke-width="1.5" vector-effect="non-scaling-stroke" />
                </svg>`;
            }

            html += `</div>`;
        }

        html += `<div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #444;">
            <div style="font-size: 11px; color: #888; margin-bottom: 4px;">TIMING</div>`;

        if (lastDuration !== null) {
            html += `<div style="margin-bottom: 4px;">Last: <span style="color: #2196F3; font-weight: bold;">${lastDuration.toFixed(2)}s</span></div>`;
        }

        if (avg5 !== null) {
            html += `<div style="margin-bottom: 4px;">Avg (5): <span style="color: #9C27B0; font-weight: bold;">${avg5.toFixed(2)}s</span></div>`;
        }

        if (avg10 !== null) {
            html += `<div style="margin-bottom: 4px;">Avg (10): <span style="color: #19ae11; font-weight: bold;">${avg10.toFixed(2)}s</span></div>`;
        }

        if (avg50 !== null) {
            html += `<div style="margin-bottom: 4px;">Avg (50): <span style="color: #FF9800; font-weight: bold;">${avg50.toFixed(2)}s</span></div>`;
        }

        if (avgAll !== null) {
            html += `<div>Avg (All): <span class="hs-rainbow-text">${avgAll.toFixed(2)}s</span></div>`;
        }

        html += `</div>`;

        // Phase Statistics
        if (this.phaseHistory.size > 0) {
            html += `<div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #444;">
                <div style="font-size: 11px; color: #888; margin-bottom: 4px;">PHASE STATISTICS</div>`;

            const sortedPhases = Array.from(this.phaseHistory.entries()).sort((a, b) => {
                if (!this.strategy) return 0;
                const indexA = this.strategy.strategy.findIndex(p => `${p.startPhase}-${p.endPhase}` === a[0]);
                const indexB = this.strategy.strategy.findIndex(p => `${p.startPhase}-${p.endPhase}` === b[0]);
                return indexA - indexB;
            });

            for (const [phase, data] of sortedPhases) {
                const avg = this.getPhaseAverage(phase);
                if (avg !== null) {
                    html += `<div style="margin-bottom: 2px; font-size: 12px;">
                        <span style="color: #B39DDB;">${phase}</span>: 
                        <span style="color: #FFB74D; font-weight: bold;">${avg.toFixed(2)}s</span>
                        <span style="color: #666;"> (${data.times.length}x)</span>
                        <span style="color: #4FC3F7;"> | Last: ${data.lastTime.toFixed(2)}s</span>
                    </div>`;
                }
            }

            html += `</div>`;
        }

        html += `<div style="margin-top: 4px; font-size: 11px; color: #888;">Strategy: ${this.strategyName}</div>`;
        html += `<div style="margin-top: 4px; font-size: 11px; color: #888;">Loadouts: ${this.loadoutsOrder.map(l => l || 'None').join(', ')}</div>`;

        if (this.dynamicContent) {
            this.dynamicContent.innerHTML = html;
        }
        this.updateExportButton();
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
        this.startTime = 0;
        this.phaseHistory.clear();
        this.singularityBundles = [];
        this.previousQuarks = 0;
        this.previousGoldenQuarks = 0;
        this.lastRecordedPhaseName = null;
        this.stopLiveTimer();
        this.currentLiveTime = 0;
        this.updateDisplay();
    }

    public destroy(): void {
        this.stopLiveTimer();
        if (this.timerDisplay && this.timerDisplay.parentNode) {
            this.timerDisplay.parentNode.removeChild(this.timerDisplay);
        }
    }

    private generateSparklinePath(data: number[], width: number, height: number): string {
        if (data.length < 2) return '';

        // Only show last 50 points to keep it clean
        const history = data.slice(-50);
        const max = Math.max(...history);
        const min = Math.min(...history);
        const range = max - min || 1;

        const points = history.map((val, i) => {
            const x = (i / (history.length - 1)) * width;
            const y = height - ((val - min) / range) * height;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        });

        return `M ${points.join(' L ')}`;
    }

    private getSparklineAverage(data: number[], height: number): number {
        const history = data.slice(-50);
        if (history.length === 0) return height;
        const max = Math.max(...history);
        const min = Math.min(...history);
        const range = max - min || 1;
        const avg = history.reduce((a, b) => a + b, 0) / history.length;
        return height - ((avg - min) / range) * height;
    }
}