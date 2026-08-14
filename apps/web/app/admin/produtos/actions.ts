'use server';

import {revalidatePath} from 'next/cache';
import {adminMutate,adminUpload} from '../../../lib/admin-api';
import type {ActionResult} from '../../../lib/admin-action';

export async function createProduct(
  _prev:ActionResult,formData:FormData,
):Promise<ActionResult>{
 const manufacturerId=String(formData.get('manufacturerId')??'').trim();
 const productTypeKey=String(formData.get('productTypeKey')??'').trim();
 const name=String(formData.get('name')??'').trim();
 const slug=String(formData.get('slug')??'').trim();
 const modelCode=String(formData.get('modelCode')??'').trim();
 if(!manufacturerId||!productTypeKey||!name||!slug)return {ok:false,status:422};

 const body:Record<string,unknown>={manufacturerId,productTypeKey,name,slug};
 if(modelCode)body.modelCode=modelCode;

 const result=await adminMutate('/admin/products',{method:'POST',body});
 if(!result.ok)return {ok:false,status:result.status};
 revalidatePath('/admin/produtos');
 return {ok:true};
}

export async function uploadProductImage(
  _prev:ActionResult,formData:FormData,
):Promise<ActionResult>{
 const id=String(formData.get('id')??'').trim();
 const file=formData.get('file');
 if(!id||!(file instanceof File))return {ok:false,status:422};
 const result=await adminUpload(`/admin/products/${id}/image`,file);
 if(!result.ok)return {ok:false,status:result.status};
 revalidatePath(`/admin/produtos/${id}`);
 revalidatePath('/maquinas');
 return {ok:true};
}

export async function saveProductSpecs(
  _prev:ActionResult,formData:FormData,
):Promise<ActionResult>{
 const id=String(formData.get('id')??'').trim();
 if(!id)return {ok:false,status:422};
 const summary=String(formData.get('summary')??'').trim();
 const description=String(formData.get('description')??'').trim();
  const specFields:Array<[string,string|null]>=[
   ['power_supply','power_supply_unit'],
   ['voltage_range','voltage_range_unit'],
   ['rpm','rpm_unit'],
   ['motor_type',null],
   ['stroke','stroke_unit'],
   ['weight','weight_unit'],
   ['accessories',null],
  ];
  const specs=specFields.map(([key,unitField])=>{
  const value=String(formData.get(key)??'').trim();
  if(!value)return null;
  const unit=unitField?String(formData.get(unitField)??'').trim()||null:null;
  return {key,value,unit};
 }).filter(Boolean) as Array<{key:string;value:string;unit:string|null}>;

 const result=await adminMutate(`/admin/products/${id}/specs`,{
  method:'POST',body:{summary,description,specs},
 });
 if(!result.ok)return {ok:false,status:result.status};
 revalidatePath(`/admin/produtos/${id}`);
 revalidatePath('/maquinas');
 return {ok:true};
}

export async function saveListingUrl(
  _prev:ActionResult,formData:FormData,
):Promise<ActionResult>{
 const listingId=String(formData.get('listingId')??'').trim();
 const url=String(formData.get('url')??'').trim();
 if(!listingId||!url)return {ok:false,status:422};
 const result=await adminMutate(`/admin/listings/${listingId}/url`,{
  method:'POST',body:{url},
 });
 if(!result.ok)return {ok:false,status:result.status};
 revalidatePath('/ofertas');
 return {ok:true};
}

export async function setProductType(
  _prev:ActionResult,formData:FormData,
):Promise<ActionResult>{
 const id=String(formData.get('id')??'').trim();
 const productTypeKey=String(formData.get('productTypeKey')??'').trim();
 if(!id||!productTypeKey)return {ok:false,status:422};
 const result=await adminMutate(`/admin/products/${id}/type`,{
  method:'PATCH',body:{productTypeKey},
 });
 if(!result.ok)return {ok:false,status:result.status};
 revalidatePath(`/admin/produtos/${id}`);
 revalidatePath('/admin/produtos');
 revalidatePath('/maquinas');
 return {ok:true};
}
