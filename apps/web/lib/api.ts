const base=process.env.API_INTERNAL_URL ?? 'http://api:3000';
export async function api(path:string,options?:{cache?:RequestCache}){
 const r=await fetch(base+path,
  options?.cache ? {cache:options.cache} : {next:{revalidate:60}},
 );
 if(!r.ok) throw new ApiResponseError(r.status);
 return r.json();
}
export class ApiResponseError extends Error{
 constructor(readonly status:number){super(`API ${status}`)}
}
export async function apiOrNull(path:string){
 try{return await api(path)}catch(error){
  if(error instanceof ApiResponseError&&error.status===404)return null;
  throw error;
 }
}
