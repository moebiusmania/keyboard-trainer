// The end-of-training badge, drawn on a <canvas>
// so it can also be downloaded as a PNG image.
const SIDE = 800;

function color(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function star(ctx, cx, cy, points, outer, inner) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = (Math.PI * i) / points - Math.PI / 2;
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.closePath();
}

function textOnArc(ctx, text, cx, cy, radius, center = -Math.PI / 2) {
  const spacing = 0.105;
  const total = spacing * (text.length - 1);
  [...text].forEach((letter, i) => {
    const a = center - total / 2 + i * spacing;
    ctx.save();
    ctx.translate(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillText(letter, 0, 0);
    ctx.restore();
  });
}

function fit(ctx, text, maxWidth, size, weight = 700) {
  let s = size;
  do {
    ctx.font = `${weight} ${s}px Fredoka, system-ui, sans-serif`;
    s -= 2;
  } while (ctx.measureText(text).width > maxWidth && s > 16);
}

export async function drawBadge(canvas, { heading, animal, awarded, name, date }) {
  await document.fonts?.ready;
  canvas.width = SIDE;
  canvas.height = SIDE;
  const ctx = canvas.getContext("2d");
  const c = SIDE / 2;
  const ink = color("--ink");
  ctx.clearRect(0, 0, SIDE, SIDE);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.lineWidth = 10;
  ctx.strokeStyle = ink;

  // Ribbons
  for (const [dx, tint] of [[-1, color("--pink")], [1, color("--blue")]]) {
    ctx.beginPath();
    ctx.moveTo(c + dx * 60, c + 120);
    ctx.lineTo(c + dx * 170, c + 360);
    ctx.lineTo(c + dx * 120, c + 330);
    ctx.lineTo(c + dx * 80, c + 380);
    ctx.lineTo(c + dx * 0, c + 150);
    ctx.closePath();
    ctx.fillStyle = tint;
    ctx.fill();
    ctx.stroke();
  }

  // Outer star with shadow
  ctx.save();
  ctx.translate(12, 14);
  star(ctx, c, c - 20, 18, 330, 290);
  ctx.fillStyle = ink;
  ctx.fill();
  ctx.restore();
  star(ctx, c, c - 20, 18, 330, 290);
  ctx.fillStyle = color("--yellow");
  ctx.fill();
  ctx.stroke();

  // Inner circle
  ctx.beginPath();
  ctx.arc(c, c - 20, 262, 0, Math.PI * 2);
  ctx.fillStyle = color("--paper");
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.setLineDash([4, 18]);
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(c, c - 20, 236, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Heading on an arc
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 44px Fredoka, system-ui, sans-serif";
  textOnArc(ctx, heading, c, c - 20, 200);

  // Animal
  ctx.font = "150px system-ui, 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";
  ctx.fillText(animal.emoji, c, c - 95);

  // Banner with the title
  const bannerY = c + 30;
  ctx.beginPath();
  ctx.moveTo(c - 330, bannerY - 44);
  ctx.lineTo(c + 330, bannerY - 44);
  ctx.lineTo(c + 300, bannerY);
  ctx.lineTo(c + 330, bannerY + 44);
  ctx.lineTo(c - 330, bannerY + 44);
  ctx.lineTo(c - 300, bannerY);
  ctx.closePath();
  ctx.fillStyle = color("--orange");
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = ink;
  fit(ctx, animal.title, 560, 50);
  ctx.fillText(animal.title, c, bannerY + 3);

  // Name and date
  ctx.font = "500 26px Fredoka, system-ui, sans-serif";
  ctx.fillText(awarded, c, c + 100);
  fit(ctx, name, 380, 46);
  ctx.fillText(name, c, c + 145);
  ctx.font = "500 24px Fredoka, system-ui, sans-serif";
  ctx.fillText(date, c, c + 188);
}

export function downloadBadge(canvas, fileName) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: `${fileName}.png` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/png");
}
