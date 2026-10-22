import { readFile, writeFile, mkdir, cp } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parseProjectMarkdown } from "./markdown.mjs";

const root = fileURLToPath(new URL("../", import.meta.url));
// Self-host the build-time math renderer's CSS and fonts. No CDN is needed.
const mathAssets = `${root}assets/vendor/katex`;
await mkdir(mathAssets, { recursive: true });
for (const file of ["katex.min.css", "fonts"]) {
  await cp(`${root}node_modules/katex/dist/${file}`, `${mathAssets}/${file}`, {
    recursive: true,
  });
}
await cp(`${root}node_modules/katex/LICENSE`, `${mathAssets}/LICENSE`);
const readJson = async (path) =>
  JSON.parse(await readFile(`${root}${path}`, "utf8"));
const config = await readJson("content/site.json");
const projects = await readJson("content/projects.json");
for (const project of projects) {
  if (!/^[a-z0-9-]+$/.test(project.slug))
    throw new Error("Invalid project slug");
  const article = parseProjectMarkdown(
    await readFile(`${root}content/projects/${project.slug}.md`, "utf8"),
  );
  Object.assign(project, article);
}
const publications = await readJson("data/publications.json");
const escape = (text = "") =>
  String(text).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
const externalLink = (href, text, className = "text-link") =>
  `<a class="${className}" href="${escape(href)}" target="_blank" rel="noopener noreferrer">${escape(text)} <span aria-hidden="true">↗</span></a>`;
const byId = new Map(projects.map((project) => [project.scholarId, project]));

function animation(project, compact = false) {
  const duration = project.duration ?? 12;
  return `<figure class="project-animation ${compact ? "compact-animation" : "story-animation"}" data-animation="${project.visual}" data-duration="${duration}" data-stage-times="${escape(JSON.stringify(project.stageTimes ?? project.stages.map((_, i) => (i * duration) / project.stages.length)))}" data-stages="${escape(JSON.stringify(project.stages))}">
    <div class="animation-topline"><span class="small-mono">${escape(project.visual === "automata" ? "A RULE IN MOTION" : "THE IDEA IN MOTION")}</span><span class="animation-time small-mono" aria-hidden="true">00 / ${duration}s</span></div>
    <canvas width="720" height="400" role="img" aria-label="${escape(project.animationLabel)}"></canvas>
    <figcaption><p class="animation-stage">${escape(project.stages[0])}</p><div class="animation-bottom"><span class="animation-kind">${project.visual === "automata" ? "Cellular automaton" : "Conceptual animation"}</span><div class="animation-buttons js-only"><button type="button" class="animation-play icon-button" aria-label="Pause animation: ${escape(project.shortTitle)}" data-title="${escape(project.shortTitle)}"><span aria-hidden="true">Ⅱ</span></button><button type="button" class="animation-replay icon-button" aria-label="Replay animation: ${escape(project.shortTitle)}"><span aria-hidden="true">↺</span></button></div></div>${project.visual === "manifold" ? `<label class="animation-timeline js-only"><span class="sr-only">Animation time: ${escape(project.shortTitle)}</span><input type="range" class="animation-seek" min="0" max="${duration}" step="0.1" value="0" aria-label="Animation time: ${escape(project.shortTitle)}"></label>` : ""}${compact ? "" : `<p class="animation-note">${escape(project.animationNote)}</p>`}<noscript><p class="animation-note">Enable JavaScript to play this animation. The explanation below remains available.</p></noscript></figcaption>
  </figure>`;
}

