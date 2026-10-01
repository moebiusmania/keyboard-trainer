import { load, remove, save } from "../lib/storage.js";
import { play } from "../lib/sounds.js";
import { esc, fill, inline, starsHtml } from "../lib/text.js";
import { transition } from "../lib/transition.js";
import { createKeyboard } from "../lib/keyboard.js";
import { createHands } from "../lib/hands.js";
import { confetti } from "../lib/confetti.js";
import { drawBadge } from "../lib/badge.js";
import { drawBoard } from "../lib/board.js";
import { downloadPng } from "../lib/canvas.js";
import { waitContinue } from "./input.js";
import { maxFor, Score } from "./score.js";
import { talk } from "./exercises/talk.js";
import { type } from "./exercises/type.js";
import { balloons } from "./exercises/balloons.js";
import { rain } from "./exercises/rain.js";
import { stopwatch } from "./exercises/stopwatch.js";

const EXERCISES = { talk, type, balloons, rain, stopwatch };

const data = JSON.parse(document.getElementById("trainer-data").textContent);
const { mode, texts, lessons } = data;
const challenge = mode === "challenge";
const app = document.getElementById("app");
const mascotHtml = document.getElementById("tpl-mascot").innerHTML;
const progressKey = `${data.area}:progress`;

const progress = () => load(progressKey, {});
const playerName = () => load("name", "");
const introOf = (lesson) => document.querySelector(`template[data-intro="${lesson.order}"]`)?.innerHTML ?? "";
const unlocked = (lesson, p = progress()) => lesson.order === lessons[0].order || Boolean(p[lessons[lessons.indexOf(lesson) - 1]?.order]);

/* ============================================================
   Lesson map
   ============================================================ */

function stopHtml(lesson, i, p, next) {
  const done = p[lesson.order];
  const open = unlocked(lesson, p);
  const state = done ? "completed" : open ? "open" : "locked";
  const keys = challenge
    ? `<span class="label">${esc(lesson.new_keys)}</span>`
    : String(lesson.new_keys ?? "").split(" ").filter(Boolean).map((k) => `<kbd>${esc(k)}</kbd>`).join(" ");
  const result = done
    ? `<p class="stop-result">${starsHtml(done.stars)}<span class="visually-hidden">${fill(texts.stars_label, { n: done.stars })}</span>
       ${challenge ? `<span class="label">🏅 ${done.points.toLocaleString("it-IT")}</span>` : ""}</p>`
    : "";
  return `
    <li class="stop stop--${state}${lesson === next ? " stop--next" : ""}" style="--i: ${i}">
      <button type="button" class="stop-button" data-lesson="${lesson.order}" aria-describedby="info-${lesson.order}"
        aria-label="${esc(texts.lesson)} ${lesson.order}: ${esc(lesson.title)}${open ? "" : ` (${esc(texts.locked)})`}">
        <span class="stop-emoji" aria-hidden="true">${lesson.emoji ?? "⭐"}</span>
        <span class="stop-number" aria-hidden="true">${lesson.order}</span>
        ${open ? "" : `<span class="stop-lock" aria-hidden="true">🔒</span>`}
        ${done ? `<span class="stop-check" aria-hidden="true">✓</span>` : ""}
      </button>
      <div class="stop-info" id="info-${lesson.order}">
        <h3><span class="stop-label">${esc(texts.lesson)} ${lesson.order}</span> ${esc(lesson.title)}</h3>
        <p>${esc(lesson.goal)}</p>
        <p class="stop-keys"><span>${esc(texts.new_keys)}</span> ${keys}</p>
        ${result}
      </div>
    </li>`;
}

function greetingHtml() {
  const n = playerName();
  if (n) {
    return `<p>${esc(fill(texts.greeting, { name: n }))}</p>
      <button type="button" class="link-button" data-action="change-name">${esc(fill(texts.change_name, { name: n }))}</button>`;
  }
  return `
    <form class="name-form">
      <label for="player-name">${esc(texts.ask_name)}</label>
      <div class="name-form-row">
        <input id="player-name" name="name" maxlength="18" autocomplete="off" spellcheck="false" placeholder="${esc(texts.name_placeholder)}">
        <button class="button button--tint">${esc(texts.name_ok)}</button>
      </div>
    </form>`;
}

