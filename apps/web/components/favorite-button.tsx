'use client';
import {useEffect,useState} from 'react';
import {favorites,toggleFavorite} from '../lib/local-preferences';
import {track} from '../lib/analytics';

export function FavoriteButton({id}:{id:string}){
 const [on,setOn]=useState(false);
 useEffect(()=>setOn(favorites().includes(id)),[id]);
 return <button className="iconButton" aria-pressed={on}
  aria-label={on?'Remover dos favoritos':'Adicionar aos favoritos'}
  onClick={()=>{
   const next=toggleFavorite(id);setOn(next);
   track('favorite_toggle',{productId:id,state:next?'on':'off'});
  }}>{on?'★':'☆'}</button>
}
