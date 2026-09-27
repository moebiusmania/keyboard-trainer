const ENTITA = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ENTITA[c]);

/** Markdown minimo per i testi brevi: **grassetto** e *corsivo* */
export const inline = (s) =>
  esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");

/** Sostituisce i segnaposto {nome} con i valori */
export const riempi = (s, dati = {}) => String(s ?? "").replace(/\{(\w+)\}/g, (_, k) => dati[k] ?? "");

export const aCaso = (lista) => lista[Math.floor(Math.random() * lista.length)];

export function elemento(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export const pausa = (ms, segnale) =>
  new Promise((ok) => {
    const id = setTimeout(ok, ms);
    segnale?.addEventListener("abort", () => {
      clearTimeout(id);
      ok();
    }, { once: true });
  });

export function stelleHtml(n, animate = false) {
  return `<span class="stelle${animate ? " stelle--animate" : ""}" aria-hidden="true">${
    [0, 1, 2].map((i) => `<span class="stella${i < n ? " piena" : ""}" style="--i:${i}">★</span>`).join("")
  }</span>`;
}
