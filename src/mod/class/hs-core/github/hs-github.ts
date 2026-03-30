import { HSGlobal } from "../hs-global";
import { HSLogger } from "../hs-logger";

/**
 * Class: HSGithub
 * IsExplicitHSModule: No
 * Description:
 *     Small helper to fetch the latest published GitHub tag for the configured repo.
 */
export class HSGithub {
    static #context: string = 'HSGithub';

    static readonly owner: string | null = ((window as any).__HS_REPO_OWNER ? (window as any).__HS_REPO_OWNER : null);
    static readonly currentTag: string = `v${HSGlobal.General.currentModVersion}`;

    static async isLatestTag(): Promise<boolean> {
        const latestTag = await HSGithub.getLatestRemoteTag();
        if (!latestTag) return true;

        if (HSGithub.currentTag >= latestTag) {
            HSLogger.debug(`Current tag (${HSGithub.currentTag}) is up to date with latest tag (${latestTag}).`, HSGithub.#context);
            return true;
        }
        HSLogger.debug(`New version available: ${latestTag}!`, HSGithub.#context);
        HSGithub.setNewVersionStyle();
        
        return HSGithub.currentTag >= latestTag;
    }

    static async getLatestRemoteTag(): Promise<string | null> {
        try {
            // GitHub API: List tags (sorted by commit date descending)
            const githubUrl = `https://api.github.com/repos/${this.owner}/synergism-hypersynergy/tags?per_page=1`;
            const ghResp = await fetch(githubUrl);
            if (!ghResp.ok) {
                if (ghResp.status === 403) {
                    HSLogger.debug(`GitHub API returned 403 Forbidden. You may be rate-limited.`, HSGithub.#context);
                } else {
                    HSLogger.debug(`GitHub API request failed: HTTP ${ghResp.status} ${ghResp.statusText}`, HSGithub.#context);
                }
                return null;
            }
            const ghJson = await ghResp.json();
            if (Array.isArray(ghJson) && ghJson.length > 0 && ghJson[0].name) {
                HSLogger.debug(`Latest tag from GitHub API: ${ghJson[0].name}`, HSGithub.#context);
                return ghJson[0].name;
            }
            return null;
        } catch (err) {
            HSLogger.debug(`GitHub API request threw an error: ${err}`, HSGithub.#context);
            return null;
        }
    }

    static setNewVersionStyle(): void {
        const modIcon = document.querySelector('#hs-panel-control') as HTMLDivElement | null;
        const modPanelHead = document.querySelector('#hs-panel-version') as HTMLDivElement | null;

        if (modIcon && modPanelHead) {
            modIcon.classList.add('hs-rainbowBorder');
            if (!modPanelHead.querySelector('#hs-panel-new-ver')) {
                modPanelHead.innerHTML += `: <span id="hs-panel-new-ver">New version available!</span>`;
            }
        }
    }

/*
This feels too ugly ><.
We could only check the "==UserScript==" block (if we update them), bbut this still doesn't feel great ^^"
I prefer the __HS_REPO_OWNER approach... But if you have a better idea...

    static async getOwnerFromInlineScript() {
        if (HSGlobal.General.isDev) return 'maenhiir';

        const regex = /https:\/\/cdn\.jsdelivr\.net\/gh\/([^/]+)\/synergism-hypersynergy@/;
        for (const script of document.scripts) {
            if (!script.src && script.textContent) {
                const m = script.textContent.match(regex);
                if (m) {
                    HSLogger.debug(`Extracted owner from inline script: ${m[1]}`, HSGithub.#context);
                    this.owner = m[1];
                    return m[1];
                }
            }
        }
        HSLogger.debug(`Owner not found in inline scripts`, HSGithub.#context);
        return null;
    }
*/

}
 