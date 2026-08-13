# AR-34 Discovery & Privacy Policy

Favorites and recently viewed are local-device preferences in this baseline.
They are not synchronized to an account and can be cleared locally.

Autocomplete sends only the active query to the first-party search endpoint.
Interaction analytics intentionally reject raw search text and free-form PII.
Product IDs, content IDs, filter counts and coarse interaction types are sufficient
for initial product analytics.

Comparison is explicit and capped at four products to preserve legibility.

URL state is the source of truth for shareable machine filters. Applying a new
filter clears the current pagination cursor.

Client caching is intentionally small and short-lived. Canonical/public freshness
continues to be governed by server projections and cache policy.
