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
    return {title,text,structured:{sourceUrl:input.url}};
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
