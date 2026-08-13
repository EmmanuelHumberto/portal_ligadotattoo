import {GetObjectCommand,PutObjectCommand,S3Client} from '@aws-sdk/client-s3';
import {createHash} from 'node:crypto';
import sharp from 'sharp';
import type {ImageProcessor} from './image-variant.handler';

const MAX_SOURCE_BYTES=25*1024*1024;
const MAX_SOURCE_PIXELS=40_000_000;
const VARIANTS=[
  {key:'thumb',width:320,quality:78},
  {key:'card',width:640,quality:80},
  {key:'hero',width:1280,quality:82},
] as const;

export interface VariantObjectStore {
  get(key:string):Promise<Buffer>;
  put(input:{key:string;body:Buffer;mimeType:string}):Promise<void>;
}

export class SharpImageProcessor implements ImageProcessor {
  constructor(private readonly store:VariantObjectStore) {}

  async createVariants(input:{storageKey:string;mimeType:string}) {
    const source=await this.store.get(input.storageKey);
    if(source.byteLength>MAX_SOURCE_BYTES)throw new Error('MEDIA_SOURCE_TOO_LARGE');
    const results=[];
    for(const spec of VARIANTS) {
      const {data,info}=await sharp(source,{limitInputPixels:MAX_SOURCE_PIXELS})
        .rotate()
        .resize({width:spec.width,fit:'inside',withoutEnlargement:true})
        .webp({quality:spec.quality,effort:4})
        .toBuffer({resolveWithObject:true});
      if(!info.width||!info.height)throw new Error('MEDIA_VARIANT_DIMENSIONS_MISSING');
      const storageKey=variantStorageKey(input.storageKey,spec.key);
      await this.store.put({key:storageKey,body:data,mimeType:'image/webp'});
      results.push({
        key:spec.key,storageKey,width:info.width,height:info.height,
        mimeType:'image/webp',byteSize:data.byteLength,
      });
    }
    return results;
  }
}

export class S3VariantObjectStore implements VariantObjectStore {
  constructor(
    private readonly bucket:string,
    private readonly client:S3Client,
  ) {}

  async get(key:string) {
    const response=await this.client.send(new GetObjectCommand({
      Bucket:this.bucket,Key:key,
    }));
    if(Number(response.ContentLength??0)>MAX_SOURCE_BYTES)
      throw new Error('MEDIA_SOURCE_TOO_LARGE');
    if(!response.Body)throw new Error('MEDIA_SOURCE_BODY_MISSING');
    const bytes=await response.Body.transformToByteArray();
    if(bytes.byteLength>MAX_SOURCE_BYTES)throw new Error('MEDIA_SOURCE_TOO_LARGE');
    return Buffer.from(bytes);
  }

  async put(input:{key:string;body:Buffer;mimeType:string}) {
    const digest=createHash('sha256').update(input.body).digest();
    await this.client.send(new PutObjectCommand({
      Bucket:this.bucket,Key:input.key,Body:input.body,
      ContentType:input.mimeType,ContentLength:input.body.byteLength,
      ChecksumSHA256:digest.toString('base64'),
      Metadata:{sha256:digest.toString('hex'),derived:'true'},
    }));
  }
}

export function createImageProcessor(env:NodeJS.ProcessEnv):ImageProcessor {
  const bucket=env.OBJECT_STORAGE_BUCKET?.trim();
  const endpoint=env.OBJECT_STORAGE_ENDPOINT?.trim();
  const accessKey=env.OBJECT_STORAGE_ACCESS_KEY?.trim();
  const secretKey=env.OBJECT_STORAGE_SECRET_KEY?.trim();
  const configured=[bucket,endpoint,accessKey,secretKey].some(Boolean);
  if(!configured)return new UnconfiguredImageProcessor();
  if(!bucket)throw new Error('Missing required environment variable: OBJECT_STORAGE_BUCKET');
  if(!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket))
    throw new Error('Invalid OBJECT_STORAGE_BUCKET');
  if(Boolean(accessKey)!==Boolean(secretKey))
    throw new Error('Object storage credentials must be configured together');
  if(endpoint)validateEndpoint(endpoint);
  const client=new S3Client({
    region:env.OBJECT_STORAGE_REGION?.trim()||'us-east-1',
    endpoint:endpoint||undefined,
    forcePathStyle:booleanValue(env.OBJECT_STORAGE_FORCE_PATH_STYLE,Boolean(endpoint)),
    credentials:accessKey&&secretKey ? {
      accessKeyId:accessKey,secretAccessKey:secretKey,
    } : undefined,
  });
  return new SharpImageProcessor(new S3VariantObjectStore(bucket,client));
}

export function variantStorageKey(sourceKey:string,variantKey:string) {
  const sourceHash=createHash('sha256').update(sourceKey).digest('hex').slice(0,32);
  return `variants/${sourceHash}/${variantKey}.webp`;
}

class UnconfiguredImageProcessor implements ImageProcessor {
  async createVariants():Promise<never> {
    throw new Error('Object storage is not configured for image variants');
  }
}

function booleanValue(value:string|undefined,fallback:boolean) {
  if(value===undefined||value.trim()==='')return fallback;
  if(value==='true')return true;
  if(value==='false')return false;
  throw new Error('Invalid OBJECT_STORAGE_FORCE_PATH_STYLE');
}

function validateEndpoint(value:string) {
  let url:URL;
  try {url=new URL(value);} catch {throw new Error('Invalid OBJECT_STORAGE_ENDPOINT');}
  const local=['localhost','127.0.0.1','::1'].includes(url.hostname);
  if(url.protocol!=='https:'&&!(local&&url.protocol==='http:'))
    throw new Error('OBJECT_STORAGE_ENDPOINT must use HTTPS');
  if(url.username||url.password||url.search||url.hash)
    throw new Error('Invalid OBJECT_STORAGE_ENDPOINT');
}
