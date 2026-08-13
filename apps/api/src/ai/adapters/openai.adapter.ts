import { Inject, Injectable } from '@nestjs/common';
import { SECRET_RESOLVER,SecretResolver } from '../secret-resolver';
import { AIProviderAdapter,ProviderRequest } from '../provider.types';

@Injectable()
export class OpenAIAdapter implements AIProviderAdapter {
  readonly key='openai';
  constructor(@Inject(SECRET_RESOLVER) private readonly secrets:SecretResolver){}

  async execute(r:ProviderRequest,signal:AbortSignal) {
    const key=await this.secrets.get('OPENAI_API_KEY');
    const response=await fetch('https://api.openai.com/v1/responses',{
      method:'POST',signal,
      headers:{authorization:`Bearer ${key}`,'content-type':'application/json'},
      body:JSON.stringify({
        model:r.model.providerModelId,
        instructions:r.system,
        input:r.prompt,
        max_output_tokens:r.maxOutputTokens,
        text:r.responseFormat==='json'
          ? {format:{type:'json_object'}}
          : undefined,
      }),
    });
    if (!response.ok) throw new Error(`OpenAI HTTP ${response.status}`);
    const body:any=await response.json();
    const text=body.output_text ??
      body.output?.flatMap((x:any)=>x.content ?? [])
        .map((x:any)=>x.text ?? '').join('') ?? '';
    return {
      text,
      inputTokens:body.usage?.input_tokens,
      outputTokens:body.usage?.output_tokens,
      providerRequestId:response.headers.get('x-request-id') ?? undefined,
    };
  }
}
