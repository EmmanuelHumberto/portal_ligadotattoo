'use client';
import {useState} from 'react';

export function MediaGallery({items}:{items:any[]}){
 const [index,setIndex]=useState(0);
 if(!items?.length)return <div className="card gallery emptyMedia">Sem mídia pública</div>;
 const current=items[index];
 return <div className="mediaGallery">
  <div className="card gallery"><img src={current.url}
    alt={current.alt??''}/></div>
  <div className="thumbRail" aria-label="Galeria">
   {items.map((x,i)=><button key={x.id??i} aria-current={i===index}
    onClick={()=>setIndex(i)}><img src={x.variants?.[0]?.url??x.url}
    alt=""/></button>)}
  </div>
 </div>
}
