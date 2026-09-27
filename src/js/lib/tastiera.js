// Tastiera italiana (ISO) disegnata in HTML + CSS grid.
// Ogni tasto conosce il dito che lo deve premere.

/** [carattere normale, carattere con Maiusc] oppure un tasto speciale */
const RIGHE = [
  [["\\", "|"], ["1", "!"], ["2", '"'], ["3", "£"], ["4", "$"], ["5", "%"], ["6", "&"], ["7", "/"], ["8", "("], ["9", ")"], ["0", "="], ["'", "?"], ["ì", "^"], { id: "Backspace", etichetta: "⌫", l: 2 }],
  [{ id: "Tab", etichetta: "↹", l: 1.5 }, "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", ["è", "é"], ["+", "*"], { id: "Enter", etichetta: "↵", l: 1.5 }],
  [{ id: "CapsLock", etichetta: "⇪", l: 1.75 }, "a", "s", "d", "f", "g", "h", "j", "k", "l", ["ò", "ç"], ["à", "°"], ["ù", "§"], { id: "Enter", etichetta: "", l: 1.25 }],
  [{ id: "ShiftLeft", etichetta: "⇧", l: 1.25 }, ["<", ">"], "z", "x", "c", "v", "b", "n", "m", [",", ";"], [".", ":"], ["-", "_"], { id: "ShiftRight", etichetta: "⇧", l: 2.75 }],
  [{ id: "Ctrl", etichetta: "Ctrl", l: 1.5 }, { id: "Meta", etichetta: "", l: 1.25 }, { id: "Alt", etichetta: "Alt", l: 1.25 }, { id: " ", etichetta: "", l: 6 }, { id: "AltGr", etichetta: "Alt Gr", l: 1.5 }, { id: "Menu", etichetta: "", l: 1.25 }, { id: "Ctrl2", etichetta: "Ctrl", l: 2.25 }],
];

const DITA = {
  s5: ["\\", "1", "q", "a", "<", "z", "Tab", "CapsLock", "ShiftLeft"],
  s4: ["2", "w", "s", "x"],
  s3: ["3", "e", "d", "c"],
  s2: ["4", "5", "r", "t", "f", "g", "v", "b"],
  d2: ["6", "7", "y", "u", "h", "j", "n", "m"],
  d3: ["8", "i", "k", ","],
  d4: ["9", "o", "l", "."],
  d5: ["0", "'", "ì", "p", "è", "+", "ò", "à", "ù", "-", "Enter", "Backspace", "ShiftRight"],
  d1: [" "],
};

const RIGA_DI_CASA = new Set(["a", "s", "d", "f", "j", "k", "l", "ò"]);

const ditoDelTasto = new Map();
for (const [dito, tasti] of Object.entries(DITA)) for (const t of tasti) ditoDelTasto.set(t, dito);

/** carattere → { tasto, maiusc } */
const mappaCaratteri = new Map();
for (const riga of RIGHE) {
  for (const t of riga) {
    if (typeof t === "string") {
      mappaCaratteri.set(t, { tasto: t, maiusc: false });
      mappaCaratteri.set(t.toUpperCase(), { tasto: t, maiusc: true });
    } else if (Array.isArray(t)) {
      mappaCaratteri.set(t[0], { tasto: t[0], maiusc: false });
      mappaCaratteri.set(t[1], { tasto: t[0], maiusc: true });
    }
  }
}
mappaCaratteri.set(" ", { tasto: " ", maiusc: false });
// Maiuscole accentate: in italiano si scrivono con Bloc Maiusc, ma le accettiamo con Maiusc + tasto
for (const [min, mai] of [["è", "È"], ["à", "À"], ["ò", "Ò"], ["ù", "Ù"], ["ì", "Ì"]]) {
  mappaCaratteri.set(mai, { tasto: min, maiusc: true });
}

