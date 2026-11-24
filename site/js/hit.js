/* thecreativevault page counter — first-party, no cookies, no third parties.
   Generated from ad-monetization-audit/counter/hit.template.js; edit there.

   Sends one tiny POST to this site's own /api/hit per page view: the path,
   the referring site's host name, a utm_source if present, the window width
   (phone vs desktop) and a random id kept only for this tab (sessionStorage,
   gone when the tab closes). Nothing else, and never an IP address or cookie.

   Sends nothing when the browser asks not to be tracked (Do Not Track or
   Global Privacy Control), when it is an automated browser, on preview or
   local hosts, or on a device switched off with ?nocount (?count undoes it). */
(function () {
  'use strict';
  try {
    if (window.__siteHit) return;
    window.__siteHit = true;

    var HOST = /^(www\.)?thecreativevault\.co$/;
    if (!HOST.test(location.hostname)) return;

    var nav = navigator;
    if (nav.webdriver === true) return;
    if (nav.doNotTrack === '1' || window.doNotTrack === '1' || nav.msDoNotTrack === '1') return;
    if (nav.globalPrivacyControl === true) return;

    var KEY_OFF = 'hit:off', KEY_SESS = 'hit:s';
    var q = location.search || '';
    try {
      if (/[?&]nocount(&|=|$)/.test(q)) localStorage.setItem(KEY_OFF, '1');
      else if (/[?&]count(&|=|$)/.test(q)) localStorage.removeItem(KEY_OFF);
      if (localStorage.getItem(KEY_OFF) === '1') return;
    } catch (e) { /* storage blocked: keep counting, nothing to remember */ }

    var sess = '';
    try {
      sess = sessionStorage.getItem(KEY_SESS) || '';
      if (!/^[a-z0-9]{8,24}$/.test(sess)) {
        sess = (Math.random().toString(36).slice(2, 10) + Date.now().toString(36)).slice(0, 16);
        sessionStorage.setItem(KEY_SESS, sess);
      }
    } catch (e) { sess = ''; }

    var ref = '';
    try {
      if (document.referrer) {
        var rh = new URL(document.referrer).hostname.toLowerCase();
        if (rh && rh !== location.hostname.toLowerCase()) ref = rh;
      }
    } catch (e) { ref = ''; }

    var utm = '';
    try { utm = (new URLSearchParams(q).get('utm_source') || '').slice(0, 80); } catch (e) { utm = ''; }

    var last = '';
    function send(first) {
      var path = location.pathname || '/';
      if (path === last) return;
      if (/^\/admin(\/|$)/.test(path)) { last = path; return; } // the owner's own screens
      last = path;
      var body = JSON.stringify({ p: path, r: first ? ref : '', u: first ? utm : '', s: sess, w: window.innerWidth || 0 });
      try {
        if (nav.sendBeacon && nav.sendBeacon('/api/hit', new Blob([body], { type: 'application/json' }))) return;
      } catch (e) { /* fall through to fetch */ }
      try {
        fetch('/api/hit', { method: 'POST', body: body, keepalive: true, headers: { 'Content-Type': 'application/json' } })['catch'](function () {});
      } catch (e) { /* a missed count is never an error the visitor should see */ }
    }

    /* Sites that change pages without a full load (Next.js, Astro's
       ClientRouter) do it with history.pushState; count those too. */
    function onNavigate() { setTimeout(function () { send(false); }, 0); }
    ['pushState', 'replaceState'].forEach(function (name) {
      var original = history[name];
      if (typeof original !== 'function') return;
      history[name] = function () {
        var result = original.apply(this, arguments);
        onNavigate();
        return result;
      };
    });
    window.addEventListener('popstate', onNavigate);

    send(true);
  } catch (e) { /* never break the page */ }
})();
