// Sound effects synthesized with Web Audio: no files to download.
let context;

function audio() {
  context ??= new AudioContext();
  if (context.state === "suspended") context.resume();
  return context;
}

function note(frequency, { duration = 0.12, type = "sine", volume = 0.12, delay = 0, end = frequency } = {}) {
  const ctx = audio();
  const t = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, t);
  osc.frequency.exponentialRampToValueAtTime(end, t + duration);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

const effects = {
  tic: () => note(1200, { duration: 0.05, type: "triangle", volume: 0.08, end: 900 }),
  error: () => note(220, { duration: 0.18, type: "square", volume: 0.04, end: 140 }),
  pop: () => {
    note(500, { duration: 0.08, type: "sine", volume: 0.2, end: 1400 });
    note(1800, { duration: 0.05, type: "triangle", volume: 0.05, delay: 0.03 });
  },
  ding: () => {
    note(1568, { duration: 0.5, volume: 0.1 });
    note(2093, { duration: 0.6, volume: 0.06, delay: 0.05 });
  },
  page: () => note(420, { duration: 0.12, type: "triangle", volume: 0.08, end: 700 }),
  word: () => {
    note(880, { duration: 0.08, type: "triangle", volume: 0.1 });
    note(1320, { duration: 0.12, type: "triangle", volume: 0.1, delay: 0.06 });
  },
  life: () => note(400, { duration: 0.4, type: "sawtooth", volume: 0.05, end: 90 }),
  victory: () => {
    [523, 659, 784, 1047].forEach((f, i) => note(f, { duration: 0.25, type: "triangle", volume: 0.12, delay: i * 0.12 }));
    note(1568, { duration: 0.6, volume: 0.08, delay: 0.5 });
  },
};

export function soundOn() {
  return document.documentElement.dataset.audio !== "off";
}

export function play(name) {
  if (!soundOn()) return;
  try {
    effects[name]?.();
  } catch {
    // audio not available: never mind
  }
}
