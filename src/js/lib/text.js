const ENTITIES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ENTITIES[c]);

/** Minimal Markdown for short texts: **bold** and *italic* */
export const inline = (s) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");

/** Replaces {name} placeholders with the values */
export const fill = (s, data = {}) => String(s ?? "").replace(/\{(\w+)\}/g, (_, k) => data[k] ?? "");

export const pick = (list) => list[Math.floor(Math.random() * list.length)];

export function element(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export const pause = (ms, signal) =>
  new Promise((ok) => {
    const id = setTimeout(ok, ms);
    signal?.addEventListener("abort", () => {
      clearTimeout(id);
      ok();
    }, { once: true });
  });

export function starsHtml(n, animate = false) {
  return `<span class="stars${animate ? " stars--animate" : ""}" aria-hidden="true">${
    [0, 1, 2].map((i) => `<span class="star${i < n ? " filled" : ""}" style="--i:${i}">★</span>`).join("")
  }</span>`;
}
