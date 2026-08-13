# Portal Tattoo — Master Release Formulation

Formulation version: AR-45
Architecture series: AR-01 through AR-45
Status: FORMULATION COMPLETE

## Product
A premium dark-mode portal focused on tattoo machines, technology, knowledge,
editorial discovery, events and commerce discovery, supported by governed data,
provenance, media rights, search, Admin operations and product intelligence.

## Core runtime
- Next.js Web;
- NestJS API;
- independent Worker;
- PostgreSQL canonical store;
- Redis queue/cache integration boundary;
- S3-compatible object storage/CDN;
- first-party analytics;
- CI/CD with immutable artifacts.

## AI architecture
A configurable backend AI Provider Hub supports OpenAI, Anthropic, DeepSeek and
future adapters. Routing/fallback is workload-driven. Provider credentials remain
backend-only. AI output is assistive/proposal data and never receives automatic
canonical authority.

## Governance
External acquisition -> evidence -> proposal/review -> canonical data -> public
projection. This authority chain is a permanent architecture invariant.

## Delivery state
The architecture, contracts, operational model, staging distribution and release
acceptance framework are formulated. Actual production GO requires executed
evidence from the integrated release candidate.
