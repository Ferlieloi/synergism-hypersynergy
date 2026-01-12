import { HSLogger } from "../../hs-core/hs-logger"

/*
    Class: HSAutosingTimer
    IsExplicitHSModule: No
    Description: 
        Class that implements a timer for the autosing module.
    Author: XxmolkxX
*/

export class HSAutosingTimer {
    private timestamps: number[] = [];
    private context: string = "HSAutosing-Timer"

    public start(): void {
        this.timestamps = [performance.now()];
    }

    public recordSingularity(): void {
        const now = performance.now();
        this.timestamps.push(now);

        const duration = this.getLastDuration();
        if (duration !== null) {
            HSLogger.debug(
                `Singularity #${this.getSingularityCount()} completed in ${duration.toFixed(1)}s`
            );
        }
    }

    public getLastDuration(): number | null {
        if (this.timestamps.length < 2) {
            return null;
        }

        return (this.timestamps[this.timestamps.length - 1] - this.timestamps[this.timestamps.length - 2]) / 1000
    }

    public getAverageLast(n: number): number | null {
        if (n <= 0 || this.timestamps.length <= n) {
            return null;
        }

        let sum = 0;
        for (let i = 1; i <= n; i++) {
            sum += this.timestamps[this.timestamps.length - i]! - this.timestamps[this.timestamps.length - (i + 1)]!;
        }

        return sum / n / 1000;
    }

    public getSingularityCount(): number {
        // Number of completed singularities = number of intervals
        return Math.max(0, this.timestamps.length - 1);
    }

    public reset(): void {
        this.timestamps = [];
    }

    public getTimestamps(): readonly number[] {
        return [...this.timestamps];
    }

    public getAllDurations(): number[] {
        if (this.timestamps.length < 2) {
            return [];
        }

        const durations: number[] = [];
        for (let i = 1; i < this.timestamps.length; i++) {
            durations.push((this.timestamps[i] - this.timestamps[i - 1]) / 1000);
        }
        return durations;
    }
}
