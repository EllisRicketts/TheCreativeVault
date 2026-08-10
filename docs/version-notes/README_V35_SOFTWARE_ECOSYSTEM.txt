CREATIVE VAULT V35 — SOFTWARE ECOSYSTEM UPDATE

Added new database folders:
- database/software/
- database/companies/
- database/applications/

Added software entries:
- Adobe suite
- Autodesk suite
- Avid audio/video suite including Pro Tools and Media Composer
- LibreOffice apps
- Blackmagic Design tools
- Affinity suite
- Office suites
- Blender and Maxon tools

Updated compiler:
- tools/compile-database.js now scans database/resources, database/software, database/companies, and database/applications.

Compiler result:
Exit code: 1

STDOUT:


STDERR:

Compile failed with errors:
 - /mnt/data/creative_vault_v35_software_ecosystem_work/artist-resource-library/database/companies/epic-games.json resource #1 is not an object
 - /mnt/data/creative_vault_v35_software_ecosystem_work/artist-resource-library/database/companies/epic-games.json resource #2 is not an object
 - /mnt/data/creative_vault_v35_software_ecosystem_work/artist-resource-library/database/companies/epic-games.json resource #3 is not an object
 - /mnt/data/creative_vault_v35_software_ecosystem_work/artist-resource-library/database/companies/epic-games.json resource #4 is not an object
 - /mnt/data/creative_vault_v35_software_ecosystem_work/artist-resource-library/database/companies/epic-games.json resource #5 is not an object
 - /mnt/data/creative_vault_v35_software_ecosystem_work/artist-resource-library/database/companies/epic-games.json resource #6 is not an object
 - /mnt/data/creative_vault_v35_software_ecosystem_work/artist-resource-library/database/companies/epic-games.json resource #7 is not an object

Report written to: data/compile-report.json



SECOND COMPILE AFTER COMPANY METADATA FIX:
Exit code: 0

STDOUT:

Creative Vault compile complete.
Files scanned: 105
Resources: 1899
Output: data/generated-resources.js
Report: data/compile-report.json
Warnings: 113 duplicate/resource notices. See compile-report.json.


STDERR:

