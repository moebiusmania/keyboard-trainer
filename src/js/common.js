import { save } from "./lib/storage.js";
import { play } from "./lib/sounds.js";

// Sound toggle in the header
const button = document.querySelector(".audio-button");
const root = document.documentElement;

function updateButton() {
  button?.setAttribute("aria-pressed", String(root.dataset.audio !== "off"));
}

button?.addEventListener("click", () => {
  const on = root.dataset.audio === "off";
  if (on) delete root.dataset.audio;
  else root.dataset.audio = "off";
  save("audio", on);
  updateButton();
  play("tic");
});

updateButton();
