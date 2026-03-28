#!/usr/bin/env node
import { spawnSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join, relative } from 'path';
import semver from 'semver';

// ----------------
// Helpers
// ----------------

// Logs
function log(message)       { console.log(message); }
function success(message)   { console.log(`✅\t${message}`); }
function info(message)      { console.log(`ℹ️\t${message}`); }
function warn(message)      { console.log(`⚠️\t${message}`); }
function fatal(message, result) {
    console.error('\n❌\tERROR:', message);
    if (result) {
        if (result.stdout) console.error(String(result.stdout));
        if (result.stderr) console.error(String(result.stderr));
        if (result.error) console.error(result.error.message || result.error);
        // Print short diagnostic fields when available for easier triage
        if (typeof result.status !== 'undefined') console.error('Exit code:', result.status);
        if (result.signal) console.error('Signal:', result.signal);
        if (result.error && result.error.code) console.error('Code:', result.error.code);
    }
    process.exit(1);
}

// Run a command and return spawnSync result. Do NOT throw; caller must inspect result.
function run(cmd, args, opts = {}) {
    return spawnSync(cmd, args, { stdio: 'pipe', ...opts });
}

// Run a command and on failure print command, stdout/stderr and exit with mapped code
function runAndCheck(cmd, args, opts = {}) {
    // Convenience wrapper for commands that must succeed. Uses `fatal()` on any failure.
    const r = run(cmd, args, opts);
    const out = r.stdout ? r.stdout.toString() : '';
    const err = r.stderr ? r.stderr.toString() : '';
    const fmt = formatCommand(cmd, args);
    if (r.status !== 0) {
        fatal(`Command returned non-zero: ${fmt}`, r);
    }
    return { stdout: out, stderr: err, status: r.status };
}

// Format command for error messages
function formatCommand(cmd, args) {
    const parts = Array.isArray(args) ? args : [args];
    return `${cmd} ${parts.map(a => `'${String(a).replace(/'/g, "\\'" )}'`).join(' ')}`;
}

// Prompt helpers
function askYesNo(prompt) {
    return new Promise(async (resolve) => {
        const readline = await import('readline');
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question(`❓ ${prompt} (y/N) `, (ans) => {
            rl.close();
            resolve(/^(y|yes)$/i.test((ans || '').trim()));
        });
    });
}
function askForInput(prompt) {
    return new Promise(async (resolve) => {
        const readline = await import('readline');
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        rl.question(`❓ ${prompt} `, (ans) => {
            rl.close();
            resolve(ans.trim());
        });
    });
}


// ----------------
// Initialization
// ----------------

info('Starting release-and-tag script...');

const argv = process.argv.slice(2);

// If no args or help flag provided, show help and exit immediately
if (argv.length === 0 || argv.includes('-h') || argv.includes('--help')) {
    log('===============================================================');
    log('release-and-tag.js — safe, conservative release helper');
    log('===============================================================');
    log('');
    log('Usage: node scripts/release-and-tag.js [-c|--commit] [-p|--push] [-h|--help]');
    log('');
    log('Flags:');
    log('  -c, --commit     Build, stage and commit release and package files, then create an annotated tag v<version>');
    log('  -p, --push       Push the commit (if present) and the tag to origin (can be used with or after --commit)');
    log('  -h, --help       Show this help and exit');
    log('');
    log('Examples:');
    log('  node scripts/release-and-tag.js                 # show this help and exit');
    log('  node scripts/release-and-tag.js --commit        # build, commit and tag locally');
    log('  node scripts/release-and-tag.js --commit --push # build, commit, tag and push');
    log('  (You can also use --push after --commit, or do it manually with `git push --follow-tags`)');
    log('');
    log('Notes:');
    log('  - Version is read from package.json. If the latest remote tag matches the local version, you will be prompted to bump the version (patch) automatically.');
    log('  - If there are no new changes to commit but the release and package files match HEAD, you will be offered a tag-only flow for the current commit.');
    log('  - If your working tree is dirty, you will be prompted to stage and commit ALL changes (including unrelated files) alongside the release. Review carefully.');
    log('  - The script will refuse to create a tag unless the release artifact is present in the commit.');
    log('  - User confirmation is requested before all commit, tag, and push operations.');
    log('  - All non-user cancellations exit with code 1 and print diagnostics.');
    log('===============================================================');
    process.exit(0);
}

