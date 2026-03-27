import { HSReleaseInfo } from "../../../types/hs-types";
import { HSGlobal } from "../hs-global";
import { HSLogger } from "../hs-logger";
import { HSModule } from "../module/hs-module";

/*
    Small helper to fetch the latest published GitHub release for the configured repo.
*/
export class HSGithub {
    static context: string;

    static async getLatestRelease() {
        this.context = 'HSGithub';
        try {
            const owner = (globalThis as any).__HS_REPO_OWNER || HSGlobal.Release.githubOwner;

            const devSentinels = ['DevServer', 'local', 'dev'];
            if (devSentinels.includes(owner)) {
                HSLogger.debug(`[HSGithub] Skipping GitHub API for dev sentinel owner: ${owner}`, this.context);
                return null;
            }
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
 