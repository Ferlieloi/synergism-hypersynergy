# Player website and wiki (`docs/`, `scripts/tools/build-docs.py`)

How the player website is built and how it behaves. How to update and publish it: `docs/dev/publishing-guide.md`.

## Hosting
- **GitHub Pages serves Live's `master` from the repository root** (Pages source `/`, not `/docs`): page addresses contain `docs/` (`https://ferlieloi.github.io/synergism-hypersynergy/docs/features.html`). The generated root `index.html` redirects the bare address to `docs/`; the root `.nojekyll` turns Jekyll off for the whole repository.
- **Links that rely on the root source:** the mod's Tools tab website button (`HSGlobal.General.modWebsiteUrl`, the bare address), the strategy editor's guide link (`modWebsiteUrl` + `docs/wiki/autosing-guide.html#making-or-editing-a-strategy`, `hs-autosing-strategy-modal.ts`), the README and the GitHub Wiki's pages. Switching Pages to `/docs` breaks them all.
- **The site is served from Live only.** Dev commits the data, never the generated pages (`docs/dev/releasing.md`, "Porting a change to Live"), so the pages in a Dev checkout lag the data and `--check` fails there.
- **The native GitHub Wiki** (`Ferlieloi/synergism-hypersynergy.wiki`, its own repository) holds only pages pointing to the website since 2026-11-04, written by hand there: one per category page plus Home, Mod-Features, the two references, sidebar and footer. `docs/wiki-source/` still holds the full Markdown wiki and `prepare-wiki.py` copies it over those pages: running it brings the full wiki back.

## Sources and outputs
`build-docs.py` writes 45 files (Python, no dependency, no network). HTML pages start with a comment naming their source.

| Source | Generated from it |
|---|---|
| `docs/data/feature-catalogue.json` | `features.html`, `index.html` (home), `wiki/index.html`, `wiki/<category id>.html`, `FEATURES.md`, `FEATURE-AUDIT.md`; in `wiki-source/`: `Home`, `_Sidebar`, `_Footer`, `Mod-Features`, `Features-<category id>` |
| catalogue + `src/mod/resource/json/hs-settings.json` | `wiki/settings.html`, `wiki-source/Settings-Reference.md`; the header's settings count |
| `docs/data/guides/<category id>.md` | `wiki/<category id>-guide.html`; `wiki-source/Guide-<category id>.md` (a verbatim copy) |
| `docs/data/changelog.json` | `changelog.html` |
| `src/mod/class/hs-core/gds/hs-calculation-definition.ts` | `wiki/calculations.html`, `wiki-source/Calculation-Reference.md` |
| `package.json` `version` | the header's "Guide for v…" on every page |
| the generator itself | `about.html`, `github.html`, root `index.html`, both `.nojekyll`; every page text that isn't data (intros, the home page's steps, the changelog's introduction, the audit's "Reviewed distinctions" and "Verification limits") |

