# Aritra Das — personal website

A research website at the intersection of physics and AI. It contains six project stories with short explanatory animations, a searchable publication list from Google Scholar, and sections for research interests, teaching, skills, and life outside work.

The live site is <https://a-writes-code.github.io/>. The repository is `a-writes-code/a-writes-code.github.io`.

## Preview

Use Node.js 22 or newer and Python 3.9 or newer. No package installation is required.

```sh
cd /Users/aritradas/Academic/Random/personal-website
npm start
```

Open <http://127.0.0.1:4173>. Use `PORT=4174 npm start` to select a different port. Press Ctrl+C to stop the server. Generated HTML is committed, so the preview also works before running a build.

## Edit

| File                           | Purpose                                                                                    |
| ------------------------------ | ------------------------------------------------------------------------------------------ |
| `content/projects.json`        | Project titles, summaries, article sections, paper links, glossary, and animation captions |
| `content/site.json`            | Author name, Scholar profile ID, and public site URL                                       |
| `data/publications.json`       | Last successful Scholar snapshot; maintained by the updater                                |
| `index.html`                   | Homepage layout and personal information outside the generated blocks                      |
| `projects/*/index.html`        | Generated project articles; edit `content/projects.json` instead                           |
| `assets/style.css`             | Original layout, color themes, and common components                                       |
| `assets/projects.css`          | Project cards, article layout, publication list, and navigation additions                  |
| `assets/main.js`               | Navigation, theme, publication search, and other page controls                             |
| `assets/project-animations.js` | The six 12-second explanatory animations                                                   |
| `assets/landscape.js`          | The original interactive loss landscape                                                    |
| `scripts/render-content.mjs`   | Renders project pages and the two generated homepage sections                              |
| `scripts/sync_publications.py` | Fetches and validates the public Scholar profile                                           |
| `.github/workflows/site.yml`   | Weekly refresh, validation, build, and Pages deployment                                    |
| `docs/research-sources.md`     | Paper inventory, scientific evidence, and source limits                                    |

After changing project content, run:

```sh
npm run check
```

This regenerates the articles and homepage blocks. Keep the `PROJECTS` and `PUBLICATIONS` comment markers in `index.html`. Content inside those markers is generated. A project's `scholarId` connects its story with the corresponding publication.

## Validate and build

```sh
npm run check
```

The command checks JavaScript syntax, renders the content, runs Node and Python tests, and builds `dist/`. The expected result is six passing Node tests, five passing Python tests, and `Built static website in dist/`.

The HTTP tests serve the homepage and all project articles below a repository subpath. They check local assets, navigation, missing files, and path traversal protection. Numerical tests check the gradient descent, exact modular arithmetic, and cellular automaton examples. The publication tests cover HTML entities, accessible math labels, missing years, bot pages, incorrect authors, incomplete pagination, duplicate records, and preservation of the last good snapshot.

HTTP tests require permission to open a local port. Tests use synthetic fixtures and make no network requests. `npm run build` renders the content and writes a portable public site to `dist/`.

## Publication updates

The workflow refreshes Scholar every Monday, on updates to `main`, and when started manually from the Actions tab. It runs on GitHub, so this computer does not need to stay on. No paid API, personal access token, or additional repository secret is needed.

To refresh locally:

```sh
npm run sync-publications
npm run check
```

The updater checks the exact author name and Scholar profile ID. It reads all available profile pages and keeps record IDs stable. It writes the cache atomically after validation. If Google returns a bot page, rejects the request, omits existing records, or returns an incomplete response, the updater exits without replacing the existing cache.

The scheduled workflow can still build and publish from that previous snapshot. It records a warning in Actions. The date shown on the website remains the date of the last successful sync. A successful refresh updates the cache and generated HTML, commits them to `main`, and deploys the result within the same run.

If works are deliberately deleted or merged on Scholar, review the profile before allowing their removal:

```sh
python3 scripts/sync_publications.py --allow-removals
npm run check
```

The displayed publication metadata follows Scholar. Missing years are supplied from the matching project's linked paper and marked with an asterisk. Google can block automated access, so the last-sync date is the useful freshness indicator. Check Actions if it becomes stale.

## Publishing

GitHub Pages must use **GitHub Actions** as its build source. The workflow validates every push to `main`, uploads only `dist/`, and deploys the site. Standard GitHub workflow credentials perform the scheduled commits and deployment.

To run the updater and deployment manually:

```sh
gh workflow run site.yml --repo a-writes-code/a-writes-code.github.io
```

The source branch is `codex/interactive-site`; the deployment source is `main`. Review and merge future source changes into `main`. After an automatic refresh, fetch the latest `main` before publishing another change. Do not force-push over the updater's commits.

## Content and animation sources

The bio, teaching history, skills, and personal interests were adapted from the [original Google Site](https://sites.google.com/view/aritra-das-phys-ai/page). The portrait was copied from the older local website. That Google Site and the local checkout at `/Users/aritradas/Academic/website/research` were left unchanged. The GitHub website implementation has been replaced, with its history preserved.

The project stories describe the six works found on the public Scholar profile on 22 October 2026. Paper links and evidence limits are recorded in [docs/research-sources.md](docs/research-sources.md). No unpublished projects or unverified individual contribution claims were added.

Animations explain concepts rather than reproduce research figures. The modular arithmetic and cellular automata compute exact task outputs. Other scenes are schematic and labelled accordingly. All animations have pause and replay controls. They stop automatic playback for reduced-motion preferences and pause when outside the viewport or when the browser tab is hidden.

All personal content, project stories, and publications remain readable without JavaScript. JavaScript supplies animations, filters, color-theme controls, and the mobile menu. The site has no runtime dependencies or external font requests.

## Browser verification

Check publication search, year selection, empty search results, project navigation, article paper links, pause/replay controls, and both color themes. At mobile widths, check the menu and horizontal overflow. Use the public deployment URL to verify the result after the GitHub run succeeds; a local build alone does not establish that it is live.
