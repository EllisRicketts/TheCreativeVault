# Design

Recorded from the built site, not from intentions. Source of truth is
`site/css/style.css`; this file explains it.

## Direction

Minimal, clean, bright — the category standard executed at full craft rather
than an own-world concept. User-pinned on 2026-08-10. Craft bar: Stripe,
Linear, Mobbin. Visitor mode: **Operate** — someone is completing a task
(find a tool), so scanability outranks expression.

The mark does the finding. A visitor recognises Blender's logo faster than they
read the word "Blender", so the logo is the card's anchor and everything else
is subordinate to it.

## Palette and themes

Source of truth is **`site/css/tokens.css`**, loaded first on all 54 pages.
Every colour is a custom property; no stylesheet below it names a colour.

Three themes, set as `data-theme` on `<html>`:

| Theme | Ground | For |
|---|---|---|
| `light` | `#fbfaf9` warm off-white | the original, unchanged |
| `medium` | `#e8e2d9` warm dimmed paper | a bright room, or a long browsing session |
| `dark` | `#17151a` warm near-black | never blue-black, so the orange still belongs |

The switch is a three-segment control in the masthead. The system preference
decides the **first** visit only; after that the visitor's choice is sticky in
`vault:theme`. A blocking inline snippet in every `<head>` sets `data-theme`
before first paint, because a white flash on every navigation is the most
visible way a theme feature reads as broken. Only colour crossfades on a
change (`.theme-shifting`, 220ms) — never layout, type or position.

### Token roles that carry rules

| Token | Rule |
|---|---|
| `--ink` / `--ink-2` / `--ink-3` | all clear 4.5:1 on every ground the theme paints, **including the frosted card gradient**, which sits lighter than `--surface` |
| `--accent` | fills and graphics only |
| `--accent-ink` | accent used as **text** |
| `--accent-btn-a/-b` | the primary-button gradient; its lightest stop clears 4.5:1 against `--on-accent` |
| `--on-accent` | button label. White in light and medium; **`#17151a` in dark**, because a bright orange fill can only clear 4.5:1 with dark type |
| `--line` | decorative hairline, deliberately low contrast |
| `--line-control` | the border of a real control; clears 3:1 on every ground |
| `--surface-invert` / `--on-invert` | deliberately inverted panels. In dark the panel goes **lighter** than the ground, since an almost-black panel on an almost-black page is invisible |

**The old flat `#d9530e` primary button gave its white label 4.04:1 and shipped
that way.** It is now a gradient that passes along its whole length.

### Verifying

Two scripts, both of which fail rather than opine:

- `node site/tools/check-contrast.mjs` parses `tokens.css` itself and re-checks
  every pair in all three themes. Run it after touching any colour.
- The browser audit in the session scratchpad measures *computed* contrast on
  the rendered page, composites alpha, and reads gradient stops, so it catches
  what token maths cannot — a label sitting on a surface nobody predicted.

## Type

Two families, and only two.

**Archivo** (400/500/600/700) is the interface: body, controls, meta, buttons.

**Bricolage Grotesque** (600–800, optical sizing on) is the display voice —
the hero headline and the wordmark, nothing else. Archivo alone was correct but
anonymous, and the headline is the one place the site is allowed to raise its
voice. The headline sets at `clamp(38px, 7.4vw, 78px)`, weight 700, tracking
`-0.045em`, leading 0.98, as two stacked beats: the first in ink, the second in
`--accent-ink`. Two tones, never a gradient.

## Art banner

A band of Ellis's own sketchbook work sits above the masthead at
`clamp(124px, 16vw, 236px)`. Two details make it belong to the page rather than
sit on top of it:

- `mix-blend-mode: multiply` drops the poster's paper white into the page
  ground, so only the graphite remains.
- A `mask-image` gradient fades it out downward into the page instead of ending
  on a hard edge.

Source art lives in `artwork-source/`, deliberately **outside** `site/` — the
original is a 49.79 MB, 7200×10800 print poster and must never be published.
The shipped crop is `site/images/banner-2400.webp` (382 KB) with a 1280px
variant for phones and a JPEG fallback.

