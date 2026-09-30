import { cancella, leggi, salva } from "../lib/memoria.js";
import { suona } from "../lib/suoni.js";
import { esc, inline, riempi, stelleHtml } from "../lib/testo.js";
import { transizione } from "../lib/transizione.js";
import { creaTastiera } from "../lib/tastiera.js";
import { creaMani } from "../lib/mani.js";
import { coriandoli } from "../lib/coriandoli.js";
import { disegnaDistintivo, scaricaDistintivo } from "../lib/distintivo.js";
import { attendiContinua } from "./input.js";
import { massimoPer, Punteggio } from "./punteggio.js";
import { parla } from "./esercizi/parla.js";
import { scrivi } from "./esercizi/scrivi.js";
import { palloncini } from "./esercizi/palloncini.js";
import { pioggia } from "./esercizi/pioggia.js";
import { cronometro } from "./esercizi/cronometro.js";

const ESERCIZI = { parla, scrivi, palloncini, pioggia, cronometro };

const dati = JSON.parse(document.getElementById("dati-trainer").textContent);
const { modalita, testi, lezioni } = dati;
const sfida = modalita === "sfida";
const app = document.getElementById("app");
const mascotteHtml = document.getElementById("tpl-mascotte").innerHTML;
const chiaveProgressi = `${dati.area}:progressi`;

const progressi = () => leggi(chiaveProgressi, {});
const nome = () => leggi("nome", "");
const introDi = (lezione) => document.querySelector(`template[data-intro="${lezione.ordine}"]`)?.innerHTML ?? "";
const sbloccata = (lezione, p = progressi()) => lezione.ordine === lezioni[0].ordine || Boolean(p[lezioni[lezioni.indexOf(lezione) - 1]?.ordine]);

/* ============================================================
   Mappa delle lezioni
   ============================================================ */

function tappaHtml(lezione, i, p, prossima) {
  const fatto = p[lezione.ordine];
  const aperta = sbloccata(lezione, p);
  const stato = fatto ? "completata" : aperta ? "aperta" : "bloccata";
  const tasti = sfida
    ? `<span class="etichetta">${esc(lezione.nuovi_tasti)}</span>`
    : String(lezione.nuovi_tasti ?? "").split(" ").filter(Boolean).map((t) => `<kbd>${esc(t)}</kbd>`).join(" ");
  const risultato = fatto
    ? `<p class="tappa-risultato">${stelleHtml(fatto.stelle)}<span class="visivamente-nascosto">${riempi(testi.stelle_etichetta, { n: fatto.stelle })}</span>
       ${sfida ? `<span class="etichetta">🏅 ${fatto.punti.toLocaleString("it-IT")}</span>` : ""}</p>`
    : "";
  return `
    <li class="tappa tappa--${stato}${lezione === prossima ? " tappa--prossima" : ""}" style="--i: ${i}">
      <button type="button" class="tappa-bottone" data-lezione="${lezione.ordine}" aria-describedby="info-${lezione.ordine}"
        aria-label="${esc(testi.lezione)} ${lezione.ordine}: ${esc(lezione.titolo)}${aperta ? "" : ` (${esc(testi.bloccata)})`}">
        <span class="tappa-emoji" aria-hidden="true">${lezione.emoji ?? "⭐"}</span>
        <span class="tappa-numero" aria-hidden="true">${lezione.ordine}</span>
        ${aperta ? "" : `<span class="tappa-lucchetto" aria-hidden="true">🔒</span>`}
        ${fatto ? `<span class="tappa-spunta" aria-hidden="true">✓</span>` : ""}
      </button>
      <div class="tappa-info" id="info-${lezione.ordine}">
        <h3><span class="tappa-etichetta">${esc(testi.lezione)} ${lezione.ordine}</span> ${esc(lezione.titolo)}</h3>
        <p>${esc(lezione.obiettivo)}</p>
        <p class="tappa-tasti"><span>${esc(testi.nuovi_tasti)}</span> ${tasti}</p>
        ${risultato}
      </div>
    </li>`;
}

