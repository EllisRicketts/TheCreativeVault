# The Creative Vault — Instagram post kit

50 graphics at **1350 × 1080** (Instagram landscape), with a copy-and-paste
caption and up to 5 hashtags each. Every graphic carries **thecreativevault.co**
in its footer.

## What to open

| I want… | Go to |
|---|---|
| The finished graphics | `out/` — 50 PNGs, named `01-…` to `50-…` |
| One caption to copy | `captions/<same-name>.txt` — caption then hashtags, nothing else |
| Everything on one page | `CAPTIONS.md` |

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
node build/render.mjs
node build/captions.mjs
```

`render.mjs` takes post numbers if you only want some:
`node build/render.mjs 1 2 3` rebuilds just those three.

**The captions in `posts.mjs` quote specific figures.** If the board has moved,
the caption text needs updating alongside the data or it will contradict the
graphic. `captions.mjs` checks hashtag counts and the URL, but it cannot check
whether a quoted number is still true.

## How it is built

- `build/posts.mjs` — the 50 posts: content, captions, hashtags
- `build/templates.mjs` — the nine layout families
- `build/styles.css` — the design system, using the site's own tokens
- `build/render.mjs` — renders each post with headless Chrome at 1350 × 1080
- `build/captions.mjs` — writes `CAPTIONS.md` and the per-post `.txt` files
- `build/fonts/` + `fonts.css` — Archivo and Bricolage Grotesque, stored locally
  so renders do not depend on Google Fonts being reachable

Type and colour follow `DESIGN.md`: Bricolage Grotesque for display, Archivo for
everything else, `#d9530e` for fills and `#b8450b` for accent text on light
grounds (the fill colour is only 4.2:1 and is not safe for text).

Requires Node and Google Chrome. No npm install.
