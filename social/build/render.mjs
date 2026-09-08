/* Renders every post in posts.mjs via headless Chrome.

   Two formats, one set of content:
     node build/render.mjs              -> 1350x1080 landscape  -> social/out/
     node build/render.mjs --portrait   -> 1080x1350 portrait   -> social/out-vertical/

   Post numbers still narrow the run: `node build/render.mjs --portrait 19 20`.

   Portrait pulls three levers and no more, so the two sets can never drift:
     1. styles-portrait.css is loaded after styles.css
     2. <body class="is-portrait">, .canvas gets a fam-<family> class
     3. a post's `portrait:{...}` block is merged over its data
*/

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

const CHROME = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
];

const argv = process.argv.slice(2);
const PORTRAIT = argv.includes('--portrait');
const AUDIT    = argv.includes('--audit');

const W = PORTRAIT ? 1080 : 1350;
const H = PORTRAIT ? 1350 : 1080;
const OUT   = path.join(ROOT, PORTRAIT ? 'out-vertical' : 'out');
const PAGES = path.join(HERE, PORTRAIT ? 'pages-v' : 'pages');

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
      // the card renders the mark at ~100px; anything under 48 would ship as mush
      if (Math.min(w,h) < 48) throw new Error(`only ${w}x${h}`);
      await fs.writeFile(file, b);
      console.log(`  favicon ${d} ${w}x${h}`);
    } catch (e) {
      console.log(`  favicon ${d} FAILED — ${e.message}; card will use its lettermark`);
    }
  }
}

/* ---------- overflow audit ----------
   Inert unless the page is opened with ?audit=1, so a shipped render never
   contains it in any observable form. It writes its verdict into the title,
   which --dump-dom hands straight back to verify.mjs. */
const AUDIT_SCRIPT = `
<script>
if (location.search.indexOf('audit=1') > -1) {
  addEventListener('load', function(){ setTimeout(function(){
    var bad = [], canvas = document.querySelector('.canvas');
    var cb = canvas.getBoundingClientRect();
    var pad = document.querySelector('.pad');
    var foot = document.querySelector('.foot');
    var fb = foot ? foot.getBoundingClientRect() : null;
    // .wm is a watermark that is meant to bleed off the canvas
    var exempt = function(el){ return el.closest('.wm') || el.classList.contains('wm'); };
    // these clamp their own text on purpose
    var clamps = '.lane-title,.bar-label,.spot p';

    Array.prototype.forEach.call(document.querySelectorAll('.canvas *'), function(el){
      if (exempt(el)) return;
      var r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return;
      if (r.right  > cb.right  + 1) bad.push('RIGHT ' + el.className + ' +' + Math.round(r.right - cb.right));
      if (r.left   < cb.left   - 1) bad.push('LEFT ' + el.className + ' ' + Math.round(r.left - cb.left));
      if (r.bottom > cb.bottom + 1) bad.push('BOTTOM ' + el.className + ' +' + Math.round(r.bottom - cb.bottom));
      // text clipped inside its own box (line-clamped elements excluded)
      if (!el.matches(clamps) && el.scrollHeight > el.clientHeight + 2 && getComputedStyle(el).overflow !== 'visible')
        bad.push('CLIP ' + el.className + ' +' + (el.scrollHeight - el.clientHeight));
    });

    if (pad && pad.scrollHeight > pad.clientHeight + 2)
      bad.push('PAD-OVERFLOW +' + (pad.scrollHeight - pad.clientHeight));

    // A display line that is too wide wraps rather than overflows, so nothing
    // above would catch it — but it breaks the authored line rhythm, which on
    // a one-sentence poster IS the composition. Count rendered line boxes
    // against the <br> count the copy actually asked for.
    Array.prototype.forEach.call(document.querySelectorAll('.display'), function(h){
      var asked = (h.innerHTML.match(/<br\\s*\\/?>/gi) || []).length + 1;
      // no authored break means the headline is prose and is meant to wrap
      // to its measure; only copy that set its own breaks is being checked
      if (asked === 1) return;
      var r = document.createRange(); r.selectNodeContents(h);
      var tops = {}, n = 0;
      Array.prototype.forEach.call(r.getClientRects(), function(rect){
        if (rect.height < 1) return;
        var k = Math.round(rect.top);
        if (!tops[k]) { tops[k] = 1; n++; }
      });
      if (n > asked) bad.push('WRAP ' + h.className + ' ' + n + ' lines, copy asked for ' + asked);
    });

    // anything in .pad that runs into the footer band
    if (fb) Array.prototype.forEach.call(pad.querySelectorAll('*'), function(el){
      if (exempt(el) || el.children.length) return;
      var r = el.getBoundingClientRect();
      if (r.height && r.bottom > fb.top + 2 && r.top < fb.bottom)
        bad.push('FOOT-HIT ' + el.className + ' +' + Math.round(r.bottom - fb.top));
    });

    document.title = bad.length ? 'AUDIT_FAIL :: ' + bad.join(' | ') : 'AUDIT_OK';
  }, 250); });
}
</script>`;

