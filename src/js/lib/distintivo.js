// Il distintivo di fine allenamento, disegnato su <canvas>
// così si può anche scaricare come immagine PNG.
const LATO = 800;

function colore(nome) {
  return getComputedStyle(document.documentElement).getPropertyValue(nome).trim();
}

function stella(ctx, cx, cy, punte, esterno, interno) {
  ctx.beginPath();
  for (let i = 0; i < punte * 2; i++) {
    const r = i % 2 ? interno : esterno;
    const a = (Math.PI * i) / punte - Math.PI / 2;
    ctx.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  ctx.closePath();
}

function testoInArco(ctx, testo, cx, cy, raggio, centro = -Math.PI / 2) {
  const spaziatura = 0.105;
  const totale = spaziatura * (testo.length - 1);
  [...testo].forEach((lettera, i) => {
    const a = centro - totale / 2 + i * spaziatura;
    ctx.save();
    ctx.translate(cx + Math.cos(a) * raggio, cy + Math.sin(a) * raggio);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillText(lettera, 0, 0);
    ctx.restore();
  });
}

function adatta(ctx, testo, larghezzaMax, dimensione, peso = 700) {
  let d = dimensione;
  do {
    ctx.font = `${peso} ${d}px Fredoka, system-ui, sans-serif`;
    d -= 2;
  } while (ctx.measureText(testo).width > larghezzaMax && d > 16);
}

export async function disegnaDistintivo(tela, { intestazione, animale, conferito, nome, data }) {
  await document.fonts?.ready;
  tela.width = LATO;
  tela.height = LATO;
  const ctx = tela.getContext("2d");
  const c = LATO / 2;
  const ink = colore("--inchiostro");
  ctx.clearRect(0, 0, LATO, LATO);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.lineWidth = 10;
  ctx.strokeStyle = ink;

  // Nastri
  for (const [dx, tinta] of [[-1, colore("--rosa")], [1, colore("--blu")]]) {
    ctx.beginPath();
    ctx.moveTo(c + dx * 60, c + 120);
    ctx.lineTo(c + dx * 170, c + 360);
    ctx.lineTo(c + dx * 120, c + 330);
    ctx.lineTo(c + dx * 80, c + 380);
    ctx.lineTo(c + dx * 0, c + 150);
    ctx.closePath();
    ctx.fillStyle = tinta;
    ctx.fill();
    ctx.stroke();
  }

  // Stella esterna con ombra
  ctx.save();
  ctx.translate(12, 14);
  stella(ctx, c, c - 20, 18, 330, 290);
  ctx.fillStyle = ink;
  ctx.fill();
  ctx.restore();
  stella(ctx, c, c - 20, 18, 330, 290);
  ctx.fillStyle = colore("--giallo");
  ctx.fill();
  ctx.stroke();

  // Cerchio interno
  ctx.beginPath();
  ctx.arc(c, c - 20, 262, 0, Math.PI * 2);
  ctx.fillStyle = colore("--carta");
  ctx.fill();
  ctx.stroke();
  ctx.save();
  ctx.setLineDash([4, 18]);
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(c, c - 20, 236, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Intestazione ad arco
  ctx.fillStyle = ink;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 44px Fredoka, system-ui, sans-serif";
  testoInArco(ctx, intestazione, c, c - 20, 200);

  // Animale
  ctx.font = "150px system-ui, 'Apple Color Emoji', 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";
  ctx.fillText(animale.emoji, c, c - 95);

  // Fascia con il titolo
  const fasciaY = c + 30;
  ctx.beginPath();
  ctx.moveTo(c - 330, fasciaY - 44);
  ctx.lineTo(c + 330, fasciaY - 44);
  ctx.lineTo(c + 300, fasciaY);
  ctx.lineTo(c + 330, fasciaY + 44);
  ctx.lineTo(c - 330, fasciaY + 44);
  ctx.lineTo(c - 300, fasciaY);
  ctx.closePath();
  ctx.fillStyle = colore("--arancio");
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = ink;
  adatta(ctx, animale.titolo, 560, 50);
  ctx.fillText(animale.titolo, c, fasciaY + 3);

  // Nome e data
  ctx.font = "500 26px Fredoka, system-ui, sans-serif";
  ctx.fillText(conferito, c, c + 100);
  adatta(ctx, nome, 380, 46);
  ctx.fillText(nome, c, c + 145);
  ctx.font = "500 24px Fredoka, system-ui, sans-serif";
  ctx.fillText(data, c, c + 188);
}

export function scaricaDistintivo(tela, nomeFile) {
  tela.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: `${nomeFile}.png` });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }, "image/png");
}
