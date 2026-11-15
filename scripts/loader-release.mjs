#!/usr/bin/env node
// Releases the Windows loader (synergism_modloader): the procedure of docs/dev/releasing.md, "Loader release".
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { askForInput, askYesNo, fatal, info, log, logWait, run, runAndCheck, stop, success, warn } from './release-common.mjs';
import {
    LIVE_REPO, TAG_PREFIX, buildChangelogEntry, bumpVersionFiles, changelogId, compareVersions, expectedAssets,
    nextPatch, parseVersion, releaseCommitSubject, releaseTitle, tagMessage,
} from './loader-release-lib.mjs';

const HELP = `
loader-release.mjs: release the Windows loader (synergism_modloader)

Usage: node scripts/loader-release.mjs [X.Y.Z] [--notes-file <path>] [--dry-run]
       npm run release-loader -- [X.Y.Z] [--notes-file <path>] [--dry-run]

Steps (each one already done is skipped, so a rerun after a failure or Ctrl+C continues where it stopped):
  1) refuses a dirty tree, a merge/rebase/cherry-pick in progress, another branch than master, master behind origin
  2) bumps the top version lines of synergism_modloader/package.json and package-lock.json,
     commits "release: Hypersynergism Loader X.Y.Z"
  3) asks, then pushes master to origin
  4) creates the annotated tag loader-vX.Y.Z: "Hypersynergism Loader X.Y.Z", an empty line, the notes file
  5) asks, then pushes the tag to the Live remote (the one at github.com/${LIVE_REPO}): the workflow runs there
  6) watches the workflow run through GitHub's public API (60 requests per hour, about 15 per release)
  7) checks the release: its 3 assets, its notes, marked Latest
  8) writes the changelog.json entry skeleton, then validates it (build-docs.py --validate) each time you press Enter

Arguments:
  X.Y.Z                The version (default: the next patch, or the version of an unfinished release).
                       The current version again tags HEAD without a bump (after a failed run's tag was deleted).
  --notes-file <path>  The release notes (Markdown: bold lines as section titles, "- " items). A first line equal to
                       the title is not repeated. Needed until the tag exists. Relative to the folder you typed in.
  --dry-run            Changes nothing (git fetch aside): shows each step, its commands and the tag message.
  -h, --help           This help.
`;

// =========================
// --- Arguments, setup ---
// =========================

const argv = process.argv.slice(2);
if (argv.includes('-h') || argv.includes('--help')) {
    log(HELP.trim());
    process.exit(0);
}
const opts = { version: null, notesFile: null, dryRun: false };
for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--notes-file' || arg.startsWith('--notes-file=')) {
        opts.notesFile = arg === '--notes-file' ? argv[++i] : arg.slice('--notes-file='.length);
        if (!opts.notesFile) fatal('--notes-file needs a path.');
    } else if (arg.startsWith('-')) fatal(`Unknown flag ${arg} (see --help)`);
    else if (opts.version) fatal('Only one version can be given.');
    else if (!parseVersion(arg.replace(/^loader-v/, ''))) fatal(`Not a version: ${arg} (expected X.Y.Z)`);
    else opts.version = arg.replace(/^loader-v/, '');
}

const root = runAndCheck('git', ['rev-parse', '--show-toplevel']).stdout.trim();
const git = (args, o = {}) => runAndCheck('git', args, { cwd: root, ...o }).stdout;
const gitTry = (args, o = {}) => run('git', args, { cwd: root, ...o });
const tagOf = (version) => `${TAG_PREFIX}${version}`;
const loaderDir = join(root, 'synergism_modloader');
const pkgPath = join(loaderDir, 'package.json');
const lockPath = join(loaderDir, 'package-lock.json');
const changelogPath = join(root, 'docs', 'data', 'changelog.json');
// What a loader release carries (docs/dev/releasing.md): loader files minus patcher.js (downloaded at each patch),
// tests and docs; release commits are left out by subject
const LOADER_PATHSPEC = ['synergism_modloader', ':(exclude)synergism_modloader/lib/patcher.js',
    ':(exclude)synergism_modloader/test', ':(exclude)synergism_modloader/*.md'];

const dry = (msg) => info(`[dry-run] ${msg}`);
/** Ask, or in a dry run say what would be asked and go on as if yes. */
async function ask(question) {
    if (opts.dryRun) {
        dry(`would ask: ${question}`);
        return true;
    }
    return askYesNo(question);
}
const RERUN = 'Run the script again to continue from here.';

