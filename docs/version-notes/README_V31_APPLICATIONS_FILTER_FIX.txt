CREATIVE VAULT V31 — APPLICATIONS FILTER FIX

This update fixes the Applications tab.

Problem:
- Clicking Adobe used plain search for "Adobe".
- Many Adobe products are listed as Photoshop, Illustrator, Premiere, After Effects, Lightroom, Firefly, Substance, Creative Cloud, etc.
- Because the filter only searched the exact word Adobe, those products could be missed.

Fix:
- Added typed filter mode: application.
- Added application aliases for major app ecosystems.
- Adobe now matches Adobe, Photoshop, Illustrator, Premiere, Premiere Pro, After Effects, Lightroom, InDesign, Acrobat, Audition, Animate, Dreamweaver, Substance, Firefly, Adobe Express, Behance, and Creative Cloud.
- Applications tab now opens curated app ecosystem cards.
- URL stores mode=application.
- Active filter badge shows Application: Adobe.

Files added/updated:
- js/vault-filter-state.js
- js/vault-navigation.js
- js/vault-applications-fix.js
- index.html
- first CSS file in /css
