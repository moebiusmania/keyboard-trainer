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

// Installable app (PWA): manifest and icons; the service worker is sw.page.ts
site.add("manifest.webmanifest");
site.add("icons/icon-192.png");
site.add("icons/icon-512.png");
site.add("icons/icon-maskable-192.png");
site.add("icons/icon-maskable-512.png");
site.add("icons/apple-touch-icon.png");

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

// Service worker version: a hash of every published page and file.
// When a deploy changes something, sw.js changes too, and installed apps
// download the new version for offline use.
site.process(async (_pages, allPages) => {
  const sw = allPages.find((page) => page.data.url === "/sw.js");
  if (!sw) return;

  const parts: [string, Uint8Array | string][] = [];
  for (const page of allPages) {
    if (page !== sw) parts.push([page.outputPath, page.content ?? ""]);
  }
  for (const file of site.files) {
    parts.push([file.outputPath, await Deno.readFile(file.src.entry.src)]);
  }
  parts.sort(([a], [b]) => a.localeCompare(b));

  const encoder = new TextEncoder();
  const chunks = parts.flatMap(([path, content]) => [
    encoder.encode(path),
    typeof content === "string" ? encoder.encode(content) : content,
  ]);
  const bytes = new Uint8Array(await new Blob(chunks).arrayBuffer());
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  const version = Array.from(digest.slice(0, 8), (b) => b.toString(16).padStart(2, "0")).join("");

  sw.content = String(sw.content).replace("__VERSION__", version);
});

export default site;
