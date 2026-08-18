'use client';
import {createContext,useContext,useMemo,useState} from 'react';
import {track} from '../lib/analytics';

export type OfferItem={listingId:string;label:string;seller:string};
type OfferCompareContext={
 items:OfferItem[];add:(item:OfferItem)=>void;remove:(id:string)=>void;
 clear:()=>void;
};
const C=createContext<OfferCompareContext|null>(null);

export function OfferCompareProvider({children}:{children:React.ReactNode}){
 const [items,setItems]=useState<OfferItem[]>([]);
 const api=useMemo(()=>({
  items,
  add:(x:OfferItem)=>setItems(old=>{
   if(old.some(i=>i.listingId===x.listingId)||old.length>=4)return old;
   track('compare_add',{listingId:x.listingId});return [...old,x];
  }),
  remove:(id:string)=>setItems(old=>old.filter(x=>x.listingId!==id)),
  clear:()=>setItems([]),
 }),[items]);
 return <C.Provider value={api}>{children}<OfferCompareDock/></C.Provider>;
}
export const useOfferCompare=()=>useContext(C);

export function OfferCompareButton({item}:{item:OfferItem}){
 const c=useOfferCompare();
 if(!c)return null;
 const added=c.items.some(i=>i.listingId===item.listingId);
 return <button className="btn secondary" type="button" aria-pressed={added}
  onClick={()=>added?c.remove(item.listingId):c.add(item)}>
  {added?'Na comparação ✓':'Comparar preço'}
 </button>;
}

function OfferCompareDock(){
 const c=useOfferCompare();if(!c?.items.length)return null;
 return <div className="compareDock card">
  <strong>Comparar preços ({c.items.length}/4)</strong>
  <div>{c.items.map(x=><span key={x.listingId}>{x.label}
   <button aria-label={`Remover ${x.label}`} onClick={()=>c.remove(x.listingId)}>×</button>
  </span>)}</div>
  <a className="btn" href={`/comparar-ofertas?ids=${c.items.map(x=>x.listingId).join(',')}`}>
   Comparar agora
  </a>
 </div>;
}