- Display: `clamp(34px, 6vw, 60px)`, weight 660, tracking `-0.038em`
- Section heads: `clamp(22px, 2.6vw, 30px)`, weight 620
- Body: 16px / 1.55
- Card title 16px/580, description 13.8px, meta 12.5px
- Counts and figures carry `font-variant-numeric: tabular-nums`

## Space and shape

One rhythm: `--gutter: clamp(20px, 4vw, 48px)`, shell max 1240px, sections
`clamp(56px, 8vw, 104px)`. More space above a heading than below it. Radii:
14px cards, 9px controls, 999px chips.

Elevation always carries an offset **and** a blur — `--lift-1/2/3`. A
zero-offset coloured halo is decoration, not depth, and is not used.

## Components

- **Logo well** — 64px square, `--surface-sunk`, 1px line, 11px padding,
  `object-fit: contain`. Every mark sits on the same field whatever its shape,
  aspect or colour. 72px inside the detail dialog.
- **Card** — logo, title, company, 3-line clamped description, meta row, then a
  divided action row. The title carries a stretched `::after` link so the whole
  card opens the resource; Details and the favourite button sit above it.
- **Chip / category / collection** — same border-and-hover language as cards.
- **Toolbar** — sticky under the masthead at `var(--masthead-h)`, which app.js
  keeps in sync with the real header height via ResizeObserver. Active filters
  invert to solid ink.
- **Masthead** — one header for all 54 pages, in `site/css/chrome.css`, applied
  by `site/tools/apply-chrome.mjs` (idempotent; re-run after adding a page).
  The site previously shipped **three** headers — `.masthead`, `.seo-header`
  and `.drip-header` — with three navs and three brand treatments, so moving
  from the homepage to a category page changed sites.

  Nav carries **three destinations**, not seven. The old header mixed real
  pages with four homepage in-page anchors, which on any other page jumped the
  visitor somewhere else entirely. Section anchors belong to the page they
  live on.

  `--masthead-h` is an **output, never an input**: app.js measures the rendered
  header and publishes it for the sticky toolbar and anchor offsets, so any
  rule that sizes the header from that token closes a feedback loop. It did,
  once — the header grew ~19px per ResizeObserver tick, forever.

- **Masthead search** — one component everywhere. On the homepage app.js
  filters live as you type and suppresses the submit; on every other page it is
  a real form that lands on `/` with `?q=`, which app.js reads on load. It
  fades in only on the homepage, once the hero's own field scrolls away, via
  `data-compact` — hence the rule keys off an explicit `"false"` rather than a
  missing attribute.

- **Keycap** — a real `<kbd>` naming the `/` shortcut, which exists. It yields
  to the clear button when a query is present.
- **Bookmark bubble** — a tilted speech bubble at the foot of the hero in the
  accent wash, tail pointing up at the content it comments on. It straightens
  on hover. Shown once and dismissed forever via `vault:tipDismissed`; a tip
  that returns on every visit is a nag, not a tip. The modifier key is read
  from the platform, so Mac visitors see ⌘ rather than Ctrl.

## Views

Results render as thumbnails or as a list, switched by a two-button
segmented control at the right of the toolbar — the same affordance a file
window uses. Thumbnails are the default; the choice is remembered in
`localStorage` under `vault:view`.

Both views use **identical card markup** and differ only by
`data-view="grid|list"` on `#resourceGrid`. Switching is therefore pure CSS:
no re-render, no lost scroll position, no reflow of sixty cards.

In list view every column is a fixed width or an `fr` — never `auto`. Each
card is its own grid container, so a content-sized column makes the columns
disagree from row to row and the list stops reading as a list. Rows shed
columns at 1080px (description) and 780px (two-line layout) rather than
crushing everything at once. A row responds to hover by tinting, not lifting.

## My Vault

`/my-vault/` is the visitor's own page. There are no accounts and no server, so
"your vault" means exactly three `localStorage` keys, all written by the
library itself:

| Key | Holds |
|---|---|
| `vault:favorites` | ids the visitor saved |
| `vault:recent` | ids they opened, newest first, capped at 24 |
| `vault:searches` | queries plus all four filters, capped at 20 |

