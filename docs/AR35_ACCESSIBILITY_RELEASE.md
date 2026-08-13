# AR-35 Accessibility Release Verification

Required before release:
- automated axe-style scan on core templates;
- keyboard-only pass: header, search, filters, gallery, comparison and offers;
- visible focus on every interactive control;
- heading hierarchy review;
- landmarks and accessible names;
- form label/error association;
- contrast verification for muted text, gold controls and borders;
- 200% zoom without loss of core functionality;
- mobile reflow without two-dimensional scrolling except comparison tables;
- informative images have useful alt; decorative images use empty alt;
- motion respects `prefers-reduced-motion`;
- status/error changes use appropriate live regions when asynchronous;
- touch targets target >= 44 CSS px.
