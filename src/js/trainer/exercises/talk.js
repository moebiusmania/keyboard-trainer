import { inline, esc } from "../../lib/text.js";
import { waitContinue } from "../input.js";

/** Tastino explains something; continue with SPACE, ENTER or the button. */
export async function talk(step, ctx) {
  ctx.say(inline(step.text));
  const fingers = step.show != null ? ctx.keyboard.show(String(step.show)) : (ctx.keyboard.clear(), []);
  ctx.hands.highlight(fingers, false);

  ctx.area.innerHTML = `
    <div class="exercise exercise-talk">
      <button type="button" class="button button--large button--tint">${esc(ctx.texts.continue)} <span aria-hidden="true">→</span></button>
      <p class="keys-hint">${esc(ctx.texts.press_to_continue)}</p>
    </div>`;
  await waitContinue(ctx, ctx.area.querySelector("button"));
  ctx.keyboard.clear();
  return { correct: 0, errors: 0, time: 0 };
}
