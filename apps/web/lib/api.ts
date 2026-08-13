const base=process.env.API_INTERNAL_URL ?? 'http://api:3000';
export async function api(path:string){
 const r=await fetch(base+path,{next:{revalidate:60}});
 if(!r.ok) throw new Error(`API ${r.status}`);
 return r.json();
}
export async function adminApi(path:string){
 // Server-side session forwarding belongs to the auth adapter.
 const r=await fetch(base+path,{cache:'no-store'});
 if(!r.ok) throw new Error(`Admin API ${r.status}`);
 return r.json();
}