const boardPlayerHtml = () => {
  const n = playerName();
  return n ? esc(fill(texts.board_player, { name: n })) : "";
};

function boardData(p) {
  const rows = lessons.filter((l) => p[l.order]);
  return {
    rows,
    total: rows.reduce((s, l) => s + p[l.order].points, 0),
    stars: rows.reduce((s, l) => s + p[l.order].stars, 0),
  };
}

function boardHtml(p) {
  const { rows, total, stars } = boardData(p);
  if (!rows.length) return `<section class="board"><h2>🏆 ${esc(texts.board_title)}</h2><p>${esc(texts.board_empty)}</p></section>`;
  return `
    <section class="board">
      <h2>🏆 ${esc(texts.board_title)}</h2>
      <p class="board-player">${boardPlayerHtml()}</p>
      <div class="board-totals">
        <p><span>${esc(texts.board_total)}</span><strong>${total.toLocaleString("it-IT")}</strong></p>
        <p><span>${esc(texts.board_stars)}</span><strong>${stars} / ${lessons.length * 3}</strong></p>
      </div>
      <ol class="board-list" role="list">
        ${rows.map((l) => `
          <li><span aria-hidden="true">${l.emoji}</span> <span class="board-name">${esc(l.title)}</span>
          ${starsHtml(p[l.order].stars)} <strong>${p[l.order].points.toLocaleString("it-IT")}</strong></li>`).join("")}
      </ol>
      <button type="button" class="button button--pink" data-action="export">📷 ${esc(texts.board_export)}</button>
      <button type="button" class="link-button" data-action="reset">${esc(texts.board_reset)}</button>
    </section>`;
}

async function exportBoard() {
  const p = progress();
  const { rows, total, stars } = boardData(p);
  const n = playerName();
  const date = new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });
  const canvas = document.createElement("canvas");
  await drawBoard(canvas, {
    title: texts.board_title,
    player: n ? fill(texts.board_player, { name: n }) : "",
    totals: [
      { label: texts.board_total, value: total.toLocaleString("it-IT") },
      { label: texts.board_stars, value: `${stars} / ${lessons.length * 3}` },
    ],
    rows: rows.map((l) => ({
      emoji: l.emoji,
      title: l.title,
      stars: p[l.order].stars,
      points: p[l.order].points.toLocaleString("it-IT"),
    })),
    footer: fill(texts.board_footer, { date }),
  });
  downloadPng(canvas, texts.board_file_name);
}

/** The name lives in the greeting and on the board: both follow its changes */
function refreshPlayer() {
  const el = app.querySelector(".board-player");
  if (el) el.innerHTML = boardPlayerHtml();
}

function showMap(direction = "back") {
  const p = progress();
  const next = lessons.find((l) => !p[l.order] && unlocked(l, p));
  const badge = !challenge && load("badge");

  return transition(() => {
    app.innerHTML = `
      <div class="screen screen-map">
        <div class="welcome">
          ${mascotHtml}
          <div class="bubble bubble--left welcome-bubble" aria-live="polite">${greetingHtml()}</div>
        </div>
        <div class="map-header">
          <h2>${esc(texts.map_title)}</h2>
          <p>${esc(texts.map_subtitle)}</p>
        </div>
        <div class="map">
          <svg class="trail" aria-hidden="true"><path class="trail-base" /><path class="trail-done" pathLength="1" /></svg>
          <ol class="stops" role="list">${lessons.map((l, i) => stopHtml(l, i, p, next)).join("")}</ol>
        </div>
        ${badge ? `<p class="open-badge"><button type="button" class="button button--large button--yellow" data-action="badge">🏅 ${esc(texts.badge.open)}</button></p>` : ""}
        ${challenge ? boardHtml(p) : ""}
      </div>`;
    drawTrail();
  }, direction);
}

