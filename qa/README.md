# QA harness (never published — lives outside site/)

    npm install            # once (Playwright + axe-core)
    node serve.mjs 4173    # serves ../site like Netlify does
    node interactions.mjs http://localhost:4173   # 48 behaviour checks, exits non-zero on failure
    node a11y.mjs http://localhost:4173           # axe WCAG A/AA, 8 routes × light/dark
    node shots.mjs http://localhost:4173 label    # 9 routes × 3 widths: overflow + console errors
    node views.mjs http://localhost:4173 label 1440 dark   # homepage section screenshots

Screenshots land in qa/out/ (git-ignored). Also run `node ../site/tools/check-contrast.mjs`.