function salutoHtml() {
  const n = nome();
  if (n) {
    return `<p>${esc(riempi(testi.saluto, { nome: n }))}</p>
      <button type="button" class="bottone-link" data-azione="cambia-nome">${esc(riempi(testi.cambia_nome, { nome: n }))}</button>`;
  }
  return `
    <form class="form-nome">
      <label for="nome-giocatore">${esc(testi.chiedi_nome)}</label>
      <div class="form-nome-riga">
        <input id="nome-giocatore" name="nome" maxlength="18" autocomplete="off" spellcheck="false" placeholder="${esc(testi.nome_segnaposto)}">
        <button class="bottone bottone--tinta">${esc(testi.nome_ok)}</button>
      </div>
    </form>`;
}

function bachecaHtml(p) {
  const righe = lezioni.filter((l) => p[l.ordine]);
  if (!righe.length) return `<section class="bacheca"><h2>🏆 ${esc(testi.bacheca_titolo)}</h2><p>${esc(testi.bacheca_vuota)}</p></section>`;
  const totale = righe.reduce((s, l) => s + p[l.ordine].punti, 0);
  const stelle = righe.reduce((s, l) => s + p[l.ordine].stelle, 0);
  return `
    <section class="bacheca">
      <h2>🏆 ${esc(testi.bacheca_titolo)}</h2>
      <div class="bacheca-totali">
        <p><span>${esc(testi.bacheca_totale)}</span><strong>${totale.toLocaleString("it-IT")}</strong></p>
        <p><span>${esc(testi.bacheca_stelle)}</span><strong>${stelle} / ${lezioni.length * 3}</strong></p>
      </div>
      <ol class="bacheca-elenco" role="list">
        ${righe.map((l) => `
          <li><span aria-hidden="true">${l.emoji}</span> <span class="bacheca-nome">${esc(l.titolo)}</span>
          ${stelleHtml(p[l.ordine].stelle)} <strong>${p[l.ordine].punti.toLocaleString("it-IT")}</strong></li>`).join("")}
      </ol>
      <button type="button" class="bottone-link" data-azione="azzera">${esc(testi.bacheca_azzera)}</button>
    </section>`;
}

function mostraMappa(direzione = "indietro") {
  const p = progressi();
  const prossima = lezioni.find((l) => !p[l.ordine] && sbloccata(l, p));
  const distintivo = !sfida && leggi("distintivo");

  return transizione(() => {
    app.innerHTML = `
      <div class="schermo schermo-mappa">
        <div class="benvenuto">
          ${mascotteHtml}
          <div class="fumetto fumetto--sinistra benvenuto-fumetto" aria-live="polite">${salutoHtml()}</div>
        </div>
        <div class="mappa-testa">
          <h2>${esc(testi.mappa_titolo)}</h2>
          <p>${esc(testi.mappa_sottotitolo)}</p>
        </div>
        <div class="mappa">
          <svg class="sentiero" aria-hidden="true"><path class="sentiero-base" /><path class="sentiero-fatto" pathLength="1" /></svg>
          <ol class="tappe" role="list">${lezioni.map((l, i) => tappaHtml(l, i, p, prossima)).join("")}</ol>
        </div>
        ${distintivo ? `<p class="apri-distintivo"><button type="button" class="bottone bottone--grande bottone--giallo" data-azione="distintivo">🏅 ${esc(testi.badge.apri)}</button></p>` : ""}
        ${sfida ? bachecaHtml(p) : ""}
      </div>`;
    disegnaSentiero();
  }, direzione);
}

/** Disegna il sentiero curvo che unisce le tappe */
function disegnaSentiero() {
  const mappa = app.querySelector(".mappa");
  if (!mappa) return;
  const svg = mappa.querySelector(".sentiero");
  // Misure di layout (offset*) e non getBoundingClientRect: le tappe sono ancora
  // spostate e rimpicciolite dall'animazione d'ingresso quando il sentiero viene disegnato
  const box = { width: mappa.offsetWidth, height: mappa.offsetHeight };
  const punti = [...mappa.querySelectorAll(".tappa-bottone")].map((b) => {
    let x = b.offsetWidth / 2;
    let y = b.offsetHeight / 2;
    for (let el = b; el && el !== mappa; el = el.offsetParent) {
      x += el.offsetLeft;
      y += el.offsetTop;
    }
    return { x, y };
  });
  if (!punti.length) return;
  const percorso = (lista) =>
    lista.reduce((d, p, i) => {
      if (i === 0) return `M${p.x} ${p.y}`;
      const q = lista[i - 1];
      const my = (q.y + p.y) / 2;
      return `${d} C${q.x} ${my} ${p.x} ${my} ${p.x} ${p.y}`;
    }, "");
  svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
  svg.querySelector(".sentiero-base").setAttribute("d", percorso(punti));
  const p = progressi();
  const fatte = lezioni.findIndex((l) => !p[l.ordine]);
  const quante = fatte === -1 ? punti.length : fatte + 1;
  svg.querySelector(".sentiero-fatto").setAttribute("d", quante > 1 ? percorso(punti.slice(0, quante)) : "");
}

