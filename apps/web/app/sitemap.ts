import type {MetadataRoute} from 'next';
import {SITE} from '../lib/site';
import {api} from '../lib/api';

export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 const [products,editorial,events]=await Promise.all([
  api('/public/seo/products').catch(()=>({items:[]})),
  api('/public/seo/editorial').catch(()=>({items:[]})),
  api('/public/seo/events').catch(()=>({items:[]})),
 ]);
 const staticPaths=['/','/maquinas','/marcas','/noticias','/blog','/eventos','/ofertas'];
 const rows:MetadataRoute.Sitemap=staticPaths.map(path=>({
  url:SITE.url+path,changeFrequency:path==='/'?'daily':'weekly',
  priority:path==='/'?1:.8,
 }));
 for(const p of products.items??[])rows.push({
  url:`${SITE.url}/maquinas/${p.slug}`,
  lastModified:p.updatedAt?new Date(p.updatedAt):undefined,
  changeFrequency:'weekly',priority:.8,
 });
 for(const x of editorial.items??[])rows.push({
  url:`${SITE.url}/${x.contentType==='NEWS'?'noticias':'blog'}/${x.slug}`,
  lastModified:x.updatedAt?new Date(x.updatedAt):undefined,
  changeFrequency:'weekly',priority:.7,
 });
 for(const e of events.items??[])rows.push({
  url:`${SITE.url}/eventos/${e.slug}`,
  lastModified:e.updatedAt?new Date(e.updatedAt):undefined,
  changeFrequency:'weekly',priority:.7,
 });
 return rows;
}
