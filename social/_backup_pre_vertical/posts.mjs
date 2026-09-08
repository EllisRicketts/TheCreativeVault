/* 50 Instagram posts for The Creative Vault / Weekly Drip.
   Every figure, title, channel and view-velocity number below is read from the
   live site (thecreativevault.co) as captured on 2026-09-07. Nothing is invented:
   no ratings, no testimonials, no traffic or follower claims. */

import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const drip = require('../drip-data.json');

const lane = (name) => drip.find(d => d.category === name);
const laneDesc = (name) => lane(name).desc.replace(name, '').trim();
const top = (name, n = 5) => lane(name).items.slice(0, n);

const URL = 'thecreativevault.co';
const A = (t) => `<span class="accent-word">${t}</span>`;

/* ---- shared hashtag pools (max 5 per post, varied across the set) ---- */
const posts = [];
const P = (o) => { posts.push(o); return o; };

/* ================================================================== *
 * A. THE TEN LANES — one post each, real top 3, real velocity        *
 * ================================================================== */
const laneMeta = [
  ['AI + Creative Tools', 'g-ink bloom',  ['#aitools','#creativeworkflow','#aiart','#designtools','#weeklydrip']],
  ['Graphic Design',      'g-light bloom',['#graphicdesign','#designtools','#typography','#branding','#weeklydrip']],
  ['3D + Animation',      'g-ink bloom',  ['#b3d','#blender3d','#3dart','#motiondesign','#weeklydrip']],
  ['Video + Filmmaking',  'g-light bloom',['#filmmaking','#videoediting','#davinciresolve','#aftereffects','#weeklydrip']],
  ['Music + Audio',       'g-ink bloom',  ['#musicproduction','#mixingengineer','#flstudio','#homestudio','#weeklydrip']],
  ['Coding + Web',        'g-light bloom',['#webdev','#frontend','#vibecoding','#css','#weeklydrip']],
  ['Game Development',    'g-ink bloom',  ['#gamedev','#indiedev','#gameart','#unrealengine','#weeklydrip']],
  ['Photography',         'g-light bloom',['#photography','#lightroom','#photoediting','#retouching','#weeklydrip']],
  ['Content Creation',    'g-ink bloom',  ['#contentcreator','#youtubetips','#thumbnaildesign','#creatoreconomy','#weeklydrip']],
  ['Maker + 3D Printing', 'g-light bloom',['#3dprinting','#maker','#freecad','#fabrication','#weeklydrip']],
];

const laneCaptions = {
  'AI + Creative Tools':
`This week's top 3 in AI + Creative Tools 🔥

PiXimperfect's Photoshop & Camera Raw update walkthrough is moving at 78,597 views a day. LoRAtech's infinite-length MiniMax H3 video breakdown is at 17,886. Case Studio's viral 3D motion graphics recreation is at 17,154.

Weekly Drip doesn't rank by lifetime views — it ranks by how fast something is climbing right now. Which is why you're seeing 3-day-old videos instead of a tutorial from 2019.

Full top 10 (plus 9 more lanes) at ${URL}`,

  'Graphic Design':
`Graphic Design — top 3 this week ✍️

Glyn Dewis asking "who is Photoshop for now?" after update 27.10.0 is the fastest climber in the lane. MBD Studio Design's breakdown of the 5 major Photoshop updates is right behind it. Then Nuke Designz' full Illustrator beginner course.

The lane also covers typography, branding, mockups, packaging and print production — 10 videos, restocked every Sunday.

See the full 10 at ${URL}`,

  '3D + Animation':
`3D + Animation, top of the lane this week 🧊

01 — Vertex Arcade, "I Removed 90% Of This Model to Make It Better"
02 — Stefan 3D AI on building animals, monsters and creatures with 3D AI
03 — Higgsfield AI x Claude Fable 5.1, at 53,127 views a day

Further down the ten: Blender Guru's Backrooms build, Joey Carlino on geometry nodes, Default Cube on armature blending, CG Boost on rigging a sculpt fast.

${URL}`,

  'Video + Filmmaking':
`Video + Filmmaking, ranked by momentum 🎬

Higgsfield AI's motion graphics workflow is top of the lane. Case Studio's viral 3D motion graphics recreation follows. Then Mhd Labs with a real client After Effects SaaS animation project, start to finish.

Editing, colour, VFX, cameras, and the creator-side workflows that actually ship.

Full lane at ${URL}`,

  'Music + Audio':
`Music + Audio — this week's climbers 🎧

EDM Tips' simple mixing workflow is leading at 4,692 views/day. MALO BEATS on his current MPC workflow. FL Studio's own Mobile 4.10 walkthrough.

Smaller numbers than the AI lanes — and that's the point. Velocity is measured inside the lane, so a strong audio tutorial isn't buried under an AI video with ten times the audience.

${URL}`,

  'Coding + Web':
`Coding + Web is having a week 💻

01 — How the Claude Code team uses Claude Code
02 — Rob Shocks on Claude's new INTENT.MD, the week's fastest in the lane at 53,706 views/day
03 — AI LABS on the agent skills worth knowing

Also on the board: Kevin Powell's "Nobody told me CSS could do this", and CharliMarieTV building a brand design app by vibe coding.

All 10 at ${URL}`,

  'Game Development':
`Game Development is carrying the whole board this week 🎮

01 — fal, building an AI live stream app with H3
02 — Duckable, "I'm Sick of SLOP… So I Made My DREAM Game" — 122,450 views a day, the single highest velocity across all ten lanes
03 — janisjanis01, making a viral Roblox RNG game in 30 days

Engines, level design, shaders, game art, indie workflows.

${URL}`,

  'Photography':
`Photography — top 3 this week 📷

DxO PhotoLab 10's new features are climbing at 23,572 views/day. Fine Art Vision's natural light and mountain aesthetics session is at 19,907. photoshopCAFE's rundown of the 5 biggest new Photoshop features is at 15,624.

Editing, lighting, cameras, retouching. Ten a week, no digging.

${URL}`,

  'Content Creation':
`Content Creation — the lane that moves fastest 📈

Arvind zone's free long-video AI tool walkthrough is at 92,244 views/day — second highest on the entire board this week.

Behind it: Editing with piyush on free Ghibli-style AI video, and Pavan Agrawal turning one prompt into a 16-minute video. Further down the ten, Aprilynne Alter on making your thumbnails 81% better.

YouTube, social, streaming, thumbnails, storytelling, growth.

${URL}`,

  'Maker + 3D Printing':
`Maker + 3D Printing 🛠️

Payo's reverse-engineering tutorial for a first 3D printed car part is leading the lane. FreeCAD Hub takes the next two slots with advanced mechanical modelling and how to split a body.

A quieter lane, deliberately kept in its own ranking so CAD and fabrication tutorials aren't drowned out by AI video.

Full 10 at ${URL}`,
};