/** Per un carattere restituisce i tasti da premere e le dita da usare. */
export function comeSiScrive(carattere) {
  const info = mappaCaratteri.get(carattere);
  if (!info) return { tasti: [], dita: [] };
  const dito = ditoDelTasto.get(info.tasto);
  const tasti = [info.tasto];
  const dita = [dito];
  if (info.maiusc) {
    // Maiusc dalla parte opposta rispetto alla lettera
    const shift = dito?.startsWith("s") ? "ShiftRight" : "ShiftLeft";
    tasti.unshift(shift);
    dita.unshift(ditoDelTasto.get(shift));
  }
  if (info.tasto === " ") dita.push("s1");
  return { tasti, dita };
}

/** Il tasto sullo schermo corrispondente a un KeyboardEvent */
function tastoDaEvento(e) {
  if (e.key === "Shift") return e.code === "ShiftRight" ? "ShiftRight" : "ShiftLeft";
  if (["Enter", "Backspace", "Tab", "CapsLock"].includes(e.key)) return e.key;
  return mappaCaratteri.get(e.key)?.tasto ?? null;
}

export function creaTastiera(contenitore) {
  const radice = document.createElement("div");
  radice.className = "tastiera";
  radice.setAttribute("aria-hidden", "true");

  for (const riga of RIGHE) {
    const r = document.createElement("div");
    r.className = "tastiera-riga";
    for (const t of riga) {
      const el = document.createElement("span");
      el.className = "tasto";
      let id, su = "", giu = "";
      if (typeof t === "string") {
        id = t;
        giu = t.toUpperCase();
      } else if (Array.isArray(t)) {
        id = t[0];
        [giu, su] = t;
        el.classList.add("tasto--doppio");
      } else {
        id = t.id;
        giu = t.etichetta;
        el.classList.add("tasto--speciale");
        el.style.setProperty("--l", t.l);
      }
      el.dataset.tasto = id;
      const dito = ditoDelTasto.get(id);
      if (dito) el.dataset.dito = dito;
      if (id === "f" || id === "j") el.classList.add("tasto--rilievo");
      if (RIGA_DI_CASA.has(id)) el.classList.add("tasto--casa");
      if (id === " ") el.classList.add("tasto--spazio");
      el.innerHTML = su ? `<span class="su">${su}</span><span class="giu">${giu}</span>` : `<span class="giu">${giu}</span>`;
      r.append(el);
    }
    radice.append(r);
  }
  contenitore.append(radice);

  const tasti = (id) => radice.querySelectorAll(`[data-tasto="${CSS.escape(id)}"]`);

  function pulisci() {
    radice.querySelectorAll(".prossimo, .mostrato").forEach((el) => el.classList.remove("prossimo", "mostrato"));
  }

  return {
    elemento: radice,
    pulisci,

    /** Illumina i tasti per scrivere un carattere. Restituisce le dita da usare. */
    evidenzia(carattere) {
      pulisci();
      if (carattere == null) return [];
      const { tasti: ids, dita } = comeSiScrive(carattere);
      for (const id of ids) tasti(id).forEach((el) => el.classList.add("prossimo"));
      return dita;
    },

    /** Mette in mostra un gruppo di tasti (per le spiegazioni). */
    mostra(caratteri) {
      pulisci();
      const dita = new Set();
      for (const c of caratteri) {
        const info = comeSiScrive(c);
        info.tasti.forEach((id) => tasti(id).forEach((el) => el.classList.add("mostrato")));
        info.dita.forEach((d) => dita.add(d));
      }
      return [...dita];
    },

    /** Effetto "premuto" sul tasto reale che è stato schiacciato. */
    premuto(evento, giusto) {
      const id = tastoDaEvento(evento);
      if (!id) return;
      for (const el of tasti(id)) {
        el.classList.remove("giusto", "sbagliato");
        void el.offsetWidth; // riavvia l'animazione
        el.classList.add(giusto ? "giusto" : "sbagliato");
      }
    },
  };
}
