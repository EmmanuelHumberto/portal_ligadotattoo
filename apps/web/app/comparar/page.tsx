import {api} from '../../lib/api';
import {SiteHeader} from '../../components/site-header';

export default async function Compare({searchParams}:{searchParams:Promise<any>}){
 const {ids=''}=await searchParams;
 const clean=String(ids).split(',').filter(Boolean).slice(0,4);
 const data=clean.length?await api(`/public/products/compare?ids=${clean.join(',')}`):{items:[]};
 const rows=collect(data.items??[]);
 return <><SiteHeader/><main className="shell comparePage">
  <p className="accent">COMPARADOR</p><h1>Compare máquinas lado a lado</h1>
  {!data.items?.length?<div className="card emptyState">Adicione até quatro máquinas para comparar.</div>:
  <div className="compareTable" role="region" aria-label="Comparação de máquinas" tabIndex={0}>
   <table><thead><tr><th>Característica</th>{data.items.map((p:any)=><th key={p.id}>{p.name}<small>{p.brand?.name}</small></th>)}</tr></thead>
   <tbody>{rows.map((r:any)=><tr key={r.key}><th>{r.label}</th>{data.items.map((p:any)=><td key={p.id}>{value(p,r.key)}</td>)}</tr>)}</tbody></table>
  </div>}
 </main></>
}
function collect(items:any[]){const m=new Map();for(const p of items)for(const s of p.specifications??[])m.set(s.key,{key:s.key,label:s.label});return [...m.values()]}
function value(p:any,key:string){return p.specifications?.find((x:any)=>x.key===key)?.value??'—'}
