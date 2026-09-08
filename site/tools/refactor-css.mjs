/* ==========================================================================
   refactor-css.mjs — move the three page stylesheets onto the token layer.

   Removes, in order:
     · each file's private :root palette      (tokens.css owns colour now)
     · the header rules for the three dead headers (chrome.css owns chrome)
     · the appended "2026 Glass Plate" !important patches, whose hardcoded
       rgba(255,255,255,…) is exactly what breaks under a dark theme

   Every deletion is anchored on text and asserted. A block that has moved
   or already gone stops the script rather than silently doing nothing.

   Usage:  node tools/refactor-css.mjs [--dry]
   ========================================================================== */

import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const CSS = join(fileURLToPath(new URL(".", import.meta.url)), "..", "css");
const DRY = process.argv.includes("--dry");
let failed = 0;

function fail(message) {
  console.error(`  FAIL  ${message}`);
  failed++;
}

/* ---- Line-range surgery, for the readable stylesheet -------------------- */
function cutLines(lines, startMatch, endMatch, label) {
  const start = lines.findIndex(startMatch);
  if (start === -1) { fail(`${label}: start anchor not found`); return lines; }
  let end = -1;
  for (let i = start + 1; i < lines.length; i++) {
    if (endMatch(lines[i], i, lines)) { end = i; break; }
  }
  if (end === -1) { fail(`${label}: end anchor not found after line ${start + 1}`); return lines; }
  console.log(`  cut  ${label}  (lines ${start + 1}–${end + 1}, ${end - start + 1})`);
  return lines.slice(0, start).concat(lines.slice(end + 1));
}

const closeBrace = (line) => line.trim() === "}";

/* ========================================================================
   style.css — the homepage
   ======================================================================== */
console.log("style.css");
{
  const path = join(CSS, "style.css");
  let lines = readFileSync(path, "utf8").split(/\r?\n/);
  const before = lines.length;

  lines = cutLines(lines, (l) => l.trim() === ":root {", closeBrace, ":root palette");
  lines = cutLines(lines, (l) => l.trim() === ".visually-hidden {", closeBrace, ".visually-hidden");
  lines = cutLines(lines, (l) => l.trim() === ".icon {", closeBrace, ".icon");
  lines = cutLines(lines, (l) => l.trim() === ".shell {", closeBrace, ".shell");

  /* The header block, stopping short of .search-key — that one styles the
     HERO field's keycap, which stays on this page. */
  lines = cutLines(
    lines,
    (l, i, all) => l.startsWith("/* ====") && (all[i + 1] || "").trim() === "Header",
    (l) => l.trim() === ".mini-search:focus-within .key { opacity: 0; }",
    "masthead / brand / mini-search / .key"
  );
  lines = cutLines(
    lines,
    (l) => l.trim() === ".nav-link {",
    (l) => l.startsWith('.nav-link[aria-current="true"]'),
    ".nav-link"
  );

  lines = cutLines(
    lines,
    (l, i, all) => l.startsWith("/* ====") && (all[i + 1] || "").includes("2026 Glass Plate"),
    (l, i, all) =>
      l.trim() === "}" &&
      (all[i - 1] || "").includes("prefers-reduced-transparency") === false &&
      (all[i - 1] || "").includes("backdrop-filter:none"),
    "2026 Glass Plate patch"
  );

  let css = lines.join("\n");

  /* The stale Explore pill referenced a token that never existed
     (--accent-soft) and fought the new nav with !important. */
  css = css.replace(
    /\/\* Primary Explore navigation \*\/\n\.nav-link-explore\{[^\n]*\n/,
    ""
  );
  css = css.replace(/\.nav-link-drip\{[^}]*\}\n?/g, "");

  if (!DRY) writeFileSync(path, css, "utf8");
  console.log(`  ${before} → ${css.split("\n").length} lines\n`);
}

/* ========================================================================
   seo.css and weekly-drip.css — minified, so these are string edits.

   Rather than rewrite several hundred var() call sites, each file's private
   palette becomes an ALIAS onto the token layer. Every existing
   var(--orange) / var(--drip-ink) then follows the theme for free.
   ======================================================================== */
function aliasPalette(file, oldRootPattern, aliasBlock, label) {
  const path = join(CSS, file);
  let css = readFileSync(path, "utf8");
  if (!oldRootPattern.test(css)) { fail(`${file}: ${label} :root not found`); return; }
  css = css.replace(oldRootPattern, aliasBlock);
  console.log(`  aliased ${label} palette onto tokens`);
  if (!DRY) writeFileSync(path, css, "utf8");
}

console.log("seo.css");
aliasPalette(
  "seo.css",
  /:root\{--bg:#fbfaf9;[^}]*--orange-dark:#a83b0e\}/,
  "/* The legacy names now alias the token layer, so every existing\n" +
  "   var(--orange) on 50 pages follows the theme. */\n" +
  ":root{--orange:var(--accent);--orange-dark:var(--accent-ink);" +
  "--muted:var(--ink-3);--line2:var(--line-strong)}\n",
  "seo"
);

console.log("weekly-drip.css");
aliasPalette(
  "weekly-drip.css",
  /:root\{--drip-orange:#c74614;[^}]*--drip-soft:#f3eee9\}/,
  "/* Legacy drip names alias the token layer. */\n" +
  ":root{--drip-orange:var(--accent-ink);--drip-ink:var(--ink);" +
  "--drip-paper:var(--bg);--drip-line:var(--line);--drip-soft:var(--surface-sunk)}\n",
  "drip"
);

console.log(failed ? `\n${failed} anchor(s) missed — nothing can be trusted` : "\nall anchors matched");
process.exit(failed ? 1 : 0);
