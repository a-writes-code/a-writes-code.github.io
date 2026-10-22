import test from "node:test";
import assert from "node:assert/strict";
import { createSiteServer } from "../scripts/serve.mjs";
import { loss, gradient, descend } from "../assets/landscape.js";

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
        for (const path of [...files, "./assets/landscape.js"]) {
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

test("gradient descent follows the displayed surface and lowers loss over the full slider range", () => {
  const h = 1e-5;
  for (const [x, z] of [
    [2.6, 2.5],
    [-2.7, 2.6],
    [2.8, -2.5],
    [-2.4, -2.7],
  ]) {
    const [gx, gz] = gradient(x, z);
    assert.ok(
      Math.abs(gx - (loss(x + h, z) - loss(x - h, z)) / (2 * h)) < 1e-7,
    );
    assert.ok(
      Math.abs(gz - (loss(x, z + h) - loss(x, z - h)) / (2 * h)) < 1e-7,
    );
    for (const rate of [0.01, 0.04, 0.18]) {
      let point = { x, z };
      const initial = loss(x, z);
      for (let step = 0; step < 600; step++) {
        const next = descend(point, rate);
        assert.ok(Number.isFinite(next.x) && Number.isFinite(next.z));
        assert.ok(loss(next.x, next.z) <= loss(point.x, point.z) + 1e-12);
        point = next;
      }
      assert.ok(loss(point.x, point.z) < initial - 0.1);
    }
  }
});
