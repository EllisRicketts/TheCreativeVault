/* Every resource now comes from site/database/ via tools/compile-database.js.

   The hand-edited arrays that used to live in data/digital-art.js, data/ai-tools.js,
   data/other-resources.js and data/ecosystems/*.js were migrated into the JSON
   database on 2026-08-10 and deleted. The compiler is the only source of truth now,
   so edit the JSON under site/database/ and run `npm run compile`. */

const compiledResources = typeof generatedResources !== "undefined" ? generatedResources : [];

const resources = upgradeResources(compiledResources);
