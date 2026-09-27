import { salva } from "./lib/memoria.js";
import { suona } from "./lib/suoni.js";

// Pulsante dei suoni nella testata
const bottone = document.querySelector(".bottone-audio");
const radice = document.documentElement;

function aggiornaBottone() {
  bottone?.setAttribute("aria-pressed", String(radice.dataset.audio !== "spento"));
}

bottone?.addEventListener("click", () => {
  const acceso = radice.dataset.audio === "spento";
  if (acceso) delete radice.dataset.audio;
  else radice.dataset.audio = "spento";
  salva("audio", acceso);
  aggiornaBottone();
  suona("tic");
});

aggiornaBottone();
