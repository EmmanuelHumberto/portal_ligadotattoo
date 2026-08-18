import {Inject,Injectable,NotFoundException} from '@nestjs/common';
import type {Pool} from 'pg';
import {PG_POOL} from '../platform/database.module';
import {MEDIA_DELIVERY,type MediaDeliveryPort} from './media-storage.port';

@Injectable()
export class GetMediaUrlHandler{
  constructor(
    @Inject(PG_POOL) private readonly pool:Pool,
    @Inject(MEDIA_DELIVERY) private readonly delivery:MediaDeliveryPort,
  ){}

  async execute(id:string){
    const result=await this.pool.query(
      `select storage_key from media.media_asset where id=$1`,[id],
    );
    if(!result.rowCount)throw new NotFoundException('Media not found');
    return {url:await this.delivery.url(String(result.rows[0].storage_key))};
  }
}
