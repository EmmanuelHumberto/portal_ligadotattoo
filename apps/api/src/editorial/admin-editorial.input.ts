import {BadRequestException} from '@nestjs/common';
import type {EditorialBlock,EditorialDocument,EditorialType} from './editorial.types';

const EDITORIAL_TYPES:EditorialType[]=[
  'NEWS','BLOG','EVENT','TECHNICAL_ARTICLE','NOTICE',
];

export type CreateEditorialInput={
  contentType:EditorialType;title:string;slug:string;subtitle?:string;
  summary?:string;body:EditorialDocument;
  origin?:'HUMAN'|'AI_ASSISTED'|'INGESTION_ASSISTED';
};
export type UpdateEditorialInput={
  title:string;subtitle:string|null;summary:string|null;body:EditorialDocument;
};
export type SocialEditorialInput={
  url:string;text:string;imageUrl:string;mediaIds:string[];
};
export type AIDraftInput={
  candidateId?:string;sourceText?:string;sourceUrl?:string;
  requestedType?:EditorialType;verbatim?:boolean;
};
export type EditorialTopicInput={
  name:string;query:string;language:string;maxArticles:number;
};

export function createEditorialInput(body:unknown):CreateEditorialInput{
  const input=record(body);
  return {
    contentType:editorialType(input.contentType,'contentType'),
    title:text(input.title,'title',3,240),
    slug:slug(input.slug),
    ...optionalTextProperty(input.subtitle,'subtitle',300),
    ...optionalTextProperty(input.summary,'summary',2_000),
    body:document(input.body),
  };
}

export function updateEditorialInput(body:unknown):UpdateEditorialInput{
  const input=record(body);
  return {
    title:text(input.title,'title',3,240),
    subtitle:nullableText(input.subtitle,'subtitle',300),
    summary:nullableText(input.summary,'summary',2_000),
    body:input.body===undefined?{version:1,blocks:[]}:document(input.body),
  };
}

export function socialEditorialInput(body:unknown):SocialEditorialInput{
  const input=record(body);
  const url=optionalHttpUrl(input.url,'url');
  const sourceText=optionalText(input.text,'text',100_000);
  if(!url&&!sourceText)invalid('URL ou texto da postagem são obrigatórios');
  const imageUrl=optionalHttpUrl(input.imageUrl,'imageUrl');
  const rawMedia=input.mediaIds===undefined?[]:input.mediaIds;
  if(!Array.isArray(rawMedia)||rawMedia.length>20)
    invalid('mediaIds deve ser uma lista com até 20 UUIDs');
  return {url,text:sourceText,imageUrl,
    mediaIds:[...new Set(rawMedia.map(value=>uuid(value,'mediaIds')))]};
}

export function workflowVersionInput(body:unknown):number{
  return positiveInteger(record(body).expectedVersion,'expectedVersion');
}

export function approvalInput(body:unknown){
  const input=record(body);
  return {expectedVersion:positiveInteger(input.expectedVersion,'expectedVersion'),
    reason:text(input.reason,'reason',3,1_000)};
}

export function scheduleInput(body:unknown){
  const input=record(body);
  return {expectedVersion:positiveInteger(input.expectedVersion,'expectedVersion'),
    publishAt:dateTime(input.publishAt,'publishAt')};
}

export function aiDraftInput(body:unknown):AIDraftInput{
  const input=record(body);
  const result:AIDraftInput={};
  if(input.candidateId!=null&&input.candidateId!=='')
    result.candidateId=uuid(input.candidateId,'candidateId');
  if(input.sourceText!=null&&input.sourceText!=='')
    result.sourceText=text(input.sourceText,'sourceText',1,100_000);
  if(input.sourceUrl!=null&&input.sourceUrl!=='')
    result.sourceUrl=httpUrl(input.sourceUrl,'sourceUrl');
  if(input.requestedType!=null&&input.requestedType!=='')
    result.requestedType=editorialType(input.requestedType,'requestedType');
  if(input.verbatim!==undefined){
    if(typeof input.verbatim!=='boolean')invalid('verbatim deve ser booleano');
    result.verbatim=input.verbatim;
  }
  if(!result.candidateId&&!result.sourceText)
    invalid('candidateId ou sourceText é obrigatório');
  return result;
}

export function autoDraftConfigInput(body:unknown):boolean{
  const enabled=record(body).enabled;
  if(typeof enabled!=='boolean')invalid('enabled deve ser booleano');
  return enabled;
}

export function editorialTopicInput(body:unknown):EditorialTopicInput{
  const input=record(body);
  const rawMax=input.maxArticles===undefined?5:input.maxArticles;
  if(typeof rawMax!=='number'||!Number.isInteger(rawMax)||rawMax<1||rawMax>20)
    invalid('maxArticles deve ser inteiro entre 1 e 20');
  const language=optionalText(input.language,'language',20)||'pt-BR';
  if(!/^[a-z]{2}(?:-[A-Z]{2})?$/.test(language))invalid('language inválido');
  return {name:text(input.name,'name',2,160),query:text(input.query,'query',2,500),
    language,maxArticles:rawMax};
}

