/* Targeted screenshots of homepage sections at a width and theme.
   Usage: node views.mjs <base> <label> <width> [theme] */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const [base = "http://localhost:4173", label = "views", w = "1440", theme = "light"] = process.argv.slice(2);
const width = Number(w);
mkdirSync(`out/${label}`, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width, height: width < 600 ? 844 : 900 } });
await ctx.addInitScript(t => { try { localStorage.setItem("vault:theme", t); localStorage.setItem("vault:tipDismissed", "1"); } catch (e) {} }, theme);
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", e => errors.push(e.message));
page.on("console", m => { if (m.type() === "error" && !/favicon|s2\/favicons|duckduckgo|gstatic|404/.test(m.text())) errors.push(m.text()); });

await page.goto(base + "/", { waitUntil: "networkidle" });
await page.waitForTimeout(900);
const sections = ["main", "#weekly-drip", "#categories", "#collections", "#resources", "#offline", "#explore-guides", "#submit", "footer"];
for (const sel of sections) {
  const loc = page.locator(sel === "main" ? "body" : sel).first();
  if (sel === "main") { await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300); await page.screenshot({ path: `out/${label}/${w}-${theme}-00-top.png` }); continue; }
  await loc.scrollIntoViewIfNeeded();
  await page.evaluate(s => { const n = document.querySelector(s); scrollTo(0, n.getBoundingClientRect().top + scrollY - 70); }, sel);
  await page.waitForTimeout(700);
  await page.screenshot({ path: `out/${label}/${w}-${theme}-${String(sections.indexOf(sel)).padStart(2, "0")}-${sel.replace(/\W/g, "")}.png` });
}
console.log(errors.length ? errors.join("\n") : "no console errors");
await browser.close();
