import {GetObjectCommand,S3Client} from '@aws-sdk/client-s3';
import {getSignedUrl} from '@aws-sdk/s3-request-presigner';
import type {MediaDeliveryPort} from './media-storage.port';
import {readObjectStorageConfig} from './s3-media-storage.adapter';

export class S3MediaDelivery implements MediaDeliveryPort {
  constructor(
    private readonly bucket:string,
    private readonly expiresInSeconds:number,
    private readonly client:S3Client,
  ) {}

  url(storageKey:string) {
    return getSignedUrl(this.client,new GetObjectCommand({
      Bucket:this.bucket,Key:storageKey,
      ResponseCacheControl:'private, max-age=60',
      ResponseContentDisposition:'inline',
    }),{expiresIn:this.expiresInSeconds});
  }
}

export function createMediaDelivery(
  env:NodeJS.ProcessEnv,
):MediaDeliveryPort {
  const config=readObjectStorageConfig(env);
  if(!config)return new UnconfiguredMediaDelivery();
  const expiresInSeconds=boundedInteger(
    env.MEDIA_SIGNED_URL_TTL_SECONDS,300,60,3600,
  );
  return new S3MediaDelivery(config.bucket,expiresInSeconds,new S3Client({
    region:config.region,endpoint:config.endpoint,
    forcePathStyle:config.forcePathStyle,
    credentials:config.accessKey&&config.secretKey ? {
      accessKeyId:config.accessKey,secretAccessKey:config.secretKey,
    } : undefined,
  }));
}

class UnconfiguredMediaDelivery implements MediaDeliveryPort {
  async url():Promise<never> {
    throw new Error('Object storage is not configured for media delivery');
  }
}

function boundedInteger(
  value:string|undefined,fallback:number,min:number,max:number,
) {
  const result=Number(value??fallback);
  if(!Number.isInteger(result)||result<min||result>max)
    throw new Error('Invalid MEDIA_SIGNED_URL_TTL_SECONDS');
  return result;
}
