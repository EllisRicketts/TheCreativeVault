/* POST /api/hit — thecreativevault page counter (first-party, cookie-free).
   Generated from ad-monetization-audit/counter/hit-function.template.mjs; edit there.

   Receives the tiny beacon from /hit.js and forwards it to the shared
   site_hits table (ELLIS Supabase) through the public.site_hit() function.
   The key below is Supabase's PUBLISHABLE key — public by design, the same
   one ellisricketts.com ships to every browser; it can only call
   site_hit(), which validates and rate-limits everything. No secret is used.

   Country/region/city come from Netlify's edge (context.geo); the IP address
   is never read or stored. Known crawlers are stored with bot = true so
   reports can leave them out. Always answers 204: a missed count is never
   the visitor's problem. */
const SITE = 'thecreativevault';
const HOST = /^(www\.)?thecreativevault\.co$/;
const SUPABASE_URL = 'https://fltcoeivtftmfpbqauod.supabase.co';
const PUBLISHABLE_KEY = 'sb_publishable_6Q4reT2MyWYHxRC6oGAKkQ_usziEhqV';

const BOT_UA = /bot\b|bot\/|crawl|spider|slurp|scrape|headless|lighthouse|pagespeed|gtmetrix|pingdom|uptime|monitor|preview|facebookexternalhit|embedly|whatsapp|telegram|discord|skype|curl|wget|python|httpclient|okhttp|axios|node-fetch|undici|go-http|java\/|libwww|scrapy|phantom|puppeteer|playwright|selenium|yandex|baidu|bytespider|petal|semrush|ahrefs|mj12|dotbot|gptbot|claudebot|ccbot|amazonbot|applebot|bingpreview/i;

const done = () => new Response(null, { status: 204, headers: { 'cache-control': 'no-store' } });
const text = (v, n) => (typeof v === 'string' ? v.trim().slice(0, n) : '');

export function deviceOf(ua, width) {
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(ua)) return 'tablet';
  if (/mobi|iphone|ipod|android|blackberry|iemobile|opera mini/i.test(ua)) return 'mobile';
  if (width > 0 && width < 768) return 'mobile';
  return 'desktop';
}

export function isBot(ua) {
  return !ua || BOT_UA.test(ua);
}

export default async (request, context) => {
  if (request.method !== 'POST') return new Response(null, { status: 405, headers: { allow: 'POST' } });

  let host = '';
  try { host = new URL(request.url).hostname.toLowerCase(); } catch { return done(); }
  if (!HOST.test(host)) return done(); // previews and local runs are never counted

  const raw = await request.text().catch(() => '');
  if (!raw || raw.length > 2000) return done();
  let b;
  try { b = JSON.parse(raw); } catch { return done(); }

  const path = text(b.p, 300);
  if (!path.startsWith('/')) return done();

  const ua = request.headers.get('user-agent') || '';
  const geo = (context && context.geo) || {};
  const width = Number(b.w) || 0;

  const args = {
    p_site: SITE,
    p_path: path,
    p_ref_host: text(b.r, 120).toLowerCase() || null,
    p_utm_source: text(b.u, 80) || null,
    p_sess: /^[a-z0-9]{8,24}$/.test(b.s || '') ? b.s : null,
    p_device: deviceOf(ua, width),
    p_country: text(geo.country && geo.country.code, 2) || null,
    p_region: text(geo.subdivision && geo.subdivision.code, 8) || null,
    p_city: text(geo.city, 80) || null,
    p_bot: isBot(ua),
  };

  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/site_hit`, {
      method: 'POST',
      headers: { apikey: PUBLISHABLE_KEY, 'content-type': 'application/json' },
      body: JSON.stringify(args),
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) console.error('site_hit failed', res.status);
  } catch (err) {
    console.error('site_hit failed', err && err.message);
  }
  return done();
};

export const config = { path: '/api/hit' };
