#!/usr/bin/env node
import { spawnSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, relative } from 'path';


// ===============================
// ------ Low-level Helpers ------
// ===============================

/** Log Helpers */
function log(msg) { console.log(msg); }
function logWait(msg) { console.log(`⏳\t${msg}`); }
function success(msg) { console.log(`✅\t${msg}`); }
function info(msg) { console.log(`ℹ️\t${msg}`); }
function warn(msg) { console.log(`⚠️\t${msg}`); }
function fatal(msg, result) {
    console.error(`❌\tERROR: ${msg}`);
    if (result) {
        if (result.stdout) console.error(String(result.stdout));
        if (result.stderr) console.error(String(result.stderr));
        if (result.error) console.error(result.error.message || result.error);
        if (typeof result.status !== 'undefined') console.error('Exit code:', result.status);
        if (result.signal) console.error('Signal:', result.signal);
        if (result.error && result.error.code) console.error('Code:', result.error.code);
    }
    process.exit(1);
}

/** Format a command + args for logging. */
function formatCommand(cmd, args) {
    const parts = Array.isArray(args) ? args : [args];
    return `${cmd} ${parts.map(a => `'${String(a).replace(/'/g, "\\'")}'`).join(' ')}`;
}

/** Run a command synchronously and return result. */
function run(cmd, args, opts = {}) {
    return spawnSync(cmd, args, { stdio: 'pipe', ...opts });
}

/** Convenience wrapper for commands that must succeed. Uses `fatal()` on any failure. */
function runAndCheck(cmd, args, opts = {}) {
    const r = run(cmd, args, opts);
    const out = r.stdout ? r.stdout.toString() : '';
    const err = r.stderr ? r.stderr.toString() : '';
    if (r.status !== 0) {
        fatal(`Command returned non-zero: ${formatCommand(cmd, args)}`, r);
    }
    return { stdout: out, stderr: err, status: r.status };
}

/** Ask user for y/n confirmation. */
let skipPrompts = false;

function askYesNo(question) {
    if (skipPrompts) {
        info(`[auto] ${question} -> yes`);
        return Promise.resolve(true);
    }
    return new Promise(async resolve => {
        const readline = await import('readline');
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question(`❓ ${question} (y/N) `, ans => {
            rl.close();
            resolve(/^(y|yes)$/i.test((ans || '').trim()));
        });
    });
}

/** Ask user for free-form text input. */
function askForInput(question) {
    if (skipPrompts) {
        info(`[auto] ${question} -> (default)`);
        return Promise.resolve('');
    }
    return new Promise(async resolve => {
        const readline = await import('readline');
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question(`❓ ${question} `, ans => {
            rl.close();
            resolve((ans || '').trim());
        });
    });
}


// =============================
// --- Initialization / Help ---
// =============================

const root = process.cwd();
const pkgPath = join(root, 'package.json');
const esbuildScript = join(root, 'esbuild.config.js');
const releaseFilePath = join(root, 'release', 'mod', 'hypersynergism_release.js');
if (!existsSync(releaseFilePath)) fatal('Release file missing: ' + releaseFilePath);
const releaseFileRel = relative(root, releaseFilePath).replace(/\\/g, '/');

const argv = process.argv.slice(2);

