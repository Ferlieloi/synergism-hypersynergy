import { HSReleaseInfo } from "../../../types/hs-types";
import { HSGlobal } from "../hs-global";

/*
    Small helper to fetch the latest published GitHub release for the configured repo.
*/
export class HSGithub {
    static async getLatestRelease() {
        try {
            // Allow a runtime override set by the loader. Bridges evaluate loader
            // code with a sourceURL; the loader now attempts to detect its owner
            // and set `globalThis.__HS_REPO_OWNER`. Prefer that if present.
            const owner = (globalThis as any).__HS_REPO_OWNER || HSGlobal.Release.githubOwner;
            const githubUrl = `https://api.github.com/repos/${owner}/synergism-hypersynergy/releases/latest`;

            const ghResp = await fetch(githubUrl);
            if (!ghResp.ok) return null;
            const ghJson = await ghResp.json();

            const info: HSReleaseInfo = {
                version: ghJson.tag_name || ghJson.name || '',
                name: ghJson.name || ghJson.tag_name || '',
                published: ghJson.published_at ? new Date(ghJson.published_at) : new Date()
            };

            return info;
        } catch (err) {
            return null;
        }
    }
}
 