// Italian (ISO) keyboard drawn with HTML + CSS grid.
// Every key knows which finger has to press it.

/** [plain character, character with Shift] or a special key */
const ROWS = [
  [["\\", "|"], ["1", "!"], ["2", '"'], ["3", "£"], ["4", "$"], ["5", "%"], ["6", "&"], ["7", "/"], ["8", "("], ["9", ")"], ["0", "="], ["'", "?"], ["ì", "^"], { id: "Backspace", label: "⌫", w: 2 }],
  [{ id: "Tab", label: "↹", w: 1.5 }, "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", ["è", "é"], ["+", "*"], { id: "Enter", label: "↵", w: 1.5 }],
  [{ id: "CapsLock", label: "⇪", w: 1.75 }, "a", "s", "d", "f", "g", "h", "j", "k", "l", ["ò", "ç"], ["à", "°"], ["ù", "§"], { id: "Enter", label: "", w: 1.25 }],
  [{ id: "ShiftLeft", label: "⇧", w: 1.25 }, ["<", ">"], "z", "x", "c", "v", "b", "n", "m", [",", ";"], [".", ":"], ["-", "_"], { id: "ShiftRight", label: "⇧", w: 2.75 }],
  [{ id: "Ctrl", label: "Ctrl", w: 1.5 }, { id: "Meta", label: "", w: 1.25 }, { id: "Alt", label: "Alt", w: 1.25 }, { id: " ", label: "", w: 6 }, { id: "AltGr", label: "Alt Gr", w: 1.5 }, { id: "Menu", label: "", w: 1.25 }, { id: "Ctrl2", label: "Ctrl", w: 2.25 }],
];

const FINGERS = {
  l5: ["\\", "1", "q", "a", "<", "z", "Tab", "CapsLock", "ShiftLeft"],
  l4: ["2", "w", "s", "x"],
  l3: ["3", "e", "d", "c"],
  l2: ["4", "5", "r", "t", "f", "g", "v", "b"],
  r2: ["6", "7", "y", "u", "h", "j", "n", "m"],
  r3: ["8", "i", "k", ","],
  r4: ["9", "o", "l", "."],
  r5: ["0", "'", "ì", "p", "è", "+", "ò", "à", "ù", "-", "Enter", "Backspace", "ShiftRight"],
  r1: [" "],
};

const HOME_ROW = new Set(["a", "s", "d", "f", "j", "k", "l", "ò"]);

const fingerOfKey = new Map();
for (const [finger, keys] of Object.entries(FINGERS)) for (const k of keys) fingerOfKey.set(k, finger);

/** character → { key, shift } */
const charMap = new Map();
for (const row of ROWS) {
  for (const k of row) {
    if (typeof k === "string") {
      charMap.set(k, { key: k, shift: false });
      charMap.set(k.toUpperCase(), { key: k, shift: true });
    } else if (Array.isArray(k)) {
      charMap.set(k[0], { key: k[0], shift: false });
      charMap.set(k[1], { key: k[0], shift: true });
    }
  }
}
charMap.set(" ", { key: " ", shift: false });
// Accented capitals: in Italian they are typed with Caps Lock, but we accept them with Shift + key
for (const [lower, upper] of [["è", "È"], ["à", "À"], ["ò", "Ò"], ["ù", "Ù"], ["ì", "Ì"]]) {
  charMap.set(upper, { key: lower, shift: true });
}

/** For a character, returns the keys to press and the fingers to use. */
export function howToType(char) {
  const info = charMap.get(char);
  if (!info) return { keys: [], fingers: [] };
  const finger = fingerOfKey.get(info.key);
  const keys = [info.key];
  const fingers = [finger];
  if (info.shift) {
    // Shift on the side opposite to the letter
    const shift = finger?.startsWith("l") ? "ShiftRight" : "ShiftLeft";
    keys.unshift(shift);
    fingers.unshift(fingerOfKey.get(shift));
  }
  if (info.key === " ") fingers.push("l1");
  return { keys, fingers };
}

/** The on-screen key matching a KeyboardEvent */
function keyFromEvent(e) {
  if (e.key === "Shift") return e.code === "ShiftRight" ? "ShiftRight" : "ShiftLeft";
  if (["Enter", "Backspace", "Tab", "CapsLock"].includes(e.key)) return e.key;
  return charMap.get(e.key)?.key ?? null;
}

export function createKeyboard(container) {
  const root = document.createElement("div");
  root.className = "keyboard";
  root.setAttribute("aria-hidden", "true");

  for (const row of ROWS) {
    const r = document.createElement("div");
    r.className = "keyboard-row";
    for (const k of row) {
      const el = document.createElement("span");
      el.className = "key";
      let id, up = "", down = "";
      if (typeof k === "string") {
        id = k;
        down = k.toUpperCase();
      } else if (Array.isArray(k)) {
        id = k[0];
        [down, up] = k;
        el.classList.add("key--double");
      } else {
        id = k.id;
        down = k.label;
        el.classList.add("key--special");
        el.style.setProperty("--w", k.w);
      }
      el.dataset.key = id;
      const finger = fingerOfKey.get(id);
      if (finger) el.dataset.finger = finger;
      if (id === "f" || id === "j") el.classList.add("key--bump");
      if (HOME_ROW.has(id)) el.classList.add("key--home");
      if (id === " ") el.classList.add("key--space");
      el.innerHTML = up ? `<span class="up">${up}</span><span class="down">${down}</span>` : `<span class="down">${down}</span>`;
      r.append(el);
    }
    root.append(r);
  }
  container.append(root);

  const keysById = (id) => root.querySelectorAll(`[data-key="${CSS.escape(id)}"]`);

  function clear() {
    root.querySelectorAll(".next, .shown").forEach((el) => el.classList.remove("next", "shown"));
  }

  return {
    element: root,
    clear,

    /** Lights up the keys that type a character. Returns the fingers to use. */
    highlight(char) {
      clear();
      if (char == null) return [];
      const { keys: ids, fingers } = howToType(char);
      for (const id of ids) keysById(id).forEach((el) => el.classList.add("next"));
      return fingers;
    },

    /** Shows off a group of keys (for the explanations). */
    show(chars) {
      clear();
      const fingers = new Set();
      for (const c of chars) {
        const info = howToType(c);
        info.keys.forEach((id) => keysById(id).forEach((el) => el.classList.add("shown")));
        info.fingers.forEach((f) => fingers.add(f));
      }
      return [...fingers];
    },

    /** "Pressed" effect on the actual key that was hit. */
    pressed(event, correct) {
      const id = keyFromEvent(event);
      if (!id) return;
      for (const el of keysById(id)) {
        el.classList.remove("correct", "wrong");
        void el.offsetWidth; // restarts the animation
        el.classList.add(correct ? "correct" : "wrong");
      }
    },
  };
}
