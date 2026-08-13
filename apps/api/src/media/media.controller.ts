import { Body, Controller, Param, Post } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { RequireCapability } from '../iam/require-capability.decorator';
import { TransactionManager } from '../platform/transaction-manager';
import { MediaAsset } from './media.domain';
import { MediaRepository } from './media.repository';

@Controller('admin/media')
export class MediaController {
  constructor(
    private readonly txm: TransactionManager,
    private readonly media: MediaRepository,
  ) {}

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
}
