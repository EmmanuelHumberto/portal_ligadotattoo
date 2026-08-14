import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import type { JobHandler, JobResult } from '../job-runner';
import { HttpAcquirer } from '../ingestion/http-acquirer';
import { SimpleContentExtractor } from '../simple-extractor';
import { cleanProductName, extractProductLinks, slugify } from './catalog-discovery.handler';
import { emitPriceObserved } from './price-event-router';

type Model={id:string;name:string;slug:string};

export class RetailerPriceHandler implements JobHandler {
  readonly type='commerce.retailer_price';

  constructor(
    private readonly pool:Pool,
    private readonly http:HttpAcquirer,
    private readonly extractor:SimpleContentExtractor,
  ) {}

  async handle():Promise<JobResult>{
    const models=await this.pool.query(
      `select id, name, slug from catalog.product_model where lifecycle <> 'UNKNOWN'`,
    );
    const modelList=models.rows as Model[];

    const sources=await this.pool.query(
      `select s.id, s.name from ingestion.source s
        where s.kind='RETAILER' and s.status='ACTIVE'
          and exists (
            select 1 from ingestion.snapshot sn where sn.source_id=s.id
          )`,
    );

    for(const s of sources.rows){
      const snap=await this.pool.query(
        `select id, url, body_bytes from ingestion.snapshot
          where source_id=$1 order by observed_at desc limit 1`,
        [s.id],
      );
      if(!snap.rowCount)continue;
      const html=Buffer.from(snap.rows[0].body_bytes ?? '').toString('utf8');
      const sellerId=await this.ensureSeller(String(s.name), snap.rows[0].url);

      const productUrls=new Set<string>();
      for(const p of extractProductLinks(html, snap.rows[0].url)){
        productUrls.add(p);
      }
      // coletar coleções para descobrir produtos individuais
      for(const cUrl of extractCollectionLinks(html, snap.rows[0].url).slice(0,15)){
        try {
          const cr=await this.http.acquire({url:cUrl,allowedHosts:[],maxBytes:2_000_000});
          for(const p of extractProductLinks(cr.body.toString('utf8'),cUrl)){
            productUrls.add(p);
          }
        } catch {}
      }
      for(const url of [...productUrls].slice(0,60)){
        try { await this.collectOne(sellerId,url,modelList); } catch {}
      }
    }
    return 'DONE';
  }

  private async ensureSeller(name:string,websiteUrl:string):Promise<string>{
    const slug=slugify(name);
    const existing=await this.pool.query(
      `select id from commerce.seller where slug=$1 limit 1`,[slug],
    );
    if(existing.rowCount)return existing.rows[0].id;
    const id=randomUUID();
    await this.pool.query(
      `insert into commerce.seller
       (id,name,slug,website_url,status,public_freshness_interval)
       values ($1,$2,$3,$4,'ACTIVE',interval '24 hours')`,
      [id,name,slug,websiteUrl],
    );
    return id;
  }

  private async collectOne(sellerId:string,url:string,models:Model[]):Promise<void>{
    const prior=await this.pool.query(
      `select 1 from commerce.listing where normalized_url=$1 limit 1`,[url],
    );
    if(prior.rowCount)return;

    const r=await this.http.acquire({url,allowedHosts:[],maxBytes:1_500_000});
    const extracted=await this.extractor.extract({
      contentType:r.contentType,body:r.body,url:r.finalUrl,
    });
    const name=cleanProductName(extracted.title ?? '');
    const structured=(extracted.structured ?? {}) as Record<string,unknown>;
    if(!name || structured.price==null)return;

    const model=matchProduct(name,models);
    if(!model)return;

    const lid=randomUUID();
    await this.pool.query(
      `insert into commerce.listing
       (id,seller_id,product_model_id,external_id,url,normalized_url,
        affiliate_mode,availability,status,last_observed_at,version)
       select $1,$2,$3,$4,$5,$5,'NONE','IN_STOCK','ACTIVE',now(),1
        where not exists (
          select 1 from commerce.listing where normalized_url=$5
        )`,
      [lid,sellerId,model.id,model.slug,url],
    );
    const observationId=randomUUID();
    const amount=Number(structured.price);
    const currency=String(structured.currency ?? 'USD').toUpperCase();
    await this.pool.query(
      `insert into commerce.price_observation
       (id,listing_id,amount,currency,availability,observed_at)
       values ($1,$2,$3,$4,'IN_STOCK',now())`,
      [observationId,lid,amount,currency],
    );
    await emitPriceObserved(this.pool,{
      listingId:lid,observationId,amount,currency,
    });
  }
}

function extractCollectionLinks(html:string,baseUrl:string):string[]{
  const base=new URL(baseUrl);
  const seen=new Set<string>();
  const out:string[]=[];
  for(const m of html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi)){
    const href=m[1];
    if(!href)continue;
    let url:URL;
    try { url=new URL(href,base); } catch { continue; }
    if(url.hostname!==base.hostname)continue;
    const path=url.pathname.toLowerCase();
    if(path.includes('/collections/') && !path.includes('/products/')){
      const key=url.origin+url.pathname.replace(/\/$/,'');
      if(!seen.has(key)){ seen.add(key); out.push(key); }
    }
  }
  return out;
}

function matchProduct(name:string,models:Model[]):Model|null{
  const n=normalize(name);
  let best:Model|null=null;
  let bestLen=0;
  for(const m of models){
    const mn=normalize(m.name);
    if(mn.length>=4 && n.includes(mn) && mn.length>bestLen){
      best=m;
      bestLen=mn.length;
    }
  }
  return best;
}

function normalize(s:string):string{
  return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
}
