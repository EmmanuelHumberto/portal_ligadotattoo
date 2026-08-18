import { Pool } from 'pg';
import { createHash, randomUUID } from 'node:crypto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { JobHandler, JobResult } from '../job-runner';
import { HttpAcquirer } from '../ingestion/http-acquirer';

const BROWSER_UA='Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36';
const PAGE_PATTERN=/(product|collection|machine|shop|pages|resources|manual|download|sds|msds|catalog|support)/i;

// Descobre e baixa documentos (PDFs de manuais) publicados nos sites dos
// fabricantes. Usa sitemap + crawling das páginas internas, armazena no
// object storage e liga ao fabricante via media_link.
export class CatalogDocumentDiscoveryHandler implements JobHandler {
  readonly type='catalog.discover_documents';

  constructor(
    private readonly pool:Pool,
    private readonly http:HttpAcquirer,
    private readonly s3:S3Client,
    private readonly bucket:string,
  ) {}

  async handle():Promise<JobResult>{
    const manufacturers=await this.pool.query(
      `select id,name,slug,official_website from catalog.manufacturer
        where official_website is not null and status='ACTIVE'
          and exclude_from_discovery<>true`,
    );
    for(const m of manufacturers.rows){
      try {
        await this.discoverDocuments(m);
      } catch(e) {
        console.error('document_discovery_error',{
          manufacturer:m.name,error:(e as Error).message,
        });
      }
    }
    return 'DONE';
  }

  private async discoverDocuments(m:any):Promise<number>{
    const base=String(m.official_website);
    let host:string;
    try { host=new URL(base).hostname; } catch { return 0; }

    const pdfs=new Set<string>();

    // 1. sitemap — coleta todas as URLs do site
    const sitemapUrls=await this.fetchSitemapUrls(base,host);

    // 2. homepage — PDFs diretos + links internos
    try {
      const homepage=await this.http.acquire({
        url:base,allowedHosts:[],maxBytes:5_000_000,userAgent:BROWSER_UA,
      });
      const html=homepage.body.toString('utf8');
      for(const u of collectPdfs(html,homepage.finalUrl))pdfs.add(u);
      for(const u of collectInternalLinks(html,homepage.finalUrl,host))sitemapUrls.push(u);
    } catch {}

    // 3. visita todas as URLs candidatas procurando PDFs
    const candidates=[...new Set(sitemapUrls)]
      .filter(p=>PAGE_PATTERN.test(p))
      .slice(0,80);
    for(const path of candidates){
      if(pdfs.size>=40)break;
      try {
        const page=await this.http.acquire({
          url:path,allowedHosts:[],maxBytes:3_000_000,userAgent:BROWSER_UA,
        });
        for(const u of collectPdfs(page.body.toString('utf8'),page.finalUrl))pdfs.add(u);
      } catch {
        // segue
      }
    }

    // 4. baixa (prioriza PT/EN/ES, limite por fabricante)
    const preferred=[...pdfs].sort((a,b)=>langScore(a)-langScore(b));
    const seen=new Set<string>();
    let n=0;
    for(const url of preferred){
      if(n>=8)break;
      const clean=url.split('#')[0] ?? url;
      if(seen.has(clean))continue;
      seen.add(clean);
      if(await this.downloadDocument(clean,m))n++;
    }
    return n;
  }

