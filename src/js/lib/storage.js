// A thin wrapper around localStorage: if it is not available
// (private browsing, blocked data) the game works all the same.
const PREFIX = "tasto-dopo-tasto:";

export function load(key, fallback = null) {
  try {
    const value = localStorage.getItem(PREFIX + key);
    return value === null ? fallback : JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function save(key, value) {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // nothing to do: it will only last for this visit
  }
}

export function remove(key) {
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {
    // ignored
  }
}
