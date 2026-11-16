"""The website generator's logic (scripts/tools/build-docs.py): data in, data out, no page layout.
Run: python scripts/tests/test-build-docs.py"""
import importlib.util
import sys
import tempfile
import unittest
from pathlib import Path
from unittest import mock

sys.dont_write_bytecode = True
ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('build_docs', ROOT / 'scripts/tools/build-docs.py')
B = importlib.util.module_from_spec(spec)
spec.loader.exec_module(B)


def riff(chunk: bytes, payload: bytes) -> bytes:
    return b'RIFF' + (0).to_bytes(4, 'little') + b'WEBP' + chunk + (0).to_bytes(4, 'little') + payload + bytes(16)


class ImageSizeTests(unittest.TestCase):
    def size(self, data: bytes):
        with tempfile.TemporaryDirectory() as folder:
            path = Path(folder) / 'image'
            path.write_bytes(data)
            return B.image_size(path)

    def test_reads_each_format_header(self):
        png = b'\x89PNG\r\n\x1a\n' + b'\x00\x00\x00\x0dIHDR' + (1234).to_bytes(4, 'big') + (567).to_bytes(4, 'big') + bytes(8)
        self.assertEqual(self.size(png), (1234, 567))
        gif = b'GIF89a' + (300).to_bytes(2, 'little') + (20).to_bytes(2, 'little') + bytes(20)
        self.assertEqual(self.size(gif), (300, 20))
        # Lossy: the two top bits of each 16-bit size are a scale, not part of it
        vp8 = riff(b'VP8 ', bytes(3) + b'\x9d\x01\x2a' + (900 | 0x4000).to_bytes(2, 'little') + (450 | 0x8000).to_bytes(2, 'little'))
        self.assertEqual(self.size(vp8), (900, 450))
        vp8l = riff(b'VP8L', b'\x2f' + ((1200 - 1) | (800 - 1) << 14).to_bytes(4, 'little'))
        self.assertEqual(self.size(vp8l), (1200, 800))
        vp8x = riff(b'VP8X', bytes(4) + (2560 - 1).to_bytes(3, 'little') + (1440 - 1).to_bytes(3, 'little'))
        self.assertEqual(self.size(vp8x), (2560, 1440))

    def test_refuses_another_format(self):
        with self.assertRaises(ValueError):
            self.size(b'\xff\xd8\xff\xe0' + bytes(28))

    def test_density_suffix_divides_the_shown_size(self):
        shots = sorted((ROOT / 'docs/res').rglob('*@2x.*'))
        if not shots:
            self.skipTest('no @2x image in docs/res')
        _, width, height = B.site_image(shots[0], 'test')
        real_width, real_height = B.image_size(shots[0])
        self.assertEqual((width, height), (round(real_width / 2), round(real_height / 2)))


class SlugTests(unittest.TestCase):
    def test_heading_ids_follow_github(self):
        for title, expected in [("If it doesn't load", 'if-it-doesnt-load'),
                                ('Live and Dev channels', 'live-and-dev-channels'),
                                ('Step 1: Install (Tampermonkey)', 'step-1-install-tampermonkey'),
                                ('Inputs & results', 'inputs--results'),
                                ('Auto-Sing', 'auto-sing'),
                                ('⚙ Settings', '-settings'),
                                ('Café snake_case', 'café-snake_case')]:
            self.assertEqual(B.slug(title), expected, title)


