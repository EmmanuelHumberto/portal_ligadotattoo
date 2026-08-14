import {
  Body,Controller,Get,Inject,NotFoundException,Param,Post,
  UploadedFile,UseInterceptors,
} from '@nestjs/common';
import {FileInterceptor} from '@nestjs/platform-express';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import {Actor} from '../iam/actor.decorator';
import { RequireCapability } from '../iam/require-capability.decorator';
import { PG_POOL } from '../platform/database.module';
import { TransactionManager } from '../platform/transaction-manager';
import { MediaAsset } from './media.domain';
import { MediaRepository } from './media.repository';
import { MEDIA_DELIVERY,MediaDeliveryPort } from './media-storage.port';
import {UploadMediaHandler} from './upload-media.handler';

@Controller('admin/media')
export class MediaController {
  constructor(
    private readonly txm: TransactionManager,
    private readonly media: MediaRepository,
    private readonly uploads:UploadMediaHandler,
    @Inject(PG_POOL) private readonly pool:Pool,
    @Inject(MEDIA_DELIVERY) private readonly delivery:MediaDeliveryPort,
  ) {}

  @Post('upload')
  @RequireCapability('media.review')
  @UseInterceptors(FileInterceptor('file',{
    limits:{fileSize:25*1024*1024,files:1,fields:5},
  }))
  upload(@UploadedFile() file:Express.Multer.File,@Actor() actor:any) {
    return this.uploads.execute(file,actor.actorId);
  }

  @Post()
  @RequireCapability('media.review')
  register(@Body() body:any) {
    return this.txm.run(async tx => {
      const asset = MediaAsset.register({ id:randomUUID(), ...body });
      await this.media.insert(asset, tx);
      return {
        id:asset.id,kind:asset.kind,mimeType:asset.mimeType,
        rightsStatus:asset.rightsStatus,status:asset.status,version:asset.version,
      };
    });
  }

  @Post(':id/rights')
  @RequireCapability('media.review')
  setRights(@Param('id') id:string, @Body() body:any) {
    return this.txm.run(tx =>
      this.media.updateRights(id,body.expectedVersion,body.rightsStatus,tx)
    );
  }

  @Get(':id/url')
  @RequireCapability('media.read')
  async url(@Param('id') id:string) {
    const r=await this.pool.query(
      `select storage_key from media.media_asset where id=$1`,[id],
    );
    if(!r.rowCount) throw new NotFoundException('Media not found');
    return {url: await this.delivery.url(r.rows[0].storage_key)};
  }
}
