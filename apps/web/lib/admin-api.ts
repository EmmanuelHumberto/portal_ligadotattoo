import {cookies,headers} from 'next/headers';
import {classifyAdminStatus,type AdminApiStatus} from './admin-status';

const base=process.env.API_INTERNAL_URL ?? 'http://api:3000';
const sessionCookie=process.env.ADMIN_SESSION_COOKIE ?? 'pt_session';

export type AdminApiResult<T> =
 | {ok:true;data:T}
 | {ok:false;status:AdminApiStatus};

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
  if(!response.ok)return {ok:false,status:classifyAdminStatus(response.status)};
  return {ok:true,data:await response.json() as T};
 }catch{
  return {ok:false,status:502};
 }
}

export async function adminMutate<T>(path:string,options?:{
 method?:'POST'|'PUT'|'PATCH'|'DELETE';
 body?:unknown;
}):Promise<AdminApiResult<T>>{
 const authorization=await requestAuthorization();
 if(!authorization)return {ok:false,status:401};

 try{
  const response=await fetch(base+path,{
   method:options?.method ?? 'POST',
   cache:'no-store',
   headers:{
    authorization,
    ...(options?.body!==undefined?{'content-type':'application/json'}:{}),
   },
   body:options?.body!==undefined?JSON.stringify(options.body):undefined,
  });
  if(!response.ok)return {ok:false,status:classifyAdminStatus(response.status)};
  return {ok:true,data:await response.json() as T};
 }catch{
  return {ok:false,status:502};
 }
}

export async function adminUpload<T>(path:string,file:File):Promise<AdminApiResult<T>>{
 const authorization=await requestAuthorization();
 if(!authorization)return {ok:false,status:401};
 try{
  const body=new FormData();
  body.set('file',file);
  const response=await fetch(base+path,{
   method:'POST',cache:'no-store',headers:{authorization},body,
  });
  if(!response.ok)return {ok:false,status:classifyAdminStatus(response.status)};
  return {ok:true,data:await response.json() as T};
 }catch{
  return {ok:false,status:502};
 }
}
