'use server';

import {revalidatePath} from 'next/cache';
import {adminMutate} from '../../../../lib/admin-api';
import type {ActionResult} from '../../../../lib/admin-action';

export async function setAutoDraft(
  _prev:ActionResult,formData:FormData,
):Promise<ActionResult>{
 const enabled=String(formData.get('enabled')??'')==='true';
 const result=await adminMutate('/admin/editorial-config/auto-draft',{
  method:'PUT',body:{enabled},
 });
 if(!result.ok)return {ok:false,status:result.status};
 revalidatePath('/admin/editorial/candidatos');
 return {ok:true};
}

export async function runAutoDraft(
  _prev:ActionResult,_formData:FormData,
):Promise<ActionResult>{
 const result=await adminMutate<{enqueued:number}>('/admin/editorial-config/auto-draft/run',{
  method:'POST',body:{},
 });
 if(!result.ok)return {ok:false,status:result.status};
 const n=result.data?.enqueued ?? 0;
 revalidatePath('/admin/editorial/candidatos');
 return {ok:true,message:n>0
  ? `${n} rascunho(s) enfileirado(s) para geração.`
  : 'Nenhum candidato pendente no momento. A ingestão cria candidatos ao coletar as fontes.'};
}