laneMeta.forEach(([name, ground, tags], i) => {
  P({
    n: i + 1,
    slug: `lane-${name.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}`,
    family: 'drip_lane', ground,
    data: { lane: name, desc: laneDesc(name), items: top(name, 5) },
    caption: laneCaptions[name],
    tags,
  });
});

/* ================================================================== *
 * B. STATEMENTS — single thoughts, set large                          *
 * ================================================================== */
const statements = [
  { slug:'stmt-finding-problem', ground:'g-light bloom',
    html:`You don't have a<br>tool problem.<br>You have a<br>${A('finding')} problem.`,
    size:'d-lg', measure:18,
    sub:'2,262 hand-picked creative resources, filterable by price, platform and category.',
    note:'The Creative Vault',
    caption:`There is no shortage of creative software. There is a shortage of a good way to find it.

That's the whole reason The Creative Vault exists — 2,262 resources, hand-picked across 191 categories, filterable by price, platform and category. Software, assets, marketplaces, grants, learning and AI tools.

No listicles. No affiliate soup. Just the link.

${URL}`,
    tags:['#creativetools','#designresources','#graphicdesign','#toolsfordesigners','#thecreativevault'] },

  { slug:'stmt-re-google', ground:'g-accent',
    html:`Bookmark this &mdash;<br>2,262 tools is a lot<br>to ${A('re-Google')}.`,
    size:'d-lg', measure:20, wm:false,
    note:'Actual copy from the site',
    caption:`This is the actual tip that pops up on the site. We're not being clever, it's genuinely the problem.

You find a good tool. You don't save it. Three weeks later you're typing "that free thing that does the mockups" into Google at 11pm.

The Vault is the place to put it. 2,262 records, one search field, favourites saved in your browser.

${URL}`,
    tags:['#designtools','#creativeworkflow','#bookmarkthis','#freetools','#designresources'] },

  { slug:'stmt-mega-hits', ground:'g-ink bloom',
    html:`Old mega-hits<br>don't ${A('automatically')}<br>win.`,
    size:'d-lg', measure:18,
    sub:'Weekly Drip ranks by view velocity, engagement, freshness and topic relevance — not by lifetime view count.',
    note:'How the Drip ranks',
    caption:`Search "Blender tutorial" and you get a video from 2019 with 4 million lifetime views. Useful once. Not useful now.

Weekly Drip scores a rolling window of new creator videos by view velocity, engagement, freshness and topic relevance. A tutorial doing 50,000 views a day this week beats one that did 4 million over six years.

That's why the board looks different every Sunday.

${URL}`,
    tags:['#weeklydrip','#creativelearning','#tutorials','#blender','#contentdiscovery'] },

  { slug:'stmt-no-listicles', ground:'g-light bloom',
    html:`No listicles.<br>No spam.<br>No ${A('affiliate soup')}.`,
    size:'d-lg', measure:16,
    sub:'Hand-picked by a working designer. The judgment is the product.',
    note:'Curated by Ellis Ricketts',
    caption:`Every "top 20 free design tools" article is the same fifteen tools, ranked by who paid the most for the placement.

The Creative Vault is hand-picked by a working designer. Each record carries its real pricing model, platform support and category — so you can filter it like a database instead of reading it like an article.

2,262 records. 191 categories.

${URL}`,
    tags:['#designresources','#creativetools','#curated','#graphicdesign','#nospam'] },

  { slug:'stmt-tagline', ground:'g-ink bloom',
    html:`Find better tools.<br>${A('Create better work.')}`,
    size:'d-lg', measure:17,
    sub:'2,262 creative resources, hand-picked across 191 categories.',
    note:'The library, and the Drip',
    caption:`Find better tools. Create better work.

That's the line on the front page and it's the whole thesis. The gap between the work you're making and the work you want to make is often just one tool you haven't met yet.

Software, assets, marketplaces, grants, learning and AI tools. Filter by free, freemium, paid or subscription. Filter by your actual platform.

${URL}`,
    tags:['#creativetools','#designinspiration','#artiststools','#digitalart','#thecreativevault'] },

  { slug:'stmt-no-digging', ground:'g-light bloom',
    html:`Fresh creative<br>knowledge.<br>${A('No digging required.')}`,
    size:'d-md', measure:18,
    sub:'Ten creative lanes. Ten videos each. Restocked every Sunday.',
    note:'Weekly Drip',
    caption:`Weekly Drip: 10 creative lanes, 10 videos each, refreshed every Sunday.

AI, graphic design, 3D, video, music, coding, game dev, photography, content creation and making. 100 videos a week, ranked by momentum rather than by whatever the algorithm decided you should see today.

You don't have to go looking. It's already sorted.

${URL}`,
    tags:['#weeklydrip','#creativelearning','#tutorials','#designeducation','#learndesign'] },

  { slug:'stmt-moves-fast', ground:'g-accent',
    html:`The creative<br>internet<br>${A('moves fast.')}`,
    size:'d-xl', measure:12, wm:false,
    sub:'Weekly Drip scans fresh tutorials and tool coverage, then surfaces the strongest momentum across the lanes that matter.',
    note:'Refreshed every Sunday',
    caption:`A tool ships on Tuesday. By Friday there are forty tutorials about it and thirty-nine are reposts.

Weekly Drip scans a rolling window of fresh creator videos and surfaces the ones actually gaining momentum — across ten creative lanes, scored on velocity, engagement, freshness and relevance.

New board every Sunday.

${URL}`,
    tags:['#weeklydrip','#creativetools','#aitools','#designnews','#staycurrent'] },

  { slug:'stmt-sunday', ground:'g-ink bloom',
    html:`Every Sunday,<br>the shelf<br>${A('restocks.')}`,
    size:'d-xl', measure:13,
    sub:'100 fresh videos. 10 lanes. Ranked by momentum, not by age.',
    note:'Weekly Drip',
    caption:`Sunday is restock day.

Ten lanes, ten videos each, scored fresh. Whatever was climbing last week gets replaced by whatever is climbing now.

AI · Graphic Design · 3D + Animation · Video + Filmmaking · Music + Audio · Coding + Web · Game Development · Photography · Content Creation · Maker + 3D Printing

Set a reminder. Or just check when you need something to watch.

${URL}`,
    tags:['#weeklydrip','#sundayreset','#creativelearning','#tutorials','#designtools'] },
];
statements.forEach((s,i)=>P({ n:11+i, family:'statement', ...s, data:s }));

