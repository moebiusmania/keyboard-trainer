// Points, multiplier and statistics for the "challenge" mode
export const KEY_POINTS = 10;
export const MAX_MULTIPLIER = 4;
export const COMBO_PER_LEVEL = 10;

export function multiplier(combo) {
  return Math.min(MAX_MULTIPLIER, 1 + Math.floor(combo / COMBO_PER_LEVEL));
}

/** Perfect score for n correct keys in a row */
export function maxFor(n, startCombo = 0) {
  let total = 0;
  for (let k = 1; k <= n; k++) total += KEY_POINTS * multiplier(startCombo + k);
  return total;
}

export class Score {
  points = 0;
  combo = 0;
  bestCombo = 0;
  correctCount = 0;
  errors = 0;
  max = 0;

  constructor(hud) {
    this.hud = hud;
    this.update();
  }

  correct() {
    this.correctCount++;
    this.combo++;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    const before = multiplier(this.combo - 1);
    this.points += KEY_POINTS * multiplier(this.combo);
    this.update(multiplier(this.combo) > before);
  }

  wrong() {
    this.errors++;
    const hadCombo = this.combo >= COMBO_PER_LEVEL;
    this.combo = 0;
    this.update(false, hadCombo);
  }

  bonus(n) {
    this.points += n;
    this.update();
  }

  get accuracy() {
    const total = this.correctCount + this.errors;
    return total ? Math.round((this.correctCount / total) * 100) : 100;
  }

  update(leveledUp = false, lostCombo = false) {
    this.hud?.set("points", this.points.toLocaleString("it-IT"));
    this.hud?.set("combo", `×${multiplier(this.combo)}`, leveledUp ? "up" : lostCombo ? "down" : null);
  }
}
