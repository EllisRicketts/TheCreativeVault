/* Writes the copy-and-paste caption sheet, plus one .txt per graphic. */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import posts from './posts.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const TXT  = path.join(ROOT, 'captions');

const FAMILY = {
  drip_lane : 'Weekly Drip lane',
  statement : 'Word post',
  screenshot: 'Screenshot post',
  stat      : 'Stat post',
  ranking   : 'Velocity chart',
  explainer : 'Explainer',
  spotlight : 'Tool spotlight',
  question  : 'Engagement',
  drop      : 'Announcement',
};

const id = (p) => String(p.n).padStart(2,'0');
const base = (p) => `${id(p)}-${p.slug}`;

async function main(){
  await fs.mkdir(TXT, { recursive: true });

  // one plain-text file per graphic: caption then hashtags, nothing else
  for (const p of posts){
    const body = `${p.caption.trim()}\n\n${p.tags.join(' ')}\n`;
    await fs.writeFile(path.join(TXT, `${base(p)}.txt`), body, 'utf8');
  }

  // the master sheet
  const byFamily = [...new Set(posts.map(p=>p.family))];
  let md = `# The Creative Vault — 50 Instagram posts

All 50 graphics are **1350 × 1080** (Instagram landscape). Every one carries
**thecreativevault.co** in its footer.

Graphics: \`social/out/\` · Individual captions: \`social/captions/\`

Every number, video title, channel name and view-velocity figure below was read
from the live site on **7 September 2026**. Nothing is invented — no ratings, no
testimonials, no traffic or follower claims. Re-run \`node build/render.mjs\`
after a Sunday refresh to rebuild the Drip posts against the new board.

---

## Suggested order

Post the announcement (49) on a Sunday, then a lane a day. Space the word posts
and stat posts between them so the feed does not read as ten of the same card.

| # | Post | Type |
|---|---|---|
`;
  for (const p of posts){
    md += `| ${id(p)} | ${p.slug} | ${FAMILY[p.family]} |\n`;
  }
  md += `\n---\n`;

  for (const fam of byFamily){
    md += `\n# ${FAMILY[fam]}\n`;
    for (const p of posts.filter(x=>x.family===fam)){
      md += `\n---\n\n## ${id(p)} · \`${base(p)}.png\`\n\n`;
      md += `**Caption**\n\n\`\`\`\n${p.caption.trim()}\n\`\`\`\n\n`;
      md += `**Hashtags** (${p.tags.length})\n\n\`\`\`\n${p.tags.join(' ')}\n\`\`\`\n`;
    }
  }

  await fs.writeFile(path.join(ROOT, 'CAPTIONS.md'), md, 'utf8');

  // integrity checks worth failing on
  const problems = [];
  for (const p of posts){
    if (p.tags.length > 5) problems.push(`${base(p)}: ${p.tags.length} hashtags (max 5)`);
    if (!p.caption.includes('thecreativevault.co')) problems.push(`${base(p)}: caption has no URL`);
    if (!p.caption.trim()) problems.push(`${base(p)}: empty caption`);
    const stray = p.caption.match(/#[A-Za-z0-9_]+/g);
    if (stray) problems.push(`${base(p)}: '#' inside the caption body (${stray.join(' ')})`);
    if (p.tags.some(t => !/^#[a-z0-9]+$/i.test(t))) problems.push(`${base(p)}: malformed hashtag`);
  }
  const slugs = posts.map(p=>p.slug);
  const dupes = slugs.filter((s,i)=>slugs.indexOf(s)!==i);
  if (dupes.length) problems.push(`duplicate slugs: ${[...new Set(dupes)].join(', ')}`);

  console.log(`wrote CAPTIONS.md and ${posts.length} caption files`);
  console.log(`hashtags: max ${Math.max(...posts.map(p=>p.tags.length))} per post`);
  if (problems.length){ console.log('PROBLEMS:'); problems.forEach(x=>console.log('  '+x)); process.exitCode = 1; }
  else console.log('checks passed: <=5 hashtags, URL present, slugs unique');
}

main().catch(e=>{ console.error(e); process.exit(1); });
