import lume from "lume/mod.ts";
import basePath from "lume/plugins/base_path.ts";

const site = lume({
  src: "./src",
  location: new URL("https://example.com/"),
});

// Static files: vanilla CSS and native JS modules, copied as they are
site.add("styles");
site.add("js");
site.add("favicon.svg");
site.add("social-preview.png");

// If the site is published in a subfolder (e.g. GitHub Pages),
// prepends the `location` path to the absolute links in the HTML
site.use(basePath());

// Serializes data for <script type="application/json"> without breaking the HTML
site.filter("json", (value: unknown) =>
  JSON.stringify(value ?? null)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026"));

// Content-only files (slides, lessons, levels, interface texts)
// are Markdown pages that `search` can find, but they are not published.
site.process([".html"], (_pages, allPages) => {
  for (let i = allPages.length - 1; i >= 0; i--) {
    if (allPages[i].data.contentOnly) allPages.splice(i, 1);
  }
});

export default site;
