import { Injectable } from '@nestjs/common';
import type { Tx } from '../platform/transaction-manager';

@Injectable()
export class CommerceRepository {
  async insertListing(l:any,tx:Tx) {
    await tx.query(
      `insert into commerce.listing
       (id,seller_id,product_model_id,external_id,url,normalized_url,
        affiliate_mode,status,version,created_at,updated_at)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,now(),now())`,
      [l.id,l.sellerId,l.productModelId,l.externalId,l.sourceUrl,
       l.normalizedUrl,l.affiliateMode,l.status,l.version],
    );
  }

  async insertObservation(o:any,tx:Tx) {
    await tx.query(
      `insert into commerce.price_observation
       (id,listing_id,amount,currency,availability,observed_at,source_snapshot_id)
       values ($1,$2,$3,$4,$5,$6,$7)
       on conflict (listing_id,observed_at,amount,currency) do nothing`,
      [o.id,o.listingId,o.amount,o.currency,o.availability,
       o.observedAt,o.sourceSnapshotId],
    );
  }
}