log('===============================================================');
log('release-and-tag-helper.js — safe (overkill? ><) tag helper');
log('===============================================================');
log('');
log('Usage: node scripts/release-and-tag-helper.js [-h|--help] [-y|--yes]');
log('');
log('Description:');
log('  This script asks for confirmation before ANY changes (unless --yes).');
log('  and performs the full tag workflow:');
log('    1) ensures git clean/merge/rebase state');
log('    2) checks tags in local and remote, auto-bumps if needed');
log('    3) builds release artifact with esbuild');
log('    4) stages release+package files and commits');
log('    5) creates an annotated v<version> tag');
log('    6) prompts to push branch and tag to origin at end');
log('');
log('Flags:');
log('  -h, --help       Show this help and exit');
log('  -y, --yes        Skip all prompts and proceed with defaults (non-interactive mode)');
log('');
log('Examples:');
log('  node scripts/release-and-tag-helper.js          # run release workflow with interactive confirmation');
log('  node scripts/release-and-tag-helper.js --yes    # run full workflow non-interactively (auto yes)');
log('  node scripts/release-and-tag-helper.js --help   # show this help and exit');
log('');
log('Notes:');
log('  - This script always includes a commit + tag phase');
log('  -   Push is prompted at the end of the workflow; `--yes` skips any prompts.');
log('  - If package.json version already exists remotely, you are offered a patch bump automatically.');
log('  - If no changes are staged but release/package files are unchanged from HEAD, it can proceed with an existing commit + tag flow.');
log('  - Working tree dirty is allowed, but you are prompted before staging all changes.');
log('  - In detached HEAD mode, the script aborts and asks you to checkout a branch.');
log('  - User confirmations are required for commit/tag and push decisions.');
log('===============================================================');

// Early exit if help argument is passed
if (argv.includes('-h') || argv.includes('--help')) process.exit(0);

logWait('Gathering data, please wait...');

const opts = { yes: false };
for (const arg of argv) {
    if (arg === '-y' || arg === '--yes') {
        opts.yes = true;
        continue;
    }
    if (arg.startsWith('-')) fatal(`Unknown flag ${arg}`);
    fatal('Positional arguments are not accepted.');
}
skipPrompts = opts.yes;


// =============================
// -------- Git Helpers --------
// =============================

/** Sort semver-like strings in descending order. */
function semverSort(array) {
    return array.slice().sort((a, b) => b.localeCompare(a));
}

/** Parse git tag output (local or remote) into normalized version strings. */
function parseTagList(raw) {
    return Array.from(new Set((raw || '').split(/\r?\n/).filter(Boolean)
        .map(line => {
            const trimmed = line.trim();
            // remote `ls-remote --tags` lines are `hash\trefs/tags/v1.2.3` or `refs/tags/v1.2.3^{} `
            const remoteMatch = trimmed.match(/refs\/tags\/(?:v)?(.+?)(?:\^\{\})?$/);
            if (remoteMatch) return remoteMatch[1];
            // local tag names are direct lines from `git tag`, maybe with or without prefix v
            const localMatch = trimmed.match(/^(?:v)?(.+)$/);
            return localMatch ? localMatch[1] : null;
        })
        .filter(Boolean)
    ));
}

/** Validate basic git environment and abort on rebase/merge in progress. */
function checkGitBase() {
    runAndCheck('git', ['--version']);
    const gitDir = join(root, '.git');
    if (existsSync(join(gitDir, 'MERGE_HEAD')) || existsSync(join(gitDir, 'rebase-apply')) || existsSync(join(gitDir, 'rebase-merge'))) {
        fatal('A merge or rebase is in progress. Resolve it first.');
    }
}

/** Check whether working tree has uncommitted changes. */
function getWorkingTreeStatus() {
    const statusRes = run('git', ['status', '--porcelain']);
    if (statusRes.error || statusRes.status !== 0) fatal('git status failed', statusRes);
    const lines = statusRes.stdout ? statusRes.stdout.toString().trim().split(/\r?\n/).filter(Boolean) : [];
    return { isClean: lines.length === 0, lines };
}

