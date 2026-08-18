import {BadRequestException} from '@nestjs/common';
import type {RightsStatus} from './media-rights.domain';

const RIGHTS:RightsStatus[]=[
  'UNKNOWN','PENDING','PERMITTED','RESTRICTED','EXPIRED','TAKEDOWN',
];

export type RegisterMediaInput={
  kind:string;storageKey:string;mimeType:string;byteSize:number;sha256:string;
};
export type SetMediaRightsInput={
  expectedVersion:number;status:RightsStatus;basis?:string;licenseName?:string;
  sourceUrl?:string;expiresAt?:Date;notes?:string;
};

export function registerMediaInput(body:unknown):RegisterMediaInput{
  const input=record(body);
  const byteSize=integer(input.byteSize,'byteSize',0,100*1024*1024);
  const sha256=text(input.sha256,'sha256',64,64).toLowerCase();
  if(!/^[0-9a-f]{64}$/.test(sha256))invalid('sha256 inválido');
  const mimeType=text(input.mimeType,'mimeType',3,120).toLowerCase();
  if(!/^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/.test(mimeType))
    invalid('mimeType inválido');
  const storageKey=text(input.storageKey,'storageKey',1,1_024);
  if(storageKey.startsWith('/')||storageKey.includes('..'))invalid('storageKey inválido');
  return {kind:text(input.kind,'kind',1,40).toUpperCase(),storageKey,mimeType,
    byteSize,sha256};
}

export function setMediaRightsInput(body:unknown):SetMediaRightsInput{
  const input=record(body);
  const rawStatus=input.status??input.rightsStatus;
  const status=text(rawStatus,'rightsStatus',1,30).toUpperCase() as RightsStatus;
  if(!RIGHTS.includes(status))invalid('rightsStatus inválido');
  const basis=optionalText(input.basis,'basis',1_000);
  if(status==='PERMITTED'&&!basis)
    invalid('basis é obrigatório para permitir publicação');
  const result:SetMediaRightsInput={
    expectedVersion:integer(input.expectedVersion,'expectedVersion',1,2_147_483_647),status,
  };
  if(basis)result.basis=basis;
  const licenseName=optionalText(input.licenseName,'licenseName',300);
  if(licenseName)result.licenseName=licenseName;
  const sourceUrl=optionalHttpUrl(input.sourceUrl,'sourceUrl');
  if(sourceUrl)result.sourceUrl=sourceUrl;
  const notes=optionalText(input.notes,'notes',5_000);
  if(notes)result.notes=notes;
  if(input.expiresAt!=null&&input.expiresAt!=='')
    result.expiresAt=dateTime(input.expiresAt,'expiresAt');
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
function optionalText(value:unknown,key:string,max:number):string{
  if(value===undefined||value===null||value==='')return '';
  return text(value,key,1,max);
}
function integer(value:unknown,key:string,min:number,max:number):number{
  if(typeof value!=='number'||!Number.isInteger(value)||value<min||value>max)
    invalid(`${key} deve ser inteiro entre ${min} e ${max}`);
  return value;
}
function optionalHttpUrl(value:unknown,key:string):string{
  if(value===undefined||value===null||value==='')return '';
  const result=text(value,key,8,2_048);
  try{
    const parsed=new URL(result);
    if(parsed.protocol!=='http:'&&parsed.protocol!=='https:')invalid(`${key} deve ser HTTP(S)`);
  }catch{invalid(`${key} deve ser uma URL válida`);}
  return result;
}
function dateTime(value:unknown,key:string):Date{
  const parsed=new Date(text(value,key,10,100));
  if(Number.isNaN(parsed.getTime()))invalid(`${key} deve ser data e hora válida`);
  return parsed;
}
function invalid(message:string):never{throw new BadRequestException(message);}