/* ================================================================== *
 * C. SCREENSHOTS — the real product, framed                           *
 * ================================================================== */
const shots = [
  { slug:'shot-drip-hero', ground:'g-light bloom', shot:'cv-drip-hero.png',
    path:'/weekly-drip', zoom:100, oy:-55, tag:'Live now',
    html:`This is the ${A('Weekly Drip')} page.`,
    sub:'Ten creative lanes, ten videos each, ranked on momentum and refreshed every Sunday.',
    note:'Free · no account needed',
    caption:`The Weekly Drip page, as it actually looks right now.

Three things it tells you up front: it refreshes every Sunday, it's 10 videos per category, and it's ranked on freshness plus momentum.

No account. No paywall. No email capture. Open it and it's there.

${URL}/weekly-drip`,
    tags:['#weeklydrip','#creativetools','#webdesign','#designresources','#tutorials'] },

  { slug:'shot-drip-cards', ground:'g-paper', shot:'cv-drip-cards.png',
    path:'/weekly-drip', zoom:118, oy:-230, tag:'Real board',
    html:`Every card shows you ${A('why')} it ranked.`,
    sub:'Topic, channel, total views, views per day, and how many days old it is.',
    note:'AI + Creative Tools, this week',
    caption:`Every Weekly Drip card carries its own receipts.

Topic tag. Channel. Total views. Views per day. Age in days.

So when something sits at the top you can see it's a 3-day-old video pulling 78,597 views a day — not a six-year-old upload coasting on a lifetime count.

Judge the ranking yourself. That's the idea.

${URL}/weekly-drip`,
    tags:['#weeklydrip','#uidesign','#creativetools','#aitools','#transparency'] },

  { slug:'shot-home', ground:'g-light bloom', shot:'cv-home-hero.png',
    path:'', zoom:100, oy:-45, tag:'The front page',
    html:`2,262 resources.<br>${A('One search field.')}`,
    sub:'Hand-picked across 191 categories — software, assets, marketplaces, grants, learning and AI tools.',
    note:'Press / to search',
    caption:`The front page of The Creative Vault.

2,262 creative resources, hand-picked across 191 categories. Software, assets, marketplaces, grants, learning and AI tools.

Press / anywhere on the page to jump straight into search. Filter by price — free, freemium, paid, subscription — and by platform: browser, Windows, Mac, Linux, iPad, iPhone, Android.

${URL}`,
    tags:['#creativetools','#designresources','#webdesign','#freetools','#thecreativevault'] },

  { slug:'shot-collections', ground:'g-paper', shot:'cv-drip-band.png',
    path:'', zoom:128, oy:-330, tag:'Collections',
    html:`Start with a kit,<br>not ${A('2,262 tabs.')}`,
    sub:'Focused starting points: Best Free Creative Tools, Digital Art Starter Kit, AI Creator Kit and more.',
    note:'Nine collections and counting',
    caption:`2,262 records is a lot to face at once. So there are Collections — focused kits you can start from instead.

Best Free Creative Tools — 67 resources
Digital Art Starter Kit — 187 resources
AI Creator Kit — 115 resources
AI Image Kit — 31 resources
Asset Library — 79 resources
Canadian Artist Funding — 2 resources

Pick the one that matches what you're doing today.

${URL}`,
    tags:['#designresources','#freetools','#digitalart','#aitools','#creativekit'] },

  { slug:'shot-explore', ground:'g-light bloom', shot:'cv-explore.png',
    path:'/explore', zoom:108, oy:-100, tag:'Explore',
    html:`Know where you're headed?<br>${A('Go straight there.')}`,
    sub:'Browse by creative field, open a focused guide, or search all 2,262 resources.',
    note:'Every path leads back to the full database',
    caption:`Two ways into the Vault.

If you know the field — Digital Art, AI Tools, Video, Animation, 3D/CAD, 3D Printing — go straight to that category page.

If you don't, open a focused guide and get a curated starting point instead.

Either way, every path connects back to the full searchable database of 2,262 resources.

${URL}/explore`,
    tags:['#creativetools','#designresources','#uxdesign','#digitalart','#3dart'] },

  { slug:'shot-drip-band', ground:'g-white', shot:'cv-drip-band.png',
    path:'', zoom:128, oy:-55, tag:'On the front page',
    html:`The Drip lives one<br>click from ${A('everything else.')}`,
    sub:'Weekly Drip sits on the homepage, above the collections, right where you land.',
    note:'See this week’s Drip →',
    caption:`You don't have to go hunting for the Weekly Drip. It's on the front page, right above the Collections.

One button: "See this week's Drip →"

Fresh creative tutorials, tools and workflows gaining momentum across AI, design, 3D, music, coding, game development, filmmaking and photography.

${URL}`,
    tags:['#weeklydrip','#webdesign','#creativetools','#designresources','#tutorials'] },
];
shots.forEach((s,i)=>P({ n:19+i, family:'screenshot', ...s, data:s }));

