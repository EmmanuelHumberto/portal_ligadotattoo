export type ListingStatus='ACTIVE'|'STALE'|'UNAVAILABLE'|'DISABLED';

export class Listing {
  private constructor(
    readonly id:string,
    readonly sellerId:string,
    readonly productModelId:string,
    readonly externalId:string|null,
    readonly sourceUrl:string,
    readonly normalizedUrl:string,
    readonly affiliateMode:'NONE'|'TEMPLATE'|'DIRECT',
    readonly status:ListingStatus,
    readonly version:number,
  ) {}

  static create(input:any) {
    const u=new URL(input.sourceUrl);
    if (!['https:','http:'].includes(u.protocol))
      throw new Error('Invalid listing URL');
    u.hash='';
    ['utm_source','utm_medium','utm_campaign','utm_term','utm_content']
      .forEach(k=>u.searchParams.delete(k));
    return new Listing(
      input.id,input.sellerId,input.productModelId,input.externalId ?? null,
      input.sourceUrl,u.toString(),input.affiliateMode ?? 'NONE','ACTIVE',1,
    );
  }
}

export class PriceObservation {
  static create(input:any) {
    const amount=Number(input.amount);
    if (!Number.isFinite(amount) || amount < 0)
      throw new Error('Invalid price');
    const currency=String(input.currency).toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) throw new Error('Invalid currency');
    return {
      id:input.id,listingId:input.listingId,amount,currency,
      availability:input.availability ?? 'UNKNOWN',
      observedAt:input.observedAt ?? new Date(),
      sourceSnapshotId:input.sourceSnapshotId ?? null,
    };
  }
}
