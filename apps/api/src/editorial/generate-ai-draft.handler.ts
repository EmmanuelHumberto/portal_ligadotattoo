import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  AI_PROVIDER_HUB, AIProviderHubPort,
} from '../ai/provider-hub.port';
import { TransactionManager } from '../platform/transaction-manager';
import { PostgresAuditRepository } from '../platform/audit.repository';
import { CreateEditorialHandler } from './create-editorial.handler';
import { StoryCandidateQuery } from './story-candidate.query';
import type { EditorialDocument, EditorialType } from './editorial.types';

@Injectable()
export class GenerateAIDraftHandler {
  constructor(
    @Inject(AI_PROVIDER_HUB) private readonly ai:AIProviderHubPort,
    private readonly txm:TransactionManager,
    private readonly audit:PostgresAuditRepository,
    private readonly createEditorial:CreateEditorialHandler,
    private readonly candidates:StoryCandidateQuery,
  ) {}

  async execute(input:{
    candidateId?:string; sourceText?:string; sourceUrl?:string;
    requestedType?:string; actorId:string;
  }) {
    let title='';
    let sourceUrl=input.sourceUrl ?? '';
    let sourceText=input.sourceText ?? '';

    let candidate:any=null;
    if (input.candidateId) {
      candidate=await this.candidates.candidateSource(input.candidateId);
      if (!candidate) throw new Error('Story candidate not found');
      title=String(candidate.title ?? '');
      sourceUrl=String(candidate.source_url ?? '');
      sourceText=sourceText || String(candidate.text_content ?? '');
    }
    if (!sourceText) throw new Error('Source text is required for AI draft');
    if (sourceText.length>20_000)
      sourceText=sourceText.slice(0,20_000)+'\n\n[source truncated for length]';

    const correlationId=randomUUID();
    const result=await this.ai.execute<any>({
      workload:'editorial.draft',
      correlationId,
      input:{
        sourceText,
        sourceUrl,
        requestedType:input.requestedType,
        instructions:[
          'Write the entire article in Brazilian Portuguese (pt-BR).',
          'The source text is the full content of the post. Reproduce it faithfully: do NOT rewrite, paraphrase, expand, or add any facts, examples, mechanisms, components, or details that are not in the source.',
          'Your only job is to structure the source: generate a title, subtitle, and summary from it, and split the source text into logical paragraphs/blocks, keeping the original wording verbatim.',
          'Do not invent technical specifications, mechanisms, or construction details.',
          'Preserve source attribution.',
          'Return ONLY a JSON object with this exact schema: {"title": string, "subtitle": string|null, "summary": string, "body": {"version": 1, "blocks": [{"type": "heading"|"paragraph"|"quote"|"callout", "text": string, "level"?: number, "attribution"?: string}]}}. The body blocks must contain the source text verbatim, only split into paragraphs.',
        ],
      },
    });

    const draft=normalizeDraft(result.output, title || sourceUrl, input.requestedType ?? candidate?.detected_type);
    if (candidate?.image_media_id) {
      draft.body.blocks=[
        {type:'image' as const, mediaId:String(candidate.image_media_id)},
        ...draft.body.blocks,
      ];
    }

    const content=await this.createEditorial.execute({
      contentType:draft.contentType,
      title:draft.title,
      slug:draft.slug,
      subtitle:draft.subtitle,
      summary:draft.summary,
      body:draft.body,
      origin:'AI_ASSISTED',
    }, input.actorId);

    await this.txm.run(async tx => {
      await tx.query(
        `insert into ai.execution
         (id,workload_key,provider_key,model_key,status,latency_ms,
          correlation_id,created_at)
         values (gen_random_uuid(),'editorial.draft',$1,$2,'SUCCEEDED',$3,$4,now())`,
        [result.providerKey,result.modelKey,result.latencyMs,correlationId],
      );
      await this.audit.append({
        actorId:input.actorId,action:'editorial.ai_draft_generated',
        subjectType:'StoryCandidate',subjectId:input.candidateId ?? content.id,
        metadata:{
          providerKey:result.providerKey,modelKey:result.modelKey,correlationId,
        },
      },tx);
      if (input.candidateId) {
        await tx.query(
          `update editorial.story_candidate set status='DRAFTED' where id=$1`,
          [input.candidateId],
        );
      }
      if (sourceUrl) {
        await tx.query(
          `insert into editorial.content_source
           (content_id,source_id,source_snapshot_id,source_url)
           values ($1,$2,$3,$4)
           on conflict (content_id,source_url) do nothing`,
          [content.id, candidate?.source_id ?? null,
           candidate?.source_snapshot_id ?? null, sourceUrl],
        );
      }
    });

    return {
      contentId:content.id,
      content,
      provenance:{
        providerKey:result.providerKey,modelKey:result.modelKey,correlationId,
      },
    };
  }
}

