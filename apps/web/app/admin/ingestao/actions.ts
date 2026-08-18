'use server';

import {revalidatePath} from 'next/cache';
import {adminMutate} from '../../../lib/admin-api';
import type {ActionResult} from '../../../lib/admin-action';

export async function runNewsIngestion(
  _prev:ActionResult,_formData:FormData,
):Promise<ActionResult>{
 const result=await adminMutate('/admin/ingestion/run?kind=NEWS',{
  method:'POST',body:{},
 });
 if(!result.ok)return {ok:false,status:result.status};
 revalidatePath('/admin/ingestao');
 return {ok:true};
}