/* ================================================================== *
 * D. STATS — one real figure each                                     *
 * ================================================================== */
const stats = [
  { slug:'stat-2262', ground:'g-light bloom', fig:'2,262', tag:'In the library', solid:true,
    html:`creative resources, hand-picked across ${A('191 categories')}.`,
    note2:'Software, assets, marketplaces, grants, learning and AI tools — each record carrying its real pricing model and platform support.',
    note:'Hand-picked, not scraped',
    caption:`2,262.

That's how many creative resources are in the Vault right now, hand-picked across 191 categories.

Software, assets, marketplaces, grants, learning and AI tools. Every record carries its actual pricing model and platform support, so you can filter the whole thing like a database instead of scrolling an article.

${URL}`,
    tags:['#creativetools','#designresources','#freetools','#digitalart','#thecreativevault'] },

  { slug:'stat-191', ground:'g-ink bloom', fig:'191', tag:'Categories',
    html:`ways to narrow 2,262 records down to ${A('the five you need')}.`,
    note2:'From Logo Design and Photogrammetry to Grants, Music Notation and Reality Capture.',
    note:'Filter, don’t scroll',
    caption:`191 categories.

Logo Design. Photogrammetry. Music Notation. Reality Capture. Procedural Materials. Grants. Portfolio. Colour. Font Library. Video Review.

The point of that many categories isn't completeness for its own sake — it's that you can cut 2,262 records down to the handful that match the job in front of you.

${URL}`,
    tags:['#designresources','#creativetools','#3dart','#photography','#musicproduction'] },

  { slug:'stat-100', ground:'g-accent', fig:'100', tag:'Every Sunday',
    html:`fresh creator videos, sorted into ${A('ten creative lanes')}.`,
    note2:'Ten videos per lane, scored on view velocity, engagement, freshness and topic relevance.',
    note:'Weekly Drip',
    caption:`100 videos. Every Sunday.

Ten creative lanes, ten videos in each, scored on view velocity, engagement, freshness and topic relevance.

AI + Creative Tools · Graphic Design · 3D + Animation · Video + Filmmaking · Music + Audio · Coding + Web · Game Development · Photography · Content Creation · Maker + 3D Printing

Free to read. No account.

${URL}/weekly-drip`,
    tags:['#weeklydrip','#creativelearning','#tutorials','#designeducation','#aitools'] },

  { slug:'stat-9289', ground:'g-light bloom', fig:'9,289', tag:'Offline PDF', solid:true, narrow:true,
    html:`linked resources you can keep on your own machine.`,
    note2:'The Offline Resource Library PDF — 9,289 linked resources across 116 subcategories, 70 pages. Free download.',
    note:'Download it from the homepage',
    caption:`There's a free PDF version of the Vault.

9,289 linked resources · 116 subcategories · 70 pages

Every entry is a live link. Keep it on your desktop, your tablet, your studio machine — it works with no connection and no login.

Download it from the front page: "Download Offline Library PDF ↓"

${URL}`,
    tags:['#freedownload','#designresources','#creativetools','#freebie','#thecreativevault'] },

  { slug:'stat-70', ground:'g-ink bloom', fig:'70', tag:'Pages',
    html:`of linked creative resources, ${A('free to download')}.`,
    note2:'116 subcategories, 9,289 links. Built to be useful offline.',
    note:'Offline Resource Library PDF',
    caption:`70 pages. 116 subcategories. 9,289 links. One PDF.

Built for the times you're on a train, on set, or on a studio machine that won't let you install anything — but you still need to remember what that free alternative was called.

Free from the homepage.

${URL}`,
    tags:['#freeresources','#designtools','#pdf','#creativeresources','#freedownload'] },

  { slug:'stat-10', ground:'g-paper', fig:'10', tag:'Creative lanes',
    html:`separate rankings, so a CAD tutorial never competes with an ${A('AI video')}.`,
    note2:'Music sits at a few thousand views a day. Game dev sits at over a hundred thousand. Ranking them together would bury one of them permanently.',
    note:'Weekly Drip',
    caption:`Why ten separate lanes instead of one big list?

Because this week's top game dev video is doing 122,450 views a day, and this week's top music video is doing 4,692.

Put them in one ranking and the audio lane disappears forever. Rank inside the lane, and a genuinely strong mixing tutorial gets to lead its own board.

Ten lanes. Ten videos each. Every Sunday.

${URL}/weekly-drip`,
    tags:['#weeklydrip','#musicproduction','#gamedev','#3dprinting','#creativelearning'] },
];
stats.forEach((s,i)=>P({ n:25+i, family:'stat', ...s, data:s }));

