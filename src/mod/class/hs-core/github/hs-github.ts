import { HSGlobal } from "../hs-global";
import { HSLogger } from "../hs-logger";
import { isCurrentVersionLatest, latestStableVersionTag } from "./hs-version-tags";

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

        const isLatest = isCurrentVersionLatest(HSGithub.currentTag, latestTag);
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
            // GitHub's tags API does not promise chronological or version order.
            // Fetch a full page so a run of dev tags cannot hide a stable tag.
            const githubOwner = this.owner ?? HSGlobal.Release.githubOwner ?? 'ahvonenj';
            const githubUrl = `https://api.github.com/repos/${githubOwner}/synergism-hypersynergy/tags?per_page=100`;
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

            const highestTag = latestStableVersionTag(ghJson);

            if (highestTag) {
                HSLogger.debug(() => `Latest tag from GitHub API: ${highestTag}`, HSGithub.#context);
            } else {
                HSLogger.debug(() => `GitHub API returned tags, but none was a stable version`, HSGithub.#context);
            }

            return highestTag;
        } catch (err) {
            HSLogger.debug(() => `GitHub API request threw an error: ${err}`, HSGithub.#context);
            return null;
        }
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
