/* ==========================================================================
   check-contrast.mjs — regression guard for the token layer.

   Parses css/tokens.css itself and re-checks every pair that has to hold in
   all three themes. Editing a colour without running this is how a theme
   quietly stops being accessible, so this reads the SHIPPED values rather
   than a list typed out twice.

   Usage:  node tools/check-contrast.mjs
   Exits non-zero on any failure, so it works as a pre-commit or CI step.
   ========================================================================== */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const TOKENS = join(fileURLToPath(new URL(".", import.meta.url)), "..", "css", "tokens.css");

/* ---- colour ------------------------------------------------------------- */
const hex = (h) => {
  h = h.trim().replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
const L = ([r, g, b]) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => {
  const l1 = L(a), l2 = L(b);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
};
/* Composite a translucent layer over an opaque one, so a frosted card is
   measured against what it actually paints. */
const over = (fg, a, bg) => fg.map((c, i) => c * a + bg[i] * (1 - a));

/* ---- parse tokens.css --------------------------------------------------- */
/* Comments are stripped first. A prose line like "--surface: #948d84 was
   only 4.40 on a card" is otherwise parsed as a real declaration and
   silently replaces the token it is describing. */
const css = readFileSync(TOKENS, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

function block(selector) {
  const i = css.indexOf(selector);
  if (i === -1) throw new Error(`tokens.css: no block for ${selector}`);
  const open = css.indexOf("{", i);
  let depth = 0, end = open;
  for (let j = open; j < css.length; j++) {
    if (css[j] === "{") depth++;
    else if (css[j] === "}") { depth--; if (!depth) { end = j; break; } }
  }
  const body = css.slice(open + 1, end);
  const out = {};
  for (const m of body.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) out[m[1]] = m[2].trim();
  return out;
}

const THEMES = {
  light: block(":root {"),
  medium: block(':root[data-theme="medium"]'),
  dark: block(':root[data-theme="dark"]'),
};
/* medium and dark only restate what they change. */
for (const name of ["medium", "dark"]) THEMES[name] = { ...THEMES.light, ...THEMES[name] };

const alphaOf = (value) => {
  const m = value.match(/rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\)/);
  return m ? +m[1] : 1;
};
const rgbOf = (value) => {
  const m = value.match(/rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/);
  return m ? [+m[1], +m[2], +m[3]] : null;
};

/* ---- the pairs that must hold ------------------------------------------- */
let failures = 0;
const check = (theme, fg, bg, min, label) => {
  const r = ratio(fg, bg);
  const ok = r >= min;
  if (!ok) failures++;
  const line = `  ${ok ? "PASS" : "FAIL"}  ${r.toFixed(2).padStart(5)}:1  (min ${min})  ${label}`;
  if (!ok) console.error(line); else if (process.env.VERBOSE) console.log(line);
};

for (const [name, t] of Object.entries(THEMES)) {
  console.log(`\n${name}`);
  const surface = hex(t["--surface"]);
  const page = hex(t["--bg"]);
  const sunk = hex(t["--surface-sunk"]);

  /* The frosted card is the LIGHTEST surface text ever sits on in dark mode,
     and the one a --surface-only check misses. */
  const glassA = rgbOf(t["--glass-a"]);
  const card = glassA ? over(glassA, alphaOf(t["--glass-a"]), surface).map(Math.round) : surface;

  const grounds = [["card", surface], ["page", page], ["sunk", sunk], ["frosted card", card]];

  for (const [gname, g] of grounds) {
    check(name, hex(t["--ink"]), g, 4.5, `--ink on ${gname}`);
    check(name, hex(t["--ink-2"]), g, 4.5, `--ink-2 on ${gname}`);
    check(name, hex(t["--ink-3"]), g, 4.5, `--ink-3 on ${gname}`);
    check(name, hex(t["--accent-ink"]), g, 4.5, `--accent-ink on ${gname}`);
    check(name, hex(t["--free"]), g, 4.5, `--free on ${gname}`);
    check(name, hex(t["--line-control"]), g, 3, `--line-control on ${gname} (non-text)`);
    for (const fam of ["tools", "assets", "funding", "learning"]) {
      check(name, hex(t[`--fam-${fam}`]), g, 3, `--fam-${fam} dot on ${gname}`);
    }
  }

  check(name, hex(t["--accent-ink"]), hex(t["--accent-wash"]), 4.5, "--accent-ink on --accent-wash");
  check(name, hex(t["--free"]), hex(t["--free-wash"]), 4.5, "--free on --free-wash");
  check(name, hex(t["--on-invert"]), hex(t["--surface-invert"]), 4.5, "--on-invert on --surface-invert");

  /* The primary button is a gradient; BOTH stops must clear its label. */
  for (const stop of ["--accent-btn-a", "--accent-btn-b"]) {
    check(name, hex(t["--on-accent"]), hex(t[stop]), 4.5, `--on-accent on ${stop}`);
  }
  console.log(`  ${failures ? "" : "all pairs pass"}`);
}

console.log(failures ? `\n${failures} FAILURE(S)` : "\nEvery pair passes in all three themes.");
process.exit(failures ? 1 : 0);
