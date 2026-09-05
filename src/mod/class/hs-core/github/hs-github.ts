import { HSGlobal } from "../hs-global";
import { HSLogger } from "../hs-logger";

/**
 * Class: HSGithub
 * IsExplicitHSModule: No
 * Description:
 *     Small helper to check if we have the latest mod version, using tags.
 */
export class HSGithub {
    static #context: string = 'HSGithub';
    static #pollInterval?: number;

    // Matches tags shaped like vMAJOR.MINOR.PATCH (optionally with a -prerelease suffix).
    // Used to filter out non-version tags before they're treated as "the latest version".
    static readonly #tagPattern = /^v?\d+\.\d+\.\d+/;

    static readonly owner: string | null = ((window as any).__HS_REPO ? (window as any).__HS_REPO : null);
    static readonly currentTag: string = `v${HSGlobal.General.currentModVersion}`;

    static async isLatestTag(): Promise<boolean> {
        return await this.#checkLatestTag();
    }

    static async #checkLatestTag(): Promise<boolean> {
        const latestTag = await this.#getLatestRemoteTag();
        if (!latestTag) {
            HSGlobal.Release.isLatestVersion = true;
            HSLogger.debug(() => `No latest tag available; assuming current version is latest.`, HSGithub.#context);
            return true;
        }

        const isLatest = HSGithub.#compareVersionTags(HSGithub.currentTag, latestTag) >= 0;
        HSGlobal.Release.isLatestVersion = isLatest;

        if (isLatest) {
            HSLogger.log(`Current tag (${HSGithub.currentTag}) is up to date with latest tag (${latestTag}).`, HSGithub.#context);
        } else {
            HSLogger.log(`New version available: ${latestTag}!`, HSGithub.#context);
            HSGithub.#setNewVersionStyle();
        }

        return isLatest;
    }

    static async #getLatestRemoteTag(): Promise<string | null> {
        try {
            // GitHub's tags API does NOT guarantee any particular sort order (it isn't
            // documented as chronological or semver-aware), so we can't just trust that
            // the first entry is the newest. Fetch a small batch of 10, filter to entries
            // that actually look like version tags, and pick the highest one ourselves.
            const githubOwner = this.owner ?? HSGlobal.Release.githubOwner ?? 'ahvonenj';
            const githubUrl = `https://api.github.com/repos/${githubOwner}/synergism-hypersynergy/tags?per_page=10`;
            const ghResp = await fetch(githubUrl);
            if (!ghResp.ok) {
                if (ghResp.status === 403) {
                    HSLogger.debug(() => `GitHub API returned 403 Forbidden. You may be rate-limited.`, HSGithub.#context);
                } else {
                    HSLogger.debug(() => `GitHub API request failed: HTTP ${ghResp.status} ${ghResp.statusText}`, HSGithub.#context);
                }
                return null;
            }
            const ghJson = await ghResp.json();
            if (!Array.isArray(ghJson) || ghJson.length === 0) {
                return null;
            }

            let highestTag: string | null = null;
            for (const entry of ghJson) {
                const name = entry?.name;
                if (typeof name !== 'string' || !HSGithub.#tagPattern.test(name)) continue;
                if (!highestTag || HSGithub.#compareVersionTags(name, highestTag) > 0) {
                    highestTag = name;
                }
            }

            if (highestTag) {
                HSLogger.debug(() => `Latest tag from GitHub API: ${highestTag}`, HSGithub.#context);
            } else {
                HSLogger.debug(() => `GitHub API returned tags, but none matched the expected version format`, HSGithub.#context);
            }

            return highestTag;
        } catch (err) {
            HSLogger.debug(() => `GitHub API request threw an error: ${err}`, HSGithub.#context);
            return null;
        }
    }

    static #parseVersionTag(tag: string): { numbers: number[]; prerelease: Array<string | number> | null } {
        const normalized = tag.startsWith('v') ? tag.slice(1) : tag;
        // Accept both the existing hyphenated suffixes (2.13.5-dev1) and release
        // suffixes appended directly to the patch number (2.13.5b).
        const match = normalized.match(/^(\d+(?:\.\d+)*)(?:-?(.+))?$/);
        const version = match?.[1] ?? normalized;
        const prerelease = match?.[2] ?? null;
        const numbers = version.split('.').map((segment) => {
            const parsed = Number(segment);
            return Number.isFinite(parsed) ? parsed : 0;
        });
        const parsedPrerelease = prerelease ? prerelease.split('.').flatMap((part) => {
            const matches = part.match(/([0-9]+|[^0-9]+)/g);
            return matches ? matches.map((chunk) => /^[0-9]+$/.test(chunk) ? Number(chunk) : chunk) : [part];
        }) : null;
        return { numbers, prerelease: parsedPrerelease };
    }

    static #compareVersionTags(a: string, b: string): number {
        const left = HSGithub.#parseVersionTag(a);
        const right = HSGithub.#parseVersionTag(b);

        const maxLen = Math.max(left.numbers.length, right.numbers.length);
        for (let i = 0; i < maxLen; i += 1) {
            const leftNum = left.numbers[i] ?? 0;
            const rightNum = right.numbers[i] ?? 0;
            if (leftNum !== rightNum) {
                return leftNum < rightNum ? -1 : 1;
            }
        }

        if (left.prerelease === right.prerelease) {
            return 0;
        }

        // Note: this deliberately inverts standard semver precedence (where e.g.
        // "1.0.0-dev1" < "1.0.0"). In this project's tagging convention, a "-devN"
        // suffix marks ongoing work done AFTER a vX.Y.Z tag has already shipped
        // (see scripts/release-and-tag-helper.mjs's bump logic, which increments the
        // -devN counter in place rather than bumping the patch number), not a
        // pre-release candidate leading up to it. So for equal MAJOR.MINOR.PATCH,
        // the "-devN" side must be treated as newer than (or equal to) the plain tag,
        // otherwise a local dev build always looks "outdated" compared to the last
        // stable tag of the same number.
        if (left.prerelease === null) {
            return -1;
        }
        if (right.prerelease === null) {
            return 1;
        }

        const prereleaseLen = Math.max(left.prerelease.length, right.prerelease.length);
        for (let i = 0; i < prereleaseLen; i += 1) {
            const leftId = left.prerelease[i];
            const rightId = right.prerelease[i];

            if (leftId === undefined) return -1;
            if (rightId === undefined) return 1;
            if (leftId === rightId) continue;

            if (typeof leftId === 'number' && typeof rightId === 'number') {
                return leftId < rightId ? -1 : 1;
            }
            if (typeof leftId === 'number') {
                return -1;
            }
            if (typeof rightId === 'number') {
                return 1;
            }
            return leftId < rightId ? -1 : 1;
        }

        return 0;
    }

    static startVersionPolling(intervalMs: number = HSGlobal.Release.checkIntervalMs): void {
        if (this.#pollInterval != null) {
            return;
        }

        const runCheck = async () => {
            const isLatest = await this.#checkLatestTag();
            if (!isLatest) {
                HSGithub.#stopVersionPolling();
            }
        };

        this.#pollInterval = window.setInterval(runCheck, intervalMs);

        // Run an initial check immediately instead of waiting for the first interval tick.
        // Otherwise a new version wouldn't surface until intervalMs (e.g. 30 minutes) after load
        void runCheck();
    }

    static #stopVersionPolling(): void {
        if (this.#pollInterval != null) {
            clearInterval(this.#pollInterval);
            this.#pollInterval = undefined;
        }
    }

    static #setNewVersionStyle(): void {
        const modIcon = document.querySelector('#hs-panel-control') as HTMLDivElement | null;
        const modPanelHead = document.querySelector('#hs-panel-version') as HTMLDivElement | null;

        if (modIcon && modPanelHead) {
            modIcon.classList.add('hs-rainbow-border');
            if (!modPanelHead.querySelector('#hs-panel-new-ver')) {
                modPanelHead.innerHTML += `: <span id="hs-panel-new-ver">New version available!</span>`;
            }
        }
    }
}
