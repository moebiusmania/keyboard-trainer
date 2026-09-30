import { play } from "../../lib/sounds.js";
import { listenKeys } from "../input.js";
import { countdown, formatTime } from "./countdown.js";
import { textToCells } from "./type.js";

/** Against the clock: as many words as possible before the stopwatch runs out. */
export async function stopwatch(step, ctx) {
  const words = step.words.map(String);
  const duration = step.duration ?? 60;
  const sequence = [];
  for (let k = 0; k < 120; k++) {
    let w;
    do w = words[Math.floor(Math.random() * words.length)];
    while (w === sequence.at(-1));
    sequence.push(w);
  }
  const text = [...sequence.join(" ")];

  ctx.area.innerHTML = `
    <div class="exercise exercise-stopwatch">
      <div class="tape"><p class="to-type tape-text">${textToCells(text.join(""))}</p></div>
    </div>`;
  const tape = ctx.area.querySelector(".tape");
  const line = ctx.area.querySelector(".tape-text");
  const cells = [...line.querySelectorAll(".char")];
  ctx.hud.show(["time"]);
  ctx.hud.set("time", formatTime(duration));

  let i = 0;
  const scroll = () => {
    cells.forEach((c, k) => c.classList.toggle("current", k === i));
    const x = cells[i].offsetLeft - tape.clientWidth * 0.3;
    line.style.translate = `${-Math.max(0, x)}px 0`;
  };
  scroll();

  if (!(await countdown(ctx, ctx.texts.stopwatch_ready))) return { correct: 0, errors: 0, time: 0 };

  return new Promise((end) => {
    const start = performance.now();
    let correct = 0;
    let errors = 0;
    let wordsDone = 0;
    let finished = false;

    const finish = () => {
      if (finished) return;
      finished = true;
      stop();
      ctx.keyboard.clear();
      ctx.react(ctx.texts.time_up, "oh");
      end({ correct, errors, time: duration * 1000, words: wordsDone });
    };
    ctx.signal.addEventListener("abort", () => {
      finished = true;
      end({ correct, errors, time: 0 });
    }, { once: true });

    const clock = () => {
      if (finished) return;
      const left = duration - (performance.now() - start) / 1000;
      ctx.hud.set("time", formatTime(left), left <= 10 ? "down" : null);
      if (left <= 0) finish();
      else setTimeout(clock, 250);
    };
    clock();

    const stop = listenKeys(ctx, (e) => {
      if (finished) return;
      if (e.key === text[i]) {
        cells[i].classList.add("done");
        cells[i].classList.remove("wrong");
        if (text[i] === " ") {
          wordsDone++;
          ctx.score.bonus(15);
          play("word");
        } else {
          play("tic");
        }
        i++;
        correct++;
        ctx.score.correct();
        ctx.keyboard.pressed(e, true);
        ctx.keyboard.clear();
        if (i >= text.length) return finish();
        scroll();
      } else {
        errors++;
        ctx.score.wrong();
        ctx.keyboard.pressed(e, false);
        ctx.keyboard.highlight(text[i]);
        const c = cells[i];
        c.classList.remove("wrong");
        void c.offsetWidth;
        c.classList.add("wrong");
        play("error");
      }
    });
  });
}
