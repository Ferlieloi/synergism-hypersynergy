#!/usr/bin/env python3
"""Build the public site and the feature inventory from one catalogue.

No dependencies or network access. Existing developer documents are inputs only.
What each page is built from and how it behaves: docs/features/website.md.
Run from any directory: python scripts/tools/build-docs.py [--check | --validate | --changelog-only] [--out DIR]
"""
from __future__ import annotations

import argparse
import html
import json
import re
import shutil
from datetime import date as date_type
from pathlib import Path
from urllib.parse import quote, urlparse

ROOT = Path(__file__).resolve().parents[2]
DOCS = ROOT / "docs"
CATALOGUE = json.loads((DOCS / "data/feature-catalogue.json").read_text(encoding="utf-8"))
SETTINGS = json.loads((ROOT / "src/mod/resource/json/hs-settings.json").read_text(encoding="utf-8"))
# The Settings tab's page names, as the mod panel shows them.
CONTROL_PAGES = json.loads((ROOT / "src/mod/resource/json/hs-settings-control-pages.json").read_text(encoding="utf-8"))
VERSION = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))["version"]
CATEGORIES = CATALOGUE["categories"]
FEATURES = [f for c in CATEGORIES for f in c["features"]]
REPO = "https://github.com/" + CATALOGUE["repository"]
SOURCE = REPO + "/blob/master/"
# Pages serves the repository root, so the site's pages sit under docs/ (docs/features/website.md, "Hosting").
_OWNER, _NAME = CATALOGUE["repository"].split("/")
SITE = f"https://{_OWNER.lower()}.github.io/{_NAME}/docs/"
# The mod's Discord thread, as its Tools tab opens it (the site reads the mod, docs/features/website.md).
_GLOBAL = (ROOT / "src/mod/class/hs-core/hs-global.ts").read_text(encoding="utf-8")
_THREAD = re.search(r"modDiscordThreadUrl\(\)\s*\{\s*return\s*'([^']+)'", _GLOBAL)
if not _THREAD:
    raise SystemExit("build-docs.py: modDiscordThreadUrl not found in hs-global.ts (renamed?)")
DISCORD_THREAD = _THREAD[1]
# The thread opens only to members of the game's server.
DISCORD_INVITE = "https://www.discord.gg/ameCknq"
OUTPUTS: dict[str, str] = {}
# Hand-written guides, one per category at most: docs/data/guides/<category id>.md, starting with a "# Title" line.
GUIDES = {p.stem: p.read_text(encoding="utf-8").replace("\r\n", "\n")
          for p in sorted((DOCS / "data/guides").glob("*.md"))}


def esc(value: object) -> str:
    return html.escape(str(value), quote=True)


def source_link(path: str) -> str:
    return SOURCE + quote(path, safe="/")


def slug(title: str) -> str:
    return re.sub(r"[^\w\- ]", "", title.lower()).replace(" ", "-")


def add(path: str, text: str) -> None:
    OUTPUTS[path] = text.rstrip() + "\n"


def ul(items: list[str]) -> str:
    return "<ul>" + "".join(f"<li>{image_marks(esc(x))}</li>" for x in items) + "</ul>"


# A screenshot's numbered or lettered marks (scripts/tools/screenshots/game-shots.cjs draws them): ①–⑳, Ⓐ–Ⓩ.
IMAGE_MARKS = {**{chr(0x2460 + n): str(n + 1) for n in range(20)}, **{chr(0x24B6 + n): chr(65 + n) for n in range(26)}}


def image_marks(s: str) -> str:
    """A circled number or letter in a text points to the same mark in its screenshot: drawn as that mark's badge.
    Guides write the UI's own circled labels in bold (the Steam loader's "**① Locate game**"): inline_md skips them."""
    return re.sub("[\u2460-\u2473\u24b6-\u24cf]", lambda m: (
        f'<span class="image-mark" role="img" aria-label="{m[0]}">{IMAGE_MARKS[m[0]]}</span>'), s)


IMAGE_TYPES = (".png", ".webp", ".gif")


def image_size(path: Path) -> tuple[int, int]:
    """Pixel size from a PNG, GIF or WebP header (no image library)."""
    data = path.read_bytes()[:32]
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return int.from_bytes(data[16:20], "big"), int.from_bytes(data[20:24], "big")
    if data[:6] in (b"GIF87a", b"GIF89a"):
        return int.from_bytes(data[6:8], "little"), int.from_bytes(data[8:10], "little")
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        chunk = data[12:16]
        if chunk == b"VP8 ":
            return int.from_bytes(data[26:28], "little") & 0x3FFF, int.from_bytes(data[28:30], "little") & 0x3FFF
        if chunk == b"VP8L":
            bits = int.from_bytes(data[21:25], "little")
            return (bits & 0x3FFF) + 1, ((bits >> 14) & 0x3FFF) + 1
        if chunk == b"VP8X":
            return int.from_bytes(data[24:27], "little") + 1, int.from_bytes(data[27:30], "little") + 1
    raise ValueError(f"{path.relative_to(ROOT).as_posix()}: not a PNG, GIF or WebP image")


def site_image(path: Path, where: str) -> tuple[str, int, int]:
    """An image file under docs/res/: its path from docs/ and its display size. A name ending in @<n>x (e.g.
    strategy-window@2x.webp, a screenshot taken at 200% zoom) is shown at its pixel size divided by n."""
    path = path.resolve()
    if not path.is_relative_to((DOCS / "res").resolve()) or path.suffix.lower() not in IMAGE_TYPES:
        raise ValueError(f"{where}: an image must be a {', '.join(IMAGE_TYPES)} file under docs/res/")
    if not path.is_file():
        raise ValueError(f"{where}: missing image {path.relative_to(ROOT).as_posix()}")
    width, height = image_size(path)
    density = re.search(r"@(\d+(?:\.\d+)?)x$", path.stem)
    if density:
        width, height = round(width / float(density[1])), round(height / float(density[1]))
    return path.relative_to(DOCS.resolve()).as_posix(), width, height


# A screenshot at most this wide (as shown) sits right of the text after it; a wider one takes the column's width.
SIDE_IMAGE_MAX_WIDTH = 850


def is_side_image(image: tuple[str, int, int]) -> bool:
    return image[1] <= SIDE_IMAGE_MAX_WIDTH


def figure_html(prefix: str, image: tuple[str, int, int], alt: str, caption: str = "") -> str:
    """A screenshot: lazy-loaded, its box sized before it loads (no layout shift), a click enlarges
    it over the page (guide.js; without JS the link opens the file).
    A narrow one (is_side_image) floats right of what follows it, at most half the column (guide.css, .shot-side)."""
    src, width, height = image
    href = esc(prefix + quote(src, safe="/@"))
    side = " shot-side" if is_side_image(image) else ""
    return (f'<figure class="shot{side}"><a href="{href}" target="_blank" rel="noopener">'
            f'<img src="{href}" width="{width}" height="{height}" alt="{esc(alt)}" loading="lazy" decoding="async"></a>'
            + (f"<figcaption>{esc(caption)}</figcaption>" if caption else "") + "</figure>")


def feature_images(f: dict) -> list[tuple[dict, tuple[str, int, int]]]:
    """A catalogue entry's "images": [{"src": "res/…" (from docs/), "alt", "caption" (optional)}]."""
    out = []
    for n, image in enumerate(f.get("images", []), 1):
        where = f'{f["id"]}: image {n}'
        if not isinstance(image, dict) or not image.get("src") or not image.get("alt"):
            raise ValueError(f"{where}: needs a src (from docs/) and an alt text")
        out.append((image, site_image(DOCS / image["src"], where)))
    return out


# The site reads the mod's files, never the reverse (docs/features/website.md, "Sources and outputs"): a category
# icon (catalogue "icon", a path from the repository root) is a site picture or one of the mod's own, shown
# without a copy. Pages serves the repository root, so the mod's folder is served next to docs/.
MOD_IMAGES = "src/mod/resource/img"
ICON_FOLDERS = ("docs/res", MOD_IMAGES)


def icon_file(icon: str) -> Path | None:
    """The file of a catalogue icon path, or None when it isn't an image file under one of ICON_FOLDERS."""
    path = (ROOT / icon).resolve()
    if (not any(path.is_relative_to((ROOT / folder).resolve()) for folder in ICON_FOLDERS)
            or path.suffix.lower() not in IMAGE_TYPES or not path.is_file()):
        return None
    return path


