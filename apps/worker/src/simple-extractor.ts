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
      .filter(u=>!/(favicon|\.svg|\.gif|logo|brand|icon|tracking|pixel|ct\.pinterest|facebook\.com\/tr|google|profile|avatar)/i.test(u))
      .map(u=>{try{return new URL(u,input.url).toString();}catch{return u;}});
    return {title,text,links,structured:{sourceUrl:input.url,ogImage:ogImage?decodeEntities(ogImage):undefined,images}};
  }
}

function decodeEntities(value:string) {
  return value
    .replace(/&nbsp;/gi,' ')
    .replace(/&amp;/gi,'&')
    .replace(/&lt;/gi,'<')
    .replace(/&gt;/gi,'>')
    .replace(/&quot;/gi,'"')
    .replace(/&#39;/gi,"'");
}
