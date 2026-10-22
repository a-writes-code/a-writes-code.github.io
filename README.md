# Aritra Das — personal website

A personal website for research at the intersection of physics and AI. It brings the content from Aritra’s Google Site into a responsive website for GitHub Pages. Visitors can explore a loss landscape, filter research interests, expand course history, switch color themes, and copy the contact email.

## Preview

Use Node.js 22 or newer. No package installation is required.

```sh
cd /Users/aritradas/Academic/Random/personal-website
npm start
```

Open <http://127.0.0.1:4173>. To choose another port, use `PORT=4174 npm start`. Press Ctrl+C to stop the server.

## Edit

| File                          | Purpose                                                            |
| ----------------------------- | ------------------------------------------------------------------ |
| `index.html`                  | All personal content, links, research topics, and teaching history |
| `assets/style.css`            | Layout, palette, typography, and responsive breakpoints            |
| `assets/main.js`              | Theme, navigation, research filters, and email copy                |
| `assets/landscape.js`         | Loss function, gradient descent, and canvas drawing                |
| `assets/portrait.jpg`         | Profile photograph                                                 |
| `scripts/serve.mjs`           | Local preview server                                               |
| `scripts/build.mjs`           | Copies the public site into `dist/`                                |
| `tests/site.test.mjs`         | Public HTTP and numerical smoke tests                              |

Edit personal content in `index.html`. Keep the existing element IDs when changing text. Research filters use each card’s `data-topics` attribute. The loss function and its analytic gradient must agree. The photograph is cropped with CSS; the source image is unchanged.

## Validate and build

```sh
npm run check
```

This checks JavaScript syntax, runs the smoke tests, and builds `dist/`. The expected result is four passing tests and `Built static website in dist/`. The HTTP tests need permission to open a local port.

The tests fetch the page and its local assets from both `/` and `/personal-website/`. They check internal navigation, missing files, and path traversal protection. The numerical check compares the analytic gradient with finite differences. It also checks that descent lowers loss at the slider’s minimum, default, and maximum rates.

The source has no third-party runtime dependencies or external font requests. All personal content remains readable without JavaScript. JavaScript is required for the canvas, filters, theme control, mobile menu, and clipboard button. The standard navigation and native expandable sections work without it.

## GitHub Pages

The remote is the existing repository, `a-writes-code/a-writes-code.github.io`. This checkout uses a separate `codex/interactive-site` branch based on its `main` history. The previous Hugo site remains in Git history and in the original local checkout at `/Users/aritradas/Academic/website/research`.

After GitHub sign-in, publish the branch:

```sh
gh auth login
git push -u origin codex/interactive-site
```

Review the site before merging this branch into `main`. In the repository’s **Settings → Pages**, select **Deploy from a branch**, choose **main**, and use **/ (root)**. The `.nojekyll` file tells Pages to serve the static files directly. No custom Actions workflow or extra OAuth workflow permission is required. The expected public URL is <https://a-writes-code.github.io/>. That URL is the deployment target; a local build does not prove that it is live.

Use the repository’s Actions tab to inspect the Pages deployment status. Run `npm run check` before pushing updates. GitHub Pages serves the source files directly; `dist/` is an optional portable copy for other static hosts. Links use relative paths, so the same built files can also be hosted below a repository subpath.

## Content and assets

Personal information was adapted from these pages on 22 October 2026:

- [Welcome](https://sites.google.com/view/aritra-das-phys-ai/page)
- [Research](https://sites.google.com/view/aritra-das-phys-ai/research)
- [Teaching](https://sites.google.com/view/aritra-das-phys-ai/teaching)
- [Skills](https://sites.google.com/view/aritra-das-phys-ai/skills)
- [Off the clock](https://sites.google.com/view/aritra-das-phys-ai/off-the)
- [Contact](https://sites.google.com/view/aritra-das-phys-ai/contact)

The portrait was copied from the existing local site’s `assets/images/authors/profile.jpg`. The original file was not changed. Research diagrams and the loss landscape were created for this site. The landscape is an illustrative mathematical sketch, not an experimental result. Publication and CV links point to the existing Google Scholar and Google Drive destinations. No publication titles, awards, dates, or results were invented.

The original Google Site and the older local Hugo checkout were left unchanged. This branch replaces the Hugo implementation with a static website. Its build requires Node.js but does not require Hugo, Go, npm packages, a backend, API credentials, or a paid service.

## Browser checks

Check the light and dark themes, research filters, expandable details, simulation pause/restart, slider keyboard input, and email copy. At mobile widths, check that the menu opens, closes after navigation, and closes with Escape. Check that no content causes horizontal scrolling. Reduced-motion preferences stop automatic simulation playback. Animation also pauses when the figure is outside the viewport or the tab is hidden.
