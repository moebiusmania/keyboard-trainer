import { suona } from "../lib/suoni.js";

/**
 * Ascolta i tasti durante un esercizio. Al gestore arrivano solo i caratteri
 * stampabili (lettere, numeri, spazio, punteggiatura).
 * Restituisce una funzione per smettere di ascoltare (a esercizio finito).
 */
export function ascoltaTasti(ctx, gestisci) {
  document.activeElement?.blur?.();
  const controllo = new AbortController();
  ctx.segnale.addEventListener("abort", () => controllo.abort(), { once: true });
  document.addEventListener("keydown", (e) => {
    if (e.isComposing) return;
    if (e.target instanceof Element && e.target.closest("input, textarea, dialog")) return;
    ctx.bloccoMaiuscole(e.getModifierState?.("CapsLock") ?? false);
    if (e.ctrlKey || e.metaKey) return;
    if (e.key === " " || e.key === "Enter" || e.key === "'" || e.key === "/" || e.key === "Backspace") e.preventDefault();
    if (e.key.length !== 1) return;
    e.preventDefault();
    if (e.repeat) return;
    gestisci(e);
  }, { signal: controllo.signal });
  return () => controllo.abort();
}

/** Aspetta SPAZIO, INVIO o un clic sul bottone (dopo una breve pausa anti-rimbalzo). */
export function attendiContinua(ctx, bottone, attesa = 350) {
  return new Promise((ok) => {
    const inizio = performance.now();
    const controllo = new AbortController();
    const fatto = () => {
      if (performance.now() - inizio < attesa) return;
      controllo.abort();
      suona("pagina");
      ok(true);
    };
    const segnale = AbortSignal.any ? AbortSignal.any([controllo.signal, ctx.segnale]) : controllo.signal;
    bottone?.addEventListener("click", fatto, { signal: segnale });
    document.addEventListener("keydown", (e) => {
      if (e.target instanceof Element && e.target.closest("input, textarea, dialog")) return;
      ctx.bloccoMaiuscole(e.getModifierState?.("CapsLock") ?? false);
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!e.repeat) fatto();
      }
    }, { signal: segnale });
    ctx.segnale.addEventListener("abort", () => ok(false), { once: true });
  });
}
