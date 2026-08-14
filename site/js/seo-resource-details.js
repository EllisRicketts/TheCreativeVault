(function () {
  "use strict";

  var all = (typeof resources !== "undefined" && Array.isArray(resources)) ? resources : [];
  if (!all.length) return;

  function esc(value) {
    return String(value == null ? "" : value)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function norm(value) {
    return String(value || "").trim().toLowerCase().replace(/\s+/g, " ");
  }

  function hostOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); }
    catch (e) { return ""; }
  }

  var byTitle = new Map();
  var byWebsite = new Map();
  all.forEach(function (r) {
    if (r && r.title) byTitle.set(norm(r.title), r);
    if (r && r.website) {
      try {
        var u = new URL(r.website);
        byWebsite.set((u.origin + u.pathname).replace(/\/$/, "").toLowerCase(), r);
        byWebsite.set(u.hostname.replace(/^www\./, "").toLowerCase(), r);
      } catch (e) {}
    }
  });

  function matchCard(card) {
    var link = card.querySelector("h3 a");
    var title = link ? link.textContent : (card.querySelector("h3") || {}).textContent;
    var r = byTitle.get(norm(title));
    if (r) return r;
    if (link && link.href) {
      try {
        var u = new URL(link.href);
        r = byWebsite.get((u.origin + u.pathname).replace(/\/$/, "").toLowerCase()) ||
            byWebsite.get(u.hostname.replace(/^www\./, "").toLowerCase());
        if (r) return r;
      } catch (e) {}
    }
    return null;
  }

  function tagList(values) {
    if (!values || !values.length) return "";
    return '<div class="seo-detail-tags">' + values.map(function (v) {
      return '<span>' + esc(v) + '</span>';
    }).join("") + '</div>';
  }

  function specRow(label, value) {
    if (Array.isArray(value)) {
      if (!value.length) return "";
      return '<div><dt>' + esc(label) + '</dt><dd>' + tagList(value) + '</dd></div>';
    }
    if (value == null || value === "" || value === "Unknown") return "";
    return '<div><dt>' + esc(label) + '</dt><dd>' + esc(value) + '</dd></div>';
  }

  var dialog = document.createElement("dialog");
  dialog.className = "seo-resource-dialog";
  dialog.setAttribute("aria-labelledby", "seoDetailTitle");
  dialog.innerHTML = '<button class="seo-dialog-close" type="button" aria-label="Close details">×</button><div class="seo-dialog-body"></div>';
  document.body.appendChild(dialog);

  var body = dialog.querySelector(".seo-dialog-body");
  var close = dialog.querySelector(".seo-dialog-close");

  function openDetails(r, card) {
    var host = hostOf(r.website);
    var img = card ? card.querySelector(".seo-card-head img") : null;
    var logo = img && img.src ? img.src : (host ? "https://icons.duckduckgo.com/ip3/" + host + ".ico" : "");
    var company = r.company || host || "";
    var desc = r.longDescription || r.shortDescription || "";

    body.innerHTML =
      '<div class="seo-detail-head">' +
        (logo ? '<img src="' + esc(logo) + '" alt="" width="72" height="72" onerror="this.style.display=\'none\'">' : '') +
        '<div><p class="seo-detail-kicker">Resource details</p><h2 id="seoDetailTitle">' + esc(r.title) + '</h2>' +
        (company ? '<p class="seo-detail-company">' + esc(company) + '</p>' : '') + '</div>' +
      '</div>' +
      (desc ? '<p class="seo-detail-desc">' + esc(desc) + '</p>' : '') +
      '<dl class="seo-detail-spec">' +
        specRow("Price", r.price) +
        specRow("Category", (r.categories || (r.category ? [r.category] : [])).slice(0, 6)) +
        specRow("Platforms", (r.platforms || []).slice(0, 8)) +
        specRow("Best for", (r.bestFor || []).slice(0, 8)) +
        specRow("Tags", (r.tags || []).slice(0, 10)) +
        specRow("Open source", r.openSource ? "Yes" : "") +
        specRow("Website", host) +
      '</dl>' +
      '<div class="seo-detail-actions"><a class="seo-detail-visit" href="' + esc(r.website) + '" target="_blank" rel="noopener">Visit site ↗</a></div>';

    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }

  close.addEventListener("click", function () { dialog.close(); });
  dialog.addEventListener("click", function (e) {
    if (e.target === dialog) dialog.close();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && dialog.open) dialog.close();
  });

  document.querySelectorAll(".seo-card").forEach(function (card) {
    var r = matchCard(card);
    if (!r) return;
    var actions = document.createElement("div");
    actions.className = "seo-card-actions";
    var details = document.createElement("button");
    details.type = "button";
    details.className = "seo-details-button";
    details.textContent = "Details";
    details.addEventListener("click", function () { openDetails(r, card); });
    var visit = document.createElement("a");
    visit.className = "seo-card-visit";
    visit.href = r.website;
    visit.target = "_blank";
    visit.rel = "noopener";
    visit.textContent = "Visit ↗";
    actions.appendChild(details);
    actions.appendChild(visit);
    card.appendChild(actions);
  });
})();
