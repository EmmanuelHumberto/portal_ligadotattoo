import {Injectable,NotFoundException} from '@nestjs/common';
import {randomUUID} from 'node:crypto';
import {UploadMediaHandler} from '../media/upload-media.handler';
import {PostgresAuditRepository} from '../platform/audit.repository';
import {OutboxRepository} from '../platform/outbox.repository';
import {TransactionManager} from '../platform/transaction-manager';

@Injectable()
export class AttachProductImageHandler {
  constructor(
    private readonly uploads:UploadMediaHandler,
    private readonly txm:TransactionManager,
    private readonly audit:PostgresAuditRepository,
    private readonly outbox:OutboxRepository,
  ) {}

  async execute(productId:string,file:Express.Multer.File|undefined,actorId:string){
    const asset=await this.uploads.execute(file,actorId);
    await this.txm.run(async tx=>{
      const product=await tx.query(
        'select 1 from catalog.product_model where id=$1 for update',[productId],
      );
      if(!product.rowCount)throw new NotFoundException('Produto não encontrado');
      await tx.query(
        `update media.media_asset set rights_status='PERMITTED',
          version=version+1,updated_at=now() where id=$1`,[asset.id],
      );
      await tx.query(
        `insert into media.media_rights
         (id,media_asset_id,status,basis,is_current,decided_by,decided_at)
         values (gen_random_uuid(),$1,'PERMITTED','CURATOR_UPLOAD',true,$2,now())`,
        [asset.id,actorId],
      );
      await tx.query(
        `insert into media.media_link
         (id,media_asset_id,subject_type,subject_id,role,is_primary,sort_order)
         values (gen_random_uuid(),$1,'PRODUCT_MODEL',$2,'hero',true,0)`,
        [asset.id,productId],
      );
      await this.audit.append({actorId,action:'catalog.product_image_attached',
        subjectType:'ProductModel',subjectId:productId,
        metadata:{mediaAssetId:asset.id}},tx);
      await this.outbox.append({id:randomUUID(),type:'media.rights_changed',version:1,
        aggregateType:'MediaAsset',aggregateId:asset.id,occurredAt:new Date(),
        payload:{rightsStatus:'PERMITTED'}},tx);
    });
    return {mediaId:asset.id,productId};
  }
}
