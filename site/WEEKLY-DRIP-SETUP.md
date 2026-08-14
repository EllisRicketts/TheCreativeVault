# Weekly Drip — One-time setup

Weekly Drip is already built into this site. The page lives at `/weekly-drip/` and the homepage/nav links are installed.

The automatic refresh is handled by GitHub Actions every Sunday at 12:05 UTC. The workflow searches YouTube, scores recent creator-focused videos, writes `data/weekly-drip.json`, commits that file to GitHub, and your existing Netlify Git integration deploys the update.

## 1. Create a YouTube Data API key

In Google Cloud Console, create or choose a project, enable **YouTube Data API v3**, then create an API key.

For security, restrict the key to **YouTube Data API v3**. Do not put the key into any HTML or browser JavaScript file.

## 2. Add the key to GitHub

In the GitHub repository for The Creative Vault:

**Settings → Secrets and variables → Actions → New repository secret**

Name the secret exactly:

`YOUTUBE_API_KEY`

Paste the API key as the value and save it.

## 3. Allow GitHub Actions to write the refreshed JSON

In the repository:

**Settings → Actions → General → Workflow permissions**

Select **Read and write permissions**, then save.

The workflow also declares `contents: write`, but the repository setting must permit it.

## 4. Run the first refresh immediately

Open:

**GitHub → Actions → Update Weekly Drip → Run workflow**

After it finishes, it commits `data/weekly-drip.json`. Netlify should detect that commit and deploy it automatically.

After that, you do not need to run it manually. It refreshes every Sunday.

## What controls the categories and searches?

Edit `data/weekly-drip-config.json` only if you ever want to change categories, search topics, video count, age window, duration limits or filtering.

The current build has 10 categories, 8 discovery topics per category and 10 selected videos per category. That is 80 YouTube search calls per weekly refresh, plus inexpensive batched video-detail calls.

## Main files

- `weekly-drip/index.html` — Weekly Drip page
- `css/weekly-drip.css` — page design
- `js/weekly-drip.js` — renders the weekly JSON
- `data/weekly-drip-config.json` — categories and search topics
- `data/weekly-drip.json` — automatically generated results
- `scripts/update-weekly-drip.mjs` — YouTube discovery/ranking engine
- `.github/workflows/update-weekly-drip.yml` — weekly automation

## Ranking model

The updater uses a rolling 21-day discovery window. Videos are ranked with a custom score combining:

- views per day / momentum
- total views
- engagement
- freshness
- cross-topic relevance

It also filters very short videos, non-embeddable videos, live content, extremely long content, low-view candidates and excessive repetition from one channel.
