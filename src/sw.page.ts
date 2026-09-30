// Service worker: makes the site installable and playable offline.
// Generated at build time so the precache lists every published page and file;
// VERSION is filled in by _config.ts with a hash of the whole site, so it changes
// (and installed apps update their offline copy) only when something is deployed.
export const url = "/sw.js";

export default function ({ search }: Lume.Data) {
  const pages = search.pages()
    .filter((page) => !page.contentOnly && page.url.endsWith("/"))
    .map((page) => page.url);

  const files = search.files()
    .filter((file) => !file.endsWith(".html") && !file.endsWith(".svg") || file === "/favicon.svg")
    .filter((file) => file !== url && file !== "/social-preview.png");

  // Paths relative to the service worker, so they also work in a subfolder
  const precache = [...pages, ...files].map((path) => "." + path);

  return `const VERSION = "__VERSION__";
const CACHE = "tasto-dopo-tasto-" + VERSION;
const FONTS = "tasto-dopo-tasto-fonts";
const PRECACHE = ${JSON.stringify(precache, null, 2)};

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE)
      // "reload" skips the HTTP cache, so the new version never saves old files
      .then((cache) => cache.addAll(PRECACHE.map((path) => new Request(path, { cache: "reload" }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key !== CACHE && key !== FONTS)
          .map((key) => caches.delete(key)),
      ))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  // Fonts: from the cache, refreshed in the background
  if (url.hostname === "fonts.bunny.net") {
    event.respondWith(
      caches.open(FONTS).then((cache) =>
        cache.match(request).then((cached) => {
          const network = fetch(request).then((response) => {
            if (response.ok || response.type === "opaque") cache.put(request, response.clone());
            return response;
          }).catch(() => cached || Response.error());
          return cached || network;
        })
      ),
    );
    return;
  }

  // Pages, styles, scripts and icons: the network first, so updates show up
  // right away (also while developing); the cache when offline
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          if (response.ok) caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(request, { ignoreSearch: true })
            .then((cached) => cached || (request.mode === "navigate" ? caches.match("./") : Response.error()))
        ),
    );
  }
});
`;
}
