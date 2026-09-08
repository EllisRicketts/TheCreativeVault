/* ==========================================================================
   My Vault — the visitor's own page

   There are no accounts and no server, so "your vault" means exactly three
   localStorage keys, all written by the library itself:

     vault:favorites  ids the visitor saved            (app.js)
     vault:recent     ids they opened, newest first    (app.js)
     vault:searches   queries + filters they kept      (app.js)

   This file only ever READS the corpus; it resolves saved ids against the
   same generated-resources.js the homepage uses, so a card here and a card
   there can never disagree.
   ========================================================================== */
(function () {
  "use strict";

  var FAV_KEY = "vault:favorites";
  var RECENT_KEY = "vault:recent";
  var SEARCH_KEY = "vault:searches";

  var el = {
    summary: document.getElementById("vaultSummary"),
    empty: document.getElementById("vaultEmpty"),
    body: document.getElementById("vaultBody"),
    grid: document.getElementById("vaultGrid"),
    noMatch: document.getElementById("vaultNoMatch"),
    resultLine: document.getElementById("vaultResultLine"),
    search: document.getElementById("vaultSearch"),
    category: document.getElementById("vaultCategory"),
    price: document.getElementById("vaultPrice"),
    recentSection: document.getElementById("recent"),
    recentRow: document.getElementById("recentRow"),
    searchSection: document.getElementById("searches"),
    savedSearches: document.getElementById("savedSearches"),
    status: document.getElementById("dataStatus"),
    confirm: document.getElementById("confirmDialog")
  };

  var all = typeof resources !== "undefined" ? resources : [];
  var byId = new Map();
  var saved = [];

  /* ------------------------------------------------------------ storage -- */

  function readList(key) {
    try {
      var parsed = JSON.parse(localStorage.getItem(key) || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) { return []; }
  }

  function writeList(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch (e) { /* private mode */ }
  }

  /* ------------------------------------------------------------- utils --- */

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

  function hueOf(seed) {
    var h = 0, s = String(seed || "");
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
    return h;
  }

  var JUNK_VALUE = /^(true|false|null|undefined|n\/a|none|-)$/i;
  function cleanList(list) {
    return (list || [])
      .map(function (v) { return typeof v === "string" ? v.trim() : ""; })
      .filter(function (v) { return v && !JUNK_VALUE.test(v); });
  }

  /* The four families from DESIGN.md, in app.js's exact order with app.js's
     exact patterns. Order matters — the tests overlap, and first match wins,
     so a looser copy here would colour the same category differently on this
     page than in the library. Keep the two in step. */
  var FAMILIES = [
    {
      color: "var(--fam-learning)",
      match: /learn|tutorial|course|educat|training|academy|school|documentation|guide|reference|inspiration/i
    },
    {
      color: "var(--fam-funding)",
      match: /grant|fund|freelanc|business|marketing|product(ivity)?|career|job|invoic|contract|legal|client|finance|admin/i
    },
    {
      color: "var(--fam-assets)",
      match: /marketplace|asset|stock|public domain|archive|texture|brush|mockup|template|font|typograph|icon|library|download|sound effect|sample/i
    },
    {
      color: "var(--fam-tools)",
      match: /art|design|3d|cad|game|dev|cod(e|ing)|web|software|video|audio|music|photo|image|\bai\b|anim|vfx|render|model|paint|draw|edit|creation|production|tool|essential|writing|print/i
    }
  ];

  function dotFor(category) {
    if (!category) return '<span class="cat-dot" aria-hidden="true"></span>';
    for (var i = 0; i < FAMILIES.length; i++) {
      if (FAMILIES[i].match.test(category)) {
        return '<span class="cat-dot" style="--dot:' + FAMILIES[i].color + '" aria-hidden="true"></span>';
      }
    }
    return '<span class="cat-dot" aria-hidden="true"></span>';
  }

  /* Same sourcing chain and markup as the library, so style.css dresses
     these cards identically without a second set of rules. */
  function logoMarkup(r, size) {
    var host = r._host || hostOf(r.website);
    var hue = hueOf(r.id || r.title);
    var style = "--mono-bg:hsl(" + hue + " 44% 93%);--mono-ink:hsl(" + hue + " 48% 32%)";
    var dim = size ? ' style="width:' + size + "px;height:" + size + "px;" + style + '"'
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
           'data-mono="' + esc(initials(r.title)) + '"></div>';
  }

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

  function cardMarkup(r) {
    var free = /^free$/i.test(r.price);
    var meta = [];
    if (r.price && r.price !== "Unknown") {
      meta.push('<span class="price" data-free="' + (free ? "true" : "false") + '">' + esc(r.price) + "</span>");
    }
    if (r.primaryCategory) {
      meta.push('<span class="cat">' + dotFor(r.primaryCategory) + esc(r.primaryCategory) + "</span>");
    }
    if ((r.platforms || []).length) {
      meta.push("<span>" + esc(r.platforms.slice(0, 2).join(", ")) + "</span>");
    }

    return '<article class="card reveal is-instant" data-id="' + esc(r.id) + '">' +
      '<button class="fav" type="button" data-unsave="' + esc(r.id) + '" aria-pressed="true" ' +
        'aria-label="Remove ' + esc(r.title) + ' from your vault">' +
        '<svg class="icon" aria-hidden="true"><use href="#i-heart"/></svg></button>' +
      logoMarkup(r) +
      '<div class="card-head">' +
        '<h3 class="card-title"><a href="' + esc(r.website) + '" target="_blank" rel="noopener">' +
          esc(r.title) + "</a></h3>" +
        (r.company || r._host ? '<p class="card-company">' + esc(r.company || r._host) + "</p>" : "") +
      "</div>" +
      (r.shortDescription ? '<p class="card-desc">' + esc(r.shortDescription) + "</p>" : "") +
      '<div class="card-meta">' + meta.join("") + "</div>" +
      '<div class="card-actions">' +
        '<a class="btn btn-visit" href="' + esc(r.website) + '" target="_blank" rel="noopener">' +
          'Visit <svg class="icon" aria-hidden="true"><use href="#i-out"/></svg></a>' +
      "</div>" +
    "</article>";
  }

  /* ------------------------------------------------------------- index --- */

  function index() {
    for (var i = 0; i < all.length; i++) {
      var r = all[i];
      if (!r || !r.id) continue;
      r._host = hostOf(r.website);
      r.platforms = cleanList(r.platforms);
      r._title = String(r.title || "").toLowerCase();
      r._haystack = [r.title, r.company, r.shortDescription, r.primaryCategory]
        .filter(Boolean).join(" ").toLowerCase();
      byId.set(r.id, r);
    }
  }

  /* Newest save first. localStorage keeps insertion order, so reversing the
     stored array is the visitor's own most-recent-first. */
  function loadSaved() {
    var ids = readList(FAV_KEY).slice().reverse();
    saved = ids.map(function (id) { return byId.get(id); }).filter(Boolean);
    return ids.length;
  }

  /* ------------------------------------------------------------ render --- */

  function fillCategories() {
    var names = {};
    saved.forEach(function (r) {
      if (r.primaryCategory) names[r.primaryCategory] = (names[r.primaryCategory] || 0) + 1;
    });
    var sorted = Object.keys(names).sort();
    var html = '<option value="all">All categories</option>';
    sorted.forEach(function (name) {
      html += '<option value="' + esc(name) + '">' + esc(name) + " (" + names[name] + ")</option>";
    });
    el.category.innerHTML = html;
    return sorted.length;
  }

  function summarise(savedCount, categoryCount) {
    var free = saved.filter(function (r) { return /^free$/i.test(r.price); }).length;
    var bits = [
      "<strong>" + savedCount + " saved</strong>",
      categoryCount + (categoryCount === 1 ? " category" : " categories")
    ];
    if (free) bits.push(free + " free");
    el.summary.innerHTML = bits.join(" · ") +
      ". Kept in this browser, on this device.";
  }

  function visibleSaved() {
    var q = (el.search.value || "").trim().toLowerCase();
    var cat = el.category.value;
    var price = el.price.value;

    return saved.filter(function (r) {
      if (cat !== "all" && r.primaryCategory !== cat) return false;
      if (price !== "all" && String(r.price) !== price) return false;
      if (q && r._haystack.indexOf(q) === -1) return false;
      return true;
    });
  }

  function renderGrid() {
    var list = visibleSaved();
    el.grid.innerHTML = list.map(cardMarkup).join("");
    el.noMatch.hidden = list.length > 0;
    el.grid.hidden = list.length === 0;
    el.resultLine.textContent = list.length === saved.length
      ? list.length + (list.length === 1 ? " tool" : " tools")
      : list.length + " of " + saved.length;
  }

  function renderRecent() {
    /* Something already saved is not "where you were", it is where you are. */
    var savedIds = new Set(readList(FAV_KEY));
    var list = readList(RECENT_KEY)
      .filter(function (id) { return !savedIds.has(id); })
      .map(function (id) { return byId.get(id); })
      .filter(Boolean)
      .slice(0, 8);

    if (!list.length) { el.recentSection.hidden = true; return; }
    el.recentSection.hidden = false;

    el.recentRow.innerHTML = list.map(function (r) {
      return '<div class="recent-item">' +
        '<a class="recent-link" href="' + esc(r.website) + '" target="_blank" rel="noopener">' +
          logoMarkup(r, 40) +
          '<span class="recent-name">' + esc(r.title) + "</span>" +
        "</a>" +
        '<button class="recent-save" type="button" data-save="' + esc(r.id) + '" ' +
          'aria-label="Save ' + esc(r.title) + ' to your vault">' +
          '<svg class="icon" aria-hidden="true"><use href="#i-heart"/></svg></button>' +
      "</div>";
    }).join("");
  }

  function renderSearches() {
    var list = readList(SEARCH_KEY);
    if (!list.length) { el.searchSection.hidden = true; return; }
    el.searchSection.hidden = false;

    el.savedSearches.innerHTML = list.map(function (entry, i) {
      var params = new URLSearchParams();
      if (entry.q) params.set("q", entry.q);
      var href = "/" + (params.toString() ? "?" + params.toString() : "") + "#resources";
      var filters = [entry.category, entry.price, entry.platform]
        .filter(function (v) { return v && v !== "all"; });

      return '<div class="saved-search">' +
        '<a class="saved-search-link" href="' + esc(href) + '">' +
          '<span class="saved-search-label">' + esc(entry.label || "Everything") + "</span>" +
          (filters.length
            ? '<span class="saved-search-filters">' + esc(filters.join(" · ")) + "</span>"
            : "") +
        "</a>" +
        '<button class="saved-search-remove" type="button" data-forget="' + i + '" ' +
          'aria-label="Forget the search &quot;' + esc(entry.label || "Everything") + '&quot;">' +
          '<svg class="icon" aria-hidden="true"><use href="#i-close"/></svg></button>' +
      "</div>";
    }).join("");
  }

  function renderAll() {
    var count = loadSaved();
    var missing = count - saved.length;

    if (!count && !readList(RECENT_KEY).length && !readList(SEARCH_KEY).length) {
      el.empty.hidden = false;
      el.body.hidden = true;
      el.summary.textContent = "Nothing saved yet.";
      return;
    }

    el.empty.hidden = true;
    el.body.hidden = false;

    var categoryCount = fillCategories();
    summarise(saved.length, categoryCount);

    /* A saved id whose record has since left the library. Say so rather than
       quietly showing a smaller number than the visitor remembers saving. */
    if (missing > 0) {
      el.summary.innerHTML += " <span class=\"vault-note\">" + missing +
        (missing === 1 ? " saved tool is" : " saved tools are") +
        " no longer in the library.</span>";
    }

    renderGrid();
    renderRecent();
    renderSearches();
  }

  /* ------------------------------------------------------------ actions -- */

  function setFavorites(ids) {
    writeList(FAV_KEY, ids);
    if (window.vaultChrome) window.vaultChrome.syncCount();
  }

  function status(message) {
    el.status.textContent = message;
    if (message) {
      clearTimeout(status._t);
      status._t = setTimeout(function () { el.status.textContent = ""; }, 5000);
    }
  }

  document.addEventListener("click", function (event) {
    var unsave = event.target.closest("[data-unsave]");
    if (unsave) {
      event.preventDefault();
      var dropId = unsave.dataset.unsave;
      setFavorites(readList(FAV_KEY).filter(function (x) { return x !== dropId; }));
      renderAll();
      status("Removed from your vault.");
      return;
    }

    var save = event.target.closest("[data-save]");
    if (save) {
      event.preventDefault();
      var addId = save.dataset.save;
      var ids = readList(FAV_KEY);
      if (ids.indexOf(addId) === -1) ids.push(addId);
      setFavorites(ids);
      renderAll();
      status("Saved to your vault.");
      return;
    }

    var forget = event.target.closest("[data-forget]");
    if (forget) {
      event.preventDefault();
      var list = readList(SEARCH_KEY);
      list.splice(Number(forget.dataset.forget), 1);
      writeList(SEARCH_KEY, list);
      renderSearches();
      return;
    }

    if (event.target.closest("[data-vault-reset]")) {
      el.search.value = "";
      el.category.value = "all";
      el.price.value = "all";
      renderGrid();
    }
  });

  [el.search, el.category, el.price].forEach(function (control) {
    control.addEventListener("input", renderGrid);
    control.addEventListener("change", renderGrid);
  });

  /* ------------------------------------------------------- export/import - */

  document.getElementById("exportVault").addEventListener("click", function () {
    var payload = {
      format: "thecreativevault.vault",
      version: 1,
      exported: new Date().toISOString(),
      favorites: readList(FAV_KEY),
      recent: readList(RECENT_KEY),
      searches: readList(SEARCH_KEY)
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "creative-vault-" + new Date().toISOString().slice(0, 10) + ".json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    status("Exported " + readList(FAV_KEY).length + " saved tools.");
  });

  var importFile = document.getElementById("importFile");
  document.getElementById("importVault").addEventListener("click", function () {
    importFile.click();
  });

  importFile.addEventListener("change", function () {
    var file = importFile.files && importFile.files[0];
    if (!file) return;
    var reader = new FileReader();

    reader.onload = function () {
      var data;
      try { data = JSON.parse(String(reader.result)); }
      catch (e) { status("That file is not valid JSON."); importFile.value = ""; return; }

      if (!data || data.format !== "thecreativevault.vault" || !Array.isArray(data.favorites)) {
        status("That does not look like a Creative Vault export.");
        importFile.value = "";
        return;
      }

      /* Merged, never replaced. An import that silently wiped what was
         already here would be the worst possible surprise on this page. */
      var before = readList(FAV_KEY);
      var merged = before.slice();
      data.favorites.forEach(function (id) {
        if (typeof id === "string" && merged.indexOf(id) === -1) merged.push(id);
      });
      setFavorites(merged);

      if (Array.isArray(data.searches)) {
        var searches = readList(SEARCH_KEY);
        data.searches.forEach(function (entry) {
          if (entry && entry.label && !searches.some(function (x) { return x.label === entry.label; })) {
            searches.push(entry);
          }
        });
        writeList(SEARCH_KEY, searches.slice(0, 20));
      }

      renderAll();
      status("Imported " + (merged.length - before.length) + " new tools, merged with the " +
             before.length + " already here.");
      importFile.value = "";
    };

    reader.readAsText(file);
  });

  /* Clearing everything is irreversible and there is no server copy, so it
     asks first — the one place on this site a dialog is the right call. */
  document.getElementById("clearVault").addEventListener("click", function () {
    if (typeof el.confirm.showModal === "function") el.confirm.showModal();
    else el.confirm.setAttribute("open", "");
  });
  document.getElementById("confirmCancel").addEventListener("click", function () {
    el.confirm.close();
  });
  document.getElementById("confirmClear").addEventListener("click", function () {
    [FAV_KEY, RECENT_KEY, SEARCH_KEY].forEach(function (key) {
      try { localStorage.removeItem(key); } catch (e) { /* private mode */ }
    });
    if (window.vaultChrome) window.vaultChrome.syncCount();
    el.confirm.close();
    renderAll();
    status("Your vault is empty.");
  });

  /* ------------------------------------------------------------- start --- */

  index();
  renderAll();

  /* Another tab saved or removed something. Follow it. */
  window.addEventListener("storage", function (event) {
    if ([FAV_KEY, RECENT_KEY, SEARCH_KEY].indexOf(event.key) !== -1) renderAll();
  });
})();
