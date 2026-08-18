import {BadRequestException} from '@nestjs/common';

export const PRODUCT_TYPES=[
  'PEN','ROTARY','COIL','CARTRIDGE','INK','BATTERY','POWER_SUPPLY','ACCESSORY',
] as const;
export const PRODUCT_LIFECYCLES=[
  'ANNOUNCED','ACTIVE','DISCONTINUED','LEGACY','UNKNOWN',
] as const;

export type ProductType=typeof PRODUCT_TYPES[number];
export type ProductLifecycleInput=typeof PRODUCT_LIFECYCLES[number];
export type ProductFactInput={key:string;value:unknown;unit:string|null};

export function productCreateInput(body:unknown){
  const object=record(body);
  const manufacturerId=uuidInput(object.manufacturerId,'manufacturerId');
  const brandId=object.brandId==null||object.brandId===''
    ? undefined:uuidInput(object.brandId,'brandId');
  const slug=requiredString(object.slug,1,160,'slug');
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))
    throw new BadRequestException('slug inválido');
  return {manufacturerId,brandId,slug,
    productTypeKey:productTypeInput(body),
    name:requiredString(object.name,3,200,'name'),
    modelCode:optionalString(object.modelCode,1,100,'modelCode'),
  };
}

export function productTypeInput(body:unknown):ProductType {
  const value=stringField(body,'productTypeKey').toUpperCase();
  if(!PRODUCT_TYPES.includes(value as ProductType))
    throw new BadRequestException(`Tipo de produto inválido: ${value}`);
  return value as ProductType;
}

export function productSpecsInput(body:unknown):ProductFactInput[] {
  const object=record(body);
  const facts:ProductFactInput[]=[];
  const summary=optionalString(object.summary,3,1000,'summary');
  const description=optionalString(object.description,3,10_000,'description');
  if(summary)facts.push({key:'summary',value:summary,unit:null});
  if(description)facts.push({key:'description',value:description,unit:null});
  if(object.specs!==undefined&&!Array.isArray(object.specs))
    throw new BadRequestException('specs deve ser uma lista');
  const keys=new Set(facts.map(x=>x.key));
  for(const raw of (object.specs as unknown[]|undefined)??[]){
    const spec=record(raw);
    const key=requiredString(spec.key,1,100,'specs.key');
    if(spec.value===undefined)throw new BadRequestException(`Valor ausente: ${key}`);
    if(keys.has(key))throw new BadRequestException(`Especificação duplicada: ${key}`);
    keys.add(key);
    facts.push({
      key,value:spec.value,
      unit:spec.unit==null||spec.unit===''?null:requiredString(spec.unit,1,40,'specs.unit'),
    });
  }
  if(!facts.length)throw new BadRequestException('Nenhuma especificação informada');
  return facts;
}

export function productMetaInput(body:unknown) {
  const object=record(body);
  const input:{lifecycle?:ProductLifecycleInput;modelCode?:string|null;
    releaseDate?:string|null;discontinuedDate?:string|null}={};
  if(object.lifecycle!==undefined){
    const value=requiredString(object.lifecycle,1,30,'lifecycle').toUpperCase();
    if(!PRODUCT_LIFECYCLES.includes(value as ProductLifecycleInput))
      throw new BadRequestException(`Ciclo de vida inválido: ${value}`);
    input.lifecycle=value as ProductLifecycleInput;
  }
  if(object.modelCode!==undefined)
    input.modelCode=nullableString(object.modelCode,100,'modelCode');
  if(object.releaseDate!==undefined)
    input.releaseDate=dateInput(object.releaseDate,'releaseDate');
  if(object.discontinuedDate!==undefined)
    input.discontinuedDate=dateInput(object.discontinuedDate,'discontinuedDate');
  if(!Object.keys(input).length)throw new BadRequestException('Nada para atualizar');
  return input;
}

export function productRenameInput(body:unknown) {
  return requiredString(record(body).name,3,200,'name');
}

export function discoveryInput(body:unknown) {
  const object=record(body);
  return {
    manufacturerSlug:optionalString(object.manufacturerSlug,1,120,'manufacturerSlug')??'',
    machinesOnly:object.machinesOnly===true||object.machinesOnly==='true',
  };
}

function stringField(body:unknown,key:string){
  return requiredString(record(body)[key],1,100,key);
}
function record(value:unknown):Record<string,unknown>{
  if(!value||typeof value!=='object'||Array.isArray(value))
    throw new BadRequestException('Corpo JSON inválido');
  return value as Record<string,unknown>;
}
function requiredString(value:unknown,min:number,max:number,key:string){
  if(typeof value!=='string')throw new BadRequestException(`${key} deve ser texto`);
  const result=value.trim();
  if(result.length<min||result.length>max)
    throw new BadRequestException(`${key} deve ter entre ${min} e ${max} caracteres`);
  return result;
}
function optionalString(value:unknown,min:number,max:number,key:string){
  if(value===undefined||value===null||value==='')return undefined;
  return requiredString(value,min,max,key);
}
function nullableString(value:unknown,max:number,key:string){
  if(value===null||value==='')return null;
  return requiredString(value,1,max,key);
}
function dateInput(value:unknown,key:string){
  if(value===null||value==='')return null;
  const result=requiredString(value,10,10,key);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(result)||Number.isNaN(Date.parse(`${result}T00:00:00Z`)))
    throw new BadRequestException(`Data inválida (${key}): ${result}`);
  return result;
}
function uuidInput(value:unknown,key:string){
  const result=requiredString(value,36,36,key);
  if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(result))
    throw new BadRequestException(`${key} deve ser UUID`);
  return result;
}