export function editorialTopicStatusInput(body:unknown):'ACTIVE'|'PAUSED'{
  const status=text(record(body).status,'status',1,20).toUpperCase();
  if(status!=='ACTIVE'&&status!=='PAUSED')invalid('status deve ser ACTIVE ou PAUSED');
  return status;
}

function document(value:unknown):EditorialDocument{
  const input=record(value);
  if(input.version!==1)invalid('body.version deve ser 1');
  if(!Array.isArray(input.blocks)||input.blocks.length>1_000)
    invalid('body.blocks deve ser uma lista com até 1000 blocos');
  return {version:1,blocks:input.blocks.map((value,index)=>block(value,index))};
}

function block(value:unknown,index:number):EditorialBlock{
  const input=record(value);
  const key=`body.blocks[${index}]`;
  const type=text(input.type,`${key}.type`,1,40);
  switch(type){
    case 'paragraph':return {type,text:text(input.text,`${key}.text`,1,20_000)};
    case 'heading':{
      const level=positiveInteger(input.level,`${key}.level`);
      if(level!==2&&level!==3)invalid(`${key}.level deve ser 2 ou 3`);
      return {type,level,text:text(input.text,`${key}.text`,1,500)};
    }
    case 'image':return {type,mediaId:uuid(input.mediaId,`${key}.mediaId`),
      ...(optionalText(input.caption,`${key}.caption`,500)?
        {caption:optionalText(input.caption,`${key}.caption`,500)}:{})};
    case 'quote':return {type,text:text(input.text,`${key}.text`,1,5_000),
      ...(optionalText(input.attribution,`${key}.attribution`,500)?
        {attribution:optionalText(input.attribution,`${key}.attribution`,500)}:{})};
    case 'callout':{
      if(input.tone!=='info'&&input.tone!=='warning')invalid(`${key}.tone inválido`);
      const title=optionalText(input.title,`${key}.title`,300);
      return {type,tone:input.tone,text:text(input.text,`${key}.text`,1,5_000),
        ...(title?{title}:{})};
    }
    case 'table':return {type,columns:stringArray(input.columns,`${key}.columns`,50),
      rows:rows(input.rows,`${key}.rows`)};
    case 'steps':{
      if(!Array.isArray(input.items)||input.items.length>100)invalid(`${key}.items inválido`);
      return {type,items:input.items.map((item,i)=>{
        const entry=record(item);
        return {title:text(entry.title,`${key}.items[${i}].title`,1,300),
          body:text(entry.body,`${key}.items[${i}].body`,1,5_000)};
      })};
    }
    case 'productReference':return {type,productId:uuid(input.productId,`${key}.productId`)};
    case 'technicalIssueReference':return {type,issueId:uuid(input.issueId,`${key}.issueId`)};
    case 'sourceList':return {type,sourceIds:uuidArray(input.sourceIds,`${key}.sourceIds`,100)};
    default:invalid(`${key}.type inválido: ${type}`);
  }
}

function rows(value:unknown,key:string):string[][]{
  if(!Array.isArray(value)||value.length>500)invalid(`${key} inválido`);
  return value.map((row,index)=>stringArray(row,`${key}[${index}]`,50));
}
function stringArray(value:unknown,key:string,max:number):string[]{
  if(!Array.isArray(value)||value.length>max)invalid(`${key} inválido`);
  return value.map((item,index)=>text(item,`${key}[${index}]`,1,2_000));
}
function uuidArray(value:unknown,key:string,max:number):string[]{
  if(!Array.isArray(value)||value.length>max)invalid(`${key} inválido`);
  return [...new Set(value.map((item)=>uuid(item,key)))];
}
function editorialType(value:unknown,key:string):EditorialType{
  const result=text(value,key,1,40).toUpperCase() as EditorialType;
  if(!EDITORIAL_TYPES.includes(result))invalid(`${key} inválido`);
  return result;
}
function slug(value:unknown):string{
  const result=text(value,'slug',1,180);
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(result))invalid('slug inválido');
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
function optionalTextProperty(value:unknown,key:string,max:number):Record<string,string>{
  const result=optionalText(value,key,max);
  return result?{[key]:result}:{};
}
function nullableText(value:unknown,key:string,max:number):string|null{
  return optionalText(value,key,max)||null;
}
function uuid(value:unknown,key:string):string{
  const result=text(value,key,36,36);
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(result))
    invalid(`${key} deve ser UUID`);
  return result;
}
function optionalHttpUrl(value:unknown,key:string):string{
  if(value===undefined||value===null||value==='')return '';
  return httpUrl(value,key);
}
function httpUrl(value:unknown,key:string):string{
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
function positiveInteger(value:unknown,key:string):number{
  if(typeof value!=='number'||!Number.isInteger(value)||value<1)
    invalid(`${key} deve ser inteiro positivo`);
  return value;
}
function invalid(message:string):never{throw new BadRequestException(message);}