/** Check whether current branch is ahead of upstream by commits or has upstream issues. */
function isBranchAheadOfUpstream() {
    const upstreamRes = run('git', ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
    if (upstreamRes.error || upstreamRes.status !== 0) {
        const errText = String(upstreamRes.stderr || upstreamRes.stdout || '').toLowerCase();
        if (/no upstream configured/.test(errText)) {
            warn('No upstream configured for current branch. This is not fatal, but please consider setting an upstream.');
        } else if (/ambiguous argument .*@\{u\}|no tracking information/.test(errText)) {
            warn('Upstream is inaccessible or missing tracking information. This is not fatal, but please verify your remote settings.');
        } else {
            warn('Unable to resolve upstream branch (inaccessible or no upstream). This is not fatal, but please check git remote configuration.');
        }
        return true;
    }

    const aheadRes = run('git', ['rev-list', '--count', '@{u}..HEAD']);
    if (aheadRes.error || aheadRes.status !== 0) {
        warn('Could not determine upstream ahead/behind status even though an upstream exists. Please verify branch tracking.');
        return true;
    }

    const aheadCount = parseInt(aheadRes.stdout.toString().trim(), 10);
    if (Number.isNaN(aheadCount)) {
        warn('Could not parse ahead count from git output.');
        return true;
    }

    if (aheadCount > 0) {
        warn(`Branch is ahead of upstream by ${aheadCount} commits.`);
        return true;
    }

    return false;
}

/** Check if the release artifact exists in a given Git ref. */
function refHasRelease(ref) {
    const res = run('git', ['cat-file', '-e', `${ref}:${releaseFileRel}`]);
    return res.status === 0 && !res.error;
}

/** Return true if a file is tracked in git index. */
function isTracked(filePath) {
    const r = run('git', ['ls-files', '--error-unmatch', filePath]);
    return !r.error && r.status === 0;
}

/** Return true if a local tag exists. */
function doesLocalTagExist(tag) {
    const r = run('git', ['tag', '--list', tag]);
    return !r.error && r.status === 0 && String(r.stdout || '').trim().length > 0;
}


// ======================================================
// --- Check pkg.version + Infos dump + bump handling ---
// ======================================================

/** Read and validate package.json version field. */
function readPackage() {
    if (!existsSync(pkgPath)) fatal('package.json not found');
    const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
    if (!pkg.version) fatal('package.json missing version');
    return pkg;
}

/** Collect all status metadata required for release and tagging decisions. */
function collectStatus() {
    checkGitBase();

    const isBranchAhead = isBranchAheadOfUpstream();

    const tree = getWorkingTreeStatus();
    const branch = runAndCheck('git', ['rev-parse', '--abbrev-ref', 'HEAD']).stdout.trim();
    const head = runAndCheck('git', ['rev-parse', 'HEAD']).stdout.trim();

    if (branch === 'HEAD') fatal('Detached HEAD detected. Please checkout a branch before running this script.');

    const headHasLatestReleaseFile = refHasRelease('HEAD');
    if (!headHasLatestReleaseFile) {
        info(`HEAD does not contain ${releaseFileRel}. This is okay, the release build will be generated.`);
    }

    runAndCheck('git', ['fetch', '--tags', '--quiet']);

    const localTags = semverSort(parseTagList(runAndCheck('git', ['tag']).stdout));
    const remoteTags = semverSort(parseTagList(runAndCheck('git', ['ls-remote', '--tags', 'origin']).stdout));

    const pkg = readPackage();
    const targetTag = `v${pkg.version}`;
    const localTagExists = localTags.includes(targetTag);
    const remoteTagExists = remoteTags.includes(targetTag);

    const tracked = [];
    const untracked = [];

    if (isTracked(releaseFileRel)) tracked.push('release file'); else untracked.push('release file');
    if (isTracked('package.json')) tracked.push('package.json'); else untracked.push('package.json');
    if (isTracked('package-lock.json')) tracked.push('package-lock.json'); else untracked.push('package-lock.json');

    return {
        // current branch and HEAD info
        branch,
        isBranchAhead,
        head,
        headShort: head.substring(0, 7),

        // working tree status
        tree,

        // tag lists and latest tag computation
        localTags,
        remoteTags,
        latestLocal: localTags[0] || '(none)',
        latestRemote: remoteTags[0] || '(none)',

        // package metadata and target tag/version
        pkg,
        pkgVersion: pkg.version,
        targetVersion: pkg.version,
        targetTag,

        // precomputed existence flags
        localTagExists,
        remoteTagExists,

        // release file and package tracking state
        headHasLatestReleaseFile,
        tracked,
        untracked,
        allTracked: untracked.length === 0,
    };
}

/** Print current git and release status to console. */
function printStatus(status) {
    info(`Branch: ${status.branch}`);
    info(`HEAD: ${status.headShort} - ${status.head}`);
    info(`Target tag: ${status.targetTag}`);
    info(`package.json version: ${status.pkgVersion}`);

    if (!status.tree.isClean) {
        warn('Working tree is dirty, staged/unstaged changes exist:');
        status.tree.lines.forEach(l => warn(`  ${l}`));
    }
    info(`Working tree clean: ${status.tree.isClean ? 'yes' : 'no'}`);

    if (status.localTagExists) {
        warn(`Local target tag ${status.targetTag} already exists (will conflict).`);
    }
    if (status.remoteTagExists) {
        warn(`Remote target tag ${status.targetTag} already exists (upstream conflict likely).`);
    }

    info(`Latest release is in HEAD: ${status.headHasLatestReleaseFile ? 'yes' : 'no'}`);

    info(`Local tags (${status.localTags.length}): ${status.localTags.join(', ') || '(none)'}`);
    info(`Remote tags (${status.remoteTags.length}): ${status.remoteTags.join(', ') || '(none)'}`);
    info(`Latest local: ${status.latestLocal}`);
    info(`Latest remote: ${status.latestRemote}`);

    if (status.allTracked) {
        info('Release and package files are tracked.');
    } else {
        warn(`Untracked files: ${status.untracked.join(', ')}`);
    }
}


// =============================
// --- Version Bump Handling ---
// =============================

/** Check if remote or local already has the current target version, prompt for bump and update package.json accordingly */
async function chooseTarget(status) {
    const conflicts = [];
    if (status.remoteTags.includes(status.pkgVersion)) conflicts.push('remote');
    if (status.localTagExists) conflicts.push('local');

    if (conflicts.length === 0) {
        info(`Target tag: ${status.targetTag}`);
        return status;
    }

    const conflictText = conflicts.join(' and ');
    warn(`Target version ${status.pkgVersion} already exists in ${conflictText}. Auto bump recommended.`);

    const semverMatch = status.pkgVersion.match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-.]+))?$/);
    if (!semverMatch) fatal('Unable to parse package version for bump. Expected semver like 2.10.0 or 2.10.0-dev3.');

    const major = Number(semverMatch[1]);
    const minor = Number(semverMatch[2]);
    const patch = Number(semverMatch[3]);
    const pre = semverMatch[4] || '';

    let newVersion;
    if (pre) {
        const preMatch = pre.match(/^([a-zA-Z-]+)(\d+)$/);
        if (preMatch) {
            const preName = preMatch[1];
            const preNum = Number(preMatch[2]);
            newVersion = `${major}.${minor}.${patch}-${preName}${preNum + 1}`;
        } else {
            newVersion = `${major}.${minor}.${patch + 1}`;
        }
    } else {
        newVersion = `${major}.${minor}.${patch + 1}`;
    }

    if (!await askYesNo(`Bump version from ${status.pkgVersion} to ${newVersion}?`)) {
        info('Bump declined by user. Continuing with current version.');
        return status;
    }

    status.pkg.version = newVersion;
    writeFileSync(pkgPath, JSON.stringify(status.pkg, null, 2) + '\n', 'utf8');

    const lockPath = join(root, 'package-lock.json');
    if (existsSync(lockPath)) {
        try {
            const lockRaw = readFileSync(lockPath, 'utf8');
            const lockJson = JSON.parse(lockRaw);
            lockJson.version = newVersion;
            writeFileSync(lockPath, JSON.stringify(lockJson, null, 2) + '\n', 'utf8');
            info(`package-lock.json version synchronized to ${newVersion}`);
        } catch (err) {
            warn(`Could not update package-lock.json version: ${err.message || err}`);
        }
    }

    status.pkgVersion = newVersion;
    status.targetVersion = newVersion;
    status.targetTag = `v${newVersion}`;

    status.localTags = semverSort(parseTagList(runAndCheck('git', ['tag']).stdout));
    status.remoteTags = semverSort(parseTagList(runAndCheck('git', ['ls-remote', '--tags', 'origin']).stdout));
    status.localTagExists = status.localTags.includes(status.targetTag);
    status.remoteTagExists = status.remoteTags.includes(status.targetTag);

    success(`Version bumped to ${newVersion}.`);
    info(`Target tag: ${status.targetTag}`);
    return status;
}


