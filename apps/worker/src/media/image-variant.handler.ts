import { Pool } from 'pg';

/**
 * Image processor is deliberately an injected boundary.
 * Concrete implementation can use Sharp/libvips in the worker deployment.
 */
export interface ImageProcessor {
  createVariants(input:{
    storageKey:string;mimeType:string;
  }):Promise<Array<{
    key:string;storageKey:string;width:number;height:number;
    mimeType:string;byteSize:number;
  }>>;
}

export class ImageVariantHandler {
  readonly type='media.create_variants';
  constructor(
    private readonly pool:Pool,
    private readonly processor:ImageProcessor,
  ) {}

  async handle(payload:any) {
    const r=await this.pool.query(
      `select id,storage_key,mime_type,status from media.media_asset where id=$1`,
      [payload.mediaAssetId],
    );
    if (!r.rowCount || r.rows[0].status!=='ACTIVE') return 'DONE' as const;
    if (!String(r.rows[0].mime_type).startsWith('image/')) return 'DONE' as const;

    const variants=await this.processor.createVariants({
      storageKey:r.rows[0].storage_key,mimeType:r.rows[0].mime_type,
    });
    for (const v of variants) {
      await this.pool.query(
        `insert into media.media_variant
         (id,media_asset_id,variant_key,storage_key,width,height,mime_type,
          byte_size,created_at)
         values (gen_random_uuid(),$1,$2,$3,$4,$5,$6,$7,now())
         on conflict (media_asset_id,variant_key) do update
           set storage_key=excluded.storage_key,width=excluded.width,
               height=excluded.height,mime_type=excluded.mime_type,
               byte_size=excluded.byte_size`,
        [payload.mediaAssetId,v.key,v.storageKey,v.width,v.height,
         v.mimeType,v.byteSize],
      );
    }
    return 'DONE' as const;
  }
}
