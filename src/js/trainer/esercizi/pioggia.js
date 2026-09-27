import { elemento, esc } from "../../lib/testo.js";
import { suona } from "../../lib/suoni.js";
import { ascoltaTasti } from "../input.js";
import { formattaTempo, partenza } from "./partenza.js";

/** Gioco: le parole cadono dal cielo, scrivile prima che tocchino terra. */
export async function pioggia(passo, ctx) {
  const parole = passo.parole.map(String);
  const durata = passo.durata ?? 60;
  const velocita = passo.velocita ?? 1;
  let vite = passo.vite ?? 3;

  ctx.area.innerHTML = `
    <div class="esercizio esercizio-pioggia">
      <div class="cielo cielo--pioggia">
        <span class="nuvola nuvola--1"></span>
        <span class="nuvola nuvola--2"></span>
        <div class="terra"></div>
      </div>
    </div>`;
  const cielo = ctx.area.querySelector(".cielo");
  ctx.hud.mostra(["tempo", "vite"]);
  ctx.hud.imposta("tempo", formattaTempo(durata));
  ctx.hud.imposta("vite", "❤️".repeat(vite));

  if (!(await partenza(ctx, ctx.testi.pioggia_pronti))) return { corretti: 0, errori: 0, tempo: 0 };

  return new Promise((fine) => {
    const gocce = [];
    let attiva = null;
    let inizio = performance.now();
    let prossimaGoccia = 0;
    let finito = false;
    let corretti = 0;
    let errori = 0;
    let fatte = 0;

    function scegliParola() {
      const iniziali = new Set(gocce.map((g) => g.parola[0]));
      const libere = parole.filter((p) => !iniziali.has(p[0]));
      const lista = libere.length ? libere : parole;
      return lista[Math.floor(Math.random() * lista.length)];
    }

    function nuovaGoccia(trascorso) {
      const parola = scegliParola();
      const el = elemento(`
        <div class="goccia" style="--x: ${8 + Math.random() * 70}%">
          ${[...parola].map((c) => `<span>${esc(c)}</span>`).join("")}
        </div>`);
      cielo.append(el);
      const caduta = Math.max(3800, 9000 - trascorso * 45) / velocita;
      gocce.push({ parola, el, nascita: performance.now(), caduta, scritte: 0 });
    }

    function togli(g, classe) {
      gocce.splice(gocce.indexOf(g), 1);
      if (attiva === g) attiva = null;
      g.el.classList.add(classe);
      setTimeout(() => g.el.remove(), 500);
    }

    function aggiornaAiuto() {
      if (attiva) ctx.tastiera.evidenzia(attiva.parola[attiva.scritte]);
      else ctx.tastiera.pulisci();
    }

    function termina(motivo) {
      if (finito) return;
      finito = true;
      smetti();
      ctx.tastiera.pulisci();
      ctx.reagisci(motivo, "oh");
      gocce.forEach((g) => g.el.classList.add("sparita"));
      fine({ corretti, errori, tempo: (performance.now() - inizio), parole: fatte });
    }

    ctx.segnale.addEventListener("abort", () => {
      finito = true;
      fine({ corretti, errori, tempo: 0 });
    }, { once: true });

    function ciclo(ora) {
      if (finito) return;
      const trascorso = (ora - inizio) / 1000;
      const resta = durata - trascorso;
      ctx.hud.imposta("tempo", formattaTempo(resta));
      if (resta <= 0) return termina(ctx.testi.tempo_scaduto);

      if (ora >= prossimaGoccia) {
        nuovaGoccia(trascorso);
        prossimaGoccia = ora + Math.max(800, 2400 - trascorso * 22) / velocita;
      }

      for (const g of [...gocce]) {
        const p = (ora - g.nascita) / g.caduta;
        g.el.style.setProperty("--p", p.toFixed(4));
        if (p >= 1) {
          togli(g, "a-terra");
          vite--;
          ctx.punteggio.sbagliato();
          ctx.hud.imposta("vite", "❤️".repeat(vite) + "🤍".repeat(Math.max(0, (passo.vite ?? 3) - vite)), "giu");
          suona("vita");
          aggiornaAiuto();
          if (vite <= 0) return termina(ctx.testi.vite_finite);
        }
      }
      requestAnimationFrame(ciclo);
    }

    const smetti = ascoltaTasti(ctx, (e) => {
      if (finito) return;
      if (!attiva) {
        const candidate = gocce.filter((g) => g.parola[0] === e.key);
        if (candidate.length) {
          attiva = candidate.reduce((a, b) => (a.nascita < b.nascita ? a : b));
          attiva.el.classList.add("attiva");
        }
      }
      if (attiva && e.key === attiva.parola[attiva.scritte]) {
        attiva.el.children[attiva.scritte].classList.add("fatto");
        attiva.scritte++;
        corretti++;
        ctx.punteggio.giusto();
        ctx.tastiera.premuto(e, true);
        suona("tic");
        if (attiva.scritte === attiva.parola.length) {
          fatte++;
          ctx.punteggio.bonus(20 * attiva.parola.length);
          suona("pop");
          togli(attiva, "presa");
        }
      } else {
        errori++;
        ctx.punteggio.sbagliato();
        ctx.tastiera.premuto(e, false);
        suona("errore");
      }
      aggiornaAiuto();
    });

    inizio = performance.now();
    requestAnimationFrame(ciclo);
  });
}