log(`loader-release.mjs${opts.dryRun ? ' (dry run: nothing is changed)' : ''} (--help for the steps)`);

// =========================
// --- Git state ---
// =========================

function checkRepoState() {
    const gitDir = resolve(root, git(['rev-parse', '--git-dir']).trim());
    for (const marker of ['MERGE_HEAD', 'rebase-apply', 'rebase-merge', 'CHERRY_PICK_HEAD', 'REVERT_HEAD']) {
        if (existsSync(join(gitDir, marker))) fatal(`A merge, rebase, cherry-pick or revert is in progress (${marker}): finish it first.`);
    }
    const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']).trim();
    if (branch !== 'master') fatal(`On ${branch === 'HEAD' ? 'a detached HEAD' : branch}: loader releases are made from master.`);
    // No trim(): the first line's leading space is its index column
    const dirty = git(['status', '--porcelain']).split(/\r?\n/).filter(Boolean);
    if (dirty.length) {
        dirty.forEach(line => warn(`  ${line}`));
        fatal('The working tree has changes (above): commit or stash them first.');
    }
    logWait('Fetching origin...');
    git(['fetch', 'origin', '--quiet']);
    const behind = Number(git(['rev-list', '--count', 'HEAD..origin/master']).trim());
    if (behind > 0) fatal(`master is ${behind} commit(s) behind origin/master: pull first.`);
}

/** The remote whose URL is the Live repository, by URL: remote names differ between clones. */
function findLiveRemote() {
    for (const name of git(['remote']).split(/\r?\n/).filter(Boolean)) {
        const url = git(['remote', 'get-url', name]).trim();
        const [owner, repo] = LIVE_REPO.split('/');
        if (new RegExp(`github\\.com[/:]${owner}/${repo}(\\.git)?/?$`, 'i').test(url)) return name;
    }
    fatal(`No remote points to github.com/${LIVE_REPO}: add it (git remote add upstream https://github.com/${LIVE_REPO}.git).`);
}

