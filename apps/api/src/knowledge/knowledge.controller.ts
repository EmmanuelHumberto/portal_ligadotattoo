import {
  Body,Controller,Get,NotFoundException,Param,ParseUUIDPipe,Post,Query,
} from '@nestjs/common';
import { Actor } from '../iam/actor.decorator';
import type {ActorContext} from '../iam/actor-context';
import { RequireCapability } from '../iam/require-capability.decorator';
import { RecordClaimHandler } from './record-claim.handler';
import { CreateCanonicalProposalHandler } from './create-proposal.handler';
import { DecideCanonicalProposalHandler } from './decide-proposal.handler';
import { KnowledgeQuery } from './knowledge.query';
import {
  canonicalDecisionInput,canonicalProposalInput,claimInput,
} from './admin-knowledge.input';

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

  @Get('claims/:id')
  @RequireCapability('claim.read')
  async claimDetail(@Param('id',ParseUUIDPipe) id:string) {
    const result=await this.query.claimById(id);
    if (!result) throw new NotFoundException('Claim not found');
    return result;
  }

  @Post('claims')
  @RequireCapability('claim.write')
  async claim(@Body() body:unknown,@Actor() actor:ActorContext) {
    const result=await this.recordClaim.execute(claimInput(body),actor.actorId);
    return {...result.claim,conflict:result.conflict};
  }

  @Get('canonical-proposals')
  @RequireCapability('canonical.propose')
  proposals(@Query('status') status='PENDING') {
    return this.query.proposals(status);
  }

  @Get('canonical-proposals/:id')
  @RequireCapability('canonical.propose')
  async proposal(@Param('id',ParseUUIDPipe) id:string) {
    const result=await this.query.proposal(id);
    if (!result) throw new NotFoundException('Proposal not found');
    return result;
  }

  @Post('canonical-proposals')
  @RequireCapability('canonical.propose')
  create(@Body() body:unknown,@Actor() actor:ActorContext) {
    return this.createProposal.execute(canonicalProposalInput(body),actor.actorId);
  }

  @Post('canonical-proposals/:id/decision')
  @RequireCapability('canonical.decide')
  decide(@Param('id',ParseUUIDPipe) id:string,@Body() body:unknown,
    @Actor() actor:ActorContext) {
    return this.decideProposal.execute(
      {proposalId:id,...canonicalDecisionInput(body)},actor.actorId,
    );
  }
}