const opts = { commit: false, push: false, };
for (const a of argv) {
    if      (a === '-c' || a === '--commit') opts.commit = true;
    else if (a === '-p' || a === '--push') opts.push = true;
    else if (a.startsWith('-')) fatal(`Unknown flag ${a}`);
    else fatal('Positional arguments are not accepted.');
}

// repo root and release file paths
const root = process.cwd();
const pkgPath = join(root, 'package.json');
const esbuildScript = join(root, 'esbuild.config.js');
const releaseFilePath = join(root, 'release', 'mod', 'hypersynergism_release.js');
if (!existsSync(releaseFilePath)) fatal('Release file missing: ' + releaseFilePath);
const releaseFileRel = relative(root, releaseFilePath).replace(/\\/g, '/');


// ----------------
// Pre-flight: Check for merge conflicts, rebase in progress, unpushed commits and working tree status
// ----------------

// Ensure git is available
runAndCheck('git', ['--version']);

const gitDir = join(root, '.git');
if (
    existsSync(join(gitDir, 'MERGE_HEAD')) ||
    existsSync(join(gitDir, 'rebase-apply')) ||
    existsSync(join(gitDir, 'rebase-merge'))
) {
    fatal('A merge or rebase is in progress. Please resolve it before running this script.');
}

// Check for unpushed local commits
const aheadRes = run('git', ['rev-list', '--count', '@{u}..HEAD']);
if (!aheadRes.error && aheadRes.status === 0) {
    const aheadCount = parseInt(aheadRes.stdout.toString().trim(), 10);
    if (aheadCount > 0) {
        fatal(`Your branch is ahead of its upstream by ${aheadCount} commit(s). Please push or reset these commits before running this script.`);
    }
}

// Check working tree status and warn if dirty (but allow continuation)
const statusRes = run('git', ['status', '--porcelain']);
if (statusRes.error || statusRes.status !== 0) fatal('git failed while checking working tree status', statusRes);
const status = statusRes.stdout ? statusRes.stdout.toString().trim() : '';
const isWorkingTreeClean = !status;
if (isWorkingTreeClean) {
    success('Working tree is clean. Continuing...');
} else {
    log('==============================================================');
    warn('Working tree is dirty (uncommitted changes detected):');
    log(status);
    log('==============================================================');
}


// ----------------
// Fetch tags, get latest tag on remote, and local version from package.json
// ----------------

// Fetch tags from origin
const fetchRes = run('git', ['fetch', '--tags', '--quiet']);
if (fetchRes.error || fetchRes.status !== 0) fatal('Failed to fetch tags from origin.', fetchRes);

