'use server';

import {revalidatePath} from 'next/cache';
import {adminMutate} from '../../../../lib/admin-api';
import type {ActionResult} from '../../../../lib/admin-action';

export async function updateEditorial(
  _prev:ActionResult,formData:FormData,
):Promise<ActionResult>{
 const id=String(formData.get('id')??'').trim();
 const title=String(formData.get('title')??'').trim();
 const subtitle=String(formData.get('subtitle')??'').trim();
 const summary=String(formData.get('summary')??'').trim();
 const bodyJson=String(formData.get('body')??'');
 let body:any;
 try{body=bodyJson?JSON.parse(bodyJson):{version:1,blocks:[]};}
 catch{return {ok:false,status:422};}
 if(!id||!title)return {ok:false,status:422};
 const result=await adminMutate(`/admin/editorial/${id}`,{
  method:'PATCH',body:{title,subtitle,summary,body},
 });
 if(!result.ok)return {ok:false,status:result.status};
 revalidatePath(`/admin/editorial/${id}`);
 return {ok:true};
}
