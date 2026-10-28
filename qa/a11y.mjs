/* axe-core scan (WCAG 2.x A/AA) across key routes, light and dark.
   Usage: node a11y.mjs [base] */
import { chromium } from "playwright";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const axe = readFileSync(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");
const base = (process.argv[2] || "http://localhost:4173").replace(/\/$/, "");
const routes = ["/", "/explore/", "/weekly-drip/", "/comparisons/", "/comparisons/blender-vs-maya/", "/categories/3d-cad/", "/guides/3d-tools/", "/my-vault/"];
const browser = await chromium.launch();
let total = 0;
for (const theme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  await ctx.addInitScript(t => localStorage.setItem("vault:theme", t), theme);
  const page = await ctx.newPage();
  for (const r of routes) {
    await page.goto(base + r, { waitUntil: "networkidle" });
    await page.waitForTimeout(300);
    await page.addScriptTag({ content: axe });
    const res = await page.evaluate(async () => (await axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] })).violations
      .map(v => ({ id: v.id, impact: v.impact, n: v.nodes.length, sample: v.nodes[0].target.join(" ") })));
    total += res.length;
    console.log(`${theme} ${r}: ${res.length ? res.map(v => `${v.id}(${v.impact},${v.n}) e.g. ${v.sample}`).join("; ") : "clean"}`);
  }
  await ctx.close();
}
await browser.close();
process.exit(total ? 1 : 0);
