// Two little hands in SVG, seen from above. The finger to use lights up.
// [finger, x, y, width, height, rotation]
const SHAPES = [
  ["5", 14, 52, 24, 52, -10],
  ["4", 42, 26, 26, 76, -4],
  ["3", 73, 14, 27, 88, 0],
  ["2", 105, 24, 26, 78, 5],
  ["1", 138, 76, 26, 54, 40],
];

function hand(side) {
  const mirror = side === "r" ? "translate(390 0) scale(-1 1)" : "translate(10 0)";
  const fingers = SHAPES.map(([n, x, y, w, h, r]) => `
    <g class="finger" data-finger="${side}${n}" style="--color: var(--finger-${n})">
      <g transform="rotate(${r} ${x + w / 2} ${y + h})">
        <rect class="finger-shape" x="${x}" y="${y}" width="${w}" height="${h}" rx="${w / 2}" />
        <rect class="finger-nail" x="${x + 5}" y="${y + 6}" width="${w - 10}" height="13" rx="5" />
      </g>
    </g>`).join("");
  return `<g class="hand hand--${side}" transform="${mirror}">
    ${fingers}
    <path class="palm" d="M10 96 q0 -10 14 -8 h110 q18 2 20 22 l2 28 q0 18 -24 20 h-100 q-24 -2 -22 -26 z" />
    <path class="palm-line" d="M40 118 q30 12 60 0" />
  </g>`;
}

export function createHands(container, fingerNames, texts) {
  const figure = document.createElement("figure");
  figure.className = "hands";
  figure.innerHTML = `
    <svg viewBox="0 0 400 170" aria-hidden="true">${hand("l")}${hand("r")}</svg>
    <figcaption class="hands-caption" aria-live="polite"></figcaption>`;
  container.append(figure);
  const caption = figure.querySelector("figcaption");

  return {
    element: figure,
    highlight(fingers = [], describe = true) {
      figure.querySelectorAll(".finger").forEach((f) => {
        f.classList.toggle("active", fingers.includes(f.dataset.finger));
      });
      figure.classList.toggle("in-use", fingers.length > 0);
      if (!describe || !fingers.length) {
        caption.textContent = "";
        return;
      }
      const names = [...new Set(fingers.map((f) => fingerNames[f]))];
      const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} ${texts.and} ${names.at(-1)}` : names[0];
      caption.textContent = (names.length > 1 ? texts.use_fingers : texts.use_finger).replace("{finger}", list);
    },
  };
}
