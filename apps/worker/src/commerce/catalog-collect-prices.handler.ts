import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import type { JobHandler, JobResult } from '../job-runner';
import { HttpAcquirer } from '../ingestion/http-acquirer';
import { SimpleContentExtractor } from '../simple-extractor';

export class CatalogCollectPricesHandler implements JobHandler {
  readonly type='catalog.collect_prices';

  constructor(
    private readonly pool:Pool,
    private readonly http:HttpAcquirer,
    private readonly extractor:SimpleContentExtractor,
  ) {}

  async handle():Promise<JobResult>{
    const listings=await this.pool.query(
      `select li.id, li.url
         from commerce.listing li
        where li.status='ACTIVE'
          and li.url not like '%#%'
          and not exists (
            select 1 from commerce.price_observation po
             where po.listing_id=li.id
               and po.observed_at >= now() - interval '7 days'
          )`,
    );
    let collected=0;
    for(const li of listings.rows){
      try {
        if(await this.collectOne(li))collected++;
      } catch {
        // segue
      }
    }
    return 'DONE';
  }

  private async collectOne(li:any):Promise<boolean>{
    const r=await this.http.acquire({
      url:li.url,allowedHosts:[],maxBytes:1_500_000,
    });
    const extracted=await this.extractor.extract({
      contentType:r.contentType,body:r.body,url:r.finalUrl,
    });
    const structured=(extracted.structured ?? {}) as Record<string,unknown>;
    if(structured.price==null)return false;
    const amount=Number(structured.price);
    if(Number.isNaN(amount)||amount<=0)return false;
    const currency=String(structured.currency ?? 'USD').toUpperCase();
    await this.pool.query(
      `insert into commerce.price_observation
       (id,listing_id,amount,currency,availability,observed_at)
       values ($1,$2,$3,$4,'IN_STOCK',now())`,
      [randomUUID(),li.id,amount,currency],
    );
    return true;
  }
}