// ===============================
// --- Commit/Tag & Push Steps ---
// ===============================

/**
 * commitFlow performs the release commit and tagging operations.
 *
 * Steps:
 *   1) Verify that target tag is not already present locally.
 *   2) Run `npm install --package-lock-only` (creates/updates package-lock.json).
 *   3) Run the release build (`node <esbuildScript> release`).
 *   4) Optionally stage all changes when working tree is dirty.
 *   5) Stage release artifact, package.json and package-lock.json.
 *   6) If no staged changes, allow tag-only flow when release/package files match HEAD.
 *   7) Commit staged files and create an annotated tag with optional user-provided description suffix.
 *
 * @param {object} status - release status and git/tag metadata.
 *   - status.targetTag: string tag to create (like v1.2.3)
 *   - status.localTagExists: boolean if tag exists locally
 *   - status.tree.isClean: boolean if working tree clean
 */
async function commitFlow(status) {
    // commitFlow includes release build, staging, and tagging (w/ optional message).
    runAndCheck('npm install --package-lock-only', [], { shell: true });
    runAndCheck('node', [esbuildScript, 'release'], { cwd: root });
    success('Release build complete.');

    if (!status.tree.isClean) {
        warn('Unclean working tree.');
        if (await askYesNo('Stage all changes for commit?')) {
            runAndCheck('git', ['add', '-A']);
            success('Staged all changes.');
        } else {
            info('Proceeding without staging changes.');
        }
    }

    runAndCheck('git', ['add', releaseFileRel, 'package.json', 'package-lock.json']);

    const staged = runAndCheck('git', ['diff', '--cached', '--name-only']).stdout.trim();

    if (!staged) {
        // Nothing staged yet: check whether release files are identical to HEAD before tagging
        const unchanged = !run('git', ['diff', '--quiet', '--', releaseFileRel, 'package.json', 'package-lock.json']).status;
        if (unchanged) {
            const headInfo = runAndCheck('git', ['log', '-1', '--pretty=format:%h %s']).stdout.trim();
            if (!await askYesNo(`No differences. Tag current commit (${headInfo}) as ${status.targetTag}?`)) {
                info('Aborted by user.');
                process.exit(0);
            }
        } else {
            fatal('No staged files and release/package files differ from HEAD. Add and retry.');
        }
    } else {
        success(`Files staged: ${staged}`);
        if (!await askYesNo(`Commit staged changes and tag ${status.targetTag}?`)) {
            info('Aborted by user.');
            process.exit(0);
        }
        runAndCheck('git', ['commit', '-m', `release: ${status.targetTag}`]);
        success('Commit created.');
    }

    const extraTagMessage = (await askForInput('Optional tag message suffix (`y` or empty to skip):')).trim();
    const fullTagMessage = /^y?$/i.test(extraTagMessage)
        ? `Release ${status.targetTag}`
        : `Release ${status.targetTag} - ${extraTagMessage}`;

    // Check current local tag state and handle existing tag with chooseTarget bump flow
    let tagExists = doesLocalTagExist(status.targetTag);
    if (tagExists) {
        warn(`The tag ${status.targetTag} already exists locally.`);
        const choice = (await askForInput('Choose: [y][u]se existing tag, [b]ump version, [a]bort:')).trim().toLowerCase();
        if (choice !== 'y' && choice !== 'yes'
            && choice !== 'u' && choice !== 'use'
            && choice !== 'b' && choice !== 'bump') {
            info('Aborted by user.');
            process.exit(0);
        }
        if (choice === 'b' || choice === 'bump') {
            status = await chooseTarget(status);
            tagExists = doesLocalTagExist(status.targetTag);
            if (tagExists) {
                warn(`New bumped tag ${status.targetTag} still exists locally.`);
                if (!await askYesNo('Delete and recreate this tag?')) {
                    info('Aborted by user.');
                    process.exit(0);
                }
                runAndCheck('git', ['tag', '-d', status.targetTag]);
            }
        } else {
            info(`Using existing local tag ${status.targetTag}.`);
            return;
        }
    }

    runAndCheck('git', ['tag', '-a', status.targetTag, '-m', fullTagMessage]);
    success(`Tag ${status.targetTag} created with message: ${fullTagMessage}`);
}

