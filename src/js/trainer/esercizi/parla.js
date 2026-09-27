import { inline, esc } from "../../lib/testo.js";
import { attendiContinua } from "../input.js";

/** Tastino spiega qualcosa; si continua con SPAZIO, INVIO o il bottone. */
export async function parla(passo, ctx) {
  ctx.dice(inline(passo.testo));
  const dita = passo.mostra != null ? ctx.tastiera.mostra(String(passo.mostra)) : (ctx.tastiera.pulisci(), []);
  ctx.mani.evidenzia(dita, false);

  ctx.area.innerHTML = `
    <div class="esercizio esercizio-parla">
      <button type="button" class="bottone bottone--grande bottone--tinta">${esc(ctx.testi.continua)} <span aria-hidden="true">→</span></button>
      <p class="suggerimento-tasti">${esc(ctx.testi.premi_per_continuare)}</p>
    </div>`;
  await attendiContinua(ctx, ctx.area.querySelector("button"));
  ctx.tastiera.pulisci();
  return { corretti: 0, errori: 0, tempo: 0 };
}