/** Map tag -> { object, commit } of the loader tags, from `git ls-remote` or `git for-each-ref` output. */
function liveLoaderTags(remote) {
    const tags = new Map();
    for (const line of git(['ls-remote', '--tags', remote, `refs/tags/${TAG_PREFIX}*`]).split(/\r?\n/).filter(Boolean)) {
        const [sha, ref] = line.split(/\s+/);
        const peeled = ref.endsWith('^{}');
        const tag = ref.replace(/^refs\/tags\//, '').replace(/\^\{\}$/, '');
        const entry = tags.get(tag) || { object: '', commit: '' };
        if (peeled) entry.commit = sha;
        else entry.object = sha;
        tags.set(tag, entry);
    }
    // A lightweight tag has no peeled line: the object is the commit
    for (const entry of tags.values()) if (!entry.commit) entry.commit = entry.object;
    return tags;
}

function localLoaderTags() {
    const tags = new Map();
    const out = git(['for-each-ref', `refs/tags/${TAG_PREFIX}*`, '--format=%(refname:strip=2) %(objectname) %(*objectname)']);
    for (const line of out.split(/\r?\n/).filter(Boolean)) {
        const [tag, object, commit] = line.trim().split(/\s+/);
        tags.set(tag, { object, commit: commit || object });
    }
    return tags;
}

const isAncestor = (a, b) => gitTry(['merge-base', '--is-ancestor', a, b]).status === 0;

/** The released loader tag before `version` (the highest on Live below it), or null. */
function previousRelease(liveTags, version) {
    const versions = [...liveTags.keys()].map(t => t.slice(TAG_PREFIX.length))
        .filter(v => parseVersion(v) && compareVersions(v, version) < 0).sort(compareVersions);
    if (!versions.length) return null;
    const tag = tagOf(versions.at(-1));
    return { tag, commit: liveTags.get(tag).commit };
}

/** The commits a release carries between `base` (excluded, null for all) and `head`: [{ sha, author, subject }]. */
function loaderCommits(base, head) {
    const range = base ? `${base}..${head}` : head;
    return git(['log', '--format=%H%x09%an%x09%s', range, '--', ...LOADER_PATHSPEC]).split(/\r?\n/).filter(Boolean)
        .map(line => { const [sha, author, subject] = line.split('\t'); return { sha, author, subject }; })
        .filter(c => !c.subject.startsWith(`release: ${releaseTitle('')}`));
}

// =========================
// --- GitHub public API ---
// =========================

let rateRemaining = null;
let rateReset = null;
/** GET on the Live repository's API, without credentials: { status, json }, or { status: 0, error }. */
async function api(path) {
    try {
        const response = await fetch(`https://api.github.com/repos/${LIVE_REPO}${path}`, {
            headers: { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', 'User-Agent': 'hypersynergism-loader-release' },
            signal: AbortSignal.timeout(20_000),
        });
        rateRemaining = Number(response.headers.get('x-ratelimit-remaining') ?? rateRemaining);
        rateReset = Number(response.headers.get('x-ratelimit-reset') ?? rateReset);
        const json = response.status === 204 ? null : await response.json().catch(() => null);
        return { status: response.status, json };
    } catch (error) {
        return { status: 0, error: error.message || String(error) };
    }
}
const resetTime = () => rateReset ? new Date(rateReset * 1000).toLocaleTimeString() : 'within the hour';
const wait = (ms) => new Promise(r => setTimeout(r, ms));
const elapsed = (since) => `${Math.round((Date.now() - since) / 1000)} s`;

/** Fatal when the API answers neither 200 nor (when `allow404`) 404. */
function checkApi(result, what, allow404 = false) {
    if (result.status === 200 || (allow404 && result.status === 404)) return;
    if (result.status === 403 || result.status === 429) fatal(`GitHub API limit reached while reading ${what}; it resets at ${resetTime()}. ${RERUN}`);
    fatal(`Could not read ${what} from the GitHub API: ${result.error || `HTTP ${result.status}`}. ${RERUN}`);
}

/**
 * Wait for the workflow run of `tag`, then for its end; fatal on a failure, with its failed steps. `since`: the
 * tag push time, so a run of an earlier push of the same tag is not taken (null when resuming).
 */
async function watchRun(tag, since) {
    const started = Date.now();
    const deadline = started + 20 * 60_000;
    let wfRun = null;
    let lastState = '';
    let failures = 0;
    logWait(`Waiting for the workflow run of ${tag} (checked every 20 s)...`);
    while (Date.now() < deadline) {
        if (rateRemaining !== null && rateRemaining <= 2) {
            fatal(`GitHub API limit almost reached (${rateRemaining} left, resets at ${resetTime()}): stopped watching. ${RERUN}`);
        }
        const result = wfRun
            ? await api(`/actions/runs/${wfRun.id}`)
            : await api('/actions/workflows/loader-release.yml/runs?event=push&per_page=10');
        if (result.status !== 200) {
            if (result.status === 403 || result.status === 429 || ++failures >= 5) checkApi(result, 'the workflow runs');
            await wait(20_000);
            continue;
        }
        failures = 0;
        if (!wfRun) {
            wfRun = (result.json.workflow_runs || []).find(r => r.head_branch === tag
                && (!since || Date.parse(r.created_at) >= since - 60_000)) || null;
            if (!wfRun) {
                if (Date.now() - started > 5 * 60_000) fatal(`No workflow run for ${tag} after 5 minutes: check https://github.com/${LIVE_REPO}/actions`);
                await wait(20_000);
                continue;
            }
            info(`Workflow run: ${wfRun.html_url}`);
        } else {
            wfRun = result.json;
        }
        const state = wfRun.status === 'completed' ? `completed: ${wfRun.conclusion}` : wfRun.status;
        if (state !== lastState) {
            info(`Run ${state} (${elapsed(started)})`);
            lastState = state;
        }
        if (wfRun.status === 'completed') break;
        await wait(20_000);
    }
    if (!wfRun || wfRun.status !== 'completed') fatal(`The run hasn't ended after 20 minutes: check https://github.com/${LIVE_REPO}/actions. ${RERUN}`);
    if (wfRun.conclusion === 'success') {
        success(`Workflow run succeeded (${elapsed(started)}, API requests left this hour: ${rateRemaining}).`);
        return;
    }
    const jobs = await api(`/actions/runs/${wfRun.id}/jobs`);
    if (jobs.status === 200) {
        for (const job of jobs.json.jobs || []) {
            for (const step of job.steps || []) {
                if (step.conclusion && !['success', 'skipped'].includes(step.conclusion)) warn(`${job.name} › ${step.name}: ${step.conclusion}`);
            }
        }
    }
    fatal(`The workflow run ended with "${wfRun.conclusion}": ${wfRun.html_url}\n`
        + `\tNothing was published. After fixing it, delete the tag (git push <Live remote> :refs/tags/${tag}, git tag -d ${tag}),`
        + ' commit the fix, and run the script again with the same version: it tags HEAD again.');
}

/** The published release of `tag`: checks its assets, notes and Latest mark; fatal on a problem. */
async function checkRelease(version, notes) {
    const tag = tagOf(version);
    let result;
    for (let attempt = 1; attempt <= 3; attempt++) {
        result = await api(`/releases/tags/${tag}`);
        if (result.status !== 404) break;
        if (attempt < 3) await wait(10_000);
    }
    checkApi(result, `the release ${tag}`);
    const release = result.json;
    const problems = [];
    if (release.draft) problems.push('it is a draft');
    if (release.prerelease) problems.push('it is a pre-release');
    if (release.name !== releaseTitle(version)) problems.push(`its title is "${release.name}"`);

    const assets = new Map((release.assets || []).map(a => [a.name, a]));
    for (const name of expectedAssets(version)) {
        const asset = assets.get(name);
        if (!asset) problems.push(`asset missing: ${name}`);
        else if (asset.state !== 'uploaded' || !asset.size) problems.push(`asset not uploaded: ${name} (${asset.state}, ${asset.size} bytes)`);
    }
    const extra = [...assets.keys()].filter(name => !expectedAssets(version).includes(name));
    if (extra.length) problems.push(`unexpected assets: ${extra.join(', ')}`);

    const body = String(release.body || '').replace(/\r\n/g, '\n').trim();
    if (!body) problems.push('its notes are empty');
    else if (notes && body !== notes) warn('The release notes differ from the tag message: check the release page.');

    let latest = await api('/releases/latest');
    if (latest.status === 200 && latest.json.tag_name !== tag) {
        await wait(10_000);
        latest = await api('/releases/latest');
    }
    checkApi(latest, 'the Latest release');
    if (latest.json.tag_name !== tag) problems.push(`the Latest release is ${latest.json.tag_name}`);

    if (problems.length) fatal(`The release ${release.html_url} has problems:\n\t- ${problems.join('\n\t- ')}`);
    success(`Release ${tag}: 3 assets, notes, marked Latest: ${release.html_url}`);
    return release;
}

// =========================
// --- Changelog ---
// =========================

function readChangelog() {
    return JSON.parse(readFileSync(changelogPath, 'utf8'));
}

function pythonCommand() {
    for (const cmd of ['python', 'python3', 'py']) {
        const r = run(cmd, ['--version']);
        if (!r.error && r.status === 0) return cmd;
    }
    return null;
}

/** build-docs.py --validate, its output shown; true when it passes. */
function validateChangelog(python) {
    const r = run(python, ['scripts/tools/build-docs.py', '--validate'], { cwd: root, stdio: 'inherit' });
    return r.status === 0;
}

async function changelogStep(version, tagCommit, previous, release, notes) {
    const id = changelogId(version);
    const data = readChangelog();
    if (data.entries.some(e => e.id === id)) {
        info(`docs/data/changelog.json already has ${id}.`);
    } else {
        const releaseAuthor = git(['log', '-1', '--format=%an', tagCommit]).trim();
        const entry = buildChangelogEntry({
            version,
            commit: tagCommit,
            previousCommit: previous?.commit ?? null,
            // The publication's UTC date, the same wherever the script runs
            date: String(release.published_at).slice(0, 10),
            releaseUrl: release.html_url,
            sourceCommits: loaderCommits(previous?.commit ?? null, tagCommit),
            releaseAuthor,
            notes,
            profiles: data.contributor_profiles,
        });
        if (opts.dryRun) {
            dry('would add this entry at the top of docs/data/changelog.json:');
            log(JSON.stringify(entry, null, 2));
            return;
        }
        data.entries.unshift(entry);
        writeFileSync(changelogPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
        success(`Skeleton entry ${id} written at the top of docs/data/changelog.json's entries.`);
    }

    const python = pythonCommand();
    if (!python) {
        warn('Python not found: validate the entry with python scripts/tools/build-docs.py --validate');
        return;
    }
    if (opts.dryRun) {
        validateChangelog(python);
        return;
    }
    info('Fill it in: each change\'s type (added, changed, removed, fixed) and evidence (commit URLs from its sources),'
        + ' the wording (docs/dev/publishing-guide.md, "Writing patch notes"), any UNKNOWN contributor.');
    for (;;) {
        const answer = await askForInput('Press Enter to validate the changelog, or q to stop:');
        if (/^q/i.test(answer)) {
            info('Validate it later with: python scripts/tools/build-docs.py --validate');
            return;
        }
        if (validateChangelog(python)) {
            success('Changelog valid. Commit docs/data/changelog.json ("Docs: loader ' + version + ' changelog entry").');
            return;
        }
        warn('Not valid yet (message above).');
    }
}

// =========================
// --- Main ---
// =========================

(async () => {
    checkRepoState();
    const live = findLiveRemote();
    const liveTags = liveLoaderTags(live);
    const localTags = localLoaderTags();
    const head = git(['rev-parse', 'HEAD']).trim();
    const headSubject = git(['log', '-1', '--format=%s']).trim();
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    const current = pkg.version;
    if (!parseVersion(current)) fatal(`synergism_modloader/package.json has version ${current}, not X.Y.Z.`);
    const entryIds = new Set(readChangelog().entries.map(e => e.id));

    // Where a release of `version` stopped: 'published' (tag on Live, no changelog entry yet), 'tagged' (local tag
    // only), 'committed' (release commit on HEAD, no tag), or null (finished, or never started)
    const unfinished = (version) => {
        const tag = tagOf(version);
        if (liveTags.has(tag)) return entryIds.has(changelogId(version)) ? null : 'published';
        if (localTags.has(tag)) return 'tagged';
        return headSubject === releaseCommitSubject(version) ? 'committed' : null;
    };

    let version;
    let mode;
    const currentState = unfinished(current);
    if (opts.version && compareVersions(opts.version, current) < 0) {
        fatal(`${opts.version} is older than the loader's version ${current}.`);
    } else if (opts.version && compareVersions(opts.version, current) > 0) {
        if (currentState) {
            warn(`The release of ${current} is unfinished (${currentState}): running without a version continues it.`);
            if (!await ask(`Release ${opts.version} anyway?`)) stop('Aborted.');
        }
        version = opts.version;
        mode = 'new';
    } else if (opts.version) {
        version = current;
        if (liveTags.has(tagOf(current)) && !currentState) fatal(`${tagOf(current)} is already released, with its changelog entry.`);
        // The current version again, nothing started: tag HEAD without a bump (a failed run's tag was deleted)
        mode = currentState || 'retag';
    } else {
        version = currentState ? current : nextPatch(current);
        mode = currentState || 'new';
    }
    const tag = tagOf(version);

    // The tag must not exist elsewhere than where the state says
    const localTag = localTags.get(tag);
    const liveTag = liveTags.get(tag);
    if (['new', 'retag', 'committed'].includes(mode) && (localTag || liveTag)) {
        fatal(`The tag ${tag} already exists ${localTag ? 'locally' : `on ${live}`}.`);
    }
    if (mode === 'tagged' && !isAncestor(localTag.commit, head)) fatal(`The local tag ${tag} is not on master: delete it (git tag -d ${tag}).`);
    if (mode === 'published' && localTag && localTag.object !== liveTag.object) {
        fatal(`The local tag ${tag} is not the one on ${live}: delete it (git tag -d ${tag}) and run again.`);
    }

    // The notes, read before any change so a wrong path stops the script first
    let message = null;
    const needsTag = ['new', 'retag', 'committed'].includes(mode);
    if (needsTag) {
        if (!opts.notesFile) fatal(`--notes-file is needed: the tag ${tag} is created by this run.`);
        const notesPath = resolve(process.env.INIT_CWD || process.cwd(), opts.notesFile);
        if (!existsSync(notesPath)) fatal(`Notes file not found: ${notesPath}`);
        try {
            message = tagMessage(version, readFileSync(notesPath, 'utf8'));
        } catch (error) {
            fatal(error.message);
        }
    } else if (opts.notesFile) {
        warn(`The tag ${tag} exists: it keeps its message, the notes file is not used.`);
    }

    const previous = previousRelease(liveTags, version);
    const carried = loaderCommits(previous?.commit ?? null, mode === 'published' ? liveTag.commit : head);
    const modeLabel = {
        new: `new release (${current} -> ${version})`,
        retag: `tag HEAD as ${tag} (no new release commit)`,
        committed: 'continue: release commit made, not tagged',
        tagged: `continue: tagged locally, not pushed to ${live}`,
        published: `continue: tag on ${live}, no changelog entry yet`,
    }[mode];
    info(`Loader ${version}: ${modeLabel}`);
    info(`Live remote: ${live}; previous release: ${previous?.tag ?? '(none)'}`);
    info(`Loader commits since ${previous?.tag ?? 'the start'}:${carried.length ? '' : ' none'}`);
    carried.forEach(c => log(`\t${c.sha.slice(0, 8)} ${c.author}: ${c.subject}`));
    if (!carried.length && mode === 'new' && !await ask('No loader change since the previous release. Release anyway?')) stop('Aborted.');
    if (message) {
        info('Tag message:');
        log(message.split('\n').map(l => `\t${l}`).join('\n'));
    }

    // 2) Version bump and release commit
    if (mode === 'new') {
        const bumped = bumpVersionFiles(readFileSync(pkgPath, 'utf8'), readFileSync(lockPath, 'utf8'), version);
        if (opts.dryRun) {
            dry(`would set version ${version} in synergism_modloader/package.json and package-lock.json (top lines), and commit "${releaseCommitSubject(version)}"`);
        } else {
            if (!await ask(`Bump to ${version} and commit "${releaseCommitSubject(version)}"?`)) stop('Aborted: nothing changed.');
            writeFileSync(pkgPath, bumped.pkgText, 'utf8');
            writeFileSync(lockPath, bumped.lockText, 'utf8');
            git(['add', '--', 'synergism_modloader/package.json', 'synergism_modloader/package-lock.json']);
            log(git(['diff', '--cached', '--stat']).trimEnd());
            git(['commit', '-m', releaseCommitSubject(version)]);
            success(`Committed "${releaseCommitSubject(version)}".`);
        }
    } else if (mode === 'retag') {
        if (!await ask(`The loader is already at ${version}: tag HEAD (${headSubject}) as ${tag}, without a new release commit?`)) stop('Aborted.');
    }

    // 3) master on origin
    const tagCommit = mode === 'published' ? liveTag.commit : (mode === 'tagged' ? localTag.commit : null);
    const mustContain = tagCommit || 'HEAD';
    if (opts.dryRun && mode === 'new') {
        dry('would ask: Push master to origin? then run git push origin master');
    } else if (isAncestor(mustContain, 'origin/master')) {
        info('origin/master already has the release.');
    } else {
        if (!await ask('Push master to origin?')) stop(`Push skipped. ${RERUN}`);
        if (opts.dryRun) dry('would run git push origin master');
        else {
            git(['push', 'origin', 'master']);
            success('Pushed master to origin.');
        }
    }

    // 4) Annotated tag
    if (needsTag) {
        if (opts.dryRun) dry(`would run git tag -a ${tag} --cleanup=whitespace -F - (the message above)`);
        else {
            // The message through stdin; --cleanup=whitespace keeps a line starting with # (the default strips it as a comment)
            git(['tag', '-a', tag, '--cleanup=whitespace', '-F', '-'], { input: message });
            success(`Tag ${tag} created.`);
        }
    }

    // 5) Tag on Live
    let pushedAt = null;
    if (mode !== 'published') {
        if (!await ask(`Push the tag ${tag} to ${live} (${LIVE_REPO}), which starts the release workflow?`)) stop(`Tag push skipped. ${RERUN}`);
        if (opts.dryRun) {
            dry(`would run git push ${live} refs/tags/${tag}, watch the workflow run, check the release, write the changelog entry`);
            success('Dry run complete.');
            return;
        }
        pushedAt = Date.now();
        git(['push', live, `refs/tags/${tag}`]);
        success(`Pushed ${tag} to ${live}.`);
    }

    // 6) Workflow run (skipped when resuming after the release was published)
    const finalCommit = tagCommit || git(['rev-parse', `refs/tags/${tag}^{commit}`]).trim();
    let existing = null;
    if (!pushedAt) {
        existing = await api(`/releases/tags/${tag}`);
        checkApi(existing, `the release ${tag}`, true);
    }
    if (existing?.status === 200) info(`The release ${tag} exists: not watching the run.`);
    else if (opts.dryRun) dry(`would watch the workflow run of ${tag}`);
    else await watchRun(tag, pushedAt);

    // 7) Release check, 8) changelog entry
    const localBody = gitTry(['tag', '--list', tag, '--format=%(contents:body)']);
    const tagNotes = localBody.status === 0 ? String(localBody.stdout).replace(/\r\n/g, '\n').trim() : '';
    if (opts.dryRun && existing?.status !== 200) {
        success('Dry run complete.');
        return;
    }
    const release = await checkRelease(version, tagNotes);
    const notes = tagNotes || String(release.body || '').replace(/\r\n/g, '\n').trim();
    await changelogStep(version, finalCommit, previous, release, notes);

    success(`Completed: ${tag}${opts.dryRun ? ' (dry run)' : ''}`);
})();
