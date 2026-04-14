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
            // GitHub API: List tags (sorted by commit date descending)
            const githubOwner = this.owner ?? HSGlobal.Release.githubOwner ?? 'ahvonenj';
            const githubUrl = `https://api.github.com/repos/${githubOwner}/synergism-hypersynergy/tags?per_page=1`;
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
            if (Array.isArray(ghJson) && ghJson.length > 0 && ghJson[0].name) {
                HSLogger.debug(() => `Latest tag from GitHub API: ${ghJson[0].name}`, HSGithub.#context);
                return ghJson[0].name;
            }
            return null;
        } catch (err) {
            HSLogger.debug(() => `GitHub API request threw an error: ${err}`, HSGithub.#context);
            return null;
        }
    }

    static #parseVersionTag(tag: string): { numbers: number[]; prerelease: Array<string | number> | null } {
        const normalized = tag.startsWith('v') ? tag.slice(1) : tag;
        const [version, prerelease] = normalized.split('-', 2);
        const numbers = version.split('.').map((segment) => Number(segment));
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

        if (left.prerelease === null) {
            return 1;
        }
        if (right.prerelease === null) {
            return -1;
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

        this.#pollInterval = window.setInterval(async () => {
            const isLatest = await this.#checkLatestTag();
            if (!isLatest) {
                HSGithub.#stopVersionPolling();
            }
        }, intervalMs);
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
