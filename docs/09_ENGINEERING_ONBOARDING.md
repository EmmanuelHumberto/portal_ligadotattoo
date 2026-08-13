# Engineering Onboarding

Before modifying the platform, understand these invariants:

1. Do not write canonical facts directly from scraping/ingestion.
2. Do not allow AI output to bypass review/governance.
3. Do not expose provider credentials to Web/browser code.
4. Do not use direct dynamic URL fetches outside the safe-fetch adapter.
5. Do not publish media without current rights eligibility.
6. Do not expose private affiliate parameters in public DTOs.
7. Do not add privileged actions without capability and audit review.
8. Do not make async handlers non-idempotent.
9. Do not introduce destructive schema changes in the same release that requires
   old application versions to stop working.
10. Do not add analytics fields containing free-form PII/raw search terms.

Change workflow:
- identify owning module;
- define contract/invariant impact;
- add migration using expand/contract if required;
- add unit/contract/integration tests;
- update E2E for critical journeys;
- update security/performance evidence if boundary changes;
- verify staging;
- promote immutable candidate.
