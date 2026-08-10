THE CREATIVE VAULT V12 DATABASE COMPILER

This upgrade lets you add new resources without replacing the whole folder every time.

WHAT WAS ADDED:
- tools/compile-database.js
- tools/build-database.html
- data/generated-resources.js
- updated data/resources.js
- updated index.html to load generated-resources.js

HOW IT WORKS:
1. You add/edit JSON files in:
   database/resources/
   database/assets/

2. You run:
   node tools/compile-database.js

3. It generates:
   data/generated-resources.js

4. The live site now reads:
   regular JS database + generated JSON database

FUTURE UPDATE WORKFLOW:
To add resources later, you usually only need to upload:
- the new/edited JSON files
- data/generated-resources.js

You do NOT need to replace the whole project folder every time.

IMPORTANT:
The browser cannot automatically read local folders for security reasons.
That is why the Node compiler exists.

NO NODE OPTION:
Open tools/build-database.html for instructions and copy/paste command help.

BEST PRACTICE:
Keep the source of truth in /database.
Treat /data/generated-resources.js as the compiled live output.
