// Helpers shared by the images drawn on a <canvas> (badge, records board)

export const FONT = "Fredoka, system-ui, sans-serif";
export const EMOJI_FONT = "system-ui, 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";

/** Reads a color from the CSS custom properties */
export function color(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

export function star(ctx, cx, cy, points, outer, inner) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? inner : outer;
    const a = (Math.PI * i) / points - Math.PI / 2;
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.closePath();
}

/** Sets the largest font size (up to size) that fits the text in maxWidth */
export function fit(ctx, text, maxWidth, size, weight = 700) {
  let s = size;
  do {
    ctx.font = `${weight} ${s}px ${FONT}`;
    s -= 2;
  } while (ctx.measureText(text).width > maxWidth && s > 16);
}

export function downloadPng(canvas, fileName) {
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