def category_icon(category: dict, prefix: str, size: int) -> str:
    """The category's picture (catalogue "icon"), decorative: its title follows."""
    if not category.get("icon"):
        return ""
    src = "../" + Path(category["icon"]).as_posix()
    src = src.removeprefix("../docs/")
    return (f'<img class="category-icon" src="{prefix}{esc(src)}" width="{size}" height="{size}" alt="">')


def category_list(prefix: str, wiki_prefix: str) -> str:
    """Home and wiki index: every category, its icon, its wiki page and feature count."""
    return '<ul class="category-list">' + "".join(
        f'<li>{category_icon(c, prefix, 24)}<a href="{wiki_prefix}{c["id"]}.html">{esc(c["title"])}</a> '
        f'<span class="muted">({len(c["features"])})</span></li>' for c in CATEGORIES) + '</ul>'


def own_sources(category: dict, f: dict) -> list[str]:
    """An entry's sources beyond its category's, which its page lists once under the intro."""
    return [p for p in dict.fromkeys(f.get("sources", [])) if p not in category["sources"]]


def sources_html(label: str, paths: list[str]) -> str:
    refs = " · ".join(f'<a href="{source_link(p)}">{esc(Path(p).name)}</a>' for p in paths)
    return f'<p class="sources">{label}: {refs}</p>' if paths else ""


def sources_md(label: str, paths: list[str]) -> list[str]:
    return [f"**{label}:** " + " · ".join(f'[{Path(p).name}]({source_link(p)})' for p in paths)] if paths else []


def setting_label(key: str) -> str:
    """A setting as the player sees it: its panel label, so the features search finds what the Settings tab shows.
    A hidden setting has no panel label: its description, without the trailing note on where its control is."""
    s = SETTINGS[key]
    label = s["settingDescription"]
    return re.sub(r" \([^()]*\)$", "", label) if s.get("hidden") else label


def feature_html(category: dict, feature: dict, *, compact: bool = False) -> str:
    f = feature
    settings = ""
    if f.get("settings"):
        # Labels can hold commas ("Search fields (Perks, GQ, Oct)"); the key stays the link's anchor and tooltip.
        settings = '<p class="setting-refs">Related settings: ' + " · ".join(
            f'<a href="{("wiki/" if compact else "")}settings.html#{esc(k)}" title="{esc(k)}">{esc(setting_label(k))}</a>'
            for k in f["settings"]
        ) + "</p>"
    # The features page is docs/features.html, a wiki page docs/wiki/<category>.html.
    prefix = "" if compact else "../"
    images = feature_images(f)
    figures = {side: "".join(figure_html(prefix, site, image["alt"], image.get("caption", ""))
                             for image, site in images if is_side_image(site) == side) for side in (True, False)}
    # A narrow screenshot first, floating right of the entry's text; a wide one after the details.
    body = (figures[True] + f'<p class="where"><strong>Where:</strong> {image_marks(esc(f["where"]))}</p>{ul(f["details"])}'
            + figures[False])
    if f.get("limits"):
        body += '<div class="limits"><strong>Availability &amp; limits</strong>' + ul(f["limits"]) + "</div>"
    body += settings + sources_html("Source", own_sources(category, f))
    thumb = ""
    if compact:
        body = f'<details><summary>How to use it &amp; limits</summary>{body}</details>'
        if images:
            thumb = thumbnail_html(prefix, images[0][1])
    return (f'<article class="feature" id="{esc(f["id"])}">{thumb}'
            f'<h3><a class="permalink" href="#{esc(f["id"])}">{esc(f["title"])}</a></h3>'
            f'<p>{esc(f["summary"])}</p>{body}</article>')


def thumbnail_html(prefix: str, image: tuple[str, int, int]) -> str:
    """The features page's miniature of an entry's first image, right of its title and summary. A click unfolds the
    entry's details, where the image is (guide.js); without JS it opens the image. Decorative: the image has its alt."""
    src, width, height = image
    scale = min(120 / width, 90 / height)
    href = esc(prefix + quote(src, safe="/@"))
    return (f'<a class="thumb" href="{href}" target="_blank" rel="noopener" tabindex="-1" aria-hidden="true">'
            f'<img src="{href}" width="{round(width * scale)}" height="{round(height * scale)}" alt="" loading="lazy" '
            f'decoding="async"></a>')


def page(path: str, title: str, tab: str, body: str, *, depth: int = 0,
         source: str = "docs/data/feature-catalogue.json",
         scripts: tuple[str, ...] = (),
         folding: bool = False,
         description: str = "Hypersynergism: current feature guide, installation and wiki for the Synergism quality-of-life mod.") -> None:
    """folding: the features page's categories stay hidden until guide.js has folded them, so the full list never
    shows for a frame first. guide.js lifts it when done, or the script tag's onerror or a timeout if it never runs."""
    prefix = "../" * depth
    tabs = [("home", "Home", "index.html", "orange"),
            ("features", "Features", "features.html", "green"),
            ("wiki", "Wiki", "wiki/index.html", "cyan"),
            ("changelog", "Changelog", "changelog.html", "plum"),
            ("github", "Github", "github.html", "lightskyblue"),
            ("about", "About", "about.html", "white")]
    nav = "".join(
        f'<a id="{key}-btn" href="{prefix}{href}" style="--tab-color:{color}"'
        + (' aria-current="page"' if key == tab else '') + f'>{label}</a>'
        for key, label, href, color in tabs
    )
    color = next(x[3] for x in tabs if x[0] == tab)
    # Each counter leads to what it counts; "All Channels" on the changelog is already there.
    counters = [("1", str(len(FEATURES)), " Features", "yellow", "features.html"),
                ("2", str(len(CATEGORIES)), " Categories", "orange", "wiki/index.html"),
                ("3", str(len(SETTINGS)), " Settings", "red", "wiki/settings.html"),
                ("4", "All" if tab == "changelog" else "Live", " Channels" if tab == "changelog" else " Channel", "magenta",
                 None if tab == "changelog" else "wiki/getting-started.html#channels"),
                ("5", "QoL", " + opt-in AutoSing", "mediumpurple", "wiki/autosing-guide.html")]
    counter_html = "".join(
        (f'<a href="{prefix}{href}">' if href else '<span>')
        + f'<img src="{prefix}res/{icon}.png" width="20" height="20" alt="">'
        f'<span class="unit0" style="color:{color}">{esc(value)}</span><span class="unit1">{esc(label)}</span>'
        + ('</a>' if href else '</span>')
        for icon, value, label, color, href in counters
    )
    extra_scripts = "".join(f'\n  <script src="{prefix}js/{esc(script)}" defer></script>' for script in scripts)
    unfold = "document.documentElement.classList.remove('folding')"
    folding_script = (f"\n  <script>document.documentElement.classList.add('folding'); setTimeout(() => {unfold}, 5000);</script>"
                      if folding else "")
    guide_onerror = f' onerror="{unfold}"' if folding else ""
    add(path, f'''<!DOCTYPE html>
<!-- Generated by scripts/tools/build-docs.py. Edit {source}. -->
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="{esc(description)}">
  <meta name="theme-color" content="#18171c">
  <title>{esc(title)} · Hypersynergism</title>
  <link rel="icon" href="{prefix}res/coin.png" type="image/png">
  <link rel="stylesheet" href="{prefix}css/original.css">
  <link rel="stylesheet" href="{prefix}css/guide.css">{folding_script}
  <script src="{prefix}js/guide.js" defer{guide_onerror}></script>{extra_scripts}
</head>
<body>
<a class="skip-link" href="#content">Skip to content</a>
<div id="wrapper">
  <header>
    <div id="first-row" aria-label="Guide overview">{counter_html}</div>
    <div id="second-row"><div id="second-row-left-container"><div class="second-row-subcontainer">
      <img class="res-icon" src="{prefix}res/coin.png" width="32" height="32" alt="">
      <div class="second-row-disp">Hypersynergism<br>Guide for <a class="version-link" href="{prefix}{version_entry_href()}"><span id="version_num">v{esc(VERSION)}</span></a></div>
    </div></div><p class="header-credit">A Synergism QoL mod<br><span>Maintained by Ferlieloi, maenhiir &amp; contributors</span></p></div>
    <nav aria-label="Main navigation"><div id="tabs">{nav}</div></nav>
  </header>
  <div id="border" style="background:{color}"></div>
  <main id="page-container"><div class="page-wrapper visible" id="content" tabindex="-1">
    {body}
    <footer>Hypersynergism · <a href="{REPO}">Source</a> · <a href="{prefix}about.html">Credits</a> · <a href="#content">Back to top</a></footer>
  </div></main>
</div>
</body>
</html>''')


