import {Inject,Injectable} from '@nestjs/common';
import {randomUUID} from 'node:crypto';
import {AI_PROVIDER_HUB,AIProviderHubPort} from '../ai/provider-hub.port';
import {PostgresAuditRepository} from '../platform/audit.repository';
import {TransactionManager} from '../platform/transaction-manager';
import {CatalogTranslationRepository} from './catalog-translation.repository';

@Injectable()
export class TranslateCatalogDescriptionHandler {
  constructor(
    @Inject(AI_PROVIDER_HUB) private readonly ai:AIProviderHubPort,
    private readonly repository:CatalogTranslationRepository,
    private readonly txm:TransactionManager,
    private readonly audit:PostgresAuditRepository,
  ) {}

  async execute(sourceProposalId:string,actorId:string) {
    const source=await this.repository.sourceProposal(sourceProposalId);
    if(!source)throw new Error('Pending catalog description proposal not found');
    const correlationId=randomUUID();
    const result=await this.ai.execute<unknown>({
      workload:'catalog.translate',correlationId,
      input:{
        sourceText:String(source.proposed_value),
        instructions:[
          'Translate to Brazilian Portuguese without adding facts.',
          'Preserve technical terms, measurements, model names and trademarks.',
          'Return only JSON in the form {"translation": "..."}.',
        ],
      },
    });
    const translation=translationText(result.output);
    if(!translation)throw new Error('AI returned an empty catalog translation');

    return this.txm.run(async tx=>{
      const proposal=await this.repository.createTranslatedProposal({
        sourceProposalId,subjectId:source.subject_id,translation,
        evidenceIds:source.evidence_ids,sourceUrl:source.source_url,
        modelKey:result.modelKey,
      },tx);
      if(proposal.created){
        await this.audit.append({
          actorId,action:'catalog.translation_proposed',
          subjectType:'CanonicalProposal',subjectId:proposal.id,
          metadata:{sourceProposalId,providerKey:result.providerKey,
            modelKey:result.modelKey,correlationId},
        },tx);
      }
      return {proposalId:proposal.id,created:proposal.created,correlationId};
    });
  }
}

function translationText(output:unknown) {
  if(typeof output==='string')return output.trim();
  if(!output||typeof output!=='object')return '';
  const value=(output as Record<string,unknown>).translation;
  return typeof value==='string'?value.trim():'';
}
