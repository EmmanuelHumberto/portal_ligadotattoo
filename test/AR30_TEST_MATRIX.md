# AR-30 Test Matrix

Listing identity: normalize tracking parameters; seller+URL uniqueness; invalid URL rejected.

Price observations: nonnegative amount; ISO-like currency; immutable insert; duplicate suppression; latest observation updates listing.

Freshness: stale listings hidden publicly; seller interval honored; unavailable listing excluded after status update.

Affiliate boundary: public DTO exposes internal outbound route; redirect resolves template; disabled seller/listing returns 404; referrer policy set.

Trends: 30d min/max/avg/latest; currencies not mixed; projection triggered by price event.

Ingestion: retailer discovery creates listing candidate; candidate requires review; no automatic seller/product creation.

Security: Admin list requires commerce.read; affiliate credentials are absent from DTO; price data cannot create canonical facts.
