# Edit a project page

Open a project on the website. Select **Edit this page on GitHub** in the footer. Sign in as `a-writes-code`, change the text, and select **Commit changes**. Commit to `main` to publish. GitHub then builds and deploys the page. Check the repository's Actions tab for completion or errors.

You can also open the [project text folder](https://github.com/a-writes-code/a-writes-code.github.io/tree/main/content/projects). Each `.md` file contains one article:

- `homid.md`
- `learning-to-grok.md`
- `modular-polynomials.md`
- `cellular-automata.md`
- `grokking-with-noise.md`
- `fractionalized-holes.md`

The first `#` heading becomes the page title. The first paragraph becomes the introduction next to the animation. Everything after it is the article body. You can replace the body, add sections, and remove sections. The takeaway and glossary are ordinary text that you can change or delete.

```markdown
# My project title

An introductory paragraph about the question and why it matters.

## The question

Write paragraphs with a blank line between them. Use _italics_ or **bold**.

## What we tested

- First experiment.
- Second experiment.

[Read the paper](https://arxiv.org/abs/2510.01335)

![A short description of the figure](../../assets/my-figure.png)

> A qualification or a key finding.

## What we learned

Add as much text as you need.
```

Headings, lists, links, images, block quotes, code blocks, and tables use standard Markdown. The source file previews on GitHub. Relative image URLs are resolved from the published page at `projects/<slug>/`; use `../../assets/filename.png` for a file uploaded to `assets/`. Raw HTML is supported for custom figures. Use `$G/H$` for an inline equation. Use `$$` on separate lines for a displayed equation:

```latex
$$
\frac{\mathrm{SO}(3)}{\mathrm{SO}(2)} \cong S^2
$$
```

Equations render during the build with self-hosted KaTeX fonts. Invalid formulas show their source in red rather than prevent the rest of the article from publishing.

The homepage card title and summary, paper metadata, animation timing, and captions are in `content/projects.json`. The article title and body come only from the Markdown file. Most animations are in `assets/project-animations.js`; the HomID rotation sequence is in `assets/homogeneous-sphere.js`.

## If an edit does not appear

A saved Markdown edit must finish a deployment before it appears on the public website. Open [Website and Scholar refresh](https://github.com/a-writes-code/a-writes-code.github.io/actions/workflows/site.yml) and look for a run after your commit. Wait for both **build** and **deploy** to finish. If no run starts, select **Run workflow**, choose `main`, and run it manually. Then refresh the website. A hard refresh can clear an older browser copy.

The workflow uses the latest `main` source when it starts. Scheduled publication refreshes preserve the Markdown files. Do not copy old generated HTML over a newer article.

Do not edit `projects/*/index.html` or the generated sections in `index.html`. Builds regenerate those files from the source. Scholar refreshes update publication data and preserve your Markdown text.

For a local preview after editing:

```sh
npm ci --ignore-scripts
npm run check
npm start
```

Open <http://127.0.0.1:4173>. If a build reports `Start each project article with a # Title`, restore the first heading and commit the correction. A failed build does not replace the published website.
