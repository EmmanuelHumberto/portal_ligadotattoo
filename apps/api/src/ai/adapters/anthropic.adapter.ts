import { Inject, Injectable } from '@nestjs/common';
import { SECRET_RESOLVER,SecretResolver } from '../secret-resolver';
import { AIProviderAdapter,ProviderRequest } from '../provider.types';

@Injectable()
export class AnthropicAdapter implements AIProviderAdapter {
  readonly key='anthropic';
  constructor(@Inject(SECRET_RESOLVER) private readonly secrets:SecretResolver){}

  async execute(r:ProviderRequest,signal:AbortSignal) {
    const key=await this.secrets.get('ANTHROPIC_API_KEY');
    const response=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',signal,
      headers:{
        'x-api-key':key,'anthropic-version':'2023-06-01',
        'content-type':'application/json',
      },
      body:JSON.stringify({
        model:r.model.providerModelId,
        system:r.system,
        messages:[{role:'user',content:r.prompt}],
        max_tokens:r.maxOutputTokens ?? 2048,
        temperature:r.temperature,
      }),
    });
    if (!response.ok) throw new Error(`Anthropic HTTP ${response.status}`);
    const body:any=await response.json();
    return {
      text:(body.content ?? []).map((x:any)=>x.text ?? '').join(''),
      inputTokens:body.usage?.input_tokens,
      outputTokens:body.usage?.output_tokens,
      providerRequestId:response.headers.get('request-id') ?? undefined,
    };
  }
}
