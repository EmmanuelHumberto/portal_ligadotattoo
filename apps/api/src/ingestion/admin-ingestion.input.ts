import {BadRequestException} from '@nestjs/common';
import type {RobotsPolicy,SourceKind} from './source.domain';

const SOURCE_KINDS:SourceKind[]=[
  'MANUFACTURER','RETAILER','NEWS','EVENT','TECHNICAL','OTHER','SOCIAL',
];
const ROBOTS:RobotsPolicy[]=['RESPECT','MANUAL_ALLOW','DISABLED'];
const DISCOVERY_MODES=['EDITORIAL','CATALOG','MIXED','SNAPSHOT_ONLY'] as const;

export type SourceInput={
  name:string;kind:SourceKind;baseUrl:string;allowedHosts:string[];
  robotsPolicy:RobotsPolicy;crawlDelayMs:number;
};
export type CrawlTargetInput={
  sourceId:string;url:string;discoveryMode:typeof DISCOVERY_MODES[number];
  scheduleKey:string|null;maxBytes:number;
};

export function sourceInput(body:unknown):SourceInput{
  const input=record(body);
  const kind=enumValue(input.kind,'kind',SOURCE_KINDS);
  const robotsPolicy=input.robotsPolicy===undefined?'RESPECT'
    :enumValue(input.robotsPolicy,'robotsPolicy',ROBOTS);
  const rawHosts=input.allowedHosts===undefined?[]:input.allowedHosts;
  if(!Array.isArray(rawHosts)||rawHosts.length>100)
    invalid('allowedHosts deve ser uma lista com até 100 hosts');
  return {
    name:text(input.name,'name',2,200),kind,
    baseUrl:safeHttpsUrl(input.baseUrl,'baseUrl'),
    allowedHosts:[...new Set(rawHosts.map((value)=>host(value,'allowedHosts')))],
    robotsPolicy,
    crawlDelayMs:input.crawlDelayMs===undefined?1_000
      :integer(input.crawlDelayMs,'crawlDelayMs',250,3_600_000),
  };
}

export function crawlTargetInput(body:unknown):CrawlTargetInput{
  const input=record(body);
  return {
    sourceId:uuid(input.sourceId,'sourceId'),
    url:safeHttpsUrl(input.url,'url'),
    discoveryMode:input.discoveryMode===undefined?'EDITORIAL'
      :enumValue(input.discoveryMode,'discoveryMode',DISCOVERY_MODES),
    scheduleKey:optionalText(input.scheduleKey,'scheduleKey',80)||null,
    maxBytes:input.maxBytes===undefined?5_000_000
      :integer(input.maxBytes,'maxBytes',1_024,25*1024*1024),
  };
}

export function sourceKindFilter(value:unknown):SourceKind|undefined{
  if(value===undefined||value===null||value==='')return undefined;
  return enumValue(value,'kind',SOURCE_KINDS);
}

export function optionalUuid(value:unknown,key:string):string|undefined{
  if(value===undefined||value===null||value==='')return undefined;
  return uuid(value,key);
}

export function ingestionRunStatus(value:unknown):string|undefined{
  if(value===undefined||value===null||value==='')return undefined;
  return enumValue(value,'status',['RUNNING','SUCCEEDED','FAILED','CANCELLED'] as const);
}

export function discoveryStatus(value:unknown):string{
  if(value===undefined||value===null||value==='')return 'NEW';
  return enumValue(value,'status',['NEW','ACCEPTED','REJECTED','DUPLICATE'] as const);
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
function enumValue<T extends string>(value:unknown,key:string,values:readonly T[]):T{
  const result=text(value,key,1,80).toUpperCase() as T;
  if(!values.includes(result))invalid(`${key} inválido`);
  return result;
}
function integer(value:unknown,key:string,min:number,max:number):number{
  if(typeof value!=='number'||!Number.isInteger(value)||value<min||value>max)
    invalid(`${key} deve ser inteiro entre ${min} e ${max}`);
  return value;
}
function uuid(value:unknown,key:string):string{
  const result=text(value,key,36,36);
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(result))
    invalid(`${key} deve ser UUID`);
  return result;
}
function host(value:unknown,key:string):string{
  const result=text(value,key,1,253).toLowerCase().replace(/\.$/,'');
  if(result==='localhost'||!/^([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(result))
    invalid(`${key} contém host inválido`);
  return result;
}
function safeHttpsUrl(value:unknown,key:string):string{
  const raw=text(value,key,8,2_048);
  let parsed:URL;
  try{parsed=new URL(raw);}catch{invalid(`${key} deve ser uma URL válida`);}
  if(parsed.protocol!=='https:'||parsed.username||parsed.password||
     (parsed.port&&parsed.port!=='443'))invalid(`${key} deve usar HTTPS sem credenciais`);
  parsed.hash='';
  return parsed.toString();
}
function invalid(message:string):never{throw new BadRequestException(message);}
