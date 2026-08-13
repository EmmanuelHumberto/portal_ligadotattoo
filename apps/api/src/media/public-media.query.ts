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
          and exists (
            select 1 from media.media_rights mr
             where mr.media_asset_id=a.id and mr.is_current=true
               and mr.status='PERMITTED'
               and (mr.expires_at is null or mr.expires_at > now())
          )
        order by l.is_primary desc,l.sort_order,a.id,v.width`,
      [subjectType,subjectId],
    );

    const grouped=new Map<string,any>();
    for (const x of r.rows) {
      if (!grouped.has(x.id)) grouped.set(x.id,{
        id:x.id,kind:x.kind,role:x.role,isPrimary:x.is_primary,
        alt:x.alt_text,attribution:x.attribution,
        storageKey:x.storage_key,variants:[],
      });
      if (x.variant_key) grouped.get(x.id).variants.push({
        key:x.variant_key,width:x.width,height:x.height,
        storageKey:x.variant_storage_key,
      });
    }
    const items=await Promise.all([...grouped.values()].map(async item=>{
      const preferred=item.variants.find((variant:any)=>variant.key==='hero')
        ?? item.variants.find((variant:any)=>variant.key==='card')
        ?? item.variants.find((variant:any)=>variant.key==='thumb');
      return {
       id:item.id,kind:item.kind,role:item.role,isPrimary:item.isPrimary,
       alt:item.alt,attribution:item.attribution,
       url:await this.delivery.url(preferred?.storageKey??item.storageKey),
       variants:await Promise.all(item.variants.map(async (variant:any)=>({
        key:variant.key,width:variant.width,height:variant.height,
        url:await this.delivery.url(variant.storageKey),
       }))),
      };
    }));
    return {items};
  }
}