function projectSection() {
  return `<section id="projects" class="section container projects-section" aria-labelledby="projects-heading">
    <div class="section-heading"><div><p class="eyebrow">01 / PROJECTS</p><h2 id="projects-heading">The stories behind the research<span class="accent">.</span></h2></div><p class="section-aside">The question. The experiment.<br>What we learned.</p></div>
    <p class="section-intro">A closer look at the projects I’ve worked on, with a short animation to introduce each idea.</p>
    <div class="project-grid">${projects
      .map(
        (project) => `<article class="project-card">
      ${animation(project, true)}
      <div class="project-card-copy"><div class="project-meta"><p class="card-kicker">${escape(project.kicker)}</p><span class="small-mono">${escape(project.year)}</span></div><h3><a href="./projects/${project.slug}/">${escape(project.shortTitle)}</a></h3><p>${escape(project.summary)}</p><a class="story-link" href="./projects/${project.slug}/">Read the story <span aria-hidden="true">→</span></a></div>
    </article>`,
      )
      .join("\n")}</div>
  </section>`;
}

function publicationSection() {
  const date = new Date(publications.syncedAt);
  if (!Number.isFinite(date.getTime()) || !publications.publications.length)
    throw new Error("Publication snapshot is missing or invalid");
  const items = publications.publications
    .map((record) => {
      const project = byId.get(record.id);
      return {
        ...record,
        project,
        displayYear: record.year ?? project?.publicationYear ?? null,
      };
    })
    .sort(
      (a, b) =>
        (b.displayYear ?? 0) - (a.displayYear ?? 0) ||
        a.title.localeCompare(b.title),
    );
  const years = [
    ...new Set(items.map((item) => item.displayYear).filter(Boolean)),
  ];
  const readableDate = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "America/New_York",
  }).format(date);
  return `<section id="publications" class="section container publications-section" aria-labelledby="publications-heading">
    <div class="section-heading"><div><p class="eyebrow">02 / PUBLICATIONS</p><h2 id="publications-heading">Papers & preprints<span class="accent">.</span></h2></div>${externalLink(publications.profile.url, "Google Scholar profile")}</div>
    <div class="publication-source"><span class="status-dot" aria-hidden="true"></span><p>From Google Scholar · Synced <time datetime="${escape(publications.syncedAt)}">${readableDate}</time> · Refreshed weekly</p></div>
    <div class="publication-toolbar js-only"><label class="publication-search"><span class="sr-only">Search publications</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/></svg><input type="search" id="publication-search" placeholder="Search papers, authors, or venues" autocomplete="off"></label><label class="publication-year">Year <select id="publication-year" aria-label="Publication year"><option value="all">All years</option>${years.map((year) => `<option value="${year}">${year}</option>`).join("")}</select></label><span id="publication-count" class="small-mono" role="status">${items.length} works</span></div>
    <ol class="publication-list">${items.map((record) => `<li class="publication-item" data-year="${record.displayYear ?? "unknown"}"><span class="publication-date">${record.displayYear ?? "n.d."}${record.year == null && record.displayYear != null ? '<span class="supplemented-year" title="Year supplied by the linked paper">*</span>' : ""}</span><div class="publication-copy"><h3>${externalLink(record.scholarUrl, record.title, "publication-title")}</h3><p class="publication-authors">${escape(record.authors)}</p><p class="publication-venue">${escape(record.venue || "Venue not listed on Scholar")}</p><div class="publication-links">${record.project ? `${externalLink(record.project.paperUrl, "Paper")}<a class="text-link" href="./projects/${record.project.slug}/">Project story <span aria-hidden="true">→</span></a>` : ""}</div></div></li>`).join("\n")}</ol>
    <p id="publication-empty" class="publication-empty" hidden>No papers match this search. Try a different word or year.</p>
    <p class="publication-footnote">Titles, author lists, and venues follow the Scholar profile. * Missing years are supplied by the linked papers.</p>
  </section>`;
}

function header() {
  return `<header class="site-header"><div class="container header-inner"><a class="wordmark" href="../../" aria-label="Aritra Das, home">Aritra Das<span class="wordmark-dot">.</span></a><button class="menu-toggle js-only" type="button" aria-expanded="false" aria-controls="main-nav">Menu <span aria-hidden="true">☰</span></button><nav id="main-nav" aria-label="Main navigation"><a href="../../#projects">Projects</a><a href="../../#publications">Publications</a><a href="../../#about">About</a></nav><div class="header-actions"><button class="theme-toggle js-only" type="button" aria-label="Switch to dark theme" title="Change color theme"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M20.5 13.5A8.7 8.7 0 0 1 10.5 3a8.7 8.7 0 1 0 10 10.5Z"/></svg></button><a class="header-contact" href="../../#contact">Let’s talk <span aria-hidden="true">↗</span></a></div></div></header>`;
}

