import { HSGlobal } from "../hs-global";
import { HSLogger } from "../hs-logger";

/**
 * Class: HSGithub
 * IsExplicitHSModule: No
 * Description:
 *     Small helper to fetch the latest published GitHub tag for the configured repo.
 */
export class HSGithub {
    static context: string = 'HSGithub';

    static owner: string | null;
    static readonly currentTag: string = `v${HSGlobal.General.currentModVersion}`;

    static async isLatestTag(): Promise<boolean> {
        const latestTag = await HSGithub.getLatestRemoteTag();
        return !(latestTag && latestTag !== HSGithub.currentTag);
    }

    static async getLatestRemoteTag(): Promise<string | null> {
        try {
            if (!this.owner) this.owner = this.getOwnerFromInlineScript() || null;

            // GitHub API: List tags (sorted by commit date descending)
            const githubUrl = `https://api.github.com/repos/${this.owner}/synergism-hypersynergy/tags?per_page=1`;
            const ghResp = await fetch(githubUrl);
            if (!ghResp.ok) return null;
            const ghJson = await ghResp.json();
            if (Array.isArray(ghJson) && ghJson.length > 0 && ghJson[0].name) {
                HSLogger.debug(`Latest tag from GitHub API: ${ghJson[0].name}`, this.context);
                return ghJson[0].name;
            }
            return null;
        } catch (err) {
            return null;
        }
    }

    static getOwnerFromInlineScript() {
        if (HSGlobal.General.isDev) return 'maenhiir';

        const regex = /https:\/\/cdn\.jsdelivr\.net\/gh\/([^/]+)\/synergism-hypersynergy@/;
        for (const script of document.scripts) {
            if (!script.src && script.textContent) {
                const m = script.textContent.match(regex);
                if (m) {
                    HSLogger.debug(`Extracted owner from inline script: ${m[1]}`, this.context);
                    this.owner = m[1];
                    return m[1];
                }
            }
        }
        HSLogger.debug(`Owner not found in inline scripts`, this.context);
        return null;
    }
}
 