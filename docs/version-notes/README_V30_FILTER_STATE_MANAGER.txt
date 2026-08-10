CREATIVE VAULT V30 — FILTER STATE MANAGER

This update centralizes filtering so category clicks, search input, navigation panels, and clear behavior stop fighting each other.

Added:
- js/vault-filter-state.js

Updated:
- js/vault-navigation.js
- index.html script loading
- CSS active filter badge

Behavior:
- One global filter state controls the site:
  window.vaultFilterState

- One global filter function:
  window.applyVaultFilter({ query, category, collection, source })

- One clear function:
  window.clearVaultFilter()

Rules:
- Same filter does not re-render unnecessarily.
- Clearing search clears all active filters.
- Clicking a category replaces the old filter instead of stacking.
- Modal searches stay separate unless routed through the main filter.
- URL updates with ?q=FilterName.
- A visible active filter badge appears with a clear button.

This should make the site's filtering feel more predictable and stable.
