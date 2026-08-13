'use client';
import {createContext,useContext,useMemo,useState} from 'react';
import {track} from '../lib/analytics';

type Item={id:string;slug:string;name:string;image?:string};
const C=createContext<any>(null);

export function CompareProvider({children}:{children:React.ReactNode}){
 const [items,setItems]=useState<Item[]>([]);
 const api=useMemo(()=>({
  items,
  add:(x:Item)=>setItems(old=>{
   if(old.some(i=>i.id===x.id)||old.length>=4)return old;
   track('compare_add',{productId:x.id});return [...old,x];
  }),
  remove:(id:string)=>setItems(old=>{
   track('compare_remove',{productId:id});return old.filter(x=>x.id!==id);
  }),
  clear:()=>setItems([]),
 }),[items]);
 return <C.Provider value={api}>{children}<CompareDock/></C.Provider>
}
export const useCompare=()=>useContext(C);

function CompareDock(){
 const c=useCompare();if(!c?.items.length)return null;
 return <div className="compareDock card">
  <strong>Comparar ({c.items.length}/4)</strong>
  <div>{c.items.map((x:Item)=><span key={x.id}>{x.name}
   <button aria-label={`Remover ${x.name}`} onClick={()=>c.remove(x.id)}>×</button>
  </span>)}</div>
  <a className="btn" href={`/comparar?ids=${c.items.map((x:Item)=>x.id).join(',')}`}>
   Comparar agora
  </a>
 </div>
}
