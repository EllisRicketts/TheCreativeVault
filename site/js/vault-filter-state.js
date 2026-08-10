
(function () {
  const STATE_KEY = "vaultFilterState";

  const APP_ALIASES = {
    adobe: [
      "adobe", "photoshop", "illustrator", "premiere", "premiere pro", "after effects",
      "lightroom", "indesign", "acrobat", "audition", "animate", "dreamweaver",
      "substance", "substance 3d", "firefly", "adobe express", "behance", "creative cloud"
    ],
    autodesk: [
      "autodesk", "maya", "3ds max", "fusion 360", "autocad", "mudbox", "motionbuilder", "revit"
    ],
    blackmagic: [
      "blackmagic", "blackmagic design", "davinci", "davinci resolve", "fusion", "resolve"
    ],
    blender: [
      "blender", "blender foundation", "blender market", "blenderkit"
    ],
    unity: [
      "unity", "unity technologies", "unity asset store", "unity learn", "plastic scm"
    ],
    unreal: [
      "unreal", "unreal engine", "epic", "epic games", "fab", "megascans", "quixel", "metahuman"
    ],
    godot: [
      "godot", "godot engine", "godot foundation", "gdscript"
    ],
    figma: [
      "figma", "figjam", "figma community", "figma plugins"
    ],
    canva: [
      "canva", "canva pro", "canva free"
    ],
    google: [
      "google", "youtube", "firebase", "google fonts", "google maps", "material design",
      "google cloud", "gemini", "colab", "kaggle"
    ],
    microsoft: [
      "microsoft", "github", "vscode", "visual studio", "azure", "playfab", "xbox",
      "clipchamp", "fluent", "bing"
    ],
    maxon: [
      "maxon", "cinema 4d", "redshift", "zbrush", "red giant"
    ],
    openai: [
      "openai", "chatgpt", "gpt", "dall-e", "sora"
    ],
    notion: [
      "notion", "notion calendar", "notion templates"
    ],
    audio: [
      "audio", "daw", "music", "sound", "sample", "plugin", "vst", "synth", "mixing", "mastering"
    ]
  };

  const state = {
    query: "",
    category: "",
    collection: "",
    application: "",
    mode: "search",
    source: "",
    lastUpdated: 0,
    isApplying: false
  };

  function normalize(value) {
    return String(value || "").trim();
  }

  function normLower(value) {
    return normalize(value).toLowerCase();
  }

  function getResources() {
    if (typeof generatedResources !== "undefined" && Array.isArray(generatedResources)) return generatedResources;
    if (typeof resources !== "undefined" && Array.isArray(resources)) return resources;
    if (window.generatedResources && Array.isArray(window.generatedResources)) return window.generatedResources;
    if (window.resources && Array.isArray(window.resources)) return window.resources;
    return [];
  }

  function findSearchInput() {
    const selectors = [
      "#searchInput",
      "#resourceSearch",
      "#search",
      ".search-input",
      ".resource-search",
      "input[type='search']",
      "input[placeholder*='Search']",
      "input[placeholder*='search']"
    ];

    for (const selector of selectors) {
      const input = document.querySelector(selector);
      if (input) return input;
    }

    return null;
  }

  function getCards() {
    return Array.from(document.querySelectorAll(
      ".resource-card, .tool-card, .vault-resource-card, .card[data-resource], [data-resource], [data-title]"
    )).filter(card => !card.closest(".vault-nav-panel") && !card.closest(".creative-essentials-modal"));
  }

  function resourceHaystack(resource) {
    return [
      resource.id,
      resource.title,
      resource.shortName,
      resource.company,
      resource.website,
      resource.companyWebsite,
      resource.category,
      (resource.categories || []).join(" "),
      (resource.categoryIds || []).join(" "),
      (resource.subcategories || []).join(" "),
      (resource.tags || []).join(" "),
      (resource.integrations || []).join(" "),
      (resource.related || []).join(" "),
      (resource.alternatives || []).join(" "),
      (resource.competitors || []).join(" "),
      resource.type,
      resource.price,
      resource.pricingModel,
      resource.shortDescription,
      resource.longDescription,
      resource.description,
      (resource.bestFor || []).join(" "),
      (resource.platforms || []).join(" ")
    ].filter(Boolean).join(" ").toLowerCase();
  }

  function cardHaystack(card) {
    return [
      card.textContent,
      card.getAttribute("data-id"),
      card.getAttribute("data-resource"),
      card.getAttribute("data-company"),
      card.getAttribute("data-category"),
      card.getAttribute("data-categories"),
      card.getAttribute("data-tags"),
      card.getAttribute("data-title")
    ].filter(Boolean).join(" ").toLowerCase();
  }

  function aliasesFor(value) {
    const key = normLower(value);
    if (!key) return [];

    const direct = APP_ALIASES[key] || [];

    const partialKey = Object.keys(APP_ALIASES).find(name => key.includes(name) || name.includes(key));
    const partial = partialKey ? APP_ALIASES[partialKey] : [];

    return Array.from(new Set([key].concat(direct).concat(partial))).filter(Boolean);
  }

  function matchesAnyAlias(text, aliases) {
    if (!aliases.length) return false;
    const h = String(text || "").toLowerCase();
    return aliases.some(alias => h.includes(alias));
  }

  function resourceMatches(resource, filter) {
    const value = normalize(filter.value);
    const mode = filter.mode || "search";
    if (!value) return true;

    const haystack = resourceHaystack(resource);

    if (mode === "application") {
      return matchesAnyAlias(haystack, aliasesFor(value));
    }

    if (mode === "category") {
      const exactFields = [
        resource.category,
        ...(resource.categories || []),
        ...(resource.categoryIds || []),
        ...(resource.subcategories || [])
      ].map(normLower);

      const q = normLower(value);
      return exactFields.some(field => field === q || field.includes(q)) || haystack.includes(q);
    }

    if (mode === "collection") {
      const q = normLower(value);
      return haystack.includes(q);
    }

    return haystack.includes(normLower(value));
  }

  function cardMatches(card, filter) {
    const value = normalize(filter.value);
    if (!value) return true;

    const haystack = cardHaystack(card);

    if (filter.mode === "application") {
      return matchesAnyAlias(haystack, aliasesFor(value));
    }

    return haystack.includes(normLower(value));
  }

  function updateSearchInput(value) {
    const input = findSearchInput();
    if (!input) return;

    if (input.value !== value) input.value = value;

    ["input", "change", "search"].forEach(name => {
      input.dispatchEvent(new Event(name, { bubbles: true, cancelable: true }));
    });
  }

  function updateUrl(value, mode) {
    try {
      const url = new URL(window.location.href);
      if (value) {
        url.searchParams.set("q", value);
        url.searchParams.set("mode", mode || "search");
      } else {
        url.searchParams.delete("q");
        url.searchParams.delete("mode");
      }
      window.history.replaceState({}, "", url.toString());
    } catch (error) {}
  }

  function callSiteRender(value) {
    const names = [
      "filterResources",
      "renderResources",
      "updateResources",
      "searchResources",
      "applySearch",
      "applyFilter",
      "renderCards",
      "renderResourceCards"
    ];

    names.forEach(name => {
      if (typeof window[name] === "function") {
        try { window[name](value); } catch (error) {}
      }
    });
  }

  function fallbackCardFilter(filter) {
    const cards = getCards();
    if (!cards.length) return;

    cards.forEach(card => {
      const show = cardMatches(card, filter);
      card.style.display = show ? "" : "none";
      card.setAttribute("data-vault-filtered", show ? "visible" : "hidden");
    });
  }

  function updateResultStats(value, mode) {
    const cards = getCards();
    const visible = cards.filter(card => card.style.display !== "none").length;

    let badge = document.getElementById("vaultActiveFilterBadge");
    if (!badge) {
      badge = document.createElement("div");
      badge.id = "vaultActiveFilterBadge";
      badge.className = "vault-active-filter-badge";
      badge.innerHTML = `
        <span class="vault-active-filter-text"></span>
        <button class="vault-active-filter-clear" type="button" aria-label="Clear active filter">×</button>
      `;
      document.body.appendChild(badge);

      badge.querySelector("button").addEventListener("click", function () {
        window.clearVaultFilter("badge-clear");
      });
    }

    if (!value) {
      badge.classList.remove("is-visible");
      badge.querySelector(".vault-active-filter-text").textContent = "";
      return;
    }

    const label = mode === "application" ? "Application" : mode === "category" ? "Category" : "Active filter";
    badge.querySelector(".vault-active-filter-text").textContent =
      `${label}: ${value}${cards.length ? " · " + visible + " shown" : ""}`;

    badge.classList.add("is-visible");
  }

  function sameFilter(next) {
    return (
      normalize(next.query) === normalize(state.query) &&
      normalize(next.category) === normalize(state.category) &&
      normalize(next.collection) === normalize(state.collection) &&
      normalize(next.application) === normalize(state.application) &&
      normalize(next.mode) === normalize(state.mode)
    );
  }

  function effectiveFrom(nextState) {
    return nextState.application || nextState.category || nextState.collection || nextState.query || "";
  }

  function modeFrom(nextState) {
    if (nextState.application) return "application";
    if (nextState.category) return "category";
    if (nextState.collection) return "collection";
    return nextState.mode || "search";
  }

  function applyVaultFilter(next, options) {
    options = options || {};

    const nextState = {
      query: normalize(next && next.query),
      category: normalize(next && next.category),
      collection: normalize(next && next.collection),
      application: normalize(next && next.application),
      mode: normalize(next && next.mode) || "search",
      source: normalize(next && next.source) || "unknown"
    };

    if (nextState.application) {
      nextState.query = "";
      nextState.category = "";
      nextState.collection = "";
      nextState.mode = "application";
    }

    if (nextState.category) {
      nextState.query = "";
      nextState.collection = "";
      nextState.application = "";
      nextState.mode = "category";
    }

    if (nextState.collection) {
      nextState.query = "";
      nextState.category = "";
      nextState.application = "";
      nextState.mode = "collection";
    }

    const effectiveValue = effectiveFrom(nextState);
    const effectiveMode = modeFrom(nextState);

    if (state.isApplying && !options.force) return;

    if (sameFilter(nextState) && !options.force) {
      if (options.scroll !== false) scrollToResults();
      return;
    }

    state.isApplying = true;
    state.query = nextState.query;
    state.category = nextState.category;
    state.collection = nextState.collection;
    state.application = nextState.application;
    state.mode = effectiveMode;
    state.source = nextState.source;
    state.lastUpdated = Date.now();

    window[STATE_KEY] = { ...state };

    document.documentElement.setAttribute("data-vault-filter-source", state.source);
    document.documentElement.setAttribute("data-vault-filter-mode", effectiveMode);

    if (effectiveValue) {
      document.documentElement.setAttribute("data-vault-active-filter", effectiveValue);
    } else {
      document.documentElement.removeAttribute("data-vault-active-filter");
    }

    // Keep the visible search box understandable, but do not rely on it for app ecosystem filtering.
    updateSearchInput(effectiveValue);

    // Let native code try first.
    callSiteRender(effectiveValue);

    setTimeout(function () {
      fallbackCardFilter({ value: effectiveValue, mode: effectiveMode });
      updateResultStats(effectiveValue, effectiveMode);
      updateUrl(effectiveValue, effectiveMode);

      window.dispatchEvent(new CustomEvent("vault:filter:applied", {
        detail: {
          state: { ...state },
          value: effectiveValue,
          mode: effectiveMode,
          aliases: effectiveMode === "application" ? aliasesFor(effectiveValue) : []
        }
      }));

      if (options.scroll !== false) scrollToResults();

      state.isApplying = false;
    }, 60);
  }

  function clearVaultFilter(source) {
    state.isApplying = true;

    state.query = "";
    state.category = "";
    state.collection = "";
    state.application = "";
    state.mode = "search";
    state.source = source || "clear";
    state.lastUpdated = Date.now();

    const input = findSearchInput();
    if (input) {
      input.value = "";
      ["input", "change", "search"].forEach(name => {
        input.dispatchEvent(new Event(name, { bubbles: true, cancelable: true }));
      });
    }

    getCards().forEach(card => {
      card.style.display = "";
      card.setAttribute("data-vault-filtered", "visible");
    });

    updateResultStats("", "search");
    updateUrl("", "search");

    document.documentElement.removeAttribute("data-vault-active-filter");
    document.documentElement.removeAttribute("data-vault-filter-mode");

    setTimeout(function () {
      state.isApplying = false;
      scrollToResults();
    }, 80);
  }

  function scrollToResults() {
    const target =
      document.querySelector("#resources") ||
      document.querySelector(".resources-grid") ||
      document.querySelector(".resource-grid") ||
      document.querySelector("main") ||
      document.body;

    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function bindNativeSearch() {
    const input = findSearchInput();
    if (!input || input.dataset.vaultStateBound === "true") return;

    input.dataset.vaultStateBound = "true";

    input.addEventListener("input", function () {
      if (state.isApplying) return;

      const value = normalize(input.value);
      if (!value) {
        clearVaultFilter("search-cleared");
        return;
      }

      applyVaultFilter({
        query: value,
        mode: "search",
        source: "manual-search"
      }, { scroll: false });
    });
  }

  function bootFromUrl() {
    try {
      const url = new URL(window.location.href);
      const q = normalize(url.searchParams.get("q"));
      const mode = normalize(url.searchParams.get("mode")) || "search";

      if (q) {
        setTimeout(function () {
          if (mode === "application") {
            applyVaultFilter({ application: q, source: "url" }, { force: true, scroll: false });
          } else if (mode === "category") {
            applyVaultFilter({ category: q, source: "url" }, { force: true, scroll: false });
          } else if (mode === "collection") {
            applyVaultFilter({ collection: q, source: "url" }, { force: true, scroll: false });
          } else {
            applyVaultFilter({ query: q, source: "url" }, { force: true, scroll: false });
          }
        }, 200);
      }
    } catch (error) {}
  }

  window.applyVaultFilter = applyVaultFilter;
  window.clearVaultFilter = clearVaultFilter;
  window.getVaultFilterState = function () { return { ...state }; };
  window.getVaultApplicationAliases = aliasesFor;

  document.addEventListener("DOMContentLoaded", function () {
    bindNativeSearch();
    bootFromUrl();
    setTimeout(bindNativeSearch, 500);
    setTimeout(bindNativeSearch, 1200);
  });
})();
