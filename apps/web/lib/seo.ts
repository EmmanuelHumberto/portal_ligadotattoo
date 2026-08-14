import type {Metadata} from 'next';
import {SITE,absolute} from './site';

export function pageMetadata(input:{
 title:string;description:string;path:string;image?:string;
 noindex?:boolean;type?:'website'|'article';
}):Metadata{
 const canonical=absolute(input.path);
 return {
  title:`${input.title} | ${SITE.name}`,
  description:input.description,
  alternates:{canonical},
  robots:input.noindex?{index:false,follow:true}:{index:true,follow:true},
  openGraph:{
   type:input.type??'website',locale:SITE.locale,url:canonical,
   siteName:SITE.name,title:input.title,description:input.description,
   images:input.image?[{url:absolute(input.image)}]:undefined,
  },
  twitter:{
   card:'summary_large_image',title:input.title,
   description:input.description,
   images:input.image?[absolute(input.image)]:undefined,
  },
 };
}

export function filteredCatalogMetadata(search:Record<string,unknown>):Metadata{
 const hasFilters=Object.keys(search).some(k=>k!=='page');
 return pageMetadata({
  title:'Máquinas de tatuagem',
  description:'Explore e compare máquinas de tatuagem com especificações e ofertas.',
  path:'/maquinas',
  noindex:hasFilters,
 });
}

export function editorialMetadata(item:any,type:'NEWS'|'BLOG'|'EVENT'):Metadata{
 const basePath=type==='NEWS'?'/noticias':type==='EVENT'?'/eventos':'/blog';
 return pageMetadata({
  title:item.title??'',
  description:item.summary??'',
  path:`${basePath}/${item.slug}`,
  image:item.coverUrl,
  type:'article',
 });
}
