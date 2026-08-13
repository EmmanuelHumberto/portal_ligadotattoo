import {cookies,headers} from 'next/headers';

const base=process.env.API_INTERNAL_URL ?? 'http://api:3000';
const sessionCookie=process.env.ADMIN_SESSION_COOKIE ?? 'pt_session';

export type AdminApiResult<T> =
 | {ok:true;data:T}
 | {ok:false;status:401|403|502};

async function requestAuthorization(){
 const inbound=(await headers()).get('authorization')?.trim();
 if(inbound&&/^Bearer\s+\S+$/i.test(inbound))return inbound;

 const token=(await cookies()).get(sessionCookie)?.value.trim();
 if(!token)return null;
 return /^Bearer\s+/i.test(token)?token:`Bearer ${token}`;
}

export async function adminApi<T>(path:string):Promise<AdminApiResult<T>>{
 const authorization=await requestAuthorization();
 if(!authorization)return {ok:false,status:401};

 try{
  const response=await fetch(base+path,{
   cache:'no-store',headers:{authorization},
  });
  if(response.status===401)return {ok:false,status:401};
  if(response.status===403)return {ok:false,status:403};
  if(!response.ok)return {ok:false,status:502};
  return {ok:true,data:await response.json() as T};
 }catch{
  return {ok:false,status:502};
 }
}
