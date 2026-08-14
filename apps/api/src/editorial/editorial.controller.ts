import {
  Body,Controller,Delete,Get,NotFoundException,Param,Post,Query,
} from '@nestjs/common';
import { Actor } from '../iam/actor.decorator';
import { Public } from '../iam/public.decorator';
import { RequireCapability } from '../iam/require-capability.decorator';
import { CreateEditorialHandler } from './create-editorial.handler';
import { EditorialWorkflowHandler } from './review-publish.handler';
import { EditorialQuery } from './editorial.query';
import { GenerateAIDraftHandler } from './generate-ai-draft.handler';
import { StoryCandidateQuery } from './story-candidate.query';

@Controller()
export class EditorialController {
  constructor(
    private readonly createHandler:CreateEditorialHandler,
    private readonly workflow:EditorialWorkflowHandler,
    private readonly query:EditorialQuery,
    private readonly aiDraft:GenerateAIDraftHandler,
    private readonly candidates:StoryCandidateQuery,
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

  @Get('admin/editorial/candidates')
  @RequireCapability('editorial.read')
  adminCandidates(@Query('status') status?:string) {
    return this.candidates.candidates(status);
  }

  @Get('admin/editorial/:id')
  @RequireCapability('editorial.read')
  async adminDetail(@Param('id') id:string) {
    const result=await this.query.adminById(id);
    if (!result) throw new NotFoundException('Editorial content not found');
    return result;
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

  @Delete('admin/editorial/:id')
  @RequireCapability('editorial.write')
  remove(@Param('id') id:string,@Body() body:any,@Actor() actor:any) {
    return this.workflow.remove(id,body.expectedVersion,actor.actorId);
  }

  @Post('admin/editorial/:id/unpublish')
  @RequireCapability('editorial.publish')
  unpublish(@Param('id') id:string,@Body() body:any,@Actor() actor:any) {
    return this.workflow.unpublish(id,body.expectedVersion,actor.actorId);
  }

  @Post('admin/editorial/ai-draft')
  @RequireCapability('editorial.write')
  ai(@Body() body:any,@Actor() actor:any) {
    return this.aiDraft.execute({...body,actorId:actor.actorId});
  }
}