/* ================================================================== *
 * E. RANKINGS — real velocity charts                                  *
 * ================================================================== */
const V = (x) => Number(String(x.vel).replace(/,/g,''));

/* the n fastest-climbing items inside one lane, by views/day */
const fastest = (name, n) => [...lane(name).items]
  .map(i => ({...i, lane:name}))
  .sort((a,b) => V(b) - V(a))
  .slice(0, n);

/* the n fastest-climbing items across all ten lanes, deduped by title */
const boardTop = (() => {
  const all = [];
  drip.forEach(c => c.items.forEach(i => all.push({...i, lane:c.category})));
  const seen = new Set();
  return all
    .filter(i => (seen.has(i.title) ? false : (seen.add(i.title), true)))
    .sort((a,b) => V(b) - V(a))
    .slice(0, 5);
})();

const rankings = [
  { slug:'rank-board', ground:'g-ink bloom', items:boardTop, tag:'All ten lanes',
    html:`The five fastest-climbing videos ${A('on the whole board')}.`,
    sub:'Measured in views per day, not lifetime views. Every one of these is under ten days old.',
    note:'Weekly Drip · this week',
    caption:`The five fastest-moving creator videos across all ten lanes this week.

122,450/day — Duckable, "I'm Sick of SLOP… So I Made My DREAM Game"
92,244/day — Arvind zone, free long-video AI tool
88,472/day — fal, building an AI live stream app
78,597/day — PiXimperfect, Photoshop & Camera Raw update
58,405/day — Higgsfield AI, saving AI credits in Blender

All under ten days old. That's the whole point of ranking on velocity.

${URL}/weekly-drip`,
    tags:['#weeklydrip','#gamedev','#aitools','#photoshop','#creatortools'] },

  { slug:'rank-3d', ground:'g-light bloom', items:fastest('3D + Animation',5), tag:'3D + Animation',
    html:`3D is moving ${A('fast')} this week.`,
    sub:'Blender, geometry nodes, rigging and AI-assisted motion — ranked by views per day.',
    note:'Top 5 of 10 · full lane on the site',
    caption:`3D + Animation, ranked by momentum.

Higgsfield AI's Blender credit-saving workflow leads at 58,405 views/day, followed by their Claude Fable 5.1 motion graphics video at 53,127, then Blender Guru's Backrooms build at 52,264.

Vertex Arcade (removing 90% of a model to improve it) and Stefan 3D AI round out the five.

Five more in the lane on the site.

${URL}/weekly-drip`,
    tags:['#b3d','#blender3d','#geometrynodes','#3danimation','#motiondesign'] },

  { slug:'rank-code', ground:'g-ink bloom', items:fastest('Coding + Web',5), tag:'Coding + Web',
    html:`What developers are actually ${A('watching')} this week.`,
    sub:'Agents, vibe coding, and — still — CSS you did not know was possible.',
    note:'Top 5 of 10 · full lane on the site',
    caption:`Coding + Web this week is almost entirely about agents.

53,706/day — Rob Shocks on Claude's new INTENT.MD
34,711/day — how the Claude Code team uses Claude Code
24,110/day — Claude Code 2.0 upgrade rundown
11,243/day — Tristen O'Brien on the new /design command
10,955/day — agent skills breakdown

And still holding a slot: Kevin Powell, "Nobody told me CSS could do this."

${URL}/weekly-drip`,
    tags:['#webdev','#css','#vibecoding','#frontend','#developertools'] },

  { slug:'rank-gamedev', ground:'g-paper', items:fastest('Game Development',5), tag:'Game Development',
    html:`Game dev had this week's ${A('single biggest')} climber.`,
    sub:'122,450 views a day, eight days old. Nothing else on the board came close.',
    note:'Top 5 of 10 · full lane on the site',
    caption:`Game Development produced the highest-velocity video across all ten lanes this week.

Duckable — "I'm Sick of SLOP… So I Made My DREAM Game" — 829,450 views in eight days. That's 122,450 a day.

Behind it: fal's AI live stream app build at 88,472/day, Crazy Cat's ChatGPT vs Gemini head-to-head, a viral Roblox RNG game made in 30 days, and a full game level built with only free AI tools.

${URL}/weekly-drip`,
    tags:['#gamedev','#indiedev','#roblox','#gameart','#indiegame'] },

  { slug:'rank-content', ground:'g-light bloom', items:fastest('Content Creation',5), tag:'Content Creation',
    html:`Creators are all chasing the ${A('same thing')} right now.`,
    sub:'Long-form AI video and better thumbnails — the two topics running the lane.',
    note:'Top 5 of 10 · full lane on the site',
    caption:`Content Creation this week splits cleanly into two obsessions: long AI video, and thumbnails.

92,244/day — Arvind zone, free unlimited long-video AI tool
31,274/day — 16-minute AI video from a single prompt
21,179/day — free long 3D cartoon animation videos
20,127/day — full long AI video course
19,526/day — 20+ minute AI videos, free

Five of the five fastest in the lane are about making longer video with less work. Whatever you make of that, it is where the attention is.

${URL}/weekly-drip`,
    tags:['#contentcreator','#youtubetips','#thumbnaildesign','#aivideo','#creatoreconomy'] },
];
rankings.forEach((s,i)=>P({ n:31+i, family:'ranking', ...s, data:s }));