// Get the current active branch
const branchRes = run('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
if (branchRes.error || branchRes.status !== 0) fatal('git failed while getting current branch', branchRes);
const branch = branchRes.stdout.toString().trim();

// Fetch all remote tags and parse for all tags and the target tag
const tagsRes = run('git', ['ls-remote', '--tags', 'origin']);
if (tagsRes.error || tagsRes.status !== 0) fatal('git failed while listing remote tags', tagsRes);
const tagLines = tagsRes.stdout ? tagsRes.stdout.toString().split('\n') : [];
const tags = [];
for (const line of tagLines) {
    const match = line.match(/refs\/tags\/v([^\n^{}]+)$/);
    if (match) {
        const tag = match[1];
        if (semver.valid(tag)) tags.push(tag);
    }
}
const sortedTags = tags.slice().sort(semver.rcompare);
const latestRemoteTag = sortedTags.length ? sortedTags[sortedTags.length - 1] : '(none)';

// release version is read from package.json.version
if (!existsSync(pkgPath)) fatal('package.json not found');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
const pkgVersion = pkg.version;
if (!pkgVersion) fatal('no version found in package.json');


// ----------------
// Infos and potential bump
// ----------------

info(`All existing tags: ${tags.length ? sortedTags.join(', ') : '(none)'}`);
info(`Latest tag on origin: ${latestRemoteTag}`);
info(`Version from package.json: (v)${pkgVersion}`);

// If the target tag is already on remote, prompt to bump version
let targetVersion = pkgVersion;
if (tags.includes(pkgVersion)) {
    const newVersion = semver.inc(pkgVersion, 'patch');

    info(`Latest remote tag (${latestRemoteTag}) matches the package version ${pkgVersion}.`);
    const ok = await askYesNo(`Do you want to bump the version to ${newVersion} and continue?`);
    if (!ok) { info('Operation cancelled by user.'); process.exit(0); }

    // Update package.json and variable with new version
    targetVersion = newVersion;
    pkg.version = newVersion;
    writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf8');
    success(`package.json version bumped from ${pkgVersion} to ${targetVersion}. Continuing...`);
} else {
    success(`Local version ${targetVersion} does not exist in remote's tags. Continuing...`);
}
const targetTagName = `v${targetVersion}`;


// ----------------
// Commit and tag
// ----------------

if (opts.commit) {
    // Ensure the local tag does not already exist
    const localCheck = run('git', ['rev-parse', '--verify', '--quiet', `refs/tags/${targetTagName}`]);
    if (localCheck.error) fatal('git failed while checking local tag', localCheck);
    if (localCheck.status === 0) fatal('Local tag should NOT already exist when committing.');
    else success(`Local tag ${targetTagName} does not exist yet. Continuing...`);

    // Sync lockfile and run release build
    // Single string for the command below (avoids DeprecationWarning when shell: true)
    runAndCheck('npm install --package-lock-only', [], { shell: true });
    runAndCheck('node', [esbuildScript, 'release'], { cwd: root });
    success('Lockfile synced and release built. Continuing...');

    // Check if release file, package.json, and package-lock.json are tracked in HEAD
    const filesToCheck = [
        { path: releaseFileRel, label: 'Built release file' },
        { path: 'package.json', label: 'package.json' },
        { path: 'package-lock.json', label: 'package-lock.json' }
    ];
    for (const file of filesToCheck) {
        const res = run('git', ['ls-files', '--error-unmatch', file.path]);
        if (res.error) fatal(`git failed while verifying if ${file.label} is tracked`, res);
        if (res.status !== 0) fatal(`${file.label} is untracked.`);
        else success(`${file.path} is tracked in HEAD. Continuing...`);
    }

    if (!isWorkingTreeClean) {
        warn('Your working tree has uncommitted changes. Please review them carefully.');
        const ok = await askYesNo(`Should these changes be staged and committed alongside the tag?`);
        if (ok) {
            runAndCheck('git', ['add', '-A']);
            success('All changes staged. Continuing...');
        }
    }

    log('Staging release file and package files');
    runAndCheck('git', ['add', releaseFileRel, 'package.json', 'package-lock.json']);

    // Ensure there are staged changes to commit, or allow tag-only flow if files match HEAD
    const stagedRes = run('git', ['diff', '--cached', '--name-only']);
    if (stagedRes.error || stagedRes.status !== 0) fatal('git failed while checking staged files', stagedRes);
    const staged = stagedRes.stdout ? stagedRes.stdout.toString().trim() : '';
    if (!staged) {
        // No staged changes, check if files match HEAD and offer tag-only flow
        const filesToCheck = [releaseFileRel, 'package.json', 'package-lock.json'];
        let allMatch = true;
        for (const file of filesToCheck) {
            const diffCheck = run('git', ['diff', '--quiet', '--', file]);
            if (diffCheck.error) fatal(`git failed while checking if ${file} matches HEAD`, diffCheck);
            if (diffCheck.status !== 0) {
                allMatch = false;
                break;
            }
        }
        if (allMatch) {
            // Get current commit hash and message for clarity
            const headRes = run('git', ['log', '-1', '--pretty=format:%h %s']);
            let commitInfo = '';
            if (!headRes.error && headRes.status === 0) {
                commitInfo = headRes.stdout ? headRes.stdout.toString().trim() : '';
            }
            const tagOnlyMsg = [
                'No new changes detected. The tag will point to the current commit, which already contains the latest build and package files.',
                'No new build/package changes will be included.',
                commitInfo ? `Current commit: ${commitInfo}` : '',
                'Proceed to create a tag for the current commit?'
            ].filter(Boolean).join('\n');
            const ok = await askYesNo(tagOnlyMsg);
            if (!ok) { info('Operation cancelled by user.'); process.exit(0); }
        } else {
            fatal('Missing staged files: release and package(-lock).json files (nothing new to build?)');
        }
    } else {
        success('Release and package files staged. Continuing...');
    }

    // Confirmation before COMMIT and TAG
    const ok = await askYesNo(`Latest released tag on origin: ${latestRemoteTag}. Release target: ${targetTagName}. Proceed with the commit and tag?`);
    if (!ok) { info('Operation cancelled by user.'); process.exit(0); }
    // Commit
    runAndCheck('git', ['commit', '-m', `release: ${targetTagName}`]);
    success('Commit done. Continuing...');
    // Tag
    runAndCheck('git', ['tag', '-a', targetTagName, '-m', `Release ${targetTagName}`]);
    
    success(`Tag created: ${targetTagName}`);
} else {
    info('Commit phase skipped.');
}


// ----------------
// Push (either push-only or commit&push)
// ----------------

if (opts.push) {
    // Ensure local tag exists
    const rev = run('git', ['rev-parse', '--verify', `refs/tags/${targetTagName}`]);
    if (rev.error) fatal('git failed while preparing push checks', rev);
    if (rev.status !== 0) fatal(`Local tag ${targetTagName} not found. Run the script with --commit (or --commit --push).`);
    else success(`Local tag ${targetTagName} exists. Continuing...`);

    // Ensure the tagged commit contains the release file (important for push-only flows)
    const tagContains = run('git', ['cat-file', '-e', `${targetTagName}:${releaseFileRel}`]);
    if (tagContains.error) fatal('git failed while checking tagged commit contents', tagContains);
    if (tagContains.status !== 0) fatal(`Tagged commit ${targetTagName} does not contain the release file ${releaseFileRel}. Aborting push.`);
    else success(`Tagged commit ${targetTagName} contains the release file ${releaseFileRel}. Continuing...`);
        
    // Check remote tag state and compare SHAs for idempotence
    const ls = run('git', ['ls-remote', '--tags', 'origin', targetTagName]);
    if (ls.error || ls.status !== 0) fatal('git failed while checking remote tag for push', ls);
    const lsOut = ls.stdout ? ls.stdout.toString().trim() : '';
    if (lsOut) {
        const remoteSHA = lsOut.split(/\s+/)[0];
        const localSHAres = run('git', ['rev-list', '-n', '1', targetTagName]);
        if (localSHAres.error || localSHAres.status !== 0) fatal('git failed while resolving local tag to commit', localSHAres);
        const localSHA = localSHAres.stdout ? localSHAres.stdout.toString().trim() : '';
        if (remoteSHA != localSHA) {
            fatal(`Remote tag ${targetTagName} exists but points to a different commit. Aborting to avoid overwriting remote tag.`);
        } else {
            info('Remote tag exists and matches local tag. Push is idempotent (no tag overwrite).');
        }
    }

    // Confirmation before PUSH
    const ok = await askYesNo(`Latest released tag on origin: ${latestRemoteTag}. Local tag ${targetTagName} will be pushed. Proceed with the push?`);
    if (!ok) { info('Operation cancelled by user.'); process.exit(0); }
    
    const upstreamRes = run('git', ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
    const hasUpstream = upstreamRes.status === 0;
    
    if (!hasUpstream) { 
        const ok = await askYesNo(`No upstream exists for branch ${branch}. Proceed to set the upstream and push?`);
        if (!ok) { info('Operation cancelled by user.'); process.exit(0); }
        // Set upstream and push
        runAndCheck('git', ['push', '--set-upstream', 'origin', branch]);
        success(`Upstream set and push to origin completed.`);
    } else {
        runAndCheck('git', ['push']);
        success(`Push to origin completed.`);
    }
    runAndCheck('git', ['push', 'origin', `refs/tags/${targetTagName}`]);
    success(`Tag pushed to origin.`);
} else {
    info('Push phase skipped.');
}

success(`Script completed for the tag: ${targetTagName}. ${opts.commit ? 'Committed' : 'No commit'}. ${opts.push ? 'Pushed' : 'No push'}.`);
