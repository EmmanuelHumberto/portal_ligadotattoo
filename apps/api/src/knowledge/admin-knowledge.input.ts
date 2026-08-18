import {BadRequestException} from '@nestjs/common';

export type ClaimInput={
  subjectType:string;subjectId:string;propertyKey:string;value:unknown;
  claimantType:string;claimantId?:string;sourceSnapshotId?:string;
  sourceUrl?:string;observedAt?:Date;confidence?:number;
};
export type CanonicalProposalInput={
  subjectType:string;subjectId:string;propertyKey:string;
  proposedValue:unknown;evidenceIds:string[];
};
export type CanonicalDecisionInput={
  decision:'APPROVE'|'REJECT';reason:string;expectedVersion:number;value?:unknown;
};

export function claimInput(body:unknown):ClaimInput{
  const input=record(body);
  if(input.value===undefined)invalid('value é obrigatório');
  const result:ClaimInput={
    subjectType:text(input.subjectType,'subjectType',1,80),
    subjectId:uuid(input.subjectId,'subjectId'),
    propertyKey:text(input.propertyKey,'propertyKey',1,160),
    value:input.value,
    claimantType:text(input.claimantType,'claimantType',1,80),
  };
  if(input.claimantId!=null&&input.claimantId!=='')
    result.claimantId=text(input.claimantId,'claimantId',1,200);
  if(input.sourceSnapshotId!=null&&input.sourceSnapshotId!=='')
    result.sourceSnapshotId=uuid(input.sourceSnapshotId,'sourceSnapshotId');
  if(input.sourceUrl!=null&&input.sourceUrl!=='')
    result.sourceUrl=httpUrl(input.sourceUrl,'sourceUrl');
  if(input.observedAt!=null&&input.observedAt!=='')
    result.observedAt=dateTime(input.observedAt,'observedAt');
  if(input.confidence!=null&&input.confidence!==''){
    const confidence=number(input.confidence,'confidence');
    if(confidence<0||confidence>1)invalid('confidence deve estar entre 0 e 1');
    result.confidence=confidence;
  }
  return result;
}

export function canonicalProposalInput(body:unknown):CanonicalProposalInput{
  const input=record(body);
  if(input.proposedValue===undefined)invalid('proposedValue é obrigatório');
  if(!Array.isArray(input.evidenceIds)||input.evidenceIds.length<1||input.evidenceIds.length>100)
    invalid('evidenceIds deve conter entre 1 e 100 UUIDs');
  return {
    subjectType:text(input.subjectType,'subjectType',1,80),
    subjectId:uuid(input.subjectId,'subjectId'),
    propertyKey:text(input.propertyKey,'propertyKey',1,160),
    proposedValue:input.proposedValue,
    evidenceIds:[...new Set(input.evidenceIds.map((value)=>uuid(value,'evidenceIds')))],
  };
}

export function canonicalDecisionInput(body:unknown):CanonicalDecisionInput{
  const input=record(body);
  const decision=text(input.decision,'decision',1,20).toUpperCase();
  if(decision!=='APPROVE'&&decision!=='REJECT')
    invalid('decision deve ser APPROVE ou REJECT');
  const result:CanonicalDecisionInput={
    decision,reason:text(input.reason,'reason',3,1000),
    expectedVersion:positiveInteger(input.expectedVersion,'expectedVersion'),
  };
  if(input.value!==undefined)result.value=input.value;
  return result;
}

function record(value:unknown):Record<string,unknown>{
  if(!value||typeof value!=='object'||Array.isArray(value))invalid('Corpo JSON inválido');
  return value as Record<string,unknown>;
}
function text(value:unknown,key:string,min:number,max:number):string{
  if(typeof value!=='string')invalid(`${key} deve ser texto`);
  const result=value.trim();
  if(result.length<min||result.length>max)
    invalid(`${key} deve ter entre ${min} e ${max} caracteres`);
  return result;
}
function uuid(value:unknown,key:string):string{
  const result=text(value,key,36,36);
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(result))
    invalid(`${key} deve ser UUID`);
  return result;
}
function httpUrl(value:unknown,key:string):string{
  const result=text(value,key,8,2048);
  try{
    const parsed=new URL(result);
    if(parsed.protocol!=='http:'&&parsed.protocol!=='https:')invalid(`${key} deve ser HTTP(S)`);
  }catch{invalid(`${key} deve ser uma URL válida`);}
  return result;
}
function dateTime(value:unknown,key:string):Date{
  const result=text(value,key,10,100);
  const parsed=new Date(result);
  if(Number.isNaN(parsed.getTime()))invalid(`${key} deve ser data e hora válida`);
  return parsed;
}
function number(value:unknown,key:string):number{
  if(typeof value!=='number'||!Number.isFinite(value))invalid(`${key} deve ser número`);
  return value;
}
function positiveInteger(value:unknown,key:string):number{
  const result=number(value,key);
  if(!Number.isInteger(result)||result<1)invalid(`${key} deve ser inteiro positivo`);
  return result;
}
function invalid(message:string):never{throw new BadRequestException(message);}