/* ================================================================== *
 * F. EXPLAINERS                                                       *
 * ================================================================== */
const explainers = [
  { slug:'exp-how-it-ranks', ground:'g-light bloom',
    html:`How the Weekly Drip ${A('decides')} what makes the board.`,
    sub:'Four signals, scored across a rolling window of new creator-focused videos.',
    note:'An automated discovery feed, not a paid ranking',
    steps:[
      {h:'View velocity', p:'Views per day right now — not the lifetime total sitting on an old upload.'},
      {h:'Engagement', p:'How strongly the audience that found it actually responded to it.'},
      {h:'Freshness', p:'Only a rolling window of recent videos is eligible in the first place.'},
      {h:'Topic relevance', p:'It has to belong to the creative lane it is being ranked inside.'},
    ],
    caption:`How the Weekly Drip decides what makes the board:

1. View velocity — views per day now, not the lifetime total
2. Engagement — how strongly the audience responded
3. Freshness — only recent videos are eligible at all
4. Topic relevance — it has to fit the lane it's ranked in

Stated plainly on the page: this is an automated discovery feed, not a paid ranking. Nobody buys a slot.

${URL}/weekly-drip`,
    tags:['#weeklydrip','#howitworks','#creativetools','#transparency','#contentdiscovery'] },

  { slug:'exp-velocity', ground:'g-ink bloom',
    html:`Why ${A('views per day')} beats total views.`,
    sub:'The same signal that makes a six-year-old tutorial look authoritative is what keeps it in your results forever.',
    note:'Weekly Drip',
    steps:[
      {h:'Lifetime views reward age', p:'A 2019 tutorial has had six years to accumulate. That is not a quality signal, it is a calendar.'},
      {h:'Velocity rewards now', p:'78,597 views a day means people are finding it useful this week, about software that exists this week.'},
      {h:'Software moves', p:'Photoshop 27.10, Blender 5.2, DaVinci — half the value of a tutorial expires when the UI changes.'},
      {h:'So the board resets', p:'Every Sunday the window rolls forward and the ranking is scored again from scratch.'},
    ],
    caption:`A tutorial with 4 million lifetime views isn't better than one with 200,000. It's just older.

Lifetime view counts reward age. Velocity rewards relevance — and when Photoshop, Blender and Resolve all shipped updates this quarter, relevance is the thing you actually need.

Weekly Drip scores views per day inside a rolling window, then resets every Sunday.

${URL}/weekly-drip`,
    tags:['#weeklydrip','#creativelearning','#tutorials','#blender','#photoshop'] },

  { slug:'exp-anatomy', ground:'g-paper',
    html:`What you get in ${A('one lane')}.`,
    sub:'Every lane is built the same way, so you learn the shape once and read all ten fast.',
    note:'Ten lanes, ten videos each',
    steps:[
      {h:'Ten ranked videos', p:'Numbered 01 to 10, ordered by momentum inside that lane only.'},
      {h:'A topic strip', p:'The sub-topics running the lane this week — mockups, logo design, geometry nodes, ComfyUI.'},
      {h:'The numbers on every card', p:'Total views, views per day, and how many days old the video is.'},
      {h:'The channel, credited', p:'Every card names the creator who made it. The Drip points at their work, it does not repackage it.'},
    ],
    caption:`Every Weekly Drip lane is built identically, so you only have to learn the layout once:

→ 10 ranked videos, numbered 01–10
→ A topic strip showing what's driving the lane this week
→ Total views, views/day and age on every card
→ The channel credited on every single entry

The Drip sends you to the creator. It doesn't repackage anyone's work.

${URL}/weekly-drip`,
    tags:['#weeklydrip','#uidesign','#creativelearning','#tutorials','#designsystem'] },

  { slug:'exp-lanes', ground:'g-ink bloom',
    html:`Ten lanes, because creative work ${A('isn’t one job')}.`,
    sub:'A colourist and a CAD modeller do not want the same feed. So they do not get the same ranking.',
    note:'Weekly Drip',
    steps:[
      {h:'Separate rankings', p:'Each lane is scored only against itself, so quiet fields keep their own top ten.'},
      {h:'No cross-drowning', p:'Music at 4,692 views a day is not competing with game dev at 122,450.'},
      {h:'Jump between them', p:'One row of category chips at the top switches lanes without leaving the page.'},
      {h:'Or read all ten', p:'"All Categories" stacks every lane on one page if you want the full picture.'},
    ],
    caption:`Ten lanes, ranked separately:

AI + Creative Tools · Graphic Design · 3D + Animation · Video + Filmmaking · Music + Audio · Coding + Web · Game Development · Photography · Content Creation · Maker + 3D Printing

Each one is scored only against itself. That's the only way a FreeCAD tutorial and a viral AI video can both lead a board of their own.

Switch lanes from the chip row, or read all ten stacked.

${URL}/weekly-drip`,
    tags:['#weeklydrip','#creativecommunity','#gamedev','#musicproduction','#3dprinting'] },
];
explainers.forEach((s,i)=>P({ n:36+i, family:'explainer', ...s, data:s }));

