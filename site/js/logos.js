/* ==========================================================================
   The Creative Vault — logo sourcing, shared by every page that shows marks.

   Chain: an owned logo, then Google's favicon service at 128px, then
   DuckDuckGo, then a drawn monogram tinted from a hash of the name.

   Why a load check and not just onerror: both services answer a missing
   icon with HTTP 404 *and a valid placeholder image* (Google a 16px globe,
   DuckDuckGo a 48px grey arrow). Chrome paints that body and never fires
   error, so the old onerror-only chain stopped on a grey arrow for Behance,
   Google Fonts and ~100 others. Each image is now measured when it loads.
   ========================================================================== */

(function () {
  "use strict";

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function hostOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); }
    catch (e) { return ""; }
  }

  function initials(title) {
    var words = String(title || "").trim().split(/\s+/).filter(Boolean);
    if (!words.length) return "?";
    if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
    return (words[0][0] + words[1][0]).toUpperCase();
  }

  /* A stable hue per resource, so the fallback mark is identity, not grey mush. */
  function hueOf(seed) {
    var h = 0;
    var s = String(seed || "");
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
    return h;
  }

  function chainFor(host, owned) {
    var chain = [];
    if (owned) chain.push(owned);
    if (host) {
      chain.push("https://www.google.com/s2/favicons?domain=" + encodeURIComponent(host) + "&sz=128");
      chain.push("https://icons.duckduckgo.com/ip3/" + host + ".ico");
    }
    return chain;
  }

  /* r: a resource record. size: optional px for the well. */
  function markup(r, size) {
    var host = r._host || hostOf(r.website);
    var hue = hueOf(r.id || r.title);
    var style = "--mono-bg:hsl(" + hue + " 44% 93%);--mono-ink:hsl(" + hue + " 48% 32%)";
    var dim = size ? ' style="width:' + size + "px;height:" + size + "px;" + style + '"'
                   : ' style="' + style + '"';
    var chain = chainFor(host, r.logo);

    if (!chain.length) {
      return '<div class="logo" data-fallback="true"' + dim + '>' +
             '<span class="monogram">' + esc(initials(r.title)) + "</span></div>";
    }

    return '<div class="logo"' + dim + ">" +
           '<img src="' + esc(chain[0]) + '" alt="" loading="lazy" decoding="async" ' +
           'data-chain="' + esc(chain.slice(1).join("|")) + '" ' +
           'data-mono="' + esc(initials(r.title)) + '">' +
           "</div>";
  }

  function isPlaceholder(img) {
    var src = img.currentSrc || img.src || "";
    var w = img.naturalWidth, h = img.naturalHeight;
    if (!w) return true;
    if (src.indexOf("google.com/s2/favicons") !== -1) return w <= 16;
    if (src.indexOf("icons.duckduckgo.com") !== -1) return w === 48 && h === 48;
    return false;
  }

  function advance(img) {
    var chain = (img.getAttribute("data-chain") || "").split("|").filter(Boolean);
    if (chain.length) {
      img.setAttribute("data-chain", chain.slice(1).join("|"));
      img.src = chain[0];
      return;
    }
    /* Static pages may carry an owned drawing to fall back to. */
    var last = img.getAttribute("data-last");
    if (last) {
      img.removeAttribute("data-last");
      img.src = last;
      return;
    }
    var well = img.closest(".logo");
    if (well) {
      well.setAttribute("data-fallback", "true");
      well.innerHTML = '<span class="monogram">' + esc(img.getAttribute("data-mono") || "?") + "</span>";
    } else {
      img.style.visibility = "hidden";
    }
  }

  function check(img) {
    if (!img || img.tagName !== "IMG" || !img.hasAttribute("data-chain")) return;
    if (isPlaceholder(img)) advance(img);
    else {
      var well = img.closest(".logo");
      if (well) well.setAttribute("data-loaded", "true");
    }
  }

  /* Capture phase: load and error do not bubble. */
  document.addEventListener("load", function (e) { check(e.target); }, true);
  document.addEventListener("error", function (e) {
    var img = e.target;
    if (img && img.tagName === "IMG" && img.hasAttribute("data-chain")) advance(img);
  }, true);

  /* Images in static markup may finish before this script runs. */
  function sweep() {
    document.querySelectorAll("img[data-chain]").forEach(function (img) {
      if (img.complete) check(img);
    });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", sweep);
  else sweep();

  window.vaultLogos = { markup: markup, hostOf: hostOf, initials: initials, hueOf: hueOf, esc: esc };
})();
