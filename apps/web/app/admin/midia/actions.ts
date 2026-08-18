'use server';

import {revalidatePath} from 'next/cache';
import {adminMutate} from '../../../lib/admin-api';
import type {ActionResult} from '../../../lib/admin-action';

export async function setMediaRights(
  _prev:ActionResult,formData:FormData,
):Promise<ActionResult>{
 const id=String(formData.get('id')??'').trim();
 const rightsStatus=String(formData.get('rightsStatus')??'').trim();
 const basis=String(formData.get('basis')??'').trim();
 const expectedVersion=Number(formData.get('expectedVersion')??'');
 if(!id||!rightsStatus||!basis||!Number.isInteger(expectedVersion)||expectedVersion<1)
  return {ok:false,status:422};

 const result=await adminMutate(`/admin/media/${id}/rights`,{
  method:'POST',body:{expectedVersion,rightsStatus,basis},
 });
 if(!result.ok)return {ok:false,status:result.status};
 revalidatePath('/admin/midia');
 return {ok:true};
}
