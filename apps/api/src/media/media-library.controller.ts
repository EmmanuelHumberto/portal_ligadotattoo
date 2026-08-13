import {Body,Controller,Get,Header,Param,Post,Query} from '@nestjs/common';
import { Actor } from '../iam/actor.decorator';
import { Public } from '../iam/public.decorator';
import { RequireCapability } from '../iam/require-capability.decorator';
import { MediaLibraryQuery } from './media-library.query';
import { PublicMediaQuery } from './public-media.query';
import { SetMediaRightsHandler } from './set-media-rights.handler';

@Controller()
export class MediaLibraryController {
  constructor(
    private readonly library:MediaLibraryQuery,
    private readonly publicMedia:PublicMediaQuery,
    private readonly rights:SetMediaRightsHandler,
  ) {}

  @Get('admin/media')
  @RequireCapability('media.read')
  list(@Query('status') status?:string,@Query('rights') rights?:string) {
    return this.library.list({status,rights});
  }

  @Get('admin/media/review-queue')
  @RequireCapability('media.review')
  queue(){ return this.library.reviewQueue(); }

  @Post('admin/media/:id/rights-v2')
  @RequireCapability('media.review')
  setRights(@Param('id') id:string,@Body() body:any,@Actor() actor:any) {
    return this.rights.execute(
      {mediaAssetId:id,...body},actor.actorId,
    );
  }

  @Get('public/media/:subjectType/:subjectId')
  @Public()
  @Header('Cache-Control','private, no-store')
  subject(
    @Param('subjectType') subjectType:string,
    @Param('subjectId') subjectId:string,
  ){ return this.publicMedia.forSubject(subjectType,subjectId); }
}
