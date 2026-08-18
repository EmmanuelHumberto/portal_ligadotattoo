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
}
