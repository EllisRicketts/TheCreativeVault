/* Responsive screenshots + console errors for a set of routes.
   Usage: node shots.mjs <baseUrl> <label> [route ...]
   Writes qa/out/<label>/<route>-<width>.png and prints every console error. */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const base = (process.argv[2] || "http://localhost:4173").replace(/\/$/, "");
const label = process.argv[3] || "shots";
const routes = process.argv.slice(4).length ? process.argv.slice(4) : [
  "/", "/explore/", "/weekly-drip/", "/comparisons/", "/comparisons/blender-vs-maya/",
  "/categories/3d-cad/", "/guides/3d-tools/", "/my-vault/", "/does-not-exist"
];
const widths = [{ w: 1440, h: 900 }, { w: 820, h: 1180 }, { w: 390, h: 844 }];
const theme = process.env.THEME || "";
const full = process.env.FULL !== "0";

mkdirSync(`out/${label}`, { recursive: true });
const browser = await chromium.launch();
let problems = 0;

for (const size of widths) {
  const ctx = await browser.newContext({ viewport: { width: size.w, height: size.h }, deviceScaleFactor: 1 });
  if (theme) await ctx.addInitScript(t => { try { localStorage.setItem("vault:theme", t); } catch (e) {} }, theme);
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", e => errors.push("pageerror: " + e.message));

  for (const route of routes) {
    errors.length = 0;
    await page.goto(base + route, { waitUntil: "networkidle" }).catch(e => errors.push("nav: " + e.message));
    await page.waitForTimeout(500);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const name = (route.replace(/\//g, "_").replace(/^_|_$/g, "") || "home") + `-${size.w}`;
    await page.screenshot({ path: `out/${label}/${name}.png`, fullPage: full });
    const real = errors.filter(e => !/favicon|icons\.duckduckgo|google\.com\/s2|ERR_NAME|status of 404/.test(e));
    if (overflow > 0 || real.length) problems++;
    console.log(`${name}: overflow=${overflow}px errors=${real.length}${real.length ? "\n  " + real.slice(0, 5).join("\n  ") : ""}`);
  }
  await ctx.close();
}
await browser.close();
console.log(problems ? `${problems} page/width combos with problems` : "clean");
