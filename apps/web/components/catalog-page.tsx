import {MachineFilters} from './machine-filters';
import {ProductCard} from './product-card';
import {SiteHeader} from './site-header';
import {api} from '../lib/api';

export async function CatalogPage({searchParams,defaultType,path,title,description,showType=true}:{
  searchParams:Promise<any>;defaultType:string;path:string;
  title:string;description:string;showType?:boolean;
}){
 const sp=await searchParams;
 const qs=new URLSearchParams();
 Object.entries(sp).forEach(([k,v])=>typeof v==='string'&&qs.set(k,v));
 if(!qs.has('productType'))qs.set('productType',defaultType);
 const [data,facets]=await Promise.all([
  api(`/public/products?${qs}`),api(`/public/products/facets?${qs}`),
 ]);
 return <><SiteHeader/><main className="shell catalogPage">
  <header className="catalogHead"><div><p className="accent">CATÁLOGO</p>
   <h1>{title}</h1><p className="muted">{description}</p></div>
   <span className="muted">{data.meta?.total??data.items?.length??0} resultados</span>
  </header>
  <div className="catalogLayout"><MachineFilters key={path} facets={facets} path={path} showType={showType}/>
   <section><div className="grid catalogProducts">
    {(data.items??[]).map((p:any)=><ProductCard key={p.id} p={p}/>)}
   </div><CursorPager meta={data.meta}/></section>
  </div>
 </main></>
}
function CursorPager({meta}:any){
 if(!meta?.nextCursor)return null;
 const p=new URLSearchParams();p.set('cursor',meta.nextCursor);
 return <div className="pager"><a className="btn secondary" href={`?${p}`}>Carregar próxima página</a></div>
}
