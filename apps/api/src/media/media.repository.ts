import { Injectable } from '@nestjs/common';
import type { Tx } from '../platform/transaction-manager';
import { MediaAsset } from './media.domain';

@Injectable()
export class MediaRepository {
  async insert(a: MediaAsset, tx: Tx) {
    await tx.query(
      `insert into media.media_asset
       (id,kind,storage_key,mime_type,byte_size,sha256,rights_status,status,version)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [a.id,a.kind,a.storageKey,a.mimeType,a.byteSize,a.sha256,
       a.rightsStatus,a.status,a.version],
    );
  }

  async updateRights(
    id:string, expectedVersion:number, rightsStatus:string, tx:Tx,
  ) {
    const r = await tx.query(
      `update media.media_asset
          set rights_status=$3,version=version+1,updated_at=now()
        where id=$1 and version=$2
        returning *`,
      [id,expectedVersion,rightsStatus],
    );
    if (!r.rowCount)
      throw Object.assign(new Error('Concurrent media modification'), {
        name:'ConcurrentModificationError',
      });
    return r.rows[0];
  }
}