/** Draws the curved trail that joins the stops */
function drawTrail() {
  const map = app.querySelector(".map");
  if (!map) return;
  const svg = map.querySelector(".trail");
  // Layout measures (offset*) rather than getBoundingClientRect: the stops are still
  // shifted and shrunk by the entry animation when the trail is drawn
  const box = { width: map.offsetWidth, height: map.offsetHeight };
  const points = [...map.querySelectorAll(".stop-button")].map((b) => {
    let x = b.offsetWidth / 2;
    let y = b.offsetHeight / 2;
    for (let el = b; el && el !== map; el = el.offsetParent) {
      x += el.offsetLeft;
      y += el.offsetTop;
    }
    return { x, y };
  });
  if (!points.length) return;
  const path = (list) =>
    list.reduce((d, p, i) => {
      if (i === 0) return `M${p.x} ${p.y}`;
      const q = list[i - 1];
      const my = (q.y + p.y) / 2;
      return `${d} C${q.x} ${my} ${p.x} ${my} ${p.x} ${p.y}`;
    }, "");
  svg.setAttribute("viewBox", `0 0 ${box.width} ${box.height}`);
  svg.querySelector(".trail-base").setAttribute("d", path(points));
  const p = progress();
  const firstTodo = lessons.findIndex((l) => !p[l.order]);
  const reached = firstTodo === -1 ? points.length : firstTodo + 1;
  svg.querySelector(".trail-done").setAttribute("d", reached > 1 ? path(points.slice(0, reached)) : "");
}

new ResizeObserver(() => drawTrail()).observe(app);

app.addEventListener("submit", (e) => {
  const form = e.target.closest(".name-form");
  if (!form) return;
  e.preventDefault();
  const value = new FormData(form).get("name").toString().trim();
  if (value) save("name", value);
  play("ding");
  const bubble = app.querySelector(".welcome-bubble");
  bubble.innerHTML = value ? greetingHtml() : `<p>${esc(texts.greeting_anonymous)}</p>`;
  refreshPlayer();
  app.querySelector(".welcome .mascot")?.setAttribute("data-mood", "party");
  app.querySelector(".stop--next .stop-button, .stop--open .stop-button")?.focus();
});

app.addEventListener("click", (e) => {
  const button = e.target.closest("button");
  if (!button) return;

  if (button.dataset.lesson) {
    const lesson = lessons.find((l) => String(l.order) === button.dataset.lesson);
    if (unlocked(lesson)) {
      play("page");
      runLesson(lesson);
    } else {
      play("error");
      const stop = button.closest(".stop");
      stop.classList.remove("shake");
      void stop.offsetWidth;
      stop.classList.add("shake");
      const bubble = app.querySelector(".welcome-bubble");
      bubble.innerHTML = `<p>🔒 ${esc(texts.locked)}</p>`;
      app.querySelector(".welcome .mascot")?.setAttribute("data-mood", "oh");
    }
    return;
  }

  switch (button.dataset.action) {
    case "change-name":
      remove("name");
      app.querySelector(".welcome-bubble").innerHTML = greetingHtml();
      refreshPlayer();
      app.querySelector("#player-name")?.focus();
      break;
    case "badge":
      openBadge(false);
      break;
    case "export":
      play("pop");
      exportBoard();
      break;
    case "reset":
      if (confirm(texts.board_confirm)) {
        remove(progressKey);
        showMap();
      }
      break;
  }
});

/* ============================================================
   A lesson
   ============================================================ */