def feature_md(category: dict, f: dict) -> str:
    """An entry in docs/FEATURES.md: images relative to docs/, settings linked to the website."""
    parts = [f'### {f["title"]}', f["summary"], f'**Where:** {f["where"]}',
             "\n".join(f"- {x}" for x in f["details"])]
    parts += [f'![{image["alt"]}]({quote(src, safe="/@")})' for image, (src, _, _) in feature_images(f)]
    if f.get("limits"):
        parts += ["**Availability and limits**", "\n".join(f"- {x}" for x in f["limits"])]
    if f.get("settings"):
        parts += ["**Related settings:** " + " · ".join(f'[{setting_label(k)}]({SITE}wiki/settings.html#{quote(k)})' for k in f["settings"])]
    parts += sources_md("Source", own_sources(category, f))
    return "\n\n".join(parts)


def category_description(category: dict, limit: int = 160) -> str:
    """A wiki page's meta description: the category and as many of its feature titles as fit."""
    text = f'Hypersynergism {category["title"]}: '
    titles = [f["title"] for f in category["features"]]
    for n, title in enumerate(titles):
        last = n == len(titles) - 1
        part = title + ("." if last else ", ")
        if len(text) + len(part) > limit:
            return text.rstrip(", ") + "…"
        text += part
    return text


def guide_title(cid: str) -> str:
    first = GUIDES[cid].split("\n", 1)[0]
    if not first.startswith("# "):
        raise ValueError(f"Guide {cid}.md: the first line must be its '# Title'")
    return first[2:].strip()


SETTING_MARK = "⚙"


def setting_by_label(text: str) -> str:
    """The setting a guide names as `**⚙ Label**`: its panel label as the Settings tab shows it, a trailing "(…)"
    optional ("Start/Stop Auto-Sing" for "Start/Stop Auto-Sing (S216+)"), case ignored. None or several: refused."""
    wanted = text.strip().casefold()
    keys = [k for k, s in SETTINGS.items() if not s.get("hidden") and wanted in {
        s["settingDescription"].casefold(), re.sub(r" \([^()]*\)$", "", s["settingDescription"]).casefold()}]
    if len(keys) != 1:
        raise ValueError(f'Guide setting "{SETTING_MARK} {text}": '
                         + ("no panel setting has this label" if not keys else f'several settings match ({", ".join(keys)})'))
    return keys[0]


def setting_ref(match: re.Match) -> str:
    """A setting named in a guide (`**⚙ Label**`, guides live in docs/wiki/): its own look, linking to its row."""
    label = html.unescape(match[1])
    key = setting_by_label(label)
    return (f'<a class="setting-ref" href="settings.html#{esc(key)}" title="Setting: {esc(key)}">'
            f'<span class="setting-gear" aria-hidden="true">{SETTING_MARK}</span><span class="setting-label">{esc(label.strip())}</span></a>')


def inline_md(text: str) -> str:
    out = []
    for part in re.split(r"(`[^`]+`)", text):
        if len(part) > 1 and part.startswith("`") and part.endswith("`"):
            out.append(f"<code>{esc(part[1:-1])}</code>")
            continue
        s = esc(part)
        s = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", r'<a href="\2">\1</a>', s)
        s = re.sub(rf"\*\*{SETTING_MARK}️?\s*(.+?)\*\*", setting_ref, s)
        # Image marks outside bold only: in bold, a circled character is the UI's own text
        s = "".join(p if p.startswith("**") else image_marks(p) for p in re.split(r"(\*\*.+?\*\*)", s))
        out.append(re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s))
    return "".join(out)


# GitHub's alert types ("> [!NOTE]" …), with the icon the site shows for each (16×16, drawn in the alert's colour).
_ICON_MARK = '<path d="M8 4.5v4.2" stroke-linecap="round"/><circle cx="8" cy="11.2" r=".9" fill="currentColor" stroke="none"/>'
CALLOUTS = {
    "NOTE": ("Note", '<circle cx="8" cy="8" r="6.5"/><path d="M8 7.2v4.3" stroke-linecap="round"/>'
                     '<circle cx="8" cy="4.8" r=".9" fill="currentColor" stroke="none"/>'),
    "TIP": ("Tip", '<path d="M8 1.5a4.5 4.5 0 0 0-2.7 8.1c.5.4.7.9.7 1.4v.5h4V11c0-.5.2-1 .7-1.4A4.5 4.5 0 0 0 8 1.5z"/>'
                   '<path d="M6.2 14.3h3.6" stroke-linecap="round"/>'),
    "IMPORTANT": ("Important", '<path d="M2 2.5h12v8.5H8.5l-3.5 3v-3H2z" stroke-linejoin="round"/>'
                               '<path d="M8 4.6v3.3" stroke-linecap="round"/><circle cx="8" cy="9.4" r=".8" fill="currentColor" stroke="none"/>'),
    "WARNING": ("Warning", '<path d="M8 1.8 15 14H1z" stroke-linejoin="round"/>' + _ICON_MARK),
    "CAUTION": ("Caution", '<path d="M5.2 1.5h5.6l3.7 3.7v5.6l-3.7 3.7H5.2l-3.7-3.7V5.2z" stroke-linejoin="round"/>' + _ICON_MARK),
}


def callout_open(kind: str) -> str:
    label, icon = CALLOUTS[kind]
    return (f'<div class="callout callout-{kind.lower()}" role="note"><p class="callout-title">'
            f'<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">{icon}</svg>'
            f'{label}</p>')


def guide_html(cid: str) -> str:
    """The guides' Markdown subset: # to #### headings, paragraphs, flat - and 1. lists, --- rules, **bold**, `code`, [links](url),
    and GitHub's alerts ("> [!NOTE]", TIP, IMPORTANT, WARNING, CAUTION, then "> " lines holding paragraphs and flat lists).
    Anything else is refused, so a guide never renders differently on the site and on GitHub."""
    out: list[str] = []
    para: list[str] = []
    kind = ""
    callout = False
    # After an image marked #past-headings, until the next image: headings flow beside it (guide.css, .beside-shot)
    beside_shot = False

    def end_para() -> None:
        if para:
            out.append(f"<p>{inline_md(' '.join(para))}</p>")
            para.clear()

    def end_list() -> None:
        nonlocal kind
        if kind:
            out.append(f"</{kind}>")
            kind = ""

    def text_line(line: str) -> None:
        """A list item or a paragraph line, in the page or in an alert."""
        nonlocal kind
        if "![" in line:
            raise ValueError(f'{where}: an image goes alone on its line, outside lists and alerts, with a description: ![description](path "optional caption")')
        item = re.match(r"(-|\d+\.) (.+)$", line)
        if item:
            end_para()
            new_kind = "ul" if item[1] == "-" else "ol"
            if kind != new_kind:
                end_list()
                out.append(f"<{new_kind}>")
                kind = new_kind
            out.append(f"<li>{inline_md(item[2])}</li>")
        else:
            end_list()
            para.append(line.strip())

    for n, line in enumerate(GUIDES[cid].split("\n"), 1):
        where = f"Guide {cid}.md:{n}"
        if callout:
            if line.startswith(">"):
                inner = line[2:] if line.startswith("> ") else line[1:]
                if not inner.strip():
                    end_para()
                    end_list()
                elif re.match(r"\s|[>|#]|[*+] |```|\d+\) |---", inner):
                    raise ValueError(f"{where}: inside an alert, only paragraphs and flat - or 1. lists")
                else:
                    text_line(inner)
                continue
            if line.strip():
                # Markdown would continue the alert's paragraph with this line.
                raise ValueError(f"{where}: an alert needs a blank line after it")
            end_para()
            end_list()
            out.append("</div>")
            callout = False
            continue
        alert = re.match(r"> \[!([A-Z]+)\]$", line)
        if alert:
            if alert[1] not in CALLOUTS:
                raise ValueError(f"{where}: unknown alert {alert[1]} (one of {', '.join(CALLOUTS)})")
            end_para()
            end_list()
            out.append(callout_open(alert[1]))
            callout = True
            continue
        # An image alone on its line; its path is relative to the guide, as GitHub reads it.
        # "#past-headings" after the path (GitHub ignores it): a floating image the headings after it flow beside,
        # down to the next image
        image = re.match(r'!\[([^\]]+)\]\(([^)\s"#]+)(#past-headings)?(?: "([^"]+)")?\)$', line)
        if image:
            end_para()
            end_list()
            site = site_image(DOCS / "data/guides" / image[2], where)
            if image[3] and not is_side_image(site):
                raise ValueError(f"{where}: #past-headings is for an image that floats ({SIDE_IMAGE_MAX_WIDTH} px wide or less as shown)")
            beside_shot = bool(image[3])
            out.append(figure_html("../", site, image[1], image[4] or ""))
            continue
        heading = re.match(r"(#{1,4}) (.+)$", line)
        if re.match(r"\s+\S|[>|]|[*+] |```|\d+\) |#{5}", line):
            raise ValueError(f"{where}: Markdown the generator doesn't support")
        if not line.strip():
            end_para()
            end_list()
        elif line == "---":
            if para:
                raise ValueError(f"{where}: --- needs a blank line above (else it underlines a heading)")
            end_list()
            out.append("<hr>")
        elif heading:
            end_para()
            end_list()
            level, text = len(heading[1]), heading[2].strip()
            beside = ' class="beside-shot"' if beside_shot else ""
            out.append(f'<h{level} id="{esc(slug(text))}"{beside}>{inline_md(text)}</h{level}>')
        else:
            text_line(line)
    end_para()
    end_list()
    if callout:
        out.append("</div>")
    return "\n".join(out)


