# AR-35 Decisions

1. Canonical SEO surfaces are curated public routes, not arbitrary filter states.
2. Filtered catalog URLs are followable but noindex by default.
3. Search, compare, Admin and API routes are disallowed in robots.
4. JSON-LD mirrors public eligible data only.
5. Product, Article/NewsArticle and Event are initial structured-data types.
6. Open Graph and Twitter cards share canonical page metadata.
7. Next image optimization prefers AVIF/WebP.
8. Font loading uses a single baseline family with swap behavior.
9. Core Web Vitals are reported to a first-party bounded endpoint.
10. Performance budgets are explicit release criteria.
11. Rights/takedown correctness outranks cache hit rate.
12. Sitemap consumes public SEO projections rather than database-private entities.

## Next artifact
AR-36 — Security Hardening, Abuse Controls & Production Boundary Review.

Scope: CSP, CSRF, session/cookie hardening, rate limits, bot/abuse controls,
upload validation, public endpoint quotas, SSRF regression review, secret
rotation boundaries, dependency/container posture, security headers and
production threat-model closure.
