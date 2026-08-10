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

## Palette

Defined as custom properties on `:root`. Light only — there is no dark theme.

| Token | Value | Use |
|---|---|---|
| `--bg` | `#fbfaf9` | Page ground. Warm off-white, never pure white |
| `--surface` | `#ffffff` | Cards, dialogs, inputs |
| `--surface-sunk` | `#f4f2ef` | Logo wells, tag chips, hover fills |
| `--ink` | `#17171a` | Headings and primary text |
| `--ink-2` | `#55555f` | Body and descriptions (≈6.7:1 on white) |
| `--ink-3` | `#6a6a75` | Meta and placeholders (≈4.9:1 on white) |
| `--line` | `#e9e7e3` | Hairline borders and rules |
| `--line-strong` | `#d7d3cd` | Input borders, scrollbar thumb |
| `--accent` | `#d9530e` | Fills and graphics only — 4.2:1, not text-safe |
| `--accent-ink` | `#b8450b` | Accent **text** and links |
| `--free` | `#1f7a4d` | The word "Free" on a card |

Accent discipline: orange marks where action lives, nothing else. A filled
orange button on all sixty cards is a field of orange, not an accent — card
Visit buttons stay quiet and take the accent only on hover.

## Type

**Archivo** (Google Fonts, weights 400/500/600/700) for everything. Chosen as a
workhorse grotesque with enough character to carry display sizes, which suits
an Operate surface. Do not add a second family without a reason.

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

Content is visible by default. The pre-state only exists when JS is running and
the visitor has not asked for reduced motion — `.js-reveal` is added by script,
never present in the markup, so a JS failure shows the page rather than a blank.
`prefers-reduced-motion: reduce` disables all of it.

## Browser surfaces

Themed, not left at browser defaults: selection colour, caret, `accent-color`,
focus rings (2px accent, 2px offset), and scrollbars in both the
`scrollbar-color` and `::-webkit-scrollbar` syntaxes.

## Rules this build follows

- No kicker or eyebrow above a heading, anywhere.
- No hero stat-tile triple. The count lives in a sentence.
- Nothing is displayed as editorial judgment unless it is. Star ratings,
  `featured` and `editorPick` are generated filler (see PRODUCT.md) and appear
  nowhere on screen; `featured` is used only as a hidden sort key.
- Cards render 60 at a time and page in on scroll. Never render the full corpus.
- Logos are lazy, and fall back through DuckDuckGo → Google → a monogram tinted
  from a hash of the resource name.
