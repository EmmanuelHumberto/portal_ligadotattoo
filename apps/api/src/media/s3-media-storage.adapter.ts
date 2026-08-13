import {
  CreateBucketCommand,DeleteObjectCommand,PutObjectCommand,S3Client,
} from '@aws-sdk/client-s3';
import {createHash} from 'node:crypto';
import type {MediaStoragePort} from './media-storage.port';

export type ObjectStorageConfig={
  bucket:string;
  region:string;
  endpoint?:string;
  accessKey?:string;
  secretKey?:string;
  forcePathStyle:boolean;
  autoCreateBucket:boolean;
};

export class S3MediaStorage implements MediaStoragePort {
  private bucketReady:Promise<void>|undefined;

  constructor(
    private readonly config:ObjectStorageConfig,
    private readonly client=new S3Client({
      region:config.region,
      endpoint:config.endpoint,
      forcePathStyle:config.forcePathStyle,
      credentials:config.accessKey&&config.secretKey ? {
        accessKeyId:config.accessKey,secretAccessKey:config.secretKey,
      } : undefined,
    }),
  ) {}

  async put(input:{key:string;body:Buffer;mimeType:string}) {
    await this.ensureBucket();
    const digest=createHash('sha256').update(input.body).digest();
    await this.client.send(new PutObjectCommand({
      Bucket:this.config.bucket,Key:input.key,Body:input.body,
      ContentType:input.mimeType,ContentLength:input.body.byteLength,
      ChecksumSHA256:digest.toString('base64'),
      Metadata:{sha256:digest.toString('hex')},
    }));
    return {
      storageKey:input.key,mimeType:input.mimeType,
      byteSize:input.body.byteLength,sha256:digest.toString('hex'),
    };
  }

  async delete(key:string) {
    await this.client.send(new DeleteObjectCommand({
      Bucket:this.config.bucket,Key:key,
    }));
  }

  private ensureBucket() {
    if(!this.config.autoCreateBucket)return Promise.resolve();
    this.bucketReady??=this.client.send(new CreateBucketCommand({
      Bucket:this.config.bucket,
    })).then(()=>undefined).catch(error=>{
      if(['BucketAlreadyOwnedByYou','BucketAlreadyExists'].includes(error?.name))return;
      this.bucketReady=undefined;
      throw error;
    });
    return this.bucketReady;
  }
}

export function createMediaStorage(env:NodeJS.ProcessEnv):MediaStoragePort {
  const config=readObjectStorageConfig(env);
  if(!config)return {
    async put(){throw new Error('Object storage is not configured');},
    async delete(){return;},
  };
  return new S3MediaStorage(config);
}

export function readObjectStorageConfig(
  env:NodeJS.ProcessEnv,
):ObjectStorageConfig|null {
  const bucket=env.OBJECT_STORAGE_BUCKET?.trim();
  const endpoint=env.OBJECT_STORAGE_ENDPOINT?.trim();
  const accessKey=env.OBJECT_STORAGE_ACCESS_KEY?.trim();
  const secretKey=env.OBJECT_STORAGE_SECRET_KEY?.trim();
  const configured=[bucket,endpoint,accessKey,secretKey].some(Boolean);
  if(!configured)return null;
  if(!bucket)throw new Error('Missing required environment variable: OBJECT_STORAGE_BUCKET');
  if(!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket))
    throw new Error('Invalid OBJECT_STORAGE_BUCKET');
  if(Boolean(accessKey)!==Boolean(secretKey))
    throw new Error('Object storage credentials must be configured together');
  if(endpoint)validateEndpoint(endpoint);
  return {
    bucket,endpoint,accessKey,secretKey,
    region:env.OBJECT_STORAGE_REGION?.trim()||'us-east-1',
    forcePathStyle:booleanValue(env.OBJECT_STORAGE_FORCE_PATH_STYLE,Boolean(endpoint)),
    autoCreateBucket:booleanValue(env.OBJECT_STORAGE_AUTO_CREATE_BUCKET,false),
  };
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

function booleanValue(value:string|undefined,fallback:boolean) {
  if(value===undefined||value.trim()==='')return fallback;
  if(value==='true')return true;
  if(value==='false')return false;
  throw new Error('Invalid object storage boolean configuration');
}
