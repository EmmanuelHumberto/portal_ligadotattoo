'use server';

import {revalidatePath} from 'next/cache';
import {adminApi,adminMutate,adminUpload} from '../../../../lib/admin-api';
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

export async function attachMedia(
  _prev:ActionResult,formData:FormData,
):Promise<ActionResult>{
 const id=String(formData.get('id')??'').trim();
 const file=formData.get('file');
 if(!id||!(file instanceof File)||file.size===0)return {ok:false,status:422};

 const upload=await adminUpload<{id:string}>('/admin/media/upload',file);
 if(!upload.ok)return {ok:false,status:upload.status};
 const mediaId=upload.data.id;

 const current=await adminApi<{
  title:string;subtitle?:string|null;summary?:string|null;
  body?:{version:number;blocks:Array<any>};
 }>(`/admin/editorial/${id}`);
 if(!current.ok)return {ok:false,status:current.status};

 const body=current.data.body ?? {version:1,blocks:[]};
 const blocks=[...(body.blocks ?? []),{type:'image',mediaId}];
 const result=await adminMutate(`/admin/editorial/${id}`,{
  method:'PATCH',
  body:{
   title:current.data.title,
   subtitle:current.data.subtitle ?? null,
   summary:current.data.summary ?? null,
   body:{version:body.version ?? 1,blocks},
  },
 });
 if(!result.ok)return {ok:false,status:result.status};
 revalidatePath(`/admin/editorial/${id}`);
 return {ok:true,message:'Imagem enviada e anexada ao final do corpo.'};
}
