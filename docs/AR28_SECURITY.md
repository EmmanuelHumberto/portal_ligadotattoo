# AR-28 Security & Compliance

1. Only HTTPS acquisition is permitted.
2. Sources are registered before crawl targets can execute.
3. Host allowlists are explicit.
4. DNS results are checked against private, loopback and link-local ranges.
5. Redirects are manual and every destination is revalidated.
6. URL userinfo/credentials are forbidden.
7. Response size is bounded.
8. Request duration is bounded.
9. Acquisition does not forward browser/user credentials.
10. Source snapshots are immutable.
11. Duplicate bodies are suppressed by SHA-256 per source.
12. Extracted text is untrusted input and cannot execute code.
13. Robots/compliance policy is persisted and must be enforced by the scheduler adapter.
14. `MANUAL_ALLOW` requires an operational/legal decision outside automated discovery.
15. `DISABLED` robots policy means crawling is disabled, not robots bypass.
16. Crawl rate is source-controlled and has a minimum delay.
17. Public users cannot submit arbitrary crawl URLs.
18. Ingestion failures retain bounded diagnostic metadata.
19. Source content can generate candidates/claims, never canonical facts directly.
20. AI processing of acquired material must go through the Provider Hub and its workload policies.
