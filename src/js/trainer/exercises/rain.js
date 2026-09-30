import { element, esc } from "../../lib/text.js";
import { play } from "../../lib/sounds.js";
import { listenKeys } from "../input.js";
import { countdown, formatTime } from "./countdown.js";

/** Game: words fall from the sky, type them before they hit the ground. */
export async function rain(step, ctx) {
  const words = step.words.map(String);
  const duration = step.duration ?? 60;
  const speed = step.speed ?? 1;
  let lives = step.lives ?? 3;

  ctx.area.innerHTML = `
    <div class="exercise exercise-rain">
      <div class="sky sky--rain">
        <span class="cloud cloud--1"></span>
        <span class="cloud cloud--2"></span>
        <div class="ground"></div>
      </div>
    </div>`;
  const sky = ctx.area.querySelector(".sky");
  ctx.hud.show(["time", "lives"]);
  ctx.hud.set("time", formatTime(duration));
  ctx.hud.set("lives", "❤️".repeat(lives));

  if (!(await countdown(ctx, ctx.texts.rain_ready))) return { correct: 0, errors: 0, time: 0 };

  return new Promise((end) => {
    const drops = [];
    let active = null;
    let start = performance.now();
    let nextDrop = 0;
    let finished = false;
    let correct = 0;
    let errors = 0;
    let wordsDone = 0;

    function pickWord() {
      const initials = new Set(drops.map((d) => d.word[0]));
      const free = words.filter((w) => !initials.has(w[0]));
      const list = free.length ? free : words;
      return list[Math.floor(Math.random() * list.length)];
    }

    function newDrop(elapsed) {
      const word = pickWord();
      const el = element(`
        <div class="drop" style="--x: ${8 + Math.random() * 70}%">
          ${[...word].map((c) => `<span>${esc(c)}</span>`).join("")}
        </div>`);
      sky.append(el);
      const fall = Math.max(3800, 9000 - elapsed * 45) / speed;
      drops.push({ word, el, born: performance.now(), fall, typed: 0 });
    }

    function removeDrop(d, className) {
      drops.splice(drops.indexOf(d), 1);
      if (active === d) active = null;
      d.el.classList.add(className);
      setTimeout(() => d.el.remove(), 500);
    }

    function updateHint() {
      if (active) ctx.keyboard.highlight(active.word[active.typed]);
      else ctx.keyboard.clear();
    }

    function finish(reason) {
      if (finished) return;
      finished = true;
      stop();
      ctx.keyboard.clear();
      ctx.react(reason, "oh");
      drops.forEach((d) => d.el.classList.add("gone"));
      end({ correct, errors, time: (performance.now() - start), words: wordsDone });
    }

    ctx.signal.addEventListener("abort", () => {
      finished = true;
      end({ correct, errors, time: 0 });
    }, { once: true });

    function loop(now) {
      if (finished) return;
      const elapsed = (now - start) / 1000;
      const left = duration - elapsed;
      ctx.hud.set("time", formatTime(left));
      if (left <= 0) return finish(ctx.texts.time_up);

      if (now >= nextDrop) {
        newDrop(elapsed);
        nextDrop = now + Math.max(800, 2400 - elapsed * 22) / speed;
      }

      for (const d of [...drops]) {
        const p = (now - d.born) / d.fall;
        d.el.style.setProperty("--p", p.toFixed(4));
        if (p >= 1) {
          removeDrop(d, "landed");
          lives--;
          ctx.score.wrong();
          ctx.hud.set("lives", "❤️".repeat(lives) + "🤍".repeat(Math.max(0, (step.lives ?? 3) - lives)), "down");
          play("life");
          updateHint();
          if (lives <= 0) return finish(ctx.texts.no_lives);
        }
      }
      requestAnimationFrame(loop);
    }

    const stop = listenKeys(ctx, (e) => {
      if (finished) return;
      if (!active) {
        const candidates = drops.filter((d) => d.word[0] === e.key);
        if (candidates.length) {
          active = candidates.reduce((a, b) => (a.born < b.born ? a : b));
          active.el.classList.add("active");
        }
      }
      if (active && e.key === active.word[active.typed]) {
        active.el.children[active.typed].classList.add("done");
        active.typed++;
        correct++;
        ctx.score.correct();
        ctx.keyboard.pressed(e, true);
        play("tic");
        if (active.typed === active.word.length) {
          wordsDone++;
          ctx.score.bonus(20 * active.word.length);
          play("pop");
          removeDrop(active, "caught");
        }
      } else {
        errors++;
        ctx.score.wrong();
        ctx.keyboard.pressed(e, false);
        play("error");
      }
      updateHint();
    });

    start = performance.now();
    requestAnimationFrame(loop);
  });
}
