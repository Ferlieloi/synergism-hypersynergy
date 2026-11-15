const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

// The loader release script's pure parts (scripts/loader-release-lib.mjs): the version bump must touch the top
// version lines only, and the changelog skeleton must come out like the entries written by hand.
async function main() {
    const root = path.resolve(__dirname, '../..');
    const lib = await import(pathToFileURL(path.join(root, 'scripts/loader-release-lib.mjs')).href);

    // Versions
    assert.equal(lib.nextPatch('0.2.11'), '0.2.12');
    assert.ok(lib.compareVersions('0.2.10', '0.2.9') > 0, '0.2.10 after 0.2.9: numeric, not text');
    assert.ok(lib.compareVersions('0.10.0', '0.9.99') > 0);
    assert.equal(lib.compareVersions('1.0.0', '1.0.0'), 0);
    assert.equal(lib.parseVersion('0.2.11a'), null);

    // Bump: a dependency at the same version keeps it
    const pkgText = JSON.stringify({ name: 'l', version: '0.2.11', dependencies: { x: '0.2.11' } }, null, 2) + '\n';
    const lockText = JSON.stringify({
        name: 'l', version: '0.2.11', lockfileVersion: 3,
        packages: { '': { name: 'l', version: '0.2.11' }, 'node_modules/x': { version: '0.2.11' } },
    }, null, 2) + '\n';
    const bumped = lib.bumpVersionFiles(pkgText, lockText, '0.2.12');
    const changedLines = (a, b) => a.split('\n').filter((line, i) => line !== b.split('\n')[i]).length;
    assert.equal(changedLines(pkgText, bumped.pkgText), 1);
    assert.equal(changedLines(lockText, bumped.lockText), 2);
    assert.equal(JSON.parse(bumped.lockText).packages['node_modules/x'].version, '0.2.11');
    assert.equal(JSON.parse(bumped.pkgText).dependencies.x, '0.2.11');
    assert.throws(() => lib.bumpVersionFiles(pkgText, lockText.replace('"version": "0.2.11"', '"version": "0.2.10"'), '0.2.12'), /disagree/);

    // The real files: 1 and 2 lines change, nothing else (they round-trip through JSON unchanged)
    const realPkg = fs.readFileSync(path.join(root, 'synergism_modloader/package.json'), 'utf8');
    const realLock = fs.readFileSync(path.join(root, 'synergism_modloader/package-lock.json'), 'utf8');
    const realBumped = lib.bumpVersionFiles(realPkg, realLock, '99.0.0');
    assert.equal(changedLines(realPkg, realBumped.pkgText), 1);
    assert.equal(changedLines(realLock, realBumped.lockText), 2);
    assert.equal(realBumped.lockText.length - realLock.length, 2 * ('99.0.0'.length - JSON.parse(realLock).version.length));

    // Tag message: the title added once, CRLF and BOM dropped, empty notes refused
    const title = 'Hypersynergism Loader 0.2.12';
    assert.equal(lib.tagMessage('0.2.12', '﻿- A fix\r\n'), `${title}\n\n- A fix`);
    assert.equal(lib.tagMessage('0.2.12', `${title}\n\n- A fix\n`), `${title}\n\n- A fix`);
    assert.equal(lib.tagMessage('0.2.12', `${title}\n- A fix`), `${title}\n\n- A fix`);
    assert.throws(() => lib.tagMessage('0.2.12', `${title}\n\n`), /no notes/);
    assert.throws(() => lib.tagMessage('0.2.12', '  \n'), /no notes/);

    // The 0.2.11 release notes, as tagged
    const notes = `No new patch needed after this update.

**No 7-Zip to install**
- The loader now comes with its own 7-Zip, so you no longer need to install 7-Zip to patch the game. The 7-Zip field on the first screen is optional: a 7-Zip you already chose there is still used.

**Patch log**
- A Copy button in its top-right corner copies the whole log, handy for a bug report.
- Its height can be changed by dragging its
  bottom-right corner.

## Heading
* Star item with **bold** inside`;
    const split = lib.splitNotes(notes);
    assert.deepEqual(split.notes, ['No new patch needed after this update.']);
    assert.equal(split.changes.length, 4);
    assert.equal(split.changes[2], 'Its height can be changed by dragging its bottom-right corner.');
    assert.equal(split.changes[3], 'Star item with bold inside');

    // The entry, against the one written by hand for 0.2.11
    const changelog = JSON.parse(fs.readFileSync(path.join(root, 'docs/data/changelog.json'), 'utf8'));
    const real = changelog.entries.find(e => e.id === 'loader-0.2.11');
    const profiles = changelog.contributor_profiles;
    assert.equal(lib.profileIdFor(profiles, 'XxmolkxX'), 'Ferlieloi');
    assert.equal(lib.profileIdFor(profiles, 'MAENHIIR'), 'maenhiir');
    assert.equal(lib.profileIdFor(profiles, 'nobody'), null);

    const sourceShas = real.sources.filter(s => s.label.startsWith('Source: ')).map(s => s.url.split('/').pop());
    const entry = lib.buildChangelogEntry({
        version: '0.2.11', commit: real.commit, previousCommit: real.previous_commit, date: real.date,
        releaseUrl: real.release_url, sourceCommits: sourceShas.map(sha => ({ sha, author: 'maenhiir' })),
        releaseAuthor: 'maenhiir', notes, profiles,
    });
    for (const key of ['id', 'version', 'channel', 'repository', 'commit', 'previous_commit', 'date', 'date_kind',
        'status', 'release_url', 'sources', 'contributors', 'contributor_range', 'merges']) {
        assert.deepEqual(entry[key], real[key], `entry.${key}`);
    }
    assert.ok(entry.changes.every(c => c.type === 'TODO'), 'types are left to fill in, so --validate refuses the skeleton');
    assert.deepEqual(Object.keys(entry), Object.keys(real), 'same key order as the entries written by hand');

    // Credits: another author's work, and a release made by someone without work in it
    const mixed = lib.buildChangelogEntry({
        version: '0.3.0', commit: 'c'.repeat(40), previousCommit: null, date: '2026-12-01',
        releaseUrl: 'https://github.com/Ferlieloi/synergism-hypersynergy/releases/tag/loader-v0.3.0',
        sourceCommits: [{ sha: 'a'.repeat(40), author: 'XxmolkxX' }, { sha: 'b'.repeat(40), author: 'Stranger' }],
        releaseAuthor: 'maenhiir', notes: '- x', profiles,
    });
    assert.deepEqual(mixed.contributors, [
        { id: 'Ferlieloi', roles: ['changes'], commits: ['a'.repeat(40)] },
        { id: 'UNKNOWN Stranger', roles: ['changes'], commits: ['b'.repeat(40)] },
        { id: 'maenhiir', roles: ['release'], commits: ['c'.repeat(40)] },
    ]);
    assert.equal(mixed.contributor_range.base, null);

    console.log('loader release: all checks passed');
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
