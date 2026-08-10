CREATIVE VAULT V34 — SAFE RECURSIVE COMPILER

This update adds the compiler workflow you wanted.

What you do from now on:

1. Add new JSON files anywhere inside:
   database/resources/

2. Run one of these:

   Windows:
   double-click compile-database.bat

   Mac/Linux:
   double-click compile-database.command
   or run:
   node tools/compile-database.js

   If using npm:
   npm run compile

3. Upload the site.

What the compiler does:
- Scans database/resources/**/*.json recursively.
- Accepts single-resource JSON files or arrays of resources.
- Builds data/generated-resources.js automatically.
- Preserves the current generatedResources assignment format.
- Creates data/compile-report.json.
- Refuses to overwrite the index if it would produce 0 resources.
- Refuses to overwrite if the new count drops below half of the previous count.
- Merges duplicate ids instead of crashing.

Important:
A static website cannot automatically read folders in the browser.
The compile step is what turns database/resources/ into the live searchable index.

This prevents the old issue where a bad compile cleared the site to 0 resources.
