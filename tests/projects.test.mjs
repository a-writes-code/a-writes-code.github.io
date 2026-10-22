import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createSiteServer } from "../scripts/serve.mjs";
import { parseProjectMarkdown } from "../scripts/markdown.mjs";
import {
  nextAutomatonRow,
  modularRule,
  modularPolynomial,
} from "../assets/project-animations.js";

const projects = JSON.parse(
  await readFile(new URL("../content/projects.json", import.meta.url), "utf8"),
);

test("every project story and its assets are accessible below a GitHub repository path", async () => {
  const server = createSiteServer({ basePath: "/research-site/" });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const origin = `http://127.0.0.1:${server.address().port}`;
    const homeUrl = new URL("/research-site/", origin);
    const home = await (await fetch(homeUrl)).text();
    assert.match(home, /id="projects"/);
    assert.match(home, /id="publications"/);
    for (const project of projects) {
      const pageUrl = new URL(`./projects/${project.slug}/`, homeUrl);
      const response = await fetch(pageUrl);
      assert.equal(response.status, 200);
      const html = await response.text();
      const source = await readFile(
        new URL(`../content/projects/${project.slug}.md`, import.meta.url),
        "utf8",
      );
      const article = parseProjectMarkdown(source);
      assert.ok(html.includes(`<h1>${article.titleHtml}</h1>`));
      assert.ok(
        html.includes(article.bodyHtml),
        "The published body must match its editable Markdown source",
      );
      assert.ok(
        html.includes(`/edit/main/content/projects/${project.slug}.md`),
      );
      assert.match(html, /data-animation=/);
      assert.match(html, /THE PAPER/);
      const links = [...html.matchAll(/(?:src|href)="(\.\.[^"]+)"/g)].map(
        (match) => match[1],
      );
      for (const link of links)
        assert.equal(
          (await fetch(new URL(link, pageUrl))).status,
          200,
          `Missing project asset or link: ${link}`,
        );
    }
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test("a freely rewritten Markdown article supports headings, links, lists, figures, and code", () => {
  const result = parseProjectMarkdown(
    `# A new project title\n\nA new *intro*.\n\n## My own section\n\n- First result\n- **Second** result\n\n[Paper](https://example.org/paper)\n\n![An experiment](/assets/experiment.svg)\n\n> A qualification.\n\n\`\`\`python\nx = 1 < 2\n\`\`\``,
  );
  assert.equal(result.title, "A new project title");
  assert.equal(result.introHtml, "<p>A new <em>intro</em>.</p>\n");
  for (const fragment of [
    "<h2>My own section</h2>",
    "<ul>",
    "<strong>Second</strong>",
    'href="https://example.org/paper"',
    'alt="An experiment"',
    "<blockquote>",
    'class="language-python"',
    "1 &lt; 2",
  ])
    assert.ok(result.bodyHtml.includes(fragment), fragment);
  assert.throws(() => parseProjectMarkdown("No title"), /# Title/);
});

test("the exact tasks in the animations compute the stated outputs", () => {
  assert.equal(modularRule(1, 0), 2);
  assert.equal(modularRule(0, 1), 3);
  assert.equal(modularRule(2, 1), 0);
  assert.equal(modularRule(4, 1), 4);
  assert.equal(modularPolynomial(3, 2), 1);
  const seed = [0, 0, 0, 1, 0, 0, 0];
  assert.deepEqual(nextAutomatonRow(seed, 90), [0, 0, 1, 0, 1, 0, 0]);
  assert.deepEqual(nextAutomatonRow(seed, 30), [0, 0, 1, 1, 1, 0, 0]);
  assert.deepEqual(nextAutomatonRow(seed, 0), Array(7).fill(0));
  assert.deepEqual(nextAutomatonRow(seed, 255), Array(7).fill(1));
});
