# Publishing the player guide and wiki

The site uses GitHub Pages, matching the original project. No Sites/Cloudflare project, database, runtime dependencies or additional hosting account is needed. Existing `docs/features/`, `docs/game/` and `docs/dev/` remain developer documentation. How the site is built and how it behaves: `docs/features/website.md`.

## Update the content

1. Review the relevant mod implementation and developer feature docs.
2. Edit `docs/data/feature-catalogue.json`. It is the shared source for the public site, inventory and wiki; do not edit generated pages by hand.
3. Step-by-step guides are hand-written Markdown in `docs/data/guides/<category id>.md`, starting with a `# Title` line. Each becomes `docs/wiki/<category id>-guide.html` (and `docs/wiki-source/Guide-<category id>.md`), linked from its category, the wiki index and the sidebar. Use only headings (`#` to `####`), paragraphs, flat `-` and `1.` lists, `---` rules (blank line above), `**bold**`, `` `code` ``, `[links](url)`, GitHub's alerts (a `> [!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]` or `[!CAUTION]` line, then `> ` lines of paragraphs or flat lists, then a blank line) and images (see "Images" below): the generator refuses anything else.

## Images

Screenshots go in `docs/res/guides/` (guides) or `docs/res/features/` (catalogue entries), as WebP, PNG or GIF.

- **The site's screenshots are taken by a script:** `npm run screenshots -- <backup.json> [name ...]` (`scripts/tools/screenshots/`). It loads an HS backup in the real game headless with the dev build (`npm run build`, `node scripts/tools/update-game.cjs` first), takes each view at 2x, and writes the WebP files in `docs/res/`, about 3 minutes for all. The backup: a save at S216+ with hepteracts and the GQ shop unlocked; the game shows the account as "harness", and the version without its `-devN` suffix. Rerun it for a name after a change to that view. The names, and where each image goes: `images.cjs`; a new view: a function in `game-shots.cjs` plus its line in `images.cjs`. To adjust one shot without reloading the game each time: `game-session.cjs <backup>`, then `run-shot.cjs <name>`.
- **Prepare a screenshot** with `node scripts/tools/prepare-image.cjs <screenshot> docs/res/guides/<name>@<n>x.webp [--crop x,y,w,h] [--width px]`: it crops, scales down and converts to WebP through headless Chrome (no image tool to install).
- **`@<n>x` in the name** says the screenshot was taken at n times the page's size (browser zoom × Windows display scaling, e.g. `@1.4x` at 140%, `@2x` at 200%): the site shows it at its pixel size divided by n, the size it has in the game. Without it, at its pixel size.
- **In a guide:** an image alone on its line, its path relative to the guide file (as GitHub reads it): `![What it shows](../../res/guides/strategy-window@2x.webp "Optional caption")`. The description is required (screen readers, broken images). Put a narrow image right under its heading, before the text it goes with (below).
- **In the catalogue:** an entry's optional `images`, a list of `{"src": "res/features/<name>.webp", "alt": "What it shows", "caption": "optional"}`, `src` from `docs/`. A narrow one shows before the entry's details, a wide one after them. On the features page, where the details are folded, the first image also shows as a miniature right of the entry's title: a click unfolds the details.
- On the site an image loads only when scrolled to, its box is sized before it loads, it shrinks to the column, and a click opens it full size. **An image shown 850 px wide or less** (`SIDE_IMAGE_MAX_WIDTH` in `build-docs.py`) **floats right of the text after it**, at most half the column (600 px), shrunk if wider; the next heading starts below it; on phones it takes the whole width. A wider one takes the column's width. The generator refuses a missing file, a file outside `docs/res/`, another format, and a missing description.
- **No personal data:** check a screenshot shows no player name, ID or anything private before committing it.
4. When re-auditing behavior, update `audited_commit` to the reviewed source commit: it only records the audit in `docs/FEATURE-AUDIT.md`, source links follow `master`. The package version, settings registry and calculation picker entries are read from the checkout.
5. Run:

   ```sh
   python scripts/tools/build-docs.py
   python scripts/tools/build-docs.py --check
   node --check docs/js/guide.js
   ```

The generator refuses duplicate feature IDs, unknown settings, unmapped settings and missing source references. It does not access the network or change the mod. `--validate` runs only those catalogue checks and writes nothing: on Dev, use it instead of generating (`docs/dev/releasing.md`, "Porting a change to Live").

## Update the changelog

Edit `docs/data/changelog.json`, which records release and version history separately from the current feature catalogue. Keep the researched version labels and channel names as recorded, distinguish published release dates from tag or inferred commit dates, and link evidence to HTTPS GitHub sources. Validate the feature catalogue and changelog without writing files with:

```sh
python scripts/tools/build-docs.py --validate
```

At a Live release, regenerate the whole site (step 5 above) and run the changelog checks below (`docs/dev/releasing.md`). Between releases, after changing only the changelog, regenerate only `docs/changelog.html`, without the rest of the site (Dev never commits either):

```sh
python scripts/tools/build-docs.py --changelog-only
python scripts/tools/build-docs.py --changelog-only --check
python scripts/tests/test-changelog-validation.py
node --check docs/js/changelog.js
```

### Writing patch notes

Compare the intended release with the previous released build on its channel. Write short bullets about player-facing additions, behavior changes, removals and fixes. Include platform-specific effects or required player actions where relevant. Use the same change list and catch-up links in the website entry, annotated tag and GitHub release notes. In Markdown notes, link to the published changelog entries for incoming versions. Save the Markdown notes under `local/` and pass the file to the mod release helper with `--notes-file`.

