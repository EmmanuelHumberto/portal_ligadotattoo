'use server';

import {revalidatePath} from 'next/cache';
import {adminMutate} from '../../../lib/admin-api';
import type {ActionResult} from '../../../lib/admin-action';

function parseJsonValue(raw:string):unknown{
 const value=raw.trim();
 if(!value)return undefined;
 try{return JSON.parse(value);}catch{return value;}
}

function splitUuids(raw:string):string[]{
 return raw.split(/[,\s]+/).map(s=>s.trim()).filter(Boolean);
}

export async function recordClaim(
  _prev:ActionResult,formData:FormData,
):Promise<ActionResult>{
 const subjectType=String(formData.get('subjectType')??'').trim();
 const subjectId=String(formData.get('subjectId')??'').trim();
 const propertyKey=String(formData.get('propertyKey')??'').trim();
 const value=parseJsonValue(String(formData.get('value')??''));
 const claimantType=String(formData.get('claimantType')??'').trim();
 const confidenceRaw=String(formData.get('confidence')??'').trim();
 const sourceUrl=String(formData.get('sourceUrl')??'').trim();
 if(!subjectType||!subjectId||!propertyKey||value===undefined||!claimantType)
  return {ok:false,status:422};

 const body:Record<string,unknown>={subjectType,subjectId,propertyKey,value,claimantType};
 if(confidenceRaw)body.confidence=Number(confidenceRaw);
 if(sourceUrl)body.sourceUrl=sourceUrl;

 const result=await adminMutate('/admin/claims',{method:'POST',body});
 if(!result.ok)return {ok:false,status:result.status};
 revalidatePath('/admin/conhecimento');
 return {ok:true};
}

export async function createProposal(
  _prev:ActionResult,formData:FormData,
):Promise<ActionResult>{
 const subjectType=String(formData.get('subjectType')??'').trim();
 const subjectId=String(formData.get('subjectId')??'').trim();
 const propertyKey=String(formData.get('propertyKey')??'').trim();
 const proposedValue=parseJsonValue(String(formData.get('proposedValue')??''));
 const evidenceIds=splitUuids(String(formData.get('evidenceIds')??''));
 if(!subjectType||!subjectId||!propertyKey||proposedValue===undefined||!evidenceIds.length)
  return {ok:false,status:422};

 const result=await adminMutate('/admin/canonical-proposals',{method:'POST',body:{
  subjectType,subjectId,propertyKey,proposedValue,evidenceIds,
 }});
 if(!result.ok)return {ok:false,status:result.status};
 revalidatePath('/admin/conhecimento');
 return {ok:true};
}

export async function decideProposal(
  _prev:ActionResult,formData:FormData,
):Promise<ActionResult>{
 const proposalId=String(formData.get('proposalId')??'').trim();
 const decision=String(formData.get('decision')??'').trim();
 const reason=String(formData.get('reason')??'').trim();
 const expectedVersion=Number(formData.get('expectedVersion')??'');
 if(!proposalId||(decision!=='APPROVE'&&decision!=='REJECT')||reason.length<3
   ||!Number.isInteger(expectedVersion)||expectedVersion<1)
  return {ok:false,status:422};

 const result=await adminMutate(`/admin/canonical-proposals/${proposalId}/decision`,{
  method:'POST',body:{decision,reason,expectedVersion},
 });
 if(!result.ok)return {ok:false,status:result.status};
 revalidatePath('/admin/conhecimento');
 revalidatePath(`/admin/conhecimento/propostas/${proposalId}`);
 return {ok:true};
}
