const FAVORITES='pt:favorites:v1';
const RECENT='pt:recent:v1';
const MAX_RECENT=20;

function read(key:string):string[]{
 try{return JSON.parse(localStorage.getItem(key)??'[]')}catch{return []}
}
function write(key:string,value:string[]){
 localStorage.setItem(key,JSON.stringify(value));
}
export function favorites(){return read(FAVORITES)}
export function toggleFavorite(id:string){
 const x=new Set(read(FAVORITES));
 if(x.has(id)) x.delete(id); else x.add(id);
 write(FAVORITES,[...x]);return x.has(id);
}
export function rememberViewed(id:string){
 const next=[id,...read(RECENT).filter(x=>x!==id)].slice(0,MAX_RECENT);
 write(RECENT,next);
}
export function recentlyViewed(){return read(RECENT)}
export function clearLocalDiscovery(){
 localStorage.removeItem(FAVORITES);localStorage.removeItem(RECENT);
}
