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
