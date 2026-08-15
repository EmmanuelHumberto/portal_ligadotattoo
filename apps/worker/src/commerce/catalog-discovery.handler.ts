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
  private machinesOnly=false;

  constructor(
    private readonly pool:Pool,
    private readonly http:HttpAcquirer,
    private readonly extractor:SimpleContentExtractor,
    private readonly s3:S3Client,
    private readonly bucket:string,
  ) {}

  async handle(payload:unknown):Promise<JobResult>{
    const p=(payload ?? {}) as Record<string,unknown>;
    this.machinesOnly=Boolean(p.machinesOnly);
    const slug=String(p.manufacturerSlug ?? '').trim();
    const manufacturers=await this.pool.query(
      `select id,name,slug,official_website from catalog.manufacturer
        where official_website is not null and slug<>'fixture-tattoo-labs'
          and not exclude_from_discovery
          and ($1::text='' or slug=$1)`,
      [slug],
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
    const shopify=await this.fetchShopifyProducts(base);
    if(shopify){
      let created=0;
      for(const p of shopify.slice(0,80)){
        try { if(await this.ingestShopifyProduct(m,base,p))created++; } catch {}
      }
      return created;
    }
    const vtex=await this.fetchVtexProducts(base);
    if(vtex){
      let created=0;
      for(const p of vtex.slice(0,80)){
        try { if(await this.ingestVtexProduct(m,base,p))created++; } catch {}
      }
      return created;
    }
    const sitemap=await this.fetchSitemapUrls(base);
    if(sitemap){
      let created=0;
      for(const url of sitemap.slice(0,80)){
        try { if(await this.ingestProduct(m,url))created++; } catch {}
      }
      return created;
    }
    const pages=[
      base,
      `${base}/tattoo-machines`,`${base}/machines`,`${base}/pages/machines`,
      `${base}/coil-machines`,`${base}/coil`,`${base}/tattoo-coil-machines`,
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

  private async fetchShopifyProducts(base:string):Promise<any[]|null>{
    try {
      const r=await this.http.acquire({
        url:`${base}/products.json?limit=250`,allowedHosts:[],maxBytes:5_000_000,timeoutMs:20_000,
      });
      const data=JSON.parse(r.body.toString('utf8'));
      return Array.isArray(data?.products) && data.products.length ? data.products : null;
    } catch {
      return null;
    }
  }

  private async fetchVtexProducts(base:string):Promise<any[]|null>{
    try {
      const r=await this.http.acquire({
        url:`${base}/api/catalog_system/pub/products/search?_from=0&_to=49`,
        allowedHosts:[],maxBytes:5_000_000,timeoutMs:20_000,
      });
      const data=JSON.parse(r.body.toString('utf8'));
      return Array.isArray(data) && data.length ? data : null;
    } catch {
      return null;
    }
  }

  private async ingestVtexProduct(m:any,base:string,p:any):Promise<boolean>{
    const raw=String(p.productName ?? '').trim();
    const name=cleanProductName(raw) ?? raw;
    const linkText=String(p.linkText ?? '');
    const url=`${base}/${linkText}/p`;
    const imageUrl=(Array.isArray(p.items) && p.items[0]?.images?.[0]?.imageUrl)
      ? String(p.items[0].images[0].imageUrl) : undefined;
    const tags=(Array.isArray(p.allSpecifications) ? p.allSpecifications : [])
      .map((x:unknown)=>String(x));
    if(p.brand)tags.push(String(p.brand));
    return this.persistProduct(m,{
      name,url,category:classifyProductType(name,p.brand,tags),
      imageUrl,description:cleanShopifyBody(p.description ?? ''),
    });
  }

  private async fetchSitemapUrls(base:string):Promise<string[]|null>{
    try {
      const r=await this.http.acquire({
        url:`${base}/sitemap.xml`,allowedHosts:[],maxBytes:2_000_000,timeoutMs:20_000,
      });
      const xml=r.body.toString('utf8');
      const locs=[...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)].map(m=>m[1] ?? '');
      if(!locs.length)return null;
      const isIndex=locs.some(l=>l.endsWith('.xml'));
      if(!isIndex)return locs.length ? locs : null;
      const productUrls:string[]=[];
      for(const loc of locs.filter(l=>l.endsWith('.xml'))){
        try {
          const sub=await this.http.acquire({
            url:loc,allowedHosts:[],maxBytes:2_000_000,timeoutMs:20_000,
          });
          const subXml=sub.body.toString('utf8');
          for(const m of subXml.matchAll(/<loc>([^<]+)<\/loc>/gi))
            if(m[1])productUrls.push(m[1]);
        } catch {}
      }
      return productUrls.length ? productUrls : null;
    } catch {
      return null;
    }
  }

  private async ingestShopifyProduct(m:any,base:string,p:any):Promise<boolean>{
    const rawTitle=String(p.title ?? '').trim();
    const name=cleanProductName(rawTitle) ?? rawTitle;
    if(!name || isNoise(name))return false;
    const handle=String(p.handle ?? '');
    const productType=String(p.product_type ?? '');
    const tags=Array.isArray(p.tags) ? p.tags.map((x:unknown)=>String(x)) : [];
    const imageUrl=Array.isArray(p.images) && p.images[0]?.src
      ? String(p.images[0].src) : undefined;
    return this.persistProduct(m,{
      name,url:handle?`${base}/products/${handle}`:base,
      category:classifyProductType(name,productType,tags),
      imageUrl,description:cleanShopifyBody(p.body_html),
    });
  }

  private async persistProduct(m:any,input:{
    name:string;url:string;category:string;imageUrl?:string;description?:string;
  }):Promise<boolean>{
    const name=input.name;
    const slug=slugify(name);
    if(!name || isNoise(name))return false;
    if(this.machinesOnly && !['PEN','ROTARY','COIL','POWER_SUPPLY','BATTERY'].includes(input.category)){
      return false;
    }

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
        [randomUUID(),m.id,name,slug,input.category],
      );
      productId=pm.rows[0].id;
    }

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
      [randomUUID(),productId,slug,input.url,m.slug],
    );

    if(input.imageUrl){
      const hasImg=await this.pool.query(
        `select 1 from media.media_link
          where subject_type='PRODUCT_MODEL' and subject_id=$1 limit 1`,[productId],
      );
      if(!hasImg.rowCount){
        const mediaId=await this.downloadImage(input.imageUrl,String(m.name));
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
    }

    if(input.description && input.description.length>20){
      const hasDesc=await this.pool.query(
        `select 1 from knowledge.canonical_fact
          where subject_type='PRODUCT_MODEL' and subject_id=$1
            and property_key='description' limit 1`,[productId],
      );
      if(!hasDesc.rowCount){
        await this.recordFact(productId,'description',input.description.slice(0,3000),null,input.url);
      }
      await this.recordSpecs(productId,input.description,input.url,input.category);
    }
    return true;
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
    const imageCandidates:string[]=[
      structured.ogImage,
      ...(Array.isArray(structured.images)?structured.images:[]),
    ].filter((x):x is string=>typeof x==='string' && !!x).slice(0,3);
    const slug=slugify(name);
    const category=classifyProductType(name);

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
        [randomUUID(),m.id,name,slug,category],
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
    if(!hasImg.rowCount){
      for(const image of imageCandidates){
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
          break;
        }
      }
    }
    try { await this.recordContent(productId,html,url,category); } catch {}
    return true;
  }

  private async recordContent(productId:string,html:string,sourceUrl:string,category='ACCESSORY'):Promise<void>{
    const metaDesc=extractMetaDescription(html);
    const pageText=cleanPageText(html);
    const desc=(metaDesc && metaDesc.length>20) ? metaDesc : (pageText.length>30 ? pageText : '');
    if(desc){
      const hasDesc=await this.pool.query(
        `select 1 from knowledge.canonical_fact
          where subject_type='PRODUCT_MODEL' and subject_id=$1
            and property_key='description' limit 1`,[productId],
      );
      if(!hasDesc.rowCount){
        await this.recordFact(productId,'description',desc.slice(0,3000),null,sourceUrl);
      }
      await this.recordSpecs(productId,desc,sourceUrl,category);
    }
  }

  private async recordSpecs(productId:string,text:string,sourceUrl:string,category='ACCESSORY'):Promise<void>{
    for(const s of extractTechnicalSpecs(text,category)){
      const key=s.key;
      const existing=await this.pool.query(
        `select 1 from knowledge.canonical_fact
          where subject_type='PRODUCT_MODEL' and subject_id=$1 and property_key=$2 limit 1`,[productId,key],
      );
      if(!existing.rowCount){
        await this.recordFact(productId,key,s.value,null,sourceUrl);
      }
    }
  }

  private async recordFact(
    productId:string,key:string,value:string,unit:string|null,sourceUrl:string,
  ):Promise<void>{
    const claimId=randomUUID();
    const proposalId=randomUUID();
    await this.pool.query(
      `insert into knowledge.claim
       (id,subject_type,subject_id,property_key,value,claimant_type,source_url,
        observed_at,confidence,status,version,created_at)
       values ($1,'PRODUCT_MODEL',$2,$3,$4::jsonb,'MANUFACTURER',$5,now(),0.7,
               'ACTIVE',1,now())`,
      [claimId,productId,key,JSON.stringify(value),sourceUrl],
    );
    await this.pool.query(
      `insert into knowledge.canonical_proposal
       (id,subject_type,subject_id,property_key,proposed_value,evidence_ids,status,
        created_by,created_at,decided_by,decided_at,decision_reason,version)
       values ($1,'PRODUCT_MODEL',$2,$3,$4::jsonb,ARRAY[$5]::uuid[],'APPROVED',
               'catalog',now(),'catalog',now(),'CATALOG_IMPORT',1)`,
      [proposalId,productId,key,JSON.stringify(value),claimId],
    );
    await this.pool.query(
      `insert into knowledge.canonical_fact
       (id,subject_type,subject_id,property_key,value,unit,valid_from,proposal_id,
        decided_by,decision_reason,version)
       values (gen_random_uuid(),'PRODUCT_MODEL',$1,$2,$3::jsonb,$4,now(),$5,
               'catalog','CATALOG_IMPORT',1)`,
      [productId,key,JSON.stringify(value),unit,proposalId],
    );
  }

  private async downloadImage(url:string,attribution:string):Promise<string|null>{
    try {
      // Muitos sites expõem og:image como http:// mesmo suportando https.
      const secureUrl=url.startsWith('http://') ? 'https://'+url.slice(7) : url;
      let img:any;
      try {
        img=await this.http.acquire({
          url:secureUrl,allowedHosts:[],maxBytes:8_000_000,timeoutMs:20_000,
        });
      } catch {
        // Retry após pausa (CDNs como vteximg aplicam rate limit / 429).
        await new Promise(r=>setTimeout(r,1200));
        img=await this.http.acquire({
          url:secureUrl,allowedHosts:[],maxBytes:8_000_000,timeoutMs:20_000,
        });
      }
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

export function extractProductLinks(html:string,baseUrl:string):string[]{
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
    if(/machine|machines|rotary|coil|pen\b|cartridge|needle|grip|power|battery|supply|ink|cable|rca|clip\b|nova|hawk|wand|spektra|flux|xion|\bexo\b|mast|flite|stigma|torque|equalizer|proton/i.test(path)){
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
  if(/^(coil machine|rotary & coil machine|rotary machine|wireless machine|power supplies?|traditional power supply|aftercare|tattoo ink mixer|tattoo ink cup|accessories?|cartridges?|needles?|grips?|inks?|machines?|supplies?)$/i.test(n))return true;
  return /comparison|tattoo machines|rotary machines|stencil printer|wireless thermal/i.test(n);
}

function classifyProductType(name:string,productType?:string,tags?:string[]):string{
  const n=name.toLowerCase();
  const t=(productType??'').toLowerCase();
  const g=(tags??[]).join(' ').toLowerCase();
  if(/cartridge|cartucho/i.test(n) && !/machine/i.test(n)) return 'CARTRIDGE';
  if(/power supply|power box|power pack|power unit|powerpack|fonte/i.test(n) && !/machine/i.test(n)) return 'POWER_SUPPLY';
  if(/battery|batteries|bateria|powerbolt|power bolt/i.test(n) && !/machine|pen|rotary/i.test(n)) return 'BATTERY';
  if(/\bcoil\b/i.test(`${n} ${t} ${g}`) && !/cores?\b|washers?\b|\bcoils\b/i.test(n)) return 'COIL';
  if(/rotary/i.test(`${n} ${g}`)) return 'ROTARY';
  if(/machine|tattoo pen|wireless pen|power pen|pen gun|tattoo gun|tattoo kit|\bpmu\b|wand|shader|packer|liner|\bpen\b/i.test(n)
     && !/grip|torsion|tube|needle|plier|pencil/i.test(n)) return 'PEN';
  if(/\bink\b|tinta|pigment|colour|color|greywash|graywash/i.test(n)
      && !/cup|cap|grip|cartridge|needle|cable|rca/i.test(n)) return 'INK';
  // Marcas/modelos de máquina reconhecidos mesmo sem "machine"/"pen"/"rotary" no nome.
  if(/linetion|sworder|flux|spektra|xion|hawk|bishop|cheyenne|critical|ambition|axys|vlad|equaliser|stigma|musotoku|kwadron/i.test(n)
      && !/cartridge|cartucho|needle|agulha|grip|ink|tinta|battery|power|fonte|cable|rca|cup|bandagem|anel|boné/i.test(n)) return 'PEN';
  return 'ACCESSORY';
}

export function cleanProductName(rawTitle:string):string|null{
  const raw=rawTitle.replace(/\s+/g,' ').trim();
  if(!raw)return null;
  // nome antes do separador "|", "–", "—" ou ":"
  let first=raw.split(/\s[|–—:]\s/)[0];
  first=(first ?? raw).trim();
  // remove sufixo de preço: " - $385.00" / " - R$ 280,00"
  first=first.replace(/\s*[-–—]\s*(R?\$\s?)?\d[\d.,]*\s*$/,'').trim();
  const name=first;
  if(name.length<3 || name.length>80)return null;
  return name;
}

export function slugify(value:string){
  return value.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'') || 'machine';
}

function cleanShopifyBody(bodyHtml:unknown):string{
  const html=typeof bodyHtml==='string' ? bodyHtml : '';
  if(!html)return '';
  return html
    .replace(/<(script|style|noscript|svg)[^>]*>[\s\S]*?<\/\1>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/&[a-z#0-9]+;/gi,' ')
    .replace(/\s+/g,' ')
    .trim();
}

function extractMetaDescription(html:string):string|null{
  const raw=/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i.exec(html)?.[1]
    ?? /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i.exec(html)?.[1];
  if(!raw)return null;
  return raw.replace(/▾/g,'·').replace(/\s+/g,' ').trim();
}

function cleanPageText(html:string):string{
  const main=/<main\b[^>]*>([\s\S]*?)<\/main>/i.exec(html)?.[1]
    ?? /<article\b[^>]*>([\s\S]*?)<\/article>/i.exec(html)?.[1]
    ?? html;
  return main
    .replace(/<(script|style|nav|header|footer|noscript|svg|form|aside)[^>]*>[\s\S]*?<\/\1>/gi,' ')
    .replace(/<div[^>]*class=["'][^"']*(?:collapse|dropdown|mega|menu)[^"']*["'][^>]*>[\s\S]*?<\/div>/gi,' ')
    .replace(/<img[^>]*>/gi,' ')
    .replace(/<[^>]+>/g,' ')
    .replace(/&[a-z#0-9]+;/gi,' ')
    .replace(/\s+/g,' ')
    .trim();
}

function extractSpecTable(html:string):Array<{key:string;value:string}>{
  const out:Array<{key:string;value:string}>=[];
  for(const t of html.matchAll(/<table[^>]*>([\s\S]*?)<\/table>/gi)){
    const body=t[1] ?? '';
    for(const r of body.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)){
      const row=r[1] ?? '';
      const cells=[...row.matchAll(/<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi)]
        .map(c=>(c[1] ?? '').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim())
        .filter(Boolean);
      if(cells.length>=2){
        out.push({key:cells[0] ?? '', value:cells.slice(1).join(' ')});
      }
    }
    if(out.length)break;
  }
  return out.slice(0,12);
}

function extractTechnicalSpecs(text:string,category='ACCESSORY'):Array<{key:string;value:string}>{
  const t=text.replace(/\s+/g,' ').trim();
  if(!t)return [];
  const out:Array<{key:string;value:string}>=[];
  const seen=new Set<string>();
  const add=(key:string,value:string|undefined)=>{
    const v=(value ?? '').trim();
    if(v && !seen.has(key)){ seen.add(key); out.push({key,value:v}); }
  };
  let m:RegExpExecArray|null;
  const isMachine=category==='PEN'||category==='ROTARY'||category==='COIL';

  // stroke (curso): apenas máquinas — "4 mm stroke", "stroke 2.4-4.2mm"
  if(isMachine){
    m=/stroke[^.\n]{0,60}?(\d+(?:[.,]\d+)?)(?:\s*(?:-|–|—|to|a)\s*(\d+(?:[.,]\d+)?))?\s*mm/i.exec(t);
    if(!m)m=/(\d+(?:[.,]\d+)?)(?:\s*(?:-|–|—|to)\s*(\d+(?:[.,]\d+)?))?\s*mm\s*(?:adjustable\s*)?stroke/i.exec(t);
    if(m)add('stroke',m[2]?`${m[1]}–${m[2]} mm`:`${m[1]} mm`);
  }

  // voltage (tensão): máquinas, baterias e fontes
  m=/(\d+(?:[.,]\d+)?)(?:\s*(?:-|–|—|to|and)\s*(\d+(?:[.,]\d+)?))?\s*(?:v|volts?)\b/i.exec(t);
  if(m)add('voltage_range',m[2]?`${m[1]}–${m[2]} V`:`${m[1]} V`);

  // motor type: apenas máquinas
  if(isMachine){
    m=/(coreless|brushless|swiss(?:-made)?\s+motor|maxon\s+motor|faubion\s+motor|dc\s+motor|swiss\s+motor)/i.exec(t);
    if(m)add('motor_type',m[1]);
    else {
      m=/motor[^.\n]{0,40}?(coreless|brushless)/i.exec(t);
      if(m)add('motor_type',m[1]);
    }
  }

  // rpm: apenas máquinas
  if(isMachine){
    m=/(\d[\d,.]*)\s*(?:rpm|rotations?\s*(?:per|a)\s*minute)/i.exec(t);
    if(m)add('rpm',`${m[1]} RPM`);
  }

  // battery capacity (mAh)
  m=/(\d+)\s*mah\b/i.exec(t);
  if(m)add('battery_capacity',`${m[1]} mAh`);

  // battery model (18500, 18650, 21700...)
  m=/\b(1[0-9]{4}|2[0-9]{4})\b/i.exec(t);
  if(m && /batter/i.test(t))add('battery',m[1]);

  // weight
  m=/weight[^.\n]{0,40}?(\d+(?:[.,]\d+)?)\s*(g|oz|grams?|ounces?)\b/i.exec(t);
  if(!m)m=/(\d+(?:[.,]\d+)?)\s*(g|oz|grams?|ounces?)\b/i.exec(t);
  if(m)add('weight',`${m[1]} ${m[2]}`);

  // material
  m=/(aircraft(?:-grade)?\s*(?:aluminum|aluminium)|aluminum|aluminium|titanium|brass|stainless\s*steel|copper|aerospace\s*(?:aluminum|aluminium))\b/i.exec(t);
  if(m)add('material',m[1]);

  // drive / transmission: apenas máquinas
  if(isMachine){
    m=/(direct\s*drive|swash\s*drive|swashdrive|gear\s*drive|linear\s*(?:rotary|drive)|cam\s*drive)/i.exec(t);
    if(m)add('drive',m[1]);
  }

  // stroke adjustability: apenas máquinas
  if(isMachine){
    if(/adjustable\s*(?:stroke|course)/i.test(t))add('stroke_type','Ajustável');
    else if(/fixed\s*(?:stroke|course)/i.test(t))add('stroke_type','Fixo');
  }

  // screen / display
  m=/(touch\s*screen|lcd|oled|led\s*display|digital\s*display|tft)/i.exec(t);
  if(m)add('screen',m[1]);

  // connectivity: apenas sem fio (bluetooth/wifi/wireless), não porta de carga
  m=/(bluetooth|ble|wifi|wi-fi|wireless)\b/i.exec(t);
  if(m)add('connectivity',m[1]);

  // porta de carga/alimentação (USB-C etc.) — não é conectividade sem fio
  m=/(usb-c|usb\s*type-c|type-c|usb)\b/i.exec(t);
  if(m)add('charge_port',(m[1] ?? '').toUpperCase());

  // runtime / charge time
  m=/(\d+(?:[.,]\d+)?)\s*(?:hours?|hrs?|h)\s*(?:charge|charging|runtime|of\s*power|battery\s*life)/i.exec(t);
  if(m)add('runtime',`${m[1]} h`);

  // ---- específicas por categoria ----

  if(category==='BATTERY'){
    m=/(\d+(?:[.,]\d+)?)\s*(?:hours?|hrs?|h)\s*(?:to\s*)?(?:charge|charging|recharge)/i.exec(t);
    if(m)add('charge_time',`${m[1]} h`);
  }

  if(category==='POWER_SUPPLY'){
    m=/(\d+(?:[.,]\d+)?)\s*w\b/i.exec(t);
    if(m)add('power',`${m[1]} W`);
    m=/output[^.\n]{0,30}?(\d+(?:[.,]\d+)?)\s*(?:v|volts?)\b/i.exec(t);
    if(m)add('output-voltage',`${m[1]} V`);
    m=/input[^.\n]{0,30}?(\d+(?:[.,]\d+)?)\s*(?:v|volts?)\b/i.exec(t);
    if(m)add('input-voltage',`${m[1]} V`);
  }

  if(category==='INK'){
    m=/(\d+)\s*(?:color|colour|cores|shades|colors?)/i.exec(t);
    if(m)add('colors',`${m[1]} cores`);
    m=/(\d+(?:[.,]\d+)?)\s*(?:ml|oz|fl\s*oz)\b/i.exec(t);
    if(m)add('volume',`${m[1]} ${/ml/i.test(m[0])?'ml':'oz'}`);
    m=/(water(?:-|\s*)based|alcohol(?:-|\s*)based|acrylic)/i.exec(t);
    if(m)add('base',m[1]);
    if(/vegan|cruelty(?:-|\s*)free/i.test(t))add('vegan','Sim');
    if(/steril(?:ized|e)|gamma|eo\s*(?:gas|sterilized)/i.test(t))add('sterile','Sim');
  }

  if(category==='CARTRIDGE'){
    m=/\b(\d+(?:\.\d+)?)\s*(RL|RS|RM|M1|M2|F)\b/i.exec(t);
    if(m)add('needle_config',m[0].trim());
    else {
      m=/(round\s*(?:liner|shader)|magnum|flat\s*(?:shader|magnum)|liner|shader)/i.exec(t);
      if(m)add('needle_config',m[1]);
    }
    m=/(\d+(?:[.,]\d+)?)\s*(?:pcs|pieces|pack|count|unid)/i.exec(t);
    if(m)add('quantity',m[1]);
    if(/steril(?:ized|e)|eo\s*(?:gas|sterilized)|gamma/i.test(t))add('sterile','Sim');
  }

  return out;
}

