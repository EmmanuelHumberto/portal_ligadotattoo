'use client';
import {useState} from 'react';
import {PortalImage} from './portal-image';
import type {PublicMedia} from '../lib/public-api-contracts';

export function MediaGallery({items}:{items:PublicMedia[]}){
 const [index,setIndex]=useState(0);
 if(!items?.length)return <div className="card gallery emptyMedia">Sem mídia pública</div>;
 const current=items[index]??items[0]!;
 return <div className="mediaGallery">
  <div className="card gallery"><PortalImage src={current.url}
    alt={current.alt??''} width={900} height={900} unoptimized/></div>
  <div className="thumbRail" aria-label="Galeria">
   {items.map((x,i)=><button key={x.id??i} aria-current={i===index}
    onClick={()=>setIndex(i)}><PortalImage src={x.variants?.[0]?.url??x.url}
    alt="" width={160} height={160} unoptimized/></button>)}
  </div>
 </div>
}
