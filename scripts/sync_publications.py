"""Fetch the public Scholar profile. Keep the last good snapshot on any failure."""

import argparse
from datetime import datetime, timezone
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import sys
from urllib.parse import parse_qs, urlencode, urljoin, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"}


def clean(parts):
    return re.sub(r"\s+", " ", "".join(parts)).strip()


class ScholarParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.stack = []
        self.row = None
        self.records = []
        self.name = []
        self.more = False
        self.gray_index = 0

    def handle_starttag(self, tag, attributes):
        attrs = dict(attributes)
        classes = set(attrs.get("class", "").split())
        frame = {"tag": tag, "classes": classes, "id": attrs.get("id")}
        if tag == "tr" and "gsc_a_tr" in classes:
            self.row = {key: [] for key in ["title", "authors", "venue", "year", "citationCount"]}
            self.row["href"] = ""
            self.gray_index = 0
        if self.row is not None:
            if tag in {"svg", "img"} and any("gsc_a_at" in parent["classes"] for parent in self.stack):
                label = attrs.get("aria-label") or attrs.get("alt")
                if label:
                    self.row["title"].append(label)
                    frame["labelled"] = True
            if "gs_gray" in classes:
                frame["gray_index"] = self.gray_index
                self.gray_index += 1
            if tag == "a" and "gsc_a_at" in classes:
                self.row["href"] = attrs.get("href", "")
        if attrs.get("id") == "gsc_bpf_more":
            self.more = "disabled" not in attrs
        if tag not in VOID:
            self.stack.append(frame)

    def handle_endtag(self, tag):
        if tag == "tr" and self.row is not None:
            self.records.append(self.row)
            self.row = None
        for i in range(len(self.stack) - 1, -1, -1):
            if self.stack[i]["tag"] == tag:
                del self.stack[i:]
                break

    def handle_data(self, text):
        if any(frame["id"] == "gsc_prf_in" for frame in self.stack):
            self.name.append(text)
        if self.row is None:
            return
        if any("gs_oph" in frame["classes"] or frame.get("labelled") for frame in self.stack):
            return
        classes = set().union(*(frame["classes"] for frame in self.stack))
        if "gsc_a_at" in classes:
            self.row["title"].append(text)
        gray = next((frame["gray_index"] for frame in reversed(self.stack) if "gray_index" in frame), None)
        if gray in (0, 1):
            self.row["authors" if gray == 0 else "venue"].append(text)
        if "gsc_a_ac" in classes:
            self.row["citationCount"].append(text)
        if "gsc_a_y" in classes:
            self.row["year"].append(text)


def parse_scholar(html, profile_id, expected_name):
    parser = ScholarParser()
    parser.feed(html)
    if clean(parser.name).casefold() != expected_name.casefold():
        raise ValueError("Scholar did not return the expected author profile; cached publications were kept.")
    records = []
    seen = set()
    for raw in parser.records:
        href = urljoin("https://scholar.google.com", raw["href"])
        parsed = urlparse(href)
        paper_id = parse_qs(parsed.query).get("citation_for_view", [""])[0]
        title, authors, venue = (clean(raw[key]) for key in ["title", "authors", "venue"])
        if parsed.hostname != "scholar.google.com" or not paper_id.startswith(profile_id + ":"):
            raise ValueError("Unexpected publication identity or link; cached publications were kept.")
        if len(title) < 5 or not authors or paper_id in seen:
            raise ValueError("Incomplete or duplicate publication rows; cached publications were kept.")
        seen.add(paper_id)
        year = clean(raw["year"])
        citations = clean(raw["citationCount"]).replace(",", "")
        records.append({
            "id": paper_id,
            "title": title,
            "authors": authors,
            "venue": venue,
            "year": int(year) if re.fullmatch(r"(?:19|20)\d{2}", year) else None,
            "citationCount": int(citations) if citations.isdigit() else None,
            "scholarUrl": "https://scholar.google.com/citations?" + urlencode({"view_op": "view_citation", "hl": "en", "user": profile_id, "citation_for_view": paper_id}),
        })
    if not records:
        raise ValueError("No publication rows found; cached publications were kept.")
    return records, parser.more


def save_snapshot(records, profile_id, expected_name, output, allow_removals=False):
    previous = json.loads(output.read_text()) if output.exists() else None
    ids = [record["id"] for record in records]
    if len(ids) != len(set(ids)):
        raise ValueError("Repeated publication IDs across pages; cached publications were kept.")
    if previous and not allow_removals:
        missing = {record["id"] for record in previous["publications"]} - set(ids)
        if missing:
            raise ValueError("The response omitted existing works; use --allow-removals only after reviewing the author profile.")
    snapshot = {
        "schemaVersion": 1,
        "profile": {"id": profile_id, "name": expected_name, "url": "https://scholar.google.com/citations?" + urlencode({"hl": "en", "user": profile_id})},
        "syncedAt": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "publications": sorted(records, key=lambda record: record["id"]),
    }
    output.parent.mkdir(parents=True, exist_ok=True)
    temporary = output.with_suffix(".json.tmp")
    temporary.write_text(json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n")
    temporary.replace(output)
    return snapshot


def sync(output=ROOT / "data/publications.json", input_html=None, allow_removals=False):
    config = json.loads((ROOT / "content/site.json").read_text())
    profile_id, name = config["scholarUser"], config["name"]
    records = []
    for page in range(10):
        if input_html:
            html = Path(input_html).read_text()
        else:
            url = "https://scholar.google.com/citations?" + urlencode({"hl": "en", "user": profile_id, "cstart": page * 100, "pagesize": 100})
            request = Request(url, headers={"User-Agent": "AritraDasWebsite/1.0 (+https://a-writes-code.github.io/)", "Accept-Language": "en-US,en;q=0.9"})
            with urlopen(request, timeout=30) as response:
                html = response.read().decode("utf-8")
        batch, more = parse_scholar(html, profile_id, name)
        records.extend(batch)
        if not more:
            break
        if input_html:
            raise ValueError("The supplied HTML is only a partial profile; no snapshot was written.")
    else:
        raise ValueError("Profile pagination exceeded the safety limit; no snapshot was written.")
    snapshot = save_snapshot(records, profile_id, name, Path(output), allow_removals)
    print("Synced {} publications from Google Scholar at {}".format(len(records), snapshot["syncedAt"]))


if __name__ == "__main__":
    argument_parser = argparse.ArgumentParser(description=__doc__)
    argument_parser.add_argument("--input-html", help="Import a previously fetched public profile HTML file.")
    argument_parser.add_argument("--output", type=Path, default=ROOT / "data/publications.json")
    argument_parser.add_argument("--allow-removals", action="store_true", help="Allow reviewed deletions or merges from the Scholar profile.")
    arguments = argument_parser.parse_args()
    try:
        sync(arguments.output, arguments.input_html, arguments.allow_removals)
    except Exception as error:
        print("Publication refresh failed: {}".format(error), file=sys.stderr)
        sys.exit(1)
