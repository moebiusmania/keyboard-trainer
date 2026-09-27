// Effetti sonori sintetizzati con Web Audio: nessun file da scaricare.
let contesto;

function audio() {
  contesto ??= new AudioContext();
  if (contesto.state === "suspended") contesto.resume();
  return contesto;
}

function nota(frequenza, { durata = 0.12, tipo = "sine", volume = 0.12, ritardo = 0, fine = frequenza } = {}) {
  const ctx = audio();
  const t = ctx.currentTime + ritardo;
  const osc = ctx.createOscillator();
  const guadagno = ctx.createGain();
  osc.type = tipo;
  osc.frequency.setValueAtTime(frequenza, t);
  osc.frequency.exponentialRampToValueAtTime(fine, t + durata);
  guadagno.gain.setValueAtTime(0.0001, t);
  guadagno.gain.exponentialRampToValueAtTime(volume, t + 0.01);
  guadagno.gain.exponentialRampToValueAtTime(0.0001, t + durata);
  osc.connect(guadagno).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + durata + 0.02);
}

const effetti = {
  tic: () => nota(1200, { durata: 0.05, tipo: "triangle", volume: 0.08, fine: 900 }),
  errore: () => nota(220, { durata: 0.18, tipo: "square", volume: 0.04, fine: 140 }),
  pop: () => {
    nota(500, { durata: 0.08, tipo: "sine", volume: 0.2, fine: 1400 });
    nota(1800, { durata: 0.05, tipo: "triangle", volume: 0.05, ritardo: 0.03 });
  },
  ding: () => {
    nota(1568, { durata: 0.5, volume: 0.1 });
    nota(2093, { durata: 0.6, volume: 0.06, ritardo: 0.05 });
  },
  pagina: () => nota(420, { durata: 0.12, tipo: "triangle", volume: 0.08, fine: 700 }),
  parola: () => {
    nota(880, { durata: 0.08, tipo: "triangle", volume: 0.1 });
    nota(1320, { durata: 0.12, tipo: "triangle", volume: 0.1, ritardo: 0.06 });
  },
  vita: () => nota(400, { durata: 0.4, tipo: "sawtooth", volume: 0.05, fine: 90 }),
  vittoria: () => {
    [523, 659, 784, 1047].forEach((f, i) => nota(f, { durata: 0.25, tipo: "triangle", volume: 0.12, ritardo: i * 0.12 }));
    nota(1568, { durata: 0.6, volume: 0.08, ritardo: 0.5 });
  },
};

export function suonoAttivo() {
  return document.documentElement.dataset.audio !== "spento";
}

export function suona(nome) {
  if (!suonoAttivo()) return;
  try {
    effetti[nome]?.();
  } catch {
    // audio non disponibile: pazienza
  }
}
