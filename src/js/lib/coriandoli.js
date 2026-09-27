// Pioggia di coriandoli su <canvas>
const COLORI = ["--giallo", "--rosa", "--blu", "--verde", "--arancio", "--viola"];

export function coriandoli({ quanti = 140, durata = 3200 } = {}) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const tela = document.createElement("canvas");
  tela.className = "coriandoli";
  // Se c'è una finestra modale aperta, i coriandoli vanno sopra di lei
  (document.querySelector("dialog[open]") ?? document.body).append(tela);
  const ctx = tela.getContext("2d");
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const stile = getComputedStyle(document.documentElement);
  const colori = COLORI.map((c) => stile.getPropertyValue(c).trim());

  function dimensiona() {
    tela.width = innerWidth * dpr;
    tela.height = innerHeight * dpr;
  }
  dimensiona();

  const pezzi = Array.from({ length: quanti }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * innerWidth * 0.3,
    y: innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 16,
    vy: -Math.random() * 16 - 6,
    giro: Math.random() * Math.PI,
    vGiro: (Math.random() - 0.5) * 0.4,
    l: 8 + Math.random() * 8,
    a: 5 + Math.random() * 6,
    colore: colori[Math.floor(Math.random() * colori.length)],
    forma: Math.random() < 0.3 ? "cerchio" : "rett",
  }));

  const inizio = performance.now();
  function passo(ora) {
    const t = ora - inizio;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.globalAlpha = Math.max(0, 1 - Math.max(0, t - durata + 800) / 800);
    for (const p of pezzi) {
      p.vy += 0.45;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.giro += p.vGiro;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.giro);
      ctx.fillStyle = p.colore;
      if (p.forma === "cerchio") {
        ctx.beginPath();
        ctx.arc(0, 0, p.a * 0.7, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.scale(1, Math.cos(p.giro * 3));
        ctx.fillRect(-p.l / 2, -p.a / 2, p.l, p.a);
      }
      ctx.restore();
    }
    if (t < durata) requestAnimationFrame(passo);
    else tela.remove();
  }
  requestAnimationFrame(passo);
}
