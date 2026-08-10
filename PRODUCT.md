# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Working creative professionals and serious hobbyists — designers, 3D and digital
artists, illustrators, photographers, game developers, musicians, writers and
video people — looking for a tool, asset source, marketplace, grant or learning
resource for a job they are doing now.

They arrive either exploring ("what exists for this kind of work?") or hunting
("is there a free alternative to X?"). Both are short, impatient visits. Success
is leaving with a link worth opening.

## Product Purpose

A curated discovery library for creative resources. It exists so that finding a
good tool does not require wading through SEO listicles and affiliate spam.

Confirmed success: it works as a **public discovery hub** — strangers find
genuinely useful tools, and come back. The library is the product, not a lead
magnet for the studio.

## Positioning

Hand-picked by a working designer, with the selection judgment visible. The
scope is unusually wide for a curated list — software, assets, marketplaces,
grants, learning, AI tools and game development in one index — and each record
carries pricing model, platform support and category metadata, so it can be
filtered like a database rather than read like an article.

## Operating Context

One page. Visitors search by keyword, filter by category, pricing model and
platform, sort the results, open a detail view, and follow through to the
resource's own site. Favourites are kept client-side. New resources are
suggested by email.

## Capabilities and Constraints

- **Scale:** ~2,262 resource records render on the page, drawn from
  `site/database/**/*.json` (1,510 records) plus the `site/data/ecosystems/*.js`
  sets. 192 categories.
- **Build:** source JSON in `site/database/`, compiled to `site/data/generated-*.js`
  by `site/tools/compile-database.js` (`npm run compile`). Compiled files are
  committed. Deploy is a static publish of `site/` — no build step runs on Netlify.
- **No backend.** No database, accounts, or server code at runtime. Favourites are
  client-side only. `site/admin/` is an empty placeholder, not a feature.
- **Submissions are a `mailto:` link.** There is no submission form or moderation
  queue. Do not imply one exists.
- **Browse model (confirmed decision):** open with a curated subset and reveal more
  as the visitor scrolls. The current behaviour — all 2,262 cards in the DOM at
  once — is a defect to fix, not a requirement to preserve.
- **Logos are not owned.** Zero records carry a `logo` field. Every logo is fetched
  live from Google's favicon service at 128px; 102 of those requests 404 today.
  Any design that leans on logos must solve sourcing, sizing and a dignified
  fallback, not assume an image will arrive.

## Brand Commitments

- Name: **The Creative Vault**. Attribution line: "Curated by Ellis Ricketts".
- The 3D avatar character (`site/images/avatars/ellis-ricketts-avatar.png`) is a
  binding brand asset and stays as the site's face — but used with restraint,
  earning its place rather than dominating the first viewport.
- Contact and submissions route to ellisricketts3d@gmail.com.
- **Standing visual preference (stated 2026-08-10):** minimal, clean and bright.
  The category standard executed at full craft, not an own-world concept. Craft
  bar for future work: Stripe, Linear, Mobbin. This preference beats a direction
  roll on later surfaces — do not re-run a concept tournament without being asked.

## Evidence on Hand

Real: ~2,262 resource records with genuine names, working URLs, real
descriptions, pricing models and platform support. The avatar and the
Ellis Ricketts 3D logo mark.

**Not real — must not be presented as judgment or fabricated further:**

- **Star ratings are generated filler.** 923 records are rated exactly 4.3 and 584
  exactly 4.4; only 3 records carry any other value. Displaying these as editorial
  ratings misrepresents the product.
- **`lastReviewed` is filler.** Two distinct dates across the entire library.
- **`featured` and `editorPick` are near-meaningless at current density** — 599
  featured and 286 editor picks. A pick that applies to a quarter of the library
  signals nothing.
- No testimonials, traffic figures, user counts, press coverage or partnerships
  exist. None may be invented.
- **40 records carry a literal `"true"` in their `platforms` array**, and at
  least one has nothing else there. The app strips junk values at load so
  nothing leaks onto a card, into the search index or into the platform
  filter, but the source JSON under `site/database/` is still wrong and
  wants correcting at the data layer.

## Product Principles

1. **The link is the payload.** Every screen is judged by how fast someone reaches
   a resource worth opening.
2. **Only claim what is true.** Prefer showing nothing to showing a rating, badge
   or count that was generated rather than judged.
3. **Breadth needs a way in.** 2,262 records is an asset only if the visitor is
   never asked to face all of them at once.
4. **Recognition beats reading.** Creatives identify tools by their marks; the
   interface should let the eye do the work before the text does.
5. **Curation must be visible.** The value over a search engine is a person's
   judgment, so that judgment has to be legible — and therefore has to be real.

## Accessibility & Inclusion

No product-specific standard established. Motion is being introduced deliberately
in the current redesign, so honouring `prefers-reduced-motion` is a hard
requirement of that work.
