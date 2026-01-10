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
    private startTime: number = 0;

    constructor() {
        this.createTimerDisplay();
        this.setupDragAndResize();
    }

    private createTimerDisplay(): void {
        // Create the main container
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
            width: 280px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            display: none;
            overflow: hidden;
        `;

        // Create header with minimize button
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
            line-height: 1;
            padding: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        minimizeBtn.onmouseover = () => {
            minimizeBtn.style.background = 'rgba(255, 255, 255, 0.3)';
        };
        minimizeBtn.onmouseout = () => {
            minimizeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
        };
        minimizeBtn.onclick = () => this.toggleMinimize();

        this.timerHeader.appendChild(title);
        this.timerHeader.appendChild(minimizeBtn);

        // Create content container
        this.timerContent = document.createElement('div');
        this.timerContent.style.cssText = `
            padding: 12px;
            background: rgba(0, 0, 0, 0.9);
        `;

        // Create resize handle
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

        // Assemble the timer display
        this.timerDisplay.appendChild(this.timerHeader);
        this.timerDisplay.appendChild(this.timerContent);
        this.timerDisplay.appendChild(resizeHandle);

        document.body.appendChild(this.timerDisplay);
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
        }
    }

    public start(): void {
        this.timestamps = [];
        this.quarksHistory = [];
        this.startTime = performance.now();
    }

    public recordSingularity(currentQuarks: number): void {
        const now = performance.now();
        this.timestamps.push(now);
        this.quarksHistory.push(currentQuarks);
        this.updateDisplay();
    }

    private getSingularityCount(): number {
        return Math.max(0, this.timestamps.length);
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

    private getQuarksPerSecond(): number | null {
        if (this.quarksHistory.length < 2) {
            return null;
        }

        const firstQuarks = this.quarksHistory[0];
        const lastQuarks = this.quarksHistory[this.quarksHistory.length - 1];
        const quarksDiff = lastQuarks - firstQuarks;

        const totalTimeSeconds = (this.timestamps[this.timestamps.length - 1] - this.startTime) / 1000;

        if (totalTimeSeconds <= 0) {
            return null;
        }

        return quarksDiff / totalTimeSeconds;
    }

    private getLastQuarksGained(): number | null {
        if (this.quarksHistory.length < 2) {
            return null;
        }
        return this.quarksHistory[this.quarksHistory.length - 1] - this.quarksHistory[this.quarksHistory.length - 2];
    }

    private formatNumber(num: number): string {
        return num.toExponential(2).replace('+', '');
    }

    private updateDisplay(): void {
        if (!this.timerContent) return;

        const count = this.getSingularityCount();
        const lastDuration = this.getLastDuration();
        const avg5 = this.getAverageLast(5);
        const avg10 = this.getAverageLast(10);
        const avg50 = this.getAverageLast(50);
        const avgAll = this.getAverageLast(count - 1);
        const quarksPerSec = this.getQuarksPerSecond();
        const lastQuarks = this.getLastQuarksGained();
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
</style>`;

        html += `<div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #444;">
            <div style="font-size: 11px; color: #888; margin-bottom: 4px;">PROGRESS</div>
            <div>Singularities: <span style="color: #4CAF50; font-weight: bold;">${count}</span></div>
        </div>`;

        if (currentQuarks > 0) {
            html += `<div style="margin-bottom: 8px; padding-bottom: 8px; border-bottom: 1px solid #444;">
                <div style="font-size: 11px; color: #888; margin-bottom: 4px;">GOLDEN QUARKS</div>
                <div style="margin-bottom: 4px;">Total: <span style="color: #FFD700; font-weight: bold;">${this.formatNumber(currentQuarks)}</span></div>`;

            if (lastQuarks !== null && lastQuarks > 0) {
                html += `<div style="margin-bottom: 4px;">Last Gain: <span style="color: #ffbf00; font-weight: bold;">+${this.formatNumber(lastQuarks)}</span></div>`;
            }

            if (quarksPerSec !== null && quarksPerSec > 0) {
                html += `<div>Rate: <span style="color: #ffbf00; font-weight: bold;">${this.formatNumber(quarksPerSec)}/s</span></div>`;
            }

            html += `</div>`;
        }

        html += `<div style="margin-bottom: 4px;">
            <div style="font-size: 11px; color: #888; margin-bottom: 4px;">TIMING</div>`;

        if (lastDuration !== null) {
            html += `<div style="margin-bottom: 4px;">Last: <span style="color: #2196F3; font-weight: bold;">${lastDuration.toFixed(1)}s</span></div>`;
        }

        if (avg5 !== null) {
            html += `<div style="margin-bottom: 4px;">Avg (5): <span style="color: #9C27B0; font-weight: bold;">${avg5.toFixed(1)}s</span></div>`;
        }

        if (avg10 !== null) {
            html += `<div>Avg (10): <span style="color: #19ae11; font-weight: bold;">${avg10.toFixed(1)}s</span></div>`;
        }

        if (avg50 !== null) {
            html += `<div>Avg (50): <span style="color: #FF9800; font-weight: bold;">${avg50.toFixed(1)}s</span></div>`;
        }

        if (avgAll !== null) {
            html += `<div>Avg (All): <span class="hs-rainbow-text">${avgAll.toFixed(1)}s</span></div>`;
        }

        html += `</div>`;

        this.timerContent.innerHTML = html;
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
    }

    public reset(): void {
        this.timestamps = [];
        this.quarksHistory = [];
        this.startTime = 0;
        this.updateDisplay();
    }

    public destroy(): void {
        if (this.timerDisplay && this.timerDisplay.parentNode) {
            this.timerDisplay.parentNode.removeChild(this.timerDisplay);
        }
    }
}
