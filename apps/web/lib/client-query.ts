type Entry={expires:number,value:any};
const cache=new Map<string,Entry>();

export async function clientQuery<T>(
  key:string,loader:()=>Promise<T>,ttlMs=30_000,
):Promise<T>{
  const hit=cache.get(key);
  if(hit && hit.expires>Date.now()) return hit.value as T;
  const value=await loader();
  cache.set(key,{value,expires:Date.now()+ttlMs});
  return value;
}

export function invalidateClientQuery(prefix:string){
  for(const key of cache.keys()) if(key.startsWith(prefix)) cache.delete(key);
}
