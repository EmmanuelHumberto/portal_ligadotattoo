import {Controller,Get,Header,Param,ParseUUIDPipe,Query} from '@nestjs/common';
import { Public } from '../iam/public.decorator';
import { RequireCapability } from '../iam/require-capability.decorator';
import { MediaLibraryQuery } from './media-library.query';
import { PublicMediaQuery } from './public-media.query';

@Controller()
export class MediaLibraryController {
  constructor(
    private readonly library:MediaLibraryQuery,
    private readonly publicMedia:PublicMediaQuery,
  ) {}

  @Get('admin/media')
  @RequireCapability('media.read')
  list(@Query('status') status?:string,@Query('rights') rights?:string) {
    return this.library.list({status,rights});
  }

  @Get('admin/media/review-queue')
  @RequireCapability('media.review')
  queue(){ return this.library.reviewQueue(); }

  @Get('public/media/:subjectType/:subjectId')
  @Public()
  @Header('Cache-Control','private, no-store')
  subject(
    @Param('subjectType') subjectType:string,
    @Param('subjectId',ParseUUIDPipe) subjectId:string,
  ){ return this.publicMedia.forSubject(subjectType,subjectId); }
}
