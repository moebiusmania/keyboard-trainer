import { play } from "./lib/sounds.js";
import { transition } from "./lib/transition.js";

const slides = [...document.querySelectorAll(".slide")];
const dots = [...document.querySelectorAll(".timeline [data-slide]")];
const timeline = document.querySelector(".timeline");
const back = document.querySelector(".arrow--back");
const forward = document.querySelector(".arrow--forward");
const visited = new Set();
let current = 0;

function show(index, direction) {
  index = Math.max(0, Math.min(slides.length - 1, index));
  if (index === current && direction) return;
  const update = () => {
    slides.forEach((s, i) => (s.hidden = i !== index));
    current = index;
    visited.add(index);
    dots.forEach((d, i) => {
      d.toggleAttribute("aria-current", i === index);
      if (i === index) d.setAttribute("aria-current", "step");
      d.classList.toggle("visited", visited.has(i));
    });
    timeline.style.setProperty("--progress", slides.length > 1 ? index / (slides.length - 1) : 1);
    back.disabled = index === 0;
    forward.disabled = index === slides.length - 1;
  };
  if (!direction) return update();
  // "#3" rather than "#slide-3": an anchor with the same id would scroll the page
  history.replaceState(null, "", `#${index + 1}`);
  play("page");
  transition(update, direction);
}

const go = (step) => show(current + step, step > 0 ? "forward" : "back");

document.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => go(Number(b.dataset.go))));
dots.forEach((d) =>
  d.addEventListener("click", () => {
    const i = Number(d.dataset.slide) - 1;
    show(i, i > current ? "forward" : "back");
  })
);

function press(button) {
  button.classList.add("pressed");
  setTimeout(() => button.classList.remove("pressed"), 150);
}

document.addEventListener("keydown", (e) => {
  if (e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.key === "ArrowRight" && current < slides.length - 1) {
    press(forward);
    go(1);
  } else if (e.key === "ArrowLeft" && current > 0) {
    press(back);
    go(-1);
  } else if (e.key === "Home") {
    show(0, "back");
  } else if (e.key === "End") {
    show(slides.length - 1, "forward");
  }
});

// Swiping with a finger on tablets and phones
let startX = null;
const carousel = document.querySelector(".slides");
carousel.addEventListener("pointerdown", (e) => {
  if (e.pointerType !== "mouse") startX = e.clientX;
});
carousel.addEventListener("pointerup", (e) => {
  if (startX === null) return;
  const dx = e.clientX - startX;
  startX = null;
  if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
});

const fromAddress = Number(location.hash.match(/^#(\d+)$/)?.[1] ?? 1) - 1;
show(fromAddress);
