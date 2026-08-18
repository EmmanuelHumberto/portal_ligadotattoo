import {MachineFilters} from './machine-filters';
import {ProductCard} from './product-card';
import {SiteHeader} from './site-header';
import {api} from '../lib/api';
import type {
 CatalogFacets,PageMeta,ProductPage,SearchParams,
} from '../lib/public-api-contracts';

export async function CatalogPage({searchParams,defaultType,path,title,description,showType=true}:{
  searchParams:Promise<SearchParams>;defaultType:string;path:string;
  title:string;description:string;showType?:boolean;
}){
 const sp=await searchParams;
 const qs=new URLSearchParams();
 Object.entries(sp).forEach(([k,v])=>typeof v==='string'&&qs.set(k,v));
 if(!qs.has('productType'))qs.set('productType',defaultType);
 if(!qs.has('limit'))qs.set('limit','48');
 const [data,facets]=await Promise.all([
  api<ProductPage>(`/public/products?${qs}`,{cache:'no-store'}),
  api<CatalogFacets>(`/public/products/facets?${qs}`,{cache:'no-store'}),
 ]);
 return <><SiteHeader/><main className="shell catalogPage">
  <header className="catalogHead"><div><p className="accent">CATÁLOGO</p>
   <h1>{title}</h1><p className="muted">{description}</p></div>
   <span className="muted">{data.meta?.total??data.items?.length??0} produtos publicados</span>
  </header>
  <div className="catalogLayout"><MachineFilters key={path} facets={facets} path={path} showType={showType}/>
   <section><div className="grid catalogProducts">
    {data.items.map(p=><ProductCard key={p.id} p={p}/>) }
   </div><CursorPager meta={data.meta} query={qs} path={path}/></section>
  </div>
 </main></>
}
function CursorPager({meta,query,path}:{meta:PageMeta;query:URLSearchParams;path:string}){
 if(!meta?.nextCursor&&!query.has('cursor'))return null;
 const next=new URLSearchParams(query);
 if(meta.nextCursor)next.set('cursor',meta.nextCursor);
 const first=new URLSearchParams(query);first.delete('cursor');
 return <div className="pager">
  {query.has('cursor')&&<a className="btn secondary" href={`${path}?${first}`}>Voltar ao início</a>}
  {meta.nextCursor&&<a className="btn secondary" href={`${path}?${next}`}>Próxima página</a>}
 </div>
}
