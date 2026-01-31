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
import { HSGlobal } from "../../hs-core/hs-global";

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
    private quarksAmounts: number[] = [];
    private goldenQuarksAmounts: number[] = [];
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
    private stopButton!: HTMLButtonElement;
    private finishStopBtn!: HTMLButtonElement;
    private minimizeBtn!: HTMLButtonElement;

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
        this.timerDisplay.style.display = 'none';

        /* ---------- HEADER ---------- */
        this.timerHeader = document.createElement('div');
        this.timerHeader.className = 'hs-timer-header';

        const title = document.createElement('span');
        title.textContent = '⏱️ Autosing Timer';
        title.className = 'hs-timer-title';

        this.minimizeBtn = document.createElement('button');
        this.minimizeBtn.textContent = '−';
        this.minimizeBtn.title = "Minimize";
        this.minimizeBtn.className = 'hs-minimize-btn';

        this.finishStopBtn = document.createElement('button');
        this.finishStopBtn.textContent = '🏁🛑';
        this.finishStopBtn.title = "Go to the very end of current Singularity, then Stop.";
        this.finishStopBtn.className = 'hs-stop-btn';
        this.finishStopBtn.onclick = () => {
            const autosingMod = HSModuleManager.getModule<any>('HSAutosing');
            if (autosingMod) {
                const newState = !autosingMod.isStopAtSingularitysEnd();
                autosingMod.setStopAtSingularitysEnd(newState);
                this.finishStopBtn.style.backgroundColor = newState ? '#ff9800' : '';
            }
        };

        this.stopButton = document.createElement('button');
        this.stopButton.textContent = '👇🛑';
        this.stopButton.title = "Stop Autosing";
        this.stopButton.className = 'hs-stop-btn';
        this.stopButton.onclick = () => {
            const toggle = document.getElementById('hs-setting-auto-sing-enabled');
            if (toggle) toggle.click();
        };

        this.minimizeBtn.onclick = () => this.toggleMinimize();

        this.timerHeader.appendChild(title);
        this.timerHeader.appendChild(document.createElement('div')); // Spacer



        const controls = document.createElement('div');
        controls.style.display = 'flex';
        controls.appendChild(this.finishStopBtn);
        controls.appendChild(this.stopButton);
        controls.appendChild(this.minimizeBtn);
        this.timerHeader.appendChild(controls);

        /* ---------- CONTENT ---------- */
        this.timerContent = document.createElement('div');
        this.timerContent.className = 'hs-timer-content';

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
            if (this.stopButton) this.stopButton.style.display = 'none';
            if (this.finishStopBtn) this.finishStopBtn.style.display = 'none';
            if (this.minimizeBtn) this.minimizeBtn.textContent = '+';
        } else {
            this.timerContent.style.display = 'block';
            this.timerDisplay.style.height = '';
            if (this.stopButton) this.stopButton.style.display = 'block';
            if (this.finishStopBtn) this.finishStopBtn.style.display = 'block';
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
            this.updateDisplay();
        }, 100);
    }

    private stopLiveTimer(): void {
        if (this.liveTimerInterval !== null) {
            clearInterval(this.liveTimerInterval);
            this.liveTimerInterval = null;
        }
    }

    public start(strategy: HSAutosingStrategy, initialQuarks: number = 0, initialGoldenQuarks: number = 0): void {
        this.timestamps = [];
        this.quarksHistory = [];
        this.goldenQuarksHistory = [];
        this.quarksGains = [];
        this.goldenQuarksGains = [];
        this.startTime = performance.now();
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
        this.modVersion = HSGlobal.General.currentModVersion;

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

    public recordSingularity(gainedGoldenQuarks: number, currentGoldenQuarks: number): void {
        const now = performance.now();
        const isFirstCall = this.timestamps.length === 0;

        const singularityDuration = isFirstCall
            ? (now - this.startTime) / 1000
            : (now - this.timestamps[this.timestamps.length - 1]) / 1000;

        this.timestamps.push(now);

        if (isFirstCall) {
            this.sessionQuarksGained = 0;
        }

        this.latestGoldenQuarksTotal = currentGoldenQuarks;

        // Calculate Real Quark Gain via Wallet Delta (DOM-based)
        const previousQuarksTotal = this.latestQuarksTotal;
        let currentQuarksTotal = previousQuarksTotal;
        const quarkDisplay = document.getElementById('quarkDisplay');
        if (quarkDisplay && quarkDisplay.textContent) {
            const text = quarkDisplay.textContent.replace(/,/g, '');
            currentQuarksTotal = parseFloat(text);
        }

        const realQuarksGain = currentQuarksTotal - previousQuarksTotal;
        this.latestQuarksTotal = currentQuarksTotal;

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

        if (singularityDuration > 0 && !isFirstCall) {
            // Ignore initial dummy calls with no gain to keep chart clean
            // Use realQuarksGain here instead of the inaccurate passed argument
            this.quarksGains.push(realQuarksGain / singularityDuration);
            this.quarksAmounts.push(realQuarksGain);

            if (gainedGoldenQuarks > 0 || this.goldenQuarksGains.length > 0) {
                this.goldenQuarksGains.push(gainedGoldenQuarks / singularityDuration);
                this.goldenQuarksAmounts.push(gainedGoldenQuarks);
            }

            // O(1) optimization updates
            this.cumulativeSingularityTime += singularityDuration;
            this.cumulativeQuarksGained += realQuarksGain;
            this.cumulativeGoldenQuarksGained += gainedGoldenQuarks;

            // Track sum of rates for O(1) average rate calculation
            this.cumulativeQuarksRate += (realQuarksGain / singularityDuration);
            if (gainedGoldenQuarks > 0 || this.goldenQuarksGains.length > 0) {
                this.cumulativeGoldenQuarksRate += (gainedGoldenQuarks / singularityDuration);
            }
        }

        this.sessionQuarksGained += realQuarksGain;

        // Reset phase tracking for new singularity
        this.startLiveTimer();

        this.updateDisplay();
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
        const avgAll = this.getAverageLast(count);
        const goldenQuarksPerSec = this.getQuarksPerSecond(this.goldenQuarksHistory);
        const lastGoldenQuarks = this.getLastQuarksGained(this.goldenQuarksHistory);
        const currentGoldenQuarks = this.latestGoldenQuarksTotal;
        const previousGoldenQuarks = this.goldenQuarksHistory.length > 1
            ? this.goldenQuarksHistory[this.goldenQuarksHistory.length - 2]
            : this.initialGoldenQuarksWallet;

        const quarksPerSec = this.getQuarksPerSecond(this.quarksHistory);
        const lastQuarks = this.getLastQuarksGained(this.quarksHistory);
        const currentQuarks = this.latestQuarksTotal;
        const previousQuarks = this.quarksHistory.length > 1
            ? this.quarksHistory[this.quarksHistory.length - 2]
            : this.initialQuarksWallet;

        let html = '';

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
            <div>Singularities Done: <span style="color: #4CAF50; font-weight: bold;">${count}</span></div>
        </div>`;

        // Quarks section
        html += `<div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #444;">
            <div style="font-size: 11px; color: #888; margin-bottom: 4px;">QUARKS</div>
            <div style="margin-bottom: 4px;">Latest Total: 
                <span style="color: #00BCD4; font-weight: bold;">
                    ${this.formatNumber(currentQuarks)}
                </span>
                <span style="color: #666;"> (⇦${this.formatNumber(previousQuarks)})</span>
           </div>`;

        if (quarksPerSec !== null && this.quarksAmounts.length > 0) {
            const quarksPerHour = quarksPerSec * 3600;
            html += `<div>Rate: 
                <span style="color: #4DD0E1; font-weight: bold;">
                    ${this.formatNumber(quarksPerSec)}/s
                </span>
                <span style="color: #666;"> (${this.formatNumber(quarksPerHour)}/hr)</span>
            </div>`;

            if (this.quarksAmounts.length >= 1) {
                // Rate Average (Label)
                const recentRates = this.quarksGains.slice(-50);
                const valAvg = recentRates.reduce((a, b) => a + b, 0) / recentRates.length;

                // Amount Curve & Position
                const avgY = this.getSparklineAverage(this.quarksAmounts, 30);
                const spark = this.generateSparklineMetadata(this.quarksAmounts, 250, 30);

                html += `<div style="display: flex; align-items: stretch; gap: 4px; margin-top: 4px;">
                    <svg width="250" height="30" style="display: block; overflow: visible;">
                        <line x1="250" y1="0" x2="255" y2="0" stroke="#00BCD4" stroke-width="1" />
                        <line x1="250" y1="30" x2="255" y2="30" stroke="#00BCD4" stroke-width="1" />
                        <line x1="0" y1="${avgY.toFixed(1)}" x2="250" y2="${avgY.toFixed(1)}" stroke="#00BCD4" stroke-width="1" stroke-dasharray="2,2" opacity="0.9" />
                        <path d="${spark.path}" fill="none" stroke="#00BCD4" stroke-width="1.5" vector-effect="non-scaling-stroke" />
                    </svg>
                    <div style="display: flex; flex-direction: column; justify-content: space-between; font-size: 9px; color: #ccc; line-height: 1;">
                        <span>+${this.formatNumber(spark.max)}</span>
                        <span style="color: #00BCD4; opacity: 0.9;">${this.formatNumber(valAvg)}/s</span>
                        <span>+${this.formatNumber(spark.min)}</span>
                    </div>
                </div>`;
            }
        }

        html += `</div>`;

        // Golden Quarks section
        if (currentGoldenQuarks > 0) {
            html += `<div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #444;">
                <div style="font-size: 11px; color: #888; margin-bottom: 4px;">GOLDEN QUARKS</div>
                <div style="margin-bottom: 4px;">Latest Total:
                    <span style="color: #FFD700; font-weight: bold;">
                        ${this.formatNumber(currentGoldenQuarks)}
                    </span>
                    <span style="color: #666;"> (⇦${this.formatNumber(previousGoldenQuarks)})</span>
                </div>`;

            if (goldenQuarksPerSec !== null && this.goldenQuarksAmounts.length > 0) {
                const goldenQuarksPerHour = goldenQuarksPerSec * 3600;
                html += `<div>Rate:
                    <span style="color: #ffbf00; font-weight: bold;">
                        ${this.formatNumber(goldenQuarksPerSec)}/s
                    </span>
                    <span style="color: #666;"> (${this.formatNumber(goldenQuarksPerHour)}/hr)</span>
                </div>`;

                if (this.goldenQuarksAmounts.length >= 1) {
                    // Rate Average (Label)
                    const recentRates = this.goldenQuarksGains.slice(-50);
                    const valAvg = recentRates.reduce((a, b) => a + b, 0) / recentRates.length;

                    // Amount Curve & Position
                    const avgY = this.getSparklineAverage(this.goldenQuarksAmounts, 30);
                    const spark = this.generateSparklineMetadata(this.goldenQuarksAmounts, 250, 30);

                    html += `<div style="display: flex; align-items: stretch; gap: 4px; margin-top: 4px;">
                        <svg width="250" height="30" style="display: block; overflow: visible;">
                            <line x1="250" y1="0" x2="255" y2="0" stroke="#FFD700" stroke-width="1" />
                            <line x1="250" y1="30" x2="255" y2="30" stroke="#FFD700" stroke-width="1" />
                            <line x1="0" y1="${avgY.toFixed(1)}" x2="250" y2="${avgY.toFixed(1)}" stroke="#FFD700" stroke-width="1" stroke-dasharray="2,2" opacity="0.9" />
                            <path d="${spark.path}" fill="none" stroke="#FFD700" stroke-width="1.5" vector-effect="non-scaling-stroke" />
                        </svg>
                        <div style="display: flex; flex-direction: column; justify-content: space-between; font-size: 9px; color: #ccc; line-height: 1;">
                            <span>+${this.formatNumber(spark.max)}</span>
                            <span style="color: #FFD700; opacity: 0.9;">${this.formatNumber(valAvg)}/s</span>
                            <span>+${this.formatNumber(spark.min)}</span>
                        </div>
                    </div>`;
                }
            }

            html += `</div>`;
        }

        // Timing section
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

        // Phase Statistics Section
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

        // Misc section (Mod version, Strategy, Loadouts)
        html += `<div style="margin-top: 4px; font-size: 11px; color: #888;">Mod version: v${this.modVersion}</div>`;
        html += `<div style="margin-top: 4px; font-size: 11px; color: #888;">Strategy name: ${this.strategyName}</div>`;
        html += `<div style="margin-top: 4px; font-size: 11px; color: #888;">Loadouts order: ${this.loadoutsOrder.map(l => l || 'None').join(', ')}</div>`;

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
        this.quarksAmounts = [];
        this.goldenQuarksAmounts = [];
        this.startTime = 0;
        this.phaseHistory.clear();
        this.singularityBundles = [];
        this.sessionQuarksGained = 0;
        this.sessionGoldenQuarksGained = 0;
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

    private generateSparklineMetadata(data: number[], width: number, height: number): { path: string, max: number, min: number } {
        if (data.length < 1) return { path: '', max: 0, min: 0 };

        const history = data.slice(-50);
        const max = Math.max(...history);
        const min = Math.min(...history);

        // If the formatted values are identical, treat as flat line to avoid "noise bumps"
        if (this.formatNumber(max) === this.formatNumber(min)) {
            return {
                path: `M 0,${(height / 2).toFixed(1)} L ${width},${(height / 2).toFixed(1)}`,
                max: max,
                min: min
            };
        }

        const range = max - min;

        if (range === 0 || history.length === 1) {
            return {
                path: `M 0,${(height / 2).toFixed(1)} L ${width},${(height / 2).toFixed(1)}`,
                max: max,
                min: min
            };
        }

        // Add 10% padding to top and bottom
        const padding = range * 0.1;
        const displayMin = min - padding;
        const displayRange = range + 2 * padding;

        const points = history.map((val, i) => {
            const x = (i / (history.length - 1)) * width;
            const y = height - ((val - displayMin) / displayRange) * height;
            return `${x.toFixed(1)},${y.toFixed(1)}`;
        });

        return {
            path: `M ${points.join(' L ')}`,
            max: max,
            min: min
        };
    }

    private generateSparklinePath(data: number[], width: number, height: number): string {
        return this.generateSparklineMetadata(data, width, height).path;
    }

    private getSparklineAverage(data: number[], height: number): number {
        const history = data.slice(-50);
        if (history.length === 0) return height / 2;
        const max = Math.max(...history);
        const min = Math.min(...history);
        const range = max - min;

        if (range === 0) return height / 2;

        // If the formatted values are identical, treat as flat line (center the average)
        if (this.formatNumber(max) === this.formatNumber(min)) {
            return height / 2;
        }

        const padding = range * 0.1;
        const displayMin = min - padding;
        const displayRange = range + 2 * padding;

        const avg = history.reduce((a, b) => a + b, 0) / history.length;
        return height - ((avg - displayMin) / displayRange) * height;
    }
}