/**
 * Updates the sparkline chart display for the given DOM and data.
 *
 * Usage/Interface:
 *   - The modal or parent passes the full metrics array and maxPoints.
 *   - This function slices the data internally for both chart display and label statistics.
 *   - For chart display: only the last `maxPoints` are shown (chartData = data.slice(-maxPoints)).
 *   - For label/windowed stats: windowSize = min(chartData.length, maxPoints).
 *
 * Handles all chart types (time/duration, quarks, golden quarks) and ensures both raw and average lines are always in range.
 *
 * @param dom SparklineDom instance (holds all chart DOM references and state)
 * @param data Full metrics array (not sliced)
 * @param computedGraphWidth SVG width (optional, defaults to 230)
 * @param formatNumberWithSign Number formatting function for labels
 * @param maxPoints Maximum points to display in chart (window for display and label stats)
 */
export function updateSparkline(
    dom: SparklineDom | null,
    data: any[],
    computedGraphWidth: number | null,
    formatNumberWithSign: (n: number) => string,
    maxPoints: number
): void {
    if (!dom) {
        console.warn('[sparkline] updateSparkline: dom is null');
        return;
    }
    // --- Map data to correct value/runningAvg property for each chart type ---
    // This helper ensures the chart always uses the right fields for each metric type.
    function mapChartData(dom: SparklineDom | null, data: any[]): any[] {
        if (!Array.isArray(data)) return [];
        if (dom && dom.isTime) {
            // Time chart: use duration and runningAvgDuration
            return data.map(m => ({
                ...m,
                value: m.duration,
                runningAvg: m.runningAvgDuration
            }));
        } else if (dom && dom.container && dom.container.id === 'hs-sparkline-quarks-container') {
            // Quarks chart: use quarksGained and runningAvgQuarksPerSecond
            return data.map(m => ({
                ...m,
                value: m.quarksGained,
                runningAvg: m.runningAvgQuarksPerSecond
            }));
        } else if (dom && dom.container && dom.container.id === 'hs-sparkline-goldenquarks-container') {
            // Golden Quarks chart: use goldenQuarksGained and runningAvgGoldenQuarksPerSecond
            return data.map(m => ({
                ...m,
                value: m.goldenQuarksGained,
                runningAvg: m.runningAvgGoldenQuarksPerSecond
            }));
        }
        // Fallback: return as-is
        return data;
    }

    // Only keep the last maxPoints for display and stats
    let chartData: any[] = mapChartData(dom, Array.isArray(data) && maxPoints > 0 ? data.slice(-maxPoints) : data);

    // If not enough data, clear chart and labels
    if (!Array.isArray(chartData) || chartData.length < 2) {
        console.warn('[sparkline] updateSparkline: insufficient data', chartData);
        dom.rawPolyline.setAttribute('points', '');
        if (dom.avgPolyline) dom.avgPolyline.setAttribute('points', '');
        dom.labelMax.textContent = '';
        dom.labelAvg.textContent = '';
        dom.labelMin.textContent = '';
        return;
    }

    // --- Chart scaling and axis setup ---
    const gw = computedGraphWidth || 230; // SVG width
    const times = chartData.map(d => d.timestamp);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const timeRange = maxTime - minTime || 1; // Avoid div by zero

    // Only update SVG width if changed
    const widthChanged = dom.lastWidth !== gw;
    if (widthChanged) {
        dom.svg.setAttribute('width', `${gw}`);
        dom.lastWidth = gw;
    }

    // --- Unified logic for all chart types ---
    // Parameterize y-value extraction and min/max calculation for both raw and avg lines
    let getRawY: (d: any) => number;
    let getAvgY: (d: any) => number;
    let allYValues: number[] = [];
    let labelSuffix = '';
    let labelAvgNumerator = 0;
    let labelAvgDenominator = 0;

    if (dom.isTime) {
        // For time chart: y = duration, avg = runningAvgDuration
        getRawY = d => d.value;
        getAvgY = d => typeof d.runningAvg === 'number' ? d.runningAvg : 0;
        // Both lines must be in range
        allYValues = chartData.map(getRawY).concat(chartData.map(getAvgY));
        labelSuffix = 's';
        // Label avg: mean of windowed durations
        const windowSize = Math.min(chartData.length, maxPoints);
        const windowStart = chartData.length - windowSize;
        const windowValues = chartData.map(getRawY).slice(windowStart);
        labelAvgNumerator = windowValues.reduce((a, b) => a + b, 0);
        labelAvgDenominator = windowValues.length;
    } else {
        // For quarks/golden: y = value/duration, avg = runningAvg
        getRawY = d => d.value / d.duration;
        getAvgY = d => typeof d.runningAvg === 'number' ? d.runningAvg : 0;
        // Both lines must be in range
        allYValues = chartData.flatMap(d => [getRawY(d), getAvgY(d)]);
        labelSuffix = ' /s';
        // Label avg: sum(value)/sum(duration) over window
        const labelAvgCount = Math.min(chartData.length, maxPoints);
        for (let i = chartData.length - labelAvgCount; i < chartData.length; i++) {
            if (i >= 0) {
                labelAvgNumerator += chartData[i].value;
                labelAvgDenominator += chartData[i].duration;
            }
        }
    }

    // Compute min/max for both lines (ensures both are always visible)
    const minY = Math.min(...allYValues);
    const maxY = Math.max(...allYValues);
    const yRange = maxY - minY || 1;

    // --- Polyline point calculation helper ---
    // Converts data array to SVG polyline points string
    function buildPoints(arr: any[], yFn: (d: any) => number): string {
        return arr.map(d => {
            // X: normalized timestamp, Y: normalized value (inverted for SVG)
            const x = ((d.timestamp - minTime) / timeRange) * gw;
            const y = 30 - ((yFn(d) - minY) / yRange) * 30;
            return `${x},${y}`;
        }).join(' ');
    }

    // Build points for both raw and avg lines
    const rawPointsStr = buildPoints(chartData, getRawY);
    const avgPointsStr = buildPoints(chartData, getAvgY);

    // --- Polyline DOM updates ---
    // For time chart: raw = dashed, avg = solid; for others: avg = solid, raw = dashed
    if (dom.isTime) {
        if (dom.lastPoints !== rawPointsStr) {
            dom.rawPolyline.setAttribute('points', rawPointsStr);
            dom.lastPoints = rawPointsStr;
        }
        if (dom.avgPolyline && dom.lastPointsSecond !== avgPointsStr) {
            dom.avgPolyline.setAttribute('points', avgPointsStr);
            dom.lastPointsSecond = avgPointsStr;
        }
    } else {
        if (dom.avgPolyline && dom.lastPoints !== avgPointsStr) {
            dom.avgPolyline.setAttribute('points', avgPointsStr);
            dom.lastPoints = avgPointsStr;
        }
        if (dom.rawPolyline && dom.lastPointsSecond !== rawPointsStr) {
            dom.rawPolyline.setAttribute('points', rawPointsStr);
            dom.lastPointsSecond = rawPointsStr;
        }
    }

    // --- Min/max marker lines ---
    // Draw horizontal lines at min and max Y values (right edge of chart)
    const markerX = Math.max(0, gw - 4); // X position for marker lines (near right edge)
    const maxYPos = 30 - ((maxY - minY) / yRange) * 30;
    const minYPos = 30 - ((minY - minY) / yRange) * 30;

    // Only update marker lines if needed
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

    // --- Labels ---
    // Compute and update min, avg, max labels for the chart
    let labelMax, labelAvg, labelMin;
    if (dom.isTime) {
        labelMax = `${maxY.toFixed(2)}${labelSuffix}`;
        labelAvg = labelAvgDenominator > 0 ? `${(labelAvgNumerator / labelAvgDenominator).toFixed(2)}${labelSuffix} avg` : `0.00${labelSuffix} avg`;
        labelMin = `${minY.toFixed(2)}${labelSuffix}`;
    } else {
        labelMax = `${formatNumberWithSign(maxY)}${labelSuffix}`;
        labelAvg = labelAvgDenominator > 0 ? `${formatNumberWithSign(labelAvgNumerator / labelAvgDenominator)}${labelSuffix}` : `0.00${labelSuffix}`;
        labelMin = `${formatNumberWithSign(minY)}${labelSuffix}`;
    }
    // Only update DOM if label changed
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

/**
 * Sparkline chart logic extracted from hs-autosingTimerModal.ts.
 *
 * All chart rendering and DOM logic for sparklines is now modularized here for maintainability and reuse.
 *
 * Interface summary:
 *   - updateSparkline(dom, data, computedGraphWidth, formatNumberWithSign, maxPoints):
 *     - Modal passes full metrics array and maxPoints
 *     - Chart slices internally for display and label stats
 */
export interface SparklineDom {
    container: HTMLElement;
    svg: SVGSVGElement;
    rawPolyline: SVGPolylineElement;
    avgPolyline: SVGPolylineElement | null;
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
    lastMarkerX: number;
    lastMaxY: number;
    lastMinY: number;
    lastLabelMax: string;
    lastLabelAvg: string;
    lastLabelMin: string;
}

/**
 * Creates and initializes the DOM structure for a sparkline chart.
 *
 * This function builds the SVG and label elements for a sparkline, including:
 *   - SVG polylines for raw and average lines (dashed and solid)
 *   - Horizontal marker lines for min and max values
 *   - Label spans for min, avg, and max values
 *
 * Returns a SparklineDom object with references to all key elements for efficient updates.
 *
 * @param container The parent HTML element to contain the sparkline chart.
 * @param color The color to use for the chart lines and labels.
 * @param isTime Whether this chart is for time/duration (true) or for rates (false).
 * @returns SparklineDom object with references to SVG, polylines, marker lines, and labels, or null if container is missing.
 */
export function buildSparklineDom(container: HTMLElement | null, color: string, isTime: boolean): SparklineDom | null {
    if (!container) return null;
    container.textContent = '';
    const ns = 'http://www.w3.org/2000/svg';
    // --- SVG setup ---
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('height', '30');
    svg.style.display = 'block';
    svg.style.overflow = 'visible';

    // --- Raw polyline (dashed, lower opacity) ---
    const rawPolyline = document.createElementNS(ns, 'polyline');
    rawPolyline.setAttribute('fill', 'none');
    rawPolyline.setAttribute('stroke', color);
    rawPolyline.setAttribute('stroke-width', '1');
    rawPolyline.setAttribute('stroke-opacity', '0.5');
    rawPolyline.setAttribute('stroke-dasharray', '2,2');

    // --- Avg polyline (solid, higher opacity) ---
    let avgPolyline: SVGPolylineElement | null = null;
    avgPolyline = document.createElementNS(ns, 'polyline');
    avgPolyline.setAttribute('fill', 'none');
    avgPolyline.setAttribute('stroke', color);
    avgPolyline.setAttribute('stroke-width', '1');
    avgPolyline.setAttribute('stroke-opacity', '0.8');
    avgPolyline.removeAttribute('stroke-dasharray');

    // --- Marker lines for min/max ---
    const maxLine = document.createElementNS(ns, 'line');
    maxLine.setAttribute('stroke', color);
    maxLine.setAttribute('stroke-width', '1');
    const minLine = document.createElementNS(ns, 'line');
    minLine.setAttribute('stroke', color);
    minLine.setAttribute('stroke-width', '1');

    // --- Assemble SVG ---
    svg.appendChild(rawPolyline);
    if (avgPolyline) svg.appendChild(avgPolyline);
    svg.appendChild(maxLine);
    svg.appendChild(minLine);

    // --- Labels for min/avg/max ---
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

    // --- Attach to container ---
    container.appendChild(svg);
    container.appendChild(labels);

    // --- Return SparklineDom object with all references and state ---
    return {
        container,
        svg,
        rawPolyline,
        avgPolyline,
        maxLine,
        minLine,
        labelMax,
        labelAvg,
        labelMin,
        isTime,
        color,
        lastWidth: 0,
        lastPoints: '',
        lastPointsSecond: '',
        lastMarkerX: 0,
        lastMaxY: 0,
        lastMinY: 0,
        lastLabelMax: '',
        lastLabelAvg: '',
        lastLabelMin: ''
    };
}
