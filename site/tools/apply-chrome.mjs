/* ==========================================================================
   apply-chrome.mjs — put the one shared masthead on every page.

   The site grew three headers (.masthead, .seo-header, .drip-header) across
   55 static pages. This script replaces all of them with a single markup
   block, and wires the token layer, the anti-flash theme boot and theme.js
   into every <head>.

   Idempotent: running it twice changes nothing the second time.
   Usage:  node tools/apply-chrome.mjs [--dry]
   ========================================================================== */

import { readFileSync, writeFileSync } from "node:fs";
import { readdirSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const DRY = process.argv.includes("--dry");

/* -- Files ---------------------------------------------------------------- */
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (name === "node_modules" || name === "database") continue;
      walk(full, out);
    } else if (name.endsWith(".html")) {
      out.push(full);
    }
  }
  return out;
}

/* The OG card renders from the tokens on purpose and must not get chrome. */
const SKIP = new Set(["tools/og-template.html", "tools/build-database.html"]);

/* -- The shared blocks ---------------------------------------------------- */

/* Runs BEFORE first paint. Without it a dark-theme visitor gets a white
   flash on every navigation, which is the single most visible way a theme
   feature reads as broken. Kept tiny and inline for that reason. */
const BOOT = `<script>
  /* Anti-flash theme boot. Must stay inline and blocking — see js/theme.js. */
  (function(){try{var t=localStorage.getItem("vault:theme");
  if(t!=="light"&&t!=="medium"&&t!=="dark"){t=window.matchMedia&&
  window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}
  document.documentElement.setAttribute("data-theme",t);}catch(e){}})();
  </script>`;

const HEAD_LINKS = `<link rel="stylesheet" href="/css/tokens.css" />
  <link rel="stylesheet" href="/css/chrome.css" />
  <script src="/js/theme.js" defer></script>`;

const SPRITE = `<svg class="chrome-sprite" aria-hidden="true" focusable="false"><defs>
<symbol id="c-search" viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.4"/><path d="m20 20-4.3-4.3"/></symbol>
<symbol id="c-sun" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.1"/><path d="M12 2.6v2.2M12 19.2v2.2M4.4 4.4l1.6 1.6M18 18l1.6 1.6M2.6 12h2.2M19.2 12h2.2M4.4 19.6 6 18M18 6l1.6-1.6"/></symbol>
<symbol id="c-half" viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16Z" fill="currentColor" stroke="none"/></symbol>
<symbol id="c-moon" viewBox="0 0 24 24"><path d="M20 14.2A8.4 8.4 0 0 1 9.8 4a8.4 8.4 0 1 0 10.2 10.2Z"/></symbol>
<symbol id="c-vault" viewBox="0 0 24 24"><path d="M6 4h12a1 1 0 0 1 1 1v15.2a.6.6 0 0 1-.93.5L12 16.6l-6.07 4.1A.6.6 0 0 1 5 20.2V5a1 1 0 0 1 1-1Z"/></symbol>
<symbol id="c-menu" viewBox="0 0 24 24"><path d="M4 7h16M4 12h16M4 17h10"/></symbol>
<symbol id="c-plus" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></symbol>
<symbol id="c-out" viewBox="0 0 24 24"><path d="M8 16 16 8M9 8h7v7"/></symbol>
</defs></svg>`;

/* Three destinations. The homepage's seven links included four in-page
   anchors, which on any other page jumped the visitor somewhere else. */
const NAV = [
  { href: "/explore/", label: "Explore" },
  { href: "/weekly-drip/", label: "Weekly Drip" },
  { href: "/comparisons/", label: "Comparisons" },
];

