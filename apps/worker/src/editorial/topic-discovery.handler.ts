import { Pool } from 'pg';
import { randomUUID } from 'node:crypto';
import type { JobHandler, JobResult } from '../job-runner';
import { HttpAcquirer } from '../ingestion/http-acquirer';

type Topic = { id:string; name:string; query:string; language:string; max_articles:number };

export class TopicDiscoveryHandler implements JobHandler {
  readonly type='editorial.topic_discovery';

  constructor(
    private readonly pool:Pool,
    private readonly http:HttpAcquirer,
  ) {}

  async handle():Promise<JobResult>{
    const topics=await this.pool.query(
      `select id,name,query,language,max_articles
         from editorial.topic where status='ACTIVE'`,
    );
    let enqueued=0;
    for(const t of topics.rows as Topic[]){
      try { enqueued += await this.discoverOne(t); }
      catch(e) { console.error('topic_discovery_error',{topic:t.name,error:(e as Error).message}); }
    }
    return 'DONE';
  }

  private async discoverOne(topic:Topic):Promise<number>{
    const q=`https://news.google.com/rss/search?q=${encodeURIComponent(topic.query)}&hl=${topic.language}&gl=BR&ceid=BR:pt-419`;
    const r=await this.http.acquire({url:q,allowedHosts:[],maxBytes:2_000_000});
    const items=parseRss(r.body.toString('utf8')).slice(0,topic.max_articles);
    console.log('topic_discovery_items',{topic:topic.name,url:q,items:items.length});
    if(!items.length)return 0;

    const sourceId=await this.ensureSource(topic);
    let n=0;
    for(const it of items){
      const res=await this.pool.query(
        `insert into ops.job
         (id,job_type,job_version,payload,status,available_at,deduplication_key)
         values (gen_random_uuid(),'ingestion.collect_article',1,$1::jsonb,
                 'PENDING',now(),$2)
         on conflict (job_type,deduplication_key)
           where deduplication_key is not null do nothing`,
        [JSON.stringify({sourceId,url:it.link}),'topic-article:'+it.link],
      );
      n += res.rowCount ?? 0;
    }
    await this.pool.query(
      `update editorial.topic set last_discovered_at=now(),updated_at=now() where id=$1`,
      [topic.id],
    );
    return n;
  }

  private async ensureSource(topic:Topic):Promise<string>{
    const existing=await this.pool.query(
      `select id from ingestion.source where name=$1 and kind='TOPIC' limit 1`,
      [topic.name],
    );
    if(existing.rowCount)return existing.rows[0].id;
    const id=randomUUID();
    await this.pool.query(
      `insert into ingestion.source
       (id,name,kind,base_url,allowed_hosts,status)
       values ($1,$2,'TOPIC','https://news.google.com/','{}','ACTIVE')`,
      [id,topic.name],
    );
    return id;
  }
}

function parseRss(xml:string):Array<{title:string;link:string}>{
  const out:Array<{title:string;link:string}>=[];
  for(const m of xml.matchAll(/<item>([\s\S]*?)<\/item>/g)){
    const block=m[1] ?? '';
    const title=decode(/<title>([\s\S]*?)<\/title>/i.exec(block)?.[1]);
    const link=decode(/<link>([\s\S]*?)<\/link>/i.exec(block)?.[1]);
    if(title&&link)out.push({title,link});
  }
  return out;
}

function decode(v:string|undefined):string{
  if(!v)return '';
  return v.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g,'$1')
    .replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>')
    .replace(/&quot;/g,'"').replace(/&#39;/g,"'").trim();
}