new ResizeObserver(() => disegnaSentiero()).observe(app);

app.addEventListener("submit", (e) => {
  const form = e.target.closest(".form-nome");
  if (!form) return;
  e.preventDefault();
  const valore = new FormData(form).get("nome").toString().trim();
  if (valore) salva("nome", valore);
  suona("ding");
  const fumetto = app.querySelector(".benvenuto-fumetto");
  fumetto.innerHTML = valore ? salutoHtml() : `<p>${esc(testi.saluto_anonimo)}</p>`;
  app.querySelector(".benvenuto .mascotte")?.setAttribute("data-umore", "festa");
  app.querySelector(".tappa--prossima .tappa-bottone, .tappa--aperta .tappa-bottone")?.focus();
});

app.addEventListener("click", (e) => {
  const bottone = e.target.closest("button");
  if (!bottone) return;

  if (bottone.dataset.lezione) {
    const lezione = lezioni.find((l) => String(l.ordine) === bottone.dataset.lezione);
    if (sbloccata(lezione)) {
      suona("pagina");
      eseguiLezione(lezione);
    } else {
      suona("errore");
      const tappa = bottone.closest(".tappa");
      tappa.classList.remove("scuoti");
      void tappa.offsetWidth;
      tappa.classList.add("scuoti");
      const fumetto = app.querySelector(".benvenuto-fumetto");
      fumetto.innerHTML = `<p>🔒 ${esc(testi.bloccata)}</p>`;
      app.querySelector(".benvenuto .mascotte")?.setAttribute("data-umore", "oh");
    }
    return;
  }

  switch (bottone.dataset.azione) {
    case "cambia-nome":
      cancella("nome");
      app.querySelector(".benvenuto-fumetto").innerHTML = salutoHtml();
      app.querySelector("#nome-giocatore")?.focus();
      break;
    case "distintivo":
      apriDistintivo(false);
      break;
    case "azzera":
      if (confirm(testi.bacheca_conferma)) {
        cancella(chiaveProgressi);
        mostraMappa();
      }
      break;
  }
});

/* ============================================================
   Una lezione
   ============================================================ */

function creaHud(elemento) {
  const voci = sfida ? ["punti", "combo", "tempo", "vite"] : [];
  elemento.innerHTML = voci.map((v) => `
    <p class="hud-voce hud-voce--${v}" data-hud="${v}" ${["tempo", "vite"].includes(v) ? "hidden" : ""}>
      <span class="hud-etichetta">${esc(testi.hud?.[v] ?? v)}</span>
      <strong class="hud-valore"></strong>
    </p>`).join("");
  return {
    imposta(voce, valore, effetto) {
      const el = elemento.querySelector(`[data-hud="${voce}"]`);
      if (!el) return;
      el.querySelector(".hud-valore").textContent = valore;
      if (effetto) {
        el.classList.remove("su", "giu");
        void el.offsetWidth;
        el.classList.add(effetto);
      }
    },
    mostra(quali) {
      elemento.querySelectorAll("[data-hud]").forEach((el) => {
        if (["tempo", "vite"].includes(el.dataset.hud)) el.hidden = !quali.includes(el.dataset.hud);
      });
    },
  };
}

