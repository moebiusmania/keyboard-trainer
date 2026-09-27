import { aCaso, esc, inline, pausa } from "../../lib/testo.js";
import { suona } from "../../lib/suoni.js";
import { ascoltaTasti } from "../input.js";

const ATTESA_AIUTO = 3000;

/** Disegna il testo come caselle, una per carattere, con le parole che non si spezzano. */
export function testoInCaselle(testo) {
  return testo
    .split(" ")
    .map((parola) =>
      `<span class="parola">${[...parola].map((c) => `<span class="car">${esc(c)}</span>`).join("")}</span>`
    )
    .join(`<span class="car car--spazio" aria-hidden="true"> </span>`);
}

/** Scrivere un testo tasto per tasto. Un errore non fa avanzare: si riprova. */
export function scrivi(passo, ctx) {
  const testo = [...String(passo.testo)];
  const aiutoTardi = passo.aiuto === "tardi" || ctx.modalita === "sfida";
  const istruzione = passo.istruzione ? inline(passo.istruzione) : null;
  if (istruzione) ctx.dice(istruzione);

  ctx.area.innerHTML = `
    <div class="esercizio esercizio-scrivi">
      <p class="da-scrivere${testo.length > 16 ? " da-scrivere--lungo" : ""}">${testoInCaselle(testo.join(""))}</p>
    </div>`;
  const caselle = [...ctx.area.querySelectorAll(".car")];

  return new Promise((fine) => {
    let i = 0;
    let corretti = 0;
    let errori = 0;
    let erroriQui = 0;
    let inizio = null;
    let timerAiuto;

    ctx.segnale.addEventListener("abort", () => {
      clearTimeout(timerAiuto);
      fine({ corretti, errori, tempo: 0 });
    }, { once: true });

    function mostraAiuto() {
      ctx.mani.evidenzia(ctx.tastiera.evidenzia(testo[i]));
    }

    function aggiorna() {
      caselle.forEach((c, k) => c.classList.toggle("attuale", k === i));
      clearTimeout(timerAiuto);
      if (aiutoTardi && erroriQui === 0) {
        ctx.tastiera.pulisci();
        ctx.mani.evidenzia([]);
        timerAiuto = setTimeout(() => {
          if (ctx.modalita !== "sfida") ctx.reagisci(ctx.testi.suggerimento);
          mostraAiuto();
        }, ATTESA_AIUTO);
      } else {
        mostraAiuto();
      }
    }

    const smetti = ascoltaTasti(ctx, async (e) => {
      if (i >= testo.length) return;
      const casella = caselle[i];
      if (e.key === testo[i]) {
        inizio ??= performance.now();
        ctx.tastiera.premuto(e, true);
        casella.classList.remove("attuale", "sbagliata");
        casella.classList.add("fatto");
        corretti++;
        erroriQui = 0;
        i++;
        ctx.punteggio?.giusto();
        suona("tic");
        if (i < testo.length) {
          aggiorna();
          return;
        }
        clearTimeout(timerAiuto);
        smetti();
        const tempo = performance.now() - inizio;
        ctx.tastiera.pulisci();
        ctx.mani.evidenzia([]);
        ctx.reagisci(aCaso(ctx.testi.bravo), "festa");
        suona("parola");
        ctx.area.querySelector(".da-scrivere")?.classList.add("completato");
        await pausa(900, ctx.segnale);
        if (istruzione) ctx.dice(istruzione);
        fine({ corretti, errori, tempo });
      } else {
        ctx.tastiera.premuto(e, false);
        errori++;
        erroriQui++;
        casella.classList.remove("sbagliata");
        void casella.offsetWidth;
        casella.classList.add("sbagliata");
        ctx.punteggio?.sbagliato();
        suona("errore");
        if (erroriQui === 1 || erroriQui % 3 === 0) ctx.reagisci(aCaso(ctx.testi.incoraggia), "oh");
        clearTimeout(timerAiuto);
        mostraAiuto();
      }
    });

    aggiorna();
  });
}
