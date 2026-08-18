import { Pool } from 'pg';
import { createHash } from 'node:crypto';

export interface ContentExtractor {
  extract(input:{contentType:string|null;body:Buffer;url:string}):Promise<{
    title?:string;text:string;links?:string[];blocked?:boolean;
    structured?:Record<string,unknown>;
  }>;
}

export class ExtractionHandler {
  readonly type='ingestion.extract';
  constructor(
    private readonly pool:Pool,
    private readonly extractor:ContentExtractor,
  ) {}

  async handle(payload:any) {
    const r=await this.pool.query(
      `select id,url,content_type,body_bytes from ingestion.snapshot where id=$1`,
      [payload.snapshotId],
    );
    if (!r.rowCount) return 'NON_RETRYABLE' as const;
    const s=r.rows[0];
    const extracted=await this.extractor.extract({
      contentType:s.content_type,body:s.body_bytes,url:s.url,
    });
    const fingerprint=createHash('sha256')
      .update(extracted.text.trim().replace(/\s+/g,' '))
      .digest('hex');

    await this.pool.query(
      `insert into ingestion.extraction
       (id,snapshot_id,title,text_content,structured_data,fingerprint,created_at)
       values (gen_random_uuid(),$1,$2,$3,$4::jsonb,$5,now())
       on conflict (snapshot_id) do nothing`,
      [s.id,extracted.title ?? null,extracted.text,
       JSON.stringify(extracted.structured ?? {}),fingerprint],
    );

    await this.routeDiscovery(payload,s,extracted,fingerprint);
    return 'DONE' as const;
  }

  private async routeDiscovery(payload:any,s:any,x:any,fingerprint:string) {
    if (payload.discoveryMode==='EDITORIAL') {
      const latest=pickLatestArticle(x.links,s.url);
      if (latest) {
        await this.pool.query(
          `insert into ops.job
           (id,job_type,job_version,payload,status,available_at,deduplication_key)
           values (gen_random_uuid(),'ingestion.collect_article',1,$1::jsonb,
                   'PENDING',now(),$2)
           on conflict (job_type,deduplication_key)
             where deduplication_key is not null do nothing`,
          [JSON.stringify({sourceId:payload.sourceId,url:latest}),
           'article:'+latest],
        );
      } else {
        await this.pool.query(
          `insert into editorial.story_candidate
           (id,source_id,source_snapshot_id,source_url,title,status,created_at)
           values (gen_random_uuid(),$1,$2,$3,$4,'NEW',now())
           on conflict (source_snapshot_id) do nothing`,
          [payload.sourceId,s.id,s.url,x.title ?? s.url],
        );
      }
    }
    if (['CATALOG','MIXED'].includes(payload.discoveryMode)) {
      await this.pool.query(
        `insert into ingestion.discovery_candidate
         (id,source_id,snapshot_id,candidate_type,title,fingerprint,
          status,created_at)
         values (gen_random_uuid(),$1,$2,'CATALOG_ENTITY',$3,$4,
                 'NEW',now())
         on conflict (source_id,fingerprint,candidate_type) do nothing`,
        [payload.sourceId,s.id,x.title ?? s.url,fingerprint],
      );
    }
  }
}

function pickLatestArticle(links:string[]|undefined,baseUrl:string):string|null{
  if(!Array.isArray(links)||!links.length)return null;
  let base:URL;
  try{base=new URL(baseUrl);}catch{return null;}
  for(const raw of links){
    let abs:URL;
    try{abs=new URL(raw,base);}catch{continue;}
    if(abs.hostname!==base.hostname)continue;
    if(abs.pathname==='/'||abs.pathname==='')continue;
    if(isUtilityPath(abs.pathname))continue;
    return abs.toString();
  }
  return null;
}

function isUtilityPath(path:string):boolean{
  const seg=path.toLowerCase().split('/').filter(Boolean);
  const skip=['login','register','signin','signup','about','contact','cart',
    'shop','store','privacy','terms','policy','account','search','category',
    'categories','tag','tags','page','author','faq','help','newsletter',
    'subscribe','cookies','sitemap','rss','feed','wishlist','checkout',
    'directory','directories','contest','contests','gallery','galleries',
    'motion','video','videos','media','press','podcast','events','event',
    'tattoo-artists','artists','studio','studios'];
  return seg.some(s=>skip.includes(s));
}
