# AR-28 Test Matrix

Source registry: HTTPS-only, normalized allowed hosts, minimum delay, capabilities.

SSRF: reject localhost/private/link-local, reject unregistered host, reject URL credentials, revalidate redirects, reject redirect to private host.

Acquisition: timeout, maximum bytes, immutable snapshot, SHA-256 deduplication, failed-run diagnostics.

Extraction: one extraction per snapshot, editorial candidate routing, catalog candidate routing, duplicate candidate suppression.

Authority: ingestion cannot create canonical facts; discovered entities require review; story candidates remain unpublished.

Admin: source list requires source.read; run list requires ingestion.read; discovery list requires ingestion.read.