class GuideMarkdownTests(unittest.TestCase):
    def render(self, text: str) -> str:
        with mock.patch.dict(B.GUIDES, {'t': text}):
            return B.guide_html('t')

    def refuses(self, text: str, message: str) -> None:
        with self.assertRaisesRegex(ValueError, message, msg=text):
            self.render(text)

    def test_renders_the_subset(self):
        out = self.render('# T\n\nPara **b** `c*d` and snake_case_name.\n\n- a\n- b\n\n1. x\n2. y\n\n---\n\n'
                          '> [!NOTE]\n> Hi\n> - item\n\n## Sub part\n\nSee [sub](#sub-part) or [it](https://example.org/x).')
        for fragment in ['<h1 id="t">T</h1>', '<strong>b</strong>', '<code>c*d</code>', '<ul>', '<li>a</li>', '<ol>',
                         '<li>y</li>', '<hr>', 'callout-note', '<h2 id="sub-part">', '<a href="#sub-part">sub</a>',
                         '<a href="https://example.org/x">it</a>']:
            self.assertIn(fragment, out)

    def test_site_links_become_relative_and_are_checked(self):
        key = next(iter(B.SETTINGS))
        category = B.CATEGORIES[0]
        out = self.render(f'[s]({B.SITE}wiki/settings.html#{key}) [f]({B.SITE}features.html) '
                          f'[c]({B.SITE}wiki/{category["id"]}.html#{category["features"][0]["id"]})')
        self.assertIn(f'href="settings.html#{key}"', out)
        self.assertIn('href="../features.html"', out)
        self.assertIn(f'href="{category["id"]}.html#{category["features"][0]["id"]}"', out)
        self.refuses(f'[s]({B.SITE}wiki/settings.html#no-such-setting)', 'has no #no-such-setting')
        self.refuses(f'[h]({B.SITE}index.html)', "isn't one")
        self.refuses('[a](#nowhere)', 'no heading #nowhere')

    def test_refuses_what_github_renders_differently(self):
        for text, message in [('An *italic* word', r'single \*'),
                              ('An _italic_ word', 'italics'),
                              ('A <b>tag</b>', 'raw HTML'),
                              ('A <https://example.org> autolink', 'raw HTML'),
                              (r'An \* escape', 'backslash escape'),
                              ('A ~~struck~~ word', 'strikethrough'),
                              ('See https://example.org', 'bare address'),
                              ('[a](https://example.org "title")', 'link title'),
                              ('[a][1]', 'reference link'),
                              ('[1]: https://example.org', 'reference link'),
                              ('- a\ncontinued', 'continues that item'),
                              ('> [!NOTE]\n> - a\n> continued', 'continues that item'),
                              ('Para\n\n3. step', 'starts at 1'),
                              ('Para\n2. step', 'starts at 1'),
                              ('Para\n![a](x.png)', 'blank line above'),
                              ('- a\n![a](x.png)', 'blank line above'),
                              ('Title\n===', 'underlined heading'),
                              ('Para\n\n----', 'underlined heading'),
                              ('## A\n\n## A', 'two headings'),
                              ('## [A](#a)', 'link in a heading'),
                              ('| a | b |', "doesn't support")]:
            self.refuses(text, message)


class SettingLabelTests(unittest.TestCase):
    SETTINGS = {'start': {'settingDescription': 'Start/Stop Auto-Sing (S216+)'},
                'secret': {'settingDescription': 'Hidden thing', 'hidden': True},
                'one': {'settingDescription': 'Same'},
                'two': {'settingDescription': 'Same (other)'}}

    def test_label_with_or_without_its_trailing_note_case_ignored(self):
        with mock.patch.object(B, 'SETTINGS', self.SETTINGS):
            for label in ['Start/Stop Auto-Sing (S216+)', 'start/stop auto-sing', ' START/STOP AUTO-SING ']:
                self.assertEqual(B.setting_by_label(label), 'start')
            with self.assertRaisesRegex(ValueError, 'no panel setting'):
                B.setting_by_label('Hidden thing')
            with self.assertRaisesRegex(ValueError, 'several settings match'):
                B.setting_by_label('Same')

    def test_default_as_the_player_reads_it(self):
        for setting, expected in [({'settingControl': {'controlType': 'button'}, 'enabled': True}, '—'),
                                  ({'enabled': True}, 'On'), ({'enabled': False}, 'Off'),
                                  ({'settingValue': 5, 'enabled': False}, '5'),
                                  ({'settingValue': ''}, '—'), ({'settingValue': []}, '—'),
                                  ({'settingValue': [1, 2]}, '[1, 2]'), ({'settingValue': {'a': 'é'}}, '{"a": "é"}')]:
            self.assertEqual(B.setting_default(setting), expected, setting)


class ChangelogOrderTests(unittest.TestCase):
    def test_versions_sort_as_the_release_helper_does(self):
        ordered = ['2.9.7a', '2.9.7b', '2.10.0', '2.14.5', '2.14.5-dev1', '2.14.5-dev2', '2.14.5-dev10', '2.14.6']
        self.assertEqual(sorted(reversed(ordered), key=B.version_key), ordered)
        self.assertEqual(B.version_key('2.10.6A'), B.version_key('2.10.6a'))

    def test_same_date_entries_newest_version_first(self):
        def entry(version):
            return {'id': f'live-{version}', 'version': version, 'channel': 'live',
                    'repository': 'Ferlieloi/synergism-hypersynergy', 'commit': 'a' * 40, 'previous_commit': None,
                    'date': '2026-01-25', 'date_kind': 'tag', 'status': 'tagged', 'release_url': None, 'sources': [],
                    'changes': [], 'notes': [], 'contributors': [{'id': 'm', 'roles': ['changes'], 'commits': ['a' * 40]}]}
        data = {'schema_version': 1, 'methodology': ['x'], 'entries': [entry('2.9.7a'), entry('2.10.0'), entry('2.9.7b')],
                'contributor_profiles': {'m': {'name': 'M', 'identity_commits': ['a' * 40]}}}
        self.assertEqual([e['version'] for e in B.displayed_changelog_entries(data)], ['2.10.0', '2.9.7b', '2.9.7a'])
        data['entries'][0]['notes_typo'] = []
        with self.assertRaisesRegex(ValueError, 'unknown key notes_typo'):
            B.validate_changelog(data)


