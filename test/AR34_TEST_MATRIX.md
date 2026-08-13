# AR-34 Test Matrix

Autocomplete: <2 chars no request; debounce; max 8; keyboard/focus semantics.
Filters: URL sync; cursor reset; clear; mobile layout.
Compare: duplicate prevention; max four; removal; missing spec shown as dash.
Favorites/recent: local-only; dedupe recent; max 20; clear storage.
Gallery: active thumbnail; missing media state; alt handling.
Analytics: allowlisted events only; raw query/PII fields excluded.
Caching: TTL hit; expiry reload; prefix invalidation.
SSR: catalog and comparison entry remain server-renderable.
