import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TransactionManager } from '../platform/transaction-manager';
import { PostgresAuditRepository } from '../platform/audit.repository';
import { OutboxRepository } from '../platform/outbox.repository';
import { MediaRights } from './media-rights.domain';
import type {SetMediaRightsInput} from './admin-media.input';

@Injectable()
export class SetMediaRightsHandler {
  constructor(
    private readonly txm:TransactionManager,
    private readonly audit:PostgresAuditRepository,
    private readonly outbox:OutboxRepository,
  ) {}

  execute(input:SetMediaRightsInput&{mediaAssetId:string},actorId:string) {
    return this.txm.run(async tx => {
      const rights=MediaRights.create({id:randomUUID(),...input});
      const asset=await tx.query(
        `select * from media.media_asset where id=$1 for update`,
        [rights.mediaAssetId],
      );
      if (!asset.rowCount)throw Object.assign(new Error('Media asset not found'),{
        name:'NotFoundError',
      });
      if (Number(asset.rows[0].version)!==Number(input.expectedVersion))
        throw Object.assign(new Error('Media asset changed'),{
          name:'ConcurrentModificationError',
        });

      await tx.query(
        `update media.media_rights set is_current=false
          where media_asset_id=$1 and is_current=true`,
        [rights.mediaAssetId],
      );
      await tx.query(
        `insert into media.media_rights
         (id,media_asset_id,status,basis,license_name,source_url,expires_at,
          notes,is_current,decided_by,decided_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8,true,$9,now())`,
        [rights.id,rights.mediaAssetId,rights.status,rights.basis,
         rights.licenseName,rights.sourceUrl,rights.expiresAt,rights.notes,actorId],
      );
      await tx.query(
        `update media.media_asset
            set rights_status=$2,version=version+1,updated_at=now()
          where id=$1`,
        [rights.mediaAssetId,rights.status],
      );

      await this.audit.append({
        actorId,action:'media.rights_changed',subjectType:'MediaAsset',
        subjectId:rights.mediaAssetId,
        metadata:{rightsStatus:rights.status,basis:rights.basis},
      },tx);
      await this.outbox.append({
        id:randomUUID(),type:'media.rights_changed',version:1,
        aggregateType:'MediaAsset',aggregateId:rights.mediaAssetId,
        occurredAt:new Date(),payload:{rightsStatus:rights.status},
      },tx);
      return rights;
    });
  }
}
