'use server';

import {revalidatePath} from 'next/cache';
import {adminApi,adminMutate,adminUpload} from '../../../../lib/admin-api';
import type {ActionResult} from '../../../../lib/admin-action';
import type {EditorialBlock} from '../../../../lib/public-api-contracts';

export async function updateEditorial(
  _prev:ActionResult,formData:FormData,
):Promise<ActionResult>{
 const id=String(formData.get('id')??'').trim();
 const title=String(formData.get('title')??'').trim();
 const subtitle=String(formData.get('subtitle')??'').trim();
 const summary=String(formData.get('summary')??'').trim();
 const text=String(formData.get('text')??'').trim();
 if(!id||!title)return {ok:false,status:422};

 // Preserva blocos não-textuais (imagens etc.) e substitui os de texto.
 const current=await adminApi<{
  body?:{version:number;blocks:EditorialBlock[]};
 }>(`/admin/editorial/${id}`);
 const existing=current.ok ? (current.data.body?.blocks ?? []) : [];
 const nonText=existing.filter(b=>b.type!=='paragraph' && b.type!=='heading');
 const textBlocks=text
  ? text.split(/\n\s*\n/).filter(Boolean).map(p=>({type:'paragraph',text:p.trim()}))
  : [];
 const blocks=[...textBlocks,...nonText];

 const result=await adminMutate(`/admin/editorial/${id}`,{
  method:'PATCH',
  body:{title,subtitle,summary,body:{version:1,blocks}},
 });
 if(!result.ok)return {ok:false,status:result.status};
 revalidatePath(`/admin/editorial/${id}`);
 return {ok:true,message:'Rascunho salvo.'};
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
  body?:{version:number;blocks:EditorialBlock[]};
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