def validate_guides() -> None:
    for cid in GUIDES:
        if cid not in {c["id"] for c in CATEGORIES}:
            raise ValueError(f"Guide {cid}.md: its name must be a category id")
        guide_title(cid)
        guide_html(cid)


def validate_catalogue() -> None:
    validate_guides()
    ids = [c["id"] for c in CATEGORIES] + [f["id"] for f in FEATURES]
    if len(ids) != len(set(ids)):
        raise ValueError("Duplicate category or feature ID")
    mapped = set()
    for c in CATEGORIES:
        for f in c["features"]:
            for required in ("id", "title", "summary", "where", "details"):
                if not f.get(required):
                    raise ValueError(f'{f.get("id")}: missing {required}')
            feature_images(f)
            for key in f.get("settings", []):
                if key not in SETTINGS:
                    raise ValueError(f'{f["id"]}: unknown setting {key}')
                mapped.add(key)
        if c.get("icon") and not icon_file(c["icon"]):
            raise ValueError(f'{c["id"]}: icon {c["icon"]} must be a {", ".join(IMAGE_TYPES)} file under '
                             + " or ".join(f"{folder}/" for folder in ICON_FOLDERS))
        for item in [c] + c["features"]:
            for p in item.get("sources", []):
                if not (ROOT / p).is_file():
                    raise ValueError(f"Missing source: {p}")
    if set(SETTINGS) != mapped:
        raise ValueError(f"Unmapped settings: {sorted(set(SETTINGS) - mapped)}")


