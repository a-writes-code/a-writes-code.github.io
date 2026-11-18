// Keep new linked preprints visible until Scholar indexes them. Match by stable
// Scholar ID, normalized title, or arXiv ID so a later refresh does not duplicate them.
const titleKey = (title) =>
  title.normalize("NFKD").toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");
const arxivId = (text = "") =>
  text.match(/\b(\d{4}\.\d{4,5})(?:v\d+)?\b/)?.[1];

export function publicationItems(records, projects) {
  const matched = new Set();
  const items = records.map((record) => {
    const id = arxivId(`${record.venue} ${record.scholarUrl}`);
    const project = projects.find(
      (candidate) =>
        (candidate.scholarId && candidate.scholarId === record.id) ||
        titleKey(candidate.paperTitle) === titleKey(record.title) ||
        (id && id === arxivId(candidate.paperUrl)),
    );
    if (project) matched.add(project.slug);
    return {
      ...record,
      project,
      metadataSource: "scholar",
      displayYear: record.year ?? project?.publicationYear ?? null,
    };
  });
  for (const project of projects) {
    if (!project.includeInPublications || matched.has(project.slug)) continue;
    items.push({
      id: `project:${project.slug}`,
      title: project.paperTitle,
      authors: project.authors,
      venue: project.venue,
      year: project.publicationYear,
      displayYear: project.publicationYear,
      scholarUrl: project.paperUrl,
      metadataSource: "paper",
      project,
    });
  }
  return items.sort(
    (a, b) =>
      (b.displayYear ?? 0) - (a.displayYear ?? 0) ||
      a.title.localeCompare(b.title),
  );
}