async function eseguiLezione(lezione) {
  const controllo = new AbortController();
  const indice = lezioni.indexOf(lezione);
  const passi = lezione.passi ?? [];

  await transizione(() => {
    app.innerHTML = `
      <div class="schermo schermo-lezione">
        <div class="lezione-barra">
          <button type="button" class="bottone bottone--piccolo" data-esci>← ${esc(testi.esci)}</button>
          <p class="lezione-nome"><span aria-hidden="true">${lezione.emoji}</span> ${esc(testi.lezione)} ${lezione.ordine}: ${esc(lezione.titolo)}</p>
          <div class="progresso" role="progressbar" aria-label="${esc(testi.passo)}" aria-valuemin="0" aria-valuemax="${passi.length}" aria-valuenow="0">
            <span class="progresso-riempi"></span>
          </div>
        </div>
        ${sfida ? `<div class="hud"></div>` : ""}
        <div class="palco">
          <div class="palco-mascotte">
            ${mascotteHtml}
            <div class="fumetto fumetto--sinistra palco-fumetto" aria-live="polite"></div>
          </div>
          <div class="palco-esercizio"></div>
        </div>
        <p class="avviso-maiusc" role="alert" hidden>⚠️ ${esc(testi.bloc_maiusc)}</p>
        <div class="strumenti">
          <div class="strumenti-tastiera"></div>
          <div class="strumenti-mani"></div>
        </div>
      </div>`;
  }, "avanti");

  const schermo = app.querySelector(".schermo-lezione");
  const mascotte = schermo.querySelector(".mascotte");
  const fumetto = schermo.querySelector(".palco-fumetto");
  const avvisoMaiusc = schermo.querySelector(".avviso-maiusc");
  const progresso = schermo.querySelector(".progresso");
  let testoBase = "";
  let timerReazione;

  const dice = (html, umore = "felice") => {
    testoBase = html;
    clearTimeout(timerReazione);
    fumetto.innerHTML = html;
    fumetto.animate?.([{ scale: 0.85, opacity: 0.4 }, { scale: 1, opacity: 1 }], { duration: 350, easing: "cubic-bezier(.3,1.6,.5,1)" });
    mascotte.dataset.umore = umore;
  };

  const ctx = {
    modalita,
    testi,
    area: schermo.querySelector(".palco-esercizio"),
    segnale: controllo.signal,
    tastiera: creaTastiera(schermo.querySelector(".strumenti-tastiera")),
    mani: creaMani(schermo.querySelector(".strumenti-mani"), dati.dita, testi),
    hud: sfida ? creaHud(schermo.querySelector(".hud")) : { imposta() {}, mostra() {} },
    punteggio: null,
    dice,
    /** Una reazione passeggera: dopo un po' torna il messaggio di prima */
    reagisci(html, umore = "felice") {
      clearTimeout(timerReazione);
      fumetto.innerHTML = html;
      mascotte.dataset.umore = umore;
      fumetto.animate?.([{ rotate: "-3deg" }, { rotate: "3deg" }, { rotate: "0deg" }], { duration: 300 });
      timerReazione = setTimeout(() => {
        fumetto.innerHTML = testoBase;
        mascotte.dataset.umore = "felice";
      }, 1800);
    },
    bloccoMaiuscole(attivo) {
      avvisoMaiusc.hidden = !attivo;
    },
  };
  if (sfida) ctx.punteggio = new Punteggio(ctx.hud);
  controllo.signal.addEventListener("abort", () => clearTimeout(timerReazione));

  schermo.querySelector("[data-esci]").addEventListener("click", () => {
    controllo.abort();
    suona("pagina");
    mostraMappa();
  });

  const aggiornaProgresso = (n) => {
    progresso.style.setProperty("--progresso", n / Math.max(1, passi.length));
    progresso.setAttribute("aria-valuenow", n);
  };

  // Introduzione della lezione
  dice(introDi(lezione) || inline(lezione.obiettivo));
  ctx.area.innerHTML = `
    <div class="esercizio esercizio-parla esercizio-intro">
      <span class="intro-emoji" aria-hidden="true">${lezione.emoji}</span>
      <button type="button" class="bottone bottone--grande bottone--tinta">${esc(testi.inizia)} <span aria-hidden="true">→</span></button>
      <p class="suggerimento-tasti">${esc(testi.premi_per_continuare)}</p>
    </div>`;
  if (!(await attendiContinua(ctx, ctx.area.querySelector("button")))) return;

  const totale = { corretti: 0, errori: 0, tempo: 0, parole: 0 };
  for (const [i, passo] of passi.entries()) {
    if (controllo.signal.aborted) return;
    aggiornaProgresso(i);
    const esercizio = ESERCIZI[passo.tipo];
    if (!esercizio) continue;
    ctx.hud.mostra([]);
    const r = await esercizio(passo, ctx);
    totale.corretti += r.corretti ?? 0;
    totale.errori += r.errori ?? 0;
    totale.tempo += r.tempo ?? 0;
    totale.parole += r.parole ?? 0;
  }
  if (controllo.signal.aborted) return;
  aggiornaProgresso(passi.length);
  controllo.abort();
  // punteggio perfetto possibile nei livelli di sola scrittura (per le stelle)
  const massimo = massimoPer(passi.filter((p) => p.tipo === "scrivi").reduce((n, p) => n + [...String(p.testo)].length, 0));
  mostraFine(lezione, indice, totale, ctx.punteggio, massimo);
}

