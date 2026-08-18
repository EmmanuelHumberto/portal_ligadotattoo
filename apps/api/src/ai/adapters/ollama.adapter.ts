import {Injectable} from '@nestjs/common';
import {AIProviderAdapter,ProviderRequest} from '../provider.types';

type OllamaChatResponse={
  message?:{content?:string};
  prompt_eval_count?:number;
  eval_count?:number;
};

@Injectable()
export class OllamaAdapter implements AIProviderAdapter {
  readonly key='ollama';

  async execute(r:ProviderRequest,signal:AbortSignal) {
    const response=await fetch(ollamaEndpoint(process.env.OLLAMA_BASE_URL),{
      method:'POST',signal,
      headers:{'content-type':'application/json'},
      body:JSON.stringify({
        model:r.model.providerModelId,
        stream:false,
        think:false,
        keep_alive:process.env.OLLAMA_KEEP_ALIVE?.trim()||'5m',
        format:r.responseFormat==='json'?'json':undefined,
        messages:[
          ...(r.system?[{role:'system',content:r.system}]:[]),
          {role:'user',content:r.prompt},
        ],
        options:{
          temperature:r.temperature??0.1,
          num_predict:r.maxOutputTokens,
          num_ctx:boundedContext(process.env.OLLAMA_CONTEXT_WINDOW),
        },
      }),
    });
    if(!response.ok)throw new Error(`Ollama HTTP ${response.status}`);
    const body=await response.json() as OllamaChatResponse;
    return {
      text:body.message?.content??'',
      inputTokens:body.prompt_eval_count,
      outputTokens:body.eval_count,
    };
  }
}

function ollamaEndpoint(value:string|undefined) {
  const base=value?.trim()||'http://127.0.0.1:11434';
  let url:URL;
  try {url=new URL(base);} catch {throw new Error('Invalid OLLAMA_BASE_URL');}
  if(!['http:','https:'].includes(url.protocol)||url.username||url.password||
      url.search||url.hash)
    throw new Error('Invalid OLLAMA_BASE_URL');
  return `${url.toString().replace(/\/$/,'')}/api/chat`;
}

function boundedContext(value:string|undefined) {
  const context=Number(value??4096);
  if(!Number.isInteger(context)||context<512||context>32768)
    throw new Error('Invalid OLLAMA_CONTEXT_WINDOW');
  return context;
}
