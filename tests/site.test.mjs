import test from "node:test";
import assert from "node:assert/strict";
import { createSiteServer } from "../scripts/serve.mjs";
import { spinEnergy, metropolisSweep } from "../assets/brain-physics.js";

test("the public site and all local assets load at both root and GitHub project paths", async (t) => {
  for (const basePath of ["/", "/personal-website/"]) {
    await t.test(basePath, async () => {
      const server = createSiteServer({ basePath });
      await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
      try {
        const origin = `http://127.0.0.1:${server.address().port}`;
        const pageUrl = new URL(basePath, origin);
        const response = await fetch(pageUrl);
        assert.equal(response.status, 200);
        const html = await response.text();
        assert.match(html, /Aritra Das/);
        const files = [...html.matchAll(/(?:src|href)="(\.\/[^"#?]+)"/g)].map(
          (match) => match[1],
        );
        assert.ok(
          files.length >= 4,
          "Styles, script, portrait, and favicon must be present",
        );
        for (const path of [...files, "./assets/brain-physics.js"]) {
          const asset = await fetch(new URL(path, pageUrl));
          assert.equal(
            asset.status,
            200,
            `Missing asset ${path} at ${basePath}`,
          );
          assert.ok(
            (await asset.arrayBuffer()).byteLength > 0,
            `Empty asset ${path}`,
          );
        }
        const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(
          (match) => match[1],
        );
        assert.equal(
          new Set(ids).size,
          ids.length,
          "Element IDs must be unique",
        );
        for (const [, id] of html.matchAll(/href="#([^"]+)"/g))
          assert.ok(ids.includes(id), `Broken navigation #${id}`);
        for (const [, attrs] of html.matchAll(/<a\b([^>]+)>/g)) {
          if (attrs.includes('target="_blank"'))
            assert.match(attrs, /rel="noopener noreferrer"/);
        }
        assert.equal(
          (await fetch(new URL("./does-not-exist", pageUrl))).status,
          404,
        );
        assert.equal(
          (await fetch(`${origin}${basePath}..%2Fpackage.json`)).status,
          403,
        );
      } finally {
        await new Promise((resolve) => server.close(resolve));
      }
    });
  }
});

test("the Ising simulation preserves spins and obeys its temperature-dependent energy rule", () => {
  const size = 9;
  const aligned = Array(size * size).fill(1);
  assert.equal(spinEnergy(aligned, size), -2 * size * size);
  let seed = 72;
  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  metropolisSweep(aligned, size, 0, random);
  assert.ok(
    aligned.every((s) => s === 1),
    "Zero-temperature aligned spins cannot gain energy",
  );
  const states = Array.from({ length: size * size }, () =>
    random() < 0.5 ? -1 : 1,
  );
  for (let sweep = 0; sweep < 50; sweep++) {
    const before = spinEnergy(states, size);
    metropolisSweep(states, size, 0, random);
    assert.ok(spinEnergy(states, size) <= before);
    assert.ok(states.every((s) => s === 1 || s === -1));
  }
  metropolisSweep(aligned, size, 1000000, random);
  assert.ok(
    spinEnergy(aligned, size) > -2 * size * size,
    "Thermal fluctuations allow energy-increasing flips",
  );
});
