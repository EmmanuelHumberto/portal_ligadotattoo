import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { TransactionManager } from '../platform/transaction-manager';
import { CanonicalProposal } from './canonical-proposal.domain';
import { CanonicalRepository } from './canonical.repository';
import type {CanonicalProposalInput} from './admin-knowledge.input';

@Injectable()
export class CreateCanonicalProposalHandler {
  constructor(
    private readonly txm:TransactionManager,
    private readonly repository:CanonicalRepository,
  ) {}

  execute(input:CanonicalProposalInput,actorId:string) {
    return this.txm.run(async tx => {
      const proposal=CanonicalProposal.create({ id:randomUUID(),...input });
      await this.repository.createProposal(proposal,actorId,tx);
      return proposal;
    });
  }
}
