
(function () {
  const GROUPS = [
    {
      title: "Creative",
      description: "Design, visual art, branding, typography, publishing, and creative production.",
      terms: [
        "Design", "Digital Art", "Art", "Illustration", "Graphic Design", "Typography",
        "Branding", "UI Design", "UX", "Publishing", "Print Design", "Templates",
        "Icons", "Color Tools", "Vector Graphics", "Raster Graphics"
      ]
    },
    {
      title: "Media",
      description: "Photography, video, film, audio, podcasting, streaming, and post-production.",
      terms: [
        "Photography", "Video", "Film", "VFX", "Motion Graphics", "Audio",
        "Music", "Podcasting", "Streaming", "Broadcast", "Color Grading",
        "Photo Editing", "Video Editing", "Stock Photography"
      ]
    },
    {
      title: "3D & CAD",
      description: "3D, modeling, rendering, CAD, architecture, product design, and realtime production.",
      terms: [
        "3D", "3D Modeling", "Animation", "Rendering", "Digital Sculpting",
        "CAD", "BIM", "Architecture", "Product Design", "Game Art",
        "Materials", "Textures", "Photogrammetry", "Reality Capture"
      ]
    },
    {
      title: "AI",
      description: "AI tools for images, video, audio, writing, coding, research, and automation.",
      terms: [
        "AI Tools", "AI", "Generative AI", "AI Image Generation", "AI Video",
        "AI Audio", "AI Writing", "AI Research", "AI Photo Tools", "Automation",
        "Agents", "Prompting", "Machine Learning"
      ]
    },
    {
      title: "Development",
      description: "Code, web, apps, games, hosting, APIs, open source, and technical utilities.",
      terms: [
        "Coding", "Development", "Web", "Web Development", "Game Dev",
        "Programming", "APIs", "Databases", "Hosting", "Open Source",
        "Git", "Dev Tools", "Software"
      ]
    },
    {
      title: "Business",
      description: "Freelancing, grants, marketplaces, marketing, legal, CRM, sales, and money tools.",
      terms: [
        "Business", "Freelancing", "Marketplaces", "Grants", "Funding",
        "Marketing", "CRM", "Accounting", "Legal", "Sales", "Creator Economy",
        "Content Creation", "Photography Business"
      ]
    },
    {
      title: "Learning",
      description: "Courses, tutorials, books, references, documentation, and education platforms.",
      terms: [
        "Learning", "Education", "Courses", "Tutorials", "Books",
        "Documentation", "Reference", "Research", "Photography Education",
        "3D Learning", "Creative YouTube Education"
      ]
    },
    {
      title: "Assets",
      description: "Free and paid creative assets, public domain archives, fonts, textures, and media.",
      terms: [
        "Assets", "Public Domain", "Fonts", "Textures", "Stock Assets",
        "Stock Photography", "Icons", "Vectors", "Brushes", "HDRI",
        "Models", "SFX", "Music", "Templates"
      ]
    },
    {
      title: "Utilities",
      description: "Converters, PDF tools, file utilities, accessibility tools, and everyday helpers.",
      terms: [
        "Utilities", "PDF Tools", "File Conversion", "Accessibility",
        "Color Accessibility", "Image Tools", "Productivity", "Office Suite",
        "Spreadsheets", "Presentations", "Word Processing"
      ]
    }
  ];

  function getResources() {
    if (typeof generatedResources !== "undefined" && Array.isArray(generatedResources)) return generatedResources;
    if (window.generatedResources && Array.isArray(window.generatedResources)) return window.generatedResources;
    if (typeof resources !== "undefined" && Array.isArray(resources)) return resources;
    if (window.resources && Array.isArray(window.resources)) return window.resources;
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
    if (!q) return 0;

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

  function termExists(term) {
    return countForTerm(term) > 0;
  }

  function apply(term, mode) {
    if (typeof window.applyVaultFilter === "function") {
      const payload = { source: "grouped-navigation" };

      if (mode === "category") payload.category = term;
      else if (mode === "collection") payload.collection = term;
      else payload.query = term;

      window.applyVaultFilter(payload, { force: false, scroll: true });
    } else {
      const search = document.querySelector("input[type='search'], #searchInput, #search, .search-input");
      if (search) {
        search.value = term;
        search.dispatchEvent(new Event("input", { bubbles: true }));
        search.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }
  }

  function closePanel(panel) {
    if (panel) panel.classList.remove("is-open");
  }

  function renderGroupedCategories() {
    let panel = document.getElementById("vaultGroupedCategoriesPanel");

    if (!panel) {
      panel = document.createElement("section");
      panel.id = "vaultGroupedCategoriesPanel";
      panel.className = "vault-nav-panel vault-grouped-panel";
      panel.innerHTML = `
        <div class="vault-nav-panel-inner vault-grouped-inner">
          <button class="vault-nav-panel-close" type="button" aria-label="Close">×</button>
          <p class="vault-nav-panel-eyebrow">THE CREATIVE VAULT</p>
          <h2>Browse</h2>
          <p class="vault-nav-panel-intro">Categories are grouped into cleaner hubs so the Vault stays easy to use as it grows.</p>
          <div class="vault-grouped-layout">
            <aside class="vault-grouped-sidebar"></aside>
            <main class="vault-grouped-content"></main>
          </div>
        </div>
      `;
      document.body.appendChild(panel);

      panel.querySelector(".vault-nav-panel-close").addEventListener("click", function () {
        closePanel(panel);
      });

      panel.addEventListener("click", function (event) {
        if (event.target === panel) closePanel(panel);
      });
    }

    const sidebar = panel.querySelector(".vault-grouped-sidebar");
    const content = panel.querySelector(".vault-grouped-content");

    sidebar.innerHTML = GROUPS.map(function (group, index) {
      return `
        <button class="vault-group-tab ${index === 0 ? "is-active" : ""}" type="button" data-group-index="${index}">
          <strong>${group.title}</strong>
          <span>${groupCount(group)} resources</span>
        </button>
      `;
    }).join("");

    function renderGroup(index) {
      const group = GROUPS[index];
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

      content.innerHTML = `
        <div class="vault-group-header">
          <h3>${group.title}</h3>
          <p>${group.description}</p>
          <button class="vault-group-show-all" type="button" data-term="${group.title}">Show all ${group.title}</button>
        </div>
        <div class="vault-group-term-grid">
          ${terms.map(function (item) {
            return `
              <button class="vault-group-term" type="button" data-term="${item.term}">
                <strong>${item.term}</strong>
                <span>${item.count} resources</span>
              </button>
            `;
          }).join("")}
        </div>
      `;

      content.querySelector(".vault-group-show-all").addEventListener("click", function () {
        closePanel(panel);
        apply(group.title, "collection");
      });

      content.querySelectorAll(".vault-group-term").forEach(function (button) {
        button.addEventListener("click", function () {
          closePanel(panel);
          apply(button.getAttribute("data-term") || "", "category");
        });
      });
    }

    sidebar.querySelectorAll(".vault-group-tab").forEach(function (button) {
      button.addEventListener("click", function () {
        sidebar.querySelectorAll(".vault-group-tab").forEach(function (b) {
          b.classList.remove("is-active");
        });
        button.classList.add("is-active");
        renderGroup(Number(button.getAttribute("data-group-index") || 0));
      });
    });

    renderGroup(0);
    panel.classList.add("is-open");
  }

  function renderApplicationsMega() {
    let panel = document.getElementById("vaultApplicationsPanelV36");

    const groups = [
      {
        title: "Adobe",
        terms: ["Adobe", "Photoshop", "Illustrator", "InDesign", "Premiere Pro", "After Effects", "Lightroom", "Audition", "Firefly", "Substance 3D", "Frame.io"]
      },
      {
        title: "Autodesk",
        terms: ["Autodesk", "Maya", "3ds Max", "AutoCAD", "Fusion", "Inventor", "Revit", "Civil 3D", "MotionBuilder", "Mudbox", "Arnold"]
      },
      {
        title: "Avid",
        terms: ["Avid", "Pro Tools", "Media Composer", "Sibelius", "VENUE", "NEXIS"]
      },
      {
        title: "Office",
        terms: ["LibreOffice", "Microsoft", "Google Workspace", "Apple iWork", "ONLYOFFICE", "WPS Office"]
      },
      {
        title: "Video & 3D",
        terms: ["Blackmagic Design", "DaVinci Resolve", "Blender", "Maxon", "Cinema 4D", "ZBrush", "Redshift", "Affinity"]
      },
      {
        title: "Game & Realtime",
        terms: ["Epic Games", "Unreal", "Unity", "Godot", "Blender", "Fab", "Quixel"]
      }
    ];

    if (!panel) {
      panel = document.createElement("section");
      panel.id = "vaultApplicationsPanelV36";
      panel.className = "vault-nav-panel vault-grouped-panel";
      panel.innerHTML = `
        <div class="vault-nav-panel-inner vault-grouped-inner">
          <button class="vault-nav-panel-close" type="button" aria-label="Close">×</button>
          <p class="vault-nav-panel-eyebrow">THE CREATIVE VAULT</p>
          <h2>Applications</h2>
          <p class="vault-nav-panel-intro">Software ecosystems grouped by company and workflow. Click a company for the whole ecosystem or a product for a tighter filter.</p>
          <div class="vault-app-mega-grid"></div>
        </div>
      `;
      document.body.appendChild(panel);

      panel.querySelector(".vault-nav-panel-close").addEventListener("click", function () {
        closePanel(panel);
      });

      panel.addEventListener("click", function (event) {
        if (event.target === panel) closePanel(panel);
      });
    }

    const grid = panel.querySelector(".vault-app-mega-grid");
    grid.innerHTML = groups.map(function (group) {
      return `
        <section class="vault-app-group">
          <button class="vault-app-group-title" type="button" data-app="${group.title}">
            ${group.title}
          </button>
          <div>
            ${group.terms.map(function (term) {
              return `<button class="vault-app-pill" type="button" data-app="${term}">${term}</button>`;
            }).join("")}
          </div>
        </section>
      `;
    }).join("");

    grid.querySelectorAll("[data-app]").forEach(function (button) {
      button.addEventListener("click", function () {
        closePanel(panel);
        const term = button.getAttribute("data-app") || "";
        if (typeof window.applyVaultFilter === "function") {
          window.applyVaultFilter({ application: term, source: "applications-mega-menu" }, { force: false, scroll: true });
        } else {
          apply(term, "search");
        }
      });
    });

    panel.classList.add("is-open");
  }

  document.addEventListener("DOMContentLoaded", function () {
    document.querySelectorAll("[data-vault-nav='categories']").forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        renderGroupedCategories();
      }, true);
    });

    document.querySelectorAll("[data-vault-nav='applications']").forEach(function (button) {
      button.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopImmediatePropagation();
        renderApplicationsMega();
      }, true);
    });

    // Clean up visible symbols/emojis in top nav labels without changing behavior.
    document.querySelectorAll(".vault-platform-nav button, .vault-platform-nav a").forEach(function (item) {
      item.textContent = (item.textContent || "")
        .replace(/[★⭐🔥🎨🎬🎵🧠📚💼🛠️]/g, "")
        .replace(/\s+/g, " ")
        .trim();
    });
  });
})();
