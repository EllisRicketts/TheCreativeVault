THE CREATIVE VAULT V17 GAME DEV MEGAPACK PATCH

This is a patch, not a full project replacement.

Copy these files into your existing Creative Vault project:

1. Add these files into:
   database/resources/

   - game-engines.json
   - game-assets.json
   - game-art-tools.json
   - game-audio.json
   - game-networking-backend.json
   - game-ai.json
   - game-vfx-animation.json
   - game-publishing.json
   - game-learning.json

2. Replace:
   data/generated-resources.js

That's it.

This adds 185 curated game development resources with company names where available.


V2 CROSS-CATEGORY UPGRADE
Resources now support multiple categories using primaryCategory + categories[]. The compiler scans nested JSON recursively and generates data/generated-indexes.js alongside data/generated-resources.js.
See README_V2_CROSS_CATEGORY_UPGRADE.txt for instructions.
