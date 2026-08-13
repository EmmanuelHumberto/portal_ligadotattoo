# AR-30 Decisions

1. Prices are immutable observations, not mutable product attributes.
2. Listings connect a seller to a ProductModel.
3. Public offers expose only fresh ACTIVE listings from ACTIVE sellers.
4. Seller-specific freshness intervals determine staleness.
5. Affiliate URLs are resolved server-side behind `/go/listing/:id`.
6. Provider/affiliate secrets or private parameters are never embedded in public DTOs.
7. Tracking query parameters are removed from normalized listing identity.
8. Price trend is an asynchronous projection.
9. Currency conversion is intentionally not fabricated in this baseline; trends group by currency.
10. Retailer ingestion creates review candidates rather than automatic listings.
11. Commerce facts do not alter canonical technical specifications.
12. Price observations emit Outbox events.

AR-20 administrative gap closed:
- GET /admin/listings

Remaining administrative read gaps:
- GET /admin/media
- GET /admin/audit

## Next artifact

AR-31 — Media Library, Rights Governance & Delivery Pipeline.

Scope:
- Admin media read API;
- ingestion/upload media lifecycle;
- rights records and expiry;
- image variants;
- safe metadata;
- delivery abstraction;
- moderation/review queue;
- public media projection;
- cache invalidation;
- audit/outbox;
- GET /admin/media.
