// Changes the page content with a View Transition (if available).
// The direction ends up in html[data-direction] and the CSS picks the animation.
const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

export function transition(update, direction = "forward") {
  if (!document.startViewTransition || reduce()) {
    update();
    return Promise.resolve();
  }
  const root = document.documentElement;
  root.dataset.direction = direction;
  const t = document.startViewTransition(update);
  return t.finished.catch(() => {}).finally(() => {
    if (root.dataset.direction === direction) delete root.dataset.direction;
  });
}
