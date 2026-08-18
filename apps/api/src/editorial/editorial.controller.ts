import {
  Body,Controller,Delete,Get,NotFoundException,Patch,Param,ParseUUIDPipe,Post,Query,
} from '@nestjs/common';
import { Actor } from '../iam/actor.decorator';
import type {ActorContext} from '../iam/actor-context';
import { Public } from '../iam/public.decorator';
import { RequireCapability } from '../iam/require-capability.decorator';
import {
  aiDraftInput,approvalInput,createEditorialInput,scheduleInput,
  socialEditorialInput,updateEditorialInput,workflowVersionInput,
} from './admin-editorial.input';
import { CreateEditorialHandler } from './create-editorial.handler';
import { EditorialWorkflowHandler } from './review-publish.handler';
import { EditorialQuery } from './editorial.query';
import { GenerateAIDraftHandler } from './generate-ai-draft.handler';
import {IngestSocialEditorialHandler} from './ingest-social-editorial.handler';
import { StoryCandidateQuery } from './story-candidate.query';
import {UpdateEditorialDraftHandler} from './update-editorial-draft.handler';

@Controller()
export class EditorialController {
  constructor(
    private readonly createHandler:CreateEditorialHandler,
    private readonly workflow:EditorialWorkflowHandler,
    private readonly query:EditorialQuery,
    private readonly aiDraft:GenerateAIDraftHandler,
    private readonly candidates:StoryCandidateQuery,
    private readonly updateDraft:UpdateEditorialDraftHandler,
    private readonly ingestSocialHandler:IngestSocialEditorialHandler,
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
  adminList(@Query('status') status?:string,@Query('type') type?:string) {
    return this.query.adminList(status,type);
  }

  @Get('admin/editorial/candidates')
  @RequireCapability('editorial.read')
  adminCandidates(@Query('status') status?:string) {
    return this.candidates.candidates(status);
  }

  @Get('admin/editorial/:id')
  @RequireCapability('editorial.read')
  async adminDetail(@Param('id',ParseUUIDPipe) id:string) {
    const result=await this.query.adminById(id);
    if (!result) throw new NotFoundException('Editorial content not found');
    return result;
  }

  @Post('admin/editorial')
  @RequireCapability('editorial.write')
  create(@Body() body:unknown,@Actor() actor:ActorContext) {
    return this.createHandler.execute(createEditorialInput(body),actor.actorId);
  }

  @Patch('admin/editorial/:id')
  @RequireCapability('editorial.write')
  update(@Param('id',ParseUUIDPipe) id:string,@Body() body:unknown,
    @Actor() actor:ActorContext) {
    return this.updateDraft.execute(id,updateEditorialInput(body),actor.actorId);
  }

  @Post('admin/editorial/ingest-social')
  @RequireCapability('editorial.write')
  ingestSocial(@Body() body:unknown,@Actor() actor:ActorContext) {
    return this.ingestSocialHandler.execute(socialEditorialInput(body),actor.actorId);
  }

  @Post('admin/editorial/:id/submit')
  @RequireCapability('editorial.write')
  submit(@Param('id',ParseUUIDPipe) id:string,@Body() body:unknown,
    @Actor() actor:ActorContext) {
    return this.workflow.submit(id,workflowVersionInput(body),actor.actorId);
  }

  @Post('admin/editorial/:id/approve')
  @RequireCapability('editorial.approve')
  approve(@Param('id',ParseUUIDPipe) id:string,@Body() body:unknown,
    @Actor() actor:ActorContext) {
    const input=approvalInput(body);
    return this.workflow.approve(
      id,input.expectedVersion,actor.actorId,input.reason,
    );
  }

  @Post('admin/editorial/:id/schedule')
  @RequireCapability('editorial.publish')
  schedule(@Param('id',ParseUUIDPipe) id:string,@Body() body:unknown,
    @Actor() actor:ActorContext) {
    const input=scheduleInput(body);
    return this.workflow.schedule(
      id,input.expectedVersion,actor.actorId,input.publishAt,
    );
  }

  @Post('admin/editorial/:id/publish')
  @RequireCapability('editorial.publish')
  publish(@Param('id',ParseUUIDPipe) id:string,@Body() body:unknown,
    @Actor() actor:ActorContext) {
    return this.workflow.publish(id,workflowVersionInput(body),actor.actorId);
  }

  @Delete('admin/editorial/:id')
  @RequireCapability('editorial.write')
  remove(@Param('id',ParseUUIDPipe) id:string,@Body() body:unknown,
    @Actor() actor:ActorContext) {
    return this.workflow.remove(id,workflowVersionInput(body),actor.actorId);
  }

  @Post('admin/editorial/:id/unpublish')
  @RequireCapability('editorial.publish')
  unpublish(@Param('id',ParseUUIDPipe) id:string,@Body() body:unknown,
    @Actor() actor:ActorContext) {
    return this.workflow.unpublish(id,workflowVersionInput(body),actor.actorId);
  }

  @Post('admin/editorial/ai-draft')
  @RequireCapability('editorial.write')
  ai(@Body() body:unknown,@Actor() actor:ActorContext) {
    return this.aiDraft.execute({...aiDraftInput(body),actorId:actor.actorId});
  }
}
