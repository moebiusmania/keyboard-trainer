import { element, esc, fill, inline } from "../../lib/text.js";
import { play } from "../../lib/sounds.js";
import { listenKeys } from "../input.js";

const COLORS = ["pink", "blue", "green", "yellow", "purple", "orange"];

/** Balloons with a letter: press the letter to pop them before they fly away. */
export function balloons(step, ctx) {
  const letters = [...String(step.letters)];
  const count = step.count ?? 12;
  const flight = step.duration ?? (ctx.mode === "challenge" ? 5 : 8);
  const interval = step.interval ?? flight * 220;
  if (step.instruction) ctx.say(inline(step.instruction));

  ctx.area.innerHTML = `
    <div class="exercise exercise-balloons">
      <div class="sky">
        <span class="cloud cloud--1"></span>
        <span class="cloud cloud--2"></span>
        <span class="cloud cloud--3"></span>
      </div>
      <p class="counter" aria-live="polite"></p>
    </div>`;
  const sky = ctx.area.querySelector(".sky");
  const counter = ctx.area.querySelector(".counter");

  return new Promise((end) => {
    const alive = [];
    let launched = 0;
    let popped = 0;
    let errors = 0;
    let timer;
    let last;
    let finished = false;
    let stop = () => {};

    const close = () => {
      if (finished) return;
      finished = true;
      stop();
      clearTimeout(timer);
      ctx.keyboard.clear();
      ctx.hands.highlight([]);
      end({ correct: popped, errors, time: 0 });
    };
    ctx.signal.addEventListener("abort", close, { once: true });

    function update() {
      counter.textContent = fill(ctx.texts.balloons_popped, { n: popped, total: count });
      ctx.hands.highlight(ctx.keyboard.highlight(alive[0]?.letter ?? null));
      if (launched >= count && alive.length === 0) setTimeout(close, 600);
    }

    function launch() {
      if (finished) return;
      let letter;
      do letter = letters[Math.floor(Math.random() * letters.length)];
      while (letters.length > 1 && letter === last);
      last = letter;
      const el = element(`
        <div class="balloon" style="--x: ${6 + Math.random() * 78}%; --flight: ${flight}s; --tint: var(--${COLORS[launched % COLORS.length]}); --wobble: ${(Math.random() * 1.5 + 1.5).toFixed(2)}s">
          <span class="balloon-body">${esc(letter)}</span>
        </div>`);
      const b = { letter, el };
      el.addEventListener("animationend", (ev) => {
        if (ev.animationName !== "fly" || !alive.includes(b)) return;
        alive.splice(alive.indexOf(b), 1);
        el.remove();
        update();
      });
      sky.append(el);
      alive.push(b);
      launched++;
      update();
      if (launched < count) timer = setTimeout(launch, interval);
    }

    stop = listenKeys(ctx, (e) => {
      const b = alive.find((v) => v.letter === e.key);
      if (!b) {
        errors++;
        ctx.keyboard.pressed(e, false);
        ctx.score?.wrong();
        play("error");
        return;
      }
      alive.splice(alive.indexOf(b), 1);
      popped++;
      ctx.keyboard.pressed(e, true);
      ctx.score?.correct();
      play("pop");
      // freezes the balloon where it is and pops it
      const y = getComputedStyle(b.el).translate;
      b.el.style.translate = y;
      b.el.classList.add("popped");
      setTimeout(() => b.el.remove(), 450);
      update();
    });

    launch();
  });
}
