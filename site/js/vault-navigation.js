
(function () {
  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
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

  function triggerSearchEvents(input, value) {
    if (!input) return false;

    input.focus();
    input.value = value;

    const events = [
      "input",
      "keyup",
      "keydown",
      "change",
      "search"
    ];

    events.forEach(function (name) {
      input.dispatchEvent(new Event(name, { bubbles: true, cancelable: true }));
    });

    input.dispatchEvent(new KeyboardEvent("keyup", {
      key: "Enter",
      code: "Enter",
      bubbles: true,
      cancelable: true
    }));

    return true;
  }

  function clickExistingCategoryControl(value) {
    const wanted = String(value || "").trim().toLowerCase();
    if (!wanted) return false;

    const controls = Array.from(document.querySelectorAll(
      "button, a, [role='button'], option, input[type='checkbox'], input[type='radio']"
    ));

    const match = controls.find(function (el) {
      if (el.closest(".vault-nav-panel")) return false;

      const text = [
        el.textContent,
        el.value,
        el.getAttribute("data-category"),
        el.getAttribute("data-filter"),
        el.getAttribute("data-value"),
        el.getAttribute("aria-label")
      ].filter(Boolean).join(" ").trim().toLowerCase();

      return text === wanted || text.includes(wanted);
    });

    if (!match) return false;

    if (match.tagName === "OPTION" && match.parentElement) {
      match.parentElement.value = match.value;
      match.parentElement.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }

    if (match.type === "checkbox" || match.type === "radio") {
      match.checked = true;
      match.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }

    match.click();
    return true;
  }

  function callKnownRenderFunctions(value) {
    const possibleNames = [
      "filterResources",
      "renderResources",
      "updateResources",
      "searchResources",
      "applySearch",
      "applyFilter",
      "renderCards",
      "renderResourceCards"
    ];

    let called = false;

    possibleNames.forEach(function (name) {
      if (typeof window[name] === "function") {
        try {
          window[name](value);
          called = true;
        } catch (error) {}
      }
    });

    return called;
  }

  function manualFilterCards(value) {
    const term = String(value || "").trim().toLowerCase();
    if (!term) return false;

    const cards = Array.from(document.querySelectorAll(
      ".resource-card, .tool-card, .card, [data-resource], [data-title]"
    ));

    if (!cards.length) return false;

    let visibleCount = 0;

    cards.forEach(function (card) {
      if (card.closest(".vault-nav-panel")) return;

      const text = [
        card.textContent,
        card.getAttribute("data-category"),
        card.getAttribute("data-categories"),
        card.getAttribute("data-tags"),
        card.getAttribute("data-title")
      ].filter(Boolean).join(" ").toLowerCase();

      const isMatch = text.includes(term);
      card.style.display = isMatch ? "" : "none";
      if (isMatch) visibleCount += 1;
    });

    document.documentElement.setAttribute("data-vault-active-filter", value);
    return visibleCount > 0;
  }

  function applyVaultFilter(value) {
    const clean = String(value || "").trim();
    if (!clean) return;

    window.vaultActiveFilter = clean;

    try {
      const url = new URL(window.location.href);
      url.searchParams.set("q", clean);
      window.history.replaceState({}, "", url.toString());
    } catch (error) {}

    const input = findSearchInput();
    triggerSearchEvents(input, clean);

    // Try app-native render/search functions first.
    callKnownRenderFunctions(clean);

    // Try clicking a real existing category filter if the page has one.
    clickExistingCategoryControl(clean);

    // Dispatch a custom event so any future script can hook into this cleanly.
    window.dispatchEvent(new CustomEvent("vault:filter", {
      detail: {
        value: clean,
        source: "top-navigation"
      }
    }));

    // Last fallback: directly hide/show cards if the app search does not react.
    setTimeout(function () {
      triggerSearchEvents(input, clean);
      callKnownRenderFunctions(clean);
      manualFilterCards(clean);
    }, 80);

    setTimeout(function () {
      const target =
        document.querySelector("#resources") ||
        document.querySelector(".resources-grid") ||
        document.querySelector(".resource-grid") ||
        document.querySelector("main") ||
        document.body;

      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function normalizeName(value) {
    return String(value || "").trim();
  }

  function getCategoryList() {
    const map = new Map();

    getResources().forEach(function (resource) {
      const names = [];

      if (resource.category) names.push(resource.category);
      if (Array.isArray(resource.categories)) {
        resource.categories.forEach(function (name) {
          names.push(name);
        });
      }

      names.forEach(function (name) {
        const clean = normalizeName(name);
        if (!clean) return;

        const key = clean.toLowerCase();
        if (!map.has(key)) {
          map.set(key, { title: clean, count: 0 });
        }
        map.get(key).count += 1;
      });
    });

    return Array.from(map.values()).sort(function (a, b) {
      return a.title.localeCompare(b.title);
    });
  }

  function getCompanyList(limit) {
    const map = new Map();

    getResources().forEach(function (resource) {
      const company = normalizeName(resource.company);
      if (!company) return;

      const key = company.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { title: company, count: 0 });
      }
      map.get(key).count += 1;
    });

    return Array.from(map.values())
      .sort(function (a, b) {
        return b.count - a.count || a.title.localeCompare(b.title);
      })
      .slice(0, limit || 60);
  }

  function getCollectionList() {
    const names = [
      "Creative Essentials",
      "Free",
      "Open Source",
      "AI",
      "Game Dev",
      "Learning",
      "Public Domain",
      "Content Creation",
      "Creator Tools",
      "Business",
      "Assets",
      "3D",
      "Video",
      "Audio",
      "Marketing",
      "Typography",
      "Accessibility"
    ];

    return names.map(function (title) {
      const count = getResources().filter(function (resource) {
        const haystack = [
          resource.category,
          (resource.categories || []).join(" "),
          (resource.categoryIds || []).join(" "),
          (resource.subcategories || []).join(" "),
          (resource.tags || []).join(" "),
          resource.price,
          resource.pricingModel,
          resource.type
        ].join(" ").toLowerCase();

        return haystack.includes(title.toLowerCase());
      }).length;

      return { title: title, count: count };
    }).filter(function (item) {
      return item.count > 0;
    });
  }

  function ensurePanel(id, title, intro, cards) {
    let panel = document.getElementById(id);

    if (!panel) {
      panel = document.createElement("section");
      panel.id = id;
      panel.className = "vault-nav-panel";
      panel.innerHTML = `
        <div class="vault-nav-panel-inner">
          <button class="vault-nav-panel-close" type="button" aria-label="Close">×</button>
          <p class="vault-nav-panel-eyebrow">THE CREATIVE VAULT</p>
          <h2></h2>
          <p class="vault-nav-panel-intro"></p>
          <div class="vault-nav-panel-grid"></div>
        </div>
      `;
      document.body.appendChild(panel);

      panel.querySelector(".vault-nav-panel-close").addEventListener("click", function () {
        panel.classList.remove("is-open");
      });

      panel.addEventListener("click", function (event) {
        if (event.target === panel) {
          panel.classList.remove("is-open");
        }
      });
    }

    panel.querySelector("h2").textContent = title;
    panel.querySelector(".vault-nav-panel-intro").textContent = intro;

    const grid = panel.querySelector(".vault-nav-panel-grid");

    if (!cards.length) {
      grid.innerHTML = `<div class="vault-nav-panel-empty">No matching items were found yet.</div>`;
    } else {
      grid.innerHTML = cards.map(function (card) {
        const count = typeof card.count === "number" ? `<em>${card.count} resources</em>` : "";
        return `
          <button class="vault-nav-panel-card" type="button" data-search="${String(card.search || card.title).replace(/"/g, "&quot;")}" data-mode="${card.mode || "search"}">
            <strong>${card.title}</strong>
            <span>${card.text || "Browse resources"}</span>
            ${count}
          </button>
        `;
      }).join("");
    }

    grid.querySelectorAll("[data-search]").forEach(function (button) {
      button.addEventListener("click", function () {
        const term = button.getAttribute("data-search") || "";
        panel.classList.remove("is-open");
        applyVaultFilter(term);
      });
    });

    panel.classList.add("is-open");
  }

  function openCategories() {
    const categories = getCategoryList();

    ensurePanel(
      "vaultCategoriesPanel",
      "Browse Categories",
      "These categories come from your live database. Clicking one now applies it to the resource results.",
      categories.map(function (category) {
        return {
          title: category.title,
          text: "Filter resources by " + category.title,
          search: category.title,
          mode: "category",
          count: category.count
        };
      })
    );
  }

  function openApplications() {
    const companies = getCompanyList(60);

    ensurePanel(
      "vaultApplicationsPanel",
      "Applications",
      "Top companies and software ecosystems pulled from the live database.",
      companies.map(function (company) {
        return {
          title: company.title,
          text: "Filter resources by " + company.title,
          search: company.title,
          mode: "application",
          count: company.count
        };
      })
    );
  }

  function openCollections() {
    const collections = getCollectionList();

    ensurePanel(
      "vaultCollectionsPanel",
      "Collections",
      "Curated resource groups based on tags, categories, pricing, and resource types.",
      collections.map(function (collection) {
        return {
          title: collection.title,
          text: "Filter by " + collection.title,
          search: collection.title,
          mode: "collection",
          count: collection.count
        };
      })
    );
  }

  function openRecentlyAdded() {
    const recent = getResources()
      .slice()
      .sort(function (a, b) {
        return String(b.dateAdded || b.lastReviewed || "").localeCompare(String(a.dateAdded || a.lastReviewed || ""));
      })
      .slice(0, 40);

    ensurePanel(
      "vaultRecentPanel",
      "Recently Added",
      "Latest resources based on dateAdded or lastReviewed metadata.",
      recent.map(function (resource) {
        return {
          title: resource.title,
          text: resource.shortDescription || resource.category || "Recently added resource",
          search: resource.title
        };
      })
    );
  }

  function openSubmit() {
    const form = document.querySelector("#submit, .submit-resource, .submission-form, form");

    if (form) {
      form.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    ensurePanel(
      "vaultSubmitPanel",
      "Submit a Resource",
      "A dedicated submission form can be added next. For now, this opens the contribution doorway.",
      [
        { title: "Suggest a Tool", text: "Find submission-related resources", search: "submit resource" },
        { title: "Creative Essentials", text: "Check the essentials first", search: "Creative Essentials" }
      ]
    );
  }

  ready(function () {
    document.querySelectorAll("[data-vault-nav]").forEach(function (button) {
      button.addEventListener("click", function () {
        const key = button.getAttribute("data-vault-nav");

        if (key === "home") return scrollToTop();
        if (key === "categories") return openCategories();
        if (key === "applications") return openApplications();
        if (key === "collections") return openCollections();
        if (key === "recently-added") return openRecentlyAdded();
        if (key === "submit") return openSubmit();
      });
    });
  });
})();


/* V31 bridge: route navigation panel clicks through typed central filter modes */
(function () {
  document.addEventListener("click", function (event) {
    const panelCard = event.target.closest && event.target.closest(".vault-nav-panel-card[data-search]");
    if (!panelCard) return;

    const term = panelCard.getAttribute("data-search") || "";
    const mode = panelCard.getAttribute("data-mode") || "search";
    if (!term) return;

    event.preventDefault();
    event.stopPropagation();

    const panel = panelCard.closest(".vault-nav-panel");
    if (panel) panel.classList.remove("is-open");

    if (typeof window.applyVaultFilter === "function") {
      const payload = { source: "top-navigation" };

      if (mode === "application") payload.application = term;
      else if (mode === "category") payload.category = term;
      else if (mode === "collection") payload.collection = term;
      else payload.query = term;

      window.applyVaultFilter(payload, {
        force: false,
        scroll: true
      });
    }
  }, true);
})();
