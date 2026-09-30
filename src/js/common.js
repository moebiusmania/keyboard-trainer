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

// Installable app and offline play: the service worker is at the site root.
// When online, it checks whether a new version has been deployed: at startup,
// when the app comes back to the foreground or online, and every hour.
// A new version is saved in the background and used from the next page.
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register(new URL("../sw.js", import.meta.url), { updateViaCache: "none" })
    .then((registration) => {
      const check = () => {
        if (navigator.onLine) registration.update().catch(() => {});
      };
      addEventListener("online", check);
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") check();
      });
      setInterval(check, 60 * 60 * 1000);
    })
    .catch(() => {});
}