function normalizeDraft(output:unknown,fallbackTitle:string,requestedType?:string){
  const obj=(output && typeof output==='object') ? output as Record<string,any> : null;
  const title=String(
    obj?.title?.trim() ||
    obj?.draftTitle?.trim() ||
    fallbackTitle?.trim() ||
    'Rascunho gerado por IA',
  );
  const rawBody=obj?.body;
  let blocks:any[]=[];
  if(Array.isArray(rawBody?.blocks))blocks=rawBody.blocks.flatMap(blockToBlocks);
  else if(Array.isArray(obj?.blocks))blocks=obj.blocks.flatMap(blockToBlocks);
  else if(Array.isArray(obj?.editorialBlocks))blocks=obj.editorialBlocks.flatMap(blockToBlocks);
  const textOut=typeof output==='string' ? output : null;
  return {
    contentType:normalizeType(requestedType),
    title,
    slug:slugify(title),
    subtitle:obj?.subtitle?.trim() || undefined,
    summary:obj?.summary?.trim() || obj?.sourceAttribution?.trim()
      || (textOut ? textOut.slice(0,240) : undefined),
    body:{
      version:1 as const,
      blocks: blocks.length ? blocks
        : [{type:'paragraph' as const,text:textOut ?? JSON.stringify(output ?? {})}],
    } as EditorialDocument,
  };
}

function blockToBlocks(b:any):any[]{
  if(!b || typeof b!=='object')return [];
  // Formato canônico: {type, text} (ou {type, content})
  if(typeof b.type==='string' && (b.text!==undefined || b.content!==undefined)){
    const out:any={type:b.type,text:String(b.text ?? b.content ?? '')};
    if(b.level)out.level=Number(b.level);
    if(b.attribution)out.attribution=String(b.attribution);
    return [out];
  }
  // Formato editorialBlocks: {blockType, heading, content, quotes}
  if(typeof b.blockType==='string'){
    const out:any[]=[];
    if(b.heading)out.push({type:'heading',level:2,text:String(b.heading)});
    if(b.content)out.push({type:'paragraph',text:String(b.content)});
    if(Array.isArray(b.quotes)){
      for(const q of b.quotes){
        if(q && typeof q==='object')
          out.push({type:'quote',text:String((q as any).text ?? ''),
            attribution:(q as any).author?String((q as any).author):undefined});
      }
    }
    if(!out.length && b.text)out.push({type:'paragraph',text:String(b.text)});
    return out;
  }
  return [];
}

function normalizeType(requestedType?:string):EditorialType{
  const map:Record<string,EditorialType>={
    NEWS:'NEWS',BLOG:'BLOG',EVENT:'EVENT',
    TECHNICAL_ARTICLE:'TECHNICAL_ARTICLE',NOTICE:'NOTICE',
  };
  return map[String(requestedType ?? '').toUpperCase()] ?? 'NEWS';
}

function slugify(value:string){
  return value.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-')
    .replace(/^-+|-+$/g,'') || 'ai-draft';
}
