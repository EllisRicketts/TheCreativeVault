/* ==========================================================================
   The Creative Vault — application layer (homepage)
   Replaces app.js plus the V21–V37 patch scripts with one pass.
   2026-10 makeover: new card anatomy, icon category tiles, kit logo stacks,
   hero marks, the Weekly Drip feature, removable filter chips, a phone
   filter panel and a richer details dialog. Logos come from js/logos.js.
   ========================================================================== */

(function () {
  "use strict";

  var PAGE_SIZE = 60;
  var PAGE_STEP = 36;
  var FAV_KEY = "vault:favorites";
  var VIEW_KEY = "vault:view";
  var RECENT_KEY = "vault:recent";
  var SEARCH_KEY = "vault:searches";
  var RECENT_MAX = 24;

  var el = {
    search: document.getElementById("searchInput"),
    searchClear: document.getElementById("searchClear"),
    searchGo: document.getElementById("searchGo"),
    quickLinks: document.getElementById("quickLinks"),
    category: document.getElementById("categoryFilter"),
    price: document.getElementById("priceFilter"),
    platform: document.getElementById("platformFilter"),
    sort: document.getElementById("sortFilter"),
    reset: document.getElementById("resetFilters"),
    summary: document.getElementById("resultSummary"),
    toolbar: document.getElementById("toolbar"),
    filterToggle: document.getElementById("filterToggle"),
    filterCount: document.getElementById("filterCount"),
    activeFilters: document.getElementById("activeFilters"),
    activeChips: document.getElementById("activeChips"),
    grid: document.getElementById("resourceGrid"),
    empty: document.getElementById("emptyState"),
    emptyHint: document.getElementById("emptyHint"),
    loadMore: document.getElementById("loadMore"),
    loadMoreButton: document.getElementById("loadMoreButton"),
    loadMoreCount: document.getElementById("loadMoreCount"),
    loadError: document.getElementById("loadError"),
    collectionGrid: document.getElementById("collectionGrid"),
    categoryGrid: document.getElementById("categoryGrid"),
    totalCount: document.getElementById("totalCount"),
    totalCategories: document.getElementById("totalCategories"),
    mini: document.getElementById("miniSearchInput"),
    modal: document.getElementById("resourceModal"),
    modalContent: document.getElementById("modalContent"),
    modalClose: document.getElementById("modalClose"),
    masthead: document.querySelector(".masthead")
  };

  /* `resources` is a top-level const in data/resources.js. If that script
     never ran, typeof answers safely; if it threw mid-initialisation the
     binding is in its dead zone and only try/catch survives the read. */
  var all = [];
  try { all = typeof resources !== "undefined" ? resources : []; } catch (e) { all = []; }

  var L = window.vaultLogos;
  var esc = L.esc;
  var hostOf = L.hostOf;

  var byId = new Map();
  var visible = 0;
  var filtered = [];
  var favorites = loadFavorites();
  var activeCollection = null;
  var lastTrigger = null;

  /* ---------------------------------------------------------------- utils */

  function debounce(fn, wait) {
    var t;
    return function () {
      var args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(null, args); }, wait);
    };
  }

  function reducedMotion() {
    return !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }

  function logoMarkup(r, size) { return L.markup(r, size); }

  function loadFavorites() {
    try {
      var raw = localStorage.getItem(FAV_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch (e) { return new Set(); }
  }

  function saveFavorites() {
    try { localStorage.setItem(FAV_KEY, JSON.stringify([...favorites])); }
    catch (e) { /* private mode — favourites simply do not persist */ }
    /* The masthead badge lives on every page, so it has to be told. */
    if (window.vaultChrome) window.vaultChrome.syncCount();
  }

  function toggleFavorite(id) {
    if (favorites.has(id)) favorites.delete(id);
    else favorites.add(id);
    saveFavorites();
    /* Every heart for this record agrees: card, dialog. */
    var on = favorites.has(id);
    document.querySelectorAll('[data-fav="' + CSS.escape(id) + '"]').forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(on));
      var label = btn.querySelector("[data-fav-label]");
      if (label) label.textContent = on ? "Saved to My Vault" : "Save to My Vault";
      btn.classList.remove("is-popping");
      void btn.offsetWidth;
      if (on) btn.classList.add("is-popping");
    });
  }

  /* Most-recent-first, deduped, capped. Read back by /my-vault/. */
  function recordViewed(id) {
    if (!id) return;
    try {
      var list = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      if (!Array.isArray(list)) list = [];
      list = list.filter(function (x) { return x !== id; });
      list.unshift(id);
      localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_MAX)));
    } catch (e) { /* private mode */ }
  }

  /* ------------------------------------------------------------- indexing */

  /* 40 records carry a stray "true" in their platform list. Dropped here so
     nothing leaks onto a card, into search or into the platform filter. */
  var JUNK_VALUE = /^(true|false|null|undefined|n\/a|none|-)$/i;

  function cleanList(list) {
    return (list || [])
      .map(function (v) { return typeof v === "string" ? v.trim() : ""; })
      .filter(function (v) { return v && !JUNK_VALUE.test(v); });
  }

  function prepare() {
    all.forEach(function (r) {
      byId.set(r.id, r);
      r._host = hostOf(r.website);
      r.platforms = cleanList(r.platforms);
      r.categories = cleanList(r.categories);
      /* Price belongs in the haystack: "free" is one of the most common
         things anyone types into a tool directory. */
      r._blob = [
        r.title, r.shortName, r.company, r._host,
        r.shortDescription, (r.categories || []).join(" "),
        (r.tags || []).join(" "), (r.platforms || []).join(" "),
        r.price, r.type
      ].join(" ").toLowerCase();
      r._title = String(r.title || "").toLowerCase();
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

  /* ------------------------------------------------------- category colour */

  /* Colour codes four FAMILIES, not 192 categories — validated for
     colourblind separation; the name always sits beside the dot. Must stay
     in step with js/my-vault.js, because the patterns overlap and first
     match wins. */
  var FAMILIES = [
    {
      id: "learn", label: "Learning", color: "var(--fam-learning)",
      match: /learn|tutorial|course|educat|training|academy|school|documentation|guide|reference|inspiration/i
    },
    {
      id: "work", label: "Funding & business", color: "var(--fam-funding)",
      match: /grant|fund|freelanc|business|marketing|product(ivity)?|career|job|invoic|contract|legal|client|finance|admin/i
    },
    {
      /* "photo" deliberately absent: Photography is a making discipline. */
      id: "source", label: "Assets & libraries", color: "var(--fam-assets)",
      match: /marketplace|asset|stock|public domain|archive|texture|brush|mockup|template|font|typograph|icon|library|download|sound effect|sample/i
    },
    {
      /* \bai\b, not bare "ai", which otherwise matches Painting and Training. */
      id: "make", label: "Tools & software", color: "var(--fam-tools)",
      match: /art|design|3d|cad|game|dev|cod(e|ing)|web|software|video|audio|music|photo|image|\bai\b|anim|vfx|render|model|paint|draw|edit|creation|production|tool|essential|writing|print/i
    }
  ];

  var familyCache = new Map();

  function familyOf(category) {
    if (!category) return null;
    if (familyCache.has(category)) return familyCache.get(category);
    var found = null;
    for (var i = 0; i < FAMILIES.length; i++) {
      if (FAMILIES[i].match.test(category)) { found = FAMILIES[i]; break; }
    }
    familyCache.set(category, found);
    return found;
  }

  function dotStyle(category) {
    var fam = familyOf(category);
    return fam ? ' style="--dot:' + fam.color + '"' : "";
  }

  function dotFor(category) {
    return '<span class="cat-dot"' + dotStyle(category) + ' aria-hidden="true"></span>';
  }

  /* --------------------------------------------------------- category icons */

  /* First match wins, so specific patterns sit above general ones
     ("3D Printing" before "3D"). Drawn symbols live in index.html. */
  var CATEGORY_ICONS = [
    [/print/i, "k-printer"],
    [/game/i, "k-game"],
    [/photo/i, "k-camera"],
    [/essential|best|starter/i, "k-star"],
    [/digital art|illustrat|paint|draw|\bart\b/i, "k-pen"],
    [/grant|fund/i, "k-coins"],
    [/learn|tutorial|course|educat/i, "k-cap"],
    [/reference|book|inspiration/i, "k-book"],
    [/marketplace|shop|store/i, "k-bag"],
    [/\bai\b/i, "k-spark"],
    [/freelanc|career|job/i, "k-brief"],
    [/video|film|vfx/i, "k-film"],
    [/anim|motion/i, "k-motion"],
    [/3d|cad/i, "k-cube"],
    [/business|marketing|product/i, "k-chart"],
    [/music/i, "k-note"],
    [/audio|sound|podcast/i, "k-wave"],
    [/public domain|archive|museum/i, "k-archive"],
    [/content|social|creator|stream/i, "k-mic"],
    [/web|dev|cod(e|ing)/i, "k-code"],
    [/font|typograph/i, "k-type"],
    [/stock|image/i, "k-image"],
    [/asset|texture|template|mockup|brush/i, "k-layers"],
    [/software|app|tool/i, "k-window"]
  ];

  function iconFor(label) {
    for (var i = 0; i < CATEGORY_ICONS.length; i++) {
      if (CATEGORY_ICONS[i][0].test(label)) return CATEGORY_ICONS[i][1];
    }
    return "k-folder";
  }

  /* ---------------------------------------------------------------- cards */

  function priceMarkup(r) {
    if (!r.price || r.price === "Unknown") return "";
    var free = /^free$/i.test(r.price);
    return '<span class="price" data-free="' + free + '" data-tier="' + esc(r.price) + '">' + esc(r.price) + "</span>";
  }

  function cardMarkup(r) {
    var faved = favorites.has(r.id);
    var company = r.company || r._host;

    return '<article class="card reveal" data-id="' + esc(r.id) + '">' +
      '<div class="card-top">' +
        logoMarkup(r) +
        '<div class="card-head">' +
          '<h3 class="card-title"><button class="card-open" type="button" data-details="' + esc(r.id) + '">' +
            esc(r.title) + "</button></h3>" +
          (company ? '<p class="card-company">' + esc(company) + "</p>" : "") +
        "</div>" +
      "</div>" +

      '<button class="fav" type="button" data-fav="' + esc(r.id) + '" ' +
        'aria-pressed="' + faved + '" aria-label="Save ' + esc(r.title) + ' to My Vault">' +
        '<svg class="icon" aria-hidden="true"><use href="#i-heart"/></svg></button>' +

      (r.shortDescription ? '<p class="card-desc">' + esc(r.shortDescription) + "</p>" : "") +

      '<div class="card-foot">' +
        (r.primaryCategory ? '<span class="cat-tag">' + dotFor(r.primaryCategory) + esc(r.primaryCategory) + "</span>" : "") +
        priceMarkup(r) +
        (r.website ? '<a class="card-visit" href="' + esc(r.website) + '" target="_blank" rel="noopener" ' +
          'aria-label="Visit ' + esc(r.title) + ' (opens in a new tab)">Visit' +
          '<svg class="icon" aria-hidden="true"><use href="#i-out"/></svg></a>' : "") +
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

  /* A product's own name must outrank a passing mention of it elsewhere. */
  function relevance(r, q) {
    if (r._title === q) return 0;
    if (r._title.indexOf(q) === 0) return 1;
    if (r._title.indexOf(q) !== -1) return 2;
    if (String(r.company || "").toLowerCase().indexOf(q) !== -1) return 3;
    if ((r._host || "").indexOf(q) !== -1) return 3;
    return 4;
  }

  function applyFilters() {
    var f = currentFilters();

    /* Every word must appear somewhere, in any order. */
    var terms = f.q ? f.q.split(/\s+/).filter(Boolean) : [];

    filtered = all.filter(function (r) {
      for (var i = 0; i < terms.length; i++) {
        if (r._blob.indexOf(terms[i]) === -1) return false;
      }
      if (f.category !== "all" && (r.categories || []).indexOf(f.category) === -1) return false;
      if (f.price !== "all" && r.price !== f.price) return false;
      if (f.platform !== "all" && (r.platforms || []).indexOf(f.platform) === -1) return false;
      if (activeCollection && (r.collections || []).indexOf(activeCollection) === -1) return false;
      return true;
    });

    if (terms.length) {
      filtered.forEach(function (r) { r._rel = relevance(r, f.q); });
    }

    if (f.sort === "az") {
      filtered.sort(function (a, b) { return a.title.localeCompare(b.title); });
    } else if (f.sort === "free") {
      filtered.sort(function (a, b) {
        var af = /^free$/i.test(a.price) ? 0 : 1;
        var bf = /^free$/i.test(b.price) ? 0 : 1;
        return af - bf || a._rank - b._rank;
      });
    } else if (terms.length) {
      filtered.sort(function (a, b) {
        return a._rel - b._rel || a._rank - b._rank || a.title.localeCompare(b.title);
      });
    } else {
      filtered.sort(function (a, b) { return a._rank - b._rank || a.title.localeCompare(b.title); });
    }

    visible = 0;
    autoPages = 0;
    el.grid.innerHTML = "";
    el.grid.setAttribute("aria-busy", "false");
    renderNextPage(PAGE_SIZE);
    syncToolbarState(f);
    writeUrlState(f);
  }

  function renderNextPage(count) {
    var slice = filtered.slice(visible, visible + count);
    if (slice.length) {
      var wrap = document.createElement("div");
      wrap.innerHTML = slice.map(cardMarkup).join("");
      var frag = document.createDocumentFragment();
      while (wrap.firstChild) frag.appendChild(wrap.firstChild);
      el.grid.appendChild(frag);
      revealNew();
    }

    visible += slice.length;

    var remaining = filtered.length - visible;
    el.loadMore.hidden = remaining <= 0;
    el.loadMoreCount.textContent = remaining > 0 ? remaining.toLocaleString() + " more to show" : "";

    el.empty.hidden = filtered.length !== 0;
    if (!filtered.length && el.emptyHint) {
      var q = el.search.value.trim();
      el.emptyHint.textContent = q
        ? "Nothing for “" + q + "” with these filters. Check the spelling, try a broader word, or clear a filter."
        : "Try widening the category, price or platform.";
    }
    el.summary.innerHTML = filtered.length
      ? "<strong>" + filtered.length.toLocaleString() + "</strong> " + (filtered.length === 1 ? "resource" : "resources")
      : "No results";
  }

  /* A search worth repeating is worth keeping. Stored whole — query and all
     four filters — so restoring it reproduces the result set exactly. */
  function saveCurrentSearch() {
    var f = currentFilters();
    var label = [
      el.search.value.trim(),
      f.category !== "all" ? f.category : "",
      f.price !== "all" ? f.price : "",
      f.platform !== "all" ? f.platform : ""
    ].filter(Boolean).join(" · ") || "Everything";

    var entry = {
      label: label, q: el.search.value.trim(), category: f.category,
      price: f.price, platform: f.platform, sort: f.sort, at: Date.now()
    };

    try {
      var list = JSON.parse(localStorage.getItem(SEARCH_KEY) || "[]");
      if (!Array.isArray(list)) list = [];
      list = list.filter(function (x) { return x && x.label !== entry.label; });
      list.unshift(entry);
      localStorage.setItem(SEARCH_KEY, JSON.stringify(list.slice(0, 20)));
    } catch (e) { /* private mode */ }

    var button = document.querySelector("[data-save-search]");
    if (button) {
      var original = button.innerHTML;
      button.textContent = "Saved to My Vault";
      button.disabled = true;
      setTimeout(function () {
        button.innerHTML = original;
        button.disabled = false;
      }, 2200);
    }
  }

  /* Each active filter as a chip that removes only itself. */
  function activeChipList(f) {
    var chips = [];
    if (f.q) chips.push({ key: "q", label: "Search", value: "“" + el.search.value.trim() + "”" });
    if (activeCollection) {
      var kits = typeof vaultCollections !== "undefined" ? vaultCollections : [];
      var kit = kits.find(function (c) { return c.id === activeCollection; });
      chips.push({ key: "collection", label: "Kit", value: kit ? kit.label : activeCollection });
    }
    if (f.category !== "all") chips.push({ key: "category", label: "Category", value: f.category });
    if (f.price !== "all") chips.push({ key: "price", label: "Price", value: f.price });
    if (f.platform !== "all") chips.push({ key: "platform", label: "Platform", value: f.platform });
    if (f.sort !== "curated") chips.push({ key: "sort", label: "Sort", value: el.sort.options[el.sort.selectedIndex].text });
    return chips;
  }

  function syncToolbarState(f) {
    document.querySelector('[data-field="category"]').dataset.active = String(f.category !== "all");
    document.querySelector('[data-field="price"]').dataset.active = String(f.price !== "all");
    document.querySelector('[data-field="platform"]').dataset.active = String(f.platform !== "all");
    document.querySelector('[data-field="sort"]').dataset.active = String(f.sort !== "curated");

    var chips = activeChipList(f);
    var dirty = chips.length > 0;

    el.activeFilters.hidden = !dirty;
    el.reset.hidden = !dirty;
    var saveSearch = document.querySelector("[data-save-search]");
    if (saveSearch) saveSearch.hidden = !dirty;
    el.searchClear.hidden = !f.q;

    el.activeChips.innerHTML = chips.map(function (c) {
      return '<button class="active-chip" type="button" data-clear="' + c.key + '" ' +
             'aria-label="Remove ' + esc(c.label + ": " + c.value) + '">' +
             "<span>" + esc(c.label) + "</span>" + esc(c.value) +
             '<svg class="icon" aria-hidden="true"><use href="#i-close"/></svg></button>';
    }).join("");

    var filterN = ["category", "price", "platform"].filter(function (k) { return f[k] !== "all"; }).length;
    el.filterCount.hidden = filterN === 0;
    el.filterCount.textContent = String(filterN);

    /* One query, two fields. The field being typed into is never
       rewritten, so the caret does not jump. */
    if (el.mini && el.mini !== document.activeElement && el.mini.value !== el.search.value) {
      el.mini.value = el.search.value;
    }

    el.quickLinks.querySelectorAll(".chip").forEach(function (chip) {
      chip.setAttribute("aria-pressed", String(chip.dataset.category === f.category));
    });
    el.collectionGrid.querySelectorAll(".collection").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.dataset.collection === activeCollection));
    });
  }

  function clearOne(key) {
    if (key === "q") { el.search.value = ""; if (el.mini) el.mini.value = ""; }
    else if (key === "collection") activeCollection = null;
    else if (key === "sort") el.sort.value = "curated";
    else if (el[key]) el[key].value = "all";
    applyFilters();
  }

  function resetAll() {
    el.search.value = "";
    if (el.mini) el.mini.value = "";
    el.category.value = "all";
    el.price.value = "all";
    el.platform.value = "all";
    el.sort.value = "curated";
    activeCollection = null;
    applyFilters();
  }

  /* An unknown value (an old link, a typo) would otherwise leave the select
     blank and silently filter everything out. */
  function setSelect(select, value) {
    var ok = Array.prototype.some.call(select.options, function (o) { return o.value === value; });
    select.value = ok ? value : (select === el.sort ? "curated" : "all");
  }

  /* Filters live in the URL so a search can be linked, bookmarked and shared. */
  function readUrlState() {
    var params = new URLSearchParams(location.search);
    if (params.has("q")) el.search.value = params.get("q");
    if (params.has("category")) setSelect(el.category, params.get("category"));
    if (params.has("price")) setSelect(el.price, params.get("price"));
    if (params.has("platform")) setSelect(el.platform, params.get("platform"));
    if (params.has("sort")) setSelect(el.sort, params.get("sort"));
    if (params.has("collection")) activeCollection = params.get("collection");
    return params.toString().length > 0;
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
    history.replaceState(null, "", (qs ? location.pathname + "?" + qs : location.pathname) + location.hash);
  }

  function jumpToResults() {
    document.getElementById("resources").scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
  }

  /* --------------------------------------------------------- view switching */

  function setView(view, persist) {
    var next = view === "list" ? "list" : "grid";
    el.grid.dataset.view = next;
    document.querySelectorAll("[data-view-set]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", String(btn.dataset.viewSet === next));
    });
    if (persist) {
      try { localStorage.setItem(VIEW_KEY, next); } catch (e) { /* private mode */ }
    }
  }

  function storedView() {
    try { return localStorage.getItem(VIEW_KEY); } catch (e) { return null; }
  }

  /* ------------------------------------------------------------- sections */

  function buildQuickLinks(counts) {
    el.quickLinks.innerHTML = counts.slice(0, 6).map(function (entry) {
      return '<button class="chip" type="button" data-category="' + esc(entry[0]) + '" aria-pressed="false">' +
             dotFor(entry[0]) + esc(entry[0]) + "</button>";
    }).join("");
  }

  function buildCategoryOptions(counts) {
    el.category.innerHTML = '<option value="all">All categories</option>' +
      counts.map(function (entry) {
        return '<option value="' + esc(entry[0]) + '">' + esc(entry[0]) +
               " (" + entry[1].toLocaleString() + ")</option>";
      }).join("");
  }

  /* Every curated section that has something in it is guaranteed a tile;
     the largest remaining categories fill the rest. A curated category with
     nothing in it stays out: a door onto an empty room is worse than none. */
  var GRID_LIMIT = 24;

  function gridCategories(counts) {
    var curated = typeof vaultCategories === "undefined" ? [] : vaultCategories;
    var byLabel = new Map(counts);
    var chosen = new Map();

    curated.forEach(function (category) {
      var total = byLabel.get(category.label) || 0;
      if (total) chosen.set(category.label, total);
    });
    counts.forEach(function (entry) {
      if (chosen.size >= GRID_LIMIT || chosen.has(entry[0])) return;
      chosen.set(entry[0], entry[1]);
    });

    return [...chosen.entries()].sort(function (a, b) {
      return b[1] - a[1] || a[0].localeCompare(b[0]);
    });
  }

  function buildCategoryGrid(counts) {
    el.categoryGrid.innerHTML = gridCategories(counts).map(function (entry) {
      var label = entry[0];
      var curated = typeof vaultCategories === "undefined" ? null :
        vaultCategories.find(function (c) { return c.label === label; });
      var guide = curated
        ? '<a class="category-learn" href="/categories/' + esc(curated.id) + '/">Guide<span class="visually-hidden"> to ' + esc(label) + "</span></a>"
        : "";
      return '<div class="category"' + dotStyle(label) + ">" +
               '<button type="button" data-category="' + esc(label) + '">' +
                 '<span class="cat-icon" aria-hidden="true"><svg class="icon"><use href="#' + iconFor(label) + '"/></svg></span>' +
                 '<span class="cat-name">' + esc(label) + "</span>" +
                 '<span class="cat-count">' + entry[1].toLocaleString() + " resources</span>" +
               "</button>" + guide +
             "</div>";
    }).join("");
  }

  function buildFamilyKey() {
    var key = document.getElementById("familyKey");
    if (!key) return;
    key.innerHTML = FAMILIES.slice().reverse().map(function (fam) {
      return '<span class="key-item"><span class="cat-dot" style="--dot:' + fam.color +
             '" aria-hidden="true"></span>' + esc(fam.label) + "</span>";
    }).join("");
  }

  function buildCollections() {
    if (typeof vaultCollections === "undefined") {
      el.collectionGrid.closest("section").hidden = true;
      return;
    }

    var withMembers = vaultCollections.map(function (c) {
      var members = all.filter(function (r) { return (r.collections || []).indexOf(c.id) !== -1; })
        .sort(function (a, b) { return a._rank - b._rank; });
      return { c: c, members: members };
    }).filter(function (entry) { return entry.members.length > 0; });

    if (!withMembers.length) {
      el.collectionGrid.closest("section").hidden = true;
      return;
    }

    el.collectionGrid.innerHTML = withMembers.map(function (entry) {
      var marks = entry.members.slice(0, 4).map(function (r) { return logoMarkup(r); }).join("");
      var n = entry.members.length;
      return '<button class="collection" type="button" data-collection="' + esc(entry.c.id) + '" aria-pressed="false">' +
             '<span class="collection-marks" aria-hidden="true">' + marks + "</span>" +
             "<h3>" + esc(entry.c.label) + "</h3>" +
             "<p>" + esc(entry.c.description) + "</p>" +
             '<span class="collection-count">' + n.toLocaleString() + (n === 1 ? " resource" : " resources") +
               '<svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg></span></button>';
    }).join("");
  }

  /* The marks in the hero. Real records only: if one ever leaves the
     library it simply drops out of the arc. */
  var HERO_MARKS = [
    { id: "blender",                x: "50%", y: "10%", s: 88 },
    { id: "figma",                  x: "26%", y: "20%", s: 70 },
    { id: "adobe-photoshop",        x: "74%", y: "21%", s: 74 },
    { id: "chatgpt",                x: "9%",  y: "42%", s: 62 },
    { id: "procreate",              x: "37%", y: "41%", s: 66 },
    { id: "game-dev-unreal-engine", x: "63%", y: "43%", s: 70 },
    { id: "ableton-live",           x: "91%", y: "45%", s: 60 },
    { id: "davinci-resolve",        x: "20%", y: "66%", s: 66 },
    { id: "essential-godot",        x: "50%", y: "68%", s: 60 },
    { id: "midjourney",             x: "80%", y: "67%", s: 64 },
    { id: "krita",                  x: "35%", y: "86%", s: 52 },
    { id: "canva",                  x: "66%", y: "87%", s: 54 }
  ];

  function buildHeroMarks() {
    var box = document.getElementById("heroMarks");
    var list = document.getElementById("heroMarksList");
    if (!box || !list) return;

    var items = HERO_MARKS.filter(function (m) { return byId.has(m.id); });
    if (items.length < 6) return;

    list.innerHTML = items.map(function (m, i) {
      var r = byId.get(m.id);
      return '<li class="hero-mark" style="--x:' + m.x + ";--y:" + m.y + ";--s:" + m.s + "px;--i:" + i +
             ";--d:" + (-((i * 0.73) % 7)).toFixed(2) + 's">' +
             '<button type="button" data-details="' + esc(r.id) + '" aria-label="' + esc(r.title) + ' — details">' +
             logoMarkup(r) + "</button>" +
             '<span class="hero-mark-name" aria-hidden="true">' + esc(r.title) + "</span></li>";
    }).join("");

    box.hidden = false;
    list.classList.add("is-entering");
  }

  /* --------------------------------------------------------- Weekly Drip */

  function fmtDuration(v) {
    if (!v.durationSeconds) return v.duration || "";
    var s = v.durationSeconds, h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    return (h ? h + ":" + String(m).padStart(2, "0") : m) + ":" + String(sec).padStart(2, "0");
  }

  function fmtDate(iso) {
    try { return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" }); }
    catch (e) { return ""; }
  }

  /* The feature shows the leading video from four different lanes, so the
     section reads as a cross-section of the week rather than one topic. */
  function buildDrip() {
    var grid = document.getElementById("dripGrid");
    var topics = document.getElementById("dripTopics");
    var stamp = document.getElementById("dripStamp");
    if (!grid || !window.fetch) return;

    fetch("/data/weekly-drip.json", { cache: "no-cache" })
      .then(function (res) { if (!res.ok) throw new Error(String(res.status)); return res.json(); })
      .then(function (data) {
        var cats = (data.categories || []).filter(function (c) { return c.videos && c.videos.length; });
        if (!cats.length) return;

        if (stamp && data.updatedAt) stamp.textContent = "Updated " + fmtDate(data.updatedAt) + ".";

        /* Two lanes can share a top video (an AI video that is also a 3D one),
           so each pick takes the first video not already shown. */
        var seen = {};
        var picks = [];
        cats.forEach(function (c) {
          if (picks.length >= 4) return;
          var v = c.videos.find(function (x) { return !seen[x.videoId]; });
          if (!v) return;
          seen[v.videoId] = true;
          picks.push({ c: c, v: v });
        });
        grid.innerHTML = picks.map(function (p, i) {
          /* The lead keeps the full-size frame; the rest take YouTube's
             320px still, a twentieth of the bytes. */
          var thumb = String(p.v.thumbnail || "");
          if (i) thumb = thumb.replace("maxresdefault", "mqdefault");
          var time = fmtDuration(p.v);
          return '<a class="drip-item" href="' + esc(p.v.url) + '" target="_blank" rel="noopener">' +
                 '<span class="drip-thumb"><img src="' + esc(thumb) + '" alt="" loading="lazy" decoding="async" ' +
                   'width="' + (i ? 320 : 1280) + '" height="' + (i ? 180 : 720) + '">' +
                 '<span class="drip-play" aria-hidden="true"><svg class="icon"><use href="#i-play"/></svg></span>' +
                 (time ? '<span class="drip-time">' + esc(time) + "</span>" : "") + "</span>" +
                 '<span class="drip-body">' +
                   '<span class="drip-meta"><strong>' + esc(p.c.name) + "</strong>" + esc(fmtDate(p.v.publishedAt)) + "</span>" +
                   "<h3>" + esc(p.v.title) + '<span class="visually-hidden"> (YouTube, opens in a new tab)</span></h3>' +
                   '<span class="drip-channel">' + esc(p.v.channelTitle) + "</span>" +
                 "</span></a>";
        }).join("");

        if (topics) {
          topics.innerHTML = cats.map(function (c) {
            return '<a href="/weekly-drip/#drip-' + esc(c.id) + '">' + esc(c.name) + "</a>";
          }).join("");
          topics.hidden = false;
        }
      })
      .catch(function () { /* The panel still links to the full Drip page. */ });
  }

  /* ---------------------------------------------------------------- modal */

  function specRow(label, value) {
    if (!value || (Array.isArray(value) && !value.length)) return "";
    var body = Array.isArray(value)
      ? '<div class="tag-row">' + value.map(function (v) { return '<span class="tag">' + esc(v) + "</span>"; }).join("") + "</div>"
      : esc(value);
    return "<div><dt>" + esc(label) + "</dt><dd>" + body + "</dd></div>";
  }

  /* Up to four neighbours from the same primary category, best-ranked first. */
  function relatedTo(r) {
    return all.filter(function (x) {
      return x.id !== r.id && x.primaryCategory === r.primaryCategory && x._host !== r._host;
    }).sort(function (a, b) { return a._rank - b._rank; }).slice(0, 4);
  }

  function openDetails(id, trigger) {
    var r = byId.get(id);
    if (!r) return;
    recordViewed(id);
    if (!el.modal.open) lastTrigger = trigger || document.activeElement;

    var saved = favorites.has(r.id);
    var badges = [];
    if (r.price && r.price !== "Unknown") {
      badges.push('<span class="tag" data-free="' + /^free$/i.test(r.price) + '">' + esc(r.price) + "</span>");
    }
    if (r.openSource) badges.push('<span class="tag">Open source</span>');
    (r.platforms || []).slice(0, 5).forEach(function (p) { badges.push('<span class="tag">' + esc(p) + "</span>"); });

    var related = relatedTo(r);

    el.modalContent.innerHTML =
      '<div class="modal-head">' +
        logoMarkup(r, 72) +
        "<div>" +
          '<h2 id="modalTitle">' + esc(r.title) + "</h2>" +
          '<p class="card-company">' + esc(r.company || r._host || "") + "</p>" +
        "</div>" +
      "</div>" +

      (badges.length ? '<div class="modal-badges">' + badges.join("") + "</div>" : "") +

      '<p class="modal-desc">' + esc(r.longDescription || r.shortDescription || "") + "</p>" +

      '<dl class="spec">' +
        specRow("Category", (r.categories || []).slice(0, 6)) +
        specRow("Best for", (r.bestFor || []).slice(0, 6)) +
        specRow("Website", r._host) +
      "</dl>" +

      (related.length
        ? '<div class="modal-related"><h3>More in ' + esc(r.primaryCategory) + '</h3><div class="modal-related-list">' +
          related.map(function (x) {
            return '<button class="related-item" type="button" data-details="' + esc(x.id) + '">' +
                   logoMarkup(x, 30) + "<span>" + esc(x.title) + "</span></button>";
          }).join("") + "</div></div>"
        : "") +

      '<div class="modal-actions">' +
        '<a class="btn btn-primary" href="' + esc(r.website) + '" target="_blank" rel="noopener" data-visit="' + esc(r.id) + '">' +
          "Visit " + esc(r.title) + ' <svg class="icon" aria-hidden="true"><use href="#i-out"/></svg></a>' +
        '<button class="btn btn-lg fav-wide" type="button" data-fav="' + esc(r.id) + '" aria-pressed="' + saved + '">' +
          '<svg class="icon" aria-hidden="true"><use href="#i-heart"/></svg>' +
          "<span data-fav-label>" + (saved ? "Saved to My Vault" : "Save to My Vault") + "</span></button>" +
      "</div>";

    el.modalContent.scrollTop = 0;
    if (!el.modal.open) {
      if (typeof el.modal.showModal === "function") el.modal.showModal();
      else el.modal.setAttribute("open", "");
    } else {
      var title = document.getElementById("modalTitle");
      if (title) { title.setAttribute("tabindex", "-1"); title.focus(); }
    }
  }

  /* Plays the exit animation, then closes. */
  function closeDetails() {
    if (!el.modal.open) return;
    if (reducedMotion()) { el.modal.close(); return; }
    el.modal.classList.add("is-closing");
    setTimeout(function () {
      el.modal.classList.remove("is-closing");
      el.modal.close();
    }, 170);
  }

  /* --------------------------------------------------------------- motion */

  /* One authored moment: cards rise in along the reading order. Content is
     visible by default — the pre-state only exists when JS runs and the
     visitor has not asked for reduced motion. */
  var revealObserver = null;

  function setupReveal() {
    if (reducedMotion() || !("IntersectionObserver" in window)) return;
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

  /* Anything already on screen is shown at once; only what sits below the
     fold waits for the scroll animation. A reveal must never stand between
     someone and the results they just asked for. Rects are read in one pass
     before any class is written, so sixty nodes cost one layout. */
  function observeOrShow(nodeList) {
    var nodes = Array.prototype.slice.call(nodeList);
    if (!nodes.length) return;
    var fold = window.innerHeight || 800;
    var tops = nodes.map(function (n) { return n.getBoundingClientRect().top; });
    nodes.forEach(function (node, i) {
      if (tops[i] < fold) node.classList.add("is-instant", "is-in");
      else if (revealObserver) revealObserver.observe(node);
    });
  }

  function observeAll() { observeOrShow(document.querySelectorAll(".reveal:not(.is-in)")); }
  function revealNew() { observeOrShow(el.grid.querySelectorAll(".reveal:not(.is-in)")); }

  /* Scrolling pages in a few batches on its own, then hands over to the
     button. Unbounded, it kept growing the grid as the visitor neared the
     bottom, so the PDF, guides, submit band and footer below the library
     were effectively unreachable. */
  var AUTO_PAGES = 3;
  var autoPages = 0;

  function setupInfiniteScroll() {
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting && !el.loadMore.hidden && autoPages < AUTO_PAGES) {
        autoPages++;
        renderNextPage(PAGE_STEP);
      }
    }, { rootMargin: "400px 0px" });
    io.observe(el.loadMore);
  }

  /* The hero search and the masthead search are two views of one query. */
  function setupMiniSearch() {
    var mini = el.mini;
    var heroField = document.querySelector(".hero .search");
    if (!mini || !heroField) return;

    mini.addEventListener("input", debounce(function () {
      el.search.value = mini.value;
      applyFilters();
    }, 130));

    if (!("IntersectionObserver" in window)) return;
    new IntersectionObserver(function (entries) {
      el.masthead.dataset.compact = String(!entries[0].isIntersecting);
    }, { rootMargin: "-8px 0px 0px 0px", threshold: 0 }).observe(heroField);
  }

  /* The bookmark bubble. Shown once, dismissed forever. */
  function setupBookmarkTip() {
    var tip = document.getElementById("bookmarkTip");
    var close = document.getElementById("tipClose");
    if (!tip || !close) return;

    var DISMISSED = "vault:tipDismissed";
    try { if (localStorage.getItem(DISMISSED)) return; } catch (e) { /* private mode */ }

    var count = document.getElementById("tipCount");
    if (count) count.textContent = all.length.toLocaleString();

    var mod = document.getElementById("tipKeyMod");
    if (mod && /Mac|iPhone|iPad|iPod/.test(navigator.platform || navigator.userAgent)) mod.textContent = "⌘";

    tip.hidden = false;
    close.addEventListener("click", function () {
      tip.hidden = true;
      try { localStorage.setItem(DISMISSED, "1"); } catch (e) { /* private mode */ }
    });
  }

  function activeSearchField() {
    return el.masthead.dataset.compact === "true" ? (el.mini || el.search) : el.search;
  }

  function setupMasthead() {
    /* Publish the real masthead height for the sticky toolbar and anchor
       offsets. --masthead-h is an output here, never an input. */
    function publishHeight() {
      var h = Math.round(el.masthead.getBoundingClientRect().height);
      if (h) document.documentElement.style.setProperty("--masthead-h", h + "px");
    }
    publishHeight();
    if ("ResizeObserver" in window) new ResizeObserver(publishHeight).observe(el.masthead);
    else window.addEventListener("resize", debounce(publishHeight, 150));

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
    el.search.addEventListener("keydown", function (event) {
      if (event.key === "Enter") { event.preventDefault(); applyFilters(); jumpToResults(); }
    });
    el.searchClear.addEventListener("click", function () {
      el.search.value = "";
      el.search.focus();
      applyFilters();
    });
    if (el.searchGo) el.searchGo.addEventListener("click", function () { applyFilters(); jumpToResults(); });

    [el.category, el.price, el.platform, el.sort].forEach(function (control) {
      control.addEventListener("change", applyFilters);
    });

    el.reset.addEventListener("click", resetAll);
    el.loadMoreButton.addEventListener("click", function () { renderNextPage(PAGE_STEP); });

    el.filterToggle.addEventListener("click", function () {
      var open = el.filterToggle.getAttribute("aria-expanded") !== "true";
      el.filterToggle.setAttribute("aria-expanded", String(open));
      el.toolbar.dataset.filters = open ? "open" : "closed";
    });

    document.addEventListener("click", function (event) {
      var viewBtn = event.target.closest("[data-view-set]");
      if (viewBtn) { setView(viewBtn.dataset.viewSet, true); return; }

      var clear = event.target.closest("[data-clear]");
      if (clear) { clearOne(clear.dataset.clear); return; }

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

      var visited = event.target.closest('.card a[href^="http"], [data-visit]');
      if (visited) {
        var visitedCard = visited.closest("[data-id]");
        recordViewed(visited.dataset.visit || (visitedCard && visitedCard.dataset.id));
        /* Not prevented: the link still opens. */
        return;
      }

      var details = event.target.closest("[data-details]");
      if (details) {
        event.preventDefault();
        openDetails(details.dataset.details, details);
        return;
      }

      var fav = event.target.closest("[data-fav]");
      if (fav) {
        event.preventDefault();
        toggleFavorite(fav.dataset.fav);
        return;
      }

      if (event.target.closest("[data-save-search]")) {
        event.preventDefault();
        saveCurrentSearch();
        return;
      }

      if (event.target.closest("[data-reset]")) resetAll();
    });

    el.modalClose.addEventListener("click", closeDetails);
    el.modal.addEventListener("click", function (event) {
      if (event.target === el.modal) closeDetails();
    });
    el.modal.addEventListener("cancel", function (event) {
      event.preventDefault();
      closeDetails();
    });
    el.modal.addEventListener("close", function () {
      if (lastTrigger && document.contains(lastTrigger)) lastTrigger.focus();
      lastTrigger = null;
    });

    /* Keyboard-first: "/" jumps to whichever search field is on screen. */
    document.addEventListener("keydown", function (event) {
      if (event.key === "/" && !event.metaKey && !event.ctrlKey && !el.modal.open &&
          !/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) {
        event.preventDefault();
        var field = activeSearchField();
        field.focus();
        field.select();
      }
    });
  }

  /* ----------------------------------------------------------------- boot */

  /* The counts in the hero are pre-rendered, so they stay truthful; what
     failed is the interactive library, and the visitor is told so plainly. */
  function fail() {
    el.grid.innerHTML = "";
    el.grid.setAttribute("aria-busy", "false");
    el.summary.textContent = "";
    if (el.loadError) el.loadError.hidden = false;
    buildDrip();
  }

  function init() {
    if (!all.length) { fail(); return; }

    prepare();
    var counts = categoryCounts();

    el.totalCount.textContent = all.length.toLocaleString();
    el.totalCategories.textContent = counts.length.toLocaleString();

    buildQuickLinks(counts);
    buildCategoryOptions(counts);
    buildCategoryGrid(counts);
    buildFamilyKey();
    buildCollections();
    buildHeroMarks();
    buildDrip();

    wire();
    setView(storedView() || "grid", false);
    setupReveal();
    setupInfiniteScroll();
    setupMasthead();
    setupMiniSearch();
    setupBookmarkTip();

    var fromUrl = readUrlState();
    applyFilters();
    /* A shared or bookmarked search lands on its results, not the hero. */
    if (fromUrl && !location.hash) {
      requestAnimationFrame(function () {
        document.getElementById("resources").scrollIntoView({ block: "start" });
      });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
