import {
  Body,Controller,Get,NotFoundException,Param,Post,Query,
} from '@nestjs/common';
import { Actor } from '../iam/actor.decorator';
import { Public } from '../iam/public.decorator';
import { RequireCapability } from '../iam/require-capability.decorator';
import { CreateEditorialHandler } from './create-editorial.handler';
import { EditorialWorkflowHandler } from './review-publish.handler';
import { EditorialQuery } from './editorial.query';
import { GenerateAIDraftHandler } from './generate-ai-draft.handler';

@Controller()
export class EditorialController {
  constructor(
    private readonly createHandler:CreateEditorialHandler,
    private readonly workflow:EditorialWorkflowHandler,
    private readonly query:EditorialQuery,
    private readonly aiDraft:GenerateAIDraftHandler,
  ) {}

  @Get('public/editorial')
  @Public()
  listPublic(@Query('type') type?:string) {
    return this.query.publicList(type);
  }

  @Get('public/editorial/:slug')
  @Public()
  async publicDetail(@Param('slug') slug:string) {
    const result=await this.query.publicBySlug(slug);
    if (!result) throw new NotFoundException('Editorial content not found');
    return result;
  }

  @Get('admin/editorial')
  @RequireCapability('editorial.read')
  adminList(@Query('status') status?:string) {
    return this.query.adminList(status);
  }

  @Post('admin/editorial')
  @RequireCapability('editorial.write')
  create(@Body() body:any,@Actor() actor:any) {
    return this.createHandler.execute(body,actor.actorId);
  }

  @Post('admin/editorial/:id/submit')
  @RequireCapability('editorial.write')
  submit(@Param('id') id:string,@Body() body:any,@Actor() actor:any) {
    return this.workflow.submit(id,body.expectedVersion,actor.actorId);
  }

  @Post('admin/editorial/:id/approve')
  @RequireCapability('editorial.approve')
  approve(@Param('id') id:string,@Body() body:any,@Actor() actor:any) {
    return this.workflow.approve(
      id,body.expectedVersion,actor.actorId,body.reason,
    );
  }

  @Post('admin/editorial/:id/schedule')
  @RequireCapability('editorial.publish')
  schedule(@Param('id') id:string,@Body() body:any,@Actor() actor:any) {
    return this.workflow.schedule(
      id,body.expectedVersion,actor.actorId,new Date(body.publishAt),
    );
  }

  @Post('admin/editorial/:id/publish')
  @RequireCapability('editorial.publish')
  publish(@Param('id') id:string,@Body() body:any,@Actor() actor:any) {
    return this.workflow.publish(id,body.expectedVersion,actor.actorId);
  }

  @Post('admin/editorial/ai-draft')
  @RequireCapability('editorial.write')
  ai(@Body() body:any,@Actor() actor:any) {
    return this.aiDraft.execute(body,actor.actorId);
  }
}