def validate_changelog(data: object) -> list[dict]:
    """Validate player-facing history before interpolating any catalogue values into HTML."""
    if not isinstance(data, dict) or data.get("schema_version") != 1:
        raise ValueError("Changelog must be an object with schema_version 1")
    methodology = data.get("methodology")
    entries = data.get("entries")
    if not isinstance(methodology, list) or any(not isinstance(x, str) or not x.strip() for x in methodology):
        raise ValueError("Changelog methodology must be an array of nonempty strings")
    if not isinstance(entries, list):
        raise ValueError("Changelog entries must be an array")
    if data.get("display_policy", "all-records") not in {"all-records", "released-only"}:
        raise ValueError("Unknown changelog display_policy")
    ids: set[str] = set()
    change_types = {"added", "changed", "removed", "fixed"}
    channels = {"original", "live", "dev", "loader"}
    statuses = {"published", "tagged", "version-record"}
    profiles = data.get("contributor_profiles")
    if not isinstance(profiles, dict) or not profiles:
        raise ValueError("Changelog contributor_profiles must be a nonempty object")

    def nonempty(record: dict, key: str, where: str) -> str:
        value = record.get(key)
        if not isinstance(value, str) or not value.strip():
            raise ValueError(f"{where}: {key} must be a nonempty string")
        return value

    def github_url(value: object, where: str, *, optional: bool = False) -> str | None:
        if optional and value is None:
            return None
        if not isinstance(value, str):
            raise ValueError(f"{where}: URL must be a string" if not optional else f"{where}: release_url must be a URL or null")
        parsed = urlparse(value)
        if parsed.scheme != "https" or parsed.netloc != "github.com" or not parsed.path.startswith("/") or parsed.username or parsed.password:
            raise ValueError(f"{where}: only HTTPS github.com links are allowed")
        return value

    def validate_changes(changes: object, where: str) -> None:
        if not isinstance(changes, list):
            raise ValueError(f"{where}: changes must be an array")
        for change in changes:
            if not isinstance(change, dict) or change.get("type") not in change_types:
                raise ValueError(f"{where}: each change needs a valid type")
            nonempty(change, "text", where)
            evidence = change.get("evidence", [])
            if not isinstance(evidence, list) or any(not isinstance(item, str) or not item.strip() for item in evidence):
                raise ValueError(f"{where}: evidence must be an array of nonempty strings")

    for identifier, profile in profiles.items():
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]*", identifier) or not isinstance(profile, dict):
            raise ValueError("Invalid contributor profile")
        nonempty(profile, "name", "contributor profile")
        aliases = profile.get("aliases", [])
        if not isinstance(aliases, list) or any(not isinstance(name, str) or not name.strip() for name in aliases):
            raise ValueError("Contributor aliases must be an array of public names")
        github_url(profile.get("url"), "contributor profile", optional=True)
        identity_commits = profile.get("identity_commits")
        if not isinstance(identity_commits, list) or not identity_commits or any(
            not isinstance(sha, str) or not re.fullmatch(r"[0-9a-f]{40}", sha) for sha in identity_commits
        ):
            raise ValueError("Contributor identity_commits must contain verified commit hashes")
    entry_by_id = {entry["id"]: entry for entry in entries if isinstance(entry, dict) and isinstance(entry.get("id"), str)}
    aliases: set[str] = set()
    for i, entry in enumerate(entries):
        where = f"changelog entry {i + 1}"
        if not isinstance(entry, dict):
            raise ValueError(f"{where} must be an object")
        identifier = nonempty(entry, "id", where)
        if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]*", identifier) or identifier in ids:
            raise ValueError(f"{where}: invalid or duplicate id {identifier!r}")
        ids.add(identifier)
        old_ids = entry.get("aliases", [])
        if not isinstance(old_ids, list):
            raise ValueError(f"{where}: aliases must be an array")
        for old_id in old_ids:
            if not isinstance(old_id, str) or not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9._-]*", old_id) or old_id in entry_by_id or old_id in aliases:
                raise ValueError(f"{where}: invalid or duplicate alias")
            aliases.add(old_id)
        version = nonempty(entry, "version", where)
        if len(version) > 64 or not re.fullmatch(r"[0-9][0-9A-Za-z. -]*", version):
            raise ValueError(f"{where}: invalid version {version!r}")
        if entry.get("channel") not in channels:
            raise ValueError(f"{where}: unknown channel")
        repository = nonempty(entry, "repository", where)
        if not re.fullmatch(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+", repository):
            raise ValueError(f"{where}: invalid repository")
        for key in ("commit",):
            if not re.fullmatch(r"[0-9a-f]{40}", nonempty(entry, key, where)):
                raise ValueError(f"{where}: {key} must be a 40-character lowercase commit hash")
        previous = entry.get("previous_commit")
        if previous is not None and (not isinstance(previous, str) or not re.fullmatch(r"[0-9a-f]{40}", previous)):
            raise ValueError(f"{where}: previous_commit must be a 40-character lowercase hash or null")
        date = nonempty(entry, "date", where)
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", date):
            raise ValueError(f"{where}: date must use YYYY-MM-DD")
        try:
            date_type.fromisoformat(date)
        except ValueError as error:
            raise ValueError(f"{where}: invalid calendar date {date!r}") from error
        if entry.get("date_kind") not in {"published", "tag", "commit"}:
            raise ValueError(f"{where}: unknown date_kind")
        if entry.get("status") not in statuses:
            raise ValueError(f"{where}: unknown status")
        included = entry.get("included_version_records", [])
        if not isinstance(included, list) or any(not isinstance(identifier, str) for identifier in included) or len(included) != len(set(included)):
            raise ValueError(f"{where}: included_version_records must contain unique source record IDs")
        for identifier in included:
            source = entry_by_id.get(identifier)
            if source is None or source.get("status") != "version-record" or source.get("channel") != entry["channel"]:
                raise ValueError(f"{where}: included_version_records must reference source records in the same channel")
        contributors = entry.get("contributors")
        if not isinstance(contributors, list) or not contributors:
            raise ValueError(f"{where}: contributors must be a nonempty array")
        credited = set()
        for credit in contributors:
            if not isinstance(credit, dict) or credit.get("id") not in profiles or credit["id"] in credited:
                raise ValueError(f"{where}: unknown or duplicate contributor")
            credited.add(credit["id"])
            roles = credit.get("roles")
            if not isinstance(roles, list) or not roles or any(role not in {"changes", "release", "merge"} for role in roles) or len(roles) != len(set(roles)):
                raise ValueError(f"{where}: invalid contributor roles")
            commits = credit.get("commits")
            if not isinstance(commits, list) or not commits or any(not isinstance(sha, str) or not re.fullmatch(r"[0-9a-f]{40}", sha) for sha in commits):
                raise ValueError(f"{where}: contributor commits must contain evidence hashes")
        merges = entry.get("merges", [])
        if not isinstance(merges, list):
            raise ValueError(f"{where}: merges must be an array")
        if merges and (entry["status"] != "version-record" or data.get("display_policy") == "all-records"):
            if not any("merge" in credit["roles"] for credit in contributors):
                raise ValueError(f"{where}: catch-up needs credit for the merger")
            if any("release" in credit["roles"] for credit in contributors):
                raise ValueError(f"{where}: catch-up credits must cover changes or merging")
        for merge in merges:
            if not isinstance(merge, dict) or merge.get("direction") not in {"dev-to-live", "live-to-dev"}:
                raise ValueError(f"{where}: invalid merge direction")
            expected_channel = "live" if merge["direction"] == "dev-to-live" else "dev"
            if entry["channel"] != expected_channel:
                raise ValueError(f"{where}: merge direction does not match the version channel")
            source_ids = merge.get("from_entry_ids")
            if not isinstance(source_ids, list) or not source_ids or any(not isinstance(identifier, str) for identifier in source_ids) or len(source_ids) != len(set(source_ids)):
                raise ValueError(f"{where}: merge source versions must be a nonempty list of unique IDs")
            source_channel = "dev" if expected_channel == "live" else "live"
            for source_id in source_ids:
                source = entry_by_id.get(source_id)
                if source is None:
                    raise ValueError(f"{where}: merge links to an unknown version")
                if source.get("channel") != source_channel:
                    raise ValueError(f"{where}: merge links to a version outside the source channel")
            partial = merge.get("partial_entry_ids", [])
            if not isinstance(partial, list) or any(not isinstance(identifier, str) or identifier not in source_ids for identifier in partial) or len(partial) != len(set(partial)):
                raise ValueError(f"{where}: partial merge versions must be unique IDs from the source versions")
            validate_changes(merge.get("changes", []), f"{where} merge")
            nonempty(merge, "summary", where)
            if not re.fullmatch(r"[0-9a-f]{40}", nonempty(merge, "commit", where)):
                raise ValueError(f"{where}: invalid merge commit")
            evidence = merge.get("evidence")
            if not isinstance(evidence, list) or not evidence:
                raise ValueError(f"{where}: merge needs source evidence")
            for url in evidence:
                github_url(url, where)
        github_url(entry.get("release_url"), where, optional=True)
        sources = entry.get("sources")
        if not isinstance(sources, list):
            raise ValueError(f"{where}: sources must be an array")
        for source in sources:
            if not isinstance(source, dict):
                raise ValueError(f"{where}: each source must be an object")
            nonempty(source, "label", where)
            github_url(source.get("url"), where)
        validate_changes(entry.get("changes"), where)
        validate_changes(entry.get("earlier_changes", []), where)
        notes = entry.get("notes")
        if not isinstance(notes, list) or any(not isinstance(note, str) or not note.strip() for note in notes):
            raise ValueError(f"{where}: notes must be an array of nonempty strings")
    return entries


def displayed_changelog_entries(data: dict) -> list[dict]:
    history = validate_changelog(data)
    released_only = data.get("display_policy") == "released-only"
    return sorted((entry for entry in history if not released_only or entry["status"] in {"published", "tagged"}),
                  key=lambda entry: (entry["date"], entry["version"], entry["channel"]), reverse=True)


_VERSION_HREF: list[str] = []


def version_entry_href() -> str:
    """The header's version links to its changelog entry (Live's first), else to the changelog's top: a Dev build's
    version often has no entry yet."""
    if not _VERSION_HREF:
        raw = json.loads((DOCS / "data/changelog.json").read_text(encoding="utf-8"))
        entries = [e for e in displayed_changelog_entries(raw) if e["version"] == VERSION]
        entries.sort(key=lambda e: e["channel"] != "live")
        _VERSION_HREF.append(f'changelog.html#{entries[0]["id"]}' if entries else "changelog.html")
    return _VERSION_HREF[0]


def changelog_outputs() -> None:
    raw = json.loads((DOCS / "data/changelog.json").read_text(encoding="utf-8"))
    released_only = raw.get("display_policy") == "released-only"
    entries = displayed_changelog_entries(raw)
    by_id = {entry["id"]: entry for entry in raw["entries"]}
    displayed_ids = {entry["id"] for entry in entries}
    linked_ids = {source_id for entry in entries for merge in entry.get("merges", [])
                  for source_id in merge["from_entry_ids"]}
    profiles = raw["contributor_profiles"]
    labels = {"original": "Original", "live": "Live", "dev": "Dev version", "loader": "Loader"}
    change_labels = {"added": "Added", "changed": "Changed", "removed": "Removed", "fixed": "Fixed"}
    cards = []
    for entry in entries:
        version = esc(entry["version"])
        release = entry.get("release_url")
        version_title = f'<a href="{esc(release)}">v{version}</a>' if release else f'v{version}'
        status_label = ""
        if entry["status"] == "version-record":
            built = any(source["label"].startswith("Build containing ") for source in entry["sources"])
            status_label = " · Historical build" if built else " · Source version"
        date_label = esc(entry["date"])
        credits = []
        contributor_names = []
        for credit in entry["contributors"]:
            profile = profiles[credit["id"]]
            name = esc(profile["name"])
            contributor_names.extend([profile["name"], *profile.get("aliases", [])])
            label = f'<a href="{esc(profile["url"])}">{name}</a>' if profile.get("url") else name
            if credit["roles"] == ["release"]:
                label += ' <span class="muted">(version record)</span>' if entry["status"] == "version-record" else ' <span class="muted">(release)</span>'
            if "merge" in credit["roles"]:
                label += ' <span class="muted">(merged)</span>'
            credits.append(label)
        contributor_html = '<p class="changelog-contributors">Contributors: ' + ", ".join(credits) + '</p>'
        merge_html = []
        incoming_search = []
        merges = entry.get("merges", [])
        for merge in merges:
            from_dev = merge["direction"] == "dev-to-live"
            direction = "Dev → Live" if from_dev else "Live → Dev"
            source_ids = merge["from_entry_ids"]
            partial_ids = set(merge.get("partial_entry_ids", []))
            versions = []
            for source_id in source_ids:
                source = by_id[source_id]
                label = f'v{esc(source["version"])}'
                suffix = " (partial)" if source_id in partial_ids else ""
                versions.append(f'<a href="#{esc(source_id)}">{label}</a>{suffix}')
                incoming_search.append(source["version"])
                if source_id not in partial_ids and source_id in displayed_ids:
                    incoming_search.extend(change["text"] for change in source["changes"])
            links = ", ".join(versions)
            merge_html.append(f'<div class="changelog-merge merge-{esc(merge["direction"])}"><span class="merge-direction">{direction}</span> <span>Includes changes from {links}</span></div>')
        grouped = []
        change_heading = "h4" if merges else "h3"
        for kind in ("added", "changed", "removed", "fixed"):
            changes = [c for c in entry["changes"] if c["type"] == kind]
            if changes:
                grouped.append(f'<{change_heading}>{change_labels[kind]}</{change_heading}>' + ul([c["text"] for c in changes]))
        change_body = "".join(grouped)
        if merges and grouped:
            channel = "Live" if entry["channel"] == "live" else "Dev"
            change_body = f'<h3>Changes from {channel}</h3>' + change_body
        elif not merges and not grouped:
            change_body = '<p class="changelog-empty">No user-facing changes are recorded for this version.</p>'
        earlier_changes = [change["text"] for change in entry.get("earlier_changes", [])]
        if earlier_changes and not merges:
            change_body += '<details class="changelog-sources"><summary>Earlier changes recorded with this release</summary>' + ul(earlier_changes) + '</details>'
        notes = "".join(f'<li>{esc(note)}</li>' for note in entry["notes"])
        if notes:
            change_body += '<h3>Notes</h3><ul>' + notes + '</ul>'
        source_links = " · ".join(f'<a href="{esc(s["url"])}">{esc(s["label"])}</a>' for s in entry["sources"])
        source_details = f'<details class="changelog-sources"><summary>Sources</summary><p>{source_links}</p></details>' if source_links else ""
        search_text = " ".join([entry["version"], *contributor_names, *(c["text"] for c in entry["changes"]), *entry["notes"], *incoming_search])
        alias_html = "".join(f'<span id="{esc(alias)}"></span>' for alias in entry.get("aliases", []))
        cards.append(f'''<article class="changelog-entry" id="{esc(entry["id"])}" data-channel="{esc(entry["channel"])}" data-search="{esc(search_text.casefold())}">{alias_html}
<h2>{version_title} <span class="channel-badge channel-{esc(entry["channel"])}">{labels[entry["channel"]]}</span></h2>
<p class="changelog-meta"><time datetime="{esc(entry["date"])}">{date_label}</time>{esc(status_label)}</p>
{contributor_html}{''.join(merge_html)}{change_body}{source_details}</article>''')
    source_cards = []
    for source_id in sorted(linked_ids - displayed_ids, key=lambda id: (by_id[id]["date"], id), reverse=True):
        source = by_id[source_id]
        version = esc(source["version"])
        notes = [change["text"] for change in source["changes"]]
        source_url = source["sources"][0]["url"] if source["sources"] else f'https://github.com/{source["repository"]}/commit/{source["commit"]}'
        source_cards.append(f'<article class="changelog-source-version" id="{esc(source_id)}"><h3>v{version} · {labels[source["channel"]]}</h3>'
                            f'{ul(notes) if notes else ""}<p><a href="{esc(source_url)}">Source history</a></p></article>')
    source_section = '<section class="changelog-source-versions"><h2>Source versions linked from catch-ups</h2>' + "".join(source_cards) + "</section>" if source_cards else ""
    scope_note = "The release list shows published releases and tagged builds. Links can also open historical source versions. Dates use UTC." if released_only else "Historical builds have a surviving bundle. Source versions are recorded in Git. Dates use UTC."
    body = f'''<h1>Changelog</h1>
<p>{'Released builds' if released_only else 'Recorded versions'} across the original, Live, Dev and loader channels, newest first.</p>
<p class="muted">Dev versions come from <a href="https://github.com/maenhiir/synergism-hypersynergy">maenhiir’s repository</a>. Merge notices link to the source versions brought into each release.</p>
<p class="muted">{esc(scope_note)}</p>
<details class="changelog-sources"><summary>About this history</summary><p>Dates use UTC. When a publication date is unavailable, the preserved tag or its build commit supplies the date. Source links accompany each entry.</p><p>Catch-up releases credit the people who made new changes on the receiving branch and the people who merged them. Incoming work is credited on its source release.</p></details>
<form class="changelog-controls" role="search" onsubmit="return false">
<label for="changelog-channel">Channel <select id="changelog-channel"><option value="">All versions</option><option value="original">Original</option><option value="live">Live (Ferlieloi)</option><option value="dev">Dev versions (maenhiir)</option><option value="loader">Windows loader</option></select></label>
<label for="changelog-search">Search versions and changes <input id="changelog-search" type="search" autocomplete="off" placeholder="Version or change"></label>
<button type="button" id="changelog-clear">Clear</button></form>
<p id="changelog-count" class="muted" role="status" aria-live="polite">{len(entries)} {'released builds' if released_only else 'versions'}</p>
<p id="changelog-no-results" hidden>No matching versions. Clear the search or choose another channel.</p>
<noscript><p>All version entries are available below. Enable JavaScript to filter them.</p></noscript>
<div id="changelog-list" data-kind="{'released builds' if released_only else 'versions'}">{"".join(cards)}</div>{source_section}'''
    page("docs/changelog.html", "Changelog", "changelog", body, source="docs/data/changelog.json",
         scripts=("changelog.js",),
         description="Hypersynergism release notes for every version: original, Live, Dev and Windows loader, newest first.")


def settings_outputs() -> None:
    html_rows = []
    by_setting = {k: (c, f) for c in CATEGORIES for f in c["features"] for k in f.get("settings", [])}
    for key, s in SETTINGS.items():
        c, f = by_setting[key]
        default = json.dumps(s.get("settingValue", s.get("enabled")), ensure_ascii=False)
        state = "Hidden / inline or internal" if s.get("hidden") else "Panel control"
        page_id = s.get("settingControl", {}).get("controlPage", "")
        page_name = CONTROL_PAGES.get(page_id, {}).get("pageName", page_id)
        # Explanatory text comes from the reviewed catalogue: settingHelpText can lag the implementation.
        html_rows.append(f'<tr id="{esc(key)}"><th scope="row"><code>{esc(key)}</code><br>{esc(s["settingDescription"])}</th>'
                         f'<td data-label="Initial value">{esc(default)}</td><td data-label="Control">{esc(state)}<br><span class="control-page">{esc(page_name)}</span></td>'
                         f'<td data-label="Feature"><a href="{c["id"]}.html#{f["id"]}">{esc(f["title"])}</a></td></tr>')
    page("docs/wiki/settings.html", "Settings reference", "wiki",
         '<p class="breadcrumb"><a href="index.html">Wiki</a> / Settings</p><h1>Settings reference</h1>'
         f'<p>All {len(SETTINGS)} source-defined settings, including saved header preferences and internal state. Hidden settings often have controls in the header editor or a tool window; others are implementation state.</p>'
         '<p>Defaults below are initial source values. Existing saved preferences, migrations and dependency checks can differ. Use the linked guide for current behavior.</p>'
         '<div class="table-scroll"><table class="settings-table"><caption>Settings and their feature guides</caption><thead><tr><th>Setting</th><th>Initial value</th><th>Control type / page</th><th>Feature</th></tr></thead><tbody>'
         + "".join(html_rows) + '</tbody></table></div>', depth=1,
         description="Every Hypersynergism setting: what it does, its initial value, where it is set and the feature it belongs to.")


def calculation_outputs() -> None:
    path = "src/mod/class/hs-core/gds/hs-calculation-definition.ts"
    text = (ROOT / path).read_text(encoding="utf-8")
    entries = []
    for block in re.split(r"(?=calculationName:)", text)[1:]:
        name = re.match(r'calculationName:\s*"([^"]+)"', block)
        fn = re.search(r'fnName:\s*"([^"]+)"', block)
        if name and fn and re.search(r"toolingSupport:\s*true", block):
            entries.append((name[1], fn[1], bool(re.search(r"supportsReduce:\s*true", block))))
    if not entries:
        raise ValueError("Calculation extraction failed")
    entries.sort()
    rows = []
    for name, fn, reduce in entries:
        rows.append(f'<tr><th scope="row">{esc(name)}</th><td><code>{esc(fn)}</code></td><td>{"Yes" if reduce else "No"}</td></tr>')
    page("docs/wiki/calculations.html", "Calculation reference", "wiki",
         '<p class="breadcrumb"><a href="index.html">Wiki</a> / Calculations</p><h1>Calculation reference</h1>'
         f'<p>{len(entries)} entries registered for the Tools calculation picker. Options are provided in-game. Reduction support does not guarantee a full named component breakdown for every entry.</p>'
         '<div class="table-scroll"><table><caption>Registered calculations</caption><thead><tr><th>Calculation</th><th>Function</th><th>Reduction support</th></tr></thead><tbody>'
         + "".join(rows) + '</tbody></table></div>', depth=1,
         description="Every calculation in the Hypersynergism Tools tab's calculation picker.")


def guide_link(c: dict, href: str) -> str:
    if c["id"] not in GUIDES:
        return ""
    return f'<p class="guide-link">Step by step: <a href="{href}">{esc(guide_title(c["id"]))}</a>.</p>'


def guide_link_md(c: dict, target: str) -> list[str]:
    return [f"Step by step: [{guide_title(c['id'])}]({target})."] if c["id"] in GUIDES else []


def guide_outputs() -> None:
    for cid in GUIDES:
        c = next(x for x in CATEGORIES if x["id"] == cid)
        page(f"docs/wiki/{cid}-guide.html", guide_title(cid), "wiki",
             f'<p class="breadcrumb"><a href="index.html">Wiki</a> / <a href="{cid}.html">{esc(c["title"])}</a> / Guide</p>'
             + guide_html(cid), depth=1, source=f"docs/data/guides/{cid}.md",
             description=f"{guide_title(cid)}: a players' guide for Hypersynergism, the Synergism quality-of-life mod.")


def build() -> None:
    validate_catalogue()
    feature_count = len(FEATURES)
    intro = (f'<p>A quality-of-life mod for <a href="https://synergism.cc/">Synergism</a>, '
             f'with information, shortcuts, interface customization and optional automation.</p>')
    home =f'''<h1>Hypersynergism</h1>{intro}
<h2>Quick links</h2><ul>
<li><a href="features.html">All {feature_count} documented features</a></li>
<li><a href="wiki/index.html">Player wiki &amp; detailed guides</a></li>
<li><a href="wiki/getting-started-guide.html">Install in a browser or on Steam</a></li>
<li><a href="{REPO}/releases">Downloads &amp; releases</a></li>
<li><a href="#help">Help &amp; bug reports</a></li></ul>
<h2>About the mod</h2><p>Hypersynergism adds information and practical controls to the game: Ambrosia optimization, forge and shop distribution, header editing, remembered interface preferences, save tools and more.</p>
<p>Most features are optional. AutoSing is separately enabled and automates progression; it goes beyond the original mod's strictly QoL scope.</p>
<h2>Explore the features</h2>{category_list("", "wiki/")}
<h2>New to Hypersynergism?</h2><ol>
<li>Follow the <a href="wiki/getting-started-guide.html">installation guide</a>.</li>
<li>Open the mod's icon, at the top left of the game, to explore settings and Tools.</li>
<li>Use the pencil beside the icon for header customization; new mod modules start in the game's Hidden tray.</li>
<li>Make a backup in Tools before experimenting with strategies or imports.</li></ol>
<h2 id="help">Help &amp; bug reports</h2><ul>
<li><strong>Ask on Discord:</strong> the <a href="{DISCORD_THREAD}">HyperSynergism thread</a> on the game's Discord server (the link opens once you've <a href="{DISCORD_INVITE}">joined the server</a>).</li>
<li><strong>Report a bug on GitHub:</strong> the <a href="{REPO}/issues">issues page</a>.</li>
<li><strong>With a bug, send:</strong> what you did and what happened, the mod's version (in the mod panel's title), and a backup file: Tools → Backup &amp; Restore → Export to file. It holds your save, the mod's settings and its logs: share it only where you ask for help.</li>
<li><strong>First things to try:</strong> reload the game; on Steam, Patch &amp; launch again in the loader. The mod doesn't load at all: the <a href="wiki/getting-started-guide.html#if-it-doesnt-load">installation guide</a>. Last resort, Tools → CLEAR SETTINGS puts every mod setting back to its default: export a backup first.</li></ul>
<h2>Original project</h2><p>Created by <a href="https://github.com/ahvonenj/synergism-hypersynergy">ahvonenj</a>. This guide documents the maintained Ferlieloi fork. It follows the original website's game-inspired style.</p>'''
    page("docs/index.html", "Home", "home", home)
    # Support Pages configured at either repository root or /docs without moving the source.
    add("index.html", '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="refresh" content="0;url=docs/">
  <title>Hypersynergism</title>
  <style>body { background: #18171c; color: ghostwhite; font: 16px sans-serif; margin: 3rem; } a { color: #82baff; }</style>
</head>
<body><p><a href="docs/">Open the Hypersynergism website</a></p></body>
</html>''')
    add(".nojekyll", "")

    search = '''<form class="feature-controls" role="search" onsubmit="return false">
<label for="feature-search">Find a feature <input id="feature-search" type="search" placeholder="Try hidden tabs, header, GQ, export…" autocomplete="off"></label>
<label for="feature-category">Category <select id="feature-category"><option value="">All categories</option>''' + "".join(
        f'<option value="{c["id"]}">{esc(c["title"])}</option>' for c in CATEGORIES) + '''</select></label>
<button type="button" id="search-reset">Reset</button></form>
<p id="feature-results" class="muted" role="status" aria-live="polite"></p>
<p id="no-results" hidden>No matching features. Try a shorter search or choose another category.</p>'''
    sections = "".join(
        f'<section class="feature-category" data-category="{c["id"]}" aria-labelledby="heading-{c["id"]}">'
        f'<h2 id="heading-{c["id"]}" style="--category-color:{c["color"]}">{category_icon(c, "", 24)}{esc(c["title"])}</h2>'
        f'<p>{esc(c["intro"])}</p>' + guide_link(c, f'wiki/{c["id"]}-guide.html')
        + "".join(feature_html(c, f, compact=True) for f in c["features"]) + '</section>'
        for c in CATEGORIES)
    page("docs/features.html", "All features", "features",
         f'<h1>Mod features</h1><p>{feature_count} features across {len(CATEGORIES)} categories. Search includes descriptions, usage and limits. Open a category to see its features, and an entry for its details.</p>'
         '<noscript><p>Search needs JavaScript; all features and their details remain available below.</p></noscript>' + search + sections,
         folding=True, description=f"All {feature_count} Hypersynergism features, searchable: what each does, where to find it and its limits.")

    wiki_intro = f'<h1>Hypersynergism wiki</h1><p>Player guides for the maintained mod: what each feature does, where to find it, and its availability and limits.</p>'
    guides_html = ('<h2>Guides</h2><ul>' + "".join(
        f'<li><a href="{cid}-guide.html">{esc(guide_title(cid))}</a></li>' for cid in GUIDES) + '</ul>') if GUIDES else ""
    page("docs/wiki/index.html", "Wiki", "wiki", wiki_intro + category_list("../", "") + guides_html
         + '<h2>Reference</h2><ul><li><a href="settings.html">Every setting and saved preference</a></li>'
         '<li><a href="calculations.html">Calculation picker reference</a></li>'
         '<li><a href="../FEATURES.md">Download the complete feature inventory (Markdown)</a></li></ul>'
         f'<h2>Help</h2><p>Questions, bug reports and what to send with them: <a href="../index.html#help">Help &amp; bug reports</a>, on the home page.</p>'
         f'<p><a href="{DISCORD_THREAD}">Discord thread</a> · <a href="{REPO}/issues">Report an issue</a> · <a href="{REPO}/blob/master/docs/README.md">Developer documentation</a></p>', depth=1,
         description="Hypersynergism wiki: a page per feature category, players' guides, and the settings and calculation references.")
    inventory = ["# Hypersynergism feature inventory", "Generated from the reviewed feature catalogue. Every feature includes its location, usage, limits and source references."]
    for c in CATEGORIES:
        inventory += [f'## {c["title"]}', c["intro"]] + sources_md("Sources for this category", c["sources"]) + guide_link_md(c, f'{SITE}wiki/{c["id"]}-guide.html') + [
            feature_md(c, f) for f in c["features"]]
        toc = '<ul class="wiki-toc">' + "".join(f'<li><a href="#{f["id"]}">{esc(f["title"])}</a></li>' for f in c["features"]) + '</ul>'
        page(f'docs/wiki/{c["id"]}.html', c["title"], "wiki",
             f'<p class="breadcrumb"><a href="index.html">Wiki</a> / {esc(c["title"])}</p>'
             f'<h1>{category_icon(c, "../", 32)}{esc(c["title"])}</h1><p>{esc(c["intro"])}</p>{sources_html("Sources for this category", c["sources"])}'
             f'{guide_link(c, c["id"] + "-guide.html")}{toc}'
             + "".join(feature_html(c, f) for f in c["features"]), depth=1, description=category_description(c))
    add("docs/FEATURES.md", "\n\n".join(inventory))
    settings_outputs()
    calculation_outputs()
    guide_outputs()

    changelog_outputs()
    page("docs/github.html", "Github", "github", f'''<h1>Github</h1>
<p>Source, downloads, issues and the original project.</p>
<a href="{REPO}" aria-label="Open the maintained repository"><img src="res/github.png" id="github-logo" width="180" height="67" alt="GitHub"></a>
<ul><li><a href="{REPO}">Maintained Live repository</a></li><li><a href="{REPO}/releases">Releases &amp; Windows loader</a></li><li><a href="{REPO}/issues">Bug reports &amp; requests</a></li><li><a href="https://github.com/maenhiir/synergism-hypersynergy">Dev channel</a></li><li><a href="https://github.com/ahvonenj/synergism-hypersynergy">Original repository</a></li><li><a href="https://github.com/Pseudo-Corp/SynergismOfficial">Synergism game source</a></li></ul>''',
         description="Hypersynergism on GitHub: source, releases, the Windows loader and bug reports.")
    page("docs/about.html", "About", "about", '''<h1>About Hypersynergism</h1>
<p>A community mod for <a href="https://synergism.cc/">Synergism</a>. Originally created by <a href="https://github.com/ahvonenj">ahvonenj</a>, now maintained by <a href="https://github.com/Ferlieloi">Ferlieloi</a> (XxmolkxX), <a href="https://github.com/maenhiir">maenhiir</a> (Shewchou) and contributors.</p>
<h2>The original style</h2><p>This guide adapts the <a href="https://ahvonenj.github.io/synergism-hypersynergy/">original Hypersynergism website</a>: the dark background, resource icons, compact colored tabs and straightforward text layout.</p>
<p>The original website CSS is retained with responsive and accessibility additions. The game-inspired images come from the original site's resources and from the game's repository (MIT license, © Platonic and Khafra); Synergism artwork belongs to its respective creators. Neither the mod nor this guide is an official game website.</p>
<h2>Privacy</h2><p>This documentation site uses no analytics, cookies, account system or game-save uploads. Search runs in your browser. Following external links uses those services.</p>
<h2>License &amp; acknowledgements</h2><p>The repository's <a href="https://github.com/Ferlieloi/synergism-hypersynergy/blob/master/LICENSE">MIT license</a> and upstream credits are retained. Documentation describes the audited source; availability can vary with progression, platform and game patches.</p>''',
         description="Who makes Hypersynergism, where the website's style comes from, privacy and license.")
    add("docs/.nojekyll", "")
    source_rows = ["# Feature audit and maintenance", "The reviewed catalogue is `docs/data/feature-catalogue.json`. Website pages and `docs/FEATURES.md` are generated; edit the catalogue, then run `python scripts/tools/build-docs.py`.",
                   f"Audit source: [{CATALOGUE['audited_commit']}]({REPO}/commit/{CATALOGUE['audited_commit']}). The generator reads the package version, settings registry and calculation registry from the checkout. When re-auditing, update the audit commit only after reviewing behavior changes.",
                   "## Coverage", f"- {feature_count} feature entries in {len(CATEGORIES)} categories.\n- All {len(SETTINGS)} settings are associated with a feature, including hidden settings.\n- Shared framework modules and development-only tools are identified separately.\n- Source and developer-document references are checked to exist.",
                   "| Category | Features | Primary evidence |", "| --- | --- | --- |"]
    for c in CATEGORIES:
        source_rows.append(f'| {c["title"]} | {len(c["features"])} | ' + " · ".join(f'[{Path(p).name}]({source_link(p)})' for p in c["sources"]) + ' |')
    source_rows += ["\n## Reviewed distinctions", "- GQ and Octeract hide-maxed buttons are native; the mod persists their selections.\n- Native header modules/layout editing are enhanced by the mod; they were not invented by it.\n- The old eight-corruption loadouts, corruption reference-sheet assumptions and separate mod Ambrosia quickbar are not current features.\n- Incomplete legacy cube/ascension tools were removed; the calculation registry is used for the current reference.\n- Developer live editing and save snapshots are excluded from player releases. AutoSing's step timings recorder is a player feature (Record step timings); the old CSV collection is gone.\n- Retired settings or comments are not evidence of a currently exposed player feature.",
                    "## Verification limits", "This was a source audit, not a complete playthrough on all progression levels or platforms. Existing developer docs were preserved. No game behavior or release bundle was changed.",
                    "The catalogue was re-audited at the audit source above: each entry against its developer docs and the commits since the first audit (43cf692e), and against the code where those didn't settle a claim."]
    # Keep consecutive Markdown table rows adjacent, with blank lines between prose blocks.
    audit = "\n\n".join(source_rows)
    audit = re.sub(r"(?<=\|)\n\n(?=\|)", "\n", audit)
    add("docs/FEATURE-AUDIT.md", audit)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Verify generated files are current without writing")
    parser.add_argument("--validate", action="store_true", help="Validate the catalogue against the checkout and the changelog, without generating anything")
    parser.add_argument("--changelog-only", action="store_true", help="Generate or check only docs/changelog.html")
    parser.add_argument("--out", metavar="DIR", type=Path,
                        help="Write the site to DIR instead of the checkout, with the hand-written css/, js/ and res/ "
                             "copied next to it (open DIR/docs/index.html): a preview that leaves docs/ untouched")
    args = parser.parse_args()
    if args.validate and args.changelog_only:
        parser.error("--validate and --changelog-only cannot be combined")
    if args.out and (args.check or args.validate):
        parser.error("--out only writes: it cannot be combined with --check or --validate")
    out = args.out.resolve() if args.out else ROOT
    if args.out and out == ROOT:
        parser.error("--out must be another folder than the checkout (omit it to write the checkout)")
    if args.validate:
        validate_catalogue()
        validate_changelog(json.loads((DOCS / "data/changelog.json").read_text(encoding="utf-8")))
        print(f"Catalogue valid: {len(FEATURES)} features, {len(CATEGORIES)} categories, {len(SETTINGS)} settings. Changelog valid.")
        return
    if args.changelog_only:
        validate_catalogue()
        OUTPUTS.clear()
        changelog_outputs()
    else:
        build()
    stale = []
    for name, content in OUTPUTS.items():
        p = out / name
        if args.check:
            if not p.is_file() or p.read_text(encoding="utf-8") != content:
                stale.append(name)
        else:
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(content, encoding="utf-8", newline="\n")
    if stale:
        raise SystemExit("Generated documentation is stale:\n" + "\n".join(stale))
    if args.out:
        # The pages' hand-written assets, served as they are (docs/features/website.md, "Sources and outputs").
        for assets in ("css", "js", "res"):
            shutil.copytree(DOCS / assets, out / "docs" / assets, dirs_exist_ok=True)
        shutil.copytree(ROOT / MOD_IMAGES, out / MOD_IMAGES, dirs_exist_ok=True)
    print(f"{'Checked' if args.check else 'Built'} {len(OUTPUTS)} files: {len(FEATURES)} features, {len(CATEGORIES)} categories, {len(SETTINGS)} settings."
          + (f" Open {out / 'docs' / 'index.html'}" if args.out else ""))


if __name__ == "__main__":
    main()