/* ============================================================
   Fine lezione / livello
   ============================================================ */

function calcolaStelle(lezione, totale, punteggio, massimo) {
  const precisione = totale.corretti + totale.errori ? totale.corretti / (totale.corretti + totale.errori) : 1;
  if (!sfida) return precisione >= 0.95 ? 3 : precisione >= 0.85 ? 2 : 1;
  const soglie = lezione.stelle ?? [0.3 * massimo, 0.6 * massimo, 0.85 * massimo];
  return 1 + soglie.slice(1).filter((s) => punteggio.punti >= s).length;
}

function mostraFine(lezione, indice, totale, punteggio, massimo) {
  const precisione = totale.corretti + totale.errori ? Math.round((totale.corretti / (totale.corretti + totale.errori)) * 100) : 100;
  const minuti = totale.tempo / 60000;
  const velocita = minuti > 0 ? Math.round(totale.corretti / 5 / minuti) : 0;

  // Le stelle premiano la precisione (e le combo): il bonus velocità arriva dopo
  const stelle = calcolaStelle(lezione, totale, punteggio, massimo);
  if (punteggio && velocita) punteggio.bonus(Math.min(velocita, 60) * 10);

  const tutti = progressi();
  const prima = tutti[lezione.ordine];
  const punti = punteggio?.punti ?? 0;
  const record = sfida && (!prima || punti > prima.punti);
  tutti[lezione.ordine] = {
    stelle: Math.max(stelle, prima?.stelle ?? 0),
    punti: Math.max(punti, prima?.punti ?? 0),
  };
  salva(chiaveProgressi, tutti);

  const prossima = lezioni[indice + 1];
  const fineTesto = sfida
    ? riempi(testi.fine_testo, { precisione, velocita })
    : riempi(testi.fine_testo, { tasti: totale.corretti, precisione });

  transizione(() => {
    app.innerHTML = `
      <div class="schermo schermo-fine">
        <div class="fine-scheda">
          <div class="fine-mascotte">${mascotteHtml}</div>
          <h2>${esc(testi.fine_titolo)}</h2>
          <p class="fine-stelle">${stelleHtml(stelle, true)}<span class="visivamente-nascosto">${riempi(testi.stelle_etichetta, { n: stelle })}</span></p>
          ${sfida ? `
            <p class="fine-punti"><span>${esc(testi.punteggio)}</span><strong data-conta="${punti}">0</strong></p>
            ${record ? `<p class="fine-record">🎉 ${esc(testi.record)}</p>` : `<p class="fine-record-vecchio">${esc(riempi(testi.record_precedente, { punti: prima.punti.toLocaleString("it-IT") }))}</p>`}
          ` : ""}
          <p class="fine-testo">${esc(fineTesto)}</p>
          <div class="fine-bottoni">
            ${prossima && !lezione.finale ? `<button type="button" class="bottone bottone--grande bottone--tinta" data-vai="${prossima.ordine}">${esc(testi.prossima)} →</button>` : ""}
            <button type="button" class="bottone" data-vai="${lezione.ordine}">↻ ${esc(testi.rifai)}</button>
            <button type="button" class="bottone" data-mappa>${esc(testi.alla_mappa)}</button>
          </div>
        </div>
      </div>`;
    app.querySelector(".mascotte").dataset.umore = "festa";
  }, "avanti").then(() => {
    suona("vittoria");
    coriandoli({ quanti: 60 + stelle * 40 });
    const conta = app.querySelector("[data-conta]");
    if (conta) contaNumero(conta, Number(conta.dataset.conta));
    if (lezione.finale && !sfida) setTimeout(() => apriDistintivo(true), 1400);
  });
}