/* ================================================================== *
 * G. SPOTLIGHTS — real records, quoted from the library               *
 * ================================================================== */
const spots = [
  { slug:'spot-blender', ground:'g-light bloom', domain:'blender.org',
    name:'Blender', company:'Blender Foundation', price:'Free', cat:'3D / CAD', platforms:'Windows, Mac',
    desc:'Free open-source 3D creation suite for modeling, animation, rendering, sculpting, and VFX.',
    tag:'In the Vault', tag2:'Free',
    line:'Also the most-covered tool in this week’s 3D + Animation lane.',
    caption:`Blender. Free. Open source. Modeling, animation, rendering, sculpting and VFX in one suite.

It's also the single most-covered tool in this week's 3D + Animation Drip lane — Blender Guru, Joey Carlino, Default Cube and CG Boost all have videos on the board.

Free tool, enormous teaching community. Hard to beat.

Record in the Vault → ${URL}`,
    tags:['#blender3d','#b3d','#3dart','#freetools','#opensource'] },

  { slug:'spot-resolve', ground:'g-ink bloom', domain:'blackmagicdesign.com',
    name:'DaVinci Resolve', company:'blackmagicdesign.com', price:'Free', cat:'Video', platforms:'Windows, Mac',
    desc:'Professional video editing, color grading, VFX, and audio post-production.',
    tag:'In the Vault', tag2:'Free',
    line:'The free tier is the one that grades feature films.',
    caption:`DaVinci Resolve is free. Not trial-free — actually free.

Editing, colour grading, VFX and audio post in one application, and the free tier is genuinely the tool that colourists use on real features.

If you're paying a monthly subscription to cut video and you haven't tried it, that's the single highest-value swap on this list.

Record in the Vault → ${URL}`,
    tags:['#davinciresolve','#videoediting','#colorgrading','#filmmaking','#freetools'] },

  { slug:'spot-krita', ground:'g-paper', domain:'krita.org',
    name:'Krita', company:'Krita Foundation', price:'Free', cat:'Digital Art', platforms:'Windows, Mac',
    desc:'Free open-source painting software for illustrators, concept artists, and comic creators.',
    tag:'In the Vault', tag2:'Free',
    line:'One of 187 records in the Digital Art Starter Kit.',
    caption:`Krita — free, open source, built specifically for painting rather than photo editing.

Illustrators, concept artists and comic creators. Proper brush engine, animation timeline, no subscription and no account.

It's one of 187 records in the Digital Art Starter Kit collection.

${URL}`,
    tags:['#krita','#digitalart','#conceptart','#illustration','#freetools'] },

  { slug:'spot-gimp', ground:'g-light bloom', domain:'gimp.org',
    name:'GIMP', company:'gimp.org', price:'Free', cat:'Digital Art', platforms:'Windows, Mac',
    desc:'Free open-source image editor for photo manipulation, graphics, and raster editing.',
    tag:'In the Vault', tag2:'Free',
    line:'Filed under Free, with 66 other zero-cost tools in one collection.',
    caption:`GIMP. Free, open source, raster editing and photo manipulation.

Not a Photoshop replacement for everyone — but for a client who needs one image cropped and colour-corrected, it costs nothing and installs in a minute.

It sits in the "Best Free Creative Tools" collection alongside 66 other tools that cost nothing to use.

${URL}`,
    tags:['#gimp','#freetools','#photoediting','#opensource','#designtools'] },

  { slug:'spot-photopea', ground:'g-ink bloom', domain:'photopea.com',
    name:'Photopea', company:'photopea.com', price:'Freemium', cat:'Digital Art', platforms:'Browser',
    desc:'Browser-based image editor with PSD support and Photoshop-like tools.',
    tag:'In the Vault', tag2:'Runs in the browser',
    line:'Opens a PSD on a machine where you cannot install anything.',
    caption:`Photopea opens PSD files in a browser tab.

No install, no account, no admin rights. Which makes it the tool that saves you on a locked-down work machine, a borrowed laptop, or a client's computer at 4pm.

Layers, masks, adjustment layers, smart objects. Filed under Digital Art, platform: Browser.

${URL}`,
    tags:['#photopea','#psd','#freetools','#browserbased','#designtools'] },
];
spots.forEach((s,i)=>P({ n:40+i, family:'spotlight', ...s, data:s }));

