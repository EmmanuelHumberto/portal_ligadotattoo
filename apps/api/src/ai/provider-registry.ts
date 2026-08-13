import type {AiProvider} from './ai-provider.port';

export class AiProviderRegistry{
 private readonly providers=new Map<string,AiProvider>();
 register(provider:AiProvider){this.providers.set(provider.key,provider);return this;}
 get(key:string){
  const p=this.providers.get(key);if(!p)throw new Error(`AI_PROVIDER_NOT_CONFIGURED:${key}`);return p;
 }
 has(key:string){return this.providers.has(key);}
 keys(){return [...this.providers.keys()];}
}