It resolves those ids against the same `generated-resources.js` the homepage
loads, so a card here and a card there cannot disagree; `my-vault.js` carries a
copy of the family-matching table and **must stay in step with app.js's**,
because the patterns overlap and first match wins.

Rules this page holds to:

- **The empty state teaches the gesture** rather than apologising. It is the
  first thing most people will ever see here, so it shows a still of a real
  card with the heart it is asking them to press.
- **Import merges, never replaces.** Silently wiping what was already there is
  the worst possible surprise on this page.
- **Clearing asks first** — the one place on this site a dialog is right. It is
  irreversible and there is no server copy.
- **The privacy note is always shown**, on an empty vault too, so import is
  reachable on a new device before anything has been saved there. It says
  plainly that the data never leaves the browser and will not survive clearing
  site data.
- **`noindex`.** A per-browser page must never be indexed.
- **Already-saved items are excluded from Recently viewed** — something saved is
  not "where you were", it is where you are.
- A saved id whose record has left the library is **reported**, not quietly
  dropped, so the count never silently shrinks.

The masthead badge is shared state: `saveFavorites()` in app.js and every
mutation in my-vault.js call `window.vaultChrome.syncCount()`, and a `storage`
listener keeps two open tabs in step.

## Category colour

Colour codes **four families, not 192 categories.** A 7px dot sits beside the
category name on cards, chips and category tiles, and a key in the Categories
section names each family.

| Family | Colour | Covers |
|---|---|---|
| Tools & software | `#0072B2` | Game Dev, Digital Art, Photography, AI Tools, Software, Video, Audio, Coding, 3D/CAD … |
| Assets & libraries | `#C2185B` | Marketplaces, Public Domain, Typography, stock, textures, templates |
| Funding & business | `#9A5B12` | Grants, Freelancing, Business, Marketing, Productivity |
| Learning | `#6A3D9A` | Learning, tutorials, courses, reference |
| Everything else | `--line-strong` | the 179 categories with fewer than 25 records |

**Why four.** Nobody can distinguish 192 colours, and four is the measured
ceiling here, not a stylistic choice: the palette was checked with the dataviz
validator and every fifth hue tried either collided under deuteranopia or
protanopia, or fell below the chroma floor and read grey. Teal always collapsed
into blue; brown, olive and green always collapsed into each other. The set
that ships passes lightness band, chroma floor, normal-vision separation and
contrast, with one 6.9 ΔE deuteran warning that is permitted because the
category name always sits beside its dot as a direct label.

Rules that must hold if this is ever extended:

- **Colour is never the only signal.** The word is always present; the dot only
  speeds up scanning.
- **Colour follows the resource, not its rank.** Filtering must never repaint
  the survivors — verified.
- **Never generate a hue for a fifth family.** It folds into "Everything else".
- Re-run the validator before changing any value:
  `node <dataviz-skill>/scripts/validate_palette.js "<hex,…>" --mode light --pairs all`

## Frosted surfaces

Kept from the 2026 glass pass, but rebuilt on tokens. What shipped before was
~40 `!important` overrides appended to the end of two stylesheets, setting
`rgba(255,255,255,…)` on every card — which is exactly what paints a white
card on a dark ground.

Two deliberate changes beyond tokenising it:

1. **`backdrop-filter` runs only on chrome the page genuinely scrolls under** —
   the masthead, the sticky toolbar, the modal. Sixty cards each compositing a
   blurred backdrop cost real frames and bought nothing, because a card sits on
   a flat page ground: there is no texture behind it to refract. The gradient
   alone reads identically.
2. **The sheen sweep is gone from cards.** A fixed diagonal highlight on sixty
   tiles reads as a rendering artifact, not as light.

`prefers-reduced-transparency` drops to flat surfaces throughout.

## The art banner across themes

The banner is graphite on white paper, and `mix-blend-mode: multiply` is what
drops that paper into a light page. On a dark ground multiply drives the whole
band to black and the artwork disappears. Dark inverts first — paper to black,
graphite to light — then uses `screen` to drop the black. The two-tone wordmark
takes `invert(1) hue-rotate(180deg)` so its orange survives the inversion.

