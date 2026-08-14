import { Pool } from 'pg';
import { createHash, randomUUID } from 'node:crypto';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import type { JobHandler, JobResult } from '../job-runner';
import { HttpAcquirer } from '../ingestion/http-acquirer';
import { SimpleContentExtractor } from '../simple-extractor';

const IMAGE_EXT:Record<string,string>={
  'image/jpeg':'jpg','image/png':'png','image/webp':'webp','image/avif':'avif',
};

export class CatalogDiscoveryHandler implements JobHandler {
  readonly type='catalog.discover_machines';

  constructor(
    private readonly pool:Pool,
    private readonly http:HttpAcquirer,
    private readonly extractor:SimpleContentExtractor,
    private readonly s3:S3Client,
    private readonly bucket:string,
  ) {}

  async handle():Promise<JobResult>{
    const manufacturers=await this.pool.query(
      `select id,name,slug,official_website from catalog.manufacturer
        where official_website is not null and slug<>'fixture-tattoo-labs'`,
    );
    let created=0;
    for(const m of manufacturers.rows){
      try {
        created+=await this.discover(m);
      } catch {
        // segue para o próximo fabricante
      }
    }
    return 'DONE';
  }

  private async discover(m:any):Promise<number>{
    const base=String(m.official_website).replace(/\/$/,'');
    const pages=[
      base,
      `${base}/tattoo-machines`,`${base}/machines`,`${base}/pages/machines`,
      `${base}/cartridges`,`${base}/power-supplies`,`${base}/batteries`,
      `${base}/accessories`,`${base}/grips`,`${base}/needles`,
      `${base}/supplies`,`${base}/inks`,
    ];
    const seen=new Set<string>();
    const links:string[]=[];
    for(const pageUrl of pages){
      let html:string;
      try { html=await this.fetchHtml(pageUrl); } catch { continue; }
      for(const url of extractProductLinks(html,pageUrl)){
        if(!seen.has(url)){ seen.add(url); links.push(url); }
      }
    }
    let created=0;
    for(const url of links.slice(0,80)){
      try { if(await this.ingestProduct(m,url))created++; } catch {}
    }
    return created;
  }

  private async fetchHtml(url:string):Promise<string>{
    const r=await this.http.acquire({url,allowedHosts:[],maxBytes:3_000_000});
    return r.body.toString('utf8');
  }

  private async ingestProduct(m:any,url:string):Promise<boolean>{
    let html:string;
    try { html=await this.fetchHtml(url); } catch { return false; }

    const extracted=await this.extractor.extract({
      contentType:'text/html',body:Buffer.from(html),url,
    });
    const name=cleanProductName(extracted.title ?? '');
    if(!name || isNoise(name))return false;
    const structured=(extracted.structured ?? {}) as Record<string,unknown>;
    const image=(structured.ogImage
      ?? (Array.isArray(structured.images)?structured.images[0]:undefined)) as string|undefined;
    const slug=slugify(name);

    // product_model (dedup por manufacturer + slug)
    let productId=null;
    const existing=await this.pool.query(
      `select id from catalog.product_model
        where manufacturer_id=$1 and slug=$2 limit 1`,[m.id,slug],
    );
    if(existing.rowCount){
      productId=existing.rows[0].id;
    } else {
      const pm=await this.pool.query(
        `insert into catalog.product_model
         (id,manufacturer_id,product_type_key,name,normalized_name,slug,
          model_code,lifecycle,version)
         values ($1,$2,$5,$3,lower($3),$4,null,'ACTIVE',1)
         returning id`,
        [randomUUID(),m.id,name,slug,classifyProductType(name)],
      );
      productId=pm.rows[0].id;
    }

    // listing (dedup por normalized_url)
    await this.pool.query(
      `insert into commerce.listing
       (id,seller_id,product_model_id,external_id,url,normalized_url,
        affiliate_mode,availability,status,last_observed_at,version)
       select $1, s.id, $2, $3, $4, $4, 'NONE','IN_STOCK','ACTIVE',now(),1
         from commerce.seller s
        where s.slug=$5
          and not exists (
            select 1 from commerce.listing li
             where li.normalized_url=$4
          )`,
      [randomUUID(),productId,slug,url,m.slug],
    );

    const hasImg=await this.pool.query(
      `select 1 from media.media_link
        where subject_type='PRODUCT_MODEL' and subject_id=$1 limit 1`,[productId],
    );
    if(!hasImg.rowCount && image){
      const mediaId=await this.downloadImage(image,String(m.name));
      if(mediaId){
        await this.pool.query(
          `insert into media.media_link
           (id,media_asset_id,subject_type,subject_id,role,is_primary,sort_order)
           select gen_random_uuid(),$1,'PRODUCT_MODEL',$2,'hero',true,0
            where not exists (
              select 1 from media.media_link
               where subject_type='PRODUCT_MODEL' and subject_id=$2
            )`,
          [mediaId,productId],
        );
      }
    }
    return true;
  }

