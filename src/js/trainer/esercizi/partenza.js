import { esc, inline, pausa } from "../../lib/testo.js";
import { suona } from "../../lib/suoni.js";
import { attendiContinua } from "../input.js";

/** Schermata "pronti?" seguita dal conto alla rovescia 3, 2, 1, Via! */
export async function partenza(ctx, messaggio) {
  ctx.dice(inline(messaggio));
  const velo = document.createElement("div");
  velo.className = "partenza";
  velo.innerHTML = `
    <button type="button" class="bottone bottone--grande bottone--tinta">${esc(ctx.testi.via)}</button>
    <p class="suggerimento-tasti">${esc(ctx.testi.premi_per_continuare)}</p>`;
  ctx.area.querySelector(".esercizio")?.append(velo);
  if (!(await attendiContinua(ctx, velo.querySelector("button")))) return false;

  for (const n of ["3", "2", "1", ctx.testi.via]) {
    velo.innerHTML = `<span class="conto">${esc(n)}</span>`;
    suona(n === ctx.testi.via ? "ding" : "tic");
    await pausa(650, ctx.segnale);
    if (ctx.segnale.aborted) return false;
  }
  velo.remove();
  return true;
}

export const formattaTempo = (secondi) => {
  const s = Math.max(0, Math.ceil(secondi));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