- **Read from the checkout**: version, settings and calculations come from the branch the generator runs on (why Dev's pages would show Dev's version and settings).
- **Hand-written, served as they are:** `docs/css/original.css` (the original website's style, kept close to it), `docs/css/guide.css` (every adaptation; style changes go here), `docs/js/guide.js` (loaded on every page, acts only on the features page), `docs/js/changelog.js` (changelog page only), `docs/res/` (icons, GitHub logo, mod logo, `categories/` the category icons, `guides/` and `features/` the screenshots). A change there reaches the site without regenerating.
- **Modes:** no option writes every file; `--check` compares without writing; `--validate` runs the catalogue, guide and changelog checks and writes nothing; `--changelog-only` writes or checks only `changelog.html` (after the catalogue checks); `--out DIR` writes to `DIR` (same layout, `DIR/docs/...`) instead of the checkout and copies the hand-written `css/`, `js/` and `res/` there, for a preview that leaves `docs/` untouched (not with `--check` or `--validate`). Outputs use LF.
- **Preview watcher** (`scripts/tools/watch-site.cjs`, `npm run site`): reruns `--out local/site` at each change of a source in the table above or of the hand-written files; `start-dev-server.bat` starts it with a server on port 8081 (no cache). Both are optional there: without Python, or with the port taken, the mod's build and server keep running.
- **`scripts/tools/prepare-image.cjs`** turns a screenshot into a site image (crop, scale down, WebP) through headless Chrome: `docs/dev/publishing-guide.md`, "Images".
- **`npm run screenshots`** (`scripts/tools/screenshots/`) takes the site's screenshots from an HS backup in the real game headless, and the Steam loader's window from its page with made-up data: `docs/dev/publishing-guide.md`, "Images".
- **Checks not run by `npm test`** (it runs only `*.cjs`): `python scripts/tests/test-changelog-validation.py` (changelog validation and credit rules) and `node --check` on the two scripts.

## How the generator is organised
One Python file, no template engine: each page is an f-string.
- **Nothing is written until every output is built:** the checks run first (`validate_catalogue()`, which also parses every guide; `validate_changelog()` when the changelog page is built), every output goes into `OUTPUTS` (path → text) through `add()`, then `main()` writes them all, compares them (`--check`) or writes them to `--out`. A refused input stops the run with no file written, so a new output goes through `add()` too, never straight to disk.
- **One frame for every page:** `page()` writes the head, header, tabs and footer around a page's body (`depth` sets the `../` prefix of pages in `wiki/`). The header and the tabs change there, once.
- **An entry is rendered twice:** `feature_html()` for the site (`compact=True` on the features page: details folded, first image as a miniature) and `feature_md()` for the Markdown outputs. A change to how an entry is laid out goes in both.
- **The calculation reference is a text scrape** of `hs-calculation-definition.ts` (`calculationName`, `fnName`, `toolingSupport`, `supportsReduce`). If one of the first three is renamed, no entry is found and the run stops. If `supportsReduce` is renamed, the page silently shows "No" for every entry.

## Feature catalogue (`feature-catalogue.json`)
- **Top level:** `repository` (every repository, release, issue and source link: source links follow `blob/master/`), `audited_commit` (shown only in `FEATURE-AUDIT.md`), `branch` (not read), `categories` (in display order).
- **Category:** `id`, `title`, `color` (a CSS colour: the features page's category heading), `intro`, `icon` (optional: a picture under `docs/res/`, shown before the category's title on the home page, the wiki index, the features page and its wiki page), `sources` (repository paths, listed once under the intro of its wiki page, its Markdown page and its `FEATURES.md` section; not on the features page), `features` (in display order).
- **Feature:** `id`, `title`, `summary`, `where`, `details` (list) are required; `limits` (list), `settings` (setting keys), `sources`, `images` (screenshots: `src` from `docs/`, `alt`, optional `caption`; a narrow one before the details, floating right of them, a wide one after them; also in the Markdown pages; on the features page the first one is also a miniature right of the title, whose click unfolds the details) are optional. An entry shows only its own `sources`, not its category's.
- **The generator refuses:** a category or feature id used twice, a missing required field, an unknown setting key, a setting of `hs-settings.json` no feature lists, a source path that isn't a file in the checkout, a missing icon or image, an image outside `docs/res/` or without `alt`. A setting listed by two features links to the last one on the settings page.
- **Ids name addresses; titles can change.** A category id names `wiki/<id>.html`, `Features-<id>`, its guide and the `?category=` filter; a feature id is its anchor on the features page, its wiki page and the settings page's links. The Markdown wiki anchors features by title instead.
- **Plain text only**: every string is escaped on the site, so Markdown or HTML in a catalogue string shows as typed.

## Players' guides (`docs/data/guides/`)
- At most one per category, named by its id, first line `# Title`. Linked from its category on the features page and wiki page, the wiki index ("Guides") and the Markdown wiki's sidebar.
- **A Markdown subset** (the list: `docs/dev/publishing-guide.md`), anything else refused, so a guide renders the same on the site and on GitHub. Each heading gets the id GitHub would give it (lowercase, punctuation dropped, spaces to hyphens).
- **Alerts** (`> [!NOTE]`, TIP, IMPORTANT, WARNING, CAUTION): GitHub shows them with its icons; the site draws a box in the same colours with a matching icon. For what the reader must not miss, a few per guide: three in `autosing.md` (needs Tampermonkey or Steam, Save isn't final, copy the timings first).
- **Images:** alone on their line, path relative to the guide (so GitHub shows them too), rewritten for the site; `@<n>x` in the name sets the displayed size. One 850 px wide or less floats right of the text after it (placed right under its heading); headings start below a floating image. Rules: `docs/dev/publishing-guide.md`, "Images".
- **Links: in-page anchors or full URLs.** A relative link to another page would point elsewhere from `docs/wiki/` than from the GitHub Wiki. Images are the exception: the GitHub Wiki copy no longer serves ("Hosting").
- **Renaming the "Making or editing a strategy" heading of `autosing.md` breaks the strategy editor's link** to it.

## Every page
- **Header:** five counters (features, categories, settings, "Live Channel" or "All Channels" on the changelog, "QoL + opt-in AutoSing"), "Hypersynergism Guide for v<version>" (colour-cycling), the maintainers line, six tabs: Home orange, Features green, Wiki cyan, Changelog plum, Github light blue, About white. The current tab is filled with its colour and a line of that colour runs under the tabs. No fixed height: the game's header keeps room for a third row, which left an empty band above the tabs (not kept: long pages need the room). Footer: source, credits, back to top.
- **The content is a column centred in the window** (at most 1200 px, footer included, paragraphs at most 112 characters wide), its text left-aligned; the header spans the whole width, like the game's.
- **Each page has its own `<meta name="description">`** (search results, link previews): a line passed to `page()`, the general sentence on the home page; a wiki category page lists its category and as many feature titles as fit in 160 characters, so it never goes stale.
- **Maintainers are named by their GitHub names** (Ferlieloi, maenhiir); the About page and the catalogue's "Live and Dev channels" entry add the other names players know (XxmolkxX, Shewchou).
- **Every page works without JavaScript**: everything is shown, only search and folding need it.
- **Narrow screens** (640 px and less): the page scrolls as a whole, the header with it (wider, only the content scrolls under a fixed header); side margins drop, the category lists (home, wiki index) take one column, the settings table shows one labelled block per setting. **Reduced motion** stops the version's colour cycle and every transition. **Printing** leaves out the header, the search forms and the footer.
- **Keyboard:** a "Skip to content" link, a yellow outline on the focused control, the current tab marked `aria-current`; counts of shown entries are announced (`aria-live`).
- **The About page promises** no analytics, cookies, account system or save uploads: whatever is added keeps it true.
- **Filters are kept in the address** (`?q=`, `?category=` or `?channel=`) so a filtered page can be shared, except on a page opened as a file.

## Home, Github, About
- **Home:** an introduction, quick links (features, wiki, installation, releases, issues), the categories with their feature counts (each linking to its wiki page), four first steps for new players, the original project.
- **Github:** links to Live, its releases and issues, the Dev repository, ahvonenj's original repository and the game's source. **About:** maintainers, the original website's style, privacy, licence.

## Features page (`features.html`, `guide.js`)
- **Each entry shows its title and summary**; "How to use it & limits" opens the rest: where, details, availability and limits, related settings (links to their row on the settings page), its own source files if any. The entry's title links to itself.
- **Search** matches every word typed against the whole text of an entry (details included); **Category** shows one category. A category with no match is hidden.
- **Categories start folded.** The script turns each category title into a toggle (`<button aria-expanded>` inside the `<h2>`, a triangle on its left that turns in place) followed by the number of features in grey (the number of matches during a search). A folded category shows only its title. Not `<details>` in the generator: the heading would lose its heading role for screen readers, and the filter would have to open them anyway.
- **No full list for a frame first:** a script in the page's head sets `html.folding`, which hides every category's contents (titles shown, the triangle's room kept) until `guide.js` has folded them. Lifted by `guide.js` whatever happens (`finally`), by the script tag's `onerror` if the file fails to load, and after 5 s in any case: an error never leaves the features hidden. Without it, the list showed unfolded for 1–2 frames (20–45 ms) on most loads, on any network.
- **Fold all / Unfold all** next to Reset acts on the categories shown; its label says what a click does and its width doesn't change with it.
- **A search or a category choice unfolds everything**, folds included that the address brought in at load; once both are cleared, the folds from before come back. Folds made during the search are dropped then.
- **Folds are not remembered** across visits: a returning visitor seeing empty categories would think features were missing.
- **A link to a feature** (`#<feature id>`) clears a filter that hides it, unfolds its category, opens its details and scrolls to it.
- **Printing shows every category in full**, folded or not, without the triangles.
- Limits: the browser's find (Ctrl+F) doesn't search folded categories (`hidden="until-found"` would clash with the `hidden` the filter sets).

## Wiki pages (`docs/wiki/`)
- **Index:** the categories, the guides, the references (settings, calculations, `FEATURES.md` as a file), how to report a bug. No link to the GitHub Wiki: it only points back here.
- **Category page:** its intro, its guide, a table of contents, then every feature in full (no folding, nothing to open), with the same anchors as the features page.
- **Settings:** one row per setting, in `hs-settings.json` order, anchored by its key: its `settingDescription` (not the help text), initial value (`settingValue`, else `enabled`), "Panel control" or "Hidden / inline or internal" with its control page (named as the Settings tab shows it, from `hs-settings-control-pages.json`), and its feature.
- **Calculations:** the calculation picker's entries (`toolingSupport: true`), sorted by name, with their function and whether they support reduction. Read by pattern from the TypeScript file: the build fails only if it finds none.
- **`FEATURES.md`:** every category and feature in one Markdown file; its settings and guides link to the website (address built from the catalogue's `repository`). **`FEATURE-AUDIT.md`:** counts and each category's sources, under the original audit's fixed text.

## Changelog page (`changelog.html`, `changelog.js`)
- **Display:** every entry, newest first (date, then version, then channel). A card: the version (linked to its GitHub release if any), a channel badge (Original, Live, Dev version, Loader), the date and, for a version record, "Historical build" (a source labelled "Build containing …") or "Source version"; contributors; merge notices; changes grouped Added / Changed / Removed / Fixed; notes; sources, folded.
- **Contributors:** each linked to its profile; "(release)" or "(version record)" for a release-only credit, "(merged)" for the merger.
- **A catch-up** shows "Dev → Live" or "Live → Dev" and "Includes changes from" linking to the incoming versions' cards ("(partial)" when only part came in); its own changes then come under "Changes from Live" (or Dev). Searching a change of an incoming version also finds the catch-up that brought it.
- **Filters:** Channel and a search over version, contributors and their aliases, changes and notes (every word must match); Clear resets both. A link to an entry (`#<entry id>`, or an old id kept in its `aliases`) clears a filter that hides it.

### Changelog data (`changelog.json`)
- **Top level:** `schema_version` 1, `methodology` (sentences, not displayed), `display_policy`, `contributor_profiles`, `entries`. `display_policy` is `all-records`; `released-only` would show only published and tagged versions, and a version linked from a catch-up but not shown would open from its link only.
- **Entry:** `id` (the anchor), `version`, `channel` (`original`, `live`, `dev`, `loader`), `repository`, `commit` and `previous_commit` (full hashes), `date` (UTC) with `date_kind` (`published`, `tag`, `commit`), `status` (`published`, `tagged`, `version-record`), `release_url` (or null), `sources` (label + URL), `changes` (`type`, `text`, `evidence` URLs not displayed), `notes`, `contributors`. Optional: `merges`, `aliases`, `earlier_changes` (shown folded under "Earlier changes recorded with this release", not on a catch-up), `included_version_records` (earlier version records of the same channel reviewed with this release; not displayed). Not read by the generator: `research_notes`, `contributor_range`.
- **Every URL must be HTTPS on github.com**; the validation refuses any other, and any value outside the lists above.
- **`merges`** (a catch-up): `direction` `dev-to-live` on a Live entry or `live-to-dev` on a Dev entry, `from_entry_ids` (versions of the other channel, newest first), `partial_entry_ids` (some of those), `summary`, `commit`, `evidence`. The entry must credit a merger (`merge` role) and give nobody the `release` role.
- **Contributors:** `contributor_profiles` maps an id to `name`, `url` (or null), `aliases` and `identity_commits`; each entry's `contributors` gives the id, roles (`changes`, `release`, `merge`) and evidence commits.
- **`update-changelog-contributors.py`** computes credits from the local Git history: the human authors and co-authors of `previous_commit..commit` (loader: `synergism_modloader/` only), aliases merged through its own profile list, bots and coding agents left out, commits touching only version and build files counted as `release`. It skips catch-ups (credited by hand) and rewrites every other entry's credits: hand-reviewed credits on those are lost by a run without `--check`, which only reports the differences.