function header(currentPath) {
  const links = NAV.map((item) => {
    const current = currentPath === item.href;
    return `      <a href="${item.href}"${current ? ' aria-current="page"' : ""}>${item.label}</a>`;
  }).join("\n");

  const vaultCurrent = currentPath === "/my-vault/";

  return `<a class="skip-link" href="#main">Skip to content</a>
${SPRITE}
<header class="masthead" id="top">
  <div class="shell masthead-inner">
    <a class="brand" href="/" aria-label="The Creative Vault — home">
      <span class="brand-mark"><img src="/images/logos/cv-secondary-logo.png" alt="" width="34" height="34" /></span>
      <span class="brand-name">The <em>Creative</em> Vault</span>
    </a>

    <!-- One set of links. On wide screens the panel dissolves (display:
         contents) and its children sit in the bar; below 900px it becomes the
         menu the button opens. -->
    <div class="mast-panel" id="mastPanel">
      <nav class="mast-nav" aria-label="Main">
${links}
        <a class="mast-nav-vault" href="/my-vault/"${vaultCurrent ? ' aria-current="page"' : ""}>My Vault</a>
      </nav>

      <div class="mast-panel-tools">
        <div class="theme-switch" role="radiogroup" aria-label="Colour theme">
          <button class="theme-btn" type="button" role="radio" data-theme-set="light"
                  aria-checked="false" tabindex="-1" title="Light theme">
            <svg class="icon" aria-hidden="true"><use href="#c-sun"/></svg>
            <span class="visually-hidden">Light</span>
          </button>
          <button class="theme-btn" type="button" role="radio" data-theme-set="medium"
                  aria-checked="false" tabindex="-1" title="Medium theme — warm and dimmed">
            <svg class="icon" aria-hidden="true"><use href="#c-half"/></svg>
            <span class="visually-hidden">Medium</span>
          </button>
          <button class="theme-btn" type="button" role="radio" data-theme-set="dark"
                  aria-checked="false" tabindex="-1" title="Dark theme">
            <svg class="icon" aria-hidden="true"><use href="#c-moon"/></svg>
            <span class="visually-hidden">Dark</span>
          </button>
        </div>
        <a class="mast-submit" href="/#submit">
          <svg class="icon" aria-hidden="true"><use href="#c-plus"/></svg>
          <span>Suggest a tool</span>
        </a>
      </div>
    </div>

    <div class="mast-tools">
      <form class="mast-search" action="/" method="get" role="search">
        <svg class="icon" aria-hidden="true"><use href="#c-search"/></svg>
        <label class="visually-hidden" for="miniSearchInput">Search resources</label>
        <input id="miniSearchInput" name="q" type="search" autocomplete="off"
               spellcheck="false" placeholder="Search the vault" />
        <kbd class="key">/</kbd>
      </form>

      <a class="mast-vault" href="/my-vault/"${vaultCurrent ? ' aria-current="page"' : ""}>
        <svg class="icon" aria-hidden="true"><use href="#c-vault"/></svg>
        <span class="mast-vault-label">My Vault</span>
        <span class="vault-count" data-vault-count hidden>0</span>
      </a>

      <button class="mast-menu" type="button" aria-expanded="false" aria-controls="mastPanel">
        <svg class="icon" aria-hidden="true"><use href="#c-menu"/></svg>
        <span class="visually-hidden">Menu</span>
      </button>
    </div>
  </div>
</header>`;
}

/* One footer for every page. The site shipped four (site-footer, seo-footer,
   drip-footer, none at all on 404) and the "Visit EllisRicketts.com" button
   sat outside every one of their shells, pinned to the left edge. */
const FOOTER_COLUMNS = [
  { title: "Directory", links: [
    ["/#resources", "Search the Vault"], ["/explore/", "Explore"], ["/weekly-drip/", "Weekly Drip"],
    ["/comparisons/", "Comparisons"], ["/my-vault/", "My Vault"] ] },
  { title: "Categories", links: [
    ["/categories/digital-art/", "Digital Art"], ["/categories/3d-cad/", "3D / CAD"],
    ["/categories/ai-tools/", "AI Tools"], ["/categories/game-dev/", "Game Dev"],
    ["/categories/music/", "Music"], ["/categories/grants/", "Grants"] ] },
  { title: "Guides", links: [
    ["/guides/free-creative-tools/", "Free creative tools"], ["/guides/ai-tools-for-creators/", "AI tools for creators"],
    ["/guides/3d-tools/", "3D tools"], ["/guides/font-typography-resources/", "Fonts &amp; typography"],
    ["/guides/public-domain-resources/", "Public domain"] ] },
];

/* The homepage keeps its long descriptive paragraph: it is the page's best
   plain-language summary for search engines, so it is not trimmed away. */
const HOME_ABOUT = `<strong>The Creative Vault</strong> is a curated index of the tools creative people
      actually use: software for digital art, 3D, photography, video, audio and game
      development, alongside asset marketplaces, public-domain archives, arts grants and
      funding, learning platforms, freelancing resources and AI tools. Every entry is
      chosen by hand rather than scraped, and each one records its pricing model and
      platform support so you can tell in a glance whether it fits how you work.`;

function footer(currentPath) {
  const cols = FOOTER_COLUMNS.map((col) => `    <nav class="footer-col" aria-label="${col.title}">
      <h2>${col.title}</h2>
${col.links.map(([href, label]) => `      <a href="${href}"${href === currentPath ? ' aria-current="page"' : ""}>${label}</a>`).join("\n")}
    </nav>`).join("\n");

  const about = currentPath === "/"
    ? `\n  <div class="shell footer-about"><p>\n      ${HOME_ABOUT}\n  </p></div>`
    : "";

  return `<footer class="site-footer">${about}
  <div class="shell footer-grid">
    <div class="footer-brand">
      <a class="brand" href="/" aria-label="The Creative Vault — home">
        <span class="brand-mark"><img src="/images/logos/cv-secondary-logo.png" alt="" width="34" height="34" loading="lazy" /></span>
        <span class="brand-name">The <em>Creative</em> Vault</span>
      </a>
      <p>A hand-picked index of creative software, assets, marketplaces, grants and learning. No listicles, no affiliate spam.</p>
      <a class="ellis-footer-button" href="https://www.ellisricketts.com/" target="_blank" rel="noopener noreferrer">
        Visit EllisRicketts.com <svg class="icon" aria-hidden="true"><use href="#c-out"/></svg>
      </a>
    </div>
${cols}
  </div>
  <div class="shell footer-line">
    <p>© 2026 The Creative Vault · Curated by Ellis Ricketts</p>
    <p class="footer-line-links">
      <a href="mailto:ellisricketts3d@gmail.com">Get in touch</a>
      <a href="/#submit">Suggest a resource</a>
      <a href="/downloads/The-Creative-Vault-Offline-Resource-Library.pdf" download>Offline PDF</a>
    </p>
  </div>
</footer>`;
}

