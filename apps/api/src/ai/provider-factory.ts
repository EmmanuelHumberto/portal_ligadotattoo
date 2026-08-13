import {HttpAiProvider} from './http-provider.adapter';
import {AiProviderRegistry} from './provider-registry';
import type {RuntimeConfig} from '../platform/runtime-config';

export function buildProviderRegistry(cfg:RuntimeConfig){
 const r=new AiProviderRegistry();
 if(cfg.ai.openaiKey)r.register(new HttpAiProvider({
  key:'openai',apiKey:cfg.ai.openaiKey,
  baseUrl:'https://api.openai.com/v1/chat/completions',defaultModel:'gpt-4.1-mini',
  body:(x,m)=>({model:m,messages:[{role:'user',content:x.prompt}]}),
  parse:j=>j?.choices?.[0]?.message?.content??''
 }));
 if(cfg.ai.anthropicKey)r.register(new HttpAiProvider({
  key:'anthropic',apiKey:cfg.ai.anthropicKey,
  baseUrl:'https://api.anthropic.com/v1/messages',defaultModel:'claude-sonnet-4-20250514',
  headers:k=>({'x-api-key':k,'anthropic-version':'2023-06-01'}),
  body:(x,m)=>({model:m,max_tokens:2048,messages:[{role:'user',content:x.prompt}]}),
  parse:j=>j?.content?.map((x:any)=>x?.text??'').join('')??''
 }));
 if(cfg.ai.deepseekKey)r.register(new HttpAiProvider({
  key:'deepseek',apiKey:cfg.ai.deepseekKey,
  baseUrl:'https://api.deepseek.com/chat/completions',defaultModel:'deepseek-chat',
  body:(x,m)=>({model:m,messages:[{role:'user',content:x.prompt}]}),
  parse:j=>j?.choices?.[0]?.message?.content??''
 }));
 return r;
}
