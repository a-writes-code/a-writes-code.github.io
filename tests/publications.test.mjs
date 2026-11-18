import test from "node:test";
import assert from "node:assert/strict";
import { publicationItems } from "../scripts/publications.mjs";

test("a linked preprint persists before Scholar indexing and merges into its later Scholar record", () => {
  const project = {
    slug: "tree-grams",
    paperTitle: "What's in a Tree ? Hierarchical n-gram models as controlled approximators of language",
    paperUrl: "https://arxiv.org/abs/2611.23093",
    publicationYear: 2026,
    authors: "Aritra Das and collaborators",
    venue: "arXiv:2611.23093",
    includeInPublications: true,
  };
  const old = { id: "older", title: "Older work", year: 2024 };
  const pending = publicationItems([old], [project]);
  assert.equal(pending.length, 2);
  assert.equal(pending[0].scholarUrl, project.paperUrl);
  assert.equal(pending[0].metadataSource, "paper");
  for (const indexed of [
    { title: "What’s in a Tree? Hierarchical n gram models as controlled approximators of language" },
    { title: "An updated paper title", venue: "arXiv preprint arXiv:2611.23093v2" },
  ]) {
    const record = { id: "scholar:new", year: 2026, scholarUrl: "https://scholar.google.com/citations?citation_for_view=new", ...indexed };
    const merged = publicationItems([old, record], [project]);
    assert.equal(merged.length, 2, "Indexing must not duplicate the preprint");
    assert.equal(merged[0].project.slug, project.slug);
    assert.equal(merged[0].scholarUrl, record.scholarUrl);
    assert.equal(merged[0].metadataSource, "scholar");
  }
  assert.equal(old.project, undefined, "The source snapshot must remain unchanged");
});