The public changelog includes early version records alongside tagged and published releases. A historical build has a surviving bundle with the recorded version. A source version has a verified version declaration or source endpoint. Use the commit date for these records and link their evidence. Dev versions are labeled separately. Keep historical audit notes and change evidence in the data when simplifying the displayed wording.

For a cross-channel catch-up, add a `merges` record to the receiving release. Use `from_entry_ids` for each source version brought in since the previous catch-up, newest first. Check the Git history for intervening versions, prior ports, and changes already present on the receiving branch. Use `partial_entry_ids` when the catch-up brings in only part of a source release. Link to existing notes for incoming changes and use the receiving release's `changes` for its new work. Preserve each channel's wording for the changes it documents when merging changelog data.

When Dev brings in a Live fix made between releases, or the other way around, check whether existing Live patch notes describe it. If the fix first gets documented in the Dev release, include it in that release's `changes`, cite the Live commit, and credit the fix's author with the `changes` role. Keep the merge commit and source evidence with the catch-up record.

Review each catch-up's notes and `contributors` by hand. A Git filter for incoming commits can help identify what to review. Check the actual changes and source notes for cherry-picks and fixes made during merge resolution. Give the authors of the changes listed on the card the `changes` role and the merger the `merge` role. Incoming work covered by linked notes keeps its credit there. The contributor refresh preserves the reviewed catch-up credits.

Record historical changes at the earliest verified version that contains them. Consolidate repeated notes and keep `included_version_records` for earlier records reviewed as part of a release audit. Check the surviving bundle or release evidence before describing a change as released.

Contributor profiles use verified public identities, with aliases combined. Credits cover human authors and recorded co-authors in each version's changes; release-only contributions are identified. To refresh credits with all required Original, Live and Dev historical commits available locally, run:

```sh
python scripts/tools/update-changelog-contributors.py
python scripts/tools/update-changelog-contributors.py --check
```

The attribution helper does not fetch or publish. Review any new identity before adding it to the helper's profile registry. Normal documentation builds use the stored credits and do not need Git history. Merge notices retain source commit evidence and link to the source version when it is included in the displayed history.

## Preview

Open `docs/index.html` directly in a browser: the complete site, wiki, relative assets and feature search work without a server. Alternatively run `python -m http.server 8080 --directory docs` and visit `http://localhost:8080/`. No game save is needed.

On Dev, whose checked-in pages lag the data, preview without touching `docs/`: `python scripts/tools/build-docs.py --out local/site` builds the site into the git-ignored `local/site/` and copies `css/`, `js/`, `res/` and the mod's images (`src/mod/resource/img/`) next to it; open `local/site/docs/index.html`. `npm run site` rebuilds that preview at each change of the site's sources (catalogue, guides, changelog, `css/`, `js/`, `res/`, the mod's images, the generator, the settings, the calculations, the version); `start-dev-server.bat` runs it and serves the preview at `http://localhost:8081/docs/` (reload to see a rebuild).

Check these flows at desktop and narrow/mobile widths:

- Home → each colored navigation tab → Back to top. The tab matches the page and text is readable.
- Features → search `hidden tabs`: the saved-tab preference appears. Reset restores all entries.
- Features → Header customization: all header options appear, including cell alignment, half height, grid width, slot count, icon picking, row placement and keep-on-import.
- Search nonsense: a clear no-results message appears. Clear the search or reset to restore the guide.
- Open a feature permalink: its details open even if the shared search query would otherwise hide it.
- Changelog → Dev versions: only labeled Dev builds appear, newest first, with dates and contributors. Search a version or contributor, then Clear to restore the list.
- Changelog → Live → a Dev → Live notice. Each version link reveals its source Dev release even when the Live filter was selected. The receiving branch's changes appear under the notice.
- Wiki → a category → a related setting → its feature link: each destination exists.
- Disable JavaScript: normal navigation and every feature/detail remain available; only search requires JavaScript.
- Keyboard Tab reaches navigation, search, category choice and detail controls with visible focus. With reduced motion enabled, the version animation stops.

## Publish the website

Pages serves Live's `master` from the **repository root** (Settings → Pages: Deploy from a branch, `master`, `/ (root)`), so committing the regenerated pages to `master` publishes them. Wait for the Pages deployment to finish before calling a change live. No Actions workflow: the root `.nojekyll` makes it a plain static deployment.

Keep the root source: the site's addresses contain `docs/` (the root `index.html` redirects the bare address there), and the mod's strategy editor, the README and the GitHub Wiki link to those addresses, and the category icons that are the mod's own are served from `src/`. Switching the source to `/docs` breaks them (`docs/features/website.md`, "Hosting").

## The native GitHub Wiki

The GitHub Wiki (its own repository, `Ferlieloi/synergism-hypersynergy.wiki`) holds only pages pointing to the website: Home, Mod-Features, a `Features-<category id>` page per category, Settings-Reference, Calculation-Reference, the sidebar and the footer. They are written by hand in the wiki itself; update them when a category is added, renamed or removed.

`docs/wiki-source/` and `scripts/tools/prepare-wiki.py` date from when the wiki held the full guide: don't run the helper, it would replace the pointer pages with full ones.

## Scope and verification

This work changes documentation and its build helper only; it does not alter game features, loader behavior or release bundles. See `docs/FEATURE-AUDIT.md` for source scope and `docs/FEATURES.md` for the full inventory.
