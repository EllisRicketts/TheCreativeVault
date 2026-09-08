/* ==========================================================================
   The Creative Vault — theme + shared chrome behaviour
   Runs on all 55 pages. Deferred; the anti-flash boot snippet that actually
   sets data-theme lives inline in <head> and runs before first paint.
   ========================================================================== */
(function () {
  "use strict";

  var KEY = "vault:theme";
  var FAV_KEY = "vault:favorites";
  var THEMES = ["light", "medium", "dark"];

  /* The colour the browser paints behind the page and in the mobile URL bar.
     Left unset it stays the light value and frames a dark page in white. */
  var THEME_COLOR = { light: "#fbfaf9", medium: "#e8e2d9", dark: "#17151a" };

  var root = document.documentElement;

  function read(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function write(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* private mode */ }
  }

  function systemTheme() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark" : "light";
  }

  /* Stored preference wins; otherwise the system decides the FIRST visit only.
     After that the visitor's own choice is sticky, which is the whole point of
     offering the control. */
  function resolve() {
    var stored = read(KEY);
    return THEMES.indexOf(stored) !== -1 ? stored : systemTheme();
  }

  function paintMeta(theme) {
    var meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "theme-color");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", THEME_COLOR[theme] || THEME_COLOR.light);
  }

  function syncButtons(theme) {
    var buttons = document.querySelectorAll("[data-theme-set]");
    for (var i = 0; i < buttons.length; i++) {
      var on = buttons[i].getAttribute("data-theme-set") === theme;
      buttons[i].setAttribute("aria-checked", String(on));
      buttons[i].setAttribute("tabindex", on ? "0" : "-1");
    }
  }

  function apply(theme, animate) {
    if (THEMES.indexOf(theme) === -1) theme = "light";
    if (animate) {
      root.classList.add("theme-shifting");
      window.setTimeout(function () { root.classList.remove("theme-shifting"); }, 260);
    }
    root.setAttribute("data-theme", theme);
    paintMeta(theme);
    syncButtons(theme);
  }

  function set(theme) {
    write(KEY, theme);
    apply(theme, true);
  }

  /* ---- Theme switch ---------------------------------------------------- */
  function wireSwitch() {
    var group = document.querySelector(".theme-switch");
    if (!group) return;

    group.addEventListener("click", function (event) {
      var button = event.target.closest("[data-theme-set]");
      if (button) set(button.getAttribute("data-theme-set"));
    });

    /* A radio group is arrow-navigable. Without this the control is three
       tab stops that each look selectable but announce nothing about the set. */
    group.addEventListener("keydown", function (event) {
      var keys = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 };
      var step = keys[event.key];
      if (!step) return;
      event.preventDefault();
      var current = THEMES.indexOf(root.getAttribute("data-theme"));
      var next = THEMES[(current + step + THEMES.length) % THEMES.length];
      set(next);
      var button = group.querySelector('[data-theme-set="' + next + '"]');
      if (button) button.focus();
    });
  }

  /* ---- Favourites count in the masthead -------------------------------- */
  function favCount() {
    try {
      var raw = read(FAV_KEY);
      if (!raw) return 0;
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch (e) { return 0; }
  }

  function syncCount() {
    var badges = document.querySelectorAll("[data-vault-count]");
    var n = favCount();
    for (var i = 0; i < badges.length; i++) {
      badges[i].textContent = n > 99 ? "99+" : String(n);
      badges[i].hidden = n === 0;
    }
  }

  /* ---- Masthead search -------------------------------------------------
     On the homepage app.js owns this field and filters as you type, so a
     submit would pointlessly reload the page it is already filtering.
     Everywhere else the form is real and lands on / with ?q=. */
  function wireSearch() {
    var form = document.querySelector(".mast-search");
    if (!form || form.tagName !== "FORM") return;
    var input = form.querySelector("input");
    var isHome = !!document.getElementById("resourceGrid");

    if (isHome) {
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        var target = document.getElementById("resources");
        if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return;
    }

    /* app.js binds "/" on the homepage; bind it here only where it does not. */
    document.addEventListener("keydown", function (event) {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      var active = document.activeElement;
      var tag = active ? active.tagName : "";
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" ||
          (active && active.isContentEditable)) return;
      event.preventDefault();
      input.focus();
      input.select();
    });
  }

  /* ---- Sticky state -----------------------------------------------------
     app.js already does this on the homepage via a sentinel; the other 54
     pages have no app.js, so the masthead needs its own. */
  function wireStuck() {
    var masthead = document.querySelector(".masthead");
    if (!masthead || document.getElementById("resourceGrid")) return;
    var onScroll = function () {
      masthead.dataset.stuck = String(window.scrollY > 4);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- Boot ------------------------------------------------------------- */
  apply(resolve(), false);

  function start() {
    wireSwitch();
    wireSearch();
    wireStuck();
    syncCount();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }

  /* A theme or a saved tool changed in another tab. Follow it rather than
     letting two open tabs of the same site disagree. */
  window.addEventListener("storage", function (event) {
    if (event.key === KEY) apply(resolve(), true);
    if (event.key === FAV_KEY) syncCount();
  });

  /* Only track the system while the visitor has expressed no preference. */
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var onSystemChange = function () { if (!read(KEY)) apply(resolve(), true); };
    if (mq.addEventListener) mq.addEventListener("change", onSystemChange);
    else if (mq.addListener) mq.addListener(onSystemChange);
  }

  /* app.js and my-vault.js update favourites; let them refresh the badge. */
  window.vaultChrome = { syncCount: syncCount, setTheme: set };
})();
