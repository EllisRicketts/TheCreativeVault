/* ==========================================================================
   stamp-counts.mjs — write the real library counts into the static HTML.

   Why: the homepage hero used to ship "0 creative resources … 0 categories"
   in its markup and wait for app.js to overwrite it. app.js can only do
   that after the ~250 KB (br) generated-resources.js has downloaded and
   parsed, so on a slow connection, a blocked or failed script, a crawler
   or a link-preview bot, the page announced an empty library. Now the
   true numbers are in the HTML; app.js still refreshes them on load.

   Every element carrying data-stamp="resources" or data-stamp="categories"
   is rewritten, on every page. Counted exactly the way app.js counts:
   after schema.js upgrades the records and junk values are stripped.

   Usage:  node tools/stamp-counts.mjs      (npm run compile runs it too)
   ========================================================================== */

import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const SITE = join(fileURLToPath(new URL(".", import.meta.url)), "..");

const ctx = vm.createContext({ console });
for (const file of ["data/schema.js", "data/generated-resources.js", "data/resources.js"]) {
  vm.runInContext(readFileSync(join(SITE, file), "utf8"), ctx, { filename: file });
}
const all = vm.runInContext("resources", ctx);

const JUNK = /^(true|false|null|undefined|n\/a|none|-)$/i;
const categories = new Set();
for (const r of all) {
  for (const c of r.categories || []) {
    const v = typeof c === "string" ? c.trim() : "";
    if (v && !JUNK.test(v)) categories.add(v);
  }
}

const values = {
  resources: all.length.toLocaleString("en-US"),
  categories: categories.size.toLocaleString("en-US"),
};

if (!all.length) {
  console.error("stamp-counts: 0 resources loaded — refusing to stamp.");
  process.exit(1);
}

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === "node_modules" || name === "database") continue;
      walk(full, out);
    } else if (name.endsWith(".html")) out.push(full);
  }
  return out;
}

let changed = 0;
for (const file of walk(SITE)) {
  const html = readFileSync(file, "utf8");
  const next = html.replace(
    /(<([a-z]+)[^>]*\bdata-stamp="(resources|categories)"[^>]*>)([^<]*)(<\/\2>)/g,
    (m, open, tag, key, _old, close) => open + values[key] + close
  );
  if (next !== html) { writeFileSync(file, next, "utf8"); changed++; }
}

console.log(`stamp-counts: ${values.resources} resources, ${values.categories} categories → ${changed} file(s) updated`);
