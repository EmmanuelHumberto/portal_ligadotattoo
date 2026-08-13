type EventName=
 |'product_open'
 |'compare_add'
 |'compare_remove'
 |'favorite_toggle'
 |'filter_apply'
 |'offer_open'
 |'editorial_open';

const allowed=new Set<EventName>([
 'product_open','compare_add','compare_remove','favorite_toggle',
 'filter_apply','offer_open','editorial_open',
]);

export function track(name:EventName,properties:Record<string,unknown>={}){
 if(!allowed.has(name)) return;
 const safe=Object.fromEntries(
   Object.entries(properties).filter(([k])=>
     !['query','email','name','phone','url','token'].includes(k.toLowerCase())
   )
 );
 navigator.sendBeacon?.(
   '/api/analytics',
   new Blob([JSON.stringify({name,properties:safe,at:Date.now()})],
     {type:'application/json'})
 );
}
