import {absolute,SITE} from './site';
import type {
 EditorialContent,ProductDetail,PublicMedia,PublicOffer,
} from './public-api-contracts';

export function productJsonLd(p:ProductDetail,offers:PublicOffer[]=[]){
 const validOffers=offers.filter(x=>Number.isFinite(Number(x.amount)));
 return compact({
  '@context':'https://schema.org','@type':'Product',
  name:p.name,description:p.summary??p.description,
  image:imagesOf(p),
  brand:p.brand?.name?{'@type':'Brand',name:p.brand.name}:undefined,
  url:absolute(`/maquinas/${p.slug}`),
  offers:validOffers.length?validOffers.map(x=>({
   '@type':'Offer',price:String(x.amount),priceCurrency:x.currency,
   availability:availability(x.availability),
   url:absolute(x.outboundUrl),
   seller:{'@type':'Organization',name:x.seller},
  })):undefined,
 });
}
export function articleJsonLd(a:EditorialContent){
 return compact({
  '@context':'https://schema.org','@type':a.contentType==='NEWS'?'NewsArticle':'Article',
  headline:a.title,description:a.summary,datePublished:a.publishedAt,
  dateModified:a.updatedAt??a.publishedAt,
  image:imagesOf(a),
  mainEntityOfPage:absolute(`/${a.contentType==='NEWS'?'noticias':'blog'}/${a.slug}`),
  publisher:{'@type':'Organization',name:SITE.name,url:SITE.url},
 });
}
export function eventJsonLd(e:EditorialContent&{
 startsAt?:string;endsAt?:string|null;
 location?:{name?:string|null;address:string}|null;
}){
 return compact({
  '@context':'https://schema.org','@type':'Event',name:e.title,
  description:e.summary,startDate:e.startsAt,endDate:e.endsAt,
  eventStatus:'https://schema.org/EventScheduled',
  location:e.location?{
   '@type':'Place',name:e.location.name,address:e.location.address,
  }:undefined,
  image:imagesOf(e),
  url:absolute(`/eventos/${e.slug}`),
 });
}
function imagesOf(a:{media?:PublicMedia[];coverUrl?:string|null}){
 const media=(a.media??[]).map(x=>absolute(x.url));
 if(media.length)return media;
 return a.coverUrl?[absolute(a.coverUrl)]:undefined;
}
function availability(x:string){
 return x==='IN_STOCK'?'https://schema.org/InStock':
  x==='OUT_OF_STOCK'?'https://schema.org/OutOfStock':
  'https://schema.org/LimitedAvailability';
}
function compact(x:unknown):unknown{
 if(Array.isArray(x))return x.map(compact);
 if(x&&typeof x==='object')return Object.fromEntries(
  Object.entries(x as Record<string,unknown>)
   .filter(([,v])=>v!==undefined&&v!==null&&v!=='')
   .map(([k,v])=>[k,compact(v)])
 );
 return x;
}
