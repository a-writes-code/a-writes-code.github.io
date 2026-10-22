import { marked } from "marked";

// These are trusted, repository-authored documents. Markdown can include HTML
// for custom figures. No visitor-supplied content is parsed by the website.
export function parseProjectMarkdown(source) {
  const tokens = marked.lexer(source.replace(/^\uFEFF/, ""), { gfm: true });
  while (tokens[0]?.type === "space") tokens.shift();
  const heading = tokens.shift();
  if (heading?.type !== "heading" || heading.depth !== 1)
    throw new Error("Start each project article with a # Title");
  while (tokens[0]?.type === "space") tokens.shift();
  const intro = tokens[0]?.type === "paragraph" ? tokens.shift() : null;
  return {
    title: heading.text,
    titleHtml: marked.parseInline(heading.text),
    introHtml: intro ? marked.parser([intro]) : "",
    bodyHtml: marked.parser(tokens),
  };
}
