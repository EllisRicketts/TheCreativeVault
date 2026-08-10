CREATIVE VAULT V33 — PHOTOGRAPHY REPAIR

This repairs the V32 issue where the index cleared to 0.

What changed:
- Started from your working uploaded site.
- Added photography JSON files.
- Preserved the existing generated-resources.js assignment format.
- Appended photography resources into the existing generatedResources array instead of rebuilding it from scratch.

Added resources: 100

Files added:
- database/resources/photography-cameras-lenses-v33.json
- database/resources/photography-editing-ai-stock-v33.json
- database/resources/photography-lighting-business-learning-v33.json
- database/resources/photography-planning-color-community-v33.json

Updated:
- data/generated-resources.js

This pack is smaller than the previous 225-resource attempt because it is a safer repair pass.
Once confirmed working, we can add the rest in another pack.
