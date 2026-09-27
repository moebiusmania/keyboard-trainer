// Punti, moltiplicatore e statistiche per la modalità "sfida"
export const PUNTI_TASTO = 10;
export const MOLTIPLICATORE_MAX = 4;
export const COMBO_PER_LIVELLO = 10;

export function moltiplicatore(combo) {
  return Math.min(MOLTIPLICATORE_MAX, 1 + Math.floor(combo / COMBO_PER_LIVELLO));
}

/** Punteggio perfetto per n tasti giusti di fila */
export function massimoPer(n, comboIniziale = 0) {
  let totale = 0;
  for (let k = 1; k <= n; k++) totale += PUNTI_TASTO * moltiplicatore(comboIniziale + k);
  return totale;
}

export class Punteggio {
  punti = 0;
  combo = 0;
  migliorCombo = 0;
  corretti = 0;
  errori = 0;
  massimo = 0;

  constructor(hud) {
    this.hud = hud;
    this.aggiorna();
  }

  giusto() {
    this.corretti++;
    this.combo++;
    this.migliorCombo = Math.max(this.migliorCombo, this.combo);
    const prima = moltiplicatore(this.combo - 1);
    this.punti += PUNTI_TASTO * moltiplicatore(this.combo);
    this.aggiorna(moltiplicatore(this.combo) > prima);
  }

  sbagliato() {
    this.errori++;
    const avevaCombo = this.combo >= COMBO_PER_LIVELLO;
    this.combo = 0;
    this.aggiorna(false, avevaCombo);
  }

  bonus(n) {
    this.punti += n;
    this.aggiorna();
  }

  get precisione() {
    const tot = this.corretti + this.errori;
    return tot ? Math.round((this.corretti / tot) * 100) : 100;
  }

  aggiorna(salitoDiLivello = false, persoCombo = false) {
    this.hud?.imposta("punti", this.punti.toLocaleString("it-IT"));
    this.hud?.imposta("combo", `×${moltiplicatore(this.combo)}`, salitoDiLivello ? "su" : persoCombo ? "giu" : null);
  }
}
