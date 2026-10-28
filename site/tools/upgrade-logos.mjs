/* ==========================================================================
   upgrade-logos.mjs — put the static pages on the shared logo chain.

   1. Category and guide cards load DuckDuckGo directly with an inline
      onerror that hides the image. DuckDuckGo answers a missing icon with a
      404 *and* a grey placeholder arrow, which onerror never sees, so those
      cards showed the arrow. They now start at Google's 128px service and
      fall through via js/logos.js, which measures each image on load.
   2. Comparison pages show drawn monograms ("Bl", "M") from
      images/product-icons/. They now show the real mark, keeping the
      drawing as the final fallback (data-last).

   Adds <script src="/js/logos.js" defer> to every page it touches.
   Idempotent. Usage:  node tools/upgrade-logos.mjs [--dry]
   ========================================================================== */

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const SITE = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const DRY = process.argv.includes("--dry");

const ctx = vm.createContext({});
for (const f of ["data/schema.js", "data/generated-resources.js", "data/resources.js"]) {
  vm.runInContext(readFileSync(join(SITE, f), "utf8"), ctx);
}
const all = vm.runInContext("resources", ctx);
const slug = (s) => String(s || "").toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };
const bySlug = new Map();
for (const r of all) {
  for (const k of [r.id, slug(r.title)]) if (k && !bySlug.has(k)) bySlug.set(k, r);
}

const google = (h) => `https://www.google.com/s2/favicons?domain=${encodeURIComponent(h)}&amp;sz=128`;
const ddg = (h) => `https://icons.duckduckgo.com/ip3/${h}.ico`;

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === "node_modules" || name === "database" || name === "tools") continue;
      walk(full, out);
    } else if (name.endsWith(".html")) out.push(full);
  }
  return out;
}

let pages = 0, swapped = 0, unmapped = new Set();
for (const file of walk(SITE)) {
  const html = readFileSync(file, "utf8");
  let next = html;

  /* 1. DuckDuckGo-first images with the hide-on-error handler. */
  next = next.replace(
    /<img src="https:\/\/icons\.duckduckgo\.com\/ip3\/([^"]+?)\.ico"([^>]*?)\s*onerror="this\.style\.display='none'"([^>]*)>/g,
    (m, h, a, b) => { swapped++; return `<img src="${google(h)}" data-chain="${ddg(h)}"${a}${b}>`; }
  );

  /* 2. Drawn monograms on comparison pages. */
  next = next.replace(
    /<img src="\/images\/product-icons\/([a-z0-9-]+)\.svg"([^>]*)>/g,
    (m, name, rest) => {
      const r = bySlug.get(name) || bySlug.get(name.replace(/-(free|legacy)$/, ""));
      const h = r && host(r.website);
      if (!h) { unmapped.add(name); return m; }
      swapped++;
      return `<img src="${google(h)}" data-chain="${ddg(h)}" data-last="/images/product-icons/${name}.svg"${rest}>`;
    }
  );

  if (next !== html && !next.includes("/js/logos.js")) {
    next = next.replace(/<\/head>/i, `  <script src="/js/logos.js" defer></script>\n</head>`);
  }

  if (next !== html) {
    pages++;
    if (!DRY) writeFileSync(file, next, "utf8");
  }
}

console.log(`${DRY ? "[dry] " : ""}${swapped} logos on ${pages} pages moved to the shared chain`);
if (unmapped.size) console.log("kept drawn monogram (no record found):", [...unmapped].join(", "));
