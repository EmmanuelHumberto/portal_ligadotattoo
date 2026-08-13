import {BadRequestException,Inject,Injectable,Logger} from '@nestjs/common';
import {randomUUID} from 'node:crypto';
import {PostgresAuditRepository} from '../platform/audit.repository';
import {OutboxRepository} from '../platform/outbox.repository';
import {TransactionManager} from '../platform/transaction-manager';
import {MediaAsset} from './media.domain';
import {MediaRepository} from './media.repository';
import {
  MEDIA_STORAGE,type MediaStoragePort,type StoredObject,
} from './media-storage.port';
import {validateUpload} from './upload-validator';

const EXTENSION:Record<string,string>={
  'image/jpeg':'jpg','image/png':'png','image/webp':'webp',
  'image/avif':'avif','application/pdf':'pdf',
};

@Injectable()
export class UploadMediaHandler {
  private readonly logger=new Logger(UploadMediaHandler.name);

  constructor(
    @Inject(MEDIA_STORAGE) private readonly storage:MediaStoragePort,
    private readonly txm:TransactionManager,
    private readonly media:MediaRepository,
    private readonly audit:PostgresAuditRepository,
    private readonly outbox:OutboxRepository,
  ) {}

  async execute(file:Express.Multer.File|undefined,actorId:string) {
    if(!file?.buffer)throw new BadRequestException('File is required');
    try {
      validateUpload({
        mimeType:file.mimetype,byteSize:file.size,head:file.buffer.subarray(0,32),
      });
    } catch(error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Invalid upload');
    }

    const id=randomUUID();
    const storageKey=objectKey(id,file.mimetype,new Date());
    let stored:StoredObject|undefined;
    try {
      const storedObject=await this.storage.put({
        key:storageKey,body:file.buffer,mimeType:file.mimetype,
      });
      stored=storedObject;
      const asset=MediaAsset.register({
        id,kind:file.mimetype.startsWith('image/')?'IMAGE':'DOCUMENT',
        storageKey:storedObject.storageKey,mimeType:storedObject.mimeType,
        byteSize:storedObject.byteSize,sha256:storedObject.sha256,
      });
      await this.txm.run(async tx=>{
        await this.media.insert(asset,tx);
        await this.audit.append({
          actorId,action:'media.uploaded',subjectType:'MediaAsset',subjectId:id,
          metadata:{mimeType:storedObject.mimeType,byteSize:storedObject.byteSize},
        },tx);
        await this.outbox.append({
          id:randomUUID(),type:'media.asset_uploaded',version:1,
          aggregateType:'MediaAsset',aggregateId:id,occurredAt:new Date(),
          payload:{mimeType:storedObject.mimeType,byteSize:storedObject.byteSize},
        },tx);
      });
      return {
        id,kind:asset.kind,mimeType:asset.mimeType,byteSize:asset.byteSize,
        sha256:asset.sha256,rightsStatus:asset.rightsStatus,status:asset.status,
        version:asset.version,
      };
    } catch(error) {
      if(stored)await this.storage.delete(storageKey).catch(cleanupError=>{
        this.logger.error('media_upload_compensation_failed',{
          storageKey,error:cleanupError instanceof Error ? cleanupError.name : 'UnknownError',
        });
      });
      throw error;
    }
  }
}

export function objectKey(id:string,mimeType:string,now:Date) {
  const extension=EXTENSION[mimeType];
  if(!extension)throw new Error('UPLOAD_TYPE_NOT_ALLOWED');
  const year=String(now.getUTCFullYear());
  const month=String(now.getUTCMonth()+1).padStart(2,'0');
  return `originals/${year}/${month}/${id}.${extension}`;
}