/**
 * pushFlow performs the post-tag push operations in a safe, interactive way.
 *
 * Steps:
 *   1) Verify local annotated tag exists by resolving `refs/tags/<targetTag>`.
 *   2) Ensure the tagged commit has the release artifact present (using `cat-file -e`).
 *   3) Compare tag object SHA with remote `origin` tag if already present, and error on mismatch.
 *   4) Ask user for push consent, and optionally configure upstream if missing.
 *   5) Push the current branch and the annotated tag to `origin`.
 *
 * @param {object} status
 *   - status.branch: current branch name.
 *   - status.targetTag: tag name to push (e.g. `v1.2.3`).
 */
async function pushFlow(status) {
    // pushFlow validates tag state before pushing branch and tag.
    const tagRev = run('git', ['rev-parse', '--verify', `refs/tags/${status.targetTag}`]);
    if (tagRev.error || tagRev.status !== 0) fatal(`Local tag ${status.targetTag} missing.`);

    // Ensure the release artifact actually exists in tagged commit.
    if (!refHasRelease(status.targetTag)) fatal(`Tagged commit does not contain ${releaseFileRel}.`);

    const remoteTag = run('git', ['ls-remote', '--tags', 'origin', status.targetTag]);
    if (remoteTag.error || remoteTag.status !== 0) fatal('ls-remote failed.', remoteTag);
    const remoteTxt = remoteTag.stdout ? String(remoteTag.stdout).trim() : '';
    if (remoteTxt) {
        const remoteSHA = remoteTxt.split(/\s+/)[0];
        const localSHA = runAndCheck('git', ['rev-list', '-n', '1', status.targetTag]).stdout.trim();
        if (remoteSHA !== localSHA) fatal(`Remote tag ${status.targetTag} mismatch: ${remoteSHA} != ${localSHA}`);
        info('Remote tag matches local commit.');
    }

    if (!(await askYesNo(`Push branch and tag ${status.targetTag} to origin?`))) {
        info('Push skipped. You can do it manually with `git push --follow-tags`.');
        process.exit(0);
    }

    const upstream = run('git', ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
    if (upstream.status !== 0) {
        if (!await askYesNo(`No upstream. Set upstream and push ${status.branch}?`)) { info('Aborted by user.'); process.exit(0); }
        runAndCheck('git', ['push', '--set-upstream', 'origin', status.branch]);
        success('Set upstream and pushed branch.');
    } else {
        runAndCheck('git', ['push']);
        success('Pushed branch.');
    }

    runAndCheck('git', ['push', 'origin', `refs/tags/${status.targetTag}`]);
    success('Pushed tag.');
}

// ==========================
// ---------- Main ----------
// ==========================

(async () => {
    const status = collectStatus(opts);
    printStatus(status);

    if (status.isBranchAhead) {
        warn('Branch check indicates upstream/advance issues (this is advisory only).');
        if (!await askYesNo(`Continue anyway? (y/N)`)) {
            info('Aborted by user.');
            process.exit(0);
        }
    }

    await chooseTarget(status);

    await commitFlow(status);

    if (await askYesNo('Push the current branch and tag to origin now?')) {
        await pushFlow(status);
    } else {
        info('Push skipped by user. You can do it manually with `git push --follow-tags`.');
    }

    success(`Completed: ${status.targetTag}`);
})();
