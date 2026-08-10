# The Creative Vault

A curated resource library for creative professionals — software, assets,
marketplaces, grants, learning and game-development tooling, browsable by
category and tag.

Live site: deployed on Netlify from the `main` branch of this repo.

## Layout

```
TheCreativeVault/
├── netlify.toml          Deploy config — publishes site/ only
├── site/                 Everything that goes live
│   ├── index.html        The page
│   ├── styles.css
│   ├── script.js
│   ├── resources.js
│   ├── js/               Feature modules (navigation, filters, grouping)
│   ├── data/             Compiled JS the page actually reads
│   ├── database/         Source JSON — edit here, then compile
│   ├── tools/            compile-database.js and its browser front-end
│   ├── assets/ images/   Logos, avatars, screenshots
│   └── favicon/
└── docs/
    └── version-notes/    Historical patch notes from before version control
```

## Editing the resource database

The page reads `site/data/generated-*.js`. Those files are **compiled output** —
do not hand-edit them. Edit the JSON under `site/database/resources/`, then
regenerate:

```
cd site
npm run compile
```

Commit both the JSON you changed and the regenerated files in `site/data/`.

## The share card and SEO

The canonical domain is `https://www.thecreativevault.co/`. It appears in
`index.html` (canonical, Open Graph, Twitter, JSON-LD), `robots.txt` and
`sitemap.xml`. If the domain ever changes, find and replace it across those
four files — nothing else references it.

The social preview image is `site/images/og-cover.png`, generated from
`site/tools/og-template.html`. See DESIGN.md for how to regenerate it.

## Deploying

Push to `main`. Netlify builds and publishes automatically — there is no
manual upload step any more.

```
git add -A
git commit -m "Describe the change"
git push
```

## Notes

Anything placed outside `site/` is version-controlled but never published,
so `docs/` is a safe home for working notes and references.
