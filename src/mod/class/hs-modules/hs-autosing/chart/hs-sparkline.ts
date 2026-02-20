/**
 * Update sparkline chart display.
 *
 * Interface:
 *   - Modal passes the full metrics array and maxPoints.
 *   - Chart module slices internally for chart display and label stats.
 *   - For chart display: chartData = data.slice(-maxPoints)
 *   - For label/windowed stats: windowSize = min(chartData.length, maxPoints)
 *
 * @param dom SparklineDom instance
 * @param data Full metrics array (not sliced)
 * @param computedGraphWidth SVG width
 * @param formatNumberWithSign Number formatting function
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
    // Slice for chart display (only the datapoints to show on the chart)
    // Map data to correct value property for each chart type
    let chartData: any[] = Array.isArray(data) && maxPoints > 0 ? data.slice(-maxPoints) : data;
    if (dom && dom.isTime) {
        // For time chart, value = duration, runningAvg = runningAvgDuration
        chartData = chartData.map(m => ({
            ...m,
            value: m.duration,
            runningAvg: m.runningAvgDuration
        }));
    } else if (dom && dom.container && dom.container.id === 'hs-sparkline-quarks-container') {
        // For quarks chart, value = quarksGained, runningAvg = runningAvgQuarksPerSecond
        chartData = chartData.map(m => ({
            ...m,
            value: m.quarksGained,
            runningAvg: m.runningAvgQuarksPerSecond
        }));
    } else if (dom && dom.container && dom.container.id === 'hs-sparkline-goldenquarks-container') {
        // For golden quarks chart, value = goldenQuarksGained, runningAvg = runningAvgGoldenQuarksPerSecond
        chartData = chartData.map(m => ({
            ...m,
            value: m.goldenQuarksGained,
            runningAvg: m.runningAvgGoldenQuarksPerSecond
        }));
    }
    if (!Array.isArray(chartData) || chartData.length < 2) {
        console.warn('[sparkline] updateSparkline: insufficient data', chartData);
        dom.rawPolyline.setAttribute('points', '');
        if (dom.avgPolyline) dom.avgPolyline.setAttribute('points', '');
        dom.labelMax.textContent = '';
        dom.labelAvg.textContent = '';
        dom.labelMin.textContent = '';
        return;
    }
    // Filter chartData to only valid points
    const filtered = chartData.filter(d => typeof d.value === 'number' && !isNaN(d.value) && typeof d.timestamp === 'number' && !isNaN(d.timestamp));
    if (filtered.length < 2) {
        console.warn('[sparkline] updateSparkline: insufficient valid data', filtered, chartData);
        dom.rawPolyline.setAttribute('points', '');
        if (dom.avgPolyline) dom.avgPolyline.setAttribute('points', '');
        dom.labelMax.textContent = '';
        dom.labelAvg.textContent = '';
        dom.labelMin.textContent = '';
        return;
    }
    if (filtered.length !== chartData.length) {
        console.warn('[sparkline] updateSparkline: invalid points detected', { filtered, original: chartData });
    }
    const gw = computedGraphWidth || 230;
    const times = filtered.map(d => d.timestamp);
    const values = filtered.map(d => d.value);
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const timeRange = maxTime - minTime || 1;

    const widthChanged = dom.lastWidth !== gw;
    if (widthChanged) {
        dom.svg.setAttribute('width', `${gw}`);
        dom.lastWidth = gw;
    }

    // Always: rawPolyline = raw values (dotted), avgPolyline = running average (solid)
    if (dom.isTime) {
        // Time chart: raw values and running average duration lines
        // Collect both raw values and runningAvg values for min/max
        const runningAvgs = filtered.map(d => typeof d.runningAvg === 'number' ? d.runningAvg : 0);
        const allYValues = values.concat(runningAvgs);
        const min = Math.min(...allYValues);
        const max = Math.max(...allYValues);
        const range = max - min;
        const safeRange = range === 0 ? 1 : range;
        if (range === 0) {
            console.warn('[sparkline] updateSparkline: min == max, using safeRange=1', { min, max, allYValues });
        }
        // Windowed average for label (last maxPoints or fewer)
        const windowSize = Math.min(filtered.length, maxPoints);
        const windowStart = filtered.length - windowSize;
        const windowValues = values.slice(windowStart);
        const windowAvg = windowValues.length > 0 ? windowValues.reduce((a, b) => a + b, 0) / windowValues.length : 0;

        // Dotted line: raw values
        const points = filtered.map(d => {
            const x = ((d.timestamp - minTime) / timeRange) * gw;
            const y = 30 - ((d.value - min) / safeRange) * 30;
            if (isNaN(x) || isNaN(y)) {
                console.error('[sparkline] updateSparkline: NaN in polyline point', { d, x, y, min, max, safeRange });
            }
            return `${x},${y}`;
        }).join(' ');
        if (dom.lastPoints !== points) {
            dom.rawPolyline.setAttribute('points', points);
            dom.lastPoints = points;
        }

        // Solid line: use stored runningAvgDuration for each metric
        const avgPoints: string[] = [];
        for (let i = 0; i < filtered.length; i++) {
            const metric = filtered[i];
            const runningAvg = typeof metric.runningAvg === 'number' ? metric.runningAvg : 0;
            const x = ((metric.timestamp - minTime) / timeRange) * gw;
            const y = 30 - ((runningAvg - min) / safeRange) * 30;
            if (isNaN(x) || isNaN(y)) {
                console.error('[sparkline] updateSparkline: NaN in avg polyline point', { i, metric, x, y, min, max, safeRange });
            }
            avgPoints.push(`${x},${y}`);
        }
        const avgPointsStr = avgPoints.join(' ');
        if (dom.avgPolyline && dom.lastPointsSecond !== avgPointsStr) {
            dom.avgPolyline.setAttribute('points', avgPointsStr);
            dom.lastPointsSecond = avgPointsStr;
        }

        const markerX = Math.max(0, gw - 4);
        const maxY = 30 - ((max - min) / safeRange) * 30;
        const minY = 30 - ((min - min) / safeRange) * 30;

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
        const labelAvg = windowAvg > 0 ? `${windowAvg.toFixed(2)}s avg` : '0.00s avg';
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
        // Quarks/golden: raw values and running average (use mapped value/runningAvg)
        let avgLabelGainSum = 0;
        let avgLabelTimeSum = 0;
        const avgPoints: string[] = [];
        const rawPoints: string[] = [];
        const labelAvgCount = Math.min(chartData.length, maxPoints);
        // Compute minY/maxY for scaling
        let minY = Infinity;
        let maxY = -Infinity;
        for (let i = 0; i < chartData.length; i++) {
            const d = chartData[i];
            // For label average (last maxPoints entries)
            if (i >= chartData.length - labelAvgCount) {
                avgLabelGainSum += d.value;
                avgLabelTimeSum += d.duration;
            }
            const individualRate = d.value / d.duration;
            const runningAvg = typeof d.runningAvg === 'number' ? d.runningAvg : 0;
            minY = Math.min(minY, runningAvg, individualRate);
            maxY = Math.max(maxY, runningAvg, individualRate);
        }
        const yRange = maxY - minY || 1;
        // Build polylines
        for (let i = 0; i < chartData.length; i++) {
            const d = chartData[i];
            const individualRate = d.value / d.duration;
            const runningAvg = typeof d.runningAvg === 'number' ? d.runningAvg : 0;
            const x = ((d.timestamp - minTime) / timeRange) * gw;
            const yAvg = 30 - ((runningAvg - minY) / yRange) * 30;
            const yRaw = 30 - ((individualRate - minY) / yRange) * 30;
            avgPoints.push(`${x},${yAvg}`);
            rawPoints.push(`${x},${yRaw}`);
        }
        const avgPointsStr = avgPoints.join(' ');
        const rawPointsStr = rawPoints.join(' ');
        if (dom.avgPolyline && dom.lastPoints !== avgPointsStr) {
            dom.avgPolyline.setAttribute('points', avgPointsStr);
            dom.lastPoints = avgPointsStr;
        }
        if (dom.rawPolyline && dom.lastPointsSecond !== rawPointsStr) {
            dom.rawPolyline.setAttribute('points', rawPointsStr);
            dom.lastPointsSecond = rawPointsStr;
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

        // Chart label values: max, avg (last maxPoints), min
        const labelMax = `${formatNumberWithSign(maxY)} /s`;
        const labelAvg = `${formatNumberWithSign(avgLabelGainSum / avgLabelTimeSum)} /s`;
        const labelMin = `${formatNumberWithSign(minY)} /s`;
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
 * Sparkline chart logic extracted from hs-autosingTimerModal.ts
 * All chart rendering and DOM logic for sparklines is now modularized here.
 *
 * New interface: updateSparkline(dom, data, computedGraphWidth, formatNumberWithSign, maxPoints)
 * - Modal passes full metrics array and maxPoints
 * - Chart slices internally for display and label stats
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

export function buildSparklineDom(container: HTMLElement | null, color: string, isTime: boolean): SparklineDom | null {
    if (!container) return null;
    container.textContent = '';
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('height', '30');
    svg.style.display = 'block';
    svg.style.overflow = 'visible';
    const rawPolyline = document.createElementNS(ns, 'polyline');
    rawPolyline.setAttribute('fill', 'none');
    rawPolyline.setAttribute('stroke', color);
    rawPolyline.setAttribute('stroke-width', '1');
    rawPolyline.setAttribute('stroke-opacity', '0.5');
    rawPolyline.setAttribute('stroke-dasharray', '2,2');
    let avgPolyline: SVGPolylineElement | null = null;
    avgPolyline = document.createElementNS(ns, 'polyline');
    avgPolyline.setAttribute('fill', 'none');
    avgPolyline.setAttribute('stroke', color);
    avgPolyline.setAttribute('stroke-width', '1');
    avgPolyline.setAttribute('stroke-opacity', '0.8');
    avgPolyline.removeAttribute('stroke-dasharray');
    const maxLine = document.createElementNS(ns, 'line');
    maxLine.setAttribute('stroke', color);
    maxLine.setAttribute('stroke-width', '1');
    const minLine = document.createElementNS(ns, 'line');
    minLine.setAttribute('stroke', color);
    minLine.setAttribute('stroke-width', '1');
    svg.appendChild(rawPolyline);
    if (avgPolyline) svg.appendChild(avgPolyline);
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
    return { container, svg, rawPolyline, avgPolyline, maxLine, minLine, labelMax, labelAvg, labelMin, isTime, color, lastWidth: 0, lastPoints: '', lastPointsSecond: '', lastMarkerX: 0, lastMaxY: 0, lastMinY: 0, lastLabelMax: '', lastLabelAvg: '', lastLabelMin: '' };
}