  private async fetchSitemapUrls(base:string,host:string):Promise<string[]>{
    const out:string[]=[];
    const candidates=['/sitemap.xml','/sitemap_index.xml','/sitemap-index.xml','/sitemap/sitemap.xml'];
    for(const path of candidates){
      try {
        const r=await this.http.acquire({
          url:new URL(path,base).toString(),allowedHosts:[],maxBytes:3_000_000,
          userAgent:BROWSER_UA,
        });
        const xml=r.body.toString('utf8');
        let found=0;
        for(const m of xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)){
          const u=(m[1]??'').trim();
          if(!u)continue;
          try { const p=new URL(u); if(p.hostname===host){out.push(u);found++;} } catch {}
        }
        // sitemap index → um nível de recursão
        const subs=new Set<string>();
        for(const m of xml.matchAll(/<sitemap>\s*<loc>\s*([^<\s]+)\s*<\/loc>/g)){
          const su=(m[1]??'').trim();
          if(su)subs.add(su);
        }
        for(const su of subs){
          try {
            const sr=await this.http.acquire({
              url:su,allowedHosts:[],maxBytes:3_000_000,userAgent:BROWSER_UA,
            });
            for(const m2 of sr.body.toString('utf8').matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)){
              const u2=(m2[1]??'').trim();
              if(!u2)continue;
              try { const p=new URL(u2); if(p.hostname===host){out.push(u2);found++;} } catch {}
            }
          } catch {}
        }
        if(found>0)break;
      } catch {}
    }
    return out;
  }

  private async downloadDocument(url:string,m:any):Promise<boolean>{
    try {
      const doc=await this.http.acquire({
        url,allowedHosts:[],maxBytes:10_000_000,timeoutMs:30_000,userAgent:BROWSER_UA,
      });
      const mime=(doc.contentType ?? 'application/pdf').toLowerCase();
      if(!/pdf|octet-stream/.test(mime))return false;

      const sha=createHash('sha256').update(doc.body).digest('hex');
      const prior=await this.pool.query(
        `select id from media.media_asset where sha256=$1 limit 1`,[sha],
      );
      if(prior.rowCount){
        await this.linkIfMissing(prior.rows[0].id,m.id);
        return false;
      }

      const id=randomUUID();
      const key=`manuals/${m.slug}/${id}.pdf`;
      await this.s3.send(new PutObjectCommand({
        Bucket:this.bucket,Key:key,Body:doc.body,
        ContentType:'application/pdf',ContentLength:doc.body.byteLength,
      }));
      await this.pool.query(
        `insert into media.media_asset
         (id,kind,storage_key,mime_type,byte_size,sha256,rights_status,
          status,version,origin_type,attribution)
         values ($1,'DOCUMENT',$2,'application/pdf',$3,$4,'PENDING',
                 'ACTIVE',1,'MANUFACTURER_WEBSITE',$5)`,
        [id,key,doc.body.byteLength,sha,docTitle(url,m.name)],
      );
      await this.pool.query(
        `insert into media.media_rights
         (id,media_asset_id,status,basis,source_url,is_current,decided_by,decided_at)
         values (gen_random_uuid(),$1,'PENDING','REVIEW_REQUIRED',$2,
                 true,'catalog-document-discovery',now())`,
        [id,url],
      );
      await this.linkIfMissing(id,m.id);
      return true;
    } catch {
      return false;
    }
  }

  private async linkIfMissing(assetId:string,manufacturerId:string){
    await this.pool.query(
      `insert into media.media_link
       (id,media_asset_id,subject_type,subject_id,role,is_primary,sort_order)
       select gen_random_uuid(),$1,'MANUFACTURER',$2,'manual',false,0
        where not exists (
          select 1 from media.media_link
           where media_asset_id=$1 and subject_type='MANUFACTURER'
             and subject_id=$2 and role='manual'
        )`,
      [assetId,manufacturerId],
    );
  }
}

function collectPdfs(html:string,base:string):string[]{
  const out:string[]=[];
  for(const raw of html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi)){
    const href=raw[1];
    if(!href)continue;
    if(!/\.pdf(\?|#|$)/i.test(href))continue;
    try { out.push(new URL(href,base).toString()); } catch {}
  }
  return out;
}

function collectInternalLinks(html:string,base:string,host:string):string[]{
  const out:string[]=[];
  const seen=new Set<string>();
  for(const raw of html.matchAll(/<a[^>]+href=["']([^"']+)["']/gi)){
    const href=raw[1];
    if(!href)continue;
    let abs:string;
    try { abs=new URL(href,base).toString(); } catch { continue; }
    let u:URL;
    try { u=new URL(abs); } catch { continue; }
    if(u.hostname!==host)continue;
    const path=u.pathname;
    if(!path||path==='/')continue;
    if(/(login|account|cart|search|blog|policy|privacy|contact|wishlist)/i.test(path))continue;
    if(/\.(css|js|png|jpe?g|svg|gif|ico|woff2?|pdf)/i.test(path))continue;
    if(seen.has(path))continue;
    seen.add(path);
    out.push(abs);
  }
  return out;
}

function docTitle(url:string,manufacturer:string):string{
  try {
    const p=new URL(url).pathname;
    const seg=p.split('/').filter(Boolean).pop() ?? '';
    const name=decodeURIComponent(seg).replace(/\.pdf(\?.*)?$/i,'')
      .replace(/[-_]+/g,' ').trim();
    if(name)return `${manufacturer} — ${name}`;
  } catch {}
  return `${manufacturer} — Manual`;
}

// Prioriza manuais em PT/EN/ES sobre outros idiomas europeus.
function langScore(url:string):number{
  const base=url.split('/').pop() ?? '';
  if(/\b(PT|EN|ES|BR)\b/i.test(base))return 0;
  if(/\b(DE|FR|IT|NL|PL|HU|FI|EL|CS|DA|SV|NO|RU|JA|KO|ZH)\b/i.test(base))return 2;
  return 1;
}
