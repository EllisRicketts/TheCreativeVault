# The Creative Vault — Instagram post kit

The same 50 posts in two formats, with a copy-and-paste caption and up to 5
hashtags each. Every graphic carries **thecreativevault.co** in its footer.

| Format | Size | Folder |
|---|---|---|
| **Portrait 4:5** — the one to post | **1080 × 1350** | `out-vertical/` |
| Landscape 5:4 | 1350 × 1080 | `out/` |

Portrait is Instagram's largest feed format, so `out-vertical/` is the default
set. It is not a crop of the landscape one — every two-column composition is
re-stacked for vertical, the statements are set larger against re-broken lines,
and the screenshot crops are re-tuned. Same words, same figures, same brand.

## What to open

| I want… | Go to |
|---|---|
| The finished graphics | `out-vertical/` — 50 PNGs, named `01-…` to `50-…` |
| The landscape versions | `out/` — same 50, same names |
| One caption to copy | `captions/<same-name>.txt` — caption then hashtags, nothing else |
| Everything on one page | `CAPTIONS.md` |

The captions serve both formats — the content is identical, only the
composition changes.

Graphic `out/07-lane-game-development.png` pairs with caption
`captions/07-lane-game-development.txt`. The names always match.

## The nine kinds of post

| # | Kind | What it is |
|---|---|---|
| 01–10 | Weekly Drip lane | One creative lane, its real top 5, real views/day |
| 11–18 | Word post | A single thought, set large |
| 19–24 | Screenshot post | The real site in a browser frame |
| 25–30 | Stat post | One real figure — 2,262 / 191 / 100 / 9,289 / 70 / 10 |
| 31–35 | Velocity chart | Real bars, sorted by views per day |
| 36–39 | Explainer | How the ranking actually works |
| 40–44 | Tool spotlight | A real record from the library |
| 45–48 | Engagement | A question with options |
| 49–50 | Announcement | The Sunday drop and the brand post |

## Where the content came from

Everything was read from the live site on **7 September 2026** — video titles,
channel names, view counts, views-per-day, lane descriptions, collection sizes
and the library figures. The five screenshots in `shots/` are real captures of
`thecreativevault.co`, not mockups.

Nothing is invented. In line with `PRODUCT.md`, no post claims a rating, a
testimonial, a traffic figure, a user count or a partnership, because none of
those exist yet.

Two things worth knowing:

- **The lane posts (01–10) show the site's own 01–10 order**, which is a
  composite of velocity, engagement, freshness and relevance — so the
  views/day column does not always descend. That is correct, and the footer
  says "Ranked on momentum + freshness".
- **The chart posts (31–35) are sorted by views per day**, because that is what
  they claim to show.

## Rebuilding after a Sunday refresh

The Drip board changes every Sunday, so posts 01–10 and 31–35 go stale. To
rebuild them against the new board:

1. Re-capture the data. Open `https://thecreativevault.co/weekly-drip/` in a
   browser, and re-run the extraction that produced `drip-data.json`
   (structure: `[{category, desc, items:[{title, channel, views, vel, ago}]}]`).
2. Re-render and rewrite the captions:

```
cd "C:\Users\Ellis Ricketts\___AGENT_HUB\___PROJECTS\TheCreativeVault\social"
node build/render.mjs --portrait
node build/render.mjs
node build/captions.mjs
```

Run both render lines — they write to different folders and neither touches the
other's output.

`render.mjs` takes post numbers if you only want some:
`node build/render.mjs --portrait 1 2 3` rebuilds just those three.

Add `--audit` to either format to check the result mechanically. It reloads
every page and fails on anything that runs off the canvas, gets clipped,
collides with the footer, or wraps a headline onto more lines than the copy
asked for:

```
node build/render.mjs --portrait --audit
```

**The captions in `posts.mjs` quote specific figures.** If the board has moved,
the caption text needs updating alongside the data or it will contradict the
graphic. `captions.mjs` checks hashtag counts and the URL, but it cannot check
whether a quoted number is still true.

## How it is built

- `build/posts.mjs` — the 50 posts: content, captions, hashtags
- `build/templates.mjs` — the nine layout families
- `build/styles.css` — the design system, using the site's own tokens
- `build/styles-portrait.css` — only what the vertical format changes; loaded
  after `styles.css`, so palette, type and elevation can never drift apart
- `build/render.mjs` — renders each post with headless Chrome at either size
- `build/captions.mjs` — writes `CAPTIONS.md` and the per-post `.txt` files
- `build/fonts/` + `fonts.css` — Archivo and Bricolage Grotesque, stored locally
  so renders do not depend on Google Fonts being reachable

Type and colour follow `DESIGN.md`: Bricolage Grotesque for display, Archivo for
everything else, `#d9530e` for fills and `#b8450b` for accent text on light
grounds (the fill colour is only 4.2:1 and is not safe for text).

Requires Node and Google Chrome. No npm install.

## How the two formats stay one set

There is one copy of the content. Portrait is produced by three levers and
nothing else, so a change to a post reaches both formats:

1. `styles-portrait.css` loads after `styles.css` and overrides only layout.
2. `<body class="is-portrait">` and a `fam-<family>` class on the canvas let
   that sheet target one family without forking any template.
3. A post can carry a `portrait:{...}` block, which is merged over its data at
   render time. Ten posts use it: the six screenshots (crop, zoom and a new
   `ox` horizontal origin), three statements whose lines are re-broken narrower
   and taller, and the Sunday drop, whose mark steps down so the ten lane chips
   still fit beneath it.

Nothing else differs. Adding a post means adding it once.
