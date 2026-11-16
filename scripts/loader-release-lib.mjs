// The loader release script's pure parts (loader-release.mjs), tested by scripts/tests/test-loader-release.cjs:
// versions, the version bump, the tag message, and the changelog entry skeleton.

export const LIVE_REPO = 'Ferlieloi/synergism-hypersynergy';
export const TAG_PREFIX = 'loader-v';
export const releaseTitle = (version) => `Hypersynergism Loader ${version}`;
export const releaseCommitSubject = (version) => `release: ${releaseTitle(version)}`;
export const changelogId = (version) => `loader-${version}`;
/** The workflow's assets (.github/workflows/loader-release.yml, "Publish launcher release"). */
export const expectedAssets = (version) => [
    `HypersynergismLoader-Setup-${version}.exe`,
    `HypersynergismLoader-Setup-${version}.exe.blockmap`,
    'latest.yml',
];

/** [major, minor, patch] of an "X.Y.Z" version, or null. */
export function parseVersion(version) {
    const match = /^(\d+)\.(\d+)\.(\d+)$/.exec(String(version));
    return match ? match.slice(1).map(Number) : null;
}

/** Negative, zero or positive, as a sort comparator; both must be "X.Y.Z". */
export function compareVersions(a, b) {
    const [pa, pb] = [parseVersion(a), parseVersion(b)];
    for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
    return 0;
}

export function nextPatch(version) {
    const [major, minor, patch] = parseVersion(version);
    return `${major}.${minor}.${patch + 1}`;
}

/**
 * The loader's package.json and package-lock.json with the new version in their top version lines only (a
 * dependency further down can have the same version). Both files round-trip through JSON unchanged, so only those
 * lines differ. Throws if the files' versions disagree.
 */
export function bumpVersionFiles(pkgText, lockText, newVersion) {
    const pkg = JSON.parse(pkgText);
    const lock = JSON.parse(lockText);
    const root = lock.packages?.[''];
    if (!root) throw new Error('package-lock.json has no packages[""] entry');
    if (lock.version !== pkg.version || root.version !== pkg.version) {
        throw new Error(`Versions disagree: package.json ${pkg.version}, package-lock.json ${lock.version} / ${root.version}`);
    }
    pkg.version = newVersion;
    lock.version = newVersion;
    root.version = newVersion;
    const eol = (text) => text.endsWith('\n') ? '\n' : '';
    return {
        pkgText: JSON.stringify(pkg, null, 2) + eol(pkgText),
        lockText: JSON.stringify(lock, null, 2) + eol(lockText),
    };
}

/**
 * The tag message from the notes file: the title line, an empty line, the notes. A file that already starts with
 * the title line is used as is (normalized). Throws if no notes are left.
 */
export function tagMessage(version, fileText) {
    // trim() also drops a BOM (U+FEFF counts as whitespace)
    const text = fileText.replace(/\r\n/g, '\n').trim();
    const lines = text.split('\n');
    const title = releaseTitle(version);
    const notes = (lines[0].trim() === title ? lines.slice(1).join('\n') : text).trim();
    if (!notes) throw new Error('The notes file has no notes (the workflow publishes the tag message minus its title line).');
    return `${title}\n\n${notes}`;
}

/**
 * The release notes' Markdown split for the changelog entry: list items become changes (their type left to fill
 * in), other paragraphs notes; bold-only lines (section titles) and headings are dropped. Wrapped lines are joined.
 */
export function splitNotes(notes) {
    const result = { notes: [], changes: [] };
    let current = null;
    const flush = () => {
        if (current) result[current.kind].push(current.text.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\s+/g, ' ').trim());
        current = null;
    };
    for (const raw of notes.replace(/\r\n/g, '\n').split('\n')) {
        const line = raw.trim();
        if (!line || /^#{1,6}\s/.test(line) || /^\*\*[^*]+\*\*:?$/.test(line)) {
            flush();
            continue;
        }
        const item = /^[-*+]\s+(.*)$/.exec(line);
        if (item) {
            flush();
            current = { kind: 'changes', text: item[1] };
        } else if (current) {
            current.text += ` ${line}`;
        } else {
            current = { kind: 'notes', text: line };
        }
    }
    flush();
    return result;
}

/** The contributor profile id an author name or email matches (id, name or alias, any case), or null. */
export function profileIdFor(profiles, authorName) {
    const wanted = authorName.trim().toLowerCase();
    for (const [id, profile] of Object.entries(profiles)) {
        const names = [id, profile.name, ...(profile.aliases || [])].filter(Boolean).map(n => n.toLowerCase());
        if (names.includes(wanted)) return id;
    }
    return null;
}

const commitUrl = (sha) => `https://github.com/${LIVE_REPO}/commit/${sha}`;

/**
 * A changelog.json entry for a published loader release, with what git and the API know. Left to fill in by hand,
 * and refused by `build-docs.py --validate` until then: each change's type ("TODO") and evidence, the wording, and
 * any author without a profile (id "UNKNOWN <name>").
 *
 * - commit: the tagged release commit; previousCommit: the previous loader tag's commit, or null.
 * - date: "YYYY-MM-DD" of the release's publication; releaseUrl: its page.
 * - sourceCommits: [{ sha, author }] the commits the release carries (loader files minus patcher.js, tests, docs),
 *   newest first, without the release commit; releaseAuthor: the release commit's author.
 * - notes: the tag message minus its title line.
 */
export function buildChangelogEntry({ version, commit, previousCommit, date, releaseUrl, sourceCommits, releaseAuthor, notes, profiles }) {
    const tag = `${TAG_PREFIX}${version}`;
    const { notes: noteLines, changes } = splitNotes(notes);

    // One credit per author, in order of first appearance: "changes" for authored work, "release" for the release commit
    const credits = new Map();
    const credit = (author, sha, role) => {
        const id = profileIdFor(profiles, author) || `UNKNOWN ${author}`;
        if (!credits.has(id)) credits.set(id, { id, roles: [], commits: [] });
        const entry = credits.get(id);
        if (!entry.roles.includes(role)) entry.roles.push(role);
        entry.commits.push(sha);
    };
    for (const { sha, author } of sourceCommits) credit(author, sha, 'changes');
    credit(releaseAuthor, commit, 'release');
    // An author with work in the release is credited for changes only, as in the existing entries
    for (const entry of credits.values()) {
        if (entry.roles.includes('changes')) entry.roles = ['changes'];
    }

    return {
        id: changelogId(version),
        version,
        channel: 'loader',
        repository: LIVE_REPO,
        commit,
        previous_commit: previousCommit,
        date,
        date_kind: 'published',
        status: 'published',
        release_url: releaseUrl,
        sources: [
            { label: 'Published release', url: releaseUrl },
            { label: 'Git tag', url: `https://github.com/${LIVE_REPO}/tree/${tag}` },
            { label: 'Release/build commit', url: commitUrl(commit) },
            ...sourceCommits.map(({ sha }) => ({ label: `Source: ${sha.slice(0, 8)}`, url: commitUrl(sha) })),
        ],
        notes: noteLines,
        changes: changes.map(text => ({ type: 'TODO', text, evidence: [] })),
        contributors: [...credits.values()],
        contributor_range: { base: previousCommit, head: commit, scope: 'synergism_modloader/' },
        merges: [],
    };
}
