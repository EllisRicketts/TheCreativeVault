/* Template families for The Creative Vault social posts.
   Every template returns the innerHTML of .canvas and every one carries the
   site URL in its footer. Ground + layout vary by family so the set does not
   read as one template recoloured fifty times. */

const esc = (s='') => String(s)
  .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

/* Site URL block — required on every post. */
export const foot = (note='') => `
  <div class="foot">
    <div class="url"><img src="../../shots/cv-icon.png" alt="">thecreativevault.co</div>
    ${note ? `<div class="note">${esc(note)}</div>` : ''}
  </div>`;

const clampTitle = (t, n=64) => t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t;

/* ------------------------------------------------------------------ *
 * A. drip-lane — one creative lane, its real top three, real velocity *
 * ------------------------------------------------------------------ */
export function drip_lane(p){
  const rows = p.items.map((it,i)=>`
    <div class="lane-row">
      <div class="lane-rank num">${String(i+1).padStart(2,'0')}</div>
      <div>
        <div class="lane-title">${esc(clampTitle(it.title, 72))}</div>
        ${it.channel ? `<div class="lane-chan">${esc(it.channel)}</div>` : ''}
      </div>
      <div class="lane-vel">
        <b class="num">${esc(it.vel)}</b>
        <span>views / day</span>
      </div>
    </div>`).join('');

  return `
  <div class="pad" style="padding-bottom:112px">
    <div class="lane-head">
      <div>
        <div class="row" style="gap:11px;margin-bottom:22px">
          <span class="tag solid"><span class="dot"></span>Top 10 this week</span>
          <span class="tag">Weekly Drip</span>
        </div>
        <h1 class="display d-lg">${esc(p.lane)}</h1>
        <p class="sub" style="margin-top:19px;max-width:40ch">${esc(p.desc)}</p>
      </div>
      <div class="mark"><img class="lane-mark" src="../../shots/weekly-drip-logo.png" alt=""></div>
    </div>
    <div class="lane-list">${rows}</div>
  </div>
  ${foot('Ranked on momentum + freshness · refreshed every Sunday')}`;
}

/* --------------------------------------------------- *
 * B. statement — one thought, set large. Nothing else. *
 * --------------------------------------------------- */
export function statement(p){
  const size = p.size || 'd-xl';
  return `
  <div class="pad" style="justify-content:center">
    ${p.quote ? '<div class="quote-mark">&ldquo;</div>' : ''}
    <h1 class="display ${size}" style="max-width:${p.measure||16}ch">${p.html}</h1>
    ${p.sub ? `<p class="sub sub-lg" style="margin-top:36px;max-width:52ch">${esc(p.sub)}</p>` : ''}
  </div>
  ${p.wm !== false ? '<img class="wm" src="../../shots/weekly-drip-logo.png" alt="">' : ''}
  ${foot(p.note||'')}`;
}

/* -------------------------------------------------------------- *
 * C. screenshot — the real page, framed. Nothing mocked up.       *
 * -------------------------------------------------------------- */
export function screenshot(p){
  return `
  <div class="pad" style="padding-bottom:118px">
    <div class="row" style="justify-content:space-between;align-items:flex-end;gap:34px">
      <div style="flex:1">
        <h1 class="display d-sm" style="max-width:19ch">${p.html}</h1>
        ${p.sub ? `<p class="sub" style="margin-top:15px;max-width:50ch">${esc(p.sub)}</p>` : ''}
      </div>
      ${p.tag ? `<span class="tag ink" style="margin-bottom:8px"><span class="dot"></span>${esc(p.tag)}</span>` : ''}
    </div>
    <div class="shot-frame grow" style="margin-top:30px">
      <div class="shot-bar">
        <i></i><i></i><i></i>
        <div class="addr">thecreativevault.co${esc(p.path||'')}</div>
      </div>
      <div class="shot-clip" style="background-image:url('../../shots/${p.shot}');background-size:${p.zoom||100}% auto;background-position:${p.ox||'50%'} ${p.oy||0}px"></div>
    </div>
  </div>
  ${foot(p.note||'')}`;
}

/* ------------------------------------------- *
 * D. stat — one real figure, given the room.  *
 * ------------------------------------------- */
export function stat(p){
  return `
  <div class="pad" style="justify-content:center">
    <div class="row" style="gap:11px;margin-bottom:30px">
      <span class="tag ${p.solid?'solid':''}"><span class="dot"></span>${esc(p.tag)}</span>
    </div>
    <div class="stat-fig num ${p.narrow?'narrow':''}">${p.fig}</div>
    <h2 class="stat-cap" style="max-width:26ch">${p.html}</h2>
    ${p.note2 ? `<p class="stat-note">${esc(p.note2)}</p>` : ''}
  </div>
  ${foot(p.note||'')}`;
}

/* --------------------------------------------------------- *
 * E. ranking — a real velocity chart, bars scaled to data.   *
 * --------------------------------------------------------- */