function storyPage(project, index) {
  const next = projects[(index + 1) % projects.length];
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="description" content="${escape(project.summary)}"><meta property="og:title" content="${escape(project.title)} — Aritra Das"><meta property="og:description" content="${escape(project.summary)}"><meta property="og:type" content="article"><meta name="theme-color" content="#f7f6f0"><title>${escape(project.title)} — Aritra Das</title><link rel="canonical" href="${config.siteUrl}/projects/${project.slug}/"><link rel="icon" href="../../assets/favicon.svg" type="image/svg+xml"><link rel="stylesheet" href="../../assets/style.css"><link rel="stylesheet" href="../../assets/projects.css"><link rel="stylesheet" href="../../assets/vendor/katex/katex.min.css"><script>try { const t = localStorage.getItem('aritra-theme'); if(t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; } catch {}</script><script type="module" src="../../assets/main.js"></script></head>
<body class="story-page"><a class="skip-link" href="#main">Skip to content</a>${header()}<main id="main"><article class="container story-article"><a class="story-back text-link" href="../../#projects"><span aria-hidden="true">←</span> All project stories</a><div class="story-heading"><div><p class="eyebrow">${escape(project.kicker)} · ${escape(project.year)}</p><h1>${project.titleHtml}</h1><div class="story-lede">${project.introHtml}</div><p class="story-authors">A project with ${escape(
    project.authors
      .split(", ")
      .filter((author) => author !== config.name)
      .join(", "),
  )}.</p></div>${animation(project)}</div><div class="story-reading"><div class="story-prose"><div class="story-body">${project.bodyHtml}</div><section class="story-reference"><p class="eyebrow">THE PAPER</p><h2>${escape(project.paperTitle)}</h2><p>${escape(project.authors)}</p><p>${escape(project.venue)}</p><div class="story-paper-links">${externalLink(project.paperUrl, "Read the paper")}${project.codeUrl ? externalLink(project.codeUrl, "Research code") : ""}${externalLink(publications.profile.url, "Google Scholar")}</div></section></div></div><a class="next-story" href="../${next.slug}/"><div><p class="eyebrow">NEXT PROJECT</p><h2>${escape(next.shortTitle)}</h2></div><span aria-hidden="true">→</span></a></article></main><footer class="site-footer"><div class="container footer-inner"><span>© <span id="year">2026</span> Aritra Das. Views are my own.</span><a href="${config.repositoryUrl}/edit/main/content/projects/${project.slug}.md" target="_blank" rel="noopener noreferrer">Edit this page on GitHub <span aria-hidden="true">↗</span></a></div></footer></body></html>\n`;
}

let html = await readFile(`${root}index.html`, "utf8");
for (const [name, content] of [
  ["PROJECTS", projectSection()],
  ["PUBLICATIONS", publicationSection()],
]) {
  const pattern = new RegExp(
    `<!-- ${name}:START -->[\\s\\S]*?<!-- ${name}:END -->`,
  );
  if (!pattern.test(html))
    throw new Error(`Missing ${name} content markers in index.html`);
  html = html.replace(
    pattern,
    `<!-- ${name}:START -->\n${content}\n<!-- ${name}:END -->`,
  );
}
await writeFile(`${root}index.html`, html);
for (const [index, project] of projects.entries()) {
  if (!/^[a-z0-9-]+$/.test(project.slug))
    throw new Error("Invalid project slug");
  const directory = `${root}projects/${project.slug}`;
  await mkdir(directory, { recursive: true });
  await writeFile(`${directory}/index.html`, storyPage(project, index));
}
console.log(
  `Rendered ${projects.length} project stories and ${publications.publications.length} publications`,
);
