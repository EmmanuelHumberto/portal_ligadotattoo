# AR-35 Route Cache Matrix

Baseline:
- Home: revalidate 60s.
- Catalog listing/facets: revalidate 60s for canonical unfiltered views; filtered
  results may use server cache keys by normalized query.
- Product detail: revalidate 300s; invalidated on catalog/media/offer events.
- Editorial detail: revalidate 300s; invalidated on publication changes.
- Events: revalidate 300s.
- Public offers: short TTL, target 60s, bounded by commerce freshness.
- Search/autocomplete: 20-30s client/edge tolerance; not canonical content.
- Admin: no-store.
- Sitemap: regenerated from public SEO projections; deployment may add explicit
  revalidation according to content volume.

Cache invalidation must never make expired/restricted media publicly eligible.
Rights and takedown invalidations have priority over performance caching.