  private async downloadImage(url:string,attribution:string):Promise<string|null>{
    try {
      const img=await this.http.acquire({
        url,allowedHosts:[],maxBytes:8_000_000,timeoutMs:20_000,
      });
      const mime=img.contentType ?? 'image/jpeg';
      if(!mime.startsWith('image/'))return null;
      const ext=IMAGE_EXT[mime] ?? 'jpg';
      const id=randomUUID();
      const key=`catalog/${id}.${ext}`;
      const sha=createHash('sha256').update(img.body).digest('hex');
      await this.s3.send(new PutObjectCommand({
        Bucket:this.bucket,Key:key,Body:img.body,
        ContentType:mime,ContentLength:img.body.byteLength,
      }));
      await this.pool.query(
        `insert into media.media_asset
         (id,kind,storage_key,mime_type,byte_size,sha256,rights_status,
          status,version,origin_type,attribution)
         values ($1,'IMAGE',$2,$3,$4,$5,'PERMITTED','ACTIVE',1,
                 'MANUFACTURER_PRODUCT_PAGE',$6)`,
        [id,key,mime,img.body.byteLength,sha,attribution],
      );
      await this.pool.query(
        `insert into media.media_rights
         (id,media_asset_id,status,basis,is_current,decided_by,decided_at)
         values (gen_random_uuid(),$1,'PERMITTED','MANUFACTURER_PUBLIC_IMAGE',
                 true,'system',now())`,
        [id],
      );
      return id;
    } catch {
      return null;
    }
  }
}

function extractProductLinks(html:string,baseUrl:string):string[]{
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
    const segs=path.split('/').filter(Boolean);
    if(!segs.length)continue;
    // utilitários/coleções amplas não são produtos individuais
    if(segs.some(s=>['login','cart','account','search','blog','news','about',
      'contact','collections','pages','pmu','smp','cosmetic'].includes(s)))
      continue;
    if(/machine|machines|rotary|pen\b|cartridge|needle|grip|power|battery|supply|ink|cable|rca|clip\b|nova|hawk|wand|spektra|flux|xion|\bexo\b|mast|flite|stigma|torque|equalizer|proton/i.test(path)){
      const key=url.origin+url.pathname.replace(/\/$/,'');
      if(!seen.has(key)){
        seen.add(key);
        out.push(key);
      }
    }
  }
  return out;
}

function isNoise(name:string):boolean{
  const n=name.toLowerCase();
  if(n.includes('▾'))return true;
  if(/para tatuar|comodidad|robustos|ergonômicos|fácil de limpar/i.test(n))return true;
  return /comparison|tattoo machines|rotary machines|stencil printer|wireless thermal/i.test(n);
}

function classifyProductType(name:string):string{
  const n=name.toLowerCase();
  if(/cartridge/i.test(n) && !/machine/i.test(n)) return 'CARTRIDGE';
  if(/power supply|power box|power pack|power unit|fonte/i.test(n) && !/machine/i.test(n)) return 'POWER_SUPPLY';
  if(/battery|batteries|powerbolt|power bolt/i.test(n) && !/machine|pen|rotary/i.test(n)) return 'BATTERY';
  if(/machine|tattoo pen|rotary|wand|shader|packer|liner|coil/i.test(n)) return 'PEN';
  return 'ACCESSORY';
}

function cleanProductName(rawTitle:string):string|null{
  const raw=rawTitle.replace(/\s+/g,' ').trim();
  if(!raw)return null;
  // nome antes do separador "|" ou "–"
  const first=raw.split(/\s[|–—]\s/)[0];
  const name=(first ?? raw).trim();
  if(name.length<3 || name.length>80)return null;
  return name;
}

function slugify(value:string){
  return value.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'') || 'machine';
}