function createHud(element) {
  const items = challenge ? ["points", "combo", "time", "lives"] : [];
  element.innerHTML = items.map((v) => `
    <p class="hud-item hud-item--${v}" data-hud="${v}" ${["time", "lives"].includes(v) ? "hidden" : ""}>
      <span class="hud-label">${esc(texts.hud?.[v] ?? v)}</span>
      <strong class="hud-value"></strong>
    </p>`).join("");
  return {
    set(item, value, effect) {
      const el = element.querySelector(`[data-hud="${item}"]`);
      if (!el) return;
      el.querySelector(".hud-value").textContent = value;
      if (effect) {
        el.classList.remove("up", "down");
        void el.offsetWidth;
        el.classList.add(effect);
      }
    },
    show(which) {
      element.querySelectorAll("[data-hud]").forEach((el) => {
        if (["time", "lives"].includes(el.dataset.hud)) el.hidden = !which.includes(el.dataset.hud);
      });
    },
  };
}

async function runLesson(lesson) {
  const controller = new AbortController();
  const index = lessons.indexOf(lesson);
  const steps = lesson.steps ?? [];

  await transition(() => {
    app.innerHTML = `
      <div class="screen screen-lesson">
        <div class="lesson-bar">
          <button type="button" class="button button--small" data-exit>← ${esc(texts.exit)}</button>
          <p class="lesson-name"><span aria-hidden="true">${lesson.emoji}</span> ${esc(texts.lesson)} ${lesson.order}: ${esc(lesson.title)}</p>
          <div class="progress" role="progressbar" aria-label="${esc(texts.step)}" aria-valuemin="0" aria-valuemax="${steps.length}" aria-valuenow="0">
            <span class="progress-fill"></span>
          </div>
        </div>
        ${challenge ? `<div class="hud"></div>` : ""}
        <div class="stage">
          <div class="stage-mascot">
            ${mascotHtml}
            <div class="bubble bubble--left stage-bubble" aria-live="polite"></div>
          </div>
          <div class="stage-exercise"></div>
        </div>
        <p class="caps-notice" role="alert" hidden>⚠️ ${esc(texts.caps_lock)}</p>
        <div class="tools">
          <div class="tools-keyboard"></div>
          <div class="tools-hands"></div>
        </div>
      </div>`;
  }, "forward");

  const screen = app.querySelector(".screen-lesson");
  const mascot = screen.querySelector(".mascot");
  const bubble = screen.querySelector(".stage-bubble");
  const capsNotice = screen.querySelector(".caps-notice");
  const progressBar = screen.querySelector(".progress");
  let baseText = "";
  let reactionTimer;

  const say = (html, mood = "happy") => {
    baseText = html;
    clearTimeout(reactionTimer);
    bubble.innerHTML = html;
    bubble.animate?.([{ scale: 0.85, opacity: 0.4 }, { scale: 1, opacity: 1 }], { duration: 350, easing: "cubic-bezier(.3,1.6,.5,1)" });
    mascot.dataset.mood = mood;
  };

  const ctx = {
    mode,
    texts,
    area: screen.querySelector(".stage-exercise"),
    signal: controller.signal,
    keyboard: createKeyboard(screen.querySelector(".tools-keyboard")),
    hands: createHands(screen.querySelector(".tools-hands"), data.fingers, texts),
    hud: challenge ? createHud(screen.querySelector(".hud")) : { set() {}, show() {} },
    score: null,
    say,
    /** A passing reaction: after a while the previous message comes back */
    react(html, mood = "happy") {
      clearTimeout(reactionTimer);
      bubble.innerHTML = html;
      mascot.dataset.mood = mood;
      bubble.animate?.([{ rotate: "-3deg" }, { rotate: "3deg" }, { rotate: "0deg" }], { duration: 300 });
      reactionTimer = setTimeout(() => {
        bubble.innerHTML = baseText;
        mascot.dataset.mood = "happy";
      }, 1800);
    },
    capsLock(on) {
      capsNotice.hidden = !on;
    },
  };
  if (challenge) ctx.score = new Score(ctx.hud);
  controller.signal.addEventListener("abort", () => clearTimeout(reactionTimer));

  screen.querySelector("[data-exit]").addEventListener("click", () => {
    controller.abort();
    play("page");
    showMap();
  });

  const updateProgress = (n) => {
    progressBar.style.setProperty("--progress", n / Math.max(1, steps.length));
    progressBar.setAttribute("aria-valuenow", n);
  };

  // Lesson introduction
  say(introOf(lesson) || inline(lesson.goal));
  ctx.area.innerHTML = `
    <div class="exercise exercise-talk exercise-intro">
      <span class="intro-emoji" aria-hidden="true">${lesson.emoji}</span>
      <button type="button" class="button button--large button--tint">${esc(texts.start)} <span aria-hidden="true">→</span></button>
      <p class="keys-hint">${esc(texts.press_to_continue)}</p>
    </div>`;
  if (!(await waitContinue(ctx, ctx.area.querySelector("button")))) return;

  const total = { correct: 0, errors: 0, time: 0, words: 0 };
  for (const [i, step] of steps.entries()) {
    if (controller.signal.aborted) return;
    updateProgress(i);
    const exercise = EXERCISES[step.type];
    if (!exercise) continue;
    ctx.hud.show([]);
    const r = await exercise(step, ctx);
    total.correct += r.correct ?? 0;
    total.errors += r.errors ?? 0;
    total.time += r.time ?? 0;
    total.words += r.words ?? 0;
  }
  if (controller.signal.aborted) return;
  updateProgress(steps.length);
  controller.abort();
  // perfect score possible in typing-only levels (for the stars)
  const max = maxFor(steps.filter((s) => s.type === "type").reduce((n, s) => n + [...String(s.text)].length, 0));
  showEnd(lesson, index, total, ctx.score, max);
}

