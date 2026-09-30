import { play } from "../lib/sounds.js";

/**
 * Listens to the keys during an exercise. The handler only receives printable
 * characters (letters, numbers, space, punctuation).
 * Returns a function to stop listening (once the exercise is over).
 */
export function listenKeys(ctx, handle) {
  document.activeElement?.blur?.();
  const controller = new AbortController();
  ctx.signal.addEventListener("abort", () => controller.abort(), { once: true });
  document.addEventListener("keydown", (e) => {
    if (e.isComposing) return;
    if (e.target instanceof Element && e.target.closest("input, textarea, dialog")) return;
    ctx.capsLock(e.getModifierState?.("CapsLock") ?? false);
    if (e.ctrlKey || e.metaKey) return;
    if (e.key === " " || e.key === "Enter" || e.key === "'" || e.key === "/" || e.key === "Backspace") e.preventDefault();
    if (e.key.length !== 1) return;
    e.preventDefault();
    if (e.repeat) return;
    handle(e);
  }, { signal: controller.signal });
  return () => controller.abort();
}

/** Waits for SPACE, ENTER or a click on the button (after a short debounce pause). */
export function waitContinue(ctx, button, wait = 350) {
  return new Promise((ok) => {
    const start = performance.now();
    const controller = new AbortController();
    const done = () => {
      if (performance.now() - start < wait) return;
      controller.abort();
      play("page");
      ok(true);
    };
    const signal = AbortSignal.any ? AbortSignal.any([controller.signal, ctx.signal]) : controller.signal;
    button?.addEventListener("click", done, { signal });
    document.addEventListener("keydown", (e) => {
      if (e.target instanceof Element && e.target.closest("input, textarea, dialog")) return;
      ctx.capsLock(e.getModifierState?.("CapsLock") ?? false);
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!e.repeat) done();
      }
    }, { signal });
    ctx.signal.addEventListener("abort", () => ok(false), { once: true });
  });
}
