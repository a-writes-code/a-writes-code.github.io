import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createSiteServer } from "../scripts/serve.mjs";
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
      assert.ok(html.includes(project.title.replaceAll("&", "&amp;")));
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
