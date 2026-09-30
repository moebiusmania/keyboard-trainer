import { esc, inline, pause } from "../../lib/text.js";
import { play } from "../../lib/sounds.js";
import { waitContinue } from "../input.js";

/** "Ready?" screen followed by the 3, 2, 1, Go! countdown */
export async function countdown(ctx, message) {
  ctx.say(inline(message));
  const veil = document.createElement("div");
  veil.className = "countdown";
  veil.innerHTML = `
    <button type="button" class="button button--large button--tint">${esc(ctx.texts.go)}</button>
    <p class="keys-hint">${esc(ctx.texts.press_to_continue)}</p>`;
  ctx.area.querySelector(".exercise")?.append(veil);
  if (!(await waitContinue(ctx, veil.querySelector("button")))) return false;

  for (const n of ["3", "2", "1", ctx.texts.go]) {
    veil.innerHTML = `<span class="count">${esc(n)}</span>`;
    play(n === ctx.texts.go ? "ding" : "tic");
    await pause(650, ctx.signal);
    if (ctx.signal.aborted) return false;
  }
  veil.remove();
  return true;
}

export const formatTime = (seconds) => {
  const s = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