class CalculationScrapeTests(unittest.TestCase):
    def test_reads_picker_entries_and_their_flags(self):
        text = '''export const defs = [
    { calculationName: "B calc", fnName: "fnB", toolingSupport: true, supportsReduce: true },
    { calculationName: "A calc", fnName: "fnA", toolingSupport: true },
    { calculationName: "Off", fnName: "fnOff", toolingSupport: false, supportsReduce: true },
];'''
        self.assertEqual(B.parse_calculations(text), [('B calc', 'fnB', True), ('A calc', 'fnA', False)])

    def test_an_entry_written_another_way_stops_the_run(self):
        with self.assertRaisesRegex(ValueError, 'double-quoted'):
            B.parse_calculations("{ calculationName: 'A', fnName: \"f\", toolingSupport: true }")
        with self.assertRaisesRegex(ValueError, 'double-quoted'):
            B.parse_calculations('{ calculationName: "A", fnName: FN, toolingSupport: true }')
        with self.assertRaisesRegex(ValueError, 'true or false'):
            B.parse_calculations('{ calculationName: "A", fnName: "f", toolingSupport: ENABLED }')


class OutputChecksTests(unittest.TestCase):
    def check(self, outputs: dict) -> None:
        with mock.patch.object(B, 'OUTPUTS', outputs):
            B.check_outputs()

    def test_resolves_pages_files_and_anchors(self):
        self.check({'index.html': '<a href="docs/">site</a>',
                    'docs/index.html': '<a href="wiki/a.html#x">a</a><a href="#top" id="top">top</a>'
                                       '<a href="https://example.org/missing.html">out</a>',
                    'docs/wiki/a.html': '<p id="x"></p><link href="../css/guide.css"><img src="../../src/mod/resource/img/hs-panel-icon.png">'})

    def test_reports_each_broken_reference(self):
        with self.assertRaises(ValueError) as caught:
            self.check({'docs/index.html': '<a href="wiki/a.html#y">a</a><a href="gone.html">g</a><img src="../../outside.png">',
                        'docs/wiki/a.html': '<p id="x"></p><p id="x"></p>'})
        message = str(caught.exception)
        for fragment in ['docs/wiki/a.html has no #y', 'gone.html leads to no file', '../../outside.png leads to no file',
                         "id 'x' used 2 times"]:
            self.assertIn(fragment, message)

    def test_markdown_links_to_the_site_and_relative_images(self):
        with self.assertRaises(ValueError) as caught:
            self.check({'docs/FEATURES.md': f'[s]({B.SITE}wiki/settings.html#k) [ok]({B.SITE}wiki/settings.html#j) '
                                            f'[home]({B.SITE}) ![i](res/missing.png) [gh](https://github.com/x/y)',
                        'docs/index.html': '', 'docs/wiki/settings.html': '<tr id="j"></tr>'})
        message = str(caught.exception)
        self.assertIn('docs/wiki/settings.html has no #k', message)
        self.assertIn('res/missing.png leads to no file', message)
        self.assertEqual(message.count('\n'), 2, message)

    def test_site_scripts_find_what_they_look_up(self):
        page = '<script src="js/changelog.js"></script><select id="changelog-channel"></select>'
        with self.assertRaises(ValueError) as caught:
            self.check({'docs/changelog.html': page})
        message = str(caught.exception)
        self.assertIn('docs/js/changelog.js looks up #changelog-search', message)
        self.assertIn('docs/js/changelog.js looks up .changelog-entry', message)
        self.assertNotIn('#changelog-channel', message)
        with mock.patch.object(B, 'OUTPUTS', {'docs/changelog.html': page}):
            B.check_outputs(full_site=False)

    def test_orphans_are_marked_pages_no_output_writes(self):
        with tempfile.TemporaryDirectory() as folder:
            out = Path(folder)
            (out / 'docs/wiki').mkdir(parents=True)
            (out / 'docs/wiki/old.html').write_text(B.GENERATED_MARK + ' Edit x. -->', encoding='utf-8')
            (out / 'docs/wiki/kept.html').write_text(B.GENERATED_MARK + ' Edit x. -->', encoding='utf-8')
            (out / 'docs/wiki/hand-written.html').write_text('<p>mine</p>', encoding='utf-8')
            with mock.patch.object(B, 'OUTPUTS', {'docs/wiki/kept.html': ''}):
                self.assertEqual(B.orphan_pages(out), ['docs/wiki/old.html'])
            self.assertEqual(B.orphan_pages(out / 'nowhere'), [])


class CatalogueChecksTests(unittest.TestCase):
    def test_refuses_unknown_keys_and_strings_for_lists(self):
        feature = B.CATEGORIES[0]['features'][0]
        with mock.patch.dict(feature, {'limit': ['typo']}):
            with self.assertRaisesRegex(ValueError, 'unknown key limit'):
                B.validate_catalogue()
        with mock.patch.dict(feature, {'details': 'one string'}):
            with self.assertRaisesRegex(ValueError, 'details must be a list'):
                B.validate_catalogue()


if __name__ == '__main__':
    unittest.main()
