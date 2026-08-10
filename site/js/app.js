const searchInput = document.getElementById("searchInput");
const categoryFilter = document.getElementById("categoryFilter");
const priceFilter = document.getElementById("priceFilter");
const platformFilter = document.getElementById("platformFilter");
const sortFilter = document.getElementById("sortFilter");
const resourceGrid = document.getElementById("resourceGrid");
const categoryGrid = document.getElementById("categoryGrid");
const collectionGrid = document.getElementById("collectionGrid");
const resourceCount = document.getElementById("resourceCount");
const categoryCount = document.getElementById("categoryCount");
const featuredCount = document.getElementById("featuredCount");
const resultSummary = document.getElementById("resultSummary");
const emptyState = document.getElementById("emptyState");
const resourceModal = document.getElementById("resourceModal");
const modalContent = document.getElementById("modalContent");
const modalClose = document.getElementById("modalClose");

let activeCollection = "all";
let favoriteIds = new Set();

function getLogoUrl(resource) {
  if (resource.logo) {
    return resource.logo;
  }

  try {
    const domain = new URL(resource.website).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  } catch (error) {
    return "";
  }
}

function getInitials(title) {
  return title
    .split(" ")
    .map(word => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function createStars(rating) {
  const roundedRating = Math.round(Number(rating));
  const fullStars = Math.max(0, Math.min(5, roundedRating));
  const emptyStars = 5 - fullStars;
  return "★".repeat(fullStars) + "☆".repeat(emptyStars);
}

function getDescription(resource) {
  return resource.shortDescription || resource.description || resource.longDescription || "";
}

function safeInitials(title) {
  return getInitials(title).replace(/'/g, "");
}

function createBadgeList(items) {
  return (items || []).map(item => `<span class="vault-badge">${item}</span>`).join("");
}

function getResourceCategories(resource) {
  const categories = [
    resource.primaryCategory,
    resource.category,
    ...(resource.categories || [])
  ];

  return [...new Set(categories.filter(Boolean))];
}

function getPrimaryCategory(resource) {
  return resource.primaryCategory || resource.category || (getResourceCategories(resource)[0] || "Resources");
}

function resourceMatchesCategory(resource, category) {
  if (category === "all") {
    return true;
  }

  return getResourceCategories(resource).includes(category);
}

function createCategoryBadges(resource, limit = 3) {
  return getResourceCategories(resource)
    .slice(0, limit)
    .map(category => `<span class="vault-badge">${category}</span>`)
    .join("");
}

function getAllCategoriesFromResources() {
  return [...new Set(resources.flatMap(resource => getResourceCategories(resource)))].sort();
}


function createCard(resource) {
  const logoUrl = getLogoUrl(resource);
  const initials = safeInitials(resource.title);
  const priceClass = resource.price.replace(/\s+/g, "-");
  const favoriteActive = favoriteIds.has(resource.id) ? "active" : "";
  const editorBadge = resource.editorPick ? `<span class="vault-badge">Editor's Pick</span>` : "";
  const openSourceBadge = resource.openSource ? `<span class="vault-badge">Open Source</span>` : "";

  return `
    <article class="vault-card" data-id="${resource.id}">
      <button class="vault-favorite ${favoriteActive}" type="button" data-favorite="${resource.id}" aria-label="Favorite ${resource.title}">♡</button>

      <div class="vault-card-top">
        <div class="vault-logo">
          ${logoUrl ? `<img src="${logoUrl}" alt="${resource.title} logo" onerror="this.parentElement.textContent='${initials}'">` : initials}
        </div>

        <div>
          <h3>${resource.title}</h3>
          <div class="vault-rating" aria-label="${resource.rating} out of 5 stars">
            ${createStars(resource.rating)}
            <small>${resource.rating}</small>
          </div>
        </div>
      </div>

      <p class="vault-description">${getDescription(resource)}</p>

      <div class="vault-badges">
        <span class="vault-badge vault-price ${priceClass}">${resource.price}</span>
        ${createCategoryBadges(resource, 2)}
        ${editorBadge}
        ${openSourceBadge}
        ${createBadgeList((resource.platforms || []).slice(0, 2))}
      </div>

      <div class="vault-card-actions">
        <button class="vault-card-button vault-details-button" type="button" data-details="${resource.id}">Details</button>
        <a class="vault-card-button" href="${resource.website}" target="_blank" rel="noopener">Visit</a>
      </div>
    </article>
  `;
}

function getCategories() {
  const resourceCategories = getAllCategoriesFromResources();

  if (typeof vaultCategories !== "undefined") {
    const manualCategories = vaultCategories.map(category => category.label);
    return [...new Set([...manualCategories, ...resourceCategories])].sort();
  }

  if (typeof generatedIndexes !== "undefined" && generatedIndexes.categories) {
    return Object.keys(generatedIndexes.categories).sort();
  }

  return resourceCategories;
}

function populateCategories() {
  const categories = getCategories();

  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    categoryFilter.appendChild(option);
  });

  categoryGrid.innerHTML = categories.map(category => {
    const count = resources.filter(resource => resourceMatchesCategory(resource, category)).length;
    const icon = categoryIcons[category] || "◈";

    return `
      <button class="vault-category-card" type="button" data-category="${category}">
        <span class="vault-category-icon">${icon}</span>
        <strong>${category}</strong>
        <span>${count} resource${count === 1 ? "" : "s"}</span>
      </button>
    `;
  }).join("");

  categoryGrid.querySelectorAll(".vault-category-card").forEach(button => {
    button.addEventListener("click", () => {
      categoryFilter.value = button.getAttribute("data-category");
      activeCollection = "all";
      filterResources();
      document.getElementById("resources").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });

  resourceCount.textContent = resources.length;
  categoryCount.textContent = categories.length;
  featuredCount.textContent = resources.filter(resource => resource.featured).length;
}

function populateCollections() {
  if (typeof vaultCollections === "undefined") {
    collectionGrid.innerHTML = "";
    return;
  }

  collectionGrid.innerHTML = vaultCollections.map(collection => {
    const count = resources.filter(resource => (resource.collections || []).includes(collection.id)).length;

    return `
      <button class="vault-collection-card" type="button" data-collection="${collection.id}">
        <strong>${collection.label}</strong>
        <p>${collection.description}</p>
        <span>${count} resource${count === 1 ? "" : "s"} →</span>
      </button>
    `;
  }).join("");

  collectionGrid.querySelectorAll(".vault-collection-card").forEach(button => {
    button.addEventListener("click", () => {
      activeCollection = button.getAttribute("data-collection");
      categoryFilter.value = "all";
      filterResources();
      document.getElementById("resources").scrollIntoView({ behavior: "smooth", block: "start" });
    });
  });
}

function getFilteredResources() {
  const searchTerm = searchInput.value.toLowerCase();
  const selectedCategory = categoryFilter.value;
  const selectedPrice = priceFilter.value;
  const selectedPlatform = platformFilter.value;
  const selectedSort = sortFilter.value;

  let filteredResources = resources.filter(resource => {
    const searchableText = [
      resource.title,
      getDescription(resource),
      resource.longDescription || "",
      resource.category,
      resource.primaryCategory || "",
      resource.categoryId || "",
      resource.primaryCategoryId || "",
      ...(resource.categories || []),
      ...(resource.categoryIds || []),
      resource.price,
      resource.skillLevel || "",
      resource.pricingDetails || "",
      resource.license || "",
      resource.notes || "",
      ...(resource.platforms || []),
      ...(resource.tags || []),
      ...(resource.subcategories || []),
      ...(resource.bestFor || []),
      ...(resource.collections || []),
      ...(resource.alternatives || [])
    ].join(" ").toLowerCase();

    const matchesSearch = searchableText.includes(searchTerm);
    const matchesCategory = resourceMatchesCategory(resource, selectedCategory);
    const matchesPrice = selectedPrice === "all" || resource.price === selectedPrice;
    const matchesPlatform = selectedPlatform === "all" || (resource.platforms || []).includes(selectedPlatform);
    const matchesCollection = activeCollection === "all" || (resource.collections || []).includes(activeCollection);

    return matchesSearch && matchesCategory && matchesPrice && matchesPlatform && matchesCollection;
  });

  if (selectedSort === "featured") {
    filteredResources.sort((a, b) => Number(b.featured) - Number(a.featured) || Number(b.editorPick) - Number(a.editorPick) || b.rating - a.rating || a.title.localeCompare(b.title));
  }

  if (selectedSort === "az") {
    filteredResources.sort((a, b) => a.title.localeCompare(b.title));
  }

  if (selectedSort === "rating") {
    filteredResources.sort((a, b) => b.rating - a.rating || a.title.localeCompare(b.title));
  }

  if (selectedSort === "free") {
    filteredResources.sort((a, b) => {
      const aFree = a.price === "Free" ? 0 : 1;
      const bFree = b.price === "Free" ? 0 : 1;
      return aFree - bFree || a.title.localeCompare(b.title);
    });
  }

  return filteredResources;
}

function updateActiveCategoryCards() {
  const selectedCategory = categoryFilter.value;

  categoryGrid.querySelectorAll(".vault-category-card").forEach(button => {
    button.classList.toggle("active", button.getAttribute("data-category") === selectedCategory);
  });
}

function filterResources() {
  const filteredResources = getFilteredResources();

  resourceGrid.innerHTML = filteredResources.map(createCard).join("");
  resultSummary.textContent = `Showing ${filteredResources.length} of ${resources.length} resources.`;
  emptyState.hidden = filteredResources.length !== 0;

  updateActiveCategoryCards();
  bindCardActions();
}

function bindCardActions() {
  document.querySelectorAll("[data-details]").forEach(button => {
    button.addEventListener("click", () => {
      const resource = resources.find(item => item.id === button.getAttribute("data-details"));
      if (resource) {
        openResourceModal(resource);
      }
    });
  });

  document.querySelectorAll("[data-favorite]").forEach(button => {
    button.addEventListener("click", () => {
      const id = button.getAttribute("data-favorite");

      if (favoriteIds.has(id)) {
        favoriteIds.delete(id);
      } else {
        favoriteIds.add(id);
      }

      button.classList.toggle("active");
    });
  });
}


function getRelatedResourceLinks(resource) {
  const relatedIds = resource.related || [];
  const relatedResources = relatedIds
    .map(id => resources.find(item => item.id === id))
    .filter(Boolean)
    .slice(0, 6);

  if (!relatedResources.length) {
    return "None listed yet.";
  }

  return relatedResources
    .map(item => `<button type="button" class="vault-related-button" data-related-open="${item.id}">${item.title}</button>`)
    .join("");
}

function getListMarkup(items, emptyText = "None listed yet.") {
  if (!items || !items.length) {
    return `<p>${emptyText}</p>`;
  }

  return `<ul>${items.map(item => `<li>${item}</li>`).join("")}</ul>`;
}

function getBooleanLabel(value) {
  if (value === true) return "Yes";
  if (value === false) return "No";
  return "Not listed";
}

function openResourceModal(resource) {
  const logoUrl = getLogoUrl(resource);
  const initials = safeInitials(resource.title);

  modalContent.innerHTML = `
    <div class="vault-modal-header">
      <div class="vault-modal-logo">
        ${logoUrl ? `<img src="${logoUrl}" alt="${resource.title} logo" onerror="this.parentElement.textContent='${initials}'">` : initials}
      </div>

      <div>
        <p class="vault-eyebrow">${getResourceCategories(resource).join(" • ")} ${resource.subcategories.length ? "• " + resource.subcategories[0] : ""}</p>
        <h3>${resource.title}</h3>
        <div class="vault-rating">${createStars(resource.rating)} <small>${resource.rating}</small></div>
        <div class="vault-modal-mini-badges">
          ${resource.editorPick ? `<span class="vault-badge">Editor's Pick</span>` : ""}
          ${resource.industryStandard ? `<span class="vault-badge">Industry Standard</span>` : ""}
          ${resource.openSource ? `<span class="vault-badge">Open Source</span>` : ""}
          ${resource.ai ? `<span class="vault-badge">AI Powered</span>` : ""}
          <span class="vault-badge vault-price ${String(resource.price).replace(/\s+/g, "-")}">${resource.price}</span>
        </div>
      </div>
    </div>

    <div class="vault-modal-grid">
      <div class="vault-modal-panel">
        <h4>Description</h4>
        <p>${resource.longDescription || getDescription(resource)}</p>

        ${resource.whyUseIt ? `<h4>Why Use It</h4><p>${resource.whyUseIt}</p>` : ""}

        <h4>Best For</h4>
        ${getListMarkup(resource.bestFor)}

        <h4>Pros</h4>
        ${getListMarkup(resource.pros, "Pros not listed yet.")}

        <h4>Cons</h4>
        ${getListMarkup(resource.cons, "Cons not listed yet.")}
      </div>

      <div class="vault-modal-panel">
        <h4>Company</h4>
        <p>${resource.company || "Not listed"}</p>

        <h4>Pricing</h4>
        <p><strong>${resource.price}</strong><br>${resource.pricingDetails || "Pricing details not listed."}</p>

        <h4>Platforms</h4>
        <p>${(resource.platforms || []).join(" • ") || "Not listed"}</p>

        <h4>Feature Flags</h4>
        <p>
          Browser: ${getBooleanLabel(resource.browserSupport)}<br>
          Mobile: ${getBooleanLabel(resource.mobileSupport)}<br>
          Offline: ${getBooleanLabel(resource.offline)}<br>
          Plugins: ${getBooleanLabel(resource.plugins)}<br>
          API: ${getBooleanLabel(resource.api)}<br>
          Commercial Use: ${getBooleanLabel(resource.commercialUse)}
        </p>

        <h4>Learning Curve</h4>
        <p>${resource.learningCurve || "Not listed"}</p>

        <h4>Alternatives</h4>
        <p>${(resource.alternatives || []).join(" • ") || "None listed yet."}</p>

        <h4>Related Resources</h4>
        <div class="vault-related-list">${getRelatedResourceLinks(resource)}</div>
      </div>
    </div>

    <div class="vault-modal-panel vault-modal-wide-panel">
      <h4>Categories</h4>
      <div class="vault-badges">${createBadgeList(getResourceCategories(resource))}</div>

      <h4>Tags</h4>
      <div class="vault-badges">${createBadgeList(resource.tags || [])}</div>

      ${resource.documentation ? `<a class="vault-secondary-link" href="${resource.documentation}" target="_blank" rel="noopener">Documentation</a>` : ""}
      ${resource.github ? `<a class="vault-secondary-link" href="${resource.github}" target="_blank" rel="noopener">GitHub</a>` : ""}
      ${resource.reddit ? `<a class="vault-secondary-link" href="${resource.reddit}" target="_blank" rel="noopener">Reddit</a>` : ""}
      ${resource.discord ? `<a class="vault-secondary-link" href="${resource.discord}" target="_blank" rel="noopener">Discord</a>` : ""}
    </div>

    <a class="vault-modal-button" href="${resource.website}" target="_blank" rel="noopener">Visit Official Website</a>
  `;

  resourceModal.showModal();

  modalContent.querySelectorAll("[data-related-open]").forEach(button => {
    button.addEventListener("click", () => {
      const relatedResource = resources.find(item => item.id === button.getAttribute("data-related-open"));
      if (relatedResource) {
        openResourceModal(relatedResource);
      }
    });
  });
}

modalClose.addEventListener("click", () => {
  resourceModal.close();
});

resourceModal.addEventListener("click", event => {
  if (event.target === resourceModal) {
    resourceModal.close();
  }
});

document.querySelectorAll("[data-quick]").forEach(button => {
  button.addEventListener("click", () => {
    const quick = button.getAttribute("data-quick");

    searchInput.value = "";
    categoryFilter.value = "all";
    priceFilter.value = "all";
    platformFilter.value = "all";
    activeCollection = "all";

    if (quick === "editorPick") {
      searchInput.value = "Editor's Pick";
    }

    if (quick === "free") {
      priceFilter.value = "Free";
      sortFilter.value = "free";
    }

    if (quick === "featured") {
      sortFilter.value = "featured";
      searchInput.value = "";
    }

    if (quick === "reset") {
      sortFilter.value = "featured";
    }

    filterResources();
    document.getElementById("resources").scrollIntoView({ behavior: "smooth", block: "start" });
  });
});

searchInput.addEventListener("input", () => {
  activeCollection = "all";
  filterResources();
});

categoryFilter.addEventListener("change", () => {
  activeCollection = "all";
  filterResources();
});

priceFilter.addEventListener("change", filterResources);
platformFilter.addEventListener("change", filterResources);
sortFilter.addEventListener("change", filterResources);

populateCategories();
populateCollections();
filterResources();
