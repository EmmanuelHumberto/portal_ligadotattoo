import { Inject,Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../platform/database.module';

@Injectable()
export class MediaLibraryQuery {
  constructor(@Inject(PG_POOL) private readonly pool:Pool){}

  async list(input:{status?:string;rights?:string;limit?:number}) {
    const r=await this.pool.query(
      `select a.id,a.kind,a.mime_type,a.byte_size,a.alt_text,a.attribution,
              a.rights_status,a.status,a.origin_type,a.version,
              a.created_at,a.updated_at,
              mr.basis,mr.license_name,mr.expires_at,
              count(v.id)::int variant_count
         from media.media_asset a
         left join media.media_rights mr on mr.media_asset_id=a.id
           and mr.is_current=true
         left join media.media_variant v on v.media_asset_id=a.id
        where ($1::text is null or a.status=$1)
          and ($2::text is null or a.rights_status=$2)
        group by a.id,mr.basis,mr.license_name,mr.expires_at
        order by a.updated_at desc limit $3`,
      [input.status ?? null,input.rights ?? null,
       Math.min(Math.max(input.limit ?? 50,1),200)],
    );
    return {items:r.rows};
  }

  async reviewQueue(limit=100) {
    const r=await this.pool.query(
      `select id,kind,mime_type,byte_size,alt_text,attribution,
              rights_status,origin_type,created_at,version
         from media.media_asset
        where status='ACTIVE' and rights_status in ('UNKNOWN','PENDING')
        order by created_at limit $1`,
      [Math.min(Math.max(limit,1),200)],
    );
    return {items:r.rows};
  }
}