app.addEventListener("click", (e) => {
  const vai = e.target.closest(".schermo-fine [data-vai]");
  if (vai) {
    eseguiLezione(lezioni.find((l) => String(l.ordine) === vai.dataset.vai));
    return;
  }
  if (e.target.closest(".schermo-fine [data-mappa]")) mostraMappa();
});

function contaNumero(el, fino) {
  const inizio = performance.now();
  const durata = 1200;
  const passo = (ora) => {
    const t = Math.min(1, (ora - inizio) / durata);
    el.textContent = Math.round(fino * (1 - (1 - t) ** 3)).toLocaleString("it-IT");
    if (t < 1) requestAnimationFrame(passo);
  };
  requestAnimationFrame(passo);
}

/* ============================================================
   Distintivo finale
   ============================================================ */

async function apriDistintivo(nuovo) {
  const b = testi.badge;
  let salvato = leggi("distintivo");
  if (nuovo || !salvato) {
    salvato = {
      animale: Math.floor(Math.random() * b.animali.length),
      data: new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }),
    };
    salva("distintivo", salvato);
  }
  const n = nome();

  let finestra = document.querySelector(".finestra-distintivo");
  finestra?.remove();
  finestra = document.createElement("dialog");
  finestra.className = "finestra finestra-distintivo";
  finestra.setAttribute("aria-labelledby", "titolo-distintivo");
  finestra.innerHTML = `
    <h2 id="titolo-distintivo">${esc(b.titolo)}</h2>
    <p>${esc(riempi(b.testo, { nome: n || b.senza_nome }))}</p>
    <canvas class="distintivo" width="800" height="800" role="img"></canvas>
    <div class="finestra-bottoni">
      <button type="button" class="bottone bottone--giallo" data-d="scarica">⬇ ${esc(b.scarica)}</button>
      <button type="button" class="bottone" data-d="nuovo">🎲 ${esc(b.nuovo)}</button>
      <button type="button" class="bottone" data-d="chiudi">${esc(b.chiudi)}</button>
    </div>
    <p class="finestra-invito"><a href="${esc(b.sfida_url)}">${esc(b.sfida_invito)} →</a></p>`;
  document.body.append(finestra);
  const tela = finestra.querySelector("canvas");

  const disegna = async () => {
    const animale = b.animali[salvato.animale % b.animali.length];
    tela.setAttribute("aria-label", `${animale.emoji} ${animale.titolo} – ${n || b.senza_nome} – ${salvato.data}`);
    await disegnaDistintivo(tela, {
      intestazione: b.intestazione,
      animale,
      conferito: b.conferito,
      nome: n || b.senza_nome,
      data: salvato.data,
    });
  };
  await disegna();

  finestra.addEventListener("click", async (e) => {
    const azione = e.target.closest("[data-d]")?.dataset.d;
    if (e.target === finestra || azione === "chiudi") finestra.close();
    if (azione === "scarica") scaricaDistintivo(tela, b.nome_file);
    if (azione === "nuovo") {
      salvato.animale = (salvato.animale + 1) % b.animali.length;
      salva("distintivo", salvato);
      tela.animate?.([{ rotate: "0deg", scale: 1 }, { rotate: "360deg", scale: 0.8 }, { rotate: "720deg", scale: 1 }], { duration: 600, easing: "ease-in-out" });
      suona("pop");
      await disegna();
    }
  });
  finestra.addEventListener("close", () => {
    setTimeout(() => finestra.remove(), 400);
    if (!app.querySelector(".schermo-mappa")) mostraMappa();
  });
  finestra.showModal();
  suona("vittoria");
  coriandoli({ quanti: 220, durata: 4200 });
}

mostraMappa("avanti");
