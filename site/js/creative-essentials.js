
(function () {
  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    const button = document.getElementById("creativeEssentialsButton");
    const modal = document.getElementById("creativeEssentialsModal");
    const close = document.getElementById("creativeEssentialsClose");
    const grid = document.getElementById("creativeEssentialsGrid");
    const search = document.getElementById("creativeEssentialsSearch");
    const showAll = document.getElementById("creativeEssentialsShowAll");

    if (!button || !modal || !grid) return;

    const source = typeof generatedResources !== "undefined" ? generatedResources : [];
    const essentials = source.filter(function (item) {
      const cats = item.categories || [];
      const ids = item.categoryIds || [];
      const tags = item.tags || [];
      const subcats = item.subcategories || [];
      return item.price === "Free" && (
        ids.includes("creative-essentials") ||
        cats.includes("Creative Essentials") ||
        tags.includes("Creative Essentials") ||
        subcats.includes("Creative Essentials")
      );
    });

    function render(list) {
      const items = list.slice(0, 300);
      grid.innerHTML = items.map(function (item) {
        const sub = (item.subcategories || [item.category || "Resource"])[0];
        const desc = item.shortDescription || item.description || "Free creative resource.";
        return `
          <article class="creative-essential-card">
            <strong>${item.title}</strong>
            <div class="meta">
              <span>FREE</span>
              <span>${sub}</span>
            </div>
            <p>${desc}</p>
            <a href="${item.website}" target="_blank" rel="noopener">OPEN RESOURCE</a>
          </article>
        `;
      }).join("");
    }

    button.addEventListener("click", function () {
      render(essentials);
      if (typeof modal.showModal === "function") modal.showModal();
      else modal.setAttribute("open", "open");
    });

    close && close.addEventListener("click", function () {
      modal.close ? modal.close() : modal.removeAttribute("open");
    });

    search && search.addEventListener("input", function () {
      const q = search.value.trim().toLowerCase();
      if (!q) {
        render(essentials);
        return;
      }
      render(essentials.filter(function (item) {
        return [
          item.title,
          item.company,
          item.category,
          (item.subcategories || []).join(" "),
          (item.tags || []).join(" "),
          item.shortDescription
        ].join(" ").toLowerCase().includes(q);
      }));
    });

    showAll && showAll.addEventListener("click", function () {
      modal.close ? modal.close() : modal.removeAttribute("open");

      const searchInputs = Array.from(document.querySelectorAll("input[type='search'], input[placeholder*='Search'], input[id*='search'], input[class*='search']"));
      const target = searchInputs[0];
      if (target) {
        target.value = "Creative Essentials";
        target.dispatchEvent(new Event("input", { bubbles: true }));
        target.dispatchEvent(new Event("change", { bubbles: true }));
        target.focus();
      }
    });
  });
})();
