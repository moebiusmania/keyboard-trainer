import { suona } from "./lib/suoni.js";
import { transizione } from "./lib/transizione.js";

const slides = [...document.querySelectorAll(".slide")];
const punti = [...document.querySelectorAll(".linea-tempo [data-slide]")];
const linea = document.querySelector(".linea-tempo");
const indietro = document.querySelector(".freccia--indietro");
const avanti = document.querySelector(".freccia--avanti");
const visitate = new Set();
let attuale = 0;

function mostra(indice, direzione) {
  indice = Math.max(0, Math.min(slides.length - 1, indice));
  if (indice === attuale && direzione) return;
  const aggiorna = () => {
    slides.forEach((s, i) => (s.hidden = i !== indice));
    attuale = indice;
    visitate.add(indice);
    punti.forEach((p, i) => {
      p.toggleAttribute("aria-current", i === indice);
      if (i === indice) p.setAttribute("aria-current", "step");
      p.classList.toggle("visitato", visitate.has(i));
    });
    linea.style.setProperty("--progresso", slides.length > 1 ? indice / (slides.length - 1) : 1);
    indietro.disabled = indice === 0;
    avanti.disabled = indice === slides.length - 1;
  };
  if (!direzione) return aggiorna();
  // "#3" e non "#slide-3": un'ancora con lo stesso id farebbe scorrere la pagina
  history.replaceState(null, "", `#${indice + 1}`);
  suona("pagina");
  transizione(aggiorna, direzione);
}

const vai = (passo) => mostra(attuale + passo, passo > 0 ? "avanti" : "indietro");

document.querySelectorAll("[data-vai]").forEach((b) => b.addEventListener("click", () => vai(Number(b.dataset.vai))));
punti.forEach((p) =>
  p.addEventListener("click", () => {
    const i = Number(p.dataset.slide) - 1;
    mostra(i, i > attuale ? "avanti" : "indietro");
  })
);

function premi(bottone) {
  bottone.classList.add("premuta");
  setTimeout(() => bottone.classList.remove("premuta"), 150);
}

document.addEventListener("keydown", (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.key === "ArrowRight" && attuale < slides.length - 1) {
    premi(avanti);
    vai(1);
  } else if (e.key === "ArrowLeft" && attuale > 0) {
    premi(indietro);
    vai(-1);
  } else if (e.key === "Home") {
    mostra(0, "indietro");
  } else if (e.key === "End") {
    mostra(slides.length - 1, "avanti");
  }
});

// Scorrimento con il dito su tablet e telefoni
let xInizio = null;
const carosello = document.querySelector(".slides");
carosello.addEventListener("pointerdown", (e) => {
  if (e.pointerType !== "mouse") xInizio = e.clientX;
});
carosello.addEventListener("pointerup", (e) => {
  if (xInizio === null) return;
  const dx = e.clientX - xInizio;
  xInizio = null;
  if (Math.abs(dx) > 60) vai(dx < 0 ? 1 : -1);
});

const dallIndirizzo = Number(location.hash.match(/^#(\d+)$/)?.[1] ?? 1) - 1;
mostra(dallIndirizzo);