`cv-secondary-logo.png` has no light variant, so on dark the brand chip keeps a
light ground rather than losing the mark's dark half.

## Kickers

DESIGN.md has always said no kicker or eyebrow above a heading. **121 of them
had shipped anyway.** The purely decorative ones ("Curated starting points",
"Keep exploring", "Decision guide", "Quick verdict", "Side by side", …) are
gone. The ones carrying real information — a resource count, a comparison's
category, a card's Category/Guide type — were kept but restyled as ordinary
meta: no uppercase, no `.13em` tracking. That styling was the eyebrow, not the
words.

## Icons

Drawn SVG in one `<symbol>` sprite at the top of `index.html`, 1.6 stroke,
round caps, `currentColor`. Unicode glyphs and emoji are not icons — the
previous build used ⌕ ★ ☆ ♡ ◈ × and they are gone.

## Motion

One grammar: `--ease: cubic-bezier(0.16, 1, 0.3, 1)` with `--fast/--mid/--slow`.

Two related moments, not a fade on everything:

1. Cards rise 14px and fade in on scroll, staggered up to 270ms in reading
   order via IntersectionObserver.
2. Section rules draw in from the left over 900ms.

**Keyframe animations, never transitions, for reveals.** An element that is
inserted and revealed in the same frame has no previously-painted style to
transition from, so a transition silently never runs and the element stays
invisible. Animations always play. This matters because filter results are
exactly that case.

**A reveal must never gate content the visitor asked for.** Anything already
on screen when it renders is shown at once (`.is-instant`, 240ms, no
stagger); only what sits below the fold waits for the observer. Filter
results arrive without any scrolling, so leaving them to the scroll observer
makes the grid look empty right after a search.

Content is visible by default. The pre-state only exists when JS is running and
the visitor has not asked for reduced motion — `.js-reveal` is added by script,
never present in the markup, so a JS failure shows the page rather than a blank.
`prefers-reduced-motion: reduce` disables all of it.

## Browser surfaces

Themed, not left at browser defaults: selection colour, caret, `accent-color`,
focus rings (2px accent, 2px offset), and scrollbars in both the
`scrollbar-color` and `::-webkit-scrollbar` syntaxes.

## Share card

`site/images/og-cover.png` — 1200×630, the size every platform crops to.
It is not hand-made: `site/tools/og-template.html` renders it from the same
tokens as the site, so the card cannot drift from the design. The logo wall
picks nine marks from a longer candidate list, keeping only those whose
favicon actually loads, so a dead icon service can never ship a broken tile.

To regenerate after the library grows: serve `site/` over http, open
`/tools/og-template.html` at a 1200×630 viewport, update the count and
category figures in the markup, screenshot the page, and save over
`images/og-cover.png`.

Social tags need **absolute** URLs. Facebook, LinkedIn and Slack ignore
relative `og:image` paths, which is the usual cause of a blank preview.

## Rules this build follows

- No kicker or eyebrow above a heading. Enforced, not merely stated — see above.
- No hero stat-tile triple. The count lives in a sentence, on My Vault too.
- Nothing is displayed as editorial judgment unless it is. Star ratings,
  `featured` and `editorPick` are generated filler (see PRODUCT.md) and appear
  nowhere on screen; `featured` is used only as a hidden sort key.
- Cards render 60 at a time and page in on scroll. Never render the full corpus.
- Logos are lazy, and fall back through DuckDuckGo → Google → a monogram tinted
  from a hash of the resource name. Roughly 100 of those favicon requests 404
  today; the chain is why nothing breaks.
- **One header, one token file, one footer.** A new page gets them by running
  `node site/tools/apply-chrome.mjs`, not by copying markup.
- **No colour outside `tokens.css`.** `style.css`, `seo.css`, `comparisons.css`,
  `weekly-drip.css` and `my-vault.css` contain no hex values except `#fff` on a
  deliberate dark scrim.
- **`--masthead-h` is written by script and read by layout, never both.**
- Run `node site/tools/check-contrast.mjs` after touching any colour.
