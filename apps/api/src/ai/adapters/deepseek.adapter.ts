import { Inject, Injectable } from '@nestjs/common';
import { SECRET_RESOLVER,SecretResolver } from '../secret-resolver';
import { AIProviderAdapter,ProviderRequest } from '../provider.types';

@Injectable()
export class DeepSeekAdapter implements AIProviderAdapter {
  readonly key='deepseek';
  constructor(@Inject(SECRET_RESOLVER) private readonly secrets:SecretResolver){}

  async execute(r:ProviderRequest,signal:AbortSignal) {
    const key=await this.secrets.get('DEEPSEEK_API_KEY');
    const messages:any[]=[];
    if (r.system) messages.push({role:'system',content:r.system});
    messages.push({role:'user',content:r.prompt});
    const response=await fetch('https://api.deepseek.com/chat/completions',{
      method:'POST',signal,
      headers:{authorization:`Bearer ${key}`,'content-type':'application/json'},
      body:JSON.stringify({
        model:r.model.providerModelId,messages,
        temperature:r.temperature,
        max_tokens:r.maxOutputTokens,
        reasoning_effort:'low',
        response_format:r.responseFormat==='json'
          ? {type:'json_object'}:undefined,
      }),
    });
    if (!response.ok) throw new Error(`DeepSeek HTTP ${response.status}`);
    const body:any=await response.json();
    return {
      text:body.choices?.[0]?.message?.content ?? '',
      inputTokens:body.usage?.prompt_tokens,
      outputTokens:body.usage?.completion_tokens,
      providerRequestId:response.headers.get('x-request-id') ?? undefined,
    };
  }
}
