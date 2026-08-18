'use client';
import {useRouter,useSearchParams} from 'next/navigation';
import {useState} from 'react';
import {track} from '../lib/analytics';
import type {CatalogFacet,CatalogFacets} from '../lib/public-api-contracts';

export function MachineFilters({facets,path='/maquinas',showType=true}:{
  facets:CatalogFacets;path?:string;showType?:boolean;
}){
 const router=useRouter();const current=useSearchParams();
 const [draft,setDraft]=useState(()=>Object.fromEntries(current.entries()));

 function apply(){
  const p=new URLSearchParams();
  Object.entries(draft).forEach(([k,v])=>v&&p.set(k,String(v)));
  p.delete('cursor');
  track('filter_apply',{filterCount:[...p.keys()].length});
  router.push(`${path}?${p.toString()}`);
 }
 function set(k:string,v:string){setDraft(x=>({...x,[k]:v}))}

 return <aside className="card filters">
  <h2>Refinar</h2>
  <Select label="Marca" value={draft.manufacturer??''}
   values={facets.brands??[]} onChange={(v:string)=>set('manufacturer',v)}/>
  {showType&&<Select label="Tipo" value={draft.productType??''}
   values={facets.types??[]} onChange={(v:string)=>set('productType',v)}/>}
  <button className="btn" onClick={apply}>Aplicar filtros</button>
  <button className="textButton" onClick={()=>router.push(path)}>
   Limpar filtros
  </button>
 </aside>
}
function Select({label,value,values,onChange}:{
 label:string;value:string;values:CatalogFacet[];onChange:(value:string)=>void;
}){
 return <label>{label}<select value={value}
  onChange={e=>onChange(e.target.value)}>
  <option value="">Todos</option>
  {values.map(x=><option key={x.value} value={x.value}>
   {x.label}{x.count!=null?` (${x.count})`:''}
  </option>)}
 </select></label>
}
