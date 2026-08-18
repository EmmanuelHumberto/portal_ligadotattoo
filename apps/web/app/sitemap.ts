import type {MetadataRoute} from 'next';
import {connection} from 'next/server';
import {SITE} from '../lib/site';
import {api} from '../lib/api';
import type {EditorialPage,ProductPage} from '../lib/public-api-contracts';

export default async function sitemap():Promise<MetadataRoute.Sitemap>{
 await connection();
 const [products,editorial,events]=await Promise.all([
  api<ProductPage>('/public/products?limit=100')
   .catch(()=>({items:[],meta:{}})),
  api<EditorialPage>('/public/editorial')
   .catch(()=>({items:[],meta:{}})),
  api<EditorialPage>('/public/editorial?type=EVENT')
   .catch(()=>({items:[],meta:{}})),
 ]);
 const staticPaths=['/','/maquinas','/fontes','/acessorios','/cartuchos','/tintas','/marcas','/noticias','/blog','/eventos','/ofertas'];
 const rows:MetadataRoute.Sitemap=staticPaths.map(path=>({
  url:SITE.url+path,changeFrequency:path==='/'?'daily':'weekly',
  priority:path==='/'?1:.8,
 }));
 for(const p of products.items??[])rows.push({
  url:`${SITE.url}/maquinas/${p.slug}`,
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
