// The challenge records board, drawn on a <canvas>
// so it can be saved as a PNG image and shared.
import { color, EMOJI_FONT, fit, FONT, star } from "./canvas.js";

const WIDTH = 800;
const ROW = 58;

/**
 * Texts arrive already filled in; player can be empty.
 * totals: [{ label, value }] (two), rows: [{ emoji, title, stars, points }]
 */
export async function drawBoard(canvas, { title, player, totals, rows, footer }) {
  await document.fonts?.ready;
  const top = player ? 200 : 150;
  const listTop = top + 140;
  const height = listTop + rows.length * ROW + 110;
  canvas.width = WIDTH;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const ink = color("--ink");
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.textBaseline = "middle";

  // Background and card with a flat shadow
  ctx.fillStyle = color("--pink");
  ctx.fillRect(0, 0, WIDTH, height);
  ctx.fillStyle = ink;
  ctx.beginPath();
  ctx.roundRect(40, 40, WIDTH - 72, height - 72, 28);
  ctx.fill();
  ctx.fillStyle = color("--white");
  ctx.strokeStyle = ink;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.roundRect(30, 30, WIDTH - 72, height - 72, 28);
  ctx.fill();
  ctx.stroke();
  const c = 30 + (WIDTH - 72) / 2;

  // Title and player
  ctx.textAlign = "center";
  ctx.fillStyle = ink;
  ctx.font = `56px ${EMOJI_FONT}`;
  ctx.fillText("🏆", c, 100);
  fit(ctx, title, 600, 44);
  ctx.fillText(title, c, 158);
  if (player) {
    fit(ctx, player, 600, 32, 500);
    ctx.fillText(player, c, 205);
  }

  // Totals
  totals.forEach(({ label, value }, i) => {
    const x = c + (i ? 20 : -320);
    const y = top + 20;
    ctx.fillStyle = color("--pink");
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(x, y, 300, 96, 18);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = ink;
    ctx.font = `500 22px ${FONT}`;
    ctx.fillText(label, x + 150, y + 28);
    ctx.font = `700 40px ${FONT}`;
    ctx.fillText(value, x + 150, y + 66);
  });

  // One row per level
  const yellow = color("--yellow");
  const gray = color("--gray");
  rows.forEach((row, i) => {
    const y = listTop + i * ROW + ROW / 2;
    ctx.textAlign = "left";
    ctx.fillStyle = ink;
    ctx.font = `30px ${EMOJI_FONT}`;
    ctx.fillText(row.emoji, 80, y);
    fit(ctx, row.title, 330, 30, 500);
    ctx.fillText(row.title, 130, y);
    ctx.lineWidth = 3;
    for (let s = 0; s < 3; s++) {
      star(ctx, 500 + s * 36, y, 5, 16, 7);
      ctx.fillStyle = s < row.stars ? yellow : gray;
      ctx.fill();
      ctx.stroke();
    }
    ctx.textAlign = "right";
    ctx.fillStyle = ink;
    ctx.font = `700 30px ${FONT}`;
    ctx.fillText(row.points, 710, y);
    if (i < rows.length - 1) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      ctx.setLineDash([2, 8]);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(80, y + ROW / 2);
      ctx.lineTo(710, y + ROW / 2);
      ctx.stroke();
      ctx.restore();
    }
  });

  // Footer
  ctx.textAlign = "center";
  ctx.fillStyle = ink;
  ctx.font = `500 22px ${FONT}`;
  ctx.fillText(footer, c, height - 82);
}
