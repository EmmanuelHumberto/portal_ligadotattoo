import { Pool } from 'pg';

export class MediaRightsExpiryHandler {
  readonly type='media.expire_rights';
  constructor(private readonly pool:Pool){}

  async handle() {
    const r=await this.pool.query(
      `update media.media_asset a
          set rights_status='EXPIRED',version=version+1,updated_at=now()
         from media.media_rights mr
        where mr.media_asset_id=a.id and mr.is_current=true
          and mr.status='PERMITTED' and mr.expires_at is not null
          and mr.expires_at <= now() and a.rights_status='PERMITTED'
        returning a.id`,
    );
    for (const x of r.rows) {
      await this.pool.query(
        `insert into ops.cache_invalidation
         (id,cache_key,reason,created_at)
         values (gen_random_uuid(),$1,'media-rights-expired',now())`,
        [`media:${x.id}`],
      );
    }
    return 'DONE' as const;
  }
}
