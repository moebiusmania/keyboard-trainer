import { suona } from "../../lib/suoni.js";
import { ascoltaTasti } from "../input.js";
import { formattaTempo, partenza } from "./partenza.js";
import { testoInCaselle } from "./scrivi.js";

/** Contro il tempo: più parole possibile prima che scada il cronometro. */
export async function cronometro(passo, ctx) {
  const parole = passo.parole.map(String);
  const durata = passo.durata ?? 60;
  const sequenza = [];
  for (let k = 0; k < 120; k++) {
    let p;
    do p = parole[Math.floor(Math.random() * parole.length)];
    while (p === sequenza.at(-1));
    sequenza.push(p);
  }
  const testo = [...sequenza.join(" ")];

  ctx.area.innerHTML = `
    <div class="esercizio esercizio-cronometro">
      <div class="nastro"><p class="da-scrivere nastro-testo">${testoInCaselle(testo.join(""))}</p></div>
    </div>`;
  const nastro = ctx.area.querySelector(".nastro");
  const riga = ctx.area.querySelector(".nastro-testo");
  const caselle = [...riga.querySelectorAll(".car")];
  ctx.hud.mostra(["tempo"]);
  ctx.hud.imposta("tempo", formattaTempo(durata));

  let i = 0;
  const scorri = () => {
    caselle.forEach((c, k) => c.classList.toggle("attuale", k === i));
    const x = caselle[i].offsetLeft - nastro.clientWidth * 0.3;
    riga.style.translate = `${-Math.max(0, x)}px 0`;
  };
  scorri();

  if (!(await partenza(ctx, ctx.testi.cronometro_pronti))) return { corretti: 0, errori: 0, tempo: 0 };

  return new Promise((fine) => {
    const inizio = performance.now();
    let corretti = 0;
    let errori = 0;
    let fatte = 0;
    let finito = false;

    const termina = () => {
      if (finito) return;
      finito = true;
      smetti();
      ctx.tastiera.pulisci();
      ctx.reagisci(ctx.testi.tempo_scaduto, "oh");
      fine({ corretti, errori, tempo: durata * 1000, parole: fatte });
    };
    ctx.segnale.addEventListener("abort", () => {
      finito = true;
      fine({ corretti, errori, tempo: 0 });
    }, { once: true });

    const orologio = () => {
      if (finito) return;
      const resta = durata - (performance.now() - inizio) / 1000;
      ctx.hud.imposta("tempo", formattaTempo(resta), resta <= 10 ? "giu" : null);
      if (resta <= 0) termina();
      else setTimeout(orologio, 250);
    };
    orologio();

    const smetti = ascoltaTasti(ctx, (e) => {
      if (finito) return;
      if (e.key === testo[i]) {
        caselle[i].classList.add("fatto");
        caselle[i].classList.remove("sbagliata");
        if (testo[i] === " ") {
          fatte++;
          ctx.punteggio.bonus(15);
          suona("parola");
        } else {
          suona("tic");
        }
        i++;
        corretti++;
        ctx.punteggio.giusto();
        ctx.tastiera.premuto(e, true);
        ctx.tastiera.pulisci();
        if (i >= testo.length) return termina();
        scorri();
      } else {
        errori++;
        ctx.punteggio.sbagliato();
        ctx.tastiera.premuto(e, false);
        ctx.tastiera.evidenzia(testo[i]);
        const c = caselle[i];
        c.classList.remove("sbagliata");
        void c.offsetWidth;
        c.classList.add("sbagliata");
        suona("errore");
      }
    });
  });
}
