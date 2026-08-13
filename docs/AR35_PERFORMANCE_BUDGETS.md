# AR-35 Performance Budgets

Release targets for representative production mobile traffic:
- LCP: <= 2.5s at p75.
- INP: <= 200ms at p75.
- CLS: <= 0.10 at p75.
- Initial route JS: target <= 180 KB gzip for public content routes.
- Critical CSS: target <= 45 KB gzip.
- Hero image: target <= 250 KB delivered at representative mobile viewport.
- Card thumbnails: target <= 80 KB each at rendered mobile size.
- Third-party synchronous scripts: zero.
- Font families: one primary family baseline; use `font-display: swap`.
- Above-fold images: explicit dimensions/aspect ratios.
- Noncritical images: lazy.
- API waterfall: avoid serial public fetches when independent.

Budgets are gates for investigation, not justification to hide regressions.
Measure with field data plus repeatable lab profiles.
