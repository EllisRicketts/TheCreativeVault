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

`site/database/` is the only source of truth. The page reads
`site/data/generated-resources.js`, which is **compiled output** — do not
hand-edit it. Edit the JSON under `site/database/`, then regenerate:

```
cd site
npm run compile
```

Commit both the JSON you changed and the regenerated `site/data/generated-resources.js`.

The compiler reads four trees: `database/resources/` (recursively),
`database/software/`, `database/companies/` and `database/applications/`.

Until 2026-08-10 some resources also lived in hand-edited arrays under
`site/data/` that the compiler never saw. Those were migrated into
`site/database/` and deleted, so there is now one place to edit and one
place only. See `site/database/README.txt`.

**Categories are matched by exact label.** A resource shows under Music only if
`"Music"` is literally in its `categories` array — `"DAW"` or `"Music Production"`
will not do it. The homepage grid renders the 24 biggest categories, so a
thinly-populated label has no tile even though the dropdown still finds it.

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
