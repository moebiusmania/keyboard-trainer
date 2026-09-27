// Cambia il contenuto della pagina con una View Transition (se disponibile).
// La direzione finisce in html[data-direzione] e il CSS sceglie l'animazione.
const riduci = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export function transizione(aggiorna, direzione = "avanti") {
  if (!document.startViewTransition || riduci()) {
    aggiorna();
    return Promise.resolve();
  }
  const radice = document.documentElement;
  radice.dataset.direzione = direzione;
  const t = document.startViewTransition(aggiorna);
  return t.finished.catch(() => {}).finally(() => {
    if (radice.dataset.direzione === direzione) delete radice.dataset.direzione;
  });
}