/* -- Transform ------------------------------------------------------------ */

function routeOf(file) {
  const rel = relative(SITE, file).split(sep).join("/");
  if (rel === "index.html") return "/";
  return "/" + rel.replace(/index\.html$/, "");
}

function apply(file) {
  const original = readFileSync(file, "utf8");
  let html = original;
  const route = routeOf(file);
  const notes = [];

  /* 1. Head: token layer, chrome, boot, theme.js — before any page CSS. */
  if (!html.includes("/css/tokens.css")) {
    /* Anchor on the first stylesheet link so the cascade order is right;
       fall back to </head> for pages that link none. */
    const firstLink = html.search(/<link[^>]+rel=["']stylesheet["']/i);
    const block = `  ${BOOT}\n  ${HEAD_LINKS}\n  `;
    if (firstLink !== -1) {
      html = html.slice(0, firstLink) + block.trimStart() + "\n  " + html.slice(firstLink);
    } else {
      html = html.replace(/<\/head>/i, block + "\n</head>");
    }
    notes.push("head");
  }

  /* 2. Header: replace whichever of the three variants this page carries. */
  const HEADERS = [
    /* Already-applied chrome first, and matched from the skip link rather
       than from <header>, so a re-run replaces the whole block instead of
       prepending a second skip link and sprite in front of it. */
    /<a class="skip-link"[\s\S]*?<\/header>/i,
    /<header class="masthead"[\s\S]*?<\/header>/i,
    /<header class="seo-header"[\s\S]*?<\/header>/i,
    /<header class="drip-header"[\s\S]*?<\/header>/i,
  ];
  let replaced = false;
  for (const pattern of HEADERS) {
    if (pattern.test(html)) {
      html = html.replace(pattern, header(route));
      replaced = true;
      notes.push("header");
      break;
    }
  }
  /* 404 and anything else with no header at all gets one. */
  if (!replaced && !html.includes('class="masthead"')) {
    html = html.replace(/<body([^>]*)>/i, `<body$1>\n${header(route)}\n`);
    notes.push("header+");
  }

  /* 3. The skip link needs a target. */
  if (!/id=["']main["']/.test(html)) {
    if (/<main\b/i.test(html)) {
      html = html.replace(/<main\b/i, '<main id="main"');
    } else {
      html = html.replace(/<\/header>/i, '</header>\n<div id="main" tabindex="-1"></div>');
    }
    notes.push("main-id");
  }

  /* 4. Footer: replace whichever variant this page carries, or add one.
        Older pages carried the EllisRicketts button just AFTER their footer,
        outside any shell, so a trailing copy is swept up with it. */
  const FOOTER = /<footer class="(?:site-footer|seo-footer|drip-footer)"[\s\S]*?<\/footer>(?:\s*<a class="ellis-footer-button"[^>]*>[^<]*<\/a>)?/i;
  if (FOOTER.test(html)) {
    html = html.replace(FOOTER, footer(route));
    notes.push("footer");
  } else if (/<\/main>/i.test(html)) {
    html = html.replace(/<\/main>/i, "</main>\n" + footer(route));
    notes.push("footer+");
  }

  /* 5. The old per-page palettes are gone; drop their now-dead colour-scheme
        meta so the browser does not fight the token layer. */
  html = html.replace(/\s*<meta name="color-scheme"[^>]*>/i, "");

  if (html === original) return null;
  if (!DRY) writeFileSync(file, html, "utf8");
  return notes.join(",");
}

/* -- Run ------------------------------------------------------------------ */
const files = walk(SITE).filter((f) => {
  const rel = relative(SITE, f).split(sep).join("/");
  return !SKIP.has(rel);
});

let changed = 0;
const summary = {};
for (const file of files) {
  const note = apply(file);
  if (note) {
    changed++;
    summary[note] = (summary[note] || 0) + 1;
  }
}

console.log(`${DRY ? "[dry run] " : ""}${changed} of ${files.length} pages updated`);
for (const [note, count] of Object.entries(summary)) {
  console.log(`  ${count.toString().padStart(3)}  ${note}`);
}
