import {BadRequestException} from '@nestjs/common';

const AVAILABILITY=['IN_STOCK','OUT_OF_STOCK','PREORDER','UNAVAILABLE','UNKNOWN'] as const;
export type PriceInput={
  amount:number;currency:string;availability:typeof AVAILABILITY[number];
  observedAt:Date;sourceSnapshotId?:string;
};

export function priceInput(body:unknown):PriceInput{
  const input=record(body);
  if(typeof input.amount!=='number'||!Number.isFinite(input.amount)||input.amount<0||input.amount>1_000_000_000)
    invalid('amount deve ser um número válido não negativo');
  const currency=text(input.currency,'currency',3,3).toUpperCase();
  if(!/^[A-Z]{3}$/.test(currency))invalid('currency inválida');
  const availability=(input.availability===undefined?'UNKNOWN':
    text(input.availability,'availability',1,30).toUpperCase()) as PriceInput['availability'];
  if(!AVAILABILITY.includes(availability))invalid('availability inválida');
  const result:PriceInput={amount:input.amount,currency,availability,
    observedAt:input.observedAt===undefined?new Date():dateTime(input.observedAt,'observedAt')};
  if(input.sourceSnapshotId!=null&&input.sourceSnapshotId!=='')
    result.sourceSnapshotId=uuid(input.sourceSnapshotId,'sourceSnapshotId');
  return result;
}

export function listingUrlInput(body:unknown):string{
  const value=text(record(body).url,'url',8,2_048);
  let parsed:URL;
  try{parsed=new URL(value);}catch{invalid('url inválida');}
  if(parsed.protocol!=='http:'&&parsed.protocol!=='https:')invalid('url deve ser HTTP(S)');
  if(parsed.username||parsed.password)invalid('url não pode conter credenciais');
  parsed.hash='';
  return parsed.toString();
}

function record(value:unknown):Record<string,unknown>{
  if(!value||typeof value!=='object'||Array.isArray(value))invalid('Corpo JSON inválido');
  return value as Record<string,unknown>;
}
function text(value:unknown,key:string,min:number,max:number):string{
  if(typeof value!=='string')invalid(`${key} deve ser texto`);
  const result=value.trim();
  if(result.length<min||result.length>max)invalid(`${key} possui tamanho inválido`);
  return result;
}
function uuid(value:unknown,key:string):string{
  const result=text(value,key,36,36);
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(result))
    invalid(`${key} deve ser UUID`);
  return result;
}
function dateTime(value:unknown,key:string):Date{
  const parsed=new Date(text(value,key,10,100));
  if(Number.isNaN(parsed.getTime()))invalid(`${key} deve ser data e hora válida`);
  return parsed;
}
function invalid(message:string):never{throw new BadRequestException(message);}