/* ============================================================
   End of lesson / level
   ============================================================ */

function computeStars(lesson, total, score, max) {
  const accuracy = total.correct + total.errors ? total.correct / (total.correct + total.errors) : 1;
  if (!challenge) return accuracy >= 0.95 ? 3 : accuracy >= 0.85 ? 2 : 1;
  const thresholds = lesson.stars ?? [0.3 * max, 0.6 * max, 0.85 * max];
  return 1 + thresholds.slice(1).filter((t) => score.points >= t).length;
}

function showEnd(lesson, index, total, score, max) {
  const accuracy = total.correct + total.errors ? Math.round((total.correct / (total.correct + total.errors)) * 100) : 100;
  const minutes = total.time / 60000;
  const speed = minutes > 0 ? Math.round(total.correct / 5 / minutes) : 0;

  // Stars reward accuracy (and combos): the speed bonus comes afterwards
  const stars = computeStars(lesson, total, score, max);
  if (score && speed) score.bonus(Math.min(speed, 60) * 10);

  const all = progress();
  const before = all[lesson.order];
  const points = score?.points ?? 0;
  const record = challenge && (!before || points > before.points);
  all[lesson.order] = {
    stars: Math.max(stars, before?.stars ?? 0),
    points: Math.max(points, before?.points ?? 0),
  };
  save(progressKey, all);

  const next = lessons[index + 1];
  const endText = challenge
    ? fill(texts.end_text, { accuracy, speed })
    : fill(texts.end_text, { keys: total.correct, accuracy });

  transition(() => {
    app.innerHTML = `
      <div class="screen screen-end">
        <div class="end-card">
          <div class="end-mascot">${mascotHtml}</div>
          <h2>${esc(texts.end_title)}</h2>
          <p class="end-stars">${starsHtml(stars, true)}<span class="visually-hidden">${fill(texts.stars_label, { n: stars })}</span></p>
          ${challenge ? `
            <p class="end-points"><span>${esc(texts.score)}</span><strong data-count-to="${points}">0</strong></p>
            ${record ? `<p class="end-record">🎉 ${esc(texts.record)}</p>` : `<p class="end-record-old">${esc(fill(texts.previous_record, { points: before.points.toLocaleString("it-IT") }))}</p>`}
          ` : ""}
          <p class="end-text">${esc(endText)}</p>
          <div class="end-buttons">
            ${next && !lesson.final ? `<button type="button" class="button button--large button--tint" data-go="${next.order}">${esc(texts.next)} →</button>` : ""}
            <button type="button" class="button" data-go="${lesson.order}">↻ ${esc(texts.redo)}</button>
            <button type="button" class="button" data-map>${esc(texts.to_map)}</button>
          </div>
        </div>
      </div>`;
    app.querySelector(".mascot").dataset.mood = "party";
  }, "forward").then(() => {
    play("victory");
    confetti({ count: 60 + stars * 40 });
    const counter = app.querySelector("[data-count-to]");
    if (counter) countUp(counter, Number(counter.dataset.countTo));
    if (lesson.final && !challenge) setTimeout(() => openBadge(true), 1400);
  });
}

