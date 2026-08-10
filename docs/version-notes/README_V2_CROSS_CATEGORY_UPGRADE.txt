THE CREATIVE VAULT — V2 CROSS-CATEGORY DATABASE UPGRADE

This version upgrades your current site so resources can appear in multiple categories without duplicating entries.

WHAT CHANGED
1. Recursive compiler
   tools/compile-database.js now scans:
   - database/resources/ and every nested folder under it
   - database/assets/ and every nested folder under it

2. Cross-category schema
   Resources now support:
   - primaryCategory
   - categories
   - categoryIds
   - subcategories
   - industries
   - creativeFields
   - tags

3. Smart category inference
   The compiler can automatically add related categories based on keywords.
   Example:
   - Canva can appear in Design, Content Creation, Marketing, and AI Tools.
   - Blender can appear in 3D / CAD, Game Dev, Animation, Video, and Assets.
   - OBS can appear in Video, Audio, Content Creation, and Streaming-related searches.

4. Generated indexes
   The compiler now creates:
   - data/generated-resources.js
   - data/generated-indexes.js
   - database/generated/resources.json
   - database/generated/category-index.json
   - database/generated/tag-index.json
   - database/generated/company-index.json
   - database/generated/all-indexes.json

5. Front-end category filtering
   js/app.js now checks all resource categories instead of only resource.category.

CURRENT COMPILED STATS
- Total generated resources: 1510
- Source resource files scanned: 59
- Source asset files scanned: 20
- Cross-category count: 27
- Tag count: 602
- Company count: 898
- Duplicate IDs overwritten: 4

HOW TO ADD A CROSS-CATEGORIZED RESOURCE
Create a JSON file anywhere under database/resources/. Example:

{
  "id": "canva",
  "title": "Canva",
  "company": "Canva",
  "website": "https://www.canva.com/",
  "primaryCategory": "Design",
  "categories": [
    "Design",
    "Content Creation",
    "Marketing",
    "AI Tools"
  ],
  "subcategories": [
    "Graphic Design",
    "Templates",
    "Social Media"
  ],
  "tags": [
    "Templates",
    "Branding",
    "Social Media",
    "AI"
  ],
  "price": "Freemium",
  "shortDescription": "Design platform for social graphics, presentations, brand assets, and marketing content."
}

Then run:
node tools/compile-database.js

WHAT TO UPLOAD AFTER ADDING RESOURCES
If your website is already uploaded, future updates usually only need:
- new or edited JSON files in database/resources/
- data/generated-resources.js
- data/generated-indexes.js

FILES UPDATED IN THIS VERSION
- tools/compile-database.js
- js/app.js
- data/schema.js
- data/resource-template.js
- data/generated-resources.js
- data/generated-indexes.js
- database/schema/resource-schema.json
- database/generated/*
- index.html
