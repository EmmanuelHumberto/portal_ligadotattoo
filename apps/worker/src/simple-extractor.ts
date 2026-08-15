import type {ContentExtractor} from './ingestion/extraction.handler';

export class SimpleContentExtractor implements ContentExtractor {
  async extract(input:{contentType:string|null;body:Buffer;url:string}) {
    const raw=input.body.toString('utf8');
    if (input.contentType?.includes('json')) {
      const parsed=JSON.parse(raw) as unknown;
      return {text:JSON.stringify(parsed),structured:{document:parsed}};
    }

    const title=decodeEntities(
      /<title[^>]*>([\s\S]*?)<\/title>/i.exec(raw)?.[1]?.trim() ?? '',
    ) || undefined;
    const text=decodeEntities(raw
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,' ')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,' ')
      .replace(/<[^>]+>/g,' ')
      .replace(/\s+/g,' ')
      .trim());
    const links=[...raw.matchAll(/<a[^>]+href=["']([^"']+)["']/gi)]
      .map(m=>decodeEntities(m[1] ?? ''))
      .filter(h=>h && !/^(#|javascript:|mailto:|tel:)/i.test(h));
    const ogImage=/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i.exec(raw)?.[1]
      ?? /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i.exec(raw)?.[1];
    const images=[...raw.matchAll(/<img[^>]+src=["']([^"']+)["']/gi)]
      .map(m=>decodeEntities(m[1] ?? ''))
      .filter(h=>h && !/^(#|data:|javascript:)/i.test(h))
      .filter(u=>!/(favicon|\.svg|\.gif|logo|brand|icon|tracking|pixel|ct\.pinterest|facebook\.com\/tr|google|profile|avatar|ie6countdown|warning|banner)/i.test(u))
      .map(u=>{try{return new URL(u,input.url).toString();}catch{return u;}});
    const price=extractPrice(raw);
    return {title,text,links,structured:{
      sourceUrl:input.url,ogImage:ogImage?decodeEntities(ogImage):undefined,
      images,price:price?.amount,currency:price?.currency,
    }};
  }
}

function extractPrice(raw:string):{amount:number;currency:string}|null{
  const ogAmount=/<meta[^>]+property=["'](?:og:price:amount|product:price:amount)["'][^>]+content=["']([^"']+)["']/i.exec(raw)?.[1];
  const ogCur=/<meta[^>]+property=["'](?:og:price:currency|product:price:currency)["'][^>]+content=["']([^"']+)["']/i.exec(raw)?.[1];
  if(ogAmount){
    const amount=parsePrice(ogAmount);
    if(amount!=null)return {amount,currency:(ogCur||'USD').toUpperCase()};
  }
  for(const m of raw.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)){
    const ld=m[1];
    if(!ld)continue;
    try{
      const r=findPriceInJson(JSON.parse(ld));
      if(r)return r;
    }catch{}
  }
  return null;
}

function findPriceInJson(node:any):{amount:number;currency:string}|null{
  if(!node||typeof node!=='object')return null;
  if(Array.isArray(node)){
    for(const x of node){const r=findPriceInJson(x);if(r)return r;}
    return null;
  }
  if(node.price!=null && typeof node.price!=='object'){
    const amount=typeof node.price==='string'?parsePrice(node.price):Number(node.price);
    if(amount!=null && !Number.isNaN(amount))
      return {amount,currency:String(node.priceCurrency||'USD').toUpperCase()};
  }
  for(const key of ['offers','@graph','mainEntity']){
    if(node[key]){const r=findPriceInJson(node[key]);if(r)return r;}
  }
  return null;
}

function parsePrice(s:string):number|null{
  const cleaned=String(s).trim().replace(/[^\d.,]/g,'');
  if(!cleaned)return null;
  if(cleaned.includes(',')&&cleaned.includes('.')){
    // vírgula de milhar + ponto decimal (ex.: 1,149.99)
    const n=parseFloat(cleaned.replace(/,/g,''));
    return Number.isNaN(n)?null:n;
  }
  if(cleaned.includes(',')){
    // vírgula decimal europeu (ex.: 697,56)
    const n=parseFloat(cleaned.replace(/\./g,'').replace(',','.'));
    return Number.isNaN(n)?null:n;
  }
  const n=parseFloat(cleaned);
  return Number.isNaN(n)?null:n;
}

function decodeEntities(value:string) {
  return value
    .replace(/&nbsp;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/&lt;/gi,'<')
    .replace(/&gt;/gi,'>')
    .replace(/&quot;/gi,'"')
    .replace(/&#39;/gi,"'")
    .replace(/&ndash;/gi,'–')
    .replace(/&mdash;/gi,'—')
    .replace(/&rsquo;/gi,'’')
    .replace(/&lsquo;/gi,'‘')
    .replace(/&ldquo;/gi,'“')
    .replace(/&rdquo;/gi,'”');
}
