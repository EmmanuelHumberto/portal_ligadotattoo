'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {clientQuery} from '../lib/client-query';

export function GlobalSearch(){
 const [q,setQ]=useState('');const [items,setItems]=useState<any[]>([]);
 const [open,setOpen]=useState(false);const seq=useRef(0);

 useEffect(()=>{
  if(q.trim().length<2){setItems([]);return}
  const id=++seq.current;
  const timer=setTimeout(async()=>{
   const key=`suggest:${q.trim().toLowerCase()}`;
   const data=await clientQuery(key,()=>fetch(
     `/api/search/suggest?q=${encodeURIComponent(q.trim())}`
   ).then(r=>r.json()),20_000);
   if(id===seq.current){setItems(data.items??[]);setOpen(true)}
  },180);
  return()=>clearTimeout(timer);
 },[q]);

 return <div className="globalSearch">
  <form action="/buscar" role="search">
   <input name="q" value={q} onChange={e=>setQ(e.target.value)}
    onFocus={()=>setOpen(true)} autoComplete="off"
    aria-label="Buscar no Portal Tattoo"
    aria-expanded={open&&items.length>0}
    placeholder="Buscar máquinas, marcas, técnicas..."/>
  </form>
  {open&&items.length>0&&<div className="suggestions" role="listbox">
   {items.map(x=><Link key={`${x.type}:${x.id}`} href={x.url}
     onClick={()=>setOpen(false)} role="option">
     <span>{x.title}</span><small>{x.type}</small>
   </Link>)}
  </div>}
 </div>
}
