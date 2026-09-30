import { esc, inline, pause, pick } from "../../lib/text.js";
import { play } from "../../lib/sounds.js";
import { listenKeys } from "../input.js";

const HINT_DELAY = 3000;

/** Draws the text as cells, one per character, with words that never break. */
export function textToCells(text) {
  return text
    .split(" ")
    .map((word) =>
      `<span class="word">${[...word].map((c) => `<span class="char">${esc(c)}</span>`).join("")}</span>`
    )
    .join(`<span class="char char--space" aria-hidden="true"> </span>`);
}

/** Typing a text key by key. A mistake does not move forward: you try again. */
export function type(step, ctx) {
  const text = [...String(step.text)];
  const lateHint = step.hint === "late" || ctx.mode === "challenge";
  const instruction = step.instruction ? inline(step.instruction) : null;
  if (instruction) ctx.say(instruction);

  ctx.area.innerHTML = `
    <div class="exercise exercise-type">
      <p class="to-type${text.length > 16 ? " to-type--long" : ""}">${textToCells(text.join(""))}</p>
    </div>`;
  const cells = [...ctx.area.querySelectorAll(".char")];

  return new Promise((end) => {
    let i = 0;
    let correct = 0;
    let errors = 0;
    let errorsHere = 0;
    let start = null;
    let hintTimer;

    ctx.signal.addEventListener("abort", () => {
      clearTimeout(hintTimer);
      end({ correct, errors, time: 0 });
    }, { once: true });

    function showHint() {
      ctx.hands.highlight(ctx.keyboard.highlight(text[i]));
    }

    function update() {
      cells.forEach((c, k) => c.classList.toggle("current", k === i));
      clearTimeout(hintTimer);
      if (lateHint && errorsHere === 0) {
        ctx.keyboard.clear();
        ctx.hands.highlight([]);
        hintTimer = setTimeout(() => {
          if (ctx.mode !== "challenge") ctx.react(ctx.texts.hint);
          showHint();
        }, HINT_DELAY);
      } else {
        showHint();
      }
    }

    const stop = listenKeys(ctx, async (e) => {
      if (i >= text.length) return;
      const cell = cells[i];
      if (e.key === text[i]) {
        start ??= performance.now();
        ctx.keyboard.pressed(e, true);
        cell.classList.remove("current", "wrong");
        cell.classList.add("done");
        correct++;
        errorsHere = 0;
        i++;
        ctx.score?.correct();
        play("tic");
        if (i < text.length) {
          update();
          return;
        }
        clearTimeout(hintTimer);
        stop();
        const time = performance.now() - start;
        ctx.keyboard.clear();
        ctx.hands.highlight([]);
        ctx.react(pick(ctx.texts.praise), "party");
        play("word");
        ctx.area.querySelector(".to-type")?.classList.add("completed");
        await pause(900, ctx.signal);
        if (instruction) ctx.say(instruction);
        end({ correct, errors, time });
      } else {
        ctx.keyboard.pressed(e, false);
        errors++;
        errorsHere++;
        cell.classList.remove("wrong");
        void cell.offsetWidth;
        cell.classList.add("wrong");
        ctx.score?.wrong();
        play("error");
        if (errorsHere === 1 || errorsHere % 3 === 0) ctx.react(pick(ctx.texts.encourage), "oh");
        clearTimeout(hintTimer);
        showHint();
      }
    });

    update();
  });
}