export function ranking(p){
  const V = (x) => Number(String(x.vel).replace(/,/g,''));
  const items = [...p.items].sort((a,b)=>V(b)-V(a));
  const nums = items.map(V);
  const max = Math.max(...nums);
  const rows = items.map((it,i)=>`
    <div>
      <div class="bar-row">
        <div>
          <div class="bar-label">${esc(clampTitle(it.title, 58))}</div>
          <div class="bar-sub">${[it.channel, it.lane].filter(Boolean).map(esc).join(' · ')}</div>
        </div>
        <div class="bar-val num">${esc(it.vel)}<small>views / day</small></div>
      </div>
      <div class="bar-track" style="margin-top:11px">
        <div class="bar-fill" style="width:${Math.max(6,(nums[i]/max)*100)}%"></div>
      </div>
    </div>`).join('');

  return `
  <div class="pad" style="padding-bottom:110px">
    <div class="row" style="justify-content:space-between;align-items:flex-start">
      <div>
        <h1 class="display d-md" style="max-width:20ch">${p.html}</h1>
        ${p.sub ? `<p class="sub" style="margin-top:16px;max-width:56ch">${esc(p.sub)}</p>` : ''}
      </div>
      <span class="tag solid" style="flex:none"><span class="dot"></span>${esc(p.tag||'This week')}</span>
    </div>
    <div class="chart">${rows}</div>
  </div>
  ${foot(p.note||'Momentum, not lifetime views')}`;
}

/* ----------------------------------------------------- *
 * F. explainer — how the thing actually works, in steps. *
 * ----------------------------------------------------- */
export function explainer(p){
  const steps = p.steps.map((s,i)=>`
    <div class="step">
      <div class="step-n num">${i+1}</div>
      <div>
        <h4>${esc(s.h)}</h4>
        <p>${esc(s.p)}</p>
      </div>
    </div>`).join('');
  return `
  <div class="pad" style="padding-bottom:118px">
    <h1 class="display d-md" style="max-width:21ch">${p.html}</h1>
    ${p.sub ? `<p class="sub" style="margin-top:18px;max-width:62ch">${esc(p.sub)}</p>` : ''}
    <div class="steps">${steps}</div>
  </div>
  ${foot(p.note||'')}`;
}

/* --------------------------------------------------------------- *
 * G. spotlight — a real record from the library, card blown up.    *
 * --------------------------------------------------------------- */
export function spotlight(p){
  return `
  <div class="pad" style="justify-content:center">
    <div class="row" style="gap:11px;margin-bottom:34px">
      <span class="tag ink"><span class="dot"></span>${esc(p.tag||'In the Vault')}</span>
      ${p.tag2?`<span class="tag">${esc(p.tag2)}</span>`:''}
    </div>
    <div class="spot">
      <div class="spot-well"><img src="../../shots/fav-${esc(p.domain.replace(/\W+/g,'-'))}.png" alt="" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'spot-letter',textContent:'${esc(p.name[0])}'}))"></div>
      <div style="flex:1">
        <h3>${esc(p.name)}</h3>
        <div class="co">${esc(p.company)}</div>
        <p>${esc(p.desc)}</p>
        <div class="spot-meta">
          <span class="pill ${p.price==='Free'?'free':''}">${esc(p.price)}</span>
          <span class="pill">${esc(p.cat)}</span>
          <span class="pill">${esc(p.platforms)}</span>
        </div>
      </div>
    </div>
    ${p.line?`<p class="sub" style="margin-top:34px;max-width:60ch">${esc(p.line)}</p>`:''}
  </div>
  ${foot(p.note||'One of 2,262 records in the library')}`;
}

/* ------------------------------------------------ *
 * H. question — engagement prompt, split composition *
 * ------------------------------------------------ */
export function question(p){
  const opts = p.options.map(o=>`<div class="opt"><i></i>${esc(o)}</div>`).join('');
  return `
  <div class="pad">
    <div class="split grow" style="gap:56px">
      <div>
        <h1 class="display d-md" style="max-width:13ch">${p.html}</h1>
        ${p.sub ? `<p class="sub" style="margin-top:22px;max-width:34ch">${esc(p.sub)}</p>` : ''}
      </div>
      <div><div class="opts">${opts}</div></div>
    </div>
  </div>
  ${foot(p.note||'Tell us in the comments')}`;
}

/* ------------------------------------------------------- *
 * I. drop — the Sunday announcement / brand mark post.     *
 * ------------------------------------------------------- */
export function drop(p){
  const lanes = (p.lanes||[]).map((l,i)=>`
    <div class="lane-chip"><b class="num">${String(i+1).padStart(2,'0')}</b>${esc(l)}</div>`).join('');
  return `
  <div class="pad" style="justify-content:center">
    <div class="row" style="gap:38px;align-items:center">
      <div class="mark"><img src="../../shots/weekly-drip-logo.png" style="width:${p.markSize||248}px;height:${p.markSize||248}px;object-fit:contain;display:block" alt=""></div>
      <div style="flex:1">
        <h1 class="display ${p.size||'d-lg'}" style="max-width:15ch">${p.html}</h1>
        ${p.sub ? `<p class="sub sub-lg" style="margin-top:20px;max-width:44ch">${esc(p.sub)}</p>` : ''}
      </div>
    </div>
    ${lanes?`<div class="lanes">${lanes}</div>`:''}
  </div>
  ${foot(p.note||'')}`;
}

export const templates = {
  drip_lane, statement, screenshot, stat, ranking, explainer, spotlight, question, drop
};
