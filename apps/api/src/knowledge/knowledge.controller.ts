import {
  Body,Controller,Get,NotFoundException,Param,Post,Query,
} from '@nestjs/common';
import { Actor } from '../iam/actor.decorator';
import { RequireCapability } from '../iam/require-capability.decorator';
import { RecordClaimHandler } from './record-claim.handler';
import { CreateCanonicalProposalHandler } from './create-proposal.handler';
import { DecideCanonicalProposalHandler } from './decide-proposal.handler';
import { KnowledgeQuery } from './knowledge.query';

@Controller('admin')
export class KnowledgeController {
  constructor(
    private readonly recordClaim:RecordClaimHandler,
    private readonly createProposal:CreateCanonicalProposalHandler,
    private readonly decideProposal:DecideCanonicalProposalHandler,
    private readonly query:KnowledgeQuery,
  ) {}

  @Get('claims')
  @RequireCapability('claim.read')
  claims(@Query('status') status?:string,@Query('subjectId') subjectId?:string) {
    return this.query.claims({status,subjectId});
  }

  @Post('claims')
  @RequireCapability('claim.write')
  async claim(@Body() body:any,@Actor() actor:any) {
    const result=await this.recordClaim.execute(body,actor.actorId);
    return {...result.claim,conflict:result.conflict};
  }

  @Get('canonical-proposals')
  @RequireCapability('canonical.propose')
  proposals(@Query('status') status='PENDING') {
    return this.query.proposals(status);
  }

  @Get('canonical-proposals/:id')
  @RequireCapability('canonical.propose')
  async proposal(@Param('id') id:string) {
    const result=await this.query.proposal(id);
    if (!result) throw new NotFoundException('Proposal not found');
    return result;
  }

  @Post('canonical-proposals')
  @RequireCapability('canonical.propose')
  create(@Body() body:any,@Actor() actor:any) {
    return this.createProposal.execute(body,actor.actorId);
  }

  @Post('canonical-proposals/:id/decision')
  @RequireCapability('canonical.decide')
  decide(@Param('id') id:string,@Body() body:any,@Actor() actor:any) {
    return this.decideProposal.execute(
      {proposalId:id,...body},actor.actorId,
    );
  }
}
