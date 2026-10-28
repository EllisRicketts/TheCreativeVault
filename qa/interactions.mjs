/* End-to-end interaction checks. Usage: node interactions.mjs [base]
   Exits non-zero if any check fails. */
import { chromium } from "playwright";

const base = (process.argv[2] || "http://localhost:4173").replace(/\/$/, "");
const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok, detail }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? "  — " + detail : ""}`); };
const IGNORE = /favicon|s2\/favicons|duckduckgo|gstatic|ytimg|status of 404/;

const browser = await chromium.launch();

/* ---------- desktop ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error" && !IGNORE.test(m.text())) errors.push(m.text()); });

  /* The hero must never say 0 — even in the raw HTML. */
  const raw = await (await page.request.get(base + "/")).text();
  const rawCount = raw.match(/id="totalCount"[^>]*>([^<]*)</)?.[1];
  check("raw HTML hero count is not 0", rawCount && rawCount !== "0", `"${rawCount}"`);

  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  check("hero count after JS", (await page.textContent("#totalCount")) === rawCount, await page.textContent("#totalCount"));
  check("60 cards on first render", (await page.locator("#resourceGrid .card").count()) === 60);
  check("24 category tiles", (await page.locator(".category").count()) === 24);
  check("hero marks rendered", (await page.locator(".hero-mark").count()) >= 10);
  check("starter kits rendered", (await page.locator(".collection").count()) >= 8);
  check("weekly drip loaded 4 picks", (await page.locator(".drip-item").count()) === 4);
  const dripIds = await page.$$eval(".drip-item", a => a.map(x => x.href));
  check("weekly drip picks are unique", new Set(dripIds).size === dripIds.length);

  /* Search */
  await page.fill("#searchInput", "blender");
  await page.waitForTimeout(400);
  const first = await page.locator("#resourceGrid .card .card-title").first().textContent();
  check("search ranks exact title first", /^blender$/i.test(first.trim()), first);
  check("URL carries the query", page.url().includes("q=blender"));
  check("active chip shows search", (await page.locator('.active-chip[data-clear="q"]').count()) === 1);

  /* Filters */
  await page.selectOption("#priceFilter", "Free");
  await page.waitForTimeout(300);
  const prices = await page.$$eval("#resourceGrid .price", n => n.map(x => x.textContent));
  check("price filter applies", prices.length > 0 && prices.every(p => p === "Free"), `${prices.length} cards`);
  await page.click('.active-chip[data-clear="q"]');
  await page.waitForTimeout(300);
  check("removing one chip keeps the other", !page.url().includes("q=") && page.url().includes("price=Free"));
  await page.click("#resetFilters");
  await page.waitForTimeout(300);
  check("Clear all resets", (await page.locator("#activeFilters").isHidden()) && !page.url().includes("?"));

  /* Empty state */
  await page.fill("#searchInput", "zzqxqzzq");
  await page.waitForTimeout(400);
  check("empty state shows", await page.locator("#emptyState").isVisible());
  await page.click("[data-reset]");
  await page.waitForTimeout(300);

  /* Category tile → filter */
  await page.locator(".category > button").first().click();
  await page.waitForTimeout(700);
  check("category tile filters library", (await page.inputValue("#categoryFilter")) !== "all");
  await page.click("#resetFilters");

  /* Starter kit */
  await page.locator(".collection").first().click();
  await page.waitForTimeout(600);
  check("starter kit filters library", page.url().includes("collection="));
  await page.click("#resetFilters");
  await page.waitForTimeout(300);

  /* View toggle */
  await page.click('[data-view-set="list"]');
  check("list view", (await page.getAttribute("#resourceGrid", "data-view")) === "list");
  await page.click('[data-view-set="grid"]');

  /* Details dialog */
  await page.locator("#resourceGrid .card-open").first().click();
  await page.waitForTimeout(400);
  check("details dialog opens", await page.locator("#resourceModal").evaluate(d => d.open));
  check("dialog has Visit link", (await page.locator("#resourceModal .modal-actions a[href^='http']").count()) === 1);
  const related = page.locator("#resourceModal .related-item").first();
  if (await related.count()) {
    const t = await related.textContent();
    await related.click();
    await page.waitForTimeout(300);
    check("related item swaps dialog content", (await page.textContent("#modalTitle")).trim() === t.trim(), t);
  }
  await page.keyboard.press("Escape");
  await page.waitForTimeout(400);
  check("Escape closes dialog", !(await page.locator("#resourceModal").evaluate(d => d.open)));
  check("focus returns to the card", await page.evaluate(() => document.activeElement?.classList.contains("card-open")));

  /* Hero mark opens details */
  await page.locator(".hero-mark button").first().click({ force: true });
  await page.waitForTimeout(400);
  check("hero mark opens details", (await page.textContent("#modalTitle")).trim().length > 0);
  await page.click("#modalClose");
  await page.waitForTimeout(400);

  /* Favourites */
  await page.locator("#resourceGrid .fav").first().click();
  await page.waitForTimeout(200);
  check("heart saves + badge shows 1", (await page.textContent("[data-vault-count]")) === "1");

  /* Saved search */
  await page.fill("#searchInput", "texture");
  await page.waitForTimeout(400);
  await page.click("[data-save-search]");
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("vault:searches") || "[]").length);
  check("save this search stores it", saved === 1);
  await page.click("#resetFilters");

  /* Infinite scroll is capped so the footer is reachable */
  for (let i = 0; i < 12; i++) { await page.mouse.wheel(0, 2500); await page.waitForTimeout(250); }
  const cards = await page.locator("#resourceGrid .card").count();
  await page.evaluate(() => scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(800);
  const cards2 = await page.locator("#resourceGrid .card").count();
  check("auto-loading stops; footer reachable", cards2 === cards && cards <= 60 + 36 * 3 && await page.locator(".site-footer").isVisible(), `${cards} cards`);
  await page.click("#loadMoreButton");
  check("Show more still works", (await page.locator("#resourceGrid .card").count()) === cards + 36);

  /* "/" focuses search */
  await page.evaluate(() => scrollTo(0, 0));
  await page.waitForTimeout(300);
  await page.locator("body").click({ position: { x: 5, y: 600 } });
  await page.keyboard.press("/");
  check('"/" focuses search', await page.evaluate(() => document.activeElement?.id === "searchInput"));

  /* Theme switch */
  await page.click('[data-theme-set="dark"]');
  check("dark theme applies", (await page.getAttribute("html", "data-theme")) === "dark");
  await page.click('[data-theme-set="light"]');

  /* My Vault reflects the saved item */
  await page.goto(base + "/my-vault/", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  check("My Vault lists the saved card", (await page.locator(".card").count()) >= 1);
  check("My Vault card has Visit", (await page.locator(".card .card-visit").count()) >= 1);

  /* Masthead search on an inner page lands on results */
  await page.goto(base + "/explore/", { waitUntil: "networkidle" });
  await page.fill("#miniSearchInput", "figma");
  await page.press("#miniSearchInput", "Enter");
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(500);
  check("inner-page search lands on results", page.url().includes("q=figma") && (await page.locator("#resourceGrid .card").count()) > 0);

  /* Comparison logos resolve to real marks */
  await page.goto(base + "/comparisons/blender-vs-maya/", { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const srcs = await page.$$eval(".cmp-product img", i => i.map(x => x.currentSrc));
  check("comparison shows favicon, not monogram", srcs.length && srcs.every(s => !s.includes("product-icons")), srcs.join(" | ").slice(0, 120));

  check("no console errors (desktop)", errors.length === 0, errors.slice(0, 3).join(" | "));
  await ctx.close();
}

/* ---------- phone ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  check("menu button visible on phone", await page.locator(".mast-menu").isVisible());
  await page.click(".mast-menu");
  check("menu opens", await page.locator(".mast-nav").isVisible());
  check("menu shows 4 destinations", (await page.locator(".mast-nav a:visible").count()) === 4);
  await page.keyboard.press("Escape");
  check("Escape closes menu", !(await page.locator(".mast-nav").isVisible()));

  await page.locator("#resources").scrollIntoViewIfNeeded();
  check("filter fields hidden until asked", !(await page.locator("#categoryFilter").isVisible()));
  await page.click("#filterToggle");
  check("filter panel opens", await page.locator("#categoryFilter").isVisible());
  await page.selectOption("#platformFilter", "iPad");
  await page.waitForTimeout(300);
  check("filter count badge", (await page.textContent("#filterCount")) === "1");

  const small = await page.$$eval("button:visible, a:visible", els =>
    els.filter(e => !e.classList.contains("card-open") /* stretched over the whole card */).filter(e => { const r = e.getBoundingClientRect(); return r.width && r.height && (r.height < 24 || r.width < 24); })
       .map(e => (e.className || e.tagName) + ":" + Math.round(e.getBoundingClientRect().height)).slice(0, 8));
  check("no tiny tap targets (<24px)", small.length === 0, small.join(", "));
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  check("no horizontal overflow", overflow <= 0, `${overflow}px`);
  await ctx.close();
}

/* ---------- data failure ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.route("**/data/generated-resources.js", r => r.abort());
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  check("blocked data: hero still shows real count", (await page.textContent("#totalCount")) !== "0", await page.textContent("#totalCount"));
  check("blocked data: honest error shown", await page.locator("#loadError").isVisible());
  await ctx.close();
}

/* ---------- reduced motion ---------- */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  await page.goto(base + "/", { waitUntil: "networkidle" });
  const hidden = await page.$$eval(".reveal", n => n.filter(x => getComputedStyle(x).opacity === "0").length);
  check("reduced motion: nothing left invisible", hidden === 0);
  check("reduced motion: no js-reveal class", !(await page.evaluate(() => document.documentElement.classList.contains("js-reveal"))));
  await ctx.close();
}

await browser.close();
const failed = results.filter(r => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} passed`);
process.exit(failed.length ? 1 : 0);
