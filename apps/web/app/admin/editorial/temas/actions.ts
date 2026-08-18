'use server';

import {revalidatePath} from 'next/cache';
import {adminMutate} from '../../../../lib/admin-api';
import type {ActionResult} from '../../../../lib/admin-action';

export async function createTopic(
  _prev:ActionResult,formData:FormData,
):Promise<ActionResult>{
 const name=String(formData.get('name')??'').trim();
 const query=String(formData.get('query')??'').trim();
 if(!name||!query)return {ok:false,status:422};
 const result=await adminMutate('/admin/editorial-topics',{
  method:'POST',body:{
   name,query,
   language:String(formData.get('language')??'pt-BR').trim(),
   maxArticles:Number(formData.get('maxArticles')??5),
  },
 });
 if(!result.ok)return {ok:false,status:result.status};
 revalidatePath('/admin/editorial/temas');
 return {ok:true};
}

export async function runTopicDiscovery(
  _prev:ActionResult,_formData:FormData,
):Promise<ActionResult>{
 const result=await adminMutate('/admin/editorial-topics/run',{
  method:'POST',body:{},
 });
 if(!result.ok)return {ok:false,status:result.status};
 revalidatePath('/admin/editorial/temas');
 return {ok:true,message:'Descoberta enfileirada. O worker vai coletar os artigos dos temas ativos.'};
}

export async function toggleTopic(
  _prev:ActionResult,formData:FormData,
):Promise<ActionResult>{
 const id=String(formData.get('id')??'').trim();
 const status=String(formData.get('status')??'').trim();
 if(!id||!status)return {ok:false,status:422};
 const result=await adminMutate(`/admin/editorial-topics/${id}/status`,{
  method:'PUT',body:{status},
 });
 if(!result.ok)return {ok:false,status:result.status};
 revalidatePath('/admin/editorial/temas');
 return {ok:true};
}
