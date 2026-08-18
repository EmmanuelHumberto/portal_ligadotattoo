const base=process.env.API_INTERNAL_URL ?? 'http://api:3000';
export async function api<T>(path:string,options?:{cache?:RequestCache}):Promise<T>{
 const r=await fetch(base+path,
  {cache:options?.cache ?? 'no-store'},
 );
 if(!r.ok) throw new ApiResponseError(r.status);
 return await r.json() as T;
}
export class ApiResponseError extends Error{
 constructor(readonly status:number){super(`API ${status}`)}
}
export async function apiOrNull<T>(path:string):Promise<T|null>{
 try{return await api<T>(path)}catch(error){
  if(error instanceof ApiResponseError&&error.status===404)return null;
  throw error;
 }
}
