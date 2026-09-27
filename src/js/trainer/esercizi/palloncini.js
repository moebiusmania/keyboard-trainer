import { elemento, esc, inline, riempi } from "../../lib/testo.js";
import { suona } from "../../lib/suoni.js";
import { ascoltaTasti } from "../input.js";

const COLORI = ["rosa", "blu", "verde", "giallo", "viola", "arancio"];

/** Palloncini con una lettera: premi la lettera per farli scoppiare prima che volino via. */
export function palloncini(passo, ctx) {
  const lettere = [...String(passo.lettere)];
  const quanti = passo.quanti ?? 12;
  const volo = passo.durata ?? (ctx.modalita === "sfida" ? 5 : 8);
  const intervallo = passo.intervallo ?? volo * 220;
  if (passo.istruzione) ctx.dice(inline(passo.istruzione));

  ctx.area.innerHTML = `
    <div class="esercizio esercizio-palloncini">
      <div class="cielo">
        <span class="nuvola nuvola--1"></span>
        <span class="nuvola nuvola--2"></span>
        <span class="nuvola nuvola--3"></span>
      </div>
      <p class="contatore" aria-live="polite"></p>
    </div>`;
  const cielo = ctx.area.querySelector(".cielo");
  const contatore = ctx.area.querySelector(".contatore");

  return new Promise((fine) => {
    const vivi = [];
    let lanciati = 0;
    let presi = 0;
    let errori = 0;
    let timer;
    let ultima;
    let finito = false;
    let smetti = () => {};

    const chiudi = () => {
      if (finito) return;
      finito = true;
      smetti();
      clearTimeout(timer);
      ctx.tastiera.pulisci();
      ctx.mani.evidenzia([]);
      fine({ corretti: presi, errori, tempo: 0 });
    };
    ctx.segnale.addEventListener("abort", chiudi, { once: true });

    function aggiorna() {
      contatore.textContent = riempi(ctx.testi.palloncini_presi, { n: presi, tot: quanti });
      ctx.mani.evidenzia(ctx.tastiera.evidenzia(vivi[0]?.lettera ?? null));
      if (lanciati >= quanti && vivi.length === 0) setTimeout(chiudi, 600);
    }

    function lancia() {
      if (finito) return;
      let lettera;
      do lettera = lettere[Math.floor(Math.random() * lettere.length)];
      while (lettere.length > 1 && lettera === ultima);
      ultima = lettera;
      const el = elemento(`
        <div class="palloncino" style="--x: ${6 + Math.random() * 78}%; --volo: ${volo}s; --tinta: var(--${COLORI[lanciati % COLORI.length]}); --oscilla: ${(Math.random() * 1.5 + 1.5).toFixed(2)}s">
          <span class="palloncino-corpo">${esc(lettera)}</span>
        </div>`);
      const p = { lettera, el };
      el.addEventListener("animationend", (ev) => {
        if (ev.animationName !== "vola" || !vivi.includes(p)) return;
        vivi.splice(vivi.indexOf(p), 1);
        el.remove();
        aggiorna();
      });
      cielo.append(el);
      vivi.push(p);
      lanciati++;
      aggiorna();
      if (lanciati < quanti) timer = setTimeout(lancia, intervallo);
    }

    smetti = ascoltaTasti(ctx, (e) => {
      const p = vivi.find((v) => v.lettera === e.key);
      if (!p) {
        errori++;
        ctx.tastiera.premuto(e, false);
        ctx.punteggio?.sbagliato();
        suona("errore");
        return;
      }
      vivi.splice(vivi.indexOf(p), 1);
      presi++;
      ctx.tastiera.premuto(e, true);
      ctx.punteggio?.giusto();
      suona("pop");
      // blocca il palloncino dove si trova e lo fa scoppiare
      const y = getComputedStyle(p.el).translate;
      p.el.style.translate = y;
      p.el.classList.add("scoppiato");
      setTimeout(() => p.el.remove(), 450);
      aggiorna();
    });

    lancia();
  });
}
