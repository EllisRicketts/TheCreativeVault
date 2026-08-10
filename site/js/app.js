/* ==========================================================================
   The Creative Vault — application layer
   Replaces app.js plus the V21–V37 patch scripts with one pass.
   ========================================================================== */

(function () {
  "use strict";

  var PAGE_SIZE = 60;
  var PAGE_STEP = 36;
  var FAV_KEY = "vault:favorites";

  var el = {
    search: document.getElementById("searchInput"),
    searchClear: document.getElementById("searchClear"),
    quickLinks: document.getElementById("quickLinks"),
    category: document.getElementById("categoryFilter"),
    price: document.getElementById("priceFilter"),
    platform: document.getElementById("platformFilter"),
    sort: document.getElementById("sortFilter"),
    reset: document.getElementById("resetFilters"),
    summary: document.getElementById("resultSummary"),
    grid: document.getElementById("resourceGrid"),
    empty: document.getElementById("emptyState"),
    loadMore: document.getElementById("loadMore"),
    loadMoreButton: document.getElementById("loadMoreButton"),
    loadMoreCount: document.getElementById("loadMoreCount"),
    collectionGrid: document.getElementById("collectionGrid"),
    categoryGrid: document.getElementById("categoryGrid"),
    totalCount: document.getElementById("totalCount"),
    totalCategories: document.getElementById("totalCategories"),
    modal: document.getElementById("resourceModal"),
    modalContent: document.getElementById("modalContent"),
    modalClose: document.getElementById("modalClose"),
    masthead: document.querySelector(".masthead")
  };

  var all = typeof resources !== "undefined" ? resources : [];
  var byId = new Map();
  var visible = 0;
  var filtered = [];
  var favorites = loadFavorites();
  var activeCollection = null;

  /* ---------------------------------------------------------------- utils */

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function debounce(fn, wait) {
    var t;
    return function () {
      var args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(null, args); }, wait);
    };
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

  function loadFavorites() {
    try {
      var raw = localStorage.getItem(FAV_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch (e) { return new Set(); }
  }

  function saveFavorites() {
    try { localStorage.setItem(FAV_KEY, JSON.stringify([...favorites])); }
    catch (e) { /* private mode — favourites simply do not persist */ }
  }

  /* ------------------------------------------------------------- indexing */

  function prepare() {
    all.forEach(function (r) {
      byId.set(r.id, r);
      r._host = hostOf(r.website);
      r._blob = [
        r.title, r.shortName, r.company, r._host,
        r.shortDescription, (r.categories || []).join(" "),
        (r.tags || []).join(" "), (r.platforms || []).join(" ")
      ].join(" ").toLowerCase();
      r._rank =
        (r.editorPick ? 0 : 1) * 1000000 +
        (r.featured ? 0 : 1) * 100000 +
        (1000 - Math.min(1000, Number(r.popularity) || 0));
    });
  }

  function categoryCounts() {
    var counts = new Map();
    all.forEach(function (r) {
      (r.categories || []).forEach(function (c) {
        counts.set(c, (counts.get(c) || 0) + 1);
      });
    });
    return [...counts.entries()].sort(function (a, b) {
      return b[1] - a[1] || a[0].localeCompare(b[0]);
    });
  }

  /* ---------------------------------------------------------------- logos */

  /* Sourcing chain: an owned logo, then DuckDuckGo, then Google, then a
     drawn monogram. The old build went straight to Google at 128px and 102
     of those 404'd into grey initials. */
  function logoMarkup(r, size) {
    var host = r._host || hostOf(r.website);
    var hue = hueOf(r.id || r.title);
    var style = "--mono-bg:hsl(" + hue + " 44% 93%);--mono-ink:hsl(" + hue + " 48% 32%)";
    var dim = size ? ' style="width:' + size + "px;height:" + size + 'px;' + style + '"'
                   : ' style="' + style + '"';

    if (!host && !r.logo) {
      return '<div class="logo" data-fallback="true"' + dim + '>' +
             '<span class="monogram">' + esc(initials(r.title)) + "</span></div>";
    }

    var chain = [];
    if (r.logo) chain.push(r.logo);
    if (host) {
      chain.push("https://icons.duckduckgo.com/ip3/" + host + ".ico");
      chain.push("https://www.google.com/s2/favicons?domain=" + encodeURIComponent(host) + "&sz=128");
    }

    return '<div class="logo"' + dim + ">" +
           '<img src="' + esc(chain[0]) + '" alt="" loading="lazy" decoding="async" ' +
           'data-chain="' + esc(chain.slice(1).join("|")) + '" ' +
           'data-mono="' + esc(initials(r.title)) + '">' +
           "</div>";
  }

  /* One delegated error handler beats an inline onerror per image. */
  document.addEventListener("error", function (event) {
    var img = event.target;
    if (!img || img.tagName !== "IMG" || !img.closest(".logo")) return;

    var chain = (img.getAttribute("data-chain") || "").split("|").filter(Boolean);
    if (chain.length) {
      img.setAttribute("data-chain", chain.slice(1).join("|"));
      img.src = chain[0];
      return;
    }

    var well = img.closest(".logo");
    well.setAttribute("data-fallback", "true");
    well.innerHTML = '<span class="monogram">' + esc(img.getAttribute("data-mono") || "?") + "</span>";
  }, true);

  /* ---------------------------------------------------------------- cards */

  function cardMarkup(r) {
    var host = r._host;
    var free = /^free$/i.test(r.price);
    var meta = [];

    if (r.price && r.price !== "Unknown") {
      meta.push('<span class="price" data-free="' + (free ? "true" : "false") + '">' + esc(r.price) + "</span>");
    }
    if (r.primaryCategory) meta.push("<span>" + esc(r.primaryCategory) + "</span>");
    if ((r.platforms || []).length) meta.push("<span>" + esc(r.platforms.slice(0, 2).join(", ")) + "</span>");

    var faved = favorites.has(r.id);

    return '<article class="card reveal" data-id="' + esc(r.id) + '">' +
      '<button class="fav" type="button" data-fav="' + esc(r.id) + '" ' +
        'aria-pressed="' + (faved ? "true" : "false") + '" ' +
        'aria-label="Save ' + esc(r.title) + '">' +
        '<svg class="icon" aria-hidden="true"><use href="#i-heart"/></svg></button>' +

      logoMarkup(r) +

      "<div>" +
        '<h3 class="card-title"><a href="' + esc(r.website) + '" target="_blank" rel="noopener">' +
          esc(r.title) + "</a></h3>" +
        (host ? '<p class="card-company">' + esc(r.company || host) + "</p>" : "") +
      "</div>" +

      (r.shortDescription ? '<p class="card-desc">' + esc(r.shortDescription) + "</p>" : "") +

      '<div class="card-meta">' + meta.join("") + "</div>" +

      '<div class="card-actions">' +
        '<button class="btn" type="button" data-details="' + esc(r.id) + '">Details</button>' +
        '<a class="btn btn-visit" href="' + esc(r.website) + '" target="_blank" rel="noopener">' +
          'Visit <svg class="icon" aria-hidden="true"><use href="#i-out"/></svg></a>' +
      "</div>" +
    "</article>";
  }

  /* ------------------------------------------------------------- filtering */

  function currentFilters() {
    return {
      q: (el.search.value || "").trim().toLowerCase(),
      category: el.category.value,
      price: el.price.value,
      platform: el.platform.value,
      sort: el.sort.value
    };
  }

  function applyFilters() {
    var f = currentFilters();

    filtered = all.filter(function (r) {
      if (f.q && r._blob.indexOf(f.q) === -1) return false;
      if (f.category !== "all" && (r.categories || []).indexOf(f.category) === -1) return false;
      if (f.price !== "all" && r.price !== f.price) return false;
      if (f.platform !== "all" && (r.platforms || []).indexOf(f.platform) === -1) return false;
      if (activeCollection && (r.collections || []).indexOf(activeCollection) === -1) return false;
      return true;
    });

    if (f.sort === "az") {
      filtered.sort(function (a, b) { return a.title.localeCompare(b.title); });
    } else if (f.sort === "free") {
      filtered.sort(function (a, b) {
        var af = /^free$/i.test(a.price) ? 0 : 1;
        var bf = /^free$/i.test(b.price) ? 0 : 1;
        return af - bf || a._rank - b._rank;
      });
    } else {
      filtered.sort(function (a, b) { return a._rank - b._rank || a.title.localeCompare(b.title); });
    }

    visible = 0;
    el.grid.innerHTML = "";
    renderNextPage(PAGE_SIZE);
    syncToolbarState(f);
    writeUrlState(f);
  }

  function renderNextPage(count) {
    var slice = filtered.slice(visible, visible + count);
    if (slice.length) {
      var frag = document.createDocumentFragment();
      var wrap = document.createElement("div");
      wrap.innerHTML = slice.map(cardMarkup).join("");
      while (wrap.firstChild) frag.appendChild(wrap.firstChild);
      el.grid.appendChild(frag);
      revealNew();
    }

    visible += slice.length;

    var remaining = filtered.length - visible;
    el.loadMore.hidden = remaining <= 0;
    el.loadMoreCount.textContent = remaining > 0
      ? remaining.toLocaleString() + " more"
      : "";

    el.empty.hidden = filtered.length !== 0;
    el.summary.textContent = filtered.length
      ? "Showing " + visible.toLocaleString() + " of " + filtered.length.toLocaleString()
      : "";
  }

  function syncToolbarState(f) {
    document.querySelector('[data-field="category"]').dataset.active = String(f.category !== "all");
    document.querySelector('[data-field="price"]').dataset.active = String(f.price !== "all");
    document.querySelector('[data-field="platform"]').dataset.active = String(f.platform !== "all");
    document.querySelector('[data-field="sort"]').dataset.active = String(f.sort !== "curated");

    var dirty = f.q || f.category !== "all" || f.price !== "all" ||
                f.platform !== "all" || f.sort !== "curated" || activeCollection;
    el.reset.hidden = !dirty;
    el.searchClear.hidden = !f.q;

    el.quickLinks.querySelectorAll(".chip").forEach(function (chip) {
      chip.setAttribute("aria-pressed", String(chip.dataset.category === f.category));
    });
    el.collectionGrid.querySelectorAll(".collection").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.dataset.collection === activeCollection));
    });
  }

  function resetAll() {
    el.search.value = "";
    el.category.value = "all";
    el.price.value = "all";
    el.platform.value = "all";
    el.sort.value = "curated";
    activeCollection = null;
    applyFilters();
  }

  /* Filters live in the URL so a search can be linked, bookmarked and shared,
     and so the site can honestly declare a SearchAction to search engines. */
  function readUrlState() {
    var params = new URLSearchParams(location.search);
    if (params.has("q")) el.search.value = params.get("q");
    if (params.has("category")) el.category.value = params.get("category");
    if (params.has("price")) el.price.value = params.get("price");
    if (params.has("platform")) el.platform.value = params.get("platform");
    if (params.has("sort")) el.sort.value = params.get("sort");
    if (params.has("collection")) activeCollection = params.get("collection");
  }

  function writeUrlState(f) {
    var params = new URLSearchParams();
    if (f.q) params.set("q", el.search.value.trim());
    if (f.category !== "all") params.set("category", f.category);
    if (f.price !== "all") params.set("price", f.price);
    if (f.platform !== "all") params.set("platform", f.platform);
    if (f.sort !== "curated") params.set("sort", f.sort);
    if (activeCollection) params.set("collection", activeCollection);

    var qs = params.toString();
    history.replaceState(null, "", qs ? location.pathname + "?" + qs : location.pathname);
  }

  function jumpToResults() {
    document.getElementById("resources").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  /* ------------------------------------------------------------- sections */

  function buildQuickLinks(counts) {
    el.quickLinks.innerHTML = counts.slice(0, 8).map(function (entry) {
      return '<button class="chip" type="button" data-category="' + esc(entry[0]) + '" aria-pressed="false">' +
             esc(entry[0]) + "</button>";
    }).join("");
  }

  function buildCategoryOptions(counts) {
    el.category.innerHTML = '<option value="all">All categories</option>' +
      counts.map(function (entry) {
        return '<option value="' + esc(entry[0]) + '">' + esc(entry[0]) +
               " (" + entry[1].toLocaleString() + ")</option>";
      }).join("");
  }

  function buildCategoryGrid(counts) {
    el.categoryGrid.innerHTML = counts.slice(0, 24).map(function (entry) {
      return '<button class="category reveal" type="button" data-category="' + esc(entry[0]) + '">' +
             "<span>" + esc(entry[0]) + "</span>" +
             '<span class="tabular">' + entry[1].toLocaleString() + "</span></button>";
    }).join("");
  }

  function buildCollections() {
    if (typeof vaultCollections === "undefined") {
      el.collectionGrid.closest("section").hidden = true;
      return;
    }

    var withCounts = vaultCollections.map(function (c) {
      var n = all.filter(function (r) { return (r.collections || []).indexOf(c.id) !== -1; }).length;
      return { c: c, n: n };
    }).filter(function (entry) { return entry.n > 0; });

    if (!withCounts.length) {
      el.collectionGrid.closest("section").hidden = true;
      return;
    }

    el.collectionGrid.innerHTML = withCounts.map(function (entry) {
      return '<button class="collection reveal" type="button" data-collection="' + esc(entry.c.id) + '" aria-pressed="false">' +
             "<h3>" + esc(entry.c.label) + "</h3>" +
             "<p>" + esc(entry.c.description) + "</p>" +
             '<span class="collection-count">' + entry.n.toLocaleString() + " resources</span></button>";
    }).join("");
  }

  /* ---------------------------------------------------------------- modal */

  function specRow(label, value) {
    if (!value || (Array.isArray(value) && !value.length)) return "";
    var body = Array.isArray(value)
      ? '<div class="tag-row">' + value.map(function (v) { return '<span class="tag">' + esc(v) + "</span>"; }).join("") + "</div>"
      : esc(value);
    return "<div><dt>" + esc(label) + "</dt><dd>" + body + "</dd></div>";
  }

  function openDetails(id) {
    var r = byId.get(id);
    if (!r) return;

    el.modalContent.innerHTML =
      '<div class="modal-head">' +
        logoMarkup(r, 72) +
        "<div>" +
          '<h2 id="modalTitle">' + esc(r.title) + "</h2>" +
          '<p class="card-company">' + esc(r.company || r._host || "") + "</p>" +
        "</div>" +
      "</div>" +

      '<p class="modal-desc">' + esc(r.longDescription || r.shortDescription || "") + "</p>" +

      '<dl class="spec">' +
        specRow("Price", r.price !== "Unknown" ? r.price : "") +
        specRow("Category", (r.categories || []).slice(0, 6)) +
        specRow("Platforms", r.platforms || []) +
        specRow("Best for", (r.bestFor || []).slice(0, 6)) +
        specRow("Open source", r.openSource ? "Yes" : "") +
        specRow("Website", r._host) +
      "</dl>" +

      '<div class="modal-actions">' +
        '<a class="btn btn-primary" href="' + esc(r.website) + '" target="_blank" rel="noopener">' +
          'Visit site <svg class="icon" aria-hidden="true"><use href="#i-out"/></svg></a>' +
      "</div>";

    if (typeof el.modal.showModal === "function") el.modal.showModal();
    else el.modal.setAttribute("open", "");
  }

  /* --------------------------------------------------------------- motion */

  /* One authored moment: cards rise in along the reading order. Content is
     visible by default — the pre-state only exists when JS runs and the
     visitor has not asked for reduced motion. */
  var revealObserver = null;

  function setupReveal() {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) return;

    document.documentElement.classList.add("js-reveal");

    revealObserver = new IntersectionObserver(function (entries) {
      var batch = 0;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.style.setProperty("--reveal-delay", Math.min(batch * 45, 270) + "ms");
        entry.target.classList.add("is-in");
        revealObserver.unobserve(entry.target);
        batch++;
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });

    observeAll();
  }

  function observeAll() {
    if (!revealObserver) return;
    document.querySelectorAll(".reveal:not(.is-in)").forEach(function (node) {
      revealObserver.observe(node);
    });
  }

  function revealNew() { observeAll(); }

  function setupInfiniteScroll() {
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting && !el.loadMore.hidden) renderNextPage(PAGE_STEP);
    }, { rootMargin: "600px 0px" });
    io.observe(el.loadMore);
  }

  function setupMasthead() {
    /* Publish the real masthead height so the sticky toolbar and anchor
       offsets track it instead of a hardcoded guess per breakpoint. */
    function publishHeight() {
      var h = Math.round(el.masthead.getBoundingClientRect().height);
      if (h) document.documentElement.style.setProperty("--masthead-h", h + "px");
    }

    publishHeight();

    if ("ResizeObserver" in window) {
      new ResizeObserver(publishHeight).observe(el.masthead);
    } else {
      window.addEventListener("resize", debounce(publishHeight, 150));
    }

    var sentinel = document.createElement("div");
    sentinel.style.cssText = "position:absolute;top:0;height:1px;width:1px";
    document.body.prepend(sentinel);

    if (!("IntersectionObserver" in window)) return;
    new IntersectionObserver(function (entries) {
      el.masthead.dataset.stuck = String(!entries[0].isIntersecting);
    }, { threshold: 0 }).observe(sentinel);
  }

  /* --------------------------------------------------------------- events */

  function wire() {
    el.search.addEventListener("input", debounce(applyFilters, 130));
    el.searchClear.addEventListener("click", function () {
      el.search.value = "";
      el.search.focus();
      applyFilters();
    });

    [el.category, el.price, el.platform, el.sort].forEach(function (control) {
      control.addEventListener("change", applyFilters);
    });

    el.reset.addEventListener("click", resetAll);
    el.loadMoreButton.addEventListener("click", function () { renderNextPage(PAGE_STEP); });

    document.addEventListener("click", function (event) {
      var chip = event.target.closest("[data-category]");
      if (chip) {
        var value = chip.dataset.category;
        el.category.value = el.category.value === value ? "all" : value;
        activeCollection = null;
        applyFilters();
        jumpToResults();
        return;
      }

      var collection = event.target.closest("[data-collection]");
      if (collection) {
        var id = collection.dataset.collection;
        activeCollection = activeCollection === id ? null : id;
        el.category.value = "all";
        applyFilters();
        jumpToResults();
        return;
      }

      var details = event.target.closest("[data-details]");
      if (details) {
        event.preventDefault();
        openDetails(details.dataset.details);
        return;
      }

      var fav = event.target.closest("[data-fav]");
      if (fav) {
        event.preventDefault();
        var favId = fav.dataset.fav;
        if (favorites.has(favId)) favorites.delete(favId);
        else favorites.add(favId);
        fav.setAttribute("aria-pressed", String(favorites.has(favId)));
        saveFavorites();
        return;
      }

      if (event.target.closest("[data-reset]")) resetAll();
    });

    el.modalClose.addEventListener("click", function () { el.modal.close(); });
    el.modal.addEventListener("click", function (event) {
      if (event.target === el.modal) el.modal.close();
    });

    /* Keyboard-first: "/" jumps to search from anywhere. */
    document.addEventListener("keydown", function (event) {
      if (event.key === "/" && document.activeElement !== el.search &&
          !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
        event.preventDefault();
        el.search.focus();
        el.search.select();
      }
    });
  }

  /* ----------------------------------------------------------------- boot */

  function init() {
    if (!all.length) {
      el.summary.textContent = "Resource data failed to load.";
      return;
    }

    prepare();
    var counts = categoryCounts();

    el.totalCount.textContent = all.length.toLocaleString();
    el.totalCategories.textContent = counts.length.toLocaleString();

    buildQuickLinks(counts);
    buildCategoryOptions(counts);
    buildCategoryGrid(counts);
    buildCollections();

    wire();
    setupReveal();
    setupInfiniteScroll();
    setupMasthead();

    readUrlState();
    applyFilters();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
