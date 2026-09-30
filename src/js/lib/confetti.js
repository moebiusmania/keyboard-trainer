// Confetti shower on a <canvas>
const COLORS = ["--yellow", "--pink", "--blue", "--green", "--orange", "--purple"];

export function confetti({ count = 140, duration = 3200 } = {}) {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  canvas.className = "confetti";
  // If a modal dialog is open, the confetti go on top of it
  (document.querySelector("dialog[open]") ?? document.body).append(canvas);
  const ctx = canvas.getContext("2d");
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const style = getComputedStyle(document.documentElement);
  const colors = COLORS.map((c) => style.getPropertyValue(c).trim());

  function resize() {
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
  }
  resize();

  const pieces = Array.from({ length: count }, () => ({
    x: innerWidth / 2 + (Math.random() - 0.5) * innerWidth * 0.3,
    y: innerHeight * 0.35,
    vx: (Math.random() - 0.5) * 16,
    vy: -Math.random() * 16 - 6,
    spin: Math.random() * Math.PI,
    vSpin: (Math.random() - 0.5) * 0.4,
    w: 8 + Math.random() * 8,
    h: 5 + Math.random() * 6,
    color: colors[Math.floor(Math.random() * colors.length)],
    shape: Math.random() < 0.3 ? "circle" : "rect",
  }));

  const start = performance.now();
  function frame(now) {
    const t = now - start;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    ctx.globalAlpha = Math.max(0, 1 - Math.max(0, t - duration + 800) / 800);
    for (const p of pieces) {
      p.vy += 0.45;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.spin += p.vSpin;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.spin);
      ctx.fillStyle = p.color;
      if (p.shape === "circle") {
        ctx.beginPath();
        ctx.arc(0, 0, p.h * 0.7, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.scale(1, Math.cos(p.spin * 3));
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      }
      ctx.restore();
    }
    if (t < duration) requestAnimationFrame(frame);
    else canvas.remove();
  }
  requestAnimationFrame(frame);
}
