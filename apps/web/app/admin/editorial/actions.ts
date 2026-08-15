'use server';

import {revalidatePath} from 'next/cache';
import {redirect} from 'next/navigation';
import {adminMutate} from '../../../lib/admin-api';
import type {ActionResult} from '../../../lib/admin-action';

const EDITORIAL_BASE='/admin/editorial';

function slugify(value:string){
 return value.toLowerCase()
  .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
  .replace(/[^a-z0-9]+/g,'-')
  .replace(/^-+|-+$/g,'');
}

async function mutate(path:string,body:unknown):Promise<ActionResult>{
 const result=await adminMutate(path,{method:'POST',body});
 if(!result.ok)return {ok:false,status:result.status};
 return {ok:true};
}

function refresh(id?:string){
 revalidatePath('/admin/editorial');
 if(id)revalidatePath(`/admin/editorial/${id}`);
}

export async function createEditorialDraft(
  _prev:ActionResult,formData:FormData,
):Promise<ActionResult>{
 const contentType=String(formData.get('contentType')??'').trim();
 const title=String(formData.get('title')??'').trim();
 const slug=String(formData.get('slug')??'').trim() || slugify(title);
 const subtitle=String(formData.get('subtitle')??'').trim();
 const summary=String(formData.get('summary')??'').trim();
 if(!contentType||!title||!slug)return {ok:false,status:422};
 const outcome=await mutate(EDITORIAL_BASE,{
  contentType,title,slug,subtitle,summary,
  body:{version:1,blocks:[]},
 });
 if(outcome.ok)refresh();
 return outcome;
}

export async function submitEditorial(
  _prev:ActionResult,formData:FormData,
):Promise<ActionResult>{
 const {id,version}=idVersion(formData);
 if(!id||!version)return {ok:false,status:422};
 const outcome=await mutate(`${EDITORIAL_BASE}/${id}/submit`,{expectedVersion:version});
 if(outcome.ok)refresh(id);
 return outcome;
}

export async function approveEditorial(
  _prev:ActionResult,formData:FormData,
):Promise<ActionResult>{
 const {id,version}=idVersion(formData);
 const reason=String(formData.get('reason')??'').trim();
 if(!id||!version||!reason)return {ok:false,status:422};
 const outcome=await mutate(`${EDITORIAL_BASE}/${id}/approve`,
  {expectedVersion:version,reason});
 if(outcome.ok)refresh(id);
 return outcome;
}

export async function scheduleEditorial(
  _prev:ActionResult,formData:FormData,
):Promise<ActionResult>{
 const {id,version}=idVersion(formData);
 const publishAt=String(formData.get('publishAt')??'').trim();
 if(!id||!version||!publishAt)return {ok:false,status:422};
 const outcome=await mutate(`${EDITORIAL_BASE}/${id}/schedule`,
  {expectedVersion:version,publishAt});
 if(outcome.ok)refresh(id);
 return outcome;
}

export async function publishEditorial(
  _prev:ActionResult,formData:FormData,
):Promise<ActionResult>{
 const {id,version}=idVersion(formData);
 if(!id||!version)return {ok:false,status:422};
 const outcome=await mutate(`${EDITORIAL_BASE}/${id}/publish`,
  {expectedVersion:version});
 if(outcome.ok)refresh(id);
 return outcome;
}

export async function generateAIDraft(
  _prev:ActionResult,formData:FormData,
):Promise<ActionResult>{
 const candidateId=String(formData.get('candidateId')??'').trim();
 const requestedType=String(formData.get('requestedType')??'').trim();
 if(!candidateId)return {ok:false,status:422};
 const body:Record<string,unknown>={candidateId};
 if(requestedType)body.requestedType=requestedType;
 const result=await adminMutate('/admin/editorial/ai-draft',{method:'POST',body});
 if(!result.ok)return {ok:false,status:result.status};
 refresh();
 revalidatePath('/admin/editorial/candidatos');
 return {ok:true};
}

export async function approveDraft(
  _prev:ActionResult,formData:FormData,
):Promise<ActionResult>{
 const {id,version}=idVersion(formData);
 const reason=String(formData.get('reason')??'').trim();
 if(!id||!version)return {ok:false,status:422};

 const sub=await adminMutate<{version:number}>(
  `${EDITORIAL_BASE}/${id}/submit`,
  {method:'POST',body:{expectedVersion:version}},
 );
 if(!sub.ok)return {ok:false,status:sub.status};

 const nextVersion=sub.data?.version ?? version+1;
 const app=await adminMutate(
  `${EDITORIAL_BASE}/${id}/approve`,
  {method:'POST',body:{expectedVersion:nextVersion,reason:reason||'Aprovado pelo admin'}},
 );
 if(!app.ok)return {ok:false,status:app.status};

 refresh(id);
 return {ok:true};
}

export async function removeEditorial(
  _prev:ActionResult,formData:FormData,
):Promise<ActionResult>{
 const {id,version}=idVersion(formData);
 if(!id||!version)return {ok:false,status:422};
 const result=await adminMutate(`${EDITORIAL_BASE}/${id}`,{
  method:'DELETE',body:{expectedVersion:version},
 });
 if(!result.ok)return {ok:false,status:result.status};
 refresh();
 return {ok:true};
}

export async function unpublishEditorial(
  _prev:ActionResult,formData:FormData,
):Promise<ActionResult>{
 const {id,version}=idVersion(formData);
 if(!id||!version)return {ok:false,status:422};
 const result=await adminMutate(`${EDITORIAL_BASE}/${id}/unpublish`,{
  method:'POST',body:{expectedVersion:version},
 });
 if(!result.ok)return {ok:false,status:result.status};
 refresh(id);
 return {ok:true};
}

function idVersion(formData:FormData){
 const id=String(formData.get('id')??'').trim();
 const version=Number(formData.get('version')??'');
 return {
  id,
  version:Number.isInteger(version)&&version>0 ? version : null,
 };
}

export async function createPost(_prev:ActionResult,formData:FormData):Promise<ActionResult>{
 const title=String(formData.get('title')??'').trim();
 const subtitle=String(formData.get('subtitle')??'').trim();
 const summary=String(formData.get('summary')??'').trim();
 const text=String(formData.get('text')??'').trim();
 if(!title)return {ok:false,status:422};
 const blocks=text
  ? text.split(/\n\s*\n/).filter(Boolean)
     .map(p=>({type:'paragraph',text:p.trim()}))
  : [];
 const result=await adminMutate<{id:string}>(EDITORIAL_BASE,{
  method:'POST',
  body:{contentType:'BLOG',title,slug:slugify(title),subtitle,summary,body:{version:1,blocks}},
 });
 if(!result.ok)return {ok:false,status:result.status};
 redirect(`/admin/editorial/${result.data.id}`);
}

export async function ingestSocial(
  _prev:ActionResult,formData:FormData,
):Promise<ActionResult>{
 const url=String(formData.get('url')??'').trim();
 const text=String(formData.get('text')??'').trim();
 if(!url && !text)return {ok:false,status:422};
 const result=await adminMutate<{mode?:string}>('/admin/editorial/ingest-social',{
  method:'POST',body:{url,text},
 });
 if(!result.ok)return {ok:false,status:result.status};
 revalidatePath('/admin/editorial');
 revalidatePath('/admin/editorial/candidatos');
 return {ok:true,message:text
  ? 'Postagem importada. O rascunho será gerado automaticamente em instantes.'
  : 'Postagem enfileirada para coleta.'};
}
