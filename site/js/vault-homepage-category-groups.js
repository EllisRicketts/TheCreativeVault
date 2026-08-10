
(function () {
  const GROUPS = [
    {
      title: "Creative",
      terms: ["Design", "Digital Art", "Graphic Design", "Illustration", "Typography", "Icons", "Templates", "Vector Graphics", "Raster Graphics", "Drawing", "Digital Painting", "Publishing", "Print Design", "Font Library", "Color Tools"]
    },
    {
      title: "Media",
      terms: ["Photography", "Video", "Film", "Film Editing", "Video Editing", "Video Encoding", "Video Review", "Video Utility", "Video Workflow", "VFX", "Motion Graphics", "Audio", "DAW", "Podcasting", "Color Grading"]
    },
    {
      title: "3D & CAD",
      terms: ["3D", "3D Modeling", "Animation", "Rendering", "Digital Sculpting", "Surface Modeling", "CAD", "Drafting", "BIM", "Architecture", "Industrial Design", "Infrastructure", "Infrastructure Design", "Reality Capture", "LiDAR", "Simulation", "Visual Scripting"]
    },
    {
      title: "AI",
      terms: ["AI", "AI Tools", "Generative AI", "AI Image Generation", "AI Photo Tools", "AI Audio", "AI Research", "AI Writing", "Automation", "Prompting"]
    },
    {
      title: "Software & Apps",
      terms: ["Software", "Software Management", "Creative Cloud", "Digital Asset Management", "Data Management", "Databases", "Office Suite", "Word Processing", "Spreadsheets", "Presentations", "Document Editing", "Document Viewer", "Formula Editing"]
    },
    {
      title: "Business",
      terms: ["Business", "Freelancing", "Grants", "Marketplaces", "Marketing", "CRM", "Legal", "Funding", "Studio Management", "Enterprise Workflow", "Photography Business"]
    },
    {
      title: "Learning & Research",
      terms: ["Learning", "Education", "Research", "Reference", "Books", "Courses", "Tutorials", "Creative Essentials", "Creative Community"]
    },
    {
      title: "Assets & Resources",
      terms: ["Assets", "Public Domain", "Stock Assets", "Stock Photography", "Textures", "Fonts", "Models", "SFX", "Music", "Utilities", "Image Tools"]
    },
    {
      title: "Game & Realtime",
      terms: ["Game Dev", "Game Art", "Real-Time Graphics", "Interactive Animation", "Immersive Media", "Live Production", "Switcher Control", "Broadcast"]
    }
  ];

  function getResources() {
    if (typeof generatedResources !== "undefined" && Array.isArray(generatedResources)) return generatedResources;
    if (window.generatedResources && Array.isArray(window.generatedResources)) return window.generatedResources;
    return [];
  }

  function haystack(resource) {
    return [
      resource.title,
      resource.company,
      resource.category,
      (resource.categories || []).join(" "),
      (resource.categoryIds || []).join(" "),
      (resource.subcategories || []).join(" "),
      (resource.tags || []).join(" "),
      resource.type,
      resource.shortDescription,
      resource.longDescription
    ].filter(Boolean).join(" ").toLowerCase();
  }

  function countForTerm(term) {
    const q = String(term || "").toLowerCase();
    return getResources().filter(function (resource) {
      return haystack(resource).includes(q);
    }).length;
  }

  function groupCount(group) {
    const resources = getResources();
    return resources.filter(function (resource) {
      const text = haystack(resource);
      return group.terms.some(function (term) {
        return text.includes(String(term).toLowerCase());
      });
    }).length;
  }

  function applyFilter(term) {
    if (typeof window.applyVaultFilter === "function") {
      window.applyVaultFilter({ category: term, source: "homepage-category-group" }, { force: false, scroll: true });
      return;
    }

    const search = document.querySelector("input[type='search'], #searchInput, #search, .search-input");
    if (search) {
      search.value = term;
      search.dispatchEvent(new Event("input", { bubbles: true }));
      search.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  function findCategoryGrid() {
    const candidates = Array.from(document.querySelectorAll("section, div")).filter(function (el) {
      if (el.closest(".vault-nav-panel")) return false;
      const text = (el.textContent || "").toLowerCase();
      const cardCount = el.querySelectorAll(".category-card, [data-category], .vault-category-card, .card").length;
      const hasKnownCategory = text.includes("digital art") && text.includes("software") && text.includes("learning");
      return cardCount >= 20 && hasKnownCategory;
    });

    return candidates.sort(function (a, b) {
      return b.querySelectorAll(".category-card, [data-category], .vault-category-card, .card").length -
             a.querySelectorAll(".category-card, [data-category], .vault-category-card, .card").length;
    })[0] || null;
  }

  function buildGroupedHomeCategories() {
    const original = findCategoryGrid();
    if (!original || original.dataset.vaultGroupedReplaced === "true") return;

    original.dataset.vaultGroupedReplaced = "true";
    original.classList.add("vault-original-category-grid-hidden");

    const wrapper = document.createElement("section");
    wrapper.className = "vault-home-category-groups";
    wrapper.innerHTML = `
      <div class="vault-home-category-groups-header">
        <p class="vault-home-eyebrow">BROWSE THE VAULT</p>
        <h2>Categories</h2>
        <p>Grouped into cleaner hubs so the homepage stays usable as the database grows.</p>
      </div>
      <div class="vault-home-accordion"></div>
    `;

    const accordion = wrapper.querySelector(".vault-home-accordion");

    GROUPS.forEach(function (group, index) {
      const terms = group.terms
        .map(function (term) {
          return { term: term, count: countForTerm(term) };
        })
        .filter(function (item) {
          return item.count > 0;
        })
        .sort(function (a, b) {
          return b.count - a.count || a.term.localeCompare(b.term);
        });

      if (!terms.length) return;

      const details = document.createElement("details");
      details.className = "vault-home-category-group";
      if (index < 3) details.open = true;

      details.innerHTML = `
        <summary>
          <span>${group.title}</span>
          <em>${groupCount(group)} resources</em>
        </summary>
        <div class="vault-home-category-pill-grid">
          ${terms.map(function (item) {
            return `
              <button type="button" class="vault-home-category-pill" data-term="${item.term}">
                <strong>${item.term}</strong>
                <span>${item.count} resources</span>
              </button>
            `;
          }).join("")}
        </div>
      `;

      accordion.appendChild(details);
    });

    wrapper.querySelectorAll("[data-term]").forEach(function (button) {
      button.addEventListener("click", function () {
        applyFilter(button.getAttribute("data-term") || "");
      });
    });

    original.parentNode.insertBefore(wrapper, original);
  }

  function removeSymbolsFromRemainingCards() {
    document.querySelectorAll(".category-card, [data-category], .vault-category-card").forEach(function (card) {
      Array.from(card.children).forEach(function (child) {
        const text = (child.textContent || "").trim();
        const hasIconClass = /icon|symbol|emoji|glyph/i.test(child.className || "");
        const isTinyIcon = text.length <= 3 && /[◆◇◈⬡⬢★⭐🔥🎨🎬🎵🧠📚💼🛠️▣▢]/.test(text);
        if (hasIconClass || isTinyIcon) {
          child.style.display = "none";
        }
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    setTimeout(function () {
      buildGroupedHomeCategories();
      removeSymbolsFromRemainingCards();
    }, 300);

    setTimeout(function () {
      buildGroupedHomeCategories();
      removeSymbolsFromRemainingCards();
    }, 1000);
  });
})();
