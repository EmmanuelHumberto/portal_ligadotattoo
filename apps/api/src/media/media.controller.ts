import {
  Body,Controller,Get,Param,ParseUUIDPipe,Post,
  UploadedFile,UseInterceptors,
} from '@nestjs/common';
import {FileInterceptor} from '@nestjs/platform-express';
import {Actor} from '../iam/actor.decorator';
import type {ActorContext} from '../iam/actor-context';
import { RequireCapability } from '../iam/require-capability.decorator';
import {registerMediaInput,setMediaRightsInput} from './admin-media.input';
import {GetMediaUrlHandler} from './get-media-url.handler';
import {RegisterMediaHandler} from './register-media.handler';
import {SetMediaRightsHandler} from './set-media-rights.handler';
import {UploadMediaHandler} from './upload-media.handler';

@Controller('admin/media')
export class MediaController {
  constructor(
    private readonly uploads:UploadMediaHandler,
    private readonly registerHandler:RegisterMediaHandler,
    private readonly rights:SetMediaRightsHandler,
    private readonly mediaUrl:GetMediaUrlHandler,
  ) {}

  @Post('upload')
  @RequireCapability('media.review')
  @UseInterceptors(FileInterceptor('file',{
    limits:{fileSize:25*1024*1024,files:1,fields:5},
  }))
  upload(@UploadedFile() file:Express.Multer.File|undefined,@Actor() actor:ActorContext) {
    return this.uploads.execute(file,actor.actorId);
  }

  @Post()
  @RequireCapability('media.review')
  register(@Body() body:unknown,@Actor() actor:ActorContext) {
    return this.registerHandler.execute(registerMediaInput(body),actor.actorId);
  }

  @Post(':id/rights')
  @RequireCapability('media.review')
  setRights(@Param('id',ParseUUIDPipe) id:string,@Body() body:unknown,
    @Actor() actor:ActorContext) {
    return this.rights.execute({mediaAssetId:id,...setMediaRightsInput(body)},actor.actorId);
  }

  @Get(':id/url')
  @RequireCapability('media.read')
  url(@Param('id',ParseUUIDPipe) id:string) {return this.mediaUrl.execute(id);}
}