/* ---------- page shell ---------- */
const page = (post) => {
  const base = post.data ?? post;
  // portrait-only per-post tuning (screenshot crops, one type step, one mark size)
  const data = PORTRAIT && base.portrait ? { ...base, ...base.portrait } : base;
  const body = templates[post.family](data);
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<title>${post.slug}</title>
<link rel="stylesheet" href="../fonts.css">
<link rel="stylesheet" href="../styles.css">
${PORTRAIT ? '<link rel="stylesheet" href="../styles-portrait.css">' : ''}
</head>
<body${PORTRAIT ? ' class="is-portrait"' : ''}>
  <div class="canvas ${post.ground} fam-${post.family}">${body}</div>
${AUDIT_SCRIPT}
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

async function audit(chrome, htmlFile){
  const url = pathToFileURL(htmlFile).href + '?audit=1';
  const { stdout } = await run(chrome, [
    '--headless','--disable-gpu','--hide-scrollbars',
    '--force-device-scale-factor=1',
    `--window-size=${W},${H}`,
    '--virtual-time-budget=9000',
    '--run-all-compositor-stages-before-draw',
    '--dump-dom', url,
  ], { maxBuffer: 1 << 26 }).catch(e => ({ stdout: e.stdout || '' }));
  const m = stdout.match(/<title>([\s\S]*?)<\/title>/);
  return m ? m[1].trim() : 'AUDIT_NO_RESULT';
}

function pngSize(buf){
  if (buf.slice(1,4).toString() !== 'PNG') return null;
  return `${buf.readUInt32BE(16)}x${buf.readUInt32BE(20)}`;
}

async function main(){
  const only = argv.filter(a=>!a.startsWith('-'));
  const list = only.length ? posts.filter(p=>only.includes(String(p.n))||only.includes(p.slug)) : posts;

  await fs.mkdir(OUT,{recursive:true});
  await fs.mkdir(PAGES,{recursive:true});
  console.log('fetching favicons…');
  await fetchFavicons();

  const chrome = await chromePath();
  console.log(`rendering ${list.length} posts at ${W}x${H} -> ${path.relative(ROOT,OUT)}/${AUDIT?'  (+audit)':''}`);

  const jobs = list.map(p => async () => {
    const id = String(p.n).padStart(2,'0');
    const base = `${id}-${p.slug}`;
    const htmlFile = path.join(PAGES, `${base}.html`);
    const pngFile  = path.join(OUT, `${base}.png`);
    await fs.writeFile(htmlFile, page(p));
    await shoot(chrome, htmlFile, pngFile);
    let size = null;
    try { size = pngSize(await fs.readFile(pngFile)); } catch {}
    const verdict = AUDIT ? await audit(chrome, htmlFile) : null;
    return { base, size, verdict, ok: size === `${W}x${H}` && (!AUDIT || verdict === 'AUDIT_OK') };
  });

  // 4 at a time — enough to keep it quick, few enough to stay stable.
  const results = [];
  const queue = [...jobs];
  await Promise.all(Array.from({length:4}, async () => {
    while (queue.length){ results.push(await queue.shift()()); }
  }));

  results.sort((a,b)=>a.base.localeCompare(b.base));
  const bad = results.filter(r=>!r.ok);
  for (const r of results){
    const note = r.verdict && r.verdict !== 'AUDIT_OK' ? `\n         ${r.verdict}` : '';
    console.log(`  ${r.ok?'ok  ':'FAIL'} ${r.base}  ${r.size||'no file'}${note}`);
  }
  console.log(`\n${results.length - bad.length}/${results.length} rendered at ${W}x${H}${AUDIT?' and clean':''}`);
  if (bad.length) { console.log('FAILED:'); bad.forEach(b=>console.log('  '+b.base)); process.exitCode = 1; }
}

main().catch(e=>{ console.error(e); process.exit(1); });
