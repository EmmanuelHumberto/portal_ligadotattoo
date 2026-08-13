import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  AI_PROVIDER_HUB, AIProviderHubPort,
} from '../ai/provider-hub.port';
import { TransactionManager } from '../platform/transaction-manager';
import { PostgresAuditRepository } from '../platform/audit.repository';

@Injectable()
export class GenerateAIDraftHandler {
  constructor(
    @Inject(AI_PROVIDER_HUB) private readonly ai:AIProviderHubPort,
    private readonly txm:TransactionManager,
    private readonly audit:PostgresAuditRepository,
  ) {}

  async execute(input:{
    candidateId:string;sourceText:string;sourceUrl:string;
    requestedType?:string;
  },actorId:string) {
    const correlationId=randomUUID();
    const result=await this.ai.execute<any>({
      workload:'editorial.draft',
      correlationId,
      input:{
        sourceText:input.sourceText,
        sourceUrl:input.sourceUrl,
        requestedType:input.requestedType,
        instructions:[
          'Do not invent technical specifications.',
          'Preserve source attribution.',
          'Mark uncertainty in draft text.',
          'Return structured editorial blocks.',
        ],
      },
    });

    await this.txm.run(async tx => {
      await tx.query(
        `insert into ai.execution
         (id,workload_key,provider_key,model_key,status,latency_ms,
          correlation_id,created_at)
         values (gen_random_uuid(),'editorial.draft',$1,$2,'SUCCEEDED',$3,$4,now())`,
        [result.providerKey,result.modelKey,result.latencyMs,correlationId],
      );
      await this.audit.append({
        actorId,action:'editorial.ai_draft_generated',
        subjectType:'StoryCandidate',subjectId:input.candidateId,
        metadata:{
          providerKey:result.providerKey,modelKey:result.modelKey,
          correlationId,
        },
      },tx);
    });

    return {
      suggestion:result.output,
      provenance:{
        providerKey:result.providerKey,modelKey:result.modelKey,
        correlationId,
      },
    };
  }
}
