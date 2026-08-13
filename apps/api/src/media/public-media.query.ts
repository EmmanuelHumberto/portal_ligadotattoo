import { Inject,Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../platform/database.module';
import { MEDIA_DELIVERY,MediaDeliveryPort } from './media-storage.port';

@Injectable()
export class PublicMediaQuery {
  constructor(
    @Inject(PG_POOL) private readonly pool:Pool,
    @Inject(MEDIA_DELIVERY) private readonly delivery:MediaDeliveryPort,
  ) {}

  async forSubject(subjectType:string,subjectId:string) {
    const r=await this.pool.query(
      `select a.id,a.kind,a.storage_key,a.alt_text,a.attribution,
              l.role,l.is_primary,l.sort_order,
              v.variant_key,v.storage_key variant_storage_key,
              v.width,v.height
         from media.media_link l
         join media.media_asset a on a.id=l.media_asset_id
         left join media.media_variant v on v.media_asset_id=a.id
        where l.subject_type=$1 and l.subject_id=$2
          and a.status='ACTIVE' and a.rights_status='PERMITTED'
          and not exists (
            select 1 from media.media_rights mr
             where mr.media_asset_id=a.id and mr.is_current=true
               and mr.expires_at is not null and mr.expires_at <= now()
          )
        order by l.is_primary desc,l.sort_order,a.id,v.width`,
      [subjectType,subjectId],
    );

    const grouped=new Map<string,any>();
    for (const x of r.rows) {
      if (!grouped.has(x.id)) grouped.set(x.id,{
        id:x.id,kind:x.kind,role:x.role,isPrimary:x.is_primary,
        alt:x.alt_text,attribution:x.attribution,
        url:this.delivery.publicUrl(x.storage_key),variants:[],
      });
      if (x.variant_key) grouped.get(x.id).variants.push({
        key:x.variant_key,width:x.width,height:x.height,
        url:this.delivery.publicUrl(x.variant_storage_key),
      });
    }
    return {items:[...grouped.values()]};
  }
}
