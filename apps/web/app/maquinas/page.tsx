import {MachineFilters} from '../../components/machine-filters';
import {ProductCard} from '../../components/product-card';
import {SiteHeader} from '../../components/site-header';
import {api} from '../../lib/api';

export default async function Machines({searchParams}:{searchParams:Promise<any>}){
 const sp=await searchParams;
 const qs=new URLSearchParams();
 Object.entries(sp).forEach(([k,v])=>typeof v==='string'&&qs.set(k,v));
 const [data,facets]=await Promise.all([
  api(`/public/products?${qs}`),api(`/public/products/facets?${qs}`)
 ]);
 return <><SiteHeader/><main className="shell catalogPage">
  <header className="catalogHead"><div><p className="accent">CATÁLOGO</p>
   <h1>Máquinas de tatuagem</h1><p className="muted">Compare tecnologias, especificações e ofertas com dados rastreáveis.</p></div>
   <span className="muted">{data.meta?.total??data.items?.length??0} resultados</span>
  </header>
  <div className="catalogLayout"><MachineFilters facets={facets}/>
   <section><div className="grid catalogProducts">
    {(data.items??[]).map((p:any)=><ProductCard key={p.id} p={p}/>)}
   </div><CursorPager meta={data.meta}/></section>
  </div>
 </main></>
}
function CursorPager({meta}:any){if(!meta?.nextCursor)return null;
 const p=new URLSearchParams();p.set('cursor',meta.nextCursor);
 return <div className="pager"><a className="btn secondary" href={`?${p}`}>Carregar próxima página</a></div>}
