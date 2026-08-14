'use server';

import {revalidatePath} from 'next/cache';
import {adminMutate} from '../../../lib/admin-api';
import type {ActionResult} from '../../../lib/admin-action';

export async function recordPrice(
  _prev:ActionResult,formData:FormData,
):Promise<ActionResult>{
 const listingId=String(formData.get('listingId')??'').trim();
 const amount=String(formData.get('amount')??'').trim();
 const currency=String(formData.get('currency')??'').trim();
 const availability=String(formData.get('availability')??'').trim();
 if(!listingId||!amount||!currency)return {ok:false,status:422};

 const body:Record<string,unknown>={
  amount:Number(amount),currency:currency.toUpperCase(),
 };
 if(availability)body.availability=availability;

 const result=await adminMutate(`/admin/listings/${listingId}/prices`,{
  method:'POST',body,
 });
 if(!result.ok)return {ok:false,status:result.status};
 revalidatePath('/admin/comercio');
 return {ok:true};
}
