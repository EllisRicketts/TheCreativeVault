CREATIVE VAULT V29 — CATEGORY FILTER FIX

This fixes category panel clicks so they manipulate the resource results instead of only scrolling.

What changed:
- Category click now applies the selected category to the search input.
- It triggers input, change, search, keyup, and Enter events.
- It attempts to call common render/filter functions if they exist.
- It dispatches a custom event: vault:filter
- It has a fallback that directly hides/shows resource cards if the native search does not respond.
- It updates the URL query parameter with ?q=CategoryName.

File changed:
- js/vault-navigation.js
- first CSS file in /css
