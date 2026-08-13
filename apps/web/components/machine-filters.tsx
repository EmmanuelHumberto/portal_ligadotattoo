'use client';
import {useRouter,useSearchParams} from 'next/navigation';
import {useState} from 'react';
import {track} from '../lib/analytics';

export function MachineFilters({facets}:{facets:any}){
 const router=useRouter();const current=useSearchParams();
 const [draft,setDraft]=useState(()=>Object.fromEntries(current.entries()));

 function apply(){
  const p=new URLSearchParams();
  Object.entries(draft).forEach(([k,v])=>v&&p.set(k,String(v)));
  p.delete('cursor');
  track('filter_apply',{filterCount:[...p.keys()].length});
  router.push(`/maquinas?${p.toString()}`);
 }
 function set(k:string,v:string){setDraft(x=>({...x,[k]:v}))}

 return <aside className="card filters">
  <h2>Refinar máquinas</h2>
  <Select label="Marca" value={draft.manufacturer??''}
   values={facets.brands??[]} onChange={(v:string)=>set('manufacturer',v)}/>
  <Select label="Tipo" value={draft.productType??''}
   values={facets.types??[]} onChange={(v:string)=>set('productType',v)}/>
  <Select label="Aplicação" value={draft.application??''}
   values={facets.applications??[]} onChange={(v:string)=>set('application',v)}/>
  <Select label="Faixa de preço" value={draft.price??''}
   values={facets.priceBands??[]} onChange={(v:string)=>set('price',v)}/>
  <button className="btn" onClick={apply}>Aplicar filtros</button>
  <button className="textButton" onClick={()=>router.push('/maquinas')}>
   Limpar filtros
  </button>
 </aside>
}
function Select({label,value,values,onChange}:any){
 return <label>{label}<select value={value}
  onChange={e=>onChange(e.target.value)}>
  <option value="">Todos</option>
  {values.map((x:any)=><option key={x.value??x} value={x.value??x}>
   {x.label??x}{x.count!=null?` (${x.count})`:''}
  </option>)}
 </select></label>
}
