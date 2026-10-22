from copy import deepcopy
import json
from pathlib import Path
import tempfile
import unittest

from scripts.sync_publications import parse_scholar, save_snapshot, sync

PROFILE = "EVtLmwcAAAAJ"


def row(suffix, title="Learning &amp; geometry", year="2024", authors="A Das, J Iosue"):
    return ('<tr class="gsc_a_tr"><td class="gsc_a_t">'
            '<a class="gsc_a_at" href="/citations?view_op=view_citation&amp;user={0}&amp;citation_for_view={0}:{1}">{2}</a>'
            '<div class="gs_gray">{3}</div><div class="gs_gray">A venue<span>, 2024</span></div>'
            '</td><td class="gsc_a_c"><a class="gsc_a_ac">12</a></td>'
            '<td class="gsc_a_y"><span>{4}</span></td></tr>').format(PROFILE, suffix, title, authors, year)


def profile(rows, more=False, name="Aritra Das"):
    return '<html><div id="gsc_prf_in">{}</div><table>{}</table><button id="gsc_bpf_more" {}>Show more</button></html>'.format(name, rows, '' if more else 'disabled=""')


class PublicationSyncTest(unittest.TestCase):
    def test_extracts_public_records_without_inventing_missing_years(self):
        records, more = parse_scholar(profile(row("one") + row("two", year="", authors="A Das, V Albert")), PROFILE, "Aritra Das")
        self.assertFalse(more)
        self.assertEqual(len(records), 2)
        self.assertEqual(records[0]["title"], "Learning & geometry")
        self.assertEqual(records[0]["venue"], "A venue, 2024")
        self.assertEqual(records[0]["citationCount"], 12)
        self.assertIsNone(records[1]["year"])
        self.assertTrue(records[0]["scholarUrl"].startswith("https://scholar.google.com/"))

    def test_rejects_bot_pages_wrong_authors_and_foreign_links(self):
        for html in ["<html>Sorry, unusual traffic. Please solve the CAPTCHA.</html>", profile(row("one"), name="Someone Else"), profile(row("one").replace(PROFILE + ":one", "OTHER:one")), profile("")]:
            with self.subTest(html=html[:80]):
                with self.assertRaises(ValueError):
                    parse_scholar(html, PROFILE, "Aritra Das")

    def test_preserves_accessible_math_and_excludes_scholars_hidden_zero_year(self):
        title = 'A <svg aria-label="Z2"><path d="M0 0"/></svg> gauge theory'
        html = profile(row("one", title=title).replace('A venue<span>, 2024</span>', 'A venue<span class="gs_oph">, 0</span>'))
        records, _ = parse_scholar(html, PROFILE, "Aritra Das")
        self.assertEqual(records[0]["title"], "A Z2 gauge theory")
        self.assertEqual(records[0]["venue"], "A venue")

    def test_partial_or_duplicate_results_never_overwrite_the_last_good_snapshot(self):
        records, _ = parse_scholar(profile(row("one") + row("two")), PROFILE, "Aritra Das")
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "publications.json"
            save_snapshot(records, PROFILE, "Aritra Das", output)
            original = output.read_bytes()
            with self.assertRaises(ValueError):
                save_snapshot(records[:1], PROFILE, "Aritra Das", output)
            self.assertEqual(original, output.read_bytes())
            with self.assertRaises(ValueError):
                save_snapshot([records[0], deepcopy(records[0])], PROFILE, "Aritra Das", output)
            self.assertEqual(original, output.read_bytes())
            save_snapshot(records[:1], PROFILE, "Aritra Das", output, allow_removals=True)
            self.assertEqual(len(json.loads(output.read_text())["publications"]), 1)

    def test_imports_a_complete_profile_and_rejects_partial_html(self):
        with tempfile.TemporaryDirectory() as directory:
            source = Path(directory) / "profile.html"
            output = Path(directory) / "publications.json"
            source.write_text(profile(row("one")))
            sync(output=output, input_html=source)
            original = output.read_bytes()
            source.write_text(profile(row("one"), more=True))
            with self.assertRaises(ValueError):
                sync(output=output, input_html=source)
            self.assertEqual(original, output.read_bytes())
            source.write_text("<html>Unusual traffic</html>")
            with self.assertRaises(ValueError):
                sync(output=output, input_html=source)
            self.assertEqual(original, output.read_bytes())


if __name__ == "__main__":
    unittest.main()
