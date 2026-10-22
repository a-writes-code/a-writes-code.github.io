import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createSiteServer } from "../scripts/serve.mjs";
import { parseProjectMarkdown } from "../scripts/markdown.mjs";
import { rotateAboutAxis, homidFrame } from "../assets/homogeneous-sphere.js";
import {
  nextAutomatonRow,
  modularRule,
  modularPolynomial,
  polynomialTerms,
  contextTask,
  regularizationFrame,
  holeSite,
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
      if (project.slug === "homid") {
        assert.match(html, /data-duration="28"/);
        assert.equal(
          (await fetch(new URL("../../assets/homogeneous-sphere.js", pageUrl)))
            .status,
          200,
        );
        const font = await fetch(
          new URL(
            "../../assets/vendor/katex/fonts/KaTeX_Main-Regular.woff2",
            pageUrl,
          ),
        );
        assert.equal(font.status, 200);
        assert.ok((await font.arrayBuffer()).byteLength > 0);
      }
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

test("math in the editable article renders at build time and stays literal inside code", () => {
  const article = parseProjectMarkdown(
    "# Groups\n\nThe sphere $S^2$.\n\n$$\n\\frac{\\mathrm{SO}(3)}{\\mathrm{SO}(2)} \\cong S^2\n$$\n\n`$not_math$`",
  );
  assert.match(article.introHtml, /class="katex"/);
  assert.match(article.bodyHtml, /class="katex-display"/);
  assert.match(article.bodyHtml, /<math/);
  assert.match(article.bodyHtml, /<code>\$not_math\$<\/code>/);
});

test("the HomID sequence uses rigid rotations and the SO(2) stabilizer fixes the north pole", () => {
  for (const angle of [0, 0.4, Math.PI, 2 * Math.PI]) {
    const rotated = rotateAboutAxis([0, 0, 1], [0, 0, 1], angle);
    assert.ok(
      rotated.every((value, i) => Math.abs(value - [0, 0, 1][i]) < 1e-12),
    );
    const arbitrary = rotateAboutAxis([0.6, 0, 0.8], [1, 2, 3], angle);
    assert.ok(Math.abs(Math.hypot(...arbitrary) - 1) < 1e-12);
  }
  assert.ok(homidFrame(0).sphereOpacity > 0.9);
  assert.ok(homidFrame(5).sphereOpacity < 0.05);
  assert.deepEqual(homidFrame(10).point, [0, 0, 1]);
  assert.equal(homidFrame(12).so2Curve, 0);
  const final = homidFrame(25);
  assert.ok(Math.abs(Math.hypot(...final.point) - 1) < 1e-12);
  assert.ok(
    final.point[2] < 0.5,
    "The SO(3) rotation must move the north-pole vector",
  );
  assert.equal(final.quotient, 1);
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
  assert.deepEqual(polynomialTerms(3, 2), [3, 4]);
  assert.equal(modularPolynomial(3, 2), 0);
  assert.equal(modularPolynomial(2, 3), 3);
  assert.equal(modularPolynomial(-1, 2), 1);
  const seed = [0, 0, 0, 1, 0, 0, 0];
  assert.deepEqual(nextAutomatonRow(seed, 90), [0, 0, 1, 0, 1, 0, 0]);
  assert.deepEqual(nextAutomatonRow(seed, 30), [0, 0, 1, 1, 1, 0, 0]);
  assert.deepEqual(nextAutomatonRow(seed, 0), Array(7).fill(0));
  assert.deepEqual(nextAutomatonRow(seed, 255), Array(7).fill(1));
});

test("each in-context sequence has three correct modulo-seven examples and a stable unseen query", () => {
  const coefficients = [
    [2, 3],
    [5, 4],
    [3, 6],
  ];
  for (let index = 0; index < coefficients.length; index++) {
    for (const seed of [0, 1, 832, 0xffffffff]) {
      const task = contextTask(index, seed);
      assert.deepEqual([task.a, task.b], coefficients[index]);
      assert.equal(task.examples.length, 3);
      for (const [x, y, z] of task.examples)
        assert.equal(z, (task.a * x + task.b * y) % 7);
      assert.ok(
        task.query.every(
          (value) => Number.isInteger(value) && value >= 0 && value < 7,
        ),
      );
      assert.ok(
        !task.examples.some(
          ([x, y]) => x === task.query[0] && y === task.query[1],
        ),
      );
      assert.deepEqual(task.query, contextTask(index, seed).query);
      assert.equal(task.color, index === 2 ? "red" : "green");
    }
  }
  assert.notDeepEqual(contextTask(0, 1).query, contextTask(0, 832).query);
});

test("regularization exchanges neuron brightness without deleting the memorizing population", () => {
  const initial = regularizationFrame(0),
    final = regularizationFrame(1);
  assert.ok(initial.red > initial.green);
  assert.equal(final.green, 1);
  assert.ok(final.red > 0 && final.red < 0.25);
  let previous = initial;
  for (let i = 1; i <= 100; i++) {
    const current = regularizationFrame(i / 100);
    assert.ok(current.red <= previous.red && current.green >= previous.green);
    previous = current;
  }
});

test("the hole stays on its sublattice and each hop crosses exactly two sites", () => {
  assert.deepEqual(
    Array.from({ length: 9 }, (_, i) => holeSite(i / 8)),
    [2, 4, 6, 8, 10, 8, 6, 4, 2],
  );
  let previous = holeSite(0);
  for (let i = 1; i <= 1000; i++) {
    const current = holeSite(i / 1000);
    assert.equal(current % 2, 0);
    assert.ok(current >= 2 && current <= 10);
    assert.ok([0, 2].includes(Math.abs(current - previous)));
    previous = current;
  }
});