app.addEventListener("click", (e) => {
  const go = e.target.closest(".screen-end [data-go]");
  if (go) {
    runLesson(lessons.find((l) => String(l.order) === go.dataset.go));
    return;
  }
  if (e.target.closest(".screen-end [data-map]")) showMap();
});

function countUp(el, to) {
  const start = performance.now();
  const duration = 1200;
  const frame = (now) => {
    const t = Math.min(1, (now - start) / duration);
    el.textContent = Math.round(to * (1 - (1 - t) ** 3)).toLocaleString("it-IT");
    if (t < 1) requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/* ============================================================
   Final badge
   ============================================================ */

async function openBadge(isNew) {
  const b = texts.badge;
  let saved = load("badge");
  if (isNew || !saved) {
    saved = {
      animal: Math.floor(Math.random() * b.animals.length),
      date: new Date().toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" }),
    };
    save("badge", saved);
  }
  const n = playerName();

  let modal = document.querySelector(".badge-modal");
  modal?.remove();
  modal = document.createElement("dialog");
  modal.className = "modal badge-modal";
  modal.setAttribute("aria-labelledby", "badge-title");
  modal.innerHTML = `
    <h2 id="badge-title">${esc(b.title)}</h2>
    <p>${esc(fill(b.text, { name: n || b.no_name }))}</p>
    <canvas class="badge" width="800" height="800" role="img"></canvas>
    <div class="modal-buttons">
      <button type="button" class="button button--yellow" data-d="download">⬇ ${esc(b.download)}</button>
      <button type="button" class="button" data-d="new">🎲 ${esc(b.new)}</button>
      <button type="button" class="button" data-d="close">${esc(b.close)}</button>
    </div>
    <p class="modal-invite"><a href="${esc(b.challenge_url)}">${esc(b.challenge_invite)} →</a></p>`;
  document.body.append(modal);
  const canvas = modal.querySelector("canvas");

  const draw = async () => {
    const animal = b.animals[saved.animal % b.animals.length];
    canvas.setAttribute("aria-label", `${animal.emoji} ${animal.title} – ${n || b.no_name} – ${saved.date}`);
    await drawBadge(canvas, {
      heading: b.heading,
      animal,
      awarded: b.awarded,
      name: n || b.no_name,
      date: saved.date,
    });
  };
  await draw();

  modal.addEventListener("click", async (e) => {
    const action = e.target.closest("[data-d]")?.dataset.d;
    if (e.target === modal || action === "close") modal.close();
    if (action === "download") downloadPng(canvas, b.file_name);
    if (action === "new") {
      saved.animal = (saved.animal + 1) % b.animals.length;
      save("badge", saved);
      canvas.animate?.([{ rotate: "0deg", scale: 1 }, { rotate: "360deg", scale: 0.8 }, { rotate: "720deg", scale: 1 }], { duration: 600, easing: "ease-in-out" });
      play("pop");
      await draw();
    }
  });
  modal.addEventListener("close", () => {
    setTimeout(() => modal.remove(), 400);
    if (!app.querySelector(".screen-map")) showMap();
  });
  modal.showModal();
  play("victory");
  confetti({ count: 220, duration: 4200 });
}

showMap("forward");
