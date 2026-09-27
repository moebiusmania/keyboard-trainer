// Due manine in SVG, viste dall'alto. Il dito da usare si illumina.
// [dito, x, y, larghezza, altezza, rotazione]
const FORME = [
  ["5", 14, 52, 24, 52, -10],
  ["4", 42, 26, 26, 76, -4],
  ["3", 73, 14, 27, 88, 0],
  ["2", 105, 24, 26, 78, 5],
  ["1", 138, 76, 26, 54, 40],
];

function mano(lato) {
  const specchio = lato === "d" ? "translate(390 0) scale(-1 1)" : "translate(10 0)";
  const dita = FORME.map(([n, x, y, l, a, r]) => `
    <g class="dito" data-dito="${lato}${n}" style="--colore: var(--dito-${n})">
      <g transform="rotate(${r} ${x + l / 2} ${y + a})">
        <rect class="dito-forma" x="${x}" y="${y}" width="${l}" height="${a}" rx="${l / 2}" />
        <rect class="dito-unghia" x="${x + 5}" y="${y + 6}" width="${l - 10}" height="13" rx="5" />
      </g>
    </g>`).join("");
  return `<g class="mano mano--${lato}" transform="${specchio}">
    ${dita}
    <path class="palmo" d="M10 96 q0 -10 14 -8 h110 q18 2 20 22 l2 28 q0 18 -24 20 h-100 q-24 -2 -22 -26 z" />
    <path class="palmo-segno" d="M40 118 q30 12 60 0" />
  </g>`;
}

export function creaMani(contenitore, nomiDita, testi) {
  const figura = document.createElement("figure");
  figura.className = "mani";
  figura.innerHTML = `
    <svg viewBox="0 0 400 170" aria-hidden="true">${mano("s")}${mano("d")}</svg>
    <figcaption class="mani-didascalia" aria-live="polite"></figcaption>`;
  contenitore.append(figura);
  const didascalia = figura.querySelector("figcaption");

  return {
    elemento: figura,
    evidenzia(dita = [], descrivi = true) {
      figura.querySelectorAll(".dito").forEach((d) => {
        d.classList.toggle("attivo", dita.includes(d.dataset.dito));
      });
      figura.classList.toggle("in-uso", dita.length > 0);
      if (!descrivi || !dita.length) {
        didascalia.textContent = "";
        return;
      }
      const nomi = [...new Set(dita.map((d) => nomiDita[d]))];
      const elenco = nomi.length > 1 ? `${nomi.slice(0, -1).join(", ")} ${testi.e} ${nomi.at(-1)}` : nomi[0];
      didascalia.textContent = (nomi.length > 1 ? testi.usa_dita : testi.usa_dito).replace("{dito}", elenco);
    },
  };
}
