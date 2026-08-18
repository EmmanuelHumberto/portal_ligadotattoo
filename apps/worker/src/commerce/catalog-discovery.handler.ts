import { Pool } from 'pg';
import type {S3Client} from '@aws-sdk/client-s3';
import type { JobHandler, JobResult } from '../job-runner';
import { HttpAcquirer } from '../ingestion/http-acquirer';
import { SimpleContentExtractor } from '../simple-extractor';
import {
  classifyProductType,cleanPageText,cleanProductName,cleanShopifyBody,
  extractMetaDescription,extractProductLinks,isNoise,
} from './catalog-discovery.parsers';
import {CatalogAuthorityProposalWriter} from './catalog-authority-proposal.writer';
import {CatalogMediaImporter} from './catalog-media.importer';
import {
  CatalogProductDiscoveryWriter,type DiscoveryManufacturer,
} from './catalog-product-discovery.writer';
export {cleanProductName,extractProductLinks,slugify} from './catalog-discovery.parsers';

export class CatalogDiscoveryHandler implements JobHandler {
  readonly type='catalog.discover_machines';
  private machinesOnly=false;
  private readonly products:CatalogProductDiscoveryWriter;

  constructor(
    private readonly pool:Pool,
    private readonly http:HttpAcquirer,
    private readonly extractor:SimpleContentExtractor,
    s3:S3Client,
    bucket:string,
    authority?:CatalogAuthorityProposalWriter,
    mediaImporter?:CatalogMediaImporter,
    products?:CatalogProductDiscoveryWriter,
  ) {
    const authorityWriter=authority??new CatalogAuthorityProposalWriter(pool);
    const media=mediaImporter??new CatalogMediaImporter(pool,http,s3,bucket);
    this.products=products??new CatalogProductDiscoveryWriter(pool,media,authorityWriter);
  }

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
    for(const m of manufacturers.rows){
      try {
        await this.discover(m);
      } catch {
        // segue para o próximo fabricante
      }
    }
    return 'DONE';
  }

  private async discover(m:DiscoveryManufacturer&{official_website:string}):Promise<number>{
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

  private async ingestVtexProduct(m:DiscoveryManufacturer,base:string,p:any):Promise<boolean>{
    const raw=String(p.productName ?? '').trim();
    const name=cleanProductName(raw) ?? raw;
    const linkText=String(p.linkText ?? '');
    const url=`${base}/${linkText}/p`;
    const imageUrl=(Array.isArray(p.items) && p.items[0]?.images?.[0]?.imageUrl)
      ? String(p.items[0].images[0].imageUrl) : undefined;
    const tags=(Array.isArray(p.allSpecifications) ? p.allSpecifications : [])
      .map((x:unknown)=>String(x));
    if(p.brand)tags.push(String(p.brand));
    return this.products.persist(m,{
      name,url,category:classifyProductType(name,p.brand,tags),
      imageUrls:imageUrl?[imageUrl]:[],description:cleanShopifyBody(p.description ?? ''),
    },this.machinesOnly);
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

  private async ingestShopifyProduct(m:DiscoveryManufacturer,base:string,p:any):Promise<boolean>{
    const rawTitle=String(p.title ?? '').trim();
    const name=cleanProductName(rawTitle) ?? rawTitle;
    if(!name || isNoise(name))return false;
    const handle=String(p.handle ?? '');
    const productType=String(p.product_type ?? '');
    const tags=Array.isArray(p.tags) ? p.tags.map((x:unknown)=>String(x)) : [];
    const imageUrl=Array.isArray(p.images) && p.images[0]?.src
      ? String(p.images[0].src) : undefined;
    return this.products.persist(m,{
      name,url:handle?`${base}/products/${handle}`:base,
      category:classifyProductType(name,productType,tags),
      imageUrls:imageUrl?[imageUrl]:[],description:cleanShopifyBody(p.body_html),
    },this.machinesOnly);
  }

  private async ingestProduct(m:DiscoveryManufacturer,url:string):Promise<boolean>{
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
    const category=classifyProductType(name);
    const metaDesc=extractMetaDescription(html);
    const pageText=cleanPageText(html);
    const desc=(metaDesc && metaDesc.length>20) ? metaDesc : (pageText.length>30 ? pageText : '');
    return this.products.persist(m,{name,url,category,imageUrls:imageCandidates,
      description:desc||undefined},this.machinesOnly);
  }

}
