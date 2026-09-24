// Patch-letter tags such as v2.14.0a are stable releases in this project.
// Hyphenated tags are development or prerelease builds and must not prompt
// users of a stable release to update.
const stableTagPattern = /^v?\d+\.\d+\.\d+[a-z]?$/;

function parseVersionTag(tag: string): { numbers: number[]; suffix: Array<string | number> | null } {
    const normalized = tag.startsWith('v') ? tag.slice(1) : tag;
    const match = normalized.match(/^(\d+(?:\.\d+)*)(?:-?(.+))?$/);
    const version = match?.[1] ?? normalized;
    const suffix = match?.[2] ?? null;
    const numbers = version.split('.').map((segment) => {
        const parsed = Number(segment);
        return Number.isFinite(parsed) ? parsed : 0;
    });
    const parsedSuffix = suffix ? suffix.split('.').flatMap((part) => {
        const matches = part.match(/([0-9]+|[^0-9]+)/g);
        return matches ? matches.map((chunk) => /^[0-9]+$/.test(chunk) ? Number(chunk) : chunk) : [part];
    }) : null;
    return { numbers, suffix: parsedSuffix };
}

export function compareVersionTags(a: string, b: string): number {
    const left = parseVersionTag(a);
    const right = parseVersionTag(b);

    const maxLen = Math.max(left.numbers.length, right.numbers.length);
    for (let i = 0; i < maxLen; i += 1) {
        const leftNum = left.numbers[i] ?? 0;
        const rightNum = right.numbers[i] ?? 0;
        if (leftNum !== rightNum) return leftNum < rightNum ? -1 : 1;
    }

    if (left.suffix === right.suffix) return 0;
    // A current dev build of a stable version is still current, while a
    // patch-letter release (v2.14.0a) follows its plain tag (v2.14.0).
    if (left.suffix === null) return -1;
    if (right.suffix === null) return 1;

    const suffixLen = Math.max(left.suffix.length, right.suffix.length);
    for (let i = 0; i < suffixLen; i += 1) {
        const leftId = left.suffix[i];
        const rightId = right.suffix[i];
        if (leftId === undefined) return -1;
        if (rightId === undefined) return 1;
        if (leftId === rightId) continue;
        if (typeof leftId === 'number' && typeof rightId === 'number') return leftId < rightId ? -1 : 1;
        if (typeof leftId === 'number') return -1;
        if (typeof rightId === 'number') return 1;
        return leftId < rightId ? -1 : 1;
    }
    return 0;
}

export function latestStableVersionTag(entries: readonly unknown[]): string | null {
    let highestTag: string | null = null;
    for (const entry of entries) {
        const name = entry && typeof entry === 'object' && 'name' in entry ? entry.name : null;
        if (typeof name !== 'string' || !stableTagPattern.test(name)) continue;
        if (!highestTag || compareVersionTags(name, highestTag) > 0) highestTag = name;
    }
    return highestTag;
}

export function isCurrentVersionLatest(currentTag: string, latestStableTag: string): boolean {
    return compareVersionTags(currentTag, latestStableTag) >= 0;
}