/* ================================================================== *
 * H. QUESTIONS — engagement                                           *
 * ================================================================== */
const questions = [
  { slug:'q-which-lane', ground:'g-light bloom',
    html:`Which lane are ${A('you')}?`,
    sub:'Ten of them. Most people live in two or three.',
    options:['3D + Animation','Graphic Design','Video + Filmmaking','Music + Audio','Game Development','Photography'],
    note:'Comment your lane',
    caption:`Ten lanes in the Weekly Drip. Most people live in two or three.

3D + Animation · Graphic Design · Video + Filmmaking · Music + Audio · Game Development · Photography · AI + Creative Tools · Coding + Web · Content Creation · Maker + 3D Printing

Which is yours? Comment it — genuinely useful for working out which lanes to expand.

${URL}/weekly-drip`,
    tags:['#creativecommunity','#graphicdesign','#3dart','#filmmaking','#gamedev'] },

  { slug:'q-free-tool', ground:'g-ink bloom',
    html:`What's the best ${A('free tool')} you use every week?`,
    sub:'There are 67 in the Best Free Creative Tools collection. There are definitely more.',
    options:['Blender','DaVinci Resolve','Krita','GIMP','Photopea','Something we’re missing'],
    note:'Comment it and it gets checked for the library',
    caption:`Best free creative tool you actually use every week — go.

The "Best Free Creative Tools" collection has 67 in it right now: Blender, DaVinci Resolve, Krita, GIMP, Photopea, Unsplash, Google Fonts, Coolors and more.

But 67 is definitely not all of them. Comment what's missing and it gets looked at for the library.

${URL}`,
    tags:['#freetools','#designtools','#creativecommunity','#opensource','#digitalart'] },

  { slug:'q-missing', ground:'g-paper',
    html:`What's ${A('missing')} from the Vault?`,
    sub:'2,262 records is a lot. It is not everything.',
    options:['A tool you rely on','A grant or funding source','A marketplace','A learning resource','An asset library','A whole category'],
    note:'Submit from the site, or just comment',
    caption:`2,262 records in, and the gaps are the interesting part.

If there's a tool, marketplace, grant, asset library or learning resource you'd expect to find and it isn't there — say so. Comment it here, or use Submit on the site.

Every suggestion gets read by an actual person. That's the whole curation model.

${URL}`,
    tags:['#creativecommunity','#designresources','#creativetools','#opencall','#submissions'] },

  { slug:'q-next-lane', ground:'g-light bloom',
    html:`Which lane should ${A('come next')}?`,
    sub:'Ten today. There is room for more if the demand is real.',
    options:['Motion Graphics','Illustration','Architecture + Viz','Writing','UI / UX Design','Fashion + Textile'],
    note:'Vote in the comments',
    caption:`The Weekly Drip runs ten lanes today. There's room for more.

Motion Graphics? Illustration? Architecture and visualisation? Writing? UI/UX? Fashion and textile?

Vote in the comments. A lane only earns a slot if there are enough people who'd actually read it every Sunday.

${URL}/weekly-drip`,
    tags:['#weeklydrip','#creativecommunity','#motiondesign','#illustration','#uiux'] },
];
questions.forEach((s,i)=>P({ n:45+i, family:'question', ...s, data:s }));

/* ================================================================== *
 * I. DROPS — the Sunday announcement and the brand post               *
 * ================================================================== */
const drops = [
  { slug:'drop-live', ground:'g-ink bloom', markSize:256,
    html:`This week's Drip is ${A('live.')}`,
    sub:'Ten lanes. A hundred videos. Ranked on momentum, not on age.',
    lanes:['AI + Creative Tools','Graphic Design','3D + Animation','Video + Filmmaking','Music + Audio','Coding + Web','Game Development','Photography','Content Creation','Maker + 3D Printing'],
    note:'Free to read · no account',
    caption:`New Drip is up.

Ten lanes, ten videos each, freshly scored:
AI + Creative Tools · Graphic Design · 3D + Animation · Video + Filmmaking · Music + Audio · Coding + Web · Game Development · Photography · Content Creation · Maker + 3D Printing

Ranked on view velocity and freshness, so what you're seeing is what's climbing right now — most of this week's board is under a week old.

Free. No account. No email required.

${URL}/weekly-drip`,
    tags:['#weeklydrip','#creativetools','#tutorials','#designresources','#newthisweek'] },

  { slug:'drop-brand', ground:'g-accent', markSize:300, size:'d-xl',
    html:`Weekly<br>${A('Drip')}`,
    sub:'A hundred fresh creator videos, sorted into ten creative lanes, every Sunday. From The Creative Vault.',
    note:'Free · new board every Sunday',
    caption:`Weekly Drip.

A hundred fresh creator videos. Ten creative lanes. Ranked on momentum. Restocked every Sunday.

It's the part of The Creative Vault that keeps moving — the 2,262-record library tells you what exists, the Drip tells you what's worth watching this week.

Both free. Both at ${URL}`,
    tags:['#weeklydrip','#thecreativevault','#creativetools','#designresources','#tutorials'] },
];
drops.forEach((s,i)=>P({ n:49+i, family:'drop', ...s, data:s }));

export default posts;
