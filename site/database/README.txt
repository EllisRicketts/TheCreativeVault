THE CREATIVE VAULT JSON DATABASE

This folder is the ONLY source of truth for resources. As of 2026-08-10 the
hand-edited JavaScript arrays are gone: data/digital-art.js, data/ai-tools.js,
data/other-resources.js and data/ecosystems/*.js were migrated in here and
deleted. Nothing on the page comes from anywhere else.

WHAT THE LIVE SITE LOADS:
- data/schema.js              upgradeResources(), field normalisation
- data/categories.js          the curated category list
- data/collections.js         collection definitions
- data/generated-resources.js COMPILED OUTPUT - never hand-edit
- data/resources.js           three lines of glue

WHICH FOLDERS THE COMPILER READS:
  database/resources/     (recursively, including subfolders)
  database/software/
  database/companies/
  database/applications/

Any .json in those four trees is picked up. A file may contain one resource
object, an array of them, or { "resources": [ ... ] }.

HOW TO ADD A RESOURCE:
1. Drop a .json file in the right folder under database/resources/.
2. Give it an "id" and a "title". Everything else is optional.
3. cd site && npm run compile
4. Commit the JSON you added AND the regenerated data/generated-resources.js.

HOW CATEGORIES WORK - READ THIS BEFORE ADDING ANYTHING:
The category filter matches the "categories" array by its exact label string.
A resource only appears under Music if "Music" is literally in that array.
"DAW" or "Music Production" will NOT put it there. The homepage grid shows the
24 largest categories, so a label used by only a handful of resources is
reachable from the dropdown but has no tile.
