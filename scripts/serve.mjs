import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".pdf": "application/pdf",
  ".json": "application/json; charset=utf-8",
};

export function createSiteServer({ directory = root, basePath = "/" } = {}) {
  const base =
    `/${basePath.split("/").filter(Boolean).join("/")}`.replace(/\/$/, "") +
    "/";
  const siteRoot = resolve(directory);
  return createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      if (!url.pathname.startsWith(base)) {
        res.writeHead(404).end("Not found");
        return;
      }
      const relative = decodeURIComponent(url.pathname.slice(base.length));
      let path = resolve(siteRoot, relative || "index.html");
      if (path !== siteRoot && !path.startsWith(siteRoot + sep)) {
        res.writeHead(403).end("Forbidden");
        return;
      }
      if ((await stat(path)).isDirectory()) path = resolve(path, "index.html");
      const data = await readFile(path);
      res.writeHead(200, {
        "Content-Type": types[extname(path)] || "application/octet-stream",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      });
      res.end(req.method === "HEAD" ? undefined : data);
    } catch {
      res.writeHead(404).end("Not found");
    }
  });
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  const port = Number(process.env.PORT || 4173);
  createSiteServer().listen(port, "127.0.0.1", () =>
    console.log(`Website preview: http://127.0.0.1:${port}`),
  );
}
