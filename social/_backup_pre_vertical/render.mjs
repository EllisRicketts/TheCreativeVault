/* Renders every post in posts.mjs to a 1350x1080 PNG via headless Chrome,
   and writes the copy-and-paste caption sheet. */

import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath, pathToFileURL } from 'node:url';
import posts from './posts.mjs';
import { templates } from './templates.mjs';

const run = promisify(execFile);
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT  = path.join(ROOT, 'out');
const PAGES = path.join(HERE, 'pages');

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
];

const W = 1350, H = 1080;

/* ---------- favicons for spotlight cards, fetched once, stored locally ---------- */
async function fetchFavicons(){
  const domains = [...new Set(posts.filter(p=>p.domain).map(p=>p.domain))];
  for (const d of domains){
    const file = path.join(ROOT, 'shots', `fav-${d.replace(/\W+/g,'-')}.png`);
    try { await fs.access(file); continue; } catch {}
    const url = `https://www.google.com/s2/favicons?sz=128&domain=${d}`;
    try {
      const r = await fetch(url);
      const b = Buffer.from(await r.arrayBuffer());
      if (b.slice(1,4).toString() !== 'PNG') throw new Error('not a PNG');
      const w = b.readUInt32BE(16), h = b.readUInt32BE(20);
      // the card renders the mark at 102px; anything under 48 would ship as mush
      if (Math.min(w,h) < 48) throw new Error(`only ${w}x${h}`);
      await fs.writeFile(file, b);
      console.log(`  favicon ${d} ${w}x${h}`);
    } catch (e) {
      console.log(`  favicon ${d} FAILED — ${e.message}; card will use its lettermark`);
    }
  }
}

/* ---------- page shell ---------- */
const page = (post) => {
  const body = templates[post.family](post.data ?? post);
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<title>${post.slug}</title>
<link rel="stylesheet" href="../fonts.css">
<link rel="stylesheet" href="../styles.css">
</head>
<body>
  <div class="canvas ${post.ground}">${body}</div>
</body></html>`;
};

async function chromePath(){
  for (const c of CHROME){ try { await fs.access(c); return c; } catch {} }
  throw new Error('Chrome not found');
}

async function shoot(chrome, htmlFile, pngFile){
  const url = pathToFileURL(htmlFile).href;
  await run(chrome, [
    '--headless',
    '--disable-gpu',
    '--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--window-size=${W},${H}`,
    '--virtual-time-budget=9000',
    '--run-all-compositor-stages-before-draw',
    '--default-background-color=fbfaf9',
    `--screenshot=${pngFile}`,
    url,
  ], { maxBuffer: 1 << 24 }).catch(e => { if (!e.stdout && !e.stderr) throw e; });
}

function pngSize(buf){
  if (buf.slice(1,4).toString() !== 'PNG') return null;
  return `${buf.readUInt32BE(16)}x${buf.readUInt32BE(20)}`;
}

async function main(){
  const only = process.argv.slice(2).filter(a=>!a.startsWith('-'));
  const list = only.length ? posts.filter(p=>only.includes(String(p.n))||only.includes(p.slug)) : posts;

  await fs.mkdir(OUT,{recursive:true});
  await fs.mkdir(PAGES,{recursive:true});
  console.log('fetching favicons…');
  await fetchFavicons();

  const chrome = await chromePath();
  console.log(`rendering ${list.length} posts…`);

  const jobs = list.map(p => async () => {
    const id = String(p.n).padStart(2,'0');
    const base = `${id}-${p.slug}`;
    const htmlFile = path.join(PAGES, `${base}.html`);
    const pngFile  = path.join(OUT, `${base}.png`);
    await fs.writeFile(htmlFile, page(p));
    await shoot(chrome, htmlFile, pngFile);
    let size = null;
    try { size = pngSize(await fs.readFile(pngFile)); } catch {}
    return { base, size, ok: size === `${W}x${H}` };
  });

  // 4 at a time — enough to keep it quick, few enough to stay stable.
  const results = [];
  const queue = [...jobs];
  await Promise.all(Array.from({length:4}, async () => {
    while (queue.length){ results.push(await queue.shift()()); }
  }));

  results.sort((a,b)=>a.base.localeCompare(b.base));
  const bad = results.filter(r=>!r.ok);
  for (const r of results) console.log(`  ${r.ok?'ok  ':'FAIL'} ${r.base}  ${r.size||'no file'}`);
  console.log(`\n${results.length - bad.length}/${results.length} rendered at ${W}x${H}`);
  if (bad.length) { console.log('FAILED:'); bad.forEach(b=>console.log('  '+b.base)); process.exitCode = 1; }
}

main().catch(e=>{ console.error(e); process.exit(1); });
